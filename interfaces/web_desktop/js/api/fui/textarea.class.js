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

FUI.Textarea = function( object )
{
	this.initialize( 'Textarea' );
	
	this.flags = object;
}

FUI.Textarea.prototype = new FUI.BaseClass();

// Renderers -------------------------------------------------------------------

FUI.Textarea.Renderers = {};

// "Signal Renderer"

FUI.Textarea.Renderers.signal = function()
{
}

// HTML5 Renderer

FUI.Textarea.Renderers.html5 = function( TextareaObject )
{
	this.TextareaObject = TextareaObject;
	this.domNodes = [];
}
FUI.Textarea.Renderers.html5.prototype.refresh = function( pnode )
{
	let self = this;
	
	if( !pnode && !self.grid.parentNode ) return;
	if( !pnode )  pnode = self.grid.parentNode;
	
	if( !this.TextareaObject.domNode )
	{
		let m = document.createElement( 'div' );
		m.style.position = 'absolute';
		m.style.top = FUI.theme.gadgets.margins.normal;
		m.style.left = FUI.theme.gadgets.margins.normal;
		m.style.width = 'calc(100% - ' + FUI.theme.gadgets.margins.normal + ' - ' + FUI.theme.gadgets.margins.normal + ')';
		m.style.height = 'calc(100% - ' + FUI.theme.gadgets.margins.normal + ' - ' + FUI.theme.gadgets.margins.normal + ')';
		m.style.boxSizing = 'border-box';
		
		let d = document.createElement( 'textarea' );
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
		d.style.cursor = 'text';
		d.style.borderRadius = FUI.theme.gadgets.rect.borderRadius.top + ' ' +
		                       FUI.theme.gadgets.rect.borderRadius.left + ' ' +
		                       FUI.theme.gadgets.rect.borderRadius.right + ' ' +
		                       FUI.theme.gadgets.rect.borderRadius.bottom;
		d.style.boxSizing = 'border-box';
		
		m.appendChild( d );
		m.Textarea = d;
		
		this.TextareaObject.domNode = m;
		pnode.appendChild( m );
	}
	
	let d = this.TextareaObject.domNode;
	
	if( this.TextareaObject.flags )
	{
		if( this.TextareaObject.flags.placeholder )
		{
			d.Textarea.setAttribute( 'placeholder', this.TextareaObject.flags.placeholder );
		}
	}
}

