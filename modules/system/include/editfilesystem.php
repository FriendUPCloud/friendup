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

$obj = $args->args;

$userid = $User->ID;

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

/* 1) check for permissions to execute stuff ==== --- ## ==== --- ## ==== --- ## ==== --- ## ==== --- ## ==== --- ## */
if( !isset( $args->authid ) )
{
	if( $level == 'Admin' && $args->args->userid )
	{
		$userid = $args->args->userid;
	}
}
else
{
	require_once( 'php/include/permissions.php' );
	if( $perm = Permissions( 'write', 'application', ( 'AUTHID'.$args->authid ), [ 'PERM_STORAGE_GLOBAL', 'PERM_STORAGE_WORKGROUP' ], 'user', ( isset( $args->args->userid ) ? $args->args->userid : $userid ) ) )
	{
		if( is_object( $perm ) )
		{
			// Permission denied.
			if( $perm->response == -1 )
			{
				die('fail<!--separate-->{"response":"0","message":"unauthorised access attempt"}');
			}
		
			// Permission granted. GLOBAL or WORKGROUP specific ...
			if( $perm->response == 1 )
			{
				// If user has GLOBAL or WORKGROUP access to this user
				if( isset( $args->args->userid ) )
				{
					$userid = intval( $args->args->userid );
				}
			
				// If we have GLOBAL Access
				if( isset( $perm->data->users ) && $perm->data->users == '*' )
				{
					$level = 'Admin';
				}
			}
		}
	}
}


/* 2) check for valid input ==== --- ## ==== --- ## ==== --- ## ==== --- ## ==== --- ## ==== --- ## */

// some checks for correctness of request before we do stuff...
if( !isset( $obj->Type ) ) die('fail<!--separate-->{"response":"edit filesystem failed"}' );
if( !file_exists( $fn = 'devices/DOSDrivers/' . $obj->Type . '/sysinfo.json' ) )	die('fail<!--seperate-->could not read config for chosen file system');

$o = file_get_contents( $fn );
if( !( $o = json_decode( $o ) ) ) die('fail<!--seperate-->could not read config for chosen file system');


// Admin filesystems can only be added by admin..
if( $o->group == 'Admin' && $level != 'Admin' )
	die('fail<!--separate-->{"response":"0","message":"unauthorised access attempt"}');

/* 3) execute change ==== --- ## ==== --- ## ==== --- ## ==== --- ## ==== --- ## ==== --- ## */
if( isset( $obj->ID ) && $obj->ID > 0 )
{
	// Support workgroups
	$groupID = ( isset( $args->args->WorkgroupID ) && $args->args->WorkgroupID ? $args->args->WorkgroupID : '0' );
	if( !$groupID && ( $group = $SqlDatabase->FetchObject( '
		SELECT ug.* FROM FUserGroup ug
			WHERE ug.Name = "' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->Workgroup ) . '"
			AND ug.Type = "Workgroup"
	' ) ) )
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
	
	// No diskspace??
	if( !isset( $config->DiskSize ) || !$config->DiskSize || intval( $config->DiskSize, 10 ) < 0 || !trim( $config->DiskSize ) )
	{
		die( 'fail<!--separate-->{"response":-1,"message":"Could not save disk with zero diskspace."}' );
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
