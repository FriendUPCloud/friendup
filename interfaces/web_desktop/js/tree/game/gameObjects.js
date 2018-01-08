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
 * Tree game objects
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 20/09/2017
 */
Friend = window.Friend || {};
Friend.Game = Friend.Game || {};
Friend.Flags = Friend.Flags || {};

/**
 * Sprite
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
Friend.Game.Sprite = function( tree, name, flags )
{
    this.image = false;
    Friend.Tree.Items.init( this, tree, name, 'Friend.Game.Sprite', flags );
	Object.assign( this, Friend.Game.Sprite );

	this.rendererType = 'Sprite';
	if ( !this.setImage() )
	{
		Friend.Tree.log( this,
		{
			level: Friend.Flags.ERRORLEVEL_HIGH,
			error: 'image does not exist',
			infos: [ this.image ]
		} );
	}
};
Friend.Game.Sprite.renderUp = function( flags )
{
	return flags;
};
Friend.Game.Sprite.renderDown = function( flags )
{
    return flags;
};
Friend.Game.Sprite.processUp = function( flags )
{
    return this.startProcess( flags, [ 'x', 'y', 'z', 'rotation', 'image' ] );
};
Friend.Game.Sprite.processDown = function( flags )
{
	var image = this.image;
    var flags = this.endProcess( flags, [ 'x', 'y', 'z', 'rotation', 'image' ] );
	if ( image != this.image )
	{
		if ( !this.setImage() )
		{
			this.tree.error( this,
			{
				level: Friend.Flags.ERRORLEVEL_HIGH,
				error: 'image does not exist',
				infos: [ this.image ]
			} );
			this.image = image;
		}
	}
	return flags;
};
Friend.Game.Sprite.setImage = function()
{
    var image = this.resources.getImage( this.image );
	if ( image )
	{
        this.width = image.width;
        this.height = image.height;
        this.hotSpotX = image.hotSpotX;
        this.hotSpotY = image.hotSpotY;
		return true;
    }
	return false;
};

/**
 * Sprite3D
 *
 * Moveable graphical object with Z slicing
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * The hotspot is set to the ones of the first image of each list
 * Flags
 * images: (string) list of images
 *         [
 *             { name: 'image_base_name', end: last_image_number },
 *             { name: 'image_base_name2', end: last_image_number2 },
 *             ...
 *         ]
 * image: (string) name of the first image to display. First image-list used if not defined
 * perspective: (number) item-intermal perspective
 * xCenter: (number) item-internal center of perspective X (default = tree X center)
 * yCenter: (number) item-internal center of perspective Y (default = tree Y center)
 */
Friend.Game.Sprite3D = function( tree, name, flags )
{
    this.end = false;
    this.image = false;
	this.rendererType = 'Sprite3D';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Game.Sprite3D', flags );
	Object.assign( this, Friend.Game.Sprite3D );

    this.setImage( this.image );
};
Friend.Game.Sprite3D.renderUp = function( flags )
{
    return flags;
};
Friend.Game.Sprite3D.renderDown = function( flags )
{
    return flags;
};
Friend.Game.Sprite3D.processUp = function( flags )
{
    return this.startProcess( flags, [ 'x', 'y', 'z', 'rotation', 'image' ] );
};
Friend.Game.Sprite3D.processDown = function( flags )
{
    var image = this.image;
    flags = this.endProcess( flags, [ 'x', 'y', 'z', 'rotation', 'image' ] );
	if ( image != this.image )
	{
		if ( !this.setImage() )
		{
			Friend.Tree.log( this,
			{
				level: Friend.Flags.ERRORLEVEL_HIGH,
				error: 'image does not exist',
				infos: [ this.image ]
			} );
			this.image = image;
		}
	}
	return flags;
};
Friend.Game.Sprite3D.setImage = function()
{
	var comboImage = this.resources.getImage( this.image );
    if ( comboImage )
	{
        this.hotSpotX = comboImage.hotSpotX;
        this.hotSpotY = comboImage.hotSpotY;
        this.width = comboImage.width;
        this.height = comboImage.height;
		return true;
    }
	return false;
};

/**
 * Map object
 *
 * A game map made off tiles
 *
 * @param tree (object) the tree object
 * @param mapList (string) definition of the map
 * @param flags (number) various flags
 *
 * Flags
 * map: (object) the definition of the map
 * mapStepX: (number) horizontal size of each tile (will use the one of the first tile if not defined)
 * mapStepY: (number) vertical size of each tile (will use the one of the first tile if not defined)
 * lockX: (boolean) will limit the horizontal scrolling of the map to its borders if true
 * lockX: (boolean) will limit the vertical scrolling of the map to its borders if true
 * followItem: (string) the name of the object to center the map from
 * followItemDistanceX: (number) horizontal distance of top-left corner of map from followed object
 * followItemDistanceY: (number) vertical distance of top-left corner of map from followed object
 */
Friend.Game.Map = function( tree, name, flags )
{
    this.rotation = 0;
    this.map = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.followItem = false;
    this.followDistanceX = Friend.Flags.NOTINITIALIZED;
    this.followDistanceY = Friend.Flags.NOTINITIALIZED;
    this.lockX = false;
    this.lockY = false;
	this.tileWidth = 48;
	this.tileHeight = 48;
    this.zoom = 0.03;
    this.background = false;
	this.rendererType = 'Map';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Game.Map', flags );
    if ( this.followDistanceX == Friend.Flags.NOTINITIALIZED )
        this.followDistanceX = this.width / 2;
    if ( this.followDistanceY == Friend.Flags.NOTINITIALIZED )
        this.followDistanceY = this.height / 2;
	Object.assign( this, Friend.Game.Map );

	// Sets the tiles for the renderer
	this.tiles = this.map.tiles;

    // Converts the ascii map into a two dimension array
	var asciiMap = this.map.map;
	this.map = [];
	var line = [];
	this.mapWidth = 0;
    this.mapHeight = 0;
	var xx = 0, yy = 0;
    for ( var start = 0; start < asciiMap.length; start ++ )
    {
        if ( asciiMap.charAt( start ) == '<' )
        {
            var end = asciiMap.indexOf( '>', start + 1 );
            if ( end > start )
            {
                var temp = asciiMap.substring( start + 1, end );
                if ( temp == '  ' )
					line.push( -1 );
                else
                    line.push( parseInt( temp, 10 ) );
            }
            start = end;
            xx++;
            this.mapWidth = Math.max( this.mapWidth, xx );
        }
        else if ( asciiMap.charAt( start ) == '/' )
        {
			this.map.push( line );
			line = [];
            xx = 0;
			yy++;
            this.mapHeight = Math.max( this.mapHeight, yy );
        }
    }
};
Friend.Game.Map.getTile = function( x, y )
{
    if ( x >= 0 && y >= 0 && x < this.mapWidth && y < this.mapHeight )
        return this.map[ y ][ x ];
    return null;
};
Friend.Game.Map.renderUp = function( flags )
{
	flags.offsetX = -this.offsetX;
	flags.offsetY = -this.offsetY;
    return flags;
};
Friend.Game.Map.renderDown = function( flags )
{
    return flags;
};
Friend.Game.Map.processUp = function( flags )
{
    return this.startProcess( flags, [ 'x', 'y', 'z', 'offsetX', 'offsetY' ] );
};
Friend.Game.Map.processDown = function( flags )
{
	flags = this.endProcess( flags, [ 'x', 'y', 'z', 'offsetX', 'offsetY' ] );

	// The object we follow has been destroyed?
    if ( flags.command )
    {
        if ( flags.command == 'destroy' && flags.itemEvent == this.followItem )
            this.followItem = false;
    }
    else
    {
        // Updates the offsets based on the object to follow
        if ( this.followItem )
        {
            if ( typeof this.followItem == 'string' )
                this.followItem = this.tree.findItemFromName( this.followItem );
            if ( this.followItem )
            {
                var ret = false;
                try
                {
                    var x = this.followItem.x;
                    var y = this.followItem.y;
                    var deltaX = x - this.followDistanceX;
                    if ( this.lockX )
                    {
                        if ( deltaX < 0 )
                            deltaX = 0;
                        if ( deltaX + this.width > this.tileWidth * this.mapWidth )
                            deltaX = this.mapWidth * this.tileWidth - this.width;
                    }
                    if ( this.offsetX != deltaX )
                    {
                        ret = true;
                        this.offsetX = deltaX;
                    }
                    var deltaY = y - this.followDistanceY;
                    if ( this.lockY )
                    {
                        if ( deltaY < 0 )
                            deltaY = 0;
                        if ( deltaY + this.height > this.tileHeight * this.mapHeight )
                            deltaY = this.tileHeight * this.mapHeight - this.height;
                    }
                    if ( this.offsetY != deltaY )
                    {
                        ret = true;
                        this.offsetY = deltaY;
                    }
                }
                catch ( e )
                {
                }
                if ( ret )
                    this.doRefresh();
            }
        }
    }
	return flags;
};
Friend.Game.Map.checkCollisions = function( x, y, object, params )
{
	var xTopLeft, yTopLeft, xBottomRight, yBottomRight;
	//x += this.offsetX;
	//y += this.offsetY;
    if ( typeof params.zoneWidth == 'undefined' )
    {
        xTopLeft = x - object.hotSpotX;
        xBottomRight = xTopLeft + object.width;
    }
    else
    {
        xTopLeft = x - params.zoneWidth / 2;
        xBottomRight = xTopLeft + params.zoneWidth;
    }
    if ( typeof params.zoneHeight == 'undefined' )
    {
        yTopLeft = y - object.hotSpotY;
        yBottomRight = yTopLeft + object.height;
    }
    else
    {
        yTopLeft = y - params.zoneHeight / 2;
        yBottomRight = yTopLeft + params.zoneHeight;
    }

    var x1 = Math.floor( ( xTopLeft - this.x ) / this.tileWidth );
    var y1 = Math.floor( ( yTopLeft - this.y ) / this.tileHeight );
    var x2 = Math.floor( ( xBottomRight - this.x ) / this.tileWidth );
    var y2 = Math.floor( ( yBottomRight - this.y ) / this.tileHeight );

    var col = false;

    // Checks top left
    if ( x1 >= 0 && x1 < this.mapWidth && y1 >= 0 && y1 < this.mapHeight )
    {
        if ( params.tiles.indexOf( '<' + this.map[ y1 ][ x1 ] + '>') >= 0 )
            col = true;
    }

    // Checks to right
    if ( !col && x2 >= 0 && x2 < this.mapWidth && y1 >= 0 && y1 < this.mapHeight )
    {
		if ( params.tiles.indexOf( '<' + this.map[ y1 ][ x2 ] + '>' ) >= 0 )
            col = true;
    }

    // Checks bottom left
    if ( !col && x1 >= 0 && x1 < this.mapWidth && y2 >= 0 && y2 < this.mapHeight )
    {
		if ( params.tiles.indexOf( '<' + this.map[ y2 ][ x1 ] + '>' ) >= 0 )
            col = true;
    }

    // Checks bottom right
    if ( !col && x2 >= 0 && x2 < this.mapWidth && y2 >= 0 && y2 < this.mapHeight )
    {
		if ( params.tiles.indexOf( '<' + this.map[ y2 ][ x2 ] + '>' ) >= 0 )
            col = true;
    }
	if ( col )
	{
		var result = {};
		result[ object.identifier ] = object;
		return result;
	}
	return null;
};

/**
 * moveOffsets
 *
 * Moves the offsets of the map by the given values
 *
 * @param (number) deltaX signed horizontal displacement
 * @param (number) deltaY signed vertical displacement
 */
Friend.Game.Map.moveOffsets = function( deltaX, deltaY )
{
    var offsetX = this.offsetX + deltaX;
    if ( this.lockX )
    {
        if ( offsetX < 0 )
            offsetX = 0;
        if ( offsetX + this.width > this.tileWidth * this.mapWidth )
            offsetX = this.tileWidth * this.mapWidth - this.width;
    }
    var offsetY = this.offsetY + deltaY;
    if ( this.lockY )
    {
        if ( offsetY < 0 )
            offsetY = 0;
        if ( offsetY + this.height > this.tileHeight * this.mapHeight )
            offsetY = this.tileHeight * this.mapHeight - this.height;
    }
    if ( offsetX != this.offsetX || offsetY != this.offsetY )
    {
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.doRefresh();
    }
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
* Fps indicator
*
* Displays the current frame per second rate, and a chart of the last frame speed
*
* @param tree (object) The Tree engine
* @param name (string) The name of the object
* @param flags (object) Creation flags
*
* Flags
*
* font: (string) the font to use (default = theme)'
* text: (string) string to display before the fps (default = 'FPS:')
* minFps: (number) lowest frame rate to trigger 'bad frames' detection (red)
* numberOfBars: (number) resolution of the moving chart (default = one bar per pixel)
* color: (string) color of the text
* barColor: (color) color of each bar when fps is correct (default = white)
* barColorLow: (color) color of each bar when fps is low (default = red)
*/
Friend.Game.Fps = function( tree, name, flags )
{
    this.colorBackground = '#808080';
    this.color = '#000000';
	this.colorBar = '#FFFFFF';
    this.colorBarLow = '#FF0000';
	this.colorBarBackground = '#808080';
	this.colorAlert = '#FF0000';
    this.font = '#15px Arial';
    this.text = 'FPS: ';
    this.minFps = 48;
    this.numberOfBars = flags.width;
	this.rendererType = 'Canvas';
	this.fpsMax = 60;
    Friend.Tree.Items.init( this, tree, name, 'Friend.Game.Fps', flags );
	Object.assign( this, Friend.Game.Fps );

	this.backColor = this.colorBackground;
    this.title = this.text;
    this.text = this.title + this.tree.fps;
    this.count = 0;
    this.fpsLower = this.tree.fps;
    this.fpsLowerCount = 0;
    this.fpsAverage = [];
	this.barColors = [];
	this.barPositions = [];
	this.barWidth = this.width / this.numberOfBars;
    for ( var b = 0; b < this.numberOfBars; b ++ )
    {
		this.barColors[ b ] = this.barColorBackground;
		this.barPositions[ b ] = 0;
    }
};
Friend.Game.Fps.renderUp = function( flags )
{
    // Clear background
    if ( this.backColor )
		this.thisRect.drawBox( flags, this.backColor );

    // Main FPS display
    flags.context.drawText( flags, this.thisRect.width / 2, this.thisRect.height / 4, this.text + ' (' + this.fpsLowerCount + ')', this.font, this.color );

	// Draw the bar
	var rect = new Friend.Utilities.Rect();
	for ( var f = 0; f < this.numberOfBars; f ++ )
	{
		rect.x = f * this.barWidth;
		rect.y = this.height / 2;
		rect.width = this.barWidth;
		rect.height = this.height / 2;
		rect.drawBox( flags, this.colorBarBackground );

		rect.y = rect.y + rect.height - ( this.barPositions[ f ] / this.fpsMax * rect.height );
		rect.height = this.barPositions[ f ] / this.fpsMax * rect.height;
		rect.drawBox( flags, this.barColors[ f ] );
	}

	return flags;
};
Friend.Game.Fps.renderDown = function( flags )
{
    return flags;
};
Friend.Game.Fps.processUp = function( flags )
{
	// Update main text
    this.text = this.title + this.tree.fps;

	// Extract average
    this.fpsAverage[ this.count ++ ] = this.tree.fps;
    if ( this.count > 50 )
    {
        this.count = 0;
        this.fpsLower = 1000;
        this.fpsLowerCount = 0;
        for ( var c = 0; c < this.fpsAverage.length; c ++ )
        {
            this.fpsLower = Math.min( this.fpsAverage[ c ], this.fpsLower );
            if ( this.fpsAverage[ c ] < this.minFps )
                this.fpsLowerCount ++;
        }
        if ( this.fpsLowerCount > 5 )
            this.backColor = this.colorAlert;
        else
            this.backColor = this.colorBackground;
    }

	// Scrolling area
	var rect = new Friend.Utilities.Rect();
    for ( var f = 0; f < this.numberOfBars; f ++ )
 	{
		if ( f < this.numberOfBars - 1 )
		{
			// Shift values to the left
			this.barPositions[ f ] = this.barPositions[ f + 1 ];
	        this.barColors[ f ] = this.barColors[ f + 1 ];
		}
		else
		{
			// Insert the new one at the end
		    this.barPositions[ f ] = this.tree.fps;
		    if ( this.tree.fps < this.minFps )
		        this.barColors[ f ] = this.colorBarLow;
		    else
		        this.barColors[ f ] = this.colorBar;
		}
    }
	this.doRefresh();
    return this.startProcess( flags, [ 'x', 'y', 'text', 'colorBarLow', 'colorBar', 'minFps' ] );
};

Friend.Game.Fps.processDown = function( flags )
{
    return this.endProcess( flags, [ 'x', 'y', 'z', 'text', 'colorBarLow', 'colorBar', 'minFps' ] );
}
