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
	
	v0.1
	
	Note that login modules are not normal modules as no user is present.
	This file should be included by php/login.php and expects some global 
	variables to be set.

*/

include( 'include/helpers.php' );

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

/*if( $args = getArgs() )
{
    // Just get the 2fa form
    if( isset( $args->get2faform ) )
    {
        die( 'Get 2fa form.' );
    }
    // Check if auth 2fa token is registered for this session
    else if( isset( $args->check2fa ) )
    {
    	die( 'Checking 2fa.' );
    }
}*/

// Fallback - and normal operation - render the form
renderSAMLLoginForm();

?>
