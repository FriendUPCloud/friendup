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

// Include requirements
require_once( 'php/3rdparty/phpmailer/class.phpmailer.php' );

// Define the mailserver class
class MailServer
{
	var $template = false;
	var $content = '';
	var $replyTo = '';
	var $from = '';
	var $recipients = [];

	function __construct()
	{
		global $Config;
	}
	
	function setTemplate( $template )
	{
		
	}
	
	// Set the mail content
	// -> as a string
	// -> or as an object with
	//    - Title with {vars}
	//    - Body with {vars}
	//    - Replacements that replaces {vars}, 
	//      e.g. replacements[ 'test' => 'Testing' ] replaces body 
	//      "Hello {test}" into "Hello Testing"
	function setContent( $content )
	{
	}
	
	// Set the reply to email, with optional name
	function setReplyTo( $email, $name = false )
	{
	
	}
	
	// Set the from email, with optional name
	function setFrom( $email, $name = false )
	{
	}
	
	// Add one or more recipients
	function addRecipients( $recipientOrRecipients )
	{
	}
	
	// Send the email
	function sendMail()
	{
		
	}
}

?>
