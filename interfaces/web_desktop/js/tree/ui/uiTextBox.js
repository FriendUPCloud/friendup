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

Friend.Tree.UI.TextBox = function ( tree, name, properties )
{
    this.font = '12px sans serif';
	this.text = 'My textbox text';
	this.colorBack = '#C0C0C0';
	this.colorBright = '#E0E0E0';
	this.colorDark = '#808080';
	this.colorText = '#000000';

	this.renderItemName = 'Friend.Tree.UI.RenderItems.TextBox';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.TextBox', properties );
};
Friend.Tree.UI.TextBox.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z', 'font', 'text' ] );
};
Friend.Tree.UI.TextBox.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'font', 'text' ] );
};



Friend.Tree.UI.RenderItems.TextBox_HTML = function ( tree, name, properties )
{
	this.text = false;
	this.font = false;
	this.colorBack = false;
	this.colorBright = false;
	this.colorDark = false;
	this.colorText = false;

	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_HTML';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.TextBox_HTML', properties );
};
Friend.Tree.UI.RenderItems.TextBox_HTML.render = function ( properties )
{
	// Draw box
	this.thisRect.drawHilightedBox( properties, this.item.colorBack, this.item.colorBright, this.item.colorDark );

	// Draw text
	properties.context.drawText( properties, this.rect.width / 2, this.rect.height / 2, this.item.text, this.item.font, this.item.textColor );

	return properties;
};


Friend.Tree.UI.RenderItems.TextBox_Canvas2D = function ( tree, name, properties )
{
	this.text = false;
	this.font = false;
	this.colorBack = false;
	this.colorBright = false;
	this.colorDark = false;
	this.colorText = false;

	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Canvas2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.TextBox_Canvas2D', properties );
};
Friend.Tree.UI.RenderItems.TextBox_Canvas2D.render = Friend.Tree.UI.RenderItems.TextBox_Three2D.render;
