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

global $SqlDatabase, $User;

$lang = 'en';

if( isset( $args->args->contactid ) )
{
	$id = intval( $args->args->contactid, 10 );
	$c = new dbIO( 'FContact' );
	if( $c->Load( $id ) )
	{
		$SqlDatabase->query( 'DELETE FROM FContact WHERE UserID=\'' . $User->ID . '\' AND ID=\'' . $id . '\' LIMIT 1' );
		$SqlDatabase->query( 'DELETE FROM FContactAttribute WHERE ContactID=\'' . $c->ID . '\'' );
		$SqlDatabase->query( 'DELETE FROM FContactParticipation WHERE ContactID=\'' . $c->ID . '\'' );
		die( 'ok<!--separate-->{"message":"Contact deleted.","response":"1"}' );
	}
}
die( 'fail<!--separate-->' );

?>
