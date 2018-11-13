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

global $SqlDatabase;

if( $level != 'Admin' ) die( '404' );

if( $rows = $SqlDatabase->FetchObjects( '
	SELECT u.FullName, u.Name, u.SessionID, u.ID 
	FROM FUser u 
	' . ( isset( $args->args->userid ) && $args->args->userid ? '
	WHERE u.ID IN (' . $args->args->userid . ') 
	' : '' ) . '
	ORDER BY u.FullName ASC 
	' . ( isset( $args->args->limit ) && $args->args->limit ? '
	LIMIT ' . $args->args->limit . ' 
	' : '' ) . '
' ) )
{
	die( 'ok<!--separate-->' . json_encode( $rows ) );
}
die( 'fail' );

?>
