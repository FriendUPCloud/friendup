<?php

/*©lgpl*************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************©*/

// Simple Corvo Data Driver
class DataDriver
{
	var $process = null;

	// Constructor
	function __construct( $process )
	{
		$this->process = $process;
	}
	
	// Processing!
	function process()
	{
		return false;
	}
}

?>
