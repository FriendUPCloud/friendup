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
/** @file
 *
 * Tree engine Controller - joystick / mouse / accelerometers / keyboard input
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 21/08/2017
 */
Friend = window.Friend || {};
Friend.Game = Friend.Game || {};
Friend.Flags = Friend.Flags || {};

/**
 * Controller object, manages keyboard, mouse, joystick and inputs
 *
 * @param (object) tree the Tree object
 */
Friend.Game.Controller = function( flags )
{
	var self = this;
	this.tree = flags.tree;
	this.tree.utilities.setFlags( this, flags );
	this.width = this.tree.canvasWidth;
	this.height = this.tree.canvasHeight;	
	Object.assign( this, Friend.Game.Controller );

	this.map =
	[
		[ 38, Friend.Flags.UP ],
		[ 40, Friend.Flags.DOWN ],
		[ 39, Friend.Flags.RIGHT ],
		[ 37, Friend.Flags.LEFT ],
		[ 32, Friend.Flags.FIRE1 ],
		[ 13, Friend.Flags.FIRE2 ]
	];
	this.input = 0;
	this.previousInput = 0;
	this.mouseClick = false;
	this.mouseX = 0;
	this.mouseY = 0;
	this.control = false;
	this.alt = false;
	this.shift = false;
	this.altGraph = false;
	this.capsLock = false;
	this.numLock = false;
	this.scrollLock = false;
	this.keyMap = [];
	this.asciiMap = {};
	this.previousKeys = {};
	for ( var c = 0; c < 256; c++ )
		this.keyMap[ c ] = false;
	document.body.onmousemove = mouseMove;
	document.body.onmousedown = mouseDown;
	document.body.onmouseup = mouseUp;
	document.body.ondblclick = doubleClick;
	document.body.onkeydown = keyDown;
	document.body.onkeyup = keyUp;
	this.tree.addPostProcess( this );

	function mouseMove( event )
	{
		if( self.tree && self.tree.trees )
		{
			var x = event.pageX - self.tree.x;
			var y = event.pageY - self.tree.y;
			for ( var t = 0; t < self.tree.trees.length; t++ )
			{
				var tree = self.tree.trees[ t ];
				if ( x > tree.x && x < tree.x + tree.width * self.tree.zoomX )
				{
					if ( y > tree.y && y < tree.y + tree.height * self.tree.zoomY )
					{
						self.mouseX = x / self.tree.zoomX;
						self.mouseY = y / self.tree.zoomY;
					}
				}
	 		}
	 	}
	}
	function mouseDown( event )
	{
		self.mouseDown = true;
		self.mouseClickDown = 1;
	}
	function mouseUp( event )
	{
		self.mouseDown = false;
		self.mouseClick = true;
	}
	function doubleClick( event )
	{
		self.doubleClick = true;
		self.mouseClick = false;
	}
	function keyDown( event )
	{
		if ( event.defaultPrevented || event.repeat )
		{
			return;
		}
		self.shift = event.getModifierState( 'Shift' );
		self.alt = event.getModifierState( 'Alt' );
		self.altGraph = event.getModifierState( 'AltGraph' );
		self.control = event.getModifierState( 'Control' );
		self.capsLock = event.getModifierState( 'CapsLock' );
		self.numLock = event.getModifierState( 'NumLock' );
		self.scrollLock = event.getModifierState( 'ScrollLock' );
		if ( event.which )
		{
			/*
			for ( var i in self.previousKeys )
			{
				if ( typeof self.previousKeys[ i ][ event.which ] != 'undefined' )
					self.previousKeys[ i ][ event.which ] = false;
			}
			*/
			self.keyMap[ event.which ] = true;
		}
		if ( event.char )
		{
			self.asciiMap[ event.char ] = true;
		}
		for ( var m = 0; m < self.map.length; m ++ )
		{
			if ( event.which == self.map[ m ][ 0 ] )
			{
				self.input |= self.map[ m ][ 1 ];
				break;
			}
		}
	};
	function keyUp( event )
	{
		if ( event.defaultPrevented || event.repeat )
		{
			return;
		}
		self.shift = event.getModifierState( 'Shift' );
		self.alt = event.getModifierState( 'Alt' );
		self.altGraph = event.getModifierState( 'AltGraph' );
		self.control = event.getModifierState( 'Control' );
		self.capsLock = event.getModifierState( 'CapsLock' );
		self.numLock = event.getModifierState( 'NumLock' );
		self.scrollLock = event.getModifierState( 'ScrollLock' );
		if ( event.which )
		{
			/*for ( var i in self.previousKeys )
			{
				if ( typeof self.previousKeys[ i ][ event.which ] != 'undefined' )
					self.previousKeys[ i ][ event.which ] = true;				
			}
			*/
			self.keyMap[ event.which ] = false;
		}
		if ( event.char )
			self.asciiMap[ event.char ] = false;
		for ( var m = 0; m < self.map.length; m ++ )
		{
			if ( event.which == self.map[ m ][ 0 ] )
			{
				self.input &= self.map[ m ][ 1 ] ^ 0xFFFFFFFF;
				self.previousInput &= self.map[ m ][ 1 ] ^ 0xFFFFFFFF;
				break;
			}
		}
	};
};

/**
 * Definition of joystick keys
 */
Friend.Flags.UP = 0x00000001;
Friend.Flags.DOWN = 0x00000002;
Friend.Flags.LEFT = 0x00000004;
Friend.Flags.RIGHT = 0x00000008;
Friend.Flags.FIRE1 = 0x00000010;
Friend.Flags.FIRE2 = 0x00000020;

Friend.Game.Controller.kill = function ()
{
	document.body.onmousemove = null;
	document.body.onmousedown = null;
	document.body.onmouseup = null;
	document.body.ondblclick = null;
	document.body.onkeydown = null;
	document.body.onkeyup = null;
};
Friend.Game.Controller.process = function ( key )
{
	this.doubleClick = false;
	this.mouseClick = false;
};
Friend.Game.Controller.getKeyState = function ( key )
{
	return this.keyMap[ key ] ? true : false;
};
Friend.Game.Controller.getAsciiKeyState = function ( key, item )
{
	return this.asciiMap[ key ] ? true : false;
};

/**
 * isDown
 *
 * Returns true is a key is pressed
 *
 * @param (number) key definition
 * @return true if the key is down, false if not
 */
Friend.Game.Controller.isDown = function ( key )
{
	return ( this.input & key ) != 0;
};

/**
 * isUp
 *
 * Returns true is a key is not pressed
 *
 * @param (number) key definition
 * @return true if the key is up, false if down
 */
Friend.Game.Controller.isUp = function ( key )
{
	return ( this.input & key ) == 0;
};

/**
 * isUp
 *
 * Returns true is a key has just been pressed (no repeat)
 *
 * @param (number) key definition
 * @return true if the key has been pressed, false if up
 */
Friend.Game.Controller.isPressed = function ( key )
{
	if ( ( this.input & key ) != 0 )
	{
		if ( ( this.previousInput & key ) == 0 )
		{
			this.previousInput |= key;
			return true;
		}
	}
	return false;
};
Friend.Game.Controller.isKeyPressed = function ( code, name )
{
	if ( !name )
		name = 'Tree';
	var itemKeys = this.previousKeys[ name ];
	if ( !itemKeys )		
	{
		itemKeys = {};
		this.previousKeys[ name ] = itemKeys;
	}
	if ( typeof itemKeys[ code ] == 'undefined' )
		itemKeys[ code ] = false;
	if ( !itemKeys[ code ] )
	{
		if ( this.keyMap[ code ] )
		{
			itemKeys[ code ] = true;
			return true;
		}
	}
	return false;
};
Friend.Game.Controller.isKeyRelease = function ( code, name )
{
	if ( !name )
		name = 'Tree';
	var itemKeys = this.previousKeys[ name ];
	if ( !itemKeys )		
	{
		itemKeys = {};
		this.previousKeys[ name ] = itemKeys;
	}
	if ( typeof itemKeys[ code ] == 'undefined' )
		itemKeys[ code ] = true;
	if ( itemKeys[ code ] )
	{
		if ( !this.keyMap[ code ] )
		{
			itemKeys[ code ] = false;
			return true;
		}
	}
	return false;
};


/**
 * isMouseDown
 *
 * Checks the state of the left mouse button
 *
 * @return true if the left mouse button is down, false if not
 */
Friend.Game.Controller.isMouseDown = function ()
{
	return this.mouseDown;
};

/**
 * isMouseUp
 *
 * Checks the state of the left mouse button
 *
 * @return true if the left mouse button is up, false if not
 */
Friend.Game.Controller.isMouseUp = function ()
{
	return ! this.mouseDown;
};

/**
 * isMouseClick
 *
 * Returns true if the user just clicked
 *
 * @return true if the user has just clicked, false if mouse up
 */
Friend.Game.Controller.isMouseClick = function ()
{
	return this.mouseClick;
};

/**
 * isDoubleClick
 *
 * Checks for double clicks
 *
 * @return true if the user just double clicked, false if he has not
 */
Friend.Game.Controller.isDoubleClick = function ()
{
	return this.doubleClick;
};
