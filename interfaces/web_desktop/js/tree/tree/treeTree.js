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
 * Tree engine Tree management elements
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.RenderItems = Friend.Tree.RenderItems || {};

Friend.Tree.Tree = function( tree, name, properties )
{
	this.treeName = false;
	this.tree = false;
    this.clip = true;
    this.sizeBorder = 0;
    this.colorBorder = '#000000';
	this.larsen = 1;
	
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Tree', properties );
	this.registerEvents( 'refresh' );
    if ( this.treeName == false )
        this.treeName = this.root.name;
};
Friend.Tree.Tree.messageUp = function( message )
{
    return this.startProcess( message, [ 'x', 'y', 'z', 'rotation', 'zoomX', 'zoomY', 'alpha', 'treeName' ] );
};
Friend.Tree.Tree.messageDown = function( message )
{
    return this.endProcess( message, [ 'x', 'y', 'z', 'rotation', 'zoomX', 'zoomY', 'alpha', 'treeName' ] );
};

Friend.Tree.RenderItems.Tree_HTML = function( tree, name, properties )
{
    this.tree = false;
    this.clip = true;
    this.sizeBorder = 0;
    this.colorBorder = '#000000';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.RenderItems.Tree', properties );

    this.larsenCounter = 0;
};
Friend.Tree.RenderItems.Tree.render = function( properties )
{
    if ( properties.z == this.z && this.larsenCounter < this.item.larsen )
    {
        // Look for tree
        var root = this.tree.findTreeFromName( this.item.treeName );
        if ( root )
        {          
            this.larsenCounter++;

            // Draw border
            var delta = 0;
            if ( this.item.sizeBorder )
            {
                this.rect.drawRectangle( properties, this.item.colorBorder, this.item.sizeBorder );
                delta = this.item.sizeBorder;
            }

            // Clip rectangle
            var rect = new Friend.Tree.Utilities.Rect( delta, delta, this.width - delta * 2, this.height - delta * 2);
            properties.renderer.save( properties );
            rect.clip( properties );

            // Render the tree
            var treeProperties =
            {
                x: delta,
                y: delta,
                zoomX: ( this.width - delta * 2 ) / this.tree.width,
                zoomY: ( this.height - delta * 2 ) / this.tree.height
            };
            this.tree.renderTree( this.tree, treeProperties );

            // Restore clipping
            properties.renderer.restore();
            this.larsenCounter--;
        }
    }
	return true;
};
