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
 * Tree engine interface elements: tabs
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.UI = Friend.Tree.UI || {};
Friend.Tree.UI.RenderItems = Friend.Tree.UI.RenderItems || {};

Friend.Tree.UI.Tabs = function( tree, name, flags )
{
    this.font = '12px sans serif';
    this.colorBack = '#404040';
    this.colorText = '#E0E0E0';
    this.colorTextMouseOver = '#FF0000';
    this.colorTextDown = '#FFFF00';
    this.colorTab = '#808080';
    this.colorTabDown = '#C0C0C0';
    this.colorTabMouseOver = '#FFFF00';
    this.position = 0;
    this.wheelDelta = -32; 
    this.history = [];
    this.theme = false;
    this.paddingLeft = 10;
    this.paddingRight = 10;
    this.widthIcon = 8;
    this.heightIcon = 8;
    this.paddingIcon = 4;
    this.button = false;
	this.tabs = [];
	this.caller = false;
    this.onClick = false;
    this.onButton = false;

	this.renderItemName = 'Friend.Tree.UI.RenderItems.Tabs';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.Tabs', flags );
    this.checkTabs();
};
Friend.Tree.UI.Tabs.messageUp = function( message )
{
    return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'tabs', 'position' ] );
};
Friend.Tree.UI.Tabs.messageDown = function( message )
{
    return this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'tabs', 'position' ] );
};
Friend.Tree.UI.Tabs.getFirstTab = function()
{
    this.currentGetTab = 0;
    return this.getNextTab();
};
Friend.Tree.UI.Tabs.getNextTab = function()
{
    if ( this.currentGetTab < this.tabs.length )
        return this.tabs[ this.currentGetTab++ ];
    return false;
};
Friend.Tree.UI.Tabs.getTab = function( identifier )
{
    for ( var t = 0; t < this.tabs.length; t++ )
    {
        if ( this.tabs[ t ].identifier == identifier )
            return this.tabs[ t ];
    }
    return false;
};
Friend.Tree.UI.Tabs.getNewIdentifier = function()
{
    var identifier;
    while( true )
    {
        identifier = '<tab>' + Math.random() * 1000000;
        var flag = false;
        for ( t = 0; t < this.tabs.length; t++ )
        {
            if ( this.tabs[ t ].identifier == identifier )
            {
                flag = true;
                break;
            }
        }
        if ( !flag )
            break;
    }
};
Friend.Tree.UI.Tabs.findTabPosition = function( tab )
{
    for ( var t = 0; t < this.tabs.length; t++ )
    {
        if ( this.tabs[ t ] == tab )
            return t;
    }
    return -1;
};
Friend.Tree.UI.Tabs.findTabFromIdentifier = function( identifier )
{
    for ( var t = 0; t < this.tabs.length; t++ )
    {
        if ( this.tabs[ t ].identifier == identifier )
            return this.tabs[ t ];
    }
    return null;
};
Friend.Tree.UI.Tabs.checkTabs = function( position, tab )
{
    for ( var t = 0; t < this.tabs.length; t++ )
    {
        if ( !this.tabs.identifier )
            this.tabs.identifier = this.getNewIdentifier();
    }
};
Friend.Tree.UI.Tabs.getHistory = function()
{
    return this.history;
};
Friend.Tree.UI.Tabs.setHistory = function( history )
{
    this.history = [];

    // Checks the validity of the identifiers 
    for ( var h = 0; h < history.length; h++ )
    {
        var tab = this.findTabFromIdentifier( history[ h ] );
        if ( tab )
            this.history.push( history[ h ] );
    }
};
Friend.Tree.UI.Tabs.insertTab = function( tab, position )
{
    // Generates an identifier
    if ( !tab.identifier )
        tab.identifier = this.getNewIdentifier();
        
    // Insert at position
    if ( typeof position == 'string' )
    {
        switch ( position )
        {
            case 'start':
                position = 0;
                break;
            case 'end':
                position = this.tabs.length;
                break;
            case 'current':
                if ( this.history.length )
                {
                    var current = this.findTabFromIdentifier( this.history[ 0 ] );
                    var position = this.findTabPosition( current );
                }
                else
                    position = 0;
                break;
            case 'afterCurrent':
                if ( this.history.length )
                {
                    var current = this.findTabFromIdentifier( this.history[ 0 ] );
                    var position = this.findTabPosition( current ) + 1;
                }
                else
                    position = 0;
                break;
        }
    }
    if ( typeof position == 'undefined' )
        position = this.tabs.length;
    if ( position < 0 )
        position = 0;
    if ( position > this.tabs.length )
        position = this.tabs.length;

    // Insert in array
    this.tabs.splice( position, 0, tab );

    // Activate the new tab
    this.activateTab( tab );
}
Friend.Tree.UI.Tabs.deleteTab = function( tab )
{
    var t = this.findTabPosition( tab );
    if ( t >= 0 )
    {
        // Removes from array
        this.tabs.splice( t, 1 );

        // Removes from history
        for ( var h = 0; h < this.history.length; h++ )
        {
            if ( this.history[ h ] == tab.identifier )
            {
                this.history.splice( h, 1 );
                break;
            }
        }

        // Activate previous in history
        tab = null;
        if ( this.history.length )
        {
            tab = this.findTabFromIdentifier( this.history[ 0 ] );
            this.activateTab( tab );
        }
        this.doRefresh();
        return tab;
    }   
    return null;
};
Friend.Tree.UI.Tabs.activateTab = function( tab )
{
    if ( typeof tab != 'object' )
        tab = this.findTabFromIdentifier( tab );
    var position = this.findTabPosition( tab );

    // Activate it
    for ( var t = 0; t < this.tabs.length; t++ )
        this.tabs[ t ].down = false;
    this.tabs[ position ].down = true;

    // Store history
    var history = [];
    history.push( tab.identifier );
    for ( var h = 0; h < this.history.length; h++ )
    {
        if ( this.history[ h ] != tab.identifier )
            history.push( this.history[ h ] );
    }
    this.history = history;

    this.doRefresh();
};




Friend.Tree.UI.RenderItems.Tabs_HTML = function( tree, name, properties )
{    
	this.font = false;
    this.colorBack = false;
    this.colorText = false;
    this.colorTextMouseOver = false;
    this.colorTextDown = false;
    this.colorTab = false;
    this.colorTabDown = false;
    this.colorTabMouseOver = false;
    this.position = false;
    this.wheelDelta = false; 
    this.paddingLeft = false;
    this.paddingRight = false;
    this.widthIcon = false;
    this.heightIcon = false;
    this.paddingIcon = false;
    this.button = false;
	this.tabs = [];

    this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_HTML';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Tabs_HTML', properties );
    
    // Set the item for handling mouse messages
	this.item.registerEvents( 'mouse' );
    this.item.addProcess( new Friend.Tree.UI.GestureTabs( this.tree, this.item, properties ) );
    
    // First one activated by default
    if ( this.item.tabs.length > 0 )
        this.item.tabs[ 0 ].down = true;
};

Friend.Tree.UI.RenderItems.Tabs_HTML.render = function( properties )
{
    // Erases the whole area
    this.thisRect.fillRectangle( properties, this.item.colorBack );

    var x = -this.item.position;
    var rect = new Friend.Tree.Utilities.Rect( this.thisRect );
    for ( var t = 0; t < this.item.tabs.length; t++ )
    {
        // Calculate width of tab
        var tab = this.item.tabs[ t ];
        var textWidth = this.utilities.measureText( tab.text, this.item.font ).width;
        var width = textWidth;
        if ( tab.icon )
            width += this.item.paddingIcon + this.item.widthIcon;
        if ( this.item.button && ( tab.mouseOver || tab.down ) )
            width += this.item.paddingIcon + this.item.widthIcon;
        width += this.item.paddingLeft + this.item.paddingRight;
        rect.x = x;
        rect.width = width;
        tab.width = width;

        // Inside of the visible area?
        if ( x + width > 0 && x < this.width )
        {
            tab.inside = true;

            // Draw the tab background
            var color = this.item.colorTab;
            if ( tab.mouseOver )
                color = this.item.colorTabMouseOver;
            if ( tab.down )
                color = this.item.colorTabDown;
            rect.width -= 1;                        // Separation between tabs
            rect.fillRectangle( properties, color );
            tab.rect = new Friend.Tree.Utilities.Rect( rect );
            rect.width += 1;

            // Draw an icon?
            rect.x += this.item.paddingLeft;
            if ( tab.icon )
            {
                var rectIcon = new Friend.Tree.Utilities.Rect( rect );
                rectIcon.y = this.height / 2 - this.item.heightIcon / 2;
                rectIcon.height = this.item.heightIcon;
                rectIcon.width = this.item.widthIcon;
                var image = this.resources.getImage( tab.icon );
                if ( image )
                    rectIcon.drawImage( properties, image );
                rect.x += this.item.paddingIcon + this.item.widthIcon;
            }

            // Draw the text
            var color = this.item.colorText;
            if ( tab.mouseOver )
                color = this.item.colorTextMouseOver;
            if ( tab.down )
                color = this.item.colorTextDown;
            rect.drawText( properties, tab.text, this.item.font, color, 'left', 'middle' ); 
            rect.x += textWidth;

            // Draw the button on the right?
            if ( this.item.button && ( tab.mouseOver || tab.down ) )
            {
                tab.rectClose = new Friend.Tree.Utilities.Rect( rect );
                tab.rectClose.x += this.item.paddingIcon;
                tab.rectClose.y = this.height / 2 - this.item.heightIcon / 2;
                tab.rectClose.height = this.item.heightIcon;
                tab.rectClose.width = this.item.widthIcon;
                var image = this.resources.getImage( this.item.button );
                if ( image )
                    tab.rectClose.drawImage( properties, image );
            }
        }
        else
        {
            tab.inside = false;
        }

        // Next one!
        x += width;
    }
	return properties;
};
Friend.Tree.UI.RenderItems.Tabs_HTML.message = function ( message )
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

// Gestures process
// Compatible with anything with a 'tabs' structure
////////////////////////////////////////////////////////////////////////

Friend.Tree.UI.GestureTabs = function( tree, item, properties )
{
    this.caller = false;
    this.onClick = false;
    this.onDoubleClick = false;
	this.onClose = false;
	
	Friend.Tree.Processes.init( tree, this, item, 'Friend.Tree.UI.GestureTabs', properties );
	this.item.registerEvents( 'mouse' );
}
Friend.Tree.UI.GestureTabs.processUp = function ( message )
{
	if ( message.type == 'mouse' )
	{
		var ret = false;
		switch( message.command )
		{
            case 'mousewheel':
                var delta = 16;
                if ( this.item.wheelDelta )
                    delta = this.item.wheelDelta;
                message.position += message.delta * delta;

                // Too much on the left
                if ( message.position < 0 )
                    message.position = 0;

                // Calculates the maximum in width
                var x = 0;
                for ( var t = 0; t < message.tabs.length; t++ )
                    x += message.tabs[ t ].width;
                if ( x - message.position < this.item.width )
                    message.position = x - this.item.width;    
                message.refresh = true;
                break;
            case 'mousemove':
                this.currentTab = false;
                for ( var t = 0; t < message.tabs.length; t++ )
                {
                    var flag = false;
                    var tab = message.tabs[ t ];
                    if ( tab.inside )
                    {
                        if ( tab.rect.isPointIn( this.item.mouse.x, this.item.mouse.y ) )
                        {
                            if ( this.currentTab != tab )
                            {
                                this.currentTab = tab;
                                tab.mouseOver = true;
                                message.refresh = true;
                                flag = true;
                            }
                        }

                    }
                    if ( !flag )
                    {
                        if ( tab.mouseOver )
                        {
                            tab.mouseOver = false;
                            message.refresh = true;
                        }
                    }
                }
                break;
			case 'mouseleave':
                for ( var t = 0; t < message.tabs.length; t++ )
                    message.tabs[ t ].mouseOver = false;
                this.currentTab = false;
                message.refresh = true;
                break;
            case 'click':
                if ( this.currentTab )
                {
                    this.item.activateTab( this.currentTab );

                    // Click on the button?
                    if ( this.caller )
                    {
                        if ( this.currentTab.rectClose )
                        {
                            if ( this.currentTab.rectClose.isPointIn( this.item.mouse.x, this.item.mouse.y ) )
                            {
                                if ( this.onClose )
                                {
                                    this.onClose.apply( this.caller, [ this.currentTab ] );
                                    return true;
                                }
                            }
                        }
                        if ( this.onClick )
                            this.onClick.apply( this.caller, [ this.currentTab ] );
                    }
                }
				break;
            case 'dblclick':
                if ( this.currentTab )
                {
                    this.item.activateTab( this.currentTab );
                    if ( this.caller && this.onDoubleClick )
                        this.onDoubleClick.apply( this.caller, [ this.currentTab ] );
                }
                break;
		}
	}
	return true;
};
Friend.Tree.UI.GestureTabs.processDown = function ( message )
{
	return true;
};
