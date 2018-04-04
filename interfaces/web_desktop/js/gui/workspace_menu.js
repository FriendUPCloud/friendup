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

// The workspace menu!
var WorkspaceMenu =
{
	// Just poll menu to make it reposition and reset its state
	reset: function()
	{
		this.show( 'poll' );
	},
	show: function( resetMode )
	{	
		hideKeyboard();
		
		WorkspaceMenu.scrolling = false;
		
		// We need a screen!
		if( !window.currentScreen || !Workspace.screen || typeof Workspace == undefined ) return;
	
		var wm = false;

		// Move menu to current screen
		if( ge( 'WorkspaceMenu' ) )
		{
			var m = ge( 'WorkspaceMenu' );
			m.parentNode.removeChild( m );
			currentScreen.appendChild( m );
			wm = m;
		}
		// Create the dom element
		else if ( !ge ( 'WorkspaceMenu' ) )
		{
			var d = document.createElement ( 'div' );
			d.id = 'WorkspaceMenu';
			
			// Set up events on workspace menu
			
			if( !Workspace.screen._titleBar.hoverListener )
			{
				// Make sure we have the right link between the menu and the title bar of the workspace screen
				Workspace.screen._titleBar.hoverListener = 
				Workspace.screen._titleBar.addEventListener( 'mouseover', function()
				{
					var m = ge( 'WorkspaceMenu' );
					if( m )
					{
						if( m.classList )
							m.classList.add( 'Hover' );
						else m.className = 'Hover';
					}
				} );
				Workspace.screen._titleBar.addEventListener( 'mouseout', function()
				{
					var m = ge( 'WorkspaceMenu' );
					if( m && m.classList )
						m.classList.remove( 'Hover' );
				} );
			}
			d.onmousemove = function()
			{
				if( this.leaveTimeout )
				{
					clearTimeout( this.leaveTimeout );
					this.leaveTimeout = null;
				}
				Workspace.screen._titleBar.classList.add( 'Hover' );
			}
			d.onmouseout = function( e )
			{
				var t = e.target ? e.target : e.srcElement;
				this.leaveTimeout = setTimeout( function()
				{
					Workspace.screen._titleBar.classList.remove( 'Hover' );
				}, 5 );
			}
			currentScreen.appendChild( d );
			wm = d;
			
			// It's not a text document, don't allow drag/select
			wm.ondragstart = function( e ){ return cancelBubble( e ); }
			wm.onselectstart = function( e ){ return cancelBubble( e ); }
			
			// Hide from start
			if( ge( 'WorkspaceMenu' ) )
				ge( 'WorkspaceMenu' ).style.display = '';
		}
		
		// Mobile mode
		if( isMobile || IsSharedApp() )
		{
			// Create mobile menu if it doesn't exist
			if( !ge( 'MobileMenu' ) )
			{
				var mm = document.createElement( 'div' );
				mm.id = 'MobileMenu';
				mm.className = 'MobileMenu';
				document.body.appendChild( mm );
			}
		}

		// Make sure we don't have problems!
		if( Workspace && Workspace.menuMode == 'miga' )
		{
			CoverWindows();
		}
		// Others (fensters and pares)
		else if( Workspace && !window.isMobile && !IsSharedApp() )
		{
			var t = window.currentScreen.screenTitle.getElementsByClassName( 'Info' )[0];
			if( ge( 'WorkspaceMenu' ) )
			{
				ge( 'WorkspaceMenu' ).style.left = t.offsetWidth + t.offsetLeft + 10 + 'px';
				ge( 'WorkspaceMenu' ).className = 'Pear';
			}
		}
	
		// Assume we didn't find the menu
		var menuFound = false;
		var returnCode = false;
		
		if( window.isMobile || IsSharedApp() )
			setTimeout( function(){ wm.scrollTop = 0; }, 50 );
	
		// Blank menu on windows without any directory view or menu
		var viewScreen = false;
		try{ viewScreen = currentMovable.windowObject.flags.screen; } catch( e ){};
		
		// We have a screen!
		if( currentMovable && viewScreen && viewScreen == currentScreen.screen  )
		{
			// Generate window menu on the current screen
			if( currentMovable.content && currentMovable.content.menu && viewScreen == currentScreen.screen )
			{
				WorkspaceMenu.generate( wm, currentMovable.content.menu, false, currentMovable.content.applicationId );
				menuFound = true;
			}
			// we do not have content or a directory view
			else if( !( currentMovable.content && currentMovable.content.directoryview ) )
			{
				// If this is an application owned window, check if it has an application
				// screen, and if not, let it be
				if( currentMovable.content.applicationId )
				{
					var screenAppId = currentScreen.screen._screen.applicationId;
					if( currentMovable.content.applicationId != screenAppId )
					{
						WorkspaceMenu.generate( wm, [] );
						menuFound = true;
					}
				}
				// Other case for empty menu
				else
				{
					WorkspaceMenu.generate( wm, [] );
					menuFound = true;
				}
			}
		}
		// No menu found
		if( !menuFound )
		{
			// We have a screen menu (fullscreen app)!
			if( window.currentScreen && window.currentScreen.menu )
			{
				if( window.currentScreen == ge( 'DoorsScreen' ) )
				{
					Workspace.refreshMenu( true );
				}
				WorkspaceMenu.generate( wm, window.currentScreen.menu, false, window.currentScreen.screenObject._screen.applicationId );
			}
			// We have a screen with an empty menu
			else if( window.currentScreen != ge( 'DoorsScreen' ) && !window.currentScreen.menu )
			{
				WorkspaceMenu.generate( wm, [] );
				returnCode = 'empty_1';
			}
			// We have a main Workspace screen and no menu..
			else if ( ge ( 'DoorsScreen' ) && Workspace.menu )
			{
				Workspace.refreshMenu( true );
				WorkspaceMenu.generate( wm, Workspace.menu );
			}
			// Final weird case
			else
			{
				// TODO: This might not be needed..
				if ( window.menu )
				{
					WorkspaceMenu.generate( wm, window.menu );
					returnCode = 'window_menu_1';
				}
			}
		}
		if( returnCode )
		{
			//console.log( 'We have a returncode! ' + returnCode );
		}
		this.open = true;
	},
	close: function( e )
	{
		var m = ge( 'WorkspaceMenu' );
		if( m )
		{
			var divs = m.getElementsByTagName( 'div' );
			var lis = m.getElementsByTagName( 'li' );
			for( var a = 0; a < divs.length; a++ )
			{
				divs[a].isActivated = null;
				divs[a].classList.remove( 'Open' );
			}
			for( var a = 0; a < lis.length; a++ )
			{
				if( lis[a].classList )
				{
					lis[a].isActivated = null;
					lis[a].classList.remove( 'Open' );
				}
			}
			m.isActivated = false;
		}
		if( ge( 'MobileMenu' ) ) ge( 'MobileMenu' ).classList.remove( 'Visible' );
		
		// We are not active
		this.isActive = false;
		this.open = false;
		
		// Expose them!
		ExposeScreens();
		ExposeWindows();
	},
	hide: function( e )
	{
		if( !e ) e = window.event;
		var m = ge( 'WorkspaceMenu' );
		if( m )
		{
			var t = e ? ( e.target ? e.target : e.srcElement ) : false;
			if( t && t.getAttribute ( 'onclick' ) ) t.onclick ();
			// Remove open menus
			var divs = m.getElementsByTagName( 'div' );
			var lis = m.getElementsByTagName( 'li' );
			for( var a = 0; a < divs.length; a++ ) divs[a].classList.remove( 'Open' );
			for( var a = 0; a < lis.length; a++ ) if( lis[a].classList ) lis[a].classList.remove( 'Open' );
			m.style.display = 'none';
			m.classList.remove( 'Visible' );
			m.isActivated = false;
		}
		if( ge( 'MobileMenu' ) ) ge( 'MobileMenu' ).classList.remove( 'Visible' );
	
		// We are not active
		this.isActive = false;
	
		// Let it go
		ExposeWindows();
	
		// Don't know which menu items we have?
		friend.currentMenuItems = false;
	},
	// Generates menu html, sets up events and chooses menu container element
	generate: function( menudiv, menuItems, depth, appid )
	{
		WorkspaceMenu.scrolling = false;
		
		// Add to body so we can style whether we have a menu or not
		if( !menuItems || !menuItems.length )
			document.body.classList.remove( 'HasMenu' );
		else document.body.classList.add( 'HasMenu' );
		
		// We can't do this while showing!
		if( ( window.isMobile || IsSharedApp() ) && ge( 'MobileMenu' ) && ge( 'MobileMenu' ).classList.contains( 'Visible' ) )
			return;
		
		// Start of recursion
		if ( !depth ) depth = 0;

		// First recursion
		if( depth == 0 )
		{
			if( menudiv )
			{
				friend.lastMenuDiv = menudiv;	
			}
			else if( !menudiv && friend.lastMenuDiv )
			{
				menudiv = friend.lastMenuDiv;
			}
		}

		// Where to send command!
		var viewId = false;
		var menuObject = false; // Which parent to attach menu object
		
		// Don't assign the same array twice!
		if( menudiv && menudiv.menu != menuItems ) menudiv.menu = menuItems; else return;
		
		// This need to be able to stringify to validate menu items
		if( depth == 0 )
		{
			var test = JSON.stringify( menuItems );
			if( friend.currentMenuItems == test )
			{
				return false;
			}
			else
			{
				friend.currentMenuItems = test;
				menudiv.innerHTML = '';
			}
		}
		
		for( var i in menuItems )
		{
			if( menuItems[i] == false ) continue;
			var d = menudiv;
			
			if( depth == 0 )
			{
				var n = document.createElement ( 'div' );
				n.className = 'Menu';
				n.setAttribute( 'name', menuItems[ i ].name );
				n.innerHTML = menuItems[ i ].name;
				d.appendChild ( n );
				d = n;
			}
			var ul = document.createElement ( 'ul' );
			ul.onscroll = function( e )
			{
				if( WorkspaceMenu.scrollTim )
				{
					clearTimeout( WorkspaceMenu.scrollTim );
				}
				WorkspaceMenu.scrolling = e;
				WorkspaceMenu.scrollTim = setTimeout( function()
				{
					WorkspaceMenu.scrollTim = false;
				}, 250 );
				return cancelBubble( e );
			}
			var depth2 = depth + 1;
		
			// Object members
			if( menuItems[i].items )
			{
				for ( var j in menuItems[i].items )
				{
					if( menuItems[i].items[j] == false ) continue;
					var li = document.createElement( 'li' );
					var it = menuItems[i].items[j];
					if( it.disabled )
					{
						li.classList.add( 'Disabled' );
					}
					// A postmessage command
					else if( typeof ( it.command ) == 'string' )
					{
						li.command = it.command;
						li.scope = it.scope;
					
						// Sends command to application
						var mode = isMobile ? 'ontouchend' : 'onmouseup';
						li[mode] = function( e ) 
						{
							if( WorkspaceMenu.scrolling ) 
							{
								WorkspaceMenu.scrolling = false;
								return;
							}
							
							// Set appid from current movable..
							if( !appid && currentMovable.windowObject && currentMovable.windowObject.applicationId )
								appid = currentMovable.windowObject.applicationId;
						
							var viewId = false;
							if( currentMovable && typeof( currentMovable.windowObject._window.menuViewId ) != 'undefined' )
								viewId = currentMovable.windowObject._window.menuViewId;
							else if( currentScreen && typeof( currentScreen.menuScreenId ) != 'undefined' )
								viewId = currentScreen.menuScreenId; // TODO: Check this one out!
							
							if( appid )
							{
								var app = findApplication( appid );
								if( app )
								{
									var mmsg = {
										applicationId: appid,
										command: this.command + ""
									};
									if( this.scope )
									{
										// Has the scope on the view|screen
										if( this.scope == 'local' && viewId )
										{
											var c = GetContentWindowById( app, viewId );
											if( c )
											{
												mmsg.destinationViewId = viewId;
												c.postMessage( JSON.stringify( mmsg ), '*' );
												WorkspaceMenu.close();
												return;
											}
										}
									}
									app.contentWindow.postMessage( JSON.stringify( mmsg ), '*' );
									WorkspaceMenu.close();
								}
							}
							return cancelBubble( e );
						};
					}
					// A runnable function
					else if( it.command )
					{
						li.commandMethod = it.command;
						var mode = isMobile ? 'ontouchend' : 'onmouseup';
						li[mode] = function( e )
						{
							if( WorkspaceMenu.scrolling ) 
							{
								WorkspaceMenu.scrolling = false;
								return;
							}
							this.commandMethod( e ); 
							WorkspaceMenu.close(); 
						}
					}
					if ( it.items )
					{
						li.innerHTML = it.name;
						li.classList.add( 'Submenu' );
						WorkspaceMenu.generate ( li, [ it ], depth2, appid );
					}
					else if ( it.itemsHTML )
					{
						li.innerHTML = it.itemsHTML;
					}
					else if( typeof( it.divider ) != 'undefined' )
					{
						li.setAttribute( 'divider', 'divider' );
					}
					else
					{ 
						li.innerHTML = '<span>' + it.name + '</span>';
						li.onmousemove = function()
						{
							ClearMenuItemStyling( menudiv );
							this.getElementsByTagName( 'span' )[0].className = 'Active';
						}
					}
					ul.appendChild ( li );
				}
			}
			// Static members
			else if ( menuItems[i].itemsHTML )
			{
				ul.innerHTML = menuItems[i].itemsHTML;
			}
			d.appendChild( ul );
		}
		if( ge( 'MobileMenu' ) )
		{
			ge( 'MobileMenu' ).scrollTop = 0;
		}
		// Setup da events
		this.setMenuEvents( menudiv );
		this.generated = true;
	},
	// Just say activate menu
	activateMenu: function( wm )
	{
		wm.isActivated = true; // This menu is activated!
		this.isActive = true;
		
		// Cover movable windows to avoid mouse collision
		CoverWindows();
		CoverScreens();
	},
	// Setup the menu input events on wm (dom element)
	setMenuEvents: function( wm )
	{
		if( !wm ) return;
		var mode = ( Workspace && Workspace.menuMode == 'miga' ) ? 'onmouseover' : 'onmousedown';
		
		// We generated a new menu?
		var menus = wm.getElementsByTagName( 'div' );
		for ( var a = 0; a < menus.length; a++ )
		{
			if( menus[a].className != 'Menu' )
				continue;
			// For mobile, create a close button

			// Shared apps w/o desktop or mobile
			if( isMobile || IsSharedApp() )
			{
				var ul = menus[a].getElementsByTagName( 'ul' )[0];
				if( ul && !ul.closeButton )
				{			
					var h = document.createElement( 'li' );
					h.className = 'Heading';
					h.innerHTML = menus[a].getAttribute( 'name' ) ? menus[a].getAttribute( 'name' ) : menus[a].innerText;
					h.ontouchend = function( e )
					{
						WorkspaceMenu.close();
						return cancelBubble( e );
					}
					ul.insertBefore( h, ul.firstChild );
				
					var d = document.createElement( 'li' );
					d.className = 'CloseButton Close IconMedium fa-close';
					d.innerHTML = i18n( 'i18n_close' );
					d.closer = menus[a];
					d.ontouchend = function( e )
					{
						WorkspaceMenu.close();
						return cancelBubble( e );
					}
					ul.insertBefore( d, ul.firstChild );
					ul.closeButton = d;
				}
			}
			
			// Normal operation (tablet and desktop)
			menus[a].menus = menus;
			// Avoid race conditions
			menus[a].onmouseup = function( e )
			{
				// Deep cancel
				return cancelMouseEvents( e );
			}
			menus[a][mode] = function( e, state )
			{
				var t = e.target ? e.target : e.srcElement;
	
				// Double click closes menu
				if( !isMobile && !isTablet )
				{
					if( wm.isActivated && !state )
					{
						if( t.nodeName == 'DIV' )
						{
							WorkspaceMenu.close();
							return cancelBubble( e );
						}
					}
				}
	
				// Clicking a disabled element!
				if( t.nodeName == 'SPAN' && t.parentNode.classList.contains( 'Disabled' ) )
				{
					return cancelBubble( e );
				}
	
				// Activate menu
				WorkspaceMenu.activateMenu( wm );

				// Open and close them menus!
				for( var c = 0; c < this.menus.length; c++ )
				{
					// Ah, we found the menu to open!
					if ( this.menus[c] == this ) 
					{
						this.classList.add( 'Open' );
					}
					// This is a menu to close..
					else this.menus[c].classList.remove( 'Open' );
				}
				return cancelBubble( e );
			}
			// When one menu is open, allow changing menu with mouseover
			if( mode == 'onmousedown' )
			{
				menus[a].onmouseover = function( e )
				{
					if( wm.isActivated )
					{
						this.onmousedown( e, 'hover' );
					}
				}
			}
		}
		var lis = wm.getElementsByTagName ( 'li' );
		for ( var a = 0; a < lis.length; a++ )
		{
			lis[a].items = lis;
			lis[a].onmouseover = function ()
			{	
				// Activate menu
				WorkspaceMenu.activateMenu( wm );
				
				// Open menu
				this.classList.add( 'Open' );
				var sublis = this.getElementsByTagName( 'li' );
				
				// close all others
				for ( var a = 0; a < this.items.length; a++ )
				{
					var found = false;
					for( var b = 0; b < sublis.length; b++ )
					{
						if( this.items[a] == sublis[b] )
						{
							found = true;
							break;
						}
					}
					if( found ) continue;
					if( this.items[a] != this )
					{
						this.items[a].classList.remove( 'Open' );
					}
				}
				
				// Open parents
				var d = this;
				while ( d.nodeName != 'DIV' )
				{
					d = d.parentNode;
					if ( d.nodeName == 'LI' )
						d.classList.add( 'Open' );
				}
			}
			if( mode == 'onmousedown' )
			{
				lis[a].onmousedown = lis[a].onmouseover;
			}
		}
	}
}

