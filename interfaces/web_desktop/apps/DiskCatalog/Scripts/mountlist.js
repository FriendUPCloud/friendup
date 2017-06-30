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

Application.run = function( msg )
{
	// Make room for connection windows
	this.connectionWindows = [];
	
	this.setApplicationName( i18n( 'i18n_disk_catalog' ) );
	
	// Open main view
	var w = new View( {
		title: i18n( 'i18n_disk_catalog' ),
		width: 800,
		height: 600,
		id: 'mountlist'
	} );
	
	w.setFlag( 'min-width', 380 );
	
	this.mainView = w;
	
	w.onClose = function(){ Application.quit(); }
	
	// Just setup filesystems (could be removed in the future)
	var ch = new Module( 'system' );
	ch.execute( 'setup' );
	
	// Read our locale
	Locale.getLocale( function( data )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' ) return;
			Locale.importTranslations( d );
			
			var f = new File( 'Progdir:Templates/main.html' );
			f.i18n();
			f.onLoad = function( d )
			{
				w.setContent( d, function()
				{ 
					Application.refreshDoors();
					Application.refreshSoftware();
				} );
			}
			f.load();
		}
		m.execute( 'getlocale', { type: 'dosdrivers', locale: data.locale } );
	} );
}

Application.refreshSoftware = function()
{
	// Get mounted drives
	var mo = new Library( 'system.library' );
	mo.onExecuted = function( eo, doe )
	{
		var drives;
		try{
			drives = JSON.parse( doe );
		}
		catch( e )
		{
			drives = [];
		}
		// All these are mounted
		for( var a = 0; a < drives.length; a++ )
			drives[a].Mounted = '1';
		
		// Get all drives
		var all = new Module( 'system' );
		all.onExecuted = function( alle, alld )
		{
			var alldrives = JSON.parse( alld );
		
			// Scoop up all unmounted drives
			for( var a = 0; a < alldrives.length; a++ )
			{
				var cn = false;
				if( alldrives[a].Config )
					cn = JSON.parse( alldrives[a].Config );
				if( cn.Mounted == 0 )
					drives.push( cn );
					

			}
			
			var l = new Library( 'system.library' );
			l.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					var rows = JSON.parse( d );
					var out = [];
					for( var a = 0; a < rows.length; a++ )
					{
						var m = 'fa-toggle-on';
						var m2 = 'fa-stop';
						var sw = ' sw' + (a%2+1);
						var fnd = false;
					
						var drive = {
							Type: '',
							Name: rows[a].Name,
							Path: '',
							Id: ( rows[a].Id ? rows[a].Id : rows[a].ID ),
							Mounted: 0
						};
					
						for( var u = 0; u < drives.length; u++ )
						{
							if( drives[u].Name == rows[a].Name )
							{
								fnd = true;
								drive = drives[u];
								break;
							}
						}
		
						if( !fnd )
						{
							if( drive.Mounted != '1' )
								m = 'fa-toggle-off';
							if( drive.Mounted != '1' )
								m2 = 'fa-play';
							if( drive.Mounted != '1' )
							{
								sw += ' Unmounted';
							}
							else sw += ' BackgroundNegative Negative';
						}
						else sw += ' BackgroundNegative Negative';
		
						edits = '\
								<div class="">\
									<button type="button" class="IconSmall ' + m + '" onclick="Application.sendMessage({ command: \'' + ( drive.Mounted != '1' ? 'mount' : 'unmount' ) + '\', id: \'' + drive.ID + '\'\
										, data: { id: \'' + rows[a].ID + '\', path: \'\', type: \'\' } } )"></button>\
								</div>\
								<div class="">\
									<button type="button" class="IconSmall ' + m2 + '" onclick="Application.sendMessage({ command: \'' + ( 
											drive.Mounted != '1' ? 
											'mount\', execute: true, visible: false' : 
											'kill\', type: \'system\', appName: \'' + drive.Execute + '\' } ); Application.sendMessage({ command: \'unmount\'' 
										) + ', id: \'' + rows[a].ID + '\'\
										, data: { name: \'' + rows[a].Name + '\', path: \'\', type: \'\' } } )"></button>\
								</div>\
						';
						
						out.push( '\
							<div class="HBox' + sw + ' Padding Disk Software">\
								<div>\
									<div><strong>' + rows[a].Name + '</strong></div>\
								</div>\
								<div class="Image" style="background-image: url(/system.library/module/?module=system&command=getdiskcover&disk=' + encodeURIComponent( rows[a].Name ) + '&authid=' + Application.authId + ')"></div>\
								<div>\
									<div><strong>' + i18n( 'i18n_publisher' ) + ':</strong> ' + rows[a].Publisher + '</div>\
								</div>\
								<div class="Buttons">\
									' + edits + '\
								</div>\
							</div>\
						' );
					}
					Application.mainView.sendMessage( { command: 'setsoftware', data: out.join ( '' ) } );
				}
			}
			l.execute( 'device/polldrives' );
		}
		all.execute( 'mountlist' );
	}
	mo.execute( 'device/list' );
}

// Refresh the doors!
Application.refreshDoors = function()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var rows = JSON.parse( d );
			var out = [];
			for( var a = 0; a < rows.length; a++ )
			{
				var m = 'fa-toggle-on';
				if( rows[a].Mounted != '1' )
					m = 'fa-toggle-off';
			
				var sw = ' sw' + (a%2+1);
			
				if( rows[a].Mounted != '1' )
					sw += ' Unmounted';
				else sw += ' BackgroundNegative Negative';
			
				// Only owner can edit
				var edits = '<div class="Infobtn FloatRight">' + i18n( 'i18n_shared_drive' ) + '</div>';
				if( rows[a].UserID == Application.userId )
				{
					//console.log('we have this row info...',rows[a]);
					edits = '\
							<div class="">\
								<button type="button" class="IconSmall fa-remove" onclick="Application.sendMessage({ command: \'delete\', id: ' + rows[a].ID + ' })"></button>\
							</div>\
							<div class="">\
								<button type="button" class="IconSmall fa-pencil" onclick="Application.sendMessage({ command: \'edit\', id: ' + rows[a].ID + ' })"></button>\
							</div>\
							<div class="">\
								<button type="button" class="IconSmall ' + m + '" onclick="Application.sendMessage({ command: \'' + ( rows[a].Mounted != '1' ? 'mount' : 'unmount' ) + '\', id: \'' + rows[a].ID + '\'\
									, data: { type: \'' + rows[a].Type +'\', name: \'' + rows[a].Name + '\', path: \''+ rows[a].Path + '\' } } )"></button>\
							</div>\
					';
				}
				
				out.push( '\
					<div class="HBox' + sw + ' Padding Disk">\
						<div>\
							<div><strong>' + rows[a].Name + '</strong></div>\
						</div>\
						<div class="Image" style="background-image: url(/system.library/module/?module=system&command=getdiskcover&disk=' + encodeURIComponent( rows[a].Name ) + '&authid=' + Application.authId + ')"></div>\
						<div>\
							<div>' + i18n('i18n_' + rows[a].Type ) + '</div>\
						</div>\
						<div class="Buttons">\
							' + edits + '\
						</div>\
					</div>\
				' );
			}
			Application.mainView.sendMessage( { command: 'setmountlist', data: out.join ( '' ) } );
		}
		Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
	}
	m.execute( 'mountlist', {} );
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'newconnection':
			this.newConnection();
			break;
		case 'refresh':
			if( !msg.where )
			{
				this.refreshDoors();
				this.refreshSoftware();
			}
			break;
		case 'edit':
			this.editConnection( msg.id );
			break;
		case 'delete':
			var t = this;
			Confirm( i18n( 'i18n_sure_delete' ), i18n( 'i18n_sure_delete_desc' ), function( acc )
			{
				if( acc.data == true )
				{
					t.deleteConnection( msg.id );
				}
			} );
			break;
		case 'mount':
			this.mountConnection( msg.id, msg.data, msg );
			break;
		case 'unmount':
			this.unmountConnection( msg.id, msg.data, msg );
			break;
		case 'encrypt':
			if( msg.key )
			{
				Authenticate.encryptKey( {
					
					destinationViewId: msg.viewId,
					data: msg.key
					
				}, function( item ){
					
					Application.sendMessage( {
						
						command: 'setkey', 
						destinationViewId: item.destinationViewId, 
						data: item.data
						
					} );
					
				} );
			}
			break;
		case 'uniqueid':
			if( msg.path && msg.username )
			{
				Authenticate.uniqueId( {
					
					destinationViewId: msg.viewId,
					path: msg.path,
					username: msg.username
					
				}, function( item ){
					
					//console.log( 'uniqueid: ', item );
					
					Application.sendMessage( {
						
						command: 'setkey', 
						destinationViewId: item.destinationViewId, 
						data: {
							uniqueId : item.data
						}
						
					} );
					
				} );
			}
			break;
		default:
			return;
	}
}

Application.loadTypes = function( d, callback )
{
	var n = new Module( 'system' );
	n.onExecuted = function( e, dat )
	{
		var p = JSON.parse( dat );
		var out = [];
		for( var a = 0; a < p.length; a++ )
		{
			var on = '';
			if( d && p[a].type == d )
				on = ' selected="selected"';
			out.push( '<option value="' + p[a].type + '"' + on + '>' + i18n( 'i18n_' + p[a].type ) + '</option>' );
		}
		if( callback && typeof( callback ) == 'function' ) callback( out );
	}
	n.execute( 'types' );
}

Application.deleteConnection = function( id )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, dat )
	{
		Application.refreshDoors();
		Application.refreshSoftware();
	}
	m.execute( 'deletedoor', { id: id } );
}

// Opens the New connection dialog
Application.newConnection = function()
{
	var v = new View( {
		title:  i18n( 'i18n_new_connection' ),
		width:  480,
		height: 380
	} );
	
	var f = new File( 'Progdir:Templates/connection.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data, function()
		{ 
			Application.loadTypes( false, function( out )
			{
				out = out.join ( "\n" );
				v.sendMessage( { command: 'setinfo', info: {}, types: out } );	
			}); 
		} );
	}
	f.load();
	
	// Manage the windows..
	this.connectionWindows.push( v );
}

// Edit connection then..
Application.editConnection = function( id )
{
	var v = new View( {
		title:  i18n( 'i18n_edit_connection' ),
		width:  480,
		height: 380
	} );
	
	var f = new File( 'Progdir:Templates/connection_edit.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, dat )
		{
			if( e == 'ok' )
			{
				var d = JSON.parse( dat );
				var ms = new Module( 'system' );
				ms.onExecuted = function( ee, dd )
				{
					if( ee == 'ok' )
					{
						var fa = new File();
						fa.i18n();
						for( var ax in fa.replacements )
							dd = dd.split( '{' + ax + '}' ).join( fa.replacements[ax] );
						data = data.split( '{GUI}' ).join( dd );
					}
					else data = data.split( '{GUI}' ).join( '' );
					
					// Set data and fill in information
					v.setContent( data, function()
					{
						Application.loadTypes( false, function( out )
						{ 
							out = out.join ( "\n" );
							out = out.split( 'value="' + d.Type + '"' ).join( 'value="' + d.Type + '" selected="selected"' );
							if( d.Password ) d.Password = '********';
							v.sendMessage( { command: 'setinfo', info: d, types: out } );	
						} );
					} );
				}
				ms.execute( 'dosdrivergui', { type: d.Type } );
			}
		}
		m.execute( 'filesystem', { id: id } );
	}
	f.load();
	this.connectionWindows.push( v );
}

// Mounts partition
Application.mountConnection = function( id, data, msg )
{
	var f = new Library( 'system.library' );
	
	f.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			Application.refreshDoors();
			Application.refreshSoftware();
			Notify( { title: i18n( 'i18n_mounting' ) + ' ' + data.name + ':', text: i18n( 'i18n_successfully_mounted' ) } );
		}
		else
		{
			Notify( { title: i18n( 'i18n_fail_mount' ), text: i18n( 'i18n_fail_mount_more' ) } );
		}
	}
	
	
	var args = {
		type: data.type,
		devname: data.name.split( ':' ).join ( '' ),
		path: data.path
	};
	
	// some optional parameters
	if( msg.execute )
		args.execute = msg.execute;
	if( msg.visible )
		args.visible = msg.visible;
	
	if( data.Type != 'Local' )
		args.module = 'system';
	
	f.execute( 'device/mount', args );
}

// Unmounts partition
Application.unmountConnection = function( id, data )
{
	var f = new Library( 'system.library' );
	
	f.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			Notify( { title: i18n( 'i18n_unmounting' ) + ' ' + data.name + ':', text: i18n( 'i18n_successfully_unmounted' ) } );
			Application.refreshDoors();
			Application.refreshSoftware();
		}
		else
		{
			Notify( { title: i18n( 'i18n_fail_unmount' ), text: i18n( 'i18n_fail_unmount_more' ) } );
		}
	}
	
	var args = {
		command: 'unmount',
		type: data.type,
		devname: data.name.split( ':' ).join ( '' ),
		path: data.path
	};
	
	if( data.Type != 'Local' )
		args.module = 'system';
	
	f.execute( 'device', args );
}

