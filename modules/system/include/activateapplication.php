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

global $Logger;

require_once( 'php/classes/door.php' );

// Disk activation
if( strstr( $args->args->application, ':' ) )
{
	$deviceName = reset( explode( ':', $args->args->application ) );
	$o = new dbIO( 'Filesystem' );
	$o->Name = $deviceName;
	$o->UserID = $User->ID;
	
	if( $o->Load() )
	{
		if( isset( $args->args->permissions ) && is_array( $args->args->permissions ) )
		{
			$perms = [];
			foreach( $args->args->permissions as $p )
			{
				$rw = [];
				for( $a = 1; $a < count( $p ); $a++ )
				{
					$rw[$a-1] = $p[$a];
				}
				$perms[] = $rw;
			}
	
			// Generate permission block for device
			$data = new stdClass();
			$data->domain = $args->args->domain;
			$data->permissions = $perms;
			$data->authid = md5( rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) . $o->ID . $o->Name );
			$o->Config = json_encode( $data );
			$o->AuthID = $data->authid;
			$o->Save();
			
			// Remount disk
			// TODO: Make this work (modules sometimes return 404)
			if( $o->Mounted )
			{
				$Logger->log( '[ActivateApplication] Refreshing drive permissions.' );
				$d = new Door( $deviceName . ':' );
			}
			else
			{
				$Logger->log( '[ActivateApplication] Not refreshing drive permissions.' );
			}
			
			die( 'ok<!--separate-->' );
		}
	}
	die( 'fail' );
}
// Application activation
else if( $row = $SqlDatabase->FetchObject( '
	SELECT * FROM FApplication WHERE `Name` = "' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->application ) . '" AND UserID=\'' . $User->ID . '\' 
' ) )
{
	if( isset( $args->args->permissions ) && is_array( $args->args->permissions ) )
	{
		$perms = [];
		foreach( $args->args->permissions as $p )
		{
			$rw = [];
			for( $a = 1; $a < count( $p ); $a++ )
			{
				$rw[$a-1] = $p[$a];
			}
			$perms[] = $rw;
		}
	
		$data = new stdClass();
		$data->domain = $args->args->domain;
	
		// Collect permissions in a string
		$app = new dbIO( 'FUserApplication' );
		$app->ApplicationID = $row->ID;
		$app->UserID = $User->ID;
		$app->AuthID = md5( rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) . $row->ID );
		$app->Permissions = json_encode( $perms );
		$app->Data = json_encode( $data );
		$app->Save();
		die( 'ok<!--separate-->' );
	}
}
die( 'fail<!--separate-->activate app failed' );

?>
