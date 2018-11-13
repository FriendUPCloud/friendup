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

Friend.Tree.UI.HorizontalGroup = function ( tree, name, flags )
{
    this.sizes = false;
    this.children = false;
    this.renderItemName = 'Friend.Tree.RenderItems.Empty';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.HorizontalGroup', flags );
    if ( this.sizes.length != this.children.length )
    {
        console.log( 'HorizontalGroup: Number of children does not match number of sizes!' );
    }
};
Friend.Tree.UI.HorizontalGroup.messageUp = function ( message )
{
   	return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height' ] );
};
Friend.Tree.UI.HorizontalGroup.messageDown = function ( message )
{
	this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height' ] );
    if ( message.command == 'resize' )
    {
        if ( message.height == Friend.Tree.UPDATED || this.root.firstResize )
        {
            this.doRefresh();
        }

        if ( message.width == Friend.Tree.UPDATED || this.root.firstResize )
        {
            var x = 0;

            // Size string interpretation
            for ( var c = 0; c < this.children.length; c++ )
            {
                var width = this.utilities.getSizeFromString( this, this.sizes[ c ], this.width );
                if ( this.children[ c ] != '' )
                {
                    var item = this.findFromName( this.children[ c ] );
                    if ( item )
                    {
                        this.tree.resizeItem( item, width, this.height, true );
                        this.tree.positionItem( item, x, item.y );
                    }
                }
                x += width;
            }
            this.doRefresh();
        }

        // Prevent automatic resize process to touch the subItem: they are already done!
        message.recursion = false;
    }
    return true;
};

Friend.Tree.UI.VerticalGroup = function ( tree, name, flags )
{
    this.sizes = false;
    this.children = false;
    this.renderItemName = 'Friend.Tree.RenderItems.Empty';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.VerticalGroup', flags );
    if ( this.sizes.length != this.children.length )
    {
        console.log( 'VerticalGroup: Number of children does not match number of sizes!' );
    }
};
Friend.Tree.UI.VerticalGroup.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height' ] );
};
Friend.Tree.UI.VerticalGroup.messageDown = function ( message )
{
    // Resize messages are grabbed after treatment by processes
    this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height' ] );
    if ( message.command == 'resize' )
    {
        var y = 0;

        if ( message.width == Friend.Tree.UPDATED || this.root.firstResize )        
        {
            this.doRefresh();
        }

        if ( message.height == Friend.Tree.UPDATED || this.root.firstResize )        
        {
            // Size string interpretation
            for ( var c = 0; c < this.children.length; c++ )
            {
                var height = this.utilities.getSizeFromString( this, this.sizes[ c ], this.height );
                if ( this.children[ c ] != '' )
                {
                    var item = this.findFromName( this.children[ c ] );
                    if ( item )
                    {
                        this.tree.resizeItem( item, this.width, height, true );
                        this.tree.positionItem( item, item.x, y );
                    }
                }
                y += height;
            }
            this.doRefresh();
        }

        // Prevent automatic resize process to touch the subItem: they are already done!
        message.recursion = false;
    }
    return true;
};
