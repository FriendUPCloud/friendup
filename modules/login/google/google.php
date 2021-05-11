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
		
		if( $args->publickey )
		{
			// Client publickey ...
			$json->publickey = $args->publickey;
		}
		
		if( $args->deviceid )
		{
			// Client deviceid ...
			$json->deviceid = $args->deviceid;
		}
	}
	else if( isset( $args->token ) )
	{
		$json = $args;
	}
	
	if( $json )
	{
		//POST /token HTTP/1.1
		//Host: oauth2.googleapis.com
		//Content-Type: application/x-www-form-urlencoded

		//code=4/P7q7W91a-oMsCeLvIaQm6bTrgtp7&
		//client_id=your-client-id&
		//client_secret=your-client-secret&
		//redirect_uri=https%3A//oauth2.example.com/code&
		//grant_type=authorization_code
		
		//$obj = new stdClass();
		//$obj->code          = $json->code;
		//$obj->client_id     = '1053224064374-tc9k39g33m49ljrhrhu3rfp68mpfpsdd.apps.googleusercontent.com';
		//$obj->client_secret = 'or2FUaZPWGZT-0xGj7W_Bp7X';
		//$obj->grant_type    = 'authorization_code';
		
		$curl = curl_init();
		curl_setopt( $curl, CURLOPT_URL, 'https://oauth2.googleapis.com/tokeninfo?id_token=' . $json->token );
		
		//curl_setopt( $curl, CURLOPT_HTTPHEADER, [ 'Authorization: Bearer ' . $json->access_token/*'Content-type: application/json'*/ ] );
		curl_setopt( $curl, CURLOPT_CUSTOMREQUEST, 'GET' );
		
		//curl_setopt( $curl, CURLOPT_POST, true );
		//curl_setopt( $curl, CURLOPT_POSTFIELDS, json_encode( $obj ) );
		
		curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );
	
		$output = curl_exec( $curl );
		
		curl_close( $curl );
		
		if( $output )
		{
			if( $output = json_decode( $output ) )
			{
				if( $output->sub && $output->kid )
				{
					$json->username = $output->sub;
					$json->password = ( 'HASHED' . hash( 'sha256', $output->kid ) );
				}
			}
		}
		
		die( print_r( $json, 1 ) . ' -- ' . print_r( $output, 1 ) );
		
		// TODO: Auth with google to get name, email, avatar, etc
		
		// Check authentication mode
		switch( $mode )
		{
			// Using Windows based authentication
			case 'windows':
				
				// Verify the 2fa code (if that's the mode!)
				if( $json->code )
				{
					
					$json = convertLoginData( $json );
					
					if( $ret = verifyCode( $json->username, $json->password, $json->code ) )
					{
						if( $ret[0] && $ret[0] == 'ok' && $ret[1] )
						{
				
							// TODO: See if this needs to be moved ...
				
							if( $json->password && ( !strstr( $json->password, 'HASHED' ) && !strstr( $json->password, '{S6}' ) ) )
							{
								$json->password = ( 'HASHED' . hash( 'sha256', $json->password ) );
							}
							
							// TODO: Move this also into a function ...
							
							if( $login = remoteAuth( '/system.library/login', 
							[
								'username' => $json->username, 
								'password' => $json->password, 
								'deviceid' => $json->deviceid 
							] ) )
							{
								if( strstr( $login, '<!--separate-->' ) )
								{
									if( $ret = explode( '<!--separate-->', $login ) )
									{
										if( isset( $ret[1] ) )
										{
											$login = $ret[1];
										}
									}
								}
				
								if( $ses = json_decode( $login ) )
								{
									if( $ses->sessionid )
									{
										send_encrypted_response( true, 'verification', json_encode( $ses ), $args->publickey );
									}
									else
									{
										send_encrypted_response( false, 'verification', json_encode( $ses ), $args->publickey );
									}
								}
							}
						}
						else
						{
							// Send the json response in $ret[1]
							send_encrypted_response( false, 'verification', $ret[1], $args->publickey );
						}
					}
					else
					{
						send_encrypted_response( false, 'verification', '{"result":"-1","response":"Unknown code verification error.","code":"60"}', '' );
					}
					
				}
				// Verify the windows credentials (usually the first step)
				else
				{
					if( $ret = verifyWindowsIdentity( $json->username, $json->password, $server ) )
					{
						if( $ret[0] && $ret[0] == 'ok' && $ret[1] )
						{
							$json = convertLoginData( $json );
							
							if( !$data = checkFriendUser( $json, $ret[1], true ) )
							{
								die( 'fail ... unexpected return, need more time to complete code ...' );
							}
							
							if( $res = sendCode( $data->userid, $data->mobile, false, false ) )
							{
								if( $res[0] == 'ok' )
								{
									if( $res[1] && $res[2] )
									{
										// TODO: Send back useful info ...
										send_encrypted_response( true, 'identity', '{"code":"sent to ' . $data->mobile . '","data":' . $res[2] . '}', $args->publickey );
									}
								}
								else
								{
									send_encrypted_response( false, 'identity', '{"return":' . $res[1] . ',"data":' . json_encode( $ret[1] ) . '}', $args->publickey );
								}
							}
						}
						else
						{
							send_encrypted_response( false, 'identity', $ret[1], $args->publickey );
						}
					}
					else
					{
						send_encrypted_response( false, 'failedwindowscredentials', false, false );
					}
					
				}
				
				break;
				
		}
		
		die( 'fail ... ' );
		
	}
}

//render the form
renderSecureLoginForm();

?>
