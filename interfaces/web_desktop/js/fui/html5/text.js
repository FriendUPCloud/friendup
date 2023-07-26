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
	fui.Text = fui.inherit( fui.Group.prototype );

	fui.Text.prototype.create = function( flags )
	{
		this.dom = false;
	
		// default flags
		this.flags = {
			width: '100%',
			height: 'auto',
			top: 'auto',
			left: 'auto',
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

	fui.Text.prototype.setFlag = function( key, value )
	{
		// New keys
		switch( key )
		{
			case 'label':
				this.flags.label = value;
				return true;
			case 'weight':
				if( value == 'bold' || value == 'normal' )
				{
					this.flags.weight = value;
					return true;
				}
				break;
			case 'text':
				this.flags.text = value;
				return true;
			case 'icon':
				this.flags.icon = value;
				return true;
			case 'margin':
				if( value === true || value === false )
				{
					this.flags.margin = value;
					return true;
				}
				break;
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
			case 'event':
				if( typeof( value ) == 'object' )
				{
					this.flags.event = value;
					return true;
				}
				break;
		}
	}

	fui.Text.prototype.show = function( bool )
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
					var ex = '';
					if( this.flags.icon )
					{
						ex = ' IconSmall ' + this.flags.icon;
					}
				
					// Build the whole ui
					var baseDivs = [
						{ 
							type: 'div', 
							className: 'FUIText' + ex, 
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
						text.innerHTML = ( ex ? ' ' : '' ) + this.flags.text;
					}
				
					// Read flags
					if( this.flags.border )
					{
						var cl = this.flags.border.charAt( 0 ).toUpperCase() +
							this.flags.border.substr( 1, this.flags.border.length - 1 );
						d.classList.add( 'FUIBorder' + cl );
					}
					if( this.flags.width )
					{
						d.style.width = this.flags.width;
					}
					if( this.flags.height )
					{
						d.style.height = this.flags.height;
					}
					if( this.flags.weight )
					{
						d.style.fontWeight = this.flags.weight;
					}
					if( this.flags.margin )
					{
						d.classList.add( 'Margin' );
					}
					if( this.flags.padding )
					{
						d.style.padding = this.flags.padding + 'px';
					}
					var paddings = [ 'Left', 'Right', 'Bottom', 'Top' ];
					for( var u = 0; u < paddings.length; u++ )
					{
						if( this.flags[ 'padding' + paddings[ u ] ] >= 0 )
						{
							d.style[ 'padding' + paddings[ u ] ] = this.flags[ 'padding' + paddings[ u ] ] + 'px';
						}
					}
					if( this.flags.event )
					{
						var evt = this.flags.event;
						d.onclick = function( e )
						{
							eval( evt.functionName + '(' + ( evt.arguments ? evt.arguments : '' ) + ')' );
						}
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
	fui.addCSS( `
.FUIText
{
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	color: ${fui.theme.colors.textColor};
	box-sizing: border-box;
}
	` );
}, 'Group' );
