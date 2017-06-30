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

