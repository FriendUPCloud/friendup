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

$g = new dbIO( 'FUserGroup' );
$g->UserID = $User->ID;
$g->ID = $args->args->groupId;
if( !$g->Load() )
{
	$res = new stdClass();
	$res->response = -1;
	$res->message = 'Could not load workgroup.';
	die( 'fail<!--separate-->' . json_encode( $res ) );
}



die( 'fail' );


?>
