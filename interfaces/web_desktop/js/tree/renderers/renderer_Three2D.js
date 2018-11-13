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
 * Tree engine Three.js 2D renderer
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 11/10/2017
 */
Friend = window.Friend || {};
Friend.Renderers = Friend.Renderers || {};
Friend.Flags = Friend.Flags || {};

Friend.Renderers.Renderer_Three2D = function( localProperties, globalProperties )
{
	this.tree = globalProperties.tree;
	this.name = 'Renderer_Three2D';
	this.className = 'Friend.Renderers.Renderer_Three2D';
	this.utilities = globalProperties.utilities;
	this.resources = globalProperties.resources;
	this.renderingId = false;
	this.utilities.setFlags( this, globalProperties );

	// Direct copy of properties, they are all set!
	Object.assign( this, localProperties );

	// Makes sure all functions are defined (?)
	Object.assign( this, Friend.Renderers.Renderer_Three2D );

	// Renderer variables
    this.pile = [];
	this.items = {};
    this.textures = {};
    this.spriteMaterials = {};
	this.canvasses = {};
	this.images = {};
	this.imagesOriginals = {};
	this.renderFlags = {};
	this.renderToList = {};
    if ( this.width == Friend.Tree.NOTDEFINED )
        this.width = this.tree.width;
    if ( this.height == Friend.Tree.NOTDEFINED )
        this.height = this.tree.height;
	this.canvasLinked = false;
	this.refresh = true;	

	// Creates the scene
	this.scene = new THREE.Scene();

	// Setup the camera
	switch ( this.camera.type )
	{
		case 'perspective':
			if ( this.camera.x == Friend.Tree.NOTDEFINED )
				this.camera.x = 0;
			if ( this.camera.y == Friend.Tree.NOTDEFINED )
				this.camera.y = 0;
			if ( this.camera.z == Friend.Tree.NOTDEFINED )
				this.camera.z = 1000;
			if ( this.camera.filmGauge == Friend.Tree.NOTDEFINED )
				this.camera.filmGauge = 35;
			if ( this.camera.filmOffset == Friend.Tree.NOTDEFINED )
				this.camera.filmOffset = 0;
			if ( this.camera.focus == Friend.Tree.NOTDEFINED )
				this.camera.focus = 10;
			if ( this.camera.zoom == Friend.Tree.NOTDEFINED )
				this.camera.zoom = 1;
			if ( this.camera.aspect == Friend.Tree.NOTDEFINED )
				this.camera.aspect = this.width / this.height;
			if ( this.camera.fov == Friend.Tree.NOTDEFINED )
				this.camera.fov = 2 * Math.atan( ( this.width / this.camera.aspect ) / ( 2 * 1000 ) ) * ( 180 / Math.PI );
			this.camera.camera = new THREE.PerspectiveCamera( this.camera.fov, this.camera.aspect, 0.1, 1000 );
			this.camera.camera.fov = this.camera.fov;
			this.camera.camera.aspect = this.camera.aspect;
			this.camera.camera.filmGauge = this.camera.filmGauge;
			this.camera.camera.filmOffset = this.camera.filmOffset;
			this.camera.camera.focus = this.camera.focus;
			this.camera.camera.zoom = this.camera.zoom;
			this.camera.camera.updateProjectionMatrix();
			this.exposed =
			[
				{ id: 'x', name: 'Camera X', type: 'number', value: Friend.Tree.Utilities.round( this.camera.x, 2 ), step: 10, min: -100000, max: 100000 } ,
				{ id: 'y', name: 'Camera Y', type: 'number', value: Friend.Tree.Utilities.round( this.camera.y, 2 ), step: 10, min: -100000, max: 100000 },
				{ id: 'z', name: 'Camera Z', type: 'number', value: Friend.Tree.Utilities.round( this.camera.z, 2 ), step: 10, min: -100000, max: 100000 },
				{ id: 'aspect', name: 'Camera aspect', type: 'number', value: Friend.Tree.Utilities.round( this.camera.aspect, 2 ), step: 10, min: -100000, max: 100000 },
				{ id: 'fov', name: 'Camera fov', type: 'number', value: Friend.Tree.Utilities.round( this.camera.fov, 2 ), step: 0.1, min: -1000, max: 1000 },
				{ id: 'filmGauge', name: 'Camera film gauge', type: 'number', value: Friend.Tree.Utilities.round( this.camera.filmGauge, 2 ), step: 1, min: -1000, max: 1000 },
				{ id: 'filmOffset', name: 'Camera film offset', type: 'number', value: Friend.Tree.Utilities.round( this.camera.filmOffset, 2 ), step: 1, min: -100000, max: 100000 },
				{ id: 'focus', name: 'Camera focus', type: 'number', value: Friend.Tree.Utilities.round( this.camera.focus, 2 ), step: 1, min: -1000, max: 1000 },
				{ id: 'zoom', name: 'Camera zoom', type: 'number', value: Friend.Tree.Utilities.round( this.camera.zoom, 2 ), step: 0.1, min: -1000, max: 1000 }
			];	
			break;
		case 'orthographic':
		default:
			if ( this.camera.x == Friend.Tree.NOTDEFINED )
				this.camera.x = 0;
			if ( this.camera.y == Friend.Tree.NOTDEFINED )
				this.camera.y = 0;
			if ( this.camera.z == Friend.Tree.NOTDEFINED )
				this.camera.z = 1000;
			if ( this.camera.left == Friend.Tree.NOTDEFINED )
				this.camera.left = -this.width / 2;
			if ( this.camera.right == Friend.Tree.NOTDEFINED )
				this.camera.right = this.width / 2;
			if ( this.camera.top == Friend.Tree.NOTDEFINED )
				this.camera.top = -this.height / 2;
			if ( this.camera.bottom == Friend.Tree.NOTDEFINED )
				this.camera.bottom = this.height / 2;
			if ( this.camera.near == Friend.Tree.NOTDEFINED )
				this.camera.near = 1;
			if ( this.camera.far == Friend.Tree.NOTDEFINED )
				this.camera.far = 1000;
			this.camera.camera = new THREE.OrthographicCamera( this.camera.left, this.camera.right, -this.camera.top, -this.camera.bottom, 1, this.camera.z );
			this.camera.camera.updateProjectionMatrix();
			this.exposed =
			[
				{ id: 'x', name: 'Camera X', type: 'number', value: Friend.Tree.Utilities.round( this.camera.x, 2 ), step: 10, min: -100000, max: 100000 } ,
				{ id: 'y', name: 'Camera Y', type: 'number', value: Friend.Tree.Utilities.round( this.camera.y, 2 ), step: 10, min: -100000, max: 100000 },
				{ id: 'z', name: 'Camera Z', type: 'number', value: Friend.Tree.Utilities.round( this.camera.z, 2 ), step: 10, min: -100000, max: 100000 },
				{ id: 'left', name: 'Camera left', type: 'number', value: Friend.Tree.Utilities.round( this.camera.left, 2 ), step: 10, min: -100000, max: 100000 },
				{ id: 'right', name: 'Camera right', type: 'number', value: Friend.Tree.Utilities.round( this.camera.right, 2 ), step: 10, min: -100000, max: 100000 },
				{ id: 'top', name: 'Camera top', type: 'number', value: Friend.Tree.Utilities.round( this.camera.top, 2 ), step: 10, min: -100000, max: 100000 },
				{ id: 'bottom', name: 'Camera bottom', type: 'number', value: Friend.Tree.Utilities.round( this.camera.bottom, 2 ), step: 10, min: -100000, max: 100000 },
				{ id: 'near', name: 'Camera near', type: 'number', value: Friend.Tree.Utilities.round( this.camera.near, 2 ), step: 10, min: -100000, max: 100000 },
				{ id: 'far', name: 'Camera far', type: 'number', value: Friend.Tree.Utilities.round( this.camera.far, 2 ), step: 10, min: -100000, max: 100000 }
			];	
			break;
	}
	this.camera.camera.position.set( this.camera.x, this.camera.y, this.camera.z );
	this.camera.camera.lookAt( this.scene.position );
	this.zoomZ = 1;
	this.scene.add( this.camera.camera );
	
	// Create the renderer
	this.renderer = new THREE.WebGLRenderer( { preserveDrawingBuffer: true } );
	this.renderer.setSize( this.width, this.height );
	this.renderer.setClearColor( this.resize.borderColor, 0.5 );

	if ( this.renderingId )
		this.attachCanvas( this.renderingId );

	// If resize with borders, put a canvas for border in the back
	/*
	if ( typeof this.resizeFlags.borderColor != 'undefined' )
	{
	}
	*/
	// Creates the Z Map palette	
	this.createZPalette();

	/*
	var self = this;
	Friend.Tree.include( 
	[ 
		"/webclient/js/tree/renderers/three.js-master/examples/js/renderers/SoftwareRenderer.js", 
		"/webclient/js/tree/renderers/three.js-master/examples/js/renderers/Projector.js"
	], function()
	{
		self.softwareRenderer = new THREE.SoftwareRenderer( { alpha: false } );	
		self.softwareCamera = new THREE.OrthographicCamera( self.width / - 2, self.width / 2, self.height / 2, self.height / - 2, 1, 1000 );
		self.camera.position.set( 0, 0, 1000 );
		self.camera.lookAt( self.scene.position );			
	} );	
	*/
};

// Default properties. Will be send on renderer creation
Friend.Renderers.Renderer_Three2D.defaultProperties =
{
	x: 0,
	y: 0,
	z: 0,
	width: Friend.Tree.NOTDEFINED,
	height: Friend.Tree.NOTDEFINED,
	anaglyph: false,
	defaultFont: '12px Verdana',
	antialias: true,
	resize:
	{
		mode: 'keepProportions',
		borderColor: 0xFF0000
	},
	camera: 
	{
		type: 'orthographic', 
		x: Friend.Tree.NOTDEFINED,
		y: Friend.Tree.NOTDEFINED,
		z: Friend.Tree.NOTDEFINED,
		angle: Friend.Tree.NOTDEFINED,
		aspect: Friend.Tree.NOTDEFINED,
		fov: Friend.Tree.NOTDEFINED,
		left: Friend.Tree.NOTDEFINED,
		right: Friend.Tree.NOTDEFINED,
		top: Friend.Tree.NOTDEFINED,
		bottom: Friend.Tree.NOTDEFINED,
		near: Friend.Tree.NOTDEFINED,
		far: Friend.Tree.NOTDEFINED,
		filmGauge: Friend.Tree.NOTDEFINED,
		filmOffset: Friend.Tree.NOTDEFINED,
		focus: Friend.Tree.NOTDEFINED,
		zoom: Friend.Tree.NOTDEFINED
	},
	renderZ:
	{
		enabled: false,
		palette: false,
		paletteLength: 16,
		colorMin: 0,
		colorMax: 256,
		paletteMin: 0,
		paletteMax: 16,
		boxed: false,
		paletteDirection: Friend.Tree.DIRECTION_UP
	}
};

Friend.Renderers.Renderer_Three2D.resize = function( width, height, originalWidth, originalHeight, mode )
{
	switch ( mode )
	{
		case 'adapt':
			this.canvas.width = width;
			this.canvas.height = height;
		    this.camera.aspect = width / height;
			this.camera.camera.aspect = this.camera.aspect;
    		this.camera.camera.updateProjectionMatrix();
		    this.renderer.setSize( width, height );
			this.width = width;
			this.height = height;
			break;
		case 'keepProportions':
			var prop = originalWidth / originalHeight;
			var newWidth = width * prop;
			var newHeight = height / prop;
			if ( newWidth > width )
			{
				newWidth = width;
				newHeight = newWidth / prop;
			}
			if ( newHeight > height )
			{
				newHeight = height;
				newWidth = height * prop;
			}
			var canvasX = ( width >> 1 ) - ( newWidth >> 1 );
			var canvasY = ( height >> 1 ) - ( newHeight >> 1 );
			if ( this.resizeFlags.borderColor )
			{
				var div = document.getElementById( 'Borders' );
				div.style.backgroundColor = 'green';
				/*if ( !this.backCanvasLeft ) 
				{
					this.backCanvasLeft = document.createElement( 'canvas' );
					div.appendChild( this.backCanvasLeft );
				}
				this.backCanvasLeft.style.left = '0px';
				this.backCanvasLeft.style.top = '0px';
				this.backCanvasLeft.width = canvasX;
				this.backCanvasLeft.height = canvasY;
				var context = this.backCanvasLeft.getContext( '2d' );
				context.fillStyle = this.resizeFlags.borderColor;
				context.fillRect( 0, 0, canvasX, canvasY ); 
				*/
			}
			this.canvas.style.transform = 'translate3d(' + canvasX + 'px,' + canvasY + 'px,0)';
			this.canvas.width = newWidth;
			this.canvas.height = newHeight;
		    this.camera.aspect = newWidth / newHeight;
			this.camera.camera.aspect = this.camera.aspect;
    		this.camera.camera.updateProjectionMatrix();
		    this.renderer.setSize( newWidth, newHeight );
			this.width = newWidth;
			this.height = newHeight;
			this.refresh = true;
			break;
	}
};
Friend.Renderers.Renderer_Three2D.changeExposed = function( info )
{
	switch ( info.id )
	{
		case 'x':
			this.camera.x = info.value;
			this.camera.camera.position.set( this.camera.x, this.camera.y, this.camera.z );
			break;
		case 'y':
			this.camera.y = info.value;
			this.camera.camera.position.set( this.camera.x, this.camera.y, this.camera.z );
			break;
		case 'z':
			this.camera.z = info.value;
			this.camera.camera.position.set( this.camera.x, this.camera.y, this.camera.z );
			break;
		case 'left':
			this.camera.near = info.value;
			this.camera.camera.near = info.value;
			break;
		case 'right':
			this.camera.right = info.value;
			this.camera.camera.right = info.value;
			break;
		case 'top':
			this.camera.top = info.value;
			this.camera.camera.top = info.value;
			break;
		case 'bottom':
			this.camera.bottom = info.value;
			this.camera.camera.bottom = info.value;
			break;
		case 'near':
			this.camera.near = info.value;
			this.camera.camera.near = info.value;
			break;
		case 'far':
			this.camera.far = info.value;
			this.camera.camera.far = info.value;
			break;
		case 'aspect':
			this.camera.aspect = info.value;
			this.camera.camera.aspect = info.value;
			break;
		case 'fov':
			this.camera.fov = info.value;
			this.camera.camera.fov = info.value;
			break;
		case 'filmGauge':
			this.camera.filmGauge = info.value;
			this.camera.camera.filmGauge = info.value;
			break;
		case 'filmOffset':
			this.camera.filmOffset = info.value;
			this.camera.camera.filmOffset = info.value;
			break;
		case 'focus':
			this.focus = info.value;
			this.camera.camera.focus = info.value;
			break;
		case 'zoom':
			this.camera.zoom = info.value;
			this.camera.camera.zoom = info.value;
			break;
	}
	this.camera.updateProjectionMatrix();
};
Friend.Renderers.Renderer_Three2D.setRenderZ = function( onOff )
{
	if ( onOff != this.rendererFlags.renderZ )
	{
		this.renderZ.enabled = onOff;
		for ( var i in this.items )
		{
			this.items[ i ].destroy();
			this.items[ i ].item.rendererItems[ this.className ] = false;		
			this.items[ i ].item.refresh = true;
		}
		this.items = {};
		this.textures = {};
		this.canvasses = {};
		this.spriteMaterials = {};
		this.renderFlags = {};
		this.createZPalette();
	}
	return this.renderZ.enabled;
};
Friend.Renderers.Renderer_Three2D.createZPalette = function()
{
	// Render Z map? Creates the palette
	if ( this.renderZ.enabled )
	{
		if ( !this.renderZ.palette )
		{
			this.renderZ.palette = [];
			for ( var z = 0; z < this.renderZ.paletteLength; z++)
			{
				var gray;
				var colorWidth = ( this.renderZ.colorMax - this.renderZ.colorMin ) / this.renderZ.paletteLength;
				if ( this.renderZ.paletteDirection == Friend.Tree.DIRECTION_UP )
					gray = Math.floor( ( z / this.renderZ.paletteLength ) * this.renderZ.paletteLength ) * colorWidth;
				else
					gray = Math.floor( ( ( this.renderZ.paletteLength - z - 1 ) / this.renderZ.paletteLength ) * this.renderZ.paletteLength ) * colorWidth;
				var color = Friend.Tree.Utilities.convertToHex( gray, 2 );
				color = '#' + color + color + color;
				this.renderZ.palette[ z ] = color;
			}
		}
	}
};
Friend.Renderers.Renderer_Three2D.getScreenCoordinates = function( item )
{
	var vector;
	var rendererItem = item.rendererItems[ this.className ];
	if ( rendererItem )
	{
		rendererItem.getVector();
		vector.x = ( vector.x + 1 ) / 2 * this.width;
		vector.y = -( vector.y - 1 ) / 2 * this.height;
	}
	return vector;
}
Friend.Renderers.Renderer_Three2D.startRenderTo = function( name, flags )
{
	flags.name = name;
	var self = this;
	this.setImage( flags.destination, function()
	{
		self.renderToList[ name ] = flags;
		self.renderToCount++;
	} );
};
Friend.Renderers.Renderer_Three2D.stopRenderTo = function( id )
{
	var renderTo = this.renderToList[ id ];
	if ( renderTo )
	{
		if ( renderTo.deleteImageOnStop )
			this.resources.deleteImage( name );
		this.renderToList[ id ] = false;
		this.renderToList = Friend.Tree.Utilities.cleanArray( this.renderToList );
		this.renderToCount--;
	}
};
Friend.Renderers.Renderer_Three2D.attachCanvas = function( renderingId )
{
	this.renderingId = renderingId;
	var container = document.getElementById( renderingId );
    container.appendChild( this.renderer.domElement );
	this.canvasLinked = true;
	this.refresh = true;
	this.canvas = this.renderer.domElement;
};
Friend.Renderers.Renderer_Three2D.add = function( item, rendererItem )
{
	this.items[ item.identifier ] = rendererItem;
};
Friend.Renderers.Renderer_Three2D.clear = function()
{
	for ( var i in this.items )
		this.items[ i ].destroy();
	this.items = {};
	this.textures = {};
	this.canvasses = {};
	this.spriteMaterials = {};
	this.renderFlags = {};
	this.renderToList = {};
	this.renderToCount = 0;
};
Friend.Renderers.Renderer_Three2D.refreshItem = function( item )
{
	if ( this.items[ item.identifier ] )
		this.items[ item.identifier ].doRefresh();
};
Friend.Renderers.Renderer_Three2D.startDestroy = function()
{
};
Friend.Renderers.Renderer_Three2D.destroy = function( item )
{
	if ( this.items[ item.identifier ] )
	{
		this.items[ item.identifier ].destroy();
		this.items[ item.identifier ] = false;
	}
};
Friend.Renderers.Renderer_Three2D.endDestroy = function()
{
	this.items = this.utilities.cleanArray( this.items );
};
Friend.Renderers.Renderer_Three2D.setImage = function( srcImage, callback )
{
	var self = this;
	var width = srcImage.width;
	var height = srcImage.height;
	var image;
	if ( width != height )
	{
		if ( width > height )
			height = width;
		else
			width = height;
	}
	if ( !this.utilities.isPowerOfTwo( width ) )
		width = this.utilities.getNextPowerOfTwo( width );
	if ( !this.utilities.isPowerOfTwo( height ) )
		height = this.utilities.getNextPowerOfTwo( height );
	if ( width != srcImage.width || height != srcImage.height )
	{
		var canvas = document.createElement( 'canvas' );
		canvas.width = width;
		canvas.height = height;
		var context = canvas.getContext( '2d' );
		context.drawImage( srcImage, ( canvas.width - srcImage.width ) / 2, ( canvas.height - srcImage.height ) / 2 );
		image = new Image();
		image.onload = loaded;
		image.src = canvas.toDataURL( "image/png" );
		image.treeName = srcImage.treeName;
		this.images[ srcImage.treeName ] = image;
		this.imagesOriginals[ srcImage.treeName ] = srcImage;

		function loaded()
		{
			callback( image );
		};
	}
	else
	{
		this.images[ srcImage.treeName ] = srcImage;
		this.imagesOriginals[ srcImage.treeName ] = srcImage;
		callback( srcImage );
	}
};
Friend.Renderers.Renderer_Three2D.getImage = function( name, item )
{
	return this.images[ name ];
};
Friend.Renderers.Renderer_Three2D.getOriginalImage = function( name, item )
{
	return this.imagesOriginals[ name ];
};
Friend.Renderers.Renderer_Three2D.getTexture = function( imageOrCanvas, item, force, z, width, height )
{
	var id = item.identifier + '<>' + imageOrCanvas.treeName;
	var texture = this.textures[ id ];
	if ( !texture || force )
		this.textures[ id ] = { zArray: [] };
	texture = this.textures[ id ];
	if ( !z )
		z = 0;
	if ( !texture.zArray[ z ] || force )
	{
		if ( this.renderZ.enabled )
		{
			var canvas = document.createElement( 'canvas' );
			canvas.width = imageOrCanvas.width;
			canvas.height = imageOrCanvas.height;
			var zPalette = Math.floor( this.rendreZ.palette.length * ( z - this.renderZ.paletteMin ) / ( this.renderZ.paletteMax - this.renderZ.paletteMin ) );
			var context = canvas.getContext( '2d' );
			var width, height;
			var original;
			var isCanvas;
			if ( !width || !height  )
			{
				original = this.imagesOriginals[ imageOrCanvas.treeName ];
				width = original.width
				height = original.height;
				deltaX = ( imageOrCanvas.width - width ) / 2;
				deltaY = ( imageOrCanvas.height - height ) / 2;
				isCanvas = false;
			}
			else
			{
				deltaX = ( imageOrCanvas.width - width ) / 2;
				deltaY = ( imageOrCanvas.height - height ) / 2;
				isCanvas = true;
			}
			context.fillStyle = this.renderZ.palette[ zPalette ];
			if ( this.renderZ.boxed || isCanvas )
			{
				context.fillRect( deltaX, deltaY, width, height );
			}
			else
			{
				var sCanvas = document.createElement( 'canvas' );
				sCanvas.width = original.width;
				sCanvas.height = original.height;
				var sContext = sCanvas.getContext( '2d' );
				sContext.drawImage( original, 0, 0, original.width, original.height );
				var imageData = sContext.getImageData( 0, 0, original.width, original.height );
				var data = imageData.data;
				for ( var y = 0; y < height; y++ )
				{
					for ( var x = 0; x < width; x++ )
					{
						if ( getPixel( x, y ) != 0 )
						{
							context.fillRect( deltaX + x, deltaY + y, 1, 1 );
						}
					}
				}
				function getPixel( x, y )
				{
					var i = ( ( imageData.width * y ) + x ) * 4;
					return ( data[ i ] << 0x01000000 ) | ( data[ i + 1 ] << 0x00010000) | ( data[ i + 2 ] << 0x00000100 ) | data[ i + 3 ];
				}
			}
			tex = new THREE.Texture( canvas );
			tex.treeName = imageOrCanvas.treeName;
			tex.needsUpdate = true;
			texture.zArray[ z ] = tex;
		}
		else
		{
			var tex = new THREE.Texture( imageOrCanvas );
			tex.treeName = imageOrCanvas.treeName;
			tex.needsUpdate = true;
			texture.zArray[ z ] = tex;
		}
	}		
	return texture.zArray[ z ];
};
Friend.Renderers.Renderer_Three2D.getSpriteMaterial = function( texture, item, force )
{
	var id = item.identifier + '<>' + texture.treeName;
	var material = this.spriteMaterials[ id ];
	if ( !material || force )
	{
		material = new THREE.SpriteMaterial( { map: texture } );
		material.treeName = texture.treeName;
		this.spriteMaterials[ id ] = material;
	}
	return material;
};
Friend.Renderers.Renderer_Three2D.getCanvas = function( id )
{
	var canvas = this.canvasses[ id ];
	if ( canvas )
		return canvas;
	return false;
};
Friend.Renderers.Renderer_Three2D.createCanvas = function( width, height, name, item, rendererItem, force )
{
	var id = item.identifier + '<>' + name;
	var canvas = this.canvasses[ id ];
	if ( !canvas || force  )
	{
		canvas = document.createElement( 'canvas' );
		canvas.treeName = name;
		canvas.treeRendererId = id;
		canvas.width = this.utilities.getNextPowerOfTwo( width );
		canvas.height = this.utilities.getNextPowerOfTwo( height );
		rendererItem.realWidth = canvas.width,
		rendererItem.realHeight = canvas.height;
		rendererItem.canvas = canvas;
		rendererItem.context = canvas.getContext( '2d' );
		if ( canvas.width != width || canvas.height != height )
		{
			rendererItem.context.translate( ( canvas.width - width ) / 2, ( canvas.height - height ) / 2 );
		}
		this.canvasses[ id ] = canvas;
	}
	return canvas;
};

Friend.Renderers.Renderer_Three2D.setFontSize = function( font, size )
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

Friend.Renderers.Renderer_Three2D.getFontSize = function( font )
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
Friend.Renderers.Renderer_Three2D.addColor = function( color, modification, direction )
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

Friend.Renderers.Renderer_Three2D.measureText = function( text, font )
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

Friend.Renderers.Renderer_Three2D.getRenderFlags = function( extraFlags )
{
	var flags =
	{
		x: 0,
		y: 0,
		z: 0,
		offsetX: 0,
		offsetY: 0,
		xReal: 0,
		yReal: 0,
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
	flags.xReal = flags.x;
	flags.yReal = flags.y;
	return flags;
};
Friend.Renderers.Renderer_Three2D.renderStart = function( flags )
{
};
Friend.Renderers.Renderer_Three2D.updateItem = function( item )
{
	if ( item.rendererItems )
	{
		var rendererItem = item.rendererItems[ this.className ];
		if ( rendererItem )
			rendererItem.needsUpdate = true;
	}
};
Friend.Renderers.Renderer_Three2D.resizeItem = function( item, width, height )
{
	if ( item.rendererItems )
	{
		var rendererItem = item.rendererItems[ this.className ];
		if ( rendererItem )
			rendererItem.onResize( width, height );
	}
};

Friend.Renderers.Renderer_Three2D.renderUp = function( flags, item )
{
	flags.item = item;

	// Nothing to draw (security)
	if ( !item.rendererType )
	{
		this.pile.push( Object.assign( {}, flags ) );
		this.renderFlags[ item.identifier ] = Object.assign( {}, flags );
		flags.rendererItem = false;
		flags = this.renderPrepare( flags, item );
		return flags;
	}

	// A refresh is needed
	flags.renderer.refresh = true;

	// Creates the renderingItem if it does not exist
	if ( !item.rendererItems )
		item.rendererItems = {};
	flags.rendererItem = item.rendererItems[ this.className ];
	if ( !flags.rendererItem )
	{
		flags.rendererItem = new Friend.Renderers.Renderer_Three2D[ 'RendererItem' + item.rendererType ]( this, item, flags );
		item.rendererItems[ this.className ] = flags.rendererItem;
		this.add( item, flags.rendererItem );
		flags.rendererItem.visible = true;
	}

	// Context = rendererItem
	flags.context = flags.rendererItem;

	// Store for way down and for fast rendering
	this.pile.push( Object.assign( {}, flags ) );
	this.renderFlags[ item.identifier ] = Object.assign( {}, flags );

	// Calculates coordinates
	flags = this.renderPrepare( flags, item );

	return flags;
};
Friend.Renderers.Renderer_Three2D.renderPrepare = function( flags, item )
{
	var xx = item.x;
	var yy = item.y;
	if ( !item.noOffsets )
	{
		xx += flags.offsetX;
		yy += flags.offsetY;
	}
	flags.offsetX = 0;
	flags.offsetY = 0;
	
	if ( !flags.noPerspective )
	{
		// Calculates the x and y shift
		xx += ( xx - flags.xCenter ) * flags.perspective;
		yy += ( yy - flags.yCenter ) * flags.perspective;

		// Specific perspective for the children of the item?
		if ( item.perspective  )
		{
			flags.perspective = item.perspective;
			if ( typeof item.xCenter != 'undefined' )
				flags.xCenter = item.xCenter;
			if ( typeof item.yCenter != 'undefined' )
				flags.yCenter = item.yCenter;
		}
		if ( typeof item.noPerspective != 'undefined' )
			flags.noPerspective = item.noPerspective;
	}
	
	flags.xReal = Math.floor( flags.xReal + xx );
	flags.yReal = Math.floor( flags.yReal + yy );
	item.rect.x = flags.xReal;
	item.rect.y = flags.yReal;
	item.rect.width = item.width;
	item.rect.height = item.height;
	item.thisRect.x = 0;
	item.thisRect.y = 0;
	item.thisRect.width = item.width;
	item.thisRect.height = item.height;
	if ( !item.noRotation )
		flags.rotation += item.rotation;
	else
		flags.rotation = 0;
	flags.zoomX *= item.zoomX;
	flags.zoomY *= item.zoomY;
	flags.z = item.z;
	if ( !this.renderZ.enabled )
		flags.alpha *= item.alpha;
	else
		flags.alpha = 1;

	return flags;
};
Friend.Renderers.Renderer_Three2D.renderIt = function( flags, item )
{
	if ( flags.rendererItem )
	{
		// Coordinates for rendering
		flags.x = flags.xReal - this.width / 2 + flags.rendererItem.width / 2 - ( flags.rendererItem.width - item.width ) / 2 - item.hotSpotX;
		flags.y = this.height / 2 - flags.yReal - flags.rendererItem.height / 2 + ( flags.rendererItem.height - item.height ) / 2 + item.hotSpotY;

		// Visible or not?
		if ( item.visible != flags.rendererItem.visible )
			flags.rendererItem.setVisible( item.visible );

		// Refreshes item if it has changed
		flags.rendererItem.update( flags );
	}
	return flags;
};

Friend.Renderers.Renderer_Three2D.renderDown = function( flags, item )
{
	item.refresh = false;
 	return this.pile.pop();
};
Friend.Renderers.Renderer_Three2D.renderUpFast = function( flags, item )
{
	if ( this.renderFlags[ item.identifier ] )
	{
		flags = Object.assign( {}, this.renderFlags[ item.identifier ] );
		flags = this.renderPrepare( flags, item );
		return flags;
	}
	return false;
};
Friend.Renderers.Renderer_Three2D.renderDownFast = function( flags, item )
{
	item.refresh = false;
	return flags;
};
Friend.Renderers.Renderer_Three2D.renderEnd = function ()
{
	this.updating = true;
	if ( this.refresh )
	{
		// Rendering
	    this.renderer.render( this.scene, this.camera.camera );

		// Save render image
		if ( this.renderToCount )
		{
			for ( var r in this.renderToList )
			{
				var renderTo = this.renderToList[ r ];
				var destination = this.getImage( renderTo.name ); 
				if ( destination )
				{
					var source = this.renderer.domElement;
					var imageData = source.toDataURL( "image/jpeg" );
					//var context = destination.getContext( '2d' );
					//context.putImageData( imageData, 0, 0, 0, 0, renderTo.width, renderTo.height );
					destination.onload = function()
					{
						this.treeBusy = false;
						console.log( 'Loaded!' );
					}
					if ( !destination.treeBusy )
					{
						destination.treeBusy = true;
						destination.src = imageData;
					}
				}
			}			
		}

		// Verification
		if ( this.pile.length )
		{
			console.log( 'Renderer_Three2D: Illegal number of renderUp and renderDown.' );
			this.pile = [];				// Security, does not pile up!
		}

		// Refresh done!
		this.refresh = false;
	}
	this.updating = false;
};
Friend.Renderers.Renderer_Three2D.postProcess = function( imageOrCanvas, item )
{
};




Friend.Renderers.Renderer_Three2D.RendererItemSprite = function( renderer, item, flags )
{
	Object.assign( this, Friend.Renderers.Renderer_Three2D.RendererItemSprite );
	this.renderer = renderer;
	this.item = item;
	this.name = item.name;
	this.className = 'Friend.Renderers.RendererItemSprite';
	this.utilities = this.renderer.utilities;
	this.resources = this.renderer.resources;
	this.utilities.setFlags( this, flags );
	this.imageName = false;
	this.sprite = new THREE.Sprite();
	this.sprite.name = this.item.identifier;
	this.checkImage( this.item.z );
	this.renderer.scene.add( this.sprite );
	this.inScene = true;
}
Friend.Renderers.Renderer_Three2D.RendererItemSprite.update = function( flags )
{
	this.checkImage( flags.z * this.renderer.zoomZ );
	if ( this.material )
	{
		this.cull( flags );
		this.material.opacity = flags.alpha;
		this.material.rotation = flags.rotation * Friend.Tree.DEGREETORADIAN;
		this.sprite.scale.set( this.width * flags.zoomX, this.height * flags.zoomY, 1.0 );
		this.sprite.position.set( flags.x, flags.y, flags.z * this.renderer.zoomZ );
		this.renderer.refresh = true;
	}
};
Friend.Renderers.Renderer_Three2D.RendererItemSprite.destroy = function( flags )
{
	this.renderer.scene.remove( this.sprite );
};
Friend.Renderers.Renderer_Three2D.RendererItemSprite.setVisible = function( flag )
{
	this.visible = flag;
	this.sprite.visible = flag;
};
Friend.Renderers.Renderer_Three2D.RendererItemSprite.checkImage = function( z )
{
	if ( this.item.imageName && ( this.imageName != this.item.imageName || this.needsUpdate ) || this.forceReset )
	{
		this.forceReset = false;
		this.needsUpdate = false;
		this.imageName = this.item.imageName;
		this.renderImage = this.renderer.getImage( this.item.imageName, this.item );
		if ( this.renderImage )
		{
			this.width = this.renderImage.width;
			this.height = this.renderImage.height;
			this.texture = this.renderer.getTexture( this.renderImage, this.item, false, z );
			this.material = this.renderer.getSpriteMaterial( this.texture, this.item );
			this.sprite.material = this.material;
		}
	}
};
Friend.Renderers.Renderer_Three2D.RendererItemSprite.cull = function( flags )
{
	if ( this.item.x + this.item.width >= 0 && this.item.x < this.renderer.width )
	{
		if ( this.item.y + this.item.height >= 0 && this.item.y < this.renderer.height )
		{
			if ( !this.inScene )
			{
				this.inScene = true;
				//this.renderer.scene.add( this.sprite );
			}
			return;
		}
	}
	this.inScene = false;
	//this.renderer.scene.remove( this.sprite );
};
Friend.Renderers.Renderer_Three2D.RendererItemSprite.doRefresh = function( flags )
{
	this.image = this.item.image;
	this.renderImage = this.renderer.getImage( this.item.image, this.item );
	this.width = this.renderImage.width;
	this.height = this.renderImage.height;
	this.texture = this.renderer.getTexture( this.renderImage, this.item, true );
	this.material = this.renderer.getSpriteMaterial( this.texture, this.item, true );
	this.sprite.material = this.material;
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_Three2D.RendererItemSprite.getVector = function()
{
	var position = new THREE.Vector3();
	return position.getPositionFromMatrix( this.sprite.matrixWorld );
};
Friend.Renderers.Renderer_Three2D.RendererItemSprite.reset = function()
{
	this.forceReset = true;
};
Friend.Renderers.Renderer_Three2D.RendererItemSprite.onResize = function()
{
};




Friend.Renderers.Renderer_Three2D.RendererItemSprite3D = function( renderer, item, flags )
{
	Object.assign( this, Friend.Renderers.Renderer_Three2D.RendererItemSprite3D );
	this.renderer = renderer;
	this.item = item;
	this.name = item.name;
	this.className = 'Friend.Renderers.Renderer_Three2D.RendererItemSprite3D';
	this.utilities = this.renderer.utilities;
	this.resources = this.renderer.resources;
	this.utilities.setFlags( this, flags );
	this.layerList = {};
	this.sprites = [];

	this.maxLayers = 0;
	this.checkImages( this.item.z );
}
Friend.Renderers.Renderer_Three2D.RendererItemSprite3D.update = function( flags )
{
	this.checkImages();
	this.cull( flags );

	var z = 0;
	var layerList = this.layerList[ this.item.imageName ];
	if ( layerList )
	{
		// All the layers one above the other by changing the Z order up, and adding perspective
		for ( z = 0; z < layerList.length && z < this.maxLayers; z++ )
		{
			var layer = layerList[ z ];
			var sprite = this.sprites[ z ].sprite;
			layer.material.rotation = flags.rotation * Friend.Tree.DEGREETORADIAN;
			sprite.material = layer.material;
			sprite.material.opacity = flags.alpha;
			sprite.scale.set( layer.width * flags.zoomX, layer.height * flags.zoomY, 1.0 );
			var deltaX = ( ( flags.xReal - flags.xCenter ) * z * flags.perspective ) * flags.zoomX;
			var deltaY = ( ( flags.yReal - flags.yCenter ) * z * flags.perspective ) * flags.zoomY;
			sprite.position.set( flags.x + deltaX, flags.y - deltaY, ( flags.z + z / 10 ) * this.renderer.zoomZ );
			sprite.visible = true;
		}
	}
	// Remaining layers are hidden
	for ( ; z < this.maxLayers; z++ )
		this.sprites[ z ].sprite.visible = false;

	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_Three2D.RendererItemSprite3D.destroy = function( flags )
{
	for ( var l = 0; l < this.maxLayers; l++ )
		this.renderer.scene.remove( this.sprites[ l ].sprite );
};
Friend.Renderers.Renderer_Three2D.RendererItemSprite3D.setVisible = function( flag )
{
	if ( this.visible != flag )
	{
		this.visible = flag;
		for ( var l = 0; l < this.maxLayers; l++ )
			this.sprites[ l ].sprite.visible = flag;
	}
};
Friend.Renderers.Renderer_Three2D.RendererItemSprite3D.cull = function( flag )
{
	if ( this.item.x + this.item.width >= 0 && this.item.x < this.renderer.width )
	{
		if ( this.item.y + this.item.height >= 0 && this.item.y < this.renderer.height )
		{
			if ( !this.inScene )
			{
				this.inScene = true;
				for ( var l = 0; l < this.maxLayers; l++ )
				{
					if ( !this.sprites[ l ].inScene )
					{
						this.sprites[ l ].inScene = true;
						//this.renderer.scene.add( this.sprites[ l ].sprite );
					}
				}
			}
			return;
		}
	}
	this.inScene = false;
	for ( var l = 0; l < this.maxLayers; l++ )
	{
		if ( !this.sprites[ l ].inScene )
		{
			//this.renderer.scene.remove( this.sprites[ l ].sprite );
			this.sprites[ l ].inScene = false;
		}
	}
};
Friend.Renderers.Renderer_Three2D.RendererItemSprite3D.checkImages = function( zBase )
{
	var maxLayers = this.maxLayers;
	if ( !this.layerList[ this.item.imageName ] || this.forceReset )
	{
		this.forceReset = false;
		this.layerList[ this.item.imageName ] = [];
		var imageList = this.resources.getImage( this.item.imageName, this.item );
		for ( var z = 0; z < imageList.images.length; z ++ )
		{
			var image = this.renderer.getImage( imageList.images[ z ].name, this.item );
			var texture = this.renderer.getTexture( image, this.item, false, ( zBase + z / 10 ) * this.renderer.zoomZ );
			var layer =
			{
				texture: texture,
				material: this.renderer.getSpriteMaterial( texture, this.item ),
				width: image.width,
				height: image.height,
				z: z
			};
			if ( z == 0 )
			{
				this.width = image.width;
				this.height = image.height;
			}
			this.layerList[ this.item.imageName ].push( layer );
			this.maxLayers = Math.max( this.maxLayers, z + 1 );
		}
	}
	if ( this.maxLayers > maxLayers )
	{
		for ( var l = maxLayers; l < this.maxLayers; l++ )
		{
			var sprite = new THREE.Sprite();
			this.renderer.scene.add( sprite );
			this.sprites[ l ] =
			{
				sprite: sprite,
				inScene: true
			};
		}
	}
	return this.layerList[ this.item.imageName ];
}
Friend.Renderers.Renderer_Three2D.RendererItemSprite3D.doRefresh = function( flags )
{
	this.layerList[ this.item.imageName ] = [];
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_Three2D.RendererItemSprite3D.getVector = function()
{
	var position = new THREE.Vector3();
	return position.getPositionFromMatrix( this.sprites[ 0 ].sprite.matrixWorld );
};
Friend.Renderers.Renderer_Three2D.RendererItemSprite3D.reset = function()
{
	this.forceReset = true;
};
Friend.Renderers.Renderer_Three2D.RendererItemSprite3D.onResize = function( width, height )
{
};

Friend.Renderers.Renderer_Three2D.RendererItemMap = function( renderer, item, flags )
{
	Object.assign( this, Friend.Renderers.Renderer_Three2D.RendererItemMap );
	this.renderer = renderer;
	this.item = item;
	this.name = item.name;
	this.className = 'Friend.Renderers.RendererThree2DRendererItemMap';
	this.utilities = this.renderer.utilities;
	this.resources = this.renderer.resources;
	this.utilities.setFlags( this, flags );

	this.tileWidth = this.item.tileWidth;
	this.tileHeight = this.item.tileHeight;
	this.mapWidth = this.item.mapWidth;
	this.mapHeight = this.item.mapHeight;

	// Add the functions to draw in the background
	Object.assign( this, Friend.Renderers.Utilities.Canvas2D );
	this.reset();
	return this;
}
Friend.Renderers.Renderer_Three2D.RendererItemMap.update = function( flags )
{
	var offsetX = this.item.offsetX;
	var offsetY = this.item.offsetY;

	// Position the background
	var x = flags.xReal + this.backgroundCanvas.width / 2 - ( this.backgroundCanvas.width - this.width ) / 2 - this.renderer.width / 2;
	var y = flags.yReal + this.renderer.height / 2 - this.backgroundCanvas.height / 2 + ( this.backgroundCanvas.height - this.height ) / 2;
	this.backgroundSprite.rotation = flags.rotation * Friend.Tree.DEGREETORADIAN;
	this.backgroundSprite.scale.set( this.backgroundCanvas.width * flags.zoomX, this.backgroundCanvas.height * flags.zoomY, 1.0 );
	this.backgroundSprite.position.set( x - offsetX * flags.zoomX, y + offsetY * flags.zoomY, flags.z );

	// Position the animated sprites. TODO: clipping and culling!
	for ( var y in this.sprites )
	{
		for ( var x in this.sprites[ y ] )
		{
			var spriteDefinition = this.sprites[ y ][ x ];
			for ( var z = 0; z < spriteDefinition.length; z++ )
			{
				var pDefinition = spriteDefinition[ z ];

				var x1 = x * this.tileWidth  - offsetX;
				var y1 = y * this.tileHeight - offsetY;
				x1 += ( x1 - flags.xCenter ) * flags.perspective * z;
				y1 += ( y1 - flags.yCenter ) * flags.perspective * z;
				var x2 = x1 + this.tileWidth;
				var y2 = y1 + this.tileHeight;

				// Culling
				if ( x2 >= this.item.x && x1 < this.item.width && y2 >= this.item.y && y1 < this.item.height )
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

				var texture = this.renderer.getTexture( pDefinition.image, this.item, false, ( flags.z + z + 1 ) * this.renderer.zoomZ );
				pDefinition.sprite.material = this.renderer.getSpriteMaterial( texture, this.item );

				var xx = flags.xReal + pDefinition.width / 2 - this.renderer.width / 2 + x1 * flags.zoomX;
				var yy = flags.yReal + this.renderer.height / 2 - pDefinition.height / 2 - y1 * flags.zoomY;
				pDefinition.sprite.scale.set( pDefinition.width * flags.zoomX, pDefinition.height * flags.zoomY, 1.0 );
				pDefinition.sprite.position.set( xx, yy, ( flags.z + z + 1 ) * this.renderer.zoomZ );
			}
		}
	}
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_Three2D.RendererItemMap.destroy = function( flags )
{
	for ( var s = 0; s < this.spriteList.length; s++ )
		this.renderer.scene.remove( this.spriteList[ s ].sprite );
};
Friend.Renderers.Renderer_Three2D.RendererItemMap.setVisible = function( flag )
{
	if ( this.visible != flag )
	{
		this.visible = flag;
		for ( var s = 0; s < this.spriteList.length; s++ )
			this.spriteList[ s ].sprite.visible = flag;
	}
};
Friend.Renderers.Renderer_Three2D.RendererItemMap.doRefresh = function()
{
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_Three2D.RendererItemMap.getVector = function()
{
	var position = new THREE.Vector3();
	return position.getPositionFromMatrix( this.backgroundSprite.matrixWorld );
};
Friend.Renderers.Renderer_Three2D.RendererItemMap.reset = function()
{
	// Computes the tiles definition
	this.tiles = [];
    for ( var i = 0; i < this.item.tiles.length; i ++ )
    {
		var tile = this.item.tiles[ i ];
		var tileDefinition = {};
		if ( tile.imageName )
		{
			tileDefinition.originalImage = this.resources.getImage( tile.imageName );
			tileDefinition.image = this.renderer.getImage( tile.imageName, this.item );
			tileDefinition.width = tileDefinition.image.width;
			tileDefinition.height = tileDefinition.image.height;
		}
		else if ( tile.images )
		{
			tileDefinition.images = [];
			for ( var ii = 0; ii < tile.images.length; ii++ )
			{
				var image = this.renderer.getImage( tile.images[ ii ].imageName, this.item );
				var def =
				{
					image: image,
					originalImage: this.resources.getImage( tile.images[ ii ].imageName ),					
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
					if ( tile.image )
					{
						// A single image, draw into background
						this.context.drawImage( tile.originalImage, x * this.tileWidth, y * this.tileHeight );
					}
					else
					{
						// Animated tile, creates the column of sprites
						for ( var m = 0; m < tile.images.length; m++ )
						{
							if ( !this.sprites[ y ] )
								this.sprites[ y ] = [];
							if ( !this.sprites[ y ][ x ] )
								this.sprites[ y ][ x ] = [];
							var spriteDefinition =
							{
								image: tile.images[ m ].image,
								sprite: new THREE.Sprite(),
								width: tile.images[ m ].width,
								height: tile.images[ m ].height,
								hotSpotX: tile.images[ m ].hotSpotX,
								hotSpotY: tile.images[ m ].hotSpotY,
								inScene: true
							};
							this.sprites[ y ][ x ].push( spriteDefinition );
							this.renderer.scene.add( spriteDefinition.sprite );
							this.spriteList.push( spriteDefinition );
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

	// Creates the background sprite
	this.backgroundTexture = this.renderer.getTexture( this.backgroundCanvas, this.item, false, this.item.z, this.width, this.height );
	this.backgroundMaterial = this.renderer.getSpriteMaterial( this.backgroundTexture, this.item, this.item.groundFlags );
	this.backgroundSprite = new THREE.Sprite( this.backgroundMaterial );
	this.renderer.scene.add( this.backgroundSprite );
	this.spriteList.push(
	{
		sprite: this.backgroundSprite,
		inScene: true
	} );
};
Friend.Renderers.Renderer_Three2D.RendererItemMap.onResize = function( width, height )
{
};


Friend.Renderers.Renderer_Three2D.RendererItemImage = function( renderer, item, flags )
{
	Object.assign( this, Friend.Renderers.Renderer_Three2D.RendererItemImage );
	this.renderer = renderer;
	this.item = item;
	this.name = item.name;
	this.className = 'Friend.Renderers.RendererThree2DRendererItemImage';
	this.utilities = this.renderer.utilities;
	this.resources = this.renderer.resources;
	this.image = false;
	this.utilities.setFlags( this, flags );
	this.imageName = false;
	this.sprite = new THREE.Sprite();
	this.sprite.name = this.item.identifier;
	this.checkImage( this.item.z );
	this.renderer.scene.add( this.sprite );
	this.inScene = true;
}
Friend.Renderers.Renderer_Three2D.RendererItemImage.update = function( flags )
{
	this.checkImage( flags.z * this.renderer.zoomZ );
	this.material.opacity = flags.alpha;
	this.sprite.rotation = flags.rotation * Friend.Tree.DEGREETORADIAN;
	this.sprite.scale.set( this.width * flags.zoomX, this.height * flags.zoomY, 1.0 );
	this.sprite.position.set( flags.x, flags.y, flags.z * this.renderer.zoomZ );
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_Three2D.RendererItemImage.destroy = function( flags )
{
	this.renderer.scene.remove( this.sprite );
};
Friend.Renderers.Renderer_Three2D.RendererItemImage.checkImage = function( z )
{
	if ( this.imageName != this.item.image || this.forceReset )
	{
		this.forceReset = false;
		this.imageName = this.item.image;
		this.image = this.renderer.getImage( this.item.image, this.item );
		this.width = this.image.width;
		this.height = this.image.height;
		this.texture = this.renderer.getTexture( this.image, this.item, false, z );
		this.material = this.renderer.getSpriteMaterial( this.texture, this.item );
		this.sprite.material = this.material;
	}
};
Friend.Renderers.Renderer_Three2D.RendererItemImage.doRefresh = function( flags )
{
	this.imageName = '';
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_Three2D.RendererItemImage.setVisible = function( flag )
{
	this.visible = flag;
	this.sprite.visible = flag;
};
Friend.Renderers.Renderer_Three2D.RendererItemImage.cull = function( flags )
{
	if ( this.item.x + this.item.width >= 0 && this.item.x < this.renderer.width )
	{
		if ( this.item.y + this.item.height >= 0 && this.item.y < this.renderer.height )
		{
			if ( !this.inScene )
			{
				this.inScene = true;
				//this.renderer.scene.add( this.sprite );
			}
			return;
		}
	}
	this.inScene = false;
	//this.renderer.scene.remove( this.sprite );
};
Friend.Renderers.Renderer_Three2D.RendererItemImage.getVector = function()
{
	var position = new THREE.Vector3();
	return position.getPositionFromMatrix( this.sprite.matrixWorld );
};
Friend.Renderers.Renderer_Three2D.RendererItemImage.reset = function()
{
	this.forceReset = true;
};
Friend.Renderers.Renderer_Three2D.RendererItemImage.onResize = function( width, height )
{
};

Friend.Renderers.Renderer_Three2D.RendererItemCanvas = function( renderer, item, flags )
{
	Object.assign( this, Friend.Renderers.Renderer_Three2D.RendererItemCanvas );
	Object.assign( this, Friend.Renderers.Utilities.Canvas2D );
	this.renderer = renderer;
	this.item = item;
	this.name = item.name;
	this.className = 'Friend.Renderers.RendererThree2DRendererItemCanvas';
	this.utilities = this.renderer.utilities;
	this.resources = this.renderer.resources;
	this.width = false;
	this.height = false;
	this.utilities.setFlags( this, flags );
	this.canvas = this.renderer.createCanvas( this.item.width, this.item.height, 'canvasItem', this.item, this );
	this.width = this.canvas.width;			// Canvas has been enlarged to multiple of 2
	this.height = this.canvas.height;
	this.sprite = new THREE.Sprite();
	this.sprite.name = this.item.identifier;
	this.checkImage( true );
	this.renderer.scene.add( this.sprite );
	this.inScene = true;
	this.toRefresh = true;
}
Friend.Renderers.Renderer_Three2D.RendererItemCanvas.reset = function()
{
	this.forceReset = true;
};
Friend.Renderers.Renderer_Three2D.RendererItemCanvas.onResize = function( width, height )
{
	this.width = width;
	this.height = height;
	this.canvas.width = width;
	this.canvas.height = height;
	this.forceReset = true;
};
Friend.Renderers.Renderer_Three2D.RendererItemCanvas.checkImage = function( flag )
{
	if ( flag || this.forceReset )
	{
		this.forceReset = false;
		this.texture = this.renderer.getTexture( this.canvas, this.item, false, this.item.z, this.item.width, this.item.height );
		this.material = this.renderer.getSpriteMaterial( this.texture, this.item );
		this.sprite.material = this.material;
	}
};

Friend.Renderers.Renderer_Three2D.RendererItemCanvas.update = function( flags )
{
	this.texture.needsUpdate = true;
	this.toRefresh = false;
	this.material.opacity = flags.alpha;
	this.material.rotation = flags.rotation * Friend.Tree.DEGREETORADIAN;
	this.sprite.scale.set( this.width * flags.zoomX, this.height * flags.zoomY, 1.0 );
	this.sprite.position.set( flags.x, flags.y, flags.z * this.renderer.zoomZ );
	this.renderer.refresh = true;
/*	
	this.sprite.updateMatrixWorld();
	toScreenXY( this.sprite.position, this.renderer.camera, document.getElementById( this.renderer.renderingId ) );

	function toScreenXY( position, camera, div ) 
	{
		var pos = position.clone();
		var projScreenMat = new THREE.Matrix4();
		projScreenMat.multiply( camera.projectionMatrix, camera.matrixWorldInverse );
		projScreenMat.multiplyVector3( pos );	
		var offset = findOffset(div);	
		var result =
		{
			x: ( pos.x + 1 ) * div.width / 2 + offset.left,
			y: ( - pos.y + 1) * div.height / 2 + offset.top
		};
		return result;
	};
	
	function findOffset(element) 
	{ 
		var pos = new Object();
		pos.left = pos.top = 0;        
		if (element.offsetParent)  
		{ 
			do  
			{ 
				pos.left += element.offsetLeft; 
				pos.top += element.offsetTop; 
			} while (element = element.offsetParent); 
		} 
		return pos;
	};
*/	
};
Friend.Renderers.Renderer_Three2D.RendererItemCanvas.destroy = function( flags )
{
	this.renderer.scene.remove( this.sprite );
};
Friend.Renderers.Renderer_Three2D.RendererItemCanvas.setVisible = function( flag )
{
	this.visible = flag;
	this.sprite.visible = flag;
};
Friend.Renderers.Renderer_Three2D.RendererItemCanvas.cull = function( flags )
{
	if ( this.item.x + this.item.width >= 0 && this.item.x < this.renderer.width )
	{
		if ( this.item.y + this.item.height >= 0 && this.item.y < this.renderer.height )
		{
			if ( !this.inScene )
			{
				this.inScene = true;
				//this.renderer.scene.add( this.sprite );
			}
			return;
		}
	}
	this.inScene = false;
	//this.renderer.scene.remove( this.sprite );
};
Friend.Renderers.Renderer_Three2D.RendererItemCanvas.doRefresh = function( flags )
{
	this.toRefresh = true;
	this.renderer.refresh = true;
};
Friend.Renderers.Renderer_Three2D.RendererItemCanvas.getVector = function()
{
	var position = new THREE.Vector3();

};
