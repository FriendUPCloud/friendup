<?php

global $argv, $argc;

// Read what we need from the conf
$conf = file_get_contents( 'cfg/cfg.ini' );
$conf = explode( "\n", $conf );
$label = $value = $token = '';
foreach( $conf as $line )
{
	$line = trim( $line );
	if( $line )
	{
		$pair = explode( '=', $line );
		if( $pair > 0 )
		{
			$label = trim( $pair[0] );
			$value = trim( $pair[1] );
			if( $value[0] == '"' )
				$value = substr( $value, 1, strlen( $value ) - 2 );
			if( $label == 'ServerToken' )
				$token = $value;
		}
	}
}
unset( $conf );

// If we have our server token, then
if( $token )
{
	$argv[2] .= '&servertoken=' . $token;
	include_once( 'php/friend.php' );
	include_once( 'php/file.php' );
	
	if( isset( $args->app ) )
	{
		if( isset( $args->file ) )
		{
			if( $args->file == 'logo' )
			{
				if( file_exists( 'repository/' . $args->app . '/_white-label-logo.png' ) )
				{
					FriendHeader( 'Content-type: image/png' );
					die( readfile( 'repository/' . $args->app . '/_white-label-logo.png' ) );
				}
				else if( file_exists( 'repository/' . $args->app . '/_white-label-logo.jpg' ) )
				{
					FriendHeader( 'Content-type: image/jpeg' );
					die( readfile( 'repository/' . $args->app . '/_white-label-logo.jpg' ) );
				}
			}
			else if ( $args->file == 'background' )
			{
				if( file_exists( 'repository/' . $args->app . '/_white-label-background.png' ) )
				{
					FriendHeader( 'Content-type: image/png' );
					die( readfile( 'repository/' . $args->app . '/_white-label-background.png' ) );
				}
				else if( file_exists( 'repository/' . $args->app . '/_white-label-background.jpg' ) )
				{
					FriendHeader( 'Content-type: image/jpeg' );
					die( readfile( 'repository/' . $args->app . '/_white-label-background.jpg' ) );
				}
			}
		}
		
		$out = new stdClass();
		if( file_exists( 'repository/' . $args->app . '/_white-label-background.png' ) )
		{
			$out->Background = '/wl/?app=' . $args->app . '&file=background';
		}
		else if( file_exists( 'repository/' . $args->app . '/_white-label-background.jpg' ) )
		{
			$out->Background = '/wl/?app=' . $args->app . '&file=background';
		}
		if( file_exists( 'repository/' . $args->app . '/_white-label-logo.png' ) )
		{
			$out->Logo = '/wl/?app=' . $args->app . '&file=logo';
		}
		else if( file_exists( 'repository/' . $args->app . '/_white-label-logo.jpg' ) )
		{
			$out->Logo = '/wl/?app=' . $args->app . '&file=logo';
		}
		die( json_encode( $out ) );
	}		
	die( 'WHITE LABEL READY' );
}

?>
