<?php
/*©lpgl*************************************************************************
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


$devname = reset( explode( ':', $args->args->path ) );

$fname = end( explode( ':', $args->args->path ) );
if( strstr( '/', $fname ) )
	$fname = end( explode( '/', $fname ) );

// TODO: Add more security and checks!
$o = new DbIO( 'FFileShared' );
$o->Path = $args->args->path;
$o->Devname = $devname;
$o->Name = $fname;
$o->UserID = $User->ID;
$o->DstUserSID = 'Public';
$o->Load();
$o->Save();

// Success?
if( $o->ID > 0 )
	die( 'ok<!--separate-->' . $o->ID );

die( 'fail' );

?>
