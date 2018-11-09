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

Friend.Tree.UI.CheckBox = function ( tree, name, properties )
{
	this.text = 'CheckBox';
	this.font = '16px sans serif';
	this.color = '#000000';
	this.colorBack = '#FFFFFF';
	this.colorMouseOver = '#C0C0C0';
	this.colorDown = '#000000';
	this.colorBorder = '#000000';
	this.sizeBorder = 1;
	this.sizeCheckmark = 12;

	this.caller = false;
	this.onChange = false;
	this.renderItemName = 'Friend.Tree.UI.RenderItems.CheckBox';
	this.mouseOver = false;
	this.down = false;
	this.value = false;
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.CheckBox', properties );
};
Friend.Tree.UI.CheckBox.messageUp = function ( message )
{
	this.changed = false;
	if ( message.command == 'setValue' )
	{
		this.value = message.value;
		this.changed = true;	
	}
	return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'text', 'font', 'value', 'down', 'mouseOver' ] );
};
Friend.Tree.UI.CheckBox.messageDown = function ( message )
{
	this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'text', 'font', 'value', 'down', 'mouseOver' ] );
	if ( this.changed || message.value == Friend.Tree.UPDATED )
	{
		if ( this.onChange && this.caller )
			this.onChange.apply( this.caller, [ this.value ] );
		this.doRefresh();
	}
};
Friend.Tree.UI.CheckBox.getValue = function ( message )
{
	return this.state;
};



Friend.Tree.UI.RenderItems.CheckBox_HTML = function ( tree, name, properties )
{
	this.text = false;
	this.font = false;
	this.color = false;
	this.colorBack = false;
	this.colorMouseOver = false;
	this.colorDown = false;
	this.colorBorder = false;
	this.sizeBorder = false;
	this.sizeCheckmark = false;
	this.value = false;

	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_HTML';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.CheckBox_HTML', properties );
	this.item.addProcess( new Friend.Tree.UI.GestureCheckBox( this.tree, this.item, { } ) );

	this.width = 200;
	this.height = 32;
	this.item.width = this.width;
	this.item.height = this.height;
};
Friend.Tree.UI.RenderItems.CheckBox_HTML.render = function ( properties )
{
	// Clears the canvas
	this.thisRect.clear( properties );

	// Checkbox
	var rect = new Friend.Tree.Utilities.Rect( 0, this.rect.height / 2 - this.item.sizeCheckmark / 2, this.item.sizeCheckmark, this.item.sizeCheckmark );
	var colorBack = this.item.colorBack;
	if ( this.item.mouseOver )
	{
		colorBack = this.item.colorMouseOver;
	}
	rect.drawBox( properties, colorBack, this.item.colorBorder, this.item.sizeBorder );

	// Checkmark
	if ( this.item.value )
	{
		rect.drawDiagonal( properties, this.item.colorDown, 1, Friend.Tree.DIAGONAL_TOPLEFT_BOTTOMRIGHT | Friend.Tree.DIAGONAL_TOPRIGHT_BOTTOMLEFT );
	}

	// Text
	rect = new Friend.Tree.Utilities.Rect( this.thisRect );
	rect.x += this.item.sizeCheckmark + 4;
	rect.drawText( properties, this.item.text, this.item.font, this.item.color, 'left', 'middle' );

	// Allow rendering in parent
	if ( this.item.renderSubItems )
        properties.renderInParent = properties.rendererItem;

	return properties;
};

Friend.Tree.UI.RenderItems.CheckBox_Canvas2D = function ( tree, name, properties )
{
	this.text = false;
	this.font = false;
	this.color = false;
	this.colorBack = false;
	this.colorMouseOver = false;
	this.colorDown = false;
	this.colorBorder = false;
	this.sizeBorder = false;
	this.sizeCheckmark = false;
	this.value = false;

	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Canvas2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.CheckBox_Canvas2D', properties );
	this.item.addProcess( new Friend.Tree.UI.GestureCheckBox( this.tree, this.item, { } ) );
	this.render = Friend.Tree.UI.RenderItems.CheckBox_Three2D.render;

	this.width = 200;
	this.height = 32;
	this.item.width = this.width;
	this.item.height = this.height;
};
Friend.Tree.UI.RenderItems.CheckBox_Canvas2D.render = Friend.Tree.UI.RenderItems.CheckBox_HTML.render;
