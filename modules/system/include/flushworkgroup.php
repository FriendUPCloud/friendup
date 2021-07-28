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

// Delete queued events
if( !$SqlDatabase->query( 'DELETE FROM FQueuedEvent WHERE TargetGroupID=\'' . $g->ID . '\'' ) )
{
	$res->message = 'Could not load workgroup.';
	die( 'fail<!--separate-->' . json_encode( $res ) );
}

// Delete group user relations
if( !$SqlDatabase->query( 'DELETE FROM FUserToGroup WHERE UserGroupID=\'' . $g->ID . '\'' ) )
{
	$res->message = 'Could not flush group members.';
	die( 'fail<!--separate-->' . json_encode( $res ) );
}

die( 'ok' );


?>
