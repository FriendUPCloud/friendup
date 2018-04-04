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

// Handling navigation
var historyLog = []; // Our history log
var index = 0; // Where we are now in history

Application.run = function( msg )
{
	document.getElementsByTagName( 'input' )[0].focus();
	document.getElementsByTagName( 'input' )[0].select();

	ge( 'BrowserBox' ).src = getImageUrl( 'Progdir:Templates/about.html' );
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'setproxy':
			setProxy( msg.proxy );
			setFriendSession( msg.friendsession );
			break;
		case 'loadfile':
			setUrl( msg.filename );
			break;
		case 'forward':
			forward();
			break;
		case 'backward':
			back();
			break;
		case 'drop':
			if( msg.data )
			{
				// TODO: Support dropping many files
				/*var items = [];
				for( var a in msg.data )
				{
					items.push( {
						Path: msg.data[a].Path,
						Filename: msg.data[a].Filename
					} );
				}*/
				setUrl( msg.data[0].Path );
			}
			break;
	}
}

function back()
{
	var pindex = index;
	if( --index < 0 ) 
		index = 0;
	// We actually moved
	if( index != pindex )
	{
		console.log( 'Index is now: ' + index + ' (was ' + pindex + ' )' );
		setUrl( index, 1 );
	}
}

function forward()
{
	var pindex = index; 
	if( ++index >= historyLog.length )
		index = historyLog.length - 1;
	// We actually moved
	if( pindex != index )
	{
		console.log( 'Going back: ' + historyLog[ index ] );
		setUrl( index, 1 );
	}
}

function reload()
{
	Application.sendMessage( { command: 'reload' } );
}

function setProxy( puri )
{
	this.proxy = puri;
	if( puri.substr(-1) != '/' ) this.proxy += '/';
}

function setFriendSession( sessionid )
{
	this.friendsession = sessionid;
}

function replaceFriendUrls( data, url )
{
	var baseUrl = '';
	if( url.indexOf( '/' ) > 0 )
	{
		baseUrl = url.split( '/' );
		baseUrl.pop();
		baseUrl = baseUrl.join( '/' ) + '/';
	}
	else baseUrl = url.split( ':' )[0] + ':';
	baseUrl = baseUrl.split( ':/' ).join( ':' );

	var r;
	// Replace relative sources
	while( r = data.match( /src\=['"]([^:"']*?)['"]/i ) )
	{
		data = data.split( r[1] ).join( baseUrl + r[1] );
	}
	// Replace sources
	while( r = data.match( /src\=['"]([a-z][^:]*?\:[^/][^'"]*?)['"]/i ) )
	{
		data = data.split( r[1] ).join( getImageUrl( r[1] ) );
	}
	// Replace relative sources
	while( r = data.match( /href\=['"]([^:"']*?)['"]/i ) )
	{
		data = data.split( r[1] ).join( baseUrl + r[1] );
	}
	// Replace hrefs
	while( r = data.match( /href\=['"]([a-z][^:]*?\:[^/][^'"]*?)['"]/i ) )
	{
		if( r[1].indexOf( '.html' ) )
		{
			data = data.split( r[1] ).join( '#" onclick="parent.setUrl(\'' + r[1] + '\'); return parent.cancelBubble( event );' );
		}
		else
		{
			data = data.split( r[1] ).join( getImageUrl( r[1] ) );
		}
	}
	return data;
}

function setUrl( uri, move )
{
	if( !move ) move = false;
	var wantedIndex = null;
	if( !isNaN( uri ) && ( uri === 0 || uri > 0 ) )
	{
		if( uri < historyLog.length )
		{
			wantedIndex = uri;
			uri = historyLog[ wantedIndex ];
			index = wantedIndex;
		}
	}
	
	if( uri == 'about:blank' || uri == 'about:home' )
	{
		ge( 'BrowserBox' ).src = getImageUrl( 'Progdir:Templates/about.html' );
		return;
	}

	//uri = uri.split( 'http://' ).join( '' ).split( 'https://' ).join( '' );
	var urldata = '';
	var skiploading = false;

	if( uri.indexOf( ':' ) > 0 && uri.indexOf( ':/' ) < 0 )
	{
		skiploading = true;
		if( uri.toLowerCase().substr( 0, 7 ) == 'system:' )
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, data )
			{
				if( e != 'ok' )
				{
					data = '<h1>No documentation on subject</h1><p>Could not find documentation on subject: ' + uri + '</p>';
				}
				var fr = document.createElement( 'iframe' );
				fr.className = 'Browser';
				fr.id = 'BrowserBox';
				fr.onLoad = ge( 'BrowserBox' ).onload;
				ge( 'BrowserBox' ).parentNode.replaceChild( fr, ge( 'BrowserBox' ) );
				var doc = ge( 'BrowserBox' ).contentDocument || ge( 'BrowserBox' ).contentWindow.document;

				data = replaceFriendUrls( data, uri );

				doc.body.parentNode.innerHTML = data;
				doc.body.onmousedown = function()
				{
					Application.sendMessage( { command: 'activate_now' } );
				}
			}
			m.execute( 'finddocumentation', { path: uri } );
		}
		else
		{
			var f = new File( uri );
			f.onLoad = function( data )
			{
				var fr = document.createElement( 'iframe' );
				fr.className = 'Browser';
				fr.id = 'BrowserBox';
				fr.onLoad = ge( 'BrowserBox' ).onload;
				ge( 'BrowserBox' ).parentNode.replaceChild( fr, ge( 'BrowserBox' ) );
				var doc = ge( 'BrowserBox' ).contentDocument || ge( 'BrowserBox' ).contentWindow.document;

				data = replaceFriendUrls( data, uri );

				doc.body.parentNode.innerHTML = data;
				doc.body.onmousedown = function()
				{
					Application.sendMessage( { command: 'activate_now' } );
				}
			}
			f.load();
		}
	}
	else if( uri.substr( 0, 7 ) != 'http://' && uri.substr( 0, 8 ) != 'https://' )
	{
		if( uri.substr( 0, 9 ) != 'friend://' )
			uri = 'friend://' + uri;
		urldata = uri.split( 'friend://' )[1];
		var si = urldata.indexOf( '/' );
		if( si < 0 ) si = 0;
		if( si > 0 )
			urldata = urldata.substr( si, urldata.length - si );
		else urldata = '';
	}
	// Normal url
	else
	{
		skiploading = true;
		ge( 'BrowserBox' ).src = uri;
	}
	
	ge( 'uri' ).value = uri;

	// Cap historyLog
	if( !move )
	{
		if( wantedIndex != null && wantedIndex < historyLog.length )
		{
			var newHistoryLog = [];
			for( var a = 0; a < wantedIndex; a++ )
			{
				newHistoryLog.push( historyLog[a] );
			}
			historyLog = newHistoryLog;
			index = wantedIndex;
		}
		else
		{
			// Add to history
			historyLog.push( uri );
			index = historyLog.length - 1;
		}
	}
	
	// do normal loading
	if( !skiploading )
	{
		if ( uri.substring( 0, 9 ) == 'friend://' )
		{
			// Calls the Tree network object for connexion
			Application.connectToTree( uri );
			Application.sendMessage( { command: 'setcontent', url: uri } );
		}
	}
	else
	{
		Application.sendMessage( { command: 'seturl', url: uri, logic: true } );
	}
}

function registerUrl( uri )
{
	Application.sendMessage( { command: 'seturl', url: uri } );
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// tree sharing handling
//
function connectToTree( url )
{
	// Opens the Tree engine for connexion to other tree via Friend Network
	var self = this;
	Friend.Tree.init( function( response )
	{
		// Loaded OK?
		if ( response == 'OK' )		
		{
			// Creates a new instance of the Tree engine
			// Will add the rendering ID later if you connect to a Tree
			Application.tree = new Friend.Tree( self,
			{
				title: 'Wideweb',
				width: window.innerWidth,
				height: window.innerHeight
			} );

			// Creates the root object of the tree
			Application.root = new Root( Application.tree, 'Root',
			{
				width: window.innerWidth,
				height: window.innerHeight,
				url: url
			} );
		}
	} );
}
function Root( tree, name, flags )
{
	var self = this;

	// Initialize the root item
	this.caller = false;
	this.messages = false;
	this.url
	this.renderItemName = 'Friend.Tree.RenderItems.Empty';
	Friend.Tree.Items.init( this, tree, 'Wideweb Tree Root', 'Application.Root', flags );

	// Adds a network object 
	this.network = new Friend.Tree.Network.Manager( this.tree, 'network',
	{
		root: this,
		parent: this,
		appName: 'Wideweb',
		caller: this,
		messages: self.receiveNetworkMessages,
		p2p: false
	} );
};
Root.prototype.messageUp = function ( message )
{
	// Call the next processes
	return this.startProcess( message, [ ] );
};
Root.prototype.messageDown = function ( message )
{
	// End the processes
	return this.endProcess( message, [ ] );
};

Root.prototype.receiveNetworkMessages = function( message )
{
	switch ( message.command )
	{
		case 'treeSharing':
			switch ( message.subCommand )
			{
				// Succesfull connection
				case 'connected':					
					debugger;
					this.key = message.key;
					this.network.connectToTree( this.key );
					break;

				// Host disconnected
				case 'hostDisconnected':
					break;

				// Host disconnected
				case 'clientDisconnected':
					break;

				default:
					break;
			}
			break;

		// File transfer
		case 'fileTransfer':
			switch ( message.response )
			{
				case 'welcome':
					var index;
					var replace = [];
					for ( var f = 0; f < message.list.length; f++ )
					{
						var file = message.list[ f ];
						if ( file.fileName == 'index.html' )
							index = file.filePath;
						else
						{
							replace.push( 
							{
								search: file.fileInfo,
								replace: getImageUrl( file.filePath )
							} );
						}	
					}
					if ( index )
					{
						var file = new File( index );
						file.onLoad = function( content )
						{
							content = Friend.Tree.Utilities.replaceFriendPaths( content, replace );
							var fr = document.createElement( 'iframe' );
							fr.className = 'Browser';
							fr.id = 'BrowserBox';
							fr.onLoad = ge( 'BrowserBox' ).onload;
							ge( 'BrowserBox' ).parentNode.replaceChild( fr, ge( 'BrowserBox' ) );
							var doc = ge( 'BrowserBox' ).contentDocument || ge( 'BrowserBox' ).contentWindow.document;
							doc.body.parentNode.innerHTML = content;
							doc.body.onmousedown = function()
							{
								Application.sendMessage( { command: 'activate_now' } );
							}
						};
						file.load();
					}
					break;

				default:
					break;
			}
			break;
	}
};
