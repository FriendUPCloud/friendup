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
 * List object
 */
Friend.Tree.UI.List = function ( tree, name, properties )
{
	this.font = '14px sans serif';
	this.colorBack = '#FFFFFF';
	this.color = '#000000';

	this.multipleSelections = false;
	this.defaultSelected = -1;
	this.lines = [];
	this.options = [];
	this.caller = false;
	this.onClick = false;
	this.renderItemName = 'Friend.Tree.UI.RenderItems.List';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.List', properties );
	this.identifierCount = 1;
	this.addLines( this.lines );
};
Friend.Tree.UI.List.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'caller', 'onClick' ] );
};
Friend.Tree.UI.List.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height' ] );
};
Friend.Tree.UI.List.addLines = function ( lines )
{
	for ( var l = 0; l < lines.length; l++ )
		this.addLine( lines[ l ] );
};
Friend.Tree.UI.List.addLine = function ( line, value )
{
	var option;
	if ( typeof value == 'undefined' )
		value = 0;
	var identifier = 'ID' + this.identifierCount++;
	if ( typeof line == 'string' )
		option = { text: line, identifier: identifier, value: value, down: false, mouseOver: false };
	else
	{
		option = line;
		option.identifier = identifier;
		option.down = false;
		option.mouseOver = false;
		option.value = value;	
	}		
	this.options.push( option );
	this.callAllRenderItems( 'addLine', [ option ] );
	this.doRefresh();	
	return option.identifier;
};
Friend.Tree.UI.List.reset = function ( lines )
{
	this.options = [];
	this.callAllRenderItems( 'reset', [ lines ] );
	this.doRefresh();			
};
Friend.Tree.UI.List.removeLine = function ( identifier )
{
	for ( var o = 0; o < this.options.length; o++ )
	{
		if ( this.options[ o ].identifier == identifier )
		{
			this.options.splice( o, 1 );
			this.callAllRenderItems( 'removeLine', [ o ] );			
			this.doRefresh();	
		}
	}
};
Friend.Tree.UI.List.removeLineFromText = function ( text )
{
	for ( var o = 0; o < this.options.length; o++ )
	{
		if ( this.options[ o ].text == text )
		{
			this.options.splice( o, 1 );
			this.callAllRenderItems( 'removeLine', [ o ] );			
			this.doRefresh();	
		}
	}
};
Friend.Tree.UI.List.removeLineFromValue = function ( value )
{
	for ( var o = 0; o < this.options.length; o++ )
	{
		if ( this.options[ o ].value == value )
		{
			this.options.splice( o, 1 );
			this.callAllRenderItems( 'removeLine', [ o ] );		
			this.doRefresh();	
		}
	}
};
Friend.Tree.UI.List.getItemFromIdentifier = function ( identifier )
{
	for ( var o = 0; o < this.options.length; o++ )
	{
		if ( this.options[ o ].identifier == identifier )
		{
			return this.options[ o ];
		}
	}
	return null;
};
Friend.Tree.UI.List.getNumberOfLines = function()
{
	return this.options.length;
};


Friend.Tree.UI.RenderItems.List_HTML = function ( tree, name, properties )
{
	this.font = false;
	this.colorBack = false;
	this.color = false;
	this.options = false;

	this.rendererName = 'Renderer_HTML';
	this.rendererType = 'Element';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.List_HTML', properties );
	this.prepareElement( properties );
};
Friend.Tree.UI.RenderItems.List_HTML.prepareElement = function ( properties )
{
	this.element = document.createElement( 'select' );
	this.element.style.position = 'absolute';
	this.element.style.visibility = 'hidden';
	this.element.style.fontSize = this.utilities.getFontSize( this.item.font ) + 'px';
	this.element.style.fontFamily = this.utilities.getFontFamily( this.item.font );
	this.element.style.backgroundColor = this.item.colorBack;

	var self = this;
	this.element.onclick = function()
	{
		if ( self.item.caller && self.item.onClick )
			self.item.onClick.apply( self.item.caller, [ self.item.options[ this.selectedIndex ] ] );
	};
	this.element.ondblclick = function()
	{
		if ( self.item.caller && self.item.onDoubleClick )
			self.item.onDoubleClick.apply( self.item.caller, [ self.item.options[ this.selectedIndex ] ] );
	};
};
Friend.Tree.UI.RenderItems.List_HTML.render = function ( properties )
{
	this.element.size = Math.max( this.element.length, 3 );		// Keep the list open
	return properties;
};
Friend.Tree.UI.RenderItems.List_HTML.reset = function (  )
{
	while( this.element.length )
		this.element.remove( 0 );
};
Friend.Tree.UI.RenderItems.List_HTML.addLine = function ( source )
{
	var option = new Option( source.text, source.value, false, false );
	option.style.color = this.item.color;
	option.style.fontSize = this.utilities.getFontSize( this.item.font ) + 'px';
	option.style.fontFamily = this.utilities.getFontFamily( this.item.font );
	this.element.add( option );
};
Friend.Tree.UI.RenderItems.List_HTML.removeLine = function ( number )
{
	this.element.remove( number );
};



Friend.Tree.UI.RenderItems.List_Canvas2D = function ( tree, name, properties )
{
	this.font = false;
	this.colorBack = false;
	this.color = false;

	this.rendererName = 'Renderer_Canvas2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.List_Canvas2D', properties );
	Friend.Tree.UI.RenderItems.List_HTML.prepareElement.apply( this, [ properties ] );
	document.body.appendChild( this.element );
};
Friend.Tree.UI.RenderItems.List_Canvas2D.render = function ( properties )
{
	this.element.size = Math.max( this.element.length, 3 );		// Keep the list open
	this.element.style.zIndex = properties.z;
	this.element.style.left = properties.xReal + 'px';
	this.element.style.top = properties.yReal + 'px';
	this.element.style.width = this.width + 'px';
	this.element.style.height = this.height + 'px';
	this.element.style.opacity = properties.alpha.toString();
	this.element.style.visibility = this.visible ? 'visible' : 'hidden';
	return properties;
};
Friend.Tree.UI.RenderItems.List_Canvas2D.onDestroy = function ( properties )
{
	document.body.removeChild( this.element );
};
Friend.Tree.UI.RenderItems.List_Canvas2D.reset = Friend.Tree.UI.RenderItems.List_HTML.reset;
Friend.Tree.UI.RenderItems.List_Canvas2D.addLine = Friend.Tree.UI.RenderItems.List_HTML.addLine;
Friend.Tree.UI.RenderItems.List_Canvas2D.removeLine = Friend.Tree.UI.RenderItems.List_HTML.removeLine;

/*

Friend.Tree.UI.RenderItems.List_Three2D = function ( tree, name, flags )
{
	this.font = '12px Arial';
	this.colorBack = '#FFFFFF';
	this.brightColor = '#000000';
	this.darkColor = '#000000';
	this.color = '#000000';
	this.mouseOverColor = '#C0C0C0';
	this.downColor = '#808080';
    this.borderSize = 1;
	this.sliderWidth = 20;
	this.caller = false;
	this.onMouseOver = false;
	this.onClick = false;
	this.onDoubleClick = false;
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Three2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.List_Three2D', flags );
	this.parent.addProcess( new Friend.Tree.UI.GestureList( this.tree, this.parent, properties ) );
	this.lineHeight = this.renderer.getFontSize( this.font ) + 2;
	this.nLines = Math.floor( this.height / this.lineHeight );
	this.firstLine = 0;
	this.rects = [];
	
	this.startInsertItems();
	this.slider = this.addItem ( new Friend.Tree.UI.Slider( this.tree, 'slider',
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
Friend.Tree.UI.RenderItems.List_Three2D.render = function ( properties )
{
	// Draw box
	this.thisRect.drawHilightedBox( properties, this.colorBack, this.brightColor, this.darkColor, this.borderSize );
	var rect = new Friend.Tree.Utilities.Rect( this.rect );
	rect.shrink( this.borderSize, this.borderSize );
	rect.save( properties );
	rect.clip( properties );

	// Draw the lines	
	var count = 0;
	this.rects = [];
	for ( var o = this.position; o < this.item.options.length && o < this.nLines; o++ )
	{
		var option = this.item.options[ o ];
		var color = this.colorBack;
		if ( option.mouseOver )
			color = this.mouseOverColor;
		if ( option.down )
			color = this.downColor;
		rect.drawBox( properties, color );
		rect.drawText( properties, this.item.options[ o ].text, this.font, textColor, 'left', 'center' );
		this.rects.push( rect );
		rect.y += this.lineHeight;
	}

	// Restores the context
	rect.restore( properties );
	return properties;
};

Friend.Tree.UI.RenderItems.List_Three2D.reset = function (  )
{
	this.position = 0;
	this.items.splice( this.firstLine, this.items.length );
};
Friend.Tree.UI.RenderItems.List_Three2D.addLine = function ( option )
{
	this.startInsertItems();
	var text = new Friend.Tree.UI.Text( this.tree, this.name + '|text',
	{
		root: this.root,
		parent: this,
		x: this.borderSize,
		y: this.borderSize + this.lineHeight * ( this.items.length - this.firstLine ),
		width: this.width - this.sliderWidth - 2,
		height: this.lineHeight,
		text: option.text,
		color: this.textColor,
		colorBack: this.colorBack,
        colorBackMouseOver: this.renderer.addColor( this.colorBack, '#181818', -1 ),
        colorBackDown: this.renderer.addColor( this.colorBack, '#303030', -1 ),
		font: this.font,
        multipleSelections: false,
		forceWidth: true,
		forceHeight: true,
		hAlign: 'left',
		vAlign: 'center',
		value: option.value,
		caller: this,
		onClick: this.click,
		onDoubleClick: this.doubleClick,
		optionIdentifier: option.identifier
	} );
	this.addItem( text );
	this.endInsertItems();
};
Friend.Tree.UI.RenderItems.List_Three2D.sliderChange = function ( position )
{
	this.setPosition( position );
};
Friend.Tree.UI.RenderItems.List_Three2D.removeLine = function ( number )
{
	this.items.splice( number + this.firstLine, 1 );
};
Friend.Tree.UI.RenderItems.List_Three2D.setPosition = function ( position )
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
*/

/**
 * List
 *
 * A scrollable list of items - hand-drawn
 *
 */
/*
Friend.Tree.UI.D2List = function ( tree, name, flags )
{
	this.tree = tree;

	this.font = '16px Arial';
	this.colorBack = '#FFFFFF';
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
	this.rendererClip = true;
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.D2List', flags );

	this.lineHeight = this.renderer.getFontSize( this.font ) + 2;
	this.position = 0;
	this.nLines = Math.floor( this.height / this.lineHeight );
	this.startInsertItems();
	this.slider = this.addItem ( new Friend.Tree.UI.Slider( this.tree, 'slider',
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
Friend.Tree.UI.D2List.render = function ( flags )
{
	// Draw box
	this.thisRect.drawHilightedBox( flags, this.colorBack, this.brightColor, this.darkColor, this.borderSize );
	var rect = new Friend.Tree.Utilities.Rect( this.rect );
	rect.shrink( 3, 3 );
	rect.clip( flags );
	return flags;
};
Friend.Tree.UI.D2List.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z' ] );
};
Friend.Tree.UI.D2List.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z' ] );
};
Friend.Tree.UI.D2List.reset = function (  )
{
	this.position = 0;
	this.dragPosition = 0;
	this.size = 0;
	this.items.splice( 1, this.items.length - 1 );
	this.doRefresh();
};
Friend.Tree.UI.D2List.addLine = function ( text, data )
{
	this.startInsertItems();
	var text = new Friend.Tree.UI.Text( this.tree, this.name + '|text',
	{
		root: this.root,
		parent: this,
		x: this.borderSize,
		y: this.borderSize + this.lineHeight * ( this.items.length - 1 ),
		width: this.width - this.sliderWidth - 2,
		height: this.lineHeight,
		text: text,
		color: this.textColor,
		colorBack: this.colorBack,
        colorBackMouseOver: this.renderer.addColor( this.colorBack, '#181818', -1 ),
        colorBackDown: this.renderer.addColor( this.colorBack, '#303030', -1 ),
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
	text.addProcess( new Friend.Tree.UI.GestureButton( this.tree, text, { } ) );
	this.endInsertItems();

	this.doRefresh();
	return text.identifier;
};
Friend.Tree.UI.D2List.click = function ( item )
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
Friend.Tree.UI.D2List.doubleClick = function ( item )
{
	item.activated = true;
	if ( this.caller && this.onDoubleClick )
		this.onDoubleClick.apply( this.caller, [ item ] );
};
Friend.Tree.UI.D2List.sliderChange = function ( position )
{
	this.setPosition( position );
};
Friend.Tree.UI.D2List.removeLine = function ( identifier )
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
Friend.Tree.UI.D2List.removeLineFromText = function ( text )
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
Friend.Tree.UI.D2List.removeLineFromData = function ( data )
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
Friend.Tree.UI.D2List.getItemFromIdentifier = function ( identifier )
{
	for ( var i = 1; i < this.items.length; i ++ )
	{
		if ( this.items[ i ].identifier = identifier )
			return this.items[ i ];
	}
	return false;
};
Friend.Tree.UI.D2List.setPosition = function ( position )
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
*/
