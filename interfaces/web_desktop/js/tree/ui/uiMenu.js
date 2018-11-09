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
 * @date first pushed on 21/05/2018
 */
Friend = window.Friend || {};
Friend.Tree.UI = Friend.Tree.UI || {};
Friend.Tree.UI.RenderItems = Friend.Tree.UI.RenderItems || {};

//
// MenuBar
///////////////////////////////////////////////////////////////////////////////
Friend.Tree.UI.MenuBar = function ( tree, name, properties )
{
    this.list = [];
    this.color = '#FFFFFF';
    this.font = '14px sans serif';
    this.sizeBorder = 0;
    this.colorBorder = '#FFFFFF';
    this.paddingH = 2;
    this.paddingV = 2;
    this.type = 'bar';
    this.separatorH = 12;
    this.openOnMouseOver = true;
    this.theme = false;
    this.tools = false;
    this.caller = false;
    this.onOptionSelected = false;
	this.renderItemName = 'Friend.Tree.UI.RenderItems.MenuBar';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.MenuBar', properties );    

    this.setContent( this.list );
};
Friend.Tree.UI.MenuBar.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height' ] );
};
Friend.Tree.UI.MenuBar.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height' ] );
};
Friend.Tree.UI.MenuBar.setContent = function ( list )
{
    this.startInsertItems();
    
    // Create the sub tools
    var count = 0;
    var x = this.paddingH + this.sizeBorder;
    var y = this.paddingV + this.sizeBorder;
    var maxWidth = 0;
    for ( var l = 0; l < this.list.length; l++ )
    {
        var item = this.list[ l ];
        var itemProperties = 
        {
            root: this.root,
            parent: this,
            openOnMouseOver: this.openOnMouseOver,
            displayArrows: false,
            theme: this.theme,
            font: this.font,
            x: x,
            y: y + this.paddingV,
            level: 1,
            separatorH: this.separatorH,
            rootMenu: this
        };
    
        // Copy item properties
        for ( var p in item )
            itemProperties[ p ] = item[ p ];

        // Create the menu entry
        var newItem = new Friend.Tree.UI.MenuItem( this.tree, this.name + '-menu#' + count++, itemProperties );
        maxWidth = Math.max( maxWidth, newItem.width );
        this.addItem( newItem );
    
        // Next!
        x += newItem.width + this.paddingH * 2;
    }
    this.endInsertItems();
};
Friend.Tree.UI.MenuBar.clickOnItem = function ( item )
{
    // If this function is called, we are root! Call main item with the name of the option
    if ( this.caller && this.onOptionSelected )
        this.onOptionSelected.apply( this.caller, [ item.name, item ] );
};
Friend.Tree.UI.RenderItems.MenuBar_HTML = function ( tree, name, properties )
{
	this.color = false;

    this.rendererName = 'Renderer_HTML';
    this.rendererType = 'Canvas';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.MenuBar_HTML', properties );
};
Friend.Tree.UI.RenderItems.MenuBar_HTML.render = function ( properties )
{
    // Draw background box
    this.thisRect.drawBox( properties, this.item.color );

    // Continue drawing in this item
    properties.renderInParent = properties.rendererItem;

    return properties;
};

//
// MenuBar
///////////////////////////////////////////////////////////////////////////////
Friend.Tree.UI.MenuPopup = function ( tree, name, properties )
{
    this.list = [];
    this.color = '#FFFFFF';
    this.font = '14px sans serif';
    this.sizeBorder = 0;
    this.colorBorder = '#FFFFFF';
    this.paddingH = 2;
    this.paddingV = 2;
    this.openOnMouseOver = true;
    this.separatorH = 12; 
    this.theme = false;
    this.level = 0;
    this.type = 'popup';
    this.theme = false;
    this.fromInside = false;
    this.rootMenu = false;
    this.caller = false;
    this.onOptionSelected = false;
	this.renderItemName = 'Friend.Tree.UI.RenderItems.MenuPopup';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.MenuPopup', properties );    

    this.setContent( this.list );
    this.registerEvents( 'mouse' );
};
Friend.Tree.UI.MenuPopup.messageUp = function ( message )
{
    var changed;
    if ( message.command == 'mouseenter' )
        this.setModal( true );
    else if ( message.command == 'mouseleave' )
    {
        this.setModal( false );
        if ( !this.fromInside )
        {
            this.destroy();
        }
    }
	return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height' ] );
};
Friend.Tree.UI.MenuPopup.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height' ] );
};
Friend.Tree.UI.MenuPopup.setContent = function ( list )
{
    this.startInsertItems();
    
    // Create the sub tools
    var count = 0;
    var x = this.paddingH + this.sizeBorder;
    var y = this.paddingV + this.sizeBorder;
    var maxWidth = 0;
    for ( var l = 0; l < this.list.length; l++ )
    {
        var item = this.list[ l ];
        var itemProperties = 
        {
            root: this.root,
            parent: this,
            openOnMouseOver: this.openOnMouseOver,
            displayArrows: this.displayArrows,
            theme: this.theme,
            font: this.font,
            x: x,
            y: y,
            level: this.level + 1,
            renderInParent: true,
            separatorH: this.separatorH,
            rootMenu: this.fromInside ? this.rootMenu : this
        };
    
        // Copy item properties
        for ( var p in item )
            itemProperties[ p ] = item[ p ];
  
        // Create the menu entry
        var newItem = new Friend.Tree.UI.MenuItem( this.tree, '', itemProperties );         // Name in properties
        maxWidth = Math.max( maxWidth, newItem.width );
        this.addItem( newItem );

        // Next!
        y += newItem.height;
    }
    this.endInsertItems();

    // Resize all menuitems to the largest width
    for ( var i = 0; i < this.items.length; i++ )
    {
        var item = this.items[ i ];
        item.resize( maxWidth );
    }

    // Resize itself to match the width
    this.resize( maxWidth + this.paddingH * 2 + this.sizeBorder * 2, y + this.paddingV + this.sizeBorder );
};
Friend.Tree.UI.MenuPopup.clickOnItem = function ( item )
{
    // If this function is called, we are root! Call main item with the name of the option
    if ( this.caller && this.onOptionSelected )
        this.onOptionSelected.apply( this.caller, [ item.name, item ] );
};

Friend.Tree.UI.RenderItems.MenuPopup_HTML = function ( tree, name, properties )
{
	this.color = false;
	this.sizeBorder = false;
	this.colorBorder = false;

    this.rendererName = 'Renderer_HTML';
    this.rendererType = 'Canvas';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.MenuPopup_HTML', properties );
};
Friend.Tree.UI.RenderItems.MenuPopup_HTML.render = function ( properties )
{
    // Draw background box
    this.thisRect.drawBox( properties, this.item.color, this.item.sizeBorder, this.item.colorBorder );

    // Continue drawing in this item
    properties.renderInParent = properties.rendererItem;

    return properties;
};

//
// Menu Item
///////////////////////////////////////////////////////////////////////////////
Friend.Tree.UI.MenuItem = function( tree, name, properties )
{
    this.rootMenu = this;
    this.text = 'Text';
    this.shortcut = '';
    this.caller = false;
    this.onClick = false;
	this.colorText = '#000000';
    this.colorTextMouseOver = '#000000';
    this.colorTextDown = '#FFFFFF';
    this.colorTextInactive = '#808080';
    this.colorBack = '#FFFFFF';
    this.colorBackMouseOver = '#C0C0C0';
    this.colorBackDown = '#404040';
    this.colorBackInactive = '#FFFFFF';
    this.colorHint = '#000000';
    this.colorHintBack = '#AAAA00';
    this.sizeHintBorder = 1;
    this.colorHintBorder = '#000000';
    this.alphaShortcut = 0.5;
    this.paddingH = 4;
    this.paddingV = 2;
    this.separationH = 64;
    this.heightSeparator = 12;
    this.font = '12px Arial';
    this.nameImage = '';
    this.widthImage = 16;
    this.heightImage = 16;
    this.children = false;
    this.renderInParent = true;
    this.displayArrows = true;
    this.activated = true;
    this.renderInParent = false;
    this.openOnMouseOver = true;
    this.separatorH = 12;
    this.level = 0;
    this.theme = false;
    this.hint = true;
    this.textHint = false;
    this.rootMenu = false;
	this.renderItemName = 'Friend.Tree.UI.RenderItems.MenuItem';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.MenuItem', properties );
    this.mouseOver = false;
    this.down = false;
    if ( this.name != 'separator' )
    {
        this.parentCaller = this.caller;
        this.parentOnClick = this.onClick;
        this.onClick = this.clickOnItem;
        this.caller = this;
        this.addProcess( new Friend.Tree.UI.GestureButton( this.tree, this, properties ) );
    }
};
Friend.Tree.UI.MenuItem.messageUp = function( message )
{
    if ( message.command == 'destroy' && message.itemEvent == this )
    {
        if ( this.popup )
        {
            this.popup = false;
            clearInterval( this.popupHandle );
        }
    }
    return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'down', 'mouseOver', 'caller', 'onClick' ] );
};
Friend.Tree.UI.MenuItem.messageDown = function( message )
{
    this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'mouseOver', 'down' ] );

    if ( message.mouseOver == Friend.Tree.UPDATED )
    {
        var changed;
        if ( this.mouseOver && this.children && !this.popup && this.openOnMouseOver )
        {
            this.clickOnItem();
            changed = true;
        }
        if ( changed )
        {
            changed = 
            {
                command: 'selectionChanged',
                type: 'toParent',
                sender: this
            }
            this.tree.sendMessageToItem( this.tree, this.parent, changed, true );       // Recursive: will do all sibblings
        }
    }
    if ( message.command == 'selectionChanged' )
    {
        if ( this.popup && message.sender != this )
        {
            this.popup.destroy();
            this.popup = false;
            clearInterval( this.popupHandle );
        }        
    }
};
Friend.Tree.UI.MenuItem.clickOnItem = function()
{
    // Childrens? Open a sub menu
    if ( this.children && !this.popup )
    {
        var x = 0;
        var y = this.height - 1;
        if ( this.parent.type == 'popup' )
        {
            x = this.width - this.paddingH;
            y = 0;
        } 
        this.startInsertItems();
        this.popup = new Friend.Tree.UI.MenuPopup( this.tree, this.name + '-popup',
        {
            root: this.root,
            parent: this,
            x: x,
            y: y,
            z: this.z + 1,
            width: 0,
            height: 0,
            theme: this.theme,
            level: this.level + 1,
            list: this.children,
            separatorH: this.separatorH,
            fromInside: true,
            rootMenu: this.rootMenu
        } );
        this.addItem( this.popup );
        this.endInsertItems();
        var self = this;
        this.popupHandle = setInterval( function()
        {
            if ( !self.mouse.inside && !self.popup.mouse.inside )
            {
                self.popup.destroy();
                clearInterval( self.popupHandle );
                self.popup = false;
            }
        }, 1000 );
    }
    else
    {
        // Simple menu option: close all popups above
        var quit = false;
        var parent = this;
        while( parent != this.rootMenu )
        {
            parent = parent.parent;

            // Destroy popups and not items
            if ( parent.className == 'Friend.Tree.UI.MenuPopup' )
                parent.destroy();
        }

        // No click on a menu bar option
        if ( this.parent.className != 'Friend.Tree.UI.MenuBar' )
        {
            // If the caller was defined in the option itself, direct call
            if ( this.parentCaller && this.parentOnClick )
            {
                this.parentCaller.apply( this.parentOnClick, [ this ] );
            }
            else
            {
                // If not, call the root of the menu
                this.rootMenu.clickOnItem( this );
            }
        }
    }
};
Friend.Tree.UI.RenderItems.MenuItem_HTML = function( tree, name, flags )
{
	this.separatorH = false;
	this.heightSeparator = false;
	this.nameImage = false;
	this.paddingH = false;
	this.paddingV = false;
	this.text = false;
	this.font = false;
	this.shortcut = false;
	this.displayArrows = false;
	this.separationH = false;
	this.separationV = false;
	this.colorBack = false;
	this.colorBackMouseOver = false;
	this.colorBackDown = false;
	this.colorBackInactive = false;
	this.colorText = false;
	this.colorTextMouseOver = false;
	this.colorTextDown = false;
	this.colorTextInactive = false;
	this.widthImage = false;
	this.heightImage = false;
	this.alphaShortcut = false;
	this.displayArrows = false;

	this.rendererName = 'Renderer_HTML';
	this.rendererType = 'Canvas';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.MenuItem_HTML', flags );

    // Calculates size
    var width = 0;
    var height = 0;
    if ( this.item.name == 'separator' )
    {
        width += this.item.separatorH;
        height += this.item.heightSeparator;
    }
    else
    {
        if ( this.item.nameImage )
        {
            var image = this.resources.getImage( this.item.nameImage );
            if ( image )
            {
                width += this.item.paddingH + image.width;
                height += image.height;
            }
        }
        var o = this.renderer.measureText( this.item.text, this.item.font );
        width += o.width + this.item.paddingH;
        height = Math.max( height, o.height );
        if ( !this.item.children && this.item.shortcut )
        {
            width += this.item.separationH;
            o = this.renderer.measureText( this.item.shortcut, this.item.font );
            width += o.width;
            height = Math.max( height, o.height );
        }
        else
        {
            if ( this.item.displayArrows )
            {
                width += this.item.separationH;
                this.widthArrow = o.height * 0.5;
                this.heightArrow = o.height * 0.75;
                width += this.  widthArrow;
            }
        }
    }
    this.width = this.item.paddingH * 2 + width;
    this.height = this.item.paddingV * 2 + height;
};
Friend.Tree.UI.RenderItems.MenuItem_HTML.render = function( properties )
{
    // The background
    var color;
    if ( this.item.activated )
    {
        color = this.item.colorBack;
        if ( this.item.mouseOver )
            color = this.item.colorBackMouseOver;
        if ( this.item.down )          // I need to change this!
        {
            // No down aspect if it is a menubar entry
            if ( this.item.parent.className != 'Friend.Tree.UI.MenuBar' )
            {
                color = this.item.colorBackDown;
            }
        }
    }
    else
    {
        color = this.item.colorBackInactive;
    }
    this.thisRect.fillRectangle( properties, color );

    // Color of text
    if ( this.item.activated )
    {
        color = this.item.colorText;
        if ( this.item.mouseOver )
            color = this.item.colorTextMouseOver;
        if ( this.item.down )
        {
            if ( this.item.parent.className != 'Friend.Tree.UI.MenuBar' )
            {
                color = this.item.colorTextDown;
            }
        }
    }
    else
    {
        color = this.item.colorTextInactive;
    }

    // A separator?
    if ( this.item.name == 'separator' )
    {
        var x1 = this.thisRect.x + this.item.paddingH;
        var x2 = x1 + this.thisRect.width - this.item.paddingH;
        var y = this.thisRect.y + this.thisRect.height / 2;
        this.thisRect.drawLine( properties, x1, y, x2, y, color, 1 );
    }
    else
    {
        // The icon?
        var x = this.item.paddingH;
        var yCenter = this.thisRect.y + this.thisRect.height / 2;
        if ( this.item.nameImage )
        {
            var image = this.resources.getImage( this.item.nameImage );
            if ( image )
            {
                properties.rendererItem.drawImage( properties, image, x, yCenter - this.item.heightImage / 2, this.item.widthImage, this.item.heightImage );
                x += this.widthImage + this.paddingH;
            }
        }

        // The text
        properties.rendererItem.drawText( properties, x, yCenter, this.item.text, this.item.font, color, 'left', 'middle' );

        // A shortcut?
        if ( !this.item.children && this.shortcut )
        {
            properties.rendererItem.setAlpha( properties, this.item.alphaShortcut );
            properties.rendererItem.drawText( properties, this.thisRect.width - this.item.paddingH, yCenter, this.item.shortcut, this.item.font, color, 'right', 'middle' );
            properties.rendererItem.setAlpha( properties, properties.alpha );
        }
        else if ( this.item.children && this.item.displayArrows )
        {
            // An arrow?
            var rect = new Friend.Tree.Utilities.Rect( this.thisRect.width - this.item.paddingH - this.widthArrow, yCenter - this.heightArrow / 2, this.widthArrow, this.heightArrow );
            rect.drawFilledTriangle( properties, 'right', color );
        }
    }
	return properties;
};
Friend.Tree.UI.RenderItems.MenuItem_HTML.message = function ( message )
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
