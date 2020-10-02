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

/*

	Error codes:
	
	1       - You can only create 1 level of directories in Friend Store Drive

*/

/**
 * Definition of main variables
 */
global $args, $SqlDatabase, $User, $Config;

/**
 * Inclusion of the Dormant system
 */
include_once( 'php/classes/door.php' );

/**
 * Checks if a file length does not pass over limit
 */
if( !defined( 'FRIENDSTORE_FILE_LIMIT' ) )
{
	// 500 megabytes
	define( 'FRIENDSTORE_FILE_LIMIT', 5242880000 );
}

/**
 * Check database structure has not been modified since last session
 */
$t = new dbTable( 'FriendStoreFolder' );
if( !$t->load() )
{
	$SqlDatabase->query( '
	CREATE TABLE `FriendStoreFolder` (
		`ID` bigint(20) NOT NULL AUTO_INCREMENT,
		`FilesystemID` bigint(20) NOT NULL,
		`FolderID` bigint(20) NOT NULL,
		`UserID` bigint(20) NOT NULL,
		`VendorID` bigint(20) NOT NULL,
		`Name` varchar(255) NOT NULL,
		`Permissions` varchar(255) NOT NULL,
		`DateModified` datetime NOT NULL,
		`DateCreated` datetime NOT NULL,
		PRIMARY KEY (`ID`)
	)
	' );
	$SqlDatabase->query( '
	CREATE TABLE `FriendStoreFile` (
		`ID` bigint(20) NOT NULL AUTO_INCREMENT,
		`FilesystemID` bigint(20) NOT NULL,
		`UserID` bigint(20) NOT NULL,
		`VendorID` bigint(20) NOT NULL,
		`FolderID` bigint(20) NOT NULL,
		`Filename` varchar(255) NOT NULL,
		`DiskFilename` varchar(255) NOT NULL,
		`Filesize` int(11) NOT NULL DEFAULT \'0\',
		`Permissions` varchar(255) NOT NULL,
		`DateModified` datetime NOT NULL,
		`DateCreated` datetime NOT NULL,
		PRIMARY KEY (`ID`)
	) 
	' );
	$SqlDatabase->query( '
	CREATE TABLE `FriendStoreVendor` (
		`ID` bigint(20) NOT NULL AUTO_INCREMENT,
		`Hash` varchar(255) NOT NULL,
		`Name` varchar(255) NOT NULL,
		`Address` varchar(255) NOT NULL,
		`State` varchar(255) NOT NULL,
		`Country` varchar(255) NOT NULL,
		`Telephone` varchar(255) NOT NULL,
		`Email` varchar(255) NOT NULL,
		`DateModified` datetime NOT NULL,
		`DateCreated` datetime NOT NULL,
		PRIMARY KEY (`ID`)
	)
	' );
}

if( !class_exists( 'DoorFriendStoreDrive' ) )
{
	class DoorFriendStoreDrive extends Door
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
	
			//$Logger->log( 'We found final path: ' . implode( '/', $finalPath ) );
	
			$parID = '0';
			while( count( $finalPath ) > 0 )
			{
				//$Logger->log('We do now check this path: ' . implode( '/', $finalPath ) . ' with Parent Folder ID of ' . $parID );
				if( $fo ) $pfo = $fo; // Previous folder
				$do = $SqlDatabase->FetchObject( '
					SELECT * FROM `FriendStoreFolder` 
					WHERE 
						`FilesystemID`=\'' . $this->ID . '\' AND 
						`Name`=\'' . $finalPath[0] . '\' AND 
						`FolderID`=\'' . $parID . '\'' );
				if( $do && $do->ID > 0 )
				{
					// Create a usable object
					$fo = new DbIO( 'FriendStoreFolder' );
					$fo->SetFromObject( $do );
					
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
					// If this last joint might be a file, return parent id
					$Logger->log('Not a real folder "' . $finalPath[0] . '"? -> COULD NOT LOAD SQLDrive Folder // FilesystemID: ' . $fo->FilesystemID .  ' // FolderID ' . $fo->FolderID . ' // Name ' . $fo->Name );
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
							SELECT "Directory" AS `Type`, ID, `Name`, Permissions, DateModified, DateCreated, "0" AS Filesize FROM FriendStoreFolder
							WHERE FilesystemID=\'' . $this->ID . '\' AND FolderID=\'' . ( $fo ? $fo->ID : '' ) . '\'
						)
						UNION
						(
							SELECT "File" AS `Type`, ID, Filename AS `Name`, Permissions, DateModified, DateCreated, Filesize FROM FriendStoreFile
							WHERE FilesystemID=\'' . $this->ID . '\' AND FolderID=\'' . ( $fo ? $fo->ID : '' ) . '\'
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
							$entries[$k]->Path = $thePath . $entry->Name . ( $entry->Type == 'Directory' ? '/' : '' );
							$paths[] = $entry->Path;
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
					if( $shared = $SqlDatabase->FetchObjects( $q = '
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
								if( isset( $entry->Path ) && isset( $sh->Path ) && $entry->Path == $sh->Path && $entry->UserID == $sh->UserID )
								{
									$entries[$k]->Shared = 'Public';
									
									$link = ( $Config->SSLEnable == 1 ? 'https' : 'http' ) . '://';
									$link .= $Config->FCHost . ':' . $Config->FCPort . '/sharedfile/' . $sh->Hash . '/' . $sh->Name;
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
						$o->Path = $thePath . $o->Filename . ( $o->Type == 'Directory' ? '/' : '' );
						$o->Shared = isset( $entry->Shared ) ? $entry->Shared : '';
						$o->SharedLink = isset( $entry->SharedLink ) ? $entry->SharedLink : '';
						$out[] = $o;
					}
					return 'ok<!--separate-->' . json_encode( $out );
				}
				// No entries
				return 'ok<!--separate-->[]';
			}
			else if( $args->command == 'info' )
			{
				// Is it a folder?
				if( substr( $path, -1, 1 ) == '/' )
				{
					if( $sp = $this->getSubFolder( $path ) )
					{
						$fldInfo = new stdClass();
						$fldInfo->Type = 'Directory';
						$fldInfo->MetaType = $fldInfo->Type;
						$fldInfo->Path = $path;
						$fldInfo->Filesize = 0;
						$fldInfo->Filename = $sp->Name;
						die( 'ok<!--separate-->' . json_encode( $fldInfo ) );
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
						$f = new dbIO( 'FriendStoreFile' );
						if( $sp ) $f->FolderID = $sp->ID;
						else $f->FolderID = '0';
						$f->Filename = $fname;
						$f->FilesystemID = $this->ID;
						if( $f->Load() )
						{
							$fldInfo = new stdClass();
							$fldInfo->Type = 'File';
							$fldInfo->MetaType = $fldInfo->Type;
							$fldInfo->Path = $path;
							$fldInfo->Filesize = 0;
							$fldInfo->Filename = $sp->Name;
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
					SELECT SUM(u.Filesize) z FROM FriendStoreFile u
					WHERE AND FilesystemID = \'' . $this->ID . '\'
				' ) )
				{
					$total = $sum->z;
				}
				
				// Create a file object
				$f = new dbIO( 'FriendStoreFile' );
				$f->FilesystemID = $this->ID;
				$fname = end( explode( ':', $args->path ) );
				$fname = end( explode( '/', $fname ) );
				$f->Filename = $fname;
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
					$fn = $f->DiskFilename;
				}
				else
				{
					$fn = $f->Filename;
					$f->DiskFilename = '';
				}
					
				// Become owner if no owner is set
				if( $f->UserID <= 0 ) $f->UserID = $User->ID;

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
							
							if( $total + $len < FRIENDSTORE_FILE_LIMIT )
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
						if( $total + strlen( $args->data ) < FRIENDSTORE_FILE_LIMIT )
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
				$f = new dbIO( 'FriendStoreFile' );
				$f->FilesystemID = $this->ID;
				$fname = end( explode( ':', $args->path ) );
				$fname = end( explode( '/', $fname ) );
				$f->Filename = $fname;
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
					
						$fl = new dbIO( 'FriendStoreFile' );
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
							
							$l = new dbIO( 'FriendStoreFile' );
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
						SELECT f.* FROM `Filesystem` f
						WHERE 
							LOWER(f.Name) = LOWER("' . reset( explode( ':', $args->path ) ) . '") AND
							(
								f.UserID=\'' . $User->ID . '\' OR
								f.GroupID IN (
									SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g
									WHERE 
										g.ID = ug.UserGroupID AND g.Type = \'Vendor\' AND
										ug.UserID = \'' . $User->ID . '\'
								)
							)
					' ) )
					{
						foreach( $d as $k=>$v )
						$this->$k = $v;
					}
				}
				if( $row = $SqlDatabase->FetchObject( '
					SELECT SUM(Filesize) AS FZ FROM FriendStoreFile 
					WHERE 
						FilesystemID = \'' . $this->ID . '\'
				' ) )
				{
					$o = new stdClass();
					$o->Volume = $this->Name . ':';
					$o->Used = ( $row->FZ ? $row->FZ : 0 );
					$o->Filesize = ( defined( 'FriendStoreDrive_FILE_LIMIT' ) ? FriendStoreDrive_FILE_LIMIT : 0 );
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
						$conf = json_decode( $this->Config );
						if( $row = $SqlDatabase->FetchObject( 'SELECT * FROM FriendStoreVendor WHERE `Hash`=\'' . mysql_real_escape_string( $conf->VendorID ) . '\'' ) )
						{
							$SqlDatabase->query( 'UPDATE Filesystem f SET `Mounted`=\'1\' WHERE ID=\'' . $this->ID . '\'' );
							$Logger->log( 'Successfully mounted.' );
							return 'ok';
						}
						return 'fail';
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
								$f = new dbIO( 'FriendStoreFile' );
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
							// Too deep!
							if( count( explode( '/', $path ) ) > 2 )
							{
								die( 'fail<!--separate-->{"ErrorMessage":"i18n_cannotcreate_deep_directory","ErrorCode":"1"}' );
							}
						
							$f = new DbIO( 'FriendStoreFolder' );
							
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
								$f->FolderID = $fo ? $fo->ID : '0';
								
								// Make sure the folder does not already exist!
								if( $f->Load() )
								{
									die( 'fail<!--separate-->Directory already exists.' );
								}
								$f->UserID = $User->ID;
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
			$fi = new dbIO( 'FriendStoreFile' );
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
				$fobject->Type = 'FriendStoreDrive';
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
			$fi = new dbIO( 'FriendStoreFile' );
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
			$fi = new dbIO( 'FriendStoreFile' );
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
		
				$fi = new dbIO( 'FriendStoreFile' );
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
			$nfo = new DbIO( 'FriendStoreFolder' );
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
				$fop = new dbIO( 'FriendStoreFolder' );
				//$fop->UserID = $User->ID; // TODO: Reenable for security!
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
			$fi = new dbIO( 'FriendStoreFile' );
			// $fi->UserID = $User->ID; TODO: Reenable for security!
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
		
			$fi = new dbIO( 'FriendStoreFile' );
			// $fi->UserID = $User->ID; // Reenable for security
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
$door = new DoorFriendStoreDrive( isset( $path ) ? $path : ( ( isset( $args ) && isset( $args->args ) && $args->args->path ) ? $args->args->path : false ) );

?>
