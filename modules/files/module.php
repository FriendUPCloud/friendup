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

global $args, $SqlDatabase, $User, $Config;

include_once( 'php/friend.php' );
include_once( 'php/classes/door.php' );
include_once( 'php/classes/logger.php' );

// Found it?
if( $Filesystem = new Door( $args ) )
{
	// Could be we have an argument with a destination? Let's check
	$DestFilesystem = false;
	if( isset( $args->args ) && isset( $args->args->to ) )
	{
		$DestFilesystem = new Door( $args->args->to );
	}
	unset( $identifier );
	
	// TODO: Will be deprecated to be here
	$test = 'modules/files/include/door_' . strtolower( $Filesystem->Type ) . '.php';
	
	// New way to include "driver" assets
	
	if( !file_exists( $test ) )
		$test = 'devices/DOSDrivers/' . $Filesystem->Type . '/door.php';
	
	if( file_exists( $test ) )
	{
		$door = false;
		
		// Get the path from arguments
		// TODO: Make uniform
		$path = false;
		if( isset( $args->path ) )
			$path = str_replace( '::', ':', $args->path );
		else if ( isset( $args->fileInfo->Path ) )
			$path = str_replace( '::', ':', $args->fileInfo->Path );
		else if( isset( $args->args ) && isset( $args->args->path ) )
			$path = str_replace( '::', ':', $args->args->path );
		else if( isset( $args->args ) && isset( $args->args->Path ) )
			$path = str_replace( '::', ':', $args->args->Path );
		else if( isset( $args->args->from ) )
			$path = str_replace( '::', ':', $args->args->from );
		
		// Include the correct door class and instantiate it
		include( $test );

		if( !$door ) die( 'fail<!--separate-->{"response":"no door found"}' );
		
		// Set sessionid
		if( isset( $args->sessionid ) )
		{
			$door->SetAuthContext( 'sessionid', $args->sessionid );
		}
		
		// Execute dos action
		if( $result = $door->dosAction( $args ) )
		{
			die( $result );
		}
		else
		{
			die( 'fail<!--separate-->{"response":"dosaction yielded no response"}' );
		}
	}
	else die( 'fail<!--separate-->{"response":"filesystem does not exist"}' );
}

die( 'fail<!--separate-->{"response":"no filesystem response available"}' );

?>
