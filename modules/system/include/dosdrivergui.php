<?php

if( !isset( $args->args->type ) ) die( 'fail<!--separate-->{"response":"dos driver gui failed"}'  );
if( isset( $args->args->component ) && isset( $args->args->language ) )
{
	if( $args->args->component == 'locale' )
	{
		$f = 'devices/DOSDrivers/' . $args->args->type . '/Locale/' . $args->args->language . '.lang';
		if( file_exists( $f ) )
		{
			die( 'ok<!--separate-->' . file_get_contents( $f ) );
		}
		die( 'fail<!--separate-->' . $f );
	}
}
if( $level == 'Admin' && file_exists( $f = ( 'devices/DOSDrivers/' . $args->args->type . '/gui_admin.html' ) ) )
{
	die( 'ok<!--separate-->' . file_get_contents( $f ) );
}
else if( file_exists( $f = ( 'devices/DOSDrivers/' . $args->args->type . '/gui.html' ) ) )
{
	die( 'ok<!--separate-->' . file_get_contents( $f ) );
}
die( 'fail<!--separate-->{"response":"dosdrivergui failed"}'  );

?>
