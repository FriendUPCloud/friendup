/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/* NetworkConn

// Constructor arguments:

host      : signal server address. 
	protocol + domain + port/proxy
	protocol can be either plain  ws:// or secure wss://
	- make sure TLS use is consistent with FriendCore and signal server
	examples:
	ws://example.com:6504
	wss://example.com/network/proxy/

sessionId : workspace sessionId, used by the server to identify and
	and validate the connection with FriendCore

eventSink : listener - events with no registered handler are emitted here

onEnd     : if the socket connection dies and cannot be reestablished, 
	onEnd is called
	

Errors:
ERR_CONN_ERROR               : Connection is closed or has been close,
	or otherwise inconvenienced
	
ERR_REQUEST_INVALID_RESPONSE : response data format was wrong, it must have
	atleast either err or res
	
ERR_REQUEST_TIMEOUT          : Request has timed out. No reply from the network.
	In the case of P2P connection setup, it could be the other side not responding

*/

NetworkConn = function(
	host,
	authType,
	authToken,
	eventSink,
	onOpen,
	onEnd,
	hostMeta
) {
	const self = this;
	self.host = host;
	self.authType = authType,
	self.authToken = authToken,
	self.onopen = onOpen;
	self.onend = onEnd;
	
	// initializing functionality from /js/utils/events.js::EventEmitter
	window.EventEmitter.call( self, eventSink );
	
	self.conn = null;
	self.requestTimeouts = {};
	self.requestTimeout = 10 * 1000;
	
	self.init( hostMeta );
}

// prototype extension of /js/utils/events.js::EventEmitter
NetworkConn.prototype = Object.create( window.EventEmitter.prototype );

// Public

/* From EventEmitter:

.on
.once
.off
.release

These events are emitted:

'host-update' - when a host updates its meta info.
	This happens on connect. Can also happen later.
	Event data is host meta.
	
'host-closed' - when a host disconnects from the network.
	Event data is host id.
	
'connect' - when a remote host wishes to connect p2p.
'disconnect' - when a remote host disconnects p2p.

*/

/* ALL CALLBACKS: callbacks receive two arguments:

error    : if there was an error, this is an error code, otherwise null
	On an error, response might have additional data.
	ALWAYS CHECK FOR ERROR, NOT RESPONSE
	
response : relevant data, see each function for details.
*/

/* getHosts - Get a list of hosts on the network, including yourself.

Self will always be in the list, remote hosts only if they
have set themselves public.
*/
NetworkConn.prototype.getHosts = function( callback )
{
	var self = this;
	self.request( 'hosts', null, callback );
}

// setPublic - make self public on the network. returns a timestamp
NetworkConn.prototype.setPublic = function( callback )
{
	var self = this;
	self.request( 'publik', null, callback );
}

// setPrivate - make self private on the network, returns a timestamp
NetworkConn.prototype.setPrivate = function( callback )
{
	var self = this;
	self.request( 'privat', null, callback );
}

/* subscribe - receive events from these remote hosts

hostId   : receive broadcast events from this host
callback : complete list of subscriptions
*/
NetworkConn.prototype.subscribe = function( hostId, callback )
{
	var self = this;
	self.request( 'subscribe', hostId, callback );
}

/* unsubscribe - no longer receive events from remote hosts

hostId   : no longer receive broadcast events from this host
callback : complete list of subscriptions
*/
NetworkConn.prototype.unsubscribe = function( hostId, callback )
{
	var self = this;
	self.request( 'unsubscribe', hostId, callback );
}


/* expose - tell listening hosts that apps have been exposed to the network

app     : <map>
	{
		id          : <string>,
		type        : <string>,
		name        : <string>,
		info        : <object>,
		description : <string>,
	}

callback : receives complete list held by server
*/
NetworkConn.prototype.expose = function( app, callback )
{
	var self = this;
	self.request( 'expose', app, callback );
}

/* conceal - tell listening host that apps are no longer publicly available

id       : id of app that is no longer available
callback : receives complete list held by server
*/
NetworkConn.prototype.conceal = function( appId, callback )
{
	var self = this;
	self.request( 'conceal', appId, callback );
}

/* updateMeta - set human readable info for the host

conf : <map>
{
	name        : <string>,
	description : <longer string>,
	info        : <object>,
	apps        : [ <map>, <map>, .. ],
}
*/
NetworkConn.prototype.updateMeta = function( conf )
{
	console.log( 'updateMeta', conf );
	var self = this;
	var meta = {
		type : 'meta',
		data : conf,
	};
	self.send( 'meta', conf );
}

/* connect - establish a p2p webRTC data channel with a remote host/app

hostId      : <string> - host to connect to or host that has app to connect to
appId       : <string>, optional - app to connect to
options     : <stuff>, optinal - application specific data
sourceAppId : <string>, optinal - must be id of app making connect call,
	null if its workspace.

*/
NetworkConn.prototype.connect = function(
	hostId,
	appId,
	options,
	sourceAppId,
	callback
) {
	var self = this;
	var connect = {
		source  : {
			appId  : sourceAppId,
		},
		target  : {
			hostId : hostId,
			appId  : appId,
		},
		options : options,
	};
	
	console.log( 'fnet.connect', hostId );
	self.request( 'connect', connect, callback );
}

/* Request - will be handled by the netwrok. It is NOT sent to a host.

type : <string>, type of request. Static string ( expose, subscribe, etc )
	or a replyId, if you have received one.
	
data : <stuff> relevant request data.

callback : <fn> is called with the result of the request
*/

NetworkConn.prototype.request = function( type, data, callback )
{
	var self = this;
	var reqId = friendUP.tool.uid( 'req' );
	self.once( reqId, reqBack );
	var wrap = {
		id  : reqId,
		req : {
			type : type,
			data : data,
		},
	};
	self.send( 'request', wrap, sendBack );
	
	function sendBack( err )
	{
		if ( err ) {
			if ( callback )
				callback( 'ERR_CONN_ERROR', null );
			return;
		}
		
		self.requestTimeouts[ reqId ] = setTimeout(
			reqTimeout,
			self.requestTimeout
		);
	}
	
	function reqBack( event )
	{
		var timeout = self.requestTimeouts[ reqId ];
		if ( null != timeout ) {
			clearTimeout( timeout );
			delete self.requestTimeouts[ reqId ];
		}
		
		if ( !event || ( !event.err && !event.res ))
		{
			if ( callback )
				callback( 'ERR_REQUEST_INVALID_RESPONSE', event );
			return;
		}
		
		if ( callback )
			callback( event.err, event.res );
	}
	
	function reqTimeout()
	{
		console.log( 'request timed out', reqId );
		self.release( reqId );
		delete self.requestTimeouts[ reqId ];
		if ( callback )
			callback( 'ERR_REQUEST_TIMEOUT', null );
	}
}

/* SEND - send an event to a host, or broadcast it to all subscribers
	For sending an event to a app, the type of the event should be the appId.

hostId   : target host. optional. null means the event is broadcast
	to all subscribers
	
event    : JSON / javascript object. Protocol:
	{
		type : <string>
		data : data
	}

callback : optional. returns when the message is sent ( NOT on a
	reply from the network ) will return a error code/object is there was a
	problem sending the the event, otherwise null/undefined
*/
NetworkConn.prototype.send = function( hostId, event, callback )
{
	var self = this;
	if ( !self.conn ) {
		if ( callback )
			callback( 'ERR_CONN_ERROR' );
		
		return;
	}
	
	var wrap = {
		type : hostId,
		data : event,
	};
	self.conn.send( wrap, callback );
}

// release all references and close
NetworkConn.prototype.close = function()
{
	var self = this;
	console.log( 'NetworkConn.close', self.conn );
	self.closeEventEmitter();
	
	if ( self.conn )
		self.conn.close();
	
	delete self.conn;
	delete self.onend;
	delete self.host;
	delete self.sessionId;
	
}

// Private

NetworkConn.prototype.init = function( hostMeta )
{
	var self = this;
	self.conn = new NetworkSocket(
		self.host,
		self.authType,
		self.authToken,
		onState,
		onEvent,
		onEnd
	);
	
	self.once( 'connopen', onOpen );
	function onOpen( hostId )
	{
		console.log( 'connection open', hostId );
		self.id = hostId;
		if ( self.onopen )
			self.onopen( hostId );
		
		if ( hostMeta )
			self.updateMeta( hostMeta );
	}
	
	function onState( event )
	{
		if ( 'ping' === event.type )
			return;
		
		console.log( 'NetworkConn - onState', event );
	}
	
	function onEvent( event )
	{
		self.handle( event.type, event.data );
	}
	
	function onEnd( err )
	{
		console.log( 'NetworkConn - onEnd, socket has ended', err );
		if ( self.onend )
			self.onend( err );
	}
}

NetworkConn.prototype.handle = function( source, event ) {
	var self = this;
	/*
	console.log( 'handle', {
		source : source,
		event  : event,
	});
	*/
	self.emit( event.type, event.data, source );
}

/* NetworkSocket

websocket class for use with the Friend Network
This is the signaling connection, webrtc data connection is in networkRTC.js

// Constructor arguments

host      : signal server address.
authType  : 'workspace' | 'application'
authToken : a security token relevant to the authType.
	'worksapce' requires sessionId and 
	'application' requires authId
onstate   : listener, when connection state changes, events are emitted here
onevent   : listener, all network events will be sent here
onend     : when the connection closes, an event is emitted here

// Public interface

.send( event, callback )
	send an event over the network, callback is called after the event has been sent,
	NOT on a reply from the network ( there arent any, its all events at this level )

.reconnect( sessionId )
	sessionId is optional. Force a reconnect at any time.
	The socket will attempt to reconnect by itself,
	but it might give up or be told to stop by the server ( invalid sessionId )

.close()
	closes the thing

*/
var friendUP = window.friendUP || {};

NetworkSocket = function(
	host,
	authType,
	authToken,
	onstate,
	onevent,
	onend
) {
	const self = this;
	
	// REQUIRED
	self.host = host;
	self.authType = authType;
	self.authToken = authToken;
	self.onstate = onstate;
	self.onevent = onevent;
	self.onend = onend;
	
	// might be useful to public
	self.ready = false;
	
	// INTERNAL
	self.ws = null;
	self.socketSession = null;
	self.sendQueue = [];
	self.allowReconnect = true;
	self.pingInterval = null; // reference to setInterval id
	self.pingStep = 1000 * 15; // time between pings
	self.pingTimeouts = {}; // references to timeouts for sent pings
	self.pingMaxTime = 1000 * 10; // timeout
	self.reconnectDelay = 250; // base delay - delay increases for each attempt
	self.reconnectMaxDelay = 1000 * 30;
	self.reconnectAttempt = 0; // delay is multiplied with attempts
	                           //to find how long the next delay is
	self.reconnectMaxAttempts = 20; // 0 to keep hammering
	self.reconnectScale = {
		min : 5,
		max : 8,
	}; // random in range, makes sure not all the sockets
	   // in the world tries to reconnect at the same time
	
	self.init();
}

// PUBLIC INTERFACE

// event    : JSON / javascript object. Basically anything JSON.stringify can handle.
// callback : optional. returns when the message is sent ( NOT on a
//		reply from the network ) will return a error object is there was a
//		problem sending the the event, otherwise null/undefined
NetworkSocket.prototype.send = function( event, callback )
{
	var self = this;
	/*console.log( 'NetworkSocket.send', {
		e : event,
		cb : callback, });
	*/
	var wrap = {
		type : 'event',
		data : event,
	};
	self.sendOnSocket( wrap, callback );
}

// force reconnect, recycling the websocket
// authToken : optional.
NetworkSocket.prototype.reconnect = function( authToken )
{
	var self = this;
	if ( null != authToken )
		self.authToken = authToken;
	
	self.allowReconnect = true;
	self.doReconnect();
}

// code and reason can be whatever, the socket is closed anyway.
// whats the server going to do? cry more lol
NetworkSocket.prototype.close = function( code, reason )
{
	var self = this;
	self.unsetSession();
	self.allowReconnect = false;
	self.onevent = null;
	self.onstate = null;
	self.onend = null;
	self.wsClose( code, reason );
}

// PRIVATE

NetworkSocket.prototype.init = function()
{
	var self = this;
	if ( !self.onevent || !self.onstate || !self.onend ) {
		console.log( 'Socket - missing handlers', {
			onevent : self.onevent,
			onstate : self.onstate,
			onend : self.onend,
		});
		throw new Error( 'Socket - missing handlers ^^^' );
	}
	
	self.messageMap = {
		'authenticate' : authenticate,
		'session'      : session,
		'ping'         : ping,
		'pong'         : pong,
	};
	
	function authenticate( e ) { self.handleAuth( e ); }
	function session( e ) { self.handleSession( e ); }
	function ping( e ) { self.handlePing( e ); }
	function pong( e ) { self.handlePong( e ); }
	
	self.connect();
}

NetworkSocket.prototype.connect = function()
{
	var self = this;
	if ( self.ws )
		return;
	
	if ( !self.host || !self.host.length ) {
		console.log( 'socket.host', self.host );
		throw new Error( 'no host provided for socket' );
	}
	
	self.setState( 'connecting', self.host );
	try
	{
		self.ws = new window.WebSocket( self.host );
	}
	catch( e )
	{
		console.log( 'NetworkSocket.connect - failed to connect to ', {
			host : self.host,
			self : self,
		});
	}
	
	self.attachHandlers();
}

NetworkSocket.prototype.attachHandlers = function()
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
	function onMessage( e ) { self.handleMessage( e ); }
}

NetworkSocket.prototype.clearHandlers = function()
{
	var self = this;
	self.ws.onopen = null;
	self.ws.onclose = null;
	self.ws.onerror = null;
	self.ws.onmessage = null;
}

NetworkSocket.prototype.doReconnect = function()
{
	var self = this;
	console.log( 'doReconnect', self );
	if ( self.ws )
		self.cleanup();
	
	if ( !reconnectAllowed() )
	{
		self.ended();
		return false;
	}
	
	if ( self.reconnectTimer )
		return true;
	
	self.reconnectAttempt++;
	var delay = calcDelay();
	var showIsReconnectingLimit = 1000 * 5; // 5 seconds
	if ( delay > showIsReconnectingLimit )
	{
		console.log( 'Delay: ' + delay + ' is > than ' + showIsReconnectingLimit );
		self.setState( 'reconnect', delay );
	}
	
	console.log( 'doReconnect - delay', delay );
	self.reconnectTimer = window.setTimeout( reconnect, delay );
	
	function reconnect()
	{
		// See if we have low connectivity!
		if( Workspace )
		{
			Workspace.checkServerConnectionHTTP();
		}
		
		self.reconnectTimer = null;
		self.connect();
	}
	
	function reconnectAllowed()
	{
		var checks = {
			allow : self.allowReconnect,
			hasTriesLeft : !tooManyTries(),
			hasSession : !!self.socketSession
		};
		
		var allow = !!( true
			&& checks.allow
			&& checks.hasTriesLeft
			&& checks.hasSession
		);
		
		if ( !allow )
		{
			Friend.User.ReLogin();
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
		console.log( 'delay', delay );
		var multiplier = calcMultiplier();
		console.log( 'multiplier', multiplier );
		var tries = self.reconnectAttempt;
		console.log( 'tries', tries );
		delay = multiplier * tries;
		console.log( 'actual delay', delay );
		if ( delay > self.reconnectMaxDelay )
			delay = self.reconnectMaxDelay;
		
		var delayMs = delay * 1000;
		console.log( 'ret delay', delayMs );
		return delayMs;
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

NetworkSocket.prototype.handleRequest = function( res )
{
	var self = this;
	console.log( 'NetworkSocket.handleRequest', event );
	var timeout = self.requestTimeouts[ res.reqId ];
	if ( null == timeout ) {
		clearTimeout( timeout );
		delete self.requestTimeouts[ res.reqId ];
	}
	
	var callback = self.requests[ res.reqId ];
	if ( !callback )
	{
		console.log( 'NetworkSocket.handleRequest - no callback found for', {
			response : res,
			self     : self,
		});
		return;
	}
	
	delete self.requests[ res.reqId ];
}

NetworkSocket.prototype.setState = function( type, data )
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

NetworkSocket.prototype.handleOpen = function( e )
{
	var self = this;
	self.reconnectAttempt = 0;
	// we're waiting for authenticate challenge
}

NetworkSocket.prototype.handleClose = function( e )
{
	var self = this;
	console.log( 'handleClose', e );
	self.cleanup();
	self.setState( 'close' );
	self.doReconnect();
}

NetworkSocket.prototype.handleError = function( e )
{
	var self = this;
	self.cleanup();
	self.setState( 'error' );
	self.doReconnect();
}

NetworkSocket.prototype.handleMessage = function( e )
{
	var self = this;
	var msg = friendUP.tool.objectify( e.data );
	var handler = self.messageMap[ msg.type ];
	if ( !handler )
	{
		if ( self.onevent )
			self.onevent( msg.data );
		return;
	}
	
	handler( msg.data );
}

NetworkSocket.prototype.handleAuth = function( err )
{
	var self = this;
	if ( null == err )
	{
		self.sendAuth();
		return;
	}
	
	console.log( 'handleAuth - err', err );
	self.cleanup();
}

NetworkSocket.prototype.handleSession = function( sessionId )
{
	var self = this;
	if ( null == sessionId )
	{
		self.socketSession = null;
		self.cleanup();
		return;
	}
	
	self.socketSession = sessionId;
	self.setReady();
}

NetworkSocket.prototype.restartSession = function()
{
	var self = this;
	console.log( 'restartSession', self.socketSession );
	if ( !self.socketSession )
	{
		self.cleanup();
		return;
	}
	
	var session = {
		type : 'session',
		data : self.socketSession,
	};
	self.sendOnSocket( session, null, true );
	self.socketSession = null;
}

NetworkSocket.prototype.unsetSession = function()
{
	var self = this;
	console.log( 'unsetSession' );
	self.socketSession = false;
	var msg = {
		type : 'session',
		data : self.socketSession,
	};
	self.sendOnSocket( msg );
}

NetworkSocket.prototype.sendAuth = function()
{
	const self = this;
	if ( self.socketSession ) {
		self.restartSession();
		return;
	}
	
	var bundle = {
		type : self.authType,
		data : {
			token : self.authToken
		}
	};
	console.log( 'sendauth', bundle );
	var authMsg = {
		type : 'authenticate',
		data : bundle,
	};
	self.sendOnSocket( authMsg, null, true );
}

NetworkSocket.prototype.setReady = function()
{
	var self = this;
	self.ready = true;
	self.setState( 'ready' );
	self.startKeepAlive();
	self.executeSendQueue();
}

NetworkSocket.prototype.sendOnSocket = function( event, callback, force )
{
	var self = this;
	if ( !wsReady() )
	{
		queue( event, callback );
		return;
	}
	
	if ( !socketReady( force ))
	{
		queue( event, callback );
		return;
	}
	
	var msgStr = friendUP.tool.stringify( event );
	var err = null;
	try {
		self.ws.send( msgStr );
	} catch (e) {
		console.log( 'NetworkSocket.sendOnSocket - failed to send event', event );
		err = 'ERR_SOCKET_INVALID_STATE';
	}
	
	if ( callback )
		callback( err );
	
	function queue( msg, callback )
	{
		if ( !self.sendQueue )
			self.sendQueue = [];
		
		var send = {
			event : msg,
			callback : callback,
		};
		self.sendQueue.push( send );
	}
	
	function socketReady( force )
	{
		if ( self.ready )
			return true;
		
		if ( force )
			return true;
		
		return false;
	}
	
	function wsReady()
	{
		var ready = !!( self.ws && ( self.ws.readyState === 1 ));
		return ready;
	}
}

NetworkSocket.prototype.executeSendQueue = function()
{
	var self = this;
	self.sendQueue.forEach( send );
	self.sendQueue = [];
	function send( item )
	{
		self.sendOnSocket( item.msg, item.callback );
	}
}

NetworkSocket.prototype.startKeepAlive = function()
{
	var self = this;
	if ( self.pingInterval )
		self.stopKeepAlive();
	
	self.pingInterval = window.setInterval( ping, self.pingStep );
	function ping() { self.sendPing(); }
}

NetworkSocket.prototype.sendPing = function( msg )
{
	var self = this;
	if ( !self.pingInterval )
	{
		self.stopKeepAlive();
		return;
	}
	
	var timestamp = Date.now();
	var ping = {
		type : 'ping',
		data : timestamp,
	};
	
	self.sendOnSocket( ping );
	
	// set timeout
	var tsStr = timestamp.toString();
	var timeoutId = window.setTimeout( triggerTimeout, self.pingMaxTime );
	self.pingTimeouts[ tsStr ] = timeoutId;
	function triggerTimeout()
	{
		self.handlePingTimeout();
	}
}

NetworkSocket.prototype.handlePingTimeout = function()
{
	var self = this;
	self.doReconnect();
}

NetworkSocket.prototype.handlePong = function( timestamp )
{
	var self = this;
	var timeSent = timestamp;
	var tsStr = timeSent.toString();
	var timeoutId  = self.pingTimeouts[ tsStr ];
	if ( timeoutId )
	{
		window.clearTimeout( timeoutId );
		delete self.pingTimeouts[ tsStr ];
	}
	
	var now = Date.now();
	var pingTime = now - timeSent;
	self.setState( 'ping', pingTime );
}

NetworkSocket.prototype.handlePing = function( e )
{
	var self = this;
	self.sendPong( e );
}

NetworkSocket.prototype.sendPong = function( data )
{
	var self = this;
	var pongMsg = {
		type : 'pong',
		data : data,
	}
	self.sendOnSocket( pongMsg );
}

NetworkSocket.prototype.stopKeepAlive = function()
{
	var self = this;
	if ( self.pingInterval )
		window.clearInterval( self.pingInterval );
	
	self.pingInterval = null;
	
	var pingIds = Object.keys( self.pingTimeouts );
	pingIds.forEach( clear );
	self.pingTimeouts = {};
	
	function clear( tsStr )
	{
		var timeout = self.pingTimeouts[ tsStr ];
		if ( !timeout )
			return;
		
		window.clearTimeout( timeout );
	}
}

NetworkSocket.prototype.ended = function()
{
	var self = this;
	if ( !self.onend )
		return;
	
	var onend = self.onend;
	delete self.onend;
	onend();
}

NetworkSocket.prototype.cleanup = function()
{
	var self = this;
	self.ready = false;
	self.stopKeepAlive();
	self.clearHandlers();
	self.wsClose();
	delete self.ws;
}

NetworkSocket.prototype.wsClose = function( code, reason )
{
	var self = this;
	if ( !self.ws )
		return;
	
	code = code || 1000;
	reason = reason || 'screw you guys, im going home';
	
	try {
		self.ws.close( code, reason );
	} catch (e) {
		self.logEx( e, 'close' );
	}
}
