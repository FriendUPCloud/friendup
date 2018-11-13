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


const log = require( './Log' )( 'Session' );
const Emitter = require( './Events' ).Emitter;
const util = require( 'util' );

const ns = {};
ns.Session = function( id, onclose ) {
	const self = this;
	self.id = id;
	self.onclose = onclose;
	
	self.sessionTimeout = 1000 * 1;
	self.sessionTimer = null;
	self.connections = {};
	self.connIds = [];
	
	self.isPublic = false;
	self.subscribers = [];
	self.subscriptions = [];
	self.meta = {};
	
	Emitter.call( self );
	
	self.init();
}

util.inherits( ns.Session, Emitter );

// Public

// system attaches a new client connection
ns.Session.prototype.attach = function( conn ) {
	const self = this;
	log( 'attach', conn.id );
	if ( !conn )
		return;
	
	if ( self.sessionTimer ) {
		clearTimeout( self.sessionTimer );
		self.sessionTimer = null;
	}
	
	const cid = conn.id;
	self.connections[ cid ] = conn;
	self.connIds.push( cid );
	conn.on( 'event', handleEvent );
	conn.setSession( self.id );
	
	function handleEvent( e ) { self.handleEvent( e, cid ); }
}

// system detaches a ( most likely closed ) client connection
ns.Session.prototype.detach = function( cid, callback ) {
	const self = this;
	log( 'detach', cid );
	const conn = self.connections[ cid ];
	if ( !conn ) {
		if ( callback )
			callback( null );
		return;
	}
	
	conn.unsetSession( setBack );
	function setBack() {
		conn.release( 'event' );
		delete self.connections[ cid ];
		self.connIds = Object.keys( self.connections );
		if ( !self.checkConnsTimeout )
			self.checkConnsTimeout = setTimeout( checkConns, 1000 );
		
		if ( callback )
			callback( conn );
	}
	
	function checkConns() {
		self.checkConns();
	}
}

ns.Session.prototype.getMeta = function() {
	const self = this;
	let meta = self.meta || {};
	meta.hostId = self.id;
	meta.isPublic = self.isPublic;
	return meta;
}

ns.Session.prototype.updateMeta = function( conf ) {
	const self = this;
	log( 'updateMeta', conf );
	if ( !conf )
		return;
	
	if ( 'string' === typeof( conf.name ))
		self.meta.name = conf.name;
	
	if ( 'string' === typeof( conf.description ))
		self.meta.description = conf.description;
	
	if ( 'string' === typeof( conf.imagePath ))
		self.meta.imagePath = conf.imagePath;
	
	self.meta.info = conf.info || self.meta.info;
	
	if ( conf.apps && conf.apps.forEach )
		conf.apps.forEach( item => self.exposeApp( item ))
	
}

ns.Session.prototype.subscribe = function( hostId ) {
	const self = this;
	let subbed = -1;
	subbed = self.subscribers.indexOf( hostId );
	if ( -1 !== subbed )
		return false;
	
	self.subscribers.push( hostId );
	return true;
}

ns.Session.prototype.unsubscribe = function( hostId ) {
	const self = this;
	self.subscribers = self.subscribers.filter( id => id !== hostId );
}

ns.Session.prototype.subAdded = function( hostId ) {
	const self = this;
	let added = self.subscriptions.indexOf( hostId );
	if ( -1 !== added )
		return false;
	
	self.subscriptions.push( hostId );
	return true;
}

ns.Session.prototype.subRemoved = function( hostId ) {
	const self = this;
	self.subscriptions = self.subscriptions.filter( id => id !== hostId );
}

ns.Session.prototype.exposeApp = function( app ) {
	const self = this;
	if ( !app )
		return null;
	
	if ( !self.meta.apps || !self.meta.apps.forEach )
		self.meta.apps = [];
	
	const parsed =  parse( app );
	if ( !parsed )
		return null;
	
	self.meta.apps.push( parsed );
	return self.meta.apps;
	
	function parse( item ) {
		if ( !item.id || !( 'string' === typeof( item.id )) )
			return null;
		
		let id = item.id;
		let type = '';
		let name = '';
		let desc = '';
		if ( item.type && item.type.toString )
			type = item.type.toString();
		
		if ( item.name && item.name.toString )
			name = item.name.toString();
		
		if ( item.description && item.description.toString )
			desc = item.description.toString();
		
		return {
			id          : id,
			type        : type,
			name        : name,
			description : desc,
			info        : item.info || undefined,
		}
	}
}

ns.Session.prototype.concealApp = function( appId ) {
	const self = this;
	if ( !appId || 'string' !== typeof( appId ))
		return null;
	
	if ( !self.meta.apps || !self.meta.apps.forEach ) {
		self.meta.apps = [];
		return self.meta.apps;
	}
	
	self.meta.apps = self.meta.apps.filter( notAppId );
	return self.meta.apps;
	
	function notAppId( item ) {
		return item.id !== appId;
	}
}

// sends events to client(s), clientId is optional
ns.Session.prototype.send = function( event, clientId, callback ) {
	const self = this;
	
	if ( null != clientId )
		self.sendOnConn( event, clientId, callback );
	else
		self.broadcast( event, callback );
}

// closes session, either from account( logout ), from lack of client connections
// or from nomansland for whatever reason
ns.Session.prototype.close = function() {
	log( 'close' );
	const self = this;
	if ( self.checkConnsTimeout )
		clearTimeout( self.checkConnsTimeout );
	
	if ( self.sessionTimer ) {
		clearTimeout( self.sessionTimer );
		self.sessionTimer = null;
	}
	
	const onclose = self.onclose;
	delete self.onclose;
	
	self.emitterClose();
	self.clearConns();
	
	if ( onclose )
		onclose();
}

// Private

ns.Session.prototype.init = function() {
	const self = this;
	log( 'init ' );
}

ns.Session.prototype.handleEvent = function( event, clientId ) {
	const self = this;
	self.emit(
		event.type,
		event.data,
		clientId
	);
}

ns.Session.prototype.broadcast = function( event, callback ) {
	const self = this;
	const lastIndex = ( self.connIds.length -1 );
	self.connIds.forEach( sendTo );
	function sendTo( cid, index ) {
		if ( index === lastIndex )
			self.sendOnConn( event, cid, callback );
		else
			self.sendOnConn( event, cid );
	}
}

ns.Session.prototype.sendOnConn = function( event, cid, callback ) {
	const self = this;
	const conn = self.connections[ cid ];
	if ( !conn ) {
		log( 'no conn for id', {
			cid   : cid,
			conns : self.connections }, 3 );
		if ( callback )
			callback();
		return;
	}
	
	conn.send( event, null, callback );
}

ns.Session.prototype.checkConns = function() {
	const self = this;
	self.checkConnsTimeout = null;
	if ( self.connIds.length )
		return;
	
	self.sessionTimer = setTimeout( sessionTimedOut, self.sessionTimeout );
	function sessionTimedOut() {
		self.sessionTimer = null;
		self.close();
	}
}

ns.Session.prototype.clearConns = function() {
	const self = this;
	self.connIds.forEach( unsetSession );
	self.connections = {};
	self.connIds = [];
	
	function unsetSession( cid ) {
		const conn = self.connections[ cid ];
		if ( !conn )
			return;
		
		conn.unsetSession();
	}
}

module.exports = ns.Session;
