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

global $SqlDatabase, $User, $Config;

$p = explode( ':', strtolower( $args->args->path ) );
if( $p[0] == 'system' )
{
	$o = new stdClass();
	$o->Used = 0;
	$o->Filesize = 0;
	die( 'ok<!--separate-->' . json_encode( $o ) );
}

if( $row = $SqlDatabase->FetchObject( '
	SELECT f.* FROM Filesystem f 
	WHERE 
		f.Name=\'' . reset( explode( ':', $args->args->path ) ) . '\' AND
		( 
			f.UserID=\'' . $User->ID . '\' OR
			f.GroupID IN (
				SELECT ug.UserGroupID FROM FUserToGroup ug, FUserGroup g
				WHERE 
					g.ID = ug.UserGroupID AND g.Type = \'Workgroup\' AND
					ug.UserID = \'' . $User->ID . '\'
			) 
		)
	LIMIT 1
' ) )
{
	if( file_exists( $f = ( 'devices/DOSDrivers/' . $row->Type . '/door.php' ) ) )
	{
		include( $f ); $door->dosAction( $args );
	}
	// Experimental, trying to get volume info directly from FriendCore
	else
	{
		$Logger->log( 'We are getting volume info for a native device: ' . $args->args->path );
		if( ( $res = @file_get_contents( ( $Config->SSLEnabled ? 'https://' : 'http://' ) . 
			$Config->FCHost . ':' . $Config->FCPort . '/system.library/file/info?path=' . 
			$args->args->path . '&sessionid=' . $args->args->sessionid )
		) )
		{
			die( 'ok<!--separate-->' . $res );
		}
		// TODO: Return fail here, for now, Friend Core has no support for volume info
		//       Assuming always 500 MB left no device!
		else
		{
			$o = new stdClass();
			$o->Volume = $row->Name . ':';
			$o->Used = 0;
			$o->Filesize = 500 * 1024 * 1024;
			die( 'ok<!--separate-->' . json_encode( $o ) );
		}
	}
}
die( 'fail' );

?>
