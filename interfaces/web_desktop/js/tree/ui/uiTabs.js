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
    this.tabs = [];
    this.position = 0;
    this.wheelDelta = -32; 
	this.renderItemName = 'Friend.Tree.UI.RenderItems.Tabs';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.Tabs', flags );
};
Friend.Tree.UI.Tabs.messageUp = function( message )
{
    return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'tabs', 'position' ] );
};
Friend.Tree.UI.Tabs.messageDown = function( message )
{
    return this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'tabs', 'position' ] );
};


Friend.Tree.UI.RenderItems.Tabs_Three2D = function( tree, name, properties )
{
    this.backColor = '#404040';
    this.textColor = '#E0E0E0';
    this.textColorMouseOver = '#FF0000';
    this.textDownColor = '#FFFF00';
    this.tabColor = '#808080';
    this.tabDownColor = '#C0C0C0';
    this.tabMouseOverColor = '#FFFF00';
    this.paddingLeft = 10;
    this.paddingRight = 10;
    this.iconWidth = 16;
    this.iconHeight = 16;
    this.iconPadding = 4;
    this.button = false;
    this.font = '12px Arial';
    this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Three2D';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Tabs_Three2D', properties );

    // Activates the first tab
    this.parent.tabs[ 0 ].down = true;

    // Set the parent for handling mouse messages
	this.parent.registerEvents( 'mouse' );
	this.parent.addProcess( new Friend.Tree.UI.GestureTabs( this.tree, this.parent, properties ) );
};
Friend.Tree.UI.RenderItems.Tabs_Three2D.render = function( properties )
{
    // Erases the whole area
    this.thisRect.fillRectangle( properties, this.backColor );

    var x = -this.parent.position;
    var rect = new Friend.Tree.Utilities.Rect( this.thisRect );
    for ( var t = 0; t < this.parent.tabs.length; t++ )
    {
        // Calculate width of tab
        var tab = this.parent.tabs[ t ];
        var textWidth = this.utilities.measureText( tab.text, this.font ).width;
        var width = textWidth + this.paddingLeft + this.paddingRight;
        if ( tab.icon )
            width += this.iconPadding * 2 + this.iconWidth;
        if ( this.button )
            width += this.iconPadding + this.iconWidth;
        rect.x = x;
        rect.width = width;
        tab.width = width;

        // Inside of the visible area?
        if ( x + width > 0 && x < this.width )
        {
            tab.inside = true;

            // Draw the tab background
            var color = this.tabColor;
            if ( tab.mouseOver )
                color = this.tabMouseOverColor;
            if ( tab.down )
                color = this.tabDownColor;
            rect.width -= 1;                        // Separation between tabs
            rect.fillRectangle( properties, color );
            tab.rect = new Friend.Tree.Utilities.Rect( rect );
            rect.width += 1;

            // Draw an icon?
            rect.x += this.paddingLeft;
            if ( tab.icon )
            {
                var rectIcon = new Friend.Tree.Utilities.Rect( rect );
                rectIcon.y = this.height / 2 - this.iconHeight / 2;
                rectIcon.height = this.iconHeight;
                rectIcon.width = this.iconWidth;
                var image = this.resources.getImage( tab.icon );
                if ( image )
                    rectIcon.drawImage( properties, image );
                rect.x += this.iconPadding + this.iconWidth;
                rect.width -= this.iconPadding + this.iconWidth;
            }

            // Draw the text
            var color = this.textColor;
            if ( tab.mouseOver )
                color = this.textMouseOverColor;
            if ( tab.down )
                color = this.textDownColor;
            rect.drawText( properties, tab.text, this.font, color, 'left', 'middle' ); 
            rect.x += textWidth;
            rect.width -= textWidth;

            // Draw the button on the right?
            if ( this.button && ( tab.mouseOver || tab.down ) )
            {
                var rectIcon = new Friend.Tree.Utilities.Rect( rect );
                rectIcon.x += this.iconPadding;
                rectIcon.y = this.height / 2 - this.iconHeight / 2;
                rectIcon.height = this.iconHeight;
                rectIcon.width = this.iconWidth;
                var image = this.resources.getImage( this.button );
                if ( image )
                    rectIcon.drawImage( properties, image );
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

Friend.Tree.UI.RenderItems.Tabs_HTML = function( tree, name, properties )
{
    this.backColor = '#404040';
    this.textColor = '#E0E0E0';
    this.textColorMouseOver = '#FF0000';
    this.textDownColor = '#FFFF00';
    this.tabColor = '#808080';
    this.tabDownColor = '#C0C0C0';
    this.tabMouseOverColor = '#FFFF00';
    this.paddingLeft = 10;
    this.paddingRight = 10;
    this.iconWidth = 16;
    this.iconHeight = 16;
    this.iconPadding = 4;
    this.font = '12px Arial';
    
    this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_HTML';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Tabs_HTML', properties );
    
    // Set the parent for handling mouse messages
	this.parent.registerEvents( 'mouse' );
	this.parent.addProcess( new Friend.Tree.UI.GestureTabs( this.tree, this.parent, properties ) );
};
Friend.Tree.UI.RenderItems.Tabs_HTML.render = Friend.Tree.UI.RenderItems.Tabs_Three2D.render;


Friend.Tree.UI.RenderItems.Tabs_Canvas2D = function( tree, name, properties )
{
    this.backColor = '#404040';
    this.textColor = '#E0E0E0';
    this.textColorMouseOver = '#FF0000';
    this.textDownColor = '#FFFF00';
    this.tabColor = '#808080';
    this.tabDownColor = '#C0C0C0';
    this.tabMouseOverColor = '#FFFF00';
    this.paddingLeft = 10;
    this.paddingRight = 10;
    this.iconWidth = 16;
    this.iconHeight = 16;
    this.iconPadding = 4;
    this.font = '12px Arial';

    this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Canvas2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Tabs_Canvas2D', properties );

    // Set the parent for handling mouse messages
	this.parent.registerEvents( 'mouse' );
	this.parent.addProcess( new Friend.Tree.UI.GestureTabs( this.tree, this.parent, properties ) );
};
Friend.Tree.UI.RenderItems.Tabs_Canvas2D.render = Friend.Tree.UI.RenderItems.Tabs_Three2D.render;

// Gestures process
// Compatible with anything with a 'tabs' structure
////////////////////////////////////////////////////////////////////////

Friend.Tree.UI.GestureTabs = function( tree, item, flags )
{
	Friend.Tree.Processes.init( tree, this, item, 'Friend.Tree.UI.GestureTabs', flags );
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
                ret = true;
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
                                ret = true;
                                flag = true;
                            }
                        }

                    }
                    if ( !flag )
                        tab.mouseOver = false;
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
                    for ( var t = 0; t < message.tabs.length; t++ )
                        message.tabs[ t ].down = false;
                    this.currentTab.down = true;
                    message.refresh = true;
                }
				break;
			case 'dblclick':
				if ( message.onDoubleClick && message.caller )
					message.onDoubleClick.apply( message.caller, [ this.item, this.item.getValue(), { x: message.mouse.x, y: message.mouse.y } ] );
				break;
		}
		if ( ret )
		{
            message.refresh = true;
		}
	}
	return true;
};
Friend.Tree.UI.GestureTabs.processDown = function ( message )
{
	return true;
};
