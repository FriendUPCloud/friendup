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

/* Gets the device settings from FMetaData and returns it in a JSON structure */

global $SqlDatabase, $User, $Config, $UserSession;

// Make sure the user has a shared disk
$sh = new dbIO( 'Filesystem' );
$sh->UserID = $User->ID;
$sh->Name = 'Shared';
$sh->Type = 'SharedDrive';
if( !$sh->Load() )
{
	$sh->Save();
}
if( $sh->Mounted != 1 )
{
	$res = FriendCall( ( $Config->SSLEnable ? 'https' : 'http' ) . '://localhost:' . $Config->FCPort . '/system.library/device/mount?sessionid=' . $UserSession->SessionID, false,
		array( 
			'devname'   => $sh->Name
		)
	);
}

// Single device
if( isset( $args->args->filesystemid ) )
{
	if( $data = $SqlDatabase->fetchObject( '
		SELECT 
			m.DataID AS `FilesystemID`, f.Name AS `Filesystem`, m.ValueString AS `Visibility`
		FROM 
			Filesystem f, FMetaData m
		WHERE
			m.Key = "FilesystemVisibility" AND
			m.DataID = f.ID AND
			f.ID = \'' . intval( $User->ID, 10 ) . '\' AND
			m.DataTable = "Filesystem" AND
			m.ValueNumber = \'' . intval( $User->ID, 10 ) . '\'
		LIMIT 1
	' ) )
	{
		die( 'ok<!--separate-->' . json_encode( $data ) );
	}
	die( 'fail<!--separate-->{"message":"No metadata available for device.","response":"0"}' );
}
// Single device by name
if( isset( $args->args->filesystem ) )
{
	if( $data = $SqlDatabase->fetchObject( '
		SELECT 
			m.DataID AS `FilesystemID`, f.Name AS `Filesystem`, m.ValueString AS `Visibility`
		FROM 
			Filesystem f, FMetaData m
		WHERE
			m.Key = "FilesystemVisibility" AND
			m.DataID = f.ID AND
			f.Name = "' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->filesystem ) . '" AND
			m.DataTable = "Filesystem" AND
			m.ValueNumber = \'' . intval( $User->ID, 10 ) . '\'
		LIMIT 1
	' ) )
	{
		die( 'ok<!--separate-->' . json_encode( $data ) );
	}
	die( 'fail<!--separate-->{"message":"No metadata available for device.","response":"0"}' );
}
// All devices available for the user
else if( $datas = $SqlDatabase->fetchObjects( '
	SELECT 
		m.DataID AS `FilesystemID`, f.Name AS `Filesystem`, m.ValueString AS `Visibility`
	FROM 
		Filesystem f, FMetaData m
	WHERE
		m.Key = "FilesystemVisibility" AND
		m.DataID = f.ID AND
		m.DataTable = "Filesystem" AND
		m.ValueNumber = \'' . intval( $User->ID, 10 ) . '\'
' ) )
{
	die( 'ok<!--separate-->' . json_encode( $datas ) );
}

die( 'fail<!--separate-->{"message":"No metadata available for devices.","response":"0"}' );

?>
