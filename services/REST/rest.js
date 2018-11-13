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

// logging ( wrap in each module with a static source, for your convenience )
global.log = function( source, message, data ) {
	var now = new Date();
	// var time = now.toLocaleString(); - we want milliseconds
	var time = ''
		+ pad( now.getDate())
		+ ' '
		+ pad( now.getHours()) +':'
		+ pad( now.getMinutes()) + ':'
		+ pad( now.getSeconds()) + ':'
		+ now.getMilliseconds();
	
	var str = time + ' >>> ' + source + ' > ' + message;
	console.log( str, data );
	
	function pad( num ) {
		if ( 10 > num )
			return '0' + num;
		else
			return num;
	}
}

// node things
const https = require( 'https' );
const url = require( 'url' );
const fs = require( 'fs' );

// app specific things
const rqHandler = require( './RequestHandler' );


// FrendCore requests
const fcHost = {
	host : 'localhost',
	port : 6502,
};
const fc = require( './FcRequest' )( fcHost );

// CouchDB requests
const couchHost = {
	host : 'localhost',
	port : 5986, // http port, tls is 6984
};
const couch = require( './CouchRequest' )( couchHost );

// local vars and things
var reqPool = null; // RequestHandler
var databases = [];
var tls = {
	keyPath  : '/etc/letsencrypt/live/friend.drylab.no/privkey.pem',
	certPath : '/etc/letsencrypt/live/friend.drylab.no/fullchain.pem',
	key      : null,
	cert     : null,
};

// local log, source set to 'system'
const log = function( message, data ) {
	global.log( 'REST', message, data );
}

// lets go
loadTLS();

// we need tls stuff for the https request handler
function loadTLS() {
	try {
		tls.key = fs.readFileSync( tls.keyPath );
		tls.cert = fs.readFileSync( tls.certPath );
	} catch( err ) {
		log( 'FATAL - could not load TLS files', err );
	}

	log( 'TLS files nominal..', tls );
	
	// done, next
	getCouchDBs();
}

// we need names of available databases for the REST paths
function getCouchDBs() {
	var cres = couch.get( '/_all_dbs' );
	cres
		.then( reqBack )
		.catch( reqErr );
	
	function reqBack( cdata ) {
		var names = cdata.data;
		names.forEach( cleanup );
		removeSystemDBs();
		removeDuplicates();
		log( 'database names nominal..', databases )
		
		// done, next
		startListen();
		
		function cleanup( name ) {
			var parts = name.split( '/' );
			var last = parts[ parts.length-1 ];
			
			var match = last.match( /(^[_a-zA-Z0-9]+)\.[0-9]+$/);
			if ( !match ) { // this name had no shard stuff in front of it, put in list
				databases.push( last );
				return;
			}
			
			var clean = match[ 1 ];
			databases.push( clean );
		}
		
		function removeSystemDBs() {
			databases = databases.filter( noLeadingUnderscore );
			function noLeadingUnderscore( name ) {
				return !( '_' === name[0] )
			}
		}
		
		function removeDuplicates() {
			var tmp = [];
			databases = databases.filter( notDuplicate )
			function notDuplicate( name ) {
				var tmpIndex = tmp.indexOf( name );
				if ( -1 === tmpIndex ) {
					tmp.push( name );
					return true;
				}
				
				return false;
			}
		}
		
	}
	
	function reqErr( err ) {
		log( 'FATAL - failed to fetch db names from couch, aborting', err );
		process.exit( 0 );
	}
}

// Request handler starts accepting requests
// and registers basic ( non-db ) paths
function startListen() {
	reqPool = new rqHandler( tls );
	reqPool.on( '/', handleBase );
	reqPool.on( '/_session', handleSession );
	
	registerForDatabases();
}

// register paths for each db in the request handler
function registerForDatabases() {
	databases.forEach( registerPaths );
	function registerPaths( dbName ) {
		var changes = '/' + dbName + '/_changes';
		var local = '/' + dbName + '/_local';
		
		reqPool.on( changes, changesHandler );
		reqPool.on( local, localHandler );
		
		// pathArgs is the remainder of the REST path if there was a partial match
		function changesHandler( req, res, pathArgs ) {
			handleChanges( req, res, pathArgs, dbName );
		}
		function localHandler( req, res, pathArgs ) {
			handleLocal( req, res, pathArgs, dbName );
		}
	}
}

// /<db>/_local
function handleLocal( req, res, pathArgs, dbName ) {
	var meta = reqPool.getMeta( req );
	log( 'handleLocal', {
		pa : pathArgs,
		meth : meta.method,
		db : dbName,
	});
	
	if ( 'OPTIONS' === req.method ) {
		sendOptions( res );
		return;
	}
	
	if ( 'GET' === req.method ) {
		res.writeHead( 404 );
		res.end();
		return;
	}
	
	if ( 'PUT' == req.method ) {
		// set in couch
		log( 'local.put.meta', meta )
		reqPool.readRequestData( req, putReadBack );
		function putReadBack( data ) {
			log( 'local.put.data', data );
			var couchReq = couch.put( meta.url.path, data );
			couchReq
				.then( happy )
				.catch( sad );
				
			function happy( cres ) {
				log( 'local.put.happy', cres);
				var data = cres.data;
				
				try {
					var dataStr = JSON.stringify( data );
				} catch( e ) {
					var dataStr = data.toString();
				}
				reqPool.setContentLength( res, dataStr );
				res.writeHead( cres.code || 404 );
				res.end( dataStr );
			}
			
			function sad( err ) {
				log( 'local.put.sad', err );
			}
		}
	}
	
}

// /<db>/_changes
function handleChanges( req, res, pathArgs, dbName ) {
	var meta = reqPool.getMeta( req );
	log( 'handleChanges', {
		meth : meta.method,
		db   : dbName,
	});
	
	//res.writeHead( 200 );
	//res.end();
}

function handleBase( req, res ) {
	var couchData = null;
	var couchRes = couch.get( '/' );
	couchRes
		.then( happy )
		.catch( sad );
		
	function happy( cdata ) {
		log( 'handleBase - happy couchBack', cdata );
		try {
			couchData = JSON.stringify( cdata.data );
			resolve( true );
		} catch( e ) {
			resolve( false );
		}
	}
	
	function sad( e ) {
		log( 'handleBase - sad couchBack', e );
	}
	
	function resolve( ok ) {
		reqPool.setContentLength( res, couchData );
		res.writeHead( 200 );
		res.end( couchData );
	}
}

// /_session
function handleSession( req, res ) {
	log( 'handleSession', {
		rq : !!req,
		rs : !!res,
	});
	var method = req.method;
	if ( 'OPTIONS' === method ) {
		sendOptions( res );
		return;
	}
	
	if ( 'POST' === method ) {
		doLogin( req, res );
		return;
	}
	
	log( 'handleSession - unknown session req', reqPool.getMeta( req ));
}

// generic OPTIONS reply, should mayhaps be passed on to couch
function sendOptions( res ) {
	log( 'sendOptions', !!res );
	reqPool.setContentLength( res, '' );
	res.writeHead( 204, {
		'Access-Control-Allow-Headers' : 'content-type',
		'Access-Control-Allow-Methods' : 
			[
				'GET',
				'PUT',
				'POST',
				'HEAD',
				'DELETE',
			].join( ',' ),
	});
	res.end();
}

// called from /_session to login in a FC user
function doLogin( req, res ) {
	var noAuth = {
		"error":"unauthorized",
		"reason":"You are not authorized to access this db."
	};
	var responseData = {
		ok    : false,
		name  : null,
		roles : [],
	};
	var fcSession = null;
	
	reqPool.readRequestData( req, dataBack );
	function dataBack( auth ) {
		log( 'doLogin', auth );
		if ( !auth ) {
			resolve( false );
			return;
		}
		
		var data = {
			username : auth.name,
			password : auth.password,
			deviceid : 'service:REST',
		};
		
		var fcReq = {
			path : '/system.library/login/',
			data : data,
			success : success,
			error : error,
		};
		
		fc.post( fcReq );
		function success( fcRes ) {
			if ( !fcRes.sessionid ) {
				responseData.error = fcRes;
				resolve( false );
				return;
			}
			
			responseData.name = auth.name;
			setCookie( res, 'AuthSession=' + fcRes.sessionid );
			resolve( true );
		}
		
		function error( e ) {
			log( 'fc req failed', {
				e : e,
				a : auth,
			});
			responseData.error = 'FATAL';
			resolve( false, 500 );
		}
	}
	
	function resolve( ok, code ) {
		responseData.ok = ok;
		var dataStr = JSON.stringify( responseData );
		reqPool.setContentLength( res, dataStr );
		var retCode = code || ( ok ? 200 : 401 );
		res.writeHead( retCode );
		res.end( dataStr );
	}
}

// set for logged in user, currently sets sessionid, called from doLogin
function setCookie( res, str ) {
	var cookieStr = str + '; Version=1; Path=/';
	res.setHeader( 'Set-Cookie', cookieStr );
}
