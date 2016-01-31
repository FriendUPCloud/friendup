<?php

/*******************************************************************************
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
*******************************************************************************/

global $args, $SqlDatabase, $User, $Config;

include_once( 'php/classes/door.php' );

if( !defined( 'SQLDRIVE_FILE_LIMIT' ) )
{
	// 500 megabytes
	define( 'SQLDRIVE_FILE_LIMIT', 524288000 );
}

if( !class_exists( 'DoorSQLDrive' ) )
{
	class DoorSQLDrive extends Door
	{	
		function onConstruct()
		{
			global $args;
			$this->fileInfo = isset( $args->fileInfo ) ? $args->fileInfo : new stdClass();
			
		}

		// Gets the subfolder by path on this filesystem door
		// Path should be like this: SomePath:Here/ or Here/ (relating to Filesystem in $this)
		function getSubFolder( $subPath )
		{
			global $Logger;
			
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
	
			//$Logger->log( 'We found final path: ' . implode( '/', $finalPath ) );
	
			$parID = '0';
			while( count( $finalPath ) > 0 )
			{
				//$Logger->log('We do now check this path: ' . implode( '/', $finalPath ) . ' with Parent Folder ID of ' . $parID );
				$fo = new dbIO( 'FSFolder' );
				$fo->FilesystemID = $this->ID;
				$fo->Name = $finalPath[0];
				$fo->FolderID = $parID;
				if( $fo->Load() )
				{
					$out = [];
					for( $a = 1; $a < count( $finalPath ); $a++ )
					{
						$out[] = $finalPath[$a];
					}
					$finalPath = $out;
					$parID = $fo->ID;
				}
				else
				{
					$Logger->log('#### COULD NOT LOAD SQLDrive Folder // FilesystemID: ' . $fo->FilesystemID .  ' // FolderID ' . $fo->FolderID . ' // Name ' . $fo->Name );
					return false;
				}
				//$Logger->log('Our current folder ID is '. $fo->ID);
			} 
			//$Logger->log('We return the folder ID ' . $fo->ID . ' for the original input ' . $inputPath );
			return $fo;
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
				$fo = false;
			
				// Can we get sub folder?
				$thePath = isset( $args->path ) ? $args->path : ( isset( $args->args->path ) ? $args->args->path : '' );
				if( isset( $thePath ) && strlen( $thePath ) > 0 && $subPath = trim( end( explode( ':', $thePath ) ) ) )
				{
					$fo = $this->getSubFolder( $subPath );
				
					// Failed to find a path
					if( !$fo ) die( 'fail<!--separate-->Path error.' );
				}
	
				$out = [];
				if( $entries = $SqlDatabase->FetchObjects( $q = '
					SELECT * FROM
					(
						(
							SELECT "Directory" AS `Type`, ID, `Name`, Permissions, DateModified, DateCreated, "0" AS Filesize FROM FSFolder
							WHERE FilesystemID=\'' . $this->ID . '\' AND UserID=\'' . $User->ID . '\' AND FolderID=\'' . ( $fo ? $fo->ID : '' ) . '\'
						)
						UNION
						(
							SELECT "File" AS `Type`, ID, Filename AS `Name`, Permissions, DateModified, DateCreated, Filesize FROM FSFile
							WHERE FilesystemID=\'' . $this->ID . '\' AND UserID=\'' . $User->ID . '\' AND FolderID=\'' . ( $fo ? $fo->ID : '' ) . '\'
						)
					) z
					ORDER BY `Name` ASC
				' ) )
				{
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
						$o->Path = $thePath . $o->Filename . ( $o->Type == 'Directory' ? '/' : '' );
						$out[] = $o;
					}
					return 'ok<!--separate-->' . json_encode( $out );
				}
				// No entries
				return 'ok<!--separate-->[]';
			}
			else if( $args->command == 'write' )
			{
				// We need to check how much is in our database first
				$deletable = false;
				$total = 0;
				if( $sum = $SqlDatabase->FetchObject( 'SELECT SUM(u.Filesize) z FROM FSFile u WHERE u.UserID=\'' . $User->ID . '\' AND FilesystemID = \'' . $this->ID . '\'' ) )
					$total = $sum->z;
				
				$Logger->log( 'starting to write... ' . $args->path );
				
				// Create a file object
				$f = new dbIO( 'FSFile' );
				$f->FilesystemID = $this->ID;
				$f->DiskFilename = '';
				$fname = end( explode( ':', $args->path ) );
				$fname = end( explode( '/', $fname ) );
				$f->Filename = $fname;
				$f->UserID = $User->ID;
				$f->FolderID = '0';
				
	
				// Can we get sub folder?
				$fo = false;
				if( isset( $args->path ) && $subPath = trim( end( explode( ':', $args->path ) ) ) )
				{
					//$Logger->log( 'Trying to find existing file in path -> ' . $subPath . ' (' . $args->path . ')' );
					
					// Remove filename
					if( substr( $subPath, -1, 1 ) != '/' && strstr( $subPath, '/' ) )
					{
						$subPath = explode( '/', $subPath );
						array_pop( $subPath );
						$subPath = implode( '/', $subPath ) . '/';
					}
					
					$Logger->log('We will try to find the folder ID for this path now ' . $subPath );
					if( $fo = $this->getSubFolder( $subPath ) )
					{
						//$Logger->log( 'We found folder wth ID '. $fo->ID .' in ' . $subPath . ' (' . $args->path . ')' );
						$f->FolderID = $fo->ID;	
					}
					//$Logger->log( 'Tried to find folderid ' . $f->FolderID . ' from ' . ( $fo ? $fo->Name : 'root folder' ) . ' (' . $args->path . ')' );
				}
				
				// Overwrite existing and catch object
				if( $f->Load() )
				{
					$deletable = $Config->FCUpload . $f->DiskFilename;
					$Logger->log( 'Yay, overwriting existing file -> ' . $f->DiskFilename . '!: ' . $f->FolderID );
				}
	
				// Write the file
				$fn = $f->Filename;
				if( $f->ID <= 0 )
				{
					while( file_exists( $Config->FCUpload . $fn ) ){ $fn .= rand( 0, 99999 ); }
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
							
							if( $total + $len < SQLDRIVE_FILE_LIMIT )
							{
								rename( $args->tmpfile, $Config->FCUpload . $fn );
							}
							else
							{
								$Logger->log( 'Write: Limit broken' );
								die( 'fail<!--separate-->Limit broken' );
							}
						}
						else
						{
							$Logger->log( 'Write: Tempfile does not exist.' );
							die( 'fail<!--separate-->Tempfile does not exist!' );
						}
					}
					else
					{
						if( $total + strlen( $args->data ) < SQLDRIVE_FILE_LIMIT )
						{
							$len = fwrite( $file, $args->data );
							fclose( $file );
						}
						else
						{
							fclose( $file );
							$Logger->log( 'Write: Limit broken' );
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
				$Logger->log( 'Write: could not write file..' );
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
				$f->UserID = $User->ID;
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
					if( file_exists( $fname ) && $data = file_get_contents( $fname ) )
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
						if( isset( $args->mode ) && $args->mode == "rb" )
						{
							return $data;
						}
					
						// Return ok
						$okRet = 'ok<!--separate-->';
					
						if( isset( $info[0] ) && $info[0] > 0 && $info[1] > 0 )
						{
							friendHeader( 'Content-Length: ' . filesize( $fname ) + strlen( $okRet ) );
							return $okRet . base64_encode( $data );
						}
					
						friendHeader( 'Content-Length: ' . filesize( $fname ) + strlen( $okRet ) );
						return $okRet . trim( $data );
					}
				}
				return 'fail<!--separate-->Could not read file: ' . $Config->FCUpload . $fn;
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
			else if( $args->command == 'loaddocumentformat' )
			{
				// Loads a document depending on format				
				$path = $args->path;
				if( $f = $this->getFile( $path ) )
				{
					// TODO: Atomic file locking!!
					$fna = $f->FileInfo->DiskFilename;
					$lastExt = explode( '.', $fna ); $lastExt = $lastExt[count($lastExt)-1];
					$outFile = substr( $fna, 0, strlen( $fna ) - strlen( $lastExt ) - 1 ) . '.html';
					if( $output = exec( $foo = ( 'libreoffice -env:UserInstallation=file:///tmp --headless --convert-to html \'' . 
						getcwd() . '/' . $Config->FCUpload . $f->FileInfo->DiskFilename . '\' --outdir /tmp/' ) ) )
					{
						if( $outData = file_get_contents( '/tmp/' . $outFile ) )
						{
							unlink( '/tmp/' . $outFile );
							die( 'ok<!--separate-->' . $outData );
						}
						die( 'fail<!--separate-->Could not convert file ' . $outFile );
					}
					die( 'fail<!--separate-->' );
				}
				die( 'fail<!--separate-->No temp file for ' . $path );
			}
			else if( $args->command == 'gendocumentpdf' )
			{
				$path = $args->path;
				if( $f = $this->getFile( $path ) )
				{
					$fi = $f->FileInfo;
					
					// TODO: Atomic file locking!!
					$outFile = 'print_' . $User->ID . '.html';
					$outPDF  = 'print_' . $User->ID . '.pdf';
				
					// Write temporary html file
					if( $fl = fopen( '/tmp/' . $outFile, 'w+' ) )
					{
						fwrite( $fl, $args->args->data );
						fclose( $fl );
					}
					else die( 'fail<!--separate-->Error writing temporary file.' );
				
					if( $output = exec( $foo = ( 'libreoffice -env:UserInstallation=file:///tmp --headless --convert-to pdf \'' . 
						'/tmp/' . $outFile . '\' --outdir /tmp/' ) ) )
					{
						if( file_exists( '/tmp/' . $outPDF ) )
						{
							$ext = 'pdf';
							$fex = end( explode( '.', $fi->Filename ) );
							$fname = substr( $fi->Filename, 0, strlen( $fi->Filename ) - ( strlen( $fex ) + 1 ) );
							$filename = $fname . '.pdf';		
							while( file_exists( $Config->FCUpload . $filename ) )
								$filename = $fname . rand(0,999) . '.' . $ext;
							
							$l = new dbIO( 'FSFile' );
							$l->FilesystemID = $fi->FilesystemID;
							$l->UserID = $fi->UserID;
							$l->FolderID = $fi->FolderID;
							$l->Filename = $fname . '.pdf';
							// Try to update it, if not, it's new
							if( !$l->Load() ) $l->DiskFilename = $filename;
							// Move in the file
							rename( '/tmp/' . $outPDF, $Config->FCUpload . $l->DiskFilename ); // <- clean up
							// Rest..
							$l->Filesize = filesize( $Config->FCUpload . $l->DiskFilename );
							$l->DateCreated = date( 'Y-m-d H:i:s' );
							$l->DateModified = $l->DateCreated;
							$l->Save();
							
							$newPath = explode( ':', $path ); 
							$newPath = $newPath[1];
							
							if( strstr( $newPath, '/' ) )
							{
								$newPath = explode( '/', $newPath );
								$newPath = $newPath[count($newPath)-1];
							}
							$newPath = substr( $path, 0, strlen( $path ) - strlen( $newPath ) ) . $l->Filename;
							
							unlink( '/tmp/' . $outFile ); // <- clean up
							
							die( 'ok<!--separate-->' . $newPath );
						}
						die( 'fail<!--separate-->Could not convert file ' . $outPDF );
					}
					die( 'fail<!--separate-->' );
				}
				die( 'fail<!--separate-->Could not find file.' );
			}
			else if( $args->command == 'writedocumentformat' )
			{
				// Loads a document depending on format				
				$path = $args->path;
				if( $f = $this->getFile( $path ) )
				{
					// TODO: Atomic file locking!!
					$fna = $f->FileInfo->DiskFilename;
										
					$lastExt = end( explode( '.', $fna ) );
					$outFile = substr( $fna, 0, strlen( $fna ) - strlen( $lastExt ) - 1 ) . '.html';
					
					// Write temporary html file
					if( $fl = fopen( '/tmp/' . $outFile, 'w+' ) )
					{
						fwrite( $fl, $args->args->data );
						fclose( $fl );
					}
					else die( 'fail<!--separate-->Error writing temporary file.' );
					
					if( $output = exec( $foo = ( 'libreoffice -env:UserInstallation=file:///tmp --headless --convert-to ' . $lastExt . ' \'' . 
						'/tmp/' . $outFile . '\' --outdir /tmp/' ) ) )
					{
						if( file_exists( '/tmp/' . $outFile ) )
						{
							unlink( $Config->FCUpload . $f->FileInfo->DiskFilename );
							unlink( '/tmp/' . $outFile );
							rename( '/tmp/' . $fna, $Config->FCUpload . $f->FileInfo->DiskFilename );
							die( 'ok<!--separate-->Written properly (' . filesize( $Config->FCUpload . $f->FileInfo->DiskFilename ) . ')' );
						}
						die( 'fail<!--separate-->Could not convert file ' . $outFile );
					}
					die( 'fail<!--separate-->' );
				}
				die( 'fail<!--separate-->No temp file for ' . $path );
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
				if( $row = $SqlDatabase->FetchObject( 'SELECT SUM(Filesize) AS FZ FROM FSFile WHERE FilesystemID = \'' . $this->ID . '\' AND UserID=\'' . $User->ID . '\'' ) )
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
								$Logger->log( 'Made directory ' . $f->Name . ' (in ' . $path . ') id ' . $f->ID );
								return 'ok<!--separate-->' . $f->ID;
							}
						}
						die( 'fail<!--separate-->why: ' . print_r( $args, 1 ) . '(' . $path . ')' );
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
							$Logger->log( 'Trying from ' . $from . ' to ' . $to );
							if( $this->copyFile( $from, $to ) )
							{
								return 'ok';
							}
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
				$fi->Filename = end( explode( '/', $path ) );
			else $fi->Filename = end( explode( ':', $path ) );
		
			if( $fi->Load() )
			{
				$fobject = new Object();
				$fobject->Path = $path;
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
	
		// Will write to pointer, data, x bytes
		function writeFile( $filePointer, $data, $bytes )
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
	
		// Put a file
		function putFile( $path, $fileObject )
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
	
		// Create a folder
		function createFolder( $folderName, $where )
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
	
		// Not to be used outside! Not public!
		function _deleteFolder( $fo, $recursive = true )
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
						$Logger->log( 'Attempting to delete sub folder -> ' . $fopp->Name . '/ (' . $fopp->ID . ')' );
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
					$Logger->log( 'Attempting to delete file ' . $file->Filename . ' in ' . $fo->Name . '/ (' . $fo->ID . ')' );
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
	
		// Deletes a folder, all sub folders and files (optionally)
		function deleteFolder( $path, $recursive = true )
		{
			global $Config, $User, $Logger;
		
			// Remove file from path
			$subPath = explode( '/', end( explode( ':', $path ) ) );
			array_pop( $subPath );
			$subPath = implode( '/', $subPath ) . '/';
	
			if( $fo = $this->getSubFolder( $subPath ) )
			{
				$Logger->log( 'Delete folder in subpath ' . $subPath . ' in fs ' . $this->Name . ': ---' );
				return $this->_deleteFolder( $fo, $recursive );
			}
		
			return false;
		}
	
		// Delete a file
		function deleteFile( $path, $recursive = false )
		{
			global $Config, $User, $Logger;
		
			// If it's a folder
			if( substr( $path, -1, 1 ) == '/' )
				return $this->deleteFolder( $path, $recursive );
		
			// Remove file from path
			$subPath = explode( '/', end( explode( ':', $path ) ) );
			array_pop( $subPath );
			$subPath = implode( '/', $subPath ) . '/';
	
			$fo = $this->getSubFolder( $subPath );
		
			$Logger->log( 'Trying to delete a file in folder: ' . ( $fo ? $fo->Name : ( '(don\'t know, but in subfolder ' . $subPath . ')' ) ) );
		
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
					$Logger->log( 'Deleting file in folder ' . ( $fo ? $fo->Name : '' ) . '/ (' . $fi->FolderID . ')' );
					unlink( $Config->FCUpload . $fi->DiskFilename );
					$fi->Delete();
					return true;
				}
				else 
				{
					$Logger->log( 'Deleting db only (corrupt) file in folder ' . $fi->Name . '/ (' . $fi->FolderID . ')' );
					$fi->Delete();
				}
			}
			return false;
		}
	}
}

// Create a door...
$door = new DoorSQLDrive( isset( $path ) ? $path : ( ( isset( $args ) && isset( $args->args ) && $args->args->path ) ? $args->args->path : false ) );

?>
