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

FUI.Input.Renderers.html5 = function( inputObject )
{
	this.grid = inputObject;
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
		d.style.borderTop = FUI.theme.gadgets.rect.borderWidth.top + ' ' + FUI.theme.gadgets.rect.borderStyle + ' ' + FUI.theme.palette.bordershine.color;
		d.style.borderLeft = FUI.theme.gadgets.rect.borderWidth.left + ' ' + FUI.theme.gadgets.rect.borderStyle + ' ' + FUI.theme.palette.bordershine.color;
		d.style.borderRight = FUI.theme.gadgets.rect.borderWidth.right + ' ' + FUI.theme.gadgets.rect.borderStyle + ' ' + FUI.theme.palette.bordershadow.color;
		d.style.borderBottom = FUI.theme.gadgets.rect.borderWidth.bottom + ' ' + FUI.theme.gadgets.rect.borderStyle + ' ' + FUI.theme.palette.bordershadow.color;
		d.style.backgroundColor = FUI.theme.palette.foreground.color;
		d.style.textAlign = 'left';
		d.style.cursor = 'text';
		d.style.borderRadius = FUI.theme.gadgets.rect.borderRadius.top + ' ' +
		                       FUI.theme.gadgets.rect.borderRadius.left + ' ' +
		                       FUI.theme.gadgets.rect.borderRadius.right + ' ' +
		                       FUI.theme.gadgets.rect.borderRadius.bottom;
		d.style.boxSizing = 'border-box';
		
		m.appendChild( d );
		m.input = d;
		
		this.grid.domNode = m;
		pnode.appendChild( m );
	}
	
	let d = this.grid.domNode;
	
	if( this.grid.flags.placeholder )
	{
		d.input.setAttribute( 'placeholder', this.grid.flags.placeholder );
	}
}

