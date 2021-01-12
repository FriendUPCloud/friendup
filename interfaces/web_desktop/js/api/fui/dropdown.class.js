/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/* Dropdown class ------------------------------------------------------------- */

FUI.Dropdown = function( object )
{
	this.initialize( 'Dropdown' );
	this.flags = object;
}

FUI.Dropdown.prototype = new FUI.BaseClass();

// Default methods -------------------------------------------------------------

FUI.Dropdown.prototype.onPropertySet = function( property, value, callback )
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

FUI.Dropdown.Renderers = {};

// "Signal Renderer"

FUI.Dropdown.Renderers.signal = function()
{
}

// HTML5 Renderer

FUI.Dropdown.Renderers.html5 = function( DropdownObj )
{
	this.Dropdown = DropdownObj;
	this.domNodes = [];
}
FUI.Dropdown.Renderers.html5.prototype.refresh = function( pnode )
{
	let self = this;
	
	if( !pnode && !self.Dropdown.parentNode ) return;
	if( !pnode )  pnode = self.Dropdown.parentNode;
	this.Dropdown.parentNode = pnode;
	
	if( !this.Dropdown.domNode )
	{
		let d = document.createElement( 'div' );
		d.setAttribute( 'fui-component', 'Dropdown' );
		d.style.position = 'absolute';
		d.style.top = '0';
		d.style.left = '0';
		d.style.width = '100%';
		d.style.height = '24px';
		d.style.lineHeight = '24px';
		d.style.textAlign = 'center';
		d.style.verticalAlign = 'middle';
		d.style.cursor = 'pointer';
		d.style.borderRadius = '3px';
		d.style.boxSizing = 'border-box';
		this.Dropdown.domNode = d;
		pnode.appendChild( d );
		d.onclick = function( e )
		{
			if( self.Dropdown.events && self.Dropdown.events[ 'onclick' ] )
			{
				for( let z = 0; z < self.Dropdown.events[ 'onclick' ].length; z++ )
				{
					self.Dropdown.events[ 'onclick' ][ z ]( e );
				}
			}
		}
	}
	
	let d = this.Dropdown.domNode;
	
	if( this.Dropdown.flags.text )
	{
		d.innerHTML = this.Dropdown.flags.text;
	}
	else
	{
		d.innerHTML = 'Unnamed Dropdown';
	}
}

