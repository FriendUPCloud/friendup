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

Application.run = function( msg )
{
	// Make sure we can run ace
	function delayedSetupAce()
	{
		if( typeof( ace ) != 'undefined' && ace )
		{
			Application.setupAce();
		}
		else
		{
			// Ace isn't loaded yet. Try again.
			return setTimeout( delayedSetupAce, 100 );
		}
	}
	delayedSetupAce();
};

Application.setupAce = function()
{
	var area = document.createElement( 'div' );
	ge( 'editordiv' ).appendChild( area );
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

	// Setup editor
	area.id = 'EditorArea';
	area.style.position = 'absolute';
	area.style.top = '0';
	area.style.left = '0';
	area.style.right = '0';
	area.style.bottom = '0';

	// Setup theme
	ace.config.set ( 'basePath', 'apps/Artisan/Libraries/Ace' );
	var editor = ace.edit ( 'EditorArea' );
	editor.setTheme ( 'ace/theme/twilight' );
	editor.getSession ().setMode ( 'ace/mode/javascript' );
	Application.editor = editor;

	// Set base font
	var s = document.createElement ( 'style' );
	s.innerHTML += 'html .ace_editor { font-size: 15px; }';
	document.body.appendChild ( s );

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
	editor.commands.addCommand( {
		name: "unfind",
		bindKey: {
		    win: "Ctrl-F",
		    mac: "Command-F"
		},
		exec: function(editor, line) {
		    return false;
		},
		readOnly: true
	} );

	// Focus
	editor.focus ();

	// Make a new file
	this.newFile ();
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
			Application.save(); 
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
		else if( wo == 70 )
		{
		    Application.sendMessage( {
		        command: 'search_replace'
		    } );
		    return true;
		}
	}
	
	// Make sure current file is touched
	if ( 
		Application.files[Application.currentFile] && Application.files[Application.currentFile].touched != true && 
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
	if( !cf.filetype || cf.filetype && cf.filetype == 'Empty file' && cf.filename )
	{
		var ext = cf.filename.split( '.' );
		cf.filetype = ext[ext.length-1];
	}
	var mode = '';
	var extension = this.files[this.currentFile].filetype;
	switch ( extension.toLowerCase() )
	{
		case 'php':  mode = 'ace/mode/php';          break;
		case 'pl':   mode = 'ace/mode/perl';         break;
		case 'sql':  mode = 'ace/mode/sql';          break;
		case 'sh':   mode = 'ace/mode/batchfile';    break;
		case 'as':   mode = 'ace/mode/actionscript'; break;
		case 'css':  mode = 'ace/mode/css';          break;
		case 'txt':  mode = 'ace/mode/plain_text';   break;
		case 'jsx':
		case 'json':
		case 'js':   mode = 'ace/mode/javascript';   break;
		case 'tpl':
		case 'ptpl':
		case 'xml':
		case 'html': mode = 'ace/mode/html';         break;
		case 'xml':  mode = 'ace/mode/xml';          break;
		case 'c':
		case 'h':
		case 'cpp':  mode = 'ace/mode/c_cpp';        break;
		case 'd':    mode = 'ace/mode/d';            break;
		case 'ini':  mode = 'ace/mode/ini';          break;
		case 'java': mode = 'ace/mode/java';         break;
		case 'run':
			extension = 'c';
			mode = 'ace/mode/c_cpp';
			break;
		default:     
			extension = 'txt';
			mode = 'ace/mode/plain_text';
			break;
	}
	this.editor.getSession ().setMode( mode );
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

Application.checkExtraFunctionality = function( ext )
{
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

Application.stopJSX = function()
{
	var fname = this.files[this.currentFile].filename.split( ':' )[1];
	if( fname.indexOf( '/' ) >= 0 )
	{
		fname = fname.split( '/' ); fname = fname[fname.length-1] 
	}
	this.sendMessage( { type: 'system', command: 'kill', appName: fname } );
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

// Loads a file
Application.loadFile = function( data, path )
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
				return;
		}
		// Set it
		this.files.push( { content: data, filename: path, touched: true } );
		this.setCurrentFile( this.files.length - 1 );
	}
	// Refresh so we can see it in the list
	this.refreshFilesList();
}

// Say we wanna open
Application.open = function()
{
	this.sendMessage( { command: 'open' } );
}

// Say we wanna save
Application.save = function()
{
	this.sendMessage( { command: 'save' } );
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
	var d = document.getElementsByTagName ( 'div' );
	var files = false;
	for ( var a = 0; a < d.length; a++ )
	{
		if ( d[a].className.indexOf ( ' Files' ) > 0 )
		{
			files = d[a];
			break;
		}
	}
	if ( !files ) return;
	
	files.innerHTML = '';
	
	for ( var t = 0; t < this.files.length; t++ )
	{
		var c = document.createElement ( 'div' );
		var fullfile = this.files[t].filename.split ( '%20' ).join ( ' ' ).split ( ':/' ).join ( ':' );
		var onlyfile = fullfile.split ( ':' )[1];
		if ( onlyfile && onlyfile.indexOf ( '/' ) >= 0 )
		{
			onlyfile = onlyfile.split ( '/' );
			if ( onlyfile[onlyfile.length-1] === '' )
				onlyfile = onlyfile[onlyfile.length-2];
			else onlyfile = onlyfile[onlyfile.length-1];
			c.innerHTML = '<span>' + onlyfile + '</span>&nbsp;|&nbsp;<span title="' + fullfile + '">' + fullfile + '</span><div class="Icon IconSmall fa-close"></div>';
		}
		else c.innerHTML = '<span>' + fullfile + '</span><div class="Icon IconSmall fa-close"></div>';
		c.style.whiteSpace = 'nowrap';
		c.style.textOverflow = 'ellipsis';
		c.style.overflow = 'hidden';
		c.className = 'Padding';
		if ( t == this.currentFile ) c.className += ' Selected';
		c.ind = t;
		c.onclick = function ( e )
		{
			Application.setCurrentFile ( this.ind );
			Application.refreshFilesList ();
			
			// Close when clicking on close icon
			var t = e.target ? e.target : e.srcElement;
			if( t.className.indexOf( 'fa-close' ) > 0 )
			{
				Application.closeFile();
			}
		};
		files.appendChild ( c );
	}
	
	// Sync files up
	Application.receiveMessage( { command: 'syncfiles' } );
};

// Check if we support the filetype --------------------------------------------
Application.checkFileType = function( path )
{
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
		case 'json':
		case 'tpl':
		case 'ptpl':
		case 'xml':
		case 'html':
		case 'c':
		case 'h':
		case 'cpp':
		case 'd':
		case 'ini':
		case 'jsx':
		case 'java':
		case 'css':
		case 'run':
			return true;
		default:
			return false;
	}
}

Application.getStorableSession = function( session )
{
	var filterHistory = function( deltas )
	{ 
		return deltas.filter( function( d )
		{
		    return d.group != "fold";
		} );
	};
	return {
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
}

Application.setStoredSession = function( data )
{
	var session = ace.require( 'ace/ace' ).createEditSession( data.value );
	session.$undoManager.$doc = session; // NOTICE: workaround for a bug in ace
	session.setOptions( data.options );
	session.$undoManager.$undoStack = data.history.undo;
	session.$undoManager.$redoStack = data.history.redo;
	session.selection.fromJSON( data.selection );
	session.setScrollTop( data.scrollTop );
	session.setScrollLeft( data.scrollLeft );
	this.editor.setSession( session );
}

// Set the content from current file -------------------------------------------
Application.setCurrentFile = function( curr )
{
	var sess = this.editor.getSession ();
	
	// Make sure we copy the right content before we change curr!
	if( sess && this.files && this.files[this.currentFile] )
	{
		this.files[this.currentFile].content = this.editor.getValue();
		this.files[this.currentFile].session = this.getStorableSession( sess );
	}
	
	// Make sure we have files
	if ( !this.files || !this.files[this.currentFile] )
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
	if( sess && ( curr || curr === 0 ) && this.files[this.currentFile] )
	{
		var f = this.files[this.currentFile];
		if ( curr != this.currentFile ) f.content = Application.editor.getValue ();
	}
	
	// Set current file
	if( curr || curr === 0 )
	{
		this.currentFile = curr;
	}
	
	// Manage undo
	if( this.files[this.currentFile].session )
	{
		Application.setStoredSession( this.files[this.currentFile].session );
	}
	else
	{
		// New one
		var session = ace.require( 'ace/ace' ).createEditSession( this.files[this.currentFile].content );
		this.editor.setSession( session );
	}
	
	this.updateStatusbar();
	
	this.editor.clearSelection();
	
	// Enable word wrapping
	var sess = this.editor.getSession();
	var ww = isMobile ? 30 : 80;
	sess.setWrapLimitRange( ww, ww );
	sess.setUseWrapMode( true );
	sess.setUseSoftTabs( false );
	
	// Notify artisan.js
	function callbackF()
	{ 
		Application.applySyntaxHighlighting();
	}
	var cid = addCallback( callbackF );
	
	this.receiveMessage( { 
		command: 'syncfiles', 
		callback: cid
	} );
};

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
			this.currentFile = newFiles.length-1;
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
			if ( d[c].className.indexOf ( ' Files' ) > 0 )
			{
				files = d[c];
				break;
			}
		}
		if ( !files ) 
		{
			return;
		}
		this.editor.setValue ( '' );
		this.editor.clearSelection ();
		this.editor.getSession().setScrollTop ( 0 );
		this.newFile();
	}
	// Close existing file and rebuild files list
	else
	{
		this.files = newFiles;
		this.editor.setValue( this.files[this.currentFile].content );
		this.setCurrentFile( this.currentFile );
	}
	this.refreshFilesList();
}

// TODO: Consolidate all "applySyntaxHighlighting in a centralized way!
Application.receiveMessage = function( msg )
{
	if( msg.command )
	{
		switch( msg.command )
		{
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
					this.editor.replaceAll( msg.replacement );
				else this.editor.replace( msg.replacement );
				break;
			// Get project info
			case 'projectinfo':
				// Copy project information
				this.project = {};
				for( var a in msg.data ) this.project[a] = msg.data[a];
				this.projectFilename = msg.filename;
				if( msg.data.ProjectName )
				{
					ge( 'Filelist' ).innerHTML = 'Files in ' + msg.data.ProjectName + ':';
				}
				else ge( 'Filelist' ).innerHTML = 'Files:';
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
			// Asked to sync files up to artisan.js
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
				this.applySyntaxHighlighting();
				break;
			// Just passes current editor content
			case 'getcurrentcontent':
				this.sendMessage( {
					command:  'receivecontent',
					data:     Application.editor.getSession().getValue(),
					callback: msg.callback
				} );
				break;
			case 'loadfile':
				Application.loadFile( msg.data, msg.path );
				break;
			case 'drop':
				var paths = [];
				var project = false;
				for( var a = 0; a < msg.data.length; a++ )
				{
					// Filter
					var path = msg.data[a].Path;
					if( this.checkFileType( path ) )
						paths.push( path );
					else if( path.substr( path.length - 1 - 4, 4 ).toLowerCase() == '.apf' )
						project = path;
					
				}
				if( paths.length )
				{
					this.sendMessage( {
						command: 'loadfiles',
						paths: paths
					} );
					return;
				}
				if( project )
				{
					// TODO:
					// Load project
				}
				break;
			case 'updateStatus':
				ge( 'status' ).innerHTML = msg.data ? msg.data : '';
				break;
		}
	}
};

