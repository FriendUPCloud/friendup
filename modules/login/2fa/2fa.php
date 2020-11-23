<?php

	error_reporting( E_ALL & ~E_NOTICE & ~E_DEPRECATED );
	ini_set( 'display_errors', '1' );
	
	if( $args = getArgs() )
	{
		if( isset( $args->encrypted ) )
		{
			$json = receive( $args->encrypted );
			
			if( $args->publickey )
			{
				// TODO: Find out why this didn't work ???
				//$encrypted = $fcrypt->encryptRSA( json_encode( $json ), $args->publickey );
				//die( $encrypted );
			}
			
			// TODO: Do some checking in the database for 2 factor mobile number on the user wanting to login, then send sms confirmation code and render form on client side.
			
			// TODO: Setup receiving sms confirmation code and login to FriendCore once SMS code is confirmed.
			
			// check user data before login into FriendCore and asking for sessionid to return to client (encrypted)
			
			// TODO: Store verification code somehow ...
			
			// TODO: Make sure not to send sms more then once ...
			
			// TODO: Return ok or failed then data ...
			
			if( verifyCode( $json->code ) )
			{
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
							send( true, json_encode( $ses ), $args->publickey );
						}
						else
						{
							send( false, json_encode( $ses ), $args->publickey );
						}
					}
				}
			}
			
			// TODO: Implement Friend User check for mobile number here ...
			
			// TODO: Check database for credentials here aswell in case username / pw is wrong ...
			
			else if( $res = sendCode( '95103175' ) )
			{
				if( $res[0] == 'ok' )
				{
					if( $res[1] && $res[2] )
					{
						$debug = false;
						
						send( true, '{"code":"sent to 95103175"}' . ( $debug ? '<!--separate-->' . json_encode( $res ) : '' ), $args->publickey );
					}
				}
				else
				{
					send( false, json_encode( $res[1] ), $args->publickey );
				}
			}
			
			die( 'fail ... ret: ' . $login );
			
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
		$providers = [];
		$provider = false;
		$lp = '';		
	
		if( isset( $GLOBALS['login_modules']['saml']['Providers'] ) )
		{
			foreach( $GLOBALS['login_modules']['saml']['Providers'] as $pk => $pv );
			{
				//do some checks here
			}
		}
		
		if( file_exists(dirname(__FILE__) . '/templates/login.html') )
			die( renderReplacements( file_get_contents(dirname(__FILE__) . '/templates/login.html') ) );
		
		
		die('<h1>Your FriendUP installation is incomplete!</h1>');
	}
	
	function renderReplacements( $template )
	{
		$welcome = $GLOBALS['login_modules']['saml']['Login']['logintitle_en'] !== null ? $GLOBALS['login_modules']['saml']['Login']['logintitle_en'] :'2FA Login';
		$samlendpoint = $GLOBALS['login_modules']['saml']['Module']['samlendpoint'] !== null ? $GLOBALS['login_modules']['saml']['Module']['samlendpoint'] : 'about:blank';
		
		$samlendpoint .= '?friendendpoint=' . urlencode($GLOBALS['request_path']);
		
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
			,'{samlendpoint}'
			,'{publickey}'
		];
		$replacements = [
				$GLOBALS['request_path']
				,$welcome
				,$samlendpoint
				,$publickey
		];
		
		return str_replace($finds, $replacements, $template);
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
		
			//die( $url . ' [] ' . $output . ' || ' . print_r( $httpCode,1 ) );
	
			curl_close( $curl );
		
			return $output;
		}
		else
		{
			return 'cURL is not installed, contact support ...';
		}
	}
	
	function verifyCode( $code = false )
	{
		if( $code )
		{
			return true;
		}
		else
		{
			return false;
		}
	}
	
	function sendCode( $mobile, $code = false )
	{
		$error = false;
		
		$configpath = __DIR__ . '/../../../cfg/cfg.ini';
		
		$conf = parse_ini_file( $configpath, true );
		
		$version = ( isset( $conf['SMS']['version'] ) ? $conf['SMS']['version'] : '' );
		
		$host  = ( isset( $conf['SMS']['host']  ) ? $conf['SMS']['host']  : '' );
		$token = ( isset( $conf['SMS']['token'] ) ? $conf['SMS']['token'] : '' );
		$from  = ( isset( $conf['SMS']['from']  ) ? $conf['SMS']['from']  : '' );
		
		$code = ( $code ? trim( $code ) : mt_rand( 10000000, 99999999 ) );
		
		$recv    = trim( $mobile );
		$message = "Friend OS: $code is your verification code.";
		
		if( function_exists( 'curl_init' ) )
		{
			
			if( $recv )
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
					
					$output = curl_exec( $curl );
					
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
							$error = $err->data->message[0]->error;
						}
						else if( $err->code )
						{
							$error = $err->code;
						}
						else if( $err->error )
						{
							$error = $err->error;
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
						return [ 'ok', $code, $output ];
					}
					
				}
				else
				{
					$error  = 'Config settings are missing ... expecting: ' . "\r\n\r\n";
					$error .= '[SMS]' . "\r\n";
					$error .= 'version = 1 or 2' . "\r\n";
					$error .= 'from = Your Company Name' . "\r\n";
					$error .= 'host = https://api.clickatell.com/rest/message' . "\r\n";
					$error .= 'token = Clickatell Token' . "\r\n";
				}
				
			}
			else
			{
				$error = 'Phone number is missing ...';
			}
		
		}
		else
		{
			$error = 'cURL is not installed, contact support ...';
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
	
	function send( $result, $data = '', $publickey = false )
	{
		$ret = ( $result ? 'ok' : 'fail' );
		
		if( $publickey )
		{
			include_once( 'php/3rdparty/fcrypto/fcrypto.class.php' );
			
			$fcrypt = new fcrypto();
			
			if( $encrypted = $fcrypt->encryptString( $data, $publickey ) )
			{
				die( $ret . '<!--separate-->' . $encrypted->cipher );
			}
			else
			{
				die( 'fail<!--separate-->failed to encrypt serveranswer ...' );
			}
		}
		
		die( $ret . '<!--separate-->' . $data );
	}
	
	//render the form
	renderSecureLoginForm();

?>
