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

Friend.Tree.AsciiArt = function( tree, name, properties )
{    
    this.font = '12px sans serif';
    this.color = '#FFFF00';
    this.palette = ' .oO'; 
    this.horizontalResolution = 64;
    this.verticalResolution = 64 * 9 / 16; 

	this.nameImage = false;
	this.renderItemName = 'Friend.Tree.RenderItems.AsciiArt';
	
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.AsciiArt', properties );
    this.registerEvents( 'refresh' ); 
};
Friend.Tree.AsciiArt.messageUp = function( message )
{
    if ( message.command == 'refresh' )
        this.doRefresh();
    return this.startProcess( message, [ 'x', 'y', 'z', 'rotation' ] );
};
Friend.Tree.AsciiArt.messageDown = function( message )
{
    return this.endProcess( message, [ 'x', 'y', 'z', 'rotation' ] );
};


Friend.Tree.RenderItems.AsciiArt_HTML = function( tree, name, properties )
{    
    this.font = false;
    this.color = false;
    this.palette = false; 
    this.horizontalResolution = false;
	this.verticalResolution = false; 
	this.nameImage = false;
	
    this.rendererName = 'Renderer_HTML';
    this.rendererType = 'Canvas';    
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.RenderItems.AsciiArt_HTML', properties );
};
Friend.Tree.RenderItems.AsciiArt_HTML.render = function( properties )
{
    var canvas = this.resources.getImage( this.item.nameImage );
    if ( canvas )
    {
        var xx, yy;
        var context = canvas.getContext( '2d' );
        var imageData = context.getImageData( 0, 0, canvas.width, canvas.height );
        var srceSizeX = canvas.width / this.item.horizontalResolution;
        var srceSizeY = canvas.height / this.item.verticalResolution;
        var destSizeX = this.width / this.item.horizontalResolution;
        var destSizeY = this.height / this.item.verticalResolution;

        properties.rendererItem.clearRect( properties, 0, 0, this.width, this.height );       
        for ( var x = 0, xx = 0; x < this.item.horizontalResolution; x++, xx += srceSizeX )
        {
            for ( var y = 0, yy = 0; y < this.item.verticalResolution; y++, yy += srceSizeY )
            {
                var colors = this.utilities.getPixelColor( imageData, xx, yy, srceSizeX, srceSizeY );
                var lum = ( colors.red * 0.2126 + colors.green * 0.7152 + colors.blue * 0.0722 ) / 255;
                var index = Math.floor( this.item.palette.length * lum );
                var letter = this.item.palette[ index ];

                properties.rendererItem.drawText( properties, x * destSizeX + destSizeX / 2, y * destSizeY, letter, this.item.font, '#FFFFFF', 'left', 'middle', destSizeY );
            }                
        }
    }
    return properties;
};

Friend.Tree.RenderItems.AsciiArt_Canvas2D = function( tree, name, properties )
{    
    this.font = false;
    this.color = false;
    this.palette = false; 
    this.horizontalResolution = false;
	this.verticalResolution = false; 
	this.nameImage = false;

	this.rendererName = 'Renderer_Canvas2D';
    this.rendererType = 'Canvas'; 
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.RenderItems.AsciiArt_Canvas2D', properties );
};
Friend.Tree.RenderItems.AsciiArt_Canvas2D.render = Friend.Tree.RenderItems.AsciiArt_Three2D.render;
