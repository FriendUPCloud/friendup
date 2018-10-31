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

Application.run = function()
{
	bindAdd();
	send({
		type : 'main-loaded',
	});
	
	this.sent = false;
}

function bindAdd()
{
	var addForm = document.getElementById( 'add-host' );
	var input = document.getElementById( 'add-input' );
	var closeBtn = document.getElementById( 'add-close' );
	
	addForm.addEventListener( 'submit', addSubmit, false );
	closeBtn.addEventListener( 'click', closeClick, false );
	function addSubmit( e )
	{
		e.preventDefault();
		e.stopPropagation();
		var host = input.value;
		console.log( host );
		var addEvent = {
			type : 'addhost',
			data : host,
		};
		send( addEvent );
		input.value = '';
		hideAdd();
	}
	
	function closeClick( e ) {
		hideAdd();
	}
}

function showAdd() { toggleAdd( true ); }
function hideAdd() { toggleAdd( false ); }
function toggleAdd( show )
{
	var addEle = document.getElementById( 'add-host' );
	var mainEle = document.getElementById( 'main' );
	addEle.classList.toggle( 'hidden', !show );
	mainEle.classList.toggle( 'hidden', show );
}

function open( data )
{
	hideAdd();
	
	// Check session before showing window ...
	
	// A hack ....
	
	data.host = ( data.host == 'store.openfriendup.net' ? 'friendup.world' : data.host );
	
	var src = 'https://'
			+ data.host;
			/*+ '?component=authentication&action=login'
			//+ '&excludecomponent=chat'
			//+ '&rendermodule=' + data.config.module
			//+ '&displaymode=' + data.config.display
			+ '&UniqueID=' + data.uniqueId
			+ '&PublicKey=' + data.pubKey
			+ '&SessionID=' + data.sessionId;*/
	
	if( data.param )
	{
		for( var k in data.param )
		{
			src += ( ( src.indexOf( '?' ) >= 0 ? '&' : '?' ) + k + '=' + data.param[k] );
		}
	}
	
	//src += '&wall_default_categoryid=';
	//src += '&redirect=groups/55/';
	
	var iframe = document.getElementById( 'main' );
	iframe.style.visibility = 'hidden';
	iframe.src = src;
	
	// Save config data to Application
	Application.conf = data;
}

function send( msg )
{
	var wrap = {
		derp : 'viewmessage',
		data : msg,
	};
	Application.sendMessage( wrap );
}

function sendToTreeroot()
{
	var conf = Application.conf;
	
	//console.log( 'conf ', conf );
	
	var iframe = document.getElementById( 'main' );
	
	if( conf && iframe )
	{
		var msg = {
			'type' : 'localstorage',
			'keys' : {
				'privatekey': conf.privKey, 
				'publickey' : conf.pubKey, 
				'uniqueid' : conf.uniqueId 
			}
		};
		
		iframe.contentWindow.postMessage( msg, '*' );
		
		Application.sent = true;
		
		console.log( '[1] Application.sent: ' + Application.sent );
		
		/*var src = 'https://' + conf.host + '/home/';
	
		if( conf.param )
		{
			for( var k in conf.param )
			{
				src += ( ( src.indexOf( '?' ) >= 0 ? '&' : '?' ) + k + '=' + conf.param[k] );
			}
		}
		
		iframe.src = src;*/
	}
}

Application.receiveMessage = function( e ) 
{
	var msg = e.data;
	
	if( e.command )
	{
		var iframe = document.getElementById( 'main' );
		switch( e.command )
		{
			case 'account_edit_profile':
			case 'account_settings':
			case 'global_settings':
			case 'nav_home':
				
				var conf = Application.conf;
				
				var iframe = document.getElementById( 'main' );
				
				iframe.src = 'https://' + conf.host + '/home/';
				
				iframe.onload = function() 
				{
					iframe.style.visibility = 'visible';
				}
				
				break;
				
			case 'nav_newsfeed':
			case 'nav_messages':
			case 'nav_calendar':
			case 'nav_library':
			case 'nav_browse':
			case 'nav_bookmarks':
				iframe.contentWindow.postMessage( e, '*' );
				break;
		}
	}
	
	if( !e.derp )
		return;
	
	if( 'showadd' === msg.type )
	{
		console.log( 'showAdd() ' );
		showAdd();
		return;
	}
	
	if( 'open' === msg.type )
	{
		console.log( 'open( msg.data ) ', msg.data );
		open( msg.data );
		return;
	}
	
	if( 'treeroot' === msg.type )
	{
		var iframe = document.getElementById( 'main' );
		
		console.log( 'iframe.src: ' + iframe.src );
		
		console.log( '[1] Application.sent: ' + Application.sent );
		
		if( msg.loaded && msg.loaded.indexOf( '/home/' ) >= 0 )
		{
			var iframe = document.getElementById( 'main' );
			
			iframe.style.visibility = 'visible';
		}
		else if( msg.loaded && !Application.sent )
		{
			console.log( '[2] sendToTreeroot() ', { loaded: msg.loaded, sent: Application.sent } );
			
			sendToTreeroot();
		}
		return;
	}	
}

