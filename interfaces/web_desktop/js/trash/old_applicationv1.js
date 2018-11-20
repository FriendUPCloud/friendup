/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*******************************************************************************
* Run applications in different runlevels and communicate                      *
*******************************************************************************/


// Prototype for a friend application
// API v0!
// Deprecated!!!
FriendApplication = function ( appName )
{
	this.Name = appName;
	this.masterView = false;
	this.libraries = new Array ();
	this.iframes = new Array ();
	// FIXME: This is deprecated - fix all apps!
	this.setMasterWindow = function ( win ) { this.masterView = win; };
	this.getMasterWindow = function () { return this.masterView; };
	// Set master view
	this.setMasterView = function ( win )
	{
		this.masterView = win;
	};
	// Return master view
	this.getMasterView = function ()
	{
		return this.masterView;
	};
	this.i18n = function ( str )
	{
		if ( this.translations[ str ] )
			return this.translations[ str ];
		return str;
	};
	this.OpenLibrary = function ( authkey, path, id, div )
	{
		var ap = this;
		
		// Anchor point
		var lib = new Object ();
		lib.loaded = false;

		// Load the library and get code back
		var m = new cAjax ();
		m.open ( 'post', 'admin.php?module=system&command=file', true, true );
		m.addVar ( 'fileInfo', JSON.stringify ( { 'Path' : path, 'Mode' : 'raw' } ) );
		m.addVar ( 'authkey', authkey );
		m.app = this;
		m.onload = function ()
		{
			if ( this.returnCode == 'ok' )
			{
				// Connect on an iframe
				var ifr = document.createElement ( 'iframe' );
				var r = this;
				ifr.onload = function () 
				{
					var d = this.document ? this.document.documentElement : this.contentWindow.document;
					d.write ( '<html><head></head><body><script>' + r.returnData + '</script></body></html>' );
					if ( !id )
					{
						while ( typeof ( ap.libraries[id] ) != 'undefined' )
							id = Math.random ( 0, 999 ) + Math.random ( 0, 999 );
					}
					ap.libraries[id] = d;
					// Tell that library is loaded
					lib.library = this.document ? this.document : this.contentWindow;
					lib.loaded = true;
					// Run onload function if possible
					if ( typeof ( lib.onLoad ) == 'function' )
					{
						lib.onLoad ();
					}
				}
				// Use master window instead of body
				if ( div ) div.appendChild ( ifr );
				else if ( this.app.masterView ) this.app.masterView._window.appendChild ( ifr );
				else document.body.appendChild ( ifr );
				ap.iframes.push ( ifr );
			}
		}
		m.send ();
		return lib;
	};
	// FIXME: Let this function be called on closing of last window!
	// FIXME: Also let it be called on program quit
	// FIXME: Fix it!
	this.quit = function ()
	{
		if ( this.iframes.length )
		{
			for ( var a = 0; a < this.iframes.length; a++ )
			{
				this.iframes[a].parentNode.removeChild ( this.iframes[a] );
			}
		}
	};
};

/* Support functions -------------------------------------------------------- */

var friendApplications = [];

// Add application to running apps
function AddApplication ( appid, appname, appobject )
{
	friendApplications.push ( { 'AppID': appid, 'AppName': appname, 'AppObject': appobject } );
}
function FindApplicationByName ( appname )
{
	for ( var a = 0; a < friendApplications.length; a++ )
		if ( friendApplications[a].AppName == appname )
			return friendApplications[a].AppObject;
	return false; 
}
function FindApplicationByAppID ( appid )
{
	for ( var a = 0; a < friendApplications.length; a++ )
		if ( friendApplications[a].AppID == appid )
			return friendApplications[a].AppObject;
	return false; 
}
// Add an application frame as an application
function AddApplicationFrame( nam, ifr )
{
	friendApplications.push( nam + '_id', nam, ifr );
}

/* Wrapper for current version ---------------------------------------------- */

var FriendAPI = {
	// Manages all windows
	windows: [],
	// Creates a new screen with a sandboxed object
	createScreen: function( flags )
	{
		var s = new Screen( flags );
		var controller = {
			screenToFront: function()
			{
				s.screenToFront();
			},
			screenCycle: function()
			{
				s.screenCycle();
			},
			close: function()
			{
				s.close();
			}
		};
		return controller;
	},
	// Creates a new view with a sandboxed object
	createView: function( flags )
	{
		var w = new View( flags );
		
		// Css styles
		var links   = document.getElementsByTagName( 'head' )[0].getElementsByTagName( 'link' );
		
		// Javascript dependencies
		var jsdeps = [
			'utils/engine',
			'utils/json',
			'utils/md5',
			'utils/cssparser'
		];
		
		var controller = 
		{
			setFlag: function( flag, value )
			{
				w.setFlag( flag, value );
			},
			setContent: function( cnt )
			{
				w._window.innerHTML = '';
				var ifr = document.createElement( 'iframe' );
				w._window.appendChild( ifr );
				doc = ifr.contentDocument ? ifr.contentDocument : ifr.contentWindow.document;
				
				var head = doc.getElementsByTagName( 'head' )[0];
				for ( var a = 0; a < links.length; a++ )
				{
					var l = doc.createElement( 'link' );
					l.rel = links[a].rel;
					l.href = links[a].href;
					head.appendChild( l );
				}
				for( var a = 0; a < jsdeps.length; a++ )
				{
					var s = doc.createElement( 'script' );
					s.src = 'js/' + jsdeps[a] + '.js';
					head.appendChild( s );
				}
				doc.body.innerHTML = cnt;
			},
			setMenuItems: function( array )
			{
				var r = w.setMenuItems( array );
				return r ? true : false;
			},
			addEvent: function( evt, func )
			{
				w.addEvent( evt, func );
			},
			initTabs: function( element )
			{
				return;
			},
			getByClass: function( className, pelement )
			{
				var ifr = w.getElementsByTagName( 'iframe' )[0];
				var doc = ifr.contentDocument ? ifr.contentDocument : ifr.contentWindow.document;
				if ( !pelement ) pelement = doc;
				var eles = pelement.getElementsByTagName( '*' );
				var out = [];
				for( var a = 0; a < eles.length; a++ )
				{
					if( !eles[a].className || !eles[a].className.length )
						continue;
					var classes = eles[a].className.split( ' ' );
					var found = false;
					for ( var b = 0; b < classes.length; b++ )
					{
						if ( classes[b] == className )
						{
							found = true;
							break;
						}
					}
					if ( found ) out.push( eles[a] );
				}
				return out;
			},
			getElementsByTagName: function( tagName )
			{
				var ifr = w.getElementsByTagName( 'iframe' )[0];
				var doc = ifr.contentDocument ? ifr.contentDocument : ifr.contentWindow.document;
				return doc.getElementsByTagName( tagName );
			}
		};
		// Assign controller
		w.controller = controller;
		// Add to window list
		this.windows.push( w );
		// Return proxy object
		return controller;
	},
	// Creates a proxy door
	createDoor: function( authkey, path )
	{
		var j = path.split( ':' )[0] + ':';
		var d = false;
		for( var a = 0; a < Doors.icons.length; a++ )
		{
			if( Doors.icons[a].Title == j )
			{
				d = Doors.icons[a];
			}
		}
		if( !d ) return false;
		var n = d.Door.get( authkey, path );
		// FIXME: Create proxy functions here on a proxy object!!!
		return n;
	},
	// Creates a new file with a sandboxed object
	createFile: function( authkey, path )
	{
		var f = new File( authkey, path );
		var controller = 
		{
			load: function()
			{
				f.load();
			}
		};
		f.onLoad = function()
		{
			controller.proxy.data = this.data;
			controller.proxy.data = this.rawdata;
			controller.proxy.onLoad();
		}
		return controller;
	},
	// Open library implementation
	openLibrary: function( authkey, path, id, div )
	{
		// Anchor point
		var lib = new Object ();
		lib.loaded = false;

		// Load the library and get code back
		var m = new cAjax ();
		m.open( 'post', 'admin.php?module=system&command=file', true, true );
		m.addVar( 'fileInfo', JSON.stringify( { 'Path' : path, 'Mode' : 'raw' } ) );
		m.addVar( 'authkey', authkey );
		m.onload = function()
		{
			if( this.returnCode == 'ok' )
			{
				// Connect on an iframe
				var ifr = document.createElement( 'iframe' );
				var r = this;
				ifr.onload = function() 
				{
					var d = this.document ? this.document.documentElement : this.contentWindow.document;
					d.write( '<html><head></head><body><script>' + r.returnData + '</script></body></html>' );
					// Tell that library is loaded
					lib.library = this.document ? this.document : this.contentWindow;
					lib.loaded = true;
					// Run onload function if possible
					if( typeof( lib.onLoad ) == 'function' )
					{
						lib.onLoad();
					}
				}
				// Use master window instead of body
				if( div ) div.appendChild( ifr );
				else return false;
				return ifr;
			}
		}
		m.send ();
		return lib;
	},
	// Proxy for modules
	createModule: function( authkey, mod )
	{
		var m = new Module( authkey, mod );
		var controller = 
		{
			execute: function( command, data )
			{
				m.execute( command, data );
			}
		};
		m.onExecuted = function()
		{
			controller.proxy.returnData = this.returnData;
			if( controller.proxy.onExecuted )
				controller.proxy.onExecuted();
		}
		return controller;
	}
};

