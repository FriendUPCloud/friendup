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

FAPConn = function()
{
	// TODO read stuff from conf / pass in conf
	if ( !Application.authId )
		throw new Error( 'FAPConn - Application.authId is not defined' );
		
	var self = this;
	self.host = document.location.hostname;
	self.port = 6500;
	self.useHttps = true;
	self.authId = Application.authId;
	
	self.ws = null;
	
	self.listeners = {};
	self.listenerMap = {};
	
	console.log( 'FAPConn', self );
	self.init();
}

// Public

FAPConn.prototype.request = function( conf, callback )
{
	var self = this;
	var reqId = self.setRequestCallback( callback );
	req = {
		type : 'request',
		requestid : reqId,
		path : conf.path,
		data : conf.data,
		authid : self.authId,
	};
	//req = self.setId( req, conf );
	console.log( 'FAPConn.request', req );
	self.sendMessage( req );
}

FAPConn.prototype.send = function( conf )
{
	var self = this;
	var event = {
		type : 'event',
		path : conf.path,
		data : conf.data,
		authid : self.authId,
	};
	
	// messages from 
	//event = self.setId( event, conf );
	console.log( 'FAPConn.send', event );
	self.sendMessage( event );
}

FAPConn.prototype.on = function( event, listener )
{
	var self = this;
	if ( !self.listeners[ event ])
		self.listeners[ event ] = [];
	
	var listenerId = friendUP.tool.uid( 'listener' );
	self.listenerMap[ listenerId ] = listener;
	self.listeners[ event ].push( listenerId );
	return listenerId;
}

FAPConn.prototype.once = function( event, listener )
{
	var self = this;
	var id = self.on( event, onceie );
	
	function onceie( data ) {
		self.off( event, id );
		listener( data );
	}
}

FAPConn.prototype.off = function( event, id )
{
	var self = this;
	if ( !self.listenerMap[ id ]) {
		console.log( 'FAPConn.off - listenerId not found',
			{ id : id, listenerMap : self.listenerMap });
		return;
	}
	
	delete self.listenerMap[ id ];
	
	var eventIds = self.listeners[ event ];
	if ( !eventIds || !eventIds.length ) {
		console.log( 'FAPConn.off - event not found',
			{ e : event, listenerMap : self.listeners });
		return;
	}
	
	var index = eventIds.indexOf( id );
	if ( -1 === index ) {
		console.log( 'FAPConn.off - id not found for event',
			{ id : id, event : self.listeners });
		return;
	}
	
	console.log( 'FAPConn.off - found id, removing', {
		id : id,
		event : event,
		index : index,
		eventIds : eventIds,
	});
	self.listeners[ event ].splice( index, 1 );
}

FAPConn.prototype.release = function()
{
	var self = this;
	for ( var lId in self.listenerMap )
		delete self.listeners[ lId ];
	
	for ( var event in self.listeners )
		delete self.listeners[ event ];
	
	self.listenerMap = {};
	self.listeners = {};
}

FAPConn.prototype.close = function()
{
	var self = this;
	self.ws.close();
	self.release();
	self.host = null;
	self.port = null;
	self.useHttps = null;
	self.authId = null;
}

// Private

FAPConn.prototype.init = function()
{
	var self = this;
	self.connectWebSocket();
}

FAPConn.prototype.connectWebSocket = function()
{
	var self = this;
	var url = null;
	if ( self.url )
		url = self.url;
	else
		url = buildURL();
	
	var conf = {
		url : url,
		authId : self.authId,
		onmessage : onMessage,
		onstate : onState,
		onend : onEnd,
	};
	self.ws = new FriendWebSocket( conf );
	
	function onMessage( e ) { self.onWsMessage( e ); }
	function onState( e ) { self.onWsState( e ); }
	function onEnd( e ) { self.onWsEnd( e ); }
	
	function buildURL() {
		var protocol = self.useHttps ? 'wss://' : 'ws://';
		var url = protocol + self.host;
		if ( self.port )
			url += ':' + self.port;
		
		return url;
	}
}

FAPConn.prototype.setId = function( event, conf )
{
	var self = this;
	event.authid = self.authId;
	return event;
}

FAPConn.prototype.onWsMessage = function( msg )
{
	var self = this;
	if ( msg.type === self.authId ) {
		console.log( 'onWsMessage - type matched authid, stripping layer', {
			msg : msg,
			authId : self.authId });
		
		msg = msg.data;
	}
	
	if ( 'response' === msg.type )
		handleResponse( msg );
	else
		handleEvent( msg );
	
	function handleEvent( msg )
	{
		var event = msg.type;
		var lIds = self.listeners[ event ];
		if ( !lIds ) {
			console.log( 'FAPConn - handler ids not found for', {
				msg : msg,
				event : event,
				listeners : self.listeners,
			});
			return;
		}
		
		lIds.forEach( callHandler )
		function callHandler( id )
		{
			var handler = self.listenerMap[ id ];
			if ( !handler ) {
				console.log( 'FAPConn - no handler for id', {
					id : id,
					map : self.listenerMap,
				});
				return;
			}
			
			handler( msg.data );
		}
	}
	
	function handleResponse( msg ) {
		var id = msg.requestid;
		var handler = self.listenerMap[ id ];
		if ( !id || !handler ) {
			console.log( 'FAPConn - stuff missing', {
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

FAPConn.prototype.onWsState = function( e )
{
	var self = this;
	console.log( 'onWsState', e );
}

FAPConn.prototype.onWsEnd = function( e )
{
	var self = this;
	console.log( 'onWsEnd', e );
}

FAPConn.prototype.sendMessage = function( msg )
{
	var self = this;
	if ( !self.ws )
	{
		console.log( 'FAPConn.sendMessage - no ws found, sending async', msg );
		self.sendAsync( msg );
		return;
	}
	
	self.ws.send( msg );
}

FAPConn.prototype.sendAsync = function( msg )
{
	var self = this;
	console.log( 'sendAsync - NYI', msg );
}

FAPConn.prototype.setRequestCallback = function( callback )
{
	var self = this;
	var cid = friendUP.tool.uid( 'fconn-req' );
	self.listenerMap[ cid ] = callback;
	return cid;
}

