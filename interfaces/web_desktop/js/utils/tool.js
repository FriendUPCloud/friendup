/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var friendUP = friendUP || {};
friendUP.tool = friendUP.tool || {};

(function( ns )
{
	ns.getRandomNumber = function( length )
	{
		length = length || 15;
		var numString = '';
		while ( numString.length <= length )
		{
			var part = getNum();
			numString += part;
		}
		
		var slice = numString.slice( 0, length );
		return parseInt( slice, 10 );
		
		function getNum()
		{
			var decimal = Math.random();
			var movedDecimalPoint = decimal * Math.pow( 10, 10 );
			var integer = Math.floor( movedDecimalPoint );
			return integer.toString();
		}
	}
	
	ns.getRandomString = function( length )
	{
		var string = '';
		do
		{
			var part = '';
			var floater = Math.random();
			var base36 = floater.toString( 36 ); // .toString is magic, like friendship
			part =  base36.slice( 2 ); // removing the first two characters, they do not please me ( actually, only the 2nd, wich is a period, but thats what you get for being associated with a period )
			string += part;
		}
		while ( string.length < length )
		
		return string.slice( 0, length );
	}
	
	ns.getChatTime = function( timestamp ) {
		var time = new Date( timestamp );
		var timeString = '';
		if ( moreThanADayAgo( timestamp ))
			return justDate();
		
		return clockStamp();
		
		function clockStamp() {
			var timeStr = pad( time.getHours() )
			+ ':' + pad( time.getMinutes() )
			+ ':' + pad( time.getSeconds() );
			
			if ( isYesterday())
				timeStr = 'yesterday ' + timeStr;
			
			return timeStr;
			
			function pad( time ) {
				var str = time.toString();
				return str.length !== 1 ? str : '0' + str;
			}
			
			function isYesterday() {
				var now = new Date();
				var today = now.getDate();
				var date = time.getDate();
				return today !== date;
			}
		}
		
		function justDate( timestamp ) {
			var date = time.toLocaleDateString();
			return date;
		}
		
		
		function moreThanADayAgo( timestamp ) {
			var now = Date.now();
			var aDay = 1000 * 60 * 60 * 24;
			return !!(( now - aDay ) > timestamp );
		}
	}
	
	const idCache = {}; // the best solution? possibly not.. >.>
	ns.getId = function( prefix, length )
	{
		var prefix = startWithAlpha( prefix ) || 'id';
		length = length || 36;
		length = Math.max( length, 11 );
		prefix = limit( prefix, ( length / 3 ));
		var partLength = 8;
		
		
		let id='';
		do
		{
			id = prefix;
			id = createId( id );
			id = id.slice(0, length );
			id = removeTrailingHyphen( id );
		}
		while( idCache[ id ])
		
		idCache[ id ] = id;
		return id;
		
		function createId( str )
		{
			do
			{
				var part = ns.getRandomString( partLength );
				str = str + '-' + part;
			}
			while ( str.length < length );
			return str;
		}
		
		function removeTrailingHyphen ( str )
		{
			var lastChar = str[ str.length-1 ];
			if ( lastChar == '-' )
				return str.slice( 0, str.length-1 );
			return str;
		}
		
		function startWithAlpha( prefix )
		{
			if ( typeof( prefix ) !== 'string' )
				return false;
			if ( !( prefix[ 0 ].match( /[a-zA-Z]/ )) )
				return 'id-' + prefix;
			return prefix;
		}
		
		function limit( str, max ) {
			var len = str.length;
			var end = Math.min( len, max );
			return str.slice( 0, end );
		}
	}
	ns.uid = ns.getId;
	
	ns.stringify = function( obj )
	{
		if ( typeof obj === 'string' )
			return obj;
		
		try
		{
			return JSON.stringify( obj );
		} catch (e)
		{
			console.log( 'tool.Stringify.exception', e );
			console.log( 'tool.Stringifu.exception - returning .toString(): ', obj.toString());
			return obj.toString(); // not an object? probably has .toString() then.. #YOLO #360-NO-SCOPE
		}
	}
	
	ns.parse = function( string )
	{
		if ( typeof string !== 'string' )
			return string;
		
		try
		{
			return JSON.parse( string );
		} 
		catch ( e )
		{
			try
			{
				return JSON.parse( string.split( '\\"' ).join( '"' ) );
			}
			catch( e )
			{
				console.log( 'could not objectify:', string );
				return null;
			}
		}
	}
	ns.objectify = ns.parse;
	
	ns.queryString = function( params )
	{
		if ( typeof( params ) === 'string' )
			return params;
			
		var pairs = Object.keys( params ).map( pair )
		function pair( key )
		{
			var value = params[ key ];
			return key + '=' + value;
		}
		
		return pairs.join( '&' );
	}
	
	ns.getCssValue = function( element, style, pseudo )
	{
		pseudo = pseudo || null; // css pesudo selector
		
		if ( element.style[ style ] && !pseudo )
			return element.style[ style ];
		
		if ( element.currentStyle )
			return element.currentStyle( style );
		
		if ( window.getComputedStyle )
		{
			var styles = window.getComputedStyle( element, pseudo );
			return styles[ style ];
		}
	}
	
	ns.ucfirst = function( string ) { // yes, it doesnt handle your prepending whitepsace, fix if you like
		if ( !string.length )
			return string;
		
		var arr = string.split( '' );
		arr[ 0 ] = arr[ 0 ].toUpperCase();
		string = arr.join( '' );
		return string;
	}
	
})( friendUP.tool );
