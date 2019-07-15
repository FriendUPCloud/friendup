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

require_once( 'php/include/permissions.php' );

if( file_exists( 'modules/system/permissions/' . $args->args->type . '.php' ) )
{
	include( 'modules/system/permissions/' . $args->args->type . '.php' );
}

die( 'fail<!--separate-->{"message":"Permission denied.","reason":"No such type of permission","response":-1}' );

?>
