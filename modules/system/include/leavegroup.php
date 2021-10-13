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

error_reporting( E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_WARNING );
ini_set( 'display_errors', '1' );

include_once( 'php/include/helpers.php' );

if( isset( $args->args->groupId ) )
{
	$groupId = intval( $args->args->groupId, 10 );
	
	// Make sure you cannot leave if you weren't invited
	$g = new dbIO( 'FUserGroup' );
	if( $g->load( $groupId ) )
	{
		// Nastly complex union to solve this for now ...
		if( $rows = $SqlDatabase->fetchObjects( '
		(
			SELECT 
				g.*, qu.Fullname AS Invitor, g.ID AS TargetGroupID,
				levg.Name AS Level, \'0\' AS `IsInvite`, \'1\' AS `Select` 
			FROM 
				FUser qu, 
				FUserToGroup mygroups, 
				FUserGroup g,
				FUserGroup levg, 
				FUserToGroup levutg
			WHERE 
				g.ID               = \'' . $groupId . '\'  AND
				qu.ID              = g.UserID              AND
				g.ID               = mygroups.UserGroupID  AND
				mygroups.UserID    = \'' . $User->ID . '\' AND
				g.UserID          != \'' . $User->ID . '\' AND
				levg.Type          = \'Level\'             AND
				levg.Name          = "User"                AND
				levutg.UserID      = g.UserID              AND
				levutg.UserGroupID = levg.ID
			ORDER BY 
				g.Name ASC
		) 
		UNION
		(
			SELECT 
				g.*, qu.Fullname AS Invitor, g.ID AS TargetGroupID,
				levg.Name AS Level, q.ID AS IsInvite, \'2\' AS `Select` 
			FROM 
				FUserGroup g, 
				FUserToGroup utg, 
				FQueuedEvent q, 
				FUser qu,
				FUserGroup levg, 
				FUserToGroup levutg
			WHERE 
				g.ID               = \'' . $groupId . '\'  AND
				g.ID               = q.TargetGroupID       AND
				q.UserID          != \'' . $User->ID . '\' AND
				qu.ID              = q.UserID              AND
				q.TargetUserID     = \'' . $User->ID . '\' AND
				q.Type             = \'interaction\'       AND
				utg.UserID         = \'' . $User->ID . '\' AND
				utg.UserGroupID    = g.ID                  AND
				levg.Type          = \'Level\'             AND
				levutg.UserID      = q.UserID              AND
				levutg.UserGroupID = levg.ID
			ORDER BY g.Name ASC
		)
		' ) )
		{
			// Doesn't always have a FQueuedEvent, so commented this out...
			//$q = new dbIO( 'FQueuedEvent' );
			//$q->TargetGroupID = $groupId;
			//$q->TargetUserID = $User->ID;
			//if( $q->load() )
			//{
				if( FriendCoreQuery( '/system.library/group/removeusers', 
				[
					'id'    => $groupId,
					'users' => $User->ID
				] ) )
				{
					//
				}
				// If FriendCore didn't wanna do this, just do it! ...
				$SqlDatabase->query( 'DELETE FROM FUserToGroup WHERE UserID=\'' . $User->ID . '\' AND UserGroupID=\'' . $groupId . '\'' );
				$SqlDatabase->query( 'DELETE FROM FQueuedEvent WHERE TargetGroupID=\'' . $groupId . '\' AND TargetUserID=\'' . $User->ID . '\'' );
				die( 'ok<!--separate-->' );
			//}
			//else
			//{
			//	die( 'fail<!--separate-->Couldn\'t find group: ' . $groupId . ' and userid: ' . $User->ID . ' in "FQueuedEvent" ...' );
			//}
		}
		else
		{
			die( 'fail<!--separate-->Cannot leave group: ' . $groupId . ' because owner of this group is Admin ...' );
		}
	}
	else
	{
		die( 'fail<!--separate-->Couldn\'t find group: ' . $groupId . ' in "FUserGroup" ...' );
	}
}
die( 'fail' );

?>
