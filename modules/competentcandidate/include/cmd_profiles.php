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

if ( $rows = $RSql->FetchObjects( '
	SELECT p.ID, p.GroupID, p.Data, p.UserID, p.Name, g.Name AS GroupName, p.Description, p.DateModified
	FROM `CmpProfile` p, `CmpGroup` g
	WHERE
		!p.IsDeleted
	AND
		p.GroupID = g.ID
	AND
		(p.UserID = -1 OR p.UserID = '. $User->ID .')
	ORDER BY 
		g.Name ASC, p.Name ASC
' ) )
{
	foreach ( $rows as $k=>$row )
	{
		// TODO: Optimize this!
		$rows[$k]->DateModified = date( 'd/m/Y', strtotime( $row->DateModified ) );
	}
	
	die( 'ok<!--separate-->' . json_encode( $rows ) );
}

die( 'fail<!--separate-->Could not load profiles. Contact your administrator.' );

?>