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
FriendWebSocket = function( conf )
{
	if( !conf ) return;
	if ( !( this instanceof FriendWebSocket ))
		return new FriendWebSocket( conf );
	
	let self = this;
	
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

	self.chunks = {};
	self.allowReconnect = true;
	self.pingInterval = 1000 * 10;
	self.maxPingWait = 1000 * 10;
	//self.pingInterval = 1000 * 40;
	//self.maxPingWait = 1000 * 30;
	self.pingCheck = 0;
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

FriendWebSocket.prototype.send = function( msgObj )
{
	return this.sendOnSocket( {
		type: 'msg',
		data: msgObj
	} );
}

FriendWebSocket.prototype.reconnect = function()
{
	let self = this;
	self.allowReconnect = true;
	
	// We're pre reconnect - wait..
	if( window.Friend && Friend.User && Friend.User.State != 'online' )
	{
		//console.log( 'Cannot reconnect - Friend User is not online.' );
		return;
	}
	
	self.doReconnect();
}

// code and reason can be whatever, the socket is closed anyway.
// whats the server going to do? cry more lol
FriendWebSocket.prototype.close = function( code, reason )
{
	let self = this;
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
	self.cleanup();
}

// PRIVATES

FriendWebSocket.prototype.init = function()
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
		'ping'    : ping,
		'pong'    : pong,
		'chunk'   : chunk,
	};
	
	//function authenticate( e ) { self.handleAuth( e ); }
	function session( e ) { self.handleSession( e ); }
	function ping( e ) { self.handlePing( e ); }
	function pong( e ) { self.handlePong( e ); }
	function chunk( e ) { self.handleChunk( e ); }
	
	self.connect();
}

FriendWebSocket.prototype.connect = function()
{
	if( window.Friend && Friend.User && Friend.User.State == 'offline' )
	{
		// console.log( 'Friend says the user is offline. Bye.' );
		return;
	}
	
	let self = this;
	if ( !self.url || !self.url.length )
	{
		if( self.pConf )
		{
			// console.log( 'We have a previous config. Trying the url there.', self.pConf.url );
			self.url = self.pConf.url;
			return self.connect();
		}
		throw new Error( 'no url provided for socket' );
	}
	
	if( self.state == 'open' ) 
	{
		// console.log( 'We are already open.' );
		return;
	}
	
	if( self.state == 'connecting' ) 
	{
		// console.log('ongoing connect. we will wait for this to finish.');
		return;
	}
	
	self.setState( 'connecting' );
	
	
	if( self.ws )
	{
		self.cleanup();
	}
	new Promise( function( resolve, reject )
	{
		try
		{
			self.ws = new window.WebSocket( self.url, 'FC-protocol' );
			self.ws.onerror = function()
			{
				reject( 'error' );
			}
		}
		catch( e2 )
		{
			console.log( '[coreSocket] Failed to connect.', h2 );
			self.handleError( e2 );
			return;
		}
	} ).catch( function( err )
	{
		if( err == 'error' )
		{
			self.cleanup();
		}
		else
		{
			self.logEx( e, 'connect' );
		}
	} );
	
	self.attachHandlers();
}

FriendWebSocket.prototype.attachHandlers = function()
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
	
	function onOpen( e ) { self.handleOpen( e ); }
	function onClose( e ) { self.handleClose( e ); }
	function onError( e ) { self.handleError( e ); }
	function onMessage( e ) { self.handleSocketMessage( e ); }
}

FriendWebSocket.prototype.clearHandlers = function()
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

FriendWebSocket.prototype.doReconnect = function()
{
	let self = this;
	if ( !reconnectAllowed() ) {
		if ( self.onend )
			self.onend();
		return false;
	}
	
	if ( self.reconnectTimer )
		return true;
	
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
}

FriendWebSocket.prototype.setState = function( type, data )
{
	this.state =  {
		type: type,
		data: data,
	};
	//console.log( 'State: ', this.state );
	if( this.onstate ) this.onstate( this.state );
}

FriendWebSocket.prototype.handleOpen = function( e )
{
	this.reconnectAttempt = 0;
	this.setSession();
	this.setReady();
	
	
}

FriendWebSocket.prototype.handleClose = function( e )
{
	this.cleanup();
	this.setState( 'close' );
	this.doReconnect();
}

FriendWebSocket.prototype.handleError = function( e )
{
	this.cleanup();
	this.setState( 'error' );
	this.doReconnect();
}

FriendWebSocket.prototype.handleSocketMessage = function( e )
{	
	let self = this;
	
	//we received data... good. dont let some delayed ping create panic.
	if( self.pingCheck ) { clearTimeout( self.pingCheck ); self.pingCheck = 0 }
	
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
			 console.log( 'Test3: Session was killed!' );
			this.handleClose();
			
			setTimeout( function()
			{
				Workspace.logout();
			}, 500 );
			return;
		}
		else if( msg.data.data == 'session timeout' )
		{
			Notify( { title: i18n( 'i18n_session_expired' ), text: i18n( 'i18n_session_expired_desc' ) } );
			this.handleClose();
			Friend.User.ReLogin();
			return;
		}
	}
	
	this.handleEvent( msg );
}

FriendWebSocket.prototype.handleEvent = function( msg )
{
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

FriendWebSocket.prototype.handleConnMessage = function( msg )
{
	let handler = this.sysMsgMap[ msg.type ];
	if ( !handler )
	{
		console.log( 'FriendWebSocket.handleConnMessage - no handler for', msg );
		return;
	}
	handler( msg.data );
}

/*
FriendWebSocket.prototype.sendAuth = function()
{
	let self = this;
	let authMsg = {
		type : 'authsocket',
		data : self.authToken,
	};
	self.sendOnSocket( authMsg );
}

FriendWebSocket.prototype.handleAuth = function( data )
{
	let self = this;
	self.authenticated = data.success;
	self.setReady();
}
*/

FriendWebSocket.prototype.handleSession = function( sessionId )
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

FriendWebSocket.prototype.restartSession = function()
{
	this.sendOnSocket( {
		type : 'session',
		data : this.sessionId,
	}, true );
}

FriendWebSocket.prototype.unsetSession = function()
{
	this.sessionId = false;
	let msg = {
		type : 'session',
		data : this.sessionId,
	};
	this.sendOnSocket( msg );
}


FriendWebSocket.prototype.setSession = function()
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

FriendWebSocket.prototype.setReady = function()
{
	this.ready = true;
	this.setState( 'open' );
	this.startKeepAlive();
	this.executeSendQueue();
}

FriendWebSocket.prototype.sendCon = function( msg )
{
	this.sendOnSocket( {
		type: 'con',
		data: msg,
	} );
}

FriendWebSocket.prototype.sendOnSocket = function( msg, force )
{
	let self = this;
	if( !socketReady( force ) )
	{
		queue( msg );
		return false;
	}
	
	if ( !wsReady() )
	{
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
		// console.log( 'Test3: Sending chuked.' );
		return self.chunkSend( msgStr );
	}
	
	const success = self.wsSend( msgStr );
	if( !success )
	{
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
	
	function socketReady( force )
	{
		let ready = !!( self.ready && !force );
		return ready;
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
		strBlob = new Blob( realString );
		if( strBlob.size >= self.maxFCBytes )
		{
			return true;
		}
		else
		{
			return false;
		}
	}
}

FriendWebSocket.prototype.chunkSend = function( str )
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

FriendWebSocket.prototype.wsSend = function( str )
{
	let self = this;
	try
	{
		let res = self.ws.send( str );
		// console.log( 'Test3: Successfully sent;', str );
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

FriendWebSocket.prototype.executeSendQueue = function()
{
	let self = this;
	self.sendQueue.forEach( send );
	self.sendQueue = [];
	function send( msg )
	{
		self.sendOnSocket( msg );
	}
}

FriendWebSocket.prototype.startKeepAlive = function()
{
	let self = this;
	if ( self.keepAlive )
		self.stopKeepAlive();
	
	self.keepAlive = window.setInterval( ping, self.pingInterval );
	function ping()
	{
		self.sendPing();
	}
}
FriendWebSocket.prototype.sendPing = function( msg )
{
	let self = this;
	if ( !self.keepAlive )
		return;
	
	let timestamp = Date.now();
	let ping = {
		type : 'ping',
		data : timestamp,
	};

	if( self.pingCheck == 0 ) self.pingCheck = setTimeout( checkPing, self.maxPingWait );

	function checkPing()
	{
		self.wsClose( 1000, 'ping never got its pong' );
		self.reconnect();
	}
	
	self.sendCon( ping );
}

FriendWebSocket.prototype.handlePing = function( data )
{
	let self = this;
	let msg = {
		type : 'pong',
		data : data,
	};
	self.sendCon( msg );
}

FriendWebSocket.prototype.handlePong = function( timeSent )
{
	let self = this;
	let now = Date.now();
	let pingTime = now - timeSent;

	if( self.pingCheck ) { clearTimeout( self.pingCheck ); self.pingCheck = 0 }
	self.setState( 'ping', pingTime );
	if( Friend.User )
	{
		// Reinit user!
		Friend.User.Init();
	}
}

FriendWebSocket.prototype.handleChunk = function( chunk )
{	
	let self = this;
	
	//we received data... good. dont let some delayed ping create panic.
	if( self.pingCheck ) { clearTimeout( self.pingCheck ); self.pingCheck = 0 }
	
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
		return;
	
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

FriendWebSocket.prototype.stopKeepAlive = function()
{
	let self = this;
	if ( !self.keepAlive )
		return;
	
	window.clearInterval( self.keepAlive );
	self.keepAlive = null;
}

FriendWebSocket.prototype.wsClose = function( code, reason )
{
	let self = this;
	if ( !self.ws )
		return;
	
	code = code || 1000;
	reason = reason || 'WS connection closed';
	
	try {
		console.log( 'closing websocket', code, reason );
		if( window.Friend && Friend.User )
			Friend.User.CheckServerNow();
		self.ws.close( code, reason );
	} catch (e)
	{
		self.logEx( e, 'close' );
	}
}

FriendWebSocket.prototype.cleanup = function()
{
	let self = this;
	this.conn = false;
	self.stopKeepAlive();
	self.clearHandlers();
	self.wsClose();
	if( window.Workspace )
		Workspace.websocketState = 'offline';
	delete self.ws;
}

FriendWebSocket.prototype.logEx = function( e, fnName )
{
	let self = this;
	console.log( 'socket.' + fnName + '() exception: ' );
	console.log( e );
}

