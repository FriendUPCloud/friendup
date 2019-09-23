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
if( is_object( $args->args->event ) )
{
	$o = new DbIO( 'FCalendar' );
	$o->UserID = $User->ID;
	if( $o->Load( $args->args->cid ) )
	{
		$o->Title = $args->args->event->Title;
		$o->Description = $args->args->event->Description;
		$o->TimeTo = $args->args->event->TimeTo;
		$o->TimeFrom = $args->args->event->TimeFrom;
		$o->Date = $args->args->event->Date;
		$o->Type = 'friend';
		$o->Source = 'friend';
		$o->Save();
	}

	if( $o->ID > 0 ) die( 'ok<!--separate-->{"ID":"' . $o->ID . '"}' );
}
die( 'fail' );

?>
