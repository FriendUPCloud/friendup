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

$s = new dbIO( 'FSetting' );
$s->Type   = 'system';
$s->UserID = '0';
$s->Key    = 'ServerGlobals';
$s->Load();

$js = json_decode( $s->Data );

if( $js )
{
	$json                     = new stdClass();
	$json->logoImage          = '/graphics/logoblue.png';
	$json->backgroundImage    = '/graphics/leaves.jpg';
	$json->eulaShort          = file_get_contents( 'resources/webclient/templates/eula_short.html' );
	$json->eulaLong           = file_get_contents( 'resources/webclient/templates/eula.html' );
	$json->useLogoImage       = $js->useLogoImage;
	$json->useBackgroundImage = $js->useBackgroundImage;
	$json->useEulaShort       = $js->useEulaShort;
	$json->useEulaLong        = $js->useEulaLong;
	$json->useExtraLoginCSS   = $js->useExtraLoginCSS;
	$json->useAboutTemplate   = $js->useAboutTemplate;
	
	if( file_exists( 'cfg/serverglobals/' . $files->eulaShortText ) )
	{
		$json->eulaShort = file_get_contents( 'cfg/serverglobals/' . $files->eulaShortText );
	}
	if( file_exists( 'cfg/serverglobals/' . $files->eulaLongText ) )
	{
		$json->eulaLong = file_get_contents( 'cfg/serverglobals/' . $files->eulaLongText );
	}
	if( file_exists( 'cfg/serverglobals/' . $files->extraLoginCSS ) )
	{
		$json->extraLoginCSS = file_get_contents( 'cfg/serverglobals/' . $files->extraLoginCSS );
	}
	if( file_exists( 'cfg/serverglobals/' . $files->aboutTemplate ) )
	{
		$json->aboutTemplate = file_get_contents( 'cfg/serverglobals/' . $files->aboutTemplate );
	}
	
	die( 'ok<!--separate-->' . json_encode( $json ) );
}

die( 'ok<!--separate-->{}' );

?>
