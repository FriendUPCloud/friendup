/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/
/** @file
 *
 * Event management
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 01/02/2018
 */
Friend = window.Friend || {};
Friend.Tree = Friend.Tree || {};
Friend.Tree.Events = Friend.Tree.Events || {};


Friend.Tree.Events = function( tree, flags )
{
	// Pointeur to the engine
	this.tree = tree;

	// Sets the events
	document.body.onmousemove = onMouseMove;
	document.body.onmouseleave = onMouseLeave;
	document.body.onmouseenter = onMouseEnter;
	document.body.onmousedown = onMouseDown;
	document.body.onmouseup = onMouseUp;
	document.body.onclick = onClick;
	document.body.ondblclick = onDblClick;
	document.body.oncontextmenu = onContextMenu;
	if ( document.body.addEventListener)
	{
    	// IE9, Chrome, Safari, Opera
    	document.body.addEventListener( 'mousewheel', onMouseWheel, false );
    	// Firefox
    	document.body.addEventListener( 'DOMMouseScroll', onMouseWheel, false );
	}
	else
	{
		// IE 6/7/8
		document.body.attachEvent( 'onmousewheel', onMouseWheel );
	}

	document.body.onkeydown = onKeyDown;
	document.body.onkeyup = onKeyUp;
	Object.assign( this, Friend.Tree.Events );

	// Callback functions
	var self = this;
	function onMouseMove( event )
	{
		for ( var t = 0; t < self.tree.trees.length; t++ )
		{
			var root = self.tree.trees[ t ];

			// For the root
			root.mouseX = event.clientX - root.x;
			root.mouseY = event.clientY - root.y;

			if ( root.mouseX >= 0 && root.mouseX < root.width && root.mouseY >= 0 && root.mouseY < root.height )
			{
				root.mouseInside = true;

				// Pokes the position in the items, and send message
				var list = root.events[ 'mouse' ];
				for ( identifier in list )
				{
					var item = root.allItems[ identifier ];
					if ( item.renderItem )
					{
						item.mouse.x = root.mouseX - item.renderItem.rect.x;
						item.mouse.y = root.mouseY - item.renderItem.rect.y;
						if ( item.mouse.x >= 0  && item.mouse.x < item.renderItem.width && item.mouse.y >= 0 && item.mouse.y < item.renderItem.height )
						{
							if ( !item.mouse.inside )
							{
								item.mouse.inside = true;
								if ( ( list[ identifier ] & Friend.Tree.Events.MOUSEENTER ) != 0 )
								{
									self.tree.sendMessageToItem( root, item, 
									{ 
										command: 'mouseenter', 
										type: 'mouse', 
										event: event,
										mouse: item.mouse
									} );
								}
							}
							if ( ( list[ identifier ] & Friend.Tree.Events.MOUSEMOVE ) != 0 )
							{
								self.tree.sendMessageToItem( root, item, 
								{ 
									command: 'mousemove', 
									type: 'mouse', 
									event: event,
									mouse: item.mouse
							} );
							}
						}
						else
						{
							if ( item.mouse.inside )
							{
								item.mouse.inside = false;
								if ( ( list[ identifier ] & Friend.Tree.Events.MOUSELEAVE ) != 0 )
								{
									self.tree.sendMessageToItem( root, item, 
									{ 
										command: 'mouseleave', 
										type: 'mouse', 
										event: event,
										mouse: item.mouse
									} );
								}
							}
						}
					}
				}
			}
			else
			{
				root.mouseInside = false;

				// Pokes the position in the items, and send message
				var list = root.events[ 'mouse' ];
				for ( identifier in list )
				{
					var item = self.allItems[ identifier ];
					if ( item.mouse.inside )
					{
						item.mouse.inside = false;
						if ( ( list[ identifier ] & Friend.Tree.Events.MOUSELEAVE ) != 0 )
						{
							self.tree.sendMessageToItem( root, item, 
							{ 
								command: 'mouseleave', 
								type: 'mouse', 
								event: event,
								mouse: item.mouse
							} );
						}
					}
				}
			}
		}
	}
	function onMouseEnter( event )
	{
		for ( var t = 0; t < self.tree.trees.length; t++ )
		{
			var root = self.tree.trees[ t ];

			// For the root
			root.mouseX = event.clientX - root.x;
			root.mouseY = event.clientY - root.y;

			if ( root.mouseX >= 0 && root.mouseX < root.width && root.mouseY >= 0 && root.mouseY < root.height )
			{
				root.mouseInside = true;
			}
			else
			{
				root.mouseInside = false;
			}
		}
	}
	function onMouseLeave( event )
	{
		for ( var t = 0; t < self.tree.trees.length; t++ )
		{
			var root = self.tree.trees[ t ];

			// For the root
			root.mouseX = event.clientX - root.x;
			root.mouseY = event.clientY - root.y;

			if ( root.mouseX >= 0 && root.mouseX < root.width && root.mouseY >= 0 && root.mouseY < root.height )
			{
				root.mouseInside = true;
			}
			else
			{
				root.mouseInside = false;
			}

			// Mouse leave to all items with the mouse inside
			var list = root.events[ 'mouse' ];
			for ( identifier in list )
			{
				var item = root.allItems[ identifier ];
				if ( item.mouse.inside )
				{
					item.mouse.inside = false;
					if ( ( list[ identifier ] & Friend.Tree.Events.MOUSELEAVE ) != 0 )
					{
						self.tree.sendMessageToItem( root, item, 
						{ 
							command: 'mouseleave', 
							type: 'mouse', 
							event: event
						} );
					}
				}
			}
		}
	}
	function onMouseWheel( event )
	{
		var delta = Math.max( -1, Math.min( 1, ( event.wheelDelta || -event.detail ) ) );
		for ( var t = 0; t < self.tree.trees.length; t++ )
		{
			var root = self.tree.trees[ t ];
			if ( root.mouseInside )
			{		
				// For each item
				var list = root.events[ 'mouse' ];
				for ( var identifier in list )
				{
					var item = root.allItems[ identifier ];
					if ( item.mouse.inside )
					{
						if ( ( list[ identifier ] & Friend.Tree.Events.MOUSEWHEEL ) != 0 )
						{
							self.tree.sendMessageToItem( root, item, 
							{ 
								command: 'mousewheel', 
								type: 'mouse', 
								delta: delta,
								event: event
							} );
						}
					}
				}
			}
		}
	}

	function onMouseDown( event )
	{
		for ( var t = 0; t < self.tree.trees.length; t++ )
		{
			var root = self.tree.trees[ t ];
			if ( root.mouseInside )
			{
				// For the root TODO: check validity
				root.mouseButtons = event.buttons;
				root.mouseX = event.clientX - root.x;
				root.mouseY = event.clientY - root.y;
				
				// For each item
				var list = root.events[ 'mouse' ];
				for ( var identifier in list )
				{
					var item = root.allItems[ identifier ];
					if ( item.renderItem )
					{
						item.mouse.x = root.mouseX - item.renderItem.rect.x;
						item.mouse.y = root.mouseY - item.renderItem.rect.y;	
						item.mouse.buttons = event.buttons;
						item.mouse.buttonsPrevious &= ~( 1 << event.button );
						if ( item.mouse.inside )
						{
							if ( ( list[ identifier ] & Friend.Tree.Events.MOUSEDOWN ) != 0 )
							{
								self.tree.sendMessageToItem( root, item, 
								{ 
									command: 'mousedown', 
									type: 'mouse', 
									mouse: item.mouse,
									event: event
								} );
							}
						}
					}
				}
			}
		}
	}
	function onMouseUp( event )
	{
		for ( var t = 0; t < self.tree.trees.length; t++ )
		{
			var root = self.tree.trees[ t ];
			if ( root.mouseInside )
			{
				// For the root
				root.mouseButtons = event.buttons;
				root.mouseX = event.clientX - root.x;
				root.mouseY = event.clientY - root.y;

				// For each item
				var list = root.events[ 'mouse' ];
				for ( var identifier in list )
				{
					var item = root.allItems[ identifier ];
					if ( item.renderItem )
					{
						item.mouse.x = root.mouseX - item.renderItem.rect.x;
						item.mouse.y = root.mouseY - item.renderItem.rect.y;	
						item.mouse.buttons = event.buttons;
						item.mouse.buttonsPrevious &= ~( 1 << event.button );
						if ( item.mouse.inside )
						{
							if ( ( list[ identifier ] & Friend.Tree.Events.MOUSEUP ) != 0 )
							{
								self.tree.sendMessageToItem( root, item, 
								{ 
									command: 'mouseup', 
									type: 'mouse', 
									mouse: item.mouse,
									event: event
								} );
							}
						}
					}
				}
			}
		}
	}
	function onClick( event )
	{
		for ( var t = 0; t < self.tree.trees.length; t++ )
		{
			var root = self.tree.trees[ t ];
			if ( root.mouseInside )
			{
				// For the root TODO: check validity
				root.mouseButtons = event.buttons;
				root.mouseX = event.clientX - root.x;
				root.mouseY = event.clientY - root.y;
				
				// For each item
				var list = root.events[ 'mouse' ];
				for ( var identifier in list )
				{
					var item = root.allItems[ identifier ];
					if ( item.renderItem )
					{
						item.mouse.x = root.mouseX - item.renderItem.rect.x;
						item.mouse.y = root.mouseY - item.renderItem.rect.y;	
						item.mouse.buttons = event.buttons;
						item.mouse.buttonsPrevious &= ~( 1 << event.button );
						if ( item.mouse.inside )
						{
							if ( ( list[ identifier ] & Friend.Tree.Events.CLICK ) != 0 )
							{
								self.tree.sendMessageToItem( root, item, 
								{ 
									command: 'click', 
									type: 'mouse', 
									mouse: item.mouse,
									event: event
								} );
							}
						}
					}
				}
			}
		}
	}
	function onDblClick( event )
	{
		for ( var t = 0; t < self.tree.trees.length; t++ )
		{
			var root = self.tree.trees[ t ];

			// For the root TODO: check validity
			root.mouseX = event.clientX - root.x;
			root.mouseY = event.clientY - root.y;
			
			if ( root.mouseInside )
			{
				// For each item
				var list = root.events[ 'mouse' ];
				for ( var identifier in list )
				{
					var item = root.allItems[ identifier ];
					if ( item.renderItem )
					{
						item.mouse.x = root.mouseX - item.renderItem.rect.x;
						item.mouse.y = root.mouseY - item.renderItem.rect.y;	
						item.mouse.buttons = event.buttons;
						item.mouse.buttonsPrevious &= ~( 1 << event.button );
						if ( item.mouse.inside )
						{
							if ( ( list[ item.identifier ] & Friend.Tree.Events.DBLCLICK ) != 0 )
							{
								self.tree.sendMessageToItem( root, item, 
								{ 
									command: 'dblclick', 
									type: 'mouse', 
									mouse: item.mouse,
									event: event
								} );
							}
						}
					}
				}
			}
		}
	}
	function onContextMenu( event )
	{
		for ( var t = 0; t < self.tree.trees.length; t++ )
		{
			var root = self.tree.trees[ t ];

			// For the root TODO: check validity
			root.mouseX = event.clientX - root.x;
			root.mouseY = event.clientY - root.y;
			root.mouse = event.buttons;

			if ( root.mouseInside )
			{
				// For each item
				var list = root.events[ 'mouse' ];
				for ( var identifier in list )
				{					
					var item = root.allItems[ identifier ];
					if ( item.renderItem )
					{
						item.mouse.x = root.mouseX - item.renderItem.rect.x;
						item.mouse.y = root.mouseY - item.renderItem.rect.y;	
						item.mouse.buttons = event.buttons;
						item.mouse.buttonsPrevious &= ~( 1 << event.button );
						if ( item.mouse.inside )
						{
							if ( ( list[ item.identifier ] & Friend.Tree.Events.CONTEXTMENU ) != 0 )
							{
								self.tree.sendMessageToItem( root, item, 
								{ 
									command: 'contextmenu', 
									type: 'mouse', 
									mouse: item.mouse,
									event: event 
								} );
							}
						}
					}
				}
			}
		}
		event.cancelBubble = true;
	}

	function onKeyDown( event )
	{
		if ( event.defaultPrevented || event.repeat )
		{
			return;
		}

		for ( var t = 0; t < self.tree.trees.length; t++ )
		{
			var root = self.tree.trees[ t ];

			// Pokes data into root
			root.modifiers = 0;
			root.modifiers |= event.shiftKey ? Friend.Tree.Events.SHIFT : 0; 
			root.modifiers |= event.altKey ? Friend.Tree.Events.ALT : 0; 
			root.modifiers |= event.ctrlKey ? Friend.Tree.Events.CONTROL : 0; 
			root.modifiers |= event.metaKey ? Friend.Tree.Events.META : 0; 
			root.keymap[ event.keyCode ] = true;

			// For each item
			var list = root.events[ 'keyboard' ];
			for ( var identifier in list )
			{					
				var item = root.allItems[ identifier ];
				item.keyboard.keymapPrevious[ event.code ] = false;
				item.keyboard.modifiers = root.modifiers;
				if ( ( list[ item.identifier ] & Friend.Tree.Events.KEYDOWN ) != 0 )
				{
					self.tree.sendMessageToItem( root, item, 
					{ 
						command: 'keydown', 
						type: 'keyboard', 
						event: event,
						keyCode: event.keyCode
					} );
				}
			}

			// Call the controller object?
			if ( root.controller )
			{
				self.tree.sendMessageToItem( root, root.controller, 
				{ 
					command: 'keydown', 
					type: 'system', 
					event: event,
					keyCode: event.keyCode,
					flags: Friend.Tree.Events.JOYSTICKDOWN
				} );
			}
		}
	};
	function onKeyUp( event )
	{
		if ( event.defaultPrevented || event.repeat )
		{
			return;
		}

		for ( var t = 0; t < self.tree.trees.length; t++ )
		{
			var root = self.tree.trees[ t ];

			// Pokes data into root
			root.modifiers = 0;
			root.modifiers |= event.shiftKey ? Friend.Tree.Events.SHIFT : 0; 
			root.modifiers |= event.altKey ? Friend.Tree.Events.ALT : 0; 
			root.modifiers |= event.ctrlKey ? Friend.Tree.Events.CONTROL : 0; 
			root.modifiers |= event.metaKey ? Friend.Tree.Events.META : 0; 
			root.keymap[ event.keyCode ] = 0;

			// For each item
			var list = root.events[ 'keyboard' ];
			for ( var identifier in list )
			{					
				var item = root.allItems[ identifier ];
				item.keyboard.keymapPrevious[ event.code ] = false;
				item.keyboard.modifiers = root.modifiers;
				if ( ( list[ item.identifier ] & Friend.Tree.Events.KEYUP ) != 0 )
				{
					self.tree.sendMessageToItem( root, item, 
					{ 
						command: 'keyup', 
						type: 'keyboard', 
						event: event,
						keyCode: event.keyCode
					} );
				}
			}

			// Call the controller object?
			if ( root.controller )
			{
				self.tree.sendMessageToItem( root, root.controller, 
				{ 
					command: 'keyup', 
					type: 'system', 
					event: event,
					keyCode: event.keyCode,
					flags: Friend.Tree.Events.JOYSTICKUP
				} );
			}
		}
	};
}

// Control flags
Friend.Tree.Events.MOUSEMOVE = 0x00000001;
Friend.Tree.Events.MOUSELEAVE = 0x00000002;
Friend.Tree.Events.MOUSEENTER = 0x00000004;
Friend.Tree.Events.MOUSEDOWN = 0x00000008;
Friend.Tree.Events.MOUSEUP = 0x00000010;
Friend.Tree.Events.CLICK = 0x00000020;
Friend.Tree.Events.DBLCLICK = 0x00000040;
Friend.Tree.Events.CONTEXTMENU = 0x00000080;
Friend.Tree.Events.MOUSEWHEEL = 0x00000100;
Friend.Tree.Events.MOUSE = 0x00000FFF;
Friend.Tree.Events.KEYDOWN = 0x00001000;
Friend.Tree.Events.KEYUP = 0x00002000;
Friend.Tree.Events.KEYS = 0x00003000;
Friend.Tree.Events.JOYSTICKDOWN = 0x00004000;
Friend.Tree.Events.JOYSTICKUP = 0x00008000;
Friend.Tree.Events.JOYSTICK = 0x0000C000;
Friend.Tree.Events.DORMANTEXECUTE = 0x00010000;

/**
 * initRoot
 * 
 * Initialize events for a tree
 */
Friend.Tree.Events.initRoot = function( root )
{
	// Array with the registrations for items
	root.events = {};

	// Mouse
	root.mouseX = 0;
	root.mouseY = 0;
	root.mouse = 0;
	root.mouseInside = false;

	// Keyboard
	root.keymap = [];
	for ( var c = 0; c < 256; c++ )
		root.keymap[ c ] = 0;
	root.modifiers = 0;
};

/**
 * Register Event
 * 
 * Allocates the event for a specific tree
 */
Friend.Tree.Events.prototype.registerEvents = function( item, eventNames, flags )
{
	var self = this; 

	// Undefined -> everything!
	if ( typeof flags == 'undefined' )
		flags = 0xFFFFFFFF;

	if ( typeof eventNames == 'string' )
		doRegister( eventNames, flags );
	else
	{
		for ( var count = 0; count < eventNames.length; count++ )
		{
			doRegister( eventNames[ count ], flags );
		}
	}

	function doRegister( name, flags )
	{
		var root = item.root;
		if ( root )
		{
			// Branch the event
			if ( !root.events[ name ] )
				root.events[ name ] = {};
			root.events[ name ][ item.identifier ] = flags;

			// Special cases
			switch ( name )
			{
				case 'mouse':
					item.mouse = new Friend.Tree.Mouse();
					break;	
				case 'keyboard':
					item.keyboard = new Friend.Tree.Keyboard();
					break;
				case 'controller':
					if ( !root.controller )
						root.controller = new Friend.Tree.Controller( self.tree, 'Controller', { root: root, parent: root } );
					item.controller = root.controller;
					break;
				default:
					break;
			}
		}
	}
}
Friend.Tree.Events.prototype.cancelEvent = function( item, eventName )
{
	var root = item.root;
	if ( root )
	{
		if ( root.events )
		{
			if ( root.events[ eventName ] )
			{
				if ( root.events[ eventName ][ item.identifier ] )
				{
					root.events[ eventName ][ item.identifier ] = false;
					root.events[ eventName ] = Friend.Tree.Utilities.cleanArray( root.events[ eventName ] );
				}	
			}
		}
	}
}
Friend.Tree.Events.prototype.cancelAllEvents = function( item )
{
	var root = item.root;
	if ( root )
	{
		for ( var eventName in root.events )
		{
			var flag = false;
			for ( var identifier in root.events[ eventName ] )
			{
				if ( identifier == item.identifier )
				{
					root.events[ eventName ][ identifier ] = false;
					flag = true;
				}
			}
			if ( flag )
			{
				root.events[ eventName ] = Friend.Tree.Utilities.cleanArray( root.events[ eventName ] );
			}
		}
	}
}
Friend.Tree.Events.prototype.setEvent = function( item, eventName, flags )
{
	var root = destination.root;
	if ( root )
	{
		if ( root.events )
		{
			if ( typeof eventName != 'undefined' && root.events[ eventName ] )
			{
				if ( root.events[ eventName ][ item.identifier ] )
				{
					root.events[ eventName ][ item.identifier ] = flags;	
				}
			}
		}
	}
};

Friend.Tree.Events.prototype.sendEvent = function( eventName, flag, message )
{
	for ( var t = 0; t < this.tree.trees.length; t++ )
	{
		var root = this.tree.trees[ t ];

		// For each item registered to event
		var list = root.events[ eventName ];
		for ( var identifier in list )
		{					
			var item = root.allItems[ identifier ];
			if ( ( list[ item.identifier ] & flag ) != 0 )
			{
				this.tree.sendMessageToItem( root, item, message );
			}
		}
	}
};

Friend.Tree.Events.prototype.sendSystemEvent = function( message )
{
	message.type = 'system';
	for ( var t = 0; t < this.tree.trees.length; t++ )
	{
		var root = this.tree.trees[ t ];
		this.tree.sendMessageToTree( root, message );
	}
};




// Keyboard object within the items
///////////////////////////////////////////////////////////////////////////////
Friend.Tree.Keyboard = Friend.Tree.Keyboard || {};

Friend.Tree.Keyboard = function()
{
	this.keymap = [];
	this.keymapPrevious = [];
	this.modifiers = 0;

	for ( var c = 0; c < 256; c++ )
		this.keymapPrevious[ c ] = 0;
}
Friend.Tree.Keyboard.prototype.isKeyDown = function( code )
{
	return this.keymap[ code ];
};
Friend.Tree.Keyboard.prototype.isKeyUp = function( code )
{
	return !this.keymap[ code ];
};
Friend.Tree.Keyboard.prototype.isKeyPressed = function( code )
{
	if ( this.keymap[ code ] )
	{
		if ( this.keymapPrevious[ code ] == false )
		{
			this.keymapPrevious[ code ] = true;
			return true;
		}
	}
	return false;
};
Friend.Tree.Keyboard.prototype.isKeyReleased = function( code )
{
	if ( !this.keymap[ code ] )
	{
		if ( this.keymapPrevious[ code ] == false )
		{
			this.keymapPrevious[ code ] = true;
			return true;
		}
	}
	return false;
};

// Mouse object within the items
///////////////////////////////////////////////////////////////////////////////

Friend.Tree.Mouse = Friend.Tree.Mouse || {};

// Modifiers flags
Friend.Tree.Mouse.LEFTKEY = 0x00000001;
Friend.Tree.Mouse.MIDDLEKEY = 0x00000002;
Friend.Tree.Mouse.RIGHTKEY = 0x00000004;
Friend.Tree.Mouse.SHIFT = 0x00000001;
Friend.Tree.Mouse.ALT = 0x00000002;
Friend.Tree.Mouse.CONTROL = 0x00000008;
Friend.Tree.Mouse.META = 0x00000010;

Friend.Tree.Mouse = function()
{
	this.x = 0;
	this.y = 0;
	this.inside = false;
	this.buttons = 0;
	this.buttonsPrevious = 0;
}
Friend.Tree.Mouse.prototype.getMouseCoords = function()
{
	return { x: this.x, y: this.y };
};
Friend.Tree.Mouse.prototype.isKeyDown = function( code )
{
	return ( this.buttons & code ) != 0;
};
Friend.Tree.Mouse.prototype.isKeyUp = function( code )
{
	return ( this.buttons & code ) == 0;
};
Friend.Tree.Mouse.prototype.isKeyPressed = function( code )
{
	if ( ( this.buttons & code ) != 0 )
	{
		if ( ( this.buttonsPrevious & code ) == 0 )
		{
			this.buttonsPrevious |= code;
			return true;
		}
	}
};
Friend.Tree.Mouse.prototype.isKeyUp = function( code )
{
	if ( ( this.buttons & code ) == 0 )
	{
		if ( ( this.buttonsPrevious & code ) == 0 )
		{
			this.buttonsPrevious |= code;
			return true;
		}
	}
	return false;
};
