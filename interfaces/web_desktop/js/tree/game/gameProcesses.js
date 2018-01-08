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
 * Tree game movements
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 21/08/2017
 */
Friend = window.Friend || {};
Friend.Tree = Friend.Tree || {};
Friend.Game = Friend.Game || {};
Friend.Flags = Friend.Flags || {};

/**
 * AnimSimple
 *
 * Process that animates an image
 *
 * @param (object) tree the Tree object
 * @param (object) object the item to modify
 * @param (object) flags initialisation flags
 *
 * Flags
 * speed: speed of the animation (in frames per seconds)
 * final: (optional) what to do at the end. '' or not defined does nothing, 'destroy' destroys the item
 * loop: (optional) number of animation loops (default = 1, <=0 infinite)
 * loopTo: (optional) number of the image to loop to (default = 0)
 */
Friend.Game.AnimSimple = function( tree, object, flags )
{
	this.speed = 2;
	this.final = '';
	this.loop = 1;
	this.loopTo = 0;
	Friend.Tree.Processes.init( this, tree, object, 'Friend.Game.AnimSimple', flags );
	Object.assign( this, Friend.Game.AnimSimple );
	this.setSpeed( this.speed );

	this.images = [ ];
	if ( typeof flags.imageList != 'undefined' )
	{
		for ( var i = flags.start; i < flags.end; i++ )
			this.images.push( flags.imageList + i );
	}
	else
	{
		for ( var i = 0; i < flags.images.length; i++ )
			this.images.push( flags.images[ i ] );
	}

	this.startAnimation();
};
Friend.Game.AnimSimple.startAnimation = function ()
{
	this.imageCount = 0;
	this.loopCount = this.loop;
	this.done = false;
	this.speedCalc = this.speed / 1000;
	this.calculation = 0;
	this.previousCalculation = 0;
};
Friend.Game.AnimSimple.processUp = function ( flags )
{
	if ( ! flags.command )
    {
		if ( this.done )
			return false;

		var change = false;
		this.calculation += this.speedCalc * flags.delay;
		var nImages = Math.floor( this.calculation - this.previousCalculation );
		for ( var i = 0; i < nImages; i ++ )
		{
			change = true;
			this.imageCount ++;
			this.previousCalculation = this.calculation;
			if ( this.imageCount >= this.images.length )
			{
				if ( this.loopCount >= 0 )
				{
					this.loopCount --;
					if ( this.loopCount == 0 )
					{
						this.imageCount --;
						switch ( this.final )
						{
							case 'destroy':
								this.done = true;
								this.object.destroy();
								break;
							default:
								this.done = true;
								break;
						}
					}
					else
						this.imageCount = 0;
				}
			}
			if ( this.done )
				break;
		}
		if ( change )
		{
			flags.image = this.images[ this.imageCount ];
			flags.refresh = true;
		}
	}
	return flags;
};
Friend.Game.AnimSimple.processDown = function ( flags )
{
	return flags;
};

/**
 * setSpeed
 *
 * Changes the speed of the animation
 *
 * @param (number) new speed, in images per seconds
 */
Friend.Game.AnimSimple.setSpeed = function ( speed )
{
	this.speed = speed;
	this.speedCalc = speed / 1000;
};


/**
 * Process: moves the item in 8 directions from the Joystick input
 *
 * Add this process to an item and it willø move with the joystick
 *
 * @param { object } tree The tree object
 * @param { object } object The object to modifiy
 * @param { object } flags Creation flags
 *
 * Flags
 *
 * speed: (number) speed of the movement in pixels / second
 * autorisedDirections: (number) mask containing the authorised directions (defined with Controlled.UP/DOWN etc.)
 */
Friend.Game.MoveJoystick = function( tree, object, flags )
{
	this.x = 0;
	this.y = 0;
	this.xPrevious = 0;
	this.yPrevious = 0;
	this.speed = 50;
	this.directionMask = 0xFFFFFF;
	Friend.Game.Movements.init( this, tree, 'Friend.Game.MoveJoystick', object, flags );
	Object.assign( this, Friend.Game.MoveJoystick );

	this.setSpeed( this.speed );
};
Friend.Game.MoveJoystick.processUp = function ( flags )
{
	if ( !this.object.toDestroy && !flags.command )
	{
		if ( ( this.directionMask & Friend.Flags.UP ) != 0 && this.controller.isDown( Friend.Flags.UP ) == true )
		{
			this.y -= this.speedCalc * flags.delay;
		}
		if ( ( this.directionMask & Friend.Flags.DOWN ) != 0 && this.controller.isDown( Friend.Flags.DOWN ) == true )
		{
			this.y += this.speedCalc * flags.delay;
		}
		if ( ( this.directionMask & Friend.Flags.LEFT ) != 0 && this.controller.isDown( Friend.Flags.LEFT ) == true )
		{
			this.x -= this.speedCalc * flags.delay;
		}
		if ( ( this.directionMask & Friend.Flags.RIGHT ) != 0 && this.controller.isDown( Friend.Flags.RIGHT ) == true )
		{
			this.x += this.speedCalc * flags.delay;
		}
		if ( this.checkCollisions( this, flags.x + this.x - this.xPrevious, flags.y + this.y - this.yPrevious ).actions[ 'refresh' ] )
		{
			flags.x += this.x - this.xPrevious;
			flags.y += this.y - this.yPrevious;
			flags.refresh = true;
		}
		this.xPrevious = this.x;
		this.yPrevious = this.y;
	}
	return flags;
};
Friend.Game.MoveJoystick.processDown = function ( flags )
{
	return flags;
};
Friend.Game.MoveJoystick.setSpeed = function ( speed )
{
	this.speed = speed;
	this.speedCalc = this.speed / 1000;
};
Friend.Game.MoveJoystick.getSpeed = function ()
{
	return this.speed;
};

Friend.Game.MoveJoystickStepByStep = function( tree, object, flags )
{
	this.x = 0;
	this.y = 0;
	this.xPrevious = 0;
	this.yPrevious = 0;
	this.speed = 1;
	this.directionMask = 0xFFFFFF;
	Friend.Game.Movements.init( this, tree, 'Friend.Game.MoveJoystick', object, flags );
	Object.assign( this, Friend.Game.MoveJoystickStepByStep );
}
Friend.Game.MoveJoystickStepByStep.processUp = function ( flags )
{
	if ( !this.object.toDestroy && !flags.command )
	{
		if ( ( this.directionMask & Friend.Flags.UP ) != 0 && this.controller.isPressed( Friend.Flags.UP ) == true )
		{
			this.y -= this.speed;
		}
		if ( ( this.directionMask & Friend.Flags.DOWN ) != 0 && this.controller.isPressed( Friend.Flags.DOWN ) == true )
		{
			this.y += this.speed;
		}
		if ( ( this.directionMask & Friend.Flags.LEFT ) != 0 && this.controller.isPressed( Friend.Flags.LEFT ) == true )
		{
			this.x -= this.speed;
		}
		if ( ( this.directionMask & Friend.Flags.RIGHT ) != 0 && this.controller.isPressed( Friend.Flags.RIGHT ) == true )
		{
			this.x += this.speed;
		}
		if ( this.checkCollisions( this, flags.x + this.x - this.xPrevious, flags.y + this.y - this.yPrevious ).actions[ 'refresh' ] )
		{
			flags.x += this.x - this.xPrevious;
			flags.y += this.y - this.yPrevious;
			console.log( 'Coordinates: ' + flags.x + ' / ' + flags.y );
			flags.refresh = true;
		}
		this.xPrevious = this.x;
		this.yPrevious = this.y;
	}
	return flags;
};
Friend.Game.MoveJoystickStepByStep.processDown = function ( flags )
{
	return flags;
};

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
/**
 * Process: Static Movement
 *
 * Just checks for collisions
 *
 * @param { object } tree The tree object
 * @param { object } object The object to modifiy
 * @param { object } flags Creation flags
 */
Friend.Game.MoveStatic = function( tree, object, flags )
{
	Friend.Game.Movements.init( this, tree, 'Friend.Game.MoveStatic', object, flags );
	Object.assign( this, Friend.Game.MoveStatic );
}
Friend.Game.MoveStatic.processUp = function ( flags )
{
	return flags;
};
Friend.Game.MoveStatic.processDown = function ( flags )
{
	if ( ! flags.command )
		this.checkCollisions( this, flags.x, flags.y, flags.rotation, true )
	return flags;
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Process: MoveTank, moves the item like a tank seen from above
 *
 * Add this process to an item and it will move like a tank
 *
 * @param { object } tree The tree object
 * @param { object } object The object to modifiy
 * @param { object } flags Creation flags
 *
 * Flags
 *
 * speed: (number) speed of the movement in pixels / second
 * rotationSpeed: (number) speed of the item's rotationm, in degrees/second
 * acceleration: (number) intensity of acceleration in pixels / sqaure second, default = 1000 (instant acceleration)
 * deceleration: (number) intensity of deceleration in pixels / sqaure second, default = 1000 (instant stop)
 */
Friend.Game.MoveTank = function( tree, object, flags )
{
	this.checkCollisions = Friend.Game.Movements.checkCollisions;
	this.speed = 50;
	this.rotationSpeed = 180;
	this.acceleration = 1000;
	this.deceleration = 1000;
	Friend.Game.Movements.init( this, tree, 'Friend.Game.MoveTank', object, flags );
	Object.assign( this, Friend.Game.MoveTank );

	this.setSpeed( this.speed );
	this.setRotationSpeed( this.rotationSpeed );
	this.x = this.object.x;
	this.y = this.object.y;
	this.xPrevious = this.x;
	this.yPrevious = this.y;
	this.rotation = this.object.rotation;
	this.rotationPrevious = this.rotation;
}
Friend.Game.MoveTank.processUp = function ( flags )
{
	if ( !this.object.toDestroy && !flags.command )
	{
		if ( this.collisions == 'stop' )
		{
			if ( ! this.controller.isDown( Friend.Flags.UP | Friend.Flags.DOWN ) )
				this.collisions = '';
		}
		else
		{
			if ( this.controller.isDown( Friend.Flags.UP ) == true )
			{
				this.x = this.x + this.speedCalc * flags.delay * Math.cos( this.rotation * Friend.Flags.DEGREETORADIAN );
				this.y = this.y - this.speedCalc * flags.delay * Math.sin( this.rotation * Friend.Flags.DEGREETORADIAN );
			}
			if ( this.controller.isDown( Friend.Flags.DOWN ) == true )
			{
				this.x = this.x - this.speedCalc * flags.delay * Math.cos( this.rotation * Friend.Flags.DEGREETORADIAN );
				this.y = this.y + this.speedCalc * flags.delay * Math.sin( this.rotation * Friend.Flags.DEGREETORADIAN );
			}
			if ( this.controller.isDown( Friend.Flags.LEFT ) == true )
			{
				this.rotation = ( this.rotation + this.rotationSpeedCalc * flags.delay ) % 360;
			}
			if ( this.controller.isDown( Friend.Flags.RIGHT ) == true )
			{
				this.rotation = ( this.rotation - this.rotationSpeedCalc * flags.delay ) % 360;
			}
			this.collisions = this.checkCollisions( this, flags.x + this.x - this.xPrevious, flags.y + this.y - this.yPrevious, this.rotation );
			if ( this.collisions.actions[ 'refresh' ] )
			{
				flags.x += this.x - this.xPrevious;
				flags.y += this.y - this.yPrevious;
				flags.rotation = this.rotation;
				flags.refresh = true;
			}
			this.xPrevious = this.x;
			this.yPrevious = this.y;
			//if ( this.collisions == 'stop' )
		}
	}
	return flags;
};
Friend.Game.MoveTank.processDown = function ( flags )
{
	return flags;
}

/**
 * setSpeed
 *
 * Changes the speed of the movement
 *
 * @param (number) speed new speed, in pixels/second
 */
Friend.Game.MoveTank.setSpeed = function ( speed )
{
	this.speed = speed;
	this.speedCalc = speed / 1000;
};

/**
 * getSpeed
 *
 * Returns the current speed
 *
 * @return (number) speed
 */
Friend.Game.MoveTank.getSpeed = function ()
{
	return this.speed;
};

/**
 * setRotationSpeed
 *
 * Changes the speed of rotation
 *
 * @param (number) new speed, in degrees/second
 */
Friend.Game.MoveTank.setRotationSpeed = function ( speed )
{
	this.rotationSpeed = speed;
	this.rotationSpeedCalc = speed / 1000;
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Process: MoveLine, moves the item like on a line
 *
 * Add this process to an item and it will move in a straight line
 *
 * @param { object } tree The tree object
 * @param { object } object The object to modifiy
 * @param { object } flags Creation flags
 *
 * Flags
 *
 * speed: (number) speed of the movement in pixels / second
 * rotationSpeed: (number) speed of the item's rotationm, in degrees/second. Rotation is triggered by Controller keys LEFT and RIGHT
 */
Friend.Game.MoveLine = function( tree, object, flags )
{
	this.x = object.x;
	this.y = object.y;
	this.xPrevious = this.x;
	this.yPrevious = this.y;
	this.rotation = object.rotation;
	this.rotationPrevious = this.rotation;
	this.checkCollisions = Friend.Game.Movements.checkCollisions;
	this.speed = 50;
	this.rotationSpeed = 0;
	Friend.Game.Movements.init( this, tree, 'Friend.Game.MoveLine', object, flags );
	Object.assign( this, Friend.Game.MoveLine );

	this.setSpeed( this.speed );
	this.setRotationSpeed( this.rotationSpeed );
};
Friend.Game.MoveLine.processUp = function ( flags )
{
	if ( !this.object.toDestroy && !flags.command )
	{
		if ( this.rotationSpeed )
		{
			if ( this.controller.isDown( Friend.Flags.LEFT ) == true )
				this.rotation = ( this.rotation + this.rotationSpeedCalc * flags.delay ) % 360;
			if ( this.controller.isDown( Friend.Flags.RIGHT ) == true )
				this.rotation = ( this.rotation - this.rotationSpeedCalc * flags.delay ) % 360;
		}
		this.x += Math.cos( this.rotation * Friend.Flags.DEGREETORADIAN ) * this.speedCalc * flags.delay;
		this.y -= Math.sin( this.rotation * Friend.Flags.DEGREETORADIAN ) * this.speedCalc * flags.delay;
		if ( this.checkCollisions( this, flags.x + this.x - this.xPrevious, flags.y + this.y - this.yPrevious, this.rotation ).actions[ 'refresh' ] )
		{
			flags.x += this.x - this.xPrevious;
			flags.y += this.y - this.yPrevious;
			flags.rotation += this.rotation - this.rotationPrevious;
			flags.refresh = true;
		}
		this.xPrevious = this.x;
		this.yPrevious = this.y;
		this.rotationPrevious = this.rotation;
		flags.refresh = true;
	}
	return flags;
};
Friend.Game.MoveLine.processDown = function ( flags )
{
	return flags;
}


/**
 * setSpeed
 *
 * Changes the speed of the movement
 *
 * @param (number) speed new speed, in pixels/second
 */
Friend.Game.MoveLine.setSpeed = function ( speed )
{
	this.speed = speed;
	this.speedCalc = speed / 1000;
};

/**
 * getSpeed
 *
 * Returns the current speed
 *
 * @return (number) speed
 */
Friend.Game.MoveLine.getSpeed = function ()
{
	return this.speed;
};

/**
 * setRotationSpeed
 *
 * Changes the speed of rotation
 *
 * @param (number) new speed, in degrees/second
 */
Friend.Game.MoveLine.setRotationSpeed = function ( speed )
{
	this.rotationSpeed = speed;
	this.rotationSpeedCalc = speed / 1000;
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Common movement processes functions
 */
Friend.Game.Movements =
{
	/**
	 * Movement processes initialisation
	 *
	 * Must be called at the creation of each movement
	 *
	 * @param (object) self the process itself
	 * @param (object) tree the Tree engine
	 * @param (string) name of the process class
	 * @param (object) object the item assigned to the process
	 * @param (object) flags the creation flags
	 */
	init: function ( self, tree, className, object, flags )
	{
		self.tree = tree;
		self.utilities = tree.utilities;
		self.object = object;
		self.root = object.root;
		self.className = className;
		self.utilities.setFlags( self, flags );
		self.controller = tree.controller;
		self.addProcess = Friend.Tree.Items.addProcess;
		self.removeProcess = Friend.Tree.Items.removeProcess;
		self.checkCollisions = this.checkCollisions;
		self.getTemporaryFunctions = Friend.Tree.Items.getTemporaryFunctions;
		self.getTemporaryFunctionsCount = Friend.Tree.Items.getTemporaryFunctionsCount;
		self.setTemporaryProperty = Friend.Tree.Items.setTemporaryProperty;
		self.setAfter = Friend.Tree.Items.setAfter;
		self.callAfter = Friend.Tree.Items.callAfter;
		self.temporaryFunctions = [];
	},

	/**
	 * Checks for collisions
	 * Internal function
	 */
	checkCollisions: function ( self, x, y, rotation, force )
	{
		var xx, yy;
		xx = Math.floor( x );
		yy = Math.floor( y );
		rotation = Math.floor( rotation );
		var actions = [];
		var response = [];
		var actionsFlag = false;
		if ( force || xx != self.xBefore || yy != self.yBefore || rotation != self.rotationBefore )
		{
			if ( self.object.collisions )
			{
				for ( var i = 0; i < self.object.collisions.length; i ++ )
				{
					var collision = self.object.collisions[ i ];
					var collObjects = Friend.Game.Collisions.checkCollisions( self.object, xx, yy, collision.with );
					if ( collObjects )
					{
						response.push( collObjects );
						if ( collision.caller )
						{
							var action = collision.caller[ collision.function ].apply( collision.caller, [ self.object, collObjects ] );
							if ( action )
							{
								collObjects[ 'action' ] = action;
								actions[ action ] = true;
								actionsFlag = true;
							}
						}
						else
						{
							for ( var c = 0; c < collObjects.length; c++ )
							{
								if ( collObjects[ c ].action )
								{
									actions[ collObjects[ c ].action ] = true;
									actionsFlag = true;
								}
								for ( var ii in collObjects.items )
								{
									if ( collObjects.items[ i ].action )
									{
										actions[ collObjects[ c ].items[ i ].action ] = true;
										actionsFlag = true;
									}
								}
							}
						}
					}
				}
			}
			self.xBefore = xx;
			self.yBefore = yy;
			self.rotationBefore = rotation;
			if ( !actionsFlag )
				actions[ 'refresh' ] = true;
		}
		return { actions: actions, collisions: response };
	}
};


// Default handling of collisions
Friend.Game.Collisions =
{
	init: function ( tree )
	{
		this.tree = tree;
	},
	checkCollisions: function ( item, x, y, list )
	{
		var collides = [ ];
		if ( !item.toDestroy )
		{
			for ( var n = 0; n < list.length; n ++ )
			{
				var col = false;

				// Collision after a certain time with the object
				if ( list[ n ].after )
				{
					if ( item.tree.time - item.timeOfCreation < list[ n ].after )
						continue;
					list[ n ].after = false;
				}
				if ( list[ n ].name )
				{
					var item2 = item.root.findFirstItemFromName( list[ n ].name );
					while( item2 )
					{
						if ( item != item2 && item2.checkCollisions )
						{
							col = item2.checkCollisions( x, y, item, list[ n ].params );
							if ( col )
							{
								var response =
								{
									items: col
								};
								if ( list[ n ].action )
									response.action = list[ n ].action;
								collides.push( response );
							}
						}
						item2 = item.root.findNextItem();
					}
				}
			}
		}
		return collides.length > 0 ? collides : false;
	},
};
