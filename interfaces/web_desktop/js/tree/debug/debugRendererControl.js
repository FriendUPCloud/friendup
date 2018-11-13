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
 * Tree engine debugging items
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.Debug = Friend.Tree.Debug || {};

Friend.Tree.Debug.RendererControl = function ( tree, name, flags )
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
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Debug.RendererControl', flags );
    
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
            var item = new Friend.Tree.UI.HTMLText( this.tree, 'text',
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
            var item = new Friend.Tree.UI.Edit( this.tree, 'edit',
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
            var item = new Friend.Tree.UI.HTMLButton( this.tree, 'minus',
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
            var item = new Friend.Tree.UI.HTMLButton( this.tree, 'plus',
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
	var item = new Friend.Tree.UI.HTMLButton( this.tree, 'cancel',
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
    this.addProcess( new Friend.Tree.UI.GestureButton( this.tree, this, flags ) );    
};
Friend.Tree.Debug.RendererControl.render = function ( flags )
{
	return flags;
};
Friend.Tree.Debug.RendererControl.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z', 'mouseOver' ] );
};
Friend.Tree.Debug.RendererControl.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'mouseOver' ] );
}
Friend.Tree.Debug.RendererControl.clickCancel = function ( )
{
	this.destroy();
};
Friend.Tree.Debug.RendererControl.clickMinus = function ( callerItem )
{
    var line = callerItem.controlNumber;
    var info = this.exposed[ line ];
    info.value = Math.max( Math.min( info.value - info.step, info.max ), info.min );
    this.renderer.changeExposed( info );
    this.edits[ line ].setValue( info.value );
    this.doRefresh();    
};
Friend.Tree.Debug.RendererControl.clickPlus = function ( callerItem )
{
    var line = callerItem.controlNumber;
    var info = this.exposed[ line ];
    info.value = Math.max( Math.min( info.value + info.step, info.max ), info.min );
    this.renderer.changeExposed( info );
    this.edits[ line ].setValue( info.value );
    this.doRefresh();    
};
Friend.Tree.Debug.RendererControl.changeEdit = function ( callerItem, value )
{
    var line = callerItem.controlNumber;
    var info = this.exposed[ line ];
    info.value = Math.max( Math.min( value, info.max ), info.min );
    this.renderer.changeExposed( info );
    this.edits[ line ].setValue( info.value );
    this.doRefresh();    
};

