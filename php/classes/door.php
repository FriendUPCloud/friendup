<?php
/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
*                                                                              *
*****************************************************************************©*/

class Door extends dbIO
{	
	// Construct a Door object
	function Door( $path = false )
	{
		global $SqlDatabase, $Logger;
		
		$this->dbTable( 'Filesystem' );
		
		if( $q = $this->getQuery( $path ) )
		{
			if( $d = $SqlDatabase->FetchObject( $q ) )
			{
				foreach( $d as $k=>$v )
					$this->$k = $v;
			}
		}
		if( method_exists( $this, 'onConstruct' ) )
		{
			$this->onConstruct();
		}
	}
	
	// Gets the correct identifier to extract a filesystem
	function getQuery( $path = false )
	{
		global $args, $User, $Logger, $SqlDatabase;
		if( !isset( $User->ID ) ) 
		{
			return false;
		}
		
		$identifier = false;
		
		// We've probably got a request object
		if( is_object( $path ) )
		{
			$args = $path;
			
			// TODO: MAP AND KILL THIS SHIT! WE NEED ONLY ONE WAY!
			// Try by fileInfo path
			if( isset( $args->devname ) )
			{
				$identifier = 'LOWER(f.Name)=LOWER(\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->devname ) . '\')';
			}
			else if( isset( $args->fileInfo->Path ) )
			{
				$identifier = 'LOWER(f.Name)=LOWER(\'' . mysqli_real_escape_string( $SqlDatabase->_link, reset( explode( ':', $args->fileInfo->Path ) ) ) . '\')';
			}
			// Try by volume name
			else if( isset( $args->args->volume ) )
			{
				$identifier = 'LOWER(f.Name)=LOWER(\'' . mysqli_real_escape_string( $SqlDatabase->_link, reset( explode( ':', $args->args->volume ) ) ) . '\')';
			}
			else if( isset( $args->args->from ) )
			{
				$identifier = 'LOWER(f.Name)=LOWER(\'' . mysqli_real_escape_string( $SqlDatabase->_link, reset( explode( ':', $args->args->from ) ) ) . '\')';
			}
			else if( isset( $args->path ) )
			{
				$ident = explode( ':', $args->path ); $res = reset( $ident );
				$identifier = 'LOWER(f.Name)=LOWER(\'' . mysqli_real_escape_string( $SqlDatabase->_link, $res ) . '\')';
			}
			else if( isset( $args->args->path ) )
			{
				$ident = explode( ':', $args->args->path ); $res = reset( $ident );
				$identifier = 'LOWER(f.Name)=LOWER(\'' . mysqli_real_escape_string( $SqlDatabase->_link, $res ) . '\')';
			}
			// This one should not be required!
			else if( isset( $args->args->directory ) )
			{
				$r = explode( ':', $args->args->directory );
				$identifier = 'LOWER(f.Name)=LOWER(\'' . mysqli_real_escape_string( $SqlDatabase->_link, reset( $r ) ) . '\')';
			}
			// This one should not be required!
			else if( isset( $args->args->args->path ) )
			{
				$r = explode( ':', $args->args->args->path );
				$identifier = 'LOWER(f.Name)=LOWER(\'' . mysqli_real_escape_string( $SqlDatabase->_link, reset( $r ) ) . '\')';
			}
			// Try by filesystem database id (LAST RESORT!)
			else if( isset( $args->fileInfo->ID ) )
			{
				$identifier = 'f.ID=\'' . intval( $args->fileInfo->ID, 10 ) . '\'';
			}
			if( $identifier )
			{
				return '
				SELECT * FROM `Filesystem` f 
				WHERE 
					(
						f.UserID=\'' . $User->ID . '\' OR
						f.GroupID IN (
							SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g
							WHERE 
								g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND
								ug.UserID = \'' . $User->ID . '\'
						)
					)
					AND ' . $identifier . ' LIMIT 1';
			}
		}
		// Get by path (string)
		else
		{
			$op = explode( ':', $path );
			$name = mysqli_real_escape_string( $SqlDatabase->_link, reset( $op ) );
			return '
				SELECT * FROM `Filesystem` f 
				WHERE 
					(
						f.UserID=\'' . $User->ID . '\' OR
						f.GroupID IN (
							SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g
							WHERE 
								g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND
								ug.UserID = \'' . $User->ID . '\'
						)
					)
					AND
					f.Name=\'' . $name . '\' LIMIT 1';
		}
		
		// Failed!
		return false;
	}
	
	function dosQuery( $query )
	{
		global $Config, $User, $SqlDatabase, $Logger;
		
		if( !strstr( $query, '?' ) )
		{
			$query .= '?sessionid=' . $User->SessionID;
		}
		else
		{
			$query .= '&sessionid=' . $User->SessionID;
		}
		
		$u = $Config->SSLEnable ? 'https://' : 'http://';
		$u .= ( $Config->FCOnLocalhost ? 'localhost' : $Config->FCHost ) . ':' . $Config->FCPort;
		
		$c = curl_init();
		
		curl_setopt( $c, CURLOPT_URL, $u . $query );
		curl_setopt( $c, CURLOPT_RETURNTRANSFER, 1 );
		if( $Config->SSLEnable )
		{
			curl_setopt( $c, CURLOPT_SSL_VERIFYPEER, false );
			curl_setopt( $c, CURLOPT_SSL_VERIFYHOST, false );
		}
		$ud = curl_exec( $c );
		curl_close( $c );
		return $ud;
	}
	
	// Will open and return a file pointer set with options
	function openFile( $path, $mode )
	{
		return false;
	}
	
	// Close file pointer!
	function closeFile( $filePointer )
	{
		return false;
	}
	
	// Will read from file pointer x bytes
	function readFile( $filePointer, $bytes )
	{
		return NULL;
	}

	// Will write to pointer, data, x bytes
	function writeFile( $filePointer, $data, $bytes )
	{
		return 0;
	}
	
	// Sync directory and file structures
	function syncFiles( $pathFrom, $pathTo, $log, $depth = 0 )
	{
		global $Logger;
		
		// Dest is a cleaned up version of the file listing for the destination
		
		$dest = [];
		
		if( $log ) $log->ok( "Going i on depth $depth.", true );
		
		// Destination path ...
		
		if( $log ) $log->ok( "Prepping ... [To]   -> " . trim( $pathTo ) . ( count( $dir ) > 2 ? " (" . ( count( $dir ) / 2 ) . ")" : "" ), true );
		
		if( $dir = $this->dir( trim( $pathTo ) ) )
		{	
			// Organize by info files first
			$outFiles = [];
			$outDirs = [];
			$outInfos = [];
			foreach( $dir as $entry )
			{
				if( substr( $entry->Filename, -8, 8 ) == '.dirinfo' )
				{
					$outInfos[] = $entry;
				}
				else if( substr( $entry->Filename, -1, 1 ) == '/' )
				{
					$outDirs[] = $entry;
				}
				else
				{
					$outFiles[] = $entry;
				}
			}
			$dir = array_merge( $outInfos, $outDirs, $outFiles );
			
			foreach( $dir as $k=>$v )
			{
				$dest[str_replace( array( '&nbsp;-&nbsp;', ' - ' ), '', trim( $v->Filename ) )] = $v;
			}
		}
		
		// Source path ... get a directory listing
		
		if( $log ) $log->ok( "Prepping ... [From] -> " . trim( $pathFrom ) . ( count( $dir ) > 2 ? " (" . ( count( $dir ) / 2 ) . ")" : "" ), true );
		
		if( $dir = $this->dir( trim( $pathFrom ) ) )
		{
			// Organize by info files first
			$outFiles = [];
			$outDirs = [];
			$outInfos = [];
			foreach( $dir as $entry )
			{
				if( substr( $entry->Filename, -8, 8 ) == '.dirinfo' )
				{
					$outInfos[] = $entry;
				}
				else if( substr( $entry->Filename, -1, 1 ) == '/' )
				{
					$outDirs[] = $entry;
				}
				else
				{
					$outFiles[] = $entry;
				}
			}
			$dir = array_merge( $outInfos, $outDirs, $outFiles );
			
			if( $log ) $log->log( " ", true );
			
			
			// Process directories and files
			
			// TODO: Figure out why dest on properfilename can't FIND / FOUND an existing directory
			
			// Do the copy
			
			foreach( $dir as $k=>$v )
			{	
				$modified = false;
			
				if( $log ) $log->waiting( "Copying ...        -> " . trim( $v->Filename ) );
			
				// Prepare destination file / directory path
			
				$v->Destination = ( trim( $pathTo ) . trim( $v->Filename ) . ( $v->Type == 'Directory' ? '/' : '' ) );
			
				$properFilename = str_replace( array( '&nbsp;-&nbsp;', ' - ' ), '', trim( $v->Filename ) );
			
				// Check if the file has been modified (source vs dest)
			
				if( isset( $dest[ $properFilename ] ) )
				{
					$dest[ $properFilename ]->Found = true; // File exists!
				
					if( $log ) $log->ok( "File or directory is found ...        -> " . trim( $v->Filename ), true );
				
					$modified = $v->DateModified > $dest[ $properFilename ]->DateModified;
				}
				else
				{
					//die( 'Not alike: ' . $properFilename . ' = ' . $dest->Properfilename );
				}
			
				// If the file was modified, then copy!
			
				if( !$v->DateModified || !$modified )
				{
					// Copy from source to destination (that we made proper path for above)
					
					if( $this->copyFile( trim( $v->Path ), trim( $v->Destination ) ) )
					{
						if( !strstr( trim( $v->Filename ), '.info' ) )
						{
							if( $log ) $log->ok( "Copying ...        -> " . trim( $v->Filename ), true );
						}
					}
					else
					{
						if( $log ) $log->error( "Copying ...        -> " . trim( $v->Filename ), true );
					}
				}
				else
				{
					if( !strstr( trim( $v->Filename ), '.info' ) )
					{
						if( $log ) $log->ok( "Ignored ...        -> " . trim( $v->Filename ), true );
					}
				}
			
				// See if we have destination files / directories that
				// should be deleted because they do not exist in source
			
				if( count( $dest ) > 0 )
				{
					foreach( $dest as $des )
					{
						if( !isset( $des->Found ) && $des->Path )
						{
							die( 'Not found: ' . $des->Filename . ' ..' );
							// TODO: If it has been deleted return ok when next loop has the same path in regards to .info files
						
							$isIcon = substr( $des->Filename, -5, 5 ) == '.info' ||
								substr( $des->Filename, -8, 8 ) == '.dirinfo';
							if( !$isIcon )
							{
								if( $log ) $log->waiting( "Delete  ...        -> " . trim( $des->Filename ) );
						
								if( $this->deleteFile( $des->Path ) )
								{
									if( $log ) $log->ok( "Delete  ...        -> " . trim( $des->Filename ), true );
								}
								else
								{
									if( $log ) $log->error( "Delete  ...        -> " . trim( $des->Filename ), true );
								}
							}
						}
					}
				}
			
				// We have sub directories
			
				if( $v->Type == 'Directory' )
				{
					$this->syncFiles( trim( $v->Path ), trim( $v->Destination ), $log, $depth + 1 );
				}
			}
			
			return true;
		}
		
		return false;
	}
	
	function deleteFile( $delpath )
	{
		global $User, $Logger;
		
		// 1. Get the filesystem objects
		$ph = reset( explode( ':', $delpath ) );
		
		$fs = new dbIO( 'Filesystem' );
		$fs->UserID = $User->ID;
		$fs->Name   = $ph;
		$fs->Load();
		
		// We got two filesystems, good!
		if( $fs->ID > 0 )
		{
			// New version:
			if( !isset( $test ) )
			{
				$test = 'devices/DOSDrivers/' . $fs->Type . '/door.php';
			}
			
			// Final test
			if( !file_exists( $test ) )
			{
				// Use built-in, will work on local.handler
				$deldoor = new Door( $delpath );
			}
			else
			{
				$path = $delpath;
				include( $test );
				$deldoor = $door;
			}
			
			unset( $door, $path );
			
			// It's a folder!
			if( substr( $delpath, -1, 1 ) == '/' )
			{
				if( $deldoor->_deleteFolder( $delpath ) )
				{
					return true;
				}
				
				$Logger->log( 'couldn\'t deleteFolder... ' . $delpath );
				
				return false;
			}
			// It's a file
			else
			{
				if( $deldoor->_deleteFile( $delpath ) )
				{
					return true;
				}
				
				$Logger->log( 'couldn\'t deleteFile... ' . $delpath );
				
				return false;
			}
			
			$Logger->log( 'how did we even get here... ' . $delpath );
			
			return false;
		}
	}
	
	function copyFile( $pathFrom, $pathTo )
	{
		global $User, $Logger;
		
		// 1. Get the filesystem objects
		$from = reset( explode( ':', $pathFrom ) );
		$to   = reset( explode( ':', $pathTo   ) );
		
		// Support caching
		if( $this->cacheFrom && $this->cacheFrom->Name == $from )
		{
			$fsFrom = $this->cacheFrom;
		}
		else
		{
			$fsFrom = new dbIO( 'Filesystem' );
			$fsFrom->UserID = $User->ID;
			$fsFrom->Name   = $from;
			$fsFrom->Load();
			$this->cacheFrom = $fsFrom;
		}
		if( $this->cacheTo && $this->cacheTo->Name == $to )
		{
			$fsTo = $this->cacheTo;
		}
		else
		{
			$fsTo = new dbIO( 'Filesystem' ); 
			$fsTo->UserID = $User->ID;
			$fsTo->Name   = $to;
			$fsTo->Load();
			$this->cacheTo = $fsTo;
		}
		
		// We got two filesystems, good!
		if( $fsTo->ID > 0 && $fsFrom->ID > 0 )
		{
			// New version:
			if( !isset( $testFrom ) )
				$testFrom = 'devices/DOSDrivers/' . $fsFrom->Type . '/door.php';
			if( !isset( $testTo ) )
				$testTo = 'devices/DOSDrivers/' . $fsTo->Type . '/door.php';
				
			// Get a filesystem object for the two file systems

			// Final test
			if( !file_exists( $testFrom ) )
			{
				// Use built-in, will work on local.handler
				$doorFrom = new Door( $pathFrom );
			}
			else
			{
				$path = $pathFrom;
				include( $testFrom );
				$doorFrom = $door;
			}
			if( !file_exists( $testTo ) )
			{
				// Use built-in, will work on local.handler
				$doorTo = new Door( $pathTo );
			}
			else
			{
				$path = $pathTo;
				include( $testTo );
				$doorTo = $door;
			}
			
			unset( $door, $path );
			
			// It's a folder!
			if( substr( $pathFrom, -1, 1 ) == '/' )
			{
				$fpath = substr( $pathFrom, 0, strlen( $pathFrom ) - 1 );
				if( strstr( $fpath, '/' ) )
					$folderName = end( explode( '/', $fpath ) );
				else $folderName = end( explode( ':', $fpath ) );

				if( trim( $folderName ) )
				{
					$tpath = $pathTo;
					if( substr( $tpath, -1, 1 ) != ':' && substr( $tpath, -1, 1 ) != '/' )
						$tpath .= '/';
					
					// Create the path
					if( $doorTo->createFolder( $folderName, $tpath ) )
					{
						return true;
					}
					$Logger->log('couldn\'t createFolder... ' . $folderName . ' :: ' . $tpath);
					return false;
				}
			}
			// It's a file
			else
			{
				if( $file = $doorFrom->getFile( $pathFrom ) )
				{
					if( $doorTo->putFile( $pathTo, $file ) )
					{
						return true;
					}
					$Logger->log('couldn\'t putFile... ' . $pathTo . ' :: ');
				}
			}
			$Logger->log('how did we even get here... ' . $pathFrom . ' :: ' . $pathTo);
			return false;
		}
	}
	
	/**
	 * Create a new folder (should be directory!! DEPRECATED!)
	*/
	function createFolder( $folderName, $path )
	{
		die( $this->dosQuery( '/file/makedir?path=' . jsUrlEncode( $path . '/' . $folderName ) ) );
	}
	
	/**
	 * Create a new directory
	*/
	function createDirectory( $dirName, $path )
	{
		die( $this->dosQuery( '/file/makedir?path=' . jsUrlEncode( $path . '/' . $dirName ) ) );
	}
	
	/**
	 * Puts file data
	*/
	function putFile( $pathTo, $file )
	{
		global $Logger;
		
		include_once( 'php/classes/file.php' );
		
		$cnt = false;
		
		// It's a Door object with a readFile function
		if( is_object( $file ) && isset( $file->readFile ) )
		{
			if( $p = $file->openFile( $file->Path, 'rb' ) )
			{
				$string = '';
				while( $data = $file->readFile( $p, 4096 ) )
				{
					$string .= $data;
				}
				$cnt = $string;
				$file->closeFile( $p );
			}
		}
		// It's a static object with file content or a loaded file object
		else if( is_object( $file ) && isset( $file->_content ) )
		{
			$cnt = $file->_content;
		}
		// Its a file object with fileinfo!
		else if( is_object( $file ) && isset( $file->Door ) )
		{
			$file = new File( $file->Door->Name . ':' . $file->Path );
			if( $file->Load() )
			{
				$cnt = $file->_content;
			}
		}
		
		if( $cnt )
		{
			$f = new File( $pathTo );
			return $f->Save( $cnt );
		}
		return false;
	}
	
	/**
	 * Gets a file data
	*/
	function getFile( $path )
	{
		global $Logger;
		include_once( 'php/classes/file.php' );
		$f = new File( $path );
		if( $f->Load() )
		{
			$f->Path = $path;
			return $f;
		}
		return false;
	}
	
	/* Public functions! Use these! */
	
	/**
	 * Get a directory listing
	 * @param $path Friend DOS path
	 */
	public function dir( $path )
	{
		$s = $this->dosQuery( '/system.library/file/dir/?path=' . rawurlencode( $path ) );
		if( substr( $s, 0, 3 ) == 'ok<' )
		{
			return json_decode( end( explode( '<!--separate-->', $s ) ) );
		}
		return false;
	}
}

?>
