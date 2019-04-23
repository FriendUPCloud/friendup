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
	global $SqlDatabase, $User;
	
	$permissions = GetAppPermissions( $appName );
	
	if( isset( $permissions->{ $key } ) && $permissions->{ $key } )
	{
		return $permissions->{ $key };
	}
	else
	{
		// Get user level
		if( $level = $SqlDatabase->FetchObject( '
			SELECT g.Name FROM FUserGroup g, FUserToGroup ug
			WHERE
				g.Type = \'Level\' AND
				ug.UserID=\'' . $User->ID . '\' AND
				ug.UserGroupID = g.ID
		' ) )
		{
			// If User is SuperAdmin just return true
			if( $level->Name == 'Admin' )
			{
				return true;
			}
		}
	}
	
	return false;
}

?>
