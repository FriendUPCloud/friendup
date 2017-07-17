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
}

Application.redrawMiniPlaylist = function( playlist, index )
{
	if( !playlist )
	{
		this.sendMessage( {
			command: 'get_playlist'
		} );
	}
	else
	{
		var sw = 2;
		var str = '<table class="List">';
		for( var a = 0; a < playlist.length; a++ )
		{
			sw = sw == 1 ? 2 : 1;
			var c = '';
			if( a == index )
				c = ' Selected';
			str += '<tr class="sw' + sw + c + '"><td><div class="FullWidth Ellipsis">' + playlist[a].Filename + '</div></td></tr>';
		}
		str += '</table>';
		ge( 'MiniPlaylist' ).innerHTML = str;
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
			if( this.miniplaylist )
				this.redrawMiniPlaylist( msg.playlist, msg.index );
			break;
		case 'toggle_miniplaylist':
			this.miniplaylist = this.miniplaylist ? false : true;
			break;
		case 'miniplaylist':
			// Could be we're asked to toggle visibility
			if( msg.visibility ) this.miniplaylist = msg.visibility;
		
			if( this.miniplaylist )
			{
				ge( 'Equalizer' ).style.bottom = '247px';
				ge( 'MiniPlaylist' ).style.bottom = '47px';
				ge( 'MiniPlaylist' ).style.top = '77px';
				ge( 'MiniPlaylist' ).style.visibility = 'visible';
				ge( 'MiniPlaylist' ).style.inputEvents = '';
				this.redrawMiniPlaylist();
			}
			else
			{
				ge( 'Equalizer' ).style.bottom = '47px';
				ge( 'MiniPlaylist' ).style.bottom = '';
				ge( 'MiniPlaylist' ).style.top = '';
				ge( 'MiniPlaylist' ).style.visibility = 'hidden';
				ge( 'MiniPlaylist' ).style.inputEvents = 'none';
			}
			break;
		case 'play':
			//var src = '/system.library/file/read?mode=r&readraw=1' +
			//	'&authid=' + Application.authId + '&path=' + msg.item.Path;
			ge( 'progress' ).style.opacity = 0;
			if( this.song ) 
			{
				this.song.stop();
				this.song.unload();
			}
			this.song = new AudioObject( msg.item.Path );
			this.song.onload = function()
			{
				this.play();
				Application.initVisualizer();
			}
			this.song.onfinished = function()
			{
				Seek( 1 );
			}
			this.song.onplaying = function( progress )
			{
				ge( 'progress' ).style.width = Math.floor( progress * 100 ) + '%';
				ge( 'progress' ).style.opacity = 1;
			}
			ge( 'scroll' ).innerHTML = msg.item.Filename;
			pausebtn.className = pausebtn.className.split( 
				' active' ).join( '' );
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
			playbtn.className  = playbtn.className.split( 
				' active' ).join( '' );
			ge( 'progress' ).style.opacity = 1;
			
			// Remove eq rect..
			setTimeout( function()
			{
				var eq = ge( 'visualizer' );
				var w = eq.offsetWidth, h = eq.offsetHeight;
				var ctx = eq.getContext( '2d' );
				ctx.fillStyle = 'rgb(0,0,68)';
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
	
	var act = this.song.getContext();
	var ana = act.createAnalyser(); ana.fftSize = 2048;
	var bufLength = ana.frequencyBinCount;
	var dataArray = new Uint8Array( bufLength );
	var px = 0, py = 0, bx = 0, sw = 0;
	
	var ctx = eq.getContext( '2d' );
	
	// Connect to the source
	var agr = this.song.loader.audioGraph
	var src = agr.source;
	src.connect( ana );
	ana.connect( agr.context.destination );
	
	// Run it!
	
	this.dr = function()
	{
		ana.getByteTimeDomainData( dataArray );
		ctx.fillStyle = '#0F2336';
		ctx.fillRect( 0, 0, w, h );
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
		//ctx.lineTo( w, h * 0.5 );
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

