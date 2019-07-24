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

if( $level != 'Admin' ) die( '404' );

if( !file_exists( 'log' ) || !is_dir( 'log' ) )
{
	die( 'fail<!--separate-->{"response":-1,"message":"No log folder created. Please contact your system administrator."}' );
}

if( !isset( $args->args->logfile ) )
{
	if( $d = opendir( 'log' ) )
	{
		$out = array();
	
		while( $f = readdir( $d ) )
		{
			if( $f{0} == '.' ) continue;
			
			// Handle differently
			if( is_dir( 'log/' . $f ) )
			{
				continue;
			}
			
			$info = stat( 'log/' . $f );

			$o = new stdClass();
			$o->Filename = $f;
			$o->DateModified = $info[9];
			$o->DateCreated = $info[10];
			$o->Filesize = $info[7];
			
			$out[] = $o;
		}

		closedir( $d );
	
		die( 'ok<!--separate-->{"response":1,"logs":' . json_encode( $out ) . '}' );
	}
}
else
{
	if( file_exists( 'log/' . $args->args->logfile ) )
	{
		$f = file_get_contents( 'log/' . $args->args->logfile );
		die( 'ok<!--separate-->' . $f );
	}
	die( 'fail<!--separate-->{"response":-1,"message":"Logfile does not exist."}' );
}

die( 'fail<!--separate-->{"response":-1,"message":"Could not find any logs."}' );

?>
