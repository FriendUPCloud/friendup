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

$ecpt = '';
if( isset( $args->args->except ) )
{
	foreach( $args->args->except as $k=>$v )
		$args->args->except[$k] = intval( $v, 10 );
	$ecpt = "\n\t\t" . 'AND u.ID NOT IN ( ' . implode( ', ', $args->args->except ) . ')' . "\n";
}

$keyz = '';
if( isset( $args->args->keywords ) )
{
	$args->args->keywords = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->keywords );
	$keyz = "\n\t\t" . 'AND ( u.Name LIKE ( "%' . $args->args->keywords . '%" ) OR u.Fullname LIKE "%' . $args->args->keywords . '%" )' . "\n";
}

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
		myg.ID              =   mygroup.UserGroupID' . $ecpt . $keyz . '
	GROUP BY u.ID
	ORDER BY ( u.ID != \'' . $User->ID . '\' ), u.Fullname ASC
';

// Get members of a group I am connected to
if( isset( $args->args->groupId ) )
{
	if( $args->args->groupId == '0' )
		die( 'fail<!--separate-->' );
		
	$query =  '
		SELECT 
			u.ID, u.Name, u.Fullname, u.Email 
		FROM 
			FUser u, FUserToGroup mygroup, FUserToGroup theygroup, FUserGroup ug
		WHERE
			u.ID = theygroup.UserID AND
			ug.ID = theygroup.UserGroupID AND
			theygroup.UserGroupID = \'' . intval( $args->args->groupId, 10 ) . '\' AND
			mygroup.UserGroupID = theygroup.UserGroupID AND
			( mygroup.UserID = \'' . $User->ID . '\' OR ug.UserID = \'' . $User->ID . '\' ) ' . $ecpt . $keyz . '
		GROUP BY u.ID
		ORDER BY ( u.ID != \'' . $User->ID . '\' ), u.Fullname ASC
	';
}

if( isset( $args->args->limit ) )
{
	// Herer we have limit + 1 to always load the next page (to check if there is an extra page)
	$limit = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->limit + 1 );
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
die( 'fail<!--separate-->{"response":-1,"message":"No workgroup related users connected to you."}' . $query );

?>
