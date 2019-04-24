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

function CheckAppPermission( $key, $appName )
{
	global $SqlDatabase, $User, $level;
	
	if( $level == 'Admin' ) return true;
	
	$permissions = GetAppPermissions( $appName );
	
	if( isset( $permissions->{ $key } ) && $permissions->{ $key } )
	{
		return $permissions->{ $key };
	}
	
	return false;
}

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
			// Link to wgs for quick lookups
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
					$pem->{ $v->Permission }[] = $v;
				}
				// Just set key with value
				else
				{
					$pem->{ $v->Permission } = array( $v );
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

/**
 * Determine if the user may have access here through a role
 * This function allows abstract permission checks which may require the
 * system to test multiple permissions depending on object $type and permission
 * type. But it makes it much more elegant for developers who need to use the 
 * system in their own code.
**/
function CheckPermission( $type, $identifier, $permission = false )
{
	global $SqlDatabase;
	
	// Permission on user
	if( $type == 'user' )
	{	
		// Check if the user has global user's access
		if( $rpermTest = CheckAppPermission( 'PERM_USER_GLOBAL', 'Admin' ) )
		{
			return true;
		}
		// Check if the user has access to a user through workgroups
		else if( $rpermTest = CheckAppPermission( 'PERM_USER_WORKGROUP', 'Admin' ) )
		{
			// Create the correct SQL
			$workgroups = array();
			foreach( $rpermTest as $t )
			{
				if( isset( $t->Data ) )
				{
					$workgroups[] = $t->Data;
				}
			}
			if( $test = $SqlDatabase->FetchObject( '
				SELECT u.ID FROM 
					FUser u,
					FUserToGroup ug,
					FUserGroup g
				WHERE
					u.ID = \'' . $identifier . '\' AND
					ug.UserID = u.ID AND
					ug.UserGroupID = g.ID AND
					g.ID IN ( ' . implode( ',', $workgroups ) . ' )
			' ) )
			{
				return true;
			}
		}
	}
	return false;
}

?>
