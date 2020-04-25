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

global $SqlDatabase, $Logger, $User;

// TODO: Could be authid is banned!? =)
if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

// Some checks!
if( !$args->args->userid )
{
	die( 'fail<!--separate-->{"message":"Missing userid to share item.","response":"-1"}' );
}

// Sharing to a new temporary user?
if( $args->args->userid == 'new' )
{
	// TODO: Create user
	die( 'fail<!--separate-->{"message":"Unable to create new share user.","response":"-1"}' );
	//$args->args->userid = $newuser->ID;
}

// Check if the user exists
if( $user = $SqlDatabase->fetchObject( 'SELECT * FROM FUser WHERE ID=\'' . intval( $args->args->userid, 10 ) . '\'' ) )
{
	// Check if the shared drive exists
	if( !$sharedrive->ID )
	{
		die( 'fail<!--separate-->{"message":"Could not share item - no sharing target.","response":"-1"}' );
	}
}
else
{
	die( 'fail<!--separate-->{"message":"This user or workgroup does not exist.","response":"-1"}' );
}

if( isset( $args->args->type ) )
{
	switch( $args->args->type )
	{
		case 'file':
			
			break;
		case 'application':
			break;
	}
}


die( 'fail<!--separate-->{"message":"Could not share item.","response":"-1"}' );

?>
