<?php
/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
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
	
	// try to find config for each module
	if( $modules )
	{
		for($i = 0; $i < count( $modules ); $i++)
		{
			if( ( file_exists('cfg/'.$modules[$i].'.ini') && $cfg = parse_ini_file( 'cfg/'.$modules[$i].'.ini',true ) ) || $modules[$i] == 'fcdb' )
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
			
			foreach($moduleconfigs as $module => $config)
			{
				if($module == 'fcdb')
				{
					return renderDefaultLogin();
				}
				if( isset( $config['Module']['login'] ) && file_exists( $config['Module']['login'] ) )
				{
					include_once($config['Module']['login']);
				}
				die( $module . ' :: ' . print_r( $config,1 ) . print_r($moduleconfigs,1) );
			}
			
			
			die('call standard module loginform and inform about the others');
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
	if( file_exists('../build/resources/webclient/templates/login_prompt.html') )
	{
		FriendHeader('Content-Type: text/html');
		die( file_get_contents('../build/resources/webclient/templates/login_prompt.html') );
	}
	die('<h1>Server error. Please inform your administrator.</h1>');	
}


/* == ## == ## == ## == ## == ##== ## == ## == ## == ## == ## == ## == ## ==  */
/* stuff borrowed aka copied from friend.php */
$friendHeaders = [];
function FriendHeader( $header )
{
	global $friendHeaders;
	
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
			
			/*$f = fopen( '/tmp/test.jpg', 'w+' );
			fwrite( $f, $out . $string );
			fclose( $f );*/
			
			die( $out . $string );
		}
	}
);

ob_end_clean();
	
	
?>
