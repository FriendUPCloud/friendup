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
Friend.Flags = Friend.Flags || {};
TreeRenderStopOn = '';
//TreeRenderStopOn = 'rendererOutput';

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
 * 								... name: (string) the name of the renderer to use. Default: 'RendererThree2D'
 *								... camera: (string) the name of the camera class to use, default is 'perspective', other value can be 'orthogonal'.
 * 								... renderZ: (boolean) set to true to render the content Z-map instead of the picture
 * 								... zBoxed: (boolean) if Z-map, will display square boxes iinstead of the sahpe of the items
 * 								... frameRate: (number) the desired rendering frame rate in FPS. Use -1 to synchronise the display with the monitor.
 * 								... other flags are not stable yet.
 *  
 */
Friend.Tree = function( application, flags )
{
	var self = this;
	Object.assign( this, Friend.Tree );

	this.debugging = true;
	flags.tree = this;
	this.application = application;
	this.title = 'My Application';
	this.caller = false;
	this.interval = false;
	this.xCenter = 0;
	this.yCenter = 0;
	this.perspective = 0;
	this.adaptToCanvasSize = false;
	this.keepProportions = false;
	this.barColor = '#000000';
	this.renderer = 'rendererThree2d';
	this.VR = false;
	this.className = 'Friend.Tree'; 
	this.frameRate = -1;
	this.resizeMode  = 'keepProportions';
	this.utilities = new Friend.Utilities( flags );
	this.errorLevel = Friend.Flags.ERRORLEVEL_NONE;
	this.width = 0;
	this.height = 0;
	this.userName = false;
	this.utilities.setFlags( this, flags );
	this.postProcesses = [ ];
	this.tabIndex = 0;
	this.originalWidth = this.width;
	this.originalHeight = this.height;

	// Initialize components
	flags.utilities = this.utilities;
	this.resources = new Friend.Resources.Manager( flags );
	flags.resources = this.resources;
	this.controller = new Friend.Game.Controller( flags );
	flags.controller = this.controller;
	this.renderZ = flags.renderer.renderZ;
	if ( typeof flags.renderer != 'undefined' && Friend.Renderers.length )
		this.renderer = new Friend.Renderers[ flags.renderer.name ]( flags );
	else
		this.renderer = new Friend.Renderers.RendererThree2D( flags );
	flags.renderer = this.renderer;

	this.zoomX = 1;
	this.zoomY = 1;
	this.zoomY = 1;
	this.x = 0;
	this.y = 0;
	this.drawBar = false;
	this.debugKeyDown = false;
	/*if ( this.adaptToCanvasSize )
	{
		var body = document.getElementsByTagName( "body")[0];
		body.onresize = onBodyResize;
		if ( this.VR )
			this.keepProportions = false;
	}
	*/
	this.identifierCount = 0;
	this.trees = [ ];
	this.timePreviousRefresh = new Date().getTime();
	this.timeAverage = 0;

	this.refreshCount = 0;
	this.refresh = true;
	this.running = false;
	this.clear();
	this.update = callUpdate;

	window.onresize = onResize;
	function callUpdate()
	{
		// Check mutex
		if ( !self.updating && !self.renderer.updating )
		{
			self.updating = true;
			self.timeCount = 0;
			var tempTree = self.currentTree;

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
				self.handleAddItem( self.trees[ t ] );
				self.handleDestroy( self.trees[ t ] );
				self.processTree( self.trees[ t ], delay );
			}

			// Extra work
			self.handlePostProcesses( delay );

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
			if ( refresh )
				self.renderer.postProcess();

			// Free mutex
			self.currentTree = tempTree;
			self.updating = false;

			if ( self.frameRate <= 0 )
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
		self.renderer.resize( window.innerWidth, window.innerHeight, self.originalWidth, self.originalHeight, self.resizeMode );
		self.width = self.renderer.width;
		self.height = self.renderer.height;
		self.refreshTree();
	}
	return true;
};

/**
 * Constants
 */
// Trigonometry
Friend.Flags.DEGREETORADIAN = 3.141592653589793 / 180;
// Keep coordinates
Friend.Flags.FLAG_KEEPX = 0x00000001;
Friend.Flags.FLAG_KEEPY = 0x00000002;
// Flags
Friend.Flags.FLAG_SETANGLE = 0x00000004;
Friend.Flags.FLAG_SETX = 0x00000008;
Friend.Flags.FLAG_SETY = 0x00000010;
// Non initialised values
Friend.Flags.NOTINITIALIZED = 0x80000001;
Friend.Flags.NOTINITIALIZED2 = 0x80000002;
// Hotspot definitions
Friend.Flags.HOTSPOT_LEFTTOP = 1;
Friend.Flags.HOTSPOT_CENTERTOP = 2;
Friend.Flags.HOTSPOT_RIGHTTOP = 3;
Friend.Flags.HOTSPOT_LEFTCENTER = 4;
Friend.Flags.HOTSPOT_CENTER = 5;
Friend.Flags.HOTSPOT_RIGHTCENTER = 6;
Friend.Flags.HOTSPOT_LEFTBOTTOM = 7;
Friend.Flags.HOTSPOT_CENTERBOTTOM = 8;
Friend.Flags.HOTSPOT_RIGHTBOTTOM = 9;
Friend.Flags.DIRECTION_LEFT = 0;
Friend.Flags.DIRECTION_RIGHT = 1;
Friend.Flags.DIRECTION_UP = 2;
Friend.Flags.DIRECTION_DOWN = 3;
Friend.Flags.DIAGONAL_TOPLEFT_BOTTOMRIGHT = 0x00000001;
Friend.Flags.DIAGONAL_TOPRIGHT_BOTTOMLEFT = 0x00000002;
Friend.Flags.ERRORLEVEL_ALL = 0;
Friend.Flags.ERRORLEVEL_LOW = 10;
Friend.Flags.ERRORLEVEL_MEDIUM = 20;
Friend.Flags.ERRORLEVEL_HIGH = 30;
Friend.Flags.ERRORLEVEL_BREAK = 100;
Friend.Flags.ERRORLEVEL_NONE = 100000;

// Processes all the items of the tree
Friend.Tree.processTree = function( tree, delay, flags )
{
	// Handles temporary properties for this item
	this.checkTemporaryFunctions( tree );

	// Call the processes of the tree, starting with the root
	if ( !flags )
		flags = {};
	this.currentTree = tree;
	this.processItem( tree, delay, flags );
};
Friend.Tree.processItem = function( item, delay, flags )
{
	if ( item.active )
	{
		flags.delay = delay;
		var commandFlags = false;
		if ( flags.command )
			commandFlags = Object.assign( {}, flags );

		// Calls the processUp of the item
		if ( item.processUp )
			flags = item.processUp( commandFlags ? commandFlags : flags );

		// Calls the processUp function of the processes one after the other, storing them in a pile
		var pile = [];
		var process = item.processes;
		while( process )
		{
			flags = process.processUp( commandFlags ? commandFlags : flags );
			pile.push( process );
			process = process.processes;
		}

		// Calls the processDown in reverse order
		for ( var p = pile.length - 1; p >= 0; p-- )
			flags = pile[ p ].processDown( commandFlags ? commandFlags : flags );

		// Calls the processDown of the item
		if ( item.processDown )
			flags = item.processDown( commandFlags ? commandFlags : flags );

		// Call the processes of the subitems
	    for ( var i = 0; i < item.items.length; i++ )
			flags = this.processItem( item.items[ i ], delay, commandFlags ? commandFlags : {} );
	}
	return flags;
};
// Render a tree with added flags
Friend.Tree.renderTree = function( tree, baseFlags )
{
    this.currentTree = tree;

	// Prepare the renderer
	baseFlags.perspective = tree.perspective;
	baseFlags.xCenter = tree.xCenter;
	baseFlags.yCenter = tree.yCenter;
	var flags = this.renderer.getRenderFlags( baseFlags );
	this.renderer.renderStart( flags );

	// Rendering
	if ( tree.refreshCount == 0 || tree.refreshAll )
	{
		tree.refreshAll = false;
		this.renderItem( tree, flags );
	}
	else
	{
		// Fast rendering, only the items and sub items that need to be refreshed
		for ( var i in tree.refreshList )
		{
			if ( tree.refreshList[ i ] )
			{
				this.renderItemFast( tree.refreshList[ i ], flags );
			}
		}
	}
	
	// End rendering of this tree
	this.renderer.renderEnd( flags );

	// Count the refreshes
	tree.refreshCount++;
	tree.refreshList = {};
};
// Render an item and its sub items
Friend.Tree.renderItemFast = function( item, flags, render )
{
	// Debugging entry
	if ( window.TreeRenderStopOn )
	{
		if ( item.name == window.TreeRenderStopOn )
		{
			// debugger;
		}
	}

	if ( item.renderUp )
	{
		var rFlags = flags.renderer.renderUpFast( flags, item );
		flags = rFlags;
	}
	if ( flags )
	{
		if ( item.renderUp )
        	flags = item.renderUp( flags );
	    for ( var i = 0; i < item.items.length; i++ )
		{
			flags = this.renderItem( item.items[ i ], flags );
		}
		flags = item.renderDown( flags );
		flags = flags.renderer.renderDownFast( flags, item );
	}
	else
	{
		Friend.Tree.log( item, { infos: 'Fast renderer flags not found...', level: Friend.Flags.ERRORLEVEL_CRITICAL } );
	}
    return flags;
};

// Render an item and its sub items
Friend.Tree.renderItem = function( item, flags, render )
{
	// Debugging entry
	if ( window.TreeRenderStopOn )
	{
		if ( item.name == window.TreeRenderStopOn )
		{
			//debugger;
		}
	}

    if ( item.renderUp )
	{
		flags = flags.renderer.renderUp( flags, item );
        flags = item.renderUp( flags );
	}
    for ( var i = 0; i < item.items.length; i++ )
	{
		flags = this.renderItem( item.items[ i ], flags );
	}
	if ( item.renderUp )
    {
	    flags = item.renderDown( flags );
		flags = flags.renderer.renderDown( flags, item );
	}
    return flags;
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
	return userName + '<userseparator>' + text + this.identifierCount++;
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
Friend.Tree.clear = function ()
{
	this.trees = [ ];
	this.renderer.clear();
	if ( this.intervalHandle )
	{
		clearInterval( this.intervalHandle );
		this.intervalHandle = false;
	}
	this.updating = false;
	this.currentTree =
	{
		allItems: {},
		destroyList: {},
		addList: [],
		temporaryFunctions: [],
		refreshList: {},
		refreshCount: 0,
		refresh: true,
		zoomX: 1,
		zoomY: 1,
		xCenter: 0,
		yCenter: 0,
		perspective: 0,
	}
};

/**
 * Starts a tree
 * 
 * Call this function once your tree is ready to start living.
 */
Friend.Tree.start = function()
{
	// Branches updating if not already working
	if ( !this.intervalHandle )
	{
		if ( this.frameRate <= 0 )
		{
			this.intervalHandle = requestAnimationFrame( this.update );
		}
		else
		{
			this.intervalHandle = setInterval( this.update, 1000 / this.frameRate );
		}		
	}
	// Refreshes all the trees
	this.refreshTree();
};

// addTree
// Adds an item to a tree
Friend.Tree.addTree = function ( tree, flags )
{
	tree.allItems = {};
	tree.destroyList = {};
	tree.addList = [];
	tree.refreshList = [];
	tree.temporaryFunctions = [];
	tree.refreshCount = 0;
	tree.refresh = true;
	tree.xCenter = 0;
	tree.yCenter = 0;
	tree.perspective = 0;
	tree.zoomX = 1;
	tree.zoomY = 1;
	tree.VR = false;
	tree.x = 0;
	tree.y = 0;
	tree.z = 0;
	this.utilities.setFlags( tree, flags );
	tree.parent = null;
	tree.root = null;
	tree.isRoot = true;
	this.trees.push( tree );
	this.currentTree = tree;
}
Friend.Tree.addItem = function ( item, parent )
{
	// Add object to global list of objects
	var tree = item.root;
	if ( tree && tree.allItems )
		tree.allItems[ item.identifier ] = item;
	else
		this.currentTree.allItems[ item.identifier ] = item

	// Add object to creation list
	item.root.addList.push( { item: item, parent: parent } );
};
Friend.Tree.handleAddItem = function ( tree )
{
	// Adds to parent items
	for ( var i = 0; i < tree.addList.length; i++ )
	{
		var list = tree.addList[ i ];
		list.parent.addItem( list.item );
	}

	// If modal, set it!
	for ( i = 0; i < tree.addList.length; i++ )
	{
		var item = tree.addList[ i ].item;
		if ( item.modal )
			item.startModal();
	}

	// No more list!
	tree.addList = [];
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
	// Stops this item
	item.active = false;

	// Clear the item
	if ( item.onDestroy )
		item.onDestroy();
		
	// Removes from fast access table
	tree.allItems[ item.identifier ] = false;

	// Removes from renderer
	this.renderer.destroy( item );

	// Recursive call for subItems
	for ( var i = 0; i < item.items.length; i++ )
		this.destroyItem( item.items[ i ], tree );

	// A callback?
	if ( item.onDestroyCallback )
	{
		var func = item.onDestroyCallback;
		item.onDestroyCallback = null;
		func();
	}
};
Friend.Tree.handleDestroy = function ( tree )
{
	for ( var i in tree.destroyList )
	{
		var item = tree.destroyList[ i ];

		// If item is modal, restart the other items
		item.stopModal();

		// Removes from renderer
		this.renderer.startDestroy();
		this.destroyItem( item, tree );
		this.renderer.endDestroy();

		// Cleans the tree list of all items
		tree.allItems = this.utilities.cleanArray( tree.allItems );

		// Removes from the processes
		for ( var p = 0; p < this.postProcesses.length; p ++ )
		{
			if ( this.postProcesses[ p ].destroyItem )
				this.postProcesses[ p ].destroyItem( item );
		}

		// Something to refresh!
		tree.refresh = true;
		tree.refreshAll = true;		// TODO: remove when you know why some object do not disappear
	}
	tree.destroyList = {};
	return true;
};


//
//
// Item search and query functions
//
///////////////////////////////////////////////////////////////////////////////

/**
 * Finds an item from its name
 * 
 * @param {string} name  The name of the object to find
 * @param {object} tree  The root of the search. 
 * 						 Can be a the first item of a tree (it's root) or any item which is the start of a branch.
 * 						 If not specified, the search is conducted in the current tree.
 * @return {object}		 The item if found.
 * 						 null if not found.
 */
Friend.Tree.findItemFromName = function ( name, tree )
{
	if ( ! tree )
		tree = this.currentTree;
	for ( var i in tree.allItems )
	{
		if ( tree.allItems[ i ].name == name )
			return tree.allItems[ i ];
	}
	return null;
}

/**
 * Finds an item from its identifier
 * 
 * @param {string} identifier  	The identifier of the object to find
 * @param {object} tree  		The root of the search. 
 * 						 		Can be a the first item of a tree (it's root) or any item which is the start of a branch.
 * 								If not specified, the search is conducted in the current tree.
 * @return {object}		 		The item if found.
 * 						 		null if not found.
 */
Friend.Tree.findItem = function ( identifier, tree )
{
	if ( !tree )
		tree = this.currentTree;
	if ( tree.allItems[ identifier ] )
		return tree.allItems[ identifier ];
	return null;
}



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
*                  flags: '<!--EVAL-->Friend.Utilities.MergeFlags( self.previousSibbling.identifier, self.creationFlags )'      // I <3 Javascript. Programmming on different levels at the same time...
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
	else if ( Friend.Utilities.isArray( jsonDescriptionOrArray ) )
	{
		description = jsonDescriptionOrArray;
	}
	if ( !description )
	{
		Friend.Tree.log( callerItem, { message: 'recreateTree error, bad type of parameter 1.', level: Friend.Flags.ERRORLEVEL_HALT } );
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
									Friend.Tree.log( callerItem, { message: 'Friend.Tree.recreateTree: error in eval.', data: instructions, level: Friend.Flags.ERRORLEVEL_FATAL } );
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
			Friend.Tree.log( parentItem, { message: 'Friend.Tree.recreateTree error, cannot create item.', data: itemDescription.className, level: Friend.Flags.ERRORLEVEL_FATAL } );
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
					Friend.Tree.log( item, { message: 'Friend.Tree.recreateTree returned null.', data: destinationFlags, level: Friend.Flags.ERRORLEVEL_FATAL } );
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
	var scriptList =
	[
		"/webclient/js/tree/renderers/three.js-master/build/three.js",
		"/webclient/js/media/audio.js",
		"/webclient/js/tree/engine/utilities.js",
		"/webclient/js/tree/engine/resources.js",
		"/webclient/js/tree/engine/controller.js",
		"/webclient/js/tree/engine/objects.js",
		"/webclient/js/tree/engine/processes.js",
		"/webclient/js/tree/engine/sounds.js",
		"/webclient/js/tree/engine/treeshare.js",
		"/webclient/js/tree/engine/network.js",
		"/webclient/js/tree/renderers/rendererThree2D.js",
		"/webclient/js/tree/game/gameMultiplayer.js",
		"/webclient/js/tree/game/gameObjects.js",
		"/webclient/js/tree/game/gameProcesses.js",
		"/webclient/js/tree/interface/uiDialogs.js",
		"/webclient/js/tree/interface/uiElements.js",
		"/webclient/js/tree/interface/uiProcesses.js",
		"/webclient/js/tree/debugger/debugItems.js"
	];
	Friend.Tree.include( scriptList, function( response )
	{
		if ( response == 'OK' )
			Friend.Tree.loaded = true;
		callback( response );
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
		// Get the correct URL
		var script = getPath( scripts[ s ] );

		// Creates a DOM element
		var element = document.createElement( 'script' );
		element.onload = onLoad;
		element.onError = onError;					// Not on all browsers
		element.src = script;
		document.head.appendChild( element ); 		// Adds to the document

		function onLoad()
		{
		    loaded++;
			if ( loaded == toLoad )
			{
				clearTimeout( handle );
				callback( 'OK' );
			}
		};
		function onError()
		{
			clearTimeout( handle );
			callback( 'Error' );
		};
		function onTimeout()
		{
			callback( 'Timeout' );
		};
		function getPath( path )
		{
			if( path.indexOf( 'https://' ) == 0 || path.indexOf( 'http://' ) == 0 )
				return path;
			
			var doubleDot = path.indexOf( ':' );
			if ( doubleDot >= 0 )
			{
				if ( path.substring( 0, doubleDot ).toLowerCase() == 'progdir' )
				{
					path = getImageUrl( path );
				}
			}
			return path;
		};
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
			level = Friend.Flags.ERRORLEVEL_HIGH;

		var levelName;
		switch ( level )
		{
			case Friend.Flags.ERRORLEVEL_LOW:
				levelName = 'low';
				break;
			case Friend.Flags.ERRORLEVEL_MEDIUM:
				levelName = 'medium';
				break;
			case Friend.Flags.ERRORLEVEL_HIGH:
				levelName = 'high';
				break;
			case Friend.Flags.ERRORLEVEL_BREAK:
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
			if ( level >= Friend.Flags.ERRORLEVEL_BREAK )
			{
				//debugger;
			}
		}
	}
	else
	{
		console.log( 'Tree log, Item ' + item.identifier + ' (' + item.className + '): ' );
	}
};
