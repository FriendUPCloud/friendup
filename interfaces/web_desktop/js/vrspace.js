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

DeepestField = {
	drawTasks: function() {},
	networkActivity: { timeToFinish: [] },
	addConnection: function(){},
	delConnection: function(){},
	redraw: function(){}
};

Workspace = {
	screen: {
		contentDiv: {
			innerHTML: '',
			redrawIcons: function(){}
		},
		getMaxViewWidth(){ return window.innerWidth; },
		getMaxViewHeight(){ return window.innerHeight; },
		hideOfflineMessage(){ document.body.classList.remove( 'Busy' ); },
		hideOverlay(){}
	},
	icons: [],
	reloginAttempts: 0,
	menuMode: 'vr', // 'miga', 'fensters' (alternatives)
	mode: 'vr',
	initialized: false,
	protocol: _protocol,
	menu: [],
	diskNotificationList: [],
	notifications: [],
	notificationEvents: [],
	applications: [],
	importWindow: false,
	menuState: '',
	df: DeepestField,
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
	pouchManager: null,
	deviceid: GetDeviceId(),

	preinit: function( mode )
	{
		// Go ahead and init!
		ScreenOverlay.init();
		
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
		
		// Wait for load
		if( typeof( InitWindowEvents ) == 'undefined' || typeof( InitGuibaseEvents ) == 'undefined' )
		{
			return setTimeout( 'Workspace.init()', 50 );
		}


		// Show the login prompt if we're not logged in!
		this.login();
	},
	// Ready after init
	postInit: function()
	{
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
		this.getMountlist( function()
		{
			FriendVR.init();
			document.body.classList.remove( 'Busy' );
		} );
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
				let allowed = [ 'module', 'verify' ];
				
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
		
		var lp = new View( {
			id: 'Login',
			width: 432,
			'min-width': 290,
			'max-width': 432,
			height: 480,
			'min-height': 280,
			'resize': false,
			title: 'Login to FriendOS',
			close: false,
			login: true,
			theme: 'login'
		} );
		lp.setRichContentUrl( '/loginprompt' + allowedHashVars() );
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
				Friend.User.RenewAllSessionIds();

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
				'webclient/js/io/DOS.js;' +
				'webclient/3rdparty/favico.js/favico-0.3.10.min.js;' +
				'webclient/js/gui/widget.js;' +
				'webclient/js/gui/listview.js;' +
				'webclient/js/gui/directoryview.js;' +
				'webclient/js/gui/menufactory.js;' +
				'webclient/js/gui/workspace_menu.js;' +
				'webclient/js/gui/filedialog.js;' +
				'webclient/js/gui/printdialog.js;' +
				'webclient/js/gui/desklet.js;' +
				'webclient/js/gui/calendar.js;' +
				'webclient/js/gui/colorpicker.js;' +
				'webclient/js/gui/workspace_tray.js;' +
				'webclient/js/vr/vrengine.js;' +
				'webclient/js/vr/vrwrapper.js;' +
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
				if( _this.sessionId )
				{
					if( callback && typeof( callback ) == 'function' ) callback( true );
					return true;
				}

				if( !json || !json.sessionid ) return false;

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
					
					var decoded = JSON.parse( d );

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
					// As for body.Inside screens, use > 0.2secs
					setTimeout( function()
					{
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
						}
						m.execute( 'usersettings' );
					}, 400 );
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

