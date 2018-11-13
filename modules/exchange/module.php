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

include( 'php/friend.php' );

if( isset( $args->command ) )
{
	switch( $args->command )
	{
		case 'help':
			die( 'ok<!--separate-->{"Commands":' . json_encode( array( 'help' ) ) . '}' );
			break;
	}
}
die( 'fail' );

?>
