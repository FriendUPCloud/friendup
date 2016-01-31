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
	// Start with empty playlist
	this.playlist = [];
	this.index = 0;
	
	var w = new View( {
		title: 'Exotica',
		width: 400,
		height: 160,
		'min-width': 400,
		'max-width': 400,
		'min-height': 160,
		'max-height': 160
	} );
	
	w.onClose = function()
	{
		Application.quit();
	}
	
	this.mainView = w;
	
	var f = new File( 'Progdir:Templates/main.html' );
	f.onLoad = function( data )
	{
		w.setContent( data );
	}
	f.load();
	
	w.setMenuItems( [
		{
			name: i18n( 'i18n_file' ),
			items: [
				{
					name: i18n( 'i18n_load_playlist' ),
					command: 'loadplaylist'
				},
				{
					name: i18n( 'i18n_about_exotica' ),
					command: 'about_exotica'
				},
				{
					name: i18n( 'i18n_quit' ),
					command: 'quit'
				}
			]
		},
		{
			name: i18n( 'i18n_playlist' ),
			items: [
				{
					name: i18n( 'i18n_edit_playlist' ),
					command: 'edit_playlist'
				}
			]
		}
	] );
}

// About exotica
Application.openAbout = function()
{
	if( this.aboutWindow ) return;
	this.aboutWindow = new View( {
		title: i18n( 'i18n_about_exotica' ),
		width: 400,
		height: 400
	} );
	var v = this.aboutWindow;
	v.onClose = function()
	{
		Application.aboutWindow = false;
	}
}

// Shows the playlist editor
Application.editPlaylist = function()
{
	if( this.playlistWindow ) return;
	this.playlistWindow = new View( {
		title: i18n( 'i18n_edit_playlist' ),
		width: 600,
		height: 600
	} );
	var p = this.playlistWindow;
	p.onClose = function()
	{
		Application.playlistWindow = false;
	}
	
	p.setMenuItems ( [
		{
			name: i18n( 'i18n_file' ),
			items: [
				{
					name: i18n( 'i18n_load_playlist' ),
					command: 'open_playlist'
				},
				{
					name: i18n( 'i18n_save_playlist' ),
					command: 'save_playlist'
				},
				{
					name: i18n( 'i18n_save_playlist_as' ),
					command: 'save_playlist_as'
				},
				{
					name: i18n( 'i18n_add_to_playlist' ),
					command: 'add_to_playlist'
				},
				{
					name: i18n( 'i18n_close' ),
					command: 'close_playlisteditor'
				}
			]
		}
	] );
	
	var f = new File( 'Progdir:Templates/playlisteditor.html' );
	f.onLoad = function( data )
	{
		p.setContent( data, function()
		{
			p.sendMessage( {
				command: 'refresh',
				items: Application.playlist
			} );
		} );
	}
	f.load();
}

Application.openPlaylist = function()
{
	if( this.of ) return;
	this.of = new Filedialog( this.playlistWindow, function( arr )
	{
		console.log( arr );
		Application.of = false;
	}, '', 'load' );
}

Application.addToPlaylist = function( items )
{
	if( !items )
	{
		if( this.af ) return;
		this.af = new Filedialog( this.playlistWindow, function( arr )
		{
			if( arr.length )
			{
				for( var a = 0; a < arr.length; a++ )
				{
					Application.playlist.push( {
						Filename: arr[a].Filename, 
						Path: arr[a].Path
					} );
				}
				if( Application.playlistWindow )
				{
					Application.playlistWindow.sendMessage( {
						command: 'refresh',
						items: Application.playlist
					} );
				}
			}
			Application.af = false;
		}, '', 'load' );
		return;
	}
	
}

// 
Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'about_exotica':
			this.openAbout();
			break;
		case 'edit_playlist':
			this.editPlaylist();
			break;
		case 'open_playlist':
			this.openPlaylist();
			break;
		case 'add_to_playlist':
			this.addToPlaylist();
			break;
		case 'append_to_playlist_and_play':
			if( msg.items.length )
			{
				this.index = this.playlist.length;
				for( var a = 0; a < msg.items.length; a++ )
				{
					this.playlist.push( msg.items[a] );
				}
				this.receiveMessage( { command: 'playsong' } );
			}
			break;
		case 'close_playlisteditor':
			if( this.playlistWindow )
				this.playlistWindow.close();
			break;
		case 'playsong':
			this.mainView.sendMessage( { command: 'play', item: this.playlist[this.index] } );
			break;
		case 'seek':
			this.index += msg.dir;
			if( this.index < 0 ) this.index = this.playlist.length - 1;
			else if( this.index >= this.playlist.length )
				this.index = 0;
			this.mainView.sendMessage( { command: 'play', item: this.playlist[this.index] } );
			break;
		case 'quit':
			Application.quit();
			break;
	}
}

// Shortcut
function ShowPlaylist()
{
	Application.editPlaylist();
}

