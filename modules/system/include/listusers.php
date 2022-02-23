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

if( !function_exists( 'microseconds' ) )
{
	function microseconds( $float = false ) 
	{
		list( $usec, $sec ) = explode( " ", microtime() );
		return round( ( (float)$usec + (float)$sec ) * 1000 );
	}
}

$micro_start = microseconds( true );

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
	
	if( $perm = Permissions( 'read', 'application', ( 'AUTHID'.$args->authid ), [ 
		'PERM_USER_READ_GLOBAL', 'PERM_USER_READ_IN_WORKGROUP', 
		'PERM_USER_GLOBAL',      'PERM_USER_WORKGROUP' 
	] ) )
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

if( isset( $args->args ) && isset( $args->args->mode ) )
{
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
					
					$micro_end = microseconds( true );
					
					$out['MS'] = ( $micro_end - $micro_start ) . ' ms';
					
					die( 'ok<!--separate-->' . json_encode( $out ) );
				}
			}
			
			break;
		
		
		case 'count':
			
			if( isset( $args->args->count ) && $args->args->count )
			{
				$out = [];
				
				//$count = $SqlDatabase->FetchObject( 'SELECT COUNT( DISTINCT( u.ID ) ) AS Num FROM FUser u, FUserToGroup tg WHERE u.ID = tg.UserID ' );
				$count = $SqlDatabase->FetchObject( '
					SELECT 
						COUNT( DISTINCT( u.ID ) ) AS Num 
					FROM 
						FUser u, FUserToGroup tg 
					WHERE u.ID = tg.UserID 
					' . ( isset( $args->args->sortstatus ) ? '
					AND u.Status IN (' . $args->args->sortstatus . ') 
					' : '' ) . '
					' . ( isset( $args->args->query ) && $args->args->query ? '
					AND 
					(
						' . ( !isset( $args->args->searchby ) || $args->args->searchby == 'FullName' ? '
						( 
							( 
								   u.FullName LIKE "' . trim( $args->args->query ) . '%" 
								OR REPLACE( u.FullName, SUBSTRING_INDEX( u.FullName, " ", -1 ), "" ) LIKE "%' . trim( $args->args->query ) . '%" 
								OR SUBSTRING_INDEX( u.FullName, " ", -1 ) LIKE "' . trim( $args->args->query ) . '%" 
							) 
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
				' );
				$out['Count'] = ( $count ? $count->Num : 0 );
				
				$micro_end = microseconds( true );
				
				$out['MS'] = ( $micro_end - $micro_start ) . ' ms';
				
				die( 'ok<!--separate-->' . json_encode( $out ) );
			}
			
			break;
		default:
			break;
		
	}
}
else
{
	$out = [];
			
	// TODO: Add support for LoginTime listing and sorting on various parameteres using left join, not in use by default.
	
	if( $users = $SqlDatabase->FetchObjects( $q = '
		SELECT 
			u.ID, u.Name AS `Name`, u.Password, u.FullName AS `FullName`, u.Email, u.CreationTime, u.Image, u.UniqueID, u.Status,
			g.Name AS `Level`, 
			' . ( isset( $args->args->logintime ) && $args->args->logintime ? '
			l.LoginTime AS `LoginTime`
			' : '
			"0" AS `LoginTime`
			' ) . ' 
		FROM 
			`FUser` u
			' . ( isset( $args->args->logintime ) && $args->args->logintime ? '
				LEFT JOIN ( SELECT MAX( `ID` ), MAX( `LoginTime` ) AS `LoginTime`, `UserID` FROM `FUserLogin` WHERE `Information` = "Login success" GROUP BY `UserID` ) AS l ON l.UserID = u.ID
			' : '' ) . ', 
			`FUserGroup` g, 
			`FUserToGroup` ug 
		WHERE 
				u.ID = ug.UserID 
			AND g.ID = ug.UserGroupID 
			AND g.Type = "Level" 
			' . ( isset( $args->args->userid ) && $args->args->userid ? '
			AND u.ID IN (' . $args->args->userid . ') 
			' : '' ) . '
			' . ( isset( $args->args->notids ) && $args->args->notids ? '
			AND u.ID NOT IN (' . $args->args->notids . ') 
			' : '' ) . '
			' . ( isset( $args->args->sortstatus ) ? '
			AND u.Status IN (' . $args->args->sortstatus . ') 
			' : '' ) . '
			' . ( isset( $args->args->query ) && $args->args->query ? '
			AND 
			(
				' . ( !isset( $args->args->searchby ) || $args->args->searchby == 'FullName' ? '
				( 
					( 
						   u.FullName LIKE "' . trim( $args->args->query ) . '%" 
						OR REPLACE( u.FullName, SUBSTRING_INDEX( u.FullName, " ", -1 ), "" ) LIKE "%' . trim( $args->args->query ) . '%" 
						OR SUBSTRING_INDEX( u.FullName, " ", -1 ) LIKE "' . trim( $args->args->query ) . '%" 
					) 
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
		GROUP BY
			u.ID, g.Name 
		ORDER BY
			' . ( isset( $args->args->customsort ) && $args->args->customsort && isset( $args->args->sortby ) && $args->args->sortby == 'Status' ? '
			FIELD ( u.Status, ' . $args->args->customsort . ' ) 
			' : '
			`' . ( isset( $args->args->sortby ) ? $args->args->sortby : 'FullName' ) . '` 
			' . ( isset( $args->args->orderby ) ? $args->args->orderby : 'ASC' ) ) . ' 
		' . ( isset( $args->args->limit ) && $args->args->limit ? '
		LIMIT ' . $args->args->limit . ' 
		' : '' ) . '
	' ) )
	{
		
		foreach( $users as $u )
		{
			$keys = [ 'ID', 'Name', 'Password', 'FullName', 'Email', 'CreationTime', 'LoginTime', 'Image', 'Level', 'UniqueID', 'Status' ];
			$o = new stdClass();
			foreach( $keys as $key )
			{
				$o->$key = $u->$key;
			}
			$out[] = $o;
		}

		if( isset( $args->args->count ) && $args->args->count )
		{
			//$count = $SqlDatabase->FetchObject( 'SELECT COUNT( DISTINCT( u.ID ) ) AS Num FROM FUser u, FUserToGroup tg WHERE u.ID = tg.UserID ' );
			$count = $SqlDatabase->FetchObject( '
				SELECT 
					COUNT( DISTINCT( u.ID ) ) AS Num 
				FROM 
					FUser u, FUserToGroup tg 
				WHERE u.ID = tg.UserID 
				' . ( isset( $args->args->sortstatus ) ? '
				AND u.Status IN (' . $args->args->sortstatus . ') 
				' : '' ) . '
				' . ( isset( $args->args->query ) && $args->args->query ? '
				AND 
				(
					' . ( !isset( $args->args->searchby ) || $args->args->searchby == 'FullName' ? '
					( 
						( 
							   u.FullName LIKE "' . trim( $args->args->query ) . '%" 
							OR REPLACE( u.FullName, SUBSTRING_INDEX( u.FullName, " ", -1 ), "" ) LIKE "%' . trim( $args->args->query ) . '%" 
							OR SUBSTRING_INDEX( u.FullName, " ", -1 ) LIKE "' . trim( $args->args->query ) . '%" 
						) 
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
			' );
			$out['Count'] = ( $count ? $count->Num : 0 );
		}
		
		$micro_end = microseconds( true );
		
		$out['MS'] = ( $micro_end - $micro_start ) . ' ms';
		
		die( 'ok<!--separate-->' . json_encode( $out ) );
	}
	
	/*if( isset( $args->args->count ) && $args->args->count )
	{
		$count = $SqlDatabase->FetchObject( 'SELECT COUNT( DISTINCT( u.ID ) ) AS Num FROM FUser u, FUserToGroup tg WHERE u.ID = tg.UserID ' );
		$out['Count'] = ( $count ? $count->Num : 0 );
		
		die( 'ok<!--separate-->' . json_encode( $out ) );
	}*/
}

die( 'fail<!--separate-->{"response":"-2","message":"list users failed Error 2"} ' );

?>
