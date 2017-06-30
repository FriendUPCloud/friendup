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


var https = require( 'https' );
var querystring = require( 'querystring' );

var ns = {};
ns.FcRequest = function( conf ) {
	if ( !( this instanceof ns.FcRequest ))
		return new ns.FcRequest( conf );
	
	var self = this;
	self.host = conf.host;
	self.port = conf.port;
	self.method = 'POST';
	
	self.init();
}

ns.FcRequest.prototype.init = function() {
	var self = this;
	if ( typeof( self.host ) === 'undefined' )
		throw new Error( 'FcRequest.host is not set' );
	if ( typeof( self.port ) === 'undefined' )
		throw new Error( 'FcRequest.port is not set' );
}

ns.FcRequest.prototype.post = function( conf ) {
	var self = this;
	var query = querystring.stringify( conf.data );
	var opts = self.buildPostOptions( conf.path, Buffer.byteLength( query ));
	var req = https.request( opts, reqBack );
	req.on( 'error', oops );
	req.write( query );
	req.end();
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

ns.FcRequest.prototype.response = function( data, conf ) {
	var self = this;
	var data = data.split( /^.{2,4}<!--separate-->/ ).join( '' ); // derp
	var data = parse( data );
	conf.success( data );
}

ns.FcRequest.prototype.buildPostOptions = function( path, queryLength ) {
	var self = this;
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