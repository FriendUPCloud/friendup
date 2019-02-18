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

if( isset( $args->args->permission ) )
{
	if( $row = $SqlDatabase->fetchRow( '
		SELECT p.*, us.Name AS RoleName FROM FUser us, FUserToGroup fug, FUserGroup ug, FUserRolePermission p
		WHERE
			p.RoleID = ug.ID AND fug.UserID = us.ID AND fug.GroupID = ug.ID AND p.Name = "' . $args->args->permission . '"
	' ) )
	{
		die( 'ok<!--separate-->{"message":"Permission granted.","response":1,"role":"' . $row[ 'RoleName' ] . '"}' );
	}

}
die( 'fail<!--separate-->{"message":"Permission denied.","response":-1}' );


?>
