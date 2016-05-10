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

Application.run = function( msg, iface )
{
	var v = new View( {
		title: 'Packager',
		width: 700,
		height: 500,
		'min-width': 400,
		'min-height': 150
	} );
	
	v.onClose = function()
	{
		Application.quit();
	}
	
	v.setMenuItems( [
		{
			name: 'File',
			items: [
				{
					name: 'New project',
					command: 'newproject'
				},
				{
					name: 'Load project',
					command: 'loadproject'
				},
				{
					name: 'Save project',
					command: 'saveproject'
				},
				{
					name: 'Quit',
					command: 'quit'
				}
			]
		},
		{
			name: 'Project',
			items: [
				{
					name: 'Add files',
					command: 'addfiles'
				}
			]
		}
	] );
	
	
	// Load the template
	var f = new File( 'Progdir:Templates/packager.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'newproject':
			this.newProject();
			break;
		case 'saveproject':
			this.saveProject();
			break;
		case 'loadproject':
			this.loadProject();
			break;
	}
}

/* Make a new project */

Application.newProject = function()
{
	
}

