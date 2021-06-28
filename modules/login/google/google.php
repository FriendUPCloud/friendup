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

require( 'include/helpers.php' );

define( 'SCRIPT_LOGIN_PATH', dirname(__FILE__) );

error_reporting( E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_WARNING );
ini_set( 'display_errors', '1' );

$args = false;

// Get command line arguments
if( $args = getArgs() )
{
	$json = false;
	
	// Check if the request is encrypted(?)
	if( isset( $args->encrypted ) )
	{
		$json = receive_encrypted_json( $args->encrypted );
	}
	
	if( !$json && ( isset( $args->mode ) || isset( $args->token ) || isset( $args->access_token ) || isset( $args->publickey ) ) )
	{
		$json = new stdClass();
	}
	
	if( isset( $args->mode ) )
	{
		// Mode requested ...
		$json->mode = $args->mode;
	}
	if( isset( $args->token ) )
	{
		// Google token_id ...
		$json->token = $args->token;
	}
	if( isset( $args->access_token ) )
	{
		// Google access_token ...
		$json->access_token = $args->access_token;
	}
	if( isset( $args->publickey ) )
	{
		// Client publickey ...
		$json->publickey = $args->publickey;
	}
	if( isset( $args->deviceid ) )
	{
		// Client deviceid ...
		$json->deviceid = $args->deviceid;
	}
	
	if( $json )
	{
		if( $json->mode )
		{
			
			$json = convertLoginData( $json, 'GOOGLE' );
			
			switch( $json->mode )
			{
				
				// 1: Validate Google Identity ...
				
				case 'identity':
					
					if( $ret = verifyGoogleToken( $json->access_token, $json->nounce ) )
					{
						if( $ret[0] == 'ok' )
						{
							send_encrypted_response( true, 'identity', $ret[1], ( $json->publickey ? $json->publickey : true ) );
						}
						else
						{
							send_encrypted_response( false, 'identity', $ret[1], $json->publickey );
						}
					}
					else
					{
						send_encrypted_response( false, 'identity' );
					}
				
					break;
				
				// 2: Create Friend Account ...
				
				case 'account':
				
					if( $ret = updateFriendAccount( $json->username, $json->password, $json->publickey, $json->nounce, $json->i_hash ) )
					{
						if( $ret[0] == 'ok' )
						{
							send_encrypted_response( true, 'account', $ret[1], ( $json->publickey ? $json->publickey : true ) );
						}
						else
						{
							send_encrypted_response( false, 'account', $ret[1], $json->publickey );
						}
					}
					else
					{
						send_encrypted_response( false, 'account' );
					}
				
					break;
				
				// 3: Verify Friend Login ...
				
				case 'verification':
					
					if( $ret = verifyFriendAuth( $json->username, $json->publickey, $json->nounce, $json->deviceid ) )
					{
						if( $ret[0] == 'ok' )
						{
							send_encrypted_response( true, 'verification', $ret[1], ( $json->publickey ? $json->publickey : true ) );
						}
						else
						{
							send_encrypted_response( false, 'verification', $ret[1], $json->publickey );
						}
					}
					else
					{
						send_encrypted_response( false, 'verification' );
					}
					
					break;
				
			}
			
		}
		
		die( 'fail ... ' );
		
	}
}

//render the form
renderCustomLoginForm( $args );

?>
