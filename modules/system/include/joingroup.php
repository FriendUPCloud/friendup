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

$g = new dbIO( 'FUserGroup' );
if( $g->Load( intval( $args->args->groupId, 10 ) ) )
{
	// It belongs to you!
	if( $g->UserID = $User->ID )
	{
		if( !$SqlDatabase->fetchObject( 'SELECT * FROM FUserToGroup ug WHERE ug.UserGroupID = \'' . intval( $args->args->groupId, 10 ) . '\' AND ug.UserID=\'' . $User->ID . '\'' ) )
		{
			$o = new dbIO( 'FUserToGroup' );
			$o->UserGroupID = $args->args->groupId;
			$o->UserID = $User->ID;
			if( $o->Save() )
			{
				die( 'ok<!--separate-->' );
			}
		}
	}
}
die( 'fail' );

?>
