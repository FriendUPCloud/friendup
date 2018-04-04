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

global $args, $SqlDatabase;

include( 'php/friend.php' );

if( isset( $args->command ) )
{
	if( $args->command == 'loadmodules' )
	{
		$modules = array();
		
		if( $dir = opendir( 'modules/workstream/applications' ) )
		{
			while( $f = readdir( $dir ) )
			{
				if( $f{0} == '.' )
					continue;
				$modules[] = ucfirst( $f );
			}
			closedir( $dir );
		}
		
		die( 'ok<!--separate-->' . json_encode( $modules ) );
	}
}

?>
