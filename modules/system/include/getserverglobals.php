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

$Logger->log( 'Get server globals' );

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
	$json->logoImage = '/webclient/graphics/logoblue.png';
	$json->eulaShort = file_get_contents( 'resources/templates/eula_short.html' );
	$json->eulaLong  = file_get_contents( 'resources/templates/eula.html' );
	
	if( $js->useEulaShort )
	{
		$json->eulaShort = file_get_contents( 'cfg/serverglobals/' . $files->eulaShortText );
	}
	if( $js->useEulaLong )
	{
		$json->eulaLong = file_get_contents( 'cfg/serverglobals/' . $files->eulaLongText );
	}
	
	$Logger->log( 'Here we go: ' );
	$Logger->log( print_r( $json, 1 ) );
	
	die( 'ok<!--separate-->' . json_encode( $json );
}

$Logger->log( 'No no no ' );
$Logger->log( $s->Data );

die( 'ok<!--separate-->{}' );

?>
