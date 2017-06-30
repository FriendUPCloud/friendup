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

/*******************************************************************************
*                                                                              *
* The FriendUP simple shell client                                             *
* --------------------------------                                             *
*                                                                              *
* version: 1.0                                                                 *
*                                                                              *
*******************************************************************************/

// Extend the applicatino object with a run function
Application.run = function( packet ) 
{
	this.fileName = 'test1';
	var w = new View( { 
		title:  'New Shell', 
		width:  650,
		height: 240
	} );
	this.view = w;
	w.onClose = function(){ Application.quit(); }
	
	// Setup terminal shell instance
	if ( typeof ( window.shell_instances ) == 'undefined' )
		window.shell_instances = [];
	for( var a = 1; a < 9999; a++ )
	{
		if ( typeof ( window.shell_instances[a] ) == 'undefined' || !window.shell_instances[a] )
		{
			window.shell_instances[a] = true;
			break;
		}
	}
	w.instanceId = a;
	w.setFlag( 'title', 'New Shell' );
	w.currentPath = 'System:';
	w.currentCLI = false;
	w.cliTemplate = false;
	w.instanceNum = a;
	w.getInstanceNum = function()
	{
		return this.instanceNum;
	}
	w.onClose = function()
	{
		this.preventClose();
		function doQuit()
		{
			Application.quit();
		}
		
		var msg = {
			command: 'quit_shell',
			callbackId: addCallback( doQuit )
		};
		
		w.sendMessage( msg );
	}

	// Load resources
	var f = new File( 'Progdir:Templates/terminal.html' );
	f.onLoad = function( data )
	{
		w.setContent( data, function()
		{
			if( packet.args )
			{
				w.sendMessage( {
					command: 'execute',
					args: packet.args
				} );
			}
		} );
	}
	f.load();
};

Application.receiveMessage = function( msg )
{
	if( msg.command )
	{
		switch( msg.command )
		{
			case 'activate':
				this.view.activate();
				break;
			case 'quit':
				this.quit();
				break;
			case 'listapplications':
				this.view.sendMessage( { command: 'applicationlist', data: msg.data } );
				break;
		}
	}
};


