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
* The FriendUP Desktop Environment interface. For use by anonymous users.      *
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
	notifications: [],
	applications: [],
	importWindow: false,
	menuState: '',
	themeOverride: false,
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
	conn : null,
	
	init: function()
	{	
		// First things first
		if( this.initialized ) return;
		
		// Wait for load
		if( typeof( InitWindowEvents ) == 'undefined' || typeof( InitGuibaseEvents ) == 'undefined' )
			return setTimeout( 'Workspace.init()', 50 );
		
		if( !this.addedMobileCSS && window.isMobile )
		{
			document.body.setAttribute( 'mobile', 'mobile' );
			AddCSSByUrl( '/webclient/css/responsive.css' );
			this.addedMobileCSS = true;
		}
		
		// Show the login prompt if we're not logged in!
		if( !this.login() )
		{
			this.showLoginPrompt();
			return;
		}
		
		// Everything must be ready
		if( typeof( ge ) == 'undefined' || document.body.className != 'Inside' )
			return setTimeout ( 'Workspace.init()', 5 );
		
		// We passed!
		this.initialized = true;
		
		// Do the init!
		window.addEventListener( 'beforeunload', Workspace.leave, true );
		
		InitWindowEvents();
		InitWorkspaceEvents();
		InitGuibaseEvents();
		
		// Establish a websocket connection to the core
		if( !this.conn && this.sessionId && window.FriendConnection ) {
			this.conn = new FriendConnection();
			this.conn.on( 'assid-request', handleAssidRequest );
		}
		
		// Deepest field population
		ge( 'TasksHeader' ).innerHTML = '<h2>' + i18n( 'Running tasks' ) + ':</h2>';
		ge( 'NotificationHeader' ).innerHTML = '<h2>' + i18n( 'i18n_notification_archive' ) + ':</h2>';
		
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
				title: 'Workspace v1.0 rc1',
				id:	'DoorsScreen',
				extra: Workspace.fullName,
				taskbar: true
			}
		);
		
		// Touch start show menu!
		wbscreen.contentDiv.addEventListener( 'touchstart', function( e )
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
				// Fallback
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
				
				// Do the startup sequence in sequence (only once)
				if( dat.startupsequence && dat.startupsequence.length && !Workspace.startupsequenceHasRun )
				{
					Workspace.startupsequenceHasRun = true;
					var l = {
						index: 0,
						func: function()
						{
							var cmd = dat.startupsequence[this.index++];
							if( cmd )
							{
								Workspace.shell.execute( cmd, function()
								{
									l.func();
								} );
							}
						}
					}
					l.func();
				}
			}
			else
			{
				Workspace.wallpaperImage = '/webclient/gfx/theme/default_login_screen.jpg';
				Workspace.windowWallpaperImage = '';
			}
			if( callback && typeof( callback ) == 'function' ) callback();
		}
		m.execute( 'getsetting', { settings: [ 'wallpaperdoors', 'wallpaperwindows', 'language', 'menumode', 'startupsequence' ] } );
	},
	// Do you want to leave?
	leave: function( e )
	{
		if( !Workspace.sessionId ) return true;
		if( e )
		{
			e.returnValue = i18n( 'i18n_leave_question' )
			return e.returnValue;
		}
		return;
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

				function genFunc( fod )
				{
					return function()
					{
						Workspace.launchNativeApp( fod );
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
					if( ele.Icon )
					{
						icon = getImageUrl( ele.Icon );
					}
					
					var ob = { 
						exe   : ele.Name,
						type  : ele.Type,
						src   : icon,
						'title' : ele.Title ? ele.Title : ele.Name
					};
					if( ele.Name.substr( 0, 7 ) == 'native:' )
					{
						var tmp = ob.exe.split( 'native:' )[1];
						ob.click = genFunc( tmp );
					}
					
					Workspace.mainDock.addLauncher( ob );
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
		if( Workspace.interfaceMode && Workspace.interfaceMode == 'native' )
			return;
		
		var lp = new View( {
			id: 'Login',
			width: 290,
			'min-width': 290,
			'max-width': 290,
			height: 223,
			'min-height': 223,
			'resize': false,
			title: 'FriendUP RC1 Login',
			close: false
		} );
		lp.setRichContentUrl( 'templates/login_prompt.html' );
		Workspace.loginPrompt = lp;
	
		
		// Show it
		this.showDesktop();
	},
	flushSession: function()
	{
		this.sessionId = null;
		localStorage.removeItem( 'WorkspaceSessionID' );
	},
	login: function( u, p, r, callback, ev )
	{
		// Wrap to user object
		return Friend.User.Login( u, p, r, callback, ev );
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
	refreshWindowByPath: function( path, depth, callback )
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
		
		// Check movable windows
		for( var a in movableWindows )
		{	
			var mw = movableWindows[a];
			
			if( !mw.content ) continue;
			if( mw.content.fileInfo )
			{
				if( mw.content.fileInfo.Path.toLowerCase() == path.toLowerCase() )
				{
					mw.content.refresh( callback );
				}
			}
			// Dialogs
			else if( mw.windowObject && mw.windowObject.refreshView )
			{
				mw.windowObject.refreshView();
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
			Workspace.refreshWindowByPath( o, depth + 1, callback );
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
	// Render all notifications on the deepest field
	renderNotifications: function()
	{
		// Only add the ones that aren't in!
		for( var a = 0; a < this.notifications.length; a++ )
		{
			var no = this.notifications[a];
			if( !no.dom )
			{
				var d = ( new Date( no.date ) );
				var d = d.getFullYear() + '-' + StrPad( d.getMonth(), 2, '0' ) + '-' + 
					StrPad( d.getDate(), 2, '0' ) + ' ' + StrPad( d.getHours(), 2, '0' ) + 
					':' + StrPad( d.getMinutes(), 2, '0' ) + ':' + StrPad( d.getSeconds(), 2, '0' );
				var n = document.createElement( 'div' );
				n.className = 'Rounded Box MarginBottom BackgroundLists ColorLists';
				n.innerHTML = '\
				<div class="FloatRight IconSmall fa-remove MousePointer" onclick="Workspace.removeNotification(this.parentNode.index)"></div>\
				<p class="Layout">' + ( no.application ? ( no.application + ': ' ) : ( i18n( 'i18n_system_message' ) + ': ' ) ) + d + '</p>\
				<p class="Layout"><strong>' + no.msg.title + '</strong></p>\
				<p class="Layout">' + no.msg.text + '</strong></p>';
				no.dom = n;
				ge( 'Notifications' ).appendChild( n );
			}
			no.dom.index = a+1;
		}
	},
	// TODO: Reenable notifications when the windows can open on the deepest field...
	removeNotification: function( index )
	{
		if( Workspace.notifications.length <= 0 ) return;
		
		var nots = Workspace.notifications;
		
		// Remove by index
		var out = [];
		for( var a = 0; a < nots.length; a++ )
		{
			if( index == a+1 )
			{
				if( nots[a].dom )
				{
					nots[a].dom.parentNode.removeChild( nots[a].dom );
				}
				continue;
			}
			else out.push( nots[a] );
		}
		for( var a = 0; a < out.length; a++ ) out[a].dom.index = a+1;
		Workspace.notifications = out;
	},
	refreshTheme: function( themeName, update )
	{
		// Only on force or first time
		if( this.themeRefreshed && !update )
			return;
		
		if( Workspace.themeOverride ) themeName = Workspace.themeOverride.toLowerCase();
		
		this.themeRefreshed = true;
		
		this.refreshUserSettings( function(){ CheckScreenTitle(); } );
		
		Workspace.theme = themeName ? themeName.toLowerCase() : '';
		themeName = Workspace.theme;
		
		var h = document.getElementsByTagName( 'head' );
		if( h )
		{
			h = h[0];
			
			// Remove old one
			var l = h.getElementsByTagName( 'link' );
			for( var b = 0; b < l.length; b++ )
			{
				if( l[b].parentNode != h ) continue;
				l[b].href = '';
				l[b].parentNode.removeChild( l[b] );
			}
			// Remove scrollbars
			var l = document.body.getElementsByTagName( 'link' );
			for( var b = 0; b < l.length; b++ )
			{
				if( l[b].href.indexOf( '/scrollbars.css' ) > 0 )
				{
					l[b].href = '';
					l[b].parentNode.removeChild( l[b] );
				}
			}
			
			// New css!
			var styles = document.createElement( 'link' );
			styles.rel = 'stylesheet';
			styles.type = 'text/css';
			styles.onload = function(){ document.body.className = 'Inside'; }
			
			if( themeName && themeName != 'default' )
			{
				AddCSSByUrl( '/themes/' + Workspace.theme + '/scrollbars.css' );
				styles.href = '/system.library/module/?module=system&command=theme&args=' + encodeURIComponent( '{"theme":"' + themeName + '"}' ) + '&sessionid=' + Workspace.sessionId;
			}
			else
			{
				AddCSSByUrl( '/themes/friendup/scrollbars.css' );
				styles.href = '/system.library/module/?module=system&command=theme&args=' + encodeURIComponent( '{"theme":"friendup"}' ) + '&sessionid=' + Workspace.sessionId;
				//AddCSSByUrl( '/webclient/theme/scrollbars.css' );
				//styles.href = '/system.library/module/?module=system&command=theme&args=' + encodeURIComponent( '{"theme":"default"}' ) + '&sessionid=' + Workspace.sessionId;
			}
			
			// Add new one
			h.appendChild( styles );
		}
		
		// Update running applications
		var taskIframes = ge( 'Tasks' ).getElementsByClassName( 'AppSandbox' );
		for( var a = 0; a < taskIframes.length; a++ )
		{
			var msg = {
				type: 'system',
				command: 'refreshtheme',
				theme: themeName
			};
			taskIframes[a].ifr.contentWindow.postMessage( JSON.stringify( msg ), '*' );
		}
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
		
		for( var a in window.movableWindows )
		{
			window.movableWindows[a].removeAttribute( 'hidden' );
		}
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
		
		for( var a in window.movableWindows )
		{
			window.movableWindows[a].setAttribute( 'hidden', 'hidden' );
		}
	},
	// Some "native" functions -------------------------------------------------
	// Get a list of the applications that are managed by Friend Core
	getNativeAppList: function( callback )
	{
		if( Workspace.interfaceMode != 'native' ) return false;
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( callback && typeof( callback ) == 'function' )
			{
				callback( e == 'ok' ? d : false );
			}
		}
		m.execute( 'list_apps' );
	},
	// Kill a running native app
	killNativeApp: function( appName, callback )
	{
		if( Workspace.interfaceMode != 'native' ) return false;
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( callback && typeof( callback ) == 'function' )
			{
				callback( e == 'ok' ? d : false );
			}
		}
		m.execute( 'kill_app', { appname: appName } );
	},
	pollNativeApp: function()
	{
		this.getNativeWindowList( false, function( data )
		{
			// Clean when no apps
			var clear = false;
			if( data == false )
				clear = true;
			
			// Remove apps that are gone
			var out = [];
			for( var a = 0; a < Workspace.applications.length; a++ )
			{
				// Skip normal apps
				if( !Workspace.applications[a].pid ) continue;
				
				var f = false;
				for( var b = 0; b < data.length; b++ )
				{
					if( data[b].pid && data[b].pid == Workspace.applications[a].pid )
					{
						f = true;
					}
				}
				// Keep apps
				if( f )
				{
					out.push( Workspace.applications[a] );
				}
			}
			Workspace.applications = out;
			
			// Clear all non normal apps (only natives with pid)
			if( clear )
			{
				out = [];
				for( var a = 0; a < Workspace.applications.length; a++ )
				{
					if( !Workspace.applications[a].pid ) 
						out.push( Workspace.applications[a] );
				}
				Workspace.applications = out;
				clearInterval( Workspace.nativeAppPolling );
				Workspace.nativeAppPolling = false;
			}
		} );
	},
	minimizeNativeWindow: function( viewId )
	{
		if( Workspace.interfaceMode != 'native' ) return false;
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
		}
		m.execute( 'window_minimize', { viewid: viewId } );
	},
	restoreNativeWindow: function( viewId )
	{
		if( Workspace.interfaceMode != 'native' ) return false;
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
		}
		m.execute( 'window_restore', { viewid: viewId } );
	},
	// Lanch a native app
	launchNativeApp: function( path, callback )
	{
		if( Workspace.interfaceMode != 'native' ) return false;
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				// Register the app
				var apn = path;
				if( path.indexOf( '/' ) >= 0 )
				{
					apn = apn.split( '/' ).pop();
				}
				else apn = apn.split( ':' )[1];
				var pid = 0;
				if( d )
				{
					var out = JSON.parse( d );
					out = out[0];
					pid = out.match( /([0-9]+)/i );
					pid = pid[0];
				}
				// Add application with pid so we can track the windows
				var app = {
					name: apn,
					id: false,
					applicationNumber: false,
					type: 'native',
					pid: pid,
					path: path
				};
				Workspace.applications.push( app );
				
				function CheckTimes( times )
				{
					Workspace.getNativeWindowList();
					if( times-- > 0 )
					{
						setTimeout( function()
						{
							CheckTimes( times );
						}, 2500 );
					}
				}
				CheckTimes( 4 );
				
			}
			if( callback && typeof( callback ) == 'function' )
			{
				callback( e == 'ok' ? d : false );
			}
			if( !Workspace.nativeAppPolling )
			{
				Workspace.nativeAppPolling = setInterval( function()
				{
					Workspace.pollNativeApp();
				}, 1000 );
			}
		}
		m.execute( 'launch_app', { path: path } );
	},
	// Get the list of windows associated with an appname or all
	getNativeWindowList: function( appname, callback )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				var out = [];
				var ar = JSON.parse( d );
				
				// Sync with applications
				for( var p = 0; p < ar.length; p++ )
				{
					var opts = ar[p].match( /([^\s].*?)\ [^\s].*?\ ([0-9]+)/i );
					var pid = opts[2];
					var wid = opts[1];
					for( var a = 0; a < Workspace.applications.length; a++ )
					{
						if( Workspace.applications[a].pid && Workspace.applications[a].pid == pid )
						{
							Workspace.applications[a].viewId = wid;
							out.push( Workspace.applications[a] );
						}
					}
				}
				if( callback && typeof( callback ) == 'function' ) callback( out );
				callback = false;
			}
			PollTaskbar();
			if( callback && typeof( callback ) == 'function' ) callback( false );
		}
		m.execute( 'list_windows', appname ? { appname: appname } : false );
	},
	// Just refresh the desktop ------------------------------------------------
	refreshDesktop: function( callback, forceRefresh )
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
			if( callback && typeof( callback ) == 'function' ) callback();
			
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
					var ext = false;
					if( self.wallpaperImage.indexOf( '.' ) > 0 )
					{
						ext = self.wallpaperImage.split( '.' );
						ext = ( ( ext[ext.length-1] ) + "" ).toLowerCase();
					}
					
					// Remove prev
					var v = eles[0].parentNode.getElementsByTagName( 'video' );
					for( var z = 0; z < v.length; z++ ) eles[0].parentNode.removeChild( v[z] );
					
					// Check extension
					switch( ext )
					{
						// Movie wallpaper!
						case 'mp4':
						case 'avi':
						case 'ogg':
						case 'webm':
							// Add new video
							function setTheThing( o )
							{
								o.loop = false;
								o.preload = true;
								o.className = 'VideoBackground';
								o.src = getImageUrl( self.wallpaperImage );
							}
							var m = document.createElement( 'video' ); setTheThing( m );
							var c = document.createElement( 'video' ); setTheThing( c );
							m.autoplay = true;
							c.autoplay = false;
							c.style.visibility = 'hidden';
							m.addEventListener( 'ended', function()
							{
								c.style.visibility = 'visible';
								c.play();
								m.style.visibility = 'hidden';
								m.src = c.src;
							}, false );
							c.addEventListener( 'ended', function()
							{
								m.style.visibility = 'visible';
								m.play();
								c.style.visibility = 'hidden';
								c.src = m.src;
							}, false );
							eles[0].style.backgroundImage = '';
							eles[0].parentNode.appendChild( m );
							eles[0].parentNode.appendChild( c );
							break;
						default:
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
							break;
					}
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
			
		}, forceRefresh );
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
	getMountlist: function( callback, forceRefresh )
	{
		var t = this;
		var m = new Module( 'system' );
		m.onExecuted = function( e, dat )
		{
			var newIcons = [];
			
			// Add system on top (after Ram: if it exists)
			newIcons.push({
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
						var dormantDoor = doors[ a ];
						if ( dormantDoor.AutoMount )
						{
							newIcons.push( 
							{
								Title:	dormantDoor.Title,
								Volume:   dormantDoor.Volume,
								Path:	 dormantDoor.Path,
								Type:	 dormantDoor.Type,
								Handler: 'built-in',
								Driver: 'Dormant',
								MetaType: 'Directory',
								IconClass: 'SystemDisk',
								ID:	   'local', // TODO: fix
								Mounted:  true,
								Visible: true,
								Door: dormantDoor,
								Dormant: dormantDoor.Dormant
							} );						
						}
						else
						{
							newIcons.push( doors[a] );
						}
					}
					found.push( doors[a] );
				}
			}
			
			// Redraw icons when tested for disk info
			var redrawIconsT = false;
			function testDrive( o, d )
			{
				// Check disk info
				d.dosAction( 'info', { path: o.Volume + 'disk.info' }, function( io )
				{
					if( io.split( '<!--separate-->' )[0] == 'ok' )
					{
						var fl = new File( o.Volume + 'disk.info' );
						fl.onLoad = function( data )
						{
							if( data.indexOf( '{' ) >= 0 )
							{
								var dt = JSON.parse( data );
								if( dt && dt.DiskIcon )
								{
									//iconinner.className = 'Custom';
									o.IconFile = getImageUrl( o.Volume + dt.DiskIcon );
									clearTimeout( redrawIconsT );
									setTimeout( function()
									{
										t.redrawIcons();
									}, 100 );
								}
							}
						}
						fl.load();
					}
					clearTimeout( redrawIconsT );
					setTimeout( function()
					{
						t.redrawIcons();
					}, 100 );
				} );
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
					
					// Check if it exists
					if( !forceRefresh )
					{
						var found = false;
						for( var va in t.icons )
						{
							if( t.icons[va].Volume == r.Name.split( ':' ).join( '' ) + ':' )
							{
								found = true;
								newIcons.push( t.icons[va] );
								break;
							}
						}
						if( found ) continue;
					}
					
					// Doesn't exist, go on
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
						Door: d,
						Config: r.Config
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
				
					testDrive( o, d );
				
					// Add to list
					newIcons.push( o );
				}
				// The new list
				if( newIcons.length )
					t.icons = newIcons;
			}
			
			// Do the callback thing
			if( callback && typeof( callback ) == 'function' ) callback( t.icons );
			
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
					// TODO: The colon thing... :)
					if( w.fileInfo.Volume.split( ':' )[0] == this.icons[b].Title.split( ':' )[0] )
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
				
				var inp = w.getElementsByTagName( 'input' )[0];
				var btn = w.getElementsByTagName( 'button' )[0];
				
				btn.onclick = function()
				{
					Workspace.executeRename( w.getElementsByTagName( 'input' )[0].value, icon, rwin );
				}
				inp.select();
				inp.focus();
				inp.onkeydown = function( e )
				{
					var wh = e.which ? e.which : e.keyCode;
					if( wh == 13 )
					{
						btn.click();
					}
				}
			}
		}
	},
	// copy current file selection into ivrtual clipboard
	copyFiles: function()
	{
		if ( window.currentMovable && window.currentMovable.content )
		{
			var rwin = window.currentMovable;
			var eles = rwin.content.getElementsByTagName( 'div' );
			var selected = [];
			for( var a = 0; a < eles.length; a++ )
			{
				if( eles[a].className.indexOf( ' Selected' ) < 0 )
					continue;
				
				selected.push( eles[a] );
			}
			//only act if we have something to do afterwards...
			if( selected.length > 0 )
			{
				Friend.workspaceClipBoardMode = 'copy';
				Friend.workspaceClipBoard = selected;
			}
		}
	},
	pasteFiles: function()
	{
		if( Friend.workspaceClipBoard && Friend.workspaceClipBoard.length > 0 && typeof window.currentMovable.drop == 'function' )
		{
			var e = {};
			e.ctrlKey = ( Friend.workspaceClipBoardMode == 'copy' ? true : false );
			window.currentMovable.drop( Friend.workspaceClipBoard, e );
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
	renderPermissionGUI: function( conf, keyStr )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, da )
		{
			var perms = '';
			var filesystemoptions = '';
			
			// Default permissions
			// TODO: Make dynamic
			var permissionPool = [
				'Module System',
				'Module Files', 
				'Door Local'
			];
			var hasPermissions = [ false, false, false ];
			
			if( !conf )
			{
				conf = { permissions: permissionPool };
			}
			else if( !conf.permissions )
			{
				conf.permissions = hasPermissions;
			}
			
			// Add needed
			for( var b = 0; b < permissionPool.length; b++ )
			{
				for( var a = 0; a < conf.permissions.length; a++ )
				{
					if( permissionPool[b] == conf.permissions[a] )
					{
						hasPermissions[b] = true;
					}
				}
			}
			
			// List out options for permissions
			for( var a = 0; a < permissionPool.length; a++ )
			{
				var row = Trim( permissionPool[a] ).split( ' ' );
				var ch = hasPermissions[a] == true ? ' checked="checked"' : '';
				switch( row[0].toLowerCase() )
				{
					case 'door':
						perms += '<p>';
						perms += '<input type="checkbox" permission="' + row.join( ' ' ) + '" ' + ch + '/> ';
						perms += '<label>' + i18n('grant_door_access' ) + '</label> ';
						perms += '<select><option value="all">' + 
							i18n( 'all_filesystems' ) + '</option>' + filesystemoptions + '</select>';
						perms += '.</p>';
						break;
					case 'module':
						perms += '<p><input type="checkbox" permission="' + row.join( ' ' ) + '" ' + ch + '/> ';
						perms += '<label>' + i18n('grant_module_access' ) + '</label> ';
						perms += '<strong>' + row[1].toLowerCase() + '</strong>.';
						perms += '</p>';
						break;
					case 'service':
						perms += '<p><input type="checkbox" permission="' + row.join( ' ' ) + '" ' + ch + '/> ';
						perms += '<label>' + i18n('grant_service_access' ) + '</label> ';
						perms += '<strong>' + row[1].toLowerCase() + '</strong>.';
						perms += '</p>';
						break;
					default:
						continue;
				}
			}
			
			if( ge( 'Permissions' + keyStr ) )
			{
				ge( 'Permissions' + keyStr ).innerHTML = perms;
			}
		
			// Check the security domains
			var domains = [];
			if( e == 'ok' )
			{
				var data = JSON.parse( da );
				domains = data.domains;
			}
			if( ge( 'SecurityDomains' + keyStr ) )
			{
				var s = document.createElement( 'select' );
				s.innerHTML = '';
				for( var a = 0; a < domains.length; a++ )
				{
					var o = document.createElement( 'option' );
					if( Trim( domains[a] ) == conf.domain )
						o.selected = 'selected';
					o.innerHTML = Trim( domains[a] );
					o.value = Trim( domains[a] );
					s.appendChild( o );
				}
				ge( 'SecurityDomains' + keyStr ).innerHTML = '';
				ge( 'SecurityDomains' + keyStr ).appendChild( s );
			}
		}
		m.execute( 'securitydomains' );
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
		// Check volume
		if( icon.Type == 'Door' && ( ( !icon.Filesize && icon.Filesize != 0 ) || isNaN( icon.Filesize ) ) )
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				var o = d;
				if( typeof( o ) != 'object' )
					o = d && d.indexOf( '{' ) >= 0 ? JSON.parse( d ) : {};
				if( o && o.Filesize && o.Filesize > 0 )
				{
					icon.Filesize = o.Filesize;
					icon.UsedSpace = o.Used;
				}
				// This shouldn't happen!
				else
				{
					icon.Filesize = 0;
					icon.UsedSpace = 0;
				}
				
				Workspace.fileInfo( icon );
			}
			m.execute( 'volumeinfo', { path: icon.Path } );
			return;
		}
		// check if we have a selected icon
		if( icon )
		{
			var w = new View( {
				title: ( icon.Type == 'Door' ? i18n( 'i18n_volumeicon_information' ) : i18n( 'i18n_icon_information' ) ) + 
					' "' + ( icon.Filename ? icon.Filename : icon.Title ) + '"',
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
			prot += '<div class="FloatLeft HContent30 TextCenter MarginBottom">' + i18n( 'owner' ) + ':</div>';
			prot += '<div class="FloatLeft HContent30 TextCenter MarginBottom">' + i18n( 'group' ) + ':</div>';
			prot += '<div class="FloatLeft HContent30 TextCenter MarginBottom">' + i18n( 'others' ) + ':</div>';
			prot += '</div></div>';
			
			// Gui
			for( var z in bits )
			{
				prot += '<div class="HRow">';
				prot += '<div class="FloatLeft HContent30">' + i18n( z ) + ':</div>';
				prot += '<div class="FloatLeft HContent70">';
				for( var oz in [ 'self', 'group', 'others' ] )
				{
					prot += '<div class="FloatLeft HContent30 TextCenter"><input type="checkbox" name="' + z + '_' + oz + '"/></div>';
				}
				prot += '</div>';
				prot += '</div>';
			}
			
			// Human filesize
			var fbtype = 'b';
			var ustype = 'b';
			
			icon.UsedSpace = parseInt( icon.UsedSpace );
			icon.Filesize = parseInt( icon.Filesize );
			
			if( icon.UsedSpace )
			{
				if( icon.UsedSpace > 1024 ){ icon.UsedSpace /= 1024.0; ustype = 'kb'; }
				if( icon.UsedSpace > 1024 ){ icon.UsedSpace /= 1024.0; ustype = 'mb'; }
				if( icon.UsedSpace > 1024 ){ icon.UsedSpace /= 1024.0; ustype = 'gb'; }
				if( icon.UsedSpace > 1024 ){ icon.UsedSpace /= 1024.0; ustype = 'tb'; }
				icon.UsedSpace = Math.round( icon.UsedSpace, 1 );
			}
			
			if( icon.Filesize > 1024 ){ icon.Filesize /= 1024.0; fbtype = 'kb'; }
			if( icon.Filesize > 1024 ){ icon.Filesize /= 1024.0; fbtype = 'mb'; }
			if( icon.Filesize > 1024 ){ icon.Filesize /= 1024.0; fbtype = 'gb'; }
			if( icon.Filesize > 1024 ){ icon.Filesize /= 1024.0; fbtype = 'tb'; }
			icon.Filesize = Math.round( icon.Filesize, 1 );
			
			// Load template
			var filt = ( icon.Type == 'Door' ? 'iconinfo_volume.html' : 'iconinfo.html' );
			if( icon.Path.split( ':' )[0] == 'System' )
				filt = 'iconinfo_system.html';
			var f = new File( '/webclient/templates/' + filt );
			f.replacements = {
				filename: icon.Filename ? icon.Filename : ( icon.Title.split( ':' )[0] ),
				filesize: icon.Filesize + '' + fbtype + ( icon.UsedSpace ? ( ' (' + icon.UsedSpace + '' + ustype + ' ' + i18n( 'i18n_used_space' ) + ')' ) : '' ),
				protection: prot,
				Cancel: i18n( 'i18n_cancel' ),
				Save: i18n( 'i18n_save' ),
				Notes: i18n( 'i18n_notes' ),
				iconnotes: icon.Notes ? icon.Notes : '',
				sharename: i18n( 'i18n_sharename' ),
				sharewith: i18n( 'i18n_sharewith'),
				instance: ( icon.Filename ? icon.Filename : ( icon.Title.split( ':' )[0] ) ).split( /[^a-z]+/i ).join( '' )
			};
			f.i18n();
			f.onLoad = function( d )
			{
				w.setContent( d.split( '!!' ).join( Workspace.seed ) );
				
				var eles = w.getWindowElement().getElementsByTagName( 'div' );
				var da = false;
				for( var a = 0; a < eles.length; a++ )
				{
					if( eles[a].classList.contains( 'DropArea' ) )
					{
						da = eles[a];
						break;
					}
				}
				// Set disk icon
				if( da )
				{
					da.style.height = '150px';
					da.style.backgroundRepeat = 'no-repeat';
					da.style.backgroundPosition = 'center';
					da.style.backgroundSize = '64px auto';
					da.style.backgroundImage = 'url(' + icon.IconFile + ')';
					w.getWindowElement().icons = [ { domNode: da } ];
					da.drop = function( ele )
					{
						if( ele.length )
						{
							if( ele[0].fileInfo )
							{
								var s = ele[0].fileInfo.Path.split( '.' );
								switch( s[s.length-1].toLowerCase() )
								{
									case 'png':
									case 'jpg':
									case 'jpeg':
									case 'gif':
										da.style.transform = '';
										da.style.webkitTransform = '';
										var f = new File( ele[0].fileInfo.Path.split( ':' )[0] + ':disk.info' );
										f.onSave = function( e )
										{
											Workspace.refreshDesktop( false, true );
											da.style.backgroundImage = 'url(' + getImageUrl( ele[0].fileInfo.Path ) + ')';
										}
										f.save( 
											'{"DiskIcon":"' + ele[0].fileInfo.Path.split( ':' )[1] + '"}',
											ele[0].fileInfo.Path.split( ':' )[0] + ':disk.info' 
										);
										break;
								}
							}
						}
					}
				}
				
				
				// Bring up volume permissions				
				if( icon.Type == 'Door' )
				{
					Workspace.refreshDesktop( function()
					{
						var pth = icon.deviceName ? ( icon.deviceName + ':' ) : icon.Path;
						var dr = ( new Door() ).get( pth );
						if( dr.Config )
						{
							var conf = JSON.parse( dr.Config );
							Workspace.renderPermissionGUI( conf, f.replacements.instance );
						}
						else Workspace.renderPermissionGUI( false, f.replacements.instance );
					} );
				}
				
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
				
				// Setup public / private file
				eles = w.getElementsByTagName( 'input' );
				for( var a in eles )
				{
					// Skip non numeric element keys!
					if( isNaN( parseInt( a ) ) ) continue;
					
					// The public file functionality
					if( eles[a].getAttribute( 'name' ) == 'PublicLink' )
					{
						if( icon.SharedLink )
						{
							eles[a].value = icon.SharedLink;
							eles[a].disabled = '';
						}
						else
						{
							eles[a].disabled = 'disabled';
							eles[a].value = '';
						}
					}
					else if( eles[a].getAttribute( 'name' ) == 'IsPublic' )
					{
						if( icon.Shared && icon.Shared == 'Public' )
						{
							eles[a].checked = 'checked';
						}
						eles[a].onSave = function( e )
						{
							var p = icon.Path;
							if( p.indexOf( '/' ) > 0 )
							{
								p = p.split( '/' );
								p.pop();
								p = p.join( '/' );
								p += '/';
							}
							else if( p.indexOf( ':' ) > 0 )
							{
								p = p.split( ':' )[0];
								p += ':';
							}
							
							// Set file public
							if( this.checked )
							{
								var m = new Library( 'system.library' );
								m.onExecuted = function( e, d )
								{
									var ele = ( new Door().get( p ) );
									ele.getIcons( false, function( icons, path, test )
									{
										// Update link
										var ic = false;
										for( var b = 0; b < icons.length; b++ )
										{
											if( icons[b].Type != 'File' ) continue;
											if( icons[b].Path == icon.Path )
											{
												ic = icons[b];
												break;
											}
										}
										if( !ic ) return;
										for( var b = 0; b < eles.length; b++ )
										{
											if( eles[b].getAttribute( 'name' ) == 'PublicLink' )
											{
												if( ic.SharedLink )
												{
													eles[b].value = ic.SharedLink;
													eles[b].disabled = '';
												}
												else
												{
													eles[b].disabled = 'disabled';
													eles[b].value = '';
												}
											}
										}
										Workspace.refreshWindowByPath( path );
									} );
								}
								m.execute( 'file/expose', { path: icon.Path } );
							}
							// Set file private
							else
							{
								var m = new Library( 'system.library' );
								m.onExecuted = function( e )
								{
									if( e != 'ok' )
									{
										this.checked = true;
									}
									var ele = ( new Door().get( p ) );
									ele.getIcons( false, function( icons, path, test )
									{
										// Update link
										var ic = false;
										for( var b = 0; b < icons.length; b++ )
										{
											if( icons[b].Type != 'File' ) continue;
											if( icons[b].Path == icon.Path )
											{
												ic = icons[b];
												break;
											}
										}
										if( !ic ) return;
										for( var b = 0; b < eles.length; b++ )
										{
											if( eles[b].getAttribute( 'name' ) == 'PublicLink' )
											{
												if( ic.SharedLink )
												{
													eles[b].value = ic.SharedLink;
													eles[b].disabled = '';
												}
												else
												{
													eles[b].disabled = 'disabled';
													eles[b].value = '';
												}
											}
										}
										Workspace.refreshWindowByPath( path );
									} );
								}
								m.execute( 'file/conceil', { path: icon.Path } );
							}
						}
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
	// element from which to get the window, and inst for instance id
	saveFileInfo: function( ele, inst )
	{
		// Find window object...
		while( !ele.viewId )
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
		for( var b in inps )
		{
			if( isNaN( parseInt( b ) ) ) continue;
			if( inps[b].onSave ) inps[b].onSave();
			out.push( inps[b] );
		}
		
		// Add arguments
		for( var a = 0; a < out.length; a++ )
		{
			// Skip permission inputs
			if( out[a].getAttribute && out[a].getAttribute( 'permission' ) )
				continue;
			args[out[a].name] = out[a].type == 'checkbox' ? ( out[a].checked ? '1' : '0' ) : out[a].value;
		}
		
		// Permissions now
		var permissions = ge( 'Permissions' + inst );
		var perms = '';
		if( permissions && ( perms = permissions.getElementsByTagName( 'input' ) ) )
		{
			var permopts = [];
			for( var a = 0; a < perms.length; a++ )
			{
				if( !perms[ a ].checked ) continue;
				var par = perms[a].parentNode.nodeName;
				if( par != 'P' )
					continue;
				if( perms[a].getAttribute( 'permission' ) )
					permopts.push( perms[a].getAttribute( 'permission' ) );
				var select = perms[a].parentNode.getElementsByTagName( 'select' );
			}
			args.Permissions = permopts;
		}
		
		// Security domain
		var sdomain = ge( 'SecurityDomains' + inst );
		if( sdomain )
		{
			var sel = sdomain.getElementsByTagName( 'select' );
			if( sel && sel[0] )
			{
				args.Domains = sel[0].value;
			}
		}
		
		// Execute module action
		l.onExecuted = function( r, d )
		{
			//console.log( r + ' ' + d );
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
		SaveWindowStorage( function(){ Workspace.sessionId = ''; document.location.reload(); } );
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
	// Check if an icon with type .{type} was selected
	selectedIconByType: function( type )
	{
		var c = currentMovable && currentMovable.content && currentMovable.content.directoryview ?
			currentMovable.content.directoryview : false;
		if( !c ) return false;
		
		var ic = currentMovable.content.icons;
		for( var a = 0; a < ic.length; a++ )
		{
			var t = ic[a].Filename ? ic[a].Filename : ic[a].Title;
			var s = t.split( '.' );
			s = s[s.length-1];
			if( ic[a].domNode && ic[a].domNode.classList.contains( 'Selected' ) )
			{
				if( s.toLowerCase() == type.toLowerCase() )
					return true;
			}
		}
		return false;
	},
	// Compress files
	zipFiles: function()
	{
		Notify( { title: i18n( 'i18n_zip_start' ), text: i18n( 'i18n_zip_startdesc' ) } );
		var ic = currentMovable.content.icons;
		var f = [];
		for( var a = 0; a < ic.length; a++ )
		{
			if( ic[a].domNode && ic[a].domNode.classList.contains( 'Selected' ) )
			{
				f.push( { Filename: ic[a].Filename, Path: ic[a].Path, Type: ic[a].Type } );
			}
		}
		if( f.length )
		{
			var m = new Module( 'system' );
			m.file = f[0].Filename;
			m.onExecuted = function( e, d )
			{
				var p = ic[0].Path;
				if( p.indexOf( '/' ) > 0 )
				{
					p = p.split( '/' );
					p.pop();
					p = p.join( '/' );
				}
				else if( p.indexOf( ':' ) > 0 )
				{
					p = p.split( ':' )[0] + ':';
				}
				var lastChar = p.substr( 0, p.length - 1 );
				if( lastChar != ':' && lastChar != ':' ) p += '/';
				Workspace.refreshWindowByPath( p );
				Notify( { title: i18n( 'i18n_zip_completed' ), text: i18n( 'i18n_zip_comdesc' ) + ': ' + this.file } );
			}
			m.execute( 'zip', { paths: f } );
		}
	},
	// Uncompress files
	unzipFiles: function()
	{
		Notify( { title: i18n( 'i18n_unzip_start' ), text: i18n( 'i18n_unzip_startdesc' ) } );
		var ic = currentMovable.content.icons;
		var f = [];
		for( var a = 0; a < ic.length; a++ )
		{
			if( ic[a].domNode && ic[a].domNode.classList.contains( 'Selected' ) )
			{
				f.push( { Filename: ic[a].Filename, Path: ic[a].Path, Type: ic[a].Type } );
			}
		}
		if( f.length )
		{
			for( var a = 0; a < f.length; a++ )
			{
				var m = new Module( 'system' );
				m.file = f[a].Filename;
				m.onExecuted = function( e, d )
				{
					var p = ic[0].Path;
					if( p.indexOf( '/' ) > 0 )
					{
						p = p.split( '/' );
						p.pop();
						p = p.join( '/' );
					}
					else if( p.indexOf( ':' ) > 0 )
					{
						p = p.split( ':' )[0] + ':';
					}
					var lastChar = p.substr( 0, p.length - 1 );
					if( lastChar != ':' && lastChar != ':' ) p += '/';
					Workspace.refreshWindowByPath( p );
					Notify( { title: i18n( 'i18n_unzip_completed' ), text: i18n( 'i18n_unzip_comdesc' ) + ': ' + this.file } );
				}
				m.execute( 'unzip', { path: f[a].Path } );
			}
		}
	},
	// Refresh Doors menu recursively ------------------------------------------
	refreshMenu: function( prohibitworkspaceMenu )
	{
		// Current has icons?
		var iconsAvailable = currentMovable && currentMovable.content && currentMovable.content.directoryview ? true : false;
		var volumeIcon = false;

		if( iconsAvailable && typeof currentMovable.content.checkSelected == 'function' ) {  currentMovable.content.checkSelected(); }
		else if( !currentMovable && currentScreen.screen._screen.icons )
			currentScreen.screen.contentDiv.checkSelected();

		var iconsSelected = Friend.iconsSelectedCount > 0;
		var iconsInClipboard = ( Friend.workspaceClipBoard && Friend.workspaceClipBoard.length > 0 );

		if( iconsSelected )
		{
			var ics = currentMovable ? currentMovable.content.icons : currentScreen.screen._screen.icons;
			for( var a in ics )
			{
				if( ics[a].Type == 'Door' && ics[a].domNode && ics[a].domNode.classList.contains( 'Selected' ) )
				{
					volumeIcon = true;
					break;
				}
			}
		}
		
		// Init menu -----------------------------------------------------------
		var tools = '';
		if( typeof( this.menu['tools'] ) != 'undefined' )
		{
			tools = this.menu['tools'].join ( "\n" );
		}
		
		// Setup Doors menu
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
						name:   i18n( 'i18n_search_files' ),
						command: function(){ Workspace.showSearch();  }
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
						command: function(){ Workspace.refreshDesktop( false, true ); }
					},
					{
						name:	i18n( 'menu_fullscreen' ),
						command: function(){ Workspace.fullscreen(); }
					},
					{
						divider: true
					},
					{
						name:	i18n( 'menu_run_command' ),
						command: function(){ Workspace.showLauncher(); }
					},
					{
						name:	i18n( 'menu_new_shell' ),
						command: function(){ ExecuteApplication( 'Dingo' ); }
					},
					{
						name:	i18n( 'menu_upload_file' ),
						command: function(){ Workspace.uploadFile(); }
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
					/*{
						name:	i18n( 'menu_open_parent_directory' ),
						command: function(){ Workspace.openParentDirectory(); },
						disabled: !iconsAvailable || volumeIcon
					},*/
					{
						name:	i18n( 'menu_refresh_directory' ),
						command: function(){ Workspace.refreshDirectory(); },
						disabled: !iconsAvailable
					},
					{
						name:   i18n( 'menu_hide_all_views' ),
						command: function(){ Workspace.hideAllViews(); }
					},
					{
						name:   i18n( 'menu_hide_inactive_views' ),
						command: function(){ Workspace.hideInactiveViews(); }
					},
					/*{
						name:	i18n( 'menu_open_directory' ),
						command: function(){ Workspace.openDirectory(); },
						disabled: !iconsSelected
					},*/
					/*{
						name: i18n( 'menu_show_as' ),
						items:
						iconsAvailable ? [
							{
								name:	i18n( 'menu_show_as_icons' ),
								command: function(){ Workspace.viewDirectory('iconview'); }
							},
							{
								name:	i18n( 'menu_show_as_list' ),
								command: function(){ Workspace.viewDirectory('listview'); }
							}
						] : [],
						disabled: !iconsAvailable
					},*/
					/*{
						name:	i18n( 'menu_snapshot' ),
						items:
						[
							{
								name:	i18n( 'menu_snapshot_all' ),
								command: function(){ SaveWindowStorage(); }
							}
						]
					},*/
					{
						name:	i18n( 'menu_close_window' ),
						command: function(){ CloseWindow( window.currentMovable ) }
					}
				]
			},
			{
				name: i18n( 'menu_edit' ),
				items:
				[
					{
						name: i18n( 'menu_clear_clipboard' ),
						command: function()
						{
							ClipboardSet( '' );
						}
					}
				]
			},
			{
				name: i18n( 'menu_icons' ),
				items:
				[
					{
						name:	i18n( 'menu_copy' ),
						command: function() { Workspace.copyFiles(); },
						disabled: !iconsSelected
					},
					{
						name:	i18n( 'menu_paste' ),
						command: function() { Workspace.pasteFiles(); },
						disabled: !iconsInClipboard
					},
					{
						name:	i18n( 'menu_new_directory' ),
						command: function() { Workspace.newDirectory(); },
						disabled: !iconsAvailable
					},
					{
						name:	i18n( 'menu_show_icon_information' ),
						command: function(){ Workspace.fileInfo(); },
						disabled: !iconsSelected
					},
					{
						name:	i18n( 'menu_edit_filename' ),
						command: function() { Workspace.renameFile(); },
						disabled: ( !iconsSelected || volumeIcon )
					},
					{
						name:	i18n( 'menu_zip' ),
						command: function() { Workspace.zipFiles(); },
						disabled: ( !iconsSelected || volumeIcon )
					},
					{
						name:	i18n( 'menu_unzip' ),
						command: function() { Workspace.unzipFiles(); },
						disabled: !iconsSelected || !Workspace.selectedIconByType( 'zip' )
					},
					{
						name:	i18n( 'menu_delete' ),
						command: function() { Workspace.deleteFile(); },
						disabled: ( !iconsSelected || volumeIcon )
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
								{ Workspace.refreshDesktop( false, true ); }
								var args = {
									command: 'unmount',
									devname: p.split( ':' ).join ( '' ),
									path: p
								};
								f.execute( 'device', args );
							}
						},
						disabled: !volumeIcon
					},
				]
			}/*,
			{
				name: i18n( 'menu_bookmarks' ),
				items: Workspace.getBookmarks()
			}*/
		];


		// Add tools menu		
		// TODO: Readd tools and bookmarks when ready
		this.menu.push ( { 
			name: i18n( 'menu_tools' ), 
			items: [
				{
					name:   i18n( 'menu_looknfeel' ),
					command: function(){ ExecuteApplication( 'Looknfeel' ); }
				},
				{
					name:   i18n( 'menu_mount_filesystem' ),
					command: function(){ ExecuteApplication( 'Mountlist' ); }
				},
				{
					name:	i18n( 'documentation_central' ),
					command: function(){ ExecuteApplication( 'DocuEditor' ); }
				},
				{
					name:	i18n( 'software_catalog' ),
					command: function(){ ExecuteApplication( 'Software' ); }
				}
			]
		} );
				
		// Generate
		if( !prohibitworkspaceMenu )
		{
			WorkspaceMenu.generate( false, this.menu );
		}
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
	showSearch: function()
	{
		if( !Workspace.sessionId ) return;
		
		var w = new View( {
			title: i18n( 'i18n_search_files' ),
			width: 480,
			height: 130,
			id: 'workspace_search',
			resize: false
		} );
		this.searchView = w;
		
		var f = new File( 'templates/search.html' );
		f.i18n();
		f.onLoad = function( data )
		{
			w.setContent( data );
		}
		f.load();
	},
	searchSetPath: function()
	{
		this.searchD = new Filedialog(
			this.searchView, function( data )
			{
				if( data && data.length && data.indexOf( ':' ) > 0 )
				{
					Workspace.searchPath = data;
					ge( 'WorkspaceSearchPath' ).value = data;
				}
				// Close search view on abort? Perhaps not..
				else if( Workspace.searchView )
				{
					//Workspace.searchView.close();
					//Workspace.searchView = false;
				}
				Workspace.searchD = false;
			}, Workspace.searchPath ? Workspace.searchPath : 'Mountlist:', 'path', false, i18n( 'i18n_select_path_to_search' )
		);
	},
	// Do the actual searching
	searchExecute: function()
	{
		if( !this.searchView ) return;
		
		ge( 'WorkspaceSearchResults' ).innerHTML = '';
		this.searching = true;
		this.searchPaths = [];
		this.searchMatches = [];
		var keyz = ge( 'WorkspaceSearchKeywords' ).value.split( ',' ).join( ' ' ).split( ' ' );
		this.searchKeywords = [];
		for( var a = 0; a < keyz.length; a++ )
		{
			if( !Trim( keyz[a] ) ) continue;
			this.searchKeywords.push( Trim( keyz[a] ) );
		}
		if( !this.searchKeywords.length ) return;
		
		ge( 'WorkspaceSearchStop' ).style.width = 'auto';
		ge( 'WorkspaceSearchStop' ).style.display = '';
		ge( 'WorkspaceSearchStop' ).style.visibility = 'visible';
		ge( 'WorkspaceSearchGo' ).style.display = 'none';
		
		var searchProcesses = false;
		var doSearch = function( path )
		{
			// Abort!
			if( !Workspace.searching ) return;
			
			// Don't search this twice
			for( var y = 0; y < Workspace.searchPaths.length; y++ )
			{
				if( Workspace.searchPaths[y] == path )
				{
					found = true;
					return;
				}
			}
			Workspace.searchPaths.push( path );
			
			// Go!
			searchProcesses++;
			var d = ( new Door() ).get( path );
			if( !d || !d.getIcons )
			{
				searchProcesses--;
				if( searchProcesses == 0 ) Workspace.searchStop();
				return;
			}
			d.getIcons( false, function( data )
			{
				if( !data.length )
				{
					searchProcesses--;
					if( searchProcesses == 0 ) Workspace.searchStop();
				}
				for( var u = 0; u < data.length; u++ )
				{
					// Match all keywords
					for( var b = 0; b < Workspace.searchKeywords.length; b++ )
					{
						var found = false;
						
						// Don't register them twice
						var idnt = data[u].Filename ? data[u].Filename : data[u].Title;
						if( idnt.indexOf( Workspace.searchKeywords[b] ) >= 0 )
						{
							for( var y = 0; y < Workspace.searchPaths.length; y++ )
							{
								if( Workspace.searchPaths[y] == data[u].Path )
								{
									found = true;
									break;
								}
							}
							if( !found )
								Workspace.searchMatches.push( data[u] );
							else Workspace.searchPaths.push( data[u].Path );
						}
						// Recurse
						if( !found )
						{
							if( data[u].Type == 'Directory' || data[u].Type == 'Door' || data[u].Type == 'Dormant' )
							{
								doSearch( data[u].Path );
							}
						}
					}
				}
				Workspace.searchRefreshMatches();
				searchProcesses--;
				if( searchProcesses == 0 ) Workspace.searchStop();
			} );
		}
		doSearch( ge( 'WorkspaceSearchPath' ).value );
	},
	searchRefreshMatches: function()
	{
		if( !ge( 'WorkspaceSearchResults' ) ) return false;
		
		if( !this.searching ) return;
		
		ge( 'WorkspaceSearchResults' ).classList.add( 'BordersDefault' );
		
		for( var a = 0; a < this.searchMatches.length; a++ )
		{
			var m = this.searchMatches[a];
			if( !m || !m.Path ) continue;
			if( m.added ) continue;
			var d = document.createElement( 'div' );
			this.searchMatches[a].added = d;
			d.className = 'MarginBottom MarginTop' + ( ( a == this.searchMatches.length - 1 ) ? ' MarginBottom' : '' );
			d.innerHTML = '<p class="Ellipsis Layout PaddingLeft PaddingRight"><span class="MousePointer IconSmall fa-folder">&nbsp;</span> <span class="MousePointer">' + this.searchMatches[a].Path + '</a></p>';
			
			// Create FileInfo
			var ppath = m.Path;
			var fname = '';
			var title = '';
			if( ppath.indexOf( '/' ) > 0 )
			{
				ppath = ppath.split( '/' );
				ppath.pop();
				fname = ppath[ppath.length-1];
				title = fname;
				ppath = ppath.join( '/' ) + '/';
			}
			else if ( ppath.indexOf( ':' ) > 0 )
			{
				ppath = ppath.split( ':' )[0] + ':';
				fname = false;
				title = ppath.split( ':' )[0];
			}
			// Something is wrong with this fucker!
			else continue;
			
			// Manual evaluation
			var o = {
				Filename: fname,
				Title: title,
				Path: ppath,
				Filesize: false,
				ID: false,
				Shared: false,
				SharedLink: false,
				DateModified: false,
				DateCreated: false,
				added: false
			};
			for( var b in m )
				if( !o[b] && !( o[b] === false ) ) o[b] = m[b];
			o.Type = o.Path.substr( o.Path.length - 1, 1 ) != ':' ? 'Directory' : 'Door'; // TODO: What about dormant?
			o.MetaType = o.Type; // TODO: If we use metatype, look at this
			ge( 'WorkspaceSearchResults' ).appendChild( d );
			
			var spans = d.getElementsByTagName( 'span' );
			spans[0].folder = o;
			spans[0].onclick = function()
			{
				OpenWindowByFileinfo( this.folder, false );
			}
			spans[1].file = m;
			spans[1].onclick = function()
			{
				OpenWindowByFileinfo( this.file, false );
			}
		}
		
		var maxh = 400;
		var oh = ge( 'SearchFullContent' ).offsetHeight;
		if( oh > maxh )
		{
			ge( 'WorkspaceSearchResults' ).style.maxHeight = maxh - 20 - ge( 'SearchGuiContainer' ).offsetHeight + 'px';
			ge( 'WorkspaceSearchResults' ).style.overflow = 'auto';
			oh = maxh + 13;
		}
		
		this.searchView.setFlag( 'height', oh );
	},
	searchStop: function()
	{
		this.searching = false;
		ge( 'WorkspaceSearchStop' ).style.display = 'none';
		ge( 'WorkspaceSearchGo' ).style.display = '';
	},
	showLauncher: function()
	{
		if( !Workspace.sessionId ) return;
		
		var w = new View( {
			title: i18n( 'menu_execute_command' ),
			width: 320,
			height: 70,
			resize: false,
			id: 'launcherview'
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
			ge( 'WorkspaceRunCommand' ).addEventListener( 'keydown', function( e )
			{
				var wh = e.which ? e.which : e.keyCode;
				if( wh == 27 )
				{
					Workspace.hideLauncher();
					return cancelBubble( e );
				}
			} );
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
	hideAllViews: function()
	{
		for( var a in movableWindows )
		{
			movableWindows[a].setAttribute( 'minimized', 'minimized' );
		}
		PollTaskbar();
	},
	// 
	hideInactiveViews: function()
	{
		for( var a in movableWindows )
		{
			if( movableWindows[a].classList.contains( 'Active' ) )
				continue;
			movableWindows[a].setAttribute( 'minimized', 'minimized' );
		}
		PollTaskbar();
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
		
			if( cnt > 0 )
			{
				Confirm( i18n( 'i18n_sure_delete' ), i18n( 'i18n_sure_deldesc' ), function( d )
				{
					if( d == true )
					{
						// Delete these files!
						for( var a = 0; a < cnt; a++ )
						{
							files[a].door.dosAction( 'delete', { path: files[a].fileInfo.Path } );
						}
					}
				} );
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
			w.setRichContent( data );
		}
		j.load();
	},
	informationWindowArchive: function()
	{
		if( !Workspace.sessionId ) return;
		
		if( this.infoWindowArchive )
			return;
		var w = new View( {
			title: "Updates archive",
			width: 800,
			height: 500,
			screen: Workspace.screen
		} );
		w.onClose = function()
		{
			Workspace.infoWindowArchive = null;
		}
		this.infoWindowArchive = w;
		
		var j = new File( '/webclient/updates_archive.html' );
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
	var tar = e.target ? e.target : e.srcElement;
	
	if( !w || !e.ctrlKey )
	{
		switch( w )
		{
			// Escape means try to close the view
			case 27:
				// Inputs don't need to close the view
				if( tar.nodeName == 'INPUT' || tar.nodeName == 'SELECT' || tar.nodeName == 'TEXTAREA' )
				{
					tar.blur();
					return;
				}
				if( currentMovable )
				{
					if( currentMovable.content )
					{
						if( currentMovable.content.windowObject )
						{
							// Not possible to send message?
							if( !currentMovable.content.windowObject.sendMessage( { type: 'view', method: 'close' } ) )
							{
								CloseView( currentMovable );
							}
						}
						else
						{
							CloseView( currentMovable );
						}
					}
					else 
					{
						CloseView( currentMovable );
					}
				}
				break;
			default:
				//console.log( 'Clicked: ' + w );
				break;
		}
		return;
	}
		
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
		title: i18n( 'about_friendup' ) + ' v1.0 rc1',
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

// Shows eula

function ShowEula( accept )
{
	if( accept )
	{
		var m = new Module( 'system' );
		m.addVar( 'sessionid', Workspace.sessionId );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				var eles = document.getElementsByTagName( 'div' );
				for( var a = 0; a < eles.length; a++ )
				{
					if( eles[a].className == 'Eula' )
						eles[a].parentNode.removeChild( eles[a] );
				}
			}
		}
		m.execute( 'setsetting', { 
			setting: 'accepteula',
			data:    'true'
		} );
		return;
	}
	var d = document.createElement( 'div' );
	d.className = 'Eula';
	d.id = 'EulaDialog';
	document.body.appendChild( d );
	
	var f = new File( 'System:templates/eula.html' );
	f.onLoad = function( data )
	{
		d.innerHTML = data;
	}
	f.load();
}

// ASSID
function handleAssidRequest( e )
{
	var title = 'Shared app invite from ' + e.owner;
	var message = e.owner + ' says: ' + e.message;
	Confirm( title, message, confirmBack );
	
	function confirmBack( res )
	{
		if ( res )
			accept( e );
		else deny( e.assid );
	}
	
	function accept( data )
	{
		ExecuteApplication( e.appname, JSON.stringify( e ) );
	}
	
	function deny( assid )
	{
		var un = {
			path : 'system.library/sas/unregister/',
			data : {
				assid : assid,
			},
		};
		Workspace.conn.request( un, unBack );
		function unBack( res )
		{
			console.log( 'Workspace.handleAssidRequest - req denied, unregister, result', res );
		}
	}
}


