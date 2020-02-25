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

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( !isset( $args->authid ) )
{
	// Must be admin
	if( $level != 'Admin' ) die( '404' );
}
else
{
	require_once( 'php/include/permissions.php' );

	if( $perm = Permissions( 'write', 'application', ( 'AUTHID'.$args->authid ), [ 'PERM_ROLE_GLOBAL', 'PERM_ROLE_WORKGROUP' ] ) )
	{
		if( is_object( $perm ) )
		{
			// Permission denied.
		
			if( $perm->response == -1 )
			{
				//
			
				die( 'fail<!--separate-->{"message":"'.$perm->message.'",'.($perm->reason?'"reason":"'.$perm->reason.'",':'').'"response":'.$perm->response.'}' );
			}
		
		}
	}
}



if( !isset( $args->args->name ) )
{
	die( 'fail<!--separate-->{"message":"Please specify a name for your role.","response":-1}' );
}
	
$d = new dbIO( 'FUserGroup' );
$d->Type = 'Role';
$d->Name = trim( $args->args->name );
if( $d->Load() )
{
	die( 'fail<!--separate-->{"message":"Role already exists.","response":-1}' );
}
$d->Save();
if( $d->ID > 0 )
{
	die( 'ok<!--separate-->{"message":"Role created.","response":1}' );
}

die( 'fail' );

?>
