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
 * Tree engine HTML Renderer
 * Renders all items in the document
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 02/03/2018
 */
Friend = window.Friend || {};
Friend.Renderers = Friend.Renderers || {};

Friend.Renderers.Renderer_Canvas2D = function( localProperties, globalProperties )
{
	//Object.assign( this, Friend.Renderers.Renderer_Canvas2D );

	this.tree = globalProperties.tree;
	this.name = 'Renderer_Canvas2D';
	this.className = 'Friend.Renderers.Renderer_Canvas2D';
	this.utilities = globalProperties.utilities;
	this.resources = globalProperties.resources;
	this.renderingId = false;
	this.utilities.setFlags( this, globalProperties );

	// Direct copy of properties, they are all set!
	Object.assign( this, localProperties );

	// Renderer variables
    this.pile = [];
    this.items = {};
    this.images = {};
	this.renderFlags = {};
	this.canvasses = {};
	this.pile = [];
	this.displayList = [];
	this.renderToList = {};
    if ( this.width == Friend.Tree.NOTDEFINED )
        this.width = this.tree.width;
    if ( this.height == Friend.Tree.NOTDEFINED )
        this.height = this.tree.height;
	this.refresh = true;	

	// Attach canvas
	if ( this.renderingId )
	{
		var element = document.getElementById( this.renderingId );
		this.canvas = document.createElement( 'canvas' );
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		element.appendChild( this.canvas );
		this.context = this.canvas.getContext( '2d' );
	}
};

// Default properties. Will be send on renderer creation
Friend.Renderers.Renderer_Canvas2D.defaultProperties =
{
	x: 0,
	y: 0,
	z: 0,
	width: Friend.Tree.NOTDEFINED,
	height: Friend.Tree.NOTDEFINED,
	defaultFont: '12px Verdana',
	antialias: true,
};

Friend.Renderers.Renderer_Canvas2D.prototype.resize = function( newWidth, newHeight, mode )
{
	this.canvas.width = newWidth;
	this.canvas.height = newHeight;
	this.refresh = true;
};

Friend.Renderers.Renderer_Canvas2D.prototype.changeExposed = function( info )
{
	switch ( info.id )
	{
        default:
            break;
	}
};
Friend.Renderers.Renderer_Canvas2D.prototype.getScreenCoordinates = function( item )
{
    return rendererItem.getVector();
}
Friend.Renderers.Renderer_Canvas2D.prototype.add = function( item, rendererItem )
{
	this.items[ item.identifier ] = rendererItem;
};
Friend.Renderers.Renderer_Canvas2D.prototype.clear = function()
{
	this.canvasses = {};
    this.renderFlags = {};
	this.images = {};
	this.pile = [];
	this.renderToList = {};
	for ( var i in this.items )
		this.items[ i ].destroy();
	this.items = {};
	this.clearDisplayList();
};
Friend.Renderers.Renderer_Canvas2D.prototype.refreshItem = function( item )
{
	if ( this.items[ item.identifier ] )
		this.items[ item.identifier ].doRefresh();
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

Friend.Renderers.Renderer_Canvas2D.prototype.startRenderTo = function( imageName, image )
{
	if ( !this.renderToList[ imageName ] )
		this.renderToList[ imageName ] = image;
};
Friend.Renderers.Renderer_Canvas2D.prototype.stopRenderTo = function( imageName )
{
	this.renderToList[ imageName ] = false;
	this.renderToList = this.utilities.cleanArray( this.renderToList );
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

Friend.Renderers.Renderer_Canvas2D.prototype.startDestroy = function()
{
};
Friend.Renderers.Renderer_Canvas2D.prototype.destroy = function( item )
{
	if ( this.items[ item.identifier ] )
	{
		this.items[ item.identifier ].destroy();
		this.items[ item.identifier ] = false;
	}
};
Friend.Renderers.Renderer_Canvas2D.prototype.endDestroy = function()
{
	this.items = this.utilities.cleanArray( this.items );
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

Friend.Renderers.Renderer_Canvas2D.prototype.setImage = function( srcImage, callback )
{
	callback( srcImage );
};
Friend.Renderers.Renderer_Canvas2D.prototype.getCanvas = function( id )
{
	var canvas = this.canvasses[ id ];
	if ( canvas )
		return canvas;
	return false;
};
Friend.Renderers.Renderer_Canvas2D.prototype.createCanvas = function( width, height, name, item, rendererItem, force )
{
	var id = item.identifier + '<>' + name;
	var canvas = this.canvasses[ id ];
	if ( !canvas || force  )
	{
		canvas = document.createElement( 'canvas' );
		canvas.treeName = name;
		canvas.treeRendererId = id;
		canvas.width = width;
		canvas.height = height;
		rendererItem.canvas = canvas;
		rendererItem.context = canvas.getContext( '2d' );
		this.canvasses[ id ] = canvas;
	}
	return canvas;
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

Friend.Renderers.Renderer_Canvas2D.prototype.setFontSize = function( font, size )
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

Friend.Renderers.Renderer_Canvas2D.prototype.getFontSize = function( font )
{
 	if ( typeof font == 'undefined' )
		font = this.defaultFont;
	var pos = font.indexOf( 'px' );
	if ( pos > 0 )
	{
		var end = pos--;
		while ( pos >= 0 && font.charAt( pos ) == ' ' )
			pos--;
		while ( pos >= 0 && font.charAt( pos ) != ' ' )
			pos--;
		pos++;
		return parseInt( font.substring( pos, end ), 10 );
	}
	return 16;
};
Friend.Renderers.Renderer_Canvas2D.prototype.addColor = function( color, modification, direction )
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

Friend.Renderers.Renderer_Canvas2D.prototype.measureText = function( text, font )
{
	var canvas = document.createElement( 'canvas' );
	var context = canvas.getContext( '2d' );
	if ( typeof font == 'undefined' )
		font = this.defaultFont;
	context.font = font;
	var coords = context.measureText( text );
	coords.height = this.getFontSize( font );
	return coords;
}

Friend.Renderers.Renderer_Canvas2D.prototype.updateItem = function( renderItem )
{
	if ( renderItem.rendererItem )
	{
		if ( renderItem.rendererItem )
			renderItem.rendererItem.needsUpdate = true;
	}
};
Friend.Renderers.Renderer_Canvas2D.prototype.resizeItem = function( renderItem, width, height )
{
	if ( renderItem.rendererItem )
	{
		renderItem.rendererItem.resize( width, height );
	}
};

///////////////////////////////////////////////////////////////////////////////
//
// Rendering process
//
///////////////////////////////////////////////////////////////////////////////

Friend.Renderers.Renderer_Canvas2D.prototype.getRenderFlags = function( extraFlags )
{
	var flags =
	{
		x: 0,
		y: 0,
		z: 0,
		offsetX: 0,
		offsetY: 0,
		renderer: this,
		zoomX: 1,
		zoomY: 1,
		rotation: 0,
		alpha: 1,
		xCenter: this.width / 2,
		yCenter: this.height / 2,
		perspective: 0
	};
	this.utilities.setFlags( flags, extraFlags );
	return flags;
};

Friend.Renderers.Renderer_Canvas2D.prototype.renderStart = function( properties )
{
};

Friend.Renderers.Renderer_Canvas2D.prototype.renderUp = function( properties, item )
{
	properties.item = item;

	// Nothing to draw (security)
	if ( !item.rendererType )
	{
        properties.rendererItem = false;
		this.pile.push( Object.assign( {}, properties ) );
        this.renderFlags[ item.identifier ] = Object.assign( {}, properties );
		properties = this.renderPrepare( properties, item );
		return properties;
	}

	// A refresh is needed
	properties.renderer.refresh = true;

	// Creates the renderingItem if it does not exist
	if ( !item.rendererItem )
	{
		item.rendererItem = new Friend.Renderers.Renderer_Canvas2D[ 'RendererItem' + item.rendererType ]( this, item, properties );
		item.rendererItem.renderItem = item;
		this.add( item, item.rendererItem );
		item.rendererItem.visible = true;
	}

	// Context = rendererItem
	properties.rendererItem = item.rendererItem;
	properties.context = properties.rendererItem;
	this.pile.push( Object.assign( {}, properties ) );
	this.renderFlags[ item.identifier ] = Object.assign( {}, properties );

	// Calculates coordinates
	properties = this.renderPrepare( properties, item );

	return properties;
};
Friend.Renderers.Renderer_Canvas2D.prototype.renderPrepare = function( properties, item )
{
	var xx = item.x;
	var yy = item.y;
	if ( !item.noOffsets )
	{
		xx += properties.offsetX;
		yy += properties.offsetY;
	}
	properties.offsetX = 0;
	properties.offsetY = 0;
	
	if ( !properties.noPerspective && !item.noPerspective )
	{
		// Calculates the x and y shift
		xx += ( xx - properties.xCenter ) * properties.perspective;
		yy += ( yy - properties.yCenter ) * properties.perspective;

		// Specific perspective for the children of the item?
		if ( item.perspective  )
		{
				properties.perspective = item.perspective;
			if ( typeof item.xCenter != 'undefined' )
				properties.xCenter = item.xCenter;
			if ( typeof item.yCenter != 'undefined' )
				properties.yCenter = item.yCenter;
		}
		if ( typeof item.noPerspective != 'undefined' )
			properties.noPerspective = item.noPerspective;
	}

	properties.x += Math.floor( xx ); 
	properties.y += Math.floor( yy );
	properties.xReal = properties.x;
	properties.yReal = properties.y;
	properties.z = item.z;
	properties.width = item.width;
	properties.height = item.height;
	item.rect.x = properties.x;
	item.rect.y = properties.y;
	item.rect.width = item.width;
	item.rect.height = item.height;
	item.thisRect.x = 0;
	item.thisRect.y = 0;
	item.thisRect.width = item.width;
	item.thisRect.height = item.height;
	if ( !item.noRotation )
        properties.rotation += item.rotation;
	else
        properties.rotation = 0;
	properties.zoomX *= item.zoomX;
    properties.zoomY *= item.zoomY;
	properties.alpha *= item.alpha;
	return properties;
};
Friend.Renderers.Renderer_Canvas2D.prototype.renderIt = function( properties, item )
{
	if ( properties.rendererItem )
	{
		// Visible or not?
		if ( item.visible != properties.rendererItem.visible )
        	properties.rendererItem.setVisible( item.visible );

		// Refreshes item if it has changed
		properties.rendererItem.update( properties );
	}
	return properties;
};
Friend.Renderers.Renderer_Canvas2D.prototype.renderDown = function( properties, item )
{
	item.refresh = false;
	return this.pile.pop();
};
Friend.Renderers.Renderer_Canvas2D.prototype.renderUpFast = function( properties, item )
{
	if ( this.renderFlags[ item.identifier ] )
	{
		properties = Object.assign( {}, this.renderFlags[ item.identifier ] );
		properties = this.renderPrepare( properties, item );
		return properties;
	}
	return false;
};
Friend.Renderers.Renderer_Canvas2D.prototype.renderDownFast = function( properties, item )
{
	item.refresh = false;
	return properties;
};
Friend.Renderers.Renderer_Canvas2D.prototype.renderEnd = function ()
{
	if ( this.context )
	{
		this.renderDisplayList( this.context );
		
		for ( var i in this.renderToList )
		{
			var image = this.renderToList[ i ];
			var context = image.getContext( '2d' );
			context.drawImage( this.canvas, 0, 0, image.width, image.height );
		}
	}

};
Friend.Renderers.Renderer_Canvas2D.prototype.postProcess = function( imageOrCanvas, item )
{
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// Display list
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
Friend.Renderers.Renderer_Canvas2D.prototype.clearDisplayList = function()
{
	this.displayList = [];
};
Friend.Renderers.Renderer_Canvas2D.prototype.appendChild = function( element )
{
	this.displayList.push( element );
};
Friend.Renderers.Renderer_Canvas2D.prototype.removeChild = function( element )
{
	for ( var d = 0; d < this.displayList.length; d++ )
	{
		if ( this.displayList[ d ] == element )
		{
			this.displayList.splice( d, 1 );
			break;
		}
	}
};
Friend.Renderers.Renderer_Canvas2D.prototype.renderDisplayList = function( context )
{
	// Sort the displaylist
	this.displayList = this.displayList.sort( function( a, b ) 
	{
		return a.z - b.z;
	} );

	// Display!
	for ( var d = 0; d < this.displayList.length; d++ )
	{
		var element = this.displayList[ d ];
		if ( element.visible )
		{
			context.globalAlpha = element.alpha;
			if ( element.angle == 0 )
				context.drawImage( element.image, 
								   element.x - element.hotSpotX, 
								   element.y - element.hotSpotY, 
					               element.width, element.height );
			else
			{
				context.save();
				context.translate( element.x, element.y );
				if ( element.angle != 0)
					context.rotate( -element.angle * 0.0174532925);	
				//context.scale( Math.max( 0.001, element.zoomX ), Math.max( 0.001, element.zoomY ) );
				context.translate( -element.hotSpotX, -element.hotSpotY );
				context.drawImage( element.image, 0, 0, element.width, element.height );
				context.restore();
			}
			element.refresh = false;
		}
	}
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// RendererItems
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


Friend.Renderers.Renderer_Canvas2D.RendererItemSprite = function( renderer, item, flags )
{
	Object.assign( this, Friend.Renderers.Renderer_Canvas2D.RendererItemSprite );
	this.renderer = renderer;
	this.item = item;
	this.name = item.name;
	this.className = 'Friend.Renderers.Renderer_Canvas2D.RendererItemSprite';
	this.utilities = this.renderer.utilities;
	this.resources = this.renderer.resources;
	this.width = false;
	this.height = false;
	this.utilities.setFlags( this, flags );

	// Adds the element
	this.element = 
	{
		image: null,
		x: 0,
		y: 0,
		z: 0,
		angle: 0,
		width: 0,
		height: 0,
		zoomX: 1,
		zoomY: 1,
		hotSpotX: 0,
		hotSpotY: 0,
		alpha: 1,
		visible: false,
		refresh: false
	};
	this.checkImage();

	this.renderer.appendChild( this.element );
    this.toRefresh = true;
}
Friend.Renderers.Renderer_Canvas2D.RendererItemSprite.reset = function()
{
	this.forceReset = true;
};
Friend.Renderers.Renderer_Canvas2D.RendererItemSprite.checkImage = function( z )
{
	if ( this.item.imageName && ( this.imageName != this.item.imageName || this.needsUpdate ) || this.forceReset )
	{
        this.image = this.resources.getImage( this.item.imageName );
        if ( this.image )
        {
			this.element.image = this.image;
            this.imageName = this.item.imageName;
			this.element.hotSpotX = this.image.hotSpotX;
			this.element.hotSpotY = this.image.hotSpotY;
       }
	}
};
Friend.Renderers.Renderer_Canvas2D.RendererItemSprite.update = function( properties )
{
	this.checkImage();
	this.element.x = properties.x;
	this.element.y = properties.y;
	this.element.z = properties.z;
	this.element.angle = properties.rotation;
	this.element.alpha = properties.alpha;
	this.element.visible = this.visible;
	this.element.width = properties.width;
	this.element.height = properties.height;
	this.element.refresh = true;
};
Friend.Renderers.Renderer_Canvas2D.RendererItemSprite.destroy = function( flags )
{
    this.renderer.removeChild( this.image );
};
Friend.Renderers.Renderer_Canvas2D.RendererItemSprite.setVisible = function( flag )
{
	this.visible = flag;
};
Friend.Renderers.Renderer_Canvas2D.RendererItemSprite.doRefresh = function( flags )
{
	this.toRefresh = true;
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_Canvas2D.RendererItemSprite.getVector = function()
{
    return { x: 0, y: 0 };
};
Friend.Renderers.Renderer_Canvas2D.RendererItemSprite.resize = function( width, height )
{
	if ( typeof width != 'undefined' )
		this.width = width;
	if ( typeof height != 'undefined' )
		this.height = height;
};






Friend.Renderers.Renderer_Canvas2D.RendererItemSprite3D = function( renderer, item, flags )
{
	Object.assign( this, Friend.Renderers.Renderer_Canvas2D.RendererItemSprite3D );
	this.renderer = renderer;
	this.item = item;
	this.name = item.name;
	this.className = 'Friend.Renderers.Renderer_Canvas2D.RendererItemSprite3D';
	this.utilities = this.renderer.utilities;
	this.resources = this.renderer.resources;
	this.width = false;
	this.height = false;
	this.utilities.setFlags( this, flags );
	this.layerList = {};
	this.maxLayers = 0;
    this.checkImages();    
    this.toRefresh = true;
}
Friend.Renderers.Renderer_Canvas2D.RendererItemSprite3D.reset = function()
{
	this.forceReset = true;
};
Friend.Renderers.Renderer_Canvas2D.RendererItemSprite3D.checkImages = function( zBase )
{
	var maxLayers = this.maxLayers;
	if ( !this.layerList[ this.item.imageName ] || this.imageName != this.item.imageName || this.forceReset )
	{
		this.forceReset = false;
		this.imageName = this.item.imageName;
		this.layerList[ this.item.imageName ] = [];
		
		// Removes the previous images from the document
		for ( var l = 0; l < this.layerList.length; l++ )
		{
			var layer = this.layerList[ l ];
			if ( layer && layer.element )
			{
				layer.element = false;
				this.renderer.removeChild( layer.element );
			}
		}	
		
		// Creates the new ones
		var imageList = this.resources.getImage( this.item.imageName, this.item );
		for ( var z = 0; z < imageList.images.length; z ++ )
		{
			var image = this.resources.getImage( imageList.images[ z ].name );

			// Adds to renderer the first time
			this.added = true;
			var element = 
			{
				image: image,
				x: 0,
				y: 0,
				z: 0,
				angle: 0,
				width: image.width,
				height: image.height,
				zoomX: 1,
				zoomY: 1,
				hotSpotX: image.hotSpotX,
				hotSpotY: image.hotSpotY,
				alpha: 1,
				visible: false,
				refresh: false
			}
			var layer =
			{
				element: element,
				width: image.width,
				height: image.height,
				z: z
			};
			if ( z == 0 )
			{
				this.width = image.width;
				this.height = image.height;
			}

			// Add to renderer
			this.renderer.appendChild( element );
	
			// Add to tables
			this.layerList[ this.item.imageName ].push( layer );
			this.maxLayers = Math.max( this.maxLayers, z );
		}
	}
	if ( this.maxLayers < maxLayers )
	{
		for ( z = this.maxLayers; z < this.maxLayers; z++ )
		{
			var layer = this.layerList[ z ];			
			if ( layer.element )
			{
				this.renderer.removeChild( layer.element );
				layer.element = false;
			}
		}
	}
	return this.layerList[ this.item.imageName ];
}
Friend.Renderers.Renderer_Canvas2D.RendererItemSprite3D.update = function( properties )
{
	this.checkImages();
	var z = 0;
	var layerList = this.layerList[ this.item.imageName ];
	if ( layerList )
	{
		// All the layers one above the other by changing the Z order up, and adding perspective
		for ( z = 0; z < layerList.length && z < this.maxLayers; z++ )
		{
			var layer = layerList[ z ];
			var deltaX = ( ( properties.x - properties.xCenter ) * z * properties.perspective ) * properties.zoomX;
			var deltaY = ( ( properties.y - properties.yCenter ) * z * properties.perspective ) * properties.zoomY;

			var element = layer.element;
			element.x = properties.x + deltaX;
			element.y = properties.y + deltaY;
			element.z = properties.z + 0.1 * z;
			element.with = properties.width;
			element.height = properties.height;
			element.zoomX = properties.zoomX;
			element.zoomY = properties.zoomY;
			element.alpha = properties.alpha;
			element.angle = properties.rotation;
			element.visible = this.visible;
			element.refresh = true;
		}
	}
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_Canvas2D.RendererItemSprite3D.destroy = function( properties )
{
	// All the layers one above the other by changing the Z order up, and adding perspective
	for ( image in this.layerList )
	{
		var layerList = this.layerList[ image ];
		for ( z = 0; z < layerList.length; z++ )
		{
			if ( layerList[ z ].element )	
				this.renderer.removeChild( layerList[ z ].element );
		}
	}
};
Friend.Renderers.Renderer_Canvas2D.RendererItemSprite3D.setVisible = function( properties )
{
	this.visible = flag;
};
Friend.Renderers.Renderer_Canvas2D.RendererItemSprite3D.doRefresh = function( properties )
{
	this.toRefresh = true;
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_Canvas2D.RendererItemSprite3D.getVector = function()
{
    return { x: 0, y: 0 };
};
Friend.Renderers.Renderer_Canvas2D.RendererItemSprite3D.resize = function( width, height )
{
	if ( typeof width != 'undefined' )
		this.width = width;
	if ( typeof height != 'undefined' )
		this.height = height;
};



Friend.Renderers.Renderer_Canvas2D.RendererItemMap = function( renderer, item, flags )
{
	Object.assign( this, Friend.Renderers.Renderer_Canvas2D.RendererItemMap );
	this.renderer = renderer;
	this.item = item;
	this.name = item.name;
	this.className = 'Friend.Renderers.Renderer_Canvas2D.RendererItemMap';
	this.utilities = this.renderer.utilities;
	this.resources = this.renderer.resources;
	this.utilities.setFlags( this, flags );

	this.tileWidth = this.item.tileWidth;
	this.tileHeight = this.item.tileHeight;
	this.mapWidth = this.item.mapWidth;
	this.mapHeight = this.item.mapHeight;
	this.tileCount = 0;
	this.reset();
	return this;
}
Friend.Renderers.Renderer_Canvas2D.RendererItemMap.update = function( properties )
{
	var offsetX = this.item.offsetX;
	var offsetY = this.item.offsetY;

	var xx = properties.x - offsetX * properties.zoomX;
	var yy = properties.y - offsetY * properties.zoomY;

	// Position the background
	this.backgroundCanvas.z = properties.z;
    this.backgroundCanvas.x = xx;
    this.backgroundCanvas.y = yy;
    this.backgroundCanvas.alpha = properties.alpha;
    this.backgroundCanvas.visible = this.visible;		

	// Position the animated sprites. TODO: clipping and culling!
	for ( var y in this.sprites )
	{
		for ( var x in this.sprites[ y ] )
		{
			var spriteDefinition = this.sprites[ y ][ x ];
			for ( var z = 0; z < spriteDefinition.length; z++ )
			{
				var element = spriteDefinition[ z ];	
				var x1 = xx + x * this.tileWidth;
				var y1 = yy + y * this.tileHeight;
				x1 += ( x1 - properties.xCenter ) * properties.perspective * z;
				y1 += ( y1 - properties.yCenter ) * properties.perspective * z;
				element.x = x1;
				element.y = y1;
				element.z = properties.z + 0.1 + z * 0.1;
				element.alpha = properties.alpha;
				element.visible = this.visible;		
			}
		}
	}
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_Canvas2D.RendererItemMap.destroy = function( flags )
{
	this.renderer.removeChild( this.backgroundCanvas );
	for ( var s = 0; s < this.spriteList.length; s++ )
	{
		this.renderer.removeChild( this.spriteList[ s ] );
	}
};
Friend.Renderers.Renderer_Canvas2D.RendererItemMap.setVisible = function( flag )
{
	if ( this.visible != flag )
	{
		this.visible = flag;
	}
};
Friend.Renderers.Renderer_Canvas2D.RendererItemMap.doRefresh = function()
{
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_Canvas2D.RendererItemMap.getVector = function()
{
	var position = new THREE.Vector3();
	return position.getPositionFromMatrix( this.backgroundSprite.matrixWorld );
};
Friend.Renderers.Renderer_Canvas2D.RendererItemMap.reset = function()
{
	// Computes the tiles definition
	this.tiles = [];
    for ( var i = 0; i < this.item.tiles.length; i ++ )
    {
		var tile = this.item.tiles[ i ];
		var tileDefinition = {};
		if ( tile.imageName )
		{
			var image = this.resources.getImage( tile.imageName );
			tileDefinition.width = image.width;
			tileDefinition.height = image.height;
			tileDefinition.imageName = tile.imageName;
		}
		else if ( tile.images )
		{
			tileDefinition.images = [];
			for ( var ii = 0; ii < tile.images.length; ii++ )
			{
				var image = this.resources.getImage( tile.images[ ii ].imageName );
				var def =
				{
					imageName: tile.images[ ii ].imageName,
					width: image.width,
					height: image.height,
					hotSpotX: image.hotSpotX,
					hotSpotY: image.hotSpotY,
					z: ii
				};
				tileDefinition.images.push( def );
			}
		}
		this.tiles.push( tileDefinition );
	}

	// Creates the static ground layer canvas
	this.width = this.mapWidth * this.tileWidth;
	this.height = this.mapHeight * this.tileHeight;
	var backgroundCanvas = this.renderer.createCanvas( this.width, this.height, 'mapBackground', this.item, this );

	// Draw the background if defined
	if ( this.item.background )
	{
		var backImage = this.resources.getImage( this.item.background, this.item );
		var repeatX = Math.floor( ( this.mapWidth * this.tileWidth ) / backImage.width ) + 1;
		var repeatY = Math.floor( ( this.mapHeight * this.tileHeight ) / backImage.height ) + 1;
		for ( var x = 0; x < repeatX; x++ )
		{
			for ( var y = 0; y < repeatY; y++ )
			{
				this.context.drawImage( backImage, x * backImage.width, y * backImage.height, backImage.width, backImage.height );
			}
		}
	}

	// Creates the background 
	this.backgroundCanvas = 
	{
		image: backgroundCanvas,
		x: 0,
		y: 0,
		z: 0,
		angle: 0,
		zoomX: 1,
		zoomY: 1,
		hotSpotX: 0,
		hotSpotY: 0,
		alpha: 1,
		visible: false,
		refresh: false
	}
	this.renderer.appendChild( this.backgroundCanvas );

	// Draw the tiles, and creates the animated sprites columns
	this.map = this.item.map;
	this.sprites = [];
	this.spriteList = [];
	var x = 0;
	var y = 0;
    for ( var y = 0; y < this.map.length; y++ )
    {
		for ( var x = 0; x < this.map[ y ].length; x++ )
		{
			var tileNumber = this.map[ y ][ x ];
			if ( tileNumber >= 0 )
			{
				if ( this.tiles[ tileNumber ] )
				{
					var tile = this.tiles[ tileNumber ];
					if ( tile.imageName )
					{
						var image = this.resources.getImage( tile.imageName );

						// A single image, draw into background
						this.context.drawImage( image, x * this.tileWidth, y * this.tileHeight );
					}
					else
					{						
						// Animated tile, creates the column of sprites
						for ( var m = 0; m < tile.images.length; m++ )
						{
							if ( !this.sprites[ y ] )
								this.sprites[ y ] = {};
							if ( !this.sprites[ y ][ x ] )
								this.sprites[ y ][ x ] = [];
							
							var image = this.resources.getImage( tile.images[ m ].imageName );
							var spriteDefinition = 
							{
								image: image,
								x: 0,
								y: 0,
								z: 0,
								angle: 0,
								zoomX: 1,
								zoomY: 1,
								hotSpotX: 0,
								hotSpotY: 0,
								alpha: 1,
								width: image.width,
								height: image.height,
								visible: false,
								refresh: false
							}
							this.sprites[ y ][ x ].push( spriteDefinition );
							this.spriteList.push( spriteDefinition );
							this.renderer.appendChild( spriteDefinition );				
						}
					}
				}
				else
				{
					this.renderer.error( 'Map ' + this.item.identifier + ' error: tile not defined X ' + x + ', Y ' + y + ', Value ' + tileNumber );
				}
			}
		}
	}
};
Friend.Renderers.Renderer_Canvas2D.RendererItemMap.resize = function( width, height )
{
};






Friend.Renderers.Renderer_Canvas2D.RendererItemCanvas = function( renderer, item, flags )
{
	Object.assign( this, Friend.Renderers.Renderer_Canvas2D.RendererItemCanvas );
	Object.assign( this, Friend.Renderers.Utilities.Canvas2D );
	this.renderer = renderer;
	this.item = item;
	this.name = item.name;
	this.className = 'Friend.Renderers.Renderer_Canvas2D.RendererItemCanvas';
	this.utilities = this.renderer.utilities;
	this.resources = this.renderer.resources;
	this.width = false;
	this.height = false;
	this.utilities.setFlags( this, flags );
	this.width = this.item.width;
	this.height = this.item.height;
	this.canvas = this.renderer.createCanvas( this.item.width, this.item.height, 'canvasItem', this.item, this );
	this.element = 
	{
		image: this.canvas,
		x: 0,
		y: 0,
		z: 0,
		angle: 0,
		zoomX: 1,
		zoomY: 1,
		hotSpotX: 0,
		hotSpotY: 0,
		width: this.item.width,
		height: this.item.height,
		alpha: 1,
		visible: false,
		refresh: false
	}
	this.renderer.appendChild( this.element );
    this.toRefresh = true;
}
Friend.Renderers.Renderer_Canvas2D.RendererItemCanvas.reset = function()
{
	this.forceReset = true;
};

Friend.Renderers.Renderer_Canvas2D.RendererItemCanvas.update = function( properties )
{
    this.element.x = properties.x;
	this.element.y = properties.y;
	this.element.z = properties.z;
	this.element.width = properties.width;
	this.element.height = properties.height;
	this.element.angle = properties.rotation;
    this.element.alpha = properties.alpha;
	this.element.visible = this.visible;
	this.element.refresh = true;
};
Friend.Renderers.Renderer_Canvas2D.RendererItemCanvas.destroy = function( flags )
{
    this.renderer.removeChild( this.element );
};
Friend.Renderers.Renderer_Canvas2D.RendererItemCanvas.setVisible = function( flag )
{
	this.visible = flag;
};
Friend.Renderers.Renderer_Canvas2D.RendererItemCanvas.doRefresh = function( flags )
{
	this.toRefresh = true;
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_Canvas2D.RendererItemCanvas.getVector = function()
{
    return { x: 0, y: 0 };
};
Friend.Renderers.Renderer_Canvas2D.RendererItemCanvas.resize = function( width, height )
{
	if ( typeof width != 'undefined' )
	{
		this.canvas.width = width;
		this.width = width;
		this.element.width = width;
	}
	if ( typeof height != 'undefined' )
	{
		this.canvas.height = height;
		this.height = height;
		this.element.height = height;
	}
};
