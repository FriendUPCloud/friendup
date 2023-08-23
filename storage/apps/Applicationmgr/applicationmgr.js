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
		title: i18n('i18n_application_manager'),
		width: 500,
		height: 500,
		id: 'appmgr'
	} );
	
	var f = new File( 'Progdir:Templates/main.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		w.setContent( data, function(){ Application.showApps(); } );
	}
	f.load();
	
	w.onClose = function()
	{
		Application.quit();
	}
	
	this.mainWindow = w;
	
	setInterval( function(){ Application.showApps(); }, 250 );
}

// Update application list with new data
Application.showApps = function( data )
{
	if( data )
	{
		return this.mainWindow.sendMessage( { command: 'apps', data: data } );
	}
	this.sendMessage( {
		type: 'system',
		command: 'listapplications'
	} );
}

Application.receiveMessage = function( msg )
{
	if( msg.command )
	{
		switch( msg.command )
		{
			case 'listapplications':
				this.showApps( msg.data );
				break;
		}
	}
}


