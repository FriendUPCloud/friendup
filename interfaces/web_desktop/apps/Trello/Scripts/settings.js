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

Application.run = function()
{
	//console.log('settings sun app runs',this);
};

Application.receiveMessage = function( msg )
{
	
	//console.log('settings dialogue got message',msg.loginresult,msg);
	if( msg.loginresult && msg.loginresult == 'negative' )
	{
		ge('wrongCreds').style.display = 'block';
	}

	
};

function saveCredentials()
{
	var u = ge( 'fEmail' ).value;
	var p = ge( 'fPassword' ).value;
	
	if( u != '' && p != '' )
	{
		Application.sendMessage( {
			command: 'savecredentials',
			data : {
				username: u,
				password: p
			},
		} );		
	}
	else
	{
		ge('wrongCreds').style.display = 'block';
	}
	return;
}