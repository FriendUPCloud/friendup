/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

// App space version of workspace!
var _protocol = document.location.href.split( '://' )[0];

/* just make the needed functions available without enven doing stuff in deepestfield */
DeepestField = {
	drawTasks: function() {},
	networkActivity: { timeToFinish: [] },
	addConnection: function(){},
	delConnection: function(){}

};

Workspace = {
	locale: 'en',
	init: function( mode )
	{
		// Add locale
		i18nAddPath( 'locale/en.locale' );

		this.mode = mode;

		// Interpret directive
		var urlVars = {};
		var url = document.location.href.split( '?' )[1].split( '&' );
		for( var a = 0; a < url.length; a++ )
		{
			var pair = url[a].split( '=' );
			urlVars[pair[0]] = decodeURIComponent( pair[1] );
			if( urlVars[pair[0]].indexOf( ':' ) > 0 )
			{
				// JSON?
				try
				{
					var o = JSON.parse( urlVars[pair[0]] );
					if( o ) urlVars[pair[0]] = o;
				}
				// No, a path maybe
				catch( e )
				{
					// Good
				}
			}
		}
		this.conf = urlVars;
		var t = this;
		var p = 'HASHED' + Sha256.hash( 'apipass' );
		var j = new cAjax();

		var si = GetUrlVar( 'sessionid' );
		var au = GetUrlVar( 'authid' );
		var authType = si ? 'sessionId' : 'authId';
		var authValue = si ? si : au;

		if( !au && !si )
		{
			j.open( 'POST', '/system.library/login', true, true );
			j.addVar( 'username', 'apiuser' );
			j.addVar( 'password', p );
			j.addVar( 'deviceid', 'loving-crotch-grabbing-espen' );
		}
		// TODO: Do something useful here!
		else
		{
			j.open( 'POST', '/system.library/help', true, true );
			j.addVar( authType.toLowerCase(), authValue );
		}
		j.onload = function( r, d )
		{
			var o = false;
			if( r )
			{
				try{ o = JSON.parse( r ); } catch( e )
				{ console.log( 'Result is not in JSON format.' ); }
			}

			// Either guest user or real user
			if( ( ( si || au ) && r == 'ok' ) || ( r && o ) )
			{
				if( ( ( si || au ) && ( !o || typeof( o ) == 'undefined' ) ) || o.result == '0' || o.result == 3 )
				{
					// Register no Workspace object
					if( !si && o && o.sessionid ) Workspace.sessionId = o.sessionid;
					if( au || si ) Workspace[authType] = authValue;

					// Ping every 10 seconds
					if( !window.pingInt ) window.pingInt = setInterval( Workspace.pingAccount, 10000 );
					Workspace.pingAccount();

					// Get available drives
					return Workspace.getMountlist( function()
					{
						// Setup default Doors screen
						var wbscreen = new Screen( {
								title: 'Friend Workspace v1.0.0',
								id:	'DoorsScreen',
								extra: Workspace.fullName,
								taskbar: false
							}
						);

						// Touch start show menu!
						wbscreen.contentDiv.addEventListener( 'click', function( e )
						{
							var t = e.target ? e.target : e.srcElement;
							if( t == wbscreen.contentDiv )
							{
								// You need to click two times! And within 500 ms
								setTimeout( function()
								{
									wbscreen.canShowMenu = false;
								}, 500 );
								if( !wbscreen.canShowMenu )
								{
									wbscreen.canShowMenu = true;
									return;
								}
								setTimeout( function()
								{
									WorkspaceMenu.show();
									ge( 'MobileMenu' ).classList.add( 'Visible' );
								}, 100 );
							}
						}, true );


						document.body.style.visibility = 'visible';

						if( t.conf.app )
						{
							return ExecuteApplication( t.conf.app, GetUrlVar( 'data' ), function()
							{
								setTimeout( function()
								{
									var jo = new cAjax();
									jo.open( 'get', '/webclient/templates/thankyou.html', true, false );
									jo.onload = function()
									{
										var ele = document.createElement( 'div' );
										ele.className = 'ThankYou Padding';
										ele.innerHTML = this.responseText();
										var s = GeByClass( 'ScreenContent' );
										if( s )
										{
											if( s.length ) s = s[0];
											s.appendChild( ele );
										}
										else document.body.appendChild( s );
									}
									jo.send();
								}, 2000 );
							} );
						}
					} );
				}
			}
			document.body.innerHTML = '<h1>Error with call</h1><p>FriendUP can not interpret application call.</p>';
		}
		j.send();

		// Add event listeners
		for( var a = 0; a < this.runLevels.length; a++ )
		{
			var listener = this.runLevels[a].listener;

			if ( !listener )
				continue;

			if( window.addEventListener )
				window.addEventListener( 'message', listener, true );
			else window.attachEvent( 'onmessage', listener, true );
		}

		// Set theme
		if( typeof( this.conf.theme ) != 'undefined' )
			this.refreshTheme( this.conf.theme );

		// Init security subdomains
		SubSubDomains.initSubSubDomains();
	},
	refreshTheme: function( themeName, update )
	{
		// Only on force or first time
		if( this.themeRefreshed && !update )
			return;
		this.themeRefreshed = true;

		Workspace.theme = themeName ? themeName.toLowerCase() : '';
		themeName = Workspace.theme;

		var h = document.getElementsByTagName( 'head' );
		if( h )
		{
			h = h[0];

			// New css!
			var styles = document.createElement( 'link' );
			styles.rel = 'stylesheet';
			styles.type = 'text/css';
			styles.onload = function(){ document.body.className = 'Inside'; }

			if( themeName && themeName != 'default' )
			{
				AddCSSByUrl( '/themes/' + Workspace.theme + '/scrollbars.css' );
				if( !Workspace.sessionId )
					styles.href = '/themes/' + Workspace.theme + '/theme_compiled.css';
				else styles.href = '/system.library/module/?module=system&command=theme&args=' + encodeURIComponent( '{"theme":"' + themeName + '"}' ) + '&sessionid=' + Workspace.sessionId;
			}
			else
			{
				AddCSSByUrl( '/webclient/theme/scrollbars.css' );
				if( !Workspace.sessionId )
					styles.href = '/themes/friendup/theme_compiled.css';
				else styles.href = '/system.library/module/?module=system&command=theme&args=' + encodeURIComponent( '{"theme":"friendup"}' ) + '&sessionid=' + Workspace.sessionId;
			}

			// Remove old one
			var l = h.getElementsByTagName( 'link' );
			for( var b = 0; b < l.length; b++ )
			{
				if( l[b].parentNode != h ) continue;
				l[b].href = '';
				l[b].parentNode.removeChild( l[b] );
			}

			// Add new one
			h.appendChild( styles );
		}

		// TODO: Loop through all apps and update themes...


	},
	// Get a door by path
	getDoorByPath: function( path )
	{
		if( !path ) return false;
		var list = Workspace.icons;
		var part = path.split( ':' )[0] + ':';
		for( var a = 0; a < list.length; a++ )
		{
			if( list[a].Volume == part )
			{
				return list[a].Dormant ? list[a].Dormant : list[a].Door;
			}
		}
		return false;
	},
	// Fetch mountlist from database
	getMountlist: function( callback )
	{
		var t = this;
		var m = new Module( 'system' );
		m.onExecuted = function( e, dat )
		{
			t.icons = [];

			// Check dormant
			if( DormantMaster )
			{
				var doors = DormantMaster.getDoors();
				var found = [];
				for( var a = 0; a < doors.length; a++ )
				{
					// Fixie
					if( doors[a].Title && !doors[a].Volume )
						doors[a].Volume = doors[a].Title;
					doors[a].Filesize = '';
					var isfound = false;
					for( var b = 0; b < found.length; b++ )
						if( found[b].Title == doors[a].Title )
							isfound = true;
					if( !isfound )
					{
						t.icons.push( doors[a] );
					}
					found.push( doors[a] );
				}
			}

			// Network devices
			var rows = friendUP.tool.parse( dat );
			if ( rows && rows.length )
			{
				for ( var a = 0; a < rows.length; a++ )
				{
					var r = rows[a];
					if( r.Mounted != '1' )
					{
						continue;
					}
					var o = false;

					var d;

					var typ = r.Type.substr(0,1).toUpperCase()+r.Type.substr(1,r.Type.length);

					d = ( new Door() ).get( r.Name + ':' );
					d.permissions[0] = 'r';
					d.permissions[1] = 'w';
					d.permissions[2] = 'e';
					d.permissions[3] = 'd';

					var o = {
						Title: r.Name.split(':').join('') + ':',
						Volume: r.Name.split(':').join('') + ':',
						Path: r.Name.split(':').join('') + ':',
						Type: 'Door',
						MetaType: 'Directory',
						ID: r.ID,
						Mounted: r.Mounted ? true : false,
						Door: d
					};

					// Force mounnt
					var f = new FriendLibrary( 'system.library' );
					f.addVar( 'type', r.Type );
					f.addVar( 'devname', r.Name.split(':').join('') );
					if( r.Type != 'Local' )
						f.addVar( 'module', 'system' );
					f.execute( 'device/mount' );

					// We need volume information
					d.Volume = o.Volume;
					d.Type = typ;

					// Add to list
					t.icons.push( o );
				}
			}

			// Do the callback thing
			if( callback ) callback( t.icons );
		}
		m.execute( 'mountlist', this.conf );

		return true;
	},
	// Just check if the system is being used or has expired
	pingAccount: function()
	{
		var realApps = 0;
		for( var a = 0; a < Workspace.applications.length; a++ )
		{
			realApps++;
		}
		if( realApps > 0 )
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e != 'ok' )
				{
					return false;
				}
			}
			m.execute( 'ping' );
		}
	},

	// Dummy functions here
	relogin: function( us, ps ){},
	updateTasks: function(){},
	refreshDesktop: function(){},
	refreshMenu: function(){},
	// Objects and arrays
	icons: [],
	menuMode: 'pear', // 'miga', 'fensters' (alternatives)
	initialized: true,
	protocol: _protocol,
	menu: [],
	diskNotificationList: [],
	notifications: [],
	applications: [],
	importWindow: false,
	menuState: '',
	themeOverride: false,
	systemInfo: false,
	lastfileSystemChangeMessage:false,
	serverIsThere: false,
	runLevels: [
		{
			name: 'root',
			domain: _protocol + '://' + document.location.href.match( /h[^:]*?\:\/\/([^/]+)/i )[1]
		},
		{
			name: 'utilities',
			domain: _protocol + '://' + document.location.href.match( /h[^:]*?\:\/\/([^/]+)/i )[1],
			/*domain: 'http://utilities.' + document.location.href.match( /h[^:]*?\:\/\/([^/]+)/i )[1],*/
			listener: apiWrapper
		}
	],
	directoryView: false,
	//set an additional URL to call on logout
	setLogoutURL: function( logoutURL )
	{
		Workspace.logoutURL = logoutURL;
	}
}
Doors = Workspace;
