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
	
}

function searchPlaylists()
{
	var kvs = ge( 'Keywords' ).value;
	if( !kvs.length )
	{
		ge( 'Keywords' ).focus();
		return;
	}
	
	// Build archive of podcasts in dataarchive
	var m = new Module( 'dataarchive' );
	m.onExecuted = function( e, d )
	{
		console.log( 'Getting podcasts: ', e, d );
		if( e != 'ok' )
		{
			return;
		}
		var o = new Module( 'dataarchive' );
		m.onExecuted = function( e2, d2 )
		{
			if( e2 != 'ok' )
			{
				return;
			}
			console.log( 'Yeah! Stuff happens.' );
		}
		m.execute( 'searchindex', { indexName: 'podcasts', keywords: kvs } );
	}
	m.execute( 'buildindex', { sources: [
		'http://media.luxuriamusic.com/files/streams/Mp3/winamp.pls'
	], indexName: 'podcasts' } );
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'add_source':
			if( this.sourceW )
			{
				this.sourceW.close();
			}
			Application.sendMessage( {
				command: 'add_to_playlist',
				items: [ { Path: msg.source, Filename: msg.source } ]
			} );
			break;
		case 'drop':
			if( msg.data )
			{
				var items = [];
				for( var a in msg.data )
				{
					items.push( {
						Path: msg.data[a].Path, 
						Filename: msg.data[a].Filename
					} );
				}
				Application.sendMessage( {
					command: 'append_to_playlist_and_play',
					items: items
				} );
			}
			break;
		case 'load_playlist':
			Application.sendMessage( { command: 'load_playlist' } );
			break;
		case 'save_playlist':
			Application.sendMessage( { command: 'save_playlist' } );
			break;
		case 'save_playlist_as':
			Application.sendMessage( { command: 'save_playlist_as' } );
			break;
		case 'refresh':
			if( !msg.items || !msg.items.length )
			{
				ge( 'items' ).innerHTML = '';
				return false;
			}
			ge( 'items' ).innerHTML = '';
			var list = document.createElement( 'div' );
			list.className = 'List';
			this.items = msg.items;
			
			var sw = 2;
			for( var a = 0; a < msg.items.length; a++ )
			{
				sw = sw == 1 ? 2 : 1;
				var par = document.createElement( 'div' );
				par.className = 'HRow sw' + sw;
				var it = document.createElement( 'div' );
				it.className = 'Padding FloatLeft HContent95 Ellipsis';
				it.innerHTML = msg.items[a].Filename;
				par.onclick = function()
				{
					var eles = ge( 'items' ).getElementsByTagName( 'div' );
					for( var a = 0; a < eles.length; a++ )
					{
						if( eles[a].parentNode = ge( 'items' ) )
						{
							if( eles[a] == this )
							{
								eles[a].classList.add( 'Selected' );
							}
							else
							{
								eles[a].classList.remove( 'Selected' );
							}
						}
					}
				}
				if( ( msg.index || msg.index === 0 ) && a == msg.index )
					par.classList.add( 'Selected' );
				var it2 = document.createElement( 'div' );
				it2.className = 'FloatRight HContent5 Padding';
				it2.innerHTML = '<button class="NoPadding IconButton IconSmall fa-remove" onclick="RemoveFromPlaylist(' + a + ')"></button>';
				par.appendChild( it );
				par.appendChild( it2 );
				list.appendChild( par );
			}
			ge( 'items' ).appendChild( list );
			break;
	}
}

Application.moveElement = function( dir )
{
	var eles = ge( 'items' ).getElementsByClassName( 'HRow' );
	for( var a = 0; a < eles.length; a++ )
	{
		if( eles[a].classList.contains( 'Selected' ) )
		{
			break;
		}
	}
	var changed = false;
	if( dir < 0 )
	{
		if( a > 0 )
		{
			var old = this.items[ a - 1 ];
			this.items[ a - 1 ] = this.items[ a ];
			this.items[ a ] = old;
			changed = true;
		}
	}
	else
	{
		if( a < this.items.length - 1 )
		{
			var old = this.items[ a ];
			this.items[ a ] = this.items[ a + 1 ];
			this.items[ a + 1 ] = old;
			changed = true;
		}
	}
	if( changed )
	{
		this.receiveMessage( {
			command: 'refresh',
			items: this.items,
			index: a + dir
		} );
		this.sendMessage( {
			command: 'set_playlist',
			items: this.items,
			index: a + dir
		} );
	}
}

function addSource()
{
	if( Application.sourceW )
	{
		Application.sourceW.activate();
		return;
	}
	var v = new View( {
		title: i18n( 'i18n_add_web_stream' ),
		width: 320,
		height: 90,
		resize: false
	} );
	v.onClose = function()
	{
		Application.sourceW = false;
	}
	Application.sourceW = v;
	
	var f = new File( 'Progdir:Templates/source.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
}

function RemoveFromPlaylist( item )
{
	Application.sendMessage( { command: 'remove_from_playlist', item: item } );
}

