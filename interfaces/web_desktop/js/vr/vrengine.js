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
	loading: 0,
	camera: null,
	crosshair: null,
	intersected: null,
	room: {},
	renderer: null,
	controls: null,
	raycaster: null,
	initialized: null,
	logo: null,
	rot: null,
	input: {
		press: false
	},
	rooms: [],
	currentRoom: 0,
	zPhase: 0.0,
	intersected: null,
	controller1: null,
	controller2: null,
	
	// Initialize the engine
	init: function()
	{
		if( this.initialized ) return;
		
		var self = this;
		
		// Make sure we're ready!
		if( !document.body || document.body && !document.body.classList.contains( 'Inside' ) ) 
			return setTimeout( function(){ FriendVR.init(); }, 5 );
		
		this.initialized = true;
	
		// Setup the scene
		this.canvas = document.createElement( 'div' );
		document.body.appendChild( this.canvas );
		this.canvas.style.zIndex = 2147483646;

		// Create the scene object
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color( 0x444444 );
		
		this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.scene.add( this.camera );

		// 3d crosshair that shows your where you are pointing
		/*this.crosshair = new THREE.Mesh(
			new THREE.RingGeometry( 0.01, 0.02, 32 ),
			new THREE.MeshBasicMaterial( {
				color: 0xffffff,
				opacity: 0.5,
				transparent: true
			} ) 
		);
		this.crosshair.position.z = -2;
		this.camera.add( this.crosshair );*/

		// Software packages
		/*var m = new Module( 'system' );
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
					var ctex = document.createElement( 'canvas' );
					ctex.setAttribute( 'width', 512 );
					ctex.setAttribute( 'height', 512 );
					var cn = ctex.getContext( '2d' );
					cn.fillStyle = "rgb(80,80,80)";
					cn.fillRect( 0, 0, 512, 512 );
					cn.fillStyle = "rgb(40,40,40)";
					cn.fillRect( 0, 400, 512, 512 );
					cn.fillStyle = "rgb(255,255,255)";
					cn.font = "40px Sans serif";
					cn.fillText( list[a].Name, 30, 470 );
					
					var ct = new THREE.CanvasTexture( ctex, THREE.CubeReflectionMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping );
				
					var pln = new THREE.Mesh(
						new THREE.PlaneGeometry( 0.5, 0.5, 1 ),
						new THREE.MeshLambertMaterial( { side: THREE.DoubleSide, map: ct } )
					);
					pln.position.x = start + ( count * ( 0.5 + margin ) );
					pln.position.y = ypos;
					pln.position.z = -2 - ( ( count == 0 || count == 3 ) ? -0.5 : 0 );
					pln.rotation.y = 1.0 + ( -2.0 / 3 * count );
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
		m.execute( 'listuserapplications' );*/
		
		// Setup user
		this.user = new THREE.Group();
		this.user.position.set( 0, 0, 0 );
		this.user.gravity = 0;
		this.user.gravityPhase = 0;
		this.scene.add( this.user );
		this.user.add( this.camera );
		
		// Setup the rendering
		this.raycaster = new THREE.Raycaster();
		this.renderer = new THREE.WebGLRenderer( { antialias: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.vr.enabled = true;
		
		this.renderer.shadowMapType = THREE.PCFSoftShadowMap;
		this.renderer.setClearColor( 0x202050 );
		this.renderer.sortObjects = false;
		this.canvas.appendChild( this.renderer.domElement );
		//this.controls = new THREE.VRControls( this.camera );
		//this.effect = new THREE.VREffect( this.renderer );
		
		document.body.appendChild( WEBVR.createButton( this.renderer ) );

		WEBVR.getVRDisplay( function ( display ) 
		{
			var btn = WEBVR.getButton( display, self.renderer.domElement );
			btn.style.zIndex = 2147483647;
			document.body.appendChild( btn );
		} )
		
		
		
		this.vrMode = document.getElementsByTagName( 'a' );
		if( this.vrMode.length > 0 )
		{
			if( this.vrMode[0].innerHTML == 'WEBVR NOT SUPPORTED' )
				this.vrMode = false;
			else this.vrMode = true;
		}
		else this.vrMode = true;
		
		this.controllerDirection = {
			up: false, 
			down: false,
			left: false,
			right: false,
			enter: false,
			time: ( new Date() ).getTime()
		};
		
		if( this.vrMode )
		{
			// Our controllers
			this.controller1 = this.renderer.vr.getController( 0 );
			//this.controller1.addEventListener( 'touchstart', function(){ FriendVR.onKeyDown( { which: 38 } ); } );
			//this.controller1.addEventListener( 'touchend', function(){ FriendVR.onKeyUp( { which: 38 } ); } );
			this.controller1.addEventListener( 'selectstart', FriendVR.onSelectStart );
			this.controller1.addEventListener( 'selectend', FriendVR.onSelectEnd );
			this.scene.add( this.controller1 );
			this.controller2 = this.renderer.vr.getController( 1 );
			this.controller2.addEventListener( 'selectstart', FriendVR.onSelectStart );
			this.controller2.addEventListener( 'selectend', FriendVR.onSelectEnd );
			this.scene.add( this.controller2 );
		}
		else
		{
			window.addEventListener( 'click', function( e ){ FriendVR.onClick( e ); }, false );
			window.addEventListener( 'keydown', function( e ){ FriendVR.onKeyDown( e ); }, false );
			window.addEventListener( 'keyup', function( e ){ FriendVR.onKeyUp( e ); }, false );
			window.addEventListener( 'mousemove', function( e ){ FriendVR.onMouseMove( e ); }, false );
		}
		
		// Add some events
		window.addEventListener( 'vrdisplaypointerrestricted', function( e ){ FriendVR.onPointerRestricted( e ); }, false );
		window.addEventListener( 'vrdisplaypointerunrestricted', function( e ){ FriendVR.onPointerUnrestricted( e ); }, false );
		
		this.mouse = new THREE.Vector2();
	
		// Set up the animation/rendering
		this.animate();
		
		// No go ahead and launch workspace
		ExecuteApplication( 'VRWorkspace' );
	},
	// Various events ----------------------------------------------------------
	onKeyDown: function( e )
	{
		switch( e.which )
		{
			case 38: this.controllerDirection.up = true; break;
			case 40: this.controllerDirection.down = true; break;
			case 37: this.controllerDirection.left = true; break;
			case 39: this.controllerDirection.right = true; break;
			case 13: this.controllerDirection.enter = true; break;
		}
	},
	onKeyUp: function( e )
	{
		switch( e.which )
		{
			case 38: this.controllerDirection.up = false; break;
			case 40: this.controllerDirection.down = false; break;
			case 37: this.controllerDirection.left = false; break;
			case 39: this.controllerDirection.right = false; break;
			case 13: this.controllerDirection.enter = false; break;
		}
	},
	onMouseMove: function( e )
	{
		this.mouse.x = ( ( e.clientX / window.innerWidth ) * 2 ) - 1;
		this.mouse.y = -( ( e.clientY / window.innerHeight ) * 2 ) + 1;
	},
	onClick: function( e )
	{
		if( FriendVR.intersected && FriendVR.intersected.friend && FriendVR.intersected.Friend.clickAction )
		{
			if( FriendVR.intersected.Friend.clickAction == 'quit' )
			{
				FriendVR.killApplication( Workspace.currentExecutedApplication );
			}
			else
			{
				ExecuteApplication( FriendVR.intersected.Friend.clickAction );
				FriendVR.intersected.material.emissive.setHex( FriendVR.intersected.currentHex );
				FriendVR.intersected = null;
			}
		}
	},
	onSelectStart: function( e )
	{
		if( FriendVR.intersected && FriendVR.intersected.friend && FriendVR.intersected.Friend.clickAction )
		{
			if( FriendVR.intersected.Friend.clickAction == 'quit' )
			{
				FriendVR.killApplication( Workspace.currentExecutedApplication );
			}
			else
			{
				ExecuteApplication( FriendVR.intersected.Friend.clickAction );
				FriendVR.intersected.material.emissive.setHex( FriendVR.intersected.currentHex );
				FriendVR.intersected = null;
			}
		}
	},
	onSelectEnd: function( e )
	{
	},
	onPointerRestricted: function( e )
	{
		var pointerLockElement = FriendVR.renderer.domElement;
		if( pointerLockElement && typeof( pointerLockElement.requestPointerLock ) === 'function' )
		{
			pointerLockElement.requestPointerLock();
		}
	},
	onPointerUnrestricted: function( e )
	{
		var currentPointerLockElement = document.pointerLockElement;
		var expectedPointerLockElement = FriendVR.renderer.domElement;
		if( currentPointerLockElement && currentPointerLockElement === expectedPointerLockElement && typeof( document.exitPointerLock ) === 'function' )
		{
			document.exitPointerLock();
		}
	},
	// Kill application
	killApplication: function( id )
	{
		if( !Friend.VRAppObjects[ id ] ) return;
		for( var a = 0; a < Friend.VRAppObjects[ id ].length; a++ )
		{
			var obj = Friend.VRAppObjects[ id ][ a ];
			
			// Removing from the scene
			FriendVR.scene.remove( obj );
		}
		delete Friend.VRAppObjects[ id ];
		
		if( Workspace.prevExecutedApplication && id != Workspace.prevExecutedApplication )
		{
			Workspace.currentExecutedApplication = Workspace.prevExecutedApplication;
			var found = false;
			for( var a = 0; a < Workspace.applications.length; a++ )
			{
				if( Workspace.applications[ a ].applicationId == Workspace.currentExecutedApplication )
				{
					found = true;
					break;
				}
			}
			if( found )
			{
				for( var a = 0; a < Friend.VRAppObjects[ Workspace.currentExecutedApplication ].length; a++ )
				{
					var obj = Friend.VRAppObjects[ Workspace.currentExecutedApplication ][ a ];
			
					// Readd to the scene
					FriendVR.scene.add( obj );
				}
			}
			else
			{
				Workspace.currentExecutedApplication = null;
			}
		}
		
	},
	// Hide the current application
	hideCurrentApplication: function()
	{
		if( !Workspace.currentExecutedApplication )
			return;
		var id = Workspace.currentExecutedApplication;
		if( !Friend.VRAppObjects[ id ] ) return;
		for( var a = 0; a < Friend.VRAppObjects[ id ].length; a++ )
		{
			var obj = Friend.VRAppObjects[ id ][ a ];
			
			// Temporarily removing from the scene
			FriendVR.scene.remove( obj );
		}
	},
	// End various events ------------------------------------------------------
	// Just setup how to animate / render
	animate: function()
	{
		FriendVR.renderer.setAnimationLoop( function(){ FriendVR.render(); } );
	},
	handleUser: function()
	{
		if( FriendVR.loading > 0 ) return;
		
		// Always move the user above the floor
		this.user.updateMatrix();
		var under = new THREE.Vector3( this.user.position.x, this.user.position.y + 1.5, this.user.position.z );
		this.raycaster.set( under, new THREE.Vector3( 0, - 1, 0 ) );
		
		var ufloor = this.raycaster.intersectObjects( this.scene.children, true );
		var find = false;
		if( ufloor && ufloor.length && ufloor[0].distance <= 1.5 )
		{
			this.user.position.y = ufloor[0].point.y;
			this.user.gravityPhase = 0;
			this.user.gravity = 0;
		}
		// Else fall with gravity!
		else
		{
			this.user.gravityPhase += 0.01;
			this.user.gravity += 0.001;
			if( this.user.gravityPhase > 1 )
			{
				this.user.gravityPhase = 1;
				this.user.gravity += 0.05;
			}
			if( this.user.gravity > 1 )
			{
				this.user.gravity = 1;
			}
			this.user.position.y -= this.user.gravity;
		}
		
		// Do not walk in walls!
		var inwallFront = inwallBack = false;
		
		// Direction we are looking (bump in front)
		under.y -= 1;
		
		var vector = new THREE.Vector3();
		this.camera.getWorldDirection( vector );
		vector.y = 0;
	
		// Direction
		this.raycaster.set( under, vector );
	
		// Check if objects are intersecting
		ufloor = this.raycaster.intersectObjects( this.scene.children, true );
		if( ufloor.length )
		{
			if( ufloor[0].distance <= 0.5 )
			{
				inwallFront = true;
			}
		}
		
		/*// Check bumping into walls on the sides
		// Left
		var vclone = vector.clone();
		vclone.applyAxisAngle( new THREE.Vector3( 0, 1, 0 ), -FriendVR.buffers.user90Deg );
		vclone.y = 0;
		this.raycaster.set( under, vclone );
		ufloor = this.raycaster.intersectObjects( this.scene.children, true );
		if( ufloor.length )
		{
			if( ufloor[0].distance <= 0.4 )
			{
				var diff = 0.4 - ufloor[0].distance;
				this.user.translateX( diff );
			}
		}
		
		// Right
		var vclone = vector.clone();
		vclone.applyAxisAngle( new THREE.Vector3( 0, 1, 0 ), FriendVR.buffers.user90Deg );
		vclone.y = 0;
		this.raycaster.set( under, vclone );
		ufloor = this.raycaster.intersectObjects( this.scene.children, true );
		if( ufloor.length )
		{
			if( ufloor[0].distance <= 0.4 )
			{
				var diff = 0.4 - ufloor[0].distance;
				this.user.translateX( -diff );
			}
		}*/
		
		
		// For gear VR
		var gamepads = navigator.getGamepads && navigator.getGamepads();
		var usingGamepads = false;
		if( gamepads && gamepads.length )
		{
			if( gamepads[1] && gamepads[1].buttons )
			{
				usingGamepads = true;
				if( gamepads[1].buttons[0].pressed )
				{
					if( !inwallFront )
					{
						this.user.translateZ( vector.z / 40 );
						this.user.translateX( vector.x / 40 );
					}
				}
			}
		}
		
		if( !usingGamepads )
		{
			// Directions
			if( this.controllerDirection.right )
			{
				this.user.rotation.y -= 0.01;
			}
			if( this.controllerDirection.left )
			{
				this.user.rotation.y += 0.01;
			}
			if( !inwallFront )
			{
				if( this.controllerDirection.up )
				{
					this.user.translateZ( -0.03 );
				}
			}
			if( this.controllerDirection.down )
			{
				this.user.translateZ( 0.03 );
			}
		}
	},
	// Do the actual rendering
	render: function()
	{
		// Handle user input and physics
		this.handleUser();
		
		// Find intersections (collisions with camera)
		if( this.vrMode )
		{
			this.raycaster.setFromCamera( { x: 0, y: 0 }, this.camera );
		}
		else
		{
			this.raycaster.setFromCamera( this.mouse, this.camera );
		}
		
		// If we have an active scene, use that to figure out intersections
		if( 1 == 1 )
		{
			var intersects = this.raycaster.intersectObjects( this.scene.children, true );
			
			// We found intersections
			if( intersects.length > 0 )
			{
				if( this.intersected != intersects[ 0 ].object )
				{
					if( intersects[ 0 ].object.friend && intersects[ 0 ].object.Friend.clickAction )
					{
						// Reset
						if( this.intersected )
						{
							this.intersected.material.emissive.setHex( this.intersected.currentHex );
						}
						this.intersected = intersects[ 0 ].object;
						this.intersected.currentHex = this.intersected.material.emissive.getHex();
						this.intersected.material.emissive.setHex( 0xff0505 );
					}
					else if( this.intersected ) 
					{
						this.intersected.material.emissive.setHex( this.intersected.currentHex );
						this.intersected = null;
					}
				}
			}
			else
			{
				if( this.intersected ) 
				{
					this.intersected.material.emissive.setHex( this.intersected.currentHex );
				}
				this.intersected = null;
			}
		}
		
		// Temporarily save the orbited camera position
		var orbitPos = this.camera.position.clone();

		// Apply the VR HMD camera position and rotation
		// on top of the orbited camera.
		//this.user.position.z = ( Math.sin( this.rot / 40 ) * 0.5 );

		// Update controls and render
		//this.controls.update();
		this.renderer.render( this.scene, this.camera );
	}
}

FriendVR.buffers = {
	userFovCollision: 22.5 * ( 180 / Math.PI ),
	user90Deg: 90 * ( 180 / Math.PI ),
	user45Deg: 45 * ( 180 / Math.PI )
};
