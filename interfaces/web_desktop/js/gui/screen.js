/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var _viewType = 'iframe'; //window.friendBook ? 'webview' : 'iframe';

// Screen class to support multiple screens
Screen = function ( flags, initObject )
{
	var self = this;
	this._flags = new Object ();
	
	if( typeof( flags ) == 'object' )
	{
		for( var a in flags )
		{
			this._flags[a] = flags[a];
		}
	}
	
	// Maximum width available for view windows
	this.getMaxViewWidth = function()
	{
		if( this.div )
		{
			return this.div.offsetWidth;
		}
		return 0;
	}
	
	// Maximum height available for view windows
	this.getMaxViewHeight = function()
	{
		if( this.div )
		{
			return this.contentDiv.offsetHeight;
		}
		return 0;
	}
	
	// Get the flag
	this.getFlag = function( flag )
	{
		flag = flag.toLowerCase();
		if( flag == 'title' )
		{
			var e = this.div.screenTitle.getElementsByClassName( 'Info' )[0]; 
			return e.innerHTML;
		}
		if( this._flags[ 'flag' ] )
		{
			return this._flags[ 'flag' ];
		}
	}
	
	this.setFlag = function( flag, value )
	{
		switch( flag.toLowerCase() )
		{
			case 'title':
				this._flags[ flag ] = value;
				var e = this.div.screenTitle.getElementsByClassName( 'Info' )[0]; 
				e.innerHTML = value;
				break;
			
			case 'vcolumns':
				this._flags[ flag ] = value;
				this.resize();
				break;
			case 'vrows':
				this._flags[ flag ] = value;
				this.resize();
				break;
			
			case 'extra':
				this._flags[ flag ] = value;
				var e = this.div.screenTitle.getElementsByClassName( 'Extra' )[0];
				if( e )
					e.innerHTML = value;
				break;	
			
			case 'theme':	
			case 'background':
				this._flags[ flag ] = value;
				break;
		}
	}
	
	if ( typeof ( this._flags['title'] ) == 'undefined' )
	{
		this._flags['title'] = 'Unknown screen';
	}
	
	// TODO: Make dynamic! And it's only for the doors menu!!
	var statusbar = '';
	if( this._flags.taskbar )
	{
		statusbar = "" +
			"<div class=\"Box\" id=\"Statusbar\">" +
			"	<div id=\"Taskbar\">" +
			"	</div>" + 
			"	<div id=\"StatusBox\">" +			
			"   </div>" +
			"</div>";
	}
	// Fullscreen mode has no statusbar (as well as those who are specific)
	if ( !this._flags.taskbar || this._flags.fullscreen ) 
	{
		statusbar = '';
	}
	
	var div;
	
	// When we need it
	this.hideOverlay = function()
	{
		div._screenoverlay.style.display = 'none';
		div._screenoverlay.style.pointerEvents = 'none';
	}	
	
	if ( initObject ) div = initObject;
	else 
	{
		div = document.createElement ( 'div' );
		div.object = this;
		
		// We need this or blank
		if( typeof( this._flags['extra'] ) == 'undefined' )
			this._flags['extra'] = '';
		
		// Background support
		if( typeof( this._flags['background'] ) != 'undefined' )
			div.style.backgroundColor = this._flags['background'];
			
		div.style.webkitTransform = 'translate3d(0, 0, 0)';
		
		var ex = '';
		if( flags.id == 'DoorsScreen' )
		{
			var extra = this._flags['extra'];
			if( this._flags[ 'extraClickHref' ] )
				extra = '<span class="ExtraClick" onclick="' + this._flags[ 'extraClickHref' ] + '; return cancelBubble( event )">' + extra + '</span>';
			ex = "\n		<div class=\"Extra\">" + extra + "</div>";
		}
		
		div.innerHTML = "" +
		"<div class=\"TitleBar\">" +
		"	<div class=\"Right\">" +
		"		<div class=\"ScreenList MousePointer BorderLeft\"></div>" +
		"	</div>" +
		"	<div class=\"Left\">" +
		"		<div class=\"Info\">" + this._flags['title'] + "</div>" + ex +
		"	</div>" +
		"</div>" +
		"<div class=\"ScreenContent\">" +
		"</div>" +
		statusbar +
		"<div class=\"ScreenOverlay\"></div>";
		ge( 'Screens' ).appendChild( div );
		
		// FIXME: Hack - this should be better calculated, and it's not resize friendly
		var cnt = false;
		var divs = div.getElementsByTagName( 'div' );
		for( var a = 0; a < divs.length; a++ )
		{
			if( divs[a].className == 'ScreenContent' )
			{
				cnt = divs[a];
				this._screen = cnt;
				divs[a].style.minHeight = div.style.minHeight;
			}
			else if ( divs[a].className == 'TitleBar' )
			{
				this._titleBar = divs[a];
			}
		}
		
		// Screen size aware!
		var self = this;
		function resizeScreen()
		{
			var cnt = self.contentDiv;
			if( cnt )
			{
				// Resize view windows
				for( var a in movableWindows )
				{
					var w = movableWindows[ a ].windowObject;
					if( w.flags.maximized || w.flags.width == 'max' || ( movableWindows[ a ].zoom && movableWindows[ a ].zoom.mode == 'maximized' ) )
					{
						var v = w._window.parentNode;
						v.setAttribute( 'moving', 'moving' );
						v.style.width = self.getMaxViewWidth() + 'px';
						v.style.height = self.getMaxViewHeight() + 'px';
						w.setFlag( 'top', 0 );
						w.setFlag( 'left', w.workspace * self.getMaxViewWidth() );
					}
				}
				
				// Mindful of columns!
				if( typeof( self._flags['vcolumns'] ) != 'undefined' )
				{
					var columns = parseInt( self._flags['vcolumns'] );
					if( columns <= 0 ) columns = 1;
					
					// Set width with workaround.
					var newWidth = GetWindowWidth() * columns;
					cnt.style.width = newWidth + 'px';
				}
				else
				{
					cnt.style.width = '100%';
				}
				
				// Mindful of rows!
				var cntTop = parseInt( GetThemeInfo( 'ScreenTitle' ).height );
				if( !isNaN( cntTop ) )
				{
					if( typeof( self._flags['vrows'] ) != 'undefined' )
					{
						var rows = parseInt( self._flags['vrows'] );
						if( rows <= 0 ) rows = 1;
						cnt.style.height = '100%';
					}
					else
					{
						cnt.style.height = '100%';
					}
				}
			}
		}
		this.resize = function(){ resizeScreen(); }
		
		// Do a scroll hack!
		div.onscroll = function(){ this.scrollLeft = 0; this.scrollTop = 0; };
		if( cnt ) cnt.onscroll = function(){ this.scrollLeft = 0; this.scrollTop = 0; }
	}
	
	if( typeof( this._flags['id'] ) != 'undefined' )
	{
		div.id = this._flags['id'];
	}
	else if( !div.id )
	{
		div.id = 'unnamed_';
	}
	// Gen unique id and set it
	if( 1 )
	{
		var idb = div.id;
		var id = 0;
		var found;
		var screens = ge( 'Screens' ).childNodes;
		do
		{
			found = false;
			for( var a = 0; a < screens.length; a++ )
			{
				if( !screens[a].className ) continue;
				if( typeof( screens[a].id ) != 'undefined' )
				{
					if( screens[a].id == idb + id )
						found = true;
				}
			}
			if( !found ) break;
			id++;
		}
		while( found );
		div.id = idb + ( id > 0 ? id : '' );
		this._flags['id'] = div.id;
	}
	
	// Register clicks
	div.onmousedown = function( e )
	{
		var t = e.target ? e.target : e.srcElement;
		if( !e ) e = window.event;
		if( e.button != 0 ) return;
		window.currentScreen = this;
		CheckScreenTitle();
		
		// Deactivate all windows when clicking on the desktop wallpaper
		if ( 
			( t.id && t.id == 'DoorsScreen' ) || 
			( !t.id && t.parentNode.id == 'DoorsScreen' && t.classList && t.classList.contains( 'ScreenContent' ) )
		)
		{
			if( !isMobile )
			{
				_DeactivateWindows();
				Workspace.toggleStartMenu( false );
			}
		}
	}
	if( this.iframe )
	{
		this.iframe.addEventListener( 'click', function( e )
		{
			div.onmousedown( e );
		} );
	}
	// Done registering clicks
	
	// Moveoverlay
	var molay = document.createElement ( 'div' );
	molay.className = 'MoveOverlay';
	div.moveoverlay = molay;
	div.appendChild ( molay );
	
	// Slide start on x axis
	div.startX = -1;
	div.startY = -1;
	
	var divs = div.getElementsByTagName ( 'div' );
	
	var btncycle = false;
	var scroverl = false;
	for ( var a = 0; a < divs.length; a++ )
	{
		if ( divs[a].className && divs[a].classList.contains( 'ScreenList' ) )
			btncycle = divs[a];
		else if ( divs[a].className && divs[a].classList.contains( 'ScreenOverlay' ) )
			scroverl = divs[a];
		else if( divs[a].className && divs[a].classList.contains( 'ScreenContent' ) )
			this.contentDiv = divs[a];
	}
	if ( btncycle )
	{
		var o = this;
		btncycle.onclick = function( e )
		{
			o.screenCycle();
			return cancelBubble( e );
		}
	}
	
	if ( scroverl )
	{
		scroverl.style.position = 'absolute';
		scroverl.style.top = '0';
		scroverl.style.left = '0';
		scroverl.style.right = '0';
		scroverl.style.bottom = '0';
		scroverl.style.display = 'none';
		scroverl.style.pointerEvents = 'none';
		scroverl.style.zIndex = 2147483647;
		scroverl.style.webkitTransform = 'translate3d(0, 0, 0)';
		div._screenoverlay = scroverl;
	}
	
	div.className = 'Screen';
	div.screen = this;
	
	div.screenTitle = divs[0];
	div.screenTitle.ondragstart = function( e )
	{
		return cancelBubble( e );
	}
	div.screenTitle.onselectstart = function( e )
	{
		return cancelBubble( e );
	}
	div.screenTitle.onmousedown = function ( e )
	{
		if ( !e ) e = window.event;
		
		if( e.button != 0 ) return;
		
		// Set current screen
		window.currentScreen = this.parentNode;
		
		// Check menu and stuff
		CheckScreenTitle();
		
		var y = e.clientY ? e.clientY : e.pageYOffset;
		var x = e.clientX ? e.clientX : e.pageXOffset;
		
		var offl = this.parentNode.offsetLeft;
		
		var offt = this.parentNode.screenOffsetTop;
		if( !offt ) offt = 0;
		
		this.parentNode.offx = x - offl;
		this.parentNode.offy = y - offt;
		
		window.mouseDown = FUI_MOUSEDOWN_SCREEN;
		window.mouseReleaseFunc = function( e )
		{
			// Disable all screen overlays
			var screenc = ge ( 'Screens' );
			var screens = screenc.getElementsByTagName ( 'div' );
			for( var a = 0; a < screens.length; a++ )
			{
				if( !screens[a].className ) continue;
				if( screens[a].parentNode != screenc ) continue;
				screens[a]._screenoverlay.style.display = 'none';
				screens[a]._screenoverlay.style.pointerEvents = 'none';
			}
		}
		// If we have multiple screens, allow screen dragging
		if( ge( 'Screens' ).getElementsByClassName( 'Screen' ).length > 1 )
		{
			window.mouseMoveFunc = function ( e )
			{
				var my = e.clientY ? e.clientY : e.pageYOffset;
				var mx = e.clientX ? e.clientX : e.pageXOffset;
				var ty = my - window.currentScreen.offy;
				if ( ty < 0 ) ty = 0;
				if ( ty >= GetWindowHeight () ) ty = GetWindowHeight () - 1;
			
				div.style.transform = 'translate3d(0,' + ty + 'px,0)';
				div.screenOffsetTop = ty;
			
				// Enable all screen overlays
				var screenc = ge ( 'Screens' );
				var screens = screenc.getElementsByTagName ( 'div' );
				for( var a = 0; a < screens.length; a++ )
				{
					if( !screens[a].className ) continue;
					if( screens[a].parentNode != screenc ) continue;
					screens[a]._screenoverlay.style.display = '';
					screens[a]._screenoverlay.style.pointerEvents = 'all';
				}
			}
		}
		// Just pop the screen back
		else
		{
			div.style.transition = 'transform 0.25s';
			div.style.transform = 'translate3d(0,0px,0)';
			div.screenOffsetTop = 0;
			setTimeout( function()
			{
				div.style.transition = '';
			}, 250 );
		}
		var t = e.target ? e.target : e.srcElement;
		
		// Clicking on the extra widget
		if( t.classList && t.classList.contains( 'Extra' ) )
		{
			Workspace.calendarClickEvent();
		}
		
		return cancelBubble ( e );
	}
	div.screenTitle.ontouchstart = function( e )
	{
		// Set current screen
		window.currentScreen = this.parentNode;
		CheckScreenTitle();
	}
	
	// Alias clicking the screen
	div.onmouseup = function( e )
	{ 
		// Only left button clicks!
		if( e.button != 0 ) return false;
	}
	
	var scrn = this;
	
	// Check if we have content with no overflow
	if( this._flags.scrolling === false )
	{
		this.contentDiv.style.overflow = 'hidden';
	}
	
	// Touch start show menu!
	scrn.contentDiv.parentNode.addEventListener( 'touchstart', function( e )
	{
		// Set the screen quickly..
		window.currentScreen = div;
		CheckScreenTitle();
	
		// check for other touch start action
		if( scrn.contentDiv.onTouchStartAction )
			if( scrn.contentDiv.onTouchStartAction( e ) )
				return cancelBubble( e );
			
		var t = e.target ? e.target : e.srcElement;
	
		// We are registering a click inside
		if( !( t != scrn.contentDiv && t != scrn.contentDiv.parentNode ) )
		{	
			if( !isMobile )
			{
				_DeactivateWindows();
			}
			var tp = e.changedTouches[0];
			if( !scrn.touch ) scrn.touch = {};
			scrn.touch.moving = true;
			scrn.touch.ox = scrn.contentDiv.parentNode.offsetLeft;
			scrn.touch.oy = scrn.contentDiv.parentNode.screenOffsetTop;
			if( !scrn.touch.oy ) scrn.touch.oy = 0;
	
			scrn.touch.tx = scrn.touch.ox - tp.clientX;
			scrn.touch.ty = scrn.touch.oy - tp.clientY;
	
			// Click in the corner, or the gadget when pulling screens
			if( tp.clientX > scrn.contentDiv.parentNode.offsetWidth - 32 && scrn.touch.ty > -32 )
			{
				scrn.screenCycle();
				scrn.touchCycled = true; // << prevent the touchmove to occur
				scrn.touchMoving = true; // 
				return cancelBubble( e );
			}
	
			// We own this domain..
			if( t.classList && ( t.classList.contains( 'ScreenContent' ) || t.classList.contains( 'TitleBar' ) ) )
			{
				if( t.classList.contains( 'ScreenContent' ) )
				{
					if( !isMobile )
					{
						_DeactivateWindows();
					}
					ExposeWindows();
					ExposeScreens();
				}
				return cancelBubble( e );
			}
		}
	
		// Make clicking work!
		if( t.onclick )
		{
			t.onclick( e );
			return cancelBubble( e );
		}
	
	}, true );
	
	scrn.touchCycled = false; // we didn't cycle before
	scrn.touchMoving = false;
	
	scrn.contentDiv.parentNode.addEventListener( 'touchmove', function( e )
	{
		var t = e.target ? e.target : e.srcElement;
		if( t != scrn.contentDiv && t != scrn.contentDiv.parentNode ) return;
	
		var ct = scrn.contentDiv.parentNode.screenOffsetTop;
		if( !ct ) ct = '0px';
	
		var tp = e.changedTouches[0];
		scrn.touch.mx = tp.clientX;
		scrn.touch.my = tp.clientY;
		var diffy = scrn.touch.ty + ( scrn.touch.my - scrn.touch.oy );
		var diffx = scrn.touch.tx + ( scrn.touch.mx - scrn.touch.ox );
	
		if( !scrn.touchCycled && Math.abs( diffx ) > ( window.innerWidth * 0.8 ) )
		{
			scrn.touchCycled = true;
			scrn.screenCycle();
		}
		else if( isMobile && diffx < -100 && !scrn.moving )
		{
			if( Friend.GUI.responsiveViewPage < Friend.GUI.responsiveViewPageCount )
			{
				scrn.moving = true;
				setTimeout( function()
				{
					scrn.moving = false;
				}, 500 );
				Friend.GUI.responsiveViewPage++;
				var px = Math.round( scrn.contentDiv.parentNode.offsetWidth * -( Friend.GUI.responsiveViewPage ) ) + 'px';
				scrn.contentDiv.style.transform = 'translate3d(' + px + ',0,0)';
			}
		}
		else if( isMobile && diffx > 100 && !scrn.moving )
		{
			if( Friend.GUI.responsiveViewPage > 0 )
			{
				scrn.moving = true;
				setTimeout( function()
				{
					scrn.moving = false;
				}, 500 );
				Friend.GUI.responsiveViewPage--;
				var px = Math.round( scrn.contentDiv.parentNode.offsetWidth * -( Friend.GUI.responsiveViewPage ) ) + 'px';
				scrn.contentDiv.style.transform = 'translate3d(' + px + ',0,0)';
			}
		}
		// Show the dock!
		else if( diffy < 0 && parseInt( ct ) == 0 )
		{
			if( !scrn.touch.moved && diffy < -60 && !Workspace.mainDock.open )
			{
				Workspace.mainDock.openDesklet( e );
			}
		}
		// Don't do this on mobile
		else if( !window.isMobile && Math.abs( diffy ) > 5 ) 
		{
			var top = scrn.touch.oy + diffy;
			if( top < 0 ) 
			{
				top = 0;
			}
			if( top + 40 > scrn.contentDiv.parentNode.offsetHeight )
			{
				top = scrn.contentDiv.parentNode.offsetHeight - 40;
			}
			if( top != 0 )
			{
				scrn.contentDiv.parentNode.setAttribute( 'moved', 'moved' );
			}
			else scrn.contentDiv.parentNode.setAttribute( 'moved', '' );
			var nt = top + 'px';
			if( ct != nt )
			{
				scrn.contentDiv.parentNode.style.transform = 'translate3d(0,' + nt + ',0)';
				scrn.contentDiv.parentNode.screenOffsetTop = top;
				scrn.touch.moved = true;
			}
		
			// No need for menu here
			if( scrn.clickTimeout )
			{
				clearTimeout( scrn.clickTimeout );
				scrn.clickTimeout = false;
			}
		}
		if( !scrn.touchMoving )
		{
			scrn.touchMoving = true;
			// You have 0.5 secs to switch screens!
			scrn.touchCycleTimeout = setTimeout( function()
			{
				scrn.touchCycled = true;
			}, 500 );
		}
		return cancelBubble( e );
	} );
	
	scrn.contentDiv.parentNode.addEventListener( 'touchend', function( e )
	{
		if( scrn.clickTimeout )
			clearTimeout( scrn.clickTimeout );
		if( scrn.touchCycleTimeout )
			clearTimeout( scrn.touchCycleTimeout );
		if( scrn.menuTimeout )
			clearTimeout( scrn.menuTimeout );
		scrn.touchCycled = false; // reset
		scrn.touchMoving = false;
		scrn.touch = {};
	} );
	
	
	this.div = div;
	div.screenObject = this;
	
	// Prevent scrolling
	// TODO: Allow it under conditions!
	if( div.addEventListener )
		div.addEventListener( 'scroll', function(){ div.scrollTop = 0; } );
	else div.attachEvent( 'onscroll', function(){ div.scrollTop = 0; } );
	
	// Clear on release
	function clearOverlay()
	{
		div._screenoverlay.style.display = 'none';
		div._screenoverlay.style.pointerEvents = 'none';
	}
	div.addEventListener( 'touchend', clearOverlay, true );
	div.addEventListener( 'mouseup', clearOverlay, true );
	
	// Gets all divs here
	this.getElementsByTagName = function ( ele )
	{
		return this.div.getElementsByTagName ( ele );
	}
	
	// Move this screen to front
	this.screenToFront = function ()
	{
		var screens = ge ( 'Screens' );
		var subs = screens.getElementsByTagName ( 'div' );
		var maxz = 0;
		for ( var a = 0; a < subs.length; a++ )
		{
			if( !subs[a].className ) continue;
			if( subs[a].parentNode != screens ) continue;
			if( parseInt ( subs[a].style.zIndex ) <= 0 )
				subs[a].style.zIndex = 0;
			if( parseInt ( subs[a].style.zIndex ) > maxz )
				maxz = parseInt ( subs[a].style.zIndex );
		}
		maxz++;
		this.div.style.zIndex = maxz;
		window.currentScreen = this.div;
	}
	
	// Next screen please
	this.screenCycle = function ()
	{
		var screens = ge ( 'Screens' );
		var divz = screens.getElementsByTagName ( 'div' );
		
		// Make sure we get the screen divs in the correct order
		var rdiv = [];
		var indexes = [];
		for( var a = 0; a < divz.length; a++ )
		{
			if( divz[a].className && divz[a].parentNode == screens )
			{
				rdiv.push( divz[a] );
				indexes.push( divz[a].style.zIndex );
			}
		}
		indexes.sort();
		var subs = [];
		for( var z = 0; z < indexes.length; z++ )
		{
			for ( var a = 0; a < rdiv.length; a++ )
			{
				if( rdiv[a].style.zIndex == indexes[z] )
				{
					subs.push( rdiv[a] );
				}
			}
		}
		// Normalize z-indexes
		var max = 1;
		var highest = false;
		for( var z = 0; z < subs.length; z++ )
		{
			subs[z].style.zIndex = z+1;
			highest = subs[z];
			max = z+1;
		}
		// Flip to front
		if( this.div.style.zIndex != 0 && this.div.style.zIndex != max )
			this.div.style.zIndex = max+1; 
		// Flip to back
		else this.div.style.zIndex = 0;
		return highest; // Highest order!
	}
	
	// Set content (securely!) in a sandbox, callback when completed
	this.setContentIframed = function( content, domain, packet, callback )
	{
		var scrn = this;

		if( !domain )
		{
			domain = document.location.href + '';
			domain = domain.split( 'index.html' ).join ( 'sandboxed.html' );
			domain = domain.split( 'app.html' ).join( 'sandboxed.html' );
		}

		// Oh we have a conf?
		if( this.conf )
		{
			domain += '/system.library/module/?module=system&command=sandbox' +
				'&sessionid=' + Workspace.sessionId +
				'&conf=' + JSON.stringify( this.conf );
		}
		else if( domain.indexOf( 'sandboxed.html' ) <= 0 )
		{
			domain += '/webclient/sandboxed.html';
		}

		// Make sure scripts can be run after all resources has loaded
		if( content && content.match )
		{
			var r;
			while( r = content.match( /\<script([^>]*?)\>([\w\W]*?)\<\/script\>/i ) )
				content = content.split( r[0] ).join( '<friendscript' + r[1] + '>' + r[2] + '</friendscript>' );
		}
		else
		{
			content = '';
		}

		var c = this._screen;
		if( c && c.content ) c = c.content;
		if( c )
		{
			c.innerHTML = '';
		}
		var ifr = document.createElement( _viewType );
		ifr.applicationId = self.applicationId;
		ifr.authId = self.authId;
		ifr.applicationName = self.applicationName;
		ifr.applicationDisplayName = self.applicationDisplayName;
		ifr.className = 'Content';
		ifr.setAttribute( 'allowfullscreen', 'true' )
		ifr.src = domain;

		if( packet.applicationId )
			this._screen.applicationId = packet.applicationId;
		if( packet.authId ) this._screen.authId = packet.authId;
		if( packet.applicationName ) this._screen.applicationName = packet.applicationName;
		packet.screenId = this.externScreenId; // Register screen id

		ifr.onload = function()
		{
			var msg = {}; if( packet ) for( var a in packet ) msg[a] = packet[a];
			msg.command = 'setbodycontent';
			msg.locale = Workspace.locale;
			msg,cachedAppData = _applicationBasics;
			msg.dosDrivers = Friend.dosDrivers;
			// Authid is important, should not be left out if it is available
			if( !msg.authId )
			{
				if( ifr.authId ) msg.authId = ifr.authId;
				else if( GetUrlVar( 'authid' ) ) msg.authId = GetUrlVar( 'authid' );
			}
			// Override the theme
			if( scrn.getFlag( 'theme' ) ) msg.theme = scrn.getFlag( 'theme' );
			if( Workspace.themeData )
				msg.themeData = Workspace.themeData;
			// Use this if the packet has it
			if( !msg.sessionId )
			{
				if( packet.sessionId ) msg.sessionId = packet.sessionId;
			}
			msg.registerCallback = addWrapperCallback( function() { if( callback ) callback(); } );
			if( packet.filePath )
			{
				msg.data = content.split( /progdir\:/i ).join( packet.filePath );
			}
			else msg.data = content;
			if( msg.data && msg.data.split )
				msg.data = msg.data.split( /system\:/i ).join( '/webclient/' );
			if( !msg.origin ) msg.origin = '*'; // TODO: should be this - document.location.href;
			ifr.contentWindow.postMessage( JSON.stringify( msg ), Workspace.protocol + '://' + ifr.src.split( '//' )[1].split( '/' )[0] );
			if( callback ) callback();
			
			// Make sure to show!
			WorkspaceMenu.show();
		}
		this.iframe = ifr;
		// Position content
		ifr.style.position = 'absolute';
		ifr.style.border = 'none';
		ifr.style.height = this._titleBar ? ( 'calc(100% - ' + ( this._titleBar.offsetHeight + 'px' ) + ')' ) : '100%';
		ifr.style.width = '100%';
		ifr.style.left = '0';
		ifr.style.top = this._titleBar.offsetHeight + 'px';
		c.appendChild( ifr );
	}
	
	// Sets rich content in a safe iframe
	this.setRichContentUrl = function( url, base, appId, filePath, callback )
	{	
		if( !base ) 
			base = '/';
		
		var eles = this._screen.getElementsByTagName( _viewType );
		var ifr = false;
		var w = this;
		if( eles[0] )
		{
			ifr = eles[0];
		}
		else
		{
			ifr = document.createElement( _viewType );
			this._screen.appendChild( ifr );
		}
		
		// Register the app id so we can talk
		this._screen.applicationId = appId;
		
		ifr.applicationId = self.applicationId;
		ifr.applicationName = self.applicationName;
		ifr.authId = self.authId;
		ifr.setAttribute( 'scrolling', 'no' );
		ifr.setAttribute( 'seamless', 'true' );
		ifr.setAttribute( 'allowfullscreen', 'true' );
		ifr.style.border = '0';
		ifr.style.position = 'absolute';
		ifr.style.top = this._titleBar ? ( this._titleBar.offsetHeight + 'px' ) : '0'; 
		ifr.style.left = '0';
		ifr.style.width = '100%'; 
		ifr.style.height = this._titleBar ? ( 'calc(100% - ' + ( this._titleBar.offsetHeight + 'px' ) + ')' ) : '100%';
		
		// Find our friend
		// TODO: Only send postmessage to friend targets (from our known origin list (security app))
		var targetP = url.match( /(http[s]{0,1}\:\/\/.*?)\//i );
		var friendU = document.location.href.match( /http[s]{0,1}\:\/\/(.*?)\//i );
		var targetU =                    url.match( /http[s]{0,1}\:\/\/(.*?)\//i );
		if( friendU && friendU.length > 1 ) friendU = friendU[1];
		if( targetU && targetU.length > 1 ) 
		{
			targetP = targetP[1];
			targetU = targetU[1];
		}
		
		// We're on a road trip..
		if( !( friendU && ( friendU == targetU || !targetU ) ) )
		{
			ifr.sandbox = DEFAULT_SANDBOX_ATTRIBUTES;
		}
		
		// Allow sandbox flags
		var sbx = ifr.getAttribute( 'sandbox' ) ? ifr.getAttribute( 'sandbox' ) : '';
		sbx = ('' + sbx).split( ' ' );
		if( this.flags && this.flags.allowPopups )
		{
			var found = false;
			for( var a = 0; a < sbx.length; a++ )
			{
				if( sbx[a] == 'allow-popups' )
				{
					found = true;
				}
			}
			if( !found ) sbx.push( 'allow-popups' );
			ifr.sandbox = sbx.join( ' ' );
		}
		
		ifr.onload = function( e )
		{
			if( friendU && ( friendU == targetU || !targetU ) )
			{
				var msg = JSON.stringify( { 
					command:       'initappframe', 
					base:          base,
					applicationId: appId,
					filePath:      filePath,
					origin:        '*', // TODO: should be this - document.location.href,
					screenId:      w.externScreenId,
					theme:         Workspace.theme,
					clipboard:     Friend.clipboard
				} );
				ifr.contentWindow.postMessage( msg, Workspace.protocol + '://' + ifr.src.split( '//' )[1].split( '/' )[0] );
				ifr.loaded = true;
				if( callback ) callback();
			}
			/*else
			{
				ifr.contentWindow.window.origin = targetP;
			}*/
			
			// Make sure to show!
			WorkspaceMenu.show();
		}
		
		// Oh we have a conf?
		if( this.conf && url.indexOf( Workspace.protocol + '://' ) != 0 )
		{
			var cnf = this.conf;
			if( typeof( this.conf ) == 'object' ) cnf = '';
			ifr.src = '/system.library/module/?module=system&command=sandbox' +
				'&sessionid=' + Workspace.sessionId +
				'&url=' + encodeURIComponent( url ) + '&conf=' + cnt;
		}
		else
		{
			ifr.src = url;
		}
		
		this.isRich = true;
		this.iframe = ifr;
	}
	
	// Set menu items on window
	this.setMenuItems = function( obj, appid, screenId )
	{
		// Set destination
		if( screenId ) div.menuScreenId = screenId;
		// Set items
		div.menu = obj;
		if( appid )
		{
			this._screen.applicationId = appid;
		}
	}
	
	this.close = function ()
	{
		currentScreen = this.screenCycle();
		if( this.div.parentNode )
			this.div.parentNode.removeChild( this.div );
		delete this;
		CheckScreenTitle();
	}
	
	// Send a message
	this.sendMessage = function( dataObject )
	{
		//dataObject.command = 'message';
		if( this.iframe && this.iframe.contentWindow )
		{
			var u = Workspace.protocol + '://' + this.iframe.src.split( '//' )[1].split( '/' )[0];
			var origin = u;
			if( !dataObject.applicationId && this._screen.applicationId )
			{
				dataObject.applicationId = this._screen.applicationId;
				dataObject.authId = this._screen.authId;
				dataObject.applicationName = this._screen.applicationName;
			}
			if( !dataObject.type )
				dataObject.type = 'system';
			this.iframe.contentWindow.postMessage( JSON.stringify( dataObject ), origin );
		}
		else
		{
			if( !this.sendQueue )
				this.sendQueue = [];
			this.sendQueue.push( dataObject );
		}
	}
	
	this.displayOfflineMessage = function()
	{
		//console.log('show htat we are offline...');
		var offline = this.div.getElementsByClassName( 'Offline' )[0];
		if( offline )
		{
			offline.style.display = 'block';
		}
		else
		{

			offline = document.createElement( 'div' );
			offline.className = 'Offline';
			offline.innerHTML = i18n('i18n_server_disconnected');
			this.div.appendChild( offline );	
		}
		
		if( window.Workspace && Workspace.notifyAppsOfState )
		{
			Workspace.notifyAppsOfState( {
				state: 'offline'
			} );
		}
	}
	
	this.hideOfflineMessage = function()
	{
		var offline = this.div.getElementsByClassName( 'Offline' )[0];
		if( offline ) offline.style.display = 'none';
		
		if( window.Workspace && Workspace.notifyAppsOfState )
		{
			Workspace.notifyAppsOfState( {
				state: 'online'
			} );
		}
	}
	
	// Go through flags
	this.checkFlags = function()
	{
		for( var a in this._flags )
		{
			switch( a.toLowerCase() )
			{
				case 'fullscreen':
					if( this._flags[a] == true )
					{
						div.screenTitle.style.display = 'none';
					}
					else
					{
						div.screenTitle.style.display = '';
					}
					break;
			}
		}
	}
	this.checkFlags();
	
	// Init
	this.screenToFront ();
	_DeactivateWindows();
	
	// Initial resize
	this.resize();
	
	this.ready = true;
	
    // Let's poll the tray!
	if( statusbar.length )
        PollTray();
      
	if( !Workspace.screenList )
	{
		Workspace.screenList = [];
	}  
	Workspace.screenList.push( this );
}


