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
 * Tree engine interface elements
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.UI = Friend.Tree.UI || {};
Friend.Tree.UI.RenderItems = Friend.Tree.UI.RenderItems || {};

Friend.Tree.UI.Arrow = function ( tree, name, properties )
{
	this.colorBack = '#808080';
	this.colorBright = '#C0C0C0';
	this.colorDark = '#404040';
	this.color = 'black';
	this.colorDown = '#C0C0C0';
	this.colorMouseOver = '#A0A0A0';
	this.direction = 'top';
	this.size = 6;
	this.onClick = false;
	this.onChange = false;
	this.caller = false;
	this.down = false;
	this.mouseOver = false;

	this.renderItemName = 'Friend.Tree.UI.RenderItems.Arrow';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.D2Arrow', properties );

	// Add default Gesture process
	this.addProcess( new Friend.Tree.UI.GestureButton( this.tree, this, properties ) );
};
Friend.Tree.UI.Arrow.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z', 'color', 'colorBack', 'colorBright', 'colorDark', 'size', 'direction', 'down', 'mouseOver', 'caller', 'onClick' ] );
};
Friend.Tree.UI.Arrow.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'color', 'colorBack', 'colorBright', 'colorDark', 'size', 'direction', 'down', 'mouseOver' ] );
};
Friend.Tree.UI.Arrow.getValue = function ()
{
	return this.down;
};


Friend.Tree.UI.RenderItems.Arrow_HTML = function ( tree, name, properties )
{
	this.colorBack = false;
	this.colorBright = false;
	this.colorDark = false;
	this.color = false;
	this.colorDown = false;
	this.colorMouseOver = false;
	this.direction = false;
	this.size = false;

	this.onClick = false;
	this.onChange = false;
	this.caller = false;
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_HTML';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Arrow_HTML', properties );

	// Default size
	this.width = 16;						// To be stored in theme!
	this.item.width = this.width;
	this.height = 16;
	this.item.height = this.height;
};
Friend.Tree.UI.RenderItems.Arrow_HTML.render = function ( properties )
{
	// Draw the box
	var color = this.item.colorBack;
	if ( this.item.mouseOver )
		color = this.item.colorMouseOver;
	if ( this.item.down )
		color = this.item.colorDown;
	this.thisRect.drawHilightedBox( properties, color, this.item.colorBright, this.item.colorDark );

	// Draw the arrow
	var rect = new Friend.Tree.Utilities.Rect( this.thisRect );
	rect.shrink( this.width - this.size, this.height - this.size );
	rect.drawFilledTriangle( properties, this.item.direction, this.item.color );

	// Allow rendering in parent
	if ( this.item.renderSubItems )
		properties.renderInParent = properties.rendererItem;

	return properties;
};

Friend.Tree.UI.RenderItems.Arrow_Canvas2D = function ( tree, name, properties )
{
	this.color = false;
	this.colorBack = false;
	this.colorBright = false;
	this.colorDark = false;
	this.colorDown = false;
	this.colorMouseOver = false;
	this.direction = false;
	this.size = false;

	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Canvas2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Arrow_Canvas2D', properties );
};
Friend.Tree.UI.RenderItems.Arrow_Canvas2D.render = Friend.Tree.UI.RenderItems.Arrow_HTML.render;
