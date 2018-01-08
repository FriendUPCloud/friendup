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
if( !isset( $args->args->type ) ) die( 'fail<!--separate-->{"response":"dos driver gui failed"}'  );
if( isset( $args->args->component ) && isset( $args->args->language ) )
{
	if( $args->args->component == 'locale' )
	{
		$f = 'devices/DOSDrivers/' . $args->args->type . '/Locale/' . $args->args->language . '.lang';
		if( file_exists( $f ) )
		{
			die( 'ok<!--separate-->' . file_get_contents( $f ) );
		}
		die( 'fail<!--separate-->' . $f );
	}
}
if( $level == 'Admin' && file_exists( $f = ( 'devices/DOSDrivers/' . $args->args->type . '/gui_admin.html' ) ) )
{
	die( 'ok<!--separate-->' . file_get_contents( $f ) );
}
else if( file_exists( $f = ( 'devices/DOSDrivers/' . $args->args->type . '/gui.html' ) ) )
{
	die( 'ok<!--separate-->' . file_get_contents( $f ) );
}
die( 'fail<!--separate-->{"response":"dosdrivergui failed"}'  );

?>
