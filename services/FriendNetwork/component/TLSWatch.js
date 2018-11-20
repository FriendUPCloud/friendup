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