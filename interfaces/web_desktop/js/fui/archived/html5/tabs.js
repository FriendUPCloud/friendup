/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Add TabButtons class
fui.addClass( function()
{
	fui.TabButtons = fui.inherit( fui.Group.prototype );
	fui.TabButtons.prototype.show = function( bool )
	{
		this.baseDivs = [ {
			type: 'div',
			className: 'FUITabButtons',
			width: '100%',
			height: '100%',
			label: 'content',
			name: this.flags.name ? this.flags.name : false
		} ];
	};
	fui.TabButtons.prototype.setFlag = function( key, value )
	{
		switch( key )
		{
			case 'tabs':
				this.flags.tabs = value;
				return true;
			case 'labels':
				this.flags.labels = value;
				return true;
			case 'active':
				this.flags.active = value;
				return true;
			case 'pages':
				this.flags.pages = value;
				return true;
		}
	}
	fui.TabButtons.prototype.shown = function( ele )
	{
		var self = this;
		if( this.flags.tabs.length )
		{
			var width = 100 / this.flags.tabs.length;
			for( var a = 0; a < this.flags.tabs.length; a++ )
			{
				var d = document.createElement( 'div' );
				d.className = 'FUITabButton MousePointer';
				d.style.width = width + '%';
				d.index = a;
				d.pageName = this.flags.tabs[ a ];
				
				d.innerHTML = '<span>' + ( this.flags.labels ? this.flags.labels[a] : this.flags.tabs[a] ) + '</span>';
				ele.appendChild( d );
				d.onclick = function( e )
				{
					if( e.button == 0 )
					{
						for( var a = 0; a < ele.childNodes.length; a++ )
						{
							if( ele.childNodes[a] == this )
							{
								this.classList.add( 'Active' );
								var pageName = self.flags.tabs[ this.index ];
								var el = self.parent.getByName( pageName );
								if( el )
								{
									if( el.parentNode )
									{
										for( var c = 0; c < el.parentNode.childNodes.length; c++ )
										{
											var p = el.parentNode.childNodes[ c ];
											if( p == el )
											{
												p.classList.add( 'Active' );
											}
											else
											{
												if( p.classList ) p.classList.remove( 'Active' );
											}
										}
									}
								}
							}
							else
							{
								if( ele.childNodes[a].classList )
									ele.childNodes[a].classList.remove( 'Active' );
							}
						}
					}
				}
			}
			// Init element
			ele.init = function()
			{
				if( !this.initialized )
				{
					this.initialized = true;
					for( var a = 0; a < this.childNodes.length; a++ )
					{
						if( this.childNodes[a].pageName && this.childNodes[a].pageName == self.flags.active )
						{
							this.childNodes[a].onclick( { button: 0 } );
						}
					}
				}
			}
		}
	};
	fui.addCSS( `
	.FUITabButtons { width: 100%; }
	.FUITabButtons:after
	{
		display: block; 
		content: ' '; 
		clear: both;
	}
	.FUITabButton
	{
		transition: border-radius,box-shadow,color,background 0.25s; 
		border-radius: 0 0 3px 3px; 
		box-shadow: inset 0px 0px 20px rgba(0,0,0,0.2); 
		position: relative; 
		float: left; 
		height: 100%; 
		padding: 4px; 
		box-sizing: border-box; 
		background: gray; 
		color: white;
	}
	.FUITabButton:first-child { border-bottom-left-radius: 0; }
	.FUITabButton:last-child { border-bottom-right-radius: 0; }
	.FUITabButton > span
	{
		width: 100%; 
		text-align: center; 
		position: absolute; 
		top: 50%; 
		margin-top: -9px;
	}
	.FUITabButton.Active
	{
		border-radius: 0; 
		box-shadow: none; 
		background: #f0f0f0; 
		color: black;
	}
	` );
}, 'Group' );

// Add TabPages class
fui.addClass( function()
{
	fui.TabPages = fui.inherit( fui.Group.prototype );
	fui.TabPages.prototype.show = function( bool )
	{
		this.baseDivs = [ {
			type: 'div',
			className: 'FUITabPages',
			width: '100%',
			height: '100%',
			label: 'content',
			name: this.flags.name ? this.flags.name : false
		} ];
	};
	fui.TabPages.prototype.setFlag = function( key, value )
	{
		switch( key )
		{
			case 'buttons':
				this.flags.buttons = value;
				return true;
		}
	}
}, 'Group' );

fui.addClass( function()
{
	fui.TabPage = fui.inherit( fui.Group.prototype );
	fui.TabPage.prototype.show = function( bool )
	{
		this.baseDivs = [ {
			type: 'div',
			className: 'FUITabPage',
			label: 'content',
			name: this.flags.name ? this.flags.name : false
		} ];
	};
	fui.TabPage.prototype.setFlag = function( key, value )
	{
		switch( key )
		{
			case 'buttons':
				this.flags.buttons = value;
				return true;
		}
	};
	// When the page is shown
	fui.TabPage.prototype.shown = function()
	{
		var buts = fui.getByName( this.flags.buttons );
		if( buts )
		{
			buts.init();
		}
	}
	fui.addCSS( `
.FUITabButtons, .FUITabPages
{
	position: relative;
}
.FUITabPage 
{ 
	position: absolute; 
	overflow: hidden; 
	width: 0% !important; 
	height: 0% !important; 
}
.FUITabButton
{
	font-weight: ${fui.theme.font.tabButtonWeight};
}
.FUITabButton.Active
{
	font-weight: ${fui.theme.font.tabButtonWeightActive};
}
.FUITabPage.Active
{ 
	position: absolute; 
	overflow: auto; 
	width: 100% !important; 
	height: 100% !important; 
}
	` );
}, 'Group' );

