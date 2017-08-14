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

if( $row = $SqlDatabase->FetchObject( '
	SELECT * FROM FApplication WHERE `Name` = "' . $args->args->application . '" AND UserID=\'' . $User->ID . '\' 
' ) )
{
	if( isset( $args->args->permissions ) )
	{
		// Collect permissions in a string
		$app = new dbIO( 'FUserApplication' );
		$app->ApplicationID = $row->ID;
		$app->UserID = $User->ID;
		$app->Load();
		if( $app->ID > 0 )
		{
			$app->Permissions = $args->args->permissions;
			$app->Data = $args->args->data;
			$app->Save();
			die( 'ok<!--separate-->' . $args->args->data );
		}
	}
}
die( 'fail' );

?>
