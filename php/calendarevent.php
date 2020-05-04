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

global $SqlDatabase, $conf;

// Include basic functionality
include_once( 'php/classes/dbio.php' );
$conf = parse_ini_file( 'cfg/cfg.ini', true );

$tpl    = file_get_contents( 'php/templates/calendar/calendar.html' );
$tplcss = file_get_contents( 'php/templates/calendar/calendar.css' );
$tpl    = str_replace( '{css}', 'data:text/css;base64,' . base64_encode( $tplcss ), $tpl );

$route = explode( '/', $argv[1] );

$SqlDatabase = new SqlDatabase();
if( !$SqlDatabase->Open( 
	$conf[ 'DatabaseUser' ][ 'host' ],
	$conf[ 'DatabaseUser' ][ 'login' ], 
	$conf[ 'DatabaseUser' ][ 'password' ]
) )
{
	die( '404' );
}
$SqlDatabase->SelectDatabase( $conf[ 'DatabaseUser' ][ 'dbname' ] );
$GLOBALS['SqlDatabase'] =& $SqlDatabase;

// Check token
$participant = new dbIO( 'FContactParticipation' );
$participant->Token = $route[2];
$r = $participant->Token;
if( $participant->Load() )
{
	$c = new dbIO( 'FCalendar' );
	if( $c->Load( $participant->EventID ) )
	{
		$cuser = new dbIO( 'FUser' );
		$cuser->Load( $c->UserID );
		if( $cuser->ID && strlen( $c->MetaData ) )
		{
			$md = json_decode( $c->MetaData );
			// We got a message
			if( trim( $participant->Message ) )
			{
				$m = json_decode( $participant->Message );
				// We are in accept / tentative stage - bring up the scheduler
				if( $m->response == 'accept' || $m->response == 'tentative' )
				{
					$tpl = str_replace( '{title}', 'Confirm invite', $tpl );
	
					$cnt = file_get_contents( 'php/templates/calendar/calendar_meeting_accessing.html' );
					
					$cnt = str_replace( '{meeting request}', $c->Description, $cnt );
					$cnt = str_replace( '{date}', $c->Date, $cnt );
					$cnt = str_replace( '{dateLiteral}', date( 'M d Y', strtotime( $c->Date ) ), $cnt );
					$cnt = str_replace( '{time}', $c->TimeFrom . ' - ' . $c->TimeTo, $cnt );
					$cnt = str_replace( '{timefrom}', $c->TimeFrom, $cnt );
					$cnt = str_replace( '{timeto}', $c->TimeTo, $cnt );
					$cnt = str_replace( '{timezone}', $cuser->Timezone, $cnt );
					$cnt = str_replace( '{action}', '/calendarevent/' . $r . '/access', $cnt );
					$cnt = str_replace( '{link}', $md->Link, $cnt );
					$tpl = str_replace( '{content}', $cnt, $tpl );
	
					die( $tpl );
				}
				// This link was rejected
				else
				{
					$tpl = str_replace( '{title}', 'Link expired', $tpl );
					$tpl = str_replace( '{content}', '<div class="Dialog"><h1>This link expired</h1><p>Go back <a href="javascript:history.back(-1)">here</a>.</p></div>', $tpl );
				}
				die( $tpl );
			}
			
			$redirectScript = '<script>setTimeout( function(){ document.location.href = \'/calendarevent/' . $r . '\'; }, 4000 );</script>';
			
			// We are asking to accept
			if( $route[ 3 ] == 'accept' )
			{
				$participant->Message = '{"response":"' . $route[ 3 ] . '"}';
				$participant->Save();
				$tpl = str_replace( '{title}', 'Invite confirmed', $tpl );
				$tpl = str_replace( '{content}', '<div class="Dialog"><h1>Invite accepted</h1><p>Thank you for participating.</p></div>' . $redirectScript, $tpl );
				die( $tpl );
			}
			// We are asking tentatively to accept
			else if( $route[ 3 ] == 'tentative' )
			{
				$participant->Message = '{"response":"' . $route[ 3 ] . '"}';
				$participant->Save();
				$tpl = str_replace( '{title}', 'Invite confirmed', $tpl );
				$tpl = str_replace( '{content}', '<div class="Dialog"><h1>Invite accepted tentatively</h1><p>Thank you for participating.</p></div>' . $redirectScript, $tpl );
				die( $tpl );
			}
			// We are rejecting
			else if( $route[ 3 ] == 'reject' )
			{
				$participant->Message = '{"response":"' . $route[ 3 ] . '"}';
				$participant->Save();
				$tpl = str_replace( '{title}', 'Invite rejected', $tpl );
				$tpl = str_replace( '{content}', '<div class="Dialog"><h1>Invite rejected</h1><p>The invitee will get notified of your absence.</p></div>', $tpl );
				die( $tpl );
			}
			// We are proposing a new time
			// TODO: Get the times! Pawel needs to pass form vars
			else if( $route[ 3 ] == 'newtime' )
			{
				$participant->Message = '{"response":"' . $route[ 3 ] . '"}';
				$participant->Save();
				$tpl = str_replace( '{title}', 'Suggestion submitted', $tpl );
				$tpl = str_replace( '{content}', '<div class="Dialog"><h1>Suggestion submitted</h1><p>Thank you for your suggestion.</p></div>', $tpl );
				die( $tpl );
			}
			// Go to the main "front door" where the user gets options
			else
			{
				$tpl = str_replace( '{title}', 'Confirm invite', $tpl );
	
				$cnt = file_get_contents( 'php/templates/calendar/calendar_meeting.html' );
	
				$cnt = str_replace( '{meeting request}', $c->Description, $cnt );
				$cnt = str_replace( '{date}', $c->Date, $cnt );
				$cnt = str_replace( '{time}', $c->TimeFrom . ' - ' . $c->TimeTo, $cnt );
				$cnt = str_replace( '{action}', '/calendarevent/' . $r . '/newtime', $cnt );
		
				$tpl = str_replace( '{content}', $cnt, $tpl );
	
				die( $tpl );
			}
		}
	}
}
else
{
	die( '404' );
}
// Final!
die( '404' );


?>
