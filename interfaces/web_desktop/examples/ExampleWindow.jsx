/*©*****************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              * 
* Copyright 2014-2016 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************©*/

/* Simple example program for templates and windows */


// This is the main run function for jsx files and FriendUP js apps
Application.run = function( msg )
{
	// Make a new window with some flags
	var v = new View( {
		title: 'Welcome to FriendUP!',
		width: 640,
		height: 500
	} );
	
	// Load a file from the same dir as the jsx file is located
	var f = new File( 'Progdir:Template.html' );
	f.onLoad = function( data )
	{
		// Set it as window content
		v.setContent( data );
	}
	f.load();
	
	// On closing the window, quit.
	v.onClose = function()
	{
		Application.quit();
	}
}


