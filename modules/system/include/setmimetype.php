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

$o = new dbIO( 'FSetting' );
$o->UserID = $User->ID;
$o->Type = 'mimetypes';
$o->Key = $args->args->type;
$o->Load();
$o->Data = trim( $args->args->executable );
$o->Save();

$result = new stdClass();

$result->result = $o->ID > 0 ? '1' : '0';
$result->message = $o->ID > 0 ? 'Saved successfully.' : 'Failed.';

die( 'ok<!--separate-->' . json_encode( $result ) );

?>
