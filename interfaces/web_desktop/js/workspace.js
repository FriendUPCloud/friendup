/*******************************************************************************
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
*******************************************************************************/

/*******************************************************************************
*                                                                              *
* The FriendUP Desktop Environment interface. For use on workstations and      *
* other places.                                                                *
*                                                                              *
*******************************************************************************/

var _protocol = document.location.href.split( '://' )[0];

Workspace = {
	icons: [],
	menuMode: 'pear', // 'miga', 'fensters' (alternatives)
	initialized: false,
	protocol: _protocol,
	menu: [],
	diskNotificationList: [],
	applications: [],
	importWindow: false,
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
	init: function()
	{	
		if( window.isMobile )
		{
			AddCSSByUrl( '/webclient/css/responsive.css' );
		}
		// First things first
		if( !this.initialized )
		{
			// Wait for load
			if( typeof( InitWindowEvents ) == 'undefined' || typeof( InitGuibaseEvents ) == 'undefined' )
				return setTimeout( 'Workspace.init()', 50 );
				
			this.initialized = true;
			InitWindowEvents();
			InitWorkspaceEvents();
			InitGuibaseEvents();
			i18nAddPath( 'locale/en.locale' );
		}
		
		// Establish a websocket connection to the core
		/*if( !this.websocket )
		{
			this.websocket = new FriendWebSocket();
			var ws = this.websocket;
			ws.connect( document.location.href.split( 'http' ).join ( 'ws' ).split( '/we' )[0].split( /\:[0-9]+/i ).join( ':6500' ) );
		}*/
		
		// Show the login prompt if we're not logged in!
		if( !this.login() )
		{
			this.showLoginPrompt();
			return;
		}
		
		if( typeof( ge ) == 'undefined' || document.body.className != 'Inside' ) return setTimeout ( 'Workspace.init()', 5 );
		
		// Deepest field population
		ge( 'TasksHeader' ).innerHTML = '<h2>' + i18n( 'Running tasks' ) + ':</h2>';
		ge( 'ShellHeader' ).innerHTML = '<h2>' + i18n( 'Shell output' ) + ':</h2>';
		
		var dapis = document.createElement( 'script' );
		dapis.src = '/system.library/module/?module=system&command=doorsupport&sessionid=' + this.sessionId;
		document.getElementsByTagName( 'head' )[0].appendChild( dapis ); 
		
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
		
		// Set base url
		this.baseUrl = document.location.href.split( 'index.html' )[0];
		
		// Setup basic doors
		this.getMountlist();
		
		// Setup default Doors screen
		var wbscreen = new Screen( {
				title: 'Workspace v1.0 b3b',
				id:	'DoorsScreen',
				extra: Workspace.fullName,
				taskbar: true
			}
		);
		
		setTimeout( function(){ Workspace.informationWindow(); }, 1000 );
		
		// Make links to screen on this object
		this.screen = wbscreen;
		this.screenDiv = wbscreen.div;
		
		// Recall wallpaper from settings
		this.refreshUserSettings( function(){ Workspace.refreshDesktop(); } );
		
		// Create desktop
		this.directoryView = new DirectoryView( wbscreen.contentDiv );
		
		// Create default desklet
		var mainDesklet = CreateDesklet( this.screenDiv, 64, 480, 'right' );
		
		// Add desklet to dock
		this.mainDock = mainDesklet;
		this.reloadDocks();
	},
	refreshUserSettings: function( callback )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' && d )
			{
				var dat = JSON.parse( d );
				if( dat.wallpaperdoors )
				{
					if( dat.wallpaperdoors.substr(0,5) == 'color' )
					{
						Workspace.wallpaperImage = 'color';
					}
					else if( dat.wallpaperdoors.length )
					{
						Workspace.wallpaperImage = dat.wallpaperdoors;
					}	
					else Workspace.wallpaperImage = 
						'/webclient/gfx/theme/default_login_screen.jpg';
				}
				// FaLLback
				else
				{
					Workspace.wallpaperImage = '/webclient/gfx/theme/default_login_screen.jpg';
				}
				
				if( dat.wallpaperwindows )
				{
					Workspace.windowWallpaperImage = dat.wallpaperwindows;
				}
				if( dat.language )
				{
					globalConfig.language = dat.language.spokenLanguage;
					globalConfig.alternateLanguage = dat.language.spokenAlternate ? dat.language.spokenAlternate : 'en-US';
				}
				if( dat.menumode )
				{
					Workspace.menuMode = dat.menumode;
				}
			}
			else
			{
				Workspace.wallpaperImage = '/webclient/gfx/theme/default_login_screen.jpg';
				Workspace.windowWallpaperImage = '';
			}
			if( callback ) callback();
		}
		m.execute( 'getsetting', { settings: [ 'wallpaperdoors', 'wallpaperwindows', 'language', 'menumode' ] } );
	},
	reloadDocks: function()
	{
		var c = new Module( 'dock' );
		c.onExecuted = function( cod, dat )
		{
			Workspace.mainDock.clear();
			if( cod == 'ok' && dat )
			{
				var elements = JSON.parse( dat );
				
				function getOnClickFn( appName )
				{
					return function()
					{
						ExecuteApplication( appName );
					}
				}
				
				for( var a = 0; a < elements.length; a++ )
				{
					var ele = elements[a];
					var icon = 'apps/' + ele.Name + '/icon.png';
					if( ele.Name.indexOf( ':' ) > 0 )
					{
						ext = ele.Name.split( ':' )[1];
						if( ext.indexOf( '/' ) > 0 )
						{
							ext = ext.split( '/' )[1];
						}
						ext = ext.split( '.' )[1];
						icon = '.' + ( ext ? ext : 'txt' );
					}
					
					Workspace.mainDock.addLauncher( { 
						exe   : ele.Name,
						type  : ele.Type,
						src   : icon,
						//click : getOnClickFn( ele.Name ), 
						'title' : ele.Title ? ele.Title : ele.Name
					} );
				}
			}
		}
		c.execute( 'items', { sessionid: false } );
	},
	connectFilesystem: function( execute )
	{
		if( execute )
		{
			var info = { 
				Name: ge( 'ConnectionGuiIntro' ).getElementsByTagName( 'input' )[0].value,
				Type: ge( 'ConnectionGuiIntro' ).getElementsByTagName( 'select' )[0].value
			};
			
			if( !info.Name || !info.Type )
			{
				ge( 'ConnectionGuiIntro' ).getElementsByTagName( 'input' )[0].focus();
				return false;
			}
			
			var inps = ge( 'ConnectionBoxGui' ).getElementsByTagName( '*' );
			for( var a = 0; a < inps.length; a++ )
			{
				// TODO: Support more input TYPES
				if( inps[a].nodeName == 'INPUT' )
				{
					info[inps[a].name] = inps[a].value;
				}
				else if( inps[a].nodeName == 'SELECT' )
				{
					info[inps[a].name] = inps[a].value;
				}
			}
			info.Mounted = '1';
			var m = new Module( 'system' );
			m.onExecuted = function()
			{
				Workspace.refreshDesktop();
			}
			m.execute( 'addfilesystem', info );
			
			Workspace.cfsview.close();
			return;
		}
		if( this.cfsview ) 
		{
			return false;
		}
		var v = new View( {
			title: i18n( 'i18n_connect_network_drive' ),
			width: 360,
			height: 400,
			id: 'connect_network_drive'
		} );
		v.onClose = function(){ Workspace.cfsview = false; }
		this.cfsview = v;
		var f = new File( 'System:templates/connect_netdrive.html' );
		f.onLoad = function( data )
		{
			v.setContent( data );
			Workspace.setFilesystemGUI( 'Shared' );
		}
		f.load();
	},
	setFilesystemGUI: function( type )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				ge( 'ConnectionBoxGui' ).innerHTML = d;
			}
			else
			{
				ge( 'ConnectionBoxGui' ).innerHTML = '<p class="Layout">You can not a drive of this type.</p>';
			}
		}
		m.execute( 'getfilesystemgui', { type: type } );
	},
	getBookmarks: function()
	{
		var bm = [
			{
				name: 'Friendos.com',
				command: function()
				{
					var w = window.open( 'http://friendos.com', '', '' );
				}
			},
			{
				divider: true
			},
			{
				name: i18n( 'menu_add_bookmark' ),
				command: function()
				{
					Workspace.addBookmark();
				}
			}
		];
		return bm;
	},
	showLoginPrompt: function()
	{
		// Set body to login state
		document.body.className = 'Login';
		
		setTimeout( function()
		{
			var lp = new View( {
				id: 'Login',
				width: 290,
				'min-width': 290,
				'max-width': 290,
				height: 123,
				'min-height': 123,
				'resize': false,
				title: 'Please log in',
				close: false
			} );
			lp.setRichContentUrl( 'templates/login_prompt.html' );
			Workspace.loginPrompt = lp;
		}, 100 );
		
		// Show it
		this.showDesktop();
	},
	// When session times out, use relogin
	relogin: function()
	{
		var d = document.createElement( 'div' );
		d.id = 'SessionBlock';
		document.body.appendChild( d );
		var f = new File( 'System:templates/login_relogin.html' );
		f.onLoad = function( data )
		{	
			Workspace.sessionId = false;
			d.innerHTML = data;
		}
		f.load();
		
	},
	renewAllSessionIds: function()
	{
		
	},
	login: function( u, p, r, callback )
	{
		// TODO: If we have sessionid - verify it through ajax.
		if( this.sessionId )
		{
			if( callback ) callback( true );
			return true;
		}
		
		// Require username and pw to login
		if( !u || !p )
		{
			if( callback ) callback( false );
			return false;
		}
		
		var t = this;
		this.loginUsername = u;
		
		if( p.indexOf('HASHED') == 0 )
		{
			this.loginPassword = p;
		}
		else
		{
			this.loginPassword = 'HASHED' + Sha256.hash( p );
		}

		if( this.loginUsername && this.loginPassword )
		{
			if( r )
			{
				SetCookie( 'loginUsername', this.loginUsername );
				SetCookie( 'loginPassword', this.loginPassword );
			}
			var m = new FriendLibrary( 'system' );
			m.addVar( 'username', t.loginUsername );
			m.addVar( 'password', t.loginPassword );
			m.addVar( 'sessionid', t.sessionId );
			m.onExecuted = function( json )
			{
				if( typeof( json ) != 'object' )
				{
					try
					{
						var to = JSON.parse( json );
						if( to.ErrorMessage && to.sessionid )
							json = to;
					}
					catch( e )
					{
						json = { ErrorMessage: -1 };
					}
				}
				if( json.ErrorMessage == '0' )
				{
					t.sessionId = json.sessionid;
					t.userId = json.userid;
					t.fullName = json.fullName;
					
					// Only renew session..
					if( ge( 'SessionBlock' ) )
					{
						// Could be many
						while( ge( 'SessionBlock' ) )
						{
							document.body.removeChild( ge( 'SessionBlock' ) );
						}
						Workspace.renewAllSessionIds();
						return;
					}
				
					document.body.className = 'Loading';
				
					// Lets load the stored window positions!
					LoadWindowStorage();
				
					// Set up a shell instance for the workspace
					var uid = FriendDOS.addSession( Workspace );
					Workspace.shell = FriendDOS.getSession( uid );
					
					// As for body.Inside screens, use > 0.2secs
					setTimeout( function()
					{
						// See if we have some theme settings
						var m = new Module( 'system' );
						m.onExecuted = function( e, d )
						{
							if( e == 'ok' )
							{
								var s = JSON.parse( d );
								if( s.Theme && s.Theme.length )
								{
									Workspace.refreshTheme( s.Theme.toLowerCase(), false );
								}
								else
								{
									Workspace.refreshTheme( false, false );
								}
								Workspace.mimeTypes = s.Mimetypes;
							}
							else Workspace.refreshTheme( false, false );
				
							if( t.loginPrompt )
							{
								t.loginPrompt.close();
								t.loginPrompt = false;
							}
				
							t.init();
						}
						m.execute( 'usersettings' );
				
					}, 400 );
					if( callback )callback( 1 );
					return 1;
				}
				else
				{
					t.loginPrompt.sendMessage( { command: "error" } );
					if( callback )callback( false );
				}
				document.body.className = 'Login';
			}
			m.execute( 'login' );
		}
		
		// Show it
		this.showDesktop();
		
		return 0;
	},
	// Reload system mimetypes
	reloadMimeTypes: function()
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				var s = JSON.parse( d );
				Workspace.mimeTypes = s.Mimetypes;
			}
		}
		m.execute( 'usersettings' );
	},
	// Refresh an open window by path
	// TODO: Make less aggressive! Use settimeouts f.ex. so we can abort multiple
	//       calls to refrash the same path
	refreshWindowByPath: function( path, depth )
	{
		// Don't allow many parents
		if( depth && depth > 1 ) return;
		
		// Remove file from filename (if any)
		// Paths end with /
		var fname = path + '';
		if( fname.substr( fname.length - 1, 1 ) != '/' )
		{
			var o = ''; var mod = 0;
			for( var b = fname.length - 1; b >= 0; b-- )
			{
				if( mod == 0 && ( fname.substr( b, 1 ) == '/' || fname.substr( b, 1 ) == ':' ) )
				{
					o = fname.substr( b, 1 ) + o;
					mod = 1;
				}
				else if( mod == 1 )
				{
					o = fname.substr( b, 1 ) + o;
				}
			}
			path = o;
		}
		
		for( var a in movableWindows )
		{	
			if( !movableWindows[a].content ) continue;
			if( movableWindows[a].content.fileInfo )
			{
				if( movableWindows[a].content.fileInfo.Path.toLowerCase() == path.toLowerCase() )
				{
					movableWindows[a].content.refresh();
				}
			}
		}
		// Also refresh parent if possible
		var p = path + '';
		var o = ''; var mod = 0;
		for( var b = p.length - 2; b >= 0; b-- )
		{
			if( mod == 0 && ( p.substr( b, 1 ) == '/' || p.substr( b, 1 ) == ':' ) )
			{
				o = p.substr( b, 1 ) + o;
				mod = 1;
			}
			else if( mod == 1 )
			{
				o = p.substr( b, 1 ) + o;
			}
		}
		if( o != path && o.length ) 
		{
			Workspace.refreshWindowByPath( o, depth + 1 );
		}
	},
	closeWindowByPath: function( path )
	{
		var fname = path + '';
		if( fname.substr( fname.length - 1, 1 ) != '/' )
		{
			//if we did not get a path to a directory we just refresh.... ;)
			Workspace.refreshWindowByPath( path, 0 );
			return;
		}
		
		// Also refresh parent first...
		var p = path + '';
		var o = ''; var mod = 0;
		for( var b = p.length - 2; b >= 0; b-- )
		{
			if( mod == 0 && ( p.substr( b, 1 ) == '/' || p.substr( b, 1 ) == ':' ) )
			{
				o = p.substr( b, 1 ) + o;
				mod = 1;
			}
			else if( mod == 1 )
			{
				o = p.substr( b, 1 ) + o;
			}
		}
		if( o != path && o.length ) 
		{
			Workspace.refreshWindowByPath( o, 1 );
		}
		
		for( var a in movableWindows )
		{	
			if( !movableWindows[a] || !movableWindows[a].content ) continue;
			if( movableWindows[a].content.fileInfo )
			{
				if( movableWindows[a].content.fileInfo.Path.toLowerCase() == path.toLowerCase() )
				{
					CloseView( movableWindows[a] );
				}
			}
		}
	},
	// Disk notification!
	// TODO: Think this through!!!
	// TODO: Add options, like when to notify etcetc..
	diskNotification: function( windowList, type )
	{
		/*// Check if we already have them!
		for( var a = 0; a < windowList.length; a++ )
		{
			var found = false;
			for( var w = 0; w < this.diskNotificationList; w++ )
			{
				if( this.diskNotificationList[w] == windowList[a] )
				{
					found = true;
					break;
				}
			}
			if( !found )
			{
				this.diskNotificationList.push( windowList[a] );
			}
		}
		// We want to do a refresh!
		if( type == 'refresh' )
		{
			if( this.diskNotificationTimeout )
				clearTimeout( this.diskNotificationTimeout );
			this.diskNotificationTimeout = setTimeout( function()
			{
				for( var z = 0; z < Workspace.diskNotificationList.length; z++ )
				{
					var ele = Workspace.diskNotificationList[z];
					if( ele && ele.refresh ) ele.refresh();
				}
				Workspace.diskNotificationList = [];
				this.diskNotificationTimeout = false;
			}, 250 );
		}*/
	},
	refreshTheme: function( themeName, update )
	{
		// Only on force or first time
		if( this.themeRefreshed && !update )
			return;
		this.themeRefreshed = true;
		
		this.refreshUserSettings( function(){ CheckScreenTitle(); } );
		
		Workspace.theme = themeName ? themeName.toLowerCase() : '';
		themeName = Workspace.theme;
		
		var h = document.getElementsByTagName( 'head' );
		if( h )
		{
			h = h[0];
			var l = h.getElementsByTagName( 'link' );
			for( var b = 0; b < l.length; b++ )
			{
				if( l[b].href.indexOf( 'theme' ) >= 0 )
				{
					l[b].parentNode.removeChild( l[b] );
					break;
				}
			}
			
			if( themeName )
			{
				AddCSSByUrl( '/themes/' + Workspace.theme + '/scrollbars.css' );
				AddCSSByUrl( '/themes/' + Workspace.theme + '/theme_compiled.css', function()
				{ document.body.className = 'Inside'; } );
				/*ParseCssFile( '/themes/' + Workspace.theme + '/theme.css', false, function()
				{ document.body.className = 'Inside'; } );*/
			}
			else
			{
				AddCSSByUrl( '/webclient/theme/scrollbars.css' );
				AddCSSByUrl( '/webclient/theme/theme_compiled.css', function()
				{ document.body.className = 'Inside'; } );
				/*ParseCssFile( '/webclient/theme/theme.css', false, function()
				{ document.body.className = 'Inside'; } );*/
			}
		}
		
		// TODO: Loop through all apps and update themes...
		
		
	},
	showDesktop: function()
	{	
		// View desktop
		document.body.style.visibility = 'visible';
	},
	// Check for new desktop events too!
	checkDesktopEvents: function()
	{
		if( typeof( this.icons ) != 'object' || !this.icons.length ) return;
		
		// TODO: Move to websocket event list
		var m = new Module( 'system' );
		m.onExecuted = function( r, data )
		{
			// Should only be run once!
			if( !data ) return;
			var events = JSON.parse( data );
			for( var a in events )
			{
				var jdata = events[a];
				if( a == 'Import' )
				{
					var w = new View( {
						title: 'File import',
						width: 640,
						height: 480,
						id: 'fileimport'
					} );
					Workspace.importWindow = w;
					var f = new File( 'System:templates/file_import.html' );
					f.onLoad = function( data )
					{
						if( !Workspace.importWindow ) return;
						
						var doorOptions = '';
						for( var ad = 0; ad < Workspace.icons.length; ad++ )
						{
							doorOptions += '<option value="' + Workspace.icons[ad].Door.Volume + '">' + Workspace.icons[ad].Door.Volume + '</option>';
						}
						
						if( !w || !w.setContent )
							return false;
							
						w.setContent( data.split( '{partitions}' ).join( doorOptions ) );
						var ml = '';
						for( var p = 0; p < jdata.length; p++ )
						{
							ml += '<div class="Padding MarginBottom Box"><div class="IconSmall fa-file"><div class="FloatRight"><input type="checkbox" file="' + jdata[p] + '"/></div>&nbsp;&nbsp;' + jdata[p] + '</div></div>';
						}
						ge( 'import_files' ).innerHTML = ml;
					}
					f.load();
				}
			}
		}
		m.execute( 'events' );
	},
	// Execute import of files
	executeFileImport: function()
	{
		var sels = ge('import_partitions').getElementsByTagName( 'option' );
		var inps = ge('import_files').getElementsByTagName( 'input' );
		var target = false;
		var files = [];
		for( var a = 0; a < sels.length; a++ )
		{
			if( sels[a].selected )
			{
				target = sels[a].value;
				break;
			}
		}
		for( var a  = 0; a < inps.length; a++ )
		{
			if( inps[a].checked )
			{
				files.push( inps[a].getAttribute( 'file' ) );
			}
		}
		if( target && files.length )
		{
			var m = new Module( 'files' );
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					if( Workspace.importWindow )
					{
						Workspace.importWindow.close();
						delete Workspace.importWindow;
					}
				}
				else
				{
					Ac2Alert( 'Something went wrong: ' + d );
				}
			}
			m.execute( 'import', { files: files, path: target } );
		}
		else
		{
			Ac2Alert( 'Please select files and a valid target door.' );
		}
	},
	// Function for closing panel (mobile mode)
	closeDrivePanel: function()
	{
		var ue = navigator.userAgent.toLowerCase();
		if( !window.isMobile || !Workspace || !Workspace.drivePanel )
			return;
			
			
		var eles = this.screen.div.getElementsByClassName( 'ScreenContent' );
		if( !eles.length ) return;
		var div = eles[0].getElementsByTagName( 'div' )[0];
		
		Workspace.drivePanel.style.bottom = '0px';
		Workspace.drivePanel.style.left = '0px';
		Workspace.drivePanel.style.top = '100%';
		Workspace.drivePanel.style.width = '64px';
		Workspace.drivePanel.style.height = 'auto';	
		Workspace.drivePanel.className = 'Scroller';
		Workspace.drivePanel.open = false;		
				
	},
	openDrivePanel: function()
	{

		if( !window.isMobile || !Workspace || !Workspace.drivePanel ) return;
			

		if( typeof closeDesklets == 'function' ) closeDesklets();
		
		var items = Workspace.drivePanel.getElementsByClassName('File');
		var itemWidth = Workspace.drivePanel.clientWidth; // - (this.margin*2);
		var itemHeight = itemWidth + 20; //squared icon + textline....
		
		var screenSpaceH = ge( 'DoorsScreen' ).offsetWidth - 10;
		var screenSpaceV = ge( 'DoorsScreen' ).offsetHeight - 10 - 64;
		
		var colsAvailable = Math.floor( screenSpaceH / itemWidth ) - 1;
		var rowsNeeded = Math.ceil( items.length / colsAvailable );
		
		if( rowsNeeded * itemHeight > screenSpaceV )
		{
			// we need scrolling
			console.log('we need scrolling here.... not implemented yet....');
		}
		
		//we center us on the screen
		Workspace.drivePanel.style.height = Math.ceil(rowsNeeded * itemHeight + 20) + 'px';
		Workspace.drivePanel.style.top = Math.floor( ( screenSpaceV - rowsNeeded * itemHeight) / 2) + 64 + 'px';
			
		var myWidth = Math.min( Math.floor( screenSpaceH ), Math.floor( itemWidth * colsAvailable ) + 10 );
		
		Workspace.drivePanel.style.width = myWidth + 'px';
		Workspace.drivePanel.style.left = Math.floor( ( screenSpaceH - myWidth ) / 2 ) + 'px';
		Workspace.drivePanel.style.right = 'auto';
		Workspace.drivePanel.className = 'Scroller Open';
		Workspace.drivePanel.open = true;
		
	
	},
	refreshDesktop: function()
	{
		// Oh yeah, update windows
		for( var a in movableWindows )
		{
			if( movableWindows[a].content.redrawBackdrop )
			{
				movableWindows[a].content.redrawBackdrop();
			}
		}
		
		var self = this;
		this.getMountlist( function()
		{
			// make drive list behave like a desklet... copy paste som code back and forth ;)
			function setupDriveClicks()
			{
				// Drive clicks for mobile
				var ue = navigator.userAgent.toLowerCase();
				if( !window.isMobile )
					return;
					
				var eles = self.screen.div.getElementsByClassName( 'ScreenContent' );
				if( !eles.length ) return;
				var div = eles[0].getElementsByTagName( 'div' )[0];
				
				div.parentNode.onmousedown = function( e )
				{
					var dd = eles[0].getElementsByTagName( 'div' )[0];
					var t = e.target ? e.target : e.srcElement;
					
					Workspace.drivePanel = dd;
					if( t.className && dd == t )
					{
						if( dd.open )
						{
							Workspace.closeDrivePanel();
						}
						else
						{
							Workspace.openDrivePanel();
						}
					}
				}
			}
			
			// Recall wallpaper
			if( self.wallpaperImage != 'color' )
			{
				var eles = self.screen.div.getElementsByClassName( 'ScreenContent' );
				if( eles.length )
				{
					// Check if we have a loadable image!
					var p = self.wallpaperImage.split( ':' )[0] + ':';
					var found = false;
					for( var a = 0; a < self.icons.length; a++ )
					{
						if( self.icons[a].Title == p )
							found = true;
					}
					// Load image
					var i = new Image();
					i.onload = function()
					{
						eles[0].style.backgroundSize = 'cover';
						eles[0].style.backgroundImage = 'url(' + this.src + ')';
						setupDriveClicks();
						this.done = true;
					}
					if( found )
						i.src = getImageUrl( self.wallpaperImage );
					else i.src = '/webclient/gfx/theme/default_login_screen.jpg';
					if( i.width > 0 && i.height > 0 ) i.onload();
				
					// If this borks up in 2 seconds, bail!
					setTimeout( function()
					{
						if( !i.done )
						{
							i.onload();
						}
					}, 2000 );
				}
			}
			// We have no wallpaper...
			else
			{
				var eles = self.screen.div.getElementsByClassName( 'ScreenContent' );
				if( eles.length )
				{
					eles[0].style.backgroundImage = '';
					setupDriveClicks();
				}
			}
			
			// Show deepest field now..
			ge( 'DeepestField' ).style.opacity = '1';
			
		} );
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
			
			// Add system on top (after Ram: if it exists)
			t.icons.push({
				Title:	'System:',
				Volume:   'System:',
				Path:	 'System:',
				Type:	 'Door',
				MetaType: 'Directory',
				IconFile: 'gfx/icons/128x128/devices/computer.png',
				ID:	   'system', // TODO: fix
				Mounted:  true,
				Door:	  new DoorSystem( 'System:' )
			});
			
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
			
			// Refresh desktop
			t.redrawIcons();
			
			// Check for new events
			t.checkDesktopEvents();
		}
		m.execute( 'mountlist' );
		
		return true;
	},
	redrawIcons: function()
	{
		if( !this.screen ) return;
		
		// The desktop always uses the same fixed values :)
		var wb = this.screen.contentDiv;
		wb.onselectstart = function( e ) { return cancelBubble ( e ); };
		wb.ondragstart = function( e ) { return cancelBubble ( e ); };
		wb.redrawIcons( this.getIcons(), 'vertical' );
		if ( RefreshDesklets ) RefreshDesklets();
		this.refreshMenu();
		
		
		// Cleanup windows of filesystems that are unmounted
		var close = [];
		for( var a in movableWindows )
		{
			var w = movableWindows[a];
			if( w.content ) w = w.content;
			if( w.fileInfo )
			{
				var found = false;
				for( var b in this.icons )
				{
					if( w.fileInfo.Volume == this.icons[b].Title )
					{
						found = true;
						break;
					}
				}
				// Clean up!
				if( !found ) 
				{
					var s = movableWindows[a];
					if( s.content ) s = s.content;
					close.push( movableWindows[a] );
				}
			}
		}
		// Close windows that are destined for it
		if( close.length )
		{
			for( var a = 0; a < close.length; a++ )
			{
				CloseWindow( close[a] );
			}
		}
	},
	getIcons: function()
	{
		if( !this.icons || !this.icons.length || !this.icons.concat )
			return false;
		return this.icons;
	},
	// TODO: DEPRECATED: REMOVE
	unmountDrive: function ( driveid, callback )
	{
		var j = new cAjax ();
		j.open( 'post', 'admin.php?module=files', true, true );
		j.addVar( 'sessionid', this.sessionId );
		j.addVar( 'command', 'unmount' );
		j.addVar( 'driveid', driveid );
		j.onload = function ()
		{
			RefreshDesktop ();
			if ( callback ) callback ();
		}
		j.send ();
	},
	// TODO: DEPRECATED: REMOVE
	mountDrive: function ( driveid, callback )
	{
		var j = new cAjax ();
		j.open( 'post', 'admin.php?module=files', true, true );
		j.addVar( 'sessionid', this.sessionId );
		j.addVar( 'command', 'mount' );
		j.addVar( 'driveid', driveid );
		j.onload = function ()
		{
			RefreshDesktop ();
			if ( callback ) callback ();
		}
		j.send ();
	},
	// New directory dialog
	newDirectory: function ()
	{
		if( window.currentMovable )
		{
			var directoryWindow = window.currentMovable;
		
			if( !HasClass( window.currentMovable, 'Active' ) )
				return false;
		
			var d = new View( { 
				id: 'makedir', 
				width: 325, 
				height: 100, 
				title: i18n( 'i18n_make_a_new_container' ) 
			} );
			
			d.setContent( '\
			<div class="ContentFull">\
				<div class="VContentTop BorderBottom" style="bottom: 50px;">\
					<div class="Padding">\
						<div class="HRow">\
							<div class="HContent25 FloatLeft">\
								<p class="Layout InputHeight"><strong>' + i18n( 'i18n_name' ) + ':</strong></p>\
							</div>\
							<div class="HContent75 FloatLeft">\
								<p class="Layout InputHeight"><input class="FullWidth MakeDirName" type="text" value="' + i18n( 'i18n_new_container' ) + '"/></p>\
							</div>\
						</div>\
					</div>\
				</div>\
				<div class="VContentBottom Padding" style="height: 50px">\
					<button type="button" class="Button fa-folder IconSmall NetContainerButton">\
						' + i18n( 'i18n_create_container' ) + '\
					</button>\
				</div>\
			</div>' );
		
			var inputField  = d.getByClass( 'MakeDirName' )[0];
			var inputButton = d.getByClass( 'NetContainerButton' )[0];
		
			inputButton.onclick = function()
			{
				if( inputField.value.length > 0 )
				{
					if( directoryWindow.content && directoryWindow.content.fileInfo )
					{
						if( directoryWindow.content.fileInfo.Door )
						{
							var fi = directoryWindow.content.fileInfo;
							var dr = fi.Door;
							var p = fi.Path;
							// Make sure we have a correct path..
							var ll = p.substr( p.length - 1, 1 );
							if( ll != '/' && ll != ':' )
								p += '/';
							
							dr.dosAction( 'makedir', { path: p + inputField.value }, function()
							{
								if( directoryWindow && directoryWindow.content ) 
								{
									var dw = directoryWindow;
									if( !dw.activate )
									{
										if( dw.windowObject )
											dw = dw.windowObject;
									}
									if( dw.activate )
									{
										dw.activate();
										// Refresh now
										if( directoryWindow.content )
											directoryWindow.content.refresh();
										else directoryWindow.refresh();
									}
									d.close();
								}
							} );
						}
					}
				}
				else
				{
					inputField.focus();
				}
			}
		
			inputField.onkeydown = function( e )
			{
				var w = e.which ? e.which : e.keyCode;
				if ( w == 13 ) inputButton.onclick ();
			}
		
			inputField.focus();
			inputField.select();
		}
	},
	// Rename active file
	renameFile: function()
	{
		if ( window.currentMovable && window.currentMovable.content )
		{
			var rwin = window.currentMovable;
			var eles = rwin.content.getElementsByTagName( 'div' );
			var sele = false;
			for( var a = 0; a < eles.length; a++ )
			{
				if( eles[a].className.indexOf( ' Selected' ) < 0 )
					continue;
				sele = eles[a];
				break;
			}
			if( !sele )
				return;
				
			// Get name of file
			var nam = sele.getElementsByTagName( 'a' )[0].innerHTML;	
			
			// Find out which type it is
			var icons = rwin.content.icons;
			var icon = false;
			for( var a = 0; a < icons.length; a++ )
			{
				if( ( icons[a].Title && icons[a].Title == nam ) || ( icons[a].Filename && icons[a].Filename == nam ) )
				{
					icon = icons[a];
					break;
				}
			}
			
			if( icon )
			{
				// There can be only one!
				if( Workspace.renameWindow )
				{
					Workspace.renameWindow.close();
					Workspace.renameWindow = false;
				}
				
				var w = new View( {
					title: i18n( 'rename_file' ),
					width: 320, 
					height: 100,
					resize: false
				} );
				
				Workspace.renameWindow = w;
			
				w.setContent( '\
					<div class="Padding">\
						<div class="HRow">\
							<div class="Col30 FloatLeft"><strong>' + i18n( 'new_name' ) + ':</strong></div>\
							<div class="Col70 FloatLeft"><input type="text" class="FullWidth" value="' + nam + '"></div>\
						</div>\
						<div class="HRow">\
							<div class="Col100 MarginTop">\
								<button type="button" class="Button IconSmall fa-edit">\
									' + i18n( 'rename_file' ) + '\
								</button>\
							</div>\
						</div>\
					</div>\
				' );
				
				w.getElementsByTagName( 'button' )[0].onclick = function()
				{
					Workspace.executeRename( w.getElementsByTagName( 'input' )[0].value, icon, rwin );
				}
			}
		}
	},
	// Use a door and execute a filesystem function, rename
	executeRename: function( nam, icon, win )
	{
		icon.Door.dosAction( 'rename', {
			newname: nam,
			path: icon.Path
		}, function()
			{
				if( win && win.content.refresh )
					win.content.refresh();
				Workspace.renameWindow.close();
			}
		);
	},
	seed: 0,
	// Show file info dialog
	fileInfo : function( icon )
	{
		// TODO: Support partition icons
		if( !icon )
		{
			if( window.currentMovable )
			{
				var w = window.currentMovable;
				if ( w.content ) w = w.content;
				if ( w.icons )
				{
					for( var a = 0; a < w.icons.length; a++ )
					{
						if( w.icons[a].domNode.className.indexOf ( 'Selected' ) > 0 )
						{
							icon = w.icons[a];
							break;
						}
					}
				}
			}
			else if( this.directoryView )
			{
				var eles = this.screen.contentDiv.getElementsByTagName( 'div' );
				for( var a = 0; a < eles.length; a++ )
				{
					if( eles[a].className == 'Icon' && eles[a].parentNode.className.indexOf( 'Selected' ) >= 0 )
					{
						icon = eles[a].parentNode.fileInfo;
						break;
					}
				}
			}
		}
		// check if we have a selected icon
		if( icon )
		{
			var w = new View( {
				title: i18n( 'information_of_icon' ) + ': ' + icon.Filename,
				width: 500,
				height: 350
			} );
			this.seed++;
			
			var prot = '';
			var bits = {
				readable:   [0, 0, 0],
				writable:   [0, 0, 0],
				deletable:  [0, 0, 0],
				executable: [0, 0, 0]
			};
			
			// Header
			prot += '<div class="HRow"><div class="FloatLeft HContent30">&nbsp;</div><div class="FloatLeft HContent70 IconInfoSkewed">';
			prot += '<div class="FloatLeft HContent30">' + i18n( 'owner' ) + ':</div>';
			prot += '<div class="FloatLeft HContent30">' + i18n( 'group' ) + ':</div>';
			prot += '<div class="FloatLeft HContent30">' + i18n( 'others' ) + ':</div>';
			prot += '</div></div>';
			
			// Gui
			for( var z in bits )
			{
				prot += '<div class="HRow">';
				prot += '<div class="FloatLeft HContent30">' + i18n( z ) + ':</div>';
				prot += '<div class="FloatLeft HContent70">';
				for( var oz in [ 'self', 'group', 'others' ] )
				{
					prot += '<div class="FloatLeft HContent30"><input type="checkbox" name="' + z + '_' + oz + '"/></div>';
				}
				prot += '</div>';
				prot += '</div>';
			}
			
			// Human filesize
			var fbtype = 'b';
			if( icon.Filesize > 1024 ) { icon.Filesize /= 1024.0; fbtype = 'kb'; }
			if( icon.Filesize > 1024 ) { icon.Filesize /= 1024.0; fbtype = 'mb'; }
			if( icon.Filesize > 1024 ) { icon.Filesize /= 1024.0; fbtype = 'gb'; }
			if( icon.Filesize > 1024 ) { icon.Filesize /= 1024.0; fbtype = 'tb'; }
			icon.Filesize = Math.round( icon.Filesize, 1 );
			
			// Load template
			var f = new File( '/webclient/templates/iconinfo.html' );
			f.replacements = {
				filename: icon.Filename,
				filesize: icon.Filesize + '' + fbtype,
				protection: prot,
				Cancel: i18n( 'i18n_cancel' ),
				Save: i18n( 'i18n_save' ),
				Notes: i18n( 'i18n_notes' ),
				iconnotes: icon.Notes ? icon.Notes : '',
				sharename: i18n( 'i18n_sharename' ),
				sharewith: i18n( 'i18n_sharewith')
			};
			f.onLoad = function( d )
			{
				w.setContent( d.split( '!!' ).join( Workspace.seed ) );
				
				// Hide form elements that are not ment for normal files				
				var isFile = icon.Type.toLowerCase() != 'directory';
				var eles = w.getElementsByTagName( 'div' );
				for( var a = 0; a < eles.length; a++ )
				{
					if( eles[a].className.indexOf( 'FileInfo' ) >= 0 && !isFile )
					{
						eles[a].style.display = 'none';
					}
				}
				// Initialize tab system
				InitTabs( ge( 'IconInfo_' + Workspace.seed ) );
			}
			f.load();
		}
		else
		{
			alert( i18n( 'please_choose_an_icon' ) );
		}
	},
	saveFileInfo: function( ele )
	{
		// Find window object...
		while( !ele.windowId )
		{
			if( ele == document.body ) return false;
			ele = ele.parentNode;
		}
		
		// TODO: Use dos commands instead! 'protect' and 'rename' and 'info'!
		// Create a module object
		var l = new Module( 'system' );
		
		// Ok, so now we can get all input fields etc..
		var args = {};
		var inps = ele.getElementsByTagName( 'input' );
		var texts = ele.getElementsByTagName( 'textarea' );
		var out = [];
		for( var b in texts ) out.push( texts[b] );
		for( var b in inps ) out.push( inps[b] );
		
		// Add arguments
		for( var a = 0; a < out.length; a++ )
		{
			args[out[a].name] = out[a].type == 'checkbox' ? ( out[a].checked ? '1' : '0' ) : out[a].value;
		}
		
		// Execute module action
		l.onExecuted = function( r, d )
		{
			console.log( r + ' ' + d );
		}
		l.execute( 'fileinfo', args );
		
	},
	closeFileInfo: function( ele )
	{
		// Find window object...
		while( !ele.fileInfo && ele.className.indexOf( 'Content' ) < 0 )
		{
			if( ele == document.body ) return false;
			ele = ele.parentNode;
		}
		// Close it!
		CloseView( ele );
	},
	uploadFile: function( id )
	{
		if( !Workspace.sessionId ) return;
		
		if( id )
		{
			var form = ge( id );
			
			var uppath = ge( 'fileUpload' ).path ? ge( 'fileUpload' ).path.value : '';
			
			// Find target frame
			var iframes = document.body.getElementsByTagName( 'iframe' );
			var resultfr = false;
			for( var a = 0; a < iframes.length; a++ )
			{
				if( iframes[a].getAttribute( 'name' ) == form.getAttribute( 'target' ) )
				{
					resultfr = iframes[a];
					break;
				}
			}
			// Need target frame to complete job
			if( resultfr && uppath.length )
			{
				resultfr.onload = function()
				{
					for( var a in movableWindows )
					{
						var w = movableWindows[a];
						if( w.content ) w = w.content;
						if( w.fileInfo )
						{
							if( w.fileInfo.Path == uppath )
							{
								Workspace.diskNotification( [ w ], 'refresh' );
							}
						}
					}
					// TODO: This should give the correct response
					/*
					var rmsg = this.contentWindow.document.body.innerHTML.split( '<!--separate-->' );
					if( rmsg.length > 1 )
					{
					}
					*/
				}
				form.submit();
			}
			return;
		}
		
		var w = new View( {
			title: 'File upload',
			width: 370,
			'min-width': 370,
			height: 170,
			'min-height': 170,
			'max-height': 170,
			id: 'fileupload',
			screen: Workspace.screen
		} );
		var f = new File( '/webclient/templates/file_upload.html' );
		f.onLoad = function( data )
		{
			w.setContent( data );
			ge( 'fileUpload' ).sessionid.value = Workspace.sessionId;
		}
		f.load();
	},
	findUploadPath: function()
	{
		if( !Workspace.sessionId ) return;
		
		if( this.fupdialog ) return;
		this.fupdialog = new Filedialog( false, function( arr )
		{
			if( Workspace.fupdialog )
			{
				var fu = ge( 'fileUpload' );
				if( fu ) 
				{
					fu.path.value = arr;
				}
				Workspace.fupdialog = false;
			}
		}, 'Mountlist:', 'path' );
		return;
	},
	// Simple logout..
	logout: function()
	{
		// FIXME: implement
		DelCookie( 'loginUsername' );
		DelCookie( 'loginPassword' );
		SaveWindowStorage( function(){ document.location.reload(); } );
	},
	// Get a list of all applications ------------------------------------------
	listApplications: function()
	{
		var out = [];
		for( var a = 0; a < this.applications.length; a++ )
		{
			out.push( {
				name: this.applications[a].applicationName,
				id: this.applications[a].applicationId,
				applicationNumber: this.applications[a].applicationNumber
			} );
		}
		return out;
	},
	// Refresh Doors menu recursively ------------------------------------------
	refreshMenu: function()
	{
		// Init menu -----------------------------------------------------------
		var tools = '';
		if( typeof( this.menu['tools'] ) != 'undefined' )
		{
			tools = this.menu['tools'].join ( "\n" );
		}
		// Setup default Doors menu
		this.menu = [
			{
				name: i18n( 'menu_workspace' ),
				items:
				[
					{
						name:	i18n( 'menu_about_friendup' ),
						command: function(){ AboutFriendUP(); }
					},
					{
						name:	i18n( 'information' ),
						command: function(){ Workspace.informationWindow(); }
					},
					{
						name:	i18n( 'my_account' ),
						command: function(){ Workspace.accountSetup(); }
					},
					{
						divider: true
					},
					{
						name:	i18n( 'clear_cache' ),
						command: function(){ ClearCache(); }
					},
					{
						name:	i18n( 'menu_refresh_desktop' ),
						command: function(){ Workspace.refreshDesktop(); }
					},
					{
						name:	i18n( 'menu_upload_file' ),
						command: function(){ Workspace.uploadFile(); }
					},
					{
						name:	i18n( 'menu_new_shell' ),
						command: function(){ ExecuteApplication( 'Dingo' ); }
					},
					{
						name:	i18n( 'menu_run_command' ),
						command: function(){ Workspace.showLauncher(); }
					},
					{
						name:   i18n( 'menu_mount_filesystem' ),
						command: function(){ Workspace.connectFilesystem(); }
					},
					/*{
						name:	i18n( 'menu_show_launcher' ),
						command: 'document.launcher.show()'
					},
					{
						name:	i18n( 'menu_hide_launcher' ),
						command: 'document.launcher.hide()'
					},*/
					{
						name:	i18n( 'menu_fullscreen' ),
						command: function(){ Workspace.fullscreen(); }
					},
					{
						divider: true
					},
					{
						name:	i18n( 'menu_log_out' ),
						command: function(){ Workspace.logout(); }
					}
				]
			},
			{
				name: i18n( 'menu_window' ),
				items:
				[
					{
						name:	i18n( 'menu_open_parent_directory' ),
						command: function(){ Workspace.openParentDirectory(); }
					},
					{
						name:	i18n( 'menu_refresh_directory' ),
						command: function(){ Workspace.refreshDirectory(); }
					},
					{
						name:	i18n( 'menu_open_directory' ),
						command: function(){ Workspace.openDirectory(); }
					},
					{
						name: i18n( 'menu_show_as' ),
						items:
						[
							{
								name:	i18n( 'menu_show_as_icons' ),
								command: function(){ Workspace.viewDirectory('iconview'); }
							},
							{
								name:	i18n( 'menu_show_as_list' ),
								command: function(){ Workspace.viewDirectory('listview'); }
							}
						]
					},
					{
						name:	i18n( 'menu_snapshot' ),
						items:
						[
							{
								name:	i18n( 'menu_snapshot_all' ),
								command: function(){ SaveWindowStorage(); }
							}
						]
					},
					{
						name:	i18n( 'menu_close_window' ),
						command: function(){ CloseWindow( window.currentMovable ) }
					}
				]
			},
			{
				name: i18n( 'menu_icons' ),
				items:
				[
					{
						name:	i18n( 'menu_new_directory' ),
						command: function() { Workspace.newDirectory(); }
					},
					{
						name:	i18n( 'menu_show_icon_information' ),
						command: function(){ Workspace.fileInfo(); }
					},
					{
						name:	i18n( 'menu_edit_filename' ),
						command: function() { Workspace.renameFile(); }
					},
					{
						name:	i18n( 'menu_delete' ),
						command: function() { Workspace.deleteFile(); }
					},
					{
						divider: true
					},
					{
						name:   i18n( 'menu_unmount_filesystem' ),
						command: function(){
							var s = ge( 'DoorsScreen' );
							var p = false;
							if( s && s.screen && s.screen._screen.icons )
							{
								var ics = s.screen._screen.icons;
								for( var a = 0; a < ics.length; a++ )
								{
									if( ics[a].domNode.className.indexOf( ' Selected' ) > 0 )
									{
										p = ics[a].Path;
										break;
									}
								}
							}
							// For the path
							if( p )
							{
								var f = new FriendLibrary( 'system.library' );
								f.onExecuted = function( e, d )
								{ Workspace.refreshDesktop(); }
								var args = {
									command: 'unmount',
									devname: p.split( ':' ).join ( '' ),
									path: p
								};
								f.execute( 'device', args );
							}
						}
					},
				]
			},
			{
				name: i18n( 'menu_bookmarks' ),
				items: Workspace.getBookmarks()
			}
		];
		// Add tools menu
		this.menu.push ( { name: i18n( 'menu_tools' ), itemsHTML: tools } );
	},
	viewDirectory: function( mode )
	{
		if ( !window.currentMovable )
			return false;
		if ( !window.currentMovable.content.directoryview )
			return false;
		window.currentMovable.content.directoryview.listMode = mode;
		window.currentMovable.content.redrawIcons ();
	},
	showLauncher: function()
	{
		if( !Workspace.sessionId ) return;
		
		var w = new View( {
			title: i18n( 'menu_execute_command' ),
			width: 320,
			height: 70,
			resize: false
		} );
		var f = new File( 'templates/runcommand.html' );
		f.replacements = {
			'execute' : i18n( 'cmd_execute' ),
			'run_command' : i18n( 'menu_execute_command' )
		};
		f.onLoad = function( data )
		{
			w.setContent( data );
			if( Workspace.lastExecuted )
			{
				ge( 'WorkspaceRunCommand' ).value = Workspace.lastExecuted;
			}
			ge('WorkspaceRunCommand').select();
			ge('WorkspaceRunCommand').focus();
		}
		f.load();
		this.launcherWindow = w;
	},
	hideLauncher: function()
	{
		if( !this.launcherWindow ) return;
		this.launcherWindow.close();
		this.launcherWindow = false;
	},
	// Force update
	refreshDirectory: function()
	{
		if( window.currentMovable && window.currentMovable.content )
		{
			window.currentMovable.content.refresh();
		}
	},
	// Delete selected files
	deleteFile: function()
	{
		var w = window.regionWindow;
		if( w )
		{
			var files = [];
			var eles = w.getElementsByTagName( 'div' );
			for( var a = 0; a < eles.length; a++ )
			{
				if( eles[a].className == 'File Selected' )
				{
					var d = new Door();
					files.push( { fileInfo: eles[a].fileInfo, door: d.get( eles[a].fileInfo.Path ) } );
				}
			}
			
			// Create callback
			var cnt = files.length;
			
			// Delete these files!
			for( var a = 0; a < cnt; a++ )
			{
				files[a].door.dosAction( 'delete', { path: files[a].fileInfo.Path } );
			}
		}
	},
	openParentDirectory: function( e )
	{
		var f = window.currentMovable;
		if( !f ) return;
		var p = f.content.fileInfo;
		var path = p.Path;
		
		// Remove trailing path
		if( path.substr( path.length - 1, 1 ) == '/' )
			path = path.substr( 0, path.length - 1 );
		// Get parent directory
		if( path.split( ':' ).length > 1 )
		{
			path = path.split( ':' );
			if( path[1].indexOf( '/' ) > 0 )
			{
				path[1] = path[1].split( '/' );
				path[1].pop();
				path[1] = path[1].join ( '/' );
			}
			else
			{
				path[1] = '';
			}
			path = path.join ( ':' );
			
			// Create fileinfo
			var d = {};
			for( var a in p ) d[a] = p[a];
			d.Path = path;
			
			// Open the window
			OpenWindowByFileinfo( d, e );
		}
	},
	// Deepest field population
	updateTasks: function()
	{
		ge( 'TasksHeader' ).innerHTML = '<h2>' + i18n( 'Running tasks (' + ( ge( 'Tasks' ).childNodes.length - 1 ) + ')' ) + '</h2>';
	},
	// Let's get some updates available to the user from Friend Software Labs!
	informationWindow: function()
	{
		if( !Workspace.sessionId ) return;
		
		if( this.infoWindow )
			return;
		var w = new View( {
			title: "Updates from Friend Software Labs",
			width: 800,
			height: 500,
			screen: Workspace.screen
		} );
		w.onClose = function()
		{
			Workspace.infoWindow = null;
		}
		this.infoWindow = w;
		
		var j = new File( '/webclient/updates.html' );
		j.onLoad = function( data )
		{
			w.setContent( data );
		}
		j.load();
	},
	fullscreen: function( ele, e )
	{
		// Fullscreen enabled?
		if(
		  !document.fullscreenEnabled &&
		  !document.webkitFullscreenEnabled &&
		  !document.mozFullScreenEnabled &&
		  !document.msFullscreenEnabled
		)
		{
			return false;
		}
	
		var el = ele ? ele : ( document.documentElement ? document.documentElement : document.body );
		var toggle = el.fullscreenEnabled;
		if( !toggle )
		{
			if( el.requestFullscreen )
				el.requestFullscreen();
			else if( el.webkitRequestFullScreen )
				el.webkitRequestFullScreen();
			else if( el.webkitRequestFullscreen )
				el.webkitRequestFullscreen();
			else if( el.mozRequestFullscreen )
				el.mozRequestFullScreen();
			else if( el.msRequestFullscreen )
				el.msRequestFullscreen();
			el.fullscreenEnabled = true;
		}
		else
		{
			if( document.exitFullScreen )
				document.exitFullScreen();
			else if( document.webkitCancelFullscreen )
				document.webkitCancelFullscreen();
			else if( document.webkitCancelFullScreen )
				document.webkitCancelFullScreen();
			else if( document.mozCancelFullScreen )
				document.mozCancelFullScreen();
			else if( document.mozCancelFullScreen )
				document.mozCancelFullScreen();
			el.fullscreenEnabled = false;
		}
	},
	// Set up user account
	accountSetup: function( what )
	{
		ExecuteApplication( 'Account' );
	}
};

Doors = Workspace;

// Triggered to do certain things based on event
function DoorsListener( e )
{
	
}

// Triggered on mouse leaving
function DoorsOutListener( e )
{
	if ( e.relatedTarget == null )
	{
		movableMouseUp( e );
	}
}
function DoorsLeaveListener( e )
{
	movableMouseUp( e );
}
function DoorsKeyDown( e )
{
	var w = e.which ? e.which : e.keyCode;
	
	if( !w || !e.ctrlKey )
		return;
		
	switch( w )
	{
		// Run command
		case 69:
			Workspace.showLauncher();
			return cancelBubble( e );
			break;
		default:
			//console.log( w );
			break;
	}
}

function InitWorkspaceEvents()
{
	if( window.attachEvent )
	{
		window.attachEvent( 'onmousemove', DoorsListener, false );
		window.attachEvent( 'onmouseout', DoorsOutListener, false );
		window.attachEvent( 'onmouseleave', DoorsLeaveListener, false );
		window.attachEvent( 'onresize', function() { Workspace.redrawIcons() } );
		window.attachEvent( 'onkeydown', DoorsKeyDown );
	}
	else 
	{
		window.addEventListener( 'mousemove', DoorsListener, false );
		window.addEventListener( 'mouseout', DoorsOutListener, false );
		window.addEventListener( 'mouseleave', DoorsLeaveListener, false );
		window.addEventListener( 'resize', function() { Workspace.redrawIcons() } );
		window.addEventListener( 'keydown', DoorsKeyDown, false );
	}
}

// Voice -----------------------------------------------------------------------

function ExecuteVoiceCommands( e )
{
	alert( e.target.form.q.value );
}

// -----------------------------------------------------------------------------

// Popup an About FriendUP dialog...
function AboutFriendUP()
{
	if( !Workspace.sessionId ) return;
	var v = new View( {
		title: i18n( 'about_friendup' ) + ' v1.0 b3b',
		width: 540,
		height: 560,
		id: 'about_friendup'
	} );
	
	v.setRichContentUrl( '/webclient/templates/about.html' );
}

// Clear cache
function ClearCache()
{
	var m = new FriendLibrary( 'system.library' );
	m.execute( 'clearcache' );
}

// -----------------------------------------------------------------------------

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  SHA-256 implementation in JavaScript                (c) Chris Veness 2002-2014 / MIT Licence  */
/*                                                                                                */
/*  - see http://csrc.nist.gov/groups/ST/toolkit/secure_hashing.html                              */
/*        http://csrc.nist.gov/groups/ST/toolkit/examples.html                                    */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/* jshint node:true *//* global define, escape, unescape */
'use strict';


/**
 * SHA-256 hash function reference implementation.
 *
 * @namespace
 */
var Sha256 = {};


/**
 * Generates SHA-256 hash of string.
 *
 * @param   {string} msg - String to be hashed
 * @returns {string} Hash of msg as hex character string
 */
Sha256.hash = function(msg) {
    // convert string to UTF-8, as SHA only deals with byte-streams
    msg = msg.utf8Encode();
    
    // constants [§4.2.2]
    var K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2 ];
    // initial hash value [§5.3.1]
    var H = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19 ];

    // PREPROCESSING 
 
    msg += String.fromCharCode(0x80);  // add trailing '1' bit (+ 0's padding) to string [§5.1.1]

    // convert string msg into 512-bit/16-integer blocks arrays of ints [§5.2.1]
    var l = msg.length/4 + 2; // length (in 32-bit integers) of msg + ‘1’ + appended length
    var N = Math.ceil(l/16);  // number of 16-integer-blocks required to hold 'l' ints
    var M = new Array(N);

    for (var i=0; i<N; i++) {
        M[i] = new Array(16);
        for (var j=0; j<16; j++) {  // encode 4 chars per integer, big-endian encoding
            M[i][j] = (msg.charCodeAt(i*64+j*4)<<24) | (msg.charCodeAt(i*64+j*4+1)<<16) | 
                      (msg.charCodeAt(i*64+j*4+2)<<8) | (msg.charCodeAt(i*64+j*4+3));
        } // note running off the end of msg is ok 'cos bitwise ops on NaN return 0
    }
    // add length (in bits) into final pair of 32-bit integers (big-endian) [§5.1.1]
    // note: most significant word would be (len-1)*8 >>> 32, but since JS converts
    // bitwise-op args to 32 bits, we need to simulate this by arithmetic operators
    M[N-1][14] = ((msg.length-1)*8) / Math.pow(2, 32); M[N-1][14] = Math.floor(M[N-1][14]);
    M[N-1][15] = ((msg.length-1)*8) & 0xffffffff;


    // HASH COMPUTATION [§6.1.2]

    var W = new Array(64); var a, b, c, d, e, f, g, h;
    for (var i=0; i<N; i++) {

        // 1 - prepare message schedule 'W'
        for (var t=0;  t<16; t++) W[t] = M[i][t];
        for (var t=16; t<64; t++) W[t] = (Sha256.OO1(W[t-2]) + W[t-7] + Sha256.OO0(W[t-15]) + W[t-16]) & 0xffffffff;

        // 2 - initialise working variables a, b, c, d, e, f, g, h with previous hash value
        a = H[0]; b = H[1]; c = H[2]; d = H[3]; e = H[4]; f = H[5]; g = H[6]; h = H[7];

        // 3 - main loop (note 'addition modulo 2^32')
        for (var t=0; t<64; t++) {
            var T1 = h + Sha256.EE1(e) + Sha256.Ch(e, f, g) + K[t] + W[t];
            var T2 =     Sha256.EE0(a) + Sha256.Maj(a, b, c);
            h = g;
            g = f;
            f = e;
            e = (d + T1) & 0xffffffff;
            d = c;
            c = b;
            b = a;
            a = (T1 + T2) & 0xffffffff;
        }
         // 4 - compute the new intermediate hash value (note 'addition modulo 2^32')
        H[0] = (H[0]+a) & 0xffffffff;
        H[1] = (H[1]+b) & 0xffffffff; 
        H[2] = (H[2]+c) & 0xffffffff; 
        H[3] = (H[3]+d) & 0xffffffff; 
        H[4] = (H[4]+e) & 0xffffffff;
        H[5] = (H[5]+f) & 0xffffffff;
        H[6] = (H[6]+g) & 0xffffffff; 
        H[7] = (H[7]+h) & 0xffffffff; 
    }

    return Sha256.toHexStr(H[0]) + Sha256.toHexStr(H[1]) + Sha256.toHexStr(H[2]) + Sha256.toHexStr(H[3]) + 
           Sha256.toHexStr(H[4]) + Sha256.toHexStr(H[5]) + Sha256.toHexStr(H[6]) + Sha256.toHexStr(H[7]);
};


/**
 * Rotates right (circular right shift) value x by n positions [§3.2.4].
 * @private
 */
Sha256.ROTR = function(n, x) {
    return (x >>> n) | (x << (32-n));
};

/**
 * Logical functions [§4.1.2].
 * @private
 */
Sha256.EE0  = function(x) { return Sha256.ROTR(2,  x) ^ Sha256.ROTR(13, x) ^ Sha256.ROTR(22, x); };
Sha256.EE1  = function(x) { return Sha256.ROTR(6,  x) ^ Sha256.ROTR(11, x) ^ Sha256.ROTR(25, x); };
Sha256.OO0  = function(x) { return Sha256.ROTR(7,  x) ^ Sha256.ROTR(18, x) ^ (x>>>3);  };
Sha256.OO1  = function(x) { return Sha256.ROTR(17, x) ^ Sha256.ROTR(19, x) ^ (x>>>10); };
Sha256.Ch  = function(x, y, z) { return (x & y) ^ (~x & z); };
Sha256.Maj = function(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); };


/**
 * Hexadecimal representation of a number.
 * @private
 */
Sha256.toHexStr = function(n) {
    // note can't use toString(16) as it is implementation-dependant,
    // and in IE returns signed numbers when used on full words
    var s="", v;
    for (var i=7; i>=0; i--) { v = (n>>>(i*4)) & 0xf; s += v.toString(16); }
    return s;
};


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


/** Extend String object with method to encode multi-byte string to utf8
 *  - monsur.hossa.in/2012/07/20/utf-8-in-javascript.html */
if (typeof String.prototype.utf8Encode == 'undefined') {
    String.prototype.utf8Encode = function() {
        return unescape( encodeURIComponent( this ) );
    };
}

/** Extend String object with method to decode utf8 string to multi-byte */
if (typeof String.prototype.utf8Decode == 'undefined') {
    String.prototype.utf8Decode = function() {
        try {
            return decodeURIComponent( escape( this ) );
        } catch (e) {
            return this; // invalid UTF-8? return as-is
        }
    };
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
if (typeof module != 'undefined' && module.exports) module.exports = Sha256; // CommonJs export
if (typeof define == 'function' && define.amd) define([], function() { return Sha256; }); // AMD
