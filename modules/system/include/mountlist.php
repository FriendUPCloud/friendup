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

// 
$userid = ( !isset( $args->args->userid ) ? $User->ID : 0 );

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( !isset( $args->authid ) )
{
	if( $level == 'Admin' && $args->args->userid )
	{
		$userid = $args->args->userid;
	}
}
else
{
	require_once( 'php/include/permissions.php' );
	
	if( $perm = Permissions( 'read', 'application', ( 'AUTHID'.$args->authid ), [ 'PERM_STORAGE_GLOBAL', 'PERM_STORAGE_WORKGROUP' ] ) )
	{
		if( is_object( $perm ) )
		{
			// Permission denied.
		
			if( $perm->response == -1 )
			{
				//die( 'fail<!--separate-->no filesystems available<!--separate-->' . mysql_error() );
			}
		
			// Permission granted. GLOBAL or WORKGROUP specific ...
		
			if( $perm->response == 1 && isset( $perm->data->users ) && isset( $args->args->userid ) )
			{
			
				// If user has GLOBAL or WORKGROUP access to this user
			
				if( $perm->data->users == '*' || strstr( ','.$perm->data->users.',', ','.$args->args->userid.',' ) )
				{
					$userid = intval( $args->args->userid );
				}
			
			}
		}
	}
}



if( $rows = $SqlDatabase->FetchObjects( '
	SELECT f.* FROM Filesystem f
	WHERE
		(
			f.UserID=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $userid ) . '\' OR
			f.GroupID IN (
				SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g
				WHERE
					g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND
					ug.UserID = \'' . $userid . '\'
			)
		)
		' . ( isset( $args->args->type ) ? '
		AND f.Type = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->type ) . '\'
		' : '' ) . ( isset( $args->args->mounted ) ? '
		AND f.Mounted = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->mounted ) . '\'
		' : '' ) . '
	ORDER BY
		f.Name ASC
' ) )
{
	// Let's censor some data..
	foreach( $rows as $k=>$v )
	{
		$rows[$k]->Username = '';
		$rows[$k]->Password = '';
	}
	die( 'ok<!--separate-->' . json_encode( $rows ) );
}
else
{
	die( 'fail<!--separate-->no filesystems available<!--separate-->' . mysql_error() );
}

?>
