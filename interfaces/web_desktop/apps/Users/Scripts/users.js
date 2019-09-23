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
	this.setApplicationName( i18n( 'i18n_users_title' ) );
	
	var v = new View( {
		title: i18n( 'i18n_users_title' ),
		width: 1024,
		height: 640
	} );
	this.mainView = v;
	
	v.setMenuItems( [
		{
			name: i18n( 'i18n_users' ),
			items: [
				{
					name: i18n( 'i18n_see_users' ),
					command: 'users_view'
				},
				{
					name: i18n( 'i18n_add_user' ),
					command: 'users_add'
				}
			]
		},
		{
			name: i18n( 'i18n_templates' ),
			items: [
				{
					name: i18n( 'i18n_see_templates' ),
					command: 'templates_view'
				},
				{
					name: i18n( 'i18n_add_template' ),
					command: 'templates_add'
				}
			]
		},
		{
			name: i18n( 'i18n_workgroups' ),
			items: [
				{
					name: i18n( 'i18n_see_workgroups' ),
					command: 'workgroups_view'
				},
				{
					name: i18n( 'i18n_add_workgroup' ),
					command: 'workgroups_add'
				}
			]
		}
	] );
	
	v.onClose = function(){ Application.quit(); }
	
	// Set app in single mode
	this.setSingleInstance( true );	
	
	var f = new File( 'Progdir:Templates/main.html' );
	f.replacements = { viewId: v.getViewId() };
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
	
}

// Available functions
messageFunctions = {
	templates_view( msg )
	{
		return Application.mainView.sendMessage( {
			command: 'activate_tab',
			tab:     'TemplatesTab'
		} );
	},
	users_view( msg )
	{
		return Application.mainView.sendMessage( {
			command: 'activate_tab',
			tab:     'UsersTab'
		} );
	},
	workgroups_view( msg )
	{
		return Application.mainView.sendMessage( {
			command: 'activate_tab',
			tab:     'WorkgroupsTab'
		} );
	},
	templates_add( msg )
	{
		return Application.mainView.sendMessage( {
			command: 'templates_add'
		} );
	},
	users_add( msg )
	{
		return Application.mainView.sendMessage( {
			command: 'users_add'
		} );
	},
	workgroups_add( msg )
	{
		return Application.mainView.sendMessage( {
			command: 'workgroups_add'
		} );
	},
	renewedsessions( msg )
	{
		return Application.mainView.sendMessage( msg );
	},
	editnewworkgroup(msg)
	{
		return Application.mainView.sendMessage( msg );
	}
};

// Execute on received message
Application.receiveMessage = function( msg )
{	
	if( !msg.command ) return;
	if( messageFunctions[ msg.command ] )
		return messageFunctions[ msg.command ]( msg );
	return false;
}

