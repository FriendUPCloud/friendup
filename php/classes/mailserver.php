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
require_once( 'php/3rdparty/phpmailer/PHPMailerAutoload.php' );

// Define the mailserver class
class MailServer
{
	var $template = false;
	var $content = '';
	var $replyTo = '';
	var $replyToName = '';
	var $from = '';
	var $fromName = '';
	var $subject = '';
	var $recipients = [];

	function __construct()
	{
		global $Config;
	}
	
	function setSubject( $subject )
	{
		$this->subject = $subject;
	}
	
	// Sets template file
	function setTemplateFile( $template )
	{
		if( file_exists( $template ) )
		{
			$this->template = file_get_contents( $template );
			return true;
		}
		return false;
	}
	
	// Sets template string
	function setTemplate( $template )
	{
		if( strlen( $template ) )
		{
			$this->template = $template;
			return true;
		}
		return false;
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
		if( strlen( $content ) )
		{
			$this->content = $content;
			return true;
		}
		return false;
	}
	
	// Set the reply to email, with optional name
	function setReplyTo( $email, $name = false )
	{
		if( strlen( $email ) )
		{
			$this->replyTo = $email;
			if( $name ) 
				$this->replyToName = $name;
			else $this->replyToName = '';
			return true;
		}
		return false;
	}
	
	// Set the from email, with optional name
	function setFrom( $email, $name = false )
	{
		if( strlen( $email ) )
		{
			$this->from = $email;
			if( $name )
				$this->fromName = $name;
			else $this->fromName = '';
			return true;
		}
		return false;
	}
	
	// Add one or more recipients
	function addRecipients( $recipientOrRecipients )
	{
		if( is_array( $recipientOrRecipients ) )
		{
			foreach( $recipientOrRecipients as $r )
			{
				$this->recipients[] = $r;
			}
		}
		else
		{
			$this->recipients[] = $recipientOrRecipients;
		}
	}
	
	// Add one recipient
	function addRecipient( $recipient, $name = false )
	{
		if( $name )
		{
			$recipient .= ' <' . $name . '>';
		}
		$this->recipients[] = $recipient;
	}
	
	// Parses the content
	function parseContent()
	{
		// TODO: Support structured templates!
		if( $this->template )
		{
			return str_replace( '{content}', $this->content, $this->template );
		}
		return $this->content;
	}
	
	// Send the email
	function send()
	{
		global $Logger;
		
		if( !count( $this->recipients ) )
		{
			$Logger->log( '[Mailserver.Class] No recipients, no e-mails will be sent.' );
			return false;
		}
		
		$mailer = new PHPMailer;
		$mailer->setFrom( $this->from, $this->fromName );
		foreach( $this->recipients as $r )
		{
			$mailer->addAddress( $r );
		}
		$mailer->Subject = $this->subject;
		$mailer->Body = $this->parseContent();
		
		if( !$mailer->send() )
		{
			$Logger->log( '[Mailserver.Class] Could not send emails: ' . $mailer->ErrorInfo );
		}
		else 
		{
			$Logger->log( '[Mailserver.Class] Sent email to ' . count( $this->recipients ) . ' recipients.' );
		}
	}
}

?>
