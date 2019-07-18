<?php

$obj = $args->args;

$userid = $User->ID;
if( $level == 'Admin' && $args->args->userid )
{
	$userid = $args->args->userid;
}

// some checks for correctness of request before we do stuff...
if( !isset( $obj->Type ) ) die('fail<!--separate-->{"response":"edit filesystem failed"}' );
if( !file_exists( $fn = 'devices/DOSDrivers/' . $obj->Type . '/sysinfo.json' ) )	die('fail<!--seperate-->could not read config for chosen file system');

$o = file_get_contents( $fn );
if( !( $o = json_decode( $o ) ) ) die('fail<!--seperate-->could not read config for chosen file system');

// Admin filesystems can only be added by admin..
if( $o->group == 'Admin' && $level != 'Admin' )
	die('fail<!--separate-->{"response":"0","message":"unauthorised access attempt"}');

if( isset( $obj->ID ) && $obj->ID > 0 )
{
	// Support workgroups
	$groupID = '0';
	if( $group = $SqlDatabase->FetchObject( '
		SELECT ug.* FROM FUserGroup ug
			WHERE ug.Name = "' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->Workgroup ) . '"
			AND ug.Type = "Workgroup"
	' ) )
	{
		$groupID = $group->ID;
	}

	// TODO: Add support for updating EncryptedKey with PublicKey connected to user

	// Set optional or extra args
	$config = new stdClass();
	foreach( $obj as $k=>$v )
	{
		if( substr( $k, 0, 5 ) == 'conf.' )
		{
			$key = end( explode( '.', $k ) );
			$config->$key = $v;
		}
	}

	$SqlDatabase->query( $q = '
	UPDATE Filesystem
		SET `Name` = "' . mysqli_real_escape_string( $SqlDatabase->_link, $obj->Name ) . '",
		`UserID` = "' . $userid . '",
		`GroupID` = "' . $groupID . '",
		`KeysID` = "' . $obj->KeysID . '",
		`Server` = "' . mysqli_real_escape_string( $SqlDatabase->_link, $obj->Server ) . '",
		`Port` = "' . mysqli_real_escape_string( $SqlDatabase->_link, $obj->Port ) . '",
		`Path` = "' . mysqli_real_escape_string( $SqlDatabase->_link, $obj->Path ) . '",
		' . ( isset( $obj->Type ) ? ( '`Type` = "' . mysqli_real_escape_string( $SqlDatabase->_link, $obj->Type ) . '",' ) : '' ) . '
		`ShortDescription` = "' . mysqli_real_escape_string( $SqlDatabase->_link, $obj->ShortDescription ) . '",
		`Username` = "' . mysqli_real_escape_string( $SqlDatabase->_link, $obj->Username ) . '",
		'. ( isset($obj->Password) && $obj->Password != '' ? '`Password` = "' . mysqli_real_escape_string( $SqlDatabase->_link, $obj->Password ) . '",' : '' ) . '
		`Mounted` = "0",
		`Config` = "' . mysqli_real_escape_string( $SqlDatabase->_link, json_encode( $config ) ) . '"
	WHERE
		ID = \'' . intval( $obj->ID, 10 ) . '\'
	' );

	if( $obj->ID > 0 && isset( $obj->EncryptedKey ) )
	{
		// Don't use this ...
		/*$k = new DbIO( 'FKeys' );
		$k->RowType         = 'Filesystem';
		$k->RowID           = intval( $obj->ID, 10 );
		$k->UserID          = $userid;
		$k->IsDeleted 		= 0;
		if( !$k->Load() )
		{
			$k->DateCreated = date( 'Y-m-d H:i:s' );
		}
		$k->Type 			= $obj->Name;
		$k->Data            = $obj->EncryptedKey;
		$k->PublicKey       = $obj->PublicKey;
		$k->DateModified    = date( 'Y-m-d H:i:s' );
		$k->Save();*/
	}

	die( 'ok<!--separate-->' . $SqlDatabase->_lastError );
}
die( 'fail<!--separate-->{"response":"edit fs failed"}'  );

?>
