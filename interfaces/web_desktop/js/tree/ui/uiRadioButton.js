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

/**
 * RadioButton
 */

Friend.Tree.UI.RadioButton = function ( tree, name, flags )
{
	this.font = '16px sans serif';
	this.caller = false;
	this.onChange = false;
	this.list = [ 'Radio Button' ];
	this.value = 0;

	this.renderItemName = 'Friend.Tree.UI.RenderItems.RadioButton';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.UI.RadioButton', flags );
};
Friend.Tree.UI.RadioButton.messageUp = function ( message )
{
	return this.startProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'text', 'font', 'value' ] );
};
Friend.Tree.UI.RadioButton.messageDown = function ( message )
{
	return this.endProcess( message, [ 'x', 'y', 'z', 'width', 'height', 'text', 'font', 'value' ] );
};
Friend.Tree.UI.RadioButton.getValue = function ( )
{
	return this.value;
};
Friend.Tree.UI.RadioButton.setValue = function ( value )
{
	this.updateProperty( 'value', value );
	this.doRefresh();
};

Friend.Tree.UI.RenderItems.RadioButton_HTML = function ( tree, name, properties )
{
	this.list = false;
	this.font = false;
	this.caller = false;
	this.onClick = false;
	this.value = false;

	this.rendererType = 'Canvas';
	this.rendererName = 'Renderer_HTML';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.RadioButton', properties );

	this.buttons = [];
	
	this.div = document.createElement( 'div' );
	this.div.style.position = 'absolute';
	this.div.style.zIndex = this.z;
	this.div.style.visibility = 'hidden';
	document.body.appendChild( this.div );
	for ( var l = 0; l < this.item.list.length; l++ )
	{
		var radio = document.createElement( 'input' );
		radio.type = 'radio';
		radio.name = '' + l;
		radio.style.zIndex = this.z + 1;
		this.div.appendChild( radio );
		this.buttons[ l ] = radio;
		var div = document.createElement( 'div' );
		div.style.fontFamily = this.utilities.getFontFamily( this.item.font );
		div.style.fontSize = this.utilities.getFontSize( this.item.font ) + 'px';
		div.style.fontWeight = this.utilities.getFontWeight( this.item.font );
		div.style.zIndex = this.z + 1;
		div.innerHTML = this.item.lines[ l ] + '<br>';
		this.div.appendChild( div );
	}
	var self = this;
	for ( var l = 0; this.item.list.length; l++ )
	{
		this.buttons[ l ].onclick = function()
		{
			var value = parseInt( this.value );
			self.item.updateProperty( 'value', value );
			if ( self.item.caller && self.item.onClick )
				self.item.onClick.apply( self.item.caller, [ value ] );
		}
	};
};
Friend.Tree.UI.RenderItems.RadioButton_HTML.render = function ( properties )
{
	this.div.style.left = properties.xReal + 'px';
	this.div.style.top = properties.yReal + 'px';
	this.div.style.width = this.item.width + 'px';
	this.div.style.height = this.item.height + 'px';
	this.div.style.opacity = properties.alpha.toString();
	this.div.style.visibility = this.item.visible ? 'visible' : 'hidden';
	return properties;
};
Friend.Tree.UI.RenderItems.RadioButton_HTML.onDestroy = function ()
{
	document.body.removeChild( this.div );
}

