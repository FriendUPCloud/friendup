/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var mainWindow = null;

Application.run = function( msg )
{
	this.setApplicationName( 'Friend Create' );
	
	mainWindow = new View( {
		title: 'Friend Create',
		width: 900,
		height: 700,
		'min-width': 400,
		'min-height': 400
	} );
	
	mainWindow.onClose = function()
	{
		// TODO: Check if we haven't saved anything
		
		Application.quit();
	}
	
	var m = new File( 'Progdir:Templates/main.html' );
	m.i18n();
	m.onLoad = function( data )
	{
		mainWindow.setContent( data );
	}
	m.load();
	
}

Application.receiveMessage = function( msg )
{
	console.log( 'Msg: ', msg );
}

