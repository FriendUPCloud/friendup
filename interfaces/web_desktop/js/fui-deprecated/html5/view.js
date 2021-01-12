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
	fui.View = fui.inherit( fui.Base.prototype );

	/**
	 * Create a view window with flags
	 *
	 * args:    flags {flag object}
	 * returns: reference to self
	 *
	 */
	fui.View.prototype.create = function( flags )
	{
		// Primary dom node
		this.dom = false;
		this.domContent = false;
		if( !this.baseClassName )
			this.baseClassName = 'FUIView';
	
		// Default values
		this.flags = {
			width: 100,
			height: 100,
			title: 'Unnamed view',
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
			above: false,
			below: false,
			background: 'none',
			surface: fui.currentScreen.get( 'content' )
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
	 * Set a view window flag
	 *
	 * args:    key {string}, value {mixed}
	 * returns: true | false
	 *
	 */
	fui.View.prototype.setFlag = function( key, value )
	{
		// Check supported flags
		switch( key )
		{
			case 'title':      
				this.flags.title = value + ''; 
				return true;
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
			case 'above':
				if( value === true || value === false )
				{
					this.flags.above = value;
					this.flags.below = value ? false : true;
					return true;
				}
				break;
			case 'below':
				if( value === true || value === false )
				{
					this.flags.below = value;
					this.flags.above = value ? false : true;
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
	 * Show the view
	 *
	 * args:   bool {boolean}
	 * return: true | false
	 *
	 */
	fui.View.prototype.show = function( bool )
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
								type: 'div', className: this.baseClassName + ' Borderless', children: [
									{ type: 'div', className: 'FUIViewBorderlessContent', label: 'content' }
								], 
								width: this.flags.width, 
								height: this.flags.height,
								top: this.flags.top,
								left: this.flags.left,
								right: this.flags.bottom,
								bottom: this.flags.bottom,
								background: this.flags.background,
								above: this.flags.above,
								below: this.flags.below
							},
						];
					}
					else
					{
						baseDivs = [
							{ 
								type: 'div', className: this.baseClassName, children: [
									{ type: 'div', className: 'FUIViewTitle', children: [
										{ type: 'div', className: 'FUIViewGadgetClose', label: 'close' },
										{ type: 'div', className: 'FUIViewGadgetTitle', content: this.flags.title, label: 'title' },
										{ type: 'div', className: 'FUIViewGadgetMinimize', label: 'minimize' },
										{ type: 'div', className: 'FUIViewGadgetZoom' },
										{ type: 'div', className: 'FUIViewGadgetDepth' },
									] },
									{ type: 'div', className: 'FUIViewFrame', label: 'frame' },
									{ type: 'div', className: 'FUIViewContent', label: 'content' }
								], 
								width: this.flags.width, 
								height: this.flags.height, 
								top: this.flags.top,
								left: this.flags.left,
								right: this.flags.bottom,
								bottom: this.flags.bottom,
								background: this.flags.background,
								above: this.flags.above,
								below: this.flags.below
							},
						];
					}
				
					this.dom = this.build( baseDivs, this.parent );
				
					var d = this.dom;
				
					if( this.flags.width == '100%' )
						d.style.width = '100%';
					if( this.flags.height == '100%' )
						d.style.height = '100%';
				
					this.domContent = this.get( 'content' );
				
					// Get title
					var title = this.get( 'title', d );
					if( title )
					{
						title.addEventListener( 'mousedown', function( e )
						{
							fui.initMouseDragging( d, e );
							fui.mouseObjectInfo.ondrag = function( coords )
							{
								if( !fui.options.View.offscreenMove )
								{
									if( coords.x + d.offsetWidth > d.parentNode.offsetWidth )
									{
										coords.x = d.parentNode.offsetWidth - d.offsetWidth;
									}
									if( coords.x < 0 ) coords.x = 0;
									if( coords.y + d.offsetHeight > d.parentNode.offsetHeight )
									{
										coords.y = d.parentNode.offsetHeight - d.offsetHeight;
									}
									if( coords.y < 0 ) coords.y = 0;
							
									// Check parent margins
									if( self.parentObject )
									{
										var cn = self.parentObject.domContent ? self.parentObject.domContent : self.parentObject.dom;
										var mTop    = self.parentObject.flags.marginTop;
										var mLeft   = self.parentObject.flags.marginLeft;
										var mRight  = self.parentObject.flags.marginRight;
										var mBottom = self.parentObject.flags.marginBottom;
										if( coords.x < mLeft ) coords.x = mLeft;
										if( coords.y < mTop ) coords.y = mTop;
										if( coords.x + d.offsetWidth >= cn.offsetWidth - mRight )
										{
											coords.x = cn.offsetWidth - mRight - d.offsetWidth;
										}
										if( coords.y + d.offsetHeight >= cn.offsetHeight - mBottom )
										{
											coords.y = cn.offsetHeight - mBottom - d.offsetHeight;
										}
									}
								}
							}
						} );
					}
					var minimize = this.get( 'minimize' );
					if( minimize )
					{
						minimize.onclick = function()
						{
							if( fui.options.View.animations.minimize )
							{
								d.classList.add( 'Minimizing' );
							}
							setTimeout( function()
							{
								d.classList.add( 'Minimized' );
							}, 0 );
						};
					}
				
					this.ondestroy = function()
					{
						d.parentNode.removeChild( d );
					}
				
					// Close gadget
					var close = this.get( 'close', d );
					if( close ) close.onclick = function(){ self.destroy(); }
				
					// Trigger modify event
					fui.executeEvents( 'viewmodify' );
				}
			}
			else
			{
				if( this.visible && this.dom )
				{
					this.visible = false;
					this.dom.style.visibility = 'hidden';
					this.dom.style.pointerEvents = 'none';
				
					// Trigger modify event
					fui.executeEvents( 'viewmodify' );
				}
			}
			return this;
		}
		return false;
	}
}, 'Base' );

