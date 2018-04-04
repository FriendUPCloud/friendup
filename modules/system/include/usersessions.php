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

global $SqlDatabase;

if( $level != 'Admin' ) die( '404' );

if( $rows = $SqlDatabase->FetchObjects( '
	SELECT u.FullName, u.Name, u.SessionID, u.ID 
	FROM FUser u 
	' . ( isset( $args->args->userid ) && $args->args->userid ? '
	WHERE u.ID IN (' . $args->args->userid . ') 
	' : '' ) . '
	ORDER BY u.FullName ASC 
	' . ( isset( $args->args->limit ) && $args->args->limit ? '
	LIMIT ' . $args->args->limit . ' 
	' : '' ) . '
' ) )
{
	die( 'ok<!--separate-->' . json_encode( $rows ) );
}
die( 'fail' );

?>
