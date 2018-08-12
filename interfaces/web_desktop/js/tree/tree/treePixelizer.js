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
 * Tree engine Tree management elements
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.RenderItems = Friend.Tree.RenderItems || {};

Friend.Tree.Pixelizer = function( tree, name, properties )
{    
	this.nameImage = false;
	this.resolutionHorizontal = 64;
    this.resolutionVertical = 64 * 9 / 16; 
	
    this.renderItemName = 'Friend.Tree.RenderItems.Pixelizer';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Pixelizer', properties );
    this.registerEvents( 'refresh' );
};
Friend.Tree.Pixelizer.messageUp = function( message )
{
    if ( message.command == 'refresh' )
        this.doRefresh();
    return this.startProcess( message, [ 'x', 'y', 'z', 'rotation' ] );
};
Friend.Tree.Pixelizer.messageDown = function( message )
{
    return this.endProcess( message, [ 'x', 'y', 'z', 'rotation' ] );
};

Friend.Tree.RenderItems.Pixelizer_HTML = function( tree, name, properties )
{    
    this.resolutionHorizontal = false;
    this.resolutionVertical = false; 

	this.rendererName = 'Renderer_HTML';
    this.rendererType = 'Canvas';    
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.RenderItems.Pixelizer_HTML', properties );
};
Friend.Tree.RenderItems.Pixelizer_HTML.render = function( properties )
{
    var canvas = this.resources.getImage( this.item.nameImage );
    if ( canvas )
    {
        var xx, yy;
        var context = canvas.getContext( '2d' );
        var imageData = context.getImageData( 0, 0, canvas.width, canvas.height );
        var srceSizeX = canvas.width / this.item.resolutionHorizontal;
        var srceSizeY = canvas.height / this.item.resolutionVertical;
        var destSizeX = this.width / this.item.resolutionHorizontal;
        var destSizeY = this.height / this.item.resolutionVertical;
        for ( var x = 0, xx = 0; x < this.item.resolutionHorizontal; x++, xx += srceSizeX )
        {
            for ( var y = 0, yy = 0; y < this.item.resolutionVertical; y++, yy += srceSizeY )
            {
                var colors = this.utilities.getPixelColor( imageData, xx, yy, srceSizeX, srceSizeY );
                var color = this.utilities.getColorString( colors.red, colors.green, colors.blue );
                properties.rendererItem.setFillStyle( properties, color );
                properties.rendererItem.fillRect( properties, x * destSizeX, y * destSizeY, destSizeX, destSizeY );   
            }                
        }
    }
    return properties;
};

Friend.Tree.RenderItems.Pixelizer_Canvas2D = function( tree, name, properties )
{    
    this.resolutionHorizontal = false;
	this.resolutionVertical = false;
	 
    this.rendererName = 'Renderer_Canvas2D';
    this.rendererType = 'Canvas'; 
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.RenderItems.Pixelizer_Canvas2D', properties );
};
Friend.Tree.RenderItems.Pixelizer_Canvas2D.render = Friend.Tree.RenderItems.Pixelizer_Three2D.render;
