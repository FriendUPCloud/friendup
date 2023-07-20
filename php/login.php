<?php
/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

/******************************************************************************\
*                                                                              *
* FriendUP PHP API v1.0                                                        *
* (c) 2015, Friend Software Labs AS                                            *
* mail: info@friendup.no                                                       *
*                                                                              *
\******************************************************************************/

ob_start();

initLoginModules();

/* == ## == ## == ## == ## == ##== ## == ## == ## == ## == ## == ## == ## ==  */
/* init our modules */
function initLoginModules()
{
	// check which modules to load...
	$modules = checkFCConfig();
	$moduleconfigs = [];

	// Specific regext to trap oauth login module
	if( preg_match( '/\/oauth[\/]{0,1}/i', $GLOBALS['argv'][1], $m ) )
	{
		if( file_exists( 'modules/login/oauth/oauth.php' ) )
		{
			include_once( 'modules/login/oauth/oauth.php' );
		}
	}
	// Try to find config for each module
	else if( $modules )
	{
		for( $i = 0; $i < count( $modules ); $i++ )
		{
			if( 
			    ( 
			        file_exists( 'cfg/' . $modules[ $i ] . '.ini' ) && 
			        ( $cfg = parse_ini_file( 'cfg/' . $modules[ $i ] . '.ini', true ) )
			    ) || 
			    $modules[$i] == 'fcdb' 
			)
			{
				$moduleconfigs[ $modules[$i] ] = $cfg;
			}
		}
		
		if( count( $moduleconfigs ) > 0 )
		{
			//now we have configs... make a global variable here
			$GLOBALS['loginmodules'] = $moduleconfigs;
						
			parseRequest();
			//check if a valid module shouted "use me, use me"
			if(
				$GLOBALS['request_variables'] 
				&& isset( $GLOBALS['request_variables']['module'] ) 
				&& isset( $moduleconfigs[ $GLOBALS['request_variables']['module'] ] )
			)
			{
				
				$moduleconfigs = array_merge(array($GLOBALS['request_variables']['module']=>$moduleconfigs[ $GLOBALS['request_variables']['module'] ]), $moduleconfigs);
			}
			
			$GLOBALS['login_modules'] = $moduleconfigs;
			
			foreach( $moduleconfigs as $module => $config )
			{
				if( $module == 'fcdb' )
				{
					return renderDefaultLogin();
				}
				if( isset( $config['Module']['login'] ) && file_exists( $config['Module']['login'] ) )
				{
					include_once( $config['Module']['login'] );
				}
			}
			
			die( 'Call standard module loginform and inform about the others.' );
		}
	}
	
	//if we get here everything went wrong... we fall back to inbuilt login
	renderDefaultLogin();
}


/* == ## == ## == ## == ## == ##== ## == ## == ## == ## == ## == ## == ## ==  */
/* parse our request which is expected ing argv[1] and argv[2] */
function parseRequest()
{
	if( $GLOBALS['argv'] && count( $GLOBALS['argv'] ) > 1)
	{
		$GLOBALS['request_path'] = $GLOBALS['argv'][1];
		
		if( isset( $GLOBALS['argv'][2] ) )
		{
			$urlvars = false;
			parse_str($GLOBALS['argv'][2], $urlvars);
			$GLOBALS['request_variables'] = $urlvars; 
			
			
			if( isset( $GLOBALS['argv'][3] ) )
			{
				$urlvars = false;
				parse_str($GLOBALS['argv'][3], $urlvars);
				$GLOBALS['request_variables'] = array_merge($GLOBALS['request_variables'],$urlvars);
			}
		}
		else
		{
			$GLOBALS['request_variables'] = false;	
		}
	}
}



/* == ## == ## == ## == ## == ##== ## == ## == ## == ## == ## == ## == ## ==  */
/* check friendcore config for loginmodules to use */
function checkFCConfig()
{
	if( $cfg = parse_ini_file('cfg/cfg.ini',true) )
	{
		if( isset( $cfg['LoginModules']['modules'] ) )
		{
			$modules = explode(',', $cfg['LoginModules']['modules'] );
			return $modules;
		}
	}
	return false;
}


/* == ## == ## == ## == ## == ##== ## == ## == ## == ## == ## == ## == ## ==  */
/* render default login */

function renderDefaultLogin()
{
	if( file_exists('./resources/webclient/templates/login_prompt.html') )
	{
		FriendHeader('Content-Type: text/html');
		die( file_get_contents('./resources/webclient/templates/login_prompt.html') );
	}
	die('<h1>Server error. Please inform your administrator.</h1>');	
}


/* == ## == ## == ## == ## == ##== ## == ## == ## == ## == ## == ## == ## ==  */
/* stuff borrowed aka copied from friend.php */
$friendHeaders = [];
function FriendHeader( $header )
{
	global $friendHeaders;
	if( !is_array( $header ) )
	{
		$GLOBALS[ 'friendHeaders' ] = [];
	}
	
	// Get content type and content
	$headerA = explode( ':', $header );
	if( count( $headerA ) <= 1 )
		return false;
		
	list( $type, $content ) = explode( ':', $header );
	$type = trim( $type );
	$content = trim( $content );
	
	// Move through the headers
	if( count( $friendHeaders ) > 0 )
	{
		foreach( $friendHeaders as $k=>$head )
		{
			// Overwrite it
			if( $k == $type )
			{
				$friendHeaders[$k] = $content;
				return true;
			}
		}
	}
	// Add it
	$friendHeaders[$type] = $content;
	return true;
}

register_shutdown_function( function()
	{
		global $friendHeaders;
		if( count( $friendHeaders ) > 0 )
		{
			// Get current data
			$string = ob_get_contents();
			ob_clean();
		
			// Write data with headers
			$out = "---http-headers-begin---\n";
			foreach( $friendHeaders as $k=>$v )
				$out .= "$k: $v\n";
			$out .= "---http-headers-end---\n";
			die( $out . $string );
		}
	}
);

ob_end_clean();
	
	
?>
