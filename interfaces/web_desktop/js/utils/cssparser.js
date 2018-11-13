/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Parse a string / file and make compact, logical css
function ParseCssFile( string, path, callback )
{
	if( !path ) path = document.location.href.split( 'index.' )[0];
	path = path.split( 'sandboxed.' )[0];
	
	if( typeof( cAjax ) == 'undefined' )
		return setTimeout( function(){ ParseCssFile( string, path, callback ); }, 25 );	
	
	var j = new cAjax ();
	j.open ( 'get', string, false );
	j.sourcePath = string;
	j.onload = function()
	{
		var string = Trim ( this.responseText () );
		var loading = 0;
		var paths = []; // ones to concat

		// Make relative path
		var rpath = path.split( /http[^:]*?\:\/\/[^/]*?\// ).join( '' );
		var dmain = '';
		if( dmain = path.match( /(http[^:]*?\:\/\/[^/]*?\/)/ ) )
			dmain = dmain[1];
		else dmain = '';
		
		// Import other included parsed css files with their own rules		
		while( true )
		{
			var matches = string.match ( /\@append[^u]*?url[^(]*?\(([^)]*?)\)[^;]*?\;/ );
			if ( matches )
			{
				string = string.split ( matches[0] ).join ( '' );
				matches[1] = rpath + matches[1].split ( /["|']/ ).join ( '' );
				paths.push( matches[1] );
			}
			else break;
		}
		
		// Do it
		var out = '';
		for( var a = 0; a < paths.length; a++ )
		{
			if( a > 0 ) out += ';';
			out += paths[a];
		}
		
		// Final path
		out = dmain + out;
		
		// Load extracted paths at once and parse them
		var jax = new cAjax();
		jax.open( 'get', out, true );
		jax.onload = function()
		{
			AddParsedCSS( string, this.responseText(), callback, path );	
		}
		jax.send();
	}
	j.send ();
}

function AddParsedCSS ( string, dataqueue, callback, originalPath )
{
	// Add queued data (array)
	if( typeof( dataqueue ) != 'string' )
	{
		for ( var a = 0; a < dataqueue.length; a++ )
		{
			string += "\n" + Trim ( dataqueue[a].responseText () ) + "\n";
		}
	}
	// String
	else
	{
		string += "\n" + Trim( dataqueue );
	}
	// Check condition blocks
	var mDat = false;
	while( mDat = string.match( /(\@if.*?[\n|\r]+)/i ) )
	{
		var vari = mDat[1].match( /\@if\ ([^\r\n]+)/i );
		if( vari[1] )
		{
			var v = vari[1].substr( 1, vari[1].length - 1 );
			// True?
			if( window[v] )
			{
				string = string.split( mDat[1] ).join( "@media (min-width: 0)" );
			}
			// Remove block!
			else
			{
				string = string.split( mDat[1] ).join( "@media (min-width: 999999999)" );
			}
		}
	}
	// Parse this css complete file, with these toplevel declarations
	var theme = new Object ();
	var replacements = [];
	var matches = '';
	while ( matches = string.match ( /\@declaration[^{]*?\{([^}]*?)\}/i ) )
	{
		string = string.split ( matches[0] ).join ( '!parsing_css_working_on_it!' );
		var rules = matches[1].split ( "\n" );
		if ( rules.length )
		{
			for ( var a in rules )
			{
				var rule = rules[a];
				if ( !Trim ( rule ).length ) continue;
				var mat = '';
				while ( mat = rule.match ( /(\$[^:]*?)\:[\s]+([^;]*?)\;/i ) )
				{
					replacements.push ( [ mat[1], mat[2] ] );
					var vkey = mat[1].substr ( 1, mat[1].length - 1 );
					theme.vkey = mat[2];
					rule = rule.split ( mat[0] ).join ( '' );
				}
			}
			string = string.split ( '!parsing_css_working_on_it!' ).join ( '' );
		}
	}
	// Code blocks
	while ( matches = string.match ( /\@block\ (\$[^{]*?)\{([^}]*?)\}/i ) )
	{
		replacements.push ( [ Trim ( matches[1] ), Trim ( matches[2] ) ] );
		string = string.split ( matches[0] ).join ( '' );
	}
	// Declaration of "with" rules
	var rwith = [];
	//var t = ( new Date() ).getTime();
	while( matches = string.match( /(.*?)\ with (\.[^\n|{| ]*?)[\n|{| ]/i ) )
	{
		if( typeof( rwith[matches[2]] ) == 'undefined' ) rwith[matches[2]] = [];
		rwith[matches[2]].push( matches[1] );
		//console.log( matches[2] + ' -> ' + matches[1] );
		string = string.split( matches[0] ).join ( matches[1] + "\n" );
	}
	// Execute replacements
	if ( replacements.length )
	{
		for ( var a in replacements )
		{
			var replacement = replacements[a];
			// Remove variable lines with the value delete
			if( replacement[1] == 'delete' )
			{
				// Add slashes
				var rp = replacement[1];
				var op = '';
				for( var u = 0; u < rp.length; u++ )
				{
					var c = rp.substr ( u, 1 );
					if ( c.match ( /[^a-zA-Z0-9]/ ) )
						op += '\'';
					op += c;
				}
				var xp = new RegExp( '/.*?\:.*?' + op + '\;[\n|\r]+/i' );
				string = string.split( xp ).join ( '' );
			} 
			else string = string.split( replacement[0] + ';' ).join ( replacement[1] + ';' );
		}
	}
	// Execute block replacements
	if( rwith.length )
	{
		for ( var cls in rwith )
		{
			var elements = rwith[cls];
			cls = str_replace ( '.', '', cls );
			var findex = new RegExp( '/\.'+cls+'([\n|{])/i' );
			var foundd = string.match ( findex );
			if ( foundd )
			{
				string = string.split ( findex ).join ( foundd[1] );
			}
		}
	}

	/*// Strip comments
	string = string.split ( /\/\*[^\/]*?\/[\n|\r]+/i ).join ( '' );
	// Strip character returns|tabs and whitespace
	string = string.split ( /[\n|\t|\r]+/i ).join ( '' );
	string = string.split ( /[\s]{2,}/i ).join ( '' );*/
	var style = document.createElement ( 'style' );
	style.innerHTML = string;
	document.getElementsByTagName( 'head' )[0].appendChild ( style );
	if( callback ) setTimeout( callback, 0 );
}

