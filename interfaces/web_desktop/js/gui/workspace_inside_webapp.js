/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var WorkspaceInside = {
	// Dummy funcs
	nudgeWorkspacesWidget: function(){ return; },
	//
	refreshUserSettings: function( callback )
	{
		// This part is important - it is where we extend the workspace with 
		// configurable extensions based on config settings
		let b = new Module( 'system' );
		b.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				Workspace.serverConfig = JSON.parse( d );
				
				// Support init modules
				if( Workspace.serverConfig.initmodules )
				{
					let mods = Workspace.serverConfig.initmodules;
					for( let z = 0; z < mods.length; z++ )
					{
						if( !Workspace.initModules )
							Workspace.initModules = {};
						let mod = mods[ z ];
						if( !Workspace.initModules[ mod ] )
						{
							// Don't load module twice, and track its progress
							Workspace.initModules[ mod ] = {
								loaded: true,
								lastMessage: ''
							};
							( function( slot )
							{
								// If the module was found, execute its preload command
								if( mod.substr( 0, 10 ) == 'appModule:' )
								{
									let m = mod.split( ':' )[1];
									let ms = new Module( 'system' );
									ms.onExecuted = function( mse, msd )
									{
										slot.lastMessage = mse;
									}
									ms.execute( 'appmodule', {
										appName: m,
										command: 'preload'
									} );
								}
								else
								{
									let ms = new Module( mod );
									ms.onExecuted = function( mse, msd )
									{
										slot.lastMessage = mse;
									}
									ms.execute( 'preload' );
								}
							} )( Workspace.initModules[ mod ] );
						}
					}
				}
			}
		}
		b.execute( 'sampleconfig' );
		
		let userSettingsFetched = false;
		function getUserSettings()
		{
			let m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
			    if( userSettingsFetched ) 
			    {
			        callback();
			        return;
			    }
			    
			    Friend.User.settingsHash = MD5( e + d );
			    if( Friend.User.prevSettingsHash && Friend.User.settingsHash == Friend.User.prevSettingsHash )
			    {
			    	userSettingsFetched = true;
			    	Workspace.userSettingsLoaded = true;
			    	ScreenOverlay.hide();
			    	callback();
			    	return;
			    }
			    Friend.User.prevSettingsHash = Friend.User.settingsHash;
		        
				userSettingsFetched = true;
				
				function initFriendWorkspace()
				{	
					// Make sure we have loaded
					if( !Workspace.dashboard && Workspace.mode != 'vr' && ( Workspace.screen && Workspace.screen.contentDiv ) )
					{
						if( Workspace.screen.contentDiv.offsetHeight < 50 )
						{
							return setTimeout( function(){ initFriendWorkspace(); }, 50 );
						}
					}
					
					if( e == 'ok' && d )
					{
						Workspace.userSettingsLoaded = true;
						let dat = JSON.parse( d );
						Workspace.readUserSettings( dat );
						Workspace.applyThemeConfig();
					}
					else
					{
						if( window.doReveal )
							doReveal();
					}
					if( callback && typeof( callback ) == 'function' )
					{
						callback();
					}
				}
				
				// Load application cache's and then init workspace
				loadApplicationBasics( initFriendWorkspace );
			}
			m.forceHTTP = true;
			m.execute( 'getsetting', { settings: [ 
				'avatar', 'workspacemode', 'wallpaperdoors', 'wallpaperwindows', 'language', 
				'menumode', 'startupsequence', 'navigationmode', 'windowlist', 
				'focusmode', 'hiddensystem', 'workspacecount', 
				'scrolldesktopicons', 'hidedesktopicons', 'wizardrun', 'themedata_' + Workspace.theme,
				'workspacemode', 'workspace_labels'
			] } );
		}
		getUserSettings();
		setTimeout( function()
		{
			if( !userSettingsFetched )
			{
				getUserSettings();
				setTimeout( function()
				{
					if( !userSettingsFetched )
					{
						console.log( 'Test2: Failed to get user settings!' );
					}
				}, 450 );
			}
		}, 450 );
	},
	readUserSettings: function( dat )
	{
		if( dat.wallpaperdoors && dat.wallpaperdoors.substr )
		{
			if( dat.wallpaperdoors.substr(0,5) == 'color' )
			{
				Workspace.wallpaperImage = 'color';
				Workspace.wallpaperImageDecoded = false;
				document.body.classList.remove( 'NoWallpaper' );
				document.body.classList.remove( 'DefaultWallpaper' );
			}
			else if( dat.wallpaperdoors.length )
			{
				Workspace.wallpaperImage = dat.wallpaperdoors;
				if( 
					dat.wallpaperdoors.indexOf( ':' ) > 0 && 
					( dat.wallpaperdoors.indexOf( 'http://' ) != 0 || dat.wallpaperdoors.indexOf( 'https://' ) ) 
				)
				{
					Workspace.wallpaperImageDecoded = getImageUrl( Workspace.wallpaperImage );
				}
				document.body.classList.remove( 'NoWallpaper' );
				document.body.classList.remove( 'DefaultWallpaper' );
			}
			else 
			{
				document.body.classList.add( 'DefaultWallpaper' );
				Workspace.wallpaperImage = '/webclient/gfx/theme/default_login_screen.jpg';
				Workspace.wallpaperImageDecoded = false;
			}
		}
		else
		{
			document.body.classList.add( 'NoWallpaper' );
		}
		// Check for theme specifics
		if( dat[ 'themedata_' + Workspace.theme ] )
		{
			Workspace.themeData = dat[ 'themedata_' + Workspace.theme ];
		}
		else if( !Workspace.themeDataSet )
		{
			Workspace.themeData = false;
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
			globalConfig.menuMode = dat.menumode;
		}
		if( dat.focusmode )
		{
			globalConfig.focusMode = dat.focusmode;
			document.body.setAttribute( 'focusmode', dat.focusmode ); // Register for styling
		}
		if( dat.navigationmode )
		{
			globalConfig.navigationMode = dat.navigationmode;
		}
		if( dat.hiddensystem )
		{
			globalConfig.hiddenSystem = dat.hiddensystem;
		}
		if( window.isMobile )
		{
			globalConfig.viewList = 'separate';
		}
		else if( dat.windowlist )
		{
			globalConfig.viewList = dat.windowlist;
			document.body.setAttribute( 'viewlist', dat.windowlist ); // Register for styling
		}
		if( dat.scrolldesktopicons == 1 )
		{
			globalConfig.scrolldesktopicons = dat.scrolldesktopicons;
		}
		else globalConfig.scrolldesktopicons = 0;
		
		if( dat.hidedesktopicons == 1 || Workspace.tabletMode == true )
		{
			globalConfig.hidedesktopicons = dat.scrolldesktopicons;
			document.body.classList.add( 'DesktopIconsHidden' );
			if( !Workspace.dashboard && typeof( window.TabletDashboard ) != 'undefined' )
				Workspace.dashboard = new TabletDashboard();
		}
		else
		{
			globalConfig.hidedesktopicons = 0;
			document.body.classList.remove( 'DesktopIconsHidden' );
			if( Workspace.dashboard && !Workspace.desktop && !Workspace.themeData[ 'sidebarEngine' ] )
				Workspace.dashboard.destroy();
		}
		// Can only have workspaces on mobile
		// TODO: Implement dynamic workspace count for mobile (one workspace per app)
		if( dat.workspacecount >= 0 && !window.isMobile && !Workspace.tabletMode )
		{
			globalConfig.workspacecount = dat.workspacecount;
		}
		else
		{
			globalConfig.workspacecount = 1;
		}

		if( dat.workspacemode )
		{
			Workspace.workspacemode = dat.workspacemode;
		}
		else
		{
			Workspace.workspacemode = 'developer';
		}
	
		if( dat.workspace_labels )
		{
			globalConfig.workspace_labels = dat.workspace_labels;
		}
		else
		{
			globalConfig.workspace_labels = [];
		}
	},
	// If we have stored a theme config for the current theme, use its setup
	// TODO: Move to a proper theme parser
	applyThemeConfig: function()
	{
		if( !this.themeData )
	    {
	        return;
	    }
	       
		if( this.themeStyleElement )
			this.themeStyleElement.innerHTML = '';
		else
		{
			this.themeStyleElement = document.createElement( 'style' );
			document.getElementsByTagName( 'head' )[0].appendChild( this.themeStyleElement );
		}
		
		let shades = [ 'dark', 'charcoal', 'synthwave' ];
		for( let c in shades )
		{
			let uf = shades[c].charAt( 0 ).toUpperCase() + shades[c].substr( 1, shades[c].length - 1 );
			if( this.themeData[ 'colorSchemeText' ] == shades[c] )
				document.body.classList.add( uf );
			else document.body.classList.remove( uf );
		}
		// Support input paradigms
		if( typeof( this.themeData[ 'inputParadigmText' ] ) != 'undefined' )
		{
			let p = this.themeData[ 'inputParadigmText' ];
			p = p.substr( 0, 1 ).toUpperCase() + p.substr( 1, p.length - 1 );
			// Tablet type is special
			if( p == 'Tablet' )
			{
				Workspace.tabletMode = true;
				document.body.classList.add( 'InputParadigm' + p );
			}
			else
			{
				Workspace.tabletMode = false;
				let classes = ( document.body.classList + '' ).split( ' ' );
				let out = [];
				for( let a = 0; a < classes.length; a++ )
				{
					if( classes[a].indexOf( 'InputParadigm' ) < 0 )
						out.push( classes[ a ] );
				}
				document.body.classList = out.join( ' ' );
			}
		}
		
		let iconeffect = [ 'shadow', 'box' ];
		for( let c in iconeffect )
		{
			let uf = iconeffect[c].charAt( 0 ).toUpperCase() + iconeffect[c].substr( 1, iconeffect[c].length - 1 );
			if( this.themeData[ 'iconEffectText' ] == iconeffect[c] )
				document.body.classList.add( uf );
			else document.body.classList.remove( uf );
		}
		
		if( typeof( this.themeData[ 'buttonSchemeText' ] ) != 'undefined' )
		{
			if( this.themeData[ 'buttonSchemeText' ] == 'windows' )
			{
				document.body.classList.add( 'MSW' );
				document.body.classList.remove( 'AMIW' );
			}
			else if( this.themeData[ 'buttonSchemeText' ] == 'amiga' )
			{
				document.body.classList.add( 'AMIW' );
				document.body.classList.remove( 'MSW' );
			}
			else
			{ 
				document.body.classList.remove( 'MSW' );
				document.body.classList.remove( 'AMIW' );
			}
		}
		
		let str = '';
		
		for( let a in this.themeData )
		{
			if( !this.themeData[a] ) continue;
			let v = this.themeData[a];
			
			switch( a )
			{
				case 'colorTitleActive':
					str += `
html > body .View.Active > .Title,
html > body .View.Active > .LeftBar,
html > body .View.Active > .RightBar,
html > body .View.Active > .BottomBar
{
	background-color: ${v};
}
`;
					break;
				case 'colorButtonBackground':
					str += `
html > body .Button, html > body button,
html > body #DockWindowList .Task.Active, html > body #Statusbar .Task.Active
{
	background-color: ${v};
}
`;
					break;
				case 'colorWindowBackground':
					str += `
html > body, html body .View > .Content
{
	background-color: ${v};
}
`;
					break;
				case 'colorWindowText':
					str += `
html > body, html body .View > .Content, html > body .Tab
{
	color: ${v};
}
`;
					break;
				case 'colorFileToolbarBackground':
					str += `
html > body .View > .DirectoryToolbar
{
	background-color: ${v};
}
`;
					break;
				case 'colorFileToolbarText':
					str += `
html > body .View > .DirectoryToolbar button:before, 
html > body .View > .DirectoryToolbar button:after
{
	color: ${v};
}
`;
					break;
				case 'colorFileIconText':
					str += `
html > body .File a
{
	color: ${v};
}
`;
					break;
				case 'colorScrollBackground':
					str += `
body .View.Active ::-webkit-scrollbar,
body .View.Active.IconWindow ::-webkit-scrollbar-track
{
	background-color: ${v};
}
`;
					break;
				case 'colorScrollButton':
					str += `
html body .View.Active.Scrolling > .Resize,
body .View.Active ::-webkit-scrollbar-thumb,
body .View.Active.IconWindow ::-webkit-scrollbar-thumb
{
	background-color: ${v} !important;
}
`;
					break;
			}
		}
		this.themeStyleElement.innerHTML = str;
	},
	refreshTheme: function( themeName, update, themeConfig = false, initpass )
	{
		let self = this;

		// Don't reupdate when it's already loaded
		let themeHash = themeConfig ? MD5( JSON.stringify( themeConfig ) ) : false;
		let themeChanged = false;
		if( themeHash && themeHash != MD5( JSON.stringify( this.themeData ) ) )
			themeChanged = true;
		if( !themeChanged && Workspace.theme && Workspace.theme == themeName )
		{
			document.body.classList.remove( 'ThemeRefreshing' );
			Workspace.setLoading( false );
			return;
		}
		
		// Block while working
		if( this.refreshThemeBlock ) return;
		this.refreshThemeBlock = true;
		
		// Only on force or first time
		if( this.themeRefreshed && !update )
		{
			document.body.classList.remove( 'ThemeRefreshing' );
			Workspace.setLoading( false );
			this.refreshThemeBlock = false;
			return;
		}

		if( !initpass )
		{
			document.body.classList.add( 'ThemeRefreshing' );
			this.refreshThemeBlock = false;
			return setTimeout( function()
			{
				Workspace.refreshTheme( themeName, update, themeConfig, true );
			}, 150 );
		}

		// Check url var
		if( GetUrlVar( 'fullscreenapp' ) )
		{
			document.body.classList.add( 'FullscreenApp' );
		}

		if( Workspace.themeOverride ) themeName = Workspace.themeOverride.toLowerCase();

		// Setting loading
		Workspace.setLoading( true );

		if( !themeName ) themeName = Workspace.theme ? Workspace.theme : 'friendup13';
		if( themeName == 'friendup' ) themeName = 'friendup13';
		
		themeName = themeName.toLowerCase();
		
		// Don't load this twice
		if( Workspace.theme == themeName && !themeChanged )
		{
			document.body.classList.remove( 'ThemeRefreshing' );
			Workspace.setLoading( false );
			this.refreshThemeBlock = false;
			return;
		}
		
		Workspace.theme = themeName;
		
		// Done blocking
		this.refreshThemeBlock = false;
		
		function initThemeSettingsJson( num = 0 )
		{
		    let m = new File( 'System:../themes/' + themeName + '/settings.json' );
		    m.onLoad = function( rdat )
		    {	
			    // Add resources for theme settings --------------------------------
			    try
			    {
			        rdat = JSON.parse( rdat );
		        }
		        catch( e )
		        {
		            rdat = false;
		            if( num == 0 )
    		            return initThemeSettingsJson( num + 1 );
		            return;
		        }
			    // Done resources theme settings -----------------------------------
			    
			    // Support theme data expansion directly from theme settings
			    if( !Workspace.themeData )
			    {
			        Workspace.themeData = [];
			    }
			    
			    // Use sidebar engine
			    if( rdat && rdat.jsExtensionEngine && rdat.jsExtensionEngine == 'custom' )
			    {
			        // Add loading flag here - the extension needs to unset them
			        document.body.classList.add( 'SidebarLoading' );
	        
			        if( rdat.jsExtensionSrc )
			        {
			        	if( !Workspace.dashboard )
			        	{
			        	    if( !Workspace.dashboardLoading )
			        	    {
			            	    let j = document.createElement( 'script' );
					            j.src = rdat.jsExtensionSrc;
					            j.onload = function( e )
					            {
					                if( !Workspace.dashboard )
					                {
					                    Workspace.dashboard = new SidebarEngine();
					                    Workspace.dashboardLoading = null;
					                    //console.log( '[Login phase] Initialized sidebar engine!' );
					                }
					            }
					            Workspace.dashboardLoading = j;
					        
					            // Append sidebar
					            function loadScript()
					            {
					                if( j )
					                {
            					        document.body.appendChild( j );
            					        j = null;
            					    }
					            }
					            // Add locale optionally
					            if( rdat.localeSrc )
					            {
					                loadScript = function()
					                {
					                    if( rdat.localeSrc.substr( -1, 1 ) != '/' )
					                        rdat.localeSrc += '/';
					                    i18nAddPath( rdat.localeSrc + self.locale + '.lang', function()
					                    {
					                        if( j )
					                        {
            					                document.body.appendChild( j );
            					                j = null;
            					            }
					                    } );
					                }
					            }
					            loadScript();
					        }
					        Workspace.themeData[ 'sidebarEngine' ] = true;
					        Workspace.themeDataSet = true;
					    }
			        }
			    }
			    
			    Workspace.themeRefreshed = true;
			    
			    Workspace.refreshUserSettings( function() 
			    {
				    //console.log( '[Login phase] Done refreshing user settings.' );
				    CheckScreenTitle();

				    let h = document.getElementsByTagName( 'head' );
				    if( h )
				    {
					    h = h[0];

					    // Remove old one
					    let l = h.getElementsByTagName( 'link' );
					    let l2 = document.body.getElementsByTagName( 'link' );
					    function stripOld( test )
					    {
						    for( let b = 0; b < l.length; b++ )
						    {
							    if( l[b].href == test ) continue;
							    if( l[b].parentNode != h ) continue;
							    l[b].href = '';
							    l[b].parentNode.removeChild( l[b] );
						    }
						    // Remove scrollbars
						    for( let b = 0; b < l2.length; b++ )
						    {
							    if( l2[b].href == test ) continue;
							    if( l2[b].href.indexOf( '/scrollbars.css' ) > 0 )
							    {
								    l2[b].href = '';
								    l2[b].parentNode.removeChild( l2[b] );
							    }
						    }
					    }
					    

					    // New css!
					    let styles = document.createElement( 'link' );
					    styles.rel = 'stylesheet';
					    styles.type = 'text/css';
					    styles.onload = function()
					    {
						    // Remove old stuff
						    stripOld( this.href );
						    
						    document.body.classList.add( 'ThemeLoaded' );
						    //console.log( '[Login phase] Theme loaded!!' );
						    setTimeout( function()
						    {
						        if( !document.body.classList.contains( 'SidebarLoading' ) )
        							document.body.classList.remove( 'ThemeRefreshing' );
						    }, 50 );

					    
						    // Set right classes
							Workspace.setLoading( false );
						    
						    document.title = Friend.windowBaseString;
						    
						    // Remove the overlay when inside
						    if( Workspace.screen )
							    Workspace.screen.hideOverlay();
					    
						    // We are ready!
						    Workspace.readyToRun = true;
						    Workspace.onReady();
						    Workspace.updateViewState( 'active' );
					    
						    // Flush theme info
						    themeInfo.loaded = false;
						    
						    // Make sure screen dimensions are read
						    _kresize();
					    }

					    AddCSSByUrl( '/themes/friendup13/scrollbars.css' );
						styles.href = '/themes/friendup13/theme.css';

					    // Add new one
					    h.appendChild( styles );
					    
					    // Constrain all windows
					    ConstrainWindows();
				    }

				    // Update running applications
				    let taskIframes = ge( 'Tasks' ).getElementsByClassName( 'AppSandbox' );
				    for( let a = 0; a < taskIframes.length; a++ )
				    {
					    let msg = {
						    type: 'system',
						    command: 'refreshtheme',
						    theme: themeName
					    };
					    if( themeConfig )
						    msg.themeData = themeConfig;
					    taskIframes[a].ifr.contentWindow.postMessage( JSON.stringify( msg ), '*' );
				    }
		    
				    // Flush theme info
				    themeInfo.loaded = false;
			    } );
		    }
		    m.load();
	    }
	    initThemeSettingsJson();
	},
	getWebSocketsState: function()
	{
		if( Workspace.readyToRun )
		{
			let res = ( Workspace.conn && Workspace.conn.ws && Workspace.conn.ws.ready ) ? 'open' : 'false';
			return res;
		}
		return 'false';
	},
	initWebSocket: function( callback )
	{
		let self = this;
		function closeConn()
		{
			// Clean up previous
			if( self.conn )
			{
				try
				{
					if( self.conn.ws )
						self.conn.ws.cleanup();
				}
				catch( ez )
				{
				    // Try to initialize a new one
					console.log( 'Conn is dead.', ez );
				}
			    delete self.conn;
			    self.conn = null;
			}
		}
	
		// We're already open or connecting
		if( Workspace.conn && Workspace.conn.ws && Workspace.conn.ws.ready ) return;
		
		if( window.Friend && Friend.User && Friend.User.State != 'online' ) 
		{
			console.log( 'Cannot initialize web socket - user is offline.' );
			closeConn();
			//Friend.User.ReLogin();
			return false;
		}
		
		if( !Workspace.sessionId && Workspace.userLevel )
		{
			return Friend.User.ReLogin();
		}
		
		// Not ready
		if( !Workspace.sessionId )
		{
			if( this.initWSTimeout )
				clearTimeout( this.initWSTimeout );
			this.initWSTimeout = setTimeout( function(){ Workspace.initWebSocket( callback ); }, 1000 );
			return this.initWSTimeout;
		}
		
		// Not needed here
		if( this.initWSTimeout )
		{
			clearTimeout( this.initWSTimeout );
			this.initWSTimeout = null;
		}
		
		let conf = {
			onstate: onState,
			onend  : onEnd
		};

        //we assume we are being proxied - set the websocket to use the same port as we do
        if( document.location.port == '')
        {
            conf.wsPort = ( document.location.protocol == 'https:' ? 443 : 80 )
            //console.log('webproxy set to be tunneled as well.');
        }
		
		// Reconnect if we already exist
		if( this.conn )
		{
			this.conn.connectWebSocket();
			console.log( '[initWebSocket] Reconnecting websocket.' );
		}
		else
		{
			if( typeof FriendConnection == 'undefined' )
			{
				return setTimeout( function(){ Workspace.initWebSocket( callback ); }, 250 );
			}
		
			this.conn = new FriendConnection( conf, 'workspace' );
			this.conn.on( 'sasid-request', handleSASRequest ); // Shared Application Session
			this.conn.on( 'server-notice', handleServerNotice );
			this.conn.on( 'server-msg', handleServerMessage );
			this.conn.on( 'refresh', function( msg )
			{
				// Do a deep refresh
				Workspace.refreshDesktop( false, true );
			} );
			this.conn.on( 'icon-change', handleIconChange );
			this.conn.on( 'filesystem-change', handleFilesystemChange );
			this.conn.on( 'notification', handleNotifications );
		}
		
		// Reference for handler
		let selfConn = this.conn;

		function onState( e )
		{	
			if( e.type == 'error' || e.type == 'close' )
			{
				console.log( '[onState] The ws closed.' );
				if( !Workspace.wsChecker )
				{
					Workspace.wsChecker = setInterval( function()
					{
						if( !Workspace.conn || !Workspace.conn.ws || !Workspace.conn.ws.ws )
						{
							//console.log( 'Looks like we do not have any websocket. Trying to create it.' );
							Workspace.initWebSocket();
						}
					}, 1600 );
				}
			}
			else if( e.type == 'ping' )
			{
				if( Friend.User )
					Friend.User.SetUserConnectionState( 'online' );
				
				if( Workspace.wsChecker )
				{
					clearInterval( Workspace.wsChecker )
					Workspace.wsChecker = null;
				}
				
				// Reattach
				if( !Workspace.conn && selfConn )
				{
					//console.log( 'Reattaching conn!' );
					Workspace.conn = selfConn;
				}
			}
			else
			{
				if( e.type == 'open' )
				{
					if( callback )
					{
						callback();
						callback = null;
					}
				}
				else if( e.type == 'connecting' )
				{
					// ... we are connecting
				}
				if( e.type != 'connecting' && e.type != 'open' )
				{
					console.log( 'Strange onState: ', e );
				}
			}
		}

		function onEnd( e )
		{
			console.log( 'Workspace.conn.onEnd', e );
		}

		function handleIconChange( e ){ console.log( 'icon-change event', e ); }
		function handleFilesystemChange( msg )
		{	
			// Prevent hitting the same thing over and over
			// Maximum two requests a second on the same path
			if( !Workspace.filesystemChangeTimeouts )
			{
				Workspace.filesystemChangeTimeouts = {};
			}
			
			// Clear cache
			if( msg && msg.devname && msg.path )
			{
				let ext4 = msg.path.substr( msg.path.length - 5, 5 );
				let ext3 = msg.path.substr( msg.path.length - 4, 4 );
				ext4 = ext4.toLowerCase();
				ext3 = ext3.toLowerCase();
				if( ext4 == '.jpeg' || ext3 == '.jpg' || ext3 == '.gif' || ext3 == '.png' )
				{
					let ic = new FileIcon();
					ic.delCache( msg.devname + ':' + msg.path );
				}
			}
			
			let t = msg.devname + ( msg.path ? msg.path : '' );
			if( Workspace.filesystemChangeTimeouts[ t ] )
			{
				clearTimeout( Workspace.filesystemChangeTimeouts[ t ] );
			}
			Workspace.filesystemChangeTimeouts[ t ] = setTimeout( function()
			{
				hcbk( msg );
			}, 250 );
			
			// Handle the actual filesystem change
			function hcbk()
			{
				if( msg.path || msg.devname )
				{
					let p = '';
					// check if path contain device
					if( msg.path.indexOf( ':' ) > 0 )
					{
						p = msg.path;
					}
					else
					{
						p = msg.devname + ':' + msg.path;
					}
					// Filename stripped!
					
					if( p.indexOf( '/' ) > 0 )
					{
						p = p.split( '/' );
						if( Trim( p[ p.length - 1 ] ) != '' )
							p[ p.length - 1 ] = '';
						p = p.join( '/' );
					}
					else
					{
						p = p.split( ':' );
						p = p[0] + ':';
					}
				
					if( Workspace.appFilesystemEvents )
					{
						// Check if we need to handle events for apps
						if( Workspace.appFilesystemEvents[ 'filesystem-change' ] )
						{
							let evList = Workspace.appFilesystemEvents[ 'filesystem-change' ];
							let outEvents = [];
							for( let a = 0; a < evList.length; a++ )
							{
								let found = false;
								if( evList[a].applicationId )
								{
									found = evList[a];
									let app = findApplication( evList[a].applicationId );
									if( app )
									{
										if( evList[a].viewId && app.windows[ evList[a].viewId ] )
										{
											app.windows[ evList[a].viewId ].sendMessage( {
												command: 'callback', type: 'callback', callback: evList[a].callback, path: msg.devname + ':' + msg.path
											} );
										}
										else
										{
											app.sendMessage( { 
												command: 'callback', type: 'callback', callback: evList[a].callback, path: msg.devname + ':' + msg.path
											} );
										}
									}
								}
								// App doesn't exist, flush event
								if( found )
								{
									outEvents.push( found );
								}
							}
							// Update events
							Workspace.appFilesystemEvents[ 'filesystem-change' ] = outEvents;
						}
					}
					
					return;
				}
				//console.log( '[handleFilesystemChange] Uncaught filesystem change: ', msg );
			}
		}
		
		// Handle incoming push notifications and server notifications ---------
		function handleNotifications( nmsg )
		{
			let messageRead = trash = false;
			
			//console.log( 'Handling notifications: ', nmsg );
			
			if( isMobile )
			{
				// TODO: Determine if this will ever occur. If the viewstate isn't active
				//       we will obviously not be running this Javascript?
				if( window.friendApp && Workspace.currentViewState != 'active' )
				{
					// Cancel push notification on the server
					let clickCallback = function()
					{
						// Tell that it was user initiated
						nmsg.notificationData.clicked = true;
						handleNotificationData( nmsg );
					}
					
					// Revert to push notifications on the OS side
					Notify( { title: nmsg.title, text: nmsg.text, notificationId: nmsg.notificationData.id }, null, clickCallback );
					return;
				}
			}
			
			handleNotificationData( nmsg );
			
			function handleNotificationData( msg )
			{
				// Check if we have notification data
				if( msg.notificationData )
				{
					/*if( !Workspace.debugNotificationLog )
					{
						Workspace.debugNotificationLog = {};
					}
					if( Workspace.debugNotificationLog[ msg.id ] )
					{
						Workspace.debugNotificationLog[ msg.id ]++;
						return;
					}
					else
					{
						Workspace.debugNotificationLog[ msg.id ] = 1;
					}*/
					
					// Application notification
					if( msg.notificationData.application )
					{
						// Function to set the notification as read...
						function notificationRead()
						{
							//console.log( 'Foo bar: ', msg.notificationData );
							if( Workspace.currentViewState == 'active' && !Workspace.sleeping )
							{
								if( trash )
									clearTimeout( trash );
								messageRead = true;
								let l = new Library( 'system.library' );
								l.onExecuted = function( e, d ){
									//console.log( 'Did we tell fc that we read the notification?', e, d );
								};
								l.execute( 'mobile/updatenotification', { 
									notifid: msg.notificationData.id, 
									action: 1, 
									pawel: 3
								} );
							}
						}
					
						let appName = msg.notificationData.application;
					
						// Find application
						let apps = Workspace.applications;
						for( let a = 0; a < apps.length; a++ )
						{
							// Found the application
							if( apps[a].applicationName == appName )
							{
								// We read the notification!
								notificationRead();

								// Post!
								let amsg = {
									type: 'system',
									method: 'notification',
									callback: false,
									data: msg.notificationData
								};
								apps[ a ].contentWindow.postMessage( JSON.stringify( amsg ), '*' );
								
								mobileDebug( ' Send to appk: ' + JSON.stringify( amsg ), true );
								return;
							}
						}
					
						//console.log( 'Could not find application ' + appName );
					
						// Application not found? Start it!
						// Send message to app once it has started...
						function appMessage()
						{
							let app = false;
							for( let a = 0; a < apps.length; a++ )
							{
								// Found the application
								if( apps[ a ].applicationName == appName )
								{
									app = apps[ a ];
									break;
								}
							}
					
							// No application? Alert the user
							// TODO: Localize response!
							if( !app )
							{
								Notify( { title: i18n( 'i18n_could_not_find_application' ), text: i18n( 'i18n_could_not_find_app_desc' ) } );
								return;
							}
					
							let amsg = {
								type: 'system',
								method: 'notification',
								callback: addWrapperCallback( notificationRead ),
								data: msg.notificationData
							};
							app.contentWindow.postMessage( JSON.stringify( amsg ), '*' );
					
							mobileDebug( ' Send to appz: ' + JSON.stringify( amsg ), true );
							
							// Delete wrapper callback if it isn't executed within 1 second
							setTimeout( function()
							{
								if( !messageRead )
								{
									let trash = getWrapperCallback( amsg.callback );
									delete trash;
								}
							}, 1000 );
						}
						
						// TODO: If we are here, generate a clickable Workspace notification
						if( msg.notificationData.clicked )
						{
							mobileDebug( ' Startappz: ' + appName, true );
							Friend.startupApps[ appName ] = true;
							ExecuteApplication( appName, '', appMessage );
						}
						else
						{
							let t_title = appName + ' - ' + msg.notificationData.title;
							let t_txt = msg.notificationData.content;
							Notify( { title: t_title, text: t_txt, notificationId: msg.notificationData.id }, false, clickCallback );
							function clickCallback()
							{
								msg.notificationData.clicked = true;
								mobileDebug( ' Startappz: ' + appName, true );
								Friend.startupApps[ appName ] = true;
								ExecuteApplication( appName, '', appMessage );
							}
						}
					}
				}
			}
		}
	},
	updateViewState: function( newState )
	{
		let self = this;

		// Don't update if not changed
		if( this.currentViewState == newState )
		{
			// Starts sleep timeout again (five minutes without activity sleep)
			this.sleepTimeout();
			return;
		}
		
		if( window.Module && !Workspace.sessionId )
		{
			if( this.updateViewStateTM )
				return;
			this.updateViewStateTM = setTimeout( function(){ 
				Workspace.updateViewState( newState );
				self.updateViewStateTM = null;
			}, 250 );
			if( Workspace.loginCall )
			{
				Workspace.loginCall.destroy();
				Workspace.loginCall = null;
			}
			Friend.User.ReLogin();
			return; 
		}
		
		if( newState == 'active' )
		{
			Workspace.nudgeWorkspacesWidget();
			
			document.body.classList.add( 'ViewStateActive' );

			// Tell all windows
			if( window.friendApp )
			{
				let appsNotified = {};
				for( let a in movableWindows )
				{
					let win = movableWindows[ a ];
					if( win.applicationId )
					{
						// Notify window
						win.windowObject.sendMessage( {
							command: 'notify',
							method: 'wakeup',
							value: 'active'
						} );
						// Notify application too
						if( !appsNotified[ win.applicationId ] )
						{
							for( let b = 0; b < Workspace.applications.length; b++ )
							{
								if( Workspace.applications[ b ].applicationId == win.applicationId )
								{
									Workspace.applications[ b ].sendMessage( {
										command: 'notify',
										method: 'wakeup',
										value: 'active'
									} );
									appsNotified[ win.applicationId ] = true;
									break;
								}
							}
						}
					}
				}
			}
			
			// IMPORTANT:
			// Sleep in 5 minutes
			if( this.sleepingTimeout )
				clearTimeout( this.sleepingTimeout );
			Workspace.sleeping = false;
			Workspace.sleepingTimeout = null;
		}
		else
		{
			document.body.classList.remove( 'ViewStateActive' );
			document.body.classList.remove( 'Activating' );
			
			if( !Workspace.conn || !Workspace.conn.ws )
			{
				Workspace.initWebSocket();
			}
		}
		this.sleepTimeout();
		this.currentViewState = newState;
	},
	sleepTimeout: function()
	{
		// IMPORTANT: Only for desktops!
		// Sleep in 5 minutes
		if( !window.friendApp )
		{
			if( this.sleepingTimeout )
				return;
			this.sleepingTimeout = setTimeout( function()
			{
				Workspace.sleeping = true;
				Workspace.sleepingTimeout = null;
				Workspace.updateViewState( 'inactive' );
			}, 1000 * 60 * 5 );
		}
	}
};
