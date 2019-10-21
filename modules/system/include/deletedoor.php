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

$userid = $User->ID;

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( !isset( $args->authid ) )
{
	//admins can delete others users mounts...
	if( $level == 'Admin' && isset( $args->args->userid ) )
	{
		$userid = intval( $args->args->userid );
	}
}
else
{
	require_once( 'php/include/permissions.php' );
	
	if( $perm = Permissions( 'delete', 'application', ( 'AUTHID'.$args->authid ), [ 'PERM_STORAGE_GLOBAL', 'PERM_STORAGE_WORKGROUP' ], 'user', ( isset( $args->args->userid ) ? $args->args->userid : $userid ) ) )
	{
		if( is_object( $perm ) )
		{
			// Permission denied.
		
			if( $perm->response == -1 )
			{
				die( 'fail<!--separate-->{"response":"deletedoor failed"}'  );
			}
		
			// Permission granted. GLOBAL or WORKGROUP specific ...
		
			if( $perm->response == 1 )
			{
				// If user has GLOBAL or WORKGROUP access to this user
			
				if( isset( $args->args->userid ) && $args->args->userid )
				{
					$userid = intval( $args->args->userid );
				}
			}
		}
	}
}


$q = false;
if( isset( $args->args->id ) )
{
	$q = '
		SELECT * FROM Filesystem
		WHERE
			UserID=\'' . $userid . '\' AND ID=\'' . intval( $args->args->id ) . '\'
		LIMIT 1
	';
}
else if( isset( $args->args->devname ) )
{
	$q = '
		SELECT * FROM Filesystem
		WHERE
			UserID=\'' . $userid . '\' AND `Name`="' . 
				mysqli_real_escape_string( $SqlDatabase->_link, trim( $args->args->devname ) ) . '"
		LIMIT 1
	';
}
if( $q )
{
	if( $row = $SqlDatabase->FetchObject( $q ) )
	{
		if( !$User->SessionID )
		{
			die( 'fail<!--separate-->{"response":"deletedoor failed"}'  ); // print_r( $User, 1 )  ???
		}

		// Delete encryption keys if they exist
		if( $row->ID > 0 )
		{
			$k = new DbIO( 'FKeys' );
			$k->RowType         = 'Filesystem';
			$k->RowID           = $row->ID;
			$k->UserID          = $userid;
			$k->IsDeleted 		= 0;
			if( $k->Load() ) $k->Delete();
		}

		include_once( 'php/classes/door.php' );

		if( $userid == $User->ID )
		{
			$door = new Door( $row->Name . ':' );
			$door->dosQuery( '/system.library/device/unmount?devname=' . $row->Name );
		}

		$q = false;
		if( isset( $args->args->id ) )
		{
			$q = '
				DELETE FROM 
					`Filesystem`
				WHERE UserID=\'' . $userid . '\' AND ID=\'' . intval( $args->args->id, 10 ) . '\'
			';
		}
		else if( isset( $args->args->devname ) )
		{
			$q = '
				DELETE FROM 
					`Filesystem`
				WHERE UserID=\'' . $userid . '\' AND `Name`="' . 
						mysqli_real_escape_string( $SqlDatabase->_link, trim( $args->args->devname ) ) . '"
			';
		}

		if( $q )
		{
			$SqlDatabase->Query( $q );
			die( 'ok<!--separate-->{"message":"Successfully deleted disk.","response":1}' );
		}
	}
	die( 'fail<!--separate-->{"message":"Could not find disk.","response":-1,"q":"' . addslashes( $q ) . '"}' );
}

?>
