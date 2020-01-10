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
		if( !Application.forceQuit )
		{
			mainWindow.sendMessage( { command: 'closeprojects' } );
			return false;
		}
	}
	
	var m = new File( 'Progdir:Templates/main.html' );
	m.replacements = {
		launchwith: msg.args ? msg.args : ''
	};
	m.i18n();
	m.onLoad = function( data )
	{
		mainWindow.setContent( data, function()
		{
			if( msg.args && msg.args.indexOf( ':' ) > 0 )
			{
				mainWindow.sendMessage( { command: 'launchwith', file: msg.args } );
			}
		} );
	}
	m.load();
	
	mainWindow.setMenuItems( [
		{
			name: i18n( 'menu_file' ),
			items: [
				{
					name: i18n( 'menu_file_about' ),
					command: 'about'
				},
				{
					name: i18n( 'menu_file_manual' ),
					command: 'manual'
				},
				{
					name: i18n( 'menu_file_open' ),
					command: 'open'
				},
				{
					name: i18n( 'menu_file_save' ),
					command: 'save'
				},
				{
					name: i18n( 'menu_file_save_as' ),
					command: 'save_as'
				},
				{
					name: i18n( 'menu_file_print' ),
					command: 'print'
				},
				{
					name: i18n( 'menu_file_close' ),
					command: 'close'
				},
				{
					name: i18n( 'menu_quit' ),
					command: 'quit'
				}
			]
		},
		{
			name: i18n( 'menu_project' ),
			items: [
				{
					name: i18n( 'menu_project_new' ),
					command: 'project_new'
				},
				{
					name: i18n( 'menu_project_open' ),
					command: 'project_open'
				},
				{
					name: i18n( 'menu_project_save' ),
					command: 'project_save'
				},
				{
					name: i18n( 'menu_project_save_as' ),
					command: 'project_save_as'
				},
				{
					name: i18n( 'menu_project_close' ),
					command: 'project_close'
				},
				{
					name: i18n( 'menu_project_editor' ),
					command: 'project_editor'
				}
			]
		},
		{
			name: i18n( 'menu_packages' ),
			items: [
				{
					name: i18n( 'menu_package_generate' ),
					command: 'package_generate'
				}
			]
		}
	] );
}

Application.receiveMessage = function( msg )
{
	if( msg.command )
	{
		switch( msg.command )
		{
			case 'about':
			case 'manual':
			case 'open':
			case 'save':
			case 'save_as':
			case 'print':
			case 'close':
			case 'project_editor':
			case 'project_open':
			case 'project_save':
			case 'project_save_as':
			case 'project_new':
			case 'package_generate':
			case 'project_close':
				mainWindow.sendMessage( msg );
				break;
			case 'system-notification':
				if( msg.method && msg.method == 'mountlistchanged' )
				{
					mainWindow.sendMessage( { command: 'updatemountlist' } );
				}
				break;
		}
	}
}

