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




/*// TODO: Permissions!!! Only list out when you have users below your
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
	
	foreach( $pobj as $po )
	{
		if( $po->Data )
		{
			if( $uds = $SqlDatabase->FetchObjects( $q = '
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
}*/

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( !isset( $args->authid ) )
{
	if( /*!$permission && */$level != 'Admin' )
	{
		die('fail<!--separate-->{"response":"-1", "message":"list users failed Error 1"}' );
	}
	
	// TODO: Have to look into not being to specific if this module call is used other places for listing users then the Admin app ...
}
else 
{
	require_once( 'php/include/permissions.php' );
	
	if( $perm = Permissions( 'read', 'application', ( 'AUTHID'.$args->authid ), [ 'PERM_USER_GLOBAL', 'PERM_USER_WORKGROUP' ] ) )
	{
		if( is_object( $perm ) )
		{
			// Permission denied.
		
			if( $perm->response == -1 )
			{
				die( print_r( $perm,1 ). ' -- ' );
				die( 'fail<!--separate-->{"response":"-1", "message":"list users failed Error 1"}' );
			}
		
			// Permission granted. GLOBAL or WORKGROUP specific ...
		
			if( $perm->response == 1 && isset( $perm->data->users ) && $perm->data->users != '*' )
			{
				// UserID's in the Workgroups this user has access to ...
			
				if( $args->args == false || $args->args == 'false' )
				{
					$args->args = new stdClass();
				}
			
				$args->args->userid = $perm->data->users;
			}
		}
	}
}


// TODO: Create searchby komma separated so one can specify what to search by ...

// TODO: Divide into 3 calls to see if it can speed up the process ...

switch( $args->args->mode )
{
	
	case 'logintime':
		
		//'( SELECT l.LoginTime FROM `FUserLogin` l WHERE l.UserID = u.ID AND l.Information = "Login success" ORDER BY l.ID DESC LIMIT 1 )'
		
		if( isset( $args->args->userid ) && $args->args->userid )
		{
			if( $arr = $SqlDatabase->FetchObjects( $q = '
				SELECT l.UserID, l.LoginTime 
				FROM `FUserLogin` l 
				WHERE l.UserID IN (' . $args->args->userid . ') 
				AND l.Information = "Login success" 
				ORDER BY l.ID DESC 
			' ) )
			{
				$out = [];
				
				foreach( $arr as $o )
				{
					if( $o->UserID > 0 && !$out[$o->UserID] )
					{
						$out[$o->UserID] = $o;
					}
				}
				
				die( 'ok<!--separate-->' . json_encode( $out ) );
			}
		}
		
		break;
	
	
	case 'count':
		
		if( isset( $args->args->count ) && $args->args->count )
		{
			$out = [];
			
			$count = $SqlDatabase->FetchObject( 'SELECT COUNT( DISTINCT( u.ID ) ) AS Num FROM FUser u, FUserToGroup tg WHERE u.ID = tg.UserID ' );
			$out['Count'] = ( $count ? $count->Num : 0 );
			
			die( 'ok<!--separate-->' . json_encode( $out ) );
		}
		
		break;
	
	default:
		
		if( $users = $SqlDatabase->FetchObjects( $q = '
			SELECT 
				u.*, g.Name AS `Level`, "0" AS `LoginTime` 
			FROM 
				`FUser` u, 
				`FUserGroup` g, 
				`FUserToGroup` ug 
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
					' . ( !isset( $args->args->searchby ) || $args->args->searchby == 'FullName' ? '
					( 
						u.Fullname LIKE "' . trim( $args->args->query ) . '%" 
					) 
					' . ( !isset( $args->args->searchby ) ? 'OR ' : '' ) : '' )
					 .  ( !isset( $args->args->searchby ) || $args->args->searchby == 'Name' ? '
					( 
						u.Name LIKE "' . trim( $args->args->query ) . '%" 
					) 
					' . ( !isset( $args->args->searchby ) ? 'OR ' : '' ) : '' )
					 .  ( !isset( $args->args->searchby ) || $args->args->searchby == 'Email' ? '
					( 
						u.Email LIKE "' . trim( $args->args->query ) . '%" 
					) ' : '' ) . '
				)' : '' ) . '
			GROUP 
				BY u.ID, g.Name 
			ORDER BY 
				u.' . ( isset( $args->args->sortby ) ? $args->args->sortby : 'FullName' ) . ' 
				' . ( isset( $args->args->orderby ) ? $args->args->orderby : 'ASC' ) . ' 
			' . ( isset( $args->args->limit ) && $args->args->limit ? '
			LIMIT ' . $args->args->limit . ' 
			' : '' ) . '
		' ) )
		{
			$out = [];
			foreach( $users as $u )
			{
				$keys = [ 'ID', 'Name', 'Password', 'FullName', 'Email', 'CreatedTime', 'LoginTime', 'Image', 'Level', 'UniqueID', 'Status' ];
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
		
		break;
	
}

die( 'fail<!--separate-->{"response":"-2","message":"list users failed Error 2"} ' );

?>
