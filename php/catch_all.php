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


// Set it to empty
$path = '';

// Get arguments from argv
if( isset( $argv ) && isset( $argv[1] ) )
{
	// Strip questions
	$test = explode( '?', $argv[1] );
	if( isset( $test[1] ) )
	{ 
		$argv[1] = $test[0];
		$argv[2] = $test[1];
	}
	unset( $test );
	
	if( $args = explode( "&", $argv[1] ) )
	{
		$kvdata = new stdClass();
		foreach ( $args as $arg )
		{
			if( trim( $arg ) && strstr( $arg, '=' ) )
			{
				list( $key, $value ) = explode( "=", $arg );
				if( isset( $key ) && isset( $value ) )
				{
					$kvdata->$key = urldecode( $value );
					if( $data = json_decode( $kvdata->$key ) )
						$kvdata->$key = $data;
				}
			}
		}
	}
	
	$GLOBALS['args'] = $kvdata;
	$args = $GLOBALS['args'];
	
	if( is_string( $argv[1] ) )
	{
		// Are we in the wrong place?
		if( str_replace( array( '/', '.' ), '', $argv[1] ) == '' )
		{
			$host = '';
			$conf = parse_ini_file( 'cfg/cfg.ini', true );
			if( $conf && $conf['FriendCore'][ 'fchost' ] )
			{
				$host = $conf['FriendCore'][ 'fchost' ];
				if( $conf['Core'][ 'SSLEnable' ] )
					$host = 'https://' . $host;
				else $host = 'http://' . $host;
			}
			
			// If we're not using a proxy, add the designated Friend Core port
			if( 
				isset( $conf['FriendCore']['fcnoproxy'] ) && $conf['FriendCore']['fcnoproxy'] == true &&
				isset( $conf['FriendCore']['port'] )
			)
			{
				$host .= ':' . $conf[ 'FriendCore' ][ 'port' ];
			}
			print( "---http-headers-begin---\n" );
			print( "Content-type: text/html\n" );
			print( "---http-headers-end---\n" );
			die( '<script>document.location.href=\'' . $host . '/webclient/index.html\';</script>' );
		}
		// User is requesting an operation on calendarevent
		else if( preg_match( '/^\/calendarevent[\/]{0,1}/i', $argv[ 1 ], $m ) )
		{
			require( 'calendarevent.php' );
		}
		// Check for guest accounts
		else if( preg_match( '/^\/guests[\/]{0,1}/i', $argv[1], $m ) )
		{
			$groupSession = true;
			require( 'guests.php' );
		}
		//forgot password trigger...
		else if( preg_match( '/\/forgotpassword[\/]{0,1}/i', $argv[1], $m ) )
		{
			require_once( 'forgotpassword.php' );
		}
		// Fetch our public key. If it does not exist, then create it
		else if( preg_match( '/\/publickey[\/]{0,1}/i', $argv[1], $m ) )
		{
			if( !file_exists( 'cfg/crt/key.pub' ) )
			{
				if( file_exists( 'cfg/crt/certificate.pem' ) )
				{
					$pkey = openssl_pkey_get_public( file_get_contents( 'cfg/crt/certificate.pem' ) );
					if( $pkey )
					{
						if( $f = fopen( 'cfg/crt/key.pub', 'w+' ) )
						{
							$kd = openssl_pkey_get_details( $pkey );
							fwrite( $f, $kd[ 'key' ] );
							fclose( $f );
							die( file_get_contents( 'cfg/crt/key.pub' ) );
						}
					}
					die( "---http-headers-begin---\nStatus Code: 404\n---http-headers-end---\n" );
				}
				else
				{
					die( "---http-headers-begin---\nStatus Code: 404\n---http-headers-end---\n" );
				}
			}
			die( file_get_contents( 'cfg/crt/key.pub' ) );
		}
		else if( preg_match( '/^\/fileaccess[\/]{0,1}/i', $argv[1], $m ) )
		{
			// external server file access interface
			require_once( 'fileaccess.php' );
		}
		else
		{

			if( substr( $argv[1], 0, 1 ) == '/' )
				$argv[1] = substr( $argv[1], 1, strlen( $argv[1] ) - 1 );
			$test = explode( '/', $argv[1] );
			if( count( $test ) > 2 )
			{
				foreach( $test as $k=>$v ) $test[$k] = urldecode( $v );
				$base = str_replace( '|', '/', $test[0] );
				$session = $auth = '';
				if( substr( $test[1], 0, 3 ) == 'sid' )
					$session = substr( $test[1], 3, strlen( $test[1] ) - 3 );
				else if( substr( $test[1], 0, 3 ) == 'aid' )
					$auth = substr( $test[1], 3, strlen( $test[1] ) - 3 );
					
				$path = [];
				for( $a = 2; $a < count( $test ); $a++ )
				{
					$path[] = $test[$a];
				}
				
				$path = implode( '/', $path );
				$devname = explode( ':', $base );
				$devname = reset( $devname );
								
				if( $base && ( $auth || $session ) && $path )
				{
					$ar = parse_ini_file( 'cfg/cfg.ini' );
					foreach( array( 'fchost', 'fcport', 'SSLEnable', 'fconlocalhost' ) as $k=>$type )
					{
						if( !isset( $ar[$type] ) )
							$ar[$type] = '';
					}
					
					print( "---http-headers-begin---\n" );
					switch( strtolower( end( explode( '.', $path ) ) ) )
					{
						case 'css':
							print( "Content-Type: text/css\n" );
							break;
						case 'js':
							print( "Content-Type: text/javascript\n" );
							break;
						case 'html':
						case 'htm':
							print( "Content-Type: text/html\n" );
							break;
						case 'xml':
							print( "Content-Type: text/xml\n" );
							break;
						case 'jpeg':
						case 'jpg':
							print( "Content-Type: image/jpeg\n" );
							break;
						case 'png':
							print( "Content-Type: image/png\n" );
							break;
						case 'gif':
							print( "Content-Type: image/gif\n" );
							break;
						case 'svg':
							print( "Content-Type: image/svg\n" );
							break;
						case 'log':
						case 'txt':
							print( "Content-Type: text/plain\n" );
							break;
						case 'mp3':
							print( "Content-Type: audio/mp3\n" );
							break;
						case 'wav':
							print( "Content-Type: audio/wav\n" );
							break;
						case 'ogg':
							print( "Content-Type: audio/ogg\n" );
							break;
						default:
							print( "Content-Type: application/octet-stream\n" );
							break;
					}
					print( "---http-headers-end---\n" );
					
					$url = ($ar['SSLEnable']?'https://':'http://') . ( $ar['fconlocalhost'] ? 'localhost' : $ar['fchost'] ) . ':' . $ar['fcport'] . '/system.library/file/read/';
					// Potential new code
					readfile( $url . '?devname=' . urlencode( $devname ) . '&path=' . urlencode( $base . $path ) . '&mode=rs&sessionid=' . urlencode( $auth ? $auth : $session ) );
					die();
				}	
			}
		}
	}
}

// If we pass what is allowed, continue.
if( !strstr( $argv[1], '..' ) && $argv[1] != '/' )
{
	
	if( file_exists( 'php/scripts' ) && is_dir( 'php/scripts' ) )
	{
		$dop = explode( '/', $argv[1] );
		$dop = array_shift( $dop );
		if( file_exists( 'php/scripts/' . $dop . '.php' ) )	
		{
			require( 'php/scripts/' . $dop . '.php' );
		}
	}
}

print( "---http-headers-begin---\n" );
print( "Status Code: 404\n" );
print( "---http-headers-end---\n" );
die( '<!DOCTYPE html>
<html>
	<head>
		<title>Friend Core - 404</title>
	</head>
	<body>
		<h1>404 - File not found!</h1>
		<p>Friend Core has failed to find your file. '. ( $path ? $path : $argv[1] ) .'</p>
		<p><a href="javascript:history.back(-1)">Go back</a>.</p>
	</body>
</html>
' );

?>
