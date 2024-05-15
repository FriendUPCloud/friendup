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
* other places. This is the app space version of workspace!                    *
*                                                                              *
*******************************************************************************/
const _protocol = document.location.href.split( '://' )[0];

/* dummy structure */
DeepestField = {
	drawTasks: function() {},
	networkActivity: { timeToFinish: [] },
	addConnection: function(){},
	delConnection: function(){},
	cleanTasks: function(){}
};

Workspace = {
	locale: 'en',
	theme: 'friendup13',
	themeData: {
		buttonSchemeText: "windows",
		colorSchemeText: "default"
	},
	serverConfig: {},
	exitMobileMenu: function()
	{
		document.body.classList.remove( 'WorkspaceMenuOpen' );
		if( ge( 'WorkspaceMenu' ) )
		{
			let eles = ge( 'WorkspaceMenu' ).getElementsByTagName( '*' );
			for( let z = 0; z < eles.length; z++ )
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
	getWhiteLabelPass: function( app, cbk )
	{
		let self = this;
		this.whiteLabelPass = true;
		
		let xm = new XMLHttpRequest();
		xm.open( 'GET', document.location.href.split( '/webclient' )[0] + '/wl/?app=' + app, true );
		xm.onload = function()
		{
			try
			{
				self.whiteLabel = JSON.parse( this.responseText );
				if( self.whiteLabel.Background )
				{
					document.body.style.background = 'url(' + self.whiteLabel.Background + ')';
				}
				if( self.whiteLabel.CSS )
				{
					let st = document.createElement( 'style' );
					st.setAttribute( 'type', 'text/css' );
					st.innerHTML = self.whiteLabel.CSS;
					document.head.appendChild( st );
				}
			}
			catch( e ){};
			cbk();
		}
		xm.send();
	},
	showLoginPrompt: function()
	{
		let self = this;
		
		const app = GetUrlVar( 'app' );
		if( app && !this.whiteLabelPass )
		{
			return this.getWhiteLabelPass( app, function()
			{
				if( GetUrlVar( 'logintoken' ) )
					return;
				self.showLoginPrompt();
			} );
		}
		
		
		ScreenOverlay.init();
		
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
		lp.iframe.addEventListener( 'load', function()
		{
			if( self.whiteLabel.Logo )
			{
				let st = document.createElement( 'style' );
				st.setAttribute( 'type', 'text/css' );
				st.innerHTML = `
html body div.Logo 
{ 
	background-image: url(${self.whiteLabel.Logo});
	background-size: contain; 
	background-position: center;
	background-color: transparent; 
	margin: -10px 0px 20px 0px;
}`;
				lp.iframe.contentWindow.document.body.appendChild( st );
			}
			if( self.whiteLabel.CSS )
			{
				let st = document.createElement( 'style' );
				st.setAttribute( 'type', 'text/css' );
				st.innerHTML = self.whiteLabel.CSS;
				lp.iframe.contentWindow.document.body.appendChild( st );
			}
		} );
		Workspace.loginPrompt = lp;
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
	init: function( mode )
	{
		// Add locale
		i18nAddPath( 'locale/en.locale' );

		// Interpret directive
		let urlVars = {};
		let url = document.location.href;
		if( url.indexOf( '?' ) > 0 )
		{
			url = url.split( '?' )[1];
			if( url.indexOf( '&' ) > 0 )
			{
				url = url.split( '&' );
			}
			else
			{
				url = [ url ];
			}
			
			for( let a = 0; a < url.length; a++ )
			{
				let pair = url[a].split( '=' );
				urlVars[pair[0]] = decodeURIComponent( pair[1] );
				if( urlVars[pair[0]].indexOf( ':' ) > 0 )
				{
					// JSON?
					try
					{
						let o = JSON.parse( urlVars[pair[0]] );
						if( o ) urlVars[pair[0]] = o;
					}
					// No, a path maybe
					catch( e )
					{
						// Good
					}
				}
			}
		}
		
		this.conf = urlVars;
		
		// Rewrite
		if( this.conf && !this.conf.app )
		{
			this.conf.app = document.location.href.match( /app\/(.*)/i );
			if( this.conf.app && this.conf.app.length > 0 )
			{
				this.conf.app = this.conf.app[1];
				if( this.conf.app.substr( -11, 11 ) == '/index.html' )
					this.conf.app = this.conf.app.substr( 0, this.conf.app.length - 11 );
				else if( this.conf.app.substr( -1, 1 ) == '/' )
					this.conf.app = this.conf.app.substr( 0, this.conf.app.length - 1 );
			}
			else
			{
				document.location.href = 'index.html';
			}
		}

		this.mode = mode;

		if( !this.sessionId )
		{
			return this.showLoginPrompt();
		}
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
	initUserWorkspace: function( json )
	{
		if( this.userWorkspaceInitialized ) return;
		this.userWorkspaceInitialized = true;
		let t = this;
		let _this = t;
		
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
		
		// Loading remaining scripts
		let f = new XMLHttpRequest();
		f.open( 'GET', '/webclient/js/gui/workspace_inside_webapp.js;' +
			'webclient/js/gui/workspace_support.js;' +
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
			'webclient/js/api/friendAPIv1_2.js',
			true
		);
		f.onload = function( data )
		{
			window.eval( this.responseText );
			if( Workspace.loginPrompt )
			{
				Workspace.loginPrompt.close();
				Workspace.loginPrompt = null;
			}
			
			t.getMountlist(); // Just init structures
			
			// Setup default Doors screen
			let wbscreen = new Screen( {
					title: GetUrlVar( 'app' ) ? GetUrlVar( 'app' ) : 'Friend OS',
					id:	'DoorsScreen',
					extra: Workspace.fullName,
					taskbar: false
				}
			);

			// Touch start show menu!
			wbscreen.contentDiv.addEventListener( 'click', function( e )
			{
				let t = e.target ? e.target : e.srcElement;
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

			SetupWorkspaceData( json );

			document.body.style.visibility = 'visible';
			
			// Loading notice
			let loading = document.createElement( 'div' );
			loading.className = 'LoadingMessage';
			if( !t.conf || typeof( t.conf.app ) == 'undefined' )
			{
				loading.innerHTML = '<p>Nothing to load...</p>';
			}
			else loading.innerHTML = '<p>Entering ' + t.conf.app + '...</p>';
			document.body.appendChild( loading );
			setTimeout( function()
			{
				loading.classList.add( 'Loaded' );
			}, 25 );
			
			if( t.conf.app )
			{				
				return loadApplicationBasics( function()
				{
					function onloadedapp( result )
					{
						// Prevent loading twice...
						if( document.body.loaded ) return;
						document.body.loaded = true;
					
						// Remove loading notice
						if( loading )
						{
							loading.classList.remove( 'Loaded' );
							setTimeout( function()
							{
								if( loading )
								{
									loading.parentNode.removeChild( loading );
									loading = null;
								}
							}, 500 );
						}
					}
					if( t.conf.app.indexOf( '.jsx' ) > 0 )
					{
						function executeJSXBP( app, conf )
						{
							if( !Workspace.icons.length )
							{
								console.log( 'REtry..' );
								return setTimeout( function(){ executeJSXBP( app, conf ); }, 50 );
							}
							else
							{
								for( let a = 0; a < Workspace.icons.length; a++ )
								{
									if( app.indexOf( Workspace.icons[ a ].Path ) == 0 )
									{
										conf.authid = Workspace.icons[a].AuthID;
									}
								}
								ExecuteJSXByPath( app, GetUrlVar( 'data' ), function( result )
								{
									onloadedapp( result );
								}, conf );
							}
						}
						if( !t.conf.authid )
							executeJSXBP( t.conf.app, t.conf );	
						return;
					}
					ExecuteApplication( t.conf.app, GetUrlVar( 'data' ), function( result )
					{
						onloadedapp( result );
					} );
				} );
			}
		}
		f.send();
		
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
	getMountlist: function( callback = false )
	{
		let self = this;
		if( !Friend.dosDrivers )
		{
			let d = new Module( 'system' );
			d.onExecuted = function( res, dat )
			{
				if( res != 'ok' )
				{
					self.getMountlist( callback );
					return;
				}
				let types = null;
				try
				{
					let types = JSON.parse( dat );
					Friend.dosDrivers = {};
					for( let a = 0; a < types.length; a++ )
					{
						Friend.dosDrivers[ types[ a ].type ] = types[a];
					}
				}
				catch( e )
				{
					return Friend.dosDrivers = null;
				}
				self.getMountlist( callback );
			}
			d.execute( 'types', { mode: 'all' } );
			return;
		}
		let t = this;
		let m = new Module( 'system' );
		m.onExecuted = function( e, dat )
		{
			t.icons = [];

			// Check dormant
			if( DormantMaster )
			{
				let doors = DormantMaster.getDoors();
				let found = [];
				for( let a = 0; a < doors.length; a++ )
				{
					// Fixie
					if( doors[a].Title && !doors[a].Volume )
						doors[a].Volume = doors[a].Title;
					doors[a].Filesize = '';
					let isfound = false;
					for( let b = 0; b < found.length; b++ )
						if( found[b].Title == doors[a].Title )
							isfound = true;
					if( !isfound )
					{
						t.icons.push( doors[a] );
					}
					found.push( doors[a] );
				}
			}

			// Network devices
			let rows = friendUP.tool.parse( dat );
			if ( rows && rows.length )
			{
				for ( let a = 0; a < rows.length; a++ )
				{
					let r = rows[a];
					if( r.Mounted != '1' )
					{
						continue;
					}
					let o = false;

					let d;

					let typ = r.Type.substr(0,1).toUpperCase()+r.Type.substr(1,r.Type.length);

					d = ( new Door() ).get( r.Name + ':' );
					d.permissions[0] = 'r';
					d.permissions[1] = 'w';
					d.permissions[2] = 'e';
					d.permissions[3] = 'd';

					let i = {
						Title: r.Name.split(':').join('') + ':',
						Volume: r.Name.split(':').join('') + ':',
						Path: r.Name.split(':').join('') + ':',
						Type: 'Door',
						MetaType: 'Directory',
						ID: r.ID,
						Mounted: r.Mounted ? true : false,
						Door: d,
						AuthID: r.AuthID
					};

					// Force mounnt
					let f = new FriendLibrary( 'system.library' );
					f.addVar( 'type', r.Type );
					f.addVar( 'devname', r.Name.split(':').join('') );
					if( r.Type != 'Local' )
						f.addVar( 'module', 'system' );
					f.execute( 'device/mount' );

					// We need volume information
					d.Volume = i.Volume;
					d.Type = typ;

					// Add to list
					t.icons.push( i );
				}
			}

			// Do the callback thing
			if( callback ) callback( t.icons );
		}
		m.execute( 'mountlist', this.conf );

		return true;
	},
	// Just check if the system is being used or has expired
	pingAccount: function()
	{
		let realApps = 0;
		for( let a = 0; a < Workspace.applications.length; a++ )
		{
			realApps++;
		}
		if( realApps > 0 )
		{
			let m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e != 'ok' )
				{
					return false;
				}
			}
			m.execute( 'ping' );
		}
	},

	// Dummy functions here
	updateTasks: function(){},
	refreshDesktop: function( callback = false ){ if ( typeof( callback ) == 'function' ) callback(); },
	showDesktop: function(){},
	refreshMenu: function(){},
	// Objects and arrays
	icons: [],
	reloginAttempts: 0,
	menuMode: 'pear',
	initialized: true,
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
	//set an additional URL to call on logout
	setLogoutURL: function( logoutURL )
	{
		Workspace.logoutURL = logoutURL;
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
	},
}
Doors = Workspace;
