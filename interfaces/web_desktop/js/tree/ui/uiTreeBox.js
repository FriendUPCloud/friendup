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

Friend.Tree.UI.TreeBox = function ( tree, name, properties )
{
    this.font = '12px sans serif';
	this.colorText = '#FFFFFF';
	this.colorTextMouseOver = '#808080';
	this.colorTextDown = '#202020';
	this.colorBack = '#404040';
	this.colorBackMouseOver = '#000080';
	this.colorBackDown = '#0000C0';
	this.colorLines = '#FFFFFF';
	this.widthTab = 16;
	this.widthIcon = 16;
	this.heightIcon = 16;
	this.widthArrow = 8;
	this.heightArrow = 8;
	this.paddingH = 4;
	this.paddingV = 6;
	this.paddingLine = 4;
	this.paddingIcon = 4;
	this.alphaIcon = 0.5;
	this.icons = true;
	this.lines = true;
	this.nameArrowRight = false;
	this.nameArrowDown = false;

	this.caller = false;
	this.onClick = false;
	this.onDoubleClick = false;
	this.onRightClick = false;

	this.wheelDelta = 32;
	this.position = 0;
	this.treeDefinition = false;
	this.renderItemName = 'Friend.Tree.UI.RenderItems.TreeBox';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.TreeBox', properties );

	this.yMaximum = 0;
	this.identifierCount = 0;	
	this.treeContent = [];

	if ( this.treeDefinition )
	{
		this.setTreeDefinition( this.treeDefinition );
	}
};
Friend.Tree.UI.TreeBox.messageUp = function ( message )
{
	if ( message.type == 'mouse' )
		this.callRenderItem( 'onMouse', [ message ] );
	return this.startProcess( message, [ 'x', 'y', 'z', 'font', 'text' ] );
};
Friend.Tree.UI.TreeBox.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'font', 'text' ] );
};
Friend.Tree.UI.TreeBox.setTreeDefinition = function ( definition )
{
	var self = this;
	checkLine( definition, 0 );
	this.doRefresh();
	function checkLine( definition, rank )
	{
		if ( !definition.identifier )
			definition.identifier = '<T' + this.identifierCount++ + '>';
		definition.open = 1;
		definition.visible = true;
		definition.inside = false;
		definition.down = 0;
		definition.mouseOver = 0;
		definition.parent = false;
		definition.previousSibbling = false;
		definition.nextSibbling = false;
		definition.rank = rank;
		definition.rect = new Friend.Tree.Utilities.Rect();
		definition.rectIcon = new Friend.Tree.Utilities.Rect();
		self.treeContent.push( definition );

		var previous = false;
		if ( definition.children )
		{
			for ( var c = 0; c < definition.children.length; c++ )
			{
				checkLine( definition.children[ c ], rank + 1 );
				definition.children[ c ].parent = definition;
				definition.children[ c ].previousSibbling = previous;
				if ( c < definition.children.length - 1 )
					definition.children[ c ].nextSibbling = definition.children[ c + 1 ];
				else 
					definition.children[ c ].nextSibbling = false;
				previous = definition.children[ c ];				
			}
		}
	}
};
Friend.Tree.UI.TreeBox.getFirstLine = function ()
{
	this.currentGetLine = 0;
	return this.getNextLine();
};
Friend.Tree.UI.TreeBox.getNextLine = function ()
{
	if ( this.currentGetLine < this.treeContent.length )
		return this.treeContent[ this.currentGetLine++ ];
	return false;
};
Friend.Tree.UI.TreeBox.activateLine = function ( line )
{
	for ( var l = 0; l < this.treeContent.length; l++ )
		this.treeContent[ l ].down = false;
	line.down = true;
	this.doRefresh();
};
Friend.Tree.UI.TreeBox.deactivateLine = function ( line )
{
	line.down = false;
	this.doRefresh();
};


Friend.Tree.UI.RenderItems.TreeBox_HTML = function ( tree, name, flags )
{
    this.font = false;
	this.colorText = false;
	this.colorTextMouseOver = false;
	this.colorTextDown = false;
	this.colorBack = false;
	this.colorBackMouseOver = false;
	this.colorBackDown = false;
	this.colorLines = false;
	this.widthTab = false;
	this.widthIcon = false;
	this.heightIcon = false;
	this.widthArrow = false;
	this.heightArrow = false;
	this.paddingH = false;
	this.paddingV = false;
	this.paddingLine = false;
	this.paddingIcon = false;
	this.alphaIcon = false;
	this.icons = false;
	this.lines = false;
	this.nameArrowRight = false;
	this.nameArrowDown = false;

	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_HTML';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.TreeBox_HTML', flags );
	this.position = 0;
	this.item.registerEvents( 'mouse' );
};
Friend.Tree.UI.RenderItems.TreeBox_HTML.render = function ( properties )
{
	// Draw background box
	this.thisRect.drawBox( properties, this.item.colorBack );

	var rect = Friend.Tree.Utilities.Rect();
	rect.x = this.item.paddingH;
	rect.y = this.item.paddingV - this.item.position;
	this.item.yMaximum = 0;
	if ( this.item.treeContent.length )
		this.drawLine( properties, this.item.treeContent[ 0 ], rect );
	return properties;
};
Friend.Tree.UI.RenderItems.TreeBox_HTML.drawLine = function ( properties, lineDefinition, rect )
{
	var measure = this.renderer.measureText( lineDefinition.text, this.item.font );
	var height = measure.height + this.item.paddingLine;
	rect.height = height;

	// Displayed or not?
	var inside = false;
	if ( rect.y + rect.height > 0 && rect.y <= this.height )
		inside = true;
	
	lineDefinition.inside = inside;

	// Erase background
	rect.width = this.width - this.item.paddingH * 2;
	rect.height = height;
	if ( inside )
	{
		var color = this.item.colorBack;
		if ( lineDefinition.mouseOver )
			color = this.item.colorBackMouseOver;
		if ( lineDefinition.down )
			color = this.item.colorBackDown;
		var x = rect.x;
		rect.x = this.item.paddingH;
		rect.drawBox( properties, color );
		rect.x = x;
	}
	lineDefinition.rect = Object.assign( {}, rect );

	// Draws the lines on the left
	if ( this.item.lines )
	{		
		// Find previous sibbling
		var parent = lineDefinition.parent;
		if ( parent )
		{
			properties.rendererItem.setLineWidth( properties, 1 );
			properties.rendererItem.setStrokeStyle( properties, this.item.colorLines );
			if ( parent.children )
			{
				for ( var s = 0; s < parent.children.length; s++ )
				{
					if ( parent.children[ s ] == lineDefinition )
					{
						// Draw horizontal line to parent
						var x1 = this.item.paddingH + parent.rank * this.item.widthTab + this.item.widthArrow / 2;
						var x2 = rect.x;
						var y1 = rect.y + rect.height / 2;
						if ( inside )
						{
							properties.rendererItem.beginPath( properties );
							properties.rendererItem.moveTo( properties, x1, y1 );
							properties.rendererItem.lineTo( properties, x2, y1 );
							properties.rendererItem.stroke( properties );
							properties.rendererItem.closePath();
						}
	
						// Draw vertical line to parent (even if out of view)
						// Only the last sibbling in a group
						if ( !lineDefinition.nextSibbling )
						{
							var y1 = parent.rect.y + parent.rect.height;
							var y2 = rect.y + rect.height / 2;
							if ( y1 < this.height && y2 > 0 )
							{
								properties.rendererItem.beginPath( properties );
								properties.rendererItem.moveTo( properties, x1, y1 );
								properties.rendererItem.lineTo( properties, x1, y2 );
								properties.rendererItem.stroke( properties );
								properties.rendererItem.closePath();
							}
						}
						break;
					}
					previous = parent.children[ s ];				
				}
			}
		}
	}

	// Color of the text
	var color = this.item.colorText;
	if ( lineDefinition.mouseOver )
		color = this.item.colorTextMouseOver;
	if ( lineDefinition.down )
		color = this.item.colorTextDown;

	// Draws the image on the left	
	var xSave = rect.x;
	if ( lineDefinition.children && lineDefinition.children.length )
	{
		if ( this.item.icons )
		{
			var image, direction;
			if ( lineDefinition.open )
			{
				if ( this.item.nameArrowDown )
					image = this.resources.getImage( this.nameArrowDown );
				direction = 'bottom';
			}
			else
		 	{
				if ( this.nameArrowRight )
					image = this.resources.getImage( this.nameArrowRight );
				direction = 'right';
			}
			if ( image )
				lineDefinition.rectIcon = new Friend.Tree.Utilities.Rect( rect.x, rect.y + rect.height / 2 - this.item.heightIcon / 2, this.item.widthIcon, this.item.heightIcon );
			else
				lineDefinition.rectIcon = new Friend.Tree.Utilities.Rect( rect.x, rect.y + rect.height / 2 - this.item.heightArrow / 2, this.item.widthArrow, this.item.heightArrow );
			
			rect.x += lineDefinition.rectIcon.width + this.item.paddingIcon;
			if ( inside )
			{
				if ( image )
				{
					properties.rendererItem.setAlpha( properties, this.item.alphaIcon );
					lineDefinition.rectIcon.drawImage( properties, image );
					properties.rendererItem.setAlpha( properties, properties.alpha );
				}
				else
					lineDefinition.rectIcon.drawFilledTriangle( properties, direction, color );
			}
		}
	}
	else
	{				
		if ( this.item.icons && lineDefinition.icon )
		{
			lineDefinition.rectIcon = new Friend.Tree.Utilities.Rect( rect.x, rect.y + rect.height / 2 - this.item.heightIcon / 2, this.item.widthIcon, this.item.heightIcon );
			rect.x += this.item.widthIcon + this.item.paddingIcon;
			image = this.resources.getImage( lineDefinition.icon );
			if ( inside && image )
			{
				properties.rendererItem.setAlpha( properties, this.item.alphaIcon );
				lineDefinition.rectIcon.drawImage( properties, image );
				properties.rendererItem.setAlpha( properties, properties.alpha );
			}
		}
	}

	// Draws the text
	rect.width = this.width - this.item.paddingH - rect.x;		// Clip!
	rect.drawText( properties, lineDefinition.text, this.item.font, color, 'left', 'center' );
	rect.x = xSave;
	
	// Next!
	rect.y += height + this.item.paddingLine;
	this.item.yMaximum += height + this.item.paddingLine;

	// Display children?
	var l = 0;
	if ( lineDefinition.open && lineDefinition.children && lineDefinition.children.length )
	{
		l = lineDefinition.children.length;
		var xSave = rect.x;
		rect.x += this.item.widthTab;
		for ( var childNumber = 0; childNumber < lineDefinition.children.length; childNumber++ )
			this.drawLine( properties, lineDefinition.children[ childNumber ], rect );
		rect.x = xSave;
	}
	return l;	
};
Friend.Tree.UI.RenderItems.TreeBox_HTML.onMouse = function ( message )
{
	var refresh = false;
	switch( message.command )
	{
		case 'mousewheel':
			var delta = 16;
			if ( this.item.wheelDelta )
				delta = this.item.wheelDelta;
			this.item.position += message.delta * delta;

			// Calculates the maximum in height
			if ( this.item.yMaximum - this.item.position < this.item.height )
				this.item.position = this.item.yMaximum - this.item.height;    

			// Too much on the top
			if ( this.item.position < 0 )
				this.item.position = 0;

			refresh = true;
			break;
		case 'mousemove':
			this.lineUnderMouse = false;
			for ( var l = 0; l < this.item.treeContent.length; l++ )
			{
				var definition = this.item.treeContent[ l ];
				if ( definition.rect.isPointIn( this.item.mouse.x, this.item.mouse.y ) )
				{
					this.lineUnderMouse = definition;
					if ( !definition.mouseOver )
					{
						definition.mouseOver = true;
						refresh = true;
					}
				}
				else
				{
					if ( definition.mouseOver )
					{
						definition.mouseOver = false;
						refresh = true;
					}
				}
			}
			break;
		case 'mouseleave':
			for ( var l = 0; l < this.item.treeContent.length; l++ )
			{
				var definition = this.item.treeContent[ l ];			
				if ( definition.mouseOver )
				{
					definition.mouseOver = false;
					this.lineUnderMouse = false;
					refresh = true;
				}
			}
			this.item.doRefresh();
			break;
		case 'click':
			if ( this.lineUnderMouse )
			{
				// Erases down in all the others
				for ( var l = 0; l < this.item.treeContent.length; l++ )
					this.item.treeContent[ l ].down = 0;			

				refresh = true;
				if ( this.lineUnderMouse.children && this.lineUnderMouse.children.length != 0 )
					this.lineUnderMouse.open = 1 - this.lineUnderMouse.open;
				this.lineUnderMouse.down = 1;
				if ( this.caller && this.onClick )
					this.onClick.apply( this.caller, [ this.lineUnderMouse ] );
			}
			break;
		case 'dblclick':
			if ( this.lineUnderMouse )
			{
				if ( !this.lineUnderMouse.down )
				{
					// Erases down in all the others
					for ( var l = 0; l < this.item.treeContent.length; l++ )
						this.item.treeContent[ l ].down = 0;			
					refresh = true;
					this.lineUnderMouse.down = true;
					if ( this.caller && this.onDoubleClick )
						this.onDoubleClick.apply( this.caller, [ this.lineUnderMouse ] );
				}
			}
			break;
		case 'contextmenu':
			if ( this.lineUnderMouse && this.lineUnderMouse.mouseOver )
			{
				if ( this.caller && this.onRightClick )
					this.onRightClick.apply( this.caller, [ this.lineUnderMouse ] );
			}
			break;
	}
	if ( refresh )
		this.item.doRefresh();
};
Friend.Tree.UI.RenderItems.TreeBox_HTML.message = function ( message )
{
	switch ( message.command )
	{
		case 'resize':
			if ( message.width )
			{
				this.width = message.width;
				this.item.width = message.width;
			}
			if ( message.height )
			{
				this.height = message.height;
				this.item.height = message.height;
			}
			this.item.doRefresh();
			break;
		default:
			break;
	}
}
