/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/* Grid class --------------------------------------------------------------- */

FUI.Grid = function( object )
{
	this.initialize( 'Grid' );
	
	// Some special stuff!
	this.gridDescription = [];
	this.children = [];
	this.gridDescription = object;
}

FUI.Grid.prototype = new FUI.BaseClass();

// Layout methods --------------------------------------------------------------

// Renderers -------------------------------------------------------------------

FUI.Grid.Renderers = {};

// "Signal Renderer"

FUI.Grid.Renderers.signal = function()
{
}

FUI.Grid.Renderers.signal.prototype.updateTitleText = function()
{
	//return this.target.postMessage( { ... } );
}

// HTML5 Renderer

FUI.Grid.Renderers.html5 = function( gridObject )
{
	this.grid = gridObject;
	this.domNodes = [];
}
FUI.Grid.Renderers.html5.prototype.refresh = function( pnode )
{
	let self = this;
	let delayedChildElements = [];
	
	if( !pnode && !self.grid.parentNode ) return;
	if( !pnode )  pnode = self.grid.parentNode;
	
	if( !this.dom )
	{
		this.dom = document.createElement( 'div' );
		this.dom.style.position = 'absolute';
		this.dom.style.top = '0';
		this.dom.style.left = '0';
		this.dom.style.backgroundColor = FUI.theme.palette.background.color;
		this.dom.style.color = FUI.theme.palette.fillText.color;
		this.dom.style.width = '100%';
		this.dom.style.height = '100%';
		this.dom.setAttribute( 'fui-component', 'Grid' );
		pnode.appendChild( self.dom );
	}
	
	let gridObject = self.grid;
	let gridDescription = gridObject.gridDescription;
	if( !gridDescription.rows.length ) return;
	
	// Calculate dimensions
	let t = pt = 0; // top and percentTop
	let total = 0;
	let pixels = 0;
	for( let a = 0; a < gridDescription.rows.length; a++ )
	{
		if( gridDescription.rows[ a ].weight )
		{
			total += gridDescription.rows[ a ].weight;
		}
		else if( gridDescription.rows[ a ].pixelHeight )
			pixels += gridDescription.rows[ a ].pixelHeight;
	}
	let pxSpace = 0;
	
	let rcnt = 0;

	// Add objects
	for( let a = 0; a < gridDescription.rows.length; a++ )
	{
		let row = gridDescription.rows[ a ];
		let create = false;
		
		// Check if we need to create dom node
		let d = false;
		if( gridObject.children.length && gridObject.children[ rcnt ] )
			d = gridObject.children[ rcnt ].dom;
		else
		{
			// Create dom object
			d = document.createElement( 'div' );
			d.style.position = 'absolute';
			d.style.left = '0px';
			d.style.width = '100%';
			d.style.boxSizing = 'border-box';
			d.setAttribute( 'fui-component', 'Grid-Row' );
			//d.style.backgroundColor = 'rgb(' + ( Math.random() % 255 ) + ',' + ( Math.random() % 255 ) + ',' + ( Math.random() % 255 ) + ')';
			create = true;
		}
		
		if( !d ) continue;
		
		// Take account of pixel heights
		if( pixels > 0 )
		{	
			let pct = row.weight ? ( row.weight / total * 100 ) : 0;
			let pxSpace = pct > 0 ? ( pct / 100 * pixels ) : 0;
		
			if( t != 0 )
			{
				d.style.top = 'calc(' + pt + '% - ' + t + 'px)';
			}
			else
			{
				d.style.top = pt + '%';
			}
			
			t += pxSpace;
			
			if( row.weight || row.weight === 0 )
			{
				d.style.height = 'calc(' + pct + '% - ' + pxSpace + 'px)';
				pt += pct;
			}
			else if( row.pixelHeight )
			{
				d.style.height = row.pixelHeight + 'px';
				t -= row.pixelHeight;
			}
			else continue;
		}
		// Just percentages
		else if( row.weight || row.weight === 0 )
		{
			d.style.height = row.weight / total * 100 + '%';
			d.style.top = pt + '%';
			pt += parseInt( d.style.height );
		}
		else continue;
		
		if( create )
		{
			d.setAttribute( 'fui-component', 'Grid-Column' );
			self.dom.appendChild( d );
		}
		
		gridObject.children[ rcnt ] = {
			dom: d,
			children: []
		};
		
		rcnt++;
		
		if( !row.columns ) continue;
		
		// Do the columns.............................
		let l = pl = 0;
		let rpixels = 0;
		let rtotal = 0;
		for( let b = 0; b < row.columns.length; b++ )
		{
			if( row.columns[ b ].weight )
			{
				rtotal += row.columns[ b ].weight;
			}
			else if( row.columns[ b ].pixelWidth )
				rpixels += row.columns[ b ].pixelWidth;
		}
		
		let childn = 0;
		
		for( let b = 0; b < row.columns.length; b++ )
		{
			create = false;
			
			let column = row.columns[ b ];
			
			// Check if we need to create dom node
			// TODO: Perhaps children should be gotten by unique ID to prevent drifting of child objects
			let r = false;
			let childlist = gridObject.children[ rcnt - 1 ];
			if( childlist && childlist.children.length && childlist.children[ childn ] )
				r = childlist.children[ childn ].dom;
			else
			{	
				// Create dom object
				r = document.createElement( 'div' );
				r.style.position = 'absolute';
				r.style.top = '0px';
				r.style.height = '100%';
				r.style.overflow = 'hidden';
				r.style.boxSizing = 'border-box';
				//r.style.backgroundColor = 'rgb(' + ( Math.random() * 255 ) + ',' + ( Math.random() * 255 ) + ',' + ( Math.random() * 255 ) + ')';
				create = true;
			}
			
			// Take account of pixel heights
			if( rpixels > 0 )
			{	
				let pct = column.weight ? ( column.weight / rtotal * 100 ) : 0;
				let pxrSpace = pct > 0 ? ( pct / 100 * rpixels ) : 0;
		
				if( l != 0 )
				{
					r.style.left = 'calc(' + pl + '% - ' + l + 'px)';
				}
				else
				{
					r.style.left = pl + '%';
				}
			
				l += pxrSpace;
			
				if( column.weight || column.weight === 0 )
				{
					r.style.width = 'calc(' + pct + '% - ' + pxrSpace + 'px)';
					pl += pct;
				}
				else if( column.pixelWidth )
				{
					r.style.width = column.pixelWidth + 'px';
					l -= column.pixelWidth;
				}
				else continue;
			}
			// Just percentages
			else if( column.weight || column.weight === 0 )
			{
				r.style.width = column.weight / rtotal * 100 + '%';
				r.style.left = pl + '%';
				pl += parseInt( r.style.width );
			}
			else continue;
		
			// Add the column
			if( create )
				d.appendChild( r );
			
			// Make sure the child is added to the row of children
			childlist.children[ childn ] = {
				children: [],
				dom: r // Memorize!
			};

			// We have a child
			if( column.child )
			{
				delayedChildElements.push( {
					child: column.child,
					flags: column.flags,
					parent: r,
					index: childn
				} );
			}
			childn++;
		}
	}
	
	if( delayedChildElements.length )
	{
		for( let a = 0; a < delayedChildElements.length; a++ )
		{
			let c = new FUI[ delayedChildElements[ a ].child ]( delayedChildElements[ a ].flags );
			let p = delayedChildElements[ a ].parent;
			let i = delayedChildElements[ a ].index;
			
			let children = c.refresh( p );
			if( children && children.length )
			{
				for( let c = 0; c < children.length; c++ )
					self.grid.children[ i ].children.push( children[ c ] );
			}
		}
	}
	
	return this.grid.getChildren();
}

