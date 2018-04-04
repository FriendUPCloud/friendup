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

$l = $SqlDatabase->FetchObject( 'SELECT g.Name FROM FUserGroup g, FUserToGroup ug WHERE g.ID = ug.UserGroupID AND ug.UserID=\'' . $User->ID . '\'' );
$g = $SqlDatabase->FetchObject( 'SELECT s.Data AS GlobalGroup FROM FSetting s WHERE s.Type = \'competentcandidate\' AND s.Key = \'globalgroup\' AND s.UserID=\'' . $User->ID . '\'' );

$o = new stdClass();
$o->Level = $l->Name;
$o->Username = $User->Name;
$o->UserID = $User->ID;
$o->GlobalGroupID = $g->GlobalGroup ? $g->GlobalGroup : -1;

die( 'ok<!--separate-->' . json_encode( $o ) );

?>