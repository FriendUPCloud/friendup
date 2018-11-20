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

if( $dir = opendir( 'resources/themes' ) )
{
	$out = array();
	while( $file = readdir( $dir ) )
	{
		if( $file{0} == '.' ) continue;
		if( !file_exists( 'resources/themes/' . $file . '/theme.css' ) )
			continue;
		$o = new stdClass();
		$o->WebPath = 'themes/' . $file;
		$o->Name = ucfirst( $file );
		$out[] = $o;
	}
	closedir( $dir );
	if( count( $out ) > 0 )
	{
		die( 'ok<!--separate-->' . json_encode( $out ) );
	}
}
die( 'fail' );

?>
