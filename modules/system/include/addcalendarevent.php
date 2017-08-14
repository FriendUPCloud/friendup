<?php

/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Lesser General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Lesser General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

// Create FSFile table for managing doors
$t = new DbTable( 'FCalendar' );
if( !$t->load() )
{
	$SqlDatabase->query( '
	CREATE TABLE `FCalendar` (
	 `ID` bigint(20) NOT NULL AUTO_INCREMENT,
	 `CalendarID` bigint(20) NOT NULL default \'0\',
	 `UserID` bigint(20) NOT NULL DEFAULT \'0\',
	 `Title` varchar(255) DEFAULT NULL,
	 `Type` varchar(255) NOT NULL,
	 `Description` text NOT NULL,
	 `TimeFrom` varchar(255) DEFAULT NULL,
	 `TimeTo` varchar(8) DEFAULT NULL,
	 `Date` varchar(255) DEFAULT NULL,
	 `Source` varchar(255) NOT NULL,
	 `RemoteID` varchar(255) NOT NULL,
	 PRIMARY KEY (`ID`)
	)
	' );
}

if( is_object( $args->args->event ) )
{
	$o = new DbIO( 'FCalendar' );
	$o->Title = $args->args->event->Title;
	$o->Description = $args->args->event->Description;
	$o->TimeTo = $args->args->event->TimeTo;
	$o->TimeFrom = $args->args->event->TimeFrom;
	$o->Date = $args->args->event->Date;
	$o->UserID = $User->ID;
	$o->Type = 'friend';
	$o->Source = 'friend';
	$o->Save();

	if( $o->ID > 0 ) die( 'ok<!--separate-->{"ID":"' . $o->ID . '"}' );
}
die( 'fail' );

?>
