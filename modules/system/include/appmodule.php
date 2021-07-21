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

function findInSearchPaths( $app )
{
	$ar = array(
		'repository/',
		'resources/webclient/apps/'
	);
	foreach ( $ar as $apath )
	{
		if( file_exists( $apath . $app ) && is_dir( $apath . $app ) )
		{
			return $apath . $app;
		}
	}
	return false;
}

$path = false;

if( isset( $args->args->appName ) && isset( $args->args->command ) )
{
	if( !( $path = findInSearchPaths( $args->args->appName ) ) )
	{
		die( 'fail<!--separate-->{"message":"Invalid app module.","response":-1}' );
	}
}

// Why not support both cases
if( $path && file_exists( $path . '/Module' ) && is_dir( $path . '/Module' ) && file_exists( $path . '/Module/module.php' ) )
{
	require( $path . '/Module/module.php' );
}
else if( $path && file_exists( $path . '/module' ) && is_dir( $path . '/module' ) && file_exists( $path . '/module/module.php' ) )
{
	require( $path . '/module/module.php' );
}

die( 'fail<!--separate-->{"message":"Unexpected response of app module.","response":-1}' );

?>
