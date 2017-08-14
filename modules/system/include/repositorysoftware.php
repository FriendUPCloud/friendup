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

global $Logger, $User;

if( $level != 'Admin' )
	die( 'fail<!--separate-->' );

$out = [];

if( $dir = opendir( 'repository' ) )
{
	while( $file = readdir( $dir ) )
	{
		if( $file{0} == '.' )
			continue;
		$p = 'repository/' . $file . '/';
		$c = new stdClass();
		$c->Filename = $file;
		if( isset( $args->packageget ) && $file == $args->packageget )
		{
			if( file_exists( 'repository/' . $file . '/package.zip' ) )
			{
				FriendHeader( 'Content-Type: application/octet-stream' );
				FriendHeader( 'Content-Disposition: attachment; filename=package.zip' );
				closedir( $dir );
				die( file_get_contents( 'repository/' . $file . '/package.zip' ) );
			}
			closedir( $dir );
			die( 'fail<!--separate-->{"response":"package file does not exist!"}' ); 
		}
		if( file_exists( $p . 'Signature.sig' ) )
		{
			$c->Signature = file_get_contents( $p . 'Signature.sig' );
			if( $c->Signature )
			{
				$s = json_decode( $c->Signature );
				$c->Signature = $s->signature;
				$c->Validated = $s->validated;
			}
		}
		else $c->Signature = 'Unsigned';
		$out[] = $c;
	}
	closedir( $dir );
}

if( !count( $out ) )
{
	die( 'fail<!--separate-->{"response":"no unverified software"}' );
}
die( 'ok<!--separate-->' . json_encode( $out ) );

?>
