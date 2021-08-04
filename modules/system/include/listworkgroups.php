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

/* List User's own workgroups */

if( !isset( $args->args->mode ) || $args->args->mode == 'own' )
{
	if( $rows = $SqlDatabase->fetchObjects( '
		SELECT g.* FROM FUserGroup g WHERE g.UserID=\'' . $User->ID . '\' ORDER BY g.Name ASC
	' ) )
	{
		die( 'ok<!--separate-->' . json_encode( $rows ) );
	}
}
else if( $args->args->mode == 'onlymember' )
{
	if( $rows = $SqlDatabase->fetchObjects( '
		SELECT g.* FROM FUserGroup g WHERE g.UserID !=\'' . $User->ID . '\' ORDER BY g.Name ASC
	' ) )
	{
		die( 'ok<!--separate-->' . json_encode( $rows ) );
	}
}

die( 'fail' );


?>
