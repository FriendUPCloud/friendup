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
global $SqlDatabase;

$nam = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->appName );
$l = new DbIO( 'FApplication' );
$l->Name = $args->args->appName;
$l->UserID = $User->ID;
if( $l->Load() )
{
	if( $SqlDatabase->query( 'DELETE FROM `FUserApplication` WHERE `UserID`=\'' . $User->ID . '\' AND `ApplicationID`=\'' . $l->ID . '\'' ) )
	{
		$l->Delete();
	}
	die( 'ok' );
}
die( 'fail' );


?>
