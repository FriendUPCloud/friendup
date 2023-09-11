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

use Kigkonsult\Icalcreator\Vcalendar;

// Just include our mailer!
include_once( 'php/classes/dbio.php' );
include_once( 'php/classes/mailserver.php' );
include_once( 'php/3rdparty/iCalcreator/autoload.php' );

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
	if( isset( $args->args->event->MetaData ) )
	{
		$o->MetaData = $args->args->event->MetaData;
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
		$dateTo = isset( $args->args->event->DateTo ) && trim( $args->args->event->DateTo ) ? $args->args->event->DateTo : false;
		$timeto = date( 'Y-m-d H:i:s', strtotime( ( $dateTo ? $dateTo : $o->Date ) . ' ' . $o->TimeTo ) );
		$timefrom = date( 'Y-m-d H:i:s', strtotime( $o->Date . ' ' . $o->TimeFrom ) );
		$utimeto = date( 'Ymd\THis\Z', strtotime( $timeto ) );
		$utimefrom = date( 'Ymd\THis\Z', strtotime( $timefrom ) );
		$timenow = date( 'Ymd\THis\Z' );
	
		// TODO: Implement template support!
		/*if( isset( $configfilesettings[ 'FriendMail' ] ) &&
			isset( $configfilesettings[ 'FriendMail' ][ 'friendmail_tmpl' ] )
		)
		{
			$mail->setTemplateFile(
				$cnf = $configfilesettings[ 'FriendMail' ][ 'friendmail_tmpl' ]
			);
		}*/
		
		// Create a unique hash
		$domain = explode( '@', $User->Email ); $domain = $domain[1];
		$uid = hash( 'md5', $o->ID . $User->Email ) . '@' . $domain;
		
		// Get attendees
		$parts = explode( ',', $args->args->event->Participants );
		$participants = $SqlDatabase->fetchObjects( 'SELECT Firstname, Lastname, Email FROM FContact WHERE ID IN (' . $args->args->event->Participants . ')' );
		
		// Get participants and generate emails
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
				$p->Token = hash( 'sha256', strtotime( $p->Time ) . rand(0,9999) . rand(0,9999) );
				$p->Message = '';
				$p->Save();
				
				// Generate attendance link
				$fcore = $configfilesettings[ 'FriendCore' ];
				$ccore = $configfilesettings[ 'Core' ];
				$link = " - " . ( $ccore[ 'SSLEnable' ] == 1 ? 'https://' : 'http://' );
				$link .= $fcore[ 'fchost' ] . '/calendarevent/' . $p->Token;
				
				$desc = str_replace( "\n", "<br>", $o->Description );
				
				// Add an HTML meeting request (for browsers that support it
				$mail->setContent( '
			<p>
				<a href="' . $link . '">' . $link . '</a>
			</p>
			<p>
				<strong>You have been invited to a meeting.</strong>
			</p>
			<h2>
				' . $o->Title . '
			</h2>
			<p>
				' . $desc . '
			</p>
' );

				// Begin iCal generation ---------------------------------------
				// Offsets
				$vcalendar = Vcalendar::factory( [ Vcalendar::UNIQUE_ID => 'Friend OS', ] );
				$vcalendar->setMethod( Vcalendar::PUBLISH );
				$vcalendar->setXprop( Vcalendar::X_WR_CALNAME, 'Friend OS Calendar Integration' );
				$vcalendar->setXprop( Vcalendar::X_WR_CALDESC, 'Friend OS' );
				$vcalendar->setXprop( Vcalendar::X_WR_RELCALID, '3E26604A-50F4-4449-8B3E-E4F4932D05B5' );
				$vcalendar->setXprop( Vcalendar::X_WR_TIMEZONE, $timezone );
				// Event
				$vevent = $vcalendar->newVevent();
				$vevent->setTransp( Vcalendar::OPAQUE );
				$vevent->setClass( Vcalendar::P_BLIC );
				$vevent->setSequence( 1 );
				$vevent->setSummary( $o->Title );
				$vevent->setDescription( $o->Description . "\n\nPlease follow this link: " . $link );
				if( $location )
					$vevent->setLocation( $location );
				// Set the time
				$vevent->setDtstart( $utimefrom, new DateTimeZone( $timezone ) );
				$vevent->setDtend( $utimeto, new DateTimeZone( $timezone ) );
				// Organizer
				$vevent->setOrganizer( $email );

				// Add participants
				foreach( $participants as $part )
				{
					$nam = $part->Firstname && $part->Lastname ? ( $part->Firstname . ' ' . $part->Lastname ) : $part->Email;
					$vevent->setAttendee( $part->Email,
						[
							Vcalendar::ROLE     => Vcalendar::REQ_PARTICIPANT,
							Vcalendar::PARTSTAT => Vcalendar::NEEDS_ACTION,
							Vcalendar::RSVP     => Vcalendar::TRUE,
							Vcalendar::CN       => $nam
						]
					);
				}
				// Add alarm for the event
				// TODO: make configurable
				$alarm = $vevent->newValarm();
				$alarm->setAction( Vcalendar::DISPLAY );
				$alarm->setDescription( $vevent->getDescription() );
				// Fire off the alarm one day before
				$alarm->setTrigger( '-P1D' );
				// Generate ical thingie
				$ical = $vcalendar->vtimezonePopulate()->createCalendar();				
				// DONE: iCal generation ---------------------------------------

				// Add the meeting request
				$mail->WordWrap = 50;
				
				/*$mail->addAttachment( 
					'tempfile.ics', 'tempfile.ics', '7bit', 
					'text/calendar; charset=utf-8; method=REQUEST' 
				);*/
				$mail->Ical = $ical;
				
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

// OLD STUFF -------------------------------------------------------------------

/*				// Generate ICS
				$ical = 'BEGIN:VCALENDAR
PRODID:-//Friend Software Corp//Friend OS v1.2.3//EN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:REQUEST
X-WR-TIMEZONE:' . $timezone . '
BEGIN:VTIMEZONE
TZID:' . $timezone . '
BEGIN:STANDARD

END:STANDARD
BEGIN:DAYLIGHT

END:DAYLIGHT
END:VTIMEZONE
BEGIN:VEVENT
DTSTART;TZID=' . $timezone . ':' . $utimefrom . '
DTEND;TZID=' . $timezone . ':' . $utimeto . '
DTSTAMP:' . $timenow . '
ORGANIZER;CN=' . $name . ':MAILTO:' . $email . '
' . $attendees . '
UID:' . $uid . '
CREATED:' . $timenow . '
DESCRIPTION:' . strip_tags( str_replace( "\n", ' ', $o->Description ) ). '
LAST-MODIFIED:' . $timenow . '
LOCATION:' . $location . '
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:' . $o->Title . '
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR';*/

?>
