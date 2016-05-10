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

var FUI_MOUSEDOWN_RESIZE  =  2;
var FUI_MOUSEDOWN_WINDOW  =  1;
var FUI_MOUSEDOWN_SCREEN  =  3;
var FUI_MOUSEDOWN_SCROLLV = 10;
var FUI_WINDOW_MARGIN     =  3;

/* Make movable box --------------------------------------------------------- */

// Lets remember values
var _windowStorage = [];
var _windowStorageLoaded = false;

function GetWindowStorage( id )
{
	if( !id )
	{
		return _windowStorage;
	}
	else 
	{
		return _windowStorage[id];
	}
}

function SetWindowStorage( id, data )
{
	_windowStorage[id] = data;
}

function SaveWindowStorage( callback )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e )
	{
		if( e == 'ok' )
		{
		}
		if( callback ) callback();
	}
	m.execute( 'setsetting', { setting: 'windowstorage', data: JSON.stringify( jsonSafeObject( _windowStorage ) ) } );
}

function LoadWindowStorage()
{
	if( !_windowStorageLoaded )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				var dob = JSON.parse( d );
				_windowStorage = dob.windowstorage ? dob.windowstorage : [];
				if( typeof( _windowStorage ) != 'object' )
					_windowStorage = [];
			}
		}
		m.execute( 'getsetting', { setting: 'windowstorage' } );
		_windowStorageLoaded = true;
	}
}

// Find a movable window by title string
function FindWindow( titleStr )
{
	var divs = document.getElementsByTagName ( 'div' );
	for ( var a = 0; a < divs.length; a++ )
	{
		if ( divs[a].className.indexOf ( ' View' ) >= 0 )
		{
			if ( divs[a].childNodes.length && divs[a].childNodes[0].childNodes[0].childNodes[0].innerHTML == titleStr )
			{
				var divz = divs[a].getElementsByTagName ( 'div' );
				var cnt = divs[a];
				for ( var a = 0; a < divz.length; a++ )
				{
					if ( divz[a].className == 'Content' )
						cnt = divz[a];
				}
				return cnt;
			}
		}
	}
	return false;
}

// Return object with remembered window dimensions
function RememberWindowDimensions( div )
{
	var wp = GetWindowStorage( div.uniqueId );
	if ( wp )
	{
		var d = StringToObject( wp );
		if( d ) return d;
	}
	return false;
}


// Sets innerhtml no a window content and runs any javascript
function SetWindowContent( win, data )
{
	if ( win.content ) win = win.content;
	win.innerHTML = data.split ( /\<script[^>]*?\>[\w\W]*?\<\/script\>/i ).join ( '' );
	if ( d = RememberWindowDimensions ( win ) )
	{
		ResizeWindow ( win, d.width, d.height );
	}
	else 
	{
		ResizeWindow ( win );
	}
}

// Refresh the window and add/remove features
function RefreshWindow( div, noresize )
{
	if( div.content ) div = div.content;
	if( div.flags )
	{
		var flags = div.flags;
		var winObj = div.parentNode;
		if( flags.resize == false )
		{
			winObj.resize.style.display = 'none';
			winObj.zoom.style.display = 'none';
			div.style.overflow = 'hidden';
		}
		else 
		{
			winObj.resize.style.display = '';
			winObj.zoom.style.display = '';
			div.style.overflow = '';
		}
		if( flags.close == false )
		{
			winObj.close.style.display = 'none';
			winObj.close.parentNode.setAttribute( 'close', 'false' );
		}
		else
		{
			winObj.close.style.display = '';
		}
	}
	if( !noresize )
	{
		if( d = RememberWindowDimensions( div ) )
		{
			ResizeWindow( div, d.width, d.height );
		}
		else 
		{
			ResizeWindow( div );
		}
	}
}

// Set window title on a movable window
function SetWindowTitle( div, titleStr )
{
	if ( div.className == 'Content' )
		div = div.parentNode;
	var divz = div.getElementsByTagName ( 'div' );
	var title = false;
	for ( var a = 0; a < divz.length; a++ )
	{
		if ( divz[a].className == 'Title' )
			title = divz[a];
	}
	if ( !title ) return false;
	title.getElementsByTagName ( 'span' )[0].innerHTML = titleStr;
	div.titleString = titleStr;
}

// Do it!
function UpdateWindowContentSize( div )
{
	// set the content width
	if( div.content )
	{
		div.content.style.width  = 'calc(100%-' + div.marginHoriz + 'px)';
		div.content.style.height = 'calc(100%-' + div.marginVert  + 'px)';
	}
}

// Like it says!
function ResizeWindow( div, wi, he )
{
	if ( !div ) return;
	
	// Find window div
	if ( div.className == 'Content' )
	{
		while ( div.className.indexOf ( ' View' ) < 0 && div != document.body )
			div = div.parentNode;
	}
	if ( div == document.body ) return;

	if( div.content && div.content.flags )
	{
		if( !wi ) wi = div.content.flags.width; 
		if( !he ) he = div.content.flags.height;
	}
	

	if ( !wi || wi == 'false' ) wi = div.content ? div.content.offsetWidth  : div.offsetWidth;
	if ( !he || he == 'false' ) he = div.content ? div.content.offsetHeight : div.offsetHeight;
	

	wi = parseInt( wi );
	he = parseInt( he );
	
	var divs  = div.getElementsByTagName ( 'div' );
	var cnt   = false;
	var title = false;
	var botto = false;
	for( var a = 0; a < divs.length; a++ )
	{
		if( !cnt && divs[a].className == 'Content'     ) cnt   = divs[a];
		if( !title && divs[a].className == 'Title'     ) title = divs[a];
		if( !botto && divs[a].className == 'BottomBar' ) botto = divs[a];
	}
	
	var marg = FUI_WINDOW_MARGIN;
	var tith = title.offsetHeight;
	var sbar = GetStatusbarHeight();
	var bott = botto.offsetHeight;
	
	// Naughty fix!
	// TODO: Fix this, we need to wait for the css!
	if( tith == 0 ) tith = 35;
	if( bott == 0 ) bott = 18;
	
	// Remove margins and borders
	if( cnt && cnt.flags && cnt.flags.borderless ) 
	{
		marg = 0;
		tith = 0;
		sbar = 0;
	}
	
	// Maximum dimensions
	var maxWidth  = div.parentWindow ? div.parentWindow.getWindowElement().offsetWidth : GetWindowWidth();
	// TODO: Make this one more logical - use screen content top
	var maxHeight = div.parentWindow ? div.parentWindow.getWindowElement().offsetHeight : ( GetWindowHeight() - sbar - tith - bott - tith );
	
	if( cnt && cnt.flags && cnt.flags.maximized )
	{
		wi = maxWidth;
		he = maxHeight;
	}
	// We will not go past max height
	else
	{
		if( he > maxHeight ) he = maxHeight;
	}
	
	
	// Flag constraints
	var fminw = div.content && div.content.flags['min-width']  ? div.content.flags['min-width']  : 0;
	var fminh = div.content && div.content.flags['min-height'] ? div.content.flags['min-height'] : 0;
	var fmaxw = div.content && div.content.flags['max-width']  ? div.content.flags['max-width']  : 999999;
	var fmaxh = div.content && div.content.flags['max-height'] ? div.content.flags['max-height'] : 999999;
	
	
	// Constrain
	if( fmaxh < fminh ) fmaxh = fminh;
	if( fmaxw < fminw ) fmaxw = fminw;
	if( fminh > fmaxh ) fminh = fmaxh;
	if( fminw > fmaxw ) fminw = fmaxw;
	if( wi    < fminw ) wi = fminw;
	else if( wi >= fmaxw ) wi = fmaxw;
	if( he    < fminh ) he = fminh;
	else if( he >= fmaxh ) he = fmaxh;
	
	// Absolute minimum windows
	if( wi < 160 ) wi = 160;
	if( he < 60 ) he = 60;
	
	// Set the extra size of window outside content
	var eh = tith && bott ? ( tith + bott ) : 0; // title and bottom bar
	var ew = marg*2; // margins on left and right
	
	// Container
	var contw = wi + ew;
	var conth = he + eh;
	
	
	div.style.width  = contw + 'px';
	div.style.height = conth + 'px';	
			
	if( window.isMobile )
	{
		if( div.lastHeight )
		{
			div.style.height =  Math.min( Workspace.screenDiv.clientHeight - div.offsetTop - 72, div.lastHeight) + 'px';
		}
		else if( Workspace && Workspace.screenDiv )
		{

			var count = -1;
			if( typeof movableWindows != 'undefined' )
			{
				count = 0;
				for( var i in movableWindows)
				{
					if( movableWindows[i].hasAttribute('mimized') )
						continue;
					else
						count++
				}				
			}

			var targetOffsetTopp = ( count > -1 ? count * 18 : div.offsetTop ); // we should have each window times 36 but as every windows is twice in the list we just make it 18 :)
			div.style.height = Math.min( Workspace.screenDiv.clientHeight - targetOffsetTopp - 72, Math.max( 256, Workspace.screenDiv.clientHeight - 200 ) ) + 'px';
		}
	}
	
	div.marginHoriz = ew;
	div.marginVert  = eh;
	
	// Constrain
	ConstrainWindow( div );
	
	// set the content width
	UpdateWindowContentSize( div );
	
	// refresh
	if( div.refreshWindow ) div.refreshWindow ();
}

// Get the statusbar height
function GetStatusbarHeight()
{
	return ge ( 'Statusbar' ) ? ge ( 'Statusbar' ).offsetHeight : 0;
}

// Constrain position (optionally providing left and top)
function ConstrainWindow( div, l, t )
{
	// Get maximum width / height
	var maxWidth = div.parentWindow ? div.parentWindow.getWindowElement ().offsetWidth : GetWindowWidth ();
	var maxHeight = div.parentWindow ? div.parentWindow.getWindowElement ().offsetHeight : GetWindowHeight ();
	var sbar = GetStatusbarHeight();
		
	// Others
	var titleh = 0;
	var screenTop = 0;
	
	if( div.parentNode && div.parentNode.className.indexOf( 'Screen' ) >= 0 )
	{
		var cnt = div.parentNode.getElementsByTagName( 'div' );
		var scn = false;
		for( var a = 0; a < cnt.length; a++ )
		{
			if( cnt[a].className && cnt[a].className.indexOf( 'ScreenContent' ) >= 0 )
			{
				scn = cnt[a];
				break;
			}
		}
		if( scn )
		{
			screenTop = scn.offsetTop;
		}
	}
	
	var mt = div.parentWindow ? titleh : screenTop;
	var mh = maxHeight - ( div.parentWindow ? ( mt + sbar ) : sbar );
	var mw = maxWidth;
	var ww = div.offsetWidth;
	var wh = div.offsetHeight;
	
	// Start comparing (it should never be nan btw!)
	if( !t )
	{
		t = parseInt ( div.style.top  ); if( isNaN( t ) ) t = 0;
	}
	if( !l )
	{
		l = parseInt ( div.style.left ); if( isNaN( l ) ) l = 0;
	}
	
	if ( l + ww > mw )
		l = mw - ww;
	if ( l < 0 ) l = 0;
	if ( t + wh > mh )
		t = mh - wh;
	if ( t < mt ) t = mt;
	
	// Set the actual position
	div.style.top = t + 'px';
	div.style.left = l + 'px';
}

// Make window autoresize
function AutoResizeWindow ( div )
{
	if ( !div ) return;
	if ( div.className == 'Content' )
	{
		while ( div.className.indexOf ( ' View' ) < 0 && div != document.body )
			div = div.parentNode;
	}
	if ( div == document.body ) return;
	var divs = div.getElementsByTagName ( 'div' );
	var cnt = false;
	var title = false;
	for ( var a = 0; a < divs.length; a++ )
	{
		if ( divs[a].className == 'Content' )
			cnt = divs[a];
		if ( divs[a].className == 'Title' )
			title = divs[a];
	}
	if ( !cnt ) return false;
	
	div.autoResize = true;
	
	var h = 0;
	var eles = cnt.getElementsByTagName ( '*' );
	for ( var b = 0; b < eles.length; b++ )
	{
		if ( eles[b].parentNode != cnt ) continue;
		h += eles[b].offsetHeight;
	}
	
	ResizeWindow ( div, false, h );
}

// Sets the screen by window element
function SetScreenByWindowElement( div )
{
	// Set screen
	if( !div ) return false;
	var d = div;
	while( d != document.body && d.parentNode )
	{
		d = d.parentNode;
		if( d.className && (
			d.className == 'Screen' || d.className.indexOf( ' Screen' ) >= 0 ||
			d.className.indexOf( 'Screen ' ) == 0 
		) )
		{
			window.currentScreen = d;
			return true;
		}
	}
	return false;
}

// Just like _ActivateWindow, only without doing anything but activating
function _ActivateWindowOnly( div )
{
	// we use this one to calculate the max-height of the active window once its switched....
	var newOffsetY = 0;
	for( var a in movableWindows )
	{
		var m = movableWindows[a];
		
		// No div selected or not the div we're looking for - do inactive!
		if( !div || m != div )
		{
			m.className = m.className.split( ' Active' ).join( '' );
			if( window.isMobile && a.substr( 0, 6 ) == 'window')
			{
				m.style.height = '35px';
				newOffsetY += 35;
			}
		}
		// This is the div we are looking for!
		else if( m == div )
		{
			if( div.content )
				window.regionWindow = div.content;
			else window.regionWindow = div;
			
			if( div.content )
				window.currentMovable = div;
			else window.currentMovable = div.parentNode;
			
			m.className = m.className.split( ' Active' ).join( '' ) + ' Active';
			
			if( div.windowObject )
			{
				var iftest = div.getElementsByTagName( 'iframe' );
				var msg = {
					type:    'system',
					command: 'notify',
					method:  'activateview',
					windowId: div.windowObject.windowId
				};
				if( iftest && iftest[0] )
				{
					msg.applicationId = iftest[0].applicationId;
					msg.authId = iftest[0].authId;
				}
				div.windowObject.sendMessage( msg );
			}
			
			if( window.isMobile ) 
			{
				if( m.lastHeight )
				{
					m.style.height =  Math.min( Workspace.screenDiv.clientHeight - newOffsetY - 72, m.lastHeight) + 'px';
				}
				else if( Workspace && Workspace.screenDiv )
				{
					m.style.height = Math.min( Workspace.screenDiv.clientHeight - newOffsetY - 72, Workspace.screenDiv.clientHeight - 200 ) + 'px';
				}
				else
				{
					m.style.height = '175px';
				}
			}
		}
	}
}

// "Private" function to activate a window
function _ActivateWindow( div, nopoll, e )
{
	if ( div && div.content && typeof ( div.content.blocker ) == 'object' )
	{
		_ActivateWindow ( div.content.blocker.getWindowElement ().parentNode, nopoll );
		return;
	}
	
	// Set screen
	SetScreenByWindowElement( div );
	
	if( !e || ( !e.shiftKey && !e.ctrlKey ) )
		clearRegionIcons ();
	
	_ActivateWindowOnly( div );
	
	if ( !nopoll )
		PollTaskbar ( div );

	// Check window
	CheckScreenTitle();
}

function _DeactivateWindows()
{
	clearRegionIcons();
	var windowsDeactivated = 0;
	
	for ( var a in movableWindows )
	{
		var m = movableWindows[a];
		if( m.className.indexOf( 'Active' ) > 0 )
		{
			m.className = m.className.split ( ' Active' ).join ( '' );
			var div = m;
			if( div.windowObject )
			{
				var iftest = div.getElementsByTagName( 'iframe' );
				var msg = {
					type: 'system',
					command: 'notify',
					method: 'deactivateview',
					windowId: div.windowObject.windowId
				};
				if( iftest && iftest[0] )
				{
					msg.applicationId = iftest[0].applicationId;
				}
				
				div.windowObject.sendMessage( msg );
			}
			windowsDeactivated++;
		}
		CheckScreenTitle( movableWindows[a].screen );
	}
	
	window.currentMovable = false;
	
	if( windowsDeactivated > 0 )
		PollTaskbar ();
	
	// Put focus somewhere else than where it is now..
	for( var a in movableWindows )
	{
		if( movableWindows[a].windowObject )
		{
			movableWindows[a].windowObject.sendMessage( {
				command: 'blur'
			} );
		}
	}
	document.body.focus();
	
	// Check window
	CheckScreenTitle();
}

// Ouch! Use with care!
function CloseAllWindows()
{
    for( var a in movableWindows )
    {
        CloseView( movableWindows[a] );
    }
    movableWindows = [];
}

function _WindowToFront( div )
{
	// 1. Find highest and lowest zindex
	var low = 9999999;
	var high = -1;
	for( var a in movableWindows )
	{
		var m = movableWindows[a];
		if( m.style.zIndex < low ) 
			low = m.style.zIndex;
		if( m.style.zIndex > high )
			high = m.style.zIndex;
	}
	
	// 2. sort windows after zindex
	var sorted = [];
	for( var a = low; a <= high; a++ )
	{
		for( var b in movableWindows )
		{
			if( movableWindows[b].style.zIndex == a )
			{
				sorted.push( movableWindows[b] );
			}
		}
	}
	
	// 3. sort, and place current window to front
	var sortedInd = 100;
	for( var a = 0; a < sorted.length; a++ )
	{
		sorted[a].style.zIndex = sortedInd++;
	}
	
	// 4. now apply the one we want to front to the front, and move others
	//    back behind it
	div.style.zIndex = sorted[sorted.length-1].style.zIndex + 1;
	for( var a = sorted.length - 1; a > 0; a-- )
	{
		if( sorted[a] != div )
			sorted[a].style.zIndex = --sortedInd;
	}
}

// Make a movable window (the hard way)
function MakeWindow( div, titleStr, width, height, id, flags, applicationId )
{
	if ( !div ) return false;
	if ( !width ) width = 480;
	if ( !height ) height = 480;
	
	// If we're making a movable window with a unique id, the make sure
	// it doesn't exist, in case, just return the existing window
	
	var screen = false;
	var parentWindow = false;
	var titleStr = '';
	
	if( flags )
	{		
		if( typeof( flags.id ) != 'undefined' )
			id = flags.id;
		if( typeof( flags.title ) != 'undefined' )
			titleStr = flags.title;
		if( typeof( flags.screen ) != 'undefined' )
		{
			screen = flags.screen;
		}
		if( typeof( flags.parentView ) != 'undefined' )
			parentWindow = flags.parentView;
	}
	
	// We must always define a screen for our view
	if( !flags || !flags.screen )
	{
		if( !flags )
			flags = {};
		if( ge( 'DoorsScreen' ) )
		{
			flags.screen = ge( 'DoorsScreen' ).screenObject;
		}
		else 
		{
			flags.screen = { div: document.body };
		}
		screen = flags.screen;
	}
	
	if( !id )
	{
		id = titleStr.split ( ' ' ).join ( '_' );
		var tmp = id;
		var num = 2;
		while( typeof ( movableWindows[ tmp ] ) != 'undefined' )
		{
			tmp = id + '_' + (num++);
		}
		id = tmp;
	}
	
	// Make a unique id
	var uniqueId = titleStr ? titleStr + id : id;
	uniqueId = uniqueId.split( /[ |:]/i ).join ( '_' );
	
	// Where to add div..
	var divParent = false;
	
	if( id ) 
	{ 
		// Existing window!
		if ( typeof( movableWindows[ id ] ) != 'undefined' )
		{
			return false;
		}
		if ( div == 'CREATE' )
		{
			div = document.createElement ( 'div' );
			if( applicationId ) div.applicationId = applicationId;
			div.parentWindow = false;
			if( parentWindow ) 
			{
				divParent = parentWindow._window;
				div.parentWindow = parentWindow;
			}
			else if( screen )
			{
				divParent = screen.div;
			}
			else if( typeof ( window.currentScreen ) != 'undefined' )
			{
				divParent = window.currentScreen;
			}
			else divParent = document.body;
		}
		movableWindows[ id ] = div;
		div.titleString = titleStr;
		div.windowId = id;
	}
	else if ( div == 'CREATE' )
	{
		div = document.createElement ( 'div' );
		if( applicationId ) div.applicationId = applicationId;
		div.parentWindow = false;
		if( parentWindow )
		{
			divParent = parentWindow._window;
			div.parentWindow = parentWindow;
		}
		else if( screen )
		{
			divParent = screen.div;
		}
		else if( typeof( window.currentScreen ) != 'undefined' )
		{
			divParent = window.currentScreen;
		}
		else 
		{
			divParent = document.body;
		}
		div.id = 'window_' + movableWindowIdSeed++;
		div.windowId = div.id;
		movableWindows[ div.id ] = div;
	}
	div.style.webkitTransform = 'translate3d(0, 0, 0)';
	
	var html = div.innerHTML;
	var contn = document.createElement ( 'div' );
	contn.className = 'Content';
	contn.innerHTML = html;
	
	var titleSpan = document.createElement ( 'span' );
	titleSpan.innerHTML = titleStr ? titleStr : 'Uten navn';
	titleSpan.style.float = 'left';
	
	if( flags )
	{
		contn.flags = new Object ();
		contn.flags.borderless = false;
		contn.flags.maximized = false;
		for ( var a in flags )
		{
			var v = flags[a];
			switch ( a )
			{
				case 'width':     width  = v;  contn.flags['width'] = v; break;
				case 'title':                   titleSpan.innerHTML = v; break;
				case 'height':    height = v; contn.flags['height'] = v; break;
				case 'memorize':            contn.flags['memorize'] = v; break;
				case 'volume':
					if( v ) div.setAttribute( 'volume', 'true' ); 
					break;
				default:
					contn.flags[a] = v; 
					break;
			}
		}
	}
	else flags = new Object ();
	
	contn.applicationId = applicationId;
	
	if ( div.className.indexOf ( ' View' ) < 0 )
		div.className += ' View';
	div.style.zIndex = movableHighestZindex++;
	
	div.innerHTML = '';
	
	if ( !div.id )
	{
		div.id = 'window_' + movableWindowIdSeed++;
		movableWindows[ div.id ] = div;
	}

	// Volume gauge
	if( flags.volume && flags.volume != false )
	{
		var gauge = document.createElement( 'div' );
		gauge.className = 'VolumeGauge';
		gauge.innerHTML = '<div class="Inner"><div class="Pct"></div></div>';
		div.appendChild( gauge );
		div.volumeGauge = gauge.getElementsByTagName( 'div' )[0];
	}

	// Moveoverlay
	var molay = document.createElement ( 'div' );
	molay.className = 'MoveOverlay';
	molay.onmouseup = function()
	{
		closeWorkbenchMenu();
	}

	// Title
	var title = document.createElement ( 'div' );
	title.className = 'Title';


	// Resize
	var resize = document.createElement ( 'div' );
	resize.className = 'Resize';
	resize.style.position = 'absolute';
	resize.style.width = '14px';
	resize.style.height = '14px';
	resize.style.zIndex = '10';
	
	var inDiv = document.createElement( 'div' );
	
	title.appendChild( inDiv );
	
	title.onclick = function ( e ) { return cancelBubble ( e ); }
	title.ondragstart = function ( e ) { return cancelBubble ( e ); }
	title.onselectstart = function ( e ) { return cancelBubble ( e ); }
	
	// Simulate
	if( window.isMobile )
	{
		titleSpan.addEventListener( 'touchstart', function( e )
		{
			// Only cancel touch here when there's a menu!
			if( contn.menu )
			{
				title.onmousedown( e, 'simualted' );
				cancelBubble( e );
			}
		} );
	}
	
	title.onmousedown = function( e, mode )
	{ 
		if ( !e ) e = window.event;
		
		// Blocker
		if ( div.content.blocker )
		{
			_ActivateWindow ( div.content.blocker.getWindowElement ().parentNode );
			return cancelBubble ( e );
		}
		
		// Init workspace menu from title text (only active windows for mobile)
		var t = e.target ? e.target : e.srcElement;
		if( contn.menu && t == titleSpan && div.className.indexOf( ' Active' ) > 0 && window.isMobile )
		{
		    // Use correct button
    		if( e.button != 0 && !mode ) return cancelBubble( e );
			
			if( !title.popup )
			{
				var popup = document.createElement( 'div' );
				popup.className = 'PopupMenuHidden';
				title.appendChild( popup );
				title.popup = popup;
			}
			showWorkbenchMenu( title.popup, 'simulate' );
			return cancelBubble( e );
		}
		
		
		// Use correct button
    	if( e.button != 0 && !mode ) return cancelBubble( e );
		
		var y = e.clientY ? e.clientY : e.pageYOffset;
		var x = e.clientX ? e.clientX : e.pageXOffset;
		window.mouseDown = FUI_MOUSEDOWN_WINDOW; 
		window.currentMovable = this.parentNode;
		this.parentNode.offx = x - this.parentNode.offsetLeft;
		this.parentNode.offy = y - this.parentNode.offsetTop;
		_ActivateWindow ( this.parentNode );
		
		return cancelBubble( e );
	}
	
	// Pawel must win!
	title.ondblclick = function( e )
	{
		_WindowToFront( this.parentNode );
	}
	
	// Clicking on window
	div.onmousedown = function ( e )
	{
		_ActivateWindow ( this );
	}
	
	// Depth gadget
	var depth = document.createElement ( 'div' );
	depth.className = 'Depth';
	depth.onmousedown = function ( e ) { return cancelBubble ( e ); }
	depth.ondragstart = function ( e ) { return cancelBubble ( e ); }
	depth.onselectstart = function ( e ) { return cancelBubble ( e ); }
	depth.window = div;
	depth.onclick = function ( e )
	{ 
		// Calculate lowest and highest z-index
		var low = 99999999;	var high = 0;
		for ( var a in movableWindows )
		{
			var maxm = movableWindows[a].getAttribute( 'maximized' );
			if( maxm && maxm.length )
				continue;
			var ind = parseInt ( movableWindows[a].style.zIndex );
			if ( ind < low ) low = ind;
			if ( ind > high ) high = ind;
		}
		movableHighestZindex = high;
		
		// If we are below, get us on top
		if ( movableHighestZindex > parseInt( this.window.style.zIndex ) )
		{
			this.window.style.zIndex = ++movableHighestZindex; 
		}
		// If not, don't
		else
		{
			this.window.style.zIndex = 100;
			var highest = 0;
			for ( var a in movableWindows )
			{
				if ( movableWindows[a] != this.window )
				{
					movableWindows[a].style.zIndex = parseInt ( movableWindows[a].style.zIndex ) + 1;
					if ( parseInt ( movableWindows[a].style.zIndex ) > highest )
						highest = parseInt ( movableWindows[a].style.zIndex );
				}
			}
			movableHighestZindex = highest;
		}
		_ActivateWindow ( this.window );
		
		// Fix it!
		UpdateWindowContentSize( div );
		
		return cancelBubble ( e );
	}
	
	// Bottom of the window
	var bottombar = document.createElement ( 'div' );
	bottombar.className = 'BottomBar';
	
	// Left border of window
	var leftbar = document.createElement ( 'div' );
	leftbar.className = 'LeftBar';
	
	// Left border of window
	var rightbar = document.createElement ( 'div' );
	rightbar.className = 'RightBar';
	
	// Zoom gadget
	var zoom = document.createElement ( 'div' );
	zoom.className = 'Zoom';
	zoom.onmousedown = function ( e ) { return cancelBubble ( e ); }
	zoom.ondragstart = function ( e ) { return cancelBubble ( e ); }
	zoom.onselectstart = function ( e ) { return cancelBubble ( e ); }
	zoom.mode = 'normal';
	zoom.window = div;
	zoom.onclick = function ( e )
	{ 
		if ( this.mode == 'normal' )
		{
			if( movableHighestZindex > parseInt( this.window.style.zIndex ) )
				this.window.style.zIndex = ++movableHighestZindex;
			
			_ActivateWindow( this.window );
			
			if( window.isMobile )
			{
				this.window.setAttribute( 'maximized', 'true' );
			}
			else
			{
				var titleh = (GetTitleBar()?GetTitleBar().offsetHeight:0);
				this.prevLeft = parseInt ( this.window.style.left );
				this.prevTop = parseInt ( this.window.style.top );
				this.prevWidth = this.window.offsetWidth;
				this.prevHeight = this.window.offsetHeight;
				this.window.style.top = titleh + 'px';
				this.window.style.left = '0px';
				var wid = 0; var hei = 0;
				if( ge( 'DoorsScreen' ) )
				{
					var sbar = GetStatusbarHeight();
					wid = ge( 'DoorsScreen' ).offsetWidth;
					hei = ge( 'DoorsScreen' ).offsetHeight - titleh - sbar;
				}
				ResizeWindow( this.window, wid, hei );
			}
			this.mode = 'maximized';
		}
		else
		{
			this.mode = 'normal';
			if( window.isMobile )
			{
				this.window.setAttribute( 'maximized', '' );
			}
			else
			{
					this.window.style.top = this.prevTop + 'px';
					this.window.style.left = this.prevLeft + 'px';
					ResizeWindow( this.window, this.prevWidth, this.prevHeight );
			}
		}
		// Do resize events
		if ( this.window.content && this.window.content.events )
		{
			if ( typeof(this.window.content.events['resize']) != 'undefined' )
			{
				for ( var a = 0; a < this.window.content.events['resize'].length; a++ )
				{
					this.window.content.events['resize'][a]();
				}
			}
		}
		return cancelBubble ( e );
	}
	
	resize.onclick = function ( e ) { return cancelBubble ( e ); }
	resize.ondragstart = function ( e ) { return cancelBubble ( e ); }
	resize.onselectstart = function ( e ) { return cancelBubble ( e ); }
	resize.window = div;
	resize.onmousedown = function ( e )
	{
		this.offx = windowMouseX - this.offsetLeft;
		this.offy = windowMouseY - this.offsetTop;
		window.mouseDown = FUI_MOUSEDOWN_RESIZE;
		window.currentMovable = this.parentNode;
		_ActivateWindow ( this.parentNode );
		this.window.zoom.mode = 'normal';
		return cancelBubble ( e );
	}
	
	// remember position
	div.memorize = function ()
	{	
		var wenable = this.content && this.content.flags && this.content.flags.resize ? true : false;
		
		// True if we're to enable memory
		if ( this.content.flags && this.content.flags.memorize )
			wenable = true;
	
		var dat = ObjectToString ( { 
			'top' : this.offsetTop,
			'left' : this.offsetLeft,
			'width' : wenable ? this.content.offsetWidth : false,
			'height' : wenable ? this.content.offsetHeight : false
		} );
		
		SetWindowStorage( this.uniqueId, dat );
	}
	
	var minimize = document.createElement ( 'div' );
	minimize.className = 'Minimize';
	minimize.onmousedown = function ( e ) { return cancelBubble ( e ); }
	minimize.ondragstart = function ( e ) { return cancelBubble ( e ); }
	minimize.onselectstart = function ( e ) { return cancelBubble ( e ); }
	minimize.onclick = function ( e )
	{
		if ( div.windowObject && ge( 'Taskbar' ) )
		{
			var t = ge( 'Taskbar' );
			for( var tel = 0; tel < t.childNodes.length; tel++ )
			{
				if( t.childNodes[tel].window == div )
				{
					t.childNodes[tel].onmouseup( e, t.childNodes[tel] );
				}
			}
		}
	}
	
	var close = document.createElement ( 'div' );
	close.className = 'Close';
	close.onmousedown = function ( e ) { return cancelBubble ( e ); }
	close.ondragstart = function ( e ) { return cancelBubble ( e ); }
	close.onselectstart = function ( e ) { return cancelBubble ( e ); }
	close.onclick = function ()
	{
		if ( div.windowObject )
		{
			var wo = div.windowObject;
			for ( var a = 0; a < wo.childWindows.length; a++ )
			{
				if ( wo.childWindows[a]._window )
				{
					if( wo.childWindows[a]._window.windowObject )
					{
						wo.childWindows[a]._window.windowObject.close();
					}
					else CloseView ( wo.childWindows[a]._window );
				}
				else 
				{
					CloseView( wo.childWindows[a] );
				}
			}
			wo.close();
		}
	}
	

	// Add all
	inDiv.appendChild( depth );
	inDiv.appendChild( minimize );
	inDiv.appendChild( zoom );
	inDiv.appendChild( close );
	inDiv.appendChild( titleSpan );

	div.depth     = depth;
	div.zoom      = zoom;
	div.close     = close;
	div.titleBar  = title;
	div.resize    = resize;
	div.bottombar = bottombar;
	div.leftbar   = leftbar;
	div.rightbar  = rightbar;

	div.appendChild ( title );
	div.titleDiv = title;
	div.appendChild ( resize );
	div.appendChild ( bottombar );
	div.appendChild ( leftbar );
	div.appendChild ( rightbar );
	
	// Empty the window menu
	contn.menu = false;
	
	// Null out blocker window (if we have one)
	contn.blocker = false;
	
	div.refreshWindow = function ()
	{
		// Check scrolling
		var divs = this.content.getElementsByTagName ( 'div' );
		var contH = this.content.offsetHeight;
		var mh = contH;
		// Scrolling vertical
		var scroller = false;
		for ( var a = 0; a < divs.length; a++ )
		{
			if ( divs[a].className == 'Scroller' )
			{
				scroller = divs[a];
				break;
			}
		}
	}
	
	div.appendChild( contn );
	div.appendChild( molay );
	
	div.content = contn;
	
	// FUI_WINDOW_MARGIN is the bottom border
	
	div.style.height = height + title.offsetHeight + FUI_WINDOW_MARGIN + 'px';

	var ww = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	var hh = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	
	window.currentMovable = div;
	
	movableWindowCount++;
	
	_ActivateWindow( div );
	
	div.content.events = new Array ();
	div.content.AddEvent = function ( event, func )
	{
		if ( typeof(this.events[event]) == 'undefined' )
			this.events[event] = new Array ();
		this.events[event].push ( func );
	}
	
	// Assign the move layer
	div.moveoverlay = molay;
	
	// Also content must have it
	div.uniqueId = uniqueId;
	div.windowId = div.id;
	div.content.windowId = div.id;
	div.content.uniqueId = uniqueId;
	
	var wp = GetWindowStorage( div.uniqueId );
	if ( wp )
	{
		if( window.isMobile )
		{
			var d = StringToObject( wp );
			if ( d )
			{
				if ( div.content.flags && div.content.flags.memorize )
				{
					height = d.height;
					width = d.width;
					ResizeWindow( div, width, height );
				}
			}
		}
		else
		{
			var d = StringToObject( wp );
			if ( d )
			{
				if( d.top < hh ) div.style.top = d.top + 'px';
				if( d.left < ww ) div.style.left = d.left + 'px';
				
				//unique id should be more then just the title+++??? TODO!
				//console.log('we place us here...', d.top, d.left, div.uniqueId);
				
				if ( div.content.flags && div.content.flags.memorize )
				{
					height = d.height;
					width = d.width;
					ResizeWindow( div, width, height );
				}
			}
		}
	}
	
	// Triggers
	if( parentWindow )
	{
		parentWindow.addChildWindow( div );
	}
	
	// Do a simple refresh and end func
	div.refreshWindow();
	
	// Add the window after all considerations
	divParent.appendChild( div );
	
	// First to generate, second to test
	PollTaskbar();
	PollTaskbar( div );
	
	// First resize
	ResizeWindow( div, width, height );
	RefreshWindow( div, true );
	
	if( window.isMobile )
	{
		
		var winTouchStart = [0,0];
		var winTouchEnd = [0,0];
		var winTouchDowned;
		var winTouchTarget;
		
		//resize touch ecvents.... --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## 
		resize.addEventListener('touchstart', function(evt) {
			cancelBubble( evt );
			
			winTouchStart = [ evt.touches[0].clientX, evt.touches[0].clientY ]; 
			winTouchDowned = evt.timeStamp;

			

		});
		resize.addEventListener('touchmove', function(evt) {
			cancelBubble( evt );
						
			if( evt.target && evt.target.offsetParent ) evt.target.offH = evt.target.offsetParent.clientHeight;
			touchResizeWindow(evt);
			
		});
		resize.addEventListener('touchend', function(evt) { 
			cancelBubble( evt );
		});
		
		bottombar.addEventListener('touchstart', function(evt) {
			cancelBubble( evt );
			
			winTouchStart = [ evt.touches[0].clientX, evt.touches[0].clientY ]; 
			winTouchDowned = evt.timeStamp;
			

		});
		bottombar.addEventListener('touchmove', function(evt) {
			cancelBubble( evt );
			
			if( evt.target && evt.target.offsetParent ) evt.target.offH = evt.target.offsetParent.clientHeight;
			touchResizeWindow(evt);
			
		});
		bottombar.addEventListener('touchend', function(evt) { 
			cancelBubble( evt );
		});		
		
		
		//close  --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## 
		close.addEventListener('touchstart', function(evt) {
			cancelBubble( evt );
			winTouchStart = [ evt.touches[0].clientX, evt.touches[0].clientY, (evt.target.hasAttribute('class') ? evt.target.getAttribute('class') : '') ]; 
			winTouchEnd = winTouchStart;
			winTouchDowned = evt.timeStamp;
		});		

		close.addEventListener('touchend', function(evt) { 
			cancelBubble( evt );
			
			evt.target.onclick();
		});
		//title swipe to minimize --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## 
		title.addEventListener('touchstart', function(evt) {
			if( this.popup ) return;
			
			
			if( !evt.target.classList.contains('Zoom') ) { console.log('not zoom hit'); cancelBubble( evt ); }
						
			winTouchStart = [ evt.touches[0].clientX, evt.touches[0].clientY, (evt.target.hasAttribute('class') ? evt.target.getAttribute('class') : '') ]; 
			winTouchEnd = winTouchStart;
			winTouchDowned = evt.timeStamp;

		});
		title.addEventListener('touchmove', function(evt) {
			if( this.popup ) return;
			cancelBubble( evt );
			//if( evt.target && evt.target.offsetParent ) evt.target.offH = evt.target.offsetParent.clientHeight;
			//touchResizeWindow(evt);
			winTouchEnd = [ evt.touches[0].clientX, evt.touches[0].clientY ];
			
			var found = false;
			var tmp = evt.target;
			var counter = 10;


			while(found == false)
			{
				
				if( tmp.className.indexOf('Title') > -1 ) // && tmp.parentNode.className.indexOf('View') > -1
				{
					found = true;
				}
				tmp = tmp.parentNode;
				counter--;
				if( counter < 0 ) found = true;
			}
			tmp.style.transition = 'transform 0.25s';
			tmp.style.transform = 'rotate('+ Math.max(0,Math.min( 2, ( (winTouchEnd[1] - winTouchStart[1])  / 50 ) ) ) +'deg)';			
			
		});
		title.addEventListener('touchend', function(evt) { 
			if( this.popup ) return;
			
			
			if( !evt.target.classList.contains('Zoom') ) { console.log('not zoom hit'); cancelBubble( evt ); }
			
			if( evt.touches[0] ) winTouchEnd = [ evt.touches[0].clientX, evt.touches[0].clientY ]; 

			var found = false;
			var tmp = evt.target;
			var counter = 10;


			while(found == false)
			{
				
				if( tmp.className.indexOf('Title') > -1 ) // && tmp.parentNode.className.indexOf('View') > -1
				{
					found = true;
				}
				tmp = tmp.parentNode;
				counter--;
				if( counter < 0 ) found = true;
			}
			tmp.style.transform = 'rotate(0deg)';
			
			//swiped down.....
			if( evt.timeStamp - winTouchDowned > 100 && evt.timeStamp - winTouchDowned < 1000 && Math.round( winTouchEnd[1] - winTouchStart[1] ) > 100 && Math.abs( winTouchEnd[0] - winTouchStart[0] ) < Math.abs( winTouchEnd[1] - winTouchStart[1] ) )
			{
				cancelBubble( evt );

				
				var tb = ge( 'Taskbar' );
				for( var tel = 0; tel < tb.childNodes.length; tel++ )
				{
					if( tb.childNodes[tel].window == tmp )
					{
						tb.childNodes[tel].onmouseup( evt, tb.childNodes[tel] );
					}
				}	
			}
			else
			{
				while(found == false)
				{
					if( tmp.className.indexOf('Title') > -1 ) // && tmp.parentNode.className.indexOf('View') > -1
					{
						found = true;
					}
					tmp = tmp.parentNode;
					counter--;
					if( counter < 0 ) found = true;
				}

				//just focus on us...
				_ActivateWindow ( tmp );
				
			}
			
		});			
	}
	// Ok, center
	else if( !wp )
	{
		div.style.left = Math.floor ( ww * 0.5 ) - Math.floor ( div.offsetWidth * 0.5 ) + 'px';
		div.style.top = Math.floor ( hh * 0.5 ) - Math.floor ( div.offsetHeight * 0.5 ) + 'px';
	}

	/* function shal be called by bottombar or resize... */	
	function touchResizeWindow(evt)
	{
		if( !evt.target.offH ) evt.target.offH = evt.target.offsetParent.clientHeight;
		//not too small and not too high...
		var newHeight = Math.min( 
			Workspace.screenDiv.clientHeight - 
				72 - evt.target.offsetParent.offsetTop, 
			Math.max(80,evt.touches[0].clientY - evt.target.offsetParent.offsetTop ) 
		);
		
		evt.target.offsetParent.style.height = newHeight + 'px';
		evt.target.offsetParent.lastHeight = newHeight;
	}
	
	// Make sure it's correctly sized again (after added)
	ConstrainWindow( div );

	// Remove window borders
	if( typeof( flags.borderless ) != 'undefined' && flags.borderless == true )
	{
		title.style.position = 'absolute';
		title.style.height = '0px';
		title.style.overflow = 'hidden';
		resize.style.height = '0px';
		resize.style.overflow = 'hidden';
		div.leftbar.style.display = 'none';
		div.rightbar.style.display = 'none';
		div.bottombar.style.display = 'none';
		div.content.style.left = '0';
		div.content.style.right = '0';
		div.content.style.top = '0';
		div.content.style.right = '0';
	}

	// Make it to front
	_WindowToFront( div );

	return div.content;
}

// "Macro" for making a new movable window quickly
function NewWindow( titleStr, width, height, id )
{
	if ( typeof( titleStr ) == 'object' )
	{
		return MakeWindow( 'CREATE', false, false, false, titleStr.id ? titleStr.id : false, titleStr );
	}
	return MakeWindow( 'CREATE', titleStr, width, height, id );
}

function NewWindowFlags( flags, applicationId )
{
	var id = typeof ( flags.id ) != 'undefined' ? flags.id : false;
	return MakeWindow ( 'CREATE', false, false, false, id, flags, applicationId );
}

// Sets a window loading animation on content
function WindowLoadingAnimation( w )
{
	if( w.content ) 
		w = w.content;
	w.innerHTML = '<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" class="LoadingAnimation"></div>';
}

// Gets a variable on a movable window by event (target element is used, f.x. clicking a button)
function GetWindowVariableByEvent( e, vari )
{
	if( !e ) return;
	try
	{
		var t = e.srcElement ? e.srcElement : e.target;
		while( t.className.indexOf( 'View' ) < 0 && t != document.body )
		{
			t = t.parentNode;
		}
		if( t.className.indexOf ( 'View' ) < 0 )
			return;
		var divs = document.getElementsByTagName ( 'div' );
		var cnt = false;
		for( var a = 0; a < divs.length; a++ )
		{
			if ( divs[a].className == 'Content' )
			{
				cnt = divs[a];
				break;
			}
		}
		if( !cnt ) 
			return;
		if( cnt[vari] )
			return cnt[vari];
	}
	catch( e ){}
	return false;
}

// Gets a variable on a movable window
function GetWindowVariable( win, vari )
{
	var t = win;
	while( t.className.indexOf ( 'View' ) < 0 && t != document.body )
	{
		t = t.parentNode;
	}
	if( t.className.indexOf ( 'View' ) < 0 )
		return;
	var divs = document.getElementsByTagName ( 'div' );
	var cnt = false;
	for( var a = 0; a < divs.length; a++ )
	{
		if( divs[a].className == 'Content' )
		{
			cnt = divs[a];
			break;
		}
	}
	if( !cnt )      return;
	if( cnt[vari] ) return cnt[vari];
	return false;
}

function HasClassname( div, classname )
{
	var classes = div.className ? div.className.split( ' ' ) : [];
	for( var a in classes )
	{
		if( classes[a] == classname )
		{
			return true;
		}
	}
	return false;
}

// Close a movable window by pointing to the content div
// Could one day be moved to the View class...
function CloseView( win )
{
	if( !win && window.currentMovable )
		win = window.currentMovable;
	if( win )
	{
		var count = 0;
		
		
		while( !HasClassname( win, 'View' ) && win != document.body )
		{
			win = win.parentNode;
		}
		
		var div = win;
		
		var appId = win.windowObject ? win.windowObject.applicationId : false;	
			
		// Clear reference
		if ( window.regionWindow == div.content )
			window.regionWindow = false;
	
		if ( div.parentNode )
			div.parentNode.removeChild( div );
		
		if ( div )
		{
			// Clean up ids
			var o = [];
			var activated = false;
			for ( var b in movableWindows )
			{
				if ( movableWindows[b] != div )
				{
					o[b] = movableWindows[b];
					
					// Activate next window on app
					// TODO: Use parent window if it's registered
					if( !activated )
					{
						if( o[b].windowObject && o[b].windowObject.applicationId == appId )
						{
							o[b].windowObject.activate();
							activated = true;
						}
					}
				}
			}
			movableWindows = o;
		}
		movableWindowCount--;
		if( movableWindowCount <= 0 )
		{
			movableWindowCount = 0;
			movableHighestZindex = 99;
		}
		// Check events
		if( div.content && div.content.events )
		{
			if( typeof( div.content.events['close'] ) != 'undefined' )
			{
				for( var a = 0; a < div.content.events['close'].length; a++ )
				{
					div.content.events['close'][a]();
				}
			}
		}
		PollTaskbar();
		
		// Remove link to current movable
		if( win == window.currentMovable ) window.currentMovable = false;
	}
	
	// Check window
	CheckScreenTitle();
}
// Obsolete!!!
CloseWindow = CloseView;

// Prevent scrolling windows with popup windows
// TODO: Detect if the scrolling is done with the mouse hovering over a window
function CancelWindowScrolling ( e )
{
	if ( !e ) e = window.event;
	var t = e.target ? e.target : e.srcElement;
	if ( window.currentMovable && window.currentMovable.offsetHeight )
		window.scrollTo ( 0, window.lastScrollPosition ? window.lastScrollPosition : 0 );
	else window.lastScrollPosition = document.body.scrollTop;
	return true;
}
if ( window.addEventListener )
	window.addEventListener ( 'scroll', CancelWindowScrolling, true );
else window.attachEvent ( 'onscroll', CancelWindowScrolling, true );

// Support scrolling in windows
function WindowScrolling ( e )
{
	if ( !e ) e = window.event;
	var dlt = e.detail ? (e.detail*-120) : e.wheelDelta;
	var tr = e.srcElement ? e.srcElement : e.target;
	var win = false;
	while ( tr != document.body )
	{
		if ( tr.className && tr.className.indexOf ( 'View' ) > 0 )
		{
			win = tr;
			break;
		}
		tr = tr.parentNode;
	}
}

// The View class begins -------------------------------------------------------

// View class (the javascript way)
// TODO: Clean up legacy code functions to use View()
// TODO: Fix opening windows with no preset id (right now, window does not appear)
// TODO: Fix opening windows with id, to close and kill its application if already running app with unique id
var View = function ( args )
{
	var self = this;
	self.windowId = args.windowId;
	self.applicationId = args.applicationId;
	self.authId = args.authId;
	self.applicationName = args.applicationName;
	self._window = NewWindowFlags ( args, args.applicationId );
	if( !self._window.parentNode ) return false;
	self._window.parentNode.windowObject = this;
	self.popupViews = [];
	
	if( !this._window )
	{
		this.ready = false;
		return;
	}
	else this.ready = true;
	
	this.isRich = false;
	this.childWindows = [];
	
	// Clean data
	this.cleanHTMLData = function( data )
	{
		data = data.split( /\<script[^>]*?\>[\w\W]*?\<\/script[^>]*?\>/i ).join ( '' );
		data = data.split( /\<style[^>]*?\>[\w\W]*?\<\/style[^>]*?\>/i ).join ( '' );
		return data;
	}
	
	// Set content on window
	this.setContent = function( content )
	{
		// Safe content without any scripts or styles!
		SetWindowContent( this._window, this.cleanHTMLData( content ) );
	}
	// Set content (securely!) in a sandbox, callback when completed
	this.setContentIframed = function( content, domain, packet, callback )
	{
		if( !domain )
		{
			// TODO: Figure out the correct url (not utilities - that's hard coded )
			// domain = document.location.href.split( 'http://' ).join ( 'http://utilities.' ); // reenable
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
		var r;
		if( content )
		{
			while( r = content.match( /\<script([^>]*?)\>([\w\W]*?)\<\/script\>/i ) )
				content = content.split( r[0] ).join( '<friendscript' + r[1] + '>' + r[2] + '</friendscript>' );
		}
		else
		{
			content = '';
		}
			
		var c = this._window;
		if( c.content ) c = c.content;
		c.innerHTML = '';
		var ifr = document.createElement( 'iframe' );
		ifr.applicationId = self.applicationId;
		ifr.authId = self.authId;
		ifr.applicationName = self.applicationName;
		ifr.className = 'Content';
		ifr.src = domain;
		
		this.iframe = ifr;
		
		if( packet.applicationId ) this._window.applicationId = packet.applicationId;
		
		ifr.onload = function()
		{
			var msg = {}; if( packet ) for( var a in packet ) msg[a] = packet[a];
			msg.command = 'setbodycontent';
			msg.registerCallback = addWrapperCallback( function() { if( callback ) callback(); } );
			if( packet.filePath )
				msg.data = content.split( /progdir\:/i ).join( packet.filePath );
			else msg.data = content;
			msg.data = msg.data.split( /system\:/i ).join( '/webclient/' );
			if( !msg.origin ) msg.origin = document.location.href;
			ifr.contentWindow.postMessage( JSON.stringify( msg ), Workspace.protocol + '://' + ifr.src.split( '//' )[1].split( '/' )[0] );
			// Remove window popup menus when clicking on the app
			if( ifr.contentWindow.addEventListener )
				ifr.contentWindow.addEventListener( 'mousedown', function(){ removeWindowPopupMenus(); }, false );
			else ifr.contentWindow.attachEvent( 'onmousedown', function(){ removeWindowPopupMenus(); }, false );
		}
		c.appendChild( ifr );
	}
	// set sandboxed content - to be used with apps/app.js and apps/view.js
	// not tested with apps/api.js
	this.setSandboxedContent = function( conf )
	{
		// soonTM
		console.log( 'View.setSandboxedContent - NYI', conf );
	}
	// set sandboxed url - to be used with apps/app.js and apps/view.js
	// not tested with apps/api.js ( read: it wont work )
	this.setSandboxedUrl = function( conf )
	{
		var self = this;
		var appName = self.applicationName;
		var origin = Doors.runLevels[ 0 ].domain;
		var domain = Doors.runLevels[ 1 ].domain;
		domain = domain.split( '://' )[1];
		var appBase = '/webclient/apps/' + appName + '/';
		var protocol = Workspace.protocol + '://';
		var filePath =  protocol + domain + appBase + conf.filePath;
		var container = self._window.content || self._window;
		var iframe = document.createElement( 'iframe' );
		iframe.applicationId = self.applicationId;
		iframe.authId = self.authId;
		iframe.applicationName = self.applicationName;
		iframe.sandbox = "allow-forms allow-scripts allow-same-origin allow-popups"; // allow same origin is probably not a good idea, but a bunch other stuff breaks, so for now..
		
		self._window.applicationId = conf.applicationId; // needed for View.close to work
		self._window.authId = conf.authId;
		self.iframe = iframe;
		container.innerHTML = '';
		container.appendChild( iframe );
		
		var src = filePath
			+ '?base=' + appBase
			+ '&id=' + self.windowId
			+ '&applicationId=' + self.applicationId
			+ '&origin=' + origin
			+ '&domain=' + domain
			+ '&theme=' + Doors.theme;
		iframe.src = src;
	}
	// Sets content on a safe window (using postmessage), callback when completed
	this.setContentById = function( content, packet, callback )
	{
		if( this.iframe )
		{
			var msg = {}; if( packet ) for( var a in packet ) msg[a] = packet[a];
			msg.command = 'setcontentbyid';
			this.iframe.contentWindow.postMessage( JSON.stringify( msg ), Workspace.protocol + '://' + this.iframe.src.split( '//' )[1].split( '/' )[0] );
		}
		if( callback ) callback();
	}
	// Sets rich content in a safe iframe
	this.setRichContent = function( content )
	{
		// Rich content still can't have any scripts!
		content = content.split( /\<script[^>]*?\>[\w\W]*?\<\/script[^>]*?\>/i ).join ( '' );
		
		var eles = this._window.getElementsByTagName( 'iframe' );
		var ifr = false;
		if( eles[0] )
			ifr = eles[0];
		else
		{
			ifr = document.createElement( 'iframe' );
			this._window.appendChild( ifr );
		}
		ifr.applicationId = self.applicationId;
		ifr.applicationName = self.applicationName;
		ifr.authId = self.authId;
		ifr.contentWindow.document.body.innerHTML = content;
		this.isRich = true;
		this.iframe = ifr;
	}
	// Sets rich content in a safe iframe
	this.setJSXContent = function( content, appName )
	{
		var w = this;
		
		var eles = this._window.getElementsByTagName( 'iframe' );
		var ifr = false;
		var appended = false;
		
		if( eles[0] )
			ifr = eles[0];
		else
		{
			ifr = document.createElement( 'iframe' );
			appended = true;
		}
		
		// Load the sandbox
		if( this.conf )
		{
			ifr.src = '/system.library/module/?module=system&command=sandbox' +
				'&sessionid=' + Workspace.sessionId +
				'&conf=' + JSON.stringify( this.conf );
		}
		// Just give a dumb sandbox
		else ifr.src = 'sandboxed.html';
		
		// Register name and ID
		ifr.applicationName = appName;
		ifr.applicationId = appName + '-' + (new Date()).getTime();
		Doors.applications.push( ifr );
		
		// Add a loaded script
		ifr.onload = function()
		{
			// Get document
			var doc = ifr.contentWindow.document;
			
			var jsx = doc.createElement( 'script' );
			jsx.innerHTML = content;
			ifr.contentWindow.document.getElementsByTagName( 'head' )[0].appendChild( jsx );
			
			var msg = JSON.stringify( { 
				command:       'initappframe', 
				base:          '/',
				applicationId: ifr.applicationId,
				filePath:      '/webclient/jsx/',
				origin:        document.location.href,
				windowId:      w.externWindowId ? w.externWindowId : w.windowId
			} );
			ifr.contentWindow.postMessage( msg, Workspace.protocol + '://' + ifr.src.split( '//' )[1].split( '/' )[0] );
		}
	
		// Register some values
		this.isRich = true;
		this.iframe = ifr;
		
		// If we need to append this one
		if( appended ) this._window.appendChild( ifr );
	}
	// Sets rich content in a safe iframe
	this.setRichContentUrl = function( url, base, appId, filePath, callback )
	{
		if( !base ) 
			base = '/';
		
		var eles = this._window.getElementsByTagName( 'iframe' );
		var ifr = false;
		var w = this;
		if( eles[0] )
		{
			ifr = eles[0];
		}
		else
		{
			ifr = document.createElement( 'iframe' );
			this._window.appendChild( ifr );
		}
		
		// Register the app id so we can talk
		this._window.applicationId = appId;
		
		ifr.applicationId = self.applicationId;
		ifr.applicationName = self.applicationName;
		ifr.authId = self.authId;
		ifr.setAttribute( 'scrolling', 'no' );
		ifr.setAttribute( 'seamless', 'true' );
		ifr.style.border = '0';
		ifr.style.position = 'absolute';
		ifr.style.top = '0'; ifr.style.left = '0';
		ifr.style.width = '100%'; ifr.style.height = '100%';
		
		
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
					windowId:      w.externWindowId
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
	// Send a message
	this.sendMessage = function( dataObject, event )
	{
		if( !event ) event = window.event;
		
		if( this.iframe && this.iframe.loaded && this.iframe.contentWindow )
		{
			var u = Workspace.protocol + '://' + this.iframe.src.split( '//' )[1].split( '/' )[0];
			var origin = event && event.origin && event.origin != 'null' ? event.origin : u;
			if( !dataObject.applicationId && this.iframe.applicationId )
			{
				dataObject.applicationId = this.iframe.applicationId;
				dataObject.authId = this.iframe.authId;
				dataObject.applicationName = this.iframe.applicationName;
			}
			if( !dataObject.type ) dataObject.type = 'system';
			this.iframe.contentWindow.postMessage( JSON.stringify( dataObject ), origin );
		}
		else
		{
			if( !this.sendQueue )
				this.sendQueue = [];
			this.sendQueue.push( dataObject );
		}
	}
	// Send messages to window that hasn't been sent because iframe was not loaded
	this.executeSendQueue = function()
	{
		if( this.executingSendQueue || !this.iframe ) return;
		this.executingSendQueue = true;
		for( var a = 0; a < this.sendQueue.length; a++ ) 
		{
			var msg = this.sendQueue[ a ];
			this.sendMessage( msg );
		}
		this.sendQueue = [];
		this.executingSendQueue = false;
	}
	// Get content element
	this.getContentElement = function()
	{
		if( this.isRich && this.iframe )
		{
			return this.iframe.contentWindow.document.body;
		}
		else return this._window;
		return false;
	}
	// Focus on an able element
	this.focusOnElement = function( identifier, flag )
	{
		var ele = this.getSubContent( identifier, flag );
		if( ele && ele.focus ) ele.focus();
	}
	// Get some subcontent (.class or #id)
	this.getContentById = function( identifier, flag )
	{
		var node = this.getContentElement();
		if( !node ) return false;
		var ele = node.getElementsByTagName( '*' );
		var cnt = false;
		var idn = identifier.substr( 0, 1 );
		var key = identifier.substr( 1, identifier.length - 1 );
		var results = [];
		if( idn == '.' )
		{
			for( var a = 0; a < ele.length; a++ )
			{
				if( ele[a].className && ele[a].className == key )
				{
					results.push( ele[a] );
				}
			}
		}
		else
		{
			var fn = key;
			if( idn != '#' ) fn = identifier;
			for( var a = 0; a < ele.length; a++ )
			{
				if( ele[a].id == idn )
				{
					results.push( ele[a] );
				}
			}
		}
		if( !results.length)
			return false;
		if( flag == 'last-child' )
			return results[results.length-1];
		return results[0];
	}
	// Set content on sub element
	// TODO: Deprecated! Remove completely!
	this.setSubContent = function( identifier, flag, content )
	{
		var cnt = this.getSubContent( identifier, flag );
		if( !cnt ) return;
		// Safe content without any scripts or styles!
		cnt.innerHTML = this.cleanHTMLData( content );
	}
	// Sets a property value
	this.setAttributeById = function( packet )
	{
		if( this.iframe )
		{
			var msg = {}; if( packet ) for( var a in packet ) msg[a] = packet[a];
			msg.command = 'setattributebyid';
			this.iframe.contentWindow.postMessage( JSON.stringify( msg ), Workspace.protocol + '://' + this.iframe.src.split( '//' )[1].split( '/' )[0] );
		}
	}
	// Activate window
	this.activate = function ()
	{
		_ActivateWindow( this._window.parentNode );
	}
	this.close = function ( force )
	{
		var c = this._window;
		if( c.content )
			c = c.content;
		
		// Close all PopupViews
		for( var a = 0; a < this.popupViews.length; a++ )
			this.popupViews[a].close();
		
		// Close blockers
		if( this._window.blocker )
		{
			this._window.blocker.close();
		}
		
		if( !force && this._window.applicationId && c.getElementsByTagName( 'iframe' ).length )
		{		
			var app = findApplication( this._window.applicationId );
			
			var twindow = this;
			
			// Notify application
			var msg = {
				type: 'system',
				command: 'notify',
				method: 'closeview',
				applicationId: this._window.applicationId,
				windowId : self.windowId
			};
			// Post directly to the app
			if( app )
			{
				app.contentWindow.postMessage( JSON.stringify( msg ), '*' );
			}
			// Post directly to the window
			else
			{
				this.sendMessage( msg );
			}
			// Execute any ambient onClose method
			if( this.onClose ) this.onClose();
			return;
		}
		CloseView ( this._window );
		if( this.onClose ) this.onClose();
	}
	// Put a loading animation on window
	this.loadingAnimation = function ()
	{
		WindowLoadingAnimation ( this._window );
	}
	// Set a window flag
	this.setFlag = function ( flag, value )
	{
		SetWindowFlag ( this._window, flag, value );
	}
	this.getFlag = function( flag )
	{
		if( typeof( this._window.flags[flag] ) != 'undefined' )
		{
			return this._window.flags[flag];
		}
	}
	// Add a child window to this window
	this.addChildWindow = function ( ele )
	{
		if ( ele.tagName && ele.windowObject )
			return this.childWindows.push ( ele.windowObject );
		else if ( ele._window ) return this.childWindows.push ( ele );
		else if ( ele.content ) return this.childWindows.push ( ele );
		return false;
	}
	// Get elements by tabname
	this.getElementsByTagName = function ( tn )
	{
		return this._window.getElementsByTagName ( tn );
	}
	// Get elements by class
	this.getByClass = function ( classn )
	{
		var el = this._window.getElementsByTagName ( '*' );
		var out = [];
		for ( var a = 0; a < el.length; a++ )
		{
			if ( el[a].className )
			{
				var cls = el[a].className.split ( ' ' );
				for ( var b = 0; b < cls.length; b++ )
				{
					if ( cls[b] == classn )
					{
						out.push(el[a]);
						break;
					}
				}
			}
		}
		return out;
	}
	// Init gui tabs
	this.initTabs = function( pel )
	{
		InitTabs ( pel );
	}
	// Get a window by id
	this.getWindowId = function()
	{
		return this._window.windowId;
	}
	// Add events for stuff
	this.addEvent = function( event, func )
	{
		this._window.AddEvent ( event, func );
	}
	// Add an event on a sub element
	this.addEventByClass = function( className, event, func )
	{
		var ele = this.getSubContent( '.' + className );
		if( ele )
		{
			if( ele.addEventListener )
				ele.addEventListener( event, func, false );
			else ele.attachEvent( 'on' + event, func, false );
		}
	}
	// Set menu items on window
	this.setMenuItems = function( obj, appid )
	{
		this._window.menu = obj;
		if( appid && window.isMobile )
		{
			this._window.applicationId = appid;
			this._window.parentNode.className += ' HasPopupMenu';
		}
	}
	this.setBlocker = function ( blockwin )
	{
		this._window.blocker = blockwin;
	}
	// Get the window element (dom element)
	this.getWindowElement = function()
	{
		return this._window;
	}
	
	this.focus = function()
	{
		this._window.focus();
	}
	
	// Handle the keys -- dummy function to be overwritten
	this.handleKeys = function( k, event )
	{
	}
	
	// Adds popup view
	this.addPopupView = function( w )
	{
		if( !this._window.parentNode )
			return false;
			
		if( !this.popupViews )
			this.popupViews = [];
		this.popupViews.push( w );
		this._window.parentNode.appendChild( w.div );
	}
}

// Intermediate anchor for code that uses new Window()
var Window = View;

/* PopupViews --------------------------------------------------------------- */

// Popup view rects (view connected to another parent view)
function PopupView( parentWindow, flags )
{
	if( !parentWindow || !parentWindow._window )
		return;
	
	if( flags && typeof( flags ) == 'object' )
	{
		for( var a in flags )
		{
			switch( a )
			{
				// We support these:
				case 'width':
				case 'height':
				// Relative to parent window
				case 'top':
				case 'left':
				case 'border':
				case 'close':
					this[a] = flags[a];
					break;
				case 'visible':
					this[a] = flags[a] ? true : false;
					break;
				default:
					break;
			}
		}
	}
	
	// Create div and add this object
	var d = document.createElement( 'div' );
	d.className = 'PopupView';
	d.innerHTML = '<div class="BorderTop"></div><div class="BorderLeft"></div><div class="BorderRight"></div><div class="BorderBottom"></div><div class="Content"></div>';
	var cnt = false;
	this.div = d;
	parentWindow.addPopupView( this );
	
	// Create content now
	var eles = d.getElementsByTagName( 'div' );
	for( var a = 0; a < eles.length; a++ )
		if( eles[a].className == 'Content' )
			cnt = eles[a];
	this.content = cnt;
}
// Remove div and free up resources
PopupView.prototype.close = function()
{
	if( this.div && this.div.parentNode )
	{
		this.div.parentNode.removeChild( this.div );
	}
}

/* Support functions -------------------------------------------------------- */

var mousewheelevt = (/Firefox/i.test( navigator.userAgent ) ) ? "DOMMouseScroll" : "mousewheel";
if ( document.attachEvent ) //if IE (and Opera depending on user setting)
    document.attachEvent( "on"+mousewheelevt, function(e){WindowScrolling(e);})
else if ( document.addEventListener ) //WC3 browsers
    document.addEventListener( mousewheelevt,  function(e){WindowScrolling(e);}, false );

// An alert box
// TODO: Block other windows!
function Ac2Alert ( msg, title )
{
	var v = new View( {
		'title'  : !title ? i18n('Alert') : title, 
		'width'  : 400, 
		'height' : 120 
	} );
	v.setContent( '<div class="Box ContentFull">' + msg + '</div>' );
}

var __titlebar = false;
function GetTitleBar ()
{
	if ( typeof ( window.currentScreen ) != 'undefined' )
		return window.currentScreen.getElementsByTagName ( 'div' )[0];
	if ( !__titlebar )
		__titlebar = ge ( 'Modules' ) ? ge ( 'Modules' ) : ( ge ( 'TitleBar' ) ? ge ( 'TitleBar' ) : false );
	return __titlebar;
}

// Handle keys
function _kresponse( e )
{
	if( window.currentMovable )
	{
		var win = window.currentMovable.windowObject;
		if( !win ) return;
		
		win.ctrlKey = false;
		win.shiftKey = false;
		if( e.ctrlKey ) win.ctrlKey = true;
		if( e.shiftKey ) win.shiftKey = true;
		
		if( win.handleKeys )
		{
			var abort = false;
			var k = e.which ? e.which : e.keyCode;
			if( e.ctrlKey )
			{
				switch ( k )
				{
					// q for quit
					case 81:
						abort = true;
						win.close ();
						break;
				}
			}
			if( win.handleKeys( k, e ) )
				return cancelBubble( e );
			if( abort )
				return cancelBubble( e );
		}
		if( e.ctrlKey )
		{
			// Send the message to the window, giving it an opportunity to
			// respond
			var k = e.which ? e.which : e.keyCode;
			win.sendMessage( { command: 'handlekeys', key: k, ctrlKey: true, shiftKey: e.shiftKey } );
			return cancelBubble( e );
		}
	}
}

function _kresponseup( e )
{
	if ( window.currentMovable )
	{
		var win = window.currentMovable.windowObject;
		
		if ( ( e.ctrlKey || e.shiftKey ) && typeof ( win.handkeKeys ) )
		{
			if ( e.preventDefault ) e.preventDefault ();
			return cancelBubble ( e );
		}
	}
}

// Resize all screens
function _kresize( e )
{
	var d = ge( 'Screens' );
	for( var a = 0; a < d.childNodes.length; a++ )
	{
		if( !d.childNodes[a].className || d.childNodes[a].className.indexOf( 'Screen' ) < 0 ) continue;
		var s = d.childNodes[a];
		s.style.width = window.innerWidth + 'px';
		s.style.height = window.innerHeight + 'px';
		s.style.minWidth = window.innerWidth + 'px';
		s.style.minHeight = window.innerHeight + 'px';
		var el = s.getElementsByTagName( 'div' );
		var cnt = false;
		for( var b = 0; b < el.length; b++ )
		{
			if( el[b].className == 'ScreenContent' )
				cnt = el[b];
			if( cnt ) break;
		}
		if( !cnt ) continue;
		// Content follows!
		cnt.style.minHeight = s.style.height;
		cnt.style.maxHeight = s.style.height;
		cnt.style.minWidth = s.style.width;
		cnt.style.maxWidth = s.style.width;
	}
	
	checkMobileBrowser();
}

// Initialize the events
function InitWindowEvents()
{
	if ( window.addEventListener )
	{
		window.addEventListener( 'keydown', _kresponse,   false );
		window.addEventListener( 'keyup',   _kresponseup, false );
		window.addEventListener( 'resize', _kresize,      false );
	}
	else
	{
		window.attachEvent( 'onkeydown', _kresponse,   false );
		window.attachEvent( 'onkeyup',  _kresponseup,  false );
		window.attachEvent( 'onresize', _kresize,      false );
	}
	
	if( document.getElementById( 'DoorsScreen' ) ) window.currentScreen = 'DoorsWorkbench';
}

