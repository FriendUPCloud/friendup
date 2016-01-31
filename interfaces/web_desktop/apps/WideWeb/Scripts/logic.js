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

Application.run = function( msg )
{
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'loadfile':
			setUrl( msg.filename );
			break;
	}
}

var historyLog = [];
var index = 0;

function back()
{
	var pindex = index;
	index--;
	if( index <= 0 ) index = 0;
	if( index != pindex )
		setUrl( historyLog[index] );
}

function forward()
{
	var pindex = index;
	index++;
	if( index > historyLog.length - 1 )
		index = historyLog.length - 1;
	if( pindex != index )
		setUrl( historyLog[index] );
}

function setUrl( uri )
{
	var skipLoading = false;
	
	if( uri.indexOf( ':' ) > 0 && uri.indexOf( ':/' ) < 0 )
	{
		skipLoading = true;
		var f = new File( uri );
		f.onLoad = function( data )
		{
			var fr = document.createElement( 'iframe' );
			fr.className = 'Browser';
			fr.id = 'BrowserBox';
			fr.onLoad = ge( 'BrowserBox' ).onload;
			ge( 'BrowserBox' ).parentNode.replaceChild( fr, ge( 'BrowserBox' ) );
			var doc = ge( 'BrowserBox' ).contentDocument || ge( 'BrowserBox' ).contentWindow.document;
			doc.body.innerHTML = data;
		}
		f.load();
	}
	else if( uri.substr( 0, 7 ) != 'http://' && uri.substr( 0, 8 ) != 'https://' )
	{
		uri = 'http://' + uri;
	}
	
	ge( 'uri' ).value = uri;
	
	// Cap historyLog
	var newhistoryLog = [];
	for( var a = 0; a < index; a++ )
	{
		newhistoryLog.push( historyLog[a] );
	}
	newhistoryLog = historyLog;
	
	// Update iframe
	if( !skipLoading )
	{
		ge( 'BrowserBox' ).src = uri;
	}
	
	if( historyLog[ index ] != uri )
	{
		historyLog.push( uri );
		index = historyLog.length - 1;
	}
	
	Application.sendMessage( { command: 'seturl', url: uri } );
}

ge( 'BrowserBox' ).src = 'about:blank';
ge( 'BrowserBox' ).onload = function()
{
	var src = ge( 'BrowserBox' ).src;
	Application.sendMessage( { command: 'seturl', url: src } );
}

