'use strict';

/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/


/*
	Emitter, general event emitter class.
	So i dont have to use the node one ( my interface is superior :)))))))
	
	constructor arguments: 
	
	eventSink - function, optional - this is a default handler where all events
		that do not have handlers will be sent, but with the event type as first
		argument.
	
	Provides this interface:
	.on( eventTypeStr, listenerFn ), returns idStr for use in .off
		Listen for event of type
		
	.once( eventTypeStr, listenerFn ), no return value
		Listen for one event of type, then the listener is released
		
	.off( idStr ), return successBool
		Stop listening for event. idStr is the return value from .on
		
	.release( type ), type is optional. Release events of type,
		or all events. No return value
		
	.emit( type, ...arguments ), returns null if event was emitted,
		otherwise returns a object with 'type' and arguments[]
		Arguments are applied to all registered listeners of the specified type.
*/

const log = require( './Log' )( 'Emitter' );
const uuid = require( './UuidPrefix' )( 'listener' );

var ns = {};

ns.Emitter = function( eventSink ) {
	if ( !( this instanceof ns.Emitter ))
		return new ns.Emitter( eventSink );
	
	const self = this;
	self._emitterEvent2ListenerId = {};
	self._emitterListeners = {};
	self._emitterEventSink = eventSink;
}

// first argument must be the event type, a string,
// send as many extra arguments as you wish, they will be passed to the handler
// no params, you say? its voodoo magic, aka 'arguments' object
ns.Emitter.prototype.emit = function() {
	const self = this;
	//var args = arguments;
	const args = self._getArgs( arguments );
	var event = args.shift(); // first arguments passed to .emit()
	// as an array that will be .apply to the listener
	
	const listenerIds = self._emitterEvent2ListenerId[ event ];
	if ( !listenerIds || !listenerIds.length ) {
		if ( self._emitterEventSink ) {
			args.unshift( event );
			self._emitterEventSink.apply( null, args );
		}
		
		const unknownEvent = {
			type : event,
			arguments : args,
		}
		return unknownEvent;
	}
	
	listenerIds.forEach( sendOnListener );
	return null;
	function sendOnListener( id ) {
		var listener = self._emitterListeners[ id ];
		if ( !listener ) {
			log( 'emit - getSub - no listener for id',
				{ id: id, listener : self._emitterListeners });
			return;
		}
		
		listener.apply( null, args );
	}
}

ns.Emitter.prototype.on = function( event, listener ) {
	const self = this;
	var id = uuid.v4();
	var eventListenerIds = self._emitterEvent2ListenerId[ event ];
	if ( !eventListenerIds ) {
		eventListenerIds = [];
		self._emitterEvent2ListenerId[ event ] = eventListenerIds;
	}
	
	eventListenerIds.push( id );
	self._emitterListeners[ id ] = listener;
	
	return id;
}

ns.Emitter.prototype.once = function( event, listener ) {
	const self = this;
	var onceieId = self.on( event, onceie );
	
	function onceie( eventData ) {
		listener( eventData );
		self.off( onceieId );
	}
}

ns.Emitter.prototype.off = function( removeListenerId ) {
	const self = this;
	var events = Object.keys( self._emitterEvent2ListenerId );
	events.forEach( search );
	function search( event ) {
		var listenerIdArr = self._emitterEvent2ListenerId[ event ];
		var listenerIdIndex = listenerIdArr.indexOf( removeListenerId );
		if ( listenerIdIndex === -1 )
			return false;
		
		self._emitterEvent2ListenerId[ event ].splice( listenerIdIndex, 1 );
		delete self._emitterListeners[ removeListenerId ];
		return true;
	}
}

ns.Emitter.prototype.release = function( eventName ) {
	const self = this;
	if ( !eventName )
		releaseAll();
	else
		releaseAllOfType( eventName );
	
	function releaseAll() {
		self._emitterEvent2ListenerId = {};
		self._emitterListeners = {};
	}
	
	function releaseAllOfType( name ) {
		var idArr = self._emitterEvent2ListenerId[ name ];
		if ( !idArr || !idArr.length )
			return;
		
		idArr.forEach( remove );
		delete self._emitterEvent2ListenerId[ name ];
		
		function remove( id ) {
			delete self._emitterListeners[ id ];
		}
	}
}

ns.Emitter.prototype._getArgs = function( argObj ) {
	const self = this;
	const args = [];
	let len = argObj.length;
	while( len-- )
		args[ len ] = argObj[ len ];
	
	return args;
}

ns.Emitter.prototype.emitterClose = function() {
	const self = this;
	self.release();
	delete self._emitterEventSink;
}


// EventNode
const nlog = require( './Log' )( 'EventNode' );
ns.EventNode = function( type, conn, sink ) {
	const self = this;
	self._eventNodeType = type;
	self._eventNodeConn = conn;
	self._eventNodeSink = sink;
	
	self.init();
}

ns.EventNode.prototype.eventNodeInit = function() {
	const self = this;
	nlog( 'init' );
}

module.exports = ns;
