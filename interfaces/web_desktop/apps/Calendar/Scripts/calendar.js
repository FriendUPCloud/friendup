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

var mainView;

Application.run = function( msg )
{
	mainView = new View( {
		width: 1000,
		height: 700,
		title: 'Your calendars'
	} );
	
	var f = new File( 'Progdir:Templates/main.html' );
	f.replacements = { source: 'https://agendav.localhost' };
	f.i18n();
	f.onLoad = function( data )
	{
		mainView.setContent( data );
	}
	f.load();
	
	mainView.onClose = function()
	{
		Application.quit();
	}
}

