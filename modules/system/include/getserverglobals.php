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

global $Logger;

require_once( 'php/classes/dbio.php' );

if( $level != 'Admin' ) die( '404' );

$files = new stdClass();
$files->eulaShortText   = 'eulashort.html';
$files->eulaLongText    = 'eulalong.html';
$files->extraLoginCSS   = 'extraLoginCSS.css';
$files->aboutTemplate   = 'aboutTemplate.html';
$files->logoImage       = 'logoimage.png';
$files->backgroundImage = 'dew.jpg';

$s          = new dbIO( 'FSetting' );
$s->Type    = 'system';
$s->UserID  = '0';
$s->Key     = 'ServerGlobals';
$s->Load();

$js = json_decode( $s->Data );

if( $js )
{
	// Try to copy just in case ------------------------------------------------
	
	$targets = [
		'resources/webclient/templates/eula_short.html',
		'resources/webclient/templates/eula.html',
		'resources/graphics/logoblue.png',
		'resources/graphics/dew.jpg',
		'resources/webclient/css/extraLoginCSS.css',
		'resources/webclient/templates/aboutTemplate.html'
	];
	$backups = [
		'cfg/serverglobals/eulashort_backup.html',
		'cfg/serverglobals/eulalong_backup.html',
		'cfg/serverglobals/logo_backup.png',
		'cfg/serverglobals/background_backup.jpg',
		'cfg/serverglobals/extraLoginCSS_backup.css',
		'cfg/serverglobals/aboutTemplate_backup.html'
	];
	$sources = [
		'cfg/serverglobals/eulashort.html',
		'cfg/serverglobals/eulalong.html',
		'cfg/serverglobals/logoimage.png',
		'cfg/serverglobals/dew.jpg',
		'cfg/serverglobals/extraLoginCSS.css',
		'cfg/serverglobals/aboutTemplate.html'
	];
	$keys = [ 
		'EulaShort', 
		'EulaLong', 
		'LogoImage', 
		'BackgroundImage', 
		'ExtraLoginCSS', 
		'AboutTemplate' 
	];
	$keyz = [ 
		'eulaShortText', 
		'eulaLongText', 
		'logoImage', 
		'backgroundImage', 
		'extraLoginCSS', 
		'aboutTemplate' 
	];

	for( $k = 0; $k < 6; $k++ )
	{
		$backup = $backups[ $k ];
		$target = $targets[ $k ];
		$source = $sources[ $k ];

		$kk = 'use' . $keys[ $k ];
	
		if( $js->{$kk} )
		{
			// Make sure we have a backup
			if( !file_exists( $backup ) )
			{
				if( !( copy( $target, $backup ) ) )
				{
					die( 'fail<!--separate-->{"message":"Could not write ' . $backup . ' backup.","response":-1}' );
				}
			}
			if( file_exists( $source ) )
			{
				// Write new data
				copy( $source, $target );
			}
			else
			{
				die( 'fail<!--separate-->{"message":"Could not overwrite ' . $target . ' with ' . $source . '.","response":-1}' );
			}
		}
		// Restore the backup
		else
		{
			if( file_exists( $backup ) )
			{
				$f = file_get_contents( $backup );
				if( $fp = fopen( $target, 'w+' ) )
				{
					fwrite( $fp, $f );
					fclose( $fp );
				}
			}
		}
	}
	
	// Output ------------------------------------------------------------------
	
	$json                     = new stdClass();
	$json->logoImage          = '/graphics/logoblue.png';
	$json->backgroundImage    = '/graphics/dew.jpg';
	$json->eulaShort          = file_get_contents( 'resources/webclient/templates/eula_short.html' );
	$json->eulaLong           = file_get_contents( 'resources/webclient/templates/eula.html' );
	$json->useLogoImage       = $js->useLogoImage;
	$json->useBackgroundImage = $js->useBackgroundImage;
	$json->useEulaShort       = $js->useEulaShort;
	$json->useEulaLong        = $js->useEulaLong;
	$json->useExtraLoginCSS   = $js->useExtraLoginCSS;
	$json->useAboutTemplate   = $js->useAboutTemplate;
	$json->extraLoginCSS      = $js->extraLoginCSS;
	$json->aboutTemplate      = $js->aboutTemplate;
	$json->liveAboutTemplate  = '/webclient/templates/aboutTemplate.html';
	
	if( file_exists( 'cfg/serverglobals/' . $files->eulaShortText ) )
	{
		$json->eulaShort = file_get_contents( 'cfg/serverglobals/' . $files->eulaShortText );
	}
	if( file_exists( 'cfg/serverglobals/' . $files->eulaLongText ) )
	{
		$json->eulaLong = file_get_contents( 'cfg/serverglobals/' . $files->eulaLongText );
	}
	
	die( 'ok<!--separate-->' . json_encode( $json ) );
}

die( 'ok<!--separate-->{}' );

?>
