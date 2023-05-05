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
 * DOS low-level interface
 * A set of easy file functions
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 12/04/2018
 */
Friend.DOS = Friend.DOS || {};

/**
 * Friend.DOS.getDisks
 * 
 * Returns the list of drives currently mounted
 * 
 * @param options (object) various options
 * 	#object 
 * 		#string #todo filter if defined, filter the names of the drives. MSDOS-like syntax (name*, n?me)
 * 		#boolean sort sort the result in alphabetical order
 * 		#boolean types array of strings with the type of disks to scan, ex 'Dormant' or 'Door' (case sensitive, exact match on the name)
 *  
 * @return (array) An array of objects containing information about the disks
 * 	#array #object
 * 		#string title the name of the disk
 *		#string volume the name of the volume
 */
Friend.DOS.getDisks = function( options, callback, extra )
{
	let out = [];
	for( let a = 0; a < Workspace.icons.length; a++ )
	{
		let disk = Workspace.icons[ a ];
		if( disk.Type != 'Door' ) continue;
		 
		if ( options.type )
		{
			let found = false;
			for ( let t = 0; t < options.type.length; t++ )
			{
				if ( options.types[ t ] == disk.type )
				{
					found = true;
					break;
				}
			}
			if ( !found )
				continue;
		}
		out.push
		( 
			{
				Title: disk.Title,
				Volume: disk.Volume,
				Driver: disk.Driver
			} 
		);
	}
	if ( options.sort )
	{
		out.sort( compare );
	}
	if( callback ) callback( true, out );
	return out;
	
	// Comparaison function
	function compare( iconA, iconB )
	{
		if ( iconA.Title < iconB.Title )
			return -1;
		if ( iconA.Title > iconB.Title )
			return 1;
		return 0;
	}
};

/**
 * Friend.DOS.getDirectory
 * 
 * Returns the list of files in a directory
 * 
 * @param path (string) path to the directory to scan
 * @param options (object) various options
 *  #object
 * 		#boolean recursive explores sub-directories
 * 		#boolean sort sort the result in alphabetical order
 * 		#boolean noDirectories do not list the directories
 * 		#boolean noFiles do not list the files
 * 		#stringarray #todo fileTypes array of strings with the types of files to list, starting with a dot (example: [ '.txt', '.doc' ])
 * 		#stringarray #todo fileMimes array of strings with the mime types of the files (example: [ 'video/jpeg', 'image/bmp' ] )
 * 		#boolean types array of strings with the type of disks to scan, ex 'Dormant' or 'Door' (case sensitive, exact match on the name)
 * 
 * @callback
 * 	#array 
 * 		#fileInfo
 */
Friend.DOS.getDirectory = function( path, options, callback, extra )
{
	// Remove flags that could interfere with the door 
	let flags = {};
	for ( let f in options )
	{
		if ( f == 'recursive' || f == 'sort' )
			flags[ f ] = options[ f ];
	}

	// Star recursion
	let list = [];
	let depth = 0;
	getDir( list, path, flags );

	// Watchdog for the end of recursion
	let response = true;
	let handle = setInterval( function()
	{
		if ( depth <= 0 )
		{
			clearInterval( handle );
			callback( response, response ? list : [], extra );
		}
	}, 20 );

	// Recursive function
	function getDir( listDir, path, flags )
	{
		depth++;
		let door = ( new Door().get( path ) );
		if( door )
		{
			door.getIcons( null, function( icons, path, pth )
			{
				depth--;

				// No error?
				if( icons )
				{
					if( !options.noDirectories )
					{
						// Look for directories
						let icon;
						for( let i = 0; i < icons.length; i++ )
						{
							icon = icons[ i ];
							if ( icon.Type == 'Directory' )
							{
								if ( icon.Dormant )
									icon.Dormant.windows = [];
								listDir.push( icon );
								if ( flags.recursive )
								{
									icon.Children = [];
									getDir( icon.Children, icon.Path, flags );
								}
							}
						}

						// Sort?
						if( options.sort )
							listDir.sort( compare );
					}

					// Look for files
					let listTemp = [];
					if( !options.noFiles )
					{
						for( let i = 0; i < icons.length; i++ )
						{
							icon = icons[ i ];
							if( icon.Type == 'File' )
							{
								if( icon.Dormant )
									icon.Dormant.windows = [];
								listTemp.push( icon );
							}
						}

						// Sort?
						if( options.sort )
							listTemp.sort( compare );
					}
					
					// Adds to the main array
					if( !options.filesFirst )
					{
						for( i = 0; i < listTemp.length; i++ )
							listDir.push( listTemp[ i ] );
					}
					else
					{
						for( i = 0; i < listTemp.length; i++ )
							listDir.unshift( listTemp[ i ] );
					}
				}
				else
				{
					response = false;
				}			
			}, flags );

		}
		else
		{
			depth--;
		}
	}
	// Comparaison function
	function compare( iconA, iconB )
	{
		if( iconA.Title && iconB.Title )
		{
			if( iconA.Title < iconB.Title )
				return -1;
			else if( iconA.Title > iconB.Title )
				return 1;
			return 0;
		}
		if( iconA.Filename < iconB.Filename )
			return -1;
		else if( iconA.Filename > iconB.Filename )
			return 1;
		return 0;
	}
};

/**
 * Friend.DOS.executeJSX
 * 
 * launches a JSX application
 * 
 * @param path (string) path to the JSX file
 * @param options (object) various options
 *  #object
 * 		#array #string args arguments to transmit to the function
 * 
 * @callback
 * 	#object
 * 		#iFrame iFrame
 */
Friend.DOS.executeJSX = function( path, options, callback, extra )
{
	ExecuteJSXByPath( path, options.args, function( response, message, iframe )
	{
		if ( callback )
		{
			callback( response, 
			{
				iFrame: iframe
			}, extra );
		}
	} );
};

/**
 * Friend.DOS.getServerPath
 * 
 * Converts a symbolic path to actual path to the Friend server
 * 
 * @param applicationId (string) identifier of the application
 * @param path (string) path to convert
 * @param options (object) various options
 *  #object
 * 		#array #string args arguments to transmit to the function
 * 
 * @return
 * 	#string the converted path
 */
Friend.DOS.getServerPath = function( applicationId, path, options )
{
	// Get the application path
	let aPath;
	for( let a = 0; a < Workspace.applications.length; a++ )
	{
		if( Workspace.applications[ a ].applicationId == applicationId )
		{
			application = Workspace.applications[ a ];
			aPath = application.appPath ? application.appPath : application.filePath;
			break;
		}
	}
	if( path.toLowerCase().substr( 0, 8 ) == 'progdir:' )
	{
		path = aPath + path.substr( 8, path.length - 8 );
	}
	else if( path.toLowerCase().substr( 0, 7 ) == 'system:' )
	{
		path = path.split( /system\:/i ).join( '/webclient/' );
	}
	else if( path.toLowerCase().substr( 0, 5 ) == 'libs:' )
	{
		path = path.split( /libs\:/i ).join( '/webclient/' );
	}
	return path;
	//if( path.indexOf( 'http:' ) == 0 || path.indexOf( 'https:' ) == 0 )
	//{
	//	return path;
	//}
};

/**
 * Friend.DOS.isFriendNetworkDrive
 * 
 * Checks if a path points to the Friend Network drive
 * 
 * @param path (string) path to convert
 * @param options (object) various options
 * 
 * @return
 * 	#boolean true if it is, false if it not
 */
Friend.DOS.isFriendNetworkDrive = function( path, options )
{
	// Is the path on a Friend Network drive?
	let drive;
	let pos = path.indexOf( ':' );
	if ( pos >= 0 )
		drive = path.substring( 0, pos + 1 );
	if ( drive )
	{
		let friendNetwork = false;
		let doors = DormantMaster.getDoors();
		if( doors )
		{
			for( let d in doors )
			{
				let door = doors[ d ];
				if( door.Title == drive )
				{
					return true;
				}
			}
		}
	}
	return false;
};

/**
 * Friend.DOS.loadHTML
 * 
 * Load an HTML file and relocates it so that it can be displayed in an iFrame
 * 
 * @param applicationId (string) identifier of the application
 *  #string
 * @param path (string) path to the HTML file
 * 	#string
 * @param options (object) various options
 * 	#object
 * 
 * @callback
 * 	#string the relocated file
 */
Friend.DOS.loadHTML = function( applicationId, path, options, callback, extra )
{
	// Load the file
	this.loadFile( path, {}, function( response, data, extra ) 
	{
		if ( response )
		{
			let isFriendNetwork = Friend.DOS.isFriendNetworkDrive( path );
			if ( isFriendNetwork )
			{
				let drive = path.substring( 0, path.indexOf( ':' ) + 1 );

				// Relocates the file
				FriendNetworkDoor.relocateHTML( html, drive, '', '', function( response, html )
				{
					callback( true, html, extra );
				} );
			}
			else
			{
				callback( true, html, extra );
			}
		}
	}, extra );
};

/**
 * Friend.DOS.loadFile
 * 
 * Load an HTML file and relocates it so that it can be displayed in an iFrame
 * 
 * @param path (string) path to the file
 * 	#string
 * @param options (object) various options
 * 	#object
 * 		#boolean binary indicates that the file should be loaded as binary
 * 
 * @callback
 * 	#string #or #arrayBuffer 
 * 		if not binary, a string containing the content of the file,
 * 		if binary, an arrayBuffer with the file
 */
Friend.DOS.loadFile = function( path, options, callback, extra )
{
	let file = new File( path );
	file.onLoad = function( data )
	{
		// Check for error
		if ( typeof data == 'string' && data.indexOf( '404 - File not found!') >= 0 )
		{
			callback( false, { error: 'ERROR - File not found.' }, extra );
		}
		else
		{
			// OK!
			callback( true, data, extra );
		}		
	};
	let mode = '';
	if ( options && options.binary )
		mode = 'rb';
	file.load( mode );
};

/**
 * Friend.DOS.getDriveInfo
 * 
 * Returns information about the disk pointed to by a path
 * 
 * @param path (string) path to the file
 * 	#string
 * @param options (object) various options
 * 	#object
 * 		#boolean binary indicates that the file should be loaded as binary
 * 
 * @return
 * 	#fileInfo
 */
Friend.DOS.getDriveInfo = function( path, options, callback, extra )
{
	// Just a name? Must be a drive.. Add the colon..
	if( path.indexOf( ':' ) < 0 && path.indexOf( '/' ) < 0 )
	{
		path += ':';
	}
	let icon = false;
	for( let a = 0; a < Workspace.icons.length; a++ )
	{
		if( Workspace.icons[a].Volume == path )
		{
			icon = Workspace.icons[ a ];
			break;
		}
	}
	
	if( callback )
	{
		callback( icon ? icon : Friend.ERROR );
	}
	return ( icon ? icon : Friend.ERROR );
};


/**
 * Friend.DOS.getFileAccess
 * 
 * Returns the file access information of a file or directory pointed to by a path
 * 
 * @param path (string) path to the file
 * 	#string
 * @param options (object) various options
 * 	#object
 * 		#boolean binary indicates that the file should be loaded as binary
 * 
 * @return
 * 	#fileInfo
 */
Friend.DOS.getFileAccess = function( path, options, callback, extra )
{
	let sn = new Library( 'system.library' );
	sn.onExecuted = function( returnCode, returnData )
	{						
		// If we got an OK result, then parse the return data (json data)
		let rd = false;
		if( returnCode == 'ok' )
		{
			rd = JSON.parse( returnData );
			callback( true, rd, extra );
		}
		else
		{
			// Default permissions. HOGNE: not normal, it always returns not ok
			rd = 
			[
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
			callback( true, rd, extra );
		}
	};
	sn.execute( 'file/access', { path: path } ); 
};

/** 
 * Friend.DOS.getFileInfo
 * 
 * Returns the file access information of a file or directory pointed to by a path
 * 
 * @param path (string) path to the file
 * 	#string
 * @param options (object) various options
 * 	#object
 * 
 * @return
 * 	#fileInfo
 */
Friend.DOS.getFileInfo = function( path, options, callback, extra )
{
	// FRANCOIS: TODO! handle Dormant drives!
	let l = new Library( 'system.library' );
	l.onExecuted = function( e, d )
	{
		if ( e == 'ok' )
		{
			let fileinfo;
			try
			{
				fileinfo = JSON.parse( d );
			}
			catch( e )
			{
				callback( false, 'ERROR - Bad response from server.', extra );
				return;
			}
			callback( true, fileinfo, extra );
		}
		else
		{
			callback( false, 'ERROR - File not found.', extra );
		}
	};
	l.execute( 'file/info', { path: path } );
};

Friend.DOS.getServerURL = function( path, options, callback, extra )
{
	let gpath = getImageUrl( path );
	callback( true, gpath, extra );
	return gpath;
};



// Opens a window based on filepath (used for opening files hosted external)  
Friend.DOS.openWindowByFilename = function( fileInfo, ext, appId = false )
{
	if( typeof( fileInfo ) === "string" )
	{
		if( !ext )
		{
			ext = fileInfo.split( '.' );
			ext = ext[ext.length-1];
		}
		
		fileInfo = {
			Extension : ext, 
			Path : fileInfo 
		};
	}
	else
	{
		if( !ext )
		{
			ext = fileInfo.Path ? fileInfo.Path.split( '.' ) : ( fileInfo.Filename ? fileInfo.Filename.split( '.' ) : ( fileInfo.Title ? fileInfo.Title.split( '.' ) : false ) );
			if( ext == false )
			{
				// Support url instead
				if( fileInfo.Url )
				{
					return OpenWindowByUrl( fileInfo.Url, fileInfo );
				}
				return false;
			}
			ext = ext[ext.length-1];
		}
	}
	
	fileInfo = {
		Title        : ( fileInfo.Title        ? fileInfo.Title        : ''     ),
		Filename     : ( fileInfo.Filename     ? fileInfo.Filename     : ''     ),
		DateCreated  : ( fileInfo.DateCreated  ? fileInfo.DateCreated  : 0      ),
		DateModified : ( fileInfo.DateModified ? fileInfo.DateModified : 0      ),
		Extension    : ( fileInfo.Extension    ? fileInfo.Extension    : ext    ),
		Filesize     : ( fileInfo.Filesize     ? fileInfo.Filesize     : 0      ),
		MetaType     : ( fileInfo.MetaType     ? fileInfo.MetaType     : 'File' ),
		Path         : ( fileInfo.Path         ? fileInfo.Path         : ''     ),
		Type         : ( fileInfo.Type         ? fileInfo.Type         : 'File' ),
		downloadhref : ( fileInfo.downloadhref ? fileInfo.downloadhref : ''     ),
		flags        : ( fileInfo.flags        ? fileInfo.flags        : null   ),
		applicationId: appId
	};
	
	return OpenWindowByFileinfo( fileInfo );
}



