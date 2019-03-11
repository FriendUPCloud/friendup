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

if( $level != 'Admin' ) die( '404' );

require_once( 'php/classes/dbio.php' );

if( !file_exists( 'cfg/serverglobals' ) )
{
	mkdir( 'cfg/serverglobals' );
}

if( !file_exists( 'cfg/serverglobals' ) )
	die( '404' );

// Possible globals
$files = new stdClass();
$files->eulaShortText = 'eulashort.html';
$files->eulaLongText = 'eulalong.html';
$files->logoImage = 'logoimage.png';
$files->backgroundImage = 'leaves.jpg';
$possibilities = new stdClass();
$possibilities->eulaShortText = '';
$possibilities->eulaLongText = '';
$possibilities->logoImage = '';
$possibilities->backgroundImage = '';
$possibilities->useEulaShort = false;
$possibilities->useEulaLong = false;
$possibilities->useLogoImage = false;
$possibilities->useBackgroundImage = false;

$Logger->log( 'Getting arguments.' );

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

if( isset( $possibilities->logoImage ) )
{
	$possibilities->logoImage = base64_decode( $possibilities->logoImage );
	if( $f = fopen( 'cfg/serverglobals/' . $files->logoImage, 'w+' ) )
	{
		fwrite( $f, $possibilities->logoImage );
		fclose( $f );
	}
}

if( isset( $possibilities->backgroundImage ) )
{
	$possibilities->backgroundImage = base64_decode( $possibilities->backgroundImage );
	if( $f = fopen( 'cfg/serverglobals/' . $files->backgroundImage, 'w+' ) )
	{
		fwrite( $f, $possibilities->backgroundImage );
		fclose( $f );
	}
}


// Save use config -------------------------------------------------------------

$js = new stdClass();
$js->useEulaShort = $possibilities->useEulaShort;
$js->useEulaLong = $possibilities->useEulaLong;
$js->useLogoImage = $possibilities->useLogoImage;
$js->useBackgroundImage = $possibilities->useBackgroundImage;

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
	'resources/graphics/logoblue.png',
	'resources/graphics/leaves.jpg'
];
$backups = [
	'cfg/serverglobals/eulashort_backup.html',
	'cfg/serverglobals/eulalong_backup.html',
	'cfg/serverglobals/logo_backup.png',
	'cfg/serverglobals/background_backup.jpg'
];

$keys = [ 'EulaShort', 'EulaLong', 'LogoImage', 'BackgroundImage' ];
$keyz = [ 'eulaShortText', 'eulaLongText', 'logoImage', 'backgroundImage' ];

for( $k = 0; $k < 3; $k++ )
{
	$backup = $backups[ $k ];
	$target = $targets[ $k ];

	$kk = 'use' . $keys[ $k ];
	
	if( $possibilities->{$kk} )
	{
		// Make sure we have a backup
		if( !file_exists( $backup ) )
		{
			$f = file_get_contents( $target );
			if( $fp = fopen( $backup, 'w+' ) )
			{
				fwrite( $fp, $f );
				fclose( $fp );
			}
			else
			{
				die( 'fail<!--separate-->{"message":"Could not write ' . $kk . ' backup.","response":-1}' );
			}
		}
		if( $fp = fopen( $target, 'w+' ) )
		{
			// Write new data
			$kstring = $keyz[ $k ];
			fwrite( $fp, $possibilities->{$kstring} );
			fclose( $fp );
		}
		else
		{
			die( 'fail<!--separate-->{"message":"Could not overwrite ' . $kk . '.","response":-1}' );
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

die( 'ok<!--separate-->{"message":"Server globals were saved.","response":"1"}' );

?>
