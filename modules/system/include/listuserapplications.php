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

$userid = $level == 'Admin' && isset( $args->args->userid ) ? 
	$args->args->userid : $User->ID;

if( $rows = $SqlDatabase->FetchObjects( '
	SELECT
		ua.ID,
		ua.ApplicationID,
		n.Name,
		n.Config,
		ua.Permissions,
		ua.Data,
		f.ID AS "DockStatus"
	FROM 
		FUserApplication ua,
		FApplication n
		LEFT JOIN DockItem f ON ( f.Application = n.Name AND f.UserID = \'' . $userid . '\' )
	WHERE
		n.ID = ua.ApplicationID AND
		ua.UserID=\'' . $userid . '\'
	ORDER BY
		n.Name ASC
' ) )
{
	$basepaths = array(
		'resources/webclient/apps/',
		'repository/'
	);
	foreach( $rows as $k=>$v )
	{
		// Include image preview
		$fnd = false;
		foreach( $basepaths as $path )
		{
			// For repositories
			if( $path == 'repository/' )
			{
				if( file_exists( $path . $file . '/Signature.sig' ) )
				{
					if( !( $d = file_get_contents( 'repository/' . $file . '/Signature.sig' ) ) )
						continue;
					if( !( $js = json_decode( $d ) ) )
						continue;
					if( !isset( $js->validated ) )
						continue;
				}
			}
			if( file_exists( $path . '/' . $v->Name . '/preview.png' ) )
			{
				$fnd = $path . '/' . $v->Name . '/preview.png';
				break;
			}
		}
		if( $fnd )
		{
			$rows[ $k ]->Preview = true;
		}
		$rows[ $k ]->Config = json_decode( $rows[ $k ]->Config );
	}
	die( 'ok<!--separate-->' . json_encode( $rows ) );
}
die( 'fail' );


?>
