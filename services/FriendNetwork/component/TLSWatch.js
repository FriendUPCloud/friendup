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


var fs = require( 'fs' );
var log = require( './Log' )( 'TLSWatch' );

var ns = {};
ns.TLSWatch = function( conf ) {
	const self = this;
	self.keyPath = conf.keyPath;
	self.certPath = conf.certPath;
	self.onchange = conf.onchange;
	self.onerr = conf.onerr;
	
	self.keyCurr = null;
	self.certCurr = null;
	self.keyUpdate = false;
	self.certUpdate = false;
	
	self.init();
}

// 'Public'

ns.TLSWatch.prototype.acceptUpdate = function() {
	const self = this;
	self.keyCurr = self.keyUpdate || self.keyCurr;
	self.keyUpdate = null;
	
	self.certCurr = self.certUpdate || self.certCurr;
	self.certUpdate = null;
}

ns.TLSWatch.prototype.denyUpdate = function() {
	const self = this;
	self.keyUpdate = null;
	self.certUpdate = null;
	self.emitChange();
}

ns.TLSWatch.prototype.close = function() {
	const self = this;
	self.endWatch();
	
	self.keyCurr = null;
	self.certCurr = null;
	
	delete self.keyPath;
	delete self.certPath;
	delete self.onchange;
	delete self.onerr;
}

// Private

ns.TLSWatch.prototype.init = function() {
	const self = this;
	self.loadFile( self.keyPath, keyBack );
	function keyBack( data ) {
		self.keyUpdate = data;
		self.loadFile( self.certPath, certBack );
	}
	function certBack( data ) {
		self.certUpdate = data;
		if ( !self.keyUpdate || !self.certUpdate ) {
			self.emitError( 'missing cert or key' );
			return;
		}
		
		self.emitChange();
		self.startWatch();
	}
}

ns.TLSWatch.prototype.startWatch = function() {
	const self = this;
	self.keyWatch = fs.watch( self.keyPath, keyChange );
	self.certWatch = fs.watch( self.certPath, certChange );
	
	function keyChange( type, file ) {
		self.loadFile( self.keyPath, keyBack );
		function keyBack( data ) {
			if ( self.keyCurr === data )
				return;
			
			self.keyUpdate = data;
			self.emitChange();
		}
	}
	
	function certChange( type, file ) {
		self.loadFile( self.certPath, certBack );
		function certBack( data ) {
			if ( self.certCurr === data )
				return;
			
			self.certUpdate = data;
			self.emitChange();
		}
	}
}

ns.TLSWatch.prototype.endWatch = function() {
	const self = this;
}

ns.TLSWatch.prototype.emitChange = function() {
	const self = this;
	if ( !!self.keyUpdate !== !!self.certUpdate ) {
		log( 'emitChange - missing update, waiting' );
		return;
	}
	
	var bundle = {
		key : self.keyUpdate || self.keyCurr,
		cert : self.certUpdate || self.certCurr,
	};
	self.onchange( bundle );
}

ns.TLSWatch.prototype.emitError = function( err ) {
	const self = this;
	self.onerr( err );
}

ns.TLSWatch.prototype.loadFile = function( path, callback ) {
	const self = this;
	var opt = { encoding : 'ascii' };
	fs.readFile( path, opt, fileBack );
	function fileBack( err, content ) {
		if ( err ) {
			log( 'fileBack - err', err );
			self.emitError( err );
			callback( false );
			return;
		}
		
		callback( content );
	}
}

module.exports = ns.TLSWatch;