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

$o = new DbIO( 'CmpProfile', $RSql );
if ( (int)$args->args->id > 0 )
{
	$o->Load( $args->args->id );
}
else
{
	$o->DateCreated = date( 'Y-m-d H:i:s' );
}
$o->DateModified = date( 'Y-m-d H:i:s' );
$o->Name = $args->args->name;
$o->Description = $args->args->description;
$o->GroupID = $args->args->groupId;
$o->ScaleID = $args->args->scaleId;
$o->CompetencyGroupID = $args->args->competencyGroupId;
$o->CompetencyID = $args->args->competencyId;
$o->UserID = $args->args->userId;
$o->Save();

die( 'ok<!--separate-->' . $o->ID );

?>