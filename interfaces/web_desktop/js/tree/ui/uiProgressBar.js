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
	this.color = '#FFFF00';
	this.colorBack = '#FF0000';
	this.colorBorder = '#000000';
	this.sizeBorder = 1;
	this.position = 50;
	this.size = 100;
	this.direction = Friend.Tree.DIRECTION_RIGHT;

	this.renderItemName = 'Friend.Tree.UI.RenderItems.ProgressBar';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.ProgressBar', properties );
};
Friend.Tree.UI.ProgressBar.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z', 'color', 'colorBack', 'colorBorder', 'sizeBorder', 'rotation', 'image' ] );
};
Friend.Tree.UI.ProgressBar.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'rotation', 'color', 'colorBack', 'colorBorder', 'sizeBorder' ] );
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


Friend.Tree.UI.RenderItems.ProgressBar_HTML = function ( tree, name, properties )
{
	this.color = false;
	this.colorBack = false;
	this.colorBorder = false;
	this.sizeBorder = false;
	this.position = false;
	this.size = false;

	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_HTML';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.ProgressBar_HTML', properties );

	this.width = 320;
	this.height = 200;
	this.item.width = this.width;
	this.item.height = this.height;
};
Friend.Tree.UI.RenderItems.ProgressBar_HTML.render = function ( properties )
{
	var rect = new Friend.Tree.Utilities.Rect( this.thisRect );
	if ( this.item.sizeBorder && typeof this.item.colorBorder != 'undefined' )
	{
		rect.drawRectangle( properties, this.item.colorBorder, this.item.sizeBorder );
		rect.shrink( - this.item.sizeBorder, - this.item.sizeBorder )
	}
	if ( typeof this.item.colorBack != 'undefined' )
		rect.drawBox( properties, this.item.colorBack );

	switch ( this.item.direction )
	{
		case Friend.Tree.DIRECTION_RIGHT:
			rect.width = this.item.position / this.item.size * rect.width;
			break;
		case Friend.Tree.DIRECTION_LEFT:
			rect.x = rect.x + rect.width - ( this.item.position / this.item.size * rect.width );
			rect.width = this.item.position / this.item.size * rect.width;
			break;
		case Friend.Tree.DIRECTION_DOWN:
			rect.height = this.item.position / this.item.size * rect.height;
			break;
		case Friend.Tree.DIRECTION_UP:
			rect.y = rect.y + rect.height - ( this.item.position / this.item.size * rect.height );
			rect.height = this.item.position / this.item.size * rect.height;
			break;
	}
	rect.drawBox( properties, this.item.color );

	return properties;
};

Friend.Tree.UI.RenderItems.ProgressBar_Canvas2D = function ( tree, name, properties )
{
	this.color = false;
	this.colorBack = false;
	this.colorBorder = false;
	this.sizeBorder = false;
	this.position = false;
	this.size = false;

	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Canvas2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.ProgressBar_Canvas2D', properties );
};
Friend.Tree.UI.RenderItems.ProgressBar_Canvas2D.render = Friend.Tree.UI.RenderItems.ProgressBar_Three2D.render;
