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

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

require_once( 'php/include/permissions.php' );

if( $User->ID > 0 && ( isset( $args->args->applicationName ) && $args->args->applicationName || $args->authid ) )
{
	if( $pem = GetAppPermissions( $args->args->applicationName ? $args->args->applicationName : ( 'AUTHID'.$args->authid ) ) )
	{
		die( 'ok<!--separate-->' . json_encode( $pem ) );
	}
	
}

die( 'fail' );

?>
