/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
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
	if( !this.path ) 
	{
		if( this.deviceName )
			return this.deviceName + ':';
		return false;
	}
	if( this.path.indexOf( ':' ) > 0 )
		return this.path;
	const path = this.deviceName + ':' + this.path;
	//console.log( 'getPath', [ this.path, this.deviceName, path ]);
	return path;
}

// Stop all network activity!
Door.prototype.stop = function()
{
	// Kill all bajax!
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
		let doors = DormantMaster.getDoors();
		if( doors )
		{
			for( let d in doors )
			{
				let door = doors[ d ];
				let title = door.Title.split( ':' )[ 0 ];
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
		for( let a = 0; a < Workspace.icons.length; a++ )
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
	let vol = path.split( ':' )[0] + ':';
	
	// First case sensitive
	for( let a = 0; a < Workspace.icons.length; a++ )
	{
		if( Workspace.icons[a].Volume == vol )
		{
			// Also set the path
			let d = path.toLowerCase().substr( 0, 7 ) == 'system:' ? new DoorSystem( vol ) : new Door( vol );
			d.setPath( path );
			if ( Workspace.icons[ a ].Config )
			{
				d.Config = Workspace.icons[a].Config;
			}
			else if ( d.dormantGetConfig )
				d.Config = d.dormantGetConfig();
			return d;
		}
	}
	
	// Then insensitive
	let invol = vol.toLowerCase();
	for( let a = 0; a < Workspace.icons.length; a++ )
	{
		if( Workspace.icons[a].Volume && Workspace.icons[a].Volume.toLowerCase() == invol )
		{
			// Also set the path
			let v = Workspace.icons[a].Volume;
			let d = path.toLowerCase().substr( 0, 7 ) == 'system:' ? new DoorSystem( v ) : new Door( v );
			let fixPath = v + path.substr( v.length, path.length - v.length );
			d.setPath( fixPath );
			if ( Workspace.icons[ a ].Config )
				d.Config = Workspace.icons[a].Config;
			else if ( d.Dormant )
				d.Config = d.dormantGetConfig();
			return d;
		}
	}

	let door = new Door( path );

	return door;
};

Door.prototype.getIcons = function( fileInfo = false, callback, flags )
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
	
	let finfo = false;

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

	let t = this;

	// Check dormant first!
	this.checkDormantDoors( t.fileInfo.Path ? t.fileInfo.Path : false, function( dirs )
	{
		if( !t.fileInfo.Path && t.path )
		{
			if( t.deviceName.indexOf( ':' ) < 0 )
				t.deviceName += ':';
			t.fileInfo.Path = t.path.indexOf( ':' ) > 0 ? t.path : ( t.deviceName + t.path );
		}

		let fname = t.fileInfo.Path.split( ':' )[1];
		if( fname && fname.indexOf( '/' ) > 0 ){ fname = fname.split( '/' ); fname = fname[fname.length-1]; }
		let deviceName = t.fileInfo.Path.split( ':' )[0] + ':';

		// If we end up here, we're not using dormant - which is OK! :)
		if( !t.dormantDoor && ( !dirs || ( dirs && !dirs.length ) ) )
		{	
			let updateurl = '/system.library/file/dir?r=1';

			if( Workspace.conf && Workspace.conf.authId )
				updateurl += '&authid=' + encodeURIComponent( Workspace.conf.authId ); //j.addVar( 'authid', Workspace.conf.authId );
			else
				updateurl += '&sessionid=' + encodeURIComponent( Workspace.sessionId ); //j.addVar( 'sessionid', Workspace.sessionId );

			updateurl += '&path=' + encodeURIComponent( t.fileInfo.Path );    			//j.addVar( 'path', t.fileInfo.Path );

			if( flags && flags.details )
			{
				updateurl += '&details=true';
			}
			
			// Use standard Friend Core doors
			let j = new cAjax();
			j.type = t.type ? t.type : 'dos';
			if( t.cancelId )
				j.cancelId = t.cancelId;
			if( t.context ) j.context = t.context;

			//changed from post to get to get more speed.
			j.open( 'POST', updateurl, true, true );
			j.onload = function( e, d )
			{
				if( e )
				{
					if( e != 'ok' )
					{
						// Try to remount
						if( e == 'fail' && d && ( !flags || ( flags && flags.retry ) ) )
						{
							let u = d.indexOf( '{' ) > 0 ? JSON.parse( d ) : {};
							if( u.response && u.response == 'device not mounted' )
							{
								return t.Mount( function()
								{
									t.getIcons( fileInfo, callback, { retry: false } );
								} );
							}
						}
						let res = callback( false, t.fileInfo.Path, false );
						
						return res;
					}
					
					let parsed = '';
					// Clear last bit
					for( let tries = 0; tries < 2; tries++ )
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
					
					let list = d.indexOf( '[' ) >= 0 && parsed ? parsed : [];
					
					if( typeof( list ) == 'object' && list.length )
					{
						// Fix paths
						let sef = this;
						let sharedCheck = [];
						for( let a = 0; a < list.length; a++ )
						{
							if( list[a].Path.indexOf( ':' ) < 0 )
								list[a].Path = deviceName + list[a].Path;
							if( list[a].Path.substr( -1, 1 ) != '/' && deviceName != 'Shared:' )
							{
								sharedCheck.push( list[a].Path );
							}
						}
						if( sharedCheck.length )
						{
							// No dashboard
							if( !( window.Workspace && Workspace.dashboard ) )
							{
								let ch = new Library( 'system' );
								ch.onExecuted = function( che, chd )
								{
									if( che == 'ok' )
									{
										try
										{
											chd = JSON.parse( chd );
											for( let z = 0; z < list.length; z++ )
											{
												for( let c = 0; c < chd.length; c++ )
												{
													if( chd[c] == list[z].Path )
													{
														list[ z ].SharedFile = true;
														break;
													}
												}
											}
										}
										catch( e )
										{
										}
									}
									let pth = list[0].Path.substr( 0, t.fileInfo.Path.length );
									callback( list, t.fileInfo.Path, pth );
								}
								ch.execute( 'file/checksharedpaths', { paths: sharedCheck, path: deviceName } );
							}
							// In dashboard mode, we don't have shared file
							else
							{
								for( let z = 0; z < list.length; z++ )
								{
									list[ z ].SharedFile = false;
								}
								let pth = list[0].Path.substr( 0, t.fileInfo.Path.length );
								callback( list, t.fileInfo.Path, pth );
							}
						}
						else
						{
							let pth = list[0].Path.substr( 0, t.fileInfo.Path.length );
							callback( list, t.fileInfo.Path, pth );
						}
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
				let o = [];
				for( let a in dirs ) o.push( dirs[a] );
				dirs = o;
			}
			let pth;
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

	let p = path.split( ':' )[0] + ':';
	if( typeof( DormantMaster ) != 'undefined' )
	{
		let doors = DormantMaster.getDoors();
		if( doors )
		{
			// Case sensitive
			for( let a in doors )
			{
				let t = doors[a].Title + ':';		// HOGNE I lost so much time on ':' in Title, sometimes used, sometimes not... argh.
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
			for( let a in doors )
			{
				let t = doors[a].Title + ':';
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
	let dr = this;

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
		let s = ( Workspace.conf && Workspace.conf.authId ) ? ( 'authid=' + Workspace.conf.authId ) :
			( 'sessionid=' + Workspace.sessionId );
		let f = new FormData();
		
		let blob = new Blob( [ data ], { type: 'application/octet-stream' } );
		f.append( 'data', blob, "" );
		let url = '/system.library/file/upload/?' + s + '&path=' + filename;
		let poster = new XMLHttpRequest();
		
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
	
	let j = new cAjax();
	j.type = dr.type ? dr.type : 'dos';
	if( this.context ) j.context = this.context;
	if( this.cancelId )
		jax.cancelId = this.cancelId;
	
	j.open( 'post', '/system.library/file/write', true, true );
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
		for( let a in this.vars )
		{
			j.addVar( a, this.vars[a] );
		}
	}
	j.onload = function( r, d )
	{
		let dat = 0;
		if( r == 'ok' )
		{
			// Do the refreshing
			Workspace.refreshWindowByPath( filename );
			dat = ( JSON.parse( d ) ).FileDataStored;
			if( dr.onWrite )
			{
				dr.onWrite( r, d );
			}
		}
		else if( dr.onWrite )
		{
			dr.onWrite( false, false );
		}
	}
	j.send();
}

// Reads a file
Door.prototype.read = function( filename, mode, extraData )
{
	if ( typeof extraData == 'undefined' )
		extraData = false;

	let dr = this;
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
	let j = new cAjax();
	j.type = this.type ? this.type : 'dos';
	if( this.context ) j.context = this.context;
	if( this.cancelId )
		j.cancelId = this.cancelId;
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
		for( let a in this.vars )
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
					let str = ConvertArrayBufferToString( d );
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
}

// Execute a dos action now..
Door.prototype.dosAction = function( ofunc, args, callback )
{
	let func = ofunc;

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
	let dr = this;
	if( ofunc == 'copy' )
	{
		let drive = args[ 'to' ].split( ':' )[ 0 ] + ':';
		let doors = DormantMaster.getDoors();
		if( doors )
		{
			for( let d in doors )
			{
				let door = doors[ d ];
				let title = door.Title.split( ':' )[ 0 ] + ':';
				if( title == drive )
				{
					// Loads the file in binary mode
					let file = new File( args[ 'from' ] );
					if( this.cancelId )
						file.cancelId = this.cancelId;
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

	//console.log( '[ Door File Operation ] ' + ofunc + ' - ' + this.deviceName + ':' + this.path );

	// Do the request
	let j = new cAjax();
	j.type = this.type ? this.type : 'dos';
	if( this.cancelId )
		j.cancelId = this.cancelId;
	if( this.context ) j.context = this.context;
	j.forceHTTP = true;
	//if( func.indexOf( 'copy' ) > 0 )
    //	console.log( 'DOSAction trying: ' + '/system.library/' + func, args );
	j.open( 'post', '/system.library/' + func, true, true );
	if( Workspace.conf && Workspace.conf.authId )
		j.addVar( 'authid', Workspace.conf.authId );
	else j.addVar( 'sessionid', Workspace.sessionId );
	if( typeof( this.notify ) != 'undefined' ) j.addVar( 'notify', this.notify );
	j.addVar( 'args', JSON.stringify( args ) );
	// Since FC doesn't have full JSON support yet, let's do this too
	if( args && ( typeof( args ) == 'object' || typeof( args ) == 'array' ) )
	{
		for( let a in args )
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
			let s = this.responseText().split( '<!--separate-->' );
			
			if( s && s[0] != 'ok' )
			{
				doAlert();
				console.log( 'Failed: ' + this.responseText() );
			}
		}
		if( callback ) callback( this.responseText(), dr );
	}
	j.send();
	
	function refresh()
	{
		let possibilities = [ 'from', 'From', 'to', 'To', 'path', 'Path' ];
		for( let b = 0; b < possibilities.length; b++ )
		{
			if( args[possibilities[b]] )
			{
				if( Workspace.refreshWindowByPath )
				{
					if( func.indexOf('delete') > -1 )
						Workspace.closeWindowByPath( args[possibilities[b]] );
					else Workspace.refreshWindowByPath( args[possibilities[b]] );
				}
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
	let f = new FriendLibrary( 'system.library' );
	if( this.cancelId )
		f.cancelId = this.cancelId;
	f.onExecuted = function( e, d )
	{
		Application.refreshDoors();
	}
	let args = {
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
	let f = new Library( 'system.library' );
	if( this.cancelId )
		f.cancelId = this.cancelId;
	f.onExecuted = function( e, d )
	{
		//
	}
	let args = {
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
	let drive = path.split( ':' )[ 0 ] + ':';

	// Is this a dormant drive?
	let doors = DormantMaster.getDoors();
	if( doors )
	{
		for( let d in doors )
		{
			let door = doors[ d ];
			let title = door.Title.split( ':' )[ 0 ] + ':';
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
		return callback( path );
	}
		
	if ( IsPathOnDormantDoor( path ) )
	{
		// Type not defined, get type from file extension
		if ( typeof type == 'undefined' )
		{
			let extension = '';
			let pos = path.lastIndexOf( '.' );
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
		let file = new File( path );
		if( this.cancelId )
			file.cancelId = this.cancelId;
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
			let arrayBufferView = new Uint8Array( data );
			let blob = new Blob( [ arrayBufferView ], { type: type } );
			let urlCreator = window.URL || window.webkitURL;
			let imageUrl = urlCreator.createObjectURL( blob );
			callback( imageUrl );
		};
		file.load( 'rb' );
	}
	else
	{
		if ( !toAdd )
			toAdd = ' ';
		let imageUrl = '/system.library/file/read?mode=rs&sessionid=' + Workspace.sessionId + '&path=' + encodeURIComponent( path ) + toAdd;
		callback( imageUrl );
	}
}
