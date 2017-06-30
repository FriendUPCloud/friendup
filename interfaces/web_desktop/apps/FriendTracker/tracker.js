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

/* This is the main tracker editor ------------------------------------------ */

var patternLength     = 64;
var currentTrack      = 0;
var currentInstrument = 0;
var currentSong       = 0;
var currentOctave     = 4;
var playing           = false;
var songPlaying       = false;

var songs = [];
var equalizers = [];

// All available instruments
var instruments = [];

// Fire'er up!
Application.run = function( msg )
{
	this.instruments = [];

	// Add a song!
	var song = createSong( 'Unnamed' );
	songs.push( song );
	currentSong = songs.length-1;
	
	// Refresh the patterns
	redrawPatterns();
	
	// TODO: Next up, reorder the equalizers with more channels!
	var eqcn = ge( 'Equalizers' );
	var eles = eqcn.getElementsByTagName( 'div' );
	var ecnt = 0;
	for( var a = 0; a < eles.length; a++ )
	{
		if( eles[a].parentNode != eqcn ) continue;
		equalizers[ecnt] = eles[a].getElementsByTagName( 'div' )[0];
		eles[a].style.left = 25 * ecnt + '%';
		ecnt++;
	}
	console.log( equalizers );
	
	// Redraw stuff
	keyDown( false );
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'load':
			var f = new File( msg.filename );
			f.onLoad = function( data )
			{
				var dob = JSON.parse( data );
				if( !dob )
					console.log( 'Error... notify!' );
				if( dob.songName )
				{
					loadFromStructure( dob );
				}
			}
			f.load();
			break;
		case 'save':
			var f = new File();
			f.onSave = function( r )
			{
				console.log( 'Result of save: ' + r );
			}
			f.save( getSavableStructure(), msg.filename );
			break;
		case 'addinstrument':
			for( var a in msg.elements )
			{
				if( msg.elements[a].Filename )
				{
					instruments.push( msg.elements[a] );
				}
				redrawInstruments();
			}
			break;
		case 'play':
			var inst = msg.instrument;
			
			var eq = getEqualizer( msg.track );
			if( eq.timeout ) clearTimeout( eq.timeout );
			
			eq.timeout = setTimeout( function(){ eq.style.height = '0%'; eq.style.background = '#a00'; }, 100 );
			eq.style.height = '200px';
			eq.style.background = '#ff0';
			
			if( msg.note )
			{
				var pitch = 1;
				var step = 0.125;
				switch( msg.note.substr( 0, 2 ) )
				{
					case 'c-':
						pitch = 1;
						break;
					case 'c#':
						pitch = 1.05;
						break;
					case 'd-':
						pitch = 1.13;
						break;
					case 'd#':
						pitch = 1.2;
						break;
					case 'e-':
						pitch = 1.25;
						break;
					case 'f-':
						pitch = 1.325;
						break;
					case 'f#':
						pitch = 1.4125;
						break;
					case 'g-':
						pitch = 1.500;
						break;
					case 'g#':
						pitch = 1.6;
						break;
					case 'a-':
						pitch = 1.675;
						break;
					case 'a#':
						pitch = 1.8;
						break;
					case 'h-':
						pitch = 1.9;
						break;
				}
				var oct = parseInt( msg.note.substr( 2, 1 ) );
				if( oct >= 4 )
					pitch *= oct - 3;
				else
				{
					if( oct == 3 )
						pitch /= 2;
					else if( oct == 2 )
						pitch /= 4;
					else if( oct == 1 )
						pitch /= 8;
				}
				if( !this.instruments[inst] )
					return;
				return this.instruments[inst].playArgs( { pitch: pitch } );
			}
			break;
		case 'setinstrument':
			if( msg.args )
			{
				var num = msg.args[0];
				if( msg.args[1] )
				{
					var file = msg.args[1];
					this.instruments[num] = new AudioObject( file );
				}
				this.currentInstrument = this.instruments[num];
				currentInstrument = num;
			}
			break;
		case 'deleteinstrument':
			if( msg.args )
			{
				var out = [];
				var ins = [];
				for( var a = 0; a < Application.instruments.length; a++ )
				{
					if( a != msg.args )
					{
						out.push( Application.instruments[a] );
						ins.push( instruments[a] );
					}
					// TODO: Do I need to free mem here?
					/*else
					{
						destroyPatternDomNodes( song.patterns[a] );
					}*/
				}
				Application.instruments = out;
				instruments = ins;
				if( currentInstrument >= out.length - 1 )
					currentInstrument = out.length - 1;
				this.receiveMessage( { command: 'setinstrument', args: currentInstrument } );
				redrawInstruments();
			}
			break;
		case 'newpattern':
			var song = songs[currentSong];
			// Add a new pattern
			var np = makePattern();
			song.patterns.push( np );
			song.currentPattern = song.patterns.length - 1;
			redrawPatterns();
			break;
		// Delete selected pattern
		case 'deletepattern':
			var song = songs[currentSong];
			if( msg.args )
			{
				var out = [];
				for( var a = 0; a < song.patterns.length; a++ )
				{
					if( a != msg.args )
						out.push( song.patterns[a] );
					else
					{
						destroyPatternDomNodes( song.patterns[a] );
					}
				}
				song.patterns = out;
				if( song.currentPattern >= out.length - 1 )
					song.currentPattern = out.length - 1;
				setPattern( song.currentPattern );
			}
			break;
		// Set current pattern
		case 'setpattern':
			setPattern( msg.args );
			break;
		case 'playpattern':
			playPattern( 1 );
			break;
		case 'drop':
			var fn = msg.data[0].Path;
			var p = fn.split( '.' ); p = p[p.length-1];
			if( p == 'song' )
			{
				this.receiveMessage( {
					command: 'load',
					filename: fn
				} );
			}
			break;
	}
}

function drawTrackerChannel( track, data )
{
	var song = songs[currentSong];
	var pattern = song.patterns[song.currentPattern];
	//var track = pattern.tracks[song.currentTrack];
	
	// Get channels
	var tracks = [];
	var eles = document.getElementsByTagName( 'div' );
	for( var a = 0;	a < eles.length; a++ )
	{
		if( eles[a].className && eles[a].className.substr( 0, 6 ) == 'Column' )
		{
			tracks.push( eles[a] );
		}
	}
	
	tracks[track].innerHTML = '<div class="TrackerList"></div>';
	
	for( var r = 0; r < pattern.patternLength; r++ )
	{
		var d = document.createElement( 'div' );
		d.className = 'Entry';
		
		// Check buffer
		if( !pattern.tracks[track][r] )
			pattern.tracks[track][r] = { note: false };
		var ele = pattern.tracks[track][r];
		if( ele.note )
		{
			setNote( { instrument: ele.instrument, note: ele.note, effects: ele.effect }, d );
		}
		// Empty
		else
		{
			setNote( false, d );
		}
		tracks[track].getElementsByTagName( 'div' )[0].appendChild( d );
		d.row = r;
		// Activate at pointer
		d.onclick = function()
		{
			song.col = track;
			song.row = this.row;
			refreshPattern();
		}
		pattern.tracks[track][r].dom = d;
		pattern.tracks[track][r].dom.object = pattern.tracks[track][r];
	}
}

// Set note info
function setNote( options, dom )
{
	dom.innerHTML = ''; // <- clear it
	
	var d = document.createElement( 'div' ); d.className = 'Instrument';
	var ins =  options.instrument >= 0 ? options.instrument : '0';
	d.innerHTML = ins.length > 1 ? ins : ( '0' + ins );
	var n = document.createElement( 'div' ); n.className = 'Note';
	n.innerHTML = options.note ? options.note : '---';
	var e = document.createElement( 'div' ); e.className = 'Effect';
	/*for( var a = 0; a < 3; a++ )
	{
		var o = document.createElement( 'div' );
		e.innerHTML = options.effect ? options.effect[a] : '-';
		e.appendChild( o );
	}*/
	e.innerHTML = options.effect ? options.effect : '---';
	dom.appendChild( d ); dom.appendChild( n ); dom.appendChild( e );
}

function getEqualizer( num )
{
	return equalizers[ num ];
}

function createSong( songname )
{
	// Container
	var o = {
		songName: songname,
		patterns: [],
		instruments: [],
		currentTrack: 0,
		currentPattern: 0,
		songSpeed: 100,
		row: 0,
		col: 0
	};
	
	var pattern = makePattern();
	
	o.patterns.push( pattern );
	
	return o;
}

// Init a new pattern
function makePattern()
{
	// A pattern
	var pattern = {
		trackCount: 4,
		patternLength: 64,
		tracks: [
			[],[],[],[]
		]
	};
	for( var b = 0; b < pattern.trackCount; b++ )
	{
		for( var a = 0; a < pattern.patternLength; a++ )
		{
			pattern.tracks[b].push( { note: '', effect: '' } );
		}
	}
	
	return pattern;
}

function destroyPatternDomNodes( pattern )
{
	for( var b = 0; b < pattern.trackCount; b++ )
	{
		for( var a = 0; a < pattern.patternLength; a++ )
		{
			if( pattern.tracks[b][a].dom )
			{
				pattern.tracks[b][a].dom.parentNode.removeChild( pattern.tracks[b][a].dom );
				pattern.tracks[b][a].dom = false;
			}
		}
	}
}

// Refresh the current pattern
function refreshPattern()
{
	var song = songs[currentSong];
	var pattern = song.patterns[song.currentPattern];
	var track = pattern.tracks[song.col];
	
	// Make sure we have'em
	if( !pattern.tracks[0][0].dom )
	{
		// Draw dom nodes: TODO: Don't hardcode 4 chans!
		for( var b = 0; b < 4; b++ ) drawTrackerChannel( b );
	}
	
	// Setting classes
	for( var b = 0; b < pattern.trackCount; b++ )
	{
		for( var a = 0; a < pattern.patternLength; a++ )
		{
			if( b == song.col && a == song.row )
			{
				pattern.tracks[b][a].dom.className = 'Entry Active';
			}
			else
			{
				pattern.tracks[b][a].dom.className = 'Entry';
			}
		}
	}
}

/* Events */
function keyDown( e )
{
	var w = e.which ? e.which : e.keyCode;
	var song    = songs[currentSong];
	var pattern = song.patterns[song.currentPattern];
	var track   = pattern.tracks[song.col];
	var edit    = false;
	
	// TODO: Edit on
	if( 1 == 1 )
	{
		switch( w )
		{
			// Z
			case 90:
				edit = [ 'c-' + currentOctave, 'C64' ];
				break;
			// S
			case 83:
				edit = [ 'c#' + currentOctave, 'C64' ];
				break;
			// X
			case 88:
				edit = [ 'd-' + currentOctave, 'C64' ];
				break;
			// D
			case 68:
				edit = [ 'd#' + currentOctave, 'C64' ];
				break;
			// C
			case 67:
				edit = [ 'e-' + currentOctave, 'C64' ];
				break;
			// V
			case 86:
				edit = [ 'f-' + currentOctave, 'C64' ];
				break;
			// G
			case 71:
				edit = [ 'f#' + currentOctave, 'C64' ];
				break;
			// B
			case 66:
				edit = [ 'g-' + currentOctave, 'C64' ];
				break;
			// H
			case 72:
				edit = [ 'g#' + currentOctave, 'C64' ];
				break;
			// N
			case 78:
				edit = [ 'a-' + currentOctave, 'C64' ];
				break;
			// J
			case 74:
				edit = [ 'a#' + currentOctave, 'C64' ];
				break;
			// M
			case 77:
				edit = [ 'h-' + currentOctave, 'C64' ];
				break;
			// Space
			case 32:
				edit = [ '---', '---' ];
				break;
			// Supporting 7 octaves for now
			case 49:
				currentOctave = 1;
				break;
			case 50:
				currentOctave = 2;
				break;
			case 51:
				currentOctave = 3;
				break;
			case 52:
				currentOctave = 4;
				break;
			case 53:
				currentOctave = 5;
				break;
			case 54:
				currentOctave = 6;
				break;
			case 55:
				currentOctave = 7;
				break;
			default: 
				console.log( 'Not caught: ' + w );
				break;
		}
	}
	else
	{
	}
	
	if( edit )
	{
		// Update contents
		track[song.row].instrument = currentInstrument;
		track[song.row].note = edit[ 0 ];
		track[song.row].effect = edit[ 1 ];
		
		if( edit[0] != '---' )
		{
			Application.receiveMessage( 
			{ 
				command: 'play', 
				note: edit[ 0 ],
				track: currentTrack,
				instrument: currentInstrument
			} );
		}
		
		var nt = track[song.row].note;
		var ef = track[song.row].effect;
		var is = track[song.row].instrument;
		var ii = { instrument: is, note: nt, effect: ef };
		setNote( ii, track[song.row].dom );
		
		song.row++;
	}
	
	// With edit both on/off
	switch( w )
	{
		case 40:
			song.row++;
			break;
		case 38:
			song.row--;
			break;
		case 37:
			song.col--;
			break;
		case 39:
			song.col++;
			break;
	}
	
	// Wrap
	if( song.row < 0 ) song.row = pattern.patternLength - 1;
	if( song.row >= pattern.patternLength ) song.row = 0;
	if( song.col < 0 ) song.col = pattern.trackCount - 1;
	if( song.col >= pattern.trackCount ) song.col = 0;
	
	
	// Update the pattern
	refreshPattern();
	
	// Scrolling
	var active = track[song.row].dom;
	var trkdom = active.parentNode.parentNode.parentNode;
	var scy = Math.floor( active.offsetTop - ( trkdom.offsetHeight * 0.5 ) );
	if( active.offsetTop < trkdom.offsetHeight * 0.5 )
		scy = 0;
	trkdom.scrollTop = scy;
}

// Plays the whole song!
function playSong()
{
	if( songPlaying ) return;

	var song = songs[currentSong];
	
	songPlaying = true;
	song.currentPattern = 0;
	
	setPattern( song.currentPattern );
	
	playPattern( 1 );
}

function playPattern( init )
{
	if( init && playing ) return;
	
	playing = true;
	
	var song = songs[currentSong];
	var pattern = song.patterns[song.currentPattern];
	var len = pattern.patternLength;
	var track = pattern.tracks[0];
	
	// TODO: Move to function
	// Set current track
	for( var b = 0; b < pattern.trackCount; b++ )
	{
		track = pattern.tracks[b];
		
		for( var a = 0; a < pattern.patternLength; a++ )
		{
			if( a == song.row && track[song.row].note )
			{
				Application.receiveMessage( 
				{ 
					command: 'play', 
					note: track[song.row].note, 
					track: b,
					instrument: track[song.row].instrument 
				} );
			}
			// Activate!
			if( b == song.col && a == song.row )
			{
				pattern.tracks[b][a].dom.className = 'Entry Active';
			}
			else
			{
				pattern.tracks[b][a].dom.className = 'Entry';
			}
		}
	}
	
	// Scrolling
	var active = track[song.row].dom;
	var trkdom = active.parentNode.parentNode.parentNode;
	var scy = Math.floor( active.offsetTop - ( trkdom.offsetHeight * 0.5 ) );
	if( active.offsetTop < trkdom.offsetHeight * 0.5 )
		scy = 0;
	trkdom.scrollTop = scy;
	
	// Next row
	song.row++;
	if( song.row < len ) 
	{
		setTimeout( function(){ playPattern(); }, 100 );
	}
	else
	{
		if( songPlaying )
		{
			song.currentPattern++;
			if( song.currentPattern >= song.patterns.length )
			{
				songPlaying = false;
				playing = false;
			}
			else
			{
				setPattern( song.currentPattern );
				setTimeout( function(){ playPattern(); }, 100 );
			}
		}
		else
		{		
			playing = false;
		}
	}
}

function deletePattern( num )
{
	Application.receiveMessage( {
		command: 'deletepattern',
		args: num
	} );
}

function redrawPatterns( refreshMode )
{
	var song = songs[currentSong];
	var pats = ge( 'PatternsList' );
	pats.innerHTML = '';
	for( var a = 0; a < song.patterns.length; a++ )
	{
		var patterns = song.patterns;
		var sw = a % 2 + 1;
		var d = document.createElement( 'div' );
		d.className = 'Pattern sw' + sw;
		d.innerHTML = StrPad( a, 6, '0' );
		d.num = a;
		d.onclick = function()
		{
			song.currentPattern = this.num;
			Application.receiveMessage( {
				command: 'setpattern',
				args: this.num
			} );
		}
		pats.appendChild( d );
		
		// Activate current
		if( a == song.currentPattern ) 
		{
			d.className += ' Active';
			song.currentPattern = d.num;
		}
	}
	
	// Refresh the view
	refreshPattern();
}

function newPattern()
{
	Application.receiveMessage( {
		command: 'newpattern'
	} );
}

function setPattern( pat )
{
	var song = songs[currentSong];
	song.row = 0; song.col = 0;
	if( song.patterns[song.currentPattern] )
		destroyPatternDomNodes( song.patterns[song.currentPattern] );
	song.currentPattern = pat;
	redrawPatterns();
}

function deleteInstrument( num )
{
	Application.receiveMessage( { command: 'deleteinstrument', args: num } );
}

function redrawInstruments( refreshMode )
{
	var insd = ge( 'InstrumentList' );
	insd.innerHTML = '';
	for( var a = 0; a < instruments.length; a++ )
	{
		var sw = a % 2 + 1;
		var d = document.createElement( 'div' );
		d.className = 'Instrument sw' + sw;
		d.innerHTML = instruments[a].Filename;
		d.path = instruments[a].Path;
		d.num = a;
		d.onclick = function()
		{
			currentInstrument = this.num;
			Application.receiveMessage( {
				command: 'setinstrument',
				args: [ this.num, this.path ]
			} );
			redrawInstruments( 1 );
		}
		insd.appendChild( d );
		
		// Activate current
		if( a == currentInstrument ) 
		{
			d.className += ' Active';
			currentInstrument = d.num;
			Application.receiveMessage( {
				command: 'setinstrument',
				args: [ d.num, d.path ]
			} );
		}
	}
}

// Load ut!
function loadFromStructure( dobj )
{
	Application.songName = dobj.songName;
	Application.date = dobj.date;
	songs = dobj.songs;
	Application.currentTrack = dobj.currentTrack;
	Application.currentPattern = dobj.currentPattern;
	Application.songSpeed = dobj.songSpeed;
		
	// Load instruments
	Application.instruments = [];
	instruments = [];
	for( var a = 0; a < dobj.instruments.length; a++ )
	{
		instruments[a] = { Filename: dobj.instruments[a].filename };
		var o = new AudioObject( dobj.instruments[a].path );
		Application.instruments[a] = o;
	}
	redrawInstruments();
	
	// Redraw and test!
	setPattern( dobj.currentPattern );
}

// Get a json stringified that can be saved
function getSavableStructure()
{
	var song = songs[0];
	
	// Save object
	var saveObject = {
		songName: 'unnamed',
		date: '2015-11-22 12:00:03',
		songs: [],
		instruments: [],
		currentTrack: song.currentTrack,
		currentPattern: song.currentPattern,
		songSpeed: song.songSpeed,
	};
	
	// Store instruments
	for( var a = 0; a < Application.instruments.length; a++ )
	{
		saveObject.instruments[a] = { path: Application.instruments[a].path, filename: instruments[a].Filename };
	}

	// Store subsongs
	for( var x = 0; x < songs.length; x++ )
	{
		var song = songs[x];
	
		// New song slot
		var dSong = createSong( song.songName );
		dSong.patterns = [];
		for( var a in song ) 
		{
			if( a == 'patterns' ) continue;
			dSong[a] = song[a];
		}
	
		// Store patterns
		for( var a = 0; a < song.patterns.length; a++ )
		{
			var pat = song.patterns[a];
			var spa = makePattern();
			for( var z = 0; z < pat.patternLength; z++ )
			{
				for( var b = 0; b < pat.tracks.length; b++ )
				{
					if( pat.tracks[b][z].note )
					{
						spa.tracks[b][z] = {
							note: pat.tracks[b][z].note,
							instrument: pat.tracks[b][z].instrument,
							effect: pat.tracks[b][z].effect
						};
					}
					else
					{
						spa.tracks[b][z] = false;
					}
				}
			}
			// Attach it
			dSong.patterns[a] = spa;
		}
		saveObject.songs[x] = dSong;
	}
	
	// Return it
	return JSON.stringify( saveObject );
}

if( window.addEventListener )
	window.addEventListener( 'keydown', keyDown );
else window.attachEvent( 'onkeydown', keyDown );

/* GUI Events --------------------------------------------------------------- */

addInstrument = function()
{
	Application.sendMessage( { command: 'addinstrument' } );
}

