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

Friend.Tree.UI.MessageBox = function ( tree, name, flags )
{
	this.title = 'My title';
	this.text = 'My message box text';
	this.cancel = 'Cancel';
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

Friend.Tree.UI.RenderItems.MessageBox_Three2D = function ( tree, name, flags )
{
	this.font = '16px Arial';
	this.backColor = '#C0C0C0';
	this.brightColor = '#E0E0E0';
	this.darkColor = '#808080';
	this.textColor = '#000000';
	this.titleColor = '#FF0000';
	this.onCancel = false;
	this.caller = false;
	this.buttonWidth = 80;
	this.buttonHeight = 32;
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Three2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.MessageBox_Three2D', flags );

	this.parent.startInsertItems();
	var button = new Friend.Tree.UI.Button( this.tree, 'cancel',
	{
		root: this.parent.root,
		parent: this.parent,
		x: this.width - this.buttonWidth - 8,
		y: this.height - this.buttonHeight - 8,
		width: this.buttonWidth,
		height: this.buttonHeight,
		text: this.parent.cancel,
		caller: this,
		onClick: onClick
	} );
	this.parent.addItem( button );
	this.parent.endInsertItems();

	function onClick()
	{
		this.parent.destroy();
		if ( this.caller && this.onCancel )
			this.onCancel.apply( this.caller, [] );
	}
};
Friend.Tree.UI.RenderItems.MessageBox_Three2D.render = function ( properties )
{
	this.thisRect.drawHilightedBox( properties, this.backColor, this.brightColor, this.darkColor );
	properties.rendererItem.drawText( properties, this.rect.width / 2, this.rect.height / 15, this.parent.title, this.font, this.titleColor, 'center', 'middle', 20 );
	properties.rendererItem.drawText( properties, this.rect.width / 2, this.rect.height / 2, this.parent.text, this.font, this.textColor, 'center', 'middle', 20 );
	return properties;
};

Friend.Tree.UI.RenderItems.MessageBox_HTML = function ( tree, name, flags )
{
	this.font = '16px Arial';
	this.backColor = '#C0C0C0';
	this.brightColor = '#E0E0E0';
	this.darkColor = '#808080';
	this.textColor = '#000000';
	this.titleColor = '#FF0000';
	this.onCancel = false;
	this.caller = false;
	this.buttonWidth = 80;
	this.buttonHeight = 32;
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_HTML';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.MessageBox_HTML', flags );

	this.parent.startInsertItems();
	var button = new Friend.Tree.UI.Button( this.tree, 'cancel',
	{
		root: this.parent.root,
		parent: this.parent,
		x: this.width - this.buttonWidth - 8,
		y: this.height - this.buttonHeight - 8,
		width: this.buttonWidth,
		height: this.buttonHeight,
		text: this.parent.cancel,
		caller: this,
		onClick: onClick
	} );
	this.parent.addItem( button );
	this.parent.endInsertItems();

	function onClick()
	{
		debugger;
		this.parent.destroy();
		if ( this.caller && this.onCancel )
			this.onCancel.apply( this.caller, [] );
	}
};
Friend.Tree.UI.RenderItems.MessageBox_HTML.render = Friend.Tree.UI.RenderItems.MessageBox_Three2D.render;

Friend.Tree.UI.RenderItems.MessageBox_Canvas2D = function ( tree, name, flags )
{
	this.font = '16px Arial';
	this.backColor = '#C0C0C0';
	this.brightColor = '#E0E0E0';
	this.darkColor = '#808080';
	this.textColor = '#000000';
	this.titleColor = '#FF0000';
	this.onCancel = false;
	this.caller = false;
	this.buttonWidth = 80;
	this.buttonHeight = 32;
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Canvas2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.MessageBox_Canvas2D', flags );

	this.parent.startInsertItems();
	var button = new Friend.Tree.UI.Button( this.tree, 'cancel',
	{
		root: this.parent.root,
		parent: this.parent,
		x: this.width - this.buttonWidth - 8,
		y: this.height - this.buttonHeight - 8,
		width: this.buttonWidth,
		height: this.buttonHeight,
		text: this.parent.cancel,
		caller: this,
		onClick: onClick
	} );
	this.parent.addItem( button );
	this.parent.endInsertItems();
	
	function onClick()
	{
		this.parent.destroy();
		if ( this.caller && this.onCancel )
			this.onCancel.apply( this.caller, [] );
	}
};
Friend.Tree.UI.RenderItems.MessageBox_Canvas2D.render = Friend.Tree.UI.RenderItems.MessageBox_Three2D.render;

