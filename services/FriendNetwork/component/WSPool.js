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


const log = require( './Log' )( 'WSPool' );
const TLSWatch = require( './TLSWatch' );
const Client = require( './Client' ).WSClient;
const WSS = require( 'ws' ).Server;
const https = require( 'https' );

const ns = {};
ns.WSPool = function( onClient ) {
	const self = this;
	self.onclient = onClient;
	self.tls = global.config.server.tls;
	self.port = global.config.server.ws.port;
	
	self.init();
}

// Public

ns.WSPool.prototype.close = function() {
	const self = this;
	self.watch.close();
	self.closePool();
	delete self.onclient;
}

// Private

ns.WSPool.prototype.init = function() {
	const self = this;
	if ( self.tls.keyPath && self.tls.certPath )
		self.loadTLS();
	else
		self.initPlainPool();
}

ns.WSPool.prototype.loadTLS = function() {
	const self = this;
	const watchConf = {
		keyPath  : self.tls.keyPath,
		certPath : self.tls.certPath,
		onchange : onChange,
		onerr    : onErr,
	};
	self.watch = new TLSWatch( watchConf );
	function onChange( tlsBundle ) {
		self.tlsUpdated( tlsBundle );
		self.watch.acceptUpdate();
	}
	
	function onErr( err ) {
		log( 'tlsWatch err', err );
		self.close();
	}
}

ns.WSPool.prototype.tlsUpdated = function( bundle ) {
	const self = this;
	self.tlsBundle = bundle;
	self.initSecurePool();
}

ns.WSPool.prototype.initSecurePool = function() {
	const self = this;
	log( 'initSecurePool' );
	if ( self.pool )
		self.closePool();
	
	const httpsOptions = {
		key : self.tlsBundle.key,
		cert : self.tlsBundle.cert,
	};
	const port = self.port;
	const httpsServer = https.createServer( httpsOptions, fakeListen ).listen( port );
	self.pool = new WSS({ server : httpsServer });
	self.bindPool();
	
	function fakeListen() {}
}

ns.WSPool.prototype.initPlainPool = function() {
	const self = this;
	log( 'initPlainPool' );
	var port = global.config.server.ws.port;
	self.pool = new WSS({ port : port });
	self.bindPool();
}

ns.WSPool.prototype.bindPool = function() {
	const self = this;
	self.pool.on( 'error', error );
	self.pool.on( 'close', close );
	self.pool.on( 'connection', connection );
	
	function error( e ) { log( 'pool error', e ); }
	function close( e ) { log( 'pool close', e ); }
	function connection( e ) { self.handleConnection( e ); }
}

ns.WSPool.prototype.closePool = function() {
	const self = this;
	log( 'closePool' );
	if ( !self.pool )
		return;
	
	const pool = self.pool;
	delete self.pool;
	pool.removeAllListeners();
	try {
		pool.close();
	} catch( e ) {}
}

ns.WSPool.prototype.handleConnection = function( socket ) {
	const self = this;
	const client = new Client( socket );
	self.onclient( client );
}

module.exports = ns.WSPool;
