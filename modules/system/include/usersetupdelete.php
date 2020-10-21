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

if( $level == 'Admin' )
{
	$o = new DbIO( 'FUserGroup' );
	$o->Type = 'Setup';
	if( $o->Load( $args->args->id ) )
	{
		$s = new dbIO( 'FSetting' );
		$s->UserID = $o->ID;
		$s->Type = 'setup';
		$s->Key = 'usergroup';
		if( $s->Load() )
		{
			$s->Delete();
		}
		$SqlDatabase->query( 'DELETE FROM FUserToGroup WHERE UserGroupID=\'' . $o->ID . '\'' );
		$o->Delete();
		die( 'ok' );
	}
}
die( 'fail<!--separate-->{"response":"fatal error in usersetupdelete"}' );

?>
