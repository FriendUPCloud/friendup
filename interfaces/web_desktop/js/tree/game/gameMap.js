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
 * Tree engine game items
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.Game = Friend.Tree.Game || {};
Friend.Tree.Game.RenderItems = Friend.Tree.Game.RenderItems || {};

Friend.Tree.Game.Map = function( tree, name, flags )
{
    this.offsetX = 0;
    this.offsetY = 0;
    this.followItem = false;
    this.followDistanceX = Friend.Tree.NOTINITIALIZED;
    this.followDistanceY = Friend.Tree.NOTINITIALIZED;
    this.lockX = false;
    this.lockY = false;
    this.tileWidth = 48;
	this.tileHeight = 48;
	this.renderItemName = 'Friend.Tree.Game.RenderItems.Map';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Game.Map', flags );
	this.registerEvents( [ 'refresh', 'controller' ] );
    if ( this.followDistanceX == Friend.Tree.NOTINITIALIZED )
        this.followDistanceX = this.width / 2;
    if ( this.followDistanceY == Friend.Tree.NOTINITIALIZED )
        this.followDistanceY = this.height / 2;
};
Friend.Tree.Game.Map.getTile = function( x, y )
{
    if ( x >= 0 && y >= 0 && x < this.mapWidth && y < this.mapHeight )
        return this.callRenderItem( 'getTile', [ x ,y ] );
    return null;
};
Friend.Tree.Game.Map.messageUp = function( message )
{
    if ( message.command == 'setSize' )
    {
        this.mapWidth = message.width;
        this.mapHeight = message.height;
    }
    return this.startProcess( message, [ 'x', 'y', 'z', 'offsetX', 'offsetY' ] );
};
Friend.Tree.Game.Map.messageDown = function( message )
{
	this.endProcess( message, [ 'x', 'y', 'z', 'offsetX', 'offsetY' ] );

	// The object we follow has been destroyed?
    if ( message.command == 'destroy' && message.itemEvent == this.followItem )
    {
        this.followItem = false;
    }
    else if ( message.command == 'refresh' )
    {
        // Updates the offsets based on the object to follow
        if ( this.followItem )
        {
            if ( typeof this.followItem == 'string' )
                this.followItem = this.findItemFromName( this.followItem, this );
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
                        {
                            deltaX = this.mapWidth * this.tileWidth - this.width;
                        }
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
	return message;
};
Friend.Tree.Game.Map.checkCollisions = function( x, y, object, params )
{
    return this.callRenderItem( 'checkCollisions', [ x, y, object, params ] );
};
Friend.Tree.Game.Map.moveOffsets = function( deltaX, deltaY )
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
};

Friend.Tree.Game.RenderItems.Map_Three2D = function( tree, name, properties )
{
	this.tileWidth = 48;
	this.tileHeight = 48;
    this.zoom = 0.03;
    this.background = false;
    this.map = false;
    this.perspective = 0;
    this.xCenter = 0;
    this.yCenter = 0;
	this.rendererName = 'Renderer_Three2D';
    this.rendererType = 'Map';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.Game.RenderItems.Map_Three2D', properties );

    this.prepareMap( properties );
};
Friend.Tree.Game.RenderItems.Map_Three2D.prepareMap = function( properties )
{
	// Sets the tiles for the render item
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

    // Set item width and height
    this.tree.sendMessageToItem( this.item.root, this.item, 
    {
        command: 'setSize',
        type: 'renderItemToItem',
        width: this.mapWidth,
        height: this.mapHeight
    });                   
};
Friend.Tree.Game.RenderItems.Map_Three2D.render = function( properties )
{
	this.offsetX = this.item.offsetX;
	this.offsetY = this.item.offsetY;
    properties.offsetX = -this.item.offsetX;
    properties.offsetY = -this.item.offsetY;
    properties.xCenter = this.xCenter;
    properties.yCenter = this.yCenter;
    properties.perspective = this.perspective;
    return properties;
};
Friend.Tree.Game.RenderItems.Map_Three2D.getTile = function( x, y )
{
    return this.map[ y ][ x ];
};
Friend.Tree.Game.RenderItems.Map_Three2D.checkCollisions = function( x, y, object, params )
{
	var xTopLeft, yTopLeft, xBottomRight, yBottomRight;

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


Friend.Tree.Game.RenderItems.Map_HTML = function( tree, name, properties )
{
	this.tileWidth = 48;
	this.tileHeight = 48;
    this.zoom = 0.03;
    this.background = false;
    this.map = false;
    this.perspective = 0;
    this.xCenter = 0;
    this.yCenter = 0;
	this.rendererName = 'Renderer_HTML';
    this.rendererType = 'Map';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.Game.RenderItems.Map_HTML', properties );

    Friend.Tree.Game.RenderItems.Map_Three2D.prepareMap.apply( this, [ properties ] );
};
Friend.Tree.Game.RenderItems.Map_HTML.getTile = Friend.Tree.Game.RenderItems.Map_Three2D.getTile;
Friend.Tree.Game.RenderItems.Map_HTML.checkCollisions = Friend.Tree.Game.RenderItems.Map_Three2D.checkCollisions;
Friend.Tree.Game.RenderItems.Map_HTML.render = Friend.Tree.Game.RenderItems.Map_Three2D.render;


Friend.Tree.Game.RenderItems.Map_Canvas2D = function( tree, name, properties )
{
	this.tileWidth = 48;
	this.tileHeight = 48;
    this.zoom = 0.03;
    this.background = false;
    this.map = false;
    this.perspective = 0;
    this.xCenter = 0;
    this.yCenter = 0;
	this.rendererName = 'Renderer_Canvas2D';
    this.rendererType = 'Map';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.Game.RenderItems.Map_Canvas2D', properties );

    Friend.Tree.Game.RenderItems.Map_Three2D.prepareMap.apply( this, [ properties ] );
};
Friend.Tree.Game.RenderItems.Map_Canvas2D.getTile = Friend.Tree.Game.RenderItems.Map_Three2D.getTile;
Friend.Tree.Game.RenderItems.Map_Canvas2D.checkCollisions = Friend.Tree.Game.RenderItems.Map_Three2D.checkCollisions;
Friend.Tree.Game.RenderItems.Map_Canvas2D.render = Friend.Tree.Game.RenderItems.Map_Three2D.render;
