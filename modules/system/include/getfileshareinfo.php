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

// Get information about a share path
if( isset( $args->args->mode ) && $args->args->mode == 'sharepath' )
{
	// My own share with specific user
	if( strstr( $args->args->path, '/' ) )
	{
		$filename = explode( ':', $args->args->path );
		$components = explode( '/', $filename );
		$path = $components[0];
		$filename = $components[1];
	}
	// My own share generally
	else
	{
		$filename = explode( ':', $args->args->path );
		$filename = $filename[1];
		$Logger->log( 'Filename: ' . $filename );
		$users = $SqlDatabase->fetchObjects( '
			SELECT u.ID as `id`, "user" as `type`, u.Fullname AS `name` FROM FShared s, FUser u WHERE
				s.OwnerUserID=\'' . intval( $User->ID, 10 ) . '\' AND
				s.SharedType = \'user\' AND
				s.SharedID = u.ID AND
				(
					s.Data LIKE "%:' . mysqli_real_escape_string( $SqlDatabase->_link, $filename ) . '"
					OR
					s.Data LIKE "%/' . mysqli_real_escape_string( $SqlDatabase->_link, $filename ) . '"
				)
		' );

		$groups = $SqlDatabase->fetchObjects( '
			SELECT s.* FROM FShared s WHERE
				SELECT g.ID as `id`, "group" as `type`, g.Name AS `name` FROM FShared s, FUserGroup g WHERE
				s.OwnerUserID=\'' . intval( $User->ID, 10 ) . '\' AND
				s.SharedType = \'group\' AND
				s.SharedID = g.ID AND
				(
					s.Data LIKE "%:' . mysqli_real_escape_string( $SqlDatabase->_link, $filename ) . '"
					OR
					s.Data LIKE "%/' . mysqli_real_escape_string( $SqlDatabase->_link, $filename ) . '"
				)
		' );
	}
}
// Get information about a real path
else
{
	$users = $SqlDatabase->fetchObjects( '
		SELECT u.ID as `id`, "user" as `type`, u.Fullname AS `name` FROM FShared s, FUser u WHERE
			s.OwnerUserID=\'' . intval( $User->ID, 10 ) . '\' AND
			s.SharedType = \'user\' AND
			s.SharedID = u.ID AND
			s.Data="' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->path ) . '"
	' );

	$groups = $SqlDatabase->fetchObjects( $q = '
		SELECT g.ID as `id`, "group" as `type`, g.Name AS `name` FROM FShared s, FUserGroup g WHERE
			s.OwnerUserID=\'' . intval( $User->ID, 10 ) . '\' AND
			s.SharedType = \'group\' AND
			s.SharedID = g.ID AND
			s.Data="' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->path ) . '"
	' );
	$Logger->log( $q );
}

if( $users || $groups )
{
	if( $users && $groups )
		$rows = array_merge( $groups, $users );
	else if( $users ) $rows = $users;
	else if( $groups ) $rows = $groups;
	die( 'ok<!--separate-->' . json_encode( $rows ) );
}

die( 'fail<!--separate-->{"message":"No file share info found.","response":"-1"}' );

?>
