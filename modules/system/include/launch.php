<?php
/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

function findBaseHref( $app )
{
	global $Logger;
	$ar = array(
		'repository/',
		'resources/webclient/apps/'
	);
	foreach ( $ar as $apath )
	{
		if( file_exists( $apath . $app ) && is_dir( $apath . $app ) )
		{
			$str = str_replace( array( '../resources' ), '', $apath ) . $app . '/';
			return $str;
		}
	}
	return false;
}

// Activate whitelist
if( isset( $args->app ) && isset( $configfilesettings[ 'Security' ][ 'UserAppWhitelist' ] ) )
{
	$whitelist = $configfilesettings[ 'Security' ][ 'UserAppWhitelist' ];
	$whitelist = explode( ',', $whitelist );
	if( $level != 'Admin' && !in_array( $args->app, $whitelist ) )
	{
		die( 'fail' );
	}	
}

if( $level == 'API' )
{
	$app = new stdClass();
	$app->UserID = $User->ID;
	$app->Name = $args->app;
	$app->ID = 'load';
	$app->Config = file_get_contents( findBaseHref( $args->app ) . 'Config.conf' );
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
	$path = findBaseHref( $app->Name ? $app->Name : $args->app );
	$conf = json_decode( $app->Config );
	
	friendHeader( 'Content-Type: text/html' );
	
	$scrp = file_get_contents( $path . $conf->Init );
	
	// Is the wanted file from the repository?
	if( substr( $path, 0, 11 ) == 'repository/' )
	{
		$ua = new dbIO( 'FUserApplication' );
		$ua->UserID = $app->UserID;
		$ua->ApplicationID = $app->ID;
		
		// User application part is not stored, app not installed
		if( !$ua->Load() )
		{
			die( 'fail<!--separate-->{"response":"application lacks user installation record"}' );
		}
		else
		{
			$d = substr( $path, 11, strlen( $path ) - 10 );
			$scrp = preg_replace( '/progdir\:/i', '/system.library/module/?module=system&authid=' . $ua->AuthID . '&command=resource&file=' . rawurlencode( $d ), $scrp );
		}
	}
	// This one is probably from the resources/ directory
	else
	{
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
	
	$port = $configfilesettings[ 'Core' ][ 'ProxyEnable' ] ? '' : ( ':' . $configfilesettings[ 'Core' ][ 'port' ] );
	$href = ( $configfilesettings[ 'Core' ][ 'SSLEnable' ] ? 'https://' : 'http://' ) . $configfilesettings[ 'FriendCore' ][ 'fchost' ] . $port . '/';
	
	// TODO: Permissions?
	$str = '<!DOCTYPE html>
<html>
	<head>
		<title>' . $conf->Name . '</title>
		<base href="' . $href . '"/>
		<script>
		    Friend = window.Friend ? window.Friend : {};
		    {
				let pause = 5;
				Friend.launch = function()
				{
					if( this.launched ) return;
					if( !window.Application ){ setTimeout( function(){ Friend.launch(); }, pause ); pause = pause == 5 ? 10 : 25; return; };
					this.launched = true;
					' . $scrp . '
					Application.checkAppPermission = function( key ){ let permissions = {}; if( permissions[ key ] ) return permissions[ key ]; return false; }
				};
			}
		</script>
		<script onerror="" onload="Friend.launch()" src="/webclient/js/apps/api.js"></script>' . $scripts . '
	</head>
	<body onload="Friend.launch()"></body>
</html>';

	$length = strlen( $str );	

	friendHeader( 'Content-Length: ' . $length );
	die( $str );
}
// Send kill signal
else
{
	// TODO: Actually send it
	die( 'fail<!--separate-->{"response":"fatal error in launch"}' );
}

?>
