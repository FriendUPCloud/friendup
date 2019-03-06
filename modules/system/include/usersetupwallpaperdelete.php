<?php

require_once( 'php/classes/dbio.php' );

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
	$d->DataTable = 'FSetting';
	$d->DataID = $setupId;
	if( $d->Load() )
	{
		// Check if file exists no disk
		if( file_exists( $d->ValueString ) )
		{
			unlink( $d->ValueString );
		}
		// Clean up defunct setup wallpaper meta data
		$d->Delete();
		die( 'ok<!--separate-->{"message":"Wallpaper deleted.","response":1}' );
	}
}
die( 'fail<!--separate-->{"message":"Could not delete wallpaper.","response":-1}' );

?>
