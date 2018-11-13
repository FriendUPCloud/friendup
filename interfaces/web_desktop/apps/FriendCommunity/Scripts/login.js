/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
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
