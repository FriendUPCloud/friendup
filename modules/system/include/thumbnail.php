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
$fname = hash( 'ripemd160', $width . '_' . $height . '_' . $p ) . '.png';

// Already here!
if( file_exists( $wname . 'thumbnails/' . $fname ) )
{
	FriendHeader( 'Content-type', 'image/png' );
	die( file_get_contents( $wname . 'thumbnails/' . $fname ) );
}

// Generate thumbnail
if( $ext == 'jpg' || $ext == 'jpeg' || $ext == 'png' || $ext == 'gif' )
{
	if( !file_exists( '/tmp/Friendup' ) )
		mkdir( '/tmp/Friendup' );
	if( !file_exists( '/tmp/Friendup' ) )
	{
		FriendHeader( 'Content-type', 'image/svg+xml' );
		die( file_get_contents( 'resources/iconthemes/friendup15/File_Broken.svg' ) );
	}

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
		FriendHeader( 'Content-type', 'image/svg+xml' );
		die( file_get_contents( 'resources/iconthemes/friendup15/File_Broken.svg' ) );
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
	
	// Clean up
	if( file_exists( '/tmp/Friendup/' . $smp ) )
		unlink( '/tmp/Friendup/' . $smp );
	
	if( !$source )
	{
		FriendHeader( 'Content-type', 'image/svg+xml' );
		die( file_get_contents( 'resources/iconthemes/friendup15/File_Broken.svg' ) );
	}
		
	imageantialias( $source, true );
		
	// Output
	$dest = imagecreatetruecolor( $width, $height );
	imageantialias( $dest, true );
	imagealphablending( $dest, false );
	imagesavealpha( $dest, true );
	imagesetinterpolation( $dest, IMG_BICUBIC );
	$transparent = imagecolorallocatealpha( $dest, 255, 255, 255, 127 );
	imagefilledrectangle( $dest, 0, 0, $width, $height, $transparent );
	
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
	imagecopyresampled( $dest, $source, $x, $y, 0, 0, $rw, $rh, $iw, $ih );
	
	// Save
	imagepng( $dest, $wname . 'thumbnails/' . $fname, 9 );
	
	FriendHeader( 'Content-type', 'image/png' );
	die( file_get_contents( $wname . 'thumbnails/' . $fname ) );
}
// TODO: Support more icons
else
{
	FriendHeader( 'Content-type', 'image/svg+xml' );
	die( file_get_contents( 'resources/iconthemes/friendup15/File_Broken.svg' ) );
}



?>
