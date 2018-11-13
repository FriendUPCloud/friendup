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
 * Tree engine main items definition
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 22/08/2017
 */
Friend = window.Friend || {};
Friend.Tree = Friend.Tree || {};

Friend.Tree.Items =
{

    /**
     * Common initialisation function
     *
     * The init function should be called upon creation of any item
     *
     * @param (object) object the object itself
     * @param (object) tree the Tree engine
     * @param (string) name the name of the object
     * @param (string) className the name of the class of the object
     * @param (object) properties creation properties
     */
    init: function( object, tree, name, className, properties )
    {
        object.tree = tree;

        // If a root (no parent), initialize root arrays
        if ( !properties.parent )
            tree.initRoot( object );

        // Assign the functions of the class
        Friend.Tree.Utilities.assignToObject( object, className );

        object.utilities = tree.utilities;
        object.resources = tree.resources;
        object.name = name;
		object.className = className;

		// Is a theme defined?
		var theme;
		var theme2;
		if ( properties.theme )
		{
            object.theme = properties.theme;

			// Find the class in the theme
			if ( properties.theme[ className ] )
			{
				theme = properties.theme[ className ];
                if ( theme.fromName && theme.fromName[ name ] )
					theme2 = theme.fromName[ name ];
			}
		}
        object.creationFlags = Object.assign( {}, properties );
		object.creationFlags.name = name;
		object.creationFlags.itemName = name;
        object.creationFlags.className = className;
        if ( theme )
            object.utilities.setFlags( object.creationFlags, theme );
        if ( theme2 )
            object.utilities.setFlags( object.creationFlags, theme2 );

        object.identifier = tree.getNewIdentifier( name );
		object.application = tree.application;
        object.root = properties.root;

        object.timeOfCreation = tree.time;
        object.items = [ ];
        object.renderItems = [];
		object.insertItemsPile = [];
		object.temporaryFunctionsCount = 0;
        object.onDestroyCallback = null;
        object.caller = false;

        object.active = true;
        object.visible = true;
        object.colorDisabled = '#000000';
        object.refresh = true;

        if ( typeof object.positionModeX == 'undefined' )
            object.positionModeX = 'left';
        if ( typeof object.positionModeY == 'undefined' )
            object.positionModeX = 'top';
        object.setCoordinates = this.setCoordinates;
        object.destroy = this.destroy;
        object.handleDestroy = this.handleDestroy;
        object.doDestroy = this.doDestroy;
        object.addItem = this.addItem;
        object.addProcess = this.addProcess;
        object.removeProcess = this.removeProcess;
        object.removeItem = this.removeItem;
        object.doRefresh = this.doRefresh;
        object.enable = this.enable;
        object.startProcess = this.startProcess;
        object.endProcess = this.endProcess;
        object.setHotSpot = this.setHotSpot;
        object.controller = tree.controller;
        object.getMouseCoords = this.getMouseCoords;
        object.findItemFromIdentifier = this.findItemFromIdentifier;
        object.findItemFromName = this.findItemFromName;
        object.findFromName = this.findFromName;
        object.findItemFromNameAndClassName = this.findItemFromNameAndClassName;
        object.findFromNameAndClassName = this.findFromNameAndClassName;
        object.findItemFromClassName = this.findItemFromClassName;
        object.findFromClassName = this.findFromClassName;
        object.findAllItemsFromName = this.findAllItemsFromName;
        object.findAllNames = this.findAllNames;
        object.findParentItemFromName = this.findParentItemFromName;
	    object.findParentItemFromClassName = this.findParentItemFromClassName;
		object.getProcess = this.getProcess;
		object.setTemporaryProperty = this.setTemporaryProperty;
		object.setAfter = this.setAfter;
		object.callAfter = this.callAfter;
		object.getTemporaryFunctions = this.getTemporaryFunctions;
		object.getTemporaryFunctionsCount = this.getTemporaryFunctionsCount;
		object.setRoot = this.setRoot;
        object.refreshParents = this.refreshParents;
		object.startModal = this.startModal;
		object.stopModal = this.stopModal;
		object.setModal = this.setModal;
		object.startInsertItems = this.startInsertItems;
		object.endInsertItems = this.endInsertItems
        object.registerEvents = this.registerEvents;
        object.setEvent = this.setEvent;
        object.cancelEvent = this.cancelEvent;
        object.callAllRenderItems = this.callAllRenderItems;
        object.callRenderItem = this.callRenderItem;
        object.getChildWidth = this.getChildWidth;
        object.getChildHeight = this.getChildHeight;
        object.updateProperty = this.updateProperty;
        object.resize = this.resize;
   		if ( typeof object.checkCollisions == 'undefined' )
			object.checkCollisions = this.checkCollisions;
        if ( typeof object.getValue == 'undefined' )
            object.getValue = this.getValue;
        if ( typeof object.getValue == 'undefined' )
            object.setValue = this.setValue;

		// Tranforms the evals in the properties into values
		if ( tree.previousItem )
		{
			var variables =
			{
				parentItem: properties.parent,
				previousItem: tree.previousItem,
				treeWidth: tree.width,
				treeHeight: tree.height
			};
			properties = tree.utilities.computeProperties( properties, object, variables );
		}
        // Adds all properties
        object.collisions = false;
        object.noRotation = 0;
        object.destroyList = [ ];
		object.offsetX = 0;
		object.offsetY = 0;
		object.toDestroy = false;
		object.modal = false;
        object.noOffsets = false;
        object.onDestroyed = false;
        object.resizeX = Friend.Tree.NOTINITIALIZED2;
        object.resizeY = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.x == 'undefined' )
            object.x = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.y == 'undefined' )
            object.y = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.z == 'undefined' )
            object.z = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.width == 'undefined' )
            object.width = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.height == 'undefined' )
            object.height = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.rotation == 'undefined' )
            object.rotation = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.hotSpot == 'undefined' )
            object.hotSpot = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.hotSpotX == 'undefined' )
            object.hotSpotX = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.hotSpotY == 'undefined' )
            object.hotSpotY = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.alpha == 'undefined' )
            object.alpha = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.destroyAfter == 'undefined' )
            object.destroyAfter = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.onProcess == 'undefined' )
            object.onProcess = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.noPerspective == 'undefined' )
            object.noPerspective = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.noRotation == 'undefined' )
            object.noRotation = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.theRoot == 'undefined' )
            object.theRoot = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.perspective == 'undefined' )
            object.perspective = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.xCenter == 'undefined' )
            object.xCenter = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.yCenter == 'undefined' )
            object.yCenter = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.rotation == 'undefined' )
            object.rotation = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.zoomX == 'undefined' )
            object.zoomX = Friend.Tree.NOTINITIALIZED2;
        if ( typeof object.zoomY == 'undefined' )
            object.zoomY = Friend.Tree.NOTINITIALIZED2;
        if ( theme )
            object.utilities.setFlags( object, theme );
        if ( theme2 )
            object.utilities.setFlags( object, theme2 );
        object.utilities.setFlags( object, properties );

        if ( object.rotation == Friend.Tree.NOTINITIALIZED2 )
            object.rotation = 0;
        if ( object.hotSpotX == Friend.Tree.NOTINITIALIZED2 )
            object.hotSpotX = 0;
        if ( object.hotSpotY == Friend.Tree.NOTINITIALIZED2 )
            object.hotSpotY = 0;
        if ( object.hotSpot == Friend.Tree.NOTINITIALIZED2 )
            object.hotSpot = Friend.Tree.HOTSPOT_LEFTTOP;
        if ( object.alpha == Friend.Tree.NOTINITIALIZED2 )
            object.alpha = 1;
        if ( object.destroyAfter == Friend.Tree.NOTINITIALIZED2 )
            object.destroyAfter = 0;
        if ( object.onProcess == Friend.Tree.NOTINITIALIZED2 )
            object.onProcess = null;
        if ( object.theRoot == Friend.Tree.NOTINITIALIZED2 )
            object.theRoot = false;
        if ( object.noPerspective == Friend.Tree.NOTINITIALIZED2 )
            object.noPerspective = false;
        if ( object.noRotation == Friend.Tree.NOTINITIALIZED2 )
            object.noRotation = false;
        if ( object.perspective == Friend.Tree.NOTINITIALIZED2 )
            object.perspective = undefined;
        if ( object.xCenter == Friend.Tree.NOTINITIALIZED2 )
            object.xCenter = undefined;
        if ( object.yCenter == Friend.Tree.NOTINITIALIZED2 )
            object.yCenter = undefined;
        if ( object.rotation == Friend.Tree.NOTINITIALIZED2 )
            object.rotation = 0;
        if ( object.zoomX == Friend.Tree.NOTINITIALIZED2 )
            object.zoomX = 1;
        if ( object.zoomY == Friend.Tree.NOTINITIALIZED2 )
            object.zoomY = 1;
        object.thisRect = new Friend.Tree.Utilities.Rect( 0, 0, 0, 0 );
        object.rect = new Friend.Tree.Utilities.Rect( 0, 0, 0, 0 );
        
        // Z position, over the parent
        if ( object.z == Friend.Tree.NOTINITIALIZED2 )
        {
            if ( properties.parent )
                object.z = properties.parent.z + 1;
        }

        // Width.
        // 'auto': get the size from the object, then 100% of parent
        // 'XXX%': percentage of the parent's width
        // 'XXXpx': fixed size
        // 'undefined': size of the item
        var pos;
        if ( object.resizeX == Friend.Tree.NOTINITIALIZED2 )
        {
            if ( typeof object.width == 'number' && object.width != Friend.Tree.NOTINITIALIZED2 )
            {
                object.resizeX = 'none';
            }
            else if ( typeof object.width == 'string' )
            {
                object.resizeX = object.width;
                object.width = 200;                 // Security
                property.width = undefined;
            }
            else
            {
                object.resizeX = '100%';
                object.width = 200;
                properties.width = undefined;
            }
        }

        // Height
        if ( object.resizeY == Friend.Tree.NOTINITIALIZED2 )
        {
            if ( typeof object.height == 'number' && object.height != Friend.Tree.NOTINITIALIZED2 )
            {
                object.resizeY = 'none';
            }
            else if ( typeof object.height == 'string' )
            {
                object.resizeY = object.height;
                object.height = 200;                // Security
                property.height = undefined;
            }
            else
            {
                object.resizeY = '100%';
                object.height = 200;
                properties.height = undefined;
            }
        }

        // Default messaging level
        object.messagesLevel = Friend.Tree.MESSAGELEVEL_EVENTS;

        // Add processes
        if ( properties.processes )
        {
            for ( var i = 0; i < properties.processes.length; i ++ )
            {
				var processName = properties.processes[ i ].type;
				var previous = 0;
				var obj = window;
				var pos = processName.indexOf( '.' );
				while( pos >= 0 )
				{
					obj = obj[ processName.substring( previous, pos ) ];
					previous = pos + 1;
					pos = processName.indexOf( '.', previous );
				}
				var process = new obj[ processName.substring( previous ) ]( object.tree, object, properties.processes[ i ].params );
	            object.addProcess.apply( object, [ process ] );
			}
        }

        // Insert in parent if defined
        if ( properties.parent )
		{
			if ( !properties.parent.internal )
            {
			    properties.parent.addItem( object, properties.priority, properties.priorityBase );
            }
		}
        else
        {
            // No parent-> the root of a new tree
            object.mouseX = 0;
            object.mouseY = 0;
            object.mouseButtons = 0;
            object.mouseInside = false;
            tree.addTree( object );
        }

		// Store for the next ones if not an internal object
		tree.previousItem = object;

		// Default renderItem (sets the width and height in the item)
        if ( object.renderItemName )
        {
            for ( var r = 0; r < tree.renderers.length; r++ )
            {
                var klass;
                var name = tree.renderers[ r ].name;
                name = name.substring( 9 );     // Removes 'Renderer_'
                if ( object.renderItemName == 'Friend.Tree.RenderItems.Empty' )
                {
                    object.renderItems.push( new Friend.Tree.RenderItems.Empty( tree, object, properties ) );
                }
                else 
                {
                    var className = object.renderItemName + '_' + name;
					klass = object.utilities.getClass( className );
					if ( klass )
					{
                        object.renderItems.push( new klass( tree, object, properties ) );
					}
                }
            }
        }

        // Destroy after XXX milliseconds? If yes, set timeout
        if ( properties.destroyAfter )
        {
            window.setTimeout( function()
            {
                object.destroy();
            }, properties.destroyAfter );
        }

        // renderItem has calculated the width and height, carry on with initialisation
        object.width = Friend.Tree.Utilities.getSizeFromString( object, object.parent, 'width', object.resizeX );
        object.height = Friend.Tree.Utilities.getSizeFromString( object, object.parent, 'height', object.resizeY );
        // if 3D -> do depth

        // RenderItem has set its sizes by default, compute the position
        object.x = Friend.Tree.Utilities.getPositionFromString( object, object.parent, 'x', object.positionX );
        object.y = Friend.Tree.Utilities.getPositionFromString( object, object.parent, 'y', object.positionY );
        // if 3D -> do z

        // Set the hotspot of the object
        object.setHotSpot( object.hotSpot );

		// Force a refresh all of the tree (TODO: optimize)
		if ( object.root )
			object.root.refreshAll = true;
    },

    // Events
    //////////////////////////////////////////////////////
    registerEvents: function( events, properties )
    {
        return this.tree.events.registerEvents( this, events, properties );
    },
    cancelEvent: function( level, eventName )
    {
        return this.tree.events.cancelEvent( this, level );
    },
    setEvent: function( eventName, properties )
    {
        return this.tree.events.registerEvents( this, eventName, properties );
    },
    setModal: function( flag )
    {
        this.tree.setModal( this, flag );
    },
    resize: function( width, height )
    {
        if ( typeof width != 'undefined' )
            this.width = width;
        if ( typeof height != 'undefined' )
            this.height = height;

        var message = 
        { 
            command: 'resize',
            width: width,
            height: height 
        };
        for ( var r = 0; r < this.renderItems.length; r++ )
        {
            var renderItem = this.renderItems[ r ];
            if ( renderItem.message )
                renderItem.message( message );
            
            // Update the renderer
            renderItem.renderer.resizeItem( renderItem, message.width, message.height );
        }
        this.doRefresh();
    },

	// Updates a property in the item and transfers the modification to '
	// the renderItems. Try that with another language thaqn Javascript. 10 pages!
	updateProperty: function( nameProperty, value, renderItem )
    {
		this[ nameProperty ] = value;
		for ( var r = 0; r < this.renderItems.length; r++ )
		{
			var ri = this.renderItems[ r ];
			if ( !renderItem || renderItem != ri )
			{
				if ( typeof renderItem[ nameProperty ] != 'undefined' )
				{
					renderItem[ nameProperty ] = value;
					renderItem[ nameProperty + '_changed' ] = true;
				}
			}
		}
	},
	
    /**
     * getMouseCoords
     *
     * Computes the mouse coordinates, making them local to the object
     *
     * @return (object) object containing X: and y: properties
     */
    getMouseCoords: function()
    {
        // Gets the coordinates from the controller object
        var coords = { x: this.controller.mouseX, y: this.controller.mouseY };

        // Explore hierarchy up to root
        var pile = [ ];
        var item = this;
        while ( item.parent )
        {
            pile.push( item );
            item = item.parent;
        }

        // Explores from root to here
        for ( var i = pile.length - 1; i >= 0; i -- )
        {
            if ( pile[ i ].transformCoordinates )
                coords = pile[ i ].transformCoordinates( coords );
        }

        // Returns coordinates
        return coords;
    },

    /**
     * doRefreshdoRefresh
     *
     * Forces a refresh of the display
     */
    doRefresh: function( depth )
    {
		// Something has changed in the tree
		if ( this.root )
		{
            this.root.refresh = true;

			// Refresh the whole tree?
			if ( depth < 0 )
			{
				this.root.refreshAll = true;
			}
		}

		// Eventually refreshes parents
		var parent = this.parent;
        while( parent && depth > 0 )
        {
			this.tree.addRefresh( parent );
            parent.refresh = true;
            parent = parent.parent;
            depth--;
        }

		// Item to be refreshed
        this.refresh = true;
		this.tree.addRefresh( this );

    },

    refreshParents: function( number )
    {
    },

    /**
     * addItem
     *
     * Adds an item to the list of items
     *
     * @param (object) item item to add
     * @param (string) optional priority
     *                 'bottom' (inserts at lower Z),
     *                 'before' (inserts before the given item),
     *                 'after' (inserts after the given item),
     *                 default inserts at the end
     * @param (object) optional object, object to insert before or after
     */
    setRoot: function( root )
    {
        this.root = root;
        for ( var i = 0; i < this.items.length; i++ )
            this.items[ i ].setRoot( root );
    },
    startInsertItems: function()
    {
		this.internal = true;
		this.insertItemsPile.push(
		{
			previousItem: this.tree.previousItem
		} );
    },
	endInsertItems: function()
    {
		this.internal = false;
		var data = this.insertItemsPile.pop();
		this.tree.previousItem = data.previousItem;
	},
    addItem: function( item, priority, priorityBase )
    {
        // Store in main list
        item.root.allItems[ item.identifier ] = item;

        // Set parent item
        item.parent = this;
		if ( typeof item.z === 'undefined' )
        	item.z = this.z + 1;

        // Store creation flags for recreation
        item.creationFlags.parentItemIdentifier = this.identifier;

        // Handle priority
        var position = this.items.length;
        if ( priorityBase )
        {
            for ( position = 0; position < this.items.length; position ++ )
            {
                if ( this.items[ position ] == priorityBase )
                {
                    break;
                }
            }
        }
        if ( priority )
        {
            switch ( priority )
            {
                case 'bottom':
                    position = 0;
                    break;
                case 'before':
                    position--;
                    if ( position < 0 )
                        position = 0;
                    break;
                case 'after':
                    position++;
                    if ( position >= this.items.length )
                        position = this.items.length;
                    break;
                default:
                    break;
            }
        }
        this.items.splice( position, 0, item );

        // Refresh!
        this.doRefresh();
        if ( this.root )
        {
            // Call all items and processes for creation
            var message =
            {
                command: 'create',
                type: 'system',
                creationFlags: item.creationFlags,
                itemEvent: item,
                name: item.name
            }
            this.tree.sendMessageToTree( this.root, message );
            this.root.refreshAll = true;
        }
		else
			this.refreshAll = true;
    },

    /**
     * addProcess
     *
     * Adds a process to the chain of processes
     *
     * @param (object) process to add
     */
    addProcess: function( process )
    {
        // Find the last process
        var p = this;
        while ( p.processes )
            p = p.processes;

        // Add to the pile
        p.processes = process;

        // Pokes the necessary functions
        process.object = this;
        process.parent = p;
        process.active = true;
        process.addItem = this.addItem;
        process.addProcess = this.addProcess;
        process.removeProcess = this.removeProcess;
		process.root = process.object.root;
		process.setAfter = this.setAfter;
		process.callAfter = this.callAfter;
		process.setTemporaryProperty = this.setTemporaryProperty;
		process.getTemporaryFunctions = this.getTemporaryFunctions;
		process.getTemporaryFunctionsCount = this.getTemporaryFunctionsCount;
		process.temporaryFunctionsCount = 0;
    },

    /**
     * removeProcess
     *
     * Deletes a process to the chain of processes
     *
     * @param (object) process to add
     */
    removeProcess: function( process )
    {
        // Find the last process
        var p = this;
        while ( p.processes && p.processes != process )
            p = p.processes;

        // Branches the next process
        if ( p )
            p.processes = p.processes.processes;
    },

    /**
     * removeItem
     *
     * Removes an item from the list of sub items
     *
     * @param (object) item item to remove
     */
    removeItem: function( item )
    {
        for ( var i = 0; i < this.items.length; i ++ )
        {
            if ( this.items[ i ] == item )
            {
                this.items.splice( i, 1 );
                break;
            }
        }
    },

    /**
     * getProcess
     *
     * Explores the list of processes and returns the one with the given name
     *
     * @param (string) name name of the process to find
     * @return (object) process found or null if not found
     */
    getProcess: function( name )
    {
        var process = this.processes;
        while ( process )
        {
            if ( process.className == name )
                return process;
            process = process.processes;
        }
        return null;
    },

    startProcess: function( message, properties )
    {        
        // Copy the properties if not a command
        this.processProperties = properties;
        if ( typeof message.refresh == 'undefined' )
            message.refresh = false;
		if ( message.type != 'system' && message.type != 'renderItemToItem')
		{
			for ( var p = 0; p < properties.length; p ++ )
			{
				if ( typeof message[ properties[ p ] ] == 'undefined' )
                    message[ properties[ p ] ] = this[ properties[ p ] ];
			}
        }
		return true;
    },
    endProcess: function( message )
    {
		// Changes the values
        var properties = this.processProperties;
		if ( message.refresh || message.fromNetwork )
		{
       		//if ( message.type != 'system' && message.type != 'renderItemToItem' )
    		{
                message.refresh = false;
                message.previous = {};                
                for ( var p = 0; p < properties.length; p ++ )
                {
                    if ( typeof message[ properties[ p ] ] != 'undefined' )
                    {
                        if ( this[ properties[ p ] ] != message[ properties[ p ] ] )
                        {
                            message.previous[ properties[ p ] ] = this[ properties[ p ] ]; 
							this.updateProperty( p, message[ properties[ p ] ] );
							message[ properties[ p ] ] = Friend.Tree.UPDATED;
                            message.refresh = true;
                        }
                    }
                }
                if ( message.refresh )
                    this.doRefresh();
            }
        }
		return message.refresh;
    },

    /**
     * destroy
     *
     * Destroys the object
     * Object is actually destroyed at the end of the current update process
     * Sends a message to all the processes of all the objects indicating the destruction of this object
     */
    destroy: function( callback )
    {
        this.active = false;
        this.tree.addToDestroy( this );
        if ( callback )
            this.onDestroyCallback = callback;
        if ( this.caller && this.onDestroyed )   
            this.onDestroyed.apply( this.caller, [ this ] );
    },

	checkCollisions: function ( x, y, item )
	{
		if ( x - item.hotSpotX + item.width > this.x - this.hotSpotX )
		{
			if ( x - item.hotSpotX < this.x - this.hotSpotX + this.width )
			{
				if ( y - item.hotSpotY + item.height > this.y - this.hotSpotY )
				{
					if ( y - item.hotSpotY < this.y - this.hotSpotY + this.height )
					{
						var result = {};
						result[ this.identifier ] = this;
						return result;
					}
				}
			}

		}
		return null;
	},

    /**
     * findItem
     *
     * Looks for a sub item from its name
     *
     * @param (string) name name of the item to look for
     * @return (object) the item if found, null if not found
     */
    findItemFromIdentifier: function( identifier )
    {
        return this.root.allItems( identifier );
    },

    findItemFromName: function( name, item )
    {
        if ( typeof item == 'undefined' )
            item = this;
        return item.findFromName( name );
    },
    findFromName: function( name )
    {
        if ( this.name == name )
			return this;

        for ( var i = 0; i < this.items.length; i++ )
        {
            var found = this.items[ i ].findFromName( name );
            if ( found )
                return found;
        }
        return null;
    },

    findItemFromNameAndClassName: function( name, className, item )
    {
        if ( typeof item == 'undefined' )
            item = this;
        return item.findFromNameAndClassName( name, className );
    },
    findFromNameAndClassName: function( name, className )
    {
        if ( this.name == name && this.className == className )
			return this;

        for ( var i = 0; i < this.items.length; i++ )
        {
            var found = this.items[ i ].findFromNameAndClassName( name, className );
            if ( found )
                return found;
        }
        return null;
    },

    findItemFromClassName: function( className, item )
    {
        if ( typeof item == 'undefined' )
            item = this;
        return this.findFromClassName( className );
    },
    findFromClassName: function( className )
    {
        if ( this.className == className )
			return this;

        for ( var i = 0; i < this.items.length; i++ )
        {
            var found = this.items[ i ].findFromClassName( className );
            if ( found )
                return found;
        }
        return null;
    },

	findAllItemsFromName: function( name, item )
	{
        if ( typeof item == 'undefined' )
            item = this;

        var foundItems = [];
		item.findAllNames( name, foundItems );
        return foundItems;
	},
	findAllNames: function( name, foundItems )
	{
        if ( name == this.name  )
            foundItems.push( this );
        for ( var i = 0; i < this.items.length; i++ )
        {
			this.items[ i ].findAllNames( name, foundItems );
        }
	},

	findAllItemsFromClassName: function( className, item )
	{
        if ( typeof item == 'undefined' )
            item = this;

        var foundItems = [];
		item.findAllClassNames( className, foundItems );
        return foundItems;
	},
	findAllClassNames: function( className, foundItems )
	{
        if ( className == this.className  )
            foundItems.push( this );

        for ( var i = 0; i < this.items.length; i++ )
        {
			this.items[ i ].findAllClassNames( name, foundItems );
        }
	},

	findParentItemFromName: function( name )
    {
        var parent = this.parent;
        while( parent )
        {
			if ( parent.name == name )
				return parent;
			parent = parent.parent;
        }
        return null;
    },
	findParentItemFromClassName: function( className )
    {
        var parent = this.parent;
        while( parent )
        {
			if ( parent.className == className )
				return parent;
			parent = parent.parent;
        }
        return null;
    },

    // Internal destruction function
    doDestroy: function()
    {
		// Call the item destroy function if defined
		if ( this.onDestroy )
			this.onDestroy();

		// Call all the processes of the tree
        var flags = 
        {
            command: 'destroy',
            type: 'system',
            itemEvent: this
        };
        this.tree.sendMessageToTree( this.root, message, Friend.Tree.MESSAGELEVEL_LIFE );

		// Calls external process
        if ( this.onProcess && this.caller )
            this.onProcess.apply( this.caller, [ 0, flags ] );

		// Remove from parent list of items
		var parent = this.parent;
		if ( parent && parent.items )
		{
			for ( var i = 0; i < parent.items.length; i ++ )
	        {
	            if ( parent.items[ i ] == this )
	            {
	                parent.doRefresh();
	                parent.items.splice( i, 1 );
	                break;
	            }
	        }
		}
	},

    setValue: function()
    {
    },
    getValue: function()
    {
        return 0;
    },

    /**
     * setCoordinates
     *
     * Changes the position of an object
     * Calls all the processes of the item so that they can update their own coordinates
     *
     * @param (number) x (optional) the new horizontal coordinate
     * @param (number) y (optional) the new vertical coordinate
     */
    setCoordinates: function( x, y )
    {
        if ( typeof x != 'undefined' )
            this.x = x;
        if ( typeof y != 'undefined' )
            this.y = y;
        //this.startProcess( 0, { }, [ 'x', 'y' ] );
    },

    /**
     * enable
     *
     * Enable or disable a subitem
     * A disabled item processes will not be called.
     *
     * @param (string) name name of the item to enable
     * @param (boolean) enabled true to enablem, false to disable
     */
    enable: function( name, enabled )
    {
        var color = '#000000';
        if ( ! enabled )
            color = '#404040';
        for ( var i = 0; i < this.items.length; i ++ )
        {
            if ( this.items[ i ].name == name )
            {
                if ( this.items[ i ].active != enabled )
                {
                    this.items[ i ].colorDisabled = color;
                    this.items[ i ].active = enabled;
                    this.doRefresh();
                }
            }
        }
    },

    callAllRenderItems: function( functionName, parameters )
    {
        for ( var r = 0; r < this.renderItems.length; r++ )
            this.renderItems[ r ][ functionName ].apply( this.renderItems[ r ], parameters );
    },
    callRenderItem: function( functionName, parameters )
    {
        return this.renderItems[ 0 ][ functionName ].apply( this.renderItems[ 0 ], parameters );
    },

    /**
     * setTemporaryProperty
     *
     * Changes one property of the item for a limited time and restores it at the end
     * allowing easy temporary changes like hilight or speed changes
     */
    setTemporaryProperty: function( prop, value, setAfter, restoreAfter )
    {
		this.temporaryFunctionsCount++;
		this.tree.setTemporaryProperty( this, delay, value, setAfter, restoreAfter );
    },
    setAfter: function( prop, value, setAfter )
	{
		this.temporaryFunctionsCount++;
		return this.tree.setAfter( this, prop, value, setAfter );
	},
	callAfter: function( func, value, callAfter )
	{
		this.temporaryFunctionsCount++;
		return this.tree.callAfter( this, func, value, callAfter );
	},
	getTemporaryFunctions: function( name )
	{
		return this.tree.getTemporaryFunctions( this, name );
	},
	getTemporaryFunctionsCount: function()
	{
		return this.temporaryFunctionsCount;
	},

    /**
     * setHotSpot
     *
     * Calculates / change the hotspot of an item
     *
     * @param (number) hotSpot identifier of the hotspot location (defined in Tree, such as Friend.Tree.HOTSPOT_CENTER)
     */
    setHotSpot: function( hotSpot )
    {
        switch ( hotSpot )
        {
            case Friend.Tree.HOTSPOT_LEFTTOP:
                this.hotSpotX = 0;
                this.hotSpotY = 0;
                break;
            case Friend.Tree.HOTSPOT_CENTERTOP:
                this.hotSpotX = this.width / 2;
                this.hotSpotY = 0;
                break;
            case Friend.Tree.HOTSPOT_RIGHTTOP:
                this.hotSpotX = this.width;
                this.hotSpotY = 0;
                break;
            case Friend.Tree.HOTSPOT_LEFTCENTER:
                this.hotSpotX = 0;
                this.hotSpotY = this.height / 2;
                break;
            case Friend.Tree.HOTSPOT_CENTER:
                this.hotSpotX = this.width / 2;
                this.hotSpotY = this.height / 2;
                break;
            case Friend.Tree.HOTSPOT_RIGHTCENTER:
                this.hotSpotX = this.width;
                this.hotSpotY = this.height / 2;
                break;
            case Friend.Tree.HOTSPOT_LEFTBOTTOM:
                this.hotSpotX = 0;
                this.hotSpotY = this.height;
                break;
            case Friend.Tree.HOTSPOT_CENTERBOTTOM:
                this.hotSpotX = this.width / 2;
                this.hotSpotY = this.height;
                break;
            case Friend.Tree.HOTSPOT_RIGHTBOTTOM:
                this.hotSpotX = this.width;
                this.hotSpotY = this.height;
                break;
        }
    },

};
