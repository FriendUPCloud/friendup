<?php

/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

if( $f = opendir( 'libs' ) )
{
	$out = array();
	while( $fl = readdir( $f ) )
	{
		if( $fl{0} == '.' ) continue;
		if( is_dir( 'libs/' . $fl ) ) continue;
		$o = new stdClass();
		$o->Filename = $fl;
		$o->Title = $fl;
		$o->Filesize = filesize( 'libs/' . $fl );
		$o->Path = 'System:Libraries/' . $fl;
		$o->Type = 'File';
		$o->IconFile = 'gfx/icons/128x128/mimetypes/application-octet-stream.png';
		$out[] = $o;
	}
	closedir( $f );
	
	die( 'ok<!--separate-->' . json_encode( $out ) );
}
die( 'fail' );

?>
