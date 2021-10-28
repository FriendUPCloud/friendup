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

function findInSearchPaths( $app )
{
	$ar = array(
		'repository/',
		'resources/webclient/apps/'
	);
	foreach ( $ar as $apath )
	{
		if( file_exists( $apath . $app ) && is_dir( $apath . $app ) )
		{
			return $apath . $app;
		}
	}
	return false;
}

$app = isset( $args->application ) ? $args->application : false;
if( !$app )
{
	if( isset( $args->args->application ) )
		$app = $args->args->application;
}
if( !$app ) die( 'fail' );

// Activate whitelist
if( isset( $configfilesettings[ 'Security' ][ 'UserAppWhitelist' ] ) )
{
	$whitelist = $configfilesettings[ 'Security' ][ 'UserAppWhitelist' ];
	$whitelist = explode( ',', $whitelist );
	if( $level != 'Admin' && !in_array( $app, $whitelist ) )
	{
		die( 'fail' );
	}	
}

if( $path = findInSearchPaths( $app ) )
{
	if( file_exists( $path . '/Config.conf' ) )
	{
		$f = file_get_contents( $path . '/Config.conf' );
		// Path is dynamic!
		$f = preg_replace( '/\"Path[^,]*?\,/i', '"Path": "' . $path . '/",', $f );
		
		// Store application!
		$a = new dbIO( 'FApplication' );
		$a->Config = $f;
		$a->UserID = $User->ID;
		$a->Name = $app;
		$a->Permissions = 'UGO';
		$a->DateInstalled = date( 'Y-m-d H:i:s' );
		$a->DateModified = $a->DateInstalled;
		$a->Save();
		if( $a->ID > 0 )
		{
			
			// Update cfg/system_permissions.json on app install
			
			if( $a->Config && $a->Name )
			{
				if( file_exists( 'cfg/system_permissions.json' ) && filesize( 'cfg/system_permissions.json' ) )
				{
					if( $f = @file_get_contents( 'cfg/system_permissions.json' ) )
					{
						if( !$json = json_decode( trim( $f ) ) )
						{
							die( 'fail<!--separate-->malformed json in cfg/system_permissions.json contact system admin!' );
						}
					}
					else
					{
						die( 'fail<!--separate-->malformed json in cfg/system_permissions.json contact system admin!' );
					}
				}
				else
				{
					$json = new stdClass();
				}
				
				if( $fp = @fopen( 'cfg/system_permissions.json', 'w' ) )
				{
					$conf = json_decode( trim( $a->Config ) );
					
					if( $conf && $json )
					{
						$json->{ trim( $a->Name ) } = $conf;
						
						if( $data = json_encode( $json, JSON_PRETTY_PRINT ) )
						{
							fwrite( $fp, $data );
						}
						
						fclose( $fp );
					}
				}
			}
			
			die( 'ok<!--separate-->' . $a->ID );
		}
	}
}
die( 'failed' );

?>
