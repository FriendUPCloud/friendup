<?php

$userid = $User->ID;
if( $level == 'Admin' && $args->args->userid )
{
	$userid = $args->args->userid;
}

// Find by ID
if( isset( $args->args->id ) )
{
	$aid = intval( $args->args->id );
	
	if( $row = $SqlDatabase->FetchObject( '
		SELECT f . * , u.Name AS Workgroup
		FROM Filesystem f
		LEFT JOIN FUserGroup u ON ( u.ID = f.GroupID AND u.Type =  "Workgroup" )
		WHERE
			f.UserID=\'' . $userid . '\' AND f.ID=\'' . $aid . '\'
		LIMIT 1
	' ) )
	{
		if( $key = $SqlDatabase->FetchObject( '
			SELECT *
			FROM
				`FKeys` k
			WHERE
					k.UserID = \'' . $userid . '\'
				AND k.RowType = "Filesystem"
				AND k.RowID = \'' . $aid . '\'
				AND k.IsDeleted = "0"
			ORDER
				BY k.ID DESC
			LIMIT 1
		' ) )
		{
			$row->Key = $key;
		}

		die( 'ok<!--separate-->' . json_encode( $row ) );
	}
}
// Find by devname
else if( isset( $args->args->devname ) )
{
	$devname = mysqli_real_escape_string( $SqlDatabase->_link, $args->args->devname );
	if( $row = $SqlDatabase->FetchObject( '
		SELECT f.* , u.Name AS Workgroup
		FROM Filesystem f
		LEFT JOIN FUserGroup u ON ( u.ID = f.GroupID AND u.Type = "Workgroup" )
		WHERE
			f.UserID=\'' . $userid . '\' AND f.Name="' . $devname . '"
		LIMIT 1
	' ) )
	{
		if( $key = $SqlDatabase->FetchObject( '
			SELECT *
			FROM
				`FKeys` k
			WHERE
					k.UserID = \'' . $userid . '\'
				AND k.RowType = "Filesystem"
				AND k.RowID = \'' . intval( $row->ID ) . '\'
				AND k.IsDeleted = "0"
			ORDER
				BY k.ID DESC
			LIMIT 1
		' ) )
		{
			$row->Key = $key;
		}

		die( 'ok<!--separate-->' . json_encode( $row ) );
	}
}

die( 'fail<!--separate-->{"response":"-1","message":"Could not find filesystem."}' );

?>
