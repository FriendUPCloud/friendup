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

Friend.Tree.UI.Dialog = function ( tree, name, properties )
{
	this.font = '13px Arial';
	this.title = 'My title';
	this.cancel = 'Cancel';
	this.OK = 'OK';
	this.cancelEnabled = true;
	this.OKEnabled = true;
	this.buttonHeight = 32;
	this.buttonWidth = 80;
	this.caller = false;
	this.onOK = false;
	this.onCancel = false;
	this.renderItemName = 'Friend.Tree.UI.RenderItems.Dialog';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.Dialog', properties );

	this.startInsertItems();
	if ( this.onCancel )
	{
		var button = new Friend.Tree.UI.Button( this.tree, 'cancel',
		{
			root: this.root,
			parent: this,
			x: this.width - this.buttonWidth - 8,
            y: this.height - this.buttonHeight - 8,
			width: this.buttonWidth,
			height: this.buttonHeight,
			text: this.cancel,
			caller: this.caller,
			onClick: this.onCancel
		} );
		this.addItem( button );
	}
	if ( this.onOK )
	{
		var button = new Friend.Tree.UI.Button( this.tree, 'OK',
		{
			root: this.root,
			parent: this,
			x: 8,
			y: this.height - this.buttonHeight - 8,
			width: this.buttonWidth,
			height: this.buttonHeight,
			text: this.OK,
			caller: this.caller,
			onClick: this.onOK
		} );
		this.addItem( button );
	}
	this.endInsertItems();

};
Friend.Tree.UI.Dialog.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height' ] );
};
Friend.Tree.UI.Dialog.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height' ] );
};

// Hand drawn dialog
Friend.Tree.UI.RenderItems.Dialog_Three2D = function ( tree, name, properties )
{
	this.font = '13px Arial';
	this.color = '#000000';
	this.backColor = '#C0C0C0';
	this.brightColor = '#E0E0E0';
	this.darkColor = '#808080';
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Three2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Dialog_Three2D', properties );
	this.tree.tabIndex = 0;
};
Friend.Tree.UI.RenderItems.Dialog_Three2D.render = function ( properties )
{
	// Draw box
	this.thisRect.drawHilightedBox( properties, this.backColor, this.brightColor, this.darkColor );

	// Draw title
	if ( this.parent.title )
		properties.context.drawText( properties, this.rect.width / 2, 20, this.parent.title, this.parent.font, this.color, 'center', 'middle', 25 );

	return properties;
};

Friend.Tree.UI.RenderItems.Dialog_Canvas2D = function ( tree, name, properties )
{
	this.font = '13px Arial';
	this.color = '#000000';
	this.backColor = '#C0C0C0';
	this.brightColor = '#E0E0E0';
	this.darkColor = '#808080';
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Canvas2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Dialog_Canvas2D', properties );
	this.tree.tabIndex = 0;
};
Friend.Tree.UI.RenderItems.Dialog_Canvas2D.render = Friend.Tree.UI.RenderItems.Dialog_Three2D.render;


// HTML rendering of the dialog
Friend.Tree.UI.RenderItems.Dialog_HTML = function ( tree, name, properties )
{
	this.font = '13px Arial';
	this.color = '#000000';
	this.backColor = '#C0C0C0';
	this.brightColor = '#E0E0E0';
	this.darkColor = '#808080';
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_HTML';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Dialog_HTML', properties );
	this.render = Friend.Tree.UI.RenderItems.Dialog_Three2D.render;
	this.tree.tabIndex = 0;
};
Friend.Tree.UI.RenderItems.Dialog_HTML.render = Friend.Tree.UI.RenderItems.Dialog_HTML.render;
