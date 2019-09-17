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

global $SqlDatabase, $User, $Config;

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
			f.UserID=\'' . $User->ID . '\' OR
			f.GroupID IN (
				SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g
				WHERE 
					g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND
					ug.UserID = \'' . $User->ID . '\'
			) 
		)
	LIMIT 1
' ) )
{
	if( file_exists( $f = ( 'devices/DOSDrivers/' . $row->Type . '/door.php' ) ) )
	{
		include( $f ); $door->dosAction( $args );
	}
	// Experimental, trying to get volume info directly from FriendCore
	else
	{
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
			'SQLDrive', 'SQLRODrive', 'SQLWorkgroupDrive', 'Local', 
			'NodeDrive', 'QuickNG', 'Treeroot', 'Website', 'Wordpress', 
			'Assign', 'ArenaCM', 'FriendStoreDrive' 
		);
		
		if( array_search( $row->Type, $LocalTypes ) )
		{
			$nn = disk_free_space( $row->Path );
			if( $o = json_decode( $row->Config ) )
			{
				if( isset( $o->DiskSize ) )
				{
					switch( strtolower( substr( $o->DiskSize, -3, 3 ) ) )
					{
						case 'kb':
							$nn = substr( $ds, 0, strlen( $ds ) - 2 );
							$nn = intval( $nn, 10 ) * 1024;
							break;
						case 'mb':
							$nn = substr( $ds, 0, strlen( $ds ) - 2 );
							$nn = intval( $nn, 10 ) * 1024 * 1024;
							break;
						case 'gb':
							$nn = substr( $ds, 0, strlen( $ds ) - 2 );
							$nn = intval( $nn, 10 ) * 1024 * 1024 * 1024;
							break;
						case 'tb':
							$nn = substr( $ds, 0, strlen( $ds ) - 2 );
							$nn = intval( $nn, 10 ) * 1024 * 1024 * 1024 * 1024;
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
				$Config->FCHost . ':' . $Config->FCPort . '/system.library/file/diskinfo/?sessionid=' . $sessionid .
				'&path=' . urlencode( $args->args->path );
			
			$res = FriendCall( $url, $flags );
			if( $sep = explode( '<!--separate-->', $res ) )
			{
				if( $sep[0] == 'ok' )
				{
					$d = json_decode( $res );
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
