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
	// Inherit from the base class
	fui.Group = fui.inherit( fui.Base.prototype );

	fui.Group.prototype.create = function( flags )
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

	/**
	 * Set a view window flag
	 *
	 * args:    key {string}, value {mixed}
	 * returns: true | false
	 *
	 */
	fui.Group.prototype.setFlag = function( key, value )
	{
		switch( key )
		{
			// x-index based elements
			case 'columns':
				if( parseInt( value ) > 0 )
				{
					this.flags.columns = value;
					this.flags.rows = 0;
					this.flags.stacks = 0;
				}
				break;
			// y-index based elements
			case 'rows':
				if( parseInt( value ) > 0 )
				{
					this.flags.rows = value;
					this.flags.stacks = 0;
					this.flags.columns = 0;
				}
				break;
			// z-index based elements
			case 'stacks':
				if( parseInt( value ) > 0 )
				{
					this.flags.stacks = value;
					this.flags.rows = 0;
					this.flags.columns = 0;
				}
				break;
			// Sizes of rows / columns / stacks
			case 'sizes':
				this.flags.sizes = value;
				break;
			case 'radius':
				if( parseInt( value ) > 0 )
				{
					this.flags.radius = value;
					return true;
				}
				return false;
			case 'width':
				if( parseInt( value ) > 0 )
				{
					this.flags.width = value;
					return true;
				}
				else if( value.indexOf && value.indexOf( 'calc(' ) == 0 )
				{
					this.flags.width = value;
				}
				else if( 
					typeof( value ) == 'string' && 
					value.substr( value.length - 1, 1 ) == '%' && 
					parseInt( value.substr( 0, value.length - 2 ) ) > 0 
				)
				{
					this.flags.width = value;
					return true;
				}
				return false;
			case 'height':
				if( parseInt( value ) > 0 )
				{
					this.flags.height = value;
					return true;
				}
				else if( value.indexOf && value.indexOf( 'calc(' ) == 0 )
				{
					this.flags.height = value;
				}
				else if( 
					typeof( value ) == 'string' && 
					value.substr( value.length - 1, 1 ) == '%' && 
					parseInt( value.substr( 0, value.length - 2 ) ) > 0 
				)
				{
					this.flags.height = value;
					return true;
				}
				return false;
			case 'top':
				if( parseInt( value ) >= 0 )
				{
					this.flags.top = value;
					return true;
				}
				return false;
			case 'left':
				if( parseInt( value ) >= 0 )
				{
					this.flags.left = value;
					return true;
				}
				return false;
			case 'padding':
				if( parseInt( value ) >= 0 )
				{
					this.flags.padding = value;
					return true;
				}
				return false;
			case 'paddingLeft':
				if( parseInt( value ) >= 0 )
				{
					this.flags.paddingLeft = value;
					return true;
				}
				return false;
			case 'paddingRight':
				if( parseInt( value ) >= 0 )
				{
					this.flags.paddingRight = value;
					return true;
				}
				return false;
			case 'paddingTop':
				if( parseInt( value ) >= 0 )
				{
					this.flags.paddingTop = value;
					return true;
				}
				return false;
			case 'paddingBottom':
				if( parseInt( value ) >= 0 )
				{
					this.flags.paddingBottom = value;
					return true;
				}
				return false;
			case 'margin':
				if( parseInt( value ) >= 0 )
				{
					this.flags.margin = value;
					return true;
				}
				return false;
			case 'marginLeft':
				if( parseInt( value ) >= 0 )
				{
					this.flags.marginLeft = value;
					return true;
				}
				return false;
			case 'marginRight':
				if( parseInt( value ) >= 0 )
				{
					this.flags.marginRight = value;
					return true;
				}
				return false;
			case 'marginTop':
				if( parseInt( value ) >= 0 )
				{
					this.flags.marginTop = value;
					return true;
				}
				return false;
			case 'marginBottom':
				if( parseInt( value ) >= 0 )
				{
					this.flags.marginBottom = value;
					return true;
				}
				return false;
			case 'border':
				switch( value )
				{
					case 'top':
					case 'left':
					case 'right':
					case 'bottom':
					case 'solid':
						this.flags.border = value;
						return true;
					case 'none':
						this.flags.border = 'none';
						return true;
				}
				return false;
			case 'background':
				this.flags.background = value;
				break;
			case 'valign':
				if( value == 'top' || value == 'middle' || value == 'bottom' )
				{
					this.flags.valign = value;
					return true;
				}
				break;
			case 'halign':
				if( value == 'left' || value == 'right' || value == 'center' )
				{
					this.flags.halign = value;
					return true;
				}
				break;
			case 'show':
				if( value === true || value === false )
				{
					this.flags.show = value;
				
					// Show if that's what we want
					if( this.flags.show ) this.show( true ); 
					else this.show( false );
				
					return true;
				}
				break;
			case 'overflow':
				if( value == 'scroll' || value == 'hidden' || value == 'auto' )
				{
					this.flags.overflow = value;
					return true;
				}
				break;
			case 'surface':
				if( typeof( value ) == 'object' )
				{
					this.flags.surface = value;
					this.parent = value;
				}
				else if( typeof( value ) == 'string' )
				{
					this.flags.surface = ge( value );
					this.parent = this.flags.surface;
				}
				break;
		}
	}
	
	// Processor for children
	fui.Group.prototype.childProcessor = function( ele, index )
	{
		if( !this.flags.sizes ) return;
		
		var size = this.flags.sizes[ index ];
	
		if( this.flags.rows > 0 )
		{
			ele.style.height = size;
		}
		else if( this.flags.columns > 0 )
		{
			var d = document.createElement( 'div' );
			d.className = 'FUIGroupColumn';
			if( this.flags.padding )
			{
				d.style.padding = this.flags.padding;
			}
			d.style.width = size;
			if( this.flags.valign )
			{
				ele.style.verticalAlign = this.flags.valign;
				ele.style.display = 'inline-block';
			}
			if( this.flags.halign )
			{
				ele.style.textAlign = this.flags.halign;
				ele.style.display = 'inline-block';
			}
			ele.parentNode.replaceChild( d, ele );
			d.appendChild( ele );
		}
		// Stacks will only be supported in VR
		else if( this.flags.stacks > 0 )
		{
			if( index > 0 )
				ele.style.display = 'none';
		}
		return false;
	};

	fui.Group.prototype.show = function( bool )
	{
		var self = this;
	
		if( this.parent )
		{
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
							className: this.baseClassName, 
							width: this.flags.width, 
							height: this.flags.height,
							label: 'content',
							name: this.flags.name ? this.flags.name : false,
							background: this.flags.background,
							childConstructor: this.childrenConstructor
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
						group.classList.add( 'FUIBorder' + cl );
					}
					if( this.flags.width )
					{
						group.style.width = this.flags.width;
					}
					if( this.flags.height )
					{
						group.style.height = this.flags.height;
					}
					if( this.flags.radius )
					{
						group.style.borderRadius = this.flags.radius + 'px';
					}
					if( this.flags.overflow )
					{
						group.style.overflow = this.flags.overflow;
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
					if( this.flags.margin )
					{
						console.log( 'Got margin: ' + this.flags.margin );
						group.style.margin = this.flags.margin + 'px';
					}
					var margins = [ 'Left', 'Right', 'Bottom', 'Top' ];
					for( var u = 0; u < margins.length; u++ )
					{
						if( this.flags[ 'margin' + margins[ u ] ] >= 0 )
						{
							group.style[ 'margin' + margins[ u ] ] = this.flags[ 'margin' + margins[ u ] ] + 'px';
						}
					}
					// Done reading flags
				
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
			// Can be used to catch created elements to add content
			if( this.dom && this.shown )
			{
				this.shown( this.dom );
			}
			return this;
		}
		return false;
	}
	fui.addCSS( `
.FUIGroup
{
	box-sizing: border-box;
}
.FUIGroupColumn
{
	box-sizing: border-box;
	display: inline-block;
	position: relative;
	height: 100%;
	vertical-align: top;
}
.FUIGroupColumn:first-child
{
	padding-right: 0 !important;
}
	` );
}, 'Base' );
