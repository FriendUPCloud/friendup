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

Friend.Tree.UI.TextBox = function ( tree, name, flags )
{
	this.text = 'My textbox text';
	this.renderItemName = 'Friend.Tree.UI.RenderItems.TextBox';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.TextBox', flags );
};
Friend.Tree.UI.TextBox.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z', 'font', 'text' ] );
};
Friend.Tree.UI.TextBox.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'font', 'text' ] );
};

Friend.Tree.UI.RenderItems.TextBox_Three2D = function ( tree, name, flags )
{
	this.tree = tree;

	this.font = '16px Arial';
	this.text = 'My textbox text';
	this.backColor = '#C0C0C0';
	this.brightColor = '#E0E0E0';
	this.darkColor = '#808080';
	this.textColor = '#000000';
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Three2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.TextBox_Three2D', flags );
};
Friend.Tree.UI.RenderItems.TextBox_Three2D.render = function ( flags )
{
	// Draw box
	this.thisRect.drawHilightedBox( flags, this.backColor, this.brightColor, this.darkColor );

	// Draw text
	flags.context.drawText( flags, this.rect.width / 2, this.rect.height / 2, this.parent.text, this.font, this.textColor );

	return flags;
};


Friend.Tree.UI.RenderItems.TextBox_HTML = function ( tree, name, flags )
{
	this.font = '12px Arial';
	this.backColor = '#C0C0C0';
	this.brightColor = '#E0E0E0';
	this.darkColor = '#808080';
	this.textColor = '#000000';
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_HTML';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.TextBox_HTML', flags );
};
Friend.Tree.UI.RenderItems.TextBox_HTML.render = Friend.Tree.UI.RenderItems.TextBox_Three2D.render;


Friend.Tree.UI.RenderItems.TextBox_Canvas2D = function ( tree, name, flags )
{
	this.font = '12px Arial';
	this.backColor = '#C0C0C0';
	this.brightColor = '#E0E0E0';
	this.darkColor = '#808080';
	this.textColor = '#000000';
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Canvas2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.TextBox_Canvas2D', flags );
};
Friend.Tree.UI.RenderItems.TextBox_Canvas2D.render = Friend.Tree.UI.RenderItems.TextBox_Three2D.render;
