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
	// Start with empty playlist
	this.playlist = [];
	this.index = 0;
	this.miniplaylist = false;
	
	var w = new View( {
		title: 'Friend Jukebox',
		width: 400,
		height: 160,
		'min-width': 400,
		'max-width': 400,
		'min-height': 160,
		'max-height': 160,
		resize: false
	} );
	
	this.playlistFilename = false;
	
	w.onClose = function()
	{
		Application.quit();
	}
	
	this.mainView = w;
	
	var f = new File( 'Progdir:Templates/main.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		w.setContent( data );
	}
	f.load();
	
	this.redrawMenu();
	
	// We start with a bang!
	// TODO: Fix bug
	if( msg.args && msg.args.toLowerCase().indexOf( '.mp3' ) > 0 )
	{
		this.receiveMessage( {
			command: 'append_to_playlist_and_play',
			items: [ { Filename: msg.args } ]
		} );
	}
}

Application.redrawMenu = function()
{
	this.mainView.setMenuItems( [
		{
			name: i18n( 'i18n_file' ),
			items: [
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
					name: i18n( 'i18n_load_playlist' ),
					command: 'load_playlist'
				},
				{
					name: i18n( 'i18n_edit_playlist' ),
					command: 'edit_playlist'
				},
				{
					name: i18n( 'i18n_toggle_mini_playlist' + ( this.miniplaylist ? '_hide' : '_show' ) ),
					command: 'mini_playlist'
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
		height: 300
	} );
	var v = this.aboutWindow;
	v.onClose = function()
	{
		Application.aboutWindow = false;
	}
	var f = new File( 'Progdir:Templates/about.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
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
					command: 'load_playlist'
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
					name: i18n( 'i18n_clear_playlist' ),
					command: 'clear_playlist'
				},
				{
					name: i18n( 'i18n_close' ),
					command: 'close_playlisteditor'
				}
			]
		}
	] );
	
	var f = new File( 'Progdir:Templates/playlisteditor.html' );
	f.i18n();
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
				Application.receiveMessage( { command: 'get_playlist' } );
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
		case 'mini_playlist':
			this.mainView.sendMessage( { command: 'miniplaylist' } );
			this.miniplaylist = this.miniplaylist ? false : true;
			this.mainView.setFlag( 'resize', true );
			this.mainView.setFlag( 'height', this.miniplaylist ? 360 : 160 );
			this.mainView.setFlag( 'min-height', this.miniplaylist ? 360 : 160 );
			this.mainView.setFlag( 'max-height', this.miniplaylist ? 360 : 160 );
			this.mainView.setFlag( 'resize', false );
			this.redrawMenu();
			break;
		case 'about_exotica':
			this.openAbout();
			break;
		case 'get_playlist':
			this.mainView.sendMessage( {
				command:  'updateplaylist',
				playlist: this.playlist,
				index:    this.index
			} );
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
		case 'clear_playlist':
			Application.playlist = [];
			Application.playlistWindow.sendMessage( { command: 'refresh', items: [] } );
			Application.receiveMessage( { command: 'get_playlist' } );
			break;
		case 'load_playlist':
			LoadPlaylist();
			break;
		case 'save_playlist':
			SavePlaylist( Application.playlistFilename );
			break;
		case 'save_playlist_as':
			Application.playlistFilename = false;
			SavePlaylist( false );
			break;
		case 'remove_from_playlist':
			var ne = [];
			for( var a = 0; a < this.playlist.length; a++ )
			{
				if( a == msg.item )
					continue;
				ne.push( this.playlist[a] );
			}
			this.playlist = ne;
			if( Application.playlistWindow )
			{
				Application.playlistWindow.sendMessage( {
					command: 'refresh',
					items: Application.playlist
				} );
			}
			Application.receiveMessage( { command: 'get_playlist' } );
			break;
		case 'append_to_playlist_and_play':
			if( msg.items.length )
			{
				var added = 0;
				this.index = this.playlist.length;
				for( var a = 0; a < msg.items.length; a++ )
				{
					var it = msg.items[a];
					if( it.Filename.substr( it.Filename.length - 4, 4 ).toLowerCase() == '.pls' )
					{
						var f = new File( it.Path );
						f.onLoad = function( data )
						{
							var ad = 0;
							var m = data.match( /NumberOfEntries\=([0-9]+)/i );
							if( !m )
								return;
							var numOfEntr = parseInt( m[1] );
							var d = data.split( /[\r]{0,1}\n/i );
							//console.log( data );
							for( var a = 0; a < numOfEntr; a++ )
							{
								var path = '';
								var title = '';
								var spath = 'file' + (a+1);
								var stitle = 'title' + (a+1);
								for( var b = 0; b < d.length; b++ )
								{
									if( d[b].substr( 0, spath.length ).toLowerCase() == spath )
									{
										path = d[b].split( '=' )[1];
									}
									else if( d[b].substr( 0, stitle.length ).toLowerCase() == stitle )
									{
										title = d[b].split( '=' )[1];
									}
								}
								// Add it!
								if( path.length && title.length )
								{
									Application.playlist.push( {
										Filename: title,
										Path: path
									} );
									ad++;
								}
							}
							// Yo!
							if( ad > 0 )
							{
								Application.receiveMessage( { command: 'playsong' } );
								if( Application.playlistWindow )
								{
									Application.playlistWindow.sendMessage( {
										command: 'refresh',
										items: Application.playlist
									} );
								}
								Application.receiveMessage( { command: 'get_playlist' } );
							}
						}
						f.load();
					}
					else 
					{
						this.playlist.push( it );
						added++;
					}
				}
				if( added > 0 )
				{
					this.receiveMessage( { command: 'playsong' } );
					if( Application.playlistWindow )
					{
						Application.playlistWindow.sendMessage( {
							command: 'refresh',
							items: Application.playlist
						} );
						Application.receiveMessage ( { command: 'get_playlist' } );
					}
				}
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

function SavePlaylist( fn )
{
	if( Application.playlistFilename )
	{
		var pl = JSON.stringify( Application.playlist );
		( new File() ).save( pl, Application.playlistFilename );
		return;
	}
	var path = fnam = false;
	if( fn )
	{
		path = fn.indexOf( '/' ) > 0 ? fn.split( '/' ) : fn.split( ':' );
		fnam = path.pop();
	}
	Filedialog( Application.mainView, function( fdat )
	{
		if( !fdat ) return;
		var pl = JSON.stringify( Application.playlist );
		( new File() ).save( pl, fdat );
		Application.playlistFilename = fdat;
	}, path, 'save', fnam, i18n( 'i18n_save_playlist' ) );
}

function LoadPlaylist()
{
	var fn = Application.playlistFilename;
	var path = fnam = false;
	if( fn )
	{
		path = fn.indexOf( '/' ) > 0 ? fn.split( '/' ) : fn.split( ':' );
		fnam = path.pop();
	}
	Filedialog( Application.mainView, function( fdat )
	{
		if( !fdat ) return;
		var f = new File( fdat[0].Path );
		f.onLoad = function( data )
		{
			Application.playlist = JSON.parse( data );
			if( Application.playlist )
			{
				Application.playlistFilename = fdat[0].Path;
			}
			else
			{
				Application.playlist = [];
			}
			if( Application.playlistWindow )
			{
				Application.playlistWindow.sendMessage( {
					command: 'refresh',
					items: Application.playlist
				} );
			}
			Application.mainView.sendMessage( { command: 'play', item: Application.playlist[Application.index] } );
			Application.receiveMessage( { command: 'get_playlist' } );
		}
		f.load();
	}, path, 'load', fnam, i18n( 'i18n_load_playlist' ) );
}

