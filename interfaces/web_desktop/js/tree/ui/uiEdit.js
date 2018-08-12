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
	this.value = false;
	this.border = false;
	this.placeholder = false;
	this.onClick = false;
	this.onChange = false;
	this.onClose = false;
	this.closeOnClick = false;
	this.caller = false;
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
	return this.value;
};
Friend.Tree.UI.Edit.setValue = function( value )
{
	this.updateProperty( 'value', value );
	this.doRefresh();
};


Friend.Tree.UI.RenderItems.Edit_HTML = function ( tree, name, properties )
{
	this.value = false;
	this.placeholder = false;
	this.maxLength = false;
	this.border = false;

	this.rendererName = 'Renderer_HTML';
	this.rendererType = 'Element';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Edit_HTML', properties );
	this.initialize( properties );
};
Friend.Tree.UI.RenderItems.Edit_HTML.initialize = function ()
{
    this.element = document.createElement( 'TEXTAREA' );
	this.element.type = 'text';
	this.element.resize = 'none';
	this.element.whiteSpace = 'nowrap';
	this.element.overflowX = 'scroll';
	this.element.tabIndex = tree.tabIndex++;
	this.element.contentEditable = 'true';
	this.element.defaultValue = this.value;
	this.element.placeholder = this.item.placeholder;
	this.element.maxLength = this.item.maxLength;
    this.element.style.border = this.item.border;
	this.element.style.position = 'absolute';

    var self = this;
    this.element.onkeyup = function()
    {
        if ( this.type == 'number' )
			this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
		self.item.updateProperty( 'value', this.value, self );
        if ( self.item.caller && self.item.onChange )
            self.item.caller[ self.item.onChange ].apply( self.item.caller, [ this.value ] );
    };
    this.element.onkeydown = function( event )
    {
        if ( event.which == 13 )
        {
            if ( self.item.caller && self.item.onReturn )
                self.caller[ self.item.onReturn ].apply( self.item.caller, [ this.value ] );
        }
    };
    this.element.onclick = function()
	{
		if ( self.caller && self.onClick )
			self.onClick.apply( self.caller, [ this ] );
	};

	this.width = 200;
	this.height = 32;
	this.item.width = this.width;
	this.item.height = this.height;
};
Friend.Tree.UI.RenderItems.Edit_HTML.render = function ( properties )
{
	return properties;
};
Friend.Tree.UI.RenderItems.Edit_HTML.message = function ( message )
{
	if ( message.command == 'value_changed' )
	{
		this.element.value = this.value;
	}
	return false;
};
Friend.Tree.UI.RenderItems.Edit_HTML.onDestroy = function ( flags )
{
	document.body.removeChild( this.element );
};


Friend.Tree.UI.RenderItems.Edit_Canvas2D = function ( tree, name, properties )
{
	this.rendererName = 'Renderer_HTML';
	this.rendererType = 'Element';
	this.value = false;
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.Edit_Canvas2D', properties );
	this.initialize( properties );
};
Friend.Tree.UI.RenderItems.Edit_Canvas2D.render = Friend.Tree.UI.RenderItems.Edit_HTML.render;
Friend.Tree.UI.RenderItems.Edit_Canvas2D.message = Friend.Tree.UI.RenderItems.Edit_HTML.message;
Friend.Tree.UI.RenderItems.Edit_Canvas2D.onDestroy = Friend.Tree.UI.RenderItems.Edit_HTML.onDestroy;


