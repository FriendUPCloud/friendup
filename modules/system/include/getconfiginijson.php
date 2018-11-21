<?php

if( $level != 'Admin' ) die( '404' );

$f = parse_ini_file( 'cfg/cfg.ini' );
die( 'ok<!--separate-->' . json_encode( $f ) );

?>
