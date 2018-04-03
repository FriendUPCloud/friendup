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

Friend.Tree.UI.ColorBox = function( tree, name, flags )
{
    this.color = false;
	this.renderItemName = 'Friend.Tree.UI.RenderItems.ColorBox';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.ColorBox', flags );
};
Friend.Tree.UI.ColorBox.messageUp = function( message )
{
    return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'rotation', 'color' ] );
};
Friend.Tree.UI.ColorBox.messageDown = function( message )
{
    return this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'rotation', 'color' ] );
};


Friend.Tree.UI.RenderItems.ColorBox_Three2D = function( tree, name, properties )
{
    this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Three2D';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.ColorBox_Three2D', properties );
};
Friend.Tree.UI.RenderItems.ColorBox_Three2D.render = function( properties )
{
    this.thisRect.fillRectangle( properties, this.parent.color );
	return properties;
};

Friend.Tree.UI.RenderItems.ColorBox_HTML = function( tree, name, properties )
{
    this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_HTML';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.ColorBox_HTML', properties );
};
Friend.Tree.UI.RenderItems.ColorBox_HTML.render = Friend.Tree.UI.RenderItems.ColorBox_Three2D.render;


Friend.Tree.UI.RenderItems.ColorBox_Canvas2D = function( tree, name, properties )
{
    this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Canvas2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.ColorBox_Canvas2D', properties );
	this.render = Friend.Tree.UI.RenderItems.ColorBox_Three2D.render;
};
Friend.Tree.UI.RenderItems.ColorBox_Canvas2D.render = Friend.Tree.UI.RenderItems.ColorBox_Three2D.render;
