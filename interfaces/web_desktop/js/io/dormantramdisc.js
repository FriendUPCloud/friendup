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
 * Dormant-based ram disc
 *
 * To have a drive when you launch a JSX, insert in the conf:
 * 
 * 	"DormantDisc": 
 * {
 *		"name":"Application Disc",			// If ommited it will be the name of the application
 *		"type":"applicationDisc",			// Should be that for JSX
 *		"persistent":"no",					// 'no'-> ram disc, 'yes'-> folder in Home Friend folder.
 *		"capacity":"1024*1024",				// Maximu capacity (no check for the moment)
 *		"automount":"no"					// 'no'-> stays dormant, 'yes'-> appears on Workspace
 *	},
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 06/08/2018
 * @data created on 06/08/2018 at 6:26AM on my terrasse at the club in front of the swiming pool.
 */
// Possibilities... 
// case 'googledrive': saves on an external Google Drive
// case 'dropbox':
// case 'database': saves the file in a a database, using the new-to-come database drive
// case 'friendnetwork': saves on a shared Friend Network drive, that is anywhere.

Friend = window.Friend || {};
Friend.Doors = Friend.Doors || {};
Friend.Doors.Dormant = Friend.Doors.Dormant ||
{
	activated: false,
	connected: false,
	roots: {},
	doors: {},
	mounted: [],
	useCount: 0,

	// Add a drive
	createDrive: function( options, callback, extra )
	{
		var self = Friend.Doors.Dormant;
		for ( var d in self.doors )
		{
			if ( self.doors[ name ] == options.name )
			{
				callback( false, 'ERROR - Disc with such name already exists.', extra );
				return false;
			}
		}

		// Find a free identifier
		var driveId;
		while ( !driveId || self.doors[ driveId ] )
		 	driveId = options.name + '<dormantDisc' + Math.random() + '>';

		// Add local dormant door
		var name = options.name;
		var door =
		{
			title: options.name,
			driveName: options.name,
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
			path: '',
			capacity: options.capacity ? options.capacity : 1024 * 1024, 
			type: options.type,
			icon: options.icon ? options.icon : '',
			persistent: options.persistent
		};
		this.doors[ driveId ] = door;

		// Create root folder, the filesystem
		var infos =
		{
			door: door,
			name: 'root',
			parent: false
		}
		
		// Creates the file system
		var root;		
		switch ( options.type )
		{
			case 'applicationDisc':
				if ( options.persistent != 'yes' )
				{
					root = new Friend.Doors.Dormant.RamDisc( infos, function( response, fileInfo, extra )
					{
						if ( response )
						{
							DormantMaster.addAppDoor( door );
							if ( options.automount == 'yes' )
								mount();
							callback( true, driveId, extra );
						}
						else
						{
							self.doors = CleanArray( self.doors, door );
							callback( false, 'ERROR - Cannot create root directory.', extra );
						}
					} );
				}
				else
				{
					root = new Friend.Doors.Dormant.PersistentDisc( infos, function( response, fileInfo, extra )
					{
						if ( response )
						{
							DormantMaster.addAppDoor( door );
							if ( options.automount == 'yes' )
								mount();
							callback( true, fileInfo, extra );
						}
						else
						{
							self.doors = CleanArray( self.doors, door );
							callback( false, 'ERROR - Cannot create root directory.', extra );
						}
					} );
				}
				break;
			case 'friendNetworkDisc':			// TODO :)
				break;
			// Not found!
			default:
				self.doors = CleanArray( self.doors, door );
				callback( false, 'ERROR - File system not found.', extra );
				break;
		}
		self.roots[ driveId ] = root;
		
		// Returns the identifier of the drive
		return driveId;

		function mount()
		{
			self.mounted[ driveId ] =
			{
				ID:       undefined,
				MetaType: 'Directory',
				Path:     door.title + ':',
				Title:    door.title,
				Volume:   door.title + ':',
				Filesize: 0,
				Filename: door.title,
				Type: 'Dormant',
				Dormant: door,
				Mounted: true,
				Visible: true,
				AutoMount: true
			};
			Workspace.icons.push( self.mounted[ driveId ] );
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
				AutoMount: options.automount == 'yes' ? true : false
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
			if ( path.indexOf( ':' ) )
				path = path.split( ':' )[ 1 ];
			root.getDirectory( path, function( response, data, extra )
			{
				if ( response )
					callback( data );
				else
					callback( 'fail<!--separate-->{ "response": "0" }' );
			}, extra );				
		};
		function doGetFileInformation( path, callback )
		{
			if ( path.indexOf( ':' ) )
				path = path.split( ':' )[ 1 ];
			root.getFileInformation( path, function( response, data, extra )
			{
				if ( response )
					callback( data );
				else
					callback( 'fail<!--separate-->{ "response": "0" }' );
			}, extra );				
		};
		function doSetFileInformation( path, permissions, callback )
		{
			if ( path.indexOf( ':' ) )
				path = path.split( ':' )[ 1 ];
			root.setFileInformation( path, permissions, function( response, data, extra )
			{
				if ( response )
					callback( data );
				else
					callback( 'fail<!--separate-->{ "response": "0" }' );
			}, extra );				
		};
		function doRead( path, mode, callback )
		{
			if ( path.indexOf( ':' ) )
				path = path.split( ':' )[ 1 ];
			root.read( path, mode, function( response, data, extra )
			{
				if ( response )
					callback( data );
				else
					callback( 'fail<!--separate-->{ "response": "0" }' );
			}, extra );				
		};
		function doWrite( path, data, callback )
		{
			if ( path.indexOf( ':' ) )
				path = path.split( ':' )[ 1 ];
			root.write( path, data, function( response, data, extra )
			{
				if ( response )
					callback( data );
				else
					callback( 'fail<!--separate-->{ "response": "0" }' );
			}, extra );				
		};
		function doDosAction( action, parameters, callback )
		{
			var newParameters = {};
			for ( var p in parameters )
			{
				var parameter = parameters[ p ];
				var pos = parameter.indexOf( ':/' );		// HOGNE: the bug is still there!
				if (  pos >= 0 )
					parameter = parameter.substring( 0, pos ) + ':' + parameter.substring( pos + 2 );

				var paths = parameter.split( ':' );
				if ( paths.length > 1 )
				{
					var drive = paths[ 0 ];
					if ( drive == door.title )
					{
						newParameters[ p + '_local' ] = true;
						newParameters[ p ] = paths[ 1 ];
					}
				}
				else
				{
					newParameters[ p ] = parameter;
				}
			}
			root.dosAction( action, newParameters, function( response, data, extra )
			{
				if ( response )
					callback( 'ok<!--separate-->{ "response": "0" }' );
				else
					callback( 'fail<!--separate-->{ "response": "0" }' );
			}, extra );
		};
	},

	// Remove a drive
	destroyDrive: function( driveId, options, callback, extra )
	{
		var self = Friend.Doors.Dormant;

		var root = self.roots[ driveId ];
		var door = self.doors[ driveId ];
		if ( root )
		{
			var done = false;
			if ( options.destroyOnIdle )
			{
				var timeout = 1000 * 60 * 1;		// Should be as long as necessary, world networking, big files possible!
				if ( options.timeout )
					timeout = options.timeout;
				var then = new Date().getTime();
				var handle = setInterval( function()
				{
					if ( done )
					{
						clearTimeout( handle );
					}
					else
					{
						var now = new Date().getTime();
						if ( now - then > timeout )
						{
							Notify( { title: 'Friend Network', text: 'Application disc timeout. (disc name: ' + name + ')' } );
							// Idea put Friend network notifications in user icon in workspace.
							options.force = true;
							doDestroy();
							clearTimeout( handle );
						}
						else
						{
							doDestroy();
						}
					}
				}, 1000 );
			}
			else
			{
				doDestroy();
			}
			function doDestroy()
			{
				root.destroy( options, function( response, data, extra )
				{
					if ( response )
					{
						self.roots = CleanArray( self.roots, root );
						var found = false;
						for ( var i = 0; i < Workspace.icons.length; i++ )
						{
							var icon = Workspace.icons[ i ];
							if ( icon.Title == door.title )
							{
								found = true;
								break;
							}
						}
						if ( found )
						{
							Workspace.icons.splice( i, 1 );
							Workspace.refreshDesktop( false, true );
						}
						DormantMaster.delAppDoor( door );
						self.doors = CleanArray( self.doors, door );
						callback( true, '', extra );
						done = true;
					}
					else
					{
						if ( !options.destroyOnIdle )
						{
							callback( false, data, extra );
						}
					}
				}, extra );
			}
		}
	},
	getDoor: function( options, callback, extra )
	{
		var door = self.doors[ options.driveId ];
		callback( typeof door != 'undefined', { door: door }, extra );
		return door;
	}
};





/**
 * Dormant Ram Disc Directory / File System
 */
Friend.Doors.Dormant.RamDisc = function( infos, callback, extra )
{
	var self = this;

	self.parent = infos.parent;
	self.door = infos.door;
	self.name = infos.name;
	self.isDirectory = true;
	self.writable = true;	
	self.root = {};

	// Object is also a fileInfo
	if ( self.parent )
	{
		self.Title = infos.name;
		self.Filename = infos.name;
		self.Path = infos.path;
		if ( self.Path.charAt( self.Path.length - 1 ) != ':' )
			self.Path += '/';
		self.Path += infos.name;
	}
	else
	{
		self.Title = self.door.title;
		self.Filename = self.door.title;
		self.Path = self.door.title + ':';
	}
	self.Type = 'Directory';
	self.MetaType = 'Directory';
	self.Icon = 'Directory';
	self.Position = 'left';
	self.Module = 'files';
	self.Command = 'dormant';
	self.Filesize = 0;
	self.Flags = '';
	self.Dormant = infos.door;
	if ( infos.permissions )
		self.Permissions = infos.permissions;
	else
	{
		self.Permissions =
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
	}

	// Load the drive icon
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
Friend.Doors.Dormant.RamDisc.prototype.destroy = function( options, callback, extra )
{
	var self = this;

	// Get the answer from all sub-directories
	var count = 0;
	var claims = [];
	for ( var e in self.root )
	{
		var element = self.root[ e ];
		if ( element.isDirectory )
		{
			count++;
			element.destroy( options, function( response, data, extra ) 
			{
				if ( !response )
				{
					claims.push( data );
				} 
				count--;
			}, element );
		}
		else if ( element.busy )			// Danger!
		{
			claims.push
			( 
				{
					path: element.Path,
					fileName: element.Filename,
					windows: [], 			// Name of the open windows using the file
					applications: [], 		// ID of the open applications using the file
					message: 'File is in use.'
				}
			)
		}
	}
	var handle = setInterval( function()
	{
		if ( count == 0 )
		{
			clearInterval( handle );
			if ( claims.length )
				callback( false, claims, extra );
			else
				callback( true, '', extra );
		}
	}, 20 );
};
Friend.Doors.Dormant.RamDisc.prototype.getDirectory = function( path, callback, extra )
{
	var self = this;

	// Clean the path
	if ( path.charAt( path.length - 1 ) == '/' )
		path = path.substring( 0, path.length - 1 );
	var paths = [];
	if ( path != '' )
		paths = path.split( '/' );

	// A wildcard at the end of path?
	var filter = '';
	if ( paths.length == 1 && isFilter( paths[ 0 ] ) )
	{
		filter = paths[ 0 ];
		paths.length = 0;
	}
	else if ( paths.length == 2 && isFilter( paths[ 1 ] ) )
	{
		filter = paths[ 1 ];
		paths.length = 1;
	}
	
	// Himself!
	if ( paths.length == 0 )
	{
		var directories = [];
		var files = [];
		var error = false;
		var lastError = '';
		var numberOfElements = 0;
		for ( var e in self.root )
		{
			var element = self.root[ e ];
			if ( filterName( element.Filename, filter ) )
				numberOfElements++;
		}

		for ( var e in self.root )
		{
			var element = self.root[ e ];
			if ( filterName( element.Filename, filter ) )
			{
				element.getFileInfo( '', function( response, fileInfo, extra )
				{
					if ( response )
					{
						if ( fileInfo.isDirectory )
						{
							directories.push( fileInfo );			
						}
						else
						{
							files.push( fileInfo );
						}
					}
					else
					{
						error = true;
						lastError = data;
					}
					count++;
				}, extra );
			}
		}

		// Set a interval to check for end
		var handle = setInterval( function()
		{
			if ( directories.length + files.length == numberOfElements )
			{
				clearInterval( handle );

				if ( !error )
				{
					// Find better ways to sort!
					var answer = directories.concat( files );
					callback( true, answer, extra );
				}
				else
				{
					callback( false, lastError, extra );
				}
			}
		}, 20 );		// Every 1/50th of second

	}
	else
	{
		var element = self.root[ paths[ 0 ] ];
		if ( element )
		{
			if ( element.isDirectory )
			{
				// Recursive call to sub-directory...
				paths[ 0 ] = '';							// Removes name of dir from path...
				var extraPath = paths.join( '/' ).substring( 1 );
				element.getDirectory( extraPath, function( response, data, extra )
				{
					callback( response, data, extra );
				}, extra );
			}
			else
			{
				// File not found
				callback( false, 'fail<!--separate-->{ "response": "0" }' , extra );
			}
		}
		else
		{
			// Not a directory
			callback( false, 'fail<!--separate-->{ "response": "0" }' , extra );
		}
	}
	// Filtering...
	function isFilter( filter )
	{
		return filter.indexOf( '*' ) >= 0 || filter.indexOf( '?' ) >= 0;
	}
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
};
Friend.Doors.Dormant.RamDisc.prototype.read = function( path, mode, callback, extra )
{
	var self = this;

	// Clean the path
	if ( path.charAt( path.length - 1 ) == '/' )
		path = path.substring( 0, path.length - 1 );
	var paths = [];
	if ( path != '' )
		paths = path.split( '/' );

	// Himself!
	if ( paths.length == 0 )
	{
		// Impossible!
		callback( false, 'fail<!--separate-->{ "response": "0" }' , extra );
	}
	else
	{
		var element = self.root[ paths[ 0 ] ];
		if ( element )
		{
			// Recursive call to sub-directory...
			paths[ 0 ] = '';							// Removes name of dir from path...
			var extraPath = paths.join( '/' ).substring( 1 );
			element.read( extraPath, mode, function( response, data, extra )
			{
				callback( response, data, extra );
			}, extra );
		}
		else
		{
			// File not found
			callback( false, 'fail<!--separate-->{ "response": "0" }' , extra );
		}
	};
};
Friend.Doors.Dormant.RamDisc.prototype.write = function( path, data, callback, extra )
{
	var self = this;

	// Clean the path
	if ( path.charAt( path.length - 1 ) == '/' )
		path = path.substring( 0, path.length - 1 );
	var paths = [];
	if ( path != '' )
		paths = path.split( '/' );
	var fileData = data;

	// Himself!
	if ( paths.length == 0 )
	{
		// Impossible!
		callback( false, 'fail<!--separate-->{ "response": "0" }' , extra );
	}
	else
	{
		var elementName = paths[ 0 ];
		paths[ 0 ] = '';							// Removes name of dir from path...
		var extraPath = paths.join( '/' ).substring( 1 );
		self.isWritable( {}, function( response, data, extra )
		{
			if ( response )
			{
				var element = self.root[ elementName ];
				if ( !element )
				{
					var options =
					{
						name: elementName,
						path: extraPath,
						door: self.door,
						parent: self
					}
					element = new Friend.Doors.Dormant.RamDisc.File( options, function( response, data2, extra2 )
					{
						self.root[ elementName ] = data2;
						write( data2, extraPath, fileData, extra2 );
					}, extra );
				}
				else
				{
					write( element, extraPath, fileData, extra );
				}
			}
		} );
	}
	function write( element, path, data, extra )
	{
		// Recursive call to sub-directory...
		element.write( path, data, function( response, data, extra2 )
		{
			callback( response, data, extra2 );
		}, extra );
	}
};
Friend.Doors.Dormant.RamDisc.prototype.getFileInfo = function( path, callback, extra )
{
	var self = this;

	// Clean the path
	if ( path.charAt( path.length - 1 ) == '/' )
		path = path.substring( 0, path.length - 1 );
	var paths = [];
	if ( path != '' )
		paths = path.split( '/' );

	// Himself!
	if ( paths.length == 0 )
	{
		var fileInfo = 
		{
			Title: self.Title,
			Filename: self.Filename,
			Path: self.Path,
			Type: self.Type,
			MetaType: self.MetaType,
			Icon: self.Icon,
			Position: self.Position,
			Module: self.Module,
			Command: self.Command,
			Filesize: self.Filesize,
			Flags: self.Flags,
			Dormant: self.door,
			Permissions: self.Permissions
		}
		callback( true, fileInfo, extra );
	}
	else
	{
		var element = self.root[ paths[ 0 ] ];
		if ( element )
		{
			// Recursive call to sub-directory...
			paths[ 0 ] = '';							// Removes name of dir from path...
			var extraPath = paths.join( '/' ).substring( 1 );
			element.getFileInfo( extraPath, function( response, data, extra )
			{
				callback( response, data, extra );
			}, extra );
		}
		else
		{
			// File not found
			callback( false, 'fail<!--separate-->{ "response": "0" }' , extra );
		}
	};
};
Friend.Doors.Dormant.RamDisc.prototype.getFileInformation = function( path, callback, extra )
{
	var self = this;

	// Clean the path
	if ( path.charAt( path.length - 1 ) == '/' )
		path = path.substring( 0, path.length - 1 );
	var paths = [];
	if ( path != '' )
		paths = path.split( '/' );
	
	// Himself!
	if ( paths.length == 0 )
	{
		callback( true, self.Permissions, extra );
	}
	else
	{
		var element = self.root[ paths[ 0 ] ];
		if ( element )
		{
			// Recursive call to element...
			paths[ 0 ] = '';							// Removes name of dir from path...
			var extraPath = paths.join( '/' ).substring( 1 );
			element.getFileInformation( extraPath, function( response, data, extra )
			{
				callback( response, data, extra );
			}, extra );
		}
		else
		{
			// File not found
			callback( false, 'fail<!--separate-->{ "response": "0" }' , extra );
		}
	};
};
Friend.Doors.Dormant.RamDisc.prototype.setFileInformation = function( path, permissions, callback, extra )
{
	var self = this;

	// Clean the path
	if ( path.charAt( path.length - 1 ) == '/' )
		path = path.substring( 0, path.length - 1 );
	var paths = [];
	if ( path != '' )
		paths = path.split( '/' );
	

	// Himself!
	if ( paths.length == 0 )
	{
		self.Permissions = permissions; 	// Do some checking on format! Can block everything.
		callback( true, 'ok<!--separate-->{ "response": "0" }', extra );
	}
	else
	{
		var element = self.root[ paths[ 0 ] ];
		if ( element )
		{
			// Recursive call to element...
			paths[ 0 ] = '';							// Removes name of dir from path...
			var extraPath = paths.join( '/' ).substring( 1 );
			element.setFileInformation( extraPath, permissions, function( response, data, extra )
			{
				callback( response, data, extra );
			}, extra );
		}
		else
		{
			// File not found
			callback( false, 'fail<!--separate-->{ "response": "0" }', extra );
		}
	};
};
// Message going downward!
Friend.Doors.Dormant.RamDisc.prototype.isWritable = function( options, callback, extra )
{
	var self = this;

	// Me!
	if ( !self.writable )
	{
		// Not writable, stop the process here, and climb back up!
		callback( false, 'ERROR - Directory is write protected ' + self.Path, extra );
	}
	else
	{
		// A parent?
		if ( self.parent )
		{
			self.parent.isWritable( options, function( response, data, extra )
			{
				callback( response, data, extra );
			}, extra );
		}
		else
		{
			// Bottom of tree, it is writable!
			callback( true, '', extra );
		}
	}
};
// Message going downward!
Friend.Doors.Dormant.RamDisc.prototype.getFullPath = function( options, callback, extra )
{
	var self = this;

	// A parent?
	if ( self.parent )
	{
		self.parent.getFullPath( options, function( response, data, extra )
		{
			if ( data.charAt( data.length - 1 ) != ':' )
				data += '/';
			data += self.Filename;
			callback( response, data, extra );
		}, extra );
	}
	else
	{
		// Bottom of tree, it is writable!
		callback( true, self.Filename + ':', extra );
	}
};
Friend.Doors.Dormant.RamDisc.prototype.dosAction = function( action, parameters, callback, extra )
{
	var self = this;

	var newParameters = {};
	for ( var p in parameters )
	{		
		var parameter = parameters[ p ];
		if ( parameters[ p + '_local' ] )
		{
			var split = parameter.split( '/' );
			if ( split.length >= 1 )
			{
				newParameters[ p + '_element' ] = split[ 0 ];
				newParameters[ p ] = split[ 1 ];
				if ( typeof newParameters[ p ] == 'undefined' )
					newParameters[ p ] = '';
			}
			newParameters[ p + '_local' ] = true;
		}
		else
		{
			newParameters[ p ] = parameter;
		}
	}
	switch( action )
	{
		case 'rename':
			self.isWritable( {}, function( response )
			{
				if ( response )
				{
					// Himself?
					if ( newParameters[ 'path_element' ] == '' && newParameters[ 'path' ] == '' )
					{
						self.name = GetFilename( newParameters[ 'newname' ] );
						self.Filename = self.name;
						self.getFullPath( {}, function( response, data, extra ) 
						{
							self.Path = data;
							callback( true, 'ok<!--separate-->{ "response": "0" }', extra );
						}, extra );
					}
					else
					{
						// Go recursive!
						if ( newParameters[ 'path_element' ] )
						{
							var element = self.root[ newParameters[ 'path_element' ] ];
							newParameters[ 'path_element' ] = false;
							if ( element )
							{
								if ( newParameters[ 'path' ] == '' )
								{
									element.dosAction( action, newParameters, function( response, data, extra ) 
									{
										if ( response )
										{
											self.root = CleanArray( self.root, element );
											self.root[ element.Filename ] = element;
											callback( response, data, extra );
										}
									}, extra );		
								}
								else
								{
									element.dosAction( action, newParameters, function( response, data, extra ) 
									{
										callback( response, data, extra );
									}, extra );		
								}
							}
							if ( element )
							{
							}
							else
							{
								// File not found, or no one did it...
								callback( false, 'fail<!--separate-->{ "response": "0" }', extra );
							}
						}
						else
						{
							// File not found, or no one did it...
							callback( false, 'fail<!--separate-->{ "response": "0" }', extra );
						}	
					}
				}		
				else
				{
					// Write protected
					callback( false, 'fail<!--separate-->{ "response": "0" }', extra );
				}		
			} );
			return true
	
		case 'delete':		
			self.isWritable( {}, function( response )
			{
				if ( response )
				{
					// Himself?
					if ( newParameters[ 'path_element' ] == '' && newParameters[ 'path' ] == '' )
					{
						var count = 0;
						for ( var e in self.root )
						{
							count++;
							var element = self.root[ e ];
							element.destroy( {}, function( response, data, extra )
							{
								count--;
								if ( count == 0 )
								{
									// Nothing else to do...
									callback( true, 'ok<!--separate-->{ "response": "0" }', extra );
								}
							}, extra );
						}
					}
					else
					{
						// Go recursive!
						if ( newParameters[ 'path_element' ] )
						{
							var element = self.root[ newParameters[ 'path_element' ] ];
							newParameters[ 'path_element' ] = false;
							if ( element )
							{
								element.dosAction( action, newParameters, function( response, data, extra ) 
								{
									if ( response && data .substring( 0, 4 ) == 'done' )
									{
										self.root = CleanArray( self.root, element );
										callback( response, 'ok<!--separate-->{ "response": "0" }', extra );
									}
									else
									{
										callback( response, data, extra );
									}
								}, extra );
							}
							else
							{
								// File not found
								callback( false, 'fail<!--separate-->{ "response": "0" }', extra );
							}
						}
						else
						{
							// File not found
							callback( false, 'fail<!--separate-->{ "response": "0" }', extra );
						}
					}
				} 
				else
				{
					// Write protected
					callback( false, 'fail<!--separate-->{ "response": "0" }', extra );
				}
			}, extra );
			return true;

		case 'makedir':
			self.isWritable( {}, function( response )
			{
				if ( response )
				{
					if ( newParameters[ 'id' ] == 'local' )
					{
						var dirName = newParameters[ 'path_element' ];
						if ( dirName != '' )
						{
							createDir( dirName );
						}
					}
					else
					{
						// Not for me! Go recursive!
						if ( newParameters[ 'path_element' ] == '' && newParameters[ 'path' ] != '' )
						{
							createDir( newParameters[ 'path' ] );
						}
						else
						{
							var element = newParameters[ 'path_element' ];
							newParameters[ 'path_element' ] = false;
							if ( element )
							{
								element.dosAction( action, newParameters, function( response, data, extra ) 
								{
									callback( response, data, extra );
								}, extra );
							}
							else
							{
								// File not found
								callback( false, 'fail<!--separate-->{ "response": "0" }', extra );
							}
						}
					}
				} 
				else
				{
					// Write protected
					callback( false, 'fail<!--separate-->{ "response": "0" }', extra );
				}

				// Create the directory
				function createDir( name )
				{
					var infos = 
					{
						door: self.door,
						parent: self,
						name: name,
						path: self.Path
					};
					new Friend.Doors.Dormant.RamDisc( infos, function( response, data, extra )
					{
						if ( response )
						{
							self.root[ name ] = data;
							callback( true, 'ok<!--separate-->{ "response": "0" }', extra );
						}
						else
						{
							// Cannot create directory...
							callback( true, 'ok<!--separate-->{ "response": "0" }', extra );
						}
					}, extra );
				}
			}, extra );
			break;

		case 'copy':		
			if ( newParameters[ 'from_local' ] )
			{
				if ( newParameters[ 'from_element' ] && newParameters[ 'from' ] == '' )	
				{
					var element = self.root[ newParameters[ 'from_element' ] ];
					if ( element )
					{
						element.read( '', 'rb', function( response, data, extra )
						{
							if ( response )
							{
								finish( data, extra );
							}
						}, extra );
					}
					else
					{
						// Should never occur!
						callback( false, 'ok<!--separate-->{ "response": "0" }', extra );
					}
				}
				else
				{
					var element = self.root[ newParameters[ 'from_element' ] ];
					newParameters[ 'from_element' ] = false;
					if ( element )
					{
						element.dosAction( action, newParameters, function( response, data, extra ) 
						{
							callback( response, data, extra );
						}, extra );
					}
					else
					{
						// File not found
						callback( false, 'fail<!--separate-->{ "response": "0" }', extra );
					}
				}
			}
			else
			{
				// Not on the drive filesystem...
				if ( newParameters[ 'from' ] )
				{
					var file = new File( newParameters[ 'from' ] );
					file.onLoad = function()
					{
						if ( data != 'kmjhjkh' )
						{
							finish( data, extra );
						}
						else
						{
							// File not found
							callback( false, 'fail<!--separate-->{ "response": "0" }', extra );
						}
					}
					file.load( 'rb' );
				}
			}

			function finish( data, extra )
			{
				if ( newParameters[ 'to_local' ] )
				{
					if ( newParameters[ 'to_element' ] && newParameters[ 'to' ] == '' )	
					{
						var element = self.root[ newParameters[ 'to_element' ] ];
						if ( element )
						{
							element.write( '', data, function( response, data, extra )
							{
								callback( response, data, extra );
							}, extra );
						}
						else
						{
							// Should never occur!
							callback( false, 'ok<!--separate-->{ "response": "0" }', extra );
						}
					}
					else
					{
						var element = self.root[ newParameters[ 'to_element' ] ];
						newParameters[ 'to_element' ] = false;
						if ( element )
						{
							element.write( newParameters[ 'to' ], data, function( response, data, extra ) 
							{
								callback( response, data, extra );
							}, extra );
						}
						else
						{
							// File not found
							callback( false, 'fail<!--separate-->{ "response": "0" }', extra );
						}
					}
				}
				else
				{
					if ( newParameters[ 'to' ] )
					{
						var file = new File( newParameters[ 'to' ] );
						file.save( data, null, 'wb' );
						callback( true, 'ok<!--separate-->{ "response": "0" }', extra );
					}
					else
					{
						// HOGNE: when I drag and drop an element from the ram drive to the Home drive,
						// the 'to' parameter is NOT defined! And I really do not understand why...
						callback( false, 'fail<!--separate-->{ "response": "0" }', extra );
					}
				}
			}
			break;

		default:
			// Action not for this level, call all possible elements.
			var count = 0;
			var result = false;
			var lastError;
			for ( var p in newParameters )
			{
				// Normally, path should be relocated as it is local...
				var paths = [];
				if ( newParameters[ p ] != '' )
					paths = newParameters[ p ].split( '/' );
									
				if ( paths.length == 0 )
				{
					callback( false, 'fail<!--separate-->{ "response": "0" }', extra );
				}
				else
				{
					if ( newParameters[ p + '_element' ] )
					{
						var element = self.root[ newParameters[ p + '_element' ] ];
						if ( element )
						{
							count++;
							element.dosAction( action, newParameters, function( response, data, extra )
							{
								result |= response;
								if ( !response )
									lastError = data;
								count--;
							}, extra )
						}
					}
				}
			}
			var handle = setInterval( function()
			{
				if ( count == 0 )
				{
					clearInterval( handle );
					if ( result )
					{
						callback( true, 'ok<!--separate-->{ "response": "0" }', extra );
					}
					else
					{
						callback( false, lastError, extra );
					}
				}
			}, 20 );
			break;		
	}
};


//
// File
//////////////////////////////////////////////////////////////////////////////////
Friend.Doors.Dormant.RamDisc.File = function( infos, callback, extra )
{
	var self = this;
	self.name = infos.name;
	self.parent = infos.parent;
	self.Dormant = infos.door;


	self.busy = false;
	self.MetaType = 'File';
	self.Title = infos.name;
	self.Filename = infos.name;
	self.Icon = 'File';
	self.Position = 'left';
	self.Module = 'files';
	self.Command = 'dormant';
	self.Filesize = 0;
	self.Flags = '';
	self.Type = 'File';
	self.Path = infos.path;
	if ( self.Path.charAt( self.Path.length - 1 ) != ':' )
		self.Path += '/';
	self.Path += infos.name;

	if ( infos.permissions )
		self.Permissions = infos.permissions;
	else
	{
		self.Permissions =
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
	}

	// Load the file icon
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
Friend.Doors.Dormant.RamDisc.File.prototype.destroy = function( callback, extra )
{
	this.data = false;		// Not necessary, just to say!
	callback( true, 'ok<!--separate-->{ "response": "0" }' , extra );
};
Friend.Doors.Dormant.RamDisc.File.prototype.getDirectory = function( path, callback, extra )
{
	// Not for a file (should never be called!)
	callback( false, 'fail<!--separate-->{ "response": "0" }' , extra );
};
Friend.Doors.Dormant.RamDisc.File.prototype.read = function( path, mode, callback, extra )
{
	// ...Add mode conversion when system is done
	callback( true, this.data, extra );
};
Friend.Doors.Dormant.RamDisc.File.prototype.write = function( path, data, callback, extra )
{
	var self = this;

	self.isWritable( {}, function( response, data2, extra2 )
	{
		if ( response )
		{
			self.data = data;
			callback( true, 'ok<!--separate-->{ "response": "0" }', extra2 );
		}
		else
		{
			// Write protected!
			callback( false, 'failo<!--separate-->{ "response": "0" }', extra2 );
		}	
	}, extra );
};
Friend.Doors.Dormant.RamDisc.File.prototype.getFileInfo = function( path, callback, extra )
{
	var self = this;

	var cleanDoor = Object.assign( {}, self.Dormant );
	cleanDoor.windows = false;
	self.getFullPath( {}, function( response, data, extra )
	{
		if ( response )
		{
			var fileInfo =
			{
				Type: self.Type,
				MetaType: self.MetaType,
				Icon: self.Icon,
				Title: self.Title,
				Filename: self.Filename,
				Path: data,
				Position: self.Position,
				Module: self.Module,
				Command: self.Command,
				Filesize: self.Filesize,
				Flags: self.Flags,
				Dormant: cleanDoor
			}
			callback( true, fileInfo, extra );
		}
		else
		{
			// Impossible?
			callback( false, 'failo<!--separate-->{ "response": "0" }', extra2 );
		}
	}, extra );
};
Friend.Doors.Dormant.RamDisc.File.prototype.getFileInformation = function( path, callback, extra )
{
	callback( true, this.Permissions, extra );
};
Friend.Doors.Dormant.RamDisc.File.prototype.setFileInformation = function( path, permissions, callback, extra )
{
	var self = this;

	self.isWritable( {}, function( response, data, extra )
	{
		if ( response )
		{
			self.Permissions = Permissions;
			callback( true, 'ok<!--separate-->{ "response": "0" }', extra );
		}
		else
		{
			// Write protected!
			callback( false, 'fail<!--separate-->{ "response": "0" }', extra );
		}	
	}, extra );
};
Friend.Doors.Dormant.RamDisc.File.prototype.dosAction = function( action, parameters, callback, extra )
{
	var self = this;

	switch( action )
	{
		case 'rename':
			self.isWritable( {}, function( response, data, extra )
			{
				if ( response )
				{
					self.name = parameters[ 'newname' ];
					self.Filename = self.name;
					self.Title = self.name;
					self.getFullPath( {}, function( response, data, extra )
					{
						self.Path = data;						
						callback( true, 'ok<!--separate-->{ "response": "0" }', extra );
					}, extra );
				}
			}, extra );
			return true;
		case 'delete':
			self.destroy( function( response, data, extra ) 
			{
				callback( true, 'done<!--separate-->{ "response": "0" }', extra );
			}, extra );
			return true;
	}
	// Not implemented at this level
	callback( false, 'ERROR - Dos action not implemented: ' + action, extra );
	return false;
};
// Message going downward!
Friend.Doors.Dormant.RamDisc.File.prototype.isWritable = function( options, callback, extra )
{
	var self = this;
	if ( !options )
		options = {};

	// Busy
	if ( self.busy )
	{
		callback( false, 'ERROR - File is busy - ' + self.Path );
	}
	else
	{
		// A file always has a parent... ask them up to the root!
		self.parent.isWritable( options, function( response, data, extra )
		{
			callback( response, data, extra );
		}, extra );
	}
};
// Returns the full path at the instant
Friend.Doors.Dormant.RamDisc.File.prototype.getFullPath = function( options, callback, extra )
{
	var self = this;
	if ( !options )
		options = {};

	// A file always has a parent... ask them up to the root!
	self.parent.getFullPath( options, function( response, data, extra )
	{
		if ( response )
		{
			if ( data.charAt( data.length - 1 ) != ':' )
				data += '/';
			data += self.Filename;
			callback( true, data, extra );
		}
		else
		{
			callback( false, 'ERROR - Unknown error.' + self.Path );
		}
	}, extra );
};


