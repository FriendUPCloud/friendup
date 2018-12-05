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
	var viewFlags = {
		title: i18n( 'i18n_Server' ),
		width: 700,
		height: 600
	};
	
	if( msg.args.indexOf( ' ' ) > 0 )
	{
		var args = msg.args.split( ' ' );
		if( args[1] == 'test' )
		{
			viewFlags.frameworks = { 
				fui: {
					data: 'Progdir:FUI/server.json',
					javascript: 'Progdir:Scripts/server_fui.js'
				}
			};
		}
		else if( args[1] == 'tree' )
		{
			viewFlags.frameworks = {
				tree: {
					data: 'Progdir:FUI/server.json',
					javascript: 'Progdir:Tree/server.js'
				}
			}
		}
	}
	
	var v = new View( viewFlags );
	
	this.mv = v;
	
	v.onClose = function()
	{
		Application.quit();
	}

	// Set app in single mode
	this.setSingleInstance( true );
	
	if( !viewFlags.frameworks )
	{
		var f = new File( 'Progdir:Templates/server.html' );
		f.i18n();
		f.onLoad = function( data )
		{
			v.setContent( data );
		}
		f.load();
	}
}

Application.receiveMessage = function( msg )
{
	if( msg.command )
	{
		if( msg.command == 'cancelsettingswindow' )
		{
			this.mv.sendMessage( msg );
		}
		if( msg.command == 'settings' )
		{
			this.mv.sendMessage( msg );
		}
		if( msg.command == 'updatesettings' )
		{
			this.mv.sendMessage( msg );
		}
		if( msg.command == 'saveserversetting' )
		{
			this.mv.sendMessage( msg );
		}
	}
}


