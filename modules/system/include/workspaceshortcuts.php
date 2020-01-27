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
		if( $row->ValueString{0} == ':' )
		{
			$rs = substr( $row->ValueString, 1, strlen( $row->ValueString ) );
			if( !file_exists( 'resources/webclient/apps/' . $rs ) )
			{
				if( file_exists( 'repository/' . $rs ) )
				{
					if( file_exists( 'repository/' . $rs . '/icon.png' ) )
					{
						$row->ValueString .= ':repository';
					}
				}
			}
		}
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
