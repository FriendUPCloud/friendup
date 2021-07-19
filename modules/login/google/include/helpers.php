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
	if( $s = fopen( SCRIPT_LOGIN_PATH . '/../../../log/php_log.txt', 'a+' ) )
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
				if( $parts = explode( '/', $url[1] ) )
				{
					if( isset( $parts[0] ) && $parts[0] )
					{
						$args->mode = $parts[0];
					}
					if( isset( $parts[1] ) && $parts[1] )
					{
						$args->publickey = $parts[1];
					}
				}
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
function renderCustomLoginForm( $args = false )
{
	
	if( file_exists( SCRIPT_LOGIN_PATH . '/templates/login.html' ) )
	{
		die( renderReplacements( file_get_contents( SCRIPT_LOGIN_PATH . '/templates/login.html' ), $args ) );
	}
	
	die( '<h1>Your FriendUP installation is incomplete!</h1>' );
}

// Sets replacements on template
function renderReplacements( $template, $args = false )
{
	$welcome = 'Login to your workspace';
	
	$publickey = ''; $redirect_uri = ''; $google_client_id = ''; $friend_register_uri = '';
	
	if( $keys = getServerKeys() )
	{
		if( $keys->publickey )
		{
			$publickey = base64_encode( $keys->publickey );
		}
	}
	
	$server = getServerSettings(  );
	$conf = parse_ini_file( SCRIPT_LOGIN_PATH . '/../../../cfg/cfg.ini', true );
	
	// google api client_secret is also required atm ...
	
	if( !isset( $conf['GoogleDriveAPI']['client_id'] ) && !isset( $conf['GoogleAPI']['client_id'] ) )
	{
		die( 'ERROR! Google API: client_id is missing in cfg!' );
	}
	else
	{
		if( $conf['GoogleAPI']['client_id'] )
		{
			$google_client_id = $conf['GoogleAPI']['client_id'];
		}
		else if( $conf['GoogleDriveAPI']['client_id'] )
		{
			$google_client_id = $conf['GoogleDriveAPI']['client_id'];
		}
	}
	
	if( $args && isset( $args->invite ) )
	{
		if( $args->invite && strstr( $args->invite, 'BASE64' ) )
		{
			if( $parts = explode( 'BASE64', $args->invite ) )
			{
				$args->invite = trim( $parts[0] );
			}
		}
	}
	
	if( $server && $server->friend_register_uri )
	{
		$friend_register_uri = $server->friend_register_uri . ( $args && isset( $args->invite ) ? '?invite=' . $args->invite : '' );
	}
	else
	{
		$friend_register_uri = '/register' . ( $args && isset( $args->invite ) ? '?invite=' . $args->invite : '' );
	}
	
	if( $server && $server->redirect_uri )
	{
		$redirect_uri = $server->redirect_uri;
	}
	else
	{
		$redirect_uri  = ( $conf['Core']['SSLEnable'] ? 'https://' : 'http://' );
		$redirect_uri .= ( $conf['FriendCore']['fchost'] );
		$redirect_uri .= ( $conf['FriendCore']['fchost'] == 'localhost' ? ( $conf['FriendCore']['port'] ? ':' . $conf['FriendCore']['port'] : ':6502' ) : '' );
		$redirect_uri .= ( '/loginprompt/oauth' );
	}
	
	$finds = [ '{oauth2_redirect_uri}', '{google-signin-client_id}', '{publickey}', '{friend_register_uri}' ];
	$replacements = [ $redirect_uri, $google_client_id, $publickey, $friend_register_uri ];
	
	return str_replace( $finds, $replacements, $template );
}


// Authenticate with Friend Core
function remoteAuth( $url, $args = false, $method = 'POST', $headers = false, $auth = false )
{
	$configpath = SCRIPT_LOGIN_PATH . '/../../../cfg/cfg.ini';
	
	$conf = parse_ini_file( $configpath, true );
	
	if( $url && !strstr( $url, 'http://' ) && !strstr( $url, 'https://' ) )
	{
		$url = ( $conf['Core']['SSLEnable'] ? 'https://' : 'http://' ) . $conf['FriendCore']['fchost'] . ( $conf['FriendCore']['port'] ? ':' . $conf['FriendCore']['port'] : '' ) . $url;
	}
	
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
	$dbo = initDBO();
	// TODO: Look at this ...
	if( $row = $dbo->FetchObject( '
		SELECT * FROM FSetting s
		WHERE
			s.UserID = \'-1\'
		AND s.Type = \'google\'
		AND s.Key = \'settings\'
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

function initDBO()
{
	include_once( SCRIPT_LOGIN_PATH . '/../../../php/classes/dbio.php' );
	$conf = parse_ini_file( SCRIPT_LOGIN_PATH . '/../../../cfg/cfg.ini', true );
	
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
	
	return $dbo;
}

function validateFriendIdentity( $json, $nounce )
{
	$error = false; $data = false; $client_secret = false;
	
	if( $conf = parse_ini_file( SCRIPT_LOGIN_PATH . '/../../../cfg/cfg.ini', true ) )
	{
		if( $conf['GoogleAPI']['client_secret'] )
		{
			$client_secret = $conf['GoogleAPI']['client_secret'];
		}
		else if( $conf['GoogleDriveAPI']['client_secret'] )
		{
			$client_secret = $conf['GoogleDriveAPI']['client_secret'];
		}
	}
	
	if( $json && $json->username && $nounce && $client_secret )
	{
		$dbo = initDBO();
		
		if( $identity = $dbo->fetchObject( '
			SELECT fu.ID, fu.Status FROM FUser fu 
			WHERE fu.Name = \'' . mysqli_real_escape_string( $dbo->_link, $json->username ) . '\' 
			AND fu.Password != "" 
		' ) )
		{
			if( $identity->Status == 2 || $identity->Status == 1 )
			{
				$error = '{"result":"-1","response":"Account is blocked or disabled, contact server admin ..."}';
			}
			else
			{
				// Data ...
				$data = '{"result":"1","token":"' . hash( 'sha256', '{"id":' . $identity->ID . ',"secret":"' . $client_secret . '"}' ) . '","response":"Identity confirmed ..."}';
			}
		}
		else
		{
			if( $ret = createFriendAccount( $json, $nounce ) )
			{
				// Data ...
				$data = '{"result":"1","mode":"account","token":"' . $ret . '","response":"Couldn\'t find account ..."}';
			}
			else
			{
				$error = '{"result":"-1","response":"Failed to create Friend account, contact server admin ..."}';
			}
		}
	}
	else
	{
		return false;
	}
	
	if( $data !== false )
	{
		return [ 'ok', $data ];
	}
	else
	{
		return [ 'fail', $error ];
	}
}

function createFriendAccount( $json, $nounce )
{
	
	$client_secret = false;
	
	if( $conf = parse_ini_file( SCRIPT_LOGIN_PATH . '/../../../cfg/cfg.ini', true ) )
	{
		if( $conf['GoogleAPI']['client_secret'] )
		{
			$client_secret = $conf['GoogleAPI']['client_secret'];
		}
		else if( $conf['GoogleDriveAPI']['client_secret'] )
		{
			$client_secret = $conf['GoogleDriveAPI']['client_secret'];
		}
	}
	
	if( $json && $json->username && $nounce && $client_secret )
	{
		
		$dbo = initDBO();
		
		$query = '
			SELECT fu.ID FROM FUser fu 
			WHERE fu.Name = \'' . mysqli_real_escape_string( $dbo->_link, $json->username ) . '\' 
		';
		
		if( !$creds = $dbo->fetchObject( $query ) )
		{
			
			// Create new user ...
			
			if( $dbo->Query( '
			INSERT INTO FUser ( `Name`, `Password`, `PublicKey`, `Fullname`, `Email`, `CreationTime`, `LoginTime`, `ModifyTime`, `UniqueID` ) 
			VALUES ('
				. ' \'' . mysqli_real_escape_string( $dbo->_link, $json->username                   ) . '\''  
				. ',""' 
				. ',""' 
				. ',\'' . mysqli_real_escape_string( $dbo->_link, $json->name  ? trim( $json->name  ) : '' ) . '\'' 
				. ',\'' . mysqli_real_escape_string( $dbo->_link, $json->email ? trim( $json->email ) : '' ) . '\'' 
				. ','   . time() 
				. ','   . time() 
				. ','   . time() 
				. ',\'' . mysqli_real_escape_string( $dbo->_link, generateFriendUniqueID( $json->username ) ) . '\'' 
			.') ' ) )
			{
				if( $creds = $dbo->fetchObject( $query ) )
				{
					
					// add user to users group ....
					$dbo->Query( 'INSERT INTO `FUserToGroup` ( `UserID`,`UserGroupID` ) VALUES ('. intval( $creds->ID ) .', ( SELECT `ID` FROM `FUserGroup` WHERE `Name` = \'User\' AND `Type` = \'Level\' ORDER BY `ID` ASC LIMIT 1 ) );' );
					
					checkExternalUserGroup(  );
					
					// add user to External users group ....
					$dbo->Query( 'INSERT INTO `FUserToGroup` ( `UserID`,`UserGroupID` ) VALUES ('. intval( $creds->ID ) .', ( SELECT `ID` FROM `FUserGroup` WHERE `Name` = \'User\' AND `Type` = \'External\' ORDER BY `ID` ASC LIMIT 1 ) );' );
					
					// add verification code on first login response ...
					$dbo->Query( '
					INSERT INTO FMetaData ( `Key`, `DataID`, `DataTable`, `ValueNumber`, `ValueString` ) 
					VALUES ('
						. ' \'VerificationCode\'' 
						. ',\'' . intval( $creds->ID ) . '\'' 
						. ',\'FUser\'' 
						. ',\'' . strtotime( '+1 hour' ) . '\'' 
						. ',\'' . $nounce . '\'' 
					.') ' );
					
					firstLogin( $creds->ID );
					
					if( $server = getServerSettings(  ) )
					{
						if( isset( $server->user_template_id ) && $server->user_template_id )
						{
							applySetup( $creds->ID, $server->user_template_id );
						}
						
						if( isset( $server->user_workgroup_id ) && $server->user_workgroup_id )
						{
							applyWorkgroupSetup( $creds->ID, $server->user_workgroup_id );
						}
					}
					
					if( $json->locale )
					{
						updateLanguages( $creds->ID, 'en' ); //$json->locale );
					}
					
					addCustomDockItem( $creds->ID, null, 'https://mail.google.com/mail/u/0/#inbox', 'Gmail', 'gfx/weblinks/icon_gmail.png' );
					
					return hash( 'sha256', '{"id":' . $creds->ID . ',"secret":"' . $client_secret . '"}' );
					
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
		else
		{
			return hash( 'sha256', '{"id":' . $creds->ID . ',"secret":"' . $client_secret . '"}' );
		}
	}
	
	return false;
	
}

function verifyGoogleToken( $access_token, $nounce )
{
	if( $verify = remoteAuth( 'https://www.googleapis.com/oauth2/v3/userinfo', false, 'GET', [ 'Content-Type: application/json', 'Authorization: Bearer ' . $access_token ] ) )
	{
		if( $json = json_decode( $verify ) )
		{
			$json->username = $json->sub;
			
			if( $json = convertLoginData( $json, 'GOOGLE', true ) )
			{
				if( $res = validateFriendIdentity( $json, $nounce ) )
				{
					return $res;
				}
			}
		}
	}
}

function updateFriendAccount( $username, $password, $publickey, $nounce, $i_hash = false )
{
	
	$error = false; $data = false;
	
	if( $username && $password && $publickey && $nounce )
	{
		$dbo = initDBO();
		
		if( $creds = $dbo->fetchObject( '
			SELECT fu.ID, fu.Status FROM FUser fu 
			WHERE fu.Name = \'' . mysqli_real_escape_string( $dbo->_link, $username ) . '\' 
			AND fu.Password = "" 
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
					if( trim( $verify->Code ) == trim( $nounce ) )
					{
						$dbo->Query( '
							DELETE FROM FMetaData 
							WHERE 
									`Key` = "VerificationCode" 
								AND `DataID` = \'' . $creds->ID . '\' 
								AND `DataTable` = "FUser" 
						' );
					}
					else
					{
						$error = '{"result":"-1","response":"Verification code doesn\'t match, contact server admin ..."}';
					}
				}
				else
				{
					$error = '{"result":"-1","response":"Verification code for user account empty ..."}';
				}
			}
			
			if( !$error )
			{
				if( $creds->Status == 2 || $creds->Status == 1 )
				{
					$error = '{"result":"-1","response":"Account is blocked or disabled, contact server admin ..."}';
				}
				else
				{
					$usr = new dbIO( 'FUser', $dbo );
					if( $usr->Load( $creds->ID ) )
					{
						$usr->Password = ( '{S6}' . hash( 'sha256', $password ) );
						$usr->PublicKey = trim( $publickey );
						$usr->Save();
						
						if( $i_hash )
						{
							saveAvatar( $creds->ID, 'https://lh3.googleusercontent.com/' . $i_hash );
						}
						
						sendFriendMail( $usr );
						
						$data = '{"result":"1","response":"Friend account created or updated successfully ..."}';
					}
				}
			}
		}
		else
		{
			$error = '{"result":"-1","response":"Something went wrong, contact server admin ... "}';
		}
	}
	else
	{
		return false;
	}
	
	if( $data !== false )
	{
		return [ 'ok', $data ];
	}
	else
	{
		return [ 'fail', $error ];
	}
	
}

function sendFriendMail( $user )
{
	
	if( $Config = parse_ini_file( SCRIPT_LOGIN_PATH . '/../../../cfg/cfg.ini', true ) )
	{
		$dbo = initDBO();
		
		$qua = new dbIO( 'UserQuarantine', $dbo );
		$qua->UserID   = $user->ID;
		$qua->Type     = 'External';
		$qua->Fullname = $user->FullName;
		$qua->Username = $user->Name;
		$qua->Email    = $user->Email;
		if( !$qua->Load() )
		{
			$qua->Verified = 1;
			$qua->DateCreated = time();
		}
		
		if( $qua->Save() )
		{
			$db = new dbIO( 'FMailOutgoing', $dbo );
			$db->UserID = $qua->UserID;
			$db->From = $Config[ 'FriendMail' ][ 'friendmail_user' ];
			$db->To = $qua->Email;
			if( !$db->Load() )
			{
				$db->Date = date( 'Y-m-d H:i:s' );
				$db->Save();
			}
			
			return true;
		}
			
	}
	
	return false;
}

function verifyFriendAuth( $username, $publickey, $nonce = false, $deviceid = '' )
{
	
	$error = false; $data = false;
	
	if( $username )
	{
		$dbo = initDBO();
		
		if( $creds = $dbo->fetchObject( '
			SELECT fu.ID, fu.UniqueID, fu.Name, fu.FullName, fu.Password, fu.Status FROM FUser fu 
			WHERE 
					fu.Name      = \'' . mysqli_real_escape_string( $dbo->_link, $username  ) . '\' 
				AND fu.PublicKey = \'' . mysqli_real_escape_string( $dbo->_link, $publickey ) . '\' 
		' ) )
		{
			
			if( $creds->Status == 2 || $creds->Status == 1 )
			{
				$error = '{"result":"-1","response":"Account is blocked or disabled, contact server admin ..."}';
			}
			else
			{
				
				if( $login = remoteAuth( '/system.library/login', 
				[
					'username' => $creds->Name, 
					'password' => $creds->Password, 
					'deviceid' => $deviceid 
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
								
								$error = '{"result":"-1","error":"[update] fail from friendcore ..."}';
								
							}
							else
							{
								$data = json_encode( $ses );
							}
							
						}
						else
						{
							$error = '{"result":"-1","error":'.$login.'}';
						}
												
					}
					else
					{
						$error = '{"result":"-1","error":'.$login.'}';
					}
					
				}
				else
				{
					// Couldn't login ...
					
					$error = '{"result":"-1","error":"[login] fail from friendcore ..."}';
				}
			
			}
			
		}
		else
		{
			$error = '{"result":"-1","response":"Credentials don\'t match, contact server admin ..."}';
		}
		
	}
	else
	{
		return false;
	}
	
	if( $data !== false )
	{
		return [ 'ok', $data ];
	}
	else
	{
		return [ 'fail', $error ];
	}
	
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

// Send the encrypted response to the login form
function send_encrypted_response( $result, $type = false, $data = '', $publickey = false )
{
	$ret = ( $result ? 'ok' : 'fail' );
	
	$jsonData = $data;
	
	if( $publickey && $data )
	{
		include_once( 'php/3rdparty/fcrypto/fcrypto.class.php' );
		
		$fcrypt = new fcrypto();
		
		if( $encrypted = $fcrypt->encryptString( $data, $publickey ) )
		{
			die( $ret . '<!--separate-->' . ( $type ? ( $type . '<!--separate-->' ) : '' ) . $encrypted->cipher );
		}
		else
		{
			die( 'fail<!--separate-->' . ( $type ? $type . '<!--separate-->' : '' ) . 'failed to encrypt serveranswer ...' );
		}
	}
	
	die( $ret . ( $type ? '<!--separate-->' . $type : '' ) . ( $data ? '<!--separate-->' . $data : '' ) );
}

// Convert login data using hashing function
function convertLoginData( $data, $type = false, $force = false )
{
	if( $data )
	{
		if( $data->password )
		{
			$data->password = generateExternalFriendPassword( $data->password, $force );
		}
		if( $data->username )
		{
			$data->username = generateExternalFriendUsername( $data->username, $type, $force );
		}
		if( $data->publickey && $data->username )
		{
			$data->publickey = getUnHashedPublicKey( $data->publickey, $data->username, $force );
		}
	}
	
	return $data;
}

// Hashing function
function generateExternalFriendUsername( $input, $type = false, $force = false )
{
	if( !$force && strlen( $input ) == 32 && ctype_xdigit( $input ) )
	{
    	return $input;
	}
	if( $input )
	{
		return hash( 'md5', ( $type ? $type : 'HASHED' ) . $input );
	}
	
	return '';
}

// Password hashing function
function generateExternalFriendPassword( $input, $force = false )
{
	if( $input )
	{
		if( !$force && strstr( $input, 'HASHED' ) )
		{
			return ( $input );
		}
		
		return ( 'HASHED' . hash( 'sha256', $input ) );
	}
	return '';
}

// PublicKey unhashed function
function getUnHashedPublicKey( $publickey, $username, $force = false )
{
	$dbo = initDBO();
	
	if( !$force && $publickey && !strstr( $publickey, 'SHA256' ) )
	{
		return $publickey;
	}
	if( $publickey && $username )
	{
		if( $rs = $dbo->fetchObject( 'SELECT `PublicKey` FROM `FUser` WHERE `Name`=\'' . $username . '\' AND `Password` != "" ' ) )
		{
			if( hash( 'sha256', trim( $rs->PublicKey ) ) == str_replace( 'SHA256', '', trim( $publickey ) ) )
			{
				return $rs->PublicKey;
			}
		}
	}
	
	return '';
}

// Check if we have "External" type user's group
function checkExternalUserGroup(  )
{
	
	$dbo = initDBO();
	
	if( $rs = $dbo->fetchObject( 'SELECT * FROM `FUserGroup` WHERE `Name`=\'User\' AND `Type`=\'External\' ORDER BY `ID` ASC LIMIT 1' ) )
	{
		return;
	}
	
	$rs = $dbo->Query( 'INSERT INTO `FUserGroup` (`UserID`,`ParentID`,`Name`,`Type`) VALUES (\'0\',\'0\',\'User\',\'External\');' );
	
	return;
}

function applyWorkgroupSetup( $uid, $wid )
{
	$dbo = initDBO();
	
	if( $uid && $wid )
	{
		if( $rs = $dbo->fetchObject( '
			SELECT 
				gr.* 
			FROM 
				FUserGroup gr, 
				FUserToGroup ug 
			WHERE 
					gr.ID = ' . intval( $wid ) . ' 
				AND gr.Type = \'Workgroup\' 
				AND ug.UserGroupID = gr.ID 
				AND ug.UserID = ' . intval( $uid ) . ' 
		' ) )
		{
			return true;
		}
		
		if( $dbo->fetchObject( 'SELECT * FROM `FUserGroup` WHERE `ID` = ' . intval( $wid ) . ' AND `Type`=\'Workgroup\' ' ) )
		{
			// add user to workgroup....
			$rs = $dbo->Query( 'INSERT INTO `FUserToGroup` ( `UserID`, `UserGroupID` ) VALUES ( ' . intval( $uid ) . ', ' . intval( $wid ) . ' );' );
			
			return true;
		}
	}
	
	return false;
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

function addCustomDockItem( $uid, $appname = false, $weblink = false, $linkname = false, $icon = false, $dock = false, $preinstall = false, $params = '' )
{
	
	$dbo = initDBO();
	
	// Weblink
	
	if( $uid && !$appname && $weblink && $linkname && $icon )
	{
		$d = new dbIO( 'DockItem', $dbo );
		$d->Application = ( $weblink . $params );
		$d->DisplayName = $linkname;
		$d->UserID = $uid;
		$d->Parent = 0;
		if( !$d->Load() )
		{
			$d->Type = 'executable';
			$d->Icon = $icon;
			$d->Workspace = 1;
			//$d->ShortDescription = '';
			
			if( $item = $dbo->FetchObject( 'SELECT COUNT(ID) AS Num FROM DockItem WHERE UserID=\'' . $uid . '\'' ) )
			{
				$d->SortOrder = $item->Num;
			}
			
			$d->Save();
		}
	}
	
	// App
	
	else if( $uid && $appname )
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

function firstLogin( $userid )
{
	
	$SqlDatabase = initDBO();
	
	// TODO: Find out what is going to be the main module call / fc call for first login and use a module or library class to call, like doors.
	
	if( $userid > 0 )
	{
		
		// 2. Check if we never logged in before..
		if( !( $disk = $SqlDatabase->FetchObject( $q = 'SELECT * FROM Filesystem WHERE UserID=\'' . $userid . '\'' ) ) )
		{
			
			// 3. Setup a standard disk
			$o = new dbIO( 'Filesystem', $SqlDatabase );
			$o->UserID = $userid;
			$o->Name = 'Home';
			$o->Load();
			$o->Type = 'SQLDrive';
			$o->ShortDescription = 'My data volume';
			$o->Config = '{"DiskSize":"1GB"}';
			$o->Server = 'localhost';
			$o->Mounted = '1';
	
			if( $o->Save() )
			{
				
				// 4. Wallpaper images directory
				$f2 = new dbIO( 'FSFolder', $SqlDatabase );
				$f2->FilesystemID = $o->ID;
				$f2->UserID = $userid;
				$f2->Name = 'Wallpaper';
				if( !$f2->Load() )
				{
					$f2->DateCreated = date( 'Y-m-d H:i:s' );
					$f2->DateModified = $f2->DateCreated;
					$f2->Save();
				}
				
				// 5. Some example documents
				$f = new dbIO( 'FSFolder', $SqlDatabase );
				$f->FilesystemID = $o->ID;
				$f->UserID = $userid;
				$f->Name = 'Documents';
				if( !$f->Load() )
				{
					$f->DateCreated = date( 'Y-m-d H:i:s' );
					$f->DateModified = $f->DateCreated;
					$f->Save();
				}
				
				$fdownloadfolder = new dbIO( 'FSFolder', $SqlDatabase );
				$fdownloadfolder->FilesystemID = $o->ID;
				$fdownloadfolder->UserID = $userid;
				$fdownloadfolder->Name = 'Downloads';
				if( !$fdownloadfolder->Load() )
				{
					$fdownloadfolder->DateCreated = date( 'Y-m-d H:i:s' );
					$fdownloadfolder->DateModified = $f->DateCreated;
					$fdownloadfolder->Save();
				}
				
				/*$f1 = new dbIO( 'FSFolder', $SqlDatabase );
				$f1->FilesystemID = $o->ID;
				$f1->UserID = $userid;
				$f1->Name = 'Code examples';
				if( !$f1->Load() )
				{
					$f1->DateCreated = date( 'Y-m-d H:i:s' );
					$f1->DateModified = $f1->DateCreated;
					$f1->Save();
				}*/
				
				// 6. Copy some wallpapers
				// TODO: Implement support for "copydefaultwallpapers"
				// This was disabled to conserve space when many user accounts are created
				if( isset( $Config ) && isset( $Config->copydefaultwallpapers ) )
				{
					$prefix = "resources/webclient/theme/wallpaper/";
					$files = array(
						"Autumn",
						"CalmSea",
						"Domestic",
						"Field",
						"Fire",
						"Freedom",
						"NightClouds",
						"RedLeaf",
						"TechRoad",
						"TreeBranch",
						"Bug",
						"CityLights",
						"EveningCalm",
						"FireCones",
						"FjordCoast",
						"GroundedLeaves",
						"Omen",
						"SummerLeaf",
						"TrailBlazing",
						"WindyOcean"
					);
				
					$wallpaperstring = '';
					$wallpaperseperator = '';
					foreach( $files as $file )
					{
						$fl = new dbIO( 'FSFile', $SqlDatabase );
						$fl->Filename = $file . '.jpg';
						$fl->FolderID = $f2->ID;
						$fl->FilesystemID = $o->ID;
						$fl->UserID = $userid;
						if( !$fl->Load() )
						{
							$newname = $file;
							while( file_exists( 'storage/' . $newname . '.jpg' ) )
								$newname = $file . rand( 0, 999999 );
							copy( $prefix . $file . '.jpg', 'storage/' . $newname . '.jpg' );

							$fl->DiskFilename = $newname . '.jpg';
							$fl->Filesize = filesize( $prefix . $file . '.jpg' );
							$fl->DateCreated = date( 'Y-m-d H:i:s' );
							$fl->DateModified = $fl->DateCreated;
							$fl->Save();

							$wallpaperstring .= $wallpaperseperator . '"Home:Wallpaper/' . $file . '.jpg"';
							$wallpaperseperator = ',';
						}
					}
				
					// 7. Copy some other files
					// This is deprecated
					/*$prefix = "resources/webclient/examples/";
					$files = array(
					"ExampleWindow.jsx", "Template.html"
					);
				
					foreach( $files as $filen )
					{
						list( $file, $ext ) = explode( '.', $filen );

						$fl = new dbIO( 'FSFile', $SqlDatabase );
						$fl->Filename = $file . '.' . $ext;
						$fl->FolderID = $f1->ID;
						$fl->FilesystemID = $o->ID;
						$fl->UserID = $userid;
						if( !$fl->Load() )
						{
							$newname = $file;
							while( file_exists( 'storage/' . $newname . '.' . $ext ) )
								$newname = $file . rand( 0, 999999 );
							copy( $prefix . $file . '.' . $ext, 'storage/' . $newname . '.' . $ext );

							$fl->DiskFilename = $newname . '.' . $ext;
							$fl->Filesize = filesize( $prefix . $file . '.' . $ext );
							$fl->DateCreated = date( 'Y-m-d H:i:s' );
							$fl->DateModified = $fl->DateCreated;
							$fl->Save();
						}
					}*/
				}
				
				// 8. Fill Wallpaper app with settings and set default wallpaper
				$wp = new dbIO( 'FSetting', $SqlDatabase );
				$wp->UserID = $userid;
				$wp->Type = 'system';
				$wp->Key = 'imagesdoors';
				if( !$wp->Load() )
				{
					$wp->Data = '';
					$wp->Save();
				}
				
				$wp = new dbIO( 'FSetting', $SqlDatabase );
				$wp->UserID = $userid;
				$wp->Type = 'system';
				$wp->Key = 'wallpaperdoors';
				if( !$wp->Load() )
				{
					$wp->Data = '';
					$wp->Save();
				}
				
				return true;
			}
		}
	}
	
	return false;
}

function updateLanguages( $userid, $lang )
{
	$dbo = initDBO();
		
	if( $userid > 0 && trim( $lang ) )
	{
		// Find right language for speech
		$langs = [ 'en', 'fr', 'no', 'fi', 'pl' ]; //speechSynthesis.getVoices();
	
		$voice = false;
	
		// TODO: Too early to check languages
		/*foreach( $langs as $v )
		{
			if( strtolower( trim( $v ) ) == strtolower( trim( $lang ) ) )
			{
				$voice = '{"spokenLanguage":"' . $lang . '","spokenAlternate":"' . $lang . '"}';
			}
		}*/
		
		if( !$voice )
		{
			// Default to en ...
			
			$langs = 'en';
			
			$voice = '{"spokenLanguage":"' . $lang . '","spokenAlternate":"' . $lang . '"}';
		}
		
		$lo = new dbIO( 'FSetting', $dbo );
		$lo->UserID = $userid;
		$lo->Type = 'system';
		$lo->Key = 'locale';
		$lo->Load();
		if( $lo->Data != $lang )
		{
			$lo->Data = $lang;
			$lo->Save();
	
			if( $lo->ID > 0 )
			{
				$lo = new dbIO( 'FSetting', $dbo );
				$lo->UserID = $userid;
				$lo->Type = 'system';
				$lo->Key = 'language';
				$lo->Load();
				$lo->Data = $voice;
				$lo->Save();
			
				return true;
			}
		}
		else
		{
			return true;
		}
	}
	
	return false;
}

function saveAvatar( $userid, $imgurl )
{
	$SqlDatabase = initDBO();
	
	// Save image blob as filename hash on user
	if( $userid > 0 && $imgurl )
	{
		$o = new dbIO( 'FSetting', $SqlDatabase );
		$o->UserID = $userid;
		$o->Type = 'system';
		$o->Key = 'avatar';
		if( !$o->Load() || !$o->Data )
		{
			
			$u = new dbIO( 'FUser', $SqlDatabase );
			$u->ID = $userid;
			if( $u->Load() && $u->Image != md5( $imgurl ) )
			{
			
				if( $binary = file_get_contents( trim( $imgurl ) ) )
				{
				
					if( $imgdata = getimagesize( trim( $imgurl ) ) )
					{
				
						if( $base64 = base64_encode( $binary ) )
						{
							$base64 = ( 'data:' . $imgdata['mime'] . ';base64,' . $base64 );
						
							if( !base64_encode( base64_decode( $base64, true ) ) === $base64 )
							{
								die( 'fail not base64 string ...' );
							}
						
							$o->Data = trim( $base64 );
							$o->Save();
				
							if( $o->ID > 0 )
							{
								$u->Image = md5( $imgurl );
								$u->Save();
							
								return true;
							}
				
						}
					
					}
			
				}
			
			}
			
		}
	}
	
	return false;
}

function applySetup( $userid, $id )
{
	
	$Config = parse_ini_file( SCRIPT_LOGIN_PATH . '/../../../cfg/cfg.ini', true );
	
	$ConfShort = new stdClass();
	$ConfShort->SSLEnable = $Config[ 'Core' ][ 'SSLEnable' ];
	$ConfShort->FCPort    = $Config[ 'Core' ][ 'port' ];
	$ConfShort->FCHost    = $Config[ 'FriendCore' ][ 'fchost' ];
	$ConfShort->FCUpload  = $Config[ 'FriendCore' ][ 'fcupload' ];
	
	$SqlDatabase = initDBO();
	
	// TODO: Find out what is going to be the main module call / fc call for first login and use a module or library class to call, like doors.
	
	if( $userid > 0 && $id > 0 )
	{
		if( $ug = $SqlDatabase->FetchObject( '
			SELECT 
				g.*, s.Data
			FROM 
				`FUserGroup` g, 
				`FSetting` s 
			WHERE 
					g.ID = \'' . $id . '\' 
				AND g.Type = "Setup" 
				AND s.Type = "setup" 
				AND s.Key = "usergroup" 
				AND s.UserID = g.ID 
		' ) )
		{
			$debug = [];
			
			$users = array( $userid );
			
			$ug->Data = ( $ug->Data ? json_decode( $ug->Data ) : false );
			
			// Try to get wallpaper
			$wallpaper = new dbIO( 'FMetaData', $SqlDatabase );
			$wallpaper->DataID = $ug->ID;
			$wallpaper->DataTable = 'FSetting';
			$wallpaper->Key = 'UserTemplateSetupWallpaper';
			$wallpaperContent = false;
			if( !$wallpaper->Load() )
			{
				$wallpaper = false;
			}
			else
			{
				if( !( $wallpaperContent = file_get_contents( $wallpaper->ValueString ) ) )
				{
					$wallpaper = false;
				}
			}
			
			if( $users )
			{
				foreach( $users as $uid )
				{
					$debug[$uid] = new stdClass();
					
					// Make sure the user exists!
					$theUser = new dbIO( 'FUser', $SqlDatabase );
					$theUser->load( $uid );
					if( !$theUser->ID ) continue;
				
					// Great, we have a user
					if( $ug->Data && $uid )
					{
						// Language ------------------------------------------------------------------------------------
			
						if( $ug->Data->language )
						{
							// 1. Check and update language!
	
							$lang = new dbIO( 'FSetting', $SqlDatabase );
							$lang->UserID = $uid;
							$lang->Type = 'system';
							$lang->Key = 'locale';
							$lang->Load();
							$lang->Data = 'en'; //$ug->Data->language;
							$lang->Save();
							
							$debug[$uid]->language = ( $lang->ID > 0 ? $lang->Data : false );
						}
		
						// Wallpaper -----------------------------------------------
						// TODO: Support other filesystems than SQLDrive! (right now, not possible!)
					
						if( $wallpaper )
						{
							$debug[$uid]->wallpaper = new stdClass();
							
							$fnam = $wallpaper->ValueString;
							$fnam = explode( '/', $fnam );
							$fnam = end( $fnam );
							$ext  = explode( '.', $fnam );
							$fnam = $ext[0];
							$ext  = $ext[1];
							
							$debug[$uid]->wallpaper->filename = $wallpaper->ValueString;
							
							$f = new dbIO( 'Filesystem', $SqlDatabase );
							$f->UserID = $uid;
							$f->Name   = 'Home';
							if( !$f->Load() )
							{
								$f->ShortDescription = 'My data volume';
								$f->Mounted = '1';
							
								// TODO: Enable this when we have figured out a better way to handle firstlogin.defaults.php if Home: is created it fucks up the first login procedure ...
							
								//$f->Save();
							
								$f->ID = 0;
							}
						
							if( $f->ID > 0 && $fnam && $ext && $theUser->Name )
							{
								// Make sure we have wallpaper folder
								$fl = new dbIO( 'FSFolder', $SqlDatabase );
								$fl->FilesystemID = $f->ID;
								$fl->UserID = $uid;
								$fl->Name = 'Wallpaper';
								$fl->FolderID = 0;
								if( !$fl->Load() )
								{
									$fl->DateCreated = date( 'Y-m-d H:i:s' );
									$fl->DateModified = $fl->DateCreated;
								
									$fl->Save();
								}
								
								$fi = new dbIO( 'FSFile', $SqlDatabase );
								$fi->Filename = ( 'default_wallpaper_' . $fl->FilesystemID . '_' . $fl->UserID . '.jpg' );
								$fi->FolderID = $fl->ID;
								$fi->FilesystemID = $f->ID;
								$fi->UserID = $uid;
								if( $fi->Load() && $fi->DiskFilename )
								{
									if( file_exists( $ConfShort->FCUpload . $fi->DiskFilename ) )
									{
										unlink( $ConfShort->FCUpload . $fi->DiskFilename );
									}
								}
								
								// Find disk filename
								$uname = str_replace( array( '..', '/', ' ' ), '_', $theUser->Name );
								if( !file_exists( $ConfShort->FCUpload . $uname ) )
								{
									mkdir( $ConfShort->FCUpload . $uname );
								}
							
								while( file_exists( $ConfShort->FCUpload . $uname . '/' . $fnam . '.' . $ext ) )
								{
									$fnam = ( $fnam . rand( 0, 999999 ) );
								}
								
								
								
								if( $fp = fopen( $ConfShort->FCUpload . $uname . '/' . $fnam . '.' . $ext, 'w+' ) )
								{
									fwrite( $fp, $wallpaperContent );
									fclose( $fp );
									
									$debug[$uid]->wallpaper->diskfilename = ( $uname . '/' . $fnam . '.' . $ext );
									$debug[$uid]->wallpaper->content = ( $wallpaperContent ? true : false );
									
									$fi->DiskFilename = ( $uname . '/' . $fnam . '.' . $ext );
									$fi->Filesize = filesize( $wallpaper->ValueString );
									$fi->DateCreated = date( 'Y-m-d H:i:s' );
									$fi->DateModified = $fi->DateCreated;
									$fi->Save();
								
									$debug[$uid]->wallpaper->id = ( $fi->ID > 0 ? $fi->ID : false );
								
									// Set the wallpaper in config
									$s = new dbIO( 'FSetting', $SqlDatabase );
									$s->UserID = $uid;
									$s->Type = 'system';
									$s->Key = 'wallpaperdoors';
									$s->Load();
									$s->Data = '"Home:Wallpaper/' . $fi->Filename . '"';
									$s->Save();
								
									$debug[$uid]->wallpaper->wallpaperdoors = ( $s->ID > 0 ? $s->Data : false );
								
									// Fill Wallpaper app with settings and set default wallpaper
									$wp = new dbIO( 'FSetting', $SqlDatabase );
									$wp->UserID = $uid;
									$wp->Type = 'system';
									$wp->Key = 'imagesdoors';
									if( $wp->Load() && $wp->Data )
									{
										$data = substr( $wp->Data, 1, -1 );
	
										if( $data && !strstr( $data, '"Home:Wallpaper/' . $fi->Filename . '"' ) )
										{
											if( $json = json_decode( $data, true ) )
											{
												$json[] = ( 'Home:Wallpaper/' . $fi->Filename );
			
												if( $data = json_encode( $json ) )
												{
													$wp->Data = stripslashes( '"' . $data . '"' );
													$wp->Save();
												}
												
												$debug[$uid]->wallpaper->imagesdoors = ( $wp->ID > 0 ? $wp->Data : false );
											}
										}
									}
								
								}
							
							
							}
						}
						
						// Startup -------------------------------------------------------------------------------------
		
						if( isset( $ug->Data->startups ) )
						{
							// 2. Check and update startup!
	
							$star = new dbIO( 'FSetting', $SqlDatabase );
							$star->UserID = $uid;
							$star->Type = 'system';
							$star->Key = 'startupsequence';
							$star->Load();
							$star->Data = ( $ug->Data->startups ? json_encode( $ug->Data->startups ) : '[]' );
							$star->Save();
							
							$debug[$uid]->startup = ( $star->ID > 0 ? $star->Data : false );
						}
		
						// Theme ---------------------------------------------------------------------------------------
		
						if( $ug->Data->theme )
						{
							// 3. Check and update theme!
	
							$them = new dbIO( 'FSetting', $SqlDatabase );
							$them->UserID = $uid;
							$them->Type = 'system';
							$them->Key = 'theme';
							$them->Load();
							$them->Data = $ug->Data->theme;
							$them->Save();
							
							$debug[$uid]->theme = ( $them->ID > 0 ? $them->Data : false );
						}
					
						if( $ug->Data->themeconfig && $ug->Data->theme )
						{
							// 3. Check and update look and feel config!
						
							$them = new dbIO( 'FSetting', $SqlDatabase );
							$them->UserID = $uid;
							$them->Type = 'system';
							$them->Key = 'themedata_' . strtolower( $ug->Data->theme );
							$them->Load();
							$them->Data = json_encode( $ug->Data->themeconfig );
							$them->Save(); 
							
							$debug[$uid]->themedata = ( $them->ID > 0 ? $them->Data : false );
						}
					
						if( $ug->Data->workspacecount )
						{
							// 3. Check and update look and feel workspace numbers!
						
							$them = new dbIO( 'FSetting', $SqlDatabase );
							$them->UserID = $uid;
							$them->Type = 'system';
							$them->Key = 'workspacecount';
							$them->Load();
							$them->Data = $ug->Data->workspacecount;
							$them->Save(); 
							
							$debug[$uid]->workspacecount = ( $them->ID > 0 ? $them->Data : false );
						}
					
						// Software ------------------------------------------------------------------------------------
					
						if( !isset( $ug->Data->software ) )
						{
							$ug->Data->software = json_decode( '[["Dock","1"]]' );
						}
					
						if( $ug->Data->software )
						{
							// 4. Check dock!
						
							// TODO: Perhaps we should add the current list of dock items if there is any included with the software list for adding ...
	
							if( 1==1 || !( $row = $SqlDatabase->FetchObject( 'SELECT * FROM DockItem WHERE UserID=\'' . $uid . '\'' ) ) )
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
												$a = new dbIO( 'FApplication', $SqlDatabase );
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
													$d = new dbIO( 'DockItem', $SqlDatabase );
													$d->Application = $r[0];
													$d->UserID = $uid;
													$d->Parent = 0;
													if( !$d->Load() )
													{
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
															$app = new dbIO( 'FUserApplication', $SqlDatabase );
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
						if( $dels = $SqlDatabase->FetchObjects( $q = '
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
								if( $del->ID != $args->args->id )
								{
									$SqlDatabase->Query( 'DELETE FROM FUserToGroup WHERE UserID = \'' . $uid . '\' AND UserGroupID = \'' . $del->ID . '\'' );
								}
							}
						}
		
						if( $SqlDatabase->FetchObject( '
							SELECT 
								ug.* 
							FROM 
								`FUserToGroup` ug 
							WHERE 
									ug.UserGroupID = \'' . $ug->ID . '\' 
								AND ug.UserID = \'' . $uid . '\' 
						' ) )
						{
							$SqlDatabase->query( '
								UPDATE FUserToGroup SET UserGroupID = \'' . $ug->ID . '\' 
								WHERE UserGroupID = \'' . $ug->ID . '\' AND UserID = \'' . $uid . '\' 
							' );
						}
						else
						{						
							$SqlDatabase->query( 'INSERT INTO FUserToGroup ( UserID, UserGroupID ) VALUES ( \'' . $uid . '\', \'' . $ug->ID . '\' )' );
						}
					}
				}
			}
			
			return ( $ug->Data ? json_encode( [ $ug->Data, $debug ] ) : 'false' );
		}
	}
	else if( $userid > 0 && ( !$id || $id == 0 ) )
	{
		
		$users = array( $userid );	
	
		if( $users )
		{
			
			// 0. Check if mountlist is installed and user have access!
			if( !( $row = $SqlDatabase->FetchObject( 'SELECT * FROM FApplication WHERE Name = "Mountlist" AND UserID=\'' . $userid . '\'' ) ) )
			{
				
				if( $path = findInSearchPaths( 'Mountlist' ) )
				{
					if( file_exists( $path . '/Config.conf' ) )
					{
						$f = file_get_contents( $path . '/Config.conf' );
						// Path is dynamic!
						$f = preg_replace( '/\"Path[^,]*?\,/i', '"Path": "' . $path . '/",', $f );

						// Store application!
						$a = new dbIO( 'FApplication', $SqlDatabase );
						$a->UserID = $userid;
						$a->Name = 'Mountlist';
						if( !$a->Load() )
						{
							$a->DateInstalled = date( 'Y-m-d H:i:s' );
						}

						$a->Config = $f;
						$a->Permissions = 'UGO';
						$a->DateModified = $a->DateInstalled;
						$a->Save();

						// Application activation
						if( $a->ID > 0 )
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
									$app = new dbIO( 'FUserApplication', $SqlDatabase );
									$app->ApplicationID = $a->ID;
									$app->UserID = $a->UserID;
									$app->Load();
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
			
			// 1. Check dock!
			if( !( $row = $SqlDatabase->FetchObject( 'SELECT * FROM DockItem WHERE UserID=\'' . $userid . '\'' ) ) )
			{
				// 2. Setup standard dock items
				$dockItems = array(
					array( 'Dock', 'Manage your application laucher' ),
					array( 'FriendShell', 'The Friend command line interface' ),
					array( 'FriendChat', 'A chat and video conferencing application' ),
					array( 'FriendCreate', 'A programmers editor' ),
					array( 'Author', 'A simple word processor' ),
					array( 'Wallpaper', 'Select wallpapers' ),
					array( 'Calculator', 'Do some math' )
				);
				$i = 0;
				foreach( $dockItems as $r )
				{
					$d = new dbIO( 'DockItem', $SqlDatabase );
					$d->Application = $r[0];
					$d->ShortDescription = $r[1];
					$d->UserID = $userid;
					$d->SortOrder = $i++;
					$d->Parent = 0;
					$d->Save();
				}
			}
			
			foreach( $users as $uid )
			{
				if( $uid )
				{
					if( $dels = $SqlDatabase->FetchObjects( $q = '
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
							$SqlDatabase->Query( 'DELETE FROM FUserToGroup WHERE UserID = \'' . $uid . '\' AND UserGroupID = \'' . $del->ID . '\'' );
						}
					}
				}
			}
			
			return '[]';
		}
		
	}
	
	return false;
}



?>
