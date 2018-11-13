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

Friend.Tree.UI.MessageBox = function ( tree, name, flags )
{
	this.title = 'My title';
	this.text = 'My message box text';
	this.cancel = 'Cancel';
	this.font = '16px sans serif';
	this.colorBack = '#C0C0C0';
	this.colorBright = '#E0E0E0';
	this.colorDark = '#808080';
	this.colorText = '#000000';
	this.colorTitle = '#FF0000';
	this.widthButton = 80;
	this.heightButton = 32;

	this.renderItemName = 'Friend.Tree.UI.RenderItems.MessageBox';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.MessageBox', flags );
};
Friend.Tree.UI.MessageBox.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height' ] );
};
Friend.Tree.UI.MessageBox.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height' ] );
};
Friend.Tree.UI.MessageBox.click = function ( )
{
	if ( this.caller && this.onCancel )
		this.onCancel.apply( this.caller, [ ] );
	this.destroy();
};


Friend.Tree.UI.RenderItems.MessageBox_HTML = function ( tree, name, flags )
{
	this.font = false;
	this.text = false;
	this.title = false;
	this.colorBack = false;
	this.colorBright = false;
	this.colorDark = false;
	this.colorText = false;
	this.colorTitle = false;
	this.widthButton = false;
	this.heightButton = false;

	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_HTML';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.MessageBox_HTML', flags );

	this.width = 320;
	this.height = 200;
	this.item.width = this.width;
	this.item.height = this.height;

	this.item.startInsertItems();
	var button = new Friend.Tree.UI.Button( this.tree, 'cancel',
	{
		root: this.item.root,
		parent: this.item,
		font: this.utilities.setFontSize( this.item.font, 14 ),
		text: this.item.cancel,
		caller: this,
		onClick: onClick,
		theme: this.item.theme
	} );
	button.x = this.width - button.width - 8;
	button.y = this.height - button.height - 8;
	this.item.addItem( button );
	this.item.endInsertItems();

	function onClick()
	{
		this.item.destroy();
		if ( this.item.caller && this.item.onCancel )
			this.item.onCancel.apply( this.item.caller, [] );
	}
};
Friend.Tree.UI.RenderItems.MessageBox_HTML.render = function ( properties )
{
	this.thisRect.drawHilightedBox( properties, this.item.colorBack, this.item.colorBright, this.item.colorDark );
	properties.rendererItem.drawText( properties, this.rect.width / 2, this.rect.height / 12, this.item.title, this.item.font, this.item.colorTitle, 'center', 'middle', 20 );
	properties.rendererItem.drawText( properties, this.rect.width / 2, this.rect.height / 2, this.item.text, this.item.font, this.item.colorText, 'center', 'middle', 20 );
	return properties;
};


Friend.Tree.UI.RenderItems.MessageBox_Canvas2D = function ( tree, name, flags )
{
	this.font = false;
	this.text = false;
	this.title = false;
	this.colorBack = false;
	this.colorBright = false;
	this.colorDark = false;
	this.colorText = false;
	this.colorTitle = false;
	this.widthButton = false;
	this.heightButton = false;

	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Canvas2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.MessageBox_Canvas2D', flags );

	this.width = 320;
	this.height = 200;
	this.item.width = this.width;
	this.item.height = this.height;

	this.item.startInsertItems();
	var button = new Friend.Tree.UI.Button( this.tree, 'cancel',
	{
		root: this.item.root,
		parent: this.item,
		text: this.item.cancel,
		font: this.utilities.setFontSize( this.item.font, 14 ),
		caller: this,
		onClick: onClick
	} );
	button.x = this.width - button.width - 8;
	button.y = this.height - button.height - 8;
	this.item.addItem( button );
	this.item.endInsertItems();
	
	function onClick()
	{
		this.item.destroy();
		if ( this.item.caller && this.item.onCancel )
			this.item.onCancel.apply( this.item.caller, [] );
	}
};
Friend.Tree.UI.RenderItems.MessageBox_Canvas2D.render = Friend.Tree.UI.RenderItems.MessageBox_Three2D.render;

