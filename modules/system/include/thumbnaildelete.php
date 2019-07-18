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
require_once( 'php/classes/door.php' );

$Logger->log( 'Starting thumbnail delete.' );

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
	die( 'fail<!--separate-->{"message":"Thumbnail directory is not created.","response":-1}' );

// Get the path
$p = urldecode( $args->path );
$pure = explode( ':', $p );
$dirnfile = $pure[ 1 ];
$pure = $pure[ 0 ] . ':'; // Strip the disk name, will use something else

$ext = explode( '.', $p );
$ext = array_pop( $ext );
$ext = strtolower( $ext );

// Generate thumbnail
if( $ext == 'jpg' || $ext == 'jpeg' || $ext == 'png' || $ext == 'gif' )
{
	$door = new Door( $pure );
	
	// Look in the database
	$thumb = new dbIO( 'FThumbnail' );
	$thumb->Path = $door->ID . ':' . $dirnfile; // Use fs ID instead of fs name
	$thumb->UserID = $User->ID;
	if( $thumb->Load() )
	{
		if( file_exists( $thumb->Filepath ) )
		{
			unlink( $thumb->Filepath );
			$thumb->delete();
			//$Logger->log( 'Deleted thumbnail ' . $thumb->Path . '..' );
			die( 'ok<!--separate-->{"message":"Thumbnail was deleted by path.", "response":1}' );
		}
		//$Logger->log( 'Thumbnail ' . $thumb->Path . ' not found..' );
	}
}

//$Logger->log( 'Could not delete thumbnail.' );

// Fail
die( 'fail<!--separate-->{"message":"Could not delete thumbnail file by path.","response":-1}' );

?>
