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

Friend.Tree.UI.ColorBox = function( tree, name, flags )
{
    this.color = '#808080';
    this.sizeBorder = 0;
    this.colorBorder = '#FFFFFF';
    this.renderSubItems = false;
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


Friend.Tree.UI.RenderItems.ColorBox_HTML = function( tree, name, properties )
{
	this.color = false;
    this.sizeBorder = false;
	this.colorBorder = false;
	
    this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_HTML';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.ColorBox_HTML', properties );

	this.width = 32;
	this.height = 32;
	this.item.width = this.width;
	this.item.height = this.height;
};
Friend.Tree.UI.RenderItems.ColorBox_HTML.render = function( properties )
{
	this.thisRect.drawBox( properties, this.item.color, this.item.colorBorder, this.item.sizeBorder );

	// Allow rendering in parent
	if ( this.item.renderSubItems )
        properties.renderInParent = properties.rendererItem;

	return properties;
};
Friend.Tree.UI.RenderItems.ColorBox_HTML.message = function ( message )
{
	switch ( message.command )
	{
		/*
		case 'resize':
			if ( message.width )
			{
				this.width = message.width;
				this.item.width = message.width;
			}
			if ( message.height )
			{
				this.height = message.height;
				this.item.height = message.height;
			}
            this.item.doRefresh();
			break;
		*/
		default:
			break;
	}
	return false;
}


Friend.Tree.UI.RenderItems.ColorBox_Canvas2D = function( tree, name, properties )
{
	this.color = false;
    this.sizeBorder = false;
	this.colorBorder = false;
	
    this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Canvas2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.ColorBox_Canvas2D', properties );
	this.render = Friend.Tree.UI.RenderItems.ColorBox_Three2D.render;

	this.width = 32;
	this.height = 32;
	this.item.width = this.width;
	this.item.height = this.height;
};
Friend.Tree.UI.RenderItems.ColorBox_Canvas2D.render = Friend.Tree.UI.RenderItems.ColorBox_HTML.render;
