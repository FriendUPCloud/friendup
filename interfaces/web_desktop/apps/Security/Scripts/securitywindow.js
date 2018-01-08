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
	this.popWindows = {};
	
	reloadApps();
	
	// Setup the tab system
	InitTabs( 'SecurityTabs' );
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
	var str = '';
	var apps = Application.apps;
	var sw = 1;
	for( var a = 0; a < apps.length; a++ )
	{
		var perms = '';
		var other = '';
		try{ perms = JSON.parse( apps[a].Permissions ); } catch( e ){ perms = ''; }
		try{ other = JSON.parse( apps[a].Data ); } catch( e ){ other = ''; }
		var pout = '';
		for( var c = 0; c < perms.length; c++ )
		{
			pout += perms[c][0] + ( ( perms[c][1] && perms[c][1].length ) ? ( '(' + perms[c][1] + ')' ) : '' ) + ( ( c < perms.length - 1 ) ? ', ' : '' );
		}
		var btn = '<button type="button" class="HContent45 NoMargins FloatLeft Button IconSmall fa-pencil" onclick="SecurityEdit( \'' + apps[a].Name + '\' )">&nbsp;' + i18n( 'i18n_edit' ) + '</button><div class="HContent5 FloatLeft">&nbsp;</div>';
		btn += '<button type="button" class="HContent50 NoMargins FloatLeft Button IconSmall fa-pencil" onclick="SecurityDelete( \'' + apps[a].Name + '\' )">&nbsp;' 	+ i18n( 'i18n_delete' ) + '</button>';
		sw = sw == 2 ? 1 : 2;
		str += '<div class="GuiContainer"><div class="HRow BackgroundDefault sw' + sw + '">';
		str += '<div class="HContent25 FloatLeft Padding LineHeight2x"><strong>' + apps[a].Name + '</strong></div>';
		str += '<div class="HContent50 FloatLeft Padding LineHeight2x" title="' + pout + '"><em>' + pout + '</em></div>';
		str += '<div class="HContent25 FloatLeft Padding">' + btn + '</div>';
		str += '</div></div>';
	}
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

function SecurityDelete( app )
{
	Confirm( 'Are you sure?', 'This will delete the security entry.', function( e )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			reloadApps();
		}
		m.execute( 'removeapplicationsettings', { appName: app } );
	} );
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
		height: 300,
		'min-width': 400
	} );
	
	Application.popWindows[ app ] = v;
	
	v.onClose = function()
	{
		Application.closeAppWindow( app, true );
	}
	
	var perms = '';
	var domain = false;
	for( var a = 0; a < Application.apps.length; a++ )
	{
		if( Application.apps[a].Name == app )
		{
			perms = Application.apps[a].Permissions;
			try
			{
				domain = JSON.parse( Application.apps[a].Data ).domain;
			}
			catch( e )
			{
				domain = false;
			}
		}
	}
	
	var f = new File( 'Progdir:Templates/setpermission.html' );
	f.replacements = { appname: app };
	f.onLoad = function( data )
	{
		v.setContent( data );
		v.sendMessage( { 
			command: 'permissions', 
			permissions: perms, 
			domain: domain ? domain : '' 
		} );
	}
	f.load();	
}

function closeWin()
{
	Application.sendMessage( { command: 'quit' } );
}

