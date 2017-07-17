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


const log = require( './Log')( 'NoMansLand' );
const WSPool = require( './WSPool' );
const Session = require( './Session' );
const uuid = require( './UuidPrefix')();

var ns = {};

ns.NoMansLand = function( fcReq, network ) {
	const self = this;
	self.fcReq = fcReq;
	self.network = network;
	
	self.wsPool = null;
	self.connections = {};
	self.sessions = {};
	self.authTimeoutMS = 1000 * 20; // 20 sec
	
	self.init();
}

ns.NoMansLand.prototype.init = function() {
	const self = this;
	self.eventMap = {
		
	};
	
	self.wsPool = new WSPool( onClient );
	function onClient( e ) { self.handleClient( e ); }
}

ns.NoMansLand.prototype.close = function() {
	const self = this;
	self.connIds.forEach( closeClient );
	self.connections = {};
	delete self.fcReq;
	
	function closeClient( id ) {
		self.connections[ id ].close();
	}
}

ns.NoMansLand.prototype.handleClient = function( client ) {
	const self = this;
	client.on( 'close', clientClosed );
	client.on( 'authenticate', checkAuth );
	client.on( 'session', restoreSession );
	
	// send authentication challenge
	var auth = {
		type : 'authenticate',
		data : null,
	};
	client.sendCon( auth );
	
	// close connection if theres no auth reply within timeout
	var authTimeout = setTimeout( authTimedOut, self.authTimeoutMS );
	function authTimedOut() {
		log( 'client auth timeout hit' );
		authTimeout = null;
		client.release();
		client.close();
	}
	
	// oopsie?
	function clientClosed( e ) {
		log( 'client closed during auth timeout' );
		if ( authTimeout )
			clearTimeout( authTimeout );
		
		client.release();
	}
	
	// got auth, next step
	function checkAuth( bundle ) {
		if ( authTimeout )
			clearTimeout( authTimeout );
		
		client.release(); // remove all event handlers before handing it off
		const cid = self.addClient( client );
		self.checkClientAuth( bundle, cid );
	}
	
	function restoreSession( sid ) {
		if ( authTimeout )
			clearTimeout( authTimeout );
		
		client.release();
		const cid = self.addClient( client );
		self.restoreSession( sid, cid );
	}
}

ns.NoMansLand.prototype.checkClientAuth = function( auth, cid ) {
	const self = this;
	self.validate( auth, authBack );
	function authBack( err, res ) {
		if ( err ) {
			self.authFailed( err, cid, errSent );
			function errSent() {
				self.removeClient( cid );
			}
			return;
		}
		
		self.addToNetwork( cid );
	}
}

ns.NoMansLand.prototype.authFailed = function( err, cid, callback ) {
	const self = this;
	const client = self.getClient( cid );
	if ( !client )
		return;
	
	const auth = {
		type : 'authenticate',
		data : {
			error : err,
		},
	};
	client.sendCon( auth, callback );
}

ns.NoMansLand.prototype.addToNetwork = function( cid ) {
	const self = this;
	const client = self.getClient( cid );
	if ( !client ) {
		self.removeClient( cid );
		return;
	}
	
	const session = self.createSession();
	const sid = session.id;
	self.addToSession( sid, cid );
	self.network.connect( session );
}

ns.NoMansLand.prototype.sendSession = function( cid, sessionId ) {
	const self = this;
	const client = self.getClient( cid );
	if ( !client )
		return;
	
	const session = {
		type : 'session',
		data : sessionId,
	};
	client.sendCon( session );
}

ns.NoMansLand.prototype.validate = function( bundle, callback ) {
	const self = this;
	log( 'validate', bundle );
	if ( 'sessionid' === bundle.type ) {
		checkSessionId( bundle.data );
		return;
	}
	
	callback( 'ERR_AUTH_UNKNOWN_TYPE', null );
	
	function checkSessionId( data ) {
		getFCUser( data.sessionId, userBack );
		function userBack( err, res ) {
			if ( err ) {
				callback( err, null );
				return;
			}
			
			log( 'userBack', res );
			if ( !res || !res.Name ) {
				callback( 'ERR_AUTH_INVALID_SESSIONID', null );
				return;
			}
			
			callback( null, res );
			
			/*
			if ( res.Name === data.Name )
				callback( null, res );
			else
				callback( 'ERR_AUTH_INVALID_LOGIN', null );
			*/
		}
	}
	
	function getFCUser( sessionId, reqBack ) {
		var data = {
			module    : 'system',
			command   : 'userinfoget',
			sessionid : sessionId,
		};
		
		var req = {
			path : '/system.library/module/',
			data : data,
			success : success,
			error : error,
		};
		self.fcReq.post( req );
		
		function success( data ) {
			reqBack( null, data );
		}
		
		function error( err ) {
			reqBack( 'ERR_HOST_UNICORN_POOP', err );
		}
	}
}

ns.NoMansLand.prototype.addClient = function( client ) {
	const self = this;
	if ( !client || !client.id )
		return null;
	
	const cid = client.id;
	self.connections[ cid ] = client;
	self.connIds = Object.keys( self.connections );
	client.on( 'close', closed );
	return cid;
	
	function closed( e ) { self.removeClient( cid ); }
}

ns.NoMansLand.prototype.removeClient = function( cid ) {
	const self = this;
	const client = self.getClient( cid );
	if ( !client ) {
		log( 'removeClient - no client for id', cid );
		return;
	}
	
	// no more events from you, mister
	client.release();
	
	// release session / account
	if ( client.sessionId )
		self.removeFromSession( client.sessionId, client.id, thenTheSocket );
	else
		thenTheSocket(); // remove socket
	
	function thenTheSocket() {
		var client = self.getClient( cid );
		delete self.connections[ cid ];
		self.connIds = Object.keys( self.connections  );
		client.close();
	}
}

ns.NoMansLand.prototype.getClient = function( cid ) {
	const self = this;
	return self.connections[ cid ] || null;
}

ns.NoMansLand.prototype.createSession = function() {
	const self = this;
	const sid = uuid.get( 'fnet' );
	const session = new Session( sid, onclose );
	self.sessions[ sid ] = session;
	return session;
	
	function onclose() {
		self.sessionClosed( sid );
	}
}

ns.NoMansLand.prototype.getSession = function( sid ) {
	const self = this;
	const session = self.sessions[ sid ];
	if ( !session ) {
		log( 'no session found for', {
			sid      : sid,
			sessions : self.sessions,
		}, 3 );
		return null;
	}
	
	return session;
}

ns.NoMansLand.prototype.addToSession = function( sessionId, clientId ) {
	const self = this;
	const session = self.getSession( sessionId );
	const client = self.getClient( clientId );
	if ( !session || !client )
		return;
	
	session.attach( client );
}

ns.NoMansLand.prototype.restoreSession = function( sessionId, clientId ) {
	const self = this;
	const client = self.getClient( clientId );
	if ( !client )
		return;
	
	const session = self.getSession( sessionId );
	if ( !session )
		restoreFailed( client );
	else
		restoreSuccess( client );
	
	function restoreFailed( client ) {
		const sessFail = {
			type : 'session',
			data : false,
		};
		client.sendCon( sessFail, failSent );
		function failSent() {
			self.removeClient( clientId );
		}
	}
	
	function restoreSuccess( client ) {
		session.attach( client );
		self.sendReady( client.id );
	}
}

ns.NoMansLand.prototype.removeFromSession = function( sessionId, clientId, callback ) {
	const self = this;
	const session = self.getSession( sessionId );
	if ( !session )
		return;
	
	session.detach( clientId, callback );
}

ns.NoMansLand.prototype.sessionClosed = function( sid ) {
	const self = this;
	const session = self.getSession( sid );
	if ( !session )
		return;
	
	self.network.disconnect( sid );
	delete self.sessions[ sid ];
}

module.exports = ns.NoMansLand;
