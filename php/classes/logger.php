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

// For adding a queued message
class LogSlot
{
	function __construct( $log, $message )
	{
		$this->message = $message;
		$this->log = $log;
	}
	function resolve( $state, $message = false )
	{
		$response = $state == true ? 'OK' : (
			$state == false ? 'FAIL' : $state
		);
		$color = '1;36';
		if( $state == false )
		{
			$color = '1;31';
		}
		else if( $state == true )
		{
			$color = '1;32';
		}
		else
		{
			$color = '1;37';
		}
		
		$this->log->log( "[\033[{$color}m" . str_pad( $response, 8, ' ', STR_PAD_BOTH ) . "\033[0m] " .
			$this->message . ( $message ? ( " (\033[{$color}m{$message}\033[0m)" ) : '' ), false );
	}
}

// Main logger object
class Logger
{
	var $path = 'log/php_log.txt';
	var $context = '';
	function log( $string, $padding = true )
	{
		$context_str = '';
		if( $this->context )
			$context_str = '(' . $this->context . ') ';
		if( $f = fopen( $this->path, 'a+' ) )
		{
			if( $padding == true )
				$string = "[\033[1;36m" . str_pad( 'LOG', 8, ' ', STR_PAD_BOTH ) . "\033[0m] " . $context_str . $string;
			else $string = $context_str . $string;
			fwrite( $f, $string, strlen( $string ) );
			fwrite( $f, "\n", 1 );
			fclose( $f );
		}
	}
	function addSlot( $message )
	{
		$slot = new LogSlot( $this, $message );
		return $slot;
	}
}

// Make a global object
$GLOBALS['Logger'] = new Logger();

?>
