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

global $Logger;

if( $dir = opendir( 'resources/webclient/apps' ) )
{
	$out = [];
	$cats = [];
	
	while( $file = readdir( $dir ) )
	{
		if( $file{0} == '.' ) continue;
		if( !file_exists( $fz = 'resources/webclient/apps/' . $file . '/Config.conf' ) )
			continue;
		if( $f = file_get_contents( $fz ) )
		{
			if( $fj = json_decode( $f ) )
			{
				$subs = explode( '/', $fj->Category );
				$cat = $subs[0];
				if( !in_array( $cat, $cats ) )
					$cats[] = $cat;
			}
		}
	}
	closedir( $dir );
	
	if( count( $cats ) )
	{
		foreach( $cats as $cat )
		{
			$o = new stdClass();
			$o->Filename = ucfirst( $cat );
			$o->Type = 'Directory';
			$o->MetaType = 'Directory';
			$o->IconFile = 'gfx/icons/128x128/places/folder-brown.png';
			$o->Path = 'System:Software/' . ucfirst( $cat ) . '/';
			$o->Permissions = '';
			$o->DateModified = date( 'Y-m-d H:i:s' );
			$o->DateCreated = '1970-01-01 00:00:00';
			$out[] = $o;
		}
		die( 'ok<!--separate-->' . json_encode( $out ) );
	}
}
die( 'ok<!--separate-->[]' );

?>
