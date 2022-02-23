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

/* List User's own workgroups */

if( !isset( $args->args->mode ) || $args->args->mode == 'own' )
{
	if( $rows = $SqlDatabase->fetchObjects( '
		SELECT g.* FROM FUserGroup g WHERE g.UserID=\'' . $User->ID . '\' ORDER BY g.Name ASC
	' ) )
	{
		die( 'ok<!--separate-->' . json_encode( $rows ) );
	}
}
else if( $args->args->mode == 'onlymember' )
{
	// And join in the level of the owner of the group you are member of
	if( $rows = $SqlDatabase->fetchObjects( '
		SELECT 
			g.*, le.Name AS Level
		FROM 
			FUserGroup g, FUserGroup le, FUserToGroup leu
		WHERE 
			g.UserID !=\'' . $User->ID . '\' AND
			g.UserID  = leu.UserID           AND
			leu.UserGroupID = le.ID          AND
			le.Type = \'Level\'
		ORDER BY g.Name ASC
	' ) )
	{
		die( 'ok<!--separate-->' . json_encode( $rows ) );
	}
}
else if( $args->args->mode == 'invites' )
{
	if( $rows = $SqlDatabase->fetchObjects( $q = '
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
				qu.ID              = g.UserID AND
				g.ID               = mygroups.UserGroupID AND
				mygroups.UserID    = \'' . $User->ID . '\' AND
				g.UserID          != \'' . $User->ID . '\' AND
				levg.Type          = \'Level\' AND
				levutg.UserID      = g.UserID AND
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
				g.ID               = q.TargetGroupID AND
				q.UserID          != \'' . $User->ID . '\' AND
				qu.ID              = q.UserID AND
				q.TargetUserID     = \'' . $User->ID . '\' AND
				q.Type             = \'interaction\' AND
				utg.UserID         = \'' . $User->ID . '\' AND
				utg.UserGroupID    = g.ID AND
				levg.Type          = \'Level\' AND
				levutg.UserID      = q.UserID AND
				levutg.UserGroupID = levg.ID
			ORDER BY g.Name ASC
		)
		' ) )
	{
		// Remove dups
		$out = [];
		foreach( $rows as $row )
		{
			$found = false;
			if( count( $out ) )
			{
				foreach( $out as $k=>$o )
				{
					if( $o->ID == $row->ID )
					{
						$found = true;
						// Invites has presedense
						if( $row->IsInvite )
							$out[ $k ] = $row;
						break;
					}
				}
			}
			if( !$found ) $out[] = $row;
		}
		die( 'ok<!--separate-->' . json_encode( $out ) );
	}
	else
	{
		die( 'fail<!--separate-->' . $q );
	}
}

die( 'fail' );


?>
