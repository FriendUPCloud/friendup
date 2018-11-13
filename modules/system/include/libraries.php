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

if( $dir = opendir( 'libs' ) )
{
	$mods = [];
	while( $file = readdir( $dir ) )
	{
		if( $file{0} == '.' ) continue;
		$o = new stdClass();
		$o->Filename = $file;
		$o->Path = 'System:Libraries/';
		$o->Permissions = '';
		$o->DateModified = date( 'Y-m-d H:i:s' );
		$o->DateCreated = '1970-01-01 00:00:00';
		$o->Filesize = 1024;
		$o->MetaType = 'File';
		$o->IconFile = 'gfx/icons/128x128/mimetypes/application-octet-stream.png';
		$o->Type = 'File';
		$mods[] = $o;
	}
	closedir( $dir );
	die( 'ok<!--separate-->' . json_encode( $mods ) );
}
die( 'fail' );

?>
