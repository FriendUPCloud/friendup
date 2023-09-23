/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var __desklets = [];

function GuiDeskletScrollHorizontal( e )
{
	var l = ge( 'DockWindowList' );
	if( !l ) return;
	var lw = l.offsetWidth;
	var m = e.clientX - l.offsetLeft;
	if( m >= lw ) m = lw - 1;
	var end = l.childNodes[ l.childNodes.length - 1 ];
	if( !end ) { l.scrollLeft = 0; l.scrollTop = 0; return; }
	var whole = end.offsetLeft + end.offsetWidth + 10;
	var off = m / lw * ( whole - lw );
	l.scrollLeft = off;
	l.scrollTop = 0;
}

function GuiDeskletScrollVertical( e )
{
	var l = ge( 'DockWindowList' );
	if( !l ) return;
	var lh = l.offsetHeight;
	var m = e.clientY - l.offsetTop;
	if( m >= lh ) m = lh - 1;
	var end = l.childNodes[ l.childNodes.length - 1 ];
	if( !end ) { l.scrollLeft = 0; l.scrollTop = 0; return }
	var whole = end.offsetTop + end.offsetHeight + 10;
	var off = m / lh * ( whole - lh );
	l.scrollLeft = 0;
	l.scrollTop = off;
}


// A desklet that can be moved around on top of a div
GuiDesklet = function ( pobj, width, height, pos, px, py )
{
	this.margin = 4;
	
	// Make a unique div id
	this.makeUniqueId = function ()
	{
		var id = 'desklet_';
		var num = 0;
		while ( ge ( id + num ) )
		{
			num++;
		}
		return id + num;
	}
	
	this.width = width;
	this.height = height;
	this.pos = pos;
	
	// Initial layout
	this.conf = {
		width: width,
		height: height,
		position: pos,
		dockx: px,
		docky: py
	};
	
	var self = this; // Reference for other scopes
	
	// Setup desklets array on parent object
	if ( !pobj.desklets ) pobj.desklets = [];
	if ( !pobj.refreshDesklets )
	{
		pobj.refreshDesklets = function ()
		{
			for ( var a = 0; a < this.desklets.length; a++ )
				this.desklets[a].refresh ();
		}
	}
	this.desktop = pobj;
	
	// Create dom node
	this.dom = document.createElement ( 'div' );
	this.dom.style.width = '10px';
	this.dom.style.height = '10px';
	this.dom.className = 'Desklet Initializing';
	this.dom.id = this.makeUniqueId ();
	this.desktop.appendChild ( this.dom );
	this.dom.events = [];
	this.dom.desklet = this;
	this.dom.object = this;
	this.addEvent = function( eve, func )
	{
		if( typeof( this.dom.events ) == 'undefined' )
			this.dom.events = [];
		if( typeof( this.dom.events[eve] ) == 'undefined' )
			this.dom.events[eve] = [];
	}
	
	// Add events --------------------------------------------------------------
	
	this.dom.onmousedown = function ( e )
	{
		if( !e ) e = window.event;
		if( typeof ( this.events['mousedown'] ) != 'undefined' )
		{
			for( var a = 0; a < this.events['mousedown'].length; a++ )
			{
				this.events['mousedown'][a]( e );
			}
		}
	}
	
	this.dom.clickFunc = function( e )
	{
		if ( !e ) e = window.event;
		if ( this.events && typeof ( this.events['click'] ) != 'undefined' )
		{
			for ( var a = 0; a < this.events['click'].length; a++ )
			{
				this.events['click'][a]( e );
			}
		}
		if( window.isMobile )
		{
			if( !this.object.open )
			{
				this.desklet.openDesklet();
			}
			else
			{
				this.desklet.closeDesklet();
			}
		}
	}
	
	if( !isMobile )
	{
		this.dom.onclick = this.clickFunc;
	}
	else
	{
		// For touch devices
		this.dom.addEventListener( 'touchstart', function( e )
		{
			this.touchX = e.touches[0].pageX;
			this.touchY = e.touches[0].pageY;
		}, false );
		this.dom.addEventListener( 'touchend', function( e )
		{
			if( !e.changedTouches ) return
			
			var px = e.changedTouches[0].clientX;
			var py = e.changedTouches[0].clientY;
			
			var disty = py - this.touchY;
			
			var dist = Math.sqrt( Math.pow( this.touchX - px, 2 ) + Math.pow( this.touchY - py, 2 ) );
			if( disty > 100 || !this.classList.contains( 'Open' ) )
			{
				this.clickFunc( e );
			}
		}, false );
	}
	
	this.dom.onmouseup = function ( e )
	{
		if ( !e ) e = window.event;
		if ( typeof ( this.events['mouseup'] ) != 'undefined' )
		{
			for ( var a = 0; a < this.events['mouseup'].length; a++ )
			{
				this.events['mouseup'][a]( e );
			}
		}
	}
	this.dom.onmousemove = function ( e )
	{
		if ( !e ) e = window.event;
		if ( typeof ( this.events['mousemove'] ) != 'undefined' )
		{
			for ( var a = 0; a < this.events['mousemove'].length; a++ )
			{
				this.events['mousemove'][a]( e );
			}
		}
	}
	
	// Done events -------------------------------------------------------------
	
	// For mobile version ------------------------------------------------------
	
	this.openDesklet = function( e )
	{
		if( this.openLock ) return;
		var self = this;
		if( !this.open && !this.opening )
		{
			this.opening = true;
			hideKeyboard();
			
			// New drivepanel alike method
			if( !Workspace.appPanel )
				Workspace.appPanel = ge( 'DoorsScreen' ).getElementsByClassName( 'ScreenContent' )[0].getElementsByTagName( 'div' )[0];
		
			if( isMobile )
			{
				this.dom.style.overflowY = 'auto';
				this.dom.classList.add( 'ScrollBarSmall' );
			}
		
			var dp = Workspace.appPanel;
		
			if( Workspace && typeof Workspace.closeDrivePanel == 'function' )
				Workspace.closeDrivePanel();
		
			this.mobileClicked = true;
		
			var menuTitle = document.createElement( 'div' );
			menuTitle.className = 'AppsShowingTitle';
			this.menuTitle = menuTitle;
			menuTitle.innerHTML = i18n( 'i18n_your_apps' );
			Workspace.screen.contentDiv.parentNode.appendChild( menuTitle );
		
			// determine y pos
			this.dom.className = 'Desklet Open';
			var d = this.dom;
			setTimeout( function()
			{
				d.classList.add( 'Opened' );
				self.opening = false;
				self.open = true;
				menuTitle.classList.add( 'Opened' );
			}, 5 );
			document.body.classList.add( 'AppsShowing' );
			
			if( Workspace.widget ) Workspace.widget.slideUp();
			return cancelBubble( e );
		}
	}
	
	this.closeDesklet = function( e )
	{
		var self = this;
		if( this.open )
		{
			this.dom.className = 'Desklet Open';
			var d = this.dom;
			setTimeout( function()
			{
				d.classList.remove( 'Open' );
				d.style.overflowY = 'visible';
				self.open = false;
			}, 250 );
			document.body.classList.remove( 'AppsShowing' );
			if( this.menuTitle )
			{
				Workspace.screen.contentDiv.parentNode.removeChild( this.menuTitle );
				this.menuTitle = null;
			}
			Workspace.redrawIcons();
			return cancelBubble( e );
		}
	}
	
	// End mobile version ------------------------------------------------------
	
	// Overwritable render function --------------------------------------------
	
	this.render = function( forceRefresh )
	{
		let self = this;
		
		// Setup the container for the launcher icons
		this.dom.style.position = 'absolute';
		
		if( window.isMobile )
		{
			// Create hider
			let hider = document.createElement( 'div' );
			hider.className = 'Hider';
			hider.onclick = function()
			{
				self.closeDesklet();
			}
			this.dom.appendChild( hider );
		}
		
		// Move window list
		let viewList = false;
		for( let a = 0; a < this.dom.childNodes.length; a++ )
		{
			if( this.dom.childNodes[a].className == 'ViewList' )
			{
				viewList = this.dom.childNodes[a];
				break;
			}
		}
		if( viewList )
		{
			this.dom.removeChild( viewList );
			this.dom.appendChild( viewList );
		}
		
		let items = [];
		for( let a = 0; a < this.dom.childNodes.length; a++ )
		{
			if( this.dom.childNodes[a].className == 'ViewList' ) continue;
			items.push( this.dom.childNodes[a] );
		}
		if( this.viewList ) 
		{
			for( let a = 0; a < this.viewList.childNodes.length; a++ )
				items.push( this.viewList.childNodes[a] );
		}
		
		if( !this.direction ) this.direction = 'horizontal';
		
		let horizontal = this.direction == 'horizontal' ? true : false;
		
		
		let itemWidth = this.conf && this.conf.size ? this.conf.size : 56;
		let itemHeight = this.conf && this.conf.size ? this.conf.size : 56;
		let marginWidth = horizontal ? 12 : 7;
		let marginHeight = !horizontal ? 12 : 7;
		
		let pos = this.conf.layout;
		let position = this.conf.position;
		
		let scrollerMargins = {
			top: 0,
			left: 0,
			right: 0,
			bottom: 0
		};
		
		let positionClass = '';
		
		if( position != 'fixed' )
		{
			Workspace.mainDock.dom.style.transition = 'none';
			switch( pos )
			{
				case 'left_center':
				case 'left_top':
				case 'left_bottom':
					positionClass = 'Left';
					scrollerMargins.left = Workspace.mainDock.dom.offsetWidth;
					scrollerMargins.right = Workspace.mainDock.dom.offsetWidth; // For shortcuts
					this.direction = 'vertical';
					break;
				case 'right_center':
				case 'right_top':
				case 'right_bottom':
					positionClass = 'Right';
					scrollerMargins.right = Workspace.mainDock.dom.offsetWidth;
					this.direction = 'vertical';
					break;
				case 'top_left':
				case 'top_center':
				case 'top_right':
					positionClass = 'Top';
					scrollerMargins.top = Workspace.mainDock.dom.offsetHeight;
					this.direction = 'horizontal';
					break;
				case 'bottom_left':
				case 'bottom_center':
				case 'bottom_right':
				default:
					positionClass = 'Bottom';
					scrollerMargins.bottom = Workspace.mainDock.dom.offsetHeight;
					this.direction = 'horizontal';
					break;
			}
			
			if( window.isMobile )
			{
				/* we can only have one for now.... */
				this.dom.style.bottom = '10px';
				this.dom.style.right = '10px';
				this.dom.style.top = '100%';
				this.dom.style.width = '64px';
				this.dom.style.height = 'auto';
			}
			
			if( positionClass )
			{
				this.dom.classList.remove( 'Left' );
				this.dom.classList.remove( 'Right' );
				this.dom.classList.remove( 'Top' );
				this.dom.classList.remove( 'Bottom' );
				this.dom.classList.add( positionClass );
			}
			Workspace.mainDock.dom.style.transition = '';
		}
		// Fixed!
		else
		{
			this.dom.style.top = this.conf.docky + 'px';
			this.dom.style.left = this.conf.dockx + 'px';
		}
		
		//if window gets bigger we want to snap back to one row.
		if( forceRefresh ) this.iconrows = 1;
		
		if( window.isMobile )
		{
			return;
		}
		
		// Event for taskbars that are full
		if( this.direction == 'horizontal' )
		{
			if( this.scrollEvent )
			{
				this.dom.removeEventListener( 'mousemove', this.scrollEvent );
			}
			this.scrollEvent = GuiDeskletScrollHorizontal;
			this.dom.addEventListener( 'mousemove', GuiDeskletScrollHorizontal );
		}
		// Vertical
		else
		{
			if( this.scrollEvent )
			{
				this.dom.removeEventListener( 'mousemove', this.scrollEvent );
			}
			this.scrollEvent = GuiDeskletScrollVertical;
			this.dom.addEventListener( 'mousemove', GuiDeskletScrollVertical );
		}
		
		// Screen content
		let cnt = ge( 'DoorsScreen' ).object._screen;

		// Do the rendering of icons
		let sh = ge( 'DoorsScreen' )[ !horizontal ? 'offsetHeight' : 'offsetWidth' ];
		if( !horizontal )
		{
			sh -= cnt.offsetTop;
		}		
		
		// With dockwindowlist we allocate a bit more room for tasks
		let availSpace = sh - ( ge( 'DockWindowList' ) ? 200 : 80 );
		
		let step = horizontal ? marginWidth : marginHeight;
		
		let calcLength = ( ( ( !horizontal ? itemHeight : itemWidth ) + step ) * items.length ) - step;
		let blocks = Math.ceil( calcLength / availSpace ); // TODO: Make dynamic
		if( blocks < 1 ) blocks = 1;
		
		let currBlock = 0;
		let len = 0;
		let itemUnit = ( !horizontal ? itemHeight : itemWidth ) + step;
		let maxLength = availSpace - itemUnit;
		
		let x = marginWidth, y = marginHeight, maxLen = 0;
		let cols = rows = 1;
		this.iconListPixelLength = 0;
		let comp;
		for( let a = 0; a < items.length; a++ )
		{
			let cn = items[a];
			if( cn.classList.contains( 'WindowList' ) || cn.classList.contains( 'DockMenu' ) )
				continue;
			cn.style.position = 'absolute';
			cn.style.left = x + 'px';
			cn.style.top = y + 'px';
			if( cn.className != 'ViewList' )
			{
				cn.style.width = itemWidth + 'px';
				cn.style.height = itemHeight + 'px';
			}
			// Window list is a special bastard!
			else
			{
				cn.style.width = 'auto';
				cn.style.height = 'auto';
				continue;
			}
			
			if( !horizontal )
			{
				y += itemHeight + step;
			}
			else
			{
				x += itemWidth + step;
			}
			len += itemUnit;
			
			if( len > maxLen )
				maxLen = len;
			
			if( len >= maxLength && a != items.length - 1 )
			{
				comp = ( !horizontal ? y : x );
				if( !this.iconListPixelLength || this.iconListPixelLength < comp )
					this.iconListPixelLength = comp;
				len = 0;
				if( !horizontal )
				{
					// Let others be able to read this
					x += itemWidth + step;
					y = step;
					cols++;
				}
				else
				{
					// Let others be able to read this
					x = step;
					y += itemHeight + step;
					rows++;
				}
			}
			else
			{
				comp = ( !horizontal ? y : x );
				if( !this.iconListPixelLength || this.iconListPixelLength < comp )
					this.iconListPixelLength = comp;
			}
		}
		
		// Size of container
		if( !horizontal )
		{
			this.dom.classList.remove( 'Horizontal' );
			this.dom.classList.add( 'Vertical' );
			this.pixelHeight = maxLen + step;
			// We need a full dock here
			if( globalConfig.viewList == 'dockedlist' )
			{
				this.pixelWidth = document.body.offsetWidth;
				this.pixelHeight = sh;
			}
			this.dom.style.width = marginWidth + Math.floor( cols * ( itemWidth + marginWidth ) ) + 'px';
			this.dom.style.height = this.pixelHeight + 'px';
			//console.log( 'Vert: ' + this.pixelHeight + ' ' + sh + ' ' + ( itemHeight + marginHeight ) );
		}
		else
		{
			this.dom.classList.remove( 'Vertical' );
			this.dom.classList.add( 'Horizontal' );
			this.pixelWidth = maxLen + step;
			// We need a full dock here
			if( globalConfig.viewList == 'dockedlist' )
			{
				this.pixelWidth = document.body.offsetWidth;
				this.pixelHeight = sh;
			}
			this.dom.style.width = this.pixelWidth + 'px';
			this.dom.style.height = marginHeight + Math.floor( rows * ( itemHeight + marginHeight ) ) + 'px';
			//console.log( 'Horiz: ' + this.pixelHeight );
		}
		
		// Position of container
		if( position != 'fixed' )
		{
			let th = cnt.offsetTop;
			let midScreenH = ( ( this.dom.parentNode.offsetHeight - th ) * 0.5 ) + th;
			
			this.dom.style.left = 'auto';
			this.dom.style.top = 'auto';
			this.dom.style.right = 'auto';
			this.dom.style.bottom = 'auto';
			this.dom.setAttribute( 'position', pos );
			switch( pos )
			{
				case 'left_center':
					this.dom.style.left = '0px';
					this.dom.style.top = Math.floor( midScreenH - ( this.pixelHeight * 0.5 ) ) + 'px';
					break;
				case 'left_top':
					this.dom.style.left = '0px';
					this.dom.style.top = cnt.offsetTop + 'px';
					break;
				case 'left_bottom':
					this.dom.style.left = '0px';
					this.dom.style.bottom = '0px';
					break;
				default:
				case 'right_center':
					this.dom.style.right = '0px';
					this.dom.style.top = Math.floor( midScreenH - ( this.pixelHeight * 0.5 ) ) + 'px';
					break;
				case 'right_top':
					this.dom.style.right = '0px';
					this.dom.style.top = cnt.offsetTop + 'px';
					break;
				case 'right_bottom':
					this.dom.style.right = '0px';
					this.dom.style.bottom = '0px';
					break;
				case 'top_center':
					this.dom.style.top = cnt.offsetTop + 'px';
					this.dom.style.left = Math.floor( ( this.dom.parentNode.offsetWidth * 0.5 ) - ( this.pixelWidth * 0.5 ) ) + 'px';
					break;
				case 'top_left':
					this.dom.style.top = cnt.offsetTop + 'px';
					this.dom.style.left = '0px';
					break;
				case 'top_right':
					this.dom.style.top = cnt.offsetTop + 'px';
					this.dom.style.right = '0px';
					break;
				case 'bottom_center':
					this.dom.style.bottom = '0px';
					this.dom.style.left = Math.floor( ( this.dom.parentNode.offsetWidth * 0.5 ) - ( this.pixelWidth * 0.5 ) ) + 'px';
					break;
				case 'bottom_left':
					this.dom.style.bottom = '0px';
					this.dom.style.left = '0px';
					break;
				case 'bottom_right':
					this.dom.style.bottom = '0px';
					this.dom.style.right = '0px';
					break;
			}
			// Add margins around icons based on dock!
			if( !window.isMobile )
			{
				let scroller = Workspace.screen.contentDiv;
				if( scroller )
				{
					scroller.style.paddingTop = scrollerMargins.top + 'px';
					scroller.style.paddingLeft = scrollerMargins.left + 'px';
					scroller.style.paddingRight = scrollerMargins.right + 'px';
					scroller.style.paddingBottom = scrollerMargins.bottom + 'px';
					scroller.paddingTop = scrollerMargins.top;
					scroller.paddingLeft = scrollerMargins.left;
					scroller.paddingRight = scrollerMargins.right;
					scroller.paddingBottom = scrollerMargins.bottom;
				}
			}
		}
		
		PollTaskbar();
	}
	// End render --------------------------------------------------------------
	this.toggleViewVisibility = function( ele, state )
	{
		if( ele.views )
		{
			let cnt = 0;
			for( let a in ele.views )
				cnt++;
			if( cnt > 0 )
			{
				if( state ) ele.state = state;
				else ele.state = ele.state == 'hidden' ? 'visible' : 'hidden';
				
				var elementCount = 0;
				for( let i in ele.views )
				{
					let s = ele.views[i].windowObject.getFlag( 'screen' );
					if( s.div.id != 'DoorsScreen' ) continue;
					if( ele.views[i].windowObject.getFlag( 'invisible' ) ) continue;
					ele.views[i].windowObject.setFlag( 'hidden', ele.state == 'hidden' ? true : false );
					_WindowToFront( ele.views[i] );
					elementCount++;
				}
				if( ele.state == 'hidden' )
				{
					ele.classList.add( 'Minimized' );
					if( ele.elementCount )
					{
						ele.elementCount.innerHTML = '<span>' + ( elementCount > 0 ? elementCount : '' ) + '</span>';
					}
					else
					{
						let d = document.createElement( 'div' );
						d.className = 'ElementCount';
						d.innerHTML = '<span>' + ( elementCount > 0 ? elementCount : '' ) + '</span>';
						ele.appendChild( d );
						ele.elementCount = d;
					}
				}
				else
				{
					ele.classList.remove( 'Minimized' );
					if( ele.elementCount )
					{
						ele.removeChild( ele.elementCount );
					}
				}
				return true;
			}
		}
		return false;
	}
	
	this.toggleExecutable = function( ele, state )
	{
		if( typeof( ele ) != 'object' )
		{
			for( let a = 0; a < this.dom.childNodes.length; a++ )
			{
				if( this.dom.childNodes[a].executable && this.dom.childNodes[a].executable == ele )
				{
					ele = this.dom.childNodes[a];
					break;
				}
			}
		}
		let found = false;
		let elementCount = 0;
		
		for( let a = 0; a < Workspace.applications.length; a++ )
		{
			let ap = Workspace.applications[a];
			if( ap.applicationId != ele.uniqueId )
				continue;
			if( !ap.windows ) continue;
			
			// TODO: Animation before hiding!
			let st = 'idle';
			let wsSet = false;
			for( let w in ap.windows )
			{
				let s = ap.windows[ w ].getFlag( 'screen' );
				if( s.div.id != 'DoorsScreen' ) continue;
				
				elementCount++; // Count app windows
				
				st = ap.windows[ w ].flags.hidden;
				if( ap.windows[ w ].getFlag( 'invisible' ) ) continue;
				// Just minimize
				let ws = ap.windows[ w ].workspace;
				
				if( !wsSet && ws != globalConfig.workspaceCurrent )
				{
			        Workspace.switchWorkspace( ws );
			        wsSet = true;
			    }
				
				if( st || wsSet )
				{
					if( ele.classList.contains( 'Minimized' ) )
					{
    					ele.classList.remove( 'Minimized' );
					}
					if( ws != globalConfig.workspaceCurrent )
					{
				        Workspace.switchWorkspace( ws );
				    }
				    ap.windows[ w ].setFlag( 'hidden', false );
				    ap.windows[ w ].flags.minimized = false;
				    ap.windows[ w ].activate();
				    
				    _WindowToFront( ap.windows[ w ]._window );
				}
				else
				{
					if( !ele.classList.contains( 'Minimized' ) )
					{
    					ele.classList.add( 'Minimized' );
    			    }
					ap.windows[ w ].setFlag( 'hidden', true );
				}
			}
			if( !ele.elementCount )
			{
				let d = document.createElement( 'div' );
				d.className = 'ElementCount';
				d.innerHTML = '<span>' + ( elementCount > 0 ? elementCount : '' ) + '</span>';
				ele.elementCount = d;
				ele.appendChild( d );
			}
			else
			{
				ele.elementCount.innerHTML = '<span>' + ( elementCount > 0 ? elementCount : '' ) + '</span>';
			}
			return true;
		}
		return false;
	}
	
	// Tell desklet that it is initialized. Now do animations etc..
	this.initialized = function()
	{
		this.dom.classList.remove( 'Initialized' );
	}
	
	this.addLauncher = function( o )
	{
		let dk = this;
		if ( o.src && ( o.click || o.exe ) )
		{
			let div = document.createElement ( 'div' );
			div.className = 'Launcher MousePointer';
			if( o.className ) div.className += ' ' + o.className;
			div.style.width = this.width - ( this.margin * 2 ) + 'px';
			div.style.height = this.width - ( this.margin * 2 ) + 'px';
			div.executable = o.exe;
			
			// Try to find existing applicationId
			if( div.executable )
			{
				for( let a in Workspace.applications )
				{
					if( Workspace.applications[ a ].applicationName == o.exe )
					{
						div.classList.add( 'Running' );
						div.uniqueId = Workspace.applications[a].applicationId;
						break;
					}
				}
			}
			
			if( !div.uniqueId )
			{
				div.uniqueId = UniqueHash( o.exe + ' ' + o.displayname );
			
				// Running apps (obsolete?)
				// TODO: Check...
				for( let a in Workspace.applications )
				{
					if( Workspace.applications[ a ].applicationId == div.uniqueId )
					{
						div.classList.add( 'Running' );
						break;
					}
				}
			}
			
			// Convert image urls
			if( o.src.indexOf( ':' ) > 0 && o.src.substr( 0, 4 ) != 'http' )
			{
				o.src = getImageUrl( o.src );
			}
			
			o.opensilent = o.opensilent == '1' ? true : false;
			
			// This is web bookmarks
			if( o.src == '.url' )
			{
				function loadIco( u )
				{
					var f = new File( u.exe );
					f.onLoad = function( data )
					{
						try
						{
							var json = JSON.parse( data );
							if( json.link )
							{
								div.onclick = function()
								{
									window.open( json.link, '_blank' );
								}
								var s = json.link.split( '://' );
								s[1] = s[1].split( '/' );
								s = s[0] + '://' + s[1] + '/favicon.ico';
							
								var j = new Image();
								j.onload = function()
								{
									div.innerHTML = '<div style="position: absolute; top: 50%; left: 50%"><img style="position: absolute; left: -' + ( j.width * .5 ) + 'px; top: -' + ( j.height * .5 ) + 'px" src="' + j.src + '"/></div>';
								}
								j.src = s;
							}
						}
						catch( e ){};
					}
					f.load();
				}
				loadIco( o );
				
				div.style.backgroundImage = '';
				var d = document.createElement( 'div' );
				d.className = 'File';
				d.innerHTML = '<div class="Icon"><div style="background-size: contain" class="TypeWebUrl"><span>' + o.exe + '</span></div></div><span>' + o.exe + '</span>';
				div.appendChild( d );
			}
			else if( o.src.substr( 0, 1 ) == '.' && o.src != '.txt' )
			{
				div.style.backgroundImage = '';
				var d = document.createElement( 'div' );
				var t = o.src.substr( 1, o.src.length - 1 ).toUpperCase();
				d.className = 'File';
				d.innerHTML = '<div class="Icon"><div class="Type' + t + '"></div></div><span>' + o.exe + '</span>';
				div.appendChild( d );
			}
			else
			{
				let ic = document.createElement( 'div' );
				ic.className = 'AppIcon';
				div.setAttribute('data-exename', o.exe );
				div.setAttribute('data-workspace', ( o.workspace ? o.workspace : 0 ) );
				div.setAttribute('data-displayname', ( o.displayname ? o.displayname: o.exe ) );
				div.setAttribute('id', 'dockItem_' + o.exe );
				let sp = document.createElement( 'span' );
				sp.className = 'AppName';
				sp.innerHTML = o.displayname ? o.displayname: o.exe;
				div.appendChild( ic );
				div.appendChild( sp );
				let i = new Image();
				i.src = o.src;
				i.onload = function()
				{
					if( isMobile )
					{
						ic.style.backgroundColor = getColorFromImage( this, {
							row: 'center'
						} );
					}
					ic.style.backgroundImage = 'url(\'' + o.src + '\')';
					ic.classList.add( 'Loaded' );
				}
				i.onerror = function( e )
				{
					ic.style.backgroundImage = 'url(/iconthemes/friendup15/File_Function.svg)';
				}
				if( i.naturalWidth > 0 )
				{
					i.onload();
				}
			}
			
			function deskletClickFunc( e )
			{
				if( e.button != 0 && e.type != 'touchend' ) return;
				if( div.helpBubble ) div.helpBubble.close();
				
				// Http url
				if( o.exe.substr( 0, 7 ) == 'http://' || o.exe.substr( 0, 8 ) == 'https://' )
				{
					return window.open( o.exe, '', '' );
				}
				// We got views? Just manage them
				if( !isMobile )
				{
					if( dk.toggleViewVisibility( div ) ) 
					{
						return;
					}
				}

				let rememberCurrent = false;
				
				// If we have a non silent launch, and a current movable, deactivate current
				if( currentMovable && o.opensilent === false )
				{
					rememberCurrent = currentMovable;
					_DeactivateWindow( currentMovable );
				}
			
				let args = '';
				let executable = o.exe + '';

				if( executable.indexOf( ' ' ) > 0 )
				{
					var t = executable.split( ' ' );
					if( t[0].indexOf( ':' ) == -1)
					{
						args = '';
						for( let a = 1; a < t.length; a++ )
						{
							args += t[a];
							if( a < t.length - 1 )
								args += ' ';
						}
						executable = t[0];	
					}
				}
			
				if( o.workspace && o.workspace >= 0 )
					args += ' workspace=' + o.workspace;
			
				// Extension
				if( executable.indexOf( ':' ) > 0 )
				{
					let l = executable.split( ':' )[1];
					if( l.indexOf( '/' ) > 0 )
					{
						l = l.split('/');
						l = l[l.length-1];
					}
				
					if( l.length > 1 )
					{
						let ext = l;
						ext = '.' + ext[ ext.length - 1 ].toLowerCase();
	
						// Check mimetypes
						for( let a in Workspace.mimeTypes )
						{
							var mt = Workspace.mimeTypes[ a ];

							for( let b in mt.types )
							{
								if( ext == mt.types[ b ].toLowerCase() )
								{
									return ( function( mm, me, dd ){
										ExecuteApplication( mm, me, false, false, {
											dockItem: dd,
											uniqueId: dd.uniqueId,
											openSilent: o.opensilent ? true : false
										} );
									} )( mt.executable, executable, div );
								}
							}
						}
					}
				}
			
				var docked = globalConfig.viewList == 'docked' || globalConfig.viewList == 'dockedlist';
			
				// If not mobile OR not ( docked AND ( NOT single instyance OR with arguments ) )
				if( 
					isMobile || 
					( 
						!docked && 
						!( 
							Friend.singleInstanceApps[ executable ] || 
							o.exe.indexOf( ' ' ) > 0 
						)	
					)
				)
				{
					if( !Friend.singleInstanceApps[ executable ] )				
					{
						( function( mm, me, dd ){
							ExecuteApplication( mm, me, false, false, {
								dockItem: dd,
								uniqueId: dd.uniqueId,
								openSilent: o.opensilent ? true : false
							} );
						} )( executable, args, div );
					}
					else if( rememberCurrent && rememberCurrent.windowObject.applicationId == div.uniqueId )
					{
						_ActivateWindow( rememberCurrent );
					}
					else
					{
						// Find application window
						// TODO: Find the last active
						for( let a = 0; a < Workspace.applications.length; a++ )
						{
							if( Workspace.applications[a].applicationId == div.uniqueId )
							{
								if( Workspace.applications[a].windows )
								{
									for( let c in Workspace.applications[a].windows )
									{
										Workspace.applications[a].windows[ c ].flags.minimized = false;
										Workspace.applications[a].windows[ c ].activate();
										break;
									}
									break;
								}
							}
						}
					}
				}
				// Just minimize apps if you find them, if not execute
				else
				{
					if( dk.toggleExecutable( div ) ) 
					{
						return;
					}
				
					// If we didn't find the app, execute
					( function( mm, me, dd ){
						ExecuteApplication( mm, me, false, false, {
							dockItem: dd,
							uniqueId: dd.uniqueId,
							openSilent: o.opensilent ? true : false
						} );
					} )( executable, args, div );
				}
			
				// Switch to the workspace of the app (unless silent)
				if( !o.opensilent )
				{
					Workspace.switchWorkspace( o.workspace );
				}
			
				// Close it for mobile
				if( window.isMobile )
				{
					self.closeDesklet();
					self.dom.mobileClicked = false;
				}
			}
			
			if( o.noContextMenu )
			{
				div.addEventListener( 'contextmenu', function( ee ){ return cancelBubble( ee ); }, false );
			}
			
			if( window.isMobile )
			{
				// You have 0.25s to click
				div.ontouchstart = function( e )
				{
					this.touchTime = ( new Date() ).getTime();
					setTimeout( function()
					{
						div.touchTime = null;
					}, 250 );
				}
			}
			
			if( o.click )
			{
				div.onclick = function( e )
				{
					if( e.button != 0 && e.type != 'touchend' ) return;
					
					var t = e.target ? e.target : e.srcElement;
					if( t != div && !( t.classList && t.classList.contains( 'AppIcon' ) ) ) return;
					if( window.isMobile && !dk.open ) return;
					o.click( e );
					if( div.helpBubble ) div.helpBubble.close();
					cancelBubble( e );
				}
				div.ontouchend = div.onclick;
			}
			else 
			{
				div.onclick = function( e )
				{
					if( e.button != 0 && e.type != 'touchend' ) return;
					
					if( window.isMobile && !this.touchTime )
						return;
					
					var t = e.target ? e.target : e.srcElement;
					if( t != div && !( t.classList && t.classList.contains( 'AppIcon' ) ) ) return;
					if( window.isMobile && !dk.open ) return;
					deskletClickFunc( e );
					if( div.helpBubble ) div.helpBubble.close();
					cancelBubble( e );
				}
				div.ontouchend = div.onclick;
			}
			
			if( !isMobile )
			{
				div.onmouseover = function( e )
				{
					if( this.clickDown )
						this.clickDown = null;
				}
			
				div.onmousedown = function( e )
				{
					if( e.button != 0 && e.type != 'touchend' ) return;
					// TODO: Fix special case with flags implementation on addLauncher()
					if( div.classList.contains( 'Startmenu' ) || div.getAttribute( 'data-displayname' ) == 'Files' ) return;
					if( mousePointer.candidate ) return;
					// Add candidate and rules
					var self = this;
					var px = e.clientX;
					var py = e.clientY;
					mousePointer.candidate = {
						condition: function( e )
						{
							var dx = windowMouseX;
							var dy = windowMouseY;
							var dfx = dx - px;
							var dfy = dy - py;
							var dist = Math.sqrt( ( dfx * dfx ) + ( dfy * dfy ) );
							if( dist > 30 )
							{
								mousePointer.candidate = null;
								self.removeChild( self.getElementsByTagName( 'span' )[0] );
								self.ondrop = function( target )
								{
									if( target && target.classList )
									{
										if( target.classList.contains( 'ScreenContent' ) )
										{
											var m = new Module( 'dock' );
											m.onExecuted = function()
											{
												Workspace.reloadDocks();
											}
											m.execute( 'removefromdock', { name: o.exe } );
											return;
										}
									}
									Workspace.reloadDocks();
								}
								mousePointer.pickup( self );
							}
						}
					};
				}

				var bubbletext = o.displayname ? o.displayname : ( o.title ? o.title : o.src );
			
				if( bubbletext )
				{
					CreateHelpBubble( div, bubbletext );
				}
			}
			this.dom.appendChild( div );
			this.refresh();
			return true;
		}
		return false;
	}
	this.readConfig = function( conf )
	{
		if( conf.options ) this.conf = conf.options;
		this.render();
	}
	// Clear!
	this.clear = function()
	{
		var eles = this.dom.childNodes;
		var keep = []; // elements to keep
		for( var a = 0; a < eles.length; a++ )
		{
			// Close help bubbles
			if( eles[ a ].helpBubble )
			{
				eles[ a ].helpBubble.close();
			}
			if( eles[ a ].className == 'ViewList' )
			{
				keep.push( eles[a] );
			}
		}
		this.dom.innerHTML = '';
		for( var a = 0; a < keep.length; a++ )
		{
			this.dom.appendChild( keep[ a ] );
		}
	}
	// Standard refresh function
	this.refresh = function ()
	{
		this.render( true );
	}
	this.dom.drop = function( eles, e )
	{
		var dropped = 0;
		
		for( var a = 0; a < eles.length; a++ )
		{
			var el = eles[a];
			var fi = eles[a].fileInfo;
			
			var element = false;
			
			// Executable files
			if( el.fileInfo && el.Title && el.fileInfo.Type == 'Executable' )
			{
				element = {
					title: fi.Title,
					exe: fi.Title ? fi.Title : fi.Filename,
					src: fi.IconFile,
					application: fi.Title ? fi.Title : fi.Filename,
					type: 'executable'
				};
				if( !element.title ) element.title = element.exe;
			}
			// Normal files
			else if( el.fileInfo && el.Title && el.fileInfo.Type == 'File' )
			{
				element = {
					title: fi.Title ? fi.Title : fi.Filename,
					exe: el.fileInfo.Path,
					src: fi.Title ? fi.Title : fi.Filename,
					application: el.fileInfo.Path,
					type: 'file'
				};
			}
			
			// Add to launcher
			var extension = element.exe ? element.exe.split( '.' ) : false;
			if( extension && extension.length > 1 )
				extension = extension[1].toLowerCase();
			else extension = false;
			
			if( element.type == 'executable' || ( element.type == 'file' && extension == 'jsx' ) )
			{
				if( self.addLauncher( element ) )
				{
					var m = new Module( 'dock' );
					var w = this.view;
					m.onExecuted = function( r, dat )
					{
						// Refresh dock noe more time
						Workspace.reloadDocks();
					}
					var o = { type: element.type, application: element.application, icon: element.src, shortdescription: '' };
					m.execute( 'additem', o );
					dropped++;
				}
				return dropped > 0 ? true : false;
			}
			else
			{
				Notify( { title: i18n( 'i18n_object_not_supported' ), text: i18n( 'i18n_only_executables_can_drop' ) } );
				cancelBubble( e );
				return false;
			}
		}
		return false;
	}
}
function CreateDesklet ( pobj, width, height, pos, px, py )
{
	var d = new GuiDesklet ( pobj, width, height, pos, px, py );
	__desklets.push ( d );
	return d;
}

function RefreshDesklets()
{
	for ( var a = 0; a < __desklets.length; a++ )
	{
		__desklets[a].render( true );
	}
}

function closeDesklets()
{
	if( !window.isMobile ) return; 
	
	for ( var a = 0; a < __desklets.length; a++ )
		__desklets[a].closeDesklet();
}
if ( window.addEventListener )
	window.addEventListener ( 'resize', RefreshDesklets );
else window.attachEvent ( 'onresize', RefreshDesklets );

