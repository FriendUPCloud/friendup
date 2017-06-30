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
	var k = ( ge( 'fRecoveryKey' ) ? ge( 'fRecoveryKey' ).value : false );
	
	Application.sendMessage( {
		command: 'login',
		data : {
			username: u,
			password: p,
			key: k
		},
	} );
	
	return;
}

function recover()
{
	var u = ge( 'fUsername' ).value;
	
	if( !ge( 'fUsername' ) || !u.length )
	{
		ge( 'fUsername' ).focus();
		return false;
	}
	
	console.log( 'sending message for recovery ...' );
	
	Application.sendMessage( {
		command: 'recover',
		data : {
			username: u
		}
	} );
	
	return true;
}


function signUp()
{
	var lastName = '';
	var firstName = '';
	
	// Check stuff
	if( ge( 'sFullname' ).value )
	{
		var n = ge( 'sFullname' ).value;
		n = n.split( ' ' );
		lastName = n[n.length-1];
		firstName = ge( 'sFullname' ).value.substr( 0, ge( 'sFullname' ).value.length - ( lastName.length + 1 ) );
	}
	var email = ge( 'sEmail' ).value;
	var username = ge( 'sUsername' ).value;
	var password = ge( 'sPassword' ).value;
	var confirm = ge( 'sConfirm' ).value;
	
	if( confirm != password )
	{
		ge( 'sConfirm' ).focus();
		return false;
	}
	
	//if( !lastName || !lastName.length )
	//	ge( 'sFullname' ).focus();
	
	if( !username || !username.length )
		ge( 'sUsername' ).focus();
	
	if( !password || !password.length )
		ge( 'sPassword' ).focus();
	
	
	
	if( email.length && username.length && password.length )
	{
		Application.sendMessage( {
			command: 'signup',
			data : {
				'email': email, 
				'username': username, 
				'firstName': firstName, 
				'lastName': lastName, 
				'password': password 
			}
		} );
	}
	// TODO: Better guidance!
	else
	{
		ge( 'sEmail' ).focus();
	}
	
	return true;
}


Application.receiveMessage = function( msg ) 
{
	console.log( 'login.receiveMessage', msg );
	
	if( msg && msg.command )
	{
		switch( msg.command )
		{
			case 'recover':
				ge( 'RecoveryKey' ).style.display = 'table-row';
				ge( 'NewPassword' ).style.display = 'inline';
				ge( 'LoginPassword' ).style.display = 'none';
				break;
		}
	}
	
}
