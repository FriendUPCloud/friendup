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

$fs = new DbIO( 'Filesystem' );
$fs->Name = $args->disk;
$fs->UserID = $User->ID;
if( $fs->Load() )
{
	if( $row = $SqlDatabase->fetchRow( $q = 'SELECT BlobBig FROM `FSBlob` WHERE `RowType` = \'Filesystem\' AND `RowID` = \'' . $fs->ID . '\' LIMIT 1' ) )
	{
		FriendHeader( 'Content-Type: image/jpeg' );
		die( base64_decode( $row['BlobBig'] ) );
	}
}

if( file_exists('web_desktop/gfx/system/logo_busy.gif') )
{
	FriendHeader( 'Content-Type: image/gif' );
	die( file_get_contents( 'web_desktop/gfx/system/logo_busy.gif' ) );	
}

?>
