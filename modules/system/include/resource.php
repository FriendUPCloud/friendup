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

$f = 'repository/' . $args->file;
$ext = explode( '.', $args->file );
$ext = array_pop( $ext );
if( file_exists( $f ) )
{
	switch( $ext )
	{
		case 'css':
			FriendHeader( 'Content-Type: text/css' );
			break;
	}
	die( file_get_contents( $f ) );
}
die( 'fail<!--separate-->{"response":"resource not found"}' . $f );

?>
