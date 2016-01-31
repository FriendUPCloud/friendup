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

function findBaseHref( $app )
{
	$ar = array(
		'../resources/webclient/apps/',
		'resources/webclient/apps/'
	);
	foreach ( $ar as $apath )
	{
		if( file_exists( $apath . $app ) && is_dir( $apath . $app ) )
		{
			return str_replace( array( '../resources', 'resources' ), '', $apath ) . $app . '/';
		}
	}
	return false;
}

$app = new dbIO( 'FApplication' );
$app->UserID = $User->ID;
$app->Name = $args->app;
if( $app->Load() )
{
	$path = findBaseHref( $app->Name );
	$conf = json_decode( $app->Config );
	
	friendHeader( 'Content-Type: text/html' );
	
	$scrp = file_get_contents( 'resources/' . $path . $conf->Init );
	$scrp = preg_replace( '/progdir\:/i', $path, $scrp );
	
	// TODO: Permissions?
	$str = '<!DOCTYPE html>
<html>
	<head>
		<title>' . $conf->Name . '</title>
		<base href="' . $path . '"/>
		<script src="/webclient/js/apps/api.js"></script>
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
