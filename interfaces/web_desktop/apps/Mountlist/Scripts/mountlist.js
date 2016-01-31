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

Application.run = function()
{
	// Make room for connection windows
	this.connectionWindows = [];
	
	// Open main view
	var w = new View( {
		title: i18n( 'i18n_mountlist' ),
		width: 380,
		height: 320,
		id: 'mountlist'
	} );
	
	w.setFlag( 'min-width', 380 );
	
	this.mainView = w;
	
	w.onClose = function(){ Application.quit(); }
	
	// Just setup filesystems (could be removed in the future)
	var ch = new Module( 'system' );
	ch.execute( 'setup' );
	
	var f = new File( 'Progdir:Templates/main.html' );
	f.onLoad = function( d )
	{
		w.setContent( d, function()
		{ 
			Application.refreshDoors();
		} );
	}
	f.load();
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
			
				if( a > 0 ) sw += ' BorderTop';
			
				if( rows[a].Mounted != '1' )
					sw += ' Unmounted';
			
				out.push( '\
					<div class="HRow BackgroundDefault' + sw + '">\
						<div class="HContent40 FloatLeft">\
							<div class="LineHeight2x">&nbsp;&nbsp;' + rows[a].Name + '</div>\
						</div>\
						<div class="HContent30 FloatLeft">\
							<div class="LineHeight2x">' + ( rows[a].Server ? rows[a].Server : '&nbsp;' ) + '</div>\
						</div>\
						<div class="HContent30 FloatLeft">\
							<div class="FloatRight">\
								<button type="button" class="IconSmall fa-remove" onclick="Application.sendMessage({ command: \'delete\', id: ' + rows[a].ID + ' })"></button>\
							</div>\
							<div class="FloatRight">\
								<button type="button" class="IconSmall fa-pencil" onclick="Application.sendMessage({ command: \'edit\', id: ' + rows[a].ID + ' })"></button>\
							</div>\
							<div class="FloatRight">\
								<button type="button" class="IconSmall ' + m + '" onclick="Application.sendMessage({ command: \'' + ( rows[a].Mounted != '1' ? 'mount' : 'unmount' ) + '\', id: \'' + rows[a].ID + '\'\
									, data: { type: \'' + rows[a].Type +'\', name: \'' + rows[a].Name + '\', path: \''+ rows[a].Path + '\' } } )"></button>\
							</div>\
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
	
	console.log(  'RMESSAGE---- ' + msg.command );
	
	switch( msg.command )
	{
		case 'newconnection':
			this.newConnection();
			break;
		case 'refresh':
			if( !msg.where )
				this.refreshDoors();
			break;
		case 'edit':
			this.editConnection( msg.id );
			break;
		case 'delete':
			this.deleteConnection( msg.id );
			break;
		case 'mount':
			this.mountConnection( msg.id, msg.data );
			break;
		case 'unmount':
			this.unmountConnection( msg.id, msg.data );
			break;
		default:
			return;
	}
}

// Opens the New connection dialog
Application.newConnection = function()
{
	var v = new View( {
		title:  i18n( 'connection' ),
		width:  320,
		height: 275
	} );
	
	var f = new File( 'Progdir:Templates/connection.html' );
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
	this.connectionWindows.push( v );
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
			out.push( '<option value="' + p[a].type + '"' + on + '>' + p[a].literal + '</option>' );;
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
	}
	m.execute( 'deletedoor', { id: id } );
}

Application.editConnection = function( id )
{
	var v = new View( {
		title:  i18n( 'edit_connection' ),
		width:  320,
		height: 275
	} );
	
	var f = new File( 'Progdir:Templates/connection.html' );
	f.onLoad = function( data )
	{
		// Set data and fill in information
		v.setContent( data, function()
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, dat )
			{
				var d = JSON.parse( dat );
				Application.loadTypes( false, function( out )
				{ 
					out = out.join ( "\n" );
					out = out.split( 'value="' + d.Type + '"' ).join( 'value="' + d.Type + '" selected="selected"' );
					v.sendMessage( { command: 'setinfo', info: d, types: out } );	
				} );
			}
			m.execute( 'filesystem', { id: id } );
		} );
	}
	f.load();
	this.connectionWindows.push( v );
}

// Mounts partition
Application.mountConnection = function( id, data )
{
	var f = new Library( 'system.library' );
	
	f.onExecuted = function( e, d )
	{
		Application.refreshDoors();
	}
	
	var args = {
		type: data.type,
		devname: data.name.split( ':' ).join ( '' ),
		path: data.path,
		sessionid: Doors.sessionId
	};
	
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
		Application.refreshDoors();
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


