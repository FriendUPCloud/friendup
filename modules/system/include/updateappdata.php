<?php
/*©lpgl*************************************************************************
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


if( $row = $SqlDatabase->FetchObject( '
	SELECT * FROM FApplication WHERE `Name` = "' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->application ) . '"
' ) )
{
	if( $ur = $SqlDatabase->FetchObject( '
		SELECT * FROM FUserApplication WHERE UserID=\'' . $User->ID . '\' AND ApplicationID=\'' . $row->ID . '\'
	' ) )
	{
		$conf = json_decode( $ur->Data );
		
		$new = json_decode( $args->args->data );
		foreach( $new as $k=>$v )
		{
			$conf->$k = $v;
		}
		
		$SqlDatabase->Query( '
			UPDATE FUserApplication SET `Data`="' . mysqli_real_escape_string( $SqlDatabase->_link, json_encode( $conf ) ) . '" WHERE ID=\'' . $ur->ID . '\' AND UserID=\'' . $User->ID . '\'
		' );
		die( 'ok' );
	}
	die( 'fail' );
}

?>
