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


function login()
{
	var u = ge( 'fUsername' ).value;
	var p = ge( 'fPassword' ).value;
	
	Application.sendMessage( {
		command: 'login',
		data : {
			username: u,
			password: p
		},
	} );
	
	return;
}



function signUp()
{
	// Check stuff
	var n = ge( 'sFullname' ).value;
	n = n.split( ' ' );
	var lastName = n[n.length-1];
	var firstName = ge( 'sFullname' ).value.substr( 0, ge( 'sFullname' ).value.length - ( lastName.length + 1 ) );
	var email = ge( 'sEmail' ).value;
	var username = ge( 'sUsername' ).value;
	var password = ge( 'sPassword' ).value;
	var confirm = ge( 'sConfirm' ).value;
	
	if( confirm != password )
	{
		ge( 'sConfirm' ).focus();
		return false;
	}
	
	if( !lastName || !lastName.length )
		ge( 'sFullname' ).focus();
	
	if( !username || !username.length )
		ge( 'sUsername' ).focus();
	
	if( !password || !password.length )
		ge( 'sPassword' ).focus();
	
	// Register
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			// Lets activate!!
			var j = JSON.parse( d );
			if( j.data && j.data.length )
			{
				var mm = new Module( 'system' );
				mm.onExecuted = function( ae, da )
				{
					var jda = JSON.parse( da );
					if( ae == 'ok' && jda.data && jda.data.length )
					{
						Application.sendMessage( {
							command: 'login',
							username: email,
							password: password
						} );
					}
				}
				mm.execute( 'proxyget', {
					url: 'https://treeroot.org/components/register/activate/',
					Email: email,
					UserType: '0',
					AuthKey: j.data,
					Source: 'friendup',
					Encoding: 'json'
				} );
			}
			else
			{
			}
		}
	}
	
	if( email.length && username.length && password.length && firstName.length && lastName.length )
	{
		m.execute( 'proxyget', {
			url: 'https://treeroot.org/components/register/',
			Email: email,
			Username: username,
			Password: password,
			Firstname: firstName,
			Lastname: lastName,
			Encoding: 'json'
		} );
	}
	// TODO: Better guidance!
	else
	{
		ge( 'sEmail' ).focus();
	}
}

