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

$fs = new DbIO( 'Filesystem' );
$fs->Name = $args->disk;
$fs->UserID = $User->ID;
if( $fs->Load() )
{
	if( $row = $SqlDatabase->fetchRow( $q = 'SELECT BlobBig FROM `FSBlob` WHERE `RowType` = \'Filesystem\' AND `RowID` = \'' . $fs->ID . '\' LIMIT 1' ) )
	{
		FriendHeader( 'Content-Type: image/jpeg' );
		die( base64_decode( $row['BlobBig'] ) );
	}
}

if( file_exists('web_desktop/gfx/system/logo_busy.gif') )
{
	FriendHeader( 'Content-Type: image/gif' );
	die( file_get_contents( 'web_desktop/gfx/system/logo_busy.gif' ) );	
}

?>
