<?php

	error_reporting( E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_WARNING );
	ini_set( 'display_errors', '1' );
	
	
	
	if( $args = getArgs() )
	{
		
		if( isset( $args->encrypted ) )
		{
			$json = receive( $args->encrypted );
			
			$mode = ( $json->mode ? $json->mode : 'windows' );
			
			if( $args->publickey )
			{
				// TODO: Find out why this didn't work ???
				//$encrypted = $fcrypt->encryptRSA( json_encode( $json ), $args->publickey );
				//die( $encrypted );
				
				// Client publickey ...
				
				$json->publickey = $args->publickey;
			}
			
			
			
			switch( $mode )
			{
				
				case 'windows':
					
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
											send( true, 'verification', json_encode( $ses ), $args->publickey );
										}
										else
										{
											send( false, 'verification', json_encode( $ses ), $args->publickey );
										}
									}
								}
							}
							else
							{
								send( false, 'verification', $ret[1], $args->publickey );
							}
						}
						
					}
					else
					{
						
						if( $ret = verifyWindowsIdentity( $json->username, $json->password ) )
						{
							if( $ret[0] && $ret[0] == 'ok' && $ret[1] )
							{
								
								//$busr = $json->username;
								//$bupw = $json->password;
								
								$json = convertLoginData( $json );
								
								//die( print_r( $json,1 ) . ' [] ' . print_r( [ $busr, $bupw ],1 ) . ' || ' . print_r( $ret[1],1 ) );
								
								if( !$data = checkFriendUser( $json, $ret[1], true ) )
								{
									die( 'fail ... unexpected return, need more time to complete code ...' );
								}
								
								if( $res = sendCode( $data->userid, $data->mobile ) )
								{
									if( $res[0] == 'ok' )
									{
										if( $res[1] && $res[2] )
										{
											// TODO: Send back useful info ...
											// TODO: Also add useful clicatell data to make sure it was sent ...
											send( true, 'identity', '{"code":"sent to ' . $data->mobile . '","data":' . $res[2] . '}', $args->publickey );
										}
									}
									else
									{
										send( false, 'identity', '{"return":' . $res[1] . ',"data":' . json_encode( $ret[1] ) . '}', $args->publickey );
									}
								}
							}
							else
							{
								send( false, 'identity', $ret[1], $args->publickey );
							}
						}
						
					}
					
					break;
				
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
											send( true, 'verification', json_encode( $ses ), $args->publickey );
										}
										else
										{
											send( false, 'verification', json_encode( $ses ), $args->publickey );
										}
									}
								}
							}
							else
							{
								send( false, 'verification', $ret[1], $args->publickey );
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
											// TODO: Also add useful clicatell data to make sure it was sent ...
											send( true, 'identity', '{"code":"sent to ' . $ret[1]->Mobile . '","data":' . $res[2] . '}', $args->publickey );
										}
									}
									else
									{
										send( false, 'identity', $res[1], $args->publickey );
									}
								}
							}
							else
							{
								send( false, 'identity', $ret[1], $args->publickey );
							}
						}
						
					}
					
					break;
					
			}
			
			die( 'fail ... ' );
			
		}
	}

	
	/*
		define some functions.
	*/
	
	function getArgs()
	{
		$args = new stdClass();
		
		if( isset( $GLOBALS['request_path'] ) && $GLOBALS['request_path'] && strstr( $GLOBALS['request_path'], '/loginprompt/' ) )
		{
			if( $url = explode( '/loginprompt/', $GLOBALS['request_path'] ) )
			{
				if( isset( $url[1] ) && $url[1] )
				{
					$args->publickey = $url[1];
				}
			}
		}
		
		if( isset( $GLOBALS['request_variables'] ) && $GLOBALS['request_variables'] )
		{
			foreach( $GLOBALS['request_variables'] as $k => $v )
			{
				if( $k && $k != '(null)' )
				{
					$args->{$k} = $v;
				}
			}
		}
		
		return $args;
	}
	
	function getServerKeys()
	{
		$pem = new stdClass();
		$pem->privatekey = null;
		$pem->publickey = null;
		
		if( file_exists( 'cfg/crt/server_encryption_key.pem' ) )
		{
			if( $keys = file_get_contents( 'cfg/crt/server_encryption_key.pem' ) )
			{
				if( strstr( $keys, '-----' . "\r\n" . '-----' ) && ( $keys = explode( '-----' . "\r\n" . '-----', $keys ) ) )
				{
					if( isset( $keys[0] ) )
					{
						$pem->privatekey = ( $keys[0] . '-----' );
					}
					if( isset( $keys[1] ) )
					{
						$pem->publickey = ( '-----' . $keys[1] );
					}
				}
			}
		}
		
		return $pem;
	}
	
	function renderSecureLoginForm()
	{
		
		if( file_exists( dirname(__FILE__) . '/templates/login.html' ) )
		{
			die( renderReplacements( file_get_contents( dirname(__FILE__) . '/templates/login.html' ) ) );
		}
		
		die( '<h1>Your FriendUP installation is incomplete!</h1>' );
	}
	
	function renderReplacements( $template )
	{
		$welcome = 'Login to your workspace (2FA)';
		
		$publickey = '';
		
		if( $keys = getServerKeys() )
		{
			if( $keys->publickey )
			{
				$publickey = base64_encode( $keys->publickey );
			}
		}
		
		$finds = [
			'{scriptpath}'
			,'{welcome}'
			,'{publickey}'
			/*,'{nothashed}'*/
		];
		$replacements = [
				$GLOBALS['request_path']
				,$welcome
				,$publickey
				/*,'true'*/
		];
		
		return str_replace( $finds, $replacements, $template );
	}
	
	
	
	function remoteAuth( $url, $args = false, $method = 'POST', $headers = false, $auth = false )
	{
		$configpath = __DIR__ . '/../../../cfg/cfg.ini';
		
		$conf = parse_ini_file( $configpath, true );
		
		$url = ( $conf['Core']['SSLEnable'] ? 'https://' : 'http://' ) . $conf['FriendCore']['fchost'] . ( $conf['FriendCore']['port'] ? ':' . $conf['FriendCore']['port'] : '' ) . $url;
		
		if( function_exists( 'curl_init' ) )
		{
			$curl = curl_init();
		
			if( $headers && $auth && $auth['username'] && $auth['password'] )
			{
				$base64 = base64_encode( trim( $auth['username'] ) . ':' . trim( $auth['password'] ) );
			
				$headers[] = ( 'Authorization: Basic ' . $base64 );
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
	
			if( $headers )
			{
				curl_setopt( $curl, CURLOPT_HTTPHEADER, $headers );
			}
	
			if( $method != 'POST' )
			{
				curl_setopt( $curl, CURLOPT_CUSTOMREQUEST, $method );
			}
	
			if( $args )
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
			
				$json = false;
			
				if( $headers )
				{
					foreach( $headers as $v )
					{
						if( strstr( $v, 'application/json' ) )
						{
							$json = true;
						}
					}
			
					if( $json )
					{
						$args = json_encode( $args );
					}
				}
			
				curl_setopt( $curl, CURLOPT_POST, true );
				curl_setopt( $curl, CURLOPT_POSTFIELDS, $args );
			}
		
			curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );
		
			$output = curl_exec( $curl );
	
			$httpCode = curl_getinfo( $curl, CURLINFO_HTTP_CODE );
		
			if( !$httpCode && !$output )
			{
				curl_setopt( $curl, CURLOPT_SSL_VERIFYHOST, false );
				curl_setopt( $curl, CURLOPT_SSL_VERIFYPEER, false );
			
				$output = curl_exec( $curl );	
			}
			
			curl_close( $curl );
		
			return $output;
		}
		else
		{
			return 'cURL is not installed, contact support ...';
		}
	}
	
	function verifyIdentity( $username, $password = '' )
	{
		$error = false; $data = false;
		
		if( $username )
		{
			include_once( __DIR__ . '/../../../php/classes/dbio.php' );
			$conf = parse_ini_file( __DIR__ . '/../../../cfg/cfg.ini', true );
			
			if( !( isset( $conf['DatabaseUser']['host'] ) && isset( $conf['DatabaseUser']['login'] ) && isset( $conf['DatabaseUser']['password'] ) && isset( $conf['DatabaseUser']['dbname'] ) ) )
			{
				die( 'CORRUPT FRIEND INSTALL!' );
			}
			
			$dbo = new SqlDatabase( );
			if( $dbo->open( $conf['DatabaseUser']['host'], $conf['DatabaseUser']['login'], $conf['DatabaseUser']['password'] ) )
			{
				if( !$dbo->SelectDatabase( $conf['DatabaseUser']['dbname'] ) )
				{
					die( 'ERROR! DB not found!' );
				}
			}
			else
			{
				die( 'ERROR! MySQL unavailable!' );
			}
			
			if( $password && ( !strstr( $password, 'HASHED' ) && !strstr( $password, '{S6}' ) ) )
			{
				$password = ( 'HASHED' . hash( 'sha256', $password ) );
			}
			
			if( $creds = $dbo->fetchObject( '
				SELECT fu.ID FROM FUser fu 
				WHERE 
						fu.Name     = \'' . mysqli_real_escape_string( $dbo->_link, $username ) . '\' 
					AND fu.Password = \'' . mysqli_real_escape_string( $dbo->_link, '{S6}' . hash( 'sha256', $password ) ) . '\' 
			' ) )
			{
				if( $identity = $dbo->fetchObject( '
					SELECT 
						fm.DataID AS UserID, fm.ValueString AS Mobile 
					FROM 
						FMetaData fm 
					WHERE 
							fm.Key       = "Mobile" 
						AND fm.DataID    = \'' . $creds->ID . '\' 
						AND fm.DataTable = "FUser" 
					ORDER BY 
						fm.ID DESC 
				' ) )
				{
					if( $identity->UserID && $identity->Mobile )
					{
						$data = $identity;
					}
					else
					{
						$error = '{"result":"-1","response":"Mobile number for user account empty ..."}';
					}
				}
				else
				{
					$error = '{"result":"-1","response":"Mobile number for user account missing ..."}';
				}
			}
			else
			{
				$error = '{"result":"-1","response":"Account blocked until: 0","code":"6"}';
			}
		}
		else
		{
			$error = '{"result":"-1","response":"Account blocked until: 0","code":"6"}';
		}
		
		if( $data )
		{
			return [ 'ok', $data ];
		}
		else
		{
			return [ 'fail', $error ];
		}
	}
	
	function verifyCode( $username, $password = '', $code = false )
	{
		if( $code && $username )
		{
			$error = false; $data = false;
			
			include_once( __DIR__ . '/../../../php/classes/dbio.php' );
			$conf = parse_ini_file( __DIR__ . '/../../../cfg/cfg.ini', true );
			
			if( !( isset( $conf['DatabaseUser']['host'] ) && isset( $conf['DatabaseUser']['login'] ) && isset( $conf['DatabaseUser']['password'] ) && isset( $conf['DatabaseUser']['dbname'] ) ) )
			{
				die( 'CORRUPT FRIEND INSTALL!' );
			}
			
			$dbo = new SqlDatabase( );
			if( $dbo->open( $conf['DatabaseUser']['host'], $conf['DatabaseUser']['login'], $conf['DatabaseUser']['password'] ) )
			{
				if( !$dbo->SelectDatabase( $conf['DatabaseUser']['dbname'] ) )
				{
					die( 'ERROR! DB not found!' );
				}
			}
			else
			{
				die( 'ERROR! MySQL unavailable!' );
			}
			
			if( $password && ( !strstr( $password, 'HASHED' ) && !strstr( $password, '{S6}' ) ) )
			{
				$password = ( 'HASHED' . hash( 'sha256', $password ) );
			}
			
			// TODO: Check what mode we are using for password and for username ... this might be different depending on what mode ...
			
			if( $creds = $dbo->fetchObject( '
				SELECT fu.ID FROM FUser fu 
				WHERE 
						fu.Name     = \'' . mysqli_real_escape_string( $dbo->_link, $username ) . '\' 
					AND fu.Password = \'' . mysqli_real_escape_string( $dbo->_link, '{S6}' . hash( 'sha256', $password ) ) . '\' 
			' ) )
			{
				if( $verify = $dbo->fetchObject( '
					SELECT 
						fm.DataID AS UserID, fm.ValueString AS Code 
					FROM 
						FMetaData fm 
					WHERE 
							fm.Key       = "VerificationCode" 
						AND fm.DataID    = \'' . $creds->ID . '\' 
						AND fm.DataTable = "FUser" 
					ORDER BY 
						fm.ID DESC 
				' ) )
				{
					if( $verify->Code )
					{
						if( trim( $verify->Code ) == trim( $code ) )
						{
							$dbo->Query( '
								DELETE FROM FMetaData 
								WHERE 
										`Key` = "VerificationCode" 
									AND `DataID` = \'' . $creds->ID . '\' 
									AND `DataTable` = "FUser" 
							' );
							
							$data = $verify->Code;
						}
						else
						{
							$error = '{"result":"-1","response":"Verification code doesn\'t match, try again ..."}';
						}
					}
					else
					{
						$error = '{"result":"-1","response":"Verification code for user account empty ..."}';
					}
				}
				else
				{
					$error = '{"result":"-1","response":"Verification code missing ..."}';
				}
			}
			else
			{
				$error = '{"result":"-1","response":"Account blocked until: 0","code":"6"}';
			}
			
			if( $data )
			{
				return [ 'ok', $data ];
			}
			else
			{
				return [ 'fail', $error ];
			}
		}
		else
		{
			return false;
		}
	}
	
	function sendCode( $userid, $mobile, $code = false, $limit = true )
	{
		$error = false; $debug = true;
		
		include_once( __DIR__ . '/../../../php/classes/dbio.php' );
		$conf = parse_ini_file( __DIR__ . '/../../../cfg/cfg.ini', true );
		
		if( !( isset( $conf['DatabaseUser']['host'] ) && isset( $conf['DatabaseUser']['login'] ) && isset( $conf['DatabaseUser']['password'] ) && isset( $conf['DatabaseUser']['dbname'] ) ) )
		{
			die( 'CORRUPT FRIEND INSTALL!' );
		}
		
		$dbo = new SqlDatabase( );
		if( $dbo->open( $conf['DatabaseUser']['host'], $conf['DatabaseUser']['login'], $conf['DatabaseUser']['password'] ) )
		{
			if( !$dbo->SelectDatabase( $conf['DatabaseUser']['dbname'] ) )
			{
				die( 'ERROR! DB not found!' );
			}
		}
		else
		{
			die( 'ERROR! MySQL unavailable!' );
		}
		
		$version = ( isset( $conf['SMS']['version'] ) ? $conf['SMS']['version'] : '' );
		
		$host  = ( isset( $conf['SMS']['host']  ) ? $conf['SMS']['host']  : '' );
		$token = ( isset( $conf['SMS']['token'] ) ? $conf['SMS']['token'] : '' );
		$from  = ( isset( $conf['SMS']['from']  ) ? $conf['SMS']['from']  : '' );
		
		$expire = strtotime( '+1 hour' );
		$code   = ( $code ? trim( $code ) : mt_rand( 10000, 99999 ) );
		
		$recv    = trim( $mobile );
		$message = "Friend OS: $code is your verification code.";
		
		if( function_exists( 'curl_init' ) )
		{
			
			if( $userid && $recv )
			{
				
				$dbo->Query( '
					DELETE FROM FMetaData 
					WHERE 
							`Key` = "VerificationCode" 
						AND `DataID` = \'' . $userid . '\' 
						AND `DataTable` = "FUser" 
						AND 
						( 
							`ValueString` = "" OR `ValueNumber` < ' . time( ) . ' 
						) 
				' );
				
				if( $limit )
				{
					if( $check = $dbo->fetchObject( '
						SELECT 
							fm.DataID AS UserID, fm.ValueNumber AS Expiry, fm.ValueString AS Code 
						FROM 
							FMetaData fm 
						WHERE 
								fm.Key          = "VerificationCode" 
							AND fm.DataID       = \'' . $userid . '\' 
							AND fm.DataTable    = "FUser" 
							AND fm.ValueNumber != 0 AND fm.ValueString != "" 
						ORDER BY 
							fm.ID DESC 
					' ) )
					{
						$error = '{"result":"-1","response":"Verification code has allready been sent (expires ' . date( 'Y-m-d H:i', $check->Expiry ) . ')."}';
					}
				}
				
				
				
				if( !$error )
				{
					if( $host && $token && $message )
					{
					
						if( function_exists( 'mb_detect_encoding' ) )
						{
							$encoding = mb_detect_encoding ( $message, 'auto' );
							$message = iconv( $encoding, 'UTF-8', $message );
						}
					
						// Add norway
						if( strlen ( $recv ) == 8 )
						{
							$recv = ( '+47' . $recv );
						}
					
						switch( $version )
						{
						
							case 1:
							
								$header = array(
									'X-Version: 1',
									'Content-Type: application/json',
									'Authorization: bearer ' . $token,
									'Accept: application/json'
								);
							
								$json = new stdClass();
								$json->text = $message;
								$json->to = array( $recv );
								//$json->from = $from;
							
								break;
							
							default:
							
								$header = array(
									'Content-Type: application/json',
									'Authorization: ' . $token
								);
							
								$json = new stdClass();
								$json->content = $message;
								$json->to = array( $recv );
								//$json->from = $from;
							
								break;
							
						}
					
						$curl = curl_init();
					
						curl_setopt( $curl, CURLOPT_URL, $host );
					
						curl_setopt( $curl, CURLOPT_HTTPHEADER, $header );
					
						curl_setopt( $curl, CURLOPT_POST, 1 );
						curl_setopt( $curl, CURLOPT_POSTFIELDS, json_encode( $json ) );
						curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );
						
						if( $debug )
						{
							$output = '{"verification":"' . $code . '"}';
						}
						else
						{
							$output = curl_exec( $curl );
						}
						
						$httpCode = curl_getinfo( $curl, CURLINFO_HTTP_CODE );
					
						curl_close( $curl );
					
						$str = json_encode( $json );
					
						$log = "
	SMS Output log: " . date ( 'Y-m-d H:i:s' ) . "

	{$output}
	-------------------------------------------------------------------
	Sent JSON: 
	{$str}
	*******************************************************************
	";
					
						if( $output && ( $err = json_decode( $output ) ) )
						{
						
							if( $err->data && $err->data->message && $err->data->message[0] && $err->data->message[0]->error )
							{
								$error = '{"result":"-1","response":"' . $err->data->message[0]->error . '"}';
							}
							else if( $err->code )
							{
								$error = '{"result":"-1","response":"' . $err->code . '"}';
							}
							else if( $err->error )
							{
								$error = '{"result":"-1","response":"' . $err->error . '"}';
							}
						
							if( $error )
							{
								// Try to log
								if ( $f = @fopen ( __DIR__ . '/../../../log/sms_clickatell.log', 'a+' ) )
								{
									fwrite ( $f, $log );
									fclose ( $f );
								}
							}
						
						}
						
						if( !$error && $output )
						{
							if( $dbo->Query( '
							INSERT INTO FMetaData ( `Key`, `DataID`, `DataTable`, `ValueNumber`, `ValueString` ) 
							VALUES ('
								. ' \'VerificationCode\'' 
								. ',\'' . $userid . '\'' 
								. ',\'FUser\'' 
								. ',\'' . $expire . '\'' 
								. ',\'' . $code . '\'' 
							.') ' ) )
							{
								return [ 'ok', $code, $output ];
							}
							else
							{
								$error = '{"result":"-1","response":"' . mysqli_error( $dbo->_link ) . '"}';
							}
						}
					}
					else
					{
						$error  = '{"result":"-1","response":"Config settings are missing ... expecting: ' . "\r\n\r\n";
						$error .= '[SMS]' . "\r\n";
						$error .= 'version = 1 or 2' . "\r\n";
						$error .= 'from = Your Company Name' . "\r\n";
						$error .= 'host = https://api.clickatell.com/rest/message' . "\r\n";
						$error .= 'token = Clickatell Token"}';
					}
				}
			}
			else
			{
				$error = '{"result":"-1","response":"Phone number is missing ..."}';
			}
		}
		else
		{
			$error = '{"result":"-1","response":"cURL is not installed, contact support ..."}';
		}
		
		return [ 'fail', $error ];
		
	}
	
	function receive( $data = '' )
	{
		include_once( 'php/3rdparty/fcrypto/fcrypto.class.php' );
		
		$fcrypt = new fcrypto(); $json = false;
		
		if( $keys = getServerKeys() )
		{
			if( $keys->privatekey )
			{
				if( $decrypted = $fcrypt->decryptRSA( $data, $keys->privatekey ) )
				{
					$json = json_decode( $decrypted );
				}
			}
		}
		
		return $json;
	}
	
	function send( $result, $type = false, $data = '', $publickey = false )
	{
		$ret = ( $result ? 'ok' : 'fail' );
		
		if( $publickey )
		{
			include_once( 'php/3rdparty/fcrypto/fcrypto.class.php' );
			
			$fcrypt = new fcrypto();
			
			if( $encrypted = $fcrypt->encryptString( $data, $publickey ) )
			{
				die( $ret . '<!--separate-->' . ( $type ? $type . '<!--separate-->' : '' ) . $encrypted->cipher );
			}
			else
			{
				die( 'fail<!--separate-->' . ( $type ? $type . '<!--separate-->' : '' ) . 'failed to encrypt serveranswer ...' );
			}
		}
		
		die( $ret . '<!--separate-->' . ( $type ? $type . '<!--separate-->' : '' ) . $data );
	}
	
	function verifyWindowsIdentity( $username, $password = '' )
	{
		$error = false; $data = false;
		
		// TODO: set login data static for the presentation, remove later, only test data.
		// TODO: verify user with free rdp ...
		// TODO: Get user data from free rdp login or use powershell via ssh as friend admin user ...
		
		// TODO: implement max security with certs for ssh / rdp access if possible, only allow local ...
		
		if( $username )
		{
			if( function_exists( 'ssh2_connect' ) )
			{
				$connection = false;
				
				// TODO: Move this to a config, together with what mode to use for 2factor ...
				
				$hostname = '185.116.5.93';
				$port = 22;
				
				// TODO: Look at hashing password or something ...
				
				$username = trim( $username ? $username : 'Testuser' );
				$password = trim( $password ? $password : 'Testerpass500' );
				
				if( $hostname && $username && $password )
				{
					
					//function _ssh_disconnect( $reason, $message, $language ) 
					//{
					//	die( 'fail<!--separate-->server disconnected with reason code ' . $reason . ' and message: ' . $message );
					//}
					
					// TODO: Options for more secure connection using SSH and authenticating, look into it.
					
					//$methods = [
					//	'kex' => 'diffie-hellman-group1-sha1',
					//	'client_to_server' => [
					//		'crypt' => '3des-cbc',
					//		'comp'  => 'none' 
					//	],
					//	'server_to_client' => [
					//		'crypt' => 'aes256-cbc,aes192-cbc,aes128-cbc',
					//		'comp'  => 'none' 
					//	] 
					//];
			
					//$callbacks = [ 'disconnect' => '_ssh_disconnect' ];
					
					if( !$connection = ssh2_connect( $hostname, $port ) )
					{
						$error = '{"result":"-1","response":"couldn\'t connect, contact support ..."}';
					}
					
					if( $connection )
					{
					
						if( $auth = ssh2_auth_password( $connection, $username, $password ) )
						{
							
							$stream = ssh2_exec( $connection, "powershell;Get-ADUser -Identity $username -Properties *" );
							
							$outputStream = ssh2_fetch_stream( $stream, SSH2_STREAM_STDIO );
							$errorStream  = ssh2_fetch_stream( $stream, SSH2_STREAM_STDERR );
					
							// Enable blocking for both streams
							stream_set_blocking( $outputStream, true );
							stream_set_blocking( $errorStream, true );
					
							$output = stream_get_contents( $outputStream );
							$error  = stream_get_contents( $errorStream );
					
							// Close the streams        
							fclose( $errorStream );
							fclose( $stream );
							
							if( $output )
							{
								$identity = new stdClass();
								
								if( $parts = explode( "\n", $output ) )
								{
									
									foreach( $parts as $part )
									{
										if( $value = explode( ':', $part ) )
										{
											if( trim( $value[0] ) )
											{
												$identity->{ trim( $value[0] ) } = ( $value[1] ? trim( $value[1] ) : '' );
											}
										}
									}
									
								}
							}
							
							if( $identity )
							{
								if( $identity->MobilePhone )
								{
									$data = new stdClass();
									$data->id       = ( $identity->SID          ? $identity->SID          : '0' );
									$data->fullname = ( $identity->Name         ? $identity->Name         : ''  );
									$data->mobile   = ( $identity->mobile       ? $identity->mobile       : ''  );
									$data->email    = ( $identity->EmailAddress ? $identity->EmailAddress : ''  );
								}
								else
								{
									$error = '{"result":"-1","response":"Mobile number for user account empty ..."}';
								}
							}
							else
							{
								$error = '{"result":"-1","response":"Mobile number for user account missing ..."}';
							}
							
							if( $data )
							{
								return [ 'ok', $data ];
							}
							
							if( $error )
							{
								return [ 'fail', $error ];
							}
					
						}
						else
						{
							$error = '{"result":"-1","response":"Account blocked until: 0","code":"6","debug":"1"}';
						}
					
					}
				}
			
			}
			else
			{
				$error = '{"result":"-1","response":"Dependencies: php-ssh2 libssh2-php is required, contact support ..."}';
			}
			
		}
		else
		{
			$error = '{"result":"-1","response":"Account blocked until: 0","code":"6","debug":"2"}';
		}
		
		return [ 'fail', $error ];
		
	}
	
	function checkFriendUser( $data, $identity, $create = false )
	{
		
		//	
		
		if( $data && $identity && $data->username && isset( $data->password ) )
		{
			
			// TODO: Move this to it's own function ...
			
			include_once( __DIR__ . '/../../../php/classes/dbio.php' );
			$conf = parse_ini_file( __DIR__ . '/../../../cfg/cfg.ini', true );
		
			if( !( isset( $conf['DatabaseUser']['host'] ) && isset( $conf['DatabaseUser']['login'] ) && isset( $conf['DatabaseUser']['password'] ) && isset( $conf['DatabaseUser']['dbname'] ) ) )
			{
				die( 'CORRUPT FRIEND INSTALL!' );
			}
		
			$dbo = new SqlDatabase( );
			if( $dbo->open( $conf['DatabaseUser']['host'], $conf['DatabaseUser']['login'], $conf['DatabaseUser']['password'] ) )
			{
				if( !$dbo->SelectDatabase( $conf['DatabaseUser']['dbname'] ) )
				{
					die( 'ERROR! DB not found!' );
				}
			}
			else
			{
				die( 'ERROR! MySQL unavailable!' );
			}
			
			
			
			if( $data->password && ( !strstr( $data->password, 'HASHED' ) && !strstr( $data->password, '{S6}' ) ) )
			{
				$data->password = ( 'HASHED' . hash( 'sha256', $data->password ) );
			}
			
			// TODO: Handle password different for an external system ...
			
			$creds = false;
			
			$query = '
				SELECT fu.ID FROM FUser fu 
				WHERE 
						fu.Name     = \'' . mysqli_real_escape_string( $dbo->_link, $data->username ) . '\' 
					AND fu.Password = \'' . mysqli_real_escape_string( $dbo->_link, '{S6}' . hash( 'sha256', $data->password ) ) . '\' 
			';
			
			if( !$creds = $dbo->fetchObject( $query ) )
			{
				
				// Check if user exists and password is wrong ...	
				
				if( $dbo->fetchObject( '
					SELECT 
						fu.* 
					FROM 
						FUser fu 
					WHERE 
						fu.Name = \'' . mysqli_real_escape_string( $dbo->_link, $data->username ) . '\' 
				' ) )
				{
					die( 'CORRUPT FRIEND INSTALL! User exists but Friend password is incorrect.' );
				}
				
				// TODO: Make sure username is unique for the external service and that the password is not the users original ...
				
				// Create new user ...
				
				if( $create )
				{
					
					if( $dbo->Query( '
					INSERT INTO FUser ( `Name`, `Password`, `PublicKey`, `Fullname`, `Email`, `LoggedTime`, `CreatedTime`, `LoginTime`, `UniqueID` ) 
					VALUES ('
						. ' \'' . mysqli_real_escape_string( $dbo->_link, $data->username                                  ) . '\'' 
						. ',\'' . mysqli_real_escape_string( $dbo->_link, '{S6}' . hash( 'sha256', $data->password )       ) . '\'' 
						. ',\'' . mysqli_real_escape_string( $dbo->_link, $data->publickey     ? trim( $data->publickey    ) : '' ) . '\'' 
						. ',\'' . mysqli_real_escape_string( $dbo->_link, $identity->fullname  ? trim( $identity->fullname ) : '' ) . '\'' 
						. ',\'' . mysqli_real_escape_string( $dbo->_link, $identity->email     ? trim( $identity->email    ) : '' ) . '\'' 
						. ','   . time() 
						. ','   . time() 
						. ','   . time() 
						. ',\'' . mysqli_real_escape_string( $dbo->_link, generateFriendUniqueID( $data->username )        ) . '\'' 
					.') ' ) )
					{
						if( $creds = $dbo->fetchObject( $query ) )
						{
							
							// Success now log the user in and activate it ...	
							
							if( $login = remoteAuth( '/system.library/login', 
							[
								'username' => $data->username, 
								'password' => $data->password, 
								'deviceid' => $data->deviceid 
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
										if( remoteAuth( '/system.library/user/update?sessionid=' . $ses->sessionid, 
										[
											'setup' => '0' 
										] ) )
										{
											//
										}
									}
								
								}
							
							}
							else
							{
							
								// Couldn't login ...
							
								
							
							}
							
						}
						
					}
					else
					{
						// Couldn't create user ...
						
						
					}
					
				}
				
			}
			else
			{
				
				// return data ...
				
				
				
			}
			
			if( $creds )
			{
				
				if( $creds->ID )
				{
					$identity->userid = $creds->ID;
				}
				
				return $identity;
				
			}
			
			// TODO: Allways get user data as output on success ...
			
		}
		
	}
	
	function convertLoginData( $data )
	{
		if( $data && ( $data->username && isset( $data->password ) ) )
		{
			
			// TODO: Look if we are going to add a ID from the external service to the username ...
			
			if( $data->username )
			{
				$data->username = generateExternalFriendUsername( $data->username );
			}
			
			if( $data->password )
			{
				$data->password = generateExternalFriendPassword( $data->password );
			}
			
		}
		
		return $data;
	}
	
	function generateExternalFriendUsername( $input )
	{
		if( $input )
		{
			return hash( 'md5', 'HASHED' . $input );
		}
		
		return '';
	}
	
	function generateExternalFriendPassword( $input )
	{
		if( $input )
		{
			if( strstr( $input, 'HASHED' ) )
			{
				return ( $input );
			}
		
			return ( 'HASHED' . hash( 'sha256', 'TOKEN' . $input ) );
		}
		return '';
	}
	
	function generateFriendUniqueID( $data = '' )
	{
		return hash( 'sha256', ( time().$data.rand(0,999).rand(0,999).rand(0,999) ) );
	}
	
	//render the form
	renderSecureLoginForm();

?>
