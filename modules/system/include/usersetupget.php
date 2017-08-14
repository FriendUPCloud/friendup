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

// Only admins can get workgroups by id!
if( $level == 'Admin' && $args->args->id )
{
	if( $row = $SqlDatabase->FetchObject( '
		SELECT g.ID, g.Name, s.Data 
		FROM `FUserGroup` g, `FSetting` s 
		WHERE g.ID = \'' . $args->args->id . '\' AND g.Type = \'Setup\'
		AND s.UserID = g.ID AND s.Type = \'setup\' AND s.Key = \'usergroup\' 
		ORDER BY g.Name ASC 
	' ) )
	{
		die( 'ok<!--separate-->' . json_encode( $row ) );
	}
}
die( 'fail' );

?>
