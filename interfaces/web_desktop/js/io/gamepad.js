/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/* Gamepad class with support for VR controllers                              */
var _gamePads = [];
var _gamePadListener1 = false;
var _gamePadListener2 = false;

// Lets handle device orientation
_gamePadOrientationHandler = function( e )
{
	for( var a = 0; a < _gamePads.length; a++ )
	{
		var moved = false; var gp = _gamePads[a];
		// Check values
		if( gp.absolute != e.absolute ){ gp.absolute = e.absolute; moved = true; }
		if( gp.alpha != e.alpha ){ gp.alpha = e.alpha; moved = true; }
		if( gp.beta != e.beta ){ gp.beta != e.beta; moved = true; }
		if( gp.gamma != e.gamma ){ gp.gamma != e.gamma; moved = true; }
		// Run event handler!
		if( moved && _gamePads[a].onOrientation ) _gamePads[a].onOrientation();
	}
}
// Lets handle device motion
_gamePadMotionHandler = function( e )
{
	for( var a = 0; a < _gamePads.length; a++ )
	{
		var moved = false; var gp = _gamePads[a];
		// Check values
		// Run event handler!
		if( moved && _gamePads[a].onMotion ) _gamePads[a].onMotion();
	}
}

Gamepad = function( mode )
{
	// Vars
	this.mode = false;
	this.events = {};
	
	// Set mode
	if( mode )
	{
		switch( mode.toLowerCase() )
		{
			case 'default':
			case 'touch':
			case 'vr':
				this.mode = mode.toLowerCase();
				break;
		}
	}
	if( !this.mode ) this.mode = 'default';
	
	// Initialize gamepad
	this.initialize();
	
	if( !_gamePadListener1 )
	{
		_gamePadListener1 = window.addEventListener( 'deviceorientation', _gamePadOrientationHandler, true );
		_gamePadListener2 = window.addEventListener( 'devicemotion',      _gamePadMotionHandler,      true );
	}
		
	// Add to list of gamepads
	_gamePads.push( this );
}

Gamepad.prototype.initialize = function()
{
	// Gear VR does not support gamepad directly,.
	// but can use it for scrolling and clicking, thus
	// we can use it as a gamepad :D
	if( this.mode == 'vr' )
	{
		var dom = document.createElement( 'div' );
		var scr = document.createElement( 'div' );
		dom.style.width = '105%';
		dom.style.height = '105%';
		dom.style.position = 'absolute';
		dom.style.top = '0'; // Off screen!
		dom.style.left = '0';
		dom.style.background = 'transparent';
		dom.style.overflow = 'auto';
		scr.style.width = '200%'; // Scroller!
		scr.style.height = '200%';
		scr.style.position = 'relative';
		scr.style.background = 'transparent';
		scr.innerHTML = '<input type="checkbox"/>';
		
		dom.appendChild( scr );
		document.body.appendChild( dom );
		
		// Add to object
		this.domContainer = dom;
		this.domScroller = scr;
		
		// Reset controller
		this.reset();
	}
}

// Reset controller in its initial state
Gamepad.prototype.reset = function()
{
	var self = this;

	if( this.mode == 'vr' )
	{
		setTimeout( function()
		{
			self.domContainer.scrollLeft = 150;
			self.domContainer.scrollTop = 150;
		
			self.scrollPositionX = 150;
			self.scrollPositionY = 150;
		}, 25 );
		
		if( this.onscroll ) this.delEvent( this.onscroll );
		if( this.onmousedown ) this.delEvent( this.onmousedown );
		
		this.onscroll = this.addEvent( 'onscroll', function( e )
		{
			self.scrollPositionX = self.domContainer.scrollLeft;
			self.scrollPositionY = self.domContainer.scrollTop;
			
			if( self.scrollPositionX > 150 )
			{
				self.axisX( 1 );
			}
			else if( self.scrollPositionX < 150 )
			{
				self.axisX( -1 );
			}
			if( self.scrollPositionY > 150 )
			{
				self.axisY( 1 );
			}
			else if( self.scrollPositionY < 150 )
			{
				self.axisY( -1 );
			}
			self.reset();
		}, this.domContainer );
		
		// Mouse clicks becomes button clicks
		this.onmousedown = this.addEvent( 'onmousedown', function( e )
		{
			self.click( e.button );
		} );
		
		this.domContainer.focus();
	}
}

Gamepad.prototype.axisX = function( direction )
{
	if( direction > 0 )
	{
		if( this.onLeft ) this.onLeft();
	}
	else if( direction < 0 )
	{
		if( this.onRight ) this.onRight();
	}
}

Gamepad.prototype.axisY = function( direction )
{
	if( direction > 0 )
	{
		if( this.onUp ) this.onUp();
	}
	else if( direction < 0 )
	{
		if( this.onDown ) this.onDown();
	}
}

Gamepad.prototype.click = function( button )
{
	if( button == 0 )
	{
		if( this.onButton0 ) this.onButton0();
	}
}

Gamepad.prototype.addEvent = function( type, func, ele )
{
	if ( !this.events[type] ) this.events[type] = [];
	var obj = ele ? ele : window;
	this.events[type].push( { func: func, ele: obj } );	
	if( obj.attachEvent ) obj.attachEvent( type, func, false );
	else obj.addEventListener( type.substr ( 2, type.length - 2 ), func, false );
	return func;
}

Gamepad.prototype.delEvent = function( func )
{
	var success = false;
	for( a in this.events )
	{
		var out = [];
		for( b in this.events[a] )
		{
			if( func != this.events[a][b].func )
			{
				out.push ( this.events[a][b] );
			}
			else
			{
				if( this.events[a][b].ele.detachEvent )
					this.events[a][b].ele.detachEvent( a, func );
				else this.events[a][b].ele.removeEventListener ( a.substr ( 2, a.length - 2 ), func );
				success = true;
			}
		}
		this.events[a] = out;
	}
	return success;
}

