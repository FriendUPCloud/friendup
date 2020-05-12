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

$f = 'repository/' . $args->file;
$ext = explode( '.', $args->file );
$ext = array_pop( $ext );
if( file_exists( $f ) )
{
	switch( strtolower( $ext ) )
	{
		case 'jpg':
		case 'gif':
		case 'png':
			FriendHeader( ( 'Content-type: image/' . $ext ) == 'jpg' ? 'jpeg' : strtolower( $ext ) );
			break;
		case 'css':
			FriendHeader( 'Content-Type: text/css' );
			break;
	}
	die( file_get_contents( $f ) );
}
die( 'fail<!--separate-->{"response":"resource not found"}' . $f );

?>
