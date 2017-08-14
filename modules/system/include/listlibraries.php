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

if( $f = opendir( 'libs' ) )
{
	$o = new stdClass();
	$s = stat( 'FriendCore' );
	$o->Filename = 'system.library';
	$o->Title = $o->Filename;
	$o->Path = 'System:Libraries/';
	$o->Permissions = '';
	$o->DateModified = date( 'Y-m-d H:i:s', $s[9] );
	$o->DateCreated = date( 'Y-m-d H:i:s', $s[10] );
	$o->Filesize = filesize( 'FriendCore' );
	$o->MetaType = 'File';
	$o->IconClass = 'System_Library';
	$o->Type = 'File';
	$out = array( $o );
	
	while( $fl = readdir( $f ) )
	{
		if( $fl{0} == '.' ) continue;
		if( is_dir( 'libs/' . $fl ) ) continue;
		$s = stat( 'libs/' . $fl );
		$o = new stdClass();
		$o->Filename = $fl;
		$o->Title = $fl;
		$o->Filesize = filesize( 'libs/' . $fl );
		$o->DateModified = date( 'Y-m-d H:i:s', $s[9] );
		$o->DateCreated = date( 'Y-m-d H:i:s', $s[10] );
		$o->Path = 'System:Libraries/' . $fl;
		$o->Type = 'File';
		$o->IconClass = 'System_Library';
		$out[] = $o;
	}
	closedir( $f );
	
	die( 'ok<!--separate-->' . json_encode( $out ) );
}
die( 'fail' );

?>
