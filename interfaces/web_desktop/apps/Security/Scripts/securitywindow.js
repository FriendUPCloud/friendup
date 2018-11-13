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
	str += '<div class="List">';
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
		var btn = '<div class="HContent45 FloatLeft"><button type="button" class="FullWidth NoMargins Button IconSmall fa-pencil" onclick="SecurityEdit( \'' + apps[a].Name + '\' )">&nbsp;' + i18n( 'i18n_edit' ) + '</button></div>';
		btn += '<div class="HContent4 FloatLeft">&nbsp;</div>';
		btn += '<div class="HContent50 FloatLeft"><button type="button" class="FullWidth NoMargins Button IconSmall fa-pencil" onclick="SecurityDelete( \'' + apps[a].Name + '\' )">&nbsp;' 	+ i18n( 'i18n_delete' ) + '</button></div>';
		sw = sw == 2 ? 1 : 2;
		str += '<div class="HRow BackgroundDefault sw' + sw + '">';
		str += '<div class="HContent25 FloatLeft Padding LineHeight2x"><strong>' + apps[a].Name + '</strong></div>';
		str += '<div class="HContent50 FloatLeft Padding LineHeight2x" title="' + pout + '"><em>' + pout + '</em></div>';
		str += '<div class="HContent25 FloatLeft Padding"><div class="HRow">' + btn + '</div></div>';
		str += '</div>';
	}
	str += '</div>';
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

