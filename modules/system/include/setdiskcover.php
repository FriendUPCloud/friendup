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

// Create FSFile table for managing doors
$t = new DbTable( 'FSBlob' );
$t->load();

include_once( 'php/classes/file.php' );

// TODO: Move this to dbcheck.php
// Check the db
$foundRowType = $foundRowID = $BlobBig = false;
foreach( $t->_fieldnames as $fn )
{
	if( $fn == 'RowType' ) $foundRowType = true;
	if( $fn == 'RowID' ) $foundRowID = true;
	if( $fn == 'BlobBig' ) $foundBlobBig = true;
}
if( !$foundRowID )
{
	$SqlDatabase->query( 'ALTER TABLE FSBlob ADD `RowID` bigint(20) NOT NULL DEFAULT 0 AFTER `FileID`' );
}
if( !$foundRowType )
{
	$SqlDatabase->query( 'ALTER TABLE FSBlob ADD `RowType` varchar(255) NOT NULL DEFAULT "" AFTER `RowID`' );
}
if( !$foundBlobBig )
{
	$SqlDatabase->query( 'ALTER TABLE FSBlob ADD `BlobBig` longblob NOT NULL DEFAULT "" AFTER `RowType`' );
}

// Do the file operation
if( $args->args->path && $args->args->disk )
{
	$fs = new DbIO( 'Filesystem' );
	$fs->Name = $args->args->disk;
	$fs->UserID = $User->ID;
	if( $fs->Load() )
	{
		$f = new File( $args->args->path );
		if( $f->Load() )
		{
			$img = getimagesizefromstring( $f->_content );
			$SqlDatabase->query( 'DELETE FROM `FSBlob` WHERE `RowType` = \'Filesystem\' AND `RowID` = \'' . $fs->ID . '\' LIMIT 1' );
			$SqlDatabase->query( 'INSERT INTO `FSBlob` ( `RowType`, `RowID`, `BlobBig` ) VALUES ( ' . 
				'\'Filesystem\', \'' . $fs->ID . '\', "' . base64_encode( $f->_content ) . '" )' );
			die( 'ok' );
		}
	}
}

die( 'fail' );

?>
