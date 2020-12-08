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

FUI.Listview = function( object )
{
	this.initialize( 'Listview' );
	this.flags = object;
}

FUI.Listview.prototype = new FUI.BaseClass();

// Default methods -------------------------------------------------------------

FUI.Listview.prototype.onPropertySet = function( property, value, callback )
{
	switch( property )
	{
		case 'headers':
			this.flags.headers = value;
			this.refresh();
			break;
	}
	return;
}

// Renderers -------------------------------------------------------------------

FUI.Listview.Renderers = {};

// "Signal Renderer"

FUI.Listview.Renderers.signal = function()
{
}

// HTML5 Renderer

FUI.Listview.Renderers.html5 = function( gridObject )
{
	this.grid = gridObject;
	this.domNodes = [];
}
FUI.Listview.Renderers.html5.prototype.refresh = function( pnode )
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
		d.style.backgroundColor = '#f8f8f8';
		d.style.textAlign = 'center';
		d.style.verticalAlign = 'middle';
		d.style.cursor = 'pointer';
		d.style.borderRadius = '3px';
		d.style.boxSizing = 'border-box';
		this.grid.domNode = d;
		pnode.appendChild( d );
	}
	
	let d = this.grid.domNode;
	
	if( this.grid.flags.headers )
	{
		d.innerHTML = '';
		let headers = this.grid.flags.headers;
		for( let a = 0; a < headers.length; a++ )
		{
			let n = document.createElement( 'div' );
			n.style.position = 'absolute';
			if( a != headers.length - 1 )
				n.style.borderRight = '1px solid #444444';
			n.style.borderBottom = '1px solid #444444';
			n.style.backgroundColor = '#a0a0a0';
			n.style.fontWeight = 'bold';
			n.style.height = '30px';
			let w = 100 / headers.length;
			n.style.width = w + '%';
			n.style.left = a * w + '%';
			n.style.top = '0';
			n.style.boxSizing = 'border-box';
			n.style.padding = '5px';
			n.innerHTML = headers[ a ];
			d.appendChild( n );
		}
	}
	else
	{
		d.innerHTML = '';
	}
}

