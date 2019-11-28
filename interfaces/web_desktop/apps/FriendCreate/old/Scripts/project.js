/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg, iface )
{
	this.project = {
		ProjectName: '',
		Author: '',
		Version: '',
		Category: '',
		Description: '',
		Files: [],
		Permissions: [],
		Libraries: []
	};
	
	refreshCategories();
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'setprojectfiles':
			this.project.Files = [];
			for( var a in msg.files )
			{
				this.project.Files.push( msg.files[a] );
			}
			// Clear it!
			redrawFiles();
			
			break;
		case 'setprojectpermissions':
			// Clear them!
			ge( 'tPermissions' ).innerHTML = '';
			for( var a in msg.permissions )
			{
				var o = document.createElement( 'option' );
				o.value = msg.permissions[a].PermissionPlain;
				o.innerHTML = msg.permissions[a].PermissionsText;
				ge( 'tPermissions' ).appendChild( o );
			}
			break;
		case 'setprojectlibraries':
			// Clear them!
			
			
			break;
		case 'setpermission':
			if( !this.project.Permissions ) this.project.Permissions = [];
			if( msg.index < 0 )
			{
				this.project.Permissions.push( {
					Permission: msg.permission,
					Name:       msg.permname,
					Options:    msg.options
				} );
			}
			else
			{
				this.project.Permissions[msg.index] = {
					Permission: msg.permission,
					Name:       msg.permname,
					Options:    msg.options
				};
			}
			Application.pa.close();
			redrawPermissions();
			break;
		// Set info from previous
		case 'projectinfo':
			if( msg.filename ) this.projectFilename = msg.filename;
			
			for( var a in msg.data )
			{
				this.project[a] = msg.data[a];
				if( a == 'Permissions' && !msg.data['ProjectName'] )
				{
					this.project.Permissions = [
						{
							Permission: 'Module',
							Name:       'system',
							Options:    ''
						},
						{
							Permission: 'Module',
							Name:       'files',
							Options:    ''
						}
					];
				}
				switch( a )
				{
					case 'ProjectName':
						ge( 'tProjectName' ).value = msg.data[a];
						break;
					case 'Author':
						ge( 'tAuthor' ).value = msg.data[a];
						break;
					case 'Category':
						refreshCategories( msg.data[a] );
						break;
					case 'Version':
						ge( 'tVersion' ).value = msg.data[a];
						break;
					case 'Description':
						ge( 'tDescription' ).value = msg.data[a];
						break;
				}
			}
			
			// Redraw more complex datasets
			redrawPermissions();
			redrawFiles();
			redrawLibraries();
			redrawScreenshots();
			break;
	}
}

function refreshCategories( value )
{
	var cats = [
		'Office', 'Games', 'Demonstration', 'Internet', 'Graphics', 'Audio',
		'Programming', 'System', 'Educational', 'Tools'
	];
	var sel = ge( 'tCategory' );
	sel.innerHTML = '';
	for( var a = 0; a < cats.length; a++ )
	{
		var o = document.createElement( 'option' );
		o.value = cats[a];
		if( value && value == o.value )
			o.selected = 'selected';
		o.innerHTML = cats[a];
		sel.appendChild( o );
	}
}

function closewin()
{
	Application.sendMessage( { command: 'project_closewin' } );
}

function setupLibraryHTML( command, data )
{
	var eles = ge( 'LibrariesContainer' ).getElementsByTagName( 'div' );
	
	for( var a = 0; a < eles.length; a++ )
	{
		if( !eles[a].getAttribute( 'library' ) )
			continue;
		
		// If we are rendering without action
		if( !command )
		{
			eles[a].index = a;
			eles[a].onclick = function( e )
			{
				setupLibraryHTML( 'click', this.index );
				return cancelBubble( e );
			}
		}
		// Check actions
		else
		{
			if( command == 'click' )
			{
				if( a == data )
				{
					if( eles[a].className.indexOf( 'Active' ) >= 0 )
					{
						eles[a].classList.remove( 'Active' );
					}
					else 
					{
						eles[a].classList.add( 'Active' );
					}
				}
			}
		}
	}
	
	// Collect active libraries
	var items = [];
	for( var a = 0; a < eles.length; a++ )
	{
		if( !eles[a].getAttribute( 'library' ) )
			continue;
		
		if( eles[a].className.indexOf( 'Active' ) >= 0 )
		{
			var o = {
				'Folder'   : eles[a].getAttribute( 'folder' ),
				'Name'     : eles[a].getAttribute( 'library' ),
				'Init'     : eles[a].getAttribute( 'init' ),
				'Version'  : eles[a].getAttribute( 'version' ),
				'Category' : eles[a].getAttribute( 'category' )
			};
			items.push( o );
		}
	}
	
	ge( 'Libraries' ).value = JSON.stringify( items );
}

/* Permission related ------------------------------------------------------- */

function addPrivileges()
{
	if( Application.pa )
	{
		Application.pa.activate();
		return;
	}
	
	var v = new View( {
		title: 'Add permission',
		width: 320,
		height: 130
	} );
	
	Application.pa = v;
	
	v.onClose = function()
	{
		Application.pa = false;
	}
	
	var f = new File( 'Progdir:Templates/permission.html' );
	f.onLoad = function( data )
	{
		v.setContent( data, function()
		{
			
		} );
	}
	f.i18n();
	f.load();
}

function removePrivilege()
{
	var f = [];
	var eles = ge( 'tPermissions' ).getElementsByTagName( 'option' );
	for( var a = 0; a < eles.length; a++ )
	{
		if( eles[a].selected )
		{
			for( var b = 0; b < Application.project.Permissions.length; b++ )
			{
				var p = Application.project.Permissions[b];
				var pr = p.Permission + ' ' + p.Name + ( p.Options ? ( ' (' + p.Options + ')' ) : '' );
				if( pr != eles[a].innerHTML )
				{
					f.push( Application.project.Permissions[b] );
				}
			}
			Application.project.Permissions = f;
		}
	}
	redrawPermissions();
}

function redrawPermissions()
{
	ge( 'tPermissions' ).innerHTML = '';
	for( var a in Application.project.Permissions )
	{
		var p = Application.project.Permissions[a];
		var o = document.createElement( 'option' );
		o.value = JSON.stringify( p );
		o.innerHTML = p.Permission + ' ' + p.Name + ( p.Options ? ( ' (' + p.Options + ')' ) : '' );
		ge( 'tPermissions' ).appendChild( o );
	}
}

/* Filelist related --------------------------------------------------------- */

function addFiles()
{
	Application.sendMessage( { command: 'project_addfiles' } );
}

function removeFile()
{
	var eles = ge( 'tFiles' ).getElementsByTagName( 'option' );
	for( var a = 0; a < eles.length; a++ )
	{
		if( eles[a].selected )
		{
			// Clean out
			var f = [];
			for( var b = 0; b < Application.project.Files.length; b++ )
			{
				if( Application.project.Files[b].Path != eles[a].innerHTML )
				{
					f.push( Application.project.Files[b] );
				}
			}
			Application.project.Files = f;
		}
	}
	Application.sendMessage( {
		command: 'update_project_files',
		files: Application.project.Files
	} );
	redrawFiles();
}

function redrawFiles()
{
	ge( 'tFiles' ).innerHTML = '';
	// Repopulate it!
	var fl = Application.project.Files;
	for( var a in fl )
	{
		var o = document.createElement( 'option' );
		o.value = fl[a].Path;
		o.innerHTML = fl[a].Path;
		ge( 'tFiles' ).appendChild( o );
	}
}

/* Library related ---------------------------------------------------------- */

function redrawLibraries()
{
	var j = new cAjax();
	j.open( 'GET', '/repository/index.json', true, false );
	j.onload = function()
	{
		var d = JSON.parse( this.responseText() );
		if( !d ) ge( 'Libraries' ) = '';
		
		var l = '';
		
		for( var a = 0; a < d.Libraries.length; a++ )
		{
			var li = d.Libraries[a];
			
			// Validate!
			if( !li.Init ) continue;
			
			var ch = '';
			for( var x = 0; x < Application.project.Libraries.length; x++ )
			{
				var apl = Application.project.Libraries[x];
				if( apl.Name == li.Name && apl.Version == li.Version )
				{
					ch = ' Active';
					break;
				}
			}
			
			l += '<div class="Package' + ch + '" library="' + li.Name + '" folder="' + li.Location + '" version="' + li.Version + '" init="' + li.Init + '">\
					<div class="Image ' + li.Name.split( /\s/i ).join( '' ) + '" style="background-image: url(\'/' + li.Icon + '\')">\
					</div>\
					<div class="Label">\
						' + li.Name + ' ' + li.Version + '<div class="Checkbox"></div>\
					</div>\
				</div>';
		}
		ge( 'LibrariesContainer' ).innerHTML = l;
		setupLibraryHTML();
	}
	j.send();
}


// Save the project
function saveProject()
{
	// Get files list
	var f = ge( 'tFiles' ).getElementsByTagName( 'option' );
	var files = [];
	for( var a = 0; a < f.length; a++ )
	{
		files.push( f[a].value );
	}
	ge( 'Files' ).value = JSON.stringify( files );
	
	var o = {
		ProjectName: ge( 'tProjectName' ).value,
		Author:      ge( 'tAuthor' ).value,
		Version:     ge( 'tVersion' ).value,
		Category:    ge( 'tCategory' ).value,
		Description: ge( 'tDescription' ).value,
		Permissions: Application.project.Permissions,
		Files:       Application.project.Files,
		Screenshots: Application.project.Screenshots,
		Libraries:   ge( 'Libraries' ).value ? 
		             JSON.parse( ge( 'Libraries' ).value ) : []
	};
	Application.sendMessage( { command: 'project_save', data: o, filename: Application.projectFilename } );
}

/* Screenshot related ------------------------------------------------------- */

function removeScreenshot( ind )
{
	Confirm( i18n( 'i18n_sure_remove' ), i18n( 'i18n_sure_remove_desc' ), function( d )
	{
		if( d.data == true )
		{
			var out = [];
			var scr = Application.project.Screenshots;
			for( var a = 0; a < scr.length; a++ )
			{
				if( a+1 != ind )
					out.push( scr[a] );
			}
			Application.project.Screenshots = out;
			redrawScreenshots();
		}
	} );
}

function redrawScreenshots()
{
	if( !Application.project.Screenshots )
		return;
	
	var scr = Application.project.Screenshots;
	
	var str = '';
	
	for( var a = 0; a < scr.length; a++ )
	{
		str += '<div class="thumb" onclick="removeScreenshot(\'' + (a+1) + '\')" style="background-image: url(' + getImageUrl( scr[a] ) + ')"></div>';
	}
	
	ge( 'Screenshots' ).innerHTML = str;
	
}

// Add a screenshot
function addScreenshot()
{
	var opts = {
		type: 'open',
		title: i18n( 'i18n_pick_screenshot' ),
		triggerFunction: function( data )
		{
			if( !Application.project.Screenshots )
				Application.project.Screenshots = [];
				
			for( var a = 0; a < data.length; a++ )
			{
				var ext = data[a].Path.split( '.' );
				ext = ext[ext.length-1];
				switch( ext.toLowerCase() )
				{
					case 'jpg':
					case 'png':
					case 'jpeg':
						Application.project.Screenshots.push( data[a].Path );
						break;
					default:
						continue;
				}
			}
			redrawScreenshots();
		}
	};

	var f = new Filedialog( opts );
}


// Just a simple GUI list
// Element format:
// [ { title: "My title", onclick: function, remove: function }, {}, ... ]
var SimpleList = function( parentNode, elements )
{
	if( !parentNode ) return null;
	var d = document.createElement( 'div' );
	d.className = 'FriendSimpleList Borders BackgroundLists ColorLists';
	parentNode.appendChild( d );
	
	this.node = d;
	this.idPool = {};
	
	this.setItems( elements );
}

SimpleList.prototype.setItems = function( elements )
{
	this.elements = elements ? elements : [];
	for( var a = 0; a < this.elements.length; a++ )
	{
		// Generate a uniqueid
		if( !this.elements[ a ].id )
		{
			var uid;
			do
			{
				uid = ( new Date() ).getTime() + '_' + ( Math.random() * 999 ) + '_' + ( Math.random() * 999 ) + '_' + ( Math.random() * 999 );
			}
			while( this.idPool[ uid ] );
			this.elements[ a ].id = uid;
		}
	}
	this.refresh();
}

// Move an element up or down and refresh
SimpleList.prototype.reorder = function( id, direction )
{
	for( var a = 0; a < this.elements.length; a++ )
	{
		if( this.elements[ a ].id == id )
		{
			if( direction == 'up' )
			{
				if( a > 0 )
				{
					var old = this.elements[ a - 1 ];
					this.elements[ a - 1 ] = this.elements[ a ];
					this.elements[ a ] = old;
				}
				else return;
			}
			else if( direction == 'down' )
			{
				if( a < this.elements.length - 1 )
				{
					var old = this.elements[ a + 1 ];
					this.elements[ a + 1 ] = this.elements[ a ];
					this.elements[ a ] = old;
				}
				else return;
			}
		}
	}
	this.refresh();
}

// Remove an item from the list and refresh
SimpleList.prototype.removeItem = function( id )
{
	var out = [];
	for( var a = 0; a < this.elements.length; a++ )
	{
		if( this.elements[ a ].id != id )
		{
			out.push( this.elements[ a ] );
		}
	}
	this.elements = out;
	this.refresh();
}

// Refresh the list
SimpleList.prototype.refresh = function()
{
	var self = this;
	this.node.innerHTML = '';
	if( !this.elements )
	{
		this.node.innerHTML = '<div class="FriendSimpleListRow"><div class="FriendSimpleListEntryFull">' + i18n( 'i18n_no_entries' ) + '</div></div>';
	}
	else
	{
		for( var a = 0; a < this.elements.length; a++ )
		{
			var d = document.createElement( 'div' );
			d.className = 'FriendSimpleListRow';
			var e = document.createElement( 'div' );
			d.className = 'FriendSimpleListEntry';
			d.innerHTML = this.elements[ a ].title;
			d.appendChild( e );
			var b = document.createElement( 'div' );
			b.className = 'FriendSimpleListButtons';
			
			// Attach buttons
			( function( p, listItem ) {
			
				var b_up = document.createElement( 'div' );
				b_up.className = 'FriendSimpleListBUp';
				b_up.onclick = function()
				{
					self.reorder( listItem.id, 'up' );
				}
				p.appendChild( b_up );
			
				var b_down = document.createElement( 'div' );
				b_down.className = 'FriendSimpleListBDown';
				b_down.onclick = function()
				{
					self.reorder( listItem.id, 'down' );
				}
				p.appendChild( b_down );
			
				var b_re = document.createElement( 'div' );
				b_re.className = 'FriendSimpleListBRemove';
				b_re.onclick = function()
				{
					self.removeItem( listItem.id );
				}
				p.appendChild( b_re );
			} )( b, this.elements[ a ] );
			
			d.appendChild( b );
		}
	}
}


