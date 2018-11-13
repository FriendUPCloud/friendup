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

class DoorWebsite extends Door
{
	function onConstruct()
	{
		global $args, $Filesystem;
		if( !isset( $Filesystem ) ) die( 'fail' );
		$this->fileInfo = isset( $args->fileInfo ) ? $args->fileInfo : new stdClass();
		$this->rootPath = $Filesystem->Server;
		$this->args = $args;
	}
	
	// Send an arena server query
	private function query( $command, $args = false )
	{
		global $User, $SqlDatabase, $Logger;
		
		// Must have args in array format
		if( !$args ) $args = array();
		else if( !is_array( $args ) )
		{
			$oa = [];
			foreach( $args as $k=>$v ) 
			{
				if( $k != 'sessionid' )
					$oa[$k] = $v;
			}
			$args = $oa;
		}
		
		// Setup 
		$serv = trim( $this->rootPath );
		$serv = preg_replace( '/[^.]*?.(php|html|asp|aspx|py|pl|htm)/i', '', $serv );
		
		$serv .= '?command=' . $command;
		
		// Return result
		$c = curl_init();
		curl_setopt( $c, CURLOPT_URL, $serv );
		curl_setopt( $c, CURLOPT_HEADER, false ); 
		curl_setopt( $c, CURLOPT_RETURNTRANSFER, true ); 
		curl_setopt( $c, CURLOPT_POST, true );
		curl_setopt( $c, CURLOPT_POSTFIELDS, http_build_query( $args ) );
		return curl_exec( $c );
	}
	
	// Gets the subfolder by path on this filesystem door
	function getDirectoryListing( $subPath )
	{
		global $args;
		
		// 1. Get Path
		$subPath = end( explode( ':', $args->path ) );
		
		if( trim( $subPath ) )
		{
			if( substr( $subPath, 0, 2 ) == '//' )
				$path = 'http:' . $subPath;
			else 
			{
				$path = $this->rootPath;
				if( substr( $path, -1, 1 ) != '/' )
					$path .= '/';
				$path .= $subPath;
			}
		}
		// Just load the root server
		else
		{
			$path = $this->rootPath;
		}
		
		// 2. Get data
		// Try first jsx
		$jsx = false;
		if( !$subPath && ( $data = file_get_contents( $path . 'index.jsx' ) ) )
			$jsx = true;
		else $data = file_get_contents( $path );
		if( $data )
		{
			// 3a. Page to file
			if( !$subPath || $subPath != 'Libraries/' )
			{
				$filename = 'index.html';
				if( $jsx ) $filename = 'index.jsx';
				$file = new stdClass();
				$file->Filename = $filename;
				$file->Type = 'File';
				$file->MetaType = $jsx ? 'Executable' : 'File';
				$file->IconClass = 'TypeJSX';
				$file->Filesize = strlen( $data );
				$file->DateModifed = date( 'Y-m-d H:i:s' );
				$file->DateCreated = '1970-01-01 00:00:00';
				$file->Path = $args->path . $filename;
				$file->Permissions = '';
				$array[] = $file;
			
			
				// 3b. Libraries
				if( !$subPath )
				{
					$file = new stdClass();
					$file->Filename = 'Libraries';
					$file->Type = 'Directory';
					$file->MetaType = 'Directory';
					$file->DateModifed = date( 'Y-m-d H:i:s' );
					$file->DateCreated = '1970-01-01 00:00:00';
					$file->Path = $args->path . 'Libraries/';
					$file->Permissions = '';
					$array[] = $file;
				}

				// 4. Convert links to folders
				if( !$jsx && preg_match_all( '/\<a.*?href\=\"([^"]*?)\"[^>]*?\>([^<]*?)\</i', $data, $matches ) )
				{
					foreach( $matches[2] as $k=>$m )
					{
						if( !trim( $m ) ) continue;
				
						// Only take local links
						if( 
							(
								substr( $matches[1][$k], 0, 5 ) == 'http:' ||
								substr( $matches[1][$k], 0, 6 ) == 'https:' ||
								substr( $matches[1][$k], 0, 7 ) == 'mailto:'
							)
							&&
							substr( $matches[1][$k], 0, strlen( $path ) ) != $path
						)
						{
							continue;
						}
						
						// Don't repeat links
						if( substr( $matches[1][$k], 0, strlen( $path ) ) == $path )
							$dir = substr( $matches[1][$k], strlen( $path ), strlen( $matches[1][$k] ) - strlen( $path ) );
						else $dir = $matches[1][$k];
						if( $dir{0} == '/' ) $dir = substr( $dir, 1, strlen( $dir ) - 1 );
						if( !trim( $dir ) ) continue;
						if( substr( $args->path, -1, 1 ) != '/' )
							$dir = "/$dir";
						
						// 3. Page to file
						$file = new stdClass();
						$file->Filename = $m;
						$file->Type = 'Directory';
						$file->MetaType = 'Directory';
						$file->Filesize = 1024;
						$file->DateModifed = date( 'Y-m-d H:i:s' );
						$file->DateCreated = '1970-01-01 00:00:00';
						$file->Path = $args->path . $dir;
						$file->Permissions = '';
						$array[] = $file;
					}
				}
				
				die( 'ok<!--separate-->' . json_encode( $array ) );
			}
		}
		// List libraries
		if( $subPath == 'Libraries/' )
		{
			if( ( $data = file_get_contents( $this->rootPath . '?command=libraries' ) ) )
			{
				if( substr( $data, 0, 17 ) == 'ok<!--separate-->' )
				{
					$list = json_decode( substr( $data, 17, strlen( $data ) - 17 ) );
					if( $list )
					{
						$array = [];
						foreach( $list as $row )
						{
							$file = new stdClass();
							$file->Filename = $row->Filename;
							$file->Type = 'File';
							$file->MetaType = 'Library';
							$file->Filesize = strlen( $data );
							$file->DateModifed = date( 'Y-m-d H:i:s' );
							$file->DateCreated = '1970-01-01 00:00:00';
							$file->Path = $args->path . $row->Filename;
							$file->Permissions = '';
							$array[] = $file;
						}
						die( 'ok<!--separate-->' . json_encode( $array ) );
					}
				}
				die( 'fail<!--separate-->' );
			}
		}
		return false;
	}
	
	private function loadByPath()
	{
		global $SqlDatabase, $User, $args;
		
		$ele = isset( $args->devname ) ? $args->devname : ( isset( $this->args->path ) ? end( explode( ':', $this->args->path ) ) : false );
		
		if( $ele )
		{
			if( $d = $SqlDatabase->FetchObject( '
				SELECT * FROM `Filesystem` WHERE `UserID`=\'' . $User->ID . '\' AND LOWER(`Name`)=LOWER("' . reset( explode( ':', $ele ) ) . '")
			' ) )
			{
				foreach( $d as $k=>$v )
					$this->$k = $v;
			}
			return;
		}
		die( 'fail<!--separate-->' );
	}
	
	// Execute a dos command
	function dosAction( $args )
	{
		global $Filesystem, $Logger;
		// Do a directory listing
		// TODO: Make it uniform! Not to methods! use command == dir
		if( 
			( isset( $args->command ) && $args->command == 'directory' ) ||  
			( isset( $args->command ) && $args->command == 'dosaction' && isset( $args->args->action ) && $args->args->action == 'dir' )
		)
		{
			// Can we get sub folder?
			$thePath = isset( $args->path ) ? $args->path : ( isset( $args->args->path ) ? $args->args->path : '' );
			if( isset( $thePath ) && ( $thePath == ( $Filesystem->Name . ':' ) || $subPath = trim( end( explode( ':', $thePath ) ) ) ) )
			{
				if( $list = $this->getDirectoryListing( $thePath == $Filesystem->Server ? $Filesystem->Server : ( isset( $subPath ) ? $subPath : false ) ) )
				{
					die( 'ok<!--separate-->' . json_encode( $list ) );
				}
				// Failed to find a path
			}
		}
		else if( $args->command == 'volumeinfo' )
		{
			// Load self
			if( !$this->ID )
			{
				$this->loadByPath();
			}
			if( $result = $this->query( 'volumeinfo' ) )
			{
				if( substr( $result, 0, 17 ) == 'ok<!--separate-->' )
				{
					$r = json_decode( end( explode( '<!--separate-->', $result ) ) );
					$r->Volume = $this->Name . ':';
					die( 'ok<!--separate-->' . json_encode( $r ) );
				}
			}
			die( 'fail' );
		}
		else if( $args->command == 'call' )
		{
			// Load self
			if( !$this->ID )
			{
				$this->loadByPath();
			}
			if( $result = $this->query( 'call', $args ) )
			{
				if( substr( $result, 0, 17 ) == 'ok<!--separate-->' )
				{
					die( $result );
				}
			}
			die( 'fail<!--separate-->' . print_r( $args, 1 ) );
		}
		else if( $args->command == 'read' )
		{
			// Load self
			if( !$this->ID )
			{
				$this->loadByPath();
			}
			
			// 1. Get Path
			$subPath = end( explode( ':', $args->path ) );
		
			if( trim( $subPath ) )
			{
				if( substr( $subPath, 0, 2 ) == '//' )
					$path = 'http:' . $subPath;
				else 
				{
					$path = $this->rootPath;
					if( substr( $path, -1, 1 ) != '/' )
						$path .= '/';
					$path .= $subPath;
				}
			}
			// Just load the root server
			else
			{
				$path = $this->rootPath;
			}
		
			// 2. Get data
			if( $data = file_get_contents( $path ) )
			{
				// Fix base href
				if( !strstr( $data, '<base' ) && strstr( $data, '<head' ) )
					$data = preg_replace( '/(\<head[^>]*?\>)/i', '$1<base href="' . $this->rootPath . '"/>', $data );
				die( 'ok<!--separate-->' . $data );
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
			}
		}
		return false;
	}
}


// Create a door...
$door = new DoorWebsite( isset( $path ) ? $path : ( ( isset( $args ) && isset( $args->args ) && $args->args->path ) ? $args->args->path : false ) );

?>
