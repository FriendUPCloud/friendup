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

$out = [];

if( $dir = opendir( 'repository' ) )
{
	while( $file = readdir( $dir ) )
	{
		if( $file{0} == '.' )
			continue;
		$p = 'repository/' . $file . '/';
		$c = new stdClass();
		$c->Filename = $file;
		if( isset( $args->packageget ) && $file == $args->packageget )
		{
			if( file_exists( 'repository/' . $file . '/package.zip' ) )
			{
				FriendHeader( 'Content-Type: application/octet-stream' );
				FriendHeader( 'Content-Disposition: attachment; filename=package.zip' );
				closedir( $dir );
				die( file_get_contents( 'repository/' . $file . '/package.zip' ) );
			}
			closedir( $dir );
			die( 'fail<!--separate-->{"response":"package file does not exist!"}' ); 
		}
		if( file_exists( $p . 'Signature.sig' ) )
		{
			$c->Signature = file_get_contents( $p . 'Signature.sig' );
			if( $c->Signature )
			{
				$s = json_decode( $c->Signature );
				$c->Signature = $s->signature;
				$c->Validated = isset( $s->validated ) ? $s->validated : false;
			}
		}
		else $c->Signature = 'Unsigned';
		$out[] = $c;
	}
	closedir( $dir );
}

if( !count( $out ) )
{
	die( 'fail<!--separate-->{"response":"no unverified software"}' );
}
die( 'ok<!--separate-->' . json_encode( $out ) );

?>
