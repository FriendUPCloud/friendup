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
* other places.                                                                *
*                                                                              *
*******************************************************************************/

var _protocol = document.location.href.split( '://' )[0];

Workspace = {
	icons: [],
	reloginAttempts: 0,
	menuMode: 'pear', // 'miga', 'fensters' (alternatives)
	mode: 'default',
	initialized: false,
	protocol: _protocol,
	menu: [],
	diskNotificationList: [],
	notifications: [],
	notificationEvents: [],
	applications: [],
	importWindow: false,
	menuState: '',
	themeOverride: false,
	systemInfo: false,
	websocketsOffline: true,
	workspaceIsDisconnected: false,
	lastfileSystemChangeMessage: false,
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
		// Go ahead and init!
		ScreenOverlay.init();
		Workspace.init();
		
		if( window.friendApp )
		{
			document.body.classList.add( 'friendapp' );
		}
	},
	init: function()
	{
		// First things first
		if( this.initialized ) return;

		// Preload some images
		var imgs = [
			'/webclient/gfx/system/offline_16px.png',
			'/themes/friendup12/gfx/busy.png'
		];
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
		
		this.initialized = true;

		checkMobileBrowser();
		if( !this.addedMobileCSS && window.isMobile )
		{
			document.body.setAttribute( 'mobile', 'mobile' );
			AddCSSByUrl( '/webclient/css/responsive.css' );
			this.addedMobileCSS = true;
		}

		// Show the login prompt if we're not logged in!
		this.login();
	},
	// Ready after init
	// NB: This is where we go towards workspace_inside.js
	postInit: function()
	{
		if( this.postInitialized ) return;
		
		// Everything must be ready
		if( typeof( ge ) == 'undefined' )
		{
			if( this.initTimeout )
				clearTimeout( this.initTimeout );
			this.initTimeout = setTimeout ( 'Workspace.postInit()', 25 );
			return;
		}

		// We passed!
		this.postInitialized = true;

		// Do the init!
		window.addEventListener( 'beforeunload', Workspace.leave, true );

		this.loadSystemInfo();

		InitWindowEvents();
		InitWorkspaceEvents();
		InitGuibaseEvents();

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

		// Setup default Doors screen
		var wbscreen = new Screen( {
			title: 'Friend Workspace',
			id:	'DoorsScreen',
			extra: Workspace.fullName,
			taskbar: true,
			scrolling: false
		} );

		// Make links to screen on this object
		this.screen = wbscreen;
		this.screenDiv = wbscreen.div;
		
		var tray = document.createElement( 'div' );
		tray.id = 'Tray';
		this.screenDiv.appendChild( tray );

		// Init the deepest field
		if( !isMobile )
			DeepestField.init();
		else DeepestField = false;

		// Key grabber
		if( !ge( 'InputGrabber' ) )
		{
			var i = document.createElement( 'input' );
			i.type = 'text';
			i.id = 'InputGrabber';
			i.style.position = 'absolute';
			i.style.left = '-1000px';
			i.style.pointerEvents = 'none';
			ge( 'DoorsScreen' ).appendChild( i );
		}

		this.initWorkspaces();

		wbscreen.div.addEventListener( 'mousedown', function( e )
		{
			var wd = wbscreen.div.screenTitle.getElementsByClassName( 'Extra' )[0].widget;
			if( wd )
			{
				if( wd.shown )
				{
					wd.hideWidget();
				}
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
			var ex = wbscreen.div.screenTitle.getElementsByClassName( 'Extra' )[0];
			Workspace.calendarClickEvent = function( e )
			{
				if( !ex.widget )
				{
					o = {
						width: 400,
						height: 300,
						top: Workspace.screen.contentDiv.offsetTop,
						halign: 'right',
						scrolling: false,
						autosize: true
					};
					ex.widget = new Widget( o );
					ex.widget.dom.style.transition = 'height 0.25s';
					ex.widget.showWidget = function()
					{
						var self = this;
						this.dom.style.height = '0px';
						Workspace.refreshExtraWidgetContents();
						CoverScreens();
						ge( 'DoorsScreen' ).classList.add( 'HasWidget' );
						setTimeout( function()
						{
							self.show();
							self.raise();
							ExposeScreens();
						}, 100 );
					}
					ex.widget.hideWidget = function()
					{
						var self = this;
						ge( 'DoorsScreen' ).classList.add( 'HidingCalendar' );
						setTimeout( function()
						{
							ge( 'DoorsScreen' ).classList.remove( 'HasWidget' );
							ge( 'DoorsScreen' ).classList.remove( 'HidingCalendar' );
							self.shown = false;
							self.hide();
							self.lower();
							ExposeScreens();
						}, 250 );
					}
				}
				if( !ex.widget.shown )
					ex.widget.showWidget();
				else ex.widget.hide();
				return cancelBubble( e );
			}
			ex.onclick = Workspace.calendarClickEvent;
			ex.classList.add( 'MousePointer' );
			ex.onmousedown = function( e )
			{
				return cancelBubble( e );
			}
			ex.onmouseup = function( e )
			{
				return cancelBubble( e );
			}
		}

		// Setup clock
		if( !isMobile )
		{
			var ex = ge( 'DoorsScreen' ).screenObject._titleBar;
			ex = ex.getElementsByClassName( 'Extra' )[0];
			function clock()
			{
				var d = new Date();
				if( !ex.time )
				{
					var t = document.createElement( 'div' );
					t.className = 'Time';
					ex.appendChild( t );
					ex.time = t;
				}
				if( Workspace.workspaceIsDisconnected )
				{
					if( !ex.offline )
					{
						var o = document.createElement( 'div' );
						o.className = 'Offline';
						o.innerHTML = i18n( 'i18n_ws_disconnected' );
						if( ex.time )
						{
							ex.insertBefore( o, ex.time );
						}
						else
						{
							ex.appendChild( o );
						}
						ex.offline = o;
					}
				}
				else if( ex.offline )
				{
					ex.removeChild( ex.offline );
					ex.offline = null;
				}

				// Set the clock
				var e = '';
				e +=    StrPad( d.getHours(), 2, '0' ) + ':' +
						   StrPad( d.getMinutes(), 2, '0' ); /* + ':' +
						   StrPad( d.getSeconds(), 2, '0' );*/
				/*e +=    ' ' + StrPad( d.getDate(), 2, '0' ) + '/' +
						   StrPad( d.getMonth() + 1, 2, '0' ) + '/' + d.getFullYear();*/
				ex.time.innerHTML = e;

				// Realign workspaces
				Workspace.nudgeWorkspacesWidget();
			}
			this.clockInterval = setInterval( clock, 1000 );
		}

		// Recall wallpaper from settings
		this.refreshUserSettings( function(){ 
			// Refresh desktop for the first time
			Workspace.refreshDesktop( false, true );
		} );

		// Create desktop
		this.directoryView = new DirectoryView( wbscreen.contentDiv );

		// Create default desklet
		var mainDesklet = CreateDesklet( this.screenDiv, 64, 480, 'right' );

		// Add desklet to dock
		this.mainDock = mainDesklet;
		if( !isMobile )
		{
			this.mainDock.dom.oncontextmenu = function( e )
			{
				var tar = e.target ? e.target : e.srcElement;
				if( tar.classList && tar.classList.contains( 'Task' ) )
				{
					return Workspace.showContextMenu( false, e );
				}

				var men = [
					{
						name: i18n( 'i18n_edit_dock' ),
						command: function()
						{
							ExecuteApplication( 'Dock' );
						}
					}
				];

				if( tar.classList && tar.classList.contains( 'Launcher' ) )
				{
					men.push( {
						name: i18n( 'i18n_remove_from_dock' ),
						command: function()
						{
							Workspace.removeFromDock( tar.executable );
						}
					} );
				}
			
				if( movableWindowCount > 0 )
				{
					men.push( {
						name: i18n( 'i18n_minimize_all_windows' ),
						command: function( e )
						{
							var t = GetTaskbarElement();
							var lW = null;
							for( var a = 0; a < t.childNodes.length; a++ )
							{
								if( t.childNodes[a].view && !t.childNodes[a].view.parentNode.getAttribute( 'minimized' ) )
								{
									t.childNodes[a].view.parentNode.setAttribute( 'minimized', 'minimized' );
								}
							}
							_DeactivateWindows();
						}
					} );
					men.push( {
						name: i18n( 'i18n_show_all_windows' ),
						command: function( e )
						{
							var t = GetTaskbarElement();
							for( var a = 0; a < t.childNodes.length; a++ )
							{
								if( t.childNodes[a].view && t.childNodes[a].view.parentNode.getAttribute( 'minimized' ) == 'minimized' )
								{
									t.childNodes[a].view.parentNode.removeAttribute( 'minimized' );
								}
							}
							_ActivateWindow( t.childNodes[t.childNodes.length-1].view );
						}
					} );
				}

				Workspace.showContextMenu( men, e );
			}
		}
		// For mobiles
		else
		{
			this.mainDock.dom.oncontextmenu = function( e )
			{
				var tar = e.target ? e.target : e.srcElement;
				if( window.MobileContextMenu )
				{
					MobileContextMenu.show( tar );
				}
			}
		}
		this.reloadDocks();

		// Init security subdomains
		SubSubDomains.initSubSubDomains();
		
		// console.log( 'Test2: Done post init.' );
	},
	encryption: {

		fcrypt: fcrypt,
		keyobject: false,
		encoded: true,

		keys: {
			client: false,
			server: false
		},

		setKeys: function( u, p )
		{
			if( typeof( this.fcrypt ) != 'undefined' )
			{
				if( u && !Workspace.loginUsername ) Workspace.loginUsername = u;
				
				p = ( !p || p.indexOf('HASHED') == 0 ? p : ( 'HASHED' + Sha256.hash( p ) ) );

				if( window.ScreenOverlay )
					ScreenOverlay.addDebug( 'Generating sha256 keys' );

				var seed = ( u && p ? this.fcrypt.generateKey( ( u + ':' + p ), 32, 256, 'sha256' ) : false );

				var keys = ApplicationStorage.load( { applicationName : 'Workspace' } );

				if( !keys || ( keys && !keys.privatekey ) || ( keys && seed && keys.recoverykey != seed ) )
				{
					if( window.ScreenOverlay )
						ScreenOverlay.addDebug( 'Generating encryption keys' );
					this.keyobject = this.fcrypt.generateKeys( false, false, false, seed );
					keys = this.fcrypt.getKeys( this.keyobject );
				}
				else
				{
					if( window.ScreenOverlay )
					{
						ScreenOverlay.addDebug( 'Loaded encryption keys' );
					}
				}

				if( keys )
				{
					if( this.encoded )
					{
						this.keys.client = {
							privatekey  : this.fcrypt.encodeKeyHeader( keys.privatekey ),
							publickey   : this.fcrypt.encodeKeyHeader( keys.publickey ),
							recoverykey : keys.recoverykey
						};
						if( window.ScreenOverlay )
							ScreenOverlay.addDebug( 'Keys stored encoded' );
					}
					else
					{
						this.keys.client = {
							privatekey  : keys.privatekey,
							publickey   : keys.publickey,
							recoverykey : keys.recoverykey
						};
						if( window.ScreenOverlay )
							ScreenOverlay.addDebug( 'Keys stored raw' );
					}
				}
				return this.keys;
			}

			return false;
		},
		generateKeys: function( u, p )
		{
			if( typeof( this.fcrypt ) != 'undefined' )
			{
				if( window.ScreenOverlay )
					ScreenOverlay.addDebug( 'Generating keys' );
				
				var pass = ( u && p ? u + ':' : '' ) + ( p ? p : '' );

				var keyobject = this.fcrypt.generateKeys( pass );

				var keys = this.fcrypt.getKeys( keyobject );

				if( keys )
				{
					if( this.encoded )
					{
						return {
							privatekey  : this.fcrypt.encodeKeyHeader( keys.privatekey ),
							publickey   : this.fcrypt.encodeKeyHeader( keys.publickey ),
							recoverykey : keys.recoverykey
						};
					}
					else
					{
						return {
							privatekey  : keys.privatekey,
							publickey   : keys.publickey,
							recoverykey : keys.recoverykey
						};
					}
				}
			}

			return false;
		},
		getKeys: function()
		{
			if( typeof( this.fcrypt ) != 'undefined' && this.keys.client )
			{
				if( this.encoded )
				{
					return {
						privatekey  : this.fcrypt.encodeKeyHeader( this.keys.client.privatekey ),
						publickey   : this.fcrypt.encodeKeyHeader( this.keys.client.publickey ),
						recoverykey : this.keys.client.recoverykey
					};
				}
				else
				{
					return {
						privatekey  : this.fcrypt.decodeKeyHeader( this.keys.client.privatekey ),
						publickey   : this.fcrypt.decodeKeyHeader( this.keys.client.publickey ),
						recoverykey : this.keys.client.recoverykey
					};
				}
			}

			return false;
		},
		getServerKey: function( callback )
		{
			var k = new Module( 'system' );
			k.onExecuted = function( e, d )
			{
				if( callback )
				{
					if( e == 'ok' && d )
					{
						callback( d );
					}
					else
					{
						callback( false );
					}
				}
			}
			k.execute( 'getserverkey' );
		},
		encryptRSA: function( str, publickey )
		{
			if( typeof( this.fcrypt ) != 'undefined' )
			{
				return this.fcrypt.encryptRSA( str, ( publickey ? publickey : this.keys.client.publickey ) );
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
				return this.fcrypt.encryptAES( str, ( publickey ? publickey : this.keys.client.publickey ) );
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
				var encrypted = this.fcrypt.encryptString( str, ( publickey ? publickey : this.keys.client.publickey ) );

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
		},
		sha256: function( str )
		{
			if( !str && typeof( this.fcrypt ) != 'undefined' )
			{
				return this.fcrypt.generateKey( '', 32, 256, 'sha256' );
			}

			if( typeof( Sha256 ) != 'undefined' )
			{
				return Sha256.hash( str );
			}

			return false;
		},
		md5: function( str )
		{
			if( !str && typeof( this.fcrypt ) != 'undefined' )
			{
				return MD5( this.fcrypt.generateKey( '', 32, 256, 'sha256' ) );
			}

			if( typeof( MD5 ) != 'undefined' )
			{
				return MD5( str );
			}

			return false;
		}
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
	showLoginPrompt: function()
	{
		// No loginprompt when we are inside
		if( document.body.classList.contains( 'Inside' ) )
			return;
			
		// Enable friend book mode
		if( document.body.getAttribute( 'friendbook' ) == 'true' )
			window.friendBook = true;

		// Set body to login state
		document.body.className = 'Login';
		if( Workspace.interfaceMode && Workspace.interfaceMode == 'native' )
			return;

		var lp = new View( {
			id: 'Login',
			width: 432,
			'min-width': 290,
			'max-width': 432,
			height: 480,
			'min-height': 280,
			'resize': false,
			title: 'Login to Friend OS',
			close: false,
			login: true,
			theme: 'login'
		} );
		lp.setRichContentUrl( '/loginprompt' );
		Workspace.loginPrompt = lp;

		// Show it
		this.showDesktop();
	},
	flushSession: function()
	{
		this.sessionId = '';
		localStorage.removeItem( 'WorkspaceSessionID' );
	},
	// When session times out, use log in again...
	relogin: function( callback )
	{
		// While relogging in or in a real login() call, just skip
		if( this.reloginInProgress || this.loginCall ) return;
		
		// Kill all http connections that would block
		_cajax_http_connections = 0;
		
		//console.log( 'Test2: Relogin in progress' );
		
		var self = this;
		
		function killConn()
		{
			if( Workspace.conn )
			{
				try
				{
					Workspace.conn.ws.close();
				}
				catch( e )
				{
					//console.log( 'Could not close conn.' );
				}
				delete Workspace.conn;
			}
		}
		
		function executeCleanRelogin()
		{	
			killConn();
			
			if( Workspace.loginUsername && Workspace.loginPassword )
			{
				// // console.log( 'Test2: Regular login with user and pass' );
				var u = typeof( Workspace.loginUsername ) == 'undefined' ? false : Workspace.loginUsername;
				var p = typeof( Workspace.loginPassword ) == 'undefined' ? false : Workspace.loginPassword;
				if( !( !!u && !!p ) )
					Workspace.flushSession();
				Workspace.login( u, p, false, Workspace.initWebSocket );
			}
			// Friend app waits some more
			else if( window.friendApp )
			{
				// // console.log( 'Test2: Just return - we have nothing to go on. Try executing normal login' );
				Workspace.reloginInProgress = false;
				return Workspace.login();
			}
			// Just exit to login screen
			else
			{
				// We're exiting!
				Workspace.logout();
				Workspace.reloginInProgress = false;
			}
		}
		
		this.reloginAttempts = true;
		
		// See if we are alive!
		// Cancel relogin context
		CancelCajaxOnId( 'relogin' );
		
		var m = new Module( 'system' );
		m.cancelId = 'relogin';
		m.onExecuted = function( e, d )
		{
			//console.log( 'Test2: Got back: ', e, d );
			
			self.reloginAttempts = false;
			Workspace.reloginInProgress = true;
			
			if( e == 'ok' )
			{
				// We have a successful login. Clear call blockers and update sessions, execute ajax queue
				Workspace.reloginInProgress = false;
				Workspace.loginCall = false;
				Workspace.renewAllSessionIds();
				// // console.log( 'Test2: Yeah! All good!' );
				return;
			}
			else
			{
				if( d )
				{					
					try
					{
						var js = JSON.parse( d );
						// Session authentication failed
						if( parseInt( js.code ) == 3 || parseInt( js.code ) == 11 )
						{
							// console.log( 'Test2: Flush session' );
							Workspace.flushSession();
							Workspace.reloginInProgress = false;
							return executeCleanRelogin();
						}
					}
					catch( n )
					{
						killConn();
						console.log( 'Error running relogin.', n, d );
					}
				}
				else
				{
					Workspace.flushSession();
					Workspace.reloginInProgress = false;
					return executeCleanRelogin();
				}
			}
			if( Workspace.serverIsThere )
			{
				// console.log( 'Test2: Clean relogin' );
				executeCleanRelogin();
			}
			else
			{
				killConn();
				// // console.log( 'Test2: Wait a second before you can log in again.' );
				// Wait a second before trying again
				setTimeout( function()
				{
					Workspace.reloginInProgress = false;
				}, 1000 );
			}
		}
		m.forceHTTP = true;
		m.forceSend = true;
		m.execute( 'usersettings' );
		// console.log( 'Test2: Getting usersettings.' );
	},
	// Renews session ids for cajax and executes ajax queue!
	renewAllSessionIds: function( session )
	{
		if( session )
			this.sessionId = session;
		
		// Reset this in this case
		_cajax_http_connections = 0;
		
		// Check if there's a queue of objects waiting to run
		if( Friend.cajax && Friend.cajax.length )
		{
			for( var a = 0; a < Friend.cajax.length; a++ )
			{
				Friend.cajax[a].send();
			}
			Friend.cajax = [];
		}
	},
	loginSessionId: function( sessionid, callback, ev )
	{
		if( sessionid )
		{
			//console.log( 'Test2: Logging in with sessionid.' );
			
			var _this = this;
			
			var m = new FriendLibrary( 'system' );
			m.addVar( 'sessionid', sessionid );
			m.addVar( 'deviceid', this.deviceid );
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
				
				var hasSessionID = null;
				var hasLoginID = null;

				try
				{
					Workspace.userLevel = json.level;
					hasSessionID = ( typeof( json.sessionid ) != 'undefined' && json.sessionid && json.sessionid.length > 1 );
					hasLoginID = ( typeof( json.loginid ) != 'undefined' && json.loginid && json.loginid.length > 1 );
				}
				catch( e )
				{
					Workspace.userLevel = false;
				}
				
				if( !Workspace.loginUsername && json.username ) Workspace.loginUsername = json.username;

				
				
				if( json && ( json.result == '0' || hasSessionID || hasLoginID || json.result == 3 ) )
				{
					// Successful login, clear blockers and execute ajax queue
					Workspace.reloginInProgress = false;
					Workspace.loginCall = false;
					Workspace.renewAllSessionIds( hasSessionID ? json.sessionid : false );
				
					// console.log( 'Test2: Success! Logged in with sessionid.' );
					
					return Workspace.initUserWorkspace( json, ( callback && typeof( callback ) == 'function' ? callback( true, serveranswer ) : false ), ev )
				}
				else
				{
					if( _this.loginPrompt )
					{
						_this.loginPrompt.sendMessage( { command: 'error', other: 'test' } );
					}
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
	login: function( u, p, r, callback, ev )
	{
		var self = this;
		
		//console.log( 'Test2: Normal login.' );
		
		// Test if we have a stored session
		var sess = localStorage.getItem( 'WorkspaceSessionID' );
		if( sess && sess.length )
		{
			this.sessionId = sess;
		}
	
		// TODO: If we have sessionid - verify it through ajax.

		if( this.sessionId )
		{
			if( callback && typeof( callback ) == 'function' ) callback( true );
			Workspace.reloginInProgress = false;
			return true;
		}
		
		// Close conn here - new login regenerates sessionid
		if( Workspace.conn )
		{
			try
			{
				Workspace.conn.ws.close();
			}
			catch( e )
			{
				console.log( 'Could not close conn.' );
			}
			delete Workspace.conn;
		}
		
		// Check local storage
		var ru = window.localStorage.getItem( 'WorkspaceUsername' );
		var rp = window.localStorage.getItem( 'WorkspacePassword' );
		if( ru && rp && typeof( ru ) != 'undefined' )
		{
			u = ru;
			p = rp;
			r = true;
		}

		// Require username and pw to login
		if( !u || !p || typeof( u ) == 'undefined' )
		{
			//console.log( 'Test3: Doing the login test.', u, p );
			// Login by url vars
			var gu = GetUrlVar( 'username' );
			var gp = GetUrlVar( 'password' );
			if( gu && gp && typeof( gu ) != 'undefined' )
			{
				return Workspace.login( decodeURIComponent( GetUrlVar( 'username' ) ), decodeURIComponent( GetUrlVar( 'password' ) ) );
			}
			else if( GetUrlVar( 'sessionid' ) )
			{
				return Workspace.loginSessionId( GetUrlVar( 'sessionid' ), callback, ev );
			}
			Workspace.reloginInProgress = false;
			if( callback && typeof( callback ) == 'function' ) callback( false );
			return this.showLoginPrompt();
		}

		var t = this;
		
		// p and u needs trushy true! :-)
		if( !!p & !!u )
		{
			this.loginUsername = u;

			if( p.indexOf( 'HASHED' ) == 0 )
			{
				this.loginPassword = p;
				//console.log( 'SET LOGIN PASSWORD = ' + p );
			}
			else
			{
				this.loginPassword = 'HASHED' + Sha256.hash( p );
				//console.log( 'SET HASHED PASSWORD = ' + p );
			}
		}

		if( typeof( this.loginUsername ) != 'undefined' && this.loginUsername && this.loginPassword )
		{
			// FIXME: Speed this up for the Edge browser
			this.encryption.setKeys( this.loginUsername, this.loginPassword );
			
			/*
				r = remember me set....
			*/
			if( r )
			{
				Workspace.rememberKeys();
			}

			// Avoid queue!
			if( this.loginCall )
			{
				this.loginCall.destroy();
			}

			// Create a new library call object
			var m = new FriendLibrary( 'system' );
			this.loginCall = m;

			var triedWithSession = false;
	
			if( this.loginUsername && typeof( this.loginUsername ) != 'undefined' )
			{
				m.addVar( 'username', this.loginUsername );
				m.addVar( 'password', this.loginPassword );
				//console.log( 'Adding U and P: ', this.loginUsername, this.loginPassword );
			}
			else if( this.sessionId )
			{
				m.addVar( 'sessionid', this.sessionId );
				triedWithSession = true;
			}
			
			m.addVar( 'deviceid', GetDeviceId() );

			m.onExecuted = function( json, serveranswer )
			{
				//console.log( 'Test2: We executed a login query', json, serveranswer );
				
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

				var hasSessionID = null;
				var hasLoginID = null;

				try
				{
					Workspace.userLevel = json.level;
					hasSessionID = ( typeof( json.sessionid ) != 'undefined' && json.sessionid && json.sessionid.length > 1 );
					hasLoginID = ( typeof( json.loginid ) != 'undefined' && json.loginid && json.loginid.length > 1 );
				}
				catch( e )
				{
					Workspace.userLevel = false;
				}


				if( json && ( json.result == '0' || hasSessionID || hasLoginID || json.result == 3 ) )
				{
					// // console.log( 'Test2: We got a login.' );
					
					// See if we can start host integration
					if( typeof( FriendBook ) != 'undefined' )
						FriendBook.init();
					
					// Store username and password in local storage
					if( r && typeof( self.loginUsername ) != 'undefined' && self.loginUsername && self.loginPassword )
					{
						// // console.log( 'Test2: Setting localstorage username/pass' );
						
						window.localStorage.setItem( 'WorkspaceUsername', self.loginUsername );
						window.localStorage.setItem( 'WorkspacePassword', self.loginPassword );
					}

					Workspace.reloginInProgress = false;
					Workspace.serverIsThere = true;
					Workspace.workspaceIsDisconnected = false;
					
					var cl = function()
					{
						// console.log( 'Test2: Running callback.' );
						t.loginCall = null;
						if( callback && typeof( callback ) == 'function' )
							callback( true, serveranswer );
					}
					
					// // console.log( 'Test2: Initializing user workspace.' );
					
					return Workspace.initUserWorkspace( json, cl, ev );
				}
				// Could not log in
				else
				{
					// // console.log( 'Test2: Removing WorkspaceUsername/Password from local storage.' );
					
					// Remove from localstorage
					window.localStorage.removeItem( 'WorkspaceUsername' );
					window.localStorage.removeItem( 'WorkspacePassword' );
					
					// Session is totally dead - go back to login screen
					if( triedWithSession )
					{
						console.log( '[Workspace] Logged out due to expired session and erroneous username and password.' );
						if( window.friendApp && friendApp.exit )
							friendApp.exit();
						else Workspace.logout();
						return;
					}
					
					Workspace.reloginInProgress = false;
					
					if( t.loginPrompt )
					{
						t.loginPrompt.sendMessage( { command: 'error', other: 'test' } );
					}
					else
					{
						//Alert( 'Test1: We are dead in the water.', 'Dead dead dead.' );
					}
					
					if( callback && typeof( callback ) == 'function' ) callback( false, serveranswer );

				}
				document.body.classList.add( 'Login' );
			}
			m.forceHTTP = true;
			m.forceSend = true;
			m.execute( 'login' );
			
			// Timeout login request
			if( Workspace.workspaceInside )
			{
				m.loginTimeout = setTimeout( function()
				{
					if( Workspace.reloginInProgress )
					{
						m.destroy();
						Workspace.reloginInProgress = false;
					}
					m.loginTimeout = false;
				}, 2500 );
			}
		}

		// Show it
		this.showDesktop();

		return 0;
	},
	rememberKeys: function()
	{
		if( this.encryption.keys.client )
		{
			//console.log( 'Remembering.' );
			ApplicationStorage.save( 
				{
					privatekey  : this.encryption.keys.client.privatekey,
					publickey   : this.encryption.keys.client.publickey,
					recoverykey : this.encryption.keys.client.recoverykey
				},
				{
					applicationName : 'Workspace' 
				} 
			);
			if( window.ScreenOverlay )
				ScreenOverlay.addDebug( 'Keys remembered' );
			return true;
		}
		return false;
	},
	showDesktop: function()
	{
		// View desktop
		document.body.style.visibility = 'visible';
	},
	// Stubs
	leave: function()
	{
	},
	doLeave: function()
	{
	},
	initUserWorkspace: function( json, callback, ev )
	{
		// console.log( 'Test2: Init user workspace.' );
		
		var _this = Workspace;

		// Once we are done
		function setupWorkspaceData( json, cb )
		{
			// console.log( 'Test2: Set it up.', json );
			
			// Ok, we're in
			_this.sessionId = json.sessionid ? json.sessionid : null;
			_this.userId    = json.userid;
			_this.fullName  = json.fullname;
			if( json.username ) _this.loginUsername = json.username;

			// Relogin fix
			document.body.classList.remove( 'Loading' );

			/*
				after a user has logged in we want to prepare the workspace for him.
			*/

			// Store user data in localstorage for later verification

			var userdata = ApplicationStorage.load( { applicationName : 'Workspace' } );

			if( userdata )
			{
				userdata.sessionId = _this.sessionId;
				userdata.userId    = _this.userId;
				userdata.loginUsername    = _this.loginUsername;
				userdata.fullName  = _this.fullName;

				ApplicationStorage.save( userdata, { applicationName : 'Workspace' } );
			}

			// Only renew session..
			if( ge( 'SessionBlock' ) )
			{
				// Could be many
				while( ge( 'SessionBlock' ) )
				{
					document.body.removeChild( ge( 'SessionBlock' ) );
				}
				// console.log( 'Test2: Renewing all sessions.' );
				
				// We have renewed our session, make sure to set it and run ajax queue
				_this.renewAllSessionIds( _this.sessionId );

				// Call back!
				if( cb ) cb();
				return;
			}

			// Set server key
			// TODO: Find a better place to set server publickey earlier in the process, temporary ... again time restraints makes delivery fast and sloppy ...
			if( !_this.encryption.keys.server )
			{
				_this.encryption.getServerKey( function( server )
				{
					_this.encryption.keys.server = ( server ? { publickey: server } : false );
				} );
			}

			// Make sure we have a public key for this user (depending on login interface)
			// TODO: See if we actually need this (and it doesn't work properly)
			/*if( window.friendApp )
			{
				var credentials = friendApp.getCredentials();
				var info = Workspace.generateKeys( credentials.username, credentials.password );
				var m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					// Call back!
					if( cb ) cb();
				}
				m.execute( 'setuserpublickey', { publickey: info.publickey } );
				return;
			}*/

			// Call back!
			if( cb ) cb();
		}

		// Manipulate screen overlay
		// (this will only be shown once!)
		// TODO: Figure out if this is the right behavior in every case
		//       implementation circumvents relogin issue
		if( !Workspace.screenOverlayShown )
		{
			ScreenOverlay.show();
			Workspace.screenOverlayShown = true;
		}
		
		if( !this.userWorkspaceInitialized )
		{
			// console.log( 'Test2: Doing the initialization.' );
			this.userWorkspaceInitialized = true;

			// Loading remaining scripts
			var s = document.createElement( 'script' );
			s.src = '/webclient/js/gui/workspace_inside.js;' +
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
				// Start with expanding the workspace object
				// TODO: If we have sessionid - verify it through ajax.
				// TODO: This block is only for already initialized workspace
				if( _this.sessionId && _this.postInitialized )
				{
					//console.log( 'This is the session.:', _this.sessionId );
					if( callback && typeof( callback ) == 'function' ) callback( true );
					return true;
				}

				if( !json || !json.sessionid ) 
				{
					// console.log( 'Test2: Got in sessionid error.', json );
					return false;
				}

				// Reset some options
				if( ev && ev.shiftKey )
				{
					_this.themeOverride = 'friendup12';
				}

				if( GetUrlVar( 'interface' ) )
				{
					switch( GetUrlVar( 'interface' ) )
					{
						case 'native':
							_this.interfaceMode = 'native';
							break;
						default:
							break;
					}
				}

				if( GetUrlVar( 'noleavealert' ) )
				{
					_this.noLeaveAlert = true;
				}

				setupWorkspaceData( json );

				// Language
				_this.locale = 'en';
				var l = new Module( 'system' );
				l.onExecuted = function( e, d )
				{
					// New translations
					i18n_translations = [];
					
					var decoded = false;
					try
					{
						decoded = JSON.parse( d );
					}
					catch( e )
					{
						//console.log( 'This: ', d );
					}

					// Add it!
					i18nClearLocale();
					if( e == 'ok' )
					{
						if( decoded && typeof( decoded.locale ) != 'undefined' )
							_this.locale = decoded.locale;
						//load english first and overwrite with localised values afterwards :)
						i18nAddPath( 'locale/en.locale', function(){
							if( _this.locale != 'en' ) i18nAddPath( 'locale/' + _this.locale + '.locale' );
						} );
					}
					else
					{
						i18nAddPath( 'locale/en.locale' );
					}

					try
					{
						if( decoded.response == 'Failed to load user.' )
						{
							_this.logout();
						}
					}
					catch( e ){};
					
					// Current stored Friend version
					Workspace.friendVersion = decoded.friendversion;
				}
				l.execute( 'getsetting', { settings: [ 'locale', 'friendversion' ] } );

				if( !_this.workspaceHasLoadedOnceBefore )
				{
					document.body.classList.add( 'Loading' );
					_this.workspaceHasLoadedOnceBefore = true;
				}


				// Lets load the stored window positions!
				LoadWindowStorage();

				// Set up a shell instance for the workspace
				var uid = FriendDOS.addSession( _this );
				_this.shell = FriendDOS.getSession( uid );

				// We're getting the theme set in an url var
				var th = '';
				if( ( th = GetUrlVar( 'theme' ) ) )
				{
					_this.refreshTheme( th, false );
					if( _this.loginPrompt )
					{
						_this.loginPrompt.close();
						_this.loginPrompt = false;
					}
					_this.init();
				}
				// See if we have some theme settings
				else
				{
					// Previously this was timeouted for 400 ms...
					var m = new Module( 'system' );
					m.onExecuted = function( e, d )
					{	
						/*var m = new Module( 'system' );
						m.onExecuted = function( ee, dd )
						{
					        if( ee != 'ok' )
					        {
					            ShowEula();
							}
				            afterEula( e );								
						}
						m.execute( 'getsetting', {
							setting: 'accepteula'
						} );*/
						afterEula( 'ok' );
						
						// When eula is displayed or not
						function afterEula( e )
						{
							if( e == 'ok' )
							{
								var s = {};
								try
								{
									s = JSON.parse( d );
								}
								catch( e )
								{ 
									s = {}; 
								};
								if( s && s.Theme && s.Theme.length )
								{
									_this.refreshTheme( s.Theme.toLowerCase(), false );
								}
								else
								{
									_this.refreshTheme( false, false );
								}
								_this.mimeTypes = s.Mimetypes;
							}
							else _this.refreshTheme( false, false );

							if( _this.loginPrompt )
							{
								_this.loginPrompt.close();
								_this.loginPrompt = false;
							}
							_this.init();
						}
					}
					m.execute( 'usersettings' );
				}
				if( callback && typeof( callback ) == 'function' ) callback();
				Workspace.postInit();
				return 1;
			}
			document.body.appendChild( s );
		}
		// We've already logged in
		else
		{
			setupWorkspaceData( json, function()
			{
				document.body.classList.remove( 'Login' );
				document.body.classList.add( 'Inside' );
			} );
			if( callback && typeof( callback ) == 'function' ) callback();
			return 1;
		}
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
		xhttp.open( 'GET', passWordResetURL, true);
		xhttp.send();
	},
	//set an additional URL to call on logout
	setLogoutURL: function( logoutURL )
	{
		Workspace.logoutURL = logoutURL;
	}
};

window.onoffline = function()
{
	Workspace.workspaceIsDisconnected = true;
}
window.ononline = function()
{
	Workspace.workspaceIsDisconnected = false;
}


