<?php

if( file_exists( 'repository/' . $args->i . '/icon.png' ) )
{
	FriendHeader( 'Content-Type: image/jpeg' );
	die( file_get_contents( 'repository/' . $args->i . '/icon.png' ) );
}

// Fallback
FriendHeader( 'Content-Type: image/jpeg' );
die( file_get_contents( 'resources/themes/friendup/gfx/icons/icon_blank_1.png' ) );

?>
