<?php

// Find by devname
if( isset( $args->args->devname ) )
{
	$devname = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->devname );
	if( $row = $SqlDatabase->FetchObject( '
		SELECT f . * , u.Name AS Workgroup
		FROM Filesystem f
		LEFT JOIN FUserGroup u ON ( u.ID = f.GroupID AND u.Type =  "Workgroup" )
		WHERE
			f.UserID=\'' . $User->ID . '\' AND f.Name="' . $devname . '"
		LIMIT 1
	' ) )
	{
		$l = new dbIO( 'Filesystem' );
		$l->UserID = $User->ID;
		$l->ID = $row->ID;
		if( $l->load() )
		{
			$l->Mounted = '-1';
			$l->save();
			die( 'ok<!--separate-->{"response":"1","message":"Disk was disabled"}' );
		}		
	}
}

die( 'fail<!--separate-->{"response":"0","message":"Could not disable disk"}' );

?>
