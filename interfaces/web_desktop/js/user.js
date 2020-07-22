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
    NetworkState: 'offline', 	// online, offline, connecting, error
    WebsocketState: 'offline', 	// online, offline, connecting, error 
    Username: '',               // Holds the user's username
    AccessToken: null,          // Holds the user's access token
    ReloginAttempts: 0,         // How many relogin attempts were made
    
    // Old stuff
    // this.encryption.setKeys( this.loginUsername, this.loginPassword );			
	// r = remember me set....
	// if( r )
	// {
	// 	Workspace.rememberKeys();
	//}
    
    // Methods -----------------------------------------------------------------
    
    // Log into Friend Core
    Login: function( username, password, remember, callback, event )
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
				Workspace.conn.ws.close();
			}
			catch( e )
			{
				console.log( 'Could not close conn.' );
			}
			delete Workspace.conn;
		}
		
		if( username && password )
		{
			this.SendLoginCall( {
				username: username,
				password: password,
				remember: remember
			}, callback );
		}
		else
		{
			Workspace.showLoginPrompt();
		}
		
		return 0;
    },
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
				Workspace.conn.ws.close();
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
    SendLoginCall: function( info, callback )
    {
    	// Create a new library call object
		let m = new FriendLibrary( 'system' );
		if( info.username && info.password )
		{
			m.addVar( 'username', info.username );
			m.addVar( 'password', 'HASHED' + Sha256.hash( info.password ) );
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
			try
			{
				Workspace.sessionId = json.sessionid;
				Workspace.loginUsername = json.username;
				Workspace.loginUserId = json.userid;
				Workspace.loginid = json.loginid;
				Workspace.userLevel = json.level;
				Workspace.fullName = json.fullname;
				Workspace.initUserWorkspace( json, ( callback && typeof( callback ) == 'function' ? callback( true, serveranswer ) : false ), event );
				
				if( info.remember )
					User.rememberKeys();
					
				Friend.User.State = 'online';
			}	
			catch( e )
			{
				console.log( 'Failed to understand server response.', e );
			};
		}
		m.forceHTTP = true;
		m.forceSend = true;
		m.execute( 'login' );
    },
	// When session times out, use log in again...
	ReLogin: function( callback )
	{
		// While relogging in or in a real login() call, just skip
		if( this.reloginInProgress || this.loginCall ) return;
		
		// Kill all http connections that would block
		_cajax_http_connections = 0;
		
		//console.log( 'Test2: Relogin in progress' );
		
		let self = this;
		
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
				let u = typeof( Workspace.loginUsername ) == 'undefined' ? false : Workspace.loginUsername;
				let p = typeof( Workspace.loginPassword ) == 'undefined' ? false : Workspace.loginPassword;
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
		
		let m = new Module( 'system' );
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
						let js = JSON.parse( d );
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
    Logout: function()
    {
        // FIXME: implement
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
			Workspace.websocketsOffline = true;
			m.open( 'get', '/system.library/user/logout/?sessionid=' + Workspace.sessionId, true );
			m.send();
			Workspace.websocketsOffline = false;
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
    RememberKeys: function()
	{
		if( this.encryption.keys.client )
		{
			ApplicationStorage.save( 
				{
					privatekey : this.encryption.keys.client.privatekey,
					publickey  : this.encryption.keys.client.publickey,
					recoverykey: this.encryption.keys.client.recoverykey
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
	FlushSession: function()
	{
		// Clear Workspace session
		Workspace.sessionId = '';
	}
};
