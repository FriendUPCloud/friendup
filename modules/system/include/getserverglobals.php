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
$files->eulaShortText = 'eulashort.html';
$files->eulaLongText = 'eulalong.html';
$files->logoImage = 'logoimage.png';

$s = new dbIO( 'FSetting' );
$s->Type = 'system';
$s->UserID = '0';
$s->Key = 'ServerGlobals';
$s->Load();

$js = json_decode( $s->Data );

if( $js )
{
	$json = new stdClass();
	$json->logoImage = '/graphics/logoblue.png';
	$json->eulaShort = file_get_contents( 'resources/webclient/templates/eula_short.html' );
	$json->eulaLong  = file_get_contents( 'resources/webclient/templates/eula.html' );
	$json->useLogoImage = $js->useLogoImage;
	$json->useEulaShort = $js->useEulaShort;
	$json->useEulaLong  = $js->useEulaLong;
	
	if( file_exists( 'cfg/serverglobals/' . $files->eulaShortText ) )
	{
		$json->eulaShort = file_get_contents( 'cfg/serverglobals/' . $files->eulaShortText );
	}
	if( file_exists( 'cfg/serverglobals/' . $files->eulaLongText ) )
	{
		$json->eulaLong = file_get_contents( 'cfg/serverglobals/' . $files->eulaLongText );
	}
	
	/*if( file_exists( 'cfg/serverglobals/' . $files->logoImage ) )
	{
		$json->eulaLong = file_get_contents( 'cfg/serverglobals/' . $files->logoImage );
	}*/
	
	die( 'ok<!--separate-->' . json_encode( $json ) );
}

die( 'ok<!--separate-->{}' );

?>
