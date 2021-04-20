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
	
	$finds = [
		'{scriptpath}',
		'{welcome}',
		'{friendlinktext}',
		'{additionaliframestyles}',
		'{samlendpoint}',
		'{additionalfriendlinkstyle}'
	];
	$replacements = [
		$GLOBALS['request_path'],
		$welcome,
		$friendlink,
		$additional_iframe_styles,
		$samlendpoint,
		$additionalfriendlinkstyles
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
function check2faAuth( $token, $mobile )
{
	global $SqlDatabase;
	
	$cleanToken  = mysqli_real_escape_string( $SqlDatabase->_link, $token  );
	$cleanMobile = mysqli_real_escape_string( $SqlDatabase->_link, $mobile );
	
	// TODO: By removing previous tokens on mobile number, we could prevent multiple logins on same mobile number
	if( $row = $SqlDatabase->fetchObject( '
		SELECT * FROM FUserLogin WHERE UserID=-1 AND Login="' . $cleanToken . '|' . $cleanMobile . '"
	' ) )
	{
		return 'ok<!--separate-->' . $token;
	}
	
	// Generate code
	$code = '';
	for( $a = 0; $a < 8; $a++ )
	{
		$code .= random( 0, 9 ) . '';
	}
	
	$response = SendSMS( $mobile, 'Your verification code: ' . $code );
	return 'fail<!--separate-->Response: ' . $response;
	
	$o = new dbIO( 'FUserLogin' );
	$o->UserID = -1;
	$o->Login = $token . '|' . $mobile;
	$o->Information = $code;
	$o->Save();
	return 'fail<!--separate-->{"message":"-1","reason":"Token registered."}';
}

?>
