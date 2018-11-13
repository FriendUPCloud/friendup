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
 * Tree engine interface processes
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 18/08/2017
 */
Friend = window.Friend || {};
Friend.Tree.UI = Friend.Tree.UI || {};
Friend.Flags = Friend.Flags || {};

Friend.Tree.UI.GestureButton = function( tree, item, flags )
{
	this.noMouseOver = false;
	this.noDown = false;
	this.noClick = false;
	this.noDoubleClick = false;
	Friend.Tree.Processes.init( tree, this, item, 'Friend.Tree.UI.GestureButton', flags );
	this.item.registerEvents( 'mouse' );

	this.mouseOver = false;
	this.down = false;
	this.click = false;
	this.doubleClick = false;
}
Friend.Tree.UI.GestureButton.processUp = function ( message )
{
	if ( message.type == 'mouse' )
	{
		var ret = false;
		switch( message.command )
		{
			case 'mouseenter':
				if ( !this.mouseOver )
				{
					ret = true;
					this.mouseOver = true;
				}
				break;
			case 'mouseleave':
				if ( this.mouseOver )
				{
					ret = true;
					this.mouseOver = false;
					this.down = false;
				}
				break;
			case 'click':
				if ( message.onClick && message.caller )
					message.onClick.apply( message.caller, [ this.item, this.item.getValue(), { x: message.mouse.x, y: message.mouse.y } ] );
				break;
			case 'dblclick':
				if ( message.onDoubleClick && message.caller )
					message.onDoubleClick.apply( message.caller, [ this.item, this.item.getValue(), { x: message.mouse.x, y: message.mouse.y } ] );
				break;
			case 'mousedown':
				if ( !this.down )
				{
					ret = true;
					this.down = true;
				}
				break;
			case 'mouseup':
				if ( this.down )
				{
					ret = true;
					this.down = false;
				}
				break;
		}
		if ( ret )
		{
			message.down = this.down;
			message.mouseOver = this.mouseOver;
			message.refresh = true;
		}
	}
	return true;
};
Friend.Tree.UI.GestureButton.processDown = function ( message )
{
	return true;
};

Friend.Tree.UI.GestureHint = function( tree, item, flags )
{
	this.timeoutAppear = 300;
	Friend.Tree.Processes.init( tree, this, item, 'Friend.Tree.UI.GestureHint', flags );
	this.item.registerEvents( 'mouse' );
	this.hint = false;
}
Friend.Tree.UI.GestureHint.processUp = function ( message )
{
	switch( message.command )
	{
		case 'mouseenter':
			if ( !this.hint )
			{
				var self = this;
				this.timeoutHandle = setTimeout( function()
				{
					// Still OK?
					if ( self.item.mouse.inside )
					{
						// Creates the hint
						self.item.startInsertItems();
						self.hint = new Friend.Tree.UI.Hint( self.tree, self.item.name + '-hint', 
						{
							root: self.item.root,
							parent: self.item,
							text: self.item.textHint
						} );
						self.item.addItem( self.hint );
						self.item.endInsertItems();

						// Timeout for closure (security)
						self.hintHandle = setInterval( function()
						{
							if ( !self.item.mouse.inside )
							{
								self.closeHint();
							}
						}, 50000 );
					}
				}, this.timeoutAppear );

				// Send recursive message to parent of item
				var msg =
				{
					command: 'closeHints',
					type: 'toParent',
					item: this.item
				}
				this.tree.sendMessageToItem( this.tree, this.item.parent, msg, true );
			}
			break;
		case 'mouseleave':
			this.closeHint();
			break;
		case 'closeHints':
			if ( message.item != this.item && this.hint )
			{
				this.closeHint();
			}
			break;
	}
	return true;
};
Friend.Tree.UI.GestureHint.closeHint = function ( message )
{
	if ( this.timeoutHandle )
	{
		clearTimeout( this.timeoutHandle );
		this.timeoutHandle = false;
	}
	if ( this.hint )
	{
		this.hint.destroy();
		this.hint = false;
		clearInterval( this.hintHandle );
	}
};
Friend.Tree.UI.GestureHint.processDown = function ( message )
{
	return true;
};


Friend.Tree.UI.GestureCheckBox = function( tree, item, flags )
{
	Friend.Tree.Processes.init( tree, this, item, 'Friend.Tree.UI.GestureCheckBox', flags );
	this.item.registerEvents( 'mouse' );

	this.mouseOver = this.item.mouseOver;
	this.down = this.item.down;
	this.value = this.item.value;
}
Friend.Tree.UI.GestureCheckBox.processUp = function ( message )
{
	if ( message.type == 'mouse' )
	{
		var ret = false;
		switch( message.command )
		{
			case 'mouseenter':
				if ( !this.mouseOver )
				{
					ret = true;
					this.mouseOver = true;
				}
				break;
			case 'mouseleave':
				if ( this.mouseOver )
				{
					ret = true;
					this.mouseOver = false;
					this.down = false;
				}
				break;
			case 'click':
				ret = true;
				this.down = true;
				this.value = 1 - this.value;
				if ( this.onClick )
					this.onClick.apply( this.caller, [ this.value ] );
				break;
			case 'mousedown':
				if ( !this.down )
				{
					ret = true;
					this.down = true;
				}
				break;
			case 'mouseup':
				if ( this.down )
				{
					ret = true;
					this.down = false;
				}
				break;
		}
		if ( ret )
		{
			message.down = this.down;
			message.mouseOver = this.mouseOver;
			message.value = this.value;
			message.refresh = true;
		}
	}
	return true;
};
Friend.Tree.UI.GestureCheckBox.processDown = function ( message )
{
	return true;
};


Friend.Tree.UI.GestureList = function( tree, item, flags )
{
	Friend.Tree.Processes.init( tree, this, item, 'Friend.Tree.UI.GestureList', flags );
	this.item.registerEvents( 'mouse' );
}
Friend.Tree.UI.GestureList.processUp = function ( message )
{
	var renderItem = this.item.renderItem; 
	if ( renderItem.className != 'Friend.Tree.UI.RenderItems.List' )
		return;

	var options = this.item.options;
	if ( message.type == 'mouse' )
	{
		switch( message.command )
		{
			case 'mouseleave':
				for ( var o = 0; o < options.length; o++ )
					options[ o ].mouseOver = false;
				message.refresh = true;
				break;
			case 'mouseMove':
				for ( var o = this.item.renderItem.position; o < options.length; o++ )
				{
					if ( renderItem.rects[ o ].isPointIn( this.item.mouse.x, this.item.mouse.y ) )
						this.item.options[ o ].mouseOver = true;
					else
						this.item.options[ o ].mouseOver = false;
				}
				message.refresh = true;
				break;
			case 'click':
				for ( var o = this.item.renderItem.position; o < options.length; o++ )
				{
					if ( renderItem.rects[ o ].isPointIn( this.item.mouse.x, this.item.mouse.y ) )
					{
						this.item.options[ o ].down = 1 - this.item.options[ o ].down;
						if ( message.onClick )
							message.onClick.apply( message.caller, [ o ] );
						break;
					}
				}
				message.refresh = true;
				break;
			case 'dblclick':
				for ( var o = this.item.renderItem.position; o < options.length; o++ )
				{
					if ( renderItem.rects[ o ].isPointIn( this.item.mouse.x, this.item.mouse.y ) )
					{
						if ( message.onDoubleClick )
							message.onDoubleClick.apply( message.caller, [ o ] );
						break;
					}
				}
				message.refresh = true;
				break;
		}
	}
	return true;
};
Friend.Tree.UI.GestureList.processDown = function ( message )
{
	return true;
};
