<?php

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
	
	die( 'ok<!--separate-->' . json_encode( $json );
}

die( 'ok<!--separate-->{}' );

?>
