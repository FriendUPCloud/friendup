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

const https = require( 'https' );
const url = require( 'url' );

var log = function( message, data ) {
	global.log( 'RequestHandler', message, data );
}

const RQH = function( tlsConf ) {
	var self = this;
	self.tls = tlsConf;
	
	self.host = 'friend.drylab.no'
	self.port = 6983;
	self.paths = [];
	self.init();
}

// public

// register REST paths
RQH.prototype.on = function( path, handler ) {
	var self = this;
	var raw = '^(' + path + ')([\\S]*)$';
	var rx = new RegExp( raw );
	var pathObj = {
		path    : path,
		handler : handler,
		length  : path.length,
		rx      : rx,
	};
	self.paths.push( pathObj );
	self.paths.sort( byPathLengthDesc );
	function byPathLengthDesc( a, b ) {
		return a.length < b.length;
	}
}

RQH.prototype.close = function() {
	var self = this;
	if ( self.pool )
		self.pool.close();
	
	delete self.tls;
	delete self.paths;
	delete self.pool;
}

// reads data on a request - static, feel free to use from whereever
RQH.prototype.readRequestData = function( req, callback ) {
	var self = this;
	var chunks = [];
	req.on( 'data', onData );
	req.on( 'end', onEnd );
	
	function onData( chunk ) {
		chunks.push( chunk );
	}
	
	function onEnd() {
		var data = chunks.join( '' );
		try {
			data = JSON.parse( data );
		} catch( err ) {
			log( 'readRequestData - could not parse', data );
		}
		
		callback( data );
	}
}

// sets content-length header on a res object for the giver data - static
RQH.prototype.setContentLength = function( res, data ) {
	var self = this;
	var dataStr = '';
	if ( 'string' === typeof( data ))
		dataStr = data;
	else {
		try {
			dataStr = JSON.stringify( data );
		} catch( err ) {
			log( 'setContentLength - failed to parse data', data );
			data = { 'setContentLength' : 'failed to parse data', err : err };
			dataStr = JSON.stringify( data );
		}
	}
	
	var len = 0;
	if ( data && data.length )
		len = Buffer.byteLength( data );
	
	res.setHeader( 'Content-Length', len );
}

// private

RQH.prototype.init = function() {
	var self = this;
	var opts = {
		key  : self.tls.key,
		cert : self.tls.cert,
	};
	self.pool = https.createServer( opts, handleRequest );
	self.pool.on( 'error', poolError );
	
	// bind to network
	self.pool.listen( self.port, self.host, listenUp );
	
	function handleRequest( req, res ) { self.handleRequest( req, res ); }
	function poolError( err ) { log( 'poolError', err ); }
	function listenUp() {
		log( 'RequestHandler nominal, listening on', self.pool.address());
	}
}

RQH.prototype.handleRequest = function( req, res ) {
	var self = this;
	self.setDefaultHeaders( req, res );
	var meta = self.getMeta( req );
	var path = meta.url.pathname;
	var handlerMatch = null;
	var handler = null;
	self.paths.some( matchPath );
	if ( !handler ) {
		log( 'handleRequest - no handler for', meta );
		res.writeHead( 400 );
		res.end();
		return;
	}
	
	handler( req, res, handlerMatch[ 2 ] );
	
	function matchPath( pathObj, index ) {
		var match = path.match( pathObj.rx );
		if ( match ) {
			handler = pathObj.handler;
			handlerMatch = match;
			return true;
		}
		
		return false;
	}
}

RQH.prototype.setDefaultHeaders = function( req, res ) {
	var self = this;
	if ( !req || !req.headers || !req.headers.origin )
		return;
	
	res.setHeader( 'Access-Control-Allow-Origin', req.headers.origin );
	res.setHeader( 'Access-Control-Allow-Credentials', 'true' );
}

RQH.prototype.getMeta = function( req ) {
	var self = this;
	var urlParts = url.parse( req.url );
	var meta = {
		headers : req.headers,
		method  : req.method,
		url     : urlParts,
	};
	return meta;
}

module.exports = RQH;