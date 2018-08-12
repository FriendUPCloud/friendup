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
	this.listUsers();
	this.guiHTML = '\
		<div class="Padding"><h1>Import users from beta program</h1><p>Please select user from the list to review for import. <b>Only users with email addresses that are not in our user repository will be listed.</b></p></div>\
	';
	ge( 'UserGui' ).innerHTML = this.guiHTML;
}
Application.importUsers = false;

Application.listUsers = function( current )
{
	// Open system module
	// TODO: Use user.library
	var m = new Module( 'system' );
	
	// What happens when we've executed?
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			Application.importUsers = JSON.parse( d );
			users = Application.importUsers;
			
			var ml = '';
			var sw = 1;
			
			if( users.length == 0 )
			{
				ge( 'UserList' ).innerHTML = '<h3 style="padding:16px;">No users to import</h3>';
			}
			else
			{
				
				for( var a in users )
				{
					var icon = users[a].Level == 'Admin' ? '-secret' : '-md';
					ml += '<div userId="' + users[a].email + '" class="sw' + sw + ' HRow BorderBottom Padding" onclick="ReviewUser(\'' + users[a].email + '\')" onmouseover="SwitchRow(this, \'over\')" onmouseout="SwitchRow(this, \'out\')"><div class="IconMedium fa-user' + icon + ' FloatLeft"></div><div class="FloatLeft LineHeight2x MarginLeft">' + users[a].name + '</div></div>';
					sw = sw == 1 ? 2 : 1;
				}
				ge( 'UserList' ).innerHTML = ml;				
			}
		}
	}
	ge( 'UserList' ).innerHTML = '<h3 style="padding:16px;">...loading...</h3>';
	// Execute the "get user list"
	m.execute( 'listbetausers' );
}

Application.showError = function ( error ) {
	ge( 'UserGui' ).innerHTML = '<h1 style="padding:16px;">'+ error +'</h1>';
}
Application.showMsg = function ( msg, addTo ) {
	if(addTo)
		ge( 'UserGui' ).innerHTML+= '<h2>'+ msg +'</h2>';
	else
		ge( 'UserGui' ).innerHTML = '<h1>'+ msg +'</h1>';
}

function ReviewUser( mailaddress )
{

	//find user data
	if(!Application.importUsers || !Application.importUsers.length) ge( 'UserGui' ).innerHTML = '<h1>Could not load userdata. Please reload list</h1>';
	
	userdata = false;
	for(i = 0; i < Application.importUsers.length; i++ )
	{
		if( mailaddress == Application.importUsers[i].email )
		{
			userdata = Application.importUsers[i];
			break;
		}
	}		
	
	if(!userdata)
	{
		ge( 'UserGui' ).innerHTML = '<h1>Could not load userdata. Please reload list</h1>';
		return;
	}
	
	//create suggestion for username
	var tmp = userdata.name.split(' ');
	var unamesuggestion = new String( tmp[0] + ( tmp[1] ? (tmp[1]+'').substr(0,1)  : Math.round( Math.random() * 100 ) ) ).toLowerCase();
	
	var words01 = [ 'Friend','Tree','Amiga','Rock','Stone','Sun','Winter' ];
	var words02 = [ 'Liquid','Easy','Friendly','Up','Forward' ];
	
	var passwordsuggestion = unamesuggestion.substr(0,1).toLowerCase() + unamesuggestion.substr(-1,1).toLowerCase() + words01[ Math.ceil( Math.random() * 6 )-1 ] + words02[ Math.ceil( Math.random() * 5 )-1 ];
	
	var f = new File( 'Progdir:Templates/user.html' );
	f.replacements = {
		'username' : unamesuggestion,
		'password' : passwordsuggestion,
		'fullname' : userdata.name,
		'email'    : userdata.email,
		'level'    : 'User'
	};
	f.onLoad = function( data )
	{
		ge( 'UserGui' ).innerHTML = data;
		
		var us = ge( 'UserList' ).getElementsByTagName( 'div' );
		for( var a = 0; a < us.length; a++ )
		{
			if( !us[a].getAttribute( 'userId' ) ) continue;
			if( us[a].getAttribute( 'userId' ) == mailaddress )
			{
				us[a].className = us[a].className.split( /sw[1|2]{0,1}\ / ).join ( '' );
				us[a].className = us[a].className.split( ' BackgroundNegative Negative' ).join( '' ) + ' BackgroundNegative Negative';
			}
			else
			{
				us[a].className = us[a].className.split( ' BackgroundNegative Negative' ).join( '' );
			}
			
		}
		
	}
	f.load();

	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			if( d == 'userexists' )
			{
				//save enough...?
				unamesuggestion = unamesuggestion + Math.round( Math.random() * 399 );
				setTimeout( function () { ge('Name').setAttribute('value',unamesuggestion) }, 500);
			}
		}
		else
		{
			console.log('Haeh',e,d);
		}
	}
	m.execute( 'checkuserbyname', { username : htmlentities( Trim( unamesuggestion ) ) } );	

}

function ReloadList()
{
	Application.listUsers();
}

function SwitchRow( ele, type )
{
	
}


function SaveUser()
{
	
	//create a user id for us
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			saveUserData( d );
			Application.showMsg('User created. Saving his data.');
		}
		else
		{
			Application.showError('Could not create new user in DB');
		}
	}
	m.execute( 'useradd' );	
}

function saveUserData( id )
{

	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			Application.showMsg('Userdata saved.',true);
			Application.listUsers();
		}
	}
	
	// Setup input values
	var args = {};
	var inps = [ 'Name', 'Email', 'Password', 'FullName', 'Level' ];
	for( var a = 0; a < inps.length; a++ )
	{
		if( inps[a] == 'Password' && ge(inps[a]).value ==  '********' )
		{
			continue;
		}
		else if ( inps[a] == 'Name' || inps[a] == 'FullName' )
		{
			args[inps[a]] = htmlentities( Trim( ge(inps[a]).value ) );
		}
		else if ( inps[a] == 'Password' )
		{
			args[inps[a]] = '{S6}' + Sha256.hash ( 'HASHED' + Sha256.hash(ge(inps[a]).value) );
			args['PlainTextPassword'] = ge(inps[a]).value;
		}
		else
		{
			args[inps[a]] = ge(inps[a]).value;	
		}
	}
	args.id = id;
		
	m.execute( 'userinfoset', args );
	
	var m2 = new Module( 'system' );
	m2.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			Application.showMsg(d,true);
			Application.listUsers();
		}
	}
	m2.execute( 'userbetamail', args );
	
	
	
	
}

function CancelEditing()
{
	if( ge( 'UserGui' ).default )
		ge( 'UserGui' ).innerHTML = ge( 'UserGui' ).default;
	else ge( 'UserGui' ).innerHTML = Application.guiHTML;
}

function AddUser()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			Application.listUsers( d );
		}
	}
	m.execute( 'useradd' );
}


