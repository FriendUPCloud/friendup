/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/* EVENT EMITTER

For prototype extension. Your object gains the ability to emit events 
to listeners registered through this interface

*/

function EventEmitter( eventSink ) {
	if ( !( this instanceof EventEmitter ))
		return new EventEmitter();
	
	var self = this;
	self._eventSink = eventSink;
	self.eventToListener = {};
	self.eventListeners = {};
	
	self._eventEmitterInit();
}


// Added to objects public interface

EventEmitter.prototype.on = function( event, listener )
{
	var self = this;
	var id = friendUP.tool.uid( 'listener' );
	var listenerIds = self.eventToListener[ event ];
	if ( !listenerIds ) {
		self.eventToListener[ event ] = [];
	}
	
	self.eventToListener[ event ].push( id );
	self.eventListeners[ id ] = listener;
	
	return id;
}

EventEmitter.prototype.once = function( event, listener )
{
	var self = this;
	var onceieId = self.on( event, onceie );
	
	function onceie( arrrgs ) {
		var args = self._getArgs( arguments );
		listener.apply( null, args );
		self.off( onceieId );
	}
}

EventEmitter.prototype.off = function( listenerId )
{
	var self = this;
	var listener = self.eventListeners[ listenerId ];
	if ( !listener )
		return;
	
	// remove from listener map
	delete self.eventListeners[ listenerId ];
	
	// remove from events listener id list
	var events = Object.keys( self.eventToListener );
	events.some( searchListenerIdList );
	function searchListenerIdList( event )
	{
		var listenerIds = self.eventToListener[ event ];
		var index = listenerIds.indexOf( listenerId );
		if ( index === -1 )
			return false;
		
		removeListener( event, index );
		return true;
	}
	
	function removeListener( event, index )
	{
		self.eventToListener[ event ].splice( index, 1 );
	}
}

EventEmitter.prototype.release = function( type )
{
	var self = this;
	if ( !type )
		all();
	else
		ofType( type );
	
	function all()
	{
		self.eventListeners = {};
		self.eventToListener = {};
	}
	
	function ofType( type )
	{
		var lids = self.eventToListener[ type ];
		if ( !lids || !lids.length )
			return;
		
		lids.forEach( remove );
		delete self.eventToListener[ type ];
		
		function remove( lid )
		{
			delete self.eventListeners[ lid ];
		}
	}
}

// Object public

// emit can take any number of arguments
// the first MUST be the event type / listener id
// all extra arguments will be passed on to the handler
EventEmitter.prototype.emit = function()
{
	var self = this;
	var args = self._getArgs( arguments );
	var event = args.shift();
	var listenerIds = self.eventToListener[ event ];
	if ( !listenerIds || !listenerIds.length ) {
		if ( self._eventSink )
			emitOnDefault( event, args );
		
		return;
	}
	
	listenerIds.forEach( emit );
	function emit( listenerId )
	{
		var listener = self.eventListeners[ listenerId ];
		if ( 'function' !== typeof( listener )) {
			if ( self._eventSink )
				emitOnDefault( event, args );
			
			return;
		}
		
		listener.apply( null, args );
	}
	
	function emitOnDefault( type, args )
	{
		args.unshift( type );
		self._eventSink.apply( null, args );
	}
}

EventEmitter.prototype.closeEventEmitter = function()
{
	var self = this;
	self.release();
	delete self._eventSink;
}

// Private

EventEmitter.prototype._eventEmitterInit = function()
{
	var self = this;
	// dont remove this, js is weird
}

EventEmitter.prototype._getArgs = function( argObj ) {
	var self = this;
	var args = [];
	var len = argObj.length;
	while( len-- )
		args[ len ] = argObj[ len ];
	
	return args;
}


/* EventNode

type - event to listen for on conn, and what to wrap in before sending up the tree
conn - root event source
eventSink - events are sent here if there is no handler,
onsend - callback, replaces conn in some usecases
	where a conn does not make sense or is unavailable ( ex: root of event tree )
	
inherits from EventEmitter
*/
function EventNode(
	type,
	conn,
	eventSink,
	onsend
) {
	var self = this;
	self.type = type || null;
	self.conn = conn || null;
	self.onsend = onsend;
	
	EventEmitter.call( self, eventSink );
	console.log( 'eventNode', self );
	self.initEventNode();
}

EventNode.prototype = Object.create( EventEmitter.prototype );

// public

// to root
EventNode.prototype.send = function( event ) {
	var self = this;
	if ( !self.sendEvent )
		return;
	
	if ( !self.type )
		wrap = event;
	else
		var wrap = {
			type : self.type,
			data : event,
		};
	
	self.sendEvent( wrap );
}

// insert event, as if its coming from root ( emit to branches )
EventNode.prototype.handle = function( event ) {
	var self = this;
	self.emit( event.type, event.data );
}

EventNode.prototype.close = function() {
	var self = this;
	if ( self.conn )
		self.conn.release( self.type );
	
	delete self.sendEvent;
	delete self.onsend;
}

// Private

EventNode.prototype.initEventNode = function() {
	var self = this;
	if ( self.conn && self.type ) {
		self.conn.on( self.type, handle );
		function handle( e ) { self.handle( e ); }
	}
	
	if ( self.onsend )
		self.sendEvent = sendOnHandler;
	else
		self.sendEvent = sendOnConn;
	
	function sendOnHandler( event ) {
		if ( self.onsend )
			self.onsend( event );
	}
	
	function sendOnConn( event ) {
		if ( self.conn )
			self.conn.send( event );
	}
}

