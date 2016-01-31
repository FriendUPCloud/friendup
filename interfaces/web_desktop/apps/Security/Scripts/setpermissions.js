/*******************************************************************************
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
*******************************************************************************/

Application.run = function( msg, iface )
{
	
	
	
}

Application.receiveMessage = function( msg )
{
	if( msg.command == 'permissions' )
	{
		this.perms = JSON.parse( msg.permissions );
		this.refreshPermissions();
	}
}

Application.refreshPermissions = function()
{
	var perms = this.perms;
	var ml = '';
	for( var a = 0; a < perms.length; a++ )
	{
		ml += '<p class="Layout"><input type="text" class="FullWidth" value="' + perms[a][0] + ( perms[a][1] ? ( ', ' + perms[a][1] ) : '' ) + '"/></p>';
	}
	ge( 'Permissions' ).innerHTML = ml;
}

// Set permissions on the app
function setPermissions( app )
{
	var inps = ge( 'Permissions' ).getElementsByTagName( 'input' );
	var perms = [];
	for( var a = 0, b = 0; a < inps.length; a++ )
	{
		if( Trim( inps[a].value ).length <= 0 ) continue;
		var line = Trim( inps[a].value ).split( ',' );
		
		perms[b++] = line[1] ? [ Trim( line[0] ), Trim( line[1] ) ] : [ Trim( line[0] ), '' ];
	}
	
	// Send the message
	Application.sendMessage( {
		type: 'system',
		command: 'change_application_permissions',
		application: app,
		permissions: perms
	} );
	
	doCancel( app );
}

function addPermission()
{
	Application.perms.push( [ '' ] );
	Application.refreshPermissions();
}

function doCancel( app )
{
	Application.sendMessage( {
		command: 'cancelappwindow',
		app: app
	} );
}

