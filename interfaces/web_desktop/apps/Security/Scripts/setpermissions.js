/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg, iface )
{
}

Application.receiveMessage = function( msg )
{
	if( msg.command == 'permissions' )
	{
		this.perms = JSON.parse( msg.permissions );
		this.domain = msg.domain;
		this.refreshPermissions();
	}
}

Application.refreshPermissions = function()
{
	var perms = this.perms;
	var ml = '';
	for( var a = 0; a < perms.length; a++ )
	{
		ml += '<p class="Layout"><input type="text" class="FullWidth" value="' + perms[a][0] + ( perms[a][1] ? ( ', ' + perms[a][1] ) : '' ) + '"/></p>';
	}
	ge( 'Permissions' ).innerHTML = ml;
	
	// Security domain
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' ) return;
		try
		{
			var j = JSON.parse( d );
			ge( 'Domains' ).innerHTML = '';
			for( var a = 0; a < j.domains.length; a++ )
			{
				var o = document.createElement( 'option' );
				if( Trim( j.domains[a] ) == Application.domain )
				{
					o.selected = 'selected';
				}
				o.innerHTML = Trim( j.domains[a] );
				o['value'] = Trim( j.domains[a] );
				ge( 'Domains' ).appendChild( o );
			}
		}
		catch( e ){};
	}
	m.execute( 'securitydomains' );
}

// Set permissions on the app
function setPermissions( app )
{
	var inps = ge( 'Permissions' ).getElementsByTagName( 'input' );
	var perms = [];
	for( var a = 0, b = 0; a < inps.length; a++ )
	{
		if( Trim( inps[a].value ).length <= 0 ) continue;
		var line = Trim( inps[a].value ).split( ',' );
		
		perms[b++] = line[1] ? [ Trim( line[0] ), Trim( line[1] ) ] : [ Trim( line[0] ), '' ];
	}
	
	var data = {
		domain: ge( 'Domains' ).value
	};
	
	// Send the message
	Application.sendMessage( {
		type: 'system',
		command: 'change_application_permissions',
		application: app,
		data: JSON.stringify( data ),
		permissions: perms
	} );
	
	doCancel( app );
}

function addPermission()
{
	Application.perms.push( [ '' ] );
	Application.refreshPermissions();
}

function doCancel( app )
{
	Application.sendMessage( {
		command: 'cancelappwindow',
		app: app
	} );
}

