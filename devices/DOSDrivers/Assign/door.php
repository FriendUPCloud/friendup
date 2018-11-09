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

if( !class_exists( 'DoorAssign' ) )
{
	class DoorAssign extends Door
	{	
		function onConstruct()
		{
			global $args, $Config;
			$this->fileInfo = isset( $args->fileInfo ) ? $args->fileInfo : new stdClass();
			$this->assignRootpaths = []; // here we have all the rootpaths we're using
			$this->paths = explode( ';', $this->Path );
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
				$someOk = false;
				$files = [];
				
				// Get the path w/o the volume name
				$requestPath = end( explode( ':', $args->path ) );
				if( !$requestPath ) $requestPath = '';
				
				foreach( $this->paths as $lpath )
				{
					$subpath = end( explode( ':', $lpath ) );
					$spathlen = strlen( $subpath );
					$lpath .= $requestPath;
					
					$p = file_get_contents( $this->rootPath . 'system.library/file/dir/?sessionid=' . $this->sessionid . '&path=' . $lpath );
					list( $r, $d ) = explode( '<!--separate-->', $p );
					if( $r == 'ok' )
					{
						$someOk = true;
						$list = json_decode( $d );
						if( count( $list ) )
						{
							foreach( $list as $k=>$v )
							{
								$list[$k]->Path = $this->Name . ':' . substr( $v->Path, $spathlen, strlen( $v->Path ) - $spathlen );
							}
							$files = array_merge( $files, $list );
						}
					}
				}
				
				if( $someOk )
				{
					if( count( $files ) )
					{
						die( 'ok<!--separate-->' . json_encode( $files ) );
					}
					die( 'ok<!--separate-->[]' );
				}
				// Invalid path
				die( 'fail<!--separate-->' );
			}
			else if( $args->command == 'call' )
			{
				//
				
				if( strstr( $args->path, ':wisdom.library' ) )
				{
					
					//
					
					$someOk = false;
					$files = [];
					$paths = [];
					$res   = [];
					
					$context = false;
					
					if( $args->args )
					{
						$postdata = http_build_query(
							array(
								'args' => json_encode( $args->args )
							)
						);
						
						$opts = array( 'http' =>
							array(
								'method'  => 'POST', 
								'header'  => 'Content-type: application/x-www-form-urlencoded', 
								'content' => $postdata 
							)
						);
						
						$context  = stream_context_create( $opts );
					}
					
					// TODO: combine the paths on PHP level instead of on the client
					
					// Get the path w/o the volume name
					$requestPath = end( explode( ':', $args->path ) );
					if( !$requestPath ) $requestPath = '';
					
					foreach( $this->paths as $lpath )
					{
						$subpath = end( explode( ':', $lpath ) );
						$spathlen = strlen( $subpath );
						$lpath .= $requestPath;
						
						$res[] = $p = file_get_contents( $paths[] = ( $this->rootPath . 'system.library/file/call?sessionid=' . $this->sessionid . '&path=' . $lpath ), false, $context );
						list( $r, $d ) = explode( '<!--separate-->', $p );
						if( $r == 'ok' )
						{
							$someOk = true;
							$list = json_decode( $d );
							if( count( $list ) )
							{
								foreach( $list as $k=>$v )
								{
									$list[$k]->Path = $this->Name . ':' . substr( $v->Path, $spathlen, strlen( $v->Path ) - $spathlen );
								}
								$files = array_merge( $files, $list );
							}
						}
					}
					
					if( $someOk )
					{
						if( count( $files ) )
						{
							die( 'ok<!--separate-->' . json_encode( $files ) );
						}
						die( 'ok<!--separate-->[]' );
					}
					
					// Invalid path
					die( 'fail<!--separate-->{"response":"invalid path"}' );
					//die( 'fail<!--separate-->Invalid path: ' . implode( ', ', $paths ) . ' || ' . implode( ', ', $res ) . ' || ' . print_r( $args,1 ) . ' || ' . print_r( $opts,1 ) );
					
				}
				
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
				// Get the path w/o the volume name
				$requestPath = end( explode( ':', $args->path ) );
				if( !$requestPath ) $requestPath = '';
				$paths = '';
				
				foreach( $this->paths as $lpath )
				{
					$lpathlen = strlen( $lpath );
					$lpath .= $requestPath;
					if( $data = file_get_contents( $this->rootPath . 'system.library/file/info/?sessionid=' . $this->sessionid . '&path=' . $lpath, 'r' ) )
					{
						if( ( $jdata = reset( explode( '<!--separate-->', $data ) ) == 'ok' ) )
						{
							// If we're getting back JSON data...
							/*if( $json = json_decode( $jdata ) )
							{
								// Error with data!
								if( $json->Path == null ) continue;
							}*/
							$Logger->log( 'We found the file: ' . $lpath );
							if( $f = fopen( $this->rootPath . 'system.library/file/read/?sessionid=' . $this->sessionid . '&path=' . $lpath . '&mode=rs', 'r' ) )
							{
								while( $data = fread( $f, 512000 ) )
								{
									//$Logger->log( 'Reading bytes..' );
									echo( $data );
								}
								fclose( $f );
								die();
							}
						}
					}
				}
				
				return 'fail<!--separate-->{"response":"could not read file"}';
				// Could not read file: ' . $Config->FCUpload . $fn . '<!--separate-->' . print_r( $f, 1 );
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
						die( 'ok' );
					case 'unmount':
						$Logger->log( 'Unmounting not needed here.. Always succeed.' );
						die( 'ok' );
					case 'rename':
						die( 'fail<!--separate-->Could not find file!' );
						break;
					case 'makedir':
						die( 'fail<!--separate-->' );
						//die( 'fail<!--separate-->why: ' . print_r( $args, 1 ) . '(' . $path . ')' );
						break;
					case 'delete':
						// Other combos not supported yet
						return 'fail';
					// Move files and folders or a whole volume to another door
					case 'copy':
						$from = isset( $args->from ) ? $args->from : ( isset( $args->args->from ) ? $args->args->from : false );
						$to   = isset( $args->to )   ? $args->to   : ( isset( $args->args->to )   ? $args->args->to   : false );
						$Logger->log( "Attempting to copy from $from to $to.." );
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
$door = new DoorAssign( isset( $path ) ? $path : ( ( isset( $args ) && isset( $args->args ) && $args->args->path ) ? $args->args->path : false ) );

?>
