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

fui.addClass( function()
{
	// Inherit from the base class
	fui.Silly = fui.inherit( fui.Group.prototype );

	fui.Silly.prototype.setFlag = function( key, value )
	{
		// New keys
		switch( key )
		{
			case 'sillytest':
				this.flags.label = value;
				return true;
		}
	}
}, 'Group' );

fui.addClass( function()
{
	fui.Empty = fui.inherit( fui.Group.prototype );
	
	fui.Empty.prototype.show = function( bool )
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
							className: 'FUIEmpty', 
							label: 'content',
							name: this.flags.name ? this.flags.name : false
						} ];
					}
				
					this.dom = this.build( baseDivs, this.parent );
					this.domContent = this.get( 'content' );
				
					var d = this.dom;
					var group = this.domContent;
				
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
	};
}, 'Group' );
