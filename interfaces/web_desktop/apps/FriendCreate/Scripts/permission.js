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
}

Application.receiveMessage = function( msg )
{
	if( !ge( 'Type' ).value.length || !ge( 'Name' ).value.length )
	{
		return;
	}
	if( !msg.command ) return;
	
	var o = {
		command: 'permission',
		index: ge( 'Index' ).value,
		type: ge( 'Type' ).value,
		options: ge( 'Options' ).value
	};
	
	Application.sendMessage( o );
}

function cancelPermission()
{
	CloseView( Application.viewId );
}

function addPermission()
{
	Application.sendMessage( {
		command: 'setpermission',
		permission: ge( 'Type' ).value,
		permname:   ge( 'Name' ).value,
		options:    ge( 'Options' ).value,
		index:      ge( 'Index' ).value
	} );
}

