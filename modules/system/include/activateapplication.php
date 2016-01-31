<?php
/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

if( $row = $SqlDatabase->FetchObject( '
	SELECT * FROM FApplication WHERE `Name` = "' . $args->args->application . '" AND UserID=\'' . $User->ID . '\' 
' ) )
{
	if( isset( $args->args->permissions ) && is_array( $args->args->permissions ) )
	{
		$perms = [];
		foreach( $args->args->permissions as $p )
		{
			$rw = [];
			for( $a = 1; $a < count( $p ); $a++ )
			{
				$rw[$a-1] = $p[$a];
			}
			$perms[] = $rw;
		}
	
		// Collect permissions in a string
		$app = new dbIO( 'FUserApplication' );
		$app->ApplicationID = $row->ID;
		$app->UserID = $User->ID;
		$app->AuthID = md5( rand( 0, 9999 ) . rand( 0, 9999 ) . rand( 0, 9999 ) . $row->ID );
		$app->Permissions = json_encode( $perms );
		$app->Save();
		die( 'ok<!--separate-->' );
	}
}
die( 'fail' );

?>
