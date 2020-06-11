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

global $args, $SqlDatabase, $User, $Config;

include_once( 'php/classes/door.php' );

if( !class_exists( 'SharedDrive' ) )
{
	class ShareDrive extends Door
	{	
		function onConstruct()
		{
			global $args, $Config;
			$this->fileInfo = isset( $args->fileInfo ) ? $args->fileInfo : new stdClass();
			$this->assignRootpaths = []; // here we have all the rootpaths we're using
			if( isset( $this->Path ) )
				$this->paths = explode( ';', $this->Path );
			else $this->paths = '';
			$this->rootPath = $Config->FCOnLocalhost ? 'localhost' : $Config->FCHost;
			$this->rootPath = ( $Config->SSLEnable ? 'https' : 'http' ) . '://' . $this->rootPath . ':' . $Config->FCPort . '/';
			$this->sessionid = $GLOBALS[ 'args' ]->sessionid;
		}
		
		// Gets the subfolder by path on this filesystem door
		// Path should be like this: SomePath:Here/ or Here/ (relating to Filesystem in $this)
		function getSubFolder( $subPath )
		{
			global $Logger, $SqlDatabase;
			
			return false;
		}

		// Execute a dos command
		function dosAction( $args )
		{
			global $SqlDatabase, $User, $Config, $Logger;
		
			//$Logger->log( 'Executing a dos action: ' . $args->command );
			//$Logger->log( 'Pure args: ' . print_r( $args, 1 ) );
			
			// TODO: This is a workaround, please fix in Friend Core!
			//       Too much code for getting a real working path..
			if( isset( $args->path ) )
				$path = $args->path;
			else if( isset( $args->args ) )
			{
				if( isset( $args->args->path ) )
					$path = $args->args->path;
			}
			if( isset( $path ) )
			{
				$path = str_replace( '::', ':', $path );
				$path = explode( ':', $path );
				if( count( $path ) > 2 )
					$args->path = $path[1] . ':' . $path[2];
				else $args->path = implode( ':', $path );
				if( isset( $args->args ) && isset( $args->args->path ) )
					unset( $args->args->path );
			}
		
			// Do a directory listing
			// TODO: Make it uniform! Not to methods! use command == dir
			if( 
				( isset( $args->command ) && $args->command == 'directory' ) ||  
				( isset( $args->command ) && $args->command == 'dosaction' && isset( $args->args->action ) && $args->args->action == 'dir' )
			)
			{
				directory:
				
				// We jumped to read
				if( isset( $read ) )
				{
					$pth = explode( ':', $read );
					if( strstr( $read, '/' ) )
					{
						$vol = explode( ':', $read );
						$pth = explode( '/', $vol[1] );
						$path = [ $vol[0] ];
						$path = array_merge( $path, $pth );
						$pth = $pth[ count( $pth ) - 1 ];
					}
					else
					{
						$pth = $pth[1];
					}
				}
				
				if( is_array( $path ) && count( $path ) > 1 && trim( $path[ 1 ] ) )
				{
					$out = [];
					// Get data shared by others
					// TODO: Support groups
					if( $rows = $SqlDatabase->fetchObjects( '
						SELECT s.Data, s.OwnerUserID, u.SessionID FROM FShared s, FUser u 
						WHERE 
							u.Name = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $path[ 1 ] ) . '\' AND
							s.OwnerUserID != \'' . intval( $User->ID, 10 ) . '\' AND
							s.SharedType = \'User\' AND 
							s.SharedID = \'' . intval( $User->ID, 10 ) . '\' AND 
							u.SessionID != "" AND 
							u.ID = s.OwnerUserID
					' ) )
					{
						foreach( $rows as $row )
						{
							$p = $row->Data;
							$filename = explode( ':', $p ); 
							$filename = $filename[1];
							if( strstr( $filename, '/' ) )
							{
								$filename = explode( '/', $filename );
								$filename = $filename[ count( $filename ) - 1 ];
							}
							
							$s = new stdClass();
							$s->Path = $path[ 1 ] . '/' . $filename;
							$s->Filename = $filename;
							$s->Type = 'File';
							$s->MetaType = 'File';
							$s->Permissions = '-RWED-RWED-RWED';
							$s->Shared = '';
							$s->SharedLink = '';
							$s->Filesize = 0;
							
							$vol = explode( ':', $row->Data );
							
							$url = ( $Config->SSLEnable ? 'https' : 'http' ) . '://localhost:' . $Config->FCPort . '/system.library/';
							$res = FriendCall( $url . 'file/info?sessionid=' . $row->SessionID, false,
								array( 
									'devname'   => $vol[0],
									'path'      => $row->Data
								)
							);
							$code = explode( '<!--separate-->', $res );
							
							if( $code[0] == 'ok' )
							{
								if( isset( $read ) && $pth == $s->Filename ) 
								{
									ob_clean();
									// Don't require verification on localhost
									$context = stream_context_create(
										array(
											'ssl'=>array(
												'verify_peer' => false,
												'verify_peer_name' => false,
												'allow_self_signed' => true,
											) 
										) 
									);
									if( $fp = fopen( $url . 'file/read?sessionid=' . $row->SessionID . '&path=' . $vol[0] . ':' . $p . '&mode=rb', 'rb', false, $context ) )
									{
										fpassthru( $fp );
										fclose( $fp );
									}
									die();
								}
								$info = json_decode( $code[1] );
								$s->Filesize = $info->Filesize;
								$s->DateCreated = $info->DateCreated;
								$s->DateModified = $info->DateModified;
							}
							
							$out[] = $s;
						}
						die( 'ok<!--separate-->' . json_encode( $out ) );
					}
					die( 'ok<!--separate-->[]' );
				}
				else
				{
					$out = [];
					// Get my shared data
					if( $rows = $SqlDatabase->fetchObjects( '
						SELECT DISTINCT(`Data`) FROM FShared WHERE OwnerUserID=\'' . intval( $User->ID, 10 ) . '\' GROUP BY `Data`
					' ) )
					{
						foreach( $rows as $row )
						{
							$path = $row->Data;
							$filename = explode( ':', $path ); 
							$filename = $filename[1];
							if( strstr( $filename, '/' ) )
							{
								$filename = explode( '/', $filename );
								$filename = $filename[ count( $filename ) - 1 ];
							}
							$s = new stdClass();
							$s->Filename = $filename;
							$s->Path = $filename;
							$s->Type = 'File';
							$s->MetaType = 'File';
							$s->Permissions = '-RWED-RWED-RWED';
							$s->Shared = '';
							$s->SharedLink = '';
							$s->Filesize = 0;
							$s->Owner = $User->ID;
							$s->ExternPath = $row->Data;
							$s->ExternSession = $User->SessionID;
							$out[] = $s;
						}
					}
				
				
					// My groups
					$groups = $SqlDatabase->fetchObjects( '
						SELECT * FROM
							FUserToGroup
						WHERE
							UserID = \'' . intval( $User->ID, 10 ) . '\'
					' );
					$grs = []; foreach( $groups as $group ) $grs[] = $group->UserGroupID;
					unset( $groups );
				
					// Get folders by other users or groups
					if( $rows = $SqlDatabase->fetchObjects( $q = '
						SELECT DISTINCT(`Name`) FROM (
							SELECT u.Name FROM FShared s, FUser u 
							WHERE
								u.ID = s.OwnerUserID AND 
								s.OwnerUserID != \'' . intval( $User->ID, 10 ) . '\' AND
								s.SharedType = \'user\' AND
								s.SharedID = \'' . intval( $User->ID, 10 ) . '\' AND
								u.SessionID != ""
						) z
						UNION
						(
							SELECT g.Name FROM FShared s, FUserGroup g, FUserToGroup ug
							WHERE 
								s.OwnerUserID != \'' . intval( $User->ID, 10 ) . '\' AND
								s.SharedType = \'group\' AND
								s.SharedID = ug.UserGroupID AND
								g.ID = ug.UserGroupID AND
								ug.UserGroupID IN ( ' . implode( ', ', $grs ) . ' )
						)
					' ) )
					{
						foreach( $rows as $row )
						{
							$s = new stdClass();
							$s->Filename = $row->Name;
							$s->Path = $row->Name;
							$s->Type = 'Directory';
							$s->MetaType = 'Directory';
							$s->Permissions = '---------------';
							$s->DateCreated = $s->DateModified = date( 'Y-m-d H:i:s' );
							$s->Shared = '';
							$s->SharedLink = '';
							$s->Filesize = 0;
							$out[] = $s;
						}
					}
				}
				
				// Stat everything
				foreach( $out as $k=>$file )
				{
					if( $file->Type == 'File' )
					{
						$vol = explode( ':', $file->ExternPath );
						$url = ( $Config->SSLEnable ? 'https' : 'http' ) . '://localhost:' . $Config->FCPort . '/system.library/';
						$res = FriendCall( $url . 'file/info?sessionid=' . $file->ExternSession, false,
							array( 
								'devname'   => $vol[0],
								'path'      => $file->ExternPath
							)
						);
						$code = explode( '<!--separate-->', $res );
						if( $code[0] == 'ok' )
						{
							if( isset( $read ) && $pth == $file->Filename ) 
							{
								ob_clean();
								// Don't require verification on localhost
								$context = stream_context_create(
									array(
										'ssl'=>array(
											'verify_peer' => false,
											'verify_peer_name' => false,
											'allow_self_signed' => true,
										) 
									) 
								);
								if( $fp = fopen( $url . 'file/read?sessionid=' . $file->ExternSession . '&path=' . $file->ExternPath . '&mode=rb', 'rb', false, $context ) )
								{
									fpassthru( $fp );
									fclose( $fp );
								}
								die();
							}
							$info = json_decode( $code[1] );
							$out[$k]->Filesize = $info->Filesize;
							$out[$k]->DateCreated = $info->DateCreated;
							$out[$k]->DateModified = $info->DateModified;
						}
						$out[$k]->Owner = '';
						$out[$k]->ExternPath = '';
						$out[$k]->ExternSession = '';
					}
				}
				
				// Get the output
				if( count( $out ) )
				{
					die( 'ok<!--separate-->' . json_encode( $out ) );
				}
				// Empty!
				die( 'ok<!--separate-->[]' );
				
			}
			else if( $args->command == 'call' )
			{
				// Invalid path
				die( 'fail<!--separate-->{"response":"invalid path"}' );
				
				die( 'fail' );
			}
			else if( $args->command == 'info' )
			{
				die( 'fail<!--separate-->Could not find file!' );
			}
			else if( $args->command == 'write' )
			{
				return 'fail<!--separate-->Could not write file: ' . $Config->FCUpload . $fn;
			}
			else if( $args->command == 'read' )
			{
				$read = $args->path;
				$path = '';
				goto directory;
			}
			// Import sent files!
			else if( $args->command == 'import' )
			{
				die( 'fail<!--separare-->Could not open dir.' );
			}
			// Read some important info about a volume!
			else if( $args->command == 'volumeinfo' )
			{
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
				$action = isset( $args->action ) ? $args->action : ( isset( $args->args->action ) ? $args->args->action : false );
				$path   = $args->path;
				switch( $action )
				{
					case 'mount':
						$Logger->log( 'Mounting not needed here.. Always succeed.' );
						die( 'ok<!--separate-->{"message":"Device mounted","response":"1"}' );
					case 'unmount':
						$Logger->log( 'Unmounting not needed here.. Always succeed.' );
						die( 'ok' );
					case 'rename':
						die( 'fail<!--separate-->{"message":"Could not rename file.","response":"-1"}' );
						break;
					case 'makedir':
						die( 'fail<!--separate-->{"message":"Could not make directory.","response":"-1"}' );
						//die( 'fail<!--separate-->why: ' . print_r( $args, 1 ) . '(' . $path . ')' );
						break;
					case 'delete':
						// Other combos not supported yet
						// TODO: Perhaps just unshare the file on my side?
						return 'fail<!--separate-->{"message":"Could not delete file.","response":"-1"}';
					// Move files and folders or a whole volume to another door
					case 'copy':
						$from = isset( $args->from ) ? $args->from : ( isset( $args->args->from ) ? $args->args->from : false );
						$to   = isset( $args->to )   ? $args->to   : ( isset( $args->args->to )   ? $args->args->to   : false );
						if( isset( $from ) && isset( $to ) )
						{
							if( $this->copyFile( $from, $to ) )
							{
								return 'ok';
							}
						}
						// Other combos not supported yet
						return 'fail';
				}
			}
			return 'fail<!--separate-->'; // . print_r( $args, 1 );
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
		
			return false;
		}
		
		// Will open and return a file pointer set with options
		function openFile( $path, $mode )
		{
			global $Config, $User;
			
			
			return false;
		}
		
		// Close file pointer!
		function closeFile( $filePointer )
		{
			
			return false;
		}
		
		// Will read from file pointer x bytes
		function readFile( $fp, $bytes )
		{
			
			return NULL;
		}
	
		// Will write to pointer, data, x bytes
		function writeFile( $filePointer, $data, $bytes )
		{
			
			return 0;
		}
	
		// Get the location of a tmp file
		function getTmpFile( $path )
		{
			global $Config, $User;
		
			
			return false;
		}
	
		// Put a file
		function putFile( $path, $fileObject )
		{
			global $Config, $User;
		
			return false;
		}
	
		// Create a folder
		function createFolder( $folderName, $where )
		{
			global $Config, $User, $Logger;

			return false;
		}
	
		// Not to be used outside! Not public!
		function _deleteFolder( $fo, $recursive = true )
		{
			global $Config, $User, $Logger;
			return true;
		}
	
		// Deletes a folder, all sub folders and files (optionally)
		function deleteFolder( $path, $recursive = true )
		{
			global $Config, $User, $Logger;
		
			return false;
		}
	
		// Delete a file
		function deleteFile( $path, $recursive = false )
		{
			global $Config, $User, $Logger;
			return false;
		}
	}
}

// Create a door...
$door = new ShareDrive( isset( $path ) ? $path : ( ( isset( $args ) && isset( $args->args ) && $args->args->path ) ? $args->args->path : false ) );

?>
