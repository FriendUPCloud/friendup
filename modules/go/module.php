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

include_once( 'php/friend.php' );
include_once( 'php/classes/file.php' );

global $Config;

if( !isset( $User ) || ( $User && ( !isset( $User->ID ) || !$User->ID ) ) || !is_object( $User ) )
{
	die( 'fail<!--separate-->{"response":"user did not authenticate. system module. Argv[1]: ' . $argv[1] . '"}' );
}

// Make sure we have subscribers table
$t = new dbTable( 'UserQuarantine' );
if( !$t->load() )
{
	$SqlDatabase->query( 'CREATE TABLE UserQuarantine ( 
		ID bigint(20) NOT NULL auto_increment PRIMARY KEY,
		Fullname varchar(255),
		Password varchar(255),
		Email varchar(255),
		ConfirmCode varchar(255),
		UserID bigint(20) NOT NULL default 0
	)' );
}

switch( $args->command )
{
	// Get that google captcha key
	case 'captcha':
		$rawConfig = parse_ini_file( 'cfg/cfg.ini', true );
		$key = '';
		if( $rawConfig[ 'RecaptchaAPI' ] )
		{
			die( 'ok<!--separate-->{"response":1,"captcha":"' . $rawConfig[ 'RecaptchaAPI' ][ 'captchakey' ] . '"}' );
		}
		die( 'fail<!--separate-->' );
		break;
	// Verify that captcha with google
	case 'captchaverify':
		$rawConfig = parse_ini_file( 'cfg/cfg.ini', true );
		$key = '';
		if( $rawConfig[ 'RecaptchaAPI' ] )
		{
			if( $args->args->response )
			{
				$vurl = 'https://www.google.com/recaptcha/api/siteverify';
				$vars = array( 
					'secret' => $rawConfig[ 'RecaptchaAPI' ][ 'captchakey_secret' ],
					'response' => $args->args->response
				);
				$c = curl_init();
				curl_setopt( $c, CURLOPT_SSL_VERIFYPEER, false               );
				curl_setopt( $c, CURLOPT_POST, false                         );
				curl_setopt( $c, CURLOPT_SSL_VERIFYHOST, false               );
				curl_setopt( $c, CURLOPT_URL,            $vurl               );
				curl_setopt( $c, CURLOPT_POSTFIELDS,     $vars               );
				curl_setopt( $c, CURLOPT_RETURNTRANSFER, true                );
				curl_setopt( $c, CURLOPT_EXPECT_100_TIMEOUT_MS, false        );
				$fc = curl_exec( $c );
				curl_close( $c );
				
				if( $r = json_decode( $fc ) )
				{
					if( $r->success )
					{
						die( 'ok<!--separate-->{"response":1,"result":"' . $args->args->response . '"}' );
					}
				}
			}
		}
		die( 'fail<!--separate-->' );
		break;
	case 'signupemailconfirmation':
		$d = new dbIO( 'UserQuarantine' );
		$d->Email = $args->args->email;
		$d->Load();
		$d->Fullname = $args->args->name;
		$d->Password = $args->args->password;
		
		// Build confirm code
		$code = date( 'YmdHis' ) . rand( 0, 99999 ) . rand( 0, 99999 ) . $args->args->name . $args->args->email;
		$hash = '';
		for( $a = 0; $a < strlen( $code ); $a++ )
		{
			$hash += ( ord( $code{$a} ) * $a ) << 8; 
		}
		$hash = dechex( $hash );
		
		$d->ConfirmCode = $hash;
		$d->UserID = 0;
		$d->Save();
		
		// E-mail template
		$template = file_get_contents( 'resources/webclient/templates/about_go_email_confirmcode.html' );
		$template = str_replace(
			array( '{subject}', '{code}', '{privacylink}', '{github}' ),
			array( 'Your Friend account confirmation code', $hash, 'https://friendup.cloud/privacy.html', 'https://github.com/friendupcloud/friendup/' ),
			$template
		);
		$result = mail( $args->args->email, 'Your Friend account confirmation code', $template, 'Content-type: text/html; charset=utf-8', '-fsupport@friendup.cloud -FFriendUP' );
		
		$rawConfig = parse_ini_file( 'cfg/cfg.ini', true );
		$key = '';
		if( $rawConfig[ 'RecaptchaAPI' ] )
		{
			$key = $rawConfig[ 'RecaptchaAPI' ][ 'captchakey' ];
		}
		
		die( 'ok<!--separate-->{"response":2,"message":"You got your verification e-mail.","captcha":"' . $key . '"}' );
		
	case 'confirmcode':
		$d = new dbIO( 'UserQuarantine' );
		$d->ConfirmCode = $args->args->code;
		if( $d->Load() )
		{
			if( $d->ID > 0 && trim( $d->ConfirmCode ) && $d->ConfirmCode == $args->args->code )
			{
				// Create a Friend user!
				
				$rawConfig = parse_ini_file( 'cfg/cfg.ini', true );
				$key = '';
				if( !$rawConfig[ 'Security' ] && !$rawConfig[ 'Security' ][ 'access_node' ] )
				{
					die( 'fail<!--separate-->{"response":0,"message":"No access node defined."}' );
				}
				
				$cEntry = new stdClass();
				foreach( $rawConfig[ 'Security' ] as $k=>$v )
					$cEntry->$k = $v;
				
				if( 
					!$cEntry->access_node || 
					!$cEntry->access_node_sql_host || 
					!$cEntry->access_node_sql_base || 
					!$cEntry->access_node_sql_user ||
					!$cEntry->access_node_sql_pass
				)
				{
					die( 'fail<!--separate-->{"response":0,"message":"Missing entries.","entry":' . json_encode( $cEntry ) . '}' );
				}
				
				$newBase = new SqlDatabase();
				if( !$newBase->Open( $cEntry->access_node_sql_host, $cEntry->access_node_sql_user, $cEntry->access_node_sql_pass ) )
					die( 'fail<!--separate-->Could not connect to database.' );
				$newBase->SelectDatabase( $cEntry->access_node_sql_base );
				
				$u = new dbIO( 'FUser', $newBase );
				$u->Name = $d->Email;
				if( !$u->Load() )
				{
					$u->FullName = $d->Fullname;
					$u->Password = $d->Password;
					$u->Email = $d->Email;
					$u->Save();
				
					if( isset( $u->ID ) && $u->ID > 0 )
					{
						$g = new dbIO( 'FUserGroup', $newBase );
						$g->Name = 'User';
						if( $g->Load() )
						{
							// Connect user to group
							$newBase->query( 'INSERT INTO FUserToGroup ( UserID, UserGroupID ) VALUES ( ' . $u->ID . ', ' . $g->ID . ' )' );
							
							// E-mail template
							$template = file_get_contents( 'resources/webclient/templates/about_go_email_registered.html' );
							$template = str_replace(
								array( '{subject}', '{email}', '{address}', '{privacylink}', '{github}' ),
								array( 'Your Friend account', $d->Email, $rawConfig[ 'Security' ][ 'access_node' ], 'https://friendup.cloud/privacy.html', 'https://github.com/friendupcloud/friendup/' ),
								$template
							);
							
							mail( $d->Email, 'Your Friend account', $template, 'Content-type: text/html; charset=utf-8', '-fsupport@friendup.cloud -FFriendUP' );
							
							$newBase->close();
							die( 'ok<!--separate-->{"response":1,"message":"Your code: ' . $d->ConfirmCode . ', was confirmed."}' );
						}
						else
						{
							$logger->log( 'fail<!--separate-->' );
							$newBase->close();
							die( 'fail<!--separate-->' );
						}
					}
				}
				// There is already such a user
				else
				{
					$logger->log( 'fail<!--separate-->{"response":3,"message":"This user account is already taken."}' );
					$newBase->close();
					die( 'fail<!--separate-->{"response":3,"message":"This user account is already taken."}' );
				}
				$newBase->close();
			}
		}
		die( 'fail<!--separate-->' . $code );
		die( 'fail<!--separate-->{"response":0,"message":"Your code was not found."}' );
}

die( 'fail<!--separate-->{"response":0,"message":"Your request was not understood."}' );

?>
