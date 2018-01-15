<?php

if( isset( $Config->WorkspaceShortcuts ) )
{
	die( 'ok<!--separate-->' . json_encode( $Config->WorkspaceShortcuts ) );
}
die( 'fail<!--separate-->{"response":-1,"message":"This server has no default Workspace shortcuts"}' );

?>
