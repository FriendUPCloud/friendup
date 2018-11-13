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

global $Logger;
$out = [];
$cats = [];
foreach( array( 'resources/webclient/apps/', 'repository/' ) as $cpath )
{
	if( $dir = opendir( $cpath ) )
	{
		while( $file = readdir( $dir ) )
		{
			if( $file{0} == '.' ) continue;
			if( !file_exists( $fz = $cpath . $file . '/Config.conf' ) )
				continue;
			if( $f = file_get_contents( $fz ) )
			{
				if( $fj = json_decode( $f ) )
				{
					$subs = explode( '/', $fj->Category );
					$cat = $subs[0];
					if( !in_array( $cat, $cats ) )
						$cats[] = $cat;
				}
			}
		}
		closedir( $dir );
	}
}
if( count( $cats ) )
{
	foreach( $cats as $cat )
	{
		$o = new stdClass();
		$o->Filename = ucfirst( $cat );
		$o->Type = 'Directory';
		$o->MetaType = 'Directory';
		$o->IconClass = 'DirectoryBrown';
		$o->Path = 'System:Software/' . ucfirst( $cat ) . '/';
		$o->Permissions = '';
		$o->DateModified = date( 'Y-m-d H:i:s' );
		$o->DateCreated = '1970-01-01 00:00:00';
		$out[] = $o;
	}
	die( 'ok<!--separate-->' . json_encode( $out ) );
}
die( 'ok<!--separate-->[]' );

?>
