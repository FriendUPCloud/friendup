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

global $User, $SqlDatabase, $args, $Logger;

include( 'php/friend.php' );

$cypthdb = false;

if( isset( $args->command ) )
{
	switch( $args->command )
	{				
		// make sure we have what we need to run FriendMail app that uses Cypth 
		case 'initfriendmail':
			include( 'modules/mail/include/friendmail.php' );
			break;			

		
		
		
		
		
		// #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### ---
		// #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### ---
		// #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### ---
		// #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### ---
		// #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### ---
		// #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### ---
		// #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### ---
		
		// OLD MAILAPP STUFF BELOWE
		
		// #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### --- #### ---
		case 'init':
			// 1. Check database
			$t = new DbTable( 'FMail' );
			if( !$t->load() )
			{
				$SqlDatabase->Query( '
					CREATE TABLE `FMail` (
					 `ID` bigint(20) NOT NULL AUTO_INCREMENT,
					 `UserID` bigint(20) NOT NULL,
					 `Address` varchar(255) NOT NULL,
					 `Server` varchar(255) NOT NULL,
					 `Port` int(11) NOT NULL,
					 `Username` varchar(255) NOT NULL,
					 `Password` varchar(255) NOT NULL,
					 `Folder` varchar(255) NOT NULL,
					 `OutServer` varchar(255) NOT NULL,
					 `OutPort` varchar(255) NOT NULL,
					 `OutUser` varchar(255) NOT NULL,
					 `OutPass` varchar(255) NOT NULL,
					 `SortOrder` int(11) NOT NULL,
					 PRIMARY KEY (`ID`)
					)
				' );
			}
			
			// 2. Check database for mail header buffer
			$t = new DbTable( 'FMailHeader' );
			if( !$t->load() )
			{
				$SqlDatabase->Query( '
					CREATE TABLE `FMailHeader` (
					 `ID` bigint(20) NOT NULL AUTO_INCREMENT,
					 `UserID` bigint(20) NOT NULL,
					 `ExternalMessageID` bigint(20) NOT NULL,
					 `Address` varchar(255) NOT NULL,
					 `Date` datetime,
					 `Subject` varchar(255) NOT NULL,
					 `From` varchar(255) NOT NULL,
					 `ReplyTo` varchar(255) NOT NULL,
					 `To` varchar(255) NOT NULL,
					 `IsRead` tinyint(4) NOT NULL default \'0\',
					 PRIMARY KEY (`ID`)
					)
				' );
			}
			
			// 3. Check database for mail outgoing
			$t = new DbTable( 'FMailOutgoing' );
			if( !$t->load() )
			{
				$SqlDatabase->Query( '
					CREATE TABLE `FMailOutgoing` (
					 `ID` bigint(20) NOT NULL AUTO_INCREMENT,
					 `UserID` bigint(20) NOT NULL,
					 `Date` datetime,
					 `Subject` varchar(255) NOT NULL,
					 `Content` text NOT NULL,
					 `Attachments` text NOT NULL,
					 `From` varchar(255) NOT NULL,
					 `To` varchar(255) NOT NULL,
					 `IsSent` tinyint(4) NOT NULL default \'0\',
					 PRIMARY KEY (`ID`)
					)
				' );
			}
			
			// 4. Check settings
			$mail = new dbIO( 'FMail' );
			$mail->UserID = $User->ID;
			if( $mail = $mail->find() )
			{
				$r = [];
				foreach( $mail as $m )
				{
					$r[] = $m->Name;
				}
				die( 'ok<!--separate-->' . json_encode( $r ) );
			}
			die( 'fail' );
		
			break;
		case 'addaccount':
			// Make sure we have everything
			$required = [
				'email', 'inserver', 'inport', 'inuser', 'inpass', 
				'outserver', 'outport', 'outuser', 'outpass'
			];
			foreach( $required as $req ) if( !isset( $args->args->{$req} ) ) die( 'fail<!--separate-->Missing data' );
			
			// Save the account
			$o = new dbIO( 'FMail' );
			$o->UserID = $User->ID;
			$o->Address = $args->args->email;
			$o->Server = $args->args->inserver;
			$o->Port = $args->args->inport;
			$o->Username = $args->args->inuser;
			$o->Password = $args->args->inpass;
			$o->OutServer = $args->args->outserver;
			$o->OutPort = $args->args->outport;
			$o->OutUser = $args->args->outuser;
			$o->OutPass = $args->args->outpass;
			$o->Save();
			if( $o->ID )
			{
				die( 'ok' );
			}
			break;
		case 'listaccounts':
			
			if( $rows = $SqlDatabase->FetchObjects( '
				SELECT * FROM FMail WHERE UserID=\'' . $User->ID . '\'
			' ) )
			{
				$out = [];
				foreach( $rows as $row )
				{
					$o = new stdClass();
					$o->Name = $row->Address;
					$out[] = $o;
				}
				die( 'ok<!--separate-->' . json_encode( $out ) );
			}
			die( 'fail' );
		
		case 'accountfolders':
			include( 'modules/mail/include/accountfolders.php' );
			break;
		
		// Load inbox for verification
		case 'folder':
			include( 'modules/mail/include/folder.php' );
			break;
		
		// Get a mail header and store it
		case 'mailheader':
			include( 'modules/mail/include/mailheader.php' );
			break;
		
		// Checks if we have stored headers
		case 'checkstorage':
			include( 'modules/mail/include/checkstorage.php' );
			break;
		
		// Read an email
		case 'read':
			include( 'modules/mail/include/read.php' );
			break;

				
	}
}


die( 'fail' );


?>
