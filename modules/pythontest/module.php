<?php

global $args, $User;

include_once( 'php/friend.php' );

$output = '';
$retval = '';
exec( "python modules/pythontest/file.py", $output, $retval );

die( 'ok<!--separate-->' . join( "\n", $output ) );

?>
