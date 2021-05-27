<?php

/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
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
			
			/*if( $this->ID && $this->Server && $this->Username && $this->Password && $this->Config )
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
			}*/
				
		}
		
		function GetByCurl( $url, $args = false, $method = 'POST', $headers = false )
		{
			if( !$url ) return;
			
			$agent = ( isset( $_SERVER['HTTP_USER_AGENT'] ) ? $_SERVER['HTTP_USER_AGENT'] : 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:33.0) Gecko/20100101 Firefox/33.0' );
			
			if( !$args )
			{
				$args = [];
			}
			
			if( !$this->Server || !$this->Username || !$this->Password )
			{
				$errapp = '';
				$errapp.= '';
				$errapp.= 'Application.run = function( msg, interface )';
				$errapp.= '{';
				$errapp.= 'Notify({"title":"CorvoDrive","text":"Could not connect to db"}); Application.quit();';
				$errapp.= '}';							
				
				die( 'ok<!--separate-->' . $errapp );
			}
			else
			{
				$url = ( $this->Server . ( $this->Port ? ':' . $this->Port : '' ) . $url );
				
				$args['username'] = $this->Username;
				$args['password'] = $this->Password;
			}
			
			if( function_exists( 'curl_init' ) )
			{
				// Get data
				$ch = curl_init();
				curl_setopt( $ch, CURLOPT_URL, $url );
				//curl_setopt( $ch, CURLOPT_FOLLOWLOCATION, 1 );
				curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1 );
				curl_setopt( $ch, CURLOPT_HTTPHEADER, array( 'Accept-charset: UTF-8' ) );
				curl_setopt( $ch, CURLOPT_ENCODING, 'UTF-8' );
				//curl_setopt( $ch, CURLOPT_ENCODING, 1 );
				curl_setopt( $ch, CURLOPT_USERAGENT, $agent );
				
				if( $headers )
				{
					curl_setopt( $ch, CURLOPT_HTTPHEADER, $headers );
				}
		
				if( $method != 'POST' )
				{
					curl_setopt( $ch, CURLOPT_CUSTOMREQUEST, $method );
				}
		
				if( $args )
				{
					curl_setopt( $ch, CURLOPT_POST, true );
					curl_setopt( $ch, CURLOPT_POSTFIELDS, $args );
				}
		
				curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
				
				return ( curl_exec( $ch ) );
				
			}
			
			return 'fail<!separate-->curl unavailable';
		}
		
		function ListFolderContent ( $subpath = '' )
		{
			// TODO: Make dynamic, static for the monent ...
			
			global $Logger;
			
			if( strstr( $subpath, ':' ) )
			{
				$subpath = explode( ':', $subpath );
				$subpath = end( $subpath );
			}
			
			if( $json = $this->GetByCurl( 
					'/admin.php?module=restapi&plugin=files', 
					array( 'path' => $subpath ) 
				) 
			)
			{
				$Logger->log( 'list dir: ' . $json );
				
				if( $json = json_decode( $json ) )
				{
					$out = [];
					
					if( isset( $json->Folders ) )
					{
						foreach( $json->Folders as $j )
						{
							$obj = new stdClass();
							$obj->Type = 'Directory';
							$obj->MetaType = 'Directory';
							$obj->Path = $subpath . $j->Name . '/';
							$obj->Filesize = 0;
							$obj->Filename = $j->Name;
							$obj->DateCreated = $j->DateCreated;
							$obj->DateModified = $j->DateCreated;
							
							$out[] = $obj;
						}
						
						if( isset( $json->Files ) )
						{
							foreach( $json->Files as $j )
							{
								$obj = new stdClass();
								$obj->Type = 'File';
								$obj->MetaType = $j->Type;
								$obj->Path = $subpath . $j->Name;
								$obj->Filesize = $j->Filesize;
								$obj->Filename = $j->Name;
								$obj->DateCreated = $j->DateCreated;
								$obj->DateModified = $j->DateModified;
							
								$out[] = $obj;
							}
						
						}
					}
					else
					{
						foreach( $json as $j )
						{
							if( isset( $j->Filesize ) )
							{
								$obj = new stdClass();
								$obj->Type = 'File';
								$obj->MetaType = $j->Type;
								$obj->Path = $subpath . $j->Name;
								$obj->Filesize = $j->Filesize;
								$obj->Filename = $j->Name;
								$obj->DateCreated = $j->DateCreated;
								$obj->DateModified = $j->DateModified;
							}
							else
							{
								$obj = new stdClass();
								$obj->Type = 'Directory';
								$obj->MetaType = 'Directory';
								$obj->Path = $subpath . $j->Name . '/';
								$obj->Filesize = 0;
								$obj->Filename = $j->Name;
								$obj->DateCreated = '';
								$obj->DateModified = '';
							}
							
							$out[] = $obj;
						}	
					}
					
					return $out;
				}
			}
			
			return false;
		}
		
		function pathIsFile( $path )
		{
			if( $path && substr( $path, -1, 1 ) != '/' )
			{
				return true;
			}
			
			return false;
		}
		
		function fixPath( $args )
		{
			$path = false;
			
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
			
			$path = $args->path;
			
			return $path;
		}
		
		function getSubPath( $path )
		{
			$subpath = $path;
			
			if( strstr( $subpath, ':' ) )
			{
				$subpath = explode( ':', $subpath );
				$subpath = end( $subpath );
			}
			
			return $subpath;
		}
		
		// Execute a dos command
		function dosAction( $args )
		{
			global $SqlDatabase, $User, $Config, $Logger;
			
			$path    = $this->fixPath( $args );
			$subpath = $this->getSubPath( $path );
			
			$action  = isset( $args->action ) ? $args->action : ( isset( $args->args->action ) ? $args->args->action : false );
			$id 	 = false;
			
			// Do a directory listing
			// TODO: Make it uniform! Not to methods! use command == dir
			if( 
				( isset( $args->command ) && $args->command == 'directory' ) ||  
				( isset( $args->command ) && $args->command == 'dosaction' && isset( $args->args->action ) && $args->args->action == 'dir' )
			)
			{
				
				if( $out = $this->ListFolderContent( $args->path ) )
				{
					return 'ok<!--separate-->' . json_encode( $out );
				}
				
				// No entries
				return 'ok<!--separate-->[]';
			}
			else if( $args->command == 'info' && is_string( $path ) && isset( $path ) && strlen( $path ) )
			{
				// TODO: Make this simpler, and also finish it, only fake 0 data atm ...
				
				if( $fldInfo = $this->getInfo( $path ) )
				{
					die( 'ok<!--separate-->' . json_encode( $fldInfo ) );
				}
				
				die( 'fail<!--separate-->Could not find file!' );
			}
			else if( $args->command == 'write' )
			{
				//
				
				if( isset( $args->tmpfile ) )
				{
					if( file_exists( $args->tmpfile ) )
					{
						$len = filesize( $args->tmpfile );
						$info = @getimagesize( $args->tmpfile );
						
						$mime = false;
						if( isset( $info ) && isset( $info[0] ) && $info[0] > 0 )
						{
							$mime = $info['mime'];
						}
						
						// Try to guess the mime type
						if( !$mime && $ext = end( explode( '.', $subpath ) ) )
						{
							switch( strtolower( $ext ) )
							{
								case 'mp3': $mime = 'audio/mp3'; break;
								case 'avi': $mime = 'video/avi'; break;
								case 'mp4': $mime = 'video/mp4'; break;
								case 'ogg': $mime = 'audio/ogg'; break;
								case 'jpg': $mime = 'image/jpeg'; break;
								case 'mpeg':
								case 'mpg': $mime = 'video/mpeg'; break;
								default: break;
							}
						}
						
						$fname = explode( '/', $subpath );
						$fname = end( $fname );
						
						if( $json = $this->GetByCurl( 
							'/admin.php?module=restapi&plugin=files', 
							array( 
								'path' => $subpath, 
								'file' => new CURLFile( $args->tmpfile, $mime, $fname ) 
							), 
							'POST', 
							array( 'Content-Type: multipart/form-data' ) 
						) )
						{
							$Logger->log( 'write return data: ' . $json );
							
							$json = json_decode( $json );
							
							if( $json && $json->response == 'ok' )
							{
								
								return 'ok<!--separate-->' . $len . '<!--separate-->' . $json->id;
							}
						}
						
						//$Logger->log( 'write return data ??????: ' . $json );
					}
					else
					{
						$Logger->log( 'fail<!--separate-->Tempfile does not exist!' );
						die( 'fail<!--separate-->Tempfile does not exist!' );
					}
				}
				
				$Logger->log( 'fail<!--separate-->Could not write file: ' . $subpath );
				return 'fail<!--separate-->Could not write file: ' . $subpath;
			}
			else if( $args->command == 'read' )
			{
				//
				
				$Logger->Log( 'read[1] : ' . print_r( $args,1 ) );
				
				if( $read = $this->GetByCurl( 
						'/admin.php?module=restapi&plugin=files', 
						array( 
							'path' => $subpath, 
							'command' => 'read' 
						) 
					) 
				)
				{
					ob_end_clean(); 
					die( $read );
				}
				
				$Logger->Log( 'fail<!--separate-->{"response":"could not read file"}' );
				return 'fail<!--separate-->{"response":"could not read file"}';
			}
			// Read some important info about a volume!
			else if( $args->command == 'volumeinfo' )
			{
				//
				
				// TODO: Show real data ...
				
				if( !$this->ID )
				{
					if( $d = $SqlDatabase->FetchObject( '
						SELECT * FROM `Filesystem` WHERE `UserID`=\'' . $User->ID . '\' AND LOWER(`Name`)=LOWER("' . reset( explode( ':', $args->path ) ) . '")
					' ) )
					{
						foreach( $d as $k=>$v )
						$this->$k = $v;
					}
				}
				$o = new stdClass();
				$o->Volume = $this->Name . ':';
				$o->Used = 0;
				$o->Filesize = 0;
				die( 'ok<!--separate-->' . json_encode( $o ) );
			}
			else if( $args->command == 'dosaction' )
			{
				
				switch( $action )
				{
					case 'mount':
						$Logger->log( 'Mounting not needed here.. Always succeed.' );
						die( 'ok' );
					case 'unmount':
						$Logger->log( 'Unmounting not needed here.. Always succeed.' );
						die( 'ok' );
					case 'rename':
						if( $this->pathIsFile( $subpath ) )
						{
							//
							
							$Logger->log( 'rename[1]: ' . print_r( $args,1 ) );
							
							if( $rename = $this->GetByCurl( 
									'/admin.php?module=restapi&plugin=files', 
									array( 
										'path' => $subpath, 
										'newname' => $args->newname, 
										'command' => 'rename' 
									) 
								) 
							)
							{
								$Logger->log( 'rename[2]: ' . $rename );
								
								$rename = json_decode( $rename );
								
								if( $rename && $rename->response == 'ok' )
								{
									return 'ok';
								}
							}
						}
						die( 'fail<!--separate-->Could not find file!' );
						break;
					case 'makedir':
						
						// Not supported yet, relates to a more complex function that creates projects or others based on modules in Corvo ...
						
						die( 'fail<!--separate-->why: ' . print_r( $args, 1 ) . '(' . $path . ')' );
						break;
					case 'delete':
						if( $this->pathIsFile( $subpath ) )
						{
							//
							
							$Logger->log( 'delete[1]: ' . print_r( $args,1 ) );
							
							if( $delete = $this->GetByCurl( 
									'/admin.php?module=restapi&plugin=files', 
									array( 
										'path' => $subpath, 
										'command' => 'delete' 
									) 
								) 
							)
							{
								$delete = json_decode( $delete );
								
								if( $delete && $delete->response == 'ok' )
								{
									return 'ok';
								}
							}
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
		
		function getInfo( $path )
		{
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
				return $fldInfo;
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
				return $fldInfo;
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
					return $fldInfo;
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
					return $fldInfo;
				}
			}
			
			return false;
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
