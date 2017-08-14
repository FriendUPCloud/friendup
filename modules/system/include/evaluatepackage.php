<?php

/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Lesser General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Lesser General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
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
	function hashEmRecursive( $p, &$hashes, $d = 0 )
	{
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
				$hashes[] = hash( 'sha256', $f ); // Add dir names
				if( is_dir( $p . '/' . $f ) )
				{
					hashEmRecursive( $p . '/' . $f, $hashes, $d + 1 );
				}
				$hashes[] = $hash = hash_file( 'sha256', $p . '/' . $f );
			}
			closedir( $hdir );
		}
	}
	hashEmRecursive( 'repository/' . $args->args->pckg, $hashes );
	
	// Validate signature
	$validation = hash( 'sha256', implode( '', $hashes ) );
	if( $validation != $signature->signature )
	{
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
