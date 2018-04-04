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
 * Tree game objects
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.Game = Friend.Tree.Game || {};
Friend.Tree.Game.RenderItems = Friend.Tree.Game.RenderItems || {};

Friend.Tree.Game.Bitmap = function( tree, name, properties )
{
    this.imageName = '';
	this.imageFit = 'stretch';
	this.renderItemName = 'Friend.Tree.Game.RenderItems.Bitmap';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Game.Bitmap', properties );
};
Friend.Tree.Game.Bitmap.messageUp = function( message )
{
    return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'rotation', 'imageName' ] );
};
Friend.Tree.Game.Bitmap.messageDown = function( message )
{
    this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'rotation', 'imageName' ] );    
    if ( message.imageName == Friend.Tree.UPDATED )
        this.callAllRenderItems( 'setImage', [] );
};

Friend.Tree.Game.RenderItems.Bitmap_Three2D = function( tree, item, properties )
{
	this.imageFit = 'adapt';
	this.rendererName = 'Renderer_Three2D';	
	this.rendererType = 'Sprite';
    Friend.Tree.RenderItems.init( this, tree, item, 'Friend.Tree.Game.RenderItems.Bitmap_Three2D', properties );
	this.imageName = '';
	this.setImage();
};
Friend.Tree.Game.RenderItems.Bitmap_Three2D.render = function( properties )
{	
	this.setImage();
}
Friend.Tree.Game.RenderItems.Bitmap_Three2D.setImage = function()
{	
	if ( this.imageName != this.parent.imageName )
	{
		var image = this.resources.getImage( this.parent.imageName );
		if ( image )
		{
			this.imageName = this.parent.imageName;
			if ( this.imageFit == 'adapt' )
			{
				// Size = image size
				this.width = image.width;
				this.height = image.height;

				// Pokes in parent
				this.parent.width = this.width;
				this.parent.height = this.height;
			}
			this.hotSpotX = image.hotSpotX;
			this.hotSpotY = image.hotSpotY;
			return true; 
		}
		else
		{
		    Friend.Tree.log( this, { level: Friend.Tree.ERRORLEVEL_HIGH, error: 'non existant image: ' + this.image + '.' })
		}
	}
    return false;
};


Friend.Tree.Game.RenderItems.Bitmap_HTML = function( tree, item, properties )
{
	this.imageFit = 'adapt';
	this.rendererName = 'Renderer_HTML';	
	this.rendererType = 'Sprite';
    Friend.Tree.RenderItems.init( this, tree, item, 'Friend.Tree.Game.RenderItems.Bitmap_HTML', properties );
    this.imageName = '';
	this.setImage();
};
Friend.Tree.Game.RenderItems.Bitmap_HTML.setImage = Friend.Tree.Game.RenderItems.Bitmap_Three2D.setImage;
Friend.Tree.Game.RenderItems.Bitmap_HTML.render = Friend.Tree.Game.RenderItems.Bitmap_Three2D.render;

Friend.Tree.Game.RenderItems.Bitmap_Canvas2D = function( tree, item, properties )
{
	this.imageFit = 'adapt';
	this.rendererName = 'Renderer_Canvas2D';	
	this.rendererType = 'Sprite';
    Friend.Tree.RenderItems.init( this, tree, item, 'Friend.Tree.Game.RenderItems.Bitmap_Canvas2D', properties );
    this.imageName = '';
	this.setImage();
};
Friend.Tree.Game.RenderItems.Bitmap_Canvas2D.setImage = Friend.Tree.Game.RenderItems.Bitmap_Three2D.setImage;
Friend.Tree.Game.RenderItems.Bitmap_Canvas2D.render = Friend.Tree.Game.RenderItems.Bitmap_Three2D.render;

