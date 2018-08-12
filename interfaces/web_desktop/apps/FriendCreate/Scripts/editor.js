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

// App settings..
settings = {
	wordWrap: true,
	wordWrapWidth: 80,
	codeFolding: true,
	ownScreen: false,
	theme: 'twilight'
};

var resizeColumn = {
	state: 0,
	offset: 0
};

var sasActive = false;
var FileBrowser;

var filebrowserCallbacks = {
	// Check a file on file extension
	checkFile( path, extension )
	{
		if( extension == 'apf' )
		{
			Confirm( 'Loading project', 'Do you want to load this project? If you click cancel, Friend Create will just load the project file.', function( info )
			{
				if( info.data == true )
				{
					Application.sendMessage( {
						command: 'project_load',
						path: path
					} );
				}
				// Just load it
				else
				{
					Application.sendMessage( {
						command: 'loadfiles',
						paths: [ path ]
					} );
				}
			} );
		}
		else
		{
			// Just switch to existing
			for( var a in Application.files )
			{
				if( Application.files[a].filename == path )
				{
					return Application.setCurrentFile( a );
				}
			}
			Application.sendMessage( {
				command: 'loadfiles',
				paths: [ path ]
			} );
		}
	},
	// Load a file
	loadFile( path )
	{
		// Just switch to existing
		for( var a in Application.files )
		{
			if( Application.files[a].filename == path )
			{
				return Application.setCurrentFile( a );
			}
		}
		Application.sendMessage( {
			command: 'loadfiles',
			paths: [ path ]
		} );
	},
	// Do we permit?
	permitFiletype( path )
	{
		return Application.checkFileType( path );
	}
};

Application.run = function( msg )
{
	InitTabs( ge( 'EditorTabs' ) );
	InitTabs( ge( 'filelisttabs' ) );	
	
	// Render the file browser
	var FileBrowser = new friend.FileBrowser( ge( 'filebrowser' ), { displayFiles: true }, filebrowserCallbacks );
	FileBrowser.render();
	this.fileBrowser = FileBrowser;
	
	VisualEditor.init();
	
	// Make sure we can run ace
	function delayedSetupAce()
	{
		if( typeof( ace ) != 'undefined' && ace )
		{
			Application.setupAce();
			Application.refreshAceSettings();
		}
		else
		{
			// Ace isn't loaded yet. Try again.
			return setTimeout( delayedSetupAce, 100 );
		}
	}

	ge( 'ResizeColumn' ).onmousedown = function( e )
	{
		resizeColumn.offset = e.clientX - ge( 'ResizeColumn' ).offsetLeft;
		resizeColumn.state = 1;
	}

	loadConfig( delayedSetupAce );

	this.sideBarHidden = false;
};

window.addEventListener( 'mousemove', function( e )
{
	if( resizeColumn.state == 1 )
	{
		var l = e.clientX - resizeColumn.offset;
		if( l < 200 ) l = 200;
		ge( 'ResizeColumn' ).style.left = l + 'px';
		ge( 'filelisttabs' ).style.width = l + 'px';
		ge( 'fileslist' ).style.width = l + 'px';
		ge( 'filestabs' ).style.width = l + 'px';
		ge( 'filestatus' ).style.width = l + 'px';
		ge( 'CodeView' ).style.left = l + ge( 'ResizeColumn' ).offsetWidth + 'px';
	}
} );

window.addEventListener( 'mouseup', function( e )
{
	resizeColumn.state = 0;
} );

Application.refreshAceSettings = function( reload )
{
	function carryOut()
	{
		var sess = Application.editor.getSession();
		if( settings.wordWrap )
		{
			var ww = isMobile ? Math.floor( settings.wordWrapWidth / 3 ) : settings.wordWrapWidth;
			sess.setWrapLimitRange( ww, ww );
			sess.setUseWrapMode( true );
		}
		else
		{
			sess.setUseWrapMode( false );
		}
		sess.setUseSoftTabs( false );

		var editor = ace.edit ( 'EditorArea' );
		editor.setTheme( 'ace/theme/' + settings.theme );
	}
	if( reload ) loadConfig( carryOut );
	else carryOut();
}

function tb( type )
{
	switch( type )
	{
		case 'new':
			Application.newFile();
			break;
		case 'load':
			Application.sendMessage( { command: 'open' } );
			break;
		case 'save':
			Application.save( 'withbackup' );
			break;
		case 'saveas':
			Application.sendMessage( { command: 'save_as' } );
			break;
		case 'close':
			Application.closeFile();
			break;
		case 'properties':	
			Application.sendMessage( { command: 'project_properties' } );
			break;
		case 'find':
			Application.sendMessage( {
		        command: 'search_replace'
		    } );
		   	break;
	}
}

function loadConfig( callback )
{
	// Read the config
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var o = false;
			try
			{
				o = JSON.parse( d );
			}
			catch( e )
			{ 
				console.log( 'Unexpected settings...' ); 
			}
			if( o && o.friendcreate )
			{
				for( var a in o.friendcreate ) settings[a] = o.friendcreate[a];
			}
		}
		if( callback )
		{
			callback();
		}
	}
	m.execute( 'getsetting', { setting: 'friendcreate' } );
}

// Create / recreate ace area
Application.createAceArea = function()
{
	// Remove previous editor
	if( this.editor )
	{
		this.editor.destroy();
		this.editor = null;
		if( ge( 'EditorArea' ) )
		{
			ge( 'editordiv' ).removeChild( ge( 'EditorArea' ) );
		}
	}
	
	// Create editor root container
	var area = document.createElement( 'div' );
	area.id = 'EditorArea';
	area.style.position = 'absolute';
	area.style.top = '0';
	area.style.left = '0';
	area.style.right = '0';
	area.style.bottom = '0';
	ge( 'editordiv' ).appendChild( area );

	// Setup the area with ace
	this.editor = ace.edit( 'EditorArea' );
	this.editor.setTheme( 'ace/theme/' + settings.theme );
	this.editor.session.setUseWorker( false );
	this.editor.getSession().setMode( 'ace/mode/javascript' );
	
	// Remove find dialog
	this.editor.commands.removeCommand( 'find' );
}

Application.setupAce = function()
{
	// Setup theme
	ace.config.set( 'basePath', 'apps/FriendCreate/Libraries/Ace' );
	
	var area = this.createAceArea();
	
	ge( 'editordiv' ).onmouseup = function()
	{
		Application.updateStatusbar();
	}
	
	// Setup styling
	var h = document.getElementsByTagName( 'head' )[0];
	var ex = document.createElement( 'style' );
	ex.innerHTML = 'body { margin: 0; transform: rotateZ(0deg);'+
		           ' -webkit-transform: rotateZ(0deg);}';
	h.appendChild(ex);

	// Set base font
	var s = document.createElement ( 'style' );
	s.innerHTML += 'html .ace_editor { font-size: 15px; }';
	document.body.appendChild ( s );

	// Remove find dialog
	this.editor.commands.removeCommand( 'find' );

	// Also take keyboard shortcuts here.
	// TODO: Instead, just connect the iframe to the
	//       event handler of the application!
	//       I.e. make such functionality! Like:
	//       app.connectKeyboardShortcuts ( iframe )
	var hk2 = function( e )
	{
		var kc = e.which ? e.which : e.keyCode;
		Application.sendMessage( { command: 'presskey', keycode: kc } );
		
		Application.updateStatusbar();
	}

	if ( document.addEventListener )
	{
		document.body.addEventListener( 'keyup', hk2 );
	}
	else
	{
		document.body.attachEvent( 'onkeyup', hk2 );
	}

	// Unbind the command/ctrl f key
	this.editor.commands.addCommand( {
		name: "unfind",
		bindKey: {
		    win: "Ctrl-F",
		    mac: "Command-F"
		},
		exec: function( editor, line)
		{
		    return false;
		},
		readOnly: true
	} );

	// Focus
	this.editor.focus();

	// Make a new file
	this.newFile();
};

Application.handleKeys = function( k, e )
{
	var wo = k;

	if ( e.ctrlKey )
	{
		if( wo == 79 )
		{
			Application.open();
			return true;
		}
		else if( wo == 83 )
		{
			Application.save( 'withbackup' );
			return true;
		}
		// n (doesn't work, find a different key)
		else if( wo == 78 )
		{
			Application.newFile();
			return true;
		}
		else if( wo == 81 )
		{
			Application.quit();
			return true;
		}
		// CTRL + I
		else if( wo == 73 )
		{
			Application.closeFile();
			return true;
		}
		// F
		else if( wo == 70 )
		{
		    Application.sendMessage( {
		        command: 'search_replace'
		    } );
		    return true;
		}
	}

	// Every second, after clicking a key, autosave ticks in
	var fn = Application.files[Application.currentFile];
	if( fn.touched && fn.filename.indexOf( ':' ) > 0 )
	{
		if( Application.autoSaveTimeout )
		{
			clearTimeout( Application.autoSaveTimeout );
		}
		Application.autoSaveTimeout = setTimeout( function()
		{
			Application.save( 'autosave' );
		}, 1000 );
	}

	// Make sure current file is touched
	if (
		fn && fn.touched != true &&
		this.editor.getSession().getValue().length > 0
	)
	{
		Application.files[Application.currentFile].touched = true;
	}
	return false;
}

// Set correct syntax highlighting
Application.applySyntaxHighlighting = function ()
{
	var cf = this.files[this.currentFile];
	if( !cf ) return;
	if( !cf.filetype || ( cf.filetype && cf.filetype.indexOf( ' ' ) > 0 && cf.filename ) )
	{
		var ext = cf.filename.split( '.' );
		cf.filetype = ext[ext.length-1];
	}
	var mode = '';
	var extension = this.files[this.currentFile].filetype.toLowerCase();

	switch( extension )
	{
		case 'php':  mode = 'ace/mode/php';          break;
		case 'pl':   mode = 'ace/mode/perl';         break;
		case 'sql':  mode = 'ace/mode/sql';          break;
		case 'sh':   mode = 'ace/mode/batchfile';    break;
		case 'as':   mode = 'ace/mode/actionscript'; break;
		case 'css':  mode = 'ace/mode/css';          break;
		case 'txt':  mode = 'ace/mode/plain_text';   break;
		// TODO: Update with solidity syntax when available
		case 'sol':
			extension = 'sol';
			mode = 'ace/mode/javascript';
			break;
		case 'jsx':
			extension = 'jsx';
			mode = 'ace/mode/javascript';
			break;
		case 'apf':
		case 'info':
		case 'json':
		case 'pls':
		case 'js':
		case 'url':
			extension = 'js';
			mode = 'ace/mode/javascript';
			break;
		case 'tpl':
		case 'ptpl':
		case 'html':
		case 'htm':
			extension = 'html';
			mode = 'ace/mode/html';
			break;
		case 'xml':  mode = 'ace/mode/xml';          break;
		case 'c':
		case 'h':
		case 'cpp':
			extension = 'cpp';
			mode = 'ace/mode/c_cpp';
			break;
		case 'd':    mode = 'ace/mode/d';            break;
		case 'ini':  mode = 'ace/mode/ini';          break;
		case 'java': mode = 'ace/mode/java';         break;
		case 'run':
			extension = 'c';
			mode = 'ace/mode/c_cpp';
			break;
		case 'conf':
			extension = 'conf';
			mode = 'ace/mode/plain_text';
			break;
		case 'lang':
		case 'md':
		default:
			extension = 'txt';
			mode = 'ace/mode/plain_text';
			break;
	}
	this.editor.getSession().setMode( mode );
	var opts = ge( 'Syntax' ).getElementsByTagName( 'option' );
	for( var a = 0; a < opts.length; a++ )
	{
		if( opts[a].value == extension )
			opts[a].selected = 'selected';
		else opts[a].selected = '';
	}

	// Find extra functionality
	var xt = this.checkExtraFunctionality( extension );
	ge( 'SpecialControls' ).innerHTML = xt ? xt : '';
};

// Check if the gui should have extra functionality
Application.checkExtraFunctionality = function( ext )
{
	if( Application.projectFilename )
	{
		return '\
			<div>\
				<button type="button" class="IconSmall fa-play" onclick="Application.runProject()"></button>\
				<button type="button" class="IconSmall fa-stop" onclick="Application.stopProject()"></button>\
			</div>\
			\
			';
	}
	switch( ext )
	{
		case 'jsx':
			return '\
			<div>\
				<button type="button" class="IconSmall fa-play" onclick="Application.runJSX()"></button>\
				<button type="button" class="IconSmall fa-stop" onclick="Application.stopJSX()"></button>\
			</div>\
			\
			';
	}
	return false;
}

// Run the current jsx
Application.runJSX = function()
{
	var args = false;

	this.sendMessage( {
		type: 'system',
		command: 'executeapplication',
		executable: this.files[this.currentFile].filename,
		arguments: args
	} );
}

// Kill running jsx
Application.stopJSX = function()
{
	var fname = this.files[this.currentFile].filename.split( ':' )[1];
	if( fname.indexOf( '/' ) >= 0 )
	{
		fname = fname.split( '/' ); fname = fname[fname.length-1]
	}
	this.sendMessage( { type: 'system', command: 'kill', appName: fname } );
}

// Run the project main executable
Application.runProject = function()
{
	if( !this.projectFilename )
	{
		Alert( i18n( 'i18n_no_project' ), i18n( 'i18n_cant_project_filename' ) );
		return;
	}
	
	this.sendMessage( {
		type: 'system',
		command: 'executeapplication',
		executable: this.projectFilename,
		arguments: false
	} );
}

// Kill project
Application.stopProject = function()
{
	for( var a in this.files )
	{
		var ext = this.files[a].filename.split( '.' );
		ext = ext[ext.length-1];
		if( ext.toLowerCase() == 'jsx' )
		{
			var f = this.files[a].filename;
			if( f.indexOf( '/' ) > 0 )
			{
				f = f.split( '/' );
				f = f[f.length-1];
			}
			else f = f.split( ':' )[1];
			this.sendMessage( { type: 'system', command: 'kill', appName: f } );
			return true;
		}
	}
	return false;
}

// Update the statusbar with correct information
Application.updateStatusbar = function()
{
	var session = this.editor.getSession();
	var cnt = session.getValue();
	if ( !this.statusBarLn )
	{
		var els = document.getElementsByTagName ( 'div' );
		for ( var a = 0; a < els.length; a++ )
		{
			if ( els[a].className.indexOf( 'Ln ' ) == 0 )
				this.statusBarLn = els[a];
			else if ( els[a].className.indexOf( 'Col ' ) == 0 )
				this.statusBarCol = els[a];
			else if ( els[a].className.indexOf( 'TabWidth ' ) == 0 )
				this.statusBarTabWidth = els[a];
			else if ( els[a].className.indexOf( 'InsOvr' ) == 0 )
				this.statusBarInsOvr = els[a];
		}
		els = document.getElementsByTagName ( 'select' );
		for ( var a = 0; a < els.length; a++ )
		{
			if ( els[a].className.indexOf( 'SyntaxHighlighting' ) == 0 )
				this.statusBarSyntax = els[a];
		}
	}
	var sl = this.editor.getSelection();
	var s = sl.getSelectionAnchor();
	var l = sl.getSelectionLead();
	this.statusBarCol.innerHTML = s.column;
	this.statusBarLn.innerHTML = (l.row+1);
	this.statusBarTabWidth.innerHTML = this.editor.getSession().getTabSize();
	this.statusBarInsOvr.innerHTML = this.editor.getOverwrite() ? 'OVR' : 'INS';

	// TODO: Allow override with temporary highlighting!
	if( this.files && this.files[this.currentFile] )
	{
		var mode = this.files[this.currentFile].filetype;
		if ( typeof ( mode ) == 'undefined' || !mode || mode == 'undefined' ) mode = 'txt';
		else if( mode == 'run' ) mode = 'c';
		var opts = this.statusBarSyntax.getElementsByTagName ( 'option' );
		for ( var a = 0; a < opts.length; a++ )
		{
			if ( opts[a].value == mode ) opts[a].selected = 'selected';
			else opts[a].selected = '';
		}
	}
};

// Progress indicator when loading files!
var loader = false;
var loading = 0;
function loadProgress()
{
	// Make ready a progress bar for loading the files
	if( !loader )
	{
		loader = document.createElement( 'div' );
		loader.className = 'FileLoaderProgress MouseBusy';
		loader.bar = document.createElement( 'div' ),
		loader.appendChild( loader.bar );
		document.body.appendChild( loader );
		loader.style.display = 'none';
	}
	if( loading > 0 )
	{
		loader.style.display = 'block';
	}
	else
	{
		loader.style.display = 'none';
	}
}

// Loads a file
Application.loadFile = function( data, path, cb )
{
	if( !this.files )
	{
		this.files = [ {} ];
		this.currentFile = 0;
	}
	// Ok, we have the first file
	if( this.files[this.currentFile].content.length <= 0 && this.files[this.currentFile].touched == false )
	{
		var f = this.files[this.currentFile];
		f.touched = true;
		f.filename = path;
		this.setCurrentFile( this.currentFile );
		f.content = data;
		this.editor.setValue( data );
	}
	// Add a new file
	else
	{
		// Make sure it is not already loaded
		for( var a = 0; a < this.files.length; a++ )
		{
			// It already exists..
			if( this.files[a].filename == path )
			{
				if( cb ) cb();
				// Activate it
				this.setCurrentFile( a );
				this.refreshFilesList();
				return;
			}
		}
		// Set it
		this.files.push( { content: data, filename: path, touched: true } );
		this.setCurrentFile( this.files.length - 1 );
	}
	// Refresh so we can see it in the list
	this.refreshFilesList();
	if( cb ) cb();
}

// Say we wanna open
Application.open = function()
{
	this.sendMessage( { command: 'open' } );
}

// Say we wanna save
Application.save = function( mode )
{
	if( !mode ) mode = 'normal';
	
	// Do an autosave
	if( mode == 'autosave' )
	{
		var f = new File( this.files[ this.currentFile ].filename );
		f.onSave = function()
		{
			ge( 'status' ).innerHTML = i18n( 'i18n_autosaved' );
			if( ge( 'status' ).timeout )
				clearTimeout( ge( 'status' ) );
			ge( 'status' ).timeout = setTimeout( function()
			{
				ge( 'status' ).innerHTML = '';
			}, 1000 );
		}
		f.save( this.editor.getValue() );
	}
	else
	{
		// Bump!
		this.sendMessage( { command: 'save', mode: mode } );
	}
}

// Add a new file
Application.newFile = function()
{
	if ( !this.files ) this.files = [];
	this.files.push( { content: '', filename: i18n ( 'i18n_empty_file' ), touched: false } );
	this.setCurrentFile( this.files.length - 1 );
	this.refreshFilesList();

	// Sync the new list to parent level
	this.sendMessage( {
		command: 'receivefilesync',
		files: this.files
	} );
};

// Refresh file tabs -----------------------------------------------------------
Application.refreshFilesList = function ()
{
	// Do only once at a time!
	if( this.refreshingFiles )
	{
		return setTimeout( function()
		{
			Application.refreshFilesList();
		}, 100 );
	}
	this.refreshingFiles = true;
	
	// Get all elements
	var d = document.getElementsByTagName( 'div' );
	var files = false;
	for( var a = 0; a < d.length; a++ )
	{
		if( d[a].classList && d[a].classList.contains( 'Files' ) )
		{
			files = d[a];
			break;
		}
	}
	if( !files )
	{
		this.refreshingFiles = false;
		return;
	}

	files.innerHTML = '';

	// Tab support
	// TODO: Reenable
	/*var tabcontainer = ge( 'EditorTabs' );
	var tabs = [];
	tabcontainer = tabcontainer.getElementsByClassName( 'TabContainer' );
	if( tabcontainer.length )
	{
		tabcontainer = tabcontainer[ 0 ];
		tabs = tabcontainer.getElementsByClassName( 'Tab' );
	}
	else tabcontainer = null;*/
	
	// Loop through the files
	var sw = 2;
	
	for( var t = 0; t < this.files.length; t++ )
	{
		var c = document.createElement ( 'div' );
		var fullfile = this.files[t].filename.split ( '%20' ).join ( ' ' ).split ( ':/' ).join ( ':' );
		var onlyfile = fullfile.split( ':' )[1];
		if( onlyfile && onlyfile.indexOf( '/' ) >= 0 )
		{
			onlyfile = onlyfile.split( '/' );
			if( onlyfile[ onlyfile.length - 1 ] === '' )
				onlyfile = onlyfile[ onlyfile.length - 2 ];
			else onlyfile = onlyfile[ onlyfile.length - 1 ];
			c.innerHTML = '<span>' + onlyfile + '</span>&nbsp;|&nbsp;<span title="' + fullfile + '">' + fullfile + '</span><div class="Icon IconSmall fa-close"></div>';
		}
		else c.innerHTML = '<span>' + fullfile + '</span><div class="Icon IconSmall fa-close"></div>';
		c.style.whiteSpace = 'nowrap';
		c.style.textOverflow = 'ellipsis';
		c.style.overflow = 'hidden';
		c.className = 'Padding MousePointer sw' + ( sw = sw == 1 ? 2 : 1 );
		if ( t == this.currentFile ) c.classList.add( 'Selected' );
		c.ind = t;
		c.onclick = function ( e )
		{
			ge( 'CodeEditorTab' ).onclick();
			
			Application.setCurrentFile( this.ind );

			// Close when clicking on close icon
			var t = e.target ? e.target : e.srcElement;
			if( t.className.indexOf( 'fa-close' ) > 0 )
			{
				Application.closeFile();
			}
			else
			{
				Application.refreshFilesList();
			}
		};
		files.appendChild ( c );
		
		// Update tabs
		// TODO: Enable tab support
		/*if( tabcontainer )
		{
			var found = false;
			for( var b = 0; b < tabs.length; b++ )
			{
				if( tabs[b].filename == fullfile )
				{
					found = true;
					break;
				}
			}
			// New tab!
			if( !found )
			{
				var d = document.createElement( 'div' );
				d.className = 'Tab IconSmall fa-code';
				d.filename = fullfile;
				d.innerHTML = fullfile;
				tabcontainer.appendChild( d );
			}
		}*/
	}
	
	// TODO: Enable tab support
	/*InitTabs( ge( 'EditorTabs' ), function( pages )
	{
		console.log( pages );
		return true;
	} );*/
	
	this.applySyntaxHighlighting();
	
	// We are done
	this.refreshingFiles = false;
};

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

// Send an event
function SendSasEvent( event, data )
{
	// Only send sas event if sas is active
	if( sasActive )
	{
		Application.sendMessage( { command: 'guievent', event: event, data: data } );
	}
}

function ExecuteSasEvent( msg, identity )
{
	// Check event
	switch( msg.event )
	{
		case 'initvisualpage':
			// TODO: fix this later
			return;
			VisualEditor.mode = msg.data;
			VisualEditor.init();
			break;
		case 'visual_addelement':
			VisualEditor.add( msg.data );
			break;
		case 'mousedown':
			if( ge( msg.data.id ) )
			{
				ge( msg.data.id ).events.mouseDown( msg.data.event, true );
			}
			break;
		case 'mouseup':
			if( ge( msg.data.id ) )
			{
				ge( msg.data.id ).events.mouseUp( msg.data.event, true );
			}
			break;
		case 'mousemove':
			if( ge( msg.data.id ) )
			{
				ge( msg.data.id ).events.mouseMove( msg.data.event, true );
			}
			break;
	}
}

// Get a storable session that we can recover
Application.getStorableSession = function( session )
{
	var filterHistory = function( deltas )
	{
		return deltas.filter( function( d )
		{
		    return d.group != "fold";
		} );
	};
	var o = {
        selection: session.selection.toJSON(),
        value: session.getValue(),
        history: {
            undo: session.$undoManager.$undoStack.map( filterHistory ),
            redo: session.$undoManager.$redoStack.map( filterHistory )
        },
        scrollTop: session.getScrollTop(),
        scrollLeft: session.getScrollLeft(),
        options: session.getOptions()
    };
    return o;
}

// Set a stored session
Application.setStoredSession = function( data )
{
	// Setup the area again to prevent leaks!
	this.createAceArea();
	var session = ace.createEditSession( data.value );
	session.$undoManager.$doc = session; // NOTICE: workaround for a bug in ace
	session.setOptions( data.options );
	session.$undoManager.$undoStack = data.history.undo;
	session.$undoManager.$redoStack = data.history.redo;
	session.selection.fromJSON( data.selection );
	session.setScrollTop( data.scrollTop );
	session.setScrollLeft( data.scrollLeft );
	this.editor.setSession( session );
	this.editor.session.setUseWorker( false );
	
	// Remove find dialog
	this.editor.commands.removeCommand( 'find' );
}

var inc = 0;
// Set the content from current file -------------------------------------------
Application.setCurrentFile = function( curr )
{
	var sess = this.editor.getSession();

	// Make sure we copy the right content before we change curr!
	if( sess && this.files && this.files[this.currentFile] )
	{
		this.files[ this.currentFile ].content = this.editor.getValue();
		this.files[ this.currentFile ].session = this.getStorableSession( sess );
	}

	// Make sure we have files
	if ( !this.files || !this.files[ this.currentFile ] )
	{
		if( this.files )
		{
			for( var a = 0; a < this.files.length; a++ )
			{
				this.currentFile = a;
			}
		}
		// No files now? Make new empty file..
		else
		{
			this.newFile();
		}
	}
	
	// Store current scroll top and values etc
	if( sess && ( curr || curr === 0 ) && this.files[ this.currentFile ] )
	{
		var f = this.files[this.currentFile];
		if( curr != this.currentFile )
		{
			f.content = Application.editor.getValue();
		}
	}

	// Set current file
	if( curr || curr === 0 )
	{
		this.currentFile = curr;
	}
	
	ge( 'CodeEditorTab' ).innerHTML = this.files[ this.currentFile ].filename;

	// Manage undo
	if( this.files[this.currentFile].session )
	{
		Application.setStoredSession( this.files[ this.currentFile ].session );
	}
	else
	{
		// New one
		var session = ace.require( 'ace/ace' ).createEditSession( this.files[this.currentFile].content );
		this.editor.setSession( session );
		this.editor.session.setUseWorker( false );
		
		// Remove find dialog
		this.editor.commands.removeCommand( 'find' );
	}
	
	// Clear the selection in the editor
	this.editor.clearSelection();
	
	// Show stuff to user
	this.updateStatusbar();

	FileInProjectCheck( this.currentFile );

	// Enable word wrapping
	this.refreshAceSettings();
};

// Check if file is to be added to project
function FileInProjectCheck( currentFile )
{
	var app = Application;
	
	// Check if this file is part of your project
	if( !app.files[ currentFile ] )
	{
		Notify( { title: 'File check failed', text: 'Current file doesn\'t exist in files list.' } );
		return false;
	}
	if( !app.projectFilename )
	{
		console.log( 'No project filename' );
		return false;
	}

	var ftabs = ge( 'filestabs_content' );
	ftabs.innerHTML = i18n( 'i18n_checking_file' );
	app.sendMessage( {
		command: 'checkfile',
		file: app.files[ currentFile ],
		callbackId: addCallback( function( data )
		{	
			if( data.data )
			{
				var d = data.data;
				if( d.str == '' )
				{
					ftabs.parentNode.parentNode.classList.remove( 'StatusPane' );
					ftabs.innerHTML = '';
				}
				else if( d.str == 'exists' )
				{
					ftabs.parentNode.parentNode.classList.remove( 'StatusPane' );
					ftabs.innerHTML = '';
				}
				else if( d.str == 'unknown' )
				{
					ftabs.parentNode.parentNode.classList.add( 'StatusPane' );
					ftabs.innerHTML = '<p class="Layout">' + i18n( 'i18n_add_file_to_project' ) + 
						'</p><p><button type="button" class="Button IconSmall fa-plus"> ' + 
							i18n( 'i18n_add_to_project' ) + '</button>';
					var b = ftabs.getElementsByTagName( 'button' )[0];
					b.onclick = function()
					{
						Application.sendMessage( {
							command: 'addtoproject',
							file: Application.files[ Application.currentFile ],
							callbackId: addCallback( function( data )
							{
								if( data.response == 'ok' )
								{
									ftabs.innerHTML = '';
									ftabs.parentNode.parentNode.classList.remove( 'StatusPane' );
								}
								else
								{
									ftabs.innerHTML = i18n( 'i18n_could_not_add_file' );
									setTimeout( function()
									{
										ftabs.parentNode.parentNode.classList.remove( 'StatusPane' );
									}, 2000 );
								}
							} )
						} );
					}
				}
				else
				{
					ftabs.parentNode.parentNode.classList.remove( 'StatusPane' );
					ftabs.innerHTML = '';
				}
			}
			else
			{
				ftabs.parentNode.parentNode.classList.remove( 'StatusPane' );
				ftabs.innerHTML = '';
			}
		} )
	} );
	
	return true;
}

// Close a file
Application.closeFile = function()
{
	var newFiles = [];
	var pick = this.currentFile;
	for ( var a = 0; a < this.files.length; a++ )
	{
		if( a != pick )
		{
			newFiles.push( {
				content: this.files[a].content,
				filename: this.files[a].filename,
				touched: this.files[a].touched
			} );
			this.currentFile = newFiles.length - 1;
	    }
	}

	// Initial state
	if ( newFiles.length <= 0 )
	{
		this.currentFile = 0;
		this.files = false;
		var d = ge( 'fileslist' ).getElementsByTagName ( 'div' );
		var files = false;
		for ( var c = 0; c < d.length; c++ )
		{
			if ( d[c].classList.contains ( 'Files' ) > 0 )
			{
				files = d[c];
				break;
			}
		}
		if ( !files )
		{
			return;
		}
		
		this.editor.setValue( '' );
		this.editor.clearSelection ();
		this.editor.getSession().setScrollTop ( 0 );
		
		if( this.collaboranewFile )
		{
			this.collaboranewFile();
		}
	}
	// Close existing file and rebuild files list
	else
	{
		this.files = newFiles;
		this.editor.setValue( this.files[this.currentFile].content );
		this.setCurrentFile( this.currentFile );
	}
	
	// We need at least one file
	if( !this.files.length )
	{
		this.newFile();
	}
	
	this.refreshFilesList();
}

Application.closeAllFiles = function()
{
	this.files = [];
	this.editor.setValue ( '' );
	this.editor.clearSelection ();
	this.editor.getSession().setScrollTop ( 0 );
	this.newFile();
}

function findDirectoryElement( p, path, doreturn )
{
	var eles = p.getElementsByTagName( 'div' );
	for( var a = 0; a < eles.length; a++ )
	{
		var test = eles[a].path;
		
		if( eles[a].path == path )
		{
			if( doreturn ) return eles[a];
			eles[a].ondblclick();
			a = eles.length;
			break;
		}
	}
}

// Show gui to create parent path
Application.createDirectoryGUI = function( parentPath )
{
	var ele = findDirectoryElement( ge( 'filebrowser' ), parentPath, true );
	if( ele )
	{
		var subs = ele.getElementsByClassName( 'SubItems' );
		if( subs && subs.length )
		{
			subs = subs[0];
			var d = document.createElement( 'div' );
			d.className = 'FileItem';
			var inp = document.createElement( 'input' );
			inp.setAttribute( 'type', 'text' );
			inp.className = 'FullWidth';
			d.appendChild( inp );
			subs.appendChild( d );
			if( !ele.classList.contains( 'Open' ) )
				ele.ondblclick();
			inp.addEventListener( 'keydown', function( e )
			{
				var wh = e.which ? e.which : e.keyCode;
				if( wh == 27 )
				{
					subs.removeChild( d );
				}
				// Try to create directory
				else if( wh == 13 )
				{
					var sh = new Shell();
					sh.onReady = function()
					{
						sh.execute( 'makedir ' + parentPath + inp.value, function()
						{
							sh.close();
							subs.removeChild( d );
							Application.fileBrowser.refresh();
						} );
					}
				}
			} );
			setTimeout( function()
			{
				inp.focus();
			}, 50 );
		}
	}
	else
	{
		console.log( 'Got no element on path: ' + parentPath );
	}
}

// Show gui to create parent path
Application.createFileGUI = function( parentPath )
{
	var ele = findDirectoryElement( ge( 'filebrowser' ), parentPath, true );
	if( ele )
	{
		var subs = ele.getElementsByClassName( 'SubItems' );
		if( subs && subs.length )
		{
			subs = subs[0];
			var d = document.createElement( 'div' );
			d.className = 'FileItem';
			var inp = document.createElement( 'input' );
			inp.setAttribute( 'type', 'text' );
			inp.className = 'FullWidth';
			d.appendChild( inp );
			subs.appendChild( d );
			if( !ele.classList.contains( 'Open' ) )
				ele.ondblclick();
			inp.addEventListener( 'keydown', function( e )
			{
				var wh = e.which ? e.which : e.keyCode;
				if( wh == 27 )
				{
					subs.removeChild( d );
				}
				// Try to create directory
				else if( wh == 13 )
				{
					var pp = parentPath;
					if( pp.substr( pp.length - 1, 1 ) != '/' && pp.substr( pp.length - 1, 1 ) != ':' )
					{
						pp += '/';
					}
						
					var f = new File( pp + inp.value );
					f.onSave = function()
					{
						subs.removeChild( d );
						Application.fileBrowser.clear();
						Application.fileBrowser.refresh();
					}
					f.save( ' ' );
				}
			} );
			setTimeout( function()
			{
				inp.focus();
			}, 50 );
		}
	}
}

Application.receiveMessage = function( msg )
{
	if( msg.command )
	{
		switch( msg.command )
		{
			// For file directories >
			case 'opendirectory':
				findDirectoryElement( ge( 'filebrowser' ), msg.data.path );
				break;
			case 'createfile':
				this.createFileGUI( msg.data.path );
				break;
			case 'createdirectory':
				this.createDirectoryGUI( msg.data.path );
				break;
			// End for file directories <
			case 'checkfileinproject':
				FileInProjectCheck( Application.currentFile );
				break;
			case 'guiaction':
				msg.event.sasIsHost = msg.sasIsHost;
				ExecuteSasEvent( msg.event, msg.identity );
				break;
			case 'refresh_collaborators':
				if( msg.activeUsers )
				{
					sasActive = true;
				}
				else sasActive = false;
				ge( 'Collaborators' ).innerHTML = msg.data;
				break;
			case 'incrementloader':
				loading++; 
				loadProgress();
				break;
			case 'refreshsettings':
				this.refreshAceSettings( true );
				break;
			case 'toggleSideBar':
				this.sideBarHidden = this.sideBarHidden ? false : true;
				ge( 'CodeView' ).style.left = !this.sideBarHidden ? '' : '0px';
				ge( 'ResizeColumn' ).style.visibility = !this.sideBarHidden ? '' : 'hidden';
				break;
			case 'appPreview':
				if( this.projectFilename )
				{
					var el = document.createElement( 'iframe' );
					el.className = 'AppPreview';
					el.src = '/webclient/app.html?app=' + this.projectFilename + '&authid=' + Application.authId;
					var cl = document.createElement( 'div' );
					cl.className = 'AppClose fa-close IconSmall MousePointer';
					cl.innerHTML = '&nbsp;' + i18n( 'i18n_close_app_preview' );
					cl.onclick = function()
					{
						ge( 'CodeView' ).removeChild( el );
						ge( 'CodeView' ).removeChild( cl );
					}
					ge( 'CodeView' ).appendChild( el );
					ge( 'CodeView' ).appendChild( cl );
				}
				else Alert( i18n('i18n_no_project'), i18n('i18n_you_havent_opened_up') );
				break;
			// Search request
			case 'search':
				this.editor.find( msg.keywords );
				break;
			case 'searchnext':
				this.editor.findNext();
				break;
			case 'searchprev':
				this.editor.findPrevious();
				break;
			case 'replace':
				var range = this.editor.find( msg.keywords, {
					wrap: true,
					caseSensitive: true,
					wholeWord: true,
					regExp: false,
					preventScroll: true // do not change selection
				} );
				if( msg.all )
				{
					this.editor.replaceAll( msg.replacement );
				}
				else
				{
					this.editor.replace( msg.replacement );
				}
				break;
			// Get project info
			case 'projectinfo':
				// Copy project information
				this.project = {};
				for( var a in msg.data ) this.project[a] = msg.data[a];
				if( msg.filename )
				{
					this.projectFilename = msg.filename;
				}
				if( msg.data.ProjectName )
				{
					Application.sendMessage( {
						command: 'settitle',
						title: 'Files in ' + msg.data.ProjectName
					} );
				}
				else 
				{
					Application.sendMessage( {
						command: 'settitle',
						title: ''
					} );
				}
				break;
			// Make a new file slot in the list
			case 'newfile':
				this.newFile();
				break;
			case 'movecursor':
				var c = this.editor.selection.getCursor();
				var s = this.editor.selection;
				switch( msg.direction )
				{
					case 'down':
						s.moveCursorDown();
						break;
					case 'up':
						s.moveCursorUp();
						break;
					case 'left':
						s.moveCursorLeft();
						break;
					case 'right':
						s.moveCursorRight();
						break;
				}
				break;
			case 'newline':
				this.editor.insert( "\n" );
				break;
			case 'insert':
				this.editor.insert( msg.data );
				break;
			case 'select':
				if( msg.what )
				{
					switch( msg.what )
					{
						case 'none': this.editor.selection.clearSelection(); break;
						case 'line': this.editor.selection.selectLine();     break;
						case 'word': this.editor.selection.selectWord();     break;
						case 'all':  this.editor.selection.selectAll();      break;
					}
				}
				break;
			case 'setfile':
				this.setCurrentFile( msg.filenum );
				break;
			case 'closefile':
				this.closeFile();
				break;
			case 'closeallfiles':
				this.closeAllFiles();
				break;
			case 'syncfiles':
				var meg = {
					command: 'receivefilesync',
					files: this.files,
					currentFile: this.currentFile
				};
				if( msg.callback ) meg.callback = msg.callback;
				this.sendMessage( meg );
				break;
			case 'receivefilesync':
				this.files = msg.files;
				this.currentFile = msg.currentFile;
				var meg = { command: 'filesyncnotification' };
				if( msg.callback ) meg.callback = msg.callback;
				this.sendMessage( meg );
				this.refreshFilesList();
				this.setCurrentFile( this.currentFile );
				this.syncing = false;
				break;
			// Just passes current editor content
			case 'getcurrentcontent':
				this.sendMessage( {
					command:  'receivecontent',
					data:     Application.editor.getSession().getValue(),
					callback: msg.callback
				} );
				break;
			case 'menuloadfile':
				Application.sendMessage( { command: 'loadfiles', paths: [ msg.data.path ] } );
				break;
			case 'loadfile':
				var cb = msg.callbackId;
				delete msg.callbackId;
				Application.loadFile( msg.data, msg.path, function()
				{
					// Tell we are done.
					if( cb )
					{
						loading--;
						// Give it time 
						setTimeout( function()
						{
							loadProgress();
						}, 500 );
						Application.sendMessage( {
							type: 'callback',
							callback: cb 
						} );	
					}
				} );
				break;
			case 'drop':
				var paths = [];
				var project = false;
				for( var a = 0; a < msg.data.length; a++ )
				{
					// Filter
					var path = msg.data[a].Path;
					if( this.checkFileType( path ) )
					{
						paths.push( path );
					}
					if( path && path.substr && path.substr( path.length - 4, 4 ).toLowerCase() == '.apf' )
					{
						project = path;
					}
				}
				if( project )
				{
					this.sendMessage( {
						command: 'project_load',
						path: project
					} );
				}
				// Files
				else
				{
					Application.sendMessage( { command: 'loadfiles', paths: paths } );
				}
				break;
			case 'updateStatus':
				ge( 'status' ).innerHTML = msg.data ? msg.data : '';
				break;
		}
	}
};

// TODO: Add more stuff here
document.oncontextmenu = function( e )
{
	cancelBubble( e );
}


