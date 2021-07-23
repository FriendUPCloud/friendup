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

$query =  '
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
';

// Get members of a group I am connected to
if( isset( $args->args->groupid ) )
{
	$query =  '
		SELECT 
			u.ID, u.Name, u.Fullname, u.Email 
		FROM 
			FUser u, FUserToGroup mygroup, FUserToGroup theygroup
		WHERE
			u.ID = theygroup.UserID AND
			theygroup.UserGroupID = \'' . intval( $args->args->groupid, 10 ) . '\' AND
			mygroup.UserGroupID = theygroup.UserGroupID AND
			mygroup.UserID = \'' . $User->ID . '\' AND
			u.ID != \'' . $User->ID . '\'
		GROUP BY u.ID
	';
}

if( isset( $args->args->limit ) )
{
	$limit = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->limit );
	$pos = '0';
	if( isset( $args->args->pos ) )
		$pos = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->pos );
	$query .= 'LIMIT ' . $pos . ', ' . $limit;
}


// List all users by connection to workgroup
if( $rows = $SqlDatabase->FetchObjects( $query ) )
{
	die( 'ok<!--separate-->' . json_encode( $rows ) );
}
die( 'fail<!--separate-->{"response":-1,"message":"No workgroup related users connected to you."}' );

?>
