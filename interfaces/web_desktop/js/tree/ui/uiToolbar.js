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

Friend.Tree.UI.Toolbar = function ( tree, name, properties )
{
    this.color = '#808080';
    this.colorBorder = '#FFFFFF';
    this.sizeBorder = 0;
    this.paddingH = 0;
    this.paddingV = 0;
    this.direction = 'horizontal';
    this.widthImage = 32;
    this.heightImage = 32;
    this.theme = false;
	this.list = [];
	
	this.renderItemName = 'Friend.Tree.UI.RenderItems.Toolbar';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.Toolbar', properties );
    
    // Creates the tools
    this.startInsertItems();
    var x = this.direction = 'horizontal' ? this.paddingH : 0;
    var y = this.direction = 'vertical' ? this.paddingV : 0;
    var count = 0;
    this.tools = [];
    for ( var t = 0; t < this.list.length; t++ )
    {
        var tool = this.list[ t ];
        var toolProperties = {};

        // Copy tool properties
        for ( var p in tool )
            toolProperties[ p ] = tool[ p ];

        // New properties
        toolProperties.root = this.root;
        toolProperties.parent = this;
        toolProperties.width = this.widthImage;
        toolProperties.height = this.heightImage;
        toolProperties.widthImage = this.widthImage;
        toolProperties.heightImage = this.heightImage;
        toolProperties.theme = this.theme;
        if ( this.direction = 'vertical' )
        {
            // New properties
            toolProperties.x = this.paddingH;
            toolProperties.y = y;
            var tool = new Friend.Tree.UI.Tool( this.tree, this.name + '-tool#' + count++, toolProperties );
            this.addItem( tool );

            // Next!
            y += tool.height;
        }
        else
        {
            toolProperties.x = x;
            toolProperties.y = this.paddingV;
            var tool = new Friend.Tree.UI.Tool( this.tree, this.name + '-tool#' + count++, toolProperties );
            this.addItem( tool );

            // Next!
            x += tool.width;
        }
    }
	this.endInsertItems();
};
Friend.Tree.UI.Toolbar.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height' ] );
};
Friend.Tree.UI.Toolbar.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height' ] );
};

Friend.Tree.UI.RenderItems.Toolbar_HTML = function ( tree, name, properties )
{
	this.color = false;
    this.colorBorder = false;
    this.sizeBorder = false;

	this.width = 320;
	this.height = 48;
    this.rendererName = 'Renderer_HTML';
    this.rendererType = 'Canvas';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Toolbar_HTML', properties );

	this.item.width = this.width;
	this.item.height = this.height;
};
Friend.Tree.UI.RenderItems.Toolbar_HTML.render = function ( properties )
{
    // Draw background box
 	this.thisRect.drawBox( properties, this.item.color, this.item.colorBorder, this.item.sizeBorder );

    // Continue drawing in this item
    properties.renderInParent = properties.rendererItem;

	return properties;
};
Friend.Tree.UI.RenderItems.Toolbar_HTML.message = function ( message )
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
