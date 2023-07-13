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

if( !class_exists( 'DoorFiregem' ) )
{
	class DoorFiregem extends Door
	{	
		var $separator = '<!--separate-->';
		
		// Some private functions ----------------------------------------------
		
		// Send an Firegem server query
		private function query( $command, $args = false )
		{
			global $User, $SqlDatabase, $Logger;
			
			// Must have args in array format
			if( !$args ) $args = array();
			else if( !is_array( $args ) )
			{
				$oa = [];
				foreach( $args as $k=>$v ) $oa[$k] = $v;
				$args = $oa;
			}
			
			// Setup 
			$serv = trim( $this->Server );
			$serv = str_replace( array( 'admin.php' ), '', $serv );
			if( !strstr( $serv, 'friend.php' ) )
				$serv .= ( substr( $this->Server, -1, 1 ) != '/' ? '/' : '' ) . 'friend.php';
			
			$serv .= '?action=' . $command;
			$serv .= '&volume=' . $this->Name;
			
			if( $command != 'auth' )
			{
				if( !isset( $this->sessionid ) || !$this->sessionid )
				{
					return false;
				}
				$args['token'] = $this->sessionid;
			}
			
			// Return result
			$c = curl_init();
			curl_setopt( $c, CURLOPT_URL, $serv );
			curl_setopt( $c, CURLOPT_HEADER, false ); 
			curl_setopt( $c, CURLOPT_RETURNTRANSFER, true ); 
			curl_setopt( $c, CURLOPT_POST, true );
			curl_setopt( $c, CURLOPT_POSTFIELDS, http_build_query( $args ) );
			return curl_exec( $c );
		}
		
		private function loadByPath()
		{
			global $SqlDatabase, $User, $args;
			
			$ele = isset( $args->devname ) ? $args->devname : ( isset( $args->path ) ? end( explode( ':', $args->path ) ) : false );
			
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
			die( 'fail<!--separate-->could not log in' );
		}
		
		// Log in
		private function login()
		{
			global $User, $SqlDatabase, $Logger;
			
			if( !$this->Username )
			{
				$this->loadByPath();
			}
			
			$fields = array( 
				'loginUsername' => $this->Username, 
				'loginPassword' => $this->Password
			);
			
			$result = $this->query( 'auth', $fields );
			
			$r = explode( $this->separator, $result );
			
			if( $r[0] == 'ok' ) 
			{
				$this->sessionid = trim( $r[1] );
				return true;
			}
			return false;
		}
		
		// Some public functions
		function onConstruct()
		{
			global $args;
			$this->fileInfo = isset( $args->fileInfo ) ? $args->fileInfo : new stdClass();
		}

		// Gets the subfolder by path on this filesystem door
		// Path should be like this: SomePath:Here/ or Here/ (relating to Filesystem in $this)
		function getSubFolder( $subPath )
		{
			if( $subPath == '/' ) return false;
		
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
			
			// Now get it!
			return false;
			
			return $fo;
		}
		
		function fixPath( $path )
		{
			$p = explode( ':', trim( $path ) );
			if( isset( $p[1] ) && $p[1] )
			{
				$ft = 'folder';
				$path = trim( $path );
				if( substr( $path, -1, 1 ) == '/' )
					$path = substr( $path, 0, strlen( $path ) - 1 );
				return $path;
			}
			return false;
		}

		// Execute a dos command
		function dosAction( $args )
		{
			global $SqlDatabase, $User, $Config, $Logger, $Filesystem;
		
			if( !$this->login() )
			{
				die( 'fail' );
			}
			
			// Do a directory listing
			// TODO: Make it uniform! Not to methods! use command == dir
			if( 
				( isset( $args->command ) && $args->command == 'directory' ) ||  
				( isset( $args->command ) && $args->command == 'dosaction' && isset( $args->args ) && $args->args->action == 'dir' )
			)
			{
				// Soon
				$out = [];
				
				$ft = 'root';
				$path = $this->fixPath( $args->path );
				if( substr( $args->path, -1, 1 ) != ':' )
					$ft = 'folder';
				
				// Make query post fields
				$f = [ 'foldertype'=>$ft ];
				if( $path ) $f[ 'path' ] = $path;
				
				$result = $this->query( 'foldercontent', $f );
				
				$r = explode( $this->separator, $result );
				
				if( $r[0] == 'ok' )
				{
					$rl = json_decode( $r[1] );
					foreach( $rl as $k=>$v )
					{
						if( !is_string( $v ) ) continue;
						if( $v->Type == 'Directory' && substr( $v, -1, 1 ) != '/' )
							$v->Path .= '/';
						$rl[$k]->Path = $this->Name . ':' . $v->Path;
					}
					
					// Add icon
					if( $ft == 'root' )
					{
						$info = new stdClass();
						$info->Type = 'File';
						$info->Path = $this->Name . ':disk.info';
						$info->Filename = 'disk.info';
						
						$rl[] = $info;
					}
					
					die( 'ok<!--separate-->' . json_encode( $rl ) );
				}
				// No entries
				return 'fail<!--separate-->' . $result;
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
				die( 'fail' );
			}
			else if( $args->command == 'write' )
			{	
				$path = $this->fixPath( $args->path );
				
				$fields = array( 'path' => $path );
				if( isset( $args->data ) )
				{
					$fields['content'] = $args->data;
				}
				
				if( isset( $args->tmpfile ) && file_exists( $args->tmpfile ) )
				{
					$fields['content'] = file_get_contents( $args->tmpfile );
					unlink( $args->tmpfile );
				}
				
				$Logger->log( 'Checking on path: ' . $path );
				
				if( $result = $this->query( 'savefile', $fields ) )
				{
					$Logger->log( 'Result: ' . $result );
					return $result;
				}
				
				// Soon
				return 'fail<!--separate-->Could not write file...';
			}
			// Import sent files!
			else if( $args->command == 'import' )
			{
				// Oi! What does this mean in this context?
				
			}
			else if( $args->command == 'read' )
			{
				$path = $this->fixPath( $args->path );
				
				$fields = array( 'path' => $path, 'mode' => $args->mode ? $args->mode : 'r' );
				$result = $this->query( 'filecontent', $fields );
				if( strlen( $result ) )
				{
					if( isset( $args->mode ) && ( $args->mode == "rb" || $args->mode == "rs" ) )			
					{
						if( substr( $result, 0, 17 ) == 'ok<!--separate-->' )
						{
							$result = end( explode( '<!--separate-->', $result ) );
						}
						die( $result );
					}
					else 
					{
						if( substr( $result, 0, 17 ) == 'ok<!--separate-->' )
						{
							$result = end( explode( '<!--separate-->', $result ) );
						}
						$res = 'ok<!--separate-->' . $result;
						die( $res );
					}
				}
				
				// oi!
				return 'fail<!--separate-->Could not read file....';
			}
			else if( $args->command == 'info' )
			{
				$path = $this->fixPath( $args->path );
				
				$fields = array( 'path' => $path, 'mode' => $args->mode ? $args->mode : 'r' );
				$result = $this->query( 'filestat', $fields );
				if( strlen( $result ) )
				{
					if( substr( $result, 0, 17 ) == 'ok<!--separate-->' )
					{
						$result = end( explode( '<!--separate-->', $result ) );
					}
					$res = 'ok<!--separate-->' . $result;
					die( $res );
				}
				
				// oi!
				return 'fail<!--separate-->Could not stat file....';
			}
			// These are highlevel commands! That's why they are called
			// dos actions!
			// TODO: Clean up variable maymen! args->args MUST GO
			else
			{
				// Some standard check's
				$command = false;
				if( $args->command == 'dosaction' && isset( $args->args ) )
					$command = $args->args->action;
				else if( $args->command == 'dosaction' && isset( $args->action ) )
					$command = $args->action;
				else $command = $args->command;
			
				$path = false;
				if( isset( $args->path ) )
					$path = $args->path;
				else if( isset( $args->args->path ) )
					$path = $args->args->path;
				
				switch( $command )
				{
					case 'mount':
						$Logger->log( 'Mounting not needed here.. Always succeed.' );
						die( 'ok' );
					case 'unmount':
						$Logger->log( 'Unmounting not needed here.. Always succeed.' );
						die( 'ok' );
					case 'makedir':
						$path = $this->fixPath( $path );
						
						$spath = end( explode( ':', $path ) );
						$fname = end( explode( '/', $spath ) );
						
						$spath = substr( $path, 0, strlen( $path ) - strlen( $fname ) );
						if( substr( $spath, -1, 1 ) == '/' )
							$spath = substr( $spath, 0, strlen( $spath ) - 1 );
						if( trim( $fname ) && trim( $spath ) ) 
							return $this->createFolder( $fname, $spath );
						return 'fail';
					case 'delete':
						$path = $this->fixPath( $path );
						$fields = array( 'path' => $path );
						if( $result = $this->query( 'deletefile', $fields ) )
							return die( $result );
						// Soon
						return 'fail<!--separate-->Could not delete file...';
					// Move files and folders or a whole volume to another door
					case 'copy':
						if( isset( $args->args ) && isset( $args->args->from ) )
						{
							$Logger->log( 'EXECUTING COPY ' . $args->args->from . ' TO ' . $args->args->to );
							if( $this->copyFile( $args->args->from, $args->args->to ) )
							{
								return 'ok';
							}
						}
						// Other combos not supported yet
						return 'fail';
				}
			}
			return 'fail';
		}
	
		// Gets a file by path!
		function getFile( $path )
		{
			global $User;
		
			if( !$this->login() ) return false;
			
			$tpath = $this->fixPath( $path );
			
			$fields = [ 'path' => $path ];
			
			if( $result = $this->query( 'getfile', $fields ) )
			{
				$d = end( explode( ':', $path ) );
				if( !trim( $d ) )
					return false;
				$d = end( explode( '/', trim( $d ) ) );
				if( !trim( $d ) )
					return false;
				
				$fi = new Object();
				$fi->Type = 'File';
				$fi->MetaType = 'File';
				$fi->Filename = $d;
				$fi->Filesize = filesize( $this->getTmpFile( $path ) );
				$fi->Permissions = new Object();
				
				$fobject = new Object();
				$fobject->Path = $path;
				$fobject->Filename = $fi->Filename;
				$fobject->Filesize = $fi->Filesize;
				$fobject->Type = 'Firegem';
				$fobject->FileInfo = $fi;
				$fobject->Permissions = $fi->Permissions;
				$fobject->Door = $this;
				
				return $fobject;	
			}
			
			// oi
			return false;
		}
	
		// Get the location of a tmp file
		function getTmpFile( $path )
		{
			global $Config, $User;
		
			$fields = [ 'path' => $path ];
		
			if( $result = $this->query( 'filecontent', $fields ) )
			{
				$d = end( explode( ':', $path ) );
				if( !trim( $d ) )
					return false;
				$d = end( explode( '/', trim( $d ) ) );
				if( !trim( $d ) )
					return false;
				$ext = end( explode( '.', $d ) );
				$filename = $d;
				if( trim( $ext ) )
				{
					$filename = substr( $d, 0, strlen( $d ) - ( strlen( $ext ) + 1 ) );
				}
				$num = '';
				while( file_exists( '/tmp/' . $filename . $num . '.' . $ext ) )
					$num = rand( 0,999 );
				
				if( $fp = fopen( $fn = ( '/tmp/' . $filename . $num . '.' . $ext ), 'w+' ) )
				{
					fwrite( $fp, $result );
					fclose( $fp );
					return $fn;
				}
			}
			
			return false;
		}
	
		// Put a file
		function putFile( $path, $fileObject )
		{
			global $Config, $User;
		
			if( !$this->login() ) return false;
		
			if( $tmp = $fileObject->Door->getTmpFile( $fileObject->Path ) )
			{
				// Create the new file with data from tmp file...
				if( $data = file_get_contents( $tmp ) )
				{
					$tpath = $this->fixPath( $path );
				
					$fields = array( 'path' => $tpath, 'content' => $data );

					if( $result = $this->query( 'savefile', $fields ) )
					{
						die( $result .'..' );
						// Remove tmp file
						unlink( $tmp );
						if( $result == 'fail' ) return false;
						return $result;
					}
				}		
			}
			// Remove tmp file
			unlink( $tmp );
			return false;
		}
	
		// Create a folder
		function createFolder( $folderName, $where )
		{
			global $Config, $User, $Logger;

			if( !$this->login() ) return false;
			
			$tpath = $this->fixPath( $where );

			$fields = array( 'path' => $tpath, 'foldername' => $folderName );
		
			if( $result = $this->query( 'makedir', $fields ) )
			{
				die( $result );
			}
			
			return false;
		}
	
		// Not to be used outside! Not public!
		function _deleteFolder( $fo, $recursive = true )
		{
			global $Config, $User, $Logger;
		
			
			return true;
		}
	
		// Deletes a folder, all sub folders and files (optionally)
		function deleteFolder( $path, $recrusive = true )
		{
			global $Config, $User, $Logger;
		
			
		
			return false;
		}
	
		// Delete a file
		function deleteFile( $path )
		{
			global $Config, $User, $Logger;
		
			
			return false;
		}
	}
}

// Create a door...
$door = new DoorFiregem( isset( $path ) ? $path : ( ( isset( $args ) && isset( $args->args ) && $args->args->path ) ? $args->args->path : false ) );

?>
