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
 * Tree interface elements
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 20/09/2017
 */
Friend = window.Friend || {};
Friend.UI = Friend.UI || {};
Friend.Flags = Friend.Flags || {};

Friend.UI.Edit = function ( tree, name, flags )
{
	this.text = false;
	this.textColor = '#000000';
	this.backColor = '#808080';
	this.font = '12px Arial';
	this.caller = false;
	this.onClick = false;
	this.onChange = false;
	this.onReturn = false;
	this.onClose = false;
	this.numberOfLines = 1;
	this.border = 'black';
	this.disabled = false;
	this.readOnly = false;
	this.rendererType = 'Canvas';
	this.maxLength = 256;
	this.closeOnClick = false;
	this.type = 'text';
	Friend.Tree.Items.init( this, tree, name, 'Friend.UI.Edit', flags );
	Object.assign( this, Friend.UI.Edit );

	if ( this.numberOfLines == 1 )
		this.height = this.renderer.getFontSize( this.font ) + 2;

	this.textArea = document.createElement( 'TEXTAREA' );
	this.textArea.type = 'text';
	this.textArea.resize = 'none';
	this.textArea.whiteSpace = 'nowrap';
	this.textArea.overflowX = 'scroll';
	this.textArea.id = this.identifier;
	this.textArea.tabIndex = tree.tabIndex++;
	this.textArea.contentEditable = 'true';
	this.textArea.defaultValue = this.text;
	this.textArea.style.visibility = 'hidden';
	this.textArea.maxLength = this.maxLength;
	this.textArea.style.position = 'absolute';
	this.textArea.style.left = this.x + 'px';
	this.textArea.style.top = this.y + 'px';
	this.textArea.style.width = this.width + 'px';
	this.textArea.style.height = this.height + 4 + 'px';
	this.textArea.style.border = this.border;
	this.textArea.treeSelf = this;
	if ( this.type == 'number' )
	{
		this.textArea.onkeyup = function()
		{
			var pos = this.value.indexOf( '\n' )
			//this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
			if ( this.treeSelf.caller && this.treeSelf.onChange )
				this.treeSelf.caller[ this.treeSelf.onChange ].apply( this.treeSelf.caller, [ this.treeSelf, this.value ] );
		};
		this.textArea.onkeydown = function( event )
		{
			if ( event.which == 13 )
			{
				if ( this.treeSelf.caller && this.treeSelf.onReturn )
					this.treeSelf.caller[ this.treeSelf.onReturn ].apply( this.treeSelf.caller, [ this.treeSelf, this.value ] );
			}
		};
	}
	document.body.appendChild( this.textArea );
};
Friend.UI.Edit.onDestroy = function ( flags )
{
	if ( this.textArea )
	{
		document.body.removeChild( this.textArea );
		this.textArea = null;
	}
};
Friend.UI.Edit.renderUp = function ( flags )
{
	if ( this.textArea )
	{
		this.textArea.style.position = 'absolute';
		this.textArea.style.left = flags.xReal + 'px';
		this.textArea.style.top = flags.yReal + 'px';
		this.textArea.style.width = this.width + 'px';
		this.textArea.style.height = this.height + 4 + 'px';
		this.textArea.style.border = this.border;
		this.textArea.style.opacity = flags.alpha.toString();
		if ( this.visible )
			this.textArea.style.visibility = 'visible';
		else
			this.textArea.style.visibility = 'hidden';
	}
	return flags;
};
Friend.UI.Edit.renderDown = function ( flags )
{
 	return flags;
};
Friend.UI.Edit.processUp = function ( flags )
{
	if ( this.closeOnClick )
	{
		if ( this.controller.isMouseDown() )
		{
			var coords = this.getMouseCoords();
			if ( !this.rect.isPointIn( coords.x, coords.y ) )
			{
				this.destroy();
				if ( this.caller && this.onClose )
					this.onClose.apply( this.caller, [ this ] );
			}
		}
	}
	return this.startProcess( flags, [ 'x', 'y', 'z' ] );
};
Friend.UI.Edit.processDown = function ( flags )
{
	return this.endProcess( flags, [ 'x', 'y', 'z' ] );
};
Friend.UI.Edit.getValue = function( flags )
{
	return this.textArea.value;
};
Friend.UI.Edit.setValue = function( value, flags )
{
	this.textArea.value = value;
};


Friend.UI.ComboBox = function ( tree, name, flags )
{
	this.text = false;
	this.textColor = '#000000';
	this.backColor = '#808080';
	this.brightColor = '#C0C0C0';
	this.darkColor = '#404040';
	this.downColor = '#C0C0C0';
	this.mouseOverColor = '#A0A0A0';
	this.font = '12px Arial';
	this.caller = false;
	this.onClick = false;
	this.onChange = false;
	this.border = 'black';
	this.disabled = false;
	this.readOnly = false;
	this.content = false;
	this.text = '';
	this.defaultValue = -1;
	this.value = -1;
	this.numberOfLines = 10;
	this.type = 'list';
	this.rendererType = 'Canvas';
	Friend.Tree.Items.init( this, tree, name, 'Friend.UI.Edit', flags );
	Object.assign( this, Friend.UI.ComboBox );

	this.width -= flags.height;
	this.heightList = this.height * Math.max( this.content.length, this.numberOfLines );
	if ( this.defaultValue >= 0 )
	{
		this.text = this.content[ this.defaultValue ];
		this.value = this.defaultValue;
	}
	// Add default Gesture process
	this.parentOnClick = this.onClick;
	this.parentCaller = this.caller;
	this.onClick = this.onClickTitle;
	this.caller = this;
	this.addProcess( new Friend.UI.GestureButton( this.tree, this, {} ) );

	this.startInsertItems();
	this.arrow = new Friend.UI.Arrow( this.tree, name + '|arrow',
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
Friend.UI.ComboBox.renderUp = function ( flags )
{
	var color = this.backColor;
	if ( this.mouseOver )
		color = this.mouseOverColor;
	if ( this.down )
		color = this.downColor;
	this.thisRect.drawHilightedBox( flags, color, this.brightColor, this.darkColor );
	if ( this.value >= 0 )
	{
		var rect = new Friend.Utilities.Rect( this.thisRect );
		rect.x += 8;
		rect.width -= 16;
		rect.drawText( flags, this.text, this.font, this.textColor, 'left', 'center' );
	}
	return flags;
};
Friend.UI.ComboBox.renderDown = function ( flags )
{
 	return flags;
};
Friend.UI.ComboBox.processUp = function ( flags )
{
	return this.startProcess( flags, [ 'x', 'y', 'z', 'color', 'down', 'mouseOver', 'caller', 'onClick' ] );
};
Friend.UI.ComboBox.processDown = function ( flags )
{
	return this.endProcess( flags, [ 'x', 'y', 'z', 'color', 'down', 'mouseOver' ] );
};
Friend.UI.ComboBox.addLine = function ( item )
{
	this.content.push( item );
	if ( this.list )
		this.list.addLine( item );
};
Friend.UI.ComboBox.onClickTitle = function( item, coords )
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
			this.edit = new Friend.UI.Edit( this.tree, this.name + '|edit',
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
Friend.UI.ComboBox.onCloseEdit = function()
{
	if ( this.edit )
	{
		this.text = this.edit.getValue();
		this.doRefresh();
		this.edit.destroy();
		this.edit = null;
	}
};
Friend.UI.ComboBox.onClickArrow = function ()
{
	if ( !this.list )
	{
		this.startInsertItems();
		this.list = new Friend.UI.List( this.tree, this.name + '|list',
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
			this.list.addLine( this.content[ c ], c );
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
Friend.UI.ComboBox.onClickList = function( item )
{
	this.text = item.getValue();
	this.value = item.data;
	this.doRefresh();

	this.stopModal();
	this.list.destroy();
	this.list = null;
};
Friend.UI.ComboBox.getValue = function ()
{
	return this.value;
};

Friend.UI.Arrow = function ( tree, name, flags )
{
	this.text = false;
	this.backColor = '#808080';
	this.brightColor = '#C0C0C0';
	this.darkColor = '#404040';
	this.color = 'black';
	this.downColor = '#C0C0C0';
	this.mouseOverColor = '#A0A0A0';
	this.disabled = false;
	this.direction = 'top';
	this.size = 6;
	this.rendererType = 'Canvas';
	this.onClick = false;
	this.onChange = false;
	this.caller = false;
	Friend.Tree.Items.init( this, tree, name, 'Friend.UI.Arrow', flags );
	Object.assign( this, Friend.UI.Arrow );

	if ( this.defaultValue >= 0 )
	{
		this.text = this.content[ this.defaultValue ];
		this.value = this.defaultValue;
	}
	this.down = false;
	this.mouseOver = false;

	// Add default Gesture process
	this.addProcess( new Friend.UI.GestureButton( this.tree, this, flags ) );
};
Friend.UI.Arrow.renderUp = function ( flags )
{
	// Draw the box
	var color = this.backColor;
	if ( this.mouseOver )
		color = this.mouseOverColor;
	if ( this.down )
		color = this.downColor;
	this.thisRect.drawHilightedBox( flags, color, this.brightColor, this.darkColor );

	// Draw the arrow
	var rect = new Friend.Utilities.Rect( this.thisRect );
	rect.shrink( this.width - this.size, this.height - this.size );
	rect.drawFilledTriangle( flags, this.direction, this.color );
	return flags;
};
Friend.UI.Arrow.renderDown = function ( flags )
{
 	return flags;
};
Friend.UI.Arrow.processUp = function ( flags )
{
	return this.startProcess( flags, [ 'x', 'y', 'z', 'color', 'backColor', 'brightColor', 'darkColor', 'size', 'direction', 'down', 'mouseOver', 'caller', 'onClick', 'onChange' ] );
};
Friend.UI.Arrow.processDown = function ( flags )
{
	return this.endProcess( flags, [ 'x', 'y', 'z', 'color', 'backColor', 'brightColor', 'darkColor', 'size', 'direction', 'down', 'mouseOver' ] );
};
Friend.UI.Arrow.getValue = function ()
{
	return this.down;
};

/**
 * Button
 *
 * A simple button
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * Flags
 *
 * font: (string) the font to use
 * text: (string) text to display
 * textColor: (color) color of the text (default = theme)
 * backColor: (color) color of background (default = theme)
 * downColor: (color) color of background when mouse down (default = theme)
 * mouseOverColor: (color) color of background when mouse over button (default = theme)
 * borderWidth: (number) size of the button's border
 * brightColor: (color) color of illuminated side (default = theme)
 * darkColor: (color) color of dark side (default = theme)
 * onClick: (function) called when the button is clicked
 * caller: (object) object to call on click
 */
Friend.UI.Button = function ( tree, name, flags )
{
	this.text = false;
	this.textColor = '#000000';
	this.backColor = '#808080';
	this.downColor = '#C0C0C0';
	this.mouseOverColor = '#A0A0A0';
	this.brightColor = '#C0C0C0';
	this.darkColor = '#404040';
	this.font = '16px Arial';
	this.caller = false;
	this.onClick = false;
	this.rendererType = 'Canvas';
	Friend.Tree.Items.init( this, tree, name, 'Friend.UI.Button', flags );
	Object.assign( this, Friend.UI.Button );

	this.mouseOver = false;
	this.down = false;

	// Add default Gesture process
	this.addProcess( new Friend.UI.GestureButton( this.tree, this, flags ) );
};
Friend.UI.Button.renderUp = function ( flags )
{
	if ( this.refresh )
	{
		var color = this.backColor;
	    var xxText = this.width / 2;
	    var yyText = this.height / 2;
		if ( this.down )
		{
			color = this.downColor;
			xxText += 2;
			yyText += 2;
		}
		else if ( this.mouseOver )
			color = this.mouseOverColor;

		this.thisRect.drawHilightedBox( flags, color, this.brightColor, this.darkColor );
		this.thisRect.drawText( flags, this.text, this.font, this.textColor );
	}
	return flags;
};
Friend.UI.Button.renderDown = function ( flags )
{
    return flags;
};
Friend.UI.Button.processUp = function ( flags )
{
	return this.startProcess( flags, [ 'x', 'y', 'z', 'down', 'mouseOver', 'onClick', 'caller' ] );
};
Friend.UI.Button.processDown = function ( flags )
{
	return this.endProcess( flags, [ 'x', 'y', 'z', 'down', 'mouseOver' ] );
};




Friend.UI.HTMLButton = function ( tree, name, flags )
{
	this.text = false;
	this.font = '16px Arial';
	this.caller = false;
	this.onClick = false;
	Friend.Tree.Items.init( this, tree, name, 'Friend.UI.HTMLButton', flags );
	Object.assign( this, Friend.UI.HTMLButton );

	var textWidth = Friend.Utilities.measureText( this.text ).width;
	this.button = document.createElement( 'button' );
	this.button.tabIndex = tree.tabIndex++;
	this.button.type = 'button';
	this.button.innerHTML = this.text;
	this.button.style.position = 'absolute';
	this.button.style.textAlign = 'center';
	this.button.style.verticalAlign = 'middle';
	this.button.style.paddingTop = '0px';
	this.button.style.paddingLeft = this.width / 2 - textWidth / 2 - 8 + 'px';
	this.button.style.lineHeight = 'calc(100% - ' + this.height + 'px)';
	this.button.style.left = this.x + 'px';
	this.button.style.top = this.y + 'px';
	this.button.style.width = this.width + 'px';
	this.button.style.height = this.height + 'px';
	this.button.treeSelf = this;
	this.button.onclick = function()
	{
		if ( this.treeSelf.caller && this.treeSelf.onClick )
			this.treeSelf.caller[ this.treeSelf.onClick ].apply( this.treeSelf.caller, [ this.treeSelf ] );
	};
	document.body.appendChild( this.button );
};
Friend.UI.HTMLButton.renderUp = function ( flags )
{
	if ( this.button )
	{
		this.button.style.left = flags.xReal + 'px';
		this.button.style.top = flags.yReal + 'px';
		this.button.style.width = this.width + 'px';
		this.button.style.height = this.height + 'px';
	}
	return flags;
};
Friend.UI.HTMLButton.renderDown = function ( flags )
{
    return flags;
};
Friend.UI.HTMLButton.processUp = function ( flags )
{
	return this.startProcess( flags, [ 'x', 'y', 'z' ] );
};
Friend.UI.HTMLButton.processDown = function ( flags )
{
	return this.endProcess( flags, [ 'x', 'y', 'z' ] );
};
Friend.UI.HTMLButton.onDestroy = function ( flags )
{
	if ( this.button )
	{
		document.body.removeChild( this.button );
		this.button = null;
	}
};

Friend.UI.HTMLText = function ( tree, name, flags )
{
	this.text = false;
	this.font = '16px Arial';
	this.caller = false;
	this.onClick = false;
	Friend.Tree.Items.init( this, tree, name, 'Friend.UI.HTMLText', flags );
	Object.assign( this, Friend.UI.HTMLText );

	this.div = document.createElement( 'div' );
	this.div.innerHTML = this.text;
	this.div.style.position = 'absolute';
	this.div.style.left = this.x + 'px';
	this.div.style.top = this.y + 'px';
	this.div.style.width = this.width + 'px';
	this.div.style.height = this.height + 'px';
	this.div.treeSelf = this;
	this.div.onclick = function()
	{
		if ( this.treeSelf.caller && this.treeSelf.onClick )
			this.treeSelf.caller[ this.treeSelf.onClick ].apply( this.treeSelf.caller, [ this.treeSelf ] );
	};
	document.body.appendChild( this.div );
};
Friend.UI.HTMLText.renderUp = function ( flags )
{
	if ( this.button )
	{
		this.div.style.left = flags.xReal + 'px';
		this.div.style.top = flags.yReal + 'px';
		this.div.style.width = this.width + 'px';
		this.div.style.height = this.height + 'px';
	}
	return flags;
};
Friend.UI.HTMLText.renderDown = function ( flags )
{
    return flags;
};
Friend.UI.HTMLText.processUp = function ( flags )
{
	return this.startProcess( flags, [ 'x', 'y', 'z' ] );
};
Friend.UI.HTMLText.processDown = function ( flags )
{
	return this.endProcess( flags, [ 'x', 'y', 'z' ] );
};
Friend.UI.HTMLText.onDestroy = function ( flags )
{
	if ( this.div )
	{
		document.body.removeChild( this.div );
		this.div = null;
	}
};


/**
 * CheckBox
 *
 * A simple CheckBox
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * Flags
 *
 * font: (string) the font to use
 * text: (string) text to display
 * color: (string) color of the check
 * textColor: (color) color of the text (default = theme)
 * backColor: (color) color of background (default = theme)
 * mouseOverColor: (color) color when mouse over button (default = theme)
 * downColor: (strseting) color when clicking
 * onClick: (function) called when the button is clicked
 * caller: (object) object to call on click
 */
Friend.UI.CheckBox = function ( tree, name, flags )
{
	this.text = false;
	this.textColor = '#000000';
	this.backColor = '#FFFFFF';
	this.mouseOverColor = '#C0C0C0';
	this.downColor = '#000000';
	this.borderColor = '#000000';
	this.borderSize = 1;
	this.checkSize = 12;
	this.font = '16px Arial';
	this.caller = false;
	this.onClick = false;
	this.state = 0;
	this.rendererType = 'Canvas';
	Friend.Tree.Items.init( this, tree, name, 'Friend.UI.CheckBox', flags );
	Object.assign( this, Friend.UI.CheckBox );

	this.mouseOver = false;
	this.down = false;
};
Friend.UI.CheckBox.renderUp = function ( flags )
{
	if ( this.refresh )
	{
		// Clears the canvas
		this.thisRect.clear( flags );

		// Checkbox
		var rect = new Friend.Utilities.Rect( 0, this.rect.height / 2 - this.checkSize / 2, this.checkSize, this.checkSize );
		var backColor = this.backColor;
		if ( this.mouseOver )
			backColor = this.mouseOverColor;
		rect.drawBox( flags, backColor, this.borderColor, this.borderSize );

		// Checkmark
		if ( this.state )
		{
			rect.drawDiagonal( flags, this.downColor, 1, Friend.Flags.DIAGONAL_TOPLEFT_BOTTOMRIGHT | Friend.Flags.DIAGONAL_TOPRIGHT_BOTTOMLEFT );
		}

		// Text
		rect = new Friend.Utilities.Rect( this.thisRect );
		rect.x += this.checkSize + 4;
		rect.drawText( flags, this.text, this.font, this.textColor, 'left', 'middle' );
	}
	return flags;
};
Friend.UI.CheckBox.renderDown = function ( flags )
{
    return flags;
};
Friend.UI.CheckBox.processUp = function ( flags )
{
	if ( flags.command )
		return;

	if ( ! this.rect )
		return false;

	var ret = false;
	var coords = this.getMouseCoords();
	var mouseX = coords.x;
	var mouseY = coords.y;
	if ( this.rect.isPointIn( mouseX, mouseY ) )
	{
		if ( ! this.mouseOver )
			ret = true;
		this.mouseOver = true;
		if ( this.controller.isMouseClick() )
		{
			ret = true;
			this.down = true;
			this.state = 1 - this.state;
			if ( this.onClick )
				this.onClick.apply( this.caller, [ this.on ] );
		}
	}
	else
	{
		if ( this.mouseOver )
			ret = true;
		this.mouseOver = false;
		this.down = false;
	}
	if ( ret )
		this.doRefresh( 1 );
	return this.startProcess( flags, [ 'x', 'y', 'z' ] );
};
Friend.UI.CheckBox.processDown = function ( flags )
{
	return this.endProcess( flags, [ 'x', 'y', 'z' ] );
}
Friend.UI.CheckBox.getState = function ()
{
	return this.state;
}
Friend.UI.CheckBox.getValue = function ()
{
	return this.state;
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * List
 *
 * A scrollable list of items
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * Flags
 *
 * font: (string) the font to use
 * textColor: (color) color of item text (default = theme)
 * backColor: (color) color of background (default = theme)
 * downColor: (color) color of background when mouse down (default = theme)
 * mouseOverHilight: (color) color to be added to the text color when mouse over (default = theme)
 * clickHilight: (color) color of the text when clicked (default = theme)
 * sliderWith: (number) Width of the slider bar
 * onClick: (function) called when an item is clicked
 * onMouseOver: (function) called when the mouse is over one item
 * onDoubleClick: (function) called when the user double clicks on an item
 * caller: (object) object to call
 */
Friend.UI.List = function ( tree, name, flags )
{
	this.tree = tree;

	this.font = '16px Arial';
	this.backColor = '#FFFFFF';
	this.brightColor = '#000000';
	this.darkColor = '#000000';
	this.textColor = '#000000';
    this.borderSize = 1;
	this.mouseOverHilight = '#202020';
	this.clickHilight = '#404040';
	this.sliderWidth = 20;
	this.caller = false;
	this.onMouseOver = false;
	this.onClick = false;
	this.onDoubleClick = false;
	this.rendererType = 'Canvas';
	Friend.Tree.Items.init( this, tree, name, 'Friend.UI.List', flags );
	Object.assign( this, Friend.UI.List );

	this.lineHeight = this.renderer.getFontSize( this.font ) + 2;
	this.position = 0;
	this.nLines = Math.floor( this.height / this.lineHeight );
	this.startInsertItems();
	this.slider = this.addItem ( new Friend.UI.Slider( this.tree, 'slider',
	{
		root: this.root,
		parent: this,
		x: this.width - this.sliderWidth,
		y: 0,
		width: this.sliderWidth,
		height: this.height,
		position: this.position,
		range: this.nLines,
		size: this.items.length,
		caller: this,
		onChange: this.sliderChange
	} ) );
	this.endInsertItems();
};
Friend.UI.List.renderUp = function ( flags )
{
	if ( this.refresh )
	{
		// Draw box
		this.thisRect.drawHilightedBox( flags, this.backColor, this.brightColor, this.darkColor, this.borderSize );
	}
	return flags;
};
Friend.UI.List.renderDown = function ( flags )
{
    return flags;
};
Friend.UI.List.processUp = function ( flags )
{
	return this.startProcess( flags, [ 'x', 'y', 'z' ] );
};
Friend.UI.List.processDown = function ( flags )
{
	return this.endProcess( flags, [ 'x', 'y', 'z' ] );
};

/**
 * Reset
 *
 * Erasesd all items
 */
Friend.UI.List.reset = function (  )
{
	this.position = 0;
	this.dragPosition = 0;
	this.size = 0;
	this.items.splice( 1, this.items.length - 1 );
	this.doRefresh();
};

/**
 * addLine
 *
 * Adds a new line of text to the list
 *
 * @param (string) text of the line
 * @param (*) data to associate with the line
 * @return (string) identifier of the line
 */
Friend.UI.List.addLine = function ( text, data )
{
	this.startInsertItems();
	var text = new Friend.UI.Text( this.tree, this.name + '|text',
	{
		root: this.root,
		parent: this,
		x: this.borderSize,
		y: this.borderSize + this.lineHeight * ( this.items.length - 1 ),
		width: this.width - this.sliderWidth - 2,
		height: this.lineHeight,
		text: text,
		color: this.textColor,
		backColor: this.backColor,
        backColorMouseOver: this.renderer.addColor( this.backColor, '#181818', -1 ),
        backColorDown: this.renderer.addColor( this.backColor, '#303030', -1 ),
		font: this.font,
        multipleSelections: false,
		forceSx: true,
		forceSy: true,
		hAlign: 'left',
		vAlign: 'center',
		data: data,
		caller: this,
		onClick: this.click,
		onDoubleClick: this.doubleClick
	} );
	this.addItem( text );
	text.addProcess( new Friend.UI.GestureButton( this.tree, text, { } ) );
	this.endInsertItems();

	this.doRefresh();
	return text.identifier;
};
Friend.UI.List.click = function ( item )
{
    if ( !this.multipleSelections )
    {
        for ( var i = 1; i < this.items.length; i++ )
            this.items[ i ].activated = false;
    }
	item.activated = true;
	if ( this.caller && this.onClick )
		this.onClick.apply( this.caller, [ item ] );
};
Friend.UI.List.doubleClick = function ( item )
{
	item.activated = true;
	if ( this.caller && this.onDoubleClick )
		this.onDoubleClick.apply( this.caller, [ item ] );
};
Friend.UI.List.sliderChange = function ( position )
{
	this.setPosition( position );
};

/**
 * removeLine
 *
 * Deletes a item
 *
 * @param (string) identifier of the item to remove
 */
Friend.UI.List.removeLine = function ( identifier )
{
	for ( var i = 1; i < this.items.length; i ++ )
	{
		if ( this.items[ i ].identifier == identifier )
		{
			this.items.splice( i, 1 );
			this.doRefresh();
			i --;
		}
	}
};

/**
 * removeLine from text
 *
 * Deletes the item that contains the given text
 *
 * @param (string) text
 */
Friend.UI.List.removeLineFromText = function ( text )
{
	for ( var i = 1; i < this.items.length; i ++ )
	{
		if ( this.items[ i ].text == text )
		{
			this.items.splice( i, 1 );
			this.doRefresh();
			i --;
		}
	}
};

/**
 * removeLineFromData
 *
 * Delete the item associated with the given data
 *
 * @param (*) data to search
 */
Friend.UI.List.removeLineFromData = function ( data )
{
	for ( var i = 1; i < this.items.length; i ++ )
	{
		if ( this.items[ i ].data == data )
		{
			this.items.splice( i, 1 );
			this.doRefresh();
			i --;
		}
	}
};

/**
 * getItemFromIdentifier
 *
 * Returns the items matching the identifier
 *
 * @param (string) identifier
 */
Friend.UI.List.getItemFromIdentifier = function ( identifier )
{
	for ( var i = 1; i < this.items.length; i ++ )
	{
		if ( this.items[ i ].identifier = identifier )
			return this.items[ i ];
	}
	return false;
};

/**
 * setPosition
 *
 * Sets the position of the list
 *
 * @param (number) new position
 */
Friend.UI.List.setPosition = function ( position )
{
	this.position = position;
	for ( var i = 0; i < this.items.length - 1; i ++ )
	{
		var y = - this.position * this.lineHeight + i * this.lineHeight;
		if ( y + this.lineHeight > 0 && y < this.height + this.lineHeight )
		{
			this.items[ i + 1 ].y = y;
			this.items[ i + 1 ].active = true;
			this.items[ i + 1 ].visible = true;
		}
		else
		{
			this.items[ i + 1 ].active = false;
			this.items[ i + 1 ].visible = false;
		}
	}
	this.doRefresh();
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Slider
 *
 * A horizontal or vertical scrollbar
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * Flags
 *
 * direction: (string) 'horizontal' or 'vertical'
 * size: (number) size represented by the slider (default = 100)
 * range: (number) size represented by the dragging box (default = 10)
 * position: (number) position of the dragging box (default = 0)
 * backColor: (color) color of background (default = theme)
 * boxColor: (color) color of dragging box (default = theme)
 * brightColor: (color) color of bright side (default = theme)
 * darkColor: (color) color of dark side (default = theme)
 * arrowsColor: (color) color of arrows (default = theme)
 * mouseOverColor: (color) color to add when mouseover (default = theme)
 * mouseOverDirection: (color) add or subtract mouseOverColor (default = theme)
 * downColor: (color) color to add whgen mouse down (default = theme)
 * downDirection: (color) add or subtract downColor (default = theme)
 * onChange: (function) called when the position change
 * onMouseOver: (function) called when the mouse is over one item
 * onDoubleClick: (function) called when the user double clicks on an item
 * caller: (object) object to call
 */
Friend.UI.Slider = function ( tree, name, flags )
{
	this.backColor = '#808080';
	this.boxColor = '#808080';
	this.brightColor = '#C0C0C0';
	this.darkColor = '#606060';
	this.arrowsColor = '#000000';
	this.mouseOverColor = '#101010';
	this.mouseOverDirection = 1;
	this.downColor = '#202020';
	this.downDirection = 1;
	this.direction = 'vertical';
	this.caller = false;
	this.onChange = false;
	this.range = 10;
	this.position = 0;
	this.size = 100;
	this.rendererType = 'Canvas';
	Friend.Tree.Items.init( this, tree, name, 'Friend.UI.Slider', flags );
	Object.assign( this, Friend.UI.Slider );

	this.dragPosition = 0;
	this.mouseOver = false;
	this.mouseOverUp = false;
	this.downUp = false;
	this.mouseOverDown = false;
	this.downDown = false;
	this.mouseOverDrag = false;
	this.downDrag = false;
	this.topBottomAreasDown = false;

	if ( this.direction == 'vertical' )
	{
		this.x1UpBox = 0;
		this.y1UpBox = 0;
		this.x2UpBox = this.x1UpBox + this.width;
		this.y2UpBox = this.y1UpBox + this.width;
		this.x1DownBox = 0;
		this.y1DownBox = this.height - this.width;
		this.x2DownBox = this.x1DownBox + this.width;
		this.y2DownBox = this.y1DownBox + this.width;
	}
	else
	{
		this.x1UpBox = 0;
		this.y1UpBox = 0;
		this.x2UpBox = this.x1UpBox + this.height;
		this.y2UpBox = this.y1UpBox + this.height;
		this.x1DownBox = this.width - this.height;
		this.y1DownBox = 0;
		this.x2DownBox = this.x1DownBox + this.height;
		this.y2DownBox = this.y1DownBox + this.height;
	}
	this.distance = this.y1DownBox - this.y2UpBox;
};
Friend.UI.Slider.getDragPosition = function ( )
{
	return this.dragPosition;
};
Friend.UI.Slider.setDragPosition = function ( position )
{
	var ret = false;

	var dragSize = this.range / this.size * this.distance;
	if ( position + dragSize > this.distance )
		position = this.distance - dragSize;
	if ( position < 0 )
		position = 0;
	if ( position != this.dragPosition )
	{
		this.dragPosition = position;
		ret = true;
	}

	position = this.dragPosition / this.distance * this.size;
	if ( position != this.position )
	{
		this.position = position;
		ret = true;
	}
	return ret;
};
Friend.UI.Slider.getDragBoxRect = function ( )
{
	if ( ! this.rect )
		return false;

	var pos = this.dragPosition;
	var dragSize = ( ( this.range / this.size ) * this.distance );
    if ( dragSize > this.distance )
        return null;
	if ( dragSize < 16 )
		dragSize = 16;
	if ( pos + dragSize > this.distance )
		pos = Math.max( this.distance - dragSize, 0 );
	var rect = new Friend.Utilities.Rect();
	if ( this.direction == 'vertical' )
	{
		rect.x = 0;
		rect.width = this.width;
		rect.y = ( this.rectUp.y + this.rectUp.height + pos );
		rect.height = dragSize;
	}
	else
	{
		rect.y = 0;
		rect.height = this.height;
		rect.x = this.rectUp.x + this.rectUp.width + pos;
		rect.width = dragSize;
	}
	return rect;
};
Friend.UI.Slider.renderUp = function ( flags )
{
	if ( this.refresh )
	{
        var renderer = flags.renderer;

		// Draw box
		this.thisRect.drawHilightedBox( flags, this.backColor, this.brightColor, this.darkColor );

		// Top box
		this.rectUp = new Friend.Utilities.Rect( this.rect.x + this.x1UpBox, this.rect.y + this.y1UpBox, this.x2UpBox - this.x1UpBox, this.y2UpBox - this.y1UpBox );
        var rect = new Friend.Utilities.Rect( this.x1UpBox, this.y1UpBox, this.x2UpBox - this.x1UpBox, this.y2UpBox - this.y1UpBox );
		var color = this.boxColor;
		if ( this.mouseOverUp )
			color = renderer.addColor( this.boxColor, this.mouseOverColor, this.mouseOverDirection );
		if ( this.downUp )
			color = renderer.addColor( this.boxColor, this.downColor, this.downDirection );
		rect.drawHilightedBox( flags, color, this.brightColor, this.darkColor );
		var arrowRect = new Friend.Utilities.Rect( rect );
		arrowRect.shrink( rect.width / 2, rect.height / 2 );
		if ( this.direction == 'vertical' )
			arrowRect.drawFilledTriangle( flags, 'top', this.arrowsColor );
		else
			arrowRect.drawFilledTriangle( context, 'left', this.arrowsColor );

		// Bottom box
		this.rectDown = new Friend.Utilities.Rect( this.rect.x + this.x1DownBox, this.rect.y + this.y1DownBox, this.x2DownBox - this.x1DownBox, this.y2DownBox - this.y1DownBox );
		rect = new Friend.Utilities.Rect( this.x1DownBox, this.y1DownBox, this.x2DownBox - this.x1DownBox, this.y2DownBox - this.y1DownBox );
		var color = this.boxColor;
		if ( this.mouseOverDown )
			color = renderer.addColor( this.boxColor, this.mouseOverColor, this.mouseOverDirection );
		if ( this.downDown )
			color = renderer.addColor( this.boxColor, this.downColor, this.downDirection );
		rect.drawHilightedBox( flags, color, this.brightColor, this.darkColor );
		arrowRect = new Friend.Utilities.Rect( rect );
		arrowRect.shrink( rect.width / 3, rect.height / 3 );
		if ( this.direction == 'vertical' )
			arrowRect.drawFilledTriangle( flags, 'bottom', this.arrowsColor );
		else
			arrowRect.drawFilledTriangle( context, 'right', this.arrowsColor );

		// Drag box
		this.rectDrag = this.getDragBoxRect( 1, 1 );
        if ( this.rectDrag )
        {
            rect = new Friend.Utilities.Rect( this.rectDrag.x - this.rect.x, this.rectDrag.y - this.rect.y, this.rectDrag.width, this.rectDrag.height );
            var color = this.boxColor;
            if ( this.mouseOverDrag )
                color = renderer.addColor( this.boxColor, this.mouseOverColor, this.mouseOverDirection );
            if ( this.downDrag )
                color = renderer.addColor( this.boxColor, this.downColor, this.downDirection );
            rect.drawHilightedBox( flags, color, this.brightColor, this.darkColor );
        }
	}
	return flags;
};
Friend.UI.Slider.renderDown = function ( flags )
{
    return flags;
};
Friend.UI.Slider.processUp = function ( flags )
{
	if ( ! this.rect )
		return;

	var ret = false;
	var box = false;
	var dragPosition = this.dragPosition;

	var coords = this.getMouseCoords();
	var mouseX = coords.x;
	var mouseY = coords.y;

	// Dragging the center box?
	if ( this.downDrag )
	{
		if ( this.controller.isMouseDown() )
		{
			if ( this.direction == 'vertical' )
				var mouse = mouseY;
			else
				var mouse = mouseX;
			dragPosition = this.dragPositionStart + mouse - this.dragStart;
			ret = true;
		}
		else if ( this.downDrag )
		{
			this.downDrag = false;
			ret = true;
		}
	}
	else
	{
		if ( ! this.rect.isPointIn( mouseX, mouseY ) )
		{
			if ( this.mouseOver )
			{
				this.mouseOver = false;
				this.mouseOverUp = false;
				this.downUp = false;
				this.mouseOverDown = false;
				this.downDown = false;
				this.mouseOverDrag = false;
				this.downDrag = false;
				ret = true;
			}
		}
		else
		{
			var box = false;
			this.mouseOver = true;

			// Check UP box
			if ( this.rectUp.isPointIn( mouseX, mouseY ) )
			{
				box = true;
				if ( ! this.mouseOverUp )
					ret = true;
				this.mouseOverUp = true;
				if ( this.controller.isMouseDown() )
				{
					if ( ! this.downUp )
					{
						ret = true;
						this.downUp = true;
						dragPosition -= 1 / this.size * this.distance;
					}
				}
				else
				{
					if ( this.downUp )
					{
						this.downUp = false;
						ret = true;
					}
				}
			}
			else
			{
				if ( this.mouseOverUp )
					ret = true;
				this.mouseOverUp = false;
				this.downUp = false;
			}

			// Check DOWN box
			if ( this.rectDown.isPointIn( mouseX, mouseY ) )
			{
				box = true;
				if ( ! this.mouseOverDown )
					ret = true;
				this.mouseOverDown = true;
				if ( this.controller.isMouseDown() )
				{
					if ( ! this.downDown )
					{
						ret = true;
						this.downDown = true;
						dragPosition += 1 / this.size * this.distance;
					}
				}
				else
				{
					if ( this.downDown )
					{
						this.downDown = false;
						ret = true;
					}
				}
			}
			else
			{
				if ( this.mouseOverDown )
					ret = true;
				this.mouseOverDown = false;
				this.downDown = false;
			}

			// Check DRAG box
			if ( this.rectDrag && this.rectDrag.isPointIn( mouseX, mouseY ) )
			{
				box = true;
				if ( ! this.mouseOverDrag )
					ret = true;
				this.mouseOverDrag = true;
				if ( this.controller.isMouseDown() )
				{
					if ( ! this.downDrag )
					{
						ret = true;
						this.downDrag = true;
						this.dragPositionStart = dragPosition;
						if ( this.direction == 'vertical' )
							this.dragStart = this.mouseY;
						else
							this.dragStart = this.mouseX;
					}
				}
			}
			else
			{
				if ( this.mouseOverDrag )
					ret = true;
				this.mouseOverDrag = false;
				this.downDrag = false;
			}

			// Click on center areas
			if ( !box && this.rectDrag )
			{
				if ( this.controller.isMouseDown() )
				{
					if ( ! this.topBottomAreasDown )
					{
						ret = true;
						this.topBottomAreasDown = true;
						if ( this.direction == 'vertical' )
						{
							if ( mouseY < this.rectDrag.y )
								dragPosition -= this.range / this.size * this.distance;
							if ( mouseY > this.rectDrag.y + this.rectDrag.height )
								dragPosition += this.range / this.size * this.distance;
						}
						else
						{
							if ( mouseX < rectDrag.x )
								dragPosition -= this.range / this.size * this.distance;
							if ( mouseX > this.rectDrag.x + this.rectDrag.width )
								dragPosition += this.range / this.size * this.distance;
						}
					}
				}
				else
				{
					this.topBottomAreasDown = false;
				}
			}
		}
	}
	// Poke the changes in the slider
	if ( this.setDragPosition( dragPosition ) )
	{
		if ( this.caller && this.onChange )
			this.onChange.apply( this.caller, [ this.position, this.range, this.size ] );
	}
	if ( ret )
		this.doRefresh();
	return this.startProcess( flags, [ 'x', 'y', 'z' ] );
};
Friend.UI.Slider.processDown = function ( flags )
{
	return this.endProcess( flags, [ 'x', 'y', 'z' ] );
}

/**
 * setRange
 *
 * Sets the symbolic size of the dragging box
 *
 * @range (number) new range (must be inferior to size)
 */
Friend.UI.Slider.setRange = function ( range )
{
	var position = this.position;
	if ( position + range > this.size )
		position = this.size - range;
	if ( position < 0 )
	{
		position = 0;
		range = this.size - this.position;
	}
	if ( range != this.range || position != this.position )
	{
		this.range = range;
		this.position = position;
		return true;
	}
	return false;
};

/**
 * getRange
 *
 * Returns the current range
 *
 * @return (number) range
 */
Friend.UI.Slider.getRange = function ( )
{
	return this.range;
};


/**
 * setPosition
 *
 * Changes the position of the dragging box
 *
 * @param (number) new position
 */
Friend.UI.Slider.setPosition = function ( position )
{
	if ( position + this.range > this.size )
		position = this.size - this.range;
	if ( position < 0 )
		position = 0;
	if ( position != this.position )
	{
		this.position = position;
		return true;
	}
	return false;
};

/**
 * getPosition
 *
 * Returns the current position of the draggin box
 *
 * @return (number) position
 */
Friend.UI.Slider.getPosition = function ( )
{
	return this.position;
};

/**
 * setSize
 *
 * Sets the symbolic size represented by the slider
 *
 * @return (number) size
 */
Friend.UI.Slider.setSize = function ( size )
{
	var position = this.position;
	if ( position + this.range > size )
		position = size - this.range;
	if ( position < 0 )
		position = 0;
	if ( position != this.position || size != this.size )
	{
		this.size = size;
		this.position = position;
		return true;
	}
	return false;
};

/**
 * getSize
 *
 * Returns the symbolic size of the content
 *
 * @return (number) size
 */
Friend.UI.Slider.getSize = function ( )
{
	return this.size;
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * ProgressBar
 *
 * A horizontal or vertical progress bar
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * Flags
 *
 * position: (number) position of the bar (default = 0)
 * size: (number) size of data represented (default = 100)
 * direction: (number) Tree.DIRECTION_* flag (UP, DOWN, LEFT, RIGHT)
 * backColor: (color) color of background (default = theme)
 * color: (color) color of the bar (default = theme)
 * borderColor: (color) color of thei border(default = theme)
 * borderSize: (number) size of the border (default = theme)
 */
Friend.UI.ProgressBar = function ( tree, name, flags )
{
	this.backColor = '#FF0000';
	this.color = '#FFFF00';
	this.borderColor = '#000000';
	this.borderSize = '1';
	this.position = 50;
	this.size = 100;
	this.direction = Friend.Flags.DIRECTION_RIGHT;
	this.rendererType = 'Canvas';
	Friend.Tree.Items.init( this, tree, name, 'Friend.UI.ProgressBar', flags );
	Object.assign( this, Friend.UI.ProgressBar );
};
Friend.UI.ProgressBar.renderUp = function ( flags )
{
	var rect = new Friend.Utilities.Rect( this.thisRect );
	if ( this.borderSize && typeof this.borderColor != 'undefined' )
	{
		rect.drawRectangle( flags, this.borderColor, this.borderSize );
		rect.shrink( - this.borderSize, - this.borderSize )
	}
	if ( typeof this.backColor != 'undefined' )
		rect.drawBox( flags, this.backColor );

	switch ( this.direction )
	{
		case Friend.Flags.DIRECTION_RIGHT:
			rect.width = this.position / this.size * rect.width;
			break;
		case Friend.Flags.DIRECTION_LEFT:
			rect.x = rect.x + rect.width - ( this.position / this.size * rect.width );
			rect.width = this.position / this.size * rect.width;
			break;
		case Friend.Flags.DIRECTION_DOWN:
			rect.height = this.position / this.size * rect.height;
			break;
		case Friend.Flags.DIRECTION_UP:
			rect.y = rect.y + rect.height - ( this.position / this.size * rect.height );
			rect.height = this.position / this.size * rect.height;
			break;
	}
	rect.drawBox( flags, this.color );

	return flags;
};
Friend.UI.ProgressBar.renderDown = function ( flags )
{
    return flags;
};
Friend.UI.ProgressBar.processUp = function ( flags )
{
	return this.startProcess( flags, [ 'x', 'y', 'z', 'color', 'backColor', 'borderColor', 'borderSize', 'rotation', 'image' ] );
};
Friend.UI.ProgressBar.processDown = function ( flags )
{
	return this.endProcess( flags, [ 'x', 'y', 'z', 'rotation', 'color', 'backColor', 'borderColor', 'borderSize' ] );
};

/**
 * setPosition
 *
 * Changes the position of the progress bar
 *
 * @param (number) new position
 */
Friend.UI.ProgressBar.setPosition = function ( position )
{
	if ( position != this.position )
	{
		if ( position < 0 )
			position = 0;
		if ( position > this.size )
			position = this.size;
		this.position = position;
		this.doRefresh();
	}
};

/**
 * getPosition
 *
 * Returns the current position of the bar
 *
 * @return (number) position
 */
Friend.UI.ProgressBar.getPosition = function ()
{
	return this.position;
};

/**
 * setSize
 *
 * Sets the size of the data represented in the bar
 *
 * @param (number) size
 */
Friend.UI.ProgressBar.setSize = function ( size )
{
	this.size = size;
}


/**
 * getSize
 *
 * Returns the current size represented by the bar
 *
 * @return (number) size
 */
Friend.UI.ProgressBar.getSize = function ()
{
	return this.size;
}
