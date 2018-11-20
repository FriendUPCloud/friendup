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
 * Tree game movements
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 21/08/2017
 */
Friend = window.Friend || {};
Friend.Tree.Game = Friend.Tree.Game || {};
Friend.Tree.Game.RenderItems = Friend.Tree.Game.RenderItems || {};

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
Friend.Tree.Game.AnimSimple = function( tree, item, properties )
{
	this.speed = 2;
	this.final = '';
	this.loop = 1;
	this.loopTo = 0;
	Friend.Tree.Processes.init( tree, this, item, 'Friend.Tree.Game.AnimSimple', properties );
	this.item.registerEvents( 'refresh' );
	this.setSpeed( this.speed );

	this.images = [ ];
	if ( typeof properties.imageList != 'undefined' )
	{
		for ( var i = properties.start; i < properties.end; i++ )
			this.images.push( properties.imageList + i );
	}
	else
	{
		for ( var i = 0; i < properties.images.length; i++ )
			this.images.push( properties.images[ i ] );
	}

	this.startAnimation();
};
Friend.Tree.Game.AnimSimple.startAnimation = function ()
{
	this.imageCount = 0;
	this.loopCount = this.loop;
	this.done = false;
	this.speedCalc = this.speed / 1000;
	this.calculation = 0;
	this.previousCalculation = 0;
	this.imageCalc = 0;
};
Friend.Tree.Game.AnimSimple.processUp = function ( message )
{
	if ( message.command == 'refresh' )
    {
		if ( this.done )
			return false;

		this.imageCalc += this.speedCalc * message.delay;
		var imageCount = Math.floor( this.imageCalc );
		if ( imageCount != this.imageCount )
		{
			if ( imageCount < this.images.length )
			{
				this.imageCount = imageCount;
				message.imageName = this.images[ this.imageCount ];
				message.refresh = true;
			}
			else
			{
				if ( this.loopCount <= 0 )
				{
					this.imageCalc = this.imageCalc % 1;
				}
				else
				{
					this.loopCount--;
					if ( this.loopCount == 0 )
					{
						switch ( this.final )
						{
							case 'destroy':
								this.done = true;
								this.item.destroy();
								break;
							default:
								this.done = true;
								break;
						}
					}
					else
					{
						this.imageCalc = this.imageCalc % 1;
					}
				}
			}
		}
	}
	return true;
};
Friend.Tree.Game.AnimSimple.processDown = function ( message )
{
	return message;
};

/**
 * setSpeed
 *
 * Changes the speed of the animation
 *
 * @param (number) new speed, in images per seconds
 */
Friend.Tree.Game.AnimSimple.setSpeed = function ( speed )
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
Friend.Tree.Game.MoveJoystick = function( tree, item, properties )
{
	this.x = 0;
	this.y = 0;
	this.xPrevious = 0;
	this.yPrevious = 0;
	this.speed = 50;
	this.directionMask = 0xFFFFFF;
	Friend.Tree.Game.Movements.init( tree, this, item, 'Friend.Tree.Game.MoveJoystick', properties );
	this.item.registerEvents( [ 'refresh', 'controller' ] );

	this.setSpeed( this.speed );
};
Friend.Tree.Game.MoveJoystick.processUp = function ( message )
{
	if ( !this.item.toDestroy && message.command == 'refresh' )
	{
		if ( ( this.directionMask & Friend.Flags.UP ) != 0 && this.item.controller.isDown( Friend.Tree.Controller.UP ) == true )
		{
			this.y -= this.speedCalc * message.delay;
		}
		if ( ( this.directionMask & Friend.Flags.DOWN ) != 0 && this.item.controller.isDown( Friend.Tree.Controller.DOWN ) == true )
		{
			this.y += this.speedCalc * message.delay;
		}
		if ( ( this.directionMask & Friend.Flags.LEFT ) != 0 && this.item.controller.isDown( Friend.Tree.Controller.LEFT ) == true )
		{
			this.x -= this.speedCalc * message.delay;
		}
		if ( ( this.directionMask & Friend.Flags.RIGHT ) != 0 && this.item.controller.isDown( Friend.Tree.Controller.RIGHT ) == true )
		{
			this.x += this.speedCalc * message.delay;
		}
		if ( this.checkCollisions( this, message.x + this.x - this.xPrevious, message.y + this.y - this.yPrevious ).actions[ 'refresh' ] )
		{
			message.x += this.x - this.xPrevious;
			message.y += this.y - this.yPrevious;
			message.refresh = true;
		}
		this.xPrevious = this.x;
		this.yPrevious = this.y;
	}
	return message;
};
Friend.Tree.Game.MoveJoystick.processDown = function ( message )
{
	return message;
};
Friend.Tree.Game.MoveJoystick.setSpeed = function ( speed )
{
	this.speed = speed;
	this.speedCalc = this.speed / 1000;
};
Friend.Tree.Game.MoveJoystick.getSpeed = function ()
{
	return this.speed;
};

Friend.Tree.Game.MoveJoystickStepByStep = function( tree, item, properties )
{
	this.x = 0;
	this.y = 0;
	this.xPrevious = 0;
	this.yPrevious = 0;
	this.speed = 1;
	this.directionMask = 0xFFFFFF;
	Friend.Tree.Game.Movements.init( tree, this, item, 'Friend.Tree.Game.MoveJoystick', properties );
	this.item.registerEvents( 'controller' );
}
Friend.Tree.Game.MoveJoystickStepByStep.processUp = function ( message )
{
	if ( !this.item.toDestroy && message.command == 'joystickdown' )
	{
		if ( ( this.directionMask & Friend.Flags.UP ) != 0 && message.code == Friend.Tree.Controller.UP )
		{
			this.y -= this.speed;
		}
		if ( ( this.directionMask & Friend.Flags.DOWN ) != 0 && message.code == Friend.Tree.Controller.DOWN )
		{
			this.y += this.speed;
		}
		if ( ( this.directionMask & Friend.Flags.LEFT ) != 0 && message.code == Friend.Tree.Controller.LEFT )
		{
			this.x -= this.speed;
		}
		if ( ( this.directionMask & Friend.Flags.RIGHT ) != 0 && message.code == Friend.Tree.Controller.RIGHT )
		{
			this.x += this.speed;
		}
		if ( this.checkCollisions( this, message.x + this.x - this.xPrevious, message.y + this.y - this.yPrevious ).actions[ 'refresh' ] )
		{
			message.x += this.x - this.xPrevious;
			message.y += this.y - this.yPrevious;
			console.log( 'Coordinates: ' + message.x + ' / ' + message.y );
			message.refresh = true;
		}
		this.xPrevious = this.x;
		this.yPrevious = this.y;
	}
	return message;
};
Friend.Tree.Game.MoveJoystickStepByStep.processDown = function ( message )
{
	return message;
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
Friend.Tree.Game.MoveStatic = function( tree, item, properties )
{
	Friend.Tree.Game.Movements.init( tree, this, item, 'Friend.Tree.Game.MoveStatic', properties );
	this.item.registerEvents( 'refresh' );
}
Friend.Tree.Game.MoveStatic.processUp = function ( message )
{
	return true;
};
Friend.Tree.Game.MoveStatic.processDown = function ( message )
{
	if ( message.command == 'refresh' )
		this.checkCollisions( this, message.x, message.y, message.rotation, true )
	return message;
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
Friend.Tree.Game.MoveTank = function( tree, item, properties )
{
	this.checkCollisions = Friend.Tree.Game.Movements.checkCollisions;
	this.speed = 50;
	this.rotationSpeed = 180;
	this.acceleration = 1000;
	this.deceleration = 1000;
	Friend.Tree.Game.Movements.init( tree, this, item, 'Friend.Tree.Game.MoveTank', properties );
	this.item.registerEvents( [ 'refresh', 'controller' ] );

	this.setSpeed( this.speed );
	this.setRotationSpeed( this.rotationSpeed );
	this.x = this.item.x;
	this.y = this.item.y;
	this.xPrevious = this.x;
	this.yPrevious = this.y;
	this.rotation = this.item.rotation;
	this.rotationPrevious = this.rotation;
}
Friend.Tree.Game.MoveTank.processUp = function ( message )
{
	if ( !this.item.toDestroy && message.command == 'refresh' )
	{
		if ( this.collisions == 'stop' )
		{
			if ( ! this.item.controller.isDown( Friend.Tree.Controller.UP | Friend.Tree.Controller.DOWN ) )
				this.collisions = '';
		}
		else
		{
			if ( this.item.controller.isDown( Friend.Tree.Controller.UP ) )
			{
				this.x = this.x + this.speedCalc * message.delay * Math.cos( this.rotation * Friend.Tree.DEGREETORADIAN );
				this.y = this.y - this.speedCalc * message.delay * Math.sin( this.rotation * Friend.Tree.DEGREETORADIAN );
			}
			if ( this.item.controller.isDown( Friend.Tree.Controller.DOWN ) )
			{
				this.x = this.x - this.speedCalc * message.delay * Math.cos( this.rotation * Friend.Tree.DEGREETORADIAN );
				this.y = this.y + this.speedCalc * message.delay * Math.sin( this.rotation * Friend.Tree.DEGREETORADIAN );
			}
			if ( this.item.controller.isDown( Friend.Tree.Controller.LEFT ) )
			{
				this.rotation = ( this.rotation + this.rotationSpeedCalc * message.delay ) % 360;
			}
			if ( this.item.controller.isDown( Friend.Tree.Controller.RIGHT ) )
			{
				this.rotation = ( this.rotation - this.rotationSpeedCalc * message.delay ) % 360;
			}
			this.collisions = this.checkCollisions( this, message.x + this.x - this.xPrevious, message.y + this.y - this.yPrevious, this.rotation );
			if ( this.collisions.actions[ 'refresh' ] )
			{
				message.x += this.x - this.xPrevious;
				message.y += this.y - this.yPrevious;
				message.rotation = this.rotation;
				message.refresh = true;
			}
			this.xPrevious = this.x;
			this.yPrevious = this.y;
			//if ( this.collisions == 'stop' )
		}
	}
	return message;
};
Friend.Tree.Game.MoveTank.processDown = function ( message )
{
	return message;
}

/**
 * setSpeed
 *
 * Changes the speed of the movement
 *
 * @param (number) speed new speed, in pixels/second
 */
Friend.Tree.Game.MoveTank.setSpeed = function ( speed )
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
Friend.Tree.Game.MoveTank.getSpeed = function ()
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
Friend.Tree.Game.MoveTank.setRotationSpeed = function ( speed )
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
Friend.Tree.Game.MoveLine = function( tree, item, properties )
{
	this.x = item.x;
	this.y = item.y;
	this.xPrevious = this.x;
	this.yPrevious = this.y;
	this.rotation = item.rotation;
	this.rotationPrevious = this.rotation;
	this.checkCollisions = Friend.Tree.Game.Movements.checkCollisions;
	this.speed = 50;
	this.rotationSpeed = 0;
	Friend.Tree.Game.Movements.init( tree, this, item, 'Friend.Tree.Game.MoveLine', properties );
	this.item.registerEvents( [ 'refresh', 'controller' ] );

	this.setSpeed( this.speed );
	this.setRotationSpeed( this.rotationSpeed );
};
Friend.Tree.Game.MoveLine.processUp = function ( message )
{
	if ( !this.item.toDestroy && message.command == 'refresh' )
	{
		if ( this.rotationSpeed )
		{
			if ( this.item.controller.isDown( Friend.Tree.Controller.LEFT ) == true )
				this.rotation = ( this.rotation + this.rotationSpeedCalc * message.delay ) % 360;
			if ( this.item.controller.isDown( Friend.Tree.Controller.RIGHT ) == true )
				this.rotation = ( this.rotation - this.rotationSpeedCalc * message.delay ) % 360;
		}
		this.x += Math.cos( this.rotation * Friend.Tree.DEGREETORADIAN ) * this.speedCalc * message.delay;
		this.y -= Math.sin( this.rotation * Friend.Tree.DEGREETORADIAN ) * this.speedCalc * message.delay;
		if ( this.checkCollisions( this, message.x + this.x - this.xPrevious, message.y + this.y - this.yPrevious, this.rotation ).actions[ 'refresh' ] )
		{
			message.x += this.x - this.xPrevious;
			message.y += this.y - this.yPrevious;
			message.rotation += this.rotation - this.rotationPrevious;
			message.refresh = true;
		}
		this.xPrevious = this.x;
		this.yPrevious = this.y;
		this.rotationPrevious = this.rotation;
		message.refresh = true;
	}
	return message;
};
Friend.Tree.Game.MoveLine.processDown = function ( message )
{
	return message;
}


/**
 * setSpeed
 *
 * Changes the speed of the movement
 *
 * @param (number) speed new speed, in pixels/second
 */
Friend.Tree.Game.MoveLine.setSpeed = function ( speed )
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
Friend.Tree.Game.MoveLine.getSpeed = function ()
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
Friend.Tree.Game.MoveLine.setRotationSpeed = function ( speed )
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
Friend.Tree.Game.Movements =
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
	init: function ( tree, self, item, className, properties )
	{
		Friend.Tree.Processes.init( tree, self, item, className, properties );
		self.checkCollisions = this.checkCollisions;
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
			if ( self.item.collisions )
			{
				for ( var i = 0; i < self.item.collisions.length; i ++ )
				{
					var collision = self.item.collisions[ i ];
					var collObjects = Friend.Tree.Game.Collisions.checkCollisions( self.item, xx, yy, collision.with );
					if ( collObjects )
					{
						response.push( collObjects );
						if ( collision.caller )
						{
							var action = collision.caller[ collision.function ].apply( collision.caller, [ self.item, collObjects ] );
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
Friend.Tree.Game.Collisions =
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

				// Collision after a certain time with the item
				if ( list[ n ].after )
				{
					if ( item.tree.time - item.timeOfCreation < list[ n ].after )
						continue;
					list[ n ].after = false;
				}
				if ( list[ n ].name )
				{
					var items = item.root.findAllItemsFromName( list[ n ].name );
					for ( var i = 0; i < items.length; i++ )
					{
						var item2 = items[ i ];
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
					}
				}
			}
		}
		return collides.length > 0 ? collides : false;
	},
};
