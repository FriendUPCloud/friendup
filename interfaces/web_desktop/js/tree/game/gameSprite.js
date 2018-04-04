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
 * Tree engine game items
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.Game = Friend.Tree.Game || {};
Friend.Tree.Game.RenderItems = Friend.Tree.Game.RenderItems || {};

Friend.Tree.Game.Sprite = function( tree, name, flags )
{
    this.end = false;
    this.imageName = false;
	this.renderItemName = 'Friend.Tree.Game.RenderItems.Sprite';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Game.Sprite', flags );
};
Friend.Tree.Game.Sprite.messageUp = function( message )
{
    return this.startProcess( message, [ 'x', 'y', 'z', 'rotation', 'imageName' ] );
};
Friend.Tree.Game.Sprite.messageDown = function( message )
{
    if ( message.command == 'setSize' )
    {
        this.width = message.width;
        this.height = message.height;
    }   
    return this.endProcess( message, [ 'x', 'y', 'z', 'rotation', 'imageName' ] );
};

Friend.Tree.Game.RenderItems.Sprite_Three2D = function( tree, name, properties )
{
	this.rendererType = 'Sprite';
	this.rendererName = 'Renderer_Three2D';	
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.Game.RenderItems.Sprite_Three2D', properties );
    this.imageName = '';
    this.setImage();
};
Friend.Tree.Game.RenderItems.Sprite_Three2D.render = function( properties )
{
    this.setImage();
	return properties;
};
Friend.Tree.Game.RenderItems.Sprite_Three2D.setImage = function()
{
    if ( this.parent.imageName != this.imageName )
    {
        var image = this.resources.getImage( this.parent.imageName );
        if ( image )
        {
            this.imageName = this.parent.imageName;

            this.width = image.width;
            this.height = image.height;
            this.hotSpotX = image.hotSpotX;
            this.hotSpotY = image.hotSpotY;

            // Set item width and height
            this.tree.sendMessageToItem( this.parent.root, this.parent, 
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
            Friend.Tree.log( this.parent,
            {
                level: Friend.Tree.ERRORLEVEL_HIGH,
                error: 'Image does not exist: ' + this.imageName
            } );    
        }
    }
	return false;
};


Friend.Tree.Game.RenderItems.Sprite_HTML = function( tree, name, properties )
{
	this.rendererType = 'Sprite';
	this.rendererName = 'Renderer_HTML';	
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.Game.RenderItems.Sprite_HTML', properties );
    this.imageName = '';
    this.setImage();
};
Friend.Tree.Game.RenderItems.Sprite_HTML.setImage = Friend.Tree.Game.RenderItems.Sprite_Three2D.setImage;
Friend.Tree.Game.RenderItems.Sprite_HTML.render = Friend.Tree.Game.RenderItems.Sprite_Three2D.render;


Friend.Tree.Game.RenderItems.Sprite_Canvas2D = function( tree, name, properties )
{
	this.rendererType = 'Sprite';
	this.rendererName = 'Renderer_Canvas2D';	
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.Game.RenderItems.Sprite_Canvas2D', properties );
    this.setImage = Friend.Tree.Game.RenderItems.Sprite_Three2D.setImage;
    this.render = Friend.Tree.Game.RenderItems.Sprite_Three2D.render;
    this.imageName = '';
    this.toto = 'prout';
    this.setImage();
};
Friend.Tree.Game.RenderItems.Sprite_Canvas2D.setImage = Friend.Tree.Game.RenderItems.Sprite_Three2D.setImage;
Friend.Tree.Game.RenderItems.Sprite_Canvas2D.render = Friend.Tree.Game.RenderItems.Sprite_Three2D.render;
