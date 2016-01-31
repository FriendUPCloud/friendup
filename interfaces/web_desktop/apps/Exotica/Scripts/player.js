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

var pausebtn, playbtn;


Application.run = function( msg, iface )
{
	this.song = false;
	pausebtn = ge( 'pausebutton' );
	playbtn  = ge( 'playbutton'  );
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	var bsrc = '/system.library/file/read?authid=' + 
		Application.authId + '&mode=rb';
	
	switch( msg.command )
	{
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
			this.initEqualizer();
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
				console.log( 'We are pausing!' );
			}
			else
			{
				pausebtn.className = pausebtn.className.split( 
					' active' ).join( '' );
				console.log( 'Not pausing' );
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
Application.initEqualizer = function()
{
	var eq = ge( 'equalizer' );
	eq.setAttribute( 'width', eq.offsetWidth );
	eq.setAttribute( 'height', eq.ffsetHeight );
	
	var anal = this.song.getContext().createAnalyser();
	
	var ctx = eq.getContext( '2d' );
	
	
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

