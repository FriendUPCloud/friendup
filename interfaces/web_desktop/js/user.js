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
    
    State: 'offline', 			// online, offline, login
    ServerIsThere: false,
    Username: '',               // Holds the user's username
    AccessToken: null,          // Holds the user's access token
    ConnectionAttempts: 0,         // How many relogin attempts were made
    
    // Methods -----------------------------------------------------------------
    
    // Log into Friend Core
    Login: function( username, password, remember, callback, event, flags )
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
		
		if( username && password )
		{
			Workspace.encryption.setKeys( username, password );
			this.SendLoginCall( {
				username: username,
				password: password,
				remember: remember,
				hashedPassword: flags.hashedPassword
			}, callback );
		}
		else
		{
			Workspace.showLoginPrompt();
		}
		
		return 0;
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
    SendLoginCall: function( info, callback )
    {
    	this.State = 'Login';
    	
    	if( this.lastLogin && this.lastLogin.currentRequest )
    	{
    		this.lastLogin.currentRequest.destroy();
    	}
    	
    	// Create a new library call object
		let m = new FriendLibrary( 'system' );
		this.lastLogin = m;
		
		if( info.username && info.password )
		{
			Workspace.sessionId = '';
			m.addVar( 'username', info.username );
			m.addVar( 'password', info.hashedPassword ? info.password : ( 'HASHED' + Sha256.hash( info.password ) ) );
			
			try
			{
				let enc = parent.Workspace.encryption;
				parent.Workspace.loginPassword = enc.encrypt( info.password, enc.getKeys().publickey );
				parent.Workspace.loginHashed = info.hashedPassword;
			}
			catch( e )
			{
				let enc = Workspace.encryption;
				Workspace.loginPassword = enc.encrypt( info.password, enc.getKeys().publickey );
				Workspace.loginHashed = info.hashedPassword;
			}
		}
		else if( info.sessionid )
		{
			m.addVar( 'sessionid', info.sessionid );
		}
		else
		{
			this.State = 'offline'; 
			return false;
		}
		
		m.addVar( 'deviceid', GetDeviceId() );
		m.onExecuted = function( json, serveranswer )
		{
			// We got a real error
			if( json == null )
			{
				return Friend.User.ReLogin();
			}
			try
			{
				let enc = Workspace.encryption;
				
				if( json.username )
				{
					Workspace.sessionId = json.sessionid;
					Workspace.loginUsername = json.username;
					Workspace.loginUserId = json.userid;
					Workspace.loginid = json.loginid;
					Workspace.userLevel = json.level;
					Workspace.fullName = json.fullname;
					
					// We are now online!
					Friend.User.SetUserConnectionState( 'online' );
					
					if( !Workspace.userWorkspaceInitialized )
					{
						Workspace.initUserWorkspace( json, ( callback && typeof( callback ) == 'function' ? callback( true, serveranswer ) : false ), event );
					}
					else
					{
						if( typeof( callback ) == 'function' )
							callback( true, serveranswer );
						// Make sure we didn't lose websocket!
					}
				
					// Remember login info for next login
					// But removed for security
					// TODO: Figure out a better way!
					if( info.remember )
					{
						// Nothing
					}
				}
				else
				{
					Friend.User.SetUserConnectionState( 'offline' );
					
					if( typeof( callback ) == 'function' ) callback( false, serveranswer );
				}
			}	
			catch( e )
			{
				console.log( 'Failed to understand server response.', e );
				if( callback ) callback( false, serveranswer );
			};
		}
		m.forceHTTP = true;
		m.forceSend = true;
		m.execute( 'login' );
    },
	// When session times out, use log in again...
	ReLogin: function( callback )
	{
    	this.State = 'login';
    	
    	if( !event ) event = window.event;
    	
    	let self = this;
    	let info = {};
    	
    	if( Workspace.loginUsername && Workspace.loginPassword )
    	{
    		info.username = Workspace.loginUsername;
    		let enc = Workspace.encryption;
    		info.password = enc.decrypt( Workspace.loginPassword, enc.getKeys().privatekey );
    		info.hashedPassword = Workspace.loginHashed;
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
		}
		
		if( info.username || info.sessionid )
		{
			this.SendLoginCall( info, callback );
		}
		else
		{
			Workspace.showLoginPrompt();
		}
		
		return 0;
    },
    // Log out
    Logout: function()
    {
        // FIXME: Remove this - it is not used anymore
		window.localStorage.removeItem( 'WorkspaceUsername' );
		window.localStorage.removeItem( 'WorkspacePassword' );
		window.localStorage.removeItem( 'WorkspaceSessionID' );

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
			
			// Do external logout and then our internal one.
			if( Workspace.logoutURL )
			{
				Workspace.externalLogout();
				return;
			}

			let m = new cAjax();
			m.open( 'get', '/system.library/user/logout/?sessionid=' + Workspace.sessionId, true );
			m.forceHTTP = true;
			m.send();
			setTimeout( doLogout, 500 );
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
			document.location.href = window.location.href.split( '?' )[0]; //document.location.reload();
		}
		dologt = setTimeout( doLogout, 750 );
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
		xhttp.onreadystatechange = function() {
		    if (this.readyState == 4 && this.status == 200) {
		    	if(typeof callback == 'function') callback( this.responseText );
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
				let serverCheck = new Library( 'system' );
				serverCheck.onExecuted = function( q, s )
				{
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
							Friend.User.SetUserConnectionState( 'online' );
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
	SetUserConnectionState: function( mode )
	{
		if( mode == 'offline' )
		{
			if( this.State != 'offline' )
			{
				this.ServerIsThere = false;
				this.State = 'offline';
				Workspace.workspaceIsDisconnected = true;
				document.body.classList.add( 'Offline' );
				if( Workspace.screen )
					Workspace.screen.displayOfflineMessage();
				Workspace.workspaceIsDisconnected = true;
				if( Workspace.nudgeWorkspacesWidget )
					Workspace.nudgeWorkspacesWidget();
				
				// Try to close the websocket
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
					console.log( 'Removed websocket.' );
				}
				
				if( this.checkInterval )
					clearInterval( this.checkInterval );
				this.checkInterval = setInterval( 'Friend.User.CheckServerConnection()', 2500 );
			}
		}
		else
		{
			// We're online again
			if( this.checkInterval )
			{
				clearInterval( this.checkInterval );
				this.checkInterval = null;
			}
			
			if( this.State != 'online' )
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
				if( !Workspace.conn && Workspace.initWebSocket )
				{
					Workspace.initWebSocket();
				}
				// Clear execution queue
				_executionQueue = {};
			}
		}
	}
};
