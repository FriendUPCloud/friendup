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

global $User, $Logger, $SqlDatabase, $configfilesettings;

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
	if( isset( $args->args->MetaData ) )
	{
		$o->MetaData = $args->args->MetaData;
	}
	$o->Save();
	
	$name = $User->FullName;
	$email = $User->Email;
	
	$md = false;
	$location = '';
	if( isset( $o->MetaData ) )
	{
		$md = json_decode( $o->MetaData );
		if( isset( $md->Location ) )
			$location = $md->Location;
	}
	
	$timezone = $User->Timezone;
	
	// Participant support!
	if( isset( $args->args->event->Participants ) )
	{
		$timeto = date( 'Y-m-d H:i:s', strtotime( $o->Date . ' ' . $o->TimeTo ) );
		$timefrom = date( 'Y-m-d H:i:s', strtotime( $o->Date . ' ' . $o->TimeFrom ) );
		$utimeto = date( 'Ymd\THis', strtotime( $o->TimeTo ) );
		$utimefrom = date( 'Ymd\THis', strtotime( $o->TimeFrom ) );
	
		// TODO: Implement template support!
		/*if( isset( $configfilesettings[ 'FriendMail' ] ) &&
			isset( $configfilesettings[ 'FriendMail' ][ 'friendmail_tmpl' ] )
		)
		{
			$mail->setTemplateFile(
				$cnf = $configfilesettings[ 'FriendMail' ][ 'friendmail_tmpl' ]
			);
		}*/
		
		$parts = explode( ',', $args->args->event->Participants );
		foreach( $parts as $part )
		{
			$mail = new Mailer();
			$mail->isHTML = true;
			$mail->setSubject( $o->Title );
			$mail->setReplyTo( 'info@friendos.com', 'Friend Software Corporation' );	
			
			$cid = intval( trim( $part ), 10 );
			$con = new dbIO( 'FContact' );
			$con->Load( $cid );
			
			// Check participant!
			$Logger->log( 'Preparing to add participation record.' );
			if( $con->ID && $con->Email )
			{
				$p = new dbIO( 'FContactParticipation' );
				$p->ContactID = $cid;
				$p->EventID = $o->ID;
				$p->Load();
				$p->Time = date( 'Y-m-d H:i:s' ); // When added!
				$p->Token = hash( 'sha256', strtotime( $p->DateTime ) . rand(0,9999) . rand(0,9999) );
				$p->Message = '';
				$p->Save();
				
				// Generate attendance link
				$fcore = $configfilesettings[ 'FriendCore' ];
				$ccore = $configfilesettings[ 'Core' ];
				$link = " - " . ( $ccore[ 'SSLEnable' ] == 1 ? 'https://' : 'http://' );
				$link .= $fcore[ 'fchost' ] . '/calendarevent/' . $p->Token;
				
				$desc = str_replace( "\n", "<br>", $o->Description );
				if( $link )
				{
					$desc .= '<br><ul><li>Please verify your attendance here: <a href="' . $link . '">' . $link . "</a></lu></ul><br>";
				}
				
				$mail->setContent( $desc );
				
				// Add the meeting request
				$mail->addStringAttachment( 'BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Friend Software Corp//Friend OS
CALSCALE:GREGORIAN
X-MS-OLK-FORCEINSPECTOROPEN:TRUE
X-WR-TIMEZONE:' . $timezone . '
METHOD:PUBLISH
X-COMMENT: See https://icalendar.org/validator.html 12
BEGIN:VEVENT
SUMMARY:' . $o->Title . '
UID:<<[ICS_UID]>>
DTSTART;TZID=' . $timezone . ':' . $utimefrom . '
DTEND;TZID=' . $timezone . ':' . $utimeto . '
LOCATION:' . $location . $link . '
SEQUENCE:0
PRIORITY:5
DESCRIPTION:' . str_replace( "\n", ' ', $o->Description ) . '
ORGANIZER;CN=' . $name . ':MAILTO:' . $email . '
END:VEVENT
END:VCALENDAR', 'ical.ics', 'base64', 'text/calendar' 
				);
				
				// Successful save!
				if( $p->ID > 0 )
				{
					$name = $con->Firstname && $con->Lastname ? ( $con->Firstname . ' ' . $con->Lastname ) : false;
					$mail->addRecipient( $con->Email, $name );
				}
				$mail->send();
			}
		}
		
		// Send the invite mail!
		$Logger->log( 'Trying to send email.' );
	}

	if( $o->ID > 0 ) die( 'ok<!--separate-->{"ID":"' . $o->ID . '"}' );
}
die( 'fail' );

?>
