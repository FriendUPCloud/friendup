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

console.log( 'treeeroot mainview.js');

Application.run = function() {
	console.log( 'mainview.run' );
	bindAdd();
	send({
		type : 'main-loaded',
	});
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
	console.log( 'view.open', data );
	hideAdd();
	var src = 'https://'
			+ data.host
			+ '?component=authentication&action=login'
			+ '&rendermodule=' + data.config.module
			+ '&displaymode=' + data.config.display
			+ '&UniqueID=' + data.uniqueId
			+ '&PublicKey=' + data.pubKey
			+ '&SessionID=' + data.sessionId;
			
	var iframe = document.getElementById( 'main' );
	iframe.src = src;
}

function send( msg ) {
	var wrap = {
		derp : 'viewmessage',
		data : msg,
	};
	Application.sendMessage( wrap );
}

Application.receiveMessage = function( e ) {
	console.log( 'mainView.receiveMessage', e );
	if ( !e.derp )
		return;
	
	var msg = e.data;
	console.log( 'mainView.receiveMessage', msg );
	
	if ( 'showadd' === msg.type )
	{
		showAdd();
		return;
	}
	
	if ( 'open' === msg.type )
	{
		open( msg.data );
		return;
	}
}