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

global $Logger, $SqlDatabase, $User;

// Time stamp
if( isset( $args->args->timestamp ) )
{
	$date = date( 'Y-m-d', intval( $args->args->timestamp, 10 ) );
	$date = explode( '-', $date );
	foreach( $date as $k=>$v ) $date[ $k ] = intval( $v, 10 );
	ob_end_clean();
}
// Normal date
else if( isset( $args->args->date ) && trim( $args->args->date ) )
{
	$date = explode( '-', $args->args->date );
	foreach( $date as $k=>$v ) $date[ $k ] = intval( $v, 10 );
}
else
{
	$Logger->log( 'Nothing..' );
	die( 'fail<!--separate-->{"response":-1,"message":"No date or timestamp given."}' );
}

// Getting whole month?
if( !isset( $date[2] ) )
	$day = 0;
else $day = (int)( $date[2] );

$date = $date[0] . '-' . str_pad( $date[1], 2, '0', STR_PAD_LEFT );
if( $day > 0 )
	$date .= '-' . str_pad( $day, 2, '0', STR_PAD_LEFT );
// date Span = 2851200 ( 60 * 60 * 24 * 33 )
// date Day  = 86400   ( 60 * 60 * 24 )
// From to date (with a day plus and minus for a month)
$dateFrm = date( 'Y-m-d', strtotime( date( 'Y-m', strtotime( $date . '-01' ) - ( 2851200 ) ) . '-01' ) - ( 86400 ) );
$dateEnd = date( 'Y-m-d', strtotime( date( 'Y-m', strtotime( $date . '-01' ) + ( 2851200 ) ) . '-01' ) - ( 86400 ) );


// Get share data --------------------------------------------------------------

// Shared names
$sharedNames = false;

if( $data = $SqlDatabase->FetchObjects( '
	SELECT u.ID, u.Fullname FROM FUser u
	WHERE 
		ID IN 
		(
			SELECT m.DataID FROM FMetaData m
			WHERE 
				m.Key = \'UserUserCalendarRelation\' AND
				m.DataTable = \'FUser\' AND
				m.ValueString = \'friend\' AND
				m.ValueNumber = \'' . $User->ID . '\'
		)		
		OR
		ID IN
		(
			SELECT ug1.UserID FROM FMetaData m2, FUserToGroup ug1, FUserToGroup ug2
			WHERE 
				m2.Key = \'UserWorkgroupCalendarRelation\' AND
				m2.DataTable = \'FUserGroup\' AND
				m2.ValueString = \'friend\' AND
				ug1.UserGroupID = m2.ValueNumber AND
				ug2.UserGroupID = ug1.UserGroupID AND
				ug2.UserID = \'' . $User->ID . '\'
		)
' ) )
{
	$sharedNames = new stdClass();
	foreach( $data as $row )
	{
		$sharedNames->{$row->ID} = $row->Fullname;
		$uids[] = $row->ID;
	}
	unset( $rows );
}

// End share data --------------------------------------------------------------

$os = array(); // Calendar events

$s = new dbIO( 'FSetting' );
$s->Type = 'system';
$s->Key = 'calendarsources';
$s->UserID = $User->ID;
if( $s->Load() )
{
	$sources = json_decode( $s->Data );
	
	// Check plugins
	if( file_exists( 'modules/system/calendar' ) && is_dir( 'modules/system/calendar' ) )
	{
		if( $dir = opendir( 'modules/system/calendar' ) )
		{
			while( $file = readdir( $dir ) )
			{
				// Vet source according to config
				$found = false;
				foreach( $sources as $source )
				{
					if( $source->Type == $file )
					{
						$found = $source;
						break;
					}
				}
				if( !$found ) continue;
				
				// Execute getting calendar event
				$p = 'modules/system/calendar/' . $file;
				if( file_exists( $p ) && is_dir( $p ) && file_exists( $p . '/calendarevents.php' ) )
				{
					include( $p . '/calendarevents.php' );
				}
			}
			closedir( $dir );
		}
	}
}

// Get all including shared calendars
// TODO: Support other calendar entries than "friend" for shared calendars

// Normal date
$dateQuery = '';
// Timestamp date
if( isset( $args->args->timestamp ) ) 
{
	$dateQuery = '`Date` >= \'' . $dateFrm . '\' AND `Date` <= \'' . $dateEnd . '\'';
}
// Normal date
else
{
	$dateQuery = '`Date`' . ( $day <= 0 ? ( ' LIKE \'' . $date . '-%\'' ) : ( '=\'' . $date . '\'' ) );
}

if( $sharedNames )
{
	$uids[] = $User->ID;
		
	$q = '
		SELECT * FROM FCalendar WHERE 
		UserID IN (' . implode( ',', $uids ) . ') AND 
		( UserID = \'' . $User->ID . '\' OR `Type` = \'friend\' ) AND
		' . $dateQuery . '
	';
}
// Just get own
else
{
	$q = '
		SELECT * FROM FCalendar WHERE 
		UserID = \'' . $User->ID . '\' AND 
		' . $dateQuery . '
	';
}

if( $rows = $SqlDatabase->fetchObjects( $q ) )
{
	foreach( $rows as $row )
	{
		$ob = new stdClass();
		$ob->ID = $row->ID;
		$ob->Title = $row->Title;
		$ob->Description = $row->Description;
		$ob->TimeFrom = $row->TimeFrom;
		$ob->TimeTo = $row->TimeTo;
		$ob->Date = $row->Date;
		$ob->Type = $row->Type;
		$ob->Owner = ( $row->UserID == $User->ID ) ? 
			'i18n_you' : ( 
				isset( $sharedNames->{$row->UserID} ) ? $sharedNames->{$row->UserID} : 'i18n_unknown' 
			);
		$ob->Your = $row->UserID == $User->ID ? true : false;
		$ob->MetaData = $row->MetaData;
		$os[] = $ob;
	}
}
if( !$os || !count( $os ) )
{
	die( 'fail<!--separate-->' );
}
else
{
	die( 'ok<!--separate-->' . json_encode( $os, 1 ) );
}

?>
