<?php
/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

// Get arguments from argv
if( isset( $argv ) && isset( $argv[1] ) )
{
	if( $args = explode( "&", $argv[1] ) )
	{
		$kvdata = new stdClass();
		foreach ( $args as $arg )
		{
			if( trim( $arg ) && strstr( $arg, '=' ) )
			{
				list( $key, $value ) = explode( "=", $arg );
				if( isset( $key ) && isset( $value ) )
				{
					$kvdata->$key = urldecode( $value );
					if( $data = json_decode( $kvdata->$key ) )
						$kvdata->$key = $data;
				}
			}
		}
	}
	$GLOBALS['args'] = $kvdata;
	$args = $GLOBALS['args'];
}

// If we pass what is allowed, continue.
if( !strstr( $argv[1], '..' ) && $argv[1] != '/' )
{
	if( file_exists( 'scripts' ) && is_dir( 'scripts' ) && file_exists( 'scripts/' . $argv[1] ) )
	{
		include( 'scripts' . $argv[1] );
	}
}

die( '<!DOCTYPE html>
<html>
	<head>
		<title>Friend Core - 404</title>
	</head>
	<body>
		<h1>
			404 - File not found!
		</h1>
		<p>
			Friend Core has failed to find your file.
		</p>
		<p>
			<a href="javascript:history.back(-1)">Go back</a>.
		</p>
	</body>
</html>
' );

?>
