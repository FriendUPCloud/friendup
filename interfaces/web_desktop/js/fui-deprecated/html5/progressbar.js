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
	fui.Progressbar = fui.inherit( fui.Group.prototype );

	fui.Progressbar.prototype.create = function( flags )
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

	fui.Progressbar.prototype.setFlag = function( key, value )
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
			case 'scope':
				this.flags.scope = parseFloat( value );
				break;
			case 'value':
				this.flags.value = parseFloat( value );
				break;
			case 'margin':
				if( value === true || value === false )
				{
					this.flags.margin = value;
					return true;
				}
				break;
		}
	}

	fui.Progressbar.prototype.show = function( bool )
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
				
					// Build the whole ui
					var baseDivs = [
						{ 
							type: 'div', 
							className: 'FUIProgressbar' + ex, 
							width: this.flags.width, 
							height: this.flags.height,
							label: 'label',
							name: this.flags.name ? this.flags.name : false,
							children: [
								{
									type: 'div',
									className: 'FUIProgressbarFrame',
									width: '100%',
									height: '100%',
									label: 'label',
									children: [
										{
											type: 'div',
											className: 'FUIProgressbarBar',
											width: '100%',
											height: '100%',
											label: 'label'
										}
									]
								}
							]
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
	fui.addCSS( `
.FUIProgressbar
{
	position: relative;
	overflow: hidden;
	transition: background-color 0.2s;
	text-overflow: ellipsis;
	white-space: nowrap;
	background: ${fui.theme.colors.buttonBackground};
	color: ${fui.theme.colors.buttonColor};
	border: ${fui.theme.border.buttonSize} ${fui.theme.border.buttonType} ${fui.theme.border.buttonColor};
	box-sizing: border-box;
	padding: ${fui.theme.spacing.buttonPadding};
	border-radius: ${fui.theme.border.buttonRadius};
	text-align: ${fui.theme.alignments.button};
	text-shadow: ${fui.theme.shadow.buttonTextShadow};
}
.FUIProgressbar > .FUIProgressbarFrame
{
	border: 1px solid black;
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}
.FUIProgressbar > .FUIProgressbarFrame > .FUIProgressbarBar
{
	border: 0;
	background-color: red;
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}
	` );
}, 'Group' );
