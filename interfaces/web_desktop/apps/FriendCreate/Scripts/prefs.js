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

// App settings..
settings = {
	wordWrap: true,
	wordWrapWidth: 80,
	codeFolding: true,
	ownScreen: false,
	theme: 'twilight'
};

// Run that app!
Application.run = function( msg, iface )
{
	ge( 'MainBox' ).classList.add( 'Disabled' );
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var o = false;
			try
			{
				o = JSON.parse( d );
				if( o.friendcreate )
				{
					for( var a in o.friendcreate ) settings[a] = o.friendcreate[a];
				}
			}
			catch( e )
			{
			}
		}
		var eles = ge( 'MainBox' ).getElementsByTagName( 'input' );
		for( var a = 0; a < eles.length; a++ )
		{
			testInput( eles[a] );
		}
		var eles = ge( 'MainBox' ).getElementsByTagName( 'select' );
		for( var a = 0; a < eles.length; a++ )
		{
			testInput( eles[a] );
		}
		ge( 'MainBox' ).classList.remove( 'Disabled' );
	}
	m.execute( 'getsetting', { setting: 'friendcreate' } );
}

// Set up our tabs!
var vtabs = new VertTabContainer( ge( 'VTabs' ) );
var tabs = [
	{
		name:  'Language',
		label: i18n('i18n_language_settings'),
		pageDiv: ge( 'VPage1' )
	},
	{
		name:  'Code',
		label: i18n('i18n_code_editor'),
		pageDiv: ge( 'VPage2' )
	},
	{
		name:  'Features',
		label: i18n('i18n_feature_settings'),
		pageDiv: ge( 'VPage3' )
	}
];
for( var a = 0; a < tabs.length; a++ )
{
	vtabs.addTab( tabs[a] );
}

function saveSettings()
{
	for( var a in settings )
	{
		var ele = ge( 'setting_' + a );
		if( !ele ) continue;
		switch( ele.type )
		{
			case 'checkbox':
				ele.checked = settings[a] ? 'checked' : '';
				break;
			case 'text':
			case 'number':
			case 'range':
				ele.value = settings[a];
				break;
		}
	}

	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			//Alert( 'Friend settings were saved', 'You just saved your friend settings!' );
		}
		Application.sendMessage( { command: 'refreshsettings' } );
	}
	m.execute( 'setsetting', { setting: 'friendcreate', data: JSON.stringify( settings ) } );
}

function testInput( el )
{
	if( !el ) return;
	var sk = el.id.split( '_' )[1];
	el.onchange = function( e )
	{
		var t = this;
		if( !e ) return;
		if( t.nodeName == 'SELECT' )
		{
			var opts = t.getElementsByTagName( 'option' );
			for( var a = 0; a < opts.length; a++ )
			{
				if( opts[a].selected )
					settings[sk] = opts[a].value;
			}
		}
		else if( t.type == 'checkbox' )
			settings[sk] = t.checked ? true : false;
		else settings[sk] = t.value;
	}
	if( el.nodeName == 'SELECT' )
	{
		var opts = el.getElementsByTagName( 'option' );
		for( var a = 0; a < opts.length; a++ )
		{
			if( opts[a].value == settings[sk] )
				opts[a].selected = 'selected';
			else opts[a].selected = '';
		}
	}
	else if( el.type == 'checkbox' )
	{
		if( settings[sk] == false )
		{
			el.checked = '';
		}
		else el.checked = 'checked';
	}
	else el.value = settings[sk];
}

function doCancel()
{
	Application.sendMessage( {
		command: 'closeprefs'
	} );
}

