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
 * Tree engine main items definition
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 22/08/2017
 */
Friend = window.Friend || {};
Friend.UI = Friend.UI || {};
Friend.Tree = Friend.Tree || {};
Friend.Flags = Friend.Flags || {};

/**
 * Tree
 *
 * Inclusion of another tree item
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * Flags
 * tree: (object) tree to display / handle
 * larsen: (number) if the tree already contains a 'Tree' object displaying the
 *         same tree, limits the number of rendering inside the rendering
 *         (default: 1)
 */
Friend.Tree.Tree = function( tree, name, flags )
{
    this.tree = false;
    this.larsen = 1;
    this.clip = true;
    this.borderSize = 0;
    this.borderColor = '#000000';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Tree', flags );
	Object.assign( this, Friend.Tree.Tree );

    this.larsenCounter = 0;
	this.rotation = 0;
};
Friend.Tree.Tree.renderUp = function( flags )
{
    if ( flags.z == this.z && this.larsenCounter < this.larsen )
    {
        this.larsenCounter++;
        // Draw border
        var delta = 0;
        if ( this.borderSize )
        {
            this.rect.drawRectangle( flags, this.borderColor, this.borderSize );
            delta = this.borderSize;
        }
        // Clip rectangle
        var rect = new Friend.Utilities.Rect( delta, delta, this.width - delta * 2, this.height - delta * 2);
        flags.renderer.save( flags );
        rect.clip( flags );
        // Render the tree
        var treeFlags =
        {
            x: delta,
            y: delta,
            zoomX: ( this.width - delta * 2 ) / this.tree.width,
            zoomY: ( this.height - delta * 2 ) / this.tree.height
        };
        this.tree.renderTree( this.tree, treeFlags );
        // Restore clipping
        flags.renderer.restore();
        this.larsenCounter--;
    }
	return flags;
};
Friend.Tree.Tree.renderDown = function( flags )
{
    return flags;
};
Friend.Tree.Tree.processUp = function( flags )
{
    return this.startProcess( flags, [ 'x', 'y', 'z', 'rotation', 'zoomX', 'zoomY', 'alpha' ] );
};
Friend.Tree.Tree.processDown = function( flags )
{
    return this.endProcess( flags, [ 'x', 'y', 'z', 'rotation', 'zoomX', 'zoomY', 'alpha' ] );
};

/**
 * RendererImage
 *
 * Outputs the result of the previous rendering 
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * Flags
 */
Friend.UI.RendererImage = function( tree, name, flags )
{    
    this.rendererType= 'Sprite';
    Friend.Tree.Items.init( this, tree, name, 'Friend.UI.RendererImage', flags );
    Object.assign( this, Friend.UI.RendererImage );
    this.renderer = false;
    this.image
};
Friend.UI.RendererImage.renderUp = function( flags )
{
    if ( !this.renderer )
    {
        this.renderer = flags.renderer;
        this.newImage = new Image();
        this.newImage.width = this.width;
        this.newImage.height = this.height;
        this.resources.addImage( this.name, this.newImage, Friend.Flags.HOTSPOT_LEFTTOP );
        this.image = this.name;
        flags.renderer.startRenderTo( this.name, 
        {
            destination: this.newImage,
            width: this.width,
            height: this.height
        } );
    }
    return flags;
};
Friend.UI.RendererImage.renderDown = function( flags )
{
    return flags;
};
Friend.UI.RendererImage.processUp = function( flags )
{
    if ( flags.command == 'destroy' && flags.itemEvent == this )
    {
        //debugger;
        if ( this.renderer )        
            this.renderer.stopRenderTo( this.name );
    }
    return this.startProcess( flags, [ 'x', 'y', 'z', 'rotation' ] );
};
Friend.UI.RendererImage.processDown = function( flags )
{
    this.doRefresh();
    this.tree.renderer.updateItem( this );
    return this.endProcess( flags, [ 'x', 'y', 'z', 'rotation' ] );
};

/**
 * Bitmap
 *
 * Moveable graphical object
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * Flags
 * image: (string) name of the image to display
 */
Friend.UI.Bitmap = function( tree, name, flags )
{
    this.image = false;
    this.rendererType= 'Sprite';
	this.ignoreImageSize = false;
	this.hotSpotX = 0;
	this.hotSpotY = 0;
    Friend.Tree.Items.init( this, tree, name, 'Friend.UI.Bitmap', flags );
	Object.assign( this, Friend.UI.Bitmap );

	this.setValue( this.image, true );
};
Friend.UI.Bitmap.renderUp = function( flags )
{
    return flags;
};
Friend.UI.Bitmap.renderDown = function( flags )
{
    return flags;
};
Friend.UI.Bitmap.processUp = function( flags )
{
    return this.startProcess( flags, [ 'x', 'y', 'z', 'rotation', 'image' ] );
};
Friend.UI.Bitmap.processDown = function( flags )
{
    flags = this.endProcess( flags, [ 'x', 'y', 'z', 'rotation', 'image' ] );
    if ( flags.refresh && this.image != flags.image )
    	this.setValue( this.image );
	return flags;
};
Friend.UI.Bitmap.setValue = function( image, force )
{
	if ( image != this.image || force )
	{
		var img = this.resources.getImage( image );
		if ( img )
		{
			this.image = image;
			this.width = img.width;
			this.height = img.height;
			this.hotSpotX = img.hotSpotX;
			this.hotSpotY = img.hotSpotY;
			this.doRefresh();
		}
	}
};
Friend.UI.Bitmap.getValue = function( image )
{
	return this.image;
};
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Bitmap
 *
 * Simple color rectangle
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * Flags
 * color: (string) color of the rectangle
 */
Friend.UI.ColorBox = function( tree, name, flags )
{
    this.color = false;
    this.rendererType = 'Canvas';
    Friend.Tree.Items.init( this, tree, name, 'Friend.UI.ColorBox', flags );
	Object.assign( this, Friend.UI.ColorBox );

    // Default values
    if ( typeof color == 'undefined' )
        color = 0;
    this.color = color;
    this.rotation = 0;
};
Friend.UI.ColorBox.renderUp = function( flags )
{
    this.thisRect.fillRectangle( flags, this.color );
	return flags;
};
Friend.UI.ColorBox.renderDown = function( flags )
{
    return flags;
};
Friend.UI.ColorBox.processUp = function( flags )
{
    return this.startProcess( flags, [ 'x', 'y', 'z', 'rotation', 'color' ] );
};
Friend.UI.ColorBox.processDown = function( flags )
{
    return this.endProcess( flags, [ 'x', 'y', 'z', 'rotation', 'color' ] );
};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Text
 *
 * Simple text
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * Flags
 * text: (string) text to display
 * align: (string) alignement of the tex ('left' (default), 'center', 'right')
 * font: (string) font to use
 * color: (string) color of the text
 * backColor: (string) if defined, draws a rectangle of the color behind the text
 * mouseOverHilight: (string) color to add when mouse over item
 * clickHilight: (string) color to add when clicking on the item
 * data: (*) data to associate with the item
 * onMouseOver: (function) function to call when mouse is over item
 * onClick: (function) function to call in case of click on the item
 * caller: (object) object to call whn mouseover of click
 */
Friend.UI.Text = function( tree, name, flags )
{
    this.clickHilight = '#202020';
    this.hAlign = 'center';
    this.vAlign = 'middle';
    this.forceSx = false;
    this.forceSy = false;
    this.active = false;
    this.data = false;
    this.color = '#000000';
    this.colorMouseOver = '#000000';
    this.colorDown = '#000000';
    this.backColor = Friend.Flags.NOTINITIALIZED;
    this.backColorMouseOver = Friend.Flags.NOTINITIALIZED;
    this.backColorDown = Friend.Flags.NOTINITIALIZED;
    this.text = 'My text';
    this.font = '#12px Arial';
    this.caller = false;
    this.onClick = false;
    this.onDoubleClick = false;
	this.rendererType = 'Canvas';
    Friend.Tree.Items.init( this, tree, name, 'Friend.UI.Text', flags );
	Object.assign( this, Friend.UI.Text );

    this.setFont( this.font );
    this.mouseOver = false;
    this.down = false;
    if ( this.backColor !== Friend.Flags.NOTINITIALIZED )
    {
        if ( this.backColorMouseOver === Friend.Flags.NOTINITIALIZED )
            this.backColorMouseOver = this.backColor;
        if ( this.backColorDown === Friend.Flags.NOTINITIALIZED )
            this.backColorDown = this.backColor;
    }
};
Friend.UI.Text.renderUp = function( flags )
{
    if ( this.backColor !== Friend.Flags.NOTINITIALIZED )
    {
        var backColor = this.backColor;
        if ( this.mouseOver )
            backColor = this.backColorMouseOver;
        if ( this.down || this.activated )
            backColor = this.backColorDown;
        this.thisRect.fillRectangle( flags, backColor );
    }
    var textColor = this.color;
    if ( this.mouseOver )
        textColor = this.colorMouseOver;
    if ( this.down || this.activated )
        textColor = this.colorDown;
    this.thisRect.drawText( flags, this.text, this.font, textColor, this.hAlign, this.vAlign );
	return flags;
};
Friend.UI.Text.renderDown = function( flags )
{
    return flags;
};
Friend.UI.Text.processUp = function( flags )
{
    return this.startProcess( flags, [ 'x', 'y', 'z', 'rotation', 'text', 'down', 'mouseOver', 'caller', 'onClick', 'onDoubleClick' ] );
};
Friend.UI.Text.processDown = function( flags )
{
    return this.endProcess( flags, [ 'x', 'y', 'z', 'rotation', 'text', 'mouseOver', 'down' ] );
};
Friend.UI.Text.getValue = function()
{
    return this.text;
};

/**
 * setFont
 *
 * Change the font used to display the text
 *
 * @param (string) new font to use
 */
Friend.UI.Text.setFont = function( font )
{
    this.font = font;

    // Get width and height of text
    var sizes = this.renderer.measureText( this.text, this.font );
    if ( ! this.forceSx )
        this.width = sizes.width;
    if ( ! this.forceSy )
        this.height = sizes.height;
    this.setHotSpot( this.hotSpot );
    this.doRefresh();
};

/**
 * setColor
 *
 * Change the color of the text
 *
 * @param (string) new color
 */
Friend.UI.Text.setColor = function()
{
    this.color = color;
    this.doRefresh();
};





///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

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
     * @param (object) flags creation flags
     */
    init: function( object, tree, name, className, flags )
    {
        object.tree = tree;
        object.utilities = tree.utilities;
        object.resources = tree.resources;
        object.controller = tree.controller;
        object.renderer = tree.renderer;
        object.name = name;
        object.className = className;
        object.creationFlags = Object.assign( {}, flags );
		object.creationFlags.name = name;
		object.creationFlags.itemName = name;
        object.creationFlags.className = className;
        object.identifier = tree.getNewIdentifier( name );
		object.application = tree.application;
        object.root = flags.root;

        object.timeOfCreation = tree.time;
        object.items = [ ];
		object.insertItemsPile = [];
		object.temporaryFunctionsCount = 0;
        object.onDestroyCallback = null;

        object.active = true;
        object.visible = true;
        object.colorDisabled = '#000000';
        object.refresh = true;

        object.setCoordinates = this.setCoordinates;
        object.destroy = this.destroy;
        object.handleDestroy = this.handleDestroy;
        object.doDestroy = this.doDestroy;
        object.addItem = this.addItem;
        object.addProcess = this.addProcess;
        object.removeProcess = this.removeProcess;
        object.removeItem = this.removeItem;
        object.renderSubItems = this.renderSubItems;
        object.doRefresh = this.doRefresh;
        object.enable = this.enable;
        object.startProcess = this.startProcess;
        object.endProcess = this.endProcess;
        object.setHotSpot = this.setHotSpot;
        object.controller = tree.controller;
        object.getMouseCoords = this.getMouseCoords;
        object.findItem = this.findItem;
        object.findItemFromName = this.findItemFromName;
        object.findParentItemFromName = this.findParentItemFromName;
		object.findFirstItemFromName = this.findFirstItemFromName;
		object.findNextItem = this.findNextItem;
		object.doFindItemFromName = this.doFindItemFromName;
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
		if ( typeof object.checkCollisions == 'undefined' )
			object.checkCollisions = this.checkCollisions;
        if ( typeof object.getValue == 'undefined' )
            object.getValue = this.getValue;
        if ( typeof object.getValue == 'undefined' )
            object.setValue = this.setValue;

		// Tranforms the evals in the flags into values
		if ( tree.previousItem )
		{
			var variables =
			{
				parentItem: flags.parent,
				previousItem: tree.previousItem,
				treeWidth: tree.width,
				treeHeight: tree.height
			};
			flags = tree.utilities.computeFlags( flags, object, variables );
		}
        // Adds all flags
        object.collisions = false;
        object.noRotation = 0;
        object.destroyList = [ ];
		object.offsetX = 0;
		object.offsetY = 0;
		object.toDestroy = false;
		object.modal = false;
		object.noOffsets = false;
        if ( typeof object.x == 'undefined' )
            object.x = Friend.Flags.NOTINITIALIZED2;
        if ( typeof object.y == 'undefined' )
            object.y = Friend.Flags.NOTINITIALIZED2;
        if ( typeof object.z == 'undefined' )
            object.z = Friend.Flags.NOTINITIALIZED2;
        if ( typeof object.width == 'undefined' )
            object.width = Friend.Flags.NOTINITIALIZED2;
        if ( typeof object.height == 'undefined' )
            object.height = Friend.Flags.NOTINITIALIZED2;
        if ( typeof object.rotation == 'undefined' )
            object.rotation = Friend.Flags.NOTINITIALIZED2;
        if ( typeof object.hotSpot == 'undefined' )
            object.hotSpot = Friend.Flags.NOTINITIALIZED2;
        if ( typeof object.hotSpotX == 'undefined' )
            object.hotSpotX = Friend.Flags.NOTINITIALIZED2;
        if ( typeof object.hotSpotY == 'undefined' )
            object.hotSpotY = Friend.Flags.NOTINITIALIZED2;
        if ( typeof object.alpha == 'undefined' )
            object.alpha = Friend.Flags.NOTINITIALIZED2;
        if ( typeof object.destroyAfter == 'undefined' )
            object.destroyAfter = Friend.Flags.NOTINITIALIZED2;
        if ( typeof object.onProcess == 'undefined' )
            object.onProcess = Friend.Flags.NOTINITIALIZED2;
        if ( typeof object.noPerspective == 'undefined' )
            object.noPerspective = Friend.Flags.NOTINITIALIZED2;
        if ( typeof object.theRoot == 'undefined' )
            object.theRoot = Friend.Flags.NOTINITIALIZED2;
        if ( typeof object.perspective == 'undefined' )
            object.perspective = Friend.Flags.NOTINITIALIZED2;
        if ( typeof object.xCenter == 'undefined' )
            object.xCenter = Friend.Flags.NOTINITIALIZED2;
        if ( typeof object.yCenter == 'undefined' )
            object.yCenter = Friend.Flags.NOTINITIALIZED2;
        if ( typeof object.rotation == 'undefined' )
            object.rotation = Friend.Flags.NOTINITIALIZED2;
        if ( typeof object.zoomX == 'undefined' )
            object.zoomX = Friend.Flags.NOTINITIALIZED2;
        if ( typeof object.zoomY == 'undefined' )
            object.zoomY = Friend.Flags.NOTINITIALIZED2;
        object.utilities.setFlags( object, flags );
        object.setHotSpot( object.hotSpot );
        if ( object.width == Friend.Flags.NOTINITIALIZED2 )
            object.width = 300;
        if ( object.height == Friend.Flags.NOTINITIALIZED2 )
            object.height = 200;
		if ( typeof object.x == 'string' )
		{
			if ( tree.previousItem )
			{
				switch ( object.x )
				{
					case 'left':
						object.x = tree.previousItem.x + tree.previousItem.width;
						break;
					case 'over':
						object.x = tree.previousItem.x;
						break;
					case 'right':
						object.x = tree.previousItem.x - object.width;
						break;
					default:
						try
						{
							object.x = eval( object.x );
						} catch (e) { } finally { }
						break;
				}
			}
		}
		if ( typeof object.y == 'string' )
		{
			if ( tree.previousItem )
			{
				switch ( object.y )
				{
					case 'under':
						object.y = tree.previousItem.y + tree.previousItem.height;
						break;
					case 'over':
						object.y = tree.previousItem.y;
						break;
					case 'above':
						object.y = tree.previousItem.y - object.height;
						break;
					default:
						try
						{
							object.y = eval( object.y );
						} catch (e) { } finally { }
						break;
				}
			}
		}
        if ( object.x == Friend.Flags.NOTINITIALIZED2 )
		{
			if ( flags.parent && !flags.absolute )
				object.x = flags.parent.width / 2 - object.width / 2;
			else
				object.x = tree.canvasWidth / 2 - object.width / 2;
		}
        if ( object.y == Friend.Flags.NOTINITIALIZED2 )
		{
			if ( flags.parent && !flags.absolute )
				object.y = flags.parent.height / 2 - object.height / 2;
			else
				object.y = tree.canvasHeight / 2 - object.height / 2;
		}
        if ( object.z == Friend.Flags.NOTINITIALIZED2 )
        {
            if ( flags.parent )
                object.z = flags.parent.z + 1;
        }
        if ( object.rotation == Friend.Flags.NOTINITIALIZED2 )
            object.rotation = 0;
        if ( object.hotSpotX == Friend.Flags.NOTINITIALIZED2 )
            object.hotSpotX = 0;
        if ( object.hotSpotY == Friend.Flags.NOTINITIALIZED2 )
            object.hotSpotY = 0;
        if ( object.hotSpot == Friend.Flags.NOTINITIALIZED2 )
            object.hotSpot = Friend.Flags.HOTSPOT_LEFTTOP;
        if ( object.alpha == Friend.Flags.NOTINITIALIZED2 )
            object.alpha = 1;
        if ( object.destroyAfter == Friend.Flags.NOTINITIALIZED2 )
            object.destroyAfter = 0;
        if ( object.onProcess == Friend.Flags.NOTINITIALIZED2 )
            object.onProcess = null;
        if ( object.theRoot == Friend.Flags.NOTINITIALIZED2 )
            object.theRoot = false;
        if ( object.noPerspective == Friend.Flags.NOTINITIALIZED2 )
            object.noPerspective = 0;
        if ( object.perspective == Friend.Flags.NOTINITIALIZED2 )
            object.perspective = undefined;
        if ( object.xCenter == Friend.Flags.NOTINITIALIZED2 )
            object.xCenter = undefined;
        if ( object.yCenter == Friend.Flags.NOTINITIALIZED2 )
            object.yCenter = undefined;
        if ( object.rotation == Friend.Flags.NOTINITIALIZED2 )
            object.rotation = 0;
        if ( object.zoomX == Friend.Flags.NOTINITIALIZED2 )
            object.zoomX = 1;
        if ( object.zoomY == Friend.Flags.NOTINITIALIZED2 )
            object.zoomY = 1;
        object.thisRect = new Friend.Utilities.Rect( 0, 0, 0, 0 );
        object.rect = new Friend.Utilities.Rect( 0, 0, 0, 0 );

        // Add processes
        if ( flags.processes )
        {
            for ( var i = 0; i < flags.processes.length; i ++ )
            {
				var processName = flags.processes[ i ].type;
				var previous = 0;
				var obj = window;
				var pos = processName.indexOf( '.' );
				while( pos >= 0 )
				{
					obj = obj[ processName.substring( previous, pos ) ];
					previous = pos + 1;
					pos = processName.indexOf( '.', previous );
				}
				var process = new obj[ processName.substring( previous ) ]( object.tree, object, flags.processes[ i ].params );
	            object.addProcess.apply( object, [ process ] );
			}
        }

        // Insert in parent if defined
        if ( flags.parent )
		{
			if ( !flags.parent.internal )
			    tree.addItem( object, flags.parent );
		}
		else
			tree.addTree( object, flags );

		// Store for the next ones if not an internal object
		tree.previousItem = object;

		// Force a refresh all of the tree (TODO: optimize)
		if ( object.root )
			object.root.refreshAll = true;
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
     * startModal
     *
     * Sets all the items to inactive expect the ones given as parameters
     * Pushes the current state for restoration
     *
     * @param (array of objects) objects array of objects to keep active
     */
    setModal: function ( item, skipItem, active, notFirst )
    {
		if ( notFirst )
		{
			item.active = active;
			item.refresh = true;
		}
    	for ( var i = 0; i < item.items.length; i++ )
        {
            if ( item.items[ i ] != skipItem )
                item.setModal( item.items[ i ], false, active, true );
        }
		return;
	},
    startModal: function()
    {
		if ( !this.isModal )
		{
	    	this.isModal = true;
	    	this.setModal( this.parent, this, false );
		}
    },
    stopModal: function ()
    {
		if ( this.isModal )
		{
	        this.isModal = false;
			this.setModal( this.parent, this, true );
		}
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
    addItem: function( item, priority, object )
    {
        // Set parent item
        item.parent = this;
		if ( typeof item.z === 'undefined' )
        	item.z = this.z + 1;

        // Store creation flags for recreation
        item.creationFlags.parentItemIdentifier = this.identifier;

        // Handle priority
        var position = this.items.length;
        if ( object )
        {
            for ( position = 0; position < this.items.length; position ++ )
            {
                if ( this.items[ position ] == object )
                {
                    position = object;
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
                    position --;
                    if ( position < 0 )
                        position = 0;
                    break;
                case 'after':
                    position ++;
                    if ( position >= this.items.length )
                        position = this.items.length;
                    break;
                default:
                    break;
            }
        }
        this.items.splice( position, 0, item );

        // Call all processes for creation
        // A new object has been created
        var flags =
        {
			command: 'create',
            itemEvent: item,
            creationFlags: item.creationFlags,
            name: item.name,
            preserve: true
        }

        // Call the processes of the subitem
		this.tree.processItem( this, 0, flags );

        // Refresh!
        this.doRefresh();
		if ( this.root )
			this.root.refreshAll = true;
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

    /**
     * startProcess
     *
     * Function to call by the objects to start the processes exploration
     *
     * @param (delay) delay time since last frame (milliseconds)
     * @param (number) zoom current zoom factor
     * @param (object) flags to transøit in the chain
     * @param (array) sourceFlags list of the names of the properties from the object to copy in the flags
     */
    startProcess: function( flags, properties )
    {
		// Copy the properties if not a command
		if ( !flags.command )
		{
			for ( var p = 0; p < properties.length; p ++ )
			{
				if ( typeof flags[ properties[ p ] ] == 'undefined' )
					flags[ properties[ p ] ] = this[ properties[ p ] ];
			}
		}
		if ( !flags.refresh )
			flags.refresh = false;

        // Calls external process
        if ( this.onProcess && this.caller )
            this.onProcess.apply( this.caller, [ flags ] );

		return flags;
    },

    /**
     * endProcess
     *
     * End the processes, pokes the properties in the object
     *
     * @param (object) flags the flags at the end of the processes exploration
     * @param (array) properties the list of properties to look for in the flags
     */
    endProcess: function( flags, properties )
    {
        // Destroys the object after a while?
        if ( this.destroyAfter )
        {
            if ( this.tree.time - this.timeOfCreation > this.destroyAfter )
                this.tree.addToDestroy( this );
        }

		// Changes the values
		var refresh = false;
		if ( flags.refresh && !flags.command )
		{
	        for ( var p = 0; p < properties.length; p ++ )
	        {
	            if ( typeof flags[ properties[ p ] ] != 'undefined' )
	            {
	                if ( this[ properties[ p ] ] != flags[ properties[ p ] ] )
	                {
	                    this[ properties[ p ] ] = flags[ properties[ p ] ];
	                    refresh = true;
	                }
	            }
	        }
		}
		if ( refresh )
			this.doRefresh();
		return flags;
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
    findItem: function( identifier )
    {
        return this.tree.findItem( identifier );
    },
    findItemFromName: function( name, className )
    {
        if ( this.name == name )
		{
			if ( !className )
				return this;
			else
			{
				if ( className == this.className )
					return this;
			}
		}
        for ( var i = 0; i < this.items.length; i ++ )
        {
            var found = this.items[ i ].findItemFromName( name, className );
            if ( found )
                return found;
        }
        return null;
    },
	findFirstItemFromName: function( name, className )
	{
		this.findItemName = name;
		this.findItemClassName = className;
		this.findItemCurrent = null;
		return this.doFindItemFromName( name, className, this );
	},
	findNextItem: function()
    {
		if ( this.findItemCurrent )
			return this.findItemCurrent.doFindItemFromName( this.findItemName, this.findItemClassName, this );
		return null;
	},
	doFindItemFromName: function( name, className, origin )
    {
        if ( this.name == name && origin.findItemCurrent != this )
		{
			if ( !className )
			{
				origin.findItemCurrent = this;
				return this;
			}
			else if ( className == this.className )
			{
				origin.findItemCurrent = this;
				return this;
			}
		}
        for ( var i = 0; i < this.items.length; i ++ )
        {
			var item = this.items[ i ].doFindItemFromName( name, className, origin );
			if ( item )
			{
				origin.findItemCurrent = item;
				return item;
			}
        }
		origin.findItemCurrent = null;
        return null;
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

    // Internal destruction function
    doDestroy: function()
    {
		// Call the item destroy function if defined
		if ( this.onDestroy )
			this.onDestroy();

		// Call all the processes of the tree
		var flags = { itemEvent: this, command: 'destroy', preserve: true };
        this.tree.processTree( this.root, 0, flags );

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
     * @param (number) hotSpot identifier of the hotspot location (defined in Tree, such as Friend.Flags.HOTSPOT_CENTER)
     */
    setHotSpot: function( hotSpot )
    {
        switch ( hotSpot )
        {
            case Friend.Flags.HOTSPOT_LEFTTOP:
                this.hotSpotX = 0;
                this.hotSpotY = 0;
                break;
            case Friend.Flags.HOTSPOT_CENTERTOP:
                this.hotSpotX = this.width / 2;
                this.hotSpotY = 0;
                break;
            case Friend.Flags.HOTSPOT_RIGHTTOP:
                this.hotSpotX = this.width;
                this.hotSpotY = 0;
                break;
            case Friend.Flags.HOTSPOT_LEFTCENTER:
                this.hotSpotX = 0;
                this.hotSpotY = this.height / 2;
                break;
            case Friend.Flags.HOTSPOT_CENTER:
                this.hotSpotX = this.width / 2;
                this.hotSpotY = this.height / 2;
                break;
            case Friend.Flags.HOTSPOT_RIGHTCENTER:
                this.hotSpotX = this.width;
                this.hotSpotY = this.height / 2;
                break;
            case Friend.Flags.HOTSPOT_LEFTBOTTOM:
                this.hotSpotX = 0;
                this.hotSpotY = this.height;
                break;
            case Friend.Flags.HOTSPOT_CENTERBOTTOM:
                this.hotSpotX = this.width / 2;
                this.hotSpotY = this.height;
                break;
            case Friend.Flags.HOTSPOT_RIGHTBOTTOM:
                this.hotSpotX = this.width;
                this.hotSpotY = this.height;
                break;
        }
    },


};
