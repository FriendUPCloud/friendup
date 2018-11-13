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

$places = array( 'repository/', 'resources/webclient/apps/' );
foreach( $places as $place )
{
	if( file_exists( $place . '/' . $args->application . '/preview.png' ) )
	{
		FriendHeader( 'Content-Type: image/png' );
		die( file_get_contents( $place . '/' . $args->application . '/preview.png' ) );
	}
}

die( 'fail' );

?>
