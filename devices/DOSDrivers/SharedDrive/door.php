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

		function checkSharedFiles( &$entries )
		{
			global $SqlDatabase, $Config, $User;
			
			$files = [];
			$paths = [];
			$userids = [];
			foreach( $entries as $k=>$entry )
			{
				if( $entry->Type == 'File' )
				{
					//$entries[$k]->Path = $subPath . $entry->Name . ( $entry->Type == 'Directory' ? '/' : '' );
					// Add the path
					// TODO: Eradicate later
					if( !strstr( $entry->Path, ':' ) )
						$paths[] = 'Shared:' . $entry->Path;
					// Normal
					else $paths[] = $entry->Path;
					if( isset( $entry->id ) )
						$files[] = $entry->ID;
					$f = false;
					foreach( $userids as $kk=>$v )
					{
						if( $v == $User->ID )
						{
							$f = true;
							break;
						}
					}
					if( !$f )
						$userids[] = $User->ID;
					$entries[$k]->Shared = 'Private';
				}
			}
			
			if( $shared = $SqlDatabase->FetchObjects( '
				SELECT Path, UserID, ID, `Name`, `Hash` FROM FFileShared s
				WHERE
					s.DstUserSID = "Public" AND s.Path IN ( "' . implode( '", "', $paths ) . '" ) AND
					s.UserID IN ( ' . implode( ', ', $userids ) . ' )
			' ) )
			{
				foreach( $entries as $k=>$entry )
				{
					foreach( $shared as $sh )
					{
						// Add volume name to entry if it's not there
						// TODO: Make sure its always there!
						if( isset( $entry->Path ) && !strstr( $entry->Path, ':' ) )
							$entry->Path = 'Shared:' . $entry->Path;
						if( isset( $entry->Path ) && isset( $sh->Path ) && $entry->Path == $sh->Path && $User->ID == $sh->UserID )
						{
							$entries[$k]->Shared = 'Public';
							
							$link = ( $Config->SSLEnable == 1 ? 'https' : 'http' ) . '://';
							$p = $Config->FCPort ? ( ':' . $Config->FCPort ) : '';
							$link .= $Config->FCHost . $p . '/sharedfile/' . $sh->Hash . '/' . $sh->Name;
							$entries[$k]->SharedLink = $link;
						}
					}
				}
			}
		}

		// Execute a dos command
		function dosAction( $args )
		{
			global $SqlDatabase, $User, $Config, $Logger;
		
			$delete = $read = $getinfo = $write = null;
			
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
				else if( isset( $delete ) )
				{
					$pth = explode( ':', $delete );
					if( strstr( $delete, '/' ) )
					{
						$vol = explode( ':', $delete );
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
				else if( isset( $write ) )
				{
					$pth = explode( ':', $write );
					if( strstr( $write, '/' ) )
					{
						$vol = explode( ':', $write );
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
				else if( isset( $getinfo ) )
				{
					$pth = explode( ':', $getinfo );
					if( strstr( $getinfo, '/' ) )
					{
						$vol = explode( ':', $getinfo );
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
				
				// We are looking in a sub-path
				if( is_array( $path ) && count( $path ) > 1 && trim( $path[ 1 ] ) )
				{
					// No need for trailing
					if( substr( $path[ 1 ], -1, 1 ) == '/' )
						$path[ 1 ] = substr( $path[ 1 ], 0, strlen( $path[ 1 ] ) - 1 );
					
					$out = [];
					$rows = $own = $groupShare = false;
					
					// My own stash!
					if( $path[1] == 'You shared' )
					{
						// Get my shared data
						if( $rows = $SqlDatabase->fetchObjects( '
							SELECT DISTINCT(`Data`) FROM FShared WHERE OwnerUserID=\'' . intval( $User->ID, 10 ) . '\' GROUP BY `Data`
						' ) )
						{
							foreach( $rows as $row )
							{
								if( $delete || $read || $getinfo || $write )
								{
									$fn = explode( ':', $row->Data );
									if( strstr( $fn[1], '/' ) )
									{
										$fn = explode( '/', $fn[1] );
										$fn = $fn[ count( $fn ) - 1 ];
									}
									else $fn = $fn[1];
								}
								
								if( $delete )
								{
									if( $fn == $pth )
									{
										$SqlDatabase->Query( '
											DELETE FROM FShared WHERE 
												OwnerUserID=\'' . intval( $User->ID, 10 ) . '\' AND 
												`Data`="' . mysqli_real_escape_string( $SqlDatabase->_link, $row->Data ) . '"
										' );
										die( 'ok<!--separate-->{"message":"Unshared file.","response":"1"}' );
									}
								}
								// We want to get info!
								if( isset( $getinfo ) && $pth == $fn )
								{
									$d = new File( $row->Data );
									if( $info = $d->GetFileInfo() )
									{
										die( 'ok<!--separate-->' . json_encode( $info ) );
									}
									die( 'fail<!--separate-->' );
								}
								// Read mode intercepts here
								else if( isset( $read ) && $pth == $fn ) 
								{
									$d = new File( $row->Data );
									$d->LoadRaw();
								}
								else if( isset( $write ) && $pth == $fn )
								{
									$s->ExternServerToken = $row->ServerToken;

									if( $info = $this->doWrite( $s, $args->tmpfile, $args->data ) )
									{
										die( 'ok<!--separate-->' . $info->Len . '<!--separate-->' );
									}
									die( 'fail<!--separate-->{"response":"-1","message":"Could not write file."}' );
								}
								
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
								$s->Path = 'You shared/' . $filename;
								$s->Type = 'File';
								$s->MetaType = 'File';
								$s->Permissions = '-RWED-RWED-RWED';
								$s->Shared = '';
								$s->SharedLink = '';
								$s->Filesize = 0;
								$s->Owner = $User->ID;
								$s->ExternPath = $row->Data;
								$s->ExternServerToken = $User->ServerToken;
								$s->row = $row;
								$out[] = $s;
							}
						}
						// In delete mode, we got this far - return false
						if( $delete )
						{
							die( 'fail<!--separate-->{"message":"Failed to unshare file.","response":"-1"}' );
						}	
						
						// Use multi!
						$multiArray = array();
						$master = curl_multi_init();
						foreach( $out as $row )
						{
							$volume = explode( ':', $row->ExternPath );
							$volume = $volume[0] . ':';
							
							$url = ( $Config->SSLEnable ? 'https' : 'http' ) . '://localhost:' . $Config->FCPort . '/system.library/';
							
							$ch = FriendCall( $url . 'file/info?servertoken=' . $row->ExternServerToken, false,
								array( 
									'devname'   => $volume,
									'path'      => $row->ExternPath
								), true
							);
							
							$row->multi = $ch;
							
							$multiArray[] = $row;
							
							curl_multi_add_handle( $master, $ch );
						}
						$out = [];
						
						// Wait for curl to finish
						// TODO: This is the slowdown!
						if( count( $multiArray ) )
						{
							$active = 0;
							do
							{
								$status = curl_multi_exec( $master, $active );
								if( $active )
								{
									// Wait a short time for more activity
									curl_multi_select( $master );
								}
							}
							while ( $active && $status == CURLM_OK );
							
							$out = [];
							
							foreach( $multiArray as $a => $file )
							{
								$res = curl_multi_getcontent( $file->multi );
								curl_multi_remove_handle( $master, $file->multi );
						
								$code = explode( '<!--separate-->', $res );
							
								if( $code[0] == 'ok' )
								{
									$info = json_decode( $code[1] );
									$file->Filesize = $info->Filesize;
									$file->DateCreated = $info->DateCreated;
									$file->DateModified = $info->DateModified;
									unset( $file->multi );
									$out[] = $file;
								}
								// This file does not exist!
								else
								{
									$SqlDatabase->query( 'DELETE FROM FShared WHERE `Data`=\'' . $file->ExternPath . '\' AND OwnerUserID=\'' . $User->ID . '\'' );
								}
							}
						}
						//...
						
						die( 'ok<!--separate-->' . json_encode( $out ) );
					}
					
					// Get data shared by other users directly
					if( !( $rows = $SqlDatabase->fetchObjects( '
						SELECT s.ID, s.Data, s.OwnerUserID, u.ServerToken FROM FShared s, FUser u 
						WHERE 
							u.Name = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $path[ 1 ] ) . '\' AND
							s.OwnerUserID != \'' . $User->ID . '\' AND
							s.SharedType = \'user\' AND 
							s.SharedID = \'' . $User->ID . '\' AND 
							u.ServerToken != "" AND 
							u.ID = s.OwnerUserID
					' ) ) )
					{
						// Shared through groups (by others)
						// Second in union is own files (your files!)
						if( $rows = $SqlDatabase->fetchObjects( '
							(
								SELECT 
									s.ID, s.Data, s.OwnerUserID, u.ServerToken
								FROM 
									FShared s, FUserGroup g, FUserToGroup me_ug, FUserToGroup oth_ug, FUser u
								WHERE 
									g.Name = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $path[ 1 ] ) . '\' AND
									s.SharedType = \'group\' AND 
									s.SharedID = g.ID AND 
									
									s.OwnerUserID != \'' . $User->ID . '\' AND
									s.OwnerUserID = oth_ug.UserID AND
									
									me_ug.UserGroupID = g.ID AND
									oth_ug.UserGroupID = g.ID AND
									
									me_ug.UserID = \'' . $User->ID . '\' AND
									
									u.ID = oth_ug.UserID AND
									
									u.ServerToken != ""
							)
							UNION
							(
								SELECT 
									s.ID, s.Data, s.OwnerUserID, u.ServerToken
								FROM 
									FShared s, FUserGroup g, FUserToGroup me_ug, FUser u
								WHERE 
									g.Name = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $path[ 1 ] ) . '\' AND
									s.SharedType = \'group\' AND 
									s.SharedID = g.ID AND 
									
									s.OwnerUserID = \'' . $User->ID . '\' AND
									s.OwnerUserID = u.ID AND
									me_ug.UserGroupID = g.ID AND
									me_ug.UserID = u.ID AND
									
									u.ServerToken != ""
							)
						' ) )
						{
							$groupShare = true;
						}
						else
						{
							//$Logger->log( 'Err! ' . mysqli_error( $SqlDatabase->_link ) );
						}
					}
					// Add own files shared with other user (we're not in group)
					if( !$groupShare && $own = $SqlDatabase->fetchObjects( '
						SELECT s.ID, s.Data, s.OwnerUserID, u.ServerToken FROM FShared s, FUser u, FUser u2
						WHERE 
							u2.Name = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $path[ 1 ] ) . '\' AND
							s.SharedID = u2.ID AND
							s.SharedID != \'' . $User->ID . '\' AND 
							s.SharedType = \'user\' AND 
							u.ServerToken != "" AND 
							s.OwnerUserID = \'' . $User->ID . '\' AND
							u.ID = s.OwnerUserID
					' ) )
					{
						if( $rows )
						{
							$rows = array_merge( $rows, $own );
						}
						else $rows = $own;
					}
					
					// Get data shared by others
					// TODO: Support groups
					if( $rows )
					{
						// Use multi!
						$multiArray = array();
						$master = curl_multi_init();
						
						foreach( $rows as $row )
						{
							if( $delete )
							{
								$fn = explode( ':', $row->Data );
								$fn = $fn[1];
								if( strstr( $fn, '/' ) )
								{
									$fn = explode( '/', $fn );
									$fn = $fn[ count( $fn ) - 1 ];
								}
								if( $fn == $pth )
								{
									$SqlDatabase->Query( '
										DELETE FROM FShared WHERE ID=\'' . intval( $row->ID, 10 ) . '\' AND OwnerUserID=\'' . $User->ID . '\'
									' );
									die( 'ok<!--separate-->{"message":"Unshared file.","response":"1"}' );
								}
								continue;
							}
							
							$p = $row->Data;
							$filename = explode( ':', $p ); 
							$filename = $filename[1];
							if( strstr( $filename, '/' ) )
							{
								$filename = explode( '/', $filename );
								$filename = $filename[ count( $filename ) - 1 ];
							}
							
							// If we're in other than directory mode, skip
							// files we do not want
							if( ( $delete || $read || $write || $getinfo ) && $pth != $filename ) continue;
							
							$s = new stdClass();
							$s->ID = $row->ID;
							$s->Path = $path[ 1 ] . '/' . $filename;
							$s->Filename = $filename;
							$s->Type = 'File';
							$s->MetaType = 'File';
							$s->Permissions = '-RWED-RWED-RWED';
							$s->Shared = '';
							$s->SharedLink = '';
							$s->Filesize = 0;
							$s->Owner = $row->OwnerUserID;
							$s->row = $row;
							
							// Own files and others' files have different paths
							if( $s->Owner == $User->ID )
							{
								$s->ExternPath = $row->Data; //$vol[0] . ':' . $filename; (old nonsensical!)
								$subPath = $filename;
							}
							// Other user's file
							else
							{
								$s->ExternPath = $row->Data;
								$vol = explode( ':', $row->Data );
								$subPath = $vol[1];
							}							
							
							$url = ( $Config->SSLEnable ? 'https' : 'http' ) . '://localhost:' . $Config->FCPort . '/system.library/';
							
							$s->multi = FriendCall( $url . 'file/info?servertoken=' . $row->ServerToken, false,
								array( 
									'devname'   => $vol[0],
									'path'      => $p
								), true
							);
							$multiArray[] = $s;
							curl_multi_add_handle( $master, $s->multi );
						}
						
						// Wait for curl to finish
						// TODO: This is the slowdown!
						if( count( $multiArray ) )
						{
							do
							{
								$running = 0;
								curl_multi_exec( $master, $running );
							}
							while( $running > 0 );
					
							for( $a = 0; $a < count( $multiArray ); $a++ )
							{
								$file = $s = $multiArray[ $a ];
						
								$res = curl_multi_getcontent( $file->multi );
						
								$code = explode( '<!--separate-->', $res );
							
								if( $code[0] == 'ok' )
								{
									if( isset( $getinfo ) && $pth == $s->Filename )
									{
										$info = json_decode( $code[1] );
										$fInfo = new stdClass();
										$fInfo->Type = 'File';
										$fInfo->ID = $s->ID;
										$fInfo->MetaType = $fInfo->Type;
										$fInfo->Path = $s->Path;
										$fInfo->Filesize = $info->Filesize;
										$fInfo->Filename = $s->Filename;
										$fInfo->DateCreated = $info->DateCreated;
										$fInfo->DateModified = $info->DateModified;
										$fInfo->Owner = $s->Owner;
										$fInfo->ExternPath = $s->ExternPath;
										die( 'ok<!--separate-->' . json_encode( $fInfo ) );
									}
									// Read mode intercepts here
									else if( isset( $read ) && $pth == $s->Filename ) 
									{
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
									
										// Don't timeout!
										$wholeUrl = $url . 'file/read?servertoken=' . $file->row->ServerToken . '&path=' . urlencode( $s->ExternPath ) . '&mode=rb';
										$str = false;
										if( $fp = fopen( $wholeUrl, 'rb', false, $context ) )
										{
											$str = fread( $fp, 5 );
											// Failed attempt
											if( $str == 'fail<' )
											{
												continue;
											}
											// Success
											set_time_limit( 0 );
											ob_end_clean();
											echo( $str ); // output first 5 chars
											fpassthru( $fp );
											fclose( $fp );
											die();
										}
									}
									else if( isset( $write ) && $pth == $s->Filename )
									{
										$s->ExternServerToken = $file->row->ServerToken;

										if( $info = $this->doWrite( $s, $args->tmpfile, $args->data ) )
										{
											die( 'ok<!--separate-->' . $info->Len . '<!--separate-->' );
										}
										die( 'fail<!--separate-->{"response":"-1","message":"Could not write file."}' );
									}
									$info = json_decode( $code[1] );
									$file->Filesize = $info->Filesize;
									$file->DateCreated = $info->DateCreated;
									$file->DateModified = $info->DateModified;
									$file->multi = null;
									$out[] = $file;
								}
								// This file does not exist!
								else
								{
									$SqlDatabase->query( 'DELETE FROM FShared WHERE ID=\'' . $file->row->ID . '\' AND OwnerUserID=\'' . $User->ID . '\'' );
									continue;
								}
							}
						}
						
						// We couldn't if we reach here
						if( $delete )
						{
							die( 'fail<!--separate-->{"message":"Failed to unshare file.","response":"-1"}' );
						}
						
						// Check if files are shared
						$this->checkSharedFiles( $out );
						
						die( 'ok<!--separate-->' . json_encode( $out ) );
					}
					die( 'ok<!--separate-->[]' );
				}
				// This is the root path
				else
				{
					// Select groupshares that has been shared in where I am member
					// Unions joints:
					// 1: Get folders by others who shared in my member groups
					// 2: Get folders by my shares in my member groups
					// 3: Get other peoples specific shares with me
					// 4: Get my shares to other users
					
					if( $rows = $SqlDatabase->fetchObjects( '
					(
						SELECT s.ID AS ShareID, "" as FullName, g.Name, g.ID, u.ID AS OwnerID, u.ServerToken, DateTouched AS DateModified, DateCreated, "group" AS `Type`
							FROM 
								FShared s, FUserGroup g, FUserToGroup me_ug, FUserToGroup oth_ug, FUser u
							WHERE 
								s.OwnerUserID != \'' . $User->ID . '\' AND
								s.SharedType = \'group\' AND
								s.SharedID = g.ID AND
								s.OwnerUserID = oth_ug.UserID AND
								
								g.ID = me_ug.UserGroupID AND
								g.ID = oth_ug.UserGroupID AND
								
								me_ug.UserID = \'' . $User->ID . '\' AND
								oth_ug.UserID = u.ID AND
								
								u.ServerToken != ""
					)
					UNION
					(
						SELECT s.ID AS ShareID, "" as FullName, g.Name, g.ID, u.ID AS OwnerID, u.ServerToken, DateTouched AS DateModified, DateCreated, "group" AS `Type`
							FROM 
								FShared s, FUserGroup g, FUserToGroup me_ug, FUser u
							WHERE 
								s.OwnerUserID = \'' . $User->ID . '\' AND
								s.SharedType = \'group\' AND
								s.SharedID = g.ID AND
								
								g.ID = me_ug.UserGroupID AND
								
								me_ug.UserID = \'' . $User->ID . '\' AND
								me_ug.UserID = u.ID AND

								u.ServerToken != ""
					)
					UNION
					(
						SELECT s.ID AS ShareID, u.FullName, u.Name, u.ID, u.ID AS OwnerID, u.ServerToken, DateTouched AS DateModified, DateCreated, "user" AS `Type`
							FROM 
								FShared s, FUser u 
							WHERE
								u.ID = s.OwnerUserID AND 
								s.OwnerUserID != \'' . $User->ID . '\' AND
								s.SharedType = \'user\' AND
								s.SharedID = \'' . $User->ID . '\' AND
								u.ServerToken != ""
					)
					UNION
					(
						SELECT s.ID AS ShareID, u.FullName, u.Name, u.ID, u.ID AS OwnerID, u.ServerToken, DateTouched AS DateModified, DateCreated, "user" AS `Type`
							FROM 
								FShared s, FUser u 
							WHERE
								u.ID = s.SharedID AND 
								s.OwnerUserID = \'' . $User->ID . '\' AND
								s.SharedType = \'user\' AND
								s.SharedID != \'' . $User->ID . '\' AND
								u.ServerToken != ""
					)
					' ) )
					{
						// Remove duplicates
						$out2 = [];
						foreach( $rows as $row )
						{
							if( !isset( $out2[ $row->Name . '-' . $row->Type ] ) )
								$out2[ $row->Name . '-' . $row->Type ] = $row;
						}
						foreach( $out2 as $a=>$row )
						{
							$s = new stdClass();
							$s->Filename = $row->Name;
							if( isset( $row->FullName ) )
								$s->Title = $row->FullName;
							$s->ID = $row->ID;
							$s->Path = $row->Name;
							$s->Type = 'Directory';
							$s->MetaType = 'Directory';
							$s->IconLabel = $row->Type == 'user' ? 'UserShare' : 'GroupShare';
							$s->Permissions = '---------------';
							$s->DateCreated = $s->DateModified = date( 'Y-m-d H:i:s' );
							$s->Shared = '';
							$s->SharedLink = '';
							$s->Filesize = 0;
							$s->ExternServerToken = $row->ServerToken;
							$s->ShareID = $row->ShareID;
							$out[] = $s;
						}
					}
					
					// Make a folder for content you shared with others
					$others = new stdClass();
					$others->Filename = 'You shared';
					$others->Path = 'You shared';
					$others->Title = 'i18n_you_shared';
					$others->OwnerUserID = $User->ID;
					$others->Type = 'Directory';
					$others->MetaType = 'Directory';
					$others->IconLabel = 'YouShare';
					$others->DateCreated = $others->DateModified = date( 'Y-m-d H:i:s' );
					$others->Shared = $others->SharedLink = '';
					$others->Filesize = 0;
					$others->ServerToken = $User->ServerToken;
					$out[] = $others;
				}
				
				// Use multi!
				$multiArray = array();
				$master = curl_multi_init();
				
				// Stat everything
				foreach( $out as $k=>$file )
				{
					// If we're in other than directory mode, skip
					// files we do not want
					if( ( $delete || $read || $write || $getinfo ) && $pth != $file->Filename ) continue;
					
					if( $file->Type == 'File' )
					{
						$vol = explode( ':', $file->ExternPath );
						$url = ( $Config->SSLEnable ? 'https' : 'http' ) . '://localhost:' . $Config->FCPort . '/system.library/';
						$file->multi = FriendCall( $url . 'file/info?servertoken=' . $file->ExternServerToken, false,
							array( 
								'devname'   => $vol[0],
								'path'      => $file->ExternPath
							), true );
						$file->key = $k;
						$multiArray[] = $file;
						curl_multi_add_handle( $master, $file->multi );
					}
					else if( $file->Type == 'Directory' )
					{
						if( isset( $getinfo ) && $pth == $file->Filename )
						{
							$fInfo = new stdClass();
							$fInfo->Type = 'Directory';
							$fInfo->MetaType = $fInfo->Type;
							$fInfo->Path = $file->Path;
							$fInfo->Filesize = 0;
							$fInfo->Filename = $file->Filename;
							$fInfo->DateCreated = date( 'Y-m-d H:i:s' );
							$fInfo->DateModified = date( 'Y-m-d H:i:s' );
							die( 'ok<!--separate-->' . json_encode( $fInfo ) );
						}
					}
					unset( $out[$k]->ShareID );
				}
				
				// Wait for curl to finish
				if( count( $multiArray ) )
				{
					set_time_limit( 0 );
					do
					{
						$running = 0;
						curl_multi_exec( $master, $running );
					}
					while( $running > 0 );
					
					for( $a = 0; $a < count( $multiArray ); $a++ )
					{
						$file = $multiArray[ $a ];
						
						$k = $file->key;
						$res = curl_multi_getcontent( $file->multi );
						$code = explode( '<!--separate-->', $res );
						if( $code[0] == 'ok' )
						{
							if( isset( $getinfo ) && $pth == $file->Filename )
							{
								$info = json_decode( $code[1] );
								$fInfo = new stdClass();
								$fInfo->Type = 'File';
								$fInfo->MetaType = $fInfo->Type;
								$fInfo->Path = $file->Path;
								$fInfo->Filesize = $info->Filesize;
								$fInfo->Filename = $file->Filename;
								$fInfo->DateCreated = $info->DateCreated;
								$fInfo->DateModified = $info->DateModified;
								$fInfo->Owner = $file->Owner;
								$fInfo->ExternPath = $file->ExternPath;
								die( 'ok<!--separate-->' . json_encode( $fInfo ) );
							}
							else if( isset( $read ) && $pth == $file->Filename ) 
							{
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
								
								// Don't timeout!
								set_time_limit( 0 );
								ob_end_clean();
								
								if( $fp = fopen( $url . 'file/read?servertoken=' . $file->ExternServerToken . '&path=' . urlencode( $file->ExternPath ) . '&mode=rb', 'rb', false, $context ) )
								{
									fpassthru( $fp );
									fclose( $fp );
								}
								die();
							}
							else if( isset( $write ) && $pth == $file->Filename )
							{
								if( $info = $this->doWrite( $file, $args->tmpfile, $args->data ) )
								{
									die( 'ok<!--separate-->' . $info->Len . '<!--separate-->' );
								}
								die( 'fail<!--separate-->{"response":"-1","message":"Could not write file."}' );
							}
							$info = json_decode( $code[1] );
							$out[$k]->Filesize = $info->Filesize;
							$out[$k]->DateCreated = $info->DateCreated;
							$out[$k]->DateModified = $info->DateModified;
						}
						else
						{
							$SqlDatabase->Query( '
							DELETE FROM 
								FShared 
							WHERE 
								OwnerUserID=\'' . $User->ID . '\' AND 
								`Data`="' . mysqli_real_escape_string( $SqlDatabase->_link, $file->ExternPath ) . '" LIMIT 1' 
							);
							continue;
						}
						$out[$k]->Owner = $User->ID;
						if( isset( $out[$k]->ShareID ) )
							unset( $out[$k]->ShareID );
						unset( $out[$k]->ExternServerToken );
						unset( $out[$k]->key );
						unset( $out[$k]->multi );
					}
				}
				
				// Get the output
				if( count( $out ) )
				{
					// Check if files are shared
					$this->checkSharedFiles( $out );
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
				$getinfo = $args->path;
				$path = '';
				goto directory;
			}
			else if( $args->command == 'write' )
			{
				$write = $args->path;
				$path = '';
				goto directory;
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
						die( 'ok<!--separate-->{"message":"Device mounted","response":"1"}' );
					case 'unmount':
						die( 'fail<!--separate-->{"message":"Shared drives can not be unmounted.","response":"-1"}' );
					// Shared drive has no rename
					case 'rename':
						die( 'fail<!--separate-->{"message":"Could not rename file.","response":"-1"}' );
						break;
					// Shared drive has no makedir
					case 'makedir':
						die( 'fail<!--separate-->{"message":"Could not make directory.","response":"-1"}' );
						//die( 'fail<!--separate-->why: ' . print_r( $args, 1 ) . '(' . $path . ')' );
						break;
					case 'delete':
						if( substr( $args->path, -1, 1 ) == '/' )
						{
							return 'fail<!--separate-->{"message":"Could not unshare file - path is wrong.","response":"-1"}';
						}
						$delete = $args->path;
						$path = '';
						goto directory;
					// Shared drive has no copy
					case 'copy':
						return 'fail<!--separate-->{"message":"Could not copy file.","response":"-1"}';
				}
			}
			return 'fail<!--separate-->';
		}
		
		// Gets a file by path!
		function getFile( $path )
		{
			global $User, $Logger;
		
			// Remove file from path
			$subPath = explode( '/', end( explode( ':', $path ) ) );
			array_pop( $subPath );
			$subPath = implode( '/', $subPath ) . '/';
		
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
		
		// Write a file with either a tmp file or data
		function doWrite( $file, $tmpfile = false, $data = false )
		{
			global $Logger, $Config;
			$url = ( $Config->SSLEnable ? 'https' : 'http' ) . '://localhost:' . $Config->FCPort . '/system.library/';
			$query = $url . 'file/upload?servertoken=' . $file->ExternServerToken . '&mode=w&path=' . urlencode( $file->ExternPath );
			$o = array();
			if( $tmpfile && file_exists( $tmpfile ) )
			{
				$cfile = curl_file_create( $tmpfile );
				$o[ 'extra_info' ]    = filesize( $tmpfile );
				$o[ 'file_contents' ] = $cfile;
			}
			else if( $data )
				$o[ 'data' ] = $data;
			if( $res = FriendCall( $query, false, $o ) )
			{
				if( substr( $res, 0, 3 ) == 'ok<' )
				{
					$n = new stdClass();
					$n->Len = 0;
					$n->Response = 'ok';
					return $n;
				}
			}
			return false;
		}
	}
}

// Create a door...
$door = new ShareDrive( isset( $path ) ? $path : ( ( isset( $args ) && isset( $args->args ) && $args->args->path ) ? $args->args->path : false ) );

?>
