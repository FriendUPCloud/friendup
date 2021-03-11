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

$o = new DbIO( 'FCalendar' );
$o->Load( $args->args->id );
if( $o->ID > 0 && $o->UserID == $User->ID )
{
	$o->delete();
	
	// Remove the corresponding participation
	$SqlDatabase->Query( 'DELETE FROM FContactParticipation WHERE `EventID`=\'' . $o->ID . '\'' );
	
	die( 'ok' );
}
die( 'fail' );

?>
