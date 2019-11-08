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

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( isset( $args->authid ) )
{
	require_once( 'php/include/permissions.php' );
	
	if( $perm = Permissions( 'write', 'application', ( 'AUTHID'.$args->authid ), [ 'PERM_USER_GLOBAL', 'PERM_USER_WORKGROUP' ] ) )
	{
		if( is_object( $perm ) )
		{
			// Permission denied.
			
			if( $perm->response == -1 )
			{
				//
				
				//die( 'fail<!--separate-->' . json_encode( $perm ) );
			}
			
			// Permission granted.
			
			if( $perm->response == 1 )
			{
				
				$level = 'Admin';
				
			}
		}
	}
}



if( $level == 'Admin' )
{
	// Make sure we have the "User" type group
	$g = new dbIO( 'FUserGroup' );
	$g->Name = 'User';
	$g->Load();
	$g->Save();

	if( $g->ID > 0 )
	{
		// Create the new user
		$u = new dbIO( 'FUser' );
		$u->Password = md5( rand(0,999) + microtime() );
		$u->Name = 'Unnamed user';
		$u->FullName = 'Unnamed user';
		$u->Save();

		if( $u->ID > 0 )
		{
			$SqlDatabase->query( 'INSERT INTO FUserToGroup ( UserID, UserGroupID ) VALUES ( \'' . $u->ID . '\', \'' . $g->ID . '\' )' );
			die( 'ok<!--separate-->' . $u->ID );
		}
	}
}
die( 'fail<!--separate-->{"response":"user add failed"}'  );

?>
