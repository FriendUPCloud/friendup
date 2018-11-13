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

if( $dir = opendir( 'modules' ) )
{
	$mods = [];
	while( $file = readdir( $dir ) )
	{
		if( $file{0} == '.' ) continue;
		$o = new stdClass();
		$o->Filename = ucfirst( $file ) . '.module';
		$o->Path = 'System:Modules/' . ucfirst( $file ) . '.module';
		$o->Permissions = '';
		$o->DateModified = date( 'Y-m-d H:i:s' );
		$o->DateCreated = '1970-01-01 00:00:00';
		$o->Filesize = 1024;
		$o->MetaType = 'File';
		$o->IconClass = 'Module';
		$o->Type = 'File';
		$mods[] = $o;
	}
	closedir( $dir );
	die( 'ok<!--separate-->' . json_encode( $mods ) );
}
die( 'fail' );

?>
