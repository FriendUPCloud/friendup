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

	/**
		This file is used for forget password functionality.
	*/
	if( $argv[1] )
	{
		$tmp = explode('/',$argv[1]);
		
		if( isset( $tmp[2] ) && isset(  $tmp[3] ) && $tmp[2] == 'username' )
		{
			//check for user and get a mail to him out if he exists.
			$cfg = parse_ini_file( 'cfg/cfg.ini', true);
			if( $cfg && isset( $cfg['DatabaseUser'] ) )
			{
				include_once( 'classes/dbio.php' );
				$SqlDatabase = new SqlDatabase();
				if( !$SqlDatabase->Open( $cfg['DatabaseUser']['host'], $cfg['DatabaseUser']['login'], $cfg['DatabaseUser']['password'] ) )
					die( 'fail<!--separate-->Could not connect to database.' );
				$SqlDatabase->SelectDatabase( $cfg['DatabaseUser']['dbname'] );
				
				if( $rs = $SqlDatabase->fetchObject('SELECT * FROM FUser WHERE `Name` = \'' . mysqli_real_escape_string($SqlDatabase->_link, urldecode( $tmp[3] ) ) . '\' OR Email = \'' . mysqli_real_escape_string($SqlDatabase->_link, urldecode( $tmp[3] ) ) . '\' ORDER BY ID ASC LIMIT 1' ) )
				{
					$link = '';
					if( isset( $rs->ID ) && trim($rs->Email) != '' )
					{

						$randomhash = bin2hex(openssl_random_pseudo_bytes(10));
						
						//set a setting that indicates that a password reset has been requested
						$q = 'DELETE FROM FSetting WHERE `UserID` = '. $rs->ID .' AND `Type` = \'system\' AND `Key` = \'passwordreset\';';
						$r = $SqlDatabase->query( $q );
						
						
						
						$q = 'INSERT INTO FSetting (`UserID`,`Type`,`Key`,`Data`) VALUES ( '. $rs->ID .',\'system\',\'passwordreset\',\''.  mysqli_real_escape_string($SqlDatabase->_link, $randomhash ) .'\' )';
						$r = $SqlDatabase->query( $q );

						// Get some vars from config
						$fcport = $cfg['FriendCore']['fcport'];
						if( !$fcport ) $fcport = $cfg['Core']['port'];
						$host = $cfg['FriendCore']['fchost'];
						$proxy = $cfg['Core']['ProxyEnable'];
						$ssl = $cfg['Core']['SSLEnable'] ? true : false;
						// Actually create link
						$link .= ( $ssl ? 'https://' : 'http://' );
						$link .= $host;
						$link .= ( $host == 'localhost' && !$proxy ) ? $fcport : '';
						$link .= '/';
						
						$link .= 'forgotpassword/token/';
						$link .= urlencode( str_replace('{S6}', '', $rs->Password) ) . '/';
						$link .= urlencode( $rs->Email ) . '/' . urlencode( $randomhash );
					}
					else
					{
						die( 'fail' );
					}
					
					//now get mail template and out everything together
					try
					{
						$mailtemplate = file_get_contents('./resources/webclient/templates/mail_forgotpassword.html');
					}
					catch(Exception $e)	
					{
						$mailtemplate = $link;
					}

					$mailtemplate = str_replace([
						'{user}',
						'{passwordreseturl}',
						'{username}'
						
					], [
						htmlentities( $rs->FullName != '' ? $rs->FullName : $rs->Name),
						$link,
						htmlentities( $rs->Name )
					], $mailtemplate);
					
					include_once('3rdparty/phpmailer/class.phpmailer.php');
					include_once('3rdparty/phpmailer/class.smtp.php');
					$mail = new PHPMailer();
					//$mail->SMTPDebug = SMTP::DEBUG_SERVER;
					$mail->isSMTP();       // Set mailer to use SMTP
					$mail->Port = isset( $cfg['Mail']['port'] ) ? intval( $cfg['Mail']['port'] ) :  587; 
					$mail->Host = $cfg['Mail']['host']; 					 // Specify main and backup SMTP servers
					$mail->SMTPAuth = true;                               // Enable SMTP authentication
					$mail->Username = $cfg['Mail']['user'];                 // SMTP username
					$mail->Password = $cfg['Mail']['pass'];                           // SMTP password
				
					$mail->From = $cfg['Mail']['from'];
					$mail->FromName = $cfg['Mail']['fromname'];
					$mail->CharSet = 'UTF-8';
					$mail->isHTML(true); 
					
					
					$subject = $cfg['Mail']['subject'] ? $cfg['Mail']['subject'] : 'FriendOS Password Recovery';
					$mail->Subject = $subject;
					$mail->Body    = $mailtemplate;
					$mail->AltBody = strip_tags($mailtemplate);
					
					$mail->addAddress( $rs->Email );
			
			
					try {
						
						if( $mail->send() )
						{
							die('ok');
						}
						else
						{
							die('done2<!--separate-->'. $mail->ErrorInfo );
						}
										
					} catch (phpmailerException $e) {
						echo $e->errorMessage(); //Pretty error messages from PHPMailer
					} catch (Exception $e) {
						echo $e->getMessage(); //Boring error messages from anything else!
					}
					die();
				}
				die( 'done3' );
			}
		}
		else if( isset( $tmp[2] ) && isset(  $tmp[3] ) && $tmp[2] == 'token' && isset( $tmp[4] ) && isset( $tmp[5] ) )
		{
			
			/*
				here we expect the user to have clicked the link that we built and sent via mail above
				first we check that everythgin is available, then we check that all of it makes sense and then we reset the password and make a note to the FUsserLogin table in case the account was blocked...	
			*/
			$mail = urldecode($tmp[4]);
			$hash = urldecode($tmp[3]);
			$token = urldecode($tmp[5]);
			
			$cfg = parse_ini_file( 'cfg/cfg.ini', true);
			if( !( $cfg && isset( $cfg['DatabaseUser'] ) ) ) die('no db?');
			
			include_once( 'classes/dbio.php' );
			$SqlDatabase = new SqlDatabase();
			if( !$SqlDatabase->Open( $cfg['DatabaseUser']['host'], $cfg['DatabaseUser']['login'], $cfg['DatabaseUser']['password'] ) )
				die( 'fail<!--separate-->Could not connect to database.' );
			$SqlDatabase->SelectDatabase( $cfg['DatabaseUser']['dbname'] );	
		
			$query = 'SELECT * FROM FUser WHERE Email = \'' . mysqli_real_escape_string($SqlDatabase->_link, $mail ) . '\' AND Password = \'{S6}'. mysqli_real_escape_string( $SqlDatabase->_link, $hash ) .'\' AND ID = (SELECT UserID FROM FSetting WHERE `Type` = \'system\' AND `Key` = \'passwordreset\' AND `Data` = \''. mysqli_real_escape_string( $SqlDatabase->_link, $token ) .'\' )';
			
			if( $rs = $SqlDatabase->fetchObject( $query ) )
			{
				//generate a new password and set it for this user.
				$words01 = [ 'Friend','Tree','Amiga'   ,'Rock','Stone'  ,'Sun' ,'Winter','Spring','Floor','Horse',  'Wall' ];
				$words02 = [ 'Liquid','Easy','Friendly','Up'  ,'Forward','Moon','Yellow','Green' ,'Red',  'Orange', 'Blue' ];
				
				$pass = '';
				for( $i = 0; $i < 4; $i++ )
				{
					$chosen = mt_rand( 0, 10 );
					$pass.= ( $i % 2 == 0 ? $words01[ $chosen ] : $words02[ $chosen ] );
					if( $i == 2 ) $pass.= mt_rand( 10, 99 );
				}
				
				// Create link
				$link = '';
				// Get some vars from config
				$fcport = $cfg['FriendCore']['fcport'];
				if( !$fcport ) $fcport = $cfg['Core']['port'];
				$host = $cfg['FriendCore']['fchost'];
				$proxy = $cfg['Core']['ProxyEnable'];
				$ssl = $cfg['Core']['SSLEnable'] ? true : false;
				// Actually create link
				$link .= ( $ssl ? 'https://' : 'http://' );
				$link .= $host;
				$link .= ( $host == 'localhost' && !$proxy ) ? $fcport : '';
				$link .= '/';
				
				//now get mail template and out everything together
				try
				{
					$mailtemplate = file_get_contents('./resources/webclient/templates/mail_newpasswordmail.html');
				}
				catch(Exception $e)	
				{
					$mailtemplate = $pass;
				}

				$mailtemplate = str_replace([
					'{user}',
					'{newpassword}',
					'{loginurl}'
				], [
					htmlentities($rs->Name),
					$pass,
					$link
				], $mailtemplate);
				
				include_once('3rdparty/phpmailer/class.phpmailer.php');
				include_once('3rdparty/phpmailer/class.smtp.php');
				$mail = new PHPMailer();
				$mail->isSMTP();                                      // Set mailer to use SMTP
				$mail->Port = isset( $cfg['Mail']['port'] ) ? intval( $cfg['Mail']['port'] ) :  587; 
				$mail->Host = $cfg['Mail']['host']; 					 // Specify main and backup SMTP servers
				$mail->SMTPAuth = true;                               // Enable SMTP authentication
				$mail->Username = $cfg['Mail']['user'];                 // SMTP username
				$mail->Password = $cfg['Mail']['pass'];                           // SMTP password
			
				$mail->From = $cfg['Mail']['from'];
				$mail->FromName = $cfg['Mail']['fromname'];
				$mail->CharSet = 'UTF-8';
				$mail->isHTML(true); 
				
				//save it to DB as well
				if( isset( $cfg['ServiceKeys']['AdminModuleServerToken'] ) )
				{
					require_once( 'php/include/helpers.php' );
					
					$d = array();
					$d[ 'username' ] = $rs->Name;
					$d[ 'password' ] = '{S6}' . hash( 'sha256', 'HASHED' . hash( 'sha256', $pass ) );
					$result = FriendCoreQuery( '/system.library/user/updatepassword', $d, 'POST', false, false, true );
					if( $result && substr( $result, 0, 3 ) == 'ok<' )
					{
						$mail->Subject = isset( $cfg['Mail']['recover_subject'] )?$cfg['Mail']['recover_subject']:'Friend OS password recovery - new password';
						$mail->Body    = $mailtemplate;
						$mail->AltBody = strip_tags($mailtemplate);
				
						$mail->addAddress( $rs->Email );
						if( $mail->send() )
						{
							$q = 'DELETE FROM FSetting WHERE `UserID` = '. $rs->ID .' AND `Type` = \'system\' AND `Key` = \'passwordreset\';';
							$r = $SqlDatabase->query( $q );
				
							$unblockquery = 'INSERT INTO FUserLogin (`UserID`,`Login`,`Information`,`LoginTime`) VALUES ('. $rs->ID .',\''. $rs->Name .'\',\'Passwordreset\',\''. time() .'\')';
							$rs2 = $SqlDatabase->query( $unblockquery );
					
							// Completion
							$tpl = file_get_contents( 'php/templates/password_change.html' );
							die( $tpl );
						}
						else
						{
							$result = 'Could not send e-mail with new password. Please try again.';
						}
					}
				}				
				
				//now get mail template and out everything together
				try
				{
					$output = file_get_contents('./resources/webclient/templates/mail_resetconfirmation.html');
				}
				catch(Exception $e)	
				{
					$output = $result;
				}
				if( $output == $result ) die( $output );
				
				//set result into output and call it a day.
				$output = str_replace([
					'{result}'
				], [
					$result
				], $output);
				die($output);
			}
			die('You already renewed your password.');
			
		}
		die('You already renewed your password.');
	}
	die('fail') ;
?>
