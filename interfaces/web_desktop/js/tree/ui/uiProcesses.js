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
Friend.Tree.UI = Friend.Tree.UI || {};
Friend.Flags = Friend.Flags || {};

Friend.Tree.UI.GestureButton = function( tree, item, flags )
{
	this.noMouseOver = false;
	this.noDown = false;
	this.noClick = false;
	this.noDoubleClick = false;
	Friend.Tree.Processes.init( tree, this, item, 'Friend.Tree.UI.GestureButton', flags );
	this.item.registerEvents( 'mouse' );

	this.mouseOver = false;
	this.down = false;
	this.click = false;
	this.doubleClick = false;
}
Friend.Tree.UI.GestureButton.processUp = function ( message )
{
	if ( message.type == 'mouse' )
	{
		var ret = false;
		switch( message.command )
		{
			case 'mouseenter':
				if ( !this.mouseOver )
				{
					ret = true;
					this.mouseOver = true;
				}
				break;
			case 'mouseleave':
				if ( this.mouseOver )
				{
					ret = true;
					this.mouseOver = false;
					this.down = false;
				}
				break;
			case 'click':
				if ( message.onClick && message.caller )
					message.onClick.apply( message.caller, [ this.item, this.item.getValue(), { x: message.mouse.x, y: message.mouse.y } ] );
				break;
			case 'dblclick':
				if ( message.onDoubleClick && message.caller )
					message.onDoubleClick.apply( message.caller, [ this.item, this.item.getValue(), { x: message.mouse.x, y: message.mouse.y } ] );
				break;
			case 'mousedown':
				if ( !this.down )
				{
					ret = true;
					this.down = true;
				}
				break;
			case 'mouseup':
				if ( this.down )
				{
					ret = true;
					this.down = false;
				}
				break;
		}
		if ( ret )
		{
			message.down = this.down;
			message.mouseOver = this.mouseOver;
			message.refresh = true;
		}
	}
	return true;
};
Friend.Tree.UI.GestureButton.processDown = function ( message )
{
	return true;
};



Friend.Tree.UI.GestureCheckBox = function( tree, item, flags )
{
	Friend.Tree.Processes.init( tree, this, item, 'Friend.Tree.UI.GestureCheckBox', flags );
	this.item.registerEvents( 'mouse' );

	this.mouseOver = this.item.mouseOver;
	this.down = this.item.down;
	this.value = this.item.value;
}
Friend.Tree.UI.GestureCheckBox.processUp = function ( message )
{
	if ( message.type == 'mouse' )
	{
		var ret = false;
		switch( message.command )
		{
			case 'mouseenter':
				if ( !this.mouseOver )
				{
					ret = true;
					this.mouseOver = true;
				}
				break;
			case 'mouseleave':
				if ( this.mouseOver )
				{
					ret = true;
					this.mouseOver = false;
					this.down = false;
				}
				break;
			case 'click':
				ret = true;
				this.down = true;
				this.value = 1 - this.value;
				if ( this.onClick )
					this.onClick.apply( this.caller, [ this.value ] );
				break;
			case 'mousedown':
				if ( !this.down )
				{
					ret = true;
					this.down = true;
				}
				break;
			case 'mouseup':
				if ( this.down )
				{
					ret = true;
					this.down = false;
				}
				break;
		}
		if ( ret )
		{
			message.down = this.down;
			message.mouseOver = this.mouseOver;
			message.value = this.value;
			message.refresh = true;
		}
	}
	return true;
};
Friend.Tree.UI.GestureCheckBox.processDown = function ( message )
{
	return true;
};


Friend.Tree.UI.GestureList = function( tree, item, flags )
{
	Friend.Tree.Processes.init( tree, this, item, 'Friend.Tree.UI.GestureList', flags );
	this.item.registerEvents( 'mouse' );
}
Friend.Tree.UI.GestureList.processUp = function ( message )
{
	var renderItem = this.item.renderItem; 
	if ( renderItem.className != 'Friend.Tree.UI.RenderItems.List' )
		return;

	var options = this.item.options;
	if ( message.type == 'mouse' )
	{
		debugger;
		switch( message.command )
		{
			case 'mouseleave':
				for ( var o = 0; o < options.length; o++ )
					options[ o ].mouseOver = false;
				message.refresh = true;
				break;
			case 'mouseMove':
				for ( var o = this.item.renderItem.position; o < options.length; o++ )
				{
					if ( renderItem.rects[ o ].isPointIn( this.item.mouse.x, this.item.mouse.y ) )
						this.item.options[ o ].mouseOver = true;
					else
						this.item.options[ o ].mouseOver = false;
				}
				message.refresh = true;
				break;
			case 'click':
				for ( var o = this.item.renderItem.position; o < options.length; o++ )
				{
					if ( renderItem.rects[ o ].isPointIn( this.item.mouse.x, this.item.mouse.y ) )
					{
						this.item.options[ o ].down = 1 - this.item.options[ o ].down;
						if ( message.onClick )
							message.onClick.apply( message.caller, [ o ] );
						break;
					}
				}
				message.refresh = true;
				break;
			case 'dblclick':
				for ( var o = this.item.renderItem.position; o < options.length; o++ )
				{
					if ( renderItem.rects[ o ].isPointIn( this.item.mouse.x, this.item.mouse.y ) )
					{
						if ( message.onDoubleClick )
							message.onDoubleClick.apply( message.caller, [ o ] );
						break;
					}
				}
				message.refresh = true;
				break;
		}
	}
	return true;
};
Friend.Tree.UI.GestureList.processDown = function ( message )
{
	return true;
};
