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

if( $rows = $SqlDatabase->FetchObjects( '
	SELECT 
		g.ID, g.Name, g.UserID, u.UserID AS WorkgroupUserID, m.ValueNumber, m.ValueString 
	FROM 
		FUserGroup g 
			LEFT JOIN FUserToGroup u ON 
			( 
					u.UserID = \'' . $User->ID . '\' 
				AND u.UserGroupID = g.ID 
			) 
			LEFT JOIN FMetaData m ON 
			( 
					m.DataTable = "FUserGroup" 
				AND m.DataID = g.ID 
			) 
	WHERE `Type`=\'Workgroup\' 
	ORDER BY `Name` ASC 
' ) )
{
	foreach( $rows as $row )
	{
		// TODO: Find out what variables are needed to be able to display when the doormanoffice employee is currently at work showing and hiding workgroups ...
	}	
	
	die( 'ok<!--separate-->' . json_encode( $rows ) );
}
die( 'ok<!--separate-->[]' );

?>
