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

Player = function( usr )
{
	this.keys = {
		left: 0,
		right: 0,
		up: 0
	};

	this.prevX = this.prevY = this.scrollCoordX = this.scrollCoordY = -1;
	this.phase = 0;
	this.direction = 'left';
	this.username = usr;
	Notify( { title: 'Player joined game', text: 'The player "' + usr + '" joined the game to play.' } );
	
	// Find an empty location inside with 2 blocks margin
	this.x = this.y = 0;
	var possibilities = [];
	var lev = levels[0]; // TODO: add relevant level
	for( var row = 2; row < levelRows - 2; row += 2 )
	{
		var rpos = row * levelRows;
		var undr = ( row + 1 ) * levelRows;
		for( var col = 2; col < levelCols - 2; col += 2 )
		{
			// Find the squares
			if( 
				lev.substr( rpos + col, 1 ) == ' ' && lev.substr( rpos + col + 1, 1 ) == ' ' &&
				lev.substr( undr + col, 1 ) == ' ' && lev.substr( undr + col + 1, 1 ) == ' '
			)
			{
				possibilities.push( [ col, row ] );
			}
		}
	}
	var loc = Math.floor( Math.random() * ( possibilities.length - 1 ));
	
	if( possibilities.length )
	{
		console.log( 'possibilities', {
			loc : loc,
			possibilities : possibilities,
		});
		this.x = possibilities[loc][0] * 19;
		this.y = possibilities[loc][1] * 19;
		//console.log( 'We placed hero on: ' + this.x + ',' + this.y );
	}
	
	//console.log( 'possibilities', possibilities );
	this.grav = 0.0;
	
	this.dom = document.createElement( 'div' );
	this.playerIndex = ++players;
	this.dom.className = 'Player Player' + this.playerIndex;
	this.dom.style.top = this.y + 'px';
	this.dom.style.left = this.x + 'px';
	this.dom.style.width = '39px';
	this.dom.style.height = '39px';
	this.dom.setAttribute( 'Sprite', 'WalkL' );
	ge( 'GameLevel' ).appendChild( this.dom );
	this.update();
}

Player.prototype.update = function()
{
	if( !Application.disableLogic )
	{	
		// Timeing
		var now = ( new Date() ).getTime();
		if( !this.lastUpdate )
			this.lastUpdate = now;
	
		var move = 4;
		var fall = 0.3;
		
		// Check keys
		if( this.keys.left )
		{
			this.x -= move;
		
			// Animation frame
			this.phase += 0.3; if( this.phase > 10 ) this.phase = 0;
		}
		else if( this.keys.right )
		{
			this.x += move;
		
			// Animation frame
			this.phase += 0.3; if( this.phase > 10 ) this.phase = 0;
		}
		if( this.keys.up && this.onGround )
		{
			this.grav = -6; 
			this.y += this.grav;
		}
	
		// Constrain
		if( this.x + this.dom.offsetWidth > 640 )
			this.x = 640 - this.dom.offsetWidth;
		if( this.x < 0 ) this.x = 0;

		if( this.grav > 6 ) this.grav = 6;
		this.y += this.grav;
		if( this.y + this.dom.offsetHeight > 360 )
		{
			this.y = 360 - this.dom.offsetHeight;
		}
		this.grav += fall;
		this.lastUpdate = now;
	
		// Set animation
	
		var phas = Math.floor( this.phase ) % 3 + 1;
		if( this.direction == 'left' )
		{
			// We're walking
			if( this.keys['left'] == 1 && this.onGround )
				this.dom.setAttribute( 'Sprite', 'WalkL' + phas );
			// we're jumping
			else if( !this.onGround )
				this.dom.setAttribute( 'Sprite', 'WalkLJ' );
			// We're standing still
			else this.dom.setAttribute( 'Sprite', 'WalkL' );
		}
		else if( this.direction == 'right' )
		{
			// We're walking
			if( this.keys['right'] == 1 && this.onGround )
				this.dom.setAttribute( 'Sprite', 'WalkR' + phas );
			// Not on ground? We're jumping
			else if( !this.onGround )
				this.dom.setAttribute( 'Sprite', 'WalkRJ' );
			// We're standing still
			else this.dom.setAttribute( 'Sprite', 'WalkR' );
		}
	}
	
	// Update root with coordinates when they change
	var cx = Math.floor( this.x );
	var cy = Math.floor( this.y );
	if( cx != this.prevX || cy != this.prevY )
	{
		this.prevX = cx;
		this.prevY = cy;
		Application.sendMessage( {
			command: 'updatecoords',
			payload: { 
				x: cx, 
				y: cy, 
				sprite: this.dom.getAttribute( 'Sprite' ),
				username: this.username
			}
		} );
	}
}

Player.prototype.draw = function()
{
	this.dom.style.top = Math.floor( this.y ) + 'px';
	this.dom.style.left = this.x + 'px';
}

Player.prototype.receiveEvent = function( evt )
{
}

Player.prototype.off = function( key )
{
	this.keys[key] = 0;
}

Player.prototype.on = function( key )
{
	if( key == 'left' )
		this.direction = 'left';
	else if( key == 'right' )
		this.direction = 'right';
	this.keys[key] = 1;
}

