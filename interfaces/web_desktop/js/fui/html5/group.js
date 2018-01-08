/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

// Inherit from the base class
fui.Group = fui.inherit( fui.Base.prototype );

fui.Group.prototype.create = function( flags )
{
	this.dom = false;
	
	this.baseClassName = 'FUIGroup';
	
	// default flags
	this.flags = {
		width: '100%',
		height: 'auto',
		top: 'auto',
		left: 'auto',
		border: 'solid',
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
		case 'width':
			if( parseInt( value ) > 0 )
			{
				this.flags.width = value;
				return true;
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
		case 'border':
			switch( value )
			{
				case 'solid':
					this.flags.border = 'solid';
					return true;
				case 'none':
					this.flags.border = 'none';
					return true;
			}
			return false;
		case 'background':
			this.flags.background = value;
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
		case 'surface':
			if( typeof( value ) == 'object' )
			{
				this.flags.surface = value;
				this.parent = value;
			}
			break;
	}
}

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
						background: this.flags.background
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
