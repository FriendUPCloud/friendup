<?php

/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

require( 'nexus.php' );

if( !isset( $nexus ) )
{
	die( 'fail<!--separate-->{"response":-1,"message":"No nexus!"}' );
}

if( method_exists( $nexus, $args->command ) )
{
	$response = $nexus->{$args->command}( $args->args );
	if( $response )
		die( $response );
}

die( 'fail<!--separate-->{"response":-1,"message":"You reached our catchall response! Good!"}' );

?>
