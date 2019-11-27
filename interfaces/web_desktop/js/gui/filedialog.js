/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var _dialogStorage = {};

// Opens a file dialog connected to an application
Filedialog = function( object, triggerfunction, path, type, filename, title )
{	
	var self = this;
	var mainview = false;
	var suffix = false;
	var multiSelect = true;
	var defaultPath = 'Home:';
	var keyboardNavigation = false;
	var ignoreFiles = false;
	var rememberPath = false;
	
	if( path && ( path.toLowerCase() == 'Mountlist:' || path.indexOf( ':' ) < 0 ) )
	{
		path = defaultPath;
	}
	
	// We have a view
	if( object && object.setBlocker )
	{
		mainview = object;
	}
	// We have flags
	if( object )
	{
		for( var a in object )
		{
			switch( a )
			{
				case 'triggerFunction':
					triggerfunction = object[a];
					break;
				case 'multiSelect':
					multiSelect = object[a];
					break;
				case 'ignoreFiles':
					ignoreFiles = object[a];
					break;
				case 'path':
					path = object[a];
					break;
				case 'type':
					type = object[a];
					break;
				case 'filename':
					filename = object[a];
					break;
				case 'title':
					title = object[a];
					break;
				case 'mainView':
					mainview = object[a];
					break;
				case 'suffix':
					suffix = object[a];
					break;
				case 'keyboardNavigation':
					keyboardNavigation = object[a];
					break;
				case 'rememberPath':
					rememberPath = object[a] ? true : false
					break;
			}
		}
	}
	
	// Special case, just looking for folders
	if( type == 'path' )
	{
		ignoreFiles = true;
	}

	// Save never has multiselect
	if( type == 'save' )
	{
		multiSelect = false;
	}

	if( !path ) path = defaultPath;
	if( path.indexOf( ':' ) < 0 )
	{
		path = 'Home:';
	}
	
	if( !triggerfunction ) return;
	if( !type ) type = 'open';
	if( !mainview )
	{
		if( currentMovable )
		{
			mainview = currentMovable.windowObject;
		}
	}

	var dialog = this;
	dialog.suffix = suffix;
	if( !filename ) filename = '';

	// Grab title for later.....................................................
	var ftitle = '';
	
	switch ( type )
	{
		case 'path':  ftitle = i18n( 'file_open_path' );     break;
		case 'load':
		case 'open':  ftitle = i18n( 'file_open_title' );    break;
		case 'save':  ftitle = i18n( 'file_save_title' );    break;
		default:      ftitle = i18n( 'file_unknown_title' ); break;
	}
	this.type = type;

	if( title ) ftitle = title;

	// Generate dialog ID.......................................................
	var ds = null; // <- main container for session based storage
	if( mainview )
	{
		// Create application collection
		if( !_dialogStorage[ mainview.applicationName ] )
			_dialogStorage[ mainview.applicationName ] = {};
		var dialogID = CryptoJS.SHA1( ftitle + '-' + type ).toString();
		if( !_dialogStorage[ mainview.applicationName ][ dialogID ] )
			_dialogStorage[ mainview.applicationName ][ dialogID ] = {};
		ds = _dialogStorage[ mainview.applicationName ][ dialogID ];
	}

	var wantedWidth = 800;

	var fl = {
		'title' : i18n ( ftitle ),
		'width' : wantedWidth,
		'min-width' : 480,
		'height' : 400,
		'min-height' : 400,
		'loadAnimation' : true
	};

	if( mainview && mainview.getFlag( 'screen' ) )
	{
		fl.screen = mainview.getFlag( 'screen' );
	}

	var w = new View( fl );

	this.dialogWindow = w;
	w.dialog = this;

	// Default path
	this.path = path ? path : defaultPath;
	if( typeof ( path ) == 'object' )
		this.path = path.path;


	// Do the remembering
	if( rememberPath && ds && ds.path )
	{
		this.path = path = ds.path;
	}

	// Block main view while this dialog is open!
	if( mainview ) mainview.setBlocker( w );
	
	// Select an element
	w.select = function( ele )
	{
		var cont = this.getContainer ();
		var eles = cont.getElementsByTagName( 'div' );
		for( var a = 0; a < eles.length; a++ )
		{
			if ( eles[a].parentNode != cont )
				continue;
			if ( eles[a] == ele )
			{
				eles[a].isselected = eles[a].isselected ? false : true;
			}
		}
		
		// Second pass, color
		for( var a = 0; a < eles.length; a++ )
		{
			if ( eles[a].parentNode != cont )
				continue;
			
			// Remove class
			eles[a].className = eles[a].className.split ( ' Selected' ).join ( '' );
			
			// Add class on selected
			if( !multiSelect && eles[a].isselected == true && eles[a] != ele  )
			{
				eles[a].classList.remove( 'Selected' );
				eles[a].isselected = false;
			}
			else if( eles[a].isselected == true )
			{
				if( !eles[a].classList.contains( 'Selected' ) )
					eles[a].classList.add( 'Selected' );
			}
			else if( eles[a].classList.contains( 'Selected' ) )
				eles[a].classList.remove( 'Selected' );
		}
		if( dialog.type == 'save' )
		{
			dialog.saveinput.value = ele.filename;
		}
	}

	// Take a selected file entry and use the trigger function on it
	w.choose = function( ele )
	{
		if( !dialog.path )
		{
			Alert( i18n( 'i18n_no_path' ), i18n( 'i18n_please_choose_a_path' ) );
			return false;
		}
		
		// No element, try to find it
		if( !ele )
		{
			if( w.content.icons )
			{
				// TODO: Check multiple
				for( var a = 0; a < w.content.icons.length; a++ )
				{
					if( w.content.icons[a].selected )
					{
						ele = w.content.icons[a];
						break;
					}
				}
			}
		}
		
		// Save dialog uses current path and written filename
		if( dialog.type == 'save' )
		{
			if ( typeof ( dialog.saveinput ) == 'undefined' || dialog.saveinput.value.length < 1 )
			{
				//TODO: Change with our alert!
				alert ( 'Failed. Please input filename.' );
				if ( dialog.saveinput ) dialog.saveinput.focus ();
				return;
			}
			var p = dialog.path;
			p = p.split ( ':/' ).join ( ':' );
			var fname = dialog.saveinput.value + "";
			if ( p.substr ( p.length - 1, 1 ) == ':' )
				p += fname;
			else if ( p.substr ( p.length - 1, 1 ) != '/' )
				p += '/' + fname;
			else p += fname;
			
			
			if( dialog.suffix )
			{
				// Check if the suffix matches
				if( !dialog.checkSuffix( p ) )
				{
					var suf = typeof( w.dialog.suffix ) == 'string' ? w.dialog.suffix : w.dialog.suffix[0];
					var fix = w.dialog.saveinput.value.split( '.' );
					fix.pop();
					fix.push( suf );
					fix = fix.join( '.' );
					w.dialog.saveinput.value = fix;
					w.dialog.saveinput.focus();
					w.dialog.saveinput.select();
					return;
				}
			}
			
			// Check if file exists
			var ic = w._window.icons;
			var found = false;
			for( var a = 0; a < ic.length; a++ )
			{
				if( ic[a].Path == p )
				{
					found = true;
				}
			}
			
			if( found )
			{
				Confirm( i18n( 'i18n_overwriting_file' ), i18n( 'i18n_do_you_want_overwrite' ), function( ok )
				{
					if( ok )
					{
						triggerfunction( p );
						w.close();
					}
				}, i18n( 'i18n_overwrite' ) );
			}
			else
			{
				triggerfunction( p );
				w.close();
			}
			return;
		}
		
		// Get the file object
		var fobj = ele && ele.obj ? ele.obj : false;
		
		// Try to recreate the file object from the file info
		if( ele && !fobj )
		{
			if( ele.fileInfo )
			{
				fobj = {
					Type: ele.fileInfo.Type,
					Filename: ele.fileInfo.Filename,
					Path: ele.fileInfo.Path,
					Volume: ele.fileInfo.Volume
				};
			}
		}
		
		if( ele && fobj )
		{
			triggerfunction( [ fobj ] );
			w.close ();
			return;
		}
		
		var cont = this.getContainer();
		var eles = cont.getElementsByTagName ( 'div' );
		var out = [];
		for( var a = 0; a < eles.length; a++ )
		{
			if( eles[a].classList.contains( 'Selected' ) )
			{
				var fi = eles[a].fileInfo;
				var ele = {
					Path: fi.Path,
					Filename: fi.Filename,
					MetaType: fi.MetaType,
					Type: fi.Type
				};
				out.push( ele );
			}
		}
		if( out.length )
		{
			if( dialog.type == 'path' )
			{
				triggerfunction( out[0].Path );
			}
			else
			{
				triggerfunction( out );
			}
		}
		else
		{
			if( dialog.type == 'path' )
			{
				triggerfunction( dialog.path );
			}
			else
			{
				triggerfunction( '' );
			}
		}
		w.close ();
	}

	this.checkSuffix = function( fn )
	{
		if( !this.suffix ) return true;
		if( typeof( this.suffix ) == 'string' )
		{
			var suf = '.' + this.suffix;
			if( fn.toLowerCase().substr( fn.length - suf.length, suf.length ) != suf )
				return false;
		}
		else
		{
			var found = false;
			for( var a in this.suffix )
			{
				var suf = '.' + this.suffix[a];
				if( fn.toLowerCase().substr( fn.length - suf.length, suf.length ) == suf )
				{
					found = true;
					break;
				}
			}
			return found;
		}
		return true;
	}

	// Refresh dir listing
	w.refreshView = function()
	{
		if( rememberPath )
		{
			ds.path = dialog.path;
		}
		
		this._window.redrawIcons();
	}

	// Do the actual redrawing of the file list
	w.redrawFilelist = function( objs )
	{
		this._window.redrawIcons();
	}

	w.getContainer = function()
	{
		var s = this._window.getElementsByTagName( 'div' );
		for ( var a = 0; a < s.length; a++ )
		{
			if( s[a].getAttribute( 'name' ) && s[a].getAttribute( 'name' ) == 'ContentBox' )
			{
				return s[a];
			}
		}
		return false;
	}

	w.addEvent( 'close', function()
	{
		if( w.md ) w.md.close();
		
		if( mainview )
		{
			mainview.getWindowElement().blocker = false;
			_ActivateWindow( mainview.getWindowElement ().parentNode );
		}
		triggerfunction( false );
	} );
	
	if( type != 'open' && type != 'save' )
		type = 'open';

	// Get template
	var f = new File( 'System:templates/filedialog' + ( '_' + type + '.html' ) );
	f.replacements = {
		'file_load'  : i18n( 'file_load'  ),
		'file_save'  : i18n( 'file_save'  ),
		'file_abort' : i18n( 'file_abort' )
	};
	f.onLoad = function ( d )
	{
		w.setContent( d );

		// Get sidebar element
		var eles = w.getElementsByTagName( 'div' );
		for( var u = 0; u < eles.length; u++ )
		{
			if( !eles[u].classList ) continue;
			if( eles[u].classList.contains( 'Sidebar' ) )
			{
				dialog.sidebar = eles[u];
				w._window.parentNode.leftbar = dialog.sidebar;
			}
			else if( eles[u].classList.contains( 'Toolbarbox' ) )
			{
				dialog.toolbararea = eles[u];
			}
			else if( eles[u].classList.contains( 'List-view' ) )
			{
				dialog.listview = eles[u];
			}
			else if( eles[u].classList.contains( 'ContentBox' ) )
			{
				dialog.contentbox = eles[u];
			}
		}

		// We need the sidebar!
		if( fl.width >= 600 )
		{
			dialog.listview.style.left = '201px';
			dialog.listview.style.width = 'auto';
			dialog.listview.style.right = '0px';
			dialog.sidebar.style.width = '200px';
		}
		// If not don't use it
		else
		{
			dialog.sidebar = false;
		}

		// Insert filename (if save)
		if( type == 'save' )
		{
			var inps = w.getElementsByTagName( 'input' );
			for( var a = 0; a < inps.length; a++ )
			{
				if( inps[a].getAttribute( 'name' ) == 'filename' )
				{
					if( filename )
					{
						inps[a].value = filename;
					}
					else if( typeof( path ) == 'object' )
					{
						inps[a].value = path.filename;
					}
					else if( path )
					{
						if( path.indexOf( ':' ) > 0 )
						{
							path = path.split( ':' );
							if( path[1] && path[1].length )
							{
								if( path.indexOf( '/' ) > 0 )
								{
									path = path.split( '/' );
									path = path[path.length-1];
								}
							}
							else path = '';
						}
						inps[a].value = path;
					}
					dialog.saveinput = inps[a];
					inps[a].onkeydown = function( e )
					{
						var k = e.which ? e.which : e.keyCode;
						if( k == 13 )
						{
							if( dialog.suffix )
							{
								// Check if the suffix matches
								if( !dialog.checkSuffix( this.value ) )
								{
									var suf = typeof( dialog.suffix ) == 'string' ? dialog.suffix : dialog.suffix[0];
									var fix = dialog.saveinput.value.split( '.' );
									fix.pop();
									fix.push( suf );
									fix = fix.join( '.' );
									this.value = fix;
									this.focus();
									this.select();
									return;
								}
							}
							w.choose();
						}
					}
					break;
				}
			}
		}

		// Set default buttons . . . . . . . . . . . . . . . . . . . . . . . . .
		var inpu = false;
		var open = false;
		var save = false;
		var cacl = false;
		var fold = false;
		var ds = w.getElementsByTagName ( 'button' );
		for( var a = 0; a < ds.length; a++ )
		{
			if( ds[a].getAttribute ( 'name' ) )
			{
				switch( ds[a].getAttribute ( 'name' ) )
				{
					case 'open':      open = ds[a]; break;
					case 'save':      save = ds[a]; break;
					case 'cancel':    cacl = ds[a]; break;
				}
			}
		}
		// Get the path string gadget mapped to window object. . . . . . . . . .
		ds = w.getElementsByTagName ( 'input' );
		for( var a = 0; a < ds.length; a++ )
		{
			if( ds[a].getAttribute( 'name' ) )
			{
				if( ds[a].getAttribute( 'name' ) == 'Path' )
				{
					inpu = ds[a];
					w.inpu = inpu;
				}
			}
		}
		// Cancel
		if( cacl )
		{
			cacl.onclick = function()
			{
				triggerfunction( '' );
				w.close();
			}
		}
		if( open )
		{
			open.onclick = function()
			{
				w.choose();
			}
		}
		// Save file
		if( save )
		{
			save.onclick = function()
			{
				w.choose();
			}
		}
		// Typing in on the input gadget . . . . . . . . . . . . . . . . . . . .
		if( inpu )
		{
			w.inpu = inpu;
			inpu.onkeyup = function( e )
			{
				var k = e.which ? e.which : e.keyCode;
				// Submit on enter
				if ( k && k == 13 )
				{
					dialog.prev = this.path;
					dialog.path = this.value.split ( ' ' ).join ( '%20' );
					w.refreshView();
				}
			}
			inpu.value = dialog.path;
		}
		
		if( dialog.path == 'Mountlist:' )
		{
			// Correct fileinfo
			w._window.fileInfo = {
				Path: 'Home:',
				Volume: 'Home:',
				MetaType: 'Directory',
				Door: new Door( 'Home:' )
			};
		}
		else
		{
			var lp = dialog.path.substr( dialog.path.length - 1, 1 );
			if( lp != '/' && lp != ':' )
				dialog.path += '/';
			
			// Correct fileinfo
			w._window.fileInfo = {
				Path: dialog.path,
				Volume: dialog.path.split( ':' )[0],
				MetaType: 'Directory',
				Door: new Door( dialog.path.split( ':' )[0] )
			};
		}
		
		// Set up directoryview
		var dir = new DirectoryView( w._window, {
			filedialog:          true,
			rightpanel:          dialog.contentbox,
			leftpanel:           dialog.sidebar,
			multiple:            multiSelect,
			ignoreFiles:         ignoreFiles,
			nosidebarbackground: true,
			toolbararea:         dialog.toolbararea,
			mountlist:           true,
			suffix:              dialog.suffix,
			keyboardNavigation:  keyboardNavigation,
			clickfile:           function( element, event )
			{
				if( dialog.saveinput && element.fileInfo.Type == 'File' )
				{
					var cand = element.fileInfo.Filename;
					if( dialog.suffix )
					{
						if( !dialog.checkSuffix( cand ) )
						{
							return;
						}
					}
					dialog.saveinput.value = cand;
				}
			},
			doubleclickfiles:    function( element, event )
			{
				element.classList.add( 'Selected' );
				w.choose( element );
				if( event ) return cancelBubble( event );
			}
		} );
		dir.showHiddenFiles = false;
		dir.listMode = 'listview';
		
		// Get icons and load!
		w._window.fileInfo.Door.getIcons( dialog.path, function( items )
		{
			w._window.icons = items;
			w.refreshView();
		} );
		
		w._window.refresh = function( cb )
		{
			var f = w._window.fileInfo;
			var d = new Door( f.Path );
			dialog.path = f.Path;
			
			var fin = {
				Path: f.Path,
				Volume: f.Volume,
				MetaType: 'Directory',
				Type: 'Directory'
			};
			
			var dr = new Door( f.Path );
			dr.getIcons( f.Path, function( icons )
			{
				w._window.directoryview.addToHistory( fin );
				w._window.icons = icons;
				w.refreshView();
				if( cb ) cb();
			} );
		}
		
		w.addEvent( 'resize', function()
		{
			w.refreshView();
		} );
		
		_ActivateWindow( w._window.parentNode );
		_WindowToFront( w._window.parentNode );
		
		// Hide the workspace menu
		ge( 'WorkspaceMenu' ).classList.remove( 'Open' );
	}
	f.load();
}

// Get a path from fileinfo and return it
function FiledialogPath( fileinfo )
{
	var path = fileinfo.Path ? fileinfo.Path : fileinfo.Title;
	path = path.split( '/' );
	path.pop();
	path = path.join( '/' );
	return path;
}
