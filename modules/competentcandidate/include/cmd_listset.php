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

$o = new DbIO( 'CmpScale', $RSql );
if( (int)$args->args->id > 0 )
{
	$o->Load( $args->args->id );
}
else $o->DateCreated = date( 'Y-m-d H:i:s' );
$o->DateModified = date( 'Y-m-d H:i:s' );
$o->Name = $args->args->list;
$o->Rate1 = $args->args->rating1;
$o->Rate2 = $args->args->rating2;
$o->Rate3 = $args->args->rating3;
$o->Rate4 = $args->args->rating4;
$o->Rate5 = $args->args->rating5;
$o->Save();
die( 'ok<!--separate-->' . $o->ID );
break;

?>
