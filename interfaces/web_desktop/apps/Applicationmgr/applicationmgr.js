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


