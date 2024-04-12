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
	die( 'WHITE LABEL READY' );
}

?>
