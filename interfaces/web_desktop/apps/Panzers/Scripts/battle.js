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
 * Panzers! Battle level
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 18/08/2017
 */

/**
 * Battle
 *
 * The Battle is a normal Tree item that handles the game
 *
 * @param (object) tree the Tree engine
 * @param (string) name the name of the item
 * @param (object) flags creation flags
 * @return (object) newly created Battle item
 *
 * Flags
 *
 * game: (object) the calling game
 * network: (object) (optional) the network object if network game
 */

function Battle( tree, name, flags )
{
	this.playMusic = true;
	this.playSounds = true;
	this.usersNumber = false;
	this.userNumber = false;
	this.users = false;
	this.friendQuest = false;
	Friend.Tree.Items.init( this, tree, name, 'Battle', flags );
	this.registerEvents( [ 'refresh', 'controller' ] );
	this.keyScroll = false;
	this.xCenter = this.width / 2;
	this.yCenter = this.height / 2;
	this.perspective = 0.10;
	this.gotFriendToken = false;

	// Links dormant to Battle
	this.dormant = flags.root.dormant;
	this.dormant.setFunctions( [ 'quit', 'setMusic', 'setSounds' ] );
	this.dormant.caller = this;
	this.dormant.execute = this.onDormantExecute;

	// Branch the network object from parent.
	this.network = this.root.network;
	this.network.caller = this;
	this.network.messages = this.handleMultiPlayerMessages;

	// Wait for all the others to be ready
	this.network.startApplication();

	return this;
}

Battle.prototype.setupGame = function ()
{
	// Create the map
	var map =
	{
		// The tiles
		tiles:
		[
			// Simple tiles with one image only
			{ imageName: 'tileBack' },
			{ imageName: 'tileTopLeft' },
			{ imageName: 'tileTop' },
			{ imageName: 'tileTopRight' },
			{ imageName: 'tileRight' },
			{ imageName: 'tileBottomRight' },
			{ imageName: 'tileBottom' },
			{ imageName: 'tileBottomLeft' },
			{ imageName: 'tileLeft' },
			// Composite tile
			{
				// List of images and their Z index
				images:
				[
					{ imageName: 'tileBuilding1', z: 0 }, // One tile per altitude
					{ imageName: 'tileBuilding2', z: 1 },
					{ imageName: 'tileBuilding3', z: 2 }
				]
				// Eventually add a process to rotate the tile
				//processes:
				//[
				//	{ type: 'RotateTiles', params: { speed: 10, initialRotation: 3 } },
				//],
			},
			// Composite tile
			{
				// List of images and their Z index
				images:
				[
					{ imageName: 'tileBuilding1', z: 0 }, // One tile per altitude
					{ imageName: 'tileBuilding2', z: 1 },
					{ imageName: 'tileBuilding2', z: 2 },
					{ imageName: 'tileBuilding2', z: 3 },
					{ imageName: 'tileBuilding2', z: 4 },
					{ imageName: 'tileBuilding2', z: 5 },
					{ imageName: 'tileBuilding2', z: 6 },
					{ imageName: 'tileBuilding3', z: 7 }
				],
				/*// A process to rotate the tiles slowly
				processes:
				[
					{ type: 'RotateTiles', params: { speed: - 15, initialRotation: 3, initialRandom: true } },
				]
				*/
			}
		],
		// Definition of the map
		// <  >: will be transparent
		// <xx>: will display the tile of the same number
		//    0   1   2   3   4   5   6   7   8   9   10  11  12  13  14  15  16  17  18  19  20  21  22  23  24  25  26
		map: '<01><02><02><02><02><02><02><02><02><02><02><02><02><02><02><02><02><02><02><02><02><02><02><02><02><02><03>/' + // 0
			'<08><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><04>/' + // 1
			'<08><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><04>/' + // 2
			'<08><  ><09><09><09><  ><  ><  ><  ><  ><  ><  ><  ><  ><09><09><09><  ><  ><  ><  ><  ><  ><09><  ><  ><04>/' + // 3
			'<08><  ><09><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><09><  ><  ><  ><  ><  ><  ><09><  ><  ><04>/' + // 4
			'<08><  ><09><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><09><  ><  ><  ><  ><  ><  ><09><  ><  ><04>/' + // 5
			'<08><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><09><  ><  ><04>/' + // 6
			'<08><  ><  ><  ><  ><10><10><  ><  ><  ><  ><  ><10><10><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><04>/' + // 7
			'<08><  ><  ><  ><  ><10><10><  ><  ><  ><  ><  ><10><10><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><04>/' + // 8
			'<08><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><04>/' + // 9
			'<08><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><04>/' + // 10
			'<08><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><04>/' + // 11
			'<08><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><09><09><09><09><09><09><  ><  ><04>/' + // 12
			'<08><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><04>/' + // 13
			'<08><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><04>/' + // 14
			'<08><  ><  ><  ><  ><10><10><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><04>/' + // 15
			'<08><  ><  ><  ><  ><10><10><  ><  ><  ><  ><  ><10><10><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><04>/' + // 16
			'<08><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><10><10><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><04>/' + // 17
			'<08><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><09><  ><  ><04>/' + // 18
			'<08><  ><09><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><09><  ><  ><  ><  ><  ><  ><09><  ><  ><04>/' + // 19
			'<08><  ><09><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><09><  ><  ><  ><  ><  ><  ><09><  ><  ><04>/' + // 20
			'<08><  ><09><09><09><  ><  ><  ><  ><  ><  ><  ><  ><  ><09><09><09><  ><  ><  ><  ><  ><  ><09><  ><  ><04>/' + // 21
			'<08><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><04>/' + // 22
			'<08><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><  ><04>/' + // 23
			'<07><06><06><06><06><06><06><06><06><06><06><06><06><06><06><06><06><06><06><06><06><06><06><06><06><06><05>/'     // 24
	};
	
	// Adds the map to the game
	this.map = new Friend.Tree.Game.Map( this.tree, 'map',
	{
		root: this.root,
		parent: this,
		map: map,
		x: 0,
		y: 0,
		z: 0,
		width: 1024,
		height: 768,
		tileWidth: 48,
		tileHeight: 48,
		lockX: true,
		lockY: true,
		followItem: 'tank',
		background: 'grass',
		perspective: 0.02,
		xCenter: 1024 / 2,
		yCenter: 768 / 2,
		event: [ 'refresh' ]
	} );

	// List of available bonusses
	this.bonusses =
	[
		'speed',
		'teleport',
		'wrench',
		'frnd'
	];

	// Creates the player tank (the other players tanks will be created when receiving
	// the creation message from the network - see later in source code)
	this.tanks = [ ];
	var coords = this.getTankCoordinates( this.userNumber ); 	// Get the coordinates of the new tank from its player number
	this.tanks[ this.userNumber ] = new Friend.Tree.Game.Sprite3D( this.tree, 'tank',
	{
		root: this.root,
		parent: this.map,
		x: coords.x,
		y: coords.y,
		rotation: 240,
		imageName: 'tank3D',
		perspective: 0.006,
		processes:
		[
			// A process to automatically send the object to the other players viaz the network
			{ type: 'Friend.Tree.Game.MultiPlayerHandler', params: { network: this.network } },
			// The tank movement process that will move the tank according the the players joystick
			{ type: 'Friend.Tree.Game.MoveTank', params: { speed: Battle.TANK_SPEED, rotationSpeed: 280, acceleration: 10, deceleration: 10 } },
		],
		collisions:
		[
			// The player tank collides with the tiles of the map
			{ caller: this, function: 'collisionTankGround', with : [ { name: 'map', params: { tiles: '<1><2><3><4><5><6><7><8><9><10>', zoneWidth: 20, zoneHeight: 20 } } ] },
			// And with the other player's tanks
			{ caller: this, function: 'collisionTankTank', with : [ { name: 'tankEnnemy' } ] },
		]
	} );

	// Pokes the number of the current player in the tank item
	this.tanks[ this.userNumber ].userNumber = this.userNumber;
	
	// Damage level to 100 at start
	this.tanks[ this.userNumber ].damage = 100;

	// Creates the damage bar indicator (ProgressBar item), semi-transparent
	this.damageBar = new Friend.Tree.UI.ProgressBar( this.tree, 'damage',
	{
		root: this.root,
		parent: this,
		x: 25,
		y: this.height - 50,
		z: 50,
		width: this.width - 50 - 50,
		height: 25,
		hotSpot: Friend.Tree.HOTSPOT_LEFTTOP,
		color: '#800000',
		backColor: '#FFFFFF',
		borderColor: '#000000',
		borderSize: '1',
		size: 100, //this.tanks[ this.userNumber ].damage,
		position: this.tanks[ this.userNumber ].damage,
		alpha: 0.5,
		noPerspective: -1
	} );

	
	// Creates the Quit button, semi transparent
	this.quit = new Friend.Tree.UI.Button( this.tree, 'buttonQuit',
	{
		root: this.root,
		parent: this,
		x: this.damageBar.x + this.damageBar.width,
		y: this.damageBar.y,
		z: 10,
		width: 50,
		height: this.damageBar.height,
		font: '12px Arial',
		text: 'Quit',
		theme: this.root.theme,
		caller: this,
		onClick: this.onClickQuitGame,
		alpha: 0.5,
		noPerspective: -1
	} );
	
	// Creates the engine diesel sound item
	var soundFlags = { };
	if ( this.playSounds )
	{
		soundFlags.root = this.root;
		soundFlags.parent = this;
		soundFlags.processes =
		[
			// If sounds play, adds a process to automatically start the sound when UP or DOWN joystick is pressed
			{ type: 'Friend.Tree.Sounds.PlayWhenJoystickDown', params: { keys: [ Friend.Tree.Controller.UP, Friend.Tree.Controller.DOWN ] } }
		];
	};
	this.diesel = new Friend.Tree.Sounds.Sound( this.tree, 'diesel', 
	{
		root: this.root,
		parent: this,
		soundName: 'diesel',
		processes:
		[
			// If sounds play, adds a process to automatically start the sound when UP or DOWN joystick is pressed
			{ type: 'Friend.Tree.Sounds.PlayWhenJoystickDown', params: { keys: [ Friend.Tree.Controller.UP, Friend.Tree.Controller.DOWN ] } }
		]
	} );
	
	// Creates the music object
	this.music = new Friend.Tree.Sounds.Sound( this.tree, 'music', 
	{ 
		root: this.root, 
		parent: this,
		soundName: 'music',
		loops: 0
	} );
	if ( this.playMusic )
		this.music.play();					// Starts the music
	
	// Creates the FPS indicator
/*	
	new Friend.Tree.Debug.Fps( this.tree, 'fps',
	{
		root: this.root,
		parent: this, 
		x: this.width - 173,
		y: 20,
		z: 10,
		width: 150,
		height: 75,
		color: '#000000',
		backColor: '#808080',
		font: '25px Arial',
		minFps: 45,
		numberOfBars: 100,
		alpha: 0.5,
		noPerspective: -1
	} );
*/	
/*
	new Friend.Tree.RendererImage( this.tree, 'rendererImage',
	{
		root: this.root,
		parent: this, 
		x: 0,
		y: 0,
		z: 10,
		width: 320,
		height: 200,
		imageName: 'capture'
	} );
	new Friend.Tree.AsciiArt( this.tree, 'pixelized',
	{
		root: this.root,
		parent: this, 
		x: 0,
		y: 200,
		z: 10,
		width: 640,
		height: 400,
		imageName: 'capture',
		horizontalResolution: 40,
		verticalResolution: 26
	} );
*/
	/*
	new Friend.Tree.Debug.Debugger( this.tree, 'debugger',
	{
		root: this.root,
		parent: this,
		z: 10
	} );
	*/
	// If hosting game (userNumber of host is always zero), creates bonusses if main host
	if ( this.userNumber == 0 )
	{
		for ( var i = 0; i < Battle.INITIALBONUSSES; i++ )
			this.createBonus( Math.floor( Math.random() * ( this.bonusses.length - 1 ) ) ); 	// Will exclude Friend quest tokens
		if ( this.friendQuest )
		{
			this.createBonus( Math.floor( this.bonusses.length - 1 ) );
		}
	}	
	this.tree.start();
};

Battle.prototype.onDormantExecute = function ( functionName, args )
{
	switch( functionName )
	{
		case 'quit':
		 	this.onClickQuitGame();
			break;
		case 'setMusic':
			if ( args[ 0 ] == 'on' )
			{
				this.playMusic = true;
				this.music.play();
			}
			else
			{
				this.playMusic = false;
				this.music.stop();
			}
			break;
		case 'setSounds':
			if ( args[ 0 ] == 'on' )
				this.playSounds = true;
			else
				this.playSounds = false;
			break;
	}
};

/**
 * Various constants
 */
Battle.DAMAGE = - 10;
Battle.INITIALBONUSSES = 7;
Battle.TANK_SPEED = 150;

/**
 * getTankCoordinates
 *
 * Returns the coordinates of creation of a tank, based on its player number
 *
 * @param (number) number player number
 */
Battle.prototype.getTankCoordinates = function ( player )
{
	var x = 1024 / 2 + player * 96;				// Tanks separated by 96 pixels
	var y = 96 + Math.floor( player / 4 ) * 96; // 4 tanks per line
	return { x: x, y: y };
};

/**
 * render
 *
 * Rendering function of the Battle
 * Does nothing but calls all the sub-items, map, damage bar, button, fps and sounds
 *
 * @param (object) context the drawing context
 * @param (number) x horizontal coordinate of drawing
 * @param (number) y vertical coordinate of drawing
 * @param (number) z depth coordinate of drawing
 * @param (number) zoom zoom factor
 */
Battle.prototype.render = function ( flags )
{
	return flags;
};

/**
 * messageUp
 *
 * Called at every update
 * Checks for FIREA to be pressed, and lauches a Bullet if pressed
 *
 * @param (number) delay time since last frame (milliseconds)
 * @param (number) zoom current zoom factor
 * @param (object) flags containing information
 */
Battle.prototype.messageUp = function ( message )
{
	// We only want 'refresh' or 'controller'
	if ( message.command != 'refresh' && message.type != 'controller' )
		return null;

	// No more tanks
	// Fire is pressed?
	if ( !this.keyScroll && message.command == 'joystickdown' && message.code == Friend.Tree.Controller.FIRE1 )
	{
		// Gets the coordinates of creation of the bullet from the player's tank position and angle
		var coords = this.utilities.rotateCoordinates( this.tanks[ this.userNumber ].x, this.tanks[ this.userNumber ].y, 20, this.tanks[ this.userNumber ].rotation );
		
		// Creates the bullet
		var bullet = new Friend.Tree.Game.Sprite( this.tree, 'bullet', 
		{
			root: this.root,
			parent: this.map,
			x: coords.x,
			y: coords.y,
			z: this.tanks[ this.userNumber ].z + 0 / 100,
			rotation: this.tanks[ this.userNumber ].rotation, // Bullet goes in the same direction as the tank
			imageName: 'bullet',
			destroyAfter: 10000, // Bullet will be destroyed after 10 seconds if still alive, to avoid slow down
			processes:
			[
				// MultiPlayerHandler will ensure that the same bullet is automatically created anbd destroyed on the other machines
				{ type: 'Friend.Tree.Game.MultiPlayerHandler', params: { network: this.network } },
				// Bullets move in straight line, and theiir angle is controlled by LEFT and RIGHT (rotationSpeed of MoveLine)
				{ type: 'Friend.Tree.Game.MoveLine', params: { object: bullet, speed: 250, rotationSpeed: 100 } },
			],
			collisions:
			[
				// Bullets collide with himself, after 500 milliseconds
				{ caller: this, function: 'collisionBulletTank', with : [ { name: 'tank', after: 500 } ] },
				// Bullets collide with the ennemy tanks
				{ caller: this, function: 'collisionBulletTankEnnemy', with : [ { name: 'tankEnnemy' } ] },
				// Bullets collide on map
				{ caller: this, function: 'collisionBulletGround', with : [ { name: 'map', params: { tiles: '<1><2><3><4><5><6><7><8><9><10>' } } ] }
			]
		} );

		// Plays a cannon sound
		if ( this.playSounds )
	 	{
			new Friend.Tree.Sounds.Sound( this.tree, 'cannon', 
			{ 
				root: this.root, 
				parent: this, 
				soundName: 'cannon',
				destroyAtEnd: true 
			} ).play();
		}
	}

	// If the player has lost, he can scroll the map with the keys
	if ( this.keyScroll )
	{
		if ( this.controller.isDown( Friend.Tree.Controller.LEFT ) )
			this.map.moveOffsets( - 16, 0 );
		if ( this.controller.isDown( Friend.Tree.Controller.RIGHT ) )
			this.map.moveOffsets( 16, 0 );
		if ( this.controller.isDown( Friend.Tree.Controller.UP ) )
			this.map.moveOffsets( 0, - 16 );
		if ( this.controller.isDown( Friend.Tree.Controller.DOWN ) )
			this.map.moveOffsets( 0, 16 );
	}

	// Call all the subprocesses
	return this.startProcess( message, [ ] );
};
/**
 * messageDown
 *
 * Ends the process exploration for the Battle item
 *
 * @param (number) delay time since last frame (milliseconds)
 * @param (number) zoom current zoom factor
 * @param (object) flags containing information
 */
Battle.prototype.messageDown = function ( message )
{
	return this.endProcess( message, [ ] );
};


/**
 * collisionTankTank
 *
 * Called when the player tank collides with another player tank
 *
 * @param (object) tank the player's tank
 * @param (object) the ennemy tank it collides with
 * @return (string) return 'stop' and the tank will stop
 */
Battle.prototype.collisionTankTank = function ( tank, objects )
{
	return 'stop';
};

/**
 * collisionBulletTank
 *
 * Called when a bullet collides with the player's tank
 *
 * @param (object) bullet the colliding bullet
 * @param (array of items) the tanks it collides with (here, only the player's tank)
 * @return (string) return 'stop' and the tank will stop
 */
Battle.prototype.collisionBulletTankEnnemy = function ( bullet, collisions )
{
	// Detroys the bullet
	bullet.destroy();

	// Adds damage
	for ( var c = 0; c < collisions.length; c++ )
	{
		for ( var i in collisions[ c ].items )
		{
			var item = collisions[ c ].items[ i ];

			item.damage += Battle.DAMAGE;

			// Updates the damage bar
			var bar = item.findItemFromName( 'damageBar', this.root );
			if ( bar )
				bar.setPosition( item.damage );

			// Send message to other players
			this.network.sendMessageToAll( 'tankDamage',
			{
				userNumber: item.userNumber,
				damage: Battle.DAMAGE
			} );
		}
	}

	// Creates a new explosion item
	var explosion = new Friend.Tree.Game.Sprite( bullet.tree, 'explosion',
	{
		root: this.root,
		parent: this.map,
		x: bullet.x,
		y: bullet.y,
		z: 5,
		imageName: 'explosion1',
		processes:
		[
			// Will be automatically created on other player's machine
			{ type: 'Friend.Tree.Game.MultiPlayerHandler', params: { network: this.network } },
			// Simple animation that destroys the explosion item at the end
			{ 
				type: 'Friend.Tree.Game.AnimSimple', 
				params: 
				{ 
					object: explosion, 
					imageList: 'explosion', 
					start: 1, 
					end: 7, 
					loop: 1, 
					speed: 10, 
					final: 'destroy' 
				} 
			}
		]
	} );

	// Play an explosion sound
	if ( this.playSounds )
	{
		new Friend.Tree.Sounds.Sound( this.tree, 'explosion', 
		{ 
			root: this.root, 
			parent: this, 
			soundName: 'explosion',
			destroyAtEnd: true 
		} ).play();
	}

	// Returns stop
	return 'stop';
};

Battle.prototype.collisionBulletTank = function ( bullet, items )
{
	// Detroys the bullet
	bullet.destroy();

	// Creates a new explosion item
	var explosion = new Friend.Tree.Game.Sprite( this.tree, 'explosion',
	{
		root: this.root,
		parent: this.map,
		x: bullet.x,
		y: bullet.y,
		z: 5,
		imageName: 'explosion1',
		processes:
		[
			// Will be automatically created on other player's machine
			{ type: 'Friend.Tree.Game.MultiPlayerHandler', params: { network: this.network } },
			// Simple animation that destroys the explosion item at the end
			{ type: 'Friend.Tree.Game.AnimSimple', params: { object: explosion, imageList: 'explosion', start: 1, end: 7, loop: 1, speed: 10, final: 'destroy' } }
		]
	} );

	// Play an explosion sound
	if ( this.playSounds )
	{
		new Friend.Tree.Sounds.Sound( this.tree, 'explosion', 
		{ 
			root: this.root, 
			parent: this, 
			soundName: 'explosion', 
			destroyAtEnd: true 
		} ).play();
	}

	// Updates damage
	var tank = this.tanks[ this.userNumber ];
	tank.damage = Math.min( 100, tank.damage + Battle.DAMAGE );
	this.damage = tank.damage;
	this.checkPlayerDamage();

	// Send message to other players
	this.network.sendMessageToAll( 'tankDamage',
	{
		userNumber: this.userNumber,
		damage: Battle.DAMAGE
	} );

	// Returns stop
	return 'stop';
};


/**
 * collisionBulletGround
 *
 * Called when a bullet collides with the map
 *
 * @param (object) bullet the colliding bullet
 * @param (array of items) the map
 * @return (string) return 'destroy' and the bullet will be destroyed
 */
Battle.prototype.collisionBulletGround = function ( bullet, items )
{
	// Destroys the bullet
	bullet.destroy();

	// Creates an explosion
	var explosion = new Friend.Tree.Game.Sprite( this.tree, 'explosion',
	{
		root: this.root,
		parent: this.map,
		x: bullet.x,
		y: bullet.y,
		z: 5,
		imageName: 'explosion1',
		processes:
		[
			// Explosiion will appear on other player's machines
			{ type: 'Friend.Tree.Game.MultiPlayerHandler', params: { network: this.network } },
			// Simple animation destroying the explosion at the end
			{ 
				type: 'Friend.Tree.Game.AnimSimple', 
				params: 
				{ 
					object: explosion, 
					imageList: 'explosion', 
					start: 1, 
					end: 8, 
					loop: 1, 
					speed: 10, 
					final: 'destroy' 
				} 
			}
		]
	} );

	// Plays the explosion sound
	if ( this.playSounds )
	{
		new Friend.Tree.Sounds.Sound( this.tree, 'explosion', 
		{ 
			root: this.root, 
			parent: this, 
			soundName: 'explosion',
			destroyAtEnd: true 
		} ).play();
	}
	return 'destroy';
};

/**
 * collisionTankGround
 *
 * Called when the player's tank collides with the map
 *
 * @param (object) bullet the colliding bullet
 * @param (array of items) the map
 * @return (string) return 'stop' and the tank will stop
 */
Battle.prototype.collisionTankGround = function ( object, objects )
{
	return 'stop';
};

/**
 * handleMultiPlayerMessages
 *
 * The network object sends messages to the game when a new object is created on another player's machine
 * or when another player connects or disconnects
 *
 * @param (string) command 
 * @param (object) data associated data
 */
Battle.prototype.handleMultiPlayerMessages = function ( command, data )
{
	// Depending on the command
	switch ( command )
	{
		// Player disconnected, destroys the player's tank and displays an alert box
		case 'runningUserDisconnected':
			// Destroys the tank
			this.tanks[ data.userNumber ].destroy();	// userNumber transitted by Network
			// Adds a breif message box
			new Friend.Tree.UI.TextBox( this.tree, 'textbox',
			{
				root: this.root,
				parent: this,
				width: 500,
				height: 80,
				z: 50,
				text: 'Player ' + data.userNumber + ' has disconnected.',
				absolute: true,				// Creates the item relative to screen and not map
				noOffsets: true,			// Does not move with the previous item
				destroyAfter: 2000			// Disappears after 2 seconds
			} );
			break;

		// Host disconnected, destroys the player's tank and displays an alert box, the game is in practice now
		case 'aborted':

			// Destroys the other tanks
			for ( var p = 0; p < this.tanks.length; p++ )
			{
				if ( this.tanks[ p ].userNumber != this.userNumber )
				{
					this.tanks[ p ].destroy();
				}
			}

			// Turn player in player 0
			this.tanks[ 0 ] = [ this.tanks[ this.userNumber ] ];
			this.userNumber = 0;

			// Adds a brief message box
			new Friend.Tree.UI.TextBox( this.tree, 'textbox',
			{
				root: this.root,
				parent: this,
				width: 500,
				height: 80,
				z: 10,
				text: 'A network error occured... Game aborted.',
				absolute: true,				// Creates the item relative to screen and not map
				noOffsets: true,			// Does not move with the previous item
				destroyAfter: 2000			// Disappears after 2 seconds
			} );

			// Closes the game after 2 seconds
			var self = this;
			window.setTimeout( function()
			{
				self.onClickQuitGame();
			}, 2000 );
			break;

		// Application started!
		case 'applicationStart':
			this.setupGame();
			break;

		// An object has been destroyed. If tank end game if last one
		case 'destroy':
			switch ( data.name )
			{
				case 'tank':
					// Remove the tank from list
					this.tanks[ data.userNumber ] = false;

					// Quit if it was the last one
					var count = 0;
					for ( var t = 0; t < this.tanks.length; t++ )
					{
						if ( this.tanks[ t ] )
							count++;
					}

					// You have won the game!
					if ( count == 1 )
					{
						// Adds a brief message box
						new Friend.Tree.UI.TextBox( this.tree, 'textbox',
						{
							root: this.root,
							parent: this,
							width: 500,
							height: 80,
							z: 10,
							text: 'You have won the game!',
							absolute: true,				// Creates the item relative to screen and not map
							noOffsets: true,			// Does not move with the previous item
							destroyAfter: 2000			// Disappears after 2 seconds
						} );
						var self = this;
						this.quitTimeout = setTimeout( function()
						{
							self.onClickQuitGame();
						}, 2000 );
					}
					break;
			}
			break;

		// A new object has been created on another player's machine, we must create a reflexion of it on the local machine
		// NOTE: this process can be automatic: in future versions of the tree engine.
		case 'create':
			switch ( data.name )			// data.name contains the name of the created object
			{
				// Creates their replica of another player's tank
				case 'tank':
					// The creationFlags of the object from the other side are transmitted by the Network object
					data.creationFlags.root = this.root;
					data.creationFlags.parent = this.map;
					data.creationFlags.processes = // Adds a MultiPlayerHandler object to synchronise between machines
					[
						{ type: 'Friend.Tree.Game.MultiPlayerHandler', params: { network: this.network } }
					];
					// Creates the ennemy tank object, with the flags (including subitems to bubble and damage/text)
					var tank = new Friend.Tree.Game.Sprite3D( this.tree, 'tankEnnemy', data.creationFlags );
					// Pokes the ennemy player number in the tank item
					tank.userNumber = data.userNumber;
					// Sets damage top 100 (new tank)
					tank.damage = 100;
					// Put in the list of tanks
					this.tanks[ data.userNumber ] = tank;

					// A 'Bubble' item containing the name and damage bar
					var bubble = new Friend.Tree.Game.Sprite( this.tree, 'bubble',
					{
						root: this.root,
						parent: tank,
						x: 0,
						y: -30,
						z: 10,
						imageName: 'bubble',
						alpha: 0.5,						// Semi transparent
						noRotation: true,				// Compensates to rotation of first parent, the tank
						noPerspective: true				// No perspective inside the bubble
					} );
					// text item to display the name of the other player
					new Friend.Tree.UI.Text( this.tree, 'name',
					{
						root: this.root,
						parent: bubble,
						x: -35,
						y: -65,
						z: 11,
						width: 80,
						height: 60,
						text: data.userName, // The name of the player is transmitted in the message
						color: '#000000',
						font: '12px Arial',
						hAlign: 'center',
						vAlign: 'middle',
						alpha: 0.5						// Semi transparent
					} );
					// A small damage bar as well
					new Friend.Tree.UI.ProgressBar( this.tree, 'damageBar',
					{
						root: this.root,
						parent: bubble,
						backColor: '#FFFFFF',
						color: '#FF0000',
						borderColor: '#000000',
						x: -26,
						y: -26,
						z: 11,
						width: 60,
						height: 8,
						size: 100,
						position: 100,
						alpha: 0.5						// Semi transparent
					} );
					return tank;

				// A 'speed' bonus has been created (on the host machine)
				case 'speed':
					data.creationFlags.processes =
					[
						// Static movement process only performs collision detection
						{ type: 'Friend.Tree.Game.MoveStatic' },
						// Makes it handled by the Network object
						{ type: 'Friend.Tree.Game.MultiPlayerHandler', params: { network: this.network } }
					];

					// Adds collision with the local player's tank
					data.creationFlags.root = this.root;
					data.creationFlags.parent = this.map;
					data.creationFlags.collisions = [ { caller: this, function: 'collisionBonus', with : [ { name: 'tank' } ] } ];

					// Create the sprite with the flags from the other side
					var bonus = new Friend.Tree.Game.Sprite( this.tree, 'speed', data.creationFlags );

					// Pokes the identifier of the bonus in the item
					bonus.number = 0;
					return bonus;

				// A 'teleport' bonus has been created (on the host machine)
				case 'teleport':
					data.creationFlags.processes =
					[
						// Static movement process only performs collision detection
						{ type: 'Friend.Tree.Game.MoveStatic' },
						// Makes it handled by the Network object
						{ type: 'Friend.Tree.Game.MultiPlayerHandler', params: { network: this.network } }
					];

					// Adds collision with the local player's tank
					data.creationFlags.root = this.root;
					data.creationFlags.parent = this.map;
					data.creationFlags.collisions = [ { caller: this, function: 'collisionBonus', with : [ { name: 'tank' } ] } ];

					// Create the sprite with the flaghs from the other side
					var bonus = new Friend.Tree.Game.Sprite( this.tree, 'teleport', data.creationFlags );

					// Pokes the identifier of the bonus in the item
					bonus.number = 1;
					return bonus;

				// A 'wrench' bonus has been created (on the host machine)
				case 'wrench':
					data.creationFlags.processes =
					[
						// Static movement process only performs collision detection
						{ type: 'Friend.Tree.Game.MoveStatic' },
						// Makes it handled by the Network object
						{ type: 'Friend.Tree.Game.MultiPlayerHandler', params: { network: this.network } }
					];

					// Adds collision with the local player's tank
					data.creationFlags.root = this.root;
					data.creationFlags.parent = this.map;
					data.creationFlags.collisions = [ { caller: this, function: 'collisionBonus', with : [ { name: 'tank' } ] } ];

					// Create the sprite with the flags from the other side
					var item = new Friend.Tree.Game.Sprite( this.tree, 'wrench', data.creationFlags );

					// Pokes the identifier of the bonus in the item
					item.number = 2;
					return bonus;

				// An explosion has been created on another machine
				case 'explosion':
					data.creationFlags.processes =
					[
						// Handles network network
						{ type: 'Friend.Tree.Game.MultiPlayerHandler', params: { network: this.network } }
					];

					// Set local data
					data.creationFlags.root = this.root;
					data.creationFlags.parent = this.map;

					// Creates the explosion, no need of animation they will be automatically handled by Tree (Network object)
					return new Friend.Tree.Game.Sprite( this.tree, 'bullet', data.creationFlags );

				// A bullet has been created on another machine
				case 'bullet':
					data.creationFlags.processes =
					[
						// Handles network network
						{ type: 'Friend.Tree.Game.MultiPlayerHandler', params: { network: this.network } }
					];

					// Set local data
					data.creationFlags.root = this.root;
					data.creationFlags.parent = this.map;

					// Creates the bullet
					return new Friend.Tree.Game.Sprite( this.tree, 'explosion', data.creationFlags );
			}
			break;

		// Tank damage message from another player
		case 'tankDamage':
			data = data.data;			// TODO: Change this!
			// Finds the other player's tank (player number tranmsmitted in Network message)
			tank = this.tanks[ data.userNumber ];
			// Updates its local damage
			tank.damage = Math.min( 100, tank.damage + data.damage );
			// Finds the small damage bar in the Bubble
			var bar = tank.findItemFromName( 'damageBar', this.root );	// Bubble is a sub-item of the tank
			if ( bar )
				bar.setPosition( tank.damage );
			// If the player is the local player
			if ( this.userNumber == data.userNumber )
				this.checkPlayerDamage();
			break;

		default:
			break;
	}
	return null;
};

Battle.prototype.checkPlayerDamage = function ()
{
	var tank = this.tanks[ this.userNumber ];

	// Show damage in the big damage bar
	this.damageBar.setPosition( tank.damage );

	// Player is dead?
	if ( tank.damage < 0 )
	{
		// Destroys the player's tank it will be destroyed on the other machines (due to the MultiplayerHandler process)
		this.tree.addToDestroy( tank );

		// Quit if it was the last one
		this.tanks[ this.userNumber ] = false;
		var count = 0;
		for ( var t = 0; t < this.tanks.length; t++ )
		{
			if ( this.tanks[ t ] )
				count++;
		}
		if ( count == 0 )
			this.onClickQuitGame();

		// Authorise manual scrolling to watch the end of the game
		this.keyScroll = true;

		// Displays a short message telling that you can scroll the playfield with the keyhs
		new Friend.Tree.UI.TextBox( this.tree, 'textbox',
		{
			root: this.root,
			parent: this.map,
			width: 500,
			height: 80,
			z: 9,
			text: 'You can now move the playfield with the keys...',
			absolute: true,				// Creates the item relative to screen and not map
			noOffsets: true,			// Does not move with the previous item
			destroyAfter: 2000			// Disappears after 2 seconds
		} );
	}
};

/**
 * onClickQuitGame
 *
 * Called when the user clicks on the 'Quit' button
 */
Battle.prototype.onClickQuitGame = function ()
{
	// A timeout to clear?
	if ( this.quitTimeout )
	{
		clearTimeout( this.quitTimeout );
		this.quitTimeout = false;
	}

	// No more music
	this.music.stop();

	// Close eventual network connections
	this.network.closeRunningConnections();
	this.network.closeConnections();

	// If Friend Quest and user has got the token: display dialog!
	var self = this;
	if ( this.friendQuest && this.gotFriendToken )
	{
		this.dialog = new Friend.Tree.UI.Dialog( this.tree, 'quest',
		{
			root: this.root,
			parent: this,
			z: 100,						// No X and Y-> will be centered in the parent
			width: 357 + 16 * 2,
			height: 445 + 64,
			title: '',
			caller: this,
			OK: 'Get my reward!',
			onOK: onOK,
			cancel: 'Cancel',
			onCancel: onCancel,
			theme: this.root.theme
		} );
		new Friend.Tree.Game.Bitmap( this.tree, 'yeah!',
		{
			root: this.root,
			parent: this.dialog,
			x: 16,
			y: 16,
			imageName: 'quest'
		} );
		if ( this.playSounds)
		{
			new Friend.Tree.Sounds.Sound( this.tree, 'applause', 
			{ 
				root: this.root, 
				parent: this.dialog, 
				soundName: 'applause'
			} ).play();
			new Friend.Tree.Sounds.Sound( this.tree, 'winning', 
			{ 
				root: this.root, 
				parent: this.dialog, 
				soundName: 'winning',
				loops: 10
			} ).play();
		}
		this.tree.setModal( this.dialog, true );

		function onOK()
		{
			self.tree.setModal( self.dialog, false );
			
			// Connect to FriendUP
			window.open('https://www.friendup.cloud', '_blank');
			goToTitle();
		}
		function onCancel()
		{
			self.tree.setModal( self.dialog, false );
			goToTitle();
		}
	}
	else
	{
		goToTitle();
	}
	function goToTitle()
	{
		// Destroys the game, and launch the title when it is done...
		self.destroy( function()
		{
			// Branch the Title page, transmitting the current basic information
			new Title( self.tree, 'title',
			{
				root: self.root,
				parent: self.root,
				x: 0,
				y: 0,
				z: 0,
				width: self.width,
				height: self.height,
				playSounds: self.playSounds,
				playMusic: self.playMusic,
				usersList: self.usersList
			} );
		} );
	}
};

/**
 * createBonus
 *
 * Creates a new bonus at a random safe location in the map
 *
 * @param (number) nujm number of the bonus to create
 */
Battle.prototype.createBonus = function ( num )
{
	// Finds a free location
	var x, y;
	var OK;
	if ( this.bonusses[ num ] != 'frnd' )
	{
		do
		{
			x = 1 + Math.floor( Math.random() * ( this.map.mapWidth - 2 ) );		// Map coordinate far from the edges
			y = 1 + Math.floor( Math.random() * ( this.map.mapHeight - 2 ) );		// Map coordinate far from the edges
			OK = this.checkFreeMapLocation( x, y, 48, 48 );							// Check if this location is empty, and loops if it is not
		}
		while ( !OK );
	}
	else
	{
		// FRND token are created in the second half of the playfield
		do
		{
			x = 1 + Math.floor( Math.random() * ( this.map.mapWidth - 2 ) );		
			y = 1 + Math.floor( Math.floor( this.map.mapHeight / 2 ) +  Math.random() * ( Math.floor( this.map.mapHeight / 2 ) - 1 ) );
			OK = this.checkFreeMapLocation( x, y, 48, 48 );						
		}
		while ( !OK );
	}

	// Creates the bonus
	var bonus = new Friend.Tree.Game.Sprite( this.tree, this.bonusses[ num ],
	{
		root: this.root,
		parent: this.map,
		x: x * this.map.tileWidth,
		y: y * this.map.tileHeight,
		z: 10,
		imageName: this.bonusses[ num ],
		processes:
		[
			// Bonus will be created automatically on the other machines
			{ type: 'Friend.Tree.Game.MultiPlayerHandler', params: { network: this.network } },
			// Only checks for collisions
			{ type: 'Friend.Tree.Game.MoveStatic' }
		],
		collisions:
		[
			// Bonus collides with local player's tank
			{ caller: this, function: 'collisionBonus', with : [ { name: 'tank' } ] },
		]
	} );

	// Pokes the number of the bonus in the item
	bonus.number = num;
};

/**
 * checkFreeMapLocation
 *
 * Verifies that a map coordinate is free of obstacles and tanks
 *
 * @param (number) x horizontal map coordinate
 * @param (number) y vertical map coordinate
 * @return (boolean) true if free, false if not
 */
Battle.prototype.checkFreeMapLocation = function ( x, y, width, height )
{
	var OK = true;

	// Look for tiles around the position
	for ( var xx = - 2; xx < 3; xx ++ )
	{
		for ( var yy = - 2; yy < 3; yy ++ )
		{
			if ( this.map.getTile( x + xx, y + yy ) != - 1 )
				OK = false;
		}
	}

	// Look for other tanks
	var rect = new Friend.Tree.Utilities.Rect( x * this.map.tileWidth, y * this.map.tileHeight, width, height );
	for ( var i in this.tanks )
	{
		// Checks for intersections in items rectangles
		if ( this.tanks[ i ].rect && this.tanks[ i ].rect.isRectIn( rect ) )
		{
			OK = false;
			break;
		}
	}
	return OK;
};

/**
 * collisionBonus
 *
 * Called when the local player's tank collides with a bonus
 *
 * @param (object) bonus the bonus colliding
 * @param (array of objects) the colliding tank
 */
Battle.prototype.collisionBonus = function ( bonus, collisions )
{
	// Destroys the bonus
	bonus.destroy();

	// Explore the collisions
	for ( var c = 0; c < collisions.length; c++ )
	{
		for ( var i in collisions[ c ].items )
		{
			var tank = collisions[ c ].items[ i ];

			// Depending on the kind of bonus
			var soundToPlay;
			switch ( bonus.number )
			{
				// Speed
				case 0:
					// Get the MoveTank process of the tank
					var movement = tank.getProcess( 'Friend.Tree.Game.MoveTank' );
					// Sets the normal speed (in case it was already going fast)
					movement.setSpeed( Battle.TANK_SPEED );
					// Sets a temporary function that will poke the new speed immediately and restore the speed to normal after 10 seconds
					movement.setSpeed( Battle.TANK_SPEED + 200 );
					movement.callAfter( 'setSpeed', Battle.TANK_SPEED, 10000 );
					if ( this.playSounds )
			  	    {
						// Plays a Formula 1 engine sound
						new Friend.Tree.Sounds.Sound( this.tree, 'fast', 
						{ 
							root: this.root, 
							parent: this, 
							soundName: 'fast', 
							destroyAfter: 10000 
						} ).play();
					}
					break;

				// Teleport
				case 1:
					// Finds a free location on the map
					var OK = true;
					var x, y;
					do
					{
						x = 2 + Math.floor( Math.random() * this.map.mapWidth - 4 );
						y = 2 + Math.floor( Math.random() * this.map.mapHeight - 4 );
						OK = this.checkFreeMapLocation( x, y, tank.rect.width, tank.rect.height );
					}
					while ( ! OK );
					// Moves the tank
					tank.setCoordinates( x * this.map.tileWidth, y * this.map.tileHeight );
					soundToPlay = 'bonus';
					break;

				// Wrench
				case 2:
					// Restore tank damage
					tank.damage = Math.min( 100, tank.damage + 25 );
					// Show in main damage bar
					this.damageBar.setPosition( tank.damage );
					// Send message to other players, so that they update the damage bar in the bubbles
					this.network.sendMessageToAll( 'tankDamage',
					{
						userNumber: tank.userNumber,
						damage: 25
					} );
					soundToPlay = 'bonus';
					break;

				// FRND token
				case 3:
					this.gotFriendToken = true;
					soundToPlay = 'cash';

					// Display a message!
					new Friend.Tree.UI.Text( this.tree, 'gotIt!',
					{
						root: this.root,
						parent: this,
						width: 500,
						height: 80,
						z: 50,
						font: '40px sans serif',
						color: '#FFFFFF',
						text: 'Well done!',
						absolute: true,	
						noOffsets: true,
						destroyAfter: 2000
					} );
					break;
			}

			// Play a sound
			if ( this.playSounds && soundToPlay )
			{
				new Friend.Tree.Sounds.Sound( this.tree, soundToPlay, 
				{ 
					root: this.root, 
					parent: this, 
					soundName: soundToPlay, 
					destroyAtEnd: true 
				} ).play();				
			}
		}
	}
};
