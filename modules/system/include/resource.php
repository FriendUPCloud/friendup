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

global $Logger;

$f = 'repository/' . $args->file;
if( file_exists( $f ) )
{
	$ext = explode( '.', $args->file );
	$ext = strtolower( array_pop( $ext ) );
	$filesize = filesize( $f );
	switch( strtolower( $ext ) )
	{
		case 'jpg':
		case 'gif':
		case 'png':
			FriendHeader( 'Content-type: image/' . ( $ext == 'jpg' ? 'jpeg' : $ext ) );
			FriendHeader( 'Content-length: ' . $filesize );
			break;
		case 'css':
			FriendHeader( 'Content-Type: text/css' );
			break;
	}
	readfile( $f );
	die();
}
die( 'fail<!--separate-->{"response":"resource not found"}' );

?>
