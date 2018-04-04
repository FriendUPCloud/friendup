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

/* read from setting...  */
/* read user setting */
/* we have $User, $SqlDatabase; */

$r = $SqlDatabase->FetchObject( "SELECT * FROM FSetting s WHERE	s.UserID = '" . $User->ID . "' AND s.Type = 'competentcandidate' AND s.Key = 'globalgroup' ORDER BY s.Key ASC;" );
if( $r && intval($r->Data) != 0)
{
	die('ok<!--separate-->' . intval($r->Data))
}

die( 'fail<!--separate-->' );

?>