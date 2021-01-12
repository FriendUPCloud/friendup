/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/* Pages class -------------------------------------------------------------- */

FUI.Pages = function( object )
{
	this.initialize( 'Pages' );
	this.flags = object;
}

FUI.Pages.prototype = new FUI.BaseClass();

// Default methods -------------------------------------------------------------

FUI.Pages.prototype.onPropertySet = function( property, value, callback )
{
	switch( property )
	{
		case 'text':
			this.flags.text = value;
			this.refresh();
			break;
	}
	return;
}

// Renderers -------------------------------------------------------------------

FUI.Pages.Renderers = {};

// "Signal Renderer"

FUI.Pages.Renderers.signal = function()
{
}

// HTML5 Renderer

FUI.Pages.Renderers.html5 = function( buttonObj )
{
	this.Pages = buttonObj;
	this.domNodes = [];
}
FUI.Pages.Renderers.html5.prototype.refresh = function( pnode )
{
	let self = this;
	
	if( !pnode && !self.Pages.parentNode ) return;
	if( !pnode )  pnode = self.Pages.parentNode;
	this.Pages.parentNode = pnode;
	
	if( !this.Pages.domNode )
	{
		let m = document.createElement( 'div' );
		m.style.position = 'absolute';
		m.style.top = 0;
		m.style.left = 0;
		m.style.width = '100%';
		m.style.height = '100%';
		m.style.boxSizing = 'border-box';
		m.setAttribute( 'fui-component', 'Pages' );
		
		pnode.appendChild( m );
	}
	
	let d = this.Pages.domNode;
	
	let fl = this.Pages.flags;
}

