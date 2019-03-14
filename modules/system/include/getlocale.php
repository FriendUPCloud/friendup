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

if( isset( $args->args->type ) )
{
	switch( strtolower( $args->args->type ) )
	{
		case 'dosdrivers':
			$str = '';
			if( $dir = opendir( 'devices/DOSDrivers' ) )
			{
				while( $file = readdir( $dir ) )
				{
					if( $file{0} == '.' ) continue;
					$base = 'devices/DOSDrivers/' . $file;
					if( 
						file_exists( $base ) && 
						is_dir( $base )
					)
					{
						$base2 = $base . '/Locale';
						if( 
							file_exists( $base2 ) && 
							is_dir( $base2 )
						)
						{
							$base3 = $base2 . '/' . $args->args->locale . '.lang';
							if( file_exists( $base3 ) )
							{
								$str .= file_get_contents( $base3 );
							}
						}
					}
				}
				closedir( $dir );
			}
			if( strlen( $str ) )
			{
				die( 'ok<!--separate-->' . $str );
			}
			break;
		default:
			break;
	}
}

die( 'fail<!--separate-->{"response":"fatal error in getlocale no type given"}' );

?>
