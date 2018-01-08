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
 * Tree engine Three.js 2D renderer
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 11/10/2017
 */
Friend = window.Friend || {};
Friend.Renderers = Friend.Renderers || {};
Friend.Flags = Friend.Flags || {};

Friend.Renderers.RendererThree2D = function( flags )
{
	this.tree = flags.tree;
	this.className = 'Friend.Renderers.RendererThree2D';
	this.utilities = flags.utilities;
	this.resources = flags.resources;
	this.renderingId = false;
    this.width = false;
    this.height = false;
	this.anaglyph = false;
	this.stereoType = false;
	this.anaglyphMode = false;
	this.glassType = false;
	this.scaleRate = false;
	this.defaultFont = '12px Verdana';
	this.antialias = true;
	this.renderer = false;
	this.resizeFlags = false;
	this.utilities.forceFlags( flags, 'resizeFlags',
	{
		mode: 'keepProportions',
		borderColor: 0xFF0000
	} );
	this.utilities.forceFlags( flags.renderer, 
	{
		camera: 'orthographic', 
		cameraX: Friend.Flags.NOTDEFINED,
		cameraY: Friend.Flags.NOTDEFINED,
		cameraZ: Friend.Flags.NOTDEFINED,
		cameraAngle: Friend.Flags.NOTDEFINED,
		cameraAspect: Friend.Flags.NOTDEFINED,
		cameraFov: Friend.Flags.NOTDEFINED,
		cameraLeft: Friend.Flags.NOTDEFINED,
		cameraRight: Friend.Flags.NOTDEFINED,
		cameraTop: Friend.Flags.NOTDEFINED,
		cameraBottom: Friend.Flags.NOTDEFINED,
		cameraNear: Friend.Flags.NOTDEFINED,
		cameraFar: Friend.Flags.NOTDEFINED,
		cameraFilmGauge: Friend.Flags.NOTDEFINED,
		cameraFilmOffset: Friend.Flags.NOTDEFINED,
		cameraFocus: Friend.Flags.NOTDEFINED,
		cameraZoom: Friend.Flags.NOTDEFINED,
		renderZ: false,
		zPalette: false,
		zPaletteLength: 16,
		zColorMin: 0,
		zColorMax: 256,
		zPaletteMin: 0,
		zPaletteMax: 16,
		zBoxed: false,
		zPaletteDirection: Friend.Flags.DIRECTION_UP
	} );
	this.utilities.setFlags( this, flags );
	Object.assign( this, Friend.Renderers.RendererThree2D );
	this.rendererFlags = this.renderer;
    this.pile = [];
	this.items = {};
    this.textures = {};
    this.spriteMaterials = {};
	this.canvasses = {};
	this.images = {};
	this.imagesOriginals = {};
	this.renderFlags = {};
	this.renderToList = {};
    if ( !this.width )
        this.width = this.tree.width;
    if ( !this.height )
        this.height = this.tree.height;
	this.canvasLinked = false;
	this.refresh = true;	

	// Creates the scene
	this.scene = new THREE.Scene();

	// Setup the camera
	switch ( this.rendererFlags.camera )
	{
		case 'perspective':
			if ( this.rendererFlags.cameraX == Friend.Flags.NOTDEFINED )
				this.rendererFlags.cameraX = 0;
			if ( this.rendererFlags.cameraY == Friend.Flags.NOTDEFINED )
				this.rendererFlags.cameraY = 0;
			if ( this.rendererFlags.cameraZ == Friend.Flags.NOTDEFINED )
				this.rendererFlags.cameraZ = 1000;
			if ( this.rendererFlags.cameraFilmGauge == Friend.Flags.NOTDEFINED )
				this.rendererFlags.cameraFilmGauge = 35;
			if ( this.rendererFlags.cameraFilmOffset == Friend.Flags.NOTDEFINED )
				this.rendererFlags.cameraFilmOffset = 0;
			if ( this.rendererFlags.cameraFocus == Friend.Flags.NOTDEFINED )
				this.rendererFlags.cameraFocus = 10;
			if ( this.rendererFlags.cameraZoom == Friend.Flags.NOTDEFINED )
				this.rendererFlags.cameraZoom = 1;
			if ( this.rendererFlags.cameraAspect == Friend.Flags.NOTDEFINED )
				this.rendererFlags.cameraAspect = this.width / this.height;
			if ( this.rendererFlags.cameraFov == Friend.Flags.NOTDEFINED )
				this.rendererFlags.cameraFov = 2 * Math.atan( ( this.width / this.rendererFlags.cameraAspect ) / ( 2 * 1000 ) ) * ( 180 / Math.PI );
			this.camera = new THREE.PerspectiveCamera( this.renderFlags.cameraFov, this.renderFlags.cameraAspect, 0.1, 1000 );
			this.camera.fov = this.rendererFlags.cameraFov;
			this.camera.aspect = this.rendererFlags.cameraAspect;
			this.camera.filmGauge = this.rendererFlags.cameraFilmGauge;
			this.camera.filmOffset = this.rendererFlags.cameraFilmOffset;
			this.camera.focus = this.rendererFlags.cameraFocus;
			this.camera.zoom = this.rendererFlags.cameraZoom;
			this.camera.updateProjectionMatrix();
			this.exposed =
			[
				{ id: 'x', name: 'Camera X', type: 'number', value: Friend.Utilities.round( this.rendererFlags.cameraX, 2 ), step: 10, min: -100000, max: 100000 } ,
				{ id: 'y', name: 'Camera Y', type: 'number', value: Friend.Utilities.round( this.rendererFlags.cameraY, 2 ), step: 10, min: -100000, max: 100000 },
				{ id: 'z', name: 'Camera Z', type: 'number', value: Friend.Utilities.round( this.rendererFlags.cameraZ, 2 ), step: 10, min: -100000, max: 100000 },
				{ id: 'aspect', name: 'Camera aspect', type: 'number', value: Friend.Utilities.round( this.rendererFlags.cameraAspect, 2 ), step: 10, min: -100000, max: 100000 },
				{ id: 'fov', name: 'Camera fov', type: 'number', value: Friend.Utilities.round( this.rendererFlags.cameraFov, 2 ), step: 0.1, min: -1000, max: 1000 },
				{ id: 'filmGauge', name: 'Camera film gauge', type: 'number', value: Friend.Utilities.round( this.rendererFlags.cameraFilmGauge, 2 ), step: 1, min: -1000, max: 1000 },
				{ id: 'filmOffset', name: 'Camera film offset', type: 'number', value: Friend.Utilities.round( this.rendererFlags.cameraFilmOffset, 2 ), step: 1, min: -100000, max: 100000 },
				{ id: 'focus', name: 'Camera focus', type: 'number', value: Friend.Utilities.round( this.rendererFlags.cameraFocus, 2 ), step: 1, min: -1000, max: 1000 },
				{ id: 'zoom', name: 'Camera zoom', type: 'number', value: Friend.Utilities.round( this.rendererFlags.cameraZoom, 2 ), step: 0.1, min: -1000, max: 1000 }
			];	
					break;
		case 'orthographic':
		default:
			if ( this.rendererFlags.cameraX == Friend.Flags.NOTDEFINED )
				this.rendererFlags.cameraX = 0;
			if ( this.rendererFlags.cameraY == Friend.Flags.NOTDEFINED )
				this.rendererFlags.cameraY = 0;
			if ( this.rendererFlags.cameraZ == Friend.Flags.NOTDEFINED )
				this.rendererFlags.cameraZ = 1000;
			if ( this.rendererFlags.cameraLeft == Friend.Flags.NOTDEFINED )
				this.rendererFlags.cameraLeft = -this.width / 2;
			if ( this.rendererFlags.cameraRight == Friend.Flags.NOTDEFINED )
				this.rendererFlags.cameraRight = this.width / 2;
			if ( this.rendererFlags.cameraTop == Friend.Flags.NOTDEFINED )
				this.rendererFlags.cameraTop = -this.height / 2;
			if ( this.rendererFlags.cameraBottom == Friend.Flags.NOTDEFINED )
				this.rendererFlags.cameraBottom = this.height / 2;
			if ( this.rendererFlags.cameraNear == Friend.Flags.NOTDEFINED )
				this.rendererFlags.cameraNear = 1;
			if ( this.rendererFlags.cameraFar == Friend.Flags.NOTDEFINED )
				this.rendererFlags.cameraFar = 1000;
			this.camera = new THREE.OrthographicCamera( this.rendererFlags.cameraLeft, this.rendererFlags.cameraRight, -this.rendererFlags.cameraTop, -this.rendererFlags.cameraBottom, 1, this.rendererFlags.cameraZ );
			this.camera.updateProjectionMatrix();
			this.exposed =
			[
				{ id: 'x', name: 'Camera X', type: 'number', value: Friend.Utilities.round( this.rendererFlags.cameraX, 2 ), step: 10, min: -100000, max: 100000 } ,
				{ id: 'y', name: 'Camera Y', type: 'number', value: Friend.Utilities.round( this.rendererFlags.cameraY, 2 ), step: 10, min: -100000, max: 100000 },
				{ id: 'z', name: 'Camera Z', type: 'number', value: Friend.Utilities.round( this.rendererFlags.cameraZ, 2 ), step: 10, min: -100000, max: 100000 },
				{ id: 'left', name: 'Camera left', type: 'number', value: Friend.Utilities.round( this.rendererFlags.cameraLeft, 2 ), step: 10, min: -100000, max: 100000 },
				{ id: 'right', name: 'Camera right', type: 'number', value: Friend.Utilities.round( this.rendererFlags.cameraRight, 2 ), step: 10, min: -100000, max: 100000 },
				{ id: 'top', name: 'Camera top', type: 'number', value: Friend.Utilities.round( this.rendererFlags.cameraTop, 2 ), step: 10, min: -100000, max: 100000 },
				{ id: 'bottom', name: 'Camera bottom', type: 'number', value: Friend.Utilities.round( this.rendererFlags.cameraBottom, 2 ), step: 10, min: -100000, max: 100000 },
				{ id: 'near', name: 'Camera near', type: 'number', value: Friend.Utilities.round( this.rendererFlags.cameraNear, 2 ), step: 10, min: -100000, max: 100000 },
				{ id: 'far', name: 'Camera far', type: 'number', value: Friend.Utilities.round( this.rendererFlags.cameraFar, 2 ), step: 10, min: -100000, max: 100000 }
			];	
			break;
	}
	this.camera.position.set( this.rendererFlags.cameraX, this.rendererFlags.cameraY, this.rendererFlags.cameraZ );
	this.camera.lookAt( this.scene.position );
	this.zoomZ = 1;
	this.scene.add( this.camera );
	
	// Create the renderer
	this.renderer = new THREE.WebGLRenderer( { preserveDrawingBuffer: true } );
	this.renderer.setSize( this.width, this.height );
	this.renderer.setClearColor( this.resizeFlags.borderColor, 0.5 );

	if ( flags.renderingId )
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
Friend.Renderers.RendererThree2D.resize = function( width, height, originalWidth, originalHeight, mode )
{
	switch ( mode )
	{
		case 'adapt':
			this.canvas.width = width;
			this.canvas.height = height;
		    this.rendererFlags.cameraAspect = width / height;
			this.camera.aspect = this.rendererFlags.cameraAspect;
    		this.camera.updateProjectionMatrix();
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
		    this.rendererFlags.cameraAspect = newWidth / newHeight;
			this.camera.aspect = this.rendererFlags.cameraAspect;
    		this.camera.updateProjectionMatrix();
		    this.renderer.setSize( newWidth, newHeight );
			this.width = newWidth;
			this.height = newHeight;
			this.refresh = true;
			break;
	}
};
Friend.Renderers.RendererThree2D.changeExposed = function( info )
{
	switch ( info.id )
	{
		case 'x':
			this.rendererFlags.cameraX = info.value;
			this.camera.position.set( this.rendererFlags.cameraX, this.rendererFlags.cameraY, this.rendererFlags.cameraZ );
			break;
		case 'y':
			this.rendererFlags.cameraY = info.value;
			this.camera.position.set( this.rendererFlags.cameraX, this.rendererFlags.cameraY, this.rendererFlags.cameraZ );
			break;
		case 'z':
			this.rendererFlags.cameraZ = info.value;
			this.camera.position.set( this.rendererFlags.cameraX, this.rendererFlags.cameraY, this.rendererFlags.cameraZ );
			break;
		case 'left':
			this.rendererFlags.cameraNear = info.value;
			this.camera.near = info.value;
			break;
		case 'right':
			this.rendererFlags.cameraRight = info.value;
			this.camera.right = info.value;
			break;
		case 'top':
			this.rendererFlags.cameraTop = info.value;
			this.camera.top = info.value;
			break;
		case 'bottom':
			this.rendererFlags.cameraBottom = info.value;
			this.camera.bottom = info.value;
			break;
		case 'near':
			this.rendererFlags.cameraNear = info.value;
			this.camera.near = info.value;
			break;
		case 'far':
			this.rendererFlags.cameraFar = info.value;
			this.camera.far = info.value;
			break;
		case 'aspect':
			this.rendererFlags.cameraAspect = info.value;
			this.camera.aspect = info.value;
			break;
		case 'fov':
			this.rendererFlags.cameraFov = info.value;
			this.camera.fov = info.value;
			break;
		case 'filmGauge':
			this.rendererFlags.cameraFilmGauge = info.value;
			this.camera.filmGauge = info.value;
			break;
		case 'filmOffset':
			this.rendererFlags.cameraFilmOffset = info.value;
			this.camera.filmOffset = info.value;
			break;
		case 'focus':
			this.rendererFlags.cameraFocus = info.value;
			this.camera.focus = info.value;
			break;
		case 'zoom':
			this.rendererFlags.cameraZoom = info.value;
			this.camera.zoom = info.value;
			break;
	}
	this.camera.updateProjectionMatrix();
};
Friend.Renderers.RendererThree2D.setRenderZ = function( onOff )
{
	if ( onOff != this.rendererFlags.renderZ )
	{
		this.rendererFlags.renderZ = onOff;
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
	return this.rendererFlags.renderZ;
};
Friend.Renderers.RendererThree2D.createZPalette = function()
{
	// Render Z map? Creates the palette
	if ( this.rendererFlags.renderZ )
	{
		if ( !this.rendererFlags.zPalette )
		{
			this.rendererFlags.zPalette = [];
			for ( var z = 0; z < this.rendererFlags.zPaletteLength; z++)
			{
				var gray;
				var colorWidth = ( this.rendererFlags.zColorMax - this.rendererFlags.zColorMin ) / this.rendererFlags.zPaletteLength;
				if ( this.rendererFlags.zPaletteDirection == Friend.Flags.DIRECTION_UP )
					gray = Math.floor( ( z / this.rendererFlags.zPaletteLength ) * this.rendererFlags.zPaletteLength ) * colorWidth;
				else
					gray = Math.floor( ( ( this.rendererFlags.zPaletteLength - z - 1 ) / this.rendererFlags.zPaletteLength ) * this.rendererFlags.zPaletteLength ) * colorWidth;
				var color = Friend.Utilities.convertToHex( gray, 2 );
				color = '#' + color + color + color;
				this.rendererFlags.zPalette[ z ] = color;
			}
		}
	}
};
Friend.Renderers.RendererThree2D.getScreenCoordinates = function( item )
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
Friend.Renderers.RendererThree2D.startRenderTo = function( name, flags )
{
	flags.name = name;
	var self = this;
	this.setImage( flags.destination, function()
	{
		self.renderToList[ name ] = flags;
		self.renderToCount++;
	} );
};
Friend.Renderers.RendererThree2D.stopRenderTo = function( id )
{
	var renderTo = this.renderToList[ id ];
	if ( renderTo )
	{
		if ( renderTo.deleteImageOnStop )
			this.resources.deleteImage( name );
		this.renderToList[ id ] = false;
		this.renderToList = Friend.Utilities.cleanArray( this.renderToList );
		this.renderToCount--;
	}
};
Friend.Renderers.RendererThree2D.attachCanvas = function( renderingId )
{
	this.renderingId = renderingId;
	var container = document.getElementById( renderingId );
    container.appendChild( this.renderer.domElement );
	this.canvasLinked = true;
	this.refresh = true;
	this.canvas = this.renderer.domElement;
};
Friend.Renderers.RendererThree2D.add = function( item, rendererItem )
{
	this.items[ item.identifier ] = rendererItem;
};
Friend.Renderers.RendererThree2D.clear = function()
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
Friend.Renderers.RendererThree2D.refreshItem = function( item )
{
	if ( this.items[ item.identifier ] )
		this.items[ item.identifier ].doRefresh();
};
Friend.Renderers.RendererThree2D.startDestroy = function()
{
};
Friend.Renderers.RendererThree2D.destroy = function( item )
{
	if ( this.items[ item.identifier ] )
	{
		this.items[ item.identifier ].destroy();
		this.items[ item.identifier ] = false;
	}
};
Friend.Renderers.RendererThree2D.endDestroy = function()
{
	this.items = this.utilities.cleanArray( this.items );
};
Friend.Renderers.RendererThree2D.setImage = function( srcImage, callback )
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
Friend.Renderers.RendererThree2D.getImage = function( name, item )
{
	return this.images[ name ];
};
Friend.Renderers.RendererThree2D.getOriginalImage = function( name, item )
{
	return this.imagesOriginals[ name ];
};
Friend.Renderers.RendererThree2D.getTexture = function( imageOrCanvas, item, force, z, width, height )
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
		if ( this.rendererFlags.renderZ )
		{
			var canvas = document.createElement( 'canvas' );
			canvas.width = imageOrCanvas.width;
			canvas.height = imageOrCanvas.height;
			var zPalette = Math.floor( this.rendererFlags.zPalette.length * ( z - this.rendererFlags.zPaletteMin ) / ( this.rendererFlags.zPaletteMax - this.rendererFlags.zPaletteMin ) );
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
			context.fillStyle = this.rendererFlags.zPalette[ zPalette ];
			if ( this.rendererFlags.zBoxed || isCanvas )
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
							context.fillRect( deltaX + x, deltaY + y, 16, 16 );
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
Friend.Renderers.RendererThree2D.getSpriteMaterial = function( texture, item, force )
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
Friend.Renderers.RendererThree2D.getCanvas = function( id )
{
	var canvas = this.canvasses[ id ];
	if ( canvas )
		return canvas;
	return false;
};
Friend.Renderers.RendererThree2D.createCanvas = function( width, height, name, item, rendererItem, force )
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

Friend.Renderers.RendererThree2D.setFontSize = function( font, size )
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

Friend.Renderers.RendererThree2D.getFontSize = function( font )
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
Friend.Renderers.RendererThree2D.addColor = function( color, modification, direction )
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

Friend.Renderers.RendererThree2D.measureText = function( text, font )
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

Friend.Renderers.RendererThree2D.getRenderFlags = function( extraFlags )
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
Friend.Renderers.RendererThree2D.renderStart = function( flags )
{
};
Friend.Renderers.RendererThree2D.updateItem = function( item )
{
	if ( item.rendererItems )
	{
		var rendererItem = item.rendererItems[ this.className ];
		if ( rendererItem )
			rendererItem.needsUpdate = true;
	}
};

Friend.Renderers.RendererThree2D.renderUp = function( flags, item )
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
		flags.rendererItem = new Friend.Renderers.RendererThree2D[ 'RendererItem' + item.rendererType ]( this, item, flags );
		item.rendererItems[ this.className ] = flags.rendererItem;
		this.add( item, flags.rendererItem );
		flags.rendererItem.visible = true;
	}

	// Store for way down and for fast rendering
	this.pile.push( Object.assign( {}, flags ) );
	this.renderFlags[ item.identifier ] = Object.assign( {}, flags );

	// Calculates coordinates
	flags = this.renderPrepare( flags, item );

	return flags;
};
Friend.Renderers.RendererThree2D.renderPrepare = function( flags, item )
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

	/*
	if ( flags.noPerspective > 0 )
		flags.noPerspective--;
	if ( flags.noPerspective <= 0 )
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
	else
	{
		// No perspective for the children objects
		flags.perspective = 0;
		if ( typeof item.noPerspective != 'undefined' )
			flags.noPerspective = item.noPerspective;
	}
	*/
	flags.xReal += xx;
	flags.yReal += yy;
	item.rect.x = flags.xReal;
	item.rect.y = flags.yReal;
	item.rect.width = item.width;
	item.rect.height = item.height;
	item.thisRect.x = 0;4
	item.thisRect.y = 0;
	item.thisRect.width = item.width;
	item.thisRect.height = item.height;
	if ( !item.noRotation )
		flags.rotation += item.rotation;
	else
		flags.rotation = 0;
	flags.zoomX *= item.zoomX;
	flags.zoomY *= item.zoomY;
	if ( flags.zMultiplier )
		flags.z = ( item.z - flags.zBase ) * flags.zMultiplier;
	else
		flags.z = item.z;
	if ( !this.rendererFlags.renderZ )
		flags.alpha *= item.alpha;
	else
		flags.alpha = 1;

	if ( flags.rendererItem )
	{
		// Context = rendererItem
		flags.context = flags.rendererItem;

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

Friend.Renderers.RendererThree2D.renderDown = function( flags, item )
{
	item.refresh = false;
 	return this.pile.pop();
};
Friend.Renderers.RendererThree2D.renderUpFast = function( flags, item )
{
	if ( this.renderFlags[ item.identifier ] )
	{
		flags = Object.assign( {}, this.renderFlags[ item.identifier ] );
		flags = this.renderPrepare( flags, item );
		return flags;
	}
	return false;
};
Friend.Renderers.RendererThree2D.renderDownFast = function( flags, item )
{
	item.refresh = false;
	return flags;
};
Friend.Renderers.RendererThree2D.renderEnd = function ()
{
	this.updating = true;
	if ( this.refresh )
	{
		// Rendering
	    this.renderer.render( this.scene, this.camera );

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
			console.log( 'RendererThree2D: Illegal number of renderUp and renderDown.' );
			this.pile = [];				// Security, does not pile up!
		}

		// Refresh done!
		this.refresh = false;
	}
	this.updating = false;
};
Friend.Renderers.RendererThree2D.postProcess = function( imageOrCanvas, item )
{
};

// Canvas function for RendererItemCanvas
Friend.Renderers.RendererThree2D.Canvas2D =
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
		flags.renderer.refresh = true;
	},
	fillRect: function( flags, x, y, width, height )
	{
 		this.context.fillRect( x, y, width, height );
		flags.renderer.refresh = true;
		this.toRefresh = true;
	},
	clearRect: function( flags, x, y, width, height )
	{
		this.updating = false;
 		this.context.clearRect( x, y, width, height );
		flags.renderer.refresh = true;
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
		flags.renderer.refresh = true;
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



Friend.Renderers.RendererThree2D.RendererItemSprite = function( renderer, item, flags )
{
	Object.assign( this, Friend.Renderers.RendererThree2D.RendererItemSprite );
	this.renderer = renderer;
	this.item = item;
	this.name = item.name;
	this.className = 'Friend.Renderers.RendererItemSprite';
	this.utilities = this.renderer.utilities;
	this.resources = this.renderer.resources;
	this.utilities.setFlags( this, flags );
	this.image = false;
	this.sprite = new THREE.Sprite();
	this.sprite.name = this.item.identifier;
	this.checkImage( this.item.z );
	this.renderer.scene.add( this.sprite );
	this.inScene = true;
}
Friend.Renderers.RendererThree2D.RendererItemSprite.update = function( flags )
{
	this.checkImage( flags.z * this.renderer.zoomZ );
	if ( this.material )
	{
		this.cull( flags );
		this.material.opacity = flags.alpha;
		this.material.rotation = flags.rotation * Friend.Flags.DEGREETORADIAN;
		this.sprite.scale.set( this.width * flags.zoomX, this.height * flags.zoomY, 1.0 );
		this.sprite.position.set( flags.x, flags.y, flags.z * this.renderer.zoomZ );
		this.renderer.refresh = true;
	}
};
Friend.Renderers.RendererThree2D.RendererItemSprite.destroy = function( flags )
{
	this.renderer.scene.remove( this.sprite );
};
Friend.Renderers.RendererThree2D.RendererItemSprite.setVisible = function( flag )
{
	this.visible = flag;
	this.sprite.visible = flag;
};
Friend.Renderers.RendererThree2D.RendererItemSprite.checkImage = function( z )
{
	if ( this.item.image && ( this.image != this.item.image || this.needsUpdate ) || this.forceReset )
	{
		this.forceReset = false;
		this.needsUpdate = false;
		this.image = this.item.image;
		this.renderImage = this.renderer.getImage( this.item.image, this.item );
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
Friend.Renderers.RendererThree2D.RendererItemSprite.cull = function( flags )
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
Friend.Renderers.RendererThree2D.RendererItemSprite.doRefresh = function( flags )
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
Friend.Renderers.RendererThree2D.RendererItemSprite.getVector = function()
{
	var position = new THREE.Vector3();
	return position.getPositionFromMatrix( this.sprite.matrixWorld );
};
Friend.Renderers.RendererThree2D.RendererItemSprite.reset = function()
{
	this.forceReset = true;
};




Friend.Renderers.RendererThree2D.RendererItemSprite3D = function( renderer, item, flags )
{
	Object.assign( this, Friend.Renderers.RendererThree2D.RendererItemSprite3D );
	this.renderer = renderer;
	this.item = item;
	this.name = item.name;
	this.className = 'Friend.Renderers.RendererThree2D.RendererItemSprite3D';
	this.utilities = this.renderer.utilities;
	this.resources = this.renderer.resources;
	this.image = false;
	this.utilities.setFlags( this, flags );
	this.imageName = false;
	this.layerList = {};
	this.sprites = [];

	this.maxLayers = 0;
	this.checkImages( this.item.z );
}
Friend.Renderers.RendererThree2D.RendererItemSprite3D.update = function( flags )
{
	this.checkImages();
	this.cull( flags );

	var z = 0;
	var layerList = this.layerList[ this.item.image ];
	if ( layerList )
	{
		// All the layers one above the other by changing the Z order up, and adding perspective
		for ( z = 0; z < layerList.length && z < this.maxLayers; z++ )
		{
			var layer = layerList[ z ];
			var sprite = this.sprites[ z ].sprite;
			layer.material.rotation = flags.rotation * Friend.Flags.DEGREETORADIAN;
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
Friend.Renderers.RendererThree2D.RendererItemSprite3D.destroy = function( flags )
{
	for ( var l = 0; l < this.maxLayers; l++ )
		this.renderer.scene.remove( this.sprites[ l ].sprite );
};
Friend.Renderers.RendererThree2D.RendererItemSprite3D.setVisible = function( flag )
{
	if ( this.visible != flag )
	{
		this.visible = flag;
		for ( var l = 0; l < this.maxLayers; l++ )
			this.sprites[ l ].sprite.visible = flag;
	}
};
Friend.Renderers.RendererThree2D.RendererItemSprite3D.cull = function( flag )
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
Friend.Renderers.RendererThree2D.RendererItemSprite3D.checkImages = function( zBase )
{
	var maxLayers = this.maxLayers;
	if ( !this.layerList[ this.item.image ] || this.forceReset )
	{
		this.forceReset = false;
		this.layerList[ this.item.image ] = [];
		var imageList = this.resources.getImage( this.item.image, this.item );
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
			this.layerList[ this.item.image ].push( layer );
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
	return this.layerList[ this.image.name ];
}
Friend.Renderers.RendererThree2D.RendererItemSprite3D.doRefresh = function( flags )
{
	this.layerList[ this.item.image ] = [];
	this.renderer.refresh = true;
};
Friend.Renderers.RendererThree2D.RendererItemSprite3D.getVector = function()
{
	var position = new THREE.Vector3();
	return position.getPositionFromMatrix( this.sprites[ 0 ].sprite.matrixWorld );
};
Friend.Renderers.RendererThree2D.RendererItemSprite3D.reset = function()
{
	this.forceReset = true;
};

Friend.Renderers.RendererThree2D.RendererItemMap = function( renderer, item, flags )
{
	Object.assign( this, Friend.Renderers.RendererThree2D.RendererItemMap );
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
	Object.assign( this, Friend.Renderers.RendererThree2D.Canvas2D );
	this.reset();
	return this;
}
Friend.Renderers.RendererThree2D.RendererItemMap.update = function( flags )
{
	/*if ( this.renderer.tree.controller.isDown( Friend.Flags.UP ) )
		this.yDebug--;
	if ( this.renderer.tree.controller.isDown( Friend.Flags.DOWN ) )
		this.yDebug++;
	if ( this.renderer.tree.controller.isDown( Friend.Flags.RIGHT ) )
		this.xDebug--;
	if ( this.renderer.tree.controller.isDown( Friend.Flags.LEFT ) )
		this.xDebug++;
	*/
	var offsetX = this.item.offsetX;
	var offsetY = this.item.offsetY;

	// Position the background
	var x = flags.xReal + this.backgroundCanvas.width / 2 - ( this.backgroundCanvas.width - this.width ) / 2 - this.renderer.width / 2;
	var y = flags.yReal + this.renderer.height / 2 - this.backgroundCanvas.height / 2 + ( this.backgroundCanvas.height - this.height ) / 2;
	this.backgroundSprite.rotation = flags.rotation * Friend.Flags.DEGREETORADIAN;
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
				//x1 += ( x1 - flags.xCenter ) * flags.perspective * z;
				//y1 += ( y1 - flags.yCenter ) * flags.perspective * z;
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
Friend.Renderers.RendererThree2D.RendererItemMap.destroy = function( flags )
{
	for ( var s = 0; s < this.spriteList.length; s++ )
		this.renderer.scene.remove( this.spriteList[ s ].sprite );
};
Friend.Renderers.RendererThree2D.RendererItemMap.setVisible = function( flag )
{
	if ( this.visible != flag )
	{
		this.visible = flag;
		for ( var s = 0; s < this.spriteList.length; s++ )
			this.spriteList[ s ].sprite.visible = flag;
	}
};
Friend.Renderers.RendererThree2D.RendererItemMap.doRefresh = function()
{
	this.renderer.refresh = true;
};
Friend.Renderers.RendererThree2D.RendererItemMap.getVector = function()
{
	var position = new THREE.Vector3();
	return position.getPositionFromMatrix( this.backgroundSprite.matrixWorld );
};
Friend.Renderers.RendererThree2D.RendererItemMap.reset = function()
{
	// Computes the tiles definition
	this.tiles = [];
    for ( var i = 0; i < this.item.tiles.length; i ++ )
    {
		var tile = this.item.tiles[ i ];
		var tileDefinition = {};
		if ( tile.image )
		{
			tileDefinition.originalImage = this.resources.getImage( tile.image );
			tileDefinition.image = this.renderer.getImage( tile.image, this.item );
			tileDefinition.width = tileDefinition.image.width;
			tileDefinition.height = tileDefinition.image.height;
		}
		else if ( tile.images )
		{
			tileDefinition.images = [];
			for ( var ii = 0; ii < tile.images.length; ii++ )
			{
				var image = this.renderer.getImage( tile.images[ ii ].image, this.item );
				var def =
				{
					image: image,
					originalImage: this.resources.getImage( tile.images[ ii ].image ),					
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


Friend.Renderers.RendererThree2D.RendererItemImage = function( renderer, item, flags )
{
	Object.assign( this, Friend.Renderers.RendererThree2D.RendererItemImage );
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
Friend.Renderers.RendererThree2D.RendererItemImage.update = function( flags )
{
	this.checkImage( flags.z * this.renderer.zoomZ );
	this.material.opacity = flags.alpha;
	this.sprite.rotation = flags.rotation * Friend.Flags.DEGREETORADIAN;
	this.sprite.scale.set( this.width * flags.zoomX, this.height * flags.zoomY, 1.0 );
	this.sprite.position.set( flags.x, flags.y, flags.z * this.renderer.zoomZ );
	this.renderer.refresh = true;
};
Friend.Renderers.RendererThree2D.RendererItemImage.destroy = function( flags )
{
	this.renderer.scene.remove( this.sprite );
};
Friend.Renderers.RendererThree2D.RendererItemImage.checkImage = function( z )
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
Friend.Renderers.RendererThree2D.RendererItemImage.doRefresh = function( flags )
{
	this.imageName = '';
	this.renderer.refresh = true;
};
Friend.Renderers.RendererThree2D.RendererItemImage.setVisible = function( flag )
{
	this.visible = flag;
	this.sprite.visible = flag;
};
Friend.Renderers.RendererThree2D.RendererItemImage.cull = function( flags )
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
Friend.Renderers.RendererThree2D.RendererItemImage.getVector = function()
{
	var position = new THREE.Vector3();
	return position.getPositionFromMatrix( this.sprite.matrixWorld );
};
Friend.Renderers.RendererThree2D.RendererItemImage.reset = function()
{
	this.forceReset = true;
};

Friend.Renderers.RendererThree2D.RendererItemCanvas = function( renderer, item, flags )
{
	Object.assign( this, Friend.Renderers.RendererThree2D.RendererItemCanvas );
	Object.assign( this, Friend.Renderers.RendererThree2D.Canvas2D );
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
	this.zPrevious = Friend.Flags.NOTINITIALIZED;
	this.checkImage( this.item.z );
	this.renderer.scene.add( this.sprite );
	this.inScene = true;
	this.toRefresh = true;
}
Friend.Renderers.RendererThree2D.RendererItemCanvas.reset = function()
{
	this.forceReset = true;
};
Friend.Renderers.RendererThree2D.RendererItemCanvas.checkImage = function( z )
{
	if ( z != this.zPrevious || this.forceReset )
	{
		this.forceReset = false;
		this.zPrevious = z;
		this.texture = this.renderer.getTexture( this.canvas, this.item, false, this.item.z, this.item.width, this.item.height );
		this.material = this.renderer.getSpriteMaterial( this.texture, this.item );
		this.sprite.material = this.material;
	}
};

Friend.Renderers.RendererThree2D.RendererItemCanvas.update = function( flags )
{
	this.texture.needsUpdate = true;
	this.toRefresh = false;
	this.material.opacity = flags.alpha;
	this.material.rotation = flags.rotation * Friend.Flags.DEGREETORADIAN;
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
Friend.Renderers.RendererThree2D.RendererItemCanvas.destroy = function( flags )
{
	this.renderer.scene.remove( this.sprite );
};
Friend.Renderers.RendererThree2D.RendererItemCanvas.setVisible = function( flag )
{
	this.visible = flag;
	this.sprite.visible = flag;
};
Friend.Renderers.RendererThree2D.RendererItemCanvas.cull = function( flags )
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
Friend.Renderers.RendererThree2D.RendererItemCanvas.doRefresh = function( flags )
{
	this.toRefresh = true;
	this.renderer.refresh = true;
};
Friend.Renderers.RendererThree2D.RendererItemCanvas.getVector = function()
{
	var position = new THREE.Vector3();

};
