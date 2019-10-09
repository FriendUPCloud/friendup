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
		if( !( $metaData = json_decode( $o->MetaData ) ) )
		{
			$metaData = new stdClass();
			$metaData->AllDay = false;
			$metaData->AllWeek = false;
			$metaData->DateTo = '';
		}
		
		// Set all values
		if( isset( $args->args->event->Title ) )
			$o->Title = $args->args->event->Title;
		if( isset( $args->args->event->Description ) )
			$o->Description = $args->args->event->Description;
		if( isset( $args->args->event->TimeTo ) )
			$o->TimeTo = $args->args->event->TimeTo;
		if( isset( $args->args->event->TimeFrom ) )
			$o->TimeFrom = $args->args->event->TimeFrom;
		if( isset( $args->args->event->Date ) )
			$o->Date = $args->args->event->Date;
		if( isset( $args->args->event->AllDay ) )
			$metaData->AllDay = $args->args->event->AllDay;
		if( isset( $args->args->event->AllWeek ) )
			$metaData->AllWeek = $args->args->event->AllWeek;
		if( isset( $args->args->event->DateTo ) )
		{
			$metaData->DateTo = '';
			// End date needs to be larger than date
			if( $args->args->event->DateTo != $args->args->event->Date )
			{
				if( strtotime( $args->args->event->Date ) < strtotime( $args->args->event->DateTo  ) )
					$metaData->DateTo = $args->args->event->DateTo;
			}
		}
			
		$o->MetaData = json_encode( $metaData );
		$o->Type = 'friend';
		$o->Source = 'friend';
		$o->Save();
	}
	if( $o->ID > 0 ) die( 'ok<!--separate-->{"ID":"' . $o->ID . '"}' );
}
die( 'fail' );

?>
