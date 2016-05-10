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
	this.listUsers();
	this.guiHTML = '\
	<div class="Padding"><h1>Please add or edit a user</h1><p>Select a user from the list to the left, or click "Add user" on the bottom of the list.</p></div>\
	';
	ge( 'UserGui' ).innerHTML = this.guiHTML;
}
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
			var users = JSON.parse( d );
			var ml = '';
			var sw = 1;
			for( var a in users )
			{
				var icon = users[a].Level == 'Admin' ? '-secret' : '-md';
				ml += '<div userId="' + users[a].ID + '" class="sw' + sw + ' HRow BorderBottom Padding" onclick="EditUser(' + users[a].ID + ')" onmouseover="SwitchRow(this, \'over\')" onmouseout="SwitchRow(this, \'out\')"><div class="IconMedium fa-user' + icon + ' FloatLeft"></div><div class="FloatLeft LineHeight2x MarginLeft">' + users[a].FullName + '</div></div>';
				sw = sw == 1 ? 2 : 1;
			}
			ge( 'UserList' ).innerHTML = ml;
			
			if( current )
			{
				EditUser( current );
			}
		}
	}
	
	// Execute the "get user list"
	m.execute( 'listusers' );
}


function SwitchRow( ele, type )
{
	
}

function EditUser( id )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var dat = JSON.parse( d );
			
			var f = new File( 'Progdir:Templates/user.html' );
			f.replacements = {
				'id'       : dat.ID,
				'username' : dat.Name,
				'password' : '********',
				'fullname' : dat.FullName,
				'email'    : dat.Email,
				'level'    : dat.Level
			};
			f.onLoad = function( data )
			{
				ge( 'UserGui' ).innerHTML = data;
				
				var us = ge( 'UserList' ).getElementsByTagName( 'div' );
				for( var a = 0; a < us.length; a++ )
				{
					if( !us[a].getAttribute( 'userId' ) ) continue;
					if( us[a].getAttribute( 'userId' ) == id )
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
		}
	}
	m.execute( 'userinfoget', { id: id } );
}

function SaveUser( id )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			EditUser( id );
			Application.listUsers();
		}
	}
	
	// Setup input values
	var args = {};
	var inps = [ 'Name', 'Email', 'Password', 'FullName', 'Level' ];
	var t = '';
	for( var a = 0; a < inps.length; a++ )
	{
		if( inps[a] == 'Password' && ge(inps[a]).value ==  '********' )
		{
			continue;
		}
		else if ( inps[a] == 'Password' )
		{
			args[inps[a]] = '{S6}' + Sha256.hash ( 'HASHED' + Sha256.hash(ge(inps[a]).value) );
		}
		else
		{
			args[inps[a]] = ge(inps[a]).value;	
		}
		
	}
	args.id = id;
		
	m.execute( 'userinfoset', args );
}

function DeleteUser( id )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			CancelEditing();
			Application.listUsers();
		}
	}
	m.execute( 'userdelete', { id: id } );
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
