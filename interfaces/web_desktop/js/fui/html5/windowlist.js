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
	fui.WindowList = fui.inherit( fui.Base.prototype );

	fui.WindowList.prototype.create = function( flags )
	{
		this.dom = false;
		var self = this;
	
		// default flags
		this.flags = {
			width: 'auto',
			height: 'auto',
			top: 'auto',
			left: 'auto',
			border: 'solid',
			margin: 0,
			rows: 2,
			columns: 1,
			screen: 'all',
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
	
		// Add FUI events
		fui.addEvent( 'viewmodify', function(){ self.refresh(); } );
	
		return this;
	}

	fui.WindowList.prototype.setFlag = function( key, value )
	{
		// New keys
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
			case 'rows': 
				if( parseInt( value ) >= 1 )
				{
					this.flags.rows = value;
					return true;
				}
				return false;
			case 'columns': 
				if( parseInt( value ) >= 1 )
				{
					this.flags.columns = value;
					return true;
				}
				return false;
			case 'screen': 
				if( value.length )
				{
					this.flags.screen = value;
					return true;
				}
				return false;
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

	fui.WindowList.prototype.show = function( bool )
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
							className: 'FUIWindowList', 
							width: this.flags.width, 
							height: this.flags.height,
							label: 'content',
							name: this.flags.name ? this.flags.name : false
						},
					];
				
					this.dom = this.build( baseDivs );
					this.domContent = this.get( 'content' );
				
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
				
					this.ondestroy = function()
					{
						d.parentNode.removeChild( d );
					}
				
					this.refresh();
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

	// Rebuild the window list
	fui.WindowList.prototype.refresh = function( bool )
	{
		// Window list
		var self = this;
	
		// Get content
		var d = this.domContent;
		if( !d )
		{
			return;
		}
	
		// Keep current view windows
		if( !this.currentWindows )
		{
			this.currentWindows = [];
		}
	
		// Just a neat function when clicking view windows
		function setOnclickAction( d, w )
		{
			d.onclick = function( e )
			{
				self.activateViewWindow( w );
			}
		}
	
		// 1. Count windows
		var windowCount = 0;
		for( var b = 0; b < fui.screens.length; b++ )
		{
			for( var c = 0; c < fui.screens[ b ].domContent.childNodes.length; c++ )
			{
				if( fui.screens[ b ].domContent.childNodes[ c ].viewObject )
					windowCount++;
			}
		}
	
		console.log( 'Window count: ' + windowCount );
	
		// 2. Remove view windows that disappeared!
		var out = [];
		for( var a = 0; a < this.currentWindows.length; a++ )
		{
			var found = false;
			for( var b = 0; b < fui.screens.length; b++ )
			{
				for( var c = 0; c < fui.screens[ b ].domContent.childNodes.length; c++ )
				{
					var s = fui.screens[ b ].domContent.childNodes[ c ];
					if( s == this.currentWindows[ a ] )
					{
						found = true;
						break;
					}
				}
				if( found ) break;
			}
			if( found ) out.push( this.currentWindows[ a ] );
		}
		this.currentWindows = out;
	
		// 3. Add view windows that are not added
		if( windowCount )
		{
			var rows = 1;
			var cols = windowCount / rows;
			for( var a = 0; a < fui.screens.length; a++ )
			{
				var s = fui.screens[ a ].domContent.childNodes;
				for( var b = 0; b < s.length; b++ )
				{
					var win = s[ b ];
			
					// Skip non view objects - they don't have the viewObject
					if( !win.viewObject ) continue;
			
					var found = false;
					for( var o in this.currentWindows )
					{
						if( this.currentWindows[ o ] == win )
						{
							found = true;
							break;
						}
					}
			
					// Add fresh view window
					if( !found )
					{
						// Add window representation
						var z = document.createElement( 'div' );
						z.className = 'FUIWindowListView';
						console.log( 100 / cols );
						z.style.width = Math.floor( 100 / cols ) + '%';
						z.style.height = Math.floor( 100 / rows ) + '%';
						setOnclickAction( z, win );
						z.innerHTML = win.viewObject.get( 'title' ).innerHTML;
						d.appendChild( z );
						this.currentWindows.push( win );
					}
				}
			}
		}
	}
}, 'Base' );
