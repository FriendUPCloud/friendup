/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Initialize the game!
Application.run = function()
{
	var v = new Screen( {
		title: 'Space Age'
	} );
	
	v.onClose = function()
	{
		Application.quit();
	}
	
	// Set up the main template
	var f = new File( 'Progdir:Templates/game.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
	
	this.screen = v;
}


// Handle all root level events
var EventHandler = {
	setScreenTitle: function( msg )
	{
		if( msg.data )
		{
			Application.screen.setFlag( 'title', msg.data );
		}
	}
};

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	if( EventHandler[ msg.command ] )
	{
		EventHandler[ msg.command ]( msg );
	}
}

