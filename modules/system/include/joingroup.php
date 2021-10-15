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

include_once( 'php/include/helpers.php' );

$g = new dbIO( 'FUserGroup' );
if( $g->Load( intval( $args->args->groupId, 10 ) ) )
{
	// It belongs to you!
	if( $g->UserID == $User->ID )
	{
		if( !$SqlDatabase->fetchObject( 'SELECT * FROM FUserToGroup ug WHERE ug.UserGroupID = \'' . intval( $args->args->groupId, 10 ) . '\' AND ug.UserID=\'' . $User->ID . '\'' ) )
		{
			if( FriendCoreQuery( '/system.library/group/addusers', 
			[
				'id'    => intval( $args->args->groupId, 10 ),
				'users' => $User->ID
			] ) )
			{
				die( 'ok<!--separate-->' );
			}
			else
			{
				// If FriendCore didn't wanna do this, just do it! ...
				if( $SqlDatabase->query( 'INSERT INTO FUserToGroup ( UserGroupID, UserID ) VALUES ( \'' . intval( $args->args->groupId, 10 ) . '\', \'' . $User->ID . '\' )' ) )
				{
					die( 'ok<!--separate-->' );
				}
			}
			die( 'fail<!--separate-->{"response":-1,"message":"Could not save group membership."}' );
		}
		die( 'fail<!--separate-->{"response":-1,"message":"Already a member of group."}' );
	}
	die( 'fail<!--separate-->{"response":-1,"message":"Group does not belong to you."}' );
}
die( 'fail<!--separate-->{"response":-1,"message":"Could not load group."}' );

?>
