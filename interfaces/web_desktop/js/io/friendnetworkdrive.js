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
 * Friend Network Drive Dormant door
 *
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 12/04/2018
 */

Friend = window.Friend || {};

FriendNetworkDrive =
{
	activated: false,
	connected: false,
	roots: {},
	mountedDrives: [],

	// Initialization entry
	start: function()
	{
		var self = FriendNetworkDrive;

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
				
				if ( fnet && fnet.activated && fnet.mountDrive )
				{
					self.activated = true;
					self.connected = true;
					self.mountOnWorkspace = fnet.mountOnWorkspace;

					// Demand the information, with the device avatar and user definition of the device
					FriendNetworkFriends.getDeviceInformation( '', function( infos )
					{
						self.machineInfos = infos;

						// Add the roots							
						var communities = new Friend.FriendNetworkDrive.CommunityRoot();
						communities.init( function( response, community, extra )
						{
							if ( response )
							{
								self.roots[ community.name ] = community;

								// Create the communication channel
								self.addDormantDoor();
							}
						} );
					} );

					// Initialize the communication with the extension, if present
					//FriendNetworkExtension.init( function( response ) 
					//{
					//	self.extensionConnected = response;
					//});

					// Connectivity watchdog (can be left open in case of disconnection of the server)
					if ( !self.handleWatchDog )
					{
						self.handleWatchDog = setInterval( function()
						{
							self.watchDog();
						}, 500 );
					}
				}
			};
			sm.execute( 'getsetting', { setting: 'friendNetwork' } );
		}
	},

	// Shut off the system!
	close: function()
	{
		var self = FriendNetworkDrive;
		if ( !self.activated )
			return;

		// Close communication with the extension
		if ( self.door )
		{
			// Remove door from the Workspace
			var found = false;
			if ( self.driveFileInfo )
			{
				for ( var i = 0; i < Workspace.icons.length; i++ )
				{
					var icon = Workspace.icons[ i ];
					if ( icon.Title == self.driveFileInfo.Title && icon.Type == self.driveFileInfo.Type && icon.Driver == 'Dormant' )
					{
						found = true;
						Workspace.icons.splice( i );
						break;
					}
				}
				self.driveFileInfo = false;
			}
			DormantMaster.delAppDoor( self.door );
			self.door = null;
			if ( found )
			{
				Workspace.refreshDesktop( false, true );
			}
		}
		self.activated = false;
		self.connected = false;
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

	// Watch if the workspace is disconnected
	watchDog: function()
	{
		var self = FriendNetworkDrive;
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

	// Take into account modifications in the preferences of Friend Network
	changeFriendNetworkSettings: function( fnet )
	{
		var self = FriendNetworkDrive;

		// Close everything...
		self.close();
		
		// Set a timeout for the data to be saved on the server
		setTimeout( function()
		{
			self.activate( fnet.mountDrive );				
		}, 1000 );
	},
	
	// Add the door
	addDormantDoor: function()
	{
		var self = FriendNetworkDrive;
		if ( this.door )
			return;

		// Add local dormant door
		this.door =
		{
			title: 'Friend Network',
			driveName: 'Friend Network',
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
			path: ''
		};
		var door = this.door;
		DormantMaster.addAppDoor( this.door );

		// Add the fileinfo to the Workspace icons
		if ( self.mountOnWorkspace )
		{
			self.driveFileInfo =
			{
				ID:       undefined,
				MetaType: 'Directory',
				Path:     door.title + ':',
				Title:    door.title,
				Volume:   door.title,
				Filesize: 0,
				Filename: door.title,
				Type: 'Dormant',
				Dormant: door,
				Mounted: true,
				Visible: true,
				AutoMount: true
			};
			Workspace.icons.push( self.driveFileInfo );
			Workspace.refreshDesktop( false, true );
		}

		function doRefresh( winObj )
		{
			winObj.innerHTML = ':)';
		};
		function doAddWindow( win )
		{
			door.windows.push( win );
		};
		function doExecute( func, args, callback )
		{
			if ( door[ func ] )
			{
				switch( args.length )
				{
					case 0:
						door[ func ]( callback );
						break;
					case 1:
						door[ func ]( args[ 0 ], callback );
						break;
					case 2:
						door[ func ]( args[ 0 ], args[ 1 ], callback );
						break;
					case 3:
						door[ func ]( args[ 0 ], args[ 1 ], args[ 2 ], callback );
						break;
				}
			}
		};
		function doGetDoor()
		{
			var path = door.title + ':' + door.path;
			var info =
			{
				MetaType: 'Meta',
				Title: door.title,
				IconFile: 'apps/WideWeb/icondoor.png',
				Position: 'left',
				Module: 'files',
				Command: 'dormant',
				Filesize: 4096,
				Flags: '',
				Type: 'Dormant',
				Path: path,
				Volume: door.title + ':',
				Dormant: door,
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
			self.getDirectory( path, function( response, directories ) 
			{
				if ( response )
				{
					// Create fake fileinfos
					var answer = [];
					for ( var f = 0; f < directories.length; f++ )
					{
						var file = directories[ f ];
						var fullPath = self.addFileName( path, file.name );
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
							Dormant: door
						};
						answer.push( fileInfo );
					}
					callback( answer );
				}
				else
				{
					callback ( [] );
				}
			} );
		};
		function doGetFileInformation( path, callback )
		{
			self.getFileInformation( path, function( response, information )
			{
				if ( response )
				{
					callback( information );
				}				
				else
				{
					callback ( 'fail<!--separate-->{ "response": "0" }' );
				}
			} );
		};
		function doSetFileInformation( path, permissions, callback )
		{
			self.setFileInformation( path, permissions, function( response )
			{
				if ( response )
				{
					callback ( 'ok<!--separate-->{ "response": "0" }' );
				}				
				else
				{
					callback ( 'fail<!--separate-->{ "response": "0" }' );
				}
			} );
		};
		function doRead( path, mode, callback )
		{
			self.read( path, mode, function( response, data ) 
			{
				if ( response )
				{
					callback ( data );
				}				
				else
				{
					callback ( 'fail<!--separate-->{ "response": "0" }' );
				}
			} );
		};
		function doWrite( path, data, callback )
		{
			self.write( path, data, function( response ) 
			{
				if ( response )
				{
					callback ( 'ok<!--separate-->{ "response": "0" }' );
				}				
				else
				{
					callback ( 'fail<!--separate-->{ "response": "0" }' );
				}
			} );
		};
		function doDosAction( func, args, callback )
		{
			self.dosAction( func, args, function( response ) 
			{
				if ( response )
				{
					callback ( 'ok<!--separate-->{ "response": "0" }' );
				}				
				else
				{
					callback ( 'fail<!--separate-->{ "response": "0" }' );
				}
			} );
		};
	},
	getDirectory: function( path, callback, extra )
	{
		var self = FriendNetworkDrive;
		var baseName = path.split( ':' )[ 1 ];		// Should contain the name of the community, or root friend
		if ( baseName == "" )
		{
			// No path, root of Friend Network Drive. List all roots as folders
			var response = [];
			for ( var r in self.roots )
			{
				var root = self.roots[ r ];
				response.push(
				{
					type: 'directory',
					name: root.name,
					icon: root.icon,
					iconBase64: root.iconBase64,
					path: root.name + '/',
					length: 0,
					isDirectory: true
				} ); 
			}
			callback( true, response, extra );
		}
		else
		{
			var rootName = baseName.split( '/' )[ 0 ];
			var extraPath = baseName.substring( rootName.length + 1 );
			if ( self.roots[ rootName ] )
			{
				self.roots[ rootName ].getDirectory( extraPath, function( response, data, extra )
				{
					callback( response, data, extra );
				}, extra );	
			}
		}
	},
	getFileInformation: function( path, callback, extra )
	{
		var self = FriendNetworkDrive;
		var baseName = path.split( ':' )[ 1 ];		// Should contain the name of the community, or root friend
		if ( baseName == "" )
		{
			// No path, root of Friend Network Drive, information on myself
			var	response = 
			[
				{
					access: '-rwe',
					type: 'user'
				},
				{
					access: '-rwe',
					type: 'group'
				},
				{
					access: '-rwe',
					type: 'others'
				}
			];
			callback( true, response, extra );
		}
		else
		{
			var rootName = baseName.split( '/' )[ 0 ];
			var extraPath = baseName.substring( rootName.length + 1 );
			if ( self.roots[ rootName ] )
			{
				self.roots[ rootName ].getFileInformation( extraPath, function( response, data, extra )
				{
					callback( response, data, extra );
				}, extra );	
			}
		}
	},
	setFileInformation: function( path, information, callback, extra )
	{
		var self = FriendNetworkDrive;
		var baseName = path.split( ':' )[ 1 ];		// Should contain the name of the community, or root friend
		if ( baseName == "" )
		{
			// No path, root of Friend Network Drive, setInformation not available
			callback( false, 'fail<!--separate-->{ "response": "0" }', extra );
		}
		else
		{
			var rootName = baseName.split( '/' )[ 0 ];
			var extraPath = baseName.substring( rootName.length + 1 );
			if ( self.roots[ rootName ] )
			{
				self.roots[ rootName ].setFileInformation( extraPath, information, function( response, data, extra )
				{
					callback( response, data, extra );
				}, extra );	
			}
		}
	},
	read: function( path, mode, callback, extra )
	{
		var self = FriendNetworkDrive;
		var baseName = path.split( ':' )[ 1 ];		// Should contain the name of the community, or root friend
		if ( baseName == "" )
		{
			// No path, root of Friend Network Drive, setInformation not available
			callback( false, 'fail<!--separate-->{ "response": "0" }', extra );
		}
		else
		{
			var rootName = baseName.split( '/' )[ 0 ];
			var extraPath = baseName.substring( rootName.length + 1 );
			if ( self.roots[ rootName ] )
			{
				self.roots[ rootName ].read( extraPath, mode, function( response, data, extra )
				{
					callback( response, data, extra );
				}, extra );	
			}
		}
	},
	write: function( path, data, callback, extra )
	{
		var self = FriendNetworkDrive;
		var baseName = path.split( ':' )[ 1 ];		// Should contain the name of the community, or root friend
		if ( baseName == "" )
		{
			// No path, root of Friend Network Drive, setInformation not available
			callback( false, 'fail<!--separate-->{ "response": "0" }', extra );
		}
		else
		{
			var rootName = baseName.split( '/' )[ 0 ];
			var extraPath = baseName.substring( rootName.length + 1 );
			if ( self.roots[ rootName ] )
			{
				self.roots[ rootName ].write( extraPath, data, function( response, data, extra )
				{
					callback( response, data, extra );
				}, extra );	
			}
		}
	},
	dosAction: function( action, parameters, callback, extra )
	{
		var self = FriendNetworkDrive;
		if ( action == 'copy' )
		{
			// Loads the file
			var path = parameters[ 'from' ];
			var file = new File( path );
			file.onLoad = function( data )
			{
				// Save the file
				var to = parameters[ 'to' ];
				var pos = to.indexOf( ':/' );			// TODO: find why!
				if ( pos >= 0 )
					to = to.substring( 0, pos ) + ':' + to.substring( pos + 2 );
				var save = new File( to );
				save.save( data, null, 'wb' );
				callback ( 'ok<!--separate-->{ "response": "0" }' );
			};
			file.load( 'rb' );
		}
		else
		{
			var rootName;
			var newParameters = {};
			for ( var p in parameters )
			{
				var parameter = parameters[ p ];
				var root = parameter.split( ':' )[ 1 ];		// Contains for example, example 'Communities'
				if ( root )
				{
					var end = root.indexOf( '/' );
					if ( end < 0 )
						end = root.length;
					if ( !rootName )
						rootName = root.substring( 0, end );
					newParameters[ p ] = root.substring( end + 1 );
				}
				else
				{
					newParameters[ p ] = parameter;
				}
			}
			if ( rootName && self.roots[ rootName ] )
			{
				self.roots[ rootName ].dosAction( action, newParameters, function( response, data, extra )
				{
					callback( response, data, extra );
				}, extra );	
			}
		}
	},
	getPath: function( path )
	{
		var pos = path.lastIndexOf( '/' );
		if ( pos < 0 )
			pos = path.lastIndexOf( ':' );
		if ( pos >= 0 )
		{
			return path.substring( 0, pos + 1 );
		}
		return path;
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
	}
};
Friend.FriendNetworkDrive = FriendNetworkDrive;

//
// Communities management
//////////////////////////////////////////////////////////////////////////////////
Friend.FriendNetworkDrive.CommunityRoot = function( )
{
	this.name = 'Communities';	
	this.communities = {};
}
Friend.FriendNetworkDrive.CommunityRoot.prototype.init = function( callback, extra )
{
	// Load the drive icon
	var self = this;
	var image = new Image();
	image.onload = function()
	{
		// Resize to 64x64 and create base64
		var canvas = document.createElement( 'canvas' );
		canvas.width = 32;
		canvas.height = 32;
		var context = canvas.getContext( '2d' );
		context.drawImage( this, 0, 0, 32, 32 );
		self.iconBase64 = canvas.toDataURL();
		self.icon = canvas;

		callback( true, self, extra );
	};
	image.src = '/webclient/gfx/fnetDriveCommunities.png';
};
Friend.FriendNetworkDrive.CommunityRoot.prototype.updateTree = function( callback, extra )
{
	var self = this;

	// Ask for info from FriendNetworkFriends
	FriendNetworkFriends.listCommunities( '', function( response, communities, users, extra )
	{		
		if ( response )
		{
			self.communities = {};
			var count = 0;
			for ( var c = 0; c < communities.length; c++ )
			{
				var community = communities[ c ];
				var newCommunity = 
				{
					name: community.name,
					iconBase64: community.image,
					path: self.name + '/' + community.name,
					users: community.users,
					friends: {}
				};
				self.communities[ newCommunity.name ] = newCommunity;
				
				// Convert all base64 to icon
				var number = 1 + newCommunity.users.length;
				var image = new Image();
				image.newCommunity = newCommunity;
				image.onload = function()
				{
					this.newCommunity.icon = this;
					count++;
				};
				image.src = community.image;
				for ( var u = 0; u < newCommunity.users.length; u++ )
				{
					var user = newCommunity.users[ u ];
					user.iconBase64 = user.image;					

					var image = new Image();
					image.user = user;
					image.onload = function()
					{
						this.user.icon = this;
						count++;
					};
					image.src = newCommunity.users[ u ].image;
				}

				// Set a watch dog for the end!
				var handle = setInterval( function()
				{
					if ( count >= 1 + newCommunity.users.length )
					{
						clearInterval( handle );

						// Create the friends...
						for ( var c in self.communities )
						{
							var community = self.communities[ c ];
							for ( u = 0; u < community.users.length; u++ )
							{
								var parentPath = 'Friend Network:Communities/' + community.name;
								var netfriend = new Friend.FriendNetworkDrive.FriendRoot( community.users[ u ], parentPath, community, users );
								netfriend.init( function( response, nfriend, extra )
								{
									if ( response )
									{
										extra.friends[ nfriend.name ] = nfriend;
									}
								}, community );
							}
						}
						callback( true, self.communities, extra );
					}
				} );
			}
		}
		else
		{
			callback( false, {}, extra );
		}
	}, extra );
};
Friend.FriendNetworkDrive.CommunityRoot.prototype.getDirectory = function( path, callback, extra )
{
	var self = this;

	// Check that the path is community
	if ( path.charAt( path.length - 1 ) == '/' )
		path = path.substring( 0, path.length - 1 );
	var paths = [];
	if ( path != "" )
		paths = path.split( '/' );

	self.updateTree( function( response, communities, extra )
	{
		if ( response )
		{
			var answer = [];

			// The root -> communities
			if ( paths.length == 0 )
			{
				for ( var c in communities )
				{
					var community = communities[ c ];
					answer.push(
					{
						type: 'directory',
						name: community.name,
						icon: community.icon,
						iconBase64: community.iconBase64,
						path: community.path,
						length: 0,
						isDirectory: true
					} );
				}
				callback( true, answer, extra );
			}
			else
			{
				var community = communities[ paths[ 0 ] ];

				// A community, returns the list of friends.
				if ( paths.length == 1 )
				{
					for ( var u = 0; u < community.users.length; u++ )
					{
						var user = community.users[ u ];
						answer.push(
						{
							type: 'directory',
							name: user.name,
							icon: user.icon,
							iconBase64: user.iconBase64,
							path: community.path + '/' + user.name,
							length: 0,
							isDirectory: true
						} );	
					}
					callback( true, answer, extra );
				}
				else
				{
					// "Inside" a friend!
					var friendName = paths[ 1 ];
					var extraPath = path.substring( community.name.length + 1 + friendName.length + 1 );
					if ( community.friends[ friendName ] )
					{
						var nfriend = community.friends[ friendName ];
						nfriend.getDirectory( extraPath, function( response, directory, extra )
						{
							// Add the name of the community to the path
							for ( var d = 0; d < directory.length; d++ )
							{
								var entry = directory[ d ];
								entry.path = friendName + '/' + entry.path;
							}
							callback( response, directory, extra );							
						}, extra );
					}
					else
					{
						callback( false, 'ERROR - Friend not found.', extra );
					}
				}
			}
		}
	}, extra );
}
Friend.FriendNetworkDrive.CommunityRoot.prototype.read = function( path, mode, callback, extra )
{
	var self = this;

	// Check that the path is community
	if ( path.charAt( path.length - 1 ) == '/' )
		path = path.substring( 0, path.length - 1 );
	var paths = [];
	if ( path != "" )
		paths = path.split( '/' );

	self.updateTree( function( response, communities, extra )
	{
		if ( response )
		{
			var answer = [];

			// The root -> should not happen
			if ( paths.length == 0 )
			{
				callback( false, 'ERROR - Operation impossible.', extra );
			}
			else
			{
				var community = communities[ paths[ 0 ] ];

				// Just the name of a community? Impossible!
				if ( paths.length == 1 )
				{
					callback( false, 'ERROR - Operation impossible.', extra );
				}
				else
				{
					// "Inside" a friend!
					var friendName = paths[ 1 ];
					var extraPath = path.substring( community.name.length + 1 + friendName.length + 1 );
					if ( community.friends[ friendName ] )
					{
						var nfriend = community.friends[ friendName ];
						nfriend.read( extraPath, mode, function( response, data, extra )
						{
							callback( response, data, extra );							
						}, extra );
					}
					else
					{
						callback( false, 'ERROR - Friend not found.', extra );
					}
				}
			}
		}
	}, extra );
}
Friend.FriendNetworkDrive.CommunityRoot.prototype.write = function( path, data, callback, extra )
{
	var self = this;

	// Check that the path is community
	if ( path.charAt( path.length - 1 ) == '/' )
		path = path.substring( 0, path.length - 1 );
	var paths = [];
	if ( path != "" )
		paths = path.split( '/' );

	self.updateTree( function( response, communities, extra )
	{
		if ( response )
		{
			var answer = [];

			// The root -> should not happen
			if ( paths.length == 0 )
			{
				callback( false, 'ERROR - Operation impossible.', extra );
			}
			else
			{
				var community = communities[ paths[ 0 ] ];

				// Just the name of a community? Impossible!
				if ( paths.length == 1 )
				{
					callback( false, 'ERROR - Operation impossible.', extra );
				}
				else
				{
					// "Inside" a friend!
					var friendName = paths[ 1 ];
					var extraPath = path.substring( community.name.length + 1 + friendName.length + 1 );
					if ( community.friends[ friendName ] )
					{
						var nfriend = community.friends[ friendName ];
						nfriend.write( extraPath, data, function( response, data, extra )
						{
							callback( response, data, extra );							
						}, extra );
					}
					else
					{
						callback( false, 'ERROR - Friend not found.', extra );
					}
				}
			}
		}
	}, extra );
}
Friend.FriendNetworkDrive.CommunityRoot.prototype.getFileInformation = function( path, callback, extra )
{
	var self = this;

	// Check that the path is community
	if ( path.charAt( path.length - 1 ) == '/' )
		path = path.substring( 0, path.length - 1 );
	var paths = [];
	if ( path != "" )
		paths = path.split( '/' );

	var answer = [];

	// The root / a community -> read only
	if ( paths.length == 0 || paths.length == 1 )
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
		var community = self.communities[ paths[ 0 ] ];

		// "Inside" a friend!
		var friendName = paths[ 1 ];
		var extraPath = path.substring( community.name.length + 1 + friendName.length + 1 );
		if ( community.friends[ friendName ] )
		{
			var nfriend = community.friends[ friendName ];
			nfriend.getFileInformation( extraPath, function( response, data, extra )
			{
				callback( response, data, extra );							
			}, extra );
		}
		else
		{
			callback( false, 'ERROR - Friend not found.', extra );
		}
	}
}
Friend.FriendNetworkDrive.CommunityRoot.prototype.setFileInformation = function( path, permissions, callback, extra )
{
	var self = this;

	// Check that the path is community
	if ( path.charAt( path.length - 1 ) == '/' )
		path = path.substring( 0, path.length - 1 );
	var paths = [];
	if ( path != "" )
		paths = path.split( '/' );

	var answer = [];

	// The root / a community -> read only
	if ( paths.length == 0 || paths.length == 1 )
	{
		callback( false, 'ERROR - Cannot write.', extra );
	}
	else
	{
		var community = self.communities[ paths[ 0 ] ];

		// "Inside" a friend!
		var friendName = paths[ 1 ];
		var extraPath = path.substring( community.name.length + 1 + friendName.length + 1 );
		if ( community.friends[ friendName ] )
		{
			var nfriend = community.friends[ friendName ];
			nfriend.setFileInforation( extraPath, permissions, function( response, data, extra )
			{
				callback( response, data, extra );							
			}, extra );
		}
		else
		{
			callback( false, 'ERROR - Friend not found.', extra );
		}
	}
}
Friend.FriendNetworkDrive.CommunityRoot.prototype.dosAction = function( action, parameters, callback, extra )
{
	var self = this;

	var communityName;
	var newParameters = {};
	for ( var p in parameters )
	{
		var parameter = parameters[ p ];
		if ( parameter.indexOf( ':' ) < 0 )			// Path toward this drive will have been cut
		{
			if ( parameter.indexOf( '/' ) >= 0 )	// We need a real path
			{
				if ( !communityName )
					communityName = parameter.split( '/' )[ 0 ];
				var end = parameter.indexOf( '/' );
				newParameters[ p ] = parameter.substring( end + 1 );
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
	if ( communityName && self.communities[ communityName ] )
	{
		var friendName;
		var community = self.communities[ communityName ];
		for ( var p in newParameters )
		{
			var parameter = newParameters[ p ];
			if ( parameter.indexOf( ':' ) < 0 )			// Path toward this drive will have been cut
			{
				if ( parameter.indexOf( '/' ) >= 0 )	// We need a real path!
				{
					if ( !friendName )
						friendName = parameter.split( '/' )[ 0 ];
					var end = parameter.indexOf( '/' );
					newParameters[ p ] = parameter.substring( end + 1 );
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
		if ( friendName && community.friends[ friendName ] )
		{
			var nfriend = community.friends[ friendName ];
			nfriend.dosAction( action, newParameters, function( response, data, extra )
			{
				callback( response, data, extra );							
			}, extra );
		}
		else
		{
			callback( false, 'ERROR - Friend not found.', extra );
		}
	}
}


//
// Communities management
//////////////////////////////////////////////////////////////////////////////////
Friend.FriendNetworkDrive.FriendRoot = function( user, parentPath, community, users )
{	
	this.driveName = parentPath.split( ':' )[ 0 ];
	this.community = community;
	this.users = users;
	this.name = user.name;
	this.icon = user.icon;
	this.path = community.path + '/' + user.name;
	this.iconBase64 = user.iconBase64;	
}
Friend.FriendNetworkDrive.FriendRoot.prototype.init = function( callback, extra )
{
	callback( true, this, extra );
};
Friend.FriendNetworkDrive.FriendRoot.prototype.getDirectory = function( path, callback, extra )
{
	var self = this;
	if ( path.charAt( path.length - 1 ) == '/' )
		path = path.substring( 0, path.length - 1 );
	FriendNetworkFriends.getFriendDirectory( self.name, path, function( response, directories, extra )
	{
		callback( response, directories, extra );
	}, extra );
}
Friend.FriendNetworkDrive.FriendRoot.prototype.read = function( path, mode, callback, extra )
{
	var self = this;
	
	if ( path.charAt( path.length - 1 ) == '/' )
		path = path.substring( 0, path.length - 1 );

	FriendNetworkFriends.friendRead( self.name, path, mode, function( response, data, extra )
	{
		callback( response, data, extra );
	}, extra );
}
Friend.FriendNetworkDrive.FriendRoot.prototype.write = function( path, data, callback, extra )
{
	var self = this;
	
	if ( path.charAt( path.length - 1 ) == '/' )
		path = path.substring( 0, path.length - 1 );

	FriendNetworkFriends.friendWrite( self.name, path, data, function( response, data, extra )
	{
		callback( response, data, extra );
	}, extra );
}
Friend.FriendNetworkDrive.FriendRoot.prototype.getFileInformation = function( path, callback, extra )
{
	var self = this;
	
	if ( path.charAt( path.length - 1 ) == '/' )
		path = path.substring( 0, path.length - 1 );

	FriendNetworkFriends.friendGetFileInformation( self.name, path, data, function( response, data, extra )
	{
		callback( response, data, extra );
	}, extra );
}
Friend.FriendNetworkDrive.FriendRoot.prototype.setFileInformation = function( permissions, callback, extra )
{
	var self = this;
	
	if ( path.charAt( path.length - 1 ) == '/' )
		path = path.substring( 0, path.length - 1 );

	FriendNetworkFriends.friendSetFileInformation( self.name, path, permissions, function( response, data, extra )
	{
		callback( response, data, extra );
	}, extra );
}
Friend.FriendNetworkDrive.FriendRoot.prototype.dosAction = function( action, parameters, callback, extra )
{
	var self = this;
	
	if ( action == 'copy' )
	{
		// Load the file... should work with everything... gosh so beautiful, if it works... exploits all the system...
		var path = parameters[ 'from' ];
		var file = new File( path );
		file.onLoad = function( data )
		{
			// Save the file
			var to = parameters[ 'to' ];
			var pos = to.indexOf( ':/' );			// TODO: find why!
			if ( pos >= 0 )
				to = to.substring( 0, pos ) + ':' + to.substring( pos + 2 );
			var save = new File( to );
			save.save( data, null, 'wb' );
			callback ( 'ok<!--separate-->{ "response": "0" }' );
		};
		file.load( 'rb' );
	}
	else
	{
		FriendNetworkFriends.friendDosAction( self.name, action, parameters, function( response, data, extra )
		{
			callback( response, data, extra );
		}, extra );
	}
}
