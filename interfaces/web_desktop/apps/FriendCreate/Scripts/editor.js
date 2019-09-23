/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
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
			Confirm( 
				i18n( 'i18n_loading_project' ), 
				i18n( 'i18n_loading_project_desc' ), function( info )
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
			var found = false;
			
			// Just switch to existing
			for( var a in Application.files )
			{
				if( Application.files[a].filename == path )
				{
					Application.setCurrentFile( a );
					found = true;
					break;
				}
			}
			if( !found )
			{
				Application.sendMessage( {
					command: 'loadfiles',
					paths: [ path ]
				} );
			}
			else
			{
				Application.refreshFilesList();
			}
		}
	},
	// Load a file
	loadFile( path )
	{
		var found = false;
		// Just switch to existing
		for( var a in Application.files )
		{
			if( Application.files[a].filename == path )
			{
				found = true;
				Application.setCurrentFile( a );
				break;
			}
		}
		if( !found )
		{
			Application.sendMessage( {
				command: 'loadfiles',
				paths: [ path ]
			} );
		}
		else
		{
			Application.refreshFilesList();
		}
	},
	// Do we permit?
	permitFiletype( path )
	{
		return Application.checkFileType( path );
	}
};

// When everything has loaded --------------------------------------------------
Application.run = function( msg )
{	
	InitTabs( ge( 'EditorTabs' ) );
	InitTabs( ge( 'filelisttabs' ) );	
	
	// Render the file browser
	var FileBrowser = new Friend.FileBrowser( ge( 'filebrowser' ), { displayFiles: true }, filebrowserCallbacks );
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
		if( settings.wordWrap && !isMobile )
		{
			var ww = settings.wordWrapWidth;
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
		// Control save
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
	var fn = Application.files[ Application.currentFile ];
	if( !fn )
		return;
		
	if( fn.touched && fn.filename.indexOf( ':' ) > 0 )
	{
		if( Application.autoSaveTimeout )
		{
			clearTimeout( Application.autoSaveTimeout );
		}
		Application.autoSaveTimeout = setTimeout( function()
		{
			Application.save( 'autosave', Application.currentFile );
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
	// Too early?
	if( !this.editor )
	{
		return setTimeout( function()
		{
			Application.applySyntaxHighlighting();
		}, 50 );
	}
	
	var cf = this.files[ this.currentFile ];
	if( !cf ) return;
	if( !cf.filetype || ( cf.filetype && cf.filetype.indexOf( ' ' ) > 0 && cf.filename ) )
	{
		var ext = cf.filename.split( '.' );
		cf.filetype = ext[ext.length-1];
	}
	
	var mode = '';
	var extension = this.files[ this.currentFile ].filetype.toLowerCase();

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
		executable: this.files[ this.currentFile ].filename,
		arguments: args
	} );
}

// Kill running jsx
Application.stopJSX = function()
{
	var fname = this.files[ this.currentFile ].filename.split( ':' )[1];
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
	if( this.files && this.files[ this.currentFile ] )
	{
		var mode = this.files[ this.currentFile ].filetype;
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
	var self = this;
	
	if( !this.files )
	{
		this.files = {};
		this.currentFile = path;
	}
	
	// Add a new file
	for( var a in this.files )
	{
		// It already exists..
		if( this.files[a].filename == path )
		{
			if( cb ) cb();
			
			// Activate it
			this.setCurrentFile( a, function(){ self.refreshFilesList(); } );
			return;
		}
	}
	
	// Set it, it is a new file
	this.files[ path ] = { content: data, filename: path, touched: true };
	this.setCurrentFile( path, function()
	{
		// Refresh so we can see it in the list
		self.refreshFilesList();
		if( cb ) cb();
	} );
	
	
}

// Say we wanna open
Application.open = function()
{
	this.sendMessage( { command: 'open' } );
}

// Say we wanna save
Application.save = function( mode, specificFile )
{
	var self = this;
	
	if( !specificFile )
		specificFile = this.currentFile;
	
	if( !mode ) mode = 'normal';
	
	// Do an autosave
	if( mode == 'autosave' )
	{
		// It was somehow closed
		if( !this.files[ specificFile ] )
			return;
			
		var f = new File( this.files[ specificFile ].filename );
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
		
		var tabs = ge( 'EditorTabs' ).getElementsByClassName( 'Tab' );
		
		// Update tab
		for( var a = 0; a < tabs.length; a++ )
		{
			if( tabs[a].uniqueId == this.files[ specificFile ].uniqueId )
			{
				var fn = this.files[ this.currentFile ].filename;
				if( fn.indexOf( ':' ) > 0 )
				{
					fn = fn.split( ':' )[1];
					if( fn.indexOf( '/' ) > 0 )
					{
						fn = fn.split( '/' ).pop();
					}
				}
				tabs[a].innerHTML = fn;
				break;
			}
		}
	}
	else
	{
		loading++; 
		loadProgress();
		// Bump!
		this.sendMessage( { command: 'save', mode: mode } );
	}
}

// Add a new file
Application.newFile = function()
{
	var self = this;
	if( !this.files ) this.files = {};
	var newFile;
	var i = 0;
	do
	{
		newFile = i18n( 'i18n_empty_file' );
		if( i > 0 )
			newFile += ' ' + i;
		i++;
	}
	while( typeof( this.files[ newFile ] ) != 'undefined' );
	this.files[ newFile ] = { content: '', filename: newFile, touched: false };
	
	this.setCurrentFile( newFile, function()
	{
		self.refreshFilesList();

		// Sync the new list to parent level
		self.sendMessage( {
			command: 'receivefilesync',
			files: self.files
		} );
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
	
	// Check files for unique ids
	for( var a in this.files )
	{
		if( !this.files[a].uniqueId )
		{
			this.files[a].uniqueId = md5( this.files[a].filename + ( Math.random() % 9999 ) + ( Math.random() % 9999 ) + ( Math.random() % 9999 ) );
		}
	}
	
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
	
	// Loop through the files
	var sw = 2;
	var tabs = ge( 'EditorTabs' ).getElementsByClassName( 'Tab' );
	var tabContainer = ge( 'EditorTabs' ).getElementsByClassName( 'TabContainer' );
	if( tabContainer.length ) tabContainer = tabContainer[0];
	else tabContainer = false;
	
	for( var t in this.files )
	{
		var c = document.createElement ( 'div' );
		var fullfile = this.files[ t ].filename.split ( '%20' ).join ( ' ' ).split ( ':/' ).join ( ':' );
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
		if( t == this.currentFile ) c.classList.add( 'Selected' );
		c.ind = t;
		c.uniqueId = this.files[t].uniqueId;
		c.onclick = function( e )
		{
			Application.setCurrentFile( this.ind, function()
			{	
				// Close when clicking on close icon
				var tr = e.target ? e.target : e.srcElement;
				if( tr.className.indexOf( 'fa-close' ) > 0 )
				{
					Application.closeFile();
				}
				else
				{
					Application.refreshFilesList();
				}
			} );
			return cancelBubble( e );
		};
		files.appendChild( c );
		
		// Check for missing tab
		if( tabContainer )
		{
			var tabFound = false;
			for( var z = 0; z < tabs.length; z++ )
			{
				if( tabs[z].uniqueId == this.files[t].uniqueId )
				{
					// Found already!
					tabFound = true;
				}
			}
			if( tabFound ) continue;
			
			// Create a new tab
			var tab = document.createElement( 'div' );
			tab.className = 'Tab IconSmall fa-code';
			tab.uniqueId = this.files[t].uniqueId;
			if( this.files[t].filename.indexOf( ':' ) > 0 )
			{
				var lastPart = this.files[t].filename.split( ':' )[1];
				if( lastPart.indexOf( '/' ) > 0 )
				{
					lastPart = lastPart.split( '/' ).pop();
				}
				tab.innerHTML = lastPart;
			}
			else
			{
				tab.innerHTML = this.files[t].filename;
			}
			
			tab.page = ge( 'CodeTabPage' ); // Use this one for all content
			tabContainer.appendChild( tab );
			
			// Find tabs anew
			tabs = ge( 'EditorTabs' ).getElementsByClassName( 'Tab' );
		}
	}
	
	// Reinitialize tabs with proper callback
	InitTabs( ge( 'EditorTabs' ), function( self, pages )
	{	
		// Also do the files list!
		for( var a in files.childNodes )
		{
			if( files.childNodes[a].uniqueId == self.uniqueId )
			{
				files.childNodes[a].click();
				break;
			}
		}
		
		// Set class on own page
		self.page.classList.add( 'PageActive' );
		
		// Abort tab system setting the page
		return false;
	} );
	
	// Activate new file if this is the current file
	for( var a = 0; a < tabs.length; a++ )
	{
		var tab = tabs[ a ];
		if( tab.uniqueId == this.files[ this.currentFile ].uniqueId )
		{
			if( !tab.classList.contains( 'TabActive' ) )
			{
				tab.click();
			}
		}
	}
	
	// We need to activate!
	var tabActive = ge( 'EditorTabs' ).querySelector( '.TabActive' );
	if( tabActive ) tabActive.page.classList.add( 'PageActive' );
	
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
// NB: Looks like we never use mode, perhaps remove!
Application.setCurrentFile = function( curr, ocallback, mode )
{
	var self = this;
	if( !mode ) mode = false;
	
	// Don't do it double
	if( curr == this.currentFile )
	{
		if( ocallback ) ocallback( false );
		return;
	}
	
	// Race condition prevention
	if( self.settingCurrentFile )
	{
		if( ocallback ) ocallback( false );
		return;
	}
	
	self.settingCurrentFile = true;
	
	// Reset when done
	var callback = ocallback ? 
		function(){ ocallback(); self.settingCurrentFile = false; } : 
		function(){ self.settingCurrentFile = false; };
	
	var sess = this.editor.getSession();

	// Make sure we copy the right content before we change curr!
	if( sess && this.files && this.files[ this.currentFile ] )
	{
		this.files[ this.currentFile ].content = this.editor.getValue();
		this.files[ this.currentFile ].session = this.getStorableSession( sess );
	}
	
	// Store current scroll top and values etc
	if( sess && curr && this.files[ this.currentFile ] )
	{
		var f = this.files[ this.currentFile ];
		if( curr != this.currentFile )
		{
			f.content = Application.editor.getValue();
		}
	}

	// Set new current file
	if( curr )
	{
		this.currentFile = curr;
	}
	
	if( !mode )
	{	
		var tabs = ge( 'EditorTabs' ).getElementsByClassName( 'Tab' );
		var foundTab = false;
		
		// Update currentfile
		for( var a = 0; a < tabs.length; a++ )
		{
			if( tabs[ a ].uniqueId == this.files[ this.currentFile ].uniqueId )
			{
				if( !tabs[ a ].classList.contains( 'TabActive' ) )
				{
					tabs[ a ].onclick();
				}
				tabs[ a ].innerHTML = popFilename( this.files[ this.currentFile ].filename );
				break;
			}
		}
	}

	// Manage undo
	if( this.currentFile )
	{
		if( this.files[ this.currentFile ].session )
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
	}
	
	// Clear the selection in the editor
	this.editor.clearSelection();
	
	// Show stuff to user
	this.updateStatusbar();

	// Check if the file is registered in the project. Then run callback (async)
	FileInProjectCheck( this.currentFile, callback );

	// Enable word wrapping
	this.refreshAceSettings();
	
	// Syntax highlighting
	this.applySyntaxHighlighting();
	
	// No callback? Make sure you unlock!
	if( !ocallback )
	{
		self.settingCurrentFile = false;
	}
};

function popFilename( path )
{
	var fn = path;
	if( fn.indexOf( ':' ) > 0 )
	{
		fn = fn.split( ':' )[1];
		if( fn.indexOf( '/' ) > 0 )
		{
			fn = fn.split( '/' ).pop();
		}
	}
	return fn;
}

// Check if file is to be added to project
function FileInProjectCheck( currentFile, callback )
{
	var app = Application;
	
	// Check if this file is part of your project
	if( !app.files[ currentFile ] )
	{
		Notify( { title: 'File check failed', text: 'Current file doesn\'t exist in files list.' } );
		// Run callback
		if( callback )
			callback();
		return false;
	}
	if( !app.projectFilename )
	{
		// Run callback
		if( callback )
			callback();
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
			// Run callback
			if( callback )
				callback();
		} )
	} );
	
	return true;
}

// Close a file
Application.closeFile = function()
{
	// Remember current file
	var currId = this.files[ this.currentFile ].uniqueId;
	
	var newFiles = {};
	var fcount = 0;
	var pick = this.currentFile;
	for ( var a in this.files )
	{
		if( a != pick )
		{
			newFiles[ a ] = {
				content: this.files[a].content,
				filename: this.files[a].filename,
				touched: this.files[a].touched,
				uniqueId: this.files[a].uniqueId
			};
			fcount++;
			this.currentFile = a;
	    }
	}

	// Initial state
	if( !fcount )
	{
		this.currentFile = false;
		this.files = {};
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
		
		// We need at least one file
		this.newFile();
	}
	// Close existing file and rebuild files list
	else
	{
		this.files = newFiles;
		this.editor.setValue( this.files[this.currentFile].content );
		this.setCurrentFile( this.currentFile );
	}
	
	// Remove the previous current file
	var tabs = ge( 'EditorTabs' ).getElementsByClassName( 'Tab' );
	for( var a = 0; a < tabs.length; a++ )
	{
		if( tabs[a].uniqueId == currId )
		{
			tabs[a].parentNode.removeChild( tabs[a] );
		}
	}
	
	this.refreshFilesList();
}

Application.closeAllFiles = function()
{
	this.files = [];
	
	// Flush the tabs
	var tabs = ge( 'EditorTabs' ).getElementsByClassName( 'Tab' );
	var removes = [];
	for( var a = 0; a < tabs.length; a++ )
	{
		removes.push( tabs[a] );
	}
	for( var a = 0; a < removes.length; a++ )
	{
		removes[ a ].parentNode.removeChild( removes[a] );
	}
	delete removes;
	
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
			if( !ele.classList.contains( 'Open' ) && ele.ondblclick )
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
						title: i18n( 'i18n_files_in' ) + ' ' + msg.data.ProjectName
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
				var path = msg.filenum;
				if( parseInt( msg.filenum ) === 0 || parseInt( msg.filenum ) > 0 )
				{
					for( var a in Application.files )
					{
						if( msg.filenum == a )
						{
							path = a;
							break;
						}
					}
				}
				this.setCurrentFile( path );
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
				
				// Rename based on changes on currentfile
				var out = {};
				for( var a in this.files )
				{
					if( a == msg.currentFile )
					{
						if( a != msg.files[ a ].filename )
						{
							out[ msg.files[ a ].filename ] = msg.files[ a ];
							msg.currentFile = msg.files[ a ].filename;
						}
						else
						{
							out[ a ] = this.files[ a ];
						}
					}
					else
					{
						out[ a ] = this.files[ a ];
					}
				}
				this.files = out;
				// Done updating files list
				
				this.currentFile = msg.currentFile;
				
				// Fix all filesnames in tabs
				var tabs = ge( 'EditorTabs' ).getElementsByClassName( 'Tab' );
				for( var a = 0; a < tabs.length; a++ )
				{
					if( this.files[ this.currentFile ].uniqueId == tabs[ a ].uniqueId )
					{
						tabs[ a ].innerHTML = popFilename( this.files[ this.currentFile ].filename );
						break;
					}
				}
				
				var meg = { command: 'filesyncnotification' };
				if( msg.callback ) meg.callback = msg.callback;
				this.sendMessage( meg );
				this.setCurrentFile( this.currentFile );
				this.refreshFilesList();
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
						}, 250 );
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
			case 'donesaving':
				loading--; 
				// Give it time 
				setTimeout( function()
				{
					loadProgress();
				}, 250 );
				break;
		}
	}
};

// TODO: Add more stuff here
document.oncontextmenu = function( e )
{
	cancelBubble( e );
}


