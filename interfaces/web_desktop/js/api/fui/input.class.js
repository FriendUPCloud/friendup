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
	this.initialize( 'Input' );
	
	this.flags = object;
}

FUI.Input.prototype = new FUI.BaseClass();

// Renderers -------------------------------------------------------------------

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
		let m = document.createElement( 'div' );
		m.style.position = 'absolute';
		m.style.top = FUI.theme.gadgets.margins.normal;
		m.style.left = FUI.theme.gadgets.margins.normal;
		m.style.width = 'calc(100% - ' + FUI.theme.gadgets.margins.normal + ' - ' + FUI.theme.gadgets.margins.normal + ')';
		m.style.height = 'calc(100% - ' + FUI.theme.gadgets.margins.normal + ' - ' + FUI.theme.gadgets.margins.normal + ')';
		m.style.boxSizing = 'border-box';
		
		let d = document.createElement( 'input' );
		d.setAttribute( 'type', 'text' );
		d.style.position = 'absolute';
		d.style.top = '0px';
		d.style.left = '0px';
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
		
		m.appendChild( d );
		
		this.grid.domNode = m;
		pnode.appendChild( m );
	}
	
	let d = this.grid.domNode;
	
	if( this.grid.flags.text )
	{
		d.innerHTML = this.grid.flags.text;
	}
	else
	{
		d.innerHTML = 'Unnamed input';
	}
}

