/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/** @file
 *
 * File browser class
 * 
 *
 * @author HT (Hogne Titlestad)
 */
 
/**
 * TODO: There are some race conditions left between 'bookmark' type and 
 *       'volume' type paths jumping around. Make sure that the context
 *       isn't broken (i.e. suddenly a bookmark item triggers a volume item)
 */

Friend = window.Friend || {};

// File browser ----------------------------------------------------------------

Friend.FileBrowserEntry = function()
{
};

/*
	Filebrowser class - creates a recursive file browser!
	
	flags:
	{
		displayFiles: true | false // File extension filter
		filedialog: true | false   // Is the browser used in a file dialog?
		justPaths: true | false    // Just show the directories?
		path: true | false         // Target path to focus on at start
		bookmarks: true | false    // Show the bookmarks pane?
		rootPath: true | false     // The root from which to display structures
	}
	
	callbacks:
	{
		void checkFile( filepath, fileextension )
		void loadFile( filepath )
		bool permitFiletype( filepath )
	}
	
	// flags.path is the target path in a query
	// rootPath is where to start listing files from
*/


Friend.FileBrowser = function( initElement, flags, callbacks )
{
	let self = this;
	
	// Make ready for alternative to bookmarks
	this.favorites = [];
	
	this.clickType = null;
	this.prevPath = null;
	
	this.dom = initElement;
	this.dom.addEventListener( 'scroll', function()
	{
		// Block autoscrolling
		self.scrolling = true;
		setTimeout( function()
		{
			self.scrolling = false;
		}, 50 );
	}, false );
	this.dom.classList.add( 'FileBrowser' );
	this.rootPath = 'Mountlist:'; // The current root path
	this.callbacks = callbacks;
	
	self.flags = { displayFiles: false, filedialog: false, justPaths: false, path: self.rootPath, bookmarks: true, rootPath: false, noContextMenu: false };
	if( flags )
	{
		for( let a in flags )
			self.flags[ a ] = flags[ a ];
	}
	if( this.flags.rootPath )
		this.rootPath = this.flags.rootPath;
	
	// If we don't have a rootPath the default is Mountlist:
	if( !this.rootPath ) this.rootPath = 'Mountlist:';
	
	// Clicking the pane
	this.dom.onclick = function( e )
	{
		let t = e.target ? e.target : e.srcElement;
		if( t == this )
		{
			let cb = function()
			{
				if( t )
				{
					self.callbacks.folderOpen( self.rootPath, e );
				}
				t = null;
			};
			// Can't set icon listing path to mountlist..
			if( self.rootPath != 'Mountlist:' )
			{
				self.setPath( self.rootPath, cb, e );
			}
		}
		return cancelBubble( e );
	}
};
Friend.FileBrowser.prototype.clear = function()
{
	this.dom.innerHTML = '';
	this.headerDisks = false;
	this.bookmarksHeader = false;
}
Friend.FileBrowser.prototype.render = function( force )
{
	let self = this;
	
	if( force && this.dom )
	{
		this.clear();
	}
	
	this.refresh();
};
Friend.FileBrowser.prototype.drop = function( elements, e, win )
{
	let drop = 0;
	let self = this;

	// Only if we have bookmarks
	if( self.flags.bookmarks )
	{
		// Element was dropped here
		for( let a = 0; a < elements.length; a++ )
		{
			if( elements[a].fileInfo.Type == 'Directory' )
			{
				if( elements[a].fileInfo.Path.substr( elements[a].fileInfo.Path - 1, 1 ) != ':' )
				{
					let m = new Module( 'system' );
					m.onExecuted = function( e, d )
					{
						if( e == 'ok' )
						{
							self.clear();
							self.refresh( 'Mountlist:', null, null, null, { mode: 'poll' } );
						}
					}
					m.execute( 'addbookmark', { path: elements[a].fileInfo.Path, name: elements[a].fileInfo.Filename } );
					drop++;
					cancelBubble( e );
				}
			}
		}
		if( win && drop == 0 )
		{
			if( win.refresh )
			{
				win.refresh();
			}
		}
	}
	return drop;
};

// Set an active path
// Supported flags ( { lockHistory: true|false } )
Friend.FileBrowser.prototype.setPath = function( target, cbk, tempFlags, e )
{
	let winobj = false;
	if( this.directoryView && this.directoryView.window && this.directoryView.window.windowObject )
		winobj = this.directoryView.window.windowObject;
	else return false;
	
	let path = target;
			
	if( !Workspace.diskNotificationList[ path ] )
	{
		Workspace.diskNotificationList[ path ] = {
			type: 'directory',
			view: winobj
		};
		let f = new Library( 'system.library' );
		f.addVar( 'sessionid', Workspace.sessionId );
		f.addVar( 'path', path );
		f.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				let j = JSON.parse( d );
				winobj.addEvent( 'systemclose', function()
				{
					winobj.removeEvent( 'systemclose', this );
					let ff = new Library( 'system.library' );
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
	
	// Already set
	if( this.flags.path && this.flags.path == target ) 
	{
		return;
	}
	
	this.tempFlags = false;
	this.flags.path = target; // This is the current target path..
	if( tempFlags ) this.tempFlags = tempFlags;
	
	this.refresh( this.rootPath, this.dom, cbk, 0, { context: this.lastContext } );
}

Friend.FileBrowser.prototype.rollOver = function( elements )
{
	// Do some user feedback later
};
Friend.FileBrowser.prototype.updateFavorites = function()
{
    let self = this;
    
    let rootElement = this.dom;
    
    if( self.favoritesDom && !self.favoritesDom.parentNode )
        self.favoritesDom = null;
    
	// No favorites container? Remove
	if( !self.favoritesDom && self.favorites.length )
	{
		self.favoritesDom = document.createElement( 'div' );
		self.favoritesDom.className = 'Favorites';
		
		let m = document.createElement( 'div' );
		m.innerHTML = '<p><strong>Favorites:</strong></p>';
		self.favoritesDom.appendChild( m );
		
		self.favoritesContainer = document.createElement( 'div' );
		self.favoritesContainer.className = 'FileBrowserFavorites';
		self.favoritesDom.appendChild( self.favoritesContainer );
		
		rootElement.insertBefore( self.favoritesDom, rootElement.firstChild );
	}
	// No favorites? Clean up
	if( self.favoritesDom && !self.favorites.length && rootElement && rootElement.parentNode )
	{
		rootElement.removeChild( self.favoritesDom );
		self.favoritesDom = false;
		self.favoritesContainer = false;
		return;
	}
	if( !self.favoritesContainer ) return;
	
	let ul = self.favoritesContainer.getElementsByTagName( 'ul' );
	if( ul.length )
	{
	    ul = ul[0];
	}
	else
	{
	    ul = document.createElement( 'ul' );
	    self.favoritesContainer.appendChild( ul );
	}
	
	let existing = ul.getElementsByTagName( 'li' );

	for( let a = 0; a < self.favorites.length; a++ )
	{
	    // Check for doubles
	    let found = false;
	    for( let b = 0; b < existing.length; b++ )
	    {
	        if( self.favorites[ a ].ID == existing[ b ].getAttribute( 'bookmark-id' ) )
	        {
	            found = true;
	            break;
	        }
	    }
	    if( found ) continue;
	    
		let item = self.favorites[ a ];
		let li = document.createElement( 'li' );
		li.setAttribute( 'bookmark-id', item.ID );
		
		let icon = document.createElement( 'span' );
		icon.className = 'FileBrowserItemImage';
		icon.style.backgroundImage = 'url(/iconthemes/friendup15/DriveLabels/Bookmark.svg)';
		let label = document.createElement( 'span' );
		label.className = 'FileBrowserItemLabel';
		label.innerHTML = item.Title;
		let rem = document.createElement( 'span' );
		rem.className = 'IconSmall fa-remove';
		
		( function( liElement, ulElement, remmer, path )
		{
		    liElement.onclick = function( e )
		    {
		        // Find active list item
		        let lis = ulElement.getElementsByTagName( 'li' );
		        for( let a = 0; a < lis.length; a++ )
		        {
		            if( lis[ a ] == liElement )
		            {
		                lis[ a ].classList.add( 'Activated' );
		                self.callbacks.folderOpen( path, e );
		            }
		            else
		            {
		                lis[ a ].classList.remove( 'Activated' );
		            }
		        }
		        // Remove active state on disks
		        let disks = rootElement.getElementsByClassName( 'DiskItem' );
		        for( let a = 0; a < disks.length; a++ )
		        {
		            let everything = disks[ a ].getElementsByTagName( 'div' );
		            for( let b = 0; b < everything.length; b++ )
		            {
		                everything[b].classList.remove( 'Open' );
		                everything[b].classList.remove( 'Active' );
		            }
		        }
		    }
		    remmer.onclick = function( ev )
		    {
		        let mo = new Module( 'system' );
			    mo.onExecuted = function( eo, od )
			    {
				    if( eo == 'ok' )
				    {
					    self.clear();
					    self.refresh( null, null, null, null, { mode: 'poll' } );
				    }
			    }
			    mo.execute( 'removebookmark', { name: path } );
			    return cancelBubble( ev );
		    }
		} )( li, ul, rem, item.Path );
		
		li.appendChild( icon ); li.appendChild( label );
		li.appendChild( rem );
		ul.appendChild( li );
	}
	
	self.favoritesContainer.appendChild( ul );
}
// Create onclick action function for refresh function
Friend.FileBrowser.prototype.getOnClickActionFunc = function( data )
{
    let self = this;
    let context = refreshMode = path = rootElement = callback = depth = flags = evt = false;
    if( data )
    {
        if( data.context )
            context = data.context;
        if( data.path )
            path = data.path;
        if( data.rootElement )
            rootElement = data.rootElement;
        if( data.callback )
            callback = data.callback;
        if( data.depth )
            depth = data.depth;
        if( data.flags )
            flags = data.flags;
        if( data.evt )
            evt = data.evt;
    }
    
    if( flags )
	{
		if( flags.context )
		{
			context = flags.context;
			self.lastContext = context;
		}
		if( flags.mode )
			refreshMode = flags.mode;
	}
    
    function createOnclickAction( ele, ppath, type, depth )
	{
		// Not more than once
		if( ele.onclick ) return;
		
		ele.clickType = context ? context : type;
		
		// Parent decides
		try
		{
			 if( ele.parentNode.parentNode.clickType )
			 {
			 	ele.clickType = ele.parentNode.parentNode.clickType;
			 }
		}
		catch( e ){};
		
		ele.onmouseover = function()
		{
			self.lastContext = this.clickType;
		}
		
		ele.onclick = function( e )
		{
			// Remove favorites active state
			if( self.favoritesDom )
			{
			    let lis = self.favoritesContainer.getElementsByTagName( 'li' );
			    for( let a = 0; a < lis.length; a++ )
			    {
			        lis[a].classList.remove( 'Activated' );
			    }
			}
			
			// Real click removes temp flags
			if( e && ( e.button === 0 || e.button > 0 ) )
				self.tempFlags = false;
			
			// Don't allow the "simulated click" to trigger different contexts
			if( !e && this.clickType != self.lastContext )
				return;
			
			if( !ppath ) 
			{
				return cancelBubble( e );
			}
			if ( ppath.indexOf( ':' ) < 0 )
				ppath += ':';

			// Real click or entering target path
			let doClick = ( ppath == self.flags.path ) || ( e && e.button >= 0 );

			if( type == 'File' )
			{
				let eles = self.dom.getElementsByTagName( 'div' );
				for( let a = 0; a < eles.length; a++ )
				{
					eles[a].classList.remove( 'Active' );
				}
				let nam = ele.getElementsByClassName( 'Name' );
				if( nam.length )
				{
					nam[0].classList.add( 'Active' );
				}
				
				let treated = false;
				let ext = ppath.split( '.' );
				if( ext && ext.length )
				{
					ext = ext[ ext.length - 1 ].toLowerCase();
					if( self.callbacks.checkFile )
					{
						self.callbacks.checkFile( ppath, ext );
						treated = true;
						return cancelBubble( e );
					}
				}
				if( !treated && self.callbacks.loadFile )
				{
					self.callbacks.loadFile( ppath, e, self.tempFlags );
				}
			}
			else if( type == 'RootDirectory' )
			{
				// Are we in a file dialog?
				if( isMobile && ( self.flags.filedialog || self.flags.justPaths ) )
				{
					self.callbacks.folderOpen( ppath, e, self.tempFlags );
					return cancelBubble( e );
				}
				
				if( doClick )
				{
					if( self.callbacks && self.callbacks.folderOpen )
					{
						self.callbacks.folderOpen( ppath, e, self.tempFlags );
					}
				}
				
				// Set this to active
				let eles = self.dom.getElementsByTagName( 'div' );
				for( let a = 0; a < eles.length; a++ )
				{
					eles[a].classList.remove( 'Active' );
				}
				let nam = ele.getElementsByClassName( 'Name' );
				if( nam.length )
				{
					nam[0].classList.add( 'Active' );
				}
			}
			else if( type == 'Directory' || type == 'volume' || type == 'bookmark' )
			{
				// Are we in a file dialog?
				if( isMobile && ( self.flags.filedialog || self.flags.justPaths ) )
				{
					self.callbacks.folderOpen( ppath, e, self.tempFlags );
					return cancelBubble( e );
				}
				
				let nam = ele.getElementsByClassName( 'Name' );
				
				// Normal operation
				if( !this.classList.contains( 'Open' ) || ( e && e.mode == 'open' ) )
				{
					let subitems = ele.getElementsByClassName( 'SubItems' );
					if( subitems.length )
					{
						this.classList.add( 'Open' );

						// Only refresh at final destination
						if( doClick )
						{
							// Register that this is now the path
							// such that we don't double refresh
							self.flags.path = ppath;
							
							self.refresh( ppath, subitems[0], callback, depth, { context: type == 'volume' || type == 'bookmark' ? type : null }, e );
							if( self.callbacks && self.callbacks.folderOpen )
							{
								self.callbacks.folderOpen( ppath, e, self.tempFlags );
							}
						}
						if( nam.length )
						{
							nam[0].classList.add( 'Open' );
						}
					}
				}
				// Only close folders if they are active and clicked
				else if( nam.length && e && ( ( !isMobile && e.button >= 0 ) || ( isMobile && doClick ) ) )
				{
					// Only close active
					if( nam[0].classList.contains( 'Active' ) )
					{
						this.classList.remove( 'Open' );
						nam[0].classList.remove( 'Open' );
					
						if( self.callbacks && self.callbacks.folderClose )
						{
							self.callbacks.folderClose( ppath, e, self.tempFlags );
						}
					}
					// Again clicking (like open...)
					else if( self.callbacks && self.callbacks.folderOpen )
					{
						self.callbacks.folderOpen( ppath, e, self.tempFlags );
					}
				}
				
				// Set this to active
				let eles = self.dom.getElementsByTagName( 'div' );
				for( let a = 0; a < eles.length; a++ )
				{
					eles[a].classList.remove( 'Active' );
				}
				nam = ele.getElementsByClassName( 'Name' );
				if( nam.length )
				{
					nam[0].classList.add( 'Active' );
					
					// Scroll into view
					if( !isMobile && !self.scrolling && refreshMode != 'poll' )
					{
						let d = self.dom;
						let h = d.offsetHeight >> 1;
						d.scrollTop = nam[0].offsetTop - h;
					}
				}
				
				fnam = ppath.split( ':' )[1];
				if( fnam.indexOf( '/' ) > 0 )
					fnam = fnam.split( '/' ).pop();
			}
			return cancelBubble( e );
		}
		ele.oncontextmenu = function( e )
		{
			console.log( 'oncontextmenu', {
				isMobile      : isMobile,
				noContextMenu : self.flags.noContextMenu,
				type          : type,
				theme         : window?.Workspace?.theme,
			});
			if( isMobile ) return;
			if( self.flags.noContextMenu ) return cancelBubble( e );
			
			let men = cmd = '';
			let cf = false; // create file
			if( type == 'File' )
			{
				men = 'i18n_open_file';
				cmd = 'menuloadfile';
			}
			else if( ele.classList.contains( 'Open' ) )
			{
				// Only show this if it is possible
				if( i18n( 'i18n_create_file' ) != 'i18n_create_file' )
				{
					if( type == 'Volume' || type == 'Directory' )
					{
						cf = {
							name: i18n( 'i18n_create_file' ),
							command: 'createfile',
							data: { path: ppath }
						};
					}
				}
			}
			let menu = [];
			if( men && cmd )
			{
				menu.push( {
					name: i18n( men ),
					command: cmd,
					data: { path: ppath }
				} );
			}
			if( type == 'volume' )
			{
				if ( window?.Workspace?.theme != 'jeanie' )
				{
					menu.push( {
						name: i18n( 'menu_show_icon_information' ),
						command: function()
						{
							for( let c = 0; c < Workspace.icons.length; c++ )
							{
								if( Workspace.icons[ c ].Volume === ppath )
								{
									Workspace.fileInfo( Workspace.icons[ c ] );
									break;
								}
							}
						}
					} );
				}
			}
			if( cf ) menu.push( cf );
			
			if ( menu.length < 1 )
				return cancelBubble( e );
			
			if( window.ShowContextMenu )
			{
				ShowContextMenu( i18n( 'i18n_file_menu' ), menu );
			}
			else if( window.Workspace )
				Workspace.showContextMenu( menu, e );
			return cancelBubble( e );
		}
	}
	return createOnclickAction;
}
// Refresh the file browser (side bar)
Friend.FileBrowser.prototype.refresh = function( path, rootElement, callback, depth, flags, evt )
{
	let self = this;
	if( !evt ) evt = {};
	
	if( !rootElement ) rootElement = this.dom;
	if( !callback ) callback = false;
	if( !path ) path = this.rootPath; // Use the rootpath
	if( !depth ) depth = 1;
	
	// Fix column problem
	if ( path.indexOf( ':' ) < 0 )
		path += ':';

	let refreshMode = 'normal';
	let context = null;
	if( flags )
	{
		if( flags.context )
		{
			if( self.lastContext != flags.context && !evt.button )
			{
				return;
			}
			context = flags.context;
			self.lastContext = context;
		}
		if( flags.mode )
			refreshMode = flags.mode;
	}

	if( !this.headerDisks )
	{
		this.headerDisks = document.createElement( 'div' );
		this.headerDisks.innerHTML = '<p class="Layout BorderBottom PaddingBottom"><strong>' + i18n( 'i18n_your_devices' ) + ':</strong></p>';
		rootElement.appendChild( this.headerDisks );
	}
	
	// What are we looking for at this level?
	// Keeps the whole target path, but searches on each level recursively..
	let targetPath = false;
	if( this.flags.path )
	{
		targetPath = this.flags.path;
	}
	
	let createOnclickAction = self.getOnClickActionFunc( { 
	    context: context,
	    path: path, 
	    rootElement: rootElement, 
	    callback: callback, 
	    depth: depth, 
	    flags: flags, 
	    evt: evt
    } );  
		
	// A click element for incoming path
	let clickElement = null;
	
	// Check for theme engine (goes into favorites mode)
	let favoritesMode = document.body.classList.contains( 'ThemeEngine' );

	// Just get a list of disks
	if( path == 'Mountlist:' )
	{	
		let func = function( flags, cb )
		{
			// For Workspace scope
			if( window.Workspace )
			{
				Friend.DOS.getDisks( flags, function( response, msg )
				{
					cb( response ? {
						list: msg
					} : false );
				} );
			}
			// For application scope
			else
			{
				Friend.DOS.getDisks( flags, cb );
			}
		}
		// Check from off mountlist
		func( { sort: true }, function( msg )
		{	
			if( !msg || !msg.list ) return;
			
			if( callback ) callback();
			
			function done()
			{
				// Get existing
				let eles = rootElement.childNodes;
								
				let found = [];
				let foundElements = [];
				let foundStructures = [];
				let removers = [];
				
				// Move Home: to the top
				let temp = [];
				for( let a = 0; a < msg.list.length; a++ )
				{
					if( msg.list[a].Volume == 'Home:' )
					{
						temp.push( msg.list[a] );
						break;
					}
				}
				for( let a = 0; a < msg.list.length; a++ )
				{
					if( msg.list[a].Volume != 'Home:' )
						temp.push( msg.list[a] );
				}
				msg.list = temp;
				// Done moving Home: to the top
				
				// Check the existing nodes, if we have items that do not
				// exist any longer and needs to be removed
				for( let a = 0; a < eles.length; a++ )
				{
					let elFound = false;
					if( !eles[a].id ) continue;
					
					// Check our list (also contains bookmarks!)
					for( let b = 0; b < msg.list.length; b++ )
					{
						let vol = msg.list[ b ].Volume;
						if( vol == 'System:' ) continue;
						
						// Ignore shared: TODO: We are trying to remove it
						if( self.directoryView && self.directoryView.filedialog && vol == 'Shared:' )
						{
							continue;
						}
						
						if( eles[a].id == 'diskitem_' + msg.list[b].Title )
						{
							createOnclickAction( eles[a], vol, 'volume', depth + 1 );
							
							// Don't add twice
							if( !found.find( function( ele ){ ele == msg.list[b].Title } ) )
							{
								found.push( msg.list[b].Title ); // Found item titles
								foundElements.push( eles[a] ); // Found dom nodes
								foundStructures.push( msg.list[ b ] ); // Found dos structures
							}
							elFound = true;
							break;
						}
					}
					// Deleted element
					if( !elFound && eles[a] != self.headerDisks && eles[a] != self.bookmarksHeader )
					{
						removers.push( eles[a] );
					}
				}
				if( removers.length )
				{
					for( let a = 0; a < removers.length; a++ )
					{
						rootElement.removeChild( removers[a] );
					}
					delete removers;
				}
				
				// Iterate through the resulting list
				for( let a = 0; a < msg.list.length; a++ )
				{
					// Skip system drive
					if( msg.list[a].Volume == 'System:' ) continue;
					if( self.directoryView && self.directoryView.filedialog && msg.list[ a ].Volume == 'Shared:' )
						continue;
					
					// Add the bookmark header if it doesn't exist
					if( self.flags.bookmarks && msg.list[a].Type && msg.list[a].Type == 'header' && !self.bookmarksHeader )
					{
						// Only add bookmarks header when not in favorites mode
						if( !favoritesMode )
						{
							let d = document.createElement( 'div' );
							self.bookmarksHeader = d;
							d.innerHTML = '<p class="Layout BorderBottom PaddingTop BorderTop PaddingBottom"><strong>' + i18n( 'i18n_bookmarks' ) + ':</strong></p>';
							rootElement.appendChild( d );
							continue;
						}
					}
					
					// Check if this item already exists
					let foundItem = foundStructure = false;
					for( let b = 0; b < found.length; b++ )
					{
						if( found[b] == msg.list[a].Title || msg.list[a].Type == 'header' )
						{
							foundItem = foundElements[ b ];
							foundStructure = foundStructures[ b ];
							break;
						}
					}
					
					// Didn't already exist, make it
					if( !foundItem )
					{
						let d = document.createElement( 'div' );
						d.className = 'DiskItem';
						d.id = 'diskitem_' + msg.list[a].Title;
						d.path = msg.list[a].Volume;
						d.type = msg.list[a].Type;
						d.clickType = d.type;
						let nm = document.createElement( 'div' );
						nm.style.paddingLeft = ( depth << 3 ) + 'px'; // * 8
						nm.className = 'Name IconSmall IconDisk';
						nm.innerHTML = '<span> ' + msg.list[a].Title + '</span>';
						
						// We have an incoming path
						if( !clickElement && self.flags.path && targetPath == d.path )
						{
							clickElement = d;
							if( context && clickElement.clickType != context )
								clickElement = false;
						}				
						
						if( Friend.dosDrivers && !( msg.list[a].Type && msg.list[a].Type == 'bookmark' ) )
						{
							let driver = msg.list[a].Driver;
							
							// Find correct image
							let img = '/iconthemes/friendup15/DriveLabels/FriendDisk.svg';
							if( Friend.dosDrivers[ driver ] && Friend.dosDrivers[ driver ].iconLabel )
								img = 'data:image/svg+xml;base64,' + Friend.dosDrivers[ driver ].iconLabel;
							if( msg.list[a].Title == 'Home' )
								img = '/iconthemes/friendup15/DriveLabels/Home.svg';
							else if( msg.list[a].Title == 'Shared' )
								img = '/iconthemes/friendup15/DriveLabels/Shared.svg';
							else if( msg.list[a].Title == 'System' )
								img = '/iconthemes/friendup15/DriveLabels/SystemDrive.svg';
							
							let i = document.createElement( 'div' );
							i.className = 'FileBrowserItemImage';
							i.style.backgroundImage = 'url("' + img + '")';
							nm.appendChild( i );
							nm.classList.remove( 'IconSmall' );
							nm.classList.remove( 'IconDisk' );
						}
						
						d.appendChild( nm );
						
						let ctype = 'volume';
						
						if( msg.list[a].Type && msg.list[a].Type == 'bookmark' )
						{
							if( favoritesMode )
							{
								continue;
							}
							else
							{
								// Set nice folder icon
								nm.classList.remove( 'IconSmall' );
								nm.classList.remove( 'IconDisk' );
								let img = '/iconthemes/friendup15/DriveLabels/Bookmark.svg';
								let i = document.createElement( 'div' );
								i.className = 'FileBrowserItemImage';
								i.style.backgroundImage = 'url("' + img + '")';
								nm.appendChild( i );
								
								( function( ls ){
									let ex = document.createElement( 'span' );
									ex.className = 'FloatRight IconButton IconSmall fa-remove';
									ex.onclick = function( e )
									{
										let m = new Module( 'system' );
										m.onExecuted = function( e, d )
										{
											if( e == 'ok' )
											{
												self.clear();
												self.refresh( null, null, null, null, { mode: 'poll' } );
											}
										}
										m.execute( 'removebookmark', { name: ls.Path } );
										return cancelBubble( e );
									}
									nm.appendChild( ex );
								} )( msg.list[a] );
								
								ctype = 'bookmark';
							}
						}
						
						let s = document.createElement( 'div' );
						s.className = 'SubItems ' + msg.list[a].Type;
						d.appendChild( s );
						rootElement.appendChild( d );
						createOnclickAction( d, d.path, ctype, depth + 1 );
					}
					// Existing items
					else
					{
						// Only refresh child elements if not open
						if( foundItem.classList.contains( 'Open' ) )
						{
							let s = foundItem.getElementsByClassName( 'SubItems' );
							if( s && s.length && msg.list[a].Volume )
							{
								self.refresh( msg.list[a].Volume, s[0], false, depth + 1, { context: foundItem.clickType } );
							}
						}
						
						if( !clickElement && self.flags.path && targetPath == foundItem.path )
						{
							clickElement = foundItem;
							if( context && clickElement.clickType != context )
								clickElement = false;
						}
					}
				}
				
				// Manage space.
				if( self.bookmarksHeader )
				{
					self.bookmarksHeader.parentNode.classList.add( 'Bookmarks' );
				}
				
				// Add checkers classes
				let sw = 2;
				for( let a = 0; a < eles.length; a++ )
				{
					sw = sw == 2 ? 1 : 2;
					if( eles[a].className && eles[a].classList.contains( 'DiskItem' ) )
					{
						eles[a].classList.remove( 'sw1' );
						eles[a].classList.remove( 'sw2' );
						eles[a].classList.add( 'sw' + sw );
					}
				}
				
				// Click the click element for path
				if( clickElement && !( self.tempFlags && !self.tempFlags.passive ) )
				{
					self.lastClickElement = clickElement; // store it
					if( !( evt.target && evt.srcElement ) && refreshMode != 'poll' )
					{
						setTimeout( function()
						{
							clickElement.onclick( { mode: 'open' } );
						}, 5 );
					}
				}
				
				if( favoritesMode )
				{
					self.updateFavorites();
				}
			}
			
			if( self.flags.bookmarks )
			{
				self.favorites = [];
				let m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					let js = false;
					
					if( e == 'ok' )
					{
						try
						{
							js = JSON.parse( d );
						}
						catch( e ){}
					    //console.log( 'Got favorites', js );
					}
					
					if( !favoritesMode )
					{
						msg.list.push( {
							Title: i18n( 'i18n_bookmarks' ) + ':',
							Type: 'header'
						} );
					}
					
					self.hasBookmarks = false;
					
					if( js )
					{
						for( let a = 0; a < js.length; a++ )
						{
							let ele = {
								Title: js[a].name,
								Type: 'bookmark',
								Path: js[a].path,
								Volume: js[a].path,
								ID: js[a].id
							};
							if( !favoritesMode )
							{
    							msg.list.push( ele );
    					    }
    						else
    						{
							    self.favorites.push( ele );
							}
						}
						self.hasBookmarks = true;
					}
					
					done();
				}
				m.execute( 'getbookmarks' );
			}
			else
			{
				done();
			}
		} );
	}
	// Get sub directories
	else
	{
	    // If we're in favorites mode, skip (we don't care about subdirs here)
        if( self.favoritesDom ) return;
    
		// Support both API scope and Workspace scope
		let func = function( path, flags, cb )
		{
			// Don't do translations here!
			flags.translations = false;
		
			if( window.Workspace )
			{
				Friend.DOS.getDirectory( path, flags, function( response, msg )
				{
					cb( response ? {
						list: msg
					} : false );
				} );
			}
			else
			{
				Friend.DOS.getDirectory( path, flags, cb );
			}
		}
	
		func( path, { sort: true }, function( msg )
		{
			if( !msg || !msg.list ) return;
			
			// Create metadirectory "root"
			if( depth == 1 )
			{
				let itm = [ { Type: 'Directory', Filename: i18n( 'i18n_root_directory' ), Path: Application.browserPath, Title: i18n( 'i18n_root_directory' ), MetaType: 'RootDirectory' } ];
				msg.list = itm.concat( msg.list );
			}

			if( callback ) callback();
			
			// Get existing
			let eles = rootElement.childNodes;
						
			let removers = [];
			let found = [];
			let foundElements = [];
			for( let a = 0; a < eles.length; a++ )
			{
				let elFound = false;
				for( let b = 0; b < msg.list.length; b++ )
				{
					if( eles[a].id == 'fileitem_' + msg.list[b].Filename.split( ' ' ).join( '' ) )
					{
						let fn = msg.list[b].Filename;
						if( msg.list[b].Type == 'Directory' )
							fn += '/';
						
						// Special case - isn't really a directory (uses path without filename)
						if( msg.list[b].MetaType == 'RootDirectory' )
						{
							createOnclickAction( eles[a], path, 'RootDirectory', depth + 1 );
						}
						else
						{
							createOnclickAction( eles[a], path + fn, msg.list[b].Type, depth + 1 );
						}
						
						// Don't add twice
						if( !found.find( function( ele ){ ele == msg.list[b].Filename } ) )
						{
							found.push( msg.list[b].Filename );
							foundElements.push( eles[a] );
						}
						elFound = true;
					}
				}
				// Deleted item
				if( !elFound )
				{
					removers.push( eles[a] );
				}
			}
			
			let finalRemovers = [];
			for( let a = 0; a < removers.length; a++ )
			{
				if( removers[ a ].nodeName == 'INPUT' ) 
				{
				    finalRemovers.push( removers[ a ] );
				}
				else
				{
				    rootElement.removeChild( removers[a] );
				}
			}
			
			delete removers;
			
			// Precalc
			let d13 = depth * 13;
			for( let a = 0; a < msg.list.length; a++ )
			{
				let foundItem = false;
				if( msg.list[a].Filename.substr( 0, 1 ) == '.' ) continue; // skip hidden files
				for( let b = 0; b < found.length; b++ )
				{
					if( found[b] == msg.list[a].Filename )
					{
						foundItem = foundElements[b];
						break;
					}
				}
				if( !foundItem )
				{
					if( msg.list[a].Type == 'Directory' || ( self.callbacks && self.callbacks.permitFiletype && self.callbacks.permitFiletype( path + msg.list[a].Filename ) ) )
					{
						// Not displaying files?
						if( msg.list[a].Type != 'Directory' && !self.flags.displayFiles )
						{
							continue;
						}
						let d = document.createElement( 'div' );
						d.className = msg.list[a].Type == 'Directory' ? 'FolderItem' : 'FileItem';
						let ext = msg.list[a].Filename.split( '.' ).pop().toLowerCase();
						let icon = d.className == 'FolderItem' ? 'IconFolder' : ( 'IconFile ' + ext );
						let title = msg.list[a].Title ? msg.list[a].Title : msg.list[a].Filename;
						
						// Translations
						if( msg.list[a].Path.indexOf( 'Shared:' ) == 0 && title.substr( 0, 5 ) == 'i18n_' )
						{
							title = i18n( title );
						}
						
						d.id = 'fileitem_' + msg.list[a].Filename.split( ' ' ).join( '' );
						d.innerHTML = '<div style="padding-left: ' + ( d13 ) + 'px" class="Name IconSmall ' + icon + '"><span> ' + title + '</span></div><div class="SubItems"></div>';
						rootElement.appendChild( d );
						let fn = msg.list[a].Filename;
						if( msg.list[a].Type == 'Directory' )
							fn += '/';
						d.path = path + fn;
						
						if( msg.list[a].MetaType == 'RootDirectory' )
						{
							d.path = self.rootPath;
							msg.list[a].Type = 'RootDirectory';
						}
						
						createOnclickAction( d, d.path, msg.list[a].Type, depth + 1 );
						
						// We have an incoming path
						if( !clickElement && self.flags.path && targetPath == d.path )
						{
							clickElement = d;
							if( context && clickElement.clickType != context )
								clickElement = false;
						}
					}
				}
				else if( foundItem && msg.list[a].Type == 'Directory' )
				{
					// Remove active state from inactive items
					let nam = foundItem.querySelector( '.Name' );
					if( nam && nam.classList.contains( 'Active' ) && foundItem.path != self.flags.path )
						nam.classList.remove( 'Active' );
					// Existing items
					if( foundItem.classList.contains( 'Open' ) )
					{
						if( msg.list[a].MetaType && msg.list[a].MetaType != 'RootDirectory' )
						{
							let s = foundItem.getElementsByClassName( 'SubItems' );
							if( s && s.length )
							{
								let fn = msg.list[a].Filename;
								if( msg.list[a].Type == 'Directory' )
									fn += '/';
								self.refresh( path + fn, s[0], false, depth + 1, { context: foundItem.clickType } );
							}
						}
					}
					// We have an incoming path
					if( !clickElement && self.flags.path && targetPath == foundItem.path )
					{
						clickElement = foundItem;
						if( context && clickElement.clickType != context )
							clickElement = false;
					}
				}
			}
			// Checkers
			let rootPathLength = self.rootPath.split( '/' ).length;
			let sw = 2;
			for( let a = 0; a < eles.length; a++ )
			{
				sw = sw == 2 ? 1 : 2;
				if( eles[a].className && ( eles[a].classList.contains( 'FolderItem' ) || eles[a].classList.contains( 'FileItem' ) ) )
				{
					eles[a].classList.remove( 'sw1' );
					eles[a].classList.remove( 'sw2' );
					eles[a].classList.add( 'sw' + sw );
				}
			}
			
			// Click the click element for path
			if( clickElement && !( self.tempFlags && !self.tempFlags.passive ) )
			{
				self.lastClickElement = clickElement; // Store it
				// Only when clicking
				if( !( evt.target && evt.srcElement ) && refreshMode != 'poll' )
				{
					setTimeout( function()
					{
						clickElement.onclick();
					}, 5 );
				}
			}
			
			// Cleanup
			for( let a = 0; a < finalRemovers.length; a++ )
			{
				finalRemovers[ a ].parentNode.removeChild( finalRemovers[ a ] );
			}
			
		} );
	}
};

