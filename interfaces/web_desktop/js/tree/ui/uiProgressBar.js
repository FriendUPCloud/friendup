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

Friend.Tree.UI.ProgressBar = function ( tree, name, properties )
{
	this.position = 50;
	this.size = 100;
	this.direction = Friend.Tree.DIRECTION_RIGHT;
	this.renderItemName = 'Friend.Tree.UI.RenderItems.ProgressBar';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.ProgressBar', properties );
};
Friend.Tree.UI.ProgressBar.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z', 'color', 'backColor', 'borderColor', 'borderSize', 'rotation', 'image' ] );
};
Friend.Tree.UI.ProgressBar.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'rotation', 'color', 'backColor', 'borderColor', 'borderSize' ] );
};
Friend.Tree.UI.ProgressBar.setPosition = function ( position )
{
	if ( position != this.position )
	{
		if ( position < 0 )
			position = 0;
		if ( position > this.size )
			position = this.size;
		this.position = position;
		this.doRefresh();
	}
};
Friend.Tree.UI.ProgressBar.getPosition = function ()
{
	return this.position;
};
Friend.Tree.UI.ProgressBar.setSize = function ( size )
{
	this.size = size;
	this.doRefresh();
}
Friend.Tree.UI.ProgressBar.getSize = function ()
{
	return this.size;
}

Friend.Tree.UI.RenderItems.ProgressBar_Three2D = function ( tree, name, properties )
{
	this.backColor = '#FF0000';
	this.color = '#FFFF00';
	this.borderColor = '#000000';
	this.borderSize = '1';
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Three2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.ProgressBar_Three2D', properties );
};
Friend.Tree.UI.RenderItems.ProgressBar_Three2D.render = function ( properties )
{
	var rect = new Friend.Tree.Utilities.Rect( this.thisRect );
	if ( this.borderSize && typeof this.borderColor != 'undefined' )
	{
		rect.drawRectangle( properties, this.borderColor, this.borderSize );
		rect.shrink( - this.borderSize, - this.borderSize )
	}
	if ( typeof this.backColor != 'undefined' )
		rect.drawBox( properties, this.backColor );

	switch ( this.parent.direction )
	{
		case Friend.Tree.DIRECTION_RIGHT:
			rect.width = this.parent.position / this.parent.size * rect.width;
			break;
		case Friend.Tree.DIRECTION_LEFT:
			rect.x = rect.x + rect.width - ( this.parent.position / this.parent.size * rect.width );
			rect.width = this.parent.position / this.parent.size * rect.width;
			break;
		case Friend.Tree.DIRECTION_DOWN:
			rect.height = this.parent.position / this.parent.size * rect.height;
			break;
		case Friend.Tree.DIRECTION_UP:
			rect.y = rect.y + rect.height - ( this.parent.position / this.parent.size * rect.height );
			rect.height = this.parent.position / this.parent.size * rect.height;
			break;
	}
	rect.drawBox( properties, this.color );

	return properties;
};

Friend.Tree.UI.RenderItems.ProgressBar_HTML = function ( tree, name, properties )
{
	this.backColor = '#FF0000';
	this.color = '#FFFF00';
	this.borderColor = '#000000';
	this.borderSize = '1';
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_HTML';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.ProgressBar_HTML', properties );
};
Friend.Tree.UI.RenderItems.ProgressBar_HTML.render = Friend.Tree.UI.RenderItems.ProgressBar_Three2D.render;

Friend.Tree.UI.RenderItems.ProgressBar_Canvas2D = function ( tree, name, properties )
{
	this.backColor = '#FF0000';
	this.color = '#FFFF00';
	this.borderColor = '#000000';
	this.borderSize = '1';
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Canvas2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.ProgressBar_Canvas2D', properties );
};
Friend.Tree.UI.RenderItems.ProgressBar_Canvas2D.render = Friend.Tree.UI.RenderItems.ProgressBar_Three2D.render;
