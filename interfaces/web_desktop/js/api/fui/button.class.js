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
			console.log( 'Refreshing now: ' + value );
			this.refresh();
			break;
		default:
			console.log( 'Do not know what to set on "' + property + '" -> ' + value );
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

FUI.Button.Renderers.html5 = function( gridObject )
{
	this.grid = gridObject;
	this.domNodes = [];
}
FUI.Button.Renderers.html5.prototype.refresh = function( pnode )
{
	let self = this;
	
	if( !pnode && !self.grid.parentNode ) return;
	if( !pnode )  pnode = self.grid.parentNode;
	this.grid.parentNode = pnode;
	
	if( !this.grid.domNode )
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
		this.grid.domNode = d;
		pnode.appendChild( d );
	}
	
	let d = this.grid.domNode;
	
	if( this.grid.flags.text )
	{
		d.innerHTML = this.grid.flags.text;
	}
	else
	{
		d.innerHTML = 'Unnamed button';
	}
}

