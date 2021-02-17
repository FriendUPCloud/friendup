<?php

global $SqlDatabase;

$nam = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->appName );
$l = new DbIO( 'FApplication' );
$l->Name = $args->args->appName;
$l->UserID = $User->ID;
if( $l->Load() )
{
	$ua = new DbIO( 'FUserApplication' );
	$ua->UserID = $UserID;
	$ua->ApplicationID = $l->ID;
	if( $ua->Load() )
	{
		if( $SqlDatabase->query( 'DELETE FROM `FUserApplication` WHERE `UserID`=\'' . $User->ID . '\' AND `ApplicationID`=\'' . $l->ID . '\'' ) )
		{
			$l->Delete();
		}
		if( $SqlDatabase->query( 'DELETE FROM `FAppSession` WHERE `UserApplicationID=\'' . $ua->ID . '\'' ) )
		{

		}
		$ua->Delete();
	}
	die( 'ok' );
}
die( 'fail' );


?>
