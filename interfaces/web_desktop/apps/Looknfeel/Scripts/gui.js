/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
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
	else if( ge( 'windowlistDockedlist' ).checked )
	{
		return 'dockedlist';
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
	window.onSaveThemeConfig = function(){};
	
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var j = JSON.parse( d );
			
			var sorted = [];
			var keysor = [];
			for( var a = 0; a < j.length; a++ )
			{
				sorted.push( j[a].Name );
				keysor[ j[a].Name ] = j[a];
			}
			sorted.sort();
			var out = [];
			for( var a = 0; a < sorted.length; a++ )
				out.push( keysor[ sorted[ a ] ] );
			j = out;
			sorted = null; keysor = null;
			
			Application.themes = j;
			var ml = '<div class="List NoPadding">';
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
			
			// Setup theme gui
			i18nAddPath( '/themes/' + Application.theme.toLowerCase() + '/Locale/' + Application.language + '.lang', function()
			{
				var f = new File( 'System:../themes/' + Application.theme.toLowerCase() + '/config.html' );
				f.i18n();
				f.onLoad = function( data )
				{
					if( data.indexOf( '<title' ) > 0 )
						data = '<p><strong>' + i18n( 'i18n_no_theme_config' ) + '</strong></p>';
				
					var scripts;
					var endScripts = [];
					while( scripts = data.match( /\<script.*?\>([\w\W]*)\<\/script\>/i ) )
					{
						data = data.split( scripts[0] ).join( '' );
						endScripts.push( scripts[1] );
					}
					ge( 'ThemeConfig' ).innerHTML = data;
					for( var c = 0; c < endScripts.length; c++ )
					{
						eval( endScripts[c] );
					}
				}
				f.load();
			} );
			
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
				
				var ex = '';
				if( a == def )
				{
					cl = ' Active';
					if( j[a].WebPath )
						img = '/themes/' + j[a].Name.toLowerCase() + '/preview.jpg';
					ex = '» ';
				}
				ml += '<div class="sw' + sw + cl + ' Padding" onclick="setActive(' + a + ')">' + ex + j[a].Name.split( '_' ).join( ' ' ) + '</div>';
			}
			ml += '</div>';
			/*ge( 'ThemeList' ).innerHTML = ml;
			var st = ge( 'ThemePreview' ).style
			st.backgroundImage = 'url(\'' + img + '\')';
			st.backgroundSize = 'contain';
			st.backgroundPosition = 'center';
			st.backgroundRepeat = 'no-repeat';*/
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
			if( dd.hiddensystem == true )
				ge( 'hiddenSystem' ).checked = 'checked';
			ge( 'workspaceCount' ).value = dd.workspacecount > 0 ? dd.workspacecount : 1;
			ge( 'scrollDesktopIcons' ).checked = dd.scrolldesktopicons == '1' ? 'checked' : '';
			ge( 'ThemeConfigData' ).value = JSON.stringify( dd[ 'themedata_' + Application.theme.toLowerCase() ] );
			return;
		}
		setMenuMode( 'pear' );
		setNavigationMode( 'browser' );
		setFocusMode( 'clicktofront' );
		setWindowListMode( 'separate' );
		ge( 'workspaceCount' ).value = '1';
		ge( 'scrollDesktopIcons' ).checked = '';
		ge( 'ThemeConfigData' ).value = '';
	}
	m.execute( 'getsetting', { settings: [ 
		'menumode', 'navigationmode', 'focusmode', 
		'windowlist', 'hiddensystem', 'workspacecount',
		'scrolldesktopicons', 'themedata_' + Application.theme.toLowerCase()
	] } );
	
}

function setActive( num )
{
	Application.theme = Application.themes[num].Name;
	Application.themePath = Application.themes[num].WebPath;
	refreshThemes();
}

function applyTheme()
{
	var currTheme = Application.theme ? Application.theme : 'friendup12';
	
	// Update data for the theme config
	if( window.onSaveThemeConfig )
		window.onSaveThemeConfig();
	
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
					var m6 = new Module( 'system' );
					m6.onExecuted = function()
					{
						var m7 = new Module( 'system' );
						m7.onExecuted = function()
						{
							var m8 = new Module( 'system' );
							m8.onExecuted = function()
							{
								var m3 = new Module( 'system' );
								m3.onExecuted = function( e, d )
								{
									// check for extra config
									var m9 = new Module( 'system' );
									m.onExecuted = function()
									{
										if( e == 'ok' )
										{
											var dt = {
												type: 'system',
												command: 'refreshtheme',
												theme: currTheme
											};
											if( ge( 'ThemeConfigData' ) )
												dt.themeConfig = ge( 'ThemeConfigData' ).value;
											Application.sendMessage( dt );
										}
										else
										{
											console.log( 'Could not set system theme!' );
										}
									}
									m.execute( 'setsetting', { setting: 'themedata_' + currTheme.toLowerCase(), data: ge( 'ThemeConfigData' ).value } );
								}
								m3.execute( 'settheme', { theme: currTheme } );
							}
							m8.execute( 'setsetting', { setting: 'scrolldesktopicons', data: ge( 'scrollDesktopIcons' ).checked ? '1': '0' } );
						}
						m7.execute( 'setsetting', { setting: 'workspacecount', data: ge( 'workspaceCount' ).value } );
					}
					m6.execute( 'setsetting', { setting: 'hiddensystem', data: ge( 'hiddenSystem' ).checked ? 'true' : 'false' } );
				}
				m5.execute( 'setsetting', { setting: 'windowlist', data: getWindowListMode() } );
			}
			m4.execute( 'setsetting', { setting: 'focusmode', data: getFocusMode() } );
		}
		m2.execute( 'setsetting', { setting: 'navigationmode', data: getNavigationMode() } );
	}
	m.execute( 'setsetting', { setting: 'menumode', data: getMenuMode() } );
}

