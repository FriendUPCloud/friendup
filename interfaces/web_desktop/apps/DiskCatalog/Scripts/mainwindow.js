/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var user = '';

function setUser( id )
{
	user = id;
	Application.sendMessage( { command: 'setuser', userid: id } );
}

// Nothing to do
Application.run = function( msg )
{
	user = Application.userId;
	
	//
	//console.log( 'Initialized' );
	
	// Read our locale
	Locale.getLocale( function( data )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' ) return;
			Locale.importTranslations( d );
		}
		m.execute( 'getlocale', { type: 'DOSDrivers', locale: data.locale } );
	} );

	// Set app in single mode
	this.setSingleInstance( true );	

}
Application.receiveMessage = function( msg )
{
	if( msg.command == 'setmountlist' )
	{
		var users = JSON.parse( msg.users );
		
		var str = '<p><strong>' + i18n( 'i18n_select_user' ) + ':</strong> <select onchange="setUser(this.value)" id="Userlistvalues">';
		for( var a in users )
		{
			var c = '';
			if( users[ a ].ID == user )
				c = ' selected="selected"';
			str += '<option value="' + users[ a ].ID + '"' + c + '>' + users[ a ].FullName + '</option>';
		}
		str += '</select></p>';
		
		ge( 'UserList' ).innerHTML = '<div id="Userlist">' + str + '</div>';
		
		ge( 'Disks' ).innerHTML = '\
			<div class="Mountlist">\
				' + msg.data + '\
			</div>';
	}
	if( msg.command == 'setsoftware' )
	{
		ge( 'Catalog' ).innerHTML = '\
			<div class="Software">\
				' + msg.data + '\
			</div>';
	}
}
