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

/**

	Login module for SAML authentication
	
	v0.5
	
	Note that login modules are not normal modules as no user is present.
	This file should be included by php/login.php and expects some global 
	variables to be set.

*/

// Include database toolset ----------------------------------------------------
include( 'php/classes/dbio.php' );
$config = parse_ini_file( 'cfg/cfg.ini', true );
$SqlDatabase = new SqlDatabase();
$SqlDatabase->Open( 
	$config[ 'DatabaseUser' ][ 'host' ], 
	$config[ 'DatabaseUser' ][ 'login' ],
	$config[ 'DatabaseUser' ][ 'password' ] ) or 
		die( 'fail<!--separate-->Database error.' );
$SqlDatabase->SelectDatabase( $config[ 'DatabaseUser' ][ 'dbname' ] );
$GLOBALS[ 'SqlDatabase' ] =& $SqlDatabase;
$GLOBALS[ 'Config' ] =& $config;
register_shutdown_function( function()
{
	global $SqlDatabase;
	$SqlDatabase->close();
} );
// End database toolset --------------------------------------------------------

include( 'include/helpers.php' );        // General helper functions
include( 'include/helpers_user.php' );   // User related helper functions
include( 'include/helpers_crypto.php' ); // Crypto related helper functions

//check that necessary globals and config are present
if(
	!isset( $GLOBALS[ 'request_path' ] ) ||
	!isset( $GLOBALS[ 'request_variables' ] ) ||
	!isset( $GLOBALS[ 'login_modules' ][ 'saml' ] ) ||
	!isset( $GLOBALS[ 'login_modules' ][ 'saml' ][ 'Module' ] ) 
)
{
	die( '<h1>Invalid SAML configuration. Contact your administrator!</h1>' );
}

if( $args = getArgs() )
{
    // Just get the 2fa form
    if( isset( $args->get2faform ) )
    {
    	// Load the 2fa form
        if( file_exists( __DIR__ . '/templates/login2fa.html' ) )
        {
        	die( file_get_contents( __DIR__ . '/templates/login2fa.html' ) );
        }
        die( 'fail' );
    }
    // Execute 2FA login procedure
    else if( isset( $args->execute2fa ) )
    {
    	$o = new stdClass();
    	$o->Login = $args->login;
    	$o->Code = $args->code;
    	$o->AuthToken = $args->authtoken;
    	$o->DeviceId = $args->deviceid;
    	$o->Username = $args->username;
    	$o->Fullname = $args->fullname;
    	$o->MobileNumber = $args->mobilenumber;
    	$o->Password = $args->password;
    	$result = execute2fa( $o );
    	die( $result );
    }
    // Check if auth 2fa token is registered for this session
    else if( isset( $args->check2fa ) )
    {
    	die( check2faAuth( $args->auth2fatoken, $args->mobilenumber ) );
    }
}

// Fallback - and normal operation - render the form
renderSAMLLoginForm();

?>
