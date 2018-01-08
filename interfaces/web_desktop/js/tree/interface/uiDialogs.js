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
 * Tree interface objects
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 20/09/2017
 */
Friend = window.Friend || {};
Friend.UI = Friend.UI || {};
Friend.Flags = Friend.Flags || {};

/**
 * Message Box
 *
 * A simple dialog with a title, a text, and one or two buttons
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * Flags
 *
 * font: (string) the font to use
 * title: (string) text to display as a title
 * titleColor: (color) color of the title (default = theme)
 * text: (string) text to display
 * textColor: (color) color of the text (default = theme)
 * cancel: (string) text of the cancel button (default = 'cancel')
 * backColor: (color) color of box background (default = theme)
 * brightColor: (color) color of illuminated side (default = theme)
 * darkColor: (color) color of dark side (default = theme)
 * modal: (boolean) if true, interrupts all other items
 * onCancel: (function) called when the Cancel button is clicked
 * caller: (object) object to call on click
 */
Friend.UI.MessageBox = function ( tree, name, flags )
{
	this.tree = tree;

	this.font = '16px Arial';
	this.title = 'My title';
	this.text = 'My message box text';
	this.cancel = 'Cancel';
	this.backColor = '#C0C0C0';
	this.brightColor = '#E0E0E0';
	this.darkColor = '#808080';
	this.textColor = '#000000';
	this.titleColor = '#FF0000';
	this.onCancel = false;
	this.caller = false;
	this.rendererType = 'Canvas';
	Friend.Tree.Items.init( this, tree, name, 'Friend.UI.MessageBox', flags );
	Object.assign( this, Friend.UI.MessageBox );

	this.buttonWidth = this.width / 4;
	this.buttonHeight = this.height / 6;

	this.startInsertItems();
	var button = new Friend.UI.Button( this.tree, 'cancel',
	{
		root: this.root,
		parent: this,
		x: this.width - this.buttonWidth - 8,
		y: this.height - this.buttonHeight - 8,
		width: this.buttonWidth,
		height: this.buttonHeight,
		text: this.cancel,
		caller: this,
		onClick: this.click
	} );
	this.addItem( button );
	this.endInsertItems();
};
Friend.UI.MessageBox.renderUp = function ( flags )
{
	if ( this.refresh )
	{
		// Draw box
		this.thisRect.drawHilightedBox( flags, this.backColor, this.brightColor, this.darkColor );

		// Draw title
		flags.rendererItem.drawText( flags, this.rect.width / 2, this.rect.height / 15, this.title, this.font, this.titleColor, 'center', 'middle', 20 );

		// Draw text
		flags.rendererItem.drawText( flags, this.rect.width / 2, this.rect.height / 2, this.text, this.font, this.textColor, 'center', 'middle', 20 );
	}
	return flags;
};
Friend.UI.MessageBox.renderDown = function ( flags )
{
    return  flags;
};
Friend.UI.MessageBox.processUp = function ( flags )
{
	return this.startProcess( flags, [ 'x', 'y', 'z' ] );
};
Friend.UI.MessageBox.processDown = function ( flags )
{
	return this.endProcess( flags, [ 'x', 'y', 'z' ] );
};
Friend.UI.MessageBox.click = function ( )
{
	if ( this.caller && this.onCancel )
		this.onCancel.apply( this.caller, [ ] );
	this.destroy();
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Dialog
 *
 * A dialog box
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * Flags
 *
 * font: (string) the font to use
 * title: (string) text to display as a title
 * titleColor: (color) color of the title (default = theme)
 * cancel: (string) text of the cancel button (default = 'cancel')
 * OK: (string) text of the OK button (default = 'OK')
 * backColor: (color) color of box background (default = theme)
 * brightColor: (color) color of illuminated side (default = theme)
 * darkColor: (color) color of dark side (default = theme)
 * modal: (boolean) if true, interrupts all other items
 * onOK: (function) called when the OK button is clicked
 * onCancel: (function) called when the Cancel button is clicked
 * caller: (object) object to call on click
 */
Friend.UI.Dialog = function ( tree, name, flags )
{
	this.tree = tree;

	this.font = '13px Arial';
	this.title = 'My title';
	this.cancel = 'Cancel';
	this.OK = 'OK';
	this.destroyOnOKCancel = true;
	this.backColor = '#C0C0C0';
	this.brightColor = '#E0E0E0';
	this.darkColor = '#808080';
	this.titleColor = '#000000';
	this.buttonWidth = 80;
	this.buttonHeight = 32;
	this.caller = false;
	this.rendererType = 'Canvas';
	Friend.Tree.Items.init( this, tree, name, 'Friend.UI.Dialog', flags );
	Object.assign( this, Friend.UI.Dialog );

	this.tree.tabIndex = 0;

	this.startInsertItems();
	if ( flags.onCancel )
	{
		this.onCancel = flags.onCancel;		
		var button = new Friend.UI.Button( this.tree, 'cancel',
		{
			root: this.root,
			parent: this,
			x: this.width - this.buttonWidth - 8,
            y: this.height - this.buttonHeight - 8,
			width: this.buttonWidth,
			height: this.buttonHeight,
			text: this.cancel,
			caller: this,
			onClick: this.clickCancel
		} );
		this.addItem( button );
	}
	if ( flags.onOK )
	{
		this.onOK = flags.onOK;
		var button = new Friend.UI.Button( this.tree, 'OK',
		{
			root: this.root,
			parent: this,
			x: 8,
			y: this.height - this.buttonHeight - 8,
			width: this.buttonWidth,
			height: this.buttonHeight,
			text: this.OK,
			caller: this,
			onClick: this.clickOK
		} );
		this.addItem( button );
	}
	this.endInsertItems();
};
Friend.UI.Dialog.renderUp = function ( flags )
{
	if ( this.refresh )
	{
		// Draw box
		this.thisRect.drawHilightedBox( flags, this.backColor, this.brightColor, this.darkColor );

		// Draw title
		if ( this.title && this.title != '' )
			flags.context.drawText( flags, this.rect.width / 2, 20, this.title, this.font, this.titleColor, 'center', 'middle', 25 );
	}
	return flags;
};
Friend.UI.Dialog.renderDown = function ( flags )
{
    return flags;
};
Friend.UI.Dialog.processUp = function ( flags )
{
	return this.startProcess( flags, [ 'x', 'y', 'z' ] );
};
Friend.UI.Dialog.processDown = function ( flags )
{
	return this.endProcess( flags, [ 'x', 'y', 'z' ] );
};
Friend.UI.Dialog.clickCancel = function ( )
{
	if ( this.destroyOnOKCancel )
		this.destroy();
	if ( this.caller && this.onCancel )
		this.onCancel.apply( this.caller );
};
Friend.UI.Dialog.clickOK = function ( )
{
	if ( this.destroyOnOKCancel )
		this.destroy();
	if ( this.caller && this.onOK )
		this.onOK.apply( this.caller );
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * TextBox
 *
 * A simple box displaying a text, no buttons
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * Flags
 *
 * font: (string) the font to use
 * text: (string) text to display
eColor: (color) color of the title (default = theme)
Color: (color) color of box background (default = theme)
 * brightColor: (color) color of illuminated side (default = theme)
 * darkColor: (color) color of dark side (default = theme)
 * modal: (boolean) if true, interrupts all other items
 */
Friend.UI.TextBox = function ( tree, name, flags )
{
	this.tree = tree;

	this.font = '16px Arial';
	this.text = 'My textbox text';
	this.backColor = '#C0C0C0';
	this.brightColor = '#E0E0E0';
	this.darkColor = '#808080';
	this.textColor = '#000000';
	this.rendererType = 'Canvas';
	Friend.Tree.Items.init( this, tree, name, 'Friend.UI.MessageBox', flags );
	Object.assign( this, Friend.UI.TextBox );
};
Friend.UI.TextBox.renderUp = function ( flags )
{
	if ( this.refresh )
	{
		// Draw box
		this.thisRect.drawHilightedBox( flags, this.backColor, this.brightColor, this.darkColor );

		// Draw text
		flags.context.drawText( flags, this.rect.width / 2, this.rect.height / 2, this.text, this.font, this.textColor );
	}
	return flags;
};
Friend.UI.TextBox.renderDown = function ( flags )
{
    return flags;
};
Friend.UI.TextBox.processUp = function ( flags )
{
	return this.startProcess( flags, [ 'x', 'y', 'z' ] );
};
Friend.UI.TextBox.processDown = function ( flags )
{
	return this.endProcess( flags, [ 'x', 'y', 'z' ] );
};
