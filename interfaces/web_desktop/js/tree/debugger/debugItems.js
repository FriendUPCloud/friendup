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
 * Tree engine debiugging items
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 26/11/2017
 */
Friend = window.Friend || {};
Friend.Debug = Friend.Debug || {};

Friend.Debug.Debugger = function ( tree, name, flags )
{
    this.tree = tree;
    this.alphaIdle = 1;
    Friend.Tree.Items.init( this, tree, name, 'Friend.Debug.Debugger', flags );
	Object.assign( this, Friend.Debug.Debugger );
    this.x = 0;
    this.y = 0;
};
Friend.Debug.Debugger.processUp = function ( flags )
{
    // Debugger keys
    var refreshAll = false;
    if ( this.controller.isKeyPressed( 90, this.identifier ) )			// Display Z Map?
    {
        this.tree.renderer.setRenderZ( true );
        this.doRefresh( -1 );
    }
    if ( this.controller.isKeyRelease( 90, this.identifier ) )			// Erase Z Map?
    {
        this.renderer.setRenderZ( false );
        this.doRefresh( -1 );
    }
    if ( this.controller.isKeyPressed( 82, this.identifier ) )			// Display Renderer control?
    {
        if ( !this.rendererControl )
        {
            this.rendererControl = new Friend.Debug.RendererControl( this.tree, 'rendererControl',
            {
                root: this.root,
                parent: this,
                x: 0,
                y: 0,
                width: 250,
                height: 100,
                alphaIdle: this.alphaIdle
            } );		
        }
        else
        {
            this.rendererControl.destroy();
            this.rendererControl = null;
        }
        this.doRefresh( -1 );
    }
    this.controller.isKeyRelease( 82, this.identifier );
	return this.startProcess( flags, [] );
};
Friend.Debug.Debugger.processDown = function ( flags )
{
	return this.endProcess( flags, [] );
};
Friend.Debug.Debugger.renderUp = function ( flags )
{
    return flags;
};
Friend.Debug.Debugger.renderDown = function ( flags )
{
    return flags;
};


Friend.Debug.RendererControl = function ( tree, name, flags )
{
	this.tree = tree;

    this.font = '12px Arial';
    this.title = 'Renderer control';
    this.cancel = 'Cancel';
    this.texts = [ 'Camera X:', 'Camera Y:', 'Camera Z:', 'Angle of vision: ' ],
	this.backColor = '#C0C0C0';
	this.brightColor = '#E0E0E0';
	this.darkColor = '#808080';
	this.textColor = '#000000';
	this.titleColor = '#FF0000';
	this.onCancel = false;
	this.caller = false;
    this.rendererType = 'Canvas';
    this.renderer = this.tree.renderer;
    this.alphaIdle = 1;
	Friend.Tree.Items.init( this, tree, name, 'Friend.Debug.RendererControl', flags );
	Object.assign( this, Friend.Debug.RendererControl );
    this.exposed = this.renderer.exposed;
    this.mouseOver = false;
    
	this.buttonWidth = 24;
    this.buttonHeight = 18;
    this.editWidth = 64;
    this.cancelWidth = 24;
    this.cancelHeight = 14;
    this.syLine = this.buttonHeight;
    this.xStart = 8;
    this.yStart = 26;
    this.xButtons = this.width - this.editWidth - this.buttonWidth * 2 - 8;
    this.yButtons = this.yStart - 2; 
    this.height = Math.max( this.height, this.yStart + this.buttonHeight * this.exposed.length + 8 );
    this.edits = [];
    this.startInsertItems();
    for ( var l = 0; l < this.exposed.length; l++ )
    {
        var info = this.exposed[ l ];
        if ( !info.defaultValue )
            info.defaultValue = info.value;
        if ( info.type == 'number' )
        {
            var item = new Friend.UI.HTMLText( this.tree, 'text',
            {
                root: this.root,
                parent: this,
                x: this.xStart,
                y: this.yStart + l * this.syLine,
                width: this.xButtons - this.xStart,
                height: this.syLine,
                hAlign: 'center',
                vAlign: 'middle',
                font: this.font,
                text: info.name
            } );
            item.controlNumber = l;
            this.addItem( item );            
            var item = new Friend.UI.Edit( this.tree, 'edit',
            {
                root: this.root,
                parent: this,
                x: this.xButtons,
                y: this.yButtons + l * this.syLine,
                width: this.editWidth,
                height: this.buttonHeight + 4,
                caller: this,
                onReturn: 'changeEdit',
                hAlign: 'center',
                vAlign: 'top',
                font: this.font,
                text: '' + info.value,
                type: info.type
            } );
            item.controlNumber = l;
            this.addItem( item );
            this.edits.push( item );
            var item = new Friend.UI.HTMLButton( this.tree, 'minus',
            {
                root: this.root,
                parent: this,
                x: this.xButtons + this.editWidth,
                y: this.yButtons + l * this.syLine,
                width: this.buttonWidth,
                height: this.buttonHeight,
                text: '-',
                caller: this,
                onClick: 'clickMinus'
            } );
            item.controlNumber = l;
            this.addItem( item );
            var item = new Friend.UI.HTMLButton( this.tree, 'plus',
            {
                root: this.root,
                parent: this,
                x: this.xButtons + this.editWidth + this.buttonWidth,
                y: this.yButtons + l * this.syLine,
                width: this.buttonWidth,
                height: this.buttonHeight,
                text: '+',
                caller: this,
                onClick: 'clickPlus'
            } );
            item.controlNumber = l;
            this.addItem( item );
        }
    }
	var item = new Friend.UI.HTMLButton( this.tree, 'cancel',
	{
		root: this.root,
		parent: this,
		x: this.xButtons + this.editWidth + this.buttonWidth,
		y: 0,
		width: this.cancelWidth,
		height: this.cancelHeight,
		text: 'x',
		caller: this,
        onClick: 'clickCancel'
    } );
    this.addItem( item );
    this.endInsertItems();
    flags.caller = false;
    this.addProcess( new Friend.UI.GestureButton( this.tree, this, flags ) );    
};
Friend.Debug.RendererControl.renderUp = function ( flags )
{
	return flags;
};
Friend.Debug.RendererControl.renderDown = function ( flags )
{
    return  flags;
};
Friend.Debug.RendererControl.processUp = function ( flags )
{
	return this.startProcess( flags, [ 'x', 'y', 'z', 'mouseOver' ] );
};
Friend.Debug.RendererControl.processDown = function ( flags )
{
	return this.endProcess( flags, [ 'x', 'y', 'z', 'mouseOver' ] );
}
Friend.Debug.RendererControl.clickCancel = function ( )
{
	this.destroy();
};
Friend.Debug.RendererControl.clickMinus = function ( callerItem )
{
    var line = callerItem.controlNumber;
    var info = this.exposed[ line ];
    info.value = Math.max( Math.min( info.value - info.step, info.max ), info.min );
    this.renderer.changeExposed( info );
    this.edits[ line ].setValue( info.value );
    this.doRefresh();    
};
Friend.Debug.RendererControl.clickPlus = function ( callerItem )
{
    var line = callerItem.controlNumber;
    var info = this.exposed[ line ];
    info.value = Math.max( Math.min( info.value + info.step, info.max ), info.min );
    this.renderer.changeExposed( info );
    this.edits[ line ].setValue( info.value );
    this.doRefresh();    
};
Friend.Debug.RendererControl.changeEdit = function ( callerItem, value )
{
    var line = callerItem.controlNumber;
    var info = this.exposed[ line ];
    info.value = Math.max( Math.min( value, info.max ), info.min );
    this.renderer.changeExposed( info );
    this.edits[ line ].setValue( info.value );
    this.doRefresh();    
};

