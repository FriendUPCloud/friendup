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
if( $level == 'Admin' )
{
	$o = new DbIO( 'FUserGroup' );
	if( $o->Load( $args->args->id ) )
	{
		// Get members
		$mems = $SqlDatabase->FetchObjects( '
			SELECT u.ID, u.FullName FROM FUser u, FUserToGroup ug, FUserGroup g
			WHERE 
				ug.UserGroupID = \'' . $o->ID . '\' AND
				ug.UserGroupID = g.ID AND
				g.Type = \'Workgroup\' AND
				u.ID = ug.UserID
			ORDER BY u.FullName ASC
		' );
	
		$on = new stdClass();
		$on->Name = $o->Name;
		$on->ID = $o->ID;
		$on->Members = $mems ? $mems : '';
		
		if( $sts = $SqlDatabase->FetchObjects( '
			SELECT g.ID, g.Name, ug.UserID 
			FROM 
				`FUserGroup` g 
					LEFT JOIN `FUserGroup` ug ON 
					(
							ug.Name = g.ID 
						AND ug.Type = \'SetupGroup\' 
						AND ug.UserID = \'' . $o->ID . '\' 
					)
			WHERE g.Type = \'Setup\' 
			ORDER BY g.Name ASC 
		' ) )
		{
			$on->Setup = $sts;
		}
		
		die( 'ok<!--separate-->' . json_encode( $on ) );
	}
}
die( 'fail' );

?>
