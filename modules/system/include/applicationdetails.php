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
