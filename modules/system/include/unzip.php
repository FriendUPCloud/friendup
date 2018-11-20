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

global $Config, $User, $Logger;

require_once( 'php/classes/file.php' );
require_once( 'php/classes/door.php' );

if( !isset( $args->args->path ) ) die( 'fail' );

$filesToCopy = [];
$dirsToRemove = [];

//$fl = new File( $fpath . $file );
//				$processes[] = $fl->SaveAndUnlink( $lpath . $file ); // Keep in a separate process

// Move unpacked to location
function registerUnpacked( $lpath, $fpath, &$door )
{
	global $Logger, $filesToCopy, $dirsToRemove;
	
	// We need a trailing slash
	if( substr( $lpath, -1, 1 ) != '/' )
		$lpath .= '/';
		
	$processes = [];
	
	if( $dir = opendir( $lpath ) )
	{
		//$Logger->log( 'Examining: ' . $lpath );
		// Copy all files
		$unlink = [];
		while( $file = readdir( $dir ) )
		{
			if( $file == '.' || $file == '..' ) continue;
			
			// Correct path for concating..
			if( substr( $fpath, -1, 1 ) != ':' && substr( $fpath, -1, 1 ) != '/' )
				$fpath .= '/';
			
			if( is_dir( $lpath . $file ) )
			{
				// Make the directory
				// TODO: Make sure the return is positive!
				if( $door->dosQuery( '/system.library/file/makedir/?path=' . urlencode( $fpath . $file ) ) )
				{
					//$Logger->log( 'Made directory: ' . $fpath . $file );
					registerUnpacked( $lpath . $file . '/', $fpath . $file . '/', $door );
				}
				$dirsToRemove[] = $lpath . $file;
			}
			else
			{
				// Save file here; local path, destination path
				$filesToCopy[] = array( $lpath . $file, $fpath . $file );
			}
		}
		// Close dir
		closedir( $dir );
	}
	return true;
}

// 1. Load the zip file.. ------------------------------------------------------

if( strtolower( end( explode( '.', $args->args->path ) ) ) != 'zip' )
	die( 'fail<!--separate-->{"ErrorMessage":"i18n_no_zip_file"}' );
$fr = new File( urldecode( $args->args->path ) );
if( $fr->Load() )
{
	// 2. The file is loaded, check if we can create a temp directory ----------
	
	$f = 'temp_file_';
	while( file_exists( '/tmp/' . ( $fld = ( $f . str_replace( ' ', '', microtime() ) . rand( 0, 999 ) . $User->ID ) ) ) ){}
	
	mkdir( '/tmp/' . $fld );
	
	$f = 'temp_file_';
	while( file_exists( '/tmp/' . ( $ff = ( $f . str_replace( ' ', '', microtime() ) . rand( 0, 999 ) . $User->ID . '.zip' ) ) ) ){}
	
	// Write the zip file to this temp location
	$f = fopen( '/tmp/' . $ff, 'w+' );
	fwrite( $f, $fr->GetContent() );
	fclose( $f );
	
	// 3. Now try to open the zip archive and extract it to the temp directory -
	$zip = new ZipArchive;
	if( $zip->open( '/tmp/' . $ff ) )
	{
		$zip->extractTo( '/tmp/' . $fld );
		
		$bpath = urldecode( $args->args->path );
		if( strstr( $bpath, '/' ) )
		{
			$bpath = explode( '/', $bpath );
			array_pop( $bpath );
			$bpath = implode( '/', $bpath );
		}
		else if( strstr( $bpath, ':' ) )
		{
			$bpath = reset( explode( ':', $bpath ) ) . ':';
		}
		
		$device = reset( explode( ':', $bpath ) ) . ':';
		
		$door = new Door( $device );
		
		$zip->close();
		
		// Remove temporary zip file
		unlink( '/tmp/' . $ff );
		
		// 4. Move the unpacked files to target disk
		registerUnpacked( '/tmp/' . $fld, $bpath, $door );
		
		// Now use threading to copy files!
		$maxFiles = 40; $index = 0;
		$processes = []; for( $a = 0; $a < $maxFiles; $a++ ) $processes[ $a ] = 0;
		do
		{
			for( $a = 0; $a < $maxFiles; $a++ )
			{
				if( $processes[ $a ] <= 0 )
				{
					$row = $filesToCopy[ $index++ ];
					$fl = new File( $row[1] );
					// Success?
					$processes[ $a ] = $fl->SaveAndUnlink( $row[0] );
				}
			}
			
			/*$f = fopen( '/tmp/out.log', 'a+' );
			fwrite( $f, 'We copied files at index ' . $index . ' / ' . count( $filesToCopy ) . " (" . $filesToCopy[ $index ][0] . ")\n" );
			fclose( $f );*/
			
			// Check if we can close processes
			for( $a = 0; $a < $maxFiles; $a++ )
			{
				if( $processes[ $a ] != 0 )
				{
					@pclose( $processes[ $a ] );
					$processes[ $a ] = 0;
					/*$f = fopen( '/tmp/out.log', 'a+' );
					fwrite( $f, 'Checked and tried to close process ' . $processes[ $a ] . ' - ' . $a . ' / ' . $maxFiles . "\n" );
					fclose( $f );*/
				}
			}
		}
		while( $index < count( $filesToCopy ) );
		
		// Clean up
		foreach( $filesToCopy as $file ) unlink( $file[ 0 ] );
		foreach( $dirsToRemove as $dir ) rmdir( $dir );
		
		//$Logger->log( '[Unzip] Removed temporary root folder..' );
		// Remove temporary folder
		rmdir( '/tmp/' . $fld );
		
		die( 'ok' );
	}
}

?>
