/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
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
			m.classList.add( 'SmoothScrolling' );
			m.parentNode.removeChild( m );
			currentScreen.appendChild( m );
			wm = m;
		}
		// Create the dom element
		else if ( !ge ( 'WorkspaceMenu' ) )
		{
			var d = document.createElement ( 'div' );
			d.id = 'WorkspaceMenu';
			d.classList.add( 'SmoothScrolling' );
			
			// Set up events on workspace menu
			
			if( !Workspace.screen._titleBar.hoverListener )
			{
				// Make sure we have the right link between the menu and the title bar of the workspace screen
				Workspace.screen._titleBar.hoverListener = true;
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
					{
						m.classList.remove( 'Hover' );
					}
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
		
		wm.ontouchstart = function( e )
		{
			var t = e.target ? e.target : e.srcObject;
			
			if( t.id && t.id == 'WorkspaceMenu' )
			{
				if( this.classList.contains( 'Open' ) )
				{
					this.classList.remove( 'Open' );
					document.body.classList.remove( 'WorkspaceMenuOpen' );
					
					// Close sub menus
					var eles = ge( 'WorkspaceMenu' ).getElementsByTagName( '*' );
					for( var z = 0; z < eles.length; z++ )
					{
						if( eles[z].classList && eles[z].classList.contains( 'Open' ) )
							eles[z].classList.remove( 'Open' );
					}
					
					// Remove back
					var eles = t.getElementsByClassName( 'MenuBack' );
					if( eles.length )
					{
						for( var a = 0; a < eles.length; a++ )
							eles[a].parentNode.removeChild( eles[a] );
					}
					
					return cancelBubble( e );
				}
				else if( !this.classList.contains( 'Open' ) )
				{
					var ts = this;
					this.style.willChange = 'content transform';
					setTimeout( function()
					{
						ts.style.willChange = 'auto';
					}, 300 );
					
					this.classList.add( 'Open' );
					document.body.classList.add( 'WorkspaceMenuOpen' );
					
					// Toggle docks and stuff
					if( Workspace.mainDock )
						Workspace.mainDock.closeDesklet();
					Friend.GUI.reorganizeResponsiveMinimized();
				}
			}
		}
		
		// Mobile mode
		if( isMobile || IsSharedApp() )
		{
			// Create mobile menu if it doesn't exist
			if( !ge( 'MobileMenu' ) )
			{
				var mm = document.createElement( 'div' );
				mm.id = 'MobileMenu';
				mm.className = 'MobileMenu ScrollBarSmall';
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
				if( currentMovable.content && currentMovable.content.applicationId )
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
				if( window.menu )
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
		if( WorkspaceMenu.back )
		{
			WorkspaceMenu.back.parentNode.removeNode( WorkspaceMenu.back );
			WorkspaceMenu.back = null;
		}
		
		var m = ge( 'WorkspaceMenu' );
		if( m )
		{
			var divs = m.getElementsByTagName( 'div' );
			var lis = m.getElementsByTagName( 'li' );
			for( var a = 0; a < divs.length; a++ )
			{
				divs[a].isActivated = null;
				divs[a].classList.remove( 'Open' );
				m.classList.remove( 'Open' );
				if( e )
					cancelBubble( e );
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
			m.classList.remove( 'Open' );
		}
		if( ge( 'MobileMenu' ) ) ge( 'MobileMenu' ).classList.remove( 'Visible' );
		
		// We are not active
		this.isActive = false;
		this.open = false;
		
		// Expose them!
		document.body.classList.add( 'nontouch' );
		setTimeout( function()
		{
			document.body.classList.remove( 'nontouch' );
		}, 50 );

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
			if( t && t.getAttribute && t.getAttribute( 'onclick' ) ) t.onclick ();
			// Remove open menus
			var divs = m.getElementsByTagName( 'div' );
			var lis = m.getElementsByTagName( 'li' );
			for( var a = 0; a < divs.length; a++ ) divs[a].classList.remove( 'Open' );
			for( var a = 0; a < lis.length; a++ ) if( lis[a].classList ) lis[a].classList.remove( 'Open' );
			m.style.display = 'none';
			m.classList.remove( 'Visible' );
			m.isActivated = false;
			cancelBubble( e );
		}
		if( ge( 'MobileMenu' ) ) ge( 'MobileMenu' ).classList.remove( 'Visible' );
	
		// We are not active
		this.isActive = false;
	
		// Let it go
		ExposeWindows();
	
		// Don't know which menu items we have?
		Friend.currentMenuItems = false;
	},
	// Generates menu html, sets up events and chooses menu container element
	generate: function( menudiv, menuItems, depth, appid )
	{
		// Sets a menu item action (helper function for code below)
		function setMenuItemAction( item, appid )
		{
			// Sends command to application
			let mode = ( isTablet || isMobile ) ? 'ontouchend' : 'onmouseup';
			item[mode] = function( e ) 
			{
				if( WorkspaceMenu.scrolling ) 
				{
					WorkspaceMenu.scrolling = false;
					return;
				}
				
				this.classList.remove( 'Open' );
			
				// Set appid from current movable..
				if( !appid && window.currentMovable && currentMovable.windowObject && currentMovable.windowObject.applicationId )
					appid = currentMovable.windowObject.applicationId;
		
				var viewId = false;
				if( currentMovable && typeof( currentMovable.windowObject._window.menuViewId ) != 'undefined' )
					viewId = currentMovable.windowObject._window.menuViewId;
				else if( currentScreen && typeof( currentScreen.menuScreenId ) != 'undefined' )
					viewId = currentScreen.menuScreenId; // TODO: Check this one out!
			
				if( appid )
				{
					let app = findApplication( appid );
					if( app )
					{
						let mmsg = {
							applicationId: appid,
							command: this.command + ""
						};
						if( this.scope )
						{
							// Has the scope on the view|screen
							if( this.scope == 'local' && viewId )
							{
								let c = GetContentWindowById( app, viewId );
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
		
		
		WorkspaceMenu.scrolling = false;
		
		// Add to body so we can style whether we have a menu or not
		if( !menuItems || !menuItems.length )
		{
			document.body.classList.remove( 'HasMenu' );
		}
		else 
		{
			document.body.classList.add( 'HasMenu' );
		}
		
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
				Friend.lastMenuDiv = menudiv;	
			}
			else if( !menudiv && Friend.lastMenuDiv )
			{
				menudiv = Friend.lastMenuDiv;
			}
		}

		// Where to send command!
		var viewId = false;
		var menuObject = false; // Which parent to attach menu object
		
		// Don't assign the same array twice!
		if( menudiv && menudiv.menu != menuItems ) menudiv.menu = menuItems; else return;
		
		// This need to be able to stringify to validate menu items
		if( depth == 0 && menuItems && typeof( menuItems.push ) != 'undefined' )
		{
			if( !menuItems.length && isMobile )
			{
				// Add option to quit application
				if( typeof( appId ) == 'undefined' )
				{
					menuItems.push( {
						name: i18n( 'i18n_close' ),
						command: 'close'
					} );
				}
				else
				{
					menuItems.push( {
						name: i18n( 'i18n_quit' ),
						command: 'quit'
					} );
				}
			}
			var test = JSON.stringify( menuItems );
			if( Friend.currentMenuItems == test )
			{
				return false;
			}
			else
			{
				Friend.currentMenuItems = test;
				menudiv.innerHTML = '';
			}
			
			if( isMobile && ( appid || ( currentMovable && currentMovable.content && currentMovable.content.directoryview ) ) )
			{
				let found = false;
				for( var z = 0; z < menuItems.length; z++ )
				{
					if( menuItems[z].name == i18n( 'i18n_quit' ) )
					{
						found = true;
						break;
					}
				}
				if( !found )
				{
					// Clear quit for this - and add back buttons
					let quitItem = null;
					function clearQuit( men )
					{
						let out = [];
						for( let a = 0; a < men.length; a++ )
						{
							if( men[a].name && men[a].name == i18n( 'i18n_quit' ) )
							{
								quitItem = men[a];
								continue;
							}
							if( men[a].items )
							{
								men[a].items = clearQuit( men[a].items );
							}
							out.push( men[a] );
						}
						return out;
					}
					menuItems = clearQuit( menuItems );
				
					// Add option to quit application
					if( currentMovable && currentMovable.content.directoryview )
					{
						menuItems.push( {
							name: i18n( 'i18n_close' ),
							command: 'close'
						} );
					}
					else
					{
						if( quitItem )
						{
							menuItems.push( quitItem );
						}
						else
						{
							menuItems.push( {
								name: i18n( 'i18n_quit' ),
								command: 'quit'
							} );
						}
					}
				}
			}
		}
		
		// Activate menu items
		for( let i in menuItems )
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
				if( menuItems[i].icon )
				{
					n.setAttribute( 'icon', menuItems[i].icon );
				}
				d = n;
				if( menuItems[ i ].command == 'close' )
				{
					n.onclick = function()
					{
						currentMovable.windowObject.close();
						Workspace.exitMobileMenu();
					}
				}
				else if( menuItems[ i ].command == 'quit' )
				{
					n.appid = appid;
					n.onclick = function()
					{
						if( currentMovable.windowObject.applicationId )
						{
							KillApplicationById( currentMovable.windowObject.applicationId );
						}
						else
						{
							currentMovable.windowObject.close();
						}
						Workspace.exitMobileMenu();
					}
					continue;
				}
				else if( menuItems[ i ].name == i18n( 'i18n_quit' ) )
				{
					n.command = menuItems[ i ].command;
					n.scope = menuItems[ i ].scope;
					n.classList.add( 'Empty' );
					setMenuItemAction( n, appid );
					continue;
				}
			}
			// Object members
			if( menuItems[ i ].items && menuItems[ i ].items.length )
			{
				var ul = document.createElement ( 'ul' );
				ul.classList.add( 'SmoothScrolling' );
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
		
			
				for( let j in menuItems[i].items )
				{
					if( menuItems[i].items[j] == false ) continue;
					var li = document.createElement( 'li' );
					var it = menuItems[i].items[j];
					if( it.disabled )
					{
						li.classList.add( 'Disabled' );
					}
					else if( it.invisible )
						continue
					// A postmessage command
					else if( typeof ( it.command ) == 'string' )
					{
						li.command = it.command;
						li.scope = it.scope;
					
						setMenuItemAction( li );
					}
					// A runnable function
					else if( it.command )
					{
						li.commandMethod = it.command;
						var mode = ( isTablet || isMobile ) ? 'ontouchend' : 'onmouseup';
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
				d.classList.add( 'HasSubMenu' );
				d.appendChild( ul );
			}
			// Static members
			else if ( menuItems[i].itemsHTML )
			{
				ul.innerHTML = menuItems[i].itemsHTML;
				d.classList.add( 'HasSubMenu' );
				d.appendChild( ul );
			}
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
		if( !isMobile )
		{
			CoverWindows();
			CoverScreens();
		}
	},
	// Setup the menu input events on wm (dom element)
	setMenuEvents: function( wm )
	{
		if( !wm ) return;
		var mode = ( Workspace && Workspace.menuMode == 'miga' ) ? 'onmouseover' : 'onmousedown';
		if( isMobile || isTouchDevice() ) mode = 'ontouchend';
		
		// We generated a new menu?
		var menus = wm.getElementsByTagName( 'div' );
		for ( var a = 0; a < menus.length; a++ )
		{
			if( !menus[a].classList.contains( 'Menu' ) || menus[ a ].classList.contains( 'Empty' ) )
				continue;
			// For mobile, create a close button
			
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
				Workspace.toggleStartMenu( false );
				mousePointer.clear();
				
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
						// Add back key
						if( isMobile )
						{
							// Set the back button on menu if possible
							if( !WorkspaceMenu.back )
							{
								var wsp = ge( 'WorkspaceMenu' );
								var isOpen = false;
								for( var c = 0; c < wsp.childNodes.length; c++ )
								{
									var ele = wsp.childNodes[ c ];
									if( ele.classList && ele.classList.contains( 'HasSubMenu' ) && ele.classList.contains( 'Open' ) )
									{
										isOpen = true;
									}
								}
								if( !isOpen )
								{
									var b = document.createElement( 'div' );
									b.className = 'MenuBack';
									b.target = this;
									b.onclick = function( e )
									{
										this.target.classList.remove( 'Open' );
										if( this.parentNode )
											this.parentNode.removeChild( this );
										return cancelBubble( e );
									}
									wsp.appendChild( b );
								}
							}
						}
						var ts = this;
						this.style.willChange = 'content transform';
						setTimeout( function()
						{
							ts.style.willChange = 'auto';
						}, 300 );
						
						this.classList.add( 'Open' );
					}
					// This is a menu to close..
					else
					{
						this.menus[c].classList.remove( 'Open' );
					}
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
			lis[a].onmouseover = function ( e )
			{	
				// Activate menu
				WorkspaceMenu.activateMenu( wm );
				
				// Open menu
				
				var ts = this;
				this.style.willChange = 'content transform';
				setTimeout( function()
				{
					ts.style.willChange = 'auto';
				}, 300 );
				
				this.classList.add( 'Open' );
				var sublis = this.getElementsByTagName( 'li' );
				
				// close all others
				for ( var a = 0; a < this.items.length; a++ )
				{
					let found = false;
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
						return cancelBubble( e );
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
			lis[a].onmouseout = function()
			{
				//this.classList.remove( 'Open' );
			}
			if( mode == 'onmousedown' )
			{
				lis[a].onmousedown = lis[a].onmouseover;
			}
		}
	}
}

// The mobile context menu
var MobileContextMenu = {
	show: function( target )
	{
	}
};
