/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

fui.addClass( function()
{
	fui.List = fui.inherit( fui.Group.prototype );

	fui.List.prototype.construct = function()
	{
		this.columns = [ 'Column1' ];
		this.entries = [];
		this.events = [];
	}
	
	fui.List.prototype.create = function( flags )
	{
		this.dom = false;
	
		this.baseClassName = 'FUIGroup';
	
		// default flags
		this.flags = {
			width: '100%',
			height: '100%',
			top: 'auto',
			left: 'auto',
			border: 0,
			background: 'none',
			margin: 0,
			surface: false
		};
	
		// Default to parent is always surface
		this.parent = this.flags.surface;
	
		// Needs to be set first
		if( flags.surface )
			this.setFlag( 'surface', flags.surface );
	
		// Set flags
		for( var a in flags )
		{
			if( a == 'surface' ) continue;
			this.setFlag( a, flags[a] );
		}
	
		return this;
	}
	
	fui.List.prototype.setFlag = function( key, value )
	{
		switch( key )
		{
			case 'sortColumn':
				this.flags.sortColumn = value;
				return true;
			case 'sortOrder':
				this.flags.sortOrder = ( value == 'asc' || value == 'desc' ) ? value : 'asc';
				return true;
		}
	}
	
	// Add an event to the list
	fui.List.prototype.addEvent = function( target, eventType, eventHandler )
	{
		target.addEventListener( eventType, eventHandler );
		this.events.push( { target: target, eventType: eventType, eventHandler: eventHandler } );
		return eventHandler;
	}
	
	fui.List.prototype.removeEvent = function( eventHandler )
	{
		var o = [];
		for( var a = 0; a < this.events.length; a++ )
		{
			if( this.events[ a ].eventHandler != event )
			{
				o.push( this.events[ a ] );
			}
			else
			{
				event.target.removeEventListener( event.eventType, event.eventHandler );
			}
		}
	}

	fui.List.prototype.show = function( bool )
	{
		var self = this;
	
		if( this.parent )
		{
			// When we want it visible, and it isn't
			if( bool && !this.visible )
			{
				this.visible = true;
				if( this.dom )
				{
					this.dom.style.visibility = '';
					this.dom.style.pointerEvents = '';
				}
				else
				{
					// Build the whole ui
					var baseDivs = false;
					if( this.baseDivs ) baseDivs = this.baseDivs;
					else
					{
						baseDivs = [ { 
							type: 'div', 
							className: 'FUIList', 
							width: this.flags.width, 
							height: this.flags.height,
							name: this.flags.name ? this.flags.name : false,
							label: 'content'
						} ];
					}
				
					this.dom = this.build( baseDivs, this.parent );
					this.domContent = this.get( 'content' );
				
					var d = this.dom;
					var group = this.domContent;
				
					// Read flags
					if( this.flags.border )
					{
						var cl = this.flags.border.charAt( 0 ).toUpperCase() +
							this.flags.border.substr( 1, this.flags.border.length - 1 );
						group.classList.add( 'Border' + cl );
					}
					if( this.flags.width )
					{
						group.style.width = this.flags.width;
					}
					if( this.flags.height )
					{
						group.style.height = this.flags.height;
					}
					if( this.flags.padding )
					{
						group.style.padding = this.flags.padding + 'px';
					}
					var paddings = [ 'Left', 'Right', 'Bottom', 'Top' ];
					for( var u = 0; u < paddings.length; u++ )
					{
						if( this.flags[ 'padding' + paddings[ u ] ] >= 0 )
						{
							group.style[ 'padding' + paddings[ u ] ] = this.flags[ 'padding' + paddings[ u ] ] + 'px';
						}
					}
					// Done reading flags
				
					// Draw first time
					this.redraw();
				
				
					this.ondestroy = function()
					{
						d.parentNode.removeChild( d );
					}
				
					// Close gadget
					var close = this.get( 'close', d );
					if( close ) close.onclick = function(){ self.destroy(); }
				}
			}
			else
			{
				if( this.visible && this.dom )
				{
					this.visible = false;
					this.dom.style.visibility = 'hidden';
					this.dom.style.pointerEvents = 'none';
				}
			}
			return this;
		}
		return false;
	}

	/**
	 * Adds an entry to the list
	 */
	fui.List.prototype.addEntry = function( entry, where )
	{
		if( !where || where == 'end' )
		{
			this.entries.push( entry );
			this.redraw();
			return true;
		}
		return false;
	}

	/**
	 * Removes an entry from the list
	 */
	fui.List.prototype.removeEntry = function( num )
	{
		var out = [];
		var found = False;
		for( var a = 0; a < this.entries.length; a++ )
		{
			if( a == num )
			{
				found = true;
				continue;
			}
			out.push( this.entries[ a ] );
		}
		this.entries = out;
		if( found ) this.redraw();
		return found;
	}
	
	/**
	 * Just remove the entries and redraw
	 */
	fui.List.prototype.clearEntries = function()
	{
		this.entries = [];
		this.redraw();
	}

	/**
	 * Sets the columns
	 * Can be set with a plain array list with column names or with
	 * types
	 */
	fui.List.prototype.setColumns = function( cols )
	{
		// Plain format
		this.mode = 'straight';
		if( typeof cols == 'Array' )
		{
			this.columns = cols;
			this.redraw();
			return true;
		}
		// Else it is a complex format
		else
		{
			this.columns = [];
			this.mode = 'complex';
			var colsSet = 0;
			for( var a in cols )
			{	
				this.columns.push( cols[a] );
				colsSet++;
			}
			if( colsSet > 0 )
			{
				this.redraw();
				return true;
			}
		}
		return false;
	}

	/**
	 * Redraws the list
	 */
	fui.List.prototype.redraw = function()
	{
		// Undefined mode
		if( !this.mode )
		{
			this.mode = 'complex';
			this.columns = [ { label: 'Initializing...' } ];
		}
		
		// Straight and simple
		if( this.mode == 'straight' )
		{
			var d = '';
			if( !this.columns || !this.columns.length ) return false;
			if( !this.entries || !this.entries.length ) return false;
			var w = Math.floor( 100 / this.columns.length );
			if( w == 33 ) w = '33';
			else if( w == 66 ) w = '66';
			else
			{
				w = Math.floor( w / 5 ) * 5;
			}
			d += '<div class="FUIListColumns">';
			for( var a = 0; a < this.columns.length; a++ )
			{
				d += '<div class="FUIListColumn FUIWidth' + w + '">' + this.columns[a] + '</div>';
			}
			d += '</div>';
			d += '<div class="FUIListRows">';
			for( var a = 0; a < this.entries.length; a++ )
			{
				d += '<div class="FUIListRow">';
				for( var c = 0; c < this.columns.length; c++ )
				{
					var f = c < this.entries[ a ].length ? this.entries[ a ][ c ] : '';
					d += '<div class="FUIListField FUIWidth' + w + '">' + f + '</div>';
				}
				d += '</div>';
			}
			d += '</div>';
			this.domContent.innerHTML = d;
			var cols = this.domContent.getElementsByClassName( 'FUIListColumn' );
			var rows = this.domContent.getElementsByClassName( 'FUIListRow' );
			if( rows.length && cols.length )
			{
				var tw = cols[0].parentNode.offsetWidth;
				for( var a = 0; a < this.columns.length - 1; a++ )
				{
					if( cols[a] )
					{
						cols[a].style.width = rows[0].childNodes[a].offsetWidth + 'px';
						tw -= rows[0].childNodes[a].offsetWidth;
					}
				}
				cols[ this.columns.length - 1 ].style.width = tw + 'px'; 
			}
		}
		// Complex mode
		else
		{
			// 0. Make container
			var listCont = document.createElement( 'div' );
			listCont.className = 'FUIListContainer';
			
			// 1. Draw column headers
			var headCont = document.createElement( 'div' );
			headCont.className = 'FUIListHeaderContainer';
			// Precalculate width for one column (include column spans)
			var width = 0;
			for( var a = 0; a < this.columns.length; a++ )
			{
				width += this.columns[ a ].span ? this.columns[ a ].span : 1;
			}
			width = 100 / width;
			for( var a = 0; a < this.columns.length; a++ )
			{
				var head = document.createElement( 'div' );
				head.className = 'FUIListHeaderColumn';
				head.style.width = width * ( this.columns[ a ].span ? this.columns[ a ].span : 1 ) + '%';
				head.innerHTML = '<span>' + this.columns[ a ].label + '</span>';
				headCont.appendChild( head );
			}
			listCont.appendChild( headCont );
			
			var aRow = null;
			
			// 2. Draw data
			if( this.entries.length >= 1 )
			{
				// Width of a column (they never span)
				width = 100 / this.entries[ 0 ].length;
				
				var dataCont = document.createElement( 'div' );
				dataCont.className = 'FUIListDataContainer';
				for( var a = 0; a < this.entries.length; a++ )
				{
					var row = document.createElement( 'div' );
					row.className = 'FUIListDataRow';
					
					for( var b in this.entries[ a ] )
					{
						var en = this.entries[ a ][ b ];
						if( !en.type ) continue; // We need a type
						if( 
							en.type == 'text' || en.type == 'input' || 
							en.type == 'button' || en.type == 'image'
						)
						{
							var colset = false;
							var col = document.createElement( 'div' );
							col.className = 'FUIListDataColumn';
							col.style.width = width + '%';
							if( en.type == 'text' )
							{
								colset = true;
								col.innerHTML = '<span class="FUIText">' + en.text + '</span>';
							}
							else if( en.type == 'input' )
							{
								colset = true;
								col.innerHTML = '<div class="FUIInput"><input type="text" value="' + ( en.value ? en.value : '' ) + '"/></div>';
							}
							else if( en.type == 'button' )
							{
								colset = true;
								var cl = ' class="FUIButton"';
								if( en.icon )
								{
									cl = ' class="FUIButton IconSmall ' + en.icon + '"';
									en.text = ' ' + en.text;
								}
								var enev = '';
								if( en.event )
								{
									enev = ' onclick="' + en.event.functionName + '(' + en.event.arguments + ')"';
								}
								col.innerHTML = '<div class="FUIButtonContainer"><button type="button"' + cl + enev + '>' + ( en.text ? en.text : '' ) + '</button></div>';
							}
							else if( en.type == 'image' )
							{
								colset = true;
								col.innerHTML = '<div class="FUImage" style="background-image: url(\'' + getWebUrl( en.src ) + '\')"/></div>';
							}
							// Add column to row if it indeed was set.
							if( colset )
							{
								row.appendChild( col );
							}
						}
					}
					// Add row to data container
					dataCont.appendChild( row );
					
					if( aRow == null ) 
					{
						aRow = row;
					}
				}
				listCont.appendChild( dataCont );
			}
			
			// 3. Add children
			if( this.domContent.firstChild )
			{
				var fc = this.domContent.firstChild;
				this.domContent.replaceChild( listCont, fc );
			}
			else
			{
				this.domContent.appendChild( listCont );
			}
			
			// 4. Check scrollbars
			if( aRow )
			{
				if( this.resizeEvent )
					this.removeEvent( window, 'resize', this.resizeEvent );
				this.resizeEvent = function()
				{
					if( aRow )
					{
						headCont.style.width = aRow.offsetWidth + 'px';
					}
				};
				this.addEvent( window, 'resize', this.resizeEvent );
				this.resizeEvent();
			}
		}
		return true;
	}
	// Add our special CSS for this
	fui.addCSS( `
.FUIList
{
	overflow: hidden;
	position: relative;
	width: 100%;
	height: 100%;
}
.FUIListContainer
{ 
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	overflow: hidden;
	border-top: 1px solid ${fui.theme.colors.borderColor};
	border-left: 1px solid ${fui.theme.colors.borderColor};
	border-bottom: 1px solid ${fui.theme.colors.borderColor};
	border-right: 1px solid ${fui.theme.colors.borderColor};
	box-sizing: border-box;
}
.FUIListHeaderContainer
{
	position: 
	absolute; 
	top: 0; 
	left: 0; 
	width: 100%; 
	height: ${fui.theme.dimensions.switchListHeight}; 
	box-sizing: border-box; 
	border-bottom: 1px solid ${fui.theme.colors.borderColor}; 
}
.FUIListHeaderColumn
{
	padding: ${fui.theme.spacing.switchListPadding};
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
	line-height: ${fui.theme.dimensions.switchListLineHeight};
	height: ${fui.theme.dimensions.switchListHeight};
	position: relative;
	display: inline-block;
	box-sizing: border-box;
	border-right: 1px solid ${fui.theme.colors.borderColor}; 
	font-weight: ${fui.theme.font.headerWeight};
}
.FUIListHeaderColumn:last-child
{
	border-right: 0;
}
.FUIListDataContainer
{
	position: absolute;
	top: ${fui.theme.dimensions.switchListHeight};
	left: 0;
	width: 100%;
	height: calc(100% - 35px); 
	overflow: auto; 
}
.FUIListDataRow
{
	height: ${fui.theme.dimensions.switchListHeight};
	position: relative; 
	width: 100%; 
}
.FUIListDataRow:nth-child(odd)
{
	background-color: ${fui.theme.colors.switchListOdd};
}
.FUIListDataRow:nth-child(even)
{
	background-color: ${fui.theme.colors.switchListEven};
}
.FUIListDataColumn
{
	height: ${fui.theme.dimensions.switchListHeight};
	line-height: ${fui.theme.dimensions.switchListLineHeight};
	padding: ${fui.theme.spacing.switchListPadding};
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
	position: relative; 
	display: inline-block; 
	box-sizing: border-box; 
	border-right: 1px solid ${fui.theme.colors.borderColor};
}
.FUIListDataColumn:last-child
{
	border-right: 0;
}
.FUIListDataColumn > .FUIButtonContainer
{
	position: relative;
	width: 100%;
	height: 100%;
}
.FUIListDataColumn > .FUIButtonContainer > button
{
	position: relative;
	display: block;
	width: 100%;
}
	` );
}, 'Group' );
