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

require_once( 'php/include/permissions.php' );


// TODO: Permissions!!! Only list out when you have users below your
//                      level, unless you are Admin

$permission = false;
			
// TODO: Make this permissions handling more general for the whole system at some point, and beautify it.

if( $pobj = CheckAppPermission( 'PERM_USER_GLOBAL', 'Admin' ) )
{
	$permission = 'Global';
}
else if( $pobj = CheckAppPermission( 'PERM_USER_WORKGROUP', 'Admin' ) )
{
	$uids = '';
	
	if( is_array( $pobj ) )
	{
		foreach( $pobj as $po )
		{
			if( $po->Data )
			{
				if( $uds = $SqlDatabase->FetchObjects( '
					SELECT 
						ug.UserID, g.Name AS Workgroup 
					FROM 
						`FUserGroup` g, 
						`FUserToGroup` ug 
					WHERE 
							g.ID IN (' . $po->Data . ') 
						AND g.Type = "Workgroup" 
						AND ug.UserGroupID = g.ID 
					ORDER BY 
						ug.UserID ASC 
				' ) )
				{
					foreach( $uds as $v )
					{
						$uids = ( $uids ? ( $uids . ',' ) : '' ) . $v->UserID;
					}
				}
			}
		}
	}
	else if( $pobj->Data )
	{
		if( $uds = $SqlDatabase->FetchObjects( '
			SELECT 
				ug.UserID, g.Name AS Workgroup 
			FROM 
				`FUserGroup` g, 
				`FUserToGroup` ug 
			WHERE 
					g.ID IN (' . $pobj->Data . ') 
				AND g.Type = "Workgroup" 
				AND ug.UserGroupID = g.ID 
			ORDER BY 
				ug.UserID ASC 
		' ) )
		{
			foreach( $uds as $v )
			{
				$uids = ( $uids ? ( $uids . ',' ) : '' ) . $v->UserID;
			}
		}
	}
	
	// UserID's in the Workgroups this user has access to ...
		
	if( $args->args == false || $args->args == 'false' )
	{
		$args->args = new stdClass();
	}
	
	$args->args->userid = $uids;
	
	if( $args->args->userid )
	{
		$permission = 'Workgroup';
	}
}



if( !$permission && $level != 'Admin' )
{
	die('fail<!--separate-->{"response":"list users failed Error 1"}' );
}

if( $users = $SqlDatabase->FetchObjects( '
	SELECT u.*, g.Name AS `Level` FROM 
		`FUser` u, `FUserGroup` g, `FUserToGroup` ug 
	WHERE 
		    u.ID = ug.UserID 
		AND g.ID = ug.UserGroupID 
		AND g.Type = "Level" 
		' . ( isset( $args->args->userid ) && $args->args->userid ? '
		AND u.ID IN (' . $args->args->userid . ') 
		' : '' ) . '
		' . ( isset( $args->args->query ) && $args->args->query ? '
		AND 
		(
			( 
				u.Fullname LIKE "' . trim( $args->args->query ) . '%" 
			) 
			OR 
			( 
				u.Name LIKE "' . trim( $args->args->query ) . '%" 
			) 
			OR 
			( 
				u.Email LIKE "' . trim( $args->args->query ) . '%" 
			) 
		)' : '' ) . '
	GROUP 
		BY u.ID, g.Name 
	ORDER BY 
		u.FullName ASC 
	' . ( isset( $args->args->limit ) && $args->args->limit ? '
	LIMIT ' . $args->args->limit . ' 
	' : '' ) . '
' ) )
{
	$out = [];
	foreach( $users as $u )
	{
		$keys = [ 'ID', 'Name', 'Password', 'FullName', 'Email', 'CreatedTime', 'Level', 'UniqueID' ];
		$o = new stdClass();
		foreach( $keys as $key )
		{
			$o->$key = $u->$key;
		}
		$out[] = $o;
	}
	
	if( isset( $args->args->count ) && $args->args->count )
	{
		$count = $SqlDatabase->FetchObject( 'SELECT COUNT( DISTINCT( u.ID ) ) AS Num FROM FUser u, FUserToGroup tg WHERE u.ID = tg.UserID ' );
		$out['Count'] = ( $count ? $count->Num : 0 );
	}
	
	die( 'ok<!--separate-->' . json_encode( $out ) );
}
die( 'fail<!--separate-->{"response":"list users failed Error 2"}'  );

?>
