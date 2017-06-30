<?php

/*©lpgl*************************************************************************
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


$date = explode( '-', $args->args->date );
$day = (int)( $date[2] );
$date = $date[0] . '-' . str_pad( $date[1], 2, '0', STR_PAD_LEFT );
if( $day > 0 )
	$date .= '-' . str_pad( $day, 2, '0', STR_PAD_LEFT );


if( $rows = $SqlDatabase->fetchObjects( $q = '
	SELECT * FROM FCalendar WHERE 
	UserID=\'' . $User->ID . '\' AND 
	`Date`' . ( $day <= 0 ? ( ' LIKE \'' . $date . '-%\'' ) : ( '=\'' . $date . '\'' ) ) . '
' ) )
{
	$os = [];	
	
	foreach( $rows as $row )
	{
		$ob = new stdClass();
		$ob->ID = $row->ID;
		$ob->Title = $row->Title;
		$ob->Description = $row->Description;
		$ob->TimeTo = $row->TimeTo;
		$ob->TimeFrom = $row->TimeFrom;
		$ob->Date = $row->Date;
		$ob->Type = $row->Type;
		$os[] = $ob;
	}
	die( 'ok<!--separate-->' . json_encode( $os, 1 ) );
}
die( 'fail<!--separate-->' . $q );

?>
