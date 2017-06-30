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


global $SqlDatabase, $User;

// Gets a list of all the users mime types grouped by executable
function _get_mimetypes()
{
	global $SqlDatabase, $User;

	$types = [];
	
	if( $rows = $SqlDatabase->FetchObjects( '
		SELECT * FROM FSetting s
		WHERE
			s.UserID = \'' . $User->ID . '\'
			AND
			s.Type = \'mimetypes\'
		ORDER BY s.Data ASC
	' ) )
	{
		foreach( $rows as $row )
		{
			$found = false;
			if( count( $types ) )
			{
				foreach( $types as $type )
				{
					if( $type->executable == $row->Data )
					{
						$type->types[] = $row->Key;
						$found = true;
					}
				}
			}
			if( !$found )
			{
				$o = new stdClass();
				$o->executable = $row->Data;
				$o->types = array( $row->Key );
				$types[] = $o;
			}
		}
	}
	return $types;
}

$types = _get_mimetypes();
if( count( $types ) )
{
	die( 'ok<!--separate-->' . json_encode( $types ) );
}
else
{
	// Try to generate for user!
	if( $rows = $SqlDatabase->FetchObjects( '
		SELECT ua.ID, n.Name, ua.Permissions, ua.Data FROM FUserApplication ua, FApplication n
		WHERE
			n.ID = ua.ApplicationID AND ua.UserID=\'' . $User->ID . '\'
		ORDER BY n.Name ASC
	' ) )
	{
		foreach( $rows as $row )
		{
			if( file_exists( $f = ( 'resources/webclient/apps/' . $row->Name . '/Config.conf' ) ) )
			{
				$obj = json_decode( file_get_contents( $f ) );
				if( $obj )
				{
					if( $obj->MimeTypes )
					{
						foreach( $obj->MimeTypes as $k=>$v )
						{
							$s = new dbIO( 'FSetting' );
							$s->UserID = $User->ID;
							$s->Type = 'mimetypes';
							$s->Key = '.'. strtolower( $k );
							$s->Data = $row->Name;
							$s->Save();
						}
					}
				}
			}
		}
		$types = _get_mimetypes();
		if( count( $types ) )
		{
			die( 'ok<!--separate-->' . json_encode( $types ) );
		}
	}
}
die( 'fail' );

?>
