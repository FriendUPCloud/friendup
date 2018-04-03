<?php

global $Logger;

$Logger->log( 'Got save file request..' );
$Logger->log( print_r( $args, 1 ) );

if( isset( $args->p ) )
{
	if( is_string( $args->p ) )
		$args->p = json_decode( $args->p );
	$p = $args->p;

	if( isset( $args->path ) )
	{
		$d = new File( $p->source );
		$data = base64_decode( $p->versions[0]->data );
		if( !$data ) $data = false;
		if( $d->Save( $data ) )
		{
			die( 'ok<!--separate-->{"response":1,"message":"File saved."}' );
		}
	}
}
die( 'fail<!--separate-->{"response":0,"message":"Could not save file."}' );

?>
