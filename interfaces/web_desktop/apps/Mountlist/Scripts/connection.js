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

/* Init connection window */
Application.run = function( msg )
{
	console.log( 'Message window..' );
	console.log( msg );
}

/* Cancel the operation */
Application.cancel = function()
{
	console.log( 'Fop' );
	this.sendMessage( { command: 'notify', method: 'closewindow' } );
}

/* Save, then close */
Application.save = function()
{
	var data = {
		ID:       ge( 'FileSystemID' ).value,
		Name:     ge( 'Name'         ).value,
		Type:     ge( 'Type'         ).value,
		Server:   ge( 'Server'       ).value,
		ShortDescription: ge( 'ShortDescription' ).value,
		Port:     ge( 'Port'         ).value,
		Username: ge( 'Username'     ).value,
		Password: ge( 'Password'     ).value,
		Path:     ge( 'Path'         ).value
	};

	var m = new Module( 'system' );
	m.onExecuted = function( e, dat )
	{
		if( e == 'updated' )
		{
			Application.sendMessage( { command: 'refresh' } );
		}
		else if( e == 'ok' )
		{
			Application.sendMessage( { command: 'refresh' } );
			Application.cancel();
		}
		else
		{
			console.log( dat );
		}
	}
	if( ge( 'FileSystemID' ) && ge( 'FileSystemID' ).value > 0 )
	{
		m.execute( 'editfilesystem', data );
	}
	else
	{
		m.execute( 'addfilesystem', data );
	}
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'setinfo':
		
			var d = msg.info;
			var out = msg.types;
			
			if( msg.info && msg.info.ID )
			{
				ge( 'FileSystemID' ).value = d.ID;
				ge( 'Name' ).value = d.Name;
				ge( 'ShortDescription' ).value = d.ShortDescription;
				ge( 'Username' ).value = d.Username;
				ge( 'Password' ).value = d.Password;
				ge( 'Port' ).value = d.Port;
				ge( 'Server' ).value = d.Server;
				ge( 'Path' ).value = d.Path;
			}
			else
			{
				ge( 'FileSystemID' ).value = '';
				ge( 'Name' ).value = '';
				ge( 'ShortDescription' ).value = '';
				ge( 'Username' ).value = '';
				ge( 'Password' ).value = '';
				ge( 'Port' ).value = '';
				ge( 'Server' ).value = '';
				ge( 'Path' ).value = '';
			}
			
			ge( 'Types' ).innerHTML = '<select id="Type" class="FullWidth">' + out + '</select>';
			
			break;
	}
}

