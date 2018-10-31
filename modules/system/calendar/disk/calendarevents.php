<?php

include_once( 'php/classes/file.php' );

$server = $source->Server;

$door = new File( $server );
if( $door->Load() )
{
	$os = json_decode( $door->GetContent() );
}

?>
