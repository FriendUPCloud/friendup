/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg, iface )
{
	this.setApplicationName( i18n( 'i18n_users_title' ) );
	
	var v = new View( {
		title: i18n( 'i18n_users_title' ),
		width: 'max',
		height: 'max'
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
		return this.mainView.sendMessage( msg );
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

