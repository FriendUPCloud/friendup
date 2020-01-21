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

if( isset( $args->args->userid ) && !isset( $args->userid ) )
{
	$args->userid = $args->args->userid;
}

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( !isset( $args->authid ) )
{
	$userid = ( $level == 'Admin' && isset( $args->userid ) ? $args->userid : $User->ID );
}
else
{
	
	require_once( 'php/include/permissions.php' );
	
	$userid = ( !isset( $args->userid ) ? $User->ID : 0 );
	
	// Only check permissions if userid is defined ...
	if( isset( $args->userid ) )
	{
		if( $perm = Permissions( 'write', 'application', ( 'AUTHID'.$args->authid ), [ 'PERM_USER_GLOBAL', 'PERM_USER_WORKGROUP' ], 'user', ( isset( $args->userid ) ? $args->userid : $User->ID ) ) )
		{
			if( is_object( $perm ) )
			{
				// Permission denied.
		
				if( $perm->response == -1 )
				{
					//
					
					die( 'fail<!--separate-->'.json_encode($perm) );
				}
				
				// Permission granted. GLOBAL or WORKGROUP specific ...
				
				if( $perm->response == 1 && isset( $perm->data->users ) && isset( $args->userid ) )
				{
			
					// If user has GLOBAL or WORKGROUP access to this user
			
					if( $perm->data->users == '*' || strstr( ','.$perm->data->users.',', ','.$args->userid.',' ) )
					{
						$userid = intval( $args->userid );
					}
				
				}
		
			}
		}
	}
}

// TODO: Create code to copy file from Admin's Home: folder to the user's folder and set the users wallpaper if the admin has access ...

die( print_r( $args,1 ) . ' -- ' );


?>
