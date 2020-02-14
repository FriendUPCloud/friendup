/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Name fix
function _nameFix( wt )
{
	// HOGNE: fix for Title/Path column problem
	if ( wt.indexOf( ':' ) < 0 )
		wt += ':';
	wt = wt.split( ':' );
	if( wt[1] == '' )
	{
		wt = wt[0];
	}
	else
	{
		var end = wt[1].split( '/' );
		if( end[ end.length - 1 ] == '' )
			end = end[ end.length - 2 ];
		else end = end[ end.length - 1 ];
		wt = wt[0] + ' : ' + end;
	}
	return wt;
}

function _getBase64Image( img, type )
{
	if( !type ) type = 'image/png';
	var canvas = document.createElement( 'canvas' );
	canvas.width = img.width; canvas.height = img.height;
	var ctx = canvas.getContext( '2d' );
	ctx.drawImage( img, 0, 0 );
	return canvas.toDataURL( type );
}

Friend = window.Friend || {};

// Setup icon cache
if( !Friend.iconCache )
{
	Friend.iconCache = {
		maxCount: 1500,             // How many icons to keep in cache
		index: 0,                   // For seenList
		seenList: []                // List of cached icons by index
	};
}

// DirectoryView class ---------------------------------------------------------
DirectoryView = function( winobj, extra )
{	
	var ws = GetWindowStorage( winobj.uniqueId );
	
	// Use this for all file operations to cancel operations later
	this.cancelId = UniqueHash();
	
	// Initial values
	this.listMode = ws && ws.listMode ? ws.listMode : 'iconview';
	this.sortColumn = 'filename';
	this.sortOrder = 'ascending';
	this.showHiddenFiles = false;
	this.navMode = globalConfig.navigationMode == 'spacial' ? globalConfig.navigationMode : 'toolbar'; // default is now using toolbar
	this.pathHistory = [];
	this.pathHistoryIndex = 0;
	this.ignoreFiles = false;
	this.filearea = winobj;
	this.bookmarks = null;
	this.sidebarbackground = true;
	this.toolbararea = false;
	this.doubleclickfiles = false;
	this.clickfile = false;
	this.multiple = true;
	this.mountlist = false;
	this.filedialog = false;
	this.suffix = false;
	this.keyboardNavigation = true;
	this.startPath = false;
	
	// Read in extra stuff
	if( extra )
	{
		if( extra.startPath )
			this.startPath = extra.startPath;
		if( extra.filedialog )
		{
			this.filedialog = true;
		}
		if( extra.hasSidebar )
		{
			this.hasSidebar = true;
		}
		if( extra.rightpanel )
		{
			this.filearea = extra.rightpanel;
		}
		if( extra.leftpanel )
		{
			this.bookmarks = extra.leftpanel;
		}
		if( extra.ignoreFiles )
		{
			this.ignoreFiles = true;
		}
		if( extra.nosidebarbackground )
		{
			this.sidebarbackground = false;
		}
		if( extra.toolbararea )
		{
			this.toolbararea = extra.toolbararea;
		}
		if( extra.doubleclickfiles )
		{
			this.doubleclickfiles = extra.doubleclickfiles;
		}
		if( extra.clickfile )
		{
			this.clickfile = extra.clickfile;
		}
		if( extra.multiple === false )
		{
			this.multiple = false;
		}
		if( extra.mountlist )
		{
			this.mountlist = extra.mountlist;
		}
		if( extra.suffix )
		{
			this.suffix = extra.suffix;
		}
		if( extra.keyboardNavigation === false || extra.keyboardNavigation )
		{
			this.keyboardNavigation = extra.keyboardNavigation;
		}
	}

	// File notification
	if( winobj )
	{
		if( winobj.fileInfo )
		{
			var path = winobj.fileInfo.Path;
			if( !Workspace.diskNotificationList[ path ] )
			{
				Workspace.diskNotificationList[ path ] = {
					type: 'directory',
					view: winobj
				};
				var f = new Library( 'system.library' );
				f.addVar( 'sessionid', Workspace.sessionId );
				f.addVar( 'path', path );
				f.onExecuted = function( e, d )
				{
					if( e == 'ok' )
					{
						var j = JSON.parse( d );
						winobj.parentNode.windowObject.addEvent( 'systemclose', function()
						{
							var ff = new Library( 'system.library' );
							ff.addVar( 'sessionid', Workspace.sessionId );
							ff.addVar( 'path', path );
							ff.addVar( 'id', j.Result );
							ff.onExecuted = function( es, ds )
							{
								Workspace.diskNotificationList[ path ] = false;
							}
							ff.execute( 'file/notificationremove' );
						} );
					}
					//console.log( 'File notification start result: ' + e, d );
				}
				f.execute( 'file/notificationstart' );
				//console.log('notification start ' + path);
			}
			this.addToHistory( winobj.fileInfo );
		}

		this.InitWindow( winobj );
		winobj.parentNode.classList.add( 'IconWindow' );
		if( this.toolbararea )
			winobj.parentNode.classList.add( 'CustomToolbarArea' );
	}

	this.window = winobj;
}

DirectoryView.prototype.checkSuffix = function( fn )
{
	if( !this.suffix ) return true;
	if( !fn ) return true;
	if( typeof( fn ) == 'object' && fn.Filename )
		fn = fn.Filename;
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

DirectoryView.prototype.addToHistory = function( info )
{
	// Don't do it twice
	if( !this.window ) return;
	
	// Make a copy
	var ele = {};
	for( var a in info ) ele[ a ] = info[ a ];
	
	
	var his = [];
	for( var a = 0; a < this.pathHistory.length; a++ )
	{
		var el = {};
		for( var b in this.pathHistory[ a ] )
			el[ b ] = this.pathHistory[ a ];
		his.push( el );
	}
	
	if( !this.pathHistory.length )
	{
		this.pathHistory = [ ele ];
		this.pathHistoryIndex = 0;
	}
	else if( this.pathHistoryIndex == this.pathHistory.length - 1 )
	{
		// Check duplicate
		if( this.pathHistory[ this.pathHistory.length - 1 ].Path != ele.Path )
		{
			this.pathHistory.push( ele );
			this.pathHistoryIndex = this.pathHistory.length - 1;
		}
		// Do not add duplicate
		else
		{
			this.pathHistoryIndex = this.pathHistory.length - 1;
			var el = this.pathHistory[ this.pathHistoryIndex];
			var f = {};
			for( var a in el ) f[ a ] = el[ a ];
			ele = f;
		}
	}
	// Insert into path history (cuts history)
	else
	{
		var out = [];
		for( var a = 0; a < this.pathHistory.length; a++ )
		{
			out.push( this.pathHistory[ a ] );
			if( a == this.pathHistoryIndex )
			{
				// Check duplicate
				if( this.pathHistory[ a ].Path != ele.Path )
				{
					out.push( ele );
				}
				break;
			}
		}
		this.pathHistory = out;
		this.pathHistoryIndex = out.length - 1;
	}
	
	this.window.fileInfo = ele;
	
	return true;
}

// Rewind to previous path history item
DirectoryView.prototype.pathHistoryRewind = function()
{
	// Previous
	if( this.pathHistoryIndex > 0 )
	{
		return this.pathHistory[ --this.pathHistoryIndex ];
	}
	// Start
	return this.pathHistory[ 0 ];
}

// Rewind to next path history item
DirectoryView.prototype.pathHistoryForward = function()
{
	// Next
	if( this.pathHistoryIndex < this.pathHistory.length - 1 )
	{
		return this.pathHistory[ ++this.pathHistoryIndex ];
	}
	// End of the line
	return this.pathHistory[ this.pathHistory.length - 1 ];
}

// Generate toolbar
DirectoryView.prototype.initToolbar = function( winobj )
{
	// Create toolbar
	if( !winobj.parentNode.leftbar ) return;

	var dw = this;

	var t = document.createElement( 'div' );
	t.className = 'DirectoryToolbar';

	// Assign it so we remember
	winobj.parentNode.toolbar = t;
	this.toolbar = t;
	
	if( this.toolbararea )
	{
		this.toolbararea.appendChild( t );
		t.style.left = 0;
		t.style.right = 0;
	}
	else
	{
		winobj.parentNode.insertBefore( t, winobj.parentNode.firstChild );
		t.style.top = winobj.parentNode.titleBar.offsetHeight + 'px';
		t.style.left = GetElementWidth( winobj.parentNode.leftbar ) + 'px';
		t.style.right = GetElementWidth( winobj.parentNode.rightbar ) + 'px';
	}

	var rpath = winobj.fileInfo.Path ? winobj.fileInfo.Path : ( winobj.fileInfo.Volume );
	if ( rpath.indexOf( ':' < 0 ) )
		rpath += ':';

	var lmode = this.listMode;

	var buttons = [
		// Go up a level
		{
			element: 'button',
			className: 'Up IconSmall ' + ( isMobile ? 'fa-arrow-left' : 'fa-arrow-up' ),
			content: i18n( 'i18n_dir_btn_up' ),
			onclick: function( e )
			{
				var test = winobj.fileInfo.Path;
				if( ( !winobj.directoryview.hasSidebar && !winobj.directoryview.filedialog ) && test.substr( test.length - 1, 1 ) == ':' )
				{
					return;
				}
				
				var volu = path = '';
				
				if( ( winobj.directoryview.hasSidebar || winobj.directoryview.filedialog ) && test != 'Mountlist:' && test.substr( test.length - 1, 1 ) == ':' )
				{
					path = 'Mountlist:';
					volu = 'Mountlist';
				}
				else
				{
					// Fetch path again
					var rpath2 = winobj.fileInfo.Path ? winobj.fileInfo.Path : ( winobj.fileInfo.Volume );

					if ( rpath2.indexOf( ':' < 0 ) )
						rpath2 += ':';
					var path = rpath2.split( ':' );

					volu = path[0];
					path = path[1];
					if( path.substr( path.length - 1, 1 ) == '/' )
						path = path.substr( 0, path.length - 1 );
					var fnam = '';

					if( path.indexOf( '/' ) > 0 )
					{
						path = path.split( '/' );
						path.pop();
						fnam = path[ path.length - 1 ]; // filename
						path = path.join( '/' );
					}
					else
					{
						path = '';
						fnam = volu;
					}
					path = volu + ':' + path;

					var lp = path.substr( path.length - 1, 1 )
					if( lp != ':' && lp != '/' ) path += '/';
				}

				var fin = {
					Volume: volu + ':',
					Path: path,
					Filename: fnam,
					Type: winobj.fileInfo.Type,
					Door: Workspace.getDoorByPath( path )
				}
				fin.Door.cancelId = dw.cancelId;

				// Set as current history element at end of list
				dw.addToHistory( fin );
				
				// Animation for going to next folder
				if( isMobile )
				{
					// Remove previous one
					if( winobj.slideAnimation )
						winobj.slideAnimation.parentNode.removeChild( winobj.slideAnimation );
					
					var n = document.createElement( 'div' );
					n.className = 'Content SlideAnimation';
					n.style.willChange = 'transform';
					n.style.transition = 'transform 0.4s';
					n.innerHTML = winobj.innerHTML;
					n.scrollTop = winobj.scrollTop;
					n.style.zIndex = 10;
					winobj.parentNode.appendChild( n );
					winobj.slideAnimation = n;
					
					winobj.parentNode.classList.add( 'Redrawing' );
					
					// Refresh and animate
					winobj.refresh( function()
					{
						n.style.transform = 'translate3d(100%,0,0)';
						setTimeout( function()
						{
							if( n.parentNode )
							{
								n.parentNode.removeChild( n );
								if( winobj.parentNode )
									winobj.parentNode.classList.remove( 'Redrawing' );
							}
							winobj.slideAnimation = null;
						}, 400 );
					} );
					
				}
				else
				{
					winobj.refresh();
				}
			}
		},
		!isMobile ? {
			element: 'button',
			className: 'Back IconSmall fa-arrow-left',
			content: i18n( 'i18n_dir_btn_back' ),
			onclick: function( e )
			{
				// If we're not at the top of the history array, go back
				if( dw.pathHistoryIndex > 0 )
				{
					var fin = dw.pathHistoryRewind();
					dw.window.fileInfo = fin;
					
					if( !isMobile && winobj.fileBrowser )
					{
						winobj.fileBrowser.setPath( fin.Path, false, { lockHistory: true } );
					}
					winobj.refresh();
				}
			}
		}: false,
		!isMobile ? {
			element: 'button',
			className: 'Forward IconSmall fa-arrow-right',
			content: i18n( 'i18n_dir_btn_forward' ),
			onclick: function( e )
			{
				// If we're not at the end of the history array, go forward
				if( dw.pathHistoryIndex < dw.pathHistory.length - 1 )
				{
					var fin = dw.pathHistoryForward();
					dw.window.fileInfo = fin;
					
					if( !isMobile && winobj.fileBrowser )
					{
						winobj.fileBrowser.setPath( fin.Path, false, { lockHistory: true } );
					}
					winobj.refresh();
				}
			}
		}: false,
		{
			element: 'button',
			className: 'Reload IconSmall fa-refresh',
			content: i18n( 'i18n_dir_btn_reload' ),
			onclick: function( e )
			{
				winobj.refresh();
			}
		},
		{
			element: 'toggle-group',
			align: 'center',
			buttons: [
				{
					element: 'button',
					value: 'iconview',
					className: 'IconView IconSmall fa-th-large' + ( lmode == 'iconview' ? ' Active' : '' ),
					content: i18n( 'i18n_dir_btn_iconview' ),
					onclick: function( e )
					{
						winobj.directoryview.listMode = 'iconview';
						winobj.refresh();
						this.parentNode.checkActive( this.value );
					}
				},
				{
					element: 'button',
					value: 'iconview',
					className: 'IconView IconSmall fa-picture-o' + ( lmode == 'imageview' ? ' Active' : '' ),
					content: i18n( 'i18n_dir_btn_imageview' ),
					onclick: function( e )
					{
						winobj.directoryview.listMode = 'imageview';
						winobj.refresh();
						this.parentNode.checkActive( this.value );
					}
				},
				{
					element: 'button',
					value: 'compact',
					className: 'IconCompact IconSmall fa-th' + ( lmode == 'compact' ? ' Active' : '' ),
					content: i18n( 'i18n_dir_btn_compact' ),
					onclick: function( e )
					{
						winobj.directoryview.listMode = 'compact';
						winobj.refresh();
						this.parentNode.checkActive( this.value );
					}
				},
				{
					element: 'button',
					value: 'listview',
					className: 'ListView IconSmall fa-list' + ( lmode == 'listview' ? ' Active' : '' ),
					content: i18n( 'i18n_dir_btn_listview' ),
					onclick: function( e )
					{
						winobj.directoryview.listMode = 'listview';
						winobj.refresh();
						this.parentNode.checkActive( this.value );
					}
				}
			]
		},
		{
			element: 'button',
			className: 'DriveGauge FloatRight IconSmall fa-hdd',
			content: i18n( 'i18n_diskspace' ),
			onclick: function( e ){}
		}
	];

	this.buttonUp = buttons[0];

	// Non System gets makedir
	if( rpath.substr( 0, 7 ) != 'System:' )
	{
		buttons.push( {
			element: 'button',
			className: 'Makedir FloatRight IconSmall',
			content: i18n( 'i18n_create_container' ),
			onclick: function( e )
			{
				Workspace.newDirectory();
			}
		} );
	}
	
	buttons.push( {
		element: 'button',
		className: 'Search FloatRight IconSmall',
		content: i18n( 'i18n_search' ),
		onclick: function( e )
		{
			Workspace.showSearch( dw.window.fileInfo.Path, dw.window );
		}
	} );

	function renderButton( btn, par )
	{
		var d = document.createElement( btn.element );
		if( btn.content )
			d.innerHTML = btn.content;
		d.className = btn.className + ' ' + btn.icon;
		d.onclick = btn.onclick;
		if( btn.value )
			d.value = btn.value;
		d.addEventListener( 'touchstart', d.onclick, false );
		par.appendChild( d );
	}

	// Process!
	for( var a in buttons )
	{
		if( !buttons[a] ) continue;
		if( buttons[a].element == 'toggle-group' )
		{
			var ele = document.createElement( 'div' );
			buttons[a].domElement = ele;
			ele.className = 'ToggleGroup';
			ele.className += ' ' + buttons[a].align;
			ele.checkActive = function( value )
			{
				var eles = this.getElementsByTagName( 'button' );
				for( var z = 0; z < eles.length; z++ )
				{
					if( eles[z].value == value )
					{
						eles[z].classList.add( 'Active' );
					}
					else eles[z].classList.remove( 'Active' );
				}
			}
			for( var b in buttons[a].buttons )
			{
				var bt = buttons[a].buttons[b];
				renderButton( bt, ele );
			}
			t.appendChild( ele );
		}
		else
		{
			renderButton( buttons[ a ], t );
		}
	}

	// Move content and gauge
	winobj.style.top = ( GetElementHeight( t ) + parseInt( t.style.top.split( 'px' ).join( '' ) ) ) + 'px';
	if( winobj.parentNode.volumeGauge )
	{
		var g = winobj.parentNode.volumeGauge.parentNode;
		g.style.top = winobj.style.top;
	}
}

DirectoryView.prototype.ShowFileBrowser = function()
{
	if( this.windowObject.fileInfo && (
		this.windowObject.fileInfo.Path.indexOf( 'System:' ) == 0 ||
		this.windowObject.fileInfo.Dormant ||
		( this.windowObject.fileInfo.Door && this.windowObject.fileInfo.Door.dormantDoor )
	) )
	{
		return;
	}
	
	var self = this;
	
	// Create the file browser
	var winobj = this.windowObject;
	
	var isShowing = winobj.fileBrowserDom && winobj.fileBrowserDom.parentNode;
	
	if( !isShowing && winobj.classList.contains( 'Content' ) )
	{
		var d = document.createElement( 'div' );
		if( this.sidebarbackground )
		{
			d.className = 'FileBrowserContainer BackgroundHeavier ScrollBarSmall SmoothScrolling';
		}
		else 
		{
			d.className = 'FileBrowserContainer ScrollBarSmall';
			d.style.background = 'none';
		}
		
		// Figure out where to place the bookmarks
		var bm = this.bookmarks;
		if( !bm )
		{
			bm = winobj;
		}
		bm.appendChild( d );
		
		// Register where the bookmarks are placed
		winobj.fileBrowserDom = d;
		if( !self.bookmarks )
			self.bookmarks = d;
			
		// Go instantiate!
		winobj.fileBrowser = new Friend.FileBrowser( d, {
			path: winobj.fileInfo.Path, 
			displayFiles: false, 
			justPaths: self.filedialog || self.hasSidebar, 
			filedialog: self.filedialog 
		}, 
		{
			checkFile( filepath, fileextension )
			{
				//console.log( filepath + ' on ' + fileextension );
			},
			loadFile( filepath, event, flags )
			{
				// 
			},
			folderOpen( path, event, flags )
			{
				var vol = path.split( ':' )[0];
			
				winobj.fileInfo = {
					Path: path,
					Volume: vol + ':',
					Door: ( new Door( vol + ':' ) )
				};
				winobj.fileInfo.Door.cancelId = self.cancelId;
				var lockH = flags && flags.lockHistory;
				if( !lockH )
				{
					var vol = path.split( ':' )[0];
					self.addToHistory( winobj.fileInfo );
				}
				winobj.refresh( false, false, false, false, false, event );
			},
			folderClose( path, event, flags )
			{
				var vol = path.split( ':' )[0];
				
				winobj.fileInfo = {
					Path: path,
					Volume: vol + ':',
					Door: ( new Door( vol + ':' ) )
				};
				winobj.fileInfo.Door.cancelId = self.cancelId;
				
				var lockH = flags && flags.lockHistory;
				if( !lockH )
				{
					var vol = path.split( ':' )[0];
					self.addToHistory( winobj.fileInfo );
				}
				winobj.refresh( false, false, false, false, false, event );
			}
		} );
		winobj.fileBrowser.cancelId = winobj.directoryview.cancelId;
		winobj.fileBrowser.render();
	}
}

// -----------------------------------------------------------------------------
DirectoryView.prototype.InitWindow = function( winobj )
{
	if( !this.toolbar && this.navMode == 'toolbar' ) this.initToolbar( winobj );

	winobj.directoryview = this;
	this.windowObject = winobj;
	winobj.parentNode.classList.add( 'IconWindow' );
	winobj.redrawtimeouts = [];
	
	if( winobj.fileInfo )
	{
		// Initial path
		this.pathHistory = [ winobj.fileInfo ];
	}
	
	// Add context menu
	if( !winobj.oldContextMenuEvent ) winobj.oldContextMenuEvent = winobj.oncontextmenu;
	winobj.addEventListener( 'contextmenu', function( e )
	{
		var tr = e.target ? e.target : e.srcObject;
		// Enable default behavior on the context menu instead
		if( tr.classList && tr.classList.contains( 'DefaultContextMenu' ) )
		{
			e.defaultBehavior = true;
			return;
		}
		if( !window.isMobile )
		{
			Workspace.showContextMenu( false, e );
		}
		return cancelBubble( e );
	} );

	// On scrolling, don't do the menu!
	winobj.addEventListener( 'scroll', function(e)
	{
		 window.fileMenuElement = false;
		 window.clickElement = false;
		 if( window.menuTimeout )
			clearTimeout( window.menuTimeout );
	}, true );


	winobj.redrawBackdrop = function()
	{
		if( Workspace.winsdowWallpaperImage != undefined && Trim( Workspace.windowWallpaperImage ) && Workspace.windowWallpaperImage.length )
		{
			this.style.backgroundImage = 'url(\'' + getImageUrl( Workspace.windowWallpaperImage ) + '\')';
			this.style.backgroundPosition = 'top left';
			this.style.backgroundRepeat = 'repeat';
		}
		else
		{
			this.style.backgroundImage = '';
		}
	}
	winobj.redrawBackdrop();

	winobj.checkSelected = function ()
	{
		var eles = this.getElementsByTagName( 'div' );
		var selectedCount = 0;
		for( var a = 0; a < eles.length; a++ )
		{
			if( !eles[a].classList && !eles[a].classList.contains( 'Selected' ) )
				continue;
			selectedCount++;
		}
		
		Friend.iconsSelectedCount = selectedCount;
	},
	// -------------------------------------------------------------------------
	winobj.completeRedraw = function()
	{
		if( this.redrawing )
		{
			this.redrawing = false;
			if( this.queuedRedraw )
			{
				this.queuedRedraw();
				this.queuedRedraw = null;
			}
		}
	}
	// When resizing the window
	winobj.redrawIcons = function( icons, direction, callback )
	{
		var dirv = this.directoryview;
		
		if( dirv.window.fileBrowser )
		{
			// Correct file browser
			dirv.window.fileBrowser.setPath( winobj.fileInfo.Path );
		}
		
		// Assign icons now
		// Store
		if( icons )
		{
			this.icons = icons;
			this.allIcons = icons;
		}
		
		// When we have a toolbar and no file browser, remove up on root paths
		
		var dormantDrive = winobj.fileInfo && (
			winobj.fileInfo.Path.indexOf( 'System:' ) == 0 ||
			winobj.fileInfo.Dormant ||
			( winobj.fileInfo.Door && winobj.fileInfo.Door.dormantDoor )
		);
		
		if( dirv.toolbar && dormantDrive )
		{
			var upb = dirv.toolbar.querySelector( '.Up' );
			if( upb )
			{
				if( winobj.fileInfo && winobj.fileInfo.Path.substr( winobj.fileInfo.Path.length - 1, 1 ) == ':' )
				{
					upb.style.display = 'none';
				}
				else
				{
					upb.style.display = '';
				}
			}
		}
		
		// Start with a path
		if( dirv.startPath )
		{
			winobj.fileInfo.Path = dirv.startPath;
			dirv.startPath = false;
		}
		
		// Mobile animations
		if( isMobile )
		{
			// Enforce icon view for mobile
			dirv.listMode = 'iconview';
			var changed = false;
			if( !this._redrawPath || !winobj.fileInfo || this._redrawPath != winobj.fileInfo.Path )
			{
				changed = true;
				this._redrawPath = winobj.fileInfo ? winobj.fileInfo.Path : null;
			}
			
			if( changed )
			{
				if( dirv.bookmarks && !dirv.bookmarks.classList.contains( 'ScreenContent' ) )
				{
					// Bookmarks
					if( !dirv.animationsSet )
					{
						dirv.bookmarks.style.width = '100%';
						dirv.bookmarks.style.left = '0';
						dirv.bookmarks.style.transition = 'transform 0.4s';
						
						// Filearea is always put in a container
					
						dirv.filearea.parentNode.style.left = '0';
						dirv.filearea.parentNode.style.width = '100%';
						dirv.filearea.parentNode.style.transition = 'transform 0.4s';
						dirv.filearea.style.transition = 'transform 0.4s';
						
						dirv.animationsSet = true;
					}
				
					if( winobj.fileInfo.Path == 'Mountlist:' )
					{
						if( dirv.filearea.parentNode.classList.contains( 'View' ) )
						{
							dirv.filearea.style.transform = 'translate3d(100%,0,0)';
						}
						else
						{
							dirv.filearea.parentNode.style.transform = 'translate3d(100%,0,0)';
						}
						dirv.bookmarks.style.transform = 'translate3d(0%,0,0)';
						winobj.parentNode.classList.add( 'Mountlist' );
						dirv.ShowFileBrowser();
						winobj.windowObject.setFlag( 'title', i18n( 'i18n_mountlist' ) );
						return;
					}
					else
					{
						if( dirv.filearea.parentNode.classList.contains( 'View' ) )
						{
							dirv.filearea.style.transform = 'translate3d(0%,0,0)';
						}
						else 
						{
							dirv.filearea.parentNode.style.transform = 'translate3d(0%,0,0)';
						}
						dirv.bookmarks.style.transform = 'translate3d(-100%,0,0)';
						winobj.parentNode.classList.remove( 'Mountlist' );
					}
				}
			}
		}
		
		// For screen icons
		if( winobj.classList && winobj.classList.contains( 'ScreenContent' ) )
		{
			this.directoryview.mode = 'Volumes';
			if( !window.isMobile )
			{
				if( globalConfig.scrolldesktopicons == 1 )
					this.classList.add( 'DrivePanel' );
				else this.classList.remove( 'DrivePanel' );
			}
		}
		else
		{
			this.directoryview.mode = 'Files';
		}

		// Blocking? Wait with call
		if( this.redrawing )
		{
			// This will overwrite the queued redraw with updated data
			this.queuedRedraw = function()
			{
				winobj.redrawIcons( icons, direction );
			};
			return;
		}

		this.redrawing = true;

		if( direction ) this.direction = direction;

		// Clean icons
		var out = [];
		var loaded = 1;
		if( typeof this.noRun == 'undefined' )
		{
			this.noRun = 0;
			this.noRunPath = '';
		}
		
		// Filter icons
		if( this.icons )
		{
			for( var a = 0; a < this.icons.length; a++ )
			{
				var i = this.icons[a];
				var o = {};
				for( var t in i )
				{
					switch( t )
					{
						case 'domNode':
						case '__proto__':
							break;
						default:
							o[t] = i[t];
							break;
					}
				}
				
				// Special case - put Home disks first
				if( i.Type == 'Door' )
				{
					if( i.Config && i.Config.visibility == 'hidden' ) 
					{
						continue;
					}
					if( i.Title != 'Home' )
						o.SortPriority = 1;
					else o.SortPriority = 0;
				}
				if( i.Filename )
				{
					if( i.Filename.indexOf( '.' ) > 0 )
					{
						o.Extension = i.Filename.split( '.' );
						o.Extension = o.Extension.length > 1 ? o.Extension[o.Extension.length-1].toLowerCase() : '!';
					}
					else
					{
						o.Extension = i.MetaType ? i.MetaType.toLowerCase() : i.Type.toLowerCase();
						if( i.MetaType == 'meta' ) o.Extension = i.Type.toLowerCase();
					}
				}
				else if( i.Title )
				{
					o.Extension = i.MetaType ? i.MetaType.toLowerCase() : i.Type.toLowerCase();
				}
				if( i.Filesize )
				{
					// TODO: Perhaps not big enough with 32 decimals?
					o.SizeSortable = StrPad( i.Filesize, 32, '0' );
				}
				out.push( o );
			}

			var self = this;
			var handle;
			var timeOfStart = new Date().getTime();
			
			if( loaded == 0 )
				handle = setInterval( checkIcons, 500 );
		 	
		 	checkIcons();
			
			function checkIcons()
			{
				if( loaded == 0 )
				{
					if ( new Date().getTime() < timeOfStart + 1000 )
					{
						self.completeRedraw();
						return;
					}
				}
				
				if( handle )
					clearInterval( handle );

				if( loaded <= 0 )
				{
					self.completeRedraw();
					return;
				}

				self.icons = out;

				// Sort and add cleaned icons
				if( out.length )
				{
					if( self.directoryview.sortColumn == 'filename' )
					{
						self.icons = sortArray( out, [ 'SortPriority', 'Title', 'Filename' ], self.directoryview.sortOrder );
					}
					else if( self.directoryview.sortColumn == 'type' )
					{
						self.icons = sortArray( out, [ 'SortPriority', 'Extension', 'Title', 'Filename' ], self.directoryview.sortOrder );
					}
					else if( self.directoryview.sortColumn == 'size' )
					{
						self.icons = sortArray( out, [ 'SortPriority', 'SizeSortable', 'Title', 'Filename' ], self.directoryview.sortOrder );
					}
					else
					{
						self.icons = sortArray( out, [ 'SortPriority', 'DateModified', 'Title', 'Filename' ], self.directoryview.sortOrder );
					}
				}

				self.directoryview.changed = true;

				// Make sure the menu is refreshed due to icon selection
				if( self.parentNode && ( self.parentNode == currentMovable || ( !currentMovable && self.parentNode == currentScreen ) ) )
				{
					Workspace.refreshMenu();
				}

				// Check if window has scroll
				function checkScrl()
				{
					if( !self.content || !self.content.firstChild ) return;
					if( self.content.offsetHeight < self.content.firstChild.scrollHeight )
					{
						self.content.parentNode.classList.add( 'Scrolling' );
					}
					else
					{
						self.content.parentNode.classList.remove( 'Scrolling' );					
					}
				}

				// Check directory listmode
				var lm = self.directoryview.listMode;
				switch( lm )
				{
					case 'compact':
					case 'imageview':
					case 'iconview':
					{
						setTimeout( function(){ self.completeRedraw(); }, 250 );
						CheckScreenTitle();
						var res = self.directoryview.RedrawIconView( self.directoryview.filearea, self.icons, direction, lm );
						if( callback ) callback();
						checkScrl();
						return res;
					}
					case 'listview':
					{
						setTimeout( function(){ self.completeRedraw(); }, 25 ); // to help with column resizing, lower resize timeout
						CheckScreenTitle();
						var res = self.directoryview.RedrawListView( self.directoryview.filearea, self.icons, direction );
						if( callback ) callback();
						checkScrl();
						return res;
					}
					case 'columnview':
					{
						setTimeout( function(){ self.completeRedraw(); }, 250 );
						CheckScreenTitle();
						var res = self.directoryview.RedrawColumnView( self, self.icons, direction );
						if( callback ) callback();
						checkScrl();
						return res;
					}
				}
				self.completeRedraw();
			}
		}
		return false;
	}

	// -------------------------------------------------------------------------
	winobj.parentNode.rollOver = function ( eles )
	{
		//SetOpacity ( this, 0.8 );
		this.classList.add( 'DragTarget' );
		window.targetMovable = this;
	}

	// -------------------------------------------------------------------------
	winobj.parentNode.rollOut = function ( eles )
	{
		this.classList.remove( 'DragTarget' );
		//SetOpacity ( this, 1 );
	}

	// -------------------------------------------------------------------------
	// FOR UPLOAD! if host support drag & drop we want to use that FOR UPLOAD!!!
	if( window.File && window.FileReader && window.FileList && window.Blob )
	{
		function handleHostDragOver( e )
		{
			e.stopPropagation();
			e.preventDefault();

			this.classList.add( 'DragTarget' );
		}

		function handleHostDragOut( e )
		{
			this.classList.remove( 'DragTarget' );
		}

		// formatted is used to handle a formatted, recursive list
		function handleHostFileSelect( e )
		{	
			var hasDownload = false;
			
			function makeTransferDirectory()
			{
				// Check the destination
				var d = new Door( 'Home:' );
				d.cancelId = winobj.directoryview.cancelId;
				d.getIcons( 'Home:', function( items )
				{
					for( var a = 0; a < items.length; a++ )
					{
						if( items[a].Path == 'Home:Downloads/' )
						{
							hasDownload = true;
							return;
						}
					}
					if( !hasDownload )
					{
						d.dosAction( 'makedir', { path: 'Home:Downloads/' }, function( result )
						{
							if( result.substr( 0, 3 ) == 'ok<' )
							{
								hasDownload = true;
							}
							else
							{
								Alert( 'Error uploading', 'The Home:Downloads/ folder could not be created.' );
								hasDownload = 'aborted';
							}
						} );
					}
				} );
			}
			
			// Make sure we have it
			makeTransferDirectory();
			// Do the actual transfer
			doTheTransfer();
			
			// Prevent default behavior
			e.stopPropagation();
			e.preventDefault();
			
			// When everything is ready start the transfer
			function doTheTransfer()
			{
				var permItems = e.dataTransfer ? e.dataTransfer.items : null;
				var files = e.dataTransfer.files || e.target.files;

				if( files.length < 1 ) 
				{
					Notify( { title: 'Nothing to upload', text: 'The upload data was incomplete.' } );
					return;
				}
			
				var di = winobj;
			
				var info = false;
				if( files && !di.content && ( di.classList.contains( 'Screen' ) || di.classList.contains( 'ScreenContent' ) ) )
				{
					info = {
						'session': Workspace.sessionId,
						'targetPath': 'Home:Downloads/',
						'targetVolume': 'Home:',
						'files': files
					};
				}
				// TODO: Fix here
				else if( files && winobj.fileInfo && winobj.fileInfo.Volume )
				{
					info = {
						'session': Workspace.sessionId,
						'targetPath': winobj.fileInfo.Path,
						'targetVolume': winobj.fileInfo.Volume,
						'files': files
					};
				}
				else
				{
					Notify( { title: 'Illegal upload target', text: 'Please upload to the desktop or a disk or folder.' } );
					return;
				}
			
				// Setup a file copying worker
				var uworker = new Worker( 'js/io/filetransfer.js' );
			
				// Try recursion!
				// TODO: Enable again when safe!!
				if( permItems )
				{
					info.files = [];
					info.queued = true;
				
					var num = 0;
					var finalElements = [];
				
					// Wait till the elements are all counted
					var isBusy = true;
					var busyTimeout = null;
					function busyChecker()
					{
						if( busyTimeout || hasDownload == false || hasDownload == 'aborted' )
							clearTimeout( busyTimeout );
						// Aborted
						if( hasDownload == 'aborted' )
							return;
						busyTimeout = setTimeout( function()
						{
							if( isBusy )
							{
								isBusy = false;
								uworker.postMessage( { 
									recursiveUpdate: true, 
									executeQueue: true, 
									session: info.session, 
									targetPath: info.targetPath, 
									targetVolume: info.targetVolume 
								} );
							}
						}, 500 );
					}
			
					function toArray( list )
					{
						return Array.prototype.slice.call( list || [], 0 );
					}

					function countItems( items )
					{
						for ( var i = 0, l = items.length; i < l; i++ )
						{
							countItem( items[ i ] );
						}
					}

					function sendItem( itm )
					{
						if( itm.file )
						{
							console.log( 'Posting file: ', itm.file );
							itm.file( function( f )
							{
								var ic = new FileIcon(); ic.delCache( itm.fullPath );
								uworker.postMessage( { recursiveUpdate: true, item: f, fullPath: itm.fullPath, size: f.size, session: Workspace.sessionId } );
							} );
						}
						else
						{
							console.log( 'Making directory: ', itm.fullPath );
							uworker.postMessage( { recursiveUpdate: true, item: 'directory', fullPath: itm.fullPath, session: Workspace.sessionId } );
						}
						busyChecker();
					}

					function countEntry( entry )
					{
						if( entry.isDirectory )
						{
							var dirReader = entry.createReader();
							var num = 0;
							var readEntries = function()
							{
								dirReader.readEntries( function( results )
								{
									sendItem( entry, 'directory' );
									if( results.length )
									{
										for( var a = 0; a < results.length; a++ )
										{
											countEntry( results[ a ] );
										}
									}
								} );
							};
							readEntries();
						} 
						else 
						{
							sendItem( entry );
						}
					}

					function countItem( item )
					{
						var entry = item.getAsEntry || item.webkitGetAsEntry();
						if( entry.isDirectory )
						{
							var dirReader = entry.createReader();
							var num = 0;
							var readEntries = function()
							{
								dirReader.readEntries( function( results )
								{
									sendItem( entry, 'directory' );
									if( results.length )
									{
										for( var a = 0; a < results.length; a++ )
										{
											countEntry( results[ a ] );
										}
									}
								} );
							};
							readEntries();
						} 
						else 
						{
							sendItem( entry );
						}
					}
					countItems( permItems );
				}

				if( info )
				{
					// TODO: to detect read only filesystem!
					if( info.targetVolume == 'System:' || info.targetPath.split( ':' )[0] == 'System' )
					{
						Alert( i18n( 'i18n_read_only_filesystem' ), i18n( 'i18n_read_only_fs_desc' ) );
						return false;
					}

					// Open window
					var w = new View( {
						title:  i18n( 'i18n_copying_files' ),
						width:  320,
						height: 100
					} );

					var uprogress = new File( 'templates/file_operation.html' ); 
					uprogress.connectedworker = uworker;

					uprogress.onLoad = function( data )
					{
						data = data.split( '{cancel}' ).join( i18n( 'i18n_cancel' ) );
						w.setContent( data );

						w.connectedworker = this.connectedworker;
						w.onClose = function()
						{
							Workspace.diskNotification( [ winobj ], 'refresh' );
							if( this.connectedworker ) this.connectedworker.postMessage({'terminate':1});
						}

						uprogress.myview = w;

						// Setup progress bar
						var eled = w.getWindowElement().getElementsByTagName( 'div' );
						var groove = false, bar = false, frame = false, progressbar = false;
						for( var a = 0; a < eled.length; a++ )
						{
							if( eled[a].className )
							{
								var types = [ 'ProgressBar', 'Groove', 'Frame', 'Bar', 'Info' ];
								for( var b = 0; b < types.length; b++ )
								{
									if( eled[a].className.indexOf( types[b] ) == 0 )
									{
										switch( types[b] )
										{
											case 'ProgressBar': progressbar    = eled[a]; break;
											case 'Groove':      groove         = eled[a]; break;
											case 'Frame':       frame          = eled[a]; break;
											case 'Bar':         bar            = eled[a]; break;
											case 'Info':		uprogress.info = eled[a]; break;
										}
										break;
									}
								}
							}
						}


						//activate cancel button... we assume we only hav eone button in the template
						var cb = w.getWindowElement().getElementsByTagName( 'button' )[0];

						cb.mywindow = w;
						cb.onclick = function( e )
						{
							uworker.terminate(); // End the copying process
							this.mywindow.close();
						}

						// Only continue if we have everything
						if( progressbar && groove && frame && bar )
						{
							progressbar.style.position = 'relative';
							frame.style.width = '100%';
							frame.style.height = '40px';
							groove.style.position = 'absolute';
							groove.style.width = '100%';
							groove.style.height = '30px';
							groove.style.top = '0';
							groove.style.left = '0';
							bar.style.position = 'absolute';
							bar.style.width = '2px';
							bar.style.height = '30px';
							bar.style.top = '0';
							bar.style.left = '0';

							// Preliminary progress bar
							bar.total = files.length;
							bar.items = files.length;
							uprogress.bar = bar;
						}
						uprogress.loaded = true;
						uprogress.setProgress( 0 );
					}

					// For the progress bar
					uprogress.setProgress = function( percent )
					{
						// only update display if we are loaded...
						// otherwise just drop and wait for next call to happen ;)
						if( uprogress.loaded )
						{
							uprogress.bar.style.width = Math.floor( Math.max(1,percent ) ) + '%';
							uprogress.bar.innerHTML = '<div class="FullWidth" style="text-overflow: ellipsis; text-align: center; line-height: 30px; color: white">' +
							Math.floor( percent ) + '%</div>';
						}
					};

					// show notice that we are transporting files to the server....
					uprogress.setUnderTransport = function()
					{
						uprogress.info.innerHTML = '<div id="transfernotice" style="padding-top:10px;">' +
							'Transferring files to target volume...</div>';
						uprogress.myview.setFlag( 'height', 125 );
					}

					// An error occurred
					uprogress.displayError = function( msg )
					{
						uprogress.info.innerHTML = '<div style="color:#F00; padding-top:10px; font-weight:700;">'+ msg +'</div>';
						uprogress.myview.setFlag( 'height', 140 );
					}

					// Error happened!
					uworker.onerror = function( err )
					{
						console.log( 'Upload worker error #######' );
						console.log( err );
						console.log( '###########################' );
					};
					uworker.onmessage = function( e )
					{
						if( e.data['progressinfo'] == 1 )
						{
							if( e.data['uploadscomplete'] == 1 )
							{
								w.close();
								if( winobj && winobj.refresh )
									winobj.refresh();

								Notify( { title: i18n( 'i18n_upload_completed' ), 'text':i18n('i18n_uploaded') }, false, function()
								{
									OpenWindowByFileinfo( { Title: 'Downloads', Path: 'Home:Downloads/', Type: 'Directory', MetaType: 'Directory' } );
								} );
								return true;
							}
							else if( e.data['progress'] )
							{
								uprogress.setProgress( e.data['progress'] );
								if( e.data['filesundertransport'] && e.data['filesundertransport'] > 0 )
								{
									uprogress.setUnderTransport();
								}
							}

						}
						else if( e.data['error'] == 1 )
						{
							uprogress.displayError(e.data['errormessage']);
						}

					}

					uprogress.load();

					uworker.postMessage( info );
				}
				else
				{
					console.log( 'We got nothing.', this );
				}
			}
		}

		winobj.parentNode.addEventListener( 'dragleave', handleHostDragOut,    false );
		winobj.parentNode.addEventListener( 'dragover',  handleHostDragOver,   false );
		winobj.parentNode.addEventListener( 'drop',      handleHostFileSelect, false );
		winobj.parentNode.addEventListener( 'drop',      handleHostDragOut,    false );

	} // end of check for html5 file upload capabilities

	winobj.parentNode.drop = this.doCopyOnElement;


	// Just update in case we're the active view!
	if( winobj.parentNode == currentMovable )
		WorkspaceMenu.show();
}

// -------------------------------------------------------------------------
DirectoryView.prototype.GetTitleBar = function ()
{
	if ( window.currentScreen )
	{
		return window.currentScreen.firstChild;
	}
	return false;
}

// Redraw the iconview mode ----------------------------------------------------
DirectoryView.prototype.RedrawIconView = function ( obj, icons, direction, option, flags )
{
	var self = this;
		
	if( this.rendering ) return;
	this.rendering = true;
	
	// Remove and clean up listview
	if( this.viewMode != 'iconview' )
	{
		if( this.scroller )
		{
			this.scroller.parentNode.removeChild( this.scroller );
			this.scroller = false;
		}
		if( this.listView && this.listView.parentNode )
		{
			this.listView.parentNode.removeChild( this.listView );
		}
		this.listView = null;
		this.head = null;
	}
	
	// Set new viewmode
	this.viewMode = 'iconview';
	
	if( !isMobile )
		this.ShowFileBrowser();
	
	// Remember scroll top
	var stop = 0;
	var slef = 0;
	
	var sc = this.scroller;
	
	var er = obj.getElementsByClassName( 'loadError' )
	if( er.length )
	{
		obj.removeChild( er[0] );
		er = null;
	}
	
	// Existing scroller
	if( sc && sc.parentNode )
	{
		if( sc.scrollTop )
		{
			stop = sc.scrollTop;
			slef = sc.scrollLeft;
		}
	}
	else
	{
		sc = document.createElement ( 'div' );
		sc.style.position = 'relative';
		sc.className = 'Scroller';
		obj.appendChild( sc );

		// TODO: We will not use overflow-x unless we turn off autosorting of icons
		if( icons.length )
		{
			if( icons[0].Type != 'Door' && icons[0].Type != 'Dormant' && sc.parentNode.parentNode != ge( 'DoorsScreen' ) )
			{
				sc.style.overflowX = 'hidden';
			}
		}

		this.scroller = sc;
	}
	
	// Remove loading animation
	if( obj.getElementsByClassName( 'LoadingAnimation' ).length )
	{
		var la = obj.getElementsByClassName( 'LoadingAnimation' )[0];
		la.parentNode.removeChild( la );
	}

	var windowWidth = this.scroller.offsetWidth;
	var windowHeight = this.scroller.offsetHeight - 80;
	
	// If we resized, recalculate all
	if( this.prevWidth != windowWidth || this.prevHeight != windowHeight )
	{
		if( flags )
		{
			flags.addPlaceholderFirst = false;
			// Remove placeholder
			if( this.scroller )
			{
				var pl = this.scroller.getElementsByClassName( 'Placeholder' );
				if( pl.length )
				{
					pl[0].parentNode.removeChild( pl[0] );
				}
			}
		}
	}
	
	// Store prev
	this.prevWidth = windowWidth;
	this.prevHeight = windowHeight;
	
	// Hack the shit out of timing issue with height
	if( windowHeight < 0 )
	{
		this.scroller.style.height = this.scroller.parentNode.offsetHeight + 'px';
		windowHeight = this.scroller.offsetHeight - 80;
		setTimeout( function()
		{
			self.scroller.style.height = '100%';
		}, 50 );
	}
	
	obj.direction = direction ? direction : 'horizontal';
	icons = icons ? icons : obj.icons;
	
	if ( !icons ) return;

	var dummyIcon = document.createElement( 'div' );
	dummyIcon.className = 'File';
	document.body.appendChild( dummyIcon );

	// Adapt to device width
	var mobIW = 110;
	var mobIH = 110;
	
	if( window.innerWidth <= 320 )
	{
		mobIW = 88;
		mobIH = 88;
	}

	var gridX = window.isMobile ? mobIW : 120;
	var gridY = window.isMobile ? mobIH : 110;
	
	if( option == 'compact' )
	{
		gridX = 160;
		gridY = 40;
	}
	else if( option == 'imageview' )
	{
		gridX = 240;
		gridY = 180;
	}
	
	// Get display frame
	var display = {
		top: this.scroller.scrollTop - this.scroller.offsetHeight,
		bottom: this.scroller.scrollTop + ( this.scroller.offsetHeight << 1 ),
		width: windowWidth
	};
	
	var marginTop = icons[0] && icons[0].Handler ? 10 : 0;
	var marginLeft = 20;
	var marginRight = window.innerWidth - gridX + 20 - 1;
	
	var marginBottom = 5;
	
	if( window.isMobile )
	{
		marginBottom = 25;
	}

	var ue = navigator.userAgent.toLowerCase();

	// Calculate marginLeft to center icons on mobile
	if( isMobile )
	{
		var whWidth = windowWidth;
		var columns = Math.floor( whWidth / mobIW );
		marginLeft = Math.floor( whWidth - ( mobIW * columns ) ) >> 1;
	}
	
	var iy  = marginTop; 
	var ix  = marginLeft;
	var shy = marginTop;
	var shx = marginRight - parseInt( sc.parentNode.paddingRight );
	
	var column = 0;
	var start = false;
	
	// Clear the window
	if ( this.scroller )
	{
		this.scroller.className = 'Scroller';
		this.scroller.innerHTML = '';
	}
	// Create scroller
	else
	{
		var o = document.createElement( 'div' );
		o.className = 'Scroller';
		obj.appendChild( o );
		this.scroller = o;
	}
	
	// Turn off smooth scrolling on redraw
	this.scroller.style.scrollBehavior = 'unset';
	
	// Add the placeholder real fast
	if( flags && flags.addPlaceholderFirst )
	{
		var d = document.createElement( 'div' );
		d.style.position = 'absolute';
		d.style.top = flags.addPlaceholderFirst + 'px';
		d.style.pointerEvents = 'none';
		d.style.height = gridY + 'px';
		d.style.width = gridX + 'px';
		d.className = 'Placeholder';
		this.scroller.appendChild( d );
	}

	// Start column
	var coldom = document.createElement( 'div' );
	coldom.className = 'Coldom';
	this.scroller.appendChild ( coldom );
	
	obj.icons = [];

	// Avoid duplicate filenames..
	var filenameBuf = [];

	// Loop through icons (if list of objects)
	if( typeof( icons[0] ) == 'object' )
	{
		// TODO: Lets try to make directories first optional
		var dirs = [];
		var files = [];
		
		var orphanInfoFile = {};

		for( var a = 0; a < icons.length; a++ )
		{
			if( icons[a].Type == 'File' && self.ignoreFiles ) continue;
			
			// Volumes don't sort by folders, then files
			if( this.mode == 'Volumes' )
			{
				files.push( icons[a] );
			}
			// Normal directories are listing by folders first
			else
			{
				if( icons[a].Type == 'Directory' ) 
					dirs.push( icons[a] );
				else 
					files.push( icons[a] );
			}

			var i = icons[a];
			if( i.Filename )
			{
				// Check .info
				var mInfoname = i.Filename.toLowerCase().indexOf( '.info' ) > 0 ?
					i.Filename.substr( 0, i.Filename.length - 5 ) : false;
				// Check .dirinfo
				if( !mInfoname )
				{
					mInfoname = i.Filename.toLowerCase().indexOf( '.dirinfo' ) > 0 ?
						i.Filename.substr( 0, i.Filename.length - 8 ) : false;
				}
				if( mInfoname )
				{
					if( typeof( orphanInfoFile[ mInfoname ] ) == 'undefined' )
						orphanInfoFile[ mInfoname ] = true;
					else orphanInfoFile[ mInfoname ] = false;
				}
				else
				{
					orphanInfoFile[ i.Filename ] = false;
				}
			}
		}

		icons = dirs.concat( files );

		var heightAttrs = [ 'height', 'paddingTop', 'paddingBottom' ];
		var infoIcons = {};
		for( var a = 0; a < icons.length; a++ )
		{
			var fn = icons[a].Filename ? icons[a].Filename : icons[a].Title;
			
			// Skip dot files
			if( !self.showHiddenFiles && fn.substr( 0, 1 ) == '.' ) continue;
			// Skip files with wrong suffix
			else if( icons[a].Type == 'File' && self.suffix && !self.checkSuffix( fn ) )
			{
				continue;
			}
			// Skip backup files
			else if( !self.showHiddenFiles && fn.substr( fn.length - 4, 4 ) == '.bak' )
				continue;
			else if( fn.substr( fn.length - 5, 5 ) == '.info' )
				infoIcons[ fn ] = true;
			else if( fn.substr( fn.length - 8, 8 ) == '.dirinfo' )
				infoIcons[ fn ] = true;
			else continue;
		}
		
		if( this.window.classList.contains( 'ScreenContent' ) )
		{
			var ti = GetThemeInfo( 'ScreenContentMargins' );
			if( ti.top )
			{
				marginTop += parseInt( ti.top );
				iy = marginTop;
			}
		}
		
		var contentMode = this.window.classList.contains( 'ScreenContent' ) ? 'screen' : 'view';
		
		// Draw icons
		var iterations = 0;
		for( var a = 0; a < icons.length; a++ )
		{
			// Special mode
			if( icons[a].Type == 'File' && self.ignoreFiles ) continue;
			
			var r = icons[a];
			
			var type = icons[a].MetaType;
			
			if( r.Visible === false || ( r.Config && r.Config.Invisible && r.Config.Invisible.toLowerCase() == 'yes' ) )
			{
				continue;
			}

			// TODO: Show hidden files if we _must_
		 	var fn = {
		 		Filename: icons[a].Filename ? icons[a].Filename : icons[a].Title,
		 		Type: icons[a].Type
		 	};
		 	
		 	// Skip dot files
			if( !self.showHiddenFiles && fn.Filename.substr( 0, 1 ) == '.' ) continue;
			
			// Skip files with wrong suffix
			else if( icons[a].Type == 'File' && self.suffix && !self.checkSuffix( fn ) )
			{
				continue;
			}
			
			// Skip backup files
			else if( !self.showHiddenFiles && fn.Filename.substr( fn.Filename.length - 4, 4 ) == '.bak' )
				continue;

			// Only show orphan .info files
			if( !self.showHiddenFiles && ( 
				fn.Filename.substr( fn.Filename.length - 5, 5 ) == '.info' || 
				fn.Filename.substr( fn.Filename.length - 8, 8 ) == '.dirinfo'
			) )
			{
				if( !orphanInfoFile[ fn.Filename.substr( 0, fn.Filename.length - 5 ) ] )
					continue;
			}

			// Skip duplicates
			var fnd = false;
			for( var z = 0; z < filenameBuf.length; z++ )
			{
				if( filenameBuf[z].Filename == fn.Filename && filenameBuf[z].Type == fn.Type )
				{
					fnd = true;
					break;
				}
			}
			if( fnd ) 
			{
				continue;
			}
			
			// Do not draw icons out of bounds!
			if( this.mode != 'Volumes' && ( iy > display.bottom || iy + gridY < display.top ) )
			{
				// Increment icons after first calculated icon
				if( direction == 'vertical' )
				{
					if( type == 'Shortcut' )
					{
						shy += gridY;

						if( shy + gridY > windowHeight )
						{
							shy = marginTop;
							shx -= gridX;
						}
					}
					else
					{
						iy += gridY;

						if( iy + gridY > windowHeight )
						{
							iy = marginTop;
							ix += gridX;
						}
					}
				}
				// Left to right
				else
				{
					if( type == 'Shortcut' )
					{
						shx += gridX;
						if( shx + gridX > windowWidth )
						{
							shy += gridY;
							shx = marginRight;
						}
					}
					else
					{
						ix += gridX;
						if( ix + gridX > windowWidth )
						{
							iy += gridY;
							ix = marginLeft;
						}
					}
				}
				// Make sure we push to buffer
				obj.icons.push( icons[a] );
				continue;
			}
			
			filenameBuf.push( fn );

			// TODO: What is this? :D
			if( icons[a].ElementType == 'Config' )
			{
				if ( icons[a].Toolbar )
				{
					var t = document.createElement ( 'div' );
					t.className = 'Toolbar';
					for( var q = 0; q < icons[a].Toolbar.length; q++ )
					{
						var barP = icons[a].Toolbar[q];
						var bar = document.createElement( 'div' );
						var icon = document.createElement( 'img' );
						var label = document.createElement( 'span' );
						for( var v in barP )
						{
							switch( v )
							{
								case 'Icon':
									icon.src = barP[v];
									break;
								case 'Label':
									label.innerHTML = barP[v];
									break;
								case 'OnClick':
									bar.window = winobj;
									bar.setAttribute ( 'onclick', barP[v] );
									break;
							}
						}
						bar.appendChild( icon );
						bar.appendChild( label );
						t.appendChild( bar );
					}
					obj.parentNode.appendChild( t );
					iy = 25;
					marginTop = 25;
				}
				continue;
			}
			var file;
			if( icons[a].position )
			{
				// TODO: Read position rules and place absolutely
			}
			else
			{
				if( icons[a].Type == 'Door' && !icons[a].Mounted ) continue;
				
				if( icons[a].file )
				{
					coldom.appendChild( icons[a].file );
					file = icons[a].file;
				}
				else
				{
					// Checks if the icon is
					file = CreateIcon( icons[a], this );
					file.directoryView = this;
					icons[a].file = file;
				}
				
				if( type == 'Shortcut' )
				{
					file.style.top = shy + 'px';
					file.style.left = shx + 'px';
				}
				else
				{
					file.style.top = iy + 'px';
					file.style.left = ix + 'px';
				}
				
				if( option == 'compact' ) 
				{
					file.classList.add( 'Compact' );
				}
				else if( option == 'imageview' )
				{
					file.classList.add( 'ZoomX3' );
				}
				
				coldom.appendChild( file );
				
				// Make sure the icon has bounds
				var ic = file.getElementsByClassName( 'Icon' );
				var c = window.getComputedStyle( ic[0], null );
				var title = file.getElementsByClassName( 'Title' );
				title[0].style.overflow = 'hidden';

				// Usually drawing from top to bottom
				if( direction == 'vertical' )
				{
					if( contentMode == 'screen' )
					{
						if( type == 'Shortcut' )
							shy += file.offsetHeight + marginTop;
						else iy += file.offsetHeight + marginTop;
					}
					else
					{
						if( type == 'Shortcut' )
							shy += gridY;
						else iy += gridY;
					}

					var cond = type == 'Shortcut' ? shy : iy;
					if( !( globalConfig.scrolldesktopicons == 1 && this.mode == 'Volumes' ) && cond + gridY > windowHeight )
					{
						if( type == 'Shortcut' )
						{
							shy = marginTop;
							shx -= gridX;
						}
						else
						{
							iy = marginTop;
							ix += gridX;
						}
						coldom = document.createElement ( 'div' );
						coldom.className = 'Coldom';
						this.scroller.appendChild( coldom );
					}
				}
				// Left to right
				else
				{
					ix += gridX;
					if( ix + gridX > windowWidth )
					{
						iy += gridY;
						ix = marginLeft;
						coldom = document.createElement ( 'div' );
						coldom.className = 'Coldom';
						this.scroller.appendChild( coldom );
					}
				}
			}
			if( typeof( file ) == 'object' )
			{
				file.window = obj;
				// TODO: This doesn't work! How to get icon dropping!
				file.rollOver = function( eles )
				{
					SetOpacity( obj.domNode, 0.8 );
				}
				file.rollOut = function( eles )
				{
					SetOpacity( obj.domNode, 1 );
				}
				icons[a].domNode = file;
				icons[a].domNode.icon = icons[a];
				obj.icons.push( icons[a] );
			}
			if( typeof ( obj.parentNode ) != 'undefined' && obj.parentNode.refreshWindow )
			{
				obj.parentNode.refreshWindow();
			}
		}
	}

	// Store inner height for later use
	this.innerHeight = iy + gridY;
	
	// Force scrolling
	var d = this.scroller.querySelector( '.Placeholder' );
	if( !d )
	{
		d = document.createElement( 'div' );
		d.style.position = 'absolute';
		d.style.top = iy + 'px';
		d.style.pointerEvents = 'none';
		d.style.height = gridY + 'px';
		d.style.width = gridX + 'px';
		d.className = 'Placeholder';
		this.scroller.appendChild( d );
	}
	else
	{
		d.style.height = gridY + 'px';
	}
	// Done force scrolling

	this.scroller.scrollTop = stop;
	this.scroller.scrollLeft = slef;

	// Remove dummy icon
	document.body.removeChild( dummyIcon );
	
	// We are loaded!
	this.scroller.classList.add( 'Loaded' );
	
	// Normal scrolling again
	this.scroller.style.scrollBehavior = '';
	
	// Handle scrolling
	this.refreshScrollTimeout = false;
	this.scroller.onscroll = function( e )
	{
		// Only handle scroll if it changed
		if( !self.scrollerTop || self.scrollerTop != self.scroller.scrollTop )
		{
			self.scrollerTop = self.scroller.scrollTop;
		}
		else return;
		
		if( self.refreshScrollTimeout )
		{
			clearTimeout( self.refreshScrollTimeout );
			self.refreshScrollTimeout = false;
		}
		self.refreshScrollTimeout = setTimeout( function()
		{
			// Don't redraw icon view if we have elements
			if( !( mousePointer.elements && mousePointer.dom && mousePointer.dom.firstChild ) )
			{
				self.RedrawIconView( obj, icons, direction, option, { addPlaceholderFirst: iy } );
			}
			self.refreshScrollTimeout = false;
		}, 50 );
	};
	
	// Ok, done
	this.rendering = false;
}

// Try to resize
DirectoryView.prototype.ResizeToFit = function( obj )
{
	// Better size if possible
	if( obj.windowObject )
	{
		var windId = obj.windowObject.getViewId();
		var storage = GetWindowStorage( windId );
		if( this.innerHeight > obj.offsetHeight && !storage )
		{
			obj.windowObject.setFlag( 'height', this.innerHeight );
			SetWindowStorage( windId, { height: this.innerHeight } );
		}
	}
}

// Select all
DirectoryView.prototype.SelectAll = function()
{
	if( this.multiple )
	{
		var ics = this.window.icons;
		for( var a = 0; a < ics.length; a++ )
		{
			ics[a].selected = 'multiple';
			if( ics[a].domNode )
			{
				ics[a].domNode.classList.add( 'Selected' );
				ics[a].domNode.selected = 'multiple';
				ics[a].domNode.icon.selected = 'multiple';
			}
			if( ics[a].fileInfo )
				ics[a].fileInfo.selected = 'multiple';
		}
	}
}

// -------------------------------------------------------------------------
// Makes a listview
DirectoryView.prototype.RedrawListView = function( obj, icons, direction )
{
	if( this.viewMode != 'listview' )
	{
		if( this.scroller )
		{
			this.scroller.parentNode.removeChild( this.scroller );
			this.scroller = false;
		}	
	}
	
	this.viewMode = 'listview';

	var self = this;
	
	// TODO: Direction not needed here
	obj.direction = direction ? direction : 'horizontal';
	icons = icons ? icons : obj.icons;

	var dv = this;

	obj.window = this.window;

	// Fill the list (TODO: Repopulate existing listview to reduce flicker)
	if( typeof( icons[0] ) == 'object' )
	{
		// TODO: Lets try to make directories first optional
		var dirs = [];
		var files = [];
		for( var a = 0; a < icons.length; a++ )
		{
			if( icons[a].Type == 'Directory' ) dirs.push( icons[a] );
			else files.push( icons[a] );
		}
		icons = dirs.concat( files );
	}

	// Have we rendered before?
	var changed = true;
	var r = false;
	
	// If this isn't changed explicitly, look for minute changes
	// this.changed is an external notification of changes
	if( !this.changed && obj.iconsCache && obj.iconsCache.length )
	{
		changed = false;
		for( var a = 0; a < obj.iconsCache.length; a++ )
		{
			if(
				obj.iconsCache[a].Filename != icons[a].Filename ||
				obj.iconsCache[a].Filesize != icons[a].Filesize
			)
			{
				changed = true;
				break;
			}
		}
		this.changed = false;
	}

	// Remove loading animation
	if( obj.getElementsByClassName( 'LoadingAnimation' ).length )
	{
		var la = obj.getElementsByClassName( 'LoadingAnimation' )[0];
		la.parentNode.removeChild( la );
	}

	// Make sure we have a listview columns header bar
	var headers = {
		'filename' : i18n( 'i18n_filename' ),
		'size'     : i18n( 'i18n_size' ),
		'date'     : i18n( 'i18n_date' ),
		'type'     : i18n( 'i18n_type' ),
		'permissions' : i18n( 'i18n_permissions' )
	};

	// Default widths
	var defwidths = {
		'filename' : '29%',
		'size'     : '12%',
		'date'     : '25%',
		'type'    : '25%',
		'permissions' : '9%'
	};

	// Clear list
	if( changed )
	{
		if( !this.listView )
		{
			this.ShowFileBrowser();
		
			var divs = [];

			// Setup the listview for the first time
		
			var lvie = document.createElement( 'div' );
			lvie.className = 'Listview';
		
			var head = document.createElement( 'div' );
			head.className = 'Headers';
			for( var a in headers )
			{
				var d = document.createElement( 'div' );
				d.className = 'Header Ellipsis MousePointer';
				d.innerHTML = headers[a];
				if( dv.sortColumn == a )
				{
					d.className += dv.sortOrder == 'ascending' ? ' IconSmall fa-arrow-down' : ' IconSmall fa-arrow-up';
					d.innerHTML = '&nbsp;' + d.innerHTML;
				}
				d.sortColumn = a;
				d.style.width = defwidths[a];
				d.onclick = function( e )
				{
					if( dv.sortColumn == this.sortColumn )
					{
						dv.sortOrder = dv.sortOrder == 'ascending' ? 'descending' : 'ascending';
					}
					dv.sortColumn = this.sortColumn;
					dv.window.refresh();
				}
				head.appendChild ( d );
			}
			lvie.appendChild( head );
		
			this.head = head;
			obj.head = head;

			// Add icon container
			var cicn = document.createElement( 'div' );
			cicn.className = 'ScrollArea Icons';
			lvie.appendChild( cicn );

			// Add icon content container
			var icnt = document.createElement( 'div' );
			icnt.className = 'Scroller';
			obj.scroller = icnt;
			cicn.appendChild ( icnt );

			// Add footer
			var foot = document.createElement( 'div' );
			foot.className = 'Footer';
			lvie.foot = foot;
			lvie.appendChild ( foot );

			// Add listview
			obj.appendChild( lvie );
		
			divs = obj.getElementsByTagName( 'div' );
		
			this.listView = lvie;
		}
		else
		{
			// Just clear scroller
			obj.scroller.innerHTML = '';
		}
		
		// Turn off smooth scrolling on redraw
		obj.scroller.style.scrollBehavior = 'unset';
		
		var icnt = obj.scroller;
		var bts = 0;
		var foot = this.listView.foot;
		var head = this.head;

		obj.iconsCache = icons;
		obj.icons = [];
		
		var orphanInfoFile = {};

		for( var a = 0; a < icons.length; a++ )
		{
			if( icons[a].Type == 'File' && self.ignoreFiles ) continue;
			
			if( icons[a].Type == 'Directory' ) 
				dirs.push( icons[a] );
			else 
				files.push( icons[a] );

			var i = icons[a];
			if( i.Filename )
			{
				// Check .info
				var mInfoname = i.Filename.toLowerCase().indexOf( '.info' ) > 0 ?
					i.Filename.substr( 0, i.Filename.length - 5 ) : false;
				// Check .dirinfo
				if( !mInfoname )
				{
					mInfoname = i.Filename.toLowerCase().indexOf( '.dirinfo' ) > 0 ?
						i.Filename.substr( 0, i.Filename.length - 8 ) : false;
				}
				if( mInfoname )
				{
					if( typeof( orphanInfoFile[ mInfoname ] ) == 'undefined' )
						orphanInfoFile[ mInfoname ] = true;
					else orphanInfoFile[ mInfoname ] = false;
				}
				else
				{
					orphanInfoFile[ i.Filename ] = false;
				}
			}
		}
		
		var swi = 2;

		var listed = 0;

		for( var a = 0; a < icons.length; a++ )
		{
			if( icons[a].Type == 'File' && self.ignoreFiles ) continue;
			
			var t = icons[a].Title ? icons[a].Title : icons[a].Filename;
			var ic = icons[a];

			// Skipping
			// Skip dot files
			if( !self.showHiddenFiles && t.substr( 0, 1 ) == '.' ) continue;
			
			// Skip files with wrong suffix
			else if( ic.Type == 'File' && self.suffix && !self.checkSuffix( t ) )
			{
				continue;
			}
			
			// Skip backup files
			else if( !self.showHiddenFiles && t.substr( t.length - 4, 4 ) == '.bak' )
				continue;
				
			// Only show orphan .info files
			if( t.indexOf( '.info' ) > 0 || t.indexOf( '.dirinfo' ) > 0 )
			{
				if( !orphanInfoFile[ t.substr( 0, t.length - 5 ) ] )
					continue;
			}
			// Dont skipping

			if( t.split ( ' ' ).join ( '' ).length == 0 ) t = 'Unnamed';

			r = document.createElement ( 'div' );
			r.className = 'Row MousePointer';
			for( var b in headers )
			{
				var c = document.createElement ( 'div' );
				switch( b )
				{
					case 'filename':
						if( ic.Type == 'Directory' )
							c.innerHTML = t;
						else c.innerHTML = t;
						r.primaryDom = c;
						break;
					case 'size':
						c.innerHTML = ic.Filesize > 0 ? humanFilesize ( ic.Filesize ) : '&nbsp;';
						c.style.textAlign = 'right';
						break;
					case 'date':
						c.innerHTML = ic.DateModified;
						c.style.textAlign = 'right';
						break;
					case 'type':
						/*var fn = icons[a].Title ? icons[a].Title : icons[a].Filename;
						var ext = fn.split( '.' ); ext = ext[ext.length-1].toLowerCase();
						ext = ext.split( '#' ).join( '' );*/
						var ext = ic.Extension.split( '#' )[0];
						var tp = i18n( ic.Type == 'Directory' ? 'i18n_directory' : 'i18n_filetype_' + ext );
						if( tp.substr( 0, 5 ) == 'i18n_' )
							tp = i18n( 'i18n_driver_handled' );
						c.innerHTML = tp;
						c.style.textAlign = 'left';
						break;
					case 'permissions':
						var pr = '-rwed';
						if( ic.Permissions )
						{
							var p = ic.Permissions.split( ',' );
							var perms = ['-','-','-','-','-'];
							for( var b = 0; b < p.length; b++ )
							{
								for( var cc = 0; cc < p[b].length; cc++ )
								{
									if( p[b].substr( cc, 1 ) != '-' && perms[cc] == '-' )
									{
										perms[cc] = p[b][cc];
									}
								}
							}
							pr = perms.join( '' ).toLowerCase();
						}
						c.innerHTML = pr;
						c.style.textAlign = 'center';
						break;
					default:
						c.innerHTML = headers[b];
						break;
				}
				c.className = 'Column';
				c.style.width = defwidths[b];
				r.appendChild( c );
			}
			bts += ic.Filesize ? parseInt( ic.Filesize ) : 0;
			
			swi = swi == 2 ? 1 : 2;
			if ( swi == 1 ) r.className += ' Odd';

			// Create icon object to extract FileInfo
			var f = CreateIcon( ic, this );
			f.directoryView = this;
			r.className += ' File';
			//RemoveIconEvents( f ); // Strip events
			r.file = f;
			
			// Overwrite doubleclick
			if( ic.Type == 'File' && this.doubleclickfiles )
			{
				var cl = this.doubleclickfiles;
				r.ondblclick = function( e )
				{
					cl( this.file, e );
				}
			}
			else
			{
				r.ondblclick = function( e )
				{
					//Notify( { title: 'Double clicked', text: 'dlci' } );
					this.file.ondblclick( e );
				}
			}

			// Create the icon..
			var icon = document.createElement( 'div' );
			icon.className = 'Icon';
			var inne = document.createElement( 'div' );
			inne.className = f.iconInner.className;
			icon.appendChild( inne );
			r.appendChild( icon );
			listed++;
			
			// Single click
			r.onmousedown = function( e )
			{
				if( !e ) e = window.event ? window.event : {};
			
				// This means we are adding
				if( e.shiftKey || e.ctrlKey )
				{
					convertIconsToMultiple();
				}
				
				// Right mouse button
				if( e.button == 2 )
				{
					// check icons
					clearRegionIcons( { exception: this } );
					this.classList.add( 'Selected' );
					this.fileInfo.selected = true;
					this.selected = true;
					this.icon.selected = true;
					found = this;
			
					if( !window.isMobile )
					{
						Workspace.showContextMenu( false, e );
					}
					return cancelBubble( e );
				}
				else
				{
					// Use override if possible
					if( this.file.directoryView.filedialog && isMobile )
					{
						if( this.file.directoryView.doubleclickfiles )
						{
							if( this.fileInfo.Type == 'File' )
							{
								this.file.directoryView.doubleclickfiles( this, e );
							}
							else if( this.fileInfo.Type == 'Directory' )
							{
								launchIcon( e, this );
							}
							return cancelBubble( e );
						}
						return;
					}
					
					var p = icnt;
				
					// We have an external event
					if( dv.clickfile )
					{
						dv.clickfile( this.file, e );
					}
				
					// Range
					if( dv.multiple && e.shiftKey )
					{
						var other = self = false;
						var top = bottom = false;

						// Find range from to
						if( dv.lastListItem && dv.lastListItem.classList.contains( 'Selected' ) )
						{
							for( var c = 0; c < p.childNodes.length; c++ )
							{
								if( p.childNodes[c] == dv.lastListItem )
								{
									other = c;
								}
								else if( p.childNodes[c] == this )
								{
									self = c;
								}
							}
						}
						top = self > other ? other : self;
						bottom = self > other ? self : other;

						if( other >= 0 && self >= 0 )
						{
							for( var b = top; b <= bottom; b++ )
							{
								if( !p.childNodes[b] ) continue;
								p.childNodes[b].classList.add( 'Selected' );
								p.childNodes[b].selected = 'multiple';
								p.childNodes[b].icon.selected = 'multiple';
								p.childNodes[b].fileInfo.selected = 'multiple';
							}
						}
						dv.lastListItem = this;
					}
					// Toggle only
					else if( dv.multiple && e.ctrlKey )
					{
						if( this.classList.contains( 'Selected' ) )
						{
							this.classList.remove( 'Selected' );
							this.selected = false;
							this.icon.selected = false;
							this.fileInfo.selected = false;
							dv.lastListItem = false;
						}
						else
						{
							this.classList.add( 'Selected' );
							this.selected = 'multiple';
							this.icon.selected = 'multiple';
							this.fileInfo.selected = 'multiple';
							dv.lastListItem = this;
						}
					}
					else
					{
						var sh = e.shiftKey || e.ctrlKey;
						if( !sh ) 
						{
							if( !Workspace.contextMenuShowing || !Workspace.contextMenuShowing.shown )
							{
								clearRegionIcons( { exception: this } );
							}
						}
						
						if( this.classList.contains( 'Selected' ) )
						{
							// Check if we need this
							this.classList.remove( 'Selected' );
							this.selected = false;
							this.icon.selected = false;
							this.fileInfo.selected = false;
						}
						else
						{
							this.classList.add( 'Selected' );
							this.selected = sh ? 'multiple' : true;
							this.icon.selected = this.selected;
							this.fileInfo.selected = this.selected;
						}
						dv.lastListItem = this;
					}

					if( window.isSettopBox )
					{
						return cancelBubble( e );
					}
				}
			}

			r.fileInfo = f.fileInfo;
			
			r.window = obj.window;

			icnt.appendChild( r );

			// Let's drag this bastard!
			r.setAttribute( 'draggable', true );
			
			if( window.isTablet || !window.isMobile )
			{
				r.ondragstart = function( e )
				{
					if( this.classList.contains( 'Selected' ) )
					{
						obj.iconsCache = [];
						mousePointer.pickup( this );
					}
					else
					{
						this.classList.add( 'Selected' );
						this.selected = true;
						this.icon.selected = true;
						this.fileInfo.selected = true;
						return this.ondragstart( e );
					}
					return cancelBubble( e );
				}
			}
			if( window.isTablet || window.isMobile )
			{
				r.ontouchstart = function( e )
				{
					this.click = true;
					var self = this;
					this.listSelectTimeout = setTimeout( function()
					{
						self.click = false;
						if( self.classList.contains( 'Selected' ) )
						{
							clearRegionIcons();
						}
						else
						{
							clearRegionIcons();
							self.classList.add( 'Selected' );
							self.selected = true;
							this.icon.selected = true;
							self.fileInfo.selected = true;
							self.touchPos = {
								x: e.touches[0].pageX,
								y: e.touches[0].pageY
							};
							self.touchMode = 0;
						}
					}, 100 );
					
					if( window.isTablet )
					{
						this.contextMenuTimeout = setTimeout( function()
						{
							Workspace.showContextMenu( false, e );
						}, 800 );
					}
					
					return cancelBubble( e );
				}
			}
			if( window.isTablet )
			{
				r.ontouchmove = function( e )
				{
					if( !this.touchPos )
						return;
						
					var current = {
						x: e.touches[0].pageX,
						y: e.touches[0].pageY
					};
			
					var diffx = current.x - this.touchPos.x;
					var diffy = current.y - this.touchPos.y;
			
					var distance = Math.sqrt(
						Math.pow( diffx, 2 ) + Math.pow( diffy, 2 )
					);
				
					if( distance > 15 )
					{
						obj.iconsCache = [];
						mousePointer.pickup( this );
						this.touchPos = false;
						
						if( this.listSelectTimeout )
						{
							clearTimeout( this.listSelectTimeout );
							this.listSelectTimeout = false;
						}
						if( this.contextMenuTimeout )
						{
							clearTimeout( this.contextMenuTimeout );
							this.contextMenuTimeout = false;
						}
					}
					
					return cancelBubble( e );
				}
			}
			if( window.isTablet )
			{
				r.ontouchend = function( e )
				{
					if( this.click )
					{
						this.ondblclick( e );
						if( this.listSelectTimeout )
						{
							clearTimeout( this.listSelectTimeout );
							this.listSelectTimeout = false;
						}
						if( this.contextMenuTimeout )
						{
							clearTimeout( this.contextMenuTimeout );
							this.contextMenuTimeout = false;
						}
					}
					this.touchPos = false;
				}
				
				r.onclick = null;
				r.onmousedown = null;
			}
			
			// Releasing
			r.onmouseup = function( e )
			{
				if( !e.ctrlKey && !e.shiftKey && !e.command && !ge( 'RegionSelector' ) )
				{
					clearRegionIcons( { exception: this, force: true } );
				}
			}

			// For clicks
			ic.domNode = r;
			ic.domNode.icon = ic;

			obj.icons.push( ic );
		}

		// Position the rows
		var t = 0;
		var ds = icnt.getElementsByTagName ( 'div' );
		for( var a = 0; a < ds.length; a++ )
		{
			if( ds[a].className.substr ( 0, 3 ) == 'Row' )
			{
				ds[a].style.top = t + 'px';
				t += 30;
			}
		}

		var filesize = humanFilesize ( bts );
		foot.innerHTML = listed + ' ' + i18n( 'i18n_total_listed' ) + ' ' + filesize + '.';
	}
	else
	{
		// Find last row
		r = icnt.getElementsByTagName( 'div' );
		for( var a = r.length - 1; a > 0; a-- )
		{
			if( r[a].classList.contains( 'Row' ) )
			{
				r = r[a];
				break;
			}
		}
	}
	
	var icnt = obj.scroller;
	var foot = this.listView.foot;
	var head = this.head;

	// Align headers
	if( head && icnt.childNodes.length )
	{
		var childr = icnt.childNodes[icnt.childNodes.length - 1].childNodes;
		var wh = head.offsetWidth;
		for( var b = 0; b < head.childNodes.length; b++ )
		{
			if( r.childNodes[b].nodeName != 'DIV' ) continue;

			var cw = GetElementWidth( childr[b] );
			if( b == head.childNodes.length - 1 )
				cw = wh;
			wh -= cw;
			head.childNodes[b].style.width = cw + 'px';
		}
	}

	if( typeof( obj.parentNode ) != 'undefined' && obj.parentNode.refreshWindow )
	{
		obj.parentNode.refreshWindow ();
	}
	
	// We are loaded!
	icnt.classList.add( 'Loaded' );
	
	obj.scroller.style.scrollBehavior = '';
}

// -------------------------------------------------------------------------
// Create a directoryview on a div / Window (shortcut func (deprecated?))
function CreateDirectoryView( winobj, extra )
{
	var w = new DirectoryView( winobj, extra );
	return w;
}

function DirectoryContainsFile( filename, directoryContents )
{
	if( !filename ) return false;
	if( !directoryContents || directoryContents.length == 0 ) return false;
	
	for(var i = 0; i < directoryContents.length; i++ )
	{
		if( directoryContents[i].Filename == filename ) return true;
	}
	return false;
}

// -------------------------------------------------------------------------
// Icon class ------------------------------------------------------------------
// -------------------------------------------------------------------------

FileIcon = function( fileInfo, flags )
{
	this.Init( fileInfo, flags );
}

// Put in cache
// TODO: Clean cache when sessionid change
FileIcon.prototype.setCache = function( path, directoryview, date )
{
	if( directoryview && directoryview.window && directoryview.window.fileInfo )
	{
		var dir = directoryview.window.fileInfo.Path;
		if( !Friend.iconCache[ dir ] )
			Friend.iconCache[ dir ] = {};
		if( !Friend.iconCache[ dir ][ path ] )
		{
			var currentIndex = Friend.iconCache.index++;
			// Wrap around
			if( currentIndex > Friend.iconCache.maxCount )
			{
				currentIndex = Friend.iconCache.index = 0;
			}
			var i = new Image();
			i.src = path;
			i.date = date;
			i.onload = function()
			{
				Friend.iconCache[ dir ][ path ] = i;
				// Overwriting?
				if( Friend.iconCache.seenList[ currentIndex ] )
				{
					var dd = Friend.iconCache.seenList[ currentIndex ].dir;
					var pp = Friend.iconCache.seenList[ currentIndex ].path;
					delete Friend.iconCache[ dd ][ pp ];
				}
				// Write new
				Friend.iconCache.seenList[ currentIndex ] = {
					dir: dir,
					path: path
				};
			}
		}
	}
}

// Get image from cache
FileIcon.prototype.getCache = function( path, directoryview, date )
{
	if( directoryview && directoryview.window && directoryview.window.fileInfo )
	{
		var dir = directoryview.window.fileInfo.Path;
		if( !Friend.iconCache[ dir ] ) return false;
		if( !Friend.iconCache[ dir ][ path ] ) return false;
		var i = Friend.iconCache[ dir ][ path ];
		if( i.date != date )
		{
			Friend.iconCache[ dir ][ path ] = null;
			return false;
		}
		return _getBase64Image( i );
	}
	return false;
}

// Remove an image from cache
FileIcon.prototype.delCache = function( dir )
{
	var path = '/system.library/module/?module=system&command=thumbnail&sessionid=' + Workspace.sessionId + '&path=' + dir;
	
	// remove filename from subpath
	if( dir.indexOf( '/' ) > 0 )
	{
		dir = dir.split( '/' );
		dir.pop();
		dir = dir.join( '/' ) + '/';
	}
	// remove filename from rootpath
	else
	{
		dir = dir.split( ':' )[0] + ':';
	}
	
	if( !Friend.iconCache[ dir ] ) return false;
	
	if( !Friend.iconCache[ dir ][ path ] ) return false;
	
	delete Friend.iconCache[ dir ][ path ];
}

// -----------------------------------------------------------------------------
FileIcon.prototype.Init = function( fileInfo, flags )
{
	var self = this;
	
	function _createIconTitle( str )
	{
		return '<span>' + str.split( ' ' ).join( '</span><span>' ) + '</span>';
	}


	this.flags = flags ? flags : {};
	
	var type = 'div';
	if( flags && flags.type ) type = flags.type;
	
	// Create the file icon div
	this.file = document.createElement( type );
	var file = this.file;
	file.className = 'File';
	file.style.position = 'absolute';

	if( flags && flags.nativeDraggable )
	{
		file.setAttribute( 'draggable', true );
	}

	// Selected in buffer
	if( !fileInfo )
		return;
		
	if( fileInfo.selected )
	{
		this.file.classList.add( 'Selected' );
		this.file.selected = fileInfo.selected;
		this.selected = fileInfo.selected;
	}

	// Attach this object to dom element
	file.object = this;

	// Get the file extension, if any
	var extension = fileInfo.Filename ? fileInfo.Filename.split('.') : false;
	if( fileInfo.MetaType == 'MetaFile' )
	{
		extension = 'info';
	}
	else if( typeof( extension ) == 'object' && extension.length > 1 )
	{
		extension = extension[extension.length-1].toLowerCase();
	}
	else extension = '';
	
	// Create the div that holds the actual icon
	icon = document.createElement ( 'div' );
	icon.className = 'Icon';
	
	// Labels
	// TODO remove!
	if( 1 == 0 )
	{
		if( fileInfo.SharedLink && fileInfo.SharedLink.length )
		{
			var df = document.createElement( 'div' );
			df.className = 'Label Shared IconSmall MousePointer fa-share-alt';
			icon.appendChild( df );
		}
	}
	
	iconInner = document.createElement ( 'div' );
	file.iconInner = iconInner;
	
	if( !Friend.dosDrivers[ 'Dormant' ] )
	{
		Friend.dosDrivers[ 'Dormant' ] = {
			iconLabel: '/iconthemes/friendup15/DriveLabels/FriendDisk.svg'
		};
	}
	
	if( ( fileInfo.Type == 'Dormant' || fileInfo.Type == 'Door' ) && Friend.dosDrivers && Friend.dosDrivers[ fileInfo.Driver ] )
	{
		var driver = Friend.dosDrivers[ fileInfo.Driver ];
							
		// Find correct image
		var img = '/iconthemes/friendup15/DriveLabels/FriendDisk.svg';
		
		if( Friend.dosDrivers[ driver.type ] && Friend.dosDrivers[ driver.type ].iconLabel )
			img = 'data:image/svg+xml;base64,' + Friend.dosDrivers[ driver.type ].iconLabel;
		if( fileInfo.Title == 'Home' )
			img = '/iconthemes/friendup15/DriveLabels/Home.svg';
		else if( fileInfo.Title == 'System' )
			img = '/iconthemes/friendup15/DriveLabels/SystemDrive.svg';
		
		if( fileInfo.IconFile )
		{
			iconInner.className = 'Custom';
			iconInner.style.backgroundImage = 'url(' + fileInfo.IconFile + ')';
			img = '';
		}
		
		iconInner.className = 'Drive';
		if( img )
		{
			var label = document.createElement( 'div' );
			label.className = 'Label';
			label.style.backgroundImage = 'url("' + img + '")';
			iconInner.appendChild( label );
		}
	}
	else if( fileInfo.Icon )
	{
		iconInner.className = fileInfo.Icon;
	}
	else if( fileInfo.IconClass )
	{
		iconInner.className = fileInfo.IconClass;
		if( fileInfo.IconFile )
			iconInner.style.backgroundImage = 'url(' + fileInfo.IconFile + ')';
	}
	else if( fileInfo.IconFile != undefined && Trim( fileInfo.IconFile ) )
	{
		iconInner.className = 'Custom';
		iconInner.style.backgroundImage = 'url(' + fileInfo.IconFile + ')';
	}
	else
	{
		iconInner.className = GetIconClassByExtension( extension, fileInfo );
	}
	
	// Check for thumbs
	if( fileInfo.directoryview && ( fileInfo.directoryview.listMode == 'iconview' || fileInfo.directoryview.listMode == 'imageview' ) )
	{
		switch( iconInner.className )
		{
			case 'TypeJPG':
			case 'TypeJPEG':
			case 'TypePNG':
			case 'TypeGIF':
				var r = CryptoJS.SHA1( fileInfo.DateModified ).toString();
				
				var w = fileInfo.directoryview.listMode == 'imageview' ? 240 : 56;
				var h = fileInfo.directoryview.listMode == 'imageview' ? 140 : 48;
				var ur = '/system.library/module/?module=system&command=thumbnail&width=' + w + '&height=' + h + '&sessionid=' + Workspace.sessionId + '&path=' + fileInfo.Path + '&date=' + r;
				
				// Get from cache
				var tmp = false;
				if( tmp = this.getCache( ur, fileInfo.directoryview, fileInfo.DateModified ) )
				{
					ur = tmp;
				}
				
				iconInner.style.backgroundImage = 'url(\'' + ur + '\')';
				iconInner.className = 'Thumbnail';
				
				// Put in cache
				if( !tmp )
				{
					this.setCache( ur, fileInfo.directoryview, fileInfo.DateModified );
				}
				break;
		}
	}
	
	// Shared file?
	if( fileInfo.SharedLink && fileInfo.SharedLink.length )
	{
		iconInner.classList.add( 'Shared' );
	}
	if( fileInfo.MetaType == 'Shortcut' && !fileInfo.IconFile )
	{
		file.classList.add( 'Shortcut' );
		if( fileInfo.Filename.substr( 0, 1 ) == ':' )
		{
			var fn = fileInfo.Filename.substr( 1, fileInfo.Filename.length - 1 );
			iconInner.style.backgroundImage = 'url(\'apps/' + fn + '/icon.png\')';
		}
	}

	// Create the title
	title = document.createElement( 'a' );
	title.className = 'Title';
	var tl = ( fileInfo.Title ? fileInfo.Title :
		( fileInfo.Filename ? fileInfo.Filename : 'Uten navn' ) );
	title.innerHTML = tl;
	title.title = tl;
	file.title = title.title;
	file.titleElement = title;

	// Cook at 225°C for 45 minutes
	icon.appendChild( iconInner );
	file.appendChild( icon );
	file.appendChild( title );

	file.fileInfo = fileInfo;
	file.extension = extension;
	file.Title = title.innerText;
	file.fileInfo.downloadhref = document.location.protocol +'//'+ document.location.host +'/system.library/file/read/' + encodeURIComponent( fileInfo.Filename ) + '?mode=rs&sessionid=' + Workspace.sessionId + '&path='+ encodeURIComponent( fileInfo.Path ) + '&download=1';

	// -------------------------------------------------------------------------
	file.rollOver = function ( eles )
	{
		this.classList.add( 'DragTarget' );
	}

	// -------------------------------------------------------------------------
	file.rollOut = function ( eles )
	{
		this.classList.remove( 'DragTarget' );
	}

	// -------------------------------------------------------------------------
	// Attach events
	if( !( self.flags && self.flags.nativeDraggable ) )
	{
		file.onmousedown = function( e )
		{
			if( !e ) e = window.event ? window.event : {};
	
			// Activate screen on click
			if( this.window )
			{
				// when changing from one directoryview to another, clear region icons
				if(
					window.currentMovable && window.currentMovable.classList.contains( 'Active' ) &&
					this.window.parentNode != window.currentMovable
				)
				{
					clearRegionIcons();
				}
				if( this.window.parentNode.classList.contains( 'View' ) )
				{
					if( !this.window.parentNode.classList.contains( 'Active' ) )
						_ActivateWindow( this.window.parentNode );
				}
			}
		
			// For screen icons
			if( this.window.classList.contains( 'ScreenContent' ) )
			{
				if( currentMovable )
					_DeactivateWindow( currentMovable );
				currentMovable = null;
			}

			// This means we are adding
			if( e.shiftKey || e.ctrlKey )
			{
				convertIconsToMultiple();
			}

			if( !e ) e = window.event;
			if( !e ) e = {};
		
			if( this.window )
			{
				var rc = 0;
				if( e.which ) rc = ( e.which == 3 );
				else if( e.button ) rc = ( e.button == 2 );
				if( !rc )
				{
					if( e.button === 0 || e.button === 3 || e.button === 2 )
					{
						window.mouseDown = this;
					}
				}
			}

			// Right mouse button
			if( e.button == 2 )
			{
				// check icons
				clearRegionIcons();
				this.classList.add( 'Selected' );
				found = this;
				this.selected = true;
				this.icon.selected = true;
				this.fileInfo.selected = true;
			
				// Count selected icons
				this.directoryView.windowObject.checkSelected();
			
				if( !window.isMobile )
				{
					if( this.fileInfo.MetaType == 'Shortcut' )
					{
						Workspace.showContextMenu( [ {
							name: i18n( 'i18n_delete_shortcut' ),
							command: function( e )
							{
								var files = [];
								var eles = found.fileInfo.directoryview.window.getElementsByTagName( 'div' );
								var selectedCount = 0;
								for( var a = 0; a < eles.length; a++ )
								{
									if( !eles[a].classList.contains( 'File' ) )
										continue;
									if( !eles[a].classList || !eles[a].classList.contains( 'Selected' ) )
										continue;
									if( eles[a].fileInfo.MetaType != 'Shortcut' )
										continue;
									files.push( eles[a].fileInfo.Path );
								}
								
								var m = new Module( 'system' );
								m.onExecuted = function( e, d )
								{
									Workspace.refreshDesktop( false, true );
								}
								m.execute( 'removedesktopshortcut', { shortcuts: files } );
								found.parentNode.removeChild( found );
							}
						} ], e );
					}
					else
					{
						Workspace.showContextMenu( false, e );
					}
				}
				return cancelBubble( e );
			}
			else
			{
				// Use override if possible
				if( this.directoryView.filedialog )
				{
					if( this.directoryView.doubleclickfiles )
					{
						if( this.fileInfo.Type == 'File' )
						{
							this.directoryView.doubleclickfiles( this, e );
						}
						else if( this.fileInfo.Type == 'Directory' )
						{
							launchIcon( e, this );
						}
						return cancelBubble( e );
					}
					return;
				}
		
				if( window.isSettopBox && this.selected )
				{
					launchIcon( e, this );
					this.classList.remove( 'Selected' );
					this.selected = false;
					this.icon.selected = false;
					this.fileInfo.selected = false;
					return cancelBubble( e );
				}

				var sh = e.shiftKey || e.ctrlKey;
				if( !sh ) 
				{
					if( !Workspace.contextMenuShowing || !Workspace.contextMenuShowing.shown )
					{
						clearRegionIcons( { exception: this } );
					}
				}

				// Toggle
				if( this.classList.contains( 'Selected' ) && !( !sh && this.selected == 'multiple' ) )
				{
					this.classList.remove( 'Selected' );
					this.selected = false;
					this.icon.selected = false;
					this.fileInfo.selected = false;
				}
				else
				{
					this.classList.add( 'Selected' );
					this.selected = sh ? 'multiple' : true;
					this.icon.selected = this.selected;
					this.fileInfo.selected = sh ? 'multiple' : true;
				}

				// Refresh the menu based on selected icons
				WorkspaceMenu.show();
				CheckScreenTitle();
				if( window.isSettopBox )
				{
					return cancelBubble( e );
				}
			}

			if( e && e.stopPropagation )
				e.stopPropagation();
		}

		// -------------------------------------------------------------------------
		// This one driggers dropping icons! (believe it or not)
		file.onmouseup = function( e )
		{
			if( mousePointer && mousePointer.elements.length )
			{
				// Drop on an icon on a workbench icon
				if( window.targetMovable == ge( 'Doors' ) )
				{
					// TODO: Implement desktop dropping!
				}
				// Drop an icon on top of another normal window icon
				else if( window.targetMovable && window.targetMovable.id )
				{
					// TODO: Implement icon dropping!
				}
				else
				{
				}
			}
			if( !e.ctrlKey && !e.shiftKey && !e.command && !ge( 'RegionSelector' ) )
			{
				clearRegionIcons( { exception: this, force: true } );
			}
			window.targetMovable = false;
		}

		// Do tha thang
		launchIcon = function( event, ele )
		{
			if( !event ) event = window.event;
		
			obj = ele ? ele : file;
		
			// File extension
			if( obj.fileInfo && obj.fileInfo.Path && obj.fileInfo.Path.indexOf( '.' ) > 0 )
			{
				var ext = obj.fileInfo.Path.split( '.' );
				if( ext.length > 1 )
				{
					ext = '.' + ext[ext.length-1].toLowerCase();

					// Check mimetypes
					for( var a in Workspace.mimeTypes )
					{
						var mt = Workspace.mimeTypes[a];
						for( var b in mt.types )
						{
							// Make sure we have a valid executable
							if( ext == mt.types[b].toLowerCase() && mt.executable.length )
							{
								return ExecuteApplication( mt.executable, obj.fileInfo.Path );
							}
						}
					}
					// Execute jsx!
					if( ext == '.jsx' )
					{
						return ExecuteApplication( obj.fileInfo.Path );
					}
				}
			}

			// Normal folders etc
			// Open unique windows if we're in toolbar mode and are double clicking a disk
			var uniqueView = false;
			var dv = obj.directoryView ? obj.directoryView : obj.fileInfo.directoryview;
			if( ( obj.fileInfo.Type == 'Door' || obj.fileInfo.Type == 'Dormant' ) && dv.navMode == 'toolbar' )
			{
				uniqueView = true;
				if( obj.fileInfo.Path != obj.fileInfo.Volume )
				{
					obj.fileInfo.Path = obj.fileInfo.Volume;
				}
			
				// Open unique window!
				OpenWindowByFileinfo( obj.fileInfo, event, false, uniqueView );
				return false;
			}
			else if( obj.fileInfo.MetaType == 'Shortcut' )
			{
				if( obj.fileInfo.Type == 'Directory' )
				{
					var o = {};
					for( var a in obj.fileInfo )
						o[ a ] = obj.fileInfo[ a ];
					o.MetaType = 'Directory';
					OpenWindowByFileinfo( o, event, false, uniqueView );	
				}
				// Executable shortcut
				else if( obj.fileInfo.Filename.substr( 0, 1 ) == ':' )
				{
					return ExecuteApplication( obj.fileInfo.Filename.substr( 1, obj.fileInfo.Filename.length - 1 ) );
				}
				else
				{
					// No mime type? Ask Friend Core
					var mim = new Module( 'system' );
					mim.onExecuted = function( me, md )
					{
						var js = null;
						try
						{
							js = JSON.parse( md );
						}
						catch( e ){};
				
						if( me == 'ok' && js )
						{
							ExecuteApplication( js.executable, obj.fileInfo.Path );
						}
						else
						{
							// Open unique window!
							OpenWindowByFileinfo( obj.fileInfo, event, false, uniqueView );
							return false;
						}
					}
					mim.execute( 'checkmimeapplication', { path: obj.fileInfo.Path } );
				}
				return false; 
			}
			// Just change directory
			else if( obj.fileInfo.Type == 'Directory' && dv.navMode == 'toolbar' )
			{
				// Set a new path and record the old one!
				var we = dv.windowObject;
				var dw = dv;

				// Add current and set it to end of history
				var path = obj.fileInfo.Path.split( ':' );
			
				var fin = {
					Volume: path[0] + ':',
					Path: obj.fileInfo.Path,
					Title: path[0],
					Type: obj.fileInfo.Type,
					Door: Workspace.getDoorByPath( path.join( ':' ) )
				}
				fin.Door.cancelId = dw.cancelId;
				dw.addToHistory( fin );

				// Update on notifications
				var ppath = obj.fileInfo.Path;
				if( !Workspace.diskNotificationList[ ppath ] )
				{
					Workspace.diskNotificationList[ ppath ] = {
						type: 'directory',
						view: we
					};
					var f = new Library( 'system.library' );
					f.addVar( 'sessionid', Workspace.sessionId );
					f.addVar( 'path', ppath );
					f.onExecuted = function( e, d )
					{
						if( e != 'ok' )
							return;
					
						var j;
						try
						{
							j = JSON.parse( d );
						}
						catch( e )
						{
							console.log( 'Error in JSON format: ', d );
							return;
						}
						we.windowObject.addEvent( 'systemclose', function()
						{
							var ff = new Library( 'system.library' );
							ff.addVar( 'sessionid', Workspace.sessionId );
							ff.addVar( 'path', ppath );
							ff.addVar( 'id', j.Result );
							ff.onExecuted = function( es, ds )
							{
								// TODO: Clear it?
								Workspace.diskNotificationList[ ppath ] = false;
							}
							ff.execute( 'file/notificationremove' );
						} );
					}
					f.execute( 'file/notificationstart' );
				}

				// Open unique window!
				// Animation for going to next folder
				if( isMobile )
				{
					// Remove previous one
					if( dv.windowObject.slideAnimation )
						dv.windowObject.slideAnimation.parentNode.removeChild( dv.windowObject.slideAnimation );
				
					var n = document.createElement( 'div' );
					n.className = 'Content SlideAnimation';
					n.style.willChange = 'transform';
					n.style.transition = 'transform 0.4s';
					n.innerHTML = dv.windowObject.innerHTML;
					n.scrollTop = dv.windowObject.scrollTop;
					n.style.zIndex = 10;
					dv.windowObject.parentNode.appendChild( n );
					dv.windowObject.slideAnimation = n;
					dv.windowObject.parentNode.classList.add( 'Redrawing' );
				
					// Refresh and add animation
					we.refresh( function()
					{
						n.style.transform = 'translate3d(-100%,0,0)';
						setTimeout( function()
						{
							if( n.parentNode )
							{
								n.parentNode.removeChild( n );
								if( dv.windowObject.parentNode.classList )
									dv.windowObject.parentNode.classList.remove( 'Redrawing' );
							}
							dv.windowObject.slideAnimation = null;
						}, 400 );
					} );
				}
				// Desktop mode, just refresh
				else 
				{
					we.refresh();
				}
				return false;
			}
			else
			{	
				// No mime type? Ask Friend Core
				var mim = new Module( 'system' );
				mim.onExecuted = function( me, md )
				{
					var js = null;
					try
					{
						js = JSON.parse( md );
					}
					catch( e ){};
				
					if( me == 'ok' && js )
					{
						ExecuteApplication( js.executable, obj.fileInfo.Path );
					}
					else
					{
						// Open unique window!
						OpenWindowByFileinfo( obj.fileInfo, event, false, uniqueView );
						return false;
					}
				}
				mim.execute( 'checkmimeapplication', { path: obj.fileInfo.Path } );
			}
		}

		// -------------------------------------------------------------------------
		file.onselectstart = function( e )
		{
			return cancelBubble( e );
		}

		// -------------------------------------------------------------------------
		file.onmouseout = function( e )
		{
			if ( !e ) e = window.event;
			if ( window.mouseDown == this )
			{
				mousePointer.pickup( this );
				window.mouseDown = 4;
				return cancelBubble ( e );
			}
		}
	}

	file.drop = DirectoryView.prototype.doCopyOnElement;

	// -------------------------------------------------------------------------
	// Notice: Door and Dormant with isMobile overwrites onclick
	if( !self.flags || ( self.flags && !self.flags.nativeDraggable ) )
	{
		var eventName = ( window.isMobile && ( fileInfo.Type == 'Door' || fileInfo.Type == 'Dormant' ) ) ? 'onclick' : 'ondblclick';
		file[ eventName ] = launchIcon;
	}
	
	// -------------------------------------------------------------------------
	file.associateWithElement = function ( div )
	{
		if( self.flags && self.flags.nativeDraggable )
			return;
		
		var t = this;
		div.onclick = function( e ) { t.onclick( e ); };
		div.onmouseup = function( e ) { t.onmouseup( e ); };
		div.onmousedown = function( e ) { t.onmousedown( e ); };
		div.onmouseout = function( e ) { t.onmouseout( e ); };
		div.onselectstart = function( e ) { t.onselectstart( e ); };
		div.ondblclick = function( e ) { t.ondblclick( e ) };
	}

	var obj = fileInfo.directoryview;

	// Let's make it possible also for touch interfaces -----------------------
	if( !( self.flags && self.flags.nativeDraggable ) )
	{
		file.addEventListener( 'touchstart', function( event )
		{
			if( this.directoryView.filedialog )
				return;
			
			window.fileMenuElement = file;
			window.clickElement = file;

			this.touchPos = {
				x: event.touches[0].pageX,
				y: event.touches[0].pageY
			};

			file.clickedTime = ( new Date() ).getTime();

			// Hold down for a while
			file.menuTimeout = setTimeout( function()
			{
				if( window.fileMenuElement )
				{
					file.onmousedown();
					window.fileMenuElement = null;
					window.clickElement = null;
				}
			}, 100 );

			if( !window.isMobile )
			{		
				file.contextMenuTimeout = setTimeout( function()
				{
					Workspace.showContextMenu( false, event );
				}, 800 );
			}
			//return cancelBubble( event );
		}, false );

		file.addEventListener( 'touchend', function( event )
		{
			if( this.directoryView.filedialog )
				return;
			
			if( window.clickElement == this )
			{
				this.touchPos = false;

				// When single clicking (under a second) click the file!
				var time = ( new Date() ).getTime() - file.clickedTime;
				if( time < 250 && window.clickElement )
				{
					setTimeout( function()
					{
						if( file.ondblclick )
							file.ondblclick();
						else if( file.onclick )
							file.onclick;
					}, 100 );
				}

				if( file.menuTimeout )
					clearTimeout( file.menuTimeout );
				file.menuTimeout = false;
				if( file.contextMenuTimeout )
					clearTimeout( file.contextMenuTimeout );
				file.contextMenuTimeout = false;
				window.clickElement = null;
				return cancelBubble( event );
			}
		} );
	}
}

// Opens a window based on the fileInfo (type etc) -----------------------------
// oFileInfo  = original file info
// event      = input event
// iconObject = an icon object
// unique     = wheather to use a unique view or not
// targetView = the view to reuse
//
function OpenWindowByFileinfo( oFileInfo, event, iconObject, unique, targetView )
{
	// Make a copy of fileinfo
	var fileInfo = {};
	for( var a in oFileInfo )
		fileInfo[ a ] = oFileInfo[ a ];

	//console.log('OpenWindowByFileinfo fileInfo is ',fileInfo);
	if( !iconObject )
	{
		var ext = fileInfo.Path ? fileInfo.Path.split( '.' ) : ( fileInfo.Filename ? fileInfo.Filename.split( '.' ) : fileInfo.Title.split( '.' ) );
		ext = ext[ext.length-1];

		iconObject = {
			Title: fileInfo.Title,
			Filename: fileInfo.Filename,
			Filesize: fileInfo.Filesize,
			Path: fileInfo.Path,
			extension: ( fileInfo.Extension ? fileInfo.Extension : ext ),
			fileInfo: fileInfo,
			window: false
		};
	}
	
	//console.log('OpenWindowByFileinfo fileInfo is ....... [] ',iconObject);
	if( fileInfo.MetaType == 'ExecutableShortcut' )
	{
		ExecuteApplication( fileInfo.Filename );
	}
	else if( fileInfo.Type == 'Dormant' )
	{
		var command = fileInfo.Command ? ( 'command=' + fileInfo.Command ) : '';
		var fid = typeof( fileInfo.ID ) != 'undefined' ? fileInfo.ID : '1';

		var wt =  fileInfo.Path ? fileInfo.Path : ( fileInfo.Filename ? fileInfo.Filename : fileInfo.Title );

		var wid = fileInfo.Path ? fileInfo.Path : fileInfo.Title;

		// Toolbar mode demands unique windows
		if( unique && movableWindows[wid] )
			wid += Math.random() * 9999 + ( Math.random() * 9999 ) + ( new Date() ).getTime();

		var win = new View( {
			'title'     : wt,
			'width'     : 800,
			'min-width' : 340,
			'min-height': 180,
			'height'    : 400,
			'memorize'  : true,
			'id'        : wid,
			'volume'    : wt.substr( wt.length - 1, 1 ) == ':' ? true : false
		} );

		if( fileInfo.Dormant && fileInfo.Dormant.addWindow )
		{
			fileInfo.Dormant.addWindow( win );
		}
		else
		{
			console.log( '[Directoryview] Expected fileInfo.Dormant.addWindow - which doesn\'t exist...' );
		}

		win.setContent( '<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" class="LoadingAnimation"></div>' );
		
		var we = win.getWindowElement();
		we.parentFile = iconObject;
		we.parentWindow = iconObject.window;
		we.fileInfo = fileInfo;
		
		CreateDirectoryView( we );

		we.win = win;
		
		we.refresh = function( callback )
		{
			this.directoryview.window.setAttribute( 'listmode', this.directoryview.listMode );
			
			// Refresh 1
			// Run previous callback
			if( callback )
			{
				if( this.refreshCallback ) this.refreshCallback( false );
				this.refreshCallback = callback;
			}
			
			var self = this;
			self.win.refreshing = true;
			
			var fi = this.fileInfo ? this.fileInfo : iconObject;
			var wt = fi.Path ? fi.Path : ( fi.Title ? fi.Title : fi.Volume );
			
			this.windowObject.setFlag( 'title', _nameFix( wt ) );

			var t = fi && fi.Path ? fi.Path : ( fi.Volume ? fi.Volume : fi.Title );

			if( this.refreshTimeout ) clearTimeout( this.refreshTimeout );
			
			this.refreshTimeout = setTimeout( function()
			{
				fileInfo.Dormant.getDirectory( t, function( icons, data )
				{
					self.redrawIcons( icons, self.direction );
					if( self.win.revent ) self.win.removeEvent( 'resize', self.win.revent );
					self.win.revent = self.win.addEvent( 'resize', function( cbk )
					{
						self.redrawIcons( self.win.icons, self.direction, cbk );
					} );
					self.refreshTimeout = null;
					self.win.refreshing = false;
					if( callback ) callback();
				} );
			}, 250 );
		}
		we.refresh ();
		
		win = null;
	}
	else if( fileInfo.Type == 'DormantFunction' )
	{
		//fileInfo.Dormant.execute( fileInfo.Title ? fileInfo.Title : fileInfo.Filename );
		fileInfo.Dormant.execute( fileInfo );
	}
	else if( iconObject.extension == 'mp3' || iconObject.extension == 'ogg' )
	{
		var rr = iconObject;

		var win = new View ( {
			title    : iconObject.Title ? iconObject.Title : iconObject.Filename,
			width    : 320,
			height   : 100,
			memorize : true
		} );
		
		var urlsrc = ( fileInfo.Path.substr(0, 4) == 'http' ? fileInfo.Path : '/system.library/file/read?mode=rs&sessionid=' + Workspace.sessionId + '&path=' + encodeURIComponent( fileInfo.Path ) ); 
		
		win.setContent( '<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%" class="LoadingAnimation"><iframe style="border: 0; position: absolute; top: 0; left: 0; height: 100%; width: 100%" src="' + urlsrc + '"></iframe></div>' );
		
		win = null;
	}
	// Web bookmarks
	else if( iconObject.extension == 'url' )
	{
		var f = new File( fileInfo.Path );
		f.onLoad = function( data )
		{
			try
			{
				var d = JSON.parse( data );

				Alert( i18n( 'i18n_follow_link' ), '<p class="Layout">' + ( d.notes.length ? d.notes : i18n( 'i18n_follow_link_desc' ) ) + ':</p>' + '<p class="LineHeight TextCenter Rounded Padding BackgroundNegative Negative"><strong>' + i18n( 'i18n_open_link' ) + ': <a onmouseup="CloseView()" href="' + d.link + '" target="_blank" class="Negative">' + d.name + '</a></strong></p>', i18n( 'i18n_cancel' ) );

				window.open( d.link, '_blank' );
			}
			catch( e )
			{
				Alert( i18n( 'i18n_broken_link' ), i18n( 'i18n_broken_link_desc' ) );
			}
		}
		f.load();
	}
	else if( iconObject.extension == 'library' || iconObject.extension == 'module' )
	{
		ExecuteApplication( 'FriendBrowser', iconObject.Path );
	}
	else if(
		iconObject.extension.toLowerCase() == 'jpeg' ||
		iconObject.extension.toLowerCase() == 'jpg' ||
		iconObject.extension.toLowerCase() == 'png' ||
		iconObject.extension.toLowerCase() == 'gif' ||
		iconObject.extension.toLowerCase() == 'pdf' 
	)
	{
		Friend.startImageViewer( iconObject, { parentView: currentMovable } );
	}
	// Run scripts in new shell
	else if( iconObject.extension == 'run' )
	{
		return ExecuteApplication( 'FriendShell', "execute " + iconObject.Path );
	}
	// Run scripts in new shell
	else if( iconObject.Extension && iconObject.Extension == 'application' )
	{
		var jsx = iconObject.Path + iconObject.folderInfo.jsx;
		return ExecuteApplication( 'FriendShell', "execute " + jsx );
	}
	else if( iconObject.extension == 'ogv' || iconObject.extension == 'mov' || iconObject.extension == 'avi' || iconObject.extension == 'mp4' || iconObject.extension == 'mpg' )
	{
		var rr = iconObject;

		var win = new View ( {
			title    : iconObject.Title ? iconObject.Title : iconObject.Filename,
			width    : 650,
			height   : 512,
			memorize : true
		} );

		var num = ( Math.random() * 1000 ) + ( ( new Date() ).getTime() ) + ( Math.random() * 1000 );
		var newWin = win;
		GetURLFromPath( fileInfo.Path, function( url )
		{
			var urlsrc = ( fileInfo.Path.substr(0, 4) == 'http' ? fileInfo.Path : url ); 
			
			newWin.setContent( '<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%" class="LoadingAnimation"><video id="target_' + num + '" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="' + urlsrc + '" controls="controls" autoplay="autoplay" ondblclick="Workspace.fullscreen( this )" ontouchstart="touchDoubleClick( this, function( ele ){ Workspace.fullscreen( ele ); } )"></video></div>' );
		}, '&mode=rs' );
		win = null;
	}
	// Executing executable javascript
	else if( iconObject.extension == 'jsx' )
	{
		var f = new File( fileInfo.Path );
		f.fileInfo = fileInfo;
		f.path = fileInfo.Path;
		f.onLoad = function( data )
		{
			var title = fileInfo.Title ? fileInfo.Title :
				( fileInfo.Filename ? fileInfo.Filename : fileInfo.Path );

			// Run as a normal app
			if( data.match( /Application.run/i ) )
			{
				ExecuteJSX( data, title, false, iconObject.Path );
			}
			// Run in a window
			else
			{
				var w = new View( {
					title: title,
					width:  640,
					height: 480
				} );
				w.setJSXContent( data, title );
			}
		}
		f.load();
	}
	// We've clicked on a directory!
	else if( fileInfo.MetaType == 'Directory' || fileInfo.MetaType == 'Door' )
	{
		var extra = null;
		var wt = fileInfo.Path ? fileInfo.Path : ( fileInfo.Filename ? fileInfo.Filename : fileInfo.Title );

		var id = fileInfo.Type + '_' + wt.split( /[^a-z0-9]+/i ).join( '_' );

		if ( fileInfo.Type == 'Directory' && wt.substr( wt.length - 1, 1 ) != ':' && wt.substr( wt.length - 1, 1 ) != '/' )
			wt += '/';
		wt = wt.split( ':/' ).join ( ':' );

		// Toolbar mode demands unique windows
		if( unique && movableWindows[id] )
			id += Math.random() * 9999 + ( Math.random() * 9999 ) + ( new Date() ).getTime();

		// Is this a volume?
		var isVolume = wt.substr( wt.length - 1, 1 ) == ':' ? true : false;

		var stored = GetWindowStorage( id );
		
		// Reuse or not?
		var w;
		if( targetView )
		{
			w = targetView.windowObject;
			
			var win = w.getWindowElement();
			win.parentFile = iconObject;
			win.parentWindow = iconObject.window;
			win.fileInfo = fileInfo;
			if( !win.fileInfo.Volume )
			{
				if( win.fileInfo.Path )
				{
					win.fileInfo.Volume = win.fileInfo.Path.split( ':' )[0] + ':';
				}
			}
			w.flags.minimized = false;
			w.activate();
			w.toFront();
			return targetView.refresh(); 
		}
		else w = new View ( {
			'title'     : wt,
			'width'     : stored && stored.width ? stored.width : 800,
			'height'    : stored && stored.height ? stored.height : 400,
			'min-width' : 340,
			'min-height': 180,
			'memorize'  : true,
			'id'        : id,
			'volume'    : isVolume,
			'clickableTitle': true
		} );

		// Ok, window probably was already opened, try to activate window
		if( !w.ready )
		{
			if( movableWindows[id] )
			{
				_ActivateWindow( movableWindows[id], false, event );
				_WindowToFront( movableWindows[id] );
			}
			var wo = movableWindows[id];
			if( wo.content )
				wo = wo.content;
			wo.refresh();
			return false;
		}

		// Get legacy win element
		var win = w.getWindowElement();
		
		// Special case - a mobile opens a mountlist
		if( isMobile && fileInfo.Path == 'Mountlist:' )
		{
			extra = {};
			fileInfo.Path = 'Home:';
			iconObject.Path = 'Home:';
			var t = document.createElement( 'div' );
			t.className = 'MobileFileBrowser BackgroundDefault ScrollArea ScrollBarSmall';
			win.parentNode.appendChild( t );
			extra.leftpanel = t;
			extra.startPath = 'Mountlist:';
			extra.hasSidebar = true;
			extra.filedialog = false;
			extra.nosidebarbackground = true;
			w.setFlag( 'title', i18n( 'i18n_mountlist' ) );
		}
		
		win.innerHTML = '<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" class="LoadingAnimation"></div>';
		win.parentFile = iconObject;
		win.parentWindow = iconObject.window;
		win.fileInfo = fileInfo;
		
		if( !win.fileInfo.Volume )
		{
			if( win.fileInfo.Path )
			{
				win.fileInfo.Volume = win.fileInfo.Path.split( ':' )[0] + ':';
			}
		}

		// Create a directory view on window
		var dv = CreateDirectoryView( win, extra );
		w.setFlag( 'hidden', false );

		// Special case - the fileInfo object has a door!
		if( fileInfo.Door )
		{
			var dr = fileInfo.Door;
			if( !dr.getIcons ) return;

			// Connect winbdow and door together
			fileInfo.Door.window = win;
			win.Door = fileInfo.Door;
			win.fileInfo = fileInfo;
			
			var winDoor = win.Door;
			
			win.refresh = function( callback )
			{
				this.directoryview.window.setAttribute( 'listmode', this.directoryview.listMode );
				
				/*if( dv.cancelId )
				{
					CancelCajaxOnId( dv.cancelId );
				}*/
				// Refresh 2
				// Run previous callback
				if( callback )
				{
					if( this.refreshCallback ) this.refreshCallback( false );
					this.refreshCallback = callback;
				}
				
				w.refreshing = true;
				
				var self = this;
				
				var timer = 0;
				if( this.refreshTimeout )
				{
					clearTimeout( this.refreshTimeout );
					timer = 250;
				}
				
				this.refreshTimeout = setTimeout( function()
				{
					var wt = self.fileInfo.Path ? self.fileInfo.Path : ( self.fileInfo.Title ? self.fileInfo.Title : self.fileInfo.Volume );
					
					w.setFlag( 'title', _nameFix( wt ) );
					var fi = self.fileInfo;
					
					// TODO: Figure out something..
					dr.getIcons( fi, function( icons, something, response )
					{
						if( icons )
						{
							// Assign door to each icon
							for( var t in icons )
							{
								if( winDoor.instantiate )
								{
									icons[t].Door = winDoor.instantiate();
								}
								else
								{
									// TODO: What happened? No instantiation?
									console.log( 'Failed to make door.' );
									console.log( winDoor );
								}
							}
							
							// Check, might be reinstantiated..
							if( typeof( self.redrawIcons ) != 'undefined' )
							{
								self.redrawIcons( icons, self.direction );
								if( w.revent ) w.removeEvent( 'resize', w.revent );
								w.revent = w.addEvent( 'resize', function( cbk )
								{
									self.redrawIcons( false, self.direction, cbk );
								} );
								
							}
						}
						// empty, go back
						else
						{
							try
							{
								var dw = self.directoryview;
								Notify( {
									title: i18n( 'i18n_illegal_path' ),
									text: i18n( 'i18n_illegal_path_desc' )
								} );
								// If we're not at the top of the history array, go back
								if( dw.pathHistoryIndex > 0 )
								{
									var fin = dw.pathHistoryRewind();
									dw.window.fileInfo = fin;
				
									if( !isMobile && dw.window.fileBrowser )
									{
										dw.window.fileBrowser.setPath( fin.Path, false, { lockHistory: true, passive: true } );
									}
									dw.window.refresh();
								}
							}
							catch( e )
							{
								console.log( '[Directoryview] No content.' );
							}
						}
						if( callback ) callback();
						
						// Release refresh timeout
						self.refreshTimeout = null;
						w.refreshing = false;
					} );
				}, timer );
			}
		}
		// No door, implement standard refresh
		else
		{
			win.refresh = function ( callback )
			{	
				this.directoryview.window.setAttribute( 'listmode', this.directoryview.listMode );
				
				// Refresh 3
				// Run previous callback
				if( callback )
				{
					if( this.refreshCallback ) this.refreshCallback( false );
					this.refreshCallback = callback;
				}
				
				var self = this;
				w.refreshing = true;
				
				var wt = this.fileInfo.Path ? this.fileInfo.Path : ( this.fileInfo.Title ? this.fileInfo.Title : this.fileInfo.Volume );
				
				w.setFlag( 'title', _nameFix( wt ) );
				
				if( isMobile && wt == 'Mountlist:' )
				{
					w.content.redrawIcons( '', w.content.direction );
					if( callback ) callback();
					return;
				}
				
				var j = new cAjax ();

				var updateurl = '/system.library/file/dir?wr=1'
				updateurl += '&path=' + encodeURIComponent( self.fileInfo.Path );
				updateurl += '&sessionid=' + encodeURIComponent( Workspace.sessionId );

				j.open( 'get', updateurl, true, true );

				j.fileInfo = self.fileInfo;
				j.file = iconObject;
				j.win = self;
				j.onload = function()
				{
					if( this.win.refreshTimeout )
					{
						clearTimeout( this.win.refreshTimeout );
						this.win.refreshTimeout = false;
					}

					var content;
					
					// New mode
					if( this.returnCode == 'ok' )
					{
						try
						{
							// TODO: Fix this bug with null
							var iterations = 0;
							while( this.returnData.charCodeAt( this.returnData.length - 1 ) == 0 && iterations++ < 10 )
								this.returnData = this.returnData.substr( 0, this.returnData.length - 1 );
							content = JSON.parse( this.returnData || "null" );
						}
						catch ( e ){
							console.log( 'Error in directory listing data.. Ask stefkos!' );
						};
					}
					// Legacy mode..
					// TODO: REMOVE FROM ALL PLUGINS AND MODS!
					else
					{
						try
						{
							content = JSON.parse( this.responseText() || "null" );
						}
						catch ( e ){}
					}

					if( content )
					{
						// Fix missing path! Paths come back with "[missing volume:]Documents/file.txt"
						// TODO: This is wrong at the call level
						for( var a = 0; a < content.length; a++ )
						{
							if( content[ a ].Path.indexOf( ':' ) < 0 )
							{
								content[ a ].Path = this.fileInfo.Path.split( ':' )[0] + ':' + content[ a ].Path;
							}
						}
					
						var ww = this.win;

						ww.redrawIcons( content, ww.direction );
						ww.file = this.file;
						if( w.revent ) ww.RemoveEvent( 'resize', ww.revent );
						ww.revent = ww.AddEvent ( 'resize', function ( cbk )
						{
							ww.redrawIcons( null, ww.direction, cbk );
						} );
					}
					else
					{
						try
						{
							var js = JSON.parse( this.returnData );
							// Erroneous path
							if( js.message == 'Path error.' )
							{
								var dw = this.win.directoryview;
								Notify( {
									title: i18n( 'i18n_illegal_path' ),
									text: i18n( 'i18n_illegal_path_desc' )
								} );
								// If we're not at the top of the history array, go back
								if( dw.pathHistoryIndex > 0 )
								{
									var fin = dw.pathHistoryRewind();
									dw.window.fileInfo = fin;
					
									if( !isMobile && dw.window.fileBrowser )
									{
										dw.window.fileBrowser.setPath( fin.Path, false, { lockHistory: true } );
									}
									dw.window.refresh();
								}
							}
						}
						catch( e )
						{
							console.log( '[Directoryview] No content.', this.returnCode, this.returnData );
						}
					}
					if( callback )
					{
						callback();
					}
					w.refreshing = false;
				}
				j.send();
			}
		}

		// If we're busy, delay!
		if( win.refreshTimeout )
		{
			var owp = win;
			clearTimeout( win.refreshTimeout );
			win.refreshTimeout = setTimeout( function()
			{
				owp.refresh();
				PollTaskbar();
			}, 250 );
		}
		else
		{
			win.refresh()
			PollTaskbar();
		}
		
		win = null;
	}
	// TODO: Check mime type!
	else if ( fileInfo.MetaType == 'File' )
	{
		if( fileInfo.Type.toLowerCase() == 'executable' )
		{
			ExecuteApplication( fileInfo.fileName ? fileInfo.fileName :
				( fileInfo.Filename ? fileInfo.Filename : fileInfo.Title ) );
		}
		else
		{
	
			// No mime type? Ask Friend Core
			var mim = new Module( 'system' );
			mim.onExecuted = function( me, md )
			{
				var js = null;
				try
				{
					js = JSON.parse( md );
				}
				catch( e ){};
		
				if( me == 'ok' && js )
				{
					ExecuteApplication( js.executable, fileInfo.Path );
				}
				else
				{
					var fid = typeof ( fileInfo.ID ) != 'undefined' ?
						fileInfo.ID : fileInfo.Filename;
					var cmd = ( typeof ( fileInfo.Command ) != 'undefined' && fileInfo.Command != 'undefined' ) ?
						fileInfo.Command : 'file';
			
					if( cmd == 'file' )
					{
						var dliframe = document.createElement('iframe');
						dliframe.setAttribute('class', 'hidden');
						dliframe.setAttribute('src', fileInfo.downloadhref );
						dliframe.setAttribute('id', 'downloadFrame' + fileInfo.ID );
						dliframe.onload = function()
						{
							document.body.removeChild( dliframe );
							dliframe = null;
						}
						document.body.appendChild( dliframe );
				
						// Just in case, if it takes more than 15 seconds, remove the iframe
						setTimeout( function()
						{
							if( dliframe )
							{
								document.body.removeChild( dliframe );
							}
						}, 15000 );
						return;
					}
			
			
					var win = new View ( {
						'title'    : iconObject.Title ? iconObject.Title : iconObject.Filename,
						'width'    : 800,
						'height'   : 600,
						'memorize' : true,
						'id'       : fileInfo.MetaType + '_' + fid
					} );
					/*console.log( '[9] you are here ... directoryview.js |||| ' + '<iframe style="background: #e0e0e0; position: absolute; top: 0; \
						left: 0; width: 100%; height: 100%; border: 0" \
						src="/system.library/file/read?sessionid=' + Workspace.sessionId + '&path=' + fileInfo.Path + '&mode=rs"></iframe>' );*/
					win.parentFile = iconObject;
					win.parentWindow = iconObject.window;			
					var newWin = win;
					win = null;
					GetURLFromPath( fileInfo.Path, function( url )
					{
						newWin.setContent ( '<iframe style="background: #e0e0e0; position: absolute; top: 0; \
						left: 0; width: 100%; height: 100%; border: 0" \
						src="' + url + '"></iframe>' );
					}, '&mode=rs' );
					return false;
				}
			}
			mim.execute( 'checkmimeapplication', { path: fileInfo.Path } );
		}
	}
	else if ( fileInfo.MetaType == 'DiskHandled' )
	{
		var tmp = fileInfo.Path.split(':');
		ExecuteJSXByPath( tmp[0] + ':index.jsx', fileInfo.Path );
	}

	cancelBubble( event );
}

// Create an icon (fast way) and return the dom element ------------------------
function CreateIcon( fileInfo, directoryview )
{
	if( directoryview )
		fileInfo.directoryview = directoryview;
	var c = new FileIcon( fileInfo );
	return c.file;
}

function RemoveIconEvents( i )
{
	i.onclick = null;
	i.onmousedown = null;
	i.onmouseover = null;
	i.onmouseout = null;
	i.onmouseup = null;
	i.rollOver = null;
	i.rollOut = null;
}


// Helper functions ------------------------------------------------------------

// Some global keys for directoryviews -----------------------------------------
function CheckDoorsKeys( e )
{
	if ( !e ) e = window.event;
	var k = e.which | e.keyCode;
	var cycle = false;
	
	if( !Workspace.editing )
	{
		// No normal dirmode when editing a filename
		var dirMode = window.regionWindow && window.regionWindow.directoryview && window.regionWindow.windowObject &&
			( !window.regionWindow.windowObject.flags || !window.regionWindow.windowObject.flags.editing );
		
		switch( k )
		{
			case 46:
				if( window.regionWindow && window.regionWindow.windowObject && !window.regionWindow.windowObject.flags.editing )
				{
					Workspace.deleteFile();
				}
				break;
			case 13:
				if( dirMode )
				{
					for( var a = 0; a < window.regionWindow.icons.length; a++ )
					{
						if( window.regionWindow.icons[a].selected )
						{
							window.regionWindow.icons[a].domNode.ondblclick();
							return;
						}
					}
				}
				break;
			case 86:
				if( e.ctrlKey || e.command )
				{
					if( dirMode )
					{
						Workspace.pasteFiles( e );
						return cancelBubble( e );
					}
				}
				break;
			case 67:
				if( e.ctrlKey || e.command )
				{
					if( dirMode )
					{
						// Find active
						for( var a = 0; a < window.regionWindow.icons.length; a++ )
						{
							if( window.regionWindow.icons[a].selected )
							{
								Workspace.copyFiles( e );
								return cancelBubble( e );
							}
						}
					
					}
				}
				break;
			case 9:
				cycle = true;
				break;
			default:
				
				break;
		}
	}
	// Do the thing! Keyboard navigation
	if( 
		!Workspace.editing &&
		window.regionWindow && window.regionWindow.directoryview && 
		( window.regionWindow.windowObject && ( !window.regionWindow.windowObject.flags || !window.regionWindow.windowObject.flags.editing ) ) &&
		window.regionWindow.directoryview.keyboardNavigation &&
		!e.ctrlKey
	)
	{
		var rw = window.regionWindow.icons;
		if( rw )
		{
			// cycle!
			if( cycle )
			{
				var scroll = false;
				var found = false;
				for( var a = 0; a < rw.length; a++ )
				{
					if( rw[ a ].selected )
					{
						found = true;
						if( a == rw.length - 1 )
						{
							rw[ 0 ].domNode.onmousedown( e );
							scroll = rw[ 0 ].domNode.offsetTop - 100;
						}
						else
						{
							rw[ a + 1 ].domNode.onmousedown( e );
							scroll = rw[ a + 1 ].domNode.offsetTop - 100;
						}
						break;
					}
				}
				if( !found )
				{
					rw[ 0 ].domNode.onmousedown( e );
					scroll = rw[ 0 ].domNode.offsetTop - 100;
				}
				if( scroll )
				{
					window.regionWindow.directoryview.scroller.scrollTop = scroll;
				}
				return cancelBubble( e );
			}
			else
			{
				var out = [];
				var found = false;
				for( var a = 0; a < rw.length; a++ )
				{
					var f = rw[a].Title ? rw[a].Title : rw[a].Filename;
					if( f.toUpperCase().charCodeAt(0) == k )
					{
						out.push( rw[a] );
						if( rw[a].selected )
						{
							found = true;
						}
					}
				}
				if( out.length )
				{
					if( !found )
					{
						if( out[0] && out[0].domNode )
							out[0].domNode.onmousedown( e );
						return;
					}
					for( var a = 0; a < out.length; a++ )
					{
						if( out[a].selected && a < out.length - 1 )
						{
							out[ a + 1 ].domNode.onmousedown( e );
							return;
						}
					}
					out[ 0 ].domNode.onmousedown( e );
				}
			}
		}
	}
}

// Refresh a directoryview (window) --------------------------------------------
function RefreshDirectoryView( win )
{
	// Is it the workbench window?
	if ( win == ge ( 'Doors' ) )
	{
		RefreshDesktop ();
	}
	// If now, see if it's a normal window
	else
	{
		if( win.redrawIcons )
			win.redrawIcons();
		else if ( win.windowObject && win.windowObject.redrawIcons )
			win.windowObject.redrawIcons();
		else
		{
			console.log('Could not refresh directory view.'); console.log( win );
		}
	}
}

// Loads data using a frame instead... -----------------------------------------
Frameloader = function( auth, pelement )
{
	this.pelement = pelement;
	this.url = '';
	this.vars = [];

	var i = document.createElement( 'iframe' );
	i.className = 'Frameloader';
	this.pelement.appendChild( i );
	this.frame = i;

	this.open = function( url )
	{
		this.url = url;
	}
	this.addVar = function( k, v )
	{
		this.vars[ k ] = v;
	}
	this.load = function()
	{
		var u = this.url;
		var s = '?';
		if ( u.indexOf( '?' ) > 0 ) s = '&';
		for( var a in this.vars )
		{
			u += s+a+'='+encodeURIComponent( this.vars[a] );
			s = '&';
		}
		this.frame.src = u + '&authkey=' + auth + '&frameloaderand=' + Math.random(0,99999)+ '.' + Math.random(0,99999) + '.' + ( new Date() ).getTime();
	}
}

// Load image ------------------------------------------------------------------
Imageloader = function( auth, pelement )
{
	this.pelement = pelement;
	this.url = '';
	this.vars = [];

	var i = document.createElement( 'div' );
	i.className = 'Scroller';
	this.pelement.appendChild( i );
	this.scroller = i;

	this.open = function( url )
	{
		this.url = url;
	}
	this.addVar = function( k, v )
	{
		this.vars[ k ] = v;
	}
	this.load = function()
	{
		var u = this.url;
		var s = '?';
		if ( u.indexOf( '?' ) > 0 ) s = '&';
		for( var a in this.vars )
		{
			u += s+a+'='+encodeURIComponent( this.vars[a] );
			s = '&';
		}
		this.scroller.innerHTML = '<img src="' + u + '&authkey=' + auth + '&imageloaderand=' + Math.random(0,99999)+ '.' + Math.random(0,99999) + '.' + ( new Date() ).getTime() + '" class="Imageloader"/>';
	}
}

if( typeof noEvent == 'undefined' )
{
	function noEvent(e)
	{
		if( e && typeof e.stopPropagation == 'function' ) e.stopPropagation();
		if( e && typeof e.preventDefault == 'function' ) e.preventDefault();
	}
}

// The Friend image viewer! ----------------------------------------------------
Friend.startImageViewer = function( iconObject, extra )
{
	if( !extra ) extra = false;
	
	var win = new View ( {
		title            : iconObject.Title ? iconObject.Title : iconObject.Filename,
		width            : 650,
		height           : 512,
		memorize         : true,
		fullscreenenabled: true
	} );
	
	win.parentView = extra.parentView;
	
	win.onClose = function()
	{
		if( extra && extra.parentView )
		{
			_ActivateWindow( extra.parentView );
		}
	}
	
	// Use system default
	win.content.defaultContextMenu = true;
	
	var owin = win;

	var zoomLevel = 1;
	var zoomImage = null;
	var position = 'centered';
	var zoomSet = false;

	var checkers = '<div class="DefaultContextMenu" style="filter:brightness(0.3);position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url(\'/webclient/gfx/checkers.png\'); background-position: center center;"></div>';

	function repositionElement( win, pos, extra )
	{		
		var image = win._window.getElementsByTagName( 'img' );
		if( !image.length )
			return;
		
		image = image[0];
		
		if( typeof( image.offsetX ) == 'undefined' )
		{
			image.offsetX = 0;
			image.offsetY = 0;
		}
		
		// Enable panning image
		image.onmousedown = function( e )
		{
			var offx = e.clientX;
			var offy = e.clientY;
			var px = image.offsetX;
			var py = image.offsetY;
			image.classList.add( 'Panning' );
			window.mouseDown = image;
			window.mouseReleaseFunc = function()
			{
				image.classList.remove( 'Panning' );
			}
			window.mouseMoveFunc = function( e2 )
			{
				image.offsetX = px + ( e2.clientX - offx );
				image.offsetY = py + ( e2.clientY - offy );
				repositionElement( win );
			}
		}
		// Done panning functions
		
		if( !image.originalDims || extra )
		{
			if( extra && extra.w && extra.h )
			{
				image.originalDims = {
					w: extra.w,
					h: extra.h
				};
			}
			else
			{
				image.originalDims = {
					w: image.width,
					h: image.height
				};
			}
		}
		
		// Fullscreen mode
		if( document.body.classList.contains( 'Fullscreen' ) )
		{
			if( image.offsetWidth > image.offsetHeight )
			{
				var h = Math.round( image.originalDims.h / image.originalDims.w * window.innerWidth );
				image.style.height = h + 'px';
				image.style.width = window.innerWidth + 'px';
				image.style.top = ( document.body.offsetHeight >> 1 ) - Math.round( h >> 1 ) + 'px';
				image.style.left = 0;
			}
			else
			{
				var w = Math.round( image.originalDims.w / image.originalDims.h * window.innerHeight );
				image.style.width = w + 'px';
				image.style.height = window.innerHeight + 'px';
				image.style.top = 0;
				image.style.left = ( document.body.offsetWidth >> 1 ) - Math.round( w >> 1 ) + 'px';
			}
			return;
		}
		
		if( !zoomSet )
		{
			var w = image.originalDims.w;
			var h = image.originalDims.h;

			var winWidth = win.getFlag( 'width' );
			var winHeight = win.getFlag( 'height' );

			if( w > h )
			{
				if( w > winWidth )
				{
					zoomLevel = winWidth / w;
				}
			}
			else
			{
				if( h > winHeight - 100 )
				{
					zoomLevel = ( winHeight - 100 ) / h;
				}
			}
		}

		if( !pos ) pos = position;
		
		var container = image.parentNode;		
		
		if( pos == 'centered' || pos == 'default' )
		{
			var width = image.originalDims.w * zoomLevel;
			var height = image.originalDims.h * zoomLevel;
			
			var ileft = ( container.offsetWidth >> 1 ) - ( width >> 1 );
			var itop  = ( container.offsetHeight >> 1 ) - ( height >> 1 );
			
			var tx = Math.floor( ileft + image.offsetX );
			var ty = Math.floor( itop + image.offsetY );
			
			// Panning >>
			var scrollWidth = container.offsetWidth;
			var scrollHeight = container.offsetHeight;
			
			var dx = width - scrollWidth;
			var dy = height - scrollHeight;

			if( dx <= 0 ) tx = ileft;
			else
			{
				if( tx <= -dx )
					tx = -dx;
				else if( tx + width > scrollWidth + dx )
					tx = scrollWidth + dx - width;
			}
			if( dy <= 0 ) ty = itop;
			else
			{
				if( ty <= -dy )
					ty = -dy;
				else if( ty + height > scrollHeight + dy )
					ty = scrollHeight + dy - height;
			}
			
			image.offsetX = tx - ileft;
			image.offsetY = ty - itop;
			
			// Done panning <<
			
			image.style.top = ty + 'px';
			image.style.left = tx + 'px';
			image.style.width = Math.floor( width ) + 'px';
			image.style.height = Math.floor( height ) + 'px';
			position = pos;
		}
	}
	
	owin.addEvent( 'resize', function()
	{
		repositionElement( owin, position );
	} );
	
	// Handle back
	win.showBackButton( true, function( e )
	{
		Workspace.handleBackButton();
	} );

	function renderToolbar( eparent )
	{
		if( eparent.toolbar ) return;
		var d = document.createElement( 'div' );
		d.className = 'ImageViewerToolbar';
		d.innerHTML = '\
			<div class="ArrowLeft MousePointer"><span class="IconSmall fa-angle-left"></span></div>\
			<div class="Fullscreen MousePointer"><span class="IconSmall fa-arrows-alt"></span></div>\
			<div class="ZoomIn MousePointer"><span class="IconSmall fa-plus-circle"></span></div>\
			<div class="ZoomOut MousePointer"><span class="IconSmall fa-minus-circle"></span></div>\
			<div class="ArrowRight MousePointer"><span class="IconSmall fa-angle-right"></span></div>\
		';
		eparent.appendChild( d );
		var eles = d.getElementsByTagName( 'div' );
		for( var a = 0; a < eles.length; a++ )
		{
			if( eles[a].classList.contains( 'Fullscreen' ) )
			{
				eles[a].onclick = function()
				{
					Workspace.fullscreen( eparent.content );
					setTimeout( function()
					{
						repositionElement( owin );
					}, 250 );
				}
			}
			else if( eles[a].classList.contains( 'ArrowLeft' ) )
			{
				eles[a].onclick = function( e )
				{
					zoomSet = false;
					goDirection( -1, e );
				}
			}
			else if( eles[a].classList.contains( 'ArrowRight' ) )
			{
				eles[a].onclick = function( e )
				{
					zoomSet = false;
					goDirection( 1, e );
				}
			}
			else if( eles[a].classList.contains( 'ZoomIn' ) )
			{
				eles[a].onclick = function( e )
				{
					zoomSet = true;
					zoomLevel *= 2;
					if( zoomLevel > 10 )
						zoomLevel = 10;
					repositionElement( owin );
				}
			}
			else if( eles[a].classList.contains( 'ZoomOut' ) )
			{
				eles[a].onclick = function( e )
				{
					zoomSet = true;
					zoomLevel /= 2;
					if( zoomLevel < 0.1 )
						zoomLevel = 0.1;
					repositionElement( owin );
				}
			}
		}
	}

	var num = ( Math.random() * 1000 ) + ( ( new Date() ).getTime() ) + ( Math.random() * 1000 );
	
	if( iconObject.extension.toLowerCase() == 'pdf' )
	{
		// Remove toolbar..
		if( win._window.parentNode.toolbar )
		{
			win._window.parentNode.removeChild( win._window.parentNode.toolbar );
			win._window.parentNode.toolbar = null;
		}
		
		GetURLFromPath( iconObject.Path, function( imageUrl )
		{
			var urlsrc = ( iconObject.Path.substr(0, 4) == 'http' ? iconObject.Path : imageUrl ); 
			owin.setContent( '<iframe class="DefaultContextMenu ImageViewerContent" src="' + urlsrc + '" style="position: absolute; margin: 0; border: 0; top: 0; left: 0; width: 100%; height: 100%; background-color: black"></iframe>' );
		} );
	}
	else
	{
		// Set the toolbar on the window
		renderToolbar( win._window.parentNode );
	
		GetURLFromPath( iconObject.Path, function( imageUrl )
		{
			var urlsrc = ( iconObject.Path.substr(0, 4) == 'http' ? iconObject.Path : imageUrl ); 
			
			owin.setContent( '<div class="ImageViewerContent" style="white-space: nowrap; position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; background-position: center; background-size: contain; background-repeat: no-repeat; z-index: 1;">' + checkers + '</div>' );
			var i = new Image();
			i.src = imageUrl;
			i.className = 'DefaultContextMenu';
			owin._window.getElementsByClassName( 'ImageViewerContent' )[0].appendChild( i );
			i.onload = function()
			{
				repositionElement( owin, 'default' );
			}
			zoomImage = owin._window.getElementsByTagName( 'img' )[0];
		} );
	}
	function goDirection( dir, e )
	{
		if( dir != 0 )
		{
			var d = new Door().get( iconObject.Path );
			if( !d || !d.getIcons )
			{
				return;
			}
			var path = iconObject.Path.substr( 0, iconObject.Path.length - iconObject.Filename.length );
			var f = {}; for( var a in iconObject ) f[a] = iconObject[a];
			f.Path = path;
			d.getIcons( f, function( data )
			{
				var prev = '';
				var curr = '';
				var prevPath = currPath = '';
				for( var a = 0; a < data.length; a++ )
				{
					// Skip directories
					if( data[ a ].Type == 'Directory' ) continue;
					
					// Skip non-image files
					var last = data[a].Filename.split( '.' );
					var ext = last[ last.length - 1 ].toLowerCase();
					if( !( ext == 'jpg' || ext == 'jpeg' || ext == 'png' || ext == 'gif' ) )
						continue;
						
					prev = curr;
					prevPath = currPath;
					curr = data[a].Filename;
					currPath = data[a].Path;
					zoomLevel = 1;
					
					// Load the image if it lays on a Dormant door
					if( prev && dir == -1 && prev != curr && curr == iconObject.Filename )
					{							
						iconObject.Filename = prev;
						iconObject.Path = prevPath;
						GetURLFromPath( prevPath, function( imageUrl )
						{
							var imgElement = owin._window.getElementsByTagName( 'img' )[0];
							var i = new Image();
							i.src = imageUrl;
							i.onload = function()
							{ 
								var extra = {
									w: i.width,
									h: i.height
								};
								imgElement.src = i.src; 
								imgElement.width = this.width; imgElement.height = this.height; 
								repositionElement( owin, 'default', extra ); 
							}
							owin.setFlag( 'title', curr );
							zoomImage = imgElement;
						} );
						return;
					}
					if( curr && dir == 1 && curr != prev && prev == iconObject.Filename )
					{
						iconObject.Filename = curr;
						iconObject.Path = currPath;
						GetURLFromPath( currPath, function( imageUrl )
						{
							var imgElement = owin._window.getElementsByTagName( 'img' )[0];
							var i = new Image();
							i.src = imageUrl;
							i.onload = function()
							{ 
								var extra = {
									w: i.width,
									h: i.height
								};
								imgElement.src = i.src; 
								imgElement.width = this.width; imgElement.height = this.height; 
								repositionElement( owin, 'default', extra ); 
							}
							owin.setFlag( 'title', curr );
							zoomImage = imgElement;
						} );
						return;
					}
				}
			} );
		}
	};
	function doImage( path, title )
	{
	}
	win = null;
};

function GetIconClassByExtension( extension, fileInfo )
{
	var iconInner = { className: '' };
	switch( extension )
	{
		case 'info':
			iconInner.className = 'MetaFile';
			break;
		case 'library':
			iconInner.className = 'System_Library';
			break;
		case 'jpg':
			iconInner.className = 'TypeJPG';
			break;
		case 'jpeg':
			iconInner.className = 'TypeJPEG';
			break;
		case 'psd':
			iconInner.className = 'TypePSD';
			break;
		case 'png':
			iconInner.className = 'TypePNG';
			break;
		case 'gif':
			iconInner.className = 'TypeGIF';
			break;
		case 'odt':
			iconInner.className = 'TypeDOC';
			break;
		case 'ods':
			iconInner.className = 'TypeODS';
			break;
		case 'xlsx':
			iconInner.className = 'TypeXLS';
			break;
		case 'xls':
			iconInner.className = 'TypeXLSX';
			break;
		case 'abw':
			iconInner.className = 'TypeABW';
			break;
		case 'docx':
			iconInner.className = 'TypeDOCX';
			break;
		case 'doc':
			iconInner.className = 'TypeDOC';
			break;
		case 'svg':
			iconInner.className = 'TypeSVG';
			break;
		case 'eps':
			iconInner.className = 'TypeEPS';
			break;
		case 'pdf':
			iconInner.className = 'TypePDF';
			break;
		case 'url':
			iconInner.className = 'TypeWebUrl';
			break;
		case 'txt':
			iconInner.className = 'TypeTXT';
			break;
		case 'avi':
			iconInner.className = 'TypeAVI';
			break;
		case 'mp4':
			iconInner.className = 'TypeMP4';
			break;
		case 'mov':
			iconInner.className = 'TypeMOV';
			break;
		case 'webm':
			iconInner.className = 'TypeWEBM';
			break;
		case 'mpeg':
			iconInner.className = 'TypeMPEG';
			break;
		case 'm4a':
		case 'mp3':
			iconInner.className = 'TypeMP3';
			break;
		case 'wav':
			iconInner.className = 'TypeWAV';
			break;
		case 'ogg':
			iconInner.className = 'TypeOGG';
			break;
		case 'ogv':
			iconInner.className = 'TypeOGV';
			break;
		case 'flac':
			iconInner.className = 'TypeFLAC';
			break;
		case 'pls':
			iconInner.className = 'TypePLS';
			break;
		case 'jsx':
			iconInner.className = 'TypeJSX';
			break;
		case 'php':
			iconInner.className = 'TypePHP';
			break;
		case 'js':
			iconInner.className = 'TypeJS';
			break;
		case 'run':
			iconInner.className = 'TypeRUN';
			break;
		case 'css':
			iconInner.className = 'TypeCSS';
			break;
		case 'json':
			iconInner.className = 'TypeJSON';
			break;
		case 'html':
			iconInner.className = 'TypeHTML';
			break;
		case 'bak':
			iconInner.className = 'TypeBak';
			break;
		case 'fpkg':
			iconInner.className = 'TypeFPkg';
			break;
		case 'apf':
			iconInner.className = 'TypeApf';
			break;
		case 'zip':
			iconInner.className = 'TypeZip';
			break;
		case 'ppt':
			iconInner.className = 'TypePPT';
			break;
		case 'odp':
			iconInner.className = 'TypeODP';
			break;
		case 'pptx':
			iconInner.className = 'TypePPTX';
			break;
		case 'gz':
			iconInner.className = 'TypeGZ';
			break;
		case 'bz':
		case 'bz2':
			iconInner.className = 'TypeBZ';
			break;
		case 'tgz':
			iconInner.className = 'TypeTGZ';
			break;
		case 'tar':
			iconInner.className = 'TypeTAR';
			break;
		case '7z':
			iconInner.className = 'Type7Z';
			break;
		case 'lha':
			iconInner.className = 'TypeLHA';
			break;
		case 'deb':
			iconInner.className = 'TypePKGLINUX';
			break;
		case 'rpm':
			iconInner.className = 'TypePKGLINUX';
			break;
		default:
			switch( fileInfo.MetaType )
			{
				case 'Meta':
					iconInner.className = 'Application';
					break;
				case 'Directory':
					if( fileInfo.Title == 'Upload' )
					{
						iconInner.className = 'Directory Upload';
					}
					else iconInner.className = 'Directory';
					break;
				default:
					iconInner.className = 'File';
			}
			if( typeof ( fileInfo.Type ) != 'undefined' )
				iconInner.className += ' ' + fileInfo.Type;
			// Disk icons!
			if( fileInfo.Type == 'Door' )
			{
				if( fileInfo.Door && fileInfo.Door.Type == 'Assign' )
					iconInner.className += ' Assign';
				else iconInner.className = 'Door';
				iconInner.className += ' ' + fileInfo.Handler.split( '.' ).join( '_' );
			}
			break;
	}
	return iconInner.className;
}

// End Friend Image Viewer! ----------------------------------------------------


// -----------------------------------------------------------------------------
if( !window.isMobile )
{
	if ( window.addEventListener )
		window.addEventListener ( 'keydown', CheckDoorsKeys );
	else window.attachEvent ( 'onkeydown', CheckDoorsKeys );
}
