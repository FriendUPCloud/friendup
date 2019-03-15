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
	
	if( $rows = $SqlDatabase->FetchObjects( $q = /*'
		SELECT 
			p.*, 
			ug.Name AS RoleName 
		FROM 
			FUserToGroup fug, 
			FUserGroup ug, 
			FUserRolePermission p 
		WHERE 
				fug.UserID = ' . $User->ID . ' 
			AND	ug.ID = fug.UserGroupID 
			AND ug.Type = "Role" 
			And p.RoleID = ug.ID 
			AND p.Key = "' . $args->args->applicationName . '" 
		ORDER BY 
			p.ID 
	'*/'
		SELECT 
			p.*, 
			ug.Name AS RoleName 
		FROM 
			FUserToGroup fug, 
			FUserGroup ug, 
			FUserRolePermission p 
		WHERE 
				fug.UserID = ' . $User->ID . ' 
			AND 
			(
				(	
					ug.ID = fug.UserGroupID 
				)
				OR
				(
					ug.ID = ( SELECT fgg.ToGroupID FROM FGroupToGroup fgg WHERE fgg.FromGroupID = fug.UserGroupID )
				) 
			)
			AND ug.Type = "Role" 
			And p.RoleID = ug.ID 
			AND p.Key = "' . $args->args->applicationName . '" 
		GROUP BY 
			p.ID 
		ORDER BY 
			p.ID 
	' ) )
	{
		$pem = new stdClass();
		
		foreach( $rows as $v )
		{
			if( $v->Permission && $v->Data == 'Activated' )
			{
				// TODO: Add some useful info here if needed ... { "id": 22, "name": "Read", "description": "" }
				
				$pem->{ $v->Permission } = new stdClass;
			}
		}
		
		die( 'ok<!--separate-->' . json_encode( $pem ) );
	}
	
}

die( 'fail ' . $q );

?>
