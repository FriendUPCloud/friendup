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
	this.font = '16px sans serif';
	this.color = '#000000';
	this.colorBack = '#C0C0C0';
	this.colorBright = '#E0E0E0';
	this.colorDark = '#808080';
	this.title = 'My title';
	this.cancel = 'Cancel';
	this.OK = 'OK';
	this.cancelEnabled = true;
	this.OKEnabled = true;
	this.buttonHeight = 0;
	this.buttonWidth = 0;
	this.caller = false;
	this.onOK = false;
	this.onCancel = false;
	this.renderItemName = 'Friend.Tree.UI.RenderItems.Dialog';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.Dialog', properties );

	var button;
	this.startInsertItems();
	if ( this.onCancel )
	{
		button = new Friend.Tree.UI.Button( this.tree, 'cancel',
		{
			root: this.root,
			parent: this,
			width: this.buttonWidth ? this.buttonWidth : undefined,
			height: this.buttonHeight ? this.buttonHeight : undefined,
			text: this.cancel,
			caller: this.caller,
			onClick: this.onCancel,
			theme: this.theme
		} );
		button.x = this.width - button.width - 8;
		button.y = this.height - button.height - 8;
		this.addItem( button );
	}
	if ( this.onOK )
	{
		button = new Friend.Tree.UI.Button( this.tree, 'OK',
		{
			root: this.root,
			parent: this,
			width: this.buttonWidth ? this.buttonWidth : undefined,
			height: this.buttonHeight ? this.buttonHeight : undefined,
			text: this.OK,
			caller: this.caller,
			onClick: this.onOK,
			theme: this.theme
		} );
		button.x = 8;
		button.y = this.height - button.height - 8;
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


Friend.Tree.UI.RenderItems.Dialog_Canvas2D = function ( tree, name, properties )
{
	this.font = false;
	this.color = false;
	this.colorBack = false;
	this.colorBright = false;
	this.colorDark = false;
	this.title = false;

	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Canvas2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Dialog_Canvas2D', properties );
	this.tree.tabIndex = 0;
};
Friend.Tree.UI.RenderItems.Dialog_Canvas2D.render = function ( properties )
{
	// Draw box
	this.thisRect.drawHilightedBox( properties, this.item.colorBack, this.item.colorBright, this.item.colorDark );

	// Draw title
	if ( this.title )
		properties.context.drawText( properties, this.rect.width / 2, 20, this.item.title, this.item.font, this.item.color, 'center', 'middle', 25 );

	return properties;
};


// HTML rendering of the dialog
Friend.Tree.UI.RenderItems.Dialog_HTML = function ( tree, name, properties )
{
	this.font = false;
	this.color = false;
	this.colorBack = false;
	this.colorBright = false;
	this.colorDark = false;
	this.title = false;

	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_HTML';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Dialog_HTML', properties );
	this.render = Friend.Tree.UI.RenderItems.Dialog_Three2D.render;
	this.tree.tabIndex = 0;

	this.width = 320;
	this.height = 480;
	this.item.width = this.width;
	this.item.height = this.height;
};
Friend.Tree.UI.RenderItems.Dialog_HTML.render = Friend.Tree.UI.RenderItems.Dialog_Canvas2D.render;
