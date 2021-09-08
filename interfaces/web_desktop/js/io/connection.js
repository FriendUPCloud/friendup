/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Interface for FC communication

FriendConnection = function( conf )
{
	// TODO read stuff from conf / pass in conf
	const self = this;
	self.onstate = conf.onstate;
	self.onend = conf.onend;
	
	self.SID = null;
	self.protocol = '';
	self.host = '';
	self.wsPort = ( parseInt( conf.wsPort ) > 0 ? parseInt( conf.wsPort ) : 6500 );
	self.reqPort = null;
	self.ws = null;
	
	self.listeners = {};
	self.listenerMap = {};
	
	self.registeredApps = {};
	
	self.init();
}

// Public

FriendConnection.prototype.connect = function( sessionId )
{
	const self = this;
	if ( null == sessionId )
		throw new Error( 'FriendConnection.connect - no sessionId' );
	
	console.log( 'FriendConnection.connect', sessionId );
	self.SID = sessionId;
	self.connectWebSocket();
}

FriendConnection.prototype.disconnect = function()
{
	const self = this;
	console.log( 'FriendConnection.disconnect' );
	const disc = {
		type : 'disconnect',
		data : Date.now(),
	};
	self.onstate( disc );
	self.releaseWebSocket();
}

FriendConnection.prototype.request = function( conf, callback )
{
	const self = this;
	let reqId = self.setRequestCallback( callback );
	
	req = {
		type : 'request',
		requestid : reqId,
		path : conf.path,
		data : conf.data,
	};
	req = self.setId( req, conf );
	let result = self.sendMessage( req );
	if( result ) 
	{
		return reqId;
	}
	return false;
}

FriendConnection.prototype.send = function( conf )
{
	const self = this;
	let event = {
		type : 'event',
		path : conf.path,
		data : conf.data,
	};
	
	// messages from 
	event = self.setId( event, conf );
	self.sendMessage( event );
}

FriendConnection.prototype.on = function( event, listener )
{	
	const self = this;
	if( !self.listeners[ event ] )
		self.listeners[ event ] = [];
	
	let listenerId = friendUP.tool.uid( 'listener' );
	self.listenerMap[ listenerId ] = listener;
	self.listeners[ event ].push( listenerId );
	return listenerId;
}

FriendConnection.prototype.once = function( event, listener )
{
	const self = this;
	let id = self.on( event, onceie );
	
	function onceie( data )
	{
		self.off( event, id );
		listener( data );
	}
}

FriendConnection.prototype.off = function( event, id )
{
	const self = this;
	if ( !self.listenerMap[ id ]) {
		console.log( 'FriendConnection.off - listenerId not found',
			{ id : id, listenerMap : self.listenerMap });
		return;
	}
	
	delete self.listenerMap[ id ];
	
	let eventIds = self.listeners[ event ];
	if ( !eventIds || !eventIds.length ) {
		console.log( 'FriendConnection.off - event not found',
			{ e : event, listenerMap : self.listeners });
		return;
	}
	
	let index = eventIds.indexOf( id );
	if ( -1 === index ) {
		console.log( 'FriendConnection.off - id not found for event',
			{ id : id, event : self.listeners });
		return;
	}
	
	console.log( 'FriendConnection.off - found id, removing', {
		id : id,
		event : event,
		index : index,
		eventIds : eventIds,
	});
	self.listeners[ event ].splice( index, 1 );
}

FriendConnection.prototype.release = function()
{
	const self = this;
	for ( var lId in self.listenerMap )
		delete self.listeners[ lId ];
	
	for ( var event in self.listeners )
		delete self.listeners[ event ];
	
	self.listenerMap = {};
	self.listeners = {};
}

// Private

FriendConnection.prototype.init = function()
{
	const self = this;
	let dest = document.location;
	self.reqProtocol = dest.protocol;
	self.wsProtocol = 'https:' === dest.protocol ? 'wss://' : 'ws://';
	self.host = dest.hostname;
	self.reqPort = dest.port;
	// self.wsPort - hardcoded in constructor, set it here when its from config
	
	//self.connectWebSocket();
}

FriendConnection.prototype.connectWebSocket = function( sessionId )
{
	const self = this;
	if ( self.ws )
		self.releaseWebSocket();
	
	let url = self.wsProtocol + self.host;
	if ( self.wsPort )
		url += ':' + self.wsPort;
	
	url += '/fcws';
	
	let conf = {
		url       : url,
		sessionId : self.SID,
		onmessage : onMessage,
		onstate   : onState,
		onend     : onEnd,
	};
	
	console.log( 'connectWebSocket', conf );
	
	self.ws = new FriendWebSocket( conf );
	
	function onMessage( e ) { self.onWsMessage( e ); }
	function onState( e ) { self.onWsState( e ); }
	function onEnd( e ) { self.onWsEnd( e ); }
}

FriendConnection.prototype.setId = function( event, conf )
{
	const self = this;
	if ( conf.authId )
		event.authid = conf.authId;
	else
		event.sessionid = Workspace.sessionId;
	
	return event;
}

FriendConnection.prototype.onWsMessage = function( msg )
{
	const self = this;

	//console.log("Message came: ", msg );
	
	if ( 'response' === msg.type )
	{
		handleResponse( msg );
	}
	else
	{
		handleEvent( msg );
	}
	
	function handleEvent( msg )
	{	
		let event = msg.type;
		let lIds = self.listeners[ event ];
		if( !lIds )
		{
			console.log( 'FriendConnection - handler ids not found for', {
				msg : msg,
				msgJson : JSON.stringify( msg ),
				event : event,
				listeners : self.listeners,
			} );
			return;
		}
		
		lIds.forEach( callHandler )
		function callHandler( id )
		{
			let handler = self.listenerMap[ id ];
			if ( !handler ) {
				console.log( 'FriendConnection - no handler for id', {
					id : id,
					map : self.listenerMap,
				});
				return;
			}
			
			// Default member
			if( msg.data )
			{
				handler( msg.data );
			}
			// Session data member
			else if( msg.session )
			{
				handler( msg.session );
			}
			else
			{
				console.log( 'Illegal message format.', msg );
			}
		}
	}
	
	function handleResponse( msg ) {
		let id = msg.requestid;
		let handler = self.listenerMap[ id ];
		if ( !id || !handler ) {
			console.log( '[FriendConnection] Handler or requestId missing...', {
				msg : msg,
				id : id,
				handler : handler,
			});
			return;
		}
		
		delete self.listenerMap[ id ];
		handler( msg.data );
	}
}

FriendConnection.prototype.onWsState = function( e )
{
	const self = this;
	//console.log( 'onWsState', e );
	if ( self.onstate )
		self.onstate( e );
}

FriendConnection.prototype.onWsEnd = function( e )
{
	const self = this;
	console.log( 'onWsEnd', e );
	self.releaseWebSocket();
	if ( self.onend )
		self.onend( e );
	
}

FriendConnection.prototype.releaseWebSocket = function() 
{	
	const self = this;
	if ( !self.ws )
		return;
	
	self.ws.close();
	self.ws = null;
}

FriendConnection.prototype.sendMessage = function( msg )
{
	const self = this;
	if ( !self.ws )
	{
		return false;
		//console.log( 'FriendConnection.sendMessage - no ws found, sending async', msg );
		//return self.sendAsync( msg );
	}
	
	return self.ws.send( msg );
}

// TODO: Implement
FriendConnection.prototype.sendAsync = function( msg )
{
	const self = this;
	console.log( 'sendAsync - NYI', msg );
	return false;
}

FriendConnection.prototype.setRequestCallback = function( callback )
{
	const self = this;
	let cid = friendUP.tool.uid( 'fconn-req' );
	self.listenerMap[ cid ] = callback;
	return cid;
}

