<?php

require_once( 'php/classes/dbio.php' );

// We need args!
if( !isset( $args->setupId ) ) die( '404' );

if( $level != 'Admin' ) die( '404' );

// Get varargs
$setupId = false;
if( isset( $args->setupId ) )
	$setupId = $args->setupId;

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
			ob_clean();
			readfile( $d->ValueString );
			die();
		}
		// Clean up defunct setup wallpaper meta data
		$d->Delete();
	}
}
die();

?>
