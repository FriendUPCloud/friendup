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

/*
	define some functions.
*/

function theLogger( $str )
{
	if( $s = fopen( SCRIPT_2FA_PATH . '/../../../log/php_log.txt', 'a+' ) )
	{
		fwrite( $s, $str );
		fclose( $s );
		return true;
	}
	return false;
}

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

// Renders the login form template
function renderSecureLoginForm()
{
	
	if( file_exists( SCRIPT_2FA_PATH . '/templates/login.html' ) )
	{
		die( renderReplacements( file_get_contents( SCRIPT_2FA_PATH . '/templates/login.html' ) ) );
	}
	
	die( '<h1>Your FriendUP installation is incomplete!</h1>' );
}

// Sets replacements on template
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
		'{scriptpath}',
		'{welcome}',
		'{publickey}'
		/*,'{nothashed}'*/
	];
	$replacements = [
			$GLOBALS['request_path'],
			$welcome,
			$publickey
			/*,'true'*/
	];
	
	return str_replace( $finds, $replacements, $template );
}


// Authenticate with Friend Core
function remoteAuth( $url, $args = false, $method = 'POST', $headers = false, $auth = false )
{
	$configpath = SCRIPT_2FA_PATH . '/../../../cfg/cfg.ini';
	
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

// Get server settings configured using the FSettings table
function getServerSettings(  )
{
	include_once( SCRIPT_2FA_PATH . '/../../../php/classes/dbio.php' );
	$conf = parse_ini_file( SCRIPT_2FA_PATH . '/../../../cfg/cfg.ini', true );
	
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
	
	if( $row = $dbo->FetchObject( '
		SELECT * FROM FSetting s
		WHERE
			s.UserID = \'-1\'
		AND s.Type = \'login\'
		AND s.Key = \'2fa\'
		ORDER BY s.Key ASC
	' ) )
	{
		if( $resp = json_decode( $row->Data ) )
		{
			return $resp;
		}
	}
	
	return false;
}

// Verify the user identity by Friend username and password
// TODO: This function will stop working soon, using deprecated password
//       hashing implementation
function verifyIdentity( $username, $password = '' )
{
	$error = false; $data = false;
	
	if( $username )
	{
		include_once( SCRIPT_2FA_PATH . '/../../../php/classes/dbio.php' );
		$conf = parse_ini_file( SCRIPT_2FA_PATH . '/../../../cfg/cfg.ini', true );
		
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
					$error = '{"result":"-1","response":"Mobile number for user account empty ...","code":"18"}';
				}
			}
			else
			{
				$error = '{"result":"-1","response":"Mobile number for user account missing ...","code":"19"}';
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

// Verify the verifification code
// TODO: This function will stop working soon, using deprecated password
//       hashing implementation
function verifyCode( $username, $password = '', $code = false )
{	
	if( $code && $username )
	{
		$error = false; $data = false;
		
		include_once( SCRIPT_2FA_PATH . '/../../../php/classes/dbio.php' );
		$conf = parse_ini_file( SCRIPT_2FA_PATH . '/../../../cfg/cfg.ini', true );
		
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
						$error = '{"result":"-1","response":"Verification code doesn\'t match, try again ...","code":"23"}';
					}
				}
				else
				{
					$error = '{"result":"-1","response":"Verification code for user account empty ...","code":"22"}';
				}
			}
			else
			{
				$error = '{"result":"-1","response":"Verification code missing ...","code":"21"}';
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

// Send verification code using SMS
function sendCode( $userid, $mobile, $code = false, $limit = true )
{	
	$error = false; $debug = false;
	
	include_once( SCRIPT_2FA_PATH . '/../../../php/classes/dbio.php' );
	$conf = parse_ini_file( SCRIPT_2FA_PATH . '/../../../cfg/cfg.ini', true );
	
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
							if ( $f = @fopen ( SCRIPT_2FA_PATH . '/../../../log/sms_clickatell.log', 'a+' ) )
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
	
	theLogger( 'We returned with an error 2: ' + $error );
	
	return [ 'fail', $error ];
	
}

// Receive an encrypted JSON string
function receive_encrypted_json( $data = '' )
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

// Send the 2FA response to the login form
function send_2fa_response( $result, $type = false, $data = '', $publickey = false )
{
	$ret = ( $result ? 'ok' : 'fail' );
	
	$jsonData = $data;
	
	if( $publickey )
	{
		include_once( 'php/3rdparty/fcrypto/fcrypto.class.php' );
		
		$fcrypt = new fcrypto();
		
		if( $encrypted = $fcrypt->encryptString( $data, $publickey ) )
		{
			die( $ret . '<!--separate-->' . ( $type ? ( $type . '<!--separate-->' ) : '' ) . $encrypted->cipher . '<!--separate-->' . $data );
		}
		else
		{
			die( 'fail<!--separate-->' . ( $type ? $type . '<!--separate-->' : '' ) . 'failed to encrypt serveranswer ...' );
		}
	}
	
	die( $ret . '<!--separate-->' . ( $type ? $type . '<!--separate-->' : '' ) . $data );
}

// Execute shell function with a timeout
function exec_timeout( $cmd, $timeout = 60 )
{
	$start = time();
	$outfile = uniqid( '/tmp/out', 1 );
	$pid = trim( shell_exec( "$cmd > $outfile 2>&1 & echo $!" ) );
	if( empty( $pid ) ) return false;
	while( 1 ) 
	{
		if( time() - $start > $timeout )
		{
			exec( "kill -9 $pid", $null );
			break;
		}
		$exists = trim( shell_exec( "ps -p $pid -o pid=" ) );
		if( empty( $exists ) ) break;
		usleep( 100000 );
	}
	$output = file_get_contents( $outfile );
	unlink( $outfile );
	exec( "kill -9 $pid", $null );
	// Remove bash history to protect temporary unsafe auth with terminal ...
	exec( "history -c" );
	return $output;
}

// Verify the Windows user identity for a specific RDP server
function verifyWindowsIdentity( $username, $password = '', $server )
{	
	$error = false; $data = false;
	
	// TODO: set login data static for the presentation, remove later, only test data.
	// TODO: verify user with free rdp ...
	// TODO: Get user data from free rdp login or use powershell via ssh as friend admin user ...
	
	// TODO: implement max security with certs for ssh / rdp access if possible, only allow local ...
	
	if( $username && $server )
	{
		if( /*function_exists( 'ssh2_connect' ) &&*/ function_exists( 'shell_exec' ) )
		{
			$connection = false;
			
			// TODO: Move this to a server config, together with what mode to use for 2factor ...
			
			// TODO: Look at hashing password or something ...
			
			$adminus = $server->username;
			$adminpw = $server->password;
			
			$hostname = $server->host;
			
			$port = ( $server->ssh_port ? $server->ssh_port : 22 );
			$rdp =  ( $server->rdp_port ? $server->rdp_port : 3389 );
			
			$username = trim( $username );
			$password = trim( $password );
			
			$dbdiskpath = ( $server->users_db_diskpath ? $server->users_db_diskpath : '' );
			
			if( $hostname && $username && $password )
			{
				
				// Check user creds using freerdp ...
				
				// TODO: Add more security to password check ...
				
				$authenticated = false; $found = false;
				
				// sfreerdp needs special option added on install cmake -GNinja -DCHANNEL_URBDRC=OFF -DWITH_DSP_FFMPEG=OFF -DWITH_CUPS=OFF -DWITH_PULSE=OFF -DWITH_SAMPLE=ON .
				
				// TODO: Get error messages for not WHITE LABELLED!!!!!!
				
				if( $checkauth = exec_timeout( "sfreerdp /cert-ignore /cert:ignore +auth-only /u:$username /p:$password /v:$hostname /port:$rdp /log-level:ERROR 2>&1" ) )
				{
					if( strstr( $checkauth, 'sfreerdp: not found' ) )
					{
						$checkauth = exec_timeout( "xfreerdp /cert-ignore /cert:ignore +auth-only /u:$username /p:$password /v:$hostname /port:$rdp /log-level:ERROR 2>&1" );
					}
				
					$found = true;
				}
				
				if( !$found )
				{
					$checkauth = exec_timeout( "xfreerdp /cert-ignore /cert:ignore +auth-only /u:$username /p:$password /v:$hostname /port:$rdp /log-level:ERROR 2>&1" );
				}
				
				
				
				if( $checkauth )
				{
					if( strstr( $checkauth, 'sfreerdp: not found' ) || strstr( $checkauth, 'xfreerdp: not found' ) )
					{
						$error = '{"result":"-1","response":"Dependencies: sfreerdp or xfreerdp is required, contact support ..."}';
					}
					else if( $parts = explode( "\n", $checkauth ) )
					{
						foreach( $parts as $part )
						{
							if( $value = explode( 'Authentication only,', $part ) )
							{
								if( trim( $value[1] ) && trim( $value[1] ) == 'exit status 0' )
								{
									$authenticated = true;
								}
							}
						}
						
						if( !$authenticated )
						{
							$error = '{"result":"-1","response":"Unable to perform terminal login","code":"6","data":"","debug":"1"}';
						}
					}
				}
				else
				{
					$error = '{"result":"-1","response":"Account blocked until: 0","code":"6","debug":"2"}';
				}
				
				
				
				
				
				if( !$error )
				{
					//$path = ( SCRIPT_2FA_PATH . '/../../../cfg' );
					
					// Specific usecase ...
					
					if( $dbdiskpath && file_exists( $dbdiskpath/*$path . '/Friend-AD-Time-IT.csv'*/ ) )
					{
						if( $output = file_get_contents( $dbdiskpath/*$path . '/Friend-AD-Time-IT.csv'*/ ) )
						{
							$identity = new stdClass();
							
							if( $rows = explode( "\n", trim( $output ) ) )
							{							
								foreach( $rows as $line )
								{
									$line = explode( ';', $line );
									list( $mobnum, $name, $user, ) = $line;
									$mobnum = trim( $mobnum );
									$name = trim( $name );
									$user = trim( $user );
									// Our user!
									if( isset( $mobnum ) && isset( $name ) && isset( $user ) && strtolower( $user ) == strtolower( trim( $username ) ) )
									{
										if( !intval( $mobnum ) )
										{
											// TODO: Will this even work?
											if( $tmp_mobile = (int) filter_var( $mobnum, FILTER_SANITIZE_NUMBER_INT ) )
											{
												$mobnum = $tmp_mobile; // Set sanitized number
											}
										}
										else
										{
											$mobnum = intval( $mobnum );
										}
										
										$data = new stdClass();
										$data->id       = '0';
										$data->fullname = $name;
										$data->mobile   = $mobnum;
										
										theLogger( 'Found ' . print_r( $data, 1 ) );
										
										return [ 'ok', $data ];
									}
								}
							}
							//return [ 'fail', '{"result":"-1","response":"Account blocked until: 0","code":"6","debug":"0"}' ];
						}
					}
					

					// Failed to fin d user in list.
					return [ 'fail', '{"result":"-1","response":"Could not find user in index, or index does not exist","code":"7","debug":"0"}' ];
				
					// TODO: Powershell is commented out but may be used later
				
				
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
				
					/*if( !$connection = ssh2_connect( $hostname, $port ) )
					{
						$error = '{"result":"-1","response":"couldn\'t connect, contact support ..."}';
					}
				
					if( $authenticated && $connection )
					{
					
						if( $adminus && $adminpw )
						{
						
							if( $auth = ssh2_auth_password( $connection, $adminus, $adminpw ) )
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
						
						}
					
						$error = '{"result":"-1","response":"Account blocked until: 0","code":"6","debug":"3"}';
					
					}*/
				}
			}
		
		}
		else
		{
			$error = '{"result":"-1","response":"Dependencies: php-ssh2 libssh2-php and or enabling shell_exec is required, contact support ..."}';
		}
		
	}
	else
	{
		$error = '{"result":"-1","response":"Account blocked until: 0","code":"6","debug":"4"}';
	}
	
	theLogger( 'Er returned with an error: ' . $error );
	
	return [ 'fail', $error ];
	
}

// Check a Friend user
// TODO: Fix deprecated password hashing (deprecated soon!)
function checkFriendUser( $data, $identity, $create = false )
{
	
	//	
	
	if( $data && $identity && $data->username && isset( $data->password ) )
	{
		
		// TODO: Move this to it's own function ...
		
		include_once( SCRIPT_2FA_PATH . '/../../../php/classes/dbio.php' );
		$conf = parse_ini_file( SCRIPT_2FA_PATH . '/../../../cfg/cfg.ini', true );
	
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
		
		// TODO: Base it on username and forget about password only one unique username is allowed for users ...
		
		/*$query = '
			SELECT fu.ID FROM FUser fu 
			WHERE 
					fu.Name     = \'' . mysqli_real_escape_string( $dbo->_link, $data->username ) . '\' 
				AND fu.Password = \'' . mysqli_real_escape_string( $dbo->_link, '{S6}' . hash( 'sha256', $data->password ) ) . '\' 
		';*/
		
		$query = '
			SELECT fu.ID FROM FUser fu 
			WHERE fu.Name = \'' . mysqli_real_escape_string( $dbo->_link, $data->username ) . '\' 
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
				INSERT INTO FUser ( `Name`, `Password`, `PublicKey`, `Fullname`, `Email`, `LastActionTime`, `CreationTime`, `LoginTime`, `UniqueID` ) 
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
						
						// add user to users group....
						$dbo->Query( 'INSERT INTO `FUserToGroup` ( `UserID`,`UserGroupID` ) VALUES ('. intval( $creds->ID ) .', ( SELECT `ID` FROM `FUserGroup` WHERE `Name` = \'' . ( 'User' ) . '\' AND `Type` = \'Level\' ORDER BY `ID` ASC LIMIT 1 ) );' );
						
						checkExternalUserGroup(  );
						
						// add user to External users group....
						$dbo->Query( 'INSERT INTO `FUserToGroup` ( `UserID`,`UserGroupID` ) VALUES ('. intval( $creds->ID ) .', ( SELECT `ID` FROM `FUserGroup` WHERE `Name` = \'User\' AND `Type` = \'External\' ORDER BY `ID` ASC LIMIT 1 ) );' );
						
						if( $identity->mobile )
						{
							// Add phone number ...
							$dbo->Query( 'INSERT INTO `FMetaData` ( `DataTable`, `DataID`, `Key`, `ValueString` ) VALUES ( "FUser", '. intval( $creds->ID ) .', "Mobile", "' . $identity->mobile . '" );' );
						}
						
						// TODO: Find out what template to use, and define based on user level or admin access, for later ...
						
						firstLoginSetup( 0, $creds->ID );
						
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
									if( !remoteAuth( '/system.library/user/update?sessionid=' . $ses->sessionid, 
									[
										'setup' => '0' 
									] ) )
									{
										//
										
										die( 'fail from friendcore ...' );
									}
								}
								else
								{
									die( 'fail no session ...' );
								}
							
							}
						
						}
						else
						{
						
							// Couldn't login ...
						
							die( 'fail from friendcore ...' );
						
						}
						
					}
					else
					{
						die( 'fail something failed ...' );
					}
					
				}
				else
				{
					// Couldn't create user ...
					
					die( 'fail couldn\'t create user ...' );
					
				}
				
			}
			
		}
		else
		{
			
			// return data ...
			
			// Update password if different ... TODO: Look at this in the future ...
			
			if( $creds && $creds->ID )
			{
				$u = new dbIO( 'FUser', $dbo );
				$u->ID       = $creds->ID;
				$u->Name     = $data->username;
				if( $u->Load() && $u->Password != ( '{S6}' . hash( 'sha256', $data->password ) ) )
				{
					$u->Password = ( '{S6}' . hash( 'sha256', $data->password ) );
					$u->Save();
					
					if( $u->ID > 0 )
					{
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
							
							/*if( $ses = json_decode( $login ) )
							{
							
								if( $ses->sessionid )
								{
									if( !remoteAuth( '/system.library/user/update?sessionid=' . $ses->sessionid, 
									[
										'setup' => '0' 
									] ) )
									{
										//
									
										die( 'fail from friendcore ...' );
									}
								}
								else
								{
									die( 'fail no session ...' );
								}
						
							}*/
							
						}
						else
						{
					
							// Couldn't login ...
					
							die( 'fail from friendcore ...' );
					
						}
					}
					
				}
				
			}
			
		}
		
		if( $creds )
		{
			
			if( $creds->ID )
			{
				// Add custom DockItem temporary solution ...
				
				$hostip = false/*'185.116.5.93'*/;
				$cluster = 'LINE';
				$domain = 'KJELL';
				
				$line = ' usefriendcredentials ad-hoc ' . ( $cluster ? ( 'cluster=' . $cluster ) : 'ip=' . $hostip );
				if( $domain )
				{
					$line .= ' domain=' . $domain;
				}
				
				if( addCustomDockItem( $creds->ID, 'Mitra', true, true, $line ) )
				{
					// It was added with success ...
				}
				
				$identity->userid = $creds->ID;
			}
			
			return $identity;
			
		}
		
		// TODO: Allways get user data as output on success ...
		
	}
	
}

// Convert login data using hashing function
function convertLoginData( $data )
{
	if( $data && ( $data->username && isset( $data->password ) ) )
	{
		
		// TODO: Look if we are going to add a ID from the external service to the username ...
		
		if( $data->password )
		{
			$data->password = generateExternalFriendPassword( $data->password );
			
			// TODO: Look at this ...
			// Password will have to be something that cannot be changed ...
			//$data->password = generateExternalFriendPassword( $data->username );
		}
		
		if( $data->username )
		{
			$data->username = generateExternalFriendUsername( $data->username );
		}
		
	}
	
	return $data;
}

// Hashing function
function generateExternalFriendUsername( $input )
{
	if( $input )
	{
		return hash( 'md5', 'HASHED' . $input );
	}
	
	return '';
}

// Password hashing function
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

// Check if we have "External" type user's group
function checkExternalUserGroup(  )
{
	// TODO: Move this to it's own function ...
	
	include_once( SCRIPT_2FA_PATH . '/../../../php/classes/dbio.php' );
	$conf = parse_ini_file( SCRIPT_2FA_PATH . '/../../../cfg/cfg.ini', true );

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
	
	if( $rs = $dbo->fetchObject( 'SELECT * FROM `FUserGroup` WHERE `Name`=\'User\' AND `Type`=\'External\' ORDER BY `ID` ASC LIMIT 1' ) )
	{
		return;
	}
	
	$rs = $dbo->Query( 'INSERT INTO `FUserGroup` (`UserID`,`ParentID`,`Name`,`Type`) VALUES (\'0\',\'0\',\'User\',\'External\');' );
	
	return;
}

// Generate random hash
function generateFriendUniqueID( $data = '' )
{
	return hash( 'sha256', ( time().$data.rand(0,999).rand(0,999).rand(0,999) ) );
}

// Find application in search paths
function findInSearchPaths( $app )
{
	$ar = array(
		'repository/',
		'resources/webclient/apps/'
	);
	foreach ( $ar as $apath )
	{
		if( file_exists( $apath . $app ) && is_dir( $apath . $app ) )
		{
			return $apath . $app;
		}
	}
	return false;
}

function addCustomDockItem( $uid, $appname, $dock = false, $preinstall = false, $params = '' )
{
	
	// TODO: Move this to it's own function ...
	
	include_once( SCRIPT_2FA_PATH . '/../../../php/classes/dbio.php' );
	$conf = parse_ini_file( SCRIPT_2FA_PATH . '/../../../cfg/cfg.ini', true );

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
	
	
	
	if( $uid && $appname )
	{
		// 5. Store applications
		
		if( $path = findInSearchPaths( $appname ) )
		{
			if( file_exists( $path . '/Config.conf' ) )
			{
				$f = file_get_contents( $path . '/Config.conf' );
				// Path is dynamic!
				$f = preg_replace( '/\"Path[^,]*?\,/i', '"Path": "' . $path . '/",', $f );
			
				// Store application!
				$a = new dbIO( 'FApplication', $dbo );
				$a->UserID = $uid;
				$a->Name = $appname;
				if( !$a->Load() )
				{
					$a->DateInstalled = date( 'Y-m-d H:i:s' );
					$a->Config = $f;
					$a->Permissions = 'UGO';
					$a->DateModified = $a->DateInstalled;
					$a->Save();
				}
			
				// 6. Setup dock items
				
				if( $dock )
				{
					$d = new dbIO( 'DockItem', $dbo );
					$d->Application = ( $appname . $params );
					$d->UserID = $uid;
					$d->Parent = 0;
					if( !$d->Load() )
					{
						$d->Type = 'executable';
						$d->Icon = '/webclient/apps/' . $appname . '/icon.png';
						if( strtolower( $appname ) == 'mitra' && $params && strstr( $params, 'domain=' ) )
						{
							$d->DisplayName = 'Desktop';
							$d->Workspace = 2;
						}
						else
						{
							$d->Workspace = 1;
							$d->DisplayName = ucfirst( $appname );
						}
						//$d->ShortDescription = $r[1];
						$d->SortOrder = $i++;
						$d->Save();
					}
				}
				
				// 7. Pre-install applications
				
				if( $preinstall && $a->ID > 0 )
				{
					if( $a->Config && ( $cf = json_decode( $a->Config ) ) )
					{
						if( isset( $cf->Permissions ) && $cf->Permissions )
						{
							$perms = [];
							foreach( $cf->Permissions as $p )
							{
								$perms[] = [$p,(strtolower($p)=='door all'?'all':'')];
							}
							
							// TODO: Get this from Config.ini in the future, atm set nothing
							$da = new stdClass();
							$da->domain = '';
							
							// Collect permissions in a string
							$app = new dbIO( 'FUserApplication', $dbo );
							$app->ApplicationID = $a->ID;
							$app->UserID = $a->UserID;
							if( !$app->Load() )
							{
								$app->AuthID = md5( rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) . $a->ID );
								$app->Permissions = json_encode( $perms );
								$app->Data = json_encode( $da );
								$app->Save();
							}
						}
					}
				}
				
				return true;
			}
		}
	}
	
	return false;
								
}

// Check database for first login
function firstLoginSetup( $setupid, $uid )
{
	// TODO: Move this to it's own function ...
	
	include_once( SCRIPT_2FA_PATH . '/../../../php/classes/dbio.php' );
	$conf = parse_ini_file( SCRIPT_2FA_PATH . '/../../../cfg/cfg.ini', true );

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
	
	
	
	if( $uid )
	{
		// If we have a populated dock it's not firstime and the template will have to be updated manual through the users app ...
		
		if( ( $row = $dbo->FetchObject( 'SELECT * FROM DockItem WHERE UserID=\'' . $uid . '\'' ) ) )
		{
			return true;
		}
		
		if( $ug = $dbo->FetchObject( '
			SELECT 
				g.*, s.Data 
			FROM 
				`FUserGroup` g, 
				`FSetting` s 
			WHERE 
					' . ( $setupid ? 'g.ID = ' . $setupid . ' AND ' : '' ) . ' 
					g.Type = "Setup" 
				AND s.Type = "setup" 
				AND s.Key = "usergroup" 
				AND s.UserID = g.ID 
			ORDER BY g.ID ASC 
			LIMIT 1
		' ) )
		{
			
			$setupid = $ug->ID;
			
			// TODO: Connect this to the main handling of user templates so it doesn't fall out of sync ...
			
			$ug->Data = ( $ug->Data ? json_decode( $ug->Data ) : false );
					
			
			if( $ug->Data && $uid )
			{
				// Language ----------------------------------------------------------------------------------------

				if( $ug->Data->language )
				{
					// 1. Check and update language!

					$lang = new dbIO( 'FSetting', $dbo );
					$lang->UserID = $uid;
					$lang->Type = 'system';
					$lang->Key = 'locale';
					$lang->Load();
					$lang->Data = $ug->Data->language;
					$lang->Save();
				}

				// Startup -----------------------------------------------------------------------------------------

				if( isset( $ug->Data->startups ) )
				{
					// 2. Check and update startup!

					$star = new dbIO( 'FSetting', $dbo );
					$star->UserID = $uid;
					$star->Type = 'system';
					$star->Key = 'startupsequence';
					$star->Load();
					$star->Data = ( $ug->Data->startups ? json_encode( $ug->Data->startups ) : '[]' );
					$star->Save();
				}

				// Theme -------------------------------------------------------------------------------------------

				if( $ug->Data->theme )
				{
					// 3. Check and update theme!

					$them = new dbIO( 'FSetting', $dbo );
					$them->UserID = $uid;
					$them->Type = 'system';
					$them->Key = 'theme';
					$them->Load();
					$them->Data = $ug->Data->theme;
					$them->Save();
					
					// 3.b. Set 2 workspaces
					$t = new dbIO( 'FSetting', $dbo );
					$t->UserID = $uid;
					$t->Type = 'system';
					$t->Key = 'workspacecount';
					$t->Load();
					$t->Data = '2';
					$t->Save();
				}
		
				// Software ----------------------------------------------------------------------------------------
		
				if( !isset( $ug->Data->software ) )
				{
					$ug->Data->software = json_decode( '[["Dock","1"]]' );
				}
		
				if( $ug->Data->software )
				{
					// 4. Check dock!
			
					// TODO: Perhaps we should add the current list of dock items if there is any included with the software list for adding ...

					if( 1==1/* || !( $row = $dbo->FetchObject( 'SELECT * FROM DockItem WHERE UserID=\'' . $uid . '\'' ) )*/ )
					{
						$i = 0;
						
						foreach( $ug->Data->software as $r )
						{
							if( $r[0] )
							{
								// 5. Store applications
	
								if( $path = findInSearchPaths( $r[0] ) )
								{
									if( file_exists( $path . '/Config.conf' ) )
									{
										$f = file_get_contents( $path . '/Config.conf' );
										// Path is dynamic!
										$f = preg_replace( '/\"Path[^,]*?\,/i', '"Path": "' . $path . '/",', $f );
		
										// Store application!
										$a = new dbIO( 'FApplication', $dbo );
										$a->UserID = $uid;
										$a->Name = $r[0];
										if( !$a->Load() )
										{
											$a->DateInstalled = date( 'Y-m-d H:i:s' );
											$a->Config = $f;
											$a->Permissions = 'UGO';
											$a->DateModified = $a->DateInstalled;
											$a->Save();
										}
			
										// 6. Setup dock items
			
										if( $r[1] )
										{
											$d = new dbIO( 'DockItem', $dbo );
											$d->Application = $r[0];
											$d->UserID = $uid;
											$d->Parent = 0;
											if( !$d->Load() )
											{
												$d->Workspace = 1;
												//$d->ShortDescription = $r[1];
												$d->SortOrder = $i++;
												$d->Save();
											}
										}
				
										// 7. Pre-install applications
			
										if( $ug->Data->preinstall != '0' && $a->ID > 0 )
										{
											if( $a->Config && ( $cf = json_decode( $a->Config ) ) )
											{
												if( isset( $cf->Permissions ) && $cf->Permissions )
												{
													$perms = [];
													foreach( $cf->Permissions as $p )
													{
														$perms[] = [$p,(strtolower($p)=='door all'?'all':'')];
													}
					
													// TODO: Get this from Config.ini in the future, atm set nothing
													$da = new stdClass();
													$da->domain = '';
						
													// Collect permissions in a string
													$app = new dbIO( 'FUserApplication', $dbo );
													$app->ApplicationID = $a->ID;
													$app->UserID = $a->UserID;
													if( !$app->Load() )
													{
														$app->AuthID = md5( rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) . $a->ID );
														$app->Permissions = json_encode( $perms );
														$app->Data = json_encode( $da );
														$app->Save();
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
			
			
			
			if( $uid )
			{
				if( $dels = $dbo->FetchObjects( $q = '
					SELECT 
						g.* 
					FROM 
						`FUserGroup` g, 
						`FUserToGroup` ug 
					WHERE 
							g.Type = "Setup" 
						AND ug.UserGroupID = g.ID 
						AND ug.UserID = \'' . $uid . '\' 
					ORDER BY 
						g.ID ASC 
				' ) )
				{

					foreach( $dels as $del )
					{
						if( $del->ID != $setupid )
						{
							$dbo->Query( 'DELETE FROM FUserToGroup WHERE UserID = \'' . $uid . '\' AND UserGroupID = \'' . $del->ID . '\'' );
						}
					}
				}

				if( $dbo->FetchObject( '
					SELECT 
						ug.* 
					FROM 
						`FUserToGroup` ug 
					WHERE 
							ug.UserGroupID = \'' . $ug->ID . '\' 
						AND ug.UserID = \'' . $uid . '\' 
				' ) )
				{
					$dbo->query( '
						UPDATE FUserToGroup SET UserGroupID = \'' . $ug->ID . '\' 
						WHERE UserGroupID = \'' . $ug->ID . '\' AND UserID = \'' . $uid . '\' 
					' );
				}
				else
				{
					$dbo->query( 'INSERT INTO FUserToGroup ( UserID, UserGroupID ) VALUES ( \'' . $uid . '\', \'' . $ug->ID . '\' )' );
				}
			}
			
		
			return ( $ug->Data ? json_encode( $ug->Data ) : false );
		}
	}
	
	return false;
}

?>
