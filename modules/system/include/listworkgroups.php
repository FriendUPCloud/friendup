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
	// And join in the level of the owner of the group you are member of
	if( $rows = $SqlDatabase->fetchObjects( '
		SELECT 
			g.*, q.Status, qu.Fullname AS Invitor
		FROM 
			FUserGroup g, FUserToGroup utg, FQueuedEvent q, FUser qu
		WHERE 
			g.ID = q.TargetGroupID AND
			q.UserID != \'' . $User->ID . '\' AND
			qu.ID = q.UserID AND
			q.TargetUserID = \'' . $User->ID . '\' AND
			q.Type = \'interaction\' AND
			utg.UserID = \'' . $User->ID . '\' AND
			utg.UserGroupID = g.ID
		ORDER BY g.Name ASC
	' ) )
	{
		die( 'ok<!--separate-->' . json_encode( $rows ) );
	}
}

die( 'fail' );


?>
