<?php

/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Lesser General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Lesser General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

global $args, $SqlDatabase, $User, $Config, $Logger;

include_once( 'php/classes/door.php' );

if( !defined( 'CORVODRIVE_FILE_LIMIT' ) )
{
	// 500 megabytes
	define( 'CORVODRIVE_FILE_LIMIT', 524288000 );
}

if( !class_exists( 'DoorCorvoDrive' ) )
{
	class DoorCorvoDrive extends Door
	{
		var $_Database;
		var $_DatabaseCache; // Holds active database connection objects
		
		function onConstruct()
		{
			global $args, $SqlDatabase, $Logger;
			
			$this->fileInfo = isset( $args->fileInfo ) ? $args->fileInfo : new stdClass();
			$this->_DatabaseCache = []; // Ready to use several databases if needed
			
			if( $this->ID && $this->Server && $this->Username && $this->Password && $this->Config )
			{
				$conf = json_decode( $this->Config );
				
				// TODO: Get better reporting on closed ports in dbIo ...
				
				$db = new SqlDatabase();
				if( isset( $conf->Database ) && $conf->Database && $db->Open( $this->Server . ( $this->Port ? ':' . $this->Port : '' ), $this->Username, $this->Password ) )
				{
					$db->SelectDatabase( $conf->Database );
					
					$Logger->log( '[1] $this: ' . print_r( $this,1 ) );
					
					$this->_Database = $db;
				}
				else
				{
					$Logger->log( '[2] $this: ' . print_r( $this,1 ) );
					
					$errapp = '';
					$errapp.= '';
					$errapp.= 'Application.run = function( msg, interface )';
					$errapp.= '{';
					$errapp.= 'Notify({"title":"CorvoDrive","text":"Could not connect to db"}); Application.quit();';
					$errapp.= '}';							
					
					return 'ok<!--separate-->' . $errapp;
					
					die('fail<!--separate-->could not connect to db');
				}
			}
					
		}
		
		// Execute a dos command
		function dosAction( $args )
		{
			global $SqlDatabase, $User, $Config, $Logger;
			
			// TODO: This is a workaround, please fix in Friend Core!
			//       Too much code for getting a real working path..
			if( isset( $args->path ) )
			{
				$path = $args->path;
			}
			else if( isset( $args->args ) )
			{
				if( isset( $args->args->path ) )
				{
					$path = $args->args->path;
				}
			}
			if( isset( $path ) )
			{
				$path = str_replace( '::', ':', $path );
				$path = explode( ':', $path );
				if( count( $path ) > 2 )
				{
					$args->path = $path[1] . ':' . $path[2];
				}
				else $args->path = implode( ':', $path );
				if( isset( $args->args ) && isset( $args->args->path ) )
				{
					unset( $args->args->path );
				}
			}
			
			// Do a directory listing
			// TODO: Make it uniform! Not to methods! use command == dir
			if( 
				( isset( $args->command ) && $args->command == 'directory' ) ||  
				( isset( $args->command ) && $args->command == 'dosaction' && isset( $args->args->action ) && $args->args->action == 'dir' )
			)
			{
				
				
				// No entries
				return 'ok<!--separate-->[]';
			}
			else if( $args->command == 'info' && is_string( $path ) && isset( $path ) && strlen( $path ) )
			{
				// TODO: Make this simpler, and also finish it, only fake 0 data atm ...
				
				// Is it a folder?
				if( substr( $path, -1, 1 ) == '/' )
				{
					$fldInfo = new stdClass();
					$fldInfo->Type = 'Directory';
					$fldInfo->MetaType = 'Directory';
					$fldInfo->Path = $path;
					$fldInfo->Filesize = 0;
					$fldInfo->Filename = end( explode( '/', substr( end( explode( ':', $path ) ), 0, -1 ) ) );
					$fldInfo->DateCreated = '';
					$fldInfo->DateModified = '';
					die( 'ok<!--separate-->' . json_encode( $fldInfo ) );
				}
				else if( substr( $path, -1, 1 ) == ':' )
				{
					// its our mount itself
					
					$fldInfo = new stdClass();
					$fldInfo->Type = 'Directory';
					$fldInfo->MetaType = 'Directory';
					$fldInfo->Path = $path;
					$fldInfo->Filesize = 0;
					$fldInfo->Filename = $path;
					$fldInfo->DateCreated = '';
					$fldInfo->DateModified = '';
					die( 'ok<!--separate-->' . json_encode( $fldInfo ) );
				}
				// Ok, it's a file
				else
				{
					if( strstr( $path, '.' ) )
					{
						$fldInfo = new stdClass();
						$fldInfo->Type = 'File';
						$fldInfo->MetaType = 'File';
						$fldInfo->Path = $path;
						$fldInfo->Filesize = 0;
						$fldInfo->Filename = end( explode( '/', end( explode( ':', $path ) ) ) );
						$fldInfo->DateCreated = '';
						$fldInfo->DateModified = '';
						die( 'ok<!--separate-->' . json_encode( $fldInfo ) );
					}
					else
					{
						$fldInfo = new stdClass();
						$fldInfo->Type = 'Directory';
						$fldInfo->MetaType = 'Directory';
						$fldInfo->Path = $path . '/';
						$fldInfo->Filesize = 0;
						$fldInfo->Filename = end( explode( '/', end( explode( ':', $path ) ) ) );
						$fldInfo->DateCreated = '';
						$fldInfo->DateModified = '';
						die( 'ok<!--separate-->' . json_encode( $fldInfo ) );
					}
				}
				die( 'fail<!--separate-->Could not find file!' );
			}
			else if( $args->command == 'write' )
			{
				//
			}
			else if( $args->command == 'read' )
			{
				//
			}
			// Read some important info about a volume!
			else if( $args->command == 'volumeinfo' )
			{
				//
			}
			else if( $args->command == 'dosaction' )
			{
				$action = isset( $args->action ) ? $args->action : ( isset( $args->args->action ) ? $args->args->action : false );
				$id 	= false;
				$path   = $args->path;
				
				switch( $action )
				{
					case 'mount':
						$Logger->log( 'Mounting not needed here.. Always succeed.' );
						die( 'ok' );
					case 'unmount':
						$Logger->log( 'Unmounting not needed here.. Always succeed.' );
						die( 'ok' );
					case 'rename':
						ob_clean();
						// Is it a folder?
						if( substr( $path, -1, 1 ) == '/' )
						{
							//
						}
						// Ok, it's a file
						else
						{
							//
						}
						die( 'fail<!--separate-->Could not find file!' );
						break;
					case 'makedir':
						
						// Add trailing '/'
						if( substr( $path, -1, 1 ) != '/' && substr( $path, -1, 1 ) != ':' )
						{
							$path .= '/';
						}
						
						if( $path )
						{
							//
						}
						die( 'fail<!--separate-->why: ' . print_r( $args, 1 ) . '(' . $path . ')' );
						break;
					case 'delete':
						if( isset( $path ) )
						{
							//
						}
						// Other combos not supported yet
						return 'fail';
					// Move files and folders or a whole volume to another door
					case 'copy':
						$from = isset( $args->from ) ? $args->from : ( isset( $args->args->from ) ? $args->args->from : false );
						$to   = isset( $args->to )   ? $args->to   : ( isset( $args->args->to )   ? $args->args->to   : false );
						$Logger->log( "Attempting to copy from $from to $to.." );
						if( isset( $from ) && isset( $to ) )
						{
							//
						}
						// Other combos not supported yet
						return 'fail';
				}
			}
			return 'fail<!--separate-->' . print_r( $args, 1 );
		}
		
		// Gets a file by path!
		function getFile( $path )
		{
			global $User, $Logger;
			
			// Remove file from path
			$subPath = explode( '/', end( explode( ':', $path ) ) );
			array_pop( $subPath );
			$subPath = implode( '/', $subPath ) . '/';
			
			$Logger->log( 'Trying to get file.. ------------------->' );
			$Logger->log( 'Path was: ' . $path );
			$Logger->log( 'Sub path is therefore: ' . $subPath );
			
			$fo = $this->getSubFolder( $subPath );
			$fi = new dbIO( 'FSFile' );
			$fi->UserID = $User->ID;
			$fi->FilesystemID = $this->ID;
			$fi->FolderID = $fo ? $fo->ID : '0';
			if( strstr( $path, '/' ) )
			{
				$fi->Filename = end( explode( '/', $path ) );
			}
			else $fi->Filename = end( explode( ':', $path ) );
			
			if( $fi->Load() )
			{
				$fobject = new Object();
				$fobject->Path = end( explode( ':', $path ) );
				$fobject->Filename = $fi->Filename;
				$fobject->Filesize = $fi->Filesize;
				$fobject->Type = 'NodeDrive';
				$fobject->FileInfo = $fi;
				$fobject->Permissions = $fi->Permissions;
				$fobject->Door = $this;
				return $fobject;
			}
			return false;
		}
		
		// Will open and return a file pointer set with options
		function openFile( $path, $mode )
		{
			global $Config, $User;
			
			// Set basics on file pointer object
			$o = new stdClass();
			$o->offset = 0;
			switch( strtolower( trim( $mode ) ) )
			{
				case 'w':
				case 'r':
				case 'w+':
				case 'a':
				case 'a+':
				case 'rb':
					$o->mode = strtolower( trim( $mode ) );
					break;
				default:
					return false;
			}
			
			// Let's check if the file exists ....
			
			// Remove file from path
			$subPath = explode( '/', end( explode( ':', $path ) ) );
			array_pop( $subPath );
			$subPath = implode( '/', $subPath ) . '/';
			
			// Get filename and folder
			$fo = $this->getSubFolder( $subPath );
			$fi = new dbIO( 'FSFile' );
			$fi->UserID = $User->ID;
			$fi->FilesystemID = $this->ID;
			$fi->FolderID = $fo ? $fo->ID : '0';
			if( strstr( $path, '/' ) )
			{
				$fi->Filename = end( explode( '/', $path ) );
			}
			else $fi->Filename = end( explode( ':', $path ) );
			
			// Check if it exists
			$tmpPath = false;
			if( $fi->Load() )
			{
				if( file_exists( $Config->FCUpload . $fi->DiskFilename ) )
				{
					$otmpPath = $Config->FCUpload . $fi->DiskFilename;
				}
			}
			
			// Is everything good?
			if( isset( $o->mode ) && isset( $tmpPath ) )
			{
				$o->tmpPath = $tmpPath;
				return $o;
			}
			return false;
		}
		
		// Close file pointer!
		function closeFile( $filePointer )
		{
			$filePointer->offset = 0;
			$filePointer->tmpPath = NULL;
			$filePointer->mode = NULL;
			return false;
		}
		
		// Will read from file pointer x bytes
		function readFile( $fp, $bytes )
		{
			if( !isset( $fp->offset ) || !isset( $fp->mode ) || !file_exists( $fp->tmpPath ) )
			{
				return NULL;
			}
			
			if( $file = fopen( $fp->tmpPath, $fp->mode ) )
			{
				fseek( $file, $this->offset );
				if( $data = fgets( $file, $bytes ) )
				{
					$this->offset += $bytes;
					fclose( $file );
					return $data;
				}
				fclose( $file );
			}
			return NULL;
		}
		
		// Will write to pointer, data, x bytes
		function writeFile( $filePointer, $data, $bytes )
		{
			if( !isset( $fp->offset ) || !isset( $fp->mode ) || !file_exists( $fp->tmpPath ) )
			{
				return NULL;
			}
			
			if( $file = fopen( $fp->tmpPath, $fp->mode ) )
			{
				fseek( $file, $this->offset );
				$int = 0;
				if( $int = fwrite( $file, $data, $bytes ) )
				{
					$this->offset += $bytes;
					fclose( $data );
					return $int;
				}
				fclose( $file );
			}
			return 0;
		}
		
		// Get the location of a tmp file
		function getTmpFile( $path )
		{
			global $Config, $User;
			
			// Remove file from path
			$subPath = explode( '/', end( explode( ':', $path ) ) );
			array_pop( $subPath );
			$subPath = implode( '/', $subPath ) . '/';
			
			$fo = $this->getSubFolder( $subPath );
			$fi = new dbIO( 'FSFile' );
			$fi->UserID = $User->ID;
			$fi->FilesystemID = $this->ID;
			$fi->FolderID = $fo ? $fo->ID : '0';
			if( strstr( $path, '/' ) )
			{
				$fi->Filename = end( explode( '/', $path ) );
			}
			else $fi->Filename = end( explode( ':', $path ) );
			
			if( $fi->Load() )
			{
				if( file_exists( $Config->FCUpload . $fi->DiskFilename ) )
				{
					$ext = end( explode( '.', $fi->DiskFilename ) );
					$fname = substr( $fi->Filename, 0, strlen( $fi->Filename ) - ( strlen( $ext ) + 1 ) );
					$filename = $fname . '.' . $ext;		
					while( file_exists( $Config->FCTmp . $filename ) )
					{
						$filename = $fname . rand(0,999) . '.' . $ext;
					}
					// Make tmp file
					copy( $Config->FCUpload . $fi->DiskFilename, $Config->FCTmp . $filename );
					return $Config->FCTmp . $filename;
				}
			}
			return false;
		}
		
		// Put a file
		function putFile( $path, $fileObject )
		{
			global $Config, $User;
			
			if( $tmp = $fileObject->Door->getTmpFile( $fileObject->Path ) )
			{
				//
			}
			
			return false;
		}
		
		// Create a folder
		function createFolder( $folderName, $where )
		{
			global $Config, $User, $Logger;
			
			//
		}
		
		// Not to be used outside! Not public!
		function _deleteFolder( $fo, $recursive = true, $delete = false )
		{
			global $Config, $User, $Logger;
			
			//
		}
		
		// Deletes a folder, all sub folders and files (optionally)
		function deleteFolder( $path, $recursive = true, $delete = false )
		{
			global $Config, $User, $Logger;
			
			//
		}
		
		// Delete a file
		function deleteFile( $path, $recursive = false, $delete = false )
		{
			global $Config, $User, $Logger;
			
			//
		}
	}
}

// Create a door...
$door = new DoorCorvoDrive( isset( $path ) ? $path : ( ( isset( $args ) && isset( $args->args ) && $args->args->path ) ? $args->args->path : false ) );

?>
