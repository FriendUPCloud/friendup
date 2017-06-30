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

Application.run = function( msg )
{
	console.log( 'Hello! We are an item!' );
	console.log( document.title );
}

Application.receiveMessage = function( msg )
{
	switch( msg.command )
	{
		case 'set':
			var cmd = msg.data.command;
			var res = msg.data.resource;
			var opt = msg.data.args;
			
			ge( 'fResource' ).value = res;
			ge( 'fCommand' ).value = cmd;
			ge( 'fArgs' ).value = opt ? opt : '';
			Application.pwin = msg.data.pwin;
			break;
	}
}

function cancel()
{
	Application.sendMessage( {
		command: 'close',
		pwin: Application.pwin
	} );
}

function apply()
{
	
}

