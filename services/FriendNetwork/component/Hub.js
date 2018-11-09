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

ERR_FN_INVALID_HOSTID  : Host ID is not invalid
ERR_FN_INVALID_APPDATA : Data is not valid
ERR_FN_P2P_DENIED      : Remote host declined the p2p connection

*/


const log = require( './Log' )( 'Hub' );
const uuid = require( './UuidPrefix')();
const ns = {};

ns.Hub = function() {
	const self = this;
	self.sessions = {};
	self.sessionIds = [];
	
	self.init();
}

// 'Public'

ns.Hub.prototype.connect = function( session )
{
	const self = this;
	log( 'connect', session.id );
	const sid = session.id;
	self.sessions[ sid ] = session;
	self.sessionIds.push( sid );
	self.bind( sid );
	const open = {
		type : 'connopen',
		data : sid,
	};
	self.send( null, open, sid );
}

ns.Hub.prototype.disconnect = function( sessionId )
{
	const self = this;
	log( 'disconnect', sessionId );
	self.release( sessionId );
	delete self.sessions[ sessionId ];
	self.sessionIds = Object.keys( self.sessions );
	
	const closed = {
		type : 'host-closed',
		data : {
			hostId : sessionId,
		},
	};
	self.sessionIds.forEach( toId => {
		if ( toId === sessionId )
			return;
		
		self.send( null, closed, toId );
	});
}

// Priv

ns.Hub.prototype.init = function()
{
	const self = this;
	log( 'init' );
	self.requestMap = {
		'hosts'       : hosts,
		'publik'      : publik,
		'privat'      : privat,
		'expose'      : expose,
		'conceal'     : conceal,
		'connect'     : connect,
		'disconnect'  : disconnect,
		'subscribe'   : subscribe,
		'unsubscribe' : unsubscribe,
	};
	
	function hosts( e, rid, sid ) { self.handleHosts( e, rid, sid ); }
	function publik( e , rid, sid ) { self.handlePublik( e, rid, sid ); }
	function privat( e , rid, sid ) { self.handlePrivat( e, rid, sid ); }
	function expose( e, rid, sid ) { self.handleExpose( e, rid, sid ); }
	function conceal( e, rid, sid ) { self.handleConceal( e, rid, sid ); }
	function connect( e, rid, sid ) { self.handleConnect( e, rid, sid ) ; }
	function disconnect( e, rid, sid ) { self.handleDisconnect( e, rid, sid ) ; }
	function subscribe( e , rid, sid ) { self.handleSubscribe( e, rid, sid ); }
	function unsubscribe( e , rid, sid ) { self.handleUnsubscribe( e, rid, sid ); }
}

ns.Hub.prototype.bind = function( sid )
{
	const self = this;
	const session = self.sessions[ sid ];
	if ( !session )
		return;
	
	session._emitterEventSink = toHost; // Hacky mcHackface
	session.on( 'request', request );
	session.on( 'meta', meta );
	
	function toHost( host, event ) { self.toHost( host, event, sid ); }
	//function event( e ) { self.handleEvent( e, sid ); }
	function request( e ) { self.handleRequest( e, sid ); }
	function meta( e ) { self.handleMeta( e, sid ); }
}

ns.Hub.prototype.release =  function( sid )
{
	const self = this;
	const session = self.sessions[ sid ];
	if ( !session )
		return;
	
	log( 'release' );
	delete session._emitterEventSink;
	session.release( 'request' );
	//session.release( 'expose' );
	//session.release( 'conceal' );
	session.release( 'meta' );
}

ns.Hub.prototype.handleRequest = function( event, sid )
{
	const self = this;
	log( 'handleRequest', {
		req : event,
		sid : sid, });
	const rid = event.id;
	const req = event.req;
	const handler = self.requestMap[ req.type ];
	if ( !handler ) {
		log( 'handleRequest - no handler for', event );
		return;
	}
	
	handler( req.data, rid, sid );
}

ns.Hub.prototype.handleHosts = function( e, rid, sid )
{
	const self = this;
	let hosts = [];
	if ( self.sessionIds.length )
		hosts = self.sessionIds.map( buildHostInfo );
	
	hosts = hosts.filter( item => !!item );
	self.respond( rid, null, hosts, sid );
	
	function buildHostInfo( sid ) {
		const session = self.sessions[ sid ];
		if ( !session )
			return null;
		
		return session.getMeta();
		/*
		const meta = session.meta;
		meta.hostId = sid;
		meta.isPublic = session.isPublic;
		return meta;
		*/
	}
}

ns.Hub.prototype.handlePublik = function( event, rid, sid )
{
	const self = this;
	log( 'handlePublik', event );
	const session = self.sessions[ sid ];
	if ( !session )
		return;
	
	session.isPublic = true;
	const res = {
		isPublic : true,
	};
	self.respond( rid, null, res, sid );
}

ns.Hub.prototype.handlePrivat = function( event, rid, sid )
{
	const self = this;
	log( 'handlePrivat', event );
	const session = self.sessions[ sid ];
	if ( !session )
		return;
	
	session.isPublic = false;
	const res = {
		isPublic : false,
	};
	self.respond( rid, null, res, sid );
}

ns.Hub.prototype.handleSubscribe = function( hostId, rid, sid )
{
	const self = this;
	log( 'handleSubscribe', hostId );
	if ( !hostId )
		return;
	
	const sender = self.sessions[ sid ];
	if ( !sender )
		return;
	
	const remote = self.sessions[ hostId ];
	if ( !remote ) {
		self.respond( rid, 'ERR_FN_INVALID_HOSTID', null, sid );
		return;
	}
	
	const added = remote.subscribe( sid );
	if ( added )
		sender.subAdded( hostId );
	
	self.respond( rid, null, sender.subscriptions, sid );
}

ns.Hub.prototype.handleUnsubscribe = function( hostId, rid, sid )
{
	const self = this;
	log( 'handleUnsubscribe', hostId );
	if ( !hostId )
		return;
	
	const sender = self.sessions[ sid ];
	if ( !sender )
		return;
	
	const remote = self.sessions[ hostId ];
	if ( !remote ) {
		self.respond( rid, 'ERR_FN_INVALID_HOSTID', null, sid );
		return;
	}
	
	const removed = remote.unsubscribe( sid );
	if ( removed )
		sender.subRemoved( hostId );
	
	self.respond( rid, null, sender.subscriptions, sid );
}

ns.Hub.prototype.handleExpose = function( app, rid, sid )
{
	const self = this;
	log( 'handleExpose', app );
	if ( !app )
		return;
	
	const session = self.sessions[ sid ];
	if ( !session )
		return;
	
	const current = session.exposeApp( app );
	if ( !current ) {
		self.respond( rid, 'ERR_FN_INVALID_APPDATA', app, sid );
		return;
	}
	
	const exposed = {
		type : 'apps',
		data : current,
	};
	self.broadcast( sid, exposed );
	self.respond( rid, null, current, sid );
}

ns.Hub.prototype.handleConceal = function( appId, rid, sid )
{
	const self = this;
	log( 'handleConceal', appId );
	const session = self.sessions[ sid ];
	if ( !session )
		return;
	
	const current = session.concealApp( appId );
	if ( null == current ) {
		self.respond( rid, 'ERR_FN_INVALID_DATA', appId, sid );
		return;
	}
	
	const exposed = {
		type : 'apps',
		data : current,
	};
	self.broadcast( sid, exposed );
	self.respond( rid, null, current, sid );
}

ns.Hub.prototype.handleConnect = function( event, rid, sid )
{
	const self = this;
	log( 'handleconnect', event );
	if ( !valid( event )) {
		self.respond( rid, 'ERR_FN_INVALID_DATA', event, sid );
		return;
	}
	
	const source = event.source;
	const target = event.target;
	
	// ask remote host
	const req = {
		sourceHost : sid,
		sourceApp  : source.appId || null,
		options    : event.options || null,
	};
	
	self.hostRequest( target.hostId, target.appId, 'connect', req, connReply );
	function connReply( res, remoteRid, remoteSid ) {
		log( 'handleConnect - connReply', res );
		
		// remote host denied
		if ( !res.accept ) {
			self.respond( remoteRid, null, null, remoteSid );
			self.respond( rid, 'ERR_FN_P2P_DENIED', null, sid );
			return;
		}
		
		// remote accepted
		const signal = {
			signalId : uuid.get( 'peer' ),
			rtc      : global.config.shared.rtc,
			options  : res.options,
		};
		
		log( 'signal', signal );
		self.respond( remoteRid, null, signal, remoteSid );
		self.respond( rid, null, signal, sid );
	}
	
	function valid( event ) {
		if ( !event.source || !event.target )
			return false;
		
		// source appId is optional, but lets check type if its defined
		let s = event.source;
		if ( s.appId && !isString( s.appId ) )
			return false;
		
		// hostId required, appId optional
		let t = event.target;
		if ( !t.hostId || !isString( t.hostId ))
			return false;
		
		if ( t.appId && !isString( t.appId ))
			return false;
		
		return true;
		
		function isString( item ) {
			return 'string' === typeof( item );
		}
	}
}

ns.Hub.prototype.handleDisconnect = function( event, rid, sid )
{
	const self = this;
	log( 'handledisconnect', event );
}

ns.Hub.prototype.handleMeta = function( conf, sid )
{
	const self = this;
	const session = self.sessions[ sid ];
	if ( !session )
		return;
	
	session.updateMeta( conf );
	
	const update = {
		type : 'host-update',
		data : session.getMeta(),
	};
	self.sessionIds.forEach( toId => {
		if ( toId === sid )
			return;
		
		self.send( null, update, toId );
	});
}

ns.Hub.prototype.toHost = function( host, event, sid )
{
	const self = this;
	/*
	log( 'toHost', {
		host  : host,
		event : event,
		sid   : sid,
	});
	*/
	// if no host, broadcast
	if ( null == host )
		self.broadcast( sid, event );
	else
		self.send( sid, event, host );
	
}

ns.Hub.prototype.hostRequest = function(
	hostId,
	appId,
	type,
	data,
	callback
) {
	const self = this;
	const replyId = uuid.get( 'reply' );
	let req = {
		type : type,
		data : {
			type : replyId,
			data : data,
		},
	};
	
	// wrap in appId so it gets routed to the app
	if ( null != appId )
		req = {
			type : appId,
			data : req,
		};
		
	
	/*
	const session = self.sessions[ hostId ];
	if ( !session ) {
		log( 'hostRequest - no session found for host', hostId );
		return;
	}
	
	session.once( replyId, callback );
	*/
	self.requestMap[ replyId ] = response;
	self.send( null, req, hostId );
	
	function response( event, rid, sid ) {
		delete self.requestMap[ replyId ];
		callback( event, rid, sid );
	}
}

/* respond
requestId,
null or error,
response or null,
sessionId to send to,
callback for event sent
*/
ns.Hub.prototype.respond = function( rid, err, res, sid, callback ) {
	const self = this;
	const response = {
		type : rid,
		data : {
			err : err,
			res : res,
		},
	};
	self.send( null, response, sid, callback );
}

ns.Hub.prototype.broadcast = function( source, event, callback ) {
	const self = this;
	const session = self.sessions[ source ];
	if ( !session )
		return;
	
	const subs = session.subscribers;
	subs.forEach( sendTo );
	function sendTo( sid ) {
		self.send( source, event, sid );
	}
}

ns.Hub.prototype.send = function( source, event, targetId, callback ) {
	const self = this;
	/*
	log( 'send', {
		event : event,
		tid   : targetId,
	});
	*/
	const session = self.sessions[ targetId ];
	if ( !session )
		return;
	
	const sourceWrap = {
		type : source,
		data : event,
	};
	session.send( sourceWrap, null, callback );
}

module.exports = ns.Hub;
