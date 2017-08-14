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

global $User, $SqlDatabase;

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
	// Delete all applications and fuserapplication!
	if( $rows = $SqlDatabase->FetchObjects( '
		SELECT * FROM FApplication 
		WHERE 
			UserID=\'' . $User->ID . '\' AND 
			`Name`=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->application ) . '\'' 
	) )
	{
		foreach( $rows as $row )
		{
			$SqlDatabase->Query( 'DELETE FROM FUserApplication WHERE UserID=\'' . $User->ID . '\' AND ApplicationID=\'' . $row->ID . '\'' );
			$SqlDatabase->Query( 'DELETE FROM FApplication WHERE ID=\'' . $row->ID . '\'' );
		}
	}
	die( 'ok<!--separate-->' );
}
die( 'failed' );

?>
