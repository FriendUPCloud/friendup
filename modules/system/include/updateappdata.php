<?php
/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

if( $row = $SqlDatabase->FetchObject( '
	SELECT * FROM FApplication WHERE `Name` = "' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->application ) . '"
' ) )
{
	if( $ur = $SqlDatabase->FetchObject( '
		SELECT * FROM FUserApplication WHERE UserID=\'' . $User->ID . '\' AND ApplicationID=\'' . $row->ID . '\'
	' ) )
	{
		$conf = json_decode( $ur->Data );
		
		$new = json_decode( $args->args->data );
		foreach( $new as $k=>$v )
		{
			$conf->$k = $v;
		}
		
		$SqlDatabase->Query( '
			UPDATE FUserApplication SET `Data`="' . mysqli_real_escape_string( $SqlDatabase->_link, json_encode( $conf ) ) . '" WHERE ID=\'' . $ur->ID . '\' AND UserID=\'' . $User->ID . '\'
		' );
		die( 'ok' );
	}
	die( 'fail' );
}

?>
