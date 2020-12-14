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

FUI.Image = function( object )
{
	this.initialize( 'Image' );
	this.flags = object;
}

FUI.Image.prototype = new FUI.BaseClass();

// Default methods -------------------------------------------------------------

FUI.Image.prototype.onPropertySet = function( property, value, callback )
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

FUI.Image.Renderers = {};

// "Signal Renderer"

FUI.Image.Renderers.signal = function()
{
}

// HTML5 Renderer

FUI.Image.Renderers.html5 = function( buttonObj )
{
	this.Image = buttonObj;
	this.domNodes = [];
}
FUI.Image.Renderers.html5.prototype.refresh = function( pnode )
{
	let self = this;
	
	if( !pnode && !self.Image.parentNode ) return;
	if( !pnode )  pnode = self.Image.parentNode;
	this.Image.parentNode = pnode;
	
	if( !this.Image.domNode )
	{
		let d = document.createElement( 'div' );
		d.style.position = 'absolute';
		d.style.top = '0';
		d.style.left = '0';
		d.style.width = '100%';
		d.style.height = '100%';
		d.style.backgroundColor = '#888888';
		d.style.boxSizing = 'border-box';
		this.Image.domNode = d;
		pnode.appendChild( d );
		d.onclick = function( e )
		{
			if( self.Image.events && self.Image.events[ 'onclick' ] )
			{
				for( let z = 0; z < self.Image.events[ 'onclick' ].length; z++ )
				{
					self.Image.events[ 'onclick' ][ z ]( e );
				}
			}
		}
	}
	
	let d = this.Image.domNode;
	
	let fl = this.Image.flags;
	
	if( fl.type )
	{
		if( fl.type == 'background' )
		{
			if( fl.pattern )
			{
				let url = getImageUrl( fl.pattern );
				d.style.backgroundImage = 'url(' + url + ')';
			}
			if( fl.patternSize )
			{
				d.style.backgroundSize = fl.patternSize;
			}
			if( fl.patternPosition )
			{
				let pos = '';
				if( !fl.patternPosition.vertical ) fl.patternPosition.vertical = 'middle';
				if( !fl.patternPosition.horizontal ) fl.patternPosition.horizontal = 'middle';
				switch( fl.patternPosition.vertical )
				{
					case 'top':
					case 'bottom':
						pos += fl.patternPosition.vertical;
						break;
					case 'middle':
						pos += 'center';
						break;
				}
				switch( fl.patternPosition.horizontal )
				{
					case 'left':
					case 'right':
						pos += ' ' + fl.patternPosition.horizontal;
						break;
					case 'middle':
						pos += ' center';
						break;
				}
				d.style.backgroundPosition = pos;
			}
		}
	}
	else
	{
		d.innerHTML = '';
	}
}

