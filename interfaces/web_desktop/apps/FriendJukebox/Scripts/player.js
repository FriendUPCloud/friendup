/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var pausebtn, playbtn, weran, songID = false;

// Initialize the GUI ----------------------------------------------------------
Application.run = function( msg, iface )
{
	weran = true;
	this.song = false;
	pausebtn = ge( 'pausebutton' );
	this.miniplaylist = false;
	playbtn  = ge( 'playbutton'  );
	this.playlist = [];
	
	this.volume = 64;
	
	CreateSlider( ge( 'Volume' ), {
		type: 'volume'
	} );
	
	ge( 'scroll' ).innerHTML = i18n( 'i18n_welcome' );
	
	if( window.isMobile )
	{
		Application.receiveMessage( {
			command: 'miniplaylist',
			visibility: true
		} );
	}
	
	this.clearVisualizer( 50 );
	miniplaylistVisibility();
}

function miniplaylistVisibility()
{
	if( Application.miniplaylist )
	{
		ge( 'MiniPlaylistContainer' ).style.bottom = '47px';
		ge( 'MiniPlaylistContainer' ).style.top = '123px';
		ge( 'MiniPlaylistContainer' ).style.visibility = 'visible';
		ge( 'MiniPlaylistContainer' ).style.inputEvents = '';
		ge( 'MiniPlaylistContainer' ).style.opacity = 1;
	}
	else
	{
		ge( 'Equalizer' ).style.height = 'auto';
		ge( 'Equalizer' ).style.bottom = '47px';
		ge( 'MiniPlaylistContainer' ).style.bottom = '';
		ge( 'MiniPlaylistContainer' ).style.top = 'auto';
		ge( 'MiniPlaylistContainer' ).style.visibility = 'hidden';
		ge( 'MiniPlaylistContainer' ).style.opacity = 0;
		ge( 'MiniPlaylistContainer' ).style.inputEvents = 'none';
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
		for( let a = 0; a < playlist.length; a++ )
		{
			let tr = document.createElement( 'div' );
			let sanitize = playlist[a].Filename;
			if( sanitize.indexOf( '.' ) > 0 )
			{
				sanitize = sanitize.split( '.' );
				sanitize.pop();
				sanitize = sanitize.join( '.' );
			}
			tr.innerHTML = sanitize;
			sw = sw == 1 ? 2 : 1;
			let c = '';
			if( playlist[ a ].UniqueID == songID )
			{
				c = ' Selected';
				c += ' Playing';
			}
			tr.uniqueID = playlist[ a ].UniqueID;
			tr.className = 'Tune Padding Ellipsis sw' + sw + c;
			( function( ele, eles, index )
			{
				tr.onclick = function()
				{
					if( Application.song )
					{
						Application.receiveMessage( { command: 'stop', temporary: true } );
					}
					Application.sendMessage( { command: 'playsongindex', index: index } );
				}
			} )( tr, tb, a );
			tb.appendChild( tr );
		}
		if( playlist.length > 0 )
		{
			ge( 'MiniPlaylist' ).innerHTML = '';
			ge( 'MiniPlaylist' ).appendChild( tb );
			ge( 'MiniPlaylistContainer' ).style.bottom = '45px';
			ge( 'MiniPlaylistContainer' ).style.height = GetElementHeight( tb );
		}
		else
		{
			ge( 'MiniPlaylist' ).innerHTML = '<div class="List"><div class="sw1 Padding">' + i18n( 'i18n_empty_playlist' ) + '</div></div>';
		}
		var h = GetElementHeight( ge( 'visualizer' ) );
		h += GetElementHeight( tb );
		h += GetElementHeight( ge( 'BottomButtons' ) );
		if( h > 300 ) h = 300;
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
				ge( 'Equalizer' ).style.height = '123px';
				this.index = msg.index;
				this.playlist = msg.playlist;
				this.redrawMiniPlaylist();
			}
			miniplaylistVisibility();
			break;
		case 'play':
			if( !msg.item ) return;
			if( !weran )
			{
				if( this.playtimeo )
					clearTimeout( this.playtimeo );
				this.playtimeo = setTimeout( function()
				{
					Application.playtimeo = null;
					Application.receiveMessage( msg );
				}, 50 );
				return this.playtimeo;
			}
			var self = this;
			
			// We're already playing
			if( !msg.forcePlay )
			{
				if( document.body.classList.contains( 'Playing' ) )
				{
					return;
				}
			}
			
			ge( 'progress' ).style.opacity = 0;
			ge( 'scroll' ).innerHTML = '<div>' + i18n( 'i18n_loading_song' ) + '...</div>';
			
			if( this.song ) 
			{
				this.receiveMessage( { command: 'stop', temporary: true } );
			}
			
			// Update song id!
			songID = msg.item.UniqueID;
			this.redrawMiniPlaylist();
			
			this.song = new AudioObject( msg.item.Path, function( result, err )
			{
				if( !result )
				{
					if( err )
					{
						return;
					}
					ge( 'scroll' ).innerHTML = i18n( 'i18n_could_not_load_song' );
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
					if( eles[ a ].uniqueID == songID )
					{
						eles[a].classList.add( 'Selected' );
						eles[a].classList.add( 'Playing' );
					}
					else
					{
						eles[a].classList.remove( 'Selected' );
						eles[a].classList.remove( 'Playing' );
					}
				}
				this.index = msg.index;
			}
			this.song.onload = function()
			{
				if( this.stopped ) return;
				document.body.classList.remove( 'Paused' );
				document.body.classList.add( 'Playing' );
				
				Application.clearVisualizer( 50 );
				
				this.play();
				
				Application.initVisualizer();
				var fn = msg.item.Filename;
				
				var cand = '';
				if( this.loader && this.loader.metadata )
				{
					let md = this.loader.metadata;
					
					if( typeof md.title != undefined && md.title != 'undefined' )
					{
						cand += md.title;
					}
					if( typeof md.artist != undefined && md.artist != 'undefined' )
					{
						cand += ' by ' + md.artist;
					}
					if( typeof md.album != undefined || typeof md.year != undefined )
					{
						cand += ' (';
						if( typeof md.album != undefined && md.album != 'undefined' )
						{
							cand += md.album;
							if( typeof md.year != undefined && md.year != 'undefined' )
								cand += ', ';
						}
						if( typeof md.year != undefined && md.year != 'undefined' )
						{
							cand += md.year;
						}
						cand += ')';
					}
					fn = cand;
				}
				
				if( fn == false ) return;
				ge( 'scroll' ).innerHTML = '<div>' + fn + '</div>';
			}
			this.song.onfinished = function()
			{
				Seek( 1 );
			}
			this.song.ct = -1;
			this.song.onplaying = function( progress, ct, pt, dr )
			{	
				var seconds = Math.round( ct - pt ) % 60;
				
				var timeFin = dr + ( pt - ct );
				var finMins = Math.floor( timeFin / 60 );
				var finSecs = Math.floor( timeFin ) % 60;
				
				if( this.ct != seconds )
				{
					ge( 'progress' ).style.width = ( Math.floor( progress * 10000 ) / 100 ) + '%';
					ge( 'progress' ).style.opacity = 1;
					
					this.ct = seconds;

					if( finMins < 0 )
					{
						Seek( 1 );
						ge( 'time' ).innerHTML = '0:00';
						return;
					}
					ge( 'time' ).innerHTML = finMins + ':' + StrPad( finSecs, 2, '0' );
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
			
			document.body.classList.add( 'Paused' );
			document.body.classList.remove( 'Playing' );
			
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
			
			document.body.classList.remove( 'Paused' );
			document.body.classList.remove( 'Playing' );
			
			s.onfinished = function(){};
			s.stop();
			s.unload();
			
			if( !msg.temporary )
				ge( 'scroll' ).innerHTML = i18n( 'i18n_stopped' );
			
			Application.clearVisualizer( 50 );
			
			pausebtn.className = pausebtn.className.split( 
				' active' ).join( '' );
			playbtn.classList.remove( 'fa-refresh' );
			playbtn.classList.add( 'fa-play' );
			playbtn.className  = playbtn.className.split( 
				' active' ).join( '' );
			ge( 'progress' ).style.opacity = 1;
			break;
		case 'drop':
			if( msg.data )
			{
				var items = [];
				var plistitems = [];
				for( var a in msg.data )
				{
					if( msg.data[ a ].Type == 'Directory' )
					{
						loadRecursiveFolder( msg.data[a].Path );
					}
					if( msg.data[a].Filename.indexOf( '.' ) < 0 ) continue;
					if( msg.data[a].Filename.split( '.' ).pop().toLowerCase() == 'pls' )
					{
						plistitems.push( {
							Path: msg.data[a].Path, 
							Filename: msg.data[a].Filename
						} );
					}
					else
					{
						items.push( {
							Path: msg.data[a].Path, 
							Filename: msg.data[a].Filename
						} );
					}
				}
				if( items.length )
				{
					Application.sendMessage( {
						command: 'append_to_playlist_and_play',
						items: items
					} );
				}
				if( plistitems.length )
				{
					Application.sendMessage( {
						command: 'addplaylists',
						items: plistitems
					} );
				}
			}
			break;
	}
}

function loadRecursiveFolder( path )
{
	var d = new Door( path );
	d.getDirectory( function( items )
	{
		let out = [];
		for( let z = 0; z < items.length; z++ )
		{
			if( items[ z ].Type == 'Directory' )
			{
				loadRecursiveFolder( items[ z ].Path );
			}
			else
			{
				out.push( items[ z ] );
			}
		}
		if( out.length )
		{
			Application.sendMessage( {
				command: 'append_to_playlist_and_play',
				items: out
			} );
		}
	} );
}

Application.clearVisualizer = function( time )
{
	let eq = ge( 'visualizer' ); let w = eq.offsetWidth, h = eq.offsetHeight;
	eq.setAttribute( 'width', w ); eq.setAttribute( 'height', h );

	function f()
	{
		let ctx = eq.getContext( '2d' );
		
		let grd = ctx.createLinearGradient( 0, 0, 0, h );
		grd.addColorStop( 0, '#150423' );
		grd.addColorStop( 0.5, '#362544' );
		grd.addColorStop( 1, '#150423' );
		
		ctx.fillStyle = grd;
		ctx.fillRect( 0, 0, w, h );
	}

	if( time )
	{
		setTimeout( function()
		{
			f();
		}, time );
	}
	else f();
}

// Initialize player!!!
Application.initVisualizer = function()
{	
	if( !this.song || !this.song.getContext )
	{
		return setTimeout( function()
		{
			Application.initVisualizer()
		}, 50 );
	}
	let eq = ge( 'visualizer' ); let w = eq.offsetWidth, h = eq.offsetHeight;
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
	
	let act = this.song.getContext();
	let ana = act.createAnalyser(); ana.fftSize = 2048;
	let bufLength = ana.frequencyBinCount;
	let dataArray = new Uint8Array( bufLength );
	let px = 0, py = 0, bx = 0, sw = 0;
	
	let ctx = eq.getContext( '2d' );
	
	this.clearVisualizer();
	
	// Connect to the source
	let agr = this.song.loader.audioGraph;
	let src = agr.source;
	src.connect( ana );
	ana.connect( agr.context.destination );
	
	// Run it!
	
	let scroll = ge( 'scroll' );
	let scrollPos = 0;
	let scrollDir = -1;
	let waitTime = 0;
	
	// For flashing
	let pcolor = 0;
	let changeTime = 0;
	
	this.dr = function()
	{
		ana.getByteTimeDomainData( dataArray );
		
		// Blur
		let y = 0, x = 0, off = 0, w4 = w << 2;
		let d = ctx.getImageData( 0, 0, w, h );
		let hy = 0;
		let h2 = h >> 1;
		for( y = 0; y < h; y++ )
		{
			hy = y < h2 ? y : ( h - y );
			for( x = 0; x < w4; x += 4 )
			{
				d.data[ off ] -= ( d.data[ off++ ] - 20 - hy ) >> 1;
				d.data[ off ] -= ( d.data[ off++ ] - 3 - hy ) >> 1;
				d.data[ off ] -= ( d.data[ off++ ] - 34 - hy ) >> 1;
				off++;
			}
		}
		ctx.putImageData( d, 0, 0 );
		ctx.strokeStyle = '#C48EFF';
		ctx.lineWidth = 2;
		ctx.beginPath();
		let hh = h >> 1;
		let sw = 1 / bufLength * w;
		
		
		/* Drum flash (not working, disabled)
		let start = dataArray[ bufLength - 1 ];
		let cand = start > 220 ? '#8862B1' : '#000000';
		if( pcolor != cand && changeTime == 0 )
		{
			ge( 'Flash' ).style.backgroundColor = cand;
			pcolor = cand;
			if( cand != '#000000' )
				changeTime = 5;
		}
		if( changeTime > 0 ) changeTime--;*/
		
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
		
		if( scroll.firstChild && waitTime == 0 )
		{
			let scrollW = scroll.offsetWidth - 60;
			let elemenW = scroll.firstChild.offsetWidth;
			if( elemenW > scrollW )
			{
				if( scrollDir < 0 )
				{
					scrollPos -= 0.25;
				
					if( elemenW + scrollPos <= scrollW )
					{
						scrollDir = 1;
						waitTime = 1000;
					}
				}
				else
				{
					scrollPos += 0.25;
					
					if( scrollPos >= 0 )
					{
						scrollDir = -1;
						waitTime = 1000;
					}
				}
				scroll.firstChild.style.left = parseInt( scrollPos ) + 'px';
			}
		}
		if( waitTime > 0 ) waitTime--;
	};
	requestAnimationFrame( Application.dr );
	
}

function PlaySong( force )
{
	if( !force ) force = false;
	ge( 'player' ).src = '';
	Application.sendMessage( { command: 'playsong', forcePlay: force } );
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
	if( Application.song.paused || Application.song.stopped )
		return;
	StopSong();
	Application.sendMessage( { command: 'seek', dir: direction } ); 
}

function EditPlaylist()
{
	Application.sendMessage( { command: 'edit_playlist' } );
}

