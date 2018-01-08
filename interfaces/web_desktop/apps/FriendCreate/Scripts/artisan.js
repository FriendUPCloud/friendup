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

document.title = 'Friend Create v1.0';

settings = {
	wordWrap: true,
	wordWrapWidth: 80,
	codeFolding: true,
	ownScreen: false,
	theme: 'twilight'
};

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
				console.log('unexpected settings');	
			}
			if( o && o.friendcreate )
			{
				for( var a in o.friendcreate ) settings[a] = o.friendcreate[a];
			}
		}
		if( callback ) callback();
	}
	m.execute( 'getsetting', { setting: 'friendcreate' } );
}

Application.run = function( msg )
{
	// Some variables
	this.project = {
		ProjectName: '',
		Author:      '',
		Email:       '',
		Version:     '',
		API:         'v1',
		Description: '',
		Files:       [],
		Permissions: [],
		Libraries:   []
	};
	this.currentPath = 'Mountlist:';
	this.statusBar = false;
	var appl = this;
	this.isLoading = false; // Make sure we only load one file at once
	this.loadQueue = [];
	
	// Open application window
	loadConfig( function()
	{
		var flags = {
			'title'            : 'Friend Create',
			'width'            : 1024,
			'height'           : 720,
			'min-width'        : 800,
			'min-height'       : 300,
			'loadinganimation' : true
		};
		
		/*if( settings.ownScreen )
		{
			flags.screen = new Screen( { title: 'Friend Create' } );
			flags.screen.onclose = function()
			{
				Application.quit();
			}
			flags.maximized = true;
			Application.screen = flags.screen;
		}*/
			
		var w = new View( flags );
		appl.masterView = w;
	
		w.onClose = function()
		{
			// Quit when closing the main window
			Application.quit();
		}
		
		// Add dormant door
		appl.addAppDoor();
	
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
		f.i18n();
		f.load ();
		
		// Set up the menu
		appl.setMenuItems( w );
	} );
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

// Look through registered paths to see if we have a logical one!
Application.getCurrentPath = function()
{
	var dpath = Application.currentPath;
	if( !Application.currentPath || Application.currentPath == 'Mountlist:' )
	{
		if( Application.projectFilename )
		{
			dpath = Application.projectFilename;
			
			// Just use the directory
			if( dpath.indexOf( '/' ) > 0 )
			{
				dpath = dpath.split( '/' );
				dpath.pop();
				dpath = dpath.join( '/' );
			}
			// No sub dir? Use the volume
			else if( dpath.indexOf( ':' ) > 0 )
			{
				dpath = dpath.split( ':' )[0] + ':';
			}
		}
		Application.currentPath = dpath;
	}
	return dpath;
}

// Open a file
Application.open = function()
{
	if( this.dlg ) return;
	
	// Make sure it's up to date!
	this.getCurrentPath();
	
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
	// Don't open unsupported files
	if( !file.Filename && file.Path ) file.Filename = file.Path;
	if( !this.checkFileType( file.Filename ) )
		return false;
		
	// We load only one at a time
	if( this.isLoading )
	{
		this.loadQueue.push( file );
		return;
	}
	this.isLoading = true;
	
	var p = typeof( file ) != 'object' ? file : ( file.Path ? file.Path : file.Title );
	
	// Update status with text..
	this.masterView.sendMessage( {
		command: 'updateStatus',
		data: i18n( 'i18n_loading_file' )
	} );
	
	// Tell that we are loading a file
	this.masterView.sendMessage( {
		command: 'incrementloader',
		data: file
	} );
	
	var f = new File( p );
	f.onLoad = function( data )
	{	
		// Load first from queue
		var qf = false;
		if( Application.loadQueue.length )
		{
			var q = [];
			var qf = Application.loadQueue[0];
			for( var a = 1; a < Application.loadQueue.length; a++ )
			{
				q.push( Application.loadQueue[a] );
			}
			Application.loadQueue = q;
		}
		
		// Update status with text..
		Application.masterView.sendMessage( {
			command: 'updateStatus',
			data: ''
		} );
		
		// Post it
		Application.masterView.sendMessage( {
			command: 'loadfile',
			data: data,
			path: p,
			callbackId: addCallback( function()
			{
				Application.isLoading = false;
				if( qf )
				{
					Application.loadFile( qf );		
				}
			} )
		} );
	};
	f.load();
};

// close the current open file
Application.closeFile = function()
{
	Application.masterView.sendMessage( { command: 'closefile' } );
};

Application.setProjectTitle = function()
{
	this.masterView.sendMessage( {
		command: 'projectinfo',
		data: this.project,
		filename: Application.projectFilename
	} );
}

Application.setPathFromFilename = function( path )
{
	if( !path || typeof( path ) != 'string' ) return;
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
	
	// Make sure it's up to date!
	this.getCurrentPath();
	
	// Do a save operation
	this.syncFilesList( function(msg)
	{
		var files = msg.files;
		var currentFile = msg.currentFile;
		
		var f = files[currentFile];
		
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
			// Default
			var sf = false;
			
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
			var dlg = new Filedialog( Application.masterView, function( path ) 
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
					// Application.syncFilesList();
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
	Application.save( 'saveAs' );

	// Sync the current status down
/*	Application.syncFilesListDown( function()
	{
		Application.save( 'saveAs' );
	} );
*/
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

	this.syncFilesList( function( msg )
	{
		var files = msg.files;
		var currentFile = msg.currentFile;

		var f = new File(filename);
		f.onSave = function ()
		{
			// Tell something went wrong!
			// TODO: Replace alert with our own
			if (this.written <= 0)
				alert(i18n('i18n_could_not_save'));
			
			files[currentFile].content = content;
			files[currentFile].filename = filename;
			files[currentFile].filetype = files[currentFile].filename.split('.').pop().toLowerCase();
			files[currentFile].touched = true;
			
			// Sync the new files down
			Application.sendFileListToEditor(files, currentFile);
			
			// Update status with text..
			Application.masterView.sendMessage({
				command: 'updateStatus',
				data:    ''
			});
			
			Application.setProjectTitle();
		};
		f.save( ( content.length === 0 ? ' ' : content ), filename );
	});
};

// About dialog ----------------------------------------------------------------
Application.about = function()
{
	var fl = { id: 'aboutcodeeditor', width: 320, height: 174, title: 'About Friend Create' };
	if( Application.screen ) fl.screen = Application.screen;
	var v = new View( fl );
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
Application.sendFileListToEditor = function( files, currentFile, callback )
{
	var meg = {
		command: 'receivefilesync',
		files: files,
		currentFile: currentFile
	};
	if( callback )
	{
		meg.callback = addCallback( callback );
	}
	this.masterView.sendMessage( meg );
};

// Contacts the editor level and synchronizes the files list -------------------
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
		case 'refreshsettings':
			this.masterView.sendMessage( { command: 'refreshsettings' } );
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
		case 'close_all':
			Application.closeAllFiles();
			break;
		case 'save_as':
			Application.saveAs();
			break;
		case 'quit':
			Application.quit();
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
		case 'appPreview':
			this.masterView.sendMessage( {
				command: 'appPreview'
			} );
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
		// Project
		case 'project_properties':
			this.showProjectProperties();
			break;
		case 'update_project_files':
			this.project.Files = msg.files;
			break;
		case 'open_project_files':
			for( var a in this.project.Files )
			{
				var fn = this.project.Files[a];
				if( fn.Path.indexOf( ':' ) < 0 )
				{
					var f = {};
					for( var a in fn )
						f[a] = fn[a];
					Application.setPathFromFilename( Application.projectFilename );
					f.Path = Application.currentPath + f.Path;
					Application.loadFile( f );
				}
				else Application.loadFile( this.project.Files[a] );
			}
			break;
		case 'project_addfiles':
			this.projectAddFiles( function()
			{
				if( !Application.prwin ) return;
				Application.prwin.sendMessage( {
					command: 'setprojectfiles',
					files: Application.project.Files
				} );
			} );
			break;
		case 'project_closewin':
			if( Application.prwin )
				Application.prwin.close();
			Application.prwin = false;
			break;
		case 'project_open':
			// Make sure it's up to date!
			Application.getCurrentPath();
			
			var f = new Filedialog( Application.masterView, function( files )
			{
				if( !files || !files.length || !files[0].Path )
					return;
				
				// Close existing
				Application.closeAllFiles();
				
				Application.prevFilename = Application.projectFilename;
				Application.projectFilename = files[0].Path;
				Application.setProjectPath( files[0].Path );
				
				// Update path again
				Application.getCurrentPath();
				
				var f = new File( files[0].Path );
				f.onLoad = function( data )
				{
					var proj = JSON.parse( data );
					Application.project = {}; // Clear the project
					for( var a in proj ) Application.project[a] = proj[a];
					Application.setProjectTitle();
					Application.projectFilename = files[0].Path;
					Application.sendMessage( { command: 'open_project_files' } );
				}
				f.load();
			}, Application.currentPath, 'load', false, i18n( 'i18n_load_project' ) );
			break;
		case 'project_load':
			Application.projectFilename = msg.path;
			Application.setProjectPath( msg.path );
			var f = new File( msg.path );
			f.onLoad = function( data )
			{
				var proj = JSON.parse( data );
				Application.project = {}; // Clear the project
				for( var a in proj ) Application.project[a] = proj[a];
				Application.setProjectTitle();
				//Application.masterView.sendMessage( { command: '', filename: msg.path } );
				Application.sendMessage( { command: 'open_project_files' } );
			}
			f.load();
			break;
		// Runs a project with the project parameters
		case 'project_run':
			if( Application.projectFilename )
			{
				Application.sendMessage( {
					type: 'system',
					command: 'executeapplication',
					executable: Application.projectFilename,
					arguments: ''
				} );
			}
			break;
		case 'addtoproject':
			if( msg.file && msg.file.filename )
			{
				// Validate the file
				var cmp = msg.file.filename;
				if( cmp.indexOf( '/' ) )
				{
					cmp = cmp.split( '/' );
					cmp.pop();
					cmp = cmp.join( '/' );
				}
				else
				{
					cmp = cmp.split( ':' )[0] + ':';
				}
				var d = new Door( cmp );
				d.getIcons( function( files )
				{
					var resp = 'fail';
					var f = null;
					for( var a = 0; a < files.length; a++ )
					{
						if( files[a].Path == msg.file.filename )
						{
							resp = 'ok';
							f = files[a];
							break;
						}
					}
					
					if( resp == 'ok' && f )
					{
						if( f.Path.indexOf( Application.projectPath ) == 0 )
						{
							f.Path = f.Path.substr( Application.projectPath.length, f.Path.length - Application.projectPath.length );
						}
						
						Application.project.Files.push( f );
						Application.receiveMessage( {
							command: 'project_save'
						} );
					}
					
					// Reply to editor window
					Application.masterView.sendMessage( {
						type: 'callback',
						callback: msg.callbackId,
						response: resp
					} );
				} );
				return;
			}
			// Reply to editor window
			this.masterView.sendMessage( {
				type: 'callback',
				callback: msg.callbackId,
				response: 'fail'
			} );
			break;
		case 'checkfile':
			if( this.project && this.projectPath )
			{
				// Assume the file is unknown
				var data = {
					str: 'unknown'
				};
				if( msg.file.filename.length && msg.file.filename != 'Empty file' )
				{
					if( this.project.Files )
					{
						for( var a = 0; a < this.project.Files.length; a++ )
						{
							var comp = msg.file.filename.substr( this.projectPath.length, msg.file.filename.length - this.projectPath.length + 1 );
							if( this.project.Files[a].Path == comp )
							{
								// This file exists in project
								data.str = 'exists';
								break;
							}
						}
					}
				}
				else
				{
					data.str = '';
				}
				// Reply to editor window
				this.masterView.sendMessage( {
					type: 'callback',
					callback: msg.callbackId,
					data: data
				} );
			}
			else
			{
				// Reply to editor window
				this.masterView.sendMessage( {
					type: 'callback',
					callback: msg.callbackId,
					data: { str: 'failed' }
				} );
			}
			break;
		case 'setpermission':
			if( !this.project.Permissions ) this.project.Permissions = [];
			
			// New permission!
			if( msg.index < 0 )
			{
				this.project.Permissions.push( {
					Permission: msg.permission,
					Name:       msg.permname,
					Options:    msg.options
				} );
			}
			// Edit permission
			else
			{
				this.project.Permissions[msg.index] = {
					Permission: msg.permission,
					Name:       msg.permname,
					Options:    msg.options
				};
			}		
			if( Application.prwin )
			{
				Application.prwin.sendMessage( msg );
			}
			break;
		case 'project_package':
			if( !this.projectFilename )
			{
				Alert( i18n( 'i18n_no_project_saved' ), i18n( 'i18n_no_project_desc' ) );
				return;
			}
			var j = new Module( 'system' );
			j.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					Alert( i18n( 'i18n_package_created' ), i18n( 'i18n_package_created_desc' ) );
					var p = this.projectFilename;
					if( p )
					{
						if( p && p.indexOf( '/' ) > 0 )
						{
							p = p.split( '/' );
							p = p.pop();
							p = p.join( '/' ) + '/';
						}
						else p = p.split( ':' )[0] + ':';
						Workspace.refreshWindowByPath( p );
					}
				}
				else
				{
					Alert( i18n( 'i18n_error_occ' ), i18n( 'i18n_package_generation_error' ) );
				}
			}
			j.execute( 'package', { filename: this.projectFilename } );
			break;
		case 'project_submit':
			if( !this.projectFilename )
			{
				Alert( i18n( 'i18n_no_project_saved' ), i18n( 'i18n_no_project_desc' ) );
				return;
			}
			var j = new Module( 'system' );
			j.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					Alert( i18n( 'i18n_package_submitted' ), i18n( 'i18n_submitted_desc' ) );
				}
				else
				{
					Alert( i18n( 'i18n_error_occ' ), i18n( 'i18n_package_generation_error' ) );
				}
			}
			j.execute( 'installpackage', { filename: this.projectFilename } );
			break;
		case 'project_new':
			this.projectFilename = false;
			this.project = {
				ProjectName: '',
				Author: '',
				Email: '',
				Version: '',
				API: 'v1',
				Description: '',
				Files: [],
				Permissions: [],
				Libraries: []
			};
			this.setProjectTitle();
			break;
		case 'project_save_as':
			if( Application.projectFilename )
				Application.prevFilename = Application.projectFilename;
			Application.projectFilename = false;
		case 'project_save':
			var project = {};
			if( msg.data )
			{
				for( var a in msg.data )
				{
					project[a] = msg.data[a];
					Application.project[a] = msg.data[a];
				}
			}
			else project = Application.project;
			
			if( msg.filename && msg.filename.length )
				Application.projectFilename = msg.filename;
			
			if( !Application.projectFilename )
			{
				// Make sure it's up to date!
				Application.getCurrentPath();
				
				var pfn = project.ProjectName.split( /\s/i ).join( '_' );
				pfn = pfn.split( '__' ).join( '_' ) + '.apf';
				var f = new Filedialog( Application.prwin ? Application.prwin : Application.masterView, function( savefile )
				{	
					if( !savefile && Application.prevFilename )
					{
						Application.projectFilename = Application.prevFilename;
						Application.prevFilename = false;
						return;
					}
					Application.prevFilename = Application.projectFilename;
					Application.projectFilename = savefile;
					var of = new File( savefile );
					of.onSave = function( e, d )
					{
						Application.receiveMessage( { command: 'project_closewin' } );
					}
					of.save( JSON.stringify( project ) );
					
					Application.setProjectTitle();
					
				}, Application.currentPath, 'save', pfn ? pfn : 'unnamed_project.apf', 'Save project' );
			}
			// Update it!
			else
			{
				var f = new File( Application.projectFilename );
				f.save( JSON.stringify( project ) );
				Application.receiveMessage( { command: 'project_closewin' } );
			}
			break;
	}
};

Application.setProjectPath = function( fp )
{
	if( fp.indexOf( '/' ) )
	{
		fp = fp.split( '/' );
		fp.pop();
		fp = fp.join( '/' ) + '/';
	}
	else
	{
		fp = fp.split( ':' )[0] + ':';
	}
	this.projectPath = fp;
}

// Show project properties
Application.showProjectProperties = function()
{
	if( this.prwin ) return;
	
	var fl = {
		title: 'Project properties',
		width: 800,
		height: 500
	};
	if( Application.screen ) fl.screen = Application.screen;
	this.prwin = new View( fl );
	
	this.prwin.onClose = function()
	{
		Application.prwin = false;
	}
	
	var f = new File( 'Progdir:Templates/project.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		Application.prwin.setContent( data, function()
		{
			Application.prwin.sendMessage( {
				command: 'projectinfo',
				data: Application.project,
				filename: Application.projectFilename
			} );
		} );
	}
	f.load();
};

Application.closeAllFiles = function()
{
	Application.masterView.sendMessage( { command: 'closeallfiles' } );
}

// Add project files
Application.projectAddFiles = function( callback )
{
	if( this.pfdlg ) return;
	
	// Make sure it's up to date!
	this.getCurrentPath();
	
	this.pfdlg = new Filedialog( this.prwin, function( files )
	{
		Application.pfdlg = false;
		
		if( !Application.project.Files )
			Application.project.Files = [];
		
		var p = Application.projectFilename ? Application.projectFilename : '';
		if( p )
		{
			if( p.indexOf( '/' ) > 0 )
			{
				p = p.split( '/' );
				p.pop();
				p = p.join( '/' ) + '/';
			}
			else if( p.indexOf( ':' ) > 0 )
			{
				p = p.split( ':' )[0] + ':';
			}
		}
		
		// Add them
		for( var a in files )
		{
			var found = false;
			for( var b in Application.project.Files )
			{
				var fl = Application.project.Files[b];
				
				// Trim dir from files located under the .apf path
				if( files[a].Path == fl.Path )
				{
					found = true;
					break;
				}
			}
			if( !found )
			{
				var fl = files[a];
				// Remove relative path from files (relative to .apf file)
				if( fl.Path.indexOf( p ) == 0 )
				{
					fl.Path = fl.Path.substr( p.length, fl.Path.length - p.length );
				}
				Application.project.Files.push( fl );
			}
		}
		if( callback ) callback();
	}, Application.currentPath, 'load' );
};

Application.showPrefs = function()
{
	if( this.pwin ) return;
	
	fl = {
		title: 'Preferences',
		width: 800,
		height: 500,
		id: 'artisanprefswin'
	};
	if( Application.screen ) fl.screen = Application.screen;
	this.pwin = new View( fl );
	
	this.pwin.onClose = function()
	{
		Application.pwin = false;
	}
	
	var f = new File( 'Progdir:Templates/prefs.html' );
	f.onLoad = function( data )
	{
		Application.pwin.setContent( data );
	}
	f.i18n();
	f.load();
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
		case 'lang':
		case 'txt':
		case 'js':
		case 'sol':
		case 'url':
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
		case 'info':
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
				command : 'newfile',
				scope	: 'local'
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
				name    : i18n( 'i18n_close_all' ),
				command : 'close_all'
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
				name:    i18n( 'i18n_project_new' ),
				command: 'project_new'
			},
			{
				name:    i18n( 'i18n_project_properties' ),
				command: 'project_properties'
			},
			{
				name:    i18n( 'i18n_open_project_files' ),
				command: 'open_project_files'
			},
			{
				divider: true
			},
			{
				name:    i18n( 'i18n_load_project' ),
				command: 'project_open'
			},
			{
				name:    i18n( 'i18n_save_project' ),
				command: 'project_save'
			},
			{
				name:    i18n( 'i18n_save_project_as' ),
				command: 'project_save_as'
			},
			{
				divider: true
			},
			{
				name:    i18n( 'i18n_project_package' ),
				command: 'project_package'
			},
			/*{
				name:    i18n( 'i18n_project_submit' ),
				command: 'project_submit'
			},*/
			{
				divider: true
			},
			{
				name:    i18n( 'i18n_run_project' ),
				command: 'project_run'
			}
		]
	},
	/* TODO: Reenable macros when we have them */
	/*{
		name : i18n( 'i18n_macros' ),
		items : [
			{
				name:    i18n( 'i18n_clear_macro' ),
				command: 'macro_clear'
			},
			{
				name:    i18n( 'i18n_record_macro' ),
				command: 'macro_record'
			},
			{
				name:    i18n( 'i18n_stop_macro' ),
				command: 'macro_stop'
			},
			{
				name:    i18n( 'i18n_load_macro' ),
				command: 'macro_load'
			},
			{
				name:    i18n( 'i18n_save_macro' ),
				command: 'macro_save'
			}
		]
	},*/
	/* TODO: Reenable view when it's available */
	{
		name  : i18n( 'i18n_view' ),
		items : [
			{
				name    : i18n( 'i18n_toggle_side_bar' ),
				command : 'toggleSideBar',
				scope	: 'local'
			},
			{
				name    : i18n( 'i18n_app_preview' ),
				command : 'appPreview'
			}
			/*{
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
			}*/
		]
	},
	{
		name  : i18n( 'i18n_edit' ),
		items : [
			/*{
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
			},*/
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
		title: 'FriendCreate',
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
					ap.syncFilesList( function(msg)
					{
						var f = msg.files[msg.currentFile];
						var p = ap.currentPath + f.filename;
						if (args) p = args[0];
						Application.saveFile(p, f.content);
						pollEvent('FileSave', p);
					});
					break;
				case 'ReadLine':
					var ap = Application;
					ap.syncFilesList( function(msg)
					{
						var files = msg.files;
						var currentFile = msg.currentFile;
						var nun = parseInt(args[0]);
						if (isNaN(nun)) nun = 0;
						var block = files[currentFile].content.split("\n");
						pollEvent('ReadLine', block[nun]);
					});
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
				IconFile: 'apps/FriendCreate/icon_door.png',
				Position: 'left',
				Module: 'files',
				Command: 'dormant',
				Filesize: 4096,
				Flags: '',
				Type: 'Directory',
				Dormant: this
			};
		},
		getDirectory: function( path )
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
							Type: 'Directory',
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
							Type: 'Directory',
							Dormant: this
						}
					];
				case vname + 'Functions/':
					var funcs = [
						'FileNew', 'FileLoad', 'ReadLine', 'FileSave', 'FileSaveAs', 'FileClose',
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
					Application.syncFilesList( function(msg)
					{
						var files = msg.files;
						var result = [];
						for (var t = 0; t < files.length; t++)
						{
							var fullfile = files[t].filename.split('%20').join(' ').split(':/').join(':');
							var onlyfile = fullfile.split(':')[1];
							if (onlyfile && onlyfile.indexOf('/') >= 0)
							{
								onlyfile = onlyfile.split('/');
								if (onlyfile[onlyfile.length - 1] === '')
									onlyfile = onlyfile[onlyfile.length - 2];
								else onlyfile = onlyfile[onlyfile.length - 1];
							}
							onlyfile = typeof( onlyfile ) == 'undefined' ? i18n('i18n_empty_file') : onlyfile;
							// Add file to output
							result.push({
								MetaType: 'Meta',
								Title:    onlyfile,
								IconFile: 'gfx/icons/128x128/mimetypes/application-vnd.oasis.opendocument.text-master.png',
								Path:     vname + 'Files/' + onlyfile,
								Position: 'left',
								Module:   'files',
								Command:  'dormant',
								Filesize: 16,
								Type:     'DormantFile',
								Dormant:  this
							});
						}
						return result;
					});
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
	var fl = {
		title: i18n('i18n_friend_create_iot_monitor'),
		width: 600,
		height: 600
	};
	if( Application.screen ) fl.screen = Application.screen;
	var f = new View( fl );
	
	var fs = new File( 'Progdir:Templates/iotmonitor.html' );
	fs.onLoad = function( data )
	{
		f.setContent( data );
	}
	fs.i18n();
	fs.load();
	
	Application.monitor = f;
}

/* Search and replace ------------------------------------------------------- */

function searchRepl()
{
	if( Application.searchWin )
		return;
	var fl = {
		title: i18n('i18n_search_and_replace'),
		width: 400,
		height: 150
	};
	if( Application.screen ) fl.screen = Application.screen;
	var v = new View( fl );
	
	Application.searchWin = v;
	
	var f = new File( 'Progdir:Templates/search.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.i18n();
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
		applicationName: 'FriendCreate',
		eventName: ev,
		data: data
	};
	DormantMaster.pollEvent( msg );
}




