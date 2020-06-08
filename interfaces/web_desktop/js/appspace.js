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
*                                                                              *
* The FriendUP Desktop Environment interface. For use on workstations and      *
* other places. This is the app space version of workspace!                    *
*                                                                              *
*******************************************************************************/
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
	theme: 'friendup12',
	themeData: {
		buttonSchemeText: "windows",
		colorSchemeText: "default"
	},
	exitMobileMenu: function()
	{
		document.body.classList.remove( 'WorkspaceMenuOpen' );
		if( ge( 'WorkspaceMenu' ) )
		{
			var eles = ge( 'WorkspaceMenu' ).getElementsByTagName( '*' );
			for( var z = 0; z < eles.length; z++ )
			{
				if( eles[z].classList && eles[z].classList.contains( 'Open' ) )
					eles[z].classList.remove( 'Open' );
			}
			ge( 'WorkspaceMenu' ).classList.remove( 'Open' );
			if( WorkspaceMenu.back )
			{
				WorkspaceMenu.back.parentNode.removeChild( WorkspaceMenu.back );
				WorkspaceMenu.back = null;
			}
		}
	},
	init: function( mode )
	{
		// Add locale
		i18nAddPath( 'locale/en.locale' );

		this.mode = mode;

		// Interpret directive
		var urlVars = {};
		var url = document.location.href;
		if( url.indexOf( '?' ) > 0 )
		{
			url = url.split( '?' )[1];
			if( url.indexOf( '&' ) > 0 )
			{
				url = url.split( '&' );
			}
			else
			{
				url = [ url ];
			}
			
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
		}
		this.conf = urlVars;
		var t = this;
		var p = 'HASHED' + Sha256.hash( 'apipass' );
		var j = new cAjax();

		var si = GetUrlVar( 'sessionid' );
		var au = GetUrlVar( 'authid' );
		var th = GetUrlVar( 'theme' );
		if( th )
			this.themeOverride = th;
		
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
			var error = false;
			
			var o = false;
			if( r )
			{
				try
				{ 
					o = JSON.parse( r ); 
				} 
				catch( e )
				{ 
					if( r == 'fail' )
					{
						error = 'The Friend API user is unavailable or does not exist.';
					}
					console.log( 'Result is not in JSON format.', r, d ); 
				}
			}

			// Either guest user or real user
			if( ( ( si || au ) && r == 'ok' ) || ( r && o ) )
			{
				if( ( ( si || au ) && ( !o || typeof( o ) == 'undefined' ) ) || o.result == '0' || o.result == 3 )
				{
					// Loading remaining scripts
					var s = document.createElement( 'script' );
					s.src = '/webclient/js/api/friendapi.js;' +
						'webclient/js/gui/workspace_inside.js;' +
						'webclient/3rdparty/adapter.js;' +
						'webclient/js/utils/speech-input.js;' +
						'webclient/js/utils/events.js;' +
						'webclient/js/utils/utilities.js;' +
						'webclient/js/io/directive.js;' +
						'webclient/js/io/door.js;' +
						'webclient/js/io/dormant.js;' +
						'webclient/js/io/dormantramdisc.js;' +
						'webclient/js/io/door_system.js;' +
						'webclient/js/io/module.js;' +
						'webclient/js/io/file.js;' +
						'webclient/js/io/progress.js;' +
						'webclient/js/io/friendnetwork.js;' +
						'webclient/js/io/friendnetworkshare.js;' +
						'webclient/js/io/friendnetworkfriends.js;' +
						'webclient/js/io/friendnetworkdrive.js;' +
						'webclient/js/io/friendnetworkpower.js;' +
						'webclient/js/io/friendnetworkextension.js;' +
						'webclient/js/io/friendnetworkdoor.js;' +
						'webclient/js/io/friendnetworkapps.js;' +
						'webclient/js/io/workspace_fileoperations.js;' + 
						'webclient/js/io/DOS.js;' +
						'webclient/3rdparty/favico.js/favico-0.3.10.min.js;' +
						'webclient/js/gui/widget.js;' +
						'webclient/js/gui/listview.js;' +
						'webclient/js/gui/directoryview.js;' +
						'webclient/js/io/directoryview_fileoperations.js;' +
						'webclient/js/gui/menufactory.js;' +
						'webclient/js/gui/workspace_menu.js;' +
						'webclient/js/gui/deepestfield.js;' +
						'webclient/js/gui/filedialog.js;' +
						'webclient/js/gui/printdialog.js;' +
						'webclient/js/gui/desklet.js;' +
						'webclient/js/gui/calendar.js;' +
						'webclient/js/gui/colorpicker.js;' +
						'webclient/js/gui/workspace_tray.js;' +
						'webclient/js/gui/tutorial.js;' +
						'webclient/js/media/audio.js;' +
						'webclient/js/io/p2p.js;' +
						'webclient/js/io/request.js;' +
						'webclient/js/io/coreSocket.js;' +
						'webclient/js/io/networkSocket.js;' +
						'webclient/js/io/connection.js;' +
						'webclient/js/friendmind.js;' +
						'webclient/js/frienddos.js;' +
						'webclient/js/oo.js;' + 
						'webclient/js/api/friendAPIv1_2.js';
					s.onload = function()
					{
						// Register no Workspace object
						if( !si && o && o.sessionid ) Workspace.sessionId = o.sessionid;
						if( ( au || si ) && authType && authValue ) Workspace[authType] = authValue;

						// Ping every 10 seconds
						if( !window.pingInt ) window.pingInt = setInterval( Workspace.pingAccount, 10000 );
						Workspace.pingAccount();

						// Get available drives
						return Workspace.getMountlist( function()
						{
							// Setup default Doors screen
							var wbscreen = new Screen( {
									title: 'Friend Workspace v1.2-rc1',
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
							// Loading notice
							var loading = document.createElement( 'div' );
							loading.className = 'LoadingMessage';
							if( typeof( t.conf.app ) == 'undefined' )
								loading.innerHTML = '<p>Nothing to load...</p>';
							else loading.innerHTML = '<p>Entering ' + t.conf.app + '...</p>';
							document.body.appendChild( loading );
							setTimeout( function()
							{
								loading.classList.add( 'Loaded' );
							}, 25 );
							
							if( t.conf.app )
							{
								return loadApplicationBasics( function()
								{
									ExecuteApplication( t.conf.app, GetUrlVar( 'data' ), function( result )
									{
										// Prevent loading twice...
										if( document.body.loaded ) return;
										document.body.loaded = true;
									
										// Remove loading notice
										if( loading )
										{
											loading.classList.remove( 'Loaded' );
											setTimeout( function()
											{
												if( loading )
												{
													loading.parentNode.removeChild( loading );
													loading = null;
												}
											}, 500 );
										}
										function showThankyou()
										{
											if( !ge( 'Thanks' ) )
											{
												// Wait till we have windows!
												var count = 0;
												for( var a in window.movableWindows ){ count++; }
												if( count <= 0 )
													return setTimeout( showThankyou, 500 );
											
												// Open the thank you template
												var jo = new cAjax();
												jo.open( 'get', '/webclient/templates/thankyou.html', true, false );
												jo.onload = function()
												{
													if( ge( 'Thanks' ) ) return;
													var ele = document.createElement( 'div' );
													ele.id = 'Thanks';
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
											}
										}
										showThankyou();
									} );
								} );
							}
						} );
					}
					document.body.appendChild( s );
					return;
				}
			}
			if( !error ) error = 'FriendUP can not interpret application call.';
			var d = document.createElement( 'div' );
			d.className = 'DialogError';
			d.innerHTML = '<p>' + error + '</p>';
			document.body.appendChild( d );
			document.body.classList.add( 'Error' );
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

		// Init security subdomains
		if( window.SubSubDomains )
			SubSubDomains.initSubSubDomains();
	},
	// Get a door by path
	getDoorByPath: function( path )
	{
		if( !path ) return false;
		if( d = ( new Door() ).get( path ) )
			return d;
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
	refreshDesktop: function( callback ){ if ( callback ) callback(); },
	refreshMenu: function(){},
	// Objects and arrays
	icons: [],
	reloginAttempts: 0,
	menuMode: 'pear',
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
	conn: null,
	websocketsOffline: true,
	//set an additional URL to call on logout
	setLogoutURL: function( logoutURL )
	{
		Workspace.logoutURL = logoutURL;
	}
}
Doors = Workspace;
