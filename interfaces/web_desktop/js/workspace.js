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
	pouchManager: null,
	deviceid: GetDeviceId(),
	
	preinit: function()
	{
		var img = new Image();
		img.src = '/webclient/theme/loginimage.jpg';
		img.onload = function()
		{
			Workspace.init();
		}
	},
	init: function()
	{
		// First things first
		if( this.initialized ) return;
		
		// Preload some images
		var imgs = [ '/webclient/gfx/system/offline_16px.png' ];
		this.imgPreload = [];
		for( var a = 0; a < imgs.length; a++ )
		{
			var i = new Image();
			i.src = imgs[a];
			this.imgPreload.push( i );
		}
		
		// Wait for load
		if( typeof( InitWindowEvents ) == 'undefined' || typeof( InitGuibaseEvents ) == 'undefined' )
		{
			return setTimeout( 'Workspace.init()', 50 );
		}
		
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
		if( typeof( ge ) == 'undefined' || !document.body.classList.contains( 'Inside' ) ) 
			return setTimeout ( 'Workspace.init()', 5 );
		
		// We passed!
		this.initialized = true;
		
		// Do the init!
		window.addEventListener( 'beforeunload', Workspace.leave, true );
		
		this.loadSystemInfo();
		
		InitWindowEvents();
		InitWorkspaceEvents();
		InitGuibaseEvents();
		
		//check for server....
		Workspace.httpCheckConnectionInterval = setInterval('Workspace.checkServerConnectionHTTP()', 5000 );
		
		// Establish a websocket connection to the core
		if( !this.conn && this.sessionId && window.FriendConnection )
		{
			var conf = {
				onstate : onState,
				onend   : onEnd,
			};
			this.conn = new FriendConnection( conf );
			this.conn.on( 'sasid-request', handleSASRequest ); // Shared Application Session
			this.conn.on( 'server-notice', handleServerNotice );
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
		}
		
		// connect to FriendNetwork
		if ( this.sessionId && window.FriendNetwork ) {
			var host = document.location.hostname + ':6514';
			if ( 'http:' === document.location.protocol )
				host = 'ws://' + host;
			else
				host = 'wss://' + host;
			
			var hostMeta =
			{
				name        : this.loginUsername,
				description : this.loginUsername + "'s machine",
				apps        : [],
				imagePath   : 'friend://path.to/image?', // ( not what a real path// looks like, probably? )
			};
			window.FriendNetwork.init( host, this.sessionId, hostMeta );
		}
		
		
		if( window.PouchManager && !this.pouchManager )
			this.pouchManager = new PouchManager();
		
		var dapis = document.createElement( 'script' );
		dapis.src = '/system.library/module/?module=system&command=doorsupport&sessionid=' + this.sessionId;
		document.getElementsByTagName( 'head' )[0].appendChild( dapis ); 
		
		// Init the deepest field
		DeepestField.init();
		
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
		
		// Setup default Doors screen
		var wbscreen = new Screen( {
			title: 'Friend Workspace v1.0.0',
			id:	'DoorsScreen',
			extra: Workspace.fullName,
			taskbar: true,
			scrolling: false
		} );
		
		// Make links to screen on this object
		this.screen = wbscreen;
		this.screenDiv = wbscreen.div;
		
		wbscreen.div.addEventListener( 'mousedown', function()
		{
			var wd = wbscreen.div.screenTitle.getElementsByClassName( 'Extra' )[0].widget;
			if( wd )
			{
				wd.hide();
				wd.lower();
				wd.showing = false;
			}
		} );
		
		// Widget for various cool facts!
		wbscreen.div.screenTitle.getElementsByClassName( 'Extra' )[0].onmouseover = function( e )
		{
			this.classList.add( 'Hover' );
		}
		wbscreen.div.screenTitle.getElementsByClassName( 'Extra' )[0].onmouseout = function( e )
		{
			this.classList.remove( 'Hover' );
		}
		
		// In desktop mode, show the calendar
		if( !window.isMobile )
		{
			wbscreen.div.screenTitle.getElementsByClassName( 'Extra' )[0].onclick = function( e )
			{
				if( !this.widget )
				{
					o = {
						width: 400,
						height: 300,
						valign: 'top',
						halign: 'right',
						scrolling: false,
						autosize: true
					};
					this.widget = new Widget( o );
					this.widget.dom.style.transition = 'height 0.25s';
				}
				if( !this.widget.showing )
				{
					Workspace.refreshExtraWidgetContents();
					this.widget.raise();
					this.widget.show();
				}
				else
				{
					this.widget.showing = false;
					this.widget.hide();
					this.widget.lower();
				}
			}
			wbscreen.div.screenTitle.getElementsByClassName( 'Extra' )[0].classList.add( 'MousePointer' );
		}
		// Widget for mobile mode!
		else if( !this.widget )
		{
			o = {
				width: window.innerWidth,
				height: 32,
				valign: 'top',
				halign: 'center',
				scrolling: false,
				autosize: false,
				animate: true
			};
			this.widget = new Widget( o, ge( 'DeepestField' ) );
			this.refreshExtraWidgetContents();
			this.widget.show();
			this.widget.dom.addEventListener( 'touchstart', function( evt )
			{
				Workspace.widget.setFlag( 'height', window.innerHeight - 100 );
				Workspace.widget.touchDown = { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
				// Timeout for slide
				Workspace.widget.tdtimeout = setTimeout( function()
				{
					Workspace.widget.touchDown = false;
					Workspace.widget.tdtimeout = false;
				}, 500 );
				cancelBubble( evt );
			} );
			this.widget.dom.addEventListener( 'touchmove', function( evt )
			{
				if( Workspace.widget.touchDown )
				{
					if( Workspace.widget.touchDown.y - evt.touches[0].clientY > 10 )
					{
						Workspace.widget.setFlag( 'height', 32 );
						Workspace.widget.touchDown = false;
						clearTimeout( Workspace.widget.tdtimeout );
						Workspace.widget.tdtimeout = false;
						cancelBubble( evt );
					}
				}
			} );
		}
		
		// Setup clock
		function clock()
		{
			var d = new Date();
			var e = '';
			if( Workspace.workspaceIsDisconnected ) e += '<span class="Offline">'+ i18n('i18n_server_disconnected') +'</span> &nbsp; &nbsp;';
			e +=    StrPad( d.getHours(), 2, '0' ) + ':' + 
					   StrPad( d.getMinutes(), 2, '0' ) + ':' + 
					   StrPad( d.getSeconds(), 2, '0' );
			e +=    ' ' + StrPad( d.getDate(), 2, '0' ) + '/' + 
					   StrPad( d.getMonth() + 1, 2, '0' ) + '/' + d.getFullYear();
			e += ' &nbsp; &nbsp; ' + Workspace.fullName;
			wbscreen.setFlag( 'extra', e );
		}
		this.clockInterval = setInterval( clock, 1000 );
		
		setTimeout( function(){ Workspace.informationWindow(); }, 1000 );
		
		// Recall wallpaper from settings
		this.refreshUserSettings( function(){ Workspace.refreshDesktop(); } );
		
		// Create desktop
		this.directoryView = new DirectoryView( wbscreen.contentDiv );
		
		// Create default desklet
		var mainDesklet = CreateDesklet( this.screenDiv, 64, 480, 'right' );
		
		// Add desklet to dock
		this.mainDock = mainDesklet;
		this.mainDock.dom.oncontextmenu = function( e )
		{
			var men = [
				{
					name: i18n( 'i18n_edit_dock' ),
					command: function()
					{
						ExecuteApplication( 'Dock' );
					}
				}
			];
			Workspace.showContextMenu( men, e );
		}
		this.reloadDocks();
	},
	encryption: {
		
		fcrypt: fcrypt,
		keyobject: false,
		
		keys: {
			client: false,
			server: false
		},
		
		setKeys: function( u, p )
		{
			if( typeof( this.fcrypt ) != 'undefined' )
			{
				p = ( !p || p.indexOf('HASHED') == 0 ? p : ( 'HASHED' + Sha256.hash( p ) ) );
				
				var seed = ( u && p ? Sha256.hash( u + ':' + p ) : false );
				
				var keys = ApplicationStorage.load( { applicationName : 'Workspace' } );
				
				if( !keys || ( keys && !keys.privatekey ) || ( keys && keys.recoverykey != seed ) )
				{
					this.keyobject = this.fcrypt.generateKeys( false, false, false, seed );
					
					keys = this.fcrypt.getKeys( this.keyobject );
				}
				
				if( keys )
				{
					this.keys.client = {
						privatekey  : this.fcrypt.encodeKeyHeader( keys.privatekey ),
						publickey   : this.fcrypt.encodeKeyHeader( keys.publickey ),
						recoverykey : keys.recoverykey
					};
				}
				
				console.log( '--- Workspace.keys ---', this.keys );
				
				return this.keys;
			}
			
			return false;
		},
		
		encryptRSA: function( str, publickey )
		{
			if( typeof( this.fcrypt ) != 'undefined' )
			{
				return this.fcrypt.encryptRSA( str, ( publickey ? publickey : this.keys.server.publickey ) );
			}
			
			return false;
		},
		
		decryptRSA: function( cipher, privatekey )
		{
			if( typeof( this.fcrypt ) != 'undefined' )
			{
				return this.fcrypt.decryptRSA( cipher, ( privatekey ? privatekey : this.keys.client.privatekey ) );
			}
			
			return false;
		},
		
		encryptAES: function( str, publickey )
		{
			if( typeof( this.fcrypt ) != 'undefined' )
			{
				return this.fcrypt.encryptAES( str, ( publickey ? publickey : this.keys.server.publickey ) );
			}
			
			return false;
		},
		
		decryptAES: function( cipher, privatekey )
		{
			if( typeof( this.fcrypt ) != 'undefined' )
			{
				return this.fcrypt.decryptAES( cipher, ( privatekey ? privatekey : this.keys.client.privatekey ) );
			}
			
			return false;
		},
		
		encrypt: function( str, publickey )
		{
			if( typeof( this.fcrypt ) != 'undefined' )
			{
				var encrypted = this.fcrypt.encryptString( str, ( publickey ? publickey : this.keys.server.publickey ) );
				
				if( encrypted && encrypted.cipher )
				{
					return encrypted.cipher;
				}
			}
			
			return false;
		},
		
		decrypt: function( cipher, privatekey )
		{
			if( typeof( this.fcrypt ) != 'undefined' )
			{
				var decrypted = this.fcrypt.decryptString( cipher, ( privatekey ? privatekey : this.keys.client.privatekey ) );
				
				if( decrypted && decrypted.plaintext )
				{
					return decrypted.plaintext;
				}
			}
			
			return false;
		}
	},
	terminateSession: function( sess, dev )
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
								sessionList[b].sessionid + '\', \'' + sessionList[b].deviceidentity + '\')">&nbsp;' + svn + '</p>' );
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
					var wd = Ge( 'DoorsScreen' ).screenTitle.getElementsByClassName( 'Extra' )[0].widget;
					wd.hide();
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
		f.onExecuted = function( e, d )
		{
			var rs = false;
			try { rs = eval(e); }
			catch(e) { console.log('unexpected response from server',e); }
			Workspace.systemInfo = rs;
		}
		f.execute( 'admin', {command:'info'} );	
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
				if( window.isMobile )
				{
					globalConfig.viewList = 'separate';
				}
				else if( dat.windowlist )
				{
					globalConfig.viewList = dat.windowlist;
					document.body.setAttribute( 'viewlist', dat.windowlist ); // Register for styling
				}
				
				// Our avatar!
				if( dat.avatar )
				{
					if( DeepestField.hiddenBuffer )
					{
						var i = new Image();
						i.src = getImageUrl( dat.avatar );
						i.onload = function()
						{
							DeepestField.avatar = i;
							DeepestField.redraw();	
						}
						DeepestField.hiddenBuffer.appendChild( i );
					}
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
				
				PollTaskbar();
			}
			else
			{
				Workspace.wallpaperImage = '/webclient/gfx/theme/default_login_screen.jpg';
				Workspace.windowWallpaperImage = '';
			}
			if( callback && typeof( callback ) == 'function' ) callback();
		}
		m.execute( 'getsetting', { settings: [ 'avatar', 'wallpaperdoors', 'wallpaperwindows', 'language', 'menumode', 'startupsequence', 'navigationmode', 'windowlist', 'focusmode' ] } );
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
	reloadDocks: function()
	{
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
							if( ele.Icon.indexOf( ':' ) > 0 )
								icon = getImageUrl( ele.Icon );
							else icon = ele.Icon;
						}
					
						var ob = { 
							exe   : ele.Name,
							type  : ele.Type,
							src   : icon,
							'title' : ele.Title ? ele.Title : ele.Name
						};
						// For Linux apps..
						if( ele.Name.substr( 0, 7 ) == 'native:' )
						{
							var tmp = ob.exe.split( 'native:' )[1];
							ob.click = genFunc( tmp );
						}
					
						Workspace.mainDock.addLauncher( ob );
					}
				}
				dm.execute( 'getdock', { dockid: '0' } );
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
			width: 320,
			'min-width': 290,
			'max-width': 320,
			height: 220,
			'min-height': 220,
			'resize': false,
			title: 'Login to FriendUP',
			close: false,
			login: true,
			theme: 'login'
		} );
		lp.setRichContentUrl( '/loginprompt' );
		Workspace.loginPrompt = lp;
	
		// Show it
		this.showDesktop();
	},
	// When session times out, use log in again... 
	relogin: function()
	{
		delete Workspace.conn;
		delete Workspace.sessionId;
		Workspace.login( Workspace.loginUsername, Workspace.loginPassword );
		return;
	},
	renewAllSessionIds: function()
	{
		// Check if there's a queue of objects waiting to run
		if( friend.cajax && friend.cajax.length )
		{
			for( var a = 0; a < friend.cajax.length; a++ )
			{
				friend.cajax[a].addVar( 'sessionid', Workspace.sessionId );
				friend.cajax[a].open();
				friend.cajax[a].send();
			}
			friend.cajax = [];
		}
	},
	login: function( u, p, r, callback, ev )
	{
		// Reset some options
		if( ev && ev.shiftKey )
			this.themeOverride = 'friendup';
	
		if( GetUrlVar( 'interface' ) )
		{
			switch( GetUrlVar( 'interface' ) )
			{
				case 'native':
					Workspace.interfaceMode = 'native';
					break;
				default:
					break;
			}
		}
		
		// TODO: If we have sessionid - verify it through ajax.
		
		if( this.sessionId )
		{
			if( callback && typeof( callback ) == 'function' ) callback( true );
			return true;
		}
		
		if( GetUrlVar( 'noleavealert' ) )
		{
			Workspace.noLeaveAlert = true;
		}
		
		// Require username and pw to login
		if( !u || !p )
		{
			// Login by url vars
			if( GetUrlVar( 'username' ) && GetUrlVar( 'password' ) )
			{
				return Workspace.login( GetUrlVar( 'username' ), GetUrlVar( 'password' ) );
			}
			
			if( callback && typeof( callback ) == 'function' ) callback( false );
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
			
			this.encryption.setKeys( this.loginUsername, this.loginPassword );
			
			/*
				r = remember me set....
			*/
			if( r )
			{
				if( this.encryption.keys.client )
				{
					ApplicationStorage.save( {
						privatekey  : this.encryption.keys.client.privatekey,
						publickey   : this.encryption.keys.client.publickey,
						recoverykey : this.encryption.keys.client.recovery
					},
					{ applicationName : 'Workspace' } );
					
					console.log( '--- localStorage --- ', window.localStorage );
				}
				
				// TODO: Do we need to store anything in cookie, this is unsafe??? if not remove this
				
				if( this.loginUsername && this.loginPassword )
				{
					SetCookie( 'loginUsername', this.loginUsername );
					SetCookie( 'loginPassword', this.loginPassword );
				}
			}
			
			var m = new FriendLibrary( 'system' );
			if( this.loginUsername )
			{
				m.addVar( 'username', this.loginUsername );
				m.addVar( 'password', this.loginPassword );
			}
			m.addVar( 'deviceid', GetDeviceId() );
			if( this.sessionId )
			{
				m.addVar( 'sessionid', this.sessionId );
			}
			m.onExecuted = function( json, serveranswer )
			{
				if( typeof( json ) != 'object' )
				{
					try
					{
						var to = JSON.parse( json );
						if( to.result && to.sessionid )
							json = to;
					}
					catch( e )
					{
						json = { result: -1 };
					}
				}
				
				if( !json && serveranswer )
				{
					if( typeof( serveranswer ) == 'string' && serveranswer.indexOf( '{' ) >= 0 )
					{
						json = JSON.parse( serveranswer );
					}
					else
					{
						json = serveranswer;
					}
				}
				
				var hasSessionID = ( json.sessionid && json.sessionid.length > 1 );
				var hasLoginID = ( json.loginid && json.loginid.length > 1 );
				
				if( json.result == '0' || hasSessionID || hasLoginID || json.result == 3 )
				{
					// Ok, we're in
					//t.sessionId = hasLoginID ? json.loginid : ( json.sessionid ? json.sessionid : null );
					t.sessionId = json.sessionid ? json.sessionid : null;
					t.userId = json.userid;
					t.fullName = json.fullname;
					
					//relogin fix
					console.log('logged in... remove loading...');
					document.body.classList.remove( 'Loading' );
					
					// Store user data in localstorage for later verification
					
					var userdata = ApplicationStorage.load( { applicationName : 'Workspace' } );
					
					if( userdata )
					{
						userdata.sessionId = t.sessionId;
						userdata.userId = t.userId;
						userdata.fullName = t.fullName;
						
						ApplicationStorage.save( userdata, { applicationName : 'Workspace' } );
					}
					
					Workspace.loginCallBack = callback;
					return Workspace.initUserWorkspace( userdata, json );

				}
				else
				{
					if( t.loginPrompt )
						t.loginPrompt.sendMessage( { command: 'error', other: 'test' } );
					if( callback && typeof( callback ) == 'function' ) callback( false, serveranswer );

				}
				document.body.className = 'Login';
			}
			m.execute( 'login' );
		}
		
		// Show it
		this.showDesktop();
		
		return 0;
	},
	initUserWorkspace: function( userdata, json )
	{
		if( !this.sessionId ) return false;
		

		var t = this;
		var callback = t.loginCallBack;
		/*
			after a user has logged in we want to prepare the workspace for him.
		*/


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
		
		// Language
		Workspace.locale = 'en';
		var l = new Module( 'system' );
		l.onExecuted = function( e, d )
		{
			// New translations
			i18n_translations = [];

			// Add it!
			i18nClearLocale();
			if( e == 'ok' )
			{
				Workspace.locale = JSON.parse( d ).locale;
				//load english first and overwrite with localised values afterwards :)
				i18nAddPath( 'locale/en.locale', function(){
					if( Workspace.locale != 'en' ) i18nAddPath( 'locale/' + Workspace.locale + '.locale' );
				});
			}
			else
			{
				i18nAddPath( 'locale/en.locale' );
			}
			
			try
			{
				var res = JSON.parse( d );
				if( res.response == 'Failed to load user.' )
				{
					Workspace.logout();
				}
			}
			catch( e ){};
		}
		l.execute( 'getsetting', { setting: 'locale' } );
		
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' )
			{
				if( !json.acceptedEula )
				{
					ShowEula();
				}
			}
		}
		m.execute( 'getsetting', {
			setting: 'accepteula'
		} );
	
		
		if( !Workspace.workspaceHasLoadedOnceBefore ){ document.body.classList.add( 'Loading' ); Workspace.workspaceHasLoadedOnceBefore = true; }
		
	
		// Lets load the stored window positions!
		LoadWindowStorage();
	
		// Set up a shell instance for the workspace
		var uid = FriendDOS.addSession( Workspace );
		Workspace.shell = FriendDOS.getSession( uid );
		
		// We're getting the theme set in an url var
		var th = '';
		if( ( th = GetUrlVar( 'theme' ) ) )
		{
			Workspace.refreshTheme( th, false );
			if( t.loginPrompt )
			{
				t.loginPrompt.close();
				t.loginPrompt = false;
			}
			t.init();
		}
		// See if we have some theme settings
		else
		{
			// As for body.Inside screens, use > 0.2secs
			setTimeout( function()
			{
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
		}
		if( callback && typeof( callback ) == 'function' ) callback( 1 );
		return 1;
		
		
		/* done here. workspace is shown. */
	},
	resetPassword: function( username, callback )
	{
		var passWordResetURL = '/forgotpassword/username/' + encodeURIComponent( username );
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
		    if (this.readyState == 4 && this.status == 200) {
		    	if(typeof callback == 'function') callback( this.responseText );
			}
		};
		xhttp.open("GET", passWordResetURL, true);	
		xhttp.send();
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
		
		function executeRefresh( window, callback )
		{
			if( window.wRefreshTimeout ) clearTimeout( window.wRefreshTimeout );
			window.wRefreshTimeout = setTimeout( function() {
				window.refresh( callback );
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
			no.dom.index = a+1;
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
		// Only on force or first time
		if( this.themeRefreshed && !update )
			return;
		
		if( Workspace.themeOverride ) themeName = Workspace.themeOverride.toLowerCase();
		
		document.body.classList.add( 'Loading' );
		
		setTimeout( function()
		{
			Workspace.themeRefreshed = true;
		
			Workspace.refreshUserSettings( function(){ CheckScreenTitle(); } );
		
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
				styles.onload = function()
				{ 
					if( document.body.classList.contains( 'Inside' ) )
						document.body.classList.remove( 'Loading' );
					document.body.classList.add( 'Inside' );
					document.body.classList.remove( 'Login' );
					setTimeout( function()
					{
						Workspace.refreshDesktop( false, true );
					}, 250 );
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
		}, 500 );
	},
	showDesktop: function()
	{	
		// View desktop
		document.body.style.visibility = 'visible';
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
			
			console.log('we got events',r,data);
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
		// New experimental way
		var dp = Workspace.drivePanel;
		
		// Create disposable menu
		var menu = new FullscreenMenu();
		var items = dp.getElementsByClassName('File');
		for( var a = 0; a < items.length; a++ )
		{
			menu.addMenuItem( {
				text: items[a].getElementsByClassName( 'Title' )[0].innerHTML,
				clickItem: items[a]
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
						ext = ( ( ext[ext.length-1] ) + "" ).toLowerCase();
					}
					
					// Remove prev
					var v = eles[0].parentNode.getElementsByTagName( 'video' );
					for( var z = 0; z < v.length; z++ ) eles[0].parentNode.removeChild( v[z] );
					
					var bsize = 'cover';
					if( window.isMobile )
					{
						if( window.innerHeight > window.innerWidth )
						{	
							bsize = 'auto ' + window.innerHeight + 'px';
						}
						else bsize = window.innerWidth + 'px auto';
						
						
						if( window.isMobile && !window.hasWallpaperResizeEvent )
						{
							window.hasWallpaperResizeEvent = true;
							window.addEventListener( 'resize', function()
							{
								var bbsize = 'auto ' + window.innerHeight + 'px';
								var eled = self.screen.div.getElementsByClassName( 'ScreenContent' );
								if( eled.length )
									eled[0].style.backgroundSize = bbsize;
							} );
						}
					}
					
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
							document.body.classList.remove( 'Loading' );
							document.body.classList.add( 'Loaded' );
							break;
						default:
							var i = new Image();
							i.onload = function()
							{
								eles[0].style.backgroundSize = bsize;
								eles[0].style.backgroundImage = 'url(' + this.src + ')';
								setupDriveClicks();
								this.done = true;
								document.body.classList.remove( 'Loading' );
								document.body.classList.add( 'Loaded' );
							}
							if( found )
								i.src = getImageUrl( self.wallpaperImage );
							else i.src = '/webclient/gfx/theme/default_login_screen.jpg';
							if( i.width > 0 && i.height > 0 )
							{
								i.onload();
							}
				
							// If this borks up in 2 seconds, bail!
							setTimeout( function()
							{
								if( !i.done )
								{
									i.onload();
								}
							}, 10000 );
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
				document.body.classList.remove( 'Loading' );
				document.body.classList.add( 'Loaded' );
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
	refreshDormantDisks: function( callback )
	{
		var found = false;
		
		// Check dormant
		if( DormantMaster )
		{
			found = DormantMaster.getDoors();
		}
		var dom = false;
		
		// Insert applet if not there
		if( Ge( 'Tray' ) )
		{
			var eles = Ge( 'Tray' ).getElementsByTagName( 'div' );
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
		else if( !dom && found )
		{
			dom = document.createElement( 'div' );
			dom.className = 'Disks TrayElement IconSmall';
			dom.bubble = document.createElement( 'div' );
			dom.bubble.className = 'BubbleInfo List';
			dom.appendChild( dom.bubble );
			Ge( 'Tray' ).appendChild( dom );
		}
		else
		{
			dom.bubble = dom.getElementsByTagName( 'div' )[0];
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
				Visible: true,
				Door:	  new DoorSystem( 'System:' )
			} );
			
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
			if( icon.Path.split( ':' )[0] == 'System' )
				filt = 'iconinfo_system.html';
			if( icon.Path.substr( icon.Path.length - 5, 5 ).toLowerCase() != '.info' )
			{
				var mi = new File( icon.Path + '.info' );
				mi.onLoad = function( fd )
				{
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
					instance: ( icon.Filename ? icon.Filename : ( icon.Title.split( ':' )[0] ) ).split( /[^a-z]+/i ).join( '' ),
					info_fields: fdt_out
				};
				f.i18n();
				if( icon.Path.substr( icon.Path.length - 1, 1 ) != ':' )
				{
					f.replacements.i18n_volume_information = i18n( 'i18n_file_information' );
					f.replacements.i18n_volume_name = i18n( 'i18n_filename' );
					f.replacements.i18n_volume_size = i18n( 'i18n_filesize' );
				}
				f.onLoad = function( d )
				{
					// Check file permissions!
					var dn = icon.Path.split( ':' )[0];
					var pt = icon.Path;
				
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
		
		var fi = false;
		if( currentMovable && currentMovable.content.fileInfo )
			fi = currentMovable.content.fileInfo.Path;
		
		var w = new View( {
			title: i18n( 'i18n_choose_file_to_upload' ),
			width: 370,
			'min-width': 370,
			height: 160,
			'min-height': 160,
			'max-height': 160,
			id: 'fileupload',
			resize: false,
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
	//set an additional URL to call on logout
	setLogoutURL: function( logoutURL )
	{
		Workspace.logoutURL = logoutURL;
	},
	// Simple logout..
	logout: function()
	{
		// FIXME: implement
		DelCookie( 'loginUsername' );
		DelCookie( 'loginPassword' );
		SaveWindowStorage( function()
		{ 
			//do external logout and then our internal one.
			if( Workspace.logoutURL )
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
					Workspace.logout();					
				});
				return;
			}
			
			var m = new cAjax();
			Workspace.websocketsOffline = true;
			m.open( 'get', '/system.library/user/logout/?sessionid=' + Workspace.sessionId, true );
			m.onload = function()
			{
				Workspace.sessionId = ''; document.location.reload(); 
			}
			m.send();
			Workspace.websocketsOffline = false;
			
		} );
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
		
		var cnt = currentMovable.content;
		var systemDrive = false;
		if( cnt ) systemDrive = cnt && cnt.fileInfo && cnt.fileInfo.Volume == 'System:';
		
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
					{
						name:	i18n( 'information' ),
						command: function(){ Workspace.informationWindow( 1 ); }
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
						name:	(typeof friendApp != 'undefined' && typeof friendApp.exit == 'function' ?  i18n('menu_exit') : i18n( 'menu_log_out' ) ),
						command: function(){ if(typeof friendApp != 'undefined' && typeof friendApp.exit == 'function') { friendApp.exit(); } else {  Workspace.logout(); } }
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
								command: function(){ Workspace.viewDirectory('iconview'); }
							},
							{
								name:	 i18n( 'menu_show_as_list' ),
								command: function(){ Workspace.viewDirectory('listview'); }
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
					command: function(){ ExecuteApplication( 'DiskCatalog' ); }
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
			workspaceMenu.generate( false, this.menu );
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
			screens[a].style.transition = 'top 0.5s';
			screens[a].style.top = window.innerHeight - 32 + 'px';
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
		SetWindowStorage( uid, d );
		window.currentMovable.content.redrawIcons();
	},
	showContextMenu: function( menu, e )
	{
		if( window.isMobile ) return;
		
		var tr = e.target ? e.target : e.srcElement;
		
		
		if( !menu && tr.className == 'ScreenContent' )
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
					name: i18n( 'menu_refresh_desktop' ),
					command: function()
					{
						Workspace.refreshDesktop();
					}
				}
			];
		}
		else if( !menu )
		{
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
				v.setFlag( 'left', flg.left );
				v.setFlag( 'top', flg.top );
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
					p.onclick = function()
					{
						this.cmd();
						v.hide();
					}
					p.onmouseup = function()
					{
						this.cmd();
						v.hide();
					}
				}
				p.innerHTML = menu[z].name;
				menuout.appendChild( p );
			}
			v.dom.appendChild( menuout );
			v.setFlag( 'height', v.dom.getElementsByTagName( 'div' )[0].offsetHeight );
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
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' ) return;
			var js = JSON.parse( d );
			for( var a = 0; a < js.length; a++ )
			{
				if( js[a].Name.toLowerCase() == app.toLowerCase() )
				{
					return ExecuteApplication( js[a].Name );
				}
			}
			ExecuteApplication( app );
		}
		m.execute( 'listuserapplications' );
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
						var tm = false;
						var callbackh = function()
						{
							if( tm ) clearTimeout( tm );
							tm = setTimeout( function()
							{
								rObj.refresh();
							}, 250 );
						}
						
						// Delete these files!
						for( var a = 0; a < cnt; a++ )
						{
							// If we have a directory/file ID, then use that instead of a whole path
							if( files[a].fileInfo.ID )
							{
								files[a].door.dosAction( 'delete', { path: files[a].fileInfo.Path, pathid: files[a].fileInfo.ID + ( files[a].fileInfo.Type == 'Directory' ? '/' : '' ) }, callbackh );
							}
							else files[a].door.dosAction( 'delete', { path: files[a].fileInfo.Path }, callbackh );
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
	},
	// Set up user account
	accountSetup: function( what )
	{
		ExecuteApplication( 'Account' );
	}, 
	
	checkServerConnectionHTTP: function()
	{
		//try to run a call and if does not get back display offline message....
		m = new Module('system');
		m.onExecuted = function( e, d )
		{
			if( e == 'fail' && d == false ) return;
			Workspace.serverIsThere = true;
			Workspace.workspaceIsDisconnected = false;
		}		
		Workspace.serverIsThere = false;
		m.execute( 'getsetting', { setting: 'infowindow' } );
		setTimeout('Workspace.checkServerConnectionResponse();', 1000);
	},
	checkServerConnectionResponse: function()
	{
		if( Workspace.serverIsThere == false )
		{
			if( !document.body.classList.contains( 'Offline' ) )
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

document.addEventListener('paste',function(evt){
	if(typeof friend != undefined && typeof friend.pasteClipboard == 'function') friend.pasteClipboard( evt );
});

/**
	paste handler. check Friend CB vs System CB.
*/
function friendWorkspacePasteListener(evt)
{
	var mimetype = '';
	var cpd = '';
	
	if( !evt.clipboardData )
	{
		return true;
	}
	else if( evt.clipboardData.types.indexOf('text/plain') > -1 )
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
		window.addEventListener( 'paste', friendWorkspacePasteListener, false);
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
		title: i18n( 'about_friendup' ) + ' v1.0.0',
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
			}
		}
		m.execute( 'setsetting', { 
			setting: 'accepteula',
			data:    'true'
		} );
	
		//call device refresh to make sure user get his devices...
		var dl = new FriendLibrary( 'system.library' );
		dl.addVar( 'visible', true );
		dl.onExecuted = function(e,d)
		{
			console.log('First login. Device list refreshed.',e,d);
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

function handleServerNotice( e )
{
	msg = {
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

