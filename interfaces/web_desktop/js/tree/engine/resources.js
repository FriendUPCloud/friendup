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
 * Tree engine resources management
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 22/08/2017
 */
Friend = window.Friend || {};
Friend.Resources = Friend.Resources || {};
Friend.Flags = Friend.Flags || {};

/**
 * Resources constructor
 *
 * @param (object) flags creation flags
 *
 * Flags
 * tree: (object) the Tree object
 */
Friend.Resources.Manager = function ( flags )
{
	this.tree = flags.tree;
	this.tree.utilities.setFlags( this, flags );
	this.images = { };
	this.sounds = { };
	this.toLoad = 0;
	this.loaded = 0;
	Object.assign( this, Friend.Resources.Manager );

	// Try to load the icon of the application
	var self = this;
	this.loadSingleImage( 'applicationIcon', 'Progdir:icon.png', Friend.Tree.HOTSOPT_LEFTTOP, function( image )
	{
		self.applicationIcon = image;
	} );
	return this;
};
Friend.Resources.Manager.isLoaded = function ()
{
	return this.loaded == this.toLoad;
},
Friend.Resources.Manager.getLoadPercent = function ()
{
	return ( this.loaded / this.toLoad ) * 100;
},
Friend.Resources.Manager.checkCompletion = function ()
{
	if ( this.caller )
	{
		if ( this.loaded == this.toLoad )
		{
			if ( this.loadCompleted )
			{
				this.loadCompleted.apply( this.caller, [ this.loaded ] );
			}
		}
		else
		{
			if ( this.loadProgress )
				this.loadProgress.apply( this.caller, [ ( this.loaded / this.toLoad ) * 100 ] );
		}
	}
	return true;
},
/**
 * loadImages
 *
 * Loads an image or a list of images
 * Calls the Tree loadProgress function after loading each image
 * Calls the Tree loadCompleted function when finished
 *
 * @param (string or array of objects) imageList the images to load
 *        imageList.name: name of the image
 *        imageList.path: the path to the image file
 *        imageList.hotSpot: (optional) the Tree hotSpot definitiion
 *        imageList.hotSpotX: (optional) the horizontal hotSpot
 *        imageList.hotSpotY: (optional) the vbertical hotSpot
 */
 Friend.Resources.Manager.loadImages = function ( imageList, flags )
 {
	 this.caller = false;
	 this.loadCompleted = false;
	 this.loadProgress = false;
	 this.loadError = false;
	 Friend.Tree.Utilities.setFlags( this, flags );

	 var self = this;
	 this.imageDefinitions = {};

	 // Calculate total number of images to load
	 for ( var i = 0; i < imageList.length; i ++ )
	 {
		 if ( typeof imageList[ i ].start != 'undefined' )
			 this.toLoad += imageList[ i ].end - imageList[ i ].start + 1;
		 else
			 this.toLoad ++;
	 }

	 // Load all the images
	 var image;
	 var comboImage;
	 for ( i = 0; i < imageList.length; i ++ )
	 {
		 var imageDef = imageList[ i ];

		 // An list of numbered images?
		 if ( imageDef.start )
		 {
			 comboImage = [];
			 self.images[ imageDef.name ] =
			 {
				 name: imageDef.name,
				 images: comboImage
			 };
			 var dot = imageDef.path.lastIndexOf( '.' );
			 for ( var z = imageDef.start; z <= imageDef.end; z++ )
			 {
				var transmit =
				{
					imageDef: imageDef,
					comboImage: comboImage,
					z: z
				}
				var file = new File( imageDef.path.substring( 0, dot ) + z + imageDef.path.substring( dot ) );
				file.transmit = transmit;
				file.onLoad = function( data )
				{
					var image = new Image();
					image.transmit = this.transmit;
					image.onload = function()
					{
						var def = this.transmit.imageDef;
						var combo = this.transmit.comboImage;
						var z = this.transmit.z;
						var name = def.name + z;
						this.treeName = name;
						this.hotSpot = def.hotSpot;
						this.hotSpotX = 0;
						this.hotSpotY = 0;
						if ( typeof imageDef.hotSpotX != 'undefined' )
							this.hotSpotX = def.hotSpotX;
						if ( typeof imageDef.hotSpotY != 'undefined' )
							this.hotSpotY = def.hotSpotY;

						combo.push(
						{
							name: name,
							image: image,
							z: z - def.start
						} );
						self.images[ name ] =
						{
							name: name,
							image: image
						};
						self.finishImage( image );
					}
					image.src = imageUrl;
				}
				file.load( 'rb' );
			}
		}
		else
		{
			// A single image
			var file = new File( imageDef.path );
			file.transmit = imageDef;
			file.onLoad = function( data )
			{
				// Check for error
				if ( typeof data == 'string' )
				{
					if( str.substr( 0, 19 ) == 'fail<!--separate-->' )
					{
						return;
					}
				}

				// Create the blob, load the image
				var arrayBufferView = new Uint8Array( data );
				var blob = new Blob( [ arrayBufferView ], { type: "image/jpeg" } );
				var urlCreator = window.URL || window.webkitURL;
				var imageUrl = urlCreator.createObjectURL( blob );
				var image = new Image();
				image.transmit = this.transmit;
				image.onload = function()
				{
					var def = this.transmit;
					this.treeName = def.name;
					this.treeWidth = def.width;
					this.treeHeight = def.height;
					this.hotSpot = def.hotSpot;
					this.hotSpotX = 0;
					this.hotSpotY = 0;
					if ( typeof def.hotSpotX != 'undefined' )
						this.hotSpotX = def.hotSpotX;
					if ( typeof def.hotSpotY != 'undefined' )
						this.hotSpotY = def.hotSpotY;

					self.images[ def.name ] =
					{
						name: def.name,
						image: this
					};
					self.finishImage( this );
				}
				image.src = imageUrl;
			};
			file.load( 'rb' );
		}
	}
	return true;
};
Friend.Resources.Manager.finishImage = function ( image, callback )
{
	var self = this;
	if ( typeof image.treeWidth != 'undefined' && typeof image.treeHeight != 'undefined' )
	{
		if ( image.treeWidth != image.width || image.treeHeight != image.height )
		{
			var canvas = document.createElement( 'canvas' );
			canvas.width = image.treeWidth;
			canvas.height = image.treeHeight;
			var context = canvas.getContext( '2d' );
			context.drawImage( image, 0, 0, image.treeWidth, image.treeHeight );
			newImage = new Image();
			newImage.treeName = image.treeName;
			newImage.hotSpot = image.hotSpot;
			newImage.hotSpotX = image.hotSpotX;
			newImage.hotSpotY = image.hotSpotY;
			self.images[ image.treeName ].image = newImage;
			newImage.onload = onLoaded;
			newImage.src = canvas.toDataURL( "image/png" );
			return;
		}
	}
	finishIt( image );

	// When loaded
	function onLoaded()
	{
		finishIt( this );
	}
	function finishIt( image )
	{
		if ( typeof image.hotSpot != 'undefined' )
		{
			self.setImageHotSpot( image, image.hotSpot );
		}

		// Adapt the image to the renderer
		var count = 0;
		for ( var r = 0; r < self.tree.renderers.length; r++ )
		{
			var renderer = self.tree.renderers[ r ];
			count++;
			renderer.setImage( image, function( image )
			{
				Friend.Tree.log( self, { infos: 'Loaded image: ' + image.treeName, level: Friend.Tree.ERRORLEVEL_LOW } );
				count--;
				if ( count == 0 )
				{
					if ( !callback )
					{
						// One more loaded, check for completion
						self.loaded ++;
						self.checkCompletion();
					}
					else
					{
						callback( image );
					}
				}
			} );
		}
	}
};
Friend.Resources.Manager.loadSingleImage = function( name, path, hotSpot, callback, width, height )
{
	var self = this;
	if ( callback )
	{
		// Image already loaded?
		if ( self.images[ name ] )
		{
			callback( self.images[ name ] );
			return;
		}

		image = new Image();
		self.images[ name ] =
		{
			name: name,
			image: image
		};
		image.treeName = name;
		if ( typeof width != 'undefined' )
			image.treeWidth = width;
		if ( typeof height != 'undefined' )
			image.treeHeight = height;
		image.hotSpot = hotSpot;
		image.onload = onLoaded;
		image.src = this.tree.utilities.getPath( path );

		function onLoaded()
		{
			self.finishImage( this, callback );
		}
	}
};
Friend.Resources.Manager.getApplicationIcon = function ()
{
	return this.applicationIcon; 	// Can be undefined at start, or if icon is not present!
};

Friend.Resources.Manager.setImageHotSpot = function ( image, hotSpot )
{
	switch ( hotSpot )
	{
		case Friend.Tree.HOTSPOT_LEFTTOP:
			image.hotSpotX = 0;
			image.hotSpotY = 0;
			break;
		case Friend.Tree.HOTSPOT_CENTERTOP:
			image.hotSpotX = image.width / 2;
			image.hotSpotY = 0;
			break;
		case Friend.Tree.HOTSPOT_RIGHTTOP:
			image.hotSpotX = image.width;
			image.hotSpotY = 0;
			break;
		case Friend.Tree.HOTSPOT_LEFTCENTER:
			image.hotSpotX = 0;
			image.hotSpotY = image.height / 2;
			break;
		case Friend.Tree.HOTSPOT_CENTER:
			image.hotSpotX = image.width / 2;
			image.hotSpotY = image.height / 2;
			break;
		case Friend.Tree.HOTSPOT_RIGHTCENTER:
			image.hotSpotX = image.width;
			image.hotSpotY = image.height / 2;
			break;
		case Friend.Tree.HOTSPOT_LEFTBOTTOM:
			image.hotSpotX = 0;
			image.hotSpotY = image.height;
			break;
		case Friend.Tree.HOTSPOT_CENTERBOTTOM:
			image.hotSpotX = image.width / 2;
			image.hotSpotY = image.height;
			break;
		case Friend.Tree.HOTSPOT_RIGHTBOTTOM:
			image.hotSpotX = image.width;
			image.hotSpotY = image.height;
			break;
	}
	// Default hotSpot is in the center
	if ( typeof image.hotSpotX == 'undefined' )
		image.hotSpotX = 0;
	if ( typeof image.hotSpotY == 'undefined' )
		image.hotSpotY = 0;
	image.hotSpot = hotSpot;
};

// Returns the path of all the images
Friend.Resources.Manager.getImagesPaths = function ( )
{
	var result = [];
	for ( var i in this.images )
	{
		if ( this.images[ i ].image )
			result.push( this.images[ i ].image.src );
		else
		{
			for ( var ii = 0; ii < this.image[ i ].images.length; ii++ )
			{
				result.push( this.images[ i ].images[ ii ].image.src );
			}
		}
	}
	return result;
};

/**
 * loadSounds
 *
 * Loads a sound or a list of sounds
 * Calls the Tree loadProgress function after loading each sound
 * Calls the Tree loadCompleted function when finished
 *
 * @param (string or array of objects) soundList the images to load
 *        soundList.name: name of the sound
 *        sounhdList.path: the path to the sound file
 *        soundList.volume (optional) default volume of this sound (from 0 to 1)
 *        soundList.loops: (optional) loop the sound at the end ( <=0: infinite, >0: number of loops, default = 1)
 */
Friend.Resources.Manager.loadSounds = function ( soundList, flags )
{
	this.caller = false;
	this.loadCompleted = false;
	this.loadProgress = false;
	this.loadError = false;
	Friend.Tree.Utilities.setFlags( this, flags );

	// Calculate total number of sounds to load
	for ( var i = 0; i < soundList.length; i ++ )
	{
		if ( typeof soundList[ i ].start != 'undefined' )
			this.toLoad += soundList[ i ].end - soundList[ i ].start;
		else
			this.toLoad ++;
	}

	// Load all the sounds
	var sound;
	var self = this;
	for ( i = 0; i < soundList.length; i ++ )
	{
		var soundDef = soundList[ i ];

		var path = soundDef.path;
		sound = new SoundObject( path, loaded );
		sound.name = soundDef.name;
		sound.volume = 1;
		if ( typeof soundDef.volume != 'undefined' )
			sound.volume = soundDef.volume;
		sound.loops = 1;
		if ( typeof soundDef.loops != 'undefined' )
			sound.loops = soundDef.loops;
		this.sounds[ soundDef.name ] = sound;
	}

	// When an sound is loaded
	function loaded()
	{
		// One more loaded, check for completion
		self.loaded ++;
		self.checkCompletion();
	}
	return true;
};

/**
 * getSound
 *
 * Finds a sound from its name
 *
 * @param (string) name of the sound to find
 * @return (object) this sound found or null if not found
 */
Friend.Resources.Manager.getSound = function ( name )
{
	if ( this.sounds[ name ] )
		return this.sounds[ name ];
	return false;
};

/**
 * addImage
 *
 * Adds a new image to the list
 *
 * @param (string) name of the image to find
 * @return (object) this image found or null if not found
 */
Friend.Resources.Manager.addImage = function ( name, image, hotSpot, callback )
{
	if ( !this.images[ name ] )
	{
		// Adds the image to the list		
		image.treeName = name;
		this.setImageHotSpot( image, hotSpot );
		this.images[ name ] =
		{
			name: name,
			image: image
		};
/*
		// Adapt the image to the renderer
		this.tree.renderer.setImage( image, function( image )
		{
			Friend.Tree.log( self, { infos: 'Friend.Resources.Manager.addImage: added image ' + image.treeName, level: Friend.Tree.ERRORLEVEL_LOW } );
			if ( callback )
				callback( image );
		} );	
*/		
		return true;
	}
	else
	{
		Friend.Tree.log( self, { infos: 'Friend.Resources.Manager.addImage: image already exists ' + name, level: Friend.Tree.ERRORLEVEL_HIGH } );	
	}
	return false;
};

/**
 * getImage
 *
 * Finds an image from its name
 *
 * @param (string) name of the image to find
 * @return (object) this image found or null if not found
 */
Friend.Resources.Manager.getImage = function ( name )
{
	var image = this.images[ name ];
	if ( image )
	{
		if ( image.images )
		{
			image.width = image.images[ 0 ].image.width;
			image.height = image.images[ 0 ].image.height;
			image.hotSpotX = image.images[ 0 ].image.hotSpotX;
			image.hotSpotY = image.images[ 0 ].image.hotSpotY;
			return image;
		}
		else
			return image.image;
	}
	console.log( 'Friend.Resources.Manager, image ' + name + ' not found...')
	return false;
};

/**
 * deleteSound
 *
 * Deletes a sound from its name
 *
 * @param (string) name name of the sound to remove
 */
Friend.Resources.Manager.deleteSound = function ( name )
{
	var temp = { };
	for ( var i in this.sounds )
	{
		if ( i != name )
			temp[ name ] = this.sounds[ i ];
	}
	this.sounds = temp;
	return false;
};

/**
 * deleteSound
 *
 * Deletes an image from its name
 *
 * @param (string) name name of the image to remove
 */
Friend.Resources.Manager.deleteImage = function ( name )
{
	var temp = { };
	for ( var i in this.images )
	{
		if ( i != name )
			temp[ name ] = this.images[ i ];
	}
	this.images = temp;
	return false;
};
