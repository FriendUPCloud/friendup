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

DeepestField = {
	addConnection: function()
	{
		return;
	},
	delConnection: function()
	{
		return;
	},
	networkActivity: {
		timeToFinish: []
	}
};

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
	df: DeepestField,
	themeOverride: false,
	systemInfo: false,
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
	websocketsOffline: true,
	pouchManager : null,
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
				//console.log( 'Message?', msg );
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
		
		if( window.PouchManager && !this.pouchManager )
			this.pouchManager = new PouchManager();
		
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
		
		// Recall wallpaper from settings
		this.refreshUserSettings( function(){ Workspace.refreshDesktop(); } );
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
	// When session times out, use relogin
	relogin: function()
	{
		var d = document.createElement( 'div' );
		d.id = 'SessionBlock';
		document.body.appendChild( d );
		var f = new File( 'System:templates/login_relogin.html' );
		f.onLoad = function( data )
		{	
			Workspace.sessionId = '';
			d.innerHTML = data;
		}
		f.load();
		
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
			document.body.classList.remove( 'Loading' );
			document.body.classList.add( 'Loaded' );
			FriendVR.init();
			
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
	fileInfo : function( icon )
	{
		if( !icon ) icon = this.getActiveIcon();
		
		// Check volume
		if( icon )
		{
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
		}
		// check if we have a selected icon
		if( icon )
		{
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
			
						// Alfio, look here!
						// Build UI from data:
						// Done building
			
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
			var m = new cAjax();
			m.open( 'get', '/system.library/user/logout/?sessionid=' + Workspace.sessionId, true );
			m.onload = function()
			{
				Workspace.sessionId = ''; document.location.reload(); 
			}
			m.send();
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
			Workspace.workspaceIsDisconnected = true;
		}
		else
		{
			document.body.classList.remove( 'Offline' );
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
		window.attachEvent( 'onresize', function() {} );
		window.attachEvent( 'onkeydown', DoorsKeyDown );
	}
	else 
	{
		window.addEventListener( 'mousemove', DoorsListener, false );
		window.addEventListener( 'mouseout', DoorsOutListener, false );
		window.addEventListener( 'mouseleave', DoorsLeaveListener, false );
		window.addEventListener( 'resize', function() {} );
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
	
	v.setRichContentUrl( '/webclient/templates/about.html',false,null,null,function() {

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
		
	});
	
	
	//this.setRichContentUrl = function( url, base, appId, filePath, callback )
	
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

function handleServerNotice( e ) {
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

