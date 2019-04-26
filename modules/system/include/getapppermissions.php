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

require_once( 'php/include/permissions.php' );

if( $User->ID > 0 && isset( $args->args->applicationName ) && $args->args->applicationName )
{
	if( $pem = GetAppPermissions( $args->args->applicationName ) )
	{
		die( 'ok<!--separate-->' . json_encode( $pem ) );
	}
	
}

die( 'fail' );

?>
