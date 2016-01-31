/*******************************************************************************
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
*******************************************************************************/

// Screen class to support multiple screens
Screen = function ( flags, initObject )
{
	this._flags = new Object ();
	this._flags.taskbar = true;
	
	if ( typeof ( flags ) == 'object' )
	{
		for ( var a in flags )
		{
			this._flags[a] = flags[a];
		}
	}
	
	if ( typeof ( this._flags['title'] ) == 'undefined' )
	{
		this._flags['title'] = 'Unknown screen';
	}
	
	// TODO: Make dynamic!
	var statusbar = "" +
		"<div class=\"Box\" id=\"Statusbar\">" +
		"	<div id=\"Taskbar\">" +
		"	</div>" + 
		"	<div id=\"StatusBox\">" +
		"	</div>" +
		"   <div id=\"Tray\"><div class=\"Microphone IconSmall fa-microphone\"></div>" +
		"   </div>" +
		"</div>";
	
	// Fullscreen mode has no statusbar (as well as those who are specific)
	if ( !this._flags.taskbar || this._flags.fullscreen ) 
	{
		statusbar = '';
	}
	
	var div;
	if ( initObject ) div = initObject;
	else 
	{
		div = document.createElement ( 'div' );
		
		// FIXME: Hack - this should be better calculated, and it's not resize friendly
		div.style.minHeight = document.body.offsetHeight + 'px';
		
		// We need this or blank
		if( typeof( this._flags['extra'] ) == 'undefined' )
			this._flags['extra'] = '';
		
		div.style.webkitTransform = 'translate3d(0, 0, 0)';
		div.innerHTML = "" +
		"<div class=\"TitleBar\">" +
		"	<div class=\"Right\">" +
		"		<div class=\"ScreenList\"><img src=\"gfx/system/window_depth.png\"/></div>" +
		"	</div>" +
		"	<div class=\"Left\">" +
		"		<div class=\"Info\">" + this._flags['title'] + "</div>" +
		"		<div class=\"Extra\">" + this._flags['extra'] + "</div>" +
		"	</div>" +
		"</div>" +
		"<div class=\"ScreenContent\">" +
		"</div>" +
		statusbar +
		"<div class=\"ScreenOverlay\"></div>";
		ge ( 'Screens' ).appendChild( div );
		
		// FIXME: Hack - this should be better calculated, and it's not resize friendly
		var cnt = false;
		var divs = div.getElementsByTagName( 'div' );
		for( var a = 0; a < divs.length; a++ )
		{
			if( divs[a].className == 'ScreenContent' )
			{
				this._screen = divs[a];
				divs[a].style.minHeight = div.style.minHeight;
			}
			else if ( divs[a].className == 'TitleBar' )
			{
				this._titleBar = divs[a];
			}
		}
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
		if( !e ) e = window.event;
		if( e.button != 0 ) return;
		window.currentScreen = this;
	}
	
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
		if ( divs[a].className && divs[a].className == 'ScreenList' )
			btncycle = divs[a];
		else if ( divs[a].className && divs[a].className == 'ScreenOverlay' )
			scroverl = divs[a];
		else if( divs[a].className && divs[a].className == 'ScreenContent' )
			this.contentDiv = divs[a];
	}
	if ( btncycle )
	{
		var o = this;
		btncycle.onclick = function ()
		{
			o.screenCycle ();
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
	div.screenTitle.onmousedown = function ( e )
	{
		if ( !e ) e = window.event;
		
		if( e.button != 0 ) return;
		
		var y = e.clientY ? e.clientY : e.pageYOffset;
		var x = e.clientX ? e.clientX : e.pageXOffset;
		
		var offl = this.parentNode.offsetLeft;
		var offt = this.parentNode.offsetTop;
		
		this.parentNode.offx = x - offl;
		this.parentNode.offy = y - offt;
		
		window.currentScreen = div;
		window.mouseDown = FUI_MOUSEDOWN_SCREEN;
		window.mouseReleaseFunc = function ( e )
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
		window.mouseMoveFunc = function ( e )
		{
			var my = e.clientY ? e.clientY : e.pageYOffset;
			var mx = e.clientX ? e.clientX : e.pageXOffset;
			var ty = my - window.currentScreen.offy;
			if ( ty < 0 ) ty = 0;
			if ( ty >= GetWindowHeight () ) ty = GetWindowHeight () - 1;
			
			div.style.top = ty + 'px';
			
			document.body.style.cursor = 'pointer';
			
			// Enable all screen overlays
			var screenc = ge ( 'Screens' );
			var screens = screenc.getElementsByTagName ( 'div' );
			for( var a = 0; a < screens.length; a++ )
			{
				if( !screens[a].className ) continue;
				if( screens[a].parentNode != screenc ) continue;
				screens[a]._screenoverlay.style.display = '';
			}
		}
		return cancelBubble ( e );
	}
	// Alias clicking the screen
	div.onmouseup = function ( e ) 
	{ 
		var t = e.target ? e.target : e.srcElement;
		
		// Only left button clicks!
		if( e.button != 0 )
			return false;
		
		// Deactivate all windows when clicking on the desktop wallpaper
		if ( 
			t.id && t.id == 'DoorsScreen' || 
			( !t.id && t.parentNode.id == 'DoorsScreen' && t.className == 'ScreenContent' ) 
		)
		{
			_DeactivateWindows();
		}
	}
	
	this.div = div;
	div.screenObject = this;
	
	// Prevent scrolling
	// TODO: Allow it under conditions!
	if( div.addEventListener )
		div.addEventListener( 'scroll', function(){ div.scrollTop = 0; } );
	else div.attachEvent( 'onscroll', function(){ div.scrollTop = 0; } );
	
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
	}
	
	// Next screen please
	this.screenCycle = function ()
	{
		var screens = ge ( 'Screens' );
		var divz = screens.getElementsByTagName ( 'div' );
		var subs = [];
		for ( var a = 0; a < divz.length; a++ )
		{
			if( !divz[a].className ) continue;
			if( divz[a].parentNode != screens ) continue;
			subs.push ( divz[a] );
		}
		for ( var a = 0; a < subs.length; a++ )
		{
			var swapScreen = (a+1)%subs.length;
			if ( subs[a].screen == this )
			{
				var tmp = this.div.style.zIndex;
				this.div.style.zIndex = subs[swapScreen].style.zIndex;
				subs[swapScreen].style.zIndex = tmp;
				window.currentScreen = subs[swapScreen];
				return true;
			}
		}
		return false;
	}
	
	// Set content (securely!) in a sandbox, callback when completed
	this.setContentIframed = function( content, domain, packet, callback )
	{
		if( !domain )
		{
			// TODO: Figure out the correct url (not utilities - that's hard coded )
			//domain = document.location.href.split( Workspace.protocol + '://' ).join ( Workspace.protocol + '://utilities.' ); // <- please connect it again
			domain = document.location.href + '';
			domain = domain.split( 'index.html' ).join ( 'sandboxed.html' );
		}
		var c = this._screen;
		if( c.content ) c = c.content;
		c.innerHTML = '';
		var ifr = document.createElement( 'iframe' );
		ifr.className = 'Content';
		ifr.src = domain;
		if( packet.applicationId )
			this._screen.applicationId = packet.applicationId;
		if( packet.authId ) this._screen.authId = packet.authId;
		if( packet.applicationName ) this._screen.applicationName = packet.applicationName;
		ifr.onload = function()
		{
			var msg = {}; if( packet ) for( var a in packet ) msg[a] = packet[a];
			msg.command = 'setbodycontent';
			if( packet.filePath )
				msg.data = content.split( /progdir\:/i ).join( packet.filePath );
			else msg.data = content;
			msg.data = msg.data.split( /system\:/i ).join( '/webclient/' );
			if( !msg.origin ) msg.origin = document.location.href;
			ifr.contentWindow.postMessage( JSON.stringify( msg ), Workspace.protocol + '://' + ifr.src.split( '//' )[1].split( '/' )[0] );
			if( callback ) 
				callback();
		}
		this.iframe = ifr;
		// TODO: Fixie - make ScreenContent automatically have top under the titlebar!
		ifr.style.position = 'absolute';
		ifr.style.border = 'none';
		ifr.style.height = document.body.offsetHeight - this._titleBar.offsetHeight + 'px';
		ifr.style.width = '100%';
		ifr.style.left = '0';
		ifr.style.top = this._titleBar.offsetHeight + 'px';
		c.appendChild( ifr );
	}
	
	// Set menu items on window
	this.setMenuItems = function( obj, appid )
	{
		div.menu = obj;
		if( appid )
		{
			this._screen.applicationId = appid;
		}
	}
	
	this.close = function ()
	{
		this.screenCycle ();
		if( this.div.parentNode )
		{
			this.div.parentNode.removeChild ( this.div );
		}
		delete this;
	}
	
	// Send a message
	this.sendMessage = function( dataObject )
	{
		//dataObject.command = 'message';
		if( this.iframe && this.iframe.contentWindow )
		{
			var u = Workspace.protocol + '://' + this.iframe.src.split( '//' )[1].split( '/' )[0];
			var origin = event.origin && event.origin != 'null' ? event.origin : u;
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
	window.currentScreen = div;
	this.ready = true;
	
    // Let's poll the tray!
	if( statusbar.length )
        PollTray();
}

// Changing screens on swipe
if( window.isMobile )
{
	setupScreenTouchEvents()
}

function setupScreenTouchEvents()
{
	if( ge('Screens') )
	{
		console.log('setup screen hammer');
		hammertime = new Hammer( ge('Screens') );
		hammertime.get('swipe').set({ direction:Hammer.DIRECTION_ALL  });
		hammertime.on('swipe', function(evt) {
			if( ( evt.direction == 2 || evt.direction == 4 ) && evt.target.className.indexOf('ScreenContent') > -1 )
			{
				currentScreen.screenObject.screenCycle();	
			}	
		});		
	}
	else
	{
		setTimeout('setupScreenTouchEvents()', 500);
	}

 
}

