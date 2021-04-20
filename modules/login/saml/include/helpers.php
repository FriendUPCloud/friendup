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

function check2faAuth( $token )
{
	global $SqlDatabase;
	
	$cleanToken = mysqli_real_escape_string( $SqlDatabase->_link, $token );
	
	if( $row = $SqlDatabase->fetchObject( '
		SELECT * FROM FUserLogin WHERE UserID=-1 AND Login="' . $cleanToken . '"
	' ) )
	{
		return 'ok<!--separate-->' . $token;
	}
	return 'fail<!--separate-->{"message":"-1","reason":"Could not find token."}';
}

?>
