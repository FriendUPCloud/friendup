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

if( $level == 'Admin' )
{
	$app = $args->args->appname;
	$output = system( "killall -9 {$app}" );

	// TODO: Success tracking please..
	die( 'ok<!--separate-->' . $output );
}

die( 'fail' );

?>
