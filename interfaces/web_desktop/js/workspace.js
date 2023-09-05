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
	receivePush: function()
	{
		return false;
	},
	environmentName: 'Workspace',
	osName: 'FriendOS',
	staticBranch: 'Helium',
	icons: [],
	menuMode: 'pear', // 'miga', 'fensters' (alternatives) -> other menu behaviours
	mode: 'default',
	initialized: false,
	protocol: _protocol,
	protocolUrl: _protocol + '://',
	menu: [],
	diskNotificationList: [],
	notifications: [],
	notificationEvents: [],
	applications: [],
	importWindow: false,
	menuState: '',
	themeOverride: false,
	systemInfo: false,
	lastfileSystemChangeMessage: false,
	userSettingsLoaded: false, // Tell when user settings loaded
	desktopFirstRefresh: false, // Tell when workspace first refreshed
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

		// Get web push
		let webpush = GetUrlVar( 'webpush' );
		if( webpush )
		{
			webpush = JSON.parse( decodeURIComponent( webpush ) );
			alert( 'Got Web Push: ' + webpush.application );
		}
		

		// Preload some images
		let imgs = [
			'/webclient/gfx/system/offline_16px.png',
			'/themes/friendup13/gfx/busy.png'
		];
		this.imgPreload = [];
		for( let a = 0; a < imgs.length; a++ )
		{
			let i = new Image();
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
		Friend.User.Login();
	},
	// Ready after init
	// NB: This is where we go towards workspace_inside.js
	postInit: function()
	{
		if( this.postInitialized ) return;
		
		// Init push notifications
		if( 'serviceWorker' in navigator )
		{
			navigator.serviceWorker.register( '/service-worker.js' )
			.then( registration => {
				let m = new Module( 'system' );
				m.onExecuted = function( ee, dd )
				{
					if( ee == 'ok' )
					{
						// Request permission for push notifications
						Notification.requestPermission().then( permission => {
							if( permission === 'granted' ) 
							{
								// User granted permission, now subscribe to push notifications
								navigator.serviceWorker.ready
									.then( serviceWorkerRegistration => {
										function urlBase64ToUint8Array( base64String )
										{
											// Fix string
											let rawData = window.atob( base64String );
											rawData = rawData.split( "\r\n" ).join( "" ).split( "\n" ).join( "" );
											
											const padding = '='.repeat( ( 4 - rawData.length % 4 ) % 4 );
											const base64 = (rawData + padding).replace(/-/g, '+').replace(/_/g, '/');
											rawData = window.atob( base64 );
											
											const outputArray = new Uint8Array( rawData.length );
											for( let i = 0; i < rawData.length; ++i )
											{
												outputArray[ i ] = rawData.charCodeAt( i );
											}
											return outputArray;
										}
										serviceWorkerRegistration.pushManager.subscribe( {
											userVisibleOnly: true,
											applicationServerKey: urlBase64ToUint8Array( dd )
										} ).then( pushSubscription => {
											let m2 = new Module( 'system' );
											m2.onExecuted = function( eee, ddd )
											{
												if( eee == 'ok' )
												{
													console.log( 'Web Push: System for web push initialized.' );
													return;
												}
											}
											m2.execute( 'webpush-subscribe', { data: JSON.stringify( pushSubscription ) } );
										} ).catch( error => {
											console.error( 'Error subscribing to push notifications:', error );
										} );
									} );
							}
							else
							{
								console.log( 'Web Push: Could not get push permissions.' );
							}
						} );
						return;
					}
					console.log( 'Web Push: Failed to get VAPID key.' );
				}
				m.execute( 'getvapidkey' );
				
			} )
			.catch( error => {
				console.error( 'Web Push: Service Worker registration failed:', error );
			} );
		}
		
		let self = this;
		
		// Everything must be ready
		if( typeof( ge ) == 'undefined' )
		{
			if( this.initTimeout )
				clearTimeout( this.initTimeout );
			this.initTimeout = setTimeout ( 'Workspace.postInit()', 25 );
			return;
		}

		// We passed!
		self.postInitialized = true;
		
		if( this.loginPrompt )
			this.loginPrompt.setFlag( 'hidden', 1 );

		// Do the init!
		window.addEventListener( 'beforeunload', Workspace.leave, true );

		InitWindowEvents();
		InitWorkspaceEvents();
		InitGuibaseEvents();

		let dapis = document.createElement( 'script' );
		dapis.src = '/system.library/module/?module=system&command=doorsupport&sessionid=' + this.sessionId;
		document.getElementsByTagName( 'head' )[0].appendChild( dapis );

		// Add event listeners
		for( let a = 0; a < this.runLevels.length; a++ )
		{
			let listener = this.runLevels[a].listener;

			if ( !listener )
				continue;

			if( window.addEventListener )
				window.addEventListener( 'message', listener, true );
			else window.attachEvent( 'onmessage', listener, true );
		}

		// Set base url
		this.baseUrl = document.location.href.split( 'index.html' )[0];

		// Setup default Doors screen
		let wbscreen = new Screen( {
			title: Workspace.environmentName,
			id:	'DoorsScreen',
			extra: Workspace.fullName,
			taskbar: true,
			scrolling: false
		} );

		// Make links to screen on this object
		this.screen = wbscreen;
		this.screenDiv = wbscreen.div;
		
		let tray = document.createElement( 'div' );
		tray.id = 'Tray';
		this.screenDiv.appendChild( tray );

		// Init the deepest field
		if( !isMobile )
			DeepestField.init();
		else DeepestField = false;

		// Key grabber
		if( !ge( 'InputGrabber' ) )
		{
			let i = document.createElement( 'input' );
			i.type = 'text';
			i.id = 'InputGrabber';
			i.style.position = 'absolute';
			i.style.left = '-1000px';
			i.style.top = '0';
			i.style.opacity = 0;
			i.style.pointerEvents = 'none';
			ge( 'DoorsScreen' ).appendChild( i );
		}

		wbscreen.div.addEventListener( 'mousedown', function( e )
		{
			let wd = wbscreen.div.screenTitle.getElementsByClassName( 'Extra' )[0].widget;
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
			let ex = wbscreen.div.screenTitle.getElementsByClassName( 'Extra' )[0];
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
						let sself = this;
						this.dom.style.height = '0px';
						Workspace.refreshExtraWidgetContents();
						CoverScreens();
						ge( 'DoorsScreen' ).classList.add( 'HasWidget' );
						setTimeout( function()
						{
							sself.show();
							sself.raise();
							ExposeScreens();
						}, 100 );
					}
					ex.widget.hideWidget = function()
					{
						let sself = this;
						ge( 'DoorsScreen' ).classList.add( 'HidingCalendar' );
						setTimeout( function()
						{
							ge( 'DoorsScreen' ).classList.remove( 'HasWidget' );
							ge( 'DoorsScreen' ).classList.remove( 'HidingCalendar' );
							sself.shown = false;
							sself.hide();
							sself.lower();
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
			let ex = ge( 'DoorsScreen' ).screenObject._titleBar;
			ex = ex.getElementsByClassName( 'Extra' )[0];
			function clock()
			{
				let d = new Date();
				if( !ex.time )
				{
					let t = document.createElement( 'div' );
					t.className = 'Time';
					ex.appendChild( t );
					ex.time = t;
				}
				if( !Friend.User.ServerIsThere )
				{
					if( !ex.offline )
					{
						let o = document.createElement( 'div' );
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
				let etime = '';
				etime    += StrPad( d.getHours(), 2, '0' ) + ':' +
						    StrPad( d.getMinutes(), 2, '0' );
				ex.time.innerHTML = etime;

				// Realign workspaces
				Workspace.nudgeWorkspacesWidget();
				Workspace.refreshExtraWidgetContents(); // < Screenbar icons
			}
			this.clockInterval = setInterval( clock, 30000 );
			clock();
		}

		// Start the workspace session!
		this.initializingWorkspaces = true;
		this.initWorkspaces( function( returnValue )
		{
			// Recall wallpaper from settings
			self.refreshUserSettings( function(){ 
				// Refresh desktop for the first time
				Workspace.refreshDesktop( false, true );
			} );

			// Create desktop
			self.directoryView = new DirectoryView( wbscreen.contentDiv );

			// Create default desklet
			let mainDesklet = CreateDesklet( self.screenDiv, 64, 480, 'right' );

			// Add desklet to dock
			self.mainDock = mainDesklet;
			if( !isMobile )
			{
				self.mainDock.dom.oncontextmenu = function( e )
				{
					let tar = e.target ? e.target : e.srcElement;
					if( tar.classList && tar.classList.contains( 'Task' ) )
					{
						return Workspace.showContextMenu( false, e );
					}

					let men = [
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
								let t = GetTaskbarElement();
								let lW = null;
								for( let a = 0; a < t.childNodes.length; a++ )
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
								let t = GetTaskbarElement();
								for( let a = 0; a < t.childNodes.length; a++ )
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
				self.mainDock.dom.oncontextmenu = function( e )
				{
					let tar = e.target ? e.target : e.srcElement;
					if( window.MobileContextMenu )
					{
						MobileContextMenu.show( tar );
					}
				}
			}
			self.reloadDocks();
		} );

		// Init security subdomains
		SubSubDomains.initSubSubDomains();
	},
	setLoading: function( isLoading )
	{
		if( isLoading )
		{
			document.body.classList.add( 'Loading' );
		}
		else
		{
			if( !this.initializingWorkspaces )
			{
				document.body.classList.add( 'Inside' ); // If not exists
				document.body.classList.add( 'Loaded' );
				document.body.classList.remove( 'Login' ); // If exists
				document.body.classList.remove( 'Loading' );
			}
		}
	},
	// Just a stub - this isn't used anymore
	rememberKeys: function() {
		return false;
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
			let k = new Module( 'system' );
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
		
		// Allowed hash vars we can send to loginpromt
		function allowedHashVars()
		{
			let vars = []; let hash = {};
			
			if( window.location.hash && window.location.hash.split( '#' )[1] )
			{
				let allowed = [ 'module', 'verify', 'invite' ];
				
				let url = window.location.hash.split( '#' )[1].split( '&' );
				
				for( let a in url )
				{
					if( url[ a ].indexOf( '=' ) >= 0 && url[ a ].split( '=' )[ 0 ] )
					{
						hash[ url[ a ].split( '=' )[ 0 ] ] = url[ a ].replace( url[ a ].split( '=' )[ 0 ] + '=', '' );
					}
				}
				
				for( let b in allowed )
				{
					if( allowed[ b ] in hash )
					{
						vars.push( allowed[ b ] + '=' + hash[ allowed[ b ] ] );
					}
				}
				
				// Remove the hash values from the url after
				window.location.hash = '';
			}
			
			return ( vars.length > 0 ? ( '?' + vars.join( '&' ) ) : '' );
		}
		
		let lp = new View( {
			id: 'Login',
			width: 432,
			'min-width': 290,
			'max-width': 432,
			height: 480,
			'min-height': 280,
			'resize': false,
			title: 'Sign into your account',
			close: false,
			login: true,
			theme: 'login'
		} );
		lp.limitless = true;
		lp.onMessage = function( msg )
		{
			if( msg && msg.type && msg.src && msg.action == 'openWindow' )
			{
				switch( msg.type )
				{
					
					case 'terms':
					case 'eula':
					{
					    let titl = msg.type == 'eula' ? 'EULA' : 'terms';
					
						let v = new View( {
							title: 'Please verify our ' + titl,
							width: 432,
							height: 480,
							resize: false
						} );
						
						let f = new XMLHttpRequest();
						if( msg.type == 'eula' )
						{
						    f.open( 'POST', '/webclient/templates/EULA.html', true, true );
					    }
					    else
					    {
					        f.open( 'POST', msg.src, true, true );
					    }
						f.onload = function()
						{
							let t = this.responseText + '';
							t += '<hr class="Divider"/>\
								<div class="ContractAcceptReject">\
									<button type="button" class="IconSmall fa-remove" onclick="CloseView()"> Close</button>\
								</div>';
							v.setContent( t );
						}
						f.send();
					}
					break;
					
					case 'privacypolicy':
					{
						let v = new View( {
							title: 'Privacy policy',
							width: 432,
							height: 480,
							resize: false
						} );
						
						let f = new XMLHttpRequest();
						f.open( 'POST', '/webclient/templates/PrivacyPolicy.html', true, true );
						f.onload = function()
						{
							let t = this.responseText + '';
							t += '<hr class="Divider"/>\
								<div class="ContractAcceptReject">\
									<button type="button"  class="IconSmall fa-remove" onclick="CloseView()"> Close</button>\
								</div>';
							v.setContent( t );
						}
						f.send();
					}
					break;
					
				}
			}
		}
		lp.setRichContentUrl( '/loginprompt' + allowedHashVars() );
		Workspace.loginPrompt = lp;

		// Show it
		this.showDesktop();
	},
	flushSession: function()
	{
		Friend.User.FlushSession();
	},
	login: function( u, p, r, callback, ev )
	{
		// Use authmodule login
		if( Workspace.authModuleLogin )
		{
			console.log( 'Using our existing auth module.' );
			return Workspace.authModuleLogin( callback, window );
		}
		// Wrap to user object
		return Friend.User.Login( u, p, r, callback, ev );
	},
	// TODO: This function should never be used!
	loginSessionId: function( sessionid, callback, ev )
	{
		return Friend.User.LoginWithSessionId( sessionid, callback, ev );
	},
	showDesktop: function()
	{
		// View desktop
		// May be deprecated
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
		let _this = Workspace;

		// Once we are done
		function SetupWorkspaceData( json, cb )
		{	
			// Ok, we're in
			_this.sessionId = json.sessionid ? json.sessionid : null;
			_this.userId    = json.userid;
			_this.fullName  = json.fullname;
			if( json.username ) _this.loginUsername = json.username;

			// After a user has logged in we want to prepare the workspace for him.
			
			// Store user data in localstorage for later verification encrypted
			let userdata = ApplicationStorage.load( { applicationName : 'Workspace' } );

			if( userdata )
			{
				userdata.sessionId     = _this.sessionId;
				userdata.userId        = _this.userId;
				userdata.loginUsername = _this.loginUsername;
				userdata.fullName      = _this.fullName;

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
				
				// We have renewed our session, make sure to set it and run ajax queue
				Friend.User.RenewAllSessionIds( _this.sessionId );

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

		// Manipulate screen overlay
		if( !Workspace.screenOverlayShown )
		{
			ScreenOverlay.show();
			Workspace.screenOverlayShown = true;
		}
		
		if( !this.userWorkspaceInitialized )
		{
			this.userWorkspaceInitialized = true;
			
			// Loading remaining scripts
			let s = document.createElement( 'script' );
			s.src = '/webclient/js/gui/workspace_inside.js;' +
				'webclient/js/gui/workspace_support.js;' +
				'webclient/js/gui/filebrowser.js;' +
				'webclient/js/fui/fui_v1.js;' +
				'webclient/js/fui/classes/baseclasses.fui.js;' +
				'webclient/js/fui/classes/group.fui.js;' +
				'webclient/js/fui/classes/listview.fui.js;' +
				'webclient/3rdparty/adapter.js;' +
				'webclient/3rdparty/pdfjs/build/pdf.js;' +
				'webclient/js/utils/speech-input.js;' +
				'webclient/js/utils/events.js;' +
				'webclient/js/utils/utilities.js;' +
				'webclient/js/io/directive.js;' +
				'webclient/js/io/door.js;' +
				'webclient/js/io/dormant.js;' +
				'webclient/js/io/dormantramdisc.js;' +
				'webclient/js/io/door_system.js;' +
				'webclient/js/io/file.js;' +
				'webclient/js/io/progress.js;' +
				'webclient/js/io/workspace_fileoperations.js;' + 
				'webclient/js/io/DOS.js;' +
				'webclient/3rdparty/favico.js/favico-0.3.10.min.js;' +
				'webclient/js/gui/widget.js;' +
				'webclient/js/gui/listview.js;' +
				'webclient/js/gui/directoryview.js;' +
				'webclient/js/io/directoryview_fileoperations.js;' +
				'webclient/js/gui/menufactory.js;' +
				'webclient/js/gui/workspace_menu.js;' +
				'webclient/js/gui/tabletdashboard.js;' +
				'webclient/js/gui/deepestfield.js;' +
				'webclient/js/gui/filedialog.js;' +
				'webclient/js/gui/printdialog.js;' +
				'webclient/js/gui/desklet.js;' +
				'webclient/js/gui/calendar.js;' +
				'webclient/js/gui/colorpicker.js;' +
				'webclient/js/gui/workspace_calendar.js;' +
				'webclient/js/gui/workspace_tray.js;' +
				'webclient/js/gui/workspace_sharing.js;' +
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
			    // Start with expanding the workspace object
				if( _this.sessionId && _this.postInitialized )
				{
					//console.log( 'This is the session.:', _this.sessionId );
					if( callback && typeof( callback ) == 'function' ) callback( true );
					return true;
				}

				if( !json || !json.sessionid ) 
				{
					return false;
				}

				// Just get it done!
				function doInitInside()
				{
					window.InitWorkspaceNetwork();

					// Reset some options
					if( ev && ev.shiftKey )
					{
						_this.themeOverride = 'friendup13';
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

					SetupWorkspaceData( json );
					
					if( !_this.workspaceHasLoadedOnceBefore )
					{
						Workspace.setLoading( true );
						_this.workspaceHasLoadedOnceBefore = true;
					}


					// Lets load the stored window positions!
					LoadWindowStorage();

					// Set up a shell instance for the workspace
					let uid = FriendDOS.addSession( _this );
					_this.shell = FriendDOS.getSession( uid );
					
					// We're getting the theme set in an url var
					let th = '';
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
						// Check eula
						let m = new Module( 'system' );
						m.onExecuted = function( e, d )
						{
							let m2 = new Module( 'system' );
							m2.onExecuted = function( ee, dd )
							{
							    if( ee != 'ok' )
							    {
							    	if( dd )
							    	{
							    		try
							    		{
							    			let js = JSON.parse( dd );
							    			if( js.euladocument )
							    			{
							    				Workspace.euladocument = js.euladocument;
							    			}
							    		}
							    		catch( e ){};
							    	}
							        ShowEula();
								}
						        afterEula( e );								
							}
							m2.execute( 'checkeula' );
							
							// When eula is displayed or not
							function afterEula( ev )
							{
								// Invites
								if( json.inviteHash )
								{
									let inv = new Module( 'system' );
									inv.onExecuted = function( err, dat )
									{
										// TODO: Make some better error handling ...
										if( err != 'ok' ) console.log( '[ERROR] verifyinvite: ' + ( dat ? dat : err ) );
									}
									inv.execute( 'verifyinvite', { hash: json.inviteHash } );
								}
								
								if( ev == 'ok' )
								{
									let s = {};
									try
									{
										s = JSON.parse( d );
									}
									catch( e )
									{ 
										s = {}; 
									}
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
								else 
								{
									_this.refreshTheme( false, false );
								}

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
					
					// Language
					_this.locale = 'en';
					let l = new Module( 'system' );
					l.onExecuted = function( e, d )
					{
						// New translations
						i18n_translations = [];
						
						let decoded = false;
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
						if( typeof( decoded.friendversion ) == 'undefined' || decoded.friendversion == 'undefined' )
						{
							Workspace.friendVersion = false;
						}
						else
						{
							Workspace.friendVersion = decoded.friendversion;
						}
						
						if( callback && typeof( callback ) == 'function' ) callback();
						Workspace.postInit();
					}
					l.execute( 'getsetting', { settings: [ 'locale', 'friendversion' ] } );
				}
				if( window.InitWorkspaceNetwork && window.FriendDOS )
					doInitInside();
				else setTimeout( function(){ doInitInside(); }, 50 );
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
	//set an additional URL to call on logout
	setLogoutURL: function( logoutURL )
	{
		if( logoutURL )
			Workspace.logoutURL = logoutURL;
	}
};

window.onoffline = function()
{
	Friend.User.SetUserConnectionState( 'offline' );
}
window.ononline = function()
{
	Friend.User.CheckServerConnection();
}


function initBrowser()
{
	if( !document.body )
		return setTimeout( initBrowser, 100 );
	if( navigator.userAgent.indexOf( 'Safari' ) > 0 )
	{
		document.body.classList.add( 'Safari' );
	}
}
initBrowser();
