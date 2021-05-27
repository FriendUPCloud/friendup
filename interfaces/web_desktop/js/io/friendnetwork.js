/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Network class that handles Friend Core to Friend Core connections as well as
// our encrypted WebRTC based peer-to-peer network

var Friend = window.Friend || {};

FriendNetwork = {
	// Vars
	debugging: false,
	onlineStatus: false,
	sessions: {},           // List of applications and processes that use the friend network
	sending: {},            // Files being sent
	receiving: {},          // Files being received
	conn: null,             // network connection
	networkId: false,
	connected: false,
	hostsUpdates: {},
	appsUpdates: {},

	// Methods
	// host      :  server domain
	// authType  : 'workspace' | 'application' - sessionId or authId respectively required
	// authToken : sessionId | authId - see ^^^
	// hostMeta  : see below
	init: function( host, authType, authToken, hostMeta, callback )
	{
		console.log( 'FriendNetwork.init', arguments );
		/*
		 hostMeta is optinal, and is used to make your host human readable on the network
		 hostMeta can contain:
		 name, <string>
		 description, <string>
		 apps, [ appMeta, .. ]
		 imagePath, <string>

		 hostMeta can also be updated later with .updateMeta
		 */
		var self = this;
		self.host = host;
		self.authType = authType;
		self.authToken = authToken;
		self.callback = callback;
		if ( !hostMeta || ( hostMeta && !hostMeta.info ) || ( hostMeta && hostMeta.info && !hostMeta.info.internal ) )
		{
			this.getUserInfos( function( userInfo )
			{
				self.userInformation = userInfo;

				if ( !hostMeta )
					hostMeta = {};
				if ( !hostMeta.name )
					hostMeta.name = userInfo.name;
				if ( !hostMeta.description )
					hostMeta.description = userInfo.description;
				if ( !hostMeta.apps )
					hostMeta.apps = [];
				if ( !hostMeta.imagePath )
					hostMeta.imagePath = '';
				if ( !hostMeta.info )
					hostMeta.info = {};
				if ( !hostMeta.info.fullName )
					hostMeta.info.fullName = userInfo.fullName;
				if ( !hostMeta.info.image )
					hostMeta.info.image = userInfo.image;

				self.hostMeta = hostMeta;
				self.hostName = hostMeta.name;

				doConnect( hostMeta );
			} );
		}
		else
		{
			self.hostMeta = hostMeta;
			self.hostName = hostMeta.name;
			self.userInformation =
			{
				name: hostMeta.name,
				fullName: hostMeta.info.fullName,
				image: hostMeta.info.image,
				description: hostMeta.description
			}
			doConnect( hostMeta );
		}
		function doConnect( meta )
		{
			self.isConnecting = true;

			self.conn = new NetworkConn(
				host,
				authType,
				authToken,
				eventSink, // events that do not have a registered listener get sent here
				onOpen,
				onEnd,
				meta
			);
			self.conn.on( 'connect', connectRequest );
			self.conn.on( 'disconnect', remoteDisconnected );
			self.conn.on( 'host-update', hostUpdated );
			self.conn.on( 'apps', appsUpdated );
			self.conn.on( 'host-closed', hostClosed );

			// Starts the connection watchdog
			if ( !self.handleWatchDog )
			{
				self.handleWatchDog = setInterval( function()
				{
					self.watchDog();
				}, 100 );
			}
		}
		function connectRequest( data, hostId )
		{
			console.log( 'connectRequest', {
				data: data,
				hostId: hostId
			});
		}

		function remoteDisconnected( data, hostId )
		{
			console.log( 'handleRemoteDisconnected', {
				data: data,
				hostId: hostId,
			} );
		}

		function hostUpdated( host )
		{
			var identifier;
			for ( identifier in FriendNetwork.hostsUpdates )
			{
				var update = FriendNetwork.hostsUpdates[ identifier ];
				var msg = { updated: true, host: host, identifier: identifier };
				FriendNetwork.sendToWindow( update.messageInfo, update.callback, 'hostsUpdate', msg );
			}
		}

		function hostClosed( hostId )
		{
			var self = FriendNetwork;
			for ( var s in self.sessions )
			{
				var session = self.sessions[ s ];
				if ( session.isClient )
				{
					session.hostClosed( hostId );
				}
			}
		}

		function appsUpdated( apps, hostId )
		{
			var update, identifier;
			for ( identifier in FriendNetwork.appsUpdates )
			{
				if ( hostId == FriendNetwork.appsUpdates[ identifier ].hostId )
				{
					update = FriendNetwork.appsUpdates[ identifier ];
					break;
				}
			}
			if ( update )
			{
				var msg = { updated: true, apps: apps, hostId: hostId, identifier: identifier  };
				FriendNetwork.sendToWindow( update.messageInfo, update.callback, 'appsUpdate', msg );
			}
		}

		function eventSink( type, data, source )
		{
			console.log( 'FriendNetwork - unhandled network event',
			{
				type: type,
				data: data,
				sourceHost: source,
			} );
		}

		function onOpen( networkId ) // self hostId
		{
			FriendNetwork.isConnecting = false;
			FriendNetwork.connected = true;
			FriendNetwork.networkId = networkId;
			if ( callback )
				callback( true );
			console.log( 'FriendNetwork - connection is open', networkId );
		}

		function onEnd( e )
		{
			// network connection has given up trying to reconnect
			// .reconnect() not yet implemented
			console.log( 'FriendNetwork.conn onEnd', e );
			FriendNetwork.connected = false;
			if ( callback )
				callback( false );
		}

	},

	// Low level utilities
	getHostNameFromURL: function( URL )
	{
		var pos = URL.indexOf( '@');
		if ( pos > 0 )
			return URL.substring( pos + 1 );
		return null;
	},
	getAppNameFromURL: function( URL )
	{
		var pos = URL.indexOf( '@');
		if ( pos > 0 )
			return URL.substring( 0, pos );
		return null;
	},

	// Closes the current connection
	close: function( watchDog )
	{
		if ( this.conn )
		{
			if ( this.connected )
			{
				for ( var key in this.sessions )
				{
					if ( this.sessions[ key ] )
					{
						this.sessions[key].close( true );
					}
				}
				this.conn.close();
			}
		}
		if ( watchDog != 'keepWatchDog' )
		{
			if ( this.handleWatchDog )
			{
				clearInterval( this.handleWatchDog );
				this.handleWatchDog = null;
			}
		}
		this.connected = false;
		this.isConnecting = false;
		this.conn = false;
		this.networkId = false;
		this.sessions = [ ];
		this.hostsUpdates = {};
		this.appsUpdates = {};
	},


	// Internal function
	getUserInfos: function( callback, refresh )
	{
		if ( !refresh && this.userInformation )
		{
			callback( this.userInformation );
			return;
		}

		// Load the data from the server
		this.userInformation =
		{
			name: Workspace.loginUsername,
			fullName: Workspace.fullName,
			description: 'No description...',
		}

		// Get Friend Network settings
		var self = this;
		var sm = new Module( 'system' );
		sm.onExecuted = function( e, d )
		{
			var settings;
			if( e == 'ok' )
			{
				if( d )
				{
					try
					{
						d = JSON.parse( d );
						if ( d.friendNetwork != [] )
							settings = d.friendNetwork;
					}
					catch( e )
					{
						d = null;
					}
				}
				if ( settings )
					self.userInformation.description = settings.description;

				// Get the avatar
				sm = new Module( 'system' );
				sm.onExecuted = function( e, d )
				{
					if( e == 'ok' )
					{
						if( d )
						{
							try
							{
								d = JSON.parse( d );
							}
							catch( e )
							{
								d = null;
							}
						}
					}
					if ( d ) 
						self.userInformation.image = d.avatar;

					if ( !self.userInformation.image || self.userInformation.image.length == 0 )
					{
						// Not defined? Load the default avatar
						var image = new Image();
						image.onload = function()
						{
							var canvas = document.createElement( 'canvas' );
							canvas.width = 32;
							canvas.height = 32;
							var context = canvas.getContext( '2d' );
							context.drawImage( image, 0, 0, 32, 32 );
							self.userInformation.image = canvas.toDataURL();
							callback( self.userInformation );
						};
						image.src = 'gfx/defaultAvatar.png';
					}
					else
					{
						callback( self.userInformation );
					}
				}
				sm.execute( 'getsetting', { setting: 'avatar' } );
			}
		}
		sm.execute( 'getsetting', { setting: 'friendNetwork' } );
	},

	// Watchdog for disconnection
	watchDog: function()
	{
		var self = FriendNetwork;
		var connected = Friend.User.ServerIsThere;
		if ( !self.isConnecting && self.connected != connected )
		{
			if ( !connected )
			{
				self.close( 'keepWatchDog' );
			}
			else
			{
				self.init( self.host, self.authType, self.authToken, self.hostMeta, self.callback );
			}
		}
	},

	// Check the availability of FriendNetwork
	isReady: function( msg )
	{
		var messageInfo = this.getMessageInfo( msg );
		var nmsg =
		{
			ready: ( FriendNetwork.conn != null ) && FriendNetwork.connected
		};
		FriendNetwork.sendToWindow( messageInfo, msg.callback, 'isReady', nmsg );
	},

	// Return information about the current user of the machine
	getUserInformation: function( msg )
	{
		var self = this;

		var messageInfo = self.getMessageInfo( msg );
		if ( msg.refresh )
		{
			self.getUserInfos( function( userInformation )
			{
				self.userInformation = userInformation;
				FriendNetwork.sendToWindow( messageInfo, msg.callback, 'getUserInformationResponse', { information: self.userInformation } );
			}, true );
		}
		else
		{
			FriendNetwork.sendToWindow( messageInfo, msg.callback, 'getUserInformationResponse', { information: self.userInformation } );
		}
	},

	// Modifications in the list of hosts?
	subscribeToHostListUpdates: function( msg )
	{
		if ( this.conn )
		{
			var messageInfo = this.getMessageInfo( msg );
			var identifier = 'hostupdates<' + ( new Date().getTime() ) + Math.random() * 1000000 + '>';
			this.hostsUpdates[ identifier ] =
			{
				messageInfo: messageInfo,
				callback: msg.callback
			};
			var nmsg =
			{
				identifier: identifier
			}
			this.sendToWindow( messageInfo, msg.callback, 'subscribeToHostListUpdatesResponse', nmsg );
		}
	},

	// Modifications in the list of hosts?
	unsubscribeFromHostListUpdates: function( msg )
	{
		if ( this.conn )
		{
			var identifier = msg.identifier;
			if ( this.hostsUpdates[ identifier ] )
			{
				this.hostsUpdates[ identifier ] = false;
				this.hostsUpdates = this.cleanKeys( this.hostsUpdates );
			}
		}
	},

	// Modifications in the list of hosts?
	subscribeToHostUpdates: function( msg )
	{
		if ( this.conn )
		{
			this.conn.subscribe( msg.key, function( list )
			{
			} );

			var messageInfo = this.getMessageInfo( msg );
			var identifier = 'appsupdates<' + ( new Date().getTime() ) + Math.random() * 1000000 + '>';
			this.appsUpdates[ identifier ] =
			{
				messageInfo: messageInfo,
				callback: msg.callback,
				hostId: msg.key
			};
			var nmsg =
			{
				identifier: identifier
			}
			this.sendToWindow( messageInfo, msg.callback, 'subscribeToHostUpdates', nmsg );
		}
	},

	// Modifications in the list of hosts?
	unsubscribeFromHostUpdates: function( msg )
	{
		if ( this.conn )
		{
			var identifier = msg.identifier;
			if ( this.appsUpdates[ identifier ] )
			{
				this.conn.unsubscribe( this.appsUpdates[ identifier ].hostId, function( list )
				{
				} );
				this.appsUpdates[ identifier ] = false;
				this.appsUpdates = this.cleanKeys( this.appsUpdates );
			}
		}
	},


	// Closes all Connexions related to one application
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

	// Grabs important information from the origin message
	getMessageInfo: function( msg )
	{
		var info = { extra: msg.extra };
		if ( msg && msg.message && msg.message.applicationId )
		{
			info.view = GetContentWindowByAppMessage( findApplication( msg.message.applicationId ), msg.message );
			info.applicationId = msg.message.applicationId;
			if ( msg.applicationName )
				info.applicationName = msg.applicationName;
			info.viewId = msg.message.viewId;
		}
		return info;
	},

	// Lists the available hosts
	listHosts: function( msg )
	{
		if ( ! this.conn )
			return;
		var messageInfo = this.getMessageInfo( msg );

		this.conn.getHosts( hostsBack );
		function hostsBack( err, response )
		{
			if ( err )
			{
				console.log( 'FriendNetwork.list', err, response ? response : '' );
				FriendNetwork.sendErrorToWindow( messageInfo, msg.callback, 'ERR_LIST_HOSTS', false, false, response );
				return;
			}

			var nmsg =
			{
				hosts: response
			};
			FriendNetwork.sendToWindow( messageInfo, msg.callback, 'list', nmsg );
		}
	},

	// Lists the available hosts
	listHostsToConsole: function()
	{
		if ( !this.conn )
			return;

		this.conn.getHosts( hostsBack );
		function hostsBack( err, response )
		{
			console.log( 'getHosts response: ', err, response );
		}
	},

	// Starts hosting session
	startHosting: function( msg )
	{
		if ( ! this.conn )
			return;
		var messageInfo = this.getMessageInfo( msg );

		for ( var s in this.sessions )
		{
			var session = this.sessions[ s ];
			if ( session.isHost && session.hostName == msg.name )
			{
				console.log( 'FriendNetwork.startHosting', 'ERR_HOST_ALREADY_EXISTS', msg.name );
				this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_HOST_ALREADY_EXISTS', false, false, msg.name );
				return;
			}
		}

		// Creates new FNetHost object
		var key = this.addSession( msg.name );
		this.sessions[ key ] = new FNetHost( key, messageInfo, msg.name, msg.connectionType, msg.password, msg.description, msg.data, msg.callback );
	},
	// Dispose hosting session (from its name)
	disposeHosting: function( msg )
	{
		if ( ! this.conn )
			return;

		if ( this.sessions[ msg.key ] && this.sessions[ msg.key ].isHost )
		{
			this.sessions[ msg.key ].close();
			this.sessions = this.cleanKeys( this.sessions );
		}
		else
		{
			console.log( 'FriendNetwork.disposeHosting', 'ERR_HOST_NOT_FOUND' );
			var messageInfo = this.getMessageInfo( msg );
			this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_HOST_NOT_FOUND', msg.key, msg.key, msg.name );
		}
	},

	// Dispose hosting session (from its name)
	concealHost: function( msg )
	{
		if ( ! this.conn )
			return;

		if ( this.sessions[ msg.key ] && this.sessions[ msg.key ].isHost )
		{
			this.sessions[ msg.key ].conceal();
		}
		else
		{
			console.log( 'FriendNetwork.disposeHosting', 'ERR_HOST_NOT_FOUND' );
			var messageInfo = this.getMessageInfo( msg );
			this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_HOST_NOT_FOUND', msg.key, msg.key, msg.name );
		}
	},

	// Updates the password of a host
	updateHostPassword: function( msg )
	{
		if ( ! this.conn )
			return;

		if ( this.sessions[ msg.key ] && this.sessions[ msg.key ].isHost )
		{
			this.sessions[ msg.key ].updatePassword( msg.password );
		}
		else
		{
			console.log( 'FriendNetwork.disposeHosting', 'ERR_HOST_NOT_FOUND' );
			var messageInfo = this.getMessageInfo( msg );
			this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_HOST_NOT_FOUND', msg.key, msg.key, msg.name );
		}
	},

	// Connect to distant host
	connectToHost: function( msg )
	{
		if ( ! this.conn )
			return;
		var messageInfo = this.getMessageInfo( msg );

		var url = msg.url;
		var userName;
		var hostName;
		var appName;
		var path = '';
		var name;

		// Get server, user and host names
		var start = url.indexOf( '@' );
		if ( start < 0 )
		{
			// Only a host name
			hostName = url;
		}
		else
		{
			hostName = url.substring( 0, start );
			userName = url.substring( start + 1 );
		}

		// Do the connection!
		var hostType = msg.hostType;

		this.conn.getHosts( hostsBack );

		// Return of the getHost function
		function hostsBack( err, response )
		{
			var found = false;
			if ( ! err )
			{
				for ( var a = 0; a < response.length; a ++ )
				{
					if ( userName && userName != response[a].name )
						continue;
					var apps = response[a].apps;
					if ( apps )
					{
						for ( var b = 0; b < apps.length; b ++ )
						{
							found = true;
							var foundHost = apps[ b ];
							if ( hostType )
							{
								found = false;
								if ( hostType == foundHost.type );
									found = true;
							}
							if ( found )
							{
								if ( foundHost.name.indexOf( hostName ) == 0 )
								{
									found = true;
									var key = FriendNetwork.addSession( hostName );
									FriendNetwork.sessions[ key ] = new FNetClient
									(
										key,
										messageInfo,
										response[a].hostId,
										foundHost.id,
										foundHost.name + '@' + response[ a ].name,
										msg.p2p,
										msg.encryptMessages,
										msg.connectionData,
										msg.callback
									);
									break;
								}
							}
						}
					}
				}
			}
			else
			{
				name = hostName;
				if ( userName )
					name += '@' + userName;
				console.log( 'FriendNetwork.connectToHost.hostBack', err, name );
				FriendNetwork.sendErrorToWindow( messageInfo, msg.callback, err, false, false, name );
				return;
			}
			if ( !found )
			{
				name = hostName;
				if ( userName )
					name += '@' + userName;
				console.log( 'FriendNetwork.connectToHost', 'ERR_HOST_NOT_FOUND', name );
				FriendNetwork.sendErrorToWindow( messageInfo, msg.callback, 'ERR_HOST_NOT_FOUND', false, false, name );
			}
		}
	},

	disconnectFromHost: function( msg )
	{
		if ( ! this.conn )
			return;

		var session = FriendNetwork.sessions[ msg.key ];
		if ( session && ( session.isClient || session.isHostClient ) )
		{
			session.close();
			this.sessions = this.cleanKeys( this.sessions );
		}
		else
		{
			console.log( 'FriendNetwork.disconnectFromHost', 'ERR_CLIENT_NOT_FOUND', msg.name );
			var messageInfo = this.getMessageInfo( msg );
			this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_CLIENT_NOT_FOUND', msg.key );
		}
	},

	disconnectFromHostByName: function( msg )
	{
		if ( ! this.conn )
			return;

		for ( var s in FriendNetwork.sessions )
		{
			var session = FriendNetwork.sessions[ s ];
			if ( ( session.isClient || session.isHostClient ) && session.distantName == msg.hostName )
			{
				session.close();
				this.sessions = this.cleanKeys( this.sessions );
				return;
			}
		}
		var messageInfo = this.getMessageInfo( msg );
		this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_CLIENT_NOT_FOUND', msg.key );
	},

	// Send the credentials to host
	sendCredentials: function( msg )
	{
		if ( ! this.conn )
			return;

		var session = this.sessions[ msg.key ];
		if ( session && session.isClient )
		{
			session.sendCredentials( msg.password, msg.encrypted );
		}
		else
		{
			console.log( 'FriendNetwork.sendCredentials.send', 'ERR_HOST_NOT_FOUND' );
			var messageInfo = this.getMessageInfo( msg );
			this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_HOST_NOT_FOUND', msg.key );
		}
	},

	// Send data to distant host (from the key)
	send: function( msg )
	{
		if ( ! this.conn )
			return;

		var sent = false;
		var session = this.sessions[ msg.key ];
		if ( session )
		{
			if ( session.isClient || session.isHostClient )
			{
				sent = true;
				session.send( msg.data );
			}
		}
		if ( ! sent )
		{
			console.log( 'FriendNetwork.send - ERR_SESSION_NOT_FOUND',
			{
				msg: msg,
				sessions: this.sessions,
			} );
			var messageInfo = this.getMessageInfo( msg );
			this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_SESSION_NOT_FOUND', msg.key );
		}
	},

	// Send data to distant host (from the key)
	sendFile: function( msg )
	{
		if ( ! this.conn )
			return;

		var sent = false;
		var session = this.sessions[ msg.key ];
		if ( session )
		{
			if ( session.isClient || session.isHostClient )
			{
				sent = true;

				// Find a unique identifier
				var transferId = this.addKey( FriendNetwork.sending, Workspace.loginUsername );

				// Encode data in base64?
				var file = msg.file;

				// How many chunks?
				var numberOfChunks = Math.floor( file.length / FriendNetwork.CHUNKSIZE );
				if ( numberOfChunks * FriendNetwork.CHUNKSIZE < file.length )
					numberOfChunks++;

				// Send header to other side
				var message =
				{
					subCommand: 'fileHeader',
					transferId: transferId,
					infos: msg.infos,
					size: file.length,
					numberOfChunks: numberOfChunks
				};
				session.send( message );

				// Send all the chunks
				var position = 0;
				var number = 0;
				while( true )
				{
					var size = FriendNetwork.CHUNKSIZE;
					if ( position + size > file.length )
						size = file.length - position;
					if ( size > 0 )
					{
						var chunk = file.substr( position, size );
						var message =
						{
							subCommand: 'fileChunk',
							transferId: transferId,
							position: position,
							number: number,
							chunk: chunk
						};
						session.send( message );
					}
					position += size;
					number++;

					// This file completed?
					if ( number >= numberOfChunks )
						break;
				}

				// Removes the identifier
				this.sending[ transferId ] = false;
				this.sending = this.cleanKeys( this.sending );
			}
		}
		if ( ! sent )
		{
			console.log( 'FriendNetwork.send - ERR_SESSION_NOT_FOUND',
			{
				msg: msg,
				sessions: this.sessions,
			} );
			var messageInfo = this.getMessageInfo( msg );
			this.sendErrorToWindow( messageInfo, msg.callback, 'ERR_SESSION_NOT_FOUND', msg.key );
		}
	},
	receiveFileHeader: function( data )
	{
		// Creates entry in receive table
		var chunks = [];
		for ( var c = 0; c < data.numberOfChunks; c++ )
			chunks.push( '' );
		FriendNetwork.receiving[ data.transferId ] =
		{
			numberOfChunks: data.numberOfChunks,
			size: data.size,
			infos: data.infos,
			chunks: chunks,
			count: 0
		}
	},
	receiveFileChunk: function( data, callback )
	{
		var transferId = data.transferId;
		var receiving = FriendNetwork.receiving[ transferId ];
		if ( receiving )
		{
			receiving.chunks[ data.number ] = data.chunk;
			receiving.count++;

			// File received entierely?
			if ( receiving.count == receiving.numberOfChunks )
			{
				// Clean receiving array
				FriendNetwork.receiving[ transferId ] = false;
				FriendNetwork.receiving = FriendNetwork.cleanKeys( FriendNetwork.receiving );

				// Reconstitute file
				var file = '';
				for ( var chunk = 0; chunk < receiving.chunks.length; chunk++ )
					file += receiving.chunks[ chunk ];

				receiving.infos.percentLoaded = 100;
				callback( 'completed', receiving.infos, file );
			}
			else
			{
				receiving.infos.percentLoaded = Math.floor( ( receiving.count / receiving.numberOfChunks ) * 100 );
				callback( 'loading', receiving.infos, false );
			}
		}
	},
	// Send error message to view
	sendErrorToWindow: function( messageInfo, callback, error, key, hostKey, response )
	{
		var message =
		{
			command: 'friendnetwork',
			subCommand: 'error',
			error: error,
			response: response,
			extra: messageInfo.extra
		};
		if ( key )
			message.key = key;
		if ( hostKey )
			message.hostKey = hostKey;
		if ( typeof callback == 'function' )
		{
			callback( message );
			return;
		}
		if ( messageInfo && messageInfo.view )
		{
			if ( typeof callback == 'string' )
			{
				message.type = 'callback';
				message.callback = callback;
			}
			message.applicationId = messageInfo.applicationId;
			message.viewId = messageInfo.viewId;
			messageInfo.view.postMessage( JSON.stringify( message ), '*' );
		}
	},
	// Send message to view
	sendToWindow: function( messageInfo, callback, subCommand, message )
	{
		message.command = 'friendnetwork';
		message.subCommand = subCommand;
		message.extra = messageInfo.extra;
		if ( typeof callback == 'function' )
		{
			callback( message );
			return;
		}
		if ( messageInfo && messageInfo.view )
		{
			if ( typeof callback == 'string' )
			{
				message.type = 'callback';
				message.callback = callback;
			}
			message.applicationId = messageInfo.applicationId;
			message.viewId = messageInfo.viewId;
			messageInfo.view.postMessage( JSON.stringify( message ), '*' );
		}
	},

	// Returns a unique key
	addKey: function( keys, id )
	{
		var key = id + '-' + Math.random() * 999999;
		while( typeof( keys[ key ] ) != 'undefined' )
			key = id + '-' + Math.random() * 999999;
		keys[ key ] = true;
		return key;
	},

	// Cleans a key array
	cleanKeys: function( keys )
	{
		var out = [ ];
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
		var result =
		{
			connected: false,
			hosts: [ ],
			clients: [ ]
		};
		if ( this.conn )
		{
			result.connected = true;

			// Gather all the hosts
			for ( var key in this.sessions )
			{
				var session = this.sessions[key];
				if ( session.isHost )
				{
					result.hosts.push(
					{
						key: session.key,
						name: session.name,
						applicationId: session.applicationId,
						applicationName: session.applicationName,
						hosting: [ ]
					} );
				}
			}

			// Gather all the sessions hosted by each host
			for ( var key in this.sessions )
			{
				var session = this.sessions[key];
				if ( session.isHostClient )
				{
					for ( var a = 0; a < result.hosts.length; a ++ )
					{
						if ( result.hosts[a].key == session.hostKey )
						{
							result.hosts[a].hosting.push(
							{
								key: session.key,
								distantName: session.distantName,
								distantAppName: session.distantAppName
							} );
						}
					}
				}
			}

			// Gather all the clients
			for ( var key in this.sessions )
			{
				var session = this.sessions[key];
				if ( session.isClient )
				{
					result.clients.push(
					{
						key: session.key,
						hostName: session.hostName,
						applicationId: session.applicationId,
						distantAppName: session.distantAppName
					} );
				}
			}
		}

		// Send results to view
		var messageInfo = this.getMessageInfo( msg );
		var nmsg =
		{
			connected: result.connected,
			hosts: result.hosts,
			clients: result.clients
		};
		FriendNetwork.sendToWindow( messageInfo, callback, 'status', nmsg );
	}
};
FriendNetwork.TRANSFERMAX = 2;				// Number of files to send at the same time
FriendNetwork.CHUNKSIZE = 1024 * 8;			    // Ask Espen how low it should be!
FriendNetwork.TIMEOUT = 1000 * 1000;		// Timeout

// FriendNetwork host object
FNetHost = function( key, messageInfo, name, type, password, description, data, callback )
{
	var self = this;
	self.key = key;
	self.messageInfo = messageInfo;
	self.applicationId = messageInfo.applicationId;
	self.applicationName = messageInfo.applicationName;
	self.name = name + '@' + FriendNetwork.hostName;
	self.hostName = name;
	self.description = description;
	self.isHost = true;
	self.callback = callback;
	self.hostClients = [ ];
	self.data = data;
	if ( typeof password == 'string' )
		self.password = 'HASHED' + Sha256.hash( password );
	else
		self.password = password;

	// Initialize the node
	self.conn = new EventNode( self.key, FriendNetwork.conn, eventSink );
	self.conn.send = function()
	{
		console.log( 'FnetHost.conn.send - dont use this. \
			Use the conn.send in the session for the specific remote app \
			( some instance of FNetHostClient )', arguments );
	};
	FriendNetwork.conn.on( self.key, handleEvents );

	// Initialization of other parameters
	if ( typeof description != 'string' )
		description = '';

	// Broadcast on network
	var app =
	{
		id          : self.key,
		type        : type,
		name        : name,
		description : description,
		info        : data
	};
	FriendNetwork.conn.expose( app, exposeBack );

	function exposeBack( err, response )
	{
		if ( err )
		{
			console.log( 'FdNethost exposeBack', err, response ? response : '' );
			FriendNetwork.sendErrorToWindow( self.messageInfo, self.callback, err, self.key, self.key, response );
			FriendNetwork.conn.release( self.key );
			FriendNetwork.sessions[ self.key ] = false;
			FriendNetwork.sessions = FriendNetwork.cleanKeys( FriendNetwork.sessions );
			return;
		}

		var ok = false;
		if ( ! err )
		{
			for ( var a = 0; a < response.length; a ++ )
			{
				if ( response[a].id == self.key )
				{
					ok = true;
					var nmsg =
					{
						name: self.name,
						hostKey: self.key
					};
					FriendNetwork.sendToWindow( self.messageInfo, self.callback, 'host', nmsg );
					break;
				}
			}
		}
		if ( ! ok )
		{
			console.log( 'FNethost exposeBack', err, response ? response : '' );
			FriendNetwork.sendErrorToWindow( self.messageInfo, self.callback, 'ERR_HOSTING_FAILED', self.key, self.key, response );
			FriendNetwork.conn.release( self.key );
			FriendNetwork.sessions[ self.key ] = false;
			FriendNetwork.sessions = FriendNetwork.cleanKeys( FriendNetwork.sessions );
		}
	}

	function handleEvents( data )
	{
		if ( data.command == 'connect' )
		{
			var k = FriendNetwork.addKey( FriendNetwork.sessions, self.key );
			self.hostClients[ k ] = new FNetHostClient( k, self, data );
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

	function eventSink()
	{
		console.log( 'FNetHost - eventsink', arguments );
	}

	// Called in case of peer-to-peer connexion
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
		function p2pOnEnd( e )
		{
			console.log( 'p2p ended' );
		}
	}
};
FNetHost.prototype.removeHClient = function( key )
{
	if ( FriendNetwork.sessions[ key ] )
	{
		FriendNetwork.sessions[ key ] = false;
		FriendNetwork.sessions = FriendNetwork.cleanKeys( FriendNetwork.sessions );
		this.hostClients[ key ] = false;
		this.hostClients = FriendNetwork.cleanKeys( this.hostClients );
	}
};

FNetHost.prototype.updatePassword = function( password )
{
	if ( typeof password == 'string' )
	{
		this.password = 'HASHED' + Sha256.hash( password );
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
			FriendNetwork.sessions = FriendNetwork.cleanKeys( FriendNetwork.sessions );
			self.hostClients = FriendNetwork.cleanKeys( self.hostClients );
		}
	}
};
FNetHost.prototype.conceal = function()
{
	FriendNetwork.conn.conceal( self.key, function( err, response )
	{
	} );
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
	FriendNetwork.conn.conceal( self.key, function( err, response )
	{
		if ( err )
		{
			console.log( 'FriendNetwork.close conceal', err, response ? response : '' );
			FriendNetwork.sendErrorToWindow( self.messageInfo, self.callback, err, self.key, self.key, response );
			return;
		}

		// Close all connected clients
		for ( var key in self.hostClients )
		{
			self.hostClients[ key ].close();
		}
		self.hostClients = FriendNetwork.cleanKeys( self.hostClients );
		FriendNetwork.conn.release( self.key );
		FriendNetwork.sessions[ self.key ] = false;
		FriendNetwork.sessions = FriendNetwork.cleanKeys( FriendNetwork.sessions );

		// Send message to host
		var msg =
		{
			hostKey: self.key,
			name: self.name
		};
		FriendNetwork.sendToWindow( self.messageInfo, self.callback, 'disposed', msg );
	} );
};

// A client of the host
function FNetHostClient( key, host, data )
{
	console.log( 'FNetHostClient', self );
	var self = this;
	self.key = key;
	self.host = host;
	self.hostKey = host.key;
	self.applicationId = host.applicationId;
	self.distantId = data.id;
	self.distantKey = data.key;
	self.distantName = data.name;
	self.distantAppName = data.applicationName;
	self.isHostClient = true;
	self.events = [ ];
	self.events[ 'credentials' ] = credentials;
	self.events[ 'clientDisconnected' ] = disconnect;
	self.events[ 'message' ] = message;
	self.fileTransfers = [];
	self.fileTransfersCount = 0;
	self.fileTransfersOn = false;
	self.fileTransferInfos = false;
	self.fileTransfersAccepted = 'none';
	self.distantPublicKey = false;
	self.encryptMessages = false;

	self.conn = new EventNode
	(
		self.key,
		FriendNetwork.conn,
		eventSink
	);
	function eventSink()
	{
		console.log( 'FnetHostClient.conn.eventSink', arguments );
	}

	self.credentialCount = 4;
	FriendNetwork.conn.send( self.distantId,
	{
		type: self.distantKey,
		data:
		{
			name: FriendNetwork.hostName,
			hostName: self.host.name,
			applicationName: self.host.applicationName,
			id: FriendNetwork.networkId,
			key: self.key,
			command: 'getCredentials',
			publicKey: Workspace.encryption.keys.client.publickey
		}
	}, function( err, response )
	{
		if ( err )
		{
			console.log( 'FNetClient constructor', err, response ? response : '' );
			FriendNetwork.sendErrorToWindow( self.host.messageInfo, self.host.callback, err, self.key, self.hostKey, response );
			FriendNetwork.removeSession( self.key );
		}
	} );

	self.handleEvents = function( data )
	{
		console.log( 'handleEvents', data );
		if ( data.command )
		{
			if ( self.events[data.command] )
				self.events[ data.command ].apply( self, [ data ] );
			else
				console.log( 'FNetClient eventSink', data );
		}
	};
	function credentials( data )
	{
		var good = false;

		// Store connection data
		self.connectionData = data.connectionData;

		// Get the password
		var clientPassword;
		if ( data.encrypted )
			clientPassword = Workspace.encryption.decrypt( data.data, Workspace.encryption.keys.client.privatekey );
		else
			clientPassword = data.data;

		// Abort?
		var abort = 'HASHED' + Sha256.hash( '<---aborted--->' );
		if ( clientPassword == abort )
		{
			FriendNetwork.conn.send( self.distantId,
			{
				type: self.distantKey,
				data:
				{
					command: 'connectionAborted',
					hostKey: self.hostKey,
					key: self.key
				}
			}, function( err, response )
			{
			} );
			self.host.removeHClient( self.key );
			return;
		}

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
				FriendNetwork.conn.send( self.distantId,
				{
					type: self.distantKey,
					data: {
						command: 'failedCredentials',
						hostKey: self.hostKey,
						key: self.key
					}
				}, function( err, response )
				{
				} );
				self.host.removeHClient( self.key );
			}
			else
			{
				// Wrong credentials
				FriendNetwork.conn.send( self.distantId,
				{
					type: self.distantKey,
					data: {
						command: 'wrongCredentials',
						hostKey: self.hostKey,
						key: self.key
					}
				}, function( err, response )
				{
					console.log( 'FNetHost client', err, response ? response : '' );
				} );
			}
		}
		else
		{
			// Connected: store distant publicKey
			if ( data.publicKey )
			{
				self.encryptMessages = true;
				self.distantPublicKey = data.publicKey;
			}

			// Indicates to other side
			FriendNetwork.conn.send( self.distantId, {
				type: self.distantKey,
				data: {
					command: 'connected',
					hostKey: self.hostKey,
					key: self.key,
					sessionPassword: self.sessionPassword
				}
			}, function( err, response )
			{
				console.log( 'FNetHost client', err, response ? response : '' );
			} );

			// Send message to view
			var nmsg = {
				hostKey: self.hostKey,
				key: self.key,
				name: self.distantName,
				sessionPassword: self.sessionPassword,
				p2p: false,
				connectionData: self.connectionData
			};
			FriendNetwork.sendToWindow( self.host.messageInfo, self.host.callback, 'clientConnected', nmsg );
		}
	}
	function disconnect( data )
	{
		// Send message to view
		var nmsg = {
			hostKey: self.hostKey,
			key: self.key,
			name: self.distantName
		};
		FriendNetwork.sendToWindow( self.host.messageInfo, self.host.callback, 'clientDisconnected', nmsg );

		// Remove session
		self.host.removeHClient( self.key );
	}
	function message( data )
	{
		var self = this;

		// Encrypted message?
		if ( data.encrypted )
		{
			// Decript JSON string
			var json = Workspace.encryption.decrypt( data.data, Workspace.encryption.keys.client.privatekey );

			// Converts to object
			var result;
			try
			{
				result = JSON.parse( json );
			}
			catch( e )
			{
				console.log( 'FNetHostClient: bad JSON string in encrypted message.', json );
				return;
			}
			data.data = result;
		}

		if ( data.data.subCommand == 'fileHeader' )
			FriendNetwork.receiveFileHeader( data.data );
		else if ( data.data.subCommand == 'fileChunk' )
		{
			FriendNetwork.receiveFileChunk( data.data, function( response, infos, result )
			{
				// Simple message : Send to view
				var nmsg =
				{
					hostKey: self.hostKey,
					key: self.key,
					name: self.distantName,
					infos: infos,
					file: result
				};
				if ( response == 'completed' )
					FriendNetwork.sendToWindow( self.host.messageInfo, self.host.callback, 'fileFromClient', nmsg );
				else
					FriendNetwork.sendToWindow( self.host.messageInfo, self.host.callback, 'fileDownloading', nmsg );
			} );
		}
		else
		{
			// Simple message : Send to view
			var nmsg =
			{
				hostKey: self.hostKey,
				key: self.key,
				name: self.distantName,
				data: data.data
			};
			FriendNetwork.sendToWindow( self.host.messageInfo, self.host.callback, 'messageFromClient', nmsg );
		}
	}
	function file( data )
	{
		FriendNetwork.receiveFile( self, data, self.host.messageInfo );
	}
};
FNetHostClient.prototype.close = function()
{
	var self = this;
	var nmsg = {
		type: self.distantKey,
		data: {
			command: 'hostDisconnected',
			hostKey: self.hostKey,
			key: self.key,
			name: self.host.name
		}
	};
	FriendNetwork.conn.send( self.distantId, nmsg, function( err, response )
	{
	} );
};
FNetHostClient.prototype.send = function( data )
{
	var self = this;

	// Encrypt the message?
	var encrypted = false;
	if ( self.encryptMessages )
	{
		encrypted = true;

		// Converts data to JSON
		var json;
		try
		{
			json = JSON.stringify( data );
		}
		catch( e )
		{
			console.log( 'FnetHostP2PClient:send, error while encrypting.' );
			return;
		}
		data = Workspace.encryption.encrypt( json, self.distantPublicKey );
	}

	var nmsg =
	{
		type: self.distantKey,
		data:
		{
			command: 'message',
			hostKey: self.hostKey,
			key: self.key,
			name: self.host.name,
			data: data,
			encrypted: encrypted
		}
	};
	FriendNetwork.conn.send( self.distantId, nmsg, function( err, response )
	{
		if ( err )
		{
			console.log( 'FriendNetwork.send', err, response ? response : '' );
			FriendNetwork.sendErrorToWindow( self.host.messageInfo, self.host.callback, err, self.key, self.hostKey, response );
		}
	} );
};
// A client of the host
function FNetHostP2PClient( netKey, req, onend, host, key )
{
	var self = this;
	console.log( 'FNetHostP2PClient', self );
	var data = req.data;
	self.key = key;
	self.host = host;
	self.hostKey = host.key;
	self.applicationId = host.applicationId;
	self.remoteId = data.sourceHost;
	self.remoteKey = data.sourceApp;
	self.isHostClient = true;
	self.events = { };
	self.events[ 'credentials' ] = credentials;
	self.events[ 'clientDisconnected' ] = disconnect;
	self.events[ 'message' ] = message;
	self.fileTransfers = [];
	self.fileTransfersCount = 0;
	self.fileTransfersOn = false;
	self.fileTransferInfos = false;
	self.fileTransfersAccepted = 'none';
	self.distantApplicationName = 'TODO!';
	self.credentialCount = 4;
	self.encryptMessages = false;
	self.distantPublicKey = false;

	self.conn = new EventNode
	(
		netKey,
		FriendNetwork.conn
	);

	// Setup event node
	self.conn.send = sendToRemote;
	function sendToRemote( event )
	{
		var toApp =
		{
			type: self.remoteKey,
			data: event
		};
		//console.log( 'sendToRemote', toApp );
		FriendNetwork.conn.send( self.remoteId, toApp );
	}
	var replyId = req.type;
	var reply =
	{
		accept: true,
		opts:
		{
			infos: 'hepp!'
		}
	}
	FriendNetwork.conn.request
	(
		replyId,
		reply,
		replyBack
	);

	function replyBack( err, res )
	{
		if ( res )
		{
			console.log( 'connect replyBack',
			{
				e: err,
				r: res
			} );
			self.peer = new Peer
			(
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
					name: FriendNetwork.hostName,
					hostName: self.host.name,
					applicationName: self.host.applicationName,
					id: FriendNetwork.networkId,
					key: self.key,
					command: 'getCredentials',
					publicKey: Workspace.encryption.keys.client.publickey
				}
			};
			self.peer.send( msg );
		}

		function peerEventSink()
		{
			console.log( 'FNetHostClient peer eventsink', arguments );
		}
		function onPeerEnd( e )
		{
			console.log( 'FNetHostClient onPeerEnd', e );
		}
	}
	function handleEvents( data )
	{
		if ( data.command )
		{
			if ( self.events[ data.command ] )
				self.events[ data.command ].apply( self, [ data ] );
			else
				console.log( 'FNetHostP2PClient eventSink', data );
		}
	}
	function credentials( data )
	{
		var good = false;
		self.distantName = data.name;
		self.distantAppName = data.applicationName;

		// Get the connection data
		self.connectionData = data.connectionData;

		// Get the password
		var clientPassword;
		if ( data.encrypted )
			clientPassword = Workspace.encryption.decrypt( data.data, Workspace.encryption.keys.client.privatekey );
		else
			clientPassword = data.data;

		// Abort?
		var abort = 'HASHED' + Sha256.hash( '<---aborted--->' );
		if ( clientPassword == abort )
		{
			var msg =
			{
				type: 'event',
				data:
				{
					command: 'connectionAborted',
					hostKey: self.hostKey,
					key: self.key
				}
			};
			self.peer.send( msg );
			self.host.removeHClient( self.key );
			return;
		}

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
			self.credentialCount --;
			if ( self.credentialCount == 0 )
			{
				var msg =
				{
					type: 'event',
					data:
					{
						command: 'failedCredentials',
						hostKey: self.hostKey,
						key: self.key
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
						key: self.key,
						count: self.credentialCount
					}
				};
				self.peer.send( msg );
			}
		}
		else
		{
			// Connected: store the client key
			if ( data.publicKey )
			{
				self.encryptMessages = true;
				self.distantPublicKey = data.publicKey;
			}

			// Send message to other side
			var msg =
			{
				type: 'event',
				data:
				{
					command: 'connected',
					hostKey: self.host.key,
					key: self.key,
					sessionPassword: self.sessionPassword
				}
			};
			self.peer.send( msg );

			// Send message to view
			var nmsg =
			{
				hostKey: self.hostKey,
				key: self.key,
				name: self.distantName,
				sessionPassword: self.sessionPassword,
				p2p: true,
				connectionData: self.connectionData
			};
			FriendNetwork.sendToWindow( self.host.messageInfo, self.host.callback, 'clientConnected', nmsg );
		}
	}
	function disconnect( data )
	{
		// Send message to view
		var nmsg =
		{
			hostKey: self.hostKey,
			key: self.key,
			name: self.distantName
		};
		FriendNetwork.sendToWindow( self.host.messageInfo, self.host.callback, 'clientDisconnected', nmsg );

		// Remove session
		FriendNetwork.removeSession( self.key );
	}
	function message( data )
	{
		// Encrypted message?
		if ( data.encrypted )
		{
			// Decript JSON string
			var json = Workspace.encryption.decrypt( data.data, Workspace.encryption.keys.client.privatekey );

			// Converts to object
			var result;
			try
			{
				result = JSON.parse( json );
			}
			catch( e )
			{
				console.log( 'FriendNetworkClient: bad JSON string in encrypted message.', json );
				return;
			}
			data.data = result;
		}

		if ( data.data.subCommand == 'fileHeader' )
			FriendNetwork.receiveFileHeader( data.data );
		else if ( data.data.subCommand == 'fileChunk' )
		{
			FriendNetwork.receiveFileChunk( data.data, function( response, infos, result )
			{
				var nmsg =
				{
					hostKey: self.hostKey,
					key: self.key,
					name: self.distantName,
					infos: infos,
					file: result
				};
				if ( response == 'completed' )
					FriendNetwork.sendToWindow( self.host.messageInfo, self.host.callback, 'fileFromClient', nmsg );
				else
					FriendNetwork.sendToWindow( self.host.messageInfo, self.host.callback, 'fileDownloading', nmsg );
			} );
		}
		else
		{
			// Simple message : Send to view
			var nmsg =
			{
				hostKey: self.hostKey,
				key: self.key,
				name: self.distantName,
				data: data.data
			};
			FriendNetwork.sendToWindow( self.host.messageInfo, self.host.callback, 'messageFromClient', nmsg );
		}
	}
	function file( data )
	{
		FriendNetwork.receiveFile( self, data, self.host.messageInfo );
	}
}
FNetHostP2PClient.prototype.close = function()
{
	var self = this;
	var msg = {
		type: 'event',
		data: {
			command: 'hostDisconnected',
			hostKey: self.hostKey,
			key: self.key,
			name: self.host.name
		}
	};
	self.peer.send( msg );
};
FNetHostP2PClient.prototype.send = function( data )
{
	var self = this;

	// Encrypt the message?
	var encrypted = false;
	if ( self.encryptMessages )
	{
		encrypted = true;

		// Converts data to JSON
		var json;
		try
		{
			json = JSON.stringify( data );
		}
		catch( e )
		{
			console.log( 'FnetHostP2PClient:send, error while encrypting.' );
			return;
		}
		data = Workspace.encryption.encrypt( json, self.distantPublicKey );
	}

	var msg =
	{
		type: 'event',
		data:
		{
			command: 'message',
			hostKey: self.hostKey,
			key: self.key,
			name: self.host.name,
			data: data,
			encrypted: encrypted
		}
	};
	self.peer.send( msg );
};

function FNetClient( key, messageInfo, hostId, hostKey, hostName, p2p, encrypt, connectionData, callback )
{
	console.log( 'FNetClient', key );
	var self = this;
	self.name = FriendNetwork.hostName;
	self.key = key;
	self.messageInfo = messageInfo;
	self.applicationId = messageInfo.applicationId;
	self.applicationName = messageInfo.applicationName;
	self.distantId = hostId;
	self.hostKey = hostKey;
	self.hostName = hostName;
	self.distantName = hostName;
	self.callback = callback;
	self.p2pEnabled = p2p;
	self.isClient = true;
	self.connectionData = connectionData ? connectionData : '';
	self.conn = null;
	self.events = [ ];
	self.events[ 'getCredentials' ] = getCredentials;
	self.events[ 'wrongCredentials' ] = wrongCredentials;
	self.events[ 'failedCredentials' ] = failedCredentials;
	self.events[ 'connectionAborted' ] = connectionAborted;
	self.events[ 'connected' ] = connected;
	self.events[ 'hostDisconnected' ] = hostDisconnected;
	self.events[ 'message' ] = message;
	self.events[ 'ping' ] = ping;
	self.timeoutCount = 10;
	self.fileTransfers = [];
	self.fileTransfersCount = 0;
	self.fileTransfersAccepted = 'none';
	self.fileTransfersOn = false;
	self.fileTransferInfos = false;
	self.encryptMessages = false;
	if ( encrypt && Workspace.encryption )
		self.encryptMessages = true;

	// Using this as appConn for peer connection
	self.conn = new EventNode(
	self.key,
	FriendNetwork.conn,
	eventSink
	);

	// Redefine EventNode.send
	self.conn.send = sendToHost;
	function sendToHost( event )
	{
		var toApp = {
			type: self.hostKey,
			data: event,
		};
		console.log( 'sendToHost', toApp );
		FriendNetwork.conn.send( self.distantId, toApp );
	}
	function eventSink()
	{
		console.log( 'FNetClient - eventsink', arguments );
	}

	if ( ! self.p2pEnabled )
	{
		FriendNetwork.conn.on( key, handleEvents );
		self.conn.send(
		{
			command: 'connect',
			id: FriendNetwork.networkId,
			key: self.key,
			name: self.name,
			applicationName: self.applicationName
		} );
	}
	else
	{
		console.log( 'FNetClient.self', self );
		FriendNetwork.conn.connect(
		self.distantId,
		self.hostKey,
		{ },
		self.key,
		connectBack
		);

		function connectBack( err, res )
		{
			if ( res )
			{
				console.log( 'FNetClient.connectBack', {
					e: err,
					r: res
				} );
				self.peer = new Peer(
				res,
				self.conn,
				peerEventSink,
				onPeerEnd
				);
				self.p2p = true;
				self.peer.on( 'event', handleEvents );
			}

			function peerEventSink()
			{
				console.log( 'FNetClient peerEventsink', arguments );
			}
			function onPeerEnd( e )
			{
				console.log( 'FNetClient peer ended' );
			}
		}
	}

	function handleEvents( data )
	{
		console.log( 'FNetClient.handleEvents', data );
		if ( self.events[ data.command ] )
			self.events[ data.command ].apply( self, [ data ] );
		else
			console.log( 'FNetClient command not found', data );
	}
	function getCredentials( data )
	{
		self.distantKey = data.key;
		self.distantName = data.name;
		self.distantAppName = data.applicationName;
		self.hostPublicKey = data.publicKey;
		self.sessionPassword = data.sessionPassword;

		var nmsg = {
			key: self.key,
			name: self.distantName,
			hostName: self.hostName,
			sessionPassword: self.sessionPassword
		};
		FriendNetwork.sendToWindow( self.messageInfo, self.callback, 'getCredentials', nmsg );
	}
	function wrongCredentials( data )
	{
		FriendNetwork.sendErrorToWindow( self.messageInfo, self.callback, 'ERR_WRONG_CREDENTIALS', self.key, self.hostKey, self.distantName );
	}
	function failedCredentials( data )
	{
		FriendNetwork.sendErrorToWindow( self.messageInfo, self.callback, 'ERR_FAILED_CREDENTIALS', self.key, self.hostKey, self.distantName );
		if ( FriendNetwork.conn )
			FriendNetwork.conn.release( self.key );
		FriendNetwork.sessions[ self.key ] = false;
		FriendNetwork.sessions = FriendNetwork.cleanKeys( FriendNetwork.sessions );
	}
	function connectionAborted( data )
	{
		FriendNetwork.sendErrorToWindow( self.messageInfo, self.callback, 'ERR_CONNECTION_ABORTED', self.key, self.hostKey, self.distantName );
		if ( FriendNetwork.conn )
			FriendNetwork.conn.release( self.key );
		FriendNetwork.sessions[ self.key ] = false;
		FriendNetwork.sessions = FriendNetwork.cleanKeys( FriendNetwork.sessions );
	}
	function connected( data )
	{
		var nmsg = {
			key: self.key,
			hostName: self.hostName,
			name: self.distantName,
			sessionPassword: self.sessionPassword
		};
		FriendNetwork.sendToWindow( self.messageInfo, self.callback, 'connected', nmsg );

		console.log( 'FNetClient.connected', data );
	}
	function hostDisconnected( data )
	{
		var nmsg =
		{
			hostKey: self.hostKey,
			key: self.key,
			name: self.hostName
		};
		FriendNetwork.sendToWindow( self.messageInfo, self.callback, 'hostDisconnected', nmsg );
		if ( FriendNetwork.conn )
			FriendNetwork.conn.release( self.key );
		FriendNetwork.removeSession( self.key );
	}
	function ping( data )
	{
		var self = this;
		self.timeoutCount = 10;
		var msg =
		{
			command: 'pong',
			key: self.distantKey
		};
		self.conn.send( msg );
	}
	function message( data )
	{
		// Encrypted message?
		if ( data.encrypted )
		{
			if ( Workspace.encryption )
			{
				// Decript JSON string
				var json = Workspace.encryption.decrypt( data.data, Workspace.encryption.keys.client.privatekey );

				// Converts to object
				var result;
				try
				{
					result = JSON.parse( json );
				}
				catch( e )
				{
					console.log( 'FriendNetworkClient: bad JSON string in encrypted message.', json );
					return;
				}
				data.data = result;
			}
			else
			{
				console.log( 'FNetClient:message, encryption keys not available.' );
				return;
			}
		}

		if ( data.data.subCommand == 'fileHeader' )
			FriendNetwork.receiveFileHeader( data.data );
		else if ( data.data.subCommand == 'fileChunk' )
		{
			FriendNetwork.receiveFileChunk( data.data, function( response, infos, result )
			{
				var nmsg =
				{
					key: self.key,
					name: self.distantName,
					infos: infos,
					file: result
				};
				if ( response == 'completed' )
					FriendNetwork.sendToWindow( self.messageInfo, self.callback, 'fileFromHost', nmsg );
				else
					FriendNetwork.sendToWindow( self.messageInfo, self.callback, 'fileDownloading', nmsg );
			} );
		}
		else
		{
			var nmsg =
			{
				key: self.key,
				name: self.distantName,
				data: data.data
			};
			FriendNetwork.sendToWindow( self.messageInfo, self.callback, 'messageFromHost', nmsg );
		}
	}
	function file( data )
	{
		FriendNetwork.receiveFile( self, data, self.host.messageInfo );
	}
}
FNetClient.prototype.hostClosed = function( hostId )
{
	if ( this.distandId == hostId )
	{
		var nmsg =
		{
			hostKey: this.hostKey,
			key: this.key,
			name: this.hostName
		};
		FriendNetwork.sendToWindow( this.messageInfo, this.callback, 'hostDisconnected', nmsg );
		if ( FriendNetwork.conn )
			FriendNetwork.conn.release( this.key );
		FriendNetwork.removeSession( this.key );
	}
};
FNetClient.prototype.send = function( data )
{
	var self = this;

	// Encrypt the message?
	var encrypted = false;
	if ( self.encryptMessages )
	{
		encrypted = true;

		// Converts data to JSON
		var json;
		try
		{
			json = JSON.stringify( data );
		}
		catch( e )
		{
			console.log( 'FriendNetworkClient:send, error while encrypting.' );
			return;
		}
		data = Workspace.encryption.encrypt( json, self.hostPublicKey );
	}

	if ( ! self.p2p )
	{
		var msg =
		{
			command: 'message',
			key: self.distantKey,
			name: self.localName,
			data: data,
			encrypted: encrypted
		};
		self.conn.send( msg );
	}
	else if ( self.peer )
	{
		var msg =
		{
			type: 'event',
			data:
			{
				command: 'message',
				key: self.distantKey,
				name: self.localName,
				data: data,
				encrypted: encrypted
			}
		};
		self.peer.send( msg );
	}
};
FNetClient.prototype.sendCredentials = function( password, encrypted )
{
	var self = this;

	// Encrypts the password with host public key
	var pass;
	if ( encrypted )
		pass = Workspace.encryption.encrypt( 'HASHED' + Sha256.hash( password ), self.hostPublicKey );
	else
		pass = 'HASHED' + Sha256.hash( password );
	if ( ! self.p2p )
	{
		var msg =
		{
			command: 'credentials',
			key: self.distantKey,
			name: self.name,
			data: pass,
			encrypted: encrypted,
			connectionData: self.connectionData
		};
		if ( encrypted )
			msg.publicKey = Workspace.encryption.keys.client.publickey;
		self.conn.send( msg );
	}
	else if ( self.peer )
	{
		var msg =
		{
			type: 'event',
			data:
			{
				command: 'credentials',
				key: self.distantKey,
				name: self.name,
				data: pass,
				encrypted: encrypted,
				connectionData: self.connectionData
			}
		};
		if ( encrypted )
			msg.publicKey = Workspace.encryption.keys.client.publickey;
		self.peer.send( msg );
	}
};
FNetClient.prototype.close = function()
{
	var self = this;
	if ( ! self.p2p )
	{
		self.conn.send(
		{
			command: 'clientDisconnected',
			key: self.distantKey,
			name: self.name
		} );
	}
	else if ( self.peer )
	{
		var msg =
		{
			type: 'event',
			data:
			{
				command: 'clientDisconnected',
				key: self.distantKey,
				name: self.name
			}
		};
		self.peer.send( msg );
	}

	// Send message to view
	var msg = {
		key: self.key,
		name: self.distantName
	};
	FriendNetwork.sendToWindow( self.messageInfo, self.callback, 'disconnected', msg );

	if ( FriendNetwork.conn )
		FriendNetwork.conn.release( self.key );
	FriendNetwork.sessions[ self.key ] = false;
};
