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

// TODO: For scaling, allow search parameters!

// Get own workgroups
if( $workgroups = $SqlDatabase->FetchObjects( '
	SELECT ug.ID FROM FUserGroup ug, FUserToGroup fug 
	WHERE 
		    fug.UserID=\'' . $User->ID . '\'
		AND fug.UserGroupID = ug.ID
' ) )
{
	$ids = [];
	foreach( $workgroups as $wg )
	{
		$ids[] = $wg->ID;
	}

	// List all users by connection to workgroup
	if( $rows = $SqlDatabase->FetchObjects( '
		SELECT 
			u.ID, u.Name, u.Fullname, u.Email FROM FUser u
		WHERE
			u.ID IN ( 
				SELECT i.UserID FROM FUserToGroup i, FUserGroup ug WHERE ug.Type = "Workgroup" AND ug.ID IN ( ' . implode( ',', $ids ) . ' )
			)
	' ) )
	{
		die( 'ok<!--separate-->' . json_encode( $rows ) );
	}
}
die( 'fail<!--separate-->{"response":-1,"message":"No workgroup related users connected to you."}' );

?>
