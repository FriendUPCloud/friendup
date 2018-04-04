<?php

if( $level != 'Admin' )
	die( '404' );

class FriendReference
{
}

$module = new FriendReference();

if( isset( $module->{$args->command} ) )
{
	$module->{$args->$command}();
}

die( 'fail' );

?>
