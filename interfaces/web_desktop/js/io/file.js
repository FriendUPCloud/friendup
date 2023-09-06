/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var friendUP = window.friendUP;
friendUP.io = friendUP.io || {};

// Simple file class
File = function( filename )
{
	this.path = filename;

	this.useEncryption = false; // Default no encryption

	this.data = false;
	this.rawdata = false;
	this.replacements = false;
	this.vars = {};

	// Execute translations
	this.i18n = function()
	{
		if( !this.replacements ) this.replacements = {};
		if( window.i18n_translations )
		{
			for( var a in window.i18n_translations )
			{
				this.replacements[a] = window.i18n_translations[a];
			}
		}
	}

	// TODO: Complete this
	this.encrypt = function( data )
	{
		return data;
	}

	// TODO: Complete this
	this.decrypt = function( data )
	{
		return data;
	}

	// Execute replacements
	this.doReplacements = function( data )
	{
		let str = data ? data : this.data;
		if( !str ) return '';
		for( var a in this.replacements )
		{
			str = str.split( '{' + a + '}' ).join( this.replacements[a] );
		}
		if( !data )
			this.data = str;
		return str;
	}

	// Add a var
	this.addVar = function( k, v )
	{
		this.vars[k] = v;
	}

	this.resolvePath = function( filename )
	{
		if( !filename ) return '';
		if( filename.toLowerCase().substr( 0, 8 ) == 'progdir:' )
		{
			filename = filename.substr( 8, filename.length - 8 );
			if( this.application && this.application.filePath )
				filename = this.application.filePath + filename;
		}
		else if(
			filename.toLowerCase().substr( 0, 7 ) == 'system:' ||
			filename.toLowerCase().substr( 0, 5 ) == 'libs:'
		)
		{
			// not the prettiest solution... but works :)
			filename = filename.toLowerCase().substr( 0, 5 ) == 'libs:' ? filename.substr( 5, filename.length - 5 ) : filename.substr( 7, filename.length - 7 );
			filename = '/webclient/' + filename;
		}
		// Fix broken paths
		if( filename.substr( 0, 20 ) == 'resources/webclient/' )
			filename = filename.substr( 20, filename.length - 20 );

		// Special case, we\'re in a special parent url
		if( filename.substr( 0, 5 ) == 'apps/' )
			return '/webclient/' + filename;

		return filename;
	}

	// Call functions
	this.call = function( func, args )
	{
		if( !filename ) return;

		if( !args ) args = {};

		let t = this;
		let jax = new cAjax ();
		jax.type = this.type ? this.type : 'dos';
		jax.forceHTTP = true;
		if( this.cancelId )
			jax.cancelId = this.cancelId;

		for( var a in this.vars )
			jax.addVar( a, this.vars[a] );

		// Check progdir on path
		if( filename )
		{
			filename = this.resolvePath( filename );
		}

		// Get the correct door and load data
		let theDoor = Workspace.getDoorByPath( filename );
		if( theDoor )
		{
			// Copy vars
			for( var a in this.vars )
			{
				if( a == 'sessionid' && Workspace.conf.authId )
					continue;
				theDoor.addVar( a, this.vars[a] );
			}
			if( Workspace.conf && Workspace.conf.authId )
				theDoor.addVar( 'authid', Workspace.conf.authId );
			if( args && !args.path ) args.path = filename;
			if( this.cancelId )
				theDoor.cancelId = this.cancelId;
			theDoor.dosAction( 'call', args, function( data )
			{
				if( typeof ( t.onCall ) != 'undefined' )
				{
					t.onCall( data );
				}
			} );
		}
		else
		{
			console.log( 'This should never happen.' );
		}
	}

	// Load data
	this.load = function( mode )
	{
		let t = this;
		let jax = new cAjax ();
		jax.type = this.type ? this.type : 'dos';
		jax.forceHTTP = true;
		
		if( t.ondestroy ) jax.ondestroy = t.ondestroy;
		
		if( this.cancelId )
			jax.cancelId = this.cancelId;

		let noRelocatePath = false;
		for( var a in this.vars )
		{
			jax.addVar( a, this.vars[a] );
			if( !mode && a == 'mode' )
				mode = this.vars[a];
		}

		// Check progdir on path
		if( filename )
		{
			filename = this.resolvePath( filename );
		}

		// Get the correct door and load data
		let theDoor = Workspace.getDoorByPath( filename );
		if( theDoor )
		{
			if( this.cancelId )
				theDoor.cancelId = this.cancelId;
			// Copy vars
			for( var a in this.vars )
			{
				if( a == 'sessionid' && Workspace.conf.authId )
					continue;
				theDoor.addVar( a, this.vars[a] );
			}
			if( Workspace.conf && Workspace.conf.authId )
				theDoor.addVar( 'authid', Workspace.conf.authId );
			
			theDoor.onRead = function( data )
			{
				if( !( jax.mode == 'rb' || typeof( data ) == 'object' ) )
				{
					if( data && data.length )
					{
						// TODO: Is this wise? We don't want to show the ok stuff..
						if( data.substr( 0, 17 ) == 'ok<!--separate-->' )
							data = "";
					} else data = "";
					
					if( t.replacements )
					{
						for( var a in t.replacements )
							data = data.split ( '{'+a+'}' ).join ( t.replacements[a] );
					}
				}

				// Use encryption!
				if( t.useEncryption )
				{
					data = t.decrypt( data );
				}

				if( typeof ( t.onLoad ) != 'undefined' )
				{
					t.onLoad( data );
				}
			}
			theDoor.read( filename, mode );
			//console.log( 'Read filename: ' + filename );
		}
		// Old fallback on static and standard unix paths (with domain name etc)
		else
		{
			jax.open( 'post', filename, true, true );

			if( mode == 'rb' )
			{
				jax.addVar( 'mode', 'rb' );
				jax.setResponseType( 'arraybuffer' );
			}
			
			// File description
			if ( typeof( filename ) == 'string' )
			{
				jax.addVar( 'path', filename );
			}
			else
			{
				jax.addVar( 'fileInfo', JSON.stringify ( jsonSafeObject ( filename ) ) );
			}
			jax.addVar( 'sessionid', Doors.sessionId );

			jax.onload = function( r, d )
			{
				t.data = false;
				t.rawdata = false;
				if( this.returnCode == 'ok' )
				{
					// Binary mode
					if( mode == 'rb' || jax.proxy.responseType == 'arraybuffer' )
					{
						t.data = d;
					}
					else
					{
						try{ t.data = decodeURIComponent( this.returnData ); }
						catch( e ){ t.data = this.returnData; }
						if( t.replacements )
						{
							for( var a in t.replacements )
								t.data = t.data.split ( '{'+a+'}' ).join ( t.replacements[a] );
						}
						// Use encryption!
						if( t.useEncryption )
						{
							data = t.decrypt( data );
						}
					}

					if( typeof ( t.onLoad ) != 'undefined' )
					{
						t.onLoad( t.data );
					}
				}
				// Load the raw data
				else if( ( !this.returnCode || this.returnCode.length > 3 ) && this.responseText().length )
				{
					t.rawdata = this.responseText();
					
					if ( typeof( t.onLoad ) != 'undefined' )
					{
						if( t.replacements )
						{
							for( var a in t.replacements )
								t.rawdata = t.rawdata.split ( '{'+a+'}' ).join ( t.replacements[a] );
						}
						t.onLoad( t.rawdata );
					}
				}
				// Catch all (also raw data)
				else
				{
					t.rawdata = this.responseText();
					if ( typeof( t.onLoad ) != 'undefined' )
					{
						if( t.replacements )
						{
							for( var a in t.replacements )
								t.rawdata = t.rawdata.split ( '{'+a+'}' ).join ( t.replacements[a] );
						}
						t.onLoad( t.rawdata );
					}
				}
			}
			jax.onerror = function( err )
			{
				console.log( '[File] Error: ', err );
			}
			jax.send();
		}
	}

	// Posts a file of filename to a destination path (including content)
	// filePath = the name of the file (full path)
	// content = the data stream
	// callback = the function to call when we finished up
	this.post = function( content, filePath )
	{
		if( !filePath ) filePath = this.path;

		let t = this;
		if( filePath && content )
		{
			let files = [ content ];

			let uworker = new Worker( 'js/io/filetransfer.js' );

			// Open window
			let w = new View( {
				title:  i18n( 'i18n_copying_files' ),
				width:  320,
				height: 100,
				dialog: true,
				dockable: true
			} );

			let uprogress = new File( 'templates/file_operation.html' );
			
			if( this.cancelId )
				uprogress.cancelId = this.cancelId;

			uprogress.connectedworker = uworker;

			uprogress.onLoad = function( data )
			{
				data = data.split( '{cancel}' ).join( i18n( 'i18n_cancel' ) );
				w.setContent( data );

				w.connectedworker = this.connectedworker;
				w.onClose = function()
				{
					Workspace.refreshWindowByPath( filePath );
					if( this.connectedworker )
					{
						this.connectedworker.postMessage( { 'terminate': 1 } );
					}
				}

				uprogress.myview = w;

				// Setup progress bar
				let eled = w.getWindowElement().getElementsByTagName( 'div' );
				let groove = false, bar = false, frame = false, progressbar = false;
				for( var a = 0; a < eled.length; a++ )
				{
					if( eled[a].className )
					{
						let types = [ 'ProgressBar', 'Groove', 'Frame', 'Bar', 'Info' ];
						for( var b = 0; b < types.length; b++ )
						{
							if( eled[a].className.indexOf( types[b] ) == 0 )
							{
								switch( types[b] )
								{
									case 'ProgressBar': progressbar    = eled[a]; break;
									case 'Groove':      groove         = eled[a]; break;
									case 'Frame':       frame          = eled[a]; break;
									case 'Bar':         bar            = eled[a]; break;
									case 'Info':		uprogress.info = eled[a]; break;
								}
								break;
							}
						}
					}
				}


				//activate cancel button... we assume we only hav eone button in the template
				let cb = w.getWindowElement().getElementsByTagName( 'button' )[0];

				cb.mywindow = w;
				cb.onclick = function( e )
				{
					this.mywindow.close();
				}

				// Only continue if we have everything
				if( progressbar && groove && frame && bar )
				{
					progressbar.style.position = 'relative';
					frame.style.width = '100%';
					frame.style.height = '40px';
					groove.style.position = 'absolute';
					groove.style.width = '100%';
					groove.style.height = '30px';
					groove.style.top = '0';
					groove.style.left = '0';
					bar.style.position = 'absolute';
					bar.style.width = '2px';
					bar.style.height = '30px';
					bar.style.top = '0';
					bar.style.left = '0';

					// Preliminary progress bar
					bar.total = files.length;
					bar.items = files.length;
					uprogress.bar = bar;
				}
				uprogress.loaded = true;
				uprogress.setProgress(0);
			}

			uprogress.setProgress = function( percent )
			{
				// only update display if we are loaded...
				// otherwise just drop and wait for next call to happen ;)
				if( uprogress.loaded )
				{
					uprogress.bar.style.width = Math.floor( Math.max(1,percent ) ) + '%';
					uprogress.bar.innerHTML = '<div class="FullWidth" style="text-overflow: ellipsis; text-align: center; line-height: 30px; color: white">' +
					Math.floor( percent ) + '%</div>';
				}
			};

			uprogress.setUnderTransport = function()
			{
				// show notice that we are transporting files to the server....
				uprogress.info.innerHTML = '<div id="transfernotice" style="padding-top:10px;">Transferring files to target volume...</div>';
				uprogress.myview.setFlag("height",125);
			}

			uprogress.displayError = function( msg )
			{
				uprogress.info.innerHTML = '<div style="color:#F00; padding-top:10px; font-weight:700;">'+ msg +'</div>';
				uprogress.myview.setFlag("height",140);
				if( Workspace.dashboard )
				{
					Notify( { title: 'File transfer error', text: msg } );
					uworker.terminate(); // End the copying process
					w.close();
				}
			}

			uworker.onerror = function( err )
			{
				console.log('Upload worker error #######');
				console.log( err );
				console.log('###########################');
			}

			uworker.onmessage = function( e )
			{
				//console.log('Worker sends us back ------------ -');
				//console.log( e.data );
				//console.log('--------------------------------- -');
				if( e.data['progressinfo'] == 1 )
				{
					if( e.data['uploadscomplete'] == 1 )
					{
						w.close();
						Workspace.refreshWindowByPath( filePath );
						if( t.onPost )
						{
							t.onPost( true );
						}
						return true;
					}
					else if( e.data['progress'] )
					{
						uprogress.setProgress( e.data['progress'] );
						if( e.data['filesundertransport'] && e.data['filesundertransport'] > 0 )
						{
							uprogress.setUnderTransport();
						}
					}
				}
				else if( e.data['error'] == 1 )
				{
					uprogress.displayError(e.data['errormessage']);
				}
			}

			uprogress.load();

			// Do the hustle!
			let vol = filePath.split( ':' )[0];
			let path = filePath;
			uworker.postMessage( {
				'session': Workspace.sessionId,
				'targetPath': path,
				'targetVolume': vol,
				'objectdata': Base64.encode( content )
			} );
		}
	}

	// Save data to a file
	this.save = function( rawdata, filename, mode )
	{
		if( !filename ) filename = this.path;

		// Make sure this is correct
		filename = this.resolvePath( filename );

		// Use encryption!
		if( this.useEncryption )
		{
			content = this.encrypt( rawdata );
		}
		else content = rawdata;

		t = this;
		// Get the correct door and load data
		let theDoor = Workspace.getDoorByPath( filename );
		if( theDoor )
		{
			if( this.cancelId )
				theDoor.cancelId = this.cancelId;
			
			// Copy vars
			for( var a in this.vars )
				theDoor.addVar( a, this.vars[a] );
			if( ( mode && mode == 'wb' ) || this.vars['mode'] == 'wb' )
				theDoor.mode = 'wb';
			theDoor.onWrite = function( data, moreData )
			{
				if( typeof ( t.onSave ) != 'undefined' )
				{
					t.onSave( data, moreData );
				}
			}
			theDoor.write( filename, content );
		}
		// Old fallback (should never happen)
		else
		{
			let jax = new cAjax();
			jax.type = t.type ? t.type : 'dos';
			jax.forceHTTP = true;
			if( this.cancelId )
				jax.cancelId = this.cancelId;
			jax.open( 'post', '/system.library', true, true );

			for( let a in this.vars )
			{
				//console.log( 'Adding extra var ' + a, this.vars[a] );
				jax.addVar( a, this.vars[a] );
			}

			jax.addVar( 'sessionId', Doors.sessionId );
			jax.addVar( 'module', 'system' );
			jax.addVar( 'command', 'filesave' );
			jax.addVar( 'path', filename );
			jax.addVar( 'mode', 'save' );
			jax.addVar( 'content', content );
			let t = this;
			jax.onload = function ()
			{
				if ( this.returnCode == 'ok' )
				{
					t.written = parseInt ( this.returnData );
					if ( typeof ( t.onSave ) != 'undefined' )
					{
						t.onSave();
					}
				}
				else
				{
					t.written = 0;
				}
			}
			jax.send ();
		}
	}
};


// File
// same as above, but different interface
// also, probably not working yet
(function ( ns, undefined ) {
	ns.File = function( conf, callback ) {
		if ( !( this instanceof ns.File ))
			return new ns.File( conf, callback );

		let self = this;
		self.filePath = conf.filePath;
		self.callback = callback;

		self.init();
	}

	ns.File.prototype.init = function()
	{
		let self = this;
		let request = new friendUP.io.Request({
			url : self.filePath,
			args : {
				path : self.filePath
			},
			success : success,
			error : error
		});

		function success( response ) { self.done( response.data ); }
		function error( e ) { self.done( e ); }
	}

	ns.File.prototype.done = function( data )
	{
		let self = this;

		if ( !data )
		{
			data = null;
		}

		self.callback( data );
	}

})( friendUP.io );

// Resolve an image on the global level
// TODO: Use Door to resolve proper path
function getImageUrl( path )
{		
	if( path.toLowerCase().substr( 0, 7 ) == 'system:' )
		return path.split( /system\:/i ).join( '/webclient/' );

	if( path.toLowerCase().substr( 0, 5 ) == 'libs:' )
		return path.split( /libs\:/i ).join( '/webclient/' );
	
	if( path.substr( 0, 11 ) == '/webclient/' )
	{
		return path;
	}


	let sid = Workspace.sessionId && Workspace.sessionId != 'undefined';
	let type = sid ? 'sessionid' : 'authid';
	let valu = sid ? Workspace.sessionId : ( Workspace.conf && Workspace.conf.authid ? Workspace.conf.authid : '' );
	let auth = type + '=' + valu;
	let u = '/system.library/file/read?' + auth + '&path=' + encodeURIComponent( path ) + '&mode=rs';
	return u;
}
