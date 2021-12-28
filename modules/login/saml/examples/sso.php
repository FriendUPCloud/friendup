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

/*
	This file is supposed to be placed in the www directory of your 
	SimpleSAMLPHP installation.
	
	It interfaces with SimpleSAMLPHP which needs an established trust relation 
	with the identification provider.
	
	The userattribute transfer in lines 61ff will probably have to be adapted 
	from customer to customer.
	
	The other main adaptoins to be dine in this file are lines 21 and 34 - 
	the HTTP end point for this file and line 61 the auth file in the saml 
	module in friend on the machine.
*/

/*

    This is an example file using a locally installed simplesamlphp.
    It will not work when just installed.
    It ought to be modified and installed in:
    
        /var/location_of_simplesamlphp/www/saml/

    Make sure to set up your simplesamlphp to make this work!
    TODO: Nicer design of login button!

*/

define( 'SSO_BASE_URL', 'https://127.0.1.1/saml/sso.php' );
define( 'FRIEND_BASE', '/home/user/where_is_your_friend/build' );

// Test SAML stuff....

require_once( dirname(dirname(__FILE__)) . '../../lib/_autoload.php' );

$as = new SimpleSAML_Auth_Simple( 'default-sp' );

if( isset( $_REQUEST[ 'logout' ] ) )
{
	if( $as->isAuthenticated() )
	{
		$as->logout( SSO_BASE_URL );
		die( '_-_' );
	}
	else
	{
		die( '_' );
	}
}
else if( !$as->isAuthenticated() )
{
	if( isset( $_GET[ 'startauth' ] ) )
	{
	    $ar = [
		    'ReturnTo' => SSO_BASE_URL,
		    'KeepPost' => FALSE
		];
	    $as->requireAuth( $ar );
	}
	else
	{
	    die( '
<html>
    <head>
        <title>Login</title>
        <link rel="stylesheet" href="/webclient/theme/theme_compiled.css"></head><body style="padding:0; margin:0;">
		<script type="text/javascript">
			var loginwindow;
			function showLoginWindow()
			{
				var winwidth = 400; //Math.min(400, screen.availWidth);
				var winheight = 400; //Math.min(400, screen.availHeight);
				var leftpos = Math.floor( (screen.availWidth - winwidth) / 2  );
				var toppos = Math.floor( (screen.availHeight - winheight) / 2  );
				loginwindow = window.open(\'?startauth\',\'loginwindow\',\'width=\'+ ( winwidth )  +\',height=\' + ( winheight ) +\',top=\' + ( toppos ) + \',left=\' + ( leftpos ) + \'\');
			}
		</script>
		<style>
		    body
		    {
		        background: transparent;
		        color: white;
		    }
		    body > div
		    {
		        background: #225588;
		        color: white;
		        border-radius: 4px;
		        position: absolute;
		        top: 0;
		        left: 0;
		        width: 100%;
		        height: 100%;
		        padding: 20px;
		        box-sizing: border-box;
		        padding-top: 150px;
		    }
		    a
		    {
		        text-decoration: none;
		        color: white;
		        font-family: sans serif;
		        font-size: 14px;
		        font-weight: bold;
		        background: #55aadd;
		        border-radius: 5px;
		        padding: 8px 12px;
		    }
		    a:hover
		    {
		        background: #66bbee;
		    }
		</style>
    </head>
    <body>
        <div>
    		<center>
    		    <a href="javascript:showLoginWindow()">Open login window</a>
    		</center>
    	</div>
    </body>
</html>
	    ' );
	}		
}
else
{
	include_once( FRIEND_BASE . '/modules/login/saml/auth.php' );
	
	$authdata = [];
	$authIdP = $as->getAuthData( 'saml:sp:IdP' ); // used again for meta
	$authdata[ 'saml:sp:IdP' ] = $authIdP;
	$authdata[ 'saml:sp:NameID' ] = $as->getAuthData( 'saml:sp:NameID' );
	$authdata[ 'saml:sp:SessionIndex' ] = $as->getAuthData( 'saml:sp:SessionIndex' );
	
	$meta = SimpleSAML_Metadata_MetaDataStorageHandler::getMetadataHandler();
	$metadata = $meta->getMetaData( $authIdP, 'saml20-idp-remote' );
	
	$userdata = $as->getAttributes();
	$userid = $userdata[ 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn' ][ 0 ];
	if( isset($userdata[ 'mail' ][ 0 ] ) )
	{
        $usermail = $userdata[ 'mail' ][ 0 ];
	}
	else
	{
        $usermail = 'noreply@friendup.cloud';
    }
    
    if( isset( $userdata[ 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name' ][ 0 ] ) )
    {
        $userdisplayname = $userdata[ 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name' ][ 0 ];
	}
	else 
	{
        $userdisplayname = 'Lakse Torsk';
	}
	
	$samldata = [];
	$samldata[ 'auth' ]   = $authdata;
	$samldata[ 'meta' ]   = $metadata;
	$samldata[ 'user' ]   = $userdata;
	$samldata[ 'cookie' ] = $_COOKIE;
	
	authoriseFriendSAMLUser( $userid, $usermail, $userdisplayname, $samldata );
}

die( 'go away' );

?>
