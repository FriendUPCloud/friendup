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

include_once( 'php/classes/door.php' );

$obj = new stdClass();
$obj->permissions = $args->args->Permissions;
$obj->domain = $args->args->Domains;

$f = new Door( $args->args->Filename . ':' );

$df = new dbIO( 'Filesystem' );
$df->Load( $f->ID );
$df->Config = json_encode( $obj );
$df->Save();
if( $df->ID > 0 ) die( 'ok<!--separate-->' ); //. $df->Config . '<!--separate-->' . $df->ID );

die( 'fail' );

?>
