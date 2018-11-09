/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var mainView;

Application.run = function( msg )
{
	mainView = new View( {
		width: 1000,
		height: 700,
		title: 'Your calendars'
	} );
	
	var f = new File( 'Progdir:Templates/main.html' );
	f.replacements = { source: 'https://agendav.localhost' };
	f.i18n();
	f.onLoad = function( data )
	{
		mainView.setContent( data );
	}
	f.load();
	
	mainView.onClose = function()
	{
		Application.quit();
	}
}

