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

if ( isset( $args->args->key ) && isset( $args->args->device ) )
{
	$s = new dbIO( 'FIOTDevice' );
	$s->UserID = $User->ID;
	$s->DeviceID = $args->args->device;
	$s->Key = $args->args->key;
	if( $s->Load() )
	{
		$result = new stdClass();
		$result->key = $s->Key;
		$result->value = $s->Value;
		$result->device = $s->deviceid;
		die( 'ok<!--separate-->' . json_encode( $result ) );
	}
}
die( 'fail' );

?>
