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

function findBaseHref( $app )
{
	$ar = array(
		'repository/',
		'resources/webclient/apps/'
	);
	foreach ( $ar as $apath )
	{
		if( file_exists( $apath . $app ) && is_dir( $apath . $app ) )
		{
			return str_replace( array( '../resources' ), '', $apath ) . $app . '/';
		}
	}
	return false;
}

if( $level == 'API' )
{
	$app = new stdClass();
	$app->UserID = $User->ID;
	$app->Name = $args->app;
	$app->ID = 'load';
	$app->Config = file_get_contents( 'resources' . findBaseHref( $args->app ) . 'Config.conf' );
}
else
{
	$app = new dbIO( 'FApplication' );
	$app->UserID = $User->ID;
	$app->Name = $args->app;
	$app->Load();
}

if( $app->ID )
{
	$path = findBaseHref( $app->Name );
	$conf = json_decode( $app->Config );
	
	friendHeader( 'Content-Type: text/html' );
	
	$scrp = file_get_contents( $path . $conf->Init );
	
	// Is the wanted file from the repository?
	if( substr( $path, 0, 11 ) == 'repository/' )
	{
		$ua = new dbIO( 'FUserApplication' );
		$ua->UserID = $app->UserID;
		$ua->ApplicationID = $app->ID;
		if( $ua->Load() )
		{
			$d = substr( $path, 11, strlen( $path ) - 10 );
			$scrp = preg_replace( '/progdir\:/i', '/system.library/module/?module=system&authid=' . $ua->AuthID . '&command=resource&file=' . rawurlencode( $d ), $scrp );
		}
		else
		{
			die( 'fail<!--separate-->{"response":"application lacks user installation record"}' );
		}
	}
	// This one is probably from the resources/ directory
	else
	{
		if( substr( $path, 0, 9 ) == 'resources' )
			$path = substr( $path, 9, strlen( $path ) - 9 );
		$scrp = preg_replace( '/progdir\:/i', $path, $scrp );
	}
	
	// Support assets
	$scripts = '';
	if( isset( $conf->Assets ) )
	{
		foreach( $conf->Assets as $asset )
		{
			$ext = end( explode( '.', $asset ) );
			switch( strtolower( $ext ) )
			{
				case 'js':
					$scripts .= "\n\t<script src=\"" . $asset . "\"></script>";
					break;
			}
		}
	}
	
	// TODO: Permissions?
	$str = '<!DOCTYPE html>
<html>
	<head>
		<title>' . $conf->Name . '</title>
		<base href="' . $path . '"/>
		<script src="/webclient/js/apps/api.js"></script>' . $scripts . '
		<script>
			' . $scrp . '
		</script>
	</head>
	<body>
	</body>
</html>';

	$length = strlen( $str );	

	friendHeader( 'Content-Length: ' . $length );
	die( $str );
}
// Send kill signal
else
{
	// TODO: Actually send it
	die( 'fail' );
}

?>
