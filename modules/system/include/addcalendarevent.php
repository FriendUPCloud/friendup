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

global $User, $Logger, $SqlDatabase;

// Just include our mailer!
include_once( 'php/classes/dbio.php' );
include_once( 'php/classes/mailserver.php' );

// Create FSFile table for managing doors
$t = new DbTable( 'FCalendar' );
if( !$t->load() )
{
	$SqlDatabase->query( '
	CREATE TABLE `FCalendar` (
	 `ID` bigint(20) NOT NULL AUTO_INCREMENT,
	 `CalendarID` bigint(20) NOT NULL default \'0\',
	 `UserID` bigint(20) NOT NULL DEFAULT \'0\',
	 `Title` varchar(255) DEFAULT NULL,
	 `Type` varchar(255) NOT NULL,
	 `Description` text NOT NULL,
	 `TimeFrom` varchar(255) DEFAULT NULL,
	 `TimeTo` varchar(8) DEFAULT NULL,
	 `Date` varchar(255) DEFAULT NULL,
	 `Source` varchar(255) NOT NULL,
	 `MetaData` text NOT NULL default \"\",
	 `RemoteID` varchar(255) NOT NULL,
	 PRIMARY KEY (`ID`)
	)
	' );
}

if( is_object( $args->args->event ) )
{
	$o = new DbIO( 'FCalendar' );
	$o->Title = $args->args->event->Title;
	$o->Description = $args->args->event->Description;
	$o->TimeTo = $args->args->event->TimeTo;
	$o->TimeFrom = $args->args->event->TimeFrom;
	$o->Date = $args->args->event->Date;
	$o->UserID = $User->ID;
	$o->Type = 'friend';
	$o->Source = 'friend';
	$o->Save();
	
	// Participant support!
	if( isset( $args->args->event->Participants ) )
	{
		$Logger->log( 'Starting with our mailer.' );
		
		$timeto = date( 'Y-m-d H:i:s', strtotime( $o->TimeTo ) );
		$timefrom = date( 'Y-m-d H:i:s', strtotime( $o->TimeFrom ) );
	
		$mail = new Mailer();
		
		$Logger->log( 'Mailer instantiated!' );
		
		$mail->setSubject( 'Invite to participate in meeting' );
		$mail->setFrom( 'info@friendos.com', 'Friend Software Corporation' );
		
		$Logger->log( 'Setting content!' );
		
		$mail->setContent( "" . 
			"Hey! Just testing this e-mail!\n" . 
			"\n" . 
			"Meet on:\n" . 
			"\t" . $timefrom . " till " . $timeto . "\n" . 
			"\n" . 
			"See you there or be square!\n"
		);

		$parts = explode( ',', $args->args->event->Participants );
		foreach( $parts as $part )
		{
			$cid = intval( trim( $part ), 10 );
			$con = new dbIO( 'FContact' );
			$con->Load( $cid );
			
			// Check participant!
			$Logger->log( 'Preparing to add participation record.' );
			if( $con->ID && $con->Email )
			{
				$Logger->log( 'Adding participation record.' );
				$p = new dbIO( 'FContactParticipation' );
				$p->ContactID = $cid;
				$p->EventID = $o->ID;
				$p->Load();
				$p->Time = date( 'Y-m-d H:i:s' ); // When added!
				$p->Token = hash( 'sha256', strtotime( $p->DateTime ) . rand(0,9999) . rand(0,9999) );
				$p->Message = '';
				$p->Save();
				
				// Successful save!
				if( $p->ID > 0 )
				{
					$name = $con->Firstname && $con->Lastname ? ( $con->Firstname . ' ' . $con->Lastname ) : false;
					$Logger->log( 'Adding recipient: ' . $con->Email . ' -> ' . $name );
					$mail->addRecipient( $con->Email, $name );
				}
			}
		}
		
		// Send the invite mail!
		$Logger->log( 'Trying to send email.' );
		$mail->send();
	}

	if( $o->ID > 0 ) die( 'ok<!--separate-->{"ID":"' . $o->ID . '"}' );
}
die( 'fail' );

?>
