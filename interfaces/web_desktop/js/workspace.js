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
		var imgs = [ 
			'/webclient/gfx/system/offline_16px.png',
			'/themes/friendup/gfx/loading.gif'
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
		{
			if( this.initTimeout )
				clearTimeout( this.initTimeout );
			this.initTimeout = setTimeout ( 'Workspace.init()', 5 );
		}

		// We passed!
		this.initialized = true;

		// Do the init!
		window.addEventListener( 'beforeunload', Workspace.leave, true );

		this.loadSystemInfo();

		InitWindowEvents();
		InitWorkspaceEvents();
		InitGuibaseEvents();

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
			title: 'Friend Workspace v1.1',
			id:	'DoorsScreen',
			extra: Workspace.fullName,
			taskbar: true,
			scrolling: false
		} );

		// Make links to screen on this object
		this.screen = wbscreen;
		this.screenDiv = wbscreen.div;
		
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
				if( wd.showing )
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
						valign: 'top',
						halign: 'right',
						scrolling: false,
						autosize: true
					};
					ex.widget = new Widget( o );
					ex.widget.dom.style.transition = 'height 0.25s';
					ex.widget.showWidget = function()
					{
						ge( 'DoorsScreen' ).classList.add( 'HasWidget' );
						Workspace.refreshExtraWidgetContents();
						this.raise();
						this.show();
						if( isMobile )
							CoverScreens();
					}
					ex.widget.hideWidget = function()
					{
						ge( 'DoorsScreen' ).classList.remove( 'HasWidget' );
						if( this.showing )
						{
							this.showing = false;
							this.hide();
							this.lower();
							ExposeScreens();
						}
					}
				}
				if( !ex.widget.showing )
					ex.widget.showWidget();
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
			this.widget.showWidget = function()
			{
				ge( 'DoorsScreen' ).classList.add( 'HasWidget' );
				Workspace.refreshExtraWidgetContents();
				this.raise();
				this.show();
				CoverScreens();
			}
			this.widget.hideWidget = function()
			{
				ge( 'DoorsScreen' ).classList.remove( 'HasWidget' );
				this.showing = false;
				this.hide();
				this.lower();
				ExposeScreens();
			}
			this.refreshExtraWidgetContents();
			this.widget.showWidget();
			this.widget.slideUp = function()
			{
				ge( 'DoorsScreen' ).classList.remove( 'WidgetSlideDown' );
				document.body.classList.remove( 'WidgetSlideDown' );
				Workspace.widget.setFlag( 'height', 32 );
				Workspace.widget.touchDown = false;
				clearTimeout( Workspace.widget.tdtimeout );
				Workspace.widget.tdtimeout = false;
			}
			this.widget.dom.addEventListener( 'touchstart', function( evt )
			{
				if( Workspace.mainDock )
					Workspace.mainDock.closeDesklet();
					
				ge( 'DoorsScreen' ).classList.add( 'WidgetSlideDown' );
				document.body.classList.add( 'WidgetSlideDown' );
				Workspace.widget.setFlag( 'height', window.innerHeight - 112 );
				Workspace.widget.touchDown = { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
				// Timeout for slide
				Workspace.widget.tdtimeout = setTimeout( function()
				{
					Workspace.widget.touchDown = false;
					Workspace.widget.tdtimeout = false;
				}, 500 );
				hideKeyboard();
				cancelBubble( evt );
			} );
			this.widget.dom.addEventListener( 'touchmove', function( evt )
			{
				if( Workspace.widget.touchDown )
				{
					if( Workspace.widget.touchDown.y - evt.touches[0].clientY > 10 )
					{
						Workspace.widget.slideUp();
						cancelBubble( evt );
					}
				}
			} );
		}

		// Setup clock
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
					   StrPad( d.getMinutes(), 2, '0' ) + ':' +
					   StrPad( d.getSeconds(), 2, '0' );
			e +=    ' ' + StrPad( d.getDate(), 2, '0' ) + '/' +
					   StrPad( d.getMonth() + 1, 2, '0' ) + '/' + d.getFullYear();
			ex.time.innerHTML = e;
			
			// Realign workspaces
			Workspace.nudgeWorkspacesWidget();
		}
		this.clockInterval = setInterval( clock, 1000 );

		setTimeout( function(){ Workspace.informationWindow(); }, 1000 );

		// Recall wallpaper from settings
		this.refreshUserSettings( function(){ Workspace.refreshDesktop(); } );

		// Create desktop
		this.directoryView = new DirectoryView( wbscreen.contentDiv );

		// Create default desklet
		var mainDesklet = CreateDesklet( this.screenDiv, 64, 480, 'right' );
		mainDesklet.dom.style.zIndex = 2147483641;

		// Add desklet to dock
		this.mainDock = mainDesklet;
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
			
			Workspace.showContextMenu( men, e );
		}
		this.reloadDocks();

		// Init security subdomains
		SubSubDomains.initSubSubDomains();
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
				p = ( !p || p.indexOf('HASHED') == 0 ? p : ( 'HASHED' + Sha256.hash( p ) ) );

				var seed = ( u && p ? this.fcrypt.generateKey( ( u + ':' + p ), 32, 256, 'sha256' ) : false );

				var keys = ApplicationStorage.load( { applicationName : 'Workspace' } );

				if( !keys || ( keys && !keys.privatekey ) || ( keys && seed && keys.recoverykey != seed ) )
				{
					this.keyobject = this.fcrypt.generateKeys( false, false, false, seed );

					keys = this.fcrypt.getKeys( this.keyobject );
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
					}
					else
					{
						this.keys.client = {
							privatekey  : keys.privatekey,
							publickey   : keys.publickey,
							recoverykey : keys.recoverykey
						};
					}
				}
				
				//console.log( '--- Workspace.keys ---', { keys: this.keys } );
				
				return this.keys;
			}

			return false;
		},

		generateKeys: function( u, p )
		{
			if( typeof( this.fcrypt ) != 'undefined' )
			{
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
				//console.log( 'getserverkey: ', { e:e, d:d } );
				
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
	showLoginPrompt: function()
	{
		// Enable friend book mode
		if( document.body.getAttribute( 'friendbook' ) == 'true' )
			window.friendBook = true;
		
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
		
		if( Workspace.loginUsername && Workspace.loginPassword )
		{
			Workspace.reloginInProgress = true;
			Workspace.login( Workspace.loginUsername, Workspace.loginPassword, false, Workspace.initWebSocket );
		}
		else
		{
			Workspace.logout();
		}
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
	loginSessionId: function( sessionid, callback, ev )
	{
		if( sessionid )
		{
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

				Workspace.userLevel = json.level;

				var hasSessionID = ( json.sessionid && json.sessionid.length > 1 );
				var hasLoginID = ( json.loginid && json.loginid.length > 1 );

				if( json.result == '0' || hasSessionID || hasLoginID || json.result == 3 )
				{
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
		// TODO: If we have sessionid - verify it through ajax.

		if( this.sessionId )
		{
			if( callback && typeof( callback ) == 'function' ) callback( true );
			return true;
		}

		// Require username and pw to login
		if( !u || !p )
		{
			// Login by url vars
			if( GetUrlVar( 'username' ) && GetUrlVar( 'password' ) )
			{
				return Workspace.login( GetUrlVar( 'username' ), GetUrlVar( 'password' ) );
			}
			else if( GetUrlVar( 'sessionid' ) )
			{
				return Workspace.loginSessionId( GetUrlVar( 'sessionid' ) );
			}
			Workspace.reloginInProgress = false;
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

					//console.log( '--- localStorage --- ', window.localStorage );
				}

				// TODO: Do we need to store anything in cookie, this is unsafe??? use localStorage instead, works the same way but only for client storing, remove this ...

				if( this.loginUsername && this.loginPassword )
				{
					SetCookie( 'loginUsername', this.loginUsername );
					SetCookie( 'loginPassword', this.loginPassword );
				}
			}

			// Avoid queue!
			if( this.loginCall )
			{
				this.loginCall.destroy();
			}
			
			// Create a new library call object
			var m = new FriendLibrary( 'system' );
			this.loginCall = m;
			
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
				t.loginCall = null;
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

				Workspace.userLevel = json.level;

				var hasSessionID = ( json.sessionid && json.sessionid.length > 1 );
				var hasLoginID = ( json.loginid && json.loginid.length > 1 );

				if( json.result == '0' || hasSessionID || hasLoginID || json.result == 3 )
				{
					// See if we can start host integration
					if( typeof( FriendBook ) != 'undefined' )
						FriendBook.init();
				
					Workspace.reloginInProgress = null;
					return Workspace.initUserWorkspace( json, ( callback && typeof( callback ) == 'function' ? callback( true, serveranswer ) : false ), ev );
				}
				else
				{
					Workspace.reloginInProgress = null;
					if( t.loginPrompt )
						t.loginPrompt.sendMessage( { command: 'error', other: 'test' } );
					if( callback && typeof( callback ) == 'function' ) callback( false, serveranswer );

				}
				document.body.className = 'Login';
			}
			m.forceHTTP = true;
			m.execute( 'login' );
		}

		// Show it
		this.showDesktop();

		return 0;
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
		var _this = Workspace;
		
		// Once we are done
		function setupWorkspaceData( json, cb )
		{
			// Ok, we're in
			_this.sessionId = json.sessionid ? json.sessionid : null;
			_this.userId    = json.userid;
			_this.fullName  = json.fullname;

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
				_this.renewAllSessionIds();
				
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
			
			// Call back!
			if( cb ) cb();
		}
		
		if( !this.userWorkspaceInitialized )
		{
			this.userWorkspaceInitialized = true;

			// Loading remaining scripts
			var s = document.createElement( 'script' );
			s.src = '/webclient/js/gui/workspace_inside.js;' +
				'webclient/3rdparty/adapter.js;' +
				'webclient/js/utils/speech-input.js;' +
				'webclient/js/utils/events.js;' +
				'webclient/js/io/directive.js;' +
				'webclient/js/io/door.js;' +
				'webclient/js/io/dormant.js;' +
				'webclient/js/io/door_system.js;' +
				'webclient/js/io/module.js;' +
				'webclient/js/io/file.js;' +
				'webclient/js/io/progress.js;' +
				'webclient/js/io/friendnetwork.js;' +
				'webclient/js/gui/widget.js;' +
				'webclient/js/gui/listview.js;' +
				'webclient/js/gui/directoryview.js;' +
				'webclient/js/gui/menufactory.js;' +
				'webclient/js/gui/workspace_menu.js;' +
				'webclient/js/gui/deepestfield.js;' +
				'webclient/js/gui/filedialog.js;' +
				'webclient/js/gui/desklet.js;' +
				'webclient/js/gui/calendar.js;' +
				'webclient/js/media/audio.js;' +
				'webclient/js/io/p2p.js;' +
				'webclient/js/io/request.js;' +
				'webclient/js/io/coreSocket.js;' +
				'webclient/js/io/networkSocket.js;' +
				'webclient/js/io/connection.js;' +
				'webclient/js/friendmind.js;' +
				'webclient/js/frienddos.js;' +
				'webclient/js/oo.js';
			s.onload = function()
			{
				// Start with expanding the workspace object
				// TODO: If we have sessionid - verify it through ajax.
				if( _this.sessionId )
				{
					if( callback && typeof( callback ) == 'function' ) callback( true );
					return true;
				}

				if( !json || !json.sessionid ) return false;

				// Reset some options
				if( ev && ev.shiftKey )
				{
					_this.themeOverride = 'friendup';
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

					// Add it!
					i18nClearLocale();
					if( e == 'ok' )
					{
						_this.locale = JSON.parse( d ).locale;
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
						var res = JSON.parse( d );
						if( res.response == 'Failed to load user.' )
						{
							_this.logout();
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
						m.execute( 'usersettings' );
					}, 400 );
				}
				if( callback && typeof( callback ) == 'function' ) callback();
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
		xhttp.open("GET", passWordResetURL, true);
		xhttp.send();
	},
	//set an additional URL to call on logout
	setLogoutURL: function( logoutURL )
	{
		Workspace.logoutURL = logoutURL;
	}
}
