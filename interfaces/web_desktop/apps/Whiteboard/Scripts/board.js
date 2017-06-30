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

// Some variables --------------------------------------------------------------

var canv, ctx;
var mouse = {
	x: -1,
	y: -1,
	px: -1,
	py: -1, 
	state: 2
};

var MOUSE_STATE_DOWN = 1;
var MOUSE_STATE_UP   = 2;
var MOUSE_STATE_NULL = 0;

var userPool = [];
var userNames = [];

var colors = [ '#000000', '#ff0000', '#00aa00', '#0000ff' ];
var colorslot = 0;

Application.mycolor = '#000000';

// Run application -------------------------------------------------------------

Application.run = function( msg )
{
	Application.username = msg.username; 
	
	canv = ge( 'Drawing' );
	ctx = canv.getContext( '2d' );
	
	canvRefresh();
	
	window.addEventListener( 'resize', canvRefresh );
}

// Event handler ---------------------------------------------------------------

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'draw':
			var u = false;
			
			if( msg.username == Application.username ) return;
			
			if( typeof( userPool[msg.username] ) == 'undefined' )
				u = userPool[msg.username] = new User( msg.username );
			else u = userPool[msg.username];

			if( msg.color ) u.color = msg.color;
			if( !u.color ) u.color = colors[++colorslot];
			
			ctx.beginPath();
			ctx.strokeStyle = u.color;
			ctx.moveTo( msg.px, msg.py );
			ctx.lineTo( msg.cx, msg.cy );
			ctx.stroke();
			ctx.closePath();
			break;
		// This one is irrelevant
		case 'ishost':
			this.isHost = msg.value;
			this.disableLogic = msg.disableLogic;
			break;
		// Add a user to the user pool
		case 'adduser':
			if( msg.hasOwnProperty('username') && typeof msg.username != 'object' && msg.username != Application.username )
			{
				Application.addUser( msg.username, ( msg.hasOwnProperty('color') ? msg.color : false ) );
			}
			else if( msg.hasOwnProperty('username') && msg.hasOwnProperty('color') && Application.username == msg.username )
			{
				Application.mycolor = msg.color;
			}
			break;

		case 'removeuser':
			if( msg.hasOwnProperty('username') ) Application.removeUser( msg.username )
			break;

		// Getting events!
		case 'setcoords':
			console.log( msg );
			break;
			
		case 'sasclosed':
			
			break;
	}
}

// Simple user class -----------------------------------------------------------
User = function( username, color )
{
	this.username = username;
	this.color = ( color ? color : '#DDD' );
	this.events = {};
	// Unset an event
	this.off = function( event )
	{
		this.events[event] = 0;
	}
	// Set an event
	this.on = function( event )
	{
		this.events[event] = 1;
	}
	this.receiveEvent = function( event )
	{
	}
};

/*
	Add a user to our pool; if he is not in already...
*/
Application.addUser = function( username, color )
{
	if( userNames.indexOf( username ) == -1 )
	{
		userPool.push( new User( username, color ) );
		userNames.push( username );		
	}
	Application.updateUserlist();
}

/*
	Remove a user
*/
Application.removeUser = function( username )
{
	var upos = userNames.indexOf( username );
	if( upos != -1 )
	{
		userNames.splice( upos,1 );
		userPool.splice( upos,1 );
	}
	Application.updateUserlist();
}

/*
	Update user list after users have been added or removed
*/
Application.updateUserlist = function()
{
	if( userPool.length == 0 ) { console.log('no users in pool'); ge('UserContainer').innerHTML=''; return; }
	
	var rs = '';
	var ucol = '';
	
	for( var i = 0; i < userPool.length; i++ )
	{
		ucol = (userPool[i].color ? userPool[i].color : '#EEE' );
		rs += '<div style="color:'+ ucol +'"><div class="square" style="background-color:'+ ucol +'"></div>'+ userPool[i].username  +'</div>';
	}
	ge('UserContainer').innerHTML = rs;
	console.log('Our user list', rs);
}

// Get the right user ----------------------------------------------------------
function getByIdentity( e )
{
	var pool = userPool;
	
	// If we don't have an identity in the event, it means we're it!
	if( !e.identity )
	{
		e.identity = { 'username': ( Application.username ? Application.username : 'foobarsam' ) };
		//console.log( 'Setting default identity: ' + e.identity.username );
	}
	
	// Add external user that pops in!
	if( !pool[e.identity.username] )
	{
		//console.log( 'Added new user ' + e.identity.username );
		pool[e.identity.username] = new User( e.identity.username );
	}
	
	return pool[e.identity.username];
}

// Just refresh the canvas -----------------------------------------------------
function canvRefresh()
{	
	var img = false;
	if( canv.minWidth )
		img = ctx.getImageData( 0, 0, canv.minWidth, canv.minHeight );
	
	canv.width = canv.parentNode.offsetWidth;
	canv.height = canv.parentNode.offsetHeight;
	
	// Make sure we have minimum width/height
	if( !canv.minWidth ) canv.minWidth = canv.width;
	if( !canv.minHeight ) canv.minHeight = canv.height;
	if( canv.width > canv.minWidth )
		canv.minWidth = canv.width;
	if( canv.height > canv.minHeight )
		canv.minHeight = canv.height;
	
	canv.setAttribute( 'width', canv.minWidth );
	canv.setAttribute( 'height', canv.minHeight );
	
	canv.style.backgroundColor = '#f8f8f8';
	
	if( img )
	{
		ctx.putImageData( img, 0, 0 );
	}
}

// Setup event listeners -------------------------------------------------------

function canvMouseMove( e )
{
	// Try to get the player
	var player = getByIdentity( e );
	
	// Manage coordinates
	mouse.px = mouse.x;
	mouse.py = mouse.y;
	mouse.x = e.clientX;
	mouse.y = e.clientY;
	if( mouse.px < 0 ) mouse.px = mouse.x;
	if( mouse.py < 0 ) mouse.py = mouse.y;
	
	// Tell everyone we are drawing!
	if( mouse.state == MOUSE_STATE_DOWN )
	{
		// Tell other user!
		Application.sendMessage( {
			command: 'draw',
			payload: {
				px: mouse.px,
				py: mouse.py,
				cx: mouse.x,
				cy: mouse.y,
				username: player.username,
				color: Application.mycolor
			}
		} );
		
		// Myself!
		ctx.beginPath();
		ctx.strokeStyle = Application.mycolor;
		ctx.moveTo( mouse.px, mouse.py );
		ctx.lineTo( mouse.x, mouse.y );
		ctx.stroke();
		ctx.closePath();
	}
}

function canvMouseDown( e )
{
	// Try to get the player
	var player = getByIdentity( e );
	
	mouse.state = MOUSE_STATE_DOWN;
	ctx.strokeStyle = '#000000';
}

function canvMouseUp( e )
{
	// Try to get the player
	var player = getByIdentity( e );
	
	mouse.state = MOUSE_STATE_UP;
	mouse.px = -1;
	mouse.py = -1;
}

window.addEventListener( 'mousemove', canvMouseMove, true );
window.addEventListener( 'mousedown', canvMouseDown, true );
window.addEventListener( 'mouseup',   canvMouseUp,   true );


