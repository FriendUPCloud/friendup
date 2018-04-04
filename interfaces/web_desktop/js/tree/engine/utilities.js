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

Friend.Tree.Utilities = function( flags )
{
    this.tree = flags.tree;
	this.renderer = flags.renderer;
	Object.assign( this, Friend.Tree.Utilities );
};
Friend.Tree.Utilities.round = function ( number, decimals )
{
	var power = Math.pow( 10, decimals );
	var result = Math.round( number * power ) / power;
	return result;
};
Friend.Tree.Utilities.convertToHex = function ( number, decimals, prefix )
{
	var result = number.toString( 16 );
	while ( decimals && result.length < decimals )
		 result = '0' + result;
	if ( prefix )
		result = '0x' + result;
	return result;
};
Friend.Tree.Utilities.getPath = function ( path )
{
	var doubleDot = path.indexOf( ':' );
	if ( doubleDot >= 0 )
	{
		if ( path.substring( 0, doubleDot ) == 'Progdir' )
			path = getImageUrl( path );
	}
	return path;
};
Friend.Tree.Utilities.getNextPowerOfTwo = function ( v )
{
    v--;
    v |= v >> 1;
    v |= v >> 2;
    v |= v >> 4;
    v |= v >> 8;
    v |= v >> 16;
    v++;
    return v;
};
Friend.Tree.Utilities.isPowerOfTwo=function ( n )
{
	return n && (n & (n - 1)) === 0;
};
Friend.Tree.Utilities.assignToObject = function( destination, source )
{
	// Find the class from the name
	var klass = this.getClass( source );

	// Assigns the values
	for ( var property in klass )
		destination[ property ] = klass[ property ];

	return destination;
};
Friend.Tree.Utilities.getClass = function( source )
{
	// Assign the functions of the class
	var start = 0;
	var end = source.indexOf( '.' );
	if ( end < 0 )
		end = 10000;
	var klass = window[ source.substring( start, end ) ];
	if ( typeof klass == 'undefined' )
		return null;
	while( end < source.length )
	{
		start = end + 1;
		end = source.indexOf( '.', start );
		if ( end < 0 )
			end = 10000;
		klass = klass[ source.substring( start, end ) ];
		if ( typeof klass == 'undefined' )
			return null;
	};
	return klass;
};
Friend.Tree.Utilities.replaceObjectsByNames = function ( root, destination, object, safe )
{
	for ( var key in object )
	{
		var subObject = object[ key ];
		switch ( key )
		{
			case 'collisions':
			case 'processes':
				destination[ key ] = this.replaceObjectsByNames( root, [], subObject, true );
				break;
			case 'sound':
			case 'image':
				destination[ key ] = subObject;
				break;
			default:
				if ( this.isArray( subObject ) )
					destination[ key ] = this.replaceObjectsByNames( root, [], subObject, safe );
				else if ( this.isObject( subObject ) )
				{
					if ( subObject.className )
						destination[ key ] = { class: subObject.className, name: subObject.name, identifier: subObject.identifier };
					else if ( safe )
						destination[ key ] = this.replaceObjectsByNames( root, {}, subObject, safe );
					/*
					else if ( key == 'with' )
						destination[ key ] = this.replaceObjectsByNames( root, [], subObject, key );
					else if ( key == 'params' )
						destination[ key ] = this.replaceObjectsByNames( root, {}, subObject, key );
					*/
				}
				else
					destination[ key ] = subObject;
				break;
		}
	}
	return destination;
}
Friend.Tree.Utilities.replaceNamesByObjects = function ( root, object, destination )
{
	for ( var key in object )
	{
		var subObject = object[ key ];
		switch ( key )
		{
			case 'root':
                destination[ key ] = root;
                break;
			case 'caller':
				destination[ key ] = root.findItemFromName( subObject.name, root );
				break;
			default:
				if ( this.isObject( subObject ) )
				{
					if ( subObject.className )
						console.log( 'TODO: replaceNameByObject, replace by the real object...' );
					else if ( subObject.name && subObject.class )
					 	destination[ key ] = root.findItemFromNameAndClassName( subObject.name, subObject.class );
					else
						destination[ key ] = this.replaceNamesByObjects( root, subObject, {} );
				}
				else if ( this.isArray( subObject ) )
					destination[ key ] = this.replaceNamesByObjects( root, subObject, [] );
				else
					destination[ key ] = subObject;

				break;
		}
	}
	return destination;
};
Friend.Tree.Utilities.isObject = function( item )
{
    return typeof item != 'undefined' ? (typeof item === "object" && !Array.isArray(item) && item !== null) : false;
};
Friend.Tree.Utilities.isArray = function( item )
{
    return typeof item != 'undefined' ? item.constructor == Array : false;
};
Friend.Tree.Utilities.updateCommonProperties = function( object, flags )
{
	var refresh = false;
    if ( object[ flags[ property ] ] )
    {
        if ( object[ property ] != flags[ property ] )
        {
            object[ property ] = flags[ property ];
            refresh = true;
        }
	}
	return refresh;
};
Friend.Tree.Utilities.getPixelColor = function( imageData, x, y, width, height )
{
	var precision = 3;

	var red = 0;
	var green = 0;
	var blue = 0;
	var alpha = 0;
	var imageWidth = imageData.width;
	var data = imageData.data;
	for ( var xx = 0; xx < precision; xx += 1 )
	{
		for ( var yy = 0; yy < precision; yy += 1 )
		{
			//var data = context.getImageData( , , 1, 1 ).data;
			var xxx = Math.floor( x + ( width / precision ) * xx );
			var yyy = Math.floor( y + ( height / precision ) * yy );
			var address = ( xxx + yyy * imageWidth ) * 4; 			
			red += data[ address ];
			green += data[ address + 1 ];
			blue += data[ address + 2 ];
		}
	}
	precision = precision * precision;
	var result =
	{
		red: Math.floor( red / precision ),
		green: Math.floor( green / precision ),
		blue: Math.floor( blue / precision )
	};
	return result;
};
Friend.Tree.Utilities.getColorString = function( r, g, b )
{
	var red = r.toString( 16 );
	if ( red.length == 1 )
		red = '0' + red;
	var green = g.toString( 16 );
	if ( green.length == 1 )
		green = '0' + green;
	var blue = b.toString( 16 );
	if ( blue.length == 1 )
		blue = '0' + blue;
	return '#' + red + green +  blue;
}

Friend.Tree.Utilities.getSizeFromString = function( desiredSize, parentSize )
{
	var pos = 0;
	var c, count;
	var destination = "" + desiredSize;
	
	// Direct size
	var pos = destination.indexOf( 'px' );
	while ( pos >= 0 )
	{
		// Removes the 'px', leave the number
		destination = destination.substring( 0, pos ) + destination.substring( pos + 2 );
		pos = destination.indexOf( 'px' );
	}

	// Percentages
	var pos = destination.indexOf( '%' );
	while ( pos >= 0 )
	{
		// Get the number
		start = pos - 1;
		while ( start >= 0 )
		{
			var c = destination.charAt( start );
			if ( c < '0' || c > '9' )
				break;
			start--;
		}
		start++;
		var s = destination.substring( start, pos );
		var value = parseInt( s ) / 100;
		value = value * parentSize;

		// Removes the 'px', leave the number
		destination = destination.substring( 0, start ) + value + destination.substring( pos + 1 );
		pos = destination.indexOf( '%' );
	}

	// Calc -> keep the content in brackets
	var pos = destination.indexOf( 'calc' );
	while ( pos >= 0 )
	{
		// Finds the closing brackets
		start = destination.indexOf( '(', pos );
		if ( start >= 0 )
		{
			end = destination.indexOf( ')', start );
			if ( end > start )
				destination = destination.substring( 0, pos ) + destination.substring( start + 1, end ) + destination.substring( end + 1 );
		}		
		var pos = destination.indexOf( 'calc' );
	}

	// Calculates the result
	var result = eval( destination );
	return result;
}
/**
 * rotateCoords
 *
 * Rotates a set of coordinates around a point
 *
 * @param (object) coords object containing the x: and y: coordinates
 * @param (number) rotation center x coordinate
 * @param (number) rotation center y coordinate
 * @param (number) angle rotation angle, in degrees
 */
Friend.Tree.Utilities.rotateCoords = function ( coords, xCenter, yCenter, angle )
{
	for ( var i = 0; i < coords.length; i ++ )
	{
		var x = coords[ i ].x - xCenter;
		var y = coords[ i ].y - yCenter;
		coords[ i ].x = x * Math.cos( - angle * Friend.Tree.DEGREETORADIAN ) - y * Math.sin( - angle * Friend.Tree.DEGREETORADIAN ) + xCenter;
		coords[ i ].y = y * Math.cos( - angle * Friend.Tree.DEGREETORADIAN ) + x * Math.sin( - angle * Friend.Tree.DEGREETORADIAN ) + yCenter;
	}
	return coords;
};
Friend.Tree.Utilities.rotateCoord = function ( x, y, xCenter, yCenter, angle )
{
    var coords = { };
    x -= xCenter;
    y -= yCenter;
    coords.x = x * Math.cos( - angle * Friend.Tree.DEGREETORADIAN ) - y * Math.sin( - angle * Friend.Tree.DEGREETORADIAN ) + xCenter;
    coords.y = y * Math.cos( - angle * Friend.Tree.DEGREETORADIAN ) + x * Math.sin( - angle * Friend.Tree.DEGREETORADIAN ) + yCenter;
    return coords;
};
Friend.Tree.Utilities.rotateCoordinates = function ( x, y, distance, angle )
{
	var coords = { };
	coords.x = x + Math.cos( angle * Friend.Tree.DEGREETORADIAN ) * distance;
	coords.y = y - Math.sin( angle * Friend.Tree.DEGREETORADIAN ) * distance;
	return coords;
};
Friend.Tree.Utilities.rotate = function ( coords, angle, rayX, rayY )
{
	coords.x = coords.x + Math.cos( angle * Friend.Tree.DEGREETORADIAN ) * rayX;
	coords.y = coords.y - Math.sin( angle * Friend.Tree.DEGREETORADIAN ) * rayY;
	return coords;
};

/**
 * setPositionFromObject
 *
 *
 */
Friend.Tree.Utilities.setPositionFromObject = function ( object, parent, distance, angle, flags )
{
	if ( typeof flags == 'undefined' )
		flags = Friend.Tree.FLAG_SETX | Friend.Tree.FLAG_SETY | Friend.Tree.FLAG_SETANGLE;

	var x, y, rotation;
	if ( ( flags & Friend.Tree.FLAG_SETX ) != 0 )
		x = parent.x + Math.cos( angle * Friend.Tree.DEGREETORADIAN ) * distance;
	if ( ( flags & Friend.Tree.FLAG_SETY ) != 0 )
		y = parent.y - Math.sin( angle * Friend.Tree.DEGREETORADIAN ) * distance;
	if ( ( flags & Friend.Tree.FLAG_SETANGLE ) != 0 )
		rotation = parent.rotation;

	parent.setCoordinates( x, y );
	// parent.setRotation( rotation ); // TODO
	return true;
};


/**
 * cleanArray
 *
 * Cleans the properties of an object used as an array
 * Explores the properties and only keep the non-false ones
 *
 * @param (object) arr the object to clean
 * @return (object) the cleaned object
 */
Friend.Tree.Utilities.cleanArray = function ( arr )
{
	var temp = {};
	for ( var key in arr )
	{
		if ( arr[ key ] )
			temp[ key ] = arr[ key ];
	}
	return temp;
};

/**
 * setFlags
 *
 * Sets a list of flags in an object
 *
 * @param (object) object the item to modify
 * @param (object) flags the list of properties
 */
Friend.Tree.Utilities.setFlags = function ( object, flags )
{
	if ( flags )
	{
		for ( var f in flags )
		{
			if ( typeof object[ f ] != 'undefined' )
				object[ f ] = flags[ f ];
		}
	}
	return true;
};
Friend.Tree.Utilities.forceFlags = function ( object, property, flags )
{
	if ( typeof object[ property ] == 'undefined' )
		object[ property ] = {};	
	if ( flags )
	{
		var destination = object[ property ];
		for ( var f in flags )
		{
			if ( typeof destination[ f ] == 'undefined' )
				destination[ f ] = flags[ f ];
		}
	}
	return true;
};
Friend.Tree.Utilities.computeProperties = function ( flags, item, variables )
{
	var previousItem = variables.previousItem;
	var parentItem = variables.parentItem;
	var treeWidth = variables.treeWidth;
	var treeHeight = variables.treeHeight;
	var self = this;
	for ( var p in flags )
	{
		if ( typeof flags[ p ] == 'string' )
		{
			if ( flags[ p ].substring( 0, 5 ) == 'eval:' )
			{
				try
				{
					flags[ p ] = eval( flags[ p ].substring( 5 ) );
				}
				catch (e)
				{
					flags[ p ] = 0;
					Friend.Tree.log( item,
					{
						error: 'error while evaluating ' + flags[ p ]
					} );
				}
				finally {}
			}
		}
	}
	return flags;

	function widthToParent( delta )
	{
		return parentItem.width - flags.x + delta;
	};
	function heightToParent( delta )
	{
		return parentItem.height - flags.y + delta;
	};
};

/**
 * Handy Rect object
 *
 * @param xOrRect (object or number) Rect object to copy or x coordinate
 * @param y (number) x Coordinate
 * @param width (number) width
 * @param height (number) height
 * @return (object) the newly created rect
 */
Friend.Tree.Utilities.Rect = function( xOrRect, y, width, height, flags )
{
	if ( typeof xOrRect == 'undefined' )
	{
		this.x = 0;
		this.y = 0;
		this.width = 0;
		this.height = 0;
	}
	else if ( typeof xOrRect == 'object' )
	{
		this.x = xOrRect.x;
		this.y = xOrRect.y;
		this.width = xOrRect.width;
		this.height = xOrRect.height;
	}
	else
	{
		this.x = xOrRect;
		this.y = y;
		this.width = width;
		this.height = height;
	}
	Object.assign( this, Friend.Tree.Utilities.Rect );
	return this;
};

/**
 * isPointIn
 *
 * Checks if a point is within the rectangle
 *
 * @param (number) x horizontal coordinate
 * @param (number) y vertical coordinate
 * @return (boolean) true if the point is within the rectangle, false if outside
 */
Friend.Tree.Utilities.Rect.isPointIn = function ( x, y )
{
	return ( x >= this.x && x < this.x + this.width && y >= this.y && y < this.y + this.height );
};

Friend.Tree.Utilities.Rect.getCenter = function ()
{
	var coords = 
	{
		x: ( this.left + this.width ) / 2,
		y: ( this.top + this.height ) / 2
	}
	return coords;
};

Friend.Tree.Utilities.Rect.getRayCoords = function ( flags, angle )
{
	var center = this.getCenter( flags );
	var coords = Friend.Tree.Utilities.rotate( center, angle, this.width, this.height );
	return coords;
};

/**
 * move
 *
 * Adds an offset to the x and y coordinates of the rectangle
 *
 * @param (number) x signed distance to add to horizontal coordinate
 * @param (number) y signed distance to add to the vbertical coordinate
 */
Friend.Tree.Utilities.Rect.move = function ( x, y )
{
	this.x += x;
	this.y += y;
};

/**
 * zoom
 *
 * Multiplies the width and height by a zoom factor
 *
 * @param (number) zoom multiplication factor
 */
Friend.Tree.Utilities.Rect.zoom = function ( zoom )
{
	//this.x *= zoom;
	//this.y *= zoom;
	this.width *= zoom;
	this.height *= zoom;
};

/**
 * shrink
 *
 * Increase or decreases a rectangle
 *
 * @param (number) deltaX horizontal shrink factor
 * @param (number) deltaY vertical shrink factor
 */
Friend.Tree.Utilities.Rect.shrink = function ( deltaX, deltaY )
{
	if ( typeof deltaY == ' undefined' )
		deltaY = deltaX;
	this.x += deltaX / 2;
	this.y += deltaY / 2;
	this.width -= deltaX;
	this.height -= deltaY;
};

/** clip
 *
 * Sets the context clipping rectangle to the rect
 *
 * @param (object) context drawing context
 */
Friend.Tree.Utilities.Rect.clip = function ( flags )
{
	flags.rendererItem.beginPath( flags );
	flags.rendererItem.moveTo( flags, this.x, this.y );
	flags.rendererItem.lineTo( flags, this.x + this.width, this.y );
	flags.rendererItem.lineTo( flags, this.x + this.width, this.y + this.height );
	flags.rendererItem.lineTo( flags, this.x, this.y + this.height );
	flags.rendererItem.lineTo( flags, this.x, this.y );
	flags.rendererItem.closePath( flags );
	flags.rendererItem.clip( flags );
};
Friend.Tree.Utilities.Rect.saveContext = function ( flags )
{
	flags.rendererItem.save( flags );
};
Friend.Tree.Utilities.Rect.restoreContext = function ( flags )
{
	flags.rendererItem.restore( flags );
};
Friend.Tree.Utilities.Rect.drawDiagonal = function ( flags, color, size, directions )
{
	flags.rendererItem.setLineWidth( flags, 1);
	flags.rendererItem.setStrokeStyle( flags, color );
	if ( directions & Friend.Tree.DIAGONAL_TOPLEFT_BOTTOMRIGHT )
	{
		flags.rendererItem.beginPath( flags );
		flags.rendererItem.moveTo( flags, this.x, this.y );
		flags.rendererItem.lineTo( flags, this.x + this.width, this.y + this.height );
		flags.rendererItem.stroke( flags );
	    flags.rendererItem.closePath();
	}
	if ( directions & Friend.Tree.DIAGONAL_TOPRIGHT_BOTTOMLEFT )
	{
		flags.rendererItem.beginPath( flags );
		flags.rendererItem.moveTo( flags, this.x + this.width, this.y );
		flags.rendererItem.lineTo( flags, this.x, this.y + this.height );
		flags.rendererItem.stroke( flags );
	    flags.rendererItem.closePath();
	}
};

/**
 * drawHilightedBox
 *
 * Draw a box with light reflections
 *
 * @param (object) context drawing context
 * @param (string) color background color
 * @param (string) brightColor bright side color
 * @param (string) darkColor dark side color
 */
Friend.Tree.Utilities.Rect.drawHilightedBox = function ( flags, color, brightColor, darkColor )
{
	flags.rendererItem.setFillStyle( flags, color);
	flags.rendererItem.fillRect( flags, this.x, this.y, this.width, this.height);
	flags.rendererItem.setLineWidth( flags, 1);
	flags.rendererItem.beginPath( flags );
	flags.rendererItem.moveTo( flags, this.x, this.y + this.height );
	flags.rendererItem.lineTo( flags, this.x, this.y );
	flags.rendererItem.lineTo( flags, this.x + this.width, this.y );
	flags.rendererItem.setStrokeStyle( flags, brightColor );
	flags.rendererItem.stroke( flags );
	flags.rendererItem.beginPath( flags );
	flags.rendererItem.moveTo( flags, this.x + this.width, this.y );
	flags.rendererItem.lineTo( flags, this.x + this.width, this.y + this.height );
	flags.rendererItem.lineTo( flags, this.x, this.y + this.height );
	flags.rendererItem.setStrokeStyle( flags, darkColor);
	flags.rendererItem.stroke( flags );
    flags.rendererItem.closePath();
};

/**
 * drawBox
 *
 * Draws a simple box with border
 *
 * @param (object) context drawing context
 * @param (string) color box color
 * @param (string) borderColor color of the border
 * @param (number) borderSize size of the border in pixels (0 = no border)
 */
Friend.Tree.Utilities.Rect.drawBox = function ( flags, color, borderColor, borderSize )
{
	flags.rendererItem.setFillStyle( flags, color );
	flags.rendererItem.fillRect( flags, this.x, this.y, this.width, this.height );
	if ( borderSize && borderColor )
	{
		this.drawRectangle( flags, borderColor, borderSize );
	}
};

Friend.Tree.Utilities.Rect.clear = function ( flags )
{
	flags.rendererItem.clearRect( flags, this.x, this.y, this.width, this.height );
};

/**
 * drawEllipse
 *
 * Draws a simple ellipse
 *
 * @param (object) context drawing context
 * @param (string) color circle color
 * @param (string) borderColor color of the border
 * @param (number) borderSize size of the border in pixels (0 = no border)
 */
Friend.Tree.Utilities.Rect.drawEllipse = function ( flags, fillColor, borderColor, borderSize )
{
	flags.rendererItem.beginPath( flags );
	flags.rendererItem.ellipse( flags, this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, - Math.PI, Math.PI );
	if ( typeof fillColor != 'undefined' )
	{
		flags.rendererItem.setFillStyle( flags, fillColor );
		flags.rendererItem.fill( flags );
	}
	if ( borderSize && borderColor )
	{
		flags.rendererItem.setLineWidth( flags, borderSize );
		flags.rendererItem.setStrokeStyle( flags, borderColor );
		flags.rendererItem.stroke( flags );
	}
    flags.rendererItem.closePath();
};

/**
 * drawRay
 *
 * Draws a ray from center to circumference of an ellipse
 *
 * @param (object) context drawing context
 * @param (number) angle
 * @param (string) color color of the ray
 * @param (string) size of the ray
 */
Friend.Tree.Utilities.Rect.drawRay = function ( flags, angle, color, size )
{
	var center = this.getCenter();
	var coords = this.rotate( coords, angle, this.width, this.height );
	flags.rendererItem.setLineWidth( flags, size );
	flags.rendererItem.setStrokeStyle( flags, color );
	flags.rendererItem.beginPath( flags );
	flags.rendererItem.moveTo( flags, center.x, center.y );
	flags.rendererItem.lineTo( flags, coords.x, coords.y );
	flags.rendererItem.stroke( flags );
	flags.rendererItem.closePath();
};
Friend.Tree.Utilities.Rect.drawLine = function ( flags, x1, y1, x2, y2, color, size )
{
	flags.rendererItem.setLineWidth( flags, size );
	flags.rendererItem.setStrokeStyle( flags, color );
	flags.rendererItem.beginPath( flags );
	flags.rendererItem.moveTo( flags, x1, y1 );
	flags.rendererItem.lineTo( flags, x2, y2 );
	flags.rendererItem.stroke( flags );
	flags.rendererItem.closePath();
};

/**
 * drawRectangle
 *
 * Draw a simple wire rectangle in one color, no borders
 *
 * @param (object) context drawing context
 * @param (string) color drawing color
 * @param (number) size of the pen
 */
Friend.Tree.Utilities.Rect.drawRectangle = function ( flags, color, size )
{
	flags.rendererItem.setLineWidth( flags, size );
	flags.rendererItem.setStrokeStyle( flags, color );
    flags.rendererItem.beginPath();
	flags.rendererItem.rect( flags, this.x, this.y, this.width, this.height );
    flags.rendererItem.stroke( flags );
};

/**
 * draw mosaic
 *
 * Fills the rectangle with a repitition of a bitmap
 *
 * @param (object) context drawing context
 * @param (string) image
 */
Friend.Tree.Utilities.Rect.drawMosaic = function ( flags, image, xOffset, yOffset )
{
//    flags.renderer.save( flags );
//    this.clip( flags );
    var nx = Math.floor( this.width / image.width ) + 1;
    var ny = Math.floor( this.height / image.height ) + 1;

    if ( typeof xOffset === 'undefined' )
        xOffset = 0;
    if ( typeof yOffset === 'undefined' )
        yOffset = 0;
    for ( var y = 0; y <= ny; y++  )
    {
        for ( var x = 0; x <= nx; x++ )
        {
            flags.rendererItem.drawImage( flags, image, this.x + x * image.width + xOffset, this.y + y * image.height + yOffset, image.width, image.height );
        }
    }
//	flags.renderer.restore( flags );
};

/**
 * fillRectangle
 *
 * Draw a simple rectangle in one color, no borders
 *
 * @param (object) context drawing context
 * @param (string) color drawing color
 * @param (number) size of the pen
 */
Friend.Tree.Utilities.Rect.fillRectangle = function ( flags, color )
{
	flags.rendererItem.setFillStyle( flags, color );
	flags.rendererItem.fillRect( flags, this.x, this.y, this.width, this.height );
};
/**
 * isRectIn
 *
 * Check for the intersection of two rect objects
 *
 * @param (object) rect the other rect to test
 * @return (boolean) true is intersection, false if not
 */
Friend.Tree.Utilities.Rect.isRectIn = function ( rect )
{
	if ( this.x - this.width > rect.x - rect.hotSpotX )
	{
		if ( this.x < rect.x + rect.width )
		{
			if ( this.y + this.height > rect.y - rect.hotSpotY )
			{
				if ( this.y < rect.y + rect.height )
				{
					return true;
				}
			}
		}
	}
	return false;
};

/**
 * drawFilledTriangle
 *
 * Draw a triangle the size of the rectangle
 *
 * @param (object) context the drawing context
 * @param (string) direction of the triangle 'left', 'top', 'bottom', 'right'
 * @param (string) color color of the triangle
 */
Friend.Tree.Utilities.Rect.drawFilledTriangle = function ( flags, direction, color )
{
	flags.rendererItem.beginPath();
	switch ( direction )
	{
		case 'left':
			flags.rendererItem.moveTo( flags, this.x, this.y + this.height / 2 );
			flags.rendererItem.lineTo( flags, this.x + this.width, this.y );
			flags.rendererItem.lineTo( flags, this.x + this.width, this.y + this.height );
			break;
		case 'top':
			flags.rendererItem.moveTo( flags, this.x + this.width / 2, this.y );
			flags.rendererItem.lineTo( flags, this.x + this.width, this.y + this.height );
			flags.rendererItem.lineTo( flags, this.x, this.y + this.height );
			break;
		case 'right':
			flags.rendererItem.moveTo( flags, this.x + this.width, this.y + this.height / 2 );
			flags.rendererItem.lineTo( flags, this.x, this.y + this.height );
			flags.rendererItem.lineTo( flags, this.x, this.y );
			break;
		case 'bottom':
			flags.rendererItem.moveTo( flags, this.x + this.width / 2, this.y + this.height );
			flags.rendererItem.lineTo( flags, this.x, this.y );
			flags.rendererItem.lineTo( flags, this.x + this.width, this.y );
			break;
	}
	flags.rendererItem.closePath( flags);
	flags.rendererItem.setFillStyle( flags, color );
	flags.rendererItem.fill( flags );
};

Friend.Tree.Utilities.Rect.drawImage = function ( properties, image, hAlign, vAlign )
{
	var width = image.width;
	var height = image.height;
	if ( width > this.width )
	{
		ratio = this.width / image.width;
		width = this.width;
		height = image.height * ratio;
	}
	if ( height > this.height )
	{
		ratio = this.height / image.height;
		height = this.height;
		width = image.width * ratio;
	}

	var x, y;
    switch ( hAlign )
    {
    case 'left':
        x = this.x;
        break;
    case 'right':
        x = this.x + this.width - width;
        break;
    default:
        x = this.x + this.width / 2 - width / 2;
        break;
    }
    switch ( vAlign )
    {
    case 'top':
        y = this.y;
        break;
    case 'bottom':
        y = this.y + this.height - height;
        break;
    default:
        y = this.y + this.height / 2 - height / 2;
        break;
    }
	properties.rendererItem.drawImage( properties, image, x, y, width, height );
};

/**
 * drawText
 *
 * Draws a clipped text in the rectangle
 */
Friend.Tree.Utilities.Rect.drawText = function ( flags, text, font, color, hAlign, vAlign, size )
{
    // Clips to the rectangle
	flags.rendererItem.save();
	this.clip( flags );

    // Computes horizontal alignment
    var x, y;
    switch ( hAlign )
    {
    case 'left':
        x = this.x;
        break;
    case 'right':
    case 'end':
        x = this.x + this.width;
        break;
    default:
        hAlign = 'center';
        x = this.x + this.width / 2;
        break;
    }

    // Computes vertical alignment
    switch ( vAlign )
    {
    case 'top':
    case 'hanging':
        y = this.y;
        break;
    case 'bottom':
    case 'alphabetic':
        y = this.y + this.height;
        break;
    default:
        vAlign = 'middle';
        y = this.y + this.height / 2;
        break;
    }

    // Draw text
    flags.rendererItem.drawText( flags, x, y, text, font, color, hAlign, vAlign, size );

    // Restores renderer
    flags.rendererItem.restore( flags );
};


// Extracts the name a file from its path
Friend.Tree.Utilities.getFilenameFromPath = function( path )
{
	var position = path.lastIndexOf( '/' );
	if ( position < 0 )
		position = path.indexOf( ':' );
	return path.substring( position + 1 );
};	

// Extracts path from a file
Friend.Tree.Utilities.extractFriendPaths = function( source, tokens )
{
	if ( typeof tokens == 'undefined' )
	{
		tokens = 
		[
			'Progdir:',
			'System:',
			'Home:'
		];
	}
	var list = [];
	for ( var t = 0; t < tokens.length; t++ )
	{
		var token = tokens[ t ];
		var position = source.indexOf( token );
		while( position >= 0 )
		{
			var end = source.indexOf( '"', position );
			if ( end < 0 )
				end = source.indexOf( "'", position );
			if ( end > position )
			{
				list.push( source.substring( position, end ) );
				position = source.indexOf( token, position + 1 );
			}
		}
	}
	return list;
};

// Replace paths in a file
Friend.Tree.Utilities.replaceFriendPaths = function( source, replaceList )
{
	// Replacement loop
	for ( var r = 0; r < replaceList.length; r++ )
	{
		var replacement = replaceList[ r ];
		var start = source.indexOf( replacement.search );
		while ( start >= 0 )
		{
			var end = start + replacement.search.length;
			source = source.substring( 0, start ) + replacement.replace + source.substring( end );
			start = source.indexOf( replacement.search, end );
		}
	}
	return source;
};

Friend.Tree.Utilities.measureText = function( text, font )
{
	var canvas = document.createElement( 'canvas' );
	var context = canvas.getContext( '2d' );
	context.font = font;
	return context.measureText( text );
};
Friend.Tree.Utilities.getFontFamily = function( font )
{
	var pos = font.indexOf( 'px' );
	if ( pos >= 0 )
	{
		pos += 2;
		while( pos < font.length && font.charAt( pos ) == ' ' )
			pos++;
		if ( pos < font.length )
		{
			var start = pos;
			while( pos < font.length && font.charAt( pos ) != ' ' )
				pos++;	
			if ( pos > start )
				return font.substring( start, pos );
		}
	}
	return 'Arial';
};
Friend.Tree.Utilities.getFontSize = function( font )
{
	var px = font.indexOf( 'px' );
	return parseInt( font.substring( 0, px ), 10 );
};
Friend.Tree.Utilities.getFontWeight = function( font )
{
	var weights = [ 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900' ];
	for ( var w = 0; w < weights.length; w++ )
	{
		if ( font.indexOf( weights[ w ] ) >= 0 )
			return weigths[ w ];
	}
	return '';
};
Friend.Tree.Utilities.getFontStyle = function( font )
{
	var styles = [ 'normal', 'italic', 'oblique' ];
	for ( var s = 0; s < styles.length; s++ )
	{
		if ( font.indexOf( styles[ s ] ) >= 0 )
			return styles[ s ];
	}
	return 'normal';
};


// Good random number generator
/*
  I've wrapped Makoto Matsumoto and Takuji Nishimura's code in a namespace
  so it's better encapsulated. Now you can have multiple random number generators
  and they won't stomp all over eachother's state.
  
  If you want to use this as a substitute for Math.random(), use the random()
  method like so:
  
  var m = new MersenneTwister();
  var randomNumber = m.random();
  
  You can also call the other genrand_{foo}() methods on the instance.
  If you want to use a specific seed in order to get a repeatable random
  sequence, pass an integer into the constructor:
  var m = new MersenneTwister(123);
  and that will always produce the same random sequence.
  Sean McCullough (banksean@gmail.com)
*/

/* 
   A C-program for MT19937, with initialization improved 2002/1/26.
   Coded by Takuji Nishimura and Makoto Matsumoto.
 
   Before using, initialize the state by using init_genrand(seed)  
   or init_by_array(init_key, key_length).
 
   Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
   All rights reserved.                          
 
   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions
   are met:
 
     1. Redistributions of source code must retain the above copyright
        notice, this list of conditions and the following disclaimer.
 
     2. Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.
 
     3. The names of its contributors may not be used to endorse or promote 
        products derived from this software without specific prior written 
        permission.
 
   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
   LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
   A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
   CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
   EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
   PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
   PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
   LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
   NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 
 
   Any feedback is very welcome.
   http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
   email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
*/

Friend.Tree.Utilities.MersenneTwister = function(seed) 
{
	if (seed == undefined) 
	{
	  seed = new Date().getTime();
	} 
	/* Period parameters */  
	this.N = 624;
	this.M = 397;
	this.MATRIX_A = 0x9908b0df;   /* constant vector a */
	this.UPPER_MASK = 0x80000000; /* most significant w-r bits */
	this.LOWER_MASK = 0x7fffffff; /* least significant r bits */
   
	this.mt = new Array(this.N); /* the array for the state vector */
	this.mti=this.N+1; /* mti==N+1 means mt[N] is not initialized */
  
	this.init_genrand(seed);
};
/* initializes mt[N] with a seed */
Friend.Tree.Utilities.MersenneTwister.prototype.init_genrand = function(s) 
{
	this.mt[0] = s >>> 0;
	for (this.mti=1; this.mti<this.N; this.mti++) 
	{
		var s = this.mt[this.mti-1] ^ (this.mt[this.mti-1] >>> 30);
	 	this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253) + this.mti;
		/* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
		/* In the previous versions, MSBs of the seed affect   */
		/* only MSBs of the array mt[].                        */
		/* 2002/01/09 modified by Makoto Matsumoto             */
		this.mt[this.mti] >>>= 0;
		/* for >32 bit machines */
	}
};
   
/* initialize by an array with array-length */
/* init_key is the array for initializing keys */
/* key_length is its length */
/* slight change for C++, 2004/2/26 */
Friend.Tree.Utilities.MersenneTwister.prototype.init_by_array = function(init_key, key_length) 
{
	var i, j, k;
	this.init_genrand(19650218);
	i=1; j=0;
	k = (this.N>key_length ? this.N : key_length);
	for (; k; k--) {
	  var s = this.mt[i-1] ^ (this.mt[i-1] >>> 30)
	  this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1664525) << 16) + ((s & 0x0000ffff) * 1664525)))
		+ init_key[j] + j; /* non linear */
	  this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
	  i++; j++;
	  if (i>=this.N) { this.mt[0] = this.mt[this.N-1]; i=1; }
	  if (j>=key_length) j=0;
	}
	for (k=this.N-1; k; k--) {
	  var s = this.mt[i-1] ^ (this.mt[i-1] >>> 30);
	  this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1566083941) << 16) + (s & 0x0000ffff) * 1566083941))
		- i; /* non linear */
	  this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
	  i++;
	  if (i>=this.N) { this.mt[0] = this.mt[this.N-1]; i=1; }
	}
  
	this.mt[0] = 0x80000000; /* MSB is 1; assuring non-zero initial array */ 
};
   
/* generates a random number on [0,0xffffffff]-interval */
Friend.Tree.Utilities.MersenneTwister.prototype.genrand_int32 = function() 
{
	var y;
	var mag01 = new Array(0x0, this.MATRIX_A);
	/* mag01[x] = x * MATRIX_A  for x=0,1 */
  
	if (this.mti >= this.N) { /* generate N words at one time */
	  var kk;
  
	  if (this.mti == this.N+1)   /* if init_genrand() has not been called, */
		this.init_genrand(5489); /* a default initial seed is used */
  
	  for (kk=0;kk<this.N-this.M;kk++) {
		y = (this.mt[kk]&this.UPPER_MASK)|(this.mt[kk+1]&this.LOWER_MASK);
		this.mt[kk] = this.mt[kk+this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
	  }
	  for (;kk<this.N-1;kk++) {
		y = (this.mt[kk]&this.UPPER_MASK)|(this.mt[kk+1]&this.LOWER_MASK);
		this.mt[kk] = this.mt[kk+(this.M-this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
	  }
	  y = (this.mt[this.N-1]&this.UPPER_MASK)|(this.mt[0]&this.LOWER_MASK);
	  this.mt[this.N-1] = this.mt[this.M-1] ^ (y >>> 1) ^ mag01[y & 0x1];
  
	  this.mti = 0;
	}
  
	y = this.mt[this.mti++];
  
	/* Tempering */
	y ^= (y >>> 11);
	y ^= (y << 7) & 0x9d2c5680;
	y ^= (y << 15) & 0xefc60000;
	y ^= (y >>> 18);
  
	return y >>> 0;
};
   
/* generates a random number on [0,0x7fffffff]-interval */
Friend.Tree.Utilities.MersenneTwister.prototype.genrand_int31 = function() 
{
	return (this.genrand_int32()>>>1);
};

/* generates a random number on [0,1]-real-interval */
Friend.Tree.Utilities.MersenneTwister.prototype.genrand_real1 = function() 
{
	return this.genrand_int32()*(1.0/4294967295.0); 
	/* divided by 2^32-1 */ 
};

/* generates a random number on [0,1)-real-interval */
Friend.Tree.Utilities.MersenneTwister.prototype.random = function() 
{
	return this.genrand_int32()*(1.0/4294967296.0); 
	/* divided by 2^32 */
};

/* generates a random number on (0,1)-real-interval */
Friend.Tree.Utilities.MersenneTwister.prototype.genrand_real3 = function() 
{
	return (this.genrand_int32() + 0.5)*(1.0/4294967296.0); 
	/* divided by 2^32 */
};

/* generates a random number on [0,1) with 53-bit resolution*/
Friend.Tree.Utilities.MersenneTwister.prototype.genrand_res53 = function() 
{ 
	var a=this.genrand_int32()>>>5, b=this.genrand_int32()>>>6; 
	return(a*67108864.0+b)*(1.0/9007199254740992.0); 
};
/* These real versions are due to Isaku Wada, 2002/01/09 added */