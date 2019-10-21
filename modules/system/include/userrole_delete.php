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

	if( $perm = Permissions( 'delete', 'application', ( 'AUTHID'.$args->authid ), [ 'PERM_ROLE_GLOBAL', 'PERM_ROLE_WORKGROUP' ] ) )
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



if( !isset( $args->args->name ) && !isset( $args->args->id ) )
{
	die( 'fail<!--separate-->{"message":"Please specify the name or id of your role.","response":-1}' );
}
	
$d = new dbIO( 'FUserGroup' );

if( isset( $args->args->id ) )
{
	$d->Load( $args->args->id );
}
else
{
	$d->Type = 'Role';
	$d->Name = trim( $args->args->name );
	$d->Load();
}

if( $d->ID > 0 )
{
	$d->delete();
	die( 'ok<!--separate-->' . json_encode( $d ) );
	die( 'ok<!--separate-->{"message":"Role deleted.","response":1}' );
}

die( 'fail<!--separate-->{"message":"Role not found.","response":-1}' );

?>
