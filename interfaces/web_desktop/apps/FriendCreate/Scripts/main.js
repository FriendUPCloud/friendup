/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// App settings.. --------------------------------------------------------------
var settings = {
	wordWrap: true,
	wordWrapWidth: 80,
	codeFolding: true,
	ownScreen: false,
	theme: 'twilight'
};

// Gui settings and callbacks --------------------------------------------------
var gui = {
	sideBar: null,
	sideBarCallbacks: {
		// Check a file on file extension
		checkFile( path, extension )
		{
			if( extension == 'apf' )
			{
				Confirm( 
					i18n( 'i18n_loading_project' ), 
					i18n( 'i18n_loading_project_desc' ), function( info )
				{
					if( info.data == true )
					{
						OpenProject( path );
					}
					// Just load it
					else
					{
						OpenFile( path );
					}
				} );
				return false;
			}
			if( Application.checkFileType( path ) )
			{
				( new EditorFile( path ) );
			}
			return true;
		},
		// Load a file
		loadFile( path )
		{
			( new EditorFile( path ) );
		},
		// Do we permit?
		permitFiletype( path )
		{
			return Application.checkFileType( path );
		}
	}
};

// Files and projects ----------------------------------------------------------

var files = []; // All open files
var projectFiles = {}; // Index of files
var projectFolders = {}; // List of projects and their folder states (gui)
var projects = []; // All projects

// Launch view logic -----------------------------------------------------------

Application.run = function( msg )
{
	InitGui();
	if( !ge( 'Launchfile' ).getAttribute( 'file' ) )
	{
		( new EditorFile( 'New file' ) );
	}
	RefreshProjects();
}


// Set current file ------------------------------------------------------------
function SetCurrentFile( index )
{
	Application.currentFile = files[ index ];
}

// Check if we support the filetype --------------------------------------------
Application.checkFileType = function( path )
{
	if( !path || ( path && !path.split ) ) return;
	var ext = path.split ( '.' );
	ext = ext[ ext.length-1 ];
	switch ( ext.toLowerCase() )
	{
		case 'php':
		case 'pl':
		case 'sql':
		case 'sh':
		case 'as':
		case 'txt':
		case 'js':
		case 'lang':
		case 'pls':
		case 'json':
		case 'tpl':
		case 'ptpl':
		case 'xml':
		case 'html':
		case 'htm':
		case 'c':
		case 'h':
		case 'cpp':
		case 'd':
		case 'ini':
		case 'jsx':
		case 'java':
		case 'css':
		case 'run':
		case 'apf':
		case 'conf':
			return true;
		default:
			return false;
	}
}

function RefreshFiletypeSelect()
{
	if( !Application.currentFile ) return;
	var ext = Application.currentFile.path ? Application.currentFile.path.split( '.' ).pop().toLowerCase() : 'txt';
	
	var types = {
		'php': 'ace/mode/php',
		'pl': 'ace/mode/perl',
		'sql': 'ace/mode/sql',
		'sh': 'ace/mode/sh',
		'as': 'ace/mode/actionscript',
		'txt': 'ace/mode/text',
		'js': 'ace/mode/javascript',
		'lang': 'ace/mode/txt',
		'pls': 'ace/mode/json',
		'json': 'ace/mode/json',
		'tpl': 'ace/mode/html',
		'ptpl': 'ace/mode/perl',
		'xml': 'ace/mode/xml',
		'html': 'ace/mode/html',
		'htm': 'ace/mode/html',
		'c': 'ace/mode/c_cpp',
		'h': 'ace/mode/c_cpp',
		'cpp': 'ace/mode/c_cpp',
		'd': 'ace/mode/d',
		'ini': 'ace/mode/ini',
		'jsx': 'ace/mode/javascript',
		'java': 'ace/mode/java',
		'css': 'ace/mode/css',
		'run': 'ace/mode/txt',
		'apf': 'ace/mode/json',
		'conf': 'ace/mode/json'
	};
	if( types[ ext ] )
	{
		Application.currentFile.editor.getSession().setMode( types[ ext ] );
	}
	else if( Application.currentFile.editor )
	{
		Application.currentFile.editor.getSession().setMode( 'ace/mode/txt' );
		ext = 'txt';
	}
	
	if( !ge( 'Filetype' ) )
	{
		var d = document.createElement( 'div' );
		d.id = 'Filetype';
		var sel = document.createElement( 'select' );
		for( var a in types )
		{
			var o = document.createElement( 'option' );
			o.value = a;
			o.innerHTML = a;
			if( a == ext ) o.selected = 'selected';
			sel.appendChild( o );
		}
		d.appendChild( sel );
		ge( 'StatusBar' ).appendChild( d );
	}
	else
	{
		var opts = ge( 'Filetype' ).getElementsByTagName( 'option' );
		for( var a = 0; a < opts.length; a++ )
		{
			if( opts[ a ].value == ext )
			{
				opts[ a ].selected = 'selected';
			}
			else
			{
				opts[ a ].selected = '';
			}
		}
	}
	
	if( Application.currentFile.editor )
	{
		Application.currentFile.editor.setOptions( { // Enable autocompletion
			enableBasicAutocompletion: true,
		    enableSnippets: true,
		    enableLiveAutocompletion: true
		} );
	}
}

// Initialize the GUI! ---------------------------------------------------------

function InitGui()
{
	// Include ace editor language tools
	ace.require( 'ace/ext/language_tools' );
	
	InitTabs( ge( 'SideBarTabs' ) );
	if( ge( 'SideBar' ) )
	{
		gui.sideBar = new Friend.FileBrowser( ge( 'SB_AllFiles' ), { displayFiles: true, noContextMenu: true }, gui.sideBarCallbacks );
		gui.sideBar.render();
		if( delayedOnclick )
		{
			ge( delayedOnclick ).onclick();
			delayedOnclick = false;
		}
		else ge( 'tabAllFiles' ).onclick();
	}
}

// File class ------------------------------------------------------------------

var EditorFile = function( path )
{
	var self = this;
	
	var returnable = false;
	
	for( var a = 0; a < files.length; a++ )
	{
		if( files[ a ].path == path )
		{
			Application.currentFile = files[ a ];
			files[ a ].tab.onclick();
			files[ a ].activate();
			CheckPlayStopButtons();
			return;
		}
	}
	
	if( Application.currentProject && Application.currentProject.ID )
		self.ProjectID = Application.currentProject.ID;
	
	// Load file
	if( path && path.indexOf( ':' ) > 0 )
	{
		var s = new Library( 'system.library' );
		s.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				var json = {};
				try { json = JSON.parse( d ); } catch( e ){};
			
				var ext = path.split( '.' ).pop().toLowerCase();
				if( ext == 'jpg' || ext == 'gif' || ext == 'jpeg' || ext == 'png' )
				{
					self.filename = json.Filename;
					self.path = json.Path;
					self.content = '<div class="FullImage"><img src="' + getImageUrl( json.Path ) + '"/></div>';
					self.type = 'image';
					self.filesize = json.Filesize;
					files.push( self );
					InitEditArea( self );
					self.updateState( 'Reading' );
					CheckPlayStopButtons();
				}
				else
				{
					var f = new File( path );
					f.onLoad = function( data )
					{
						self.filename = json.Filename;
						self.path = json.Path;
						self.content = data;
						self.filesize = json.Filesize;
						files.push( self );
						InitEditArea( self );
						setTimeout( function()
						{
							self.refreshBuffer();
							self.refreshMinimap();
						}, 50 );
						self.updateState( 'Reading' );
						CheckProjectFile( f );
						CheckPlayStopButtons();
					}
					f.load();
				}
			}
		}
		s.execute( 'file/info', { path: path } );
	}
	// Empty file
	else
	{
		this.filename = path ? path : 'New file';
		this.path = false;
		this.content = '';
		this.filesize = 0;
		files.push( this );
		InitEditArea( this );
		setTimeout( function()
		{
			self.refreshBuffer();
			self.refreshMinimap();
		}, 50 );
	}
}

EditorFile.prototype.close = function()
{
	var out = [];
	this.updateState( '' );
	for( var a = 0; a < files.length; a++ )
	{
		if( files[ a ] == this ) continue;
		out.push( files[ a ] );
	}
	files = out;
}

EditorFile.prototype.updateState = function( state )
{
	if( typeof( state ) != 'undefined' )
		this.state = state;
	else state = this.state;
	if( projectFiles[ this.path ] )
	{
		projectFiles[ this.path ].className = 'FileItem ' + state;
		if( state == 'Reading' || state == 'Editing' )
		{
			this.activate();
		}
	}
}

EditorFile.prototype.activate = function()
{
	for( var a in projectFiles )
	{
		if( a == this.path )
		{
			projectFiles[ a ].classList.add( 'Active', 'Rounded' );
		}
		else
		{
			projectFiles[ a ].classList.remove( 'Active', 'Rounded' );
		}
	}
	SetCurrentProject( this.ProjectID );
}

EditorFile.prototype.updateTab = function()
{
	this.tab.getElementsByTagName( 'span' )[0].innerHTML = this.filename;
}

function NewFile()
{
	( new EditorFile() );
}

// Editor area (tabbed page) ---------------------------------------------------

var tcounter = 0;
function InitEditArea( file )
{
	var p = ge( 'CodeArea' );
	var tc = p.querySelector( '.TabContainer' );
	
	var firstTab = p.querySelector( '.Tab' );
	var firstPage = p.querySelector( '.Page' );
	
	var t = document.createElement( 'div' );
	
	file.tab = t;
	t.file = file;
	
	t.className = 'Tab';
	t.id = 'codetab_' + ( ++tcounter );
	t.innerHTML = '<span>' + file.filename + '</span>';
	var c = document.createElement( 'div' );
	c.className = 'MarginLeft FloatRight Close IconSmall fa-remove';
	c.onmouseover = function()
	{
		this.style.filter = 'invert(1)';
	}
	c.onmouseout = function()
	{
		this.style.filter = '';
	}
	
	t.appendChild( c );
	var d = document.createElement( 'div' );
	d.className = 'Page';
	if( firstTab )
	{
		tc.insertBefore( t, firstTab );
		p.insertBefore( d, firstPage );
	}
	else
	{
		( tc ? tc : p ).appendChild( t );
		p.appendChild( d );
	}
	
	file.page = p;
	
	t.addEventListener( 'mouseup', function()
	{
		Application.currentFile = file;
		CheckPlayStopButtons();
	} );
	
	c.addEventListener( 'mousedown', function( e )
	{
		var prev = null;
		var eles = ge( 'CodeArea' ).getElementsByClassName( 'Tab' );
		for( var a = 0; a < eles.length; a++ )
		{
			if( a > 0 && eles[ a - 1 ] == t )
			{
				prev = eles[ a ];
				break;
			}
		}
		
		if( t.file.state == 'Editing' )
		{
			Confirm( i18n( 'i18n_are_you_sure' ), i18n( 'i18n_this_will_close' ), function( di )
			{
				if( di.data )
				{
					d.parentNode.removeChild( d );
					t.parentNode.removeChild( t );
					t.file.close();
					InitTabs( ge( 'CodeArea' ) );
					checkTabsNow();
				}
			} );
		}
		else
		{
			d.parentNode.removeChild( d );
			t.parentNode.removeChild( t );
			t.file.close();
			InitTabs( ge( 'CodeArea' ) );
			checkTabsNow();
		}
		return cancelBubble( e );
		
		function checkTabsNow()
		{
			if( prev )
			{
				prev.onclick();
				return;
			}
			var eles = ge( 'CodeArea' ).getElementsByClassName( 'Tab' );
			// Make sure one is clicked
			if( eles && eles[ 0 ] )
				eles[ 0 ].onclick();
		}
	} );
	
	// Initialize the content editor
	if( file.type == 'image' )
	{
		d.innerHTML = file.content;
	}
	else
	{
		InitContentEditor( d, file );
	}
	
	InitTabs( ge( 'CodeArea' ) );
	
	// Add an extra event
	file.tab.addEventListener( 'click', function( e )
	{
		file.activate();
		setTimeout( function( e )
		{
			RefreshFiletypeSelect();
		}, 150 );
	}, false );

	Application.currentFile = file;
	
	file.tab.onclick();
	
	if( file.refreshMinimap )
		file.refreshMinimap();
	
	RefreshFiletypeSelect();
}

function RemoveEditArea( file )
{
	//
}

function InitContentEditor( element, file )
{
	var minimapZoomLevel = 0.4;
	
	// Remove previous editor
	if( file.editor )
	{
		file.editor.destroy();
		file.editor = null;
		RemoveEditArea( file );
	}
	
	// Associate page with file
	element.file = file;
	
	file.minimapZoomLevel = minimapZoomLevel;
	file.needsRefresh = true;
	
	// Create editor root container
	var area = document.createElement( 'div' );
	area.id = 'EditorArea_' + tcounter;
	area.style.position = 'absolute';
	area.style.top = '0';
	area.style.left = '0';
	area.style.right = '0';
	area.style.bottom = '0';
	element.appendChild( area );

	// Setup the area with ace
	file.editor = ace.edit( area.id );
	file.editor.setFontSize( 14 );
	file.editor.setValue( file.content );
	file.editor.getSession().setUndoManager( new ace.UndoManager() );
	file.editor.setOptions( { // Enable autocompletion
		enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: true
	} );
	file.editor.clearSelection();
	file.editor.gotoLine( 0, 0, true );	
	file.editor.setTheme( 'ace/theme/' + settings.theme );
	file.editor.session.setUseWorker( false );
	
	file.editor.getSession().on( 'change', function( e )
	{
		file.needsRefresh = true;
		file.updateState( 'Editing' );
	} );
	
	file.editor.getSession().setMode( 'ace/mode/javascript' );
	
	// Remove find dialog
	file.editor.commands.removeCommand( 'find' );
	
	// Create minimap
	file.minimapGroove = document.createElement( 'div' );
	file.minimapGroove.className = 'MinimapGroove';
	file.minimapGroove.addEventListener( 'mousedown', function( e )
	{
		var y  = e.clientY - GetElementTop( file.minimapGroove );
		var cl = ( y / file.page.offsetHeight );
		var pageH = Math.floor( file.page.offsetHeight / file.editor.renderer.lineHeight );
		
		if( y > file.minimapRect.offsetTop + file.minimapRect.offsetHeight )
		{
			file.editor.gotoLine( Math.floor( file.editor.getFirstVisibleRow() + ( pageH * 1.5 ) ), 0, false );
		}
		else
		{
			file.editor.gotoLine( file.editor.getFirstVisibleRow() - pageH, 0, false );
		}
	}, false );
	file.minimap = document.createElement( 'div' );
	file.minimap.className = 'Minimap';
	file.minimap.innerHTML = file.page.querySelector( '.ace_content' ).innerHTML;
	file.minimapRect = document.createElement( 'div' );
	file.minimapRect.className = 'MinimapRect';
	// Move the rect
	file.minimapRect.onmousedown = function( e )
	{
		file.mouseDown = e.clientY;
		file.rectPos = file.minimapRect.offsetTop;
		file.minimapRect.classList.add( 'Move' );
	}
	file.minimapRect.onmousemove = function( e )
	{
		if( file.mouseDown )
		{
			var sy = e.clientY - file.mouseDown;
			var ty = file.rectPos + sy;
			if( ty < 0 ) ty = 0;
			else if( ty + file.minimapRect.offsetHeight >= file.minimapGroove.offsetHeight )
				ty = file.minimapGroove.offsetHeight - file.minimapRect.offsetHeight;
			file.minimapRect.style.top = ty + 'px';		
			
			var lineNumber = Math.floor( ( ty / ( file.minimapGroove.offsetHeight - file.minimapRect.offsetHeight ) ) * file.lines.length );
			file.editor.gotoLine( lineNumber, 0, false );
		}
	}
	window.addEventListener( 'mouseup', function( e )
	{
		file.mouseDown = false;
		if( file.minimapRect )
		{
			file.minimapRect.classList.remove( 'Move' );
			file.refreshMinimap();
		}
	}, false );
	// Done moving the rect
	var ac = file.page.querySelector( '.ace_scroller' );
	ac.parentNode.parentNode.appendChild( file.minimap );
	ac.parentNode.parentNode.appendChild( file.minimapRect );
	ac.parentNode.parentNode.appendChild( file.minimapGroove );
	
	// Events for minimap
	file.editor.session.on( 'changeScrollTop', function( e )
	{
		if( file.refreshMinimap )
			file.refreshMinimap( e );
	} );
	
	file.refreshBuffer = function()
	{
		if( !this.needsRefresh ) return;
		var self = this;
		
		var maxVSegmentSize = 200;
		
		if( this.refreshBufTime ) clearTimeout( this.refreshBufTime );
		
		this.refreshBufTime = setTimeout( function()
		{
			// Add minimap dom element
			self.lines = self.editor.session.getValue().split( '\n' );
			
			// Get the height of a line
			var lineHeight = self.editor.renderer.lineHeight;
			
			// Make sure we have a canvas array (vertical segments)
			if( !self.canvasArray )
				self.canvasArray = [];
			var vsegments = Math.floor( self.lines.length / maxVSegmentSize );
			var vsegmentT = vsegments * maxVSegmentSize; // Max segments
			var canvWidth = self.minimap.offsetWidth / self.minimapZoomLevel;
			
			var cl = ''; // Color of line
			var segY = 0; // Canvas segment y
			var y = 0; // Drawing y coordinate
			var prevArrk = -1; // Previous canvas segment
			var ctx; // Canvas context
			for( var a = 0; a < self.lines.length; a++ )
			{
				// Get current drawing segment
				var arrk = Math.floor( a / maxVSegmentSize );
				if( prevArrk != arrk )
				{
					// The length of this segment is either maxVSegmentSize or the rest of the lines minus previous segments
					var segmentLength = arrk < vsegments ? maxVSegmentSize : ( self.lines.length - vsegmentT );
				
					// Check if we have such a segment / create it
					if( !self.canvasArray[ arrk ] )
					{
						self.canvasArray[ arrk ] = document.createElement( 'canvas' );
						self.minimap.appendChild( self.canvasArray[ arrk ] );
					}
				
					// Fetch canvas
					var canv = self.canvasArray[ arrk ];
					canv.setAttribute( 'width', canvWidth );
					canv.setAttribute( 'height', lineHeight * segmentLength );
				
					// Set canvas props
					ctx = canv.getContext( '2d' );
					ctx.font = '14px Monospace,Courier';
					ctx.textBaseline = 'Top';
					ctx.fillStyle = '#000000';
			
					// Clear canvas
					ctx.fillRect( 0, 0, canv.getAttribute( 'width' ), canv.getAttribute( 'height' ) );
					prevArrk = arrk;
					
					// Drawing coordinate
					segY += y;
					canv.style.top = segY * self.minimapZoomLevel + 'px';
					y = 0;
				}
				
				// Draw the line
				cl = '#ffffff';
				if( self.lines[a].indexOf( '//' ) >= 0 )
					cl = '#888888';
				else if( self.lines[a].indexOf( 'function' ) >= 0 )
					cl = '#ffee77';
				else if( self.lines[a].indexOf( 'if' ) >= 0 )
					cl = '#ff8844';
				else if( self.lines[a].indexOf( 'for' ) >= 0 )
					cl = '#ff8844';
				else if( self.lines[a].indexOf( 'while' ) >= 0 )
					cl = '#ff8844';
				else if( self.lines[a].indexOf( 'var' ) >= 0 )
					cl = '#ffee77';
				
				ctx.strokeStyle = cl;
				ctx.strokeText( self.lines[ a ], 10, y + lineHeight );
				
				y += lineHeight;
			}
		
			// Remove non existent canvases
			var out = [];
			var removes = [];
			for( var a = 0; a < self.canvasArray.length; a++ )
			{
				if( a <= vsegments )
				{
					out.push( self.canvasArray[ a ] );
				}
				else
				{
					removes.push( self.canvasArray[ a ] );
				}
			}
			self.canvasArray = out;
			for( var a = 0; a < removes.length; a++ )
			{
				self.minimap.removeChild( removes[ a ] );
			}
			delete removes;
		
			// We no longer are refreshing
			self.needsRefresh = false;
			self.refreshBufTime = false;
		}, 250 );
	}
	
	// Refresh the minimap
	file.refreshMinimap = function()
	{
		var self = this;
		if( !self.lines ) return;
		
		if( this.refreshing ) 
		{
			if( this.refreshQueue )
				clearTimeout( this.refreshQueue );
			this.refreshQueue = setTimeout( function()
			{ 
				file.refreshQueue = false; 
				file.refreshMinimap(); 
			}, 50 );
			return;
		}
		this.refreshing = true;
		
		// Minimap height
		setTimeout( function()
		{
			var lh = self.editor.renderer.lineHeight;
			
			var e = self.editor.getFirstVisibleRow() * lh;
		
			// Lines and code content height
			var len = self.lines.length;
			var tot = lh * len;
			var totZoom = tot * minimapZoomLevel;
			var zoomedLineHeight = lh * minimapZoomLevel;
			var scrollbarHeight = 7;
		
			// Minimap groove height
			file.minimapGroove.style.height = ( totZoom < ac.offsetHeight ? totZoom : ( ac.offsetHeight + scrollbarHeight ) ) + 'px';
			
			// Content height - plus one line
			var contHeight = ( tot < ac.offsetHeight ? tot : ac.offsetHeight ) + zoomedLineHeight;
		
			// 
			var m = self.minimapRect;
		
			// Don't do calculation when there's no content to scroll
			if( tot <= contHeight )
			{
				// Fill whole groove
				m.style.top = 0;
				m.style.height = file.minimapGroove.offsetHeight + 'px';
				
				// Minimap is just as high as content height (it is zoomed)
				self.minimap.style.height = contHeight + 'px';
				self.refreshing = false;
				return;
			}
		
			// Scroll position
			if( e < 0 ) e = 0;
			if( e > tot - contHeight ) e = tot - contHeight;
			
			// Get total height of all canvas segments
			var meh = 0;
			for( var z = 0; z < file.canvasArray.length; z++ )
			{
				meh += file.canvasArray[ z ].offsetHeight * minimapZoomLevel; // Zoomed
			}
	
			// Scroll progress
			var sp = e / ( tot - contHeight );
		
			// Set top of minimap to show current minimap position
			if( Math.floor( meh ) <= Math.floor( self.minimapGroove.offsetHeight ) )
			{
				self.minimap.style.top = 0;
			}
			else
			{
				self.minimap.style.top = -( sp * ( meh - ( contHeight - zoomedLineHeight ) ) ) + 'px';
			}
		
			// Page visualization
			if( !file.mouseDown )
			{
				m.style.height = ( ( contHeight / tot ) * meh ) + 'px';
				m.style.top = sp * ( file.minimapGroove.offsetHeight - m.offsetHeight ) + 'px';
			}
		
			self.refreshing = false; 
		}, 50 );
	}
}

// Supported file formats ------------------------------------------------------

var supportedFiles = [
	'php',
	'pl',
	'sql',
	'sh',
	'as',
	'txt',
	'js',
	'lang',
	'pls',
	'json',
	'tpl',
	'ptpl',
	'xml',
	'html',
	'htm',
	'c',
	'h',
	'cpp',
	'd',
	'ini',
	'jsx',
	'java',
	'css',
	'run',
	'apf',
	'conf'
];

function OpenFile( path )
{
	if( path && path.indexOf( '.' ) > 0 )
	{
		return new EditorFile( path );
	}
	
	( new Filedialog( {
		path: path ? path : ( ( Application.currentProject && Application.currentProject.ProjectPath ) ? Application.currentProject.ProjectPath : 'Home:' ),
		triggerFunction: function( items )
		{
			if( items && items.length )
			{
				for( var a in items )
				{
					( new EditorFile( items[a].Path ) );
				}
			}
		},
		type: 'open',
		suffix: supportedFiles,
		rememberPath: true
	} ) );
}

// Checking if a file is currently in project
function CheckProjectFile( file )
{
	if( !Application.currentProject ) return;
	
	var p = Application.currentProject;
	// File belongs to other project
	if( file.ProjectID && file.ProjectID != p.ID ) return;
	if( p.Files )
	{
		var found = false;
		for( var a = 0; a < p.Files.length; a++ )
		{
			if( file.path == p.ProjectPath + p.Files[a].Path )
			{
				found = true;
				break;
			}
		}
		if( !found )
		{
			var fn = file.path;
			if( file.path.indexOf( '/' ) >= 0 )
				fn = file.path.split( '/' ).pop();
			else if( file.path.indexOf( ':' ) >= 0 ) fn = file.path.split( ':' ).pop();
			var pa = file.path;
			if( file.path.indexOf( p.ProjectPath ) == 0 )
				pa = file.path.substr( p.ProjectPath.length, file.path.length - p.ProjectPath.length );
			p.Files.push( {
				Type: 'File',
				Path: pa,
				ProjectID: p.ID,
				Filename: fn
			} );
			RefreshProjects();
		}
	}
}

// Saving a file ---------------------------------------------------------------

function SaveFile( file, saveas )
{
	if( !saveas ) saveas = false;
	
	if( !saveas && file.path )
	{
		var f = new File( file.path );
		StatusMessage( i18n( 'i18n_saving' ) );
		f.onSave = function( res )
		{
			StatusMessage( i18n( 'i18n_saved' ) );
			file.updateState( 'Reading' );
			RefreshFiletypeSelect();
			CheckProjectFile( file );
		}
		var v = file.editor.getValue();
		f.save( v.length ? v : '\n' );
	}
	else
	{
		( new Filedialog( {
			path: file.path ? file.path : ( ( Application.currentProject && Application.currentProject.ProjectPath ) ? Application.currentProject.ProjectPath : 'Home:' ),
			triggerFunction: function( filename )
			{
				file.path = filename;
				file.filename = filename.split( ':' )[1];
				if( file.filename.indexOf( '/' ) >= 0 )
				{
					file.filename = file.filename.split( '/' );
					file.filename = file.filename[ file.filename.length - 1 ];
				}
				var f = new File( filename );
				StatusMessage( i18n( 'i18n_saving' ) );
				f.onSave = function( res )
				{
					StatusMessage( i18n( 'i18n_saved' ) );
					file.updateTab();
					file.updateState( 'Reading' );
					RefreshFiletypeSelect();
					CheckProjectFile( file );
				}
				var v = file.editor.getValue();
				f.save( v.length ? v : '\n' );
			},
			filename: '',
			type: 'save',
			suffix: supportedFiles,
			rememberPath: true
		} ) );
	}
}

// Keydowns --------------------------------------------------------------------

document.body.addEventListener( 'keydown', function( e )
{
	var wh = e.which ? e.which : e.keyCode;
	
	switch( wh )
	{
		case 83:
			if( e.ctrlKey || e.metaKey )
			{
				SaveFile( Application.currentFile, e.shiftKey );
				return cancelBubble( e );
			}
			break;
		case 79:
			if( e.ctrlKey || e.metaKey )
			{
				OpenFile();
				return cancelBubble( e );
			}
			break;
		default:
			break;
	}
}, false );

document.body.addEventListener( 'keyup', function( e )
{
	var f = Application.currentFile;
	if( !f ) return;
	

	// Update minimap
	if( Application.currentFile.refreshBuffer )
	{
		Application.currentFile.refreshBuffer();
		Application.currentFile.refreshMinimap();
	}
}, false );

window.addEventListener( 'resize', function( e )
{
	// Update minimap
	if( Application.currentFile.refreshMinimap )
	{
		Application.currentFile.refreshMinimap();
	}
} );

// Printing support ------------------------------------------------------------

function PrintFile()
{
	if( Application.currentFile )
	{
		ge( 'Print' ).innerHTML = Application.currentFile.page.getElementsByClassName( 'ace_editor' )[0].innerHTML;
		document.body.classList.add( 'Printing' );
		window.print();
		document.body.classList.remove( 'Printing' );
	}
}

// The project editor ----------------------------------------------------------

var pe = null;
function OpenProjectEditor()
{
	if( !Application.currentProject )
	{
		return NewProject();
	}
	
	if( pe )
	{
		pe.setFlag( 'title', i18n( 'i18n_project_editor' ) + ' - ' + Application.currentProject.ProjectPath );
		return pe.activate();
	}
	pe = new View( {
		title: i18n( 'i18n_project_editor' ) + ' - ' + Application.currentProject.ProjectPath,
		width: 900,
		height: 700
	} );
	
	var f = new File( 'Progdir:Templates/project_editor.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		pe.setContent( data, function( d )
		{
			pe.sendMessage( { command: 'updateproject', data: Application.currentProject, parentView: Application.viewId } );
		} );
	}
	f.load();
	
	if( !pe.onClose )
	{
		pe.onClose = function()
		{
			pe = null;
		}
	}
}

var Project = function()
{
	// Some variables
	var o = {
		ProjectName: '',
		Path:        '',
		Author:      '',
		Email:       '',
		Version:     '',
		API:         'v1',
		Description: '',
		Files:       [],
		Permissions: [],
		Libraries:   []
	};
	for( var a in o ) this[ a ] = o[ a ];
}

function NewProject()
{
	var p = new Project();
	p.Path = 'Home:';
	p.ProjectPath = 'Home:';
	p.ID = Sha256.hash( ( new Date() ).getTime() + '.' + Math.random() ).toString();
	var found = false;
	var b = 1;
	do
	{
		p.ProjectName = i18n( 'i18n_unnamed_project' );
		if( b > 1 )
			p.ProjectName += ' ' + b;
		found = false;
		for( var a = 0; a < projects.length; a++ )
		{
			if( projects[ a ].ProjectName == p.ProjectName )
			{
				found = true;
				break;
			}
		}
		b++;
	}
	while( found );
	projects.push( p );
	Application.currentProject = p;
	RefreshProjects();
	SaveProject( p, true, function( result )
	{
		if( result == false )
		{
			CloseProject( p );
		}
		else
		{
			
		}
	} );
}

var delayedOnclick = false;

function OpenProject( path )
{
	if( path && path.toLowerCase().indexOf( '.apf' ) > 0 )
	{
		for( var z = 0; z < projects.length; z++ )
		{
			// Project already loaded
			if( projects[ z ].Path == path )
				return;
		}
		var p = new Project();
		p.Path = path;
		p.ID = Sha256.hash( ( new Date() ).getTime() + '.' + Math.random() ).toString();
	
		var f = new File( p.Path );
		f.onLoad = function( data )
		{
			var proj = JSON.parse( data );
			for( var a in proj )
				p[ a ] = proj[ a ];
			projects.push( p );
			Application.currentProject = p;
			
			var pp = p.Path;
			if( pp.indexOf( '/' ) > 0 ){ pp = pp.split( '/' ); pp.pop(); pp = pp.join( '/' ) + '/'; }
			else if( pp.indexOf( ':' ) > 0 ){ pp = pp.split( ':' ); pp.pop(); pp = pp.join( ':' ) + ':'; }
			p.ProjectPath = pp;
			
			RefreshProjects();
			CheckPlayStopButtons();
			if( !ge( 'tabProjects' ).onclick )
			{
				delayedOnclick = 'tabProjects';
			}
			else
			{
				ge( 'tabProjects' ).onclick();
			}
		}
		f.load();
		return;
	}
	( new Filedialog( {
		path: path,
		multiSelect: false,
		triggerFunction: function( files )
		{
			if( !files || !files.length || !files[0].Path )
				return;
		
			var p = new Project();
			p.Path = files[0].Path;
			p.ID = Sha256.hash( ( new Date() ).getTime() + '.' + Math.random() ).toString();
		
			for( var z = 0; z < projects.length; z++ )
			{
				// Project already loaded
				if( projects[ z ].Path == p.Path )
					return;
			}
		
			var f = new File( p.Path );
			f.onLoad = function( data )
			{
				var proj = JSON.parse( data );
				for( var a in proj )
					p[ a ] = proj[ a ];
				projects.push( p );
				
				var pp = p.Path;
				if( pp.indexOf( '/' ) > 0 ){ pp = pp.split( '/' ); pp.pop(); pp = pp.join( '/' ) + '/'; }
				else if( pp.indexOf( ':' ) > 0 ){ pp = pp.split( ':' ); pp.pop(); pp = pp.join( ':' ) + ':'; }
				p.ProjectPath = pp;
				
				SetCurrentProject( p );
				RefreshProjects();
				CheckPlayStopButtons();
				ge( 'tabProjects' ).onclick();
			}
			f.load();
		},
		type: 'open',
		suffix: 'apf',
		rememberPath: true
	} ) );
}

function SaveProject( project, saveas, callback )
{
	if( !saveas ) saveas = false;
	
	// Clean up project structure
	var values = [
		'ProjectName', 'Path', 'Files', 'Permissions',
		'Description', 'Version', 'Author', 'Category', 'ProjectPath'
	];
	var projectOut = {};
	for( var a = 0; a < values.length; a++ )
	{
		projectOut[ values[a] ] = project[ values[a] ];
	}
	// Done cleaning up

	if( !saveas && project.Path && project.Path.indexOf( '.apf' ) > 0 )
	{
		var f = new File( project.Path );
		StatusMessage( i18n( 'i18n_saving' ) );
		f.onSave = function( res )
		{
			StatusMessage( i18n( 'i18n_saved' ) );
			if( callback )
				callback( true );
		}
		f.save( JSON.stringify( projectOut ) );
	}
	else
	{
		( new Filedialog( {
			path: project.ProjectPath ? project.ProjectPath : 'Home:',
			title: i18n( 'i18n_save_new_project' ),
			triggerFunction: function( filename )
			{
				if( !filename )
				{
					return callback( false );
				}
				
				project.Path = filename;
				
				// Fix the filename for the project path
				var p = filename;
				if( p.indexOf( '/' ) > 0 )
				{
					p = p.split( '/' ); p.pop();
					p = p.join( '/' ) + '/';
				}
				else if( p.indexOf( ':' ) > 0 )
				{
					p = p.split( ':' ); p.pop();
					p = p.join( ':' ) + ':';
				}
				// Erroneous filename
				else return callback( false );
				
				// Old path..
				var oldPath = project.ProjectPath;
				
				project.ProjectPath = p;
				
				projectOut.ProjectPath = p;
				projectOut.Path = filename;

				var f = new File( project.Path );
				StatusMessage( i18n( 'i18n_saving' ) );
				f.onSave = function( res )
				{
					StatusMessage( i18n( 'i18n_copying_project' ) );
					MoveProjectFiles( project, oldPath, function( e )
					{
						StatusMessage( i18n( 'i18n_saved' ) );
						if( callback )
							callback( true );
					} );
					
				}
				f.save( JSON.stringify( projectOut ) );
			},
			type: 'save',
			filename: 'project.apf',
			suffix: 'apf',
			rememberPath: true
		} ) );
	}
}

function MoveProjectFiles( project, oldPath, callback )
{
	nextFile( 0 );
	function nextFile( pos )
	{
		if( pos < project.Files.length )
		{
			var shell = new Shell();
			shell.onReady = function()
			{
				var dest = project.ProjectPath + project.Files[ pos ].Path;
				if( dest.indexOf( '/' ) > 0 )
				{
					dest = dest.split( '/' );
					dest.pop();
					dest = dest.join( '/' ) + '/';
				}
				else if( dest.indexOf( ':' ) > 0 )
				{
					dest = dest.split( ':' );
					dest.pop();
					dest = dest.join( ':' ) + ':';
				}
				shell.execute( 'makedir "' + dest + '"', function( res )
				{
					shell.execute( 'copy "' + oldPath + project.Files[ pos ].Path + '" "' + dest + '"', function( result )
					{
						nextFile( pos + 1 );
						shell.close();
					} );
				} );
			}
		}
		else
		{
			callback( true );
		}
	}
}

// Close a project
function CloseProject( proj )
{
	var o = [];
	for( var a = 0; a < projects.length; a++ )
	{
		if( projects[ a ] == proj )
			continue;
		o.push( projects[ a ] );
	}
	projects = o;
	var u = {};
	for( var a in projectFolders )
	{
		if( a != proj.ID )
			u[ a ] = projectFolders[ a ];
	}
	projectFolders = u;
	if( proj == Application.currentProject )
		Application.currentProject = null;
	RefreshProjects();
}

function RefreshProjects()
{	
	if( projects.length == 0 )
	{
		Application.currentProject = false;
		ge( 'SB_Project' ).innerHTML = '\
			<div class="Padding"><p>' + i18n( 'i18n_no_projects' ) + '</p>\
				<p>\
					<button type="button" class="IconSmall fa-folder-open" onclick="OpenProject()"> ' + i18n( 'menu_project_open' ) + '</button>\
					<button type="button" class="IconSmall fa-briefcase" onclick="NewProject()"> ' + i18n( 'i18n_new_project' ) + '</button>\
				</p>\
			</div>';
		CheckPlayStopButtons();
		return;
	}
	
	var listedFolders = {};
	
	var str = '';
	for( var a = 0; a < projects.length; a++ )
	{
		if( !Application.currentProject )
			Application.currentProject = projects[ a ];
		var pr = projects[ a ];
		var fstr = '';
		
		// Track folder state
		if( !projectFolders[ pr.ID ] )
			projectFolders[ pr.ID ] = {};
		
		var projectpath = pr.Path.split( '/' );
		projectpath.pop();
		projectpath = projectpath.join( '/' ) + '/';
		
		if( pr.Files && pr.Files.length )
		{
			var sortable = [];
			for( var c = 0; c < pr.Files.length; c++ )
			{
				pr.Files[ c ].ProjectID = pr.ID;
				var path = pr.Files[ c ].Path;
				
				if( path.indexOf( pr.ProjectPath ) == 0 )
				{
					path = path.substr( pr.ProjectPath.length, path.length - pr.ProjectPath.length );
					pr.Files[ c ] = path;
				}
				
				if( path.substr( path.length - 1, 1 ) != '/' )
				{
					path = path.split( '/' );
					path.pop();
					path = path.join( '/' ) + '/';
				}
				sortable[ pr.Files[ c ].Path ] = {
					levels: pr.Files[ c ].Path.split( '/' ),
					path: path,
					fullpath: pr.Files[ c ].Path
				}
			}
			sortable = sortable.sort();
			fstr = listFiles( sortable, 1, false, pr.ID );
		}
		var current = ' BackgroundHeavy Rounded';
		if( Application.currentProject == pr )
		{
			current = ' Current BackgroundHeavier Rounded';
		}
		str += '<ul><li class="Project' + current + '" id="p' + pr.ID + '" ondblclick="OpenProjectEditor()" onclick="SetCurrentProject( \'' + pr.ID + '\')">' + pr.ProjectName + '</li>' + fstr + '</ul>';
	}
	ge( 'SB_Project' ).innerHTML = str;
	
	// Update project files index
	var eles = ge( 'SB_Project' ).getElementsByTagName( 'li' );
	projectFiles = {};
	for( var a = 0; a < eles.length; a++ )
	{
		if( eles[ a ].getAttribute( 'path' ) )
		{
			projectFiles[ eles[ a ].getAttribute( 'path' ) ] = eles[ a ];
		}
	}
	
	// Update files status
	for( var a = 0; a < files.length; a++ )
	{
		files[ a ].updateState();
	}
	
	// List files recursively
	function listFiles( list, depth, path, projectId )
	{
		// Erronous path
		if( path && path.indexOf( ':' ) > 0 )
			return '';
		
		var str = '';
		
		if( !listedFolders[ projectId ] )
			listedFolders[ projectId ] = {};
		
		for( var a in list )
		{
			if( list[ a ].levels.length == depth )
			{
				var fpath = projectpath + list[a].fullpath;
				if( !path || ( path && list[ a ].path == path ) )
				{
					str += '<li class="FileItem" path="' + fpath + '" onclick="OpenFile(\'' + fpath + '\'); cancelBubble( event )">' + list[ a ].levels[ depth - 1 ] + '</li>';
				}
			}
			else if( list[a].levels.length == depth + 1 && !listedFolders[ projectId ][ list[ a ].path ] && list[ a ].path.indexOf( ':' ) < 0 )
			{
				listedFolders[ projectId ][ list[ a ].path ] = true;
				
				if( !projectFolders[ projectId ][ list[ a ].path ] )
					projectFolders[ projectId ][ list[ a ].path ] = {};
				var cl = projectFolders[ projectId ][ list[ a ].path ] && projectFolders[ projectId ][ list[ a ].path ].state == 'open' ? ' Open' : '';
				str += '<li class="Folder ' + cl + '" path="' + list[a].path + '" projectId="' + projectId + '" onclick="SetCurrentProject( \'' + projectId + '\' ); ToggleOpenFolder(this); cancelBubble( event )">' + list[ a ].levels[ depth - 1 ] + '/</li>';
				str += listFiles( list, depth + 1, list[ a ].path, projectId );
			}
		}
		if( str.length ) str = '<ul>' + str + '</ul>';
		return str;
	}
}

function SetCurrentProject( p )
{
	var cl = ge( 'SB_Project' ).getElementsByClassName( 'Project' );
	
	for( var a = 0; a < projects.length; a++ )
	{
		if( projects[ a ].ID == p )
		{
			if( Application.currentProject != projects[ a ] )
			{
				Application.currentProject = projects[ a ];
				
				for( var a = 0; a < cl.length; a++ )
				{
					if( cl[ a ].id == 'p' + p )
					{
						cl[ a ].classList.add( 'Current', 'BackgroundHeavier', 'Rounded' );
					}
					else
					{
						cl[ a ].classList.remove( 'Current', 'BackgroundHeavier', 'Rounded' );
					}
				}
				CheckPlayStopButtons();
				return true;
			}
		}
	}
	return false;
}

function ToggleOpenFolder( ele )
{
	var id = ele.getAttribute( 'projectId' );
	var pa = ele.getAttribute( 'path' );
	if( ele.classList.contains( 'Open' ) )
	{
		projectFolders[ id ][ pa ].state = '';
		ele.classList.remove( 'Open' );
	}
	else
	{
		projectFolders[ id ][ pa ].state = 'open';
		ele.classList.add( 'Open' );
	}
}

// End projects ----------------------------------------------------------------

// Search and replace ----------------------------------------------------------
var currKey = '';
function Search( execute )
{
	if( execute )
	{
		var eles = ge( 'Search' ).getElementsByTagName( 'input' );
		var inps = {};
		for( var a = 0; a < eles.length; a++ )
		{
			var n = eles[a].getAttribute( 'name' );
			inps[ n ] = eles[a];
		}
		
		var ed = Application.currentFile.editor;
		if( !ed ) return CloseSearch();
		
		if( !inps[ 'doreplace' ].checked )
		{
			ed.find( inps[ 'searchkeys' ].value, {
				wrap: true,
				caseSensitive: false,
				wholeWord: false,
				regExp: false,
				preventScroll: false
			} );
		}
		else
		{
			var range = ed.find( inps[ 'searchkeys' ].value, {
				wrap: true,
				caseSensitive: false,
				wholeWord: false,
				regExp: false,
				preventScroll: false
			} );
			if( inps[ 'replaceall' ].checked )
			{
				ed.replaceAll( inps[ 'replacekeys' ].value );
			}
			else
			{
				ed.replace( inps[ 'replacekeys' ].value );
			}
		}
		return;
	}
	if( ge( 'Search' ) )
	{
		ge( 'Search' ).getElementsByTagName( 'input' )[0].focus();
		return;
	}
	var d = document.createElement( 'div' );
	d.id = 'Search';
	d.className = 'BackgroundDefault';
	d.innerHTML = '<input type="text" name="searchkeys" placeholder="' + i18n( 'i18n_search_keywords' ) + '" onkeyup="window.currKey=this.value; if( event.which == 13 ) Search( true, event );"/> \
		<input type="text" name="replacekeys" placeholder="' + i18n( 'i18n_replace_with' ) + '" onkeyup="if( event.which == 13 ) Search( true, event )"/>\
		<input type="checkbox" name="doreplace" id="dorepl"/> <label for="dorepl">' + i18n( 'i18n_do_replace' ) + '</label>\
		<input type="checkbox" name="replaceall" id="replall"/> <label for="replall">' + i18n( 'i18n_do_replace_all' ) + '</label>\
		<button type="button" class="IconButton IconSmall fa-search" onclick="Search( true )">\
		</button>\
		<button type="button" class="IconButton IconSmall fa-remove" onclick="CloseSearch()">\
		</button>\
	';
	ge( 'CodeArea' ).appendChild( d );
	d.classList.add( 'Opening' );
	setTimeout( function()
	{
		d.classList.add( 'Open' );
		d.classList.remove( 'Opening' );
	}, 250 );
	ge( 'Search' ).getElementsByTagName( 'input' )[0].focus();
}

function CloseSearch()
{
	currKey = '';
	ge( 'Search' ).parentNode.removeChild( ge( 'Search' ) );
}

// End search and replace ------------------------------------------------------

// Helper, sets statusmessage in the bottom left corner
function StatusMessage( str )
{
	var existing = ge( 'StatusMessage' ).getElementsByTagName( 'div' );
	for( var a = 0; a < existing.length; a++ )
	{
		existing[a].style.left = '20px';
		existing[a].style.opacity = 0;
	}
	
	var el = document.createElement( 'div' );
	el.style.opacity = 0;
	el.style.left = '0px';
	el.innerHTML = str;
	ge( 'StatusMessage' ).appendChild( el );
	setTimeout( function()
	{
		el.style.left = '10px';
		el.style.opacity = 1;
		setTimeout( function()
		{
			el.style.left = '20px';
			el.style.opacity = 0;
			setTimeout( function()
			{
				ge( 'StatusMessage' ).removeChild( el );
			}, 250 );
		}, 1000 );
	}, 50 );
}

function CreatePackage()
{
	if( !Application.currentProject || !Application.currentProject.Path )
	{
		Alert( i18n( 'i18n_no_project_saved' ), i18n( 'i18n_no_project_desc' ) );
		return;
	}
	
	StatusMessage( i18n( 'i18n_generating_package' ) );
	
	var j = new Module( 'system' );
	j.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			StatusMessage( i18n( 'i18n_package_generated' ) );
			var p = Application.currentProject.Path;
			if( p )
			{
				if( p && p.indexOf( '/' ) > 0 )
				{
					p = p.split( '/' );
					p.pop();
					p = p.join( '/' ) + '/';
				}
				else p = p.split( ':' )[0] + ':';
			}
		}
		else
		{
			StatusMessage( 'i18n_package_generation_error' );
		}
	}
	j.execute( 'package', { filename: Application.currentProject.Path } );
}

// Play and stop ---------------------------------------------------------------

function SetMobileMode( mode )
{
	Application.editMode = mode;
	if( mode == 'Project' )
	{
		document.body.classList.remove( 'Editing' );
	}
	else
	{
		document.body.classList.add( 'Editing' );
	}
	CheckMobileButtons();
}

function CheckMobileButtons()
{
	if( !isMobile )
		return;
	if( Application.editMode == 'Edit' )
	{
		ge( 'MobileButtons' ).innerHTML = '<button type="button" onclick="SetMobileMode(\'Project\')" class="Button IconSmall fa-folder"> ' + i18n( 'i18n_browse' ) + '</button>';
	}
	else
	{
		ge( 'MobileButtons' ).innerHTML = '<button type="button" onclick="SetMobileMode(\'Edit\')" class="Button IconSmall fa-folder"> ' + i18n( 'i18n_edit_files' ) + '</button>';
	}
}

function CheckPlayStopButtons()
{
	CheckMobileButtons()
	if( !Application.currentProject )
	{
		if( !Application.currentFile || Application.currentFile.filename.substr( -4, 4 ).toLowerCase() != '.jsx' )
		{
			ge( 'PlayStop' ).innerHTML = '';
			return;
		}
	}
	
	var nam = 
	
	ge( 'PlayStop' ).innerHTML = '\
	<button type="button" class="IconButton IconSmall fa-play" onclick="RunApp()" title="' + i18n( 'i18n_run_app' ) + '">\
	</button>\
	<button type="button" class="IconButton IconSmall fa-stop" onclick="StopApp()" title="' + + i18n( 'i18n_stop_app' ) + '">\
	</button>\
	';	
}

// Run the current jsx
function RunApp()
{
	if( Application.currentProject )
	{
		var p = Application.currentProject;
		
		for( var a = 0; a < p.Files.length; a++ )
		{
			if( p.Files[ a ].Path.toLowerCase().indexOf( '.jsx' ) > 0 )
			{
				Application.sendMessage( {
					type: 'system',
					command: 'executeapplication',
					executable: p.ProjectPath + p.Files[ a ].Path,
					arguments: false
				} );
				Application.currentProject.Playing = true;
				CheckPlayStopButtons();
			}
		}
	}
	else if( Application.currentFile )
	{
		if( Application.currentFile.filename.substr( -4, 4 ).toLowerCase() == '.jsx' )
		{
			Application.sendMessage( {
				type: 'system',
				command: 'executeapplication',
				executable: Application.currentFile.path,
				arguments: false
			} );
			Application.currentProject.Playing = true;
			CheckPlayStopButtons();
		}
	}
}

// Kill running jsx
function StopApp()
{
	// A project
	if( Application.currentProject )
	{
		var p = Application.currentProject;
		
		for( var a = 0; a < p.Files.length; a++ )
		{
			if( p.Files[ a ].Path.toLowerCase().indexOf( '.jsx' ) > 0 )
			{
				Application.sendMessage( { type: 'system', command: 'kill', appName: p.Files[ a ].Filename } );
				Application.currentProject.Playing = false;
				CheckPlayStopButtons();
			}
		}
	}
	// Not a project
	else if( Application.currentFile )
	{
		if( Application.currentFile.filename.substr( -4, 4 ).toLowerCase() == '.jsx' )
		{
			var app = Application.currentFile.path;
			if( app.indexOf( '/' ) > 0 )
			{
				app = app.split( '/' ).pop();
			}
			else if( app.indexOf( ':' ) > 0 )
			{
				app = app.split( ':' ).pop();
			}
			Application.sendMessage( { type: 'system', command: 'kill', appName: app } );
			CheckPlayStopButtons();
		}
	}
}

// Messaging support -----------------------------------------------------------
var abw = manual = false;
Application.receiveMessage = function( msg )
{
	if( msg.command )
	{
		switch( msg.command )
		{
			case 'open':
				OpenFile();
				break;
			case 'save':
				if( Application.currentFile )
					SaveFile( Application.currentFile );
				break;
			case 'save_as':
				if( Application.currentFile )
					SaveFile( Application.currentFile, true );
				break;
			case 'print':
				PrintFile();
				break;
			case 'close':
				if( Application.currentFile )
					Application.currentFile.close();
				break;
			case 'project_new':
				NewProject();
				break;
			case 'project_editor':
				OpenProjectEditor();
				break;
			case 'project_open':
				OpenProject();
				break;
			case 'project_save':
				if( Application.currentProject )
					SaveProject( Application.currentProject );
				break;
			case 'project_save_as':
				if( Application.currentProject )
					SaveProject( Application.currentProject, true );
				break;
			case 'project_close':
				CloseProject( Application.currentProject );
				break;
			case 'drop':
				if( msg.data )
				{
					for( var a = 0; a < msg.data.length; a++ )
					{
						if( msg.data[a].Path.split( '.' ).pop().toLowerCase() == 'apf' )
						{
							OpenProject( msg.data[a].Path );
						}
						else
						{
							new EditorFile( msg.data[ a ].Path );
						}
					}
				}
				break;
			case 'updateproject':
				for( var a = 0; a < projects.length; a++ )
				{
					if( projects[ a ].ID == msg.project.ID )
					{
						projects[ a ] = msg.project;
						
						Application.currentProject = projects[ a ];
						SaveProject( Application.currentProject );
						break;
					}
				}
				RefreshProjects();
				if( pe ) pe.close();
				break;
			case 'manual':
				if( manual )
				{
					manual.activate();
					return;
				}
				manual = new View( {
					title: i18n( 'i18n_users_manual' ),
					width: 600,
					height: 600
				} );
				var f = new File( 'Progdir:Templates/manual_' + Application.language + '.html' );
				f.i18n();
				f.onLoad = function( data )
				{
					manual.setContent( data );
				}
				f.load();
				manual.onClose = function(){ manual = false; }
				break;
			case 'about':
				if( abw )
				{
					abw.activate();
					return;
				}
				abw = new View( {
					title: i18n( 'i18n_about_friend_create' ),
					width: 600,
					height: 380
				} );
				var f = new File( 'Progdir:Templates/about_' + Application.language + '.html' );
				f.i18n();
				f.onLoad = function( data )
				{
					abw.setContent( data );
				}
				f.load();
				abw.onClose = function(){ abw = false; }
				break;
			case 'package_generate':
				CreatePackage();
				break;
			case 'launchwith':
				if( msg.file.split( '.' ).pop().toLowerCase() == 'apf' )
				{
					OpenProject( msg.file );
				}
				else
				{
					new EditorFile( msg.file );
				}
				break;
		}
	}
}

