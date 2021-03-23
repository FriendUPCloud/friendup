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
	
	if( $perm = Permissions( 'read', 'application', ( 'AUTHID'.$args->authid ), 'TEMPLATE_READ' ) )
	{
		if( is_object( $perm ) )
		{
			// Permission denied.
		
			if( $perm->response == -1 )
			{
				die( 'fail<!--separate-->{"message":"'.$perm->message.'",'.($perm->reason?'"reason":"'.$perm->reason.'",':'').'"response":'.$perm->response.'}' );
			}
		
			// Permission granted. 
		
			if( $perm->response == 1 )
			{
				$level = 'Admin';
			}
		}
	}
}

// Only admins can get workgroups by id!
if( $level == 'Admin' && $args->args->id )
{
	if( $row = $SqlDatabase->FetchObject( '
		SELECT g.ID, g.Name, g.Description, s.Data 
		FROM `FUserGroup` g, `FSetting` s 
		WHERE g.ID = \'' . $args->args->id . '\' AND g.Type = \'Setup\'
		AND s.UserID = g.ID AND s.Type = \'setup\' AND s.Key = \'usergroup\' 
		ORDER BY g.Name ASC 
	' ) )
	{
		die( 'ok<!--separate-->' . json_encode( $row ) );
	}
}
die( 'fail' );

?>
