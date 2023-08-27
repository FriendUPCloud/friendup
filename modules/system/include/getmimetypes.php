<?php
/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
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
		ORDER BY s.Data ASC, s.ID DESC
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
