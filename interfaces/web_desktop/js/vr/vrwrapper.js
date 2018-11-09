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

// Handle API calls
Friend.VRWrapper = function( msg )
{
	console.log( 'Here is the message for VR: ', msg );
	if( Friend.VRObjectAbstraction[ msg.object ] )
	{
		return Friend.VRObjectAbstraction[ msg.object ].dispatcher( msg );
	}
	return false;
}

// Handles object abstractions
Friend.VRObjectAbstraction = {
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
				
				// TODO: Move this to vrengine and make less insane
				if( !Friend.VRAppObjects[ msg.applicationId ] )
					Friend.VRAppObjects[ msg.applicationId ] = [];
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
			var light = new THREE.PointLight( msg.color, msg.intensity, 100, 2 );
			light.position.set( msg.position.x, msg.position.y, msg.position.z );
			light.castShadow = true;
			FriendVR.scene.add( light );
			
			// TODO: Move this to vrengine and make less insane
			if( !Friend.VRAppObjects[ msg.applicationId ] )
				Friend.VRAppObjects[ msg.applicationId ] = [];
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
			console.log( 'Model, eh?' );
			if( this[ msg.command ] )
			{
				return this[ msg.command ]( msg );
			}
		},
		create: function( msg )
		{
			console.log( 'Creating model: ' + msg.path );
			var filename = getImageUrl( msg.path );
			
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
					gltf.castShadow = true;
					gltf.receiveShadow = true;
					
					FriendVR.scene.add( gltf.scene );
					
					// TODO: Move this to vrengine and make less insane
					if( !Friend.VRAppObjects[ msg.applicationId ] )
						Friend.VRAppObjects[ msg.applicationId ] = [];
					Friend.VRAppObjects[ msg.applicationId ].push( gltf.scene );
					
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
