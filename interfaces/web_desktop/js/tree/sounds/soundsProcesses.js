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
