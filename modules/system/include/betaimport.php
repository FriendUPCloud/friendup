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

// small script to list our beta users---
// hardcoded fetch URL
global $SqlDatabase, $User, $Logger, $args;	

//$Logger->log( 'BETAIMPORT command callsesd' .  );
if($args->command == 'userbetamail')
{
	//send mail to user
	include_once('php/3rdparty/phpmailer/class.phpmailer.php');
	include_once('php/3rdparty/phpmailer/class.smtp.php');
	
	$mail = new PHPMailer();
	$mailbody = '<html><head><title></title><meta http-equiv="content-type" content="text/html; charset=UTF-8"></meta><style>body { font-family:Lata, Helvetica, Verdana, sans-serif; background:#FFF; color:#000; padding:20px; }</style></head><body>';	
	$mailbody.= '<p><b>Hi '. $args->args->FullName .',</b></p>';
	$mailbody.= '';
	$mailbody.= '<p>Congratulations and welcome to your account in ​the Friend​ public beta program.<br />';
	$mailbody.= 'Please choose your closest access node and log in here:</p>';
	$mailbody.= '<p>US/Canada: <a href="https://us.openfriendup.net/webclient/index.html">https://us.openfriendup.net/webclient/index.html</a></p>';
	$mailbody.= '<p>EU: <a href="https://friendsky.cloud/webclient/index.html">https://friendsky.cloud/webclient/index.html</a></p>';
	$mailbody.= '<p>Australia/New Zealand: <a href="https://au.openfriendup.net/webclient/index.html">https://au.openfriendup.net/webclient/index.html</a></p>';
	$mailbody.= '<p>Username: '. $args->args->Name .'<br />';
	$mailbody.= 'Password: '. $args->args->PlainTextPassword .'</p>';
	$mailbody.= '<p>As this is our very first beta program, the change password functionality is not yet in place. So please keep this email as reference to your unique password.</p>';
	$mailbody.= '';
	$mailbody.= '<h4>​A few important notes:</h4>';
	$mailbody.= '<ul>';
	$mailbody.= '<li>​We will keep you posted on the progress with our beta.</li>';
	$mailbody.= '';
	$mailbody.= '<li>​A​s this is a beta, please keep in mind not to put critical information onto the beta server.</li>';
	$mailbody.= '';
	$mailbody.= '<li>​All aspects of the solution are in development and the server might be unavailable at times.</li>';
	$mailbody.= '';
	$mailbody.= '<li>We are establishing a user forum and FAQ section, and will send a link to these as soon as they are ready.</li>';
	$mailbody.= '</ul>';
	$mailbody.= '';
	$mailbody.= '<p>​Friendly regards,</p>';
	$mailbody.= '';
	$mailbody.= '<p><i>The team at Friend Software Labs</i><br />beta@friendos.com</p>';
	

	#$mailbody.= '<p>PS. As we are adding necessary SSL functionality in FriendCore right now, the link above routes through an Apache proxy. This makes the solution appear a bit slower - we are working hard to give you native Friend speed as soon as we can.</p>';
	$mailbody.= '<p>You are receiving this mail ('.$args->args->Email.') because it has been used to register a user for our beta programme. If you did not register yourself please ignore this mail and kindly give us a notice that you do not want to participate.</p>';
	
	$mailbody.= '</body></html>';
	
	
	//$mail->SMTPDebug = 3;                               // Enable verbose debug output
	
	$mail->isSMTP();                                      // Set mailer to use SMTP
	$mail->Host = '193.93.255.143'; 					 // Specify main and backup SMTP servers
	$mail->SMTPAuth = true;                               // Enable SMTP authentication
	$mail->Username = 'beta@friendos.com';                 // SMTP username
	$mail->Password = 'betaFriendCarGr33nHorseAmiga';                           // SMTP password

	$mail->From = 'beta@friendos.com';
	$mail->FromName = 'FriendUP Beta Program';
	$mail->CharSet = 'UTF-8';
	$mail->isHTML(true); 
	
	
	
	$mail->Subject = 'Your FriendUP beta program registration';
	$mail->Body    = $mailbody;
	$mail->AltBody = strip_tags($mailbody);
	
	$mail->addAddress( $args->args->Email );
	if( $mail->send() )
	{
		die('ok<!--separate-->Mail to user '. $args->args->Email .' has been send');
	}
	else
	{
		die('ok<!--separate-->ERROR ### NO MAIL TO USER '. $args->args->Email .' HAS BEEN SEND ###');
	}
}
else if( $args->command == 'listbetausers' )
{
	
	//load list
	$betalist = file_get_contents('https://friendup.cloud/export-demorequests-new-touch/');
	$rows = $SqlDatabase->FetchArray( 'SELECT DISTINCT Email FROM FUser s ORDER BY s.Email ASC' );
	
	if( $betalist && $rows )
	{

		$list = json_decode($betalist);
		
		for( $i = 0; $i < count( $rows ); $i++ )
			$rows[$i] = $rows[$i]['Email'];
		
		$newlist = array();
		
		//$Logger->log('Our betalist: ' );
		//$Logger->log( $betalist );

		 
		for( $i = 0; $i < count($list); $i++ )
		{
			
			//$Logger->log('In? ' + print_r( $list[$i],1  ) .'.:.' . print_r($rows,1) );
			
			if( !in_array($list[$i]->email, $rows ) )
			{
				$newlist[] = $list[$i];
			}
			else
			{
				$Logger->log('We alrady have a user with mailadress ' . $list[$i]->email);
			}
			
		}

		die( 'ok<!--separate-->'. json_encode($newlist) );
	}
	else
	 die('fail<!--separate-->could not load betalist or user list');		
	
}

?>
