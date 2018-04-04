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

Friend.Tree.UI.CheckBox = function ( tree, name, properties )
{
	this.text = 'CheckBox';
	this.font = '12px Arial';
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

Friend.Tree.UI.RenderItems.CheckBox_Three2D = function ( tree, name, properties )
{
	this.color = '#000000';
	this.backColor = '#FFFFFF';
	this.mouseOverColor = '#C0C0C0';
	this.downColor = '#000000';
	this.borderColor = '#000000';
	this.borderSize = 1;
	this.checkSize = 12;
	this.font = '16px Arial';
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Three2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.CheckBox_Three2D', properties );
	this.parent.addProcess( new Friend.Tree.UI.GestureCheckBox( this.tree, this.parent, { } ) );
};
Friend.Tree.UI.RenderItems.CheckBox_Three2D.render = function ( properties )
{
	// Clears the canvas
	this.thisRect.clear( properties );

	// Checkbox
	var rect = new Friend.Tree.Utilities.Rect( 0, this.rect.height / 2 - this.checkSize / 2, this.checkSize, this.checkSize );
	var backColor = this.backColor;
	if ( this.parent.mouseOver )
	{
		backColor = this.mouseOverColor;
	}
	rect.drawBox( properties, backColor, this.borderColor, this.borderSize );

	// Checkmark
	if ( this.parent.value )
	{
		rect.drawDiagonal( properties, this.downColor, 1, Friend.Tree.DIAGONAL_TOPLEFT_BOTTOMRIGHT | Friend.Tree.DIAGONAL_TOPRIGHT_BOTTOMLEFT );
	}

	// Text
	rect = new Friend.Tree.Utilities.Rect( this.thisRect );
	rect.x += this.checkSize + 4;
	rect.drawText( properties, this.parent.text, this.font, this.color, 'left', 'middle' );

	return properties;
};


Friend.Tree.UI.RenderItems.CheckBox_HTML = function ( tree, name, properties )
{
	this.color = '#000000';
	this.backColor = '#FFFFFF';
	this.mouseOverColor = '#C0C0C0';
	this.downColor = '#000000';
	this.borderColor = '#000000';
	this.borderSize = 1;
	this.checkSize = 12;
	this.font = '16px Arial';
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_HTML';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.CheckBox_HTML', properties );
	this.parent.addProcess( new Friend.Tree.UI.GestureCheckBox( this.tree, this.parent, { } ) );
};
Friend.Tree.UI.RenderItems.CheckBox_HTML.render = Friend.Tree.UI.RenderItems.CheckBox_Three2D.render;

Friend.Tree.UI.RenderItems.CheckBox_Canvas2D = function ( tree, name, properties )
{
	this.color = '#000000';
	this.backColor = '#FFFFFF';
	this.mouseOverColor = '#C0C0C0';
	this.downColor = '#000000';
	this.borderColor = '#000000';
	this.borderSize = 1;
	this.checkSize = 12;
	this.font = '16px Arial';
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Canvas2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.CheckBox_Canvas2D', properties );
	this.parent.addProcess( new Friend.Tree.UI.GestureCheckBox( this.tree, this.parent, { } ) );
	this.render = Friend.Tree.UI.RenderItems.CheckBox_Three2D.render;
};
Friend.Tree.UI.RenderItems.CheckBox_Canvas2D.render = Friend.Tree.UI.RenderItems.CheckBox_Three2D.render;
