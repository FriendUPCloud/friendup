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
	this.popWindows = {};
	
	reloadApps();
}

function reloadApps()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			Application.apps = JSON.parse( d ); 
			redrawApps();
		}
		else
		{
			ge( 'Applications' ).innerHTML = '<p><strong>You have not installed any applications.</strong></p>';
		}
	}
	m.execute( 'listuserapplications' );
}

function redrawApps()
{
	var str = '<table class="List">';
	var apps = Application.apps;
	var sw = 1;
	for( var a = 0; a < apps.length; a++ )
	{
		var perms = JSON.parse( apps[a].Permissions );
		var pout = '';
		for( var c = 0; c < perms.length; c++ )
		{
			pout += perms[c][0] + ( ( perms[c][1] && perms[c][1].length ) ? ( '(' + perms[c][1] + ')' ) : '' ) + ( ( c < perms.length - 1 ) ? ', ' : '' );
		}
		var btn = '<button type="button" class="FullWidth Button IconSmall fa-pencil" onclick="SecurityEdit( \'' + apps[a].Name + '\' )">&nbsp;' + i18n( 'i18n_edit' ) + '</button>';
		sw = sw == 2 ? 1 : 2;
		str += '<tr class="sw' + sw + '">';
		str += '<td width="40%">' + apps[a].Name + '</td>';
		str += '<td width="35%"><em>' + pout + '</em></td>';
		str += '<td width="25%">' + btn + '</td>';
		str += '</tr>';
	}
	str += '</table>';
	ge( 'Applications' ).innerHTML = str;
}

Application.receiveMessage = function( msg )
{
	// Remove app window
	if( msg.command == 'cancelappwindow' )
	{
		this.closeAppWindow( msg.app, false );
	}
	else if( msg.command == 'updateapppermissions' )
	{
		reloadApps();
	}
}

Application.closeAppWindow = function( app, clean )
{
	if( this.popWindows && this.popWindows[ app ] )
	{
		if( !clean )
		{
			this.popWindows[ app ].close();
		}
		else
		{
			var out = {};
			for( var a in this.popWindows )
			{
				if( a == app ) continue;
				out[ a ] = this.popWindows[ a ];
			}
			this.popWindows = out;
		}
	}
}

function SecurityEdit( app )
{
	if( typeof( Application.popWindows[ app ] ) != 'undefined' )
	{
		Application.popWindows[ app ].focus();
		return;
	}

	var v = new View( {
		title: i18n( 'i18n_app_permissions' ),
		width: 400,
		height: 200,
		'min-width': 400
	} );
	
	Application.popWindows[ app ] = v;
	
	v.onClose = function()
	{
		Application.closeAppWindow( app, true );
	}
	
	var perms = '';
	for( var a = 0; a < Application.apps.length; a++ )
	{
		if( Application.apps[a].Name == app )
		{
			perms = Application.apps[a].Permissions
		}
	}
	
	var f = new File( 'Progdir:Templates/setpermission.html' );
	f.replacements = { appname: app };
	f.onLoad = function( data )
	{
		v.setContent( data );
		v.sendMessage( { command: 'permissions', permissions: perms } );
	}
	f.load();	
}


