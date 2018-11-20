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
 * Tree engine game items
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.Game = Friend.Tree.Game || {};
Friend.Tree.Game.RenderItems = Friend.Tree.Game.RenderItems || {};


Friend.Tree.Game.Sprite3D = function( tree, name, flags )
{
    this.end = false;
    this.imageName = false;
	this.renderItemName = 'Friend.Tree.Game.RenderItems.Sprite3D';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Game.Sprite3D', flags );
};
Friend.Tree.Game.Sprite3D.messageUp = function( message )
{
    return this.startProcess( message, [ 'x', 'y', 'z', 'rotation', 'imageName' ] );
};
Friend.Tree.Game.Sprite3D.messageDown = function( message )
{
    if ( message.command == 'setSize' )
    {
        this.width = message.width;
        this.height = message.height;
    }   
    return this.endProcess( message, [ 'x', 'y', 'z', 'rotation', 'imageName' ] );
};

Friend.Tree.Game.RenderItems.Sprite3D_Three2D = function( tree, name, properties )
{
    this.end = false;
	this.rendererType = 'Sprite3D';
    this.rendererName = 'Renderer_Three2D';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.Game.RenderItems.Sprite3D_Three2D', properties );
    this.perspective = properties.perspective;     // Can be underfined
    this.xCenter = properties.xCenter;
    this.yCenter = properties.yCenter;
    this.imageName = false;
    this.setImage();
};
Friend.Tree.Game.RenderItems.Sprite3D_Three2D.render = function( properties )
{
    if ( typeof this.xCenter != 'undefined' )
        properties.xCenter = this.xCenter;
    if ( typeof this.yCenter != 'undefined' )
        properties.yCenter = this.yCenter;
    if ( typeof this.perspective != 'undefined' )
        properties.perspective = this.perspective;
    this.setImage();
    return properties;
};
Friend.Tree.Game.RenderItems.Sprite3D_Three2D.setImage = function()
{
    if ( this.item.imageName != this.imageName )
    {
        var image = this.resources.getImage( this.item.imageName );
        if ( image )
        {
            this.imageName = this.item.imageName;
            this.hotSpotX = image.hotSpotX;
            this.hotSpotY = image.hotSpotY;
            this.width = image.width;
            this.height = image.height;

            // Set item width and height
            this.tree.sendMessageToItem( this.item.root, this.item, 
            {
                command: 'setSize',
                type: 'renderItemToItem',
                width: this.width,
                height: this.height
            });            
            return true;
        }
        else
        {
            Friend.Tree.log( this.item,
            {
                level: Friend.Tree.ERRORLEVEL_HIGH,
                error: 'Image does not exist: ' + this.imageName
            } );    
        }
    }
	return false;
};

Friend.Tree.Game.RenderItems.Sprite3D_HTML = function( tree, name, properties )
{
    this.end = false;
	this.rendererType = 'Sprite3D';
    this.rendererName = 'Renderer_HTML';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.Game.RenderItems.Sprite3D_HTML', properties );
    this.perspective = properties.perspective;
    this.xCenter = properties.xCenter;
    this.yCenter = properties.yCenter;
    this.imageName = false;
    this.setImage();
};
Friend.Tree.Game.RenderItems.Sprite3D_HTML.setImage = Friend.Tree.Game.RenderItems.Sprite3D_Three2D.setImage;
Friend.Tree.Game.RenderItems.Sprite3D_HTML.render = Friend.Tree.Game.RenderItems.Sprite3D_Three2D.render;

Friend.Tree.Game.RenderItems.Sprite3D_Canvas2D = function( tree, name, properties )
{
    this.end = false;
	this.rendererType = 'Sprite3D';
    this.rendererName = 'Renderer_Canvas2D';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.Game.RenderItems.Sprite3D_Canvas2D', properties );
    this.perspective = properties.perspective;
    this.xCenter = properties.xCenter;
    this.yCenter = properties.yCenter;
    this.imageName = false;
    this.setImage();
};
Friend.Tree.Game.RenderItems.Sprite3D_Canvas2D.setImage = Friend.Tree.Game.RenderItems.Sprite3D_Three2D.setImage;
Friend.Tree.Game.RenderItems.Sprite3D_Canvas2D.render = Friend.Tree.Game.RenderItems.Sprite3D_Three2D.render;
