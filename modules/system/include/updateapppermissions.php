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
	SELECT * FROM FApplication WHERE `Name` = "' . $args->args->application . '" AND UserID=\'' . $User->ID . '\' 
' ) )
{
	if( isset( $args->args->permissions ) )
	{
		// Collect permissions in a string
		$app = new dbIO( 'FUserApplication' );
		$app->ApplicationID = $row->ID;
		$app->UserID = $User->ID;
		$app->Load();
		if( $app->ID > 0 )
		{
			$app->Permissions = $args->args->permissions;
			$app->Data = $args->args->data;
			$app->Save();
			die( 'ok<!--separate-->' . $args->args->data );
		}
	}
}
die( 'fail<!--separate-->{"response":"fatal error in updateapppermissions"}' );

?>
