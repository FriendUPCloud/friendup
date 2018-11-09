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
 * RenderItem canvas class
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 02/03/2018
 */
Friend = window.Friend || {};
Friend.Renderers = Friend.Renderers || {};
Friend.Renderers.Utilities = Friend.Renderers.Utilities || {};

// Canvas function for RendererItemCanvas
Friend.Renderers.Utilities.Canvas2D =
{
    setStrokeStyle: function( flags, style )
    {
        this.context.strokeStyle = this.getColor( style );
    },
    setFillStyle:function( flags, color )
    {
        this.context.fillStyle = this.getColor( color );
    },
    setLineWidth: function( flags, width )
    {
        this.context.lineWidth = width;
    },
    setGlobalAlpha: function( flags, alpha )
    {
        this.context.globalAlpha = alpha;
    },
    setFont: function( flags, font )
    {
        if ( typeof font == 'undefined' )
		      font = this.defaultFont;
        this.context.font = font;
    },
	beginPath: function( flags )
	{
		this.context.beginPath();
	},
	moveTo: function( flags, x, y )
	{
		this.context.moveTo( x, y );
	},
	lineTo: function( flags, x, y )
	{
		this.context.lineTo( x, y );
	},
	closePath: function( flags )
	{
		this.context.closePath();
	},
	clip: function( flags )
	{
		this.context.clip();
		flags.renderer.refresh = true;
	},
	stroke: function( flags )
	{
 		this.context.stroke();
		this.toRefresh = true;
	},
	fillRect: function( flags, x, y, width, height )
	{
 		this.context.fillRect( x, y, width, height );
		this.toRefresh = true;
	},
	clearRect: function( flags, x, y, width, height )
	{
 		this.context.clearRect( x, y, width, height );
		this.toRefresh = true;
	},
	rect: function( flags, x, y, width, height )
	{
 		this.context.rect( x, y, width, height );
	},
	ellipse: function( flags, x, y, width, height, start, end, angle )
	{
 		this.context.ellipse( x, y, width, height, start, end, angle );
	},
	fill: function( flags )
	{
 		this.context.fill();
		this.toRefresh = true;
	},
	save: function( flags )
	{
 		this.context.save();
	},
	restore: function( flags )
	{
 		this.context.restore();
	},
	fillText: function( flags, text, x, y )
	{
 		this.context.fillText( text, x, y );
		flags.renderer.refresh = true;
		this.toRefresh = true;
	},
	setTextAlign: function( flags, align )
	{
 		this.context.textAlign = align;
	},
	setTextBaseline: function( flags, base )
	{
 		this.context.textBaseline = base;
	},
	drawImage: function( flags, image, x, y, width, height )
	{
 		this.context.drawImage( image, x, y, width, height );
		flags.renderer.refresh = true;
		this.toRefresh = true;
	},
	scale: function( flags, x, y )
	{
 		this.context.scale( x, y );
	},
	setAlpha: function( flags, alpha )
	{
 		this.context.globalAlpha = alpha;
	},
	setLineCap: function( flags, cap )
	{
 		this.context.lineCap = cap;
	},
	translate: function( flags, x, y )
	{
 		this.context.translate( x, y );
	},
	rotate: function( flags, angle )
	{
 		this.context.rotate( angle );
	},
	drawText: function ( flags, x, y, text, font, color, hAlign, vAlign, size )
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
		flags.renderer.refresh = true;
		this.toRefresh = true;
	},
	getColor: function ( color )
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
	},
	setFontSize: function ( font, size )
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
	},
	getFontSize: function ( font )
	{
		return this.renderer.getFontSize( font );
	},
	addColor: function ( color, modification, direction )
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
	},
	measureText: function( text, font )
	{
	 	if ( typeof font == 'undefined' )
			font = this.defaultFont;
	 	this.context.font = font;
	 	var coords = this.context.measureText( text );
	 	coords.height = this.getFontSize( font );
	 	return coords;
	}
};
