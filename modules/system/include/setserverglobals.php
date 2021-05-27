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
require_once( 'php/classes/file.php' );

if( !file_exists( 'cfg/serverglobals' ) )
{
	mkdir( 'cfg/serverglobals' );
}

if( !file_exists( 'cfg/serverglobals' ) )
	die( '404' );

// Possible globals ------------------------------------------------------------

$files = new stdClass();
$files->eulaShortText = 'eulashort.html';
$files->eulaLongText = 'eulalong.html';
$files->logoImage = 'release_logo.png';
$files->backgroundImage = 'release_loginimage.jpg';
$files->aboutTemplate = 'aboutTemplate.html';
$files->extraLoginCSS = 'extraLoginCSS.css';

$possibilities = new stdClass();

$possibilities->eulaShortText   = '';
$possibilities->eulaLongText    = '';
$possibilities->logoImage       = '';
$possibilities->backgroundImage = '';
$possibilities->extraLoginCSS   = '';
$possibilities->aboutTemplate   = '';

$possibilities->useEulaShort       = false;
$possibilities->useEulaLong        = false;
$possibilities->useLogoImage       = false;
$possibilities->useBackgroundImage = false;
$possibilities->useExtraLoginCSS   = false;
$possibilities->useAboutTemplate   = false;

foreach( $args->args as $k=>$v )
{
	foreach( $possibilities as $p=>$poss )
	{
		if( $k == $p )
		{
			$possibilities->{$p} = $v;
		}
	}
}

// Save customized data --------------------------------------------------------

if( isset( $possibilities->eulaShortText ) )
{
	if( $f = fopen( 'cfg/serverglobals/' . $files->eulaShortText, 'w+' ) )
	{
		fwrite( $f, $possibilities->eulaShortText );
		fclose( $f );
	}
}

if( isset( $possibilities->eulaLongText ) )
{
	if( $f = fopen( 'cfg/serverglobals/' . $files->eulaLongText, 'w+' ) )
	{
		fwrite( $f, $possibilities->eulaLongText );
		fclose( $f );
	}
}

if( isset( $possibilities->logoImage ) && strstr( $possibilities->logoImage, ':' ) )
{
	$file = new File( $possibilities->logoImage );
	if( $file->Load() )
	{
		if( $f = fopen( 'cfg/serverglobals/' . $files->logoImage, 'w+' ) )
		{
			fwrite( $f, $file->GetContent() );
			fclose( $f );
		}
	}
}

if( isset( $possibilities->backgroundImage ) && strstr( $possibilities->backgroundImage, ':' ) )
{
	$file = new File( $possibilities->backgroundImage );
	if( $file->Load() )
	{
		if( $f = fopen( 'cfg/serverglobals/' . $files->backgroundImage, 'w+' ) )
		{
			fwrite( $f, $file->GetContent() );
			fclose( $f );
		}
	}
}

if( isset( $possibilities->extraLoginCSS ) && strstr( $possibilities->extraLoginCSS, ':' ) )
{
	$file = new File( $possibilities->extraLoginCSS );
	if( $file->Load() )
	{
		if( $f = fopen( 'cfg/serverglobals/' . $files->extraLoginCSS, 'w+' ) )
		{
			fwrite( $f, $file->GetContent() );
			fclose( $f );
		}
	}
}

if( isset( $possibilities->aboutTemplate ) && strstr( $possibilities->aboutTemplate, ':' ) )
{
	$file = new File( $possibilities->aboutTemplate );
	if( $file->Load() )
	{
		if( $f = fopen( 'cfg/serverglobals/' . $files->aboutTemplate, 'w+' ) )
		{
			fwrite( $f, $file->GetContent() );
			fclose( $f );
		}
	}
}

// Save use config -------------------------------------------------------------

$js = new stdClass();
$js->useEulaShort       = $possibilities->useEulaShort;
$js->useEulaLong        = $possibilities->useEulaLong;
$js->useLogoImage       = $possibilities->useLogoImage;
$js->useBackgroundImage = $possibilities->useBackgroundImage;
$js->useExtraLoginCSS   = $possibilities->useExtraLoginCSS;
$js->useAboutTemplate   = $possibilities->useAboutTemplate;
$js->aboutTemplate      = $args->args->aboutTemplate;
$js->extraLoginCSS      = $args->args->extraLoginCSS;

$s = new dbIO( 'FSetting' );
$s->Type = 'system';
$s->UserID = '0';
$s->Key = 'ServerGlobals';
$s->Load();
$s->Data = json_encode( $js );;
$s->Save();

// Activate! -------------------------------------------------------------------

$targets = [
	'resources/webclient/templates/eula_short.html',
	'resources/webclient/templates/eula.html',
	'resources/graphics/release_logo.png',
	'resources/graphics/release_loginimage.jpg',
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
	'cfg/serverglobals/release_logo.png',
	'cfg/serverglobals/release_loginimage.jpg',
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

//$Logger->log( 'Updating white label settings.' );

for( $k = 0; $k < 6; $k++ )
{
	$backup = $backups[ $k ];
	$target = $targets[ $k ];
	$source = $sources[ $k ];

	$kk = 'use' . $keys[ $k ];
	
	if( $possibilities->{$kk} )
	{
		// We may not have set the backup - then do that first..
		if( !file_exists( $backup ) && file_exists( $target ) )
		{
			copy( $target, $backup );
			//$Logger->log( '-> Copied original to backup, because we have no backup.' );
		}
		if( !file_exists( $target ) )
		{
			//$Logger->log( '-> Target ' . $target . ' does not exist!' );
		}
			
		// Make sure we have a backup
		// If the default login image was changed, make sure to delete the backup image when updating!
		if( !file_exists( $backup ) )
		{
			if( !( copy( $target, $backup ) ) )
			{
				die( 'fail<!--separate-->{"message":"Could not write ' . $backup . ' backup.","response":-1}' );
			}
			else
			{
				$Logger->log( '-> Copied ' . $target . ' to backup ' . $backup );
			}
		}
		if( file_exists( $source ) )
		{
			// Write new data
			copy( $source, $target );
			//$Logger->log( '-> Copied source ' . $source . ' over target ' . $target );
		}
		else
		{
			die( 'fail<!--separate-->{"message":"Could not (' . $backup . ') overwrite ' . $target . ' with ' . $source . '.","response":-1}' );
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
				//$Logger->log( '-> Restored backup ' . $backup . ' to target ' . $target );
				fwrite( $fp, $f );
				fclose( $fp );
			}
		}
	}
}

//$Logger->log( 'Done updating whitelabel settings.' );

die( 'ok<!--separate-->{"message":"Server globals were saved.","response":"1"}' );

?>
