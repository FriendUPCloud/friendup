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

if( $dir = opendir( 'resources/themes' ) )
{
	$out = array();
	while( $file = readdir( $dir ) )
	{
		if( $file{0} == '.' ) continue;
		if( !file_exists( 'resources/themes/' . $file . '/theme.css' ) )
			continue;
		$o = new stdClass();
		$o->WebPath = 'themes/' . $file;
		$o->Name = ucfirst( $file );
		$out[] = $o;
	}
	closedir( $dir );
	if( count( $out ) > 0 )
	{
		die( 'ok<!--separate-->' . json_encode( $out ) );
	}
}
die( 'fail' );

?>
