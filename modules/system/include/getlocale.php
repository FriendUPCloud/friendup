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

die( 'fail' );

?>
