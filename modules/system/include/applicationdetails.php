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

$paths = [ 'resources/webclient/apps/', 'repository/' ];

$appdata = new stdClass();

$Logger->log( print_r( $args, 1 ) );

if( isset( $args->args->application ) && isset( $args->args->mode ) )
{
	foreach( $paths as $path )
	{
		if( $dir = opendir( $path ) )
		{
			while( $file = readdir( $dir ) )
			{
				if( $file{0} == '.' ) continue;
				if( $file == $args->args->application )
				{
					$appPath = $path . $file . '/';
					if( $args->args->mode == 'data' )
					{
						if( file_exists( $appPath . 'Readme.md'  ) )
						{
							$appdata->readme = file_get_contents( $appPath . 'Readme.md' );
						}
						if( file_exists( $appPath . 'Resources.md'  ) )
						{
							$appdata->resources = file_get_contents( $appPath . 'Resources.md' );
						}
						if( file_exists( $appPath . 'Config.conf' ) )
						{
							$appdata->config = file_get_contents( $appPath . 'Config.conf' );
						}
						closedir( $dir );
						die( 'ok<!--separate-->' . json_encode( $appdata ) );
					}
					if( $args->args->mode == 'screenshot' )
					{
						if( file_exists( $appPath . 'screenshot.jpg' ) )
						{
							FriendHeader( 'Content-Type: image/jpeg' );
							closedir( $dir );
							die( file_get_contents( $appPath . 'screenshot.jpg' ) );
						}
						closedir( $dir );
						die( 'fail' );
					}
					else if( $args->args->mode == 'featuredimage' )
					{
						if( file_exists( $appPath . 'featured.jpg' ) )
						{
							FriendHeader( 'Content-Type: image/jpeg' );
							closedir( $dir );
							die( file_get_contents( $appPath . 'featured.jpg' ) );
						}
						// Fallback on screenshot
						if( file_exists( $appPath . 'screenshot.jpg' ) )
						{
							FriendHeader( 'Content-Type: image/jpeg' );
							closedir( $dir );
							die( file_get_contents( $appPath . 'screenshot.jpg' ) );
						}
						closedir( $dir );
						die( 'fail' );
					}
					break;
				}
			}
			closedir( $dir );
		}
	}
}

die( 'fail' );

?>
