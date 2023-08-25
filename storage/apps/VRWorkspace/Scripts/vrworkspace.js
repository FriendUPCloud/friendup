Application.run = function( msg )
{
	Include( '/webclient/js/apps/friendvr.js', function()
	{
		console.log( 'Initializing environment.' );
		initEnvironment();
	} );
}

// Less to write
var app = Application;

app.objects = {};

// Initialize the VR environment
function initEnvironment()
{
	var flags = {
		path: 'Progdir:Objects/sofa.glb',
		position: {
			x: 0,
			y: 0,
			z: 0
		},
		rotation: {
			x: 0,
			y: 90.0 * Math.PI / 2, // Please get degrees working!
			z: 0
		},
		callback: function( data )
		{
			// For safe keeping
			app.objects.environment = Application.environ;
			
			// Add a standard white pointlight
			app.objects.mainLight = new Friend.VR.pointLight( {
				position: {
					x: 0, y: 1.9, z: 1
				},
				color: 0xffffff,
				intensity: 2
			} );
			app.objects.rightLight = new Friend.VR.pointLight( {
				position: {
					x: 2, y: 1.9, z: -3.5
				},
				color: 0xffffff
			} );
			
			// Add preview
			app.objects.preview = new Friend.VR.quad( {
				position: { x: 0, y: 1.20, z: -0.65 },
				size: { width: 1.6, height: 0.9 },
				color: 0xffffff,
				texture: {
					path: '/webclient/apps/VRWorkspace/Gfx/choser.jpg',
					size: 'cover'
				},
				intersectable: true
			} );
			
			app.objects.previewBackdrop = new Friend.VR.quad( {
				position: { x: 0, y: 1.20, z: -0.67 },
				size: { width: 1.6, height: 0.9 },
				color: 0x222222,
				intersectable: true
			} );
			
			// Load apps
			refreshApps();
		}
	};
	
	// Set user information
	Friend.VR.user( {
		x: 0,
		y: 0,
		z: 2.5,
		crosshair: true,
		shadows: {
			autoUpdate: false
		},
		// Once done, load our model!
		callback()
		{
			Application.environ = new Friend.VR.model( flags );
		}
	} );
}

function refreshApps()
{
	// Remove old app objects
	if( app.objects.apps && app.objects.apps.length )
	{
		for( var a = 0; a < app.objects.apps.length; a++ )
		{
			
		}
	}
	
	// New array!
	app.objects.apps = [];
	
	// Software packages
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' ) return;
		
		var list = JSON.parse( d );
		
		var positions = [
			{ px:  -0.7, py: 0.62, pz: -0.3, rx: 0,  ry:  0.6, rz: 0 },
			{ px: -0.35, py: 0.62, pz: -0.4, rx: 0,  ry:  0.3, rz: 0 },
			{ px:     0, py: 0.62, pz: -0.45, rx: 0, ry:    0, rz: 0 },
			{ px:  0.35, py: 0.62, pz: -0.4, rx: 0,  ry: -0.3, rz: 0 },
			{ px:   0.7, py: 0.62, pz: -0.3, rx: 0,  ry: -0.6, rz: 0 }
		];
		
		var start = -0.9;
		var ypos = 0.3;
		var margin = 0.1;
		var count = 0;
		var row = 0;
		var maxNum = 5;
		for( var a = 0, b = 0; a < list.length && b < maxNum; a++ )
		{
			// Check app if it's compatible to be displayed
			// TODO: Support VR attribute
			if( list[a].Name == 'VRWorkspace' ) continue;
			if( list[a].Name.substr( 0, 2 ) == 'VR' )
			{
				var flags = {};
				if( list[a].Preview )
				{
					flags.texture = {
						path: '/webclient/apps/' + list[a].Name + '/icon.png',
						size: 'cover'
					};
				}
				flags.label = {
					text: list[a].Name,
					position: 'bottom',
					align: 'center',
					color: 0xffffff,
					size: 14
				};
				flags.clickAction = 'run:' + list[a].Name;
				var o = positions[ b % positions.length ];
				flags.position = {
					x: o.px, y: o.py, z: o.pz
				};
				flags.rotation = {
					x: o.rx, y: o.ry, z: o.rz
				};
				flags.size = { width: 0.25, height: 0.25 };
				flags.color = 0xffffff;
				var q = new Friend.VR.quad( flags );
				app.objects.apps.push( q );
				b++;
			}
			
		}
	}
	m.execute( 'listuserapplications' );
	
}

