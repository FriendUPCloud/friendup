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

FUI.TabList = function( object )
{
	this.initialize( 'TabList' );
	this.flags = object;
}

FUI.TabList.prototype = new FUI.BaseClass();

( function(){

// Default methods -------------------------------------------------------------

FUI.TabList.prototype.onPropertySet = function( property, value, callback )
{
	switch( property )
	{
		case 'text':
			this.flags.text = value;
			this.refresh();
			break;
		case 'tabs':
			this.doMethod( 'setTabs', value, callback );
			break;
	}
	return;
}

FUI.TabList.prototype.onMethodCalled = function( method, value, callback )
{
	let o = {};

	if( Private[ method ] )
	{
		Private[ method ]( value, callback, this );
	}
	if( callback )
		return callback( false );	
	return false;
}

// Private methods -------------------------------------------------------------

let Private = {
	
	// Set tab rows
	setTabs: function( v, cbk, self )
	{	
		self.flags.rows = v;
		
		// Clear children
		self.children = [];
		
		// Add children
		for( let a = 0; a < v.length; a++ )
		{
			if( !v[a].id )
			{
				v[a].id = 'TabListRow_' + a;
			}
			// Add buttons to children
			if( v[a].buttons )
			{
				for( let b = 0; b < v[a].buttons.length; b++ )
				{
					let c = new FUI.ImageButton( v[a].buttons[b] );
					c.tabListRow = v[a].id;
					self.children.push( c );
				}
			}
		}
		
		self.clear = true;
		
		self.refresh();

		// Just say we're not ok
		if( cbk )
			cbk( false );
	},
	// Clear all tab rows
	clearTabs: function( v, cbk, self )
	{
		if( cbk )
			cbk( false );
	}
};

} )();

// Renderers -------------------------------------------------------------------

FUI.TabList.Renderers = {};

// "Signal Renderer"

FUI.TabList.Renderers.signal = function()
{
}

// HTML5 Renderer

FUI.TabList.Renderers.html5 = function( tablist )
{
	this.TabList = tablist;
	this.domNodes = [];
}
FUI.TabList.Renderers.html5.prototype.refresh = function( pnode )
{
	let self = this;
	
	if( !pnode && !self.TabList.parentNode ) return;
	
	if( !pnode )  pnode = self.TabList.parentNode;
	this.TabList.parentNode = pnode;
	
	if( !this.TabList.domNode )
	{
		let f = document.createElement( 'div' );
		f.setAttribute( 'fui-component', 'TabList' );
		f.style.position = 'absolute';
		f.style.top = '0';
		f.style.left = '0';
		f.style.width = '100%';
		f.style.height = '100%';
		f.style.backgroundColor = FUI.theme.palette.foreground.color;
		f.style.overflow = 'auto';
		f.style.smoothScrolling = 'true';
		f.style.boxSizing = 'border-box';
		
		let sub = FUI.theme.gadgets.margins.normal + ' - ' + FUI.theme.gadgets.margins.normal;
		
		
		f.onclick = function( e )
		{
			if( self.TabList.events && self.TabList.events[ 'onclick' ] )
			{
				for( let z = 0; z < self.TabList.events[ 'onclick' ].length; z++ )
				{
					self.TabList.events[ 'onclick' ][ z ]( e );
				}
			}
		}
		
		// Attach
		this.TabList.domNode = f;
		pnode.appendChild( f );
	}
	
	let d = this.TabList.domNode;
	
	if( this.TabList.flags.rows )
	{
		if( this.TabList.clear )
		{
			d.innerHTML = '';
			delete this.TabList.clear;
		}
	
		let rows = this.TabList.flags.rows;
		let refreshers = {};
		for( let a = 0; a < rows.length; a++ )
		{
			// Row container
			let r = document.createElement( 'div' );
			r.setAttribute( 'fui-component', 'TabList-Row' );
			r.style.position = 'relative';
			r.style.width = '100%';
			r.style.height = '30px';
			r.style.color = FUI.theme.palette.fillText.color;
			r.style.boxSizing = 'border-box';
			
			// Add icon in list
			if( rows[ a ].icon )
			{
				let icon = false;
				if( ( icon = FUI.getThemeIcon( rows[ a ].icon ) ) )
				{
					let i = document.createElement( 'div' );
					i.style.position = 'absolute';
					i.style.left = FUI.theme.gadgets.margins.normal;
					i.style.width = '30px';
					i.style.height = '100%';
					i.style.textAlign = 'left';
					i.style.lineHeight = '30px';
					i.className = icon;
					i.innerHTML = '&nbsp;';
					r.appendChild( i );
				}
			}
			
			// Text content
			let t = document.createElement( 'div' );
			t.style.position = 'absolute';
			t.style.left = 'calc(30px + ' + FUI.theme.gadgets.margins.normal + ')';
			t.style.width = 'calc(60% - 30px - ' + FUI.theme.gadgets.margins.normal + ')';
			t.style.height = '100%';
			t.style.overflow = 'hidden';
			t.style.textOverflow = 'ellipsis';
			t.style.lineHeight = '30px';
			t.innerHTML = rows[ a ].text;
			r.appendChild( t );
			
			// Button list
			let b = document.createElement( 'div' );
			b.id = rows[ a ].id;
			b.setAttribute( 'fui-component', 'TabList-Row-Buttons' );
			b.style.position = 'absolute';
			b.style.width = 'calc(40% - ' + FUI.theme.gadgets.margins.normal + ')';
			b.style.height = '100%';
			b.style.top = '0';
			b.style.right = FUI.theme.gadgets.margins.normal;
			r.appendChild( b );
		
			// Render ImageButton objects
			if( self.TabList.children )
			{
				let buttons = self.TabList.children;
				refreshers[ b ] = {
					pnode: b,
					children: []
				};
				
				// Calculate weight for button list
				let totals = pos = 0;
				for( let z = 0; z < buttons.length; z++ )
					if( buttons[ z ].tabListRow == b.id )
						totals += buttons[ z ].flags.weight;
				
				for( let z = 0; z < buttons.length; z++ )
				{
					if( buttons[ z ].tabListRow == b.id )
					{
						buttons[ z ].renderWidth = buttons[ z ].flags.weight / totals * 100 + '%';
						buttons[ z ].renderLeft = pos / totals * 100 + '%';
						buttons[ z ].refresh( b );
						pos += buttons[ z ].flags.weight;
					}
				} 
			}
			
			// Add the row
			d.appendChild( r );
		}
	}
}

/* Dependencies ------------------------------------------------------------- */

FUI.TabListRow = function( object )
{
	this.initialize( 'TabListRow' );
	this.flags = object;
}

FUI.TabListRow.prototype = new FUI.BaseClass();

// Default methods -------------------------------------------------------------

/*( function(){

FUI.TabList.prototype.onPropertySet = function( property, value, callback )
{
	switch( property )
	{
		case 'text':
			this.flags.text = value;
			this.refresh();
			break;
		case 'tabs':
			this.doMethod( 'setTabs', value, callback );
			break;
	}
	return;
}

FUI.TabList.prototype.onMethodCalled = function( method, value, callback )
{
	let o = {};

	if( Private[ method ] )
	{
		Private[ method ]( value, callback, this );
	}
	if( callback )
		return callback( false );	
	return false;
}

} )();*/

