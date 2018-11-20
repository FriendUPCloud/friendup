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
    this.nameImage = '';
	this.fitImage = 'stretch';
	this.renderItemName = 'Friend.Tree.Game.RenderItems.Bitmap';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Game.Bitmap', properties );
};
Friend.Tree.Game.Bitmap.messageUp = function( message )
{
    return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'rotation', 'nameImage' ] );
};
Friend.Tree.Game.Bitmap.messageDown = function( message )
{
    var ret = this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'rotation', 'nameImage' ] );    
	return ret;
};



Friend.Tree.Game.RenderItems.Bitmap_HTML = function( tree, item, properties )
{
	this.nameImage = false;

	this.rendererName = 'Renderer_HTML';	
	this.rendererType = 'Sprite';
	Friend.Tree.RenderItems.init( this, tree, item, 'Friend.Tree.Game.RenderItems.Bitmap_HTML', properties );
	this.nameImage = ''; 	// Enforce loading the image
	this.setImage();

	this.item.width = this.image.width;
	this.item.height = this.image.height;
};
Friend.Tree.Game.RenderItems.Bitmap_HTML.render = function( properties )
{	
	this.setImage();
};
Friend.Tree.Game.RenderItems.Bitmap_HTML.message = function( message )
{	
	switch ( message.command )
	{
		case 'resize':
			if ( typeof message.width != 'undefined')
				this.width = message.width;
			if ( typeof message.height != 'undefined' )
				this.height = message.height;
			this.renderer.resizeItem( this, message.width, message.height );
            this.item.doRefresh();
			break;
		default:
			break;
	}
};
Friend.Tree.Game.RenderItems.Bitmap_HTML.setImage = function()
{	
	if ( this.nameImage != this.item.nameImage )
	{
		this.image = this.resources.getImage( this.item.nameImage );
		if ( image )
		{
			this.nameImage = this.item.nameImage;
			this.hotSpotX = image.hotSpotX;
			this.hotSpotY = image.hotSpotY;
			this.width = image.width;
			this.height = image.height;		
			return true; 
		}
		else
		{
		    Friend.Tree.log( this, { level: Friend.Tree.ERRORLEVEL_HIGH, error: 'non existant image: ' + this.image + '.' })
		}
	}
    return false;
};

Friend.Tree.Game.RenderItems.Bitmap_Canvas2D = function( tree, item, properties )
{
	this.nameImage = false;

	this.rendererName = 'Renderer_Canvas2D';	
	this.rendererType = 'Sprite';
    Friend.Tree.RenderItems.init( this, tree, item, 'Friend.Tree.Game.RenderItems.Bitmap_Canvas2D', properties );
    this.nameImage = '';
	this.setImage();

	this.item.width = this.image.width;
	this.item.height = this.image.height;
};
Friend.Tree.Game.RenderItems.Bitmap_Canvas2D.setImage = Friend.Tree.Game.RenderItems.Bitmap_Three2D.setImage;
Friend.Tree.Game.RenderItems.Bitmap_Canvas2D.render = Friend.Tree.Game.RenderItems.Bitmap_Three2D.render;
Friend.Tree.Game.RenderItems.Bitmap_Canvas2D.message = Friend.Tree.Game.RenderItems.Bitmap_Three2D.message;

