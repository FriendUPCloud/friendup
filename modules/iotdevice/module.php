<?php

/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

// Intermediary module to abstract some system stuff!
include_once( 'php/friend.php' );

// TODO: Remove this - place in install procedure
if( isset( $args->command ) && $args->command == 'listdevices' )
{
	$t = new dbTable( 'FIOTDevice' );
	if( !$t->load() )
	{
		$SqlDatabase->query( '
			CREATE TABLE FIOTDevice
			(
				ID bigint(20) NOT NULL auto_increment,
				UserID bigint(20),
				DeviceID bigint(20),
				`Key` varchar(255),
				`Value` varchar(255),
				PRIMARY KEY(ID)
			)
		' );
	}
}

if( isset( $args->command ) )
{
	switch( $args->command )
	{
		case 'setsetting':
			require( 'modules/iotdevice/include/setsetting.php' );
			break;
		case 'getsetting':
			require( 'modules/iotdevice/include/getsetting.php' );
			break;
		case 'connect':
			if( $row = $SqlDatabase->fetchObject( '
				SELECT * FROM FIOTDevice d WHERE d.ID=\'' . $args->args->id . '\'
			' ) )
			{
				$con = new stdClass();
				$con->userId = $row->UserID;
				$con->deviceId = $row->DeviceID;
				die( 'ok<!--separate-->' . json_encode( $con ) );
			}
			die( 'fail' );
			break;
		case 'data':
			if( $rows = $SqlDatabase->fetchObjects( '
				SELECT * FROM FIOTDevice d WHERE d.DeviceID=\'' . $args->args->deviceId . '\' AND d.UserID=\'' . $args->args->userId . '\'
			' ) )
			{
				$d = new stdClass();
				foreach( $rows as $row )
				{
					$k = ucfirst( $row->Key );
					$d->$k = $row->Value;
				}
				die( 'ok<!--separate-->' . json_encode( $d ) );
			}
			die( 'fail' );
			break;
		case 'listdevices':
			if( $rows = $SqlDatabase->fetchObjects( '
				SELECT d.*, u.Name FROM FIOTDevice d LEFT JOIN FUser u ON ( u.ID = d.UserID )
				GROUP BY d.UserID
			' ) )
			{
				$out = 'ok<!--separate-->';
				$k = [];
				foreach( $rows as $row )
				{
					if( in_array( $row->DeviceID . '.' . $row->UserID, $found ) ) continue;
					$found[] = $row->DeviceID . '.' . $row->UserID;
					$o = new stdClass();
					$o->Id = $row->ID;
					$o->DeviceId = $row->DeviceID;
					$o->Username = $row->Name;
					$k[] = $o;
				}
				die( $out . json_encode( $k ) );
			}
			die( 'fail' );
			break;
	}
}
die( 'fail<!--separate-->Nothing happened..' );

?>
