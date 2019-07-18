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
			die( 'ok<!--separate-->{"message":"Wallpaper exists.","response":1}' );
		}
		// Clean up defunct setup wallpaper meta data
		$d->Delete();
		die( 'fail<!--separate-->{"message":"Wallpaper does not exist on disk.","response":-1}' );
	}
	die( 'fail<!--separate-->{"message":"User template setup wallpaper does not exist.","response":-1}' );
}
die( 'fail<!--separate-->{"message":Can not find setup ID.","response":-1}' );

?>
