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
	var v = new View( {
		title: i18n( 'i18n_startup_appname' ),
		width: 500,
		height: 500
	} );
	
	var f = new File( 'Progdir:Templates/startup.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data, function()
		{
			v.sendMessage( { command: 'setparentviewid', viewid: v.getViewId() } );
		} );
	}
	f.load();
	
	// Goodbye on close
	v.onClose = function()
	{
		Application.quit();
	}
}

Application.receiveMessage = function( msg )
{

}

