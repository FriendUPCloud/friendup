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

Friend.Tree.UI.Button = function ( tree, name, flags )
{
	this.text = false;
	this.font = '12px Arial';
	this.caller = false;
	this.onClick = false;
	this.renderItemName = 'Friend.Tree.UI.RenderItems.Button';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.Button', flags );
	this.down = false;
	this.mouseOver = false;
};
Friend.Tree.UI.Button.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'text', 'font', 'down', 'mouseOver', 'caller', 'onClick' ] );
};
Friend.Tree.UI.Button.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'text', 'font', 'down', 'mouseOver' ] );
};

Friend.Tree.UI.RenderItems.Button_HTML = function ( tree, name, flags )
{
	this.caller = false;
	this.onClick = false;
	this.rendererName = 'Renderer_HTML';
	this.rendererType = 'Element';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Button_HTML', flags );

	this.element = document.createElement( 'button' );
	this.element.tabIndex = tree.tabIndex++;
	this.element.type = 'button';
	this.element.innerHTML = this.parent.text;
	this.element.style.position = 'absolute';
	this.element.style.zIndex = this.z;

	var self = this;
	this.element.onclick = function()
	{
		if ( self.caller && self.onClick )
			self.onClick.apply( self.caller, [ this ] );
	};
};
Friend.Tree.UI.RenderItems.Button_HTML.render = function ( properties )
{
	return properties;
};

Friend.Tree.UI.RenderItems.Button_Three2D = function ( tree, name, properties )
{
	this.textColor = '#000000';
	this.backColor = '#808080';
	this.downColor = '#C0C0C0';
	this.mouseOverColor = '#A0A0A0';
	this.brightColor = '#C0C0C0';
	this.darkColor = '#404040';
	this.font = '16px Arial';
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Three2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Button_Three2D', properties );
	
	// Set the parent for handling mouse messages
	this.parent.registerEvents( 'mouse' );
	this.parent.addProcess( new Friend.Tree.UI.GestureButton( this.tree, this.parent, properties ) );
};
Friend.Tree.UI.RenderItems.Button_Three2D.render = function ( properties )
{
	var color = this.backColor;
	var xxText = this.width / 2;
	var yyText = this.height / 2;
	if ( this.parent.down )
	{
		color = this.downColor;
		xxText += 2;
		yyText += 2;
	}
	else if ( this.parent.mouseOver )
		color = this.mouseOverColor;

	this.thisRect.drawHilightedBox( properties, color, this.brightColor, this.darkColor );
	this.thisRect.drawText( properties, this.parent.text, this.font, this.textColor );

	return properties;
};

Friend.Tree.UI.RenderItems.Button_Canvas2D = function ( tree, name, properties )
{
	this.textColor = '#000000';
	this.backColor = '#808080';
	this.downColor = '#C0C0C0';
	this.mouseOverColor = '#A0A0A0';
	this.brightColor = '#C0C0C0';
	this.darkColor = '#404040';
	this.font = '16px Arial';
	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_Canvas2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Button_Canvas2D', properties );
	
	// Set the parent for handling mouse messages
	this.parent.registerEvents( 'mouse' );
	this.parent.addProcess( new Friend.Tree.UI.GestureButton( this.tree, this.parent, properties ) );
};
Friend.Tree.UI.RenderItems.Button_Canvas2D.render = Friend.Tree.UI.RenderItems.Button_Three2D.render;
