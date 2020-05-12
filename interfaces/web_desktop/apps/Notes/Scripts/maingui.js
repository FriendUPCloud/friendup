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

Application.lastSaved = 0;

// Some events -----------------------------------------------------------------

// Don't scroll out of view
document.body.addEventListener( 'scroll', function()
{
	document.body.scroll( 0, 0 );
	document.body.parentNode.scroll( 0, 0 );
}, false );
window.addEventListener( 'scroll', function()
{
	document.body.scroll( 0, 0 );
	document.body.parentNode.scroll( 0, 0 );
}, false );
// End scroll watcher

var currentViewMode = 'default';

// Special styling for mobile --------------------------------------------------

if( isMobile )
{
	ge( 'LeftBar' ).style.transform = 'translate3d(-100%,0,0)';
	ge( 'LeftBar' ).style.width = '100%';
	ge( 'LeftBar' ).style.transition = 'transform 0.25s';
	ge( 'FileBar' ).style.transform = 'translate3d(-100%,0,0)';
	ge( 'FileBar' ).style.width = '100%';
	ge( 'FileBar' ).style.transition = 'transform 0.25s';
	ge( 'RightBar' ).style.transform = 'translate3d(0%,0,0)';
	ge( 'RightBar' ).style.width = '100%';
	ge( 'RightBar' ).style.transition = 'transform 0.25s';
}

// Callbacks for the Friend directory view object ------------------------------

var filebrowserCallbacks = {
	// Check a file on file extension
	checkFile( path, extension )
	{
		
	},
	// Load a file
	loadFile( path )
	{
		
	},
	// Click to open a folder
	folderOpen( ele, e )
	{
		if( isMobile && currentViewMode != 'root' ) return;
		
		Application.browserPath = ele;
		Application.fileSaved = false;
		Application.lastSaved = 0;
		Application.currentDocument = null;
		Application.refreshFilePane( isMobile ? false : 'findFirstFile', false, function( items )
		{
			// Are we refreshing the root dir?
			var isRootDir = Application.fileBrowser.rootPath == ele;
			for( var a = 0; a < items.length; a++ )
			{
				// If it has directory, just wait
				if( !isRootDir && isMobile && items[a].Type == 'Directory' )
				{
					return;
				}
			}
			currentViewMode = 'files';
			Application.updateViewMode();
		} );
		cancelBubble( e );
	},
	// Click to close a folder
	folderClose( ele, e )
	{
		if( isMobile && currentViewMode != 'root' ) return;
		Application.currentDocument = null;
		Application.browserPath = ele;
		Application.refreshFilePane( isMobile ? false : 'findFirstFile', false, function()
		{
			currentViewMode = 'files';
			Application.updateViewMode();
		} );	
		cancelBubble( e );
	}
};

// Checks the file type of a file ----------------------------------------------

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

// On mobile, we handle the back button here -----------------------------------

Application.handleBack = function()
{
	if( !isMobile ) return;
	switch( currentViewMode )
	{
		case 'root':
			currentViewMode = 'root';
			break;
		case 'files':
			currentViewMode = 'root';
			break;
		default:
			currentViewMode = 'files';
			break;
	}
	this.updateViewMode();
}

// On mobile, we only show one content pane at a time. This decides which ------

Application.updateViewMode = function()
{
	if( !isMobile ) return;
	
	switch( currentViewMode )
	{
		case 'root':
			ge( 'LeftBar' ).style.transform = 'translate3d(0,0,0)';
			this.fld.style.transform = 'translate3d(0,0,0)';
			ge( 'FileBar' ).style.transform = 'translate3d(100%,0,0)';
			ge( 'RightBar' ).style.transform = 'translate3d(100%,0,0)';
			this.sendMessage( {
				command: 'updateViewMode',
				mode: 'root',
				browserPath: this.browserPath
			} );
			break;
		case 'files':
			ge( 'LeftBar' ).style.transform = 'translate3d(-100%,0,0)';
			if( this.fld )
				this.fld.style.transform = 'translate3d(-100%,0,0)';
			ge( 'FileBar' ).style.transform = 'translate3d(0%,0,0)';
			ge( 'RightBar' ).style.transform = 'translate3d(100%,0,0)';
			if( isMobile )
			{
				// Force update
				Application.refreshFilePane( false, true );
			}
			this.sendMessage( {
				command: 'updateViewMode',
				mode: 'files',
				browserPath: this.browserPath
			} );
			break;
		default:
			ge( 'LeftBar' ).style.transform = 'translate3d(-100%,0,0)';
			if( this.fld )
				this.fld.style.transform = 'translate3d(-100%,0,0)';
			ge( 'FileBar' ).style.transform = 'translate3d(-100%,0,0)';
			ge( 'RightBar' ).style.transform = 'translate3d(0%,0,0)';
			this.sendMessage( {
				command: 'updateViewMode',
				mode: 'notes',
				browserPath: this.browserPath
			} );
			break;
	}
}

// Refresh the list of files ---------------------------------------------------

Application.refreshFilePane = function( method, force, callback )
{
	if( !method ) method = false;
	
	if( Application.fileBrowser.flags.path.split( '/' ).length > 2 )
	{
		Application.fld.classList.add( 'Hidden' );
	}
	else
	{
		Application.fld.classList.remove( 'Hidden' );
	}
	
	var d = new Door( Application.browserPath );
	
	var self = this;
	
	Application.path = Application.browserPath;
	var p = Application.path;
	
	d.getIcons( function( items )
	{
		if( ge( 'FileBar' ).contents )
		{
			ge( 'FileBar' ).contents.innerHTML = '';
		}
		
		// Something changed in transit. Do nothing
		if( p != Application.path )
		{
			return;
		}
	
		Application._toBeSaved = null;
		
		var byDate = [];
		items = items.sort( function( a, b ){ return ( new Date( a.DateModified ) ).getTime() - ( new Date( b.DateModified ) ).getTime(); } );
		items.reverse();
		
		var fBar = ge( 'FileBar' );
		if( !fBar.contents )
		{
			fBar.contents = document.createElement( 'div' );
			fBar.appendChild( fBar.contents );
			
			// Make an "add new note" button
			fBar.add = document.createElement( 'div' );
			fBar.add.className = 'NewItem';
			fBar.add.innerHTML = '<div class="Button IconButton IconSmall fa-plus">&nbsp;' + i18n( 'i18n_add_note' ) + '</div>';
			fBar.add.onclick = function()
			{
				var testFile = 'unnamed';
				var nextTest = testFile;
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
								if( icons[ a ].Filename == nextTest + '.html' )
								{
									nextTest = testFile + '_' + ( ++tries );
									found = true;
									break;
								}
							}
						}
						while( found );
					}
					
					var f = new File();
					f.save( "\n", Application.browserPath + nextTest + '.html' );
					f.onSave = function()
					{
						Application.currentDocument = Application.browserPath + nextTest + '.html';
						Application.sendMessage( {
							command: 'setfilename',
							data: Application.currentDocument
						} );
						Application.refreshFilePane( false, true );
						Application.loadFile( Application.browserPath + nextTest + '.html', function()
						{
							if( isMobile )
							{
								currentViewMode = 'default';
								Application.updateViewMode();
							}
						} );
					}
				} );
			}
			fBar.appendChild( fBar.add );
		}
		fBar.contents.innerHTML = '';
		fBar.contents.className = 'ContentFull List ScrollArea ScrollBarSmall BorderRight';
		
		var sw = 2;
		var firstFileNum = 0;
		var foundFile = false;

		for( var a = 0; a < items.length; a++ )
		{
			var num = items[ a ];
			var ext = num.Filename.split( '.' );
			ext = ext.pop().toLowerCase();
			if( ext != 'html' && ext != 'htm' ) continue;
			
			if( firstFileNum++ == 0 )
			{
				if( method == 'findFirstFile' && !foundFile )
				{
					Application.loadFile( items[ a ].Path );
					Application.currentDocument = items[ a ].Path;
					fouldFile = true;
				}
			}
			
			sw = sw == 2 ? 1 : 2;
			
			var d = document.createElement( 'div' );
			d.className = 'NotesFileItem Padding BorderBottom MousePointer sw' + sw;
			
			( function( p, o ){
				o.path = p;
			} )( items[ a ].Path, d );
			
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
			
			// No listing here
			var fn = num.Filename.split( '.' );
			fn.pop();
			fn = fn.join( '.' );
			
			d.innerHTML = '<p class="Layout"><strong>' + fn + '</strong></p><p class="Layout"><em>' + num.DateModified + '</em></p>';
			
			// File permissions are given
			// TODO: Check permissions
			var rem = false;
			if( 1 == 1 )
			{
				( function( dd, path ){
					rem = document.createElement( 'div' );
					rem.className = 'IconButton fa-remove IconSmall FloatRight';
					rem.onclick = function( e )
					{
						Confirm( i18n( 'i18n_are_you_sure' ), i18n( 'i18n_delete_note' ), function( result )
						{
							if( result.data )
							{
								var l = new Library( 'system.library' );
								l.onExecuted = function( e, mess )
								{
									if( e == 'ok' )
									{
										if( Application.currentDocument == path )
										{
											ge( 'FileBar' ).add.onclick();
										}
										Application.refreshFilePane();
									}
								}
								l.execute( 'file/delete', { path: path } );
							}
						} );
						return cancelBubble( e );
					}
					if( isMobile )
					{
						rem.ontouchstart = rem.onclick;
					}
					d.insertBefore( rem, d.firstChild );
				} )( d, num.Path );
			}
			
			fBar.contents.appendChild( d );
			
			d.clicker = function( e )
			{
				var s = this;
				if( this.tm )
				{
					clearTimeout( this.tm );
				}
				this.tm = 'block';
			
				var p = this.getElementsByTagName( 'p' )[0];
				var ml = p.innerHTML;
				var inp = document.createElement( 'input' );
				inp.type = 'text';
				inp.className = 'NoMargins';
				inp.style.width = 'calc(100% - 32px)';
				inp.value = p.innerText;
				p.innerHTML = '';
				p.appendChild( inp );
				inp.select();
				inp.focus();
				function renameNow()
				{
					var val = inp.value;
					if( val.substr( val.length - 4, 4 ) != '.htm' && val.substr( val.length - 5, 5 ) != '.html' )
						val += '.html';
					var l = new Library( 'system.library' );
					l.onExecuted = function( e, d )
					{
						if( e == 'ok' )
						{
							Application.sendMessage( {
								command: 'setfilename',
								data: Application.path + val
							} );
							Application.currentDocument = Application.path + val;
							Application.refreshFilePane( false, true );
						}
						// Perhaps give error - file exists
						else
						{
							inp.select();
						}
					}
					l.execute( 'file/rename', { path: s.path, newname: val } );
				}
				p.onkeydown = function( e )
				{
					var k = e.which ? e.which : e.keyCode;
					// Abort
					if( k == 27 )
					{
						if( p && p.parentNode )
							p.innerHTML = ml;
						s.tm = null;
					}
					// Rename
					else if( k == 13 )
					{
						renameNow();
					}
				}
				inp.onblur = function()
				{
					p.innerHTML = ml;
					s.tm = null;
				}
				cancelBubble( e );
			}
			
			// Selected files can be renamed
			if( d.classList.contains( 'Selected' ) )
			{
				if( isMobile )
				{
					( function( dd ) {
						dd.ontouchstart = function( e )
						{
							var f = dd;
							this.editTimeout = setTimeout( function()
							{
								f.editTimeout = null;
								f.clicker();
							}, 750 );
							return cancelBubble( e );
						}
						dd.ontouchend = function()
						{
							if( dd.getElementsByTagName( 'input' ).length ) 
							{
								return;
							}
							var f = this;
							if( f.editTimeout )
							{
								clearTimeout( f.editTimeout );
								f.editTimeout = null;
								Application.currentDocument = f.path;
								Application.loadFile( f.path, function()
								{
									currentViewMode = 'default';
									Application.updateViewMode();
								} );
							}
						}
					} )( d );
				}
				else
				{
					d.onclick = d.clicker;
				}
			}
			// Others are activated
			else
			{
				if( isMobile )
				{
					( function( dd ){ 
						dd.ontouchstart = function( e )
						{
							dd.classList.add( 'Selected' );
							var eles = dd.parentNode.childNodes;
							for( var a = 0; a < eles.length; a++ )
							{
								if( eles[a].tagName == 'DIV' && eles[a] != dd )
									eles[a].classList.remove( 'Selected' );
							}
							var f = dd;
							this.editTimeout = setTimeout( function()
							{
								f.editTimeout = null;
								f.clicker();
							}, 750 );
							return cancelBubble( e );
						}
						dd.ontouchend = function()
						{
							if( dd.getElementsByTagName( 'input' ).length ) 
							{
								return;
							}
							var f = this;
							if( f.editTimeout )
							{
								clearTimeout( f.editTimeout );
								f.editTimeout = null;
								Application.currentDocument = f.path;
								Application.loadFile( f.path, function()
								{
									currentViewMode = 'default';
									Application.updateViewMode();
								} );
							}
						}
					} )( d );
				}
				else
				{
					( function( dl ){
						dl.onclick = function()
						{
							Application.currentDocument = dl.path;
							Application.loadFile( dl.path, function()
							{
								currentViewMode = 'default';
								Application.updateViewMode();
							} );
							Application.refreshFilePane();
						}
					} )( d );
				}
			}
		}
		
		if( !foundFile && method == 'findFirstFile' )
		{
			Application.newDocument( { just: 'makenew' } );
		}
		
		if( callback )
			callback( items );
	} );
}

// We're ready to run! ---------------------------------------------------------

Application.run = function( msg, iface )
{
	var self = this;
	
	// To tell about ck
	this.ckinitialized = false;
	this.newLine = true;
	this.initCKE();
	
	// The Notes application defaults to the notes folder for all content ------
	this.browserPath = 'Home:Notes/';
	
	this.sessionObject.currentZoom = '100%';
	
	AddEvent( 'onresize', function( e )
	{
		Application.checkWidth();
	} );
	
	// Remember content on scroll! ---------------------------------------------
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
	
	// Create the filebrowser pane (or side bar on desktop) --------------------
	var FileBrowser = new Friend.FileBrowser( 
		ge( 'LeftBar' ), 
		{ 
			displayFiles: true, 
			path: 'Home:Notes/', 
			bookmarks: false, 
			rootPath: 'Home:Notes/',
			noContextMenu: true
		}, 
		filebrowserCallbacks );
	FileBrowser.render();
	this.fileBrowser = FileBrowser;
	
	// Make an "add new folder" button -----------------------------------------
	this.fld = document.createElement( 'div' );
	if( isMobile )
	{
		this.fld.style.transform = '-100%';
		this.fld.style.transition = 'transform 0.25s';
	}
	this.fld.className = 'NewFolder BackgroundHeavier';
	this.fld.innerHTML = '<div class="Button IconButton IconSmall fa-folder">&nbsp;' + i18n( 'i18n_add_folder' ) + '</div>';
	this.fld.onclick = function( e )
	{
		var el = document.createElement( 'input' );
		el.type = 'text';
		el.className = 'FullWidth InputHeight';
		el.placeholder = 'foldername';
		ge( 'LeftBar' ).appendChild( el );
		el.select();
		el.focus();
		el.onkeydown = function( e )
		{
			var w = e.which ? e.which : e.keyCode;
			if( w == 27 )
			{
				el.parentNode.removeChild( el );
			}
			else if( w == 13 )
			{
				var l = new Library( 'system.library' );
				l.onExecuted = function()
				{
					self.fileBrowser.refresh();
				}
				l.execute( 'file/makedir', { path: Application.path + this.value } );
			}
		}
		el.blur = function()
		{
			el.parentNode.removeChild( el );
		}
		return cancelBubble( e );
	}
	ge( 'LeftBar' ).parentNode.appendChild( this.fld );
	
	// Update the view mode
	Application.updateViewMode();
}

// Check the current window width ----------------------------------------------

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

// Initialize the CKE editor ---------------------------------------------------

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
				Application.lastSaved = ( new Date() ).getTime();
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
			editor.editing.view.document.on( 'keyup', ( evt, data ) => {
			
				// Guess a new filename from the document data
				var data = Application.editor.element.innerText.split( "\n" )[0].substr( 0, 32 );
				data = data.split( /[^ a-z0-9]/i ).join( '' );
				if( !data.length )
					data = 'unnamed';
			
				// Create temporary file "to be saved"
				if( !Application.currentDocument )
				{
					if( !Application._toBeSaved )
					{
						var fb = ge( 'FileBar' );
						if( fb )
						{
							var d = fb.getElementsByClassName( 'List' );
							if( d.length )
							{
								var el = document.createElement( 'div' );
								el.className = 'NotesFileItem Padding BorderBottom MousePointer New';
								d[0].insertBefore( el, d[0].firstChild );
								Application._toBeSaved = el;
							}
						}
					}
					if( Application._toBeSaved )
						Application._toBeSaved.innerHTML = '<p class="Layout"><strong>' + data + '</strong></p><p class="Layout"><em>' + i18n( 'i18n_unsaved' ) + '...</em></p>';
				}
				// Remove "to be saved"
				else if( Application._toBeSaved )
				{
					console.log( '[key] Remove to be saved.' );
					Application._toBeSaved.parentNode.removeChild( Application._toBeSaved );
					Application._toBeSaved = null;
				}
			
				// Rename or set name
				if( Application.currentDocument != Application.path + data + '.html' )
				{
					if( Application.setFilenameTimeo )
						clearTimeout( Application.setFilenameTimeo );
					Application.setFilenameTimeo = setTimeout( function()
					{
						Application.sendMessage( {
							command: 'setfilename',
							data: Application.path + data + '.html',
							rename: Application.currentDocument ? Application.currentDocument : false
						} );
						Application.setFilenameTimeo = null;
					}, 500 );
				}
			
				if( Application.contentTimeout )
				{
					clearTimeout( Application.contentTimeout );
				}
				Application.contentTimeout = setTimeout( function()
				{
					Application.sendMessage( { 
						command: 'remembercontent', 
						data: Application.editor.getData(),
						scrollTop: Application.editor.element.scrollTop
					} );
					// Save again
					if( Application.fileSaved )
					{
						var test = ( new Date() ).getTime();
						if( test - Application.lastSaved > 1000 )
						{
							Application.sendMessage( {
								command: 'keydown',
								key: 83,
								ctrlKey: true
							} );
						}
					}
					Application.contentTimeout = false;
					ge( 'Printable' ).innerHTML = Application.editor.getData();
				}, 750 );
			} );
		} )
		.catch( error => {
			console.error( error );
		} );
	
	return;
	
	//CKEDITOR.config.extraAllowedContent = 'img[src,alt,width,height];h1;h2;h3;h4;h5;h6;p';
}

// Reset the editor toolbar ----------------------------------------------------

Application.resetToolbar = function()
{
	// ..

	SelectOption( ge( 'ToolFormat' ), 0 );
}

// Listens to mouse events -----------------------------------------------------

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

// Speech-to-text: Parse text based on incoming voice commands -----------------

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

// Done Speech-to-text ---------------------------------------------------------

// Open a file -----------------------------------------------------------------

Application.open = function()
{
	this.sendMessage( { command: 'openfile' } );
}

// Initialize the editor toolbar -----------------------------------------------

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

// Initialize the editor body events -------------------------------------------

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

// Set the current active document ---------------------------------------------

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
	
	// Store the path also for the browser
	Application.browserPath = this.path;

	// Update filebrowser
	this.fileBrowser.setPath( this.path );
	
	Application.refreshFilePane();
	
	this.sendMessage( {
		command: 'currentfile',
		path: this.path,
		filename: this.fileName
	} );
}

// Load a file -----------------------------------------------------------------

Application.loadFile = function( path, cbk )
{
	this.loading = true;
	
	Application.statusMessage( i18n( 'i18n_status_loading' ) );
	
	Application.lastSaved = ( new Date() ).getTime();
	Application.fileSaved = true;
	
	var extension = path.split( '.' ); extension = extension[extension.length-1];
	
	switch( extension )
	{
		default:
			var f = new File( path );
			f.onLoad = function( data )
			{
				Application.statusMessage( i18n('i18n_loaded') );
				
				// Let's fix authid paths and sessionid paths
				var m = false;
				data = data.split( /authid\=[^&]+/i ).join ( 'authid=' + Application.authId );
				data = data.split( /sessionid\=[^&]+/i ).join ( 'authid=' + Application.authId );
		
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
						ge( 'Printable' ).innerHTML = Application.editor.getData();
					
						// Remember content and top scroll
						Application.sendMessage( { 
							command: 'remembercontent', 
							data: bdata[1],
							path: path,
							scrollTop: 0
						} );
						
						Application.setCurrentDocument( path );
						
						if( cbk ) cbk();
					}
					loader();
					
				}
				// This is not a compliant HTML document
				else
				{
					Application.editor.setData( data );
					ge( 'Printable' ).innerHTML = Application.editor.getData();
					
					// Remember content and top scroll
					Application.sendMessage( { 
						command: 'remembercontent', 
						path: path,
						data: data,
						scrollTop: 0
					} );
					
					Application.refreshFilePane();
					
					if( cbk ) cbk();
				}
				Application.loading = false;
			}
			f.load();
			break;
	}
}

// Set a status message --------------------------------------------------------

Application.statusMessage = function( msg )
{
	var s = ge( 'Status' );
	if( s.timeout )
	{
		clearTimeout( s.timeout );
		s.style.transition = '';
		s.style.transform = 'translate3d(0,0,0)';
	}
	s.classList.add( 'Showing' );
	s.innerHTML = msg;
	s.timeout = setTimeout( function()
	{
		s.style.transition = 'left,opacity 0.25s,0.25s';
		s.style.transform = 'translate3d(0,0,0)';
		s.timeout = setTimeout( function()
		{
			s.style.transform = 'translate3d(20px,0,0)';
			s.classList.remove( 'Showing' );
			s.timeout = setTimeout( function()
			{
				s.innerHTML = '';
				s.style.transform = 'translate3d(0,0,0)';
			}, 250 );
		}, 250 );
	}, 1000 );
}

// Save a file -----------------------------------------------------------------

Application.saveFile = function( path, content )
{
	Application.statusMessage( i18n( 'i18n_status_saving' ) );
	
	var extension = path.split( '.' ); extension = extension[extension.length-1];
	
	switch( extension )
	{
		default:
			var f = new File();
			f.onSave = function()
			{
				Application.fileSaved = true;
				Application.lastSaved = ( new Date() ).getTime();
				Application.statusMessage(  i18n('i18n_written') );
				Application.currentDocument = path;
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

// Create a new document -------------------------------------------------------

Application.newDocument = function( args )
{
	// Don't make new document while loading..
	if( this.loading )
		return;
	
	this.fileSaved = false;
	this.lastSaved = 0;
	
	var self = this;
	
	// Wait till ready
	if( typeof( ClassicEditor ) == 'undefined' || !Application.editor )
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
	
	if( args && args.content )
	{
		var f = document.getElementsByTagName( 'iframe' )[0];
		
		
		if( args.path )
		{
			this.setCurrentDocument( args.path );
			this.lastSaved = ( new Date() ).getTime();
		}
		else
		{
			if( args.browserPath )
			{
				this.browserPath = args.browserPath;
				this.path = args.browserPath;
				if( !args.content )
				{
					this.fileBrowser.setPath( args.browserPath );
				}
			}
		}
		
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
		// Blank document
		Application.sendMessage( {
			command: 'newdocument'
		} );
		
		// TODO: Check why we have no editor
		if( Application.editor )
		{
			Application.editor.setData( '', function()
			{
				Application.initializeBody();
			} );
		}
		
		if( args.browserPath )
		{
			this.browserPath = args.browserPath;
			this.path = args.browserPath;
			if( this.fileBrowser )
			{
				this.fileBrowser.setPath( args.browserPath );
			}
			// Try again
			else
			{
				setTimeout( function()
				{
					if( self.fileBrowser )
					{
						self.fileBrowser.setPath( args.browserPath );
					}
				}, 5000 );
			}
		}
	}
}

// Do a meta search on all connected systems -----------------------------------

function metaSearch( keywords )
{
	var m = new Module( 'system' );
	m.onExecuted = function( rc, response )
	{
		console.log( response );
	}
	m.execute( 'metasearch', { keywords: keywords } );
}

// Apply style from style information ------------------------------------------

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

// Receive a Friend or root Application object message -------------------------

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		// Received a request to update view mode
		case 'updateViewMode':
			currentViewMode = msg.mode;
			Application.updateViewMode();
			break;
		// Back button pressed
		case 'mobilebackbutton':
			Application.handleBack();
			break;
		// To apply a style
		case 'applystyle':
			if( msg.style )
			{
				ApplyStyle( msg.style );
			}
			break;
		case 'setcurrentdocument':
			Application.setCurrentDocument( msg.path );
			break;
		// Let's print!
		case 'print_iframe':
			window.print();
			break;
		// Make images into base64 images instead of links
		case 'makeinlineimages':
			/*var eles = ge( 'Editor' ).getElementsByTagName( 'img' );
			for( var a = 0; a < eles.length; a++ )
			{
				console.log( eles[a] );
			}*/
			break;
		// Insert an image with path
		case 'insertimage':
			const i = '<img src="' + getImageUrl( msg.path ) + '" width="100%" height="auto"/>';
			const viewFragment = Application.editor.data.processor.toView( i );
			const modelFragment = Application.editor.data.toModel( viewFragment );
			Application.editor.model.insertContent( modelFragment );
			break;
		// Load some files
		case 'loadfiles':
			for( var a = 0; a < msg.files.length; a++ )
			{
				this.loadFile( msg.files[a].Path );
				break;
			}
			break;
		// Save a file
		case 'savefile':
			this.saveFile( msg.path, '<!doctype html><html><head><title></title></head><body>' + Application.editor.getData() + '</body></html>' );
			break;
		// Create a new document
		case 'newdocument':
			var o = {
				content: msg.content ? msg.content : '', 
				scrollTop: msg.scrollTop >= 0 ? msg.scrollTop : 0,
				path: msg.path ? msg.path : '',
				browserPath: msg.browserPath ? msg.browserPath : false
			};
			this.newDocument( o );
			break;
		// Receives a drop event with icons
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
		// Set a new look and feel of the document for editing purposes
		case 'design_default':
		case 'design_atmospheric':
		case 'design_dark':
			var f = new File( 'Progdir:Css/' + msg.command + '.css' );
			f.onLoad = function( data )
			{
				if( data && data.length && data.substr( 0, 4 ) != 'fail' )
				{
					ge( 'DesignCss' ).innerHTML = data;
				}
			}
			f.load();
			break;
	}
}

// Set some styles -------------------------------------------------------------

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
		f.execCommand( 'bulletedList', false, false );
	}
	else if( command == 'ulbullets' )
	{
		f.execCommand( 'numberedList', false, false );
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

// Insert an image -------------------------------------------------------------

function imageWindow( currentImage )
{
	Application.sendMessage( { command: 'insertimage' } );
}

