<?php

include_once( 'php/classes/dbio.php' );
	
$Config = parse_ini_file( 'cfg/cfg.ini', true );

$SqlDatabase = new SqlDatabase();
$SqlDatabase->open( 
	$Config[ 'DatabaseUser' ][ 'host' ], 
	$Config[ 'DatabaseUser' ][ 'login' ], 
	$Config[ 'DatabaseUser' ][ 'password' ] 
) or die( 'FAILED TO CONNECT TO DATABASE' );

$SqlDatabase->SelectDatabase( $Config[ 'DatabaseUser' ][ 'dbname' ] );
register_shutdown_function( function(){
	global $SqlDatabase;
	$SqlDatabase->Close();
} );

$conference = explode( '/', $argv[1] );
$conference = array_pop( $conference );
$c = new dbIO( 'FShared' );
$c->Mode = $conference;
$c->SharedType = 'video-conference';
if( $c->Load() )
{
	$data = json_decode( $c->Data );
	// Only handle open conferences
	if( $data->Mode == 'open' )
	{
		die( '<h2>Welcome to ' . $data->name . '</h2>' );
	}
}
die( '<h2>The conference does not exist</h2><p>You are trying to access a conference that does not exist.</p>' );

?>
