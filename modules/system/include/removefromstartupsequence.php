<?php

$s = new dbIO( 'FSetting' );
$s->Type = 'system';
$s->Key = 'startupsequence';
$s->UserID = $User->ID;
if( $s->Load() )
{
	$json = false;
	$list = [];
	
	if( $d = json_decode( $s->Data ) )
		$list = $d;
	
	$out = [];
	
	foreach( $list as $l )
	{
		if( trim( $l ) != trim( $args->args->item ) )
		{
			$out[] = $l;
		}
	}
	
	$s->Data = json_encode( $out );
	$s->Save();
	
	
	die( 'ok<!--separate-->{"response":1,"message":"Startup sequence was saved"}' );
}
die( 'fail<!--separate-->{"response":0,"message":"Startup sequence was not saved due to error"}' );

?>
