/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var DoorCache = {
	dirListing: {}
};

Door = function( path )
{
	this.networkConnections = [];
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
	if( !this.path ) 
	{
		if( this.deviceName )
			return this.deviceName + ':';
		return false;
	}
	if( this.path.indexOf( ':' ) > 0 )
		return this.path;
	return this.deviceName + ':' + this.path;
}

// Stop all network activity!
Door.prototype.stop = function()
{
	// Kill all bajax!
	for( var a = 0; a < this.networkConnections.length; a++ )
	{
		if( this.networkConnections[ a ].destroy )
			this.networkConnections[ a ].destroy();
	}
	this.networkConnections = [];
}

Door.prototype.setPath = function( path )
{
	if( path )
	{
		path = path.split( ':' );
		this.deviceName = path[0];
		if( path.length > 1 )
			this.path = path[1];
		else this.path = '';

		// Is this a dormant drive?
		var doors = DormantMaster.getDoors();
		if( doors )
		{
			for( var d in doors )
			{
				var door = doors[ d ];
				var title = door.Title.split( ':' )[ 0 ];
				if( title == this.deviceName )
				{
					this.dormantDoor = true;
					this.dormantRead = door.Dormant.read;
					this.dormantWrite = door.Dormant.write;
					this.dormantDosAction = door.Dormant.dosAction;
					this.dormantGetConfig = door.Dormant.getConfig;
					if ( door.Dormant.setPath )
						door.Dormant.setPath( this.path );
					return true;
				}
			}
		}
		// Check normal doors
		for( var a = 0; a < Workspace.icons.length; a++ )
		{
			if( Workspace.icons[a].Title == this.deviceName )
			{
				return true;
			}
		}
	}
	// Fail!
	this.path = null;
	return false;
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

	// An object?
	if( path && path.Path ) path = path.Path;
	var vol = path.split( ':' )[0] + ':';
	
	// First case sensitive
	for( var a = 0; a < Workspace.icons.length; a++ )
	{
		if( Workspace.icons[a].Volume == vol )
		{
			// Also set the path
			var d = path.toLowerCase().substr( 0, 7 ) == 'system:' ? new DoorSystem( vol ) : new Door( vol );
			d.setPath( path );
			if ( Workspace.icons[ a ].Config )
				d.Config = Workspace.icons[a].Config;
			else if ( d.dormantGetConfig )
				d.Config = d.dormantGetConfig();
			return d;
		}
	}
	
	// Then insensitive
	var invol = vol.toLowerCase();
	for( var a = 0; a < Workspace.icons.length; a++ )
	{
		if( Workspace.icons[a].Volume && Workspace.icons[a].Volume.toLowerCase() == invol )
		{
			// Also set the path
			var v = Workspace.icons[a].Volume;
			var d = path.toLowerCase().substr( 0, 7 ) == 'system:' ? new DoorSystem( v ) : new Door( v );
			var fixPath = v + path.substr( v.length, path.length - v.length );
			d.setPath( fixPath );
			if ( Workspace.icons[ a ].Config )
				d.Config = Workspace.icons[a].Config;
			else if ( d.Dormant )
				d.Config = d.dormantGetConfig();
			return d;
		}
	}

	var door = new Door( path );

	return door;
};

Door.prototype.getIcons = function( fileInfo, callback, flags )
{	
	if( !this.path && this.deviceName )
	{
		if( typeof( fileInfo ) == 'string' && fileInfo != 'Mountlist:' )
		{
			this.path = fileInfo;
		}
		else
		{
			this.path = this.deviceName + ':';
		}
	}
	
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
	else if( !this.deviceName )
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
			Title:    this.deviceName,
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
		{
			if( t.deviceName.indexOf( ':' ) < 0 )
				t.deviceName += ':';
			t.fileInfo.Path = t.path.indexOf( ':' ) > 0 ? t.path : ( t.deviceName + t.path );
		}

		var fname = t.fileInfo.Path.split( ':' )[1];
		if( fname && fname.indexOf( '/' ) > 0 ){ fname = fname.split( '/' ); fname = fname[fname.length-1]; }
		var deviceName = t.fileInfo.Path.split( ':' )[0] + ':';

		// If we end up here, we're not using dormant - which is OK! :)
		if( !t.dormantDoor && ( !dirs || ( dirs && !dirs.length ) ) )
		{
			var cache = DoorCache.dirListing;
			
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
			
			// Use cache - used for preventing identical and pending dir requests
			if( cache[ updateurl ] )
			{
				cache[ updateurl ].queue.push( callback );
				return;
			}
			
			// Setup cache queue
			cache[ updateurl ] = {
				queue: []
			};
			
			// Use standard Friend Core doors
			var j = new cAjax();
			if( t.context ) j.context = t.context;

			//changed from post to get to get more speed.
			j.forceHTTP = true;
			j.open( 'get', updateurl, true, true );
			j.parseQueue = function( result, path, purePath )
			{
				if( cache[ updateurl ].queue.length )
				{
					for( var c = 0; c < cache[ updateurl ].queue.length; c++ )
					{
						cache[ updateurl ].queue[ c ]( result, path, purePath );
					}
				}
				delete cache[ updateurl ]; // Flush!
			}
			
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
						var res = callback( false, t.fileInfo.Path, false );
						this.parseQueue( false, t.fileInfo.Path, false );
						
						return res;
					}
					
					var parsed = '';
					// Clear last bit
					for( var tries = 0; tries < 2; tries++ )
					{
						// Remove newlines
						// TODO: Handle in server! This is a bug
						if( d.indexOf( "\n" ) > 0 )
						{
							d = d.split( "\n" );
							d = d.join( "\\n" );
						}
						
						try
						{
							parsed = JSON.parse( d );
							tries = 2;
						}
						catch( e )
						{
							parsed = false;
							d = d.substr( 0, d.length - 1 );
						}
					}
					
					var list = d.indexOf( '{' ) && parsed ? parsed : {};
					
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
						this.parseQueue( list, t.fileInfo.Path, pth );
					}
					else
					{
						// Empty directory
						callback( [], t.fileInfo.Path, false );
						this.parseQueue( [], t.fileInfo.Path, false );
					}
				}
				else
				{
					// Illegal directory
					callback( false, t.fileInfo.Path, false );
					this.parseQueue( false, t.fileInfo.Path, false );
				}
			}

			j.send();
			
			// Register network connection
			t.networkConnections.push( j );
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
			var pth;
			if ( dirs.length > 0 )
				pth = dirs[0].Path.substr( 0, t.fileInfo.Path.length );
			else
				pth = t.fileInfo.Path;
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
				var t = doors[a].Title + ':';		// HOGNE I lost so much time on ':' in Title, sometimes used, sometimes not... argh.
				if( t == p )
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
				var t = doors[a].Title + ':';
				if( t.toLowerCase() == p.toLowerCase() )
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
Door.prototype.write = function( filename, data, mode, extraData )
{
	var dr = this;

	// Interface with dormant drive
	if ( typeof extraData == 'undefined' )
		extraData = false;
	if ( this.dormantWrite )
	{
		return this.dormantWrite( filename, data, function( size )
		{
			if ( dr.onWrite )
			{
				dr.onWrite( size, extraData );
			}
		} );
	}

	// Specific binary mode - always over HTTP
	if( this.mode == 'wb' || mode == 'wb' )
	{
		// Session or auth id
		var s = ( Workspace.conf && Workspace.conf.authId ) ? ( 'authid=' + Workspace.conf.authId ) :
			( 'sessionid=' + Workspace.sessionId );
		var f = new FormData();
		
		var blob = new Blob( [ data ], { type: 'application/octet-stream' } );
		f.append( 'data', blob, "" );
		var url = '/system.library/file/upload/?' + s + '&path=' + filename;
		var poster = new XMLHttpRequest();
		
		poster.open( 'POST', url, true );
		poster.onload = function( oEvent )
		{
			// Uploaded.
			
			// Do the refreshing
			Workspace.refreshWindowByPath( filename );;
			if( dr.onWrite )
				dr.onWrite( blob.size, extraData );
		};
		
		poster.send( f );

		return;
	}
	
	var j = new cAjax();
	if( this.context ) j.context = this.context;
	
	//var old = Workspace.websocketsOffline;
	//Workspace.websocketsOffline = true;
	j.open( 'post', '/system.library/file/write', true, true );
	//Workspace.websocketsOffline = false;
	if( Workspace.conf && Workspace.conf.authId )
		j.addVar( 'authid', Workspace.conf.authId );
	else j.addVar( 'sessionid', Workspace.sessionId );
	j.addVar( 'path', filename );
	// Url encode data so we can store special characters..
	j.addVar( 'data', encodeURIComponent( data ) );
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
			dr.onWrite( dat, extraData );
	}
	j.send();
	
	// Register network connection
	this.networkConnections.push( j );
}

// Reads a file
Door.prototype.read = function( filename, mode, extraData )
{
	if ( typeof extraData == 'undefined' )
		extraData = false;

	var dr = this;
	if ( this.dormantRead )
	{
		return this.dormantRead( filename, mode, function( data )
		{
			if ( dr.onRead )
			{
				dr.onRead( data, extraData );
			}
		} );
	}
	var j = new cAjax();
	if( this.context ) j.context = this.context;
	if( mode == 'rb' )
		j.forceHTTP = true;
	j.open( 'post', '/system.library/file/read', true, true );
	if( Workspace.conf && Workspace.conf.authId )
		j.addVar( 'authid', Workspace.conf.authId );
	else j.addVar( 'sessionid', Workspace.sessionId );
	j.addVar( 'path', filename );

	// Check read mode
	if( mode ) mode = mode.toLowerCase();
	if( mode == 'r' || mode == 'rb' )
		j.addVar( 'mode', mode );
	else j.addVar( 'mode', 'r' );

	// Binary mode
	if( mode == 'rb' )
	{
		j.setResponseType( 'arraybuffer' );
	}

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
			if( j.proxy.responseType == 'arraybuffer' )
			{
				if( d.byteLength < 256 )
				{
					var str = ConvertArrayBufferToString( d );
					if( str && str.length )
					{
						if( str.substr( 0, 19 ) == 'fail<!--separate-->' )
						{
							return dr.onRead( false, extraData );
						}
					}
				}			
				dr.onRead( r == 'ok' ? d : false, extraData );
			}
			else
			{
				// Here we test both on separator or without (can vary from fs to fs)
				if( !d || ( this.rawData + "" ).indexOf( '<!--' ) > 10 )
					return dr.onRead( this.rawData );
				dr.onRead( r == 'ok' ? d : false, extraData );
			}
		}
	}
	j.send();
	
	// Register network connection
	this.networkConnections.push( j );
}

// Execute a dos action now..
Door.prototype.dosAction = function( ofunc, args, callback )
{
	var func = ofunc;

	if ( this.dormantDosAction )
	{
		return this.dormantDosAction( ofunc, args, function( responseText )
		{
			refresh();
			if ( callback )
				callback( responseText );
		} );
	}

	// Special case for 'copy' if destination is a Dormant drive
	var dr = this;
	if( ofunc == 'copy' )
	{
		var drive = args[ 'to' ].split( ':' )[ 0 ] + ':';
		var doors = DormantMaster.getDoors();
		if( doors )
		{
			for( var d in doors )
			{
				var door = doors[ d ];
				var title = door.Title.split( ':' )[ 0 ] + ':';
				if( title == drive )
				{
					// Loads the file in binary mode
					var file = new File( args[ 'from' ] );
					file.onLoad = function( data )
					{
						door.Dormant.write( args[ 'to' ], data, function( response )
						{
							refresh();
							if( response == 0 )
							{
								doAlert();
							}
							else
							{
								response = 'ok';
							}
							if( callback )
								callback( response, dr );
						} );
					}
					file.load( 'rb' );
					return;
				}
			}
		}
	}
	// Alterations depending on command format
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
	var j = new cAjax();
	if( this.context ) j.context = this.context;
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
			refresh();
			var s = this.responseText().split( '<!--separate-->' );
			if( s && s[0] != 'ok' )
			{
				doAlert();
			}
		}
		if( callback ) callback( this.responseText(), dr );
	}
	j.send();
	
	this.networkConnections.push( j );
	
	function refresh()
	{
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
	}
	function doAlert()
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
};
function IsPathOnDormantDoor( path )
{
	// Extract the drive from path
	var drive = path.split( ':' )[ 0 ] + ':';

	// Is this a dormant drive?
	var doors = DormantMaster.getDoors();
	if( doors )
	{
		for( var d in doors )
		{
			var door = doors[ d ];
			var title = door.Title.split( ':' )[ 0 ] + ':';
			if ( title == drive )
				return true;
		}
	}
	return false;
}
function GetURLFromPath( path, callback, type, toAdd )
{
	// Http links
	if( path.substr( 0, 5 ) == 'http:' || path.substr( 0, 6 ) == 'https:' )
	{
		// Evaluate external links
		//var r = document.location.href.split( /\/[^\/]?*/ );
		//r = r[0] + '//' + r[1];	
		//if( path.substr( 0, r.length ) != r )
			return callback( path );
	}
		
	if ( IsPathOnDormantDoor( path ) )
	{
		// Type not defined, get type from file extension
		if ( typeof type == 'undefined' )
		{
			var extension = '';
			var pos = path.lastIndexOf( '.' );
			if ( pos >= 0 )
				extension = path.substring( pos + 1 ).toLowerCase();
			switch( extension )
			{
				case 'txt':
				case 'asc':
				case 'ascii':
					type = 'text/plain';
					break;
				case 'css':
					type = 'text/css';
					break;
				case 'html':
					type = 'text/html';
					break;
				case 'js':
					type = 'text/javascript';
					break;
				case 'jpg':
				case 'jpeg':
					type = 'image/jpeg';
					break;
				case 'png':
					type = 'image/png';
					break;
				case 'gif':
					type = 'image/gif';
					break;
				case 'mp3':
					type = 'audio/mpeg';
					break;
				case 'midi':
				case 'mid':
					type = 'audio/midi';
					break;
				case 'wav':
					type = 'audio/wav';
					break;
				case 'ogg':
					type = 'audio/ogg';					
					break;
				case 'webm':
					type = 'video/webm';					
					break;
				case 'pdf':
					type = 'application/pdf';
					break;
				default:
					type = 'application/octet-stream';					
					break;
			}
		}

		// Load the file in binary
		var file = new File( path );
		file.onLoad = function( data )
		{
			// Check for error
			if ( typeof data == 'string' )
			{
				if( str.substr( 0, 19 ) == 'fail<!--separate-->' )
				{
					callback(false );
				}
			}

			// Create a blob and return it's URL
			var arrayBufferView = new Uint8Array( data );
			var blob = new Blob( [ arrayBufferView ], { type: type } );
			var urlCreator = window.URL || window.webkitURL;
			var imageUrl = urlCreator.createObjectURL( blob );
			callback( imageUrl );
		};
		file.load( 'rb' );
	}
	else
	{
		if ( !toAdd )
			toAdd = ' ';
		var imageUrl = '/system.library/file/read?mode=rs&sessionid=' + Workspace.sessionId + '&path=' + encodeURIComponent( path ) + toAdd;
		callback( imageUrl );
	}
}
