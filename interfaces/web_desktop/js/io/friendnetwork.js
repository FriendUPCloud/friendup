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

// Network class that handles Friend Core to Friend Core connections as well as
// our encrypted WebRTC based peer-to-peer network

var thisIsSelf;

FriendNetwork = {
	// Vars
	debugging: false,
	onlineStatus: false,
	sessions: [], // List of applications and processes that use the friend network
	conn : null, // network connection
	connectPile: [],	// Pile for connect timeout
	networkId: false,
	
	// Methods
	init: function( host, sessionId, hostMeta )
	{
		console.log( 'FriendNetwork.init' );
		/*
		hostMeta is optinal, and is used to make your host human readable on the network
		hostMeta can contain:
			name, <string>
			description, <string>
			apps, [ appMeta, .. ]
			imagePath, <string>
			
		hostMeta can also be updated later with .updateMeta
		*/
		
		var hostMeta = hostMeta || {
			name        : 'yeppers',
			description : 'fastly done in a port',
			apps        : [],
			imagePath   : 'friend://path.to/image?'
		};
		this.hostName = hostMeta.name;
		
		this.conn = new NetworkConn(
			host,
			sessionId,
			eventSink, // events that do not have a registered listener get sent here
			onOpen,
			onEnd,
			hostMeta
		);
		
		thisIsSelf = this;
		
		this.conn.on( 'connect', connectRequest );
		this.conn.on( 'disconnect', remoteDisconnected );
		
		function connectRequest( data, hostId )
		{
			console.log( 'connectRequest', {
				data   : data,
				hostId : hostId
			});
		}
		
		function remoteDisconnected( data, hostId )
		{
			console.log( 'handleRemoteDisconnected', {
				data   : data,
				hostId : hostId,
			});
		}
		
		function eventSink( type, data, source )
		{
			console.log( 'FriendNetwork - unhandled network event', {
				type       : type,
				data       : data,
				sourceHost : source,
			});
		}
		
		function onOpen( networkId ) // self hostId
		{
			FriendNetwork.networkId = networkId;
			console.log( 'FriendNetwork - connection is open', networkId );
		}
		
		function onEnd( e )
		{
			// network connection has given up trying to reconnect
			// .reconnect() not yet implemented
			console.log( 'FriendNetwork.conn onEnd', e );
		}
		
	},
	
	// Closes the current connection
	close: function( )
    {
    	if ( this.conn )
		{
			for ( var key in this.sessions )
			{
				if ( this.sessions[ key ] )
				{
					this.sessions[key].close(true);
				}
			}
			this.conn.close();
			this.conn = false;
			this.networkId = false;
			this.sessions = [];
		}
    },
	
	// Closes all connexions related to one application
	closeApplication: function( msg )
    {
    	if ( this.conn )
		{
			for ( var key in this.sessions )
			{
				if ( this.sessions[ key ].applicationId == msg.applicationId )
				{
					this.sessions[ key ].close();
				}
			}
			this.sessions = this.cleanKeys( this.sessions );
		}
    },
	// Lists the available hosts
	listHosts: function( msg )
	{
		if ( !this.conn )
			return;
		
		this.conn.getHosts( hostsBack );
		function hostsBack( err, response )
		{
			console.log( 'hostsBack', err, response );
			if ( err )
			{
				console.log('FriendNetwork.list', err, response ? response  : '');
				FriendNetwork.sendError( msg.message, 'ERR_LIST_HOSTS', false, false, response );
				return;
			}
			
			var application = findApplication( msg.message.applicationId );
			var window = GetContentWindowByAppMessage( application, msg.message );
			
			var nmsg = {
				applicationId: msg.message.applicationId,
				applicationName: msg.message.applicationName,
				command: 'friendnetwork',
				subCommand: 'list',
				hosts: response
			};
			try {
				window.postMessage( JSON.stringify( nmsg ), '*' );
			}
			catch ( err ) {	}
			//msg.callback( response );
		}
	},
	
	// Starts hosting session
	startHosting: function( msg )
    {
		if ( !this.conn )
			return;
		
		var applicationName = msg.message.applicationName;
		var applicationId = msg.message.applicationId;
		var application = findApplication( applicationId );
		var window = GetContentWindowByAppMessage( application, msg.message );
		
		for( var a in this.hosts )
		{
			if ( this.hosts[ a ].name == msg.name )
			{
				console.log('FriendNetwork.startHosting', 'ERR_HOST_ALREADY_EXISTS', msg.name);
				this.sendErrorToWindow( window, 'ERR_HOST_ALREADY_EXISTS' );
				return;
			}
		}
		var key = this.addSession( applicationId );
		this.sessions[ key ] = new FNetHost( key, window, applicationId, applicationName, msg.name, msg.description, msg.data );
    },
	
	// Dispose hosting session (from its name)
	disposeHosting: function( msg )
	{
		if ( !this.conn )
			return;

		if ( this.sessions[ msg.key ] && this.sessions[ msg.key ].isHost )
		{
			this.sessions[ msg.key ].close();
			this.sessions = this.cleanKeys( this.sessions );
		}
		else
		{
			console.log('FriendNetwork.disposeHosting', 'ERR_HOST_NOT_FOUND');
			if ( msg.message )
				this.sendError( msg.message, 'ERR_HOST_NOT_FOUND', msg.key, msg.name );
		}
	},
	
	// Connect to distant host
	connectToHost: function( msg )
	{
		if ( !this.conn )
			return;
		
		var application = findApplication(msg.message.applicationId);
		var window = GetContentWindowByAppMessage(application, msg.message);
		var found = false;
		var hostName = msg.name;
		var userName, p;
		if ( (p = msg.name.indexOf('@')) >= 0)
		{
			hostName = msg.name.substring(0, p);
			userName = msg.name.substring(p + 1);
		}
		this.conn.getHosts( hostsBack );
		function hostsBack( err, response )
		{
			if ( !err )
			{
				for (var a = 0; a < response.length; a++)
				{
					found = true;
					if (userName && userName != response[a].name)
						continue;
					var apps = response[a].apps;
					if (apps)
					{
						for (var b = 0; b < apps.length; b++)
						{
							if (apps[b].name == hostName)
							{
								found = true;
								var key = FriendNetwork.addSession(msg.message.applicationId);
								FriendNetwork.sessions[key] = new FNetClient(
									key,
									window,
									msg.message.applicationId,
									msg.message.applicationName,
									response[a].hostId,
									apps[b].id,
									apps[b].name + '@' + response[a].name,
									msg.p2p
								);
								break;
							}
						}
					}
				}
			}
			else
			{
				console.log( 'FriendNetwork.connectToHost.hostBack', err, response ? response : '' );
				FriendNetwork.sendErrorToWindow(window, err, false, response);
				return;
			}
			if ( !found )
			{
				console.log( 'FriendNetwork.connectToHost', 'ERR_HOST_NOT_FOUND', msg.name );
				FriendNetwork.sendErrorToWindow(window, 'ERR_HOST_NOT_FOUND');
			}
		}
	},
	
	disconnectFromHost: function( msg )
	{
		if ( !this.conn )
			return;

		var application = findApplication(msg.message.applicationId);
		var window = GetContentWindowByAppMessage(application, msg.message);
		var session = FriendNetwork.sessions[ msg.key ];
		if ( session && session.isClient )
		{
			session.close();
			this.sessions = this.cleanKeys( this.sessions );
		}
		else
		{
			console.log('FriendNetwork.disconnectFromHost', 'ERR_CLIENT_NOT_FOUND', msg.name);
			if ( msg.message )
				this.sendErrorToWindow( window, 'ERR_CLIENT_NOT_FOUND' );
		}
	},
	
	// Set the host password
	setHostPassword: function( msg )
	{
		var session = this.sessions[ msg.key ];
		if( session && session.isHost  )
		{
			if ( typeof msg.password == 'string' )
				session.password = 'HASHED' + Sha256.hash( msg.password );
			else
				session.password = msg.password;
		}
		else
		{
			console.log('FriendNetwork.setHostPassword', 'ERR_HOST_NOT_FOUND', msg.key);
			this.sendError( msg.message, 'ERR_HOST_NOT_FOUND', msg.key );
		}
	},
	
	// Send the credentials to host
	sendCredentials: function( msg )
	{
		if ( !this.conn )
			return;

		var session = this.sessions[ msg.key ];
		if( session && session.isClient )
		{
			session.sendCredentials( msg.password );
		}
		else
		{
			console.log('FriendNetwork.sendCredentials.send', 'ERR_HOST_NOT_FOUND');
			this.sendError( msg.message, 'ERR_HOST_NOT_FOUND', msg.key );
		}
	},
	
	// Send data to distant host (from the key)
	send: function( msg )
	{
		if ( !this.conn )
			return;
		
		var sent = false;
		var session = this.sessions[ msg.key ];
		if( session  )
		{
			if ( session.isClient || session.isHostClient )
			{
				sent = true;
				session.send( msg.data );
			}
		}
		if ( !sent )
		{
			console.log('FriendNetwork.send - ERR_SESSION_NOT_FOUND', {
				msg      : msg,
				sessions : this.sessions,
			});
			this.sendError( msg.message, 'ERR_SESSION_NOT_FOUND', msg.key);
		}
	},
	
	// Timeout function
	handleTimeout: function()
    {
		if ( !this.conn )
			return;
		
	    for (var key in FriendNetwork.sessions)
	    {
		    var session = FriendNetwork.sessions[key];

		    if (session.distantId)
		    {
			    // Connexion timeout?
			    session.countDown--;
			    if (session.countDown == 0)
			    {
			    	session.countDown = FriendNetwork.TIMEOUTSECONDS;
				    console.log('FriendNetwork.timeout timeout');
	
				    var hostApplication = findApplication(session.localAppId);
				    var hostWindow = GetContentWindowByAppMessage(hostApplication, session.localAppId);
	
				    // Send message to host window
				    var nmsg = {
				    	applicationId: session.localAppId,
						applicationName: session.localAppName,
					    command:    'friendnetwork',
					    subCommand: 'timeout',
						hostKey:	session.hostKey,
					    key:        session.localKey,
					    name:       session.distantName,
					    appName:    session.distantAppName
				    };
				    try
				    {
					    hostWindow.postMessage(JSON.stringify(nmsg), '*');
				    }
				    catch (err)
				    {}
				    FriendNetwork.removeSession(key);
				    return;
			    }

			    // Credential timeout?
			    session.countDownCredentials--;
			    if (session.countDownCredentials == 0)
			    {
				    console.log('FriendNetwork.timeout credentials');
				    session.countDownCredentials = FriendNetwork.TIMEOUTCONNEXIONSECONDS;
	
				    var hostApplication = findApplication(session.localAppId);
				    var hostWindow = GetContentWindowByAppMessage(hostApplication, session.localAppId);
	
				    // Send message to host window
				    var nmsg = {
						applicationId: session.localAppId,
						applicationName: session.localAppName,
					    command:    'friendnetwork',
					    subCommand: 'credentialsTimeout',
						hostKey:	session.hostKey,
					    key:        session.localKey,
					    name:       session.distantName,
					    appName:    session.distantAppName
				    };
				    try
				    {
					    hostWindow.postMessage(JSON.stringify(nmsg), '*');
				    }
				    catch (err)
				    {}
	
				    // Send message to client
				    FriendNetwork.conn.send(session.distantId, {
					    type: session.distantKey,
					    data: {
						    command: 'credentialsTimeout',
						    key:     session.localKey,
						    name:    session.localName,
						    appName: session.localAppName
					    }
				    }, function (err, data)
				    {
				    });
	
				    // Remove session application
				    FriendNetwork.removeSession(session.localKey);
				    return;
			    }

			    // Send a ping message to client every second
			    FriendNetwork.conn.send(session.distantId,
			    {
				    type: session.distantKey,
				    data: {
					    command: 'ping',
					    key:     session.localKey
				    }
			    },
			    function (err, data)
			    {
				    console.log('FriendNetwork.timeout sent ping ', err, data);
			    });
		    }
	    }
    },
	// Send error message to window
	sendErrorToWindow: function( window, error, key, response )
    {
    	if ( window )
		{
			var nmsg = {
				command:         'friendnetwork',
				subCommand:      'error',
				error:        	 error,
				key:             key,
				response:		 response
			};
			try
			{
				window.postMessage(JSON.stringify(nmsg), '*');
			}
			catch (err)
			{}
		}
    },
	// Send message to window
	sendToWindow: function( window, subCommand, message )
    {
    	if ( window )
		{
			message.command = 'friendnetwork';
			message.subCommand = subCommand;
			try
			{
				var str = JSON.stringify( message );
				window.postMessage(JSON.stringify( message ), '*');
			}
			catch (err)
			{}
		}
    },
	// Send error message to window
	sendError: function( message, error, key, name, response )
    {
    	if ( message )
		{
			var application = findApplication( message.applicationId );
			var window = GetContentWindowByAppMessage(application, message);
			var nmsg = {
				command:         'friendnetwork',
				subCommand:      'error',
				error:        	 error,
				key:             key,
				name:            name,
				response:		 response
			};
			try
			{
				window.postMessage(JSON.stringify(nmsg), '*');
			}
			catch (err)
			{}
		}
    },
	
	// Returns a unique key
	addKey: function( keys, id )
	{
		do {
			key = friendUP.tool.uid( id );
		} while( !!keys[ key ] );
		/*
		var key = id + Math.random() * 999 + "";
		while( typeof( keys[ key ] ) != 'undefined' )
			key = Sha256.hash( ( id + Math.random() * 999 + Math.random() * 999 ) + "" );
		*/
		keys[ key ] = true;
		return key;
	},

	// Cleans a key array
	cleanKeys: function( keys )
    {
    	var out = [];
		for ( var key in keys )
		{
			if ( keys[ key ] )
				out[ key ] = keys[ key ];
		}
		return out;
    },
	
	// Add a new session by applicationid and name
	addSession: function( id )
	{
		return this.addKey( this.sessions, id );
	},
	
	// Remove a session by key
	removeSession: function( key )
	{
		if ( this.sessions[ key ] )
		{
			this.sessions[ key ] = false;
			this.sessions = this.cleanKeys( this.sessions );
		}
	},
	getSessionKeyFromName: function( name )
	{
		for ( var key in this.sessions )
		{
			if ( this.sessions[ key ].name == name )
				return key;
		}
		return false;
	},
	// Get online status of a session / the network
	getStatus: function( msg )
	{
		var result = {
			connected: false,
			hosts: [],
			clients: []
		};
		if ( this.conn )
		{
			result.connected = true;
			
			// Gather all the hosts
			for (var key in this.sessions)
			{
				var session = this.sessions[key];
				if (session.isHost)
				{
					result.hosts.push(
					{
						key:           session.key,
						name:          session.name,
						applicationId: session.applicationId,
						applicationName: session.applicationName,
						hosting:       []
					});
				}
			}
			
			// Gather all the sessions hosted by each host
			for (var key in this.sessions)
			{
				var session = this.sessions[key];
				if (session.isHostClient)
				{
					for (var a = 0; a < result.hosts.length; a++)
					{
						if (result.hosts[a].key == session.hostKey)
						{
							result.hosts[a].hosting.push(
							{
								key:         session.key,
								distantName: session.distantName,
								distantAppName: session.distantAppName
							});
						}
					}
				}
			}
			
			// Gather all the clients
			for (var key in this.sessions)
			{
				var session = this.sessions[key];
				if (session.isClient)
				{
					result.clients.push(
					{
						key:           	session.key,
						hostName:      	session.hostName,
						applicationId: 	session.applicationId,
						distantAppName: session.distantAppName
					});
				}
			}
		}
		
		// Send results to window
		var application = findApplication( msg.applicationId );
		var window = GetContentWindowByAppMessage( application, msg );
		var nmsg = {
			connected:		result.connected,
			hosts:			result.hosts,
			clients:		result.clients
		};
		FriendNetwork.sendToWindow( window, 'status', nmsg);
	}
};

// FriendNetwork host object
FNetHost = function( key, window, applicationId, applicationName, name, description, password )
{
	var self = this;
	self.key = key;
	self.applicationId = applicationId;
	self.applicationName = 'application' 	//applicationName;
	self.name = name + '@' + FriendNetwork.hostName;
	self.description = description;
	self.window = window;
	self.isHost = true;
	self.hostClients = [];
	if ( typeof password == 'string' )
		self.password = 'HASHED' + Sha256.hash( password );
	else
		self.password = password;

	// listen for network events
	FriendNetwork.conn.on(self.key, handleEvents);
	
	// Broadcast on network
	var app = {
		id:          self.key,
		name:        name,
		description: description
	};
	FriendNetwork.conn.expose(app, exposeBack);
	function exposeBack(err, response)
	{
		if (err)
		{
			console.log('FdNethost exposeBack', err, response ? response : '');
			FriendNetwork.sendErrorToWindow(self.window, err, self.key, response);
			FriendNetwork.conn.release(self.key);
			FriendNetwork.removeHost(self.key);
			return;
		}
		
		var ok = false;
		if (!err)
		{
			for (var a = 0; a < response.length; a++)
			{
				if (response[a].id == self.key)
				{
					ok = true;
					var nmsg = {
						name:    self.name,
						hostKey: self.key
					};
					FriendNetwork.sendToWindow(self.window, 'host', nmsg);
					break;
				}
			}
		}
		if (!ok)
		{
			console.log('FNethost exposeBack', err, response ? response : '');
			FriendNetwork.sendErrorToWindow(self.window, 'ERR_HOSTING_FAILED', self.key, response);
			FriendNetwork.conn.release(self.key);
			FriendNetwork.removeHost(self.key);
		}
	}
	
	function handleEvents(data)
	{
		// Connection request
		if ( data.command == 'connect' )
		{
			// Add client for this host
			var key = FriendNetwork.addSession(  self.key );
			FriendNetwork.sessions[ key ] = new FNetHostClient( key, self, data );
			self.hostClients[ key ] = FriendNetwork.sessions[ key ];
		}
		else if ( self.hostClients[ data.key ] )
		{
			self.hostClients[ data.key ].handleEvents( data );
		}
	}
};
FNetHost.prototype.close = function( closingSession )
{
	var self = this;
	if ( closingSession )
	{
		// Close all connected clients
		for (var k in FriendNetwork.sessions)
		{
			var session = FriendNetwork.sessions[k];
			if (session.host)
			{
				if (session.host.key == self.key)
				{
					session.close();
				}
			}
		}
		return;
	}
	FriendNetwork.conn.conceal( self.key, function (err, response)
	{
		if (err)
		{
			console.log('FriendNetwork.close conceal', err, response ? response : '');
			FriendNetwork.sendErrorToWindow( self.window, err, self.key, response);
			return;
		}
		
		// Close all connected clients
		for (var k in FriendNetwork.sessions)
		{
			var session = FriendNetwork.sessions[k];
			if (session.host)
			{
				if (session.host.key == self.key)
				{
					session.close();
				}
			}
		}
		
		// Send message to host window
		var nmsg = {
			hostKey:    self.key,
			name:       self.name
		};
		FriendNetwork.sendToWindow(self.window, 'dispose', nmsg);
		FriendNetwork.conn.release(self.key);
		FriendNetwork.sessions[self.key] = false;
	});
};

// A client of the host
function FNetHostClient( key, host, data )
{
	console.log( 'FNetHostClient', key );
	var self = this;
	self.key = key;
	self.host = host;
	self.distantId = data.id;
	self.distantKey = data.key;
	self.distantName = data.name;
	self.distantAppName = data.applicationName;
	self.isHostClient = true;
	self.events= [];
	self.events[ 'credentials' ] = credentials;
	self.events[ 'clientDisconnected' ] = disconnect;
	self.events[ 'message' ] = message;
	
	self.conn = new EventNode(
		self.key,
		FriendNetwork.conn,
		eventSink,
	);
	function eventSink() {
		console.log( 'FnetHostClient.conn.eventSink', arguments );
	}
	//self.conn.on( self.key, handleP2PEvents );
	
	//FriendNetwork.conn.on( key, handleEvents );
	
	FriendNetwork.conn.send( self.distantId,
	{
		type: self.distantKey,
		data:
		{
			name:            FriendNetwork.hostName,
			hostName:        self.host.name,
			applicationName: self.host.applicationName,
			id:              FriendNetwork.networkId,
			key:             self.key,
			command:         'getCredentials',
			publicKey:       Workspace.encryption.keys.client.publickey
		}
	}, function (err, response)
	{
		if (err)
		{
			console.log('FNetClient constructor', err, response ? response : '');
			FriendNetwork.sendErrorToWindow( self.host.window, err, self.key, response);
			FriendNetwork.removeSession( self.key );
		}
	});
	
	self.handleEvents = function( data )
	{
		console.log( 'handleEvents', data );
		// Websocket connection?
		if ( data.command )
		{
			if (self.events[data.command])
				self.events[data.command](data);
			else
				console.log('FNetClient eventSink', data);
		}
		else
		{
			// Peer-to-peer connection?
			if ( data.type == 'connect' )
			{
				// Sends the accept request
				FriendNetwork.conn.request
				(
					data.data.type,
					{
						accept:  true,
						options:
						{
							data:    "Hello!"
						}
					},
					function (error, response)
					{
						if (!error)
						{
							// Creates Peer object for p2p communication
							self.peer = new Peer
							(
								response,
								FriendNetwork.conn,
								function (err, response)
								{
									console.log('FNetHostClient.handleEvents.request callback', err, response);
								}
							);
							self.p2p = true;
							
							// Send message to window
							var nmsg = {
								hostKey:         self.host.key,
								key:             self.key,
								name:            self.distantName,
								sessionPassword: self.sessionPassword
							};
							FriendNetwork.sendToWindow( self.host.window, 'p2pClientConnected', nmsg );
						}
					}
				);
			}
		}
	};
	function handleP2PEvents( data, response )
	{
		debugger;
	}
	function credentials( data )
	{
		var good = true;
		
		var clientPassword = Workspace.encryption.decrypt(data.data, Workspace.encryption.keys.client.privatekey);
		
		// Compare to user's password
		if ( self.host.password )
		{
			// If the password is a string, just compare
			if ( typeof self.host.password == 'string' )
			{
				if ( clientPassword == self.host.password )
				{
					good = true;
					self.sessionPassword = false;
				}
			}
			else
			{
				// If it is an object, ask calling app to validate it
			}
		}
		else
		{
			if ( clientPassword == Workspace.loginPassword )
			{
				good = true;
				self.sessionPassword = true;
			}
		}
		
		if (!good)
		{
			// Wrong credentials
			FriendNetwork.conn.send(self.distantId, {
				type: self.distantKey,
				data: {
					command: 'wrongCredentials',
					hostKey: self.hostKey,
					key:     self.key
				}
			}, function (err, response)
			{
				if (err)
				{
					console.log('FNetHost client', err, response ? response : '');
					FriendNetwork.sendErrorToWindow( self.host.window, err, self.key, response);
				}
			});
		}
		else
		{
			// Connected!
			FriendNetwork.conn.send(self.distantId, {
				type: self.distantKey,
				data: {
					command:         'connected',
					hostKey:         self.host.key,
					key:             self.key,
					sessionPassword: self.sessionPassword
				}
			}, function (err, response)
			{
				if (err)
				{
					console.log('FNetHost client', err, response ? response : '');
					FriendNetwork.sendErrorToWindow( self.host.window, err, self.key, response);
				}
			});
			
			// Send message to window
			var nmsg = {
				hostKey:         self.host.key,
				key:             self.key,
				name:            self.distantName,
				sessionPassword: self.sessionPassword
			};
			FriendNetwork.sendToWindow( self.host.window, 'clientConnected', nmsg );
		}
	}
	function disconnect( data )
	{
		// Send message to window
		var nmsg = {
			hostKey:         self.host.key,
			key:             self.key,
			name:            self.distantName
		};
		FriendNetwork.sendToWindow( self.host.window, 'clientDisconnected', nmsg );
		
		// Remove session
		FriendNetwork.conn.release( self.key );
		FriendNetwork.removeSession( self.key );
	}
	function message( data )
	{
		// Simple message : Send to window
		var nmsg = {
			hostKey:         self.host.key,
			key:             self.key,
			name:            self.distantName,
			data:            data.data
		};
		FriendNetwork.sendToWindow( self.host.window, 'messageFromClient', nmsg );
	}
}
FNetHostClient.prototype.close = function()
{
	var self = this;
	var nmsg = {
		type: self.distantKey,
		data: {
			command: 	'hostDisconnected',
			hostKey:	self.hostKey,
			key: 		self.key,
			name:    	self.host.name
		}
	};
	FriendNetwork.conn.send(self.distantId, nmsg, function (err, response)
	{
	});
	
	FriendNetwork.conn.release( this.key );
	FriendNetwork.sessions[ this.key ] = false;
};
FNetHostClient.prototype.send = function( data )
{
	var self = this;
	var nmsg = {
		type: self.distantKey,
		data: {
			command: 	'message',
			hostKey:	self.hostKey,
			key: 		self.key,
			name:    	self.host.name,
			data:    	data
		}
	};
	if ( !self.p2p )
	{
		FriendNetwork.conn.send(self.distantId, nmsg, function (err, response)
		{
			if (err)
			{
				console.log('FriendNetwork.send', err, response ? response : '');
				FriendNetwork.sendErrorToWindow(self.host.window, err, self.key, response);
			}
		});
	}
	else if ( self.peer )
	{
		self.peer.send( nmsg );
	}
};

function FNetClient( key, window, applicationId, applicationName, hostId, hostKey, hostName, p2p )
{
	console.log( 'FNetClient', key );
	var self = this;
	self.name = FriendNetwork.hostName;
	self.key = key;
	self.window = window;
	self.applicationId = applicationId;
	self.applicationName = 'application';	//applicationName;
	self.distantId = hostId;
	self.hostKey = hostKey;
	self.hostName = hostName;
	self.p2pEnabled = p2p;
	self.isClient = true;
	self.conn = null;
	self.events= [];
	self.events[ 'getCredentials' ] = getCredentials;
	self.events[ 'wrongCredentials' ] = wrongCredentials;
	self.events[ 'connected' ] = connected;
	self.events[ 'hostDisconnected' ] = hostDisconnected;
	self.events[ 'credentialsTimeout' ] = credentialsTimeout;
	self.events[ 'message' ] = message;
	
	/*
		using this as appConn for peer connection
	*/
	self.conn = new EventNode(
		self.key,
		FriendNetwork.conn,
		eventSink,
	);
	
	// we need to redefine EventNode.send as the network interface is not
	// a standard EventNode; it requires two extra pieces of information.
	// Someone could probably add a NetworkNode to events.js
	self.conn.send = sendToHost;
	function sendToHost( event ) {
		var toApp = {
			type : self.hostKey,
			data : event,
		};
		console.log( 'sendToHost', toApp );
		FriendNetwork.conn.send( self.distantId, toApp );
	}
	
	function eventSink() {
		console.log( 'FNetClient - eventsink', arguments );
	}
	
	FriendNetwork.conn.on( key, handleEvents );
	
	self.conn.send(
	{
		command:         'connect',
		id:              FriendNetwork.networkId,
		key:             self.key,
		name:            self.name,
		applicationName: self.applicationName
	});
	
	function handleEvents( data )
	{
		console.log( 'FNetClient.handleEvents', data );
		if (self.events[data.command])
			self.events[data.command](data);
		else
			console.log('FNetClient command not found', data);
	}
	function getCredentials( data )
	{
		self.distantKey = data.key;
		self.distantName = data.name;
		self.distantAppName = data.applicationName;
		self.hostPublicKey = data.publicKey;
		self.sessionPassword = data.sessionPassword;
		
		var nmsg = {
			key: 		self.key,
			name:       self.distantName,
			hostName:	self.hostName,
			sessionPassword: self.sessionPassword
		};
		FriendNetwork.sendToWindow( window, 'getCredentials', nmsg );
	}
	function wrongCredentials( data )
	{
		var nmsg = {
			key             : self.key,
			name            : self.distantName,
			appName         : self.distantAppName,
			sessionPassword : self.sessionPassword,
		};
		FriendNetwork.sendToWindow( window, 'wrongCredentials', nmsg );
	}
	function connected( data )
	{
		var nmsg = {
			key             : self.key,
			hostName        : self.hostName,
			name            : self.distantName,
			sessionPassword : self.sessionPassword,
		};
		FriendNetwork.sendToWindow( window, 'connected', nmsg );
		
		console.log( 'FNetClient.connected', data );
		
		// If p2p, sends a 'connect' message to host to establish p2p connection
		if ( self.p2pEnabled )
		{
			FriendNetwork.conn.connect(
				self.distantId,
				self.distantKey,
				{
					name: self.name,
					data: data
				},
				self.key,
				connectBack
			);
			
			function connectBack ( error, response )
			{
				if ( error )
					return;
				
				// Creates Peer object for communication
				self.peer = new Peer(
					response,
					FriendNetwork.conn,
					onend
				);
				function onend()
				{
					console.log('Peer.onend' );
				}
				
				self.p2p = true;
				
				// Send message to window
				var nmsg =
				{
					key             : self.key,
					hostName        : self.hostName,
					name            : self.distantName,
					sessionPassword : self.sessionPassword,
				};
				FriendNetwork.sendToWindow( window, 'p2pConnected', nmsg );
			}
		}
	}
	function hostDisconnected( data )
	{
		var nmsg = {
			hostKey:	self.hostKey,
			key:      	self.key,
			name:       self.hostName
		};
		FriendNetwork.sendToWindow( window, 'hostDisconnected', nmsg );
		FriendNetwork.conn.release( self.key );
		FriendNetwork.removeSession( self.key );
	}
	function credentialsTimeout( data )
	{
		var nmsg = {
			hostKey:	self.hostKey,
			key:      	self.key,
			name:       self.hostName
		};
		FriendNetwork.sendToWindow( window, 'credentialsTimeout', nmsg );
		FriendNetwork.conn.release( self.key );
		FriendNetwork.removeSession( self.key );
	}
	function message( data )
	{
		var nmsg = {
			key:      	self.key,
			name:       self.distantName,
			data:		data.data
		};
		FriendNetwork.sendToWindow( window, 'messageFromHost', nmsg );
	}
}
FNetClient.prototype.send = function( data )
{
	var self = this;
	var msg =
	{
		command: 	'message',
		key: 		self.distantKey,
		name:    	self.localName,
		data:    	data
	};
	if ( !self.p2p )
	{
		self.conn.send( msg );
	}
	else if ( self.peer )
	{
		self.peer.send( msg );
	}
};
FNetClient.prototype.sendCredentials = function( password )
{
	var self = this;
	
	// Encrypts the password with host public key
	var passCrypted = Workspace.encryption.encrypt( 'HASHED' + Sha256.hash( password ), self.hostPublicKey );
	var msg =
	{
		command: 	'credentials',
		key: 		self.distantKey,
		name:    	self.name,
		data:   	passCrypted
	};
	self.conn.send( msg );
};
FNetClient.prototype.close = function()
{
	var self = this;
	self.conn.send(
	{
		command:	'clientDisconnected',
		key:		self.distantKey,
		name:		self.name
	});
	
	// Send message to window
	var nmsg = {
		subCommand:      'disconnected',
		key:             self.key,
		name:            self.distantName
	};
	FriendNetwork.sendToWindow( self.window, 'disconnected', nmsg );
	
	FriendNetwork.conn.release( self.key );
	FriendNetwork.sessions[ self.key ] = false;
};
