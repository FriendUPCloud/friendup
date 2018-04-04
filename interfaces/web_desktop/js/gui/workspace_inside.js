var WorkspaceInside = {
	wallpaperLoaded: false,
	// We only initialize once
	insideInitialized: false,
	// Switch to workspace
	switchWorkspace: function( num )
	{
		if( num > globalConfig.workspacecount ) return;
		if( ge( 'InputGrabber' ) )
			ge( 'InputGrabber' ).focus();
		var eles = ge( 'DoorsScreen' ).getElementsByClassName( 'VirtualWorkspaces' );
		if( eles.length )
		{
			var b = 0;
			var wsp = eles[0].childNodes;
			for( var a = 0; a < wsp.length; a++ )
			{
				if( !wsp[a].classList ) continue;
				if( wsp[a].classList.contains( 'Workspace' ) )
				{
					if( b == num )
					{
						wsp[a].onmousedown();
						if( ge( 'InputGrabber' ) )
							ge( 'InputGrabber' ).blur();
						return;
					}
					b++; 
				}
			}
		}
		if( ge( 'InputGrabber' ) )
			ge( 'InputGrabber' ).blur();
	},
	// Clear all wallpapers
	clearWorkspaceWallpapers: function()
	{
		if( !this.workspaceWallpapers ) return;
		for( var a = 0; a < this.workspaceWallpapers.length; a++ )
		{
			this.workspaceWallpapers[a].parentNode.removeChild( this.workspaceWallpapers[a] );
		}
		this.workspaceWallpapers = [];
	},
	// Check workspace wallpapers
	checkWorkspaceWallpapers: function( loaded )
	{
		if( globalConfig.workspacecount <= 1 ) return;

		if( !Workspace.wallpaperLoaded && !loaded ) return;
		
		// Check if we already have workspace wallpapers
		var o = []; // <- result after cleanup
		var co = [];
		var m = globalConfig.workspacecount;
		var scr = ge( 'DoorsScreen' ).screenObject;
		var url = Workspace.wallpaperImage;
		if( !url || !url.indexOf ) url = 'none';
		else
		{
			if( url.indexOf( ':' ) > 0 && url.indexOf( 'http' ) != 0 )
				url = getImageUrl( url );
		}
		
		var workspacePositions = [];
		var maxW = Workspace.screen.getMaxViewWidth();
		for( var a = 0; a < globalConfig.workspacecount; a++ )
		{
			workspacePositions.push( a * maxW );
		}
		for( var a in movableWindows )
		{
			var wo = movableWindows[a].windowObject;
			movableWindows[a].viewContainer.style.left = workspacePositions[ wo.workspace ] + 'px';
		}
		
		var image = url == 'none' ? url : ( 'url(' + url + ')' );
		for( var a = 0; a < m; a++ )
		{
			// Check if we already have wallpapers
			if( this.workspaceWallpapers && a < this.workspaceWallpapers.length )
			{
				// Reduction of superflous workspaces
				if( a >= globalConfig.workspacecount )
				{
					this.workspaceWallpapers[a].parentNode.removeChild(
						this.workspaceWallpapers[a]
					);
				}
				else o.push( this.workspaceWallpapers[a] );
				// Update background image
				this.workspaceWallpapers[a].style.backgroundImage = image;
				this.workspaceWallpapers[a].style.left = scr.div.offsetWidth * a + 'px';
				this.workspaceWallpapers[a].style.width = scr.div.offsetWidth + 'px';
				this.workspaceWallpapers[a].style.height = scr.contentDiv.offsetHeight + 'px';
			}
			// New entry
			else
			{
				var d = document.createElement( 'div' );
				d.className = 'WorkspaceWallpaper';
				d.style.left = scr.div.offsetWidth * a + 'px';
				d.style.width = scr.div.offsetWidth + 'px';
				d.style.height = scr.contentDiv.offsetHeight + 'px';
				d.style.backgroundImage = image;
				scr.contentDiv.appendChild( d );
				o.push( d );
			}
		}
		// Overwrite array
		this.workspaceWallpapers = o;
		
		if( loaded )
			Workspace.wallpaperLoaded = true;
	},
	// Initialize virtual workspaces
	initWorkspaces: function()
	{
		if( globalConfig.workspacesInitialized )
		{
			globalConfig.workspacesInitialized = false;
			var el = ge( 'DoorsScreen' ).getElementsByClassName( 'VirtualWorkspaces' );
			if( el.length )
			{
				el[0].parentNode.removeChild( el[0] );
			}
		}
		if( !globalConfig.workspacesInitialized )
		{
			if( !this.screen ) return;
			
			this.screen.setFlag( 'vcolumns', globalConfig.workspacecount );
			if( globalConfig.workspacecount > 1 )
			{
				globalConfig.workspacesInitialized = true;
				if( typeof( globalConfig.workspaceCurrent ) == 'undefined' )
					globalConfig.workspaceCurrent = 0;
				ge( 'DoorsScreen' ).screenObject.contentDiv.style.transition = 'left 0.25s';
				if( !ge( 'DoorsScreen' ).screenObject.contentDiv.style.left )
					ge( 'DoorsScreen' ).screenObject.contentDiv.style.left = '0';
				var wp = document.createElement( 'wp' );
				var d = document.createElement( 'div' )
				d.className = 'VirtualWorkspaces';
				for( var a = 0; a < globalConfig.workspacecount; a++ )
				{
					var w = document.createElement( 'div' );
					w.className = 'Workspace';
					if( a == globalConfig.workspaceCurrent ) w.className += ' Active';
					w.innerHTML = '<span>' + ( a + 1 ) + '</span>';
					w.ind = a;
					w.onmousedown = function( e )
					{
						var cnt = 0;
						for( var z = 0; z < d.childNodes.length; z++ )
						{
							if( d.childNodes[z].className && d.childNodes[z].classList.contains( 'Workspace' ) )
							{
								if( d.childNodes[z] == this )
								{
									globalConfig.workspaceCurrent = cnt;
									d.childNodes[z].classList.add( 'Active' );
								}
								else d.childNodes[z].classList.remove( 'Active' );
								cnt++;
							}
						}
						ge( 'DoorsScreen' ).screenObject.contentDiv.style.left = '-' + 100 * this.ind + '%';
						_DeactivateWindows();
						// Activate next window on next screen
						for( var c in movableWindows )
						{
							if( !movableWindows[c].windowObject ) continue;
							if( movableWindows[c].windowObject.workspace == this.ind )
							{
								if( movableWindows[c].getAttribute( 'minimized' ) != 'minimized' )
								{
									_ActivateWindow( movableWindows[c] );
									break;
								}
							}
						}
						return cancelBubble( e );
					}
					d.appendChild( w );
				}
				ge( 'DoorsScreen' ).getElementsByClassName( 'Left' )[0].appendChild( d );
				
				Workspace.checkWorkspaceWallpapers();
			}
		}
		// Refresh our dynamic classes now..
		RefreshDynamicClasses();
	},
	// Reposition and size
	repositionWorkspaceWallpapers: function()
	{
		var bbsize = 'auto ' + window.innerHeight + 'px';
		var eled = this.screen.div.getElementsByClassName( 'ScreenContent' );
		if( eled.length )
			eled[0].style.backgroundSize = 'cover';
		if( globalConfig.workspacecount > 1 )
		{
			var eles = eled[0].getElementsByClassName( 'WorkspaceWallpaper' );
			var pos = 0;
			var oh = eled[0].offsetHeight + 'px';
			var own = ge( 'DoorsScreen' ).offsetWidth;
			var ow = own + 'px';
			for( var a = 0; a < eles.length; a++ )
			{
				eles[a].style.left = pos + 'px';
				eles[a].style.width = ow;
				eles[a].style.height = oh;
				pos += own;
			}
		}
	},
	// Update position
	refreshWorkspaces: function()
	{
		// Check if something changed
		if( typeof( globalConfig.workspacepcount ) != 'undefined' )
		{
			if( globalConfig.workspacepcount != globalConfig.workspacecount )
			{
				if( globalConfig.workspaceCurrent > globalConfig.workspacecount - 1 )
				{
					Workspace.switchWorkspace( globalConfig.workspacecount - 1 );
				}
				this.clearWorkspaceWallpapers();
				this.initWorkspaces();
			}
		}
		globalConfig.workspacepcount = globalConfig.workspacecount;
	},
	nudgeWorkspacesWidget: function()
	{
		// Calculate correct position
		if( globalConfig.workspacecount > 1 && ge( 'DoorsScreen' ) )
		{
			var left = ge( 'DoorsScreen' ).getElementsByClassName( 'Left' )[0];
			var righ = ge( 'DoorsScreen' ).getElementsByClassName( 'Right' )[0];
			var swit = righ.getElementsByClassName( 'ScreenList' )[0];
			var extr = left.getElementsByClassName( 'Extra' )[0];
			var work = ge( 'DoorsScreen' ).getElementsByClassName( 'VirtualWorkspaces' )[0];
			if( work )
			{
				work.style.right = extr.offsetWidth + swit.offsetWidth + 'px';
			}
		}
	},
	initWebSocket: function()
	{
		if( Workspace.conn ) return;
		
		if( Workspace.reloginInProgress )
			return;
		
		if( !Workspace.sessionId )
		{
			return Workspace.relogin();
		}

		var conf = {
			onstate: onState,
			onend  : onEnd,
		};
		
		this.conn = new FriendConnection( conf );
		this.conn.on( 'sasid-request', handleSASRequest ); // Shared Application Session
		this.conn.on( 'server-notice', handleServerNotice );
		this.conn.on( 'server-msg', handleServerMessage );
		this.conn.on( 'refresh', function( e )
		{
			Workspace.refreshDesktop();
		} );
		this.conn.on( 'icon-change', handleIconChange );
		this.conn.on( 'filesystem-change', handleFilesystemChange );

		function onState( e )
		{
			//console.log( 'Worspace.conn.onState', e );
			if( e.type == 'error' || e.type == 'close' )
			{
				if( !Workspace.httpCheckConnectionInterval )
				{
					Workspace.httpCheckConnectionInterval = setInterval('Workspace.checkServerConnectionHTTP()', 7000 );
					Workspace.websocketsOffline = true;
				}
			}
			else if( e.type == 'ping' )
			{
				//if we get a ping we have a websocket.... no need to do the http server check
				clearInterval( Workspace.httpCheckConnectionInterval );
				Workspace.httpCheckConnectionInterval = false;
				Workspace.websocketsOffline = false;

				if( Workspace.screen ) Workspace.screen.hideOfflineMessage();
				document.body.classList.remove( 'Offline' );
				Workspace.workspaceIsDisconnected = false;
			}
			else
			{
				if( e.type != 'connecting' && e.type != 'open' ) console.log( e );
			}
		}

		function onEnd( e )
		{
			console.log( 'Workspace.conn.onEnd', e );
			Workspace.websocketsOffline = true;
		}

		function handleIconChange( e ){ console.log( 'icon-change event', e ); }
		function handleFilesystemChange( msg )
		{
			// if we get the same message within 5s we just ignore it.
			if(
				Workspace.lastfileSystemChangeMessage
				&& Workspace.lastfileSystemChangeMessage.path == msg.path
				&& Workspace.lastfileSystemChangeMessage.devname == msg.devname
				&& Workspace.lastfileSystemChangeMessage.arrived + 5000 > Date.now()
			) return;

			Workspace.lastfileSystemChangeMessage = JSON.parse(JSON.stringify(msg));
			Workspace.lastfileSystemChangeMessage.arrived = Date.now();


			if( msg.path || msg.devname )
			{
				// Filename stripped!
				var p = msg.devname + ':' + msg.path;
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
				//console.log( '[handleFilesystemChange] Updating path: ' + p );
				Workspace.refreshWindowByPath( p );
				if( p.substr( p.length - 1, 1 ) == ':' )
				{
					//console.log( '[handleFilesystemChange] Refreshing desktop.' );
					Workspace.refreshDesktop();
				}
				return;
			}
			console.log( '[handleFilesystemChange] Uncaught filesystem change: ', msg );
		}
	},
	checkFriendNetwork: function()
	{
		var m = new Module('system');
		m.onExecuted = function( e,d )
		{
			if( e == 'ok' && parseInt( d ) == 1)
			{
				console.log('init friend network');
				// connect to FriendNetwork
				if( Workspace.sessionId && window.FriendNetwork )
				{
					var host = document.location.hostname + ':6514';
					if ( 'http:' === document.location.protocol )
						host = 'ws://' + host;
					else
						host = 'wss://' + host;

					var hostMeta =
					{
						name        : Workspace.loginUsername,
						description : Workspace.loginUsername + "'s machine",
						apps        : [],
						imagePath   : 'friend://path.to/image?', // ( not what a real path// looks like, probably? )
					};
					console.log( 'Connecting to FriendNetwork.', hostMeta );
					window.FriendNetwork.init( host, Workspace.sessionId, hostMeta );
				}
			}
			else
			{
				console.log( 'friend network not enabled' );
			}
		}
		m.execute( 'checkfriendnetwork' );
	},
	terminateSession: function( sess, dev, e )
	{
		Confirm( i18n( 'i18n_are_you_sure' ), i18n( 'i18n_sure_you_want_terminate_session' ), function( data )
		{
			var f = new Library( 'system.library' );
			f.onExecuted = function( res )
			{
				Workspace.refreshExtraWidgetContents();
			}
			f.execute( 'user/killsession', { sessid: sess, deviceid: dev, username: Workspace.loginUsername } );
		} );
		return cancelBubble( e );
	},
	refreshExtraWidgetContents: function()
	{
		var mo = new Library( 'system.library' );
		mo.onExecuted = function( rc, sessionList )
		{
			var sessions = [];
			if( rc == 'ok' )
			{
				var m = Workspace.widget ? Workspace.widget.target : ge( 'DoorsScreen' );

				if( m == ge( 'DoorsScreen' ) )
					m = ge( 'DoorsScreen' ).screenTitle.getElementsByClassName( 'Extra' )[0];

				if( !m )
				{
					//console.log( 'Can not find widget!' );
					return;
				}

				if( typeof( sessionList ) == 'string' )
					sessionList = JSON.parse( sessionList );

				if( sessionList )
				{
					try
					{
						var exists = [];
						for( var b = 0; b < sessionList.length; b++ )
						{
							if( sessionList[b].sessionid == Workspace.sessionId ) continue;
							var sn = sessionList[b].deviceidentity.split( '_' );
							var svn = sn[2] + ' ';

							switch( sn[0] )
							{
								case 'touch':
									svn += 'touch device';
									break;
								case 'wimp':
									svn += 'computer';
									break;
							}
							switch( sn[1] )
							{
								case 'iphone':
									svn += '(iPhone)';
									break;
								case 'android':
									svn += '(Android device)';
									break;
							}
							var num = 0;
							var found = false;
							for( var c = 0; c < exists.length; c++ )
							{
								if( exists[c] == svn )
								{
									num++;
									found = true;
								}
							}
							exists.push( svn );
							if( found ) svn += ' ' + (num+1) + '.';
							sessions.push( '<p class="Relative FullWidth Ellipsis IconSmall fa-close MousePointer" onclick="Workspace.terminateSession(\'' +
								sessionList[b].sessionid + '\', \'' + sessionList[b].deviceidentity + '\');">&nbsp;' + svn + '</p>' );
						}
					}
					catch( e )
					{
					}
				}
			}

			var closeBtn = '<div class="HRow"><p class="Layout"><button type="button" class="FloatRight Button fa-close IconSmall">' + i18n( 'i18n_close' ) + '</button></p></div>';

			var d = '<hr class="Divider"/>\
			<div class="Padding"><p class="Layout"><strong>' + i18n( 'i18n_active_session_list' ) + ':</strong></p>\
			' + ( sessions.length > 0 ? sessions.join( '' ) : '<ul><li>' + i18n( 'i18n_no_other_sessions_available' ) + '.</li></ul>' ) + '\
			</div>\
			';

			var wid = Workspace.widget ? Workspace.widget : m.widget;
			wid.showing = true;

			if( !wid.initialized )
			{
				wid.initialized = true;

				var calendar = new Calendar( wid.dom );
				wid.dom.id = 'CalendarWidget';
				Workspace.calendarWidget = wid;

				var newBtn = calendar.createButton( 'fa-calendar-plus-o' );
				newBtn.onclick = function()
				{
					if( calendar.eventWin ) return;
					var date = calendar.date.getFullYear() + '-' + ( calendar.date.getMonth() + 1 ) + '-' + calendar.date.getDate();
					var dateForm = date.split( '-' );
					dateForm = dateForm[0] + '-' + StrPad( dateForm[1], 2, '0' ) + '-' + StrPad( dateForm[2], 2, '0' );
					calendar.eventWin = new View( {
						title: i18n( 'i18n_event_overview' ) + ' ' + dateForm,
						width: 500,
						height: 405
					} );
					calendar.eventWin.onClose = function()
					{
						calendar.eventWin = false;
					}

					var f1 = new File( 'System:templates/calendar_event_add.html' );
					f1.replacements = { date: dateForm };
					f1.i18n();
					f1.onLoad = function( data1 )
					{
						calendar.eventWin.setContent( data1 );
					}
					f1.load();

					// Just close the widget
					if( !window.isMobile && m && wid )
						wid.hide();
				}
				calendar.addButton( newBtn );

				var geBtn = calendar.createButton( 'fa-gear' );
				geBtn.onclick = function()
				{
					ExecuteApplication( 'Calendar' );
				}
				calendar.addButton( geBtn );

				// Add events to calendar!
				calendar.eventWin = false;
				calendar.onSelectDay = function( date )
				{
					calendar.date.setDate( parseInt( date.split( '-' )[2] ) );
					calendar.date.setMonth( parseInt( date.split( '-' )[1] ) - 1 );
					calendar.date.setFullYear( parseInt( date.split( '-' )[0] ) );
					calendar.render();
				}

				calendar.setDate( new Date() );
				calendar.onRender = function( callback )
				{
					var md = new Module( 'system' );
					md.onExecuted = function( e, d )
					{
						try
						{
							// Update events
							var eles = JSON.parse( d );
							calendar.events = [];
							for( var a in eles )
							{
								if( !calendar.events[eles[a].Date] )
									calendar.events[eles[a].Date] = [];
								calendar.events[eles[a].Date].push( eles[a] );
							}
						}
						catch( e )
						{
						}
						calendar.render( true );
						wid.autosize();
						ge( 'DoorsScreen' ).screenObject.resize();
					}
					md.execute( 'getcalendarevents', { date: calendar.date.getFullYear() + '-' + ( calendar.date.getMonth() + 1 ) } );
				}
				calendar.render();
				Workspace.calendar = calendar;

				m.calendar = calendar;

				var sess = document.createElement( 'div' );
				sess.className = 'ActiveSessions';
				sess.innerHTML = d;
				wid.dom.appendChild( sess );
				m.sessions = sess;
			}
			else
			{
				m.calendar.render();
				m.sessions.innerHTML = d;
			}
			wid.autosize();
		}
		mo.execute( 'user/sessionlist', { username: Workspace.loginUsername } );
	},
	removeCalendarEvent: function( id )
	{
		Confirm( i18n( 'i18n_are_you_sure' ), i18n( 'i18n_evt_delete_desc' ), function( ok )
		{
			if( ok )
			{
				var m = new Module( 'system' );
				m.onExecuted = function( e )
				{
					if( e == 'ok' )
					{
						// Refresh
						if( Workspace.calendar ) Workspace.calendar.render();
						return;
					}
					Alert( i18n( 'i18n_evt_delete_failed' ), i18n( 'i18n_evt_delete_failed_desc' ) );
				}
				m.execute( 'deletecalendarevent', { id: id } );
			}
		} );
	},
	addCalendarEvent: function()
	{
		var evt = {
			Title: ge( 'calTitle' ).value,
			Description: ge( 'calDescription' ).value,
			TimeFrom: ge( 'calTimeFrom' ).value,
			TimeTo: ge( 'calTimeTo' ).value,
			Date: ge( 'calDateField' ).value
		};

		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( Workspace.calendar && Workspace.calendar.eventWin )
				Workspace.calendar.eventWin.close();
			Workspace.calendar.render();
			Notify( { title: i18n( 'i18n_evt_added' ), text: i18n( 'i18n_evt_addeddesc' ) } );
		}
		m.execute( 'addcalendarevent', { event: evt } );
	},
	loadSystemInfo: function()
	{
		var f = new window.Library( 'system.library' );
		/*
			For whatever reason, it receives data on the error argument..
		*/
		f.onExecuted = function( e, d )
		{
			var str = JSON.stringify(e);
			Workspace.systemInfo = e;
		}
		f.execute( 'admin', {command:'info'} );
	},
	// If we have stored a theme config for the current theme, use its setup
	// TODO: Move to a proper theme parser
	applyThemeConfig: function()
	{
		// No need for mobile!
		if( isMobile ) return;
		if( !this.themeData )
			return;
		
		if( this.themeStyleElement )
			this.themeStyleElement.innerHTML = '';
		else
		{
			this.themeStyleElement = document.createElement( 'style' );
			document.getElementsByTagName( 'head' )[0].appendChild( this.themeStyleElement );
		}
		
		var str = '';
		for( var a in this.themeData )
		{
			var v = this.themeData[a];
			switch( a )
			{
				case 'colorWindowActive':
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
				case 'colorButtonDefault':
					str += `
html > body .Button,
html > body button
{
	background-color: ${v};
}
`;
					break;
			}
		}
		this.themeStyleElement.innerHTML = str;
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
					else 
					{
						Workspace.wallpaperImage = '/webclient/gfx/theme/default_login_screen.jpg';
					}
				}
				// Check for theme specifics
				if( dat[ 'themedata_' + Workspace.theme ] )
				{
					Workspace.themeData = dat[ 'themedata_' + Workspace.theme ];
				}
				else
				{
					Workspace.themeData = false;
				}
				Workspace.applyThemeConfig();
				
				// Fallback
				if( !isMobile )
				{
					if( !dat.wizardrun )
					{
						if( !Workspace.WizardExecuted )
						{
							ExecuteApplication( 'FriendWizard' );
							Workspace.WizardExecuted = true;
						}
					}
				}
				
				if( !Workspace.wallpaperImage || Workspace.wallpaperImage == '""' )
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
				if( dat.scrolldesktopicons )
				{
					globalConfig.scrolldesktopicons = dat.scrolldesktopicons;
				}
				else globalConfig.scrolldesktopicons = 0;
				// Can only have workspaces on mobile
				// TODO: Implement dynamic workspace count for mobile (one workspace per app)
				if( dat.workspacecount >= 0 && !window.isMobile )
				{
					globalConfig.workspacecount = dat.workspacecount;
				}
				else
				{
					globalConfig.workspacecount = 1;
				}

				// Do the startup sequence in sequence (only once)
				if( dat.wizardrun && !isMobile )
				{
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
										if( Workspace.mainDock )
											Workspace.mainDock.closeDesklet();
									} );
								}
							}
						}
						l.func();
					}
				}

				PollTaskbar();
			}
			else
			{
				Workspace.wallpaperImage = '/webclient/gfx/theme/default_login_screen.jpg';
				Workspace.windowWallpaperImage = '';
			}
			if( callback && typeof( callback ) == 'function' ) callback();
		}
		m.execute( 'getsetting', { settings: [ 
			'avatar', 'wallpaperdoors', 'wallpaperwindows', 'language', 
			'menumode', 'startupsequence', 'navigationmode', 'windowlist', 
			'focusmode', 'hiddensystem', 'workspacecount', 
			'scrolldesktopicons', 'wizardrun', 'themedata_' + Workspace.theme
		] } );
	},
	// Called on onunload
	doLeave: function( e )
 	{
		FriendNetwork.close();
		return Workspace.leave( e );
 	},
	// Do you want to leave?
	leave: function( e )
	{
		if( Workspace.noLeaveAlert == true )
		{
			return true;
		}
		if( !Workspace.sessionId ) return true;
		RemoveDragTargets();
		if( e )
		{
			e.returnValue = i18n( 'i18n_leave_question' )
			return e.returnValue;
		}
		return;
	},
	smenu: {
		dom: false,
		tree: false,
		visible: false
	},
	// Just reset the state of the start menu
	pollStartMenu: function()
	{
		this.toggleStartMenu( false );
	},
	toggleStartMenu: function( show, e )
	{
		// Force state
		if( show === true )
		{
			this.smenu.visible = false;
		}
		// Force hide / remove
		else if( show === false )
		{
			this.smenu.visible = true;
		}

		// Hide start menu
		if( this.smenu.visible )
		{
			if( this.smenu.dom )
			{
				var sm = this.smenu;
				this.smenu.dom.className = 'DockMenu';
				this.smenu.dom.style.height = '0px';
				this.smenu.dom.style.top = '0px';
				setTimeout( function()
				{
					if( sm.dom && sm.dom.parentNode )
					{
						sm.dom.parentNode.removeChild( sm.dom );
						sm.dom = false;
						sm.visible = false;
					}
				}, 250 );
			}
			else
			{
				this.smenu.visible = false;
			}
		}
		// Build start menu
		else
		{
			// Non clean
			if( this.smenu.dom && this.smenu.dom.parentNode )
				this.smenu.dom.parentNode.removeChild( this.smenu.dom );
				
			var d = document.createElement( 'div' );
			d.className = 'DockMenu';
			Workspace.mainDock.dom.appendChild( d );
			d.onclick = function( e )
			{
				Workspace.toggleStartMenu( true );
			};
			this.smenu.dom = d;
			this.smenu.dom.style.height = '0px';
			this.smenu.dom.style.top = '0px';
			this.smenu.visible = true;

			// We don't show the menu at first, we need to build!
			var delayedBuildTime = false;
			var delayedBuildFunc = false;

			// Add menu items
			function buildMenu( path, parent )
			{
				var dr = new Door().get( path );
				dr.getIcons( false, function( data )
				{
					// Create container
					var dd = document.createElement( 'div' );
					dd.className = 'DockSubMenu';
					parent.appendChild( dd );

					// Calculate header
					var p = path.split( ':' );
					if( p.length > 1 && p[1].length )
					{
						p = p[1];
						if( p.charAt( p.length - 1 ) == '/' )
							p = p.substr( 0, p.length - 1 );
						if( p.indexOf( '/' ) > 0 )
						{
							p = p.split( '/' );
							p = p[ p.length - 1 ];
						}
						if( p.charAt( p.length - 1 ) == '/' )
							p = p.substr( 0, p.length - 1 );
						p += ':';
					}
					else
					{
						p = p[0] + ':';
					}

					var menuHeader = document.createElement( 'div' );
					menuHeader.className = 'DockMenuHeader';
					menuHeader.innerHTML = parent.classList.contains( 'DockMenu' ) && Workspace.fullName ? Workspace.fullName : p;
					dd.appendChild( menuHeader );

					var topInfo = null;
					if( !Workspace.smenu.dom.parentNode )
						return;
					
					if( Workspace.smenu.dom.parentNode.classList.contains( 'Right' ) )
					{
						topInfo = 'Right';
					}
					else if( Workspace.smenu.dom.parentNode.classList.contains( 'Left' ) )
					{
						topInfo = 'Left';
					}
					else if( Workspace.smenu.dom.parentNode.classList.contains( 'Top' ) )
					{
						topInfo = 'Top';
					}

					// Menu items
					for( var a = 0; a < data.length; a++ )
					{
						var p = data[a].Path.split( ':' )[1];
						if( p == 'Repositories/' || p == 'Modules/' || p == 'Functions/' || p == 'Libraries/' || p == 'Devices/' )
							continue;
						if( data[a].Title == 'Preferences' || data[a].Filename == 'Preferences' )
							continue;
						var s = document.createElement( 'div' );
						s.className = 'DockMenuItem MousePointer ' + data[a].Type;
						s.addEventListener( 'mouseover', function( e )
						{
							this.classList.add( 'Over' );
							var eles = this.parentNode.getElementsByClassName( 'DockMenuItem' );
							for( var z = 0; z < eles.length; z++ )
							{
								if( eles[z].parentNode != this.parentNode )
									continue;
								if( eles[z] != this )
								{
									eles[z].classList.remove( 'Over' );
								}
							}
							if( this.leaveTimeout )
								clearTimeout( this.leaveTimeout );
						} );
						s.addEventListener( 'mouseout', function( e )
						{
							var s = this;
							this.leaveTimeout = setTimeout( function()
							{
								s.classList.remove( 'Over' );
							}, 1000 );
						} );
						s.innerHTML = data[a].Title ? data[a].Title : data[a].Filename;
						// Sub menu
						if( data[a].Type == 'Directory' )
						{
							buildMenu( data[a].Path, s );
						}
						else
						{
							// Missing filename from path..
							if( data[a].Path.indexOf( data[a].Filename ) < data[a].Path.length - data[a].Filename.length )
								data[a].Path += data[a].Filename;

							// Fetch executable
							var executable = data[a].Path.split( ':' )[1].split( '/' );
							if( executable.length ) executable = executable[ executable.length - 1 ];
							else executable = executable[0];
							s.executable = executable;

							if( !executable )
							{
								s.executable = data[a].Path + data[a].Filename;
								s.filename = data[a].Filename;
							}

							// Click action
							s.onclick = function()
							{
								Workspace.toggleStartMenu( false );
								// PDFs
								if( this.filename && this.filename.substr( this.filename.length - 4, 4 ) == '.pdf' )
								{
									var v = new View( {
										title: this.filename.split( '.pdf' )[0],
										width: 700,
										height: 600,
										fullscreenenabled: true
									} );
									v.setRichContentUrl( '/webclient/templates/userdocs/' + this.filename );
								}
								else
								{
									ExecuteApplication( this.executable );
								}
							}
							// Drag fileinfo
							s.fi = data[ a ];
							s.onmousedown = function( e )
							{
								this.slideX = 0;
								this.offX = e.clientX;
								window.mouseDown = FUI_MOUSEDOWN_PICKOBJ;
							}
							s.onmousemove = function( e )
							{
								if( this.offX )
								{
									this.slidex = e.clientX - this.offX;
									if( this.slidex > 10 )
									{
										var n = CreateIcon( this.fi );
										mousePointer.pickup( n );
										this.offX = null;
										window.mouseDown = null;
									}
								}
							}
						}
						dd.appendChild( s );
					}

					if( parent.classList.contains( 'DockMenu' ) )
					{
						var s = document.createElement( 'div' );
						s.className = 'DockMenuItem MousePointer Executable';
						s.innerHTML = i18n( 'menu_run_command' );
						s.onclick = function()
						{
							Workspace.toggleStartMenu( false );
							Workspace.showLauncher();
						}
						dd.appendChild( s );
					}

					setTimeout( function()
					{
						if( delayedBuildTime )
						{
							clearTimeout( delayedBuildTime );
							delayedBuildTime = null;
						}
						delayedBuildTime = setTimeout( function(){ delayedBuildFunc(); }, 25 );

						if( parent.classList.contains( 'DockMenu' ) )
						{
							if( topInfo == 'Right' || topInfo == 'Left' )
							{
								parent.style.top = 0;
								if( topInfo == 'Right' )
								{
									parent.style.left = 0 - dd.offsetWidth + 'px';
								}
								else
								{
									parent.style.left = parent.parentNode.offsetWidth + 'px';
								}
							}
							else if( topInfo == 'Top' )
							{
								parent.style.top = parent.parentNode.offsetHeight + 'px';
							}
							else
							{
								parent.style.top = 0 - dd.offsetHeight + 'px';
							}
							parent.style.height = dd.offsetHeight + 'px';
						}
						else if( s )
						{
							if( topInfo == 'Right' || topInfo == 'Left' )
							{
								dd.style.top = '0';
								if( topInfo == 'Right' )
								{
									dd.style.left = 0 - s.offsetWidth + 'px';
								}
								else
								{
									dd.style.left = s.offsetWidth + 'px';
								}
							}
							else if( topInfo == 'Top' )
							{
								dd.style.top = s.style.top;
							}
							else
							{
								dd.style.top = s.offsetHeight - dd.offsetHeight - 1 + 'px';
							}
						}
					}, 5 );
				} );
			}

			// Delayed showing until we built the menu
			delayedBuildFunc = function()
			{
				setTimeout( function()
				{
					d.className = 'DockMenu Visible';
				}, 250 );
			}
			
			// Let's go!
			buildMenu( 'System:', d );
		}
	},
	// Reload docks and readd launchers
	reloadDocks: function()
	{
		Workspace.docksReloading = true;
		
		var c = new Module( 'dock' );
		c.onExecuted = function( cod, dat )
		{
			if( cod == 'ok' && dat )
			{
				var dm = new Module( 'dock' );
				dm.onExecuted = function( c, conf )
				{
					try
					{
						Workspace.mainDock.readConfig( JSON.parse( conf ) );
						Workspace.mainDock.clear();
					}
					catch( e )
					{
						Workspace.mainDock.clear();
					}

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

					// Clear tasks
					ge( 'Taskbar' ).innerHTML = '';
					ge( 'Taskbar' ).tasks = [];

					// Add start menu
					if( globalConfig.viewList == 'dockedlist' )
					{
						var img = 'startmenu.png';
						if( Workspace.mainDock.conf )
						{
							if( Workspace.mainDock.conf.size == '32' )
							{
								img = 'startmenu_32.png';
							}
							else if( Workspace.mainDock.conf.size == '16' )
							{
								img = 'startmenu_16.png';
							}
						}
						var ob = {
							type: 'startmenu',
							src: '/webclient/gfx/system/' + img,
							title: 'Start',
							className: 'Startmenu',
							click: function(){ Workspace.toggleStartMenu(); }
						}
						Workspace.mainDock.addLauncher( ob );
					}

					var elements = JSON.parse( dat );
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
							ele.Icon = ele.Icon.split( /sessionid\=[^&]+/i ).join( 'sessionid=' + Workspace.sessionId );
							if( ele.Icon.indexOf( ':' ) > 0 )
								icon = getImageUrl( ele.Icon );
							else icon = ele.Icon;
						}
						
						var ob = {
							exe         : ele.Name,
							type        : ele.Type,
							src         : icon,
							workspace   : ele.Workspace - 1,
							displayname : ele.DisplayName,
							'title'     : ele.Title ? ele.Title : ele.Name
						};
						
						// For Linux apps..
						if( ele.Name.substr( 0, 7 ) == 'native:' )
						{
							var tmp = ob.exe.split( 'native:' )[1];
							ob.click = genFunc( tmp );
						}

						Workspace.mainDock.addLauncher( ob );
					}
					Workspace.mainDock.initialized();
					
					Workspace.docksReloading = null;
					
					// Make sure taskbar is polled
					PollTaskbar();
					
					// Reload start menu
					// TODO: Remove the need for this hack
					Workspace.pollStartMenu( true );
					
					// Open the main dock first
					if( !Workspace.insideInitialized )
					{
						Workspace.mainDock.openDesklet();
						Workspace.insideInitialized = true;
					}
				}
				dm.execute( 'getdock', { dockid: '0' } );
			}
			else
			{
				Workspace.docksReloading = null;
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
	refreshPaths: {},
	refreshPathTails: {},
	refreshWindowByPath: function( path, depth, callback )
	{
		var self = this;
		if( !depth ) depth = 0;
		
		// Make sure we don't refresh paths already in refresh
		if( this.refreshPaths[ path ] )
		{
			// Add a tail (overwrite if needed) to execute later
			this.refreshPathTails[ path ] = function()
			{
				self.refreshWindowByPath( path, depth, callback );
			}
			return;
		}
		
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

		// Delayed refreshing
		function executeRefresh( window, callback )
		{
			// Race condition, cancel existing..
			if( self.refreshPaths[ path ] )
				clearTimeout( self.refreshPaths[ path ] );
			self.refreshPaths[ path ] = setTimeout( function()
			{
				// Will not need this one, we already got an unexecuted call
				if( self.refreshPathTails[ path ] )
					delete self.refreshPathTails[ path ];
				
				// Setup a new callback for running after the refresh
				var cbk = function()
				{
					// Remove this one - now we are ready for the next call
					delete self.refreshPaths[ path ];
					
					// Run the actual callback
					if( callback ) callback();
					
					// Execute the tail (if it exists)
					if( self.refreshPathTails[ path ] )
					{
						self.refreshPathTails[ path ]();
						delete self.refreshPathTails[ path ];
					}
				};
				// Do the actual refresh
				window.refresh( cbk );
			}, 250 );
		}

		// Check movable windows
		for( var a in movableWindows )
		{
			var mw = movableWindows[a];

			if( !mw.content ) continue;
			if( mw.content.fileInfo )
			{
				if( mw.content.fileInfo.Path.toLowerCase() == path.toLowerCase() && typeof mw.content.refresh == 'function' )
				{
					executeRefresh( mw.content, callback );
				}
			}
			// Dialogs
			else if( mw.windowObject && mw.windowObject.refreshView )
			{
				mw.windowObject.refreshView();
			}
		}

		// Also refresh parent if possible
		// We need this in case we copy to a sub path
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
	diskNotification: function( windowList, type )
	{
		console.log( 'Disk notification!', windowList, type );
	},
	// Render all notifications on the deepest field
	renderNotifications: function()
	{
		// Don't render these on mobile
		if( window.isMobile ) return;

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
				n.className = 'MarginBottom';
				n.innerHTML = '\
				<div class="FloatRight IconSmall fa-remove MousePointer" onclick="Workspace.removeNotification(this.parentNode.index)"></div>\
				<p class="Layout">' + ( no.application ? ( no.application + ': ' ) : ( i18n( 'i18n_system_message' ) + ': ' ) ) + d + '</p>\
				<p class="Layout"><strong>' + no.msg.title + '</strong></p>\
				<p class="Layout">' + no.msg.text + '</strong></p>';
				no.dom = n;
				ge( 'Notifications' ).appendChild( n );
			}
			no.dom.index = a + 1;
		}
		if( DeepestField.updateNotificationInformation )
			DeepestField.updateNotificationInformation();
		ge( 'Notifications' ).scrollTop = ge( 'Notifications' ).innerHeight + 50;
	},
	// TODO: Reenable notifications when the windows can open on the deepest field...
	removeNotification: function( index )
	{
		// Not on mobile
		if( window.isMobile ) return;
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
		if( DeepestField.updateNotificationInformation )
			DeepestField.updateNotificationInformation();
	},
	refreshTheme: function( themeName, update )
	{
		var self = this;
		
		// Only on force or first time
		if( this.themeRefreshed && !update )
			return;

		if( Workspace.themeOverride ) themeName = Workspace.themeOverride.toLowerCase();

		document.body.classList.add( 'Loading' );

		if( !themeName ) themeName = 'friendup12';
		themeName = themeName.toLowerCase();
		
		Workspace.theme = themeName;
		
		var m = new File( 'System:../themes/' + themeName + '/settings.json' );
		m.onLoad = function( rdat )
		{
			// Add resources for theme settings --------------------------------
			rdat = JSON.parse( rdat );
			// Done resources theme settings -----------------------------------
			
			Workspace.themeRefreshed = true;
			Workspace.refreshUserSettings( function() 
			{
				CheckScreenTitle();
			
				// We only allow two mobile themes
				if( isMobile )
				{
					switch( themeName )
					{
						case 'friendup':
						case 'friendup_twilight':
						case 'friendup_dreamy':
						case 'friendup_green':
						case 'friendup_pink':
							break;
						default:
							Workspace.theme = themeName = 'friendup12';
							break;
					}
				}

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
					styles.onload = function()
					{
						// We are inside (wait for wallpaper) - watchdog
						if( !Workspace.insideInterval )
						{
							Workspace.insideInterval = setInterval( function()
							{
								if( Workspace.wallpaperLoaded )
								{
									clearInterval( Workspace.insideInterval );
									Workspace.insideInterval = null;
								
									// Set right classes
									document.body.classList.add( 'Inside' );
									document.body.classList.add( 'Loaded' );
									document.body.classList.remove( 'Login' );
									document.body.classList.remove( 'Loading' );
								
									// Refresh mountlist
									Workspace.refreshDesktop( false, true );
								
									// Redraw now
									DeepestField.redraw();
								}
							}, 50 );
						}
					
						// Flush theme info
						themeInfo.loaded = false;
		
						// Init the websocket etc
						InitWorkspaceNetwork();
					
						// Reload the docks
						Workspace.reloadDocks();
					
						// Refresh them
						Workspace.initWorkspaces();
					
						// Redraw icons if they are delayed
						Workspace.redrawIcons();
					}

					if( themeName && themeName != 'default' )
					{
						AddCSSByUrl( '/themes/' + Workspace.theme + '/scrollbars.css' );
						styles.href = '/system.library/module/?module=system&command=theme&args=' + encodeURIComponent( '{"theme":"' + themeName + '"}' ) + '&sessionid=' + Workspace.sessionId;
					}
					else
					{
						AddCSSByUrl( '/themes/friendup/scrollbars.css' );
						styles.href = '/system.library/module/?module=system&command=theme&args=' + encodeURIComponent( '{"theme":"friendup"}' ) + '&sessionid=' + Workspace.sessionId;
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
		
				// Flush theme info
				themeInfo.loaded = false;
			} );
		}
		m.load();
	},
	// Check for new desktop events too!
	checkDesktopEvents: function()
	{
		//we deactivate this for now... causing a lot of load on the server... and we dont use it yet
		return;

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
	// Remove element from dock
	removeFromDock: function( titl )
	{
		var m = new Module( 'dock' );
		m.onExecuted = function( e, d )
		{
			Workspace.reloadDocks();
		}
		m.execute( 'removefromdock', { name: titl } );
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
		// New experimental way
		var dp = Workspace.drivePanel;

		this.mainDock.closeDesklet();
		
		// Create disposable menu
		var menu = FullscreenMenu;
		menu.clear();
		var ics = Workspace.screen.contentDiv.icons;
		for( var a = 0; a < ics.length; a++ )
		{
			if( ics[a].Type != 'Door' ) continue;
			menu.addMenuItem( {
				text: ics[a].Title,
				clickItem: ics[a].domNode
			} );
		}
		menu.show();
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
	// Just refresh the desktop ------------------------------------------------
	refreshDesktop: function( callback, forceRefresh )
	{
		// Check some images we need to preload and preload them
		var imgs = [];
		if( !window.preloader )
			window.preloader = [];
		var imgOffline = GetThemeInfo( 'OfflineIcon' );
		imgs.push( imgOffline.backgroundImage );
		function preloadAndRemove( n )
		{
			if( !n ) return;
			
			var t = false;
			var i = new Image();
			i.src = n;
			var out = [];
			for( var a = 0; a < window.preloader.length; a++ )
			{
				if( window.preloader[a].src == i.src )
				{
					document.body.removeChild( window.preloader[a] );
				}
				else out.push( window.preloader[a] );
			}
			window.preloader = out;
			document.body.appendChild( i );
			window.preloader.push( i );
		}
		for( var a = 0; a < imgs.length; a++ )
		{
			if( imgs[a] && imgs[a].length )
			{
				if( imgs[a].indexOf( 'url(' ) == 0 )
				{
					imgs[a] = imgs[a].split( 'url(' )[1].split( ')' );
					imgs[a].pop(); imgs[a] = imgs[a].join( ')' );
				}
				imgs[a] = imgs[a].split( '"' ).join( '' );
			}
			preloadAndRemove( imgs[a] );
		}
		
		// Oh yeah, update windows
		for( var a in movableWindows )
		{
			if( movableWindows[a].content.redrawBackdrop )
			{
				movableWindows[a].content.redrawBackdrop();
			}
			// Move windows!
			if( movableWindows[ a ].windowObject.workspace > ( globalConfig.workspacecount - 1 ) )
			{
				movableWindows[a].windowObject.sendToWorkspace( globalConfig.workspacecount - 1 );
			}
		}

		var self = this;
		
		this.getMountlist( function( data )
		{
			if( callback && typeof( callback ) == 'function' ) callback( data );
			
			// make drive list behave like a desklet... copy paste som code back and forth ;)
			window.setupDriveClicks = function( delayed )
			{
				// TODO: Remove this and implement a real fix for this race condition!
				// without having a delay, it finds the eles nodes, but not a .length and no data on the array members...
				if( !delayed ) return setTimeout( "setupDriveClicks(1)", 50 );

				// Drive clicks for mobile
				var ue = navigator.userAgent.toLowerCase();
				if( !window.isMobile )
					return;

				// Add an action to override the touch start action
				var eles = self.screen.div.getElementsByClassName( 'ScreenContent' );
				if( !eles.length ) return;
				eles[0].onTouchStartAction = function( e )
				{
					var dd = eles[0].getElementsByTagName( 'div' )[0];
					var t = e.target ? e.target : e.srcElement;

					Workspace.drivePanel = dd;
					if( t.className && dd == t )
					{
						if( dd.open )
						{
							Workspace.closeDrivePanel();
							return false;
						}
						else
						{
							Workspace.openDrivePanel();
							return true;
						}
					}
					return false;
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
						ext = ( ( ext[ ext.length - 1 ] ) + "" ).toLowerCase();
					}

					// Remove prev
					var v = eles[0].parentNode.getElementsByTagName( 'video' );
					for( var z = 0; z < v.length; z++ ) eles[ 0 ].parentNode.removeChild( v[ z ] );

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
							Workspace.wallpaperLoaded = true;
							break;
						default:
							Workspace.wallpaperLoaded = false;
							var workspaceBackgroundImage = new Image();
							workspaceBackgroundImage.onload = function()
							{
								// Let's not fill up memory with new wallpaper images
								if( Workspace.prevWallpaper )
								{
									var o = [];
									for( var c = 0; c < Workspace.imgPreload.length; c++ )
									{
										if( Workspace.imgPreload[c].src != Workspace.prevWallpaper )
											o.push( Workspace.imgPreload[c] );
									}								
									Workspace.imgPreload = o;
								}
								Workspace.imgPreload.push( this );
								Workspace.prevWallpaper = this.src;
								
								// Set the background size on wallpaper element
								eles[0].style.backgroundSize = 'cover';
								
								setupDriveClicks();
								this.done = true;
								
								Workspace.wallpaperImageObject = workspaceBackgroundImage;
								
								if( globalConfig.workspacecount > 1 )
								{
									// Check series of wallpaper elements
									Workspace.checkWorkspaceWallpapers( true );
								}
								else
								{
									// Set the wallpaper
									eles[0].style.backgroundImage = 'url(' + this.src + ')';
									Workspace.wallpaperLoaded = true;
								}
							};
							if( found )
							{
								workspaceBackgroundImage.src = getImageUrl( self.wallpaperImage );
							}
							else 
							{
								workspaceBackgroundImage.src = '/webclient/gfx/theme/default_login_screen.jpg';
							}
							if( workspaceBackgroundImage.width > 0 && workspaceBackgroundImage.height > 0 && workspaceBackgroundImage.onload )
							{
								workspaceBackgroundImage.onload();
							}
							
							Workspace.wallpaperImageObject = workspaceBackgroundImage;
							
							// If this borks up in 5 seconds, bail!
							setTimeout( function()
							{
								if( 
									typeof( Workspace.wallpaperImageObject ) != 'undefined' && 
									!Workspace.wallpaperImageObject.done && 
									typeof Workspace.wallpaperImageObject.onload == 'function' 
								)
								{
									Workspace.wallpaperImageObject.onload();
								}
								else
								{
									setupDriveClicks();
									Workspace.wallpaperImageObject.done = true;
									Workspace.wallpaperLoaded = true;
								}
							}, 5000 );
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
				Workspace.wallpaperLoaded = true;
				Workspace.checkWorkspaceWallpapers();
			}

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
	refreshDormantDisks: function( callback )
	{
		var found = false;

		// Check dormant
		if( DormantMaster )
		{
			found = DormantMaster.getDoors();
		}
		var dom = false;

		var tray = ge( 'Tray' );
		
		// Insert applet if not there
		if( tray )
		{
			var eles = tray.getElementsByTagName( 'div' );
			for( var a = 0; a < eles.length; a++ )
			{
				if( eles[a].classList && eles[a].classList.contains( 'Disks' ) )
				{
					dom = eles[a];
					break;
				}
			}
		}

		if( ( !found || ( found && !found.length ) ) && dom )
		{
			dom.parentNode.removeChild( dom );
			return;
		}
		// DOM elements
		else if( !dom && found && tray )
		{
			dom = document.createElement( 'div' );
			dom.className = 'Disks TrayElement IconSmall';
			dom.bubble = document.createElement( 'div' );
			dom.bubble.className = 'BubbleInfo List';
			dom.appendChild( dom.bubble );
			tray.appendChild( dom );
		}
		else if( dom )
		{
			dom.bubble = dom.getElementsByTagName( 'div' )[0];
		}
		else
		{
			return;
		}

		// List
		var d = document.createElement( 'div' );
		var str = ''; var sw = 2;
		for( var a = 0; a < found.length; a++ )
		{
			sw = sw == 1 ? 2 : 1;
			var dd = document.createElement( 'div' );
			dd.className = 'sw' + sw;
			dd.innerHTML = found[a].Title;
			dd.f = found[a];
			dd.onclick = function()
			{
				OpenWindowByFileinfo( this.f );
			}
			d.appendChild( dd );
		}

		dom.bubble.innerHTML = '';
		dom.bubble.appendChild( d );
	},
	// Fetch mountlist from database
	getMountlist: function( callback, forceRefresh )
	{
		var t = this;
		var mo = new Module( 'system' );
		mo.onExecuted = function( returnCode, shortcuts )
		{
			var m = new Library( 'system.library' )
			m.onExecuted = function( e, dat )
			{
				var newIcons = [];

				// Add system on top (after Ram: if it exists)
				newIcons.push( {
					Title:	'System:',
					Volume:   'System:',
					Path:	 'System:',
					Type:	 'Door',
					Handler: 'built-in',
					MetaType: 'Directory',
					IconClass: 'SystemDisk',
					ID:	   'system', // TODO: fix
					Mounted:  true,
					Visible: globalConfig.hiddenSystem == true ? false : true,
					Door:	  new DoorSystem( 'System:' )
				} );
				
				if( returnCode == 'ok' )
				{
					var shorts = JSON.parse( shortcuts );
					for( var a = 0; a < shorts.length; a++ )
					{
						var pair = shorts[a].split( ':' );
						// Shift camelcase
						var literal = '';
						for( var c = 0; c < pair[0].length; c++ )
						{
							if( c > 0 && pair[0].charAt(c).toUpperCase() == pair[0].charAt(c) )
							{
								literal += ' ';
							}
							literal += pair[0].charAt( c );
						}
						
						// Add custom icon
						newIcons.push( {
							Title: literal,
							Filename: pair[0],
							Type: 'Executable',
							IconFile: '/' + pair[1],
							Handler: 'built-in',
							MetaType: 'ExecutableShortcut',
							ID: shorts[a].toLowerCase(),
							Mounted: true,
							Visible: true,
							IconClass: literal.split( ' ' ).join( '_' ),
							Door: 'executable'
						} );
					}
				}

				// Redraw icons when tested for disk info
				var redrawIconsT = false;
				function testDrive( o, d )
				{
					if( !d ) return;
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
										o.IconFile = getImageUrl( o.Volume + dt.DiskIcon );
										clearTimeout( redrawIconsT );
										redrawIconsT = setTimeout( function()
										{
											t.redrawIcons();
										}, 100 );
									}
								}
							}
							fl.load();
						}
						clearTimeout( redrawIconsT );
						redrawIconsT = setTimeout( function()
						{
							t.redrawIcons();
						}, 100 );
					} );
				}

				// Network devices
				var rows;
				try
				{
					rows = JSON.parse( dat );
				}
				catch(e)
				{
					rows = false;
					console.log( 'Could not parse network drives',e,dat );
				}

				if( rows && rows.length )
				{
					for ( var a = 0; a < rows.length; a++ )
					{
						var r = rows[a];
						if( r.Config.indexOf( '{' ) >= 0 )
							r.Config = JSON.parse( r.Config );

						// Check if it was already found!
						var found = false;
						for( var va in t.icons )
						{
							if( t.icons[va].Volume == r.Name.split( ':' ).join( '' ) + ':' )
							{
								found = true;
								if( !forceRefresh )
									newIcons.push( t.icons[va] );
								break;
							}
						}
						if( found && !forceRefresh )
						{
							continue;
						}

						// Doesn't exist, go on
						var o = false;

						var d;

						d = ( new Door() ).get( r.Name + ':' );
						d.permissions[0] = 'r';
						d.permissions[1] = 'w';
						d.permissions[2] = 'e';
						d.permissions[3] = 'd';

						var o = {
							Title: r.Name.split(':').join('') + ':',
							Volume: r.Name.split(':').join('') + ':',
							Path: r.Name.split(':').join('') + ':',
							Handler: r.FSys,
							Type: 'Door',
							MetaType: 'Directory',
							ID: r.ID,
							Mounted: true,
							Door: d,
							Visible: r.Visible != "false" ? true : false,
							Config: r.Config
						};

						// Execute it if it has execute flag set! Only the first time..
						if( !found && r.Execute )
						{
							ExecuteJSXByPath( o.Volume + r.Execute );
						}

						// Force mount
						var f = new FriendLibrary( 'system.library' );
						f.addVar( 'devname', r.Name.split(':').join('') );
						f.execute( 'device/mount' );

						// We need volume information
						d.Volume = o.Volume;
						//d.Type = typ;

						testDrive( o, d );

						// Add to list
						newIcons.push( o );
					}
				}

				// The new list
				if( newIcons.length )
				{
					// Check change
					if( t.icons )
					{
						for( var a = 0; a < t.icons.length; a++ )
						{
							var found = false;
							for( var b = 0; b < newIcons.length; b++ )
							{
								if( newIcons[b].Volume == t.icons[a].Volume )
								{
									found = true;
									break;
								}
							}
							if( !found )
							{
								testDrive( t.icons[a], t.icons[a].Door )
								break;
							}
						}
					}
					t.icons = newIcons;
				}
				// Do the callback thing
				if( callback && typeof( callback ) == 'function' ) callback( t.icons );

				// Check for new events
				t.checkDesktopEvents();
			}
			m.execute( 'device/list' );
		}
		mo.execute( 'workspaceshortcuts' );

		return true;
	},
	redrawIcons: function()
	{
		if( !this.screen ) return;

		if( !document.body.classList.contains( 'Loaded' ) )
		{
			return;
		}
	
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
	// Create a new web link!
	weblink: function( path )
	{
		var p = currentMovable.content.fileInfo.Path;

		function wpop( data )
		{
			var v = new View( {
				title: i18n( 'i18n_create_web_link' ),
				width: 400,
				height: 250
			} );

			var f = new File( '/webclient/templates/weblink.html' );
			f.replacements = { val_name: '', val_link: '', val_notes: '', val_path: p };
			if( data )
			{
				for( var a in data )
				{
					f.replacements[ 'val_' + a ] = data[a];
				}
			}
			f.i18n();
			f.onLoad = function( data )
			{
				v.setContent( data );
			}
			f.load();
		}
		if( path )
		{
			var f = new File( path );
			f.onLoad = function( data )
			{
				try
				{
					var j = JSON.parse( data );
					wpop( j );
				}
				catch( e )
				{
				}
			}
			f.load();
		}
		else
		{
			wpop();
		}
	},
	// Save a web link
	saveWebLink: function( pele, win )
	{
		var eles = [];
		var inp = pele.getElementsByTagName( 'input' );
		var txt = pele.getElementsByTagName( 'textarea' );
		for( var a = 0; a < inp.length; a++ ) eles.push( inp[a] );
		for( var a = 0; a < txt.length; a++ ) eles.push( txt[a] );
		var f = {};
		for( var a = 0; a < eles.length; a++ )
		{
			if( !eles[a].getAttribute( 'name' ) ) continue;
			f[ eles[a].getAttribute( 'name' ) ] = eles[a].value;
		}
		if( f.name && f.name.length )
		{
			var fl = new File( f.path + f.name.split( /[\s]/ ).join( '_' ) + '.url' );
			fl.save( JSON.stringify( f ) );
		}
		CloseView( win );
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

			var fi = directoryWindow.content.fileInfo;
			var dr = fi.Door ? fi.Door : Workspace.getDoorByPath( fi.Path );
			var i = fi.ID
			var p = fi.Path;

			inputButton.onclick = function()
			{
				if( inputField.value.length > 0 )
				{
					// Make sure we have a correct path..
					var ll = p.substr( p.length - 1, 1 );
					if( ll != '/' && ll != ':' )
						p += '/';

					dr.dosAction( 'makedir', { path: p + inputField.value, id: i }, function()
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
			var nam = EntityDecode( sele.getElementsByTagName( 'a' )[0].innerHTML );

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
					<div class="ContentFull LayoutButtonbarBottom">\
						<div class="VContentTop Padding">\
							<div class="HRow MarginBottom">\
								<div class="HContent30 FloatLeft"><p class="InputHeight"><strong>' + i18n( 'new_name' ) + ':</strong></p></div>\
								<div class="HContent70 FloatLeft"><input type="text" class="InputHeight FullWidth" value="' + nam + '"></div>\
							</div>\
						</div>\
						<div class="VContentBottom Padding BackgroundDefault BorderTop">\
							<button type="button" class="Button IconSmall fa-edit">\
								' + i18n( 'rename_file' ) + '\
							</button>\
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
	// copy current file selection into virtual clipboard
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

				// Make a copy (we might not have the source view window open anymore!)
				var eleCopy = document.createElement( eles[a].tagName );
				eleCopy.innerHTML = eles[a].innerHTML;
				eleCopy.fileInfo = eles[a].fileInfo;
				eleCopy.window = { fileInfo: rwin.content.fileInfo, refresh: rwin.refresh };

				selected.push( eleCopy );
			}
			//only act if we have something to do afterwards...
			if( selected.length > 0 )
			{
				friend.workspaceClipBoardMode = 'copy';
				friend.workspaceClipBoard = selected;
			}
		}
	},
	// paste from virtual clipboard
	pasteFiles: function()
	{
		if( friend.workspaceClipBoard && friend.workspaceClipBoard.length > 0 && typeof window.currentMovable.drop == 'function' )
		{
			var e = {};
			e.ctrlKey = ( friend.workspaceClipBoardMode == 'copy' ? true : false );
			window.currentMovable.drop( friend.workspaceClipBoard, e );
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
			// TODO: Make dynamic in a config file or something..
			var permissionPool = [
				'Module System',
				'Module Files',
				'Door All'
			];
			var hasPermissions = [ false, false, false ];

			if( !conf )
			{
				conf = { permissions: hasPermissions };
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
					if( permissionPool[b] == conf.permissions[a][0] )
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
	fileInfo: function( icon )
	{
		if( !icon ) icon = this.getActiveIcon();

		if( icon )
		{
			// Check volume icon
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

			// Normal file or directory icon
			var w = new View( {
				title: ( icon.Type == 'Door' ? i18n( 'i18n_volumeicon_information' ) : i18n( 'i18n_icon_information' ) ) +
					' "' + ( icon.Filename ? icon.Filename : icon.Title ) + '"',
				width: 640,
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

			if( isNaN( icon.Filesize ) ) icon.Filesize = 0;
			if( isNaN( icon.UserSpace ) ) icon.UserSpace = 0;

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
			if( icon.Path && icon.Path.split( ':' )[0] == 'System' )
				filt = 'iconinfo_system.html';
				
			if( icon.Path && icon.Path.substr( icon.Path.length - 5, 5 ).toLowerCase() != '.info' )
			{
				var finfo = icon.Path;
				if( icon.Path.substr( icon.Path.length - 1, 1 ) == '/' )
				{
					finfo = icon.Path.substr( 0, icon.Path.length - 1 ) + '.dirinfo';
				}
				else
				{
					finfo += '.info';
				}
				var mi = new File( finfo );
				
				mi.onLoad = function( fd )
				{
					fd = fd.split( '<!--separate-->' )[0];
					var data = false;
					if( fd.length && fd.indexOf( '{' ) >= 0 )
					{
						data = JSON.parse( fd );
					}
					ca( data );
				}
				mi.load();
			}
			else
			{
				ca();
			}
			function ca( datajson )
			{
				var fdt = {};
				fdt.IconImage = { Title: i18n( 'i18n_icon_image' ), Name: 'Icon', Type: 'text', Length: i18n( 'i18n_icon_image' ).length };
				if( typeof( datajson ) == 'object' )
				{
					datajson.IconImage = fdt.IconImage;
					fdt = datajson;
				}
				var fdt_out = '';
				var sel = '';
				var i = 0;
				for( var a in fdt )
				{
					if( !fdt[a].Title ) fdt[a].Title = a;
					fdt_out += '<option value="' + a + '" encoding="' + fdt[a].Encoding + '" type="' + fdt[a].Type + '">' + fdt[a].Title + '</option>';
				}

				var f = new File( '/webclient/templates/' + filt );
				f.replacements = {
					filename: icon.Filename ? icon.Filename : ( icon.Title.split( ':' )[0] ),
					filesize: icon.Filesize + '' + fbtype + ( icon.UsedSpace ? ( ' (' + icon.UsedSpace + '' + ustype + ' ' + i18n( 'i18n_used_space' ) + ')' ) : '' ),
					path: icon.Path,
					protection: prot,
					Cancel: i18n( 'i18n_cancel' ),
					Save: i18n( 'i18n_save' ),
					Notes: i18n( 'i18n_notes' ),
					iconnotes: icon.Notes ? icon.Notes : '',
					sharename: i18n( 'i18n_sharename' ),
					sharewith: i18n( 'i18n_sharewith'),
					public_disabled: '',
					instance: ( icon.Filename ? icon.Filename : ( icon.Title.split( ':' )[0] ) ).split( /[^a-z]+/i ).join( '' ),
					info_fields: fdt_out
				};
				f.i18n();
				if( icon.Path )
				{
					if( icon.Path.substr( icon.Path.length - 1, 1 ) != ':' )
					{
						f.replacements.i18n_volume_information = i18n( 'i18n_file_information' );
						f.replacements.i18n_volume_name = i18n( 'i18n_filename' );
						f.replacements.i18n_volume_size = i18n( 'i18n_filesize' );
					}
				}
				f.onLoad = function( d )
				{
					// Check file permissions!
					var dn = icon.Path ? icon.Path.split( ':' )[0] : icon.Title;
					var pt = icon.Path ? icon.Path : '';

					var sn = new Library( 'system.library' );
					sn.onExecuted = function( returnCode, returnData )
					{
						// If we got an OK result, then parse the return data (json data)
						var rd = false;
						if( returnCode == 'ok' )
							rd = JSON.parse( returnData );
						// Else, default permissions
						else
						{
							rd = [
								{
									access: '-rwed',
									type: 'user'
								},
								{
									access: '-rwed',
									type: 'group'
								},
								{
									access: '-rwed',
									type: 'others'
								}
							];
						}

						w.setContent( d.split( '!!' ).join( Workspace.seed ) );

						Workspace.iconInfoDataField( w.getWindowElement(), true );

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
									var conf = dr.Config;
									if( typeof( dr.Config ) == 'string' && dr.Config.indexOf( '{' ) >= 0 )
										conf = JSON.parse( dr.Config );
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

						// The permission inputs
						var permInputs = {
							user: '-----',
							group: '-----',
							others: '-----'
						};
						var permSettings = {
							user: '',
							group: '',
							others: ''
						};
						var permOrder = { 'a': 0, 'r': 1, 'w': 2, 'e': 3, 'd': 4 };
						for( var an = 0; an < rd.length; an++ )
						{
							// First time
							if( rd[an].type && !permSettings[rd[an].type] )
							{
								permSettings[rd[an].type] = rd[an].access.toLowerCase();
							}
							// Merge permissions
							else
							{
								var slot = permSettings[rd[an].type];
								for( var az = 0; az < rd[an].access.length; az++ )
								{
									if( slot[az] == '-' && rd[an].access[az] != '-' )
										slot[az] = rd[an].access[az];
								}
								permSettings[rd[an].type] = slot.toLowerCase();
							}
						}
						// Now we're ready to find these permissions!

						// Setup public / private file
						eles = w.getElementsByTagName( 'input' );
						for( var a in eles )
						{
							// Skip non numeric element keys!
							if( isNaN( parseInt( a ) ) ) continue;

							var attrname = eles[a].getAttribute( 'name' );

							// User permission
							if( attrname && (
								attrname.substr( 0, 5 ) == 'PUser' ||
								attrname.substr( 0, 6 ) == 'PGroup' ||
								attrname.substr( 0, 7 ) == 'POthers'
							) )
							{
								var letr = attrname.substr( attrname.length - 1, 1 ).toLowerCase();
								var mode = attrname.substr( 1, attrname.length - 2 ).toLowerCase();
								eles[a].checked = permSettings[ mode ].indexOf( letr ) >= 0 ? 'checked' : '';
							}
							// The public file functionality
							else if( attrname == 'PublicLink' )
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
							else if( attrname == 'IsPublic' )
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
										m.execute( 'file/conceal', { path: icon.Path } );
									}
								}
							}
						}

						// Initialize tab system
						InitTabs( ge( 'IconInfo_' + Workspace.seed ) );
					}
					sn.execute( 'file/access', { devname: dn, path: pt } );
				}
				f.load();
			}
		}
		else
		{
			console.log( i18n( 'please_choose_an_icon' ) );
		}
	},
	// Set data field on icon info select element
	iconInfoDataField: function( selement, find )
	{
		// Find view object using search
		if( find == true )
		{
			// We should now have a view
			if( selement.nodeName == 'DIV' )
			{
				selement = selement.getElementsByTagName( 'select' );
				var fnd = false;
				if( selement.length )
				{
					for( var z = 0; z < selement.length; z++ )
					{
						// Found the correct select element
						if( selement[z].classList && selement[z].classList.contains( 'IconInfoSelect' ) )
						{
							selement = selement[z];
							fnd = true;
							break;
						}
					}
				}
				if( !fnd )
				{
					return false;
				}
			}
		}
		else find = false;

		// Get the container of the input field / data value
		var part = selement.parentNode.parentNode.parentNode;
		var targ = false;
		var eles = part.getElementsByTagName( 'div' );
		for( var a = 0; a < eles.length; a++ )
		{
			if( eles[a].classList && eles[a].classList.contains( 'FieldInfo' ) )
			{
				targ = eles[a];
				break;
			}
		}

		// Find the current element
		var opts = selement.getElementsByTagName( 'option' );
		var opt = false;
		for( var a = 0; a < opts.length; a++ )
		{
			if( opts[a].selected || ( find && a == 0 ) )
			{
				opts[a].selected = 'selected';
				opt = opts[a];
				break;
			}
		}

		if( targ && opt )
		{
			if( opt.getAttribute( 'type' ) )
			{
				var m = new Library( 'system.library' );
				m.onExecuted = function( e, d )
				{
					if( e == 'ok' )
					{
						switch( opt.getAttribute( 'type' ).toLowerCase() )
						{
							case 'string':
								targ.innerHTML = '<input type="text" class="FullWidth InputHeight" value="' + d + '"/>';
								break;
							case 'text':
								targ.innerHTML = '<textarea class="FullWidth" style="height: 180px">' + d + '</textarea>';
								break;
							case 'image/jpeg':
							case 'image/jpg':
							case 'image/gif':
							case 'image/png':
								var encoding = opt.getAttribute( 'encoding' );
								if( encoding == 'base64' )
								{
									targ.innerHTML = '<img width="100%" height="auto" src="data:' + opt.getAttribute( 'type' ).toLowerCase() + ';base64,' + d + '"/>';
								}
								else
								{
									targ.innerHTML = i18n( 'i18n_non_compatible_field_information' );
								}
								break;
							default:
								targ.innerHTML = i18n( 'i18n_no_field_information' );
								break;
						}
					}
					else
					{
						targ.innerHTML = i18n( 'i18n_no_field_information' );
					}
				}
				m.execute( 'file/infoget', { key: opt.getAttribute( 'value' ), path: opt.parentNode.getAttribute( 'path' ) } );
			}
			else
			{
				targ.innerHTML = i18n( 'i18n_no_field_information' );
			}
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
					permopts.push( [ perms[a].getAttribute( 'permission' ) ] );
				var select = perms[a].parentNode.getElementsByTagName( 'select' );
			}
			args.Permissions = permopts;
		}
		// Ok, different set of permissions
		else
		{
			// The permission inputs
			var permInputs = { user: '-----', group: '-----', others: '-----' };
			var permOrder = { 'a': 0, 'r': 1, 'w': 2, 'e': 3, 'd': 4 };
			// Now we're ready to find these permissions!

			// Setup public / private file
			for( var h in inps )
			{
				// Skip non numeric element keys!
				if( !inps[h].getAttribute ) continue;

				var attrname = inps[h].getAttribute( 'name' );

				// User permission
				if( attrname && (
					attrname.substr( 0, 5 ) == 'PUser' ||
					attrname.substr( 0, 6 ) == 'PGroup' ||
					attrname.substr( 0, 7 ) == 'POthers'
				) )
				{
					var letr = attrname.substr( attrname.length - 1, 1 ).toLowerCase();
					var mode = attrname.substr( 1, attrname.length - 2 ).toLowerCase();
					var indx = permOrder[ letr ];

					// Javascript's wonderful way of changing a single character.. Whooopie
					permInputs[ mode ] = permInputs[mode].substr( 0, indx  ) +
						( inps[h].checked ? letr : '-' ) +
						permInputs[mode].substr( indx + 1, permInputs[mode].length - indx );
				}
			}

			// Update permissions
			var perm = {};
			if( Trim( permInputs.user ) )
				perm.user = Trim( permInputs.user );
			if( Trim( permInputs.group ) )
				perm.group = Trim( permInputs.group );
			if( Trim( permInputs.others ) )
				perm.others = Trim( permInputs.others );
			perm.path = args.Path;
			var la = new Library( 'system.library' );
			la.onExecuted = function(){};
			la.execute( 'file/protect', perm );
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
	// Just get active icon, no arguments
	getActiveIcon: function()
	{
		var icon = false;
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
		return icon;
	},
	// Just refresh before calling a callback
	refreshFileInfo: function( callback )
	{
		var icon = this.getActiveIcon();
		if( !icon ) return;

		if( icon.Type == 'Door' )
		{
			var m = new Library( 'system.library' );
			m.onExecuted = function()
			{
				Workspace.getMountlist( callback, true );
			}
			m.execute( 'device/refresh', { devname: icon.Volume.split( ':' )[0] } );
			return;
		}
		callback();
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
			var resultfr = ge( 'fileUploadFrame' );
			
			// Need target frame to complete job
			if( resultfr && uppath.length )
			{
				form.submit();
				var f = function( e )
				{
					var res = resultfr.contentDocument.body.innerHTML;
					res = res.split( '<!--separate-->' );
					if( res[0] == 'ok' )
					{
						ge( 'uploadFeedback' ).innerHTML = i18n( 'i18n_upload_completed' );
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
						
						Notify( { title: i18n( 'i18n_upload_completed' ), text: i18n( 'i18n_upload_completed_description' ) } );

						Workspace.refreshWindowByPath( uppath );
					}
					else
					{
						Notify( { title: i18n( 'i18n_upload_failed' ), text: i18n( 'i18n_upload_failed_description' ) } );
						
						ge( 'uploadFeedback' ).innerHTML = i18n( 'i18n_upload_failed' );
					}
					
					setTimeout( function()
					{
						ge( 'uploadFeedback' ).innerHTML = '';
					}, 1500 );
					
					resultfr.removeEventListener( 'load', f );
					
					ge( 'uploadFileField' ).value = '';
				};
				resultfr.addEventListener( 'load', f );
			}
			return;
		}

		var fi = false;
		if( currentMovable && currentMovable.content.fileInfo )
			fi = currentMovable.content.fileInfo.Path;

		var w = new View( {
			title: i18n( 'i18n_choose_file_to_upload' ),
			width: 370,
			'min-width': 370,
			height: 160,
			'min-height': 160,
			id: 'fileupload',
			resize: true,
			screen: Workspace.screen
		} );
		var f = new File( '/webclient/templates/file_upload.html' );
		f.i18n()
		f.onLoad = function( data )
		{
			w.setContent( data );
			if( fi )
			{
				var eles = w.getElementsByTagName( 'input' );
				for( var v = 0; v < eles.length; v++ )
				{
					if( eles[v].name && eles[v].name == 'path' )
					{
						eles[v].value = fi;
						break;
					}
				}
			}
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

		var keys = parent.ApplicationStorage.load( { applicationName : 'Workspace' } );

		if( keys )
		{
			keys.username = '';

			parent.ApplicationStorage.save( keys, { applicationName : 'Workspace' } );
		}

		SaveWindowStorage( function()
		{
			//do external logout and then our internal one.
			if( Workspace.logoutURL )
			{
				Workspace.externalLogout();
				return;
			}

			var m = new cAjax();
			Workspace.websocketsOffline = true;
			m.open( 'get', '/system.library/user/logout/?sessionid=' + Workspace.sessionId, true );
			m.onload = function()
			{
				if( typeof friendApp != 'undefined' && typeof friendApp.exit == 'function')
				{
					friendApp.exit();
					return;
				}
				Workspace.sessionId = ''; document.location.href = window.location.href.split( '?' )[0]; //document.location.reload();
			}
			m.send();
			Workspace.websocketsOffline = false;

		} );
	},
	externalLogout: function()
	{
		var wl = new View( {
			title: 'Logout!',
			width: 370,
			'min-width': 370,
			height: 170,
			'min-height': 170,
			'max-height': 170,
			id: 'fileupload',
			screen: Workspace.screen
		} );

		wl.setRichContentUrl( Workspace.logoutURL, '', false, false, function(){
			wl.close();
			Workspace.logoutURL = false;
			if( typeof friendApp != 'undefined' && typeof friendApp.exit == 'function')
			{
				setTimeout( 'Workspace.logout()', 1000 );
			}
			else
			{
				Workspace.logout();
			}
		});
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
			if( t )
			{
				var s = t.split( '.' );
				s = s[s.length-1];
				if( ic[a].domNode && ic[a].domNode.classList.contains( 'Selected' ) )
				{
					if( s.toLowerCase() == type.toLowerCase() )
						return true;
				}
			}
		}
		return false;
	},
	// Open folder (tree directory)
	openFolder: function( event )
	{
		Notify( { title: i18n( 'i18n_zip_start' ), text: i18n( 'i18n_zip_startdesc' ) } );
		var ic = currentMovable.content.icons;
		var f = [];
		var dest = false;
		var icon;
		for( var a = 0; a < ic.length; a++ )
		{
			if( ic[a].domNode && ic[a].domNode.classList.contains( 'Selected' ) )
			{
				if( !dest )
				{
					dest = ic[a].Path;
					icon = ic[a];
				}
				f.push( ic[a].Path );
			}
		}
		if( dest && f.length )
		{
			FriendDOS.getFileInfo( dest, function( e, d )
			{
				if( !e )
				{
					return dcallback( false, { response: 'Could not get file information.' } );
				}
				else
				{
					if( !e )
						return dcallback( false, { response: 'Could not get file information.' } );
					else
					{
						var fileInfo;
						try
						{
							fileInfo = JSON.parse( d );
						} catch( e ) {}
						if ( fileInfo )
						{
							icon.domNode.noRun = true;
							OpenWindowByFileinfo( fileInfo, event, icon.domNode, false );
						}
					}
				}
			} );
		}
	},
	// Compress files
	zipFiles: function()
	{
		Notify( { title: i18n( 'i18n_zip_start' ), text: i18n( 'i18n_zip_startdesc' ) } );
		var ic = currentMovable.content.icons;
		var f = [];
		var dest = false;
		for( var a = 0; a < ic.length; a++ )
		{
			if( ic[a].domNode && ic[a].domNode.classList.contains( 'Selected' ) )
			{
				if( !dest ) dest = ic[a].Path;
				f.push( ic[a].Path );
			}
		}
		if( dest && f.length )
		{
			if( dest.indexOf( '/' ) > 0 )
			{
				dest = dest.split( '/' );
				dest.pop();
				dest = dest.join( '/' ) + '.zip';
			}
			else
			{
				dest += '.zip';
			}

			var files = f.join( ';' );
			var s = new Library( 'system.library' );
			s.onExecuted = function( e, d )
			{
				if( e == 'ok' )
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
					Notify( { title: i18n( 'i18n_zip_completed' ), text: i18n( 'i18n_zip_comdesc' ) + ': ' + ( files.split( ';' ).join( ', ' ) ) } );
				}
				else
				{
					Notify( { title: i18n( 'i18n_zip_not_completed' ), text: i18n( 'i18n_zip_not_comdesc' ) + ': ' +  ( files.split( ';' ).join( ', ' ) ) } );
				}
			}
			s.execute( 'file/compress', { files: files, archiver: 'zip', destination: dest } );
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
				var s = new Library( 'system.library' );
				s.onExecuted = function( e, d )
				{
					if( e == 'ok' )
					{
						var res = null;
						try {
							res = JSON.parse( d );
						} catch( e ) {
							console.log( 'file/decompress - failed to parse return data', d );
						}
						if ( res && res.PID )
							var progress = new Progress( res.PID, Workspace.conn );
						else
							console.log( 'file/decompress - invalid return data', res );

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

						Notify( { title: i18n( 'i18n_unzip_completed' ), text: i18n( 'i18n_unzip_comdesc' ) + ': ' + decodeURIComponent( this.file ) } );
					}
					else
					{
						Notify( { title: i18n( 'i18n_unzip_failed' ), text: i18n( 'i18n_unzip_failed_desc' ) + ': ' + decodeURIComponent( this.file ) } );
					}
				}
				s.execute( 'file/decompress', { path: f[a].Path, archiver: 'zip', detachtask : true } );
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

		var iconsSelected = friend.iconsSelectedCount > 0;
		var iconsInClipboard = ( friend.workspaceClipBoard && friend.workspaceClipBoard.length > 0 );

		var canUnmount = false;
		if( iconsSelected )
		{
			canUnmount = true;
			var ics = currentMovable ? currentMovable.content.icons : currentScreen.screen._screen.icons;
			for( var a in ics )
			{
				if( ics[a].domNode && ics[a].domNode.classList )
				{
					if( ics[a].domNode.classList.contains( 'Selected' ) )
					{
						if( ics[a].Type == 'Door' )
						{
							volumeIcon = true;
						}
						if( ics[a].Volume == 'System:' )
						{
							canUnmount = false;
						}
					}
				}
			}
		}

		// Init menu -----------------------------------------------------------
		var tools = '';
		if( typeof( this.menu['tools'] ) != 'undefined' )
		{
			tools = this.menu['tools'].join ( "\n" );
		}

		// We got windows?
		var windowsOpened = false;
		for( var a in movableWindows )
		{
			windowsOpened = true;
			break;
		}

		var cnt = null;
		var systemDrive = false;
		if( currentMovable )
		{
			currentMovable.content;
			if( cnt ) systemDrive = cnt && cnt.fileInfo && cnt.fileInfo.Volume == 'System:';
		}

		// Setup Doors menu
		this.menu = [
			{
				name: i18n( 'menu_system' ),
				items:
				[
					{
						name:	i18n( 'menu_about_friendup' ),
						command: function(){ AboutFriendUP(); }
					},
					/*{
						name:	i18n( 'information' ),
						command: function(){ Workspace.informationWindow( 1 ); }
					},*/
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
						name:   i18n( 'menu_backdrop' ),
						command: function(){ Workspace.backdrop(); }
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
						command: function(){ ExecuteApplication( 'FriendShell' ); }
					},
					{
						name:	i18n( 'menu_upload_file' ),
						command: function(){ Workspace.uploadFile(); }
					},
					{
						divider: true
					},
					{
						name:	(typeof friendApp != 'undefined' && typeof friendApp.exit == 'function' ?  i18n('menu_exit') : i18n( 'menu_log_out' ) ),
						command: function(){ 
							if( window.friendBook )
							{
								// Just leavd!
								Workspace.leave = function(){};
								Workspace.doLeave = function(){};
								window.close();
							}
							else 
							{
								Workspace.logout();
							} 
						}
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
						command: function(){ Workspace.hideAllViews(); },
						disabled: !windowsOpened
					},
					{
						name:   i18n( 'menu_hide_inactive_views' ),
						command: function(){ Workspace.hideInactiveViews(); },
						disabled: !windowsOpened
					},
					/*{
						name:	i18n( 'menu_open_directory' ),
						command: function(){ Workspace.openDirectory(); },
						disabled: !iconsSelected
					},*/
					iconsAvailable ? {
						name: i18n( 'menu_show_as' ),
						items:
						[
							{
								name:	 i18n( 'menu_show_as_icons' ),
								command: function(){ Workspace.viewDirectory( 'iconview' ); }
							},
							{
								name:	 i18n( 'menu_show_as_compact' ),
								command: function(){ Workspace.viewDirectory( 'compact' ); }
							},
							{
								name:	 i18n( 'menu_show_as_list' ),
								command: function(){ Workspace.viewDirectory( 'listview' ); }
							}/*,
							{
								name:	i18n( 'menu_show_as_columns' ),
								command: function(){ Workspace.viewDirectory('columnview'); }
							}*/
						]
					} : false,
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
						command: function(){ CloseWindow( window.currentMovable ) },
						disabled: !windowsOpened
					}
				]
			},
			/*{
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
			},*/
			{
				name: i18n( 'menu_icons' ),
				items:
				[
					{
						name:	i18n( 'menu_copy' ),
						command: function() { Workspace.copyFiles(); },
						disabled: !iconsSelected || volumeIcon || systemDrive
					},
					{
						name:	i18n( 'menu_paste' ),
						command: function() { Workspace.pasteFiles(); },
						disabled: !iconsInClipboard || systemDrive
					},
					{
						name:	i18n( 'menu_new_weblink' ),
						command: function() { Workspace.weblink(); },
						disabled: !iconsAvailable || systemDrive
					},
					{
						name:	i18n( 'menu_new_directory' ),
						command: function() { Workspace.newDirectory(); },
						disabled: !iconsAvailable || systemDrive
					},
					{
						name:	i18n( 'menu_show_icon_information' ),
						command: function(){ Workspace.refreshFileInfo( function(){ Workspace.fileInfo(); } ) },
						disabled: !iconsSelected
					},
					{
						name:	i18n( 'menu_edit_filename' ),
						command: function() { Workspace.renameFile(); },
						disabled: ( !iconsSelected || volumeIcon || systemDrive )
					},
					{
						name:	i18n( 'menu_zip' ),
						command: function() { Workspace.zipFiles(); },
						disabled: ( !iconsSelected || volumeIcon || systemDrive )
					},
					{
						name:	i18n( 'menu_unzip' ),
						command: function() { Workspace.unzipFiles(); },
						disabled: !iconsSelected || !Workspace.selectedIconByType( 'zip' ) || systemDrive
					},
					{
						name:	i18n( 'menu_openfolder' ),
						command: function( event ) { Workspace.openFolder( event ); },
						disabled: ( !iconsSelected || volumeIcon  || systemDrive )
					},
					{
						name:	i18n( 'menu_delete' ),
						command: function() { Workspace.deleteFile(); },
						disabled: ( !iconsSelected || volumeIcon ) || systemDrive
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
						disabled: !volumeIcon || !canUnmount
					},
					{
						name:   i18n( 'menu_close_idle_connections' ),
						command: function(){
							if( DeepestField && DeepestField.connections )
							{
								var df = DeepestField;
								for( var a in df.connections )
								{
									var d = df.connections[a];
									d.object.close(); // Close connection
									if( d && d.parentNode )
									{
										try
										{
											d.parentNode.removeChild( d );
										}
										catch( e )
										{
										}
									}
								}
							}
						},
						disabled: _cajax_process_count <= 0
					}
				]
			}/*,
			{
				name: i18n( 'menu_bookmarks' ),
				items: Workspace.getBookmarks()
			}*/
		];

		// Generate
		if( !prohibitworkspaceMenu )
		{
			WorkspaceMenu.generate( false, this.menu );
		}

		/*
		TODO: Enable when they work!
		this.menu.push( {
			name: i18n( 'menu_workspheres' ),
			items: [
				{
					name: i18n( 'i18n_worksphere_all' ),
					command: 'worksphere_all'
				},
				{
					name: i18n( 'i18n_worksphere_add' ),
					command: 'worksphere_add'
				}
			]
		} );*/
	},
	// Show the backdrop
	backdrop: function()
	{
		var screens = document.getElementsByClassName( 'Screen' );
		function timeoutScreen( s )
		{
			setTimeout( function()
			{
				s.style.transition = '';
			}, 550 );
		}
		for( var a = 0; a < screens.length; a++ )
		{
			screens[a].style.transition = 'transform 0.5s';
			screens[a].style.transform = 'translate3d(0,' + ( window.innerHeight - 32 + 'px' ) + ',0)';
			timeoutScreen( screens[a] );
		}
	},
	viewDirectory: function( mode )
	{
		if ( !window.currentMovable )
			return false;
		if ( !window.currentMovable.content.directoryview )
			return false;
		
		window.currentMovable.content.directoryview.changed = true;
		window.currentMovable.content.directoryview.listMode = mode;
		
		// Save window storage
		var uid = window.currentMovable.content.uniqueId;
		var d = GetWindowStorage( uid );
		d.listMode = mode;
		
		// Refresh toggle group
		var eles = window.currentMovable.getElementsByClassName( 'ToggleGroup' );
		if( eles )
		{
			eles[0].checkActive( mode );
		}
		
		SetWindowStorage( uid, d );
		window.currentMovable.content.redrawIcons();
	},
	showContextMenu: function( menu, e )
	{
		if( window.isMobile ) return;

		var tr = e.target ? e.target : e.srcElement;

		var findView = false;
		var el = tr;
		while( el != document.body )
		{
			if( el.classList && el.classList.contains( 'Content' ) )
				break;
			if( el.classList && el.classList.contains( 'View' ) )
			{
				findView = el;
				break;
			}
			else if( el.classList && el.classList.contains( 'Task' ) )
			{
				findView = el.view;
				break;
			}
			el = el.parentNode;
		}

		// Check for the window context menu
		if( !menu && tr.classList && findView && globalConfig.workspacecount > 1 )
		{
			menu = [];
			function addWSMenuItem( m, a )
			{
				m.push( {
					name: i18n( 'menu_move_view_to_workspace_' + ( a + 1 ) ),
					command: function()
					{
						findView.windowObject.sendToWorkspace( a );
					}
				} );
			}
			
			for( var a = 0; a < globalConfig.workspacecount; a++ )
			{
				addWSMenuItem( menu, a );
			}
			menu.push( {
				name: i18n( 'menu_close_window' ),
				command: function()
				{
					findView.windowObject.close();
				}
			} );
		}
		// Screen menu
		else if( !menu && ( tr.classList.contains( 'ScreenContent' ) || tr.parentNode.classList.contains( 'ScreenContent' ) ) )
		{
			menu = [
				{
					name: i18n( 'menu_edit_wallpaper' ),
					command: function()
					{
						ExecuteApplication( 'Wallpaper' );
					}
				},
				{
					name: i18n( 'menu_manage_disks' ),
					command: function()
					{
						ExecuteApplication( 'DiskCatalog' );
					}
				},
				{
					name: i18n( 'menu_add_storage' ),
					command: function()
					{
						ExecuteApplication( 'Account', 'addstorage' );
					}
				},
				{
					name: i18n( 'menu_refresh_desktop' ),
					command: function()
					{
						Workspace.refreshDesktop();
					}
				},
			];
		}
		else if( !menu )
		{
			// Make sure the menu is up to date
			var t = tr;
			while( !( t.classList && t.classList.contains( 'Content' ) ) && t.parentNode != document.body )
			{
				t = t.parentNode;
			}
			if( t.checkSelected )
				t.checkSelected();
			Workspace.refreshMenu( true );
			for( var z = 0; z < Workspace.menu.length; z++ )
			{
				if( Workspace.menu[z].name == i18n( 'menu_icons' ) )
				{
					menu = Workspace.menu[z].items;
					
					
					break;
				}
			}
		}

		if( menu )
		{
			var flg = {
				width: 200,
				height: 100,
				top: e.clientY,
				left: e.clientX
			}
			var v = false;
			
			if( Workspace.iconContextMenu )
			{
				v = Workspace.iconContextMenu;
			}
			else v = Workspace.iconContextMenu = new Widget( flg );
			v.dom.innerHTML = '';
			var menuout = document.createElement( 'div' );
			menuout.className = 'MenuItems';
			
			var head = document.createElement( 'p' );
			head.className = 'MenuHeader';
			head.innerHTML = i18n( 'menu_icons' );
			menuout.appendChild( head );

			for( var z = 0; z < menu.length; z++ )
			{
				if( menu[z].divider ) continue;
				var p = document.createElement( 'p' );
				p.className = 'MousePointer MenuItem';
				if( menu[z].disabled )
				{
					p.className += ' Disabled';
				}
				else
				{
					p.cmd = menu[z].command;
					p.onclick = function( event )
					{
						this.cmd( event );
						v.hide();
					}
					p.onmouseup = function( event )
					{
						this.cmd( event );
						v.hide();
					}
				}
				p.innerHTML = menu[z].name;
				menuout.appendChild( p );
			}
			v.dom.appendChild( menuout );
			
			// Show the thing
			v.setFlag( 'height', v.dom.getElementsByTagName( 'div' )[0].offsetHeight );
			v.setFlag( 'left', flg.left );
			v.setFlag( 'top', flg.top );
			v.raise();
			v.show();
		}
	},
	showSearch: function()
	{
		if( !Workspace.sessionId ) return;

		var w = new View( {
			title: i18n( 'i18n_search_files' ),
			width: 480,
			height: 92,
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
		var insensitive = ge( 'SearchCaseSensitive' ).checked ? false : true;
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

						var searchKey = Workspace.searchKeywords[b];

						// Case insensitive search
						if( insensitive )
						{
							searchKey = searchKey.toLowerCase();
							idnt = idnt.toLowerCase();
						}

						if( idnt.indexOf( searchKey ) >= 0 )
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
		this.getMountlist(function(data)
		{
			var p;
			for ( p = 0; p < data.length; p++ )
			{
				doSearch(data[p].Path);
			}
		});
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
	launch: function( app )
	{
		var args = false;
		if( app.indexOf( ' ' ) > 0 )
		{
			app = app.split( ' ' );
			args = '';
			for( var a = 0; a < app.length; a++ )
				args += ( a > 0 ? ' ' : '' ) + app[a];
			app = app[0];
		}
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' ) return;
			try
			{
				var js = JSON.parse( d );
				for( var a = 0; a < js.length; a++ )
				{
					if( js[a].Name.toLowerCase() == app.toLowerCase() )
					{
						return ExecuteApplication( js[a].Name, args );
					}
				}
				ExecuteApplication( app, args );
			}
			catch( e )
			{
				ExecuteApplication( app, args );
			}
		}
		m.execute( 'listuserapplications' );
	},
	showLauncher: function()
	{
		if( !Workspace.sessionId ) return;

		var w = new View( {
			title: i18n( 'menu_execute_command' ),
			width: 320,
			height: 80,
			'min-height': 80,
			'max-height': 80,
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
			ge( 'WorkspaceRunCommand' ).select();
			ge( 'WorkspaceRunCommand' ).focus();
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
		Workspace.mainDock.refresh();
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
		Workspace.mainDock.refresh();
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
		if( !window.currentMovable || ( window.currentMovable && !window.currentMovable.content.refresh ) )
			return;

		// Detached refresh object
		var rObj = {
			refresh: window.currentMovable.content.refresh,
			fileInfo: window.currentMovable.content.fileInfo
		};

		if( w )
		{
			var files = [];
			var eles = w.getElementsByTagName( 'div' );
			for( var a = 0; a < eles.length; a++ )
			{
				if( eles[a].classList.contains( 'Selected' ) )
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
						// Open a window
						var v = new View( {
							title: i18n( 'i18n_deleting_files' ),
							width: 320,
							height: 100
						} );
						
						// Build the UI
						var cont = document.createElement( 'div' );
						cont.className = 'ContentFull Frame';
						cont.style.top = '10px';
						cont.style.left = '10px';
						cont.style.width = 'calc(100% - 20px)';
						cont.style.height = '30px';
						
						var frame = document.createElement( 'div' );
						frame.className = 'Groove BackgroundHighlight Rounded ContentFull';
						frame.style.top = '1px';
						frame.style.left = '1px';
						frame.style.width = 'calc(100% - 2px)';
						frame.style.height = 'calc(100% - 2px)';
						
						var bar = document.createElement( 'div' );
						bar.className = 'Bar Rounded ContentFull';
						bar.style.top = '1px';
						bar.style.left = '1px';
						bar.style.width = '0';
						bar.style.height = 'calc(100% - 2px)';
						
						var text = document.createElement( 'div' );
						bar.appendChild( text );
						
						cont.appendChild( frame );						
						cont.appendChild( bar );
						
						var stop = false;
						
						var btn = document.createElement( 'button' );
						btn.innerHTML = i18n( 'i18n_cancel' );
						btn.className = 'Button IconSmall fa-remove NoMargins';
						btn.style.position = 'absolute';
						btn.style.left = '10px';
						btn.style.top = '55px';
						btn.onclick = function()
						{
							stop = true;
						}
						
						v.content.appendChild( cont );
						v.content.appendChild( btn );
						
						// Actually do the delete
						function doDeleteFiles( files, index )
						{
							// 
							if( stop || index == files.length )
							{
								// All done!
								v.close();
								return;
							}
							
							var file = files[ index ];
							
							// callback
							function nextFile()
							{ 
								var pct = Math.floor( ( index + 1 ) / files.length * 100 ) + '%';
								Workspace.refreshWindowByPath( file.fileInfo.Path );
								bar.style.width = 'calc(' + pct + ' - 2px)';
								text.innerHTML = pct;
								doDeleteFiles( files, index + 1 ); 
							}
							
							// Database ID
							if( file.fileInfo.ID )
							{
								file.door.dosAction( 'delete', { 
									path: file.fileInfo.Path, pathid: file.fileInfo.ID + ( file.fileInfo.Type == 'Directory' ? '/' : '' ) 
								}, nextFile );
							}
							// Path
							else
							{
								files[a].door.dosAction( 'delete', { path: file.fileInfo.Path }, nextFile );
							}
						}
						doDeleteFiles( files, 0 );
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
		DeepestField.redraw();
	},
	// Let's get some updates available to the user from Friend Software Labs!
	informationWindow: function( force )
	{
		if( !Workspace.sessionId ) return;

		if( this.infoWindow )
			return;

		function showitnow()
		{
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
			Workspace.infoWindow = w;

			var j = new File( '/webclient/updates.html' );
			j.onLoad = function( data )
			{
				var rels = document.getElementsByTagName( 'link' );
				var replaced = false;
				for( var a = 0; a < rels.length; a++ )
				{
					if( rels[a].href.indexOf( 'theme' ) > 0 )
					{
						data = data.split( '{baseStyle}' ).join( '<link rel="stylesheet" href="' + rels[a].href + '"/>' );
						data = data.split('{hideOnLoad}' ).join( ( Workspace.hideInfoWindow ? ' checked="checked"' : '' ) );
						replaced = true;
						break;
					}
				}
				if( !replaced ) data = data.split( '{baseStyle}' ).join( '' );
				w.setRichContent( data );
			}
			j.load();
		}

		if( force )
			return showitnow();

		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e == 'fail' )
			{
				showitnow();
			}

			var infosetting = false;
			try{
				infosetting = JSON.parse( d );
			}
			catch(e)
			{
				return;
			}

			Workspace.hideInfoWindow = infosetting.infowindow == 'false' ? true : false;

		}
		m.execute( 'getsetting', { setting: 'infowindow' } );
	},
	disableInfoWindow: function()
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				//dont close it...
				//Workspace.infoWindow.close();
				//Workspace.infoWindow = null;
			}
		}
		m.execute( 'setsetting', { setting: 'infowindow', data: 'false' } );
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
		this.fullscreenObject = el.fullscreenEnabled ? el : null;
	},
	// Set up user account
	accountSetup: function( what )
	{
		ExecuteApplication( 'Account' );
	},
	//try to run a call and if does not get back display offline message....
	checkServerConnectionHTTP: function()
	{
		// Just make sure we don't pile on somehow...
		if( Workspace.serverHTTPCheckModule )
		{
			Workspace.serverHTTPCheckModule.destroy();
			Workspace.serverHTTPCheckModule = null;
		}
		var m = new Module('system');
		m.onExecuted = function( e, d )
		{
			if( e == 'fail' ) 
			{
				if( d == false ) return;
			}
			Workspace.serverIsThere = true;
			Workspace.workspaceIsDisconnected = false;
		}
		Workspace.serverIsThere = false;
		Workspace.serverHTTPCheckModule = m;
		m.forceHTTP = true;
		m.execute( 'getsetting', { setting: 'infowindow' } );
		return setTimeout( 'Workspace.checkServerConnectionResponse();', 1000 );
	},
	checkServerConnectionResponse: function()
	{
		if( Workspace.serverIsThere == false )
		{
			document.body.classList.add( 'Offline' );
			if( Workspace.screen )
				Workspace.screen.displayOfflineMessage();
			Workspace.workspaceIsDisconnected = true;
		}
		else
		{
			document.body.classList.remove( 'Offline' );
			if( Workspace.screen )
				Workspace.screen.hideOfflineMessage();
			Workspace.workspaceIsDisconnected = false;
		}
	},
	buildWebApplication: function()
	{
		var self = Workspace;

		if ( self.createWebAppView )
			return;

		var v = new View(
		{
			title: i18n( 'i18n_buildWebApp' ),
			width: 384,
			height: 680,
			id: 'build_web_app'
		} );
		v.onClose = function(){ self.createWebAppView = false; }
		self.createWebAppView = v;
		self.createWebAppView.iconPath = '/webclient/gfx/icons/waIcon.png';
		self.createWebAppView.previewPath = '/webclient/gfx/icons/waPreview.png';

		var f = new File( 'System:templates/build_webapp.html' );
		f.i18n();
		f.onLoad = function( data )
		{
			v.setContent( data );
		}
		f.load();
	},
	changeWebAppIcon: function()
	{
		var self = Workspace;
		var description =
		{
			triggerFunction: function( item )
			{
				if ( item )
				{
					self.createWebAppView.iconPath = item[ 0 ].Path;
					document.getElementById( 'waIcon' ).src = item[ 0 ].Path;
				}
			},
			path: "Home:Icons/Apps",
			type: "load",
			title: i18n( 'i18n_waChangeWebAppIconTitle' ),
			filename: ""
		}
		var d = new Filedialog( description );

	},
	changeWebAppPreview: function()
	{
		var self = Workspace;
		var description =
		{
			triggerFunction: function( item )
			{
				if ( item )
				{
					self.createWebAppView.previewPath = item[ 0 ].Path;
					document.getElementById( 'waPreview' ).src = item[ 0 ].Path;
				}
			},
			path: "Home:Icons/Previews",
			type: "load",
			title: i18n( 'i18n_waChangeWebAppPreviewTitle' ),
			filename: ""
		}
		var d = new Filedialog( description );
	},
	createWebApplication: function()
	{
		var self = Workspace;
		var f = new File( 'System:js/webapp_template.js' );
		f.onLoad = function( data )
		{
			var template = data;

			// Gets values from dialog box
			var url = document.getElementById( 'waUrl' ).value;
			var name = document.getElementById( 'waName' ).value;
			var width = document.getElementById( 'waWidth' ).value;
			var height = document.getElementById( 'waHeight' ).value;
			var type  = document.getElementById( 'waType' ).value;
			var author  = document.getElementById( 'waAuthor' ).value;
			var description  = document.getElementById( 'waDescription' ).value;
			var email  = document.getElementById( 'waEmail' ).value;

			// Checks values
			var OK = false;
			do
			{
				if ( url.substring( 0, 7 ) != 'http://' && url.substring( 0, 8 ) != 'https://' )
				{
					Alert( i18n( 'i18n_waAlert' ), i18n( 'i18n_waWrongUrl' ) );
					break;
				}
				if ( name.length == 0 )
				{
					Alert( i18n( 'i18n_waAlert' ), i18n( 'i18n_waWrongName' ) );
					break;
				}
				var flag = true;
				if ( width.length > 0 )
				{
					if ( parseInt( width, 10 ) < 32 )
						flag = false;
				}
				if ( !flag )
				{
					Alert( i18n( 'i18n_waAlert' ), i18n( 'i18n_waWrongWidth' ) );
					break;
				}
				if ( height.length > 0 )
				{
					if ( parseInt( height, 10 ) < 32 )
						flag = false;
				}
				if ( !flag )
				{
					Alert( i18n( 'i18n_waAlert' ), i18n( 'i18n_waWrongHeight' ) );
					break;
				}
				OK = true;
			} while( false );
			if ( OK )
			{
				var types =
				[
					'Internet',
					'Games',
					'Office',
					'Graphics',
					'Programming'
				];

				// Replace strings in template
				var about0 = i18n( 'i18n_waAbout0' );
				var about1 = i18n( 'i18n_waAbout1' );
				var close = i18n( 'i18n_close' );
				var file = i18n( 'menu_file' );
				template = Workspace.replaceString( template, 'title_holder', name );
				template = Workspace.replaceString( template, 'url_holder', url );
				template = Workspace.replaceString( template, 'width_holder', width );
				template = Workspace.replaceString( template, 'height_holder', height );
				template = Workspace.replaceString( template, 'category_holder', types[ type ] );
				template = Workspace.replaceString( template, 'author_holder', author );
				template = Workspace.replaceString( template, 'about0_holder', about0 );
				template = Workspace.replaceString( template, 'about1_holder', about1 );
				template = Workspace.replaceString( template, 'about2_holder', author );
				template = Workspace.replaceString( template, 'close_holder', close );
				template = Workspace.replaceString( template, 'description_holder', description );
				template = Workspace.replaceString( template, 'email_holder', email );
				template = Workspace.replaceString( template, 'file_holder', file );
				template = Workspace.replaceString( template, 'screen_holder', 'false' );

				// Open a path file dialog and return selected files
				var description =
				{
					triggerFunction: function( path )
					{
						if ( typeof path === 'string' )
						{
							// Cut and save files
							var cut = Workspace.cutString( template, '<CUTMAIN>', '<ENDCUTMAIN>' );
							var fl = new File( path + name + '.jsx' );
							fl.save( cut );
							cut = Workspace.cutString( template, '<CUTINDEX>', '<ENDCUTINDEX>' );
							var fl = new File( path + 'index.html' );
							fl.save( cut );
							cut = Workspace.cutString( template, '<CUTABOUT>', '<ENDCUTABOUT>' );
							var fl = new File( path + 'about.html' );
							fl.save( cut );
							cut = Workspace.cutString( template, '<CUTCONFIG>', '<ENDCUTCONFIG>' );
							var fl = new File( path + 'Config.conf' );
							fl.save( cut );
							
							// Copy the icon
							var srcePath = self.createWebAppView.iconPath;
							var door = new Door( srcePath );
							var destPath = path + 'icon.png';
							door.dosAction( 'copy', { from: srcePath, to: destPath } );

							// Copy the preview
							srcePath = self.createWebAppView.previewPath;
							door = new Door( srcePath );
							destPath = path + 'preview.png';
							door.dosAction( 'copy', { from: srcePath, to: destPath } );

							// Information message
							Alert( i18n( 'i18n_waAlert' ), i18n( 'i18n_waCreated' ) );
						}
					},
					path: "Mountlist:",
					type: "path",
					title: i18n( 'i18n_waFileSelectorTitle' ),
					filename: ""
					//mainView: 'build_web_app'
				}
				var d = new Filedialog( description );
			}
		}
		f.load();
	},
	replaceString: function( template, search, replace )
	{
		var pos = template.indexOf( search );
		while( pos >= 0 )
		{
			template = template.substring( 0, pos ) + replace + template.substring( pos + search.length );
			pos = template.indexOf( search );
		}
		return template;
	},
	cutString: function( template, start, end )
	{
		var pStart = template.indexOf( start );
		if ( pStart >= 0)
		{
			var pEnd = template.indexOf( end );
			if ( pEnd >= 0 )
			{
				return template.substring( pStart + start.length, pEnd );
			}
		}
		return false;
	}
};

Doors = Workspace;

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
function DoorsKeyUp( e )
{
	Workspace.shiftKey = e.shiftKey;
	Workspace.ctrlKey = e.ctrlKey;
	Workspace.altKey = e.altKey;
	Workspace.metaKey = e.metaKey;
}
function DoorsKeyDown( e )
{
	var w = e.which ? e.which : e.keyCode;
	var tar = e.target ? e.target : e.srcElement;
	Workspace.shiftKey = e.shiftKey;
	Workspace.ctrlKey = e.ctrlKey;
	Workspace.altKey = e.altKey;
	Workspace.metaKey = e.metaKey;
	
	if( e.ctrlKey || e.metaKey )
	{
		if( w == 65 )
		{
			if( currentMovable && currentMovable.content.directoryview )
			{
				currentMovable.content.directoryview.SelectAll();
				return cancelBubble( e );
			}
		}
	}
	
	if( ( e.shiftKey && e.ctrlKey ) || e.metaKey )
	{
		if( globalConfig && globalConfig.workspacecount > 1 )
		{
			switch( w )
			{
				// ws 1
				case 49:
					Workspace.switchWorkspace( 0 );
					return cancelBubble( e );
				// ws 1
				case 50:
					Workspace.switchWorkspace( 1 );
					return cancelBubble( e );
				// ws 1
				case 51:
					Workspace.switchWorkspace( 2 );
					return cancelBubble( e );
				// ws 1
				case 52:
					Workspace.switchWorkspace( 3 );
					return cancelBubble( e );
				// ws 1
				case 53:
					Workspace.switchWorkspace( 4 );
					return cancelBubble( e );
				// ws 1
				case 54:
					Workspace.switchWorkspace( 5 );
					return cancelBubble( e );
				// ws 1
				case 55:
					Workspace.switchWorkspace( 6 );
					return cancelBubble( e );
				// ws 1
				case 56:
					Workspace.switchWorkspace( 7 );
					return cancelBubble( e );
				// ws 1
				case 57:
					Workspace.switchWorkspace( 8 );
					return cancelBubble( e );		
			}
		}
	}

	if( !w || !e.ctrlKey )
	{
		switch( w )
		{
			// Escape means try to close the view
			case 27:
				// Inputs don't need to close the view
				if( tar && ( tar.nodeName == 'INPUT' || tar.nodeName == 'SELECT' || tar.nodeName == 'TEXTAREA' ) )
				{
					tar.blur();
					return;
				}
				if( mousePointer.elements.length )
				{
					mousePointer.elements = [];
					mousePointer.dom.innerHTML = '';
					mousePointer.drop();
					if( currentMovable && currentMovable.content )
						currentMovable.content.refresh();
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

// TODO: Reevalute if we even need this
/*// Traps pasting to clipboard
document.addEventListener( 'paste', function( evt )
{
	if( typeof friend != undefined && typeof friend.pasteClipboard == 'function' ) 
		friend.pasteClipboard( evt );
} );

// paste handler. check Friend CB vs System CB.

function friendWorkspacePasteListener( evt )
{
	var mimetype = '';
	var cpd = '';

	if( !evt.clipboardData )
	{
		return true;
	}
	else if( evt.clipboardData.types.indexOf( 'text/plain' ) > -1 )
	{
		mimetype = 'text/plain';
	}

	//we only do text handling here for now
	if( mimetype != '' )
	{
		cpd = evt.clipboardData.getData( mimetype );

		//console.log('compare old and new',cpd,friend.prevClipboard,friend.clipboard);
		if( friend.prevClipboard != cpd )
		{
			friend.prevClipboard = friend.clipboard;
			friend.clipboard = cpd;
		}
	}
	return true;
}*/

function WindowResizeFunc()
{
	Workspace.redrawIcons();
	Workspace.repositionWorkspaceWallpapers();
	if( isMobile && Workspace.widget )
		Workspace.widget.setFlag( 'width', window.innerWidth );
}

function InitWorkspaceEvents()
{
	if( window.attachEvent )
	{
		window.attachEvent( 'onmouseout', DoorsOutListener, false );
		window.attachEvent( 'onmouseleave', DoorsLeaveListener, false );
		window.attachEvent( 'onresize', WindowResizeFunc );
		window.attachEvent( 'onkeydown', DoorsKeyDown );
	}
	else
	{
		window.addEventListener( 'mouseout', DoorsOutListener, false );
		window.addEventListener( 'mouseleave', DoorsLeaveListener, false );
		window.addEventListener( 'resize', WindowResizeFunc );
		window.addEventListener( 'keydown', DoorsKeyDown, false );
		//window.addEventListener( 'paste', friendWorkspacePasteListener, false);
	}
}

function InitWorkspaceNetwork()
{
	var wsp = Workspace;
	
	if( wsp.workspaceNetworkInitialized ) return;
	wsp.workspaceNetworkInitialized = true;
	
	//check for server....
	wsp.httpCheckConnectionInterval = setInterval('Workspace.checkServerConnectionHTTP()', 5000 );

	// Establish a websocket connection to the core
	if( !wsp.conn && wsp.sessionId && window.FriendConnection )
	{
		wsp.initWebSocket();
	}

	wsp.checkFriendNetwork();

	if( window.PouchManager && !this.pouchManager )
		this.pouchManager = new PouchManager();
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
		title: i18n( 'about_friendup' ) + ' v1.1.1',
		width: 540,
		height: 560,
		id: 'about_friendup'
	} );

	v.setRichContentUrl( '/webclient/templates/about.html', false, null, null, function()
	{
		var buildInfo = '<div id="buildInfo">no build information available</div>';
		if( Workspace.systemInfo && Workspace.systemInfo.FriendCoreBuildDate )
		{
			buildInfo = '<div id="buildInfo">';
			buildInfo += '	<div class="item"><span class="label">Build date</span><span class="value">'+ Workspace.systemInfo.FriendCoreBuildDate +'</span></div>';
			if( Workspace.systemInfo.FriendCoreBuildDate ) buildInfo += '	<div class="item"><span class="label">Version</span><span class="value">'+ Workspace.systemInfo.FriendCoreVersion +'</span></div>';
			if( Workspace.systemInfo.FriendCoreBuild ) buildInfo += '	<div class="item"><span class="label">Build</span><span class="value">'+ Workspace.systemInfo.FriendCoreBuild +'</span></div>';

			buildInfo += '<div style="clear: both"></div></div>';
		}

		var aboutFrame = ge('about_friendup').getElementsByTagName('iframe')[0];
		aboutFrame.contentWindow.document.getElementById('fc-info').innerHTML = buildInfo;
		aboutFrame.setAttribute('scrolling', 'yes');

	} );
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
				setTimeout( function()
				{
					Workspace.refreshDesktop( false, true );
				}, 500 );
			}
		}
		m.execute( 'setsetting', {
			setting: 'accepteula',
			data:    'true'
		} );

		//call device refresh to make sure user get his devices...
		var dl = new FriendLibrary( 'system.library' );
		dl.addVar( 'visible', true );
		dl.forceHTTP = true;
		dl.onExecuted = function(e,d)
		{
			//console.log( 'First login. Device list refreshed.', e, d );
		};
		dl.execute( 'device/refreshlist' );
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



// SAS ID
function handleSASRequest( e )
{
	var title = 'Shared app invite from ' + e.owner;
	Confirm( title, e.message, confirmBack );

	function confirmBack( res )
	{
		if ( res )
			accept( e );
		else deny( e.sasid );
	}

	function accept( data )
	{
		ExecuteApplication( e.appname, JSON.stringify( e ) );
	}

	function deny( sasid )
	{
		var dec = {
			path : 'system.library/app/decline/',
			data : {
				sasid : sasid,
			},
		};
		Workspace.conn.request( dec, unBack );
		function unBack( res )
		{
			console.log( 'Workspace.handleSASRequest - req denied, decline, result', res );
		}
	}
}

function handleServerMessage( e )
{
	if( e.message && e.appname )
	{
		var apps = ge( 'Tasks' ).getElementsByTagName( 'iframe' );
		for( var a = 0; a < apps.length; a++ )
		{
			// TODO: Have per application permissions here..
			// Not all applications should be able to send messages to
			// all other applications...
			if( apps[a].applicationDisplayName == e.appname )
			{
				var nmsg = {
					command: 'notify',
					applicationId: apps[a].applicationId,
					authId: e.message.authId,
					method: 'servermessage',
					message: e.message
				};				
				apps[a].contentWindow.postMessage( nmsg, '*' );
			}
		}
	}
	else
	{
		var msg = {
			title : 'Unhandled server message',
			text : 'The server could not interpret incoming message.'
		};
		Notify( msg );
	}
}

function handleServerNotice( e )
{
	var msg = {
		title : 'Server notice - from: ' + e.username,
		text : e.message,
	};
	Notify( msg, notieBack, clickCallback );

	function notieBack( e )
	{
		console.log( 'handleServerNotice - Notify callback', e );
	}

	function clickCallback( e )
	{
		console.log( 'handleServerNotice - Click callback', e );
	}
}

for( var a in WorkspaceInside )
	Workspace[a] = WorkspaceInside[a];
delete WorkspaceInside;
InitDynamicClassSystem();

