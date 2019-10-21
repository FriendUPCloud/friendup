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
				die('fail<!--separate-->unauthorised access attempt!');
			}
		
			// Permission granted. GLOBAL or WORKGROUP specific ...
		
			if( $perm->response == 1 )
			{
				// If user has GLOBAL or WORKGROUP access to this user
			
				if( isset( $args->args->userid ) && $args->args->userid )
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


// some checks for correctness of request before we do stuff...
if( !isset( $obj->Type ) ) die('fail<!--separate-->{"response":"add file system failed"}' );
if( !file_exists( $fn = 'devices/DOSDrivers/' . $obj->Type . '/sysinfo.json' ) )	die('fail<!--seperate-->could not read config for chosen file system');

$o = file_get_contents( $fn );
if( !( $o = json_decode( $o ) ) ) die('fail<!--seperate-->could not read config for chosen file system');

// Admin filesystems can only be added by admin..
if( $o->group == 'Admin' && $level != 'Admin' )
	die('fail<!--separate-->unauthorised access attempt!');

// we are allows to get here.
if( isset( $obj->Name ) && strlen( $obj->Name ) > 0 )
{
	// Support workgroups (that we are member of)!
	$groupID = '';
	if( isset( $args->args->Workgroup ) )
	{
		if( $group = $SqlDatabase->FetchObject( '
			SELECT ug.* FROM FUserGroup ug
				WHERE ug.Name = "' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->Workgroup ) . '"
				AND ug.Type = "Workgroup"
		' ) )
		{
			$groupID = $group->ID;
		}
	}

	// TODO: Add support for storing EncryptedKey with PublicKey connected to user

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

	$fs = new DbIO( 'Filesystem' );

	$fs->Name = $obj->Name;
	$fs->UserID = ( $level == 'Admin' && $obj->UserID ? $obj->UserID : $userid );
	$fs->GroupID = $groupID;
	if( !$fs->Load() )
	{
		$keys = array( 'Server', 'Name', 'Path', 'Type', 'ShortDescription', 'Username', 'Password', 'Mounted', 'PrivateKey', 'KeysID' );
		foreach( $keys as $kkey )
			if( !isset( $obj->$kkey ) )
				$obj->$kkey = '';
		
		$f = new DbIO( 'Filesystem' );
		$f->Name             = mysqli_real_escape_string( $SqlDatabase->_link, $obj->Name );
		$f->UserID           = ( $level == 'Admin' && $obj->UserID ? $obj->UserID : $userid );
		$f->GroupID          = $groupID;
		$f->KeysID           = $obj->KeysID;
		$f->Server           = mysqli_real_escape_string( $SqlDatabase->_link, $obj->Server );
		$f->Port             = intval( $obj->Port, 10 );
		$f->Path             = mysqli_real_escape_string( $SqlDatabase->_link, $obj->Path );
		$f->Type             = mysqli_real_escape_string( $SqlDatabase->_link, $obj->Type );
		$f->ShortDescription = mysqli_real_escape_string( $SqlDatabase->_link, $obj->ShortDescription );
		$f->Username         = mysqli_real_escape_string( $SqlDatabase->_link, $obj->Username );
		$f->Password         = mysqli_real_escape_string( $SqlDatabase->_link, $obj->Password );
		$f->Mounted          = mysqli_real_escape_string( $SqlDatabase->_link, isset( $obj->Mounted ) ? $obj->Mounted : '' );
		$f->Config           = mysqli_real_escape_string( $SqlDatabase->_link, json_encode( $config ) );
		$f->Save();

		if( $f->ID > 0 && isset( $obj->EncryptedKey ) )
		{
			// Don't use this ...
			/*$k = new DbIO( 'FKeys' );
			$k->RowType         = 'Filesystem';
			$k->RowID           = $f->ID;
			$k->UserID          = ( $level == 'Admin' && $obj->UserID ? $obj->UserID : $userid );
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

		die( 'ok' );
	}
	die( 'fail<!--separate-->{"response":"add file system failed"}'  );
}

?>
