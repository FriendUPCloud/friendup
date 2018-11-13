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

// TODO: Add more security and checks!
$SqlDatabase->query( 'DELETE FROM FFileShared WHERE `Path`=\'' . mysqli_real_escape_string( $SqlDatabase->_link, $args->args->path ) . '\' AND `UserID`=\'' . $User->ID . '\' AND `DstUserSID`="Public"' );

die( 'ok' );

?>
