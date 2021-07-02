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

error_reporting( E_ALL & ~E_NOTICE );
ini_set( 'display_errors', 1 );

if( $args->command )
{
	
	switch( $args->command )
	{
		
		case 'generateinvite':
			
			die( '[generateinvite] ' . print_r( $args,1 ) );
			
			break;
			
		case 'getinvites':
			
			die( '[getinvites] ' . print_r( $args,1 ) );
			
			break;
			
		case 'deleteinvites':
		
			die( '[deleteinvites] ' . print_r( $args,1 ) );
			
			break;
	
	}
	
}

die( '{"result":"fail","data":{"response":"fail command not recognized ..."}}' );

?>
