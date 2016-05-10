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

Door = function( path )
{
	this.path = path;
	this.init();
	this.vars = {};
};

// Add a variable
Door.prototype.addVar = function( v, vl )
{
	this.vars[v] = vl;
}

Door.prototype.init = function()
{
};

Door.prototype.get = function( path )
{
	if( !path ) return false;
	var vol = path.split( ':' )[0] + ':';
	for( var a = 0; a < Doors.icons.length; a++ )
	{
		if( Doors.icons[a].Volume.toLowerCase() == vol.toLowerCase() )
		{
			// Also set the path
			return path.toLowerCase().substr( 0, 7 ) == 'system:' ? new DoorSystem( path ) : new Door( path );
		}
	}
	return new Door( path );
};

Door.prototype.setPath = function( path )
{
	this.path = path;
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
			this.fileInfo.path = this.path;
		}
	}
	else if( !this.path )
	{
		if( callback ) callback( false );
		return false;
	}
	else
	{
		this.fileInfo = {
			ID:       false,
			MetaType: 'Meta',
			Path:     this.path,
			Title:    this.path.split( ':' )[0] + ':',
			Volume:   this.path.split( ':' )[0]
		};
	}

	var t = this;

	// Check dormant first!
	this.checkDormantDoors( t.fileInfo.Path, function( dirs )
	{
		var fname = t.fileInfo.Path.split( ':' )[1];
		if( fname && fname.indexOf( '/' ) > 0 ){ fname = fname.split( '/' ); fname = fname[fname.length-1]; }

		// If we end up here, we're not using dormant - which is OK! :)
		if( !dirs || ( !dirs && !dirs.length ) )
		{
			// Use standard Friend Core doors
			var j = new cAjax();
			j.open( 'post', '/system.library/file/dir', true, true );
			j.addVar( 'sessionid', Workspace.sessionId );
			j.addVar( 'path', t.fileInfo.Path );
			j.onload = function( e, d )
			{
				if( e )
				{
					if( e != 'ok' )
					{
						// Try to remount
						if( e == 'fail' && d && ( !flags || ( flags && flags.retry ) ) )
						{
							var j = JSON.parse( d );
							if( j.ErrorMessage && j.ErrorMessage == 'Device not mounted' )
							{
								return t.Mount( function()
								{
									t.getIcons( fileInfo, callback, { retry: false } );
								} );
							}
						}
						return callback( false, t.fileInfo.Path, false );
					}
				
					var list = JSON.parse( d );
					if( typeof( list ) == 'object' && list.length )
					{
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
			for ( var a in doors )
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
	j.open( 'post', '/system.library/file/write', true, true );
	j.addVar( 'sessionid', Workspace.sessionId );
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
	j.addVar( 'sessionid', Workspace.sessionId );
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
Door.prototype.dosAction = function( func, args, callback )
{	
	// Alterations depending on command format
	switch( func )
	{
		case 'delete':
		case 'copy':
		case 'rename':
		case 'stat':
		case 'protect':
		case 'makedir':
			func = 'file/' + func;
			break;
	}
	
	console.log('we do this here...');
	
	// We need a path
	if( !args.path ) args.path = this.path;
	
	// Do the request
	var dr = this;
	var j = new cAjax();
	j.open( 'post', '/system.library/' + func, true, true );
	j.addVar( 'sessionid', Workspace.sessionId );
	j.addVar( 'args', JSON.stringify( args ) );
	// Since FC doesn't have full JSON support yet, let's do this too
	if( args && typeof( args ) == 'object' )
	{
		for( var a in args )
		{
			j.addVar( a, args[a] );
		}
	}
	else
	{
		j.addVar( 'path', this.path );
	}
	j.onload = function()
	{
		// Do the refreshing
		var possibilities = [ 'from', 'From', 'to', 'To', 'path', 'Path' ];
		for( var b = 0; b < possibilities.length; b++ )
		{
			if( args[possibilities[b]] )
			{
				if( func.indexOf('delete') > -1 )
					Workspace.closeWindowByPath( args[possibilities[b]] );
				else
					Workspace.refreshWindowByPath( args[possibilities[b]] );
				
				console.log('we refresh....',func,args,args[possibilities[b]]);
				
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
		devname: this.path.split( ':' )[0] + ':',
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
		Application.refreshDoors();
	}
	var args = {
		command: 'unmount',
		devname: this.path.split( ':' )[0] + ':'
	};
	f.onExecuted = function( e, data )
	{
		if( callback ) callback( data );
	}
	f.execute( 'device', args );
}

