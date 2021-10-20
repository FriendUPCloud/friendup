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

global $SqlDatabase, $User, $Config, $Logger;


// TODO: Look at this function and see if it's possible to to somehow login to another session as admin and get stuff, shouldn't be done on client side I suppose, will have to be reviewed how admin gets access to other people's stuff without exposing passwords, secrets, sessionid's, etc that potentially is a major security breach ...

$servertoken = false;

$userid = ( !isset( $args->args->userid ) ? $User->ID : 0 );

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( !isset( $args->authid ) )
{
	if( $level == 'Admin' && isset( $args->args->userid ) )
	{
		$userid = $args->args->userid;
	}
}
else
{
	require_once( 'php/include/permissions.php' );

	if( $perm = Permissions( 'read', 'application', ( 'AUTHID'.$args->authid ), [ 
		'PERM_STORAGE_READ_GLOBAL', 'PERM_STORAGE_READ_IN_WORKGROUP', 
		'PERM_STORAGE_GLOBAL',      'PERM_STORAGE_WORKGROUP' 
	] ) )
	{
		if( is_object( $perm ) )
		{
			// Permission denied.
	
			if( $perm->response == -1 )
			{
				
			}
			
			// Permission granted. GLOBAL or WORKGROUP specific ...
	
			if( $perm->response == 1 && isset( $perm->data->users ) && isset( $args->args->userid ) )
			{
		
				// If user has GLOBAL or WORKGROUP access to this user
		
				if( $perm->data->users == '*' || strstr( ','.$perm->data->users.',', ','.$args->args->userid.',' ) )
				{
					$userid = intval( $args->args->userid );
					
					// TODO: Overwrite the users sessionid with a sort of token to get correct disk info returned for this user as admin ... 
					
					if( $User->ID != $userid )
					{
						
						if( $usr = $SqlDatabase->FetchObject( '
							SELECT u.ID, u.Name, u.ServerToken 
							FROM FUser u 
							WHERE u.ID = \'' . $userid . '\' 
							LIMIT 1 
						' ) )
						{
						
							if( $userid != $User->ID )
							{
								$TempUser = $User;
	
								$GLOBALS[ 'User' ] = new dbIO( 'FUser' );
								$User =& $GLOBALS[ 'User' ];
								$User->Load( $userid );
							}
							
							if( $usr->ServerToken )
							{
								$servertoken = $usr->ServerToken;
							}
							
							if( !$servertoken )
							{
								//die( 'fail<!--separate-->{"response":"0","message":"Can\'t login as ['.$usr->ID.'] '.$usr->Name.' missing ServerToken in FUser db table ..."}' );
							}
						}
						
					}
				}
		
			}
		}
	}
}



$p = explode( ':', strtolower( $args->args->path ) );
if( $p[0] == 'system' )
{
	$o = new stdClass();
	$o->Used = 0;
	$o->Filesize = 0;
	die( 'ok<!--separate-->' . json_encode( $o ) );
}

$expl = explode( ':', $args->args->path );
if( $row = $SqlDatabase->FetchObject( '
	SELECT f.* FROM Filesystem f 
	WHERE 
		f.Name=\'' . reset( $expl ) . '\' AND
		( 
			f.UserID=\'' . $userid . '\' OR
			f.GroupID IN (
				SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g
				WHERE 
					g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND
					ug.UserID = \'' . $userid . '\'
			) 
		)
	LIMIT 1
' ) )
{
	
	// TODO: Check this for other disks. the other users sessionid is required right? ...
	
	//$Logger->log( '[1.0] [volumeinfo] : devices/DOSDrivers/' . $row->Type . '/door.php args: ' . print_r( $args,1 ) );
	
	if( $userid == $User->ID && file_exists( $f = ( 'devices/DOSDrivers/' . $row->Type . '/door.php' ) ) )
	{
		//$Logger->log( '[1.1] [volumeinfo] : devices/DOSDrivers/' . $row->Type . '/door.php ' );
		
		include( $f ); $door->dosAction( $args );
	}
	// Experimental, trying to get volume info directly from FriendCore
	else
	{
		// Switch back global User from temporary variable
		if( isset( $TempUser ) )
			$User = $TempUser;
		
		//---------------------- TK-634 ----------------------
		$sessionid = '';
		if( isset( $args->args->sessionid ) )
		{ //various modules supply session id in different places
			$sessionid = $args->args->sessionid;
		}
		else if( isset( $args->sessionid ) )
		{
			$sessionid = $args->sessionid;
		}
		
		// Define local device types
		$LocalTypes = array( 
			'SQLDrive', 'SQLRODrive', 'SQLWorkgroupDrive', 
			'NodeDrive', 'QuickNG', 'Treeroot', 'Website', 'Wordpress', 
			'Assign', 'ArenaCM', 'FriendStoreDrive' 
		);
		
		// TODO: This method will never work, use in_array() instead, but for backwards compatibility I will keep it as is for now ...
		
		if( in_array( $row->Type, $LocalTypes ) )
		{
			//$Logger->log( '[2] [volumeinfo] : devices/DOSDrivers/' . $row->Type . '/door.php args: ' . print_r( $args,1 ) );
			
			// TODO: Sometimes disk_free_space() returns nothing if there is no config data in db ...
			
			$nn = disk_free_space( $row->Path );
			if( $o = json_decode( $row->Config ) )
			{
				if( isset( $o->DiskSize ) )
				{
					switch( strtolower( substr( $o->DiskSize, -3, 3 ) ) )
					{
						case 'kb':
							$nn = substr( $ds, 0, strlen( $ds ) - 2 );
							$nn = intval( $nn, 10 ) * 1000;
							break;
						case 'mb':
							$nn = substr( $ds, 0, strlen( $ds ) - 2 );
							$nn = intval( $nn, 10 ) * 1000 * 1000;
							break;
						case 'gb':
							$nn = substr( $ds, 0, strlen( $ds ) - 2 );
							$nn = intval( $nn, 10 ) * 1000 * 1000 * 1000;
							break;
						case 'tb':
							$nn = substr( $ds, 0, strlen( $ds ) - 2 );
							$nn = intval( $nn, 10 ) * 1000 * 1000 * 1000 * 1000;
							break;
						default:
							$nn = intval( $ds, 10 );
							break;
					}
				}
			}
			$v = new stdClass();
			$v->Volume = $row->Name . ':';
			$v->Used = $row->StoredBytes;
			$v->Filesize = $nn;
			
			die( 'ok<!--separate-->' . json_encode( $v ) );
		}
		else 
		{
					
			$flags = new stdClass();
			$flags->{CURLOPT_FOLLOWLOCATION} = false;
			
			$url = ( $Config->SSLEnable ? 'https://' : 'http://' ) .
				$Config->FCHost . ':' . $Config->FCPort . '/system.library/file/diskinfo/?' . 
				( $servertoken ? 'servertoken=' . $servertoken : 'sessionid=' . $sessionid ) .
				'&path=' . urlencode( $args->args->path );
			
			$res = FriendCall( $url, $flags );
			
			//$Logger->log( '[3] [volumeinfo] : devices/DOSDrivers/' . $row->Type . '/door.php url: ' . $url . ' res: ' . $res . ' args: ' . print_r( $args, 1 ) );
			
			if( $sep = explode( '<!--separate-->', $res ) )
			{
				if( $sep[0] == 'ok' )
				{
					$d = ( json_decode( $res ) ? json_decode( $res ) : json_decode( $sep[1] ) );
					$d->Volume = $row->Name;
					die( 'ok<!--separate-->' . json_encode( $d ) );
				}
				else
				{
					die( 'fail<!--separate-->' . $res . ' -- ' . $url );
				}
			}
			else
			{
				die( 'fail<!--separate-->' . $url );
			}
			die( 'fail<!--separate-->{"response":"0","message":"Unknown filesystem","details":"Bad url response"}' );
		}
		//--------------- end of TK-634 ----------------------

		die( 'fail<!--separate-->{"response":"0","message":"Unknown filesystem"}' );
	}
}
die( 'fail' );

?>
