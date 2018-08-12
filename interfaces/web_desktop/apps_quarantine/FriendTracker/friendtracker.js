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
* Simple music application                                                     *
*                                                                              *
*******************************************************************************/

Application.run = function( msg )
{
	this.w = new View( {
		title: 'FriendTracker v0.4',
		width: 800,
		height: 500
	} );
	
	this.w.onClose = function()
	{
		Application.quit();
	}
	
	var w = this.w;
	
	var f = new File( 'Progdir:Templates/main.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		w.setContent( data );
	}
	f.load();
	
	initDormant();
	
	w.setMenuItems( [
		{
			name: i18n( 'menu_file' ),
			items: [
				{
					name: i18n( 'menu_load' ),
					command: 'load'
				},
				{
					name: i18n( 'menu_save' ),
					command: 'save'
				},
				{
					name: i18n( 'menu_about' ),
					command: 'about'
				},
				{
					name: i18n( 'menu_quit' ),
					command: 'quit'
				}
			]
		},
		{
			name: i18n( 'menu_pattern' ),
			items: [
				{
					name: i18n( 'menu_pattern_new' ),
					command: 'pattern_new'
				},
				{
					name: i18n( 'menu_pattern_delete' ),
					command: 'pattern_delete'
				}
			]
		}
	] );
	
}

// About dialog
Application.about = function()
{
	if( this.aboutd ) return;
	this.aboutd = new View( {
		title: i18n('i18n_about_friend_tracker'),
		width: 400,
		height: 400
	} );
	
	var f = new File( 'Progdir:Templates/about.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		Application.aboutd.setContent( data );
	}
	f.load();
	
	this.aboutd.onClose = function()
	{
		Application.aboutd = false;
	}
}

Application.receiveMessage = function( msg )
{
	switch( msg.command )
	{
		case 'save':
			this.sd = new Filedialog( this.w, function( ele )
			{
				Application.w.sendMessage( {
					command: 'save',
					filename: ele
				} );
			}, 'Mountlist:', 'save' );
			break;
		case 'load':
			this.sd = new Filedialog( this.w, function( ele )
			{
				Application.w.sendMessage( {
					command: 'load',
					filename: ele[0].Path
				} );
			}, 'Mountlist:', 'load' );
			break;
		case 'addinstrument':
			var f = new Filedialog(
				this.w,
				function( elements )
				{
					Application.w.sendMessage( {
						command: 'addinstrument',
						elements: elements
					} );
				},
				'Mountlist:',
				'load'
			);
			break;
		case 'about':
			this.about();
			break;
		case 'pattern_new':
			this.w.sendMessage( {
				command: 'newpattern'
			} );
			break;
		case 'pattern_delete':
			this.w.sendMessage( {
				command: 'deletepattern'
			} );
			break;
	}
}

function initDormant()
{
	DormantMaster.addAppDoor( {
		title: 'FriendTracker',
		windows: [],
		refresh: function( winObj )
		{
			//winObj.innerHTML = ':)';
		},
		execute: function( func, args )
		{
			switch( func )
			{
				case 'Play':
					Application.w.sendMessage( {
						command: 'play',
						args: args
					} );
					break;
				case 'SetInstrument':
					Application.w.sendMessage( {
						command: 'setinstrument',
						args: args
					} );
					break;
				default:
					console.log( func );
					break;
			}
		},
		addWindow: function( win )
		{
			this.windows.push( win );
		},
		getDoor: function()
		{
			return {
				MetaType: 'Meta',
				Title: this.title + ':',
				IconFile: 'apps/Artisan/icon.png',
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
			var vname = this.title + ':';
			
			if( path.substr(path.length-1,1) != ':' && path.substr(path.length-1,1) != '/' )
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
						},
						{
							MetaType: 'Directory',
							Title: 'Triggers',
							Icon: 'Directory',
							Path: vname + 'Triggers/',
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
					return [
						{
							MetaType: 'Meta',
							Title: 'SetChannel',
							IconFile: 'gfx/icons/128x128/mimetypes/application-octet-stream.png',
							Path: path,
							Position: 'left',
							Module: 'files',
							Command: 'dormant',
							Filesize: 16,
							Type: 'DormantFunction',
							Dormant: this
						},
						{
							MetaType: 'Meta',
							Title: 'SetInstrument',
							IconFile: 'gfx/icons/128x128/mimetypes/application-octet-stream.png',
							Path: path,
							Position: 'left',
							Module: 'files',
							Command: 'dormant',
							Filesize: 16,
							Type: 'DormantFunction',
							Dormant: this
						},
						{
							MetaType: 'Meta',
							Title: 'Play',
							IconFile: 'gfx/icons/128x128/mimetypes/application-octet-stream.png',
							Path: path,
							Position: 'left',
							Module: 'files',
							Command: 'dormant',
							Filesize: 16,
							Type: 'DormantFunction',
							Dormant: this
						}
					];
				// List open files
				case vname + 'Files/':
					var result = [];
					return result;
				default:
					return [];
			}
		}
	} );
}

