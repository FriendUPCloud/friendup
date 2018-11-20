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
 * Tree engine debiugging items
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.Debug = Friend.Tree.Debug || {};


Friend.Tree.Debug.Fps = function( tree, name, flags )
{
	this.fpsMax = 60;
    this.fpsLower = 50;
    this.fpsLowerCount = 0;
    this.fpsAverage = [];
	this.barPositions = [];
    this.numberOfBars = flags.width;
    this.minFps = 45;
	this.maxFps = 60;
    this.renderItemName = 'Friend.Tree.Debug.RenderItems.Fps';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Debug.Fps', flags );
	this.registerEvents( 'refresh' );
};
Friend.Tree.Debug.Fps.messageUp = function( message )
{
    return this.startProcess( message, [ 'x', 'y', 'text', 'colorBarLow', 'colorBar', 'minFps' ] );
};

Friend.Tree.Debug.Fps.messageDown = function( message )
{
    if ( message.command == 'refresh' )
    {
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
                    this.fpsLowerCount++;
            }
        }

        // Scrolling area
        var rect = new Friend.Tree.Utilities.Rect();
        for ( var f = 0; f < this.numberOfBars; f ++ )
        {
            if ( f < this.numberOfBars - 1 )
            {
                // Shift values to the left
                this.barPositions[ f ] = this.barPositions[ f + 1 ];
            }
            else
            {
                // Insert the new one at the end
                this.barPositions[ f ] = this.tree.fps;
            }
        }        
        this.doRefresh();
    }
    return this.endProcess( message, [ 'x', 'y', 'z', 'text', 'colorBarLow', 'colorBar', 'minFps' ] );
}

Friend.Tree.Debug.RenderItems.Fps_Three2D = function( tree, name, properties )
{
    this.colorBackground = '#808080';
    this.color = '#000000';
	this.colorBar = '#FFFFFF';
    this.colorBarLow = '#FF0000';
	this.colorBarBackground = '#808080';
	this.colorAlert = '#FF0000';
    this.font = '#15px Arial';
    this.text = 'FPS: ';
    this.numberOfBars = properties.width;
	this.rendererType = 'Canvas';
    this.rendererName = 'Renderer_Three2D';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.Debug.RenderItems.Fps_Three2D', properties );

	this.backColor = this.colorBackground;
    this.title = this.text;
    this.count = 0;
	this.barWidth = this.width / this.numberOfBars;
};
Friend.Tree.Debug.RenderItems.Fps_Three2D.render = function( properties )
{
    // Update main text
    this.text = this.title + this.tree.fps;

    // Clear background
    if ( this.parent.fpsLowerCount > 5 )
        this.backColor = this.colorAlert;
    else
        this.backColor = this.colorBackground;
    if ( this.backColor )
        this.thisRect.drawBox( properties, this.backColor );

    // Main FPS display
    properties.context.drawText( properties, this.thisRect.width / 2, this.thisRect.height / 4, this.text + ' (' + this.parent.fpsLowerCount + ')', this.font, this.color );

    // Draw the bars
    var rect = new Friend.Tree.Utilities.Rect();
    rect.x = 0;
    rect.y = this.height / 2;
    rect.width = this.width;
    rect.height = this.height / 2;
    rect.drawBox( properties, '#0000FF' ); //this.colorBarBackground );   
    for ( var f = 0; f < this.numberOfBars; f++ )
    {
        rect.x = f * this.barWidth;        
        rect.y = this.height / 2 + ( this.height / 2 - ( this.parent.barPositions[ f ] / this.parent.maxFps * ( this.height / 2 ) ) );
        rect.width = this.barWidth;
        rect.height = this.height - rect.y;
        if ( this.parent.barPositions[ f ] >= this.parent.minFps )
            color = this.colorBar;
        else
            color = this.colorBarLow;
        rect.drawBox( properties, color );
    }
	return properties;
};


Friend.Tree.Debug.RenderItems.Fps_HTML = function( tree, name, properties )
{
    this.colorBackground = '#808080';
    this.color = '#000000';
	this.colorBar = '#FFFFFF';
    this.colorBarLow = '#FF0000';
	this.colorBarBackground = '#808080';
	this.colorAlert = '#FF0000';
    this.font = '#15px Arial';
    this.text = 'FPS: ';
    this.numberOfBars = properties.width;
	this.rendererType = 'Canvas';
    this.rendererName = 'Renderer_HTML';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.Debug.RenderItems.Fps_HTML', properties );
    this.render = Friend.Tree.Debug.RenderItems.Fps_Three2D.render

	this.backColor = this.colorBackground;
    this.title = this.text;
    this.count = 0;
	this.barWidth = this.width / this.numberOfBars;
};
Friend.Tree.Debug.RenderItems.Fps_HTML.render = Friend.Tree.Debug.RenderItems.Fps_Three2D.render;


Friend.Tree.Debug.RenderItems.Fps_Canvas2D = function( tree, name, properties )
{
    this.colorBackground = '#808080';
    this.color = '#000000';
	this.colorBar = '#FFFFFF';
    this.colorBarLow = '#FF0000';
	this.colorBarBackground = '#808080';
	this.colorAlert = '#FF0000';
    this.font = '#15px Arial';
    this.text = 'FPS: ';
    this.numberOfBars = properties.width;
	this.rendererType = 'Canvas';
    this.rendererName = 'Renderer_Canvas2D';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.Debug.RenderItems.Fps_Canvas2D', properties );

	this.backColor = this.colorBackground;
    this.title = this.text;
    this.count = 0;
	this.barWidth = this.width / this.numberOfBars;
};
Friend.Tree.Debug.RenderItems.Fps_Canvas2D.render = Friend.Tree.Debug.RenderItems.Fps_Three2D.render;