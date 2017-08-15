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

Door = function( path )
{
	this.init();
	this.setPath( path );
	this.vars = {};
	// Root filesystem permissions
	// Owner: Read, Write, Execute, Delete, Group: *, Others: *
	// rwedrwedrwed <- template for all rights (no rights is dash, -)
	this.permissions = [ 'r', '-', 'e', '-', '-', '-', '-', '-', '-', '-', '-', '-' ];
};

Door.prototype.getPath = function()
{
	return this.deviceName + ':' + this.path;
}

Door.prototype.setPath = function( path )
{
	if( path )
	{
		this.deviceName = path.split( ':' )[0];
		this.path = path.split( ':' )[1];
	}
}

// Add a variable
Door.prototype.addVar = function( v, vl )
{
	this.vars[v] = vl;
}

Door.prototype.init = function()
{
	this.deviceName = '';
	this.path = '';
};

Door.prototype.get = function( path )
{
	if( !path ) return false;
	if( path.substr( 0, 5 ) == 'http:' || path.substr( 0, 6 ) == 'https:' || path.substr( 0, 1 ) == '/' )
		return false;
	if( path.indexOf( ':' ) < 0 ) return false;
	
	// An object? Fuck!
	if( path && path.Path ) path = path.Path;
	var vol = path.split( ':' )[0] + ':';
	// First case sensitive
	for( var a = 0; a < Doors.icons.length; a++ )
	{
		if( Doors.icons[a].Volume == vol )
		{
			// Also set the path
			var d = path.toLowerCase().substr( 0, 7 ) == 'system:' ? new DoorSystem( path ) : new Door( path );
			d.Config = Workspace.icons[a].Config;
			return d;
		}
	}
	// Then insensitive
	var invol = vol.toLowerCase();
	for( var a = 0; a < Doors.icons.length; a++ )
	{
		if( Doors.icons[a].Volume.toLowerCase() == invol )
		{
			// Also set the path
			var d = path.toLowerCase().substr( 0, 7 ) == 'system:' ? new DoorSystem( path ) : new Door( path );
			d.Config = Workspace.icons[a].Config;
			return d;
		}
	}
	return new Door( path );
};

Door.prototype.getIcons = function( fileInfo, callback, flags )
{
	var finfo = false;
		
	if( fileInfo )
	{
		finfo = fileInfo;
		this.fileInfo = {
			ID:       fileInfo.ID,
			MetaType: fileInfo.MetaType,
			Path:     fileInfo.Path,
			Title:    fileInfo.Title,
			Volume:   fileInfo.Volume
		};
		if( !this.fileInfo.path )
		{
			this.fileInfo.path = this.deviceName + ':';
		}
	}
	else if( !this.path && !this.deviceName )
	{
		if( callback ) callback( false );
		return false;
	}
	else
	{
		if( this.path.indexOf( ':' ) > 0 )
			this.path = this.path.split( ':' )[1];
			
		this.fileInfo = {
			ID:       false,
			MetaType: 'Meta',
			Path:     this.deviceName + ':' + this.path,
			Title:    this.deviceName + ':',
			Volume:   this.deviceName
		};
	}

	// We don't want this amp stuff!
	this.fileInfo.Path = this.fileInfo.Path ? this.fileInfo.Path.split( 'amp;' ).join( '' ) : this.fileInfo.Volume;

	var t = this;

	// Check dormant first!
	this.checkDormantDoors( t.fileInfo.Path ? t.fileInfo.Path : false, function( dirs )
	{
		if( !t.fileInfo.Path && t.path )
			t.fileInfo.Path = t.deviceName + ':' + t.path;
		
		var fname = t.fileInfo.Path.split( ':' )[1];
		if( fname && fname.indexOf( '/' ) > 0 ){ fname = fname.split( '/' ); fname = fname[fname.length-1]; }
		var deviceName = t.fileInfo.Path.split( ':' )[0] + ':';

		// If we end up here, we're not using dormant - which is OK! :)
		if( !dirs || ( !dirs && !dirs.length ) )
		{
			// Use standard Friend Core doors
			var j = new cAjax();
			
			var updateurl = '/system.library/file/dir?r=1';
			
			if( Workspace.conf && Workspace.conf.authId )
				updateurl += '&authid=' + encodeURIComponent( Workspace.conf.authId ); //j.addVar( 'authid', Workspace.conf.authId );
			else
				updateurl += '&sessionid=' + encodeURIComponent( Workspace.sessionId ); //j.addVar( 'sessionid', Workspace.sessionId );
			
			updateurl += '&path=' + encodeURIComponent( t.fileInfo.Path );    			//j.addVar( 'path', t.fileInfo.Path );
			
			if( flags && flags.details )
			{
				updateurl += '&details=true';
			}
			
			//changed from post to get to get more speed.
			j.open( 'get', updateurl, true, true );
			j.onload = function( e, d )
			{
				if( e )
				{
					if( e != 'ok' )
					{
						// Try to remount
						if( e == 'fail' && d && ( !flags || ( flags && flags.retry ) ) )
						{
							var j = d.indexOf( '{' ) > 0 ? JSON.parse( d ) : {};
							if( j.response && j.response == 'device not mounted' )
							{
								return t.Mount( function()
								{
									t.getIcons( fileInfo, callback, { retry: false } );
								} );
							}
						}
						return callback( false, t.fileInfo.Path, false );
					}
				
					var list = d.indexOf( '{' ) > 0 ? JSON.parse( d ) : {};
					if( typeof( list ) == 'object' && list.length )
					{
						// Fix paths
						for( var a = 0; a < list.length; a++ )
						{
							if( list[a].Path.indexOf( ':' ) < 0 )
								list[a].Path = deviceName + list[a].Path;
						}
						var pth = list[0].Path.substr( 0, t.fileInfo.Path.length );
						callback( list, t.fileInfo.Path, pth );
					}
					else
					{
						// Empty directory
						callback( [], t.fileInfo.Path, false );
					}
				}
				else
				{
					// Illegal directory
					callback( false, t.fileInfo.Path, false );
				}
			}
			
			j.send();
		}
		else if( callback )
		{
			// We need this as an array!
			if( dirs && typeof( dirs ) == 'object' )
			{
				var o = [];
				for( var a in dirs ) o.push( dirs[a] );
				dirs = o;
			}
			var pth = dirs[0].Path.substr( 0, t.fileInfo.Path.length ); 
			callback( dirs, t.fileInfo.Path, pth );
		}
	} );
};

// Check if we're trying to access a dormant drive
Door.prototype.checkDormantDoors = function( path, callback )
{
	if( !path ) path = this.fileInfo.Path;
	if( !path ) 
	{
		return callback( false );
	}
	if( path.indexOf( ':' ) <= 0 )
		return callback( false );

	var p = path.split( ':' )[0] + ':';
	if( typeof( DormantMaster ) != 'undefined' )
	{
		var doors = DormantMaster.getDoors();
		if( doors )
		{
			// Case sensitive
			for( var a in doors )
			{
				if( doors[a].Title == p )
				{
					doors[a].Dormant.getDirectory( path, function( dirs )
					{
						if( callback ) callback( dirs );
					} );
					// Once upon a time, we had this, I don't know why!
					//if( callback ) return callback( false );
					return;
				}
			}
			// Case insensitive
			for( var a in doors )
			{
				if( doors[a].Title.toLowerCase() == p.toLowerCase() )
				{
					doors[a].Dormant.getDirectory( path, function( dirs )
					{
						if( callback ) callback( dirs );
					} );
					// Once upon a time, we had this, I don't know why!
					//if( callback ) return callback( false );
					return;
				}
			}
		}
		if( callback )
		{
			return callback( false );
		}
	}
	if( callback )
	{
		return callback( false );
	}
	return;
}


Door.prototype.instantiate = function()
{
	return new Door();
}

// Writes to file
Door.prototype.write = function( filename, data )
{
	var dr = this;
	var j = new cAjax();
	var old = Workspace.websocketsOffline;
	Workspace.websocketsOffline = true;
	j.open( 'post', '/system.library/file/write', true, true );
	Workspace.websocketsOffline = false;
	if( Workspace.conf && Workspace.conf.authId )
		j.addVar( 'authid', Workspace.conf.authId );
	else j.addVar( 'sessionid', Workspace.sessionId );
	j.addVar( 'path', filename );
	j.addVar( 'data', data );
	if( this.vars && this.vars.encoding )
		j.addVar( this.vars.encoding );
	else j.addVar( 'encoding', 'url' );
	j.addVar( 'mode', 'w' );
	if( this.vars )
	{
		for( var a in this.vars )
		{
			j.addVar( a, this.vars[a] );
		}
	}
	j.onload = function( r, d )
	{
		var dat = 0;
		if( r == 'ok' )
		{
			// Do the refreshing
			Workspace.refreshWindowByPath( filename );
			dat = ( JSON.parse( d ) ).FileDataStored;
		}
		
		if( dr.onWrite )
			dr.onWrite( dat );
	}
	j.send();
}

// Reads a file
Door.prototype.read = function( filename )
{
	var dr = this;
	var j = new cAjax();
	j.open( 'post', '/system.library/file/read', true, true );
	if( Workspace.conf && Workspace.conf.authId )
		j.addVar( 'authid', Workspace.conf.authId );
	else j.addVar( 'sessionid', Workspace.sessionId );
	j.addVar( 'path', filename );
	j.addVar( 'mode', 'r' );
	if( this.vars )
	{
		for( var a in this.vars )
		{
			j.addVar( a, this.vars[a] );
		}
	}
	j.onload = function( r, d )
	{
		if( dr.onRead )
		{
			// Here we test both on separator or without (can vary from fs to fs)
			if( !d || ( this.rawData + "" ).indexOf( '<!--' ) > 10 )
				return dr.onRead( this.rawData );
			dr.onRead( r == 'ok' ? d : false );
		}
	}
	j.send();
}

// Execute a dos action now..
Door.prototype.dosAction = function( ofunc, args, callback )
{	
	// Alterations depending on command format
	var func = ofunc;
	switch( ofunc )
	{
		case 'metainfo':
		case 'delete':
		case 'copy':
		case 'link':
		case 'rename':
		case 'info':
		case 'protect':
		case 'makedir':
		case 'call':
			func = 'file/' + ofunc;
			break;
	}
	
	// We need a path
	if( !args.path ) args.path = this.deviceName + ':' + this.path;
	
	// Do the request
	var dr = this;
	var j = new cAjax();
	j.open( 'post', '/system.library/' + func, true, true );
	if( Workspace.conf && Workspace.conf.authId )
		j.addVar( 'authid', Workspace.conf.authId );
	else j.addVar( 'sessionid', Workspace.sessionId );
	j.addVar( 'args', JSON.stringify( args ) );
	// Since FC doesn't have full JSON support yet, let's do this too
	if( args && ( typeof( args ) == 'object' || typeof( args ) == 'array' ) )
	{
		for( var a in args )
		{
			j.addVar( a, args[a] );
		}
	}
	else
	{
		j.addVar( 'path', this.deviceName + ':' + this.path );
	}
	j.onload = function()
	{
		if( ofunc != 'info' )
		{
			// Do the refreshing
			var possibilities = [ 'from', 'From', 'to', 'To', 'path', 'Path' ];
			for( var b = 0; b < possibilities.length; b++ )
			{
				if( args[possibilities[b]] )
				{
					if( func.indexOf('delete') > -1 )
						Workspace.closeWindowByPath( args[possibilities[b]] );
					else Workspace.refreshWindowByPath( args[possibilities[b]] );
				}
			}
			var s = this.responseText().split( '<!--separate-->' );
			if( s && s[0] != 'ok' )
			{
				switch( ofunc )
				{
					case 'delete':
						Notify( { title: i18n( 'i18n_delete_operation' ), text: i18n( 'i18n_could_not_delete_files' ) } );
						break;
					case 'copy':
						Notify( { title: i18n( 'i18n_copy_operation' ), text: i18n( 'i18n_could_not_copy_files' ) } );
						break;
					case 'link':
						Notify( { title: i18n( 'i18n_link_operation' ), text: i18n( 'i18n_could_not_link_dirs' ) } );
						break;
					case 'rename':
						Notify( { title: i18n( 'i18n_rename_operation' ), text: i18n( 'i18n_could_not_rename_file' ) } );
						break;
					case 'stat':
						Notify( { title: i18n( 'i18n_stat_operation' ), text: i18n( 'i18n_could_not_stat_file' ) } );
						break;
					case 'protect':
						Notify( { title: i18n( 'i18n_protect_operation' ), text: i18n( 'i18n_could_not_protect_files' ) } );
						break;
					case 'makedir':
						Notify( { title: i18n( 'i18n_makedir_operation' ), text: i18n( 'i18n_could_not_make_dir' ) } );
						break;
				}
			}
		}
		if( callback ) callback( this.responseText() );
	}
	j.send();
}

// Mount a device
Door.prototype.Mount = function( callback )
{
	var f = new FriendLibrary( 'system.library' );
	f.onExecuted = function( e, d )
	{
		Application.refreshDoors();
	}
	var args = {
		command: 'mount',
		devname: this.deviceName + ':',
		type: this.Type ? this.Type : false
	};
	f.onExecuted = function( e, data )
	{
		if( callback ) callback( data );
	}
	f.execute( 'device', args );
}

// Unmount a device
Door.prototype.Unmount = function( callback )
{
	var f = new Library( 'system.library' );
	f.onExecuted = function( e, d )
	{
		//
	}
	var args = {
		command: 'unmount',
		devname: this.deviceName + ':'
	};
	f.onExecuted = function( e, data )
	{
		if( callback ) callback( data );
	}
	f.execute( 'device', args );
}

