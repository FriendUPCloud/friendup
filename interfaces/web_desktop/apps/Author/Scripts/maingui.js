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
	// To tell about ck
	this.ckinitialized = false;
	this.newLine = true;
	this.initCKE();
}

Application.initCKE = function()
{
	if( typeof( CKEDITOR ) == 'undefined' )
		return setTimeout( 'Application.initCKE()', 50 );
	
	if( Application.ckinitialized ) return;
	Application.ckinitialized = true;
	CKEDITOR.replace( ge( 'Editor' ), { 
		on: { 
			instanceReady: function( evt )
			{ 
				//evt.editor.execCommand( 'maximize' ); 
				Application.initializeToolbar();
			},
			contentDom: function( e )
			{
				var editable = e.editor.editable();
				editable.attachListener( e.editor.document, 'keydown', function( evt ) 
				{
					// Pass it back
					if( evt.data.$.ctrlKey )
					{
						// Don't trap irrelevant keys
						switch( evt.data.$.which )
						{
							case 79:
							case 83:
							case 78:
							case 81:
							case 73:
								Application.sendMessage( {
									command: 'keydown',
									key: evt.data.$.which,
									ctrlKey: evt.data.$.ctrlKey
								} );
								cancelBubble ( evt.data.$ );
								return false;
							default:
								break;
						}
						return false;
					}
				} );
				editable.attachListener( e.editor.document, 'mousedown', function( evt )
				{
					Application.sendMessage( {
						command: 'activate'
					} );
				} );
			}
		}
	} );
	CKEDITOR.config.height = '100%';
}

Application.resetToolbar = function()
{
	// ..
	SelectOption( ge( 'ToolFormat' ), 0 );
}

function MyMouseListener( e )
{
	var ele = e.target;
	if( !ele )
	{
		Application.resetToolbar();
	}
	else
	{
		// Check node name -----------------------------------------------------
		
		// Need a real node
		while( 
			ele.parentNode && ( !ele.nodeName || ele.nodeName == 'SPAN' || 
			ele.nodeName == 'EM' || ele.nodeName == 'STRONG' || 
			ele.nodeName == 'U' )
		)
		{
			ele = ele.parentNode;
		}
		if( !ele.parentNode )
		{
			SelectOption( ge( 'ToolFormat' ), 0 );
		}
		else
		{
			switch( ele.nodeName.toLowerCase() )
			{
				case 'h1':
					SelectOption( ge( 'ToolFormat' ), 'h1' );
					break;
				case 'h2':
					SelectOption( ge( 'ToolFormat' ), 'h2' );
					break;
				case 'h3':
					SelectOption( ge( 'ToolFormat' ), 'h3' );
					break;
				case 'h4':
					SelectOption( ge( 'ToolFormat' ), 'h4' );
					break;
				case 'h5':
					SelectOption( ge( 'ToolFormat' ), 'h5' );
					break;
				case 'h6':
					SelectOption( ge( 'ToolFormat' ), 'h6' );
					break;
				case 'p':
					SelectOption( ge( 'ToolFormat' ), 'p' );
					break;
				default:
					SelectOption( ge( 'ToolFormat' ), 0 );
					break;
			}
		}
		
		// Check font style ----------------------------------------------------
		var fs = e.target;
		
		while( fs.parentNode && !fs.style.fontFamily )
		{
			fs = fs.parentNode;
		}
		
		if( fs.parentNode && fs.style.fontFamily )
		{
			// TODO: Dynamically load font list!
			var fonts = [ 'times new roman', 'lato', 'verdana', 'sans serif', 'sans', 'monospace', 'courier' ];
			var current = Trim( fs.style.fontFamily.toLowerCase().split( '\'' ).join( '' ) );
			var found = false;
			for( var a = 0; a < fonts.length; a++ )
			{
				if( fonts[a] == current )
				{
					SelectOption( ge( 'FontSelector' ), fonts[a] );
					found = true;
					break;
				}
			}
			if( !found )
			{
				SelectOption( ge( 'FontSelector' ), 0 );
			}
		}
		else
		{
			SelectOption( ge( 'FontSelector' ), 0 );
		}
		
		// Check font size -----------------------------------------------------
		fs = e.target;
		
		while( fs.parentNode && !fs.style.fontSize )
		{
			fs = fs.parentNode;
		}
		
		if( fs.parentNode && fs.style.fontSize )
		{
			// TODO: Dynamically load font list!
			var fonts = [ 
				 '6pt',  '7pt',  '8pt',  '9pt', '10pt', '11pt', 
				'12pt', '14pt', '16pt', '18pt', '20pt', '24pt',
				'28pt', '32pt', '36pt', '40pt', '48px', '56pt' 
			];
			var current = Trim( fs.style.fontSize.toLowerCase().split( '\'' ).join( '' ) );
			var found = false;
			for( var a = 0; a < fonts.length; a++ )
			{
				if( fonts[a] == current )
				{
					SelectOption( ge( 'FontSize' ), fonts[a] );
					found = true;
					break;
				}
			}
			if( !found )
			{
				SelectOption( ge( 'FontSize' ), '12pt' );
			}
		}
		else
		{
			SelectOption( ge( 'FontSize' ), '12pt' );
		}
	}
}

Application.parseText = function( str )
{
	// TODO: Language settings.
	
	
	// Some quick ones
	if( str.toLowerCase() == 'comma' )
	{
		CleanSpeecher( ',' );
		return;
	}
	
	if( str.toLowerCase() == 'period' )
	{
		CleanSpeecher( '.' );
		return;
	}
	
	if( str.toLowerCase() == 'exclamation mark' )
	{
		CleanSpeecher( '!' );
		return;
	}
	
	if( str.toLowerCase() == 'question mark' )
	{
		CleanSpeecher( '?' );
		return;
	}
	
	if( str.toLowerCase() == 'slash' || str.toLowerCase() == 'forward slash' )
	{
		CleanSpeecher( '/' );
		return;
	}
	
	// Fallback if we don't have what we wanted
	var textHere = str.charAt( 0 ).toUpperCase() + str.substr( 1, str.length - 1 );
	
	// Find period
	var end = textHere.split( ' ' );
	if( end[end.length-1].toLowerCase() == 'period' )
	{
		end[end.length-1] = '.';
		textHere = end.join( ' ' ).split( ' .' ).join( '.' );
	}
	
	// New line
	if( str.toLowerCase() == 'new line' )
	{
		textHere = "<br>";
		this.newLine = true;
	}
	
	if( str.toLowerCase().indexOf( 'comma' ) > 0 )
	{
		textHere = textHere.split( 'comma' ).join( ',' );
	}
	
	textHere = textHere.split( ' , ' ).join( ', ' );
	
	// Insert it
	CleanSpeecher( textHere );
}

function CleanSpeecher( textHere )
{
	if( !Application.newLine && textHere.length != 1 )
	{
		textHere = ' ' + textHere;
	}
	textHere = textHere.split( ' i ' ).join( ' I ' );
	if( textHere.substr( 0, 2 ) == 'i ' )
	{
		textHere = 'I ' + textHere.substr( 2, textHere.length - 2 );
	}
	CKEDITOR.instances.Editor.setData( CKEDITOR.instances.Editor.getData() + textHere );
	
	ge( 'Speecher' ).value = '';
	ge( 'Speecher' ).blur();
	
	Application.newLine = false;
}

// Open a file
Application.open = function()
{
	this.sendMessage( { command: 'openfile' } );
}

Application.initializeToolbar = function()
{
	if( !this.toolbar )
	{
		var d = document.createElement( 'div' );
		d.id = 'AuthorToolbar';
		d.className = 'BackgroundDefault ColorDefault BorderTop';
		this.toolbar = d;
		document.body.appendChild( d );
		
		var f = new File( 'Progdir:Templates/toolbar.html' );
		f.onLoad = function( data )
		{
			d.innerHTML = data;
		}
		f.load();
		var bt = ge( 'cke_1_bottom' );
		if( bt )
		{
			bt.className = d.className;
		}
		
		var pageUrl = getImageUrl( 'Progdir:Gfx/page.png' );
		
		// On click events for our toolbar
		var f = document.getElementsByTagName( 'iframe' )[0];
		f = f.contentWindow;
		f.document.body.parentNode.style.background = '#444444';
		f.document.body.parentNode.style.padding = '0';
		f.document.body.parentNode.style.margin = '0';
		f.document.body.style.position = 'relative';
		f.document.body.style.backgroundColor = '#ffffff';
		f.document.body.style.backgroundImage = 'url(' + pageUrl + ')';
		f.document.body.style.backgroundSize = '595pt 842pt';
		f.document.body.style.backgroundPosition = 'top left';
		f.document.body.style.backgroundRepeat = 'repeat';
		f.document.body.style.padding = '20pt 20pt';
		f.document.body.style.borderRadius = '15px';
		f.document.body.style.width = '595pt';
		f.document.body.style.minHeight = '842pt';
		f.document.body.style.boxSizing = 'border-box';
		f.document.body.style.margin = '20pt 0 20pt 0';
		f.document.body.style.fontSize = '12pt';
		editorCommand( 'zoom100%' );
		AddEvent( 'onmouseup', MyMouseListener, f );
		AddEvent( 'onkeyup', MyKeyListener, f );
	}
}

var _repag = 0;
var _lastPageCnt = 0;
var _pageCount = 0;
var _a4pageHeightPx = 1122.66;
function MyKeyListener( e )
{
	if( _repag ) return;
	_repag = true;
	
	var f = document.getElementsByTagName( 'iframe' )[0];
	f = f.contentWindow.document.body;
	
	if( !f.pageBreaks ) f.pageBreaks = [];
	
	var pages = Math.ceil( f.offsetHeight / _a4pageHeightPx );
	_lastPageCnt = _pageCount;
	_pageCount = pages;
	var lastInd = 0;
	
	if( _lastPageCnt != _pageCount )
	{
		// Clear redundant!
		var lastPage = false;
		var o = [];
		for( var a = 0; a < f.pageBreaks.length; a++ )
		{
			if( a > pages - 1 )
			{
				f.removeChild( f.pageBreaks[a] );
			}
			// Within scope!
			else 
			{
				o.push( f.pageBreaks[a] );
				lastInd = a;
			}
		}
		
		// No aproximate
		var ph = Math.floor( pages * _a4pageHeightPx );
		if( ph <= _a4pageHeightPx ) ph = _a4pageHeightPx;
		f.style.minHeight = ph + 'px';
		
		
		// Create new array with correct pages
		f.pageBreaks = o;
		if( f.pageBreaks.length )
		{
			lastPage = f.pageBreaks[f.pageBreaks.length-1];
			if( lastPage && lastPage.parentNode != f )
				lastPage = false;
		}
		
		// Potentially add pages
		for( var a = lastInd; a < pages; a++ )
		{
			var d = document.createElement( 'img' );
			d.src = getImageUrl( 'Progdir:Gfx/pagebreak.png' );
			d.style.width = '595pt';
			d.style.height = '842pt';
			d.style.margin = '0 0 0 -20pt';
			d.style.float = 'left';
			d.style.clear = 'both';
			d.style.shapeOutside = 'url(' + getImageUrl( 'Progdir:Gfx/pagebreak.png' ) + ')';
			d.style.shapeMargin = '0';
			d.style.pointerEvents = 'none';
			if( lastPage || f.firstChild && f.firstChild.parentNode == f )
			{
				f.insertBefore( d, lastPage ? lastPage : f.firstChild );
			}
			else
			{
				f.appendChild( d );
			}
			f.pageBreaks.push( d );
			lastPage = d;
		}
		
		// Fix the last page
		if( f.pageBreaks.length )
		{
			if( lastPage != f.pageBreaks[f.pageBreaks.length-1] )
				lastPage.src = getImageUrl( 'Progdir:Gfx/pagebreak.png' );
			f.pageBreaks[f.pageBreaks.length-1].src = getImageUrl( 'Progdir:Gfx/pagebreaklast.png' );
		}
		
		/*if( f.offsetHeight > ph )
		{
			// No aproximate
			var ph = Math.floor( pages * _a4pageHeightPx );
			if( ph <= _a4pageHeightPx ) ph = _a4pageHeightPx ;
			f.style.minHeight = ph + 'px';
		}*/
		
	}
	_repag = false;
}

Application.setCurrentDocument = function( pth )
{
	if( pth.indexOf( '/' ) > 0 )
	{
		var fname = pth.split( '/' );
		fname = fname[fname.length-1];
		this.fileName = fname;
	}
	else
	{
		var fname = pth.split( ':' );
		fname = fname[fname.length-1];
		this.fileName = fname;
	}
	this.path = pth.substr( 0, pth.length - this.fileName.length );
	
	this.sendMessage( {
		command: 'currentfile',
		path: this.path,
		filename: this.fileName
	} );
}

Application.loadFile = function( path )
{
	ge( 'Status' ).innerHTML = i18n( 'i18n_status_loading' );
	
	var extension = path.split( '.' ); extension = extension[extension.length-1];
	
	switch( extension )
	{
		case 'doc':
		case 'docx':
		case 'odt':
			var m = new Module( 'files' );
			m.onExecuted = function( e, data )
			{
				if( e == 'ok' )
				{
					Application.setCurrentDocument( path );
					
					ge( 'Status' ).innerHTML = 'Loaded';
					CKEDITOR.instances.Editor.setData( data );
					setTimeout( function()
					{
						ge( 'Status' ).innerHTML = '';
					}, 500 );
				}
				// We got an error...
				else
				{
					ge( 'Status' ).innerHTML = 'Failed to load document...';
					console.log( e, data );
					
					setTimeout( function()
					{
						ge( 'Status' ).innerHTML = '';
					}, 1000 );
				}	
			}
			m.execute( 'loaddocumentformat', { path: path } );
			break;
		default:
			var f = new File( path );
			f.onLoad = function( data )
			{
				ge( 'Status' ).innerHTML = 'Loaded';
				
				// Let's fix authid paths and sessionid paths
				var m = false;
				data = data.split( /authid\=[^&]+/i ).join ( 'authid=' + Application.authId );
				data = data.split( /sessionid\=[^&]+/i ).join ( 'authid=' + Application.authId );
				
				setTimeout( function()
				{
					ge( 'Status' ).innerHTML = '';
				}, 500 );
		
				var bdata = data.match( /\<body[^>]*?\>([\w\W]*?)\<\/body[^>]*?\>/i );
				if( bdata && bdata[1] )
				{
					var f = document.getElementsByTagName( 'iframe' )[0];
					f = f.contentWindow.document.body.innerHTML = bdata[1];
				}
				// This is not a compliant HTML document
				else
				{
					CKEDITOR.instances.Editor.setData( data );
				}
			}
			f.load();
			break;
	}
}

Application.saveFile = function( path, content )
{
	ge( 'Status' ).innerHTML = i18n( 'i18n_status_saving' );
	
	var extension = path.split( '.' ); extension = extension[extension.length-1];
	
	switch( extension )
	{
		case 'doc':
		case 'docx':
		case 'odt':
			
			var f = new File();
			f.onPost = function( res )
			{
				if( res )
				{
					ge( 'Status' ).innerHTML = 'Written';
					setTimeout( function()
					{
						ge( 'Status' ).innerHTML = '';
					}, 500 );
				}
				else
				{
					ge( 'Status' ).innerHTML = 'Error writing...';
					setTimeout( function()
					{
						ge( 'Status' ).innerHTML = '';
					}, 1000 );
				}
			}
			f.post( path, content );
			
			var m = new Module( 'files' );
			m.onExecuted = function( e, data )
			{
				if( e == 'ok' )
				{
					ge( 'Status' ).innerHTML = 'Written';
					setTimeout( function()
					{
						ge( 'Status' ).innerHTML = '';
					}, 500 );
				}
				// We got an error...
				else
				{
					ge( 'Status' ).innerHTML = data;
					setTimeout( function()
					{
						ge( 'Status' ).innerHTML = '';
					}, 1000 );
				}
			}
			m.execute( 'writedocumentformat', { path: path, data: content } );
			
			break;
		default:
			var f = new File();
			f.onSave = function()
			{
				ge( 'Status' ).innerHTML = 'Written';
				setTimeout( function()
				{
					ge( 'Status' ).innerHTML = '';
				}, 500 );
			}
			f.save( path, content );
			break;
	}
}

Application.print = function( path, content, callback )
{
	var m = new Module( 'files' );
	m.onExecuted = function( e, data )
	{
		if( e == 'ok' )
		{
			ge( 'Status' ).innerHTML = 'Printed';
			if( callback )
				callback( data );
			setTimeout( function()
			{
				ge( 'Status' ).innerHTML = '';
			}, 500 );
		}
		// We got an error...
		else
		{
			ge( 'Status' ).innerHTML = data;
			setTimeout( function()
			{
				ge( 'Status' ).innerHTML = '';
			}, 1000 );
		}
	}
	m.execute( 'gendocumentpdf', { path: path, data: content } );
}

Application.newDocument = function()
{
	CKEDITOR.instances.Editor.setData( '' );
}

// TODO: This won't work
Application.handleKeys = function( k, e )
{
	if( e.ctrlKey )
	{
		this.sendMessage( { command: 'keydown', key: k, ctrlKey: e.ctrlKey } );
		return true;
	}
	return false;
}

// Do a meta search on all connected systems
function metaSearch( keywords )
{
	var m = new Module( 'system' );
	m.onExecuted = function( rc, response )
	{
		console.log( response );
	}
	m.execute( 'metasearch', { keywords: keywords } );
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'makeinlineimages':
			/*var eles = ge( 'Editor' ).getElementsByTagName( 'img' );
			for( var a = 0; a < eles.length; a++ )
			{
				console.log( eles[a] );
			}*/
			break;
		case 'insertimage':
			/*var f = new File( msg.path );
			f.onLoad = function( data )
			{
				var i = '<img src="data:image/jpeg;base64,' + Base64.encode( data ) + '"/>';
				CKEDITOR.instances.Editor.insertHtml( i );
			}
			f.load();*/
			var i = '<img src="' + getImageUrl( msg.path ) + '"/>';
			CKEDITOR.instances.Editor.insertHtml( i );
			break;
		case 'loadfiles':
			for( var a = 0; a < msg.files.length; a++ )
			{
				this.loadFile( msg.files[a].Path );
			}
			break;
		case 'print':
			this.print( msg.path, '<!doctype html><html><head><title></title></head><body>' + CKEDITOR.instances.Editor.getData() + '</body></html>', function( data )
			{
				var w = new View( {
					title: 'Print preview ' + msg.path,
					width: 700,
					height: 800
				} );
				w.setContent( '<iframe style="margin: 0; width: 100%; height: 100%; position: absolute; top: 0; left: 0; border: 0" src="/system.library/file/read/?path=' + data + '&authid=' + Application.authId + '&mode=rb"></iframe><style>html, body{padding:0;margin:0}</style>' );
			} );
			break;
		case 'savefile':
			this.saveFile( msg.path, '<!doctype html><html><head><title></title></head><body>' + CKEDITOR.instances.Editor.getData() + '</body></html>' );
			break;
		case 'newdocument':
			this.newDocument();
			break;
		case 'drop':
			for( var a = 0; a < msg.data.length; a++ )
			{
				this.loadFile( msg.data[0].Path );
				this.sendMessage( {
					command: 'syncload',
					filename: msg.data[0].Path
				} );
				break;
			}
			break;
	}
}

// Set some styles
function editorCommand( command, value )
{
	var f = document.getElementsByTagName( 'iframe' )[0];
	f = f.contentWindow.document;
	var editor = CKEDITOR.instances.Editor;
	var defWidth = 640;
	var ed = ge( 'cke_1_contents' );
	if( command == 'bold' )
	{
		f.execCommand( 'bold', false, false );
	}
	else if( command == 'underline' )
	{
		f.execCommand( 'underline', false, false );
	}
	else if( command == 'italic' )
	{
		f.execCommand( 'italic', false, false );
	}
	else if( command == 'image' )
	{
		imageWindow();
	}
	else if( command == 'formath1' )
	{
		var s = new CKEDITOR.style( { element: 'h1' } );
		editor.applyStyle( s );
	}
	else if( command == 'formath2' )
	{
		var s = new CKEDITOR.style( { element: 'h2' } );
		editor.applyStyle( s );
	}
	else if( command == 'formath3' )
	{
		var s = new CKEDITOR.style( { element: 'h3' } );
		editor.applyStyle( s );
	}
	else if( command == 'formath4' )
	{
		var s = new CKEDITOR.style( { element: 'h4' } );
		editor.applyStyle( s );
	}
	else if( command == 'formath5' )
	{
		var s = new CKEDITOR.style( { element: 'h5' } );
		editor.applyStyle( s );
	}
	else if( command == 'formath6' )
	{
		var s = new CKEDITOR.style( { element: 'h6' } );
		editor.applyStyle( s );
	}
	else if( command == 'formatp' )
	{
		var s = new CKEDITOR.style( { element: 'p' } );
		editor.applyStyle( s );
	}
	else if( command == 'formatdefault' )
	{
		f.execCommand( 'removeformat', false, false );
	}
	else if( command == 'zoom100%' )
	{
		ed.style.width = Math.floor( defWidth ) + 'px';
		f.body.style.zoom = 1;
		f.body.style.left = 'calc(50% - 297.5pt)';
	}
	else if( command == 'zoom125%' )
	{
		ed.style.width = Math.floor( defWidth * 1.25 ) + 'px';
		f.body.style.zoom = 1.25;
		var c = Math.floor( defWidth * 1.25 * 0.5 );
		f.body.style.left = 'calc(50% - 297.5pt)';
	}
	else if( command == 'zoom150%' )
	{
		ed.style.width = Math.floor( defWidth * 1.5 ) + 'px';
		f.body.style.zoom = 1.5;
		var c = Math.floor( defWidth * 1.5 * 0.5 );
		f.body.style.left = 'calc(50% - 297.5pt)';
	}
	else if( command == 'zoom200%' )
	{
		ed.style.width = Math.floor( defWidth * 2 ) + 'px';
		f.body.style.zoom = 2;
		var c = Math.floor( defWidth * 2 * 0.5 );
		f.body.style.left = 'calc(50% - 297.5pt)';
	}
	else if( command == 'fontType' )
	{
		var s = new CKEDITOR.style( { attributes: { 'style': 'font-family: ' + value } } );
		editor.applyStyle( s );
	}
	else if( command == 'fontSize' )
	{
		var s = new CKEDITOR.style( { attributes: { 'style': 'font-size: ' + value } } );
		editor.applyStyle( s );
	}
}

// 
function imageWindow( currentImage )
{
	var v = new View( {
		title: currentImage ? i18n('edit_image') : i18n('insert_image'),
		width: 500,
		height: 400,
		'min-width' : 400,
		'min-height' : 300
	} );
	var f = new File( 'Progdir:Templates/image.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
}


