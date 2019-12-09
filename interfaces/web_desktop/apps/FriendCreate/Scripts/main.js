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

// Initialize the GUI! ---------------------------------------------------------

function InitGui()
{
	InitTabs( ge( 'SideBarTabs' ) );
	if( ge( 'SideBar' ) )
	{
		gui.sideBar = new Friend.FileBrowser( ge( 'SB_AllFiles' ), { displayFiles: true }, gui.sideBarCallbacks );
		gui.sideBar.render();
		ge( 'tabAllFiles' ).onclick();
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
	this.state = state;
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
				}
			} );
		}
		else
		{
			d.parentNode.removeChild( d );
			t.parentNode.removeChild( t );
			t.file.close();
			InitTabs( ge( 'CodeArea' ) );
		}
		return cancelBubble( e );
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
	
	Application.currentFile = file;
	file.tab.onclick();
	
	if( file.refreshMinimap )
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
		if( file.minimapRect )
		{
			file.minimapRect.classList.remove( 'Move' );
			file.refreshMinimap();
		}
	}, false );
	// Done moving the rect
	var ac = file.page.querySelector( '.ace_scroller' );
	ac.parentNode.appendChild( file.minimap );
	ac.parentNode.appendChild( file.minimapRect );
	ac.parentNode.appendChild( file.minimapGroove );
	
	// Events for minimap
	file.editor.session.on( 'changeScrollTop', function( e )
	{
		if( file.refreshMinimap )
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
	if( !Application.currentProject )
	{
		var p = new Project();
		p.Path = 'Home:';
		projects.push( p );
		Application.currentProject = p;
	}
	
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
}

function OpenProject( path )
{
	if( path && path.toLowerCase().indexOf( '.apf' ) > 0 )
	{
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
			p.ID = Sha256.hash( ( new Date() ).getTime() + '.' + Math.random() ).toString();
		
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

function SaveProject( project, saveas )
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

	if( !saveas && project.Path )
	{
		var f = new File( project.Path );
		StatusMessage( i18n( 'i18n_saving' ) );
		f.onSave = function( res )
		{
			StatusMessage( i18n( 'i18n_saved' ) );
		}
		f.save( JSON.stringify( projectOut ) );
	}
	else
	{
		( new Filedialog( {
			path: project.path ? project.path : 'Home:',
			triggerFunction: function( filename )
			{
				project.Path = filename;
				projectOut.Path = filename;

				var f = new File( project.Path );
				StatusMessage( i18n( 'i18n_saving' ) );
				f.onSave = function( res )
				{
					StatusMessage( i18n( 'i18n_saved' ) );
				}
				f.save( JSON.stringify( projectOut ) );
			},
			type: 'save',
			filename: '',
			suffix: 'apf',
			rememberPath: true
		} ) );
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
	if( proj == Application.currentProject )
		Application.currentProject = null;
	RefreshProjects();
}

function RefreshProjects()
{
	if( projects.length == 0 )
	{
		ge( 'SB_Project' ).innerHTML = '\
			<div class="Padding"><p>' + i18n( 'i18n_no_projects' ) + '</p>\
			<p><button type="button" class="IconSmall fa-briefcase" onclick="NewProject()"> ' + i18n( 'i18n_new_project' ) + '</button></p>\
			</div>';
		return;
	}
	
	var filesFromPath = {};
	for( var a = 0; a < files.length; a++ )
	{
		if( files[a].path )
			filesFromPath[ files[a].path ] = files[a];
	}
	
	var str = '';
	for( var a = 0; a < projects.length; a++ )
	{
		if( !Application.currentProject )
			Application.currentProject = projects[ a ];
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
		str += '<ul><li class="Project' + current + '" ondblclick="OpenProjectEditor()" onclick="SetCurrentProject( \'' + pr.ID + '\')">' + pr.ProjectName + '</li>' + fstr + '</ul>';
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
		if( projects[ a ].ID == p )
		{
			if( Application.currentProject != projects[ a ] )
			{
				Application.currentProject = projects[ a ];
				RefreshProjects();
				return true;
			}
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

// Search and replace ----------------------------------------------------------

function Search()
{
	if( ge( 'Search' ) )
	{
		ge( 'Search' ).getElementsByTagName( 'input' )[0].focus();
		return;
	}
	var d = document.createElement( 'div' );
	d.id = 'Search';
	d.innerHTML = '<input type="text" placeholder="' + i18n( 'i18n_search_keywords' ) + '"/>';
	ge( 'StatusBar' ).appendChild( d );
}

// End search and replace ------------------------------------------------------

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

// Messaging support -----------------------------------------------------------
var abw = false;
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
						break;
					}
				}
				RefreshProjects();
				if( pe ) pe.close();
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
					height: 600
				} );
				var f = new File( 'Progdir:Templates/about.html' );
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
		}
	}
}
