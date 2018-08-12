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

var currentUser = 0;
document.title = 'game.js';

/* Lets start the game ------------------------------------------------------ */
Application.run = function( msg )
{
	// Identify the user
	currentUser = msg.userId;
	
	// This is the array of players
	this.playerPool = {};
	this.currentLevel = new Uint8Array();
	
	// Just draw the level
	DrawLevel();
	
	window.addEventListener( 'resize', ResizeScreen );
	
	// Refresh the screen
	function drawUsers()
	{
		for( var a in Application.playerPool )
		{
			var pl = Application.playerPool[a];
			pl.draw();
		}
		RedrawScreen();
		requestAnimationFrame( drawUsers );
	};
	requestAnimationFrame( drawUsers );
	
	document.body.onclick = function( e )
	{
		gameKeydown( { which: 38, targetId: false } );
		setTimeout( function( e )
		{
			gameKeyup( { which: 38, targetId: false } );
		}, 250 );
		return cancelBubble( e );
	}
}

ge( 'GameScreen' ).onclick = function()
{
	ge( 'Dispatcher' ).focus();
}

var zoom = 1;
var skewx = 0; var skewy = 0;
var players = 0;

var levelRows = 19;
var levelCols = 33;
var levels = [ '\
*********************************\
*                 ***           *\
*                 **            *\
*      ___,__  __.**            *\
*      ******  ****             *\
*,_                             *\
***                             *\
*      ...                      *\
*      ***     ..,    _,.       *\
*__            ***__._***       *\
***               ****        ,.*\
*                             ***\
*      _._            ,_,       *\
*      ***     ,._    ***       *\
*_,     *      ***              *\
***     *                       *\
**      *_.                     *\
**,,.__.***_.__,,_.__._,.._,_,,.*\
*********************************'
];

var currLevel = 0;

function ResizeScreen( w, h )
{
	// Calc some values
	var gScreen = ge( 'GameScreen' );
	if( gScreen.offsetWidth > 630 )
	{
		zoom = gScreen.offsetWidth / 640.0;
		skewx = ( gScreen.offsetWidth - 640 ) * 0.5;
		skewy = ( gScreen.offsetHeight * 0.5 ) - ( 360 * 0.5 );
		gScreen.style.transform = 'scale(' + zoom + ') translateX(' + skewx + 'px) translateY(' + skewy + 'px)';
		
		// Remove touch
		if( gScreen.touchControls )
		{
			gScreen.removeChild( gScreen.touchControls );
			gScreen.touchControls = null;
		}
	}
	else
	{
		gScreen.style.transform = '';
		
		// Add touch
		if( !gScreen.touchControls )
		{
			var d = document.createElement( 'div' );
			d.id = 'TouchControls';
			d.innerHTML = '<div id="BtnLeft"></div><div id="BtnJump"></div><div id="BtnRight"></div>';
			gScreen.appendChild( d );
			gScreen.touchControls = d;
		}
	}
	ge( 'GameLevel' ).style.width = w + 'px';
	ge( 'GameLevel' ).style.height = h + 'px';
}

function DrawLevel()
{
	// Prepare canvas
	if( !ge( 'GameLevel' ) )
	{
		var d = document.createElement( 'div' );
		d.id = 'GameLevel';
		ge( 'GameScreen' ).appendChild( d );
	}
	else
	{
		ge( 'GameLevel' ).innerHTML = '';
	}
	
	var gScreen = ge( 'GameScreen' );
	var gLevel  = ge( 'GameLevel'  );
	
	// Precalc some values
	zoom = gScreen.offsetWidth / 640.0;
	
	Application.currentLevel = new Uint8Array( levelRows * levelCols );
	
	var blockWidth = 19;
	var blockHeight = 19;	
	
	// Set the zoom level
	ResizeScreen( blockWidth * levelCols, blockHeight * levelRows );
	
	// Do the drawing
	for( var y = 0; y < levelRows; y++ )
	{
		var ypos = y * levelCols;
		var yxp = y * blockHeight;
		for( var x = 0; x < levelCols; x++ )
		{
			var xp = x * blockWidth;
			switch( levels[currLevel].substr( ypos + x, 1 ) )
			{
				case '*':
					var block = document.createElement( 'div' );
					block.className = 'Block Brick';
					block.style.left = xp + 'px';
					block.style.top = yxp + 'px';
					block.style.width = blockWidth + '.5px';
					block.style.height = blockHeight + '.5px';
					gLevel.appendChild( block );
					Application.currentLevel[ ypos + x ] = 1;
					break;
				case '_':
					var block = document.createElement( 'div' );
					block.className = 'Block Grass1';
					block.style.left = xp + 'px';
					block.style.top = yxp + 'px';
					block.style.width = blockWidth + '.5px';
					block.style.height = blockHeight + '.5px';
					gLevel.appendChild( block );
					break;
				case '.':
					var block = document.createElement( 'div' );
					block.className = 'Block Grass2';
					block.style.left = xp + 'px';
					block.style.top = yxp + 'px';
					block.style.width = blockWidth + '.5px';
					block.style.height = blockHeight + '.5px';
					gLevel.appendChild( block );
					break;
				case ',':
					var block = document.createElement( 'div' );
					block.className = 'Block Grass3';
					block.style.left = xp + 'px';
					block.style.top = yxp + 'px';
					block.style.width = blockWidth + '.5px';
					block.style.height = blockHeight + '.5px';
					gLevel.appendChild( block );
					break;
				default: break;
			}
		}
	}
}

// 
var refreshing = false;
function RedrawScreen()
{
	// If we're disabling logic, then return
	if( refreshing || Application.disableLogic ) return;
	
	refreshing = true;
	var blockSize = 19;
	var pool = Application.playerPool;
	var cl = Application.currentLevel;
	
	// Assume none on ground
	for( var a in pool ) pool[a].onGround = false;
	
	// Check collision
	for( var y = 0; y < levelRows; y++ )
	{
		var ypos = y * levelCols;
		var py1  = y * blockSize;
		var py2  = py1 + blockSize;
		for( var x = 0; x < levelCols; x++ )
		{
			var px1 = x * blockSize;
			var px2 = px1 + blockSize;
			var arpos = ypos + x;
			var val = cl[arpos];
			
			// We have a star block
			if( val == 1 )
			{
				for( var u in pool )
				{	
					// Some vars
					var player       = pool[u];
					var playerWidth  = player.dom.offsetWidth;
					var playerHeight = player.dom.offsetHeight;
					var playerFeet   = player.y + playerHeight + player.grav;
					var playerEnd    = player.x + player.dom.offsetWidth;
					var playerLeft   = player.x;
					
					// We're colliding with ground!
					if(
						playerFeet     >= py1 && 
						playerFeet     <  py1 + 6 && 
						player.x + 20  >= px1 - 5 && 
						player.x + 20  <  px2 + 5 
					)
					{
						player.y    = py1 - playerHeight;
						player.grav = 0;
						player.onGround = true;
						if( !player.isUpdated )
						{
							player.update();	
							player.isUpdated = true; // Put in update lock
						}
					}
					// Collide ceiling
					if(
						player.grav < 0 && 
						player.y + 4   >= py1 && 
						player.y + 4   <  py2 && 
						player.x + 20  >= px1 && 
						player.x + 20  <  px2
					)
					{
						player.y    = py2;
						player.grav = -player.grav;
						if( player.grav > 2 ) player.grav = 2;
					}
					
					// Collide walls
					if( 
						(
							player.y + 18 >= py1 &&
							player.y + 18 <  py2
						)
						||
						(
							player.y + 28 >= py1 &&
							player.y + 28 <  py2
						)
						||
						(
							player.y + 38 >= py1 &&
							player.y + 38 <  py2
						)
					)
					{
						// Collide right
						if(
							playerEnd - 13  >= px1 &&
							playerEnd - 13  <  px2
						)
						{
							player.x = px1 - playerWidth + 12;
						}
						// Collide left
						else if(
							player.x  <  px2 &&
							player.x  >= px1
						)
						{
							player.x = px2;
						}
					}
				}
			}
		}
	}
	
	// Update player positions
	for( var a in pool )
	{
		if( !pool[a].isUpdated )
		{
			pool[a].update();
		}
		// check for scrolling
		if( pool[a].username == Application.username )
			checkScreenScrolling( pool[a] );
			
		pool[a].isUpdated = false; // release update lock
	}
	
	refreshing = false;
}

function checkScreenScrolling( pl )
{
	var x = Math.floor( pl.x );
	var y = Math.floor( pl.y );
	if( x != pl.scrollCoordX || y != pl.scrollCoordY )
	{
		pl.scrollCoordX = x; pl.scrollCoordY = y;
		var gScreen = ge( 'GameScreen' );
		var ofw = gScreen.offsetWidth;
		if( ofw < 630 )
		{
			var gLev = ge( 'GameLevel' );
			var of2 = Math.floor( ofw / 2 );
			var ofh = gScreen.offsetHeight;
			var oh2 = Math.floor( ofh / 2 );
		
			// Scroll X
			if( x > of2 && pl.x < gLev.offsetWidth - of2 )
				gLev.style.left = Math.floor( 0 - x ) + of2 + 'px';
			else if( x < of2 )
				gLev.style.left = '6px'; // default
			// Scroll Y
			if( y > oh2 && y < gLev.offsetHeight - oh2 )
				gLev.style.top = Math.floor( 0 - y ) + oh2 + 'px';
			else if( pl.y < oh2 )
				gLev.style.top = '0px'; // default
		}
	}
}

/* The events --------------------------------------------------------------- */

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'adduser':
			// Add first player (owner, in slot 0)
			if( msg.username )
			{
				//console.log( 'Got message, we\'re adding: ' + msg.username );
				if( !this.playerPool[msg.username] )
				{
					this.playerPool[msg.username] = new Player( msg.username );
					//console.log( 'New user ' + msg.username + ' added.' );
				}
				else
				{
					//console.log( 'Existing user ' + msg.username + ' already added.' );
				}
			}
			break;
		case 'ishost':
			this.isHost = msg.value;
			this.disableLogic = msg.disableLogic;
			break;
		case 'setcoords':
			if( !this.playerPool[msg.username] )
			{	
				this.playerPool[msg.username] = new Player( msg.username );
			}
			if( this.playerPool[msg.username] )
			{
				var pl = this.playerPool[msg.username];
				pl.x = msg.x;
				pl.y = msg.y;
				pl.dom.setAttribute( 'Sprite', msg.sprite );
				if( pl.username == Application.username )
					checkScreenScrolling( pl );
			}
			break;
	}
}

/* Setup event listeners and event handlers --------------------------------- */

document.body.addEventListener( 'keydown', gameKeydown );
document.body.addEventListener( 'keyup',   gameKeyup );
document.body.addEventListener( 'touchstart', gameTouchstart );
document.body.addEventListener( 'touchend',   gameTouchend );

function getByIdentity( e )
{
	var pool = Application.playerPool;
	
	// If we don't have an identity in the event, it means we're it!
	if( !e.identity )
	{
		e.identity = { username: Application.username };
		//console.log( 'Setting default identity: ' + e.identity.username );
	}
	
	// Add external user that pops in!
	if( !pool[e.identity.username] )
	{
		//console.log( 'Added new user ' + e.identity.username );
		pool[e.identity.username] = new Player( e.identity.username );
	}
	
	return pool[e.identity.username];
}

function gameTouchstart( e )
{
	// Try to get the player
	var player = getByIdentity( e );
	
	if( e.targetId == 'BtnLeft' )
	{
		player.on( 'left' );
	}
	else if( e.targetId == 'BtnJump' )
	{
		player.on( 'up' );
	}
	else if( e.targetId == 'BtnRight' )
	{
		player.on( 'right' );
	}
	else
	{
		player.off( 'left' );
		player.off( 'right' );
		player.off( 'up' );
	}
}

function gameTouchend( e )
{
	// Try to get the player
	var player = getByIdentity( e );
	
	if( e.targetId == 'BtnLeft' )
	{
		player.off( 'left' );
	}
	else if( e.targetId == 'BtnJump' )
	{
		player.off( 'up' );
	}
	else if( e.targetId == 'BtnRight' )
	{
		player.off( 'right' );
	}
	else
	{
		player.off( 'left' );
		player.off( 'right' );
		player.off( 'up' );
	}
}

function gameKeydown( e )
{
	var kc = e.which ? e.which : e.keyCode;
		
	// Try to get the player
	var player = getByIdentity( e );
	
	// No player no movement
	if( !player ) return;
	
	switch( kc )
	{
		case 37:
			player.on( 'left' );
			break;
		case 39:
			player.on( 'right' );
			break;
		case 38:
			player.on( 'up' );
			break;
		default:
			console.log( kc );
			break;
	}
}

function gameKeyup( e )
{
	var kc = e.which ? e.which : e.keyCode;
	
	// Try to get the player
	var player = getByIdentity( e );
	
	// No player no movement
	if( !player ) return;
	
	switch( kc )
	{
		case 37:
			player.off( 'left' );
			break;
		case 39:
			player.off( 'right' );
			break;
		case 38:
			player.off( 'up' );
			break;
	}
}

