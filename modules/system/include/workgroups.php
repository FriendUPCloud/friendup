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

$groups = false;

$userid = ( !isset( $args->args->userid ) ? $User->ID : '0' );

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

// If we've set authid, we're using this module in application mode
// > Permissions apply..
if( isset( $args->authid ) )
{
	require_once( 'php/include/permissions.php' );
	
	if( $perm = Permissions( 'read', 'application', ( 'AUTHID'.$args->authid ), [ 
		'PERM_WORKGROUP_READ_GLOBAL', 'PERM_WORKGROUP_READ_IN_WORKGROUP', 
		'PERM_WORKGROUP_GLOBAL',      'PERM_WORKGROUP_WORKGROUP' 
	] ) )
	{
		if( is_object( $perm ) )
		{
			// Permission denied.
		
			if( $perm->response == -1 )
			{
				//
			
				//die( 'fail<!--separate-->{"message":"'.$perm->message.'",'.($perm->reason?'"reason":"'.$perm->reason.'",':'').'"response":'.$perm->response.'}' );
			}
		
			// Permission granted. GLOBAL or WORKGROUP specific ...
		
			if( $perm->response == 1 && isset( $perm->data->users ) && isset( $args->args->userid ) )
			{
			
				// If user has GLOBAL or WORKGROUP access to this user
			
				if( $perm->data->users == '*' || strstr( ','.$perm->data->users.',', ','.$args->args->userid.',' ) )
				{
					// TODO: Look at this, It's commented out because of FriendChat / Presence.
					//$userid = intval( $args->args->userid );
				}
			
			}
		
			if( $perm->response == 1 && isset( $perm->data->workgroups ) )
			{
			
				// If user has GLOBAL or WORKGROUP access to these workgroups
			
				if( $perm->data->workgroups && $perm->data->workgroups != '*' )
				{
					if( !isset( $args->args ) )
					{
						$args->args = new stdClass();
					}
				
					$args->args->workgroups = $perm->data->workgroups;
				}
			
			}
		}
	}
}
// < Permissions complete


// With userConn (LEFT JOIN) we can show all groups despite join deps
$userConn = 'LEFT';

// Just show connected groups?
if( isset( $args->args->connected ) || $level != 'Admin' )
{
	$userConn = 'RIGHT';
}

$ownflag = $ownergr = $levelflag = $levelgr = $worksql = '';

// If we've set the owner flag, we want the FullName returned as Owner
if( isset( $args->args->owner ) )
{
    $ownflag = ', f.FullName AS Owner';
    $ownergr = ' LEFT JOIN FUser f ON 
			( 
				f.ID = g.UserID 
			)';
}

// If we set the level flag, we want the Name returned as Level
if( isset( $args->args->level ) )
{
    $levelflag = ', l2.Name AS Level';
    $levelgr = ' JOIN FUserGroup l2 ON 
			( 
					l2.Type = "Level" 
				AND l2.Name IN ( "Admin", "User" ) 
			)
			JOIN FUserToGroup l1 ON 
			( 
					l1.UserID = g.UserID 
				AND l1.UserGroupID = l2.ID 
			)';
}

// If we set the workgroups flag, we want to only select the groups contained
if( isset( $args->args ) && isset( $args->args->workgroups ) )
{
    $worksql = ' AND ( g.ID IN (' . $args->args->workgroups . ') OR g.ParentID IN (' . $args->args->workgroups . ') )';
}

// Execute the final query based on flags above
if( $rows = $SqlDatabase->FetchObjects( '
	SELECT 
		g.ID, g.UniqueID, g.Name, g.ParentID, g.UserID, u.UserID AS WorkgroupUserID, m.ValueNumber, m.ValueString 
		' . $ownflag . $levelflag . ' 
	FROM 
		FUserGroup g 
			' . $userConn . ' JOIN FUserToGroup u ON 
			( 
					u.UserID = \'' . $userid . '\' 
				AND u.UserGroupID = g.ID 
			) 
			LEFT JOIN FMetaData m ON 
			( 
					m.DataTable = "FUserGroup" 
			    AND m.ValueString = "presence-roomId"
				AND m.DataID = g.ID 
			) 
			' . $ownergr . $levelgr . '
	WHERE 
	    g.Type = \'Workgroup\'' . $worksql . '
	ORDER BY 
	    g.Name ASC 
' ) )
{
	foreach( $rows as $row )
	{
		// TODO: Find out what variables are needed to be able to display when the doormanoffice employee is currently at work showing and hiding workgroups ...
		
		if( $User->ID != $row->UserID && ( isset( $row->Level ) && $row->Level == 'User' ) || ( isset( $args->args->owner ) && !$row->Owner ) )
		{
			$row->Hide = true;
		}
	}	
	
	die( 'ok<!--separate-->' . json_encode( $rows ) );
}
die( 'ok<!--separate-->[]' );

?>
