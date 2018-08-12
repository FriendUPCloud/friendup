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

if( $level != 'Admin' ) 
	die( 'fail' );
	
$entry = new dbIO( 'FMetaData' );
$entry->Key = $args->args->key;
if( isset( $args->args->valueString ) )
	$entry->ValueString = $args->args->valueString;
$entry->load();

if( isset( $args->args->valueNumber ) )
{
	$entry->ValueNumber = $args->args->valueNumber;
}
if( isset( $args->args->valueString ) )
{
	$entry->ValueString = $args->args->valueString;
}

$entry->save();

if( $entry->ID > 0 )
{
	die( 'ok<!--separate-->' );
}

die( 'fail' );

?>
