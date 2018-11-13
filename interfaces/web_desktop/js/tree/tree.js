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
 * Friend Tree engine
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 18/08/2017
 */

/**
 * Tree
 *
 * An object oriented tree-based engine
 *
 * @param flags (object) Creation flags
 *
 * Flags
 *
 * canvas: (object) the canvas to render into
 */
Friend = window.Friend || {};
treeRenderStopOn = 'hGrouploll';
treeMessageStopOn = '';

/**
 * Tree engine constructor
 * 
 * Constructs a functional instance of the Tree engine.
 * 
 * @param {object} application	The calling application 
 * @param {object} flags 		A list of flags defining the various parameters of the engine.
 * 						 		title: (string) a string containing the title of the application.
 *								width: the width of the rendering area
 * 								height: the height of the rendering area
 *								renderer: (object) the name and properties of the renderer. This value will converted into an array of renderer properties in a next version.
 * 								... name: (string) the name of the renderer to use. Default: 'Renderer_Three2D'
 *								... camera: (string) the name of the camera class to use, default is 'perspective', other value can be 'orthogonal'.
 * 								... renderZ: (boolean) set to true to render the content Z-map instead of the picture
 * 								... zBoxed: (boolean) if Z-map, will display square boxes iinstead of the sahpe of the items
 * 								... frameRate: (number) the desired rendering frame rate in FPS. Use -1 to synchronise the display with the monitor.
 * 								... other flags are not stable yet.
 *  
 */
Friend.Tree = function( application, properties )
{
	var self = this;
	Object.assign( this, Friend.Tree );

	this.debugging = true;
	properties.tree = this;
	this.application = application;
	this.title = 'My Application';
	this.caller = false;
	this.interval = false;
	this.xCenter = 0;
	this.yCenter = 0;
	this.frameRate = -1;
	this.className = 'Friend.Tree'; 
	this.resizeMode  = 'responsive';
	this.errorLevel = Friend.Tree.ERRORLEVEL_NONE;
	this.width = 0;
	this.height = 0;
	this.userName = false;
	this.utilities = new Friend.Tree.Utilities( properties );
	this.utilities.setFlags( this, properties );
	this.postProcesses = [ ];
	this.tabIndex = 0;
	this.originalWidth = this.width;
	this.originalHeight = this.height;

	// Initialize components
	properties.utilities = this.utilities;
	this.resources = new Friend.Resources.Manager( properties );
	properties.resources = this.resources;
	this.events = new Friend.Tree.Events( this, {} );
	properties.events = this.events;

	// Renderers initialization
	this.renderers = [];
	if ( typeof properties.renderers != 'undefined' )
	{
		for ( var r = 0; r < properties.renderers.length; r++ )
		{
			var rendererDef = properties.renderers[ r ];
			var renderer = Friend.Renderers[ rendererDef.name ];
			if ( renderer )
			{
				var newProperties = renderer.defaultProperties;
				this.utilities.setFlags( newProperties, rendererDef.properties );
				this.renderers.push( new renderer( newProperties, properties ) );
			}
		}
	}
	else
	{
		var newProperties = Friend.Renderers.Renderer_HTML.defaultProperties;
		this.renderers.push( new Friend.Renderers.Renderer_HTML( newProperties, properties ) );
	}

	// Local initialization (TODO: clean!)
	this.zoomX = 1;
	this.zoomY = 1;
	this.zoomY = 1;
	this.x = 0;
	this.y = 0;
	this.drawBar = false;
	this.debugKeyDown = false;
	this.identifierCount = 0;
	this.trees = [ ];
	this.timePreviousRefresh = new Date().getTime();
	this.timeAverage = 0;
	this.refreshCount = 0;
	this.refresh = true;
	this.running = false;
	this.loopCount = 0;
	this.clear();
	this.update = callUpdate;

	window.onresize = onResize;
	function callUpdate()
	{
		// Check mutex
		var mutex = false;
		for ( var r = 0; r < self.renderers.length; r++ )
			mutex |= self.renderers[ r ].updating;
		if ( !self.updating && !mutex )
		{
			self.updating = true;
			self.timeCount = 0;
			self.loopCount++;

			// Calculates delays before previous loop
			var delay;
			self.time = new Date().getTime();
			delay = self.time - self.timePreviousRefresh;
			self.delayPreviousUpdate = delay;
			self.timePreviousRefresh = self.time;

			// Calculates the FPS
			self.timeAverage = ( self.timeAverage + self.delayPreviousUpdate ) / 2;
			self.fps = Math.floor( 1000 / self.timeAverage );
			
			// Call the processes of the trees
			for ( var t = 0; t < self.trees.length; t ++ )
			{
				self.handleDestroy( self.trees[ t ] );
				self.checkTemporaryFunctions( self.trees[ t ] );
				self.processTreeRefresh( self.trees[ t ], delay );
			}

            // Render all trees
			var refresh = false;
            for ( var t = 0; t < self.trees.length; t ++ )
            {
				var tree = self.trees[ t ];
                if ( tree.refresh )
                {
                    self.renderTree( tree, { x: self.x, y: self.y, zoomX: self.zoomX, zoomY: self.zoomY, drawBar: self.drawBar } );
                    tree.refresh = false;
					refresh = true;
                }
            }

			// Extra work
			self.handlePostProcesses( delay );

			// Free mutex
			self.updating = false;

			if ( self.intervalHandle == 'vbl' )
				window.requestAnimationFrame( callUpdate );
		}
	}
	function setRoot( item, root )
	{
		if ( item != root )
			item.root = root;
		for ( var i = 0; i < item.items.length; i++ )
			setRoot( item.items[ i ], root );
	};

	function onResize()
	{
		for ( var t = 0; t < self.trees.length; t ++ )
		{ 
			var root = self.trees[ t ];
			for ( var r in root.renderers )
				root.renderers[ r ].resize( window.innerWidth, window.innerHeight );
			self.resizeTree( root, window.innerWidth, window.innerHeight );
		}
	}
	return true;
};
Friend.Tree.resizeTree = function( root, newWidth, newHeight )
{
	// All the objects, recursive from the root
	this.resizeItem( root, newWidth, newHeight );
	root.doRefresh( -1 );
};
Friend.Tree.resizeItem = function( item, newWidth, newHeight, noPositionning )
{
	// Calculates the new size of the item
	var width, height;
	if ( item.resizeModeX != 'none' )
	{
		width = newWidth * item.resizeModeX;
	}
	if ( item.resizeModeY != 'none' )
	{
		width = newHeight * item.resizeModeY;
	}

	// Send a 'resize' message to the item
	if ( item.messageUp )
	{
		var message =
		{
			command: 'resize',
			type: 'system',
			width: width,
			height: height,
			refresh: true,				// Forces refresh
			recursion: true
		};
		item.messageUp( message );		// X and Y will be transmitted

		// Call the processUp function of the processes one after the other
		var pile = [];
		var process = item.processes;
		while( process )
		{
			process.processUp( message );
			pile.push( process );
			process = process.processes;
		}

		// Call the messageDown in reverse order
		for ( var p = pile.length - 1; p >= 0; p-- )
			pile[ p ].processDown( message );

		// Call the messageDown of the item
		item.messageDown( message );
		width = item.width;
		height = item.height;

		// If width or height have changed, update the renderItems!
		if ( message.refresh || ( item.root && item.root.firstResize ) )
		{
			// Call all renderItems
			message.width = item.width;
			message.height = item.height;
			for ( var ri = 0; ri < item.renderItems.length; ri++ )
			{
				var renderItem = item.renderItems[ ri ];
				if ( renderItem.message )
					renderItem.message( message );
			}

			// Reposition the item
			if ( !noPositionning && item.parent && item.positionMode && item.resizeMode != 'none' )
			{
				var x, y;
				switch ( item.positionModeX )
				{
					case 'center':
						x = item.parent.width / 2 - item.width / 2;
						break;
					case 'right':
						x = item.parent.width - item.width / 2;
						break;
					case 'left':
						x = 0;
						break;
					default:
						x = item.x;
						break;
				}
				switch ( item.positionModeY )
				{
					case 'center':
						y = item.parent.height / 2 - item.height / 2;
						break;
					case 'right':
						y = item.parent.height - item.height / 2;
						break;
					case 'left':
						y = 0;
						break;
					default:
						y = item.y;
						break;
				}
				Friend.Tree.positionItem( item, x, y );
			}

			// Recursive will be false for subItems of groups for example
			if ( message.recursion )
			{
				for ( var i = 0; i < item.items.length; i++ )
				{
					var subItem = item.items[ i ];
					Friend.Tree.resizeItem( subItem, width, height );
				}
			}
		}
	}
	else
	{
		item.width = width;
		item.height = height;
		switch ( item.positionModeX )
		{
			case 'center':
				x = item.parent.width / 2 - item.width / 2;
				break;
			case 'right':
				x = item.parent.width - item.width / 2;
				break;
			case 'left':
				x = 0;
				break;
			default:
				x = item.x;
				break;
		}
		switch ( item.positionModeY )
		{
			case 'center':
				y = item.parent.height / 2 - item.height / 2;
				break;
			case 'right':
				y = item.parent.height - item.height / 2;
				break;
			case 'left':
				y = 0;
				break;
			default:
				y = item.y;
				break;
		}

	}
};
Friend.Tree.positionItem = function( item, x, y )
{
	if ( item.messageUp )
	{
		// Send 'position' message to the item
		message = 
		{
			command: 'position',
			type: 'system',
			x: x,
			y: y,
			refresh: true		// Forces refresh
		};

		item.messageUp( message );

		pile = [];
		process = item.processes;
		while( process )
		{
			process.processUp( message );
			pile.push( process );
			process = process.processes;
		}
		for ( p = pile.length - 1; p >= 0; p-- )
			pile[ p ].processDown( message );
		item.messageDown( message );
	}
}

/**
 * Constants
 */
// Trigonometry
Friend.Tree.DEGREETORADIAN = 3.141592653589793 / 180;
// Flags
Friend.Tree.FLAG_SETANGLE = 0x00000004;
Friend.Tree.FLAG_SETX = 0x00000008;
Friend.Tree.FLAG_SETY = 0x00000010;
// Non initialised values
Friend.Tree.NOTDEFINED = 0x80000001;
Friend.Tree.NOTINITIALIZED = 0x80000001;
Friend.Tree.NOTINITIALIZED2 = 0x80000002;
Friend.Tree.UPDATED = 0x80000004;
// Hotspot definitions
Friend.Tree.HOTSPOT_LEFTTOP = 1;
Friend.Tree.HOTSPOT_CENTERTOP = 2;
Friend.Tree.HOTSPOT_RIGHTTOP = 3;
Friend.Tree.HOTSPOT_LEFTCENTER = 4;
Friend.Tree.HOTSPOT_CENTER = 5;
Friend.Tree.HOTSPOT_RIGHTCENTER = 6;
Friend.Tree.HOTSPOT_LEFTBOTTOM = 7;
Friend.Tree.HOTSPOT_CENTERBOTTOM = 8;
Friend.Tree.HOTSPOT_RIGHTBOTTOM = 9;
Friend.Tree.DIRECTION_UP = 0;
Friend.Tree.DIRECTION_DOWN = 1;
Friend.Tree.DIRECTION_LEFT = 2;
Friend.Tree.DIRECTION_RIGHT = 3;
Friend.Tree.DIAGONAL_TOPLEFT_BOTTOMRIGHT = 0x00000001;
Friend.Tree.DIAGONAL_TOPRIGHT_BOTTOMLEFT = 0x00000002;
Friend.Tree.ERRORLEVEL_NONE = 0;
Friend.Tree.ERRORLEVEL_LOW = 10;
Friend.Tree.ERRORLEVEL_MEDIUM = 20;
Friend.Tree.ERRORLEVEL_HIGH = 30;
Friend.Tree.ERRORLEVEL_BREAK = 100;
Friend.Tree.ERRORREPORT_VERBOSE = 0;
Friend.Tree.ERRORREPORT_HIGH = 10;
Friend.Tree.ERRORREPORT_MEDIUM = 20;
Friend.Tree.ERRORREPORT_LOW = 30;
Friend.Tree.ERRORLEVEL_BREAK = 100;

// Reserved process and message commands.
///////////////////////////////////////////////////////////////////
Friend.Tree.reservedCommands = 
{
	create: true,
	destroy: true
};

// Processes all the items of the tree
Friend.Tree.processTreeRefresh = function( tree, delay )
{
	// Call the processes of the tree, starting with the root
	var message = {	command: 'refresh', type: 'refresh', delay: delay };
	this.sendMessageToTree( tree, message );
};
Friend.Tree.sendMessageToTree = function( tree, message )
{
	this.sendMessageToItem( tree, tree, message, true );
};
Friend.Tree.sendMessageToItem = function( tree, item, message, recursive )
{
	// Debugging entry
	if ( window.treeMessageStopOn )
	{
		if ( item.name == window.treeMessageStopOn )
		{
			if ( item.root && item.root.keymap[ 66 ] )	// 'B'
				debugger;
		}
	}

	if ( item.active || message.type == 'system' )
	{
		var flag = false;	
		switch ( message.type )
		{
			case 'network':
			case 'system':
				flag = true;
				break;
			case 'toParent':
			case 'renderItemToItem':
				if ( !item.toDestroy )
					flag = true;
				break;
		}
		if ( !flag && tree.events[ message.type ] )
		{
			// The item has registered for this events
			if ( tree.events[ message.type ][ item.identifier ] )
			{
				// And is not waiting to be destroyed
				if ( !item.toDestroy )
				{
					if ( !item.modal || ( item.modal && message.command == 'mouseleave' ) )
						flag = true;
				}
			}
		}
		if ( flag ) 
		{
			var localMessage = Object.assign( {}, message );
	
			// Calls the messageUp of the item
			if ( item.messageUp( localMessage ) )
			{
				// Calls the processUp function of the processes one after the other, storing them in a pile
				var pile = [];
				var process = item.processes;
				while( process )
				{
					process.processUp( localMessage );
					pile.push( process );
					process = process.processes;
				}
		
				// Calls the messageDown in reverse order
				for ( var p = pile.length - 1; p >= 0; p-- )
					pile[ p ].processDown( localMessage );
		
				// Calls the messageDown of the item
				item.messageDown( localMessage );
			}
			// TODO: eventually stop recursive if refusal of message
		}

		// Call the processes of the subitems
		if ( recursive || message.recursive )
		{
			for ( var i = 0; i < item.items.length; i++ )
			{
				if ( item.items[ i ] )
					this.sendMessageToItem( tree, item.items[ i ], message, recursive );
			}
		}
	}
};
// Render a tree with added flags
Friend.Tree.renderTree = function( tree, baseProperties )
{
	var renderer;
	for ( var r = 0; r < this.renderers.length; r++ )
	{		
		renderer = this.renderers[ r ];

		// Prepare the renderer
		var properties = Object.assign( {}, baseProperties );
		var rendererProperties = renderer.getRenderFlags( properties );
		rendererProperties.renderer = renderer;
		renderer.renderStart( rendererProperties );

		// Rendering
		if ( tree.refreshCount == 0 || tree.refreshAll )
		{
			this.renderItem( tree, rendererProperties );
		}
		else
		{
			// Fast rendering, only the items and sub items that need to be refreshed
			for ( var i in tree.refreshList )
			{
				if ( tree.refreshList[ i ] )
				{
					this.renderItemFast( tree.refreshList[ i ], rendererProperties );
				}
			}
		}

		// End rendering of this tree for this renderer
		renderer.renderEnd( rendererProperties );
	}

	// Count the refreshes
	tree.refreshAll = false;
	tree.refreshCount++;
	tree.refreshList = {};
};
// Render an item and its sub items
Friend.Tree.renderItemFast = function( item, properties, render )
{
	// Debugging entry
	if ( window.treeRenderStopOn )
	{
		if ( item.name == window.treeRenderStopOn )
		{
			debugger;
		}
	}
	for ( var r = 0; r < item.renderItems.length; r++ )
	{		
		var itemProperties;
		var renderItem = item.renderItems[ r ];
		if ( renderItem.renderer )
		{
			if ( renderItem.renderer == properties.renderer )
			{
				// Transmit values to the renderItem
				renderItem.x = item.x;
				renderItem.y = item.y;
				renderItem.z = item.z;
				renderItem.width = item.width;
				renderItem.height = item.height;
				renderItem.rotation = item.rotation;

				var itemProperties = properties.renderer.renderUpFast( properties, renderItem );
				if ( itemProperties )
				{
					// Render the item
					itemProperties = renderItem.render( itemProperties );

					// Draws the rendererItem
					properties.renderer.renderIt( itemProperties, renderItem )

					// Render the sub-items? (TODO: WHAT?)
					for ( var i = 0; i < item.items.length; i++ )
						itemProperties = this.renderItem( item.items[ i ], itemProperties );

					itemProperties = properties.renderer.renderDownFast( itemProperties, renderItem );

					return itemProperties;
				}
				else
				{
					Friend.Tree.log( item, { infos: 'Fast renderer flags not found...', level: Friend.Tree.ERRORLEVEL_BREAK } );
				}
			}
		}
		else
		{
			// RenderItem not linked to a renderer
			renderItem.x = item.x;
			renderItem.y = item.y;
			renderItem.z = item.z;
			renderItem.width = item.width;
			renderItem.height = item.height;
			renderItem.rotation = item.rotation;
			renderItem.render();
		}
	}
};

// Render an item and its sub items
Friend.Tree.renderItem = function( item, properties, render )
{
	// Debugging entry
	if ( window.treeRenderStopOn )
	{
		if ( item.name == window.treeRenderStopOn )
		{
			debugger;
		}
	}

	// Call only the good ones for this very renderer
	if ( item.renderItems.length )
	{
		for ( var r = 0; r < item.renderItems.length; r++ )
		{		
			var renderItem = item.renderItems[ r ];
			if ( renderItem.renderer )
			{
				if ( renderItem.renderer == properties.renderer )
				{
					// Transmit basic data to the renderItem
					renderItem.x = item.x;
					renderItem.y = item.y;
					renderItem.z = item.z;
					renderItem.rotation = item.rotation;
					renderItem.width = item.width;
					renderItem.height = item.height;
	
					// Prepare renderer for item
					properties = properties.renderer.renderUp( properties, renderItem );
					
					// Draws the item
					renderItem.render( properties );
	
					// Draws the rendererItem
					properties.renderer.renderIt( properties, renderItem )
	
					// Draw the sub items
					for ( var i = 0; i < item.items.length; i++ )
						properties = this.renderItem( item.items[ i ], properties );
					
					// Undo all modifications
					properties = properties.renderer.renderDown( properties, renderItem );
				}
			}
			else
			{
				// RenderItem not linked to a renderer
				renderItem.x = item.x;
				renderItem.y = item.y;
				renderItem.z = item.z;
				renderItem.width = item.width;
				renderItem.height = item.height;
				renderItem.rotation = item.rotation;
				renderItem.render();
			}
		}
	}
	else
	{
		// Draw the sub items
		for ( var i = 0; i < item.items.length; i++ )
			properties = this.renderItem( item.items[ i ], properties );
	}
	return properties;
};
Friend.Tree.getSubItemsIdentifiers = function( item, result )
{
	if ( !result )
		result = [];
	else
		result.push( item.identifier );

	for ( var i = 0; i < item.items.length; i++ )
	{
		result = this.getSubItemsIdentifiers( item.items[ i ], result );
	}
	return result;
};
Friend.Tree.addRefresh = function( item )
{
	var tree = item.root;
	if ( tree && tree.refreshCount > 0 )
	{
		if ( !tree.refreshList[ item.identifier ] )
		{
			// Check if one of the parents is not already in the list
			var parent = item.parent;
			while ( parent )
			{
				for ( var i = 0; i < tree.refreshList.length; i++ )
				{
					if ( tree.refreshList[ i ] == parent )
					{
						// Already in the list, it will be refreshed!
						return;
					}
				}
				parent = parent.parent;
			}

			// Removes all the sub-items if the are already present
			var subItems = this.getSubItemsIdentifiers( item );
			for ( var s = 0; s < subItems.length; s++ )
			{
				if ( tree.refreshList[ subItems[ s ] ] )
					tree.refreshList[ subItems[ s ] ] = false;
			}

			// Adds itself to the list, all its subitems will be refreshed
			tree.refreshList[ item.identifier ] = item;
		}
	}
};
/**
 * FindTreeFromName
 * 
 * Returns the root of the tree with the same name
 * 
 */
Friend.Tree.findTreeFromName = function( name )
{
	for ( var t = 0; t < this.trees.length; t++ )
	{
		if ( this.trees.name == name )
		{
			return this.trees[ t ];
		}
	}
	return null;
};

/**
 * Refresh Tree
 * 
 * Forces a graphical refresh of the tree and all its items on the next update.
 * 
 * @param {object} tree 	The root of the tree to refresh. If ommited, refreshes all the trees.
 */
Friend.Tree.refreshTree = function( tree )
{
	if ( !tree )
	{
		for ( var t = 0; t < this.trees.length; t ++ )
			this.trees[ t ].refreshAll = true;
	}
	else
	{
		tree.refreshAll = true;
	}
};

/**
 * Set a temporary property within an item.
 * 
 * Temporary properties allow you to change the value of an item's property 
 * and have it automatically restored to its value after a while.
 * 
 * @param {object} item			The item containing the property.
 * @param {string} prop 		The name of the property to affect.
 * @param {value}  value		The value to set the property to after the initial delay
 * @param {number} setAfter		Number of millisecond before changing the property. Immediate if 0 or undefined.
 * @param {number} restoreAfter Delay before restoring the property to its original value. Must be great than 'setAfter'
 */
Friend.Tree.setTemporaryProperty = function( item, prop, value, setAfter, restoreAfter )
{
	// Add to the temporaryFunctions of the tree
	var tree = item.root ? item.root : item;		// If item is root

	// Get the original value
	var previousValue = item[ prop ];

	// Store in the list or sets the property immediately
	if ( setAfter )
	{
		tree.temporaryFunctions.push(
		{
			item: item,
			property: prop,
			value: value,
			delay: setAfter,
			timeOfStart: this.time
		} );
	}
	else
	{
		item[ prop ] = value;
	}

	// Store restore in the array with time indications
	tree.temporaryFunctions.push(
	{
		item: item,
		property: prop,
		value: previousValue,
		delay: restoreAfter,
		timeOfStart: this.time
	} );
};

/**
 * Calls a function from an item after a delay
 * 
 * @param {object} 		item	  The item to call.
 * @param {function}	func	  The function to call.
 * @param {value}		value	  The value to transmit when function is called (next version: can be a function)
 * @param {number}		callAfter Delay in milliseconds before calling the function.
 */
Friend.Tree.callAfter = function( item, func, value, callAfter )
{
	// Add to the temporaryFunctions of the tree
	var tree = item.root ? item.root : item;		// If item is root

	// Stores in the list...
	tree.temporaryFunctions.push(
	{
		item: item,
		function: func,
		value: value,
		delay: callAfter,
		timeOfStart: this.time
	} );
};

/**
 * Sets a property of an item after a delay
 * 
 * @param {object} item The item containing the property.
 * @param {string} prop The name of the property to change. 
 * @param {value} value The value to put in the property. 
 * @param {number} setAfter Delay before changing the value iin milliseconds. 
 */
Friend.Tree.setAfter = function( item, prop, value, callAfter )
{
	// Add to the temporaryFunctions of the tree
	var tree = item.root ? item.root : item;		// If item is root

	// Stores in the list...
	tree.temporaryFunctions.push(
	{
		item: item,
		property: prop,
		value: value,
		delay: callAfter,
		timeOfStart: this.time
	} );
};

// Private functions
Friend.Tree.getTemporaryFunctions = function( item, functionName )
{
	// Add to the temporaryFunctions of the tree
	var tree = item.root ? item.root : item;		// If item is root

	// Explores the list for this tree
	var result = [];
	for ( var p = 0; p < tree.temporaryFunctions.length; p ++ )
	{
		var prop = tree.temporaryFunctions[ p ];
		if ( prop.item == item  )
		{
			if ( !name )
				result.push( prop );
			else if ( functionName == prop.function )
				result.push( prop );
		}
	}
	if ( result.length )
		return result;
	return false;
};
Friend.Tree.checkTemporaryFunctions = function( tree )
{
	for ( var p = 0; p < tree.temporaryFunctions.length; p ++ )
	{
		var prop = tree.temporaryFunctions[ p ];
		if ( this.time - prop.timeOfStart > prop.delay )
		{
			if ( prop.function )
			{
				// A function to call
				prop.item[ prop.function ].apply( prop.item, [ prop.value ] );
			}
			else
			{
				// A property to restore
				prop.item[ prop.property ] = prop.value;
			}
			// Removes from array, it is done!
			prop.item.temporaryFunctionsCount--;
			tree.temporaryFunctions.splice( p, 1 );
			p--;
		}
	}
};

/**
 * Returns a unique identifier based on a name
 */
Friend.Tree.getNewIdentifier = function ( text )
{
	if ( typeof text == 'undefined' )
		text = 'id';

	var userName;
	if ( typeof Application != 'undefined' )
		userName = Application.username;
	else
		userName = this.userName;
	return userName + '<|>' + text + this.identifierCount++;
};

/**
 * Clear the engine
 *
 * Clears all the trees from the engine without removing the resources.
 * 
 * The engine is ready for a new tree after a call to this function.
 * You can start the new tree with the 'start' function.
 * This function also initialise a new empty tree ready to welcome items.
 */
Friend.Tree.initRoot = function ( tree )
{
	tree.allItems = {};
	tree.destroyList = {};
	tree.addList = [];
	tree.refreshList = [];
	tree.temporaryFunctions = [];
	tree.renderers = [];
	tree.parent = null;
	tree.root = tree;
	tree.isRoot = true;
	tree.refreshCount = 0;
	tree.refresh = true;
	Friend.Tree.Events.initRoot( tree );
};

Friend.Tree.addTree = function ( tree )
{
	this.initRoot( tree );
	this.trees.push( tree );
}

Friend.Tree.start = function()
{
	// If still running
	if ( this.intervalHandle && this.intervalHandle != 'vbl' )
	{
		clearInterval( this.intervalHandle );
		this.intervalHandle = false;
	}

	// Branches updating if not already working
	if ( this.frameRate <= 0 )
	{
		if ( !this.intervalHandle )
		{
			console.log( 'RequesAnimationFrame!' );
			requestAnimationFrame( this.update );
			this.intervalHandle = 'vbl';
		}
	}
	else
		this.intervalHandle = setInterval( this.update, 1000 / this.frameRate );

	// Calculates all positions and sizes (work to do here!)
	for ( var t = 0; t < this.trees.length; t++ )
	{
		this.trees[ t ].firstResize = true;
		this.resizeTree( this.trees[ t ], this.trees[ t ].width, this.trees[ t ].height );
		this.trees[ t ].firstResize = false;
	}

	// Refreshes all the trees
	this.refreshTree();
};

Friend.Tree.clear = function ()
{
	this.trees = [ ];
	for ( var r = 0; r < this.renderers.length; r++ )
		this.renderers[ r ].clear();
	if ( this.intervalHandle )
	{
		clearInterval( this.intervalHandle );
		this.intervalHandle = false;
	}
	this.updating = false;
};

Friend.Tree.addItem = function ( item, parent )
{
	// Add object to global list of objects
	var tree = item.root;
	if ( tree && tree.allItems )
	{
		tree.allItems[ item.identifier ] = item;
		//item.root.addList.push( { item: item, parent: parent } );
	}
	else
	{
		Friend.Tree.log( item, { level: Friend.Tree.ERRORLEVEL_HIGH, error: 'Additem, root not defined.' } );
	}
};

// Pass on modal all the items up to an item
Friend.Tree.setModal = function ( item, flag )
{
	// Find the path to the root + 1
	var parent = item.parent;
	while( parent.parent != item.root )	
		parent = parent.parent;

	// All to modal
	item.isModal = true;
	this.doModal( parent, item, flag );
}
Friend.Tree.doModal = function ( item, modalRoot, flag )
{	
	// The item itself
	item.modal = flag;

	// All its children BUT the one that keeps focus
	for ( var i = 0; i < item.items.length; i++ )
	{
		if ( item.items[ i ] != modalRoot )
		{
			this.doModal( item.items[ i ], modalRoot, flag );
		}
	}
};

// 
// Destroy management
//
/////////////////////////////////////////////////////////////////////////////
Friend.Tree.addToDestroy = function ( item )
{
	if ( !item.root.destroyList[ item.identifier ] )
 	{
		item.toDestroy = true;
		item.root.destroyList[ item.identifier ] = item;
	}
};
// Called at the end of the frame, destroys the items from the list
Friend.Tree.destroyItem = function ( item, tree )
{	
	// Sends a 'destroyed' message to the item
	var message =
	{
		command: 'destroyed',
		type: 'system',
		itemEvent: item,
		name: item.name
	}
	this.sendMessageToItem( tree, item, message );

	// Sends a 'destroy' message to the whole Tree
	var message =
	{
		command: 'destroy',
		type: 'system',
		itemEvent: item,
		name: item.name
	}
	this.sendMessageToTree( tree, message );
	
	// Stops this item
	item.active = false;

	// Removes from fast access table
	tree.allItems[ item.identifier ] = false;

	// Remove from the events
	this.events.cancelAllEvents( item );

	// Remove from parent
	if ( item.parent )
	{
		for ( var i = 0; i < item.parent.items.length; i++ )
		{
			if ( item.parent.items[ i ] == item )
			{
				item.parent.items[ i ] = false;
				break;
			}
		}
	}

	// Destroys the renderItems
	for ( var r = 0; r < item.renderItems.length; r++ )
		item.renderItems[ r ].onDestroy();

	// Recursive call for subItems
	for ( var i = 0; i < item.items.length; i++ )
		this.destroyItem( item.items[ i ], tree );
};
Friend.Tree.handleDestroy = function ( tree )
{
	var i, callback;	
	for ( i in tree.destroyList )
		break;
	if ( typeof i != 'undefined' )
	{
		// Indicates 'start of destroy' to the renderers
		for ( var r = 0; r < this.renderers.length; r++ )
			this.renderers[ r ].startDestroy();

		for ( i in tree.destroyList )
		{
			var item = tree.destroyList[ i ];

			// A callback? Store!
			if ( item.onDestroyCallback )
				callback = item.onDestroyCallback;

			// If item is modal, restart the other items
			if ( item.isModal )
				this.setModal( item, false );

			// Destroys the item and its sub-items
			this.destroyItem( item, tree );

			// Cleans the parent items array
			var newItems = [];
			for ( var i = 0; i < item.parent.items.length; i++ )
			{
				if ( item.parent.items[ i ] )
					newItems.push( item.parent.items[ i ] );
			}
			item.parent.items = newItems;

			// Cleans the tree list of all items
			tree.allItems = this.utilities.cleanArray( tree.allItems );

			// Removes from the post-processes
			for ( var p = 0; p < this.postProcesses.length; p ++ )
			{
				if ( this.postProcesses[ p ].destroyItem )
					this.postProcesses[ p ].destroyItem( item );
			}

			// Something to refresh!
			tree.refresh = true;
			tree.refreshAll = true;		// TODO: remove when you know why some object do not disappear
		}
		// 'end of destroy' to renderers
		for ( var r = 0; r < this.renderers.length; r++ )
			this.renderers[ r ].endDestroy();
	}
	tree.destroyList = {};
	if ( callback )
		callback();
	return true;
};


//
//
// Post processes handling
//
////////////////////////////////////////////////////////////////////////////////
Friend.Tree.addPostProcess = function ( process )
{
	this.postProcesses.push( process );
	return this.postProcesses.length;
};
Friend.Tree.removePostProcess = function ( process )
{
	for ( var o = 0; o < this.postProcesses.length; o ++ )
	{
		if ( this.postProcesses[ o ] == process )
		{
			this.postProcesses.splice( o, 1 );
			break;
		}
	}
	return this.postProcesses.length;
};
Friend.Tree.handlePostProcesses = function ( delay )
{
	for ( var o = 0; o < this.postProcesses.length; o ++ )
	{
		this.postProcesses[ o ].process( delay );
	}
	return true;
};



//
//
// Work in progress
//
///////////////////////////////////////////////////////////////////////////////
/** treeDefinition: (make it global mechanism for the tree engine: define a tree from a list of properties)
* [
*      {
*          className: Friend.Domain.ClassName,
*          name: 'Item name',
*          flags:
*          {
*              ... normal creation flags (names instead of pointer to object -> works everywhere all the time - transmission of tree / internet!)
*          } 
*          children: 
*          [
*              { 
*                  className: Friend.Domain.ChildrenClassName,
*                  name: 'Subitem name',
*                  flags: 
*                  { 
*                      ...normal creation flags (no pointers, names!)
*                      children: 
*                      { 
*                          [ 
*                              ...toward fractal infinite: json can be generated by fractal routines! :)
*                          ]
*                      } 
*                  } 
*              }
*          ]
*      },
*      // Second item
*      {
*          className: 'Friend.Domain.ClassName',
*          name: 'Second item name',
*          // Example of re-use of entire tree just created in another
*          flags: 
*          { 
*              [ 
*                  // The first item will be a new copy of the previous sibbling (right after it's entiere tree
*                  // has been created) with eventually variations in the initialisation flags.
*                  className: '<!--EVAL-->self.previousSibbling.className',                                           // It is an eval 
*                  name: '<!--EVAL-->self.previousSibbling.name + 'test',
*                  creationFlags: 
*                  {
*                      ...normal creation flags, can have the same property names as created item class have
*                      ...result flags will be sibbling flags THEN updated by merge -> the tree can 
*                      ...have different but similar creation information
*                  },
*                  flags: '<!--EVAL-->Friend.Tree.Utilities.MergeFlags( self.previousSibbling.identifier, self.creationFlags )'      // I <3 Javascript. Programmming on different levels at the same time...
*              ]
*          }
*      }
*/
Friend.Tree.recreateTree = function ( jsonDescriptionOrArray, callerItem, callback, timeOut )
{
	if ( !timeOut )
		timeOut = 1 * 1000; 	// Increase if things online! UROS specially.
	
	// TODO: handle asynchronised creation of trees, fundamental for online work without blocking Javascript!
	// Grow separate trees from the root subitems
	// Once a tree is ready, add it to the root.
	// Can be recursive in time (ouch!) - torrents of trees, grow branch per branch, add to tree when it can welcome the branch.
	var root = this.recreateTreeEntry( jsonDescriptionOrArray );
	if ( !root )
	{
		Friend.Tree.log( callerItem, { message: 'Friend.Tree.recreateTree failed. callerItem: ', data: callerItem, level: ERRORLEVEL_BREAK } );	
		if ( callback )
		{
			if ( callback )
				callBack.apply( callerItem, [ 'FAIL' ] );			
		}		
	}
	if ( callBack )	
		callBack.apply( callerItem, [ 'OK', root ] );
	return root;
}
Friend.Tree.recreateTreeEntry = function ( jsonDescriptionOrArray, parentItem )
{
	var description;
	if ( typeof jsonDescriptionOrArray == 'string' )
	{
		try
		{
			description = JSON.parse( jsonDescriptionOrArray );				
		}
		catch( e )
		{
			Friend.Tree.log( callerItem, { message: 'Error in recreateTree JSON string.', level: ERRORLEVEL_BREAK } );
			return null;
		}
	}
	else if ( Friend.Tree.Utilities.isArray( jsonDescriptionOrArray ) )
	{
		description = jsonDescriptionOrArray;
	}
	if ( !description )
	{
		Friend.Tree.log( callerItem, { message: 'recreateTree error, bad type of parameter 1.', level: Friend.Tree.ERRORLEVEL_BREAK } );
		return null;	
	}

	// Create the new items
	var count;
	this.recreatedRoot = null;
	for ( count = 0; count < description.length; count++ )
	{
		var itemDescription = description[ count ];

		// Creates the new flags, using parentFlags (recursive)
		var destinationFlags = {};
		if ( parentItem )
			Object.assign( destinationFlags, parentItem.creationFlags );

		for ( var property in description.flags )
		{
			var value = description.flags[ property ];
			if ( typeof value == 'string' )
			{
				var end = value.indexOf( '-->' );
				if ( end > 0 )
				{
					var command = value.subString( 4, end );

					// A real sub-language to program a new tree
					// AMAL ^ Javascript = infinite possibilities of fun (private joke)					
					// Can be a tree in itself (TODO)
					var instructions = value.subString( end + 3 ); 
					switch ( command )
					{
						case 'EVAL':		// Capitals hilight in listing! Forced to use (sorry)
							if ( this.checkRecreationInfo() )
							{
								var result;
								var self = this;
								try
								{
									value = eval( instructions );
								}
								catch( e )
								{
									Friend.Tree.log( callerItem, { message: 'Friend.Tree.recreateTree: error in eval.', data: instructions, level: Friend.Tree.ERRORLEVEL_BREAK } );
									return null;
								}
							}
							break;
						case 'TREE':
							// {
							//   security: '<--FORCEDCALL-->Friend.Tree.getSecurityItem( protection to find )',		// security items optional
							//   smartContract: '<--FORCEDCALL-->self.security.getSmartContractItem( 'tree', self.security, mega sub-protection to find, Hogne? ),
							//   validationKey: '<--FORCEDCALL-->self.smartContract.processTransaction( self, transactionInfos - what do I want to do, for how long... negociations ),'
							//                  Creation will fail if refusal (security protected).
							//	 root: 'identifier' or '<--CALL-->self.security.getItem( 'itemNameOrUrlForLiveItems', protection to find )',
							//   newFlags: { ...modification flags. Can be recursive... danger! }
							// }
							break;
						case 'JAVASCRIPT':
							// Will load and run some code
							break;
						case 'C':
							// Will run on the server.
							break;
						case 'LIBERATOR':
							// Example of rendering a big 3D file on 1000 Windows servers,
							// making the distant AI analyse the picture (will come!)
							// and orient the next rendering flags after analysis.
							// Handles everything, from negociations to contract.
							// Data must be prepared before calling, other side must have matching application (establish a communication protocol)
							// {
							//   security: '<--FORCEDCALL-->Friend.Tree.getSecurityItem( protection to find )',
							//   smartContract: '<--FORCEDCALL-->self.security.getSmartContractItem( 'tree', self.security, mega sub-protection to find, Hogne? ),
							//   validationKey: '<--FORCEDCALL-->self.smartContract.processTransaction( self, transactionInfos - what do I want to do, for how long... negociations ),'
							//                  Creation will fail if refusal (security protected).
							//	 UROS: '<--CALL-->Friend.Security.getItem( 'UROS', protection to find ),'
							//   newFlags: 
							//	 {
							//		command1: '<--CALL-->self.UROS.connect( self, 'anyOS', { tags: '###number=1000 ###free ###cheap #fast ##gpu ###3dsMaxxxx', timeout: 10 * 60 * 1000' )'		// ###=must be true. Will halt if refusal (can be more complex, interpret Javascript in javascript itself! :)
							// 		command2: '<--CALL-->self.UROS.launch( '3dsMaxxxx' );
							//		command3: '<--CALL-->self.UROS.sendDataAndStartOnComplete( 'render, analyse, extract next render flags', 'pathToFolderWithSourceData' );	// Will wait for completetion  everywhere, UROS items and subitems display info
							//		command4: '<--CALL-->self.security.closePendingTransaction( self );'		// Will halt if refusal
							//		command5: '<--CALL-->self.UROS.getDataBack( 'pathToFolder' );'
							//		command6: '<--CALL-->self.destroy();'		// Bye bye Liberator tree, data is ready to be re-assembled!
							//	 }
							// 	back to programming instead of dreaming! :)
					}
				}					
			}
			destinationFlags[ property ] = value; 
		}

		// Root?
		if ( parentItem )
		{
			destinationFlags.root = this.recreatedRoot;
			destinationFlags.parent = parentItem;
		}

		// Creates the item
		var className, parentClassName;
		var lastDot = itemDescription.className.lastIndexOf( '.' );
		if ( lastDot > 0 )
		{
			className = itemDescription.className.substring( lastDot + 1 );
			parentClass = window[ itemDescription.className.substring( 0, lastDot ) ];
		}
		else
		{
			classname = itemDescription.className;
			parentClass = window;
		}
		var item;
		try
		{
			item = new parentClass[ className ]( this, itemDescription.name, destinationFlags );				
		}
		catch( e )
		{
			Friend.Tree.log( parentItem, { message: 'Friend.Tree.recreateTree error, cannot create item.', data: itemDescription.className, level: Friend.Tree.ERRORLEVEL_BREAK } );
			return null;
		}

		// Grows the tree!
		this.previousSibbling = item;
		if ( !this.recreatedRoot )
			this.recreatedRoot = item;
		// Item will be added by parent

		// Recurses the sub-item definitions
		if ( itemDescription.children )
		{
			for ( var count = 0; count < itemDescription.length; count++ )
			{
				var subItemDescription = itemDescription[ count ];
				var subItem = this.recreateTree( subItemDescription, item );
				if ( subItem )
				{
					item.addItem( item, 'after' );		// Should be re-created in order as original tree... priorities... TOCHECK!
				}
				else
				{
					Friend.Tree.log( item, { message: 'Friend.Tree.recreateTree returned null.', data: destinationFlags, level: Friend.Tree.ERRORLEVEL_BREAK } );
					item = null;
				}
			}
		}
	}
	return item;
};
Friend.Tree.saveTree = function ( sourceItem, linkToTree, destination )
{
	if ( ! destination )
		destination = [ ];
	for ( var i = 0; i < sourceItem.items.length; i ++ )
	{
		if ( linkToTree )
		{
			sourceItem.linkToTree = linkToTree;
			sourceItem.sourceTree = true;
		}
		destination.push( sourceItem.items[ i ].creationFlags );
		for ( var ii = 0; ii < sourceItem.items.length; ii ++ )
		{
			this.saveTree( sourceItem.items[ ii ], linkToTree, destination );
		}
	}
	return destination;
}
Friend.Tree.setLinkToTree = function ( tree, treeToLink )
{
	for ( var i = 0; i < tree.items.length; i ++ )
	{
		tree.linkToTree = linkToTree;
		tree.sourceTree = true;
		for ( var ii = 0; ii < tree.items.length; ii ++ )
		{
			this.setLinkToTree( tree.items[ ii ], treeToLink );
		}
	}
	return destination;
}

//
//
// Engine sources loading
// Add your own sources! :)
//
///////////////////////////////////////////////////////////////////////////////
Friend.Tree.loaded = false;

/**
 * Cold initisation of the Tree engine
 * 
 * Loads the various sources, make sure they are loaded in the browser before returning.
 * 
 * @param {function} callback A function called when all sources are loaded.
 */
Friend.Tree.init = function( callback )
{
	var countToLoad = 0;
	var countLoaded = 0;
	var scriptList =
	[
		"/webclient/js/tree/renderers/three.js-master/build/three.js",
		"/webclient/js/media/audio.js",
		"/webclient/js/tree/engine/utilities.js",
		"/webclient/js/tree/engine/resources.js",
		"/webclient/js/tree/engine/events.js",
		"/webclient/js/tree/engine/controller.js",
		"/webclient/js/tree/engine/objects.js",
		"/webclient/js/tree/engine/processes.js",
		"/webclient/js/tree/engine/renderItems.js",
		"/webclient/js/tree/engine/fui.js",
		"/webclient/js/tree/renderers/rendererUtilities.js",
		"/webclient/js/tree/renderers/renderer_Three2D.js",
		"/webclient/js/tree/renderers/renderer_HTML.js",
		"/webclient/js/tree/renderers/renderer_Canvas2D.js",
		"/webclient/js/tree/debug/debug.js",
		"/webclient/js/tree/game/game.js",
		"/webclient/js/tree/network/network.js",
		"/webclient/js/tree/sounds/sounds.js",
		"/webclient/js/tree/tree/treeLife.js",
		"/webclient/js/tree/ui/ui.js",
		"/webclient/js/tree/misc/misc.js",
	];
	
	Friend.Tree.include( scriptList, function( response )
	{
		if ( response == 'OK' )
		{
			// Load the various elements
			countToLoad++;
			Friend.Tree.Debug.init( oneMore );
			countToLoad++;
			Friend.Tree.Game.init( oneMore );
			countToLoad++;
			Friend.Tree.Network.init( oneMore );
			countToLoad++;
			Friend.Tree.Sounds.init( oneMore );
			countToLoad++;
			Friend.Tree.UI.init( oneMore );
			countToLoad++;
			Friend.Tree.Misc.init( oneMore );
			countToLoad++;
			Friend.Tree.initTreeLife( oneMore );

			function oneMore( response )
			{
				if ( response == 'OK' )
				{
					countLoaded++;
					if ( countLoaded == countToLoad )
					{
						Friend.Tree.Loaded = true;
						callback( 'OK' );
					}
					return;
				}	
				callback( response );
			}
		}
	} );
};
Friend = window.Friend || {};

/**
 * Load and includes Javascript sources
 * 
 * Use this function to add code to your project. 
 * It will call you back wen all the sources are loaded.
 * 
 * @param {array-or-string} scripts  An array of string containing the path of the sources to load
 * 									 or a string containing the name of a source.
 * @param {function}		callback The function to call when the sources are loaded.
 * 									 Callback parameter is a string, with the possible responses:
 * 									 - 'OK': the source has been loaded succesfully
 * 									 - 'Error': an error has occured
 * 									 - 'Timeout': a file was not loaded after a while  
 * @param {number}			timeout  Timeout in milliseconds if files don't load. Default value: 10000 (10 seconds)
 * @todo Transmit the path to the file in case of error to facilitate debugging a this stage. 
 */
Friend.Tree.include = function( scripts, callback, timeout )
{
	var self = this;

	if ( !timeout )
		timeout = 1000 * 10;
	if ( typeof scripts == 'string' )
		scripts = [ scripts ];

	var loaded = 0;
	var toLoad = scripts.length;
	var handle = setTimeout( onError, timeout );
	for ( var s = 0; s < scripts.length; s++ )
	{
		var path = scripts[ s ];

		// Get the correct URL
		if ( isSystem( path ) )
		{
			// System file: direct load
			var element = document.createElement( 'script' );
			element.onload = onLoad;
			element.onError = onError;					// Not on all browsers
			element.src = path;
			document.head.appendChild( element ); 		// Adds to the document

			function onLoad()
			{
				loaded++;
				if ( loaded == toLoad )
				{
					clearTimeout( handle );
					if ( callback )
						callback( 'OK' );
				}
			};
			function onError()
			{
				clearTimeout( handle );
				if ( callback )
					callback( 'Error' );
			};
		}
		else
		{
			// File in Progdir, load with File object
			var element = document.createElement( 'script' );
			document.head.appendChild( element ); 		// Adds to the document

			// Replace Progdir by the drive name
			var apath = Application.appPath ? Application.appPath : Application.filePath;
			Application.noFilePathConversion = true;
			path = apath + path.substring( path.indexOf( ':' ) + 1 ); 
			var file = new File( path );
			file.treeElement = element;
			file.onLoad = function( data )
			{
				this.treeElement.innerHTML = data;
				eval( this.treeElement.innerHTML );

				loaded++;
				if ( loaded == toLoad )
				{
					clearTimeout( handle );
					if ( callback )
						callback( 'OK' );
				}
			}
			file.load();
		}
		function onTimeout()
		{
			if ( callback )
				callback( 'Timeout' );
		};
		function isSystem( path )
		{
			if ( path.substring( 0, 8 ).toLowerCase() == 'progdir:' )
				return false;
			return true;
		}
	}
};

/**
 * Outputs data to the browser log console
 * 
 * This function manages the console output, and provides an easy way to classify the
 * gravity of an error.
 */
Friend.Tree.log = function( item, data )
{
	if ( data )
	{
		var level;
		if ( data.level )
			level = data.level;
		else
			level = Friend.Tree.ERRORLEVEL_HIGH;

		var levelName;
		switch ( level )
		{
			case Friend.Tree.ERRORLEVEL_LOW:
				levelName = 'low';
				break;
			case Friend.Tree.ERRORLEVEL_MEDIUM:
				levelName = 'medium';
				break;
			case Friend.Tree.ERRORLEVEL_HIGH:
				levelName = 'high';
				break;
			case Friend.Tree.ERRORLEVEL_BREAK:
				levelName = 'critical';
				break;
			default:
				levelName = 'unreferenced';
				break;
		}

		if ( level >= this.errorLevel )
		{
			console.log( 'Tree error, level: ' + levelName + '. Item ' + item.identifier + ' (' + item.className + '): ' + data.error );
			if ( data.infos )
			{
				for ( var i = 0; i < data.infos.length; i++ )
					console.log( '- ', data.infos[ i ] );
			}
			if ( level >= Friend.Tree.ERRORLEVEL_BREAK )
			{
				console.log( 'Bad error in the tree!' );
			}
		}
	}
	else
	{
		console.log( 'Tree log, Item ' + item.identifier + ' (' + item.className + '): ' );
	}
};

///////////////////////////////////////////////////////////////////////////////
// Interface with FUI
///////////////////////////////////////////////////////////////////////////////

Friend.Tree.loadJSON = function( jsonPath, jsonTree )
{
	var source;
	var treeProperties;
	var self = this;
	var f = new File( jsonPath );
	f.onLoad = function( json )
	{
		try	
		{ 
			source = JSON.parse( json ); 
		}
		catch( e )
		{ 
			document.body.innerHTML = '<div class="Error Box">Could not find File class.</div>'; 
		}
		try	
		{ 
			treeProperties = JSON.parse( jsonTree ); 
		}
		catch( e )
		{ }
		 
		// Initialise the Tree engine
		Friend.Tree.init( function( response )
		{
			// Loaded OK?
			if ( response != 'OK' )
			{
				Application.Quit();
				return;
			}

			// Creates a new instance of the Tree engine
			if ( typeof treeProperties.width == 'undefined' )
				treeProperties.width = document.body.clientWidth;
			if ( typeof treeProperties.height == 'undefined' )
				treeProperties.height = document.body.clientHeight;
			self.tree = new Friend.Tree( self, treeProperties );

			//  Load the 'root.js' code and call it
			Friend.Tree.include( 'Progdir:Scripts/root.js', function( response )
			{
				if ( response == 'OK' )
				{
					// Creates the root object of the tree
					self.root = new Root( self.tree, 'Root',
					{
						x: 0,
						y: 0,
						z: 0,
						zoomX: 1,
						zoomY: 1,
						width: treeProperties.width,
						height: treeProperties.height,
						fuiJson: source
					} );
				}
			} );
		} );
	}
	f.load();
}

