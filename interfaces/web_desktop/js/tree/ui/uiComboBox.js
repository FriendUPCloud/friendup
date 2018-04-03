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

Friend.Tree.UI.ComboBox = function ( tree, name, properties )
{
	this.text = false;
	this.font = '12px Arial';
	this.caller = false;
	this.onClick = false;
	this.onChange = false;
	this.readOnly = false;
	this.lines = false;
	this.text = '';
	this.defaultValue = -1;
	this.value = -1;
	this.numberOfLines = 10;
	this.type = 'list';
	this.renderItemName = 'Friend.Tree.UI.RenderItems.ComboBox';	
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.ComboBox', properties );

	this.width -= properties.height;
	this.heightList = this.height * Math.max( this.lines.length, this.numberOfLines );
	if ( this.defaultValue >= 0 )
	{
		this.text = this.lines[ this.defaultValue ];
		this.value = this.defaultValue;
	}

	// Add default Gesture process
	this.parentOnClick = this.onClick;
	this.parentCaller = this.caller;
	this.onClick = this.onClickTitle;
	this.caller = this;
	this.addProcess( new Friend.Tree.UI.GestureButton( this.tree, this, {} ) );

	this.startInsertItems();
	this.arrow = new Friend.Tree.UI.Arrow( this.tree, name + '|arrow',
	{
		root: this.root,
		parent: this,
		internal: true,
		x: this.width,
		y: 0,
		width: this.height,
		height: this.height,
		direction: 'bottom',
		caller: this,
		onClick: this.onClickArrow
	} );
	this.addItem( this.arrow );
	this.endInsertItems();
};
Friend.Tree.UI.ComboBox.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z', 'color', 'down', 'mouseOver' ] );
};
Friend.Tree.UI.ComboBox.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'color', 'down', 'mouseOver' ] );
};
Friend.Tree.UI.ComboBox.addLine = function ( line )
{
	this.lines.push( line );
};
Friend.Tree.UI.ComboBox.onClickTitle = function( item, coords )
{
	if ( this.type != 'edit' )
		this.onClickArrow();
	else
	{
		if ( !this.edit )
		{
			if ( this.list )
				this.onClickArrow();

			this.startInsertItems();
			this.edit = new Friend.Tree.UI.Edit( this.tree, this.name + '|edit',
			{
				 root: this.root,
				 parent: this,
				 x: 3,
				 y: 3,
				 width: this.width - 6,
				 height: this.height,
				 font: this.font,
				 text: this.text,
				 closeOnClick: true,
				 closeOnReturn: true,
				 caller: this,
				 onClose: this.onCloseEdit
			} );
			this.addItem( this.edit );
			this.endInsertItems();
		}
	}
};
Friend.Tree.UI.ComboBox.onCloseEdit = function()
{
	if ( this.edit )
	{
		this.text = this.edit.getValue();
		this.doRefresh();
		this.edit.destroy();
		this.edit = null;
	}
};
Friend.Tree.UI.ComboBox.onClickArrow = function ()
{
	if ( !this.list )
	{
		this.startInsertItems();
		this.list = new Friend.Tree.UI.List( this.tree, this.name + '|list',
		{
			root: this.root,
			parent: this,
			x: 0,
			y: this.height,
			width: this.width + this.height,
			height:	this.height * Math.min( this.content.length - 1, this.numberOfLines ),
			font: this.font,
			caller: this,
			onClick: this.onClickList
		} );
		this.addItem( this.list );
		for ( var c = 0; c < this.content.length; c++ )
			this.list.addLine( this.lines[ c ], c );
		this.startModal();
		this.endInsertItems();
	}
	else
	{
		this.stopModal();
	 	this.list.destroy();
		this.list = null;
	}
};
Friend.Tree.UI.ComboBox.onClickList = function( item )
{
	this.text = item.getValue();
	this.value = item.data;
	this.doRefresh();

	this.stopModal();
	this.list.destroy();
	this.list = null;
};
Friend.Tree.UI.ComboBox.getValue = function ()
{
	return this.value;
};


Friend.Tree.UI.RenderItems.ComboBox = function ( tree, name, flags )
{
	this.textColor = '#000000';
	this.backColor = '#808080';
	this.brightColor = '#C0C0C0';
	this.darkColor = '#404040';
	this.downColor = '#C0C0C0';
	this.mouseOverColor = '#A0A0A0';
	this.font = '12px Arial';
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Three2D';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.RenderItems.ComboBox', flags );
};
Friend.Tree.UI.RenderItems.ComboBox.render = function ( properties )
{
	var color = this.backColor;
	if ( this.parent.mouseOver )
		color = this.mouseOverColor;
	if ( this.parent.down )
		color = this.downColor;
	this.thisRect.drawHilightedBox( properties, color, this.brightColor, this.darkColor );
	if ( this.parent.value >= 0 )
	{
		var rect = new Friend.Tree.Utilities.Rect( this.thisRect );
		rect.x += 8;
		rect.width -= 16;
		rect.drawText( properties, this.parent.text, this.font, this.textColor, 'left', 'center' );
	}
	return properties;
};
