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

var pausebtn, playbtn;


Application.run = function( msg, iface )
{
	this.song = false;
	pausebtn = ge( 'pausebutton' );
	this.miniplaylist = false;
	playbtn  = ge( 'playbutton'  );
	this.playlist = [];
	
	this.volume = 64;
	
	CreateSlider( ge( 'Volume' ) );
	
	ge( 'scroll' ).innerHTML = 'You should put on a song :-)';
	
	if( window.isMobile )
	{
		Application.receiveMessage( {
			command: 'miniplaylist',
			visibility: true
		} );
	}
}

Application.setVolume = function( vol )
{
	if( this.song )
		this.song.setVolume( vol / 255 );
}

Application.redrawMiniPlaylist = function()
{
	var playlist = this.playlist;
	var index = this.index;
	
	if( !playlist )
	{
		this.sendMessage( {
			command: 'get_playlist'
		} );
	}
	else
	{
		var sw = 2;
		var tb = document.createElement( 'div' );
		tb.className = 'List NoPadding';
		for( var a = 0; a < playlist.length; a++ )
		{
			var tr = document.createElement( 'div' );
			tr.innerHTML = playlist[a].Filename;
			sw = sw == 1 ? 2 : 1;
			var c = '';
			if( a == index )
			{
				c = ' Selected Playing';
			}
			tr.className = 'Padding Ellipsis sw' + sw + c;
			( function( ele, eles, index )
			{
				tr.onclick = function()
				{
					for( var u = 0; u < eles.childNodes.length; u++ )
					{
						if( eles.childNodes[u] != ele && eles.childNodes[u].classList )
						{
							eles.childNodes[u].classList.remove( 'Playing' );
							eles.childNodes[u].classList.remove( 'Selected' );
						}
					}
					ele.classList.add( 'Playing', 'Selected' );
					Application.sendMessage( { command: 'playsongindex', index: index } );
				}
			} )( tr, tb, a );
			tb.appendChild( tr );
		}
		if( playlist.length > 0 )
		{
			ge( 'MiniPlaylist' ).innerHTML = '';
			ge( 'MiniPlaylist' ).appendChild( tb );
			ge( 'MiniPlaylist' ).style.bottom = '47px';
			ge( 'MiniPlaylist' ).style.height = GetElementHeight( tb );
		}
		else
		{
			ge( 'MiniPlaylist' ).innerHTML = '<div class="List"><div class="sw1">Playlist is empty.</div></div>';
		}
		var h = GetElementHeight( ge( 'visualizer' ) );
		h += GetElementHeight( tb );
		h += GetElementHeight( ge( 'BottomButtons' ) );
		if( h > 300 ) h = 300;
		Application.sendMessage( { command: 'resizemainwindow', size: h } );
	}
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	var bsrc = '/system.library/file/read?authid=' + 
		Application.authId + '&mode=rb';
	
	switch( msg.command )
	{
		case 'updateplaylist':
			this.index = msg.index;
			this.playlist = msg.playlist;
			if( this.miniplaylist )
			{
				this.redrawMiniPlaylist();
			}
			break;
		case 'toggle_miniplaylist':
			this.miniplaylist = this.miniplaylist ? false : true;
			break;
		case 'miniplaylist':
			// Could be we're asked to toggle visibility
			if( msg.visibility ) this.miniplaylist = msg.visibility;
		
			if( this.miniplaylist )
			{
				ge( 'Equalizer' ).style.height = '110px';
				ge( 'MiniPlaylist' ).style.bottom = '47px';
				ge( 'MiniPlaylist' ).style.top = '110px';
				ge( 'MiniPlaylist' ).style.visibility = 'visible';
				ge( 'MiniPlaylist' ).style.inputEvents = '';
				ge( 'MiniPlaylist' ).style.opacity = 1;
				this.index = msg.index;
				this.playlist = msg.playlist;
				this.redrawMiniPlaylist();
			}
			else
			{
				ge( 'Equalizer' ).style.height = 'auto';
				ge( 'Equalizer' ).style.bottom = '47px';
				ge( 'MiniPlaylist' ).style.bottom = '';
				ge( 'MiniPlaylist' ).style.top = 'auto';
				ge( 'MiniPlaylist' ).style.visibility = 'hidden';
				ge( 'MiniPlaylist' ).style.opacity = 0;
				ge( 'MiniPlaylist' ).style.inputEvents = 'none';
			}
			break;
		case 'play':
			if( !msg.item ) return;
			var self = this;
			//var src = '/system.library/file/read?mode=r&readraw=1' +
			//	'&authid=' + Application.authId + '&path=' + msg.item.Path;
			ge( 'progress' ).style.opacity = 0;
			ge( 'scroll' ).innerHTML = '<div>Loading song...</div>';
			if( this.song ) 
			{
				this.song.stop();
				this.song.unload();
			}
			this.song = new AudioObject( msg.item.Path, function( result, err )
			{
				if( !result )
				{
					if( err )
					{
						return;
					}
					// Try the next song
					setTimeout( function()
					{
						Seek( 1 );
					}, 500 );
				}
				else
				{
					// No error
					if( !err )
					{
						self.song.setVolume( ge( 'Volume' ).value / 255 );
					}
				}
			} );
			if( this.miniplaylist )
			{
				var eles = ge( 'MiniPlaylist' ).getElementsByClassName( 'Ellipsis' );
				for( var a = 0; a < eles.length; a++ )
				{
					if( a == msg.index )
					{
						eles[a].classList.add( 'Selected', 'Playing' );
					}
					else
					{
						eles[a].classList.remove( 'Selected', 'Playing' );
					}
				}
				this.index = msg.index;
			}
			this.song.onload = function()
			{
				this.play();
				Application.initVisualizer();
				ge( 'scroll' ).innerHTML = '<div>' + msg.item.Filename + '</div>';
			}
			this.song.onfinished = function()
			{
				Seek( 1 );
			}
			this.song.ct = -1;
			this.song.onplaying = function( progress, ct, pt, dr )
			{	
				var seconds = Math.round( ct - pt ) % 60;
				
				if( this.ct != seconds )
				{
					ge( 'progress' ).style.width = Math.floor( progress * 100 ) + '%';
					ge( 'progress' ).style.opacity = 1;
					
					this.ct = seconds;
					var minutes = Math.round( ct - pt ) < 60 ? 0 : Math.round( ( ( ct - pt ) ) / 60 );
					ge( 'time' ).innerHTML = minutes + ':' + StrPad( seconds, 2, '0' );
				}
			}
			pausebtn.className = pausebtn.className.split( 
				' active' ).join( '' );
			playbtn.classList.remove( 'fa-play' );
			playbtn.classList.add( 'fa-refresh' );
			playbtn.className  = playbtn.className.split( 
				' active' ).join( '' ) + ' active';
			break;
		case 'pause':
			var s = this.song;
			if( !s ) return false;
			s.pause();
			if( s.paused )
			{
				pausebtn.className = pausebtn.className.split( 
					' active' ).join( '' ) + ' active';
				playbtn.className  = playbtn.className.split( 
					' active' ).join( '' ) + ' active';
			}
			else
			{
				// Connect to the source
				Application.initVisualizer();
				pausebtn.className = pausebtn.className.split( 
					' active' ).join( '' );
			}
			break;
		case 'stop':
			var s = this.song;
			if( !s ) return false;
			s.stop();
			pausebtn.className = pausebtn.className.split( 
				' active' ).join( '' );
			playbtn.classList.remove( 'fa-refresh' );
			playbtn.classList.add( 'fa-play' );
			playbtn.className  = playbtn.className.split( 
				' active' ).join( '' );
			ge( 'progress' ).style.opacity = 1;
			
			// Remove eq rect..
			setTimeout( function()
			{
				var eq = ge( 'visualizer' );
				var w = eq.offsetWidth, h = eq.offsetHeight;
				var ctx = eq.getContext( '2d' );
				ctx.fillStyle = '#0F2336';
				ctx.fillRect( 0, 0, w, h );
			}, 250 );
			break;
		case 'drop':
			if( msg.data )
			{
				var items = [];
				for( var a in msg.data )
				{
					items.push( {
						Path: msg.data[a].Path, 
						Filename: msg.data[a].Filename
					} );
				}
				Application.sendMessage( {
					command: 'append_to_playlist_and_play',
					items: items
				} );
			}
			break;
	}
}

// Initialize player!!!
Application.initVisualizer = function()
{
	var eq = ge( 'visualizer' ); var w = eq.offsetWidth, h = eq.offsetHeight;
	eq.setAttribute( 'width', w ); eq.setAttribute( 'height', h );
	
	eq.onclick = function( e )
	{
		if( this.fullscreenEnabled )
		{
			this.classList.remove( 'Fullscreen' );
		}
		else
		{
			this.classList.add( 'Fullscreen' );
		}
		Application.fullscreen( this );
		
	}
	
	var act = this.song.getContext();
	var ana = act.createAnalyser(); ana.fftSize = 2048;
	var bufLength = ana.frequencyBinCount;
	var dataArray = new Uint8Array( bufLength );
	var px = 0, py = 0, bx = 0, sw = 0;
	
	var ctx = eq.getContext( '2d' );
	
	// Connect to the source
	var agr = this.song.loader.audioGraph;
	var src = agr.source;
	src.connect( ana );
	ana.connect( agr.context.destination );
	
	// Run it!
	
	this.dr = function()
	{
		ana.getByteTimeDomainData( dataArray );
		
		// Blur
		var y = 0, x = 0, off = 0, w4 = w << 2;
		var d = ctx.getImageData( 0, 0, w, h );
		for( y = 0; y < h; y++ )
		{
			for( x = 0; x < w4; x += 4 )
			{
				d.data[ off ] -= ( d.data[ off++ ] - 15 ) >> 1;
				d.data[ off ] -= ( d.data[ off++ ] - 35 ) >> 1;
				d.data[ off ] -= ( d.data[ off++ ] - 54 ) >> 1;
				off++;
			}
		}
		ctx.putImageData( d, 0, 0 );
		ctx.strokeStyle = '#54AEFF';
		ctx.lineWidth = 2;
		ctx.beginPath();
		var hh = h / 2;
		var sw = 1 / bufLength * w;
		
		// TODO: If amplitude is high, flash!
		// TODO: Other visualizations
		for( bx = 0, px = 0; bx < bufLength; bx++, px += sw )
		{
			py = dataArray[ bx ] / 128.0 * hh;
			
			if( px == 0 )
			{
				ctx.moveTo( px, py );
			}
			else
			{
				ctx.lineTo( px, py );
			}
		}
		ctx.stroke();
		
		// Only do this when not stopped..
		if( agr.started )
		{
			requestAnimationFrame( Application.dr );
		}
	};
	requestAnimationFrame( Application.dr );
	
}

function PlaySong()
{
	ge( 'player' ).src = '';
	Application.sendMessage( { command: 'playsong' } );
}

function PauseSong()
{
	Application.receiveMessage( { command: 'pause' } );
}

function StopSong()
{
	Application.receiveMessage( { command: 'stop' } );
}

function Seek( direction )
{
	Application.sendMessage( { command: 'seek', dir: direction } ); 
}

function EditPlaylist()
{
	Application.sendMessage( { command: 'edit_playlist' } );
}

