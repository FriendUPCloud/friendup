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

var historyLog = [];
var index = 0;

function back()
{
	var pindex = index; index--;
	if( index <= 0 ) index = 0;
	if( index != pindex ) setUrl( historyLog[index] );
}

function forward()
{
	var pindex = index; index++;
	if( index > historyLog.length - 1 ) index = historyLog.length - 1;
	if( pindex != index ) setUrl( historyLog[index] );
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

function setUrl( uri )
{
	if( uri == 'about:blank' || uri == 'about:home' )
	{
		ge( 'BrowserBox' ).src = getImageUrl( 'Progdir:Templates/about.html' );
		return;
	}
	
	uri = uri.split( 'http://' ).join( '' ).split( 'https://' ).join( '' );
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
	
	ge( 'uri' ).value = uri;
	
	// Cap historyLog
	var newhistoryLog = [];
	for( var a = 0; a < index; a++ )
	{
		newhistoryLog.push( historyLog[a] );
	}
	newhistoryLog = historyLog;
	
	if( historyLog[ index ] != uri )
	{
		historyLog.push( uri );
		index = historyLog.length - 1;
	}
	
	// do normal loading
	if( !skiploading )
	{
		var fp = uri.split( 'friend://' )[1];
		fp = fp.substr( 0, fp.indexOf( '/' ) > 0 ? fp.indexOf( '/' ) : fp.length );
		
		// Contact the host, fp, with the following method and path, then
		// display the response
		FriendNetwork.send( fp, {
			method: 'get',
			path: urldata ? '/' + urldata : '/'
		}, function( msg )
		{
			console.log( 'What happened!? ', msg.data );
		} );
	}
	
	Application.sendMessage( { command: 'seturl', url: uri } );
}


