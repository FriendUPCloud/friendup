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
		title: i18n( 'i18n_Security' ),
		width: 700,
		height: 600
	} );
	
	this.mv = v;
	
	// Set menu items
	v.setMenuItems( [
		{
			name: i18n( 'i18n_file' ),
			items: [
				{
					name: i18n( 'i18n_quit' ),
					command: 'quit'
				}
			]
		}
	] );
	
	v.onClose = function()
	{
		Application.quit();
	}

	var f = new File( 'Progdir:Templates/security.html' );
	f.replacements = {
		Application: i18n( 'i18n_application' ),
		Permissions: i18n( 'i18n_permissions' ),
		Cancel:      i18n('i18n_cancel')
	};
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();	
	
	// Set app in single mode
	this.setSingleInstance( true );
		
}

Application.receiveMessage = function( msg )
{
	if( msg.command )
	{
		if( msg.command == 'cancelappwindow' )
		{
			this.mv.sendMessage( msg );
		}
		if( msg.command == 'updateapppermissions' )
		{
			this.mv.sendMessage( msg );
		}
	}
}

