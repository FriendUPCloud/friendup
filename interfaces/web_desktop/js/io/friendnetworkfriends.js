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
 * System interface with Friend Network
 *
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 12/04/2018
 */

var Friend = window.Friend || {};

FriendNetworkFriends =
{
	configVersion: 25,
	loadConfigs:
	{
		friends: true,
		pending: true,
		sharing: true,
		waiting: true,
		messages: true,
		conversations: true,
	},
	saveConfigs:
	{
		friends: true,
		pending: true,
		sharing: true,
		waiting: true,
		messages: true,
		conversations: true,
	},
	friends: [],
	activated: false,
	connected: false,
	acceptMessagesFromAny: false,
	downloadPath: '',
	workgroupPassword: 'public',
	workgroup: '',
	sendMessageViews: {},
	friendWidgets: [],
	sessionWidgets: [],
	connectedFriends: {},
	currentHostsCount: 0,
	autoMountSessionDrives: true,

	// Initialization entry
	start: function()
	{
		var self = FriendNetworkFriends;

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

		function doInit()
		{
			self.forceWidgetsRefresh = false;
			self.hostsUpdatesIdentifier = false;

			// Load the 'friendNotConnected' icon
			var notConnected = new Image();
			notConnected.onload = function()
			{
				self.friendNotConnectedIcon = notConnected;
			};
			notConnected.src = '/webclient/gfx/fnetFriendNotConnected.png';

			// Load the FriendNetworkDrive folder icon
			var friendNetworkDriveFolder = new Image();
			friendNetworkDriveFolder.onload = function()
			{
				self.friendNetworkDriveFolderIcon = this;
				var canvas = document.createElement( 'canvas' );
				canvas.width = 32;
				canvas.height = 32;
				var context = canvas.getContext( '2d' );
				context.drawImage( this, 0, 0, 32, 32  );
				self.friendNetworkDriveFolderIconBase64 = canvas.toDataURL();
			};
			friendNetworkDriveFolder.src = '/webclient/gfx/fnetDriveFolder.png';
			
			var friendNetworkDriveFile = new Image();
			friendNetworkDriveFile.onload = function()
			{
				self.friendNetworkDriveFileIcon = this;
				var canvas = document.createElement( 'canvas' );
				canvas.width = 32;
				canvas.height = 32;
				var context = canvas.getContext( '2d' );
				context.drawImage( this, 0, 0, 32, 32  );
				self.friendNetworkDriveFileIconBase64 = canvas.toDataURL();
			};
			friendNetworkDriveFile.src = '/webclient/gfx/fnetDriveFile.png';

			// Friend Network general setting first
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
					self.workgroup = fnet.workgroup;
					self.workgroupPassword = fnet.password;
					self.acceptMessagesFromAny = fnet.acceptAny;
					self.downloadPath = fnet.downloadPath ? fnet.downloadPath : '';
					self.powerSharing = fnet.powerSharing;
					
					// Load 'unknown' image
					var unknown = new Image();
					unknown.onload = function()
					{
						var canvas = document.createElement( 'canvas' );
						canvas.width = 32;
						canvas.height = 32;
						var context = canvas.getContext( '2d' );
						context.drawImage( this, 0, 0, 32, 32 );
						self.unknownIcon = canvas.toDataURL();
						self.unknownIconImage = this;

						// Load the FriendNetworkFriends configuration
						var m = new Module( 'system' );
						m.onExecuted = function( e, d )
						{
							self.friends = [];
							self.conversations = {};

							var data;
							if( e == 'ok' )
							{
								try
								{
									f = JSON.parse( d );
									if ( f.friendnetworkfriends != '[]' )
										data = f.friendnetworkfriends;
								}
								catch(e)
								{
								}
							}
							if ( typeof data == 'object' && data.configVersion == self.configVersion )
							{
								self.communicationHostBase = data.communicationHostBase;
								if ( self.loadConfigs[ 'friends' ] && data.friends && data.friends != '[]' )
								{
									self.friends = data.friends;

									// Creates necessary arrays
									for ( var f = 0; f < self.friends.length; f++ )
									{
										var netfriend = self.friends[ f ];

										// Creates remaining structures if not defined (should not happen)
										if ( !self.loadConfigs[ 'pending' ] || !netfriend.pending )
											netfriend.pending = [];
										if ( !self.loadConfigs[ 'waiting' ] || !netfriend.waiting )
											netfriend.waiting = [];
										if ( !self.loadConfigs[ 'sharing' ] || !netfriend.shared )
											netfriend.shared = [];
										if ( !self.loadConfigs[ 'messages' ] || !netfriend.messages )
											netfriend.messages = [];

										// Clear 'sending' state of pending messages
										for ( var p = 0; p < netfriend.pending.length; p++ )
											netfriend.pending[ p ].sending = false;

										// Creates the icon image
										if ( netfriend.icon )
										{
											var image = new Image();
											image.fnetFriend = netfriend;
											image.onload = function()
											{
												this.fnetFriend.iconImage = this;
												self.refreshFriendWidgets( true );
											};
											image.src = netfriend.icon;
										}
										else
										{
											netfriend.icon = self.unknownIcon;
											netfriend.iconImage = self.unknownIconImage;
											self.forceWidgetsRefresh = true;
										}

										// Load conversations
										if ( self.loadConfigs[ 'conversations' ] && data.conversations )
											self.conversations = data.conversations;

										// Wait for FriendNetworkDoor to be connected to share the folders
										var handle = setInterval( function()
										{
											if ( FriendNetworkDoor.connected )
											{
												clearInterval( handle );

												for ( var m = 0; m < netriend.waiting.length; m++ )
												{
													var message = netriend.waiting[ m ];
													switch ( message.subject )
													{
														case '<---folder--->':
															var door = ( new Door() ).get( message.path );
															if ( door )
															{
																FriendNetworkDoor.shareDoor( door,
																{
																	name: message.name,
																	type: 'folder (private)', // Private door
																	description: '',
																	password: message.password,
																	friend: friend
																} );
															}
															break;
														case '<---application--->':
															// Get the path to the folder containing the application
															var pos = message.path.lastIndexOf( '/' );
															var parentPath;
															if ( pos >= 0 )
																parentPath = message.path.substring( 0, pos + 1 );
															else
																parentPath = message.path.split( ':' )[ 0 ] + ':';
															var door = ( new Door() ).get( parentPath );
															if ( door )
															{
																FriendNetworkDoor.shareDoor( door,
																{
																	name: message.name,
																	type: 'application (private)',
																	description: message.content,
																	password: message.password,
																	friend: netfriend
																} );
															}
															break;
													}
												}
											}
										}, 100 );
									}
								}
							}

							// Register for hosts list update
							FriendNetwork.subscribeToHostListUpdates( { callback: updateHosts } );
							function updateHosts( msg )
							{
								if ( !self.hostsUpdatesIdentifier )
									self.hostsUpdatesIdentifier = msg.identifier;
								self.updateHostsList();
							};
							self.updateHostsList();

							// Temporary! Update host list at intervals
							self.handleUpdateHostsList = setInterval( function()
							{
								self.updateHostsList();
							}, 5000 );

							// Ask for information about this machine
							self.initSessionFriends();

							// Demand the information, with the device avatar and user definition of the device
							self.getDeviceInformation( '', function( infos )
							{
								self.machineInfos = infos;

								// Create the communication channel
								self.createCommunicationHost();
							} );

							// Initialize the communication with the extension, if present
							//FriendNetworkExtension.init( function( response ) 
							//{
							//	self.extensionConnected = response;
							//});


							// Regular tasks for friends (remove temporary, display notifications)
							self.handleFriendTasks = setInterval( function()
							{
								// Make the icons flash again
								for ( var f = 0; f < self.friends.length; f++ )
								{
									var netfriend = self.friends[ f ];
									if ( netfriend.toFlash )
									{
										netfriend.toFlash = false;
										self.flashFriendWidget( netfriend )
									}
								}

								// Try to connect to everyone
								self.connectToFriends();

								// Detect new sessions
								self.refreshSessionFriends();

								// Display pending notification bubbles
								self.displayNotifications();

								// Removes temporary friends when no more use
								self.removeTemporaryFriends();

							}, 5000 );

							// Connectivity watchdog (can be left open in case of disconnection of the server)
							if ( !self.handleWatchDog )
							{
								self.handleWatchDog = setInterval( function()
								{
									self.watchDog();
								}, 500 );
							}							
						};
						m.execute( 'getsetting', { 'setting': 'friendnetworkfriends' } );
					};
					unknown.src = '/webclient/gfx/fnetFriendUnknown.png';
				}
			};
			sm.execute( 'getsetting', { setting: 'friendNetwork' } );
		}
	},

	// Shut off the system!
	close: function()
	{
		var self = FriendNetworkFriends;
		if ( !self.activated )
			return;

		// Close communication with the extension
		//FriendNetworkExtension.close();

		// Close update hosts list interval
		if ( self.handleUpdateHostsList )
		{
			clearInterval( self.handleUpdateHostsList );
			self.handleUpdateHostslist = false;
		}

		// Close remove temporary friends
		if ( self.handleFriendTasks )
		{
			clearInterval( self.handleFriendTasks );
			self.handleFriendTasks = false;
		}

		// Stop hosts updates
		if ( self.hostsUpdatesIdentifier )
		{
			FriendNetwork.unsubscribeFromHostListUpdates( { identifier: self.hostsUpdatesIdentifier } );
			self.hostsUpdatesIdentifier = false;
		}

		// Close open connections, if the server is still connected
		if ( self.connected )
		{
			// Close all session friends
			self.closeSessionFriends();

			// Close communication channel
			if ( self.commHostKey )
			{
				FriendNetwork.disposeHosting( { key: self.commHostKey } );
			}

			// Close the watchdog
			if ( self.handleWatchDog )
			{
				clearInterval( self.handleWatchDog );
				self.handleWatchDog = false;
			}
		}
		self.commHostKey = false;

		// Closes all connected friends (if the server is this connected)
		for ( var f = 0; f < self.friends.length; f++ )
			self.disconnectFriend( self.friends[ f ] );

		// Close all open views
		self.closeAllFriendViews();

		// Remove all widgets
		self.removeFriendWidgets();

		self.activated = false;
		self.connected = false;
	},

	// Watch if the workspace is disconnected
	watchDog: function()
	{
		var self = FriendNetworkFriends;
		var connected = Friend.User.ServerIsThere;
		if ( self.connected != connected )
		{
			self.connected = connected;
			if ( self.connected )
			{
				self.start();
			}
			else
			{
				self.close();
			}
		}
	},

	// Close all the views that can be open
	closeAllFriendViews: function()
	{
		var self = FriendNetworkFriends;
		self.onPlusCancel();
		self.onSendNotificationCancel();
		self.onPasswordCancel();
		self.onSendApplicationCancel();
		self.onSendFolderCancel();
		self.onSendFileCancel();
		for ( var name in self.sendMessageViews )
			self.onSendMessageCancel( name );
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

	// Take into account modifications in the preferences of Friend Network
	changeFriendNetworkSettings: function( fnet )
	{
		var self = FriendNetworkFriends;

		// Set a timeout for the data to be saved on the server
		setTimeout( function()
		{
			if ( self.activated )
			{
				self.acceptMessagesFromAny = fnet.acceptAny;
				self.downloadPath = fnet.downloadPath;

				// If change in the name of the workgroup-> erase all!
				if ( fnet.workgroup != self.workgroup )
				{
					self.workgroupPassword = fnet.password;
					self.workgroup = fnet.workgroup;
					self.communicationHostBase = false;
					self.friends = [];
				}
				else if ( self.workgroupPassword != fnet.password )
				{
					self.workgroupPassword = fnet.password;
					for ( var f = 0; f < self.friends.length; f++ )
						self.friends[ f ].badPassword = false;
				}
				self.close();
			}
			// Restart after all closing job has been done
			setTimeout( function()
			{
				self.activate( fnet.activated );				
			}, 1000 );
		}, 1000 );
	},

	// Updates the password of the community
	updateWorkgroupPassword: function( newPassword )
	{
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
			if ( fnet )
			{
				fnet.password = newPassword;
				var m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					if( e != 'ok' )
						console.log( 'Friend Network saving failed.' );
				}
				m.execute( 'setsetting', { setting: 'friendNetwork', data: fnet } );
			}
		};
		sm.execute( 'getsetting', { setting: 'friendNetwork' } );
	},

	// Save the data in the config
	storeFriends: function()
	{
		var self = FriendNetworkFriends;

		if ( self.activated )
		{
			// Keep only the names
			var friends = [];
			for ( var f = 0; f < self.friends.length; f++ )
			{
				var netfriend = self.friends[ f ];
				if ( netfriend.session )
					continue;
				var data = {};
				if ( self.saveConfigs[ 'friends' ] )
				{
					data.name = netfriend.name;
					data.hostName = netfriend.hostName;
					data.icon = netfriend.icon ? netfriend.icon : false;
					data.fullName = netfriend.fullName ? netfriend.fullName : false;
					data.temporary = netfriend.temporary ? true : false;
					data.keepOpen = netfriend.keepOpen ? true : false;
					data.toFlash = netfriend.handleFlash ? true : false;
					if ( self.saveConfigs[ 'pending' ] )
						data.pending = netfriend.pending;
					if ( self.saveConfigs[ 'waiting' ] )
						data.waiting = netfriend.waiting;
					if ( self.saveConfigs[ 'sharing' ] )
						data.shared = netfriend.shared;
					if ( self.saveConfigs[ 'messages' ] )
						data.messages = netfriend.messages;
					friends.push( data );
				}
			}

			// The conversations
			var conversations = {};
			if ( self.saveConfigs[ 'conversations' ] )
				conversations = self.conversations;

			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
			}
			m.execute( 'setsetting',
			{
				setting: 'friendnetworkfriends',
				data: 
				{ 
					friends: friends, 
					conversations: conversations, 
					configVersion: self.configVersion, 
					communicationHostBase: self.communicationHostBase  
				}
			} );
		}
	},

	// Create the communication host
	createCommunicationHost: function()
	{
		var self = FriendNetworkFriends;

		// Name of the host
		if ( !self.communicationHostBase )
		{
			self.communicationHostBase = self.workgroup + '|' + self.machineInfos.os + '|' + Math.random() * 1000000;
			self.storeFriends();
		}

		// Open the host
		var tags = [];
		if ( self.powerSharing && self.powerSharing.enabled )
		{
			tags.push( '###power ' );
		}
		self.communicationHostName = self.communicationHostBase + ':::)' + Math.random() * 1000000;		// Add random to the name
		FriendNetwork.startHosting
		(
			{
				name: self.communicationHostName,
				connectionType: 'communication',
				description: 'Friend Network communication channel',
				password: self.workgroupPassword,
				data:
				{
					workgroup: self.workgroup,
					machineInfos: self.machineInfos,
					image: self.machineInfos.icon,
					tags: tags
				},
				callback: self.handleCommunicationHost
			}
		);
	},

	// Removes the variable part in the name of a host
	cleanHostName: function( hostName )
	{
		var start = hostName.indexOf( ':::)' );
		var end = hostName.lastIndexOf( '@' );
		if ( start >= 0 && end > start )
			return hostName.substring( 0, start ) + hostName.substring( end );
		return hostName;
	},



	// Main communication host
	handleCommunicationHost: function( msg )
	{
		var self = FriendNetworkFriends;
		switch ( msg.command )
		{
			case 'friendnetwork':
				switch ( msg.subCommand )
				{
					// Host properly created
					case 'host':
						console.log( 'Friend Network Share: comm host created' );
						self.commHostKey = msg.hostKey;
						break;

					// New client connected
					case 'clientConnected':
						console.log( 'Friend Network Share: ' + msg.name + ' connected' );
						// A friend!
						self.connectedFriends[ msg.key ] =
						{
							name: msg.name,
							messages: []
						};
						self.refreshFriendWidgets( true );
						break;

					// Client disconnected
					case 'clientDisconnected':
						console.log( 'Friend Network Share: ' + self.connectedFriends[ msg.key ].name + ' disconnected' );

						// A friend or a session?
						if ( self.connectedFriends[ msg.key ] )
						{
							self.connectedFriends[ msg.key ] = false;
							self.connectedFriends = self.cleanArray( self.connectedFriends );
							self.refreshFriendWidgets( true );
						}
						break;

					// Error: removes share
					case 'error':
						if ( self.connectedFriends[ msg.key ] )
						{
							self.connectedFriends[ msg.key ] = false;
							self.connectedFriends = self.cleanArray( self.connectedFriends );
							self.refreshFriendWidgets( true );
						}
						break;

					// Handle commands
					case 'messageFromClient':
						var connected = self.connectedFriends[ msg.key ];
						if ( connected )
						{
							var netfriend = self.getFriendFromName( connected.name );
							switch ( msg.data.command )
							{
								case 'sessionToSession':
									var message = msg.data.message;
									switch( message.command )
									{
										// A garder!
										case 'knockKnock?':
											if( netfriend )
											{
												if ( !netfriend.sharingLocalDoors )
												{
													netfriend.sharingLocalDoors = true;

													// Scan the localdoors
													for ( var d = 0; d < FriendNetworkDoor.localDoors.length; d++ )
													{
														var localDoor = FriendNetworkDoor.localDoors[ d ];
														var door = ( new Door() ).get( localDoor.title + ':' );
														if ( door )
														{
															localDoor.checkDoor = door;
															var title = localDoor.title + ' on ' + netfriend.name
															FriendNetworkDoor.shareDoor( door,
															{
																name : localDoor.title,
																type: 'drive (session)',
																password: '' + Math.random() * 1000000 + Math.random() * 1000000,
																friend: netffriend
															} );			
														}
													}
													var handle = setInterval( function()
													{
														var done = true;
														for ( var dd = 0; dd < FriendNetworkDoor.localDoors.length; dd++ )
														{
															var localDoor = FriendNetworkDoor.localDoors[ dd ];
															if ( !localDoor.checkDoor.connected )
															{
																done = false;
																break;
															}
														}
														if ( done )
														{
															clearInterval( handle );
															var response =
															{
																command: 'knockKnock?Response',
																doors: []
															}			
															for ( dd = 0; dd < FriendNetworkDoor.localDoors.length; dd++ )
															{
																var localDoor = FriendNetworkDoor.localDoors[ dd ];
																response.doors.push
																( 
																	{
																		name: localDoor.title,
																		drive: localDoor.driveName,
																		password: localDoor.checkDoor.share.password
																	}
																)
																localDoor.checkDoor = false;
															}		
															self.pushPending( netfriend,
															{
																type: 'sessionToSession',
																id: msg.data.id,
																message: response
															} );
														}				
													}, 100 );
												}
											}
											break;
											
										case 'knockKnock?Response':
											netfriend.knockKnock = false;
											netfriend.sessionConnecting = false;
											netfriend.sessionConnected = true;
											self.activateSessionFriend( netfriend );
											var handle = setInterval( function()
											{
												for ( var d = 0; d < message.doors.length; d++ )
												{													
													var door = message.doors[ d ];
													if ( !door.connecting && !door.connected )
													{
														door.connecting = true;
														FriendNetworkDoor.connectToDoor( netfriend.name, door.name, 'drive (session)', door.password, function( response, connection, extra )
														{
															if ( response == 'connected' )
															{
																extra.connecting = false;
																extra.connected = true;
	
																// Add the fileinfo to the Workspace icons
																if ( self.machineInfos.mountLocalDrives )
																{
																	var fileInfo =
																	{
																		ID:       undefined,
																		MetaType: 'Directory',
																		Path:     connection.door.title + ':',
																		Title:    connection.door.title,
																		Volume:   connection.door.title + ':',
																		Filesize: 0,
																		Filename: connection.door.title + ':',
																		Type: 'Dormant',
																		Dormant: connection.door,
																		Mounted: true,
																		Visible: true,
																		AutoMount: true
																	};
																	Workspace.icons.push( fileInfo );
																	Workspace.refreshDesktop();
																	Workspace.redrawIcons();
																}
									
																// Open the directoryView
																//OpenWindowByFileinfo( fileInfo );
															}
															else
															{
																extra.connecting = false;
																extra.connected = false;
															}
															var done = true;
															for ( var d = 0; d < message.doors.length; d++ )
															{
																if ( !message.doors[ d ].connected )
																{
																	done = false;
																	break;
																}
																if ( done )
																{
																	clearInterval( handle );
																}
															}
														}, false, door );
													}
												}
											}, 1000 );
											break;

										default:
											FriendNetworkExtension.sendMessageToExtension( message, function( response )
											{
												// Send the answer back to the friend who asked for it
												self.pushPending( netfriend,
												{
													type: 'sessionToSession',
													id: msg.data.id,
													message: response
												} );
											} );
											break;
									}
									break;
								case 'message':
									var accepted = false;
									var message = msg.data.message;
									if ( netfriend )
									{
										var noFlash = false;

										// If notification -> push in messages
										if ( message.subject == '<---notification--->' )
										{
											self.pushMessage( netfriend, message );
											netfriend.notification = message;
										}
										else if ( message.subject == '<---file--->' )
										{
											if ( self.downloadPath != '' )
											{
												var fileName = self.getFileName( message.path );
												self.pushPending( netfriend,
												{
													type: 'getFile',
													id: message.id,
													path: message.path,
													saveTo: self.downloadPath + fileName
												} );
												noFlash = true;
											}
											self.pushMessage( netfriend, message );
										}
										else if ( message.subject != '<---file--->' && message.subject != '<---folder--->' && message.subject != '<---application--->' )
										{
											if ( !self.conversations[ message.conversationId ] )
												self.conversations[ message.conversationId ] = [];
											self.conversations[ message.conversationId ].push( message );
											// Update conversations. If conversation open, do not push the message
											if ( !self.updateOpenConversations( netfriend, message.id, message.conversationId ) )
												self.pushMessage( netfriend, message );
										}
										else
										{
											// Store the message in friend shared array
											self.pushShared( netfriend, message );
										}
										if ( !noFlash )
											self.flashFriendWidget( netfriend );
										accepted = true;
									}
									else
									{
										if ( self.acceptMessagesFromAny )
										{
											// Creates a temporary friend
											var pend =
											{
												type: 'getInformation',
												id: self.getUniqueIdentifier( 'getInfo' )
											};
											var newFriend =
											{
												temporary: true,
												name: message.from,
												hostName: message.hostName + '@' + message.from,
												messages: [],
												pending: [ pend ],
												waiting: [],
												shared: [],
												icon: self.unknownIcon,
												iconImage: self.unknownIconImage
											};
											var noFlash = false;
											if ( message.subject == '<---notification--->' )
											{
												self.pushMessage( newFriend, message );
												newFriend.notification = message;
											}
											else if ( message.subject == '<---file--->' )
											{
												if ( self.downloadPath != '' )
												{
													var fileName = self.getFileName( message.path );
													self.pushPending( newFriend,
													{
														type: 'getFile',
														id: message.id,
														path: message.path,
														saveTo: self.downloadPath + fileName
													} );
													noFlash = true;
												}
												self.pushMessage( newFriend, message );
											}
											else if ( message.subject != '<---file--->' && message.subject != '<---folder--->' && message.subject != '<---application--->')
											{
												self.pushMessage( newFriend, message );
												if ( !self.conversations[ message.conversationId ] )
													self.conversations[ message.conversationId ] = [];
												self.conversations[ message.conversationId ].push( message );
											}
											else
											{
												self.pushShared( newFriend, message );
											}
											self.friends.push( newFriend );
											self.refreshFriendWidgets( true );
											if ( !noFlash )
												self.flashFriendWidget( newFriend );
											self.storeFriends();
											accepted = true;
										}
									}
									FriendNetwork.send( { key: msg.key, data: { command: 'messageResponse', id: msg.data.id, accepted: accepted } } );
									return;
								case 'getFile':
									if ( netfriend )
									{
										self.removeWaiting( netfriend, msg.data.id );

										// Load the file
										var file = new File( msg.data.path )
										file.onLoad = function( data )
										{
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
													command: 'getFileResponse',
													type: type,
													id: msg.data.id
												}
											} );
										}
										file.load( 'rb' );
									}
									break;
								case 'getInformation':
									var information =
									{
										icon: FriendNetworkShare.userInformation.image,
										fullName: Workspace.fullName
									};
									FriendNetwork.send( { key: msg.key, data: { command: 'getInformationResponse', id: msg.data.id, information: information } } );
									return;
								case 'refuseMessage':
									if ( netfriend && netfriend.waiting )
									{
										for ( var m = 0; m < netfriend.waiting.length; m++ )
										{
											if ( netfriend.waiting[ m ].id == msg.data.id )
											{
												netfriend.waiting[ m ].refused = true;
												self.storeFriends();
												self.refreshTrayIconBubble( netfriend );
												break;
											}
										}
										FriendNetwork.send( { key: msg.key, data: { command: 'refuseMessageResponse', id: msg.data.id } } );
									}
									break;
								case 'messageRead':
									if ( netfriend )
									{
										self.removeWaiting( netfriend, msg.data.id );
										FriendNetwork.send( { key: msg.key, data: { command: 'messageReadResponse', id: msg.data.id } } );
									}
									break;
								case 'stopShare':
									// Closes the door
									FriendNetworkDoor.closeSharedDoor( netfriend.name, msg.data.name );

									// Removes from 'shared' list
									for ( var s = 0; s < netfriend.shared.length; s++ )
									{
										if ( netfriend.shared[ s ].name == msg.data.name )
										{
											self.removeShared( netfriend, s );
											break;
										}
									}
									self.refreshFriendWidgets();
									FriendNetwork.send( { key: msg.key, data: { command: 'stopShareResponse', id: msg.data.id } } );
									break;
								case 'stopShareFile':
									// Removed from message list
									for ( var s = 0; s < netfriend.messages.length; s++ )
									{
										var mes = netfriend.messages[ s ];
										if ( mes.subject == '<---file--->' && mes.name == msg.data.name )
										{
											self.removeMessage( netfriend, s );
											break;
										}
									}
									self.refreshFriendWidgets();
									FriendNetwork.send( { key: msg.key, data: { command: 'stopShareFileResponse', id: msg.data.id } } );
									break;
								case 'stopShareApplication':
									// Removed from 'shared' list
									for ( var s = 0; s < netfriend.shared.length; s++ )
									{
										if ( netfriend.shared[ s ].name == msg.data.name )
										{
											self.removeShared( netfriend, s );
											break;
										}
									}
									self.refreshFriendWidgets();
									FriendNetwork.send( { key: msg.key, data: { command: 'stopShareApplicationResponse', id: msg.data.id } } );
									break;
								default:
									break;
							}
						}
				}
				break;
		}
	},

	// Scans the non connected friends and tries to reconnect
	connectToFriends: function()
	{
		var self = FriendNetworkFriends;

		// Look for non connected
		for ( var f = 0; f < self.friends.length; f++ )
		{
			var netfriend = self.friends[ f ];

			// Trying to connect? Timeout!
			/*
			if ( !Friend.connected && Friend.connecting && !Friend.badPassword )
			{
				var time = new Date().getTime();
				if ( time - Friend.connectingTime > 1000 * 10 )			// 10 seconds timeout
				{
					Friend.connecting = false;

					// Kills the connection
					FriendNetwork.disconnectFromHostByName( { hostName: Friend.name } );
				}
			}
			*/

			// Not connected yet online? Try to connect!
			if( netfriend.listedInHosts && !netfriend.connected && !netfriend.connecting )
			{
				// Find the name
				if( netfriend.badPassword )
				{
					netfriend.connectingTime = new Date().getTime();
					netfriend.badPasswordDelay++;
					if( netfriend.badPasswordDelay > 30 )
						self.connectFriend( netfriend );
				}
				else
				{
					netfriend.connectingTime = new Date().getTime();
					self.connectFriend( netfriend );
				}
			}

			// Connected? Send eventual pending messages
			if( netfriend.connected )
			{
				self.sendPendingMessages( netfriend );
			}
		}
	},

	// Disconnects from a friend
	disconnectFriend: function( netfriend )
	{
		var self = FriendNetworkFriends;
		if( self.connected )
		{
			if( netfriend.connected )
			{
				FriendNetwork.disconnectFromHost( { key: netfriend.communicationKey } );
			}
		}
		else if( netfriend.connecting )
		{
			FriendNetwork.disconnectFromHostByName( { hostName: netfriend.name } );
		}
		netfriend.connected = false;
		netfriend.connecting = false;
		netfriend.communicationKey = false;
	},

	// Friend client handling
	connectFriend: function( netfriend )
	{
		var self = FriendNetworkFriends;

		netfriend.connecting = true;
		netfriend.passwordCount = 0;

		// Get the root of the host name (removing the random value)
		var hostName = self.cleanHostName( netfriend.hostName );
		FriendNetwork.connectToHost( { url: hostName, hostType: 'communication', p2p: true, encryptMessages: true, callback: handleMessages } );

		// Handles FriendNetwork messages
		function handleMessages( msg )
		{
			switch ( msg.subCommand )
			{
				case 'getCredentials':
					FriendNetwork.sendCredentials( { key: msg.key, password: self.workgroupPassword, encrypted: true } );
					break;

				case 'connected':
					var nf = self.getFriendFromHostName( msg.hostName );
					if( nf )
					{
						nf.communicationKey = msg.key;
						nf.connecting = false;
						nf.connected = true;

						// Ask for icon and name
						self.pushPending( nf,
						{
							type: 'getInformation',
							id: self.getUniqueIdentifier( 'getInfo' )
						} );

						// Will send the pending messages
						self.refreshFriendWidgets( true );
						console.log( 'Friend Network Friends: connected to ' + msg.hostName );

						// If a new password has been entered, update the settings
						if( nf.newPassword )
						{
							nf.newPassword = false;
							FriendNetworkFriends.updateWorkgroupPassword( nf.newPassword );
						}
					}
					break;

				case 'hostDisconnected':
					var nf = self.getFriendFromKey( msg.key );
					if( nf )
					{
						console.log( 'Friend Network Share: communication host of ' + nf.name + ' disconnected.' );
						nf.connecting = false;
						nf.connected = false;
						nf.communicationKey = false;
						if( !nf.session )
							self.refreshFriendWidgets( true );
						else
							self.closeSessionFriend( nf );
					}
					break;

				case 'messageFromHost':
					var nf = self.getFriendFromKey( msg.key );
					if( nf )
					{
						// Find the pending structure
						var pending;
						for( var pendingNum = 0; pendingNum < nf.pending.length; pendingNum++ )
						{
							if( msg.data.id == nf.pending[ pendingNum ].id )
							{
								pending = nf.pending[ pendingNum ];
								break;
							}
						}
						if( pending )
						{
							switch ( msg.data.command )
							{
								case 'sessionToSession':
									var message = msg.data.message;
									break;

								// Message received: add to conversation, store in friend 'Waiting' list
								case 'messageResponse':
									var message = pending.message;

									if ( msg.data.accepted )
									{
										if ( message.subject != '<---file--->' && message.subject != '<---application--->' && message.subject != '<---folder--->'&& message.subject != '<---notification--->' )
										{
											// Add message to conversation
											if ( !self.conversations[ message.conversationId ] )
												self.conversations[ message.conversationId ] = [];
											self.conversations[ message.conversationId ].push( message );
											self.updateOpenConversations( nf, message.id, message.conversationId );
										}
									}
									else
										message.refused = true;

									// Add message to 'waiting' list
									self.pushWaiting( nf, message );

									// Remove from pending list
									self.removePending( nf, pendingNum );
									break;

								// Information demand callback: store data into friend
								case 'getInformationResponse':
									nf.fullName = msg.data.information.fullName;
									nf.icon = msg.data.information.icon;

									// Create the image for widget display
									var image = new Image();
									image.onload = function()
									{
										nf.iconImage = this;
										self.refreshFriendWidgets( true );
									}
									image.src = nf.icon;
									self.storeFriends();

									// Remove from pending list
									self.removePending( nf, pendingNum );
									self.forceWidgetsRefresh = true;
									break;

								// Confirmation of message receival: remove from pending list
								case 'stopShareFileResponse':
								case 'stopShareApplicationResponse':
								case 'stopShareResponse':
								case 'messageReadResponse':
								case 'refuseMessageResponse':
									// Remove from pending list
									self.removePending( nf, pendingNum );
									break;

							}
						}
					}
					break;

				case 'fileFromHost':
					var nf = self.getFriendFromKey( msg.key );
					if( nf )
					{
						// Find the pending structure
						var pending;
						for ( var pendingNum = 0; pendingNum < nf.pending.length; pendingNum++ )
						{
							if ( msg.infos.id == nf.pending[ pendingNum ].id )
							{
								pending = nf.pending[ pendingNum ];
								break;
							}
						}

						// Save the file
						var type = '';
						var data = msg.file;
						if( msg.infos.type == 'binaryString' || msg.infos.type == 'base64' )
						{
							data = ConvertStringToArrayBuffer( data, msg.infos.type );
							type = 'wb';
						}

						var save = new File( pending.saveTo );
						save.save( data, null, type );

						// Remove from pending
						self.removePending( nf, pendingNum );

						// Mark file as downloaded
						for( var m = 0; m < nf.messages.length; m++ )
						{
							if( nf.messages[ m ].id == msg.infos.id )
							{
								nf.messages[ m ].loaded = true;
								nf.messages[ m ].loading = false;
								nf.messages[ m ].saveTo = pending.saveTo;
								setTimeout( function()
								{
									self.notifyFriend( nf, 'Friend Network', 'File ' + self.getFileName( nf.messages[ m ].path ) + ' successfully saved.' );
								}, 2000 );
								break;
							}
						}
						self.storeFriends();
					}
					break;

				case 'fileDownloading':
					var nf = self.getFriendFromKey( msg.key );
					if( nf )
					{
						// Mark file as downloaded
						for( var m = 0; m < nf.messages.length; m++ )
						{
							if( nf.messages[ m ].id == msg.infos.id )
							{
								nf.messages[ m ].loading = true;
								nf.messages[ m ].percentLoaded = msg.infos.percentLoaded;
								break;
							}
						}
					}
					break;

				case 'error':
					var nf = self.getFriendFromHostName( msg.response );
					if( nf )
					{
						if( msg.error == 'ERR_WRONG_CREDENTIALS' )
						{
							// Keep quiet if trying to reconnect
							if( nf.badPassword )
							{
								FriendNetwork.sendCredentials( { key: msg.key, password: '<---aborted--->', encrypted: true } );
								return;
							}
							// Ask for password
							nf.passwordKey = msg.key;
							var title;
							if( nf.passwordCount == 0 )
								title = i18n( 'i18n_connectinTo' ) + name + i18n( 'i18n_pleaseEnterPassword' );
							else
								title = i18n( 'i18n_passwordsDoNotMatch' );
							self.getPassword( title, Friend.name, 'onWrongPassword' );
							nf.passwordCount++;
							return;
						}
						else if( msg.error == 'ERR_FAILED_CREDENTIALS' )
						{
							Alert( i18n( 'i18n_FriendNetwork' ), i18n( 'i18n_connectionFailed' ) );
							nf.badPassword = true;
							nf.badPasswordDelay = 0;
						}
						else if( msg.error == 'ERR_CONNECTION_ABORTED' )
						{
							if( !nf.badPassword )
								Alert( i18n ( 'i18n_FriendNetwork' ), i18n( 'i18n_connectionAborted' ) );
							nf.badPassword = true;
							nf.badPasswordDelay = 0;
						}
						console.log( 'Friend Network Share: connection attempt to ' + hostName + ' failed...' );
						nf.connecting = false;
						nf.connected = false;
						nf.communicationKey = false;
						if ( !nf.session )
							self.refreshFriendWidgets( true );
						else
							self.closeSessionFriend( nf );
					}
					else
					{
						// should not happen!
						console.log( 'Should NOT happen!' );
					}
					break;

				default:
					break;
			}
		}
	},

	// Get the list of hosts from Friend Network and updates the display
	updateHostsList: function( callback )
	{
		var self = FriendNetworkFriends;

		// Get new list
		FriendNetwork.listHosts( { callback: doListHosts } );
		function doListHosts( msg )
		{
			self.currentHosts = msg.hosts;
			self.currentHostsCount++;
			if ( !callback )
				self.refreshFriendWidgets();
			else
				callback( self.currentHosts );
		}
	},

	// Same but different! :) TODO: cleanup!
	updateHost: function()
	{
		var self = FriendNetworkFriends;

		// Get new list
		FriendNetwork.listHosts( { callback: doListHosts } );
		function doListHosts( msg )
		{
			self.currentHosts = msg.hosts;
			self.refreshFriendWidgets();
		}
	},

	// Same but different! :) TODO: cleanup!
	getHostsList: function( callback, extra )
	{
		return this.currentHosts;
	},

	// Send all the pending messages of a friend
	sendPendingMessages: function( netfriend )
	{
		var self = FriendNetworkFriends;
		if ( netfriend.pending && netfriend.pending.length )
		{
			for ( var p = 0; p < netfriend.pending.length; p++ )
			{
				var pending = netfriend.pending[ p ];
				if ( !pending.sending )
				{
					switch( pending.type )
					{
						case 'sessionToSession':
							FriendNetwork.send( { key: netfriend.communicationKey, data: { command: 'sessionToSession', id: pending.id, type: pending.type, message: pending.message } } );
							pending.sending = true;
							break;
						case 'message':
							FriendNetwork.send( { key: netfriend.communicationKey, data: { command: 'message', id: pending.id, type: pending.type, message: pending.message } } );
							pending.sending = true;
							break;
						case 'getInformation':
							FriendNetwork.send( { key: netfriend.communicationKey, data: { command: 'getInformation', id: pending.id, type: pending.type } } );
							pending.sending = true;
							break;
						case 'refuseMessage':
							FriendNetwork.send( { key: netfriend.communicationKey, data: { command: 'refuseMessage', id: pending.id, type: pending.type } } );
							pending.sending = true;
							break;
						case 'messageRead':
							FriendNetwork.send( { key: netfriend.communicationKey, data: { command: 'messageRead', id: pending.id, type: pending.type } } );
							pending.sending = true;
							break;
						case 'getFile':
							FriendNetwork.send( { key: netfriend.communicationKey, data: { command: 'getFile', id: pending.id, type: pending.type, path: pending.path, saveTo: pending.saveTo } } );
							pending.sending = true;
							break;
						case 'stopShare':
							FriendNetwork.send( { key: netfriend.communicationKey, data: { command: 'stopShare', id: pending.id, name: pending.name } } );
							pending.sending = true;
							break;
						case 'stopShareApplication':
							FriendNetwork.send( { key: netfriend.communicationKey, data: { command: 'stopShareApplication', id: pending.id, type: pending.type, name: pending.name, path: pending.path } } );
							pending.sending = true;
							break;
						case 'stopShareFile':
							FriendNetwork.send( { key: netfriend.communicationKey, data: { command: 'stopShareFile', id: pending.id, type: pending.type, name: pending.name, path: pending.path } } );							pending.sending = true;
							break;
						default:
							break;
					}
				}
			}
		}
	},

	// Password dialog
	///////////////////////////////////////////////////////////////////////////

	// Open the password dialog
	getPassword: function( title, name, callback )
	{
		var self = FriendNetworkFriends;
		if ( !self.passwordView )
		{
			self.passwordView = new View(
			{
				title: title,
				width: 400,
				height: 100,
				resize: false
			} );
			var html = '\
						<div class="VContentTop Padding ScrollArea">\
							<table border="0" class="FullWidth">\
				 				<tr>\
							 		<td align="left"><strong>' + i18n( 'i18n_password' ) + ': </strong></td>\
							 		<td align="left"><input type="password" id="password" size="40" id="password">\
								</tr>\
							</table>\
						</div>\
						<div class="VContentBottom BorderTop Padding BackgroundDefault" style="height: 50px">\
							<button type="button" class="FloatRight Button IconSmall fa-times" onclick="FriendNetworkFriends.onPasswordCancel( \'' + callback + '\', \'' + name + '\');">\
								Cancel\
							</button>\
							<button type="button" class="Button IconSmall fa-check" onclick="FriendNetworkFriends.onPasswordOK( \'' + callback + '\', \'' + name + '\' )">\
								OK\
							</button>\
						</div>';
			self.passwordView.setContent( html );
		}
	},

	// User has clicked on 'Cancel'
	onPasswordCancel: function( callback, name )
	{
		var self = FriendNetworkFriends;
		if ( self.passwordView )
		{
			self.passwordView.close();
			self.passwordView = false;
			if ( callback )
				FriendNetworkFriends[ callback ]( false, name );
		}
	},

	// User has clicked on 'OK'
	onPasswordOK: function( callback, name )
	{
		var self = FriendNetworkFriends;
		var password = self.getViewElement( self.passwordView, 'input', 'password' ).value;
		self.passwordView.close();
		self.passwordView = false;
		if ( callback )
			FriendNetworkFriends[ callback ]( true, name, password );
	},

	// Wrong password was  entered upon connection!
	onWrongPassword: function( response, name, password )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		if ( response )
		{
			netfriend.newPassword = password;
			FriendNetwork.sendCredentials( { key: netfriend.passwordKey, password: password, encrypted: true } );
		}
		else
		{
			FriendNetwork.sendCredentials( { key: netfriend.passwordKey, password: '<---aborted--->', encrypted: true } );
		}
	},

	// Friend widget handling
	///////////////////////////////////////////////////////////////////////////

	// Refresh the friend widgets on the Workspace
	// Force if set to true will also display/remove friends
	refreshFriendWidgets: function( doForce )
	{
		var self = FriendNetworkFriends;
		if ( !self.connected || !self.activated )
			return false;

		var force = self.forceWidgetsRefresh;
		self.forceWidgetsRefresh = false;
		if ( doForce )
			force |= true;

		// Check to see if there is need to do a modification
		if ( self.currentHosts )
		{
			var hosts = self.currentHosts;

			var toChange = false;

			// For each friend
			for ( var f = 0; f < self.friends.length; f++ )
			{
				var netfriend = self.friends[ f ];
				if ( netfriend.session )
					continue;

				netfriend.online = false;
				netfriend.listedInHosts = false;

				// Is the friend still present in the hosts?
				var friendFound = false;
				for ( var h = 0; h < hosts.length; h++ )
				{
					if ( hosts[ h ].name == netfriend.name )
					{
						// Register for modifications in apps list for this host
						if ( !netfriend.hostSubscribed )
						{
							netfriend.hostSubscribed = hosts[ h ].hostId;
							FriendNetwork.subscribeToHostUpdates( { key: hosts[ h ].hostId, callback: self.updateHost } );
						}

						// Store the apps of the friend
						if ( !hosts[ h ].apps )
						{
							// Set a timeout to retry
							setTimeout( function()
							{
								console.log( 'Waiting for apps in host ' + netfriend.name );
								self.updateHostsList();
							}, 1000 );
						}
						else
						{
							netfriend.apps = hosts[ h ].apps;
							netfriend.listedInHosts = true;

							// Look for communication channel
							if( netfriend.connected )
							{
								friendFound = true;
								netfriend.online = true;

								var apps = netfriend.apps;
								for ( var a = 0; a < apps.length; a++ )
								{
									if ( apps[ a ].type == 'communication' )
									{
										// Remove 'shared' entries if the folders are no shared anymore
										for ( var s = 0; s < netfriend.shared.length; s++ )
										{
											var share = netfriend.shared[ s ];
											var found = false;
											for ( var aa = 0; aa < apps.length; aa++ )
											{
												if ( apps[ aa ].name == share.name )
												{
													found = true;
													break;
												}
											}
											if ( !found )
											{
												FriendNetworkDoor.disconnectFromDoor( netfriend.name, share.name );
											}
										}
									}
								}
							}

							// Close connections if they are established
							if ( !netfriend.online )
							{
								FriendNetworkDoor.disconnectFromDoor( netfriend.name );
							}

							// Friend disconnected
							if ( !friendFound && netfriend.online )
								toChange = true;

							break;
						}
					}
				}

				// New hosts to add?
				if ( !toChange )
				{
					for ( var h = 0; h < hosts.length; h++ )
					{
						// Is host a friend?
						var nf = self.getFriendFromName( hosts[ h ].name );
						if ( nf && !nf.session && !nf.online )
						{
							// Not displayed: display it!
							toChange = true;
							break;
						}
					}
				}
			}
		}

		// Refresh the icons
		if ( force || toChange )
		{
			// Erase all previous widgets
			self.removeFriendWidgets();

			// Add the friends
			for ( var f = 0; f < self.friends.length; f++ )
			{
				var netfriend = self.friends[ f ];
				if ( netfriend.session )
					continue;

				netfriend.widget = false;

				// Creates the icon
				var icon = netfriend.icon;
				if ( icon && netfriend.iconImage )
				{
					if ( !netfriend.online )
					{
						var canvas = document.createElement( 'canvas' );
						canvas.width = 32;
						canvas.height = 32;
						var context = canvas.getContext( '2d' );
						// Draw the friend icon
						context.globalAlpha = 0.55;			// Friend icon fade
						context.drawImage( Friend.iconImage, 0, 0, 32, 32 );
						context.globalAlpha = 0.70;
						// Paste the 'non connected' sign
						if ( self.friendNotConnectedIcon )
							context.drawImage( self.friendNotConnectedIcon, 16, 16, 16, 16 );
						context.globalAlpha = 1;
						icon = canvas.toDataURL();
					}
					netfriend.flashIcon = icon;

					// Create the widget
					var widget =
					{
						label: 'Friend Network Friend ' + netfriend.name,
						name: 'Friend Network Friend ' + netfriend.name,
						className: 'Rounded',
						icon: icon,
						getBubbleText: self.getFriendText,
						onOpenBubble: self.onOpenFriendText,
						onCloseBubble: self.onCloseFriendText,
						onDrop: self.onDropFriend,
						friend: netfriend
					};
					netfriend.widget = widget;
					widget.identifier = Workspace.addTrayIcon( widget );
					self.friendWidgets.push( widget );
				}
			}
		}

		// Eventually add the + widget
		self.addPlusWidget();
	},

	// Adds the PLUS widget to display
	addPlusWidget: function()
	{
		var self = FriendNetworkFriends;
		if ( !self.addFriendWidget )
		{
			var widget =
			{
				name: 'Friend Network Add Friend',
				icon: 'fa-user-plus',
				getBubbleText: self.getAddFriendText,
				onclick: self.onClickPlus
			};
			self.addFriendWidget = Workspace.addTrayIcon( widget );
		}
	},

	// Removes the widget of a specific friend
	removeFriendWidget: function( netfriend )
	{
		if ( netfriend.widget )
		{
			// Find in array
			for ( var w = 0; w < self.friendWidgets.length; w++ )
			{
				if ( netfriend.widget == self.friendWidgets[ w ] )
				{
					Workspace.removeTrayIcon( netfriend.widget.identifier );
					self.friendWidgets.splice( w, 1 );
					netfriend.widget = false;
					break;
				}
			}
		}
	},

	// Removes all friend widgets and the plus widget
	removeFriendWidgets: function()
	{
		var self = FriendNetworkFriends;
		for( var f = 0; f < self.friendWidgets.length; f++ )
		{
			var netfriend = self.friendWidgets[ f ].friend;
			netfriend.widget = false;
			Workspace.removeTrayIcon( self.friendWidgets[ f ].identifier );
		}
		self.friendWidgets = [];
		if( self.addFriendWidget )
		{
			Workspace.removeTrayIcon( self.addFriendWidget );
			self.addFriendWidget = false;
		}
	},

	// Force the refresh of the bubble text of a friend (TODO: cleanup! Not necessary anymore)
	refreshTrayIconBubble: function( netfriend )
	{
		if( netfriend.widget )
		{
			Workspace.refreshTrayIconBubble( netfriend.widget.identifier );
		}
	},
	forceTrayIconBubbleRefresh: function( netfriend )
	{
		if( netfriend.widget )
		{
			netfriend.widget.bubbleSet = false;
		}
	},

	// Scan the list of friends, and removes the ones that are marked temporary and have nothing to display
	removeTemporaryFriends: function()
	{
		var self = FriendNetworkFriends;
		var done = false;
		for ( var f = 0; f < self.friends.length; f++ )
		{
			var netfriend = self.friends[ f ];
			if ( netfriend.icon && netfriend.iconImage )
			{
				// If temporary friend, check that nothing is left to see or send
				if ( netfriend.temporary && !netfriend.keepOpen && netfriend.messages.length == 0 && netfriend.waiting.length == 0 && netfriend.pending.length == 0 && netfriend.shared.length == 0 )
				{
					self.disconnectFriend( netfriend );
					self.friends.splice( f, 1 );
					done = true;
				}
			}
		}
		if ( done )
		{
			self.storeFriends();
			self.refreshFriendWidgets( true );
		}
	},

	// Get the text of the plus widget
	getAddFriendText: function()
	{
		return i18n( 'i18n_add_a_friend' );
	},

	// Makes a friend widget flash
	flashFriendWidget: function( netfriend, duration )
	{
		var self = FriendNetworkFriends;
		if( !netfriend.handleFlash )
		{
			netfriend.flash = 1;
			var start = new Date().getTime();
			netfriend.handleFlash = setInterval( function()
			{
				if( netfriend.widget )
				{
					netfriend.flash = 1 - netfriend.flash;
					if( netfriend.flash )
						Workspace.setTrayIconImage( netfriend.widget.identifier, netfriend.flashIcon );
					else
						Workspace.setTrayIconImage( netfriend.widget.identifier, '/webclient/gfx/fnetFlashFriend.png' );

					if( typeof duration != 'undefined' )
					{
						var time = new Date().getTime();
						if ( time - start > duration )
							self.stopFriendWidgetFlash( netfriend );
					}
				}
			}, 500 );
			self.storeFriends();
		}
	},

	// Stops the flash of a friend widget
	stopFriendWidgetFlash: function( netfriend )
	{
		if( netfriend.handleFlash )
		{
			clearInterval( netfriend.handleFlash );
			netfriend.handleFlash = false;
			Workspace.setTrayIconImage( netfriend.widget.identifier, netfriend.flashIcon );
		}
	},

	// Displays a system notification above a friend widget
	notifyFriend: function( netfriend, title, text )
	{
		this.flashFriendWidget( netfriend, 5000 );
		Notify( { title: title, text: text, label: netfriend.widget.label } );
	},

	// Click on ADD FRIEND
	///////////////////////////////////////////////////////////////////////////
	onClickPlus: function()
	{
		var self = FriendNetworkFriends;
		if ( !self.addView )
		{
			// Updates the list of hosts
			self.updateHostsList( function( hosts )
			{
				// Creates the list of friends
				self.currentPlusFriends = {};
				self.currentPlusApps = {};
				var html = self.getPlusHTML( hosts );
				if ( html != '' )
				{
					self.plusView = new View(
					{
						title: i18n( 'Choose which friend to add' ),
						width: 415,
						height: 295,
						resize: false
					} );
					self.plusView.setContent( html );
				}
				else
				{
					Alert( i18n( 'i18n_FriendNetwork' ), 'There are no available new friends in your workgroup right now.' );
				}
			} );
		}
	},

	// Dialog box
	getPlusHTML: function( hosts )
	{
		var self = FriendNetworkFriends;
		var html = '';

		// Add the available friends
		for ( var h = 0; h < hosts.length; h ++ )
		{
			var host = hosts[ h ];

			// Not the current user
			if ( host.name == Workspace.loginUsername )
				continue;

			// Must be initialized, and in the workgroup
			if ( !host.apps )
				continue;
			var workgroup = false;
			for ( var a = 0; a < host.apps.length; a++ )
			{
				if ( host.apps[ a ].type == 'communication' && host.apps[ a ].info.workgroup == self.workgroup )
				{
					workgroup = true;
					break;
				}
			}
			if ( !workgroup )
				continue;

			// Not already added?
			if ( self.getFriendFromName( host.name ) )
				continue;
			self.currentPlusApps[ host.name ] = host.apps[ a ];

			var cl = '';
			if( self.currentPlusFriends[ host.name ] )
				cl += ' BackgroundNegative Negative';
			html += '\
			<div class="Box' + cl + '" id="friend' + host.name +'" onclick="FriendNetworkFriends.onClickFriend( \'' + host.name  + '\' )">\
				<div class="HRow">\
					<div class="FloatRight" style="width: 60px"><img style="float: right; width: 40px; height: auto" src="' + host.info.image + '"/>' + '</div>\
					<div class="FloatLeft PaddingLeft" style="width: calc(100%-60px)"><p>' + host.name + '</p></div>\
				</div>\
			</div>\
			';
		}
		if ( html == '' )
			return html;

		// Set the content of the view
		html = '<div class="ContentFull LayoutButtonbarBottom">\
					<div class="VContentTop TopContainer" style="bottom: 50px">\
						<div class="ContentFull Padding ScrollArea">\
							<div class="ContentFull BackgroundLists Padding" id="Friends">' + html + '\
							</div>\
						</div>\
					</div>\
					<div class="VContentBottom BackgroundDefault Padding BorderTop" style="height: 50px">\
						<button type="button" class="FloatRight Button IconSmall fa-times" onclick="FriendNetworkFriends.onPlusCancel();">\
							' + i18n( 'i18n_cancel' ) + '\
						</button>\
						<button type="button" class="Button IconSmall fa-check" onclick="FriendNetworkFriends.onPlusOK();">\
							' + i18n( 'i18n_affirmative' ) + '\
						</button>\
					</div>\
				</div>';

		return html;
	},

	// Click on one friend
	onClickFriend: function( name )
	{
		var self = FriendNetworkFriends;
		if ( !self.currentPlusFriends[ name ] )
			self.currentPlusFriends[ name ] = true;
		else
			self.currentPlusFriends[ name ] = false;
		self.plusView.setContent( self.getPlusHTML( self.currentHosts ) );
	},

	// Cancel dialog
	onPlusCancel: function()
	{
		var self = FriendNetworkFriends;
		if ( self.plusView )
		{
			self.plusView.close();
			self.plusView = false;
		}
		self.currentPlusFriends = {};
		self.currentPlusApps = {};
	},

	// Click on OK!
	onPlusOK: function( name )
	{
		var self = FriendNetworkFriends;
		for( var friendName in self.currentPlusFriends )
		{
			var app = self.currentPlusApps[ friendName ];
			var netfriend =
			{
				name: friendName,
				hostName: app.name + '@' + friendName,
				pending: [],
				waiting: [],
				messages: [],
				shared: [],
				connected: false,
				connecting: false,
				icon: self.unknownIcon,
				iconImage: self.unknownIconImage
			};
			self.friends.push( netfriend );
			self.storeFriends();
			self.refreshFriendWidgets( true );
		}
		self.plusView.close();
		self.plusView = false;
		self.currentPlusFriends = {};
		self.currentPlusApps = {};
	},

	// Click on OK!
	clickSetTemporaryFriendAsFriend: function( name )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName ( name );
		if( netfriend )
		{
			netfriend.temporary = false;
			netfriend.keepOpen = false;
			self.refreshTrayIconBubble( netfriend );
		}
	},

	// Disconnects and remove a friend from the list of friends
	clickForgetFriend: function( name )
	{
		var self = FriendNetworkFriends;
		for( var f = 0; f < self.friends.length; f++ )
		{
			var netfriend = self.friends[ f ];
			if( netfriend.name == name )
			{
				// Remove the widget
				self.removeFriendWidget( netfriend );

				// Remove from friend list
				self.friends.splice( f, 1 );

				// Update display
				self.refreshFriendWidgets( true );
				self.disconnectFriend( netfriend );
				self.storeFriends();
				break;
			}
		}
	},


	// Friend bubble handling
	///////////////////////////////////////////////////////////////////////////

	// Called when the bubble is open
	onOpenFriendText: function()
	{
		var self = FriendNetworkFriends;
		var netfriend = this.friend;			// Friend contained in the Bubble object (this)
		if( netfriend )
		{
			// If the friend is flashing, stop the flash!
			self.stopFriendWidgetFlash( netfriend );
		}
	},

	// Called when the bubble is close: force a redemand of the text for the next time
	onCloseFriendText: function()
	{
		var self = FriendNetworkFriends;
		var netfriend = this.friend;			// Friend contained in the Bubble object (this)
		if( friend )
		{
			// Forces a redemand of the text next time
			netfriend.widget.bubbleSet = false;
		}
	},

	// Returns the content of a friend widget bubble
	getFriendText: function()
	{
		var self = FriendNetworkFriends;
		var netfriend = this.friend;

		// If session friend -> call session friend display
		if ( netfriend.session )
			return self.getSessionText( netfriend );

		// Title of the bubble
		var html = '';
		var title = '';
		if ( !netfriend.fullName )
		{
			html = '<div>\
						<div class="HRow">\
							<div class="FloatLeft">\
								<h3>' + i18n( 'i18n_waiting_for_connection' ) + '</h3>\
							</div>\
							<div class="FloatRight">\
								<span class="fa fa-times HoverFeedback" aria-hidden="true" style="font-size:16px" onclick="FriendNetworkFriends.clickForgetFriend(\'' + netfriend.name + '\');" title="' + i18n( 'i18n_remove_friend' ) + '"></span>\
							</div>\
						</div>\
					</div>';
		}
		else
		{
			var friendName = netfriend.fullName;
			var pos = friendName.indexOf( ' ' );
			if ( pos > 0 )
				friendName = friendName.substring( 0, pos );			// Only keep first name

			title += '<div>\
						<div class="HRow">\
							<div class="FloatLeft">\
								<h3>' + netfriend.fullName;
			if ( !netfriend.online )
				title += 			'';				// No space in bubble for long names, see with Hogne
			title += 			'</h3>\
							</div>';
			if ( netfriend.temporary )
			{
				title += 	'<div class="FloatRight">\
								<span class="fa fa-plus Buttons" aria-hidden="true" style="font-size:16px;" title="Add as friend." onclick="FriendNetworkFriends.clickSetTemporaryFriendAsFriend(\'' + netfriend.name + '\');"></span>\
							</div>';
			}
			else
			{
				title += 	'<div class="FloatRight">\
								<span class="fa fa-times Buttons" aria-hidden="true" style="font-size:16px" onclick="FriendNetworkFriends.clickForgetFriend(\'' + netfriend.name + '\');" title="Forget friend."></span>\
							</div>';
			}
			title += '	</div>\
					</div>';

			// What is the friend sharing?
			var shared = '';
			var privateShared = '';
			var files = 0;
			if( netfriend.online )
			{
				if( netfriend.apps )
				{
					for ( var a = 0; a < netfriend.apps.length; a++ )
					{
						var app = netfriend.apps[ a ];
						switch( app.type )
						{
							case 'drive':
							case 'folder':
								shared +=  '<div class="HRow HoverRow Padding" onclick="FriendNetworkFriends.clickFriendOpen(\'' + netfriend.name + '\', \'' + app.name + '\');">\
												<div class="FloatLeft">\
													' + ( app.type == 'drive' ? 'Drive: ' : 'Folder: ' ) + app.name + '\
												</div>\
												<div class="FloatRight">\
													<span class="fa fa-folder-open-o Buttons" aria-hidden="true" style="font-size:16px;" title="Open."></span>\
												</div>\
											</div>';
								break;
							case 'application':
								break;
						}
					}
				}
				if ( shared != '' )
				{
					shared = '<div>\
								<div class="HRow">\
									<div class="FloatLeft">\
										<strong>' + friendName + ' ' + i18n( 'i18n_shares_with_community' ) + '</strong>\
									</div>\
								</div>' + shared + '\
							  </div>';
				}

				// List the shared folders and applications
				for ( var s = 0; s < netfriend.shared.length; s++ )
				{
					var share = netfriend.shared[ s ];
					var OK, call;
					if( share.subject == '<---folder--->' )
					{
						OK = self.checkFriendOpen( netfriend.name, share.name );
						call = '';
						if ( OK )
							call = 'onclick="FriendNetworkFriends.clickFriendOpen(\'' + netfriend.name + '\', \'' + share.name + '\', \'' + share.executable + '\');" ';
						privateShared += '<div class="HRow HoverRow" ' + call + '>\
												<div class="FloatLeft">\
													Folder: ' + share.name + '\
										  		</div>';
						if( self.checkFriendOpen( netfriend.name, share.name ) )
						{
							if ( OK )
							{
								privateShared +='<div class="FloatRight">\
													<span class="fa fa-folder-open-o Buttons" aria-hidden="true" style="font-size:16px;" onclick="FriendNetworkFriends.clickFriendOpen(\'' + netfriend.name + '\', \'' + share.name + '\');" title="' + i18n( 'i18n_open' ) + '"></span>\
												</div>';
							}
							if( share.content != '' )
							{
								privateShared+='<div class="HRow FNetText">\
													' + share.content.substring( 0, 80 ) + '\
												</div>';
							}
						}
						privateShared += '</div>';
					}
					else if( share.subject == '<---application--->' )
					{
						OK = self.checkFriendOpen( netfriend.name, share.name );
						call = '';
						if ( OK )
							call = 'onclick="FriendNetworkFriends.clickFriendOpen(\'' + netfriend.name + '\', \'' + share.name + '\', \'' + share.executable + '\');" ';
						privateShared += '<div class="HRow" ' + call + '>\
												<div class="FloatLeft">\
													' + i18n( 'i18n_application' ) + ': ' + share.name + '\
											  	</div>';
						if( self.checkFriendOpen( netfriend.name, share.name ) )
						{
							if ( OK )
							{
								privateShared+='<div class="FloatRight Buttons">\
													<span class="fa fa-folder-open-o Buttons" aria-hidden="true" style="font-size:16px;" title="Open"></span>\
												</div>';
							}
							if ( share.content != '' )
							{
								html += 	   '<div class="HRow FNetText">\
													' + share.content.substring( 0, 80 ) + '\
												</div>';
							}
						}
						privateShared += '</div>';
					}
				}

				// List the files contained in the messages
				for( var m = 0; m < netfriend.messages.length; m++ )
				{
					var message = netfriend.messages[ m ];
					if( message.subject == '<---file--->' )
					{
						if( message.loaded )
						{
							privateShared += '<div class="HRow HoverRow" onclick="FriendNetworkFriends.clickFriendOpenFile(\'' + netfriend.name + '\', \'' + message.id + '\');" >\
												<div class="FloatLeft">\
													File: ' + self.getFileName( message.path ) + '\
												</div>\
												<div class="FloatRight">\
													<span class="fa fa-folder-open-o Buttons" aria-hidden="true" style="font-size:16px;" title="Open file"></span>\
													<span class="fa fa-times Buttons" aria-hidden="true" style="font-size:16px" onclick="FriendNetworkFriends.clickFriendRemoveMessage(\'' + netfriend.name + '\', \'' + message.id + '\'); return cancelBubble( event );" title="' + i18n( 'i18n_remove' ) + '"></span>\
												</div>';
							if ( message.content != '' )
							{
								privateShared+='<div class="HRow FNetText">\
													' + message.content.substring( 0, 80 ) + '\
												</div>';
							}
							privateShared += '</div>';
						}
						else if ( message.loading )
						{
							privateShared += '<div class="HRow">\
												<div class="FloatLeft">\
													Loading: ' + self.getFileName( message.path ) + message.percentLoaded + '%\
												</div>\
											  </div>';
						}
						else
						{
							privateShared += '<div class="HRow HoverRow" onclick="FriendNetworkFriends.clickFriendSaveFile(\'' + netfriend.name + '\', \'' + message.id + '\');">\
												<div class="FloatLeft">\
													File: ' + self.getFileName( message.path ) + '\
												</div>\
												<div class="FloatRight">\
													<span class="fa fa-cloud-download Buttons" aria-hidden="true" style="font-size:16px;" title="' + i18n( 'i18n_download_file' ) + '"></span></span>\
													<span class="fa fa-times Buttons" aria-hidden="true" style="font-size:16px" onclick="FriendNetworkFriends.clickFriendRefuseMessage(\'' + netfriend.name + '\', \'' + message.id + '\'); return cancelBubble( event );" title="' + i18n( 'i18n_refuse_file' ) + '"></span></span>\
												</div>';
							if ( message.content != '' )
							{
								privateShared+='<div class="HRow FNetText">\
													' + message.content.substring( 0, 80 ) + '\
												</div>';
							}
							privateShared += '</div>';
						}
					}
				}
				if ( privateShared != '' )
				{
					privateShared = '<div>\
										<div class="HRow">\
											<div class="FloatLeft">\
												<strong>' + friendName + ' ' + i18n( 'i18n_shares_with_you' ) + '</strong>\
											</div>\
										</div>' + privateShared + '\
									</div>';
				}
			}

			// List the messages
			var messages = '';
			for ( var m = 0; m < netfriend.messages.length; m++ )
			{
				var message = netfriend.messages[ m ];
				if ( message.subject != '<---folder--->' && message.subject != '<---file--->' && message.subject != '<---application--->' && message.subject != '<---notification--->' )
				{
					messages += '<div class="HRow HoverRow" onclick="FriendNetworkFriends.clickFriendOpenMessage(\'' + netfriend.name + '\', \'' + message.id + '\');">\
									<div class="FloatLeft">' + message.subject + '</div>\
									<div class="FloatRight">\
										<span class="fa fa-folder-open-o Buttons" aria-hidden="true" style="font-size:16px;" title="Open message"></span>\
										<span class="fa fa-times Buttons" aria-hidden="true" style="font-size:16px" onclick="FriendNetworkFriends.clickFriendRefuseMessage(\'' + netfriend.name + '\', \'' + message.id + '\'); return cancelBubble( event );" title="' + i18n( 'i18n_refuse_message' ) + '"></span>\
									</div>\
									<div class="HRow FNetText">\
										' + message.content.substring( 0, 80 ) + '\
									</div>\
								</div>';
				}
			}
			if ( messages != '' )
			{
				messages = '<div>\
								<div class="HRow">\
									<div class="FloatLeft">\
										<strong>' + i18n( 'i18n_messages' ) + '</strong>\
									</div>\
								</div>' + messages + '\
							</div>';
			}

			// You are sharing
			var youShare = '';
			for ( var w = 0; w < netfriend.waiting.length; w++ )
			{
				var message = netfriend.waiting[ w ];
				if ( message.subject == '<---file--->' )
				{
					youShare += '<div class="HRow HoverRow" onclick="FriendNetworkFriends.clickFriendStopSharingFile(\'' + netfriend.name + '\', \'' + message.id + '\');">\
									<div class="FloatLeft">File: ' + self.getFileName( message.path );
					if ( message.refused )
					{
						youShare += ' (refused)</div>\
									<div class="FloatRight">\
										<span class="fa fa-trash-o Buttons" aria-hidden="true" style="font-size:16px;" title="' + i18n( 'i18n_delete' ) + '"></span>\
									</div>';
					}
					else
					{
						youShare += ' (not loaded)</div>\
									<div class="FloatRight">\
										<span class="fa fa-trash-o Buttons" aria-hidden="true" style="font-size:16px;" title="' + i18n( 'i18n_stop_sharing' ) + '"></span>\
									</div>';
					}
					youShare += '</div>';
				}
				else if ( message.subject == '<---folder--->' )
				{
					youShare += '<div class="HRow HoverRow"onclick="FriendNetworkFriends.clickFriendStopSharing(\'' + netfriend.name + '\', \'' + message.id + '\');">\
									<div class="FloatLeft">\
										' + i18n( 'i18n_folder' ) + ': ' + self.getFileName( message.path ) + '\
									</div>\
									<div class="FloatRight">\
										<span class="fa fa-times Buttons" aria-hidden="true" style="font-size:16px;" title="' + i18n( 'i18n_stop_sharing' ) + '"></span>\
									</div>\
								</div>';
				}
				else if ( message.subject == '<---application--->' )
				{
					youShare += '<div class="HRow HoverRow" onclick="FriendNetworkFriends.clickFriendStopSharingApplication(\'' + netfriend.name + '\', \'' + message.id + '\');" >\
									<div class="FloatLeft">\
										' + i18n( 'i18n_application' ) + ': ' + self.getFileName( message.path ) + '\
									</div>\
									<div class="FloatRight">\
										<span class="fa fa-times Buttons" aria-hidden="true" style="font-size:16px;" title="' + i18n( 'i18n_stop_sharing' ) + '"></span>\
									</div>\
								</div>';
				}
			}
			if ( youShare != '' )
			{
				youShare = '<div>\
								<div class="HRow">\
									<div class="FloatLeft">\
										<strong>' + i18n( 'i18n_what_you_share_with' ) + ' ' + friendName + '...</strong>\
									</div>\
								</div>' + youShare + '\
							</div>';
			}

			// Messages waiting to be read
			var waiting = '';
			for ( var w = 0; w < netfriend.waiting.length; w++ )
			{
				var message = netfriend.waiting[ w ];
				if ( message.subject != '<---file--->' && message.subject != '<---folder--->' && message.subject != '<---application--->' && message.subject != '<---notification--->' )
				{
					waiting += '<div class="HRow HoverRow"onclick="FriendNetworkFriends.removeWaitingMessage(\'' + netfriend.name + '\', \'' + message.id + '\');">\
									<div class="FloatLeft">' + message.subject;
					if ( message.refused )
					{
						waiting += ' (refused)</div>\
									<div class="FloatRight">\
										<span class="fa fa-trash-o Buttons" aria-hidden="true" style="font-size:16px;" title="' + i18n( 'i18n_delete' ) + '"></span>\
									</div>';
					}
					else
					{
						waiting += ' (not read)</div>\
									<div class="FloatRight">\
										<span class="fa fa-trash-o Buttons" aria-hidden="true" style="font-size:16px;" title="' + i18n( 'i18n_mark_as_read' ) + '"></span>\
									</div>';
					}
					waiting += '</div>';
				}
			}
			if ( waiting != '' )
			{
				waiting = '<div>\
								<div class="HRow">\
									<div class="FloatLeft">\
										<strong>' + i18n( 'i18n_messages_sent' ) + '</strong>\
									</div>\
								</div>\
								' + waiting + '\
							</div>';
			}

			// Notifications waiting to be read
			var notificationWaiting = '';
			if ( netfriend.waiting.length )
			{
				for ( var w = 0; w < Friend.waiting.length; w++ )
				{
					var message = netfriend.waiting[ w ];
					if ( message.subject == '<---notification--->' )
					{
						notificationWaiting += '<div class="HRow HoverRow" onclick="FriendNetworkFriends.removeWaitingMessage(\'' + netfriend.name + '\', \'' + message.id + '\');">\
													<div class="FloatLeft">\
														' + message.content + ' (not read)\
													</div>\
													<div class="FloatRight">\
														<span class="fa fa-trash-o Buttons" aria-hidden="true" style="font-size:16px;" title="' + i18n( 'i18n_delete' ) + '"></span>\
													</div>\
												</div>';
					}
				}
				if ( notificationWaiting != '' )
				{
					notificationWaiting = '<div>\
											<div class="HRow">\
												<div class="FloatLeft">\
													<strong>' + i18n( 'i18n_notifications_sent' ) + '</strong>\
												</div>\
											</div>' + notificationWaiting + '\
										   </div>';
				}
			}

			// Messages waiting to be sent
			var pending = '';
			if ( netfriend.pending.length )
			{
				pending += '<div class="HRow">\
								<div class="FloatLeft">\
									<strong>' + netfriend.pending.length + ' pending message(s)</strong>\
								</div>\
							</div>';
			}

			// Create the whole text
			html += title + messages + notificationWaiting + waiting + privateShared + shared + youShare + pending;

			// Add the icons
			// <span class="Button fa fa-bell-o HoverFeedback" aria-hidden="true" style="font-size:24px" onclick="FriendNetworkFriends.clickSendNotification(\'' + Friend.name + '\');" title="Send a notification"></span>\
			// <span class="Button fa fa-video-camera HoverFeedback" aria-hidden="true" style="font-size:24px" onclick="FriendNetworkFriends.clickOpenLive(\'' + Friend.name + '\');" title="Open live chat"></span>\
			html = '<div class="FNetBubble">' + html + '</br>\
						<div class="HRow">\
							<span class="Button fa fa-paper-plane-o HoverFeedback" aria-hidden="true" style="font-size:24px" onclick="FriendNetworkFriends.clickSendMessage(\'' + Friend.name + '\');" title="Send a message"></span>\
							<span class="Button fa fa-file-o HoverFeedback" aria-hidden="true" style="font-size:24px" onclick="FriendNetworkFriends.clickSendFile(\'' + Friend.name + '\');" title="Share a file"></span>\
							<span class="Button fa fa-folder-o HoverFeedback" aria-hidden="true" style="font-size:24px" onclick="FriendNetworkFriends.clickSendFolder(\'' + Friend.name + '\');" title="Share disk or folder"></span>\
							<span class="Button fa fa-share-square-o HoverFeedback" aria-hidden="true" style="font-size:24px" onclick="FriendNetworkFriends.clickSendApplication(\'' + Friend.name + '\');" title="Share an application"></span>\
						</div>\
					</div>';
		}
		return html;
	},
	
	// Notifications
	///////////////////////////////////////////////////////////////////////////

	// Display eventual notifications (called on intervals)
	displayNotifications: function()
	{
		var self = FriendNetworkFriends;
		for( var f = 0; f < self.friends.length; f++ )
		{
			var netfriend = self.friends[ f ];
			if( netfriend.fullName && netfriend.notification )
			{
				netfriend.widget.block = true;
				netfriend.notificationBubble = Notify(
				{
					title: 'Notification from ' + netfriend.fullName,
					text: self.getNotificationText( netfriend, netfriend.notification.id ),
					label: netfriend.widget.label,
					sticky: true
				} );
				netfriend.notification = false;
			}
		}
	},

	// Returns the HTML of a notification bubble
	getNotificationText: function( netfriend, id )
	{
		var notification = '';
		for ( var m = 0; m < netfriend.messages.length; m++ )
		{
			var message = netfriend.messages[ m ];
			if ( message.id == id )
			{
				if ( message.subject == '<---notification--->' )
				{
					notification += '<div class="HRow">\
										<div class="FloatLeft">' + message.content + '</div>\
									  </div>\
									  </br>\
									  <div class="HRow">';
					if ( message.live )
					{
						notification +=	'<div class="FloatLeft">\
											<button type="button" onclick="FriendNetworkFriends.clickCloseNotification(\'' + netfriend.name + '\', \'' + message.id + '\');">Refuse</button>\
										 </div>\
										 <div class="FloatRight">\
											<button type="button" onclick="FriendNetworkFriends.clickAcceptLive(\'' + netfriend.name + '\', \'' + message.id + '\');">Accept</button>\
										 </div>';
					}
					else 
					{
						if ( !message.reply )
						{
							notification +=	'<div class="FloatLeft">\
												<button type="button" onclick="FriendNetworkFriends.clickSendNotification(\'' + netfriend.name + '\', \'' + message.id + '\');">Reply</button>\
											 </div>';
						}
						notification += 	'<div class="FloatRight">\
												<button type="button" onclick="FriendNetworkFriends.clickCloseNotification(\'' + netfriend.name + '\', \'' + message.id + '\');">OK</button>\
											 </div>';
					}
					notification +=  	'</div>';
					break;
				}
			}
		}
		return notification;
	},

	// User has click on OK in the notification
	clickCloseNotification: function( name, messageId )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		if( netfriend.notificationBubble )
		{
			CloseNotification( netfriend.notificationBubble );
			netfriend.notificationBubble = false;

			// Enable normal bubble
			netfriend.widget.block = false;

			// Indicate to the other side that the notification has been seen
			for ( var m = 0; m < netfriend.messages.length; m++ )
			{
				var message = netfriend.messages[ m ];
				if ( message.id == messageId )
				{
					if ( !message.readSent )
					{
						message.readSent = true;
						self.sendMessageRead( netfriend, messageId );
					}
				}
			}

			// Remove the notification from messages
			self.clickFriendRemoveMessage( name, messageId );

			// Stop friend flashing (if flashing)
			self.stopFriendWidgetFlash( netfriend );
		}
	},

	// Display the 'New notification' dialog
	clickSendNotification: function( name, messageId )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );

		if ( netfriend && !self.sendNotificationView )
		{
			netfriend.keepOpen = true;
			var notification = false;
			if ( messageId )
			{
				for ( var m = 0; m < netfriend.messages.length; m++ )
				{
					if ( netfriend.messages[ m ].id == messageId )
					{
						notification = netfriend.messages[ m ];
						break;
					}
				}
			}
			self.sendNotificationReply = notification;
			self.sendNotificationView = new View(
			{
				title: notification ? 'Reply to notification' : 'Send notification to ' + netfriend.fullName,
				width: 400,
				height: notification ? 105 : 60,
				resize: false
			} );
			var html = '\
						<div class="VContentTop Padding ScrollArea">';
			if ( notification )
			{
				html +=    '<div>' + notification.content  + '</div>';
			}
			html += 	   '<div>\
								<input type="text" size="50" id="text" name="text" maxlength="100">\
							</div>\
						</div>\
						<div class="VContentBottom BorderTop Padding BackgroundDefault" style="height: 50px">\
							<button type="button" class="FloatRight Button IconSmall fa-times" onclick="FriendNetworkFriends.onSendNotificationCancel(\'' + netfriend.name + '\')">\
								Cancel\
							</button>\
							<button type="button" class="Button IconSmall fa-check" onclick="FriendNetworkFriends.onSendNotificationSend(\'' + netfriend.name + '\')">\
								Send\
							</button>\
						</div>\
					';
			self.sendNotificationView.setContent( html );

			// Set a keyboard event
			var input = self.getViewElement( self.sendNotificationView, 'input', 'text' );
			input.onkeydown = function( e )
			{
				if ( e.which == 13 || e.keyCode == 13 )
				{
					self.onSendNotificationSend( netfriend.name );
				}
			};
			setTimeout( function()
			{
				input.focus();
			}, 100 );

			// Close the notification
			self.clickCloseNotification( name, messageId );

			// Stop friend flashing (if it was flashing)
			self.stopFriendWidgetFlash( netfriend );
		}
	},

	// User has clicked on 'Cancel'
	onSendNotificationCancel: function( name )
	{
		var self = FriendNetworkFriends;
		if( self.sendNotificationView )
		{
			// Make a temporary friend dissappear
			if( name )
			{
				var netfriend = self.getFriendFromName( name );
				if( netfriend )
					netfriend.keepOpen = false;
			}

			// Close the view
			self.sendNotificationView.close();
			self.sendNotificationView = false;
		}
	},

	// User has clicked on 'Send'
	onSendNotificationSend: function( name )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		if( netfriend )
		{
			var content = self.getViewElement( self.sendNotificationView, 'input', 'text' ).value;
			var id;
			if ( self.sendNotificationReply )
				id = self.sendNotificationReply.id;
			else
				id = this.getUniqueIdentifier( 'message' );
			var time = '' + new Date().getTime();
			var message =
			{
				id: id,
				from: Workspace.loginUsername,
				fromName: Workspace.fullName,
				hostName: self.communicationHostBase,
				recipient: netfriend.name,
				subject: '<---notification--->',
				content: content,
				reply: self.sendNotificationReply ? true : false,
				sent: time
			}
			// Send when possible
			self.pushPending( netfriend,
			{
				type: 'message',
				id: id,
				message: message
			} );

			// Close Send view
			self.onSendNotificationCancel( name );
		}
	},

	// Live video connection
	///////////////////////////////////////////////////////////////////////////
	clickOpenLive: function( name )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );

		if( friend )
		{
			// Send a notification to the other side
			var id = this.getUniqueIdentifier( 'live' );
			var time = '' + new Date().getTime();
			var message =
			{
				id: id,
				from: Workspace.loginUsername,
				fromName: Workspace.fullName,
				hostName: self.communicationHostBase,
				recipient: netfriend.name,
				subject: '<---notification--->',
				content: netfriend.name + ' invites you to a live video chat.',
				live: true,
				sent: time
			}

			// Send when possible
			self.pushPending( netfriend,
			{
				type: 'message',
				id: id,
				message: message
			} );

			// Open Friend Chat live video on the sikrit ruum
			var essai =
			{
				files: 
				[
					{
						name: 'tralala',
						isDirectory: true,
						path: 'ExtStorage://root',
						length: 1000,
						canRead: true,
						canWrite: false,
					},
					{
						name: 'truc',
						isDirectory: false,
						path: 'ExtStorage://sim',
						length: 500,
						canRead: true,
						canWrite: false,
					}
				]
			};
			var tralala = JSON.stringify( essai );
			self.sendDormantCommand( 'FriendChat:Functions/OpenLive', 'sikrit ruum ???', function( response, data )
			{
			} );
		}
	},

	// User has click on OK in the notification
	clickAcceptLive: function( name, messageId )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );

		// Open Friend Chat live video on the sikrit ruum
		self.sendDormantCommand( 'FriendChat:Functions/OpenLive', 'sikrit ruum ???', function( response, data )
		{
		} );

		// Close the notification
		self.clickCloseNotification( name, messageId );		
	},
	
	sendDormantCommand: function( path, args, callback )
	{
		// Hogne: can you please fill this function so that the Friend Chat 
		// Dormant functions are called? The path contains
		// 'FriendChat:Functions/OpenLive'
		// and args is 'sikrit ruum'
		// callback( response, data ) where:
		// response= true, worked
		// response= false, did not work, data contains message.
		// Thank you! Gonna be great!
	},

	// Shared files
	///////////////////////////////////////////////////////////////////////////

	// Save shared file. Opens a file selector and dowload the file
	clickFriendSaveFile: function( name, id )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		for ( var m = 0; m < netfriend.messages.length; m++ )
		{
			if ( netfriend.messages[ m ].id == id )
			{
				var message = netfriend.messages[ m ];
				self.saveFileFriend = netfriend;
				self.saveFileMessage = message;
				self.onSaveFilePassword();
			}
		}
	},

	// Open a file selector and asks for the file
	onSaveFilePassword: function()
	{
		var self = FriendNetworkFriends;

		// Where to save the file?
		new Filedialog( false, function( path )
		{
			if ( path && typeof path == 'string' && path.indexOf( 'Mountlist:' ) < 0 )
			{
				var fileName = self.getFileName( self.saveFileMessage.path );
				self.pushPending( self.saveFileFriend,
				{
					type: 'getFile',
					id: self.saveFileMessage.id,
					path: self.saveFileMessage.path,
					saveTo: path + fileName
				} );
			}
			else
			{
				Alert( 'Friend Network', 'Please choose a directory...' );
			}
		}, 'Mountlist:', 'path', self.getFileName( self.saveFileMessage.path ), 'Choose where to save the file...' );
	},

	// Stop sharing a file
	clickFriendStopSharingFile: function( name, id )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		for ( var m = 0; m < netfriend.waiting.length; m++ )
		{
			if ( netfriend.waiting[ m ].id == id )
			{
				var message = netfriend.waiting[ m ];

				// Remove from 'waiting'
				self.removeWaiting( netfriend, m );

				// Send a message to the other side
				self.pushPending( netfriend,
				{
					type: 'stopShareFile',
					id: self.getUniqueIdentifier( 'stopShareFile' ),
					name: message.name,
					path: message.path
				} );
				break;
			}
		}
	},

	// Open a file shared by a friend
	clickFriendOpenFile: function( name, id )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		for ( var m = 0; m < netfriend.messages.length; m++ )
		{
			if ( netfriend.messages[ m ].id == id )
			{
				var message = netfriend.messages[ m ];
				Friend.DOS.getFileInfo( message.saveTo, {}, function( response, fileinfo, extra )
				{
					if ( response )
						OpenWindowByFileinfo( fileinfo );
				} );
			}
		}
	},

	// Called by the Workspace after a drag and drop on a friend widget
	onDropFriend: function( elements )
	{
		var self = FriendNetworkFriends;
		var netfriend = this.friend;
		var time = '' + new Date().getTime();
		if ( elements.length > 1 )
		{
			Confirm( 'Friend Network', 'Are you sure you want to send ' + elements.length + ' elements to ' + netfriend.name + '?', function( response )
			{
			}, 'Yes', 'No' );
		}
		var doorOpen = false;
		var doorPassword;
		for ( var e = 0; e < elements.length; e++ )
		{
			var element = elements[ e ];
			if ( element.Type == 'File' )
			{
				var id = self.getUniqueIdentifier( 'message' );
				var password = self.getUniqueIdentifier( 'fileShare' );

				// Send to all receipients
				var time = '' + new Date().getTime();
				var message =
				{
					id: id,
					from: Workspace.loginUsername,
					fromName: Workspace.fullName,
					hostName: self.communicationHostBase,
					recipient: netfriend.name,
					subject: '<---file--->',
					path: element.Path,
					content: '',
					password: password,
					sent: time
				}
				// Send when possible
				self.pushPending( netfriend,
				{
					type: 'message',
					id: id,
					message: message
				} );
			}
			else if ( element.Type == 'Directory' )
			{
				var id = self.getUniqueIdentifier( 'message' );
				if ( !doorPassword )
					doorPassword = self.getUniqueIdentifier( 'shared' );
				var name = self.getFileName( element.Path );
				var message =
				{
					id: id,
					from: Workspace.loginUsername,
					fromName: Workspace.fullName,
					hostName: self.communicationHostBase,
					recipient: netfriend.name,
					subject: '<---folder--->',
					path: element.Path,
					name: name,
					content: '',
					sent: time,
					password: doorPassword
				}

				// Send when possible
				self.pushPending( netfriend,
				{
					type: 'message',
					id: id,
					message: message
				} );

				// Start sharing the folder
				if ( !doorOpen )
				{
					var door = ( new Door() ).get( element.Path );
					if ( door )
					{
						doorOpen = true;
						FriendNetworkDoor.shareDoor( door,
						{
							name : name,
							type: 'folder (private)',
							password: doorPassword,
							friend: netfriend
						} );
					}
				}
			}
		}
	},

	// Checks to see if the folder to open is present on Friend Network
	checkFriendOpen: function( hostName, appName )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( hostName );
		var ret = false;
		if( netfriend )
		{
			// Check if the app is shared in Friend Network
			for( var a = 0; a < netfriend.apps.length; a++ )
			{
				if( netfriend.apps[ a ].name == appName )
				{
					ret = true;
					break;
				}
			}
		}
		return ret;
	},

	// Share folders
	///////////////////////////////////////////////////////////////////////////

	// Share a folder dialog box
	clickSendFolder: function( name )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		if( netfriend && !self.sendFolderView )
		{
			new Filedialog( false, function( path )
			{
				if( path && typeof path == 'string' && path.indexOf( 'Mountlist:' ) < 0 )
				{
					self.sendFolderView = new View(
					{
						title: 'Share folder ' + path,
						width: 415,
						height: 120,
						resize: false
					} );

					self.sendFolderView.setContent( '\
						<div class="VContentTop Padding ScrollArea">\
							<table border="0" class="FullWidth">\
								<tr>\
									<td align="left"><strong>To: </strong></td>\
									<td align="left"><input type="text" size="40" id="to" value="' + netfriend.name + '"></tr>\
								<tr>\
									<td>Message:</td>\
									<td><input type="text" size="40" id="description"></td>\
								</tr>\
							</table>\
						</div>\
						<div class="VContentBottom BorderTop Padding BackgroundDefault" style="height: 50px">\
							<button type="button" class="FloatRight Button IconSmall fa-times" onclick="FriendNetworkFriends.onSendFolderCancel()">\
								Cancel\
							</button>\
							<button type="button" class="Button IconSmall fa-check" onclick="FriendNetworkFriends.onSendFolderSend(\'' + path + '\')">\
								Share\
							</button>\
						</div>\
					' );

					// Set a keyboard event
					var input = self.getViewElement( self.sendFolderView, 'input', 'description' );
					input.onkeydown = function( e )
					{
						if ( !e.shiftKey && ( e.which == 13 || e.keyCode == 13 ) )
						{
							self.onSendFolderSend( path );
						}
					};
					setTimeout( function()
					{
						input.focus();
					}, 100 );
				}
				else
				{
					Alert( 'Friend Network', 'Please choose a directory...' );
				}
			}, 'Mountlist:', 'path', '', 'Please choose the directory to share...' );
		}
	},

	// User has clicked on 'Cancel'
	onSendFolderCancel: function()
	{
		var self = FriendNetworkFriends;
		if ( self.sendFolderView )
		{
			self.sendFolderView.close();
			self.sendFolderView = false;
		}
	},

	// User has clicked on 'Send'
	onSendFolderSend: function( path, list )
	{
		var self = FriendNetworkFriends;
		var description = '';
		if ( !list )
		{
			list = self.getViewElement( self.sendFolderView, 'input', 'to' ).value;
			description = self.getViewElement( self.sendFolderView, 'input', 'description' ).value;
		}

		// Check the recipients
		var recipients = self.checkRecipientList( list );
		if( recipients && recipients.length )
		{
			// Identifier for message
			var id = this.getUniqueIdentifier( 'message' );

			// New password
			var password = self.getUniqueIdentifier( 'sendFolder' );

			// Send to all recipients
			var time = '' + new Date().getTime();
			var name = self.getFileName( path );
			for ( var r = 0; r < recipients.length; r++ )
			{
				var toFriend = self.getFriendFromName( recipients[ r ] );
				var password = self.getUniqueIdentifier( 'shared' );
				var message =
				{
					id: id,
					from: Workspace.loginUsername,
					fromName: Workspace.fullName,
					hostName: self.communicationHostBase,
					recipient: recipients[ r ],
					subject: '<---folder--->',
					path: path,
					name: name,
					content: description,
					sent: time,
					password: password
				}
				// Send when possible
				self.pushPending( toFriend,
				{
					type: 'message',
					id: id,
					message: message
				} );
			}
			// Start sharing the folder
			var door = ( new Door() ).get( path );
			if( door )
			{
				FriendNetworkDoor.shareDoor( door,
				{
					name: name,
					type: 'folder (private)',
					description: description,
					password: password,
					friend: this.friend
				} );
			}
		}
		self.onSendFolderCancel();
	},

	// Stop sharing a folder or an application
	clickFriendStopSharing: function( name, id )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		for ( var m = 0; m < netfriend.waiting.length; m++ )
		{
			if ( netfriend.waiting[ m ].id == id )
			{
				var message = netfriend.waiting[ m ];

				// Stop the actual sharing
				FriendNetworkDoor.closeSharedDoor( message.name );

				// Remove from 'waiting'
				self.removeWaiting( netfriend, m );

				// Send a message to the other side
				self.pushPending( netfriend,
				{
					type: 'stopShare',
					id: self.getUniqueIdentifier( 'stopShare' ),
					name: message.name
				} );
				break;
			}
		}
	},

	// Open a folder or application shared by another friend
	clickFriendOpen: function( hostName, appName, executable, callback, extra )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( hostName );
		if( netfriend )
		{
			// Find the type of the app
			var type;
			for ( var a = 0; a < netfriend.apps.length; a++ )
			{
				if ( netfriend.apps[ a ].name == appName )
				{
					type = netfriend.apps[ a ].type;
					break;
				}
			}

			// Get the password from the netfriend.shared list
			var password = 'public';
			for ( var s = 0; s < netfriend.shared.length; s++ )
			{
				var share = netfriend.shared[ s ];
				if ( share.subject == '<---folder--->' || share.type == '<---application--->' )
				{
					if ( share.name == appName )
					{
						// Security, removes the share from the friends list if not found.
						if ( !type )
						{
							console.log( 'FriendNetworkFriends.clickOnOpen app not found!' );
							self.removeShared( netfriend, s );
							return false;
						}

						// Get the password
						password = share.password;
					}
				}
			}

			// A folder or drive?
			if ( type == 'folder' || type == 'drive' || type == 'folder (private)' || type == 'application (private)' )
			{
				FriendNetworkDoor.connectToDoor( hostName, appName, type, password, function( response, connection )
				{
					if ( response == 'connected' )
					{
						if ( callback )
						{
							callback( true, connection, extra );
						}
						else
						{
							if ( type != 'application (private)' )
							{
								// Add the fileinfo to the Workspace icons
								var fileInfo =
								{
									ID:       undefined,
									MetaType: 'Directory',
									Path:     connection.door.title + ':',
									Title:    connection.door.title,
									Volume:   connection.door.title + ':',
									Filesize: 0,
									Filename: connection.door.title + ':',
									Type: 'Dormant',
									Dormant: connection.door,
									Mounted: true,
									Visible: true
								};
								Workspace.icons.push( fileInfo );
								// Open the directoryView
								OpenWindowByFileinfo( fileInfo );
							}
							else
							{
								ExecuteJSXByPath( connection.door.title + ':' + executable, '', function()
								{
	
								} );
							}		
						}
					}
				} );
			}
		}
	},


	// Share an application
	///////////////////////////////////////////////////////////////////////////

	// Share an application
	clickSendApplication: function( name )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		if ( netfriend && !self.sendApplicationView )
		{
			new Filedialog( false, function( list )
			{
				var done = false;
				if ( list && list.length == 1 )
				{
					var path = list[ 0 ].Path;

					if ( path.indexOf( '.jsx' ) >= 0 )
					{
						self.sendApplicationView = new View(
						{
							title: 'Send application ' + list[ 0 ].Filename,
							width: 415,
							height: 120,
							resize: false
						} );

						self.sendApplicationView.setContent( '\
							<div class="VContentTop Padding ScrollArea">\
								<table border="0" class="FullWidth">\
									<tr>\
										<td align="left"><strong>To: </strong></td>\
										<td align="left"><input type="text" size="40" id="to" value="' + netfriend.name + '"></tr>\
									<tr>\
										<td>Message:</td>\
										<td><input type="text" size="40" id="description"></td>\
									</tr>\
								</table>\
							</div>\
							<div class="VContentBottom BorderTop Padding BackgroundDefault" style="height: 50px">\
								<button type="button" class="FloatRight Button IconSmall fa-times" onclick="FriendNetworkFriends.onSendApplicationCancel()">\
									Cancel\
								</button>\
								<button type="button" class="Button IconSmall fa-check" onclick="FriendNetworkFriends.onSendApplicationSend(\'' + name + '\', \'' + path + '\')">\
									Share\
								</button>\
							</div>\
						' );
						done = true;
					}
				}
				if ( !done )
				{
					Alert( 'Friend Network', 'Please choose a jsx file...' );
				}
			}, 'Mountlist:', 'open', '', 'Please choose a JSX file' );
		}
	},

	// User has clicked on 'Cancel'
	onSendApplicationCancel: function()
	{
		var self = FriendNetworkFriends;
		if ( self.sendApplicationView )
		{
			self.sendApplicationView.close();
			self.sendApplicationView = false;
		}
	},

	// User has clicked on 'Send'
	onSendApplicationSend: function( name, path )
	{
		var self = FriendNetworkFriends;
		var list = self.getViewElement( self.sendApplicationView, 'input', 'to' ).value;
		var description = self.getViewElement( self.sendApplicationView, 'input', 'description' ).value;
		var netfriend = self.getFriendFromName( name );

		// Check file extension
		var OK = false;
		var pos = path.lastIndexOf( '.' );
		if ( pos >= 0 )
		{
			var extension = path.substring( pos + 1 );
			if ( extension.toLowerCase() == 'jsx' )
				OK = true;
		}
		if ( !OK )
		{
			Alert( 'Friend Network', 'Please choose a JSX file.' );
			self.onSendApplicationCancel();
			self.clickSendApplication( name );
			return;
		}

		// Check the recipients
		var recipients = self.checkRecipientList( list );
		if ( recipients && recipients.length )
		{
			// Identifier for message
			var id = this.getUniqueIdentifier( 'message' );

			// Send to all recipients
			var time = '' + new Date().getTime();

			// Name of share = name of application without .jsx
			var executable = self.getFileName( path );
			var doorName = executable.substring( 0, executable.lastIndexOf( '.' ) );
			for ( var r = 0; r < recipients.length; r++ )
			{
				var toFriend = self.getFriendFromName( recipients[ r ] );
				var password = self.getUniqueIdentifier( 'shared' );
				var message =
				{
					id: id,
					from: Workspace.loginUsername,
					fromName: Workspace.fullName,
					hostName: self.communicationHostBase,
					recipient: recipients[ r ],
					subject: '<---application--->',
					path: path,
					name: doorName,
					content: description,
					sent: time,
					password: password,
					executable: executable
				}

				// Send when possible
				self.pushPending( toFriend,
				{
					type: 'message',
					id: id,
					message: message
				} );
			}
			// Get the path to the folder containing the application
			var pos = path.lastIndexOf( '/' );
			if ( pos >= 0 )
		 	{
				parentPath = path.substring( 0, pos + 1 );
			}
			else
			{
				parentPath = path.split( ':' )[ 0 ] + ':';
			}
			var door = ( new Door() ).get( parentPath );
			if ( door )
			{
				FriendNetworkDoor.shareDoor( door,
				{
					name: doorName,
					type: 'application (private)',
					description: description,
					password: password,
					friend: netfriend
				} );
			}
		}
		self.onSendApplicationCancel();
	},

	// Stops the share of an application
	clickFriendStopSharingApplication: function( name, id )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		for ( var m = 0; m < netfriend.waiting.length; m++ )
		{
			if ( netfriend.waiting[ m ].id == id )
			{
				var message = netfriend.waiting[ m ];

				// Close the shared door
				FriendNetworkDoor.closeSharedDoor( message.name );

				// Remove from 'waiting'
				self.removeWaiting( netfriend, m );

				// Send a message to the other side
				self.pushPending( netfriend,
				{
					type: 'stopShareApplication',
					id: self.getUniqueIdentifier( 'stopShareApp' ),
					name: message.name,
					path: message.path
				} );
				break;
			}
		}
	},


	// Send file
	///////////////////////////////////////////////////////////////////////////

	// Send file: open a file selector and then a dialog
	clickSendFile: function( name )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		if ( netfriend && !self.sendFileView )
		{
			new Filedialog( false, function( files )
			{
				if ( files.length == 1 && files[ 0 ].Type == 'File' )
				{
					var path = files[ 0 ].Path;

					self.sendFileView = new View(
					{
						title: 'Send file ' + self.getFileName( path ),
						width: 415,
						height: 150,
						resize: false
					} );

					self.sendFileView.setContent( '\
						<div class="VContentTop Padding ScrollArea">\
							<table border="0" class="FullWidth">\
								<tr>\
									<td align="left"><strong>To: </strong></td>\
									<td align="left"><input type="text" size="40" id="to" value="' + netfriend.name + '"></tr>\
								<tr>\
									<td>Message:</td>\
									<td><input type="text" size="40" id="description"></td>\
								</tr>\
							</table>\
						</div>\
						<div class="VContentBottom BorderTop Padding BackgroundDefault" style="height: 50px">\
							<button type="button" class="FloatRight Button IconSmall fa-times" onclick="FriendNetworkFriends.onSendFileCancel()">\
								Cancel\
							</button>\
							<button type="button" class="Button IconSmall fa-check" onclick="FriendNetworkFriends.onSendFileSend(\'' + path + '\')">\
								Send\
							</button>\
						</div>\
					' );

					// Set a keyboard event
					var input = self.getViewElement( self.sendFileView, 'input', 'description' );
					input.onkeydown = function( e )
					{
						if ( !e.shiftKey && ( e.which == 13 || e.keyCode == 13 ) )
						{
							self.onSendFileSend( path );
						}
					};
					setTimeout( function()
					{
						input.focus();
					}, 100 );
				}
				else
				{
					Alert( 'Friend Network', 'Please choose the file to send...' );
				}
			}, 'Mountlist:', 'open', '', 'Please choose the file to send' );
		}
	},

	// User has clicked on 'Cancel'
	onSendFileCancel: function()
	{
		var self = FriendNetworkFriends;
		if ( self.sendFileView )
		{
			self.sendFileView.close();
			self.sendFileView = false;
		}
	},

	// User has clicked on 'Send'
	onSendFileSend: function( path )
	{
		var self = FriendNetworkFriends;

		var list = self.getViewElement( self.sendFileView, 'input', 'to' ).value;
		var description = self.getViewElement( self.sendFileView, 'input', 'description' ).value;

		// Check the recipients
		var recipients = self.checkRecipientList( list );
		if( recipients && recipients.length )
		{
			// Identifier for message
			var id = this.getUniqueIdentifier( 'message' );

			// Password
			var password = this.getUniqueIdentifier( 'fileShare' );

			// Send to all receipients
			var time = '' + new Date().getTime();
			for ( var r = 0; r < recipients.length; r++ )
			{
				var toFriend = self.getFriendFromName( recipients[ r ] );
				var message =
				{
					id: id,
					from: Workspace.loginUsername,
					fromName: Workspace.fullName,
					hostName: self.communicationHostBase,
					recipient: recipients[ r ],
					subject: '<---file--->',
					path: path,
					content: description,
					password: password,
					sent: time
				}
				// Send when possible
				self.pushPending( toFriend,
				{
					type: 'message',
					id: id,
					message: message
				} );
			}
		}
		self.onSendFileCancel();
	},


	// Messages
	///////////////////////////////////////////////////////////////////////////

	// Send message dialog / conversation dialog
	clickSendMessage: function( name, messageId )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );

		if( netfriend && !self.sendMessageViews[ name ] )
		{
			var conversationId = self.getConversationIdFromMessageId( netfriend, messageId );
			var title = 'Send message to ' + name;
			if ( conversationId )
				title = 'Conversation with ' + name;
			var view = new View(
			{
				title: title,
				width: 400,
				height: conversationId ? 380 : 210,
				resize: false,
				top: 'center',
				left: 'center'
			} );
			self.sendMessageViews[ name ] =
			{
				view: view,
				conversationId: conversationId,
				alreadyRepositionned: conversationId
			};
			self.sendMessageViews[ name ].view.onClose =	function()
			{
				// Remove 'hold temporary friend' flag
				var nf = self.getFriendFromName( name );
				nf.keepOpen = false;
			};

			var html = self.getSendMessageHTML( name, messageId, conversationId );
			view.setContent( html );
			if ( netfriend.temporary )
				netfriend.keepOpen = true;

			// Set focus and keyboard events
			self.finishMessageDialog( netfriend, messageId );
		}
	},

	// Set shortcuts and focus in the conversation dialog
	finishMessageDialog: function ( netfriend, messageId )
	{
		var self = FriendNetworkFriends;
		var name = netfriend.name;
		if ( self.sendMessageViews[ name ] )
		{
			var theView = self.sendMessageViews[ name ];
			var conversationId = self.getConversationIdFromMessageId( netfriend, messageId );

			// Set keyboard events to
			var focus;
			var content = self.getViewElement( theView.view, 'textarea', 'content' );
			theView.contentElement = content;
			content.onkeydown = function( e )
			{
				self.stopFriendWidgetFlash( netfriend );

				if ( !e.shiftKey && ( e.which == 13 || e.keyCode == 13 ) )
				{
					if ( e.shiftKey || e.crtlKey )
					{
						return cancelBubble( e );
					}
					else
					{
						self.onSendMessageSend( name, messageId );
						self.onSendMessageCancel( name );
					}
				}
				if ( e.which == 27 || e.keyCode == 27 )
				{
					self.onSendMessageCancel( name );
				}
			};
			// Focus on response
			focus = theView.contentElement;

			// The subject
			var subject = self.getViewElement( theView.view, 'input', 'subject' );
			theView.subjectElement = subject;
			subject.onkeydown = function( e )
			{
				self.stopFriendWidgetFlash( netfriend );
				if ( e.which == 27 || e.keyCode == 27 )
				{
					self.onSendMessageCancel( name );
				}
			}

			// If not conversation, focus on subject
			if ( !conversationId )
			{
				focus = theView.subjectElement;
			}

			// Set the focus
			setTimeout( function()
			{
				focus.focus();
				var eles = theView.view._window.getElementsByClassName( 'ConversationArea' );
				if( eles.length )
				{
					eles[ 0 ].scrollTop = eles[ 0 ].offsetHeight;
				}
			}, 350 );
		}
	},

	// Update all open conversations with the content of a new message
	updateOpenConversations: function( netfriend, messageId, conversationId )
	{
		var self = FriendNetworkFriends;
		var ret = false;
		for ( var n in self.sendMessageViews )
		{
			var theView = self.sendMessageViews[ n ];
			if ( theView.conversationId == conversationId )
			{
				// Increase the height of the view
				var view = theView.view;
				view.setFlag( 'height', 380 );
				view.setFlag( 'title', 'Conversation with ' + netfriend.name );

				// Recenter the window
				if ( !theView.alreadyRepositionned )
				{
					theView.alreadyRepositionned = true;
					var wsHeight = Workspace.screen.getMaxViewHeight();
					view.setFlag( 'top', wsHeight / 2 - 380 / 2 );
				}

				// Update the HTML
				var html = self.getSendMessageHTML( netfriend.name, messageId, conversationId );
				view.setContent( html );

				// Show last message
				var eles = view._window.getElementsByClassName( 'ConversationArea' );
				if( eles.length )
					eles[ 0 ].scrollTop = eles[ 0 ].offsetHeight;

				// Set focus and keyboard events
				self.finishMessageDialog( netfriend, messageId );

				// Message read!
				self.sendMessageRead( netfriend, messageId );
				self.removeMessageFromId( netfriend, messageId );
				ret = true;
			}
		}
		return ret;
	},

	// Returns the text of the 'Send message' / 'Conversation' dialog
	getSendMessageHTML: function( name, messageId, conversationId )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );

		var c = self.getConversationText( netfriend, conversationId, true );
		var conversation = c.conversation;
		var subject = c.subject;
		var text = c.text;
		if ( !conversation )
			messageId = 'none';

		var html = '<div class="ContentFull">\
						<div class="VContentTop Padding" style="height: 85px">\
							<div class="HRow">\
								<div class="FloatLeft HContent30"><strong>To:</strong></div>\
								<div class="FloatRight HContent70"><input class="FullWidth" type="text" size="42" id="to" value="' + name + '"></div>\
							</div>\
							<div class="HRow MarginTop">\
								<div class="FloatLeft HContent30"><strong>Subject:</strong></div>\
								<div class="FloatRight HContent70"><input class="FullWidth" type="text" size="42" id="subject" value="' + subject + '"></div>\
							</div>\
						</div>';

		if( conversation )
		{
			html += 	'<div class="ConversationArea VContentTop ScrollArea Padding" style="top: 85px; height: calc(100% - 245px)">' + text + '</div>';
		}
		html += '		<div class="VContentBottom Padding BorderTop" style="bottom: 50px; height: \
							' + ( !conversation ? 'calc(100% - 135px)' : '100px' ) + '">';
		html += '			<textarea class="Absolute FullWidth" style="height: 100%" id="content" cols="50" rows="5"></textarea>\
						</div>\
						<div class="VContentBottom BorderTop Padding BackgroundDefault" style="height: 50px">\
							<button type="button" class="Button IconSmall" onclick="FriendNetworkFriends.onSendMessageCancel(\'' + name + '\')">\
								Cancel\
							</button>';
		html += 		   '<button type="button" class="FloatRight Button IconSmall" onclick="FriendNetworkFriends.onSendMessageSendAndClose(\'' + name + '\', \'' + messageId + '\')">\
								Send and close\
							</button>';
		if( netfriend.online )
		{
			html += 	   '<button type="button" class="FloatRight Button IconSmall" onclick="FriendNetworkFriends.onSendMessageSend(\'' + name + '\', \'' + messageId + '\')">\
								Send\
							</button>';
		}
		html += 		'</div>\
					</div>';
		return html;
	},

	// User has pressed 'Cancel'
	onSendMessageCancel: function( name )
	{
		var self = FriendNetworkFriends;
		if( self.sendMessageViews[ name ] )
		{
			// Remove 'hold temporary friend' flag
			var netfriend = self.getFriendFromName( name );
			if( netfriend )
			{
				netfriend.keepOpen = false;
				// Stop flashing of icon
				self.stopFriendWidgetFlash( netfriend );
			}

			// Close the view
			self.sendMessageViews[ name ].view.close();
			self.sendMessageViews[ name ] = false;
			self.sendMessageViews = self.cleanArray( self.sendMessageViews );
		}
	},

	// User has pressed 'Send and close'
	onSendMessageSendAndClose: function( name, messageId )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		if( self.onSendMessageSend( name, messageId ) )
			self.onSendMessageCancel( name );
		if( netfriend )
		{
			// Remove message
			self.sendMessageRead( netfriend, messageId );
			self.removeMessageFromId( netfriend, messageId );
		}
	},

	// Verifies the list of recipients of a message
	checkRecipientList: function( list )
	{
		var self = FriendNetworkFriends;

		// Scan receipients
		var recipients;
		var pos = list.indexOf( ';' );
		if ( pos >= 0 )
			recipients = list.split( ';' )
		else
		{
			recipients = [];
			recipients.push( list );
		}

		// Check validity of list
		for ( var r = 0; r < recipients.length; r++ )
		{
			// Remove space before or after recipient name
			var recipient = recipients[ r ];
			while( recipient.substring( 0, 1 ) == ' ' )
				recipient = recipient.substring( 1 );
			if ( !recipient.length )
			{
				recipients.splice( r, 1 );
				r--;
				continue;
			}
			while( recipient.substring( recipient.length - 1 ) == ' ' )
				recipient = recipient.substring( 0, recipient.length - 1 );
			if ( !recipient.length )
			{
				recipients.splice( r, 1 );
				r--;
				continue;
			}
			recipients[ r ] = recipient;

			// Recipient exists?
			if ( !self.getFriendFromName( recipient ) )
			{
				Alert( 'Friend Network', 'Recipient ' + recipient + ' is not listed as friend.' );
				return false;
			}
		}
		return recipients;
	},

	// User has clicked on 'Send'
	onSendMessageSend: function( name, messageId )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );

		if ( self.sendMessageViews[ name ] )
		{
			// Stop flashing of icon
			self.stopFriendWidgetFlash( netfriend );

			// Remove message
			self.sendMessageRead( netfriend, messageId );
			self.removeMessageFromId( netfriend, messageId );

			// Get the content of the dialog
			var view = self.sendMessageViews[ name ].view;
			var content = self.getViewElement( view, 'textarea', 'content' ).value;
			var list = self.getViewElement( view, 'input', 'to' ).value;
			var subject = self.getViewElement( view, 'input', 'subject' ).value;

			// We need at least a subject
			if ( subject == '' )
			{
				Alert( 'Friend Network', 'Please enter some text as subject.' );
				return false;
			}

			// Check the recipients
			var recipients = self.checkRecipientList( list );
			if ( recipients.length == 0 )
				return false;

			// Creates a unique identifier for the conversation?
			var conversationId = self.sendMessageViews[ name ].conversationId;
			if ( !conversationId )
			{
				conversationId = this.getUniqueIdentifier( 'conversation' );
				self.sendMessageViews[ name ].conversationId = conversationId;
			}

			// Identifier for message
			var id = this.getUniqueIdentifier( 'message' );

			// Send to all receipients
			var time = '' + new Date().getTime();
			var message;
			for ( var r = 0; r < recipients.length; r++ )
			{
				var toFriend = self.getFriendFromName( recipients[ r ] );
				message =
				{
					id: id,
					conversationId: conversationId,
					from: Workspace.loginUsername,
					fromName: Workspace.fullName,
					hostName: self.communicationHostBase,
					recipient: recipients[ r ],
					participants: recipients,
					subject: subject,
					content: content,
					sent: time
				}

				// Send when possible
				self.pushPending( toFriend,
				{
					type: 'message',
					id: id,
					message: message
				} );
			}
			return true;
		}

	},

	// Open a message
	clickFriendOpenMessage: function( name, id )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		for ( var m = 0; m < netfriend.messages.length; m++ )
		{
			if ( netfriend.messages[ m ].id == id )
			{
				self.clickSendMessage( name, id )
			}
		}
	},

	// Remove a message from the bubble
	clickFriendRemoveMessage: function( name, id )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		for( var m = 0; m < netfriend.messages.length; m++ )
		{
			if( netfriend.messages[ m ].id == id )
			{
				// Removes message from list
				self.removeMessage( netfriend, m );

				// Update the widgets
				self.refreshFriendWidgets();

				break;
			}
		}
	},

	// Refuse a message
	clickFriendRefuseMessage: function( name, id )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		for( var m = 0; m < netfriend.messages.length; m++ )
		{
			if( netfriend.messages[ m ].id == id )
			{
				var message = netfriend.messages[ m ];

				// Removes message from list
				self.removeMessage( netfriend, m );

				// Send refusal
				self.pushPending( netfriend,
				{
					type: 'refuseMessage',
					id: message.id
				} );

				// Update the widgets
				self.refreshFriendWidgets();
			}
		}
	},

	// Returns a conversation from its identifier
	getConversationIdFromMessageId: function( netfriend, messageId )
	{
		var self = FriendNetworkFriends;
		if( messageId && messageId != 'none' )
		{
			// Find the conversation id
			for( var c in self.conversations )
			{
				var conversation = self.conversations[ c ];
				for( var m = 0; m < self.conversations[ c ].length; m++ )
				{
					var message = conversation[ m ];
					if( message.id == messageId )
					{
						return c;
					}
				}
			}
		}
		return false;
	},

	// Returns the text of a conversation
	getConversationText: function( netfriend, conversationId, getText )
	{
		var self = FriendNetworkFriends;

		var conversation;
		var subject = '';
		var text = '';
		if( conversationId && self.conversations[ conversationId ] )
		{
			conversation = self.conversations[ conversationId ];
			subject = 're ' + conversation[ 0 ].subject;
			if ( getText )
			{
				for ( var c = 0; c < conversation.length; c++ )
				{
					text += '<div class="HRow PaddingTop PaddingBottom">\
						<div style="overflow-x: hidden; word-break: break-word"><strong>' + conversation[ c ].from + '</strong>: ';

					// Replace all cariage return by </BR>
					var content = conversation[ c ].content;
					for ( var cc = 0; cc < content.length; cc++ )
					{
						var ccc = content.charCodeAt( cc );
						if ( ccc == 10 )
						{
							content = content.substring( 0, cc ) + '</BR>' + content.substring( cc + 1 );
							cc += 5;
						}
					}
					text += content + '</div></div>';
				}
			}
		}
		return { conversation: conversation, text: text, subject: subject };
	},

	// Send a 'read' message to the originator of a message
	sendMessageRead: function( netfriend, messageId )
	{
		var self = FriendNetworkFriends;
		if ( messageId && messageId != 'none' )
		{
			// Send 'messageRead' to message originator
			self.pushPending( netfriend,
			{
				type: 'messageRead',
				id: messageId
			} );
		}
	},

	// Removes a message from its id
	removeMessageFromId: function( netfriend, messageId )
	{
		var self = FriendNetworkFriends;
		if ( messageId && messageId != 'none' )
		{
			// Remove the origin message from the message list
			for ( var m = 0; m < netfriend.messages.length; m++ )
			{
				if ( netfriend.messages[ m ].id == messageId )
				{
					self.removeMessage( netfriend, m );
					break;
				}
			}
		}
	},

	/**
	 * List the communities
	 *
	 * Return a list of the communities and their users
	 *
	 * @param url (string) the url of a community or user or empty (lists all)
	 * @param callback (function) function to callback when job is done
	 * @param filters (string) a filter string with '*' and '?' wildcard (as in MsDOS)
	 */
	listCommunities: function( url, callback, extra )
	{
		var self = FriendNetworkShare;
		var hosts = self.currentHosts;

		if ( !self.activated )
		{
			callback( false, false, extra );
			return;
		}

		var hosts;
		FriendNetwork.listHosts( { callback: doListHosts } );
		function doListHosts( msg )
		{
			hosts = msg.hosts;
			if ( hosts )
			{
				// URL empty -> list the communities and their users
				if ( url == '' )
				{
					// First, list all the communities
					var list = getCommunities();

					// Then list the users in each workgroup
					for ( var w = 0; w < list.length; w++ )
					{
						var workgroup = list[ w ];
						workgroup.users = getWorkgroupUsers( workgroup.name );
					}

					// List all users
					var users = [];
					for ( var h = 0; h < hosts.length; h++ )
					{
						users.push( getUserInformation( hosts[ h ] ) );
					}

					// Job done!
					callback( true, list, users, extra );
					return;
				}

				// A @ indicates workgroup and userName
				if ( url.indexOf( '@' ) >= 0 )
				{
					var userName = url.split( '@' )[ 0 ];
					var workgroup = url.split( '@' )[ 1 ];

					// List the communities (workgroup name can be a wildcard)
					var list = getCommunities( workgroup );

					// List the users in the communities
					var users = [];
					for ( var w = 0; w < list.length; w++ )
					{
						var wg = list [ w ];
						wg.users = getWorkgroupUsers( wg.name, userName );
						users = users.concat( wg.users );
					}
					callback( true, list, users, extra );
					return;
				}
				else
				{
					// Look for the username in the current workgroup
					var wg = getCommunities( self.workgroup );
					if ( wg.length == 1 )
					{
						var users = getWorkgroupUsers( self.workgroup, url );
						if ( users.length > 0 )
						{
							wg[ 0 ].users = users;
							callback( true, wg, users, extra );
							return;
						}
					}

					// Look for the name of a workgroup
					wg = getCommunities( url );
					if ( wg.length > 0 )
					{
						var users = [];
						for ( var w = 0; w < wg.length; w++ )
						{
							wg[ w ].users = getWorkgroupUsers( wg[ w ].name );
							users = users.concat( wg[ w ].users );
						}
						callback( true, wg, users, extra );
						return;
					}

					// Look for a generic user without workgroup
					wg = getCommunities( 'friend' );
					if ( wg.length == 1 )
					{
						wg[ 0 ].users = getWorkgroupUsers( 'friend', url );
						callback( true, wg, wg[ 0 ].users, extra );
						return;
					}
					callback( true, [], [], extra );
				}
			}
		}
		function getCommunities( filter )
		{
			var communities = [];
			for ( var h = 0; h < hosts.length; h++ )
			{
				var host = hosts[ h ];
				if ( host.apps )
				{
					for ( var a = 0; a < host.apps.length; a++ )
					{
						var app = host.apps[ a ];
						if ( app.type == 'communication' && filterName( app.info.workgroup, filter ) )
						{
							// Already in the list?
							var found = false;
							for ( var w = 0; w < communities.length; w++ )
							{
								if ( communities[ w ].name == app.info.workgroup )
								{
									found = true;
									break;
								}
							}

							// Add to list!
							if ( !found )
							{
								communities.push
								(
									{
										name: app.info.workgroup,
										image: app.info.image,
										users: []
									}
								)
							}
						}
					}
				}
			}
			return communities;
		}
		function getWorkgroupUsers( workgroupName, filter )
		{
			var users = [];
			for ( var h = 0; h < hosts.length; h++ )
			{
				var host = hosts[ h ];
				if ( host.apps )
				{
					for ( var a = 0; a < host.apps.length; a++ )
					{
						if ( host.apps[ a ].type == 'communication' && host.apps[ a ].info.workgroup == workgroupName )
						{
							if ( filterName( host.name, filter ) )
							{
								users.push( getUserInformation( host ) );
							}
						}
					}
				}
			}
			return users;
		};
		function getUserInformation( host )
		{
			var fullName = '';
			var image = '';
			if ( host.info )
			{
				if ( host.info.fullName )
					fullName = host.info.fullName;
				if ( host.info.image )
					image = host.info.image;
			}
			var userDef =
			{
				name: host.name,
				fullName: fullName,
				image: image,
				sharing: [],
				communities: []
			};
			if ( host.apps )
			{
				for ( var a = 0; a < host.apps.length; a++ )
				{
					var app = host.apps[ a ];
					switch( app.type )
					{
						case 'drive':
						case 'folder':
						case 'application':
							userDef.sharing.push
							(
								{
									name: app.name,
									type: app.type,
									image: app.info.image
								}
							);
							break;
						case 'communication':
							userDef.communities.push( app.info.workgroup );
							break;
					}
				}
			}
			return userDef;
		};
		function filterName( name, filter )
		{
			// No filter-> always true
			if ( !filter || filter == '' )
				return true;

			// No wildcards-> fast
			if ( filter.indexOf( '*' ) < 0 && filter.indexOf( '?' ) < 0 )
				return name == filter;

			// Process wildcards
			var n = 0;
			for ( var f = 0; f < filter.length; f++ )
			{
				var filterChar = filter.charAt( f );
				switch ( filterChar )
				{
					case '*':
						return true;
					case '?':
						n++;
						break;
					default:
						if ( name.charAt( n ) != filterChar )
							return false;
						n++;
						break;
				}
			}

			// Name found?
			if ( n == name.length )
				return true;
			return false;
		}
	},


	// Management of the arrays for friends
	///////////////////////////////////////////////////////////////////////////
	// TODO: reduce the usage of settings, and save the messages in real in a folder

	// Removes a waiting entry from a friend (TODO: duplicated)
	removeWaitingMessage: function( name, id )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		for ( var m = 0; m < netfriend.waiting.length; m++ )
		{
			if ( netfriend.waiting[ m ].id == id )
			{
				self.removeWaiting( netfriend, m );
				break;
			}
		}
	},

	// Removes a pending message from its id
	removePendingMessage: function( name, id )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		for ( var m = 0; m < netfriend.pending.length; m++ )
		{
			if ( netfriend.pending[ m ].id == id )
			{
				self.removePending( netfriend, m );
				break;
			}
		}
	},

	// Removes an element from the array of a friend (from its number of identifier)
	removeFromArray: function( netfriend, name, idOrNumber )
	{
		var found = true;
		var arr = netfriend[ name ];
		if ( typeof idOrNumber == 'string' )
		{
			found = false;
			for ( var p = 0; p < arr.length; p++ )
			{
				if ( arr[ p ].id == idOrNumber )
				{
					found = true;
					idOrNumber = p;
					break;
				}
			}
		}
		if ( found )
		{
			console.log( 'Remove from array: ' + name + idOrNumber );
			arr.splice( idOrNumber, 1 );
		}
	},

	// Push a message in the list of messages of a friend
	pushMessage: function( netfriend, message )
	{
		var self = FriendNetworkFriends;
		netfriend.messages.push( message );
		self.storeFriends();
		self.refreshTrayIconBubble( netfriend );
	},

	// Removes a message from the message list of a friend
	removeMessage: function( netfriend, idOrNumber )
	{
		var self = FriendNetworkFriends;
		self.removeFromArray( netfriend, 'messages', idOrNumber );
		self.storeFriends();
		self.refreshTrayIconBubble( netfriend );
	},

	// Push an entry in the list of waiting messages of a friend
	pushWaiting: function( netfriend, message )
	{
		var self = FriendNetworkFriends;
		netfriend.waiting.push( message );
		self.storeFriends();
		self.refreshTrayIconBubble( netfriend );
	},

	// Removes a entry in the list of waiting messages of a friend
	removeWaiting: function( netfriend, idOrNumber )
	{
		var self = FriendNetworkFriends;
		self.removeFromArray( netfriend, 'waiting', idOrNumber );
		self.storeFriends();
		self.refreshTrayIconBubble( netfriend );
	},

	// Push an entry in the shared list of a friend
	pushShared: function( netfriend, message )
	{
		var self = FriendNetworkFriends;
		netfriend.shared.push( message );
		self.storeFriends();
		self.refreshTrayIconBubble( netfriend );
	},

	// Removes an entry in the shared list of a friend
	removeShared: function( netfriend, idOrNumber )
	{
		var self = FriendNetworkFriends;
		self.removeFromArray( netfriend, 'shared', idOrNumber );
		self.storeFriends();
		self.refreshTrayIconBubble( netfriend );
	},

	// Push a pending message
	pushPending: function( netfriend, message )
	{
		var self = FriendNetworkFriends;
		if ( !message.id )
			message.id = netfriend.name + Math.random() * 1000000 + '|' + Math.random() * 1000000;
		netfriend.pending.push( message );
		self.storeFriends();
		self.refreshTrayIconBubble( netfriend );
	},

	// Remove a pending message
	removePending: function( netfriend, idOrNumber )
	{
		var self = FriendNetworkFriends;
		self.removeFromArray( netfriend, 'pending', idOrNumber );
		self.storeFriends();
		self.refreshTrayIconBubble( netfriend );
	},

	// Find an element in a view
	getViewElement: function( view, tag, id )
	{
		var elements = view.getElementsByTagName ( tag );
		for ( var e = 0; e < elements.length; e++ )
		{
			if ( elements[ e ].id == id )
				return elements[ e ];
		}
		return false;
	},

	// Returns a friend from its name
	getFriendFromName: function( name )
	{
		var self = FriendNetworkFriends;
		for ( var f = 0; f < self.friends.length; f++ )
		{
			if ( self.friends[ f ].name == name )
				return self.friends[ f ];
		}
		return false;
	},

	// Return a friend from the fixed part of its hostname.
	getFriendFromHostName: function( hostName )
	{
		var self = FriendNetworkFriends;

		var hName = self.cleanHostName( hostName );
		var netfriend, fHostName;
		for ( var f = 0; f < self.friends.length; f++ )
		{
			netfriend = self.friends[ f ];
			fHostName = self.cleanHostName( netfriend.hostName );
			if ( fHostName == hName )
				return netfriend;
		}
		return false;
	},

	// Returns a friend from its communication key
	getFriendFromKey: function( key )
	{
		var self = FriendNetworkFriends;
		for ( var c = 0; c < self.friends.length; c++ )
		{
			var netfriend = self.friends[ c ];
			if ( netfriend.communicationKey == key )
				return netfriend;
		}
		return false;
	},
	// Returns an identifier. TODO: make sure it is unique!
	getUniqueIdentifier: function( name )
	{
		return name + '<' + new Date().getTime() + '-' + Math.random() * 1000000 + '>';
	},

	// Clean the properties of an object (not an array! TODO!)
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
		var c = path.charAt( path.length - 1 );
		if ( c != ':' )
		{
			if ( c != '/' )
			{
				path += '/';
			}
		}
		return path + fileName;
	},

	// Friend session handling
	///////////////////////////////////////////////////////////////////////////

	initSessionFriends: function()
	{
		var self = FriendNetworkFriends;
		
		// HOGNE: to prevent sessions from appearing, set this to false!
		self.sessionsActivated = false;

		self.previousSessionHostnames = {};
	},
	
	// Inspect the list of hosts, and add/remove session friends if necessary
	refreshSessionFriends: function( force )
	{
		var self = FriendNetworkFriends;
		if ( !self.sessionsActivated )
			return;

		// A change in the list of hosts?
		//if ( force || self.currentHostsCount != self.sessionHostCount )	A voir!
		{
			self.sessionHostCount = self.currentHostsCount;

			// Check to see if there is need to do a modification
			var hosts = self.currentHosts;

			// Mark all the apps of all the hosts as 'not used'
			var host, apps, app, a, h, s, netfriend;
			if( hosts && hosts.length )
			{
				for ( h = 0; h < hosts.length; h++ )
				{
					host = hosts[ h ];
					if ( host.name == FriendNetworkShare.userInformation.name )
					{
						if ( host.apps )
						{
							for ( a = 0; a < host.apps.length; a++ )
							{
								app = host.apps[ a ];
								if ( app.type == 'communication' )
								{
									app.inUse = false;
								}
							}
						}
					}
				}
			}

			// Checks that an existing session is still online...
			for ( var s = 0; s < self.friends.length; s++ )
			{
				netfriend = self.friends[ s ];
				if ( !netfriend.session )
					continue;

				// Is the session still present in the hosts?
				var friendFound = false;
				var appName = netfriend.hostName.split( '@' )[ 0 ];
				if( typeof( hosts ) != 'undefined' && hosts.length )
				{
					for ( h = 0; h < hosts.length; h++ )
					{
						host = hosts[ h ];
						if ( host.name == FriendNetworkShare.userInformation.name )
						{
							netfriend.listedInHosts = false;

							// Store the apps of the friend
							if ( host.apps )
							{
								apps = hosts[ h ].apps;
								netfriend.apps = apps;
								netfriend.listedInHosts = true;

								// Look for communication channel that matches this one
								for ( a = 0; a < apps.length; a++ )
								{
									app = apps[ a ];
									if ( app.type == 'communication' && app.name == appName )
									{
										app.inUse = true;
										app.session = true;
										friendFound = true;
										break;
									}
								}
							}
						}
						if ( friendFound )
						{
							break;
						}
					}
				}

				// If not found, remove widget, close doors and everything...
				if ( !friendFound )
				{
					var toDelete = true;
					if ( netfriend.connecting || netfriend.connected )
						toDelete = false;
					if ( netfriend.timeOfCreation )
					{
						var time = new Date().getTime();
						if ( time - netfriend.timeOfCreation < 1000 * 5 )
							toDelete = false;
					}
					if ( toDelete )
						self.closeSessionFriend( netfriend );
				}
			}

			// Checks if new session should be created
			if( hosts && hosts.length )
			{
				for ( h = 0; h < hosts.length; h++ )
				{
					host = hosts[ h ];
					if ( host.name == FriendNetworkShare.userInformation.name )
					{
						if ( host.apps )
						{
							for ( a = 0; a < host.apps.length; a++ )
							{
								app = host.apps[ a ];
								if ( app.type == 'communication' )
								{
									if ( !app.inUse )
									{
										// Not the current session!
										if ( app.name != self.communicationHostName )
										{
											// Try to find in friends
											var found = false;
											var hostName = app.name + '@' + FriendNetworkShare.userInformation.name;											
											for ( var f = 0; f < self.friends.length; f++ )
											{
												if ( hostName == self.friends[ f ].hostName )
												{
													netfriend = self.friends[ f ];
													found = true;
													break;
												}
											}
											// Session exists on network and has no widget: create it!
											if ( !found )
											{
												self.createSessionFriend( host.apps, app );
											}
											else
											{
												self.activateSessionFriend( netfriend );
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	},

	// Create a new session
	createSessionFriend: function( apps, app )
	{
		var self = FriendNetworkFriends;

		// Not a previous host? If yes, do nothing (CORRECT Friend Network!)
		var hostName = app.name + '@' + FriendNetworkShare.userInformation.name;
		console.log( 'Creating session host: ' + hostName );
		if ( self.previousSessionHostnames[ hostName ] )
		{
			return;
		}
		self.previousSessionHostnames[ hostName ] = true;
		console.log( 'Really creating! ' + hostName );

		// New session!
		var newFriend = {};
		newFriend.session = true;
		newFriend.machineInfos = app.info.machineInfos;
		newFriend.name = FriendNetworkShare.userInformation.name;
		newFriend.hostName = hostName;
		newFriend.messages = [];
		newFriend.pending = [];
		newFriend.waiting = [];
		newFriend.shared = [];
		newFriend.driveNames = [];
		newFriend.connected = false;
		newFriend.connecting = false;
		newFriend.timeOfCreation = new Date().getTime();
		newFriend.listedInHosts = true;
		newFriend.apps = apps;

		// Create a shaded version of the session icon
		var image = new Image();
		image.onload = function()
		{
			var canvas = document.createElement( 'canvas' );
			canvas.width = 32;
			canvas.height = 32;
			var context = canvas.getContext( '2d' );
			context.drawImage( image, 0, 0, 32, 32 );
			newFriend.icon = canvas.toDataURL();
			newFriend.iconImage = canvas;
	
			var canvas = document.createElement( 'canvas' );
			canvas.width = 32;
			canvas.height = 32;
			var context = canvas.getContext( '2d' );

			// Draw the friend icon
			context.globalAlpha = 0.55;			// Friend icon fade
			context.drawImage( newFriend.iconImage, 0, 0, 32, 32 );
			context.globalAlpha = 0.70;

			// Paste the 'non connected' sign
			if ( self.friendNotConnectedIcon )
				context.drawImage( self.friendNotConnectedIcon, 16, 16, 16, 16 );
			context.globalAlpha = 1;
			newFriend.flashIcon = canvas.toDataURL();

			// Add a widget (Hogne you should create a priority system for the widgets)
			var widget =
			{
				label: 'Friend Network Session ' + app.name,
				name: app.name,
				className: '',
				icon: newFriend.flashIcon,
				getBubbleText: self.getSessionText,
				onOpenBubble: self.onOpenSessionText,
				onCloseBubble: self.onCloseSessionText,
				onDrop: self.onDropSession,
				friend: newFriend
			};
			newFriend.widget = widget;
			widget.identifier = Workspace.addTrayIcon( widget );
			self.sessionWidgets.push( widget );
			self.friends.push( newFriend );	
		}
		image.src = app.info.machineInfos.icon;

		// Set a watchdog to detect the connection
		newFriend.sessionConnecting = false;
		newFriend.sessionConnected = false;
		newFriend.handleConnecting = setInterval( function()
		{
			if ( newFriend.connected )
			{
				if ( !newFriend.sessionConnecting )
				{
					// Send a demand for the list of drives
					newFriend.sessionConnecting = true;
					self.pushPending( newFriend,
					{
						type: 'sessionToSession',
						id: newFriend.connectionKey,
						message: { command: 'knockKnock?' }
					} );
					// One second timeout to try again...
					setTimeout( function()
					{
						if ( !newFriend.sessionConnected )
							newFriend.sessionConnecting = false;
					}, 1100 );
				}
			}
			if ( newFriend.sessionConnected )
			{
				clearInterval( newFriend.handleConnecting );
				newFriend.handleConnecting = false;
			}
		}, 1000 );
	},

	// Activate session friend widget
	activateSessionFriend: function( netfriend )
	{
		if ( netfriend.sessionConnected )
			Workspace.setTrayIconImage( netfriend.widget.identifier, netfriend.icon );
		else
			Workspace.setTrayIconImage( netfriend.widget.identifier, netfriend.flashIcon );
	},

	// Close an existing session
	closeSessionFriends: function()
	{
		var self = FriendNetworkFriends;

		var count;
		do
		{
			count = 0;
			for ( var f = 0; f < self.friends.length; f++ )
			{
				var netfriend = self.friends[ f ];
				if ( netfriend.session )
				{
					self.closeSessionFriend( netfriend );
					count++;
					break;
				}
			}
		} while( count != 0 );
	},
	closeSessionFriend: function( netfriend )
	{
		var self = FriendNetworkFriends;

		// Find in the list
		var found = false;
		for ( var f = 0; f < self.friends.length; f++ )
		{
			if ( self.friends[ f ] == netfriend )
			{
				found = true;
				break;
			}
		}

		// Destroy!
		if ( found && netfriend.session )
		{
			// Disconnects friend
			self.disconnectFriend( netfriend );

			// Removes widget
			if ( netfriend.widget )
			{
				// Remove from Workspace
				Workspace.removeTrayIcon( netfriend.widget.identifier );

				// Remove from second list
				for ( var w = 0; w < self.sessionWidgets.length; w++ )
				{
					if ( self.sessionWidgets[ w ] == netfriend.widget )
					{
						self.sessionWidgets.splice( w );
						break;
					}
				}
				netfriend.widget = false;
			}

			// Stop interval
			if( netfriend.handleConnecting )
			{
				clearInterval( netfriend.handleConnecting );
			}

			// Remove from list of friends
			self.friends.splice( f );
		}
	},

	// Called when the bubble is open
	onOpenSessionText: function()
	{
		var self = FriendNetworkFriends;
		var netfriend = this.friend;			// Friend contained in the Bubble object (this)
		if( netfriend )
		{
			// If the friend is flashing, stop the flash!
			self.stopFriendWidgetFlash( netfriend );
		}
	},

	// Called when the bubble is close: force a redemand of the text for the next time
	onCloseSessionText: function()
	{
		var self = FriendNetworkFriends;
		var netfriend = this.friend;			// Friend contained in the Bubble object (this)
		if ( netfriend )
		{
			// Forces a redemand of the text next time
			netfriend.widget.bubbleSet = false;
		}
	},
	
	// Returns the content of a session widget bubble
	getSessionText: function( friend )
	{
		var self = FriendNetworkFriends;
		var netfriend = this.friend;
		if ( !netfriend.session )
			return;

		// Title of the bubble
		var html = '';
		var title = '';
		title += '<div>\
					<div class="HRow">\
						<div class="FloatLeft">\
							<h3>' + netfriend.machineInfos.os + '</h3>\
						</div>';
		title += 	   '<div class="FloatRight">\
							<span class="fa fa-times Buttons" aria-hidden="true" style="font-size:16px;" title="Turn off computer." onclick="FriendNetworkFriend.clickShutSession(\'' + netfriend.hostName + '\');"></span>\
						</div>';
		title +=   '</div>\
				</div>';

		// Create the whole text
		html += title;

		// Add the icons
		// <span class="Button fa fa-bell-o HoverFeedback" aria-hidden="true" style="font-size:24px" onclick="FriendNetworkFriends.clickSendNotification(\'' + friend.name + '\');" title="Send a notification"></span>\
		// <span class="Button fa fa-paper-plane-o HoverFeedback" aria-hidden="true" style="font-size:24px" onclick="FriendNetworkFriends.clickSendMessage(\'' + friend.name + '\');" title="Send a message"></span>\
		// <span class="Button fa fa-file-o HoverFeedback" aria-hidden="true" style="font-size:24px" onclick="FriendNetworkFriends.clickSendFile(\'' + friend.name + '\');" title="Share a file"></span>\
		// <span class="Button fa fa-folder-o HoverFeedback" aria-hidden="true" style="font-size:24px" onclick="FriendNetworkFriends.clickSendFolder(\'' + friend.name + '\');" title="Share disk or folder"></span>\
		// <span class="Button fa fa-share-square-o HoverFeedback" aria-hidden="true" style="font-size:24px" onclick="FriendNetworkFriends.clickSendApplication(\'' + friend.name + '\');" title="Share an application"></span>\
		html = '<div class="FNetBubble">' + html + '</br>\
					<div class="HRow">\
					</div>\
				</div>';
		return html;
	},

	/**
	 * Return information about the device Friend is currently running on
	 * 
	 * @param flags (string) a list of flags for the function, in plain text separated by space
	 *        'noUserSetting' -> will not load the settings of the machine defined in the Account app
	 * 
	 * callback( information, extra ) 
	 * Returns an object with the following information
	 * {
	 *	   screen: (string) the resolution of the monitor screen
	 *	   browser: (string) the name of the browser Friend is running in
	 *	   browserVersion: (string) the version of the browser
	 *	   browserMajorVersion: (string) the major version of the browser
	 *	   mobile: (boolean) true if on mobile, false if not
	 *	   os: (string) the name of the OS behind
	 *	   osVersion: (string) the version of the OS behind
	 *	   icon: (string) a base64 representation of the device avatar

	 *     // If the 'noUserSettings' flag is NOT defined, and if 
	 *     // the user has defined these information in his account on this device
	 *	   name: (string) the name of the device
	 * 	   description: (string) a description of the device
	 *	   mountLocalDrives: (boolean) true if the user wants his local drives on Friend Network
	 *};
	 */
	getDeviceInformation: function( flags, callback, extra )
	{
		var self = FriendNetworkFriends;

		var unknown = '-';

		// screen
		var screenSize = '';
		if ( screen.width )
		{
			width = ( screen.width ) ? screen.width : '';
			height = ( screen.height ) ? screen.height : '';
			screenSize += '' + width + " x " + height;
		}

		// browser
		var nVer = navigator.appVersion;
		var nAgt = navigator.userAgent;
		var browser = navigator.appName;
		var version = '' + parseFloat(navigator.appVersion);
		var majorVersion = parseInt(navigator.appVersion, 10);
		var nameOffset, verOffset, ix;

		// Opera
		if ((verOffset = nAgt.indexOf('Opera')) != -1)
		{
			browser = 'Opera';
			version = nAgt.substring(verOffset + 6);
			if ((verOffset = nAgt.indexOf('Version')) != -1)
			{
				version = nAgt.substring(verOffset + 8);
			}
		}
		// Opera Next
		if ((verOffset = nAgt.indexOf('OPR')) != -1)
		{
			browser = 'Opera';
			version = nAgt.substring(verOffset + 4);
		}
		// Edge
		else if ((verOffset = nAgt.indexOf('Edge')) != -1)
		{
			browser = 'Microsoft Edge';
			version = nAgt.substring(verOffset + 5);
		}
		// MSIE
		else if ((verOffset = nAgt.indexOf('MSIE')) != -1)
		{
			browser = 'Microsoft Internet Explorer';
			version = nAgt.substring(verOffset + 5);
		}
		// Chrome
		else if ((verOffset = nAgt.indexOf('Chrome')) != -1)
		{
			browser = 'Chrome';
			version = nAgt.substring(verOffset + 7);
		}
		// Safari
		else if ((verOffset = nAgt.indexOf('Safari')) != -1)
		{
			browser = 'Safari';
			version = nAgt.substring(verOffset + 7);
			if ((verOffset = nAgt.indexOf('Version')) != -1)
			{
				version = nAgt.substring(verOffset + 8);
			}
		}
		// Firefox
		else if ((verOffset = nAgt.indexOf('Firefox')) != -1)
		{
			browser = 'Firefox';
			version = nAgt.substring(verOffset + 8);
		}
		// MSIE 11+
		else if (nAgt.indexOf('Trident/') != -1)
		{
			browser = 'Microsoft Internet Explorer';
			version = nAgt.substring(nAgt.indexOf('rv:') + 3);
		}
		// Other browsers
		else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/')))
		{
			browser = nAgt.substring(nameOffset, verOffset);
			version = nAgt.substring(verOffset + 1);
			if (browser.toLowerCase() == browser.toUpperCase())
			{
				browser = navigator.appName;
			}
		}
		// trim the version string
		if ((ix = version.indexOf(';')) != -1) version = version.substring(0, ix);
		if ((ix = version.indexOf(' ')) != -1) version = version.substring(0, ix);
		if ((ix = version.indexOf(')')) != -1) version = version.substring(0, ix);

		majorVersion = parseInt('' + version, 10);
		if (isNaN(majorVersion))
		{
			version = '' + parseFloat(navigator.appVersion);
			majorVersion = parseInt(navigator.appVersion, 10);
		}

		// mobile version
		var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);

		// cookie
		var cookieEnabled = (navigator.cookieEnabled) ? true : false;

		if (typeof navigator.cookieEnabled == 'undefined' && !cookieEnabled)
		{
			document.cookie = 'testcookie';
			cookieEnabled = (document.cookie.indexOf('testcookie') != -1) ? true : false;
		}

		// system
		var os = unknown;
		var clientStrings =
		[
			{s:'Windows 10', r:/(Windows 10.0|Windows NT 10.0)/},
			{s:'Windows 8.1', r:/(Windows 8.1|Windows NT 6.3)/},
			{s:'Windows 8', r:/(Windows 8|Windows NT 6.2)/},
			{s:'Windows 7', r:/(Windows 7|Windows NT 6.1)/},
			{s:'Windows Vista', r:/Windows NT 6.0/},
			{s:'Windows Server 2003', r:/Windows NT 5.2/},
			{s:'Windows XP', r:/(Windows NT 5.1|Windows XP)/},
			{s:'Windows 2000', r:/(Windows NT 5.0|Windows 2000)/},
			{s:'Windows ME', r:/(Win 9x 4.90|Windows ME)/},
			{s:'Windows 98', r:/(Windows 98|Win98)/},
			{s:'Windows 95', r:/(Windows 95|Win95|Windows_95)/},
			{s:'Windows NT 4.0', r:/(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
			{s:'Windows CE', r:/Windows CE/},
			{s:'Windows 3.11', r:/Win16/},
			{s:'Android', r:/Android/},
			{s:'Open BSD', r:/OpenBSD/},
			{s:'Sun OS', r:/SunOS/},
			{s:'Linux', r:/(Linux|X11)/},
			{s:'iOS', r:/(iPhone|iPad|iPod)/},
			{s:'Mac OS X', r:/Mac OS X/},
			{s:'Mac OS', r:/(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
			{s:'QNX', r:/QNX/},
			{s:'UNIX', r:/UNIX/},
			{s:'BeOS', r:/BeOS/},
			{s:'OS/2', r:/OS\/2/},
			{s:'Search Bot', r:/(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
		];
		for (var id in clientStrings)
		{
			var cs = clientStrings[id];
			if (cs.r.test(nAgt))
			{
				os = cs.s;
				break;
			}
		}

		var osVersion = unknown;

		if (/Windows/.test(os))
		{
			osVersion = /Windows (.*)/.exec(os)[1];
			os = 'Windows';
		}

		switch (os)
		{
			case 'Mac OS X':
				osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
				break;

			case 'Android':
				osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
				break;

			case 'iOS':
				osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
				osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
				break;
		}

		// flash (you'll need to include swfobject)
		/* script src="//ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js" */
		var flashVersion = 'no check';
		if (typeof swfobject != 'undefined')
		{
			var fv = swfobject.getFlashPlayerVersion();
			if (fv.major > 0)
			{
				flashVersion = fv.major + '.' + fv.minor + ' r' + fv.release;
			}
			else
			{
				flashVersion = unknown;
			}
		}

		// Calculates the unique device identifier
		var identifier = os + ( mobile ? '_mobile_' : '_desktop_' ) + screenSize;
		var pos = identifier.indexOf( ' ' );
		while ( pos >= 0 )
		{
			identifier = identifier.substring( 0, pos ) + '_' + identifier.substring( pos + 1 );
			pos = identifier.indexOf( ' ' );
		}
		self.uniqueDeviceIdentifier = identifier;

		// If callback, download images and user infos from account.
		if ( callback )
		{
			var sm = new Module( 'system' );
			sm.onExecuted = function( e, d ) 
			{
				var infos;
				if( e == 'ok' )
				{
					if( d )
					{
						try
						{
							d = JSON.parse( d );
							if ( d[ self.uniqueDeviceIdentifier ] != '[]' )
								infos = d[ self.uniqueDeviceIdentifier ];
						}
						catch( e )
						{
							d = null;
						}
					}
				}
				if ( infos )
				{
					sendInfos( infos.image, infos );
				}
				else
				{
					getDefaultImage();
				}				
			}
			sm.execute( 'getsetting', { setting: self.uniqueDeviceIdentifier } );

			function getDefaultImage()
			{
				// Load the image of the session
				if ( os.indexOf( 'Windows' ) >= 0 )
					path = '/webclient/gfx/fnetWindows.png';
				else if ( os.indexOf( 'Mac OS' ) >= 0 )
					path = '/webclient/gfx/fnetMacos.png';
				else if ( os.indexOf( 'Android' ) >= 0 )
					path = '/webclient/gfx/fnetAndroid.png';
				else if ( os.indexOf( 'iOS' ) >= 0 )
					path = '/webclient/gfx/fnetIOS.png';
				else
					path = '/webclient/gfx/fnetLinux.png';
	
				var image = new Image();
				image.onload = function()
				{
					var canvas = document.createElement( 'canvas' );
					canvas.width = 128;
					canvas.height = 128;
					var context = canvas.getContext( '2d' );
					context.drawImage( this, 0, 0, 128, 128 );
					var base64 = canvas.toDataURL();
					sendInfos( base64 );
				}
				image.src = path;
			}
			function sendInfos( image, userDeviceInfos )
			{
				var infos =
				{
					screen: screenSize,
					browser: browser,
					browserVersion: version,
					browserMajorVersion: majorVersion,
					mobile: mobile,
					os: os,
					osVersion: osVersion,
					icon: image
					//cookies: cookieEnabled,
					//flashVersion: flashVersion
				};
	
				// Add extra information 
				if ( userDeviceInfos )
				{
					infos.name = userDeviceInfos.name;
					infos.description = userDeviceInfos.description;
					infos.mountLocalDrives = userDeviceInfos.mountLocalDrives;
				}
				else
				{
					infos.name = os,
					infos.description = '',
					infos.mountLocalDrives = true;			// TODO: Set to FALSE later!
				}
	
				// Return the value
				callback( infos, extra );
			}
		}
		return self.uniqueDeviceIdentifier;
	},

	/**
	 * Returns a unique identifier for the current device
	 * Needs some work!
	 * 
	 * callback( identifier, extra ) where identifier is a string.
	 */
	getUniqueDeviceIdentifier: function( callback, extra )
	{
		var self = FriendNetworkFriends;
		var identifier = self.getDeviceInformation();
		if ( callback )
			callback( identifier, extra );
		return identifier;		
	},




	//
	// API for FriendNetworkDrive
	//////////////////////////////////////////////////////////////////////////////
	getFriendDirectory: function( name, path, callback, extra )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		var response = [];
		if( netfriend )
		{
			var paths = path.split( '/' );
			if ( path =="" )
			{
				// What is the friend sharing?
				if( netfriend.online )
				{
					if( netfriend.apps )
					{
						for ( var a = 0; a < netfriend.apps.length; a++ )
						{
							var app = netfriend.apps[ a ];
							switch( app.type )
							{
								case 'drive':
								case 'folder':
									response.push(
									{
										type: 'directory',
										name: app.name,
										icon: self.friendNetworkDriveFolderIcon,
										iconBase64: self.friendNetworkDriveFolderIconBase64,
										path: name + '/' + app.name,
										description: 'Shared directory',
										isDirectory: true,										
									} );
									break;
								case 'application':
									response.push(
									{
										type: 'file',
										name: app.name,
										icon: self.friendNetworkDriveFileIcon,
										iconBase64: self.friendNetworkDriveFileIconBase64,
										path: name + '/' + app.name,
										description: 'Shared application',
										isDirectory: true,
									} );
									break;
							}
						}
						// List the shared folders and applications
						for ( var s = 0; s < netfriend.shared.length; s++ )
						{
							var share = netfriend.shared[ s ];
							var OK;
							if ( share.subject == '<---folder--->' )
							{
								OK = self.checkFriendOpen( netfriend.name, netshare.name );
								if ( OK )
								{
									response.push(
									{
										name: share.name,
										icon: self.friendNetworkDriveFolderIcon,
										iconBase64: self.friendNetworkDriveFolderIconBase64,
										path: name + '/' + share.name,
										description: typeof share.content != 'undefined' ? share.content : '',
										isDirectory: true,
									} );
								}
							}
							else if ( share.subject == '<---application--->' )
							{
								OK = self.checkFriendOpen( netfriend.name, share.name );
								if ( OK )
								{
									response.push(
									{
										name: share.name,
										icon: self.friendNetworkDriveFileIcon,
										icon: self.friendNetworkDriveFileIconBase64,
										path: name + '/' + share.name,
										description: typeof share.content != 'undefined' ? share.content : '',
										isDirectory: false,
									} );	
								}
							}
						}
						// List the files contained in the messages
						for ( var m = 0; m < netfriend.messages.length; m++ )
						{
							var message = netfriend.messages[ m ];
							if ( message.subject == '<---file--->' )
							{
								if ( !message.loading )
								{
									response.push(
									{
										name: self.getFileName( message.path ),
										icon: message.infos.image,
										path: name + '/' + self.getFileName( message.path ),
										description: typeof message.content != 'undefined' ? message.content : '',
										loaded: message.loaded,
										isDirectory: false,
									} );	
								}
							}
						}
						callback( true, response, extra );
					}
				}
				else
				{
					callback( false, 'ERROR - Friend is no online.', extra );
				}
			}
			else
			{
				// Call the shared door
				var doorName = path.split( '/' )[ 0 ];
				var extraPath = path.substring( doorName.length + 1 );
				self.clickFriendOpen( name, doorName, false, function( response, connection )
				{
					if ( response )
					{
						var door = connection.door;
						door.getDirectory( extraPath, function( icons )
						{
							var answer = [];
							if ( icons )
							{
								for ( var i = 0; i < icons.length; i++ )
								{
									var icon = icons[ i ];
									answer.push(
									{
										name: icon.Filename,
										length: icon.Filesize,
										path: netfriend.name + '/' + icon.Filename,
										icon: icon.Metatype == 'Directory' ? self.friendNetworkDriveFolderIcon : self.friendNetworkDriveFileIcon,
										iconBase64: icon.Metatype == 'Directory' ? self.friendNetworkDriveFolderIconBase64 : self.friendNetworkDriveFileIconBase64,
										description: '',
										isDirectory: icon.Metatype == 'Directory'
									} );
								}
							}
							callback( true, answer, extra );
						} );
					}
					else
					{
						callback( false, 'ERROR - Directory not found.', extra );
					}
				}, extra );
			}
		}
		else
		{
			callback( false, 'ERROR - Not a friend.', extra );
		}
	},
	friendRead: function( name, path, mode, callback, extra )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		if ( netfriend )
		{
			var paths = path.split( '/' );
			if ( path =="" )
			{
				callback( false, 'ERROR - Operation iompossible.', extra );
			}
			else
			{
				if ( netfriend.online )
				{
					// Call the shared door
					var doorName = paths[ 0 ];
					var extraPath = path.substring( doorName.length + 1 );
					self.clickFriendOpen( name, doorName, false, function( response, connection )
					{
						if( response )
						{
							var door = connection.door;
							var finalPath = door.title + ':' + extraPath;
							door.read( finalPath, mode, function( data )
							{
								callback( true, data, extra );
							} );
						}
						else
						{
							callback( false, 'ERROR - File not found.', extra );
						}
					}, extra );
				}
				else
				{
					callback( false, 'ERROR - Friend is not online.', extra );
				}
			}
		}
		else
		{
			callback( false, 'ERROR - Not a friend.', extra );
		}
	},
	friendWrite: function( name, path, data, callback, extra )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		if( netfriend )
		{
			var paths = path.split( '/' );
			if ( path =="" )
			{
				callback( false, 'ERROR - Operation iompossible.', extra );
			}
			else
			{
				if ( netfriend.online )
				{
					// Call the shared door
					var doorName = paths[ 0 ];
					var extraPath = path.substring( doorName.length + 1 );
					self.clickFriendOpen( name, doorName, false, function( response, connection )
					{
						if ( response )
						{
							var door = connection.door;
							var finalPath = door.title + ':' + extraPath;
							data = ConvertArrayBufferToString( data, 'base64' );
							door.write( finalPath, data, function( r )
							{
								callback( true, r, extra );
							} );
						}
						else
						{
							callback( false, 'ERROR - File not found.', extra );
						}
					}, extra );
				}
				else
				{
					callback( false, 'ERROR - Friend is not online.', extra );
				}
			}
		}
		else
		{
			callback( false, 'ERROR - Not a friend.', extra );
		}
	},
	friendGetFileInformation: function( name, path, callback, extra )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		if( netfriend )
		{
			var paths = path.split( '/' );
			if ( path == "" )
			{
				rd = 
				[
					{
						access: '-r---',
						type: 'user'
					},
					{
						access: '-r---',
						type: 'group'
					},
					{
						access: '-r---',
						type: 'others'
					}
				];
				callback( true, rd, extra );
			}
			else
			{
				if( netfriend.online )
				{
					// Call the shared door
					var doorName = paths[ 0 ];
					var extraPath = path.substring( doorName.length + 1 );
					self.clickFriendOpen( name, doorName, false, function( response, connection )
					{
						if ( response )
						{
							var door = connection.door;
							var finalPath = door.title + ':' + extraPath;
							door.getFileInformation( finalPath, data, function( r )
							{
								callback( true, r, extra );
							} );
						}
						else
						{
							callback( false, 'ERROR - File not found.', extra );
						}
					}, extra );
				}
				else
				{
					callback( false, 'ERROR - Friend is not online.', extra );
				}
			}
		}
		else
		{
			callback( false, 'ERROR - Not a friend.', extra );
		}
	},
	friendSetFileInformation: function( name, path, information, callback, extra )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		if( netfriend )
		{
			var paths = path.split( '/' );
			if( path == '' )
			{
				callback( false, 'ERROR - Impossible operation.', extra );
			}
			else
			{
				if( netfriend.online )
				{
					// Call the shared door
					var doorName = paths[ 0 ];
					var extraPath = path.substring( doorName.length + 1 );
					self.clickFriendOpen( name, doorName, false, function( response, connection )
					{
						if ( response )
						{
							var door = connection.door;
							var finalPath = door.title + ':' + extraPath;
							door.setFileInformation( finalPath, information, function( r )
							{
								callback( true, r, extra );
							} );
						}
						else
						{
							callback( false, 'ERROR - File not found.', extra );
						}
					}, extra );
				}
				else
				{
					callback( false, 'ERROR - Friend is not online.', extra );
				}
			}
		}
		else
		{
			callback( false, 'ERROR - Not a friend.', extra );
		}
	},
	friendDosAction: function( name, action, parameters, callback, extra )
	{
		var self = FriendNetworkFriends;
		var netfriend = self.getFriendFromName( name );
		if( netfriend )
		{
			var paths = path.split( '/' );
			if ( path == "" )
			{
				callback( false, 'ERROR - Operation impossible.', extra );
			}
			else
			{
				if( netfriend.online )
				{
					var doorName;
					var newParameters = {};

					// Extract the name of the door from the name of the parameters, ask Hogne!
					for ( var p in parameters )
					{
						var parameter = parameters[ p ];
						if ( parameter.indexOf( ':' ) < 0 )
						{
							var end = parameter.indexOf( '/' );
							if ( end >= 0)
							{
								if ( !doorName )
									doorName = parameter.substring( 0, end );
								newParameters[ p ] = '<---insert--->' + parameter.substring( end + 1 );
							}
							else
							{
								newParameters[ p ] = parameter;
							}
						}
						else
						{
							newParameters[ p ] = parameter;
						}
					}

					// Call the shared door (first one found in path!)
					if ( doorName )
					{
						self.clickFriendOpen( name, doorName, false, function( response, connection )
						{
							if ( response )
							{
								var door = connection.door;
								for ( var p in newParameters )
								{
									var parameter = newParameters[ p ];
									if ( parameter.indexOf( '<---insert--->' ) == 0 )
									{
										newParameters[ p ] = door.title + ':' + parameter.substring( 14 );
									}
								}
								door.dosAction( action, newParameters, function( r )
								{
									callback( true, r, extra );
								} );
							}
							else
							{
								callback( false, 'ERROR - File not found.', extra );
							}
						}, extra );
					}
				}
				else
				{
					callback( false, 'ERROR - Friend is not online.', extra );
				}
			}
		}
		else
		{
			callback( false, 'ERROR - Not a friend.', extra );
		}
	},






	// Power Sharing Widget
	///////////////////////////////////////////////////////////////////////////

	// Power Sharing widget, always on screen, activatewd or not, mouse over
	// Indicates how many are at work now
	createPowerWidget: function( options )
	{
		var self = FriendNetworkFriends;

		var width = 32;
		var height = 32;
		var powerSharingImages =
		{
			'System:gfx/friendnetwork/fnetPowerSharing.png': { width: width, height: height, base64: true },
			'System:gfx/friendnetwork/fnetPowerSharingOnline.png': { width: width, height: height, base64: true },
			'System:gfx/friendnetwork/PowerSharing_Icon_Running0.png': { width: width, height: height, base64: true },
			'System:gfx/friendnetwork/PowerSharing_Icon_Running1.png': { width: width, height: height, base64: true  },
			'System:gfx/friendnetwork/PowerSharing_Icon_Running2.png': { width: width, height: height, base64: true  },
			'System:gfx/friendnetwork/PowerSharing_Icon_Running3.png': { width: width, height: height, base64: true  },
			'System:gfx/friendnetwork/PowerSharing_Icon_Running4.png': { width: width, height: height, base64: true  },
			'System:gfx/friendnetwork/PowerSharing_Icon_Running5.png': { width: width, height: height, base64: true  },
			'System:gfx/friendnetwork/PowerSharing_Icon_Running6.png': { width: width, height: height, base64: true  },
			'System:gfx/friendnetwork/PowerSharing_Icon_Running7.png': { width: width, height: height, base64: true  },
		};

		// Load the images
		Friend.Utilities.loadImages( powerSharingImages, {}, function( response, data, extra )
		{
			if ( response )
			{
				//  Widget base
				self.powerFriend =
				{
					images: powerSharingImages,
					currentImage: 0
				};

				// Add a widget (Hogne you should create a priority system for the widgets)
				var widget =
				{
					label: 'Friend Network Power Widget',
					name: 'Friend Network Power Sharing',
					className: '',
					icon: powerSharingImages[ 'System:gfx/friendnetwork/fnetPowerSharing.png' ],
					getBubbleText: self.getPowerWidgetText,
					onOpenBubble: self.onOpenPowerWidgetText,
					onCloseBubble: self.onClosePowerWidgetText,
					//onDrop: self.onDropFriend,
					powerFriend: self.powerFriend
				};
				self.powerFriend.widget = widget;
				widget.identifier = Workspace.addTrayIcon( widget );

				// Branch the animation of the power widget
				self.powerFriend.handleAnimation = setInterval( function()
				{
					self.animatePowerWidget();
				}, 20 );
			}
		} );
	},

	// Close power widget
	closePowerWidget: function()
	{
		var self = FriendNetworkFriends;

		if ( self.powerFriend && self.powerFriend.widget )
		{
			// Close the animation
			if ( self.powerFriend.handleAnimation )
			{
				clearInterval( self.powerFriend.handleAnimation );
				self.powerFriend.handleAnimation = false;
			}

			// Remove from Workspace
			Workspace.removeTrayIcon( self.powerFriend.widget.identifier );
			self.powerFriend.widget = null;				// Security if new code inserted under! :)

			// Eventually do some cleanup!
			self.powerFriend = null;
		}
	},

	// Animate power widget
	animatePowerWidget: function()
	{
		var self = FriendNetworkFriends;
		var powerFriend = self.powerFriend;
		var widget = powerFriend.widget;

		// Ask for info to Power sharing
		var infos = Friend.Network.Power.getInformation( {} );
		var imageName = 'System:gfx/friendnetwork/fnetPowerSharing.png';
		var connectedTo = 0;
		var running = 0;		
		if ( infos.sharing )
		{
			connectedTo += infos.sharing.connectedTo;
			running += infos.sharing.running;
		}
		if ( infos.using.length )
		{
			for ( var u = 0; u < infos.using.length; u++ )
			{
				connectedTo += infos.using[ u ].connectedTo;
				running += infos.using[ u ].running;
			}
		}
		if( connectedTo )
		{
			imageName = 'System:gfx/friendnetwork/fnetPowerSharingOnline.png';
			if ( running )
			{
				if( !powerFriend.currentImage_info || powerFriend.currentImage_info == 'idle' )
				{	
					powerFriend.currentImage = 0;
					Friend.MagicMemory.reachValue( powerFriend, 'currentImage', 7, { type: 'linear', loop: -1, oneWay: true, duration: 750, integer: true } );
				}
			}
			else
			{
				if( powerFriend.currentImage_info && powerFriend.currentImage_info != 'idle' )
					powerFriend.currentImage_info = 'stop';
			}
		}
		else
		{
			if( powerFriend.currentImage_info && powerFriend.currentImage_info != 'idle' )
				powerFriend.currentImage_info = 'stop';
		}
		if( powerFriend.currentImage_info == 'running' )
		{
			imageName = 'System:gfx/friendnetwork/PowerSharing_Icon_Running' + powerFriend.currentImage + '.png';
		}
		if( imageName != widget.currentImageName )
		{
			widget.currentImageName = imageName;
			Workspace.setTrayIconImage( widget.identifier, powerFriend.images[ imageName ] );
		}
	},
	
	// Called when the bubble is open
	onOpenPowerWidgetText: function()
	{
		var self = FriendNetworkFriends;

		if ( !self.powerFriend.handleRefreshWidget )
		{
			self.powerFriend.handleRefreshWidget = setInterval( function()
			{
				Workspace.refreshTrayIconBubble( self.powerFriend.widget.identifier );
			}, 500 );
		}
	}
	,
	// Called when the bubble is close: force a redemand of the text for the next time
	onClosePowerWidgetText: function()
	{
		var self = FriendNetworkFriends;

		// Stop the update
		clearInterval( self.powerFriend.handleRefreshWidget );
		self.powerFriend.handleRefreshWidget = false;

		// Forces a redemand of the text next time
		self.powerFriend.widget.bubbleSet = false;
	},

	// Builds the text of the Power Widget bubble
	getPowerWidgetText: function()
	{
		var self = FriendNetworkFriends;
		
		// Ask for info to Power sharing
		var infos = Friend.Network.Power.getInformation( {} );

		// Title of the bubble
		var html = '';
		html += '<div>\
					<div class="HRow">\
						<div class="FloatLeft">\
							<h3>Power Sharing</h3>\
						</div>';
		html += 	   '<div class="FloatRight">\
							<span class="fa fa-times Buttons" aria-hidden="true" style="font-size:16px;" title="Turn off." onclick="FriendNetworkFriend.clickTurnOffPower();"></span>\
						</div>';
		html +=   '</div>\
				</div>';

		// You are sharing
		var youShare = '';
		if ( infos.sharing )
		{
			if ( infos.sharing.online )
			{
				if ( infos.sharing.connectedTo == 0 )
				{
					youShare +='<div class="HRow HoverRow Padding">\
									<div class="FloatLeft">\
										- idle.' + '\
									</div>\
								</div>';
				}
				else
				{
					youShare +='<div class="HRow HoverRow Padding">\
									<div class="FloatLeft">\
										- ' + infos.sharing.connectedTo + ' application(s) connected.' + '\
									</div>\
								</div>';
					youShare +='<div class="HRow HoverRow Padding">\
									<div class="FloatLeft">\
										- ' + infos.sharing.percentageShared + '% of your power shared.' + '\
									</div>\
								</div>';
				}
				youShare +='<div class="HRow HoverRow Padding">\
								<div class="FloatLeft">\
									- ' + infos.sharing.earned.toFixed( 3 ) + ' FRND earned.' + '\
								</div>\
							</div>';
			}
			else
			{
				youShare +='<div class="HRow HoverRow Padding">\
								<div class="FloatLeft">\
									offline.' + '\
								</div>\
							</div>';
			}
			youShare = '<div>\
							<div class="HRow">\
								<div class="FloatLeft">\
									<strong>Sharing...</strong>\
								</div>\
							</div>' + youShare + '\
						</div>';
		}

		// You are using...
		var youUse = '';
		var connectedTo = 0;
		var running = 0;
		var cost = 0;
		if ( infos.using.length )
		{
			for ( var u = 0; u < infos.using.length; u++ )
			{
				connectedTo += infos.using[ u ].connectedTo;
				running += infos.using[ u ].running;
				cost += infos.using[ u ].cost;
			}
			if ( connectedTo == 0 )
			{
				youUse +='	<div class="HRow HoverRow Padding">\
								<div class="FloatLeft">\
									- idle\
								</div>\
							</div>';
			}
			else
			{
				youUse +='	<div class="HRow HoverRow Padding">\
								<div class="FloatLeft">\
									- ' + connectedTo + ' machine(s) connected.' + '\
								</div>\
							</div>';
			}
			if ( running )
			{
				youUse +='	<div class="HRow HoverRow Padding">\
								<div class="FloatLeft">\
									- ' + running + ' workers running.' + '\
								</div>\
							</div>';

			}
		}
		else
		{
			youUse +='	<div class="HRow HoverRow Padding">\
							<div class="FloatLeft">\
								- idle.\
							</div>\
						</div>';		
		}
		youUse +='	<div class="HRow HoverRow Padding">\
						<div class="FloatLeft">\
							- ' + cost.toFixed( 3 ) + ' FRND spent.' + '\
						</div>\
					</div>';
		youUse = '<div>\
					<div class="HRow">\
						<div class="FloatLeft">\
							<strong>Using...</strong>\
						</div>\
					</div>' + youUse + '\
				</div>';
		
		// Create the whole text
		if ( youShare != '' )
			html += youShare;
		if ( youUse != '' )
			html += youUse;

		// Add the icons
		// <span class="Button fa fa-bell-o HoverFeedback" aria-hidden="true" style="font-size:24px" onclick="FriendNetworkFriends.clickSendNotification(\'' + friend.name + '\');" title="Send a notification"></span>\
		// <span class="Button fa fa-paper-plane-o HoverFeedback" aria-hidden="true" style="font-size:24px" onclick="FriendNetworkFriends.clickSendMessage(\'' + friend.name + '\');" title="Send a message"></span>\
		// <span class="Button fa fa-file-o HoverFeedback" aria-hidden="true" style="font-size:24px" onclick="FriendNetworkFriends.clickSendFile(\'' + friend.name + '\');" title="Share a file"></span>\
		// <span class="Button fa fa-folder-o HoverFeedback" aria-hidden="true" style="font-size:24px" onclick="FriendNetworkFriends.clickSendFolder(\'' + friend.name + '\');" title="Share disk or folder"></span>\
		// <span class="Button fa fa-share-square-o HoverFeedback" aria-hidden="true" style="font-size:24px" onclick="FriendNetworkFriends.clickSendApplication(\'' + friend.name + '\');" title="Share an application"></span>\
		html = '<div class="FNetBubble">' + html + '</br>\
					<div class="HRow">\
					</div>\
				</div>';
		return html;
	}
};





