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
	fui.Screen = fui.inherit( fui.Base.prototype );

	/**
	 * Create a screen with flags
	 *
	 * args:    flags {flag object}
	 * returns: reference to self
	 *
	 */
	fui.Screen.prototype.create = function( flags )
	{
		// Primary dom node
		this.dom = false;
		this.domContent = false;
	
		// Default values
		this.flags = {
			width: '100%',
			height: '100%',
			title: 'Unnamed screen',
			resize: true,
			volume: false,
			scrollx: 'auto',
			scrolly: 'auto',
			borderless: false,
			top: 'auto',
			left: 'auto',
			right: 'auto',
			bottom: 'auto',
			depth: true,
			close: true,
			zoom: true,
			show: false,
			minimize: false,
			background: 'none',
			surface: document.body
		};
	
		// Default to parent is always surface
		this.parent = this.flags.surface;
	
		if( flags )
		{
			// Needs to be set first
			if( flags.surface )
				this.setFlag( 'surface', flags.surface );
	
			// Set flags
			for( var a in flags )
			{
				if( a == 'surface' ) continue;
				this.setFlag( a, flags[a] );
			}
		}
	
		return this;
	}

	/**
	 * Set a screen flag
	 *
	 * args:    key {string}, value {mixed}
	 * returns: true | false
	 *
	 */
	fui.Screen.prototype.setFlag = function( key, value )
	{
		// Check supported flags
		switch( key )
		{
			case 'title':      this.flags.title = value + ''; return true;
			case 'resize':
				if( value === true || value === false )
				{
					this.flags.resize = value;
					return true;
				}
				break;
			case 'borderless':
				if( value === true || value === false )
				{
					this.flags.borderless = value;
					return true;
				}
				break;
			case 'volume':
				if( value === true || value === false )
				{
					this.flags.volume = value;
					return true;
				}
				break;
			case 'depth':
				if( value === true || value === false )
				{
					this.flags.depth = value;
					return true;
				}
				break;
			case 'close':
				if( value === true || value === false )
				{
					this.flags.close = value;
				}
				break;
			case 'zoom':
				if( value === true || value === false )
				{
					this.flags.zoom = value;
				}
				break;
			case 'minimize':
				if( value === true || value === false )
				{
					this.flags.minimize = value;
				}
				break;
			case 'borderless':
				if( value === true || value === false )
				{
					this.flags.borderless = value;
				}
				break;
			case 'scrollx': 
				if( value === true || value === false || value === 'auto' )
				{
					this.flags.scrollx = value;
					return true;
				}
				break;
			case 'scrolly':
				if( value === true || value === false || value === 'auto' )
				{
					this.flags.scrolly = value;
					return true;
				}
				break;
			case 'top':
				if( value >= 0 || value === 'auto' )
				{
					this.flags.top = value;
					return true;
				}
				break;
			case 'marginTop':
				if( value >= 0 || value === 'auto' )
				{
					this.flags.marginTop = value;
					return true;
				}
				break;
			case 'marginLeft':
				if( value >= 0 || value === 'auto' )
				{
					this.flags.marginLeft = value;
					return true;
				}
				break;
			case 'marginRight':
				if( value >= 0 || value === 'auto' )
				{
					this.flags.marginRight = value;
					return true;
				}
				break;
			case 'marginBottom':
				if( value >= 0 || value === 'auto' )
				{
					this.flags.marginBottom = value;
					return true;
				}
				break;
			case 'left':
				if( value >= 0 || value === 'auto' )
				{
					this.flags.left = value;
					return true;
				}
				break;
			case 'right':
				if( value >= 0 || value === 'auto' )
				{
					this.flags.right = value;
					return true;
				}
				break;
			case 'bottom':
				if( value >= 0 || value === 'auto' )
				{
					this.flags.bottom = value;
					return true;
				}
				break;
			case 'width':
				if( value >= 100 || value === '100%' || value === '50%' )
				{
					this.flags.width = value;
					return true;
				}
				break;
			case 'height':
				if( value >= 100 || value === '100%' || value === '50%' )
				{
					this.flags.height = value;
					return true;
				}
				break;
			case 'background':
				this.flags.background = value;
				return true;
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
		return false;
	}

	/**
	 * Show the screen
	 *
	 * args:   bool {boolean}
	 * return: true | false
	 *
	 */
	fui.Screen.prototype.show = function( bool )
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
					var baseDivs;
				
					if( this.flags.borderless )
					{
						baseDivs = [
							{ 
								type: 'div', className: 'FUIScreen Borderless', children: [
									{ type: 'div', className: 'FUIScreenBorderlessContent', label: 'content' }
								], 
								width: this.flags.width, 
								height: this.flags.height,
								top: this.flags.top,
								left: this.flags.left,
								right: this.flags.bottom,
								bottom: this.flags.bottom,
								background: this.flags.background
							},
						];
					}
					else
					{
						baseDivs = [
							{ 
								type: 'div', className: 'FUIScreen', children: [
									{ type: 'div', className: 'FUIScreenTitle', children: [
										{ type: 'div', className: 'FUIScreenGadgetTitle', content: this.flags.title, label: 'title' },
										{ type: 'div', className: 'FUIScreenGadgetExtras' },
										{ type: 'div', className: 'FUIScreenGadgetDepth' },
									] },
									{ type: 'div', className: 'FUIScreenFrame', label: 'frame' },
									{ type: 'div', className: 'FUIScreenContent', label: 'content' }
								], 
								width: this.flags.width, 
								height: this.flags.height, 
								top: this.flags.top,
								left: this.flags.left,
								right: this.flags.bottom,
								bottom: this.flags.bottom,
								background: this.flags.background
							},
						];
					}
				
					this.dom = this.build( baseDivs, this.parent );
				
					var d = this.dom;
					var cont = this.get( 'content' );
				
					if( this.flags.width == '100%' )
						d.style.width = '100%';
					if( this.flags.height == '100%' )
						d.style.height = '100%';
				
					this.domContent = this.get( 'content' );
					this.parent = this.domContent;
				
					// Get title
					var title = this.get( 'title', d );
					if( title )
					{
						title.addEventListener( 'mousedown', function( e )
						{
							fui.initMouseDragging( d, e );
							fui.mouseObjectInfo.ondrag = function( coords )
							{
								// Constrains
								if( coords.y < 0 ) coords.y = 0;
								if( coords.y >= window.innerHeight )
									coords.y = window.innerHeight - 1;
								coords.x = fui.mouseObjectInfo.ox;
							}
						} );
					}
				
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
}, 'Base' );


