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

Friend.Tree.UI.ComboBox = function ( tree, name, properties )
{
	this.text = 'Combo box';
	this.font = '16px sans serif';
	this.color = '#000000';
	this.colorBack = '#808080';
	this.colorBright = '#C0C0C0';
	this.colorDark = '#404040';
	this.colorDown = '#C0C0C0';
	this.colorMouseOver = '#A0A0A0';
	this.value = -1;
	this.readOnly = false;
	this.lines = false;
	this.defaultValue = -1;
	this.numberOfLines = 10;
	this.type = 'list';

	this.caller = false;
	this.onClick = false;
	this.onChange = false;
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


Friend.Tree.UI.RenderItems.ComboBox_Canvas2D = function ( tree, name, properties )
{
	this.text = false;
	this.font = false;
	this.color = false;
	this.colorBack = false;
	this.colorBright = false;
	this.colorDark = false;
	this.colorDown = false;
	this.colorMouseOver = false;
	this.value = false;

	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Three2D';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.RenderItems.ComboBox', properties );

	this.width = 200;
	this.height = 32;
	this.item.width = this.width;
	this.item.height = this.height;
};
Friend.Tree.UI.RenderItems.ComboBox_Canvas2D.render = function ( properties )
{
	var color = this.item.colorBack;
	if ( this.parent.mouseOver )
		color = this.item.colorMouseOver;
	if ( this.parent.down )
		color = this.item.colorDown;
	this.thisRect.drawHilightedBox( properties, color, this.item.colorBright, this.item.colorDark );
	if ( this.value >= 0 )
	{
		var rect = new Friend.Tree.Utilities.Rect( this.thisRect );
		rect.x += 8;
		rect.width -= 16;
		rect.drawText( properties, this.item.text, this.item.font, this.item.color, 'left', 'center' );
	}
	return properties;
};

Friend.Tree.UI.RenderItems.ComboBox_HTML = function ( tree, name, properties )
{
	this.text = false;
	this.font = false;
	this.color = false;
	this.colorBack = false;
	this.colorBright = false;
	this.colorDark = false;
	this.colorDown = false;
	this.colorMouseOver = false;
	this.value = false;
	
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Three2D';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.RenderItems.ComboBox', properties );

	this.width = 200;
	this.height = 32;
	this.item.width = this.width;
	this.item.height = this.height;
};
