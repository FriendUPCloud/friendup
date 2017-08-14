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

if( $dir = opendir( 'libs' ) )
{
	$mods = [];
	while( $file = readdir( $dir ) )
	{
		if( $file{0} == '.' ) continue;
		$o = new stdClass();
		$o->Filename = $file;
		$o->Path = 'System:Libraries/';
		$o->Permissions = '';
		$o->DateModified = date( 'Y-m-d H:i:s' );
		$o->DateCreated = '1970-01-01 00:00:00';
		$o->Filesize = 1024;
		$o->MetaType = 'File';
		$o->IconFile = 'gfx/icons/128x128/mimetypes/application-octet-stream.png';
		$o->Type = 'File';
		$mods[] = $o;
	}
	closedir( $dir );
	die( 'ok<!--separate-->' . json_encode( $mods ) );
}
die( 'fail' );

?>
