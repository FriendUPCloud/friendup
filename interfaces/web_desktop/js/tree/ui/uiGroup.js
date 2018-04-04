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

Friend.Tree.UI.Group = function ( tree, name, flags )
{
    this.rows = 0;
    this.columns = 0;
    this.sizes = false;
    this.renderItemName = 'Friend.Tree.RenderItems.Empty';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.Group', flags );
};
Friend.Tree.UI.Group.messageUp = function ( message )
{
    if ( message.command == 'organize' )
    {
        var x = 0;
        var y = 0;
        if ( this.columns )
        {
            if ( this.sizes )
            {
                // Size string interpretation
                for ( var c = 0; c < this.columns; c++ )
                {
                    if ( this.sizes[ c ] )
                    {
                        var width = this.utilities.getSizeFromString( this.sizes[ c ], this.width );
                        if ( this.items[ c ] )
                        {
                            var item = this.items[ c ];
                            item.x = x;
                            item.width = width;
                        } 
                        x += width;
                    }
                }
            }
            else
            {
                // No size string -> everyone equal
                for ( var i = 0; i < this.items.length; i++ )
                {
                    this.items[ i ].x = x;
                    this.items[ i ].width = Math.floor( this.width / this.items.length );
                    x += this.width / this.items.length;
                }
            }
        }
        else
        {
            // Full width
            for ( var i = 0; i < this.items.length; i++ )
            {
                this.items[ i ].x = 0;
                this.items[ i ].width = this.width;
            }
        }

        // Vertical
        if ( this.rows )
        {
            if (this.sizes )
            {
                // Size string interpretation
                for ( var c = 0; c < this.rows; c++ )
                {
                    if ( this.sizes[ c ] )
                    {
                        var height = this.utilities.getSizeFromString( this.sizes[ c ], this.height );
                        if ( this.items[ c ] )
                        {
                            var item = this.items[ c ];
                            item.y = y;
                            item.height = height;
                        } 
                        y += height;
                    }
                }
            }
            else
            {
                // No size string -> everyone equal
                for ( var i = 0; i < this.items.length; i++ )
                {
                    this.items[ i ].y = y;
                    this.items[ i ].height = Math.floor( this.height / this.items.height );
                    y += this.height / this.item.length;            
                }
            }
        }
        else
        {
            // Full height
            for ( var i = 0; i < this.items.length; i++ )
            {
                this.items[ i ].y = 0;
                this.items[ i ].height = this.height;
            }
        }
    }
	return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height' ] );
};
Friend.Tree.UI.Group.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height' ] );
};
