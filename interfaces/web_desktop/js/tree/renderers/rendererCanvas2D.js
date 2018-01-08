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
 * Tree engine Utilities
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 18/08/2017
 */
Friend = window.Friend || {};
Friend.Renderers = Friend.Renderers || {};


Friend.Renderers.RendererCanvas2D = function( flags )
{
	this.tree = flags.tree;
	this.utilities = flags.utilities;
	this.anaglyph = false;
	this.stereoType = false;
	this.anaglyphMode = false;
	this.glassType = false;
	this.scaleRate = false;
    this.defaultFont = '12px Verdana';
	this.tempDrawing = false;
	this.utilities.setFlags( this, flags );
	this.canvas = flags.canvas;
	this.context = this.canvas.getContext( '2d' );
	this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.pile = [];
    this.zoomX = 1;
    this.zoomY = 1;
    this.rotation = 0;
    this.x = 0;
    this.y = 0;
	this.count = 0;
	if ( this.anaglyph )
	{
		this.realCanvas = this.canvas;
		this.realContext = this.context;
		this.canvas = document.createElement('canvas');
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.context = this.canvas.getContext( '2d' );
	}
	Object.assign( this, Friend.Rendered.RendererCanvas2D );
};

Friend.Renderers.RendererCanvas2D.postProcess = function ()
{
	var self = this;
	self.updating = true;
	if ( self.anaglyph )
	{
		var image = new Image();
		image.onload = function()
		{
			var canvas = document.createElement('canvas');
			canvas.width = this.width / 2;
			canvas.height = this.height;
			stereoDrawImage( image, self.stereoType, self.anaglyphMode, self.glassType, self.scaleRate, canvas );
			self.realContext.drawImage( canvas, 0, 0, 1024, 768 );
		}
		image.src = self.canvas.toDataURL("image/png");
	}
	self.updating = false;
};

/**
 * getHTML5Color
 *
 * Returns a HTML5 color string if parameter is a hex color number
 *
 * @param color (string or number) color
 * @return (string) HTML5 color
 */
Friend.Renderers.RendererCanvas2D.getColor = function ( color )
{
	if ( typeof color == 'number' )
	{
		var result = ( ( color & 0xFF0000 ) >> 32 ).toString( 16 )
			+ ( ( color & 0x00FF00 ) >> 16 ).toString( 16 )
			+ ( color & 0x0000FF ).toString( 16 );
	}
	else
		result = color;

	return result;
};

/**
 * setFontSize
 *
 * Changes the size in a HTML font string
 *
 * @param (string) font HTML font definition
 * @param (number) size the new size
 * @return (string) the HTML font definition with the new size
 */
Friend.Renderers.RendererCanvas2D.setFontSize = function ( font, size )
{
    if ( typeof font == 'undefined' )
		font = this.defaultFont;

	var pos = font.indexOf( 'px' );
	if ( pos >= 0 )
	{
		font = size + font.substring( pos );
	}
	else
	{
		font = size + 'px ' + font;
	}
	return font;
};

/**
 * getFontSize
 *
 * Extracts the size from a HTML font string
 *
 * @param (string) font HTML font definition
 * @return (number) the size
 */
Friend.Renderers.RendererCanvas2D.getFontSize = function ( font )
{
    if ( typeof font == 'undefined' )
		font = this.defaultFont;
	var pos = font.indexOf( 'px' );
	if ( pos > 0 )
		return parseInt( font.substring( 0, pos ), 10 );
	return 16;
};

/**
 * drawCenteredText
 *
 * Draw a text
 *
 * @param (object) context context to draw into
 * @param (number) x horizontal coordinate
 * @param (number) y vertical coordinate
 * @param (string) text string of text to draw
 * @param (string) font HTML font definition
 * @param (number) size (optional) size of the text to draw
 * @param (string) color (optional) color to draw the text
 */
Friend.Renderers.RendererCanvas2D.drawText = function ( flags, x, y, text, font, color, hAlign, vAlign, size )
{
    if ( typeof font === 'undefined' )
		font = this.defaultFont + '';
	if ( typeof color === 'undefined' )
		color = '#000000';
	if ( typeof hAlign === 'undefined' )
		hAlign = 'center';
	if ( typeof vAlign === 'undefined' )
		vAlign = 'middle';
    if ( typeof size !== 'undefined' )
        font = this.setFontSize( font, size );
	this.context.font = font;
	this.context.textAlign = hAlign;
    this.context.textBaseline = vAlign;
	this.context.fillStyle = color;
	this.context.fillText( text, x, y );
};

/**
 * addColor
 *
 * Adds two HTML color strings
 *
 * @param (string) color the original color
 * @param (string) modification the modification color, each element wiull be added/subtracted to the color
 * @param (number) direction the direction of the modification (1 or -1 or any floating point value)
 * @return (string) the new color
 */
Friend.Renderers.RendererCanvas2D.addColor = function ( color, modification, direction )
{
    if ( typeof direction === 'undefined' )
        direction = 1;
	for ( var c = 1; c < 7; c += 2 )
	{
		var mod = parseInt( modification.substr( c, 2 ), 16 ) * direction;
		var col = parseInt( color.substr( c, 2 ), 16 );
		var temp = col + mod;
		if ( temp > 255 )
			temp = 255;
		if ( temp < 0 )
			temp = 0;
		temp = temp.toString( 16 );
		if ( temp.length < 2 )
			temp = '0' + temp;
		color = color.substring( 0, c ) + temp + color.substring( c + 2 )
	}
	return color;
};

Friend.Renderers.RendererCanvas2D.measureText = function( text, font )
{
    if ( typeof font == 'undefined' )
		font = this.defaultFont;
    this.context.font = font;
    var coords = this.context.measureText( text );
    coords.height = this.getFontSize( font );
    return coords;
};
Friend.Renderers.RendererCanvas2D.renderUp = function( flags, item )
{
    var xx = this.x + item.x;
    var yy = this.y + item.y;
    if ( !item.noPerspective )
    {
        xx += ( xx - flags.xCenter ) * flags.perspective;
        yy += ( yy - flags.yCenter ) * flags.perspective;
    }
    item.rect.x = xx;
    item.rect.y = yy;
    item.rect.width = item.sx;
    item.rect.height = item.sy;
    item.thisRect.x = -item.hotSpotX;
    item.thisRect.y = -item.hotSpotY;
    item.thisRect.width = item.sx;
    item.thisRect.height = item.sy;
	var pushed =
	{
		command: 'nothing',
		zoomX: this.zoomX,
		zoomY: this.zoomY,
		rotation: this.rotation,
		x: this.x,
		y: this.y,
		alpha: this.alpha
	};
	if ( item.parent )
	{
		if ( item.noRotation || item.parent.noRotation )
		{
			var pile = this.pile[ this.pile.length - 1 ];
			if ( pile.command == 'restore' )
			{
				this.context.restore();
				this.context.save();
				this.context.translate( item.parent.x, item.parent.y );
		        this.rotation = pile.rotation;
		        this.x = pile.x + item.parent.x;
		        this.y = pile.y + item.parent.y;
			}
		}
		//else
		//	this.context.translate( item.parent.hotSpotX, item.parent.hotSpotY );
	}
    if ( item.rotation || item.zoomX != 1 || item.zoomY != 1 || item.clip )
    {
		pushed.command = 'restore';
		pushed.saved = true;
        this.context.save();
        this.context.translate( item.x, item.y );
        this.context.rotate( -item.rotation * Friend.Flags.DEGREETORADIAN );
        this.context.scale( Math.max( 0.001, item.zoomX ), Math.max( 0.001, item.zoomY ) );
        //this.context.translate( -item.hotSpotX, -item.hotSpotY );
		this.context.globalAlpha = item.alpha;
	    this.alpha = item.alpha;
        this.zoomX *= item.zoomX;
        this.zoomY *= item.zoomY;
        this.rotation += item.rotation;
        this.x += item.x;
        this.y += item.y;
        item.rect.x -= item.hotSpotX;
        item.rect.y -= item.hotSpotY;
		if ( item.clip )
	        item.thisRect.clip( flags );
    }
    else if ( item.x !== 0 || item.y !== 0  )
    {
		pushed.command = 'translate';
		pushed.deltaX = item.x;
		pushed.deltaY = item.y;
        this.context.translate( item.x, item.y );
		this.context.globalAlpha = item.alpha;
	    this.alpha = item.alpha;
        this.x += pushed.deltaX;
        this.y += pushed.deltaY;
		if ( item.clip )
		{
			this.context.save();
	        item.thisRect.clip( flags );
			pushed.saved = true;
		}
        item.rect.x -= item.hotSpotX;
        item.rect.y -= item.hotSpotY;
    }
    else if ( item.clip )
	{
		pushed.command = 'clip';
		this.context.save();
		item.thisRect.clip( flags );
		pushed.saved = true;
		this.context.globalAlpha = item.alpha;
	    this.alpha = item.alpha;
	}
	else if ( item.alpha !== this.alpha )
	{
		pushed.command = 'alpha';
		this.context.globalAlpha = item.alpha;
	    this.alpha = item.alpha;
	}
	this.pile.push( pushed );
	this.count++;
};
Friend.Renderers.RendererCanvas2D.renderDown = function( flags )
{
	this.count--;
    var pile = this.pile.pop();
    switch ( pile.command  )
    {
    case 'restore':
		this.context.restore();
        this.zoomX = pile.zoomX;
        this.zoomY = pile.zoomY;
        this.rotation = pile.rotation;
        this.x = pile.x;
        this.y = pile.y;
        break;

    case  'translate':
		if ( pile.saved )
			this.context.restore();
		else
		{
        	this.context.translate( -pile.deltaX, -pile.deltaY );
        	this.context.globalAlpha = pile.alpha;
		}
        this.x = pile.x;
        this.y = pile.y;
        break;

	case 'clip':
		this.context.restore();
		break;

    case 'alpha':
		this.context.globalAlpha = pile.alpha;
        break;

	default:
		break;
    }
};

Friend.Renderers.RendererCanvas2D.setStrokeStyle = function( flags, style )
{
	this.context.strokeStyle = this.getColor( style );
};
Friend.Renderers.RendererCanvas2D.setFillStyle = function( flags, color )
{
    this.context.fillStyle = this.getColor( color );
};
Friend.Renderers.RendererCanvas2D.setLineWidth = function( flags, width )
{
    this.context.lineWidth = width;
};
Friend.Renderers.RendererCanvas2D.setGlobalAlpha = function( flags, alpha )
{
    this.context.globalAlpha = alpha;
};
Friend.Renderers.RendererCanvas2D.setFont = function( flags, font )
{
    if ( typeof font == 'undefined' )
		font = this.defaultFont;
    this.context.font = font;
};
Friend.Renderers.RendererCanvas2D.beginPath = function( flags )
{
	this.context.beginPath();
};
Friend.Renderers.RendererCanvas2D.moveTo = function( flags, x, y )
{
	this.context.moveTo( x, y );
};
Friend.Renderers.RendererCanvas2D.lineTo = function( flags, x, y )
{
	this.context.lineTo( x, y );
};
Friend.Renderers.RendererCanvas2D.closePath = function( flags )
{
	this.context.closePath();
};
Friend.Renderers.RendererCanvas2DRenderer.clip = function( flags )
{
	this.context.clip();
};
Friend.Renderers.RendererCanvas2DRenderer.stroke = function( flags )
{
    this.context.stroke();
};
Friend.Renderers.RendererCanvas2DRenderer.fillRect = function( flags, x, y, width, height )
{
    this.context.fillRect( x, y, width, height );
};
Friend.Renderers.RendererCanvas2DRenderer.rect = function( flags, x, y, width, height )
{
    this.context.rect( x, y, width, height );
};
Friend.Renderers.RendererCanvas2DRenderer.ellipse = function( flags, x, y, width, height, start, end, angle )
{
    this.context.ellipse( x, y, width, height, start, end, angle );
};
Friend.Renderers.RendererCanvas2DRenderer.fill = function( flags )
{
    this.context.fill();
};
Friend.Renderers.RendererCanvas2DRenderer.fill = function( flags )
{
    this.context.fill();
};
Friend.Renderers.RendererCanvas2DRenderer.save = function( flags )
{
    this.context.save();
};
Friend.Renderers.RendererCanvas2DRenderer.restore = function( flags )
{
    this.context.restore();
};
Friend.Renderers.RendererCanvas2DRenderer.fillText = function( flags, text, x, y )
{
    this.context.fillText( text, x, y );
};
Friend.Renderers.RendererCanvas2DRenderer.setTextAlign = function( flags, align )
{
    this.context.textAlign = align;
};
Friend.Renderers.RendererCanvas2DRenderer.setTextBaseline = function( flags, base )
{
    this.context.textBaseline = base;
};
Friend.Renderers.RendererCanvas2DRenderer.drawImage = function( flags, image, x, y, width, height )
{
    this.context.drawImage( image, x, y, width, height );
};
Friend.Renderers.RendererCanvas2DRenderer.scale = function( flags, x, y )
{
    this.context.scale( x, y );
};
Friend.Renderers.RendererCanvas2DRenderer.setLineCap = function( flags, cap )
{
    this.context.lineCap = cap;
};
Friend.Renderers.RendererCanvas2DRenderer.translate = function( flags, x, y )
{
    this.context.translate( x, y );
};
Friend.Renderers.RendererCanvas2DRenderer.rotate = function( flags, angle )
{
    this.context.rotate( angle );
};
