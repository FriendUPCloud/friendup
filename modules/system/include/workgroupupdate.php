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

if( $level == 'Admin' )
{
	if( isset( $args->args->userid ) && $args->args->userid > 0 && isset( $args->args->workgroups ) )
	{
		if( $wgs = $SqlDatabase->FetchObjects( '
			SELECT 
				g.ID, 
				g.Name, 
				ug.UserID 
			FROM 
				`FUserGroup` g 
					LEFT JOIN `FUserToGroup` ug ON 
					(
							ug.UserID = \'' . $args->args->userid . '\' 
						AND g.ID = ug.UserGroupID 
					) 
			WHERE g.Type = "Workgroup" 
			ORDER BY g.Name ASC 
		' ) )
		{
			foreach( $wgs as $wg )
			{
				//
				
				if( in_array( $wg->ID, $args->args->workgroups ) )
				{
					if( !$wg->UserID )
					{
						$SqlDatabase->query( '
						INSERT INTO FUserToGroup 
							( UserID, UserGroupID ) 
							VALUES 
							( \'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->userid ) . '\', \'' . $wg->ID . '\' ) 
						' );
					}
				}
				else if( $wg->UserID > 0 )
				{
					$SqlDatabase->query( 'DELETE FROM FUserToGroup WHERE UserID=\'' . $wg->UserID . '\' AND UserGroupID=\'' . $wg->ID . '\'' );
				}
			}
			
			die( 'ok' );
		}
	}
	else
	{
		// Get the fusergroup object and update the name
		$o = new dbIO( 'FUserGroup' );
		if( $o->Load( $args->args->ID ) )
		{
			$o->Name = $args->args->Name;
			$o->Save();
		
			if( $o->ID > 0 && $args->args->Setup )
			{
				if( $setup = $SqlDatabase->FetchObject( '
					SELECT g.ID, g.Name, g.UserID 
					FROM `FUserGroup` g 
					WHERE g.Type = \'Setup\' AND g.ID = \'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->Setup ) . '\' 
				' ) )
				{
					$s = new dbIO( 'FUserGroup' );
					$s->Type = 'SetupGroup';
					$s->UserID = $o->ID;
					$s->Load();
					$s->Name = $args->args->Setup;
					$s->Save();
				}
			}
		
			// Update members, delete old and insert anew
			$SqlDatabase->query( 'DELETE FROM FUserToGroup WHERE UserGroupID=\'' . $o->ID . '\'' );
			if( $o->ID > 0 && isset( $args->args->Members ) )
			{
				$mems = explode( ',', $args->args->Members );
				foreach( $mems as $m )
				{
					if( $m <= 0 ) continue;
					$SqlDatabase->query( '
					INSERT INTO FUserToGroup 
						( UserID, UserGroupID ) 
						VALUES 
						( \'' . mysqli_real_escape_string( $SqlDatabase->_link, $m ) . '\', \'' . $o->ID . '\' )
					' );
				}
				die( 'ok<!--separate-->' . $o->ID );
			}
		}
	}
}
die( 'fail' );

?>
