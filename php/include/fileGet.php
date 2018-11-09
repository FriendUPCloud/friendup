<?php
/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

// Get arguments
$url = urldecode( $argv[1] );
$port = urldecode( $argv[2] );
$postfields = unserialize( urldecode( $argv[3] ) );

$ssl = substr( $url, 0, 6 ) == 'https:';

$ch = curl_init();
curl_setopt( $ch, CURLOPT_URL, $url    );
curl_setopt( $ch, CURLOPT_PORT, $port );
curl_setopt( $ch, CURLOPT_POSTFIELDS, $postfields );
curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
if( $ssl == 1 )
{
	curl_setopt( $ch, CURLOPT_SSL_VERIFYPEER, false );
	curl_setopt( $ch, CURLOPT_SSL_VERIFYHOST, false );
}
$result = curl_exec( $ch );
curl_close( $ch );

die( $result );

?>
