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
 * Tree engine sound elements
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.Sounds = Friend.Tree.Sounds || {};
Friend.Tree.Sounds.RenderItems = Friend.Tree.Sounds.RenderItems || {};

/**
 * Process: plays a sound when a key is down
 *
 * Add this process to a sound item to have automatic playing when a key is pressed
 *
 * @param { object } tree The tree object
 * @param { object } object The object to modifiy
 * @param { object } flags Creation flags
 *
 * Flags
 *
 * key: (number) Controller identifier of the key to poll
 * keys: (array of numbers) List of Controller keys to poll
 * keepAtEnd: (boolean) true and the sound will be left playin when the key is released, false and the sound will be stopped
 */
Friend.Tree.Sounds.PlayWhenJoystickDown = function( tree, item, properties )
{
	this.joystick = false;
	this.keepAtEnd = false;
	this.keys = 0;
	Friend.Tree.Processes.init( tree, this, item, 'Friend.Tree.Sounds.PlayWhenJoystickDown', properties );

	// Register key events for the item
	this.item.registerEvents( 'controller' );
	this.down = false;
}
Friend.Tree.Sounds.PlayWhenJoystickDown.processUp = function ( message )
{
	var down = this.down;
	if ( message.command == 'joystickdown' ) 
 	{
		for ( var key = 0; key < this.keys.length; key ++ )
		{
			if ( message.code == this.keys[ key ] )
			{
				down = true;
				break;
			}
		}
	}
	if ( message.command == 'joystickup' )
	{
		for ( var key = 0; key < this.keys.length; key ++ )
		{
			if ( message.code == this.keys[ key ] )
			{
				down = false;
				break;
			}
		}
	}
	if ( down != this.down )
	{
		this.down = down;
		if ( this.down )
			this.item.play();
		else
			this.item.stop();
	}
	return true;
};
Friend.Tree.Sounds.PlayWhenJoystickDown.processDown = function ( message )
{
	return message;
}
