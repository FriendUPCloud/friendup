/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

DoorLocalStorage = function( authkey, path )
{
	this.path = path;
	this.icons = [];
	var door = this;
	this.handler = 'localstorage';
	this.ready = false;
	
	// Run superfunction init
	this.init();
	
	// Custom init vars
	if( !this.db )
	{
		Ac2Alert( 'Error initializing database!' );
		return false;
	}
	// Get the door itself
	this.getDoorRow( this.path.split( ':' )[0] + ':' );
	// Get an optional directory too
	// TODO: What about files??
	if( this.path.substr( this.path.length - 1, 1 ) != ':' )
		this.getDirectory( this.path );
}

// Extend the superclass
DoorLocalStorage.prototype = new Door();

DoorLocalStorage.prototype.get = function ( authkey, path )
{
	return new DoorLocalStorage( authkey, path );
}

// Get the door row from sqlite
DoorLocalStorage.prototype.getDoorRow = function( path, callback )
{
	var dobj = this;
	// For Doors
	if( path.substr( path.length - 1, 1 ) == ':' )
	{
		this.db.transaction( 
			function( tx ) 
			{
				path = path.split( ':' )[0];
				var wh = 'SELECT * FROM `Door` WHERE `Name`="' + path + '"';
		
				tx.executeSql( 
					wh,
					[],
					function( tx, result )
					{
						// Create door? Nah
						if( result.rows.length <= 0 )
						{
							// TODO: Make error (could not find!)
							//dobj.addDoor();
						}
						// Add found door
						else if( result.rows.length && result.rows.item )
						{
							dobj.door = result.rows.item(0);
						}
						else
						{
							dobj.door = false;
						}
						// Callback?
						if( callback ){ callback( dobj ); }
					}
				);
			},
			function( tx, error )
			{
				if( error )
					alert( error.message );
			}
		);
	}
}

// Add the main row
// TODO: Permissions??
DoorLocalStorage.prototype.addDoor = function( doorName )
{
	var door = this;
	this.db.transaction( 
		function( tx ) 
		{
			tx.executeSql( 
				'INSERT INTO `Door` ( `Name`, `Description`, `Handler`, `Mounted` ) VALUES ( "' + doorName + '", "Local storage door", "localstorage", 1 )', 
				[],
				function( tx, result )
				{
					if( result.error )
					{
						alert( result.error );
					}
					else
					{
						door.getDoorRow();
					}
				}
			);
		}
	);
}

// Gets a directory by path (uses recursion!)
DoorLocalStorage.prototype.getDirectory = function( path, callback, directoryId )
{
	var dobj = this;
	if( !directoryId )
	{
		directoryId = '0';
		var tmp = path.split ( ':' );
		path = tmp[1].split( '/' );
	}
	this.db.transaction( 
		function( tx )
		{
			tx.executeSql( '\
				SELECT * FROM `Directory` WHERE \
					DoorID=\'' + dobj.door.ID + '\' AND \
					DirectoryID=\'' + directoryId + '\' AND \
					`Name`="' + path[0] + '" \
					LIMIT 1\
				',
				[],
				function( tx, result )
				{
					if( result.error )
					{
						alert( result.error );
					}
					else
					{
						if( path.length > 1 )
						{
							var newPath = [];
							for( var a = 1; a < path.length; a++ )
							{
								if( path[a].length )
									newPath.push( path[a] );
							}
							if( newPath.length )
							{
								dobj.getDirectory( newPath, callback, result.rows.item(0).ID );
								return;
							}
						}
						// Ahh, we have come to the end of the line!
						if( result.rows.length )
						{
							dobj.directory = result.rows.item(0);
						}
						else dobj.directory = false;
						// Run callback if exists!
						if( callback ) callback( dobj );
					}
				}
			);
		}
	);
}

DoorLocalStorage.prototype.getIcons = function( fileInfo, callback )
{
	if( !fileInfo )
	{
		fileInfo = {
			Path: this.path,
			Type: 'Door'
		};
	}
	
	var dobj = this;
	this.db.transaction( 
		function( tx ) 
		{
			var directoryId = fileInfo.Type == 'Door' ? '0' : fileInfo.ID;
			tx.executeSql( '\
					SELECT `ID`, `Name`, `DirectoryID`, "Directory" AS `Type` FROM `Directory` WHERE DirectoryID=\'' + directoryId + '\' AND DoorID=\'' + dobj.door.ID + '\' \
					UNION ALL \
					SELECT `ID`, `Name`, `DirectoryID`, "File" AS `Type` FROM `File` WHERE DirectoryID=\'' + directoryId + '\' AND DoorID=\'' + dobj.door.ID + '\' \
				', 
				[],
				function( tx, result )
				{
					if( result.error )
					{
						alert( result.error );
					}
					else
					{
						var icons = [];
						for( var a = 0; a < result.rows.length; a++ )
						{
							var r = result.rows.item(a);
							var type = 'Directory';
							var mtype = 'Directory';
							switch( r.Type )
							{
								case 'File':
									var ext = r.Name.split( '.' ); 
									ext = ext[ext.length-1].toLowerCase();
									switch( ext )
									{
										case 'jpg':
										case 'jpeg':
										case 'png':
										case 'txt':
										case 'html':
										case 'doc':
										case 'pdf':
											type = 'Type' + ext.toUpperCase();
											break;
										default: type = 'Meta'; break;
									}
									mtype = 'File';
									break;
								default:
									break;
							}
							// Get path name
							var newPath = dobj.path + r.Name + ( mtype == 'File' ? '' : '/' );
							
							icons.push( {
								Title: r.Name,
								Volume: dobj.door.Name + ':',
								Path: newPath,
								Type: type,
								MetaType: type,
								ID: r.ID,
								Door: new DoorLocalStorage( false, newPath, r.ID )
							} );
						}
						dobj.icons = icons;
						// Execute callback with resulting icons
						if( callback )
							return callback( icons );
						return icons;
					}
				}
			);
			return false;
		}
	);
}

// Dos arguments
DoorLocalStorage.prototype.dosAction = function( cmd, args, callback )
{
	switch( cmd )
	{
		case 'copy':
			break;
		case 'delete': this.deleteFile( args ); break;
		case 'move':
			break;
		case 'fileinfo':
			break;
		case 'makedir': this.makedir( args ); break;
		case 'execute': this.execute( args ); break;
		case 'rename':  this.rename( args ); break;
		case 'chmod':
			break;
		case 'chown':
			break;
		case 'read':
			break;
		case 'trashitems': this.trashItems(); break;
	}
}

// Make directory
DoorLocalStorage.prototype.makedir = function( args, object )
{
	var rootPath = false;
	var newDirectory = false;
	var dobj = this;
	
	if( !object )
	{
		// Find root directory
		if( args.indexOf( '/' ) > 0 )
		{
			var path = args.split( '/' );
			newDirectory = path[path.length-1];
			path.pop();
			rootPath = path.join( '/' );
		}
		else
		{
			var path = args.split( ':' );
			rootPath = path[0] + ':';
			newDirectory = path[1];
		}
	}
	// Create directory
	if( rootPath && newDirectory )
	{
		// Lets' find the correct door!
		var nam = rootPath.split( ':' )[0] + ':';
		var door = false;
		var directory = false;
		// TODO: Find correct directory
		for( var a = 0; a < Doors.icons.length; a++ )
		{
			if( Doors.icons[a].Title == nam && Doors.icons[a].Mounted == true )
			{
				door = Doors.icons[a];
				break;
			}
		}
		if( !door ) return;
		
		// Make a new sub directory
		if( rootPath.split( ':' )[1].length > 0 )
		{
			this.getDirectory( rootPath, function( dir )
				{
					dobj.db.transaction( function( tx )
						{
							tx.executeSql( 'INSERT INTO Directory ( DoorID, DirectoryID, Name ) VALUES ( \'' + 
								door.ID + '\', \'' + dir.directory.ID + '\', \'' + newDirectory + '\' )' );
							// Door object, refresh
							if( dobj.window )
							{
								dobj.window.refresh();
							}
						}
					);
				}
			);
		}
		// Make a root directory
		else
		{
			this.db.transaction( function( tx )
				{
					tx.executeSql( 'INSERT INTO Directory ( DoorID, DirectoryID, Name ) VALUES ( \'' + 
						door.ID + '\', \'' + ( directory ? directory.ID : '0' ) + '\', \'' + newDirectory + '\' )' );
					// Door object, refresh
					if( door.Door && door.Door.window )
					{
						door.Door.window.refresh();
					}
				}
			);
		}
	}
}

// Try to execute a file
DoorLocalStorage.prototype.execute = function( args, object )
{
}

// Try to put a file in trash
DoorLocalStorage.prototype.deleteFile = function( args, object )
{
	
}
// List out trash items
DoorLocalStorage.prototype.trashItems = function()
{
}
// Rename file or directory
DoorLocalStorage.prototype.rename = function( newname, callback )
{
	var dobj = this;
	
	if( this.directory )
	{
		this.db.transaction( function( tx )
			{
				tx.executeSql( 'UPDATE Directory SET Name="' + newname + '" WHERE ID=' + dobj.directory.ID );
				if( callback ) callback();
			}
		);
	}
	else if ( this.file )
	{
		this.db.transaction( function( tx )
			{
				tx.executeSql( 'UPDATE File SET Name="' + newname + '" WHERE ID=' + dobj.file.ID );
				if( callback ) callback();
			}
		);
	}
}

