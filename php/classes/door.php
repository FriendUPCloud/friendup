<?php
/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

require_once( 'dbio.php' );

if( !defined( 'DOOR_SLASH_REPLACEMENT' ) )
{
	// To fix names
	//define( 'DOOR_SLASH_REPLACEMENT', '&#47;' );
	define( 'DOOR_SLASH_REPLACEMENT', '&#124;' );
}

if( !class_exists( 'Door' ) )
{
	class Door extends dbIO
	{	
		// How to authenticate?
		var $_authcontext = null; // authentication key (e.g. sessionid)
		var $_authdata = null; // authentication data (e.g. a sessionid hash)
		var $_user = null; // override user
		var $_userSession = null;
	
		// Construct a Door object
		function __construct( $path = false, $authcontext = false, $authdata = false )
		{
			global $SqlDatabase, $Logger;
		
			$this->dbTable( 'Filesystem' );
			
			// We may wanna do this in the constructor
			if( isset( $authcontext ) && isset( $authdata ) )
			{
				$this->SetAuthContext( $authcontext, $authdata );
			}
		
			$this->GetAuthContextComponent();
		
		    // NB: $path could be the $args object passed, will be parsed in getQuery..
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
	
		// Get the auth mechanism
		function GetAuthContext()
		{
			return $this->_authcontext;
		}
	
		// Set the correct authentication mechanism
		function SetAuthContext( $context, $authdata )
		{
			switch( $context )
			{
				case 'sessionid':
					$this->_authcontext = 'sessionid';
					$this->_authdata = $authdata;
					return true;
				case 'authid':
					$this->_authcontext = 'authid';
					$this->_authdata = $authdata;
					return true;
				case 'servertoken':
					$u = new dbIO( 'FUser' );
					$u->ServerToken = $authdata;
					// Only succeed if we can load the user
					if( $u->Load() )
					{
						$this->_user = $u;
						$this->_authcontext = 'servertoken';
						$this->_authdata = $authdata;
						return true;
					}
					break;
				case 'user':
					$this->_authcontext = 'user';
					$this->_authdata = $authdata;
					break;
			}
			return false;
		}
	
		// Get the right component to add to the server calls
		// $userInfo is optional, and will pull that user's SessionID
		function GetAuthContextComponent( $userInfo = false )
		{
			switch( $this->_authcontext )
			{
				case 'sessionid':
					return 'sessionid=' . $this->_authdata;
				case 'authid':
					return 'authid=' . $this->_authdata;
				case 'servertoken':
					return 'servertoken=' . $this->_authdata;
				default:
					if( isset( $GLOBALS[ 'args' ]->sessionid ) )
					{
						$this->_authcontext = 'sessionid';
						$this->_authdata = $GLOBALS[ 'args' ]->sessionid;
					}
					else if( isset( $GLOBALS[ 'args' ]->authid ) )
					{
						$this->_authcontext = 'authid';
						$this->_authdata = $GLOBALS[ 'args' ]->authid;
					}
					else if( isset( $GLOBALS[ 'args' ]->servertoken ) )
					{
						$this->_authcontext = 'servertoken';
						$this->_authdata = $GLOBALS[ 'args' ]->servertoken;
					}
					else if( $userInfo && isset( $userInfo->SessionID ) )
					{
						$this->_authcontext = 'sessionid';
						$this->_authdata = $userInfo->SessionID;
					}
					return $this->GetAuthContextComponent();
			}
			return false;
		
		}
	
		// Get an object which includes the key and data for authentication
		function GetAuthContextObject( $userInfo = false )
		{
			if( $str = $this->GetAuthContextComponent( $userInfo ) )
			{
				$data = explode( '=', $str );
				if( isset( $data[1] ) )
				{
					$data[0] = substr( $data[0], 1, strlen( $data[0] ) - 1 );
					$key = new stdClass();
					$key->Key = $data[0];
					$key->Data = $data[1];
					return $key;
				}
			}
			return false;
		}
	
		// Get relevant user's session
		function getUserSession()
		{
			global $args, $User, $Logger, $SqlDatabase, $UserSession;
			
			if( !isset( $User->ID ) && !isset( $this->_user ) ) 
			{
				return false;
			}
			
			$activeUserSession = isset( $this->_usersession ) ? $this->_usersession : $UserSession;
			
			// Check for server token and pick session from there
			if( isset( $this->_user ) && isset( $this->_authcontext ) && $this->_authcontext == 'servertoken' )
			{
				if( isset( $this->_authdata ) )
				{
					$Sess = new dbIO( 'FUserSession' );
					$Sess->UserID = $this->_user->ID;
					if( $Sess->Load() && $Sess->UserID = $this->_user->ID )
					{
						$activeUserSession = $Sess;
					}
				}
			}
			
			return $activeUserSession;
		}
	
		// Gets the correct identifier to extract a filesystem
		function getQuery( $path = false )
		{
			global $args, $User, $Logger, $SqlDatabase, $UserSession;
			if( !isset( $User->ID ) && !isset( $this->_user ) ) 
			{
				return false;
			}
		
			// For whom are we calling?
			$activeUser = isset( $this->_user ) ? $this->_user : $User;
			$activeUserSession = $this->getUserSession();
		
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
				// To disable filelog()
				if( isset( $args->args->logger ) )
				{
				    $this->logger = $args->args->logger;
				}
				if( $identifier )
				{
				    $actId = isset( $activeUser->ID ) ? $activeUser->ID : $activeUserSession->UserID;
				
					// TODO: Look at this had to add haccypatchy method to check for $User->ID first in order to view other users Filesystem as Admin server side ...
					// Added user group 'Admin' as an optional way to qualify to read a disk not owned or associated by group
					return '
					SELECT f.* FROM `Filesystem` f, `FUserGroup` ug, `FUserToGroup` fug
					WHERE
					    ug.Type = "Level" AND fug.UserID = \'' . $actId . '\' AND fug.UserGroupID = ug.ID AND
					    ug.Name IN ( "Admin", "User", "API", "Guest" )
					    AND
						(
							ug.Name = \'Admin\' OR
							f.UserID=\'' .$actId . '\' OR
							f.GroupID IN (
								SELECT ug2.UserGroupID FROM FUserToGroup ug2, FUserGroup g
								WHERE 
									g.ID = ug2.UserGroupID AND g.Type = \'Workgroup\' AND
									ug2.UserID = \'' . $actId . '\'
							)
						)
						AND ' . $identifier . ' LIMIT 1';
				}
			}
			// Get by path (string)
			else
			{
				$actId = isset( $activeUser->ID ) ? $activeUser->ID : $activeUserSession->UserID;
				
				$op = explode( ':', $path );
				$name = mysqli_real_escape_string( $SqlDatabase->_link, reset( $op ) );
				// TODO: Look at this had to add haccypatchy method to check for $User->ID first in order to view other users Filesystem as Admin server side ...
				// Added user group 'Admin' as an optional way to qualify to read a disk not owned or associated by group
				return '
					SELECT f.* FROM `Filesystem` f, `FUserGroup` ug, `FUserToGroup` fug
					WHERE
						ug.Type = "Level" AND fug.UserID = \'' . $actId . '\' AND fug.UserGroupID = ug.ID AND
					    ug.Name IN ( "Admin", "User", "API", "Guest" )
					    AND 
						(
							f.UserID=\'' . $actId . '\' OR
							f.GroupID IN (
								SELECT ug2.UserGroupID FROM FUserToGroup ug2, FUserGroup g
								WHERE 
									g.ID = ug2.UserGroupID AND g.Type = \'Workgroup\' AND
									ug2.UserID = \'' . $actId . '\'
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
			global $Config, $User, $SqlDatabase, $Logger, $UserSession;
		
			$activeUser = isset( $this->_user ) ? $this->user : $User;
			$activeUserSession = $this->getUserSession();
		
			// Support auth context
			if( isset( $this->_authdata ) )
			{
				if( !strstr( $query, '?' ) )
				{
					$query .= '?' . $this->GetAuthContextComponent();
				}
				else
				{
					$query .= '&' . $this->GetAuthContextComponent();
				}
			}
			// Default
			else
			{
				if( !strstr( $query, '?' ) )
				{
					$query .= '?sessionid=' . $activeUserSession->SessionID;
				}
				else
				{
					$query .= '&sessionid=' . $activeUserSession->SessionID;
				}
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
		
			/*
				TODO:
				We now have to figure out how to register which products
				are not to be deleted - there is a UniqueID problem which
				needs to be debugged further..
			*/
		
			// Dest is a cleaned up version of the file listing for the destination
		
			$dest = [];
		
			$debug = [];
		
			//$Logger->log( 'Starting to sync here: ' . $pathFrom . ' to ' . $pathTo );
		
			//$Logger->log( 'From ' . $pathFrom );
			//$Logger->log( 'To   ' . $pathTo );
		
			// Destination path ...
			if( $dir = $this->dir( trim( $pathTo ) ) )
			{
				//$Logger->log( '[' . trim( $pathTo ) . '] ' . print_r( $dir, 1 ) );
			
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
			
				// Organize in a dest array with keys on the filenames
				foreach( $dir as $k=>$v )
				{
					// Keep on dest
					if( $v->UniqueID )
					{
						$dest[ $v->UniqueID ] = $v;
						$debug[ $v->UniqueID ] = false;
					}
					else
					{
						//$Logger->log( 'No UniqueID ??? ' . print_r( $v, 1 ) );
					}
				
					$properFilename = str_replace( array( DOOR_SLASH_REPLACEMENT, '/' ), '', trim( $v->Filename ) );
					$dest[ $properFilename ] = $v;
				
					$debug[ $properFilename ] = false;
				
					//$Logger->log( ' -> Map found file (destination): ' . $properFilename . ' and ' . $v->UniqueID . ' | ' . $v->Filename );
					//$Logger->log( ' Whole object: ' . print_r( $v, 1 ) );
				}
				//$Logger->log( 'Done mapping.' );
			}
			unset( $dir ); // Done with mapping to destination
		
			// Source path ... get a directory listing
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
			
			
				$fmod = false; $dmod = false;
			
				// Process directories and files
			
				// Do the copy
				foreach( $dir as $k=>$v )
				{	
					$doCopy = false;
			
					$v->Destination = ( trim( $pathTo ) . trim( $v->Filename ) . ( $v->Type == 'Directory' ? '/' : '' ) );
					if( !trim( $v->Destination ) )
					{
						//$Logger->log( 'No desination in object!' ); //, print_r( $v, 1 ) );
						//die();
					}
			
					$properFilename = str_replace( array( DOOR_SLASH_REPLACEMENT, '/' ), '', trim( $v->Filename ) );
			
					//$Logger->log( 'Checking if we have ' . $properFilename . ' in destination....' );
					//$Logger->log( 'Dump element: ' . print_r( $v, 1 ) );
			
					// Check if the file has been modified (source vs dest)
				
					// Check if the file we are processing are keepers! ------------
					// Check on uniqueid
					if( $v->UniqueID && isset( $dest[ $v->UniqueID ] ) )
					{
						//if( isset( $dest[ $properFilename ]->ID ) )
						//{
						//	$dest[ $properFilename ]->Found = true;
						//	$debug[ $properFilename ] = true;
						//}
						if( isset( $dest[ $v->UniqueID ]->ID ) )
						{
							$dest[ $v->UniqueID ]->Found = true;
							$debug[ $v->UniqueID ] = true;
						}
						if( isset( $v->ID ) )
						{
							$v->Found = true;
						}
						if( isset( $dir[ $k ]->ID ) )
						{
							$dir[ $k ]->Found = true;
						}
					
						$fmod = $v->DateModified; 
						$dmod = $dest[ $v->UniqueID ]->DateModified;
					
						$doCopy = strtotime( $v->DateModified ) > strtotime( $dest[ $v->UniqueID ]->DateModified );
					
						//$Logger->log( 'DUMP:' );
						//$Logger->log( print_r( $dest[ $v->UniqueID ], 1 ) );
					
						//$Logger->log( 'With UniqueID. ' . ( $doCopy ? 'Will copy' : 'Do not copy' ) . ' ' . ( $v->DateModified ? $v->DateModified : '0' ) . ' > ' . $dest[ $v->UniqueID ]->DateModified . ' ' . $v->Path );
					}
					// Check on filename
					else if( isset( $dest[ $properFilename ] ) )
					{
						if( isset( $dest[ $properFilename ]->ID ) )
						{
							$dest[ $properFilename ]->Found = true;
							$debug[ $properFilename ] = true;
						}
						if( isset( $dest[ $v->UniqueID ]->ID ) )
						{
							$dest[ $v->UniqueID ]->Found = true;
							$debug[ $v->UniqueID ] = true;
						}
						if( isset( $v->ID ) )
						{
							$v->Found = true;
						}
						if( isset( $dir[ $k ]->ID ) )
						{
							$dir[ $k ]->Found = true;
						}
					
						$fmod = $v->DateModified; 
						$dmod = $dest[ $properFilename ]->DateModified;
					
						$doCopy = strtotime( $v->DateModified ) > strtotime( $dest[ $properFilename ]->DateModified );
					
						//$Logger->log( ( $doCopy ? 'Will copy' : 'Do not copy' ) . ' ' . ( $v->DateModified ? $v->DateModified : '0' ) . ' > ' . $dest[ $properFilename ]->DateModified . ' ' . $v->Path );
					}
					else
					{
						$doCopy = true;
						//$Logger->log( 'Couldn\'t find proper unique id or filename (' . $properFilename . ') - Checking modified date: ' . $v->DateModified/* . ' ' . $v->Path . ' ' . json_encode( $debug )*/ );
						//$Logger->log( 'Wordpress object: ' . print_r( $dest, 1 ) );
						//die();
					
						$fmod = false; $dmod = false;
					}
					// Done checking for keepers -----------------------------------
				
				
					// If the file was modified, then copy!
				
				
					$isIcon = substr( trim( $v->Filename ), -5, 5 ) == '.info' || substr( trim( $v->Filename ), -8, 8 ) == '.dirinfo';
				
					// We are testing whether we need to skip.' );
					if( $doCopy )
					{
						if( ( $v->Type == 'Directory' || ( $v->Type == 'File' && substr( $v->Filename, -8, 8 ) == '.dirinfo' ) ) && SKIP_CREATE_EXISTING_DIRECTORIES == true && $v->Found == true )
						{
							//$Logger->log( 'Skipping creation of directory that already exists.' );
							continue;
						}
						else if( $v->Type == 'Directory' )
						{
							//$Logger->log( 'We have a directory to create.' );
						}
						else
						{
							//$Logger->log( 'This is a normal file to copy.' );
						}
					
						//$Logger->log( 'From ' . $v->Path );
						//$Logger->log( 'To   ' . $v->Destination );
					
						// Copy from source to destination (that we made proper path for above)
						if( !$isIcon ) $slot = $Logger->addSlot( 'Copying ' . trim( $v->Filename ) . ' ' . ( $fmod && $dmod ? $fmod . ' > ' . $dmod : '' )/* . ' [] ' . print_r( $dest,1 )*/ );
					
						if( $this->copyFile( trim( $v->Path ), trim( $v->Destination ) ) )
						{
							//$dest[ $properFilename ]->Found = true;
							if( isset( $dest[ $v->UniqueID ] ) )
							{
								$dest[ $v->UniqueID ]->Found = true;
							}
							$debug[ $properFilename ] = true;
						
							if( !$isIcon ) $slot->resolve( true, 'Copied' );
						}
						else
						{
							if( !$isIcon ) $slot->resolve( false );
						}
					}
					else
					{
						if( !$isIcon ) $Logger->log( 'Skipping ' . trim( $v->Filename ) );
						//$slot->resolve( true, 'skipped' );
					}
				}
			
				// See if we have destination files / directories that
				// should be deleted because they do not exist in source
				//$Logger->log( 'Checking if we need to delete.' );
				if( count( $dest ) > 0 )
				{
					foreach( $dest as $k=>$des )
					{
					
						$skipDelete = false;
					
						if( $des->Found )
						{
							continue;
						}
						else if( !trim( $des->Path ) )
						{
							//$Logger->log( $des->Filename . ' has no path. Skipping... ' . json_encode( $des ) );
							continue;
						}
					
						$properFilename = str_replace( array( DOOR_SLASH_REPLACEMENT, '/' ), '', trim( $des->Filename ) );
					
						// If this file is not a keeper
						if( /*( !isset( $dest[$properFilename]->Found ) && !( $des->UniqueID && isset( $dest[ $des->UniqueID ] ) ) ) && */$des->Path )
						{
							$isIcon = substr( $des->Filename, -5, 5 ) == '.info' || substr( $des->Filename, -8, 8 ) == '.dirinfo';
						
							if( !$isIcon )
							{
								$slot = $Logger->addSlot( 'Shall we delete ' . trim( $des->Filename ) . '?' );
							
								if( $this->deleteFile( $des->Path ) )
								{
									$slot->resolve( true, 'Delete done [' . ( $des->UniqueID ? 1 : 0 ) . '] ' . ( isset( $dest[ $des->UniqueID ] ) ? 'UniqueID Found' : 'UniqueID Not Found' ) /*print_r( $debug,1 )*/ );
								}
								else
								{
									$slot->resolve( 'skipped' );
								}
							}
							else
							{
								//$slot->resolve( 'skipped' );
							}
						}
					}
				}
			
				// Go through directories and sync files
				//$Logger->log( 'Traversing into subdirectories..........' );
				foreach( $dir as $k=>$v )
				{	
					// Only go into directories that has been marked as "exists"
					if( $v->Type == 'Directory' )
					{
						//$Logger->log( ' -> Entering ' . $v->Destination );
						// We have sub directories
						$this->syncFiles( trim( $v->Path ), trim( $v->Destination ), $log, $depth + 1 );
					}
				}
			
				//$Logger->log( 'Mapping: ' . print_r( $debug,1 ) );
			
				return true;
			}
		
			return false;
		}
	
		function deleteFile( $delpath )
		{
			global $User, $Logger, $UserSession;
		
			$activeUser = isset( $this->_user ) ? $this->_user : $User;
			$activeUserSession = $this->getUserSession();
		
			// 1. Get the filesystem objects
			$ph = explode( ':', $delpath );
			$ph = $ph[0];
		
			if( !trim( $ph ) )
			{
				$Logger->log( 'Tried to load inexistent disk.' );
				return;
			}
		
			$fs = new dbIO( 'Filesystem' );
			$fs->UserID = $activeUserSession->UserID;
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
				
					//$Logger->log( 'couldn\'t deleteFolder... ' . $delpath );
				
					return false;
				}
				// It's a file
				else
				{
					if( $deldoor->_deleteFile( $delpath ) )
					{
						return true;
					}
				
					//$Logger->log( 'couldn\'t deleteFile... ' . $delpath );
				
					return false;
				}
			
				$Logger->log( 'how did we even get here... ' . $delpath );
			
				return false;
			}
		}
	
		function copyFile( $pathFrom, $pathTo )
		{
			global $User, $Logger, $UserSession;
		
			$activeUser = isset( $this->_user ) ? $this->_user : $User;
			$activeUserSession = $this->getUserSession();
		
			// 1. Get the filesystem objects
			$from = explode( ':', $pathFrom ); $from = $from[0];
			$to   = explode( ':', $pathTo   ); $to = $to[0];
		
			//$Logger->log( 'Copying from ' . $pathFrom . ' to ' . $pathTo );
			if( !trim( $pathTo ) )
			{
				$Logger->log( 'Error with path to!' );
				return false;
			}
		
			// Support caching
			if( $this->cacheFrom && $this->cacheFrom->Name == $from )
			{
				$fsFrom = $this->cacheFrom;
			}
			else
			{
				$fsFrom = new dbIO( 'Filesystem' );
				$fsFrom->UserID = $activeUserSession->UserID;
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
				$fsTo->UserID = $activeUserSession->UserID;
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
					if( $this->logger )
    					$doorFrom->logger = $this->logger;
				}
				else
				{
					$path = $pathFrom;
					include( $testFrom );
					$doorFrom = $door;
					if( $this->logger )
    					$doorFrom->logger = $this->logger;
				}
				if( !file_exists( $testTo ) )
				{
					// Use built-in, will work on local.handler
					$doorTo = new Door( $pathTo );
					if( $this->logger )
    					$doorTo->logger = $this->logger;
				}
				else
				{
					$path = $pathTo;
					include( $testTo );
					$doorTo = $door;
					if( $this->logger )
    					$doorTo->logger = $this->logger;
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
						//$Logger->log( 'Creating folder ' . $folderName . ' in ' . $tpath . '..' );
						if( $doorTo->createFolder( $folderName, $tpath ) )
						{
							return true;
						}
						$Logger->log('[DOOR] Couldn\'t create folder (createFolder)... ' . $folderName . ' :: ' . $tpath);
						return false;
					}
				}
				// It's a file
				else
				{
					//$Logger->log( 'Getting file ' . $pathFrom . '..' );
					if( $file = $doorFrom->getFile( $pathFrom ) )
					{
						//$Logger->log( 'Result: ' . print_r( $file, 1 ) );
						//$Logger->log( 'Putting file into ' . $pathTo . '..' );
						if( $doorTo->putFile( $pathTo, $file ) )
						{
							return true;
						}
						$Logger->log('[DOOR] couldn\'t putFile... ' . $pathTo . ' :: ');
					}
				}
				$Logger->log('[DOOR] how did we even get here... ' . $pathFrom . ' :: ' . $pathTo);
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
				if( $this->logger )
    				$file->logger = $this->logger;
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
}

?>
