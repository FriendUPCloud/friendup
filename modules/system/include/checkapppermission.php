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

include_once( 'php/include/permissions.php' );

if( CheckAppPermission( $args->args->key, $args->args->appname ) )
{
	die( 'ok<!--separate-->{"message":"Permission granted.","response":1}' );	
}

die( 'fail<!--separate-->{"message":"Permission denied.","response":-1}' );


?>
