/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// SOCKET
if( !window.FriendWebSocket )
{
	class FriendWebSocket
	{
		constructor( conf, name = false )
		{
			if( !conf ) return;
			if ( !( this instanceof FriendWebSocket ))
				return new FriendWebSocket( conf );
			
			let self = this;
			self.name = name;
			
			/*let uniqueWords = [ 'Ball', 'Jacket', 'Fish', 'Origon', 'Nelson', 'Blue', 'Red', 'Slash' ];
			let ustr = '';
			for( let a = 0; a < 4; a++ )
			{
				ustr += uniqueWords[ Math.floor( Math.random() * uniqueWords.length ) ];
			}
			self.uniqueName = ustr;*/
			
			// REQUIRED CONFIG
			self.pConf = conf;
			self.url = conf.url;
			self.sessionId = conf.sessionId;
			self.authId = conf.authId;
			self.onmessage = conf.onmessage;
			self.onstate = conf.onstate;
			self.onend = conf.onend;
			
			// PROPERTIES USEFUL TO PUBLIC
			self.ready = false;
			
			// INTERNAL
			self.ws = null;
			self.sendQueue = [];
			self.pingPong = false; // is false on init, 'pong' on startup, and 'ping' until next 'pong'.
			self.pingTimeout = 15; // Seconds
			self.pongTimeout = 6; // Time for server to respond
			
			/*
				length / size check: if str.length is above maxStrLength, its turned into a blob and rechecked.
				If the blob byte size is above maxFCBytes, the event is chunked before sending.
			*/
			self.maxFCBytes = 0xffff; // FriendCore ws packet max bytes - set to 65535 because of unknown problem!
			//self.maxFCBytes = 8192;
			self.metaReserve = 512;
			self.maxStrLength = ( Math.floor( self.maxFCBytes / 4 )) - self.metaReserve;
				// worst case scenario its all 4 byte unicode
			self.chunkDataLength = self.maxFCBytes - self.metaReserve;
				// need some room for meta data aswell.

			self.connectingRetries = 0;
			
			self.chunks = {};
			self.allowReconnect = true;
			self.reconnectDelay = 200; // ms
			self.reconnectMaxDelay = 1000 * 30; // 30 sec max delay between reconnect attempts
			self.reconnectAttempt = 0; // delay is multiplied with attempts to find how long the next delay is
			self.reconnectMaxAttempts = 3; // 0 to keep hammering
			self.reconnectScale = {
				min: 5,
				max: 8
			}; // random in range, makes sure not all the sockets
			   // in the world reconnect at the same time
			
			self.init();
		}

	// PUBLIC INTERFACE
		send( msgObj )
		{
			return this.sendOnSocket( {
				type: 'msg',
				data: msgObj
			} );
		}

		reconnect()
		{
			let self = this;
			if( this.reconnecting ) return;
			this.reconnecting = true;
			
			if( window.Workspace && !window.Workspace.sessionId )
			{
				console.log( 'Not reconnecting websocket due to no sessionId.' );
				this.reconnecting = false;
				return;
			}
			
			self.ready = false;
			self.allowReconnect = true;
			
			// We're pre reconnect - wait..
			if( window.Friend && Friend.User && Friend.User.State != 'online' )
			{
				console.log( 'Cannot reconnect - Friend User is not online. Closing instead.' );
				self.close();
				if( Friend.User.State == 'offline' )
				{
					this.reconnecting = false;
					return;
				}
			}
			
			self.doReconnect();
		}

	// code and reason can be whatever, the socket is closed anyway.
	// whats the server going to do? cry more lol
		close( code, reason )
		{
			let self = this;
			
			self.ready = false;
			self.allowReconnect = false;
			self.url = null;
			self.sessionId = null;
			self.authId = null;
			self.onmessage = null;
			// Tell we are closing
			if( self.onstate )
				self.onstate( { type: 'close' }, true );
			self.onstate = null;
			self.onend = null;
			self.wsClose( code, reason );
		}

	// PRIVATES

		init()
		{
			let self = this;
			
			if ( !self.onmessage || !self.onstate || !self.onend )
			{
				console.log( 'FriendWebSocket - missing handlers', {
					onmessage : self.onmessage,
					onstate : self.onstate,
					onend : self.onend,
				});
				throw new Error( 'FriendWebSocket - missing handlers' );
			}
			
			self.sysMsgMap = {
				//'authsocket' : authenticate,
				'session' : session,
				'chunk'   : chunk,
				'pong'    : pong
			};
			
			//function authenticate( e ) { self.handleAuth( e ); }
			function session( e ) { self.handleSession( e ); }
			function chunk( e ) { self.handleChunk( e ); }
			function pong( e ) { self.handlePong( e ); }
			
			self.connect();
		}

		// About ping and pong
		// When starting a websocket, Workspace initializes a ws session. It will 
		// receive 'pong' back. It will then schedule a ping back in X seconds. This
		// will be postponed on each message coming in. This way any message outside
		// of pong coming in will act as a pong / proof of life.
		// TODO: Error checking if we get unidirectional connection (who knows)
		// Incoming pong
		handlePong( timeSent )
		{
			let self = this;
			
			if( self.pongTimeo ) clearTimeout( self.pongTimeo );
			//console.log( '[FriendWebSocket] Got pong.' );
			
			if( self.pingPong == false || self.pingPong == 'ping' )
			{
				//console.log( '[FriendWebSocket] Pong -> going to ping.' );
				
				self.setReady();
				
				if( Friend.User )
				{
					// Reinit user! (sets => server is there)
					Friend.User.Init();
				}
				
				// Send ping back
				self.handlePing();
			}
			else
			{
				//console.log( '[FriendWebSocket] Got pong, but in weird mode: ' + self.pingPong );
			}
		}
		// Send ping
		handlePing()
		{
			let self = this;
			
			// We are now in ping mode!
			self.pingPong = 'ping';
			//console.log( '[FriendWebSocket] We are in ping mode.' );
			
			// Clear previous timeouts
			if( self.pingTimeo )
				clearTimeout( self.pingTimeo );
			if( self.pongTimeo )
				clearTimeout( self.pongTimeo );
				
			self.pingTimeo = setTimeout( function()
			{
				if( self.ws && self.ready )
				{
					//console.log( '[FriendWebSocket] Sending ping.' );
					self.pingPong = 'ping';
					self.sendCon( { type: 'ping', data: null } );
					if( self.pongTimeo ) clearTimeout( self.pongTimeo );
					self.pongTimeo = setTimeout( function()
					{
						self.wsClose();
						if( window.Workspace && Workspace.conn && self == Workspace.conn.ws )
						{
							//console.log( '[FriendWebSocket] Reinitializing web socket. (1)' );
							Workspace.initWebSocket();
						}
					}, self.pongTimeout * 1000 );
					
				}
				else
				{
					self.wsClose();
					if( window.Workspace && Workspace.conn && self == Workspace.conn.ws )
					{
						//console.log( '[FriendWebSocket] Reinitializing web socket. (2)' );
						Workspace.initWebSocket();
					}
				}
			}, self.pingTimeout * 1000 );
		}

		connect()
		{
			let self = this;
			
			//console.log( 'Connecting!' );
			
			// Reset
			self.ready = false;
			
			if( window.Friend && Friend.User && Friend.User.State == 'offline' )
			{
				console.log( 'Friend says the user is offline. Bye.' );
				return;
			}
			
			if ( !self.url || !self.url.length )
			{
				if( self.pConf )
				{
					//console.log( 'We have a previous config. Trying the url there.', self.pConf.url );
					self.url = self.pConf.url;
					return self.connect();
				}
				throw new Error( 'no url provided for socket' );
			}
			
			if( self.state && self.state.type )
			{
				if( self.state.type == 'open' ) 
				{
					//console.log( 'We are already open.' );
					return;
				}
				
				if( self.state.type == 'connecting' ) 
				{
					//console.log('ongoing connect. we will wait for this to finish.');
					return;
				}
			}
				
			self.setState( 'connecting' );
			
			// We already have, reconnect
			if( self.ws )
			{
				let ws = self.ws;
				self.ws = null;
				if( ws && ws.cleanup )
					ws.cleanup();
			}
				
			// Validate that we can connect at all..
			let m = new Library( 'system' );
			m.onExecuted = function( ret, red )
			{
				if( ret == 'ok' )
				{
					self.ws = new window.WebSocket( self.url, 'FC-protocol' );
				
					// Keep track
					if( !window.websockets )
						window.websockets = [];
					window.websockets.push( self.ws );
					
					self.attachHandlers();
				}
			}
			m.execute( 'validate' );
		}

		attachHandlers()
		{
			let self = this;
			
			if ( !self.ws )
			{
				console.log( 'Socket.attachHandlers - no ws', self.ws );
				return false;
			}
			
			self.ws.onopen = onOpen;
			self.ws.onclose = onClose;
			self.ws.onerror = onError;
			self.ws.onmessage = onMessage;
			self.ws.onping = function( e )
			{
				console.log( '[coreSocket] Received ping..', e );
			}
			
			function onOpen( e ){ if( self.ws == this ) self.handleOpen( e ); }
			function onClose( e )
			{ 
				if( self.ws == this )
				{
					self.handleClose( e );
					console.log( 'Handling closing of websocket.' );
				}
				else
				{
					console.log( 'Could not handle close. Panic.' );
				}
			}
			function onError( e ){ if( self.ws == this ) self.handleError( e ); }
			function onMessage( e ){ if( self.ws == this ) self.handleSocketMessage( e ); }
		}

		clearHandlers()
		{
			let self = this;
			
			if ( !self.ws )
				return;
			
			self.ws.onopen = null;
			self.ws.onclose = null;
			self.ws.onerror = null;
			self.ws.onmessage = null;
			if( self.reconnectTimer )
			{
				clearTimeout( self.reconnectTimer )
				self.reconnectTimer = null;
			}
		}

		doReconnect()
		{
			let self = this;
			
			if( !reconnectAllowed() ) 
			{
				if ( self.onend )
					self.onend();
				this.reconnecting = false;
				return false;
			}
			
			if ( self.reconnectTimer )
			{
				return true;
			}
			
			let delay = calcDelay();
			
			if ( delay > self.reconnectMaxDelay )
				delay = self.reconnectMaxDelay;
			
			//console.log( 'prepare reconnect - delay( s )', ( delay / 1000 ));
			let showReconnectLogTimeLimit = 5000; // 5 seconds
			if ( delay > showReconnectLogTimeLimit )
				self.setState( 'reconnect', delay );
			
			self.reconnectTimer = window.setTimeout( reconnect, delay );
			
			function reconnect()
			{
				self.reconnecting = false;
				self.reconnectTimer = null;
				self.reconnectAttempt += 1;
				self.connect();
			}
			
			function reconnectAllowed()
			{
				// We're pre reconnect - wait..
				if( window.Friend && Friend.User && Friend.User.State != 'online' )
				{
					return false;
				}
				
				let checks = {
					allow        : self.allowReconnect,
					hasTriesLeft : !tooManyTries(),
					hasSession   : !!self.sessionId,
				};
				
				let allow = !!( true
					&& checks.allow
					&& checks.hasTriesLeft
					&& checks.hasSession
				);
				
				if ( !allow )
				{
					// console.log( 'not allowed to reconnect', checks )
					// Try to do a module call
					return false;
				}
				return true;
				
				function tooManyTries()
				{
					if ( !self.reconnectMaxAttempts )
						return false;
					
					if ( self.reconnectAttempt >= self.reconnectMaxAttempts )
						return true;
					
					return false;
				}
			}
			
			function calcDelay()
			{
				let delay = self.reconnectDelay;
				let multiplier = calcMultiplier();
				let tries = self.reconnectAttempt || 1;
				return delay * multiplier * tries;
			}
			
			function calcMultiplier()
			{
				let min = self.reconnectScale.min;
				let max = self.reconnectScale.max;
				let gap = max - min;
				let scale = Math.random();
				let point = gap * scale;
				let multiplier = min + point;
				return multiplier;
			}
			
			return true;
		}

		setState( type, data )
		{
			this.state =  {
				type: type,
				data: data,
			};
			if( this.onstate ) this.onstate( this.state );
		}

		handleOpen( e )
		{
			this.reconnectAttempt = 0;
			
			// We are open
			this.setState( 'open' );
			this.setSession();
		}

		handleClose( e )
		{
			console.log( 'Handling close.', e );
			this.cleanup();
			this.setState( 'close' );
		}

	// Handles error with reconnect
		handleError( e )
		{
			console.log( 'Handling error.' );
			this.cleanup();
			this.setState( 'error' );
		}

		handleSocketMessage( e )
		{	
			let self = this;
			
			// TODO: Debug why some data isn't encapsulated
			// console.log( e.data );
			let msg = friendUP.tool.objectify( e.data );
			if( !msg )
			{
				console.log( 'FriendWebSocket.handleSocketMessage - invalid data, could not parse JSON',
					e.data );
				return;
			}
			//console.log( msg );
			// Handle server notices with session timeout / death
			if( msg.data && msg.data.type == 'server-notice' )
			{
				
				if( msg.data.data == 'session killed' )
				{
					Notify( { title: i18n( 'i18n_session_killed' ), text: i18n( 'i18n_session_killed_desc' ) } );
					//console.log( 'Test3: Session was killed!' );
					self.wsClose();
					
					setTimeout( function()
					{
						console.log( 'SESSION KILLED' );
						Workspace.logout();
					}, 500 );
					return;
				}
				else if( msg.data.data == 'session timeout' )
				{
					Notify( { title: i18n( 'i18n_session_expired' ), text: i18n( 'i18n_session_expired_desc' ) } );
					self.wsClose();
					Friend.User.ReLogin();
					return;
				}
			}
			
			this.handleEvent( msg );
		}

		handleEvent( msg )
		{
			let self = this;
			
			// We will now be in ping mode!
			// TODO: See why we cannot handle it here
			// self.handlePing();
			
			if( !msg )
			{
				console.log( 'FriendWebSocket - Could not handle empty message.' );
				return false;
			}
			if( 'con' === msg.type )
			{
				this.handleConnMessage( msg.data );
				return;
			}
			
			if( 'msg' === msg.type )
			{
				this.onmessage( msg.data );
				return;
			}
			
			console.log( 'FriendWebSocket - Unknown message:', msg );
		}

		handleConnMessage( msg )
		{
			let handler = this.sysMsgMap[ msg.type ];
			if ( !handler )
			{
				console.log( 'FriendWebSocket.handleConnMessage - no handler for', msg );
				return;
			}
			handler( msg.data );
		}

		handleSession( sessionId )
		{
			if ( this.sessionId === sessionId )
			{
				this.setReady();
			}
			
			this.sessionId = sessionId;
			if ( !this.sessionId )
			{
				this.allowReconnect = false;
				if ( this.onend )
					this.onend();
			}
		}

		restartSession()
		{
			this.sendOnSocket( {
				type : 'session',
				data : this.sessionId,
			}, true );
		}

		unsetSession()
		{
			this.sessionId = false;
			let msg = {
				type: 'session',
				data: this.sessionId
			};
			this.sendOnSocket( msg );
		}


		setSession()
		{
			let sess = {
				type: 'con',
				data: {
					sessionId: this.sessionId || undefined,
					authId: this.authId || undefined,
				},
			};
			this.sendOnSocket( sess );
		}

		setReady()
		{
			this.ready = true;
			this.executeSendQueue();
		}

		sendCon( msg )
		{
			this.sendOnSocket( {
				type: 'con',
				data: msg,
			} );
		}

		sendOnSocket( msg, force )
		{
			let self = this;

			if( self.state.type == 'connecting' || self.state.type == 'close' || self.state.type == 'error' || self.state.type == 'reconnect' )
			{
				if( self.connectingRetries++ > 2 )
				{
					if( window.Workspace )
					{
						Workspace.initWebSocket();
						//console.log( 'Forcefully reconnecting websocket.' );
						return;
					}
				}
			
				queue( msg );
				console.log( 'Going nowhere because of state is: ' + self.state.type );
				return false;
			}
			
			// Just reset this one
			self.connectingRetries = 0;
			
			if ( !wsReady() )
			{
				//console.log( 'Socket isn\'t ready.' );
				queue( msg );
				self.doReconnect();
				return false;
			}
			
			if( 'con' !== msg.type )
			{
				//console.log( 'FriendWebSocket.sendOnSocket - type con:', msg );
			}
			
			let msgStr = friendUP.tool.stringify( msg );
			if( checkMustChunk( msgStr ))
			{
				return self.chunkSend( msgStr );
			}
			
			const success = self.wsSend( msgStr );
			if( !success )
			{
				//console.log( 'Could not send!' );
				queue( msg );
				self.reconnect();
				return false;
			}
			
			return success;
			
			function queue( msg )
			{
				if ( !self.sendQueue )
					self.sendQueue = [];
				
				self.sendQueue.push( msg );
			}
			
			function wsReady()
			{
				if ( !self.ws )
					return false;
				
				if ( 1 !== self.ws.readyState )
					return false;
				
				return true;
			}
			
			function checkMustChunk( str )
			{
				if( str.length < self.maxStrLength )
				{
					//console.log( 'No need to chunk this one: ' + str.length );
					return false;
				}
				
				//console.log( 'We need to chunk this one! ' + str.length + ' >= ' + self.maxStrLength );
				
				let realString = new String( str );
				let strBlob = new Blob( realString );
				if( strBlob && strBlob.size >= self.maxFCBytes )
				{
					return true;
				}
				else
				{
					return false;
				}
			}
		}

		chunkSend( str )
		{
			let self = this;
			
			let b64str = toBase64( str );
			if ( !b64str )
			{
				console.log( 'could not encode str, aborting', str );
				return;
			}
			
			let parts = chunkData( b64str );
			let chunksId = friendUP.tool.uid( 'chunks' );
			let chunks = parts.map( createChunk );
			let sendTimeout = 50;
			//chunks.forEach( send );
			setTimeout( sendAChunk, sendTimeout );
			function sendAChunk()
			{
				if ( !chunks.length )
					return;
				
				let chunk = chunks.shift();
				send( chunk );
				setTimeout( sendAChunk, sendTimeout );
			}
			
			function send( chunk )
			{
				let event = {
					type : 'con',
					data : {
						type : 'chunk',
						data : chunk,
					},
				};
				self.sendOnSocket( event );
			}
			
			function toBase64( str )
			{
				let encStr = null;
				if ( window.Base64alt )
				{
					try
					{
						encStr = window.Base64alt.encode( str );
					} catch( e )
					{
						console.log( 'tried Base64alt, failed', e );
					}
					
					if ( encStr )
						return encStr;
				}
				
				try
				{
					encStr = window.btoa( str );
				}
				catch( e )
				{
					console.log( 'tried btoa, failed', e );
				}
				
				return encStr;
			}
			
			function chunkData( str )
			{
				let parts = [];
				const numChunks = Math.ceil(str.length / self.chunkDataLength );
				for (let i = 0, o = 0; i < numChunks; ++i, o += self.chunkDataLength ) 
				{
					let d = str.substr(o, self.chunkDataLength);
					parts.push( d );
				}
				/*
				let parts = [];
				for( var i = 0; i * self.chunkDataLength < str.length; i++ )
				{
					let startIndex = self.chunkDataLength * i;
					let part = str.substr( startIndex, self.chunkDataLength );
					parts.push( part );
				}
				*/
				
				return parts;
			}
			
			function createChunk( part, index )
			{
				let chunk = {
					id    : chunksId,
					part  : index,
					total : parts.length,
					data  : part,
				};
				return chunk;
			}
		}

		wsSend( str )
		{
			let self = this;
			
			if( window.Friend && Friend.User && Friend.User.State != 'online' )
			{
				if ( !self.sendQueue )
					self.sendQueue = [];
				self.sendQueue.push( str );
				self.wsClose();
				return;
			}
			
			if( !this.onstate ) 
			{
				return false;
			}
			let res = false;
			try
			{
				res = self.ws.send( str );
			}
			catch( e )
			{
				console.log( 'FriendWebSocket.sendOnSocket failed', {
					e  : e,
					str: str
				} );
				return false;
			}
			
			return true;
		}

		executeSendQueue()
		{
			let self = this;
			self.sendQueue.forEach( send );
			self.sendQueue = [];
			function send( msg )
			{
				self.sendOnSocket( msg );
			}
		}

		handleChunk( chunk )
		{	
			let self = this;
			
			chunk.total = parseInt( chunk.total, 10 );
			chunk.part = parseInt( chunk.part, 10 );
			let cid = chunk.id;
			let chunks = self.chunks[ cid ];
			if ( !chunks )
			{
				chunks = Array( chunk.total );
				chunks.fill( null );
				self.chunks[ cid ] = chunks;
			}
			
			let index = chunk.part;
			chunks[ index ] = chunk.data;
			if ( !hasAll( chunks, chunk.total ))
			{
				// TODO: See why we cannot handle it here
				// self.handlePing();
				return;
			}
			
			let event = rebuild( chunks );
			delete self.chunks[ cid ];
			self.handleEvent( event );
			
			function hasAll( chunks, total ) {
				let anyNull = chunks.some( isNull );
				return !anyNull;z
				function isNull( item ) {
					return null == item;
				}
			}
			
			function rebuild( chunks ) {
				let whole = chunks.join( '' );
				// well, then, try b64 decode
				let notB64 = window.Base64alt ? Base64alt.decode( whole ) : atob( whole );
				let parsed = friendUP.tool.objectify( notB64 );
				return parsed;
			}
		}

		wsClose( code, reason )
		{
			// This means we have no open connections
			_cajax_ws_connections = 0;
			
			let self = this;
			
			if ( !self.ws )
			{
				return self.reconnect();
			}
			
			code = code || 1000;
			reason = reason || 'WS connection closed';
			
			//console.log( 'Detatching native websocket from object.' );
			
			let wsHere = self.ws;
			delete self.ws;
			self.ws = null;
			self.ready = false;
			
			try
			{
				console.log( 'Closing websocket', code, reason );
				
				if( wsHere.close )
				{
					wsHere.close( code, reason );
				}
				else console.log( 'Couldn\'t close websocket because close method was null and void.' );
				
			}
			catch( e )
			{
				self.logEx( e, 'close' );
				console.log( 'Could not check online state.' );
			}
			
			// We were disconnected, remove delayed handler
			if( window.Friend && Friend.User && Friend.User.State != 'online' )
			{
				console.log( 'We are disconnected. Strange things can happen.' );
			}
			
			// Check server and online state!
			if( window.Friend && Friend.User )
			{
				Friend.User.CheckServerNow();
			}
		}

		cleanup()
		{
			let self = this;
			this.conn = false;
			self.clearHandlers();
			self.wsClose();
			self.reconnect();
		}

		logEx( e, fnName )
		{
			let self = this;
			console.log( 'socket.' + fnName + '() exception: ' );
			console.log( e );
		}
	}
	window.FriendWebSocket = FriendWebSocket;
}

