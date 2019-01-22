/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var Config = {
};

var filebrowserCallbacks = {
	// Check a file on file extension
	checkFile( path, extension )
	{
		var ext = extension.toLowerCase();
		if( ext == 'html' || ext == 'htm' )
		{
			Application.loadFile( path );
		}
		else
		{
			return;
		}
	},
	// Load a file
	loadFile( path )
	{
		var pp = path.toLowerCase();
		if( pp.substr( pp.length - 4, 4 ) == '.htm' || pp.substr( pp.length - 5, 5 ) == '.html' )
		{
			Application.loadFile( path );
		}
		else
		{
			return;
		}
	},
	folderOpen( ele )
	{
		Application.browserPath = ele;
		Application.refreshFilePane();
	},
	folderClose( ele )
	{
		Application.browserPath = ele;
		Application.refreshFilePane();
	}
};

Application.checkFileType = function( p )
{
	if( p.indexOf( '/' ) > 0 )
	{
		p = p.split( '/' );
		p.pop();
		p = p.join( '/' ) + '/';
	}
	else if( p.indexOf( ':' ) > 0 )
	{
		p = p.split( ':' );
		p = p[0] + ':';
	}
	if( Application.browserPath != p )
	{
		Application.browserPath = p;
	}
}

Application.refreshFilePane = function()
{
	var d = new Door( Application.browserPath );
	d.getIcons( function( items )
	{
		if( !items )
		{
			ge( 'FileBar' ).innerHTML = '';
			return;
		}
		var byDate = [];
		items = items.sort( function( a, b ){ return ( new Date( a.DateModified ) ).getTime() - ( new Date( b.DateModified ) ).getTime(); } );
		items.reverse();
		
		var fBar = ge( 'FileBar' );
		if( !fBar.contents )
		{
			fBar.contents = document.createElement( 'div' );
			fBar.appendChild( fBar.contents );
			fBar.add = document.createElement( 'div' );
			fBar.add.className = 'NewItem';
			fBar.add.innerHTML = '<div class="Button IconButton IconSmall fa-plus">&nbsp;' + i18n( 'i18n_add_item' ) + '</div>';
			fBar.add.onclick = function()
			{
				var testFile = 'unnamed';
				var d = new Door( Application.browserPath );
				d.getIcons( function( icons )
				{
					if( icons )
					{
						var found = false;
						var tries = 1;
						do
						{
							found = false;
							for( var a = 0; a < icons.length; a++ )
							{
								if( icons[ a ].Filename == testFile + '.html' )
								{
									testFile += '_' + ( ++tries );
									found = true;
									break;
								}
							}
						}
						while( found );
					}
					
					var f = new File();
					f.save( "\n", Application.browserPath + testFile + '.html' );
					f.onSave = function()
					{
						Application.refreshFilePane();
					}
				} );
			}
			fBar.appendChild( fBar.add );
		}
		fBar.contents.innerHTML = '';
		fBar.contents.className = 'ContentFull List ScrollArea ScrollBarSmall BorderRight';
		
		var sw = 2;
		
		for( var a = 0; a < items.length; a++ )
		{
			var num = items[ a ];
			var ext = num.Filename.split( '.' );
			ext = ext.pop().toLowerCase();
			if( ext != 'html' && ext != 'htm' ) continue;
			
			sw = sw == 2 ? 1 : 2;
			
			var d = document.createElement( 'div' );
			d.className = 'NotesFileItem Padding BorderBottom MousePointer sw' + sw;
			
			if( Application.currentDocument && Application.currentDocument == num.Path )
			{
				d.classList.add( 'Selected' );
			}
			else
			{
				d.onmouseover = function()
				{
					this.classList.add( 'Selected' );
				}
				d.onmouseout = function()
				{
					this.classList.remove( 'Selected' );
				}
			}
			
			d.innerHTML = '<p class="Layout"><strong>' + num.Filename + '</strong></p><p class="Layout"><em>' + num.DateModified + '</em></p>';
			
			fBar.contents.appendChild( d );
			( function( dl, path ){
				dl.onclick = function()
				{
					Application.loadFile( path );
				}
			} )( d, num.Path );
		};
	} );
}

Application.run = function( msg, iface )
{
	// To tell about ck
	this.ckinitialized = false;
	this.newLine = true;
	this.initCKE();
	
	this.sessionObject.currentZoom = '100%';
	
	AddEvent( 'onresize', function( e )
	{
		Application.checkWidth();
	} );
	
	// Remember content on scroll!
	document.body.onScroll = function( e )
	{
		if( Application.contentTimeout )
			clearTimeout( Application.contentTimeout );
		Application.contentTimeout = setTimeout( function()
		{
			Application.sendMessage( { 
				command: 'remembercontent', 
				data: Application.editor.getData(),
				scrollTop: Application.editor.element.scrollTop
			} );
			Application.contentTimeout = false;
		}, 250 );
	}
	
	var FileBrowser = new Friend.FileBrowser( ge( 'LeftBar' ), { displayFiles: true, path: 'Home:' }, filebrowserCallbacks );
	FileBrowser.render();
	this.fileBrowser = FileBrowser;
}

Application.checkWidth = function()
{
	var ww = window.innerWidth;
	if( ww < 840 )
	{
		editorCommand( 'staticWidth' );
	}
	else
	{
		editorCommand( 'dynamicWidth' );
	}
}

Application.initCKE = function()
{
	if( typeof( ClassicEditor ) == 'undefined' )
		return setTimeout( 'Application.initCKE()', 50 );
	
	if( Application.ckinitialized ) return;
	Application.ckinitialized = true;
	
	ClassicEditor.create( ge( 'Editor' ), {
			fontFamily: {
				options: [
					'default',
					'Ubuntu, Arial, sans-serif',
					'Ubuntu Mono, Courier New, Courier, monospace',
					'Assistant'
				]
		    }
		} )
		.then( editor => {
		
			Application.editor = editor;
			Application.initializeToolbar();
			
			editor.keystrokes.set( 'Ctrl+S', ( data, stop ) => {
				Application.sendMessage( {
					command: 'keydown',
					key: 83,
					ctrlKey: true
				} );
				stop();
			} );
			
			// Load
			editor.keystrokes.set( 'Ctrl+L', ( data, stop ) => {
				Application.sendMessage( {
					command: 'keydown',
					key: 79,
					ctrlKey: true
				} );
				stop();
			} );
			
			editor.keystrokes.set( 'Ctrl+Shift+S', ( data, stop ) => {
				Application.sendMessage( {
					command: 'save_as'
				} );
				stop();
			} );
			
			editor.keystrokes.set( 'Ctrl+Q', ( data, stop ) => {
				Application.sendMessage( {
					command: 'keydown',
					key: 81,
					ctrlKey: true
				} );
				stop();
			} );
			
			// Close
			editor.keystrokes.set( 'Ctrl+W', ( data, stop ) => {
				Application.sendMessage( {
					command: 'keydown',
					key: 73,
					ctrlKey: true
				} );
				stop();
			} );
			
			// Other keys...
			editor.editing.view.document.on( 'keydown', ( evt, data ) => {
				if( Application.contentTimeout )
					clearTimeout( Application.contentTimeout );
				Application.contentTimeout = setTimeout( function()
				{
					Application.sendMessage( { 
						command: 'remembercontent', 
						data: Application.editor.getData(),
						scrollTop: Application.editor.element.scrollTop
					} );
					Application.contentTimeout = false;
					ge( 'Printable' ).innerHTML = Application.editor.getData();
				}, 250 );
			} );
		} )
		.catch( error => {
			console.error( error );
		} );
	
	return;
	
	//CKEDITOR.config.extraAllowedContent = 'img[src,alt,width,height];h1;h2;h3;h4;h5;h6;p';
}

Application.resetToolbar = function()
{
	// ..

	SelectOption( ge( 'ToolFormat' ), 0 );
}

function MyMouseListener( e )
{
	Application.elementHasLineHeight = false;
	
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
		
		/*if( fs.parentNode && fs.style.fontFamily )
		{
			// TODO: Dynamically load font list!
			var fonts = [ 'default',
					'Ubuntu, Arial, sans-serif',
					'Ubuntu Mono, Courier New, Courier, monospace',
					'Assistant' ];
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
		}*/
		
		// Check for lineheight
		var fs = e.target;
		while( fs.parentNode && !fs.style.lineHeight )
		{
			fs = fs.parentNode;
		}
		if( fs.parentNode && fs.style.lineHeight )
		{
			Application.elementHasLineHeight = true;
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
	
	// Set the content!
	if( Application.contentTimeout ) clearTimeout( Application.contentTimeout );
	Application.contentTimeout = setTimeout( function()
	{
		Application.sendMessage( { 
			command: 'remembercontent', 
			data: Application.editor.getData(),
			scrollTop: Application.editor.element.scrollTop
		} );
		Application.contentTimeout = false;
	}, 250 );
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
	Application.editor.setData( Application.editor.getData() + textHere );
	
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
		ge( 'RightBar' ).insertBefore( d, ge( 'RightBar' ).firstChild );
		
		var f = new File( 'Progdir:Templates/toolbar.html' );
		f.onLoad = function( data )
		{
			d.innerHTML = data;
			if( window.innerWidth < 600 )
			{
				ge( 'zoom' ).style.display = 'none';
				ge( 'zoomd' ).style.display = 'none';
			}
			if( isMobile )
			{
				var menuContents = ge( 'MobileMenu' ).getElementsByClassName( 'MenuContents' )[0];
				ge( 'MobileMenu' ).classList.add( 'ScrollBarSmall', 'Button', 'ImageButton', 'IconSmall', 'fa-navicon' );
				ge( 'MobileMenu' ).onclick = function()
				{
					if( this.classList.contains( 'Open' ) )
					{
						this.classList.remove( 'Open' );
					}
					else
					{
						this.classList.add( 'Open' );
					}
				}
				
				function _gtn( p, tags )
				{
					var eles = [];
					for( var a = 0; a < tags.length; a++ )
					{
						var els = p.getElementsByTagName( tags[a] );
						if( els.length )
						{
							var makeAr = [];
							for( var b = 0; b < els.length; b++ )
								makeAr.push( els[b] );
							eles = eles.concat( makeAr );
						}
					}
					return eles;
				}
				
				var eles = _gtn( ge( 'MobileMenu' ), [ 'div', 'input', 'select' ] );
				for( var a = 0; a < eles.length; a++ )
				{
					if( eles[a].title && eles[a].title.length )
					{	
						if( eles[a].style.display == 'none' ) continue;
						var span = document.createElement( 'label' );
						if( !eles[a].id )
							eles[a].id = 'test_' + Math.floor( Math.random() * 100000 );
						span.for = eles[a].id;
						span.classList.add( 'PaddingSmall', 'MarginTop', 'PaddingTop' );
						span.innerHTML = eles[a].title + ':';
						span.ontouchstart = function( e )
						{
							return cancelBubble( e );
						}
						eles[a].parentNode.insertBefore( span, eles[a] );
					}
				}
			}
		}
		f.i18n();
		f.load();
		var bt = ge( 'cke_1_bottom' );
		if( bt )
		{
			bt.className = d.className;
		}
		
		this.initializeBody();
	}
}

Application.initializeBody = function()
{
	AddEvent( 'onmouseup', MyMouseListener );
	AddEvent( 'onkeyup', MyKeyListener );
}

var _repag = 0;
var _lastPageCnt = 0;
var _pageCount = 0;
var _a4pageHeightPx = 1122.66;
function MyKeyListener( e )
{
	if( !Config.usePagination )
	{
		return;
	}
	if( _repag ) return;
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
	this.currentDocument = pth;
	
	Application.refreshFilePane();
	
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
		case 'rtf':
			var m = new Module( 'system' );
			m.onExecuted = function( e, data )
			{
				if( e == 'ok' )
				{
					Application.setCurrentDocument( path );
					
					ge( 'Status' ).innerHTML = 'Loaded';
					Application.editor.setData( data,
						function()
						{
							Application.initializeBody();
						}
					);
					
					// Remember content and top scroll
					Application.sendMessage( { 
						command: 'remembercontent', 
						data: data,
						path: path,
						scrollTop: 0
					} );
					
					setTimeout( function()
					{
						ge( 'Status' ).innerHTML = '';
					}, 500 );
					
					Application.setCurrentDocument( path );
				}
				
				// We got an error...
				else
				{
					ge( 'Status' ).innerHTML = i18n('i18n_failed_to_load_document');
					
					setTimeout( function()
					{
						ge( 'Status' ).innerHTML = '';
					}, 1000 );
				}	
			}
			m.execute( 'convertfile', { path: path, format: 'html', returnData: true } );
			break;
		default:
			var f = new File( path );
			f.onLoad = function( data )
			{
				ge( 'Status' ).innerHTML = i18n('i18n_loaded');
				
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
					function loader( num )
					{
						if( !num ) num = 0;
						if( num > 2 ) return; // <- failed
						var f = Application.editor;
						
						// retry
						if( !f || ( f && !f.element ) )
						{
							return setTimeout( function(){ loader( num+1 ); }, 150 );
						}
						Application.editor.setData( bdata[1] );
					
						Application.setCurrentDocument( path );
					
						// Remember content and top scroll
						Application.sendMessage( { 
							command: 'remembercontent', 
							data: bdata[1],
							path: path,
							scrollTop: 0
						} );
					}
					loader();
					
				}
				// This is not a compliant HTML document
				else
				{
					Application.editor.setData( data );
					
					// Remember content and top scroll
					Application.sendMessage( { 
						command: 'remembercontent', 
						path: path,
						data: data,
						scrollTop: 0
					} );
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
		case 'rtf':
			ge( 'Status' ).innerHTML = i18n('i18n_converting');
					
			var m = new Module( 'system' );
			m.onExecuted = function( e, data )
			{
				if( e == 'ok' )
				{
					ge( 'Status' ).innerHTML = i18n('i18n_written');
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
				Application.refreshFilePane();
			}
			m.execute( 'convertfile', { path: path, data: content, dataFormat: 'html', format: extension } );
			break;
		default:
			var f = new File();
			f.onSave = function()
			{
				ge( 'Status' ).innerHTML = i18n('i18n_written');
				setTimeout( function()
				{
					ge( 'Status' ).innerHTML = '';
				}, 500 );
				Application.refreshFilePane();
			}
			f.save( content, path );
			break;
	}
	
	// Save state
	Application.sendMessage( { 
		command: 'remembercontent', 
		data: Application.editor.getData(),
		scrollTop: Application.editor.element.scrollTop
	} );
}

Application.print = function( path, content, callback )
{
	var v = new View( { title: i18n('i18n_print_preview'), width: 200, height: 100 } );
	v.setContent( '<div class="Padding"><p><strong>' + i18n('i18n_generating_print_preview') + '</strong></p></div>' );
	var m = new Module( 'system' );
	m.onExecuted = function( e, data )
	{
		if( e == 'ok' )
		{
			ge( 'Status' ).innerHTML = i18n('i18n_print_ready');
			setTimeout( function()
			{
				ge( 'Status' ).innerHTML = '';
			}, 500 );
			
			v.close();
			
			if( callback )
			{
				callback( data );
			}
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
	m.execute( 'convertfile', { path: path, format: 'pdf' } );
}

Application.newDocument = function( args )
{
	// Wait till ready
	if( typeof( ClassicEditor ) == 'undefined' )
	{
		return setTimeout( function()
		{
			Application.newDocument( args );
		}, 50 );
	}
	
	// No content? Forget session..
	// TODO: May not be what we want!
	if( !args || !args.content )
	{
		Application.sendMessage( { 
			command: 'remembercontent', 
			data: '',
			scrollTop: 0
		} );
	}
	
	if( args.content )
	{
		var f = document.getElementsByTagName( 'iframe' )[0];
		Application.editor.setData( args.content );
		if( args.scrollTop )
		{
			setTimeout( function()
			{
				var i = document.getElementsByTagName( 'iframe' )[0];
				Application.editor.element.scrollTop = args.scrollTop;
				Application.initializeBody();
			}, 50 );
		}
	}
	else
	{
		Application.editor.setData( '', function()
		{
			Application.initializeBody();
		} );
	}
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

// Apply style from style information
var styleElement = null;
function ApplyStyle( styleObject, depth )
{
	if( !depth ) depth = 0;
	if( !styleElement )
	{
		styleElement = document.createElement( 'style' );
		// TODO: Add this
	}
	var style = '';
	for( var a in styleObject )
	{
		var el = styleObject[a];
		if( depth > 0 )
		{
			switch( a )
			{
				case 'Standard format':
					style += "html body {\n";
					break;
				case 'Headings':
					style += ApplyStyle( styleObject[a], depth + 1 );
					break;
				case 'Heading 1':
					style += "html h1 {\n";
					break;
				case 'Heading 2':
					style += "html h2 {\n";
					break;
				case 'Heading 3':
					style += "html h3 {\n";
					break;
				case 'Heading 4':
					style += "html h4 {\n";
					break;
				case 'Heading 5':
					style += "html h5 {\n";
					break;
				case 'Heading 6':
					style += "html h6 {\n";
					break;
				case 'Paragraph':
					style += "html p {\n";
					break;
				default:
					style += a + " {\n";
					break;
			}
			for( var b in el )
			{
				switch( b )
				{
					case 'border':
						style += 'border: ' + el.border.borderSize + ' ' + el.border.borderStyle + ' ' + el.border.borderColor + ";\n";
						break;
					case 'color':
						style += 'color: ' + el.color + ";\n";
						break;
					case 'fontFamily':
						style += 'font-family: ' + el.fontFamily + ";\n";
						break;
					case 'textDecoration':
						style += 'text-decoration: ' + el.textDecoration + ";\n";
						break;
					case 'fontSize':
						style += 'font-size: ' + el.fontSize + ";\n";
					case 'fontStyle':
						style += 'font-style: ' + el.fontStyle + ";\n";
						break;
					case 'fontWeight':
						style += 'font-weight: ' + el.fontWeight + ";\n";
						break;
				}
			}
			style += "}\n";
		}
		else
		{
			style += ApplyStyle( styleObject[a], depth + 1 );
		}
	}
	if( depth > 0 ) return style;
	styleElement.innerHTML = style;
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'applystyle':
			if( msg.style )
			{
				ApplyStyle( msg.style );
			}
			break;
		case 'print_iframe':
			window.print();
			break;
		case 'makeinlineimages':
			/*var eles = ge( 'Editor' ).getElementsByTagName( 'img' );
			for( var a = 0; a < eles.length; a++ )
			{
				console.log( eles[a] );
			}*/
			break;
		case 'insertimage':
			const i = '<img src="' + getImageUrl( msg.path ) + '" width="100%" height="auto"/>';
			const viewFragment = Application.editor.data.processor.toView( i );
			const modelFragment = Application.editor.data.toModel( viewFragment );
			Application.editor.model.insertContent( modelFragment );
			break;
		case 'loadfiles':
			for( var a = 0; a < msg.files.length; a++ )
			{
				this.loadFile( msg.files[a].Path );
			}
			break;
		case 'print':
			this.print( msg.path, '<!doctype html><html><head><title></title></head><body>' + Application.editor.getData() + '</body></html>', function( data )
			{
				var w = new View( {
					title: i18n('i18n_print_preview') + ' ' + msg.path,
					width: 700,
					height: 800
				} );
				w.setContent( '<iframe style="margin: 0; width: 100%; height: 100%; position: absolute; top: 0; left: 0; border: 0" src="/system.library/file/read/?path=' + data + '&authid=' + Application.authId + '&mode=rb"></iframe><style>html, body{padding:0;margin:0}</style>' );
			} );
			break;
		case 'savefile':
			this.saveFile( msg.path, '<!doctype html><html><head><title></title></head><body>' + Application.editor.getData() + '</body></html>' );
			break;
		case 'newdocument':
			var o = {
				content: msg.content ? msg.content : '', 
				scrollTop: msg.scrollTop >= 0 ? msg.scrollTop : 0,
				path: msg.path ? msg.path : ''
			};
			this.newDocument( o );
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
	var editor = Application.editor;
	
	var f = {};
	f.execCommand = function( cmd, val )
	{
		return Application.editor.execute( cmd, val ? { value: val } : false );
	}

	var defWidth = 640;
	
	if( command.substr( 0, 4 ) == 'zoom' )
	{
		if( value == 'store' ) Application.sessionObject.currentZoom = command.split('zoom').join('');
	}
	
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
	else if( command == 'olbullets' )
	{
		f.execCommand( 'insertOrderedList', false, false );
	}
	else if( command == 'ulbullets' )
	{
		f.execCommand( 'insertUnorderedList', false, false );
	}
	else if( command == 'align-left' )
	{
		f.execCommand( 'alignment', 'left', false );
	}
	else if( command == 'align-right' )
	{
		f.execCommand( 'alignment', 'right', false );
	}
	else if( command == 'align-center' )
	{
		f.execCommand( 'alignment', 'center', false );
	}
	else if( command == 'align-justify' )
	{
		f.execCommand( 'alignment', 'justify', false );
	}
	else if( command == 'fontType' )
	{
		f.execCommand( 'fontFamily', value, false );
	}
	/*else if( command == 'line-height' )
	{
		var st = !Application.elementHasLineHeight ? '2em' : '';
		var s = new CKEDITOR.style( { attributes: { style: 'line-height: ' + st } } );
		editor.applyStyle( s );
	}*/
	else if( command == 'formath2' )
	{
		f.execCommand( 'heading', 'heading1' );
	}
	else if( command == 'formath3' )
	{
		f.execCommand( 'heading', 'heading2' );
	}
	else if( command == 'formath4' )
	{
		f.execCommand( 'heading', 'heading3' );
	}
	else if( command == 'formath5' )
	{
		f.execCommand( 'heading', 'heading4' );
	}
	else if( command == 'formath6' )
	{
		f.execCommand( 'heading', 'heading5' );
	}
	else if( command == 'formatp' )
	{
		f.execCommand( 'removeformat', false, false );
	}
	else if( command == 'formatdefault' )
	{
		f.execCommand( 'removeformat', false, false );
	}
	else if( command == 'fontType' )
	{
		f.execCommand( 'fontFamily', value, false );
	}
	else if( command == 'fontSize' )
	{
		f.execCommand( 'fontSize', value, false );
	}
}

var documentStyles = [
	{
		name: 'Headings',
		children: [
			{
				name: 'Heading 1',
				rule: 'h1',
				data: ''
			},
			{
				name: 'Heading 2',
				rule: 'h2',
				data: ''
			},
			{
				name: 'Heading 3',
				rule: 'h3',
				data: ''
			},
			{
				name: 'Heading 4',
				rule: 'h4',
				data: ''
			},
			{
				name: 'Heading 5',
				rule: 'h5',
				data: ''
			},
			{
				name: 'Heading 6',
				rule: 'h6',
				data: ''
			}
		]
	},
	{
		name: 'Standard format',
		rule: 'html body',
		data: ''
	},
	{
		name: 'Paragraph',
		rule: 'p',
		data: ''
	}
];
var styleView = null;
function editStyles()
{
	if( styleView ) return;
	var v = new View( {
		title: i18n( 'i18n_edit_styles' ),
		width: 600,
		height: 500
	} );
	v.onClose = function()
	{
		styleView = null;
	};
	var f = new File( 'Progdir:Templates/style_editor.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data, function()
		{
			v.sendMessage( {
				command: 'renderstyles',
				styles: JSON.stringify( documentStyles )
			} );
		} );
	}
	f.load();
};

// 
function imageWindow( currentImage )
{
	/*var v = new View( {
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
	f.load();*/
	
	Application.sendMessage( { command: 'insertimage' } );
}

