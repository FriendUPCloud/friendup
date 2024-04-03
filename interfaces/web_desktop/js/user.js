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
* User object manages sessions, login and logout                               *
*                                                                              *
*******************************************************************************/

Friend = window.Friend || {};

Friend.User = {
    
    // Vars --------------------------------------------------------------------
    State: 'online', 			// online, offline, login
    ServerIsThere: true,
    Username: '',               // Holds the user's username
    AccessToken: null,          // Holds the user's access token
    ConnectionAttempts: 0,      // How many relogin attempts were made
    ConnectionIncidents: 0,     // How many connection stream attemts counted
    CookiePrefix: ( function(){
    	let m = document.location.href.match( /webclient\/(.*?)\.html/ );
    	if( !m )
    		m = document.location.href.match( /app\/(.*?)\// );
    	if( m )
    		return m[0];
    	return 'index';
    } )(),
    
    // Methods -----------------------------------------------------------------
    
    // Log into Friend Core
    Login: function( username, password, remember, callback, event, flags )
    {
    	if( this.State == 'login' ) return;
    	
    	if( !username ) return Workspace.showLoginPrompt();
    	
    	this.State = 'login';
    	
    	if( !event ) event = window.event;
    	
    	let self = this;
		
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
			Workspace.conn = null;
		}
		
		if( username && password )
		{	
			Workspace.encryption.setKeys( username, password );
			
			if( flags && flags.hashedPassword )
			{
				//console.log( 'Sending login with hashed password.' );
				this.SendLoginCall( {
					username: username,
					password: password,
					remember: remember,
					hashedPassword: flags.hashedPassword,
					inviteHash: flags.inviteHash
				}, callback );
			}
			else
			{
				//console.log( 'Sending login with unhashed password' );
				this.SendLoginCall( {
					username: username,
					password: password,
					remember: remember,
					hashedPassword: false,
					inviteHash: flags && flags.inviteHash ? flags.inviteHash : false
				}, callback );
			}
		}
		// Relogin - as we do have an unflushed login
		else if( Workspace.sessionId )
		{
		    return this.ReLogin();
		}
		else
		{
			Workspace.showLoginPrompt();
		}
		
		return 0;
    },
    // Use login token
    LoginWithLoginToken: function( loginToken, callback )
    {
    	this.State = 'login';
    	this.SendLoginCall( {
			logintoken: loginToken
		}, callback );
    },
    // Login using a session id
    LoginWithSessionId: function( sessionid, callback, event )
    {
    	if( this.State == 'online' ) return;
    	this.State = 'login';
    	
    	if( !event ) event = window.event;
    	
    	let self = this;
		
		// Close conn here - new login regenerates sessionid
		if( Workspace.conn )
		{
			try
			{
				Workspace.conn.ws.cleanup();
			}
			catch( e )
			{
				console.log( 'Could not close conn.' );
			}
			delete Workspace.conn;
		}
		
		if( sessionid )
		{
			this.SendLoginCall( {
				sessionid: sessionid
			}, callback );
		}
		else
		{
			Workspace.showLoginPrompt();
		}
		
		return 0;
    },
    // Send the actual login call
    SendLoginCall: function( info, callback = false )
    {	
    	// Already logging in
    	this.State = 'login';
    	
    	if( this.lastLogin && this.lastLogin.currentRequest )
    	{
    		this.lastLogin.currentRequest.destroy();
    	}
    	
    	let self = this;
    	
    	// Create a new library call object
		let m = new FriendLibrary( 'system' );
		this.lastLogin = m;
		
		let usingLoginToken = false;
		
		if( !info.username && !info.password )
		{
			if( !info.logintoken && GetCookie( 'logintoken' ) )
				info.logintoken = GetCookie( 'logintoken' );
		}
		
		if( info.username && info.password )
		{
			Workspace.sessionId = '';
			
			if( window.Workspace && !Workspace.originalLogin )
			{
				Workspace.originalLogin = info.password;
			}
			
			// TODO: Fix hash detector by making sure hashing doesn't occur without hashedPassword flag set.
			let hashDetector = info.password.length > 20 && info.password.substr( 0, 6 ) == 'HASHED' ? true : false;
			if( !info.hashedPassword && hashDetector )
				info.hashedPassword = true;
			
			let hashed = info.hashedPassword ? info.password : ( 'HASHED' + Sha256.hash( info.password ) );
			
			m.addVar( 'username', info.username );
			m.addVar( 'password', hashed );
			
			try
			{
				let enc = parent.Workspace.encryption;
				//console.log( 'Encrypting password into Workspace.loginPassword: ' + info.password );
				parent.Workspace.loginPassword = enc.encrypt( info.password, enc.getKeys().publickey );
				parent.Workspace.loginHashed = hashed;
			}
			catch( e )
			{
				let enc = Workspace.encryption;
				//console.log( 'Encrypting(2) password into Workspace.loginPassword: ' + info.password );
				Workspace.loginPassword = enc.encrypt( info.password, enc.getKeys().publickey );
				Workspace.loginHashed = hashed;
			}
		}
		else if( info.sessionid )
		{
			m.addVar( 'sessionid', info.sessionid );
		}
		else if( info.logintoken )
		{
			usingLoginToken = true;
			m.addVar( 'logintoken', info.logintoken );
		}
		else
		{
			console.log( '[User] We are setting state offline' );
			this.State = 'offline'; 
			this.lastLogin = null;
			return false;
		}
		
		m.addVar( 'deviceid', GetDeviceId() );
		m.onExecuted = function( json, serveranswer )
		{
			Friend.User.lastLogin = null;
			
			// We got a real error
			if( json == null )
			{
				return Friend.User.ReLogin();
			}
			try
			{
				let enc = Workspace.encryption;
				
				if( json.username || json.loginid )
				{
					Workspace.sessionId = json.sessionid;
					if( json.username )
						Workspace.loginUsername = json.username;
					Workspace.loginUserId = json.userid;
					Workspace.loginid = json.loginid;
					Workspace.userLevel = json.level;
					Workspace.fullName = json.fullname;
					Workspace.uniqueId = json.uniqueid;
					
					if( usingLoginToken )
					{
						if( json.extra && json.extra.length )
							SetCookie( 'logintoken', json.extra );
					}
					
					// Silence non-admin user's debug
					if( Workspace.userLevel != 'admin' )
					{
						console.log( '%cWelcome to %cFriend OS!', 'font-weight: bold;', 'font-weight: bold; color: #5599ff;' );
						//window.console.log = function( msg ){};
					}
					else
					{
						console.log( '%cWelcome to %cFriend OS, %cadministrator!', 'font-weight: bold;', 'font-weight: bold; color: #5599ff;', 'color: inherit; font-weight: bold' );
						console.log( 'This console may become messy with error reporting.' );
						console.log( '****' );
					}
					
					// If we have inviteHash, verify and add relationship between the inviter and the invitee.
					if( info.inviteHash ) json.inviteHash = info.inviteHash;
					
					// We are now online!
					Friend.User.SetUserConnectionState( 'online' );
					
					if( !Workspace.userWorkspaceInitialized )
					{
                		// Init workspace
						Workspace.initUserWorkspace( json, ( callback && typeof( callback ) == 'function' ? callback( true, serveranswer ) : false ), event );
					}
					else
					{
						if( typeof( callback ) == 'function' )
							callback( true, serveranswer );
						// Make sure we didn't lose websocket!
					}
				
					// Remember login info for next login
					if( info.remember && info.username && info.password )
					{
						let hashed = ( 'HASHED' + Sha256.hash( info.password ) );
						
						let m = new XMLHttpRequest();
						let args = JSON.stringify( { username: info.username, password: hashed } );
						m.open( 'POST', '/system.library/module/?module=system&command=getlogintoken&args=' + encodeURIComponent( args ) + '&sessionid=' + Workspace.sessionId, true );
						m.onload = function( response )
						{
							let spli = this.responseText.split( '<!--separate-->' );
							if( spli.length > 0 )
							{
								if( spli[0] == 'ok' )
								{
									let res = JSON.parse( spli[1] );
									if( res && res.token )
									{
										SetCookie( 'logintoken', res.token );
									}
								}
							}
						}
						m.send();
					}
				}
				else if( json == 'fail' )
				{
					if( !window.Workspace || !Workspace.theme )
					{
						self.State = 'online'
						console.log( json, serveranswer );
						if( callback )
							return callback( false, serveranswer );
						return;
					}
					console.log( '[User] "fail" to login - Logging out; ' + serveranswer );
					Friend.User.Logout();
				}
				// Total failure
				else
				{
					Friend.User.SetUserConnectionState( 'offline' );
					
					if( usingLoginToken )
					{
						// Logintoken expired!
						if( json.code == 11 )
						{
							Friend.User.Logout();
						}
					}
					
					if( typeof( callback ) == 'function' ) callback( false, serveranswer );
				}
			}	
			catch( e )
			{
				console.log( 'Failed to understand server response.', e );
				if( typeof( callback ) == 'function' ) callback( false, serveranswer );
			};
		}
		m.forceHTTP = true;
		m.forceSend = true;
		m.loginCall = true;
		m.execute( info.logintoken ? 'logintoken' : 'login' );
    },
	// When session times out, use log in again...
	ReLogin: function( callback )
	{
    	if( this.lastLogin ) return false;
    	
    	this.State = 'login';
    	
    	
    	if( !event ) event = window.event;
    	
    	let self = this;
    	let info = {};
    	
    	if( Workspace.loginUsername && Workspace.loginPassword )
    	{
    		//console.log( 'Trying to log in with: ' + Workspace.loginUsername + ' AND ' + Workspace.loginPassword );
    		
    		info.username = Workspace.loginUsername;
    		let enc = Workspace.encryption;
    		info.password = enc.decrypt( Workspace.loginPassword, enc.getKeys().privatekey );
    		
    		//console.log( 'Unhashed, decrypted password (Workspace.loginPassword): ' + info.password );
    		
    		info.hashedPassword = false;
    	}
    	else if( Workspace.sessionId )
    	{
    		info.sessionid = Workspace.sessionId;
    	}
		
		// Close conn here - new login regenerates sessionid
		if( Workspace.conn )
		{
			try
			{
				Workspace.conn.ws.cleanup();
			}
			catch( e )
			{
				console.log( 'Could not close conn.' );
			}
			delete Workspace.conn;
			Workspace.conn = null;
		}
		
		// Reset cajax http connections (because we lost connection)
		_cajax_http_connections = 0;
		
		// First try logintoken
		let lt = GetCookie( 'logintoken' );
		if( lt )
		{
			this.LoginWithLoginToken( lt, callback );
		}
		else if( info.username || info.sessionid )
		{
			this.SendLoginCall( info, callback, 'relogin' );
		}
		else
		{
			Workspace.showLoginPrompt();
		}
		
		return 0;
    },
    // Log out
    Logout: function( cbk )
    {
    	if( !cbk ) cbk = false;
    	
    	if( GetCookie( 'remcreds' ) )
    	    DelCookie( 'remcreds' );
    	if( GetCookie( 'logintoken' ) )
			DelCookie( 'logintoken' );
    	
    	// FIXME: Remove this - it is not used anymore
		window.localStorage.removeItem( 'WorkspaceUsername' );
		window.localStorage.removeItem( 'WorkspacePassword' );
		window.localStorage.removeItem( 'WorkspaceSessionID' );
		Workspace.loginUsername = null;
	    Workspace.loginPassword = null;

		let keys = parent.ApplicationStorage.load( { applicationName : 'Workspace' } );

		if( keys )
		{
			keys.username = '';

			parent.ApplicationStorage.save( keys, { applicationName : 'Workspace' } );
		}

		let dologt = null;

		SaveWindowStorage( function()
		{
			if( dologt != null )
				clearTimeout( dologt );
			
			if( !cbk )
			{
				// Do external logout and then our internal one.
				if( Workspace.logoutURL )
				{
					Workspace.externalLogout();
					return;
				}
			}

			if( typeof friendApp != 'undefined' && typeof friendApp.get_app_token == 'function' )
			{
				let ud = new cAjax();
				//ud.open( 'get', '/system.library/mobile/deleteuma/?sessionid=' + Workspace.sessionId + '&token=' + window.Base64alt.encode( friendApp.get_app_token() ) , true );
				ud.open( 'get', '/system.library/mobile/deleteuma/?sessionid=' + Workspace.sessionId + '&token=' + friendApp.get_app_token() , true );
				//
				ud.forceHTTP = true;
				ud.onload = function( lmdata )
                        	{
                                	console.log('DeleteUma finished: ' + lmdata );
					let m = new cAjax();
                                	m.open( 'get', '/system.library/user/logout/?sessionid=' + Workspace.sessionId, true );
                                	m.forceHTTP = true;
                                	m.send();

                                	if( !cbk )
                                	{
                                        	setTimeout( doLogout, 500 );
                                	}
                                	else
                                	{
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
                                                	Workspace.conn = null;
                                        	}
                                        	Workspace.sessionId = '';
                                        	cbk();
                                	}
                        	};
				ud.send();
			}
			else
			{
				let m = new cAjax();
				m.open( 'get', '/system.library/user/logout/?sessionid=' + Workspace.sessionId, true );
				m.forceHTTP = true;
				m.send();
			
				if( !cbk )
				{
					setTimeout( doLogout, 500 );
				}
				else
				{
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
						Workspace.conn = null;
					}
					Workspace.sessionId = '';
					cbk();
				}
			}
		} );
		// Could be there will be no connection..
		function doLogout()
		{
			if( typeof friendApp != 'undefined' && typeof friendApp.exit == 'function')
			{
				friendApp.exit();
				return;
			}
			Workspace.sessionId = '';
			let component = '';
			if( GetUrlVar( 'app' ) )
			{
				component = '?app=' + GetUrlVar( 'app' );
			}
			let nurl = window.location.href.split( '?' )[0].split( '#' )[0] + component;
			if( nurl == document.location.href )
				document.location.reload();
			else document.location.href = nurl;
		}
		if( !cbk )
		{
			dologt = setTimeout( doLogout, 750 );
		}
		return true;
    },
    // Remember keys
    RememberKeys: function()
	{
		if( Workspace.encryption.keys.client )
		{
			ApplicationStorage.save( 
				{
					privatekey : Workspace.encryption.keys.client.privatekey,
					publickey  : Workspace.encryption.keys.client.publickey,
					recoverykey: Workspace.encryption.keys.client.recoverykey
				},
				{
					applicationName: 'Workspace' 
				}
			);
			if( window.ScreenOverlay )
				ScreenOverlay.addDebug( 'Keys remembered' );
			return true;
		}
		return false;
	},
	// Renews session ids for cajax and executes ajax queue!
	RenewAllSessionIds: function( session )
	{
		if( session )
			Workspace.sessionId = session;
		
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
	// Reset the password
	ResetPassword: function( username, callback )
	{
		var passWordResetURL = '/forgotpassword/username/' + encodeURIComponent( username );
		var xhttp = new XMLHttpRequest();
		xhttp.onload = function() 
		{
		    if( this.readyState == 4 && this.status == 200 ) 
		    {
		    	if(typeof callback == 'function') 
		    	    callback( this.responseText );
			}
		};
		xhttp.open( 'GET', passWordResetURL, true);
		xhttp.send();
	},
	// Flush previous session
	FlushSession: function()
	{
		// Clear Workspace session
		Workspace.sessionId = '';
	},
	// Initialize this object
	Init: function()
	{
		this.ServerIsThere = true;
	},
	CheckServerNow: function()
	{
		this.CheckServerConnection();
	},
	// Check if the server is alive
	CheckServerConnection: function( useAjax )
	{
		if( Workspace && Workspace.loginPrompt ) return;
		if( typeof( Library ) == 'undefined' ) return;
		if( typeof( MD5 ) == 'undefined' ) return;
		let exf = function()
		{
			Friend.User.serverCheck = null;
			if( Friend.User.State != 'offline' )
			{
				let checkTimeo = setTimeout( function()
				{
					Friend.User.SetUserConnectionState( 'offline' );
				}, 1500 );
				let serverCheck = new Library( 'system' );
				serverCheck.onExecuted = function( q, s )
				{
					// Dont need this now
					clearTimeout( checkTimeo );
					
					// Check missing session
					let missSess = ( s && s.indexOf( 'sessionid or authid parameter is missing' ) > 0 );
					if( !missSess && ( s && s.indexOf( 'User session not found' ) > 0 ) )
						missSess = true;
					if( !missSess && q == null && s == null )
						missSess = true;
			
					if( ( q == 'fail' && !s ) || ( !q && !s ) || ( q == 'error' && !s ) || missSess )
					{
						if( missSess )
						{
							Friend.User.ReLogin();
						}
						Friend.User.SetUserConnectionState( 'offline' );
					}
					else
					{
						if( !Friend.User.ServerIsThere )
						{
							Friend.User.SetUserConnectionState( 'online', true );
						}
						Friend.User.ConnectionAttempts = 0;
					}
				};
				if( !useAjax )
					serverCheck.forceHTTP = true;
				serverCheck.forceSend = true;
			
				try
				{
					// Cancel previous call if it's still in pipe
					if( Friend.User.serverCheck && Friend.User.serverCheck.currentRequest )
					{
						Friend.User.serverCheck.currentRequest.destroy();
					}
					serverCheck.execute( 'validate' );
					Friend.User.serverCheck = serverCheck;
				}
				catch( e )
				{
					Friend.User.SetUserConnectionState( 'offline' );
				}
			}
			else
			{
				Friend.User.ReLogin();
			}
		};
		// Check now!
		exf();
	},
	// Set the user state (offline / online etc)
	SetUserConnectionState: function( mode, force )
	{
		if( mode == 'offline' )
		{
			if( this.State != 'offline' )
			{
				Workspace.workspaceIsDisconnected = true;
				document.body.classList.add( 'Offline' );
				if( Workspace.screen )
					Workspace.screen.displayOfflineMessage();
				Workspace.workspaceIsDisconnected = true;
				if( Workspace.nudgeWorkspacesWidget )
					Workspace.nudgeWorkspacesWidget();
				
				if( this.checkInterval )
					clearInterval( this.checkInterval );
				this.checkInterval = setInterval( 'Friend.User.CheckServerConnection()', 2500 );
				
				// Try to close the websocket
				if( Workspace.conn && Workspace.conn.ws )
				{
					try
					{
						Workspace.conn.ws.close();
					}
					catch( e )
					{
						console.log( 'Could not close conn.' );
					}
					if( Workspace.conn && Workspace.conn.ws )
					{
						delete Workspace.conn.ws;
						Workspace.conn.ws = null;
					}
					delete Workspace.conn;
					Workspace.conn = null;
				}
			
				// Remove dirlisting cache!
				if( window.DoorCache )
				{
					DoorCache.dirListing = {};
				}
			}
			this.ServerIsThere = false;
			this.State = 'offline';
		}
		else if( mode == 'online' )
		{
			// We're online again
			if( this.checkInterval )
			{
				clearInterval( this.checkInterval );
				this.checkInterval = null;
			}
			
			if( this.State != 'online' || force || !Workspace.conn )
			{
				this.ServerIsThere = true;
				this.State = 'online';
				document.body.classList.remove( 'Offline' );
				if( Workspace.screen )
					Workspace.screen.hideOfflineMessage();
				Workspace.workspaceIsDisconnected = false;
				if( Workspace.nudgeWorkspacesWidget )
					Workspace.nudgeWorkspacesWidget();
				// Just remove this by force
				document.body.classList.remove( 'Busy' );
				// Just refresh it
				if( Workspace.refreshDesktop )
					Workspace.refreshDesktop( true, false );
				// Try to reboot the websocket
				if( ( !Workspace.conn || Workspace.conn == null ) && Workspace.initWebSocket )
				{
					Workspace.initWebSocket();
				}
				else if( !Workspace.initWebSocket )
				{
				    return setTimeout( function(){ Friend.User.SetUserConnectionState( mode, force ); }, 25 );
				}
				/*else
				{
					console.log( 'We have a kind of conn: ', Workspace.conn, Workspace.conn ? Workspace.conn.ws : false );
				}*/
				// Clear execution queue
				_executionQueue = {};
			}
		}
		else
		{
			this.State = mode;
		}
	}
};

// Autologin
if( parent && parent.window )
{
	let href = parent.window.document.location.href;
	href = href.split( '?' );
	if( href.length > 1 )
	{
		let pairs = href[1].split( '&' );
		for( let a in pairs )
		{
			pairs[ a ] = pairs[ a ].split( '=' );
			if( pairs[ a ][ 0 ] == 'logintoken' )
			{
				Friend.User.LoginWithLoginToken( pairs[ a ][1] );
			}
		}
	}
}

