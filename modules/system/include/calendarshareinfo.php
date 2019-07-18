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

// Get share data --------------------------------------------------------------

// Shared names
$sharedNames = false;

// TODO: Support other calendars than "friend"
$users = $SqlDatabase->FetchObjects( '
	SELECT u.ID, u.Fullname, u.Email, u.Name 
	FROM FMetaData m, FUser u
	WHERE 
		m.Key = \'UserUserCalendarRelation\' AND
		m.DataID = \'' . $User->ID . '\' AND
		m.DataTable = \'FUser\' AND
		m.ValueString = \'friend\' AND
		m.ValueNumber = u.ID
' );
$workgroups = $SqlDatabase->FetchObjects( '
	SELECT fug.ID, fug.Name 
	FROM FMetaData m, FUserGroup fug
	WHERE 
		m.Key = \'UserWorkgroupCalendarRelation\' AND
		m.DataID = \'' . $User->ID . '\' AND
		m.DataTable = \'FUserGroup\' AND
		m.ValueString = \'friend\' AND
		fug.ID = m.ValueNumber
' );

$sharing = new stdClass();

// TODO: Support other calendars than "friend"
if( $users || $workgroups )
{
	$response = new stdClass();
	$response->users =& $users;
	$response->workgroups =& $workgroups;
	$sharing->friend =& $response;
	
	die( 'ok<!--separate-->' . json_encode( $sharing ) );
}
die( 'fail<!--separate-->{"response":-1,"message":"Nothing shared."}' );

?>
