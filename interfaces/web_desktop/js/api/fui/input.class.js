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

FUI.Input = function( object )
{
	FUI.inherit( this, 'Input' );
	this.flags = object;
}

// Default methods

FUI.Input.prototype.refresh = function( pnode )
{
	return this.renderer.refresh( pnode );
}

FUI.Input.prototype.getChildren = function()
{
	return false;
}

FUI.Input.Renderers = {};

// "Signal Renderer"

FUI.Input.Renderers.signal = function()
{
}

// HTML5 Renderer

FUI.Input.Renderers.html5 = function( gridObject )
{
	this.grid = gridObject;
	this.domNodes = [];
}
FUI.Input.Renderers.html5.prototype.refresh = function( pnode )
{
	let self = this;
	
	if( !pnode && !self.grid.parentNode ) return;
	if( !pnode )  pnode = self.grid.parentNode;
	
	if( !this.grid.domNode )
	{
		let d = document.createElement( 'input' );
		d.setAttribute( 'type', 'text' );
		d.style.position = 'absolute';
		d.style.top = '0';
		d.style.left = '0';
		d.style.width = '100%';
		d.style.height = '100%';
		d.style.borderTop = '1px solid black';
		d.style.borderLeft = '1px solid black';
		d.style.borderRight = '1px solid white';
		d.style.borderBottom = '1px solid white';
		d.style.backgroundColor = '#888888';
		d.style.textAlign = 'left';
		d.style.cursor = 'text';
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

