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

var files = [];
var projectFiles = {}; // Index
var projects = [];

// Launch view logic -----------------------------------------------------------

Application.run = function( msg )
{
	InitGui();
	( new EditorFile( 'New file' ) );
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

// Initialize the GUI! ---------------------------------------------------------

function InitGui()
{
	InitTabs( ge( 'SideBarTabs' ) );
	if( ge( 'SideBar' ) )
	{
		gui.sideBar = new Friend.FileBrowser( ge( 'SB_AllFiles' ), { displayFiles: true }, gui.sideBarCallbacks );
		gui.sideBar.render();
	}
}

// File class ------------------------------------------------------------------

var EditorFile = function( path )
{
	var self = this;
	
	for( var a = 0; a < files.length; a++ )
	{
		if( files[ a ].path == path )
		{
			return files[ a ].tab.onclick();
		}
	}
	
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
				}
				f.load();
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
	if( projectFiles[ this.path ] )
	{
		projectFiles[ this.path ].className = 'FileItem ' + state;
	}
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
	} );
	
	c.addEventListener( 'mousedown', function( e )
	{
		Confirm( i18n( 'i18n_are_you_sure' ), i18n( 'i18n_this_will_close' ), function( di )
		{
			if( di.data )
			{
				d.parentNode.removeChild( d );
				t.parentNode.removeChild( t );
				t.file.close();
				InitTabs( ge( 'CodeArea' ) );
			}
		} );
		return cancelBubble( e );
	} );
	
	// Initialize the content editor
	InitContentEditor( d, file );
	
	InitTabs( ge( 'CodeArea' ) );
	
	Application.currentFile = file;
	file.tab.onclick();
	
	file.refreshMinimap();
}

function RemoveEditArea( file )
{
	//
}

function InitContentEditor( element, file )
{
	var minimapZoomLevel = 0.5;
	
	// Remove previous editor
	if( file.editor )
	{
		file.editor.destroy();
		file.editor = null;
		RemoveEditArea( file );
	}
	
	// Associate page with file
	element.file = file;
	
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
	file.editor.clearSelection();
	file.editor.gotoLine( 0, 0, true );	
	file.editor.setTheme( 'ace/theme/' + settings.theme );
	file.editor.session.setUseWorker( false );
	
	file.editor.getSession().on( 'change', function( e )
	{
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
			else if( ty + file.minimapRect.offsetHeight > file.minimapGroove.offsetHeight )
				ty = file.minimapGroove.offsetHeight - file.minimapRect.offsetHeight;
			file.minimapRect.style.top = ty + 'px';		
			
			var lineNumber = Math.floor( ( ty / ( file.minimapGroove.offsetHeight - file.minimapRect.offsetHeight ) ) * file.lines.length );
			file.editor.gotoLine( lineNumber, 0, false );
		}
	}
	window.addEventListener( 'mouseup', function( e )
	{
		file.mouseDown = false;
		file.minimapRect.classList.remove( 'Move' );
		file.refreshMinimap();
	}, false );
	// Done moving the rect
	var ac = file.page.querySelector( '.ace_scroller' );
	ac.parentNode.appendChild( file.minimap );
	ac.parentNode.appendChild( file.minimapRect );
	ac.parentNode.appendChild( file.minimapGroove );
	
	// Events for minimap
	file.editor.session.on( 'changeScrollTop', function( e )
	{
		file.refreshMinimap( e );
	} );
	
	file.refreshBuffer = function()
	{
		// Add minimap dom element
		this.lines = this.editor.session.getValue().split( '\n' );
		var str = [];
		var cl;
		for( var a = 0; a < this.lines.length; a++ )
		{
			cl = '';
			if( this.lines[a].indexOf( '//' ) >= 0 )
				cl = ' Comment';
			else if( this.lines[a].indexOf( 'function' ) >= 0 )
				cl = ' Function';
			else if( this.lines[a].indexOf( 'if' ) >= 0 )
				cl = ' If';
			else if( this.lines[a].indexOf( 'for' ) >= 0 )
				cl = ' If';
			else if( this.lines[a].indexOf( 'while' ) >= 0 )
				cl = ' If';
			else if( this.lines[a].indexOf( 'var' ) >= 0 )
				cl = ' Var';
			str.push( '<textarea resize="false" class="MinimapRow' + cl + '">' + this.lines[ a ] + '</textarea>' );
		}
		this.minimap.innerHTML = '<div>' + str.join( '' ) + '</div>';
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
		
			// Text container height
			var contHeight = ac.offsetHeight + ( lh * minimapZoomLevel );
		
			// 
			var m = self.minimapRect;
		
			// Don't do calculation when there's no content to scroll
			if( tot <= contHeight )
			{
				m.style.height = contHeight + 'px';
				self.minimap.style.height = contHeight + 'px';
				return;
			}
		
			// Scroll position
			if( e < 0 ) e = 0;
			if( e > tot - contHeight ) e = tot - contHeight;
			
			var meh = self.minimap.offsetHeight; // Zoomed
	
			// Scroll progress
			var sp = e / ( tot - contHeight );
		
			// Set top of minimap to show current minimap position
			if( meh > contHeight )
				self.minimap.style.top = -( sp * ( meh - contHeight ) ) + 'px';
			else self.minimap.style.top = 0;
		
			// Page visualization
			if( !file.mouseDown )
			{
				m.style.height = ( ( contHeight / tot ) * meh ) + 'px';
				m.style.top = sp * ( contHeight - m.offsetHeight ) + 'px';
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
		path: path,
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
		}
		f.save( file.editor.getValue() );
	}
	else
	{
		( new Filedialog( {
			path: file.path ? file.path : 'Home:',
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
				}
				f.save( file.editor.getValue() );
			},
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
	Application.currentFile.refreshBuffer();
	Application.currentFile.refreshMinimap();
}, false );

window.addEventListener( 'resize', function( e )
{
	// Update minimap
	Application.currentFile.refreshMinimap();
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

// Run / stop app

// Run the current jsx
function RunApp()
{
	if( Application.currentFile )
	{
		Application.sendMessage( {
			type: 'system',
			command: 'executeapplication',
			executable: Application.currentFile.path,
			arguments: false
		} );
	}
}

// Kill running jsx
function StopApp()
{
	if( Application.currentFile )
	{
		Application.sendMessage( { type: 'system', command: 'kill', appName: Application.currentFile.filename } );
	}
}

// The project editor ----------------------------------------------------------

var pe = null;
function OpenProjectEditor()
{
	if( pe )
	{
		return pe.activate();
	}
	pe = new View( {
		title: i18n( 'i18n_project_editor' ),
		width: 900,
		height: 700
	} );
	
	var f = new File( 'Progdir:Templates/project_editor.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		pe.setContent( data, function( d )
		{
			pe.sendMessage( { command: 'updateproject', data: Application.currentProject } );
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
	this.project = {
		ProjectName: '',
		Author:      '',
		Email:       '',
		Version:     '',
		API:         'v1',
		Description: '',
		Images:      [],
		Files:       [],
		Permissions: [],
		Libraries:   []
	};
}

function NewProject()
{
	var p = new Project();
	projects.push( p );
	RefreshProjects();
}

function OpenProject( path )
{
	if( path.toLowerCase().indexOf( '.apf' ) > 0 )
	{
		var p = new Project();
		p.Path = path;
	
		var f = new File( p.Path );
		f.onLoad = function( data )
		{
			var proj = JSON.parse( data );
			for( var a in proj )
				p[ a ] = proj[ a ];
			projects.push( p );
			Application.currentProject = p;
			RefreshProjects();
			ge( 'tabProjects' ).onclick();
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
		
			var f = new File( p.Path );
			f.onLoad = function( data )
			{
				var proj = JSON.parse( data );
				for( var a in proj )
					p[ a ] = proj[ a ];
				projects.push( p );
				Application.currentProject = p;
				RefreshProjects();
				ge( 'tabProjects' ).onclick();
			}
			f.load();
		},
		type: 'open',
		suffix: 'apf',
		rememberPath: true
	} ) );
}

function SaveProject( file, saveas )
{
	if( !saveas ) saveas = false;
	
	if( !saveas && file.path )
	{
		var f = new File( file.path );
		StatusMessage( i18n( 'i18n_saving' ) );
		f.onSave = function( res )
		{
			StatusMessage( i18n( 'i18n_saved' ) );
		}
		f.save( file.editor.getValue() );
	}
	else
	{
		( new Filedialog( {
			path: file.path ? file.path : 'Home:',
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
				}
				f.save( file.editor.getValue() );
			},
			type: 'save',
			suffix: supportedFiles,
			rememberPath: true
		} ) );
	}
}

function RefreshProjects()
{
	var filesFromPath = {};
	for( var a = 0; a < files.length; a++ )
	{
		if( files[a].path )
			filesFromPath[ files[a].path ] = files[a];
	}
	
	var str = '';
	for( var a = 0; a < projects.length; a++ )
	{
		var pr = projects[ a ];
		var fstr = '';
		
		var projectpath = pr.Path.split( '/' );
		projectpath.pop();
		projectpath = projectpath.join( '/' ) + '/';
		
		if( pr.Files && pr.Files.length )
		{
			var sortable = [];
			for( var c = 0; c < pr.Files.length; c++ )
			{
				var path = pr.Files[ c ].Path;
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
			fstr = listFiles( sortable, 1, false, {} );
		}
		var current = ' BackgroundHeavy Rounded';
		if( Application.currentProject == pr )
		{
			current = ' Current BackgroundHeavier Rounded';
		}
		str += '<ul><li class="Project' + current + '" onclick="SetCurrentProject( \'' + pr.Path + '\')">' + pr.ProjectName + '</li>' + fstr + '</ul>';
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
	
	// List files recursively
	function listFiles( list, depth, path, folders )
	{
		var str = '';
		
		for( var a in list )
		{
			if( list[ a ].levels.length == depth )
			{
				var fpath = projectpath + list[a].fullpath;
				if( !path || ( path && list[ a ].path == path ) )
				{
					str += '<li class="FileItem" path="' + fpath + '" onclick="OpenFile(\'' + fpath + '\')">' + list[ a ].levels[ depth - 1 ] + '</li>';
				}
			}
			else if( list[a].levels.length == depth + 1 && !folders[ list[ a ].path ] )
			{
				folders[ list[ a ].path ] = true;
				str += '<li class="Folder" onclick="ToggleOpenFolder(this)">' + list[ a ].levels[ depth - 1 ] + '/</li>';
				str += listFiles( list, depth + 1, list[ a ].path );
			}
		}
		if( str.length ) str = '<ul>' + str + '</ul>';
		return str;
	}
}

function SetCurrentProject( p )
{
	for( var a = 0; a < projects.length; a++ )
	{
		if( projects[ a ].Path == p )
		{
			Application.currentProject = projects[ a ];
			RefreshProjects();
			return true;
		}
	}
	return false;
}

function ToggleOpenFolder( ele )
{
	if( ele.classList.contains( 'Open' ) )
	{
		ele.classList.remove( 'Open' );
	}
	else
	{
		ele.classList.add( 'Open' );
	}
}

// End projects ----------------------------------------------------------------

// Helper
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

// Messaging support -----------------------------------------------------------

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
			case 'project_editor':
				OpenProjectEditor();
				break;
			case 'project_open':
				OpenProject();
				break;
			case 'drop':
				if( msg.data )
				{
					for( var a = 0; a < msg.data.length; a++ )
					{
						new EditorFile( msg.data[ a ].Path );
					}
				}
				break;
		}
	}
}
