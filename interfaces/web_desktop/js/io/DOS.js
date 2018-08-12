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
/** @file
 *
 * System interface with Friend Network
 * DOS low-level interface
 * A set of easy file functions
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 12/04/2018
 */

DOS =
{
	getDisks: function( path, flags, callback, extra )
	{
		var out = [];
		for( var a = 0; a < Workspace.icons.length; a++ )
		{
			if( Workspace.icons[a].Type != 'Door' )
				continue;
			out.push( {
				Title: Workspace.icons[a].Title,
				Volume: Workspace.icons[a].Volume
			} );
		}
		if( flags.sort )
		{
			out.sort( compare );
		}
		
		if( callback )
		{
			callback( out.length ? true : false, out );
		}
		
		// Comparaison function
		function compare( iconA, iconB )
		{
			if ( iconA.Title < iconB.Title )
				return -1;
			if ( iconA.Title > iconB.Title )
				return 1;
			return 0;
		}
	},
	getDirectory: function( path, srcFlags, callback, extra )
	{
		// Remove flags that could interfere with the door 
		var flags = {};
		for ( var f in srcFlags )
		{
			if ( f == 'recursive' || f == 'sort' )
				flags[ f ] = srcFlags[ f ];
		}

		// Star recursion
		var list = [];
		var depth = 0;
		getDir( list, path, flags );

		// Watchdog for the end of recursion
		var response = true;
		var handle = setInterval( function()
		{
			if ( depth <= 0 )
			{
				clearInterval( handle );
				callback( response, response ? list : [], extra );
			}
		}, 10 );

		// Recursive function
		function getDir( listDir, path, flags )
		{
			depth++;
			var door = ( new Door().get( path ) );
			if ( door )
			{
				door.getIcons( null, function( icons, path, pth )
				{
					depth--;

					// No error?
					if ( icons )
					{
						// Look for directories
						var icon;
						for ( var i = 0; i < icons.length; i++ )
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
						if ( flags.sort )
							listDir.sort( compare );

						// Look for files
						var listTemp = [];
						for ( i = 0; i < icons.length; i++ )
						{
						 	icon = icons[ i ];
							if ( icon.Type == 'File' )
							{
								if ( icon.Dormant )
									icon.Dormant.windows = [];
								listTemp.push( icon );
							}
						}

						// Sort?
						if ( flags.sort )
							listTemp.sort( compare );
						
						// Adds to the main array
						for ( i = 0; i < listTemp.length; i++ )
							listDir.push( listTemp[ i ] );
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
			if ( iconA.Filename < iconB.Filename )
				return -1;
			if ( iconA.Filename > iconB.Filename )
				return 1;
			return 0;
		}
	},
	executeJSX: function( path, args, callback, extra )
	{
		ExecuteJSXByPath( path, args, function( response, message, iframe )
		{
			if ( callback )
				callback( response, message, iframe, extra );
		} );
	},
	getApplicationPath: function( applicationId, path )
	{
		// Get the application path
		var aPath;
		for( var a = 0; a < Workspace.applications.length; a++ )
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
	},
	isFriendNetworkDrive: function( path )
	{
		// Is the path on a Friend Network drive?
		var drive;
		var pos = path.indexOf( ':' );
		if ( pos >= 0 )
			drive = path.substring( 0, pos + 1 );
		if ( drive )
		{
			var friendNetwork = false;
			var doors = DormantMaster.getDoors();
			if( doors )
			{
				for( var d in doors )
				{
					var door = doors[ d ];
					if( door.Title == drive )
					{
						return true;
					}
				}
			}
		}
		return false;
	},
	loadHTML: function( applicationId, path, callback, extra )
	{
		// Get the application path
		path = this.getApplicationPath( applicationId, path );
		var isFriendNetwork = this.isFriendNetworkDrive( path );

		// Load the file
		var file = new File( path );
		file.onLoad = function( html )
		{
			if ( isFriendNetwork )
			{
				var drive = path.substring( 0, path.indexOf( ':' ) + 1 );

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
		};
		file.load();
	},
	getDriveInfo: function( path, callback, extra )
	{
		if ( path.substring( path.length - 1 ) == ':' ) 
			path = path.substring( 0, path.length - 1 )
		var icon;
		for( var a = 0; a < Workspace.icons.length; a++ )
		{
			if( Workspace.icons[a].Volume == path )
			{
				icon = Workspace.icons[ a ];
				break;
			}
		}
		callback( icon ? true : false, icon, extra );
	},
	getFileAccess: function( path, callback, extra )
	{
		var sn = new Library( 'system.library' );
		sn.onExecuted = function( returnCode, returnData )
		{						
			// If we got an OK result, then parse the return data (json data)
			var rd = false;
			if( returnCode == 'ok' )
			{
				rd = JSON.parse( returnData );
				callback( true, rd, extra );
			}
			else
			{
				// Default permissions. TODO: not normal!
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
	},
	getFileInfo: function( path, callback, extra )
	{
		var l = new Library( 'system.library' );
		l.onExecuted = function( e, d )
		{
			if ( e == 'ok' )
			{
				var fileinfo;
				try
				{
					fileinfo = JSON.parse( d );
				}
				catch( e )
				{
					callback( false, null, extra );
					return;
				}
				callback( true, fileinfo, extra );
			}
			else
			{
				callback( false, null, extra );
			}
		};
		l.execute( 'file/info', { path: path } );
	}
};
