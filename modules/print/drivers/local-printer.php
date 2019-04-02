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

// TODO: Support file conversions
$file = new File( $args->args->file );
if( $file->Load() )
{
	$ftpl = 'friend_print_file';
	$fn = $ftpl;
	$num = 1;
	while( file_exists( '/tmp/' . $fn ) )
	{
		$fn = $ftpl . '_' . ( $num++ );
	}
	if( $f = fopen( '/tmp/' . $fn, 'w+' ) )
	{
		fwrite( $f, $file->GetContent() );
		fclose( $f );
		
		$response = shell_exec( 'lp /tmp/' . $fn );
		
		// Clean up
		unlink( '/tmp/' . $fn );
		
		die( 'ok<!--separate-->{"response":1,"message":"Document was sent to printer."}' );
	}
	die( 'fail<!--separate-->{"response":-1,"message":"Missing parameters."}' );
}

die( 'fail<!--separate-->{"response":-1,"message":"Could not load print file."}' );

?>
