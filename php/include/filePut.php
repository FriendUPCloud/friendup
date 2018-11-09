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

// Gets our stuff!

set_include_path( __DIR__ . '../../' );

$filePath = urldecode( $argv[1] );
$destPath = urldecode( $argv[2] );
$session = urldecode( $argv[3] );
$Config = false;
if( isset( $argv[4] ) )
	$Config = json_decode( urldecode( $argv[4] ) );
$argv[1] = 'sessionid=' . $session;

if( !$Config )
	include_once( 'php/friend.php' );

if( count( $argv ) >= 4 )
{
	$ex = '/system.library/file/upload/';
	$url = ( $Config->SSLEnable ? 'https://' : 'http://' ) .
		( $Config->FCOnLocalhost ? 'localhost' : $Config->FCHost ) . ':' . $Config->FCPort . $ex;

	$devname = explode( ':', $destPath );
	$devname = $devname[0];

	if( file_exists( $filePath ) )
	{
		if( strstr( $filePath, '/' ) )
		{
			$file = explode( '/', $filePath );
			$file = $file[ count( $file ) - 1 ];
		}
		else $file = $filePath;
		
		$curlFile = new CURLFile( $filePath, 'application/octetstream', $file );
		$postfields = array(
			'sessionid' => $session,
			'devname' => $devname,
			'path' => urlencode( $destPath ),
			'target' => urlencode( $destPath ),
			'data' => $curlFile
		);
	
		$ch = curl_init();
		curl_setopt( $ch, CURLOPT_URL, $url    );
		curl_setopt( $ch, CURLOPT_PORT, $Config->FCPort );
		curl_setopt( $ch, CURLOPT_POSTFIELDS, $postfields );
		curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
		if( $Config->SSLEnable == 1 )
		{
			curl_setopt( $ch, CURLOPT_SSL_VERIFYPEER, false );
			curl_setopt( $ch, CURLOPT_SSL_VERIFYHOST, false );
			//curl_setopt( $ch, CURLOPT_SSL_FALSESTART, true  );
		}
		$result = curl_exec( $ch );
		curl_close( $ch );

		unlink( $filePath );
	}
}

?>
