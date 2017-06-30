<?php
/*©lpgl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Lesser General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Lesser General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/


global $Logger;

require_once( 'php/classes/door.php' );

// Device activation
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
			$o->Save();
			
			// Remount disk
			// TODO: Make this work (modules sometimes return 404)
			if( $o->Mounted )
			{
				$Logger->log( '[ActivateApplication] Refreshing drive permissions.' );
				$d = new Door( $deviceName . ':' );
				$d->dosQuery( '/system.library/device/unmount?devname=' . $deviceName );
				$d->dosQuery( '/system.library/device/mount?devname=' . $deviceName );
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
