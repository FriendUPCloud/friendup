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

global $Config, $Logger, $User;

// Install package in the Friend Store..
require_once( 'php/classes/file.php' );
require_once( 'php/classes/door.php' );

if( !isset( $args->args->path ) ) die( 'fail' );

// 1. Load the zip file.. ------------------------------------------------------

if( strtolower( end( explode( '.', $args->args->path ) ) ) != 'fpkg' )
	die( 'fail<!--separate-->{"response":"no friend package file"}' );
$fr = new File( urldecode( $args->args->path ) );
if( $fr->Load() )
{
	// 2. The file is loaded, check if we can create a temp directory ----------
	
	$f = 'temp_file_';
	while( file_exists( '/tmp/' . ( $fld = ( $f . str_replace( ' ', '', microtime() ) . rand( 0, 999 ) . $User->ID ) ) ) ){}
	
	mkdir( '/tmp/' . $fld );
	if( !file_exists( '/tmp/' . $fld ) )
		die( 'fail<!--separate-->{"response":"could not create temp folder","folder":"/tmp/' . $fld . '"}' );
	
	$f = 'temp_file_';
	while( file_exists( '/tmp/' . ( $ff = ( $f . str_replace( ' ', '', microtime() ) . rand( 0, 999 ) . $User->ID . '.zip' ) ) ) ){}
	
	// Write the zip file to this temp location
	if( $f = fopen( '/tmp/' . $ff, 'w+' ) )
	{
		fwrite( $f, $fr->GetContent() );
		fclose( $f );
	
		$Logger->log( '[InstallPackage] We wrotezip package.' );
	
		$hashes = array(); // Signatures
	
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
		
			$zip->close();
			
			$Logger->log( '[InstallPackage] Successfully unzipped.' );
			
			$Logger->log( '[InstallPackage] Remove temporary zip file.' );
		
			// Find jsx and conf!
			$jsx = findByExtension( '/tmp/' . $fld, 'jsx' );
			$conf = findByExtension( '/tmp/' . $fld, 'conf' );
		
			$success = true;
			$dest = '';
		
			// We have both conf and jsx!
			if( $jsx && $conf )
			{
				$Logger->log( '[InstallPackage] Found both jsx and conf. (' . $conf . ')' );
				
				$confo = json_decode( file_get_contents( $conf ) );
				
				$nconf = new stdClass();
				$init = substr( $jsx, 0, strlen( $jsx ) - 4 ) . '.js';
				rename( $jsx, $init ); // Give jsx a .js name
				$nconf->Init = str_replace( '/tmp/' . $fld . '/', '', $init );
				
				// Generate compliant permissions
				$nconf->Permissions = [];
				foreach( $confo->Permissions as $p )
				{
					$str = trim( $p->Permission . ' ' . $p->Name . ' ' . $p->Options );
					$nconf->Permissions[] = $str;
				}
			
				// TODO: Get this from package info!
				$nconf->API = 'v1';
			
				// Others
				// Remove whitespace
				$dest = preg_replace( '/[\s]+]/i', '_', $confo->ProjectName );
				$nconf->Name = $dest;
				// TODO: Get category from project!
				$nconf->Category = trim( $confo->Category ) ? $confo->Category : 'Uncategorized';
				$nconf->Author = $confo->Author;
				$nconf->Version = ( int )$confo->Version;
				$nconf->Description = $confo->Description;
				$nconf->Verified = 'no';
				$nconf->Trusted = 'no';
			
				$dest = str_replace( ' ', '_', $dest );
			
				if( $f = fopen( $conf, 'w+' ) )
				{
					fwrite( $f, json_encode( $nconf ) );
					fclose( $f );
					$Logger->log( 'Wrote new conf: ' . print_r( $nconf, 1 ) );
				}
				else
				{
					$success = false;
				}
			}
			else
			{
				//$Logger->log( '[InstallPackage] Found no jsx or conf in path ' . '/tmp/' . $fld );
				
				// Remove temporary zip file
				unlink( '/tmp/' . $ff );
				
				die( 'fail<!--separate-->{"response":"no jsx or conf found"}' );
			}
		
			// What?
			if( !file_exists( getcwd() . '/repository' ) )
			{
				$Logger->log( '[InstallPackage] Found no repository (' . getcwd() . '/repository).' );
				
				// Remove temporary zip file
				unlink( '/tmp/' . $ff );
				
				die( 'fail<!--separate-->{"response":"repository store does not exist on server"}' );
			}
			
			// Now hash all files!
			function hashEmRecursive( $p, &$hashes, $d = 0, $rpath = '' )
			{
				global $Logger;
				if( $hdir = opendir( $p ) )
				{
					while( $f = readdir( $hdir ) )
					{
						if( $d == 0 && ( $f == 'Signature.sig' || $f == 'package.zip' ) )
						{
							continue;
						}
						if( $f{0} == '.' )
						{
							// Remove dot files. We don't allow them!
							if( $f != '..' && $f != '.' )
							{
								unlink( $p . '/' . $f );
							}
							continue;
						}
						$path = $rpath . ( $rpath ? '/' : '' ) . $f; // rel path
						$hashes[] = hash( 'sha256', $rpath ); // Add dir names
						if( is_dir( $p . '/' . $f ) )
						{
							hashEmRecursive( $p . '/' . $f, $hashes, $d + 1, $path );
						}
						else
						{
							$hashes[] = $hash = hash_file( 'sha256', $f );
							//$Logger->log( $path );
						}
					}
					closedir( $hdir );
				}
			}
			hashEmRecursive( '/tmp/' . $fld, $hashes );
			
			// Write a signature
			if( $f = fopen( '/tmp/' . $fld . '/Signature.sig', 'w+' ) )
			{
				fwrite( $f, '{"signature":"' . hash( 'sha256', implode( '', sort( $hashes ) ) ) . '"}' );
				fclose( $f );
			}
			
			// File exists? Remove it!
			if( file_exists( getcwd() . '/repository/' . $dest ) )
			{
				exec( 'rm -fr ' . getcwd() . '/repository/' . $dest );
				//$Logger->log( '[InstallPackage] Package already on server. (' . $dest . ')' );
				//die( 'fail<!--separate-->{"response":"package is already installed on server","dest":"' . $dest . '"}' );
			}
		
			// Move directory to repository
			$Logger->log( 'Move dir from ' . '/tmp/' . $fld . ' to ' . getcwd() . '/repository/' . $dest );
			exec( 'mv /tmp/' . $fld . ' ' . getcwd() . '/repository/' . $dest );
			
			if( file_exists( getcwd() . '/repository/' . $dest ) )
			{
				// All went well
				if( $success )
				{
					$Logger->log( '[InstallPackage] Success!' );
					
					// move package zip to archive
					exec( 'mv /tmp/' . $ff . ' ' . getcwd() . '/repository/' . $dest . '/package.zip' );
					
					die( 'ok<!--separate-->{"response":"successfully installed friend package","package":"' . $dest . '"}' );
				}
			}
			// Remove package directory
			else
			{
				exec( 'rm -fr /tmp/' . $fld );
			}
			
			$Logger->log( '[InstallPackage] Permission error.' );
			
			// Remove temporary zip file
			unlink( '/tmp/' . $ff );
			
			die( 'fail<!--separate-->{"response":"failed to install package due to server file permissions"}' );
		}
	}
	die( 'fail<!--separate-->{"response":"failed to open friend package"}' );
}

// Scan directories for jsx!
function findByExtension( $rpath, $ext )
{
	if( substr( $rpath, -1, 1 ) == '/' )
		$rpath = substr( $rpath, 0, strlen( $rpath ) - 1 );
	if( $dir = opendir( $rpath ) )
	{
		while( $f = readdir( $dir ) )
		{
			if( $f{0} == '.' ) continue;
			if( is_dir( $rpath . $f ) )
			{
				$r = findJSX( $rpath . '/' . $f . '/' );
				if( $r ) return $r;
			}
			if( strtolower( substr( $f, -1 - strlen( $ext ), strlen( $ext ) + 1 ) ) == '.' . $ext )
			{
				return $rpath . '/' . $f;
			}
		}
		closedir( $dir );
	}
	return false;
}

?>
