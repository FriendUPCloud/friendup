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
 * Tree engine interface elements
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.UI = Friend.Tree.UI || {};
Friend.Tree.UI.RenderItems = Friend.Tree.UI.RenderItems || {};

Friend.Tree.UI.Text = function( tree, name, properties )
{
	this.hAlign = 'center';
    this.vAlign = 'middle';
	this.color = '#000000';
    this.colorMouseOver = 'none';
    this.colorDown = 'none';
    this.colorBack = 'none';
    this.colorBackMouseOver = 'none';
    this.colorBackDown = 'none';
    this.font = '12px sans serif';
    this.text = 'My text';

	this.text = 'Text';
    this.forceWidth = false;
    this.forceHeight = false;
    this.value = false;
    this.caller = false;
    this.onClick = false;
	this.onDoubleClick = false;
	
	this.renderItemName = 'Friend.Tree.UI.RenderItems.Text';
    Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.Text', properties );
    this.mouseOver = false;
    this.down = false;
};
Friend.Tree.UI.Text.messageUp = function( message )
{
    return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'rotation', 'text', 'font', 'down', 'mouseOver', 'caller', 'onClick', 'onDoubleClick'] );
};
Friend.Tree.UI.Text.messageDown = function( message )
{
    this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'rotation', 'text', 'mouseOver', 'down', 'font' ] );
};
Friend.Tree.UI.Text.setValue = function( text )
{
	this.updateProperty( 'text', text );
    this.doRefresh();
};
Friend.Tree.UI.Text.getValue = function()
{
    return this.text;
};




Friend.Tree.UI.RenderItems.Text_HTML = function( tree, name, flags )
{
    this.hAlign = false;
    this.vAlign = false;
	this.color = false;
    this.colorMouseOver = false;
    this.colorDown = false;
    this.colorBack = false;
    this.colorBackMouseOver = false;
    this.colorBackDown = false;
    this.font = false;
    this.text = false;

	this.rendererName = 'Renderer_HTML';
	this.rendererType = 'Canvas';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Text_HTML', flags );

	// Add default Gesture process
    if ( this.item.caller && ( this.item.onClick || this.item.onDoubleClick ) )
    	this.item.addProcess( new Friend.Tree.UI.GestureButton( this.tree, this.item, properties ) );
    this.setFont();
};
Friend.Tree.UI.RenderItems.Text_HTML.render = function( properties )
{
    if ( this.item.colorBack != 'none' )
    {
        var colorBack = this.item.colorBack;
        if ( this.item.mouseOver && this.item.colorBackMouseOver != 'none' )
            colorBack = this.item.colorBackMouseOver;
        if ( ( this.item.down || this.item.activated ) && this.item.colorBackDown != 'none' )
            colorBack = this.item.backColorDown;
        this.thisRect.fillRectangle( properties, colorBack );
	}
	
    var textColor = this.item.color;
    if ( this.item.mouseOver && this.item.colorMouseOver != 'none' )
        textColor = this.item.colorMouseOver;
    if ( ( this.item.down || this.item.activated ) && this.item.colorDown != 'none' )
        textColor = this.item.colorDown;
    this.thisRect.drawText( properties, this.item.text, this.item.font, textColor, this.item.hAlign, this.item.vAlign );
	return properties;
};


Friend.Tree.UI.RenderItems.Text_Canvas2D = function( tree, name, flags )
{
    this.hAlign = false;
    this.vAlign = false;
	this.color = false;
    this.colorMouseOver = false;
    this.colorDown = false;
    this.colorBack = false;
    this.colorBackMouseOver = false;
    this.colorBackDown = false;
    this.font = false;
    this.text = false;

	this.rendererName = 'Renderer_Canvas2D';
	this.rendererType = 'Canvas';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Text_Canvas2D', flags );

	// Add default Gesture process
    if ( this.item.caller && this.item.onClick )
	    this.item.addProcess( new Friend.Tree.UI.GestureButton( this.tree, this.item, properties ) );
};
Friend.Tree.UI.RenderItems.Text_Canvas2D.render = Friend.Tree.UI.RenderItems.Text_Three2D.render;
