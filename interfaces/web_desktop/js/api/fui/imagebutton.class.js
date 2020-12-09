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

FUI.ImageButton = function( object )
{
	this.initialize( 'Button' );
	this.flags = object;
}

FUI.ImageButton.prototype = new FUI.Button();

// Default methods -------------------------------------------------------------

FUI.ImageButton.prototype.onPropertySet = function( property, value, callback )
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

FUI.ImageButton.Renderers = {};

// "Signal Renderer"

FUI.ImageButton.Renderers.signal = function()
{
}

// HTML5 Renderer

FUI.ImageButton.Renderers.html5 = function( buttonObj )
{
	this.ImageButton = buttonObj;
	this.domNodes = [];
}
FUI.ImageButton.Renderers.html5.prototype.refresh = function( pnode )
{
	let self = this;
	
	if( !pnode && !self.ImageButton.parentNode ) return;
	if( !pnode )  pnode = self.ImageButton.parentNode;
	this.ImageButton.parentNode = pnode;
	
	if( !this.ImageButton.domNode )
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
		this.ImageButton.domNode = d;
		pnode.appendChild( d );
		d.onclick = function( e )
		{
			if( self.ImageButton.events && self.ImageButton.events[ 'onclick' ] )
			{
				for( let z = 0; z < self.ImageButton.events[ 'onclick' ].length; z++ )
				{
					self.ImageButton.events[ 'onclick' ][ z ]( e );
				}
			}
		}
	}
	
	let d = this.ImageButton.domNode;
	
	if( this.ImageButton.flags.text )
	{
		d.innerHTML = this.ImageButton.flags.text;
	}
	else
	{
		d.innerHTML = 'Unnamed button';
	}
}

