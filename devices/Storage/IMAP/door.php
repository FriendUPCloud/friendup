<?php


?><?php

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

define( 'IMAP_FILE_LIMIT', 0 );

if( !class_exists( 'DoorIMAP' ) )
{
	class DoorIMAP extends Door
	{	
		/**
		 * Constructor
		*/
		function onConstruct()
		{
			global $args, $Logger;
		}
		
		// Public functions ----------------------------------------------------
		
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
				$path = explode( ':', $path );
				if( count( $path ) > 2 )
				{
					$args->path = $path[1] . ':' . $path[2];
				}
				else
				{
					$args->path = implode( ':', $path );
				}
				
				$path = $args->path;
				
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
				$fo = false;
			
				// Can we get sub folder?
				$thePath = isset( $args->path ) ? $args->path : ( isset( $args->args->path ) ? $args->args->path : '' );
				if( isset( $thePath ) && strlen( $thePath ) > 0 && $subPath = trim( end( explode( ':', $thePath ) ) ) )
				{
					$fo = $this->getSubFolder( $subPath );
				
					// Failed to find a path
					if( !$fo ) die( 'fail<!--separate-->Path error.' );
				}
	
				if( $mb = $this->connect() )
				{
					// Fetch directory listing
				
					$root = '{' . $this->Server . ':' . $this->Port . '}';
					$folders = imap_listmailbox( $mb, $root, '*' );
				
					$entries = [];
				
					foreach( $folders as $fld )
					{
						$Logger->log( print_r( $fld, 1 ) );
						$n = str_replace( $root, '', $fld );
						if( strstr( $n, '/' ) ) continue;
						$o = new stdClass();
						$o->Name = $n;
						$o->Type = 'Directory';
						$o->MetaType = 'Directory';
						$o->Permissions = '-r-e--r-e--r-e-';
						$o->DateModified = date( 'Y-m-d H:i:s' );
						$o->DateCreated = date( 'Y-m-d H:i:s' );
						$o->Path = $n;
						$entries[] = $o;
					}
					
					if( count( $entries ) )
					{	
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
							$pth = explode( ':', $thePath . $o->Filename . ( $o->Type == 'Directory' ? '/' : '' ) ); 
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
				return 'fail';
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
				$fname = end( explode( ':', $args->path ) );
				$fname = end( explode( '/', $fname ) );
				$f->Filename = $fname;
				$f->UserID = $User->ID;
				$f->FolderID = '0';
				
				// Can we get sub folder?
				$fo = false;
				
				$args->path = str_replace( ':/', ':', $args->path );
				
				if( isset( $args->path ) && $subPath = trim( end( explode( ':', $args->path ) ) ) )
				{
					// Remove filename
					if( substr( $subPath, -1, 1 ) != '/' && strstr( $subPath, '/' ) )
					{
						$subPath = explode( '/', $subPath );
						array_pop( $subPath );
						$subPath = implode( '/', $subPath ) . '/';
					}
					
					//$Logger->log( 'We will try to find the folder ID for this path now ' . $subPath );
					if( $fo = $this->getSubFolder( $subPath ) )
					{
						$f->FolderID = $fo->ID;	
					}
				}
				
				// Overwrite existing and catch object
				if( $f->Load() )
				{
					$deletable = $Config->FCUpload . $f->DiskFilename;
					//$Logger->log( 'Yay, overwriting existing file -> ' . $f->DiskFilename . '!: ' . $f->FolderID );
					$fn = $f->DiskFilename;
				}
				else
				{
					$fn = $f->Filename;
					$f->DiskFilename = '';
				}
	
				// Write the file
				
				// The file is new, make sure we don't overwrite any existing file
				if( $f->ID <= 0 )
				{
					$ofn = $fn;
					$fna = end( explode( '.', $ofn ) );
					while( file_exists( $Config->FCUpload . $fn ) )
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
				if( $file = fopen( $Config->FCUpload . $fn, 'w+' ) )
				{
					// Delete existing file
					if( $deletable ) unlink( $deletable );
					
					if( isset( $args->tmpfile ) )
					{
						if( file_exists( $args->tmpfile ) )
						{
							fclose( $file );
							$len = filesize( $args->tmpfile );
							
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
							
							if( $total + $len < IMAP_FILE_LIMIT )
							{
								rename( $args->tmpfile, $Config->FCUpload . $fn );
							}
							else
							{
								//$Logger->log( 'Write: Limit broken' );
								die( 'fail<!--separate-->Limit broken' );
							}
						}
						else
						{
							//$Logger->log( 'Write: Tempfile does not exist.' );
							die( 'fail<!--separate-->Tempfile does not exist!' );
						}
					}
					else
					{
						if( $total + strlen( $args->data ) < IMAP_FILE_LIMIT )
						{
							$len = fwrite( $file, $args->data );
							fclose( $file );
						}
						else
						{
							fclose( $file );
							//$Logger->log( 'Write: Limit broken' );
							die( 'fail<!--separate-->Limit broken' );
						}
					}
					
					$f->DiskFilename = $fn;
					$f->Filesize = filesize( getcwd() . '/' . $Config->FCUpload . $fn );
					if( !$f->DateCreated ) $f->DateCreated = date( 'Y-m-d H:i:s' );
					$f->DateModified = date( 'Y-m-d H:i:s' );
					$f->Save();
					//$Logger->log( 'Write: wrote new file with id: ' . $f->ID );
					return 'ok<!--separate-->' . $len . '<!--separate-->' . $f->ID;
				}
				//$Logger->log( 'Write: could not write file..' );
				return 'fail<!--separate-->Could not write file: ' . $Config->FCUpload . $fn;
			}
			else if( $args->command == 'read' )
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
						if( !$mime && $ext = end( explode( '.', $fname ) ) )
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
							if( $df = fopen( $fname, 'r' ) )
							{
								$buffer = 64000;
								while( $str = fread( $df, $buffer ) )
								{
									echo( $str );
								}
								fclose( $df );
								die();
							}
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
					
						while( file_exists( $Config->FCUpload . $filename ) )
							$filename = $fname . rand(0,999) . '.' . $ext;
					
						$fl->DiskFilename = $filename;
					
						copy( 'import/' . $f, $Config->FCUpload . $filename );
						if( file_exists( $Config->FCUpload . $filename ) )
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
								unlink( $Config->FCUpload . $filename );
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
				
				die( 'fail' );
			}
			else if( $args->command == 'dosaction' )
			{
				$action = isset( $args->action ) ? $args->action : ( isset( $args->args->action ) ? $args->args->action : false );
				$path   = $args->path;
				switch( $action )
				{
					// Test password to mount
					case 'mount':
						if( $this->connect() )
						{
							die( 'ok' );
						}
						die( 'fail<--separate-->{"response":"Failed to connect to IMAP server."}' );
					// Always succeed - simple disconnect
					case 'unmount':
						die( 'ok' );
					case 'rename':
						ob_clean();
						// Is it a folder?
						if( substr( $path, -1, 1 ) == '/' )
						{
							$Logger->log( '[Rename] Trying to find: ' . $path );
							$sp = $this->getSubFolder( $path );
							if( $sp )
							{
								$sp->Name = $args->newname;
								$sp->Save();
								die( 'ok<!--separate-->Renamed the folder.' );
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
									$f->Filename = $args->newname;
									$f->Save();
									die( 'ok<!--separate-->Renamed the file.' );
								}
							}
						}
						die( 'fail<!--separate-->Could not find file!' );
						break;
					case 'makedir':
						
						// Add trailing '/'
						if( substr( $path, -1, 1 ) != '/' && substr( $path, -1, 1 ) != ':' )
							$path .= '/';
							
						if( $path )
						{
							$f = new DbIO( 'FSFolder' );
		
							// Get by path (subfolder)
							$subPath = false;
							if( is_string( $path ) && strstr( $path, ':' ) )
								$subPath = end( explode( ':', $path ) );
						
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
				
							// Do it
							$name = end( explode( ':', $path ) );
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
									die( 'fail<!--separate-->Directory already exists.' );
								}
								$f->DateModified = date( 'Y-m-d H:i:s' );
								$f->DateCreated = $f->DateModified;
								$f->Save();
								//$Logger->log( 'Made directory ' . $f->Name . ' (in ' . $path . ') id ' . $f->ID );
								return 'ok<!--separate-->' . $f->ID;
							}
						}
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
						//$Logger->log( "Attempting to copy from $from to $to.." );
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
				$fobject->Type = 'IMAP';
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
			global $Config, $User;
		
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
				while( file_exists( $Config->FCUpload . $filename ) )
					$filename = $fname . rand(0,999) . '.' . $ext;
				$fi->DiskFilename = $filename;
			
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
			if( preg_match( '/.*?\#\?([0-9]+)/i', $path, $m ) )
			{
				$fo = new dbIO( 'FSFolder' );
				if( $fo->Load( $m[1] ) )
				{
					// Security - make sure it's the right fs!
					if( $fo->FilesystemID != $this->ID ) return false;
					return $this->_deleteFolder( $fo, $recursive );
				}
				return false;
			}
			
			// Remove file from path
			$subPath = explode( '/', end( explode( ':', $path ) ) );
			array_pop( $subPath );
			$subPath = implode( '/', $subPath ) . '/';
	
			if( $fo = $this->getSubFolder( $subPath ) )
			{
				//$Logger->log( 'Delete folder in subpath ' . $subPath . ' in fs ' . $this->Name . ': ---' );
				return $this->_deleteFolder( $fo, $recursive );
			}
		
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
				return $this->deleteFolder( $path, $recursive );
		
			$fi = $this->getFileByPath( $path );
		
			if( $fi->ID > 0 )
			{
				if( file_exists( $Config->FCUpload . $fi->DiskFilename ) )
				{
					//$Logger->log( 'Deleting file in folder ' . ( $fo ? $fo->Name : '' ) . '/ (' . $fi->FolderID . ')' );
					unlink( $Config->FCUpload . $fi->DiskFilename );
					$fi->Delete();
					return true;
				}
				else 
				{
					//$Logger->log( 'Deleting db only (corrupt) file in folder ' . $fi->Name . '/ (' . $fi->FolderID . ')' );
					$fi->Delete();
				}
			}
			return false;
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
				$subPath = explode( '/', end( explode( ':', $path ) ) );
				array_pop( $subPath );
				$subPath = implode( '/', $subPath ) . '/';
	
				$fo = $this->getSubFolder( $subPath );
		
				$fi->UserID = $User->ID;
				$fi->FilesystemID = $this->ID;
				$fi->FolderID = $fo ? $fo->ID : '0';
				if( strstr( $path, '/' ) )
					$fi->Filename = end( explode( '/', $path ) );
				else $fi->Filename = end( explode( ':', $path ) );
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
						`Name`=\'' . $finalPath[0] . '\' AND 
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
					//$Logger->log('Not a real folder "' . $finalPath[0] . '"? -> COULD NOT LOAD IMAP Folder // FilesystemID: ' . $fo->FilesystemID .  ' // FolderID ' . $fo->FolderID . ' // Name ' . $fo->Name );
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
					$ext = end( explode( '.', $fi->DiskFilename ) );
					$fname = substr( $fi->Filename, 0, strlen( $fi->Filename ) - ( strlen( $ext ) + 1 ) );
					$filename = $fname . '.' . $ext;		
					while( file_exists( $Config->FCTmp . $filename ) )
						$filename = $fname . rand(0,999) . '.' . $ext;
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
			//$Logger->log( 'Deleting database entry of folder ' . $fo->Name . '/ (' . $fo->ID . ')' );
			$fo->Delete();
			return true;
		}
		
		// Connect to imap
		function connect()
		{
			$mbox = imap_open( 
				'{' . $this->Server . ':' . $this->Port . '/imap/ssl/novalidate-cert}INBOX', 
				$this->Username, $this->Password );
			return $mbox;
		}
	}
}

// Create a door...
if( isset( $args->devname ) )
	$door = new DoorIMAP( $args->devname );
// TODO: This will pass
else $door = new DoorIMAP( isset( $path ) ? $path : ( ( isset( $args ) && isset( $args->args ) && $args->args->path ) ? $args->args->path : false ) );

?>
