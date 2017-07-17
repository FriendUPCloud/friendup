/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

// SOCKET
FriendWebSocket = function( conf )
{
	if( !conf ) return;
	if ( !( this instanceof FriendWebSocket ))
		return new FriendWebSocket( conf );
	
	var self = this;
	
	// REQUIRED CONFIG
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
	self.chunks = {};
	self.allowReconnect = true;
	self.pingInterval = 1000 * 10;
	self.maxPingWait = 1000 * 5;
	self.pingCheck = 0;
	self.reconnectDelay = 200; // ms
	self.reconnectMaxDelay = 1000 * 30; // 30 sec max delay between reconnect attempts
	self.reconnectAttempt = 0; // delay is multiplied with attempts to find how long the next delay is
	self.reconnectMaxAttempts = 0; // 0 to keep hammering
	self.reconnectScale = {
		min : 5,
		max : 8,
	}; // random in range, makes sure not all the sockets
	   // in the world reconnect at the same time
	
	self.init();
}

// PUBLIC INTERFACE

FriendWebSocket.prototype.send = function( msgObj )
{
	var self = this;
	var wrap = {
		type : 'msg',
		data : msgObj,
	};
	self.sendOnSocket( wrap );
}

FriendWebSocket.prototype.reconnect = function()
{
	var self = this;
	self.allowReconnect = true;
	self.doReconnect();
}

// code and reason can be whatever, the socket is closed anyway, whats the server going to do? cry more lol
FriendWebSocket.prototype.close = function( code, reason )
{
	var self = this;
	self.allowReconnect = false;
	self.url = null;
	self.sessionId = null;
	self.authId = null;
	self.onmessage = null;
	self.onstate = null;
	self.onend = null;
	self.wsClose( code, reason );
	self.cleanup();
}

// PRIVATES

FriendWebSocket.prototype.init = function()
{
	var self = this;
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
	var self = this;
	if ( !self.url || !self.url.length )
	{
		console.log( 'socket.url', self.url );
		throw new Error( 'no url provided for socket' );
	}
	
	if( self.state == 'connecting' ) { console.log('ongoing connect. we will wait for this to finish.'); return; }
	self.setState( 'connecting' );
	try {
		self.ws = new window.WebSocket( self.url, 'FC-protocol' );
	} catch( e )
	{
		self.logEx( e, 'connect' );
	}
	
	self.attachHandlers();
}

FriendWebSocket.prototype.attachHandlers = function()
{
	var self = this;
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
	var self = this;
	if ( !self.ws )
		return;
	
	self.ws.onopen = null;
	self.ws.onclose = null;
	self.ws.onerror = null;
	self.ws.onmessage = null;
}

FriendWebSocket.prototype.doReconnect = function()
{
	var self = this;
	if ( !reconnectAllowed() ){
		if ( self.onend )
			self.onend();
		return false;
	}
	
	if ( self.reconnectTimer )
		return true;
	
	var delay = calcDelay();
	if ( delay > self.reconnectMaxDelay )
		delay = self.reconnectMaxDelay;
	
	console.log( 'prepare reconnect - delay( s )', ( delay / 1000 ));
	var showReconnectLogTimeLimit = 5000; // 5 seconds
	if ( delay > showReconnectLogTimeLimit )
		self.setState( 'reconnect', delay );
	
	self.reconnectTimer = window.setTimeout( reconnect, delay );
	
	function reconnect()
	{
		self.reconnectTimer = null;
		self.reconnectAttempt += 1;
		console.log( 'ws reconnect' );
		self.connect();
	}
	
	function reconnectAllowed()
	{
		var checks = {
			allow : self.allowReconnect,
			hasTriesLeft : !tooManyTries(),
			hasSession : !!self.sessionId,
		};
		
		/*
		console.log( 'checks', { 
			allow : self.allowReconnect,
			hasTriesLeft : !tooManyTries(),
			hasSession : !!self.sessionId,
		});
		*/
		
		var allow = !!( true
			&& checks.allow
			&& checks.hasTriesLeft
			&& checks.hasSession
		);
		
		if ( !allow )
		{
			console.log( 'not allowed to reconnect', checks )
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
		var delay = self.reconnectDelay;
		var multiplier = calcMultiplier();
		var tries = self.reconnectAttempt || 1;
		return delay * multiplier * tries;
	}
	
	function calcMultiplier()
	{
		var min = self.reconnectScale.min;
		var max = self.reconnectScale.max;
		var gap = max - min;
		var scale = Math.random();
		var point = gap * scale;
		var multiplier = min + point;
		return multiplier;
	}
}

FriendWebSocket.prototype.setState = function( type, data )
{
	var self = this;
	var state = {
		type : type,
		data : data,
	};
	self.state = state;
	if ( self.onstate )
		self.onstate( state );
}

FriendWebSocket.prototype.handleOpen = function( e )
{
	var self = this;
	self.reconnectAttempt = 0;
	self.setSession();
	self.setReady();
	
	/*
	if ( self.sessionId )
	{
		self.restartSession();
		return;
	}
	
	self.sendAuth();
	*/
}

FriendWebSocket.prototype.handleClose = function( e )
{
	var self = this;
	self.cleanup();
	self.setState( 'close' );
	self.doReconnect();
}

FriendWebSocket.prototype.handleError = function( e )
{
	var self = this;
	self.cleanup();
	self.setState( 'error' );
	self.doReconnect();
}

FriendWebSocket.prototype.handleSocketMessage = function( e )
{
	var self = this;
	if( self.pingCheck )
		clearTimeout( self.pingCheck );
	
	var msg = friendUP.tool.objectify( e.data );
	if ( !msg )
	{
		console.log( 'FriendWebSocket.handleSocketMessage - invalid data, could not parse JSON' );
		return;
	}
	
	self.handleEvent( msg );
}

FriendWebSocket.prototype.handleEvent = function( msg )
{
	var self = this;
	if( 'con' === msg.type )
	{
		self.handleConnMessage( msg.data );
		return;
	}
	
	//console.log( 'FriendWebSocket - msg', msg );
	if( 'msg' === msg.type )
	{
		self.onmessage( msg.data );
		return;
	}
	
	console.log( 'FriendWebSocket - unknown messge', msg );
}

FriendWebSocket.prototype.handleConnMessage = function( msg )
{
	var self = this;
	var handler = self.sysMsgMap[ msg.type ];
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
	var self = this;
	var authMsg = {
		type : 'authsocket',
		data : self.authToken,
	};
	self.sendOnSocket( authMsg );
}

FriendWebSocket.prototype.handleAuth = function( data )
{
	var self = this;
	self.authenticated = data.success;
	self.setReady();
}
*/

FriendWebSocket.prototype.handleSession = function( sessionId )
{
	var self = this;
	console.log( 'handleSession', sessionId );
	if ( self.sessionId === sessionId )
	{
		self.setReady();
	}
	
	self.sessionId = sessionId;
	if ( !self.sessionId )
	{
		self.allowReconnect = false;
		if ( self.onend )
			self.onend();
	}
}

FriendWebSocket.prototype.restartSession = function()
{
	var self = this;
	var session = {
		type : 'session',
		data : self.sessionId,
	};
	self.sendOnSocket( session, true );
}

FriendWebSocket.prototype.unsetSession = function()
{
	var self = this;
	self.sessionId = false;
	var msg = {
		type : 'session',
		data : self.sessionId,
	};
	self.sendOnSocket( msg );
}


FriendWebSocket.prototype.setSession = function()
{
	var self = this;
	var sess = {
		type : 'con',
		data : {
			sessionId : self.sessionId || undefined,
			authId : self.authId || undefined,
		},
	};
	self.sendOnSocket( sess );
}

FriendWebSocket.prototype.setReady = function()
{
	var self = this;
	self.ready = true;
	self.setState( 'open' );
	self.startKeepAlive();
	self.executeSendQueue();
}

FriendWebSocket.prototype.sendCon = function( msg )
{
	var self = this;
	var wrap = {
		type : 'con',
		data : msg,
	};
	self.sendOnSocket( wrap );
}

FriendWebSocket.prototype.sendOnSocket = function( msg, force )
{
	var self = this;
	if ( !wsReady() && !socketReady( force ) )
	{
		queue( msg );
		return;
	}
	
	if ( 'con' !== msg.type )
	{
		//console.log( 'FriendWebSocket.sendOnSocket', msg );
	}
	
	var msgStr = friendUP.tool.stringify( msg );
	
	try
	{
		//console.log( 'Sending like superman: ' + msgStr );
		self.ws.send( msgStr );
	} 
	catch(e)
	{
		console.log( 'FriendWebSocket.sendOnSocket failed', {
			e : e,
			msg : msg,
		});
	}
	
	function queue( msg )
	{
		if ( !self.sendQueue )
			self.sendQueue = [];
		
		self.sendQueue.push( msg );
	}
	
	function socketReady( force )
	{
		var ready = !!( self.ready && !force );
		return ready;
	}
	
	function wsReady()
	{
		var ready = !!( self.ws && ( self.ws.readyState === 1 ));
		return ready;
	}
}

FriendWebSocket.prototype.executeSendQueue = function()
{
	var self = this;
	self.sendQueue.forEach( send );
	self.sendQueue = [];
	function send( msg )
	{
		self.sendOnSocket( msg );
	}
}

FriendWebSocket.prototype.startKeepAlive = function()
{
	var self = this;
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
	var self = this;
	if ( !self.keepAlive )
		return;
	
	var timestamp = Date.now();
	var ping = {
		type : 'ping',
		data : timestamp,
	};

	self.pingCheck = setTimeout( checkPing, self.maxPingWait );
	function checkPing()
	{
		self.wsClose( 1000, 'ping never got its pong' );
		self.reconnect();
	}
	
	self.sendCon( ping );
}

FriendWebSocket.prototype.handlePing = function( data )
{
	var self = this;
	var msg = {
		type : 'pong',
		data : data,
	};
	self.sendCon( msg );
}

FriendWebSocket.prototype.handlePong = function( timeSent )
{
	var self = this;
	var now = Date.now();
	var pingTime = now - timeSent;

	if( self.pingCheck ) clearTimeout( self.pingCheck);
	self.setState( 'ping', pingTime );
}

FriendWebSocket.prototype.handleChunk = function( chunk )
{
	var self = this;
	console.log( 'handleChunk', {
		chunk  : chunk,
		chunks : self.chunks,
		size   : chunk.data.length,
		first  : chunk.data.charCodeAt( 0 ),
		last   : chunk.data.charCodeAt( chunk.data.length - 1 ),
	});
	
	chunk.total = parseInt( chunk.total, 10 );
	chunk.part = parseInt( chunk.part, 10 );
	var cid = chunk.id;
	var chunks = self.chunks[ cid ];
	if ( !chunks )
	{
		chunks = Array( chunk.total );
		chunks.fill( null );
		self.chunks[ cid ] = chunks;
	}
	
	var index = chunk.part;
	chunks[ index ] = chunk.data;
	if ( !hasAll( chunks, chunk.total ))
		return;
	
	var event = rebuild( chunks );
	delete self.chunks[ cid ];
	self.handleEvent( event );
	
	function hasAll( chunks, total ) {
		var anyNull = chunks.some( isNull );
		//console.log( 'hasAll', !anyNull );
		return !anyNull;
		function isNull( item ) {
			return null == item;
		}
	}
	
	function rebuild( chunks ) {
		//console.log( 'rebuild', chunks );
		var whole = chunks.join( '' );
		//console.log( 'whole', whole );
		
		/* Re enable this to first attempt to parse json, then try base64 if it fails
		
		var parsed = friendUP.tool.objectify( whole );
		if ( parsed )
			return parsed; // if it was json ( aka not b64 ), this happens
		
		*/
		
		// well, then, try b64 decode
		var notB64 = atob( whole );
		//console.log( 'decoded', notB64 );
		var parsed = friendUP.tool.objectify( notB64 );
		//console.log( 'parsed', parsed );
		return parsed;
	}
}

FriendWebSocket.prototype.stopKeepAlive = function()
{
	var self = this;
	if ( !self.keepAlive )
		return;
	
	window.clearInterval( self.keepAlive );
	self.keepAlive = null;
}

FriendWebSocket.prototype.wsClose = function( code, reason )
{
	var self = this;
	if ( !self.ws )
		return;
	
	code = code || 1000;
	reason = reason || 'screw you guys, im going home';
	
	try {
		console.log('closing websocket',code,reason);
		self.ws.close( code, reason );
	} catch (e)
	{
		self.logEx( e, 'close' );
	}
}

FriendWebSocket.prototype.cleanup = function()
{
	var self = this;
	self.ready = false;
	self.stopKeepAlive();
	self.clearHandlers();
	self.wsClose();
	delete self.ws;
}

FriendWebSocket.prototype.logEx = function( e, fnName )
{
	var self = this;
	console.log( 'socket.' + fnName + '() exception: ' );
	console.log( e );
}

