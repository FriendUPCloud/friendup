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

global $User, $SqlDatabase;

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
	// Delete all applications and fuserapplication!
	if( $rows = $SqlDatabase->FetchObjects( '
		SELECT * FROM FApplication 
		WHERE 
			UserID=\'' . $User->ID . '\' AND 
			`Name`=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->application ) . '\'' 
	) )
	{
		foreach( $rows as $row )
		{
			$SqlDatabase->Query( 'DELETE FROM FUserApplication WHERE UserID=\'' . $User->ID . '\' AND ApplicationID=\'' . $row->ID . '\'' );
			$SqlDatabase->Query( 'DELETE FROM FApplication WHERE ID=\'' . $row->ID . '\'' );
		}
	}
	die( 'ok<!--separate-->' );
}
die( 'failed' );

?>
