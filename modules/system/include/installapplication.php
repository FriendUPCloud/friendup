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

function findInSearchPaths( $app )
{
	$ar = array(
		'repository/',
		'resources/webclient/apps/'
	);
	foreach ( $ar as $apath )
	{
		if( file_exists( $apath . $app ) && is_dir( $apath . $app ) )
		{
			return $apath . $app;
		}
	}
	return false;
}

if( $path = findInSearchPaths( $args->args->application ) )
{
	if( file_exists( $path . '/Config.conf' ) )
	{
		$f = file_get_contents( $path . '/Config.conf' );
		// Path is dynamic!
		$f = preg_replace( '/\"Path[^,]*?\,/i', '"Path": "' . $path . '/",', $f );
		
		// Store application!
		$a = new dbIO( 'FApplication' );
		$a->Config = $f;
		$a->UserID = $User->ID;
		$a->Name = $args->args->application;
		$a->Permissions = 'UGO';
		$a->DateInstalled = date( 'Y-m-d H:i:s' );
		$a->DateModified = $a->DateInstalled;
		$a->Save();
		if( $a->ID > 0 )
		{
			die( 'ok<!--separate-->' . $a->ID );
		}
	}
}
die( 'failed' );

?>
