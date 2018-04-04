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
 * Tree interface elements
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 20/09/2017
 */
Friend = window.Friend || {};
Friend.UI = Friend.UI || {};


Friend.Tree.UI.Edit = function ( tree, name, flags )
{
	this.text = false;
	this.caller = false;
	this.onClose = false;
	this.closeOnClick = false;
	this.renderItemName = 'Friend.Tree.UI.RenderItems.Edit';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.Edit', flags );
    this.registerEvents( 'mouse' );
};
Friend.Tree.UI.Edit.messageUp = function ( message )
{
	if ( this.closeOnClick )
	{
		if ( this.mouse.isKeyDown( Friend.Tree.Mouse.LEFTKEY ) )
		{
            if ( !this.inside )
            {
				this.destroy();
				if ( this.caller && this.onClose )
					this.onClose.apply( this.caller, [ this ] );
			}
		}
	}
	return this.startProcess( message, [ 'x', 'y', 'z' ] );
};
Friend.Tree.UI.Edit.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z' ] );
};
Friend.Tree.UI.Edit.getValue = function()
{
	return this.callRenderItem( 'getValue', [] );
};
Friend.Tree.UI.Edit.setValue = function( value )
{
	this.callRenderItem( 'setValue', [ value ] );
};


Friend.Tree.UI.RenderItems.Edit_HTML = function ( tree, name, flags )
{
	this.caller = false;
	this.onClick = false;
	this.onChange = false;
    this.onReturn = false;
	this.rendererName = 'Renderer_HTML';
	this.rendererType = 'Element';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Edit_HTML', flags );

    this.element = document.createElement( 'TEXTAREA' );
	this.element.type = 'text';
	this.element.resize = 'none';
	this.element.whiteSpace = 'nowrap';
	this.element.overflowX = 'scroll';
	this.element.tabIndex = tree.tabIndex++;
	this.element.contentEditable = 'true';
	this.element.defaultValue = this.parent.text;
	this.element.maxLength = this.parent.maxLength;
    this.element.style.border = this.border;
	this.element.style.position = 'absolute';

    var self = this;
    this.element.onkeyup = function()
    {
        var pos = this.value.indexOf( '\n' )
        if ( this.type == 'number' )
            this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
        if ( self.caller && self.onChange )
            self.caller[ self.onChange ].apply( self.caller, [ this.value ] );
    };
    this.element.onkeydown = function( event )
    {
        if ( event.which == 13 )
        {
            if ( self.caller && self.onReturn )
                self.caller[ self.onReturn ].apply( self.caller, [ this.value ] );
        }
    };
    this.element.onclick = function()
	{
		if ( self.caller && self.onClick )
			self.onClick.apply( self.caller, [ this ] );
	};
};
Friend.Tree.UI.RenderItems.Edit_HTML.render = function ( properties )
{
	return properties;
};
Friend.Tree.UI.RenderItems.Edit_HTML.getValue = function()
{
	return this.element.value;
};
Friend.Tree.UI.RenderItems.Edit_HTML.setValue = function( value )
{
	this.element.value = value;
};


Friend.Tree.UI.RenderItems.Edit_Three2D = function ( tree, name, properties )
{
	this.text = false;
	this.font = '12px Arial';
	this.caller = false;
	this.onClick = false;
	this.onChange = false;
	this.onReturn = false;
	this.numberOfLines = 1;
	this.disabled = false;
	this.readOnly = false;
    this.maxLength = 256;
    this.border = 'black';
	this.closeOnClick = false;
	this.rendererName = 'Renderer_Three2D';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Edit_Three2D', properties );
    this.initialize( properties );
}
Friend.Tree.UI.RenderItems.Edit_Three2D.initialize = function ( properties )
{
	if ( this.numberOfLines == 1 )
		this.height = this.renderer.getFontSize( this.font ) + 2;
	this.element = document.createElement( 'TEXTAREA' );
	this.element.type = 'text';
	this.element.resize = 'none';
	this.element.whiteSpace = 'nowrap';
	this.element.overflowX = 'scroll';
	this.element.tabIndex = this.tree.tabIndex++;
	this.element.contentEditable = 'true';
	this.element.defaultValue = this.parent.text;
	this.element.style.visibility = 'hidden';
	this.element.maxLength = this.parent.maxLength;
	this.element.style.position = 'absolute';
    var self = this;
    this.element.onkeyup = function()
    {
        var pos = this.value.indexOf( '\n' )
        if ( this.type == 'number' )
            this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
        if ( self.caller && self.onChange )
            self.caller[ self.onChange ].apply( self.caller, [ this.value ] );
    };
    this.element.onkeydown = function( event )
    {
        if ( event.which == 13 )
        {
            if ( self.caller && self.onReturn )
                self.caller[ self.onReturn ].apply( self.caller, [ this.value ] );
        }
    };
    this.element.onclick = function()
	{
		if ( self.caller && self.onClick )
			self.onClick.apply( self.caller, [ this ] );
	};
	document.body.appendChild( this.element );
};
Friend.Tree.UI.RenderItems.Edit_Three2D.render = function ( properties )
{
    this.element.style.left = this.rect.x + 'px';
    this.element.style.top = this.rect.y + 'px';
    this.element.style.width = this.width + 'px';
    this.element.style.height = this.height + 4 + 'px';
    this.element.style.border = this.border;
    this.element.style.zIndex = '999';
    this.element.style.opacity = properties.alpha.toString();
    if ( this.visible )
        this.element.style.visibility = 'visible';
    else
        this.element.style.visibility = 'hidden';
    return properties;
};
Friend.Tree.UI.RenderItems.Edit_Three2D.getValue = function()
{
	return this.element.value;
};
Friend.Tree.UI.RenderItems.Edit_Three2D.setValue = function( value )
{
	this.element.value = value;
};
Friend.Tree.UI.RenderItems.Edit_Three2D.onDestroy = function ( flags )
{
	document.body.removeChild( this.element );
};


Friend.Tree.UI.RenderItems.Edit_Canvas2D = function ( tree, name, properties )
{
    debugger;
	this.text = false;
	this.font = '12px Arial';
	this.caller = false;
	this.onClick = false;
	this.onChange = false;
	this.onReturn = false;
	this.numberOfLines = 1;
	this.disabled = false;
	this.readOnly = false;
	this.maxLength = 256;
	this.closeOnClick = false;
	this.rendererName = 'Renderer_Canvas2D';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Edit_Canvas2D', properties );
    this.initialize( properties );
}
Friend.Tree.UI.RenderItems.Edit_Canvas2D.render = Friend.Tree.UI.RenderItems.Edit_Three2D.render;
Friend.Tree.UI.RenderItems.Edit_Canvas2D.initialize = Friend.Tree.UI.RenderItems.Edit_Three2D.initialize;
Friend.Tree.UI.RenderItems.Edit_Canvas2D.getValue = Friend.Tree.UI.RenderItems.Edit_Three2D.getValue;
Friend.Tree.UI.RenderItems.Edit_Canvas2D.setValue = Friend.Tree.UI.RenderItems.Edit_Three2D.setValue;
Friend.Tree.UI.RenderItems.Edit_Canvas2D.onDesitroy = Friend.Tree.UI.RenderItems.Edit_Three2D.onDestroy;
