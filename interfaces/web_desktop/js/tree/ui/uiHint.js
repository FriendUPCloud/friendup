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
// Hint!
///////////////////////////////////////////////////////////////////////////////
Friend.Tree.UI.Hint = function ( tree, name, properties )
{
    this.text = 'Hint';
    this.color = '#000000';
    this.colorBack = '#A0A000';
    this.font = '10px sans serif';
    this.colorBorder = '#000000';
    this.sizeBorder = 1;
    this.paddingH = 4;
    this.paddingV = 4;
    this.positionH = 'auto';
    this.positionV = 'auto';
	this.renderItemName = 'Friend.Tree.UI.RenderItems.Hint';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.Hint', properties );    
};
Friend.Tree.UI.Hint.messageUp = function ( message )
{
	return this.startProcess( message, [] );
};
Friend.Tree.UI.Hint.messageDown = function ( message )
{
	return this.endProcess( message, [] );
};


Friend.Tree.UI.RenderItems.Hint_HTML = function ( tree, name, properties )
{
    this.text = false;
    this.color = false;
    this.colorBack = false;
    this.font = false;
    this.colorBorder = false;
    this.sizeBorder = false;
    this.paddingH = false;
    this.paddingV = false;
    this.positionH = false;
    this.positionV = false;

	this.rendererName = 'Renderer_HTML';
    this.rendererType = 'Canvas';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Hint_HTML', properties );

    // Calculates size
    var o = this.renderer.measureText( this.item.text, this.item.font );
    this.width = o.width + this.item.paddingH * 2 + this.item.sizeBorder * 2;
    this.height = o.height + this.item.paddingV * 2 + this.item.sizeBorder * 2;
    this.item.width = this.width;
    this.item.height = this.height;

    // Position itself
    var item = properties.parent;               // This is the previous renderItem drawn -> the one we are displaying the popup from!
    var positionH = this.item.positionH;
    var positionV = this.item.positionV;
    if ( positionH == 'auto' )
    {
        // Left or right?
        if ( item.x + item.width / 2 < item.root.width / 2 )
            positionH = 'right';
        else
            positionH = 'left';
    }
    if ( positionV == 'auto' )
    {
        // Above or below?
        if ( item.y + item.height / 2 < item.root.height / 2 )
            positionV = 'below';
        else
            positionV = 'above';
    }
    var x, y;
    switch ( positionH )
    {
        case 'center':
            x = item.width / 2 - this.width;
            break;
        case 'left':
            x = -this.width - 8;
            break;
        default:
        case 'right':
            x = item.width + 8;
            break;
    }
    switch ( positionV )
    {
        case 'above':
            y = -this.height + ( positionH == 'center' ? -8 : item.height * 0.25 ); 
            break;
        default:
        case 'below':
            y = ( positionH == 'center' ? item.height + 8 : item.height * 0.75 ); 
            break;
    }
    this.x = x;
    this.y = y;
    this.item.x = x;
    this.item.y = y;
};
Friend.Tree.UI.RenderItems.Hint_HTML.render = function ( properties )
{
    // Draw background box
    this.thisRect.drawBox( properties, this.item.colorBack, this.item.colorBorder, this.item.sizeBorder );

    // Draw text
    this.thisRect.drawText( properties, this.item.text, this.item.font, this.item.color, 'center', 'middle' );

    return properties;
};

