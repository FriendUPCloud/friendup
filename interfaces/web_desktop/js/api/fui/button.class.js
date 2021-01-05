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

FUI.Button = function( object )
{
	this.initialize( 'Button' );
	this.flags = object;
}

FUI.Button.prototype = new FUI.BaseClass();

// Default methods -------------------------------------------------------------

FUI.Button.prototype.onPropertySet = function( property, value, callback )
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

FUI.Button.Renderers = {};

// "Signal Renderer"

FUI.Button.Renderers.signal = function()
{
}

// HTML5 Renderer

FUI.Button.Renderers.html5 = function( buttonObj )
{
	this.button = buttonObj;
	this.domNodes = [];
}
FUI.Button.Renderers.html5.prototype.refresh = function( pnode )
{
	let self = this;
	
	if( !pnode && !self.button.parentNode ) return;
	if( !pnode )  pnode = self.button.parentNode;
	this.button.parentNode = pnode;
	
	if( !this.button.domNode )
	{
		let d = document.createElement( 'div' );
		d.setAttribute( 'fui-component', 'Button' );
		d.style.position = 'absolute';
		d.style.top = '0';
		d.style.left = '0';
		d.style.width = '100%';
		d.style.height = '24px';
		d.style.lineHeight = '24px';
		/*d.style.borderTop = '1px solid white';
		d.style.borderLeft = '1px solid white';
		d.style.borderRight = '1px solid black';
		d.style.borderBottom = '1px solid black';*/
		d.style.textAlign = 'center';
		d.style.verticalAlign = 'middle';
		d.style.cursor = 'pointer';
		d.style.borderRadius = '3px';
		d.style.boxSizing = 'border-box';
		this.button.domNode = d;
		pnode.appendChild( d );
		d.onclick = function( e )
		{
			if( self.button.events && self.button.events[ 'onclick' ] )
			{
				for( let z = 0; z < self.button.events[ 'onclick' ].length; z++ )
				{
					self.button.events[ 'onclick' ][ z ]( e );
				}
			}
		}
	}
	
	let d = this.button.domNode;
	
	if( this.button.flags.text )
	{
		d.innerHTML = this.button.flags.text;
	}
	else
	{
		d.innerHTML = 'Unnamed button';
	}
}

