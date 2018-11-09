/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/* Execute a server directive ----------------------------------------------- */

function ExecuteDirective ( directive, data )
{
	var j = new cAjax();
	j.open( 'post', 'admin.php?module=files&command=directive', true, true );
	j.addVar( 'query', directive );
	if ( typeof( data ) == 'object' )
		j.addVar( 'jsondata', JSON.stringify ( data ) );
	else j.addVar( 'data', data );
	j.onload = function()
	{
		if( this.returnCode == 'ok' )
		{
			// DUMB fuck API v1 check
			if( this.returnData.match( /API[\s]+\=[\s]+['"]v1['"]/ ) )
			{
				var d = this.returnData;
				var ifr = document.createElement( 'iframe' );
				ifr.setAttribute( 'sandbox', 'allow-same-origin allow-forms allow-scripts allow-pointer-lock' );
				ifr.onload = function()
				{
					var doc;
					if( this.contentDocument )
						doc = this.contentDocument;
					else doc = this.contentWindow.document;
					
					// Assign API
					doc.api = FriendAPI;
					
					// Add script (without script tags)
					var scr = doc.createElement( 'script' );
					scr.innerHTML = d.split( /\<[/]{0,}script[^>]*\>/i ).join ( '' );
					doc.body.appendChild( scr );
					
					AddApplicationFrame( data, ifr );
				}
				document.body.appendChild( ifr );
			}
			else
			{
				RunScripts( this.returnData );
			}
		}
		else Ac2Alert( i18n('Could not interpret directive.')  );
	}
	j.send ();
}

// Load a javascript application into a sandbox
function ExecuteApplication( app )
{
	var j = new cAjax();
	j.open( 'post', 'apps/' + app + '/Config.conf', true );
	j.onload = function()
	{
		var conf = JSON.parse( this.responseText() );
		if( typeof( conf ) == 'object' )
		{
			if( typeof( conf.API ) == 'undefined' )
			{
				Ac2Alert( 'Can not run v0 applications.' );
				return false;
			}
			// Load sandbox js
			function md5( str )
			{
				return str;
			}
			var sbox = new cAjax();
			sbox.open( 'post', 'js/friendapi_sandbox_obf.js', true );
			sbox.onload = function()
			{
				var sandbox_api = this.responseText();
				var p = new cAjax();
				p.open( 'post', 'apps/' + app + '/' + app + '.friendapp.js', true );
				p.onload = function()
				{
					var func = this.responseText();
					var authkey = '';
					
					// Javascript dependencies
					var jsdeps = [
						'utils/engine',
						'utils/json',
						'utils/md5',
						'utils/cssparser'
					];
					
					// Add authkey on javascripts
					//func = func.split( #/\*[^*]*\*+([^/][^*]*\*+)*/[\n|\r]{0,}# ).join( '' );
					func = Trim ( func );
					func = func.split( "\n" );
					func[0] = func[0].split( 'Application' ).join( 'function' );
					func = func.join( "\n" );
					func = func.split( /i18n[ ]{0,1}\(/ ).join( 'Application.i18n(' );
					func = func.split( /OpenLibrary[ ]{0,1}\(/ ).join( 'Application.openLibrary(\''+authkey+'\',', func );
					func = func.split( /new[ ]+File[ ]{0,1}\(/ ).join( 'new File( \'' + authkey + '\','); // Files get auth hash
					func = func.split( /new[ ]+Container[ ]{0,1}\(/ ).join( 'new Container( \'' + authkey + '\',' ); // Files get auth hash
					func = func.split( /new[ ]+Door[ ]{0,1}\(/ ).join( 'new Door( \'' + authkey + '\',' ); // Files get auth hash
					func = func.split( /new[ ]+Module[ ]{0,1}\(/ ).join( 'new Module( \'' + authkey + '\',' ); // Files get auth hash
					func = func.split( /new[ ]+Library[ ]{0,1}\(/ ).join( 'new Library( \'' + authkey + '\',' ); // Files get auth hash
					func = func.split( 'admin.php' ).join( md5('admin.php') ); // protect
					func = func.split( '.php' ).join( '' );
					func = func.split( md5('admin.php') ).join( 'admin.php' ); // reinstate!
					
					// Progdirs include application name
					func = func.split( /progdir\:/i ).join( 'apps/' + conf.Name + '/' );
				
					// TODO: Include all translations
					var str = sandbox_api + 'var ____translations = new Array ();\
var args = new Object();\
args.API = \'' + conf.API + '\';\
var Application = new FriendApplication ( \'' + conf.Name + '\' );\
Application.translations = ____translations;\
Application.Init = ' + func + ';\
Application.Path = \'apps/' + conf.Name + '/\';\
Application.Init ( args );';

					// Load application into a sandboxed iframe
					var ifr = document.createElement( 'iframe' );
					ifr.setAttribute( 'sandbox', 'allow-same-origin allow-forms allow-scripts allow-pointer-lock' );
					ifr.onload = function()
					{
						var doc = this.contentDocument ? this.contentDocument : this.contentWindow;
						if( doc.document ) doc = doc.document;
						
						// FIXME: Make secure
						doc.api = FriendAPI;
						
						for( var a = 0; a < jsdeps.length; a++ )
						{
							var s = doc.createElement( 'script' );
							s.src = 'js/' + jsdeps[a] + '.js';
							doc.body.appendChild( s );
						}
						
						var div = doc.createElement( 'script' );
						div.innerHTML = str;
						doc.body.appendChild( div );
					}
					document.body.appendChild( ifr );
				}
				p.send();
			}
			sbox.send();
		}
	}
	j.send();
}

