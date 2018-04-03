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

Friend.Tree.UI.TreeBox = function ( tree, name, properties )
{
	this.wheelDelta = 32;
	this.position = 0;
	this.treeDefinition = false;
	this.renderItemName = 'Friend.Tree.UI.RenderItems.TreeBox';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.TreeBox', properties );

	this.yMaximum = 0;
	this.identifierCount = 0;	
	this.treeContent = [];
	var self = this;

	checkLine( this.treeDefinition[ 0 ], 0 );
	function checkLine( definition, rank )
	{
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
		if ( !definition.children )
			definition.children = [];
		definition.rect = new Friend.Tree.Utilities.Rect();
		definition.rectIcon = new Friend.Tree.Utilities.Rect();
		self.treeContent.push( definition );

		var previous = false;
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

Friend.Tree.UI.RenderItems.TreeBox_HTML = function ( tree, name, flags )
{
	this.font = '14px Arial';
	this.color = '#FFFFFF';
	this.mouseOverColor = '#808080';
	this.downColor = '#202020';
	this.backColor = '#404040';
	this.mouseOverBackColor = '#000080';
	this.downBackColor = '#0000C0';
	this.linesColor = '#FFFFFF';
	this.tabWidth = 16;
	this.iconWidth = 16;
	this.padding = 4;
	this.paddingLeft = 8;
	this.icons = true;
	this.lines = true;
	this.arrowRightName = 'arrowRight';
	this.arrowDownName = 'arrowDown';
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_HTML';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.TreeBox_HTML', flags );
	this.position = 0;
	this.parent.registerEvents( 'mouse' );
};
Friend.Tree.UI.RenderItems.TreeBox_HTML.render = function ( properties )
{
	// Draw background box
	this.thisRect.drawBox( properties, this.backColor );

	var rect = Friend.Tree.Utilities.Rect();
	rect.x = this.paddingLeft;
	rect.y = -this.parent.position;
	this.parent.yMaximum = 0;
	this.drawLine( properties, this.parent.treeContent[ 0 ], rect );
	return properties;
};
Friend.Tree.UI.RenderItems.TreeBox_HTML.drawLine = function ( properties, lineDefinition, rect )
{
	var measure = this.renderer.measureText( lineDefinition.text, this.font );
	var width = measure.width;
	var height = measure.height;
	rect.height = height;

	// Displayed or not?
	if ( rect.y + rect.height > 0 && rect.y <= this.height )
		inside = true;
	
	lineDefinition.inside = inside;

	// Erase background
	if ( inside )
	{
		var color = this.backColor;
		if ( lineDefinition.mouseOver )
			color = this.mouseOverBackColor;
		if ( lineDefinition.down )
			color = this.downBackColor;
		var x = rect.x;
		rect.x = this.paddingLeft;
		rect.width = this.width;
		rect.height = height;
		rect.drawBox( properties, color );
		rect.x = x;
	}
	lineDefinition.rect = Object.assign( {}, rect );

	// Draws the lines on the left
	if ( this.lines )
	{		
		// Find previous sibbling
		var parent = lineDefinition.parent;
		if ( parent )
		{
			properties.rendererItem.setLineWidth( properties, 1 );
			properties.rendererItem.setStrokeStyle( properties, this.linesColor );
			for ( var s = 0; s < parent.children.length; s++ )
			{
				if ( parent.children[ s ] == lineDefinition )
				{
					// Draw horizontal line to parent
					var x1 = this.paddingLeft + parent.rank * this.tabWidth + this.tabWidth / 2;
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
	// Draws the image on the left	
	var deltaX = 0;
	if ( lineDefinition.children.length )
	{
		if ( this.icons )
		{
			var image;
			if ( lineDefinition.open )
				image = this.resources.getImage( this.arrowDownName );
			if ( !image )
				image = this.resources.getImage( this.arrowRightName );
			if ( image )
			{
				if ( inside )
					rect.drawImage( properties, image, 'left', 'center' );
				lineDefinition.rectIcon = Object.assign( {}, rect );
				rect.x += height * 1.5;
				deltaX = -height * 1.5;
			}
		}
	}
	else
	{				
		if ( lineDefinition.icon )
		{
			image = this.resources.getImage( lineDefinition.icon );
			if ( image )
			{
				if ( inside )
					rect.drawImage( properties, image, 'left', 'center' );
				lineDefinition.rectIcon = Object.assign( {}, rect );
				rect.x += this.iconWidth;
				deltaX = -this.iconWidth;
			}
		}
	}

	// Draws the text
	rect.width = this.width - rect.x;
	var color = this.color;
	if ( lineDefinition.mouseOver )
		color = this.mouseOverColor;
	if ( lineDefinition.down )
		color = this.downColor;
	rect.drawText( properties, lineDefinition.text, this.font, color, 'left', 'center' );
	rect.x += deltaX;
	
	// Next!
	rect.y += height + this.padding;
	this.parent.yMaximum += height + this.padding;

	// Display children?
	if ( lineDefinition.open && lineDefinition.children.length )
	{
		rect.x += this.tabWidth;
		for ( var childNumber = 0; childNumber < lineDefinition.children.length; childNumber++ )
			this.drawLine( properties, lineDefinition.children[ childNumber ], rect );
		rect.x -= this.tabWidth;
	}
	return lineDefinition.children.length;	
};
Friend.Tree.UI.RenderItems.TreeBox_HTML.onMouse = function ( message )
{
	var refresh = false;
	switch( message.command )
	{
		case 'mousewheel':
			var delta = 16;
			if ( this.parent.wheelDelta )
				delta = this.parent.wheelDelta;
			this.parent.position += message.delta * delta;

			// Calculates the maximum in height
			if ( this.parent.yMaximum - this.parent.position < this.parent.height )
				this.parent.position = this.parent.yMaximum - this.parent.height;    

			// Too much on the top
			if ( this.parent.position < 0 )
				this.parent.position = 0;

			refresh = true;
			break;
		case 'mousemove':
			this.lineUnderMouse = false;
			for ( var l = 0; l < this.parent.treeContent.length; l++ )
			{
				var definition = this.parent.treeContent[ l ];
				if ( definition.rect.isPointIn( this.parent.mouse.x, this.parent.mouse.y ) )
				{
					this.lineUnderMouse = definition;
					console.log( 'Line under mouse: ' + definition.text );
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
			for ( var l = 0; l < this.parent.treeContent.length; l++ )
			{
				var definition = this.parent.treeContent[ l ];			
				if ( definition.mouseOver )
				{
					definition.mouseOver = false;
					this.lineUnderMouse = false;
					refresh = true;
				}
			}
			this.parent.doRefresh();
			break;
		case 'click':
			if ( this.lineUnderMouse )
			{
				// Erases down in all the others
				for ( var l = 0; l < this.parent.treeContent.length; l++ )
					this.parent.treeContent[ l ].down = 0;			

				refresh = true;
				if ( this.lineUnderMouse.children.length != 0 )
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
					for ( var l = 0; l < this.parent.treeContent.length; l++ )
						this.parent.treeContent[ l ].down = 0;			
					refresh = true;
					this.lineUnderMouse.down = true;
					if ( this.caller && this.onClick )
						this.onDoubleClick.apply( this.caller, [ this.lineUnderMouse ] );
				}
			}
			break;
	}
	if ( refresh )
		this.parent.doRefresh();
};

