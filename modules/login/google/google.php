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

// Get command line arguments
if( $args = getArgs() )
{
	
	$json = false;
	
	// Check if the request is encrypted(?)
	if( isset( $args->encrypted ) )
	{
		$json = receive_encrypted_json( $args->encrypted );
	}
	
	if( !$json && ( isset( $args->token ) || isset( $args->publickey ) || isset( $args->deviceid ) ) )
	{
		$json = new stdClass();
	}
	
	if( isset( $args->token ) )
	{
		// Google token_id ...
		$json->token = $args->token;
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
		
		// 1: Validate Friend Login ...
		
		if( !$json->token )
		{
			
			$json = convertLoginData( $json, 'GOOGLE' );
			
			// TODO: perhaps validate the sub (username) and kid (password) id somehow with google ...
			
			if( $ret = validateFriendIdentity( $json->username, $json->password, $json->nounce, $json->fullname, $json->email, $json->lang, $json->publickey ) )
			{
				if( $ret[0] == 'ok' )
				{
					send_encrypted_response( true, 'identity', $ret[1], $json->publickey );
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
		}
		
		// 2: Verify Google Login ...
		
		else
		{
			if( $ret = verifyGoogleToken( $json->token, $json->deviceid ) )
			{
				if( $ret[0] == 'ok' )
				{
					send_encrypted_response( true, 'verification', $ret[1], $json->publickey );
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
		}
				
		die( 'fail ... ' );
		
	}
}

//render the form
renderSecureLoginForm();

?>
