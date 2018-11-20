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

Friend.Tree.UI.ResizeBar = function( tree, name, flags )
{
    this.color = '#404040';;
    this.colorMouseOver = '#808080';
    this.colorDown = '#FFFFFF';
    this.colorBorder = '#000000';
    this.sizeBorder = 0;
    this.sizeExtra = 0;
    this.direction = 'horizontal';
	this.mask = [ '' ];
	
	this.renderItemName = 'Friend.Tree.UI.RenderItems.ResizeBar';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.ResizeBar', flags );
	
	this.registerEvents( [ 'refresh', 'mouse' ] );
    if ( this.parent.className != 'Friend.Tree.UI.Group' )
        this.tree.log( this, { error: 'Parent class must be a Group.', level: Friend.Tree.ERRORLEVEL_MEDIUM } );

    this.mouseOver = false;
    this.down = false;
};
Friend.Tree.UI.ResizeBar.messageUp = function( message )
{
    if ( message.command == 'refresh' )
    {
        if ( this.direction == 'horizontal' )
        {
            var rect = new Friend.Tree.Utilities.Rect( this.renderItem.rect );
            rect.x -= this.sizeExtra;
            rect.width += this.sizeExtra;
            var isIn = rect.isPointIn( this.root.mouseX, this.root.mouseY );

            if ( isIn )
            {
                if ( !this.mouseOver )
                {
                    this.mouseOver = true;    
                    this.doRefresh();    
                    document.body.style.cursor = 'col-resize';
                    this.tree.setModal( this, true );
                }
            }
            else
            {
                if ( !this.down && this.mouseOver )
                {
                    this.mouseOver = false;
                    this.doRefresh();    
                    document.body.style.cursor = 'auto';
                    this.tree.setModal( this, false );
                }
            }
            var mouseKey = this.root.mouseButtons != 0;
            if ( mouseKey && this.mouseOver && !this.down  )
            {
                this.down = true;
                this.position = 0;
                this.mousePrevious = this.root.mouseX;

                // Find its number in parents child list
                for ( var i = 0; i < this.parent.items.length; i++  )
                {
                    if ( this.parent.items[ i ] == this )
                        break;
                }
                this.thisChildNumber = i;
                this.percentStart = peekNumber( this, -1 );
                this.percentPrevious = this.percentStart;
            }
            if ( this.down )
            {
                this.down = mouseKey;
                document.body.style.cursor = 'col-resize';
                var delta = this.root.mouseX - this.mousePrevious;
                if ( delta )
                {
                    this.mousePrevious = this.root.mouseX;
                    this.position -= delta;
                    var percent = 100 * ( this.position / this.parent.width );
                    var percentNew = Math.floor( this.percentStart + percent );
                    if ( percentNew != this.percentPrevious )
                    {
                        this.percentPrevious = percentNew;
                        pokeNumber( this, percentNew );

                        // Forces a recalculation of the sizes
                        this.tree.sendMessageToTree( this.root, { command: 'organize', type: 'system' } );
                        this.doRefresh( -1 );   // Refreshes the whole tree
                    }
                }
            }
            function peekNumber( self, direction )
            {
                var position = self.thisChildNumber;
                while( position >= 0 && position < self.mask.length )
                {
                    var pos = self.mask[ position ].indexOf( '***' );
                    if ( pos >= 0 )
                    {
                        return parseInt( self.parent.sizes[ position ].substr( pos, 3 ) );
                    }
                    position += direction;
                }
                return undefined;
            }
            function pokeNumber( self, number )
            {
                for ( var s = 0; s < self.mask.length; s++ )
                {
                    var pos = self.mask[ s ].indexOf( '***' );
                    if ( pos >= 0 )
                    {
                        var numString = '' + number; 
                        while ( numString.length < 3 )
                            numString = '0' + numString;
                        self.parent.sizes[ s ] = self.parent.sizes[ s ].substring( 0, pos ) + numString + self.parent.sizes[ s ].substring( pos + 3 );
                    }
                }
            }    
        }
    }
    return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'color' ] );
};
Friend.Tree.UI.ResizeBar.messageDown = function( message )
{
    return this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'color' ] );
};


Friend.Tree.UI.RenderItems.ResizeBar_HTML = function( tree, name, properties )
{
	this.color = false;
	this.colorMouseOver = false;
	this.colorDown = false;
	this.colorBorder = false;
	this.sizeBorder = false;

    this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_HTML';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.ResizeBar_HTML', properties );
};

Friend.Tree.UI.RenderItems.ResizeBar_HTML.render = function( properties )
{
    if ( this.width > 0 && this.height > 0 )
    {
        var color = this.item.color;
        if ( this.item.mouseOver )
            color = this.item.colorMouseOver;
        if ( this.item.down )
            color = this.item.colorDown;
        this.thisRect.drawBox( properties, color, this.item.colorBorder, this.item.sizeBorder );
	}
	
    if ( this.item.renderSubItems )
		properties.renderInParent = properties.rendererItem;
		
	return properties;
};

