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
$possibilities = new stdClass();
$possibilities->eulaShortText = '';
$possibilities->eulaLongText = '';
$possibilities->logoImage = '';
$possibilities->useEulaShort = false;
$possibilities->useEulaLong = false;
$possibilities->useLogoImage = false;

foreach( $args->args as $k=>$v )
{
	foreach( $possibilities as $p=>$poss )
	{
		if( $k == $p )
		{
			$possibilities->$p = $v;
		}
	}
}

if( $possibilities->eulaShortText )
{
	if( $f = fopen( 'cfg/serverglobals/' . $files->eulaShortText, 'w+' ) )
	{
		fwrite( $f, $possibilities->eulaShortText );
		fclose( $f );
	}
}

if( $possibilities->eulaLongText )
{
	if( $f = fopen( 'cfg/serverglobals/' . $files->eulaLongText, 'w+' ) )
	{
		fwrite( $f, $possibilities->eulaLongText );
		fclose( $f );
	}
}

if( $possibilities->logoImage )
{
	if( $f = fopen( 'cfg/serverglobals/' . $files->logoImage, 'w+' ) )
	{
		fwrite( $f, $possibilities->logoImage );
		fclose( $f );
	}
}


$js = new stdClass();
$js->useEulaShort = $possibilities->useEulaShort;
$js->useEulaLong = $possibilities->useEulaLong;
$js->useLogoImage = $possibilities->useLogoImage;

$s = new dbIO( 'FSetting' );
$s->Type = 'system';
$s->UserID = '0';
$s->Key = 'ServerGlobals';
$s->Load();
$s->Data = json_encode( $js );;
$s->Save();

// Activate!
if( $possibilities->useEulaShort )
{
}

// Activate!
if( $possibilities->useEulaLong )
{
}

// Activate!
if( $possibilities->useLogoImage )
{
}

die( 'ok<!--separate-->{"message":"Server globals were saved.","response":"1"}' );

?>
