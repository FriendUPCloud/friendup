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

if( $level == 'Admin' )
{
	$app = $args->args->path;

	if( file_exists( $app ) )
	{
		system( "{$app} >> /dev/null &" );
	
		// TODO: PS PR USER ONLY!
	
		$appName = $app;
		if( strstr( $app, '/' ) ) $appName = end( explode( '/', $app ) );
		exec( "ps -a | grep {$appName}", $output );
	
		die( 'ok<!--separate-->' . json_encode( $output ) );
	}
}
die( 'fail' );

?>
