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

/**
 * Get app permissions
 *
 * Gets the permissions for a specific application, optionally for a user other
 * than the user who is logged in by session id.
**/
function GetAppPermissions( $appName, $UserID = false )
{
	global $SqlDatabase, $User;
	
	if( !$appName ) return false;

	// Specific or session based userid?
	$UserID = ( $UserID ? $UserID : $User->ID );
	
	// Fetch permissions from user based on role relations
	if( $rows = $SqlDatabase->FetchObjects( '
		SELECT 
			p.*, 
			ug.Name AS RoleName, 
			ug2.ID AS GroupID, 
			ug2.Type AS GroupType, 
			ug2.Name AS GroupName 
		FROM 
			FUserToGroup fug,
			FUserGroup ug, 
			FUserGroup ug2, 
			FUserRolePermission p 
		WHERE 
				fug.UserID = ' . $UserID . ' 
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
			AND ug2.ID = fug.UserGroupID 
			And p.RoleID = ug.ID 
			AND p.Key ' . ( strstr( $appName, '","' ) ? 'IN (' . $appName . ')' : '= "' . $appName . '"' ) . ' 
		ORDER BY 
			p.ID 
	' ) )
	{
		$found = false; 
		
		$wgs = new stdClass();
		$pem = new stdClass();
		
		// Fetch workgroups where user is a member
		if( $wgroups = $SqlDatabase->FetchObjects( $q2 = '
			SELECT 
				g.ID, g.Name, g.ParentID, g.UserID, u.UserID AS WorkgroupUserID 
			FROM 
				FUserGroup g, 
				FUserToGroup u 
			WHERE 
					g.Type = \'Workgroup\' 
				AND u.UserID = \'' . $UserID . '\' 
				AND u.UserGroupID = g.ID 
			ORDER BY 
				g.Name ASC 
		' ) )
		{
			foreach( $wgroups as $wg )
			{
				$wgs->{ $wg->ID } = $wg;
			}
		}
		
		// Go through all roles and set permissions
		foreach( $rows as $v )
		{
			if( $v->Permission )
			{
				$found = true;
				
				// If this key is already set
				if( isset( $pem->{ $v->Permission } ) )
				{
					// If the element is an object, convert to array
					if( !is_array( $pem->{ $v->Permission } ) )
					{
						$pem->{ $v->Permission } = array( $pem->{ $v->Permission } );
					}
					
					$pem->{ $v->Permission }[] = $v;
				}
				// Just set key with value
				else
				{
					$pem->{ $v->Permission } = $v;
				}
			}
		}
		
		if( $found )
		{
			return $pem;
		}
	}
	
	return false;
}


if( $User->ID > 0 && isset( $args->args->applicationName ) && $args->args->applicationName )
{
	if( $pem = GetAppPermissions( $args->args->applicationName ) )
	{
		die( 'ok<!--separate-->' . json_encode( $pem ) );
	}
	
}

die( 'fail' );

?>
