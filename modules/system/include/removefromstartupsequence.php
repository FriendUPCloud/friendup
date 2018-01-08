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
$s = new dbIO( 'FSetting' );
$s->Type = 'system';
$s->Key = 'startupsequence';
$s->UserID = $User->ID;
if( $s->Load() )
{
	$json = false;
	$list = [];
	
	if( $d = json_decode( $s->Data ) )
		$list = $d;
	
	$out = [];
	
	foreach( $list as $l )
	{
		if( trim( $l ) != trim( $args->args->item ) )
		{
			$out[] = $l;
		}
	}
	
	$s->Data = json_encode( $out );
	$s->Save();
	
	
	die( 'ok<!--separate-->{"response":1,"message":"Startup sequence was saved"}' );
}
die( 'fail<!--separate-->{"response":0,"message":"Startup sequence was not saved due to error"}' );

?>
