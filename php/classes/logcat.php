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

// Meow, I log your output to a file and console!
class LogCat
{
	var $_file;
	var $_color; // Todo when there's nothing else to do...
	var $_tag;
	var $_buffer;
	var $_save = false;
	var $_prevBufferSize = 0;
	
	public function __construct( $save = false )
	{
		$this->_save = $save;
	}
	
	// Open/create the logfile
	public function open( $filename )
	{
		$this->_file = fopen( $filename, 'a+' );
	}

	// Set the status to info
	public function info( $msg = null, $next = false )
	{
		$this->_color = "1;36";
		$this->_tag = "INFO";
		if($msg)
			$this->log( $msg, $next );
		$this->printConsole();
	}

	// Set the status to error
	public function error( $msg = null, $next = false )
	{
		$this->_color = "1;31";
		$this->_tag = "ERR ";
		if($msg)
			$this->log( $msg, $next );
		$this->printConsole();
	}

	// Set the status to OK
	public function ok( $msg = null, $next = false )
	{
		$this->_color = "1;32";
		$this->_tag = " OK ";
		if($msg)
			$this->log( $msg, $next );
		$this->printConsole();
	}

	// Set the status to waiting
	public function waiting( $msg = null, $next = false )
	{
		$this->_color = "1;37";
		$this->_tag = "    ";
		if($msg)
			$this->log( $msg, $next );
		$this->printConsole();
	}

	// Set the log message and write previous
	public function log( $msg, $next = false )
	{
		$this->_buffer = $msg;
		if( $next )
			$this->next();
	}

	// Call this when the message is done
	public function next()
	{
		if($this->_buffer){
			$this->write();
			$this->_buffer .= "\n";
			$this->printConsole();
		}
		$this->_tag = "";
		$this->_buffer = "";
	}

	// Write the log to file
	public function write()
	{
		if( $this->_save ) fwrite( $this->_file, ( $this->_tag ? "[".$this->_tag."] " : "" ).$this->_buffer."\n" );
	}

	// Print the buffer to screen
	public function printConsole()
	{
		$size = $this->_prevBufferSize - strlen( $this->_buffer );
		echo "\r".( $this->_tag ? "[\033[".$this->_color."m".$this->_tag."\033[0m] " : "" ).$this->_buffer.($size>0 ? str_repeat( ' ', $size) : '' );
		$this->_prevBufferSize = strlen( $this->_buffer );
	}

	function __destruct()
	{
		$this->write();
		fclose( $this->_file );
	}
}

?>
