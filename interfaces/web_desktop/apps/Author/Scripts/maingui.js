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

Application.run = function( msg, iface )
{
	// To tell about ck
	this.ckinitialized = false;
	
	//...
	// TODO: This should not be needed!
	if( typeof( CKEDITOR ) == 'undefined' )
	{
		var js = document.createElement( 'script' );
		js.src = '/webclient/apps/Author/Scripts/ckeditor/ckeditor.js';
		document.body.appendChild( js );
		js.onload = function()
		{
			if( Application.ckinitialized ) return;
			Application.ckinitialized = true;
			CKEDITOR.replace( ge( 'Editor' ), { 
				on: { 
					instanceReady: function( evt )
					{ 
						//evt.editor.execCommand( 'maximize' ); 
					},
					contentDom: function( e )
					{
						var editable = e.editor.editable();
						editable.attachListener( e.editor.document, 'keydown', function( evt ) 
						{
							// Pass it back
							if( evt.data.$.ctrlKey )
							{
								// Don't trap irrelevant keys
								switch( evt.data.$.which )
								{
									case 79:
									case 83:
									case 78:
									case 81:
									case 73:
										Application.sendMessage( {
											command: 'keydown',
											key: evt.data.$.which,
											ctrlKey: evt.data.$.ctrlKey
										} );
										cancelBubble ( evt.data.$ );
										return false;
									default:
										break;
								}
								return false;
							}
						} );
						editable.attachListener( e.editor.document, 'mousedown', function( evt )
						{
							Application.sendMessage( {
								command: 'activate'
							} );
						} );
					}
				}
			} );
			CKEDITOR.config.height = '100%';
		}
	}	
}

// Open a file
Application.open = function()
{
	this.sendMessage( { command: 'openfile' } );
}


Application.setCurrentDocument = function( pth )
{
	if( pth.indexOf( '/' ) > 0 )
	{
		var fname = pth.split( '/' );
		fname = fname[fname.length-1];
		this.fileName = fname;
	}
	else
	{
		var fname = pth.split( ':' );
		fname = fname[fname.length-1];
		this.fileName = fname;
	}
	this.path = pth.substr( 0, pth.length - this.fileName.length );
	
	this.sendMessage( {
		command: 'currentfile',
		path: this.path,
		filename: this.fileName
	} );
}

Application.loadFile = function( path )
{
	ge( 'Status' ).innerHTML = i18n( 'i18n_status_loading' );
	
	var extension = path.split( '.' ); extension = extension[extension.length-1];
	
	switch( extension )
	{
		case 'doc':
		case 'docx':
		case 'odt':
			var m = new Module( 'files' );
			m.onExecuted = function( e, data )
			{
				if( e == 'ok' )
				{
					Application.setCurrentDocument( path );
					
					ge( 'Status' ).innerHTML = 'Loaded';
					CKEDITOR.instances.Editor.setData( data );
					setTimeout( function()
					{
						ge( 'Status' ).innerHTML = '';
					}, 500 );
				}
				// We got an error...
				else
				{
					ge( 'Status' ).innerHTML = 'Failed to load document...';
					console.log( e, data );
					
					setTimeout( function()
					{
						ge( 'Status' ).innerHTML = '';
					}, 1000 );
				}	
			}
			m.execute( 'loaddocumentformat', { path: path } );
			break;
		default:
			var f = new File( path );
			f.onLoad = function( data )
			{
				ge( 'Status' ).innerHTML = 'Loaded';
				
				// Let's fix authid paths and sessionid paths
				var m = false;
				data = data.split( /authid\=[^&]+/i ).join ( 'authid=' + Application.authId );
				data = data.split( /sessionid\=[^&]+/i ).join ( 'authid=' + Application.authId );
				
				setTimeout( function()
				{
					ge( 'Status' ).innerHTML = '';
				}, 500 );
		
				CKEDITOR.instances.Editor.setData( data );
			}
			f.load();
			break;
	}
}

Application.saveFile = function( path, content )
{
	ge( 'Status' ).innerHTML = i18n( 'i18n_status_saving' );
	
	var extension = path.split( '.' ); extension = extension[extension.length-1];
	
	switch( extension )
	{
		case 'doc':
		case 'docx':
		case 'odt':
			
			var f = new File();
			f.onPost = function( res )
			{
				if( res )
				{
					ge( 'Status' ).innerHTML = 'Written';
					setTimeout( function()
					{
						ge( 'Status' ).innerHTML = '';
					}, 500 );
				}
				else
				{
					ge( 'Status' ).innerHTML = 'Error writing...';
					setTimeout( function()
					{
						ge( 'Status' ).innerHTML = '';
					}, 1000 );
				}
			}
			f.post( path, content );
			
			/*var m = new Module( 'files' );
			m.onExecuted = function( e, data )
			{
				if( e == 'ok' )
				{
					ge( 'Status' ).innerHTML = 'Written';
					setTimeout( function()
					{
						ge( 'Status' ).innerHTML = '';
					}, 500 );
				}
				// We got an error...
				else
				{
					ge( 'Status' ).innerHTML = data;
					setTimeout( function()
					{
						ge( 'Status' ).innerHTML = '';
					}, 1000 );
				}
			}
			m.execute( 'writedocumentformat', { path: path, data: content } );*/
			
			break;
		default:
			var f = new File();
			f.onSave = function()
			{
				ge( 'Status' ).innerHTML = 'Written';
				setTimeout( function()
				{
					ge( 'Status' ).innerHTML = '';
				}, 500 );
			}
			f.save( path, content );
			break;
	}
}

Application.print = function( path, content, callback )
{
	var m = new Module( 'files' );
	m.onExecuted = function( e, data )
	{
		if( e == 'ok' )
		{
			ge( 'Status' ).innerHTML = 'Printed';
			if( callback )
				callback( data );
			setTimeout( function()
			{
				ge( 'Status' ).innerHTML = '';
			}, 500 );
		}
		// We got an error...
		else
		{
			ge( 'Status' ).innerHTML = data;
			setTimeout( function()
			{
				ge( 'Status' ).innerHTML = '';
			}, 1000 );
		}
	}
	m.execute( 'gendocumentpdf', { path: path, data: content } );
}

Application.newDocument = function()
{
	CKEDITOR.instances.Editor.setData( '' );
}

// TODO: This won't work
Application.handleKeys = function( k, e )
{
	if( e.ctrlKey )
	{
		this.sendMessage( { command: 'keydown', key: k, ctrlKey: e.ctrlKey } );
		return true;
	}
	return false;
}

// Do a meta search on all connected systems
function metaSearch( keywords )
{
	var m = new Module( 'system' );
	m.onExecuted = function( rc, response )
	{
		console.log( response );
	}
	m.execute( 'metasearch', { keywords: keywords } );
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'makeinlineimages':
			/*var eles = ge( 'Editor' ).getElementsByTagName( 'img' );
			for( var a = 0; a < eles.length; a++ )
			{
				console.log( eles[a] );
			}*/
			break;
		case 'insertimage':
			/*var f = new File( msg.path );
			f.onLoad = function( data )
			{
				var i = '<img src="data:image/jpeg;base64,' + Base64.encode( data ) + '"/>';
				CKEDITOR.instances.Editor.insertHtml( i );
			}
			f.load();*/
			var i = '<img src="' + getImageUrl( msg.path ) + '"/>';
			CKEDITOR.instances.Editor.insertHtml( i );
			break;
		case 'loadfiles':
			for( var a = 0; a < msg.files.length; a++ )
			{
				this.loadFile( msg.files[a].Path );
			}
			break;
		case 'print':
			this.print( msg.path, '<!doctype html><html><head><title></title></head><body>' + CKEDITOR.instances.Editor.getData() + '</body></html>', function( data )
			{
				var w = new View( {
					title: 'Print preview ' + msg.path,
					width: 700,
					height: 800
				} );
				w.setContent( '<iframe style="margin: 0; width: 100%; height: 100%; position: absolute; top: 0; left: 0; border: 0" src="/system.library/file/read/?path=' + data + '&authid=' + Application.authId + '&mode=rb"></iframe><style>html, body{padding:0;margin:0}</style>' );
			} );
			break;
		case 'savefile':
			this.saveFile( msg.path, '<!doctype html><html><head><title></title></head><body>' + CKEDITOR.instances.Editor.getData() + '</body></html>' );
			break;
		case 'newdocument':
			this.newDocument();
			break;
		case 'drop':
			for( var a = 0; a < msg.data.length; a++ )
			{
				this.loadFile( msg.data[0].Path );
				this.sendMessage( {
					command: 'syncload',
					filename: msg.data[0].Path
				} );
				break;
			}
			break;
	}
}


