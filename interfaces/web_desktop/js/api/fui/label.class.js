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

FUI.Label = function( object )
{
	this.initialize( 'Label' );
	this.flags = object;
}

FUI.Label.prototype = new FUI.BaseClass();

// Default methods -------------------------------------------------------------

FUI.Label.prototype.onPropertySet = function( property, value, callback )
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

FUI.Label.Renderers = {};

// "Signal Renderer"

FUI.Label.Renderers.signal = function()
{
}

// HTML5 Renderer

FUI.Label.Renderers.html5 = function( buttonObj )
{
	this.Label = buttonObj;
	this.domNodes = [];
}
FUI.Label.Renderers.html5.prototype.refresh = function( pnode )
{
	let self = this;
	
	if( !pnode && !self.Label.parentNode ) return;
	if( !pnode )  pnode = self.Label.parentNode;
	this.Label.parentNode = pnode;
	
	if( !this.Label.domNode )
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
		this.Label.domNode = d;
		pnode.appendChild( d );
		d.onclick = function( e )
		{
			if( self.Label.events && self.Label.events[ 'onclick' ] )
			{
				for( let z = 0; z < self.Label.events[ 'onclick' ].length; z++ )
				{
					self.Label.events[ 'onclick' ][ z ]( e );
				}
			}
		}
	}
	
	let d = this.Label.domNode;
	
	if( this.Label.flags.text )
	{
		d.innerHTML = this.Label.flags.text;
	}
	else
	{
		d.innerHTML = 'Unnamed button';
	}
}

