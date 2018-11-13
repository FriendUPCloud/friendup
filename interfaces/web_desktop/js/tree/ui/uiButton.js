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

Friend.Tree.UI.Button = function ( tree, name, properties )
{
	this.text = 'Button';
	this.font = '16px sans serif';
	this.color = '#000000';
	this.colorBack = '#808080';
	this.colorDown = '#C0C0C0';
	this.colorMouseOver = '#A0A0A0';
	this.colorBright = '#C0C0C0';
	this.colorDark = '#404040';

	this.caller = false;
	this.onClick = false;
	this.down = false;
	this.mouseOver = false;
	this.renderItemName = 'Friend.Tree.UI.RenderItems.Button';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.Button', properties );
};
Friend.Tree.UI.Button.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'text', 'font', 'down', 'mouseOver', 'caller', 'onClick' ] );
};
Friend.Tree.UI.Button.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'text', 'font', 'down', 'mouseOver' ] );
};
 


Friend.Tree.UI.RenderItems.Button_HTML = function ( tree, name, properties )
{
	this.text = false;
	this.font = false;
	this.color = false;
	this.colorBack = false;
	this.colorDown = false;
	this.colorMouseOver = false;
	this.colorBright = false;
	this.colorDark = false;
	
	this.rendererName = 'Renderer_HTML';
	this.rendererType = 'Element';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Button_HTML', properties );

	// Adapt the size of the button to the text?
	var sizes = this.renderer.measureText( this.item.text, this.item.font );
	this.width = sizes.width + 20;
	this.item.width = this.width;
	this.height = sizes.height + 16;
	this.item.height = this.height;

	// Create the element
	this.element = document.createElement( 'button' );
	this.element.tabIndex = tree.tabIndex++;
	this.element.type = 'button';
	this.element.innerHTML = this.item.text;
	this.element.style.position = 'absolute';
	this.element.style.zIndex = this.z;

	var self = this;
	this.element.onclick = function()
	{
		if ( self.item.caller && self.item.onClick )
			self.item.onClick.apply( self.item.caller, [ this ] );
	};
};
Friend.Tree.UI.RenderItems.Button_HTML.render = function ( properties )
{
	return properties;
};
Friend.Tree.UI.RenderItems.Button_HTML.message = function ( message )
{
	switch ( message.command )
	{
		// To be handled by default.
		case 'resize':
			if ( typeof message.width != 'undefined' )
				this.width = message.width;
			if ( typeof message.height != 'undefined' )
				this.height = message.height;
			this.renderer.resizeItem( this, message.width, message.height );
            this.item.doRefresh();
			return true;			// Message handled!
		default:
			break;
	}
	return false;
}


Friend.Tree.UI.RenderItems.Button_Canvas2D = function ( tree, name, properties )
{
	this.font = false;
	this.text = false;
	this.color = false;
	this.colorBack = false;
	this.colorDown = false;
	this.colorMouseOver = false;
	this.colorBright = false;
	this.colorDark = false;

	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Canvas2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Button_Canvas2D', properties );
	
	// Adapt the size of the button to the text?
	var sizes = this.renderer.measureText( this.item.text, this.item.font );
	this.width = sizes.width + 20;
	this.item.width = this.width;
	this.height = sizes.height + 16;
	this.item.height = this.height;

	// Set the item for handling mouse messages
	this.item.registerEvents( 'mouse' );
	this.item.addProcess( new Friend.Tree.UI.GestureButton( this.tree, this.item, properties ) );
};
Friend.Tree.UI.RenderItems.Button_Canvas2D.render = function ( properties )
{
	var colorBack = this.item.colorBack;
	var xxText = this.width / 2;
	var yyText = this.height / 2;
	if ( this.item.down )
	{
		colorBack = this.item.colorDown;
		xxText += 2;
		yyText += 2;
	}
	else if ( this.item.mouseOver )
		colorBack = this.item.colorMouseOver;
	var colorBright = this.item.colorBright;
	var colorDark = this.item.colorDark;
	var color = this.item.color;

	// If disabled, darker
	if ( !this.item.active )
	{
		color = this.utilities.multiplyRGBString( color, 0.5, 0.5, 0.5 );
		colorBack = this.utilities.multiplyRGBString( colorBack, 0.5, 0.5, 0.5 );
		colorBright = this.utilities.multiplyRGBString( colorBright, 0.5, 0.5, 0.5 );
		colorDark = this.utilities.multiplyRGBString( colorDark, 0.5, 0.5, 0.5 );
	}
	this.thisRect.drawHilightedBox( properties, colorBack, colorBright, colorDark );
	this.thisRect.x += xxText;
	this.thisRect.y += yyText;
	this.thisRect.drawText( properties, this.item.text, this.item.font, color );
	this.thisRect.x -= xxText;
	this.thisRect.y -= yyText;

	// Allow rendering in parent
	if ( this.item.renderSubItems )
        properties.renderInParent = properties.rendererItem;

	return properties;
};
Friend.Tree.UI.RenderItems.Button_Canvas2D.message = function ( message )
{
	switch ( message.command )
	{
		case 'resize':
			if ( typeof message.width != 'undefined' )
				this.width = message.width;
			if ( typeof message.height != 'undefined' )
				this.height = message.height;
			this.renderer.resizeItem( this, message.width, message.height );
            this.item.doRefresh();
			break;
		default:
			break;
	}
};
