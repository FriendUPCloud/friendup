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

// Opens a file dialog connected to an application
Filedialog = function ( mainwindow, triggerfunction, path, type, filename, title )
{
	if ( !triggerfunction ) return;
	if ( !type ) type = 'open';
	
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
	
	var w = new View ( {
		'title' : i18n ( ftitle ),
		'width' : 400, 
		'min-width' : 400,
		'height' : 550, 
		'min-height' : 400,
		'loadAnimation' : true
	} );
	
	this.dialogWindow = w;
	
	w.onClose = function()
	{
		triggerfunction( false );
	}
	
	
	// Default path
	this.path = path ? path : 'Mountlist:';
	if ( typeof ( path ) == 'object' )
		this.path = path.path;
	
	
	// Some default vars
	this.single = true;
	
	if( mainwindow )
		mainwindow.setBlocker ( w );
	
	// Select an element
	w.select = function ( ele )
	{
		var cont = this.getContainer ();
		var eles = cont.getElementsByTagName ( 'div' );
		for ( var a = 0; a < eles.length; a++ )
		{
			if ( eles[a].parentNode != cont )
				continue;
			if ( eles[a] == ele )
			{
				eles[a].isselected = eles[a].isselected ? false : true;
			}
			else if ( !dialog.single && eles[a] != ele )
			{
				eles[a].isselected = false;
			}
		}
		// Second pass, color
		for ( var a = 0; a < eles.length; a++ )
		{
			if ( eles[a].parentNode != cont )
				continue;
			// Remove class
			eles[a].className = eles[a].className.split ( ' Selected' ).join ( '' );
			// Add class on selected
			if ( eles[a].isselected == true ) 	
				eles[a].className += ' Selected';
		}
		if ( dialog.type == 'save' )
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
		if ( ele )
		{
			triggerfunction ( [ ele.obj ] );
			w.close ();
			return;
		}
		var cont = this.getContainer ();
		var eles = cont.getElementsByTagName ( 'div' );
		var out = [];
		for ( var a = 0; a < eles.length; a++ )
		{
			if ( eles[a].parentNode != cont ) continue;
			if ( eles[a].isselected )
				out.push ( eles[a].obj );
		}
		if ( out.length )
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
				console.log( 'Nothing selected...' );
			}
		}
		w.close ();
	}
	
	// Refresh dir listing
	w.refreshView = function()
	{
		// Get dir listing
		var fld = new Object();
		fld.Path = dialog.path;
		fld.Type = 'Meta';
		
		// Update path
		if( dialog.path.substr( dialog.path.length - 1, 1 ) != '/' &&
			dialog.path.substr( dialog.path.length - 1, 1 ) != ':' )
			dialog.path += '/';
		
		if( !dialog.prev ) dialog.prev = dialog.path;
	
		if( !dialog.path ) dialog.path = 'Mountlist:';
		
		// List mountlist
		if( dialog.path == 'Mountlist:' )
		{
			Doors.getMountlist( function( data )
			{ 
				w.redrawFilelist( data ) 
			} );
		}
		// Get the correct subfolders and files
		else
		{
			var m = Doors.getDoorByPath( dialog.path );
			
			// Handle weird dialog paths..
			if( !m && dialog.path != 'Mountlist:' ) 
			{
				if( dialog.prev )
				{
					dialog.path = dialog.prev;
					dialog.prev = 'Mountlist:';
				}
				else dialog.path = 'Mountlist:';
				return w.refreshView();
			}
			
			var func = function( data )
			{	
				w.inpu.value = dialog.path.split( '%20' ).join( ' ' ).split( ':/' ).join( ':' );
				var container = w.getContainer();
				dialog.selecter = [];
				container.innerHTML = '';
				if( data )
				{
					w.redrawFilelist( data );
				}
				else
				{
					// Must be the wrong filelist!
					if( dialog.prev )
					{
						dialog.path = dialog.prev;
						dialog.prev = 'Mountlist:';
						w.refreshView();
					}
				}
			}
			
			// TODO: Merge (use global Shell)!
			// Doors
			if( m.getIcons )
			{
				m.path = dialog.path; // Set this..
				m.getIcons( false, func );
			}
			// Dormants
			else if( m.getDirectory )
			{
				m.getDirectory( dialog.path, func );
			}
		}
		
		this.inpu.value = dialog.path;
	}
	
	// Do the actual redrawing of the file list
	w.redrawFilelist = function( objs )
	{
		if( objs )
		{
			var container = w.getContainer();
			container.innerHTML = '';
			
			for( var a = 0; a < objs.length; a++ )
			{
				var d = document.createElement( 'div' );
				if( !objs[a].Title && objs[a].Filename )
					objs[a].Title = objs[a].Filename;
				d.filename = objs[a].Title;
				
				// TODO: Decide, metatype or type!!
				objs[a].Title += objs[a].Type.toLowerCase() == 'directory' ? '/' : '';
				
				// Determine the correct file type and info
				var col2 = objs[a].Type.toLowerCase() == 'directory' ? i18n( 'i18n_directory' ) :
					( objs[a].Type == 'door' ? i18n( 'i18n_door' ) : ( objs[a].Filesize ? objs[a].Filesize : '' ) );
				var col3 = objs[a].Flags ? objs[a].Flags : '';
				
				d.className = 'FullWidth Padding';
				d.innerHTML = '<div class="HRow">' +
					'<div class="Filename HContent55 FloatLeft Ellipsis">'   + objs[a].Title    + '</div>' +
					'<div class="Filesize HContent25 FloatLeft TextRight">'  + col2 + '</div>' + 
					'<div class="Flags HContent20 FloatLeft TextRight">' + col3 + '</div>' +
					'<br style="clear: both"/>' +
					'</div>';
				d.path = objs[a].Path ? objs[a].Path : objs[a].Title;
				d.style.cursor = document.all ? 'hand' : 'pointer';
				d.style.borderBottom = a == objs.length - 1 ? '' : '1px solid #c0c0c0';
				d.onmouseover = function() { this.style.background = '#c0c0c0'; };
				d.onmouseout = function() { this.style.background = ''; };
				d.obj = objs[a];
				if ( objs[a].Type.toLowerCase() == 'file' )
				{
					d.onclick = function()
					{
						w.select( this );
					}
					d.ondblclick = function()
					{
						w.choose( this );
					}
				}
				else
				{
					d.onclick = function()
					{
						dialog.prev = dialog.path;
						dialog.path = this.path;
						w.refreshView();
					}
				}
			
				container.appendChild( d );
			}
		}
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
		if( mainwindow )
		{
			mainwindow.getWindowElement ().blocker = false; 
			_ActivateWindow ( mainwindow.getWindowElement ().parentNode ); 
		}
		// Close bookmarks if it's there..
		if( w.books )
		{
			w.books.close();
			w.books = false;
		}
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
		w.setContent ( d );
		
		// Insert filename (if save)
		if( type == 'save' )
		{
			var inps = w.getElementsByTagName ( 'input' );
			for( var a = 0; a < inps.length; a++ )
			{
				if( inps[a].getAttribute ( 'name' ) == 'filename' )
				{
					if( filename )
					{
						inps[a].value = filename;
					}
					else if( typeof( path ) == 'object' )
						inps[a].value = path.filename;
					else 
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
		var prev = false;
		var inpu = false;
		var up   = false;
		var refr = false;
		var open = false;
		var save = false;
		var cacl = false;
		var book = false;
		var ds = w.getElementsByTagName ( 'button' );
		for( var a = 0; a < ds.length; a++ )
		{
			if( ds[a].getAttribute ( 'name' ) )
			{
				switch( ds[a].getAttribute ( 'name' ) )
				{
					case 'prev':      prev = ds[a]; break;
					case 'up':        up   = ds[a]; break;		
					case 'refresh':   refr = ds[a]; break;
					case 'open':      open = ds[a]; break;
					case 'save':      save = ds[a]; break;
					case 'cancel':    cacl = ds[a]; break;
					case 'bookmarks': book = ds[a]; break;
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
		// Go to previous directory. . . . . . . . . . . . . . . . . . . . . . .
		if( prev )
		{
			prev.onclick = function () 
			{
				if ( dialog.prev )
				{
					dialog.path = dialog.prev;
					w.refreshView ();
				}
			}
		}
		// Parent directory. . . . . . . . . . . . . . . . . . . . . . . . . . .
		if( up )
		{
			up.onclick = function ()
			{
				var diap = dialog.path;
				
				var lstl = diap.substr( diap.length - 1, 1 );
				if( lstl != ':' )
				{
					// Strip last forwardslash
					if( lstl == '/' )
						diap = diap.substr( 0, diap.length - 1 );
				}
				else
				{
					dialog.prev = dialog.path;
					dialog.path = 'Mountlist:';
					return w.refreshView();
				}
				
				// Remove a joint
				var now = diap;
				if( now.indexOf( '/' ) > 0 )
				{
					diap = diap.split ( '/' );
					diap.pop ();
					diap = diap.join ( '/' );
				}
				else
				{
					diap = diap.split( ':' )[0] + ':';
				}
				
				// Give new path and keep the old one
				dialog.prev = dialog.path;
				dialog.path = diap;
				
				// Refresh
				w.refreshView ();
			}
		}
		// Refresh directory . . . . . . . . . . . . . . . . . . . . . . . . . .
		if ( refr )
		{
			refr.onclick = function ()
			{
				w.refreshView ();
			}
		}
		// Open selected file. . . . . . . . . . . . . . . . . . . . . . . . . .
		if ( open )
		{
			open.onclick = function()
			{
				w.choose();
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
					w.refreshView ();
				}
			}
			inpu.value = dialog.path;
		}
		// Clicking on the bookmarks icon
		if( book )
		{
			w.book = book;
			book.onclick = function()
			{
				var bookmarkArea = false;
				// TODO: Make bookmarks pop to front
				if( w.books ) return;
				var bw = new View( {
					title: i18n( 'i18n_bookmarks' ),
					width: 300,
					height: 300
				} );
				w.books = bw;
				bw.onClose = function()
				{
					w.books = false;
				}
				var f = new File( 'System:templates/filedialog_bookmarks.html' );
				f.replacements = {
					'Add': i18n( 'i18n_bookmarks_add' ),
					'Select': i18n( 'i18n_bookmarks_select' ),
					'Cancel': i18n( 'i18n_bookmarks_cancel' )
				};
				f.onLoad = function( data )
				{
					bw.setContent( data );
					
					var buttons = bw.getElementsByTagName( 'button' );
					var add, select, canc;
					for( var a = 0; a < buttons.length; a++ )
					{
						if( buttons[a].getAttribute( 'name' ) == 'addbookmark' )
							add = buttons[a];
						else if( buttons[a].getAttribute( 'name' ) == 'close' )
							canc = buttons[a]; 
						else if( buttons[a].getAttribute( 'name' ) == 'select' )
							select = buttons[a];
					}
					var divs = bw.getElementsByTagName( 'div' );
					for( var a = 0; a < divs.length; a++ )
					{
						if( divs[a].classList.contains( 'BookmarkArea' ) )
						{
							bookmarkArea = divs[a];
						}
					}
					
					// Add the current file dialog path as a bookmark!
					add.onclick = function()
					{
						var nm = dialog.path.split( ':' )[0];
						var rl = dialog.path;
						var m = new Module( 'system' );
						m.onExecuted = function( e, d )
						{
							if( e != 'ok' ) return;
							bw.refresh();
						}
						m.execute( 'addbookmark', { path: rl, name: nm } );
					}
					
					select.onclick = function()
					{
						if( !bookmarkArea ) return;
						var eles = bookmarkArea.getElementsByTagName( 'div' );
						for( var a = 0; a < eles.length; a++ )
						{
							if( eles[a].getAttribute( 'active' ) == 'active' )
							{
								eles[a].ondblclick();
								return;
							}
						}
					}
					
					canc.onclick = function()
					{
						bw.close();
					}
					
					bw.refresh();
				}
				f.load();
				
				// Refresh bookmark window with bookmarks
				bw.refresh = function()
				{
					var m = new Module( 'system' );
					m.onExecuted = function( e, d )
					{
						if( e != 'ok' )
						{
							bw.setBookmarkContents( '<h2>Empty view</h2><p>You have no bookmarks.</p>' );
						}
						else
						{
							// Do it!
							var eles = JSON.parse( d );
							var html = '<div class="List">';
							for( var b = 0; b < eles.length; b++ )
							{
								var sw = b % 2 + 1;
								html += '<div class="BorderBottom Padding HRow Padding sw' + sw + '" path="' + eles[b].path + '">' + eles[b].name + ' (' + eles[b].path + ')</div>';
							}
							html += '</div>';
							bw.setBookmarkContents( html );
						}
					}
					m.execute( 'getbookmarks' );
				}
				
				// Set content on bookmark window
				bw.setBookmarkContents = function( content )
				{
					if( !bookmarkArea ) return;
					bookmarkArea.innerHTML = content;
					var eles = bookmarkArea.getElementsByTagName( 'div' );
					for( var a = 0; a < eles.length; a++ )
					{
						if( eles[a].getAttribute( 'path' ) )
						{
							eles[a].ondblclick = function()
							{
								var url = this.getAttribute( 'path' );
								bw.close();
								dialog.path = url;
								w.refreshView();
							}
							eles[a].onclick = function()
							{
								var e = 0;
								for( var c = 0; c < eles.length; c++ )
								{
									if( !eles[c].getAttribute( 'path' ) ) continue;
									var sw = 'sw' + ( e++ % 2 + 1 );
									if( eles[c] == this )
									{
										eles[c].classList.remove( sw );
										eles[c].setAttribute( 'active', 'active' );
										eles[c].classList.add( 'BackgroundLists' );
										eles[c].classList.add( 'ColorLists' );
									}
									else 
									{
										eles[c].classList.add( sw );
										eles[c].setAttribute( 'active', '' );
										eles[c].classList.remove( 'BackgroundLists' );
										eles[c].classList.remove( 'ColorLists' );
									}
									d++;
								}
							}
							eles[a].style.cursor = 'pointer';
						}
					}
				}
			}
		}
		
		// Refresh it
		w.refreshView();
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

