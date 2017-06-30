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

Application.run = function( msg )
{
	this.theme = Application.theme; // Current theme
	
	this.mode = 'pear';
	
	InitTabs( 'MainTabs' );
	
	refreshThemes();	
	
}

function getMenuMode()
{
	// TODO: Will reenable later
	//if( ge( 'menuMiga' ).checked )
	//	return 'miga';
	return 'pear';
}

function setMenuMode( mode )
{
	mode = mode.substr( 0, 1 ).toUpperCase() + mode.substr( 1, mode.length - 1 );
	if( ge( 'menu' + mode ) )
		ge( 'menu' + mode ).click();
}

function getNavigationMode()
{
	if( ge( 'navigationSpacial' ).checked )
		return 'spacial';
	return 'browser';
}

function setNavigationMode( mode )
{
	mode = mode.substr( 0, 1 ).toUpperCase() + mode.substr( 1, mode.length - 1 );
	if( ge( 'navigation' + mode ) )
		ge( 'navigation' + mode ).click(); 
}

function getFocusMode()
{
	if( ge( 'focusmodeClicktofocus' ).checked )
	{
		return 'clicktofocus';
	}
	return 'clicktofront';
}

function setFocusMode( mode )
{
	mode = mode.substr( 0, 1 ).toUpperCase() + mode.substr( 1, mode.length - 1 );
	if( ge( 'focusmode' + mode ) )
		ge( 'focusmode' + mode ).click();
}

function getWindowListMode()
{
	if( ge( 'windowlistDocked' ).checked )
	{
		return 'docked';
	}
	return 'separate';
}

function setWindowListMode( mode )
{
	mode = mode.substr( 0, 1 ).toUpperCase() + mode.substr( 1, mode.length - 1 );
	if( ge( 'windowlist' + mode ) )
		ge( 'windowlist' + mode ).click();
}

function refreshThemes()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var j = JSON.parse( d );
			Application.themes = j;
			var ml = '<div class="List">';
			var sw = 2;
			
			var def = Application.themes.length - 1;
			if( Application.theme != '' )
			{
				for( var a = 0; a < Application.themes.length; a++ )
				{
					if( Application.theme && Application.themes[a].Name.toLowerCase() == Application.theme.toLowerCase() )
					{
						def = a;
					}
				}
			}
			
			var img = '/webclient/gfx/theme_preview.jpg';
			
			for( var a = 0; a < j.length; a++ )
			{
				sw = sw == 2 ? 1 : 2;
				var cl = '';
				
				switch( j[a].Name.toLowerCase() )
				{
					case 'borderless':
					case 'login':
						continue;
				}
				
				if( a == def )
				{
					cl = ' Active';
					if( j[a].WebPath )
						img = '/themes/' + j[a].Name.toLowerCase() + '/preview.jpg';
				}
				ml += '<div class="sw' + sw + cl + ' Padding" onclick="setActive(' + a + ')">' + j[a].Name + '</div>';
			}
			ml += '</div>';
			ge( 'ThemeList' ).innerHTML = ml;
			var st = ge( 'ThemePreview' ).style
			st.backgroundImage = 'url(\'' + img + '\')';
			st.backgroundSize = 'contain';
			st.backgroundPosition = 'center';
			st.backgroundRepeat = 'no-repeat';
		}
	}
	m.execute( 'listthemes' );
	
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var dd = JSON.parse( d );
			setMenuMode( dd.menumode );
			setNavigationMode( dd.navigationmode ? dd.navigationmode : 'browser' );
			setFocusMode( dd.focusmode ? dd.focusmode : 'clicktofront' );
			setWindowListMode( dd.windowlist ? dd.windowlist : 'separate' );
			return;
		}
		setMenuMode( 'pear' );
		setNavigationMode( 'browser' );
		setFocusMode( 'clicktofront' );
		setWindowListMode( 'separate' );
	}
	m.execute( 'getsetting', { settings: [ 'menumode', 'navigationmode', 'focusmode', 'windowlist' ] } );
	
}

function setActive( num )
{
	Application.theme = Application.themes[num].Name;
	Application.themePath = Application.themes[num].WebPath;
	refreshThemes();
}

function applyTheme()
{
	var m = new Module( 'system' );
	m.onExecuted = function()
	{
		var m2 = new Module( 'system' );
		m2.onExecuted = function()
		{
			var m4 = new Module( 'system' );
			m4.onExecuted = function()
			{
				var m5 = new Module( 'system' );
				m5.onExecuted = function()
				{
					var m3 = new Module( 'system' );
					m3.onExecuted = function( e, d )
					{
						if( e == 'ok' )
						{
							Application.sendMessage( {
								type: 'system',
								command: 'refreshtheme',
								theme: Application.themePath ? Application.theme : 'friendup'
							} );
						}
						else
						{
							console.log( 'Could not set system theme!' );
						}
					}
					m3.execute( 'settheme', { theme: Application.themePath ? Application.theme : 'friendup' } );
				}
				m5.execute( 'setsetting', { setting: 'windowlist', data: getWindowListMode() } );
			}
			m4.execute( 'setsetting', { setting: 'focusmode', data: getFocusMode() } );
		}
		m2.execute( 'setsetting', { setting: 'navigationmode', data: getNavigationMode() } );
	}
	m.execute( 'setsetting', { setting: 'menumode', data: getMenuMode() } );
}

