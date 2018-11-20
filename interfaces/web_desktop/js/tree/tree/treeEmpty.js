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

// Fake item
Friend.Tree.Empty = function( tree, name, properties )
{    
    this.imageName = false;
    this.renderItemName = 'Friend.Tree.RenderItems.Empty';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Empty', properties );
};
Friend.Tree.Empty.messageUp = function( message )
{
    return this.startProcess( message, [ ] );
};
Friend.Tree.Empty.messageDown = function( message )
{
    return this.endProcess( message, [] );
};

// Fake renderitem
Friend.Tree.RenderItems.Empty = function( tree, item, properties )
{
	this.rendererName = '*';	
    Friend.Tree.RenderItems.init( this, tree, item, 'Friend.Tree.RenderItems.Empty', properties );
};
Friend.Tree.RenderItems.Empty.render = function()
{	
};
Friend.Tree.RenderItems.Empty.message = function ( message )
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

