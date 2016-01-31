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

Application.run = function( msg )
{
	this.theme = Application.theme; // Current theme
	
	refreshThemes();	
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
			Application.themes.push( {
				WebPath: '',
				Name: 'FriendUP default'
			} );
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
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			Application.sendMessage( {
				type: 'system',
				command: 'refreshtheme',
				theme: Application.themePath ? Application.theme : ''
			} );
		}
		else
		{
			console.log( 'Could not set system theme!' );
		}
	}
	m.execute( 'settheme', { theme: Application.themePath ? Application.theme : '' } );
}

