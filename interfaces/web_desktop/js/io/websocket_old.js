/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/* Websocket class */

FriendWebSocket = function( config ) 
{
	if( !config )
	{
		// TODO: Configurable port
		config = { url: 'ws://' + ( document.location.href.match( /http[s]{0,1}\:\/\/([^/:]+)/i )[1] ) + ':6500', protocol: 'ws' };
	}
	
	var self = this;
	self.ws = null;
	self.url = config.url;
	self.protocol = config.protocol;
	self.onopenSubscribers = [ self.onConnect ];
	self.oncloseSubscribers = [ self.onClose ];
	self.onerrorSubscribers = [ self.onError ];
	self.onmessageSubscribers = [];
	self.handlers = {
		open: self.onopenSubscribers,
		close: self.oncloseSubscribers,
		error: self.onerrorSubscribers,
		message: self.onmessageSubscribers
	};
	self.mesageIdCounter = 0;
	self.mesageCallbacks = {};

	self.pingInterval = 0;
	
	self.connect();
}

// Connect 
FriendWebSocket.prototype.connect = function( url, protocol ) 
{
	var self = this;
	
	if( url )      this.url = url;
	if( protocol ) this.protocol = protocol;
	
	if ( self.ws ) 
	{
		self.reconnect();
		return;
	}
	
	try 
	{
		// todo
		self.ws = new window.WebSocket(
			url ? url : self.url,
			'FC-protocol'
		);
		self.attachListeners();
	} 
	catch( e ) 
	{
		self.dumpException( e, 'connect' );
	}
}
	
FriendWebSocket.prototype.reconnect = function() 
{
	var self = this;
	
	if( self.ws && self.ws.readyState == WebSocket.OPEN )
	{
		self.ws.close();
	}
	delete self.ws;
	
	self.connect();
}
	
FriendWebSocket.prototype.attachListeners = function() 
{
	var self = this;
	self.ws.onopen = eventHandler;
	self.ws.onmessage = onMessage;
	self.ws.onclose = eventHandler;
	self.ws.onerror = eventHandler;

	function eventHandler( e ) { self.socketEvent( e ); }
	function onMessage( e ) { self.messageEvent( e ); }
}
	
FriendWebSocket.prototype.on = function( event, callback ) 
{
	var self = this;
	
	if( !self.handlers[ event ] ) 
	{
		console.log( 'invalid event ' + event );
		return;
	}
	
	self.handlers[ event ].push( callback );
}
	
FriendWebSocket.prototype.off = function( event, callback )
{
	var self = this;
	
	var subscribers = self.handlers[ event ];
	if( !subscribers )
	{
		console.log( 'invalid event ', event );
		return;
	}
	
	var callbackIndex = -1;
	subscribers.forEach( isCallback );
	function isCallback( fn, index )
	{
		if ( fn == callback )
			callbackIndex = index;
	}
	
	if ( callbackIndex == -1 )
	{
		console.log( 'callback not found', { e: event, callback: callback } );
		return;
	}
	
	self.handlers[ event ] = subscribers.splice( callbackIndex, 1 );
}

FriendWebSocket.prototype.sendPing = function()
{
	var self = this;
	setTimeout(function()
	{
		self.send(
			{
				'cmd':'ping'
			},
			function( obj )
			{
				self.sendPing();
			}
		);
	}, 5000);
}

FriendWebSocket.prototype.onConnect = function( self, e )
{
	//console.log("Connected");
	self.sendPing();
}

FriendWebSocket.prototype.onClose = function( self, e )
{
	//console.log("Closed");
}

FriendWebSocket.prototype.onError = function( self, e )
{
	console.log("Error");
}
	
FriendWebSocket.prototype.messageEvent = function( e ) 
{
	var self = this;
	var msgObj = self.objectify( e.data );
	//console.log(msgObj);
	if( !msgObj )
	{
		console.log( 'event has no or invalid data ( could not json ):');
		console.log( e );
		return;
	}

	if( msgObj.id != null && self.mesageCallbacks[ msgObj.id ] != null )
		self.mesageCallbacks[ msgObj.id ]( msgObj );
	
	self.handlers[ e.type ].forEach( emitTo )
	function emitTo( handler )
	{
		handler( msgObj );
	}
}

FriendWebSocket.prototype.socketEvent = function( e ) 
{
	var self = this;
	var type = e.type;
	if( !self.handlers[ type ] )
	{
		console.log( 'handler collection not found for ' + type );
		return;
	}

	
	self.handlers[ type ].forEach( emitTo );
	function emitTo( handler )
	{
		handler( self, e );
	}
}

FriendWebSocket.prototype.send = function( msgObj, callback ) 
{
	var self = this;
	
	// If we have a callback function, keep it with the message ID, so we can
	// call it when we get a response
	if(callback != null)
		self.mesageCallbacks[self.mesageIdCounter] = callback;
	
	// Re-package the message object
	var o = { 'id': self.mesageIdCounter, 'req': msgObj };
	self.mesageIdCounter++;

	// Send the message
	var msgStr = self.stringify( o );
	try
	{
		//console.log( msgStr );
		this.ws.send( msgStr );
	}
	catch (e)
	{
		self.dumpException( e, 'send' );
	}
}
	
FriendWebSocket.prototype.close = function(code, reason) 
{
	var code = code || 1000;
	try
	{
		this.ws.close( code, reason );
	} 
	catch (e)
	{
		dumpException( e, 'close');
	}
}
	
FriendWebSocket.prototype.dumpException = function(e, fnName) 
{
	var self = this;
	console.log( 'We have a socket.' + fnName + '() exception: ' );
	console.log( e );
}
	
FriendWebSocket.prototype.stringify = function( obj ) 
{
	var self = this;
	try
	{
		return JSON.stringify( obj );
	}
	catch (e)
	{
		return obj.toString(); // not a object? probably has .toString() then.. #YOLO 360 NO-SCOPE
	}
}
	
FriendWebSocket.prototype.objectify = function( string ) 
{
	var self = this;
	try
	{
		return JSON.parse( string );
	}
	catch(e)
	{
		return null;
	}
}

