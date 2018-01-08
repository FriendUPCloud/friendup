<?php
/*©lgpl*************************************************************************
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
$obj = $args->args;

$userid = $User->ID;
if( $level == 'Admin' && $args->args->userid )
{
	$userid = $args->args->userid;
}

// some checks for correctness of request before we do stuff...
if( !isset( $obj->Type ) ) die('fail<!--separate-->{"response":"edit filesystem failed"}' );
if( !file_exists( $fn = 'devices/DOSDrivers/' . $obj->Type . '/sysinfo.json' ) )	die('fail<!--seperate-->could not read config for chosen file system');

$o = file_get_contents( $fn );
if( !( $o = json_decode( $o ) ) ) die('fail<!--seperate-->could not read config for chosen file system');

// Admin filesystems can only be added by admin..
if( $o->group == 'Admin' && $level != 'Admin' )
	die('fail<!--separate-->{"response":"0","message":"unauthorised access attempt"}');

if( isset( $obj->ID ) && $obj->ID > 0 )
{
	// Support workgroups (that we are member of)!
	$groupID = '0';
	if( $group = $SqlDatabase->FetchObject( '
		SELECT ug.* FROM FUserGroup ug, FUserToGroup tg
			WHERE ug.Name = "' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->Workgroup ) . '"
			AND ug.Type = "Workgroup"
			AND tg.UserGroupID = ug.ID
			AND tg.UserID = \'' . $userid . '\'
	' ) )
	{
		$groupID = $group->ID;
	}

	// TODO: Add support for updating EncryptedKey with PublicKey connected to user

	// Set optional or extra args
	$config = new stdClass();
	foreach( $obj as $k=>$v )
	{
		if( substr( $k, 0, 5 ) == 'conf.' )
		{
			$key = end( explode( '.', $k ) );
			$config->$key = $v;
		}
	}

	$SqlDatabase->query( $q = '
	UPDATE Filesystem
		SET `Name` = "' . mysqli_real_escape_string( $SqlDatabase->_link, $obj->Name ) . '",
		`UserID` = "' . $userid . '",
		`GroupID` = "' . $groupID . '",
		`KeysID` = "' . $obj->KeysID . '",
		`Server` = "' . mysqli_real_escape_string( $SqlDatabase->_link, $obj->Server ) . '",
		`Port` = "' . mysqli_real_escape_string( $SqlDatabase->_link, $obj->Port ) . '",
		`Path` = "' . mysqli_real_escape_string( $SqlDatabase->_link, $obj->Path ) . '",
		' . ( isset( $obj->Type ) ? ( '`Type` = "' . mysqli_real_escape_string( $SqlDatabase->_link, $obj->Type ) . '",' ) : '' ) . '
		`ShortDescription` = "' . mysqli_real_escape_string( $SqlDatabase->_link, $obj->ShortDescription ) . '",
		`Username` = "' . mysqli_real_escape_string( $SqlDatabase->_link, $obj->Username ) . '",
		'. ( isset($obj->Password) && $obj->Password != '' ? '`Password` = "' . mysqli_real_escape_string( $SqlDatabase->_link, $obj->Password ) . '",' : '' ) . '
		`Mounted` = "0",
		`Config` = "' . mysqli_real_escape_string( $SqlDatabase->_link, json_encode( $config ) ) . '"
	WHERE
		ID = \'' . intval( $obj->ID, 10 ) . '\'
	' );

	if( $obj->ID > 0 && isset( $obj->EncryptedKey ) )
	{
		// Don't use this ...
		/*$k = new DbIO( 'FKeys' );
		$k->RowType         = 'Filesystem';
		$k->RowID           = intval( $obj->ID, 10 );
		$k->UserID          = $userid;
		$k->IsDeleted 		= 0;
		if( !$k->Load() )
		{
			$k->DateCreated = date( 'Y-m-d H:i:s' );
		}
		$k->Type 			= $obj->Name;
		$k->Data            = $obj->EncryptedKey;
		$k->PublicKey       = $obj->PublicKey;
		$k->DateModified    = date( 'Y-m-d H:i:s' );
		$k->Save();*/
	}

	die( 'ok<!--separate-->' . $SqlDatabase->_lastError );
}
die( 'fail<!--separate-->{"response":"edit fs failed"}'  );

?>
