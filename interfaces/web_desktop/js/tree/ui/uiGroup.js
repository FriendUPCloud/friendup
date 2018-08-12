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

Friend.Tree.UI.HorizontalGroup = function ( tree, name, flags )
{
    this.sizes = false;
    this.children = false;
    this.renderItemName = 'Friend.Tree.RenderItems.Empty';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.HorizontalGroup', flags );
    if ( this.sizes.length != this.children.length )
    {
        console.log( 'HorizontalGroup: Number of children does not match number of sizes!' );
        debugger;
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
        debugger;
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
