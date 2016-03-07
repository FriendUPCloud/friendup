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

document.title = 'Artisan v1.0';
Application.run = function( msg )
{
	// Some variables
	this.files = false;
	this.currentFile = 0;
	this.currentPath = 'Mountlist:';
	this.statusBar = false;
	var appl = this;
	
	// Open application window
	var w = new View( {
		'title'  : 'Artisan',
		'width'  : 800,
		'height' : 480,
		'min-width' : 800,
		'min-height' : 300,
		'loadinganimation' : true
	} );
	this.masterView = w;
	
	w.onClose = function()
	{
		// Quit when closing the main window
		Application.quit();
	}
	
	// Add dormant door
	this.addAppDoor();
	
	// Initialize
	var f = new File( 'Progdir:Templates/editor.html' );
	f.onLoad = function ( d )
	{
		w.setContent ( d, function()
		{
			w.sendMessage( { command: 'doing' } );
			if( msg.args )
			{
				w.sendMessage( { command: 'drop', data: [ { Path: msg.args } ] } );
			}
		} );
	};
	f.load ();
		
	// Set up the menu
	this.setMenuItems( w );
};

Application.insertInEditor = function( data )
{
	this.masterView.sendMessage( {
		command: 'insert',
		data: data
	} );
}

// Setup keyboard shortcut handler
Application.handleKeys = function ( kc, event )
{
	if ( event.ctrlKey )
	{
		// o
		if ( kc == 79 )
		{
			Application.open(); return true;
		}
		// s
		else if ( kc == 83 )
		{
			Application.save(); return true;
		}
		// n (doesn't work, find a different key)
		else if ( kc == 78 )
		{
			Application.newFile(); return true;
		}
		// n (doesn't work, find a different key)
		else if ( kc == 81 )
		{
			Application.quit(); return true;
		}
		// CTRL + I
		else if( wo == 73 )
		{
			Application.closeFile();
		}
		// CTRL + F
		else if( wo == 70 )
		{
		    searchRepl(); return true;
		}
	}
	return false;
};

// Open a file
Application.open = function()
{
	if( this.dlg ) return;
	
	// Make a new file dialog, blocking the current window
	var dlg = new Filedialog( this.masterView, function ( array ) 
	{	
		if ( array.length )
		{
			for ( var a = 0; a < array.length; a++ )
			{
				Application.loadFile ( array[a] );
			}
			
			// Interactively update path
			// TODO: Get directory from path function
			Application.currentPath = array[0].Path ? array[0].Path : array[0].Title;
			Application.currentPath = Application.currentPath.split( '/' );
			Application.currentPath.pop();
			Application.currentPath = Application.currentPath.join( '/' );
		}
		Application.dlg = false;
	}, Application.currentPath );
	this.dlg = dlg;
};

// Load a file
Application.loadFile = function( file )
{
	// We load only one at a time
	if( !this.loadQueue )
	{
		this.isLoading = false;
		this.loadQueue = [];
	}
	
	if( this.isLoading )
	{
		this.loadQueue.push( file );
		return;
	}
	this.isLoading = true;
	
	var p = file.Path ? file.Path : file.Title;
	
	// Update status with text..
	this.masterView.sendMessage( {
		command: 'updateStatus',
		data: i18n( 'i18n_loading_file' )
	} );
	
	var f = new File( p );
	f.onLoad = function( data )
	{	
		// Post it
		Application.masterView.sendMessage( {
			command: 'loadfile',
			data: data,
			path: p
		} );
		
		Application.isLoading = false;
		
		// Load first from queue
		if( Application.loadQueue.length )
		{
			var q = [];
			var qf = Application.loadQueue[0];
			for( var a = 1; a < Application.loadQueue.length; a++ )
			{
				q.push( Application.loadQueue[a] );
			}
			Application.loadQueue = q;
			Application.loadFile( qf );
		}
		
		// Update status with text..
		Application.masterView.sendMessage( {
			command: 'updateStatus',
			data: ''
		} );
		
	};
	f.load();
};

// close the current open file
Application.closeFile = function()
{
	Application.masterView.sendMessage( { command: 'closefile' } );
};

Application.setPathFromFilename = function( path )
{
	if( path.indexOf( '/' ) > 0 )
	{
		path = path.split( '/' );
		path[path.length-1] = '';
		path = path.join( '/' );
	}
	else
	{
		path = path.split( ':' )[0] + ':';
	}
	Application.currentPath = path;
}

// Save a file
Application.save = function( mode )
{
	if( this.savedlg ) return;
	
	// Do a save operation
	this.syncFilesList( function()
	{
		var f = Application.files[Application.currentFile];
		
		var p = f ? ( f.filename ? f.filename.indexOf ( ':' ) : 0 ) : 0;
		
		// Save as makes a new filename
		if( mode == 'saveAs' ) p = '';
		
		// We have a filename
		if( p < ( f ? f.filename.length : 0 ) && p > 0 )
		{
			Application.getCurrentContent( function( data ){ Application.saveFile( f.filename, data ); } );
		}
		// We need to choose where to save
		else
		{
			var sf = '';
			
			if( f && f.filename )
			{
				// Update currentpath
				if( ( f.filename + "" ).indexOf( ':' ) > 0 )
					Application.setPathFromFilename( f.filename );
				
				var fname = f.filename + "";
				if( fname.indexOf( ':' ) > 0 )
				{
					fname = fname.split( ':' )[1];
					if( fname.indexOf( '/' ) > 0 )
					{
						fname = fname.split( '/' );
						fname = fname[fname.length-1];
					}
				}
				
				sf = { 
					filename: fname,
					path: Application.currentPath,
					touched: false
				};
			}
		
			// Make a new file dialog, blocking the current window
			var dlg = new Filedialog( Application.masterView, function ( path ) 
			{	
				if( path && path.length )
				{
					// TODO: Find out about why this happens
					if( typeof( path ) == 'object' )
						return false;
				
					f.filename = path;
		
					// Interactively update path
					// TODO: Replace code with get directory from path
					Application.currentPath = path;
					if( Application.currentPath.indexOf ( '/' ) > 0 )
					{
						Application.currentPath = Application.currentPath.split ( '/' );
						Application.currentPath.pop ();
						Application.currentPath = Application.currentPath.join ( '/' );
					}
					// Get current content and save file
					Application.getCurrentContent( function( data ){ 
						Application.saveFile ( f.filename, data );
					} );
				}
				else
				{
					// Sync files list
					if( f && f.filename_backup )
					{
						f.filename = f.filename_backup;
						f.filename_backup = false;
					}
					Application.syncFilesList();
				}
				Application.savedlg = false;
			}, sf, 'save' );
			Application.savedlg = dlg;
		}
	} );
};

// Ask editor for content
Application.getCurrentContent = function( callback )
{
	this.masterView.sendMessage( { command: 'getcurrentcontent', callback: addCallback( callback ) } );
}

// Save as a new file
// TODO: Handle cancel!
Application.saveAs = function()
{
	// Sync the current status down
	Application.syncFilesListDown( function()
	{
		Application.save( 'saveAs' );
	} );
};

// Do the actual saving of the file
Application.saveFile = function( filename, content )
{
	var p = Application.currentPath;
	if ( p.substr( p.length-1, 1 ) != ':' && p.substr( p.length-1, 1 ) != '/' )
	{
		p += '/';
	}
	
	// Update status with text..
	this.masterView.sendMessage( {
		command: 'updateStatus',
		data: i18n( 'i18n_saving_file' )
	} );
	
	var f = new File( Application.currentPath + filename );
	f.onSave = function ()
	{
		// Tell something went wrong!
		// TODO: Replace alert with our own
		if ( this.written <= 0 )
			alert ( 'Could not save!' );
		
		Application.files[Application.currentFile].content = content;
		Application.files[Application.currentFile].filename = filename;
		Application.files[Application.currentFile].filetype = Application.files[Application.currentFile].filename.split ( '.' ).pop ().toLowerCase ();
		Application.files[Application.currentFile].touched = true;
		
		// Sync the new files down
		Application.syncFilesListDown();
		
		// Update status with text..
		Application.masterView.sendMessage( {
			command: 'updateStatus',
			data: ''
		} );
	};
	f.save( filename, ( content.length === 0 ? ' ' : content ) );
};

// About dialog ----------------------------------------------------------------
Application.about = function()
{
	var v = new View( { id: 'aboutcodeeditor', width: 320, height: 174, title: 'About Artisan' } );
	this.aboutWindow = v;
	v.setFlag ( 'resize', false );
	
	var tm = new File( 'Progdir:Templates/about.html' );
	tm.onLoad = function( d )
	{
		if( d )
		{
			v.setContent( d );
		}
	}
	tm.load();
};

// Syncs local copy down
Application.syncFilesListDown = function( callback )
{
	var meg = {
		command: 'receivefilesync',
		files: this.files,
		currentFile: this.currentFile
	};
	if( callback )
	{
		meg.callback = addCallback( callback );
	}
	this.masterView.sendMessage( meg );
};

// Contacts the editor level and syncronizes the files list --------------------
Application.syncFilesList = function( callback )
{
	var msg = { command: 'syncfiles' };
	if( callback )
	{
		msg.callback = addCallback( callback );
	}
	this.masterView.sendMessage( msg );
};

// Receive a message! ----------------------------------------------------------
Application.receiveMessage = function( msg )
{
	switch( msg.command )
	{
		case 'about':
			this.about();
			break;
		case 'newfile':
			this.masterView.sendMessage( {
				command: 'newfile'
			} );
			break;
		case 'open':
			Application.open();
			break;
		case 'save':
		case 'save_file':
			Application.save();
			break;
		case 'close':
			Application.closeFile();
			break;
		case 'save_as':
			Application.saveAs();
			break;
		case 'quit':
			Application.quit();
			break;
		// receives a files list
		case 'receivefilesync':
			this.files = msg.files;
			if( msg.currentFile >= 0 )
				this.currentFile = msg.currentFile;
			break;
		// receive content with callback
		case 'receivecontent':
			var f = extractCallback( msg.callback );
			if( f ) f( msg.data );
			break;
		case 'filesyncnotification':
			var f = extractCallback( msg.callback );
			if( f ) f( msg.data );
			break;
		case 'loadfiles':
			for( var a in msg.paths )
			{
				Application.loadFile( { Path: msg.paths[a] } );
			}
			break;
		case 'iotmonitor':
			iotMonitor();
			break;
		case 'search_replace':
			searchRepl();
			break;
		// Just pass it on
		case 'search':
			this.masterView.sendMessage( msg );
			break;
		case 'replace':
			this.masterView.sendMessage( msg );
			break;
		// Internal message
		case 'presskey':
			pollEvent( 'PressKey', msg.keycode );
			break;
		case 'preferences':
			this.showPrefs();
			break;
	}
};

Application.showPrefs = function()
{
	if( this.pwin ) return;
	
	this.pwin = new View( {
		title: 'Preferences',
		width: 800,
		height: 500,
		id: 'artisanprefswin'
	} );
	
	this.pwin.onClose = function()
	{
		Application.pwin = false;
	}
	
	var f = new File( 'Progdir:Templates/prefs.html' );
	f.onLoad = function( data )
	{
		Application.pwin.setContent( data );
	}
	f.load();
};

// Set menu items on window
Application.setMenuItems = function( w )
{
	// Populate application menu
	w.setMenuItems( [
	{
		name  : i18n( 'i18n_file' ),
		items : [
			{
				name    : i18n( 'i18n_about_codeeditor' ),
				command : 'about'
			},
			{
				name    : i18n( 'i18n_new' ),
				command : 'newfile'
			},
			{
				name    : i18n( 'i18n_open' ),
				command : 'open'
			},
			{
				name    : i18n( 'i18n_save' ),
				command : 'save'
			},
			{
				name    : i18n ( 'i18n_save_as' ),
				command : 'save_as'
			},
			{
				name    : i18n( 'i18n_close' ),
				command : 'close'
			},
			{
				name    : i18n( 'i18n_quit' ),
				command : 'quit'
			}
		]
	},
	{
		name  : i18n( 'i18n_project' ),
		items : [
			{
				name:    i18n( 'i18n_load_project' ),
				command: 'load_project'
			},
			{
				name:    i18n( 'i18n_save_project' ),
				command: 'save_project'
			},
			{
				name:    i18n( 'i18n_save_project_as' ),
				command: 'save_project_as'
			}
		]
	},
	{
		name : i18n( 'i18n_macros' ),
		items : [
			{
				name:    i18n( 'i18n_record_macro' ),
				command: 'macro_record'
			},
			{
				name:    i18n( 'i18n_stop_macro' ),
				command: 'macro_stop'
			}
		]
	},
	{
		name  : i18n( 'i18n_view' ),
		items : [
			{
				name    : i18n( 'i18n_no_side_bar' ),
				command : function(){ Application.hideSidebar(); }
			},
			{
				name    : i18n( 'i18n_app_preview' ),
				command : function(){ Application.appPreview(); }
			},
			{
				name    : i18n( 'i18n_rtw_preview' ),
				command : function(){ Application.rtwPreview(); }
			},
			{
				name    : i18n( 'i18n_iot_monitor' ),
				command : 'iotmonitor'
			},
			{
				name    : i18n( 'i18n_mindmap' ),
				command : function(){ Application.mindmap(); }
			}
		]
	},
	{
		name  : i18n( 'i18n_edit' ),
		items : [
			{
				name    : i18n( 'i18n_copy' ),
				command : function(){ Clipboard.copy(); }
			},
			{
				name    : i18n( 'i18n_cut' ),
				command : function(){ Clipboard.cut(); }
			},
			{
				name    : i18n( 'i18n_paste' ),
				command : function(){ Clipboard.paste(); }
			},
			{
				name    : i18n( 'i18n_search_replace' ),
				command : 'search_replace'
			}
		]
	},
	{
		name  : i18n( 'i18n_preferences' ),
		items : [
			{
				name    : i18n ( 'i18n_application_settings' ),
				command : 'preferences'
			}/*,
			{
				name    : i18n( 'i18n_save_settings' ),
				command : function(){}
			},
			{
				name    : i18n( 'i18n_load_settings' ),
				command : function(){}
			},
			{
				name    : i18n( 'i18n_reset_settings' ),
				command : function(){}
			}*/
		]
	}
	] );
};

// Add the app door
Application.addAppDoor = function()
{
	// Add dormant door
	DormantMaster.addAppDoor( {
		title: 'Artisan',
		windows: [],
		refresh: function( winObj )
		{
			winObj.innerHTML = ':)';
		},
		execute: function( func, args, callback )
		{	
			var avs = function( o ){ Application.masterView.sendMessage( o ); };
			switch( func )
			{
				case 'FileNew':     avs( { command: 'newfile' } );
					pollEvent( 'FileNew', null );
					break;
				case 'FileClose':   
					avs( { command: 'closefile' } );
					pollEvent( 'FileClose', null );
					break;
				case 'FileLoad':    
					if( args )
					{ 
						Application.loadFile( args[0] );
						pollEvent( 'FileLoad', args[0] );
					}
					break;
				case 'FileSave':    
					// TODO: This might not work! (must get content from editor.js)
					var ap = Application;
					var f = ap.files[ap.currentFile];
					var p = ap.currentPath + f.filename;
					if( args ) p = args[0];
					Application.saveFile( p, f.content );
					pollEvent( 'FileSave', p );
					break;
				case 'NewLine':
					avs( { command: 'newline' } );
					pollEvent( 'NewLine', null );
					break;
				case 'CursorUp':
					avs( { command: 'movecursor', direction: 'up' } );
					pollEvent( 'CursorUp', null );
					break;
				case 'CursorDown':
					avs( { command: 'movecursor', direction: 'down' } );
					pollEvent( 'CursorDown', null );
					break;
				case 'CursorLeft':
					avs( { command: 'movecursor', direction: 'left' } );
					pollEvent( 'CursorLeft', null );
					break;
				case 'CursorRight':
					avs( { command: 'movecursor', direction: 'right' } );
					pollEvent( 'CursorRight', null );
					break;
				// Inserts key from charcode
				case 'PressKey':
					var hch = null;
					if( args ) kch = String.fromCharCode( args[0] );
					avs( { command: 'insert', data: kch } );
					pollEvent( 'PressKey', args[0] );
					break;
				case 'Insert':      
					if( !args )
					{
						pollEvent( 'Insert', null );
						return;
					}
					var sent = '';
					for( var ax in args )
					{
						sent += args[ax];
						if( ax < args.length - 1 ) sent += ' ';
					}
					avs( { command: 'insert', data: sent } );
					pollEvent( 'Insert', sent );
					break;
				case 'SelectNone':  avs( { command: 'select', what: 'none' } );
					pollEvent( 'SelectNone', null );
					break;
				case 'SelectLine':
					avs( { command: 'select', what: 'line' } );
					pollEvent( 'SelectLine', null );
					break;
				case 'SelectWord':
					avs( { command: 'select', what: 'word' } );
					pollEvent( 'SelectWord', null );
					break;
				case 'SelectAll':
					avs( { command: 'select', what: 'all' } );
					pollEvent( 'SelectAll', null );
					break;
				
				/*case 'WriteNewline':
					Application.insertInEditor( "\n" );
					break;
				case 'WriteAmiga30':
					Application.insertInEditor( "    :::     ::::    ::::  ::::::::::: ::::::::      :::           ::::::::   :::::::  \n\
  :+: :+:   +:+:+: :+:+:+     :+:    :+:    :+:   :+: :+:        :+:    :+: :+:   :+: \n\
 +:+   +:+  +:+ +:+:+ +:+     +:+    +:+         +:+   +:+              +:+ +:+  :+:+ \n\
+#++:++#++: +#+  +:+  +#+     +#+    :#:        +#++:++#++:          +#++:  +#+ + +:+ \n\
+#+     +#+ +#+       +#+     +#+    +#+   +#+# +#+     +#+             +#+ +#+#  +#+ \n\
#+#     #+# #+#       #+#     #+#    #+#    #+# #+#     #+#      #+#    #+# #+#   #+# \n\
###     ### ###       ### ########### ########  ###     ###       ########   #######  \n\
" );
					break;
				case 'WriteFriendUP':
					Application.insertInEditor( "\n\
 ________ .-------.   .-./`)     .-''-.  ,---.   .--. ______       ___    _ .-------.\n\
|        ||  _ _   \\  \\ .-.')  .'_ _   \\ |    \\  |  ||    _ `''. .'   |  | |\\  _(`)_ \\\n\
|   .----'| ( ' )  |  / `-' \\ / ( ` )   '|  ,  \\ |  || _ | ) _  \\|   .'  | || (_ o._)|\n\
|  _|____ |(_ o _) /   `-'`\"`. (_ o _)  ||  |\\_ \\|  ||( ''_'  ) |.'  '_  | ||  (_,_) /\n\
|_( )_   || (_,_).' __ .---. |  (_,_)___||  _( )_\\  || . (_) `. |'   ( \\.-.||   '-.-'\n\
(_ o._)__||  |\\ \\  |  ||   | '  \\   .---.| (_ o _)  ||(_    ._) '' (`. _` /||   |   \n\
|(_,_)    |  | \\ `'   /|   |  \\  `-'    /|  (_,_)\\  ||  (_.\\.' / | (_ (_) _)|   |  \n\
|   |     |  |  \\    / |   |   \\       / |  |    |  ||       .'   \\ /  . \\ //   )  \n\
'---'     ''-'   `'-'  '---'    `'-..-'  '--'    '--''-----'`      ``-'`-'' `---'\n\n" );
					break;
				case 'WriteCongrats':
					Application.insertInEditor( 'C O N G R A T U L A T I O N S   O N   3 0   Y E A R S   O F   F U N !' );
					break;
				case 'WriteSpace':
					Application.insertInEditor( ' ' );
					break;*/
			}
		},
		addWindow: function( win )
		{
			this.windows.push( win );
		},
		getDoor: function()
		{
			return {
				MetaType: 'Meta',
				Title: this.title + ':',
				IconFile: 'apps/Artisan/icon.png',
				Position: 'left',
				Module: 'files',
				Command: 'dormant',
				Filesize: 4096,
				Flags: '',
				Type: 'Dormant',
				Dormant: this
			};
		},
		getFolder: function( path )
		{
			var vname = this.title + ':';
			
			if( path.substr(path.length-1,1) != ':' && path.substr(path.length-1,1) != '/' )
				path += '/';
				
			switch ( path )
			{
				case vname:
					return [
						{
							MetaType: 'Directory',
							Title: 'Functions',
							Icon: 'Directory',
							Path: vname + 'Functions/',
							Position: 'left',
							Module: 'files',
							Command: 'dormant',
							Filesize: 4096,
							Flags: '',
							Type: 'Dormant',
							Dormant: this
						},
						{
							MetaType: 'Directory',
							Title: 'Files',
							Icon: 'Directory',
							Path: vname + 'Files/',
							Position: 'left',
							Module: 'files',
							Command: 'dormant',
							Filesize: 4096,
							Flags: '',
							Type: 'Dormant',
							Dormant: this
						}
					];
				case vname + 'Functions/':
					var funcs = [
						'FileNew', 'FileLoad', 'FileSave', 'FileSaveAs', 'FileClose',
						'CursorUp', 'CursorDown', 'CursorLeft', 'CursorRight',
						'SelectWord', 'SelectLine', 'SelectAll', 'SelectNone',
						'Insert', 'PressKey', 'NewLine'
					];
					var ret = [];
					for( var m = 0; m < funcs.length; m++ )
					{
						ret.push( {
							MetaType: 'Meta',
							Title: funcs[m],
							IconFile: 'gfx/icons/128x128/mimetypes/application-octet-stream.png',
							Path: path,
							Position: 'left',
							Module: 'files',
							Command: 'dormant',
							Filesize: 16,
							Type: 'DormantFunction',
							Dormant: this
						} );
					}
					return ret;
					/*return [
						{
							MetaType: 'Meta',
							Title: 'NewFile',
							IconFile: 'gfx/icons/128x128/mimetypes/application-octet-stream.png',
							Path: path,
							Position: 'left',
							Module: 'files',
							Command: 'dormant',
							Filesize: 16,
							Type: 'DormantFunction',
							Dormant: this
						},
						{
							MetaType: 'Meta',
							Title: 'WriteCongrats',
							IconFile: 'gfx/icons/128x128/mimetypes/application-octet-stream.png',
							Path: path,
							Position: 'left',
							Module: 'files',
							Command: 'dormant',
							Filesize: 16,
							Type: 'DormantFunction',
							Dormant: this
						},
						{
							MetaType: 'Meta',
							Title: 'WriteNewline',
							IconFile: 'gfx/icons/128x128/mimetypes/application-octet-stream.png',
							Path: path,
							Position: 'left',
							Module: 'files',
							Command: 'dormant',
							Filesize: 16,
							Type: 'DormantFunction',
							Dormant: this
						},
						{
							MetaType: 'Meta',
							Title: 'WriteAmiga30',
							IconFile: 'gfx/icons/128x128/mimetypes/application-octet-stream.png',
							Path: path,
							Position: 'left',
							Module: 'files',
							Command: 'dormant',
							Filesize: 16,
							Type: 'DormantFunction',
							Dormant: this
						},
						{
							MetaType: 'Meta',
							Title: 'WriteFriendUP',
							IconFile: 'gfx/icons/128x128/mimetypes/application-octet-stream.png',
							Path: path,
							Position: 'left',
							Module: 'files',
							Command: 'dormant',
							Filesize: 16,
							Type: 'DormantFunction',
							Dormant: this
						},
						{
							MetaType: 'Meta',
							Title: 'WriteSpace',
							IconFile: 'gfx/icons/128x128/mimetypes/application-octet-stream.png',
							Path: path,
							Position: 'left',
							Module: 'files',
							Command: 'dormant',
							Filesize: 16,
							Type: 'DormantFunction',
							Dormant: this
						}
					];*/
				// List open files
				case vname + 'Files/':
					var result = [];
					for ( var t = 0; t < Application.files.length; t++ )
					{
						var fullfile = Application.files[t].filename.split ( '%20' ).join ( ' ' ).split ( ':/' ).join ( ':' );
						var onlyfile = fullfile.split ( ':' )[1];
						if ( onlyfile && onlyfile.indexOf ( '/' ) >= 0 )
						{
							onlyfile = onlyfile.split ( '/' );
							if ( onlyfile[onlyfile.length-1] === '' )
								onlyfile = onlyfile[onlyfile.length-2];
							else onlyfile = onlyfile[onlyfile.length-1];
						}
						onlyfile = typeof( onlyfile ) == 'undefined' ? i18n('i18n_empty_file') : onlyfile;
						// Add file to output
						result.push( {
							MetaType: 'Meta',
							Title: onlyfile,
							IconFile: 'gfx/icons/128x128/mimetypes/application-vnd.oasis.opendocument.text-master.png',
							Path: vname + 'Files/' + onlyfile,
							Position: 'left',
							Module: 'files',
							Command: 'dormant',
							Filesize: 16,
							Type: 'DormantFile',
							Dormant: this
						} );
					}
					return result;
					break;
				default:
					return [];
			}
		}
	} );
};

/* IOT Monitor -------------------------------------------------------------- */

function iotMonitor()
{
	if( Application.monitorView ) return;
	var f = new View( {
		title: 'Artisan - IOT Monitor',
		width: 600,
		height: 600
	} );
	
	var fs = new File( 'Progdir:Templates/iotmonitor.html' );
	fs.onLoad = function( data )
	{
		f.setContent( data );
	}
	fs.load();
	
	Application.monitor = f;
}

/* Search and replace ------------------------------------------------------- */

function searchRepl()
{
	if( Application.searchWin )
		return;
	var v = new View( {
		title: 'Search and replace',
		width: 400,
		height: 150
	} );
	
	Application.searchWin = v;
	
	var f = new File( 'Progdir:Templates/search.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
	
	v.onClose = function()
	{
		Application.searchWin = null;
	}
}

/* Events */

function pollEvent( ev, data )
{
	var msg = {
		applicationName: 'Artisan',
		eventName: ev,
		data: data
	};
	DormantMaster.pollEvent( msg );
}




