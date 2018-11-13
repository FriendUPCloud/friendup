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


var log = require( './Log' )( 'FcRequest' );
var https = require( 'https' );
var http = require( 'http' );
var querystring = require( 'querystring' );

var ns = {};
ns.FcRequest = function( conf ) {
	if ( !( this instanceof ns.FcRequest ))
		return new ns.FcRequest( conf );
	
	const self = this;
	self.host = conf.host;
	self.port = conf.port;
	self.method = 'POST';
	
	self.init();
}

ns.FcRequest.prototype.init = function() {
	const self = this;
	if ( typeof( self.host ) === 'undefined' )
		throw new Error( 'FcRequest.host is not set' );
	if ( typeof( self.port ) === 'undefined' )
		throw new Error( 'FcRequest.port is not set' );
}

ns.FcRequest.prototype.post = function( conf ) {
	const self = this;
	var query = querystring.stringify( conf.data );
	var opts = self.buildPostOptions( conf.path, query.length );
	var conn = self.getConn();
	var req = conn.request( opts, reqBack );
	req.on( 'error', oops );
	req.write( query );
	function reqBack( res ) {
		var chunks = '';
		res.on( 'data', read );
		res.on( 'end', end );
		
		function read( chunk ) {
			chunks += chunk;
		}
		
		function end() {
			self.response( chunks, conf );
		}
	}
	
	function oops( e ) {
		log( 'err', e );
		conf.error( e );
	}
}

ns.FcRequest.prototype.getConn = function() {
	if ( global.config.server.tls.keyPath ) {
		log( 'return secure conn' );
		return https;
	}
	else {
		log( 'return plain conn' );
		return http;
	}
}

ns.FcRequest.prototype.response = function( data, conf ) {
	const self = this;
	data = data.split( 'ok<!--separate-->' ).join( '' ); // derp
	data = parse( data );
	conf.success( data );
}

ns.FcRequest.prototype.buildPostOptions = function( path, queryLength ) {
	const self = this;
	var opts = {
		hostname : self.host,
		port : self.port,
		method : 'POST',
		path : path,
		rejectUnauthorized : false,
		headers : buildPostHeader( queryLength ),
	};
	
	return opts;
	
	function buildPostHeader( dataLength ) {
		var header = {
			'Content-Type' : 'application/x-www-form-urlencoded',
			'Content-Length' : dataLength,
		};
		return header;
	}
}

module.exports = function( conf ) {
	return new ns.FcRequest( conf );
}

function parse( string ) {
	try {
		return JSON.parse( string );
	} catch( e ) {
		return null;
	}
}