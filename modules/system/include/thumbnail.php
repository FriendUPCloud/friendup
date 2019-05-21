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
$wname = $Config->FCUpload . $uname . '/';

if( !file_exists( $wname . 'thumbnails' ) )
{
	mkdir( $wname . 'thumbnails' );
}

$p = urldecode( $args->path );

$ext = explode( '.', $p );
$ext = array_pop( $ext );
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
	FriendHeader( 'Content-type', 'image/png' );
	
	if( !file_exists( '/tmp/Friendup' ) )
		mkdir( '/tmp/Friendup' );
	if( !file_exists( '/tmp/Friendup' ) )
		die( file_get_contents( 'resources/themes/friendup12/gfx/icons/icon_blank_2.png' ) );

	$d = new File( $p );

	$source = null;
	
	// Get data
	$ch = curl_init();
	curl_setopt( $ch, CURLOPT_URL, $d->GetUrl() );
	curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
	curl_setopt( $ch, CURLOPT_SSL_VERIFYPEER, false );
	curl_setopt( $ch, CURLOPT_SSL_VERIFYHOST, false );
	$tmp = curl_exec( $ch );
	curl_close( $ch );
	
	// Temp file
	$smp = $fname;
	while( file_exists( '/tmp/Friendup/' . $smp ) )
	{
		$smp = $fname . '_' . rand( 0,9999 ) . rand( 0,9999 );
	}
	
	if( $f = fopen( '/tmp/Friendup/' . $smp, 'w+' ) )
	{
		fwrite( $f, $tmp );
		fclose( $f );
	}
	else
	{
		die( file_get_contents( 'resources/themes/friendup12/gfx/icons/icon_blank_2.png' ) );
	}
	
	list( $iw, $ih, ) = getimagesize( '/tmp/Friendup/' . $smp );
	$x = $y = 0;
	
	switch( $ext )
	{
		case 'jpg':
		case 'jpeg':
			$source = imagecreatefromjpeg( '/tmp/Friendup/' . $smp );
			break;
		case 'png':
			$source = imagecreatefrompng( '/tmp/Friendup/' . $smp );
			break;
		case 'gif':
			$source = imagecreatefromgif( '/tmp/Friendup/' . $smp );
			break;
	}
	
	if( !$source )
		die( file_get_contents( 'resources/themes/friendup12/gfx/icons/icon_blank_2.png' ) );
		
	// Output
	$dest = imagecreatetruecolor( $width, $height );
	imagesavealpha( $dest, true );
	
	// Place thumbnail to the center
	// First try width
	$rw = $width;
	$rh = $ih / $iw * $width;
	// Don't fit height?
	if( $rh > $height )
	{
		$rh = $height;
		$rw = $iw / $ih * $height;
	}
	// Center
	$y = $height - $rh;
	$x = $width / 2 - ( $rw / 2 );
	// Resize
	imagecopyresized( $dest, $source, $x, $y, 0, 0, $rw, $rh, $iw, $ih );
	
	// Save
	imagepng( $dest, $wname . 'thumbnails/' . $fname, 9 );
	
	if( file_exists( '/tmp/Friendup/' . $smp ) )
		unlink( '/tmp/Friendup/' . $smp );
	
	die( file_get_contents( $wname . 'thumbnails/' . $fname ) );
}
// TODO: Support more icons
else
{
	FriendHeader( 'Content-type', 'image/png' );
	die( file_get_contents( 'resources/themes/friendup12/gfx/icons/icon_blank_2.png' ) );
}



?>
