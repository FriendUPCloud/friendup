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

if( $f = opendir( 'libs' ) )
{
	$o = new stdClass();
	$s = stat( 'FriendCore' );
	$o->Filename = 'system.library';
	$o->Title = $o->Filename;
	$o->Path = 'System:Libraries/';
	$o->Permissions = '';
	$o->DateModified = date( 'Y-m-d H:i:s', $s[9] );
	$o->DateCreated = date( 'Y-m-d H:i:s', $s[10] );
	$o->Filesize = filesize( 'FriendCore' );
	$o->MetaType = 'File';
	$o->IconClass = 'System_Library';
	$o->Type = 'File';
	$out = array( $o );
	
	while( $fl = readdir( $f ) )
	{
		if( $fl{0} == '.' ) continue;
		if( is_dir( 'libs/' . $fl ) ) continue;
		$s = stat( 'libs/' . $fl );
		$o = new stdClass();
		$o->Filename = $fl;
		$o->Title = $fl;
		$o->Filesize = filesize( 'libs/' . $fl );
		$o->DateModified = date( 'Y-m-d H:i:s', $s[9] );
		$o->DateCreated = date( 'Y-m-d H:i:s', $s[10] );
		$o->Path = 'System:Libraries/' . $fl;
		$o->Type = 'File';
		$o->IconClass = 'System_Library';
		$out[] = $o;
	}
	closedir( $f );
	
	die( 'ok<!--separate-->' . json_encode( $out ) );
}
die( 'fail' );

?>
