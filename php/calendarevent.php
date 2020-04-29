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

global $SqlDatabase;

// Include basic functionality
include_once( 'friend/friend.php' );

$tpl    = file_get_contents( 'php/templates/calendar/calendar.html' );
$tplcss = file_get_contents( 'php/templates/calendar/calendar.css' );
$tpl    = str_replace( '{css}', 'data:text/css;base64,' . base64_encode( $tplcss ), $tpl );

$route = explode( '/', $argv[1] );

if( $route[ 2 ] == 'meeting' )
{
	$tpl = str_replace( '{title}', 'Meeting', $tpl );
	
	$cnt = file_get_contents( 'php/templates/calendar/calendar_meeting.html' );
	
	$tpl = str_replace( '{content}', $cnt, $tpl );
	
	die( $tpl );
}
else
{
	die( '404' );
}


?>
