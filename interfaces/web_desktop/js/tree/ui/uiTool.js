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
 * @date first pushed on 06/05/2018
 */
Friend = window.Friend || {};
Friend.Tree.UI = Friend.Tree.UI || {};
Friend.Tree.UI.RenderItems = Friend.Tree.UI.RenderItems || {};

Friend.Tree.UI.Tool = function ( tree, name, properties )
{
    this.text = 'Tool description';
    this.shortcut = '';
    this.nameImage = false;
    this.children = [];
    this.color = '#808080';
    this.colorDown = '#C0C0C0';
    this.colorMouseOver = '#A0A0A0';
    this.colorBorder = '#FFFFFF';
    this.sizeBorder = 0;
    this.font = '12px sans serif';
    this.colorFont = '#FFFFFF';
    this.paddingH = 0;
    this.paddingV = 0;
    this.widthImage = 32;
    this.heightImage = 32;
    this.alphaDown = 1;
    this.alphaMouseOver = 1;
    this.alpha = 0.5;
    this.displayText = false;
    this.openOnMouseOver = false;
    this.caller = false;
    this.onClick = false;
    this.hint = true;
	this.textHint = false;
	
	this.renderItemName = 'Friend.Tree.UI.RenderItems.Tool';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.Tool', properties );    

    if ( this.children.length )
    {
        this.caller = this;
        this.onClick = this.openToolBox;
    }
    this.addProcess( new Friend.Tree.UI.GestureButton( this.tree, this, properties ) );
    if ( this.hint )
    {
        if ( !this.textHint )
            this.textHint = this.text;
        this.addProcess( new Friend.Tree.UI.GestureHint( this.tree, this, properties ) );
    }
};
Friend.Tree.UI.Tool.messageUp = function ( message )
{
    // Open / Close the tool box if it exists
	if ( message.type == 'mouse' )
	{
		if ( message.command == 'mouseenter' && this.openOnMouseOver )
		{
            this.openToolBox();
        }
    }    
    else if ( this.toolBox && message.type == 'refresh' )
    {
        var inside = this.mouse.inside || this.toolBox.mouse.inside;
        if ( !inside )
        {
            this.tree.setModal( this, false );
            this.toolBox.destroy();             // Will destroy all children
            this.toolBox = false;
            this.cancelEvent( 'refresh' );
        }
    }        
	return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'down', 'mouseOver', 'caller', 'onClick' ] );
};
Friend.Tree.UI.Tool.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'down', 'mouseOver', 'caller', 'onClick' ] );
};
Friend.Tree.UI.Tool.openToolBox = function ( message )
{
    if ( !this.toolBox && this.children.length )
    {
        // Create a box
        this.startInsertItems();
        var color = '#000000';
        var paddingH = 0;
        var paddingV = 0;

        // Look for a parent toolbar
        var parent = this.parent;
        while ( parent && parent.className != 'Friend.Tree.UI.Toolbar' )
            parent = parent.parent;
        if ( parent.className ==  'Friend.Tree.UI.Toolbar' )
        {
            color = parent.color;
            paddingH = parent.paddingH;
            paddingV = parent.paddingV;        
        }
        
        this.toolBox = new Friend.Tree.UI.ColorBox( this.tree, this.name + '-box',
        {
            root: this.root,
            parent: this,
            x: this.rect.x + this.widthImage,
            y: this.rect.y + this.heightImage / 5,
            z: this.z + 1,
            width: 0,
            height: 0,
            theme: this.theme,
            color: color,
            sizeBorder: this.sizeBorder,
            colorBorder: this.colorBorder,
            renderSubItems: true
        } );
        this.addItem( this.toolBox );
        this.toolBox.registerEvents( 'mouse' );     // To check if the mouse is inside!
        this.endInsertItems();

        // Create the sub tools
        var count = 0;
        this.toolBox.startInsertItems();
        var y = this.paddingV;
        var maxWidth = 0;
        for ( var t = 0; t < this.children.length; t++ )
        {
            var tool = this.children[ t ];
            var toolProperties = 
            {
                root: this.root,
                parent: this.toolBox,
                width: this.widthImage,
                height: this.heightImage,
                widthImage: this.widthImage,
                heightImage: this.heightImage,
                paddingV: paddingV,
                paddingH: paddingH, 
                color: this.color,
                colorDown: this.colorDown,
                colorMouseOver: this.colorMouseOver,
                theme: this.theme,
                x: paddingH + this.sizeBorder,
                y: y + paddingV,
                hint: false
            };

            // Copy tool properties
            for ( var p in tool )
                toolProperties[ p ] = tool[ p ];

            // Create the tool
            var newTool = new Friend.Tree.UI.Tool( this.tree, this.name + '-subtool#' + count++, toolProperties );
            maxWidth = Math.max( maxWidth, newTool.width );
            this.toolBox.addItem( newTool );

            // Next!
            y += this.heightImage + paddingV * 2;
        }
        this.toolBox.width = maxWidth + paddingH * 2 + this.sizeBorder * 2;
        this.toolBox.height = y;
        this.toolBox.endInsertItems();

        // Message only for the tool and its children
        this.tree.setModal( this, true );
        this.registerEvents( 'refresh' );
    }
};

Friend.Tree.UI.RenderItems.Tool_HTML = function ( tree, name, properties )
{
	this.text = false;
    this.shortcut = false;
    this.nameImage = false;
    this.children = false;
    this.color = false;
    this.colorDown = false;
    this.colorMouseOver = false;
    this.colorBorder = false;
    this.sizeBorder = false;
    this.font = false;
    this.colorFont = false;
    this.paddingH = false;
    this.paddingV = false;
    this.widthImage = false;
    this.heightImage = false;
    this.alphaDown = false;
    this.alphaMouseOver = false;
    this.alpha = false;
    this.displayText = false;
    this.theme = false;

    this.rendererName = 'Renderer_HTML';
    this.rendererType = 'Canvas';
    this.renderInParent = true;
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Tool_HTML', properties );
    this.setImage();

    // Calculates size
    var o = this.renderer.measureText( this.item.text, this.item.font );
    this.width = this.item.widthImage + ( this.item.displayText ? o.width + this.item.paddingH * 2 : 0 ) + this.item.paddingH * 2;
    this.height = Math.max( this.item.heightImage, o.height ) + this.item.paddingV * 2;
    this.item.width = this.width;
    this.item.height = this.height;
};
Friend.Tree.UI.RenderItems.Tool_HTML.render = function ( properties )
{
    // Draw background box
    var alpha = this.item.alpha;
    var color = this.item.color;
    if ( this.item.mouseOver )
    {
        color = this.item.colorMouseOver;
        alpha = this.item.alphaMouseOver;
    }
    if ( this.item.down )
    {
        color = this.item.colorDown;
        alpha = this.item.alphaDown;
    }
    if ( color == '' && this.item.parent )
        color = this.item.parent.color;
    if ( color && color != '' )
	    this.thisRect.drawBox( properties, color );

    // Draw image
    var rect = new Friend.Tree.Utilities.Rect( this.thisRect );
    rect.x += this.item.paddingH;
    rect.y += this.item.paddingV;
    properties.context.setAlpha( properties, alpha );
    properties.context.drawImage( properties, this.image, rect.x, rect.y, this.item.widthImage, this.item.heightImage );

    // Draw arrow if children and mouseover
    if ( this.item.children.length > 0 )
    {
        var arrow = this.resources.getImage( 'toolArrow' );
        if ( arrow )
            properties.context.drawImage( properties, arrow, rect.x + this.item.widthImage - 8, rect.y + this.item.heightImage - 8, 8, 8 );
    }

    // Draw text
    if ( this.item.displayText )
    {
        rect.x += this.item.widthImage + this.item.paddingH;
        rect.drawText( properties, this.item.text, this.item.font, this.item.colorFont, 'left', 'middle' );
    }
	return properties;
};
Friend.Tree.UI.RenderItems.Tool_HTML.setImage = function()
{	
	if ( this.nameImage != this.item.nameImage )
	{
		var image = this.resources.getImage( this.item.nameImage );
		if ( image )
		{
            this.nameImage = this.item.nameImage;
            this.image = image;
			this.hotSpotX = image.hotSpotX;
			this.hotSpotY = image.hotSpotY;
			return true; 
		}
		else
		{
		    Friend.Tree.log( this, { level: Friend.Tree.ERRORLEVEL_HIGH, error: 'non existant image: ' + this.image + '.' })
		}
	}
    return false;
};
