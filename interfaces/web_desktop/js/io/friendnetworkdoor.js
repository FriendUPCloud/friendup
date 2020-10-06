/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/
/** @file
 *
 * Friend Network interface with the door system
 *
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 12/04/2018
 */

var Friend = window.Friend || {};

FriendNetworkDoor =
{
	configVersion: 11,
	loadConfigs:
	{
		shared: true
	},
	saveConfigs:
	{
		shared: true
	},

	activated: false,
	connected: false,
	shared: [],

	// Initialisation
	start: function()
	{
		var self = FriendNetworkDoor;

		// At least called once!
		self.inUse = true;

		// Already working?
		if ( self.activated && self.connected )
			return;

		// Wait for Friend network to be connected
		var handle = setInterval( function()
		{
			FriendNetwork.isReady( { callback: isInit } );
		}, 100 );
		function isInit( message )
		{
			if ( message.ready )
			{
				clearInterval( handle );
				doInit();
			}
		}

		// Performs the initialisation
		function doInit()
		{
			// Get general Friend Network settings
			var sm = new Module( 'system' );
			sm.onExecuted = function( e, d )
			{
				var fnet;
				if( e == 'ok' )
				{
					if( d )
					{
						try
						{
							d = JSON.parse( d );
							if ( d.friendNetwork != [] )
								fnet = d.friendNetwork;
						}
						catch( e )
						{
							d = null;
						}
					}
				}
				if ( fnet && fnet.activated )
				{
					self.activated = true;
					self.connected = true;
					self.shared = [];
					self.connections = [];

					// Get user information
					FriendNetwork.getUserInformation( { callback: function( infos )
					{
						self.userInformation = infos;
					
						// Get device information
						FriendNetworkFriends.getDeviceInformation( '', function( infos )
						{
							self.deviceInformation = infos;
							self.initLocalDoors();
						} );
					} } );

						
					// Initialize the shared folders hosts and doors
					self.shared = [];
					if ( self.loadConfigs[ 'shared' ] )
					{
						var m = new Module( 'system' );
						m.onExecuted = function( e, d )
						{
							if( e == 'ok' )
							{
								var store;
								try
								{
									var obj = JSON.parse( d );
									if ( obj.friendnetworkdoor != '[]' )
										store = obj.friendnetworkdoor;
								}
								catch(e)
								{
									return;
								}

								// Get the values
								var stored = [];
								if ( store )
								{
									// Check the version of the data
									if ( store.version == self.configVersion )
									{
										if ( store.shared && store.shared != '[]' )
											stored = store.shared;
									}
								}

								// Creates the shares, check for the validity of the path and removes non existant path.
								for ( var s = 0; s < stored.length; s++ )
								{
									var toShare = stored[ s ];
									if ( !toShare.friendName || ( toShare.friendName && FriendNetworkFriends.inUse ) )
									{
										Friend.DOS.getDirectory( toShare.path, {}, function( response, list, shareIt )
										{
											if ( response )
											{
												var door = ( new Door() ).get( shareIt.path );
												if ( door )
												{
													self.shareDoor( door,
													{
														name: shareIt.name,
														type: shareIt.type,
														description: shareIt.description,
														password: shareIt.password,
														icon: shareIt.icon,
														data: shareIt.data
													} );
												}
											}
										}, toShare );
									}
								}
								// Save eventual modifications to the list
								self.storeSettings();
							}
						};
						m.execute( 'getsetting', { 'setting': 'friendnetworkdoor' } );
					}
				}
			};
			sm.execute( 'getsetting', { setting: 'friendNetwork' } );
		}
	},

	// Close FriendNetworkDoor
	close: function ()
	{
		var self = FriendNetworkDoor;
		if ( self.activated )
		{
			self.activated = false;

			// Save settings
			self.storeSettings();

			// Closes all shares
			if ( self.connected )
			{
				// Close the shared folders
				while( self.shared.length )
					self.closeShare( self.shared[ 0 ] );

				// Closes all open connections
				while( self.connections.length )
					self.disconnectDoor( self.connections[ 0 ] );

				// Close the watchdog
				if ( self.handleWatchDog )
				{
					clearInterval( self.handleWatchDog );
					self.handleWatchDog = false;
				}

				self.connected = false;
			}
			self.shared = [];
			self.connections = [];

			// Close local doors
			self.closeLocalDoors();
		}
	},

	// Activates / Deactivates the system
	activate: function( activation )
	{
		if ( activation != this.activated )
		{
			if ( activation )
				this.start();
			else
				this.close();
		}
	},

	// Changes in friend network settings
	changeFriendNetworkSettings: function( fnet )
	{
		var self = FriendNetworkDoor;

		// Shut everything
		self.close();

		// Reactivates when everything has been closed properly...
		setTimeout( function()
		{
			self.activate( fnet.activated );
		}, 1000 );
	},

	// Watch if the workspace is disconnected
	watchDog: function()
	{
		var self = FriendNetworkDoor;
		var connected = Friend.User.ServerIsThere;
		if ( self.connected != connected )
		{
			self.connected = connected;
			if ( connected )
			{
				self.start();
			}
			else
			{
				self.close();
			}
		}
	},

	/**
	 * Share a door on the network
	 *
	 * This function will share a drive or folder on Friend Network.
	 * It opens a host on the network for people to connect to and handles
	 * all the communication in the background.
	 * TODO: implement permissions, for the moment all folders are shared
	 * with read/write permissions.
	 *
	 * @param door (object) the door to share, properly initialised
	 * @param parameters (object) an object containing the properties of the share
	 *  name (string) the name of the share on the network.
	 *                The share will be refused if a share with the same
	 *                name already exists on the network.
	 *  type (string) the type of the share, can be 'folder' or 'drive'
	 *  description (string) a string containing a short (3/4 lines)
	 *                       description of the content of the share
	 *  pass (string) a password to protect the access to the share.
	 *                If this string is empty or undefined, the password
	 *                'public' will be used and the folder will be accessible
	 *                by anyone.
	 *  icon (string) an optional icon in base64 format
	 *  data (object) optional data that will be associated with the share
	 *                and will be visible in the list of hosts returned
	 *                by the FriendNetwork.list function.
	 *  friend (object) if the share is private for a specific friend, this
	 *                  parameter should contain the friend data struture as
	 *                  defined in FriendNetworkDoor. Otherwise undefined.
	 *  callback (function) a callback function that will be called
	 *                      when the share is created, or if creation has failed.
	 *                      The callback function will be called with a string
	 *                      parameter.
	 *                      format of callback: callback( response )
	 *                      'ok' -> the shared is online
	 *                      'Host already exist' -> the name is already used on the network
	 *                      'Error' -> An error occured on the network.
	 *                                 TODO: implement proper error reporting
	 *
	 * @return (boolean) true if the sharing process has been properly initialized. The
	 *                   callback being called later when the share is ready.
	 *                   false if Friend Network is not activated or if the
	 *                   FriendNetworkDoor class has not been started, or if the name of the
	 *                   share already exist.
	 */
	shareDoor: function( door, parameters )
	{
		var self = this;
		var name, type, description, password, icon, data, netfriend, callback, base64;

		// FriendNetwork open? If name is not already used
		if ( self.connected )
		{
			var share = this.getShareFromName( name );
			if ( !share )
			{
				// Name
				name = parameters.name;

				// Description
				description = parameters.description;
				if ( !description )
					description = '';

				// Data zone?
				data = parameters.data;
				if ( !data )
					data = {};

				// A drive or a folder?
				type = parameters.type;
				if ( !type || type == '' )
				{
					type = 'folder';
					if ( door.path == '' )
						type = 'drive';
				}

				// A password?
				password = 'public';
				if ( parameters.password && parameters.password.length != '' )
					password = parameters.password;

				// The friend
				netfriend = parameters.friend;

				// Callback
				callback = parameters.callback;

				// Load the icon
				icon = parameters.icon;
				if ( !icon )
				{
					if ( type == 'drive' )
						icon = 'gfx/fnetFolder.png';
					else
						icon = 'gfx/fnetDrive.png';
					var image = new Image();
					image.onload = function()
					{
						var canvas = document.createElement( 'canvas' );
						canvas.width = 64;
						canvas.height = 64;
						var context = canvas.getContext( '2d')
						context.drawImage( image, 0, 0, 64, 64 );
						base64 = canvas.toDataURL();

						data.image = base64;
						startHosting();
					};
					image.src = icon;
				}
				else
				{
					base64 = icon;
					data.image = icon;
					startHosting();
				}
			}
			else
			{
				if ( share.callback )
					share.callback( 'ok', share );
			}
			return true;
		}
		return false;

		function startHosting()
		{
			FriendNetwork.startHosting(
			{
				name: parameters.name,
				connectionType: type,
				description: description,
				password: password,
				data: data,
				callback: self.handleDoorHost
			} );
			data.image = false;					// Unused, to save space
			var share =
			{
				name: name,
				sharedDoorTitle: door.title,
				type: type,
				description: description,
				icon: icon,
				base64: base64,
				password: password,
				door: door,
				callback: callback,
				hostClients: [],
				data: data,
				key: false,
				path: door.deviceName + ':' + door.path,
				friendName: parameters.friend ? parameters.friend.name : false
			};
			self.shared.push( share );
			self.storeSettings();
		}
	},

	// Handles share communication.
	// makes the link between the received messages and the actual
	// door on the user's machine.
	handleDoorHost: function( msg )
	{
		var self = FriendNetworkDoor;
		switch ( msg.command )
		{
			case 'friendnetwork':
				switch ( msg.subCommand )
				{
					// Host properly created
					case 'host':
						var name = msg.name.substring( 0, msg.name.indexOf( '@' ) );
						var share = self.getShareFromName( name );
						share.key = msg.hostKey;
						if ( share.callback )
							share.callback( 'ok', share );
						FriendNetworkShare.refreshWidget();
						share.door.connected = true;
						share.door.share = share;
						console.log( 'Sharing ' + share.door.deviceName + ':' + share.door.path + ' : - host created ' + msg.name );
						break;

					// New client connected
					case 'clientConnected':
						console.log( 'Friend Network shared drive: client connected ' + msg.name );
						var share = self.getShareFromKey( msg.hostKey );
						if ( share )
						{
							share.hostClients[ msg.key ] =
							{
								key: msg.key,
								name: msg.name,
							};
						}
						break;

					// Client disconnected
					case 'clientDisconnected':
						console.log( 'Friend Network shared drive: client disconnected' );
						var share = self.getShareFromKey( msg.hostKey );
						if ( share )
						{
							for ( var key in share.hostClients )
							{
								if ( key == msg.key )
								{
									share.hostClients[ key ] = false;
									share.hostClients = self.cleanArray( self.hostClients );
								}
							}
							self.storeSettings();
						}
						break;

					// A file to write?
					case 'fileFromClient':
						var share = self.getShareFromKey( msg.hostKey );
						if ( share )
						{
							var path = share.door.deviceName + ':' + share.door.path + msg.infos.path.split( ':' )[ 1 ];
							share.door.onWrite = function( size, extraData )
							{
								var response =
								{
									command: 'writeResponse',
									response: size,
									identifier: extraData
								}
								FriendNetwork.send( { key: msg.key, data: response } );
							}
							var data = msg.file;
							if ( typeof data == 'string' )							
								data = ConvertStringToArrayBuffer( data, 'base64' );
							share.door.write( path, data, 'wb', msg.infos.identifier );
						}
						break;

					// Error: removes share
					case 'error':
						if ( msg.response )
						{
							var name = msg.response.substring( 0, msg.response.indexOf( '@' ) );
							for ( var s = 0; s < self.shared.length; s++ )
							{
								var share = self.shared[ s ];
								if ( share.name == name )
								{
									self.shared.splice( s, 1 );
									self.storeSettings();
									FriendNetworkShare.refreshWidget();
									if ( share.callback )
										share.callback( 'failed' );
									break;
								}
							}
						}
						break;

					// Handle commands
					case 'messageFromClient':
						var share = self.getShareFromKey( msg.hostKey );
						if ( !share )
							return;
						switch ( msg.data.command )
						{
							case 'getIcons':
								// Creates the fileinfo
								var path = getPath( msg.data.path );
								fileInfo =
								{
									ID:       undefined,
									MetaType: 'Directory',
									Path:     path,
									Title:    path,
									Volume:   share.door.deviceName + ':'
								};
								share.door.getIcons( fileInfo, function( dirs, path, pth )
								{
									var localPath = share.door.deviceName + ':' + share.door.path;
									var end = localPath.substring( localPath.length - 1 );
									if ( end != ':' && end != '/' )
										localPath += '/';

									var response =
									{
										command: 'getIconsResponse',
										dirs: dirs,
										path: path,
										pth: pth,
										localPath: localPath,
										identifier: msg.data.identifier
									}
									FriendNetwork.send( { key: msg.key, data: response } );
								}, msg.flags );
								break;
							case 'getFileInformation':
								var path = getPath( msg.data.path );
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
									var response =
									{
										command: 'getFileInformationResponse',
										response: rd,
										identifier: msg.data.identifier
									}
									FriendNetwork.send( { key: msg.key, data: response } );
								}
								sn.execute( 'file/access', { devname: share.name, path: path } );
								break;
							case 'setFileInformation':
								var perm = msg.data.perm;
								perm.path = getPath( msg.data.path );
								var sn = new Library( 'system.library' );
								sn.onExecuted = function( returnCode, returnData )
								{
									var response =
									{
										command: 'setFileInformationResponse',
										response: returnCode,
										identifier: msg.data.identifier
									}
									FriendNetwork.send( { key: msg.key, data: response } );
								}
								sn.execute( 'file/protect', perm );
								break;
							case 'read':
								var path = getPath( msg.data.path );
								share.door.onRead = function( data, extraData )
								{
									// Check for read errors
									if ( !data )
									{
										var response =
										{
											command: 'readError',
											response: 'fail<!--separate-->',
											identifier: extraData
										}
										FriendNetwork.send( { key: msg.key, data: response } );
										return;
									}
									// Send the file
									var type = 'ascii';
									if ( typeof data != 'string' )
									{
										type = 'base64';
										data = ConvertArrayBufferToString( data, type );
									}
									FriendNetwork.sendFile(
									{
										key: msg.key,
										file: data,
										infos:
										{
											command: 'readResponse',
											type: type,
											identifier: extraData
										}
									} );
								}
								share.door.read( path, msg.data.mode, msg.data.identifier );
								break;
							case 'dosAction':
								// Special case for 'copy'
								if ( msg.data.func == 'copy' )
								{
									// See with Hogne
									// Loads the file
									var path = getPath( msg.data.args[ 'from' ] );
									var file = new File( path );
									file.onLoad = function( data )
									{
										// Converts file to string
										data = ConvertArrayBufferToString( data, 'base64' );

										// Send the file to the other side
										FriendNetwork.sendFile(
										{
											key: msg.key,
											file: data,
											infos:
											{
												command: 'copyResponse',
												copyTo: msg.data.args[ 'to' ],
												identifier: msg.data.identifier
											}
										} );
									};
									file.load( 'rb' );
								}
								else
								{
									// Relocates the arguments
									var args = msg.data.args;
									var fromPath = msg.data.fromPath;
									for ( var a in args )
									{
										var path = args[ a ];
										var pos = path.indexOf( '<---VOLUME--->:' );
										if ( pos >= 0 )
										{
											args[ a ] = getPath( args[ a ] );
										}
									}
									share.door.dosAction( msg.data.func, args, function( response )
									{
										var response =
										{
											command: 'dosActionResponse',
											response: response,
											identifier: msg.data.identifier
										}
										FriendNetwork.send( { key: msg.key, data: response } );
									} );
								}
								break;
						}
						break;

					default:
						break;
				}
				break;
		}
		function getPath( path )
		{
			// Creates the fileinfo
			var subPath = path;
			var pos = subPath.indexOf( ':' );
			if ( pos >= 0 )
				subPath = subPath.substring( pos + 1 );								
			path = share.door.deviceName + ':';
			if ( share.door.path != '' )
			{
				path = path + share.door.path;
				if ( path.charAt( path.length - 1 ) != '/' )
					path += '/';
			}
			path += subPath;
			return path;
		}
	},

	/**
	 * Open a local shared folder from its name
	 *
	 * @param name (string) the name of the door on the network, must be the same
	 *        as the 'name' parameter in shareDoor.
	 */
	openSharedDoor: function( name )
	{
		var self = FriendNetworkDoor;

		var share = self.getShareFromName( name );
		if ( share )
		{
			var filename = self.getFileName( share.door.deviceName + ':' + share.door.path );
			var fileInfo =
			{
				ID:       undefined,
				MetaType: 'Directory',
				Path:     share.door.deviceName + ':' + share.door.path,
				Title:    share.door.deviceName + ':' + share.door.path,
				Volume:   share.door.deviceName + ':',
				Filesize: 0,
				Filename: filename
			};
			OpenWindowByFileinfo( fileInfo );
		}
	},

	/**
	 * Close a shared door
	 *
	 * @param name (string) the name of the door on the network, must be the same
	 * 	      as the 'name' parameter in shareDoor.
	 * @return (boolean) true if door is found and closed
	 *                   false if not found
	 */
	closeSharedDoor: function( name )
	{
		var self = FriendNetworkDoor;

		var share = self.getShareFromName( name );
		if ( share )
		{
			self.closeShare( share );
			return true;
		}
		return false;
	},

	// Close a shared door
	closeShare: function( share )
	{
		var self = FriendNetworkDoor;

		// Find the share number in the list
		var found = false;
		for ( var s = 0; s < self.shared.length; s++ )
		{
			if ( self.shared[ s ] == share )
			{
				found = true;
				break;
			}
		}
		if ( found )
		{
			if ( share.key )
				FriendNetwork.disposeHosting( { key: share.key } );
			self.shared.splice( s, 1 );
			self.storeSettings();
			return true;
		}
		return false;
	},


	// Saves the current share information in Friend settings
	storeSettings: function()
	{
		var self = FriendNetworkDoor;

		if ( self.connected )
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
			};
			var store =
			{
				version: self.configVersion,
				acceptAny: self.acceptMessagesFromAny
			};
			if ( self.saveConfigs[ 'shared' ] )
			{
				store.shared = [];
				for ( var s = 0; s < self.shared.length; s++ )
				{
					var share = self.shared[ s ];

					// Only the shares that are not linked to a friend
					if ( share.friendName == false )
					{
						store.shared.push
						(
							{
								name: share.name,
								type: share.type,
								description: share.description,
								icon: share.icon,
								base64: share.base64,
								password: share.password,
								data: share.data,
								path: share.path
							}
						);
					}
				}
			}
			m.execute( 'setsetting',
			{
				setting: 'friendnetworkdoor',
				data: store
			} );
		}
	},

	/**
	 * Connects to a shared folder or drive, and creates a local door when done.
	 *
	 * Call this function to connect to a distant folder shared on Friend Network.
	 * It will connect to a door shared with the 'shareDoor' function above,
	 * handle all the negociations in the back, and if succesfull, open a Dormant
	 * door for easy and standardized access to the files present in the folder.
	 * The door will function as long as the original user is online and sharing it.
	 *
	 * @param hostName (string) the user name of the host onwning the share (ex 'francois')
	 * @param appName (string, TODO: rename parameter) the network name of the folder,
	 *        equivalent to the 'name' parameter used in 'shareDoor'.
	 * @param type (string) the type of the share, can be 'folder' or 'application'.
	 * @param password (string) an eventual password to connect if the share is
	 *        password protected. If undefined or empty, the password 'public' will be used.
	 * @param callback (function) a callback function that is called for feedback.
	 *        callback( response, parameter )
	 *        response = 'connected': called when the door has been succesfully open.
	 *                   The parameter will contain a 'connection' object where the door
	 *                   containing the door itself.
	 *        response = 'failed': in case of error (TODO: work on error messages)
	 *                   Called in case of problem. The door will not work.
	 * @param authId (string) optional. A authId string necessary when you share
	 *        an application.
	 *
	 * @return (boolean)
	 *        true: the connection process has been initialized properly
	 *        false: an was detected, FriendNetwork is not activated, the
	 *               FriendNetworkDoor class is not activated, or other errors.
	 *
	 */
	connectToDoor: function( hostName, appName, type, password, callback, authId, extra )
	{
		var self = FriendNetworkDoor;

		// OK?
		if ( !self.connected )
			return false;

		// Check that this connection does not already exist
		for ( var c = 0; c < self.connections.length; c++ )
		{
			if ( self.connections[ c ].hostName == hostName && self.connections[ c ].appName == appName )
			{
				if ( self.connections[ c ].key )
				{
					self.connections[ c ].door.windows = [];			// So that JSON does not complain about circular structures!
					callback( 'connected', self.connections[ c ], extra );
				}
				else
					callback( 'failed', false, extra );
				return false;
			}
		}

		var connection =
		{
			doorName: appName + ' on ' + hostName,
			appName: appName,
			hostName: hostName,
			type: type,
			password: password,
			callback: callback
		};
		if ( authId )
			connection.authId = authId;
		self.connections.push( connection );

		// Connects to host
		FriendNetwork.connectToHost( { url: connection.appName + '@' + connection.hostName, hostType: type, p2p: true, encryptMessages: true, callback: handleMessages } );

		// Handles FriendNetwork messages
		var self = this;
		function handleMessages( msg )
		{
			switch ( msg.subCommand )
			{
				case 'getCredentials':
					var connection = self.getConnectionFromName( msg.hostName );
					if ( connection )
					{
						FriendNetwork.sendCredentials( { key: msg.key, password: connection.password, encrypted: false } );
					}
					break;

				case 'connected':
					var connection = self.getConnectionFromName( msg.hostName );
					if ( connection )
					{
						connection.key = msg.key;
						self.addDormantDoor( connection, msg.key );
						if ( connection.callback )
							connection.callback( 'connected', connection, extra );
					}
					break;

				case 'hostDisconnected':
					for ( var c = 0; c < self.connections.length; c++ )
					{
						var connection = self.connections[ c ];
						if ( connection.key == msg.key )
						{
							// Closes the door
							if ( connection.door )
								self.closeDormantDoor( connection );

							// If no more presence of hostName in connections, update the widgets
							FriendNetworkFriends.refreshFriendWidgets( true );
						}
					}
					break;

				case 'fileFromHost':
					var connection = self.getConnectionFromKey( msg.key );
					if ( connection )
					{
						var data = msg.file;
						switch ( msg.infos.command )
						{
							case 'readResponse':
								if ( msg.infos.type == 'binaryString' || msg.infos.type == 'base64' )
								{
									data = ConvertStringToArrayBuffer( data, msg.infos.type );
								}
								if ( connection.callbacks[ msg.infos.identifier ] )
								{
									connection.callbacks[ msg.infos.identifier ]( data );
									connection.callbacks[ msg.infos.identifier ] = false;
									connection.callbacks = self.cleanArray( connection.callbacks );
								}
								break;
							case 'copyResponse':
								if ( connection.callbacks[ msg.infos.identifier ] )
								{
									// Converts string to bytearray
									data = ConvertStringToArrayBuffer( data, 'base64' );

									// Save file
									var save = new File( msg.infos.copyTo );
									save.save( data, null, 'wb' );
									connection.callbacks[ msg.infos.identifier ]( 'ok' );
									connection.callbacks[ msg.infos.identifier ] = false;
									connection.callbacks = self.cleanArray( connection.callbacks );
								}
								break;
						}
					}
					break;
				case 'messageFromHost':
					var connection = self.getConnectionFromKey( msg.key );
					if ( connection )
					{
						switch ( msg.data.command )
						{
							case 'getIconsResponse':
								var response = [];
								for ( var f = 0; f < msg.data.dirs.length; f++ )
								{
									var item = msg.data.dirs[ f ];
									// Remove the origin path
									var path = connection.doorName + ':' + item.Path.substring( msg.data.localPath.length );
									var element =
									{
										MetaType: item.MetaType,
										Title: item.Filename,
										Filename: item.Filename,
										Icon: item.MetaType,
										Path: path,
										Position: 'left',
										Module: 'files',
										Command: 'dormant',
										Filesize: item.Filesize,
										Flags: '',
										Type: item.Type,
										Dormant: connection.door
									};
									response.push( element );
								}
								if ( connection.callbacks[ msg.data.identifier ] )
								{
									connection.callbacks[ msg.data.identifier ]( response );
									connection.callbacks[ msg.data.identifier ] = false;
									connection.callbacks = self.cleanArray( connection.callbacks );
								}
								break;
							case 'writeResponse':
							case 'dosActionResponse':
							case 'getFileInformationResponse':
							case 'setFileInformationResponse':
							case 'readError':
								if ( connection.callbacks[ msg.data.identifier ] )
								{
									connection.callbacks[ msg.data.identifier ]( msg.data.response );
									connection.callbacks[ msg.data.identifier ] = false;
									connection.callbacks = self.cleanArray( connection.callbacks );
								}
								break;
						}
					}
					break;

				case 'fileTransfer':
					switch ( msg.response )
					{
						case 'fileDownloadProgress':
							console.log( 'WideWeb Friend Network - fileTransfer downloading: ' +  msg.fileProgress, msg );
							break;
						default:
							console.log( 'WideWeb Friend Network - File transfer: ' + msg.response, msg );
							break;
					};
					break;

				case 'error':
					console.log( 'WideWeb Friend Network - Error: ' + msg.error );
					var appName = msg.response.substring( 0, msg.response.indexOf( '@' ) );
					var hostName = msg.response.substring( msg.response.indexOf( '@' ) + 1 );
					for ( var c = 0; c < self.connections.length; c++ )
					{
						if ( self.connections[ c ].hostName == hostName && self.connections[ c ].appName == appName )
						{
							var connection = self.connections[ c ];
							if ( connection.door )
								self.closeDormantDoor( connection );
							if ( connection.callback )
								connection.callback( 'failed', false, extra );
							self.connections.splice( c );
							break; 
						}
					}
					break;

				default:
					break;
			}
		}
	},

	/**
	 * Disconnects from a shared folder or application
	 *
	 * This function disconnects from a shared folder and closes
	 * the Dormant door related to it.
	 *
	 * @param hostName (string) the name of the host sharing the folder
	 *        (example 'francois')
	 * @param folderName (string) the name of the shared folder. If undefined
	 *        the function will disconnect from all the folders of this host.
	 * @return (boolean) true if the connection was found
	 *                   false if not
	 */
	disconnectFromDoor: function( hostName, folderName )
	{
		var self = FriendNetworkDoor;

		if ( self.connected )
		{
			// Find the connection
			for ( var c = 0; c < self.connections.length; c++ )
			{
				if ( self.connections[ c ].hostName == hostName )
				{
					if ( typeof folderName != 'undefined' && folderName != self.connections[ c ].appName )
						continue;
					self.disconnectDoor( self.connections[ c ] );
					return true;
				}
			}
		}
		return false;
	},

	// Handles the disconnection
	disconnectDoor: function( connection )
	{
		var self = FriendNetworkDoor;
		for ( var c = 0; c < self.connections.length; c++ )
		{
			if ( self.connections[ c ] == connection )
			{
				if ( connection.key )
				{
					FriendNetwork.disconnectFromHost( connection.key );
					self.closeDormantDoor( connection );
					self.connections.splice( c, 1 );
					FriendNetworkFriends.refreshFriendWidgets( true );
					break;
				}
			}
		}
	},

	// Add a new Dormant door to the system and manage all communication.
	// The door is just a new drive on the user's machine, and behaves
	// like any other door.
	addDormantDoor: function( connection, key )
	{
		var self = FriendNetworkDoor;
		connection.doorName = connection.appName + ' on ' + connection.hostName;
		connection.callbacks = {};

		// Add local dormant door
		connection.door =
		{
			title: connection.doorName,
			windows: [],
			key: key,

			refresh: doRefresh,
			addWindow: doAddWindow,
			execute: doExecute,
			getDoor: doGetDoor,
			getDirectory: doGetDirectory,
			getFileInformation: doGetFileInformation,
			setFileInformation: doSetFileInformation,
			read: doRead,
			write: doWrite,
			dosAction: doDosAction,
			getConfig: doGetConfig
		};
		DormantMaster.addAppDoor( connection.door );

		function doRefresh( winObj )
		{
			winObj.innerHTML = ':)';
		};
		function doAddWindow( win )
		{
			connection.door.windows.push( win );
		};
		function doExecute( func, args, callback )
		{
			connection.door.pollEvent( func, null );
		};
		function doGetDoor()
		{
			return {
				MetaType: 'Meta',
				Title: connection.door.title,
				Path: connection.door.title + ':',
				Volume: connection.door.title + ':',
				IconFile: 'apps/WideWeb/icondoor.png',
				Position: 'left',
				Module: 'files',
				Command: 'dormant',
				Filesize: 4096,
				Flags: '',
				Type: 'Dormant',
				Dormant: connection.door
			};
		};
		function doGetConfig()
		{
			var conf =
			{
				type: 'disk',
				Permissions:
				[
					'Module System',
					'Module Files',
					'Door All'
				]
			};
			if ( connection.authId )
				conf.authid = connection.authId;
			return conf;
		};
		function doGetDirectory( path, callback )
		{
			var vname = connection.door.title + ':';

			if( path != '' && path.substr( path.length - 1, 1 ) != ':' && path.substr( path.length - 1, 1 ) != '/' )
				path += '/';

			var identifier = getIdentifier( connection );
			connection.callbacks[ identifier ] = callback;
			var message =
			{
				command: 'getIcons',
				path: path,
				fromPath: connection.appName,
				flags: { details: true },
				identifier: identifier
			};
			FriendNetwork.send( { key: connection.key, data: message } );
		};
		function doGetFileInformation( path, callback )
		{
			var identifier = getIdentifier( connection );
			connection.callbacks[ identifier ] = callback;
			var message =
			{
				command: 'getFileInformation',
				path: path,
				fromDrive: path,
				identifier: identifier
			};
			FriendNetwork.send( { key: connection.key, data: message } );
		};
		function doSetFileInformation( perm, callback )
		{
			var identifier = getIdentifier( connection );
			connection.callbacks[ identifier ] = callback;
			var message =
			{
				command: 'setFileInformation',
				perm: perm,
				fromDrive: path,
				identifier: identifier
			};
			FriendNetwork.send( { key: connection.key, data: message } );
		};
		function doRead( path, mode, callback )
		{
			var identifier = getIdentifier( connection );
			connection.callbacks[ identifier ] = callback;
			var message =
			{
				command: 'read',
				path: path,
				mode: mode,
				fromDrive: path,
				identifier: identifier
			};
			FriendNetwork.send( { key: connection.key, data: message } );
		};
		function doWrite( path, data, callback )
		{
			var identifier = getIdentifier( connection );
			connection.callbacks[ identifier ] = callback;

			// Send the file to the other side
			var infos =
			{
				command: 'write',
				path: path,
				identifier: identifier
			};
			FriendNetwork.sendFile( { key: connection.key, file: data, infos: infos } );
		};
		function doDosAction( func, args, callback )
		{
			var identifier = getIdentifier( connection );
			connection.callbacks[ identifier ] = callback;

			// Removes source drive indications
			for ( var a in args )
			{
				while( true )
				{
					var pos = args[ a ].indexOf( connection.doorName + ':' );
					if ( pos < 0 )
						break;
					args[ a ] = args[ a ].substring( 0, pos ) + '<---VOLUME--->:' + args[ a ].substring( pos + connection.doorName.length + 1 );
				};
			}
			var message =
			{
				command: 'dosAction',
				func: func,
				args: args,
				identifier: identifier
			};
			FriendNetwork.send( { key: connection.key, data: message } );
		};
		function getIdentifier( conn )
		{
			var identifier = conn.doorName + '<>' + Math.random() * 1000000;
			while( conn.callbacks[ identifier ] )
				identifier = conn.doorName + '<>' + Math.random() * 1000000;
			return identifier;
		}
	},

	// Close a Dormant door previously open on the system
	closeDormantDoor: function( connection )
	{
		if ( connection.door )
		{
			// Close Dormant door
			DormantMaster.delAppDoor( connection.door );
			connection.door = null;
		}
	},


	/**
	 * Relocates a HTML file with another path
	 *
	 * This function is to be called when displaying a HTML file from a shared
	 * drive in an iFrame, for example in Friend Browser.
	 * See Friend Browser code for an example of use, function name '
	 * - Links are redirected to the provided function that acts as intermediary
	 * - CSS is loaded and appended to the HTML
	 * - images are loaded and included in the HTML as base64
	 * - scripts are loaded and incorporated directly in the HTML
	 * - external references to other domains a left intact
	 * To allow a HTML file to work over Friend Network, all path that refer to a file
	 * present in the local folder where the HTML lays should begin with 'Progdir:'.
	 * This function detects such paths and replaces them with the 'sourceDrive'.
	 *
	 * @param html (string) the HTML file to relocate
	 * @param sourceDrive (string) the name of the door the file is present on. Warning,
	 *        this name is the name of the local door (the one opened by 'connectToDoor')
	 *        and not the name of the distant door (example 'Panzers on francois' instead
	 *        of 'Panzers')
	 * @param linkreplacement (string) a string that will be added to each link. It should
	 *        perform a call to the 'linkFunction' function that can send messages to the
	 * 		  owner of the iFrame.
	 * @param linkFunction (string) a string containing a function to be appended as script
	 *        to the HTML file. Links will be redirected to this function.
	 * @param callback (function) called when trhe job is done. This can take several seconds
	 *        depending on the complexity of the HTML file, the images and data to load and the
	 *        speed of the network.
	 *        callback( response, html )
	 *        - response = true: the page can be displayed. Please note that this function
	 *          can be called several times as long as data looad. The first call will be done
	 *          with images replaced by an 'empty' icon, and will fill up as loading progresses.
	 *          the 'html' parameter will contain thge current HTML fiile, more or less modified
	 *          each time. It is the role of the caller to put the code in the iFrame.
	 *        - response = false: a timeout error has occured, the data could not be loaded.
	 *
	 *
	 *
	 */
	relocateHTML: function( html, sourceDrive, linkReplacement, linkFunction, callback )
	{
		// No ':' at the end of the drive
		if ( sourceDrive.charAt( sourceDrive.length - 1 ) == ':' )
			sourceDrive = sourceDrive.substring( 0, sourceDrive.length - 1 );

		// Relocate the links?
		if ( linkReplacement && linkReplacement != '' )
		{
			// Add the redirection function in the head
			var pos = html.indexOf( '<body>' );
			if ( pos >= 0 )
				html = html.substring( 0, pos + 6 ) + '<script>' + linkFunction + '</script>' + html.substring( pos + 6 );

			// Relocates the links
			var start = html.indexOf( '<a href=' );
			while( start >= 0 )
			{
				start += 8;
				var limit = html.charAt( start++ );
				var quote = ( limit == '"' ? "'" : '"' );
				var end = html.indexOf( limit, start );
				var link = html.substring( start, end );
				if ( link.substring( 0, 11 ) != 'javascript:' )
				{
					//if ( link.indexOf( ':' ) >= 0 )
						html = html.substring( 0, start ) + linkReplacement + '(' + quote + link + quote + ');' + html.substring( end );
				}
				start = html.indexOf( 'href=', start );
			}
		}

		// Relocates the images
		var fileCount = 0;
		var pathArray = [];
		var posArray = [];
		var typeArray = [];
		var pos = html.indexOf( '<img ' );
		while( pos >= 0 )
		{
			var endTag = html.indexOf( '>', pos + 5 );
			if ( endTag >= 0 )
			{
				var src = html.indexOf( 'src=', pos );
				if ( src >= 0 && src < endTag )
				{
					var limit = html.charAt( src + 4 );
					var end = html.indexOf( limit, src + 5 );
					var srcPath = html.substring( src + 5, end );
					var destPath = getPath( sourceDrive, srcPath );
					if ( destPath )
					{
						typeArray[ fileCount ] = 'img';
						posArray[ fileCount ] = { start: src + 5, end: end };
						pathArray[ fileCount++ ] = destPath;
					}
					pos = html.indexOf( '<img ', pos + 1 );
					continue;
				}
			}
			pos++;
		}

		// Relocates the CSS
		var pos = html.indexOf( '<link ' );
		while( pos >= 0 )
		{
			var endTag = html.indexOf( '>', pos + 6 );
			if ( endTag >= 0 )
			{
				var src = html.indexOf( 'href=', pos );
				if ( src >= 0 && src < endTag )
				{
					var limit = html.charAt( src + 5 );
					var end = html.indexOf( limit, src + 6 );
					var srcPath = html.substring( src + 6, end );
					var destPath = getPath( sourceDrive, srcPath );
					if ( destPath )
					{
						typeArray[ fileCount ] = 'css';
						posArray[ fileCount ] = { start: pos, end: endTag + 1 };
						pathArray[ fileCount++ ] = destPath;
					}
					pos = html.indexOf( '<link ', pos + 1 );
					continue;
				}
			}
			pos++;
		}

		// Relocates the scripts
		var pos = html.indexOf( '<script ' );
		while( pos >= 0 )
		{
			var endTag = html.indexOf( '</script>', pos );
			if ( endTag >= 0 )
			{
				var src = html.indexOf( 'src=', pos );
				if ( src >= 0 && src < endTag )
				{
					var limit = html.charAt( src + 4 );
					var end = html.indexOf( limit, src + 5 );
					var srcPath = html.substring( src + 5, end );
					var destPath = getPath( sourceDrive, srcPath );
					if ( destPath )
					{
						typeArray[ fileCount ] = 'script';
						posArray[ fileCount ] = { start: pos, end: endTag + 9 };		// Length of '</script>
						pathArray[ fileCount++ ] = destPath;
					}
					pos = html.indexOf( '<script ', pos + 1 );
					continue;
				}
			}
			pos++;
		}

		// Load the files
		if ( fileCount > 0 )
		{
			var count = fileCount;

			// Set a watchdog anbd
			var handleTimeout = setTimeout( checkTimeout, 1000 * 10 );

			// Replaces the images with 'loading'
			var loaded = false;
			var self = this;
			var error = new Image();
			error.onload = function()
			{
				for ( var p = 0; p < pathArray.length; p++ )
				{
					if ( typeArray[ p ] == 'img' )
						pokeImage( this, p );
				}
				loaded = true;

				// For each image
				for ( var p = 0; p < pathArray.length; p++ )
				{
					var srcPath = pathArray[ p ];

					// Get the original path and relocates it
					if ( typeArray[ p ] == 'img' )
					{
						// Load the image
						var file = new File( srcPath );
						file.pathNumber = p;
						file.onLoad = function( data )
						{
							// Check for error
							if ( typeof data == 'string' )
							{
								if( str.substr( 0, 19 ) == 'fail<!--separate-->' )
									return;
							}
							// Converts the image data to base64
							var arrayBufferView = new Uint8Array( data );
							var blob = new Blob( [ arrayBufferView ], { type: "image/jpeg" } );
							var urlCreator = window.URL || window.webkitURL;
							var imageUrl = urlCreator.createObjectURL( blob );
							var newImage = new Image();
							newImage.pathNumber = this.pathNumber;
							newImage.onload = function()
							{
								pokeImage( this, this.pathNumber );

								// One left
								count--;
								if ( count == 0 )
								{
									clearTimeout( handleTimeout );
									callback( true, html );
								}
							}
							newImage.src = imageUrl;
						}
						file.load( 'rb' );
					}
					else if ( typeArray[ p ] == 'css' )
					{
						// Load the css
						var file = new File( srcPath );
						file.pathNumber = p;
						file.onLoad = function( data )
						{
							if( data.substr( 0, 19 ) == 'fail<!--separate-->' )
								return;

							// Replace <link> by <style>
							pokeCode( '<style>' + data + '</style>', this.pathNumber );

							// One left
							count--;
							if ( count == 0 )
							{
								clearTimeout( handleTimeout );
								callback( true, html );
							}

						}
						file.load();
					}
					else if ( typeArray[ p ] == 'script' )
					{
						// Load the js
						var file = new File( srcPath );
						file.pathNumber = p;
						file.onLoad = function( data )
						{
							if( data.substr( 0, 19 ) == 'fail<!--separate-->' )
								return;

							// Insert JS code directly into html
							pokeCode( '<script type="text/javascript">' + data + '</script>', this.pathNumber );

							// One left
							count--;
							if ( count == 0 )
							{
								clearTimeout( handleTimeout );
								callback( true, html );
							}
						}
						file.load();
					}
				}
			}
			error.src = '/webclient/gfx/fnetLoadImage.png';
		}
		else
		{
			callback( true, html );
		}

		// Checks for image loading finished
		function checkTimeout()
		{
			callback( false, html );
		}
		function pokeImage( image, pathNumber )
		{
			// Converts to base64
			var canvas = document.createElement( 'canvas' );
			canvas.width = image.width;
			canvas.height = image.height;
			var context = canvas.getContext( '2d' );
			context.drawImage( image, 0, 0 );
			var base64 = canvas.toDataURL();
			pokeCode( base64, pathNumber );
		};
		function pokeCode( code, pathNumber )
		{
			// Puts code into HTML
			var start = posArray[ pathNumber ].start;
			var end = posArray[ pathNumber ].end;
			html = html.substring( 0, start ) + code + html.substring( end );

			// Relocates the position array
			var delta = code.length - ( posArray[ pathNumber ].end - posArray[ pathNumber ].start );
			posArray[ pathNumber ].end = posArray[ pathNumber ].start + code.length;
			for ( var i = 0; i < posArray.length; i++ )
			{
				if ( posArray[ i ].start > start )
				{
					posArray[ i ].start += delta;
					posArray[ i ].end += delta;
				}
			}
		}
		function getPath( sourceDrive, path )
		{
			if( path.toLowerCase().substr( 0, 8 ) == 'progdir:' )
			{
				return sourceDrive + path.substring( 7 );
			}
			// No need to relocate
			return false;
		}
	},

	/**
	 * Launches an application in an empty session of Friend without user login
	 *
	 * This function is used in application like Friend Browser to display the
	 * content of a jsx in an iFrame.
	 * Once the iFrame is initialized with Friend appspace code, this
	 * function can be called. It starts FriendNetwork within the iFrame,
	 * connects to the shared door containing the application's code, and
	 * once everything is established, launches the application in
	 * a secured and restricted sandbox.
	 *
	 * @param hostName (string) the name of the host as for FriendNetwork main initialisation
	 * @param appName (string) the name of the applicationm which must correspond to the
	 *                         name of the shared folder containing the application
	 * @param path (string) the local path in the shared folder to the executable
	 * @param userInformation (object) a 'userInformation' object containing information
	 *                                 about the user who lauches the application (the
	 *                                 user who originate the call to this function)
	 * @param authId (string) the authId of the application who made the call.
	 */
	runRemoteApplication: function( options, callback, extra  )
	{
		var self = FriendNetworkDoor;

		// Initialize Friend Network
		var host = document.location.hostname + ':6514';
		if ( 'http:' === document.location.protocol )
			host = 'ws://' + host;
		else
			host = 'wss://' + host;

		var hostMeta =
		{
			name: options.userInformation.name + Math.random() * 1000000,
			description: options.userInformation.description,
			imagePath: '',
			info:
			{
				internal: true,
				fullName: options.userInformation.fullName,
				image: options.userInformation.image
			},
			apps: [],
		};
		var id = options.authId;
		if ( !id )
			id = options.sessionId;
		FriendNetwork.init( host, 'application', options.authId, hostMeta, function( response )
		{
			if ( response )
			{
				window.FriendNetworkDoor.start();				// Open the door...

				// Wait for Friend Network to be initilized
				setTimeout( function()
				{
					self.connectToDoor
					( 
						FriendNetwork.getHostNameFromURL( self.doorURL ),
						FriendNetwork.getAppNameFromURL( self.doorURL ),
						'folder', 
						function( response, connection )
						{
							if ( response == 'connected' )
							{
								ExecuteJSXByPath( options.path, '', function( response )
								{
									if ( response )
										callback( true, { command: 'runRemoteApplicationResponse' }, extra );
									else
										callback( false, 
										{
											command: 'runRemoteApplicationResponse',
											error: 'ERROR - Application cannot be ran.'
										}, extra );
								} );
							}
						}, 
					authId );
				}, 1000 );
			}
		} );
	},

	//
	// Utility functions
	//
	///////////////////////////////////////////////////////////////////////////

	// Returns a unique identifier
	getUniqueIdentifier: function( name )
	{
		return name + '<' + new Date().getTime() + '-' + Math.random() * 1000000 + '>';
	},

	// Returns a share object from its name
	getShareFromName: function( name )
	{
		for ( var s = 0; s < FriendNetworkDoor.shared.length; s++ )
		{
			var share = FriendNetworkDoor.shared[ s ];
			if ( share.name == name )
				return share;
		}
		return false;
	},

	// Returns a share object from its FriendNetwork key
	getShareFromKey: function( key )
	{
		for ( var s = 0; s < FriendNetworkDoor.shared.length; s++ )
		{
			var share = FriendNetworkDoor.shared[ s ];
			if ( share.key == key )
				return share;
		}
		return false;
	},

	// Returns a connection object from the name of the shared folder
	getConnectionFromName: function( name )
	{
		var self = FriendNetworkDoor;
		var pos = name.indexOf( '@' );
		var hostName, appName;
		if ( pos >= 0 )
		{
			appName = name.substring( 0, pos );
			hostName = name.substring( pos + 1 );
		}
		else
			appName = name;
		for ( var c = 0; c < self.connections.length; c++ )
		{
			if ( ( hostName && self.connections[ c ].hostName == hostName ) && self.connections[ c ].appName == appName )
				return self.connections[ c ];
		}
		return false;
	},

	// Returns a connection object from the FriendNetwork key
	getConnectionFromKey: function( key )
	{
		var self = FriendNetworkDoor;
		for ( var c = 0; c < self.connections.length; c++ )
		{
			if ( self.connections[ c ].key == key )
				return self.connections[ c ];
		}
		return false;
	},

	// Clean the properties of a Javascript object
	cleanArray: function( keys, exclude )
	{
		var out = [ ];
		for ( var key in keys )
		{
			if ( keys[ key ] && keys[ key ] != exclude )
				out[ key ] = keys[ key ];
		}
		return out;
	},

	// Return a filename from a path
	getFileName: function ( path )
	{
		if ( path.charAt( path.length - 1 ) == '/' )
			path = path.substring( 0, path.length - 1 );

		var slash = path.lastIndexOf( '/' );
		if ( slash >= 0 )
			return path.substring( slash + 1 );

		var split = path.split( ':' );
		if ( split[ 1 ] && split[ 1 ].length )
			return split[ 1 ];
		return split[ 0 ];
	},
	addFileName: function( path, fileName )
	{
		/*var c = path.charAt( path.length - 1 );
		if ( c != ':' )
		{
			if ( c != '/' )
			{
				path += '/';
			}
		}
		*/
		return path + fileName;
	},



		//
	// LOCAL DOORS
	/////////////////////////////////////////////////////////////////////////
	initLocalDoors: function( callback )
	{
		var self = FriendNetworkDoor;

		self.localDoors = [];
		self.mountedDrives = [];

		// Temporary! No local drives...
		if ( callback )
		{
			callback( 'ERROR - Not activated.', response );
		}
		return;

		FriendNetworkExtension.init( function( response ) 
		{
			self.extensionConnected = response;			

			if ( response )
			{
				FriendNetworkExtension.sendMessage( { command: 'getDrives' }, function( response )
				{
					if ( response.command == 'getDrivesResponse' )
					{
						if ( self.deviceInformation.mountLocalDrives )
						{
							for ( var d = 0; d < response.drives.length; d++ )
							{
								var localDoorName = response.drives[ d ] + ' on ' + self.deviceInformation.name;
								self.addLocalDormantDoor( localDoorName, response.drives[ d ] );
							}
						}
						if ( callback )
						{
							callback( 'ok', self.localDoors );
						}
					}
					else
					{
						if ( callback )
							callback( 'ERROR - Response from extension.', response );
					}
				} );
			}
		} );
	},
	closeLocalDoors: function()
	{
		var self = FriendNetworkDoor;

		// Close the doors
		for ( var d = 0; d < self.localDoors.length; d++ )
		{
			self.closeLocalDormantDoor( self.localDoors[ d ] );
		}
		self.localDoors = [];

		// Remove the mounted drives from the Workspace
		for ( var d = 0; d < self.mountedDrives.length; d++ )
		{
			var fileInfo = self.mountedDrives[ d ];
			for ( var i = 0; i < Workspace.icons.length; i++ )
			{
				var icon = Workspace.icons[ i ];
				if ( icon.Title == fileInfo.Title && icon.Type == fileInfo.Type )
				{
					Workspace.icons.splice( i );
					break;
				}
			}
		}
		self.mountedDrives = [];

		// Close the extension
		FriendNetworkExtension.close();
		self.extensionConnected = false;
	},

	addLocalDormantDoor: function( localDoorName, localDriveName )
	{
		var self = FriendNetworkDoor;

		// Add local dormant door
		var localDoor =
		{
			title: localDoorName,
			driveName: localDriveName,
			windows: [],
			refresh: doRefresh,
			addWindow: doAddWindow,
			execute: doExecute,
			getDoor: doGetDoor,
			getDirectory: doGetDirectory,
			getFileInformation: doGetFileInformation,
			setFileInformation: doSetFileInformation,
			read: doRead,
			write: doWrite,
			dosAction: doDosAction,
			getConfig: doGetConfig,
			setPath: doSetPath,
			path: ''
		};
		self.localDoors.push( localDoor );
		DormantMaster.addAppDoor( localDoor );

		// Add the fileinfo to the Workspace icons
		if ( self.deviceInformation.mountLocalDrives )
		{
			var fileInfo =
			{
				ID:       undefined,
				MetaType: 'Directory',
				Path:     localDoor.title + ':',
				Title:    localDoor.title,
				Volume:   localDoor.title,
				Filesize: 0,
				Filename: localDoor.title,
				Type: 'Dormant',
				Dormant: localDoor,
				Mounted: true,
				Visible: true,
				AutoMount: true
			};
			self.mountedDoors.push( fileInfo );
			Workspace.icons.push( fileInfo );
			Workspace.refreshDesktop( false, true );
		}
		
		function doRefresh( winObj )
		{
			winObj.innerHTML = ':)';
		};
		function doAddWindow( win )
		{
			localDoor.windows.push( win );
		};
		function doExecute( func, args, callback )
		{
			if ( localDoor[ func ] )
			{
				switch( args.length )
				{
					case 0:
						localDoor[ func ]( callback );
						break;
					case 1:
						localDoor[ func ]( args[ 0 ], callback );
						break;
					case 2:
						localDoor[ func ]( args[ 0 ], args[ 1 ], callback );
						break;
					case 3:
						localDoor[ func ]( args[ 0 ], args[ 1 ], args[ 2 ], callback );
						break;
				}
			}
		};
		function doSetPath( path )
		{
			var c = path.charAt( path.length - 1 );
			if ( c != '/' )
				path += '/';
			localDoor.path = path;
		};
		function doGetDoor()
		{
			var info =
			{
				MetaType: 'Meta',
				Title: localDoor.title + ':',
				IconFile: 'apps/WideWeb/icondoor.png',
				Position: 'left',
				Module: 'files',
				Command: 'dormant',
				Filesize: 4096,
				Flags: '',
				Type: 'Dormant',
				Path: localDoor.title + ':',
				Volume: localDoor.title + ':',
				Dormant: localDoor,
				AutoMount: true
			};
			return info;
		};
		function doGetConfig()
		{
			var conf =
			{
				type: 'disk',
				Permissions:
				[
					'Module System',
					'Module Files',
					'Door All'
				]
			};
			return conf;
		};
		function doGetDirectory( path, callback )
		{			
			path = getLocalPath( path );
			var subPath = path.split( ':' )[ 1 ];
			if ( !subPath )
				subPath = '';
			FriendNetworkExtension.sendMessage( { command: 'getDirectory', path: path }, function( response )
			{
				if ( response.command == 'getDirectoryResponse' )
				{
					// Create fake fileinfos
					var answer = [];
					for ( var f = 0; f < response.files.length; f++ )
					{
						var file = response.files[ f ];
						var path = localDoor.title + ':' + subPath;						
						var fullPath = path + file.name;
						var metaType = file.isDirectory ? 'Directory' : 'File';
						var fileInfo =
						{
							MetaType: metaType,
							Title: file.name,
							Filename: file.name,
							Icon: metaType,
							Path: fullPath,
							Position: 'left',
							Module: 'files',
							Command: 'dormant',
							Filesize: file.length,
							Flags: '',
							Type: metaType,
							Dormant: localDoor
						};
						answer.push( fileInfo );
					}
					callback( answer );
				}
				else
				{
					callback ( 'fail<!--separate-->{ "response": "0" }' );
				}
			} );
		};
		function doGetFileInformation( path, callback )
		{
			var subPath = path.split( ':' )[ 1 ];
			path = localDoor.driveName + ':' + subPath;
			FriendNetworkExtension.sendMessage( { command: 'getFileInformation', path: path }, function( response )
			{
				if ( response.command == 'getFileInformationResponse' )
				{
					var	rd = 
					[
						{
							access: response.permissions.user,
							type: 'user'
						},
						{
							access: response.permissions.group,
							type: 'group'
						},
						{
							access: response.permissions.others,
							type: 'others'
						}
					];
					callback( rd );
				}
			} );
		};
		function doSetFileInformation( permissions, callback )
		{
			var subPath = path.split( ':' )[ 1 ];
			path = localDoor.driveName + ':' + subPath;
			FriendNetworkExtension.sendMessage( { command: 'setFileInformation', permissions: permissions }, function( response )
			{
				if ( response.command == 'setFileInformationResponse' )
				{
					callback( response );
				}
			} );
		};
		function doRead( path, mode, callback )
		{
			path = getLocalFilePath( path );
			var totalChunks, encoding, loadedChunks, chunks;
			FriendNetworkExtension.sendMessage( { command: 'readFile', path: path, mode: mode }, function( response )
			{
				if ( response.command == 'readFileResponse' )
				{
					loadedChunks = 0;
					totalChunks = response.totalChunks;
					encoding = response.encoding;
					if ( encoding == 'base64' )
					{
						chunks = [];
						var loading = false;
						var handle = setInterval( function()
						{
							if ( loadedChunks < totalChunks )
							{
								if ( !loading )
								{
									loading = true;
									FriendNetworkExtension.sendMessage( { command: 'getFileChunk', number: loadedChunks }, function( response2 )
									{
										if ( response2.command == 'getFileChunkResponse' )
										{
											chunks[ response2.number ] = response2.data;
											loadedChunks++;
											loading = false;
										}
										else if ( response2.command == 'getFileChunkError' )
										{
											clearInterval( handle)
											callback ( 'fail<!--separate-->{ "response": "0" }' );
										}
									} );
								}								
							}
							else
							{
								clearInterval( handle );

								var file = '';
								for ( var number = 0; number < totalChunks; number++ )
								{
									file += chunks[ number ];
								}
								var data;
								if ( mode == 'rb' )
									data = ConvertStringToArrayBuffer( file, encoding );
								else
									data = ConvertBase64StringToString( file, encoding );

								callback( data );
							}
						}, 20 );
					}
				}
				else if ( message.command == 'readFileError' )
				{
					callback ( 'fail<!--separate-->{ "response": "0" }' );
				}
			} );
		};
		function doWrite( path, data, callback )
		{
			path = getLocalFilePath( path );
			
			// Prepare the chunks
			var file;
			if ( typeof data == 'string' )
				file = ConvertStringToBase64String( data );
			else
				file = ConvertArrayBufferToString( data, 'base64' );

			// How many chunks?
			var CHUNK_SIZE = ( 1024 * 256 );
			var numberOfChunks = Math.floor( file.length / CHUNK_SIZE );
			if ( numberOfChunks * CHUNK_SIZE < file.length )
				numberOfChunks++;
			
			// Send header to other side
			var message =
			{
				command: 'writeFile',
				path: path,
				numberOfChunks: numberOfChunks,
				chunkSize: CHUNK_SIZE,
				encoding: 'base64',
				totalSize: file.length
			};
			FriendNetworkExtension.sendMessage( message, function( response )
			{
				if ( response.command == 'writeFileResponse' )
				{
					// Send all the chunks
					var position = 0;
					var number = 0;
					var saving = false;
					var handle = setInterval( function()
					{
						if ( number < numberOfChunks )
						{
							if ( !saving )
							{
								saving = true;
								var size = CHUNK_SIZE;
								if ( position + size > file.length )
									size = file.length - position;
								if ( size > 0 )
								{
									var chunk = file.substr( position, size );
									message =
									{
										command: 'writeFileChunk',
										number: number,
										size: size,
										chunk: chunk
									};
									FriendNetworkExtension.sendMessage( message, function( response2 )
									{
										if ( response2.command == 'writeFileChunkResponse' )
										{
											saving = false;
										}
										else if ( response2.command == 'writeFileChunkError' )
										{
											// Error...
											clearInterval( handle );
											callback( 'fail<!--separate-->{ "response": "0" }' );
										}
									} );
								}
								position += size;
								number++;
							}
						}
						else
						{
							// Job done!
							clearInterval( handle );
							callback( 'ok<!--separate-->{ "response": "0" }' ); 		// ?
						}
					}, 20 );
				}
				else if ( response.command == 'writeFileError' )
				{
					callback ( 'fail<!--separate-->{ "response": "0" }' );
				}
			} );
		};
		function doDosAction( func, args, callback )
		{
			// Put the parameters in order
			var message =
			{
				command: 'dosAction',
				action: func
			};
			switch ( func )
			{
				case 'rename':
					var path = getLocalFilePath( args[ 'path' ] );
					var startPath = getPath( path );
					message[ 'arg0' ] = path;
					message[ 'arg1' ] = startPath + args[ 'newname' ];
					break;
				case 'delete':
				case 'makedir':
					var path = getLocalFilePath( args[ 'path' ] );
					message[ 'arg0' ] = path;
					break;
				case 'copy':
					var path = args[ 'from' ];
					var destination = args[ 'to' ];
					doRead( path, 'rb', function( data ) 
					{
						// Save file
						var save = new File( destination );
						save.save( data, null, 'wb' );
						callback( 'ok' );
					} );
					return;
			}

			// Send to extension
			FriendNetworkExtension.sendMessage( message, function( response )
			{
				if ( response.command == 'dosActionResponse' )
				{
					callback ( 'ok<!--separate-->{ "response": "0" }' );
				}
				else if ( response.command == 'dosActionError' )
				{
					callback ( 'fail<!--separate-->{ "response": "0" }' );
				}
			} );
		};
		function getLocalPath( path )
		{
			path = getLocalFilePath( path );
			var c = path.charAt( path.length - 1 );
			if ( c != ':' )
			{
				if ( c != '/' )
					path += '/';
			}
			return path;
		};
		function getLocalFilePath( path )
		{
			var subPath = path.split( ':' )[ 1 ];
			if ( !subPath )
				subPath = '';
			return localDoor.driveName + ':' + subPath;
		};
		function getPath( path )
		{
			var pos = path.lastIndexOf( '/' );
			if ( pos < 0 )
				pos = path.lastIndexOf( ':' );
			if ( pos >= 0 )
			{
				return path.substring( 0, pos + 1 );
			}
			return path;
		};
	},

	// Close a Dormant door previously open on the system
	closeLocalDormantDoor: function( localDoor )
	{
		var self = FriendNetworkDoor;

		for ( var d = 0; d < self.localDoors.length; d++ )
		{
			if ( localDoor = self.localDoors[ d ] )
			{
				DormantMaster.delAppDoor( localDoor );
				self.localDoors.splice( d, 1 );
				break;
			}
		}
	}
};
