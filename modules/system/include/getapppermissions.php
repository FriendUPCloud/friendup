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

global $SqlDatabase, $User;

if( $User->ID > 0 && isset( $args->args->applicationName ) && $args->args->applicationName )
{
	// TODO: Fix support for user and group role at the same time ... A bug makes it not work atm ... have to fix when time allows for it.
	
	// Function GetAppPermissions() is in php/friend.php
	
	if( $pem = GetAppPermissions( $args->args->applicationName ) )
	{
		die( 'ok<!--separate-->' . json_encode( $pem ) );
	}
	
}

die( 'fail' );

?>
