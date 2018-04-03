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

/**
 * RadioButton

Friend.Tree.UI.RadioButton = function ( tree, name, flags )
{
	this.font = '16px Arial';
	this.caller = false;
	this.onChange = false;
	this.list = [ 'Radio Button' ];
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

Friend.Tree.UI.RenderItems.RadioButton = function ( tree, name, flags )
{
	this.font = false;
	this.caller = false;
	this.onClick = false;
	this.rendererName = '*';
	Friend.Tree.RenderItems.init( this, tree, name, 'Friend.Tree.UI.RenderItems.RadioButton', flags );

	this.buttons = [];
	
	this.div = document.createElement( 'div' );
	this.div.innerHTML = html;
	this.div.style.position = 'absolute';
	this.div.style.zIndex = this.z;
	this.div.style.visibility = 'hidden';
	document.body.appendChild( this.div );
	for ( var l = 0; l < this.parent.list.length; l++ )
	{
		var radio = document.createElement( 'input' );
		radio.type = 'radio';
		radio.name = '' + l;
		radio.style.zIndex = this.z + 1;
		this.div.appendChild( radio );
		this.buttons[ l ] = radio;
		var div = document.createElement( 'div' );
		div.style.fontFamily = this.utilities.getFontFamily( this.font );
		div.style.fontSize = this.utilities.getFontSize( this.font ) + 'px';
		div.style.fontWeight = this.utilities.getFontWeight( this.font );
		div.style.zIndex = this.z + 1;
		div.innerHTML = this.parent.lines[ l ] + '<br>';
		this.div.appendChild( div );
	}
	var self = this;
	for ( var l = 0; this.parent.list.length; l++ )
	{
		this.buttons[ l ].onclick = function()
		{
			var value = parseInt( this.value );
			self.tree.sendMessageToItem( self.parent.root, self.parent, 
			{
				command: 'setValue',
				type: 'renderItemToItem',
				value: value
			});
			if ( self.caller && self.onClick )
				self.onClick.apply( self.caller, [ value ] );
		}
	};
};
Friend.Tree.UI.RenderItems.RadioButton.render = function ( properties )
{
	this.div.style.left = properties.xReal + 'px';
	this.div.style.top = properties.yReal + 'px';
	this.div.style.width = this.parent.width + 'px';
	this.div.style.height = this.parent.height + 'px';
	this.div.style.opacity = properties.alpha.toString();
	this.div.style.visibility = this.parent.visible ? 'visible' : 'hidden';
	return properties;
};
Friend.Tree.UI.RenderItems.RadioButton.onDestroy = function ()
{
	document.body.removeChild( this.div );
}
*/
