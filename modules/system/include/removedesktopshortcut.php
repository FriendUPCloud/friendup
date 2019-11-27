<?php

if( isset( $args->args->shortcut ) )
{
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
}
else if( isset( $args->args->shortcuts ) )
{
	$num = 0;
	foreach( $args->args->shortcuts as $shortcut )
	{
		$d = new dbIO( 'FMetaData' );
		$d->Key = 'Desktopshortcut';
		$d->DataID = $User->ID;
		$d->DataTable = 'FUser';
		$d->ValueString = $shortcut;
		if( $d->Load() )
		{
			$d->Delete();
			$num++;
		}
	}
	die( 'fail<!--separate-->{"response":1,"message":"Deleted shortcuts.","affected_shortcuts":' . $num . '}' );
}
die( 'fail<!--separate-->{"response":0,"message":"Failed to delete desktop shortcut."}' );

?>
