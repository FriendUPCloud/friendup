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

$userid = ( !isset( $args->args->userid ) ? $User->ID : 0 );

if( isset( $args->args->authid ) && !isset( $args->authid ) )
{
	$args->authid = $args->args->authid;
}

if( isset( $args->authid ) )
{
	require_once( 'php/include/permissions.php' );
	
	if( $perm = Permissions( 'read', 'application', ( 'AUTHID'.$args->authid ), [ 'PERM_WORKGROUP_GLOBAL', 'PERM_WORKGROUP_WORKGROUP' ] ) )
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



$userConn = 'LEFT'; // <- show all workgroups

// Just show connected groups?
if( isset( $args->args->connected ) )
{
	$userConn = 'RIGHT';
}

if( $rows = $SqlDatabase->FetchObjects( '
	SELECT 
		g.ID, g.Name, g.ParentID, g.UserID, u.UserID AS WorkgroupUserID, m.ValueNumber, m.ValueString 
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
				AND m.DataID = g.ID 
			) 
	WHERE g.Type = \'Workgroup\' 
	' . ( isset( $args->args->workgroups ) ? '
	AND ( g.ID IN (' . $args->args->workgroups . ') OR g.ParentID IN (' . $args->args->workgroups . ') ) 
	' : '' ) . '
	ORDER BY g.Name ASC 
' ) )
{
	foreach( $rows as $row )
	{
		// TODO: Find out what variables are needed to be able to display when the doormanoffice employee is currently at work showing and hiding workgroups ...
	}	
	
	die( 'ok<!--separate-->' . json_encode( $rows ) );
}
die( 'ok<!--separate-->[]' );

?>
