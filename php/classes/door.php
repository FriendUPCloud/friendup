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
		global $SqlDatabase;
		
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
				$identifier = 'LOWER(f.Name)=LOWER(\'' . mysqli_real_escape_string( $SqlDatabase->_link, reset( explode( ':', $args->path ) ) ) . '\')';
			}
			else if( isset( $args->args->path ) )
			{
				$identifier = 'LOWER(f.Name)=LOWER(\'' . mysqli_real_escape_string( $SqlDatabase->_link, reset( explode( ':', $args->args->path ) ) ) . '\')';
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
		
		//$Logger->log('curling in ' . $u . $query);
		
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

	function copyFile( $pathFrom, $pathTo )
	{
		global $User, $Logger;
		
		// 1. Get the filesystem objects
		$from = reset( explode( ':', $pathFrom ) );
		$to   = reset( explode( ':', $pathTo   ) );
		
		$fsFrom = new dbIO( 'Filesystem' );
		$fsFrom->UserID = $User->ID;
		$fsFrom->Name   = $from;
		$fsFrom->Load();
		
		$fsTo = new dbIO( 'Filesystem' ); 
		$fsTo->UserID = $User->ID;
		$fsTo->Name   = $to;
		$fsTo->Load();
		
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
			if( !file_exists( $testTo   ) )
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
		//$Logger->log( 'Trying to get file: ' . $path );
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
