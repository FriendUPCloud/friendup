/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var FUI = window.FUI ? window.FUI : {};

FUI.children = [];

FUI.initialize = function( flags, callback )
{
	this.flags = {};
	
	if( flags.classList )
	{
		let str = '/';
	
		for( let a = 0; a < classList.length; a++ )
		{
			if( a > 0 ) str += ';';
			str += 'webclient/js/api/fui/' + classList[ a ];
		}
	}
	
	// Set renderer
	if( !flags.renderer )
		flags.renderer = 'html5';
	switch( flags.renderer )
	{
		case 'html5':
			this.flags.renderer = flags.renderer;
			break;
		default:
			this.flags.renderer = 'html5';
			break;
	}
	
	// Set insertion point
	if( flags.parentNode )
	{
		FUI.dom = flags.parentNode;
	}
	else FUI.dom = document.body;
	
	if( callback )
		return callback( { result: true } );
	return;
}

FUI.addChild = function( element )
{
	if( element && element.refresh )
	{
		element.parentNode = this.dom;
		this.children.push( element );
		this.refresh( element );
		return this.children.length;
	}
	return false;
}

// Refresh the UI recursively
FUI.refresh = function( element )
{
	if( element )
	{
		let children = element.refresh();
		if( children.length )
		{
			for( let a = 0; a < children.length; a++ )
			{
				FUI.refresh( children[ a ] );
			}
		}
	}
}


/* Grid class --------------------------------------------------------------- */

FUI.Grid = function()
{
	this.gridDescription = [];
	this.renderer = new FUI.Grid.Renderers[ FUI.renderer ]( this );
}

// Layout methods --------------------------------------------------------------

FUI.Grid.prototype.setGrid = function( object )
{
	
}

// Getters and setters

FUI.Grid.prototype.getCellById = function( id )
{
}

FUI.Grid.prototype.setCellId = function( cell )
{
}

FUI.Grid.prototype.setCellProperties = function( cell, properties )
{
}

// Default methods

FUI.Grid.prototype.refresh = function()
{
	return this.renderer.refresh();
}

FUI.Grid.prototype.getChildren = function()
{
	return false;
}

// HTML5 Renderer

FUI.Grid.Renderers = {};
FUI.Grid.Renderers.html5 = function( gridObject )
{
	this.grid = gridObject;
	this.domNodes = [];
}
FUI.Grid.Renderers.html5.prototype.refresh = function()
{
	if( !this.parentNode ) return;
	let self = this;
	if( !this.dom )
	{
		this.dom = document.createElement( 'div' );
		this.dom.style.position = 'absolute';
		this.dom.style.top = '0';
		this.dom.style.left = '0';
		this.dom.style.width = '100%';
		this.dom.style.height = '100%';
		this.parentNode.appendChild( this.dom );
	}
	
	let gridObject = self.grid;
	let gridDescription = gridObject.gridDescription;
	if( !gridDescription.rows ) return;
	
	// Calculate dimensions
	let t = pt = 0; // top and percentTop
	let total = 0;
	let pixels = 0;
	for( let a = 0; a < gridDescription.rows.length; a++ )
	{
		if( gridDescription.rows[ a ].weight )
			total += gridDescription.rows[ a ].weight;
		else if( gridDescription.rows[ a ].pixelHeight )
			pixels += gridDescription.rows[ a ].pixelHeight;
	}
	let unit = total / gridDescription.rows.length;
	
	// Add objects
	for( let a = 0; a < gridDescription.rows.length; a++ )
	{
		let row = gridDescription.rows[ a ];
		let create = false;
		
		// Check if we need to create dom node
		// TODO: Perhaps children should be gotten by unique ID to prevent drifting of child objects
		let d = false;
		if( this.domNodes.length > a )
			d = this.domNodes[ a ];
		else
		{
			// Create dom object
			d = document.createElement( 'div' );
			d.style.position = 'absolute';
			d.style.left = '0px';
			d.style.width = '100%';
			d.style.boxSizing = 'border-box';
			d.style.backgroundColor = 'rgb(' + ( Math.random() % 255 ) + ',' + ( Math.random() % 255 ) + ',' + ( Math.random() % 255 ) + ')';
			create = true;
		}
		
		if( !d ) continue;
		
		// Take account of pixel heights
		if( pixels > 0 )
		{
			if( t > 0 )
			{
				d.style.top = 'calc(' + pt + '% + ' + t + 'px)';
			}
			else
			{
				d.style.top = pt + '%';
			}
			
			if( row.weight )
			{
				let pct = row.weight / total * 100;
				d.style.height = 'calc(' + pct + '% - ' + pixels + 'px)';
				pt += pct;
			}
			else if( row.pixelHeight )
			{
				d.style.height = row.pixelHeight + 'px';
				t += row.pixelHeight;
			}
			else continue;
		}
		// Just percentages
		else if( row.weight )
		{
			d.style.height = row.weight / total * 100 + '%';
			d.style.top = pt + '%';
			pt += d.style.height;
		}
		else continue;
		
		if( create )
			this.dom.appendChild( d );
		
		this.domNodes[ a ] = d; // Memorize!
		
		if( !row.columns ) continue;
		
		// Do the columns.............................
		let l = pl = 0;
		let rpixels = 0;
		let rtotal = 0;
		for( let b = 0; b < row.columns.length; b++ )
		{
			if( row.columns[ b ].weight )
				rtotal += row.columns[ b ].weight;
			else if( row.columns[ b ].pixelHeight )
				rpixels += row.columns[ b ].pixelHeight;
		}
		
		for( let b = 0; b < row.columns.length; b++ )
		{
			create = false;
			
			let column = row.columns[ b ];
			
			// Check if we need to create dom node
			// TODO: Perhaps children should be gotten by unique ID to prevent drifting of child objects
			let r = false;
			if( d.children && d.children.length > b )
				r = d.children[ b ];
			else
			{
				if( !d.children ) d.children = [];
				
				// Create dom object
				r = document.createElement( 'div' );
				r.style.position = 'absolute';
				r.style.left = '0px';
				r.style.height = '100%';
				r.style.boxSizing = 'border-box';
				r.style.backgroundColor = 'rgb(' + ( Math.random() % 255 ) + ',' + ( Math.random() % 255 ) + ',' + ( Math.random() % 255 ) + ')';
				create = true;
			}
		
			// Take account of pixel heights
			if( pixels > 0 )
			{
				if( t > 0 )
				{
					r.style.top = 'calc(' + pl + '% + ' + l + 'px)';
				}
				else
				{
					r.style.top = pl + '%';
				}
			
				if( column.weight )
				{
					let pct = column.weight / total * 100;
					r.style.height = 'calc(' + pct + '% - ' + rpixels + 'px)';
					pl += pct;
				}
				else if( column.pixelHeight )
				{
					r.style.height = column.pixelHeight + 'px';
					l += column.pixelHeight;
				}
				else continue;
			}
			// Just percentages
			else if( column.weight )
			{
				r.style.height = column.weight / rtotal * 100 + '%';
				r.style.top = pl + '%';
				pl += r.style.height;
			}
			else continue;
		
			if( create )
				d.appendChild( r );
			
			d.children[ b ] = r; // Memorize!
		}
	}
	
	return this.getChildren();
}

