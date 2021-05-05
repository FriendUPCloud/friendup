<?php

/*©lgpl*************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************©*/

function Logging( $str )
{
	return null; // Disabled :)
	if( $f = fopen( '/tmp/log.txt', 'a+' ) )
	{
		fwrite( $f, date( 'YmdHis' ) . ': ' . $str . "\n" );
		fclose( $f );
	}
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


// Get varargs
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

// Render the SAML login form
function renderSAMLLoginForm()
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
	
	if( file_exists(dirname(__FILE__) . '/../templates/login.html') )
		die( renderReplacements( file_get_contents(dirname(__FILE__) . '/../templates/login.html') ) );
	
	
	die( '<h1>Your FriendUP installation is incomplete!</h1>' );
}

// Set replacements on template
function renderReplacements( $template )
{
	$samlLog = $GLOBALS[ 'login_modules' ][ 'saml' ][ 'Login' ];
	$samlMod = $GLOBALS[ 'login_modules' ][ 'saml' ][ 'Module' ];

	// Get some keywords
	$welcome = $samlLog['logintitle_en'] !== null ? 
		$samlLog['logintitle_en'] : 'SAML Login';
		
	$friendlink = $samlLog['friend_login_text_en'] !== null ? 
		$samlLog['friend_login_text_en'] : 'Login using Friend account';
		
	$additional_iframe_styles = $samlLog['additional_iframe_styles'] !== null ? 
		$samlLog['additional_iframe_styles'] : '';
		
	$additionalfriendlinkstyles = $samlLog['additional_friendlink_styles'] !== null ? 
		$samlLog['additional_friendlink_styles'] : '';

	// Find endpoint
	$samlendpoint = $samlMod['samlendpoint'] !== null ? 
		$samlMod['samlendpoint'] : 'about:blank';
	$samlendpoint .= '?friendendpoint=' . urlencode( $GLOBALS['request_path'] );
	
	
	// Public key
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
		'{friendlinktext}',
		'{additionaliframestyles}',
		'{samlendpoint}',
		'{additionalfriendlinkstyle}',
		'{publickey}'
	];
	$replacements = [
		$GLOBALS['request_path'],
		$welcome,
		$friendlink,
		$additional_iframe_styles,
		$samlendpoint,
		$additionalfriendlinkstyles,
		$publickey
	];
	
	return str_replace( $finds, $replacements, $template );
}

function SendSMS( $mobile, $message )
{
	global $Config;
	
	$host    = ( isset( $Config['SMS']['host']  )   ? $Config['SMS']['host']  :   '' );
	$token   = ( isset( $Config['SMS']['token'] )   ? $Config['SMS']['token'] :   '' );
	$from    = ( isset( $Config['SMS']['from']  )   ? $Config['SMS']['from']  :   '' );
	$version = ( isset( $Config['SMS']['version'] ) ? $Config['SMS']['version'] : '' );
	
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
			$json->to = array( $mobile );
			break;
		default:
			$header = array(
				'Content-Type: application/json',
				'Authorization: ' . $token
			);
			$json = new stdClass();
			$json->content = $message;
			$json->to = array( $mobile );
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
	return $output;
}

// Check if this user was authenticated with an auth token!
// If not, do register and send an SMS
function check2faAuth( $token, $mobile, $code = false )
{
	global $SqlDatabase;
	
	$cleanToken  = mysqli_real_escape_string( $SqlDatabase->_link, $token  );
	$cleanMobile = mysqli_real_escape_string( $SqlDatabase->_link, $mobile );
	if( $code )
	{
		$cleanCode = mysqli_real_escape_string( $SqlDatabase->_link, $code );
	}
	
	// Check code
	if( $code )
	{
		$q = 'SELECT * FROM FUserLogin WHERE UserID=-1 AND Login="' . $cleanToken . '|' . $cleanMobile . '" AND Information="' . $cleanCode . '"';
	}
	else
	{
		$q = 'SELECT * FROM FUserLogin WHERE UserID=-1 AND Login="' . $cleanToken . '|' . $cleanMobile . '"';
	}
	
	if( $row = $SqlDatabase->fetchObject( $q ) )
	{
		return 'ok<!--separate-->' . $token;
	}
	
	// Generate code (six decimals)
	if( !$code )
	{
		$code = '';
		for( $a = 0; $a < 6; $a++ )
		{
			$code .= rand( 0, 9 ) . '';
		}
	
		// Send the verification code
		$response = SendSMS( $mobile, 'Your verification code: ' . $code );
	
		cleanupTokens( $mobile );
	
		$o = new dbIO( 'FUserLogin' );
		$o->UserID = -1;
		$o->Login = $token . '|' . $mobile;
		$o->Information = $code;
		$o->LoginTime = strtotime( date( 'Y-m-d H:i:s' ) );
		$o->Save();
	}
	else
	{
		$response = 'Code is wrong.';
	}
	
	return 'fail<!--separate-->{"message":"-1","reason":"Token registered.","SMS-Response":"' . $response . '"}';
}

// Verify the Windows user identity for a specific RDP server
function verifyWindowsIdentity( $username, $password = '', $server )
{	
	$error = false; $data = false;
	
	// TODO: set login data static for the presentation, remove later, only test data.
	// TODO: verify user with free rdp ...
	// TODO: implement max security with certs for ssh / rdp access if possible, only allow local ...
	
	if( $username && $server )
	{
		if( function_exists( 'shell_exec' ) )
		{
			$connection = false;
			
			// TODO: Move this to a server config, together with what mode to use for 2factor ...
			// TODO: Look at hashing password or something ...
			
			Logging( "Trying to log in." );
			
			$hostname = $server; //->host;
			$port = 22; //( $server->ssh_port ? $server->ssh_port : 22 );
			$rdp =  3389; // ( $server->rdp_port ? $server->rdp_port : 3389 );
			$username = trim( addslashes( $username ) );
			$password = trim( addslashes( $password ) );
			
			if( $hostname && $username && $password )
			{
				// Check user creds using freerdp ...
				// TODO: Add more security to password check ...	
				$authenticated = false; $found = false;
				// sfreerdp needs special option added on install cmake -GNinja -DCHANNEL_URBDRC=OFF -DWITH_DSP_FFMPEG=OFF -DWITH_CUPS=OFF -DWITH_PULSE=OFF -DWITH_SAMPLE=ON .
				// TODO: Get error messages for not WHITE LABELLED!!!!!!
				
				Logging( "Attempting to call with sfreerdp." );
				
				try
				{
					if( $checkauth = exec_timeout( "sfreerdp /cert-ignore /cert:ignore +auth-only /u:$username /p:$password /v:$hostname /port:$rdp /log-level:ERROR 2>&1" ) )
					{
						if( strstr( $checkauth, 'sfreerdp: not found' ) )
						{
							$checkauth = exec_timeout( "xfreerdp /cert-ignore /cert:ignore +auth-only /u:$username /p:$password /v:$hostname /port:$rdp /log-level:ERROR 2>&1" );
						}
						$found = true;
					}
				}
				catch( Exception $e )
				{
					Logging( 'Borked with this error: ' . $e );
				}
				
				Logging( 'Result was: ' . $checkauth );
				
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
				
				Logging( 'Final done.' );
				
				if( !$error )
				{
					return [ 'ok', '{"result":"1","response":"Successfully verified user."}' ];
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
	
	return [ 'fail', $error ];
}

// Clean up expired tokens and tokens on mobile number
function cleanupTokens( $mobile )
{
	global $Config, $SqlDatabase;
	
	$cleanMobile = mysqli_real_escape_string( $SqlDatabase->_link, $mobile );
	
	// Just remove all 2fa access tokens on this mobile number
	$SqlDatabase->query( 'DELETE FROM FUserLogin WHERE UserID=-1 AND `Login` LIKE "%|' . $cleanMobile . '"' );
}

// Do the final execution of 2fa verification
function execute2fa( $data )
{
	global $Config, $SqlDatabase;
	
	// Remove expired 2fa tokens!
	$thePast = strtotime( date( 'Y-m-d H:i:s' ) );
	$thePast -= 60 * 10; // Ten minutes in the past!
	$SqlDatabase->query( 'DELETE FROM FUserLogin WHERE UserID=-1 AND `LoginTime` <= ' . $thePast );
	
	$result = check2faAuth( $data->AuthToken, $data->MobileNumber, $data->Code );
	if( $result && substr( $result, 0, 3 ) == 'ok<' )
	{
		$result = verifyWindowsIdentity( $data->Login, $data->Password, $Config[ 'Windows' ][ 'server' ] );
		if( $result )
		{
			// Check if the windows identity was successful
			if( $result[ 0 ] == 'ok' )
			{
				$json = new stdClass();
				$login          = $data->Login;
				$json->username = $data->Username;
				$json->password = $data->Password;
				$json->fullname = $data->Fullname;
				$json->mobile   = $data->MobileNumber;
				$json->deviceid = $data->DeviceId;
				
				// Compare user data with Friend OS
				if( !( $data = checkFriendUser( $json, true ) ) )
				{
					return 'fail<!--separate-->{"result":"-1","response":"Unexpected return value."}';
				}
				
				// Add missing bits
				if( strstr( $login, '\\' ) )
				{
					$login = explode( '\\', $login );
					if( count( $login ) > 1 )
						$login = $login[1];
				}
				$data->login = $login;
				
				return $result[ 0 ] . '<!--separate-->' . json_encode( $data );
			}
		}
		return 'fail<!--separate-->{"result":"-1","response":"Could not verify Microsoft account."}';
	}
	return 'fail<!--separate-->{"result":"-1","response":"Could not verify token and code. Please retry again."}';
}

?>
