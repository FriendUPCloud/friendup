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
	$o = new DbIO( 'FUserGroup' );
	if( $o->Load( $args->args->id ) )
	{
		$s = new dbIO( 'FSetting' );
		$s->UserID = $o->ID;
		$s->Type = 'setup';
		$s->Key = 'usergroup';
		if( $s->Load() )
		{
			$s->Delete();
		}
		$SqlDatabase->query( 'DELETE FROM FUserToGroup WHERE UserGroupID=\'' . $o->ID . '\'' );
		$o->Delete();
		die( 'ok' );
	}
}
die( 'fail' );

?>
