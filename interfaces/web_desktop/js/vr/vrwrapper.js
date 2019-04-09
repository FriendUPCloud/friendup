/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*

All applications use this wrapper to display their objects. This is the master
link between apps and VR.

Each VR object is added an an app collection. This way, it is possible to
switch applications, hiding their 3D objects.

*/

Friend.VRAppObjects = {}; // Per App
Friend.VRApps = {};

// Handle API calls
Friend.VRWrapper = function( msg )
{
	// Make sure we have app!
	if( !Friend.VRApps[ msg.applicationId ] )
	{
		Friend.VRApps[ msg.applicationId ] = {
			collisionObjects: []
		};
		Friend.VRAppObjects[ msg.applicationId ] = [];
	}
	if( Friend.VRObjectAbstraction[ msg.object ] )
	{
		return Friend.VRObjectAbstraction[ msg.object ].dispatcher( msg );
	}
	return false;
}

// Handles object abstractions
Friend.VRObjectAbstraction = {
	// Set the user information
	user: {
		dispatcher: function( msg )
		{
			if( this[ msg.command ] )
			{
				return this[ msg.command ]( msg );
			}
		},
		setuserinfo: function( msg )
		{
			if( msg.data )
			{
				// Just set position
				// TODO: support rotation
				if( FriendVR.user )
				{
					FriendVR.renderer.shadowMap.autoUpdate = true;
					if( msg.data.shadows )
					{
						if( msg.data.shadows.autoUpdate === false )
						{
							FriendVR.renderer.shadowMap.autoUpdate = false;
						}
					}
					FriendVR.user.position.set( msg.data.x, msg.data.y, msg.data.z );
					
					// Setup collisionlayers
					if( msg.data.collisionModel )
					{
						FriendVR.user.collisionModel = msg.data.collisionModel;
					}
				}
			}
		}
	},
	// Quad primitive
	quad: {
		dispatcher: function( msg )
		{
			console.log( msg );
			if( this[ msg.command ] )
			{
				return this[ msg.command ]( msg )
			}
		},
		// Create the quad!
		create: function( msg )
		{
			var q = null;
			
			if( msg.texture )
			{
				var ctex = document.createElement( 'canvas' );
				var cn = ctex.getContext( '2d' );
				cn.fillStyle = "rgb(200,80,255)";
				
				var f = new Image();
				f.src = msg.texture.path;
				f.onload = function()
				{
					cn.fillRect( 0, 0, this.width, this.height );
					ctex.setAttribute( 'width', this.width );
					ctex.setAttribute( 'height', this.height );
					cn.drawImage( f, 0, 0 );
					var ct = new THREE.CanvasTexture( ctex, THREE.CubeReflectionMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping );
			
					q = new THREE.Mesh(
						new THREE.PlaneGeometry( msg.size.width, msg.size.height, 1 ),
						new THREE.MeshLambertMaterial( { side: THREE.DoubleSide, map: ct } )
					);
					setPositionEtc();
					document.body.removeChild( f );
					FriendVR.loading--;

				}
				FriendVR.loading++;
				document.body.appendChild( f );
			}
			else
			{
				var q = new THREE.Mesh(
					new THREE.PlaneGeometry( msg.size.width, msg.size.height, 1 ),
					new THREE.MeshLambertMaterial( { color: msg.color, side: THREE.DoubleSide } )
				);
				setPositionEtc();
			}
			
			function setPositionEtc()
			{
				q.position.x = msg.position.x;
				q.position.y = msg.position.y;
				q.position.z = msg.position.z;
				q.rotation.x = msg.rotation.x;
				q.rotation.y = msg.rotation.y;
				q.rotation.z = msg.rotation.z;
				
				// Give some room for customizations
				if( !q.Friend )
					q.Friend = {};
				
				// Include object in intersect list
				if( msg.intersectable )
				{
					q.Friend.intersectable = true;
				}
			
				q.castShadow = true;
				q.receiveShadow = true;
				FriendVR.scene.add( q );
				FriendVR.renderer.shadowMap.needsUpdate = true;
				
				// Add a clickaction
				// TODO: Be careful! Perhaps only for workspace
				if( msg.clickAction && msg.clickAction.substr( 0, 4 ) == 'run:' )
				{
					q.Friend.clickAction = msg.clickAction.substr( 4, msg.clickAction.length - 4 );
				}
				else if( msg.clickAction && msg.clickAction.substr( 0, 4 ) == 'quit' )
				{
					q.Friend.clickAction = 'quit';
				}
				
				// Add to app objects
				Friend.VRAppObjects[ msg.applicationId ].push( q );
			}
		},
		setPosition: function( msg )
		{
		},
		getPosition: function( msg )
		{
		},
		setRotation: function( msg )
		{
		},
		getRotation: function( msg )
		{
		},
		setSize: function( msg )
		{
		},
		getSize: function( msg )
		{
		}
	},
	pointLight: {
		dispatcher: function( msg )
		{
			console.log( 'Point light, eh?' );
			if( this[ msg.command ] )
			{
				return this[ msg.command ]( msg );
			}
		},
		create: function( msg )
		{
			console.log( 'Creating pointlight.' );
			
			// Load the model
			var light = new THREE.PointLight( msg.color, msg.intensity, msg.distance, 2 );
			light.position.set( msg.position.x, msg.position.y, msg.position.z );
			
			light.castShadow = false;
			
			FriendVR.scene.add( light );
			
			/*light.shadow.shadowBias = 0.0001;
			light.shadow.shadowDarkness = 0.2;
			light.shadow.mapSize.width = 1024;
			light.shadow.mapSize.height = 1024;
			light.shadow.camera.near = 0.2;
			light.shadow.camera.far = 500;*/
			
			// Add to app objects
			Friend.VRAppObjects[ msg.applicationId ].push( light );
		},
		setPosition: function( msg )
		{
		},
		getPosition: function( msg )
		{
		},
		setRotation: function( msg )
		{
		},
		getRotation: function( msg )
		{
		},
		setSize: function( msg )
		{
		},
		getSize: function( msg )
		{
		}
	},
	// Shadowy spotlight
	spotLight: {
		dispatcher: function( msg )
		{
			console.log( 'Spotlight, eh?' );
			if( this[ msg.command ] )
			{
				return this[ msg.command ]( msg );
			}
		},
		create: function( msg )
		{
			var light = new THREE.SpotLight( msg.color, msg.spotLight.intensity, msg.spotLight.distance, msg.spotLight.angle, msg.spotLight.penumbra, msg.spotLight.decay );
			light.position.set( msg.position.x, msg.position.y, msg.position.z );
			light.castShadow = msg.castShadow;
			
			FriendVR.scene.add( light );
			
			// Set up shadow properties
			/*light.shadow.mapSize.width = 1024;
			light.shadow.mapSize.height = 1024;
			light.shadow.camera.near = 0.5;
			light.shadow.camera.far = 500;*/
			
			/*if( msg.spotLight.shadow )
			{
				if( msg.spotLight.shadow.mapSize )
					light.shadow.mapSize = msg.spotLight.shadow.mapSize;
				if( msg.spotLight.shadow.camera )
					light.shadow.camera = msg.spotLight.shadow.camera;
			}*/
			
			// Add to app objects
			Friend.VRAppObjects[ msg.applicationId ].push( light );
		},
		setPosition: function( msg )
		{
		},
		getPosition: function( msg )
		{
		},
		setRotation: function( msg )
		{
		},
		getRotation: function( msg )
		{
		},
		setSize: function( msg )
		{
		},
		getSize: function( msg )
		{
		}
	},
	// 3D object file for import
	model: {
		dispatcher: function( msg )
		{
			if( this[ msg.command ] )
			{
				return this[ msg.command ]( msg );
			}
		},
		create: function( msg )
		{
			var filename = getImageUrl( msg.path );
			
			// Toggle global gamma (ugly way)
			if( msg.globalGamma )
			{
				FriendVR.renderer.gammaFactor = msg.globalGamma;
				FriendVR.renderer.gammaOutput = true;
			}
			
			// Load the model
			var loader = new THREE.GLTFLoader();
			FriendVR.loading++;
			loader.load(
				filename, 
				function( gltf ){
					gltf.scene.position.x = msg.position.x;
					gltf.scene.position.y = msg.position.y;
					gltf.scene.position.z = msg.position.z;
					gltf.scene.rotation.x = msg.rotation.x;
					gltf.scene.rotation.y = msg.rotation.y;
					gltf.scene.rotation.z = msg.rotation.z;
					
					// If shaded..
					if( !msg.unshaded )
					{
						gltf.castShadow = true;
						gltf.receiveShadow = true;
					}
					
					// Cast and receive shadows!
					for( var a = 0; a < gltf.scene.children.length; a++ )
					{
						// Find lamps!
						var child = gltf.scene.children[a];
						if( child.name.length >= 8 && child.name.substr( 0, 8 ) == 'Spotlamp' )
						{
							console.log( 'Found a spotlight!' );
						}
						else if( child.name.length >= 9 && child.name.substr( 0, 9 ) == 'Pointlamp' )
						{
							console.log( 'Found a pointlamp!' );
						}
						else if( msg.unshaded || child.name.indexOf( 'noShadow' ) >= 0 )
						{
							child.castShadow = false;
							child.receiveShadow = false;
						}
						// Normal objects
						else
						{
							child.castShadow = true;
							child.receiveShadow = true;
						}
					}
					
					// Add to app objects
					Friend.VRAppObjects[ msg.applicationId ].push( gltf.scene );
					
					// Add collision objects
					if( msg.collisionObjects )
					{
						for( var a = 0; a < gltf.scene.children.length; a++ )
						{
							for( var b = 0; b < msg.collisionObjects.length; b++ )
							{
								if( gltf.scene.children[a].name == msg.collisionObjects[b] )
								{
									gltf.scene.children[a].visible = false;
									gltf.scene.children[a].castShadow = false;
									gltf.scene.children[a].receiveShadow = false;
									Friend.VRApps[ msg.applicationId ].collisionObjects.push( gltf.scene.children[a] );
								}
							}
						}
					}
					
					// Add to scene
					FriendVR.scene.add( gltf.scene );
					FriendVR.renderer.shadowMap.needsUpdate = true;
					
					/*
					gltf.animations; // Array<THREE.AnimationClip>
					gltf.scene; // THREE.Scene
					gltf.scenes; // Array<THREE.Scene>
					gltf.cameras; // Array<THREE.Camera>
					gltf.asset; // Object
					*/
					FriendVR.loading--;
				},
				function( xhr ){
					console.log( 'Progress' );
				},
				function( error ){
					console.log( 'Error: ', error, filename );
				}
			);
		},
		setPosition: function( msg )
		{
		},
		getPosition: function( msg )
		{
		},
		setRotation: function( msg )
		{
		},
		getRotation: function( msg )
		{
		},
		setSize: function( msg )
		{
		},
		getSize: function( msg )
		{
		}
	}
};
