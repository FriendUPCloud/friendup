/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// DirectoryView class ---------------------------------------------------------

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

DirectoryView = function( winobj, extra )
{	
	var ws = GetWindowStorage( winobj.uniqueId );
	// Initial values
	this.listMode = ws && ws.listMode ? ws.listMode : 'iconview';
	this.sortColumn = 'filename';
	this.sortOrder = 'ascending';
	this.showHiddenFiles = false;
	this.navMode = globalConfig.navigationMode == 'spacial' ? globalConfig.navigationMode : 'toolbar'; // default is now using toolbar
	this.pathHistory = [];
	this.pathHistoryIndex = 0;
	
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

DirectoryView.prototype.addToHistory = function( ele )
{
	if( this.pathHistory.length == 0 )
	{
		this.pathHistory = [ ele ];
		this.pathHistoryIndex = 0;
		return;
	}
	this.pathHistory.push( ele );
	this.pathHistoryIndex = this.pathHistory.length - 1;
	this.window.fileInfo = ele;
}

DirectoryView.prototype.setHistoryCurrent = function( ele )
{
	this.pathHistory[ this.pathHistoryIndex ] = ele;
	var out = [];
	for( var a = 0; a <= this.pathHistoryIndex; a++ )
	{
		out.push( this.pathHistory[a] );
	}
	this.pathHistory = out;
	this.window.fileInfo = ele;
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
		/*{
			element: 'button',
			className: 'Home IconSmall fa-home',
			content: i18n( 'i18n_dir_btn_root' ),
			onclick: function( e )
			{
				var path = winobj.fileInfo.Volume.split( ':' );
				var fin = {
					Volume: path[0] + ':',
					Path: path[0] + ':',
					Title: path[0],
					Type: winobj.fileInfo.Type,
					Door: Workspace.getDoorByPath( path.join( ':' ) )
				}

				// Set current ele
				dw.setHistoryCurrent( fin );

				winobj.refresh();
			}
		},*/
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

				// Set as current history element at end of list
				dw.addToHistory( fin );
				
				// Animation for going to next folder
				if( isMobile )
				{
					var n = document.createElement( 'div' );
					n.className = 'Content SlideAnimation';
					n.style.willChange = 'transform';
					n.style.transition = 'transform 0.4s';
					n.innerHTML = winobj.innerHTML;
					n.scrollTop = winobj.scrollTop;
					n.style.zIndex = 10;
					winobj.parentNode.appendChild( n );
					
					winobj.parentNode.classList.add( 'Redrawing' );
					
					// Refresh and animate
					winobj.refresh( function()
					{
						n.style.transform = 'translateX(100%)';
						setTimeout( function()
						{
							n.parentNode.removeChild( n );
							winobj.parentNode.classList.remove( 'Redrawing' );
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
					var fin = dw.pathHistory[--dw.pathHistoryIndex];
					winobj.fileInfo = fin;
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
					var fin = dw.pathHistory[++dw.pathHistoryIndex];
					winobj.fileInfo = fin;
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
			d.className = 'FileBrowserContainer BackgroundHeavier ScrollBarSmall';
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
		winobj.fileBrowser = new Friend.FileBrowser( d, { path: winobj.fileInfo.Path, displayFiles: false, justPaths: self.filedialog || self.hasSidebar, filedialog: self.filedialog }, {
			checkFile( filepath, fileextension )
			{
				console.log( filepath + ' on ' + fileextension );
			},
			loadFile( filepath )
			{
				// 
			},
			folderOpen( path )
			{
				var vol = path.split( ':' )[0];
				winobj.fileInfo.Path = path;
				winobj.fileInfo.Volume = vol + ':';
				self.addToHistory( winobj.fileInfo );
				
				winobj.refresh();
			},
			folderClose( path )
			{
				var vol = path.split( ':' )[0];
				winobj.fileInfo.Path = path;
				winobj.refresh();
			}
		} );
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
			if( !eles[a].className || !eles[a].classList.contains( 'Selected' ) )
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
	winobj.redrawIcons = function( icons, direction, callback )
	{
		var dirv = this.directoryview;
		
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
			
			if( dirv.bookmarks && !dirv.bookmarks.classList.contains( 'ScreenContent' ) )
			{
				// Bookmarks
				dirv.bookmarks.style.width = '100%';
				dirv.bookmarks.style.left = '0';
				dirv.bookmarks.style.transition = 'transform 0.4s';
				
				// Filearea is always put in a container
				dirv.filearea.parentNode.style.left = '0';
				dirv.filearea.parentNode.style.width = '100%';
				dirv.filearea.parentNode.style.transition = 'transform 0.4s';
				dirv.filearea.style.transition = 'transform 0.4s';
				
				if( winobj.fileInfo.Path == 'Mountlist:' )
				{
					if( dirv.filearea.parentNode.classList.contains( 'View' ) )
					{
						dirv.filearea.style.transform = 'translateX(100%)';
					}
					else
					{
						dirv.filearea.parentNode.style.transform = 'translateX(100%)';
					}
					dirv.bookmarks.style.transform = 'translateX(0%)';
					winobj.parentNode.classList.add( 'Mountlist' );
					dirv.ShowFileBrowser();
					winobj.windowObject.setFlag( 'title', i18n( 'i18n_mountlist' ) );
					return;
				}
				else
				{
					if( dirv.filearea.parentNode.classList.contains( 'View' ) )
						dirv.filearea.style.transform = 'translateX(0%)';
					else dirv.filearea.parentNode.style.transform = 'translateX(0%)';
					dirv.bookmarks.style.transform = 'translateX(-100%)';
					winobj.parentNode.classList.remove( 'Mountlist' );
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

		// TODO: Check if this is used or remove!
		if( this.running )
		{
			return;
		}

		// Blocking? Wait with call
		if( this.redrawing )
		{
			// This will overwrite the queued redraw with updated data
			this.queuedRedraw = function(){
				winobj.redrawIcons( icons, direction );
			};
			return;
		}

		this.redrawing = true;

		// Store
		if( icons )
		{
			this.icons = icons;
			this.allIcons = icons;
		}
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
						self.icons = sortArray( out, [ 'Title', 'Filename' ], self.directoryview.sortOrder );
					}
					else if( self.directoryview.sortColumn == 'type' )
					{
						self.icons = sortArray( out, [ 'Extension', 'Title', 'Filename' ], self.directoryview.sortOrder );
					}
					else if( self.directoryview.sortColumn == 'size' )
					{
						self.icons = sortArray( out, [ 'SizeSortable', 'Title', 'Filename' ], self.directoryview.sortOrder );
					}
					else
					{
						self.icons = sortArray( out, [ 'DateModified', 'Title', 'Filename' ], self.directoryview.sortOrder );
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
			var files = e.dataTransfer.files || e.target.files;

			if( files.length < 1 ) return;

			e.stopPropagation();
			e.preventDefault();
			
			
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
			if( e.dataTransfer.items )
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
					if( busyTimeout )
						clearTimeout( busyTimeout );
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
						itm.file( function( f )
						{
							uworker.postMessage( { recursiveUpdate: true, item: f, fullPath: itm.fullPath, size: f.size, session: Workspace.sessionId } );
						} );
					}
					else
					{
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
				countItems( e.dataTransfer.items );
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

							Notify( { title: i18n( 'i18n_upload_completed' ), 'text':i18n('i18n_uploaded_to_downloads') }, false, function()
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
// Dropping an icon on a window or an icon!
DirectoryView.prototype.doCopyOnElement = function( eles, e )
{
	var dview = this;
	var mode = 'view';
	
	var a;

	// Function to use for installing application packages
	function DInstallPackage( fileInfo )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' )
			{
				Notify( { title: i18n( 'i18n_failed_install_package' ), text: i18n( 'i18n_package_failed' ) + ': ' + fileInfo.Filename } );
			}
			else
			{
				Notify( { title: i18n( 'i18n_package_installed' ), text: i18n( 'i18n_package' ) + ': ' + fileInfo.Filename + ', ' + i18n( 'i18n_was_installed' ) } );
			}
		}
		m.execute( 'installpackage', { path: fileInfo.Path } );
	}

	// Check if this is a special view
	if( this.fileInfo && this.fileInfo.Path && this.fileInfo.Path.indexOf( 'System:' ) == 0 )
	{
		// Trying to install something!
		if( this.fileInfo.Path == 'System:Software/' )
		{
			for( a = 0; a < eles.length; a++ )
			{
				var f = eles[a];

				if( f.fileInfo.Filename.toLowerCase().indexOf( '.fpkg' ) > 0 )
				{
					DInstallPackage( f.fileInfo );
				}
			}
		}
		return;
	}
	// We are operating on a file directory icon?
	else if( this.object && this.object.file )
	{
		if( !this.object.file.directoryView )
		{
			return false;
		}
		if( !this.object.file.fileInfo || ( this.object.file.fileInfo.Type != 'Directory' && this.object.file.fileInfo.Type != 'Door' ) )
		{
			return false;
		}
		// Ok, tell function we're operating on a FileIcon
		mode = 'directory';
	}


	// Check some events
	if( !e ) e = window.event;

	if( !dview.fileoperations )
	{
		dview.fileoperations = [];
		dview.operationcounter = 0;
	}

	// Make sure we register the ctrl key held down!
	var ctrl = ( typeof( e ) != 'undefined' && e.ctrlKey ) ? e.ctrlKey : false;
	if( !ctrl && typeof( e ) != 'undefined' && e.shiftKey ) ctrl = true;

	// Window is the target
	var cfo = mode == 'view' ? dview.content.fileInfo : dview.object.file.fileInfo;

	// Can't drop stuff on myself!
	if( mode == 'view' && dview.content == eles[0].window )
	{
		cfo = false;

		// Check if we're dropping on a folder icon
		var divs = dview.content.getElementsByTagName( 'div' );
		var icons = [];

		var mx = windowMouseX - dview.offsetLeft;
		var my = windowMouseY - dview.offsetTop;

		for( a = 0; a < divs.length; a++ )
		{
			if( divs[a].className.indexOf( 'File' ) == 0 && divs[a].fileInfo )
			{
				var ic = divs[a];
				icons.push( ic );
				// Check if the mouse entered here
				if( !cfo && mx >= ic.offsetLeft && my >= ic.offsetTop && mx < ic.offsetLeft + ic.offsetWidth && my < ic.offsetTop + ic.offsetHeight )
				{
					// We found a better target!
					if( ic.fileInfo.Type == 'Directory' )
					{
						cfo = ic.fileInfo;
						break;
					}
				}
			}
		}

		if( !cfo )
		{
			dview.content.refresh();
			eles[0].window.refresh();
			return;
		}
	}

	// Immediately refresh source!
	var winobj = mode == 'view' ? this.windowObject : dview.directoryView.windowObject;
	Workspace.diskNotification( [ winobj, eles[0].window ], 'refresh' );

	// Sanitize input... no folder to be dropped into themselves or their children....
	var clean = [];
	for( var i = 0; i < eles.length; i++ )
	{
		if( !cfo.Path || !eles[i].window.fileInfo || !eles[i].window.fileInfo.Path )
		{
			clean.push( eles[i] );
			continue;
		}
		if( ( '' + cfo.Path != eles[i].window.fileInfo.Path + eles[i].Title + '/') )
		{
			clean.push( eles[i] );
			for( var j in movableWindows )
			{
				if(
					movableWindows[j] && movableWindows[j].titleString &&
					('' + movableWindows[j].titleString ).indexOf( eles[i].window.fileInfo.Path + eles[i].Title ) != -1
				)
				{
					if( movableWindows[ j ].content && movableWindows[ j ].content.directoryview )
					{
						movableWindows[j].windowObject.close();
					}
				}
			}
		}
	}

	// No items (they were cleaned out) Refresh source
	if( clean.length == 0 || ( clean.length == 1 && !clean[0] ) )
	{
		eles[0].window.refresh();
		return;
	}

	eles = clean;
	
	// Source window
	var sview = eles[0].window;

	// Info files might be added in the copy as well
	if( clean && eles[0].window && eles[0].window.allIcons )
	{
		var add = [];
		// Check all icons to be copied
		for( a = 0; a < eles[0].window.allIcons.length; a++ )
		{
			// Loop throught dropped icons
			for( var b = 0; b < eles.length; b++ )
			{
				var f = eles[0].window.allIcons[a];
				var fn = eles[b].fileInfo.Filename ? eles[b].fileInfo.Filename : eles[b].fileInfo.Title;
				if( fn.substr( fn.length - 5, 5 ).toLowerCase() == '.info' )
					continue;
				if( fn.substr( fn.length - 8, 8 ).toLowerCase() == '.dirinfo' )
					continue;
				if( f.Filename == fn + '.info' || f.Filename == fn + '.dirinfo' )
				{
					if( !f.fileInfo ) f.fileInfo = f;
					add.push( f );
				}
			}
		}
		if( add.length ) 
		{
			for( a = 0; a < add.length; a++ )
			{
				eles.push( add[a] );
			}
		}
	}

	var destinationFI = mode == 'view' ? dview.content.fileInfo : dview.object.file.fileInfo;
	var sPath = destinationFI.Path; // set path
	var dPath = eles[0].window.fileInfo ? eles[0].window.fileInfo.Path : false; // <- dropped path

	// We can't copy to self!
	if( sPath == dPath && !e.paste )
	{
		if( mode == 'view' ) dview.content.refresh();
		else if( dview.directoryView.content ) dview.directoryView.content.refresh();
		return;
	}

	// Always copy when on different volumes
	if(
		sPath && dPath &&
		destinationFI && eles[0].window.fileInfo &&
		destinationFI.Path.split( ':' )[0] != eles[0].window.fileInfo.Path.split( ':' )[0]
	)
	{
		ctrl = true;
	}

	//Confirm( 
	//	ctrl ? i18n( 'i18n_copying_files' ) : i18n( 'i18n_moving_files' ), 
	//	ctrl ? i18n( 'i18n_do_you_want_copy' ) : i18n( 'i18n_do_you_want_move' ), function( res )
	//{
		
		// make sure we have valid source and destination and neither of them is on System: volume and we have no ape using us....
		if( !sPath || !dPath || sPath.indexOf( 'System:' ) == 0 || dPath.indexOf( 'System:' ) == 0 || dview.ongoingdropprepare )
		{
			if( eles[0].window && eles[0].window.refresh )
				eles[0].window.refresh();
			else Workspace.refreshDesktop();
			if( mode == 'view' ) dview.content.refresh();
			else if( dview.directoryView.content ) dview.directoryView.content.refresh();
			return;
		}

		// we are all set...
		// change 2016-04 - allow multiple operations at once....
		dview.ongoingdropprepare = true;

		dview.fileoperations[ dview.operationcounter ] = {};
		dview.fileoperations[ dview.operationcounter ].sPath = sPath;
		dview.fileoperations[ dview.operationcounter ].dPath = dPath;


		// Open window
		dview.fileoperations[ dview.operationcounter ].view = new View( {
			title:  ctrl ? i18n( 'i18n_copying_files' ) : i18n('i18n_moving_files'),
			width:  320,
			height: 100,
			id:     'fileops_' + dview.id + "_" + dview.operationcounter
		} );

		//console.log('dview',dview,('iD ' + ( dview.id ? dview.id : 'no id on dview' ) ) );


		dview.fileoperations[ dview.operationcounter ].view.myid = dview.operationcounter;
		dview.fileoperations[ dview.operationcounter ].view.master = dview;

		// Load template
		dview.fileoperations[ dview.operationcounter ].progress = new File( 'templates/file_operation.html' );
		dview.fileoperations[ dview.operationcounter ].progress.master = dview;
		dview.fileoperations[ dview.operationcounter ].progress.myid = dview.operationcounter;

		dview.fileoperations[ dview.operationcounter ].progress.onLoad = function( data )
		{
			var w = this.master.fileoperations[ this.myid ].view;
			var windowArray = this.master.fileoperations;
			var windowArrayKey = this.myid;

			data = data.split( '{cancel}' ).join( i18n( 'i18n_cancel' ) );
			w.setContent( data );

			// Setup progress bar
			var eled = this.master.fileoperations[ this.myid ].view.getWindowElement().getElementsByTagName( '*' );
			var groove = false, bar = false, frame = false, progressbar = false;
			var fcb = false;
			for( var a = 0; a < eled.length; a++ )
			{
				if( eled[a].classList )
				{
					var types = [ 'ProgressBar', 'Groove', 'Frame', 'Bar', 'FileCancelButton' ];
					for( var b = 0; b < types.length; b++ )
					{
						if( eled[a].classList.contains( types[b] ) )
						{
							switch( types[b] )
							{
								case 'ProgressBar': progressbar = eled[a]; break;
								case 'Groove':      groove      = eled[a]; break;
								case 'Frame':       frame       = eled[a]; break;
								case 'Bar':         bar         = eled[a]; break;
								case 'FileCancelButton': fcb    = eled[a]; break;
							}
						}
					}
				}
			}

			// Close button
			if( fcb )
			{
				fcb.onclick = function()
				{
					w.close();
				}
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
				bar.total = eles.length;
				bar.items = eles.length;
				var handleBarRefresh = setInterval( function()
				{
					var size = Math.floor( 100 - ( 100 / bar.total * bar.items ) );
					if ( size != bar.friendSize )
					{
						bar.friendSize = size;
						bar.style.width = size + '%';
						bar.innerHTML = '<div>' + size + '%</div>';
					}
				}, 100 );

				// Create a filecopy object
				var fileCopyObject = {

					files: [],
					directories:[],
					processing: 0,
					stepsize: 10,
					stop: false,
					fileInfoCheck: function( ele )
					{
						if( !ele.fileInfo )
						{
							ele.fileInfo = {
								Type: ele.Type,
								Path: ele.Path,
								Filesize: ele.Filesize,
								Filename: ele.Filename
							};
						}
					},
					// Find files in folders
					findSubFiles: function( folder )
					{
						// Counting!
						this.processing++;
						var d = Workspace.getDoorByPath( folder.ele.fileInfo.Path );
						if( !d )
						{
							this.processing--;
							return;
						}

						var o = this;

						// Get icons on path
						d.getIcons( folder.ele.fileInfo, function( result )
						{
							var files = [];
							for( var z = 0; z < result.length; z++ )
							{
								// We need to have fileInfo
								o.fileInfoCheck( result[z] );
								if( result[z].Type.toLowerCase() == 'directory' )
								{
									var d = Workspace.getDoorByPath( result[z].Path );
									files.push( result[z] );
									o.findSubFiles( { door: d, ele: result[z] } );
								}
								else if( result[z].Type.toLowerCase() == 'file' )
								{
									files.push( result[z] );
								}
							}
							// Put the files in the right order!
							o.checkFiles( files );
							// Done counting!
							o.processing--;
							o.checkFinished();
						} );
					},
					// Check all files (type etc)
					checkFiles: function( checkFiles )
					{
						// Counting!
						this.processing++;
						var typ, fnam;
						var eles = [];
						var files = [];
						var finFiles = [];
						var fsorted = [];
						var a, b, found;
					
						// Add dirs and files separately
						for( a = 0; a < checkFiles.length; a++ )
						{
							typ = checkFiles[a].fileInfo.Type.toLowerCase();
							fnam = checkFiles[a].fileInfo.Filename;
							if( typ == 'directory' )
							{
								eles.push( checkFiles[a] );
							}
							else
							{
								files.push( checkFiles[a] );
							}
						}
					
						// Make sure that .info files always comes first
						for( b = 0; b < 2; b++ )
						{
							for( a = 0; a < files.length; a++ )
							{
								fnam = files[a].fileInfo.Filename;
								if( 
									b == 0 && (
										fnam.substr( fnam.length - 5, 5 ) == '.info' ||
										fnam.substr( fnam.length - 8, 8 ) == '.dirinfo' 
									)
								)
								{
									finFiles.push( files[a] );
								}
								else if(
									b == 1 && (
										fnam.substr( fnam.length - 5, 5 ) != '.info' &&
										fnam.substr( fnam.length - 8, 8 ) != '.dirinfo'
									)
								)
								{
									finFiles.push( files[a] );
								}
							}
						}
					
						// Overwrite files with finFiles
						files = finFiles;
					
						// Temp
						//console.log( 'Sorted files with .info|.dirinfo first.' );
					
						// Find .dirinfo files
						var toPush = [];
						for( b = 0; b < files.length; b++ )
						{
							found = false;
							for( a = 0; a < eles.length; a++ )
							{
								// Does directory + .dirinfo match file (the real dirinfo file)
								if( eles[a].fileInfo.Filename + '.dirinfo' == files[b].fileInfo.Filename )
								{
									// Put .dirinfo file on directory
									eles[a].infoFile = files[b];
									//console.log( 'Added a info file: ' + files[b].fileInfo.Filename );
									found = true;
									break;
								}
							}
							// We didn't find a directory for this file
							if( !found )
							{
								// Push to files to copy
								toPush.push( files[b] );
							}
						}
					
						// Clean up and put files "to push" into files for copy
						delete files;
						delete finFiles;
						if( toPush.length )
						{
							for( a = 0; a < toPush.length; a++ )
								eles.push( toPush[a] );
						}
						delete toPush;
					
						// File infos first, go through all files for copy
						for( a = 0; a < eles.length; a++ )
						{
							var d = Workspace.getDoorByPath( eles[a].fileInfo.Path );
							var fin = eles[a].fileInfo;
							if( d )
							{
								// Make sure we have file info
								this.fileInfoCheck( fin );

								// Add dirs and files to queue
								var tt = fin.Type.toLowerCase();
								if( tt == 'directory' || tt == 'file' )
								{
									this.files.push( eles[a] );
								}
								// Directories adds sub files subsequently
								if( fin.Type.toLowerCase() == 'directory' )
								{
									// Add folder and make sub paths
									this.findSubFiles( { door: d, ele: eles[a] } );
								}
							}
						}

						// Not counting anymore
						this.processing--;

						// No more processing loops, it means we're finished!
						this.checkFinished();
					},
					// Copy files that have been added
					copyFiles: function()
					{
						// TODO: Performance test / question:
						//       Do we queue these, or just loop through,
						//       relying on server timeout
						if( !this.files || !this.files.length )
						{
							// No files, abort
							// Close window
							w.close();
							return false;
						}

						var fob = this;

						// Make sure our path is right
						var cfoF = cfo.Path.substr( cfo.Path.length - 1 );
						var p = '';
						if( cfoF != '/' && cfoF != ':' )
							p = '/';

						var i = 0;
						var stopAt = Math.min( this.stepsize, this.files.length );
						var fl, toPath, initNextBatch;
						var door;

						initNextBatch = false;

						for( i = 0; i < stopAt; i++ )
						{
							fl = this.files[ i ];
							
							// Could be we have a just in time modified new path instead of path (in case of overwriting etc)
							var destPath = fl.fileInfo.NewPath ? fl.fileInfo.NewPath : fl.fileInfo.Path;
							
							toPath = cfo.Path + p + destPath.split( eles[0].window.fileInfo.Path ).join( '' );
							door = Workspace.getDoorByPath( fl.fileInfo.Path );

							// Sanitation
							while( toPath.indexOf( '//' ) >= 0 ) toPath = toPath.split( '//' ).join ( '/' );

							if( i + 1 == stopAt ) initNextBatch = true;

							//console.log( 'Copying from: ' + fl.fileInfo.Path + ', to: ' + toPath );

							// Do the copy - we have files here only...
							door.dosAction( 'copy', { from: fl.fileInfo.Path, to: toPath }, function( result )
							{
								//var result = 'ok<!--separate-->'; // temp!
								// TODO: Check if we failed the copy with "fail" result and if so stop!
								if( fob.stop ) return;
								fileCopyObject.nextStep( result, initNextBatch );
							} );
						}
					},
					createDirectories: function( reduceBar )
					{
						//update progress bar...
						if( reduceBar )
						{
							bar.items--; 
						}

						if( this.directories.length == 0 )
						{
							this.copyFiles();
						}
						else
						{
							// Make sure our path is right
							var cfoF = cfo.Path.substr( cfo.Path.length - 1 );
							var p = '';
							if( cfoF != '/' && cfoF != ':' )
								p = '/';

							var dir = this.directories.shift();
							var toPath = cfo.Path + p + dir.fileInfo.Path.split(eles[0].window.fileInfo.Path).join('');
							var door = Workspace.getDoorByPath( cfo.Path );

							// Sanitation
							while( toPath.indexOf( '//' ) >= 0 ) toPath = toPath.split( '//' ).join ( '/' );
						
							// Put it in a func
							function mkdirhere()
							{
								//console.log( 'Makedir: ' + toPath );
								door.dosAction( 'makedir', { path: toPath }, function( result )
								{
									//var result = 'ok<!--separate-->'; // temp!
									var res = result.split( '<!--separate-->' );
									if( res[0] == 'ok' && !fileCopyObject.stop )
									{
										fileCopyObject.createDirectories( true );
									}
									// Failed - alert user
									else
									{
										Notify( { title: i18n( 'i18n_filecopy_error' ), text: i18n( 'i18n_could_not_make_dir' ) + ' (' + toPath + ')' } );
										w.close();
										sview.refresh();
									}
								});
							}
						
							// If dir has infofile, copy it first
							if( dir.infoFile )
							{
								// Info file is copied to parent of dir
								var ftPath = toPath.substr( 0, toPath.length - 1 ); // strip /
								var toParentPath = ftPath.indexOf( '/' ) > 0 ? ftPath.split( '/' ) : ftPath.split( ':' );
								toParentPath.pop();
								if( toParentPath.length == 1 ) toParentPath = toParentPath[0] + ':';
								else toParentPath = toParentPath.join( '/' ) + '/';
								toParentPath += dir.infoFile.Filename;
							
								//console.log( 'Copying from ' + dir.infoFile.fileInfo.Path + ', to: ' + toParentPath );
								door.dosAction( 'copy', { from: dir.infoFile.fileInfo.Path, to: toParentPath }, function( result )
								{
									//var result = 'ok<!--separate-->'; // temp!
									// TODO: Check result! If it is "fail" then stop
									var res = result.split( '<!--separate-->' );
									if( res[0] == 'ok' )
									{
										if( fileCopyObject.stop ) return;
										// Now make dir
										mkdirhere();
									}
									else
									{
										Notify( { title: i18n( 'i18n_filecopy_error' ), text: res[1] + ' (' + toPath + ')' } );
										w.close();
										sview.refresh();
									}
								} );
							}
							// Just maked ir
							else
							{
								mkdirhere();
							}
						}
					},
					nextStep: function( result, initNewRun )
					{
						var fob = this;
						if( initNewRun && fileCopyObject.files.length > this.stepsize )
						{
							var f = fileCopyObject.files;
							var nf = [];
							for( var b = this.stepsize; b < f.length; b++ )
								nf.push( f[b] );
							fileCopyObject.files = nf;
							fileCopyObject.copyFiles();
						}

						// Timed refresh (don't refresh a zillion times!
						if( eles[0].window && eles[0].window.refresh )
						{
							if( this.refreshTimeout ) clearTimeout( this.refreshTimeout );
							this.refreshTimeout = setTimeout( function()
							{
								eles[0].window.refresh();
								fob.refreshTimeout = 0;
							}, 500 );
						}

						bar.items--;

						if( bar.items == 0 )
						{
							// No control key in? Delete files after copying - essentially moving the files
							if( !ctrl )
							{
								// Now delete files
								//first make the list complete again
								fob.files = fob.originalfilelist;

								w.deletable = fob.files.length;

								bar.innerHTML = '<div class="FullWidth" style="text-overflow: ellipsis; text-align: center; line-height: 30px; color: white">Cleaning up...</div>';

								// Delete in reverse
								for( var b = fob.files.length - 1; b >= 0; b-- )
								{
									d.dosAction( 'delete', { path: fob.files[b].fileInfo.Path }, function( result )
									{
										w.deletable--;
										if( w.deletable == 0 )
										{
											// Close window
											clearInterval( handleBarRefresh );
											w.close();

											// Tell Friend Core something changed
											var l = new Library( 'system.library' );
											l.execute( 'file/notifychanges', { path: fob.files[0].fileInfo.Path } );
											var l = new Library( 'system.library' );
											l.execute( 'file/notifychanges', { path: eles[0].window.fileInfo.Path } );
										}
									} );
								}
							}
							// Just copy! No delete! :)
							else
							{
								// Close window
								clearInterval( handleBarRefresh );
								w.close();

								// Tell Friend Core something changed
								var l = new Library( 'system.library' );
								var p = winobj._window ? ( winobj._window.fileInfo.Path ? winobj._window.fileInfo.Path : winobj._window.fileInfo.Volume ) : false;
								if( p )
								{
									l.execute( 'file/notifychanges', { path: p } );
								}
							}
							windowArray.splice( windowArrayKey, 1);
						}
					},
					// Do this when the processing loops are all done, finding files!
					checkFinished: function()
					{
						if( this.processing == 0 )
						{
							bar.total = this.files.length;
							bar.items = this.files.length;

							//keep a copy as we will call copyFiles everytime after popping from our filellist
							//needs to be done to make sure directories are in place before files are copied
							//we might improve this and allow parallel processing once we have seperated files from directories and can be sure directories are processed first
							this.originalfilelist = this.files;

							// as we will handle 10 (or more) files at once we will need to create the directories first...
							// so we will take the directories out and put them into the beginning of the array after we are done

							// Set in directories and files
							var alldirs = [];
							var allfiles = [];
							for(var i = 0; i < this.files.length; i++)
							{
								if( this.files[i].fileInfo.Type == 'Directory' )
								{
									alldirs.push( this.files[i] );
								}
								else 
								{
									allfiles.push( this.files[i] );
								}
							}

							this.directories = alldirs;
							this.files = allfiles;

							//we need to create all directories before we can start tranferring files... w
							if( this.directories.length > 0 )
							{
								this.createDirectories();
							}
							else
							{
								this.copyFiles();
							}
						}
					}

				};
				fileCopyObject.checkFiles( eles );

				// On close, stop copying
				w.onClose = function()
				{
					console.log( 'Stopping the copy process.' );
					fileCopyObject.stop = true;
				}

			}
			// Didn't work..
			else
			{
				this.master.fileoperations[ this.myid ].view.close();
			}
		}
		dview.fileoperations[ dview.operationcounter ].progress.load();

		dview.operationcounter++;
		dview.ongoingdropprepare = false;
		return eles.length;
	//} );
	return false;
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

// -------------------------------------------------------------------------
DirectoryView.prototype.RedrawIconView = function ( obj, icons, direction, option, flags )
{
	var self = this;
	
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

		// TODO: We will not use overflow-x unless we turn off autosorting of icons
		if( icons.length )
		{
			if( icons[0].Type != 'Door' && icons[0].Type != 'Dormant' )
			{
				sc.style.overflowX = 'hidden';
			}
		}

		obj.appendChild ( sc );
		this.scroller = sc;
	}
	
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
	
	// Get display frame
	var display = {
		top: this.scroller.scrollTop - this.scroller.offsetHeight,
		bottom: this.scroller.scrollTop + ( this.scroller.offsetHeight * 2 )
	};
	
	var marginTop = icons[0] && icons[0].Handler ? 10 : 0;
	var marginLeft = 20;
	var marginBottom = 5;
	
	if( window.isMobile )
	{
		marginBottom = 25;
	}

	var ue = navigator.userAgent.toLowerCase();

	// Calculate marginLeft to center icons on mobile
	if( isMobile )
	{
		var whWidth = this.scroller.offsetWidth;
		var columns = Math.floor( whWidth / mobIW );
		marginLeft = Math.floor( whWidth - ( mobIW * columns ) ) >> 1;
	}
	
	var iy = marginTop; 
	var ix = marginLeft;
	
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
		for( var a = 0; a < icons.length; a++ )
		{
			// Do not draw icons out of bounds!
			if( this.mode != 'Volumes' && ( iy > display.bottom || iy < display.top ) )
			{
				if( direction == 'vertical' )
				{
					iy += gridY;

					if( iy + gridY > windowHeight )
					{
						iy = marginTop;
						ix += gridX;
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
					}
				}
				// Make sure we push to buffer
				obj.icons.push( icons[a] );
				continue;
			}
		
			var r = icons[a];
			
			if( r.Visible === false || ( r.Config && r.Config.Invisible && r.Config.Invisible.toLowerCase() == 'yes' ) )
				continue;

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
			if( fn.Filename.indexOf( '.info' ) > 0 || fn.Filename.indexOf( '.dirinfo' ) > 0 )
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
			if( fnd ) continue;
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
				
				// Checks if the icon is
				file = CreateIcon( icons[a], this );
				file.directoryView = this;
				file.style.top = iy + 'px';
				file.style.left = ix + 'px';
				if( option == 'compact' )
					file.classList.add( 'Compact' );
				
				coldom.appendChild( file );
				
				// Make sure the icon has bounds
				var ic = file.getElementsByClassName( 'Icon' );
				var c = window.getComputedStyle( ic[0], null );
				var title = file.getElementsByClassName( 'Title' );
				title[0].style.maxHeight = ( gridY - parseInt( c.height ) ) + 'px';
				title[0].style.overflow = 'hidden';

				// Usually drawing from top to bottom
				if( direction == 'vertical' )
				{
					if( contentMode == 'screen' )
					{
						iy += file.offsetHeight + marginTop;
					}
					else
					{
						iy += gridY;
					}

					if( !( globalConfig.scrolldesktopicons == 1 && this.mode == 'Volumes' ) && iy + gridY > windowHeight )
					{
						iy = marginTop;
						ix += gridX;
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
	var d = this.scroller.getElementsByClassName( 'Placeholder' );
	if( !d.length )
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
			self.RedrawIconView( obj, icons, direction, option, { addPlaceholderFirst: iy } );
			self.refreshScrollTimeout = false;
		}, 50 );
	};
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
			ics[a].domNode.classList.add( 'Selected' );
			ics[a].domNode.selected = true;
			if( ics[a].fileInfo )
				ics[a].fileInfo.selected = true;
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

		for( var a = 0; a < icons.length; a++ )
		{
			var t = icons[a].Title ? icons[a].Title : icons[a].Filename;
			var ic = icons[a];

			// Skipping
			// Skip dot files
			if( !self.showHiddenFiles && t.substr( 0, 1 ) == '.' ) continue;
			
			// Skip files with wrong suffix
			else if( icons[a].Type == 'File' && self.suffix && !self.checkSuffix( t ) )
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
						if( icons[a].Type == 'Directory' )
							c.innerHTML = t;
						else c.innerHTML = t;
						r.primaryDom = c;
						break;
					case 'size':
						c.innerHTML = icons[a].Filesize > 0 ? humanFilesize ( icons[a].Filesize ) : '&nbsp;';
						c.style.textAlign = 'right';
						break;
					case 'date':
						c.innerHTML = icons[a].DateModified;
						c.style.textAlign = 'right';
						break;
					case 'type':
						/*var fn = icons[a].Title ? icons[a].Title : icons[a].Filename;
						var ext = fn.split( '.' ); ext = ext[ext.length-1].toLowerCase();
						ext = ext.split( '#' ).join( '' );*/
						var ext = icons[a].Extension.split( '#' )[0];
						var tp = i18n( icons[a].Type == 'Directory' ? 'i18n_directory' : 'i18n_filetype_' + ext );
						if( tp.substr( 0, 5 ) == 'i18n_' )
							tp = i18n( 'i18n_driver_handled' );
						c.innerHTML = tp;
						c.style.textAlign = 'left';
						break;
					case 'permissions':
						var pr = '-rwed';
						if( icons[a].Permissions )
						{
							var p = icons[a].Permissions.split( ',' );
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
			bts += icons[a].Filesize ? parseInt( icons[a].Filesize ) : 0;
			
			swi = swi == 2 ? 1 : 2;
			if ( swi == 1 ) r.className += ' Odd';

			// Create icon object to extract FileInfo
			var f = CreateIcon( icons[a], this );
			f.directoryView = this;
			r.className += ' File';
			RemoveIconEvents( f ); // Strip events
			r.file = f;
			
			// Overwrite doubleclick
			if( icons[a].Type == 'File' && this.doubleclickfiles )
			{
				var cl = this.doubleclickfiles;
				r.ondblclick = function( e )
				{
					cl( f, e );
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
			
			// Single click
			r.onclick = function( e )
			{
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
							p.childNodes[b].selected = true;
							p.childNodes[b].fileInfo.selected = true;
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
						this.fileInfo.selected = false;
						dv.lastListItem = false;
					}
					else
					{
						this.classList.add( 'Selected' );
						this.selected = true;
						this.fileInfo.selected = true;
						dv.lastListItem = this;
					}
				}
				else
				{
					for( var c = 0; c < p.childNodes.length; c++ )
					{
						p.childNodes[c].classList.remove( 'Selected' );
						p.childNodes[c].selected = false;
						p.childNodes[c].fileInfo.selected = false;
					}
					if( this.classList.contains( 'Selected' ) )
					{
						this.classList.remove( 'Selected' );
						this.selected = false;
						this.fileInfo.selected = false;
						dv.lastListItem = false;
					}
					else
					{
						this.classList.add( 'Selected' );
						this.selected = true;
						this.fileInfo.selected = true;
						dv.lastListItem = this;
					}
				}

				return cancelBubble( e );
			}
			
			r.onmousedown = function( e )
			{
				// Right mouse button
				if( e.button == 2 )
				{
					var p = icnt;

					var fnd = false;
					for( var c = 0; c < p.childNodes.length; c++ )
					{
						if( p.childNodes[c].classList.contains( 'Selected' ) )
						{
							fnd = true;
							break;
						}
					}
					if( !fnd )
					{
						for( var c = 0; c < p.childNodes.length; c++ )
						{
							p.childNodes[c].classList.remove( 'Selected' );
							p.childNodes[c].selected = false;
							p.childNodes[c].fileInfo.selected = false;
						}
						if( this.classList.contains( 'Selected' ) )
						{
							this.classList.remove( 'Selected' );
							this.selected = false;
							this.fileInfo.selected = false;
							dv.lastListItem = false;
						}
						else
						{
							this.classList.add( 'Selected' );
							this.selected = true;
							this.fileInfo.selected = true;
							dv.lastListItem = this;
						}
						if( this.classList.contains( 'Editing' ) )
						{
							this.classList.remove( 'Editing' );
							if( this.input )
							{
								this.removeChild( this.input );
								this.input = null;
							}
						}
					}

					dv.window.checkSelected();
					Workspace.refreshMenu();
					
					// check icons
					var sels = dv.windowObject.getElementsByClassName( 'File' );
					var found = false;
					for( var y = 0; y < sels.length; y++ )
					{
						if( sels[y] == this && sels[y].classList.contains( 'Selected' ) )
							found = true;
					}
					
					if( !window.isMobile )
					{
						Workspace.showContextMenu( false, { target: this.parentNode } );
					}
					return cancelBubble( e );
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
						mousePointer.pickup( obj );
					}
					else
					{
						this.classList.add( 'Selected' );
						this.selected = true;
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
							self.classList.remove( 'Selected' );
							self.selected = false;
							self.fileInfo.selected = false;
						}
						else
						{
							self.classList.add( 'Selected' );
							self.selected = true;
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
						mousePointer.pickup( obj );
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

			// For clicks
			icons[a].domNode = r;

			obj.icons.push( icons[a] );
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
		foot.innerHTML = icons.length + ' ' + i18n( 'i18n_total_listed' ) + ' ' + filesize + '.';
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

var FileIconCache = {};

FileIcon = function( fileInfo )
{
	this.Init ( fileInfo );
}

// -----------------------------------------------------------------------------
FileIcon.prototype.Init = function( fileInfo )
{
	function _createIconTitle( str )
	{
		return '<span>' + str.split( ' ' ).join( '</span><span>' ) + '</span>';
	}

	// Create the file icon div
	this.file = document.createElement( 'div' );
	var file = this.file;
	file.className = 'File';
	file.style.position = 'absolute';

	// Selected in buffer
	if( fileInfo.selected ) this.file.classList.add( 'Selected' );

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
	
		iconInner.className = 'Drive';
		var label = document.createElement( 'div' );
		label.className = 'Label';
		label.style.backgroundImage = 'url("' + img + '")';
		iconInner.appendChild( label );
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
	}
	
	// Check for thumbs
	if( fileInfo.directoryview && fileInfo.directoryview.listMode == 'iconview' )
	{
		switch( iconInner.className )
		{
			case 'TypeJPG':
			case 'TypeJPEG':
			case 'TypePNG':
			case 'TypeGIF':
				iconInner.style.backgroundImage = 'url(\'' + getImageUrl( fileInfo.Path ) + '\')';
				iconInner.className = 'Thumbnail';
				break;
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
		this.classList.remove('DragTarget');
	}

	// -------------------------------------------------------------------------
	// Attach events
	file.onmousedown = function( e )
	{
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
				_ActivateWindow( this.window.parentNode );
		}

		if( !e ) e = window.event;
		if( this.window )
		{
			var rc = 0;
			if( e.which ) rc = ( e.which == 3 );
			else if( e.button ) rc = ( e.button == 2 );
			if( !rc )
			{
				window.mouseDown = this;
			}
		}

		// Right mouse button
		if( e.button == 2 )
		{
			// check icons
			var sels = file.directoryView.windowObject.getElementsByClassName( 'File' );
			var found = false;
			for( var y = 0; y < sels.length; y++ )
			{
				if( sels[y] == this && sels[y].classList.contains( 'Selected' ) )
					found = true;
			}
			if( !found )
				this.onclick();
			if( !window.isMobile )
			{
				Workspace.showContextMenu( false, e );
			}
			return cancelBubble( e );
		}

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
						if( ext == mt.types[b].toLowerCase() )
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
		if( ( obj.fileInfo.Type == 'Door' || obj.fileInfo.Type == 'Dormant' ) && obj.directoryView.navMode == 'toolbar' )
		{
			uniqueView = true;
			if( obj.fileInfo.Path != obj.fileInfo.Volume )
			{
				obj.fileInfo.Path = obj.fileInfo.Volume;
			}
			
			// Open unique window!
			OpenWindowByFileinfo( obj.fileInfo, event, false, uniqueView );
			return window.isMobile ? Workspace.closeDrivePanel() : false;
		}
		// Just change directory
		else if( obj.fileInfo.Type == 'Directory' && obj.directoryView.navMode == 'toolbar' )
		{
			// Set a new path and record the old one!
			var we = obj.directoryView.windowObject;
			var dw = obj.directoryView;

			// Add current and set it to end of history
			var path = obj.fileInfo.Path.split( ':' );
			
			var fin = {
				Volume: path[0] + ':',
				Path: obj.fileInfo.Path,
				Title: path[0],
				Type: obj.fileInfo.Type,
				Door: Workspace.getDoorByPath( path.join( ':' ) )
			}
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
				var n = document.createElement( 'div' );
				n.className = 'Content SlideAnimation';
				n.style.willChange = 'transform';
				n.style.transition = 'transform 0.4s';
				n.innerHTML = obj.directoryView.windowObject.innerHTML;
				n.scrollTop = obj.directoryView.windowObject.scrollTop;
				n.style.zIndex = 10;
				obj.directoryView.windowObject.parentNode.appendChild( n );
				obj.directoryView.windowObject.parentNode.classList.add( 'Redrawing' );
				
				// Refresh and add animation
				we.refresh( function()
				{
					n.style.transform = 'translateX(-100%)';
					setTimeout( function()
					{
						n.parentNode.classList.remove( 'Redrawing' );
						n.parentNode.removeChild( n );
					}, 400 );
				} );
			}
			// Desktop mode, just refresh
			else 
			{
				we.refresh();
			}
			return window.isMobile ? Workspace.closeDrivePanel() : false;
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
					return window.isMobile ? Workspace.closeDrivePanel() : false;
				}
			}
			mim.execute( 'checkmimeapplication', { path: obj.fileInfo.Path } );
		}
	}

	// -------------------------------------------------------------------------
	file.onclick = function( e )
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
		
		if( !e ) e = window.event;
		if( !e ) e = {};
		var sh = e.shiftKey || e.ctrlKey;
		if( !sh ) clearRegionIcons();

		if( this.window && this.window.classList.contains( 'Content' ) )
		{
			// when changing from one directoryview to another, clear region icons
			if(
				window.currentMovable && window.currentMovable.classList.contains( 'Active' ) &&
				this.window.parentNode != window.currentMovable
			)
			{
				clearRegionIcons();
			}

			var ev = {
				shiftKey: e.shiftKey,
				ctrlKeu: e.ctrlKey
			};
			if( e )
			{
				_ActivateWindow( this.window.parentNode, false, e );
			}
		}
		// Ah, it's a screen content element!
		else
		{
			// Set current screen!
			if( this.window )
				window.currentScreen = this.window.parentNode;
			_DeactivateWindows();
		}


		if( window.isSettopBox && this.selected )
		{
			launchIcon( e, this );
			this.classList.remove( 'Selected' );
			this.selected = false;
			this.fileInfo.selected = false;
			return cancelBubble( e );
		}

		this.classList.add( 'Selected' );
		this.selected = true;
		this.fileInfo.selected = true;


		// Refresh the menu based on selected icons
		WorkspaceMenu.show();
		CheckScreenTitle();
		if( window.isSettopBox )
		{
			return cancelBubble( e );
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
			mousePointer.pickup ( this );
			window.mouseDown = 4;
			return cancelBubble ( e );
		}
	}

	file.drop = DirectoryView.prototype.doCopyOnElement;

	// -------------------------------------------------------------------------
	// Notice: Door and Dormant with isMobile overwrites onclick
	file[ ( window.isMobile && ( fileInfo.Type == 'Door' || fileInfo.Type == 'Dormant' ) ) ? 'onclick' : 'ondblclick' ] = launchIcon;
	
	// -------------------------------------------------------------------------
	file.associateWithElement = function ( div )
	{
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
				file.onclick();
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
			
	file.ontouchmove = function( e )
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
			this.classList.add( 'Selected' );
			this.selected = true;
			this.fileInfo.selected = true;
			mousePointer.pickup( obj );
			this.touchPos = false;
			
			if( file.contextMenuTimeout )
				clearTimeout( file.contextMenuTimeout );
			file.contextMenuTimeout = false;
		}
		
		return cancelBubble( e );
	}


	file.addEventListener( 'touchend', function( event )
	{
		if( this.directoryView.filedialog )
			return;
			
		this.touchPos = false;
		
		file.onclick();

		// When single clicking (under a second) click the file!
		var time = ( new Date() ).getTime() - file.clickedTime;
		if( time < 250 && window.clickElement )
		{
			setTimeout( function()
			{
				file.ondblclick();
			}, 100 );
		}

		if( file.menuTimeout )
			clearTimeout( file.menuTimeout );
		file.menuTimeout = false;
		if( file.contextMenuTimeout )
			clearTimeout( file.contextMenuTimeout );
		file.contextMenuTimeout = false;
		Workspace.closeDrivePanel();
		window.clickElement = null;
	} );
}

// -----------------------------------------------------------------------------
function RefreshWindowGauge( win, finfo )
{
	if( win.content ) win = win.content;
	if( !win.fileInfo && finfo ) win.fileInfo = finfo;
	if( !win.fileInfo ) return;
	var wt = win.fileInfo.Path ? win.fileInfo.Path : win.fileInfo.Title;
	var isVolume = wt.substr( wt.length - 1, 1 ) == ':' ? true : false;
	if( isVolume )
	{
		if( win.vinfoTimeout ) clearTimeout( win.vinfoTimeout );
		win.vinfoTimeout = setTimeout( function()
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					var dj, fl;
					try
					{
						dj = JSON.parse( d );
						fl = dj.Used / dj.Filesize;
					}
					catch( e )
					{
						fl = 1;
					}
					// Multiply by 100
					fl *= 100;
					if( win.parentNode && win.parentNode.volumeGauge )
					{
						win.parentNode.volumeGauge.style.height = fl + '%';
					}

					var eles = win.parentNode.getElementsByClassName( 'DriveGauge' );
					if( eles )
					{
						var factor = 1;
						try
						{
							dj = JSON.parse( d );
							if( !isNaN( dj.Used ) || isNaN( dj.Filesize ) )
							{
								factor = dj.Used / dj.Filesize;
								if( isNaN( factor ) ) factor = 1;
							}
						}
						catch( e )
						{
						}
						eles[0].classList.add( 'Size' + Math.floor( factor * 10 ) );
						eles[0].setAttribute( 'title', Math.ceil( factor * 100 ) + '% ' + i18n( 'i18n_full' ) );
					}
				}
			}
			var pth = wt.indexOf( ':' ) > 0 ? wt : ( wt + ':' );
			m.execute( 'volumeinfo', { path: pth } );
			clearTimeout( win.vinfoTimeout );
			win.vinfoTimeout = false;
		}, 250 );
	}
}

// Opens a window based on the fileInfo (type etc) -----------------------------
function OpenWindowByFileinfo( fileInfo, event, iconObject, unique )
{
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
			'title'    : wt,
			'width'    : 800,
			'height'   : 400,
			'memorize' : true,
			'id'       : wid,
			'volume'   : wt.substr( wt.length - 1, 1 ) == ':' ? true : false
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
			var self = this;
			
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
					if( callback ) callback();
					RefreshWindowGauge( self.win );
					self.refreshTimeout = null;
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
		Friend.startImageViewer( iconObject );
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
	else if( fileInfo.MetaType == 'Directory' )
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
		
		var w = new View ( {
			'title'    : wt,
			'width'    : stored && stored.width ? stored.width : 800,
			'height'   : stored && stored.height ? stored.height : 400,
			'memorize' : true,
			'id'       : id,
			'volume'   : isVolume,
			'clickableTitle': true
		} );

		// Ok, window probably was already opened, try to activate window
		if( !w.ready )
		{
			// Activate existing window with the same id...
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
		CreateDirectoryView( win, extra );
		w.setFlag( 'hidden', false );

		// Special case - the fileInfo object has a door!
		if( fileInfo.Door )
		{
			var dr = fileInfo.Door;
			if( !dr.getIcons ) return;

			// Get some volume info!
			RefreshWindowGauge( win );

			// Connect winbdow and door together
			fileInfo.Door.window = win;
			win.Door = fileInfo.Door;
			win.fileInfo = fileInfo;
			
			var winDoor = win.Door;
			
			win.refresh = function( callback )
			{
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
					
					dr.getIcons( fi, function( icons )
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
									self.redrawIcons( self.icons, self.direction, cbk );
								} );
								RefreshWindowGauge( self );
							}
						}
						// empty
						else
						{
							if( self.parentNode )
							{
								self.innerHTML = '<div class="loadError">' + i18n('i18n_error_could_not_list_directory') + '</div>';
								self.parentNode.addEventListener( 'dragleave', noEvent,    false );
								self.parentNode.addEventListener( 'dragover',  noEvent,   false );
								self.parentNode.addEventListener( 'drop',      noEvent, false );
								self.parentNode.drop = noEvent;
							}
							else
							{
								// What now?
								console.log( 'Refresh directory view - Something bad happened..' );
							}
						}
						if( callback ) callback();
						
						// Release refresh timeout
						self.refreshTimeout = null;
					} );
				}, timer );
			}
		}
		// No door, implement standard refresh
		else
		{
			win.refresh = function ( callback )
			{
				var self = this;
				
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
				updateurl += '&path=' + encodeURIComponent( this.fileInfo.Path );
				updateurl += '&sessionid= ' + encodeURIComponent( Workspace.sessionId );

				j.open( 'get', updateurl, true, true );

				j.fileInfo = this.fileInfo;
				j.file = iconObject;
				j.win = this;
				j.onload = function ()
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
							content = JSON.parse( this.returnData || "null" );
						}
						catch ( e ){};
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
								content[ a ].Path = this.fileInfo.Volume + content[ a ].Path;
						}
					
						var ww = this.win;

						ww.redrawIcons( content, ww.direction );
						ww.file = this.file;
						if( w.revent ) ww.RemoveEvent( 'resize', ww.revent );
						ww.revent = ww.AddEvent ( 'resize', function ( cbk )
						{
							ww.redrawIcons( content, ww.direction, cbk );
						} );
					}
					if( callback ) callback();
					RefreshWindowGauge( this.win );
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
			// TODO: Implement confirm dialog!
			case 46:
				if( window.regionWindow && !window.regionWindow.windowObject.flags.editing )
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
					if( rw[ a ].domNode.classList.contains( 'Selected' ) )
					{
						found = true;
						if( a == rw.length - 1 )
						{
							rw[ 0 ].domNode.click();
							scroll = rw[ 0 ].domNode.offsetTop - 100;
						}
						else
						{
							rw[ a + 1 ].domNode.click();
							scroll = rw[ a + 1 ].domNode.offsetTop - 100;
						}
						break;
					}
				}
				if( !found )
				{
					rw[ 0 ].domNode.click();
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
						out[0].domNode.click();
						return;
					}
					for( var a = 0; a < out.length; a++ )
					{
						if( out[a].selected && a < out.length - 1 )
						{
							out[a+1].domNode.click();
							return;
						}
					}
					out[0].domNode.click();
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
Friend.startImageViewer = function( iconObject )
{
	var win = new View ( {
		title            : iconObject.Title ? iconObject.Title : iconObject.Filename,
		width            : 650,
		height           : 512,
		memorize         : true,
		fullscreenenabled: true
	} );
	
	var owin = win;

	var zoomLevel = 1;
	var zoomImage = null;
	var position = 'centered';
	var zoomSet = false;

	var checkers = '<div style="filter:brightness(0.3);position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url(\'/webclient/gfx/checkers.png\'); background-position: center center;"></div>';

	function repositionElement( win, pos, extra )
	{		
		var image = win._window.getElementsByTagName( 'img' );
		if( !image.length )
			return;
		
		image = image[0];
		if( !image.originalDims || extra )
		{
			if( extra )
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
			if( w > h )
			{
				if( w > document.body.offsetWidth )
				{
					var firstzoom = w / document.body.offsetWidth;
					if( firstzoom > 1 )
					{
						zoomLevel = 1 / Math.floor( firstzoom );
					}
				}
			}
			else
			{
				if( h > document.body.offsetHeight - 100 )
				{
					var firstzoom = h / ( document.body.offsetHeight - 100 );
					if( firstzoom > 1 )
					{
						zoomLevel = 1 / Math.floor( firstzoom );
					}
				}
			}
		}

		if( !pos ) pos = position;
		
		var container = image.parentNode;		
		
		if( pos == 'centered' || pos == 'default' )
		{
			var width = image.originalDims.w * zoomLevel;
			var height = image.originalDims.h * zoomLevel;
						
			var ileft = ( container.offsetWidth >> 1 ) - ( width >> 1 ) + 'px';
			var itop  = ( container.offsetHeight >> 1 ) - ( height >> 1 ) + 'px';
			image.style.top = itop;
			image.style.left = ileft;
			image.style.width = width + 'px';
			image.style.height = height + 'px';
			position = pos;
		}
	}
	
	owin.addEvent( 'resize', function()
	{
		repositionElement( owin, position );
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
			owin.setContent( '<iframe class="ImageViewerContent" src="' + urlsrc + '" style="position: absolute; margin: 0; border: 0; top: 0; left: 0; width: 100%; height: 100%; background-color: black"></iframe>' );
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
			owin._window.getElementsByClassName( 'ImageViewerContent' )[0].appendChild( i );
			i.onload = function()
			{
				repositionElement( owin, 'default' );
			}
			zoomImage = owin._window.getElementsByTagName( 'img' )[0];
		} );
	}
	win._window.addEventListener( 'mousedown', function( e )
	{
		var factor = ( e.clientX - owin._window.parentNode.offsetLeft ) / owin._window.offsetWidth;
		var dir = 0;
		if( factor <= 0.2 )
		{
			dir = -1;
		}
		else if( factor >= 0.8 )
		{
			dir = 1;
		}
		goDirection( dir, e );
	} );
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

// End Friend Image Viewer! ----------------------------------------------------


// -----------------------------------------------------------------------------
if ( window.addEventListener )
	window.addEventListener ( 'keydown', CheckDoorsKeys );
else window.attachEvent ( 'onkeydown', CheckDoorsKeys );

