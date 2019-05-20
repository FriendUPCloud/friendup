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

// Default thumbnail size
$width = 56;
$height = 48;

if( !isset( $args->args->path ) )
{
	die( 'ok<!--separate-->{"response":-1,"message":"Fail."}' );
}

if( isset( $args->args->width ) )
{
	$width = $args->args->width;
}
if( isset( $args->args->height ) )
{
	$height = $args->args->height;
}

// Sanitized username
$uname = str_replace( array( '..', '/', ' ' ), '_', $User->Name );
$wname = $Config->FCUpload . $uname . '/';

if( !file_exists( $wname . 'thumbnails' ) )
{
	makedir( $wname . 'thumbnails' );
}

$p = urldecode( $args->args->path );

$ext = explode( '.', $p );
$ext = pop( $ext );
$ext = strtolower( $ext );

// Fix filename
list( , $finame ) = explode( ':', $p );
if( strstr( $finame, '/' ) )
{
	$finame = explode( '/', $finame );
	$finame = $finame[ count( $finame ) - 1 ];
}
$finame = str_replace( '.', '_', $finame );

$fname = $width . '_' . $height . '_' . $finame . '.' . $ext;

// Already here!
if( file_exists( $wname . 'thumbnails/' . $fname ) )
{
	FriendHeader( 'Content-type', 'image/png' );
	die( file_get_contents( $wname . 'thumbnails/' . $fname ) );
}

// Generate thumbnail
if( $ext == 'jpg' || $ext == 'jpeg' || $ext == 'png' || $ext == 'gif' )
{
	$d = new File( $p );

	$source = null;
	list( $iw, $ih, ) = getimagesize( $d->GetUrl() );
	$x = $y = 0;
	
	FriendHeader( 'Content-type', 'image/png' );
	
	switch( $ext )
	{
		case 'jpg':
		case 'jpeg':
			$source = imagecreatefromjpeg( $d->GetUrl() );
			break;
		case 'png':
			$source = imagecreatefrompng( $d->GetUrl() );
			break;
		case 'gif':
			$source = imagecreatefromgif( $d->GetUrl() );
			break;
	}
	
	if( !$source )
		die( file_get_contents( 'resources/themes/friendup12/gfx/icons/icon_blank_2.png' ) );
		
	// Output
	$dest = imagecreatetruecolor( $width, $height );
	
	// Place thumbnail to the center bottom
	// First try width
	$rw = $width;
	$rh = $ih / $iw * $width;
	// Don't fit height?
	if( $rh > $height )
	{
		$rh = $height;
		$rw = $iw / $ih * $height;
	}
	// Center / Bottom
	$y = $height - $rh;
	$x = $width / 2 - ( $rw / 2 );
	// Resize
	imagecopyresized( $dest, $source, $x, $y, $rw, $rh, 0, 0, $iw, $ih );
	// Save
	imagepng( $dest, $wname . 'thumbnails/' . $fname, 9 );
	// Output
	imagepng( $dest, 9 );
	die();
}
// TODO: Support more icons
else
{
	FriendHeader( 'Content-type', 'image/png' );
	die( file_get_contents( 'resources/themes/friendup12/gfx/icons/icon_blank_2.png' ) );
}



?>
