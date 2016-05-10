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
	
	if ( typeof ( flags ) == 'object' )
	{
		for ( var a in flags )
		{
			this._flags[a] = flags[a];
		}
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
			case 'background':
				this._flags[ flag ] = value;
				break;
		}
	}
	
	if ( typeof ( this._flags['title'] ) == 'undefined' )
	{
		this._flags['title'] = 'Unknown screen';
	}
	
	// TODO: Make dynamic!
	var statusbar = '';
	if( this._flags.taskbar )
	{
		statusbar = "" +
			"<div class=\"Box\" id=\"Statusbar\">" +
			"	<div id=\"Taskbar\">" +
			"	</div>" + 
			"	<div id=\"StatusBox\">" +
			"	</div>" +
			"   <div id=\"Tray\"><div class=\"Microphone IconSmall fa-microphone-slash\"></div>" +
			"   </div>" +
			"</div>";
	}
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
		
		// Background support
		if( typeof( this._flags['background'] ) != 'undefined' )
			div.style.backgroundColor = this._flags['background'];
			
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
		CheckScreenTitle();
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
		
		// Set current screen
		window.currentScreen = this.parentNode;
		CheckScreenTitle();
		
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
		if( e.button != 0 ) return false;
		
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
		for( var z = 0; z < subs.length; z++ )
		{
			subs[z].style.zIndex = z+1;
			max = z+1;
		}
		// Flip to front
		if( this.div.style.zIndex != 0 && this.div.style.zIndex != max )
			this.div.style.zIndex = max+1; 
		// Flip to back
		else this.div.style.zIndex = 0;
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
			
			// Oh we have a conf?
			if( this.conf )
			{
				domain = '/system.library/module/?module=system&command=sandbox' +
					'&sessionid=' + Workspace.sessionId +
					'&conf=' + JSON.stringify( this.conf );
			}
		}
		
		// Make sure scripts can be run after all resources has loaded
		if( content && content.match )
		{
			var r;
			while( r = content.match( /\<script([^>]*?)\>([\w\W]*?)\<\/script\>/i ) )
				content = content.split( r[0] ).join( '<friendscript' + r[1] + '>' + r[2] + '</friendscript>' );
		}
		
		var c = this._screen;
		if( c.content ) c = c.content;
		c.innerHTML = '';
		var ifr = document.createElement( 'iframe' );
		ifr.className = 'Content';
		ifr.setAttribute('allowfullscreen', 'true')
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
			if( msg.data && msg.data.splut )
				msg.data = msg.data.split( /system\:/i ).join( '/webclient/' );
			if( !msg.origin ) msg.origin = document.location.href;
			ifr.contentWindow.postMessage( JSON.stringify( msg ), Workspace.protocol + '://' + ifr.src.split( '//' )[1].split( '/' )[0] );
			if( callback ) callback();
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
	
	// Sets rich content in a safe iframe
	this.setRichContentUrl = function( url, base, appId, filePath, callback )
	{
		if( !base ) 
			base = '/';
		
		var eles = this._screen.getElementsByTagName( 'iframe' );
		var ifr = false;
		var w = this;
		if( eles[0] )
		{
			ifr = eles[0];
		}
		else
		{
			ifr = document.createElement( 'iframe' );
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
			ifr.sandbox = 'allow-same-origin allow-forms allow-scripts';
		}
		
		// Allow sandbox flags
		var sbx = ifr.getAttribute('sandbox') ? ifr.getAttribute('sandbox') : '';
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
					origin:        document.location.href,
					screenId:      w.externScreenId
				} );
				ifr.contentWindow.postMessage( msg, Workspace.protocol + '://' + ifr.src.split( '//' )[1].split( '/' )[0] );
				ifr.loaded = true;
				if( callback ) callback();
			}
			/*else
			{
				ifr.contentWindow.window.origin = targetP;
			}*/
		}
		
		// Oh we have a conf?
		if( this.conf && url.indexOf( Workspace.protocol + '://' ) != 0 )
		{
			ifr.src = '/system.library/module/?module=system&command=sandbox' +
				'&sessionid=' + Workspace.sessionId +
				'&url=' + encodeURIComponent( url ) + '&conf=' + this.conf;
		}
		else ifr.src = url;
		this.isRich = true;
		this.iframe = ifr;
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
	_DeactivateWindows();
	
	this.ready = true;
	
    // Let's poll the tray!
	if( statusbar.length )
        PollTray();
}

// Changing screens on swipe
if( window.isMobile )
{

	var touchDowned = 0;
	var touchStart = [];
	var touchEnd = [];

	setupScreenTouchEvents()
}


function setupScreenTouchEvents()
{
	window.addEventListener('touchstart', function(evt) {
		 touchStart = [ evt.touches[0].clientX, evt.touches[0].clientY ]; 
		 touchDowned = evt.timeStamp;
	});
	window.addEventListener('touchmove', function(evt) {
		//we dont really do aniything here....
		//console.log('we have registered a touch MOVE...',evt);
	});
	window.addEventListener('touchend', function(evt) { 
		touchEnd =  [ evt.changedTouches[0].clientX, evt.changedTouches[0].clientY ];
		if( evt.timeStamp - touchDowned > 10 && evt.timeStamp - touchDowned < 150 && Math.abs( touchStart[0] - touchEnd[0] ) > 100 && Math.abs( touchStart[0] - touchEnd[0] ) > Math.abs( touchStart[1] - touchEnd[1] ) )
		{
			// we have at least 100px horizontal and more horizonal than vertical... lets call it a screen swipe.
			if( currentScreen && currentScreen.screenObject )  currentScreen.screenObject.screenCycle();	
		}
	});
}

