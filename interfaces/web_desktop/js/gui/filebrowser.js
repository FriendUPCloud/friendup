friend = window.friend || {};

// File browser ----------------------------------------------------------------

friend.FileBrowserEntry = function()
{
};


/*
	Filebrowser class - creates a recursive file browser!
	
	flags:
	{
		displayFiles: true | false
	}
	
	callbacks:
	{
		void checkFile( filepath, fileextension )
		void loadFile( filepath )
		bool permitFiletype( filepath )
	}
*/


friend.FileBrowser = function( initElement, flags, callbacks )
{
	var self = this;
	this.dom = initElement;
	this.dom.classList.add( 'FileBrowser' );
	this.currentPath = 'Mountlist:';
	this.callbacks = callbacks;
	this.flags = flags ? flags : { displayFiles: false };
};
friend.FileBrowser.prototype.clear = function()
{
	this.dom.innerHTML = '';
	this.headerDisks = false;
	this.bookmarksHeader = false;
}
friend.FileBrowser.prototype.render = function()
{
	var self = this;
	
	this.refresh();
};
friend.FileBrowser.prototype.drop = function( elements, e, win )
{
	var drop = 0;
	var self = this;
	// Element was dropped here
	for( var a = 0; a < elements.length; a++ )
	{
		if( elements[a].fileInfo.Type == 'Directory' )
		{
			if( elements[a].fileInfo.Path.substr( elements[a].fileInfo.Path - 1, 1 ) != ':' )
			{
				var m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					if( e == 'ok' )
					{
						self.clear();
						self.refresh( 'Mountlist:' );
					}
				}
				m.execute( 'addbookmark', { path: elements[a].fileInfo.Path, name: elements[a].fileInfo.Filename } );
				drop++;
			}
		}
	}
	if( win )
	{
		if( win.refresh ) win.refresh();
	}
	return drop;
};
friend.FileBrowser.prototype.rollOver = function( elements )
{
	// Do some user feedback later
};
friend.FileBrowser.prototype.refresh = function( path, rootElement, callback, depth )
{
	var self = this;
	
	if( !rootElement ) rootElement = this.dom;
	if( !path ) path = this.currentPath;
	if( !depth ) depth = 1;
	
	if( !this.headerDisks )
	{
		this.headerDisks = document.createElement( 'div' );
		this.headerDisks.innerHTML = '<p class="Layout BorderBottom PaddingBottom"><strong>' + i18n( 'i18n_your_devices' ) + ':</strong></p>';
		rootElement.appendChild( this.headerDisks );
	}
	
	function createOnclickAction( ele, ppath, type, depth )
	{
		ele.onclick = function( e )
		{
			if( type == 'File' )
			{
				
				var eles = self.dom.getElementsByTagName( 'div' );
				for( var a = 0; a < eles.length; a++ )
				{
					eles[a].classList.remove( 'Active' );
				}
				var nam = ele.getElementsByClassName( 'Name' );
				if( nam.length )
				{
					nam[0].classList.add( 'Active' );
				}
				
				var treated = false;
				var ext = ppath.split( '.' );
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
					self.callbacks.loadFile( ppath );
				}
			}
			else
			{
				if( !this.classList.contains( 'Open' ) )
				{
					var subitems = ele.getElementsByClassName( 'SubItems' );
					if( subitems.length )
					{
						self.refresh( ppath, subitems[0], callback, depth );
						this.classList.add( 'Open' );
						if( self.callbacks && self.callbacks.folderOpen )
						{
							self.callbacks.folderOpen( ppath );
						}
						var nam = ele.getElementsByClassName( 'Name' );
						if( nam.length )
						{
							nam[0].classList.add( 'Open' );
						}
					}
				}
				else
				{
					this.classList.remove( 'Open' );
					var nam = ele.getElementsByClassName( 'Name' );
					if( nam.length )
					{
						nam[0].classList.remove( 'Open' );
						if( self.callbacks && self.callbacks.folderClose )
						{
							self.callbacks.folderClose( ppath );
						}
					}
				}
				var eles = self.dom.getElementsByTagName( 'div' );
				for( var a = 0; a < eles.length; a++ )
				{
					eles[a].classList.remove( 'Active' );
				}
				var nam = ele.getElementsByClassName( 'Name' );
				if( nam.length )
				{
					nam[0].classList.add( 'Active' );
				}
			}
			return cancelBubble( e );
		}
		ele.oncontextmenu = function( e )
		{
			var men = cmd = '';
			var cf = false; // create file
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
			var menu = [];
			if( men && cmd )
			{
				menu.push( {
					name: i18n( men ),
					command: cmd,
					data: { path: ppath }
				} );
			}
			if( cmd != 'menuloadfile' )
			{
				menu.push( {
					name: i18n( 'i18n_create_folder' ),
					command: 'createdirectory',
					data: { path: ppath }
				} );
			}
			if( cf ) menu.push( cf );
			ShowContextMenu( i18n( 'i18n_file_menu' ), menu );
			return cancelBubble( e );
		}
	}

	// Just get a list of disks
	if( path == 'Mountlist:' )
	{
		var func = function( flags, callback )
		{
			if( window.Workspace )
			{
				DOS.getDisks( 'Mountlist:', flags, function( response, msg )
				{
					callback( response ? {
						list: msg
					} : false );
				} );
			}
			else
			{
				DOS.getDisks( flags, callback );
			}
		}
		func( { sort: true }, function( msg )
		{
			if( !msg || !msg.list ) return;
			
			function done()
			{
				// Get existing
				var eles = rootElement.childNodes;
				var found = [];
				var foundElements = [];
				for( var a = 0; a < eles.length; a++ )
				{
					var elFound = false;
					for( var b = 0; b < msg.list.length; b++ )
					{
						if( eles[a].id == 'diskitem_' + msg.list[b].Title )
						{
							createOnclickAction( eles[a], msg.list[a].Volume, 'volume', depth + 1 );
							found.push( msg.list[b].Title );
							foundElements.push( eles[a] );
							elFound = true;
						}
					}
					// Deleted element
					if( !elFound && eles[a] != self.headerDisks )
					{
						rootElement.removeChild( eles[a] );
					}
				}
				// Iterate through the resulting list
				for( var a = 0; a < msg.list.length; a++ )
				{
					if( msg.list[a].Volume == 'System:' ) continue;
					if( msg.list[a].Type && msg.list[a].Type == 'header' && !self.bookmarksHeader )
					{
						self.bookmarksHeader = true;
						var d = document.createElement( 'div' );
						d.innerHTML = '<p class="Layout BorderBottom PaddingTop BorderTop PaddingBottom"><strong>' + i18n( 'i18n_bookmarks' ) + ':</strong></p>';
						rootElement.appendChild( d );
						continue;
					}
					var foundItem = false;
					for( var b = 0; b < found.length; b++ )
					{
						if( found[b] == msg.list[a].Title || msg.list[a].Type == 'header' )
						{
							foundItem = foundElements[b];
							break;
						}
					}
					if( !foundItem )
					{
						var d = document.createElement( 'div' );
						d.className = 'DiskItem';
						d.id = 'diskitem_' + msg.list[a].Title;
						d.path = msg.list[a].Volume;
						var nm = document.createElement( 'div' );
						nm.style.paddingLeft = ( depth * 8 ) + 'px';
						nm.className = 'Name IconSmall IconDisk';
						nm.innerHTML = ' ' + msg.list[a].Title;
						d.appendChild( nm );
						if( msg.list[a].Type && msg.list[a].Type == 'bookmark' )
						{
							( function( ls ){
								var ex = document.createElement( 'span' );
								ex.className = 'FloatRight IconButton IconSmall fa-remove';
								ex.onclick = function( e )
								{
									var m = new Module( 'system' );
									m.onExecuted = function( e, d )
									{
										if( e == 'ok' )
										{
											self.clear();
											self.refresh();
										}
										else
										{
											console.log( 'Could not remove bookmark: ', e, d );
										}
									}
									m.execute( 'removebookmark', { name: ls.Path } );
									return cancelBubble( e );
								}
								nm.appendChild( ex );
							} )( msg.list[a] );
						}
						var s = document.createElement( 'div' );
						s.className = 'SubItems';
						d.appendChild( s );
						rootElement.appendChild( d );
						createOnclickAction( d, msg.list[a].Volume, 'volume', depth + 1 );
					}
					// Existing items
					else
					{
						// Only refresh child elements if not open
						if( foundItem.classList.contains( 'Open' ) )
						{
							var s = foundItem.getElementsByClassName( 'SubItems' );
							if( s && s.length )
							{
								self.refresh( msg.list[a].Volume, s[0], false, depth + 1 );
							}
						}
					}
				}
				// Checkers
				var sw = 2;
				for( var a = 0; a < eles.length; a++ )
				{
					sw = sw == 2 ? 1 : 2;
					if( eles[a].className && eles[a].classList.contains( 'DiskItem' ) )
					{
						eles[a].classList.remove( 'sw1' );
						eles[a].classList.remove( 'sw2' );
						eles[a].classList.add( 'sw' + sw );
					}
				}
			}
			
			
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					try
					{
						var js = JSON.parse( d );
						msg.list.push( {
							Title: i18n( 'i18n_bookmarks' ) + ':',
							Type: 'header'
						} );
						for( var a = 0; a < js.length; a++ )
						{
							var ele = {
								Title: js[a].name,
								Type: 'bookmark',
								Path: js[a].path,
								Volume: js[a].path
							};
							msg.list.push( ele );
						}
					}
					catch( e )
					{
					}
					done();
				}
				else
				{
					done();
				}
			}
			m.execute( 'getbookmarks' );
		} );
	}
	// Get sub directories
	else
	{
		// Support both API scope and Workspace scope
		var func = function( path, flags, callback )
		{
			if( window.Workspace )
			{
				DOS.getDirectory( path, flags, function( response, msg )
				{
					callback( response ? {
						list: msg
					} : false );
				} );
			}
			else
			{
				DOS.getDirectory( path, flags, callback );
			}
		}
	
		func( path, { sort: true }, function( msg )
		{
			if( !msg || !msg.list ) return;
			
			// Get existing
			var eles = rootElement.childNodes;
			var found = [];
			var foundElements = [];
			for( var a = 0; a < eles.length; a++ )
			{
				var elFound = false;
				for( var b = 0; b < msg.list.length; b++ )
				{
					if( eles[a].id == 'fileitem_' + msg.list[b].Filename.split( ' ' ).join( '' ) )
					{
						var fn = msg.list[b].Filename;
						if( msg.list[b].Type == 'Directory' )
							fn += '/';
						createOnclickAction( eles[a], path + fn, msg.list[b].Type, depth + 1 );
						found.push( msg.list[b].Filename );
						foundElements.push( eles[a] );
						elFound = true;
					}
				}
				// Deleted item
				if( !elFound )
				{
					rootElement.removeChild( eles[a] );
				}
			}
			//
			for( var a = 0; a < msg.list.length; a++ )
			{
				var foundItem = false;
				if( msg.list[a].Filename.substr( 0, 1 ) == '.' ) continue; // skip hidden files
				for( var b = 0; b < found.length; b++ )
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
						var d = document.createElement( 'div' );
						d.className = msg.list[a].Type == 'Directory' ? 'FolderItem' : 'FileItem';
						var ext = msg.list[a].Filename.split( '.' ).pop().toLowerCase();
						var icon = d.className == 'FolderItem' ? 'IconFolder' : ( 'IconFile ' + ext );
						d.id = 'fileitem_' + msg.list[a].Filename.split( ' ' ).join( '' );
						d.innerHTML = '<div style="padding-left: ' + ( depth * 13 ) + 'px" class="Name IconSmall ' + icon + '"> ' + msg.list[a].Filename + '</div><div class="SubItems"></div>';
						rootElement.appendChild( d );
						var fn = msg.list[a].Filename;
						if( msg.list[a].Type == 'Directory' )
							fn += '/';
						d.path = path + fn;
						createOnclickAction( d, d.path, msg.list[a].Type, depth + 1 );
					}
				}
				else if( foundItem && msg.list[a].Type == 'Directory' )
				{
					// Existing items
					if( foundItem.classList.contains( 'Open' ) )
					{
						var s = foundItem.getElementsByClassName( 'SubItems' );
						if( s && s.length )
						{
							var fn = msg.list[a].Filename;
							if( msg.list[a].Type == 'Directory' )
								fn += '/';
							self.refresh( path + fn, s[0], false, depth + 1 );
						}
					}
				}
			}
			// Checkers
			var sw = 2;
			for( var a = 0; a < eles.length; a++ )
			{
				sw = sw == 2 ? 1 : 2;
				if( eles[a].className && ( eles[a].classList.contains( 'FolderItem' ) || eles[a].classList.contains( 'FileItem' ) ) )
				{
					eles[a].classList.remove( 'sw1' );
					eles[a].classList.remove( 'sw2' );
					eles[a].classList.add( 'sw' + sw );
				}
			}
		} );
	}
};

