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



// Setup post query using Curl
$ch = curl_init();


curl_setopt( $ch, CURLOPT_URL, 
	'http' . ( $Config->SSLEnable == '1' ? 's' : '' ) . '://' . $Config->FCHost . ':' . $Config->FCPort . 
		'/system.library/device/mount'
);

$fileInfo = $args->fileInfo;

$postfields =   'sessionid=' . $args->sessionid . 
				'devname=' . str_replace( ':', '', $fileInfo->Volume ) . 
				'&path=' . ( $fileInfo->Path ? $fileInfo->Path : '/' ) . 
				'&type=local';

curl_setopt( $ch, CURLOPT_POST, 4 );
curl_setopt( $ch, CURLOPT_POSTFIELDS, $postfields );
curl_setopt( $ch, CURLOPT_EXPECT_100_TIMEOUT_MS, false );
curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );

// Execute query
$result = curl_exec( $ch );

die( $result );

?>
