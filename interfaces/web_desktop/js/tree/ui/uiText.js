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
	if ( message.command == 'setSize' )
	{
		this.width = message.width;
		this.height = message.height;
	}
    return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'rotation', 'text', 'font', 'down', 'mouseOver', 'caller', 'onClick', 'onDoubleClick'] );
};
Friend.Tree.UI.Text.messageDown = function( message )
{
    this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'rotation', 'text', 'mouseOver', 'down', 'font' ] );
};
Friend.Tree.UI.Text.setValue = function( text )
{
    this.text = text;
    this.doRefresh();
};
Friend.Tree.UI.Text.getValue = function()
{
    return this.text;
};

// Default RenderItem
Friend.Tree.UI.RenderItems.Text_Three2D = function( tree, name, flags )
{
	this.color = '#000000';
    this.colorMouseOver = Friend.Tree.NOTINITIALIZED;
    this.colorDown = Friend.Tree.NOTINITIALIZED;
    this.backColor = Friend.Tree.NOTINITIALIZED;
    this.backColorMouseOver = Friend.Tree.NOTINITIALIZED;
    this.backColorDown = Friend.Tree.NOTINITIALIZED;
    this.clickHilight = '#202020';
    this.font = '#12px Arial';
    this.text = 'My text';
    this.caller = false;
    this.onClick = false;
	this.rendererName = 'Renderer_Three2D';
	this.rendererType = 'Canvas';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Text_Three2D', flags );

	// Add default Gesture process
    if ( this.caller && this.onClick )
    	this.parent.addProcess( new Friend.Tree.UI.GestureButton( this.tree, this.parent, properties ) );
    this.setFont();
};
Friend.Tree.UI.RenderItems.Text_Three2D.render = function( properties )
{
	this.setFont( this.parent.font );
    if ( this.backColor != Friend.Tree.NOTINITIALIZED )
    {
        var backColor = this.backColor;
        if ( this.parent.mouseOver && this.backColorMouseOver != Friend.Tree.NOTINITIALIZED )
            backColor = this.backColorMouseOver;
        if ( ( this.parent.down || this.parent.activated ) && this.backColorDown != Friend.Tree.NOTINITIALIZED )
            backColor = this.backColorDown;
        this.thisRect.fillRectangle( properties, backColor );
    }
    var textColor = this.color;
    if ( this.parent.mouseOver && this.colorMouseOver != Friend.Tree.NOTINITIALIZED )
        textColor = this.colorMouseOver;
    if ( ( this.parent.down || this.parent.activated ) && this.colorDown != Friend.Tree.NOTINITIALIZED )
        textColor = this.colorDown;
    this.thisRect.drawText( properties, this.parent.text, this.font, textColor, this.parent.hAlign, this.parent.vAlign );
	return properties;
};
Friend.Tree.UI.RenderItems.Text_Three2D.setFont = function( font )
{    
    // Get width and height of text
	if ( font != this.font )
	{
		this.font = font;
		var sizes = this.renderer.measureText( this.text, this.font );
		if ( !this.forceSize )
		{
			this.width = sizes.width;
			this.height = sizes.height;
			this.tree.sendMessageToItem( this.parent.root, this.parent, 
			{
				command: 'setSize',
				type: 'renderItemToItem',
				width: this.width,
				height: this.height
			});
		}
	}
};




Friend.Tree.UI.RenderItems.Text_HTML = function( tree, name, flags )
{
	this.color = '#000000';
    this.colorMouseOver = Friend.Tree.NOTINITIALIZED;
    this.colorDown = Friend.Tree.NOTINITIALIZED;
    this.backColor = Friend.Tree.NOTINITIALIZED;
    this.backColorMouseOver = Friend.Tree.NOTINITIALIZED;
    this.backColorDown = Friend.Tree.NOTINITIALIZED;
    this.clickHilight = '#202020';
    this.font = '#12px Arial';
    this.text = 'My text';
    this.caller = false;
    this.onClick = false;
	this.rendererName = 'Renderer_HTML';
	this.rendererType = 'Canvas';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Text_HTML', flags );

	// Add default Gesture process
    if ( this.caller && this.onClick )
    	this.parent.addProcess( new Friend.Tree.UI.GestureButton( this.tree, this.parent, properties ) );
    this.setFont();
};
Friend.Tree.UI.RenderItems.Text_HTML.render = Friend.Tree.UI.RenderItems.Text_Three2D.render;
Friend.Tree.UI.RenderItems.Text_HTML.setFont = Friend.Tree.UI.RenderItems.Text_Three2D.setFont;


Friend.Tree.UI.RenderItems.Text_Canvas2D = function( tree, name, flags )
{
	this.color = '#000000';
    this.colorMouseOver = Friend.Tree.NOTINITIALIZED;
    this.colorDown = Friend.Tree.NOTINITIALIZED;
    this.backColor = Friend.Tree.NOTINITIALIZED;
    this.backColorMouseOver = Friend.Tree.NOTINITIALIZED;
    this.backColorDown = Friend.Tree.NOTINITIALIZED;
    this.clickHilight = '#202020';
    this.font = '#12px Arial';
    this.text = 'My text';
    this.caller = false;
    this.onClick = false;
	this.rendererName = 'Renderer_Canvas2D';
	this.rendererType = 'Canvas';
    Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Text_Canvas2D', flags );

	// Add default Gesture process
    if ( this.caller && this.onClick )
	    this.parent.addProcess( new Friend.Tree.UI.GestureButton( this.tree, this.parent, properties ) );
    this.setFont();
};
Friend.Tree.UI.RenderItems.Text_Canvas2D.render = Friend.Tree.UI.RenderItems.Text_Three2D.render;
Friend.Tree.UI.RenderItems.Text_Canvas2D.setFont = Friend.Tree.UI.RenderItems.Text_Three2D.setFont;
