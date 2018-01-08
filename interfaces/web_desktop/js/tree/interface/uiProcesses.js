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
 * Tree engine interface processes
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 18/08/2017
 */
Friend = window.Friend || {};
Friend.UI = Friend.UI || {};
Friend.Flags = Friend.Flags || {};

Friend.UI.GestureButton = function( tree, object, flags )
{
	this.noMouseOver = false;
	this.noDown = false;
	this.noClick = false;
	this.noDoubleClick = false;
	Friend.Tree.Processes.init( this, tree, object, 'Friend.UI.GestureButton', flags );
	Object.assign( this, Friend.UI.GestureButton );

	this.mouseOver = false;
	this.down = false;
	this.click = false;
	this.doubleClick = false;
}
Friend.UI.GestureButton.processUp = function ( flags )
{
	if ( !flags.command && !this.object.toDestroy && this.object.rect )
	{
		var ret = false;
		var coords = this.object.getMouseCoords();
		var mouseX = coords.x;
		var mouseY = coords.y;
		if ( this.object.rect.isPointIn( mouseX, mouseY ) )
		{
			console.log( 'Mouse over!' );
			if ( ! this.mouseOver )
				ret = true;
			this.mouseOver = true;
			var value = 0;
			if ( typeof flags.value != 'undefined' )
				value = flags.value;
			if ( this.controller.isMouseDown() )
			{
				if ( !this.down )
				{
					ret = true;
					this.down = true;
				}
			}
			else
			{
				if ( this.down )
				{
					this.down = false;
					if ( !this.noClick && flags.onClick && flags.caller )
						flags.onClick.apply( flags.caller, [ this.object, this.object.getValue(), { x: mouseX, y: mouseY } ] );
				}
			}
			if ( this.controller.isDoubleClick() )
			{
				ret = true;
				this.down = false;
				if ( !this.noDoubleClick && flags.onDoubleClick && flags.caller )
					flags.onDoubleClick.apply( flags.caller, [ this.object, this.object.getValue(), { x: mouseX, y: mouseY } ] );
			}
		}
		else
		{
			if ( this.mouseOver )
				ret = true;
			this.mouseOver = false;
			this.down = false;
		}
		if ( ret )
		{
			if ( ! this.noDown )
				flags.down = this.down;
			if ( !this.noMouseOver )
				flags.mouseOver = this.mouseOver;
			flags.refresh = true;
		}
	}
	return flags;
};
Friend.UI.GestureButton.processDown = function ( flags )
{
	return flags;
};
