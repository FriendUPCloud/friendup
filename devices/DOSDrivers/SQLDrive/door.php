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

if( !class_exists( 'DoorSQLDrive' ) )
{
	class DoorSQLDrive extends Door
	{	
		/**
		 * Constructor
		*/
		function onConstruct()
		{
			global $args;
			$this->fileInfo = isset( $args->fileInfo ) ? $args->fileInfo : new stdClass();
			$defaultDiskspace = 536870912;
			if( isset( $this->Config ) && strlen( $this->Config) > 3 )
			{
				$this->configObject = json_decode( $this->Config );
				if( isset( $this->configObject->DiskSize ) )
				{
					$ds = strtolower( $this->configObject->DiskSize . '' );
					$ty = substr( $ds, strlen( $ds ) - 2, 2 );
					$nn = $defaultDiskspace;
					switch( $ty )
					{
						case 'kb':
							$nn = substr( $ds, 0, strlen( $ds ) - 2 );
							$nn = intval( $nn, 10 ) * 1024;
							break;
						case 'mb':
							$nn = substr( $ds, 0, strlen( $ds ) - 2 );
							$nn = intval( $nn, 10 ) * 1024 * 1024;
							break;
						case 'gb':
							$nn = substr( $ds, 0, strlen( $ds ) - 2 );
							$nn = intval( $nn, 10 ) * 1024 * 1024 * 1024;
							break;
						case 'tb':
							$nn = substr( $ds, 0, strlen( $ds ) - 2 );
							$nn = intval( $nn, 10 ) * 1024 * 1024 * 1024 * 1024;
							break;
						default:
							$nn = intval( $ds, 10 );
							break;
					}
					if( $nn <= 0 ) $nn = $defaultDiskspace;
					define( 'SQLDRIVE_FILE_LIMIT', $nn );
				}
				else
				{
					define( 'SQLDRIVE_FILE_LIMIT', $defaultDiskspace );
				}
			}
			
			if( !defined( 'SQLDRIVE_FILE_LIMIT' ) )
			{
				// 500 megabytes
				define( 'SQLDRIVE_FILE_LIMIT', $defaultDiskspace );
			}
		}
		
		// Public functions --------------------------------------------
		
		/**
		 * @brief Execute a dos command
		 * 
		 * Executes a dormant command on this Door object which is passed on to
		 * Friend Core. The function is very low level in that it takes a url
		 * encoded string of vars.
		 * The function does not return any data, but exits with its result
		 * in the format of returncode<!--separate-->{jsondata...}
		 *
		 * @param $args arguments for dos action
		 * @return none
		 */
		public function dosAction( $args )
		{
			global $SqlDatabase, $User, $Config, $Logger;
		
			// Sanitized username
			$uname = str_replace( array( '..', '/', ' ' ), '_', $User->Name );
			$wname = $Config->FCUpload . $uname . '/';
			
			//$Logger->log( 'Executing a dos action: ' . $args->command );
			//$Logger->log( 'Pure args: ' . print_r( $args, 1 ) );
			
			// TODO: This is a workaround, please fix in Friend Core!
			//       Too much code for getting a real working path..
			if( isset( $args->path ) )
			{
				$path = $args->path;
			}
			else if( isset( $args->args ) )
			{
				if( isset( $args->args->path ) )
					$path = $args->args->path;
			}
			
			if( isset( $path ) )
			{
				$path = str_replace( '::', ':', $path );
				$path = str_replace( ':/', ':', $path );
				$path = explode( ':', $path );
				if( count( $path ) > 2 )
				{
					$args->path = $path[1] . ':' . $path[2];
				}
				else
				{
					// FIX WEBDAV problems
					if( count( $path ) > 1 )
					{
						if( $path[1] != '' && $path[1]{0} == '/' )
							$path[1] = substr( $path[1], 1, strlen( $path[1] ) );
					}
					$args->path = implode( ':', $path );
				}
				
				$path = $args->path;
				
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
				$fo = false;
			
				// Can we get sub folder?
				if( isset( $path ) && strlen( $path ) > 0 )
				{
					$subPath = explode( ':', $path ); 
					if( $subPath = end( $subPath ) )
					{
						$fo = $this->getSubFolder( $subPath );
						// Failed to find a path
						if( !$fo ) die( 'fail<!--separate-->{"response":0,"message":"Path error.","path":"' . $path . '"}' );
					}
					else $subPath = '';
				}
				$volume = explode( ':', $path );
				$volume = reset( $volume ) . ':';
	
				$out = [];
				if( $entries = $SqlDatabase->FetchObjects( '
					SELECT * FROM
					(
						(
							SELECT "Directory" AS `Type`, ID, `Name`, Permissions, DateModified, DateCreated, "0" AS Filesize, UserID FROM FSFolder
							WHERE FilesystemID=\'' . $this->ID . '\' AND UserID=\'' . $User->ID . '\' AND FolderID=\'' . ( $fo ? $fo->ID : '' ) . '\'
						)
						UNION
						(
							SELECT "File" AS `Type`, ID, Filename AS `Name`, Permissions, DateModified, DateCreated, Filesize, UserID FROM FSFile
							WHERE FilesystemID=\'' . $this->ID . '\' AND UserID=\'' . $User->ID . '\' AND FolderID=\'' . ( $fo ? $fo->ID : '' ) . '\'
						)
					) z
					ORDER BY `Name` ASC
				' ) )
				{
					// Get shared files
					$files = [];
					$paths = [];
					$userids = [];
					foreach( $entries as $k=>$entry )
					{
						if( $entry->Type == 'File' )
						{
							$entries[$k]->Path = $subPath . $entry->Name . ( $entry->Type == 'Directory' ? '/' : '' );
							// Add the path
							// TODO: Eradicate later
							if( !strstr( $entry->Path, ':' ) )
								$paths[] = $volume . $entry->Path;
							// Normal
							else $paths[] = $entry->Path;
							$files[] = $entry->ID;
							$f = false;
							foreach( $userids as $kk=>$v )
							{
								if( $v == $entry->UserID )
								{
									$f = true;
									break;
								}
							}
							if( !$f )
								$userids[] = $entry->UserID;
							$entries[$k]->Shared = 'Private';
						}
					}
					if( $shared = $SqlDatabase->FetchObjects( $q = ( '
						SELECT Path, UserID, ID, `Name`, `Hash` FROM FFileShared s
						WHERE
							s.DstUserSID = "Public" AND s.Path IN ( "' . implode( '", "', $paths ) . '" ) AND
							s.UserID IN ( ' . implode( ', ', $userids ) . ' )
					' ) ) )
					{
						foreach( $entries as $k=>$entry )
						{
							foreach( $shared as $sh )
							{
								// Add volume name to entry if it's not there
								// TODO: Make sure its always there!
								if( isset( $entry->Path ) && !strstr( $entry->Path, ':' ) )
									$entry->Path = $volume . $entry->Path;
								if( isset( $entry->Path ) && isset( $sh->Path ) && $entry->Path == $sh->Path && $entry->UserID == $sh->UserID )
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
					
					// List files
					foreach( $entries as $entry )
					{
						$o = new stdClass();
						$o->Filename = $entry->Name;
						$o->Type = $entry->Type;
						$o->MetaType = $entry->Type; // TODO: Is this really needed??
						$o->ID = $entry->ID;
						$o->Permissions = $entry->Permissions;
						$o->DateModified = $entry->DateModified;
						$o->DateCreated = $entry->DateCreated;
						$o->Filesize = $entry->Filesize;
						$pth = explode( ':', $subPath . $o->Filename . ( $o->Type == 'Directory' ? '/' : '' ) ); 
						$o->Path = end( $pth ); unset( $pth );
						$o->Shared = isset( $entry->Shared ) ? $entry->Shared : '';
						$o->SharedLink = isset( $entry->SharedLink ) ? $entry->SharedLink : '';
						$out[] = $o;
					}
					return 'ok<!--separate-->' . json_encode( $out );
				}
				// No entries
				return 'ok<!--separate-->[]';
			}
			else if( $args->command == 'info' && is_string( $path ) && isset( $path ) && strlen( $path ) )
			{
				// Is it a folder?
				if( substr( $path, -1, 1 ) == '/' )
				{
					if( $sp = $this->getSubFolder( $path ) )
					{
						$fldInfo = new stdClass();
						$fldInfo->Type = 'Directory';
						$fldInfo->MetaType = $fldInfo->Type;
						$fldInfo->Path = end( explode( ':', $path ) );
						$fldInfo->Filesize = 0;
						$fldInfo->Filename = $sp->Name;
						$fldInfo->DateCreated = $sp->DateCreated;
						$fldInfo->DateModified = $sp->DateModified;
						die( 'ok<!--separate-->' . json_encode( $fldInfo ) );
					}
				}
				else if( substr( $path, -1, 1 ) == ':' )
				{
					//its our mount itself

					$fldInfo = new stdClass();
					$fldInfo->Type = 'Directory';
					$fldInfo->MetaType = '';
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
					// Create a file object
					$f = new dbIO( 'FSFile' );
					$f->FilesystemID = $this->ID;
					$fname = end( explode( ':', $args->path ) );
					$fname = end( explode( '/', $fname ) );
					$f->Filename = $fname;
					//$f->UserID = $User->ID; // TODO: Add for security!
					$f->FolderID = '0';
					$fn = '';
	
					// Can we get sub folder?
					if( isset( $args->path ) && $subPath = trim( end( explode( ':', $args->path ) ) ) )
					{	
						// Remove filename
						if( substr( $subPath, -1, 1 ) != '/' && strstr( $subPath, '/' ) )
						{
							$subPath = explode( '/', $subPath );
							array_pop( $subPath );
							$subPath = implode( '/', $subPath ) . '/';
						}
						if( $fo = $this->getSubFolder( $subPath ) )
							$f->FolderID = $fo->ID;	
					}
	
					// Try to load database object
					if( $f->Load() )
					{
						$fldInfo = new stdClass();
						$fldInfo->Type = 'File';
						$fldInfo->MetaType = $fldInfo->Type;
						$fldInfo->Path = $path;
						$fldInfo->Filesize = $f->Filesize;
						$fldInfo->Filename = $f->Filename;
						$fldInfo->DateCreated = $f->DateCreated;
						$fldInfo->DateModified = $f->DateModified;
						die( 'ok<!--separate-->' . json_encode( $fldInfo ) );
					}
					// We added a directory after all..
					else
					{
						if( $sp = $this->getSubFolder( $path . '/' ) )
						{
							$fldInfo = new stdClass();
							$fldInfo->Type = 'Directory';
							$fldInfo->MetaType = $fldInfo->Type;
							$fldInfo->Path = end( explode( ':', $path ) );
							$fldInfo->Filesize = 0;
							$fldInfo->Filename = $sp->Name;
							$fldInfo->DateCreated = $sp->DateCreated;
							$fldInfo->DateModified = $sp->DateModified;
							die( 'ok<!--separate-->' . json_encode( $fldInfo ) );
						}
					}
				}
				die( 'fail<!--separate-->Could not find file!' );
			}
			else if( $args->command == 'write' )
			{
				// We need to check how much is in our database first
				$deletable = false;
				$total = 0;
				if( $sum = $SqlDatabase->FetchObject( '
					SELECT SUM(u.Filesize) z FROM FSFile u 
					WHERE u.UserID=\'' . $User->ID . '\' AND FilesystemID = \'' . $this->ID . '\'
				' ) )
				{
					$total = $sum->z;
				}
				
				// Create a file object
				$f = new dbIO( 'FSFile' );
				$f->FilesystemID = $this->ID;
				$fname = explode( ':', $args->path ); $fname = end( $fname );
				$subPath = $fname;
				
				if( strstr( $fname, '/' ) )
				{
					$fname = explode( '/', $fname ); $fname = end( $fname );
				}
				$f->Filename = $fname;
				$f->UserID = $User->ID;
				$f->FolderID = '0';

				// Can we get sub folder?
				$fo = false;
				
				// Get by path (subfolder)
				$subPath = $testPath = false;
				if( is_string( $path ) && strstr( $path, ':' ) )
					$testPath = $subPath = end( explode( ':', $path ) );
				
				// Remove filename
				if( substr( $subPath, -1, 1 ) != '/' && strstr( $subPath, '/' ) )
				{
					$subPath = explode( '/', $subPath );
					array_pop( $subPath );
					$subPath = implode( '/', $subPath ) . '/';
				}
				
				if( $fo = $this->getSubFolder( $subPath ) )
				{
					$Logger->log( '[SQLDRIVE] Found folder by path: ' . $subPath );
					$f->FolderID = $fo->ID;
				}
				else
				{
					$Logger->log( '[SQLDRIVE] Could not find folder by path: ' . $subPath );
				}
				
				if( substr( $testPath, -1, 1 ) == '/' )
					$testPath = substr( $testPath, 0, strlen( $testPath ) - 1 );
				$pathLen = explode( '/', $testPath );
				$pathLen = count( $pathLen );

				$Logger->log( 'Pathlen: ' . pathLen );
				
				if( $pathLen == 1 || ( $pathLen > 1 && $fo ) )
				{
				
					// Overwrite existing and catch object
					if( $f->Load() )
					{
						$deletable = $Config->FCUpload . $f->DiskFilename;
						$fn = $f->DiskFilename;
					}
					else
					{
						$fn = $f->Filename;
						$f->DiskFilename = '';
					}
				
					// Sanitize!
					if( strstr( $fn, '/' ) )
					{
						$fn = explode( '/', $fn );
						$fn = $fn[1];
					}

					$Logger->log( 'Before write file' );
	
					// Write the file
				
					// The file is new, make sure we don't overwrite any existing file
					if( $f->ID <= 0 )
					{
						$ofn = $fn;
						$fna = explode( '.', $ofn ); $fna = end( $fna );
						if( !is_dir( $wname ) ) mkdir( $wname );
						while( file_exists( $wname . $fn ) )
						{
							// Keep extension last
							if( $fna )
							{
								$fn = substr( $ofn, 0, strlen( $ofn ) - 1 - strlen( $fna ) ) . rand(0,9999) . rand(0,9999) . rand(0,9999) . '.' . $fna;
							}
							// Has no extension
							else $fn .= rand(0,99999); 
						}
					}

					$Logger->log( 'Before w+' );
				
					if( $file = fopen( $wname . $fn, 'w+' ) )
					{
						// Delete existing file
						if( $deletable ) unlink( $deletable );
					
						$Logger->log( 'is test' );
						if( isset( $args->tmpfile ) )
						{
							$Logger->log( 'exist?' );
							if( file_exists( $args->tmpfile ) )
							{
								$Logger->log( 'exist!' );
								fclose( $file );
								$len = filesize( $args->tmpfile );
							
								$Logger->log( 'workaround?' );
								// TODO: UGLY WORKAROUND, FIX IT!
								//       We need to support base64 streams
								if( $fr = fopen( $args->tmpfile, 'r' ) )
								{
									$string = fread( $fr, 32 );
									fclose( $fr );
									if( substr( urldecode( $string ), 0, strlen( '<!--BASE64-->' ) ) == '<!--BASE64-->' )
									{
										$fr = file_get_contents( $args->tmpfile );
										$fr = base64_decode( end( explode( '<!--BASE64-->', urldecode( $fr ) ) ) );
										if( $fo = fopen( $args->tmpfile, 'w' ) )
										{
											fwrite( $fo, $fr );
											fclose( $fo );
										}
									}
								}

								if( $total + $len < SQLDRIVE_FILE_LIMIT )
								{
									$Logger->log( 'Moving tmp file ' . $args->tmpfile . ' to ' . $wname . $fn . ' because ' . ( $total + $len ) . ' < ' . SQLDRIVE_FILE_LIMIT );
									rename( $args->tmpfile, $wname . $fn );
								}
								else
								{
									$Logger->log( 'fail<!--separate-->Limit broken' );
									die( 'fail<!--separate-->Limit broken' );
								}
							}
							else
							{
								$Logger->log( 'fail<!--separate-->Tempfile does not exist!' );
								die( 'fail<!--separate-->Tempfile does not exist!' );
							}
						}
						else
						{
							$Logger->log( 'is tmp file set, limit: ' . SQLDRIVE_FILE_LIMIT );
							if( $total + strlen( $args->data ) < SQLDRIVE_FILE_LIMIT )
							{
								$len = fwrite( $file, $args->data );
								fclose( $file );
							}
							else
							{
								$Logger->log( 'die!die!die! my darling! ' );
								fclose( $file );
								$Logger->log( 'fail<!--separate-->Limit broken ' . SQLDRIVE_FILE_LIMIT );
								die( 'fail<!--separate-->Limit broken' );
							}
						}
					
						// Sanitize username
						$uname = str_replace( array( '..', '/', ' ' ), '_', $User->Name );
					
						$Logger->log( '[SQLDRIVE] WRITING ' . $uname . '/' . $fn . ' -> ' . $f->Filename . ' in ' . $subPath );
					
						$f->DiskFilename = $uname . '/' . $fn;
						$f->Filesize = filesize( $wname. $fn );
						$Logger->log( '[SQLDRIVE] WRITING done, size: ' . $f->Filesize );
						if( !$f->DateCreated ) $f->DateCreated = date( 'Y-m-d H:i:s' );
						$f->DateModified = date( 'Y-m-d H:i:s' );
						$Logger->log( '[SQLDRIVE] WRITING store in DB' );
						$f->Save();
						$Logger->log( '[SQLDRIVE] WRITING stored in db - recordID is ' . $f->ID . ' (Err: ' . $f->_lastError . ')' . ' -> ' . $f->_lastQuery );
						return 'ok<!--separate-->' . $len . '<!--separate-->' . $f->ID;
					}
				}
				$Logger->log( 'fail<!--separate-->Could not write file: ' . $wname . $fn );
				return 'fail<!--separate-->Could not write file: ' . $wname . $fn;
			}
			else if( $args->command == 'read' )
			{
				// Create a file object
				$f = new dbIO( 'FSFile' );
				$f->FilesystemID = $this->ID;
				
				$fname = explode( ':', $args->path );
				$fname = end( $fname );
				
				$subPath = $fname;
				
				$fname = explode( '/', $fname );
				$fname = end( $fname );
				
				$f->Filename = $fname;
				$f->FolderID = '0';
				$fn = '';
	
				// Can we get sub folder?
				
				// Remove filename
				if( substr( $subPath, -1, 1 ) != '/' && strstr( $subPath, '/' ) )
				{
					$subPath = explode( '/', $subPath );
					array_pop( $subPath );
					$subPath = implode( '/', $subPath ) . '/';
				}
				if( $fo = $this->getSubFolder( $subPath ) )
					$f->FolderID = $fo->ID;	
	
				// Try to load database object
				if( $f->Load() )
				{
					// Read the file
					$fn = $f->DiskFilename;
					$fname = $Config->FCUpload . $fn;
					
					if( file_exists( $fname ) )
					{
						$info = @getimagesize( $fname );
					
						// Only give this on images
						// TODO: Perhaps content-length is for binary types!
						$mime = false;
						if( isset( $info ) && isset( $info[0] ) && $info[0] > 0 )
							$mime = $info['mime'];
					
						// Try to guess the mime type
						$ext = explode( '.', $fname );
						if( !$mime && $ext = end( $ext ) )
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
					
						// Some data is raw
						if( isset( $args->mode ) && ( $args->mode == 'rb' || $args->mode == 'rs' ) )
						{
							//US-230 This is a memory friendly way to dump a file :-)
							//Previously the download got broken at 94MB (or another file size depending on php.ini)
							ob_end_clean(); 
							readfile($fname);
							die();
						}
						// Return ok
						$okRet = 'ok<!--separate-->';
					
						if( isset( $info[0] ) && $info[0] > 0 && $info[1] > 0 )
						{
							friendHeader( 'Content-Length: ' . filesize( $fname ) + strlen( $okRet ) );
							return $okRet . base64_encode( file_get_contents( $fname ) );
						}
					
						friendHeader( 'Content-Length: ' . filesize( $fname ) + strlen( $okRet ) );
						return $okRet . trim( file_get_contents( $fname ) );
					}
				}
				return 'fail<!--separate-->{"response":"could not read file"}'; //Could not read file: ' . $Config->FCUpload . $fn . '<!--separate-->' . print_r( $f, 1 );
			}
			// Import sent files!
			else if( $args->command == 'import' )
			{
				if( $dir = opendir( 'import' ) )
				{
					$fcount = 0;
					while( $f = readdir( $dir ) )
					{
						if( $f{0} == '.' ) continue;
					
						$fl = new dbIO( 'FSFile' );
						$fl->FilesystemID = $this->ID;
						$fl->FolderID = '0';
						$fl->UserID = $User->ID;
						$fl->Filename = $f;
						$fl->Filesize = filesize( 'import/' . $f );
					
						$ext = end( explode( '.', $f ) );
						$fname = substr( $f, 0, strlen( $f ) - ( strlen( $ext ) + 1 ) );
						$filename = $fname . '.' . $ext;
					
						while( file_exists( $wname . $filename ) )
							$filename = $fname . rand(0,999) . '.' . $ext;
					
						$fl->DiskFilename = $filename;
					
						copy( 'import/' . $f, $wname . $filename );
						if( file_exists( $wname . $filename ) )
						{
							unlink( 'import/' . $f );
					
							$fl->Save();
						
							// Only on success
							if( $fl->ID > 0 )
							{
								$fcount++;
							}
							else
							{
								unlink( $wname . $filename );
							}
						}
					}
					closedir( $dir );
					if( $fcount > 0 )
					{
						die( 'ok<!--separate-->' . $fcount );
					}
					die( 'fail<!--separate-->Wrote no files.' );
				}
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
						foreach( $d as $k=>$v ) $this->$k = $v;
					}
				}
				if( $row = $SqlDatabase->FetchObject( '
					SELECT SUM(Filesize) AS FZ FROM FSFile 
					WHERE 
						FilesystemID = \'' . $this->ID . '\' AND UserID=\'' . $User->ID . '\'
				' ) )
				{
					$o = new stdClass();
					$o->Volume = $this->Name . ':';
					$o->Used = $row->FZ;
					$o->Filesize = SQLDRIVE_FILE_LIMIT;
					die( 'ok<!--separate-->' . json_encode( $o ) );
				}
				die( 'fail' );
			}
			else if( $args->command == 'dosaction' )
			{
				$action = isset( $args->action ) ? $args->action : ( isset( $args->args->action ) ? $args->args->action : false );
				$path   = $args->path;
				switch( $action )
				{
					case 'mount':
						//$Logger->log( 'Mounting not needed here.. Always succeed.' );
						die( 'ok' );
					case 'unmount':
						//$Logger->log( 'Unmounting not needed here.. Always succeed.' );
						die( 'ok' );
					case 'rename':
						ob_clean();
						// Is it a folder?
						if( substr( $path, -1, 1 ) == '/' )
						{
							//$Logger->log( '[Rename] Trying to find: ' . $path );
							$sp = $this->getSubFolder( $path );
							if( $sp )
							{
								// Check if the folder already exists
								$folderTest = new dbIO( 'FSFolder' );
								$folderTest->Name = $args->newname;
								$folderTest->FilesystemID = $sp->FilesystemID;
								$folderTest->FolderID = $sp->FolderID;
								if( $folderTest->load() )
								{
									die( 'fail<!--separate-->{"response":-1,"message":"Folder with this name already exists."}' );
								}
								else
								{
									$sp->Name = $args->newname;
									$sp->Save();
									die( 'ok<!--separate-->{"response":1,"message":"Renamed the folder."}' );
								}
							}
						}
						// Ok, it's a file
						else
						{
							$p = explode( ':', $path );
							$fname = false;
							if( strstr( $p[1], '/' ) )
							{
								$pth = explode( '/', $p[1] );
								$fname = array_pop( $pth );
								$p[1] = implode( '/', $pth ) . '/';
							}
							else
							{
								$fname = array_pop( $p );	
							}
							$p = implode( ':', $p );
							$sp = $this->getSubFolder( $p );
							if( $fname )
							{
								$f = new dbIO( 'FSFile' );
								if( $sp ) $f->FolderID = $sp->ID;
								else $f->FolderID = '0';
								$f->Filename = $fname;
								$f->FilesystemID = $this->ID;
								if( $f->Load() )
								{
									// Test!
									$test = new dbIO( 'FSFile' );
									$test->FilesystemID = $this->ID;
									$test->FolderID = $f->FolderID;
									$test->Filename = $args->newname;
									if( $test->load() )
									{
										die( 'fail<!--separate-->{"response":-1,"message":"Could not rename file, another file exists with this name."}' );
									}
									else
									{
										$f->Filename = $args->newname;
										$f->DateModified = date( 'Y-m-d H:i:s' );
										$f->Save();
										die( 'ok<!--separate-->{"response":1,"message":"Renamed the file."}' );
									}
								}
							}
						}
						die( 'fail<!--separate-->{"response":-1,"message":"Could not find file!"}' );
						break;
					case 'makedir':
						
						// Add trailing '/'
						if( substr( $path, -1, 1 ) != '/' && substr( $path, -1, 1 ) != ':' )
							$path .= '/';
							
						if( $path )
						{
							$f = new DbIO( 'FSFolder' );
		
							// Get by path (subfolder)
							$subPath = $testPath = false;
							if( is_string( $path ) && strstr( $path, ':' ) )
								$testPath = $subPath = end( explode( ':', $path ) );
						
							// Remove filename
							$fo = false;
							if( $subPath )
							{
								// Strip '/' here
								if( substr( $subPath, -1, 1 ) == '/' )
									$subPath = substr( $subPath, 0, strlen( $subPath ) - 1 );
								if( strstr( $subPath, '/' ) )
								{
									$subPath = explode( '/', $subPath );
									array_pop( $subPath );
									$subPath = implode( '/', $subPath ) . '/';
								}
								$fo = $this->getSubFolder( $subPath );
							}
				
							if( substr( $testPath, -1, 1 ) == '/' )
								$testPath = substr( $testPath, 0, strlen( $testPath ) - 1 );
							$pathLen = explode( '/', $testPath );
							$pathLen = count( $pathLen );
							
							if( $pathLen == 1 || ( $pathLen > 1 && $fo ) )
							{
								// Do it
								$name = explode( ':', $path );
								$name = end( $name );
								if( substr( $name, -1, 1 ) == '/' )
									$name = substr( $name, 0, strlen( $name ) - 1 );
								if( strstr( $name, '/' ) )
									$name = end( explode( '/', $name ) );
						
								if( trim( $name ) )
								{
									$name = trim( $name );
									if( substr( $name, -1, 1 ) == '/' )
										$name = substr( $name, 0, strlen( $name ) - 1 );
									$newFolder = end( explode( '/', $name ) );
									$f->FilesystemID = $this->ID;
									$f->Name = $newFolder;
									$f->UserID = $User->ID;
									$f->FolderID = $fo ? $fo->ID : '0';
							
									// Make sure the folder does not already exist!
									if( $f->Load() )
									{
										die( 'ok<!--separate-->{"message":"Directory already exists","response":-2}' );
									}
									$f->DateModified = date( 'Y-m-d H:i:s' );
									$f->DateCreated = $f->DateModified;
									$f->Save();
									//$Logger->log( '[SQLDRIVE] Made directory ' . $f->Name . ' (in ' . $path . ') id ' . $f->ID );
									if( $f->ID > 0 )
										return 'ok<!--separate-->' . $f->ID;
								}
							}
						}
						//$Logger->log( '[SQLDRIVE] Could not make directory.' . $path . ' ' . $subPath );
						die( 'fail<!--separate-->' ); //why: ' . print_r( $args, 1 ) . '(' . $path . ')' );
						break;
					case 'delete':
						if( isset( $path ) )
						{
							if( $this->deleteFile( $path, true ) )
							{
								return 'ok';
							}
						}
						// Other combos not supported yet
						return 'fail';
					// Move files and folders or a whole volume to another door
					case 'copy':
						$from = isset( $args->from ) ? $args->from : ( isset( $args->args->from ) ? $args->args->from : false );
						$to   = isset( $args->to )   ? $args->to   : ( isset( $args->args->to )   ? $args->args->to   : false );
						if( isset( $from ) && isset( $to ) )
						{
							//$Logger->log( 'Trying from ' . $from . ' to ' . $to );
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
		
		/**
		 * @brief Gets a file by path!
		 *
		 * @param $path a Friend DOS path
		 * @return a dbIO file object or false
		 */
		public function getFile( $path )
		{
			global $User, $Logger;
		
			// Remove file from path
			$subPath = explode( '/', end( explode( ':', $path ) ) );
			array_pop( $subPath );
			$subPath = implode( '/', $subPath ) . '/';
		
			/*$Logger->log( 'Trying to get file.. ------------------->' );
			$Logger->log( 'Path was: ' . $path );
			$Logger->log( 'Sub path is therefore: ' . $subPath );*/
		
			$fo = $this->getSubFolder( $subPath );
			$fi = new dbIO( 'FSFile' );
			$fi->UserID = $User->ID;
			$fi->FilesystemID = $this->ID;
			$fi->FolderID = $fo ? $fo->ID : '0';
			if( strstr( $path, '/' ) )
				$fi->Filename = end( explode( '/', $path ) );
			else $fi->Filename = end( explode( ':', $path ) );
		
			if( $fi->Load() )
			{
				$fobject = new Object();
				$fobject->Path = end( explode( ':', $path ) );
				$fobject->Filename = $fi->Filename;
				$fobject->Filesize = $fi->Filesize;
				$fobject->Type = 'SQLDrive';
				$fobject->FileInfo = $fi;
				$fobject->Permissions = $fi->Permissions;
				$fobject->Door = $this;
				return $fobject;
			}
			return false;
		}
		
		/**
		 * @brief Will open and return a file pointer set with options
		 * 
		 * @param $path Friend DOS path
		 * @param $mode is 'r', 'rw', 'rs'
		 * @return false or file object
		*/
		public function openFile( $path, $mode )
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
				$fi->Filename = end( explode( '/', $path ) );
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
		
		/**
		 * @brief Close file pointer!
		 *
		 * @param $filePointer a file object
		 * @return string or false
		**/
		public function closeFile( $filePointer )
		{
			$filePointer->offset = 0;
			$filePointer->tmpPath = NULL;
			$filePointer->mode = NULL;
			return false;
		}
		
		/**
		 * @brief Will read from file pointer x bytes
		 *
		 * @param $fp file object
		 * @param $bytes number of bytes to read
		 * return string or null
		**/
		public function readFile( $fp, $bytes )
		{
			if( !isset( $fp->offset ) || !isset( $fp->mode ) || !file_exists( $fp->tmpPath ) )
				return NULL;
			
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
	
		/**
		 * @brief Will write to pointer, data, x bytes
		 *
		 * @param $filePointer file object
		 * @param $data string/binary data
		 * @param $bytes how many bytes to write
		 * 
		 * @return value is number of bytes written
		*/
		public function writeFile( $filePointer, $data, $bytes )
		{
			if( !isset( $fp->offset ) || !isset( $fp->mode ) || !file_exists( $fp->tmpPath ) )
				return NULL;
			
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
	
		/**
		 * @brief Put a file into a path
		 * 
		 * @param $path a Friend DOS path
		 * @param $fileObject a file object
		 *
		 * @return value is true or false
		*/
		public function putFile( $path, $fileObject )
		{
			global $Config, $User, $Logger;
			
			// Sanitized username
			$uname = str_replace( array( '..', '/', ' ' ), '_', $User->Name );
			
			if( $tmp = $fileObject->Door->getTmpFile( $fileObject->Path ) )
			{
				// Remove file from path
				$subPath = explode( '/', end( explode( ':', $path ) ) );
				array_pop( $subPath );
				$subPath = implode( '/', $subPath ) . '/';
		
				$fo = $this->getSubFolder( $subPath );
		
				$fi = new dbIO( 'FSFile' );
				$fi->UserID = $User->ID;
				$fi->FilesystemID = $this->ID;
				$fi->FolderID = $fo ? $fo->ID : '0';
				$fi->Filename = $fileObject->Filename;
		
				// Unique filename
				$ext = end( explode( '.', $fi->Filename ) );
				$fname = substr( $fi->Filename, 0, strlen( $fi->Filename ) - ( strlen( $ext ) + 1 ) );
				$filename = $fname . '.' . $ext;		
				while( file_exists( $Config->FCUpload . $uname . '/' . $filename ) )
					$filename = $fname . rand(0,999) . '.' . $ext;
				$fi->DiskFilename = $uname . '/' . $filename;
			
				// Do the copy
				copy( $tmp, $Config->FCUpload . $fi->DiskFilename );
			
				// Remove tmp file
				unlink( $tmp );
			
				$fi->Permissions = $fileObject->Permissions;
				$fi->Filesize = filesize( $Config->FCUpload . $fi->DiskFilename );
			
				$fi->Save();
			
				return true;
			}
		
			return false;
		}
	
		/**
		 * @brief Create a folder
		 *
		 * @param $folderName name of directory
		 * @param $where Friend DOS path
		 *
		 * @return true false
		**/
		public function createFolder( $folderName, $where )
		{
			global $Config, $User, $Logger;

			// New folder		
			$nfo = new DbIO( 'FSFolder' );
			$nfo->UserID = $User->ID;
			$nfo->FilesystemID = $this->ID;
		
			// Remove file from path
			$subFolder = $where;
			if( strstr( $subFolder, ':' ) )
				$subFolder = end( explode( ':', $subFolder ) );
			if( substr( $subFolder, -1, 1 ) == '/' )
				$subFolder = substr( $subFolder, 0, strlen( $subFolder ) - 1 );
			if( strstr( $subFolder, '/' ) )
			{
				$subFolder = explode( '/', $subFolder );
				array_pop( $subFolder );
				$subFolder = implode( '/', $subFolder ) . '/';
			}
		
			if( $fo = $this->getSubFolder( $subFolder ) )
			{
				$nfo->FolderID = $fo->ID;
			}
			else
			{
				$nfo->FolderID = '0';
			}
		
			// Get the correct name
			$nfo->Name = $folderName;
		
			// Save
			$nfo->Save();
		
			// Check save result
			if( $nfo->ID > 0 )
				return true;
			return false;
		}
	
		/**
		 * @brief Deletes a folder, all sub folders and files (optionally)
		 *
		 * @param $path Path do directory
		 * @param $recursive do a recursive deletion or not
		 *
		 * @return value true false
		*/
		public function deleteFolder( $path, $recursive = true )
		{
			global $Config, $User, $Logger;

			// By ID
			$Logger->log( '[SQLDRIVE] Deleting folder ' . $path );
			if( preg_match( '/.*?\#\?([0-9]+)/i', $path, $m ) )
			{
				$Logger->log( '[SQLDRIVE] > Trying by ID ' . $m[1] );
				$fo = new dbIO( 'FSFolder' );
				if( $fo->Load( $m[1] ) )
				{
					// Security - make sure it's the right fs!
					if( $fo->FilesystemID != $this->ID ) return false;
					return $this->_deleteFolder( $fo, $recursive );
				}
				return false;
			}
			
			// Remove disk from path name to get sub folder
			$subPath = explode( ':', $path );
			$subPath = end( $subPath );
			
			$Logger->log( '[SQLDRIVE] > Deleting folder by subfolder: ' . $subPath );
	
			if( $fo = $this->getSubFolder( $subPath ) )
			{
				$Logger->log( '[SQLDRIVE] > > Delete folder in subpath ' . $subPath . ' in fs ' . $this->Name . ': ---' );
				return $this->_deleteFolder( $fo, $recursive );
			}
			
			$Logger->log( '[SQLDRIVE] > Could not delete.' );
		
			return false;
		}
	
		/**
		 * @brief Delete a file
		 *
		 * @param $path FriendDOS path string
		 * @param $recursive delete recursively
		 *
		 * @return true or false
		*/
		public function deleteFile( $path, $recursive = false )
		{
			global $Config, $User, $Logger;
		
			// If it's a folder
			if( substr( $path, -1, 1 ) == '/' )
			{
				$Logger->log( '[SQLDRIVE] Deleting a folder.' );
				return $this->deleteFolder( $path, $recursive );
			}
		
			$fi = $this->getFileByPath( $path );
		
			$Logger->log( '[SQLDRIVE] Found deletable file. ' . $fi->ID );
		
			$fileExists = false;
			if( $fi->ID > 0 )
			{
				if( file_exists( $Config->FCUpload . $fi->DiskFilename ) )
				{
					$Logger->log( '[SQLDRIVE] Deleting physical file.' );
					$fileExists = true;
					unlink( $Config->FCUpload . $fi->DiskFilename );
				}
				$Logger->log( '[SQLDRIVE] Deleting file entry.' );
				$fi->Delete();
			}
			return $fileExists;
		}
		
		// Private functions
		
		/**
		 * Gets a file by FriendUP path
		 * @param path the FriendUP full path
		 */ 
		private function getFileByPath( $path )
		{
			global $Config, $User, $Logger;
			$fi = new dbIO( 'FSFile' );
			
			// Check if the id is given
			if( preg_match( '/.*?\#\?([0-9]+)/i', $path, $m ) )
			{
				$fi->Load( $m[1] );
			}
			else
			{
				// Remove file from path
				$subPath = explode( ':', $path );
				$subPath = end( $subPath );
				$subPath = explode( '/', $subPath );
				array_pop( $subPath );
				$subPath = implode( '/', $subPath ) . '/';
	
				$fo = $this->getSubFolder( $subPath );
		
				$fi = new dbIO( 'FSFile' );
				$fi->UserID = $User->ID;
				$fi->FilesystemID = $this->ID;
				$fi->FolderID = $fo ? $fo->ID : '0';
				if( strstr( $path, '/' ) )
					$fi->Filename = end( explode( '/', $path ) );
				else $fi->Filename = end( explode( ':', $path ) );
				$fi->Filename = str_replace( "'", "\\'", $fi->Filename );
				$fi->Load();
			}
			
			// Security measure! In case we loaded somebody elses file
			if( $fi->FilesystemID != $this->ID ) return false;
			
			return $fi;
		}
		
		/**
		 * @brief Gets the subfolder by path on this filesystem door
		 * Path should be like this: SomePath:Here/ or Here/ (relating to Filesystem in $this)
		 *
		 * @param $subPath subpath to directory
		 * @return the dbIO directory object or false on fail
		*/
		private function getSubFolder( $subPath )
		{
			global $Logger, $SqlDatabase;
			
			//$inputPath = $subPath;
			
			if( $subPath == '/' ) return false;
			
			//$Logger->log( 'Ok, we have subpath: ' . print_r( $subPath, 1 ) );
			
			$fo = false;
			// If we got a filename, strip the last joint
			if( strstr( $subPath, ':' ) )
			{
				list( , $subPath ) = explode( ':', $subPath );
			}
		
			// Watch out for wrong formatting! (just for validation)
			if( substr( $subPath, -1, 1 ) != '/' )
				return false;
			
			// But we don't need the trailing slash here
			$subPath = substr( $subPath, 0, strlen( $subPath ) - 1 );
		
			// Get all parts
			$finalPath = explode( '/', $subPath );
	
			$fo = false;
			$parID = '0';
			$pfo = false;
			
			while( count( $finalPath ) > 0 )
			{
				//$Logger->log('We do now check this path: ' . implode( '/', $finalPath ) . ' with Parent Folder ID of ' . $parID );
				if( $fo ) $pfo = $fo; // Previous folder
				$do = $SqlDatabase->FetchObject( '
					SELECT * FROM `FSFolder` 
					WHERE 
						`FilesystemID`=\'' . $this->ID . '\' AND 
						`Name`=\'' . str_replace( "'", "\\'", $finalPath[0] ) . '\' AND 
						`FolderID`=\'' . $parID . '\'' );
				if( $do && $do->ID > 0 )
				{
					// Create a usable object
					$fo = new DbIO( 'FSFolder' );
					$fo->SetFromObject( $do );
					
					// New array
					$out = [];
					$ac = count( $finalPath );
					for( $a = 1; $a < $ac; $a++ )
						$out[] = $finalPath[$a];
					$finalPath = $out;
					$parID = $fo->ID;
				}
				else
				{
					// If this last joint might be a file, return parent id
					//$Logger->log('Not a real folder "' . $finalPath[0] . '"? -> COULD NOT LOAD SQLDrive Folder // FilesystemID: ' . $fo->FilesystemID .  ' // FolderID ' . $fo->FolderID . ' // Name ' . $fo->Name );
					
					return false;
				}
				//$Logger->log('Our current folder ID is '. $fo->ID);
			} 
			//$Logger->log('We return the folder ID ' . $fo->ID . ' for the original input ' . $inputPath );
			return $fo;
		}
		
		// Get the location of a tmp file
		private function getTmpFile( $path )
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
				$fi->Filename = end( explode( '/', $path ) );
			else $fi->Filename = end( explode( ':', $path ) );
		
			if( $fi->Load() )
			{
				if( file_exists( $Config->FCUpload . $fi->DiskFilename ) )
				{
					if( strstr( $fi->DiskFilename, '/' ) )
					{
						$diskFilename = explode( '/', $fi->DiskFilename );
						$diskFilename = $diskFilename[ count( $diskFilename ) - 1 ];
					}
					else
					{
						$diskFilename = $fi->DiskFilename;
					}
					$ext = end( explode( '.', $diskFilename ) );
					$fname = substr( $fi->Filename, 0, strlen( $fi->Filename ) - ( strlen( $ext ) + 1 ) );
					$filename = $fname . '.' . $ext;
					while( file_exists( $Config->FCTmp . $filename ) )
						$filename = $fname . rand( 0, 999 ) . '.' . $ext;
					// Make tmp file
					copy( $Config->FCUpload . $fi->DiskFilename, $Config->FCTmp . $filename );
					return $Config->FCTmp . $filename;
				}
			}
			return false;
		}
		
		// Not to be used outside! Not public!
		private function _deleteFolder( $fo, $recursive = true )
		{
			global $Config, $User, $Logger;
		
			// Also delete all sub folders!
			if( $recursive )
			{
				$fop = new dbIO( 'FSFolder' );
				$fop->UserID = $User->ID;
				$fop->FilesystemID = $this->ID;
				$fop->FolderID = $fo->ID;
				if( $fop = $fop->find() )
				{
					foreach( $fop as $fopp )
					{
						//$Logger->log( 'Attempting to delete sub folder -> ' . $fopp->Name . '/ (' . $fopp->ID . ')' );
						$this->_deleteFolder( $fopp, $recursive );
					}
				}
			}
			
			// Also delete all files!
			$fi = new dbIO( 'FSFile' );
			$fi->UserID = $User->ID;
			$fi->FilesystemID = $this->ID;
			$fi->FolderID = $fo->ID;
			if( $files = $fi->find() )
			{
				foreach( $files as $file )
				{
					//$Logger->log( 'Attempting to delete file ' . $file->Filename . ' in ' . $fo->Name . '/ (' . $fo->ID . ')' );
					if( file_exists( $Config->FCUpload . $fi->DiskFilename ) )
					{
						unlink( $Config->FCUpload . $file->DiskFilename );
					}
					$file->Delete();
				}
			}
			$Logger->log( 'Deleting database entry of folder ' . $fo->Name . '/ (' . $fo->ID . ')' );
			$fo->Delete();
			return true;
		}
	}
}

// Create a door...
$door = new DoorSQLDrive( isset( $path ) ? $path : ( ( isset( $args ) && isset( $args->args ) && $args->args->path ) ? $args->args->path : false ) );

?>
