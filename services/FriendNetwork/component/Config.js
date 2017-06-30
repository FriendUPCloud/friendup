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
