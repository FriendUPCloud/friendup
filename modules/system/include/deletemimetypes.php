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

$SqlDatabase->query( '
	DELETE FROM FSetting 
	WHERE 
		UserID=\'' . $User->ID . '\' AND 
		`Data`=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->executable ) . '\' AND 
		`Type`=\'mimetypes\'
' );
die( 'ok' );


?>
