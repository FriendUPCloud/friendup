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
	Application.username = msg.username;
}

Application.receiveMessage = function( msg )
{
	if( msg.command == 'update_invitees' && msg.users)
	{
		Application.updateAvailableUsers( msg.users );
	}
}

Application.updateAvailableUsers = function( userlist )
{
	var rs = '';
	
	for( var i = 0; i < userlist.length; i++ )
	{
		//dont invite myself ;)
		if( userlist[i] == Application.username ) continue;
		
		rs += '<div class="user"><input type="checkbox" id="usercheck'+i+'" class="usercheck" data-myuser="'+ userlist[i] +'" /><label for="usercheck'+i+'">'+ userlist[i] +'</label></div>';
	}
	
	ge('Userlist').innerHTML = rs;
}

function SendInvite()
{
	if( ge( 'User' ).value != '' )	Application.sendMessage( { command: 'sendinvite', user: ge( 'User' ).value } );
	
	var checks = document.getElementsByClassName('usercheck');
	for ( var i = 0; i < checks.length; i++) {
		if( checks[i].checked ) Application.sendMessage( { command: 'sendinvite', user: checks[i].getAttribute('data-myuser') } );
	}	
	
	Application.sendMessage( { command: 'closeinvite' } );
}

function CloseInvite()
{
	Application.sendMessage( { command: 'closeinvite' } );
}

