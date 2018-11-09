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

global $Logger, $User;

if( $level != 'Admin' )
	die( 'fail<!--separate-->' );

if( isset( $args->args->pckg ) )
{
	if( $args->args->pckg{0} == '.' || strstr( $args->args->pckg, '..' ) )
		die( 'fail<!--separate-->{"response":"illegal package name"}' );
	
	$f = 'repository/' . $args->args->pckg;
	if( !file_exists( $f . '/Signature.sig' ) )
	{
		die( 'fail<!--separate-->{"response":"no signature found"}' );
	}
	
	$signature = file_get_contents( $f . '/Signature.sig' );
	$signature = json_decode( $signature );
	
	$hashes = array();

	// Now hash all files!
	function hashEmRecursive( $p, &$hashes, $d = 0, $rpath = '' )
	{
		global $Logger;
		if( $hdir = opendir( $p ) )
		{
			while( $f = readdir( $hdir ) )
			{
				// Skip signature
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
					$hashes[] = $hash = hash_file( 'sha256', $p . '/' . $f );
					//$Logger->log( $path );
				}
			}
			closedir( $hdir );
		}
	}
	hashEmRecursive( 'repository/' . $args->args->pckg, $hashes );
	
	// Validate signature
	$validation = hash( 'sha256', implode( '', sort( $hashes ) ) );
	if( $validation != $signature->signature )
	{
		$Logger->log( 'Validation: ' . $validation . ' != ' . $signature->signature );
		die( 'fail<!--separate-->{"response":"invalid signature"}' );
	}
	
	// Validate and save
	$signature->validated = $validation;
	if( $f = fopen( 'repository/' . $args->args->pckg . '/Signature.sig', 'w+' ) )
	{
		fwrite( $f, json_encode( $signature ) );
		fclose( $f );
	}
	
	die( 'ok<!--separate-->{"response":"valid signature"}' );
}

?>
