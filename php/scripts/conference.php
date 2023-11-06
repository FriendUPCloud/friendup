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
if( substr( $conference, -4, 4 ) == '.css' )
{
	die( file_get_contents( __DIR__ . '/../templates/convos/' . $conference ) );
}
if( file_exists( __DIR__ . '/../templates/convos/basetemplate.html' ) )
{
	$tpl = file_get_contents( __DIR__ . '/../templates/convos/basetemplate.html' );
}
else
{
	die( 'Error.' );
}

$c = new dbIO( 'FShared' );
$c->Mode = $conference;
$c->SharedType = 'video-conference';
if( $c->Load() )
{
	$data = json_decode( $c->Data );
	// Only handle open conferences
	if( $data->Mode == 'open' )
	{
		$tpl = str_replace( '{title}', 'Welcome to ' . $data->name, $tpl );
		$tpl = str_replace( '{content}', '<h2>Welcome to ' . $data->name . '</h2>', $tpl );
		die( $tpl );
	}
}
$tpl = str_replace( '{title}', 'No such conference', $tpl );
$tpl = str_replace( '{content}', '<h2>The conference does not exist</h2><p>You are trying to access a conference that does not exist.</p>', $tpl );
die( $tpl );

?>
