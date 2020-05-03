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
$r = mysqli_real_escape_string( $SqlDatabase->_link, $route[2] );
if( $participant = $SqlDatabase->fetchObject(
	'SELECT * FROM FContactParticipation WHERE `Token`="' . $r . '"' 
) )
{
	$c = new dbIO( 'FCalendar' );
	if( $c->Load( $participant->EventID ) )
	{
		$tpl = str_replace( '{title}', 'Confirm invite', $tpl );
	
		$cnt = file_get_contents( 'php/templates/calendar/calendar_meeting.html' );
	
		$cnt = str_replace( '{meeting request}', $c->Description, $cnt );
		$cnt = str_replace( '{date}', $c->Date, $cnt );
		$cnt = str_replace( '{time}', $c->TimeFrom . ' - ' . $c->TimeTo, $cnt );
		
		$tpl = str_replace( '{content}', $cnt, $tpl );
	
		die( $tpl );
	}
}
else if( $route[ 2 ] == 'meeting' )
{
	/*$tpl = str_replace( '{title}', 'Meeting', $tpl );
	
	$cnt = file_get_contents( 'php/templates/calendar/calendar_meeting.html' );
	
	$tpl = str_replace( '{content}', $cnt, $tpl );
	
	die( $tpl );*/
	die( 'ERROR' );
}
else
{
	die( '404' );
}
// Final!
die( '404' );


?>
