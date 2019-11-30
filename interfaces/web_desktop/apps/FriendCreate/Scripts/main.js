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
						/*Application.sendMessage( {
							command: 'project_load',
							path: path
						} );*/
					}
					// Just load it
					else
					{
						/*Application.sendMessage( {
							command: 'loadfiles',
							paths: [ path ]
						} );*/
					}
				} );
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

Application.files = [];

// Launch view logic -----------------------------------------------------------

Application.run = function( msg )
{
	InitGui();
	( new EditorFile( 'New file' ) );
}


// Set current file ------------------------------------------------------------
function SetCurrentFile( index )
{
	Application.currentFile = Application.files[ index ];
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
	
	for( var a = 0; a < Application.files.length; a++ )
	{
		if( Application.files[ a ].path == path )
		{
			return Application.files[ a ].tab.onclick();
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
					Application.files.push( self );
					InitEditArea( self );
					setTimeout( function()
					{
						self.refreshMinimap();
					}, 50 );
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
		Application.files.push( this );
		InitEditArea( this );
		setTimeout( function()
		{
			self.refreshMinimap();
		}, 50 );
	}
}
EditorFile.prototype.close = function()
{
	var out = [];
	for( var a = 0; a < Application.files.length; a++ )
	{
		if( Application.files[ a ] == this ) continue;
		out.push( Application.files[ a ] );
	}
	Application.files = out;
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
	file.editor.setTheme( 'ace/theme/' + settings.theme );
	file.editor.session.setUseWorker( false );
	
	file.editor.getSession().setMode( 'ace/mode/javascript' );
	
	// Remove find dialog
	file.editor.commands.removeCommand( 'find' );
	
	// Create minimap
	file.minimap = document.createElement( 'div' );
	file.minimap.className = 'Minimap';
	file.minimap.innerHTML = file.page.querySelector( '.ace_content' ).innerHTML;
	file.minimapRect = document.createElement( 'div' );
	file.minimapRect.className = 'MinimapRect';
	var ac = file.page.querySelector( '.ace_content' );
	file.page.querySelector( '.ace_editor' ).appendChild( file.minimap );
	file.page.querySelector( '.ace_editor' ).appendChild( file.minimapRect );
	
	// Events for minimap
	file.editor.session.on( 'changeScrollTop', function()
	{
		file.refreshMinimap();
	} );
	
	// Refresh the minimap
	file.refreshMinimap = function()
	{
		var self = this;
		if( this.refreshing ) return;
		this.refreshing = true;
		var lines = file.editor.session.getValue().split( '\n' );
		var len = lines.length;
		var tot = file.editor.renderer.lineHeight * len;
		var heh = ac.offsetHeight;
		
		this.minimap.innerHTML = '<div><pre class="MinimapRow">' + lines.join( '\n</pre><pre class="MinimapRow">' ) + '</pre></div>';
		this.minimapRect.style.height = Math.floor( heh / this.minimap.offsetHeight * 100 ) + '%';
		
		setTimeout( function(){ self.refreshing = false; }, 50 );
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
		f.onSave = function( res )
		{
			
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
				f.onSave = function( res )
				{
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
			console.log( 'Key: ' + wh );
			break;
	}
}, false );

document.body.addEventListener( 'keyup', function( e )
{
	// Update minimap
	Application.currentFile.refreshMinimap();
}, false );

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
		}
	}
}

