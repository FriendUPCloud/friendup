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

global $SqlDatabase, $User;

$query = 'SELECT * FROM FContact WHERE UserID=\'' . $User->ID . '\' AND ID=\'' . intval( $args->args->contactid, 10 ) . '\' LIMIT 1';

if( $row = $SqlDatabase->fetchObject( $query ) )
{
	die( 'ok<!--separate-->' . json_encode( $row ) );
}
else
{
	die( 'fail<!--separate-->{"response":-1,"message":"No such contact exist."}' );
}


?>
