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
fui.Button = fui.inherit( fui.Group.prototype, fui.Silly.prototype );

fui.Button.prototype.create = function( flags )
{
	this.dom = false;
	
	// default flags
	this.flags = {
		width: '100%',
		height: 'auto',
		top: 'auto',
		left: 'auto',
		border: 'solid',
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

fui.Button.prototype.setFlag = function( key, value )
{
	// New keys
	switch( key )
	{
		case 'label':
			this.flags.label = value;
			return true;
		case 'text':
			this.flags.text = value;
			return true;
		case 'margin':
			if( value === true || value === false )
			{
				this.flags.margin = value;
				return true;
			}
			break;
	}
}

fui.Button.prototype.show = function( bool )
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
				var baseDivs = [
					{ 
						type: 'div', 
						className: 'FUIButton', 
						width: this.flags.width, 
						height: this.flags.height,
						label: 'label',
						name: this.flags.name ? this.flags.name : false
					},
				];
				
				this.dom = this.build( baseDivs );
				this.domContent = this.get( 'label' );
				
				var d = this.dom;
				var text = this.domContent;
				
				if( this.flags.text )
				{
					text.innerHTML = this.flags.text;
				}
				
				// Read flags
				if( this.flags.border )
				{
					var cl = this.flags.border.charAt( 0 ).toUpperCase() +
						this.flags.border.substr( 1, this.flags.border.length - 1 );
					d.classList.add( 'Border' + cl );
				}
				if( this.flags.width )
				{
					d.style.width = this.flags.width;
				}
				if( this.flags.height )
				{
					d.style.height = this.flags.height;
				}
				if( this.flags.margin )
				{
					d.classList.add( 'Margin' );
				}
				
				this.ondestroy = function()
				{
					d.parentNode.removeChild( d );
				}
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
