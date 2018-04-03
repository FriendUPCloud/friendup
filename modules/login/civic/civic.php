<?php

global $argv;

// Output with correct header
function foutput( $data, $header )
{
	FriendHeader( 'Content-Type: ' . $header );
	die( $data );
}

$translations = array();
function i18n( $string )
{
	if( isset( $translations[ $string ] ) )
	{
		return $translations[ '{' . $string . '}' ];
	}
	return ucfirst( str_replace( 'i18n_', '', $string ) );
}

// To fetch arguments
function getArgs( $arr )
{
	$r = explode( '&', $arr[ 2 ] );
	$args = new stdClass();
	foreach( $r as $rr )
	{
		$pair = explode( '=', $rr );
		$args->{$pair[0]} = $pair[1];
	}
	return $args;
}
$args = getArgs( $argv, 1 );

// Check args
if( isset( $args->fetch ) )
{
	if( $args->fetch == 'web3' )
	{
		
	}
	else if( $args->fetch == 'login' )
	{
		if( file_exists( 'modules/login/civic/scripts/login.js' ) )
		{
			foutput( file_get_contents( 'modules/login/civic/scripts/login.js' ), 'text/javascript' );
		}
	}
	foutput( 'Failed', 'text/html' );
}

// Fetch login template
$tpl = file_get_contents( 'modules/login/civic/templates/login.html' );

$replacements = array(
	'scriptpath' => $GLOBALS[ 'request_path' ],
	'welcome'    => i18n( 'i18n_welcome' )
);

foreach( $replacements as $k => $v )
{
	$tpl = str_replace( '{' . $k . '}', $v, $tpl );
}

foutput( $tpl, 'text/html' );

?>
