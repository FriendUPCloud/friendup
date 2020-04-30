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
				
				if( $rs = $SqlDatabase->fetchObject('SELECT * FROM FUser WHERE Name = \'' . mysqli_real_escape_string($SqlDatabase->_link, urldecode( $tmp[3] ) ) . '\' OR Email = \'' . mysqli_real_escape_string($SqlDatabase->_link, urldecode( $tmp[3] ) ) . '\' ORDER BY ID ASC LIMIT 1' ) )
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

						// we have an email. build a link...
						$link = 'http';
						$link.= ( isset($cfg['Core'])&&isset($cfg['Core']['SSLEnable'])&& $cfg['Core']['SSLEnable'] == 1 ? 's' : '' ) . '://';
						$link.= $cfg['FriendCore']['fchost'] . ':' . $cfg['FriendCore']['fcport'] . '/';
						$link.= 'forgotpassword/token/';
						$link.= urlencode( str_replace('{S6}', '', $rs->Password) ) . '/';
						$link.= urlencode( $rs->Email ) . '/' . urlencode( $randomhash );
					}
					else
					{
						die( 'done1' );
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
					
					
					
					$mail->Subject = 'FriendUP password recovery';
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
							die('done2'); // . $mail->ErrorInfo
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
				
				$link = 'http';
				$link.= ( isset($cfg['Core'])&&isset($cfg['Core']['SSLEnable'])&& $cfg['Core']['SSLEnable'] == 1 ? 's' : '' ) . '://';
				$link.= $cfg['FriendCore']['fchost'] . ':' . $cfg['FriendCore']['fcport'] . '/';
				
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
				
				
				
				$mail->Subject = 'FriendUP password recovery - new password';
				$mail->Body    = $mailtemplate;
				$mail->AltBody = strip_tags($mailtemplate);
				
				$mail->addAddress( $rs->Email );
				if( $mail->send() )
				{
				
					$q = 'DELETE FROM FSetting WHERE `UserID` = '. $rs->ID .' AND `Type` = \'system\' AND `Key` = \'passwordreset\';';
					$r = $SqlDatabase->query( $q );
				
					//save it to DB as well
					$updatequery = 'UPDATE  FUser SET Password = \'{S6}'. hash('sha256', 'HASHED' . hash('sha256', $pass) ) .'\' WHERE ID = ' . $rs->ID;
					$unblockquery = 'INSERT INTO FUserLogin (`UserID`,`Login`,`Information`,`LoginTime`) VALUES ('. $rs->ID .',\''. $rs->Name .'\',\'Passwordreset\',\''. time() .'\')';
					if( $rs = $SqlDatabase->query( $updatequery ) )
					{
						$rs2 = $SqlDatabase->query( $unblockquery );
						$result = 'Your password has been changed and sent to you.';
					}
					else
					{
						$result = 'Password could not be updated in database. Please delete e-mail and try again.';
					}
				}
				else
				{
					$result = 'Could not send e-mail with new password. Please try again.';
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
			die('no no no.');
			
		}
		die('go away');
	}
	die('fail') ;
