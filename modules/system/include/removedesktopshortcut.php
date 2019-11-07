<?php

$d = new dbIO( 'FMetaData' );
$d->Key = 'Desktopshortcut';
$d->DataID = $User->ID;
$d->DataTable = 'FUser';
$d->ValueString = $args->args->shortcut;
if( $d->Load() )
{
	$d->Delete();
	die( 'fail<!--separate-->{"response":1,"message":"Deleted shortcut."}' );
}
die( 'fail<!--separate-->{"response":0,"message":"Failed to delete desktop shortcut."}' );

?>
