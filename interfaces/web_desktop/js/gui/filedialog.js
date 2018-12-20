/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Opens a file dialog connected to an application
Filedialog = function( object, triggerfunction, path, type, filename, title )
{
	var self = this;
	var mainview = false;
	var multiSelect = true;
	
	// We have a view
	if( object && object.setBlocker )
	{
		mainview = object;
	}
	// We have flags
	else if( object )
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
			}
		}
	}

	// Save never has multiselect
	if( type == 'save' )
	{
		multiSelect = false;
	}

	if( !path ) path = 'Mountlist:';
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
	if( !filename ) filename = '';

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
	this.path = path ? path : 'Mountlist:';
	if ( typeof ( path ) == 'object' )
		this.path = path.path;

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
	w.choose = function ( ele )
	{
		if ( !dialog.path )
		{
			alert ( 'Please choose a path.' );
			return false;
		}
		
		// Save dialog uses current path and written filename
		if ( dialog.type == 'save' )
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
			triggerfunction( p );
			w.close();
			return;
		}
		
		if( ele && ele.obj )
		{
			triggerfunction ( [ ele.obj ] );
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
			triggerfunction( out );
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
				console.log( 'Nothing selected...' );
			}
		}
		w.close ();
	}

	// Refresh dir listing
	w.refreshView = function()
	{
		this._window.redrawIcons();
	}

	// Do the actual redrawing of the file list
	w.redrawFilelist = function( objs )
	{
		this._window.redrawIcons();
	}

	w.getContainer = function()
	{
		var s = this._window.getElementsByTagName ( 'div' );
		for ( var a = 0; a < s.length; a++ )
		{
			if ( s[a].getAttribute ( 'name' ) && s[a].getAttribute ( 'name' ) == 'ContentBox' )
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
						inps[a].value = path.filename;
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
							w.choose();
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
			if ( ds[a].getAttribute ( 'name' ) )
			{
				if ( ds[a].getAttribute ( 'name' ) == 'Path' )
				{
					inpu = ds[a];
					w.inpu = inpu;
				}
			}
		}
		// Cancel
		if ( cacl )
		{
			cacl.onclick = function()
			{
				triggerfunction( '' );
				w.close();
			}
		}
		if ( open )
		{
			open.onclick = function()
			{
				w.choose();
			}
		}
		// Save file
		if ( save )
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
	
		// Correct fileinfo
		w._window.fileInfo = {
			Path: 'Home:',
			Volume: 'Home:',
			MetaType: 'Directory',
			Door: new Door( 'Home:' )
		};
		
		// Set up directoryview
		var dir = new DirectoryView( w._window, {
			filedialog:          true,
			rightpanel:          dialog.contentbox,
			leftpanel:           dialog.sidebar,
			multiple:            multiSelect,
			nosidebarbackground: true,
			toolbararea:         dialog.toolbararea,
			mountlist:           true,
			doubleclickfiles:    function( element, event )
			{
				element.classList.add( 'Selected' );
				w.choose( element );
				if( event ) return cancelBubble( event );
			}
		} );
		dir.listMode = 'listview';
		
		// Get icons and load!
		w._window.fileInfo.Door.getIcons( 'Home:', function( items )
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
