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

/* Initialize VR ------------------------------------------------------------ */

var FriendVR = {
	// Declare some variables used in the functions
	canvas: null,
	scene: null, 
	camera: null, 
	crosshair: null, 
	room: {}, 
	renderer: null,
	controls: null, 
	raycaster: null, 
	initialized: null,
	logo: null, 
	rot: null,
	rooms: [],
	currentRoom: 0,
	zPhase: 0.0, 
	intersected: null,
	
	// Initialize the engine
	init: function()
	{
		if( this.initialized ) return;
		
		var self = this;
		
		// Make sure we're ready!
		if( !document.body || document.body && !document.body.classList.contains( 'Inside' ) ) 
			return setTimeout( function(){ FriendVR.init() }, 5 );
		
		vrInitialized = true;
	
		if( WEBVR.isAvailable() === false ) 
		{
			var mess = WEBVR.getMessage();
			mess.style.zIndex = 2147483647;
			document.body.appendChild( mess );
		}
	
		// Setup the scene
		this.canvas = document.createElement( 'div' );
		document.body.appendChild( this.canvas );
		this.canvas.style.zIndex = 2147483646;

		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 10 );
		this.scene.add( this.camera );

		// 3d crosshair that shows your where you are pointing
		this.crosshair = new THREE.Mesh(
			new THREE.RingGeometry( 0.02, 0.04, 32 ),
			new THREE.MeshBasicMaterial( {
				color: 0xffffff,
				opacity: 0.5,
				transparent: true
			} ) 
		);
		this.crosshair.position.z = - 2;
		this.camera.add( this.crosshair );

		// Set up the current room space itself
		this.room.mesh = new THREE.Mesh(
			new THREE.BoxGeometry( 6, 2, 6, 1, 1, 1 ),
			new THREE.MeshBasicMaterial( { color: 0x0B2640, side: THREE.DoubleSide } )
		);
		this.room.mesh.receiveShadow = true;
		this.scene.add( this.room.mesh );

		// Floor of room
		this.room.floorPlane = new THREE.Mesh(
			new THREE.PlaneGeometry( 6, 6, 1 ),
			new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide } )
		);
		this.room.floorPlane.rotation.x = 90 / 180 * Math.PI;
		this.room.floorPlane.position.y = -0.7;
		this.room.floorPlane.receiveShadow = true;
		this.scene.add( this.room.floorPlane );
	
		// Ceiling of room
		this.room.ceilingPlane = new THREE.Mesh(
			new THREE.PlaneGeometry( 6, 6, 1 ),
			new THREE.MeshBasicMaterial( { color: 0x505050, side: THREE.DoubleSide } )
		);
		this.room.ceilingPlane.rotation.x = 90 / 180 * Math.PI;
		this.room.ceilingPlane.position.y = 0.7;
		this.scene.add( this.room.ceilingPlane );
		
		//vrScene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) );
		
		this.room.light = new THREE.DirectionalLight( 0xffffff );
		this.room.light.position.set( 1, 1, 1 ).normalize();
		this.room.light.castShadow = true;
		this.room.light.shadowDarkness = 0.7;
		this.room.light.shadowCameraVisible = true;
		this.scene.add( this.room.light );
		
		// Friend logo
		var l = new THREE.ObjectLoader();
		l.load( './art_original/FriendLogo.json', function( obj )
		{
			self.logo = obj;
			self.logo.scale.set( 0.2, 0.2, 0.2 );
			self.logo.position.x = 0;
			self.logo.position.y = 0.7;
			self.logo.position.z = -1;
			self.logo.rotation.x = 90 / 180 * Math.PI;
			self.logo.rotation.x = 90 / 180 * Math.PI;
			self.logo.castShadow = true;
			self.logo.receiveShadow = true;
			self.scene.add( self.logo );
		} );

		// Software packages
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' ) return;
			
			var list = JSON.parse( d );
			
			var start = -0.9;
			var ypos = 0.3;
			var margin = 0.1;
			var count = 0;
			var row = 0;
			for( var a = 0; a < list.length; a++ )
			{
				if( list[a].Preview )
				{
					var pln = new THREE.Mesh(
						new THREE.PlaneGeometry( 0.5, 0.5, 1 ),
						new THREE.MeshBasicMaterial( { color: 0xAD3524, side: THREE.DoubleSide } )
					);
					pln.position.x = start + ( count * ( 0.5 + margin ) );
					pln.position.y = ypos;
					pln.position.z = -2;
					pln.castShadow = true;
					pln.receiveShadow = true;
					self.scene.add( pln );
					if( count++ >= 3 )
					{
						count = 0;
						ypos -= 0.5 + margin;
						row++;
						if( row >= 2 )
						{
							break;
						}
					}
				}
			}
		}
		m.execute( 'listuserapplications' );

		// Setup the rendering
		this.raycaster = new THREE.Raycaster();
		this.renderer = new THREE.WebGLRenderer( { antialias: true } );
		this.renderer.shadowMapType = THREE.PCFSoftShadowMap;
		this.renderer.setClearColor( 0x202050 );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.sortObjects = false;
		this.canvas.appendChild( this.renderer.domElement );
		this.controls = new THREE.VRControls( this.camera );
		this.effect = new THREE.VREffect( this.renderer );

		WEBVR.getVRDisplay( function ( display ) 
		{
			var btn = WEBVR.getButton( display, self.renderer.domElement );
			btn.style.zIndex = 2147483647;
			document.body.appendChild( btn );
		} );

		// TODO: Reenable these later..
		/*vrRenderer.domElement.addEventListener( 'mousedown', onMouseDown, false );
		vrRenderer.domElement.addEventListener( 'mouseup', onMouseUp, false );
		vrRenderer.domElement.addEventListener( 'touchstart', onMouseDown, false );
		vrRenderer.domElement.addEventListener( 'touchend', onMouseUp, false );*/
		//window.addEventListener( 'resize', onWindowResize, false );
	
		// Set up the animation/rendering
		this.animate();
	},
	// Just setup how to animate / render
	animate: function()
	{
		FriendVR.effect.requestAnimationFrame( FriendVR.animate );
		FriendVR.render();
	},
	// Do the actual rendering
	render: function()
	{
		// Find intersections (collisions with camera)
		this.raycaster.setFromCamera( { x: 0, y: 0 }, this.camera );
		
		// Rotate the logo
		if( this.logo ) this.logo.rotation.z = this.rot / 180 * Math.PI;
		this.rot += 0.5;

		// Update controls and render
		this.controls.update();
		this.effect.render( this.scene, this.camera );
	}
}

