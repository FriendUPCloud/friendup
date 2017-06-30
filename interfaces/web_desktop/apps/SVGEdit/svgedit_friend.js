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
	var s = new Screen( {
		title: 'SVG-Edit'
	} );
	
	this.mainScreen = s;
	
	s.loadTemplate( 'Progdir:svg-editor.html' );
	
	s.setMenuItems( [
		{
			name: 'File',
			items:
			[
				{
					name: 'License',
					command: 'license'
				},
				{
					name: 'Quit',
					command: 'quit'
				}
			]
		}
	] );
	
}

Application.receiveMessage = function( m )
{
	if( !m.command ) return;
	if( m.command == 'license' )
	{
		if( this.lw ) return;
		this.lw = new View( {
			title: 'License',
			width: 500,
			height: 300,
			screen: Application.mainScreen
		} );
		this.lw.onClose = function()
		{
			Application.lw = false;
		}
		var f = new File( 'Progdir:license.html' );
		f.onLoad = function( data )
		{
			Application.lw.setContent( data );
		}
		f.load();
	}
}

