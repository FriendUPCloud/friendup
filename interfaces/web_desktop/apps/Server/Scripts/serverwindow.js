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
Application.settings = false;

Application.run = function( msg, iface )
{
	this.popWindows = {};
	reloadSettings();
}

function reloadSettings()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			if(d == 'nosettingsfound')
			{
				ge( 'SystemSettings' ).innerHTML = '<p><strong>No system configuration settings found.</strong></p>';
			}
			else
			{
				Application.settings = JSON.parse( d ); 
				redrawSettings();				
			}

		}
		else
		{
			ge( 'SystemSettings' ).innerHTML = '<p><strong>Error while loading settings.</strong></p>';
		}
	}
	ge( 'SystemSettings' ).innerHTML = '...loading...';
	m.execute( 'listsystemsettings' );
}

function redrawSettings()
{
	var str = '';
	var settings = Application.settings;
	
	var sw = 1;
	for( var a = 0; a < settings.length; a++ )
	{
		//stringify does not remove line break... but parse react on them :(
		
		var setting = JSON.parse( ('' + settings[a].Data).replace(/\r/g,'\\r').replace(/\n/g,'\\n') );
		var pout = '';
		for( var c = 0; c < setting.length; c++ )
		{
			pout += setting[c][0] + ( ( setting[c][1] && setting[c][1].length ) ? ( '(' + setting[c][1] + ')' ) : '' ) + ( ( c < setting.length - 1 ) ? ', ' : '' );
		}
		var btn = '<button type="button" class="FullWidth Button IconSmall fa-pencil" onclick="ServerSettingEdit( \'' + settings[a].ID + '\' )">&nbsp;' + i18n( 'i18n_edit' ) + '</button>';
		sw = sw == 2 ? 1 : 2;
		str += '<div class="GuiContainer"><div class="HRow BackgroundDefault sw' + sw + '">';
		str += '<div class="HContent25 FloatLeft Padding LineHeight2x"><strong>' + settings[a].Type + '/' + settings[a].Key + '</strong></div>';
		str += '<div class="HContent50 FloatLeft Padding LineHeight2x" title="' + pout + '"><em>' + pout + '</em></div>';
		str += '<div class="HContent25 FloatLeft Padding">' + btn + '</div>';
		str += '</div></div>';
	}
	ge( 'SystemSettings' ).innerHTML = str;
}

Application.receiveMessage = function( msg )
{
	// Remove app window
	if( msg.command == 'cancelsettingswindow' )
	{
		this.closeSettingsWindow( msg.settingsid, false );
	}
	else if( msg.command == 'updatesettings' )
	{
		reloadSettings();
	}
	else if( msg.command == 'saveserversetting' )
	{
		m = new Module(	'system' );
		// What happens when we've executed?
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				Application.closeSettingsWindow( d );
				reloadSettings();
			}
		}
		m.execute( 'saveserversetting', { settingsid:msg.settingsid, settings:msg.settings } );	
	}
}

Application.closeSettingsWindow = function( sid, clean )
{
	if( this.popWindows && this.popWindows[ sid ] )
	{
		if( !clean )
		{
			this.popWindows[ sid ].close();
		}
		else
		{
			var out = {};
			for( var a in this.popWindows )
			{
				if( a == sid ) continue;
				out[ a ] = this.popWindows[ a ];
			}
			this.popWindows = out;
		}
	}
}

function ServerSettingEdit( sid )
{
	if( typeof( Application.popWindows[ sid ] ) != 'undefined' )
	{
		Application.popWindows[ sid ].focus();
		return;
	}

	var v = new View( {
		title: i18n( 'i18n_settings' ),
		width: 400,
		height: 200,
		'min-width': 400
	} );
	
	Application.popWindows[ sid ] = v;
	
	v.onClose = function()
	{
		Application.closeSettingsWindow( sid, true );
	}
	
	var perms = '';
	for( var a = 0; a < Application.settings.length; a++ )
	{
		if( Application.settings[a].ID == sid )
		{
			setts = Application.settings[a].Data;
			settsname = Application.settings[a].Type + '/' + Application.settings[a].Key;
		}
	}
	
	var f = new File( 'Progdir:Templates/setsettings.html' );
	f.replacements = { settingsname: settsname, settingsid : sid };
	f.onLoad = function( data )
	{
		v.setContent( data );
		v.sendMessage( { command: 'settings', settings: setts } );
	}
	f.load();	
}

function closeWin()
{
	Application.sendMessage( { command: 'quit' } );
}
