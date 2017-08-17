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

		var window;
		if ( msg.message && msg.message.applicationId )
		{
			window = GetContentWindowByAppMessage( findApplication( msg.message.applicationId ), msg.message );
		}
		
		this.conn.getHosts( hostsBack );
		function hostsBack( err, response )
		{
			console.log( 'hostsBack', err, response );
			if ( err )
			{
				console.log('FriendNetwork.list', err, response ? response  : '');
				FriendNetwork.sendErrorToWindow( window, msg.callback, 'ERR_LIST_HOSTS', false, response );
				return;
			}
			
			var nmsg =
			{
				hosts: response
			};
			FriendNetwork.sendToWindow( window, msg.callback, 'list', nmsg );
		}
	},
	
	// Starts hosting session
	startHosting: function( msg )
    {
		if ( !this.conn )
			return;
		
		var applicationId, window;
		var applicationName = msg.message.applicationName;
		if ( msg.message && msg.message.applicationId )
		{
			applicationId = msg.message.applicationId;
			window = GetContentWindowByAppMessage( findApplication( applicationId ), msg.message );
		}
		else
		{
			applicationId = 'friendnetwork'
		}
	
		for( var a in this.hosts )
		{
			if ( this.hosts[ a ].name == msg.name )
			{
				console.log('FriendNetwork.startHosting', 'ERR_HOST_ALREADY_EXISTS', msg.name);
				this.sendErrorToWindow( window, msg.callback, 'ERR_HOST_ALREADY_EXISTS', false, msg.name );
				return;
			}
		}
		
		// Creates new FNethost object
		var key = this.addSession( applicationId );
		this.sessions[ key ] = new FNetHost( key, window, applicationId, applicationName, msg.name, msg.description, msg.data, msg.callback );
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
			var window;
			if ( msg.message && msg.message.applicationId )
			{
				window = GetContentWindowByAppMessage( findApplication( msg.message.applicationId ), msg.message );
			}
			this.sendErrorToWindow( window, msg.callback, 'ERR_HOST_NOT_FOUND', msg.key, msg.name );
		}
	},
	
	// Connect to distant host
	connectToHost: function( msg )
	{
		if ( !this.conn )
			return;
		
		var applicationId, window;
		var applicationName = msg.message.applicationName;
		if ( msg.message && msg.message.applicationId )
		{
			applicationId = msg.message.applicationId;
			window = GetContentWindowByAppMessage( findApplication( applicationId ), msg.message );
		}
		else
		{
			applicationId = 'friendnetwork'
		}

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
								FriendNetwork.sessions[ key ] = new FNetClient(
									key,
									window,
									applicationId,
									applicationName,
									response[a].hostId,
									apps[b].id,
									apps[b].name + '@' + response[a].name,
									msg.p2p,
									msg.callback
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
				FriendNetwork.sendErrorToWindow( window, msg.callback, err, false, response );
				return;
			}
			if ( !found )
			{
				console.log( 'FriendNetwork.connectToHost', 'ERR_HOST_NOT_FOUND', msg.name );
				FriendNetwork.sendErrorToWindow( window, msg.callback, 'ERR_HOST_NOT_FOUND', false, msg.name );
			}
		}
	},
	
	disconnectFromHost: function( msg )
	{
		if ( !this.conn )
			return;

		var session = FriendNetwork.sessions[ msg.key ];
		if ( session && session.isClient )
		{
			session.close();
			this.sessions = this.cleanKeys( this.sessions );
		}
		else
		{
			console.log('FriendNetwork.disconnectFromHost', 'ERR_CLIENT_NOT_FOUND', msg.name);
			var window;
			if ( msg.message && msg.message.applicationId )
				window = GetContentWindowByAppMessage( findApplication( msg.message.applicationId ), msg.message );
			this.sendErrorToWindow( window, msg.callback, 'ERR_CLIENT_NOT_FOUND', msg.key );
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
			var window;
			if ( msg.message && msg.message.applicationId )
				window = GetContentWindowByAppMessage( findApplication( msg.message.applicationId ), msg.message );
			this.sendErrorToWindow( window, msg.callback, 'ERR_HOST_NOT_FOUND', msg.key );
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
			var window;
			if ( msg.message && msg.message.applicationId )
				window = GetContentWindowByAppMessage( findApplication( msg.message.applicationId ), msg.message );
			this.sendErrorToWindow( window, msg.callback, 'ERR_HOST_NOT_FOUND', msg.key );
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
			if ( msg.message && msg.message.applicationId )
				window = GetContentWindowByAppMessage( findApplication( msg.message.applicationId ), msg.message );
			this.sendErrorToWindow( window, msg.callback, 'ERR_SESSION_NOT_FOUND', msg.key );
		}
	},
	
	// Timeout function
	handleTimeout: function()
    {
		if ( !this.conn )
			return;
		
	    for (var key in FriendNetwork.sessions)
	    {
		    var session = FriendNetwork.sessions[ key ];

		    if ( session.isHostClient )
		    {
			    // Connexion timeout?
			    session.countDown--;
			    if ( session.countDown == 0 )
			    {
				    console.log('FriendNetwork.timeout hostClient timeout');
	
					// Send message to host window
				    var hostApplication = findApplication(session.localAppId);
				    var window = GetContentWindowByAppMessage(hostApplication, session.localAppId);
				    var msg = {
					    command:    'friendnetwork',
					    subCommand: 'timeout',
						key:		session.key,
						hostKey:	session.hostKey,
					    name:       session.distantName,
					    appName:    session.distantAppName
				    };
				    FriendNetwork.sendToWindow( window, session.host.callback, 'timeout', msg );
				    session.close( true );
			    }

			    // Send a ping message to client every second
				session.countDown = 10;
			    FriendNetwork.conn.send( session.distantId,
			    {
				    type: session.distantKey,
				    data: {
					    command: 'ping',
					    key:     session.key
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
	sendErrorToWindow: function( window, callback, error, key, response )
    {
		var msg = {
			command:         'friendnetwork',
			subCommand:      'error',
			error:        	 error,
			key:             key,
			response:		 response
		};
		if ( typeof callback == 'function' )
		{
			callback( msg );
		}
    	if ( window )
		{
			if ( typeof callback == 'string' )
				message.callback = callback;
			try
			{
				window.postMessage( JSON.stringify( msg ), '*' );
			}
			catch (err)
			{}
		}
    },
	// Send message to window
	sendToWindow: function( window, callback, subCommand, message )
    {
		message.command = 'friendnetwork';
		message.subCommand = subCommand;
		if ( typeof callback == 'function' )
		{
			callback( msg );
		}
    	if ( window )
		{
			if ( typeof callback == 'string' )
				message.callback = callback;
			try
			{
				window.postMessage( JSON.stringify( message ), '*' );
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
	getStatus: function( msg, callback )
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
		FriendNetwork.sendToWindow( window, callback, 'status', nmsg);
	}
};

// FriendNetwork host object
FNetHost = function( key, window, applicationId, applicationName, name, description, password, callback )
{
	var self = this;
	self.key = key;
	self.applicationId = applicationId;
	self.applicationName = 'application' 	//applicationName;
	self.name = name + '@' + FriendNetwork.hostName;
	self.description = description;
	self.window = window;
	self.isHost = true;
	self.callback = callback;
	self.hostClients = [];
	if ( typeof password == 'string' )
		self.password = 'HASHED' + Sha256.hash( password );
	else
		self.password = password;

	self.conn = new EventNode(
		self.key,
		FriendNetwork.conn,
		eventSink
	);
	self.conn.send = function() {
		console.log( 'FnetHost.conn.send - dont use this. \
			Use the conn.send in the session for the specific remote app \
			( some instance of FNetHostClient )', arguments );
	};
	// listen for network events
	//FriendNetwork.conn.on( 'connect', connectRequest );
	FriendNetwork.conn.on(self.key, handleEvents);
	
	function eventSink() {
		//console.log( 'FNetHost - eventsink', arguments );
	}
	
	function connectRequest( connReq )
	{
		console.log( 'connectRequest', connReq );
		const remoteApp = connReq.data.sourceApp;
		self.hostClients[ remoteApp ] = new FNetHostP2PClient(
			self.key,
			connReq,
			p2pOnEnd,
			self,
			remoteApp
		);
		FriendNetwork.sessions[ remoteApp ] = self.hostClients[ remoteApp ];
		function p2pOnEnd( e ) {
			console.log( 'p2p ended' );
		}
	}
	
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
			FriendNetwork.sendErrorToWindow( self.window, self.callback, err, self.key, response );
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
					FriendNetwork.sendToWindow(self.window, self.callback, 'host', nmsg);
					break;
				}
			}
		}
		if (!ok)
		{
			console.log('FNethost exposeBack', err, response ? response : '');
			FriendNetwork.sendErrorToWindow( self.window, self.callback, 'ERR_HOSTING_FAILED', self.key, response );
			FriendNetwork.conn.release(self.key);
			FriendNetwork.sessions[ self.key ] = false;
			FriendNetwork.cleanKeys( FriendNetwork.sessions );
		}
	}
	
	function handleEvents(data)
	{
		if ( data.command == 'connect' )
		{
			var k = FriendNetwork.addKey(FriendNetwork.sessions, self.key);
			self.hostClients[ k ] = new FNetHostClient(k, self, data);
			FriendNetwork.sessions[ k ] = self.hostClients[ k ];
		}
		else if ( data.type == 'connect' )
		{
			connectRequest( data.data );
		}
		else if ( data.key )
		{
			if ( self.hostClients[ data.key ] )
			{
				self.hostClients[ data.key ].handleEvents( data );
			}
		}
	}
};
FNetHost.prototype.removeHClient = function( key )
{
	if ( FriendNetwork.sessions[ key ] )
	{
		FriendNetwork.sessions[ key ] = false;
		FriendNetwork.cleanKeys( FriendNetwork.sessions );
		this.hostClients[ key ] = false;
		FriendNetwork.cleanKeys( this.hostClients );
	}
};

FNetHost.prototype.closeClient = function( key, clean )
{
	var self = this;
	if ( self.hostClients[ key ] )
	{
		self.hostClients[ key ].close();
		self.hostClients[ key ] = false;
		FriendNetwork.sessions[ key ] = false;
		if ( clean )
		{
			FriendNetwork.cleanKeys( FriendNetwork.sessions );
			FriendNetwork.cleanKeys( self.hostClients );
		}
	}
};

FNetHost.prototype.close = function( closingSession )
{
	var self = this;
	if ( closingSession )
	{
		// Close all connected clients
		for ( var key in self.hostClients )
		{
			self.hostClients[ key ].close();
		}
		return;
	}
	FriendNetwork.conn.conceal( self.key, function (err, response)
	{
		if (err)
		{
			console.log('FriendNetwork.close conceal', err, response ? response : '');
			FriendNetwork.sendErrorToWindow( self.window, self.callback, err, self.key, response );
			return;
		}
		
		// Close all connected clients
		for ( var key in self.hostClients )
		{
			self.hostClients[ key ].close();
		}
		FriendNetwork.cleanKeys( self.hostClients );
		FriendNetwork.conn.release( self.key );
		FriendNetwork.sessions[ self.key ] = false;
		FriendNetwork.cleanKeys( FriendNetwork.sessions );
		
		// Send message to host window
		var msg =
		{
			hostKey:    self.key,
			name:       self.name
		};
		FriendNetwork.sendToWindow( self.window, self.callback, 'disposed', msg );
	});
};

// A client of the host
function FNetHostClient( key, host, data )
{
	console.log( 'FNetHostClient', self );
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
		eventSink
	);
	function eventSink() {
		console.log( 'FnetHostClient.conn.eventSink', arguments );
	}
	
	self.credentialCount = 3;
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
			FriendNetwork.sendErrorToWindow( self.host.window, self.host.callback, err, self.key, response);
			FriendNetwork.removeSession( self.key );
		}
	});
	
	self.handleEvents = function( data )
	{
		console.log( 'handleEvents', data );
		if ( data.command )
		{
			if (self.events[data.command])
				self.events[data.command](data);
			else
				console.log('FNetClient eventSink', data);
		}
	};
	function credentials( data )
	{
		var good = false;
		
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
		
		if ( !good )
		{
			self.credentialCount--;
			if ( self.credentialCount == 0 )
			{
				FriendNetwork.conn.send(self.distantId,
				{
					type: self.distantKey,
					data: {
						command: 'failedCredentials',
						hostKey: self.hostKey,
						key:     self.key
					}
				}, function (err, response)
				{
				});
				self.host.removeHClient( self.key );
			}
			else
			{
				// Wrong credentials
				FriendNetwork.conn.send(self.distantId,
				{
					type: self.distantKey,
					data: {
						command: 'wrongCredentials',
						hostKey: self.hostKey,
						key:     self.key
					}
				}, function (err, response)
				{
					console.log('FNetHost client', err, response ? response : '');
				});
			}
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
				console.log('FNetHost client', err, response ? response : '');
			});
			
			// Send message to window
			var nmsg = {
				hostKey:         self.host.key,
				key:             self.key,
				name:            self.distantName,
				sessionPassword: self.sessionPassword,
				p2p:			 false
			};
			FriendNetwork.sendToWindow( self.host.window, self.host.callback, 'clientConnected', nmsg );
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
		FriendNetwork.sendToWindow( self.host.window, self.host.callback, 'clientDisconnected', nmsg );
		
		// Remove session
		self.host.removeHClient( self.key );
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
		FriendNetwork.sendToWindow( self.host.window, self.host.callback, 'messageFromClient', nmsg );
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
	FriendNetwork.conn.send(self.distantId, nmsg, function (err, response)
	{
		if (err)
		{
			console.log('FriendNetwork.send', err, response ? response : '');
			FriendNetwork.sendErrorToWindow( self.host.window, self.host.callback, err, self.key, response );
		}
	});
};

// A client of the host
function FNetHostP2PClient( netKey, req, onend, host, key )
{
	var self = this;
	console.log( 'FNetHostP2PClient', self );
	var data = req.data;
	self.key = key;
	self.host = host;
	self.remoteId = data.sourceHost;
	self.remoteKey = data.sourceApp;
	self.isHostClient = true;
	self.events = {};
	self.events[ 'credentials' ] = credentials;
	self.events[ 'clientDisconnected' ] = disconnect;
	self.events[ 'message' ] = message;
	
	self.conn = new EventNode(
		netKey,
		FriendNetwork.conn
	);

	// Setup event node
	self.conn.send = sendToRemote;
	function sendToRemote( event ) {
		var toApp = {
			type : self.remoteKey,
			data : event
		};
		console.log( 'sendToRemote', toApp );
		FriendNetwork.conn.send( self.remoteId, toApp );
	}
	var replyId = req.type;
	var reply = {
		accept : true,
		opts   : {
			infos : 'hepp!'
		}
	}
	FriendNetwork.conn.request(
		replyId,
		reply,
		replyBack
	);
	
	function replyBack( err, res )
	{
		console.log( 'connect replyBack', {
			e : err,
			r : res
		});
		self.peer = new Peer(
			res,
			self.conn,
			peerEventSink,
			onPeerEnd
		);
		self.peer.on( 'event', handleEvents );
		
		// Send the getCredentials message
		var msg =
		{
			type: 'event',
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
		};
		self.peer.send(msg);

		function peerEventSink() {
			console.log( 'FNetHostClient peer eventsink', arguments );
		}
		function onPeerEnd( e ) {
			console.log( 'FNetHostClient onPeerEnd', e );
		}
	}
	function handleEvents( data )
	{
		if ( data.command )
		{
			if (self.events[data.command])
				self.events[data.command](data);
			else
				console.log('FNetHostP2PClient eventSink', data);
		}
	}
	function credentials( data )
	{
		var good = false;
		self.distantName = data.name;
		self.distantAppName = data.applicationName;
		
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
			self.credentialCount--;
			if ( self.credentialCount == 0 )
			{
				var msg =
				{
					type: 'event',
					data:
					{
						command: 'failedCredentials',
						hostKey: self.hostKey,
						key:     self.key
					}
				};
				self.peer.send( msg );
				self.host.removeHClient( self.key );
			}
			else
			{
				// Wrong credentials
				var msg =
				{
					type: 'event',
					data:
					{
						command: 'wrongCredentials',
						hostKey: self.hostKey,
						key:     self.key
					}
				};
				self.peer.send( msg );
			}
		}
		else
		{
			// Connected!
			var msg =
			{
				type: 'event',
				data:
				{
					command:         'connected',
					hostKey:         self.host.key,
					key:             self.key,
					sessionPassword: self.sessionPassword
				}
			};
			self.peer.send( msg );
			
			// Send message to window
			var nmsg =
			{
				hostKey:         self.host.key,
				key:             self.key,
				name:            self.distantName,
				sessionPassword: self.sessionPassword,
				p2p: 			 true
			};
			FriendNetwork.sendToWindow( self.host.window, self.host.callback, 'clientConnected', nmsg );
		}
	}
	function disconnect( data )
	{
		// Send message to window
		var nmsg =
		{
			hostKey:         self.host.key,
			key:             self.key,
			name:            self.distantName
		};
		FriendNetwork.sendToWindow( self.host.window, self.host.callback, 'clientDisconnected', nmsg );
		
		// Remove session
		FriendNetwork.removeSession( self.key );
	}
	function message( data )
	{
		// Simple message : Send to window
		var nmsg =
		{
			hostKey:         self.host.key,
			key:             self.key,
			name:            self.distantName,
			data:            data.data
		};
		FriendNetwork.sendToWindow( self.host.window, self.host.callback, 'messageFromClient', nmsg );
	}
}
FNetHostP2PClient.prototype.close = function()
{
	var self = this;
	var msg = {
		type: 'event',
		data: {
			command: 	'hostDisconnected',
			hostKey:	self.hostKey,
			key: 		self.key,
			name:    	self.host.name
		}
	};
	self.peer.send( msg );
};
FNetHostP2PClient.prototype.send = function( data )
{
	var self = this;
	var msg = {
		type: 'event',
		data: {
			command: 	'message',
			hostKey:	self.hostKey,
			key: 		self.key,
			name:    	self.host.name,
			data:    	data
		}
	};
	self.peer.send( msg );
};

function FNetClient( key, window, applicationId, applicationName, hostId, hostKey, hostName, p2p, callback )
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
	self.callback = callback;
	self.p2pEnabled = p2p;
	self.isClient = true;
	self.conn = null;
	self.events= [];
	self.events[ 'getCredentials' ] = getCredentials;
	self.events[ 'wrongCredentials' ] = wrongCredentials;
	self.events[ 'failedCredentials' ] = failedCredentials;
	self.events[ 'connected' ] = connected;
	self.events[ 'hostDisconnected' ] = hostDisconnected;
	self.events[ 'message' ] = message;
	self.events[ 'ping' ] = ping;
	self.timeoutCount = 10;
	
	// Using this as appConn for peer connection
	self.conn = new EventNode(
		self.key,
		FriendNetwork.conn,
		eventSink
	);
	
	// Redefine EventNode.send
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
	
	if ( !self.p2pEnabled )
	{
		FriendNetwork.conn.on(key, handleEvents);
		self.conn.send(
		{
			command:         'connect',
			id:              FriendNetwork.networkId,
			key:             self.key,
			name:            self.name,
			applicationName: self.applicationName
		});
	}
	else
	{
		console.log('FNetClient.self', self);
		FriendNetwork.conn.connect(
				self.distantId,
				self.hostKey,
				{},
				self.key,
				connectBack
		);
		
		function connectBack(err, res)
		{
			console.log('FNetClient.connectBack', {
				e: err,
				r: res
			});
			self.peer = new Peer(
					res,
					self.conn,
					peerEventSink,
					onPeerEnd
			);
			self.p2p = true;
			self.peer.on( 'event', handleEvents );
			
			function peerEventSink()
			{
				console.log('FNetClient peerEventsink', arguments);
			}
			function onPeerEnd(e)
			{
				console.log('FNetClient peer ended');
			}
		}
	}
	
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
		FriendNetwork.sendToWindow( self.window, self.callback, 'getCredentials', nmsg );
	}
	function wrongCredentials( data )
	{
		FriendNetwork.sendErrorToWindow( self.window, self.callback, 'ERR_WRONG_CREDENTIALS', self.key, self.distantName );
	}
	function failedCredentials( data )
	{
		FriendNetwork.sendErrorToWindow( self.window, self.callback, 'ERR_FAILED_CREDENTIALS', self.key, self.distantName );
		FriendNetwork.conn.release( self.key );
		FriendNetwork.sessions[ self.key ] = false;
		FriendNetwork.cleanKeys( FriendNetwork.sessions );
	}
	function connected( data )
	{
		var nmsg = {
			key             : self.key,
			hostName        : self.hostName,
			name            : self.distantName,
			sessionPassword : self.sessionPassword
		};
		FriendNetwork.sendToWindow( self.window, self.callback, 'connected', nmsg );
		
		console.log( 'FNetClient.connected', data );
	}
	function hostDisconnected( data )
	{
		var nmsg = {
			hostKey:	self.hostKey,
			key:      	self.key,
			name:       self.hostName
		};
		FriendNetwork.sendToWindow( self.window, self.callback, 'hostDisconnected', nmsg );
		FriendNetwork.conn.release( self.key );
		FriendNetwork.removeSession( self.key );
	}
	function ping( data )
	{
		var self = this;
		self.timeoutCount = 10;
		var msg =
		{
			command: 	'pong',
			key: 		self.distantKey
		};
		self.conn.send( msg );
	}
	function message( data )
	{
		var nmsg = {
			key:      	self.key,
			name:       self.distantName,
			data:		data.data
		};
		FriendNetwork.sendToWindow( self.window, self.callback, 'messageFromHost', nmsg );
	}
}
FNetClient.prototype.send = function( data )
{
	var self = this;
	if ( !self.p2p )
	{
		var msg =
		{
			command: 	'message',
			key: 		self.distantKey,
			name:    	self.localName,
			data:    	data
		};
		self.conn.send( msg );
	}
	else if ( self.peer )
	{
		var msg =
		{
			type:		'event',
			data:
			{
				command: 	'message',
				key: 		self.distantKey,
				name:    	self.localName,
				data:    	data
			}
		};
		self.peer.send( msg );
	}
};
FNetClient.prototype.sendCredentials = function( password )
{
	var self = this;
	
	// Encrypts the password with host public key
	var passCrypted = Workspace.encryption.encrypt( 'HASHED' + Sha256.hash( password ), self.hostPublicKey );
	if ( !self.p2p )
	{
		var msg =
		{
			command: 'credentials',
			key:     self.distantKey,
			name:    self.name,
			data:    passCrypted
		};
		self.conn.send(msg);
	}
	else if ( self.peer )
	{
		var msg =
		{
			type:		'event',
			data:
			{
				command: 'credentials',
				key:     self.distantKey,
				name:    self.name,
				data:    passCrypted
			}
		};
		self.peer.send( msg );
	}
};
FNetClient.prototype.close = function()
{
	var self = this;
	if ( !self.p2p )
	{
		self.conn.send(
		{
			command: 'clientDisconnected',
			key:     self.distantKey,
			name:    self.name
		});
	}
	else if ( self.peer )
	{
		var msg =
		{
			type:		'event',
			data:
			{
				command: 'clientDisconnected',
				key:     self.distantKey,
				name:    self.name
			}
		};
		self.peer.send( msg );
	}

	// Send message to window
	var msg = {
		key:             self.key,
		name:            self.distantName
	};
	FriendNetwork.sendToWindow( self.window, self.callback, 'disconnected', msg );
	
	FriendNetwork.conn.release( self.key );
	FriendNetwork.sessions[ self.key ] = false;
};
