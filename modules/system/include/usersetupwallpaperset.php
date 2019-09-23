<?php

global $Logger;

require_once( 'php/classes/dbio.php' );
require_once( 'php/classes/door.php' );
require_once( 'php/classes/file.php' );

// We need args!
if( !isset( $args->args ) ) die( '404' );

if( $level != 'Admin' ) die( '404' );

// Get varargs
$file = $setupId = false;
if( isset( $args->args->path ) )
	$file = $args->args->path;
if( isset( $args->args->setupId ) )
	$setupId = $args->args->setupId;

// Need both setupid and file
if( !$setupId || !$file )
	die( '404' );

// Load user template setup
if( $setup = $SqlDatabase->FetchObject( '
	SELECT g.ID, g.Name, s.Data 
	FROM `FUserGroup` g, `FSetting` s 
	WHERE g.ID = \'' . $args->args->setupId . '\' AND g.Type = \'Setup\'
	AND s.UserID = g.ID AND s.Type = \'setup\' AND s.Key = \'usergroup\' 
	ORDER BY g.Name ASC 
' ) )
{
	// Remove old file if it exists
	// Load metadata
	$old = new dbIO( 'FMetaData' );
	$old->Key = 'UserTemplateSetupWallpaper';
	$old->DataTable = 'FSetting';
	$old->DataID = $setup->ID;
	if( $old->Load() )
	{
		// Check if file exists no disk
		if( file_exists( $old->ValueString ) )
		{
			unlink( $old->ValueString );
		}
		// Clean up defunct setup wallpaper meta data
		$old->Delete();
	}

	// Get the file into the right position and register it
	$d = new File( $file );
	if( $d->Load() )
	{
		// Move the file into storage
		$orig = explode( ':', $file );
		$orig = $orig[1];
		if( strstr( $orig, '/' ) )
		{
			$orig = explode( '/', $orig );
			$orig = $orig[ count( $orig ) - 1 ];
		}
		
		// Get a unique filename
		$comp = 'templateSetup_';
		$temp = $comp;
		$count = 1;
		while( file_exists( 'storage/' . $temp . $orig ) )
		{
			$temp = $comp . ( $count++ ) . '_';
		}
		
		if( $f = fopen( 'storage/' . $temp . $orig, 'w+' ) )
		{
			fwrite( $f, $d->GetContent() );
			fclose( $f );
		}
		// Store file relation to setup
		if( file_exists( 'storage/' . $temp . $orig ) )
		{
			$m = new dbIO( 'FMetaData' );
			$m->Key = 'UserTemplateSetupWallpaper';
			$m->DataID = $setup->ID;
			$m->DataTable = 'FSetting';
			$m->ValueString = 'storage/' . $temp . $orig;
			$m->ValueNumber = 0;
			$m->Save();
			if( $m->ID > 0 )
			{
				die( 'ok<!--separate-->{"message":"Saved user template setup wallpaper.","response":1,"DataID":"' . $m->ID . '"}' );
			}
			die( 'fail<!--separate-->{"message":"Failed top save wallpaper file.","response":-1}' );
		}
	}
	die( 'fail<!--separate-->{"message":"Failed top load wallpaper file.","response":-1}' );
}

die( 'fail<!--separate-->{"message":"Failed to load user template setup.","response":-1}' );

?>
