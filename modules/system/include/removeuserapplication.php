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

global $SqlDatabase;

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( !isset( $args->authid ) )
{
	$userid = ( $level == 'Admin' && isset( $args->args->userid ) ? $args->args->userid : $User->ID );
}
else
{
	require_once( 'php/include/permissions.php' );
	
	$userid = ( !isset( $args->args->userid ) ? $User->ID : 0 );
	
	if( $perm = Permissions( 'delete', 'application', ( 'AUTHID'.$args->authid ), [ 
		'PERM_APPLICATION_DELETE_GLOBAL', 'PERM_APPLICATION_DELETE_IN_WORKGROUP', 
		'PERM_APPLICATION_GLOBAL',        'PERM_APPLICATION_WORKGROUP' 
	] ) )
	{
		if( is_object( $perm ) )
		{
			// Permission denied.
			
			if( $perm->response == -1 )
			{
				//
			
				die( 'fail<!--separate-->{"message":"'.$perm->message.'",'.($perm->reason?'"reason":"'.$perm->reason.'",':'').'"response":'.$perm->response.'}' );
			}
		
			// Permission granted. GLOBAL or WORKGROUP specific ...
		
			if( $perm->response == 1 && isset( $perm->data->users ) && isset( $args->args->userid ) )
			{
			
				// If user has GLOBAL or WORKGROUP access to this user
			
				if( $perm->data->users == '*' || strstr( ','.$perm->data->users.',', ','.$args->args->userid.',' ) )
				{
					$userid = intval( $args->args->userid );
				}
			
			}
		}
	}
}



if( isset( $args->args->application ) && $args->args->application )
{
	$l = new DbIO( 'FApplication' );
	$l->Name = $args->args->application;
	$l->UserID = $userid;
	if( $l->Load() )
	{
		if( $SqlDatabase->query( 'DELETE FROM `FUserApplication` WHERE `UserID`=\'' . $l->UserID . '\' AND `ApplicationID`=\'' . $l->ID . '\'' ) )
		{
			$l->Delete();
		}
		die( 'ok' );
	}
}
die( 'fail' );

?>
