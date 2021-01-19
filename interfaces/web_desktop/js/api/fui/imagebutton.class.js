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
	this.initialize( 'ImageButton' );
	this.flags = object;
}

FUI.ImageButton.prototype = new FUI.BaseClass();

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
		let width = this.ImageButton.renderWidth ? this.ImageButton.renderWidth : '100%';
		let left = this.ImageButton.renderLeft ? this.ImageButton.renderLeft : '0';
		
		let d = document.createElement( 'div' );
		d.setAttribute( 'fui-component', 'ImageButton' );
		d.style.position = 'absolute';
		d.style.top = '0';
		d.style.left = left;
		d.style.width = width;
		d.style.height = '100%';
		d.style.textAlign = 'center';
		d.style.cursor = 'pointer';
		d.style.boxSizing = 'border-box';
		if( this.ImageButton.flags.icon )
		{
			let i = document.createElement( 'span' );
			i.style.position = 'relative';
			i.style.top = 'calc(50% - 13px)';
			if( self.ImageButton.flags && self.ImageButton.flags.verticalAlign )
			{
				switch( self.ImageButton.flags.verticalAlign )
				{
					case 'top':
						i.style.top = '0px';
						break;
					case 'bottom':
						i.style.top = '';
						i.style.bottom = '100%';
						break;
				}
			}
			i.style.display = 'inline-block';
			i.className = FUI.theme.icons[ this.ImageButton.flags.icon ];
			d.appendChild( i );
			this.icon = i;
		}
		else
		{
			if( this.icon )
			{
				this.ImageButton.domNode.removeChild( this.icon );
				this.icon = null;
			}
		}
		this.ImageButton.domNode = d;
		pnode.appendChild( d );
		d.onclick = function( e )
		{
			console.log( 'We clicked: ', self.ImageButton );
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
	
	if( this.ImageButton.flags.iconText && this.ImageButton.flags.iconText !== false )
	{
		if( this.ImageButton.flags.text )
		{
			d.innerHTML = this.ImageButton.flags.text;
			if( this.icon ) d.appendChild( this.icon );
		}
		else
		{
			d.innerHTML = 'Unnamed button';
			if( this.icon ) d.appendChild( this.icon );
		}
	}
	else
	{
		d.innerHTML = '';
		if( this.icon ) d.appendChild( this.icon );
	}
}

