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

function findInSearchPaths( $app )
{
	$ar = array(
		'repository/',
		'resources/webclient/apps/'
	);
	foreach ( $ar as $apath )
	{
		if( file_exists( $apath . $app ) && is_dir( $apath . $app ) )
		{
			return $apath . $app;
		}
	}
	return false;
}

if( $path = findInSearchPaths( $args->args->application ) )
{
	if( file_exists( $path . '/Config.conf' ) )
	{
		$f = file_get_contents( $path . '/Config.conf' );
		// Path is dynamic!
		$f = preg_replace( '/\"Path[^,]*?\,/i', '"Path": "' . $path . '/",', $f );
		
		// Store application!
		$a = new dbIO( 'FApplication' );
		$a->Config = $f;
		$a->UserID = $User->ID;
		$a->Name = $args->args->application;
		$a->Permissions = 'UGO';
		$a->DateInstalled = date( 'Y-m-d H:i:s' );
		$a->DateModified = $a->DateInstalled;
		$a->Save();
		if( $a->ID > 0 )
		{
			die( 'ok<!--separate-->' . $a->ID );
		}
	}
}
die( 'failed' );

?>
