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

class Logger
{
	var $path = 'log/php_log.txt';
	function log( $string )
	{
		if( $f = fopen( $this->path, 'a+' ) )
		{
			fwrite( $f, $string, strlen( $string ) );
			fwrite( $f, "\n", 1 );
			fclose( $f );
		}
	}
}

// Make a global object
$GLOBALS['Logger'] = new Logger();

?>
