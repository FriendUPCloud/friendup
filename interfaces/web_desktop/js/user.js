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
    loginCallback : null,
    loginInfo     : null,
    loginTimeout  : null,
    queuedLogin   : false,
    
    // Methods -----------------------------------------------------------------
    
    // Log into Friend Core
    Login: function( username, password, remember, callback, event, flags )
    {
    	const self = this;
    	if( this.State == 'online' )
    		return;
    	
    	self.setState( 'login' );
    	//this.State = 'login';
    	
    	if( !event ) event = window.event;
    	
    	//let self = this;
		
		if ( !username || !password ) {
			Workspace.showLoginPrompt();
			return;
		}
		
		const info = {
			username       : username,
			password       : password,
			remember       : remember,
			flags          : flags,
		};
		
		self.SendLoginCall( info, callback );
		
    },
    // Login using a session id
    LoginWithSessionId: function( sessionid, callback, event )
    {
    	const self = this;
    	if( this.State == 'online' )
    		return;
    	
    	self.setState( 'login' );
    	//this.State = 'login';
    	
    	if( !event )
    		event = window.event;
    	
    	//let self = this;
    	Workspace.sessionId = sessionid;
		
		self.SendLoginCall( null, callback );
		
    },
    // Send the actual login call
    SendLoginCall: function( info, callback )
    {
    	const self = this;
    	let infoCpy = null;
    	if ( info ) {
    		const infoStr = JSON.stringify( info );
    		infoCpy = JSON.parse( infoStr );
    	}
    	console.log( 'SendLoginCall', {
    		info         : infoCpy || info,
    		callback     : callback,
    		loginTimeout : self.loginTimeout,
    		state        : self.State,
    		sssId        : window.Workspace.sessionId,
    		reftok       : self.refreshToken,
    		self         : self,
    	});
    	self.setState( 'login' );
    	
    	//this.State = 'login';
    	
    	if ( info && self.lastLogin )
    		clearCurrent();
    	
    	if ( info )
    		self.loginInfo = info;
    	if ( callback )
    		self.loginCallback = callback;
    	
    	if ( null != self.loginTimeout )
    	{
    		console.log( 'login timeout, queue' );
    		this.queuedLogin = true;
    		return;
    	}
    	
    	self.loginTimeout = window.setTimeout( tryNowMaybe, 1000 * 2 );
    	function tryNowMaybe()
    	{
    		self.loginTimeout = null;
    		if ( !self.queuedLogin )
    			return;
    		
    		self.queuedLogin = false;
    		self.SendLoginCall();
    	}
    	
    	if( Workspace.conn )
		{
			Workspace.conn.disconnect();
		}
    	
		let req = new FriendLibrary( 'system' );
		self.lastLogin = req;
		
		info = self.loginInfo || {};
		if( info.username && info.password )
		{
			Workspace.sessionId = '';
			this.refreshToken = '';
			req.addVar( 'username', info.username );
			req.addVar( 'password', info.hashedPassword ? info.password : ( 'HASHED' + Sha256.hash( info.password ) ) );
		}
		else if( window.Workspace.sessionId )
		{
			req.addVar( 'sessionid', window.Workspace.sessionId );
		}
		else if ( self.refreshToken )
		{
			req.addVar( 'refreshtoken', self.refreshToken );
		}
		else
		{
			self.setState( 'offline' );
			self.lastLogin = null;
			respond( 'offline', null );
			return false;
		}
		
		console.log( 'sending login with', req.vars );
		req.addVar( 'deviceid', GetDeviceId() );
		req.onExecuted = function( conf, serveranswer )
		{
			const info = self.loginInfo || {};
			self.lastLogin = null;
			self.loginInfo = null;
			let response = null;
			try {
				response = JSON.parse( serveranswer );
			} catch( ex ) {}
			
			console.trace( 'SendLoginCall - response', {
				info         : info,
				conf         : conf,
				response     : response,
				serveranswer : serveranswer,
				lastLogin    : !!self.lastLogin,
			});
			if( conf == null || '' == conf )
			{
				console.log( 'login weird, see response ^^^^')
				respond( false );
				//self.ReLogin();
				return;
			}
			
			if ( 'error' == conf ) {
				console.log( 'login error' );
				self.ReLogin();
				return;
			}
			
			if ( 'fail' == conf ) {
				console.log( 'send login call response fail', response );
				if ( null == response ) {
					respond( 'fail', serveranswer );
					return;
				}
				
				const code = response.code;
				
				// invalid session
				if ( '10' == code ) {
					if ( null != self.checkInterval )
						window.clearInterval( self.checkInterval );
					
					window.Workspace.sessionId = null;
					self.ReLogin();
					return;
				}
				
				// invalid refresh token
				if ( '85' == code ) {
					console.log( 'CODE 85! THIS IT NOT A DRILL CODE EJTIFAJV!!' );
					if ( null != self.checkInterval )
						window.clearInterval( self.checkInterval );
					
					self.refreshToken = null;
					window.Workspace.showLoginPrompt();
					return;
				}
				
				respond( false, serveranswer );
				return;
			}
			
			if ( !conf.refreshtoken ) {
				console.log( 'login response', conf );
				throw new Error( 'Login response does not have a refreshtoken' );
			}
			
			self.refreshToken = conf.refreshtoken;
			
			try
			{
				let enc = Workspace.encryption;
				
				if( conf.username || conf.loginid )
				{
					Workspace.sessionId = conf.sessionid;
					
					if( conf.username )
						Workspace.loginUsername = conf.username;
					Workspace.loginUserId = conf.userid;
					Workspace.loginid = conf.loginid;
					Workspace.userLevel = conf.level;
					Workspace.fullName = conf.fullname;
					
					// If we have inviteHash, verify and add relationship between the inviter and the invitee.
					if( info.inviteHash )
						conf.inviteHash = info.inviteHash;
					
					// We are now online!
					self.SetUserConnectionState( 'online' );
					
					
					const res = respond( true, serveranswer );
					if ( Workspace.userWorkspaceInitialized )
						Workspace.initWebSocket();
					else
						Workspace.initUserWorkspace(
							conf,
							res,
							event
						);
					
					/*
					if( !Workspace.userWorkspaceInitialized )
					{
                		// Init workspace
                		const res = respond( true, serveranswer );
						Workspace.initUserWorkspace(
							conf,
							res,
							//( callback && typeof( callback ) == 'function' ? callback( true, serveranswer ) : false ),
							event
						);
					}
					else
					{
						respond( true, serveranswer );
					}
					*/
				}
				else
				{
					self.SetUserConnectionState( 'offline' );
					respond( false, serveranswer );
					//if( typeof( callback ) == 'function' ) callback( false, serveranswer );
				}
			}	
			catch( e )
			{
				console.log( 'Failed to understand server response.', e );
				if( callback ) callback( false, serveranswer );
			};
		}
		req.forceHTTP = true;
		req.forceSend = true;
		req.execute( 'login' );
		
		function clearCurrent() {
			self.loginCallback = null;
    		if ( null == self.lastLogin )
    			return;
    		
    		self.lastLogin.currentRequest.destroy();
    		self.lastLogin = null;
    	}
    	
    	function respond( status, data ) {
    		console.log( 'respond', {
    			status   : status,
    			data     : data,
    			callback : self.loginCallback,
    		});
    		const cb = self.loginCallback;
    		delete self.loginCallback;
    		if ( null == cb )
    			return;
    		
    		return cb( status, data );
    	}
    },
	// When session times out, use log in again...
	ReLogin: function( callback )
	{
		const self = this;
		console.log( 'ReLogin', self.lastLogin );
    	if( self.lastLogin )
    		return;
    	
    	self.setState( 'login' );
    	//this.State = 'login';
    	
    	if( !event )
    		event = window.event;
    	
		// Reset cajax http connections (because we lost connection)
		_cajax_http_connections = 0;
		
		if( null == self.refreshToken )
			Workspace.showLoginPrompt();
		else
			self.SendLoginCall( null, callback );
		
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
			self.refreshToken = null;
			document.location.href = window.location.href.split( '?' )[0].split( '#' )[0]; //document.location.reload();
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
		
		executeCAjaxQueue();
		
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
		console.log( 'flushSession' );
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
		const self = this;
		console.log( 'CheckServerConnection', {
			loginPromp : Workspace.loginPrompt,
			state      : Friend.User.State,
			State      : self.State,
		});
		
		if( Workspace && Workspace.loginPrompt )
			return;
		
		if( typeof( Library ) == 'undefined' )
			return;
		
		if( typeof( MD5 ) == 'undefined' )
			return;
		
		
		//let exf = function()
		//{
		if ( null != self.serverCheck ) {
			self.serverCheck.destroy();
			self.serverCheck = null;
		}
		
		if ( null != self.checkTimeout ) {
			window.clearTimeout( self.checkTimeout );
			self.checkTimeout = null;
		}
		
		//self.serverCheck = null;
		if ( 'offline' == self.State ) {
			self.ReLogin();
			return;
		}
		
		//if( self.State != 'offline' )
		//{
		self.checkTimeout = setTimeout( function()
		{
			self.SetUserConnectionState( 'offline' );
		}, 1500 );
		
		let req = new Library( 'system' );
		self.serverCheck = req;
		self.serverCheck.onExecuted = function( q, s )
		{
			console.log( 'server check result', [ q, s ]);
			// Dont need this now
			if ( null != self.checkTimeout )
				clearTimeout( self.checkTimeout );
			
			self.checkTimeout = null;
			self.serverCheck = null;
			
			//
			if (( q == null ) && ( s == null ))
				return;
			
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
					self.ReLogin();
				}
				self.SetUserConnectionState( 'offline' );
			}
			else
			{
				if( !self.ServerIsThere )
				{
					self.SetUserConnectionState( 'online', true );
				}
				self.ConnectionAttempts = 0;
			}
		};
		
		if( !useAjax )
			self.serverCheck.forceHTTP = true;
		
		self.serverCheck.forceSend = true;
		self.serverCheck.execute( 'validate' );
		
		/*
		try
		{
			// Cancel previous call if it's still in pipe
			if( self.serverCheck && self.serverCheck.currentRequest )
			{
				self.serverCheck.destroy();
			}
			console.log( 'server check request start' );
			self.serverCheck.execute( 'validate' );
			self.serverCheck = serverCheck;
		}
		catch( e )
		{
			self.SetUserConnectionState( 'offline' );
		}
		*/
		
		/*
		}
		else
		{
			self.ReLogin();
		}
		*/
			
			
		//};
		// Check now!
		//exf();
	},
	// Set the user state (offline / online etc)
	SetUserConnectionState: function( mode, force )
	{
		const self = this;
		console.trace( 'SetUserConnectionState', {
			current : self.state,
			mode    : mode,
			force   : force,
			current : self.State,
		});
		
		if( mode == 'offline' )
		{
			if( this.State != 'offline' )
			{
				this.ServerIsThere = false;
				self.setState( 'offline' );
				//this.State = 'offline';
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
					delete Workspace.conn.disconnect();
				}
				
				if( null != this.checkInterval )
					clearInterval( this.checkInterval );
				
				this.checkInterval = setInterval( () => { self.CheckServerConnection(); }, 2500 );
			}
			
			// Remove dirlisting cache!
			if( window.DoorCache )
			{
			    console.log( 'Nulling out dirlisting!' );
			    DoorCache.dirListing = {};
			}
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
				self.setState( 'online' );
				//this.State = 'online';
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
		else
		{
			self.setState( mode );
			//this.State = mode;
		}
	},
	
	setState: function( state ) {
		const self = this;
		console.log( 'setState', {
			current : self.State,
			set     : state,
			self    : self,
		});
		
		self.State = state;
	}
};
