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

include_once( 'php/friend.php' );
include_once( 'php/classes/file.php' );

if( $args->command == 'get' )
{
	$s = new dbIO( 'FSetting' );
	$s->UserID = $User->ID;
	$s->Type = 'Tutorial';
	$s->Key = 'Tutorial';
	if( !$s->Load() )
	{
		$s->Data = 1;
		$s->Save();
	}
	else if( $s->Data < 1 )
	{
		$s->Data = 1;
		$s->Save();
	}
	if( file_exists( 'modules/tutorials/data/' . $s->Data ) )
	{
		if( file_exists( 'modules/tutorials/data/' . $s->Data . '/tutorial.html' ) )
		{
			die( 'ok<!--separate-->{"response":"Tutorial number ' . $s->Data . '","Data":"' . addslashes( base64_encode( file_get_contents( 'modules/tutorials/data/' . $s->Data . '/tutorial.html' ) ) ) . '"' );
		}
	}
	die( 'fail<!--separate-->{"response":"404","message":"Out of tutorials."}' );
}

// Catch all
die( 'fail<!--separate-->{"response":"0","message":"Unknown call."}' );

?>
