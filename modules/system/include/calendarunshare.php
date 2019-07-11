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

global $SqlDatabase, $User, $Logger;

if( isset( $args->args ) )
{
	$unshareCount = 0;
	//$Logger->log( '[calendarunshare] We got args.' );
	foreach( $args->args as $calName => $cal )
	{
		$usc = $wsc = false;
		//$Logger->log( '[calendarunshare]  * Calendar ' . $calName );
		if( isset( $cal->users ) )
		{
			// Sanitize
			foreach( $cal->users as $k=>$v )
				$cal->users{$k} = intval( $v, 10 );
			
			$SqlDatabase->query( $q = '
				DELETE FROM FMetaData
				WHERE 
					`Key` = \'UserUserCalendarRelation\' AND
					DataID = \'' . $User->ID . '\' AND
					DataTable = \'FUser\' AND
					ValueString = \'' . $calName . '\' AND
					ValueNumber IN ( ' . implode( ', ', $cal->users ) . ' )
			' );
			
			$wsc = true;
			//$Logger->log( '[calendarunshare]     Users removed; ' . implode( ', ', $cal->users ) );
			//$Logger->log( $q );
		}
		if( isset( $cal->workgroups ) )
		{
			// Sanitize
			foreach( $cal->workgroups as $k=>$v )
				$cal->workgroups{$k} = intval( $v, 10 );
			
			$SqlDatabase->query( '
				DELETE FROM FMetaData
				WHERE 
					`Key` = \'UserWorkgroupCalendarRelation\' AND
					DataID = \'' . $User->ID . '\' AND
					DataTable = \'FUser\' AND
					ValueString = \'' . $calName . '\' AND
					ValueNumber IN ( ' . implode( ', ', $cal->workgroups ) . ' )
			' );
			
			$usc = true;
			//$Logger->log( '[calendarunshare]     Workgroups removed; ' . implode( ', ', $cal->workgroups ) );
		}
		
		if( $usc || $wsc )
			$unshareCount++;
	}
	
	// Successful?
	if( $unshareCount > 0 )
	{
		//$Logger->log( '[calendarunshare]  Successful unsharing..' );
		die( 'ok<!--separate-->{"response":1,"message":"Successfully unshared specified calendars."}' );
	}
	
}

die( 'fail<!--separate-->{"response":-1,"message":"Failed to unshare unspecified calendars."}' );


?>
