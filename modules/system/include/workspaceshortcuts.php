<?php

$out = [];

if( isset( $Config->WorkspaceShortcuts ) )
{
	$out = array_merge( $out, $Config->WorkspaceShortcuts );
}

if( $rows = $SqlDatabase->FetchObjects( '
	SELECT * FROM FMetaData 
	WHERE `Key`="Desktopshortcut" AND 
	      DataID=\'' . $User->ID . '\' AND 
	      DataTable="FUser"
' ) )
{
	foreach( $rows as $row )
	{
		$out[] = 'DesktopShortcut:' . (int)$row->ValueNumber . ':' . $row->ValueString;
	}
}

// Do we have shortcuts?
if( count( $out ) > 0 )
{
	die( 'ok<!--separate-->' . json_encode( $out ) );
}

die( 'fail<!--separate-->{"response":-1,"message":"This server has no default Workspace shortcuts"}' );

?>
