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
