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

/**
 * Slider - hand-drawn
 *
 */
/*
Friend.Tree.UI.D2Slider = function ( tree, name, flags )
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
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.D2Slider', flags );
	this.registerEvents( 'mouse' );

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
Friend.Tree.UI.D2Slider.getDragPosition = function ( )
{
	return this.dragPosition;
};
Friend.Tree.UI.D2Slider.setDragPosition = function ( position )
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
Friend.Tree.UI.D2Slider.getDragBoxRect = function ( )
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
	var rect = new Friend.Tree.Utilities.Rect();
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
Friend.Tree.UI.D2Slider.render = function ( flags )
{
	var renderer = flags.renderer;

	// Draw box
	this.thisRect.drawHilightedBox( flags, this.backColor, this.brightColor, this.darkColor );

	// Top box
	this.rectUp = new Friend.Tree.Utilities.Rect( this.thisRect.x + this.x1UpBox, this.thisRect.y + this.y1UpBox, this.x2UpBox - this.x1UpBox, this.y2UpBox - this.y1UpBox );
	var rect = new Friend.Tree.Utilities.Rect( this.x1UpBox, this.y1UpBox, this.x2UpBox - this.x1UpBox, this.y2UpBox - this.y1UpBox );
	var color = this.boxColor;
	if ( this.mouseOverUp )
		color = renderer.addColor( this.boxColor, this.mouseOverColor, this.mouseOverDirection );
	if ( this.downUp )
		color = renderer.addColor( this.boxColor, this.downColor, this.downDirection );
	rect.drawHilightedBox( flags, color, this.brightColor, this.darkColor );
	var arrowRect = new Friend.Tree.Utilities.Rect( rect );
	arrowRect.shrink( rect.width / 2, rect.height / 2 );
	if ( this.direction == 'vertical' )
		arrowRect.drawFilledTriangle( flags, 'top', this.arrowsColor );
	else
		arrowRect.drawFilledTriangle( context, 'left', this.arrowsColor );

	// Bottom box
	this.rectDown = new Friend.Tree.Utilities.Rect( this.thisRect.x + this.x1DownBox, this.thisRect.y + this.y1DownBox, this.x2DownBox - this.x1DownBox, this.y2DownBox - this.y1DownBox );
	rect = new Friend.Tree.Utilities.Rect( this.x1DownBox, this.y1DownBox, this.x2DownBox - this.x1DownBox, this.y2DownBox - this.y1DownBox );
	var color = this.boxColor;
	if ( this.mouseOverDown )
		color = renderer.addColor( this.boxColor, this.mouseOverColor, this.mouseOverDirection );
	if ( this.downDown )
		color = renderer.addColor( this.boxColor, this.downColor, this.downDirection );
	rect.drawHilightedBox( flags, color, this.brightColor, this.darkColor );
	arrowRect = new Friend.Tree.Utilities.Rect( rect );
	arrowRect.shrink( rect.width / 3, rect.height / 3 );
	if ( this.direction == 'vertical' )
		arrowRect.drawFilledTriangle( flags, 'bottom', this.arrowsColor );
	else
		arrowRect.drawFilledTriangle( context, 'right', this.arrowsColor );

	// Drag box
	this.rectDrag = this.getDragBoxRect( 1, 1 );
	if ( this.rectDrag )
	{
		rect = new Friend.Tree.Utilities.Rect( this.rectDrag.x - this.thisRect.x, this.rectDrag.y - this.thisRect.y, this.rectDrag.width, this.rectDrag.height );
		var color = this.boxColor;
		if ( this.mouseOverDrag )
			color = renderer.addColor( this.boxColor, this.mouseOverColor, this.mouseOverDirection );
		if ( this.downDrag )
			color = renderer.addColor( this.boxColor, this.downColor, this.downDirection );
		rect.drawHilightedBox( flags, color, this.brightColor, this.darkColor );
	}
	return flags;
};
Friend.Tree.UI.D2Slider.messageUp = function ( message )
{
	if ( message.type != 'mouse' )
		return false;

	var ret = false;
	var dragPosition = this.dragPosition;
	switch ( message.command )
	{
		case 'mouseleave':
			this.mouseOver = false;
			this.mouseOverUp = false;
			this.downUp = false;
			this.mouseOverDown = false;
			this.downDown = false;
			this.mouseOverDrag = false;
			this.downDrag = false;
			ret = true;
			break;
		default:
			var ret = false;
			var box = false;
			console.log( 'Mouse X: ' + this.mouse.x + '/ Mouse Y: ' + this.mouse.y );
			// Dragging the center box?
			if ( this.downDrag )
			{
				if ( this.mouse.isKeyDown( Friend.Tree.Mouse.LEFTBUTTON ) )
				{
					if ( this.direction == 'vertical' )
						var mouse = this.mouse.y;
					else
						var mouse = this.mouse.x;
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
				if ( !this.thisRect.isPointIn( this.mouse.x, this.mouse.y ) )
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
					if ( this.rectUp.isPointIn( this.mouse.x, this.mouse.y ) )
					{
						box = true;
						if ( ! this.mouseOverUp )
							ret = true;
						this.mouseOverUp = true;
						if ( this.mouse.isKeyDown( Friend.Tree.Mouse.LEFTBUTTON ) )
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
					if ( this.rectDown.isPointIn( this.mouse.x, this.mouse.y ) )
					{
						box = true;
						if ( ! this.mouseOverDown )
							ret = true;
						this.mouseOverDown = true;
						if ( this.mouse.isKeyDown( Friend.Tree.Mouse.LEFTBUTTON ) )
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
					if ( this.rectDrag && this.rectDrag.isPointIn( this.mouse.x, this.mouse.y ) )
					{
						box = true;
						if ( ! this.mouseOverDrag )
							ret = true;
						this.mouseOverDrag = true;
						if ( this.mouse.isKeyDown( Friend.Tree.Mouse.LEFTBUTTON ) )
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
						if ( this.mouse.isKeyDown( Friend.Tree.Mouse.LEFTBUTTON ) )
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
			break;
	}
	// Poke the changes in the slider
	if ( this.setDragPosition( dragPosition ) )
	{
		if ( this.caller && this.onChange )
			this.onChange.apply( this.caller, [ this.position, this.range, this.size ] );
	}
	if ( ret )
		this.doRefresh();
	return this.startProcess( message, [ 'x', 'y', 'z' ] );
};
Friend.Tree.UI.D2Slider.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z' ] );
}
Friend.Tree.UI.D2Slider.setRange = function ( range )
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
Friend.Tree.UI.D2Slider.getRange = function ( )
{
	return this.range;
};
Friend.Tree.UI.D2Slider.setPosition = function ( position )
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
Friend.Tree.UI.D2Slider.getPosition = function ( )
{
	return this.position;
};
Friend.Tree.UI.D2Slider.setSize = function ( size )
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
Friend.Tree.UI.D2Slider.getSize = function ( )
{
	return this.size;
};
*/