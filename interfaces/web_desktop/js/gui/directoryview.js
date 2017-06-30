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

// DirectoryView class ---------------------------------------------------------

DirectoryView = function( winobj )
{
	var ws = GetWindowStorage( winobj.uniqueId );
	// Initial values
	this.listMode = ws && ws.listMode ? ws.listMode : 'iconview';
	this.sortColumn = 'filename';
	this.sortOrder = 'ascending';
	this.navMode = globalConfig.navigationMode == 'spacial' ? globalConfig.navigationMode : 'toolbar'; // default is now using toolbar
	this.pathHistory = [];
	this.pathHistoryIndex = 0;
	
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
					console.log( 'File notification start result: ' + e, d );
				}
				f.execute( 'file/notificationstart' );
				console.log('notification start ' + path);
			}
			this.addToHistory( winobj.fileInfo );
		}
	
		this.InitWindow( winobj );
		winobj.parentNode.className = winobj.parentNode.className.split ( ' IconWindow' ).join ( '' ) + ' IconWindow';
	}
	
	this.window = winobj;
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
	t.style.top = winobj.parentNode.titleBar.offsetHeight + 'px';
	t.style.left = GetElementWidth( winobj.parentNode.leftbar ) + 'px';
	t.style.right = GetElementWidth( winobj.parentNode.rightbar ) + 'px';
	
	// Assign it so we remember
	winobj.parentNode.toolbar = t;
	this.toolbar = t;
	winobj.parentNode.insertBefore( t, winobj.parentNode.firstChild );
	
	var rpath = winobj.fileInfo.Path ? winobj.fileInfo.Path : ( winobj.fileInfo.Volume + ':' );
	
	var buttons = [
		// Go up a level
		{
			element: 'button',
			className: 'Up IconSmall fa-arrow-up',
			content: i18n( 'i18n_dir_btn_up' ),
			onclick: function( e )
			{
				// Fetch path again
				var rpath2 = winobj.fileInfo.Path ? winobj.fileInfo.Path : ( winobj.fileInfo.Volume + ':' );
				
				var path = rpath2.split( ':' );
				
				var volu = path[0];
				var path = path[1];
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
				
				var fin = {
					Volume: volu + ':',
					Path: path,
					Filename: fnam,
					Type: winobj.fileInfo.Type,
					Door: Workspace.getDoorByPath( path )
				}
				
				// Set as current history element at end of list
				dw.addToHistory( fin );
				
				winobj.refresh();
			}
		},
		{
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
		},
		{
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
		},
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
			element: 'button',
			className: 'Home IconSmall fa-home',
			content: i18n( 'i18n_dir_btn_root' ),
			onclick: function( e )
			{
				var path = winobj.fileInfo.Path.split( ':' );
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
		},
		{
			element: 'button',
			className: 'Search FloatRight IconSmall fa-search',
			content: i18n( 'i18n_dir_btn_search' ),
			onclick: function( e )
			{
				Workspace.showSearch();
			}
		}
	];
	
	// Non System gets makedir
	if( rpath.substr( 0, 7 ) != 'System:' )
	{
		buttons.push( {
			element: 'button',
			className: 'Makedir FloatRight IconSmall fa-plus',
			content: i18n( 'i18n_create_container' ),
			onclick: function( e )
			{
				Workspace.newDirectory();
			}
		} );
	}
	
	for( var a in buttons )
	{
		var d = document.createElement( buttons[a].element );
		if( buttons[a].content )
			d.innerHTML = buttons[a].content;
		d.className = buttons[a].className + ' ' + buttons[a].icon;
		d.onclick = buttons[a].onclick;
		d.addEventListener( 'touchstart', d.onclick, false );
		t.appendChild( d );
	}
	
	// Move content and gauge
	winobj.style.top = ( GetElementHeight( t ) + parseInt( t.style.top.split( 'px' ).join( '' ) ) ) + 'px';
	if( winobj.parentNode.volumeGauge )
	{
		var g = winobj.parentNode.volumeGauge.parentNode;
		g.style.top = winobj.style.top;
	}
}

// -----------------------------------------------------------------------------
DirectoryView.prototype.InitWindow = function ( winobj )
{
	if( !this.toolbar && this.navMode == 'toolbar' ) this.initToolbar( winobj );
	
	winobj.directoryview = this;
	this.windowObject = winobj;
	winobj.parentNode.classList.add( 'IconWindow' );
	winobj.redrawtimeouts = [];
	
	// Add context menu
	winobj.addEventListener( 'contextmenu', function( e )
	{
		Workspace.showContextMenu( false, e );
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
		self = this;
		
		var eles = self.getElementsByTagName( 'div' );
		var selectedCount = 0;
		for( var a = 0; a < eles.length; a++ )
		{
			if( eles[a].className.indexOf( ' Selected' ) < 0 )
				continue;
			
			selectedCount++;
		}
		friend.iconsSelectedCount = selectedCount;	
		//if( selectedCount > 0 ) console.log('We have a couple of files ' + friend.iconsSelectedCount);
	},
	// -------------------------------------------------------------------------
	winobj.redrawIcons = function ( icons, direction )
	{
		self = this;

		// Blocking? Wait with call
		if( this.redrawing )
		{
			//if we have odler stuff, stop it
			if( this.redrawtimeouts.length > 0 )
				for(var i = 0; i < this.redrawtimeouts.length; i++)
					clearTimeout(this.redrawtimeouts[i]);
					
			//lets us wait a bit and try redrawing then
			this.redrawtimeouts.push( setTimeout( function()
			{
				winobj.redrawIcons( icons, direction );
			}, 250 ) );
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
			
			this.icons = out;
			
			// Sort and add cleaned icons
			if( this.directoryview.sortColumn == 'filename' )
			{
				this.icons = sortArray( out, [ 'Title', 'Filename' ], this.directoryview.sortOrder );
			}
			else if( this.directoryview.sortColumn == 'type' )
			{
				this.icons = sortArray( out, [ 'Extension', 'Title', 'Filename' ], this.directoryview.sortOrder );
			}
			else if( this.directoryview.sortColumn == 'size' )
			{
				this.icons = sortArray( out, [ 'SizeSortable', 'Title', 'Filename' ], this.directoryview.sortOrder );
			}
			else
			{
				this.icons = sortArray( out, [ 'DateModified', 'Title', 'Filename' ], this.directoryview.sortOrder );
			}
			
			this.directoryview.changed = true;
			
			// Make sure the menu is refreshed due to icon selection
			Workspace.refreshMenu();
			
			// Check directory listmode
			switch( this.directoryview.listMode )
			{
				case 'iconview':
				{
					setTimeout( function(){ self.redrawing = false; }, 250 );
					CheckScreenTitle();
					return this.directoryview.RedrawIconView( this, this.icons, direction );
				}
				case 'listview':
				{
					setTimeout( function(){ self.redrawing = false; }, 250 );
					CheckScreenTitle();
					return this.directoryview.RedrawListView( this, this.icons, direction );
				}
				case 'columnview':
				{
					setTimeout( function(){ self.redrawing = false; }, 250 );
					CheckScreenTitle();
					return this.directoryview.RedrawColumnView( this, this.icons, direction );
				}
			}
		}
		this.redrawing = false;
		return false;
	}
	
	// -------------------------------------------------------------------------
	winobj.parentNode.rollOver = function ( eles )
	{
		//SetOpacity ( this, 0.8 );
		this.classList.add('DragTarget');
		window.targetMovable = this;
	}
	
	// -------------------------------------------------------------------------
	winobj.parentNode.rollOut = function ( eles )
	{
		this.classList.remove('DragTarget');
		//SetOpacity ( this, 1 );
	}
	
	// -------------------------------------------------------------------------
	// if host support drag & drop we want to use that FOR UPLOAD!!!!.
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
		
		function handleHostFileSelect( e )
		{
			
			var files = e.dataTransfer.files || e.target.files;
			
			console.log( 'We got some files!', files );
			
			if( files.length < 1 ) return;

			e.stopPropagation();
			e.preventDefault();
			
			console.log( 'Checking if we have the right place.', this.content.fileInfo );
			
			if( files && this.content && this.content.fileInfo && this.content.fileInfo.Volume )
			{
				// TODO: to detect read only filesystem!
				console.log( 'Ok, we will test some more.' );
				if( this.content.fileInfo.Volume == 'System:' || this.content.fileInfo.Path.split( ':' )[0] == 'System' )
				{
					Alert( i18n( 'i18n_read_only_filesystem' ), i18n( 'i18n_read_only_fs_desc' ) );
					return false;
				}
				
				console.log( 'We\'re in..' );
				
				var uworker = new Worker( 'js/io/filetransfer.js' );
				
				// Open window
				var w = new View( { 
					title:  i18n( 'i18n_copying_files' ), 
					width:  320, 
					height: 100, 
					id:     'fileops'
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
						Doors.diskNotification( [ winobj ], 'refresh' );
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
					uprogress.setProgress(0);
					
					
				}
				
				uprogress.setProgress = function( percent ) {
					// only update display if we are loaded...
					// otherwise just drop and wait for next call to happen ;)
					if( uprogress.loaded )
					{
						uprogress.bar.style.width = Math.floor( Math.max(1,percent ) ) + '%';
						uprogress.bar.innerHTML = '<div class="FullWidth" style="text-overflow: ellipsis; text-align: center; line-height: 30px; color: white">' +
						Math.floor( percent ) + '%</div>';
					}
				};
				
				uprogress.setUnderTransport = function()
				{
					// show notice that we are transporting files to the server....
					uprogress.info.innerHTML = '<div id="transfernotice" style="padding-top:10px;">Transferring files to target volume...</div>';
					uprogress.myview.setFlag("height",125);
				}
				
				uprogress.displayError = function( msg )
				{
					uprogress.info.innerHTML = '<div style="color:#F00; padding-top:10px; font-weight:700;">'+ msg +'</div>';
					uprogress.myview.setFlag("height",140);
				}
				
				uworker.onerror = function( err ) {
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
							winobj.refresh();
							//does not work??? Doors.diskNotification( [ winobj ], 'refresh' );
							
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
				
				uworker.postMessage( {
					'session': Workspace.sessionId,
					'targetPath': this.content.fileInfo.Path, 
					'targetVolume': this.content.fileInfo.Volume, 
					'files': files 
				} );
			}
			else
			{
				console.log( 'We got nothing.', this.content );
			}
		}
		
		winobj.parentNode.addEventListener( 'dragleave', handleHostDragOut,    false );
		winobj.parentNode.addEventListener( 'dragover',  handleHostDragOver,   false );
		winobj.parentNode.addEventListener( 'drop',      handleHostFileSelect, false );
		winobj.parentNode.addEventListener( 'drop',      handleHostDragOut,    false );

	} // end of check for html5 file upload capabilities
	
	winobj.parentNode.drop = this.doCopyOnElement;
	
	// Show menu on holding down
	winobj.addEventListener( 'touchstart', function( event )
	{
		var tar = event.target ? event.target : event.srcElement;
		
		window.clickElement = tar; 
		
		window.menuTimeout = setTimeout( function()
		{
			if( window.clickElement && tar == window.clickElement )
				window.clickElement = null;
			ge( 'MobileMenu' ).classList.add( 'Visible' );
			ge( 'MobileMenu' ).scrollTop = 0;
			_addMobileMenuClose();
			return;
		}, 1000 );
	}, false );
	
	winobj.addEventListener( 'touchend', function( event )
	{
		if( window.menuTimeout )
			clearTimeout( window.menuTimeout );
		window.menuTimeout = false;
		window.clickElement = null;
	}, false );
	
	
	// Just update in case we're the active view!
	if( winobj.parentNode == currentMovable )
		workspaceMenu.show();
}

// -------------------------------------------------------------------------
// Dropping an icon on a window or an icon!
DirectoryView.prototype.doCopyOnElement = function( eles, e )
{
	var dview = this;
	var mode = 'view';

	function doTheTango( fileInfo )
	{
		console.log( fileInfo, 'here..' );
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

	// c heck if this is a special view
	if( this.fileInfo && this.fileInfo.Path.indexOf( 'System:' ) == 0 )
	{
		// Trying to install something!
		if( this.fileInfo.Path == 'System:Software/' )
		{
			for( var a = 0; a < eles.length; a++ )
			{
				var f = eles[a];
				
				if( f.fileInfo.Filename.toLowerCase().indexOf( '.fpkg' ) > 0 )
				{
					doTheTango( f.fileInfo );
				}
			}
		}
		return;
	}
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
		
		for( var a = 0; a < divs.length; a++ )
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
	
	//sanitize input... no folder to be dropped into themselves or their children....
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
					movableWindows[j].windowObject.close();
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
	
	// Info files might be added in the copy as well
	if( clean && eles[0].window && eles[0].window.allIcons )
	{
		var add = [];
		for( var a = 0; a < eles[0].window.allIcons.length; a++ )
		{
			for( var b = 0; b < eles.length; b++ )
			{
				var f = eles[0].window.allIcons[a];
				var fn = eles[b].fileInfo.Filename ? eles[b].fileInfo.Filename : eles[b].fileInfo.Title;
				if( fn.substr( fn.length - 5, 5 ).toLowerCase() == '.info' )
					continue;
				if( f.Filename == fn + '.info' )
				{
					if( !f.fileInfo ) f.fileInfo = f;
					add.push( f );
				}
			}
		}
		if( add.length ) for( var a = 0; a < add.length; a++ ) eles.push( add[a] );
	}
	
	var destinationFI = mode == 'view' ? dview.content.fileInfo : dview.object.file.fileInfo;
	var sPath = destinationFI.Path; // set path
	var dPath = eles[0].window.fileInfo ? eles[0].window.fileInfo.Path : false; // <- dropped path

	// We can't copy to self!
	if( sPath == dPath )
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
						for( var z = 0; z < result.length; z++ )
						{
							// We need to have fileInfo
							o.fileInfoCheck( result[z] );
							if( result[z].Type.toLowerCase() == 'directory' )
							{
								var d = Workspace.getDoorByPath( result[z].Path );
								o.files.push( result[z] );
								o.findSubFiles( { door: d, ele: result[z] } );
							}
							else if( result[z].Type.toLowerCase() == 'file' )
							{
								o.files.push( result[z] );
							}
						}
						// Done counting!
						o.processing--;
						o.checkFinished();
					} );
				},
				// Check all files (type etc)
				checkFiles: function( eles )
				{
					// Counting!
					this.processing++;
					
					// Collect all files!
					for( var a = 0; a < eles.length; a++ )
					{
						var d = Workspace.getDoorByPath( eles[a].fileInfo.Path );
						var fin = eles[a].fileInfo;
						if( d )
						{
							// Make sure we have file info
							this.fileInfoCheck( fin );
							
							// Check type, and if folder collect files
							if( fin.Type.toLowerCase() == 'directory' )
							{
								// Add folder and make sub paths
								this.files.push( eles[a] );
								this.findSubFiles( { door: d, ele: eles[a] } );
							}
							else if( fin.Type.toLowerCase() == 'file' )
							{
								this.files.push( eles[a] );
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
						
						// Refresh source and target
						Doors.diskNotification( [ winobj, eles[0].window ], 'refresh' );
						return false;
					}
					
					var fob = this;
					
					// Make sure our path is right
					var cfoF = cfo.Path.substr( 0, cfo.Path.length - 1 );
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
						toPath = cfo.Path + p + fl.fileInfo.Path.split(eles[0].window.fileInfo.Path).join('');
						door = Workspace.getDoorByPath( fl.fileInfo.Path );
						
						// Sanitation
						while( toPath.indexOf( ':/' ) >= 0 ) toPath = toPath.split( ':/' ).join ( ':' );
						while( toPath.indexOf( '//' ) >= 0 ) toPath = toPath.split( '//' ).join ( '/' );						

						if( i+1 == stopAt ) initNextBatch = true;
					
						// Do the copy - we have files here only...
						door.dosAction( 'copy', { from: fl.fileInfo.Path, to: toPath }, function( result )
						{
							if( fob.stop ) return;
							fileCopyObject.nextStep( result, initNextBatch );
						} );						
					}
					// Start with a whosh ever used????
					/*if( a == 0 )
					{
						bar.style.width = Math.floor( 100 - ( 100 / bar.total * (bar.items-1) ) ) + '%';
						bar.innerHTML = '<div class="FullWidth" style="text-overflow: ellipsis; text-align: center; line-height: 30px; color: white">' +
							Math.floor( 100 - ( 100 / bar.total * (bar.items-1) ) ) + '%</div>';
					}*/
					
				},  
				createDirectories: function( reduceBar )
				{
					//update progress bar...
					if( reduceBar )
					{
						bar.items--;
						bar.style.width = Math.floor( 100 - ( 100 / bar.total * bar.items ) ) + '%';
						bar.innerHTML = '<div class="FullWidth" style="text-overflow: ellipsis; text-align: center; line-height: 30px; color: white">' +
							Math.floor( 100 - ( 100 / bar.total * bar.items ) ) + '%</div>';						
					}
					
					
					if( this.directories.length == 0 )
					{
						this.copyFiles();
					}
					else
					{
						// Make sure our path is right
						var cfoF = cfo.Path.substr( 0, cfo.Path.length - 1 );
						var p = '';
						if( cfoF != '/' && cfoF != ':' )
							p = '/';
						
						var dir = this.directories.shift();
						var toPath = cfo.Path + p + dir.fileInfo.Path.split(eles[0].window.fileInfo.Path).join('');
						var door = Workspace.getDoorByPath( dir.fileInfo.Path );
	
						// Sanitation
						while( toPath.indexOf( ':/' ) >= 0 ) toPath = toPath.split( ':/' ).join ( ':' );
						while( toPath.indexOf( '//' ) >= 0 ) toPath = toPath.split( '//' ).join ( '/' );
						
						door.dosAction( 'makedir', { path: toPath }, function( result )
						{
							if( fileCopyObject.stop ) return;
							fileCopyObject.createDirectories( true );
						});						
					}	
				},
				nextStep: function( result, initNewRun )
				{
					var fob = this;
					//var d = Doors.getDoorByPath( this.files[0].fileInfo.Path );
					
					if( initNewRun && fileCopyObject.files.length > this.stepsize )
					{
						var f = fileCopyObject.files;
						var nf = [];
						for( var b = this.stepsize; b < f.length; b++ )
							nf.push( f[b] );
						fileCopyObject.files = nf;
						fileCopyObject.copyFiles();							
					}
					
					
					if( eles[0].window && eles[0].window.refresh )
					{
						if( this.refreshTimeout ) clearTimeout( this.refreshTimeout )
						this.refreshTimeout = setTimeout( function()
						{
							eles[0].window.refresh();
						}, 500 );
					}	
						
					bar.items--;
					bar.style.width = Math.floor( 100 - ( 100 / bar.total * bar.items ) ) + '%';
					bar.innerHTML = '<div class="FullWidth" style="text-overflow: ellipsis; text-align: center; line-height: 30px; color: white">' +
						Math.floor( 100 - ( 100 / bar.total * bar.items ) ) + '%</div>';
						
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
										w.close();
									
										// Refresh source and target
										Doors.diskNotification( [ winobj, eles[0].window ], 'refresh' );
										
										var l = new Library( 'system.library' );
										l.execute( 'file/notifychanges', { path: fob.files[0].fileInfo.Path } );
										var l = new Library( 'system.library' );
										l.execute( 'file/notifychanges', { path: eles[0].window.fileInfo.Path } );
										
										console.log( 'Executed file/notifychanges with k path: ' + fob.files[0].fileInfo.Path + ' and ' + eles[0].window.fileInfo.Path );
									}
								} );
							}
						}
						// Just copy! No delete! :)
						else
						{
							// Close window
							w.close();
						
							// Refresh source and target
							Doors.diskNotification( [ winobj, eles[0].window ], 'refresh' );
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
				// Do this when the processing loops are all done!
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
						
						// as we will handle 10 (or more) files at once we will need to create the directories first... so we will take the directories out and put them into the beginning of the array after we are done
						var alldirs = [];
						var allfiles = [];
						for(var i = 0; i < this.files.length; i++)
						{
							if( this.files[i].fileInfo.Type == 'Directory' ) alldirs.push( this.files[i] );
							else allfiles.push( this.files[i] );
						}
						
						this.directories = alldirs;
						this.files = allfiles;
						
						//we need to create all directories before we can start tranferring files... w
						if( this.directories.length > 0 )
							this.createDirectories();
						else
							this.copyFiles();						
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
DirectoryView.prototype.RedrawIconView = function ( obj, icons, direction )
{	
	// Remember scroll top
	var stop = 0;
	var slef = 0;
	if( obj.scroller )
	{
		if( obj.scroller.scrollTop )
		{
			stop = obj.scroller.scrollTop;
			slef = obj.scroller.scrollLeft;
		}
	}
	
	obj.innerHTML = '';
	if( !icons || ( icons && !icons.length ) )
		return;
	
	var sc = document.createElement ( 'div' );
	sc.style.position = 'relative';
	sc.className = 'Scroller';
	
	// TODO: We will not use overflow-x unless we turn off autosorting of icons
	if( icons[0].Type != 'Door' && icons[0].Type != 'Dormant' )
	{
		sc.style.overflowX = 'hidden';
	}
	
	obj.appendChild ( sc );
	obj.scroller = sc;
	
	var windowWidth = obj.offsetWidth;
	var windowHeight = obj.offsetHeight - 80;
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
	var gridY = window.isMobile ? mobIH : 100;
	var marginTop = 0;
	var marginLeft = 0;
	var marginBottom = 5;
	
	var ue = navigator.userAgent.toLowerCase();
	
	var iy = marginTop; var ix = marginLeft;
	var column = 0;
	var start = false;
	// Clear the window
	if ( obj.scroller && obj.scroller.innerHTML.length )
		obj.scroller.innerHTML = '';

	// Start column
	var coldom = document.createElement ( 'div' );
	obj.scroller.appendChild ( coldom );
	obj.icons = [];

	// Avoid duplicate filenames..
	var filenameBuf = [];
	
	// Highest (in pixels) row including text
	var tallestRow = 0;

	// Loop through icons (if list of objects)
	if( typeof( icons[0] ) == 'object' )
	{
		// TODO: Lets try to make directories first optional
		var dirs = [];
		var files = [];
		var orphanInfoFile = {};
		
		for( var a = 0; a < icons.length; a++ )
		{
			if( icons[a].Type == 'Directory' ) dirs.push( icons[a] );
			else files.push( icons[a] );
			
			var i = icons[a];
			if( i.Filename )
			{
				var mInfoname = i.Filename.toLowerCase().indexOf( '.info' ) > 0 ?
					i.Filename.substr( 0, i.Filename.length - 5 ) : false; 
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
			if( fn.substr( 0, 1 ) == '.' ) continue;
			else if( fn.substr( fn.length - 5, 5 ) == '.info' )
				infoIcons[ fn ] = true;
			else continue;
		}
		for( var a = 0; a < icons.length; a++ )
		{
			var r = icons[a];
			if( r.Visible === false || ( r.Config && r.Config.Invisible && r.Config.Invisible.toLowerCase() == 'yes' ) ) continue;
			
			
			
			// TODO: Show hidden files if we _must_
		 	var fn = {
		 		Filename: icons[a].Filename ? icons[a].Filename : icons[a].Title,
		 		Type: icons[a].Type
		 	};
			if( fn.Filename.substr( 0, 1 ) == '.' ) continue;
			
			// Only show orphan .info files
			if( fn.Filename.indexOf( '.info' ) > 0 )
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
				
				file = CreateIcon( icons[a] );
				file.directoryView = this;
				file.style.top = iy + 'px';
				file.style.left = ix + 'px';
				
				coldom.appendChild( file );
		
				// Usually drawing from top to bottom
				if( direction == 'vertical' )
				{
					var fh = 0;
					var cs = window.getComputedStyle( file.iconInner, null );
					var tx = window.getComputedStyle( file.titleElement, null );
					for( var d = 0; d < heightAttrs.length; d++ )
					{
						fh += parseInt( cs[heightAttrs[d]] );
						fh += parseInt( tx[heightAttrs[d]] );
					}
					
					gridY = fh + marginBottom;
					iy += gridY;
					
					if( iy + gridY > windowHeight )
					{
						iy = marginTop;
						ix += gridX;
						coldom = document.createElement ( 'div' );
						obj.scroller.appendChild( coldom );
					}
				}
				// Left to right
				else
				{
					tallestRow = file.offsetHeight > tallestRow ? file.offsetHeight : tallestRow;
					
					ix += gridX;
					if( ix + gridX > windowWidth )
					{
						iy += ( gridY > tallestRow ? gridY : tallestRow ) + marginBottom;
						tallestRow = 0;
						ix = marginLeft;
						coldom = document.createElement ( 'div' );
						obj.scroller.appendChild( coldom );
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
		
	obj.scroller.scrollTop = stop;
	obj.scroller.scrollLeft = slef;
	
	// Remove dummy icon
	document.body.removeChild( dummyIcon );
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
			SetWindowFlag( obj, 'height', this.innerHeight );
			SetWindowStorage( windId, { height: this.innerHeight } );
		}
	}
}

// -------------------------------------------------------------------------
// Makes a column view
DirectoryView.prototype.RedrawColumnView = function( obj, icons, direction )
{
	// TODO: Direction not needed here
	obj.direction = direction ? direction : 'horizontal';
	icons = icons ? icons : obj.icons;
	if( !icons ) return;
	
	obj.innerHTML = '';
	
	// TODO: Lets try to make directories first optional
	var dirs = [];
	var files = [];
	for( var a = 0; a < icons.length; a++ )
	{
		if( icons[a].Type == 'Directory' ) dirs.push( icons[a] );
		else files.push( icons[a] );
	}
	icons = dirs.concat( files );
	
	var cont = document.createElement( 'div' );
	cont.className = 'ColumnView';
	
	for( var a = 0; a < icons.length; a++ )
	{
		var r = document.createElement( 'div' );
		r.className = 'Row';
		
		var d = document.createElement( 'div' );
		d.className = 'Column';
		if( icons[a].Type == 'Directory' )
		{
			d.classList.add( 'Directory' );
			d.innerHTML = icons[a].Filename + '/';
		}
		else d.innerHTML = icons[a].Filename;
		
		var f = CreateIcon( icons[a] );
		f.directoryView = this;
		f.associateWithElement( d );
		d.appendChild( f );
		
		r.appendChild( d );
		cont.appendChild( r );
		
		// For clicks
		icons[a].domNode = r;
		obj.icons.push( icons[a] );
	}
	
	// Add container
	obj.appendChild( cont );
	
	// Position the rows
	var t = 0;
	var ds = cont.getElementsByTagName( 'div' );
	for( var a = 0; a < ds.length; a++ )
	{
		if( ds[a].className.substr ( 0, 3 ) == 'Row' )
		{
			ds[a].style.top = t + 'px';
			t += 30;
		}
	}
}

// -------------------------------------------------------------------------
// Makes a listview
DirectoryView.prototype.RedrawListView = function( obj, icons, direction )
{
	// TODO: Direction not needed here
	obj.direction = direction ? direction : 'horizontal';
	icons = icons ? icons : obj.icons;
	
	var dv = this;
		
	obj.window = this.window;
		
	// Get icon container
	var divs = obj.getElementsByTagName( 'div' );
	var icnt = false;
	for( var a = 0; a < divs.length; a++ )
	{
		if( divs[a].className == 'Scroller' )
		{
			icnt = divs[a];
			break;
		}
	}
	
	// Major error
	if( !icnt )
	{
		var d = document.createElement( 'div' );
		d.className = 'Scroller';
		obj.appendChild( d );
		icnt = d;
	}
	
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

	// Clear list
	if( changed )
	{
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
	
		obj.innerHTML = '';
		divs = [];
	
		// Setup the listview for the first time
		if( !divs.length )
		{	
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
			lvie.appendChild ( head );
			obj.head = head;
		
			// Add icon container
			var cicn = document.createElement( 'div' );
			cicn.className = 'ScrollArea Icons';
			lvie.appendChild ( cicn );
		
			// Add icon content container
			var icnt = document.createElement( 'div' );
			icnt.className = 'Scroller';
			obj.scroller = icnt;
			cicn.appendChild ( icnt );
		
			// Add footer
			var foot = document.createElement( 'div' );
			foot.className = 'Footer';
			lvie.appendChild ( foot );
		
			// Add listview
			obj.appendChild ( lvie );
			divs = obj.getElementsByTagName( 'div' );
		}
		
		icnt.innerHTML = '';
		var bts = 0;
		
		obj.iconsCache = icons;
		obj.icons = [];
	
		for( var a = 0; a < icons.length; a++ )
		{
			var t = icons[a].Title ? icons[a].Title : icons[a].Filename;
			var ic = icons[a];
		
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
							c.innerHTML = t + '/';
						else c.innerHTML = t;
						r.primaryDom = c;
						break;
					case 'size':
						c.innerHTML = icons[a].Filesize ? humanFilesize ( icons[a].Filesize ) : '&nbsp;';
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
								for( var c = 0; c < p[b].length; c++ )
								{
									if( p[b].substr( c, 1 ) != '-' && perms[c] == '-' )
									{
										perms[c] = p[b][c];
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
			if ( a % 2 == 0 ) r.className += ' Odd';
		
			// Create icon object to extract FileInfo
			var f = CreateIcon( icons[a] );
			f.directoryView = this;
			r.className += ' File';
			RemoveIconEvents( f ); // Strip events
			r.file = f;
			r.ondblclick = function( e )
			{
				this.file.ondblclick( e );
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
				
				var p = icnt;
			
				// Range
				if( e.shiftKey )
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
						}
					}
					dv.lastListItem = this;
				}
				// Toggle only
				else if( e.ctrlKey )
				{
					if( this.classList.contains( 'Selected' ) )
					{
						this.classList.remove( 'Selected' );
						dv.lastListItem = false;
					}
					else
					{
						this.classList.add( 'Selected' );
						dv.lastListItem = this;
					}
				}
				else
				{
					for( var c = 0; c < p.childNodes.length; c++ )
					{
						p.childNodes[c].classList.remove( 'Selected' );
					}
					if( this.classList.contains( 'Selected' ) )
					{
						this.classList.remove( 'Selected' );
						dv.lastListItem = false;
					}
					else
					{
						this.classList.add( 'Selected' );
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
						}
						if( this.classList.contains( 'Selected' ) )
						{
							this.classList.remove( 'Selected' );
							dv.lastListItem = false;
						}
						else
						{
							this.classList.add( 'Selected' );
							dv.lastListItem = this;
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
					Workspace.showContextMenu( false, { target: this.parentNode } );
					return cancelBubble( e );
				}
			}
		
			r.fileInfo = f.fileInfo;
			r.window = obj.window;
		
			icnt.appendChild( r );
		
			// Let's drag this bastard!
			r.setAttribute( 'draggable', true );
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
					return this.ondragstart( e );
				}
				return cancelBubble( e );
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
	
	// Align headers
	if( obj.head && icnt.childNodes.length )
	{
		var head = obj.head;
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
}

// -------------------------------------------------------------------------
// Create a directoryview on a div / Window (shortcut func (deprecated?))
function CreateDirectoryView( winobj )
{
	var w = new DirectoryView( winobj );
	return w;
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
	if( fileInfo.SharedLink && fileInfo.SharedLink.length )
	{
		var df = document.createElement( 'div' );
		df.className = 'Label Shared IconSmall MousePointer fa-share-alt';
		icon.appendChild( df );
	}
	
	iconInner = document.createElement ( 'div' );
	file.iconInner = iconInner;
	if( fileInfo.Icon )
	{
		iconInner.className = fileInfo.Icon;
	}
	else if( fileInfo.IconClass )
	{
		iconInner.className = fileInfo.IconClass;
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
			case 'png':
				iconInner.className = 'TypePNG';
				break;
			case 'gif':
				iconInner.className = 'TypeGIF';
				break;
			case 'odt':
				iconInner.className = 'TypeDOC';
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
			case 'html':
				iconInner.className = 'TypeHTML';
				break;
			case 'fpkg':
				iconInner.className = 'TypeFPkg';
				break;
			case 'zip':
				iconInner.className = 'TypeZip';
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
				}
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

	// Check if we have a filename!
	if( extension && fileInfo.Filename )
	{
		download = document.createElement( 'a' );		
		download.className = 'Download MousePointer IconSmall fa-download';
		download.innerHTML = '';
		download.title = i18n( 'i18n_drag_to_download_file' );
		download.setAttribute( 'data-filename', fileInfo.Filename );
		var href = document.location.protocol +'//'+ document.location.host +'/system.library/file/read/' + fileInfo.Filename + '?mode=rs&sessionid=' + Workspace.sessionId + '&path='+ encodeURIComponent( fileInfo.Path ) + '&download=1';
		
		download.setAttribute( 
			'data-downloadurl', 
			'application/octec-stream:'+ fileInfo.Filename +':'+ document.location.protocol +'//'+ document.location.host +'/system.library/file/read?mode=rs&sessionid=' + Workspace.sessionId + '&path='+ encodeURIComponent( fileInfo.Path ) +''
		);		
		download.setAttribute('draggable','true');
		download.setAttribute('href', href );
		download.setAttribute('onclick', 'return false;');
		
		file.appendChild( download );
		
		// Download on click
		download.addEventListener( 'click', function( e )
		{
			var w = window.open( href );
		} );
		
		download.addEventListener( 'mousedown', function(e)
		{
			//nothing to be done here...
			//e.target.className = e.target.className + ' Clicked';
			e.stopPropagation();
		} );

		download.addEventListener( 'dragstart',function(e)
		{
			e.stopPropagation();
		
			e.target.classList.add( 'Active' );
			//console.log('OUr new className is ' + e.target.className );
			e.target.innerHTML = e.target.getAttribute('data-filename');
			
			var fd = false;
			if( e.target.dataset == 'undefined' )
				fd = this.getAttribute('data-downloadurl');
			else fd = this.dataset.downloadurl;

			if( fd && e && e.dataTransfer )
			{
				//e.dataTransfer.effectAllowed = 'copy';
				//e.dataTransfer.dropEffect = 'copy';
				e.dataTransfer.setData('DownloadURL', fd);
			}
		}, true );
		download.addEventListener( 'dragend', function( e )
		{
			//console.log('drag ended');
			e.target.classList.remove( 'Active' );
			e.target.innerHTML = '';
			e.stopPropagation();
		} );
		download.addEventListener( 'mouseup', function( e )
		{
			e.target.classList.remove( 'Active' );
			e.target.innerHTML = '';
			e.stopPropagation();
		} );
	}
	else
	{
		//console.log('no extension and filename? ',extension,fileInfo.Filename);
	}
	

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
		
		if( e.target.className == 'Download' ) return;
		
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
			Workspace.showContextMenu( false, e );
			return cancelBubble( e );
		}		
		
		e.stopPropagation();
	}

	// -------------------------------------------------------------------------
	// This one driggers dropping icons! (believe it or not)
	file.onmouseup = function( e )
	{
		if(e.target.className == 'Download') return;
		
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
	
	// -------------------------------------------------------------------------
	file.onclick = function( e )
	{
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
		
		this.className = this.className.indexOf ( ' Selected' ) >= 0 ? ( this.className.split ( ' Selected' ).join ( '' ) ) : ( this.className + ' Selected' );

		// Refresh the menu based on selected icons
		CheckScreenTitle();
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
	file[ ( window.isMobile && ( fileInfo.Type == 'Door' || fileInfo.Type == 'Dormant' ) ) ? 'onclick' : 'ondblclick' ] = function( event )
	{
		if( !event ) event = window.event;
		
		// File extension
		if( this.fileInfo && this.fileInfo.Path )
		{
			var ext = this.fileInfo.Path.split( '.' );
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
							return ExecuteApplication( mt.executable, this.fileInfo.Path );
						}
					}
				}
			}
		}
				
		// Open unique windows if we're in toolbar mode and are double clicking a disk
		var uniqueView = false;
		if( ( fileInfo.Type == 'Door' || fileInfo.Type == 'Dormant' ) && this.directoryView.navMode == 'toolbar' )
		{
			uniqueView = true;
		}
		//Just change directory
		else if( fileInfo.Type == 'Directory' && this.directoryView.navMode == 'toolbar' )
		{
			// Set a new path and record the old one!
			var we = this.directoryView.windowObject;
			var dw = this.directoryView;
			
			// Add current and set it to end of history
			var path = fileInfo.Path.split( ':' );
			var fin = {
				Volume: path[0] + ':',
				Path: fileInfo.Path,
				Title: path[0],
				Type: fileInfo.Type,
				Door: Workspace.getDoorByPath( path.join( ':' ) )
			}
			dw.addToHistory( fin );
			
			fileInfo.Volume = fileInfo.Path.split( ':' )[0] + ':'; // TODO: Should not be needed!
			we.fileInfo = fileInfo;
			
			// Update on notifications
			var ppath = fileInfo.Path;
			
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
					if( e == 'ok' )
					{
						var j = JSON.parse( d );
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
					console.log( 'File notification start result: ' + e, d );
				}
				f.execute( 'file/notificationstart' );
				console.log('notification start ' + ppath);
			}
			
			we.refresh();
			return window.isMobile ? Workspace.closeDrivePanel() : false;
		}
		
		// Open unique window!
		OpenWindowByFileinfo( this.fileInfo, event, false, uniqueView );

		if( window.isMobile ) Workspace.closeDrivePanel();
	}
	
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
	
	// Let's make it possible also for touch interfaces -----------------------
	file.addEventListener( 'touchstart', function( event )
	{
		window.fileMenuElement = file;
		window.clickElement = file;
		
		file.clickedTime = ( new Date() ).getTime();
		
		// Hold down for a while
		file.menuTimeout = setTimeout( function()
		{
			if( window.fileMenuElement )
			{
				file.onclick();
				window.fileMenuElement = null;
				window.clickElement = null;
				var f = new FullscreenMenu();
				f.show( i18n( 'menu_icons' ), i18n( 'menu_icons' ) );
			}
		}, 1000 );
		//return cancelBubble( event );
	}, false );
	
	file.addEventListener( 'touchend', function( event )
	{
		file.onclick();
		
		// When single clicking (under a second) click the file!
		var time = ( new Date() ).getTime() - file.clickedTime;
		if( time < 500 && window.clickElement )
		{
			setTimeout( function()
			{
				file.ondblclick();
			}, 100 );
		}
		
		if( file.menuTimeout )
			clearTimeout( file.menuTimeout );
		file.menuTimeout = false;
		Workspace.closeDrivePanel();
		window.clickElement = null;
	} );
}

// -----------------------------------------------------------------------------
function RefreshWindowGauge( win, finfo )
{
	if( win.content ) win = win.content
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
					var dj = JSON.parse( d );
					win.parentNode.volumeGauge.style.height = Math.floor( dj.Used / dj.Filesize * 100 ) + '%';
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
			extension: ext,
			fileInfo: fileInfo,
			window: false
		};
	}
	
	if( fileInfo.Type == 'Dormant' )
	{
		var command = fileInfo.Command ? 'command='+fileInfo.Command : '';
		var fid = typeof( fileInfo.ID ) != 'undefined' ? fileInfo.ID : '1';
		
		var wt =  fileInfo.Path ? fileInfo.Path : ( fileInfo.Filename ? fileInfo.Filename : fileInfo.Title );
		
		var wid = fileInfo.Path ? fileInfo.Path : fileInfo.Title;
		
		// Toolbar mode demands unique windows
		if( unique && movableWindows[wid] )
			wid += Math.random() * 9999 + ( Math.random() * 9999 ) + ( new Date() ).getTime();
		
		var win = new View( {
			'title'    : wt, 
			'width'    : 640, 
			'height'   : 280, 
			'memorize' : true,
			'id'       : wid,
			'volume'   : wt.substr( wt.length - 1, 1 ) == ':' ? true : false
		} );
		
		fileInfo.Dormant.addWindow( win );
		
		win.setContent( '<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" class="LoadingAnimation"></div>' );
		var we = win.getWindowElement();
		we.parentFile = iconObject;
		we.parentWindow = iconObject.window;
		we.fileInfo = fileInfo;
		CreateDirectoryView( we );
		
		we.refresh = function( callback )
		{
			var fi = this.fileInfo ? this.fileInfo : iconObject;
			var wt = fi.Path ? fi.Path : ( fi.Title ? fi.Title : fi.Volume );
			
			SetWindowFlag( this, 'title', wt );
			
			var t = fi && fi.Path ? fi.Path : ( fi.Volume ? fi.Volume : fi.Title );
			
			if( we.refreshTimeout ) clearTimeout( we.refreshTimeout );

			we.refreshTimeout = setTimeout(function(){
				fileInfo.Dormant.getDirectory( t, function( icons, data )
				{
					we.refreshTimeout = false;
					
					we.redrawIcons( icons, we.direction );
					if( win.revent ) win.removeEvent( 'resize', win.revent );
					win.revent = win.addEvent( 'resize', function()
					{
						we.redrawIcons( win.icons, we.direction );
					} );
					if( callback ) callback();
					RefreshWindowGauge( win );
				} );				
			}, 250);
			

		}
		we.refresh ();
	}
	else if( fileInfo.Type == 'DormantFunction' )
	{
		fileInfo.Dormant.execute( fileInfo.Title ? fileInfo.Title : fileInfo.Filename );
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
		
		win.setContent( '<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%" class="LoadingAnimation"><iframe style="border: 0; position: absolute; top: 0; left: 0; height: 100%; width: 100%" src="/system.library/file/read?mode=rs&sessionid=' + Workspace.sessionId + '&path=' + fileInfo.Path + '"></iframe></div>' );
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
		ExecuteApplication( 'WideWeb', iconObject.Path );
	}
	else if( iconObject.extension == 'jpg' || iconObject.extension == 'png' || iconObject.extension == 'gif' )
	{
		var rr = iconObject;
		
		var win = new View ( {
			title    : iconObject.Title ? iconObject.Title : iconObject.Filename, 
			width    : 650, 
			height   : 512, 
			memorize : true
		} );
		
		var num = ( Math.random() * 1000 ) + ( ( new Date() ).getTime() ) + ( Math.random() * 1000 );
		
		win.setContent( '<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url(\'/system.library/file/read?mode=rs&sessionid=' + Workspace.sessionId + '&path=' + fileInfo.Path + '\'); background-position: center; background-size: contain; background-repeat: no-repeat; background-color: black"></div>' );
	}
	// Run scripts in new shell
	else if( iconObject.extension == 'run' )
	{
		return ExecuteApplication( 'FriendShell', "execute " + iconObject.Path );
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
		
		win.setContent( '<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%" class="LoadingAnimation"><video id="target_' + num + '" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="/system.library/file/read?sessionid=' + Workspace.sessionId + '&path=' + fileInfo.Path + '&mode=rs" controls="controls" autoplay="autoplay" ondblclick="Workspace.fullscreen( this )" ontouchstart="touchDoubleClick( this, function( ele ){ Workspace.fullscreen( ele ); } )"></video></div>' );
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
		// Add the volume to the path if it isn't there
		if( fileInfo.Path.indexOf( ':' ) < 0 && fileInfo.Volume )
		{
			fileInfo.Path = fileInfo.Volume + fileInfo.Path;
		}
			
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
			'width'    : stored && stored.width ? stored.width : 640, 
			'height'   : stored && stored.height ? stored.height : 280,
			'memorize' : true,
			'id'       : id,
			'hidden'   : true,
			'volume'   : isVolume
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
		CreateDirectoryView( win );
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
			
			win.refresh = function( callback )
			{
				var wt = this.fileInfo.Path ? this.fileInfo.Path : ( this.fileInfo.Title ? this.fileInfo.Title : this.fileInfo.Volume );
				SetWindowFlag( this, 'title', wt );
				var fi = this.fileInfo;
				dr.getIcons( fi, function( icons )
				{
					if( icons )
					{
						// Assign door to each icon
						for( var t in icons )
						{
						
							if( win.Door.instantiate )
							{
								icons[t].Door = win.Door.instantiate();
							}
							else
							{
								// TODO: What happened? No instantiation?
								console.log( 'Failed to make door.' );
								console.log( win.Door );
							}
						}
						win.redrawIcons( icons, win.direction );
						if( w.revent ) w.removeEvent( 'resize', w.revent );
						w.revent = w.addEvent( 'resize', function()
						{
							win.redrawIcons( win.icons, win.direction );
						} );
						RefreshWindowGauge( win );
					}
					// empty
					else
					{
						win.innerHTML = '<div class="loadError">' + i18n('i18n_error_could_not_list_directory') + '</div>';
						
						win.parentNode.addEventListener( 'dragleave', noEvent,    false );
						win.parentNode.addEventListener( 'dragover',  noEvent,   false );
						win.parentNode.addEventListener( 'drop',      noEvent, false );
						win.parentNode.drop = noEvent;

						
					}
					if( callback ) callback();
				} );
			}
		}
		// No door, implement standard refresh
		else
		{
			win.refresh = function ( callback )
			{
				var wt = this.fileInfo.Path ? this.fileInfo.Path : ( this.fileInfo.Title ? this.fileInfo.Title : this.fileInfo.Volume );
				SetWindowFlag( this, 'title', wt );
				var j = new cAjax ();
				
				var updateurl = '/system.library/file/dir?wr=1'
				updateurl += '&path=' + encodeURIComponent( this.fileInfo.Path );
				updateurl += '&sessionid= ' + encodeURIComponent( Workspace.sessionId );
				
				j.open( 'get', updateurl, true, true );
							
				j.fileInfo = this.fileInfo;
				j.file = iconObject;
				j.win = win;
				j.onload = function ()
				{
					if( win.refreshTimeout )
					{
						clearTimeout( win.refreshTimeout );
						win.refreshTimeout = false;
					}
					
					var content;
					// New mode
					if ( this.returnCode == 'ok' )
					{
						try
						{
							content = JSON.parse(this.returnData||"null");
						}
						catch ( e ){};
					}
					// Legacy mode.. 
					// TODO: REMOVE FROM ALL PLUGINS AND MODS!
					else 
					{
						try
						{
							content = JSON.parse(this.responseText() || "null");
						}
						catch ( e ){}
					}
				
					if ( content )
					{
						var ww = this.win;
						ww.redrawIcons( content, ww.direction );
						ww.file = this.file;
						if( w.revent ) ww.RemoveEvent( 'resize', ww.revent );
						ww.revent = ww.AddEvent ( 'resize', function ()
						{
							ww.redrawIcons( content, ww.direction );
						} );
					}
					if( callback ) callback();
					RefreshWindowGauge( win );
				}
				j.send ();
			}
		}
		
		// If we're busy, delay!
		if( win.refreshTimeout )
		{
			clearTimeout( win.refreshTimeout );
			win.refreshTimeout = setTimeout(function() {
				win.refresh();			
			}, 250);
		}
		else
		{
			win.refresh()
		}
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
	
			var win = new View ( {
				'title'    : iconObject.Title ? iconObject.Title : iconObject.Filename,
				'width'    : 330, 
				'height'   : 280, 
				'memorize' : true,
				'id'       : fileInfo.MetaType + '_' + fid
			} );
			
			win.parentFile = iconObject;
			win.setContent ( '<iframe style="background: #e0e0e0; position: absolute; top: 0; \
				left: 0; width: 100%; height: 100%; border: 0" \
				src="/system.library/file/read?sessionid=' + Workspace.sessionId + '&path=' + fileInfo.Path + '&mode=rs"></iframe>' ); 
			win.parentWindow = iconObject.window;				
	
		}
	}
	else if ( fileInfo.MetaType == 'DiskHandled' )
	{
		var tmp = fileInfo.Path.split(':');
		ExecuteJSXByPath(tmp[0] + ':index.jsx',fileInfo.Path);
	}
	
	cancelBubble( event );
}

// Create an icon (fast way) and return the dom element ------------------------
function CreateIcon( fileInfo )
{
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
	switch( k )
	{
		// TODO: Implement confirm dialog!
		case 46:
			Workspace.deleteFile();
			break;
	}
}

/*// Delete files in a file view (from selected icons) ---------------------------
function DoorsDeleteFiles()
{
	var w = window.regionWindow;
	if ( w && w.icons && w.icons.length )
	{
		var num = 0;
		var icons = new Array ();
		for( var a = 0; a < w.icons.length; a++ )
		{
			if ( w.icons[a].domNode.className.indexOf ( ' Selected' ) > 0 )
			{
				icons.push ( w.icons[a].domNode.fileInfo );
				num++;
			}
		}
		if ( num > 0 )
		{
			if ( confirm ( 'Er du sikker på at du vil legge ' + num + ' fil(er) i søppel?' ) )
			{
				var j = new cAjax ();
				j.open ( 'post', 'admin.php?module=files&command=delete', true, true );
				j.addVar ( 'fileInfo', JSON.stringify ( jsonSafeObject ( icons ) ) );
				j.onload = function ()
				{
					if ( this.returnCode == 'ok' )
					{
						if ( window.regionWindow )
						{
							if ( window.regionWindow == ge ( 'Doors' ) )
								RefreshDesktop ();
							else if( window.regionWindow.redrawIcons )
							{
								window.regionWindow.redrawIcons();
							}
							else if( window.regionWindow.windowObject && window.regionWindow.windowObject.redrawIcons )
							{
								window.regionWindow.windowObject.redrawIcons();
							}
						}
					}
					else alert ( 'En feil oppsto under slettingen.' );
				}
				j.send ();
			}
		}
	}
}*/

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



// -----------------------------------------------------------------------------
if ( window.addEventListener )
	window.addEventListener ( 'keydown', CheckDoorsKeys );
else window.attachEvent ( 'onkeydown', CheckDoorsKeys );


