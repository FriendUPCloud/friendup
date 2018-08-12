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
/** @file
 *
 * Tree application initial loader
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 20/09/2017
 */

// This is the main run function for jsx files and FriendUP js apps
Application.run = function( msg )
{
	// Make a new window with some flags
	this.view = new View(
	{
		title: i18n( 'Panzers!' ),
		width: 1024,
		height: 768
	} );

	// Load a file from the same dir as the jsx file is located
	var self = this;
	var f = new File( 'Progdir:Templates/index.html' );
	f.onLoad = function( data )
	{
		// Set it as window content
		self.view.setContent( data );
	}
	f.load();

	// On closing the window, quit.
	var view = this.view;
	this.view.onClose = function()
	{
		view.sendMessage( { command: 'quitGame' } );
		setTimeout( function() 
		{
			Application.quit();
		}, 1000 );
	}
};

// Redraws the main application pulldown menu
Application.drawMenu = function()
{
	this.view.setMenuItems(
	[
		{
			name: i18n( 'i18n_file' ),
			items:
			[
				{
					name: i18n( 'i18n_about' ),
					command: 'about'
				},
				{
					name: i18n( 'i18n_quit' ),
					command: 'quit'
				}
			]
		}
	] );
};

// Message handling
Application.receiveMessage = function( msg )
{
	switch( msg.command )
	{
	case 'quit':
		Application.quit();
		break;
	case 'dormant':
		switch ( msg.subCommand )
		{
			case 'addAppDoor':
				this.addDormantDoor( msg.appName, msg.functions );
				break;
			case 'setFunctions':
				this.setDormantFunctions( msg.functions );
				break;
			case 'close':
				this.closeDormantDoor();
				break;
		}
		break;
	case 'about':
		this.about();
		break;
	}
};

// About box
Application.about = function()
{
	if( this.aboutWindow )
		return;
	this.aboutWindow = new View(
	{
		title: i18n( 'i18n_about0' ),
		width: 400,
		height: 300
	} );
	var v = this.aboutWindow;
	this.aboutWindow.onClose = function()
	{
		Application.aboutWindow = false;
	}
	var f = new File( 'Progdir:Templates/about.html' );
	f.i18n();

	var self = this;
	f.onLoad = function( data )
	{
		self.aboutWindow.setContent( data );
	}
	f.load();
};

// Interface with Dormant
// Adds a door
//////////////////////////////////////////////////////////////////////////////
Application.setDormantFunctions = function( functions )
{
	this.dormantFunctions = functions;
};
Application.closeDormantDoor = function( )
{
	if ( this.door )
	{
		DormantMaster.delAppDoor( this.door );
		this.door = null;
	}
};
Application.addDormantDoor = function( appName, functions )
{
	this.dormantAppName = appName;
	this.dormantFunctions = functions;
	this.dormantOn = true;

	// Add local dormant door
	var self = this;
	this.door = 
	{
		title: self.dormantAppName,
		windows: [],

		refresh: function( winObj )
		{
			winObj.innerHTML = ':)';
		},

		addWindow: function( win )
		{
			this.windows.push( win );
		},

		execute: function( func, args, callback )
		{	
			// Relay the message to the tree
			var message =
			{
				command: 'dormant',
				subCommand: 'execute',				
				type: 'dormant',
				functionName: func,
				args: args
			};
			self.view.sendMessage( message );
			self.pollEvent( func, null );
		},

		getDoor: function()
		{
			return {
				MetaType: 'Meta',
				Title: self.dormantAppName + ':',
				IconFile: 'apps/FriendCreate/icon_door.png',
				Position: 'left',
				Module: 'files',
				Command: 'dormant',
				Filesize: 4096,
				Flags: '',
				Type: 'Directory',
				Dormant: this
			};
		},

		getDirectory: function( path )
		{
			var vname = self.dormantAppName + ':';
			
			if( path.substr( path.length - 1, 1 ) != ':' && path.substr( path.length - 1, 1 ) != '/' )
				path += '/';
				
			switch ( path )
			{
				case vname:
					return [
						{
							MetaType: 'Directory',
							Title: 'Functions',
							Icon: 'Directory',
							Path: vname + 'Functions/',
							Position: 'left',
							Module: 'files',
							Command: 'dormant',
							Filesize: 4096,
							Flags: '',
							Type: 'Directory',
							Dormant: this
						},
						{
							MetaType: 'Directory',
							Title: 'Files',
							Icon: 'Directory',
							Path: vname + 'Files/',
							Position: 'left',
							Module: 'files',
							Command: 'dormant',
							Filesize: 4096,
							Flags: '',
							Type: 'Directory',
							Dormant: this
						}
					];
				case vname + 'Functions/':
					var ret = [];
					for( var m = 0; m < self.dormantFunctions.length; m++ )
					{
						ret.push( {
							MetaType: 'Meta',
							Title: self.dormantFunctions[ m ],
							IconFile: 'gfx/icons/128x128/mimetypes/application-octet-stream.png',
							Path: path,
							Position: 'left',
							Module: 'files',
							Command: 'dormant',
							Filesize: 16,
							Type: 'DormantFunction',
							Dormant: this
						} );
					}
					return ret;

				// List open files
				case vname + 'Files/':
					var result = [];
					return result;

				default:
					return [];
			}
		}
	};
	DormantMaster.addAppDoor( this.door );
};
Application.pollEvent = function( ev, data )
{
	var msg = 
	{
		applicationName: this.dormantAppName,
		eventName: ev,
		data: data
	};
	DormantMaster.pollEvent( msg );
};
