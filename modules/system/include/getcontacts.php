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

$query = 'SELECT * FROM FContact WHERE UserID=\'' . $User->ID . '\' ORDER BY Firstname ASC';

if( $rows = $SqlDatabase->fetchObjects( $query ) )
{
	die( 'ok<!--separate-->' . json_encode( $rows ) );
}
else
{
	die( 'fail<!--separate-->{"response":-1,"message":"No such contacts exist."}' );
}


?>
