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


$settings = new object();
$settings->Date = date( 'Y-m-d H:i:s' );

if( isset( $args->args->settings ) )
{
	$failed = true;
	foreach ( $args->args->settings as $set )
	{
		$s = new dbIO( 'FSetting' );
		$s->Type = 'system';
		$s->Key = $set;
		$s->UserID = $User->ID;
		if( $s->Load() )
		{
			$json = false;
			if( substr( $s->Data, 0, 1 ) == '"' && substr( $s->Data, -1, 1 ) == '"' )
			{
				$json = substr( $s->Data, 1, strlen( $s->Data ) - 2 );
			}
			if( $json && $d = json_decode( $json ) )
			{
				$settings->$set = $d;
			}
			else if( $d = json_decode( $s->Data ) )
			{
				$settings->$set = $d;
			}
			else $settings->$set = $s->Data;
			$failed = false;
		}
	}
	if( !$failed ) die( 'ok<!--separate-->' . json_encode( $settings ) );
}
else if ( isset( $args->args->setting ) )
{
	$set = $args->args->setting;
	$s = new dbIO( 'FSetting' );
	$s->Type = 'system';
	$s->Key = $args->args->setting;
	$s->UserID = $User->ID;
	if( $s->Load() )
	{
		$json = false;
		if( substr( $s->Data, 0, 1 ) == '"' && substr( $s->Data, -1, 1 ) == '"' )
		{
			$json = substr( $s->Data, 1, strlen( $s->Data ) - 2 );
		}
		if( $json && $d = json_decode( $json ) )
		{
			$settings->$set = $d;
		}
		else if( $d = json_decode( $s->Data ) )
		{
			$settings->$set = $d;
		}
		else $settings->$set = $s->Data;
		die( 'ok<!--separate-->' . json_encode( $settings ) );
	}
}

die( 'fail' );

?>
