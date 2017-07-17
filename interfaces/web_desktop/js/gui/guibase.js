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

var movableHighestZindex = 99;
var movableWindowCount = 0;
var movableWindows = [];
var windowMouseX = -1;
var windowMouseY = -1;
var mousePointer = 
{
	'elements': [],
	'dom': false,
	'testPointer': function ()
	{
		if( !ge( 'MousePointer' ) )
		{
			var d = document.createElement( 'div' );
			d.id = 'MousePointer';
			d.style.position = 'absolute';
			d.style.zIndex = '10000';
			d.style.opacity = 0.7;
			d.style.whiteSpace = 'nowrap';
			document.body.appendChild( d );
			this.dom = d;
		}
	},
	'move': function( e )
	{
		if ( !e ) e = window.event;
		var tar = e.target ? e.target : e.srcElement;
		
		// If we have elements, it means we have icons!
		if ( this.elements.length )
		{
			// Make sure we don't have problems with iframes!
			CoverWindows();
			
			// Object moved over
			var mover = false;
			var moveWin = false;
			
			// Check move on window
			var z = 0;
			for ( var a in movableWindows )
			{
				var wn = movableWindows[a];
				var wnZ = parseInt ( wn.style.zIndex );
				if ( 
					wn.offsetTop < windowMouseY && 
					wn.offsetLeft < windowMouseX &&
					wn.offsetTop + wn.offsetHeight > windowMouseY &&
					wn.offsetLeft + wn.offsetWidth > windowMouseX && 
					wnZ >= z
				)
				{
					moveWin = wn;
					z = wnZ;
				}
			}
			if( moveWin )
			{
				// Add mouse actions on window ->
				if( moveWin.windowObject && moveWin.windowObject.sendMessage )
				{
					moveWin.windowObject.sendMessage( {
						command: 'inputcoordinates',
						data: { x: windowMouseX - moveWin.content.offsetLeft - moveWin.offsetLeft, y: windowMouseY - moveWin.content.offsetTop - moveWin.offsetTop }
					} );
				}
			}
			
			// Check screens and view windows
			var screens = [];
			var screenl = ge( 'Screens' );
			for( var a = 0; a < screenl.childNodes.length; a++ )
			{
				if( screenl.childNodes[a].tagName == 'DIV' && screenl.childNodes[a].classList && screenl.childNodes[a].classList.contains( 'Screen' ) )
				{
					screens.push( screenl.childNodes[a].screen._screen );
				}
			}
			var ars = [];
			for( var a in movableWindows )
				ars.push( movableWindows[a] );
			ars = ars.concat( screens );
		
			for( var c in ars )
			{
				var isListview = false;
				var isScreen = false;
				var w = ars[c].icons ? ars[c] : ars[c].content;
				if( !w || !w.icons ) continue; // No icons? Skip!
				
				var sctop = 0;
				if( !w.classList.contains( 'ScreenContent' ) )
				{
					sctop = w.getElementsByClassName( 'Scroller' );
					isListview = w.getElementsByClassName( 'Listview' );
					if( !sctop ) sctop = isListview;
					isListview = isListview.length ? true : false;
				}
				// We're checking screen icons
				else
				{
					isScreen = true;
				}
				
				var scleft = 0;
				if( sctop && sctop.length ) 
				{
					scleft = sctop[0].scrollLeft;
					sctop = sctop[0].scrollTop;
				}
				else sctop = 0;
			
				var my = windowMouseY - w.offsetTop - w.parentNode.offsetTop + sctop;
				var mx = windowMouseX - w.offsetLeft - w.parentNode.offsetLeft + scleft;
				
				for( var a = 0; a < w.icons.length; a++ )
				{
					var ic = w.icons[a].domNode;
					var icon = w.icons[a];
			
					// Exclude elements dragged
					var found = false;
					for( var b = 0; b < this.dom.childNodes.length; b++ )
					{
						if( ic == this.dom.childNodes[b] )
							found = true;
					}
					if( found ) 
					{
						continue;
					}
					// Done exclude
					
					// Don't rotate icon on listviews
					if( !isListview )
					{
						if( 
							!mover &&
							( isScreen || ( moveWin && w == moveWin.content ) ) &&
							ic.offsetTop < my && ic.offsetLeft < mx &&
							ic.offsetTop + ic.offsetHeight > my &&
							ic.offsetLeft + ic.offsetWidth > mx
						)
						{
							ic.classList.add( 'Selected' );
						}
						else if( !mover || mover != icon )
						{
							ic.classList.remove( 'Selected' );
						}
					}
				}
			}
			// Register roll out!
			for( var a in window.movableWindows )
			{
				var wd = window.movableWindows[a];
				if( ( !mover && wd.rollOut ) || ( wd != moveWin && wd.rollOut ) )
					wd.rollOut ( e );
			}
			
			// Assign!
			this.mover = mover ? mover : moveWin;
			if( this.mover.rollOver )
				this.mover.rollOver( this.elements );
		}
	},
	'stopMove': function ( e )
	{
		for ( var a in window.movableWindows )
		{
			var wn = window.movableWindows[a];
			if ( wn.rollOut ) wn.rollOut ( e );
		}
	},
	'drop': function ( e )
	{
		if ( !e ) e = window.event;
		var tar = e.target ? e.target : e.srcElement;
		if ( this.elements.length )
		{
			var dropper = false;
			
			// Check screens and view windows
			var screens = [];
			var screenl = ge( 'Screens' );
			for( var a = 0; a < screenl.childNodes.length; a++ )
			{
				if( screenl.childNodes[a].tagName == 'DIV' && screenl.childNodes[a].classList && screenl.childNodes[a].classList.contains( 'Screen' ) )
				{
					screens.push( screenl.childNodes[a].screen._screen );
				}
			}
			var ars = [];
			for( var a in movableWindows )
				ars.push( movableWindows[a] );
			ars = ars.concat( screens );
			
			// Check drop on view
			var dropWin = 0;
			var z = 0;
			for ( var a in ars )
			{
				var wn = ars[a];
				var wnZ = parseInt ( wn.style.zIndex );
				if( isNaN( wnZ ) ) wnZ = 0;
				if ( 
					wn.offsetTop < windowMouseY && wn.offsetLeft < windowMouseX &&
					wn.offsetTop + wn.offsetHeight > windowMouseY &&
					wn.offsetLeft + wn.offsetWidth > windowMouseX &&
					wnZ >= z
				)
				{
					dropWin = wn;
					z = wnZ;
				}
			}
			if ( dropWin )
			{
				if( dropWin.icons || dropWin.content )
				{
					dropper = dropWin;
				}
			}
			
			// Find what we dropped on
			for( var c in ars )
			{
				var w = ars[c].icons ? ars[c] : ars[c].content;
				if( !w || !w.icons ) continue; // No icons? Skip!
				
				// If we have a dropped on view, skip icons on other views
				if( dropper && ( w != dropper.content && w != dropper ) )
					continue;
				
				// Add scroll top!
				var sctop = w.getElementsByClassName( 'Scroller' );
				var scleft = 0;
				if( sctop && sctop.length ) 
				{
					scleft = sctop[0].scrollLeft;
					sctop = sctop[0].scrollTop;
				}
				else sctop = 0;
				
				var my = windowMouseY - w.offsetTop - w.parentNode.offsetTop + sctop;
				var mx = windowMouseX - w.offsetLeft - w.parentNode.offsetLeft + scleft;
				
				// Drop on icon
				for ( var a = 0; a < w.icons.length; a++ )
				{
					var ic = w.icons[a].domNode;
				
					// Exclude elements dragged
					var found = false;
					for( var b = 0; b < this.dom.childNodes.length; b++ )
					{
						if( ic == this.dom.childNodes[b] )
							found = true;
					}
					if( found ) continue;
					// Done exclude
				
					var icon = w.icons[a];
					if ( 
						ic.offsetTop < my && ic.offsetLeft < mx &&
						ic.offsetTop + ic.offsetHeight > my &&
						ic.offsetLeft + ic.offsetWidth > mx
					)
					{
						dropper = icon;
						break;
					}
				}
			}
			
			// Check drop on desklet
			if( !dropper || ( dropper.classList && dropper.classList == 'ScreenContent' ) )
			{
				var z = 0;
				var dropWin = 0;
				for( var a = 0; a < __desklets.length; a++ )
				{
					var wn = __desklets[a].dom;
					var wnZ = parseInt ( wn.style.zIndex );
					if( isNaN( wnZ ) ) wnZ = 0;
					if ( 
						wn.offsetTop < windowMouseY && wn.offsetLeft < windowMouseX &&
						wn.offsetTop + wn.offsetHeight > windowMouseY &&
						wn.offsetLeft + wn.offsetWidth > windowMouseX &&
						wnZ >= z
					)
					{
						dropWin = wn;
						z = wnZ
					}
					else
					{
					}
				}
				if ( dropWin && dropWin.drop )
				{
					dropper = dropWin;
				}
			}
			
			var dropped = 0;
			if( dropper )
			{
				// Check if dropper object has a drop method, and execute it
				// with the supplied elements
				if( dropper.drop )
				{
					dropped = dropper.drop( this.elements );
				}
				else if( dropper.domNode && dropper.domNode.drop )
				{
					dropper.domNode.drop( this.elements );
				}
				else
				{
					var objs = [];
					for( var k = 0; k < this.elements.length; k++ )
					{
						var e = this.elements[k];
						if ( e.fileInfo.getDropInfo ) {
							var info = e.fileInfo.getDropInfo();
							objs.push( info );
						} else {
							objs.push( {
								Path: e.fileInfo.Path,
								Type: e.fileInfo.Type,
								Filename: e.fileInfo.Filename ? e.fileInfo.Filename : e.fileInfo.Title,
								Filesize: e.fileInfo.fileSize,
								Icon: e.fileInfo.Icon
							});
						}
					}
					if( dropper.windowObject )
					{
						dropper.windowObject.sendMessage( { command: 'drop', data: objs } );
					}
				}
			}
			
			// We didn't drop anything, or there was an error..
			if( dropped <= 0 )
			{
				if( window.currentMovable.content && window.currentMovable.content.refresh )
					window.currentMovable.content.refresh();
			}
			
			// Place back again
			if( !dropped || !dropper )
			{
				for( var a = 0; a < this.elements.length; a++ )
				{
					if( this.elements[a].oldParent )
					{
						var ea = this.elements[a];
						ea.oldParent.appendChild( ea );
						ea.style.top = ea.oldStyle.top;
						ea.style.left = ea.oldStyle.left;
						ea.style.position = ea.oldStyle.position;
						ea.oldStyle = null;
					}
					else this.dom.removeChild( this.elements[a] );
				}
			}
			// Remove
			else
			{
				for( var a = 0; a < this.elements.length; a++ )
				{
					this.dom.removeChild( this.elements[a] );
				}
			}
			this.elements = [];
			this.dom.innerHTML = '';
			
			if( w )
			{
				if( w.refreshIcons )
				{
					w.refreshIcons();
				}
			}
			
			Workspace.refreshDesktop();
		}
		this.mover = false;
	},
	'clone': function ( ele )
	{
		this.testPointer ();
	},
	'pickup': function ( ele )
	{
		//console.log( 'pickup', ele );
		this.testPointer ();
		// Check multiple (pickup multiple)
		var multiple = false;
		if ( ele.window )
		{
			_ActivateWindowOnly( ele.window.parentNode );
			for( var a = 0; a < ele.window.icons.length; a++ )
			{
				var ic = ele.window.icons[a];
				if( !ic.domNode ) continue;
				if( ic.domNode.className.indexOf ( 'Selected' ) > 0 )
				{
					var el = ic.domNode;
					multiple = true;
					el.oldStyle = {};
					el.oldStyle.top = el.style.top;
					el.oldStyle.left = el.style.left;
					el.oldStyle.position = el.style.position;
					el.style.top = 'auto';
					el.style.left = 'auto';
					el.style.position = 'relative';
					el.oldParent = el.parentNode;
					if( typeof ele.window.icons[a+1] != 'undefined' )
						el.sibling = ele.window.icons[a+1].domNode;
					el.parentNode.removeChild( el );
					this.dom.appendChild( el );
					this.elements.push( el );
				}
			}
		}
		// Pickup single
		if ( !multiple )
		{
			ele.oldStyle = {};
			ele.oldStyle.top = ele.style.top;
			ele.oldStyle.left = ele.style.left;
			ele.oldStyle.position = ele.style.position;
			ele.style.top = 'auto';
			ele.style.left = 'auto';
			ele.style.position = 'relative';
			ele.oldParent = ele.parentNode;
			ele.sibling = 
			ele.parentNode.removeChild( ele );
			this.dom.appendChild( ele );
			this.elements.push( ele );
		}
	},
	'poll': function ( e )
	{
		if ( !this.elements || !this.elements.length )
		{
			if ( this.dom )
				this.dom.parentNode.removeChild ( this.dom );
			this.dom = false;
		}
		else
		{
			this.dom.style.top = windowMouseY - Math.floor ( this.dom.firstChild.offsetHeight * 0.5 ) + 'px';
			this.dom.style.left = windowMouseX - Math.floor ( this.dom.firstChild.offsetWidth * 0.5 ) + 'px';
			window.mouseDown = 5;
			ClearSelectRegion();
		}
	}
};

// The workspace menu!
workspaceMenu =
{
	show: function( popupElement )
	{
		// We need a screen!
		if( !window.currentScreen )
		{
			return;
		}
	
		var wm = false;

		// Move it!
		if( !window.isMobile && !IsSharedApp() )
		{
			if( ge( 'WorkbenchMenu' ) )
			{
				var m = ge( 'WorkbenchMenu' );
				m.parentNode.removeChild( m );
				currentScreen.appendChild( m );
			}
			// Make it!
			else if ( !ge ( 'WorkbenchMenu' ) )
			{
				var d = document.createElement ( 'div' );
				d.id = 'WorkbenchMenu';
				currentScreen.appendChild( d );
			}
	
			if( wm = ge ( 'WorkbenchMenu' ) )
			{
	
				// It's not a text document, don't allow drag/select
				wm.ondragstart = function( e ){ return cancelBubble( e ); }
				wm.onselectstart = function( e ){ return cancelBubble( e ); }
			}
		}
		// Mobile mode (and let's remove the popup element reference)
		else
		{
			popupElement = false;
			if( !ge( 'MobileMenu' ) )
			{
				var mm = document.createElement( 'div' );
				mm.id = 'MobileMenu';
				document.body.appendChild( mm );
				wm = mm;
			}
			else 
			{
				wm = ge( 'MobileMenu' );
			}
		}
	
		// Special case! Make it pop up!
		if( popupElement ) 
		{
			wm = popupElement;
		}
		else if( !window.isMobile && !IsSharedApp() )
		{
			if( ge( 'WorkbenchMenu' ) )
				ge( 'WorkbenchMenu' ).style.display = '';
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
			if( ge( 'WorkbenchMenu' ) )
			{
				ge( 'WorkbenchMenu' ).style.left = t.offsetWidth + t.offsetLeft + 10 + 'px';
				ge( 'WorkbenchMenu' ).className = 'Pear';
			}
		}
	
		var menuFound = false;
		
		// Test if we have menu items 
		if ( window.currentMovable && wm == popupElement )
		{
			workspaceMenu.generate( wm, window.regionWindow.menu, false, window.regionWindow.applicationId );
			if( popupElement )
			{
				popupElement.className = 'PopupMenu';
				menuFound = true;
			}
		}
		// Other chance
		else if( window.isMobile || IsSharedApp() )
		{
			wm = ge( 'MobileMenu' );
			setTimeout( function(){ wm.scrollTop = 0; }, 50 );
		}
	
		var returnCode = false;
	
		// Ok this is the fallback menu and the workbench menu
		if ( !menuFound && wm )
		{
			// Blank menu on windows without any directory view or menu
			if( currentMovable && currentMovable.parentNode && currentMovable.parentNode.screen == currentScreen.screen  )
			{
				if( currentMovable.content && currentMovable.content.menu && currentMovable.parentNode == currentScreen )
				{
					workspaceMenu.generate( wm, currentMovable.content.menu, false, currentMovable.content.applicationId );
					menuFound = true;
				}
				else if( !( currentMovable.content && currentMovable.content.directoryview ) )
				{
					// If this is an application owned window, check if it has an application
					// screen, and if not, let it be
					if( currentMovable.content.applicationId )
					{
						var screenAppId = currentScreen.screen._screen.applicationId;
						if( currentMovable.content.applicationId != screenAppId )
						{
							workspaceMenu.generate( wm, [] );
							menuFound = true;
						}
					}
					// Other case for empty menu
					else
					{
						workspaceMenu.generate( wm, [] );
						menuFound = true;
					}
				}
			}
			if( !menuFound )
			{
				// We are using the popup element instead
				if( popupElement )
				{
					returnCode = 'popup';
				}
				else
				{
					// We have a screen menu!
					if( window.currentScreen && window.currentScreen.menu )
					{
						if( window.currentScreen == ge( 'DoorsScreen' ) )
						{
							Workspace.refreshMenu( true );
						}
						workspaceMenu.generate( wm, window.currentScreen.menu, false, window.currentScreen.screenObject._screen.applicationId );
					}
					else if( window.currentScreen != ge( 'DoorsScreen' ) && !window.currentScreen.menu )
					{
						workspaceMenu.generate( wm, [] );
						returnCode = 'empty_1';
					}
					// We have a doors screen and no menu..
					else if ( ge ( 'DoorsScreen' ) && Workspace.menu )
					{
						Workspace.refreshMenu( true );
						workspaceMenu.generate( wm, Workspace.menu );
					}
					else
					{
						// TODO: This might not be needed..
						if ( window.menu )
						{
							workspaceMenu.generate( wm, window.menu );
							returnCode = 'window_menu_1';
						}
					}
				}
			}
		}
		if( returnCode )
		{
			//console.log( 'We have a returncode! ' + returnCode );
		}
	},
	// Close the open menus
	close: function()
	{
		if( !window.isMobile && !IsSharedApp() )
		{
			var e = ge( 'WorkbenchMenu' );
			if( !e ) return;
			e.isActivated = false;
			var divs = e.getElementsByTagName( 'div' );
			var lis = e.getElementsByTagName( 'li' );
			for ( var a = 0; a < divs.length; a++ ) divs[a].classList.remove( 'Open' );
			for ( var a = 0; a < lis.length; a++ ) lis[a].classList.remove( 'Open' );
		}
	
		// Remove them!
		removeWindowPopupMenus();
		if( ge( 'MobileMenu' ) )
		{
			ge( 'MobileMenu' ).classList.remove( 'Visible' );
			_mobileMenuClose();
		}
	
		ExposeWindows();
		ExposeScreens();
	},
	hide: function( e )
	{
		if( !e ) e = window.event;
		var m = ge( 'WorkbenchMenu' );
		if( m )
		{
			var t = e.target ? e.target : e.srcElement;
			if ( t && t.getAttribute ( 'onclick' ) ) t.onclick ();
			// Remove open menus
			var divs = m.getElementsByTagName( 'div' );
			var lis = m.getElementsByTagName( 'li' );
			for ( var a = 0; a < divs.length; a++ ) divs[a].className = 'Menu';
			for ( var a = 0; a < lis.length; a++ ) lis[a].className = '';
			m.style.display = 'none';
			m.classList.remove( 'Visible' );
		}
		if( ge( 'MobileMenu' ) )
		{
			ge( 'MobileMenu' ).classList.remove( 'Visible' );
		}
	
		// Popup menu close
		removeWindowPopupMenus();
	
		// Let it go
		ExposeWindows();
	
		// Don't know which menu items we have?
		friend.currentMenuItems = false;
	},
	// Generates menu html, sets up events and chooses menu container element
	generate: function( menudiv, menuItems, depth, appid )
	{
		// We can't do this while showing!
		if( ( window.isMobile || IsSharedApp() ) && ge( 'MobileMenu' ) && ge( 'MobileMenu' ).classList.contains( 'Visible' ) )
			return;
		
		if ( !depth ) 
			depth = 0;

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

		var viewId = false; // Where to send command!
	
		// Don't assign the same array twice!
		if( menudiv && menudiv.menu != menuItems ) menudiv.menu = menuItems; else return;
		
		//this NEED stringify in order to work.
		if( depth == 0 && friend.currentMenuItems == JSON.stringify( menuItems ) )
		{
			return false;
		}
		else if( depth == 0 )
		{
			friend.currentMenuItems = JSON.stringify( menuItems );
			menudiv.innerHTML = '';
		}
	
		for( var i in menuItems )
		{
			if( menuItems[i] == false ) continue;
			var d = menudiv;
			if( depth == 0 )
			{
				var n = document.createElement ( 'div' );
				n.className = 'Menu';
				n.innerHTML = menuItems[i].name;
				d.appendChild ( n );
				d = n;
			}
			var ul = document.createElement ( 'ul' );
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
						var mode = 'onmouseup';
						li[mode] = function() 
						{
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
												workspaceMenu.close();
												return;
											}
										}
									}
									app.contentWindow.postMessage( JSON.stringify( mmsg ), '*' );
									workspaceMenu.close();
								}
							}
						};
					}
					// A runnable function
					else if( it.command )
					{
						li.commandMethod = it.command;
						li.onmouseup = function( e )
						{
							this.commandMethod( e ); workspaceMenu.close(); 
						}
					}
					if ( it.items )
					{
						li.innerHTML = it.name;
						li.classList.add( 'Submenu' );
						workspaceMenu.generate ( li, [ it ], depth2, appid );
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
	},
	// Setup the menu input events on wm (dom element)
	setMenuEvents: function( wm )
	{
		if( !wm ) return;
		var mode = ( Workspace && Workspace.menuMode == 'miga' ) ? 'onmouseover' : 'onmousedown';

		// We generated a new menu?
		var menus = wm.getElementsByTagName ( 'div' );
		for ( var a = 0; a < menus.length; a++ )
		{
			if ( menus[a].className != 'Menu' )
				continue;
			menus[a].menus = menus;
			menus[a][mode] = function( e, state )
			{
				var t = e.target ? e.target : e.srcElement;
		
				// Double click closes menu
				if( wm.isActivated && !state )
				{
					if( t.nodeName == 'DIV' )
					{
						workspaceMenu.close();
						return cancelBubble( e );
					}
				}
		
				// Clicking a disabled element!
				if( t.nodeName == 'SPAN' && t.parentNode.classList.contains( 'Disabled' ) )
				{
					return cancelBubble( e );
				}
		
				//if( Workspace.menuMode != 'miga' )
				//	if( wm.isActivated ) return;
		
				wm.isActivated = true; // This menu is activated!
		
				// Cover movable windows to avoid mouse collision
				CoverWindows();
	
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
			lis[a].lis = lis;
			lis[a].onmouseover = function ()
			{
				// Open menu
				this.classList.add( 'Open' );
				var sublis = this.getElementsByTagName( 'li' );
				
				// close all others
				for ( var a = 0; a < this.lis.length; a++ )
				{
					var found = false;
					for( var b = 0; b < sublis.length; b++ )
					{
						if( this.lis[a] == sublis[b] )
						{
							found = true;
							break;
						}
					}
					if( found ) continue;
					if( this.lis[a] != this ) this.lis[a].classList.remove( 'Open' );
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

// Cover windows with overlay
function CoverWindows()
{
	for ( var a in movableWindows )
	{
		if( movableWindows[a].moveoverlay )
			movableWindows[a].moveoverlay.style.height = '100%';
	}
}
// Expose windows / remove overlay
function ExposeWindows()
{
	for ( var a in movableWindows )
	{
		if( movableWindows[a].content.groupMember ) continue;
		if( movableWindows[a].moveoverlay )
			movableWindows[a].moveoverlay.style.height = '0%';
		movableWindows[a].memorize ();
	}
}
// Cover screens with overlay
function CoverScreens()
{
	// Disable all screen overlays
	var screenc = ge ( 'Screens' );
	var screens = screenc.getElementsByTagName ( 'div' );
	for( var a = 0; a < screens.length; a++ )
	{
		if( !screens[a].className ) continue;
		if( screens[a].parentNode != screenc ) continue;
		screens[a]._screenoverlay.style.display = '';
	}
}

// Cover screens other than current one
function CoverOtherScreens()
{
	// Disable all screen overlays
	var screenc = ge ( 'Screens' );
	var screens = screenc.getElementsByTagName ( 'div' );
	for( var a = 0; a < screens.length; a++ )
	{
		if( !screens[a].className ) continue;
		if( screens[a].parentNode != screenc ) continue;
		if( currentScreen && screens[a] == currentScreen )
			continue;
		screens[a]._screenoverlay.style.display = '';
	}
}

// Expose screens / remove overlay
function ExposeScreens()
{
	// Disable all screen overlays
	var screenc = ge ( 'Screens' );
	var screens = screenc.getElementsByTagName ( 'div' );
	for( var a = 0; a < screens.length; a++ )
	{
		if( !screens[a].className ) continue;
		if( screens[a].parentNode != screenc ) continue;
		screens[a]._screenoverlay.style.display = 'none';
	}
}

// Find a movable window by title string
function FindWindowById ( id )
{
	for ( var i in movableWindows )
	{
		if ( i == id )
		{
			if ( movableWindows[i].windowObject )
				return movableWindows[i].windowObject;
			return movableWindows[i];
		}
	}
	return false;
}

function GuiCreate ( obj )
{
	var str = '';
	for ( var a = 0; a < obj.length; a++ )
	{
		switch ( typeof ( obj[a] ) )
		{
			case 'function':
				if ( typeof ( obj[a+1] ) != 'undefined' )
				{
					str += obj[a] ( obj[a+1] );
					a++;
				}
				break;
			case 'string':
				str += obj[a];
				break;
			case 'array':
				str += GuiCreate ( obj[a], _level+1 );
				break;
		}
	}
	return str;
}

function GuiColumns ( data )
{
	var widths = data[0];
	var content = data[1];
	var str = '<table class="GuiColums"><tr>';
	for ( var a = 0; a < widths.length; a++ )
	{
		if ( widths[a].indexOf ( '%' ) < 0 && widths[a].indexOf ( 'px' ) < 0 )
			widths[a] += 'px';
		str += '<td style="width: ' + widths[a] + '">' + GuiCreate ( [ content[a] ] ) + '</td>';
	}
	str += '</tr></table>';
	return str;
}

function GuiContainer ( obj )
{
	return '<div class="GuiContainer"><div class="GuiContent">' + GuiCreate ( obj ) + '</div></div>';
}

// Init popup box on an element on roll over -----------------------------------
var _epObject = {
	target : false,
	l : -1000,
	t : -1000,
	datas : new Array ()
};
function InitElementPopup ( pdiv, actionurl, forceupdate, immediateDisplay )
{
	if ( !pdiv ) return;
	if ( !immediateDisplay ) immediateDisplay = false;
	pdiv.triggerElementPopup = true;
	
	if ( !pdiv.loadData )
	{
		pdiv.actionData = actionurl;
		pdiv.checkElementPopup = function ()
		{
			this.d = ge( 'ElementPopup' );
			if ( !this.d )
			{
				this.d = document.createElement ( 'div' );
				this.d.className = 'Popup';
				this.d.id = 'ElementPopup';
				this.d.style.top = '-10000px';
				this.d.style.left = '-10000px';
				this.d.style.visibility = 'hidden';
				document.body.appendChild( this.d );
				_epObject.target = this;
			}
			return this.d;
		}
		pdiv.loadData = function ( showAfterLoad )
		{
			if ( !this.actionData ) return;
			this.checkElementPopup();
			if ( !forceupdate && _epObject.datas[this.actionData] )
			{	
				this.activate ( this.actionData );
				this.show ();
			}
			else
			{
				var k = new cAjax ();
				k.open ( 'get', this.actionData, true );
				k.pdiv = pdiv;				this.show ();

				k.onload = function ( e )
				{
					var r = this.responseText ();
					if ( r.indexOf ( 'login.css' ) < 0 && r.length > 0 )
					{
						this.pdiv.setData ( r, this.pdiv.actionData );
						if ( showAfterLoad )
							this.pdiv.show ();
						this.pdiv.activate ( this.pdiv.actionData );
					}
				}
				k.send ();
			}
		}
		pdiv.setData = function ( data, action, e )
		{
			_epObject.datas[action] = data;
		}
		pdiv.activate = function ( action, e )
		{
			if ( !e ) e = window.event;
			if ( !_epObject.datas ) return;
			if ( !_epObject.datas[action] ) return;
			this.d.innerHTML = _epObject.datas[action];
			this.d.height = this.d.offsetHeight;
			RepositionPopup ( e );
		}
		pdiv.onmouseover = function ()
		{
			this.loadData ();
		}
		pdiv.show = function ( e )
		{
			var d = this.checkElementPopup();
			d.style.opacity = 1;
			d.style.filter = 'alpha(opacity=100)';
			d.style.visibility = 'visible';
			if ( !d.style.top || !d.style.left )
			{
				RepositionPopup ( e );
			}
		}
	}
	pdiv.loadData ( immediateDisplay ? true : false );
	
	DelEvent ( ElementPopupMover );
	AddEvent ( 'onmousemove', ElementPopupMover );
}

var __windowHeightMargin = 25;

function RepositionPopup( e, test )
{
	if ( !e ) e = window.event;
	if ( !e ) return;
	var l = 0; var t = 0;
	var target = document.body;
	var trg = _epObject.target; // wanted target
	var mx = windowMouseX;
	var my = windowMouseY;

	l = _epObject.l;
	t = _epObject.t;
	if ( e )
	{
		var ll = mx;
		if ( !isNaN ( ll ) )
		{
			l = ll;
			t = my;
			_epObject.l = l;
			_epObject.t = t;
			// FIXME: Study when we need this one (scroll offset!
			//t -= document.body.scrollTop;
			//l -= document.body.scrollLeft;
			target = e.target ? e.target : e.srcElement; // mouse target
		}
	}
	el = ge( 'ElementPopup' );
	if( !el ) return;

	// Get popup height
	var height = false;
	if ( !height ) height = el.height;
	if ( !height ) return;
	
	var wh = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	var ww = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	wh -= __windowHeightMargin;
	
	var mdl = GetTitleBarG ();
	var minTop = mdl ? mdl.offsetHeight : 0;

	var w = el.offsetWidth + 20;
	var h = el.offsetHeight + 20;
	l -= Math.floor ( el.offsetWidth * 0.5 );
	t -= ( height + 20 );
	
	// Constrain to page
	if ( t + h > wh ) t -= ( t + h ) - wh;
	if ( l + w > ww ) l -= ( l + w ) - ww;
	if ( l < 0 ) l = 0;
	if ( t < minTop )
		t = my + 20;

	var st = document.body.scrollTop;
	
	if ( t < minTop && l == 0 )
	{
		t = -1000;
		l = -1000;
	}
	
	el.style.top = t + st + 'px';
	el.style.left = l + 'px';
	
}

// Move popup 
function ElementPopupMover ( e, init )
{
	if ( !e ) e = window.event;
	var el = false; var target; var trg;
	if ( e )
	{
		target = e.target ? e.target : e.srcElement; // mouse target
		trg = _epObject.target; // wanted target
	}
	if ( ( el = ge( 'ElementPopup' ) ) )
	{
		var isover = false; var test = target;
		if ( !init )
		{
			while ( test != trg.parentNode && test != document.body  )
			{
				if ( test == trg ) { isover = true; break; }
				if( !test ) return false;
				test = test.parentNode;
			}
		}
		if ( init || isover == true )
		{
			if ( el.tm )
			{
				clearTimeout ( el.tm );
				el.tm = false;
			}
			RepositionPopup( e );
		}
		// We're moving over another popup!
		else if ( target.triggerElementPopup )
		{
			RepositionPopup( e );
		}
		else
		{
			RemoveElementPopup( 1 ); // Totally remove
		}
	}
}

function RemoveElementPopup( close )
{
	var e = ge('ElementPopup' );
	if ( !e ) return;
	if ( e.tm ) clearTimeout ( e.tm );
	e.tm = false;
	if( close )
	{
		e.parentNode.removeChild ( e );
	}
	else
	{
		e.style.opacity = 0;
		e.style.filter = 'alpha(opacity=0)';
	}
}

/* Make select box table ---------------------------------------------------- */

function NewSelectBox ( divobj, height, multiple )
{
	if ( !divobj ) return false;
	
	var cont = document.createElement ( 'div' );
	cont.className = 'SelectBox';
	
	var table = document.createElement ( 'table' );
	table.className = 'SelectBox ' + ( multiple ? 'Checkboxes' : 'Radioboxes' );
	
	var opts = divobj.getElementsByTagName ( 'div' );
	var sw = 1;
	
	for ( var a = 0; a < opts.length; a++ )
	{
		var tr = document.createElement ( 'tr' );
		tr.className = 'sw' + sw + ( opts[a].className ? ( ' ' + opts[a].className ) : '' );
		if ( opts[a].title ) tr.title = opts[a].title;
		
		var spl = opts[a].innerHTML.split ( "\t" );
		var inpid = divobj.id + '_input_'+(a+1);
		for ( var b = 0; b < spl.length; b++ )
		{
			var td = document.createElement ( 'td' );
			td.innerHTML = '<label for="'+inpid+'">'+spl[b]+'</label>';
			tr.appendChild ( td );
		}
		
		var td = document.createElement ( 'td' );
		
		val = opts[a].getAttribute ( 'value' );
		
		if ( multiple )
		{
			td.innerHTML = '<input value="' + val + '" id="' + inpid + '" onclick="_NewSelectBoxCheck(\''+divobj.id+'\',this)" type="checkbox" name="' + divobj.id + '"/>';
		}
		else
		{
			td.innerHTML = '<input value="' + val + '" id="' + inpid + '" onclick="_NewSelectBoxRadio(\''+divobj.id+'\',this)" type="radio" name="' + divobj.id + '"/>';
		}
		
		tr.appendChild ( td );
		table.appendChild ( tr );
		tr.onselectstart = function () 
		{
			return false;
		}
		sw = sw == 1 ? 2 : 1;
	}
	cont.appendChild ( table );
	
	// Replace earlier container
	cont.id = divobj.id;
	divobj.parentNode.replaceChild ( cont, divobj );
	
	// Adjust height
	var rheight = 0;
	rheight = cont.getElementsByTagName ( 'td' )[0].offsetHeight;
	/*cont.style.height = rheight * height + 'px';*/
	cont.style.minHeight = rheight * height + 'px';
	
}

function _NewSelectBoxCheck ( pid, ele )
{
	var pel
	if ( typeof ( pid ) == 'string' )
		pel = ge ( pid );
	else pel = pid;
	if ( !pel ) return false;
	var els = pel.getElementsByTagName ( 'tr' );
	for ( var a = 0; a < els.length; a++ )
	{
		var inp = els[a].getElementsByTagName ( 'input' )[0];
		if ( inp.checked )
			els[a].className = els[a].className.split ( ' checked' ).join ( '' ) + ' checked';
		else els[a].className = els[a].className.split ( ' checked' ).join ( '' );
	}
}

// Gets values from a SelectBox - multiple select returns array, otherwise string
function GetSelectBoxValue ( pel )
{
	if ( !pel ) return false;
	var inputs = pel.getElementsByTagName ( 'input' );
	var table = pel.getElementsByTagName ( 'table' )[0];
	if ( table.className.indexOf ( 'Checkboxes' ) > 0 )
	{
		var res = new Array ();
		for ( var a = 0; a < inputs.length; a++ )
		{
			if ( inputs[a].checked )
			{
				res.push ( inputs[a].getAttribute ( 'value' ) );
			}
		}
		return res;
	}
	else if ( table.className.indexOf ( 'Radioboxes' ) > 0 )
	{
		for ( var a = 0; a < inputs.length; a++ )
		{
			if ( inputs[a].checked )
			{
				return inputs[a].getAttribute ( 'value' );
			}
		}
	}
	return false;
}

function _NewSelectBoxRadio ( pid, ele )
{
	var pel
	if ( typeof ( pid ) == 'string' )
		pel = ge ( pid );
	else pel = pid;
	if ( !pel ) return false;
	var els = pel.getElementsByTagName ( 'tr' );
	for ( var a = 0; a < els.length; a++ )
	{
		var inp = els[a].getElementsByTagName ( 'input' )[0];
		if ( inp.checked )
		{
			els[a].className = els[a].className.split ( ' checked' ).join ( '' ) + ' checked';
		}
		else els[a].className = els[a].className.split ( ' checked' ).join ( '' );
	}
}

/* For movable windows ------------------------------------------------------ */

// Moves windows on mouse move
movableListener = function ( e )
{
	if( !e ) e = window.event;
	var ww = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	var wh = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	var y = e.clientY ? e.clientY : e.pageY;
	var x = e.clientX ? e.clientX : e.pageX;
	var sh = e.shiftKey || e.ctrlKey;
	windowMouseX = x;
	windowMouseY = y;
	mousePointer.poll();
	mousePointer.move( e );
	if( window.mouseDown && window.mouseMoveFunc ) 
	{
		window.mouseMoveFunc( e );
	}
	else if ( window.currentMovable )
	{
		// Some defaults
		var minW = 160;
		var minH = 100;
		var maxW = 1000000;
		var maxH = 1000000;
		var st = document.body.scrollTop;
		if ( window.currentMovable.content && window.currentMovable.content.flags )
		{
			if ( window.currentMovable.content.flags['min-width'] >= 100 )
				minW = window.currentMovable.content.flags['min-width'];
			if ( window.currentMovable.content.flags['max-width'] >= 100 )
				maxW = window.currentMovable.content.flags['max-width'];
			if ( window.currentMovable.content.flags['min-height'] >= 100 )
				minH = window.currentMovable.content.flags['min-height'];
			if ( window.currentMovable.content.flags['max-height'] >= 100 )
				maxH = window.currentMovable.content.flags['max-height'];
		}
		
		// Clicking on the window title
		var mx = ( x - window.currentMovable.offx );
		var my = ( y - window.currentMovable.offy );
		
		// 8 px grid
		if( e.shiftKey )
		{
			mx = Math.floor( mx / 8 ) << 3;
			my = Math.floor( my / 8 ) << 3;
		}
		
		// Moving a window..
		if ( window.mouseDown == 1 )
		{
			var w = window.currentMovable;

			// Make sure the inner overlay is over screens
			if( window.currentScreen )
			{
				window.currentScreen.moveoverlay.style.display = '';
				window.currentScreen.moveoverlay.style.height = '100%';
			}	
			
			// Get the position
			var screen = window.currentScreen.screenObject;
			var statusbarHeight = GetStatusbarHeight( screen );
			
			var minY = w.parentWindow ? 0 : ( GetTitleBarG() ? GetTitleBarG().offsetHeight : 0 );
			var maxY = w.parentWindow ? w.parentWindow.offsetHeight : ( statusbarHeight > 0 ? wh - statusbarHeight : wh );
			var maxX = w.parentWindow ? w.parentWindow.offsetWidth : ww;
			
			if ( my < minY ) my = minY;
			if ( mx < 0 ) mx = 0;
			else if ( mx + window.currentMovable.offsetWidth > maxX )
				mx = maxX - window.currentMovable.offsetWidth;
			if ( my + window.currentMovable.offsetHeight > maxY )
				my = maxY - window.currentMovable.offsetHeight;
				
			// Move the window!
			if ( window.currentMovable && window.currentMovable.style )
			{
				// Move sticky widgets!
				if( window.currentMovable.windowObject && window.currentMovable.windowObject.widgets )
				{
					var wds = window.currentMovable.windowObject.widgets;
					for( var z = 0; z < wds.length; z++ )
					{
						var vx = mx + ( isNaN( wds[z].tx ) ? 0 : wds[z].tx );
						var vy = my + ( isNaN( wds[z].ty ) ? 0 : wds[z].ty );
						if( vx < 0 ) vx = 0;
						else if( vx + wds[z].dom.offsetWidth >= wds[z].dom.parentNode.offsetWidth )
							vx = wds[z].dom.parentNode.offsetWidth - wds[z].dom.offsetWidth;
						if( vy < 0 ) vy = 0;
						else if( vy + wds[z].dom.offsetHeight >= wds[z].dom.parentNode.offsetHeight )
							vy = wds[z].dom.parentNode.offsetHeight - wds[z].dom.offsetHeight;
						wds[z].dom.style.right = 'auto';
						wds[z].dom.style.bottom = 'auto';
						wds[z].dom.style.left = vx + 'px';
						wds[z].dom.style.top = vy + 'px';
					}
				}
				
				if( !window.currentMovable.getAttribute( 'moving' ) )
					window.currentMovable.setAttribute( 'moving', 'moving' );
				window.currentMovable.style.left = mx + 'px';
				window.currentMovable.style.top  = my + 'px';
				window.currentMovable.memorize ();
			}
			
			// Do resize events
			var w = window.currentMovable;
			CoverWindows();
			CoverOtherScreens();
			if ( w.content && w.content.events )
			{
				if ( typeof(w.content.events['move']) != 'undefined' )
				{
					for ( var a = 0; a < w.content.events['move'].length; a++ )
					{
						w.content.events['move'][a]();
					}
				}
			}
			return cancelBubble ( e );
		}
		// Mouse down on a resize gadget
		else if ( window.mouseDown == 2 )
		{ 
			var w = window.currentMovable;
			var r = w.resize;
			var t = w.titleBar;
			var l = w.leftbar;
			var x = w.rightbar;
			
			var screen = w.windowObject.getFlag( 'screen' );
			var statusbarHeight = GetStatusbarHeight( screen );
			
			var minY = w.parentWindow ? 0 : ( GetTitleBarG() ? GetTitleBarG().offsetHeight : 0 );
			var maxY = w.parentWindow ? w.parentWindow.offsetHeight : 
				( statusbarHeight > 0 ? wh - statusbarHeight : wh );
			var maxX = w.parentWindow ? w.parentWindow.offsetWidth : ww;
			
			var rx = ( windowMouseX - r.offx ); // resizex
			var ry = ( windowMouseY - r.offy ); // resizey
			
			// 8 px grid
			if( e.shiftKey )
			{
				rx = Math.floor( rx / 8 ) << 3;
				ry = Math.floor( ry / 8 ) << 3;
			}
			
			ResizeWindow( w, r.wwid - w.marginHoriz + rx, r.whei - w.marginVert + ry );
			
			// Move window if out of bounds!
			var t = w.offsetTop;
			var l = w.offsetLeft;
			if ( l + w.offsetWidth > maxX ) l = maxX - w.offsetWidth;
			if ( t + w.offsetHeight > maxY ) t = maxY - w.offsetHeight;
			if ( t < minY ) t = minY;
			if ( l < 0 ) l = 0;
			w.style.left = l + 'px';
			w.style.top  = t + 'px';
			
			// Do resize even••••••••ts (and make sure we have the overlay to speed things up)
			CoverWindows();
			if ( w.content.events )
			{
				if ( typeof(w.content.events['resize']) != 'undefined' )
				{
					for ( var a = 0; a < w.content.events['resize'].length; a++ )
					{
						w.content.events['resize'][a]();
					}
				}
			}
			return cancelBubble ( e );
		}
	}
	// Mouse down on desktop (regions)
	if ( window.mouseDown == 4 && window.regionWindow )
	{
		if( DrawRegionSelector( e ) )
		{		
			return cancelBubble( e );
		}
		return false;
	}
}

// Draw the region selector with a possible offset!
function DrawRegionSelector( e )
{
	var sh = e.shiftKey || e.ctrlKey;
	
	// Create region selector if it doesn't exist!
	if ( !ge ( 'RegionSelector' ) )
	{
		var d = document.createElement ( 'div' );
		d.id = 'RegionSelector';
		
		window.regionWindow.appendChild ( d );
		if ( document.body.attachEvent )
		{
			d.style.border = '1px solid #000000';
			d.style.background = '#555555';
			d.style.filter = 'alpha(opacity=50)';
		}
	}
	
	// Extra offset in content window
	var mx = windowMouseX; var my = windowMouseY;
	var diffx = 0;		 var diffy = 0; 
	var ex = 0; var ey = 0;
	var eh = 0; var ew = 0;
	var rwc = window.regionWindow.className;
	var scrwn = window.regionWindow.scroller;
	
	// In icon windows or new screens
	if ( rwc == 'Content' || rwc == 'ScreenContent' )
	{
		// Window offset
		ex = -window.regionWindow.parentNode.offsetLeft;
		ey = -window.regionWindow.parentNode.offsetTop;
		
		// Scrolling down / left? Add to mouse scroll
		eh += window.regionWindow.scrollTop;
		ew += window.regionWindow.scrollLeft;
		
		if( rwc == 'Content' )
		{
			_ActivateWindow( window.regionWindow.parentNode, false, e );
		}
		else
		{
			_DeactivateWindows();
		}
			
		// Do we have a scroll area?
		if( scrwn )
		{
			// Make sure the scrolling rects adapt on scroll! (first time!)
			if( !scrwn.onscroll )
			{
				scrwn.scrollTopStart  = scrwn.scrollTop;
				scrwn.scrollLeftStart = scrwn.scrollLeft;
				scrwn.onscroll = DrawRegionSelector;
			}
			// Calculate the diff on scroll
			else
			{
				diffy = scrwn.scrollTopStart - scrwn.scrollTop;
				diffx = scrwn.scrollLeftStart - scrwn.scrollLeft;
			}
		
			// If mouse pointer is far down, do some scrolling
			var ty = my - window.regionWindow.parentNode.offsetTop;
			var tx = mx - window.regionWindow.parentNode.offsetLeft;
			if( ty < 40 )
				scrwn.scrollTop -= 10;
			else if ( ty - 30 > scrwn.offsetHeight - 30 )
				scrwn.scrollTop += 10;
		}
	}
	
	var d = ge ( 'RegionSelector' );
	if ( !d ) return;
	
	// Coordinate variables
	var wx = mx,				   wy = my;
	var dw = wx - window.regionX + ew - diffx; 
	var dh = wy - window.regionY + eh - diffy;
	var ox = diffx,				oy = diffy;
	
	// If we're selecting leftwards
	if ( dw < 0 )
	{
		ox = dw + diffx;
		dw = -dw;
	}
	// If we're selecting rightwards
	if ( dh < 0 )
	{
		oy = dh + diffy;
		dh = -dh;
	}
	if ( !dw || !dh ) return;
	
	// Set variables, all things considered!
	var dx = window.regionX + ox + ex;
	var dy = window.regionY + oy + ey;
	var odx = dx, ody = dy;
	
	// Some offset in windows or screens
	dy -= window.regionWindow.offsetTop;
	dx -= window.regionWindow.offsetLeft;
	
	// Set dimensions!
	d.style.width = dw + 'px';
	d.style.height = dh + 'px';
	d.style.top = dy + 'px';
	d.style.left = dx + 'px';
	
	// check icons
	if ( window.regionWindow )
	{
		var imx = dx;
		var imy = dy;
		
		// Scrolled window..
		if ( window.regionWindow.scroller && window.regionWindow.scroller.style )
		{
			var scr = parseInt ( window.regionWindow.scroller.scrollTop );
			if ( isNaN ( scr )) scr = 0;
			imy += scr;
		}
		
		var icos = window.regionWindow.icons;
		if ( icos )
		{
			for ( var a = 0; a < icos.length; a++ )
			{
				var ics = icos[a].domNode;
				// Coords on icon
				if( ics )
				{
					var ix1 = ics.offsetLeft;
					var iy1 = ics.offsetTop;
					var ix2 = ics.offsetWidth+ix1;
					var iy2 = ics.offsetHeight+iy1;
			
					// check overlapping icon
					var overlapping = ix1 >= imx && iy1 >= imy && ix2 <= imx+dw && iy2 <= imy+dh;
					// check intersecting icon on a horizontal line
					var intersecting1 = ix1 >= imx && ix2 <= imx+dw && ( ( imy >= iy1 && imy <= iy2 ) || ( imy+dh >= iy2 && imy <= iy2 ) );
					// check intersecting icon on a vertical line
					var intersecting2 = iy1 >= imy && iy2 <= imy+dh && ( ( imx >= ix1 && imx <= ix2 ) || ( imx+dw >= ix2 && imx <= ix2 ) );
					// check top left corner
					var intersecting3 = ix1 < imx && iy1 < imy && ix2 >= imx && iy2 >= imy;
					// check top right corner
					var intersecting4 = ix1 < imx+dw && iy1 < imy+dh && ix2 > imx && iy2 >= imy+dh;
					// check bottom left corner
					var intersecting5 = ix1 >= imx && ix2 >= imx+dw && iy2 <= imy+dh && ix1 <= imx+dw && iy2 >= imy;
					// check bottom right corner
					var intersecting6 = ix1 >= imx && iy1 >= imy && ix2 >= imx+dw && iy2 >= imy+dh && ix1 < imx+dw && iy1 < imy+dh;
					// Combine all
					var intersecting = intersecting1 || intersecting2 || intersecting3 || intersecting4 || intersecting5 || intersecting6;
				
					if ( overlapping || intersecting )
					{
						ics.className = ics.className.split ( ' Selected' ).join ( '' ) + ' Selected';
					}
					else if ( !sh ) ics.className = ics.className.split ( ' Selected' ).join ( '' );
				}
			}
		}
	}
}


// Gui modification / editing
function AbsolutePosition ( div, left, top, width, height )
{
	div.style.position = 'absolute';
	if ( left )
		div.style.left = left;
	if ( top ) 
		div.style.top = top;
	if ( width )
		div.style.width = width;
	if ( height )
		div.style.height = height;
}

// Make a table list with checkered bgs
function MakeTableList ( entries, headers )
{
	var str = '<table class="List" style="width: 100%">';
	var cols = 0;
	if ( headers )
	{
		str += '<tr>';
		for ( var a = 0; a < headers.length; a++ )
		{
			str += '<td>' + headers[a] + '</td>';
		}
		str += '</tr>';
		cols = headers.length;
	}
	if ( cols <= 0 )
		cols = entries[0].length;
	var sw = 1;
	for ( var a = 0; a < entries.length; a++ )
	{
		str += '<tr class="sw' + sw + '">';
		for ( var b = 0; b < cols; b++ )
		{
			str += '<td>' + entries[a][b] + '</td>';
		}
		sw = sw == 1 ? 2 : 1;
		str += '</tr>';
	}
	return str;
}

function removeWindowPopupMenus()
{
	// Deactivate workbench menu
	if( ge( 'WorkbenchMenu' ) )
		ge( 'WorkbenchMenu' ).isActivated = false;

	for( var a in movableWindows )
	{
		var cm = movableWindows[a];
		if( cm && cm.titleDiv && cm.titleDiv.popup )
		{
			var titl = cm.titleDiv;
			titl.removeChild( titl.popup );
			titl.popup = null;
		}
	}
}

var workbenchMenus = new Array ();
function SetMenuEntries ( menu, entries )
{
	if ( typeof ( workbenchMenus[menu] ) == 'undefined' ) 
		workbenchMenus[menu] = new Array ();
	workbenchMenus[menu].push ( entries );
	if ( typeof ( RefreshWorkbenchMenu ) != 'undefined' )
		RefreshWorkbenchMenu ();
}

// Just register we left the building
movableMouseUp = function ( e )
{
	if( !e ) e = window.event;
	
	window.fileMenuElement = null;
	window.mouseDown = false;
	window.mouseMoveFunc = false;
	document.body.style.cursor = '';
	
	// Execute the release function
	if( window.mouseReleaseFunc )
	{
		window.mouseReleaseFunc();
		window.mouseReleaseFunc = false;
	}
	
	// If we have a current movable window, stop "moving"
	if( window.currentMovable )
	{
		ExposeWindows();
		window.currentMovable.removeAttribute( 'moving' );
	}
	
	// Make sure the inner overlay is over screens
	if( window.currentScreen )
	{
		window.currentScreen.moveoverlay.style.display = 'none';
	}
	
	// Workbench menu is now hidden (only miga style)
	if( Workspace && Workspace.menuMode == 'miga' )
	{
		workspaceMenu.hide( e );
		workspaceMenu.close();
	}
	
	// If we selected icons, clear the select region
	ClearSelectRegion();
	
	// Execute drop function on mousepointer (and stop moving!)
	mousePointer.drop( e );	
	mousePointer.stopMove( e );
	RemoveDragTargets();
	
	if( Workspace.iconContextMenu )
	{
		Workspace.iconContextMenu.hide();
	}
}

// Remove all droptarget states
function RemoveDragTargets()
{
	var s = ge( 'DoorsScreen' );
	if( s )
	{
		// Make sure this is triggered to roll out of drop target
		if( s.classList.contains( 'DragTarget' ) )
			s.classList.remove( 'DragTarget' );
	}
}

// Check the screen title of active window/screen and check menu
function CheckScreenTitle( screen )
{	
	var testObject = screen ? screen : window.currentScreen;
	if( !testObject ) return;
	
	// Set screen title
	var csc = testObject.screenObject;
	
	// Set the screen title if we have a window with application name
	var wo = window.currentMovable ? window.currentMovable.windowObject : false;
	if( wo && wo.screen && wo.screen != csc ) wo = false; // Only movables on current screen
	
	var isDoorsScreen = testObject.id == 'DoorsScreen';	
	
	if( wo && wo.applicationName && ( !csc || testObject == wo.screen || ( !wo.screen && isDoorsScreen ) ) )
	{
		var wnd = wo.applicationDisplayName ? wo.applicationDisplayName : wo.applicationName;
		if( !csc.originalTitle )
		{
			csc.originalTitle = csc.getFlag( 'title' );
		}
		csc.setFlag( 'title', wnd );
	}
	// Just use the screen
	else if( csc.originalTitle )
	{
		csc.setFlag( 'title', csc.originalTitle );
	}

	// Enable the global menu
	if( Workspace && Workspace.menuMode == 'pear' )
	{
		workspaceMenu.show();
	}
}

pollingTaskbar = false;
function PollTaskbar( curr )
{
	if( pollingTaskbar ) return;
	if( globalConfig.viewList == 'docked' )
	{
		return PollDockedTaskbar(); // <- we are using the dock
	}
	var doorsScreen = ge( 'DoorsScreen' );
	pollingTaskbar = true;
	if( ge( 'Taskbar' ) )
	{
		var whw = 0; // whole width
		var swi = ge( 'Taskbar' ).offsetWidth;
		
		var t = ge( 'Taskbar' );
		var queue = Math.floor( Math.random() * 65 );
		
		// When activated normally
		if ( !curr )
		{
			t.innerHTML = '';
			t.tasks = [];
			var lst = [ movableWindows, Workspace.applications ];
			for( var zo in lst )
			{
				for( var a in lst[zo] )
				{
					var d = false;
					
					// Movable windows
					if( zo == 0 )
					{
						var pn = movableWindows[a];
						// Don't care about views on other screens
						// In native mode, we will list all
						// TODO: Connect views to screens better (not on dom parentNode)
						//       so it works in native mode
						if( Workspace.interfaceMode != 'native' )
						{
							if( pn && pn.parentNode != doorsScreen ) continue;
						}
				
						// Lets see if the view is a task we manage
						var found = false;
						for( var c = 0; c < t.tasks.length; c++ )
						{
							if ( t.tasks[c] == movableWindows[a].viewId )
							{
								found = true; // don't add twice
							}
						}
						if( found ) continue;
				
						// Skip hidden ones
						if( movableWindows[a].content.flags['hidden'] == true )
							continue;
							
						// New view!
						t.tasks.push( movableWindows[a].viewId );
						d = document.createElement ( 'div' );
						d.viewId = movableWindows[a].viewId;
						d.className = movableWindows[a].getAttribute( 'minimized' ) == 'minimized' ? 'Task Hidden' : 'Task';
						if( movableWindows[a] == currentMovable ) 
							d.className += ' Active';
						d.window = movableWindows[a];
						d.applicationId = d.window.applicationId;
						d.innerHTML = d.window.titleString;
					}
					// Applications (native)
					else
					{
						if( !Workspace.applications[a].pid ) continue;
						var found = false;
						for( var c = 0; c < t.tasks.length; c++ )
						{
							if( !Workspace.applications[a].pid )
								continue;
							if ( t.tasks[c] == 'native_' + Workspace.applications[a].pid )
							{
								found = true; // don't add twice
							}
						}
						if( found ) continue;
						
						// New view!
						t.tasks.push( 'native_' + Workspace.applications[a].pid );
						d = document.createElement ( 'div' );
						d.viewId = 'native_' + Workspace.applications[a].pid;
						d.className = Workspace.applications[a].minimized ? 'Task Hidden' : 'Task';
						
						d.window = Workspace.applications[a];
						d.applicationId = d.window.pid;
						d.innerHTML = d.window.name;
					}
					d.onmouseup = function( e, extarg )
					{
						if ( !e ) e = window.event;
						var targ = e ? ( e.target ? e.target : e.srcElement ) : false;
						if( extarg ) targ = extarg;
						var divs = this.parentNode.getElementsByTagName( 'div' );
						for( var b = 0; b < divs.length; b++ )
						{
							if ( divs[b].className.indexOf( 'Task' ) < 0 ) continue;
							if ( divs[b] == this )
							{
								if ( divs[b].className.indexOf( 'Task Active' ) == 0 )
								{
									if ( targ && targ.className && targ.className.indexOf ( 'Task Active' ) == 0 )
									{
										var w = divs[b].window;
										// Natives
										if( w && w.pid && w.viewId )
										{
											if( w.minimized )
											{
												Workspace.restoreNativeWindow( w.viewId );
												w.minimized = false;
											}
											else
											{
												Workspace.minimizeNativeWindow( w.viewId );
												w.minimized = true;
											}
										}
										// Divs
										else
										{
											if( w.getAttribute( 'minimized' ) == 'minimized' )
											{
												w.setAttribute( 'minimized', '' );
												targ.className = 'Task Active';
												w.style.left = w.maximizedLeft;
												w.windowObject.setFlag( 'minimized', false );
											}
											else 
											{
												w.setAttribute( 'minimized', 'minimized' );
												targ.className = 'Task Active Hidden';
												w.maximizedLeft = w.style.left;
												w.style.left = targ.offsetLeft + 'px';
												w.windowObject.setFlag( 'minimized', true );
											}
										}
									}
								}
								else
								{
									if ( targ && targ.className && targ.className.indexOf ( 'Task' ) == 0 )
									{
										// Natives
										var w = this.window;
										if( w && w.pid && w.viewId )
										{
											if( w.minimized )
											{
												Workspace.restoreNativeWindow( w.viewId );
												w.minimized = false;
											}
											else
											{
												Workspace.minimizeNativeWindow( w.viewId );
												w.minimized = true;
											}
										}
										else
										{
											divs[b].window.setAttribute( 'minimized', '' );
											divs[b].window.style.left = w.maximizedLeft;
											divs[b].window.windowObject.setFlag( 'minimized', false );
										}
									}
									divs[b].className = 'Task Active';
									_ActivateWindow ( divs[b].window, 1, e );
									if ( targ && targ.className && targ.className.indexOf ( 'Task' ) == 0 )
										_WindowToFront ( divs[b].window );
								}
							}
							else
							{
								divs[b].className = divs[b].className.indexOf ( 'Hidden' ) > 0 ? 'Task Hidden' : 'Task';
							}
						}
					}
					d.addEventListener( 'touchstart', d.onmouseup, false ); // <- mobile
					t.appendChild( d );
					d.origWidth = d.offsetWidth + 20;
				
					// Check if we opened a window
					if( d.applicationId )
					{
						var running = ge( 'Tasks' ).getElementsByTagName( 'iframe' );
						for( var a = 0; a < running.length; a++ )
						{
							var task = running[a];
							// Find the window!
							if( task.applicationId == d.applicationId )
							{
								// If we have a match!
								d.style.backgroundImage = 'url(' + task.icon + ')';
							}
						}
					}
				}
			}
		}
		
		// When activating on the window
		var isFull = ge( 'Taskbar' ).getAttribute( 'full' ) == 'full';
		var divs = t.getElementsByTagName ( 'div' );
		for( var b = 0; b < divs.length; b++ )
		{
			if( divs[b].className.indexOf ( 'Task' ) < 0 ) continue;
			if( !isFull ) divs[b].origWidth = divs[b].offsetWidth;
			whw += divs[b].origWidth + 20; // todo calc size
			if ( divs[b].window == curr )
			{
				divs[b].onmouseup();
			}
		}
		
		// Can't 
		if( whw >= swi )
		{
			ge( 'Taskbar' ).setAttribute( 'full', 'full' );
		}
		// We deleted some
		else
		{
			ge( 'Taskbar' ).setAttribute( 'full', 'no' );
		}	
	}
	
	// Manage running apps -------
	
	// Just check if the app represented on the desklet is running
	for( var a = 0; a < __desklets.length; a++ )
	{
		var desklet = __desklets[a];
		
		for( var c = 0; c < desklet.dom.childNodes.length; c++ )
		{
			desklet.dom.childNodes[c].running = false;
		}
		
		for( var b in movableWindows )
		{
			if( movableWindows[b].windowObject )
			{
				var app = movableWindows[b].windowObject.applicationName;
				
				// Try to find the application if it is an application window
				for( var c = 0; c < desklet.dom.childNodes.length; c++ )
				{
					if( app && desklet.dom.childNodes[c].executable == app )
					{
						desklet.dom.childNodes[c].classList.add( 'Running' );
						desklet.dom.childNodes[c].running = true;
					}
				}
			}
		}
	
		// Just check if the app represented on the desklet is running
		for( var c = 0; c < desklet.dom.childNodes.length; c++ )
		{
			if( desklet.dom.childNodes[c].running == false )
			{
				desklet.dom.childNodes[c].classList.remove( 'Running' );
				desklet.dom.childNodes[c].classList.remove( 'Minimized' );
			}
		}
	}
	
	PollTray();
	pollingTaskbar = false;
}

// A docked taskbar uses the dock desklet!
function PollDockedTaskbar()
{
	PollTray();
	for( var a = 0; a < __desklets.length; a++ )
	{
		var desklet = __desklets[a];
		var dom = desklet.dom;
		var changed = false;
		
		if( !desklet.viewList )
		{
			var wl = document.createElement( 'div' );
			desklet.viewList = wl;
			wl.className = 'ViewList';
			dom.appendChild( wl );
		}
		
		// Clear existing viewlist items that are removed
		var remove = [];
		for( var y = 0; y < desklet.viewList.childNodes.length; y++ )
		{
			if( !movableWindows[desklet.viewList.childNodes[y].viewId] )
				remove.push( desklet.viewList.childNodes[y] );
		}
		if( remove.length )
		{
			for( var y = 0; y < remove.length; y++ )
				desklet.viewList.removeChild( remove[y] );
			changed++;
		}
		
		// Clear views that are managed by launchers
		for( var y = 0; y < desklet.dom.childNodes.length; y++ )
		{
			var dy = desklet.dom.childNodes[y];
			if( dy.views )
			{
				var out = [];
				for( var o in dy.views )
				{
					if( movableWindows[o] )
						out[o] = dy.views[o];
				}
				dy.views = out;
			}
		}
		
		var wl = desklet.viewList;
		
		// Just check if the app represented on the desklet is running
		for( var c = 0; c < desklet.dom.childNodes.length; c++ )
		{
			desklet.dom.childNodes[c].running = false;
		}
		
		for( var b in movableWindows )
		{
			if( movableWindows[b].windowObject )
			{
				var app = movableWindows[b].windowObject.applicationName;
				var win = b;
				var wino = movableWindows[b];
				var found = false;
				// Try to find view in viewlist
				for( var c = 0; c < desklet.viewList.childNodes.length; c++ )
				{
					if( desklet.viewList.childNodes[c].viewId == win )
					{
						found = movableWindows[b];
						break;
					}
				}
				// Try to find the application if it is an application window
				if( !found )
				{
					for( var c = 0; c < desklet.dom.childNodes.length; c++ )
					{
						if( app && desklet.dom.childNodes[c].executable == app )
						{
							found = desklet.dom.childNodes[c].executable;
							desklet.dom.childNodes[c].classList.add( 'Running' );
							desklet.dom.childNodes[c].running = true;
						}
					}
				}
				
				// If it's a found app, check if it isn't a single instance app
				if( found && typeof( found ) == 'string' )
				{
					// Single instance apps handle themselves
					if( !friend.singleInstanceApps[ found ] )
					{
						for( var c = 0; c < desklet.dom.childNodes.length; c++ )
						{
							var d = desklet.dom.childNodes[c];
							if( d.className != 'Launcher' ) continue;
							if( d.executable == found )
							{
								if( !d.views ) d.views = [];
								if( !d.views[win] ) d.views[win] = wino;
								// Clear non existing
								var out = [];
								for( var i in d.views )
									if( movableWindows[i] ) out[i] = d.views[i];
								d.views = out;
							}
						}
					}
				}
				
				// Check for an app icon
				var labelIcon = false;
				if( app && ge( 'Tasks' ) )
				{
					var tk = ge( 'Tasks' ).getElementsByTagName( 'iframe' );
					for( var a1 = 0; a1 < tk.length; a1++ )
					{
						if( tk[a1].applicationName != app ) continue;
						var f = tk[a1].parentNode;
						if( f.className && f.className == 'AppSandbox' )
						{
							var img = f.getElementsByTagName( 'div' );
							for( var b1 = 0; b1 < img.length; b1++ )
							{
								if( img[b1].style.backgroundImage )
								{
									labelIcon = document.createElement( 'div' );
									labelIcon.style.backgroundImage = img[b1].style.backgroundImage;
									labelIcon.className = 'LabelIcon';
									break;
								}
							}
						}
					}
				}
				
				// Add the window list item into the desklet
				if( !found )
				{
					var viewRep = document.createElement( 'div' );
					viewRep.className = 'Launcher View';
					if( labelIcon ) viewRep.appendChild( labelIcon );
					if( app ) viewRep.classList.add( app );
					viewRep.style.backgroundSize = 'contain';
					viewRep.state = 'visible';
					viewRep.viewId = win;
					viewRep.setAttribute( 'title', movableWindows[win].titleString );
					viewRep.onclick = function()
					{
						this.state = this.state == 'visible' ? 'hidden' : 'visible';
						if( this.state == 'hidden' )
							this.classList.add( 'Minimized' );
						else this.classList.remove( 'Minimized' );
						movableWindows[this.viewId].windowObject.setFlag( 'hidden', this.state == 'hidden' ? true : false );
						_WindowToFront( movableWindows[this.viewId] );
					}
					desklet.viewList.appendChild( viewRep );
					changed++;
				}
				else
				{
				}
			}
		}
		
		// Just check if the app represented on the desklet is running
		for( var c = 0; c < desklet.dom.childNodes.length; c++ )
		{
			if( desklet.dom.childNodes[c].running == false )
			{
				desklet.dom.childNodes[c].classList.remove( 'Running' );
				desklet.dom.childNodes[c].classList.remove( 'Minimized' );
			}
		}
		
		if( changed ) desklet.render();
	}
}

// Notify the user!
// format: msg{ title: 'sffs', text: 'fslkjsl' }
function Notify( msg, callback, clickcallback )
{
	if( !Workspace.notifications ) return;
	
	var n = {
		msg: msg,
		date: ( new Date() ).getTime(),
		application: msg.application
	};
	
	// Add dom element
	var d = document.createElement( 'div' );
	d.className = 'BubbleInfo';
	var i = document.createElement( 'div' );
	i.innerHTML = '<p class="Layout"><strong>' + msg.title + '</strong></p><p class="Layout">' + msg.text + '</p>';
	d.appendChild( i );
	d.style.opacity = 0;
	
	// Find notification
	var chn = ge( 'Tray' ).childNodes;
	var notification = false;
	for( var a = 0; a < chn.length; a++ )
	{
		if( chn[a].className && chn[a].classList.contains( 'Notification' ) )
		{
			notification = chn[a];
			break;
		}
	}
	
	// Create parent node
	if( !notification )
	{
		notification = document.createElement( 'div' );
		notification.className = 'TrayElement Notification IconSmall';
		ge( 'Tray' ).appendChild( notification );
	}
	
	// Add notification bubble
	notification.appendChild( d );
	
	// When clicking the bubble
	// :)
	if( clickcallback )
		d.onclick = clickcallback;
	
	// Do the fading
	setTimeout( function()
	{
		d.style.opacity = 1;
		setTimeout( function(){ d.style.opacity = 0; }, 4000 );
		setTimeout( function(){ 
			notification.removeChild( d ); 
			if( !notification.getElementsByTagName( 'div' ).length )
			{
				ge( 'Tray' ).removeChild( notification );
			}
			if( callback && typeof( callback ) == 'function' ) callback();
		}, 4750 );
	}, 25 );
	
	// Add to global notification stack
	Workspace.notifications.push( n );
	Workspace.renderNotifications();
}

// Poll the tray for elements
function PollTray()
{
	var tray = ge( 'Tray' );
	if( !tray )
		return;
	
	// TODO: Do this dynamically
	var s = tray.getElementsByTagName( 'div' );
	
	// Check various stuff
	var tasks = false;
	for( var a = 0; a < s.length; a++ )
	{
		if( s[a].parentNode != tray ) continue;
		if( s[a].classList.contains( 'Tasks' ) )
		{
			tasks = s[a];
			tasks.poll();
		}
	}
	if( !tasks )
	{
		tasks = document.createElement( 'div' );
		tasks.className = 'Tasks TrayElement IconSmall';
		tasks.poll = function()
		{
			var taskn = Workspace.applications.length;
			this.innerHTML = '<div class="BubbleInfo"><div>' + taskn + ' ' + ( taskn == 1 ? i18n( 'i18n_task_running' ) : i18n( 'i18n_tasks_running' ) ) + '.</div></div>';
		}
		tray.appendChild( tasks );
	}
	
	/* No mic */
	if( 1 == 2 )
	{
		var mic = false;
		for( var a = 0; a < s.length; a++ )
		{
			if( !s[a].className ) continue;
			if( s[a].className.indexOf( 'Microphone' ) == 0 )
				mic = s[a];
		}
		// TODO: Reenable mic when it works.
		mic.style.display = 'none';
		mic.onclick = function()
		{
			if( Doors.handsFree )
			{
				var btn = Doors.handsFree.getElementsByClassName( 'si-btn' )[0];
				if( btn.recognition ) btn.recognition.stop();
				Doors.handsFree.parentNode.removeChild( Doors.handsFree );
				Doors.handsFree = false;
				return;
			}
			var f = new File( 'System:templates/handsfree.html' );
			f.onLoad = function( data )
			{
				var d = document.createElement( 'div' );
				d.id = 'Handsfree';
				d.innerHTML = data;
				document.body.insertBefore( d, document.body.firstChild );
				Doors.handsFree = d;
			
				// For other browsers
				if ( !( 'webkitSpeechRecognition' in window ) )
				{
					var inp = ge( 'Handsfree' ).getElementsByTagName( 'input' )[0];
					inp.focus();
					return;
				}
				else
				{
					setTimeout( function( e )
					{
						var dv = ge( 'Handsfree' ).getElementsByTagName( 'button' )[0];
						dv.onclick = function( e )
						{
							return cancelBubble( e );
						}
						dv.click();
					}, 100 );
					// Remove it
					d.onclick = function()
					{
						mic.onclick();
						var stopper = ge( 'Tray' ).getElementsByClassName( 'Microphone' );
						if( stopper.length ) stopper = stopper[0];
						if( stopper )
						{
							stopper.className = 'Microphone IconSmall fa-microphone-slash';
						}
					}
				}
				// For google chrome
				InitSpeechControls( function()
				{
					Say( 'Voice mode started.', false, 'both' );
				} );
			}
			f.load();
		}
	}
}

function ClearSelectRegion()
{
	if( ge ( 'RegionSelector' ) )
	{
		Workspace.refreshMenu();
		
		var s = ge ( 'RegionSelector' );
		s.parentNode.removeChild( s );
	}
	// Nullify initial settings
	if( window.regionWindow )
	{
		if( window.regionWindow.scroller )
		{
			window.regionWindow.scroller.onscroll = null;
		}
	}
}

movableMouseDown = function ( e )
{
	if ( !e ) e = window.event;
	
	// Menu trigger
	var rc = 0;
	if ( e.which ) rc = ( e.which == 3 );
	else if ( e.button ) rc = ( e.button == 2 );
	
	// TODO: Allow context menus!
	if ( rc || e.button != 0 ) 
		return cancelBubble ( e );
	
	if( Workspace.iconContextMenu )
	{
		Workspace.iconContextMenu.hide();
	}
	
	var sh = e.shiftKey || e.ctrlKey;
	
	// Get target
	var tar = e.srcElement ? e.srcElement : e.target;
	
	// Zero scroll
	window.regionScrollLeft = 0;
	window.regionScrollTop = 0;
	
	// Clicking inside content
	if ( tar.className == 'Scroller' && tar.parentNode.className == 'Content' )
	{
		tar = tar.parentNode;
	}
	if(
		// Desktop selection
		( tar.className == 'ScreenContent' ) ||
		// Making selection on content window!
		( tar.classList.contains( 'Content' ) && tar.parentNode.classList.contains ( 'View' ) )
	)
	{
		if( !sh )
		{
			clearRegionIcons();
		}
		window.mouseDown = 4;
		window.regionX = windowMouseX;
		window.regionY = windowMouseY;
		if( tar ) window.regionWindow = tar;
		else window.regionWindow = ge( 'DoorsScreen' );
		if( tar.className == 'ScreenContent' )
		{
			// Clicking from an active view to screen
			DefaultToWorkspaceScreen( tar );
		}
		else 
		{
			CheckScreenTitle();
		}
		return cancelBubble( 2 );
	}
}

// Go into standard Workspace user mode (f.ex. clicking on wallpaper)
function DefaultToWorkspaceScreen( tar ) // tar = click target
{
	FocusOnNothing();
	removeWindowPopupMenus();
	workspaceMenu.close();
}

function clearRegionIcons()
{
	// No icons selected now..
	friend.iconsSelectedCount = 0;

	// Clear all icons
	for( var a in movableWindows )
	{
		var w = movableWindows[a];
		if( w.content && w.content.icons )
			w = w.content;
		if ( w.icons )
		{
			for ( var a = 0; a < w.icons.length; a++ )
			{
				var ic = w.icons[a].domNode;
				if( ic && ic.className )
					ic.className = ic.className.split ( ' Selected' ).join ( '' );
			}
		}
	}
	// Clear desktop icons
	if( Doors.screen && Doors.screen.contentDiv.icons )
	{
		for( var a = 0; a < Doors.screen.contentDiv.icons.length; a++ )
		{
			var ic = Doors.screen.contentDiv.icons[a].domNode;
			if( !ic ) continue;
			ic.className = ic.className.split ( ' Selected' ).join ( '' );
		}
	}
}

function contextMenu( e )
{
	if ( !e ) e = window.event;
	var tar = e.target ? e.target : e.srcEvent;
	if ( !tar ) return;
	var mov, mov2, mov3;
	var mdl = GetTitleBarG ();
	if ( tar.parentNode )
		mov = tar.parentNode.className && tar.parentNode.className.indexOf ( ' View' ) >= 0;
	if ( tar.parentNode && tar.parentNode.parentNode && tar.parentNode.parentNode.className )
		mov2 = tar.parentNode.parentNode.className.indexOf ( ' View' ) >= 0;
	if ( tar.parentNode && tar.parentNode.parentNode && tar.parentNode.parentNode.parentNode && tar.parentNode.parentNode.parentNode.className )
		mov3 = tar.parentNode.parentNode.parentNode.className.indexOf ( ' View' ) >= 0;
	
	if ( 
		tar.className == 'ScreenContent' || 
		windowMouseY < (mdl?mdl.offsetHeight:0) || 
		( tar.className == 'Content' && mov ) ||
		( tar.className == 'Title' && mov ) ||
		( tar.parentNode.className == 'Title' && mov2 ) ||
		( tar.className == 'MoveOverlay' && mov ) ||
		( tar.className == 'Resize' && mov ) ||
		( tar.parentNode.parentNode && tar.parentNode.parentNode.className == 'Title' && mov3 )
	)
	{
		window.mouseDown = false;
		workspaceMenu.show();
	}
	return cancelBubble( e );
}

function FixWindowDimensions ( mw )
{
	SetWindowFlag ( mw, 'min-height', mw.parentNode.offsetHeight );
	SetWindowFlag ( mw, 'max-height', mw.parentNode.offsetHeight );
	SetWindowFlag ( mw, 'min-width', mw.parentNode.offsetWidth );
	SetWindowFlag ( mw, 'max-width', mw.parentNode.offsetWidth );
}

function ElementWindow ( ele )
{
	// Check if this element is in a window
	while ( ele != document.body )
	{
		ele = ele.parentNode;
		if ( ele.className && ele.className.indexOf ( ' View' ) >= 0 )
		{
			if ( ele.content ) return ele.content;
			return ele;
		}
	}
	return false;
}

function InitGuibaseEvents()
{
	if ( document.attachEvent )
		document.attachEvent ( 'onmousemove', movableListener, false );
	else window.addEventListener ( 'mousemove', movableListener, false );
	if ( document.attachEvent )
		document.attachEvent ( 'onresize', movableListener, false );
	else window.addEventListener ( 'resize', movableListener, false );

	if ( document.attachEvent )
		document.attachEvent ( 'onmouseup', movableMouseUp, false );
	else window.addEventListener ( 'mouseup', movableMouseUp, false );

	window.addEventListener( 'touchend', movableMouseUp, false );

	if ( document.attachEvent )
		document.attachEvent ( 'onmousedown', movableMouseDown, false );
	else window.addEventListener ( 'mousedown', movableMouseDown, false );

	if ( document.attachEvent )
		document.attachEvent ( 'oncontextmenu', contextMenu, false );
	else window.addEventListener ( 'contextmenu', contextMenu, false );
	document.oncontextmenu = contextMenu;
}

var __titlebarg = false;
function GetTitleBarG ()
{
	if ( typeof ( window.currentScreen ) != 'undefined' )
		return window.currentScreen.getElementsByTagName ( 'div' )[0];
	if ( !__titlebarg )
		__titlebarg = ge ( 'Modules' ) ? ge ( 'Modules' ) : ( ge ( 'TitleBar' ) ? ge ( 'TitleBar' ) : false );
	return __titlebarg;
}

function ClearMenuItemStyling( par )
{
	var lis = par.getElementsByTagName( 'li' );
	for( var a = 0; a < lis.length; a++ ) 
	{
		var sp = lis[a].getElementsByTagName( 'span' );
		if( sp && sp[0] ) sp[0].className = '';
	}
}

function FocusOnNothing()
{
	if( !window.currentMovable ) return;
	
	_DeactivateWindows();
	
	// Put focus somewhere else than where it is now..
	// Blur like hell! :)
	for( var a in movableWindows )
	{
		if( movableWindows[a].windowObject )
			movableWindows[a].windowObject.sendMessage( { command: 'blur' } );
	}
	var eles = document.getElementsByTagName( '*' );
	for( var a = 0; a < eles.length; a++ )
		eles[a].blur();
}

// Alert box, blocking a window
function AlertBox( title, desc, buttons, win )
{
	// New view
	var w = new View( {
		title: title,
		width: 380,
		height: 200
	} );
	
	for( var a in buttons )
		buttonml += '<button class="IconSmall ' + buttons[a].className + '">' + buttons[a].text + '</button>';
	
	var ml = '<div class="Dialog"><div class="DialogContent">' + desc + '</div><div class="DialogButtons">' + buttonml + '</div></div>';
	
	w.setContent( ml );
	
	// Collect added dom elements
	var eles = w.content.getElementsByTagName( 'button' );
	var dbuttons = [];
	for( var a = 0; a < eles.length; a++ )
	{
		// TODO: Make safer!
		if( eles[a].parentNode.className == 'DialogButtons' && eles[a].parentNode.parentNode == 'Dialog' )
		{
			dbuttons.push( eles[a] );
		}
	}
	
	// Set onclick actions
	for( var c = 0; c < buttons.length; c++ )
	{
		dbuttons[c].view = w;
		dbuttons[c].onclick = buttons.onclick;
	}
	
	// Apply blocker if needed
	if( win ) w.setBlocker( win );
}

// Is it a shared app?
function IsSharedApp()
{
	return GetDOMHead().getAttribute( 'sharedapp' );
}

function GetDOMHead()
{
	if( !window._domHead )
	{
		window._domHead = document.getElementsByTagName( 'head' )[0];
	}
	return window._domHead;
}

// COLOR PROCESSOR IS NOT USED AND CAN BE DELETED! -----------------------------

// Setup a color processor
_colorProcessor = false;
function LockColorProcessor()
{
	if( !_colorProcessor )
	{
		// Make it and get it out of the way
		_colorProcessor = document.createElement( 'canvas' );
		_colorProcessor.style.width = 320;
		_colorProcessor.style.height = 200;
		//_colorProcessor.style.visibility = 'hidden';
		_colorProcessor.style.pointerEvents = 'none';
		//_colorProcessor.style.top = '-320px';
		_colorProcessor.style.position = 'absolute';
		document.body.appendChild( _colorProcessor );
		_colorProcessor.ctx = _colorProcessor.getContext( '2d' );
	}
	if( _colorProcessor.lock ) return false;
	_colorProcessor.lock = true;
	return _colorProcessor;
}

function UnlockColorProcessor()
{
	_colorProcessor.lock = false;
}

// Take an image and look for average color
function FindImageColorProduct( img )
{
	var c = LockColorProcessor();
	if( c )
	{
		c.ctx.drawImage( img, 0, 0, 320, 200 );
		var imgd = c.ctx.getImageData( 0, 0, 320, 200 );
		var average = { r: 0, g: 0, b: 0 };
		var steps = 8;
		var increments = steps << 2; // * 4
		for( var i = 0; i < imgd.data.length; i += increments )
		{
			average.r += imgd.data[ i   ];
			average.g += imgd.data[ i+1 ];
			average.b += imgd.data[ i+2 ];
		}
		average.r /= imgd.data.length / steps;
		average.g /= imgd.data.length / steps;
		average.b /= imgd.data.length / steps;
		average.r = Math.floor( average.r );
		average.g = Math.floor( average.g );
		average.b = Math.floor( average.b );
		UnlockColorProcessor();
		return average;
	}
	return false;
}

// END COLOR PROCESSOR ---------------------------------------------------------

// Disposable menu for mobile use ----------------------------------------------

var FullscreenMenu = function()
{
	var t = this;
	this.dom = ge( 'MobileMenu' );
	this.items = [];
	if( !this.dom ) return;
	
	this.addMenuItem = function( mitem )
	{
		this.items.push( mitem );
	}
	
	this.show = function( heading, men ) // With an optional menu
	{	
		// Generate menu from workspace menu
		if( men && typeof( men ) == 'string' )
		{
			var f = false;
			for( var a = 0; a < Workspace.menu.length; a++ )
			{
				if( Workspace.menu[a].name == men )
				{
					f = true;
					men = Workspace.menu[a].items;
				}
			}
			if( !f ) men = false;
		}
		
		friend.currentMenuItems = false; // <- make it regenerate
		this.dom.innerHTML = '';
		var root = document.createElement( 'div' );
		root.className = 'Menu';
		root.innerHTML = heading ? heading : i18n( 'i18n_choose_disk' );
		var menuCn = document.createElement( 'ul' );
		root.appendChild( menuCn );
		
		// Set items to display
		var items = this.items;
		if( men ) items = men;
		
		for( var a = 0; a < items.length; a++ )
		{
			menuCn.appendChild( this.createMenuItem( items[a] ) );
		}
		this.dom.appendChild( root );
		
		var d = _addMobileMenuClose();
		this.dom.closeMenu = d;
		this.dom.classList.add( 'Visible' );
		this.dom.scrollTop = 0;
		setTimeout( function(){ t.dom.classList.add( 'Showing' ); }, 5 );
	}
	this.createMenuItem = function( m )
	{
		var mitem = m;
		var menu = document.createElement( 'li' );
		if( m.disabled )
		{
			menu.classList.add( 'Disabled' );
		}
		if( m.divider == true )
		{
			menu.classList.add( 'Divider' );
			menu.innerHTML = '';
		}
		else menu.innerHTML = '<span>' + ( mitem.name ? mitem.name : mitem.text ) + '</span>';
		menu.onclick = function()
		{
			if( this.clicked ) return;
			this.clicked = true;
			if( mitem.command ) mitem.onclick = mitem.command;
			if( mitem.onclick )
				mitem.onclick();
			else if( mitem.clickItem )
				mitem.clickItem.onclick();
			t.dom.classList.remove( 'Visible' );
			_mobileMenuClose();
		}
		if( m.clickItem && m.clickItem.firstChild && m.clickItem.firstChild.firstChild )
		{
			var o = document.createElement( 'div' );
			o.className = m.clickItem.className;
			o.innerHTML = m.clickItem.innerHTML;
			menu.innerHTML = '<span class="IconText">' + mitem.text + '</span>';
			menu.appendChild( o );
		}
		return menu;
	}
}

// Add a close button
function _addMobileMenuClose()
{
	if( !ge( 'MobileMenuClose' ) )
	{
		var d = document.createElement( 'span' );
		d.id = 'MobileMenuClose';
		d.className = 'Close IconMedium fa-close';
		d.style.top = '-50px';
		d.innerHTML = i18n( 'i18n_close_menu' );
		d.onclick = function()
		{
			workspaceMenu.close();
			_mobileMenuClose( d );
		}
		document.body.appendChild( d );
		ge( 'MobileMenu' ).closeMenu = d;
		setTimeout( function(){ d.style.top = '0px'; }, 5 );
		return d;
	}
	return ge( 'MobileMenuClose' );
}

// Close the menu
function _mobileMenuClose( ele )
{
	var d = ele ? ele : ge( 'MobileMenuClose' );
	if( d )
	{
		d.style.top = '-50px';
		ge( 'MobileMenu' ).closeMenu = false;
		setTimeout( function(){ if( d && d.parentNode ) d.parentNode.removeChild( d ); }, 500 );
	}
}

// End disposable menu for mobile use ------------------------------------------

/* Bubble emitter for tutorials and help ------------------------------------ */
/* This is bubbles for showing localized help on Workspace scoped elements.   */

function HelpBubble( element, text, uniqueid )
{
}



