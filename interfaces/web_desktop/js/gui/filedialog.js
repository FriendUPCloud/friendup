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
    // Tell the system that a dialog is opening
    window.dialogOpening = true;
    
	let self = this;
	let mainview = false;
	let suffix = false;
	let multiSelect = true;
	let defaultPath = 'Home:';
	let keyboardNavigation = false;
	let ignoreFiles = false;
	let rememberPath = false;
	let applicationId = false;
	
	// Sanitize paths
	let lastChar;
	if( path )
	{
		lastChar = path.substr( -1, 1 );
		if( lastChar != ':' && lastChar != '/' )
		{
			if( path.indexOf( '/' ) > 0 )
			{
				path = path.split( '/' );
				object.filename = path.pop();
				path = path.join( '/' ) + '/';
				path = path.replace( '//', '/' );
			}
			else if( path.indexOf( ':' ) > 0 )
			{
				path = path.split( ':' );
				object.filename = path.pop();
				path = path.join( ':' ) + ':';
				path = path.replace( '::', ':' );
			}
		}
	}
	if( object.path )
	{
		lastChar = object.path.substr( -1, 1 );
		if( lastChar != ':' && lastChar != '/' )
		{
			if( object.path.indexOf( '/' ) > 0 )
			{
				object.path = object.path.split( '/' );
				object.filename = object.path.pop();
				object.path = object.path.join( '/' ) + '/';
				object.path = object.path.replace( '//', '/' );
			}
			else if( object.path.indexOf( ':' ) > 0 )
			{
				object.path = object.path.split( ':' );
				object.filename = object.path.pop();
				object.path = object.path.join( ':' ) + ':';
				object.path = object.path.replace( '::', ':' );
			}
		}
	}
	// End path sanitation
	
	
	if( path && ( ( !window.isMobile && path.toLowerCase() == 'mountlist:' ) || path.indexOf( ':' ) < 0 ) )
	{
		path = defaultPath;
	}
	if( !path || typeof( path ) == 'undefined' ) path = defaultPath;
	
	if( object.path )
	{
		path = object.path;
	}
	
	// Only mobile can access mountlist
	if( !window.isMobile && path == 'Mountlist:' )
		path = 'Home:';
	
	if( !window.isMobile && object && object.path && object.path == 'Mountlist:' )
		object.path = false;
	
	
	// Check if the path exists
	if( path != 'Mountlist:' )
	{
		FriendDOS.getFileInfo( path, function( e, d )
		{
			if( e == true )
			{
				init();
				delete window.dialogOpening;
			}
			else
			{
				Alert( i18n( 'i18n_illegal_path' ), i18n( 'i18n_illegal_path_desc' ) + ':<br/><p class="Margins">' + path + '</p>', false, function()
				{
					path = 'Home:';
					object.path = 'Home:';
					init();
					delete window.dialogOpening;
				} );
			}
		} );
	}
	else
	{
		init();
		delete window.dialogOpening;
	}
	
	this.close = function()
	{
	    if( self.dialogWindow )
    	    self.dialogWindow.close();
	}
	
	function init()
	{
		// We have a view
		if( object && object.setBlocker )
		{
			mainview = object;
		}
		// We have flags
		if( object )
		{
			for( let a in object )
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
						rememberPath = object[a] ? true : false;
						break;
					case 'applicationId':
						applicationId = object[a];
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

		let dialog = self;
		dialog.suffix = suffix;
		if( !filename ) filename = '';

		// Grab title for later.....................................................
		let ftitle = '';
	
		switch ( type )
		{
			case 'path':  ftitle = i18n( 'file_open_path' );     break;
			case 'load':
			case 'open':  ftitle = i18n( 'file_open_title' );    break;
			case 'save':  ftitle = i18n( 'file_save_title' );    break;
			default:      ftitle = i18n( 'file_unknown_title' ); break;
		}
		self.type = type;

		if( title ) ftitle = title;

		// Generate dialog ID.......................................................
		let ds = null; // <- main container for session based storage
		if( mainview )
		{
			// Create application collection
			if( !_dialogStorage[ mainview.applicationName ] )
				_dialogStorage[ mainview.applicationName ] = {};
			let dialogID = CryptoJS.SHA1( ftitle + '-' + type ).toString();
			if( !_dialogStorage[ mainview.applicationName ][ dialogID ] )
				_dialogStorage[ mainview.applicationName ][ dialogID ] = {};
			ds = _dialogStorage[ mainview.applicationName ][ dialogID ];
		}

		let wantedWidth = 800;

		let fl = {
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

		let w = new View( fl );
		if( applicationId )
			w.applicationId = applicationId;
		w.setMenuItems( {} );

		self.dialogWindow = w;
		w.dialog = self;
		w.content.classList.add( 'FileDialog' );

		// Default path
		self.path = path ? path : defaultPath;
		if( typeof ( path ) == 'object' )
			self.path = path.path;


		// Do the remembering
		if( rememberPath && ds && ds.path && !object.path )
		{
			self.path = path = ds.path;
		}

		// Block main view while this dialog is open!
		if( mainview ) mainview.setBlocker( w );
	
		// Select an element
		w.select = function( ele )
		{
			let cont = this.getContainer ();
			let eles = cont.getElementsByTagName( 'div' );
			for( let a = 0; a < eles.length; a++ )
			{
				if ( eles[a].parentNode != cont )
					continue;
				if ( eles[a] == ele )
				{
					eles[a].isselected = eles[a].isselected ? false : true;
				}
			}
		
			// Second pass, color
			for( let a = 0; a < eles.length; a++ )
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

		// Check if the filename has good chars
		w.checkFilename = function( filename )
		{
			if( filename.length < 1 ) return false;
			let fileDialogAllowedChars = 'abcdefghijklmnopqrstuvwxyzæøå1234567890_-ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ() .';
			let outName = '';
			let errors = [];
			let finalReturn = true;
			
			for( let a = 0; a < filename.length; a++ )
			{
				let found = false;
				for( let b = 0; b < fileDialogAllowedChars.length; b++ )
				{
					if( filename.substr( a, 1 ) == fileDialogAllowedChars.substr( b, 1 ) )
					{
						found = true;
						break;
					}
				}
				if( !found )
				{
					finalReturn = false;
					errors.push( filename.substr( a, 1 ) );
				}
			}
			return finalReturn ? { error: false } : { error: errors.join( ', ' ) };
		}

		// Take a selected file entry and use the trigger function on it
		w.choose = function( ele, stage )
		{	
			if( !dialog.path )
			{
				Alert( i18n( 'i18n_no_path' ), i18n( 'i18n_please_choose_a_path' ) );
				return false;
			}
		
			// Check if the storage space is there, and that the volume
			// is writable
			if( !stage && dialog.type == 'save' )
			{
				let m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					let dn = JSON.parse( d );
					if( parseFloat( dn.Filesize ) - parseFloat( dn.Used ) < 0 )
					{
						Alert( i18n( 'i18n_disk_full' ), i18n( 'i18n_disk_full_desc' ) );
						return;
					}
					w.choose( ele, 2 );
				}
				m.execute( 'volumeinfo', { path: dialog.path.split( ':' )[0] + ':' } );
				return;
			}
		
			// No element, try to find it
			if( !ele )
			{
				if( w.content.icons )
				{
					// TODO: Check multiple
					for( let a = 0; a < w.content.icons.length; a++ )
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
				// Prequalify the filename
				if( typeof ( dialog.saveinput ) == 'undefined' || dialog.saveinput.value.length < 1 )
				{
					Alert( i18n( 'i18n_erroneous_filename' ), i18n( 'i18n_please_set_a_valid_filename' ), false, w );
					if( dialog.saveinput ) dialog.saveinput.focus ();
					return;
				}
				
				if( dialog.saveinput )
				{
					let response = this.checkFilename( dialog.saveinput.value );
					if( response.error )
					{
						Alert( i18n( 'i18n_erroneous_filename' ), 'You have some illegal characters in your filename: "' + response.error + '". Remove these and save again.' );
						dialog.saveinput.focus();
						return;
					}
				}
				
				let p = dialog.path;
				
				p = p.split ( ':/' ).join ( ':' );
				let fname = dialog.saveinput.value + "";
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
						let filename = '';
						if( p.indexOf( '/' ) > 0 )
							filename = ( p.split( '/' ) ).pop();
						else if( p.indexOf( ':' ) > 0 )
							filename = ( p.split( ':' ) ).pop();
						else filename = p;
							
						let suf = typeof( w.dialog.suffix ) == 'string' ? w.dialog.suffix : w.dialog.suffix[0];
						let fix = w.dialog.saveinput.value.split( '.' );
						fix.pop();
						fix.push( suf );
						fix = fix.join( '.' );
						w.dialog.saveinput.value = filename + '.' + fix;
						w.dialog.saveinput.focus();
						w.dialog.saveinput.select();
						return;
					}
				}
			
				// Check if file exists
				let ic = w._window.icons;
				let found = false;
				for( let a = 0; a < ic.length; a++ )
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
			let fobj = ele && ele.obj ? ele.obj : false;
		
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
		
			let cont = this.getContainer();
			let eles = cont.getElementsByTagName ( 'div' );
			let out = [];
			for( let a = 0; a < eles.length; a++ )
			{
				if( eles[a].classList.contains( 'Selected' ) )
				{
					let fi = eles[a].fileInfo;
					let ele = {
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

		self.checkSuffix = function( fn )
		{
			if( !this.suffix ) return true;
			if( typeof( this.suffix ) == 'string' )
			{
				let suf = '.' + this.suffix;
				if( fn.toLowerCase().substr( fn.length - suf.length, suf.length ) != suf )
					return false;
			}
			else
			{
				let found = false;
				for( let a in this.suffix )
				{
					let suf = '.' + this.suffix[a];
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
			if( rememberPath && !object.path )
			{
				ds.path = dialog.path;
			}
		
			if( this._window && this._window.redrawIcons )
				this._window.redrawIcons();
		}

		// Do the actual redrawing of the file list
		w.redrawFilelist = function( objs )
		{
			if( this._window && this._window.redrawIcons )
				this._window.redrawIcons();
		}

		w.getContainer = function()
		{
			let s = this._window.getElementsByTagName( 'div' );
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
			document.body.classList.remove( 'Dialog' );
		
			if( mainview )
			{
				mainview.getWindowElement().blocker = false;
				_ActivateWindow( mainview.getWindowElement ().parentNode );
			}
			triggerfunction( false );
		} );
	
		if( type != 'open' && type != 'save' && type != 'path' )
		{
			type = 'open';
		}

		// Get template
		let f = new File( 'System:templates/filedialog' + ( '_' + type + '.html' ) );
		f.type = 'dialog';
		f.replacements = {
			'file_load'  : i18n( 'file_load'  ),
			'file_save'  : i18n( 'file_save'  ),
			'file_abort' : i18n( 'file_abort' )
		};
		f.i18n();
		f.onLoad = function ( d )
		{
			w.setContent( d );

			// Get sidebar element
			let eles = w.getElementsByTagName( 'div' );
			for( let u = 0; u < eles.length; u++ )
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
				let inps = w.getElementsByTagName( 'input' );
				for( let a = 0; a < inps.length; a++ )
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
						
							path = typeof( path ) == 'object' ? path.join( ':' ) : path;
							inps[a].value = path.indexOf( '.' ) > 0 ? path : '';
						}
						dialog.saveinput = inps[a];
						inps[a].onkeydown = function( e )
						{
							let k = e.which ? e.which : e.keyCode;
							if( k == 13 )
							{
								if( dialog.suffix )
								{
									// Check if the suffix matches
									if( !dialog.checkSuffix( this.value ) )
									{
										val = this.value;
										let suf = typeof( dialog.suffix ) == 'string' ? dialog.suffix : dialog.suffix[0];
										let fix = dialog.saveinput.value.split( '.' );
										fix.pop();
										fix.push( suf );
										fix = fix.join( '.' );
										this.value = val + '.' + fix;
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
			let inpu = false;
			let open = false;
			let save = false;
			let cacl = false;
			let fold = false;
			let ds = w.getElementsByTagName ( 'button' );
			for( let a = 0; a < ds.length; a++ )
			{
				if( ds[a].getAttribute ( 'name' ) )
				{
					switch( ds[a].getAttribute ( 'name' ) )
					{
						case 'open':      open = ds[a]; break;
						case 'select':    open = ds[a]; break;
						case 'save':      save = ds[a]; break;
						case 'cancel':    cacl = ds[a]; break;
					}
				}
			}
			// Get the path string gadget mapped to window object. . . . . . . . . .
			ds = w.getElementsByTagName ( 'input' );
			for( let a = 0; a < ds.length; a++ )
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
					let k = e.which ? e.which : e.keyCode;
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
		
			if( !window.isMobile && dialog.path == 'Mountlist:' )
			{
				// Correct fileinfo
				w._window.fileInfo = {
					Path: 'Home:',
					Volume: 'Home:',
					MetaType: 'Directory',
					Door: new Door( 'Home:' )
				};
				w._window.fileInfo.Door.type = 'dialog';
			}
			else
			{
				let lp = dialog.path.substr( dialog.path.length - 1, 1 );
				if( lp != '/' && lp != ':' )
					dialog.path += '/';
			
				// Correct fileinfo
				w._window.fileInfo = {
					Path: dialog.path,
					Volume: dialog.path.split( ':' )[0],
					MetaType: 'Directory',
					Door: new Door( dialog.path.split( ':' )[0] )
				};
				w._window.fileInfo.Door.type = 'dialog';
			}
		
			// Set up directoryview
			let dir = new DirectoryView( w._window, {
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
						let cand = element.fileInfo.Filename;
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
				doubleclickfiles: function( element, event )
				{
					if( isMobile )
					{
						if( element.classList.contains( 'Selected' ) )
						    element.classList.remove( 'Selected' );
						else element.classList.add( 'Selected' );
					}
					else
					{
						element.classList.add( 'Selected' );
						w.choose( element );
					}
					if( event ) return cancelBubble( event );
				}
			} );
			dir.showHiddenFiles = false;
			dir.listMode = 'listview';
		
			// Get icons and load!
			w._window.fileInfo.Door.type = 'dialog';
			w._window.fileInfo.Door.getIcons( dialog.path, function( items )
			{
				w._window.icons = items;
				w.refreshView();
			} );
		
			w._window.refresh = function( cb )
			{
				let f = w._window.fileInfo;
				let d = new Door( f.Path );
				d.type = 'dialog';
				dialog.path = f.Path;
			
				let fin = {
					Path: f.Path,
					Volume: f.Volume,
					MetaType: 'Directory',
					Type: 'Directory'
				};
			
				let dr = new Door( f.Path );
				dr.type = 'dialog';
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
}

// Get a path from fileinfo and return it
function FiledialogPath( fileinfo )
{
	let path = fileinfo.Path ? fileinfo.Path : fileinfo.Title;
	path = path.split( '/' );
	path.pop();
	path = path.join( '/' );
	return path;
}
