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
	this.onClick = false;
	this.caller = false;
	this.renderItemName = 'Friend.Tree.UI.RenderItems.Arrow';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.D2Arrow', properties );
	this.down = false;
	this.mouseOver = false;

	// Add default Gesture process
	this.addProcess( new Friend.Tree.UI.GestureButton( this.tree, this, properties ) );
};
Friend.Tree.UI.Arrow.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z', 'color', 'backColor', 'brightColor', 'darkColor', 'size', 'direction', 'down', 'mouseOver', 'caller', 'onClick' ] );
};
Friend.Tree.UI.Arrow.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'color', 'backColor', 'brightColor', 'darkColor', 'size', 'direction', 'down', 'mouseOver' ] );
};
Friend.Tree.UI.Arrow.getValue = function ()
{
	return this.down;
};

Friend.Tree.UI.RenderItems.Arrow_Three2D = function ( tree, name, flags )
{
	this.backColor = '#808080';
	this.brightColor = '#C0C0C0';
	this.darkColor = '#404040';
	this.color = 'black';
	this.downColor = '#C0C0C0';
	this.mouseOverColor = '#A0A0A0';
	this.direction = 'top';
	this.size = 6;
	this.onClick = false;
	this.onChange = false;
	this.caller = false;
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Three2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Arrow_Three2D', flags );
};

Friend.Tree.UI.RenderItems.Arrow_Three2D.render = function ( properties )
{
	// Draw the box
	var color = this.backColor;
	if ( this.parent.mouseOver )
		color = this.mouseOverColor;
	if ( this.parent.down )
		color = this.downColor;
	this.thisRect.drawHilightedBox( properties, color, this.brightColor, this.darkColor );

	// Draw the arrow
	var rect = new Friend.Tree.Utilities.Rect( this.thisRect );
	rect.shrink( this.width - this.size, this.height - this.size );
	rect.drawFilledTriangle( properties, this.direction, this.color );
	return properties;
};

Friend.Tree.UI.RenderItems.Arrow_HTML = function ( tree, name, flags )
{
	this.backColor = '#808080';
	this.brightColor = '#C0C0C0';
	this.darkColor = '#404040';
	this.color = 'black';
	this.downColor = '#C0C0C0';
	this.mouseOverColor = '#A0A0A0';
	this.direction = 'top';
	this.size = 6;
	this.onClick = false;
	this.onChange = false;
	this.caller = false;
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_HTML';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Arrow_HTML', flags );
};
Friend.Tree.UI.RenderItems.Arrow_HTML.render = Friend.Tree.UI.RenderItems.Arrow_Three2D.render;

Friend.Tree.UI.RenderItems.Arrow_Canvas2D = function ( tree, name, flags )
{
	this.backColor = '#808080';
	this.brightColor = '#C0C0C0';
	this.darkColor = '#404040';
	this.color = 'black';
	this.downColor = '#C0C0C0';
	this.mouseOverColor = '#A0A0A0';
	this.direction = 'top';
	this.size = 6;
	this.onClick = false;
	this.onChange = false;
	this.caller = false;
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Canvas2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Arrow_Canvas2D', flags );
};
Friend.Tree.UI.RenderItems.Arrow_Canvas2D.render = Friend.Tree.UI.RenderItems.Arrow_Three2D.render;
