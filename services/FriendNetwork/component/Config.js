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


var log = require( './Log')( 'Config' );

var exampleConfObj = require( '../example.config.js' );
var confObj = require('../config.js');

var ns = {};

(function( ns, undefined ) {
	ns.Config = function() {
		const self = this;
		self.init();
	}
	
	ns.Config.prototype.init = function() {
		const self = this;
		var config = self.setMissing( confObj, exampleConfObj );
		self.server = config.server;
		self.shared = config.shared;
		global.config = self;
	}
	
	ns.Config.prototype.get = function() {
		const self = this;
		var conf = {
			server : self.server,
			shared : self.shared,
		};
		return global.config;
	}
	
	// "static" method, no self allowed here
	ns.Config.prototype.setMissing = function( dest, src ) {
		return sync( dest, src );
		
		function sync( dest, src ) {
			if ( typeof( dest ) === 'undefined' ) {
				dest = src;
				return dest;
			}
			
			if (( typeof( src ) !== 'object' ) || ( src === null ))
				return dest;
			
			var srcKeys = Object.keys( src );
			if ( srcKeys.length )
				srcKeys.forEach( goDeeper );
			
			return dest;
			
			function goDeeper( key ) {
				var deeperDest = dest[ key ];
				var deeperSrc = src[ key ];
				dest[ key ] = sync( deeperDest, deeperSrc );
			}
		}
	}
	
})( ns );

module.exports = new ns.Config();
