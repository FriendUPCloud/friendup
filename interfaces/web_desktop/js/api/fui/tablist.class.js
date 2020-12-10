/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/* Button class ------------------------------------------------------------- */

FUI.TabList = function( object )
{
	this.initialize( 'TabList' );
	this.flags = object;
}

FUI.TabList.prototype = new FUI.BaseClass();

// Default methods -------------------------------------------------------------

FUI.TabList.prototype.onPropertySet = function( property, value, callback )
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

FUI.TabList.Renderers = {};

// "Signal Renderer"

FUI.TabList.Renderers.signal = function()
{
}

// HTML5 Renderer

FUI.TabList.Renderers.html5 = function( buttonObj )
{
	this.TabList = buttonObj;
	this.domNodes = [];
}
FUI.TabList.Renderers.html5.prototype.refresh = function( pnode )
{
	let self = this;
	
	if( !pnode && !self.TabList.parentNode ) return;
	if( !pnode )  pnode = self.TabList.parentNode;
	this.TabList.parentNode = pnode;
	
	if( !this.TabList.domNode )
	{
		let d = document.createElement( 'div' );
		d.style.position = 'absolute';
		d.style.top = '0';
		d.style.left = '0';
		d.style.width = '100%';
		d.style.height = '100%';
		d.style.borderTop = '1px solid white';
		d.style.borderLeft = '1px solid white';
		d.style.borderRight = '1px solid black';
		d.style.borderBottom = '1px solid black';
		d.style.backgroundColor = '#888888';
		d.style.textAlign = 'center';
		d.style.verticalAlign = 'middle';
		d.style.cursor = 'pointer';
		d.style.borderRadius = '3px';
		d.style.boxSizing = 'border-box';
		this.TabList.domNode = d;
		pnode.appendChild( d );
		d.onclick = function( e )
		{
			if( self.TabList.events && self.TabList.events[ 'onclick' ] )
			{
				for( let z = 0; z < self.TabList.events[ 'onclick' ].length; z++ )
				{
					self.TabList.events[ 'onclick' ][ z ]( e );
				}
			}
		}
	}
	
	let d = this.TabList.domNode;
	
	if( this.TabList.flags.text )
	{
		d.innerHTML = this.TabList.flags.text;
	}
	else
	{
		d.innerHTML = 'Unnamed button';
	}
}

