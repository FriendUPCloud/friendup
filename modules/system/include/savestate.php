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

$SqlDatabase->Query( '
	UPDATE FUserApplication SET `Data`=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->state ) . '\'
	WHERE
		UserID=\'' . $User->ID . '\' AND
		AuthID=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->authId ) .'\'
' );
die( 'ok' );

?>
