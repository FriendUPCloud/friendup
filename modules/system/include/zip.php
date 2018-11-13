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

global $User, $Logger;

require_once( 'php/classes/file.php' );
require_once( 'php/classes/door.php' );

function addToZip( $fileOrFld, &$zip, &$door, $path = '', $level = 0 )
{
	global $Logger;
	
	$lev = '';
	for( $a = 0; $a < $level; $a++ ) $lev .= '___';
	
	$f_volume = urldecode( $fileOrFld->Volume );
	$f_filename = urldecode( $fileOrFld->Filename );
	$f_path = urldecode( $fileOrFld->Path );
	$p_path = urldecode( $path );
	
	// Directory mode
	if( $fileOrFld->Type == 'Directory' )
	{
		$path .= $f_filename .'/';
		$empty = '';
		if( substr( $f_path, -1, 1 ) == '/' )
			$empty = reset( explode( '/', end( explode( ':', $f_path ) ) ) );
		$zip->addEmptyDir( trim( $p_path ) ? $p_path : $empty );
		
		// $Logger->log( $lev . '[Zip] Adding directory: ' . ( trim( $p_path ) ? $p_path : $empty ) );
		// $Logger->log( $lev . '[Zip] dir ' . $f_path );
		
		// Get a dir listing..
		if( $str = $door->dosQuery( '/system.library/file/dir/?path=' . urlencode( $f_volume . $f_path ) ) )
		{
			if( substr( $str, 0, 2 ) != 'ok' )
			{
				return false;
			}
			list( , $ob ) = explode( '<!--separate-->', $str );
			$objstr = json_decode( $ob );
			if( $objstr )
			{
				$t = false;
				foreach( $objstr as $v )
				{
					$o = new stdClass();
					if( trim( $v->Filename ) )
					{
						// $Logger->log( $lev . '[Zip] Adding file of type ' . $v->Type . ' and file path ' . $v->Path );
						$o->Filename = $v->Filename;
						$o->Path = $v->Path;
						$o->Type = $v->Type;
						$o->Volume = $f_volume;
						if( addToZip( $o, $zip, $door, $path, $level + 1 ) ) $t = true;	
					}
				}
				return $t;
			}
		}	
	}
	// File mode
	else if( $fileOrFld->Type == 'File' )
	{
		// $Logger->log( '[Zip] Adding file ' . $p_path . $f_filename );
		if( $f_volume ) $f_path = $f_volume . $f_path;
		$f = new File( $f_path );
		if( $f->Load() )
		{
			// $Logger->log( $lev . '[Zip] Added file: ' . $f_path );
			// $Logger->log( 'Content: ' . $f->GetContent() );
			// $Logger->log( 'And session: ' . $GLOBALS[ 'args' ]->sessionid );
			$zip->addFromString( $p_path . $f_filename, $f->GetContent() );
			return true;
		}
	}
	return false;
}

// Make sure we have something to zip
if( isset( $args->args->paths ) && count( $args->args->paths ) )
{
	$firstPath = urldecode( $args->args->paths[0]->Path );
	
	//$Logger->log( '[Zip] Trying to create zip file: ' . $firstPath );
	
	// Get a filesystem object
	$door = new Door( reset( explode( ':', $firstPath ) ) . ':' );

	$zip = new ZipArchive;
	$f = 'temp_file_';
	while( file_exists( '/tmp/' . ( $ff = ( $f . str_replace( array( '.', ' ' ), array( '_', '' ), microtime() ) . rand( 0, 999 ) . $User->ID . '.zip' ) ) ) ){}
	if( $zip->open( '/tmp/' . $ff, ZipArchive::CREATE ) === TRUE )
	{
		foreach( $args->args->paths as $path )
		{
			$volume = reset( explode( ':', urldecode( $path->Path ) ) );
			$path->Volume = $volume . ':';
			addToZip( $path, $zip, $door );
		}
		$zip->close();
		
		$fn = $firstPath;
		if( substr( $fn, -1, 1 ) == '/' ) 
			$fn = substr( $fn, 0, strlen( $fn ) - 1 );
		$fn .= '.zip';
		$z = new File( $fn );
		
		//$Logger->log( '[Zip] Now trying to save contents to file: ' . $fn );
		
		if( file_exists( '/tmp/' . $ff ) )
		{
			if( $res = $z->Save( file_get_contents( '/tmp/' . $ff ) ) )
			{
				// Delete temp file and clean up with success return code
				$filesize = filesize( '/tmp/' . $ff );
				unlink( '/tmp/' . $ff );
				//$Logger->log( '[Zip] We managed successfully to save zip file to friend drive.' );
				die( 'ok<!--separate-->{"Filename:":"' . end( explode( ':', $fn ) ) . '","Path":"' . $fn . '","Filesize":' . $filesize . '}' );
			}
			else
			{
				// Delete and clean up
				unlink( '/tmp/' . $ff );
			}
		}
		//$Logger->log( '[Zip] We failed to save the zip file.' );
		die( 'fail<!--separate-->{"ErrorMessage":"Can not create file.."}<!--separate-->' . $fn );
	}
}

die( 'fail' );

?>
