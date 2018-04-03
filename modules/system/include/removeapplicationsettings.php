<?php

global $SqlDatabase;

$nam = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->appName );
$l = new DbIO( 'FApplication' );
$l->Name = $args->args->appName;
$l->UserID = $User->ID;
if( $l->Load() )
{
	if( $SqlDatabase->query( 'DELETE FROM `FUserApplication` WHERE `UserID`=\'' . $User->ID . '\' AND `ApplicationID`=\'' . $l->ID . '\'' ) )
	{
		$l->Delete();
	}
	die( 'ok' );
}
die( 'fail' );


?>
