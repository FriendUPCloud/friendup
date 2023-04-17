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
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'php/3rdparty/phpmailer6/Exception.php';
require 'php/3rdparty/phpmailer6/PHPMailer.php';
require 'php/3rdparty/phpmailer6/SMTP.php';

// Define the mailserver class
class Mailer
{
	var $template = false;
	var $content = '';
	var $replyTo = '';
	var $replyToName = '';
	var $from = '';
	var $fromName = '';
	var $subject = '';
	var $recipients = [];
	var $attachments = [];

	function __construct( $extconfig = false )
	{
		global $Config, $configfilesettings;
		if( $extconfig )
			$this->config = $extconfig;
		else if( isset( $configfilesettings ) )
			$this->config = $configfilesettings;
		else if( isset( $Config ) )
			$this->config = $Config;
	}
	
	// Just set the subject
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
	
	// Validate email domain MX record
	function validateMX( $emails = false )
	{
		if( $emails && !is_array( $emails ) )
		{
			$emails = [ $emails ];
		}
		
		if( !$emails && $this->recipients )
		{
			$emails = $this->recipients;
		}
		
		if( $emails )
		{
			$checked = [];
			
			foreach( $emails as $email )
			{
				if( filter_var( trim( $email ), FILTER_VALIDATE_EMAIL ) )
				{
					$domain = array_pop( explode( "@", trim( $email ) ) );
					
					if( !isset( $checked[ $domain ] ) && !checkdnsrr( $domain, "MX" ) )
					{
						return false;
					}
					
					$checked[ $domain ] = true;
				}
				else
				{
					return false;	
				}
			}
		
			return true;
		}
		
		return false;
	}
	
	// Content is string
	// filename is string
	// encoding e.g. base64
	// mimetype e.g. text/calendar (string)
	function addStringAttachment( $content, $filename, $encoding, $mimetype )
	{
		$a = new stdClass();
		$a->type = 'string';
		$a->content = $content;
		$a->filename = $filename;
		$a->encoding = $encoding;
		$a->mimetype = $enctype;
		$this->attachments[] = $a;
	}
	
	// Content is string
	// filename is string
	// encoding e.g. base64
	// mimetype e.g. text/calendar (string)
	function addAttachment( $file, $filename, $encoding = false, $mimetype = false )
	{
		$a = new stdClass();
		$a->type = 'file';
		$a->content = $content;
		$a->filename = $filename;
		$a->encoding = $encoding;
		$a->mimetype = $enctype;
		$this->attachments[] = $a;
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
		global $Logger, $Config, $configfilesettings;
		
		if( count( $this->recipients ) < 1 )
		{
			return false;
		}
		
		$mailer = new PHPMailer();
		foreach( $this->recipients as $r )
		{
			if( strstr( $r, '<' ) )
			{
				$cand = explode( '<', $r );
				$email = trim( $cand[ 0 ] );
				$name = str_replace( '>', '', $cant[ 1 ] );
				$mailer->addAddress( $email, $name );
			}
			else $mailer->addAddress( $r );
		}
		
		if( isset( $this->Ical ) )
		{
			$mailer->Ical = $this->Ical;;
		}
		
		$mailer->Body = $this->parseContent();
		$mailer->AltBody = strip_tags( str_replace( '<br>', "\n", $mailer->Body ) );
			
		$mailer->Subject = $this->subject;
		
		// Test if the content is HTML
		if( $this->isHTML || strstr( $mailer->Body, '<' ) > 0 )
			$mailer->isHTML( true );
		
		// Use the mail server setting for sending the e-mail

		if( isset( $this->config[ 'FriendMail' ] ) )
		{
			$cnf = $this->config[ 'FriendMail' ];
			$mailer->isSMTP();
			$mailer->SMTPDebug = isset( $this->debug ) ? $this->debug : 0;
			$mailer->SMTPAuth    = true;
			$mailer->Username    = $cnf[ 'friendmail_user' ];
			$mailer->Password    = $cnf[ 'friendmail_pass' ];
			$mailer->Port        = intval( $cnf[ 'friendmail_port' ], 10 );
			
			$from = isset( $cnf[ 'friendmail_from' ] ) ? $cnf[ 'friendmail_from' ] : $cnf[ 'friendmail_user' ];
			
			if( isset( $cnf[ 'friendmail_name' ] ) )
			{
				$mailer->setFrom(  $from, $cnf[ 'friendmail_name' ] );
			}
			else
			{
				$mailer->setFrom(  $from );
			}
			if( isset( $cnf[ 'friendmail_pcol' ] ) )
			{
				$mailer->SMTPSecure = $cnf[ 'friendmail_pcol' ];
				$mailer->Host        = gethostbyname( $mailer->SMTPSecure . 
										'://' . $cnf[ 'friendmail_host' ] );
			}
			else
			{
				$mailer->Host        = $cnf[ 'friendmail_host' ];
			}
			$mailer->Timeout     = 10; // Ten seconds timeout.
		}
		else
		{
			$mailer->setFrom( $this->from, $this->fromName );
		}
		
		if( count( $this->attachments ) > 0 )
		{
			foreach( $this->attachments as $attachment )
			{
				if( $attachment->type == 'string' )
				{
					$mailer->addStringAttachment( 
						$attachment->content,
						$attachment->filename,
						$attachment->encoding,
						$attachment->mimetype
					);
				}
				else if( $attachment->type == 'file' )
				{
					$mailer->addAttachment( 
						$attachment->content,
						$attachment->filename,
						$attachment->encoding,
						$attachment->mimetype
					);
				}
			}
		}
		
		if( !$mailer->send() )
		{
			$Logger->log( '[Mailserver.Class] Could not send emails: ' . $mailer->ErrorInfo );
			return false;
		}
		return true;
	}
}

?>
