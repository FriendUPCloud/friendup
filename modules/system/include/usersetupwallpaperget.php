<?php

require_once( 'classes/dbIO.php' );

// We need args!
if( !isset( $args->args ) ) die( '404' );

if( $level != 'Admin' ) die( '404' );

// Get varargs
$setupId = false;
if( isset( $args->args->setupId ) )
	$setupId = $args->args->setupId;

if( $setupId )
{
	// Load metadata
	$d = new dbIO( 'FMetaData' );
	$d->Key = 'UserTemplateSetupWallpaper';
	$d->DataID = $setupId;
	if( $d->Load() )
	{
		// Check if file exists no disk
		if( file_exists( $d->DataString ) )
		{
			$ext = explode( '.', $d->DataString );
			$ext = $ext[ count( $ext ) - 1 ];
			FriendHeader( 'Content-type: image/' . $ext );
			die( file_get_contents( $d->DataString );
		}
		// Clean up defunct setup wallpaper meta data
		$d->Delete();
	}
}
die();

?>
