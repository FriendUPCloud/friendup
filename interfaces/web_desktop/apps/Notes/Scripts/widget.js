/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var mouseInfo = {};

// We're starting the application
Application.run = function( msg )
{
	document.body.onmousedown = function( e )
	{
		if( e.button != 0 )
			return cancelBubble( e );
		mouseInfo.down = true;
		mouseInfo.offset = { x: windowMouseX, y: windowMouseY };
	}
	document.body.onmouseup = function( e )
	{
		mouseInfo = {};
	}
	document.body.onmousemove = function( e )
	{
		if( mouseInfo.down )
		{
			Application.sendMessage( {
				command: 'movewidget',
				offsetx: mouseInfo.offset.x,
				offsety: mouseInfo.offset.y
			} );
		}
	}
	document.body.oncontextmenu = function( e ){ return cancelBubble( e ); }
	reloadNotes( 'Home:Notes/' );
}

let notes = [];

var Note = function( obj, parentEle )
{
	if( !parentEle ) return;
	let d = document.createElement( 'div' );
	this.dom = d;
	
	// Keep on page and within margins!
	if( parentEle.x + 120 >= document.body.clientWidth - marginLeft )
	{
		parentEle.x = marginLeft;
		parentEle.y += 120;
		notesYPos += 120;
	}
	
	d.className = 'Note';
	d.style.left = parentEle.x + 'px';
	d.style.top = parentEle.y + 'px';
	parentEle.x += 120;
	parentEle.appendChild( d );
	
	let rnd = -2 + ( Math.random() * 4 );
	d.style.transform = 'rotatez(' + rnd + 'deg)';
	
	let cnt = document.createElement( 'div' );
	cnt.className = 'Content';
	d.appendChild( cnt );
	d.style.background = colors[ parentEle.currColor ];
	cnt.style.color = colors[ parentEle.currColor + 1 ];
	
	
	let title = obj.Filename.split( '.' ); title.pop(); title = title.join( '.' );
	cnt.innerHTML = '<h2>' + title + '</h2>';
	setTimeout( function()
	{
		cnt.classList.add( 'Showing' );
	}, 5 );
	
	
	notes.push( this );
	
}
Note.prototype.close = function()
{
	this.p.removeChild( this.dom );
}


Application.receiveMessage = function( msg )
{
}

var notesYPos = 0;
var marginTop = 30;
var marginLeft = 30;
var currColor = 0;
var colors = [
	'#FFE26C', '#947700',
	'#FFB878', '#924500',
	'#FF988E', '#A01507',
	'#66D8C1', '#007E65',
	'#7EE7AC', '#009943',
	'#85C4ED', '#0665A2', 
	'#DDB9EB', '#6F1F8E',
	'#FFC66D', '#975D00',
	'#FF9550', '#823300',
	'#FF9287', '#720B00',
	'#5AC3AF', '#006A55',
	'#6FD39B', '#027936',
	'#72B0D9', '#07507F',
	'#CC9BE1', '#611483'
];

// Just reposition these notes!
function refreshNotes()
{
	let rows = ge( 'Notes' ).getElementsByClassName( 'NoteContainer' );
	for( var a = 0; a < rows.length; a++ )
	{
		
	}
}

// Draw notes from new data
function reloadNotes( path, depth )
{
	if( !depth ) depth = 1;
	let volume = path.split( ':' )[0] + ':';
	if( depth == 1 )
	{
		notesYPos = marginTop;
		currColor = 0;
	}
	
	var m = new Library( 'system.library' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			hideNotes();
			return;
		}
		let list = JSON.parse( d );
		let dv = document.createElement( 'div' );
		dv.className = 'NoteContainer';
		
		let header = document.createElement( 'h2' );
		let p = path.split( '/' ); p = p[ p.length - 2 ];
		if( p.indexOf( ':' ) > 0 )
			p = p.split( ':' )[ 1 ];
		header.innerHTML = p;
		dv.appendChild( header );
		
		dv.style.top = notesYPos + 'px';
		dv.style.left = marginLeft + 'px';
		var headerSet = false;
		
		function advanceWithHeader()
		{
			headerSet = true;
			dv.currColor = currColor;
			dv.x = marginLeft;
			dv.y = 60; notesYPos += 60;
			
			// Cycle colors
			currColor += 2; if( currColor >= colors.length ) currColor = 0;
			notesYPos += 120;
			
			ge( 'Notes' ).appendChild( dv );
		}
		
		for( let a = 0; a < list.length; a++ )
		{
			if( list[ a ].Type == 'Directory' )
			{
				reloadNotes( volume + list[ a ].Path, depth + 1 );
			}
			else if( list[ a ].Filename.split( '.' ).pop().toLowerCase() == 'html' )
			{
				if( !headerSet )
					advanceWithHeader();
				list[ a ].Path = volume + list[ a ].Path;
				new Note( list[ a ], dv );
			}
		}
	}
	m.execute( 'file/dir', { path: path } );
}

function hideNotes()
{
}
