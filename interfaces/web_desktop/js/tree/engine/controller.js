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
 * Tree engine Controller - joystick / mouse / accelerometers / keyboard input
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 21/08/2017
 */
Friend = window.Friend || {};
Friend.Tree = Friend.Tree || {};
Friend.Tree.Controller = Friend.Tree.Controller || {};

/**
 * Controller object, manages keyboard, mouse, joystick and inputs
 *
 * @param (object) tree the Tree object
 */
Friend.Tree.Controller = function( tree, name, properties )
{
	if ( !properties.parent || ( properties.parent && properties.parent.parent != null ) )
	{
		Friend.Tree.log( this, { level: Friend.Tree.ERRORLEVEL_BREAK, error: 'A controller item can only be inserted on the root of a tree.' } )
	}
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Controller', properties );
	
	this.map =
	[
		{ keyCode: 38, joyCode: Friend.Tree.Controller.UP },
		{ keyCode: 40, joyCode: Friend.Tree.Controller.DOWN },
		{ keyCode: 39, joyCode: Friend.Tree.Controller.RIGHT },
		{ keyCode: 37, joyCode: Friend.Tree.Controller.LEFT },
		{ keyCode: 32, joyCode: Friend.Tree.Controller.FIRE1 },
		{ keyCode: 13, joyCode: Friend.Tree.Controller.FIRE2 }
	];
	this.input = 0;
	this.previousInput = 0;
	var self = this;
	return this;
};
Friend.Tree.Controller.LEFT = 0x00000001;
Friend.Tree.Controller.RIGHT = 0x00000002;
Friend.Tree.Controller.UP = 0x00000004;
Friend.Tree.Controller.DOWN = 0x00000008;
Friend.Tree.Controller.FIRE1 = 0x00000010;
Friend.Tree.Controller.FIRE2 = 0x00000020;

Friend.Tree.Controller.messageUp = function( message )
{
	var flag;
	switch ( message.command )
	{
		case 'refresh':
			this.joystickPrevious = this.joystick;
			flag = true;
			break;

		case 'keydown':
			for ( var key in this.map )
			{
				if ( message.event.keyCode == this.map[ key ].keyCode )
				{
					message.code = this.map[ key ].joyCode;
					this.joystick |= message.code;
					this.joystickPrevious &= ~message.code;
					message.command = 'joystickdown';
					message.type = 'controller';
					flag = true;
					break;
				}
			}
			break;
			
		case 'keyup':
			for ( var key in this.map )
			{
				if ( message.event.keyCode == this.map[ key ].keyCode )
				{
					message.code = this.map[ key ].joyCode;
					this.joystick &= ~message.code;
					this.joystickPrevious &= ~message.code;
					message.command = 'joystickup';
					message.type = 'controller';
					flag = true;
					break;
				}
			}
			break;
	}
	// If something happened, send messages to process (delays, combo keys etc.)
	if ( flag )
	{
		return this.startProcess( message, [ 'joystick', 'joystickPrevious' ] );
	}
	return false;
};
Friend.Tree.Controller.messageDown = function( message )
{
	// Gather new data
	this.endProcess( message, [ 'joystick', 'joystickPrevious' ] );

	// Still a message to send?
	if ( message.command == 'joystickup' || message.command == 'joystickdown' )
	{
		message.joystick = this.joystick;		// Restores value containing 'UPDATED'
		for ( var t = 0; t < this.tree.trees.length; t++ )
		{
			var root = this.tree.trees[ t ];

			// For each item that has registered
			var list = root.events[ 'controller' ];
			if ( list )
			{
				for ( identifier in list )
				{
					var item = root.allItems[ identifier ];
					if ( item && ( list[ identifier ] & message.flags ) != 0 )
					{
						message.type = 'controller';
						Friend.Tree.sendMessageToItem( root, item, message );
					}
				}
			}
		}
	}
};

/**
 * isDown
 *
 * Returns true if the joystick is pressed
 *
 * @param (number) key definition
 * @return true if the key is down, false if not
 */
Friend.Tree.Controller.isDown = function ( key )
{
	return ( this.joystick & key ) != 0;
};

/**
 * isUp
 *
 * Returns true if the joystick is not pressed
 *
 * @param (number) key definition
 * @return true if the key is down, false if not
 */
Friend.Tree.Controller.isUp = function ( key )
{
	return ( this.joystick & key ) == 0;
};

/**
 * isPressed
 *
 * Returns true if the joystick has just been pressed. (no repeat)
 *
 * @param (number) key definition
 * @return true if the key has been pressed, false if up
 */
Friend.Tree.Controller.isPressed = function ( key )
{
	if ( ( this.joystick & key ) != 0 )
	{
		if ( ( this.joystickPrevious & key ) == 0 )
		{
			this.joystickPrevious &= key;
			return true;
		}
	}
	return false;
};

/**
 * isReleased
 *
 * Returns true if the joystick has just been released. 
 *
 * @param (number) key definition
 * @return true if the key has been pressed, false if up
 */
Friend.Tree.Controller.isReleased = function ( key )
{
	if ( ( this.joystick & key ) == 0 )
	{
		if ( ( this.joystickPrevious & key ) == 0 )
		{
			this.joystickPrevious &= key;
			return true;
		}
	}
	return false;
};

