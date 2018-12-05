/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg, iface )
{
	var w = new View( {
		title: 'Mimetypes',
		width: 500,
		height: 600,
		id: 'Mimetypes_Window'
	} );
	
	w.onClose = function()
	{
		Application.quit();
	}
	
	var f = new File( 'Progdir:Templates/main.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		w.setContent( data );
	}
	f.load();
	
	// Set app in single mode
	this.setSingleInstance( true );	
}


