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
	//var s = new Screen( { title: 'Astray', fullscreen: true } );
	//this.screen = s;
	//s.loadTemplate( 'Progdir:index.html' );
	var s = new Screen( {
		title: 'Astray',
		width: 600,
		height: 600
	} );
	
	var f = new File( 'Progdir:index.html' );
	f.onLoad = function( data )
	{
		s.setContent( data );
	}
	f.load();
}

