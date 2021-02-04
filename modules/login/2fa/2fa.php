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

define( 'SCRIPT_2FA_PATH', dirname(__FILE__) );

error_reporting( E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_WARNING );
ini_set( 'display_errors', '1' );

// Get command line arguments
if( $args = getArgs() )
{
	// Check if the request is encrypted(?)
	if( isset( $args->encrypted ) )
	{
		$json = receive_encrypted_json( $args->encrypted );
		
		$server = getServerSettings();
		
		if( $server && $server->server == 'windows' && !$server->host )
		{
			die( 'ERROR! Server settings are missing! login/2fa 
{
"server":"' . $server->server . '",
"host":"' . $server->host . '",
"username":"' . $server->username . '",
"password":"' . ( $server->password ? '********' : '' ) . '",
"ssh_port":' . $server->ssh_port . ',
"rdp_port":' . $server->rdp_port . ',
"users_db_diskpath":' . $server->users_db_diskpath . '
}
			' );
		}
		
		$mode = ( $server && $server->server ? $server->server : 'default' );
		
		if( $args->publickey )
		{
			// TODO: Find out why this didn't work ???
			//$encrypted = $fcrypt->encryptRSA( json_encode( $json ), $args->publickey );
			//die( $encrypted );
			
			// Client publickey ...
			
			$json->publickey = $args->publickey;
		}
		
		
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
										send_2fa_response( true, 'verification', json_encode( $ses ), $args->publickey );
									}
									else
									{
										send_2fa_response( false, 'verification', json_encode( $ses ), $args->publickey );
									}
								}
							}
						}
						else
						{
							// Send the json response in $ret[1]
							send_2fa_response( false, 'verification', $ret[1], $args->publickey );
						}
					}
					else
					{
						send_2fa_response( false, 'verification', '{"result":"-1","response":"Unknown code verification error.","code":"60"}', '' );
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
										send_2fa_response( true, 'identity', '{"code":"sent to ' . $data->mobile . '","data":' . $res[2] . '}', $args->publickey );
									}
								}
								else
								{
									send_2fa_response( false, 'identity', '{"return":' . $res[1] . ',"data":' . json_encode( $ret[1] ) . '}', $args->publickey );
								}
							}
						}
						else
						{
							send_2fa_response( false, 'identity', $ret[1], $args->publickey );
						}
					}
					else
					{
						send_2fa_response( false, 'failedwindowscredentials', false, false );
					}
					
				}
				
				break;
			
			// Default authentication
			default:
				
				if( $json->code )
				{
					
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
										send_2fa_response( true, 'verification', json_encode( $ses ), $args->publickey );
									}
									else
									{
										send_2fa_response( false, 'verification', json_encode( $ses ), $args->publickey );
									}
								}
							}
						}
						else
						{
							send_2fa_response( false, 'verification', $ret[1], $args->publickey );
						}
					}
					
				}
				else
				{
					
					if( $ret = verifyIdentity( $json->username, $json->password ) )
					{
						if( $ret[0] && $ret[0] == 'ok' && $ret[1] )
						{
							if( $res = sendCode( $ret[1]->UserID, $ret[1]->Mobile ) )
							{
								if( $res[0] == 'ok' )
								{
									if( $res[1] && $res[2] )
									{
										// TODO: Send back useful info ...
										send_2fa_response( true, 'identity', '{"code":"sent to ' . $ret[1]->Mobile . '","data":' . $res[2] . '}', $args->publickey );
									}
								}
								else
								{
									send_2fa_response( false, 'identity', $res[1], $args->publickey );
								}
							}
						}
						else
						{
							send_2fa_response( false, 'identity', $ret[1], $args->publickey );
						}
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
