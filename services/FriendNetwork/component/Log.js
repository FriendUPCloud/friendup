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


var util = require( 'util' );
var prefix = 'FNet > ';
const self = this;

var inspectOpt = getInspectOpt();

function toConsole( prefix, args ) {
	if ( typeof args[ 0 ] === 'string' ) {
		log( prefix + args[ 0 ] );
		args.shift();
		if ( args.length )
			logArgs( args );
		
		return true;
	}
	
	log( prefix );
	logArgs( args );
}

function log( str ) {
	console.log( str );
}

function logArgs( args ) {
	logObj.apply( self, args );
}

function logObj( obj, depth, showHidden, color ) {
	if ( typeof depth !== 'undefined' )
		var specialOpt = getInspectOpt( depth, showHidden, color );
	
	var opts = specialOpt || inspectOpt;
	console.log( util.inspect( obj, opts ));
}

function padding( prefix, args ) {
	var now = getTimeString();
	prefix = now + ' : ' + prefix;
	toConsole( prefix, args );
}

module.exports = function( module ) {
	var str = prefix + ( module ? module + ' > ' : '' );
	return function() {
		var args = Array.prototype.slice.call( arguments, 0 );
		padding( str, args );
	}
}

function getTimeString() {
	var now = new Date();
	var year = now.getFullYear();
	var month = now.getMonth() + 1;
	var day = now.getDate();
	var hours = now.getHours();
	var minutes = now.getMinutes();
	var seconds = now.getSeconds();
	var millis = now.getMilliseconds();
	return year
		+ '.' + pad( month )
		+ '.' + pad ( day )
		+ ' ' + pad( hours )
		+ ':' + pad( minutes )
		+ ':' + pad( seconds )
		+ ':' + pad( millis, true );
		
	function pad( arg, millis ) {
		var int = parseInt( arg );
		if ( millis ) {
			if ( int < 10 )
				return '00' + int;
			if ( int < 100 )
				return '0' + int;
		}
		
		if ( int < 10 )
			return '0' + int;
		
		return arg;
	}
}

function getInspectOpt( depth, showHidden, colors ) {
	var inspectObj = {
		depth : depth || 1,
		showHidden : showHidden || true,
		colors : colors || false,
	};
	return inspectObj;
}