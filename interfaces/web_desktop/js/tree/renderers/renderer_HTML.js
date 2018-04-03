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
 * Tree engine HTML Renderer
 * Renders all items in the document
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 02/03/2018
 */
Friend = window.Friend || {};
Friend.Renderers = Friend.Renderers || {};

Friend.Renderers.Renderer_HTML = function( localProperties, globalProperties )
{
	this.tree = globalProperties.tree;
	this.name = 'Renderer_HTML';
	this.className = 'Friend.Renderers.Renderer_HTML';
	this.utilities = globalProperties.utilities;
	this.resources = globalProperties.resources;
	this.utilities.setFlags( this, globalProperties );

	// Direct copy of properties, they are all set!
	Object.assign( this, localProperties );

	// Makes sure all functions are defined (?)
	Object.assign( this, Friend.Renderers.Renderer_HTML );

	// Renderer variables
    this.pile = [];
    this.items = {};
    this.images = {};
	this.renderFlags = {};
	this.canvasses = {};
	this.pile = [];
    if ( this.width == Friend.Tree.NOTDEFINED )
        this.width = this.tree.width;
    if ( this.height == Friend.Tree.NOTDEFINED )
        this.height = this.tree.height;
	this.refresh = true;	
};

// Default properties. Will be send on renderer creation
Friend.Renderers.Renderer_HTML.defaultProperties =
{
	x: 0,
	y: 0,
	z: 0,
	width: Friend.Tree.NOTDEFINED,
	height: Friend.Tree.NOTDEFINED,
	defaultFont: '12px Verdana',
	antialias: true,
	resize:
	{
		mode: 'keepProportions',
		borderColor: 0xFF0000
	}
};

Friend.Renderers.Renderer_HTML.resize = function( width, height )
{
	this.width = width;
	this.height = height;
};

Friend.Renderers.Renderer_HTML.changeExposed = function( info )
{
	switch ( info.id )
	{
        default:
            break;
	}
};
Friend.Renderers.Renderer_HTML.getScreenCoordinates = function( item )
{
    return rendererItem.getVector();
}
Friend.Renderers.Renderer_HTML.startRenderTo = function( name, flags )
{
};
Friend.Renderers.Renderer_HTML.stopRenderTo = function( id )
{
};
Friend.Renderers.Renderer_HTML.add = function( item, rendererItem )
{
	this.items[ item.identifier ] = rendererItem;
};
Friend.Renderers.Renderer_HTML.clear = function()
{
	this.canvasses = {};
    this.renderFlags = {};
	this.images = {};
	this.pile = [];
	for ( var i in this.items )
		this.items[ i ].destroy();
	this.items = {};
};
Friend.Renderers.Renderer_HTML.refreshItem = function( item )
{
	if ( this.items[ item.identifier ] )
		this.items[ item.identifier ].doRefresh();
};
Friend.Renderers.Renderer_HTML.startDestroy = function()
{
};
Friend.Renderers.Renderer_HTML.destroy = function( item )
{
	if ( this.items[ item.identifier ] )
	{
        this.deleteItemImages( item );
		this.items[ item.identifier ].destroy();
		this.items[ item.identifier ] = false;
	}
};
Friend.Renderers.Renderer_HTML.endDestroy = function()
{
	this.items = this.utilities.cleanArray( this.items );
};
Friend.Renderers.Renderer_HTML.setImage = function( srcImage, callback )
{
	callback( srcImage );
};
Friend.Renderers.Renderer_HTML.getCanvasFromImage = function( name, item, qualifier )
{
	// Get the id of image
	var id = item.identifier;
	if ( qualifier )
		id = name + qualifier;

    // Already defined?
    if ( !this.images[ id ] )
        this.images[ id ] = {};
    if ( this.images[ id ][ name ] )
        return this.images[ id ][ name ];

    // Creates a local copy of the image
    var image = this.resources.getImage( name );
    if ( image )
    {
        var canvas = document.createElement( 'canvas' );
        canvas.width = image.width;
        canvas.height = image.height;
        var context = canvas.getContext( '2d' );
        context.drawImage( image, 0, 0 );
        this.images[ item.identifier ][ name ] = canvas;
        return canvas;
    }
    return null;
};
Friend.Renderers.Renderer_HTML.deleteItemImages = function( item )
{
    if ( this.images[ item.identifier ] )
    {
        this.images[ item.identifier ] = false;
        this.images = this.utilities.cleanArray( this.images );
    }
};
Friend.Renderers.Renderer_HTML.getCanvas = function( id )
{
	var canvas = this.canvasses[ id ];
	if ( canvas )
		return canvas;
	return false;
};
Friend.Renderers.Renderer_HTML.createCanvas = function( width, height, name, item, rendererItem, force )
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

Friend.Renderers.Renderer_HTML.setFontSize = function( font, size )
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

Friend.Renderers.Renderer_HTML.getFontSize = function( font )
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
Friend.Renderers.Renderer_HTML.addColor = function( color, modification, direction )
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

Friend.Renderers.Renderer_HTML.measureText = function( text, font )
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


Friend.Renderers.Renderer_HTML.updateItem = function( item )
{
	if ( item.rendererItems )
	{
		var rendererItem = item.rendererItems[ this.className ];
		if ( rendererItem )
			rendererItem.needsUpdate = true;
	}
};
Friend.Renderers.Renderer_HTML.resizeItem = function( item, width, height )
{
	if ( item.rendererItems )
	{
		var rendererItem = item.rendererItems[ this.className ];
		if ( rendererItem )
			rendererItem.onResize( width, height );
	}
};

///////////////////////////////////////////////////////////////////////////////
//
// Rendering process
//
///////////////////////////////////////////////////////////////////////////////

Friend.Renderers.Renderer_HTML.getRenderFlags = function( extraFlags )
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

Friend.Renderers.Renderer_HTML.renderStart = function( properties )
{
};

Friend.Renderers.Renderer_HTML.renderUp = function( properties, item )
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
	if ( !item.rendererItems )
		item.rendererItems = {};
	properties.rendererItem = item.rendererItems[ this.className ];
	if ( !properties.rendererItem )
	{
		properties.rendererItem = new Friend.Renderers.Renderer_HTML[ 'RendererItem' + item.rendererType ]( this, item, properties );
		item.rendererItems[ this.className ] = properties.rendererItem;
		this.add( item, properties.rendererItem );
		properties.rendererItem.visible = true;
	}

	// Context = rendererItem
	properties.context = properties.rendererItem;
	this.pile.push( Object.assign( {}, properties ) );
	this.renderFlags[ item.identifier ] = Object.assign( {}, properties );

	// Calculates coordinates
	properties = this.renderPrepare( properties, item );

	return properties;
};
Friend.Renderers.Renderer_HTML.renderPrepare = function( properties, item )
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

	if ( !properties.noPerspective )
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

	properties.x += Math.floor( xx ) 
	properties.y += Math.floor( yy );
	properties.z = item.z;
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
Friend.Renderers.Renderer_HTML.renderIt = function( properties, item )
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
Friend.Renderers.Renderer_HTML.renderDown = function( properties, item )
{
	item.refresh = false;
	return this.pile.pop();
};
Friend.Renderers.Renderer_HTML.renderUpFast = function( properties, item )
{
	if ( this.renderFlags[ item.identifier ] )
	{
		properties = Object.assign( {}, this.renderFlags[ item.identifier ] );
		properties = this.renderPrepare( properties, item );
		return properties;
	}
	return false;
};
Friend.Renderers.Renderer_HTML.renderDownFast = function( properties, item )
{
	item.refresh = false;
	return properties;
};
Friend.Renderers.Renderer_HTML.renderEnd = function ()
{
};
Friend.Renderers.Renderer_HTML.postProcess = function( imageOrCanvas, item )
{
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

Friend.Renderers.Renderer_HTML.RendererItemDiv = function( renderer, item, flags )
{
	Object.assign( this, Friend.Renderers.Renderer_HTML.RendererItemDiv );
	this.renderer = renderer;
	this.item = item;
	this.name = item.name;
	this.className = 'Friend.Renderers.Renderer_HTML.RendererItemDiv';
	this.utilities = this.renderer.utilities;
	this.resources = this.renderer.resources;
	this.width = false;
	this.height = false;
	this.utilities.setFlags( this, flags );
	this.div = document.createElement( 'div' );
	this.div.innerHTML = item.HTML;
	this.div.style.position = 'absolute';
	this.div.style.zIndex = this.item.z;
	this.div.style.visibility = 'hidden';
	document.body.appendChild( this.div );        
	this.checkHTML();
	this.toRefresh = true;
}
Friend.Renderers.Renderer_HTML.RendererItemDiv.reset = function()
{
	this.forceReset = true;
};
Friend.Renderers.Renderer_HTML.RendererItemDiv.checkHTML = function( z )
{
	if ( this.item.HTML && ( this.HTML != this.item.HTML || this.needsUpdate ) || this.forceReset )
	{
		this.HTML = this.item.HTML;
		this.div.innerHTML = this.item.HTML;
	}
};
Friend.Renderers.Renderer_HTML.RendererItemDiv.update = function( properties )
{
	this.div.style.zIndex = properties.z;
    this.div.style.left = Math.floor( properties.x ) + 'px';
    this.div.style.top = Math.floor( properties.y ) + 'px';
    this.div.style.width = Math.floor( this.item.width ) + 'px';
    this.div.style.height = Math.floor( this.item.height ) + 'px';
    this.div.style.opacity = properties.alpha.toString();
    this.div.style.visibility = this.visible ? 'visible' : 'hidden';		
};
Friend.Renderers.Renderer_HTML.RendererItemDiv.destroy = function( flags )
{
    document.body.removeChild( this.div );
};
Friend.Renderers.Renderer_HTML.RendererItemDiv.setVisible = function( flag )
{
	this.visible = flag;
};
Friend.Renderers.Renderer_HTML.RendererItemDiv.doRefresh = function( flags )
{
	this.toRefresh = true;
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_HTML.RendererItemDiv.getVector = function()
{
    return { x: 0, y: 0 };
};

Friend.Renderers.Renderer_HTML.RendererItemElement = function( renderer, item, flags )
{
	Object.assign( this, Friend.Renderers.Renderer_HTML.RendererItemElement );
	this.renderer = renderer;
	this.item = item;
	this.name = item.name;
	this.className = 'Friend.Renderers.Renderer_HTML.RendererItemElement';
	this.utilities = this.renderer.utilities;
	this.resources = this.renderer.resources;
	this.width = false;
	this.height = false;
	this.utilities.setFlags( this, flags );
	this.element = item.element;
	document.body.appendChild( this.element );        
    this.toRefresh = true;
}
Friend.Renderers.Renderer_HTML.RendererItemElement.reset = function()
{
	this.forceReset = true;
};
Friend.Renderers.Renderer_HTML.RendererItemElement.update = function( properties )
{
	this.element.style.zIndex = properties.z;
    this.element.style.left = Math.floor( properties.x ) + 'px';
    this.element.style.top = Math.floor( properties.y ) + 'px';
    this.element.style.width = Math.floor( this.item.width ) + 'px';
    this.element.style.height = Math.floor( this.item.height ) + 'px';
    this.element.style.opacity = properties.alpha.toString();
    this.element.style.visibility = this.visible ? 'visible' : 'hidden';		
};
Friend.Renderers.Renderer_HTML.RendererItemElement.destroy = function( flags )
{
    document.body.removeChild( this.element );
};
Friend.Renderers.Renderer_HTML.RendererItemElement.setVisible = function( flag )
{
	this.visible = flag;
};
Friend.Renderers.Renderer_HTML.RendererItemElement.doRefresh = function( flags )
{
	this.toRefresh = true;
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_HTML.RendererItemElement.getVector = function()
{
    return { x: 0, y: 0 };
};



Friend.Renderers.Renderer_HTML.RendererItemSprite = function( renderer, item, flags )
{
	Object.assign( this, Friend.Renderers.Renderer_HTML.RendererItemSprite );
	this.renderer = renderer;
	this.item = item;
	this.name = item.name;
	this.className = 'Friend.Renderers.Renderer_HTML.RendererItemSprite';
	this.utilities = this.renderer.utilities;
	this.resources = this.renderer.resources;
	this.width = false;
	this.height = false;
	this.utilities.setFlags( this, flags );
    this.checkImage();    
    this.toRefresh = true;
}
Friend.Renderers.Renderer_HTML.RendererItemSprite.reset = function()
{
	this.forceReset = true;
};
Friend.Renderers.Renderer_HTML.RendererItemSprite.checkImage = function( z )
{
	if ( this.item.imageName && ( this.imageName != this.item.imageName || this.needsUpdate ) || this.forceReset )
	{
        var canvas = this.renderer.getCanvasFromImage( this.item.imageName, this.item );
        if ( canvas )
        {
            // Removes from document
            if ( this.canvas )
                document.body.removeChild( this.canvas );

            // Change image
            this.canvas = canvas;
            this.imageName = this.item.imageName;
            this.width = this.canvas.width;
            this.height = this.canvas.height;

            // Put new one in document
            this.canvas.style.position = 'absolute';
            this.canvas.style.visibility = 'hidden';
            document.body.appendChild( this.canvas );        
       }
	}
};
Friend.Renderers.Renderer_HTML.RendererItemSprite.update = function( properties )
{
	this.canvas.style.zIndex = properties.z;
    this.canvas.style.left = Math.floor( properties.x ) + 'px';
    this.canvas.style.top = Math.floor( properties.y ) + 'px';
    this.canvas.style.width = Math.floor( this.width ) + 'px';
    this.canvas.style.height = Math.floor( this.height ) + 'px';
    this.canvas.style.opacity = properties.alpha.toString();
    this.canvas.style.visibility = this.visible ? 'visible' : 'hidden';		
};
Friend.Renderers.Renderer_HTML.RendererItemSprite.destroy = function( flags )
{
    document.body.removeChild( this.canvas );
};
Friend.Renderers.Renderer_HTML.RendererItemSprite.setVisible = function( flag )
{
	this.visible = flag;
};
Friend.Renderers.Renderer_HTML.RendererItemSprite.doRefresh = function( flags )
{
	this.toRefresh = true;
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_HTML.RendererItemSprite.getVector = function()
{
    return { x: 0, y: 0 };
};
Friend.Renderers.Renderer_HTML.RendererItemSprite.onResize = function( width, height )
{
};






Friend.Renderers.Renderer_HTML.RendererItemSprite3D = function( renderer, item, flags )
{
	Object.assign( this, Friend.Renderers.Renderer_HTML.RendererItemSprite3D );
	this.renderer = renderer;
	this.item = item;
	this.name = item.name;
	this.className = 'Friend.Renderers.Renderer_HTML.RendererItemSprite3D';
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
Friend.Renderers.Renderer_HTML.RendererItemSprite3D.reset = function()
{
	this.forceReset = true;
};
Friend.Renderers.Renderer_HTML.RendererItemSprite3D.checkImages = function( zBase )
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
				document.body.removeChild( layer.element );
			}
		}

		// Creates the new ones
		var imageList = this.resources.getImage( this.item.imageName, this.item );
		for ( var z = 0; z < imageList.images.length; z ++ )
		{
			var image = this.renderer.getCanvasFromImage( imageList.images[ z ].name, this.item );
			var layer =
			{
				element: image,
				width: image.width,
				height: image.height,
				z: z
			};
			if ( z == 0 )
			{
				this.width = image.width;
				this.height = image.height;
			}

			// Adds to document
			image.style.position = 'absolute';
			image.style.visibility = 'hidden';
			document.body.appendChild( image );

			//Add to table
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
				document.body.removeChild( layer.element );
				layer.element = false;
			}
		}
	}
	return this.layerList[ this.item.imageName ];
}
Friend.Renderers.Renderer_HTML.RendererItemSprite3D.update = function( properties )
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
			layer.element.style.left = properties.x + deltaX + 'px';
			layer.element.style.top = properties.y + deltaY + 'px';
			layer.element.style.zIndex = properties.z + z;
			layer.element.style.width = Math.floor( layer.width * properties.zoomX ) + 'px';
			layer.element.style.height = Math.floor( layer.height * properties.zoomY ) + 'px';
			layer.element.style.opacity = properties.alpha.toString();
			layer.element.style.visibility = this.visible ? 'visible' : 'hidden';		
		}
	}
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_HTML.RendererItemSprite3D.destroy = function( properties )
{
	// All the layers one above the other by changing the Z order up, and adding perspective
	for ( image in this.layerList )
	{
		var layerList = this.layerList[ image ];
		for ( z = 0; z < layerList.length; z++ )
		{
			if ( layerList[ z ].element )	
				document.body.removeChild( layerList[ z ].element );
		}
	}
};
Friend.Renderers.Renderer_HTML.RendererItemSprite3D.setVisible = function( properties )
{
	this.visible = flag;
};
Friend.Renderers.Renderer_HTML.RendererItemSprite3D.doRefresh = function( properties )
{
	this.toRefresh = true;
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_HTML.RendererItemSprite3D.getVector = function()
{
    return { x: 0, y: 0 };
};
Friend.Renderers.Renderer_HTML.RendererItemSprite3D.onResize = function( width, height )
{
};



Friend.Renderers.Renderer_HTML.RendererItemMap = function( renderer, item, flags )
{
	Object.assign( this, Friend.Renderers.Renderer_HTML.RendererItemMap );
	this.renderer = renderer;
	this.item = item;
	this.name = item.name;
	this.className = 'Friend.Renderers.Renderer_HTML.RendererItemMap';
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
Friend.Renderers.Renderer_HTML.RendererItemMap.update = function( properties )
{
	var offsetX = this.item.offsetX;
	var offsetY = this.item.offsetY;

	var xx = properties.x - offsetX * properties.zoomX;
	var yy = properties.y - offsetY * properties.zoomY;

	// Position the background
	this.backgroundCanvas.style.zIndex = '' + properties.z;
    this.backgroundCanvas.style.left = Math.floor( xx ) + 'px';
    this.backgroundCanvas.style.top = Math.floor( yy ) + 'px';
    this.backgroundCanvas.style.width = Math.floor( this.backgroundCanvas.width * properties.zoomX ) + 'px';
    this.backgroundCanvas.style.height = Math.floor( this.backgroundCanvas.height * properties.zoomY ) + 'px';
    this.backgroundCanvas.style.opacity = properties.alpha.toString();
    this.backgroundCanvas.style.visibility = this.visible ? 'visible' : 'hidden';		

	// Position the animated sprites. TODO: clipping and culling!
	for ( var y in this.sprites )
	{
		for ( var x in this.sprites[ y ] )
		{
			var spriteDefinition = this.sprites[ y ][ x ];
			for ( var z = 0; z < spriteDefinition.length; z++ )
			{
				var pDefinition = spriteDefinition[ z ];
				var element = spriteDefinition[ z ].element;

				var x1 = x * this.tileWidth;
				var y1 = y * this.tileHeight;
				x1 += ( x1 - properties.xCenter ) * properties.perspective * z;
				y1 += ( y1 - properties.yCenter ) * properties.perspective * z;
				//var x2 = x1 + this.tileWidth;
				//var y2 = y1 + this.tileHeight;
				
				element.style.zIndex = '' + properties.z + z;
				element.style.left = Math.floor( xx + x1  ) + 'px';
				element.style.top = Math.floor( yy + y1 ) + 'px';
				element.style.width = Math.floor( this.tileWidth * properties.zoomX ) + 'px';
				element.style.height = Math.floor( this.tileHeight * properties.zoomY ) + 'px';
				element.style.opacity = properties.alpha.toString();
				element.style.visibility = this.visible ? 'visible' : 'hidden';		
				
				// Culling
				/*if ( x2 >= this.item.x && x1 < this.item.width && y2 >= this.item.y && y1 < this.item.height )
				{
					if ( !pDefinition.inScene )
					{
						pDefinition.inScene = true;
						this.renderer.scene.add( pDefinition.sprite );
					}
				}
				else
				{
					if ( pDefinition.inScene )
					{
						pDefinition.inScene = false;
						this.renderer.scene.remove( pDefinition.sprite );
					}
				}
				*/
			}
		}
	}
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_HTML.RendererItemMap.destroy = function( flags )
{
	document.body.removeChild( this.backgroundCanvas );
	for ( var s = 0; s < this.spriteList.length; s++ )
	{
		if ( this.spriteList[ s ].element )
			document.body.removeChild( this.spriteList[ s ].element );
	}
};
Friend.Renderers.Renderer_HTML.RendererItemMap.setVisible = function( flag )
{
	if ( this.visible != flag )
	{
		this.visible = flag;
	}
};
Friend.Renderers.Renderer_HTML.RendererItemMap.doRefresh = function()
{
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_HTML.RendererItemMap.getVector = function()
{
	var position = new THREE.Vector3();
	return position.getPositionFromMatrix( this.backgroundSprite.matrixWorld );
};
Friend.Renderers.Renderer_HTML.RendererItemMap.reset = function()
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
	this.backgroundCanvas = this.renderer.createCanvas( this.width, this.height, 'mapBackground', this.item, this );

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
	this.backgroundCanvas.style.position = 'absolute';
	this.backgroundCanvas.style.visibility = 'hidden';
	document.body.appendChild( this.backgroundCanvas );

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
							
							var element = this.renderer.getCanvasFromImage( tile.images[ m ].imageName, this.item, this.tileCount++ );
							var spriteDefinition =
							{
								element: element,
 								width: tile.images[ m ].width,
								height: tile.images[ m ].height,
								hotSpotX: tile.images[ m ].hotSpotX,
								hotSpotY: tile.images[ m ].hotSpotY,
							};
							this.sprites[ y ][ x ].push( spriteDefinition );
							this.spriteList.push( spriteDefinition );
							element.style.position = 'absolute';
							element.style.visibility = 'hidden';
							document.body.appendChild( element );				
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
Friend.Renderers.Renderer_HTML.RendererItemMap.onResize = function( width, height )
{
};






Friend.Renderers.Renderer_HTML.RendererItemCanvas = function( renderer, item, flags )
{
	Object.assign( this, Friend.Renderers.Renderer_HTML.RendererItemCanvas );
	Object.assign( this, Friend.Renderers.Utilities.Canvas2D );
	this.renderer = renderer;
	this.item = item;
	this.name = item.name;
	this.className = 'Friend.Renderers.Renderer_HTML.RendererItemCanvas';
	this.utilities = this.renderer.utilities;
	this.resources = this.renderer.resources;
	this.width = false;
	this.height = false;
	this.utilities.setFlags( this, flags );
	this.canvas = this.renderer.createCanvas( this.item.width, this.item.height, 'canvasItem', this.item, this );
	this.width = this.canvas.width;
	this.height = this.canvas.height;
    
	this.canvas.style.position = 'absolute';
	//this.canvas.style.width = this.width + 'px';
	//this.canvas.style.height = this.height + 'px';
	this.canvas.style.zIndex = item.z;
	this.canvas.style.visibility = 'hidden';
    document.body.appendChild( this.canvas );
    this.toRefresh = true;
}
Friend.Renderers.Renderer_HTML.RendererItemCanvas.reset = function()
{
	this.forceReset = true;
};

Friend.Renderers.Renderer_HTML.RendererItemCanvas.update = function( properties )
{
	this.canvas.style.zIndex = properties.z;
    this.canvas.style.left = Math.floor( properties.x ) + 'px';
    this.canvas.style.top = Math.floor( properties.y ) + 'px';
    this.canvas.style.width = Math.floor( this.width ) + 'px';
    this.canvas.style.height = Math.floor( this.height ) + 'px';
    this.canvas.style.opacity = properties.alpha.toString();
    this.canvas.style.visibility = this.visible ? 'visible' : 'hidden';		
};
Friend.Renderers.Renderer_HTML.RendererItemCanvas.destroy = function( flags )
{
    document.body.removeChild( this.canvas );
};
Friend.Renderers.Renderer_HTML.RendererItemCanvas.setVisible = function( flag )
{
	this.visible = flag;
};
Friend.Renderers.Renderer_HTML.RendererItemCanvas.onResize = function( width, height )
{
	this.canvas.width = width;
	this.canvas.height = height;
	this.width = width;
	this.height = height;
};
Friend.Renderers.Renderer_HTML.RendererItemCanvas.doRefresh = function( flags )
{
	this.toRefresh = true;
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_HTML.RendererItemCanvas.getVector = function()
{
    return { x: 0, y: 0 };
};
