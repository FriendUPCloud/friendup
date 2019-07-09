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

// Get own workgroups
if( $workgroups = $SqlDatabase->FetchObjects( '
	SELECT ug.ID FROM FUserGroup ug, FUserToGroup fug 
	WHERE 
		    fug.UserID=\'' . $User->ID . '\'
		AND fug.UserGroupID = ug.ID
' ) )
{
	// Setup vars
	$ids = [];
	foreach( $workgroups as $wg )
	{
		$ids[] = $wg->ID;
	}
	$uids = [];

	// List all users by connection to workgroup
	if( $users = $SqlDatabase->FetchObjects( '
		SELECT 
			u.ID FROM FUser u
		WHERE
			u.ID IN ( 
				SELECT i.UserID FROM FUserToGroup i, FUserGroup ug WHERE ug.Type = "Workgroup" AND ug.ID IN ( ' . implode( ',', $ids ) . ' )
			)
	' ) )
	{
		foreach( $users as $u )
		{
			$uids[] = $u->ID;
		}
	}
	
	// Final
	$workgroups = [];
	$users = [];
	
	if( count( $ids ) && count( $args->args->wids ) )
	{
		// Confirm that we are part of these workgroups
		foreach( $args->args->wids as $wid )
		{
			if( in_array( $wid, $ids ) )
			{
				$workgroups[] = $wid;
			}
		}
	}
	if( count( $uids ) && count( $args->args->uids ) )
	{
		foreach( $args->args->uids as $uid )
		{
			if( in_array( $uid, $uids ) )
			{
				$users[] = $uid;
			}
		}
	}
	
	// Store relation
	if( count( $users ) )
	{
		foreach( $users as $uid )
		{
			$d = new dbIO( 'FMetaData' );
			$d->Key = 'UserUserCalendarRelation';
			$d->DataID = $User->ID;
			$d->DataTable = 'FUser';
			$d->ValueNumber = intval( $uid, 10 );
			$d->ValueString = 'friend'; // <- Calendar type - TODO: Dynamic!
			$d->Load();
			$d->Save();
		}
	}
	if( count( $workgroups ) )
	{
		foreach( $workgroups as $wid )
		{
			$d = new dbIO( 'FMetaData' );
			$d->Key = 'UserWorkgroupCalendarRelation';
			$d->DataID = $User->ID;
			$d->DataTable = 'FUserGroup';
			$d->ValueNumber = intval( $wid, 10 );
			$d->ValueString = 'friend'; // <- Calendar type - TODO: Dynamic!
			$d->Load();
			$d->Save();
		}
	}
	die( 'ok<!--separate-->{"response":-1,"message":"Calendar was shared."}' );
	
}
die( 'fail<!--separate-->{"response":-1,"message":"No users or workgroups found."}' );

?>
