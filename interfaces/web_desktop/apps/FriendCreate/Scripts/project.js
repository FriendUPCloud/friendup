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
				switch( a )
				{
					case 'ProjectName':
						ge( 'tProjectName' ).value = msg.data[a];
						break;
					case 'Author':
						ge( 'tAuthor' ).value = msg.data[a];
						break;
					case 'Category':
						ge( 'tCategory' ).value = msg.data[a];
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
	if( Application.pa ) return;
	
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
		Libraries:   JSON.parse( ge( 'Libraries' ).value )
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

