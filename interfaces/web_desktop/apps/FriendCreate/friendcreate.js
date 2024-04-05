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
		'min-height': 400,
		assets: [
			'Progdir:Templates/main.html',
			'Progdir:Templates/main.css',
			'Progdir:Scripts/preload.js',
			'Progdir:Scripts/collaboration.js',
			'Progdir:Libraries/Ace/src-min-noconflict/ace.js',
			'System:js/gui/filebrowser.js',
			'Progdir:Scripts/main.js'
		],
		replacements: {
			launchwith: msg.args ? msg.args : ''
		},
		onready: function()
		{
			if( msg.args && typeof( msg.args ) == 'object' )
			{
				mainWindow.sendMessage( { command: 'arguments', args: msg.args } );
			}
			else if( msg.args && msg.args.indexOf( ':' ) > 0 )
			{
				mainWindow.sendMessage( { command: 'launchwith', file: msg.args } );
			}
		}
	} );
	
	mainWindow.onClose = function()
	{
		// TODO: Check if we haven't saved anything
		if( !Application.forceQuit )
		{
			mainWindow.sendMessage( { command: 'closeprojects', reason: 'quit' } );
			return false;
		}
	}
	
	this.menuConfig = {
		collaborating: false
	};
	this.mainWindow = mainWindow;
	this.setMenus();
}
Application.setMenus = function()
{
	let mainWindow = this.mainWindow;
	
	// Set up the quick menu items ---------------------------------------------
	mainWindow.setQuickMenu( [ {
	    name: i18n( 'menu_file' ),
	    icon: 'caret-down',
	    items: [ {
	        name: i18n( 'menu_file_about' ),
	        icon: 'info',
	        command: 'about'
	    }, {
			name: i18n( 'menu_file_manual' ),
			icon: 'book',
			command: 'manual'
		}, {
			name: i18n( 'menu_file_open' ),
			icon: 'folder-open',
			command: 'open'
		},
		{
			name: i18n( 'menu_file_save' ),
			icon: 'save',
			command: 'save'
		},
		{
			name: i18n( 'menu_file_save_as' ),
			icon: 'copy',
			command: 'save_as'
		},
		{
			name: i18n( 'menu_file_print' ),
			icon: 'print',
			command: 'print'
		},
		{
			name: i18n( 'menu_file_close' ),
			icon: 'remove',
			command: 'close'
		},
		{
			name: i18n( 'menu_quit' ),
			icon: 'window-close',
			command: 'quit'
		} ]
	}, {
		name: i18n( 'menu_project' ),
		icon: 'caret-down',
		items: [ {
			name: i18n( 'menu_project_new' ),
			icon: 'plus',
			command: 'project_new'
		}, {
			name: i18n( 'menu_project_open' ),
			icon: 'folder-open',
			command: 'project_open'
		}, {
			name: i18n( 'menu_project_save' ),
			icon: 'save',
			command: 'project_save'
		}, {
			name: i18n( 'menu_project_save_as' ),
			icon: 'copy',
			command: 'project_save_as'
		}, {
			name: i18n( 'menu_project_editor' ),
			icon: 'wpforms',
			command: 'project_editor'
		}, {
			name: i18n( 'menu_project_close' ),
			icon: 'remove',
			command: 'project_close'
		} ]
	}, {
		name: i18n( 'menu_packages' ),
		icon: 'caret-down',
		items: [ {
			name: i18n( 'menu_package_generate' ),
			icon: 'cog',
			command: 'package_generate'
		} ]
	} ] );
	
	// Set up the standard menu items ------------------------------------------
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
			name: i18n( 'menu_templates' ),
			items: [
				{
					name: i18n( 'menu_empty_application' ),
					command: 'tpl_application'
				},
				{
					name: i18n( 'menu_application_scope' ),
					command: 'tpl_application_scope'
				},
				{
					name: i18n( 'menu_empty_fui_class' ),
					command: 'tpl_fui_class'
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
		}, 
		{
			name: i18n( 'menu_collaboration' ),
			items: [
				{
					name: i18n( 'menu_collaboration_invite' ),
					command: 'collab_invite',
					disabled: this.menuConfig.collaborating === true
				},
				{
					name: i18n( 'menu_collaboration_disconnect' ),
					command: 'collab_disconnect',
					disabled: this.menuConfig.collaborating === false
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
			case 'refreshmenu':
				if( msg.options )
				{
					if( msg.options )
					{
						if( this.menuConfig.collaborating === false || this.menuConfig.collaborating === true )
							this.menuConfig.collaborating = msg.options.collaborating;
					}
					Application.setMenus();
				}
				break;
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
			case 'tpl_application':
			case 'tpl_application_scope':
			case 'tpl_fui_class':
				mainWindow.sendMessage( msg );
				break;
			case 'system-notification':
				if( msg.method && msg.method == 'mountlistchanged' )
				{
					mainWindow.sendMessage( { command: 'updatemountlist' } );
				}
				break;
			case 'collab_invite':
				mainWindow.sendMessage( { command: 'collab_invite' } );
				break;
			case 'collab_disconnect':
				mainWindow.sendMessage( { command: 'collab_disconnect' } );
				break;
			case 'servermessage':
				if( msg.data && msg.data.type == 'invite' )
				{
					msg.data.command = 'incoming_invite';
					mainWindow.sendMessage( msg.data );
				}
				break;
		}
	}
}

