<?php

$SqlDatabase->query( '
	DELETE FROM FSetting WHERE `Key`="themedata_friendup12" AND UserID=\'' . $User->ID . '\'
' );

die( 'ok' );

?>
