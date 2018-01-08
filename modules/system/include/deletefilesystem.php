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
// Find by devname
if( isset( $args->args->devname ) )
{
	$devname = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->devname );
	if( $row = $SqlDatabase->FetchObject( '
		SELECT f . * , u.Name AS Workgroup
		FROM Filesystem f
		LEFT JOIN FUserGroup u ON ( u.ID = f.GroupID AND u.Type =  "Workgroup" )
		WHERE
			f.UserID=\'' . $User->ID . '\' AND f.Name="' . $devname . '"
		LIMIT 1
	' ) )
	{
		$SqlDatabase->Query( 'UPDATE `Filesystem` SET `Mounted`=\'-1\' WHERE ID=\'' . $row->ID . '\'' );
		
		die( 'ok<!--separate-->{"response":"1","message":"Disk was disabled"}' );
	}
}

die( 'fail<!--separate-->{"response":"0","message":"Could not disable disk"}' );

?>
