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

// Connects to friend core and builds the query at the same time
function FriendCoreQuery( $command = '', $args = false, $method = 'POST', $headers = false, $sconf = false, $plainpostargs = false )
{
	global $Config;
	
	if( file_exists( 'cfg/cfg.ini' ) )
	{
		$fconf = parse_ini_file( 'cfg/cfg.ini', true );
	}
	else
	{
		$fconf = $Config;
	}
	
	if( !$sconf )
	{
		$sconf = new stdClass();
	}
	
	// ShortConfig defined ...
	
	$sconf->SSLEnable = ( $sconf->SSLEnable ? $sconf->SSLEnable : $fconf[ 'Core' ][ 'SSLEnable' ]      );
	$sconf->FCPort    = ( $sconf->FCPort    ? $sconf->FCPort    : $fconf[ 'Core' ][ 'port' ]           );
	$sconf->FCHost    = ( $sconf->FCHost    ? $sconf->FCHost    : $fconf[ 'FriendCore' ][ 'fchost' ]   );
	$sconf->FCUpload  = ( $sconf->FCUpload  ? $sconf->FCUpload  : $fconf[ 'FriendCore' ][ 'fcupload' ] );
	
	$curl = curl_init();
	
	$host = $sconf->FCHost;
	if( isset( $fconf[ 'FriendCore' ][ 'fconlocalhost' ] ) && $fconf[ 'FriendCore' ][ 'fconlocalhost' ] == 1 )
	{
		$host = 'localhost';
	}
	
	$server = ( $sconf->SSLEnable ? 'https://' : 'http://' ) . $host . ( $host == 'localhost' && $sconf->FCPort ? ( ':' . $sconf->FCPort ) : '' );
	
	$url = ( $server . $command );
	
	// If sessionid or servertoken is missing in command and args add servertoken with admin privileges from config to communicate with FriendCore internal.
	
	if( 
		!strstr( $url, '?sessionid=' ) && !strstr( $url, '?servertoken=' ) 
		&& isset( $fconf[ 'ServiceKeys' ][ 'AdminModuleServerToken' ] ) && $fconf[ 'ServiceKeys' ][ 'AdminModuleServerToken' ] 
	)
	{
		if( 
			!$args 
			|| ( is_object( $args ) && !isset( $args->sessionid ) && !isset( $args->servertoken ) ) 
			|| ( is_array( $args  ) && !isset( $args[ 'sessionid' ] ) && !isset( $args[ 'servertoken' ] ) ) 
			|| ( is_string( $args ) && !strstr( $args, '"sessionid"' ) && !strstr( $args, '"servertoken"' ) )
		)
		{
			$url = ( $url . ( strstr( $url, '?' ) ? '&' : '?' ) . 'servertoken=' . $fconf[ 'ServiceKeys' ][ 'AdminModuleServerToken' ] );
		}
	}
	
	if( $url && strstr( $url, '?' ) )
	{
		$thispath = $url;
		$url = explode( '?', $url );
	
		if( isset( $url[1] ) )
		{
			if( strstr( $url[1], '&' ) && strstr( $url[1], '=' ) )
			{
				$url[1] = explode( '&', $url[1] );
			
				foreach( $url[1] as $k=>$p )
				{
					if( strstr( $url[1][$k], '=' ) )
					{
						$url[1][$k] = explode( '=', $url[1][$k] );
					
						if( isset( $url[1][$k][1] ) )
						{
							$url[1][$k][1] = urlencode( $url[1][$k][1] );
						}
					
						$url[1][$k] = implode( '=', $url[1][$k] );
					}
				}
			
				$url[1] = implode( '&', $url[1] );
			}
			else if( strstr( $url[1], '=' ) )
			{
				$url[1] = explode( '=', $url[1] );
			
				if( isset( $url[1][1] ) )
				{
					$url[1][1] = urlencode( $url[1][1] );
				}
			
				$url[1] = implode( '=', $url[1] );
			}
		}
	
		$url = implode( '?', $url );
	}

	curl_setopt( $curl, CURLOPT_URL, $url );
	curl_setopt( $curl, CURLOPT_EXPECT_100_TIMEOUT_MS, false );

	if( $headers )
	{
		curl_setopt( $curl, CURLOPT_HTTPHEADER, $headers );
	}

	if( $method != 'POST' )
	{
		curl_setopt( $curl, CURLOPT_CUSTOMREQUEST, $method );
	}
	
	// TODO: Turn this off when SSL is working ...
	curl_setopt( $curl, CURLOPT_SSL_VERIFYHOST, false );
	curl_setopt( $curl, CURLOPT_SSL_VERIFYPEER, false );
	
	if( $args )
	{
		if( !$plainpostargs )
		{
			if( is_object( $args ) )
			{
				$args = array(
					'args' => urlencode( json_encode( $args ) )
				);
			}
			else if( is_string( $args ) )
			{
				$args = array(
					'args' => urlencode( $args )
				);
			}
		}
	
		curl_setopt( $curl, CURLOPT_POST, true );
		curl_setopt( $curl, CURLOPT_POSTFIELDS, $args );
	}

	curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );

	$output = curl_exec( $curl );

	$httpCode = curl_getinfo( $curl, CURLINFO_HTTP_CODE );
	
	curl_close( $curl );

	return $output;
}

?>
