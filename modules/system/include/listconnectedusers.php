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

// List all users by connection to workgroup
if( $rows = $SqlDatabase->FetchObjects( '
	SELECT 
		u.ID, u.Name, u.Fullname, u.Email 
	FROM 
		FUser u, FUserToGroup mygroup, FUserToGroup theirgroup, FUserGroup myg, FUserGroup theyg
	WHERE
		myg.Type        =   "Workgroup" AND
		theyg.Type     =   "Workgroup" AND
		mygroup.UserID      =   ' . $User->ID . ' AND
		theirgroup.UserID   =   u.ID AND
		mygroup.UserGroupID =   theirgroup.UserGroupID AND
		u.ID                != ' . $User->ID . ' AND
		theyg.ID            =   theirgroup.UserGroupID AND
		myg.ID              =   mygroup.UserGroupID
	GROUP BY u.ID
' ) )
{
	die( 'ok<!--separate-->' . json_encode( $rows ) );
}
die( 'fail<!--separate-->{"response":-1,"message":"No workgroup related users connected to you."}' );

?>
