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
	var desktopMenuConf = [
		{
			name : 'Application',
			items : [
				{
					name : 'Quit',
					command : 'quit_hexgl'
				}
			]
		}
	];

	s = new View({ 
		title : 'HexGL',
		maximized: true
		
	});
	

	var fd = new File( 'Progdir:Templates/launch.html' );
	
	//console.log(document.location.href, 'our doc loc hfref');
	
	fd.replacements = {
		'hosturl' : 'https://merkur.friendup.cloud/'
	};	
	

	
	fd.onLoad = function( data )
	{
		s.setContent( data );
		s.setMenuItems( desktopMenuConf );
	};

	Application.myScreen = s;


	fd.load();
}

Application.receiveMessage = function( msg )
{
	if( msg.command == 'quit_hexgl' )
	{
		Application.quit();
	}
};

