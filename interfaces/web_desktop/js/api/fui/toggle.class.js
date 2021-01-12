/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

FUI.Toggle = function( object )
{
	this.initialize( 'Toggle' );
	this.flags = object;
}

FUI.Toggle.prototype = new FUI.BaseClass();

// Renderers -------------------------------------------------------------------

FUI.Toggle.Renderers = {};

// "Signal Renderer"

FUI.Toggle.Renderers.signal = function()
{
}

// HTML5 Renderer

FUI.Toggle.Renderers.html5 = function( buttonObj )
{
	this.Toggle = buttonObj;
	this.domNodes = [];
}
FUI.Toggle.Renderers.html5.prototype.refresh = function( pnode )
{
	let self = this;
	
	if( !pnode && !self.Toggle.parentNode ) return;
	if( !pnode )  pnode = self.Toggle.parentNode;
	this.Toggle.parentNode = pnode;
	
	if( !this.Toggle.domNode )
	{
		let d = document.createElement( 'div' );
		d.setAttribute( 'fui-component', 'Toggle' );
		d.style.position = 'absolute';
		d.style.top = '0';
		d.style.left = '0';
		d.style.width = '100%';
		d.style.height = '100%';
		d.style.fontSize = FUI.theme.fontStyles.large.fontSize;
		d.style.textAlign = 'center';
		this.Toggle.domNode = d;
		pnode.appendChild( d );
	}
	
	this.Toggle.domNode.innerHTML = '<span class="IconSmall fa-toggle-off" style="font-size: 18px; position: relative; top: calc(50% - 11px); display: inline-block"></span>';
}

