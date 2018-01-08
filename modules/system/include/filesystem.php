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
$userid = $User->ID;
if( $level == 'Admin' && $args->args->userid )
{
	$userid = $args->args->userid;
}

// Find by ID
if( isset( $args->args->id ) )
{
	if( $row = $SqlDatabase->FetchObject( '
		SELECT f . * , u.Name AS Workgroup
		FROM Filesystem f
		LEFT JOIN FUserGroup u ON ( u.ID = f.GroupID AND u.Type =  "Workgroup" )
		WHERE
			f.UserID=\'' . $userid . '\' AND f.ID=\'' . intval( $args->args->id ) . '\'
		LIMIT 1
	' ) )
	{
		if( $key = $SqlDatabase->FetchObject( '
			SELECT *
			FROM
				`FKeys` k
			WHERE
					k.UserID = \'' . $userid . '\'
				AND k.RowType = "Filesystem"
				AND k.RowID = \'' . intval( $args->args->id ) . '\'
				AND k.IsDeleted = "0"
			ORDER
				BY k.ID DESC
			LIMIT 1
		' ) )
		{
			$row->Key = $key;
		}

		die( 'ok<!--separate-->' . json_encode( $row ) );
	}
}
// Find by devname
else if( isset( $args->args->devname ) )
{
	$devname = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->devname );
	if( $row = $SqlDatabase->FetchObject( '
		SELECT f.* , u.Name AS Workgroup
		FROM Filesystem f
		LEFT JOIN FUserGroup u ON ( u.ID = f.GroupID AND u.Type = "Workgroup" )
		WHERE
			f.UserID=\'' . $userid . '\' AND f.Name="' . $devname . '"
		LIMIT 1
	' ) )
	{
		if( $key = $SqlDatabase->FetchObject( '
			SELECT *
			FROM
				`FKeys` k
			WHERE
					k.UserID = \'' . $userid . '\'
				AND k.RowType = "Filesystem"
				AND k.RowID = \'' . intval( $row->ID ) . '\'
				AND k.IsDeleted = "0"
			ORDER
				BY k.ID DESC
			LIMIT 1
		' ) )
		{
			$row->Key = $key;
		}

		die( 'ok<!--separate-->' . json_encode( $row ) );
	}
}

die( 'fail<!--separate-->{"response":"-1","message":"Could not find filesystem."}' );

?>
