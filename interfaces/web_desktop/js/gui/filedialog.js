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

	var fl = {
		'title' : i18n ( ftitle ),
		'width' : document.body.offsetWidth > 600 ? 600 : 400,
		'min-width' : 400,
		'height' : 550,
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

	w.onClose = function()
	{
		if( w.md ) w.md.close();
	}

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
		var cont = this.getContainer ();
		var eles = cont.getElementsByTagName ( 'div' );
		var out = [];
		for( var a = 0; a < eles.length; a++ )
		{
			if ( eles[a].parentNode != cont ) continue;
			if ( eles[a].isselected )
				out.push ( eles[a].obj );
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
		// Check bookmarks etc
		if( dialog.sidebar )
		{
			dialog.sidebar.refresh = function()
			{
				w.refreshView();
			}
			if( !dialog.sidebar.id )
			{
				dialog.sidebar.id = window.MD5( ( new Date() ).getTime() + '' + Math.random() );
				dialog.sidebar.refreshView = function()
				{
					w.refreshView();
				}
				dialog.sidebar.hasPath = function()
				{
					var inp = this.parentNode.getElementsByTagName( 'input' );
					var found = false;
					for( var a = 0; a < inp.length; a++ )
					{
						if( inp[a].name && inp[a].name == 'Path' )
						{
							found = inp[a];
							break;
						}
					}
					if( !found ) return;
					if( found.value == 'Mountlist:' || found.value == 'System:' )
					{
						Alert( 'Error uploading', 'Please choose a disk with write privileges.' );
						return false;
					}
					ge( 'UploadDialogPath' + dialog.sidebar.id ).action = '/system.library/file/upload/?sessionid=' + Workspace.sessionId + '&path=' + found.value;
					return true;
				}
			}
			var uploads = '<div class="PaddingLeft PaddingRight"><p class="Layout" style="line-height: 50px"><strong>' + i18n( 'i18n_upload_a_file' ) + ':</strong></p></div>' +
				'<div class="PaddingLeft PaddingRight Relative" style="overflow-x: hidden; width: 100%; height: 50px"><button class="Button IconSmall fa-cloud-upload" style="position: absolute; pointer-events: none">' + i18n( 'i18n_choose_file' ) + '</button><form id="UploadDialogPath' + dialog.sidebar.id + '" action="/system.library/file/upload/?sessionid=' + Workspace.sessionId + '&path=Home:" method="post" enctype="multipart/form-data" target="diagifr" onload="ge( \'' + dialog.sidebar.id + '\' ).refresh()"><input name="file" style="position: absolute; opacity: 0.0" type="file" onchange="if( ge( \'' + dialog.sidebar.id + '\' ).hasPath() ){ submit(); this.value = \'\'; }"/></form><iframe name="diagifr" style="opacity: 0; pointer-events; none; width: 10px; height: 10px; position: absolute"></iframe></div>';
			
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e != 'ok' )
				{
					var str = '<div class="VContentTop PaddingLeft PaddingRight BorderBottom" style="height: 50px"><p class="Layout" style="line-height: 50px"><strong>' + i18n( 'i18n_bookmarks' ) + ':</strong></p></div>';
					str +=    '<div class="VContentBottom ScrollArea" style="top: 50px"><ul class="List Negative"><li>' + i18n( 'i18n_no_bookmarks' ) + '</li></ul>' + uploads + '</div>';
					dialog.sidebar.innerHTML = str;
					return;
				}

				var str = '<div class="VContentTop PaddingLeft PaddingRight BorderBottom" style="height: 50px"><p class="Layout" style="line-height: 50px"><strong>' + i18n( 'i18n_bookmarks' ) + ':</strong></p></div>';

				var list = JSON.parse( d );
				var listr = '';
				for( var a = 0; a < list.length; a++ )
				{
					listr += '<li><span class="MousePointer" path="' + list[a].path + '">' + list[a].name + '</span></li>';
				}

				str +=    '<div class="VContentBottom ScrollArea" style="top: 50px"><ul class="List Negative">' + 
					listr + '</ul>' + uploads + '</div>';
				dialog.sidebar.innerHTML = str;

				var spans = dialog.sidebar.getElementsByTagName( 'span' );
				for( var a = 0; a < spans.length; a++ )
				{
					if( spans[a].getAttribute( 'path' ) )
					{
						spans[a].onclick = function()
						{
							dialog.prev = dialog.path;
							dialog.path = this.getAttribute( 'path' );
							w.refreshView();
						}
					}
				}
			}
			m.execute( 'getbookmarks' );
		}

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
			Workspace.getMountlist( function( data )
			{
				w.redrawFilelist( data )
			} );
		}
		// Get the correct subfolders and files
		else
		{
			var m = Workspace.getDoorByPath( dialog.path );

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
				m.getIcons( false, func, { details: true } );
			}
			// Dormants
			else if( m.getDirectory )
			{
				m.getDirectory( dialog.path, func, { details: true } );
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

			// By default, don't show hidden files
			var hiddenFilesSkip = true;

			// TODO: Lets try to make directories first optional
			var dirs = [];
			var files = [];
			for( var a = 0; a < objs.length; a++ )
			{
				if( objs[a].Type == 'Directory' ) 
					dirs.push( objs[a] );
				else 
					files.push( objs[a] );
			}
			objs = dirs.concat( files );
			var sw = 2;

			for( var a = 0; a < objs.length; a++ )
			{
				// Skip non-disks on mountlist level
				if( dialog.path == 'Mountlist:' && !( objs[a].Type == 'Door' || objs[a].Type == 'Dormant' ) ) continue;
				
				sw = sw == 1 ? 2 : 1;
				var d = document.createElement( 'div' );
				if( !objs[a].Title && objs[a].Filename )
					objs[a].Title = objs[a].Filename;
				d.filename = objs[a].Title;

				// TODO: Decide, metatype or type!!
				if( objs[a].Title.charAt( objs[a].Title.length - 1 ) != '/' )
					objs[a].Title += objs[a].Type.toLowerCase() == 'directory' ? '/' : '';

				// Determine the correct file type and info
				var col2 = objs[a].Type.toLowerCase() == 'directory' ? i18n( 'i18n_directory' ) :
					( objs[a].Type == 'door' ? i18n( 'i18n_door' ) : ( objs[a].Filesize ? humanFilesize( objs[a].Filesize ) : '' ) );

				var col3 = '-rwed';
				if( objs[a].Permissions )
				{
					var p = objs[a].Permissions.split( ',' );
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
					col3 = perms.join( '' ).toLowerCase();
				}

				if( hiddenFilesSkip && objs[a].Title )
				{
					if( objs[a].Title.substr( 0, 1 ) == '.' ) continue;
				}

				var align = 'TextRight';
				if( objs[a].Type.toLowerCase() == 'directory' )
					align = 'TextLeft';

				// Make sure we have title
				var title = objs[a].Title;

				d.className = 'FullWidth MousePointer BorderBottom sw' + sw;
				d.innerHTML = '<div class="HRow">' +
					'<div class="Padding BorderRight Filename HContent55 FloatLeft Ellipsis">'   + title + '</div>' +
					'<div class="Padding BorderRight Filesize HContent25 FloatLeft ' + align + '">'  + ( col2.length ? col2 : '&nbsp;' ) + '</div>' +
					'<div class="Padding Flags HContent20 FloatLeft TextCenter">' + ( col3.length ? col3 : '&nbsp;' ) + '</div>' +
					'<br style="clear: both"/>' +
					'</div>';
				d.path = objs[a].Path ? objs[a].Path : objs[a].Title;
				d.onmouseover = function(){ this.classList.add( 'Selected' ); };
				d.onmouseout = function()
				{
					if( !this.isselected )
						this.classList.remove( 'Selected' );
				};
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
		if( mainview )
		{
			mainview.getWindowElement().blocker = false;
			_ActivateWindow( mainview.getWindowElement ().parentNode );
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
		w.setContent( d );

		// Get sidebar element
		var eles = w.getElementsByTagName( 'div' );
		for( var u = 0; u < eles.length; u++ )
		{
			if( !eles[u].classList ) continue;
			if( eles[u].classList.contains( 'Sidebar' ) )
			{
				dialog.sidebar = eles[u];
			}
			else if( eles[u].classList.contains( 'List-view' ) )
			{
				dialog.listview = eles[u];
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
		var prev = false;
		var inpu = false;
		var up   = false;
		var refr = false;
		var open = false;
		var save = false;
		var cacl = false;
		var book = false;
		var fold = false;
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
					case 'folder':    fold = ds[a]; break;
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
		// Clicking on the new folder icon
		if( fold )
		{
			w.fold = fold;
			fold.onclick = function()
			{
				if( self.path == 'Mountlist:' )
				{
					return Alert( i18n( 'i18n_illegal_path' ), i18n( 'i18n_illegal_fld_mountlist' ) );
				}
				else if( w.md && w.md.content )
				{
					_ActivateWindow( fold.md.content.parentNode );
					return;
				}
				else
				{
					if( w.md && w.md.close ) w.md.close();
					var f = new View( {
						title: i18n( 'i18n_create_container' ),
						width: 300,
						height: 100
					} );
					w.md = f;
					f.onClose = function()
					{
						w.md = null;
					}
					var ff = new File( 'System:templates/makedir.html' );
					ff.i18n();
					ff.onLoad = function( data )
					{
						f.setContent( data );
						var makedir = null;
						var inp = null;
						var els = f.content.getElementsByTagName( '*' );
						for( var a = 0; a < els.length; a++ )
						{
							if( !els[a].classList ) continue;
							if( els[a].classList.contains( 'makedir' ) )
							{
								makedir = els[a];
							}
							else if( els[a].name && els[a].name == 'Dirname' )
							{
								inp = els[a];
							}
						}
						if( makedir && inp )
						{
							makedir.onclick = function( e )
							{
								if( inp.value.length && dialog.path )
								{
									var door = new Door( dialog.path );
									door.dosAction( 'makedir', { path: dialog.path + inp.value }, function()
									{
										w.md.close();
										w.refreshView();
									} );
								}
							}
							inp.focus();
							inp.onkeydown = function( e )
							{
								var w = e.which ? e.which : e.keyCode;
								if( w == 13 )
								{
									makedir.onclick();
									return cancelBubble( e );
								}
							}
						}
					}
					ff.load();
				}
			}
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
					width: 340,
					height: 340,
					screen: mainview.getFlag( 'screen' )
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
					'Close': i18n( 'i18n_bookmarks_close' ),
					'Remove': i18n( 'i18n_bookmarks_remove' )
				};
				f.onLoad = function( data )
				{
					bw.setContent( data );

					var buttons = bw.getElementsByTagName( 'button' );
					var add, select, canc, remove;
					for( var a = 0; a < buttons.length; a++ )
					{
						if( buttons[a].getAttribute( 'name' ) == 'addbookmark' )
							add = buttons[a];
						else if( buttons[a].getAttribute( 'name' ) == 'close' )
							canc = buttons[a];
						else if( buttons[a].getAttribute( 'name' ) == 'select' )
							select = buttons[a];
						else if( buttons[a].getAttribute( 'name' ) == 'removebookmark' )
							remove = buttons[a];
					}
					var divs = bw.getElementsByTagName( 'div' );
					for( var a = 0; a < divs.length; a++ )
					{
						if( divs[a].classList.contains( 'BookmarkArea' ) )
						{
							bookmarkArea = divs[a];
						}
					}

					// focus on input
					var inp = bw.getElementsByTagName( 'input' );
					if( inp && inp[0] ) inp[0].focus();

					// Add the current file dialog path as a bookmark!
					add.onclick = function()
					{
						var nm = dialog.path.split( ':' )[1];
						if( nm.indexOf( '/' ) > 0 )
						{
							// Trailing!
							if( nm.substr( nm.length - 1, 1 ) == '/' )
								nm = nm.substr( 0, nm.length - 1 );
							nm = nm.split( '/' );
							nm = nm[nm.length-1];
						}
						var rl = dialog.path;
						var m = new Module( 'system' );
						m.onExecuted = function( e, d )
						{
							if( e != 'ok' ) return;
							bw.refresh();
							w.refreshView();
						}
						m.execute( 'addbookmark', { path: rl, name: nm } );
					}

					remove.onclick = function()
					{
						if( !bookmarkArea ) return;
						var eles = bookmarkArea.getElementsByTagName( 'div' );
						for( var a = 0; a < eles.length; a++ )
						{
							if( eles[a].getAttribute( 'active' ) == 'active' )
							{
								var m = new Module( 'system' );
								m.onExecuted = function( e, d )
								{
									bw.refresh();
									w.refreshView();
								}
								// TODO: This can crash on the ( - find a better way
								m.execute( 'removebookmark', { path: eles[a].getAttribute( 'name' ) } );
								return;
							}
						}
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
							bw.setBookmarkContents( '<div class="Padding"><h2>' + i18n( 'i18n_empty_view' ) + '</h2><p>' + i18n( 'i18n_no_bookmarks' ) + '.</p></div>' );
						}
						else
						{
							// Do it!
							var eles = JSON.parse( d );
							var html = '<div class="List">';
							for( var b = 0; b < eles.length; b++ )
							{
								var sw = b % 2 + 1;
								html += '<div class="Ellipsis BorderBottom Padding HRow Padding sw' + sw + '" name="' + eles[b].name + '" path="' + eles[b].path + '">' + eles[b].name + ' (' + eles[b].path + ')</div>';
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
										eles[c].classList.add( 'Selected' );
									}
									else
									{
										eles[c].classList.add( sw );
										eles[c].setAttribute( 'active', '' );
										eles[c].classList.remove( 'Selected' );
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
		
		_ActivateWindow( w._window.parentNode );
		_WindowToFront( w._window.parentNode );
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
