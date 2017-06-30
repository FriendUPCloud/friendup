'use strict';
/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
*                                                                              *
*****************************************************************************©*/



const log = require( './Log' )( 'Hub' );
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
		'subscribe'   : subscribe,
		'unsubscribe' : unsubscribe,
	};
	
	function hosts( e, rid, sid ) { self.handleHosts( e, rid, sid ); }
	function publik( e , rid, sid ) { self.handlePublik( e, rid, sid ); }
	function privat( e , rid, sid ) { self.handlePrivat( e, rid, sid ); }
	function expose( e, rid, sid ) { self.handleExpose( e, rid, sid ); }
	function conceal( e, rid, sid ) { self.handleConceal( e, rid, sid ); }
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
	log( 'handleHosts', {
		e   : e,
		rid : rid,
		sid : sid, });
	
	let hosts = [];
	if ( self.sessionIds.length )
		hosts = self.sessionIds.map( buildHostInfo );
	
	hosts.push( null );
	hosts = hosts.filter( item => !!item );
	log( 'hosts', hosts );
	
	self.respond( rid, null, hosts, sid );
	
	function buildHostInfo( sid ) {
		const session = self.sessions[ sid ];
		if ( !session )
			return null;
		
		const meta = session.meta;
		meta.hostId = sid;
		meta.isPublic = session.isPublic;
		return meta;
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

ns.Hub.prototype.handleSubscribe = function( hostIds, rid, sid )
{
	const self = this;
	log( 'handleSubscribe', event );
	if ( !hostIds || !hostIds.forEach )
		return;
	
	const subbed = hostIds.map( addToHostSub );
	subbed = subbed.filter( notNull );
	self.respond( rid, null, subbed, sid );
	
	function addToHostSub( hostId )
	{
		const session = self.sessions[ hostId ];
		if ( !session )
			return null;
		
		session.sub( sid );
		return hostId;
	}
	
	function notNull( item ) { return !!item; }
}

ns.Hub.prototype.handleUnsubscribe = function( hostIds, rid, sid )
{
	const self = this;
	log( 'handleUnsubscribe', event );
	if ( !hostIds || !hostIds.forEach )
		return;
	
	const unsubbed = hostIds.map( removeFromHostSub );
	unsubbed = unsubbed.filter( notNull );
	self.respond( rid, null, unsubbed, sid );
	
	function removeFromHostSub( hostId )
	{
		const session = self.sessions[ hostId ];
		if ( !session )
			return null;
		
		sessions.unsub( sid );
		return hostId;
	}
	
	function notNull( item ) { return !!item; }
}

ns.Hub.prototype.handleExpose = function( apps, rid, sid )
{
	const self = this;
	log( 'handleExpose', appIds );
	if ( !apps || !apps.forEach )
		return;
	
	const session = self.sessions[ sid ];
	if ( !session )
		return;
	
	const current = session.exposeApps( apps );
	if ( !current ) {
		self.respond( rid, 'ERR_INVALID_DATA', apps, sid );
		return;
	}
	
	const exposed = {
		type : 'apps',
		data : current,
	};
	self.broadcast( sid, exposed );
	self.respond( rid, null, current, sid );
}

ns.Hub.prototype.handleConceal = function( appIds, rid, sid )
{
	const self = this;
	log( 'handleConceal', appIds );
	if ( !appIds || !appIds.forEach )
		return;
	
	const ssession = self.sessions[ sid ];
	if ( !session )
		return;
	
	const current = session.concealApps( appIds );
	if ( !current ) {
		self.respond( rid, 'ERR_INVALID_DATA', appIds, sid );
		return;
	}
	const exposed = {
		type : 'apps',
		data : current,
	};
	self.broadcast( sid, exposed );
	self.respond( rid, null, current, sid );
}

ns.Hub.prototype.handleMeta = function( conf, sid )
{
	const self = this;
	log( 'handleMeta', conf );
	const session = self.sessions[ sid ];
	if ( !session )
		return;
	
	session.updateMeta( conf );
}

ns.Hub.prototype.toHost = function( host, event, sid )
{
	const self = this;
	log( 'toHost', {
		host  : host,
		event : event,
		sid   : sid,
	});
	// if no host, broadcast
	if ( null == host )
		self.broadcast( sid, event );
	else
		self.send( sid, event, host );
	
}

/* respond - err OR res must be null
requestId,
null or error,
response or null,
sessionId to send to,
callback for event sent
*/
ns.Hub.prototype.respond = function( rid, err, res, sid, callback ) {
	const self = this;
	if ( err )
		res = null;
	
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
		log( 'broadcast - send to sid' );
		self.send( source, event, sid );
	}
}

ns.Hub.prototype.send = function( source, event, targetId, callback ) {
	const self = this;
	log( 'send', {
		event : event,
		tid   : targetId,
	});
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
