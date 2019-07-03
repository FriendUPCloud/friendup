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

global $SqlDatabase, $Logger, $User, $Config;

require_once( 'php/classes/file.php' );

if( !isset( $args->path ) )
{
	die( 'ok<!--separate-->{"response":-1,"message":"Fail."}' );
}

if( isset( $args->width ) )
{
	$width = $args->width;
}
if( isset( $args->height ) )
{
	$height = $args->height;
}

// Sanitized username
$uname = str_replace( array( '..', '/', ' ' ), '_', $User->Name );
$wname = $Config->FCUpload;
if( substr( $wname, -1, 1 ) != '/' )
	$wname .= '/';
if( !file_exists( $wname . 'thumbnails' ) )
{
	mkdir( $wname . 'thumbnails' );
}

$p = urldecode( $args->path );

$ext = explode( '.', $p );
$ext = array_pop( $ext );
$ext = strtolower( $ext );

// Fix filename
$fname = hash( 'ripemd160', $width . '_' . $height . '_' . $p ) . '.png';

// Generate thumbnail
if( $ext == 'jpg' || $ext == 'jpeg' || $ext == 'png' || $ext == 'gif' )
{
	// Look in the database
	$thumb = new dbIO( 'FThumbnail' );
	$thumb->Path = $p;
	$thumb->UserID = $User->ID;
	if( $thumb->Load() )
	{
		unlink( $thumb->Filepath );
		$thumb->delete();
		die( 'ok<!--separate-->{"message":"Thumbnail was deleted by path.", "response":1}' );
	}
}

// Fail
die( 'fail<!--separate-->{"message":"Could not delete thumbnail file by path.","response":-1}' );

?>
