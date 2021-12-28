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

/* Remove all known connections to a Workgroup */

$res = new stdClass();
$res->response = -1;

$g = new dbIO( 'FUserGroup' );
$g->UserID = $User->ID;
$g->ID = $args->args->groupId;
if( !$g->Load() )
{
	$res->message = 'Could not load workgroup.';
	die( 'fail<!--separate-->' . json_encode( $res ) );
}

// Delete metadata for friendchat conferance rooms connected to this group
if( $fmd = $SqlDatabase->fetchObject( 'SELECT * FROM `FMetaData` WHERE `DataTable` = "FUserGroup" AND `Key` = "presence-roomId" AND `DataID` = \'' . $g->ID . '\' ' ) )
{
	if( $fmd->ValueString )
	{
		$roomId = $fmd->ValueString;
		$SqlDatabase->query( 'DELETE FROM FMetaData WHERE `DataTable` = "FUserGroup" AND `Key` = "presence-roomId" AND `DataID` = \'' . $g->ID . '\' AND `ValueString` = \'' . $roomId . '\'' );
	}
}

// Delete queued events
$SqlDatabase->query( 'DELETE FROM FQueuedEvent WHERE TargetGroupID=\'' . $g->ID . '\'' );

// Delete group user relations
$SqlDatabase->query( 'DELETE FROM FUserToGroup WHERE UserGroupID=\'' . $g->ID . '\'' );

die( 'ok<!--separate-->{"groupId":' . $args->args->groupId . ( isset( $roomId ) && $roomId ? ',"roomId":"' . $roomId . '"' : '' ) . '}' );


?>
