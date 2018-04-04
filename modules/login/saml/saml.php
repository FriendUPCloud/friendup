<?php
	
	/**
	
		Login module for SAML authentication
		
		v0.01 very first proof of concept
		
		note yhat login modules are not normal modules as no user is present! 
		this file should be included by php/login.php and expects some global variables to be set
	
	*/

	//check that necessary globals and config are present
	if(
		$GLOBALS['request_path'] === null 
		|| $GLOBALS['request_variables'] === null 
		|| $GLOBALS['login_modules']['saml'] === null 
		|| $GLOBALS['login_modules']['saml']['Module'] === null 
	) die('<h1>Invalid SAML configuration. Contact your administrator!</h1>');
	
	/*
		define some functions.
	*/
	function renderSAMLLoginForm()
	{
		$providers = [];
		$provider = false;
		$lp = '';		
	
	
		foreach( $GLOBALS['login_modules']['saml']['Providers'] as $pk => $pv );
		{
			//do some checks here
		}
		
		if( file_exists(dirname(__FILE__) . '/templates/login.html') )
			die( renderReplacements( file_get_contents(dirname(__FILE__) . '/templates/login.html') ) );
		
		
		die('<h1>Your FriendUP installation is incomplete!</h1>');
	}
	
	function renderReplacements( $template )
	{
		$welcome 						= $GLOBALS['login_modules']['saml']['Login']['logintitle_en'] !== null ? $GLOBALS['login_modules']['saml']['Login']['logintitle_en'] :'SAML Login';
		$friendlink 					= $GLOBALS['login_modules']['saml']['Login']['friend_login_text_en'] !== null ? $GLOBALS['login_modules']['saml']['Login']['friend_login_text_en'] :'Login using Friend account';
		$additional_iframe_styles 		= $GLOBALS['login_modules']['saml']['Login']['additional_iframe_styles'] !== null ? $GLOBALS['login_modules']['saml']['Login']['additional_iframe_styles'] :'';
		$additionalfriendlinkstyles 	= $GLOBALS['login_modules']['saml']['Login']['additional_friendlink_styles'] !== null ? $GLOBALS['login_modules']['saml']['Login']['additional_friendlink_styles'] : '';

		$samlendpoint = $GLOBALS['login_modules']['saml']['Module']['samlendpoint'] !== null ? $GLOBALS['login_modules']['saml']['Module']['samlendpoint'] : 'about:blank';
		$samlendpoint .= '?friendendpoint=' . urlencode($GLOBALS['request_path']);
		
		$finds = [
			'{scriptpath}'
			,'{welcome}'
			,'{friendlinktext}'
			,'{additionaliframestyles}'
			,'{samlendpoint}'
			,'{additionalfriendlinkstyle}'
		];
		$replacements = [
				$GLOBALS['request_path']
				,$welcome
				,$friendlink
				,$additional_iframe_styles
				,$samlendpoint
				,$additionalfriendlinkstyles
		];
		
		return str_replace($finds, $replacements, $template);
	}

	//render the form
	renderSAMLLoginForm();

?>