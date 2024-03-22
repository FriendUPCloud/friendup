/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/* Make movable box --------------------------------------------------------- */

Friend          = window.Friend || {};    // Friend main namespace
Friend.io       = Friend.io     || {};    // Input/output namespace
Friend.GUI      = Friend.GUI    || {};    // GUI namespace
Friend.GUI.view = {};                     // View window namespace

// Lets remember values
Friend.GUI.responsiveViewPage       = 0;  // Current view page mobile
Friend.GUI.responsiveViewPageCount  = 0;  // View page count mobile
Friend.GUI.view.windowStorage       = [];
Friend.GUI.view.viewHistory         = []; // History of opened views
Friend.GUI.view.windowStorageLoaded = false;
Friend.GUI.view.movableViewIdSeed   = 0;

var _viewType = 'iframe'; //window.friendBook ? 'webview' : 'iframe';

// Get stored data by window id
function GetWindowStorage( id )
{
	if( !id )
	{
		return Friend.GUI.view.windowStorage;
	}
	else
	{
		if( typeof( Friend.GUI.view.windowStorage[ id ] ) != 'undefined' )
			return Friend.GUI.view.windowStorage[ id ];
	}
	return {};
}

// Set window data by id
function SetWindowStorage( id, data )
{
	Friend.GUI.view.windowStorage[ id ] = data;
}

// Get a window by id
function GetWindowById( id )
{
	for( var a in movableWindows )
	{
		if( !movableWindows[ a ].windowObject ) continue;
		if( movableWindows[ a ].windowObject.viewId == id ) return movableWindows[ a ];
	}
	return false;
}

// Save window storage to Friend Core
function SaveWindowStorage( callback )
{
	if( !window.Module ) return callback();
	let m = new Module( 'system' );
	m.execute( 'setsetting', { setting: 'windowstorage', data: JSON.stringify( jsonSafeObject( Friend.GUI.view.windowStorage ) ) } );
	if( callback )
	{
		setTimeout( function()
		{
			callback();
		}, 500 );
	}
}

// Load window storage from Friend Core
function LoadWindowStorage()
{
	if( !Friend.GUI.view.windowStorageLoaded )
	{
		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				try
				{
					let dob = JSON.parse( d );
					Friend.GUI.view.windowStorage = dob.windowstorage ? dob.windowstorage : [];
					if( typeof( Friend.GUI.view.windowStorage ) != 'object' )
						Friend.GUI.view.windowStorage = [];
					else
					{
						for( var a in Friend.GUI.view.windowStorage )
						{
							if( typeof( Friend.GUI.view.windowStorage[a] ) == 'string' )
							{
								Friend.GUI.view.windowStorage[a] = {};
							}
						}
					}
				}
				catch( e )
				{
				}
			}
		}
		m.execute( 'getsetting', { setting: 'windowstorage' } );
		Friend.GUI.view.windowStorageLoaded = true;
	}
}

// Find a movable window by title string
function FindWindow( titleStr )
{
	let divs = document.getElementsByTagName ( 'div' );
	for( var a = 0; a < divs.length; a++ )
	{
		if( divs[a].className.indexOf( ' View' ) >= 0 )
		{
			if( divs[a].childNodes.length && divs[a].childNodes[0].childNodes[0].childNodes[0].innerHTML == titleStr )
			{
				let divz = divs[a].getElementsByTagName( 'div' );
				let cnt = divs[a];
				for( var za = 0; za < divz.length; za++ )
				{
					if( divz[za].className == 'Content' )
					{
						cnt = divz[za];
						break;
					}
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
	if( isMobile ) return;
	
	let wp = GetWindowStorage( div.uniqueId );
	if ( wp )
	{
		return wp;
	}
	return false;
}


// Sets innerhtml no a window content and runs any javascript
function SetWindowContent( win, data )
{
	if( !win ) return;
	if( win.opener )
	{
		win.document.body.querySelector( '.Content' ).innerHTML = Friend.GUI.view.cleanHTMLData( data );
		return;
	}
	if( win.content ) win = win.content;
	win.innerHTML = Friend.GUI.view.cleanHTMLData( data );
}

// Refresh the window and add/remove features
function RefreshWindow( div, noresize )
{
	// We need the content element for the flags
	if( div.content ) div = div.content;
	if( div.flags )
	{
		if( div.flags.hidden && div.flags.hidden === true ) return;
		if( div.flags.invisible && div.flags.invisible === true ) return;

		let flags = div.flags;
		let winObj = div.parentNode;
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
	if( div.className == 'Content' ) div = div.parentNode;
	if( !div || !div.getElementsByTagName ) return;
	let divz = div.getElementsByTagName ( 'div' );
	let title = false;
	for( var a = 0; a < divz.length; a++ )
	{
		if( divz[a].classList.contains( 'Title' ) )
			title = divz[a];
	}
	if ( !title ) return false;
	title.getElementsByTagName ( 'span' )[0].innerHTML = titleStr;
	div.titleString = titleStr;
	
	// Update window
	if( Friend.windowBaseStringRules && Friend.windowBaseStringRules == 'replace' )
		document.title = Friend.windowBaseString;
	else document.title = titleStr;
	
	// Viewtitle (for other uses than title)
	let vTitle = titleStr;
	if( vTitle.indexOf( ' - ' ) > 0 )
	{
	    vTitle = vTitle.split( ' - ' );
	    vTitle[0] = '';
	    vTitle = vTitle.join( '' );
	}
	div.viewTitle.innerHTML = vTitle;
	
	// Support dashboard
	let dl = document.querySelector( '.DashboardLabel' );
	if( dl )
	{
	    dl.innerHTML = vTitle;
    }
	
	// Also check tasks
	let baseElement = GetTaskbarElement();
	if( !baseElement ) return;
	if( baseElement.tasks )
	{
		for( var a in baseElement.tasks )
		{
			if( div.viewId == baseElement.tasks[ a ].viewId )
			{
				let t = baseElement.tasks[a].dom.querySelector( '.Taskname' );
				if( t )
				{
					t.innerHTML = titleStr;
				}
				else baseElement.tasks[a].dom.innerHTML = titleStr;
				break;
			}
		}
	}
}

// Update window content size
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
function ResizeWindow( div, wi, he, mode, depth )
{
	if( window.isMobile ) return;
	if( !div ) return;
	if( !depth ) depth = 0;
	else if( depth > 4 ) return;
	if( !mode ) mode = false;
	
	if( !wi || wi == 'undefined' || wi == undefined )
	{
	    wi = div.windowObject.getFlag( 'width' );
	}
	if( !he || he == 'undefined' || he == undefined )
	{
	    he = div.windowObject.getFlag( 'height' );
	}
	
	// Find window div
	if ( !div.content )
	{
		while( div && ( !div.classList || ( div.classList && !div.classList.contains( 'View' ) ) ) && div != document.body )
			div = div.parentNode;
	}

	// If it isn't found, escape!
	if ( div == document.body ) return;
	
	let margins = GetViewDisplayMargins( div );
	
	// Extra width height to calculate with
	let frameWidth = 0;
	let frameHeight = 0;
	
	let isWorkspaceScreen = div.windowObject.getFlag( 'screen' ) == Workspace.screen;
	
	if( div.content && div.windowObject.flags )
	{
		let flags = div.windowObject.flags;
		let ele = div.windowObject.content.parentNode;
	
		// When getting width and height from flags, and not in borderless
		// mode, check also borders around the content and add those to get
		// the correct width and height
		// TODO: leftbar and rightbar does not exist, remove it
		/*frameWidth = ele.rightbar.offsetWidth + ele.leftbar.offsetWidth;
		console.log( 'Checking frame ' + frameWidth + ' (' + ele.rightbar.offsetWidth + ', ' + ele.leftbar.offsetWidth + ')' );
		console.log( ele.rightbar, ele.leftbar );*/
		if( !wi ) 
		{
			wi = parseInt( flags.width );
			if( !flags.borderless && !isNaN( wi ) )
			{
				wi += frameWidth;
			}
		}
		frameHeight = ele.titleBar.offsetHeight;
		
		// TODO: Bottom bar does not exist, remove it
		/*if( isWorkspaceScreen )
		{
			frameHeight += ele.bottombar.offsetHeight;
			console.log( 'And the bottombar: ' + frameHeight + ' (' + ele.bottombar.offsetHeight + ')' );
		}*/
		if( !he )
		{
			he = flags.height;
			if( !flags.borderless && !isNaN( he ) )
			{
				he += frameHeight;
			}
		}
		
		// Window gauge
		// TODO: Volume gauge does not exist, remove it
		/*
		if( div.windowObject.flags.volume && div.volumeGauge )
		{
			div.content.style.left = GetElementWidth( div.volumeGauge.parentNode ) + 'px';
		}*/
	}
	
	let cl = document.body.classList.contains( 'Inside' );
	
	let maxVWidt, maxVHeig;
	if( Workspace.mode != 'vr' )
	{
		if( div.windowObject.flags.screen )
		{
			maxVWidt = cl ? div.windowObject.flags.screen.getMaxViewWidth() : GetWindowWidth();
			maxVHeig = cl ? div.windowObject.flags.screen.getMaxViewHeight() : GetWindowHeight();
		}
		else
		{
			maxVWidt = window.innerWidth;
			maxVHeig = window.innerHeight;
		}
	}
	else
	{
		maxVWidt = window.innerWidth;
		maxVHeig = window.innerHeight;
	}

	let maximized = div.getAttribute( 'maximized' ) == 'true' || 
		div.windowObject.flags.maximized;

	if ( !wi || wi == 'false' ) wi = div.content ? div.content.offsetWidth  : div.offsetWidth;
	if ( !he || he == 'false' ) he = div.content ? div.content.offsetHeight : div.offsetHeight;

	wi = parseInt( wi );
	he = parseInt( he );

	let divs = div.getElementsByTagName ( 'div' );
	let cnt  = false;
	for( let a = 0; a < divs.length; a++ )
	{
		if( !cnt && divs[a].classList && divs[a].classList.contains( 'Content' ) )
		{
			cnt = divs[a];
			break;
		}
	}
	
	// TODO: Let a central resize code handle this (this one?)
	// Maximum dimensions
	let pheight = div.parentNode ? div.parentNode.offsetHeight : GetWindowHeight();
	// TODO: Support parent windows
	let maxWidth  = maxVWidt;
	let maxHeight = maxVHeig;
	
	//console.log( '0) Max height first ' + maxVHeig + ' ' + margins.top + ' ' + margins.bottom );
	
	// Add margins
	maxWidth -= margins.left + margins.right;
	maxHeight -= margins.top + margins.bottom;
	
	//console.log( '1) Here is wihe: ' + wi + 'x' + he );
	
	if( div.windowObject && maximized )
	{
		wi = maxWidth;
		he = maxHeight;
	}
	// We will not go past max height
	else
	{
		if( he > maxHeight ) he = maxHeight;
	}
	
	//console.log( 'Max height: ' + maxHeight );
	
	//console.log( '2) Here is wihe: ' + wi + 'x' + he );
	
	// Make sure we don't go past screen limits
	let l = t = 0;
	if( div.parentNode )
	{
		l = parseInt( div.style.left );
		t = parseInt( div.style.top );
		if( isNaN( l ) ) l = 0;
		if( isNaN( t ) ) t = 0;
		//console.log( 'Style top: ' + t + ' (' + div.style.top + ')' );
	}
	else
	{
		l = div.windowObject.flags.left;
		t = div.windowObject.flags.top;
		if( !l ) l = isWorkspaceScreen ? div.windowObject.workspace * window.innerWidth : 0;
		if( !t ) t = 0;
	}
	
	// Maximized
	if( div.windowObject && maximized )
	{
		l = l = isWorkspaceScreen ? ( div.windowObject.workspace * window.innerWidth ) : 0;
		t = 0;
	}
	
	//console.log( '3) Here is wihe: ' + wi + 'x' + he );
	
	// Skew for calculating beyond workspace 1
	let skewx = div.windowObject.workspace * window.innerWidth;
	if( !isWorkspaceScreen ) skewx = 0;
	
	if( l + wi > maxWidth + skewx + margins.left )
	{
		wi = maxWidth + skewx - l + margins.left;
	}
	if( t + he > maxHeight + margins.top )
	{
		he = maxHeight - t + margins.top;
	}
	// Done limits
	
	//console.log( '2) Here is wihe: ' + wi + 'x' + he );
	
	// Flag constraints
	let fminw = div.windowObject.flags['min-width']  ? div.windowObject.flags['min-width']  : 0;
	let fminh = div.windowObject.flags['min-height'] ? div.windowObject.flags['min-height'] : 0;
	let fmaxw = div.windowObject.flags['max-width']  ? div.windowObject.flags['max-width']  : 999999;
	let fmaxh = div.windowObject.flags['max-height'] ? div.windowObject.flags['max-height'] : 999999;
	fminw += frameWidth;
	fminh += frameHeight;

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
	
	// Set the width and height
	div.style.width  = wi + 'px';
	div.style.height = he + 'px';

	div.marginHoriz = FUI_WINDOW_MARGIN;
	div.marginVert  = 0;

	// Constrain
	ConstrainWindow( div, null, null, depth + 1 );

	// Set the content width
	UpdateWindowContentSize( div );

	// Toggle scroll flag
	function checkScrolling( div )
	{
		if( !div.content && div.parentNode && div.parentNode.content )
			div = div.parentNode;
		if( !div.content ) return;
		if( !div.content.firstChild ) return;
		if( div.content.offsetHeight < div.content.firstChild.scrollHeight )
		{
			div.classList.add( 'Scrolling' );
		}
		else
		{
			div.classList.remove( 'Scrolling' );
		}
	};

	// Check resize event
	if( div.content.events && div.content.events.resize )
	{
		for( var a = 0; a < div.content.events.resize.length; a++ )
		{
			div.content.events.resize[a]( function(){ checkScrolling( div ) } );
		}
	}

	// Check now
	checkScrolling( div );
	
	// refresh
	// TODO: Is this ever used? Pls check
	if( div.refreshWindow )
	{
		div.refreshWindow();
	}
	
	let flagDia = div.windowObject.getFlag( 'dialog' );
	if( flagDia )
	{
	    setTimeout( function()
	    {
	        div.windowObject.setFlag( 'dialog', flagDia );
	    }, 50 );
	}
}

// Get the statusbar height
function GetStatusbarHeight( screen )
{
	if( screen && screen.div && screen == Workspace.screen )
	{
		if( globalConfig.viewList == 'dockedlist' || globalConfig.viewList == 'docked' )
		{
			if( Workspace.mainDock )
			{
				if( Workspace.mainDock.dom.classList.contains( 'Horizontal' ) )
				{
					return Workspace.mainDock.dom.offsetHeight;
				}
			}
		}
	
		// Cache?
		if( typeof( screen.statusBarHeight ) != 'undefined' && screen.statusBarHeight != null )
			return screen.statusBarHeight;
		
		// Calculate
		let eles = screen.div.getElementsByTagName( 'div' );
		screen.statusBarHeight = 0;
		for( var a = 0; a < eles.length; a++ )
		{
			if( eles[a].id == 'Statusbar' )
			{
				screen.statusBarHeight = eles[a].offsetHeight;
				break;
			}
		}
		return screen.statusBarHeight;
	}
	return 0;
}

// Pop a window up!
function PopoutWindow( wind, e )
{
	Confirm( i18n( 'i18n_pop_question' ), i18n( 'i18n_pop_description' ), function( response, e )
	{
		if( response )
		{
			let m = new Module( 'system' );
			m.onExecuted = function( ee, dd )
			{
				if( ee == 'ok' )
				{
					let info = JSON.parse( dd );
					let windowObject = wind.windowObject;
					let ifr = wind.getElementsByTagName( 'iframe' )[0];
					let vw = wind.offsetWidth ? wind.offsetWidth : 900;
					let vh = wind.offsetHeight ? wind.offsetHeight : 900;
					let part = document.location.href.match( /(.*?)\/webclient/i )[1];
					let ifrsrc = part + '/webclient/webapp.html?app=' + wind.windowObject.applicationName + '&logintoken=' + info.token
					let v = window.open( ifrsrc, '', 'width=' + vw + ',height=' + vh + ',status=no,toolbar=no,topbar=no,windowFeatures=popup' );
					wind.windowObject.close();
				}
			}
			m.execute( 'getlogintoken', { name: wind.windowObject.applicationName } );
		}
	} );
}


// Make sure we're not overlapping all of the time
var _cascadeValue = 0;
function CascadeWindowPosition( obj )
{
	if( !Workspace.screen ) return;
	
	if( !isMobile )
	{
		obj.dom.style.top = _cascadeValue + obj.y + 'px';
		obj.dom.style.left = _cascadeValue + obj.x + 'px';
	
		_cascadeValue += 20;
		if( _cascadeValue + obj.x + obj.w > obj.maxw || _cascadeValue + obj.y + obj.h > obj.maxh )
			_cascadeValue = 0;
	}
}

// Returns the display margins, taking into consideration the screen, dock etc
function GetViewDisplayMargins( div )
{
	let wo = div.windowObject;
	let sc = wo ? wo.getFlag( 'screen' ) : null;
	
	let margins = {
		top: 0,
		left: 0,
		right: 0,
		bottom: 0
	};
	
	if( !sc || ( sc && sc != Workspace.screen ) ) 
	{
		if( sc && sc.div.screenTitle )
		{
			margins.top += sc.div.screenTitle.offsetHeight;
			margins.bottom -= margins.top; // TODO: <- this is ugly! to maximize height on screens..
		}
		return margins;
	}
	
	let dockPosition = null;
	
	if( Workspace.mainDock )
	{
		let dockDom = Workspace.mainDock.dom;
		if( !parseInt( dockDom.style.height ) ) return margins;
		
		if( dockDom.classList.contains( 'Top' ) )
			dockPosition = 'Top';
		else if( dockDom.classList.contains( 'Left' ) )
			dockPosition = 'Left';
		else if( dockDom.classList.contains( 'Right' ) )
			dockPosition = 'Right';
		else if( dockDom.classList.contains( 'Bottom' ) )
			dockPosition = 'Bottom';
		
		switch( dockPosition )
		{
			case 'Top':
				margins.top += parseInt( dockDom.style.height );
				break;
			case 'Left':
				margins.left += parseInt( dockDom.style.width );
				break;
			case 'Right':
				margins.right += parseInt( dockDom.style.width );
				break;
			case 'Bottom':
				margins.bottom += parseInt( dockDom.style.height );
				break;
		}
	}
	
	if( dockPosition != 'Bottom' && ge( 'Tray' ) && ge( 'Taskbar' ).offsetHeight )
		margins.bottom += parseInt( ge( 'Tray' ).style.height );
	
	let inf = GetThemeInfo( 'ScreenContentMargins' );
	if( inf && inf.top )
		margins.top += parseInt( inf.top );
		
	return margins;
}

function ConstrainWindows()
{
	if( !window.movableWindows ) return;
	for( var a in movableWindows )
		ConstrainWindow( movableWindows[ a ] );
}

// Constrain position (optionally providing left and top)
function ConstrainWindow( div, l, t, depth, caller )
{
	if( window.isMobile ) return;
	if( !depth ) depth = 0;
	else if( depth > 4 ) return;
	
	div.setAttribute( 'moving', 'moving' );
	setTimeout( function()
	{
		div.removeAttribute( 'moving' );
	}, 250 );
	
	let margins = GetViewDisplayMargins( div );
	
	// Track caller
	if( !caller ) caller = div;
	
	// l and t needs to be numbers
	if( isNaN( l ) ) l = parseInt( l );
	if( isNaN( t ) ) t = parseInt( t );
	
	// Get some information through flags
	let sc = null;
	let flagMaxWidth = flagMaxHeight = 0;
	if( div.windowObject )
	{
		sc = div.windowObject.getFlag( 'screen' );
		flagMaxWidth = parseInt( div.windowObject.getFlag( 'max-width' ) );
		flagMaxHeight = parseInt( div.windowObject.getFlag( 'max-height' ) );
	}
	if( !sc ) sc = Workspace.screen;
	
	let screenMaxWidth = sc ? sc.getMaxViewWidth() : document.body.offsetWidth;
	let screenMaxHeight = sc ? sc.getMaxViewHeight() : document.body.offsetHeight;
	
	// If the view is inside another container (special case)
	let specialNesting = div.content ? div : div.parentNode;
	if( div.viewContainer && div.viewContainer.parentNode )
	{
		specialNesting = !div.viewContainer.parentNode.classList.contains( 'ScreenContent' );
	}
	else specialNesting = false;
	let pn = div.parentWindow;
	let win = pn ? pn.getWindowElement() : div;
	let cn = win.content ? win.content : win;
	
	// Get maximum width / height
	let maxWidth = pn ? pn.offsetWidth : 
		( specialNesting ? div.viewContainer.parentNode.offsetWidth : screenMaxWidth );
	let maxHeight = pn ? pn.offsetHeight : 
		( specialNesting ? div.viewContainer.parentNode.offsetHeight : screenMaxHeight );
	
	// Subtract margins
	maxWidth -= margins.left + margins.right;
	maxHeight -= margins.top + margins.bottom;
	
	// Max constraint
	if( !flagMaxWidth || flagMaxWidth > maxWidth )
	{
		div.style.maxWidth = maxWidth + 'px';
	}
	if( !flagMaxHeight || flagMaxHeight > maxHeight )
	{
		div.style.maxHeight = maxHeight + 'px';
		div.parentNode.style.maxHeight = maxHeight + 'px';
	}

	let mt = margins.top;
	let ml = margins.left; // min left
	let mw = maxWidth;
	let mh = maxHeight;
	
	let ww = div.offsetWidth;
	let wh = div.offsetHeight;
	if( ww <= 0 ) ww = div.content.windowObject.getFlag( 'width' );
	if( wh <= 0 ) wh = div.content.windowObject.getFlag( 'height' );
	let mvw = screenMaxWidth;
	let mvh = screenMaxHeight;
	
	// TODO: See if we can move this dock dimension stuff inside getMax..()
	if( Workspace.mainDock )
	{
		if( Workspace.mainDock.dom.classList.contains( 'Vertical' ) )
		{
			mvw -= Workspace.mainDock.dom.offsetWidth;
		}
		else
		{
			mvh -= Workspace.mainDock.dom.offsetHeight;
		}
	}
	
	// For window cascading, start comparing (isNaN means not set)
	let doCascade = false;
	if( !l )
	{
		l = parseInt( div.style.left );
		if( isNaN( l ) )
		{
			doCascade = true;
			l = ( mvw >> 1 ) - ( ww >> 1 );
		}
	}
	if( !t )
	{
		t = parseInt( div.style.top );
		if( isNaN( t ) )
		{
			doCascade = true;
			t = ( mvh >> 1 ) - ( wh >> 1 );
		}
	}

	// Add workspace when opening this way
	if( !div.content.windowObject.flags.screen || div.content.windowObject.flags.screen == Workspace.screen )
	{
		if( typeof( currentScreen ) != 'undefined' && globalConfig.workspaceCurrent >= 0 )
		{
			if( div.windowObject.workspace < 0 )
				div.windowObject.workspace = globalConfig.workspaceCurrent;
		}
		else if( typeof( div.windowObject ) != 'undefined' )
		{
			if( !div.windowObject.workspace )
				div.windowObject.workspace = 0;
		}
	}

	// When cascading, the view is moved
	if( doCascade )
	{
		return CascadeWindowPosition( { x: l, y: t, w: ww, h: wh, maxw: mw, maxh: mh, dom: div } );
	}
	
	// Final constraint
	if( l + ww > ml + mw ) l = ( ml + mw ) - ww;
	if( l < ml ) l = ml;
	
	if( t + wh > mt + mh ) t = ( mt + mh ) - wh;
	if( t < mt ) t = mt;
	
	// Set previous position
	div.prevPositionLeft = div.windowObject.getFlag( 'left' );
	div.prevPositionTop = div.windowObject.getFlag( 'top' );

	// Set the actual position
	div.windowObject.setFlag( 'left', l );
	div.windowObject.setFlag( 'top', t );
	
	// Only test if we're currently moving an open window
	// Skip when we're in snapping mode..
	if( window.currentMovable && !currentMovable.snapping )
	{
		// Check attached (snapped) windows
		if( div.attached )
		{
			for( var a = 0; a < div.attached.length; a++ )
			{
				// Skip if we're the current movable or caller
				if( div.attached[a] == caller || div.attached[a] == currentMovable ) continue;
			
				div.attached[a].setAttribute( 'moving', 'moving' );
				ConstrainWindow( div.attached[ a ], div.offsetLeft - div.attached[a].snapCoords.x, div.offsetTop - div.attached[a].snapCoords.y, depth + 1, caller );
			}
		}
		// Check attached window if we're attached to
		if( div == caller && div.snapObject && div.snapObject != caller )
		{
			let ll = false, tt = false;
			if( div.snap == 'up' )
			{
				ll = l + div.snapCoords.x;
				tt = t - div.snapObject.offsetHeight;
			}
			// TODO: Make this work
			else if( div.snap == 'down' )
			{
				ll = l + div.snapCoords.x;
				tt = t + div.offsetHeight;
			}
			else if( div.snap == 'right' )
			{
				ll = l + div.offsetWidth;
				tt = t + div.snapCoords.y;
			}
			else if( div.snap == 'left' )
			{
				ll = l - div.snapObject.offsetWidth;
				tt = t + div.snapCoords.y;
			}
			if( ll !== false && tt !== false )
				ConstrainWindow( div.snapObject, ll, tt, depth + 1, caller );
		}
	}
}

// Make window autoresize
function AutoResizeWindow( div )
{
	if( !div ) return;
	if( !div.content )
	{
		while( !div.classList.contains( 'View' ) && div != document.body )
			div = div.parentNode;
	}
	if( div == document.body ) return;
	let divs = div.getElementsByTagName( 'div' );
	let cnt = false;
	let title = false;
	for( var a = 0; a < divs.length; a++ )
	{
		if( !divs[a].classList ) continue;
		if( divs[a].classList.contains( 'Content' ) )
			cnt = divs[a];
		if( divs[a].classList.contains( 'Title' ) )
			title = divs[a];
	}
	if ( !cnt ) return false;

	div.autoResize = true;

	let h = 0;
	let eles = cnt.getElementsByTagName( '*' );
	for( var b = 0; b < eles.length; b++ )
	{
		if( eles[b].parentNode != cnt ) continue;
		h += eles[b].offsetHeight;
	}

	ResizeWindow( div, false, h );
}

// Sets the screen by window element
function SetScreenByWindowElement( div )
{
	// Set screen
	if( !div ) return false;
	let d = div;
	while( d != document.body && d.parentNode )
	{
		d = d.parentNode;
		if( d.className && (
			d.className == 'Screen' || d.className.indexOf( ' Screen' ) >= 0 ||
			d.className.indexOf( 'Screen ' ) == 0
		) )
		{
			return ( window.currentScreen = d );
		}
	}
	return false;
}

// Just like _ActivateWindow, only without doing anything but activating
function _ActivateWindowOnly( div, e )
{
    if( div.windowObject && div.windowObject.getFlag( 'invisible' ) == true ) return;
	if( Workspace.contextMenuShowing && Workspace.contextMenuShowing.shown )
	{
		return;
	}
	
	// Blocker
	if( !isMobile && div.content && div.content.blocker )
	{
		_ActivateWindow( div.content.blocker.getWindowElement().parentNode, false );
		return;
	}
	
	// Dialogs here are not activated
    if( 
    	window.Workspace && Workspace.dashboard && div.windowObject && (
    		div.windowObject.flags[ 'dialog' ] ||
    		div.windowObject.flags[ 'standard-dialog' ]
    	) 
    )
    {
    	return _ActivateDialogWindow( div, e );
	}
	
	// Don't select other fields
	if( !div.classList.contains( 'Active' ) )
	{
		let ae = document.activeElement;
		if( ae.parentNode && ae.parentNode.parentNode != div )
		{
			FocusOnNothing();
		}
	}
	
	// Special case
	let delayedDeactivation = true;
	
	// Note we're having a current movable
	currentMovable = div;
	
	// we use this one to calculate the max-height of the active window once its switched....
	let newOffsetY = 0;
	for( let a in movableWindows )
	{
		let m = movableWindows[a];

		// No div selected or not the div we're looking for - do inactive!
		if( !div || m != div )
		{
			if( isMobile )
			{
				// Support delayed deactivation
				( function( dd ) {
					function deal()
					{
						if( currentMovable && currentMovable.classList && ( 
							currentMovable.parentNode.classList.contains( 'Redrawing' ) || 
							currentMovable.parentNode.classList.contains( 'DoneActivating' ) || 
							currentMovable.parentNode.classList.contains( 'Activated' ) 
						) )
						{
							return setTimeout( function(){ deal() }, 300 );
						}
						if( dd && dd.parentNode )
						{
							dd.parentNode.classList.remove( 'DelayedDeactivation' );
							_DeactivateWindow( dd );
						}
					}
					if( delayedDeactivation && div.applicationId == dd.applicationId && dd.parentNode )
					{
						dd.parentNode.classList.add( 'DelayedDeactivation' );
						setTimeout( function(){ deal() }, 300 );
					}
					else deal();
				} )( m );
			}
			else if( m && m.classList.contains( 'Active' ) )
			{
				_DeactivateWindow( m );
			}
		}
		// This is the div we are looking for!
		else if( m == div )
		{
			// Record active window for this workspace
			if( globalConfig.workspaceCurrent == div.workspace )
				setVirtualWorkspaceInformation( div.workspace, 'activeWindow', div );
			
			if( div.content )
				window.regionWindow = div.content;
			else window.regionWindow = div;

			if( div.content )
				window.currentMovable = div;
			else window.currentMovable = div;

			m.viewContainer.classList.remove( 'OnWorkspace' );
			
			m.classList.add( 'Active' );
			m.viewContainer.classList.add( 'Active' );
			
			if( m.windowObject.flags.singletask )
			{
				document.body.classList.add( 'Singletask' );
			}
			else
			{
				document.body.classList.remove( 'Singletask' );
			}
			
			// Set active window
			if( m.windowObject.getFlag( 'windowActive' ) )
			{
				m.style.backgroundColor = m.windowObject.getFlag( 'windowActive' );
				m.titleDiv.style.backgroundColor = m.style.backgroundColor;
			}

			let app = _getAppByAppId( div.applicationId );

			// Extra force!
			if( isMobile )
			{	
				m.viewContainer.style.display = '';
				m.viewContainer.style.top    = '0px';
				m.viewContainer.style.left   = '0px';
				m.viewContainer.style.width  = '100%';
				m.viewContainer.style.height = '100%';
				
				if( window._getAppByAppId )
				{
					if( app )
					{
						if( m.windowObject != app.mainView )
						{
							m.parentNode.setAttribute( 'childview', true );
						}
						else
						{
							m.parentNode.removeAttribute( 'childview' );
						}
					}
				}
				
				// Can't be minimized
				m.viewContainer.removeAttribute( 'minimized' );
				m.minimized = false;
			}
			else
			{
				m.viewContainer.removeAttribute( 'minimized' );
				m.minimized = false;
			}
			
			// Notify app
			if( app )
			{
				app.sendMessage( {
					'command': 'notify',
					'method': 'setviewflag',
					'flag': 'minimized',
					'viewId': div.windowObject.viewId,
					'value': false
				} );
			}
			
			if( div.windowObject )
			{	
				if( !div.notifyActivated )
				{
					let iftest = div.getElementsByTagName( _viewType );
					let msg = {
						type:    'system',
						command: 'notify',
						method:  'activateview',
						viewId: div.windowObject.viewId
					};
					if( iftest && iftest[0] )
					{
						msg.applicationId = iftest[0].applicationId;
						msg.authId = iftest[0].authId;
					}
					div.notifyActivated = true;
					div.windowObject.sendMessage( msg );
				}
			}
			
			CheckMaximizedView();
		}
	}
	// Check window
	CheckScreenTitle();
}

function _ActivateDialogWindow( div, e )
{
	if( !e ) e = window.event;
	// TODO: Also for touch!
	if( !div.windowObject.flags.dockable )
	{
		document.body.classList.add( 'Dialog' );
		
		currentMovable = div;
		if( e && e.button == 0 )
		{
			if( !div.windowObject.applicationId && !div.classList.contains( 'IconWindow' ) )
			{
				// If we have active windows that already shows, don't deactivate them for the dialog
				// TODO: Exception is for file views - but not file dialogs
				let exceptions = [];
				for( let a in movableWindows )
				{
					if( movableWindows[ a ].classList.contains( 'Active' ) )
						exceptions.push( movableWindows[ a ] );
				}
				_DeactivateWindows( exceptions.length ? { exceptions: exceptions } : false );
				currentMovable = div;
			}
			if( window.hideDashboard )
				window.hideDashboard();
		}
		else
		{
			if( window.hideDashboard )
				window.hideDashboard();
		}
		if( window.Workspace && window.Workspace.showQuickMenu )
		{
			Workspace.showQuickMenu();
		}
	}
}

// "Private" function to activate a window
var _activationTarget = null;
function _ActivateWindow( div, nopoll, e )
{
    let titl = div.windowObject ? div.windowObject.getFlag( 'title' ) : 'unknown';
    if( div.windowObject && div.windowObject.getFlag( 'invisible' ) == true ) return;
    if( div.parentNode && div.parentNode.classList.contains( 'Closing' ) ) return;
    
    // Support dashboard
    let vTitle = div.windowObject.getFlag( 'title' );
    if( vTitle )
    {
	    let dl = document.querySelector( '.DashboardLabel' );
	    if( dl )
	    {
	        dl.innerHTML = vTitle;
        }
    }
    
    // Add div if it hasn't been added already
	if( div && div.windowObject && ( window.currentContext && ( typeof( window.currentContext ) == 'string' || div != window.currentContext[ 0 ] ) ) )
	{
	    window.currentContext = [ div, window.currentContext ];
	}
	
	// Dialogs here are not activated
    if( 
    	window.Workspace && Workspace.dashboard && div.windowObject && (
    		div.windowObject.flags[ 'dialog' ] ||
    		div.windowObject.flags[ 'standard-dialog' ] ||
    		( div.content && div.content.classList.contains( 'FileDialog' ) )
    	) 
    )
    {
    	return _ActivateDialogWindow( div );
	}
	
	// Remove dialog flag only if it's not a dialog
	document.body.classList.remove( 'Dialog' );
    
	// Check window color
	if( div.windowObject.getFlag( 'windowActive' ) )
	{
		div.style.backgroundColor = div.windowObject.getFlag( 'windowActive' );
		div.titleDiv.style.backgroundColor = div.style.backgroundColor;
	}
	
	if( Workspace.contextMenuShowing && Workspace.contextMenuShowing.shown )
	{
		return;
	}

	if( !e ) e = window.event;
	
	// TODO: Also for touch!
	if( e && e.button == 0 )
	{
	    if( window.hideDashboard )
	        window.hideDashboard();
	}
	if( window.Workspace && window.Workspace.showQuickMenu && !div.windowObject.getFlag( 'sidebarManaged' ) )
	{
        Workspace.showQuickMenu();
    }
	
	// Already activating
	if( div.parentNode.classList.contains( 'Activating' ) )
	{
		if( !isMobile && globalConfig.focusMode == 'clicktofront' )
		{
			_WindowToFront( div );
		}
		return;
	}
	// And is already active
	if( div.classList.contains( 'Active' ) )
	{
		if( !isMobile && globalConfig.focusMode == 'clicktofront' )
		{
			_WindowToFront( div );
		}
		return;
	}
	
	// Don't activate a window that is being removed
	if( div.classList.contains( 'Remove' ) )
		return;
	
	// Remove flag from window and app
	div.windowObject.setFlag( 'opensilent', false );
	if( div.applicationId && window._getAppByAppId )
	{
		let app = _getAppByAppId( div.applicationId );
		app.opensilent = false;
	}
	
	// Remove menu on calendar
	if( Workspace.calendarWidget )
		Workspace.calendarWidget.hide();
	
	if( isMobile && div.windowObject.lastActiveView && isMobile && div.windowObject.lastActiveView.parentNode )
	{
		div.windowObject.lastActiveView.parentNode.classList.remove( 'OnWorkspace' );
		_ActivateWindow( div.windowObject.lastActiveView );
		div.windowObject.lastActiveView = null;
		return;
	}
	
	// Set currently displayed view on app
	if( isMobile )
	{
		if( window._getAppByAppId )
		{
			let app = _getAppByAppId( this.applicationId );
			if( app )
			{
				app.displayedView = div;
			}
		}
	}
	
	// Check if we're on the right workspace
	if( !div.windowObject.flags.screen || div.windowObject.flags.screen == Workspace.screen )
	{
		if( div.windowObject.workspace != globalConfig.workspaceCurrent )
		{
			if( window.Workspace && Workspace.switchWorkspace )
			{
				Workspace.switchWorkspace( div.windowObject.workspace );
			}
		}
	}
	
	// Don't reactivate
	if( div.classList.contains( 'Active' ) ) 
	{
		if( window.currentMovable )
		{
			if( window.currentMovable != div )
				window.currentMovable = div;
			
		}
		if( globalConfig.focusMode == 'clicktofront' )
			_WindowToFront( div );
		return;
	}
	
	// Reactivate all iframes
	let fr = div.windowObject.content.getElementsByTagName( 'iframe' );
	for( let a = 0; a < fr.length; a++ )
	{
		if( fr[ a ].oldSandbox && typeof( fr[ a ].oldSandbox ) == 'string' )
			fr[ a ].setAttribute( 'sandbox', fr[ a ].oldSandbox );
	}
	
	// Reserve this div for activation
	_activationTarget = div;
	
	// Activate all iframes
	if( div.windowObject.content )
	{
		let fr = div.windowObject.content.getElementsByTagName( 'iframe' );
		for( var a = 0; a < fr.length; a++ )
		{
			if( fr[ a ].oldSandbox )
			{
				if( typeof friendApp == 'undefined' ) fr[ a ].setAttribute( 'sandbox', fr[ a ].oldSandbox );
			}
			else
			{
				if( typeof friendApp == 'undefined' ) putSandboxFlags( fr[ a ], getSandboxFlags( div.windowObject, DEFAULT_SANDBOX_ATTRIBUTES ) );
			}
		}
	}
	
	if( isMobile )
	{
		window.focus();
		if( Workspace.mainDock )
			Workspace.mainDock.closeDesklet();
	}
	
	// Blur previous window
	let changedActiveWindow = false;
	if( window.currentMovable && currentMovable.windowObject )
	{
		if( currentMovable != div )
		{
			changedActiveWindow = true;
			currentMovable.windowObject.sendMessage( { type: 'view', command: 'blur' } );
		}
	}
	
	// Update window title
	if( Friend.windowBaseStringRules && Friend.windowBaseStringRules == 'replace' )
	{
		document.title = Friend.windowBaseString;
	}
	else
	{
		document.title = div.windowObject.getFlag( 'title' );
	}

	// If it has a window blocker, activate that instead
	if ( div && div.content && typeof ( div.content.blocker ) == 'object' )
	{
		_activationTarget = null; // unreserve
		_ActivateWindow( div.content.blocker.getWindowElement ().parentNode, nopoll, e );
		return;
	}
	
	// Calendar is slid
	if( Workspace && Workspace.widget )
		Workspace.widget.slideUp();
	
	if( globalConfig.focusMode == 'clicktofront' )
	{
		_WindowToFront( div );
	}
	
	// Tell window manager we are activating window
	let pn = div.parentNode;
	
	document.body.classList.add( 'Activating' );
	pn.classList.add( 'Activating' );
	setTimeout( function()
	{
		if( div )
		{
			pn.classList.add( 'Activated' );
			pn.classList.remove( 'Activating' );
			setTimeout( function()
			{
				if( div )
				{
					// Finally
					pn.classList.add( 'DoneActivating' );
					pn.classList.remove( 'Activated' );
					setTimeout( function()
					{
						if( div && div.parentNode )
						{
							pn.classList.remove( 'DoneActivating' );
							pn.classList.remove( 'Activating' );
							document.body.classList.remove( 'Activating' );
						}
					}, 300 );
				}
			}, 600 );
		}
	}, 300 );

	// Don't do it again, but notify!
	if( div.classList && div.classList.contains( 'Active' ) )
	{
		if( div.windowObject && !div.notifyActivated )
		{
			let iftest = div.getElementsByTagName( _viewType );
			let msg = {
				type:    'system',
				command: 'notify',
				method:  'activateview',
				viewId: div.windowObject.viewId
			};
			if( iftest && iftest[0] )
			{
				msg.applicationId = iftest[0].applicationId;
				msg.authId = iftest[0].authId;
			}
			div.windowObject.sendMessage( msg );
			div.windowObject.sendMessage( { command: 'activate' } ); // Let the app know
			div.notifyActivated = true;
		}
		_activationTarget = null; // Unreserve
		return;
	}

	// Push active view to history
	if( !div.windowObject.flags.viewGroup )
		Friend.GUI.view.viewHistory.push( div );

	// Set screen
	SetScreenByWindowElement( div );

	_setWindowTiles( div );

	// When activating for the first time, deselect selected icons
	if( div.classList && !div.classList.contains( 'Screen' ) )
	{
		// Make sure!
		if( changedActiveWindow )
		{
			let clear = true;
			let t = e ? e.target : false;
			if( t )
			{
				while( t && t != document.body && !t.fileInfo )
					t = t.parentNode;
				if( t && t.fileInfo )
					clear = false;
			}
			if( !clear )
			{
				clearRegionIcons( { exception: t } );
			}
			else
			{
				clearRegionIcons();
			}
		}
	}
	else if( e && ( !e.shiftKey && !e.ctrlKey ) ) clearRegionIcons();

	_ActivateWindowOnly( div );

	if( !nopoll ) PollTaskbar( div );
	
	// All done
	_activationTarget = null;
}

// Activate tiling system
function _setWindowTiles( div )
{
	if( isMobile ) return;
	
	// Check if we have windows attached
	if( div.attached )
	{
		if( div.className.indexOf( 'TilingMode' ) >= 0 )
		{
			_removeWindowTiles( div );
		}
		let attachedCount = 1;
		for( var a in div.attached )
		{
			attachedCount++;
		}
		div.classList.add( 'TilingMode' + attachedCount );
		let tile = 2;
		for( var a in div.attached )
		{
			div.attached[a].classList.add( 'Tile' + tile++, 'TilingMode' + attachedCount );
		}
	}
}

// Remove tiling system
function _removeWindowTiles( div )
{
	if( isMobile ) return;
	// Check if we have windows attached
	if( div.attached )
	{
		let attachedCount = 1;
		for( var a in div.attached )
		{
			attachedCount++;
		}
		while( div.className.indexOf( 'Til' ) >= 0 )
		{
			let ind = div.className.indexOf( 'Til' );
			if( ind >= 0 )
			{
				for( var b = ind; div.className[b] != ' ' && b < div.className.length; b++ ){}
				div.className = div.className.split( div.className.substr( ind, b - ind ) ).join( ' ' );
			}
		}
		for( var a in div.attached )
		{
			let d = div.attached[ a ]
			while( d.className.indexOf( 'Til' ) >= 0 )
			{
				let ind = d.className.indexOf( 'Til' );
				if( ind >= 0 )
				{
					for( var b = ind; d.className[b] != ' ' && b < d.className.length; b++ ){}
					d.className = d.className.split( d.className.substr( ind, b - ind ) ).join( ' ' );
				}
			}
		}
	}
}

function _DeactivateWindow( m, skipCleanUp )
{
	let ret = false;

	if( !m ) return;
	
	if( !m ) return;
	
	// Cannot deactivate singletaskers
	if( m.windowObject && m.windowObject.getFlag( 'singletask' ) )
	{
        return _ActivateWindow( m );
    }
	
	if( m.className && m.classList.contains( 'Active' ) )
	{
		m.classList.remove( 'Active' );
		m.viewContainer.classList.remove( 'Active' );
		
		// Check inactive window color
		if( m.windowObject.getFlag( 'windowInactive' ) )
		{
			m.style.backgroundColor = m.windowObject.getFlag( 'windowInactive' );
			m.titleDiv.style.backgroundColor = m.style.backgroundColor;
		}
		
		CheckMaximizedView();
		
		if( m.windowObject && m.notifyActivated )
		{
			let iftest = m.getElementsByTagName( _viewType );
			let msg = {
				type: 'system',
				command: 'notify',
				method: 'deactivateview',
				viewId: m.windowObject.viewId
			};
			if( iftest && iftest[0] )
			{
				msg.applicationId = iftest[0].applicationId;
			}
			m.windowObject.sendMessage( {
				command: 'blur'
			} );
			m.windowObject.sendMessage( msg );
			m.notifyActivated = false;
			
			// Deactivate all iframes
			let fr = m.windowObject.content.getElementsByTagName( 'iframe' );
			for( let a = 0; a < fr.length; a++ )
			{
				fr[ a ].oldSandbox = fr[ a ].getAttribute( 'sandbox' );
				fr[ a ].setAttribute( 'sandbox', 'allow-scripts' );
			}
				
			PollTaskbar();
		}
		// Minimize on mobile
		if( isMobile )
		{
			m.doMinimize();
		}
		ret = true;
	}
	
	if( window.isMobile && !window.isTablet )
	{
		m.style.height = '35px';
	}
	
	if( isMobile )
	{
		_removeMobileCloseButtons();
	}
	
	// If we will not skip cleanup then do this
	if( !skipCleanUp )
	{
		if( window.currentMovable == m )
			window.currentMovable = null;
	
		// See if we can activate a mainview
		if( !currentMovable && !_activationTarget && m.windowObject )
		{
			let app = _getAppByAppId( m.windowObject.applicationId );
			let hasActive = false;
			for( var a in app.windows )
			{
				if( app.windows[ a ]._window.classList.contains( 'Active' ) )
				{
					hasActive = true;
					break;
				}
			}
			
			if( !hasActive )
			{
				for( var a in app.windows )
				{
					if( app.windows[ a ].flags.mainView && m.windowObject != app.windows[ a ] )
					{
						if( isMobile )
						{
							app.windows[ a ].flags.minimized = false;
							app.windows[ a ].activate();
						}
						break;
					}
				}
			}
		}
	
		// For mobiles and tablets
		hideKeyboard();

		// Check window
		CheckScreenTitle();
	}
	
	return ret;
}

function _removeMobileCloseButtons()
{
	for( var a in movableWindows )
	{
		let f = movableWindows[ a ];
		if( f.viewIcon )
		{
			f.viewIcon.classList.remove( 'Remove' );
			f.classList.remove( 'Remove' );
			f.classList.remove( 'Dragging' );
			f.parentNode.classList.remove( 'Flipped' );
		}
	}
}

function _DeactivateWindows( flags = false )
{
	clearRegionIcons();
	let windowsDeactivated = 0;
	window.currentMovable = null;

	if( isMobile )
	{
		Friend.GUI.view.viewHistory = [];
	}

	let a = null;
	for( a in movableWindows )
	{
		let m = movableWindows[a];
		if( m.classList.contains( 'Active' ) )
		{
			// Check exceptions to deactivation
			let found = false;
			if( flags && flags.exceptions )
			{
				for( let b = 0; b < flags.exceptions.length; b++ )
				{
					if( flags.exceptions[ b ] == m )
					{
						found = true;
						break;
					}
				}
			}
			if( !found )
				windowsDeactivated += _DeactivateWindow( m, true );
		}
	}

	//if( windowsDeactivated > 0 ) PollTaskbar ();
	
	// For mobiles and tablets
	hideKeyboard();

	// Set window title
	document.title = Friend.windowBaseString;

	// Check window
	CheckScreenTitle();
	
	Friend.GUI.reorganizeResponsiveMinimized();
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

function _WindowToFront( div, flags )
{
	// Blocker
	if( div.content && div.content.blocker )
	{
		_ActivateWindow( div.content.blocker.getWindowElement().parentNode, false );
		return;
	}
	
	if( !div || !div.style ) return;

	if( !flags ) flags = {};

	// Could be we did this on content!
	if( div.parentNode && div.parentNode.content )
		div = div.parentNode;

	// 1. Find highest and lowest zindex
	let low = 9999999;
	let high = -1;
	for( var a in movableWindows )
	{
		let m = movableWindows[a];
		let zi = parseInt( m.viewContainer.style.zIndex );
		if( zi <= low  ) low  = zi;
		if( zi >= high ) high = zi;
	}

	// 2. sort windows after zindex
	let sorted = [];
	for( var a = low; a <= high; a++ )
	{
		for( var b in movableWindows )
		{
			if( div != movableWindows[ b ] && movableWindows[ b ].viewContainer.style.zIndex == a )
			{
				sorted.push( movableWindows[ b ] );
			}
		}
	}
	
	// 3. sort, and place current window to front
	let sortedInd = 100;
	for( var a = 0; a < sorted.length; a++ )
	{
		sorted[ a ].viewContainer.style.zIndex = sortedInd++;
		sorted[ a ].style.zIndex = sorted[ a ].viewContainer.style.zIndex;
	}

	// 4. now apply the one we want to front to the front
	if( div.viewContainer )
	{
		div.viewContainer.style.zIndex = sortedInd;
		div.style.zIndex = sortedInd;
	}
	
	// 5. Check if we are snapped
	if( !flags.sourceElements )
	{
		flags.sourceElements = [];
	}
	
	// Don't check snap objects etc if we're already affected
	for( var a = 0; a < flags.sourceElements.length; a++ )
	{
		if( flags.sourceElements[ a ] == div )
			return;
	}
	
	if( flags.source != 'attachment' )
	{
		if( div.snap && div.snapObject )
		{

			// Tell window to front that we're an object in its attachment list
			flags.sourceElements.push( div );
			_WindowToFront( div.snapObject, { source: 'attachment', sourceElements: flags.sourceElements } );
		}
	}
	
	if( flags.source != 'snapobject' )
	{
		if( div.attached )
		{
			for( var a = 0; a < div.attached.length; a++ )
			{
				let found = false;
				for( var b = 0; b < flags.sourceElements.length; b++ )
				{
					if( flags.sourceElements[b] == div.attached[a] )
					{
						found = true;
						break;
					}
				}
				if( !found )
				{
					flags.sourceElements.push( div.attached[ a ] );
				}
			}
			for( var a = 0; a < div.attached.length; a++ )
			{
				if( div.attached[a] == flags.sourceElement )
				{
					continue;
				}
				// Tell window to front that we're the snap object
				_WindowToFront( div.attached[a], { source: 'snapobject', sourceElements: flags.sourceElements } );
			}
		}
	}
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
		let t = e.srcElement ? e.srcElement : e.target;
		while( t.className.indexOf( 'View' ) < 0 && t != document.body )
		{
			t = t.parentNode;
		}
		if( t.className.indexOf ( 'View' ) < 0 )
			return;
		let divs = document.getElementsByTagName ( 'div' );
		let cnt = false;
		for( var a = 0; a < divs.length; a++ )
		{
			if( divs[a].classList && divs[a].classList.contains( 'Content' ) )
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
	let t = win;
	while( t.className.indexOf ( 'View' ) < 0 && t != document.body )
	{
		t = t.parentNode;
	}
	if( t.className.indexOf ( 'View' ) < 0 )
		return;
	let divs = document.getElementsByTagName ( 'div' );
	let cnt = false;
	for( var a = 0; a < divs.length; a++ )
	{
		if( divs[a].classList && divs[a].classList.contains( 'Content' ) )
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
	let classes = div.className ? div.className.split( ' ' ) : [];
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
function CloseView( win, delayed )
{
	if( !win && window.currentMovable )
		win = window.currentMovable;
	
	let isDialog = false;
	
	let title = win.windowObject.getFlag( 'Title' );
	
	if( win )
	{
		// Clean up!
		if( win == window.regionWindow )
			window.regionWindow = null;
		if( window.currentMovable && window.currentMovable == win )
			window.currentMovable = null;
		
		if( !win.parentNode.parentNode ) return;
		if( win.parentNode.classList.contains( 'ViewContainer' ) )
		{
			win.parentNode.classList.add( 'Closing', 'NoEvents' );
		}
		// win == "content"
		else if( win.parentNode.parentNode.classList.contains( 'ViewContainer' ) )
		{
			win.parentNode.parentNode.classList.add( 'Closing', 'NoEvents' );
		}
		
		if( win.parentNode.classList.contains( 'Dialog' ) || 
			win.parentNode.parentNode.classList.contains( 'Dialog' ) ||
			win.parentNode.parentNode.classList.contains( 'FileDialog' ) )
		{
			isDialog = true;
			let qm = null;
			if( ( qm = win.parentNode.querySelector( '.QuickMenu' ) ) )
			{
				qm.classList.remove( 'Showing' );
				ge( 'DoorsScreen' ).appendChild( qm );
			}
			
			let currentIsDialog = false;
			if( currentMovable )
			{
			    let cr = currentMovable;
			    if( cr.parentNode.classList.contains( 'Dialog' ) || 
			        cr.parentNode.parentNode.classList.contains( 'Dialog' ) ||
			        cr.parentNode.parentNode.classList.contains( 'FileDialog' ) )
		        {
		            currentIsDialog = true;
		        }
			}
			
			if( win == currentMovable || currentIsDialog )
				document.body.classList.remove( 'Dialog' );
		}
		
		// Single task
		if( win.windowObject.getFlag( 'singletask' ) )
		{
			document.body.classList.remove( 'Singletask' );
		}
		
		// Unassign this
		if( win.parentNode == Friend.currentWindowHover )
			Friend.currentWindowHover = null;
		
		// Check virtual workspace information
		if( win.workspace )
		{
			// Unset if the active window is this to be closed..
			if( virtualWorkspaces[ win.workspace ] )
			{
				if( virtualWorkspaces[ win.workspace ].activeWindow == win )
					virtualWorkspaces[ win.workspace ].activeWindow = null;
			}
		}
		
		let count = 0;

		let isGroupMember = false;
		if( win.groupMember )
			isGroupMember = true;

		while( !HasClassname( win, 'View' ) && win != document.body )
		{
			win = win.parentNode;
		}

		// Clear view that is closed from view history
		let out = [];
		for( let a = 0; a < Friend.GUI.view.viewHistory.length; a++ )
		{
			if( Friend.GUI.view.viewHistory[a] != win )
				out.push( Friend.GUI.view.viewHistory[a] );
		}
		Friend.GUI.view.viewHistory = out;

		let div = win;

		// Unsnap
		if( win.unsnap ) win.unsnap();
		
		if( win.attached )
		{
			for( var a = 0; a < win.attached.length; a++ )
			{
				if( win.attached[a].unsnap )
					win.attached[a].unsnap();
			}
		}
		
		let appId = win.windowObject ? win.windowObject.applicationId : false;

		// Clear reference
		if ( window.regionWindow == div.content )
			window.regionWindow = false;

		let app = false;
		if( div.applicationId )
			app = _getAppByAppId( div.applicationId );

		if( app && div == app.displayedView )
			app.displayedView = null;

		if( !isGroupMember && div.parentNode )
		{
			// Immediately kill child views for mobile!
			if( isMobile && window._getAppByAppId )
			{
				if( app.mainView == div.windowObject )
				{
					for( let a in app.windows )
					{
						if( app.windows[ a ] != div.windowObject )
						{
							if( app.windows[ a ]._window.parentNode && app.windows[ a ]._window.parentNode.parentNode )
							{
								let elef = app.windows[ a ]._window.parentNode.parentNode;
								if( elef.classList && elef.classList.contains( 'View' ) || elef.classList.contains( 'ViewContainer' ) )
								{
									app.windows[ a ]._window.parentNode.parentNode.style.display = 'none';
								}
							}
						}
					}
				}
			}
			
			// Animate closing
			setTimeout( function()
			{
				if( div.viewContainer.parentNode )
				{
					div.viewContainer.parentNode.removeChild( div.viewContainer );
				}
				else if( div.parentNode )
				{
					div.parentNode.removeChild( div );
				}
				CheckMaximizedView();
			}, isMobile ? 750 : 500 );

			if( !isMobile )
			{
				div.style.opacity = 0;
				if( window.DeepestField )
					DeepestField.cleanTasks();
			}


			// Do not click!
			let ele = document.createElement( 'div' );
			ele.style.position = 'absolute';
			ele.style.top = '0'; ele.style.left = '0';
			ele.style.width = '100%'; 
			ele.style.height = '100%';
			ele.style.background = 'rgba(0,0,0,0.0)';
			ele.onmousedown = function( e ){ return cancelBubble( e ); }
			ele.style.zIndex = 7867878;
			div.appendChild( ele );
		}
		
		// Context -------------------------------------------------------------
		// Check the window recent location exists, and use it instead
		if( ( currentMovable && currentMovable == win ) || ( !currentMovable && win ) )
		{
			if( win.windowObject && win.windowObject.recentLocation && win.windowObject.recentLocation.substr( 0, 7 ) == 'viewId:' )
			{
				let id = win.windowObject.recentLocation;
				id = id.substr( 7, id.length - 7 );
				let actSet = false;
				for( let z in movableWindows )
				{
					if( movableWindows[ z ].windowObject && movableWindows[ z ].windowObject.getViewId() == id )
					{
						currentMovable = movableWindows[ z ];
						_ActivateWindow( currentMovable );
						if( typeof( window.currentContext ) == 'object' && window.currentContext.length > 1 )
							window.currentContext = window.currentContext[ 1 ];
						else window.currentContext = false;
						actSet = true;
						break;
					}
				}
				if( !actSet )
				{
					// Default
					_DeactivateWindows();
				    showDashboard();
				    setTimeout( function(){ showDashboard(); }, 150 );
			    }
			}
			// Check the window context, if it exists
			//console.log( 'Foo bar', window.currentContext );
			if( window.currentContext )
			{
			    //console.log( 'Test' );
			    function handleContext( depth )
				{
					if( !depth ) depth = 1;
				    switch( window.currentContext )
				    {
				        case 'dashboard':
				            _DeactivateWindows();
					        showDashboard();
					        break;
				        case 'sidebar':
				            _DeactivateWindows();
				            hideDashboard();
		                	break;
		            	// We have a different thing for other contexts
		                default:
		                    let appCheck = true;
		                    //console.log( 'Checking context: ', window.currentContext );
		                    // We got a context array ([ currentWindow, prevContext ])
		                    if( typeof( window.currentContext ) == 'object' )
		                    {
		                        // We are referring to self! Fix it
		                        if( window.currentContext[0] == win && typeof( window.currentContext[1] ) != 'undefined' )
		                        {
		                            //console.log( 'I am self: ', window.currentContext );
		                            window.currentContext = window.currentContext[1];
	                                if( window.currentContext == 'dashboard' )
	                                {
	                                    return handleContext( depth + 1 );
	                                }
	                            }
	                            
	                            
		                    	if( window.currentContext[0] && window.currentContext[0].tagName == 'DIV' && window.currentContext[0] != currentMovable )
		                    	{
		                    		currentMovable = window.currentContext[ 0 ];
		                    		_ActivateWindow( window.currentContext[ 0 ] );
		                    		if( window.currentContext[ 0 ].content && window.currentContext[ 0 ].content.refresh )
		                    			window.currentContext[ 0 ].content.refresh();
		                    		return;
		                    	}
		                    	else if( window.currentContext.length > 1 )
		                    	{
		                    		if( typeof( window.currentContext[ 1 ] ) != 'undefined' )
		                    		{
						                window.currentContext = window.currentContext[ 1 ];
						                return handleContext( depth + 1 );
					                }
			                    }
		                    }
		                    if( appId && appCheck )
		                    {
		                        for( let a = Friend.GUI.view.viewHistory.length - 1; a >= 0; a-- )
								{
									if( Friend.GUI.view.viewHistory[ a ].applicationId == appId )
									{
										// Only activate non minimized views
										if( Friend.GUI.view.viewHistory[a].viewContainer && !Friend.GUI.view.viewHistory[a].viewContainer.getAttribute( 'minimized' ) )
										{
											let vh = Friend.GUI.view.viewHistory[ a ];
											currentMovable = vh;
											_ActivateWindow( vh );
											if( vh.content && vh.content.refresh )
												vh.content.refresh();
											nextActive = true;
										}
										break;
									}
								}
		                    }
		                    break;
				    }
			    }
			    handleContext();
			}
			// Context end ---------------------------------------------------------
			else
			{
				// Activate latest activated view (not on mobile)
				let nextActive = false;
				if( div.classList.contains( 'Active' ) || div.windowObject.getFlag( 'dialog' ) )
				{
					if( Friend.GUI.view.viewHistory.length )
					{
						// Only activate last view in the same app
						if( appId )
						{
							for( let a = Friend.GUI.view.viewHistory.length - 1; a >= 0; a-- )
							{
								if( Friend.GUI.view.viewHistory[ a ].applicationId == appId )
								{
									// Only activate non minimized views
									if( Friend.GUI.view.viewHistory[a].viewContainer && !Friend.GUI.view.viewHistory[a].viewContainer.getAttribute( 'minimized' ) )
									{
										let vh = Friend.GUI.view.viewHistory[ a ];
										currentMovable = vh;
										_ActivateWindow( vh );
										if( vh.content && vh.content.refresh )
											vh.content.refresh();
										nextActive = true;
									}
									break;
								}
							}
						}
						else
						{
							for( let a = Friend.GUI.view.viewHistory.length - 1; a >= 0; a-- )
							{
								if( Friend.GUI.view.viewHistory[ a ].windowObject.workspace == globalConfig.workspaceCurrent )
								{
									if( Friend.GUI.view.viewHistory[ a ].windowObject.getFlag( 'sidebarManaged' ) ) continue;
									// Only activate non minimized views
									if( Friend.GUI.view.viewHistory[a].viewContainer && !Friend.GUI.view.viewHistory[a].viewContainer.getAttribute( 'minimized' ) )
									{
										let vh = Friend.GUI.view.viewHistory[ a ];
										currentMovable = vh;
										_ActivateWindow( vh );
										if( vh.content && vh.content.refresh )
											vh.content.refresh();
										nextActive = true;
									}
									break;
								}
							}
						}
					}
				}
			}
		}
		
		if( div )
		{
			// Clean up ids
			let o = [];
			for( let b in movableWindows )
			{
				if( movableWindows[b] != div && movableWindows[b].parentNode )
				{
					o[b] = movableWindows[b];
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
		if( win == window.currentMovable ) window.currentMovable = null;
		
		// Make sure we count the windows in body
		if( movableWindowCount > 0 )
		{
			if( window.windowCountTimeout )
			{
				clearTimeout( window.windowCountTimeout );
				delete window.windowCountTimeout;
			}
			document.body.setAttribute( 'windowcount', movableWindowCount );
		}
		else
		{
			// Delay this with 400ms
			window.windowCountTimeout = setTimeout( function()
			{
				document.body.removeAttribute( 'windowcount' );
			}, 400 );
		}
		
		// Dashboard support
		if( win.windowObject.recentLocation && win.windowObject.recentLocation  != 'dashboard' )
		{
			return;
		}
		
		if( !currentMovable || ( currentMovable && currentMovable.windowObject.getFlag( 'dockable' ) && window.showDashboard ) )
		{
			if( window.showDashboard )
			{
				_DeactivateWindows();
				showDashboard();
				if( window.pollLiveViews )
					pollLiveViews();
				return;
			}
		}
		
		if( app && isMobile && app.mainView && app.mainView != win.windowObject )
		{
			app.mainView.activate( 'force' );
		}
		// We have a parent view
		else if( win.parentView )
		{
			win.parentView.activate( 'force' );
		}
		// Just make sure we have a view on the workspace
		else if( app && isMobile )
		{
			for( var a in app.windows )
			{
				if( app.windows[ a ].activate )
					app.windows[ a ].activate( 'force' );
				break;
			}
		}
	}

	if( !window.currentMovable )
	{
		if( Workspace.screen && Workspace.screen.getFlag )
		{
			document.title = Workspace.screen.getFlag( 'title' );
		}
	}

	// Check window
	CheckScreenTitle();
	
	if( isMobile && Workspace.redrawIcons )
		Workspace.redrawIcons();
	
	if( !currentMovable )
	{
	    // If we have a dashboard
		if( window.showDashboard )
		    showDashboard();
		if( window.pollLiveViews )
			pollLiveViews();
	}
	else
	{
		if( window.pollLiveViews )
			pollLiveViews();
	}
}
// Obsolete!!!
CloseWindow = CloseView;

// TODO: Detect if the scrolling is done with the mouse hovering over a window
function CancelWindowScrolling( e )
{
	if ( !e ) e = window.event;
	let t = e.target ? e.target : e.srcElement;
	if ( window.currentMovable && window.currentMovable.offsetHeight )
		window.scrollTo ( 0, window.lastScrollPosition ? window.lastScrollPosition : 0 );
	else window.lastScrollPosition = document.body.scrollTop;
	return true;
}
if ( window.addEventListener )
	window.addEventListener( 'scroll', CancelWindowScrolling, true );
else window.attachEvent( 'onscroll', CancelWindowScrolling, true );

// Support scrolling in windows
function WindowScrolling( e )
{
	if( !e ) e = window.event;
	let dlt = e.detail ? (e.detail*-120) : e.wheelDelta;
	let tr = e.srcElement ? e.srcElement : e.target;
	let win = false;
	while( tr != document.body )
	{
		if( tr.className && tr.className.indexOf ( 'View' ) > 0 )
		{
			win = tr;
			break;
		}
		tr = tr.parentNode;
	}
}

// The View class begins -------------------------------------------------------

// Attach view class to friend
Friend.GUI.view.create = View;
Friend.GUI.view.removeScriptsFromData = function( data )
{
	let r = false;
	let assets = [];
	while( r = data.match( /\<script id\=\"([^"]*?)\" type\=\"text\/html\"[^>]*?\>([\w\W]*?)\<\/script[^>]*?\>/i ) )
	{
		let asset = '<script id="' + r[1] + '" type="text/html">' + r[2] + '</script>';
		data = data.split( r[0] ).join( '' );
	}
	// Remove scripts
	data = data.split( /\<script[^>]*?\>[\w\W]*?\<\/script[^>]*?\>/i ).join ( '' );
	// Add assets
	if( assets.length > 0 )
		data += assets.join( "\n" );
	return data;
};
Friend.GUI.view.cleanHTMLData = function( data )
{
	// Allow for "script" template assets
	data = Friend.GUI.view.removeScriptsFromData( data );
	data = data.split( /\<style[^>]*?\>[\w\W]*?\<\/style[^>]*?\>/i ).join ( '' );
	return data;
};

// View class (the javascript way)
// TODO: Fix opening windows with no preset id (right now, window does not appear)
// TODO: Fix opening windows with id, to close and kill its application if already running app with unique id



/**
 * View class
 *
 * The View class is used to created views/windows in Friend - it is the most used class to build the user interface
 *
 * The View class has a sibling, the Screen class that creates a new Friend screen.
 *
 *
 *
 * @param args - an object containing the initial parameters for the view. As an absolute minium title, width and height should be provided
 * @return View - a pointer to the new instance that justhas been created
 *
 */
var View = function( args )
{
	let self = this;
	
	// Windows on own screen ignores the virtual workspaces
	if( args.screen && args.screen != Workspace.screen )
	{
		if( globalConfig && typeof( globalConfig.workspaceCurrent ) != 'undefined' )
			this.workspace = globalConfig.workspaceCurrent;
		else this.workspace = 0;
	
		if( args.workspace === 0 || args.workspace )
		{
			if( args.workspace < globalConfig.workspacecount - 1 )
			{
				this.workspace = args.workspace;
			}
		}
	}
	
	// Special hook for dashboard related workspace
	if( window.hideDashboard && ( !args || !args.invisible ) )
	{
		let newApp = true;
		if( args.applicationId )
		{
			for( let a in Workspace.applications )
			{
				let app = Workspace.applications[ a ];
				if( app.applicationId == args.applicationId )
				{
					let count = 0;
					for( let b in app.windows )
					{
						count++;
						if( count > 1 )
						{
							newApp = false;
							break;
						}
					}
				}
			}
		}
		if( newApp )
			window.hideDashboard();
	}
	
	// Start off
	if( !args )
		args = {};
	this.args = args;

	this.widgets = []; // Widgets stuck to this view window

	// Reaffirm workspace
	this.setWorkspace = function()
	{
		// Ignore windows on own screen
		if( this.flags && this.flags.screen && this.flags.screen != Workspace.screen ) return;
		if( globalConfig.workspacecount > 1 )
		{
			let ws = this.getFlag( 'left' );
			ws = parseInt( ws ) / window.innerWidth;
			this.workspace = Math.floor( ws );
		}
	}
	
	// Create event functions on content
	this.createContentEventFuncs = function( cont )
	{
		// Create event handler for view window
		if( !cont.events )
			cont.events = new Array ();
		cont.AddEvent = function( event, func )
		{
			if( typeof(this.events[event]) == 'undefined' )
				this.events[event] = [];
			this.events[event].push( func );
			return func;
		}
		cont.RemoveEvent = function( event, func )
		{
			if( typeof( this.events[event] ) == 'undefined' ) return false;
			let o = [];
			let found = false;
			for( var a in this.events[event] )
			{
				if( this.events[event][a] != func )
				{
					o.push( this.events[event][a] );
				}
				else found = true;
			}
			this.events[event] = o;
			return found;
		}
	}

	// Clean data
	this.cleanHTMLData = Friend.GUI.view.cleanHTMLData;
	this.removeScriptsFromData = Friend.GUI.view.removeScriptsFromData;

	// Setup the dom elements
	// div = existing DIV dom element or 'CREATE'
	// titleStr = title string
	// width = width
	// height = height (in pixels)
	// id = window id
	// flags = list of constructor flags
	// applicationId = app id..
	this.createDomElements = function( div, titleStr, width, height, id, flags, applicationId, parentOverride = false )
	{
		if( this.created ) 
		{
			return;
		}
		this.created = true;
		if ( !div ) return false;
		
		// Native mode? Creates a new place for the view
		this.nativeWindow = false;

		// If we're making a movable window with a unique id, the make sure
		// it doesn't exist, in case, just return the existing window
		let contentscreen = false;
		let parentWindow = false;
		if( !titleStr )
			titleStr = '';
		let transparent = false;

		let filter = [
			'min-width', 'min-height', 'width', 'height', 'id', 'title', 
			'screen', 'parentView', 'transparent', 'minimized', 'dialog', 
			'standard-dialog', 'sidebarManaged'
		];

		if( !flags.screen )
		{
			flags.screen = Workspace.screen;
		}

		// This needs to be set immediately!
		self.parseFlags( flags, filter );
		
		let app = false;
		if( window._getAppByAppId )
		{
			let app = _getAppByAppId( div.applicationId );
		}
		
		// Set a parent relation to main view
		if( app && app.mainView	)
		{
			self.parentView = app.mainView;
		}
		
		// Set initial workspace
		if( !flags.screen || flags.screen == Workspace.screen )
		{
			if( flags.workspace && flags.workspace > 0 )
			{
				self.workspace = flags.workspace;
			}
			else
			{
				self.workspace = globalConfig.workspaceCurrent;
			}
		}
		
		if( !self.getFlag( 'min-width' ) )
			this.setFlag( 'min-width', 100 );
		if( !self.getFlag( 'min-height' ) )
			this.setFlag( 'min-height', 100 );
		
		// Get newly parsed flags
		width = self.getFlag( 'width' );
		height = self.getFlag( 'height' );
		
		id = self.getFlag( 'id' );
		titleStr = self.getFlag( 'title' );
		if( !titleStr ) titleStr = 'Unnamed window';
		contentscreen = self.getFlag( 'screen' );
		parentWindow = self.getFlag( 'parentView' );
		transparent = self.getFlag( 'transparent' );
		
		// Clean ID
		if( !id )
		{
			id = titleStr.split( /[^a-z0-9]+/i ).join( '_' );
			if( id.substr( 0, 1 ) == '_' )
				id = 'win' + id;
			let tmp = id;
			let num = 2;
			while( typeof ( movableWindows[ tmp ] ) != 'undefined' )
			{
				tmp = id + '_' + (num++);
			}
			id = tmp;
		}
		// Clean ID
		else
		{
			id = id.split( /[^a-z0-9]+/i ).join( '_' );
			if( id.substr( 0, 1 ) == '_' )
				id = 'win' + id;
		}

		// Make a unique id
		let uniqueId = id;
		uniqueId = uniqueId.split( /[ |:]/i ).join ( '_' );

		// Where to add div..
		let divParent = false;
		let iconSpan;
		let viewContainer = null;

		// Window is already taken
		if( id && typeof( movableWindows[ id ] ) != 'undefined' )
			return false;

		if( id )
		{
			// Make a container to put the view div inside of
			viewContainer = document.createElement( 'div' );
			viewContainer.className = 'ViewContainer';
			viewContainer.style.display = 'none';
			
			// Set up view title
			let viewTitle = document.createElement( 'div' );
			viewTitle.className = 'ViewTitle';
			viewContainer.appendChild( viewTitle );
			
			// Get icon for visualizations
			if( applicationId )
			{
				for( var a = 0; a < Workspace.applications.length; a++ )
				{
					if( Workspace.applications[a].applicationId == applicationId )
					{
						if( Workspace.applications[a].icon )
						{
							let ic = Workspace.applications[a].icon;
							iconSpan = document.createElement( 'span' );
							iconSpan.classList.add( 'ViewIcon' );
							iconSpan.style.backgroundImage = 'url(\'' + ic + '\')';
							self.viewIcon = iconSpan;
							viewContainer.appendChild( iconSpan );
						}
					}
				}
				
				// Add mobile back button
				if( isMobile )
				{
					let md = document.createElement( 'div' );
					md.className = 'MobileBack';
					self.mobileBack = md;
					md.ontouchstart =function( e )
					{
						if( window._getAppByAppId )
						{
							let app = _getAppByAppId( div.applicationId );
							if( app.mainView )
							{
								FocusOnNothing();
								_ActivateWindow( app.mainView.content.parentNode );
								self.close();
								return cancelBubble( e );
							}
						}
						return cancelBubble( e );
					};
					viewContainer.appendChild( md );
				}
			}
			else
			{
				iconSpan = document.createElement( 'span' );
				iconSpan.classList.add( 'ViewIcon' );
				self.viewIcon = iconSpan;
				iconSpan.style.backgroundImage = 'url(/iconthemes/friendup15/Folder.svg)';
				viewContainer.appendChild( iconSpan );
				
				// Add mobile back button
				if( isMobile )
				{
					let md = document.createElement( 'div' );
					md.className = 'MobileBack';
					self.mobileBack = md;
					md.ontouchstart =function( e )
					{
						if( window._getAppByAppId )
						{
							let app = _getAppByAppId( div.applicationId );
							if( app.mainView )
							{
								FocusOnNothing();
								_ActivateWindow( app.mainView.content.parentNode );
								self.close();
								return cancelBubble( e );
							}
						}
						return cancelBubble( e );
					};
					viewContainer.appendChild( md );
				}
				
			}
			
			if( div == 'CREATE' )
			{	
				div = document.createElement( 'div' );
				
				if( applicationId ) div.applicationId = applicationId;
				div.parentWindow = false;
				
				// Native mode probably
				if( parentOverride )
				{
					divParent = parentOverride;
				}
				else if( parentWindow )
				{
					divParent = parentWindow._window;
					div.parentWindow = parentWindow;
				}
				// Defined screen (and we're not in multiple workspaces)
				else if( contentscreen )
				{
					divParent = contentscreen.contentDiv ? contentscreen.contentDiv : contentscreen.div;
				}
				else if( typeof ( window.currentScreen ) != 'undefined' )
				{
					divParent = window.currentScreen;
				}
				else 
				{
					divParent = document.body;
				}
			}
			
			div.viewTitle = viewTitle;
			
			// Designate
			movableWindows[ id ] = div;
			div.titleString = titleStr;
			div.viewId = id;
			
			if( !flags.screen || flags.screen == Workspace.screen )
			{
				div.workspace = self.workspace;
			}
			else div.workspace = 0;
		}
		else if ( div == 'CREATE' )
		{
			div = document.createElement ( 'div' );
			if( applicationId ) div.applicationId = applicationId;
			div.parentWindow = false;
			// Native mode probably
			if( parentOverride )
			{
				divParent = parentOverride;
			}
			else if( parentWindow )
			{
				divParent = parentWindow._window;
				div.parentWindow = parentWindow;
			}
			// Defined screen (and we're not in multiple workspaces)
			else if( contentscreen )
			{
				divParent = contentscreen.contentDiv ? contentscreen.contentDiv : contentscreen.div;
			}
			else if( typeof( window.currentScreen ) != 'undefined' )
			{
				divParent = window.currentScreen;
			}
			else
			{
				divParent = document.body;
			}
			if( divParent.object && divParent.object._screen )
			{
				divParent = divParent.object._screen;
			}

			// ID must be unique
			let num = 0;
			let oid = id;
			while( ge( id ) )
				id = oid + '_' + ++num;

			div.id = id ? id : ( 'window_' + Friend.GUI.view.movableViewIdSeed++ );
			div.viewId = div.id;
			movableWindows[ div.id ] = div;
		}
		// Just register the view
		else
		{
			movableWindows[ div.id ] = div;
		}

		if( isMobile )
			Workspace.exitMobileMenu();

        // Set placeholder quickmenu
        div.quickMenu = {
            uniqueName: 'placeholder_' + ( div.id ? div.id : MD5( Math.random() * 1000 + ( Math.random() * 1000 ) + '' ) ),
            0: {
                name: i18n( 'i18n_close' ),
                icon: 'remove',
                command: function()
                {
                	div.windowObject.close();
                }
            }
        };

		// Check to set mainview
		if( window._getAppByAppId )
		{
			let app = _getAppByAppId( this.applicationId );
			if( app )
			{
				let l = 0; for( var k in app.windows ) l++;
				// If we only have one window - it's probably the main window
				if( l == 0 )
				{
					this.setFlag( 'mainView', true );
				}
			}
		}

		// Tell it's opening (not minimized or invisible ones)
		if( !flags.minimized && !flags.invisible )
		{
			// Allow initialized
			if( window.currentMovable )
			{
				viewContainer.classList.add( 'Initialized' );
				setTimeout( function()
				{
					viewContainer.classList.remove( 'Initialized' );
				}, 25 );
			}
			// Allow opening animation
			viewContainer.classList.add( 'Opening' );
			div.classList.add( 'Opening' );
			setTimeout( function()
			{
				div.classList.add( 'Opened' );
				div.classList.remove( 'Opening' );
				setTimeout( function()
				{
					div.classList.remove( 'Opened' );
					// Give last call to port
					div.classList.add( 'Redrawing' );
					setTimeout( function()
					{
						viewContainer.classList.remove( 'Opening' );
						div.classList.remove( 'Redrawing' );
					}, 250 );
				}, 250 );
			}, 250 );
		}

		if( transparent )
		{
			div.setAttribute( 'transparent', 'transparent' );
		}
		
		if( !flags.minimized )
		{
			div.style.transform = 'translate3d(0, 0, 0)';
		}

		let zoom; // for use later - zoom gadget

		let html = div.innerHTML;
		let contn = document.createElement( 'div' );
		contn.windowObject = this;
		div.windowObject = this;
		this._window = contn;
		
		// Set up view states
		// TODO: More to come!
		this.states = {
			'input-focus': false
		};
		
		contn.className = 'Content';
		contn.innerHTML = html;


		// Assign content element to both div and view object
		div.content = contn;
		self.content = contn;
		
		// Title
		let titleSpan = document.createElement ( 'span' );
		titleSpan.innerHTML = titleStr ? titleStr : '- unnamed -';

		contn.applicationId = applicationId;
		
		// Virtual window, not for display
		if( flags.virtual )
		{
			div.classList.add( 'Virtual' );
		}

		div.innerHTML = '';

		// Register mouse over and out
		if( !window.isMobile )
		{
			div.addEventListener( 'mouseover', function( e )
			{
				// Keep track of the previous
				if( typeof( Friend.currentWindowHover ) != 'undefined' && Friend.currentWindowHover )
					Friend.previousWindowHover = Friend.currentWindowHover;
				Friend.currentWindowHover = div;
			
				if( !div.classList.contains( 'Active' ) )
				{
					// Reactivate all iframes
					let fr = div.windowObject.content.getElementsByTagName( 'iframe' );
					for( let a = 0; a < fr.length; a++ )
					{
						if( fr[ a ].oldSandbox && typeof( fr[ a ].oldSandbox ) == 'string' )
							fr[ a ].setAttribute( 'sandbox', fr[ a ].oldSandbox );
					}
				}
			
				// Focus on desktop if we're not over a window.
				if( Friend.previousWindowHover && Friend.previousWindowHover != div )
				{
					// Check first if are focused on an input field
					// If we are, don't focus on nothing!
					if( !Friend.GUI.checkWindowState( 'input-focus' ) )
					{
						// TODO: If this is an input element, do not lose focus
						// unless needed. E.g. changing window.
						//var currentFocus = document.activeElement;
						window.focus();
					}
				}
			} );
			div.addEventListener( 'mouseout', function()
			{
				if( !div.classList.contains( 'Active' ) )
				{
					// Reactivate all iframes
					let fr = div.windowObject.content.getElementsByTagName( 'iframe' );
					for( let a = 0; a < fr.length; a++ )
					{
						fr[ a ].setAttribute( 'sandbox', 'allow-scripts' );
					}
				}
				
				// Keep track of the previous
				if( Friend.currentWindowHover )
					Friend.previousWindowHover = Friend.currentWindowHover;
				Friend.currentWindowHover = null;
			} );
		}

		if ( !div.id )
		{
			// ID must be unique
			let num = 0;
			let oid = id;
			while( ge( id ) )
				id = oid + '_' + ++num;
			div.id = id;
			movableWindows[ div.id ] = div;
		}

		// Volume gauge
		if( flags.volume && flags.volume != false )
		{
			let gauge = document.createElement( 'div' );
			gauge.className = 'VolumeGauge';
			gauge.innerHTML = '<div class="Inner"><div class="Pct"></div></div>';
			div.appendChild( gauge );
			div.volumeGauge = gauge.getElementsByTagName( 'div' )[0];
		}

		// Snap elements
		let snap = document.createElement( 'div' );
		snap.className = 'Snap';
		snap.innerHTML = '<div class="SnapLeft"></div><div class="SnapRight"></div>' +
			'<div class="SnapUp"></div><div class="SnapDown"></div>';

		// Moveoverlay
		let molay = document.createElement ( 'div' );
		molay.className = 'MoveOverlay';
		molay.onmouseup = function()
		{
			WorkspaceMenu.close();
		}

		// Clean up!
		Friend.GUI.view.cleanWindowArray( div );

		// Title
		let title = document.createElement ( 'div' );
		title.className = 'Title';
		if( flags.resize == false )
			title.className += ' NoResize';

		// Resize
		let resize = document.createElement ( 'div' );
		resize.className = 'Resize';
		resize.style.position = 'absolute';
		resize.style.width = '14px';
		resize.style.height = '14px';
		resize.style.zIndex = '100';

		let inDiv = document.createElement( 'div' );

		title.appendChild( inDiv );

		title.onclick = function( e ){ return cancelBubble ( e ); }
		title.ondragstart = function( e ) { return cancelBubble ( e ); }
		title.onselectstart = function( e ) { return cancelBubble ( e ); }

		if( !isMobile )
		{
			title.onmousedown = function( e, mode )
			{
				if ( !e ) e = window.event;
				
				div.setAttribute( 'moving', 'moving' );

				// Use correct button
				if( e.button != 0 && !mode ) return cancelBubble( e );

				let x, y;
				if( e.touches && ( isTablet || isTouchDevice() ) )
				{
					x = e.touches[0].pageX;
					y = e.touches[0].pageY;
				}
				else
				{
					x = e.clientX ? e.clientX : e.pageXOffset;
					y = e.clientY ? e.clientY : e.pageYOffset;
				}
				window.mouseDown = FUI_MOUSEDOWN_WINDOW;
				this.parentNode.offx = x - this.parentNode.offsetLeft;
				this.parentNode.offy = y - this.parentNode.offsetTop;
				_ActivateWindow( div, false, e );
			
				if( e.shiftKey && div.snapObject )
				{
					div.unsnap();
				}
				
				// Make sure the tray is updated
				PollTray();
			
				return cancelBubble( e );
			}

			// Pawel must win!
			let method = 'ondblclick';
			if( document.body.classList.contains( 'ThemeEngine' ) )
			{
			    method = 'onclick';
			    title.style.cursor = 'pointer';
			}
			title[ method ] = function( e )
			{
				if( self.flags.clickableTitle )
				{
					if( !self.titleClickElement )
					{
						let d = document.createElement( 'input' );
						d.type = 'text';
						d.className = 'BackgroundHeavier NoMargins Absolute';
						d.style.position = 'absolute';
						d.style.outline = 'none';
						d.style.border = '0';
						d.style.top = '0px';
						d.style.left = '0px';
						d.style.width = '100%';
						d.style.height = '100%';
						d.style.textAlign = 'center';
						d.style.pointerEvents = 'all';
						d.value = contn.fileInfo.Path;
						d.onkeydown = function( e )
						{
							self.flags.editing = true;
							setTimeout( function()
							{
								self.flags.editing = false;
							}, 150 );
						}
						d.onblur = function()
						{
							d.parentNode.removeChild( d );
							self.titleClickElement = null;
						}
						d.onchange = function( e )
						{
							let t = this;
							let f = ( new Door() ).get( this.value );
							if( f )
							{
								f.getIcons( this.value, function( items )
								{
									if( items )
									{
										self.content.fileInfo.Path = t.value;
										self.content.refresh();
									}
									else
									{
										t.value = contn.fileInfo.Path;
									}
								} );
							}
							else
							{
								t.value = contn.fileInfo.Path;
							}
						}
						this.getElementsByTagName( 'SPAN' )[0].appendChild( d );
						self.titleClickElement = d;
					}
					self.titleClickElement.focus();
					self.titleClickElement.select();
				}
				_WindowToFront( div );
			}
		}

		// Clicking on window
		div.onmousedown = function( e )
		{
			if( e.button == 0 )
			{
				if( !this.viewIcon.classList.contains( 'Remove' ) )
				{
					if( isMobile )
					{
						let target = this;
						if( window._getAppByAppId )
						{
							let app = _getAppByAppId( this.applicationId );
							if( app && app.displayedView )
							{
								target = app.displayedView;
							}
						}
						_ActivateWindow( target, false, e );
						return;
					}
					_ActivateWindow( this, false, e );
				}
			}
		}

		// Tablets and mobile
		div.ontouchstart = function( e )
		{
			let self = this;
			
			if( isMobile && !self.parentNode.classList.contains( 'OnWorkspace' ) )
				return;
			
			else if( e && !div.classList.contains( 'Active' ) )
			{
				this.clickOffset = {
					x: e.touches[0].clientX,
					y: e.touches[0].clientY,
					time: ( new Date() ).getTime()
				};
			}
			
			// Start jiggling on longpress
			// Only removable after 300 ms
			this.touchInterval = setInterval( function()
			{
				let t = ( new Date() ).getTime();
				if( self.clickOffset )
				{
					if( t - self.clickOffset.time > 100 )
					{
						// Update time
						self.clickOffset.removable = true;
						self.viewIcon.parentNode.classList.add( 'Flipped' );
						self.viewIcon.classList.add( 'Dragging' );
						clearInterval( self.touchInterval );
						self.touchInterval = null;
					
						if( !isTablet || isMobile )
						{
							self.viewIcon.classList.add( 'Remove' );
							self.classList.add( 'Remove' );
						}
					}
				}
			}, 150 );
		}
		
		// Remove window on drag
		if( isMobile )
		{
			div.ontouchend = function( e )
			{
				if( this.touchInterval )
				{
					clearInterval( this.touchInterval );
					this.touchInterval = null;
				}
				// Only cancel bubble if view icon is jiggling on mobile
				if( this.viewIcon.classList.contains( 'Remove' ) )
				{
					return cancelBubble( e );
				}
			}
		}
		
		// Transparency
		if( flags.transparent )
		{
			contn.style.background = 'transparent';
			contn.style.backgroundColor = 'transparent';
		}

		// Depth gadget
		let depth = document.createElement( 'div' );
		depth.className = 'Depth';
		depth.onmousedown = function( e ) { return e.stopPropagation(); }
		depth.ondragstart = function( e ) { return e.stopPropagation(); }
		depth.onselectstart = function( e ) { return e.stopPropagation(); }
		depth.window = div;
		depth.onclick = function( e )
		{
			if( !window.isTablet && e.button != 0 ) return;
			
			// Calculate lowest and highest z-index
			let low = 99999999;	let high = 0;
			for( var a in movableWindows )
			{
				let maxm = movableWindows[a].getAttribute( 'maximized' );
				if( maxm && maxm.length )
					continue;
				let ind = parseInt( movableWindows[a].viewContainer.style.zIndex );
				if( ind < low ) low = ind;
				if( ind > high ) high = ind;
			}
			movableHighestZindex = high;

			// If we are below, get us on top
			if ( movableHighestZindex > parseInt( this.window.style.zIndex ) )
			{
				this.window.viewContainer.style.zIndex = ++movableHighestZindex;
				this.window.style.zIndex = this.window.viewContainer.style.zIndex;
			}
			// If not, don't
			else
			{
				this.window.viewContainer.style.zIndex = 100;
				let highest = 0;
				for( var a in movableWindows )
				{
					if( movableWindows[a] != this.window )
					{
						movableWindows[a].viewContainer.style.zIndex = parseInt( movableWindows[a].viewContainer.style.zIndex ) + 1;
						movableWindows[a].style.zIndex = movableWindows[a].viewContainer.style.zIndex;
						if ( parseInt( movableWindows[a].viewContainer.style.zIndex ) > highest )
							highest = parseInt( movableWindows[a].viewContainer.style.zIndex );
					}
				}
				movableHighestZindex = highest;
			}
			_ActivateWindow( this.window, false, e );

			// Fix it!
			UpdateWindowContentSize( div );

			return cancelBubble ( e );
		}

		// Bottom of the window
		let bottombar = document.createElement ( 'div' );
		bottombar.className = 'BottomBar';

		// Left border of window
		let leftbar = document.createElement ( 'div' );
		leftbar.className = 'LeftBar';

		// Left border of window
		let rightbar = document.createElement ( 'div' );
		rightbar.className = 'RightBar';

		// Zoom gadget
		if( !isMobile )
		{
			zoom = document.createElement ( 'div' );
			zoom.className = 'Zoom';
			zoom.onmousedown = function ( e ) { return cancelBubble ( e ); }
			zoom.ondragstart = function ( e ) { return cancelBubble ( e ); }
			zoom.onselectstart = function ( e ) { return cancelBubble ( e ); }
			zoom.mode = 'normal';
			zoom.window = div;
			zoom.onclick = function ( e )
			{
				if( !window.isTablet && e.button != 0 ) return;
				
				// Don't animate
				div.setAttribute( 'moving', 'moving' );
				setTimeout( function()
				{
					div.removeAttribute( 'moving' );
				}, 50 );
			
				if( this.mode == 'normal' )
				{
					if( movableHighestZindex > parseInt( this.window.viewContainer.style.zIndex ) )
					{
						this.window.viewContainer.style.zIndex = ++movableHighestZindex;
						this.window.style.zIndex = this.window.viewContainer.style.zIndex;
					}

					_ActivateWindow( this.window, false, e );

					this.window.setAttribute( 'maximized', 'true' );
					
					// Check tiling
					_setWindowTiles( div );
					
					// Tell app
					if( window._getAppByAppId )
					{
						let app = _getAppByAppId( div.applicationId );
						if( app )
						{
							app.sendMessage( {
								'command': 'notify',
								'method': 'setviewflag',
								'flag': 'maximized',
								'viewId': div.windowObject.viewId,
								'value': true
							} );
						}
					}
					
					// Store it just in case
					let d = GetWindowStorage( div.id );
					if( !d ) d = {};
					d.maximized = true;
					SetWindowStorage( div.id, d );
					
					if( !window.isMobile )
					{
						this.prevLeft = parseInt ( this.window.style.left );
						this.prevTop = parseInt ( this.window.style.top );
						this.prevWidth = this.window.offsetWidth;
						this.prevHeight = this.window.offsetHeight;
						this.window.style.top = '0px';
						this.window.style.left = '0px';
						let wid = 0; var hei = 0;
						if( self.flags.screen )
						{
							let cnt2 = this.window.content;
							let sbar = 0;
							if( self.flags.screen.div == Ge( 'DoorsScreen' ) )
								sbar = GetStatusbarHeight( self.flags.screen );
							wid = self.flags.screen.div.offsetWidth;
							hei = self.flags.screen.div.offsetHeight - sbar;
						}
						ResizeWindow( this.window, wid, hei );
					}
					this.mode = 'maximized';					
				}
				else
				{	
					this.mode = 'normal';
					this.window.removeAttribute( 'maximized' );
					
					_removeWindowTiles( div );
					
					// Store it just in case
					let d = GetWindowStorage( div.id );
					if( !d ) d = {};
					d.maximized = false;
					SetWindowStorage( div.id, d );
					
					if( !window.isMobile )
					{
						this.window.style.top = this.prevTop + 'px';
						this.window.style.left = this.prevLeft + 'px';
						ResizeWindow( this.window, this.prevWidth, this.prevHeight );
					}
					
					// Tell application if any
					if( window._getAppByAppId )
					{
						let app = _getAppByAppId( div.applicationId );
						if( app )
						{
							app.sendMessage( {
								'command': 'notify',
								'method': 'setviewflag',
								'flag': 'maximized',
								'viewId': div.windowObject.viewId,
								'value': false
							} );
						}
					}
				}
				// Do resize events
				if( this.window.content && this.window.content.events )
				{
					if( typeof(this.window.content.events['resize']) != 'undefined' )
					{
						for( var a = 0; a < this.window.content.events['resize'].length; a++ )
						{
							this.window.content.events['resize'][a]();
						}
					}
				}
				
				// Check maximized
				CheckMaximizedView();
				
				return cancelBubble( e );
			}
		}

		resize.onclick = function( e ) { return cancelBubble ( e ); }
		resize.ondragstart = function( e ) { return cancelBubble ( e ); }
		resize.onselectstart = function( e ) { return cancelBubble ( e ); }
		resize.window = div;
		resize.onmousedown = function( e )
		{
			if( !window.isTablet && e.button != 0 ) return;
			
			// Offset based on the containing window
			this.offx = windowMouseX;
			this.offy = windowMouseY;
			this.wwid = div.offsetWidth;
			this.whei = div.offsetHeight;

			// Don't animate
			div.setAttribute( 'moving', 'moving' );

			window.mouseDown = FUI_MOUSEDOWN_RESIZE;
			
			if( !div.parentNode.classList.contains( 'Active' ) )
				_ActivateWindow( div, false, e );
			this.window.zoom.mode = 'normal';
			return cancelBubble ( e );
		}

		// remember position
		div.memorize = function ()
		{
			if( isMobile ) return;
			let wenable = this.content && self.flags && self.flags.resize ? true : false;

			// True if we're to enable memory
			if ( self.flags && self.flags.memorize )
				wenable = true;

			let wwi = div.offsetWidth;
			let hhe = div.offsetHeight;

			// Update information in the window storage object
			let d = GetWindowStorage( this.uniqueId );
			
			if( !div.getAttribute( 'maximized' ) )
			{
				d.top = this.offsetTop;
				d.left = this.offsetLeft;
				d.width = wenable && wwi ? wwi : d.width;
				d.height = wenable && hhe ? hhe : d.width;
			}
			
			if( div.content.directoryview )
			{
				d.listMode = div.content.directoryview.listMode;
			}

			SetWindowStorage( this.uniqueId, d );
		}

		let minimize = document.createElement ( 'div' );
		minimize.className = 'Minimize';
		minimize.onmousedown = function ( e ) { return cancelBubble ( e ); }
		minimize.ondragstart = function ( e ) { return cancelBubble ( e ); }
		minimize.onselectstart = function ( e ) { return cancelBubble ( e ); }
		
		div.doMinimize = function ( e )
		{
		    // Not single task
		    if( div.windowObject.getFlag( 'singletask' ) ) 
		    {
	            return div.windowObject.activate();
	        }
		    
			if( div.minimized ) 
			{
				return;
			}
			div.minimized = true;
			if( !e )
			{
				e = { button: 0, fake: true };
			}
			
			// Normal desktop applications
			if( !window.isMobile )
			{
				// Fake events just brute forces
				if( e.fake )
				{
					div.classList.remove( 'Active' );
					div.parentNode.classList.remove( 'Active' );
					div.minimized = true;
					div.windowObject.flags.minimized = true;
					div.viewContainer.setAttribute( 'minimized', 'minimized' );
					PollTray();
					PollTaskbar();
				}
				else
				{
					// Only on real events
					_ActivateWindow( div, false, e );
					let escapeFlag = 0;
					if( 
						div.windowObject && 
						( !globalConfig.viewList || globalConfig.viewList == 'separate' ) && 
						ge( 'Taskbar' )
					)
					{
						let t = ge( 'Taskbar' );
						for( var tel = 0; tel < t.childNodes.length; tel++ )
						{
							if( t.childNodes[tel].window == div )
							{
								t.childNodes[tel].mousedown = true;
								e.button = 0;
								t.childNodes[tel].onmouseup( e, t.childNodes[tel] );
								return true;
							}
						}
					}
					else if( ge( 'DockWindowList' ) )
					{
						let t = ge( 'DockWindowList' );
						for( var tel = 0; tel < t.childNodes.length; tel++ )
						{
							if( t.childNodes[tel].window == div )
							{
								t.childNodes[tel].mousedown = true;
								e.button = 0;
								t.childNodes[tel].onmouseup( e, t.childNodes[tel] );
								escapeFlag++;
								break;
							}
						}
					}
			
					// Try to use the dock		
					if( escapeFlag == 0 )
					{
						if( globalConfig.viewList == 'docked' || globalConfig.viewList == 'dockedlist' )
						{
							for( var u = 0; u < Workspace.mainDock.dom.childNodes.length; u++ )
							{
								let ch = Workspace.mainDock.dom.childNodes[ u ];
								// Check the view list
								if( ch.classList.contains( 'ViewList' ) )
								{
									for( var z = 0; z < ch.childNodes.length; z++ )
									{
										let cj = ch.childNodes[ z ];
										if( cj.viewId && movableWindows[ cj.viewId ] == div )
										{
											cj.mousedown = true;
											cj.onclick( { button: 0 } );
											escapeFlag++;
											break;
										}
									}
								}
								if( escapeFlag == 0 )
								{
									// Check applications
									if( ch.executable )
									{
										for( var r = 0; escapeFlag == 0 && r < Workspace.applications.length; r++ )
										{
											let app = Workspace.applications[ r ];
											if( app.applicationName == ch.executable )
											{
												if( app.windows )
												{
													for( var t in app.windows )
													{
														if( app.windows[t] == div.windowObject )
														{
															Workspace.mainDock.toggleExecutable( ch.executable );
															escapeFlag++;
															break;
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
				
				if( div.attached )
				{
					for( var a = 0; a < div.attached.length; a++ )
					{
						let app = _getAppByAppId( div.attached[ a ].applicationId );
						if( app )
						{
							app.sendMessage( {
								'command': 'notify',
								'method': 'setviewflag',
								'flag': 'minimized',
								'viewId': div.attached[ a ].windowObject.viewId,
								'value': true
							} );
						}
					
						div.attached[ a ].minimized = true;
						div.attached[ a ].parentNode.setAttribute( 'minimized', 'minimized' );
					}
				}
			}
			// Reorganize minimized view windows
			else
			{
				if( !isMobile )
				{
					let app = _getAppByAppId( div.applicationId );
					if( app.mainView && div != app.mainView )
						_ActivateWindow( app.mainView.content.parentNode );
				}
				Friend.GUI.reorganizeResponsiveMinimized();
			}
			
			if( window._getAppByAppId )
			{
				let app = _getAppByAppId( div.applicationId );
				if( app )
				{
					app.sendMessage( {
						'command': 'notify',
						'method': 'setviewflag',
						'flag': 'minimized',
						'viewId': div.windowObject.viewId,
						'value': true
					} );
				}
			}
		}
		minimize.onclick = div.doMinimize;

		// Mobile has extra close button
		let mclose = false;
		if( isMobile )
		{
			mclose = document.createElement( 'div' );
			mclose.className = 'MobileClose';
			mclose.ontouchstart = function( e )
			{
				let wo = div.windowObject;
				for( var a = 0; a < wo.childWindows.length; a++ )
				{
					if( wo.childWindows[a]._window )
					{
						if( wo.childWindows[a]._window.windowObject )
						{
							wo.childWindows[a]._window.windowObject.close();
						}
						else CloseView( wo.childWindows[a]._window );
					}
					else
					{
						CloseView( wo.childWindows[a] );
					}
				}
				wo.close();
				return cancelBubble( e );
			}
		}

		let popout = false;
		if( div.windowObject.applicationId )
		{
			popout = document.createElement( 'div' );
			popout.className = 'Popout';
			popout.onmousedown = function( e ) { return cancelBubble( e ); }
			popout.ondragstart = function( e ) { return cancelBubble( e ); }
			popout.onselectstart = function( e ) { return cancelBubble( e ); }
			popout.onclick = function( e )
			{
				PopoutWindow( div, e );
			}
		}
		
		let close = document.createElement( 'div' );
		close.className = 'Close';
		close.onmousedown = function( e ) { return cancelBubble( e ); }
		close.ondragstart = function( e ) { return cancelBubble( e ); }
		close.onselectstart = function( e ) { return cancelBubble( e ); }
		close.onclick = function( e )
		{
			if( !isMobile && !window.isTablet )
				if( e.button != 0 ) return;
			
			// On mobile, you get a window menu instead
			if( window.isMobile && !window.isTablet )
			{
				if( div.classList && div.classList.contains( 'Active' ) )
				{
					_DeactivateWindows();
					Workspace.redrawIcons();
					return cancelBubble( e );
				}
			}
			
			function executeClose()
			{
				// Clean movableWindows.. brute force
				let out = {};
				for( let a in movableWindows )
				{
					if( movableWindows[a] != div )
						out[ a ] = movableWindows[ a ];
				}
				movableWindows = out;
				
				viewContainer.classList.add( 'Closing' );
				if( div.windowObject )
				{
					let wo = div.windowObject;
					for( var a = 0; a < wo.childWindows.length; a++ )
					{
						if( wo.childWindows[a]._window )
						{
							if( wo.childWindows[a]._window.windowObject )
							{
								wo.childWindows[a]._window.windowObject.close();
							}
							else CloseView( wo.childWindows[a]._window );
						}
						else
						{
							CloseView( wo.childWindows[a] );
						}
					}
					wo.close();
				}
			}
			// Only if we can!
			if( div.windowObject.close() === true )
			{
				executeClose();
			}
		}

		// Add all
		inDiv.appendChild( depth );
		if( popout ) inDiv.appendChild( popout );
		inDiv.appendChild( minimize );
		if( zoom )
			inDiv.appendChild( zoom );
		inDiv.appendChild( close );
		if( mclose )
			inDiv.appendChild( mclose );
		inDiv.appendChild( titleSpan );

		div.depth     = depth;
		div.popout    = popout;
		div.zoom      = zoom;
		div.close     = close;
		div.titleBar  = title;
		div.resize    = resize;
		div.bottombar = bottombar;
		div.leftbar   = leftbar;
		div.rightbar  = rightbar;
		div.minimize  = minimize;
		
		// For mobile
		if( iconSpan )
			div.viewIcon = iconSpan;

		div.appendChild( title );
		div.titleDiv = title;
		div.appendChild( resize );
		div.appendChild( bottombar );
		div.appendChild( leftbar );
		div.appendChild( rightbar );
		
		div.appendChild( snap );

		// Empty the window menu
		contn.menu = false;

		// Null out blocker window (if we have one)
		contn.blocker = false;

		div.appendChild( contn ); // Add content
		div.appendChild( molay ); // Add move overlay

		// View groups
		let contentArea = false;
		self.viewGroups = {};
		if( self.flags.viewGroups )
		{
			let validGroups = false;
			self.viewGroups = [];
			let groups = self.flags.viewGroups;
			for( var a = 0; a < groups.length; a++ )
			{
				let group = groups[ a ];
				if( group.id )
				{
					let g = document.createElement( 'div' );
					g.className = 'ViewGroup';
					
					if( group.mode == 'horizontalTabs' )
					{
						let t = document.createElement( 'div' );
						t.className = 'ViewGroupTabsHorizontal';
						g.className += ' TabsHorizontal';
						g.appendChild( t );
						g.tabs = t;
					}
					
					if( group.xposition )
					{
						if( group.xposition == 'left' )
							g.classList.add( 'Left' );
						else if( group.xposition == 'right' )
							g.classList.add( 'Right' );
					}
					if( group.yposition )
					{
						if( group.yposition == 'top' )
							g.classList.add( 'Top' );
						else if( group.yposition == 'bottom' )
							g.classList.add( 'Bottom' );
					}
					if( group.width )
					{
						if( group.width.indexOf && group.width.indexOf( '%' ) > 0 )
						{
							let ex = parseInt( 
								group.xposition == 'left' ? 
								GetThemeInfo( 'ViewLeftBar' ).width : 
								GetThemeInfo( 'ViewRightBar' ).width
							);
							group.width = 'calc(' + group.width + ' - ' + ex + 'px)';
						}
						g.style.width = group.width;
					}
					if( group.height )
					{
						if( group.height.indexOf && group.height.indexOf( '%' ) > 0 )
						{
							let ex = parseInt( GetThemeInfo( 'ViewBottom' ).height ) + parseInt( GetThemeInfo( 'ViewTitle' ).height );
							group.height = 'calc(' + group.height + ' - ' + ex + 'px)';
						}
						g.style.height = group.height;
					}
					self.viewGroups[ group.id ] = g;
					div.appendChild( g );
					validGroups = true;
				}
			}
			if( validGroups )
				div.classList.add( 'HasViewGroups' );
		}
		// Max width and height
		let ww = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
		let hh = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

		movableWindowCount++; // Iterate global count of view windows
		
		// Make sure we count the windows in body
		if( movableWindowCount > 0 )
		{
			if( window.windowCountTimeout )
			{
				clearTimeout( window.windowCountTimeout );
				delete window.windowCountTimeout;
			}
			document.body.setAttribute( 'windowcount', movableWindowCount );
		}

		// Create event funcs on content
		self.createContentEventFuncs( div.content );

		// Assign the move layer
		div.moveoverlay = molay;

		// Also content must have it
		div.uniqueId = uniqueId;
		div.viewId = div.id;
		div.content.viewId = div.id;
		div.content.uniqueId = uniqueId;

		let windowResized = false;

		let leftSet = false;
		let topSet = false;
		let wp = GetWindowStorage( div.uniqueId );
		let leftTopSpecial = flags.top == 'center' || flags.left == 'center'; // Check for special flags
		if( wp && ( wp.top >= 0 || wp.width >= 0 ) && !leftTopSpecial )
		{
			if( window.isMobile )
			{
				if ( self.flags && self.flags.memorize )
				{
					height = wp.height;
					width = wp.width;
					ResizeWindow( div, width, height );
				}
			}
			else
			{
				let sw = self.flags.screen && self.flags.screen.div ? self.flags.screen.div.offsetWidth : document.body.offsetWidth;
				
				if( wp.maximized )
				{
					div.setAttribute( 'maximized', 'true' );
					zoom.mode = 'maximized';
					
					// Tell application if any
					if( window._getAppByAppId )
					{
						let app = _getAppByAppId( div.applicationId );
						if( app )
						{
							app.sendMessage( {
								'command': 'notify',
								'method': 'setviewflag',
								'flag': 'maximized',
								'viewId': div.windowObject.viewId,
								'value': true
							} );
						}
					}
				}
				
				if( wp.top >= 0 && wp.top < hh )
				{
					let wt = wp.top;
					div.style.top = wt + 'px';
					topSet = true;
				}
				if( wp.left >= 0 && wp.left < ww )
				{
					div.style.left = wp.left + 'px';
					leftSet = true;
				}

				if ( self.flags && self.flags.memorize )
				{
					height = wp.height;
					width = wp.width;
					ResizeWindow( div, width, height );
					windowResized = true;
				}
			}
		}
		
		// Let's find the center!
		let mvw = 0, mvh = 0;
		if( Workspace && Workspace.screen )
		{
			mvw = Workspace.screen.getMaxViewWidth();
			mvh = Workspace.screen.getMaxViewHeight();
			
			if( ge( 'desklet_0' ) )
			{
				let att = ge( 'desklet_0' ).getAttribute( 'position' );
				if( att && ( att.indexOf( 'bottom' ) >= 0 || att.indexOf( 'top' ) >= 0 ) )
					mvh -= ge( 'desklet_0' ).offsetHeight;
			}
		}
	
		// TODO: See if we can move this dock dimension stuff inside getMax..()
		if( Workspace.mainDock )
		{
			if( Workspace.mainDock.dom.classList.contains( 'Vertical' ) )
			{
				mvw -= Workspace.mainDock.dom.offsetWidth;
			}
			else
			{
				mvh -= Workspace.mainDock.dom.offsetHeight;
			}
		}
		
		if( !isMobile )
		{
			if( !leftSet && self.flags.left )
			{
				leftSet = true;
				if( self.flags.left == 'center' )
				{
					div.style.left = ( mvh >> 1 - ( height >> 1 ) ) + 'px';
				}
				else
				{
					div.style.left = self.flags.left + 'px';
				}
			}
		
			if( !topSet && self.flags.top )
			{
				topSet = true;
				if( self.flags.top == 'center' )
				{
					div.style.left = ( mvw >> 1 - ( width >> 1 ) ) + 'px';
				}
				else
				{
					div.style.top = self.flags.top + 'px';
				}
			}
		}

		// Only first window on shared apps, do full width and height
		if( ( window.isMobile && self.flags['mobileMaximised'] ) || ( window.movableWindows.length == 0 && IsSharedApp() ) )
		{
			if( zoom )
			{
				zoom.prevWidth = width;
				zoom.prevHeight = height;
				zoom.mode = 'maximized';
			}
			width = window.innerWidth; height = window.innerHeight;
			div.style.height = height + title.offsetHeight + FUI_WINDOW_MARGIN + 'px';
			div.setAttribute( 'maximized', 'true' );
			
			// Tell application if any
			if( window._getAppByAppId )
			{
				let app = _getAppByAppId( div.applicationId );
				if( app )
				{
					app.sendMessage( {
						'command': 'notify',
						'method': 'setviewflag',
						'flag': 'maximized',
						'viewId': div.windowObject.viewId,
						'value': true
					} );
				}
			}
		}
		
		// Add div to view container
		viewContainer.appendChild( div );
		div.viewContainer = viewContainer;

		// Triggers ????? Please review this and add explaining comment
		if( parentWindow )
		{	
			parentWindow.addChildWindow( viewContainer );
		}

		// Make sure it's correctly sized again
		div.windowObject = this;
		
		// Add the borders here
		if( !windowResized )
		{
			if( !self.flags[ 'borderless' ] && GetThemeInfo( 'ViewTitle' ) )
			{
				width += FUI_WINDOW_MARGIN << 1;
				height += parseInt( GetThemeInfo( 'ViewTitle' ).height ) + parseInt( GetThemeInfo( 'ViewBottom' ).height );
			}					
			ResizeWindow( div, width, height );
		}
		
		// Add the window after all considerations
		// TODO: See if the real height is not properly calculated..
		div.style.opacity = 0;
		div.setAttribute( 'created', 'created' );
		
		// Insert into existing viewgroup
		let inGroup = false;
		if( self.flags.viewGroup )
		{
			for( let a in movableWindows )
			{
				let w = movableWindows[ a ].windowObject;
				if( w.viewId == self.flags.viewGroup.view )
				{
					if( w.viewGroups[ self.flags.viewGroup.viewGroup ] )
					{
						divParent = w.viewGroups[ self.flags.viewGroup.viewGroup ];
						inGroup = true;
						self.flags.borderless = true;
						
						// Add tab
						if( divParent.tabs )
						{
							let tab = document.createElement( 'div' );
							tab.className = divParent.tabs.childNodes.length > 0 ? 'Tab' : 'TabActive';
							if( !divParent.activeTab ) divParent.activeTab = tab;
							tab.innerHTML = self.flags.title;
							divParent.tabs.appendChild( tab );
							tab.onclick = function( e )
							{
								if( e.button != 0 ) return;
								
								_WindowToFront( div );
								for( let b = 0; b < divParent.tabs.childNodes.length; b++ )
								{
									if( tab == divParent.tabs.childNodes[ b ] )
									{
										divParent.tabs.childNodes[ b ].className = 'TabActive';
										divParent.activeTab = tab;
									}
									else
									{
										divParent.tabs.childNodes[ b ].className = 'Tab';
									}
								}
							}
						}
						break;
					}
				}
			}
		}
		
		// Append view window to parent
		if( flags.liveView && Workspace.dashboard && Workspace.dashboard.liveViews )
		{
		    Workspace.dashboard.liveViews.appendChild( viewContainer );
		}
		else if( flags.dockable && ge( 'DockableWindowContainer' ) )
			ge( 'DockableWindowContainer' ).appendChild( viewContainer );
		else
		{
		    divParent.appendChild( viewContainer );
		}
		
		if( inGroup )
		{
			ResizeWindow( divParent.parentNode );
			setTimeout( function()
			{
				divParent.activeTab.onclick();
			}, 100 );
		}
		
		// Don't show the view window if it's hidden
		if(
			( typeof( flags.hidden ) != 'undefined' && flags.hidden ) ||
			( typeof( flags.invisible ) != 'undefined' && flags.invisible )
		)
		{
			div.viewContainer.style.visibility = 'hidden';
			div.viewContainer.style.pointerEvents = 'none';
			div.viewContainer.classList.add( 'Hidden' );
		}

		setTimeout( function(){ div.style.opacity = 1; } );

		// So, dont creating, behave normally now
		setTimeout( function(){ div.setAttribute( 'created', '' ); }, 300 );

		// Turn calculations on
		viewContainer.style.display = '';
		
		// Once the view appears on screen, again, constrain it
		ConstrainWindow( div );
		
		// First to generate, second to test
		PollTaskbar();

		// First resize
		RefreshWindow( div, true );

		if( window.isMobile || window.isTablet )
		{
			// window move
			if( window.isTablet )
			{
				// For mobile and tablets
				if( !window.isMobile )
				{
					title.addEventListener( 'touchstart', function( e )
					{
						e.clientX = e.touches[0].clientX
						e.clientY = e.touches[0].clientY;
						e.button = 0;
						window.mouseDown = 1; // Window mode
						if( title.onmousedown )
						{
							title.onmousedown( e );
						}
						_ActivateWindow( div );
					} );
				}
				else
				{
					title.addEventListener( 'touchmove', function( evt )
					{
						touchMoveWindow( evt );
					});
				}
			}

			// Resize touch events.... -----------------------------------------
			let winTouchStart = [ 0, 0 ];
			let winTouchDowned = winTouchEnd = 0;
			resize.addEventListener('touchstart', function( evt )
			{
				cancelBubble( evt );
				winTouchStart = [ evt.touches[0].clientX, evt.touches[0].clientY ];
				winTouchDowned = evt.timeStamp;
			} );
			resize.addEventListener('touchmove', function( evt )
			{
				cancelBubble( evt );
				if( evt.target && evt.target.offsetParent ) evt.target.offH = evt.target.offsetParent.clientHeight;
				touchResizeWindow(evt);
			} );
			resize.addEventListener( 'touchend', function( evt )
			{
				cancelBubble( evt );
			} );

			bottombar.addEventListener('touchstart', function( evt )
			{
				cancelBubble( evt );

				winTouchStart = [ evt.touches[0].clientX, evt.touches[0].clientY ];
				winTouchDowned = evt.timeStamp;
			} );

			bottombar.addEventListener('touchmove', function( evt )
			{
				cancelBubble( evt );

				if( evt.target && evt.target.offsetParent ) evt.target.offH = evt.target.offsetParent.clientHeight;
				touchResizeWindow(evt);
			} );

			bottombar.addEventListener( 'touchend', function( evt )
			{
				cancelBubble( evt );
			} );

			//close  --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ## --- ##
			close.addEventListener( 'touchstart', function( evt )
			{
				cancelBubble( evt );
				winTouchStart = [ evt.touches[0].clientX, evt.touches[0].clientY, (evt.target.hasAttribute('class') ? evt.target.getAttribute('class') : '') ];
				winTouchEnd = winTouchStart;
				winTouchDowned = evt.timeStamp;
			} );
		}
		// Ok, if no window position is remembered.. place it somewhere
		else if( !wp )
		{
			ConstrainWindow( div );
		}

		/* function shal be called by bottombar or resize... */
		// TODO: constrain window please use ResizeWindow()
		function touchResizeWindow(evt)
		{
			if( !evt.target.offH ) evt.target.offH = evt.target.offsetParent.clientHeight;
			//not too small and not too high...
			let newHeight = Math.min(
				Workspace.screenDiv.clientHeight -
					72 - evt.target.offsetParent.offsetTop,
				Math.max(80,evt.touches[0].clientY - evt.target.offsetParent.offsetTop )
			);
							
			evt.target.offsetParent.style.height = newHeight + 'px';
			evt.target.offsetParent.lastHeight = newHeight;
			
			// Only tablets can move
			if( window.isTablet )
			{
				let newWidth = Math.min(
					Workspace.screenDiv.clientWidth -
						evt.target.offsetParent.offsetLeft,
					evt.touches[0].clientX - evt.target.offsetParent.offsetLeft
				);
			
				evt.target.offsetParent.style.width = newWidth + 'px';
				evt.target.offsetParent.lastWidth = newWidth;
			}
		}
		
		function touchMoveWindow( evt )
		{
			let nx = evt.touches[0].clientX;
			let ny = evt.touches[0].clientY;
			
			window.mouseDown = 1;
			movableListener( evt, { mouseX: nx, mouseY: ny } );
		}

		// Remove window borders
		if( !isMobile )
		{
			if( typeof( flags.borderless ) != 'undefined' && flags.borderless == true )
			{
				title.style.position = 'absolute';
				title.style.height = '0px';
				title.style.overflow = 'hidden';
				resize.style.display = 'none';
				div.leftbar.style.display = 'none';
				div.rightbar.style.display = 'none';
				div.bottombar.style.display = 'none';
				div.content.style.left = '0';
				div.content.style.right = '0';
				div.content.style.top = '0';
				div.content.style.right = '0';
				div.content.style.bottom = '0';
			}
		}
		if( typeof( flags.resize ) != 'undefined' && flags.resize == false )
		{
			resize.style.display = 'none';
			if( zoom )
				zoom.style.display = 'none';
		}
		if( typeof( flags.login ) != 'undefined' && flags.login == true )
		{
			resize.style.display = 'none';
			if( zoom )
				zoom.style.display = 'none';
			depth.style.display = 'none';
		}

		// Start maximized
		if( window.isMobile )
		{
			if( !flags.minimized )
			{
				this.setFlag( 'maximized', true );
				div.setAttribute( 'maximized', 'true' );
			
				// Tell application if any
				if( window._getAppByAppId )
				{
					let app = _getAppByAppId( div.applicationId );
					if( app )
					{
						app.sendMessage( {
							'command': 'notify',
							'method': 'setviewflag',
							'flag': 'maximized',
							'viewId': div.windowObject.viewId,
							'value': true
						} );
					}
				}
			}
			else
			{
			}
		}

		// Handle class
		if ( !div.classList.contains( 'View' ) )
			div.classList.add( 'View' );
		
		// (handle z-index)
		div.viewContainer.style.zIndex = movableHighestZindex++;
		div.style.zIndex = div.viewContainer.style.zIndex;
		
		// If the current window is an app, move it to front.. (unless new window is a child window)
		if( window.friend && Friend.currentWindowHover )
			Friend.currentWindowHover = false;
		
		// Reparse! We may have forgotten some things
		self.parseFlags( flags );
		
		// Only activate if needed
		if( !flags.minimized && !flags.openSilent && !flags.invisible )
		{
			_ActivateWindow( div );
			_WindowToFront( div );
		}
		
		// Move workspace to designated position	
		if( !flags.screen || flags.screen == Workspace.screen )
		{
			if( self.workspace > 0 )
			{
				self.sendToWorkspace( self.workspace );
			}
		}
		
		// Remove menu on calendar
		if( !flags.minimized && Workspace.calendarWidget )
			Workspace.calendarWidget.hide();
		
		if( Workspace.dashboard && typeof( hideDashboard ) != 'undefined' )
		{
			if( !self.flags.dialog )
			{
			    hideDashboard();
			}
		}
	}

	// Send window to different workspace
	this.sendToWorkspace = function( wsnum )
	{
		if( isMobile ) return;
		
		// Windows on own screen ignores the virtual workspaces
		if( this.flags && this.flags.screen && this.flags.screen != Workspace.screen ) return;
		
		if( wsnum != 0 && ( wsnum < 0 || wsnum > globalConfig.workspacecount - 1 ) )
		{
			return;
		}
		let wn = this._window.parentNode;
		let pn = wn.parentNode;
		
		// Move the viewcontainer
		wn.viewContainer.style.left = ( Workspace.screen.getMaxViewWidth() * wsnum ) + 'px';
		wn.workspace = wsnum;
		cleanVirtualWorkspaceInformation(); // Just clean the workspace info
		
		// Done moving
		if( this.flags && this.flags.screen )
		{
			let maxViewWidth = this.flags.screen.getMaxViewWidth();
			this.workspace = wsnum;
			_DeactivateWindow( this._window.parentNode );
			PollTaskbar();
		}
	}

	// Set content on window
	this.setContent = function( content, cbk )
	{
	    // Safe content without any scripts or styles!
		SetWindowContent( this._window, this.cleanHTMLData( content ) );
		if( cbk ) cbk();
	}
	this.fullscreen = function( val )
	{
		if( val === true || val === false )
		{
			this.setFlag( 'fullscreenenabled', val );
		}
		let fullscreen = this.getFlag( 'fullscreenenabled' );
		if( fullscreen )
		{
			if( this.iframe )
			{
				Workspace.fullscreen( this.iframe );
			}
			else
			{
				Workspace.fullscreen( this._window );
			}
		}
		else
		{
			document.exitFullscreen();
		}
	}
	// Set content (securely!) in a sandbox, callback when completed
	this.setContentIframed = function( content, domain, packet, callback )
	{
		if( !domain )
		{
			domain = document.location.href + '';
			domain = domain.split( 'index.html' ).join ( 'sandboxed.html' );
			domain = domain.split( 'app.html' ).join( 'sandboxed.html' );
		}

		// Oh we have a conf?
		if( this.conf )
		{
			if ( Workspace.sessionId )
			{
				domain += '/system.library/module/?module=system&command=sandbox' +
					'&sessionid=' + Workspace.sessionId +
					'&conf=' + JSON.stringify( this.conf );
			}
			else
			{
				domain += '/system.library/module/?module=system&command=sandbox' +
					'&authid=' + this.authId +
					'&conf=' + JSON.stringify( this.conf );
			}
			if( this.getFlag( 'noevents' ) ) domain += '&noevents=true';
		}
		else if( domain.indexOf( 'sandboxed.html' ) <= 0 )
		{
			domain += '/webclient/sandboxed.html';
			if( this.getFlag( 'noevents' ) ) domain += '?noevents=true';
		}

		// Make sure scripts can be run after all resources has loaded
		if( content && content.match )
		{
			let r;
			while( r = content.match( /\<script([^>]*?)\>([\w\W]*?)\<\/script\>/i ) )
				content = content.split( r[0] ).join( '<friendscript' + r[1] + '>' + r[2] + '</friendscript>' );
		}
		else
		{
			content = '';
		}

		let c = this._window;
		if( c && c.content ) c = c.content;
		if( c )
		{
			c.innerHTML = '';
		}
		let ifr = document.createElement( _viewType );
		ifr.applicationId = self.applicationId;
		ifr.authId = self.authId;
		ifr.applicationName = self.applicationName;
		ifr.applicationDisplayName = self.applicationDisplayName;
		putSandboxFlags( ifr, getSandboxFlags( this, DEFAULT_SANDBOX_ATTRIBUTES ) );
		ifr.view = this._window;
		ifr.className = 'Content Loading';
		
		if( this.flags.transparent )
		{
			ifr.setAttribute( 'allowtransparency', 'true' );
			ifr.style.backgroundColor = 'transparent';
		}
		
		ifr.id = 'sandbox_' + this.viewId;
		ifr.src = domain;

		let view = this;
		this.iframe = ifr;
		
		ifr.onfocus = function( e )
		{
			if( !ifr.view.parentNode.classList.contains( 'Active' ) )
			{
				// Don't steal focus!
				ifr.blur();
				window.blur();
				window.focus();
			}
		}

		if( packet.applicationId ) this._window.applicationId = packet.applicationId;

		ifr.onload = function()
		{
			// Assign views to each other to allow cross window scripting
			// TODO: This could be a security hazard! Remember to use security
			//       domains!
			let parentIframeId = false;
			let instance = Math.random() % 100;
			if( ifr.applicationId )
			{
				for( let a = 0; a < Workspace.applications.length; a++ )
				{
					let app = Workspace.applications[a];
					if( app.applicationId == ifr.applicationId )
					{
						for( let b in app.windows )
						{
							// Ah we found our parent view
							if( self.parentViewId == b )
							{
								let win = app.windows[b];
								parentIframeId = 'sandbox_' + b;
								break;
							}
						}
						// Link to application sandbox
						if( !parentIframeId )
						{
							parentIframeId = 'sandbox_' + app.applicationId;
						}
						break;
					}
				}
			}

			let msg = {}; if( packet ) for( let a in packet ) msg[a] = packet[a];
			msg.command = 'setbodycontent';
			msg.cachedAppData = _applicationBasics;
			msg.dosDrivers = Friend.dosDrivers;
			msg.parentSandboxId = parentIframeId;
			msg.locale = Workspace.locale;

			// Override the theme
			if( view.getFlag( 'theme' ) )
			{
				msg.theme = view.getFlag( 'theme' );
			}
			if( Workspace.themeData )
			{
				msg.themeData = Workspace.themeData;
			}

			// Register mode
			if( Workspace.workspaceMode )
			{
				msg.workspaceMode = Workspace.workspaceMode;
			}
			else
			{
				msg.workspaceMode = document.body.getAttribute( 'webapp' ) || false;
			}

			// Authid is important, should not be left out if it is available
			if( !msg.authId )
			{
				if( ifr.authId ) msg.authId = ifr.authId;
				else if( GetUrlVar( 'authid' ) ) msg.authId = GetUrlVar( 'authid' );
			}
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
			if( self.flags.screen )
				msg.screenId = self.flags.screen.externScreenId;
			msg.data = msg.data.split( /system\:/i ).join( '/webclient/' );
			if( !msg.origin ) msg.origin = '*'; //TODO: Should be fixed document.location.href;
			
			ifr.contentWindow.postMessage( JSON.stringify( msg ), '*' );
		}
		c.appendChild( ifr );
	}

	// Sets content on a safe window (using postmessage), callback when completed
	this.setContentById = function( content, packet, callback )
	{
		if( this.iframe )
		{
			let msg = {}; if( packet ) for( var a in packet ) msg[a] = packet[a];
			msg.command = 'setcontentbyid';
			this.iframe.contentWindow.postMessage( JSON.stringify( msg ), Workspace.protocol + '://' + this.iframe.src.split( '//' )[1].split( '/' )[0] );
		}
		if( callback ) callback();
	}
	// old hello function
	this.setSandboxedUrl = function( conf )
	{
		let self = this;
		let appName = self.applicationName;
		let origin = '*'; // TODO: Should be this Doors.runLevels[ 0 ].domain;
		let domain = Doors.runLevels[ 1 ].domain;
		domain = domain.split( '://' )[1];
		let appBase = '/webclient/apps/' + appName + '/';
		let protocol = Workspace.protocol + '://';
		let filePath =  protocol + domain + appBase + conf.filePath;
		let container = self._window.content || self._window;
		let iframe = document.createElement( _viewType );
		iframe.applicationId = self.applicationId;
		iframe.authId = self.authId;
		iframe.applicationName = self.applicationName;
		iframe.applicationDisplayName = self.applicationDisplayName;
		if( typeof friendApp == 'undefined' ) putSandboxFlags( iframe, getSandboxFlags( this, DEFAULT_SANDBOX_ATTRIBUTES ) ); // allow same origin is probably not a good idea, but a bunch other stuff breaks, so for now..
		iframe.referrerPolicy = 'origin';

		self._window.applicationId = conf.applicationId; // needed for View.close to work
		self._window.authId = conf.authId;
		self.iframe = iframe;
		container.innerHTML = '';
		container.appendChild( iframe );

		let src = filePath
			+ '?base=' + appBase
			+ '&id=' + self.viewId
			+ '&applicationId=' + self.applicationId
			+ '&authId=' + conf.authId
			+ '&origin=' + origin
			+ '&domain=' + domain
			+ '&locale=' + Workspace.locale
			+ '&theme=' + Doors.theme;

		if ( conf.viewTheme && conf.viewTheme.length )
			src += '&viewTheme=' + conf.viewTheme;

		iframe.src = src;
	}
	// Sets rich content in a safe iframe
	this.setRichContent = function( content )
	{
		if( !this._window ) return;
		
		// Rich content still can't have any scripts!
		content = this.removeScriptsFromData( content );
		if( !this._window )
			return;
			
		let eles = this._window.getElementsByTagName( _viewType );
		let ifr = false;
		if( eles[0] )
			ifr = eles[0];
		else
		{
			ifr = document.createElement( _viewType );
			this._window.appendChild( ifr );
		}
		if( this.flags.transparent )
		{
			ifr.setAttribute( 'allowtransparency', 'true' );
			ifr.style.backgroundColor = 'transparent';
		}
		ifr.applicationId = self.applicationId;
		ifr.applicationName = self.applicationName;
		ifr.applicationDisplayName = self.applicationDisplayName;
		putSandboxFlags( ifr, getSandboxFlags( this, DEFAULT_SANDBOX_ATTRIBUTES ) );
		ifr.authId = self.authId;
		ifr.onload = function()
		{
			ifr.contentWindow.document.body.innerHTML = content;
		}
		if( this.flags.requireDoneLoading )
		{
			ifr.className = 'Loading';	
		}
		ifr.onload();

		this.isRich = true;
		this.iframe = ifr;
	}
	// Sets rich content in a safe iframe
	this.setJSXContent = function( content, appName )
	{
		let w = this;

		if( !this._window )
			return;
			
		let eles = this._window.getElementsByTagName( _viewType );
		let ifr = false;
		let appended = false;

		if( eles[0] )
			ifr = eles[0];
		else
		{
			ifr = document.createElement( _viewType );
			appended = true;
		}

		// Load the sandbox
		if( this.conf )
		{
			ifr.src = '/system.library/module/?module=system&command=sandbox' +
				'&sessionid=' + Workspace.sessionId +
				'&conf=' + JSON.stringify( this.conf ) +
				( this.getFlag( 'noevents' ) ? '&noevents=true' : '' );
		}
		// Just give a dumb sandbox
		else
		{
			ifr.src = '/webclient/sandboxed.html' +
				( this.getFlag( 'noevents' ) ? '?noevents=true' : '' );
		}

		// Register name and ID
		ifr.applicationName = appName;
		ifr.applicationId = appName + '-' + (new Date()).getTime();
		Doors.applications.push( ifr );

		// Add a loaded script
		ifr.onload = function()
		{
			// Get document
			let doc = ifr.contentWindow.document;

			let jsx = doc.createElement( 'script' );
			jsx.innerHTML = content;
			ifr.contentWindow.document.getElementsByTagName( 'head' )[0].appendChild( jsx );

			let msg = {
				command:       'initappframe',
				base:          '/',
				applicationId: ifr.applicationId,
				filePath:      '/webclient/jsx/',
				origin:        '*', // TODO: Should be this - document.location.href,
				viewId:      w.externViewId ? w.externViewId : w.viewId,
				clipboard:     Friend.clipboard
			};

			// Set theme
			if( w.getFlag( 'theme' ) )
				msg.theme = w.getFlag( 'theme' );
			if( Workspace.themeData )
				msg.themeData = Workspace.themeData;
			

			ifr.contentWindow.postMessage( JSON.stringify( msg ), Workspace.protocol + '://' + ifr.src.split( '//' )[1].split( '/' )[0] );
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
		let view = this;

		if( !base )
			base = '/';

		if( !this._window )
			return;

		let eles = this._window.getElementsByTagName( _viewType );
		let ifr = false;
		let w = this;
		if( eles[0] ) ifr = eles[0];
		else
		{
			ifr = document.createElement( _viewType );
		}

		// Register the app id so we can talk
		this._window.applicationId = appId;

		ifr.applicationId = self.applicationId;
		ifr.applicationName = self.applicationName;
		ifr.applicationDisplayName = self.applicationDisplayName;
		ifr.authId = self.authId;
		putSandboxFlags( ifr, getSandboxFlags( this, DEFAULT_SANDBOX_ATTRIBUTES ) );
		
		let conf = this.flags || {};
		if( this.flags && this.flags.allowScrolling )
		{
			ifr.setAttribute( 'scrolling', 'yes' );
		}
		else
		{
			ifr.setAttribute( 'scrolling', 'no' );
		}

		if ( conf.fullscreenenabled )
			ifr.setAttribute( 'allowfullscreen', 'true' );

		if( this.flags.transparent )
		{
			ifr.setAttribute( 'allowtransparency', 'true' );
			ifr.style.backgroundColor = 'transparent';
		}

		ifr.setAttribute( 'seamless', 'true' );
		ifr.style.border = '0';
		ifr.style.position = 'absolute';
		ifr.style.top = '0'; ifr.style.left = '0';
		ifr.style.width = '100%'; ifr.style.height = '100%';
		
		if( this.flags.requireDoneLoading )
		{
			ifr.className = 'Loading';	
		}

		// Find our friend
		// TODO: Only send postmessage to friend targets (from our known origin list (security app))
		
		// Fix url
		if( url.indexOf( 'http' ) != 0 )
		{
			let t = document.location.href.match( /(http[s]{0,1}\:\/\/)(.*?)\//i );
			url = t[1] + t[2] + url;
		}
		
		let targetP = url.match( /(http[s]{0,1}\:\/\/.*?)\//i );
		let friendU = document.location.href.match( /http[s]{0,1}\:\/\/(.*?)\//i );
		let targetU = url.match( /http[s]{0,1}\:\/\/(.*?)\//i );
		if( friendU && friendU.length > 1 ) friendU = friendU[1];
		if( targetU && targetU.length > 1 )
		{
			targetP = targetP[1];
			targetU = targetU[1];
		}
		friendU = Trim( friendU );
		
		if( typeof friendApp == 'undefined'  && ( friendU.length || friendU != targetU || !targetU ) )
			putSandboxFlags( ifr, getSandboxFlags( this, DEFAULT_SANDBOX_ATTRIBUTES ) );

		// Allow sandbox flags
		let sbx = ifr.getAttribute( 'sandbox' ) ? ifr.getAttribute( 'sandbox' ) : '';
		sbx = ('' + sbx).split( ' ' );
		if( this.flags && this.flags.allowPopups )
		{
			let found = false;
			for( var a = 0; a < sbx.length; a++ )
			{
				if( sbx[a] == 'allow-popups' )
				{
					found = true;
				}
			}
			if( !found ) sbx.push( 'allow-popups' );
			if( typeof friendApp == 'undefined' )  ifr.setAttribute( 'sandbox', sbx.join( ' ' ) );
		}
		
		// Special insecure mode (use with caution!)
		if( this.limitless && this.limitless === true )
		{
			let sb = ifr.getAttribute( 'sandbox' );
			if( !sb ) sb = DEFAULT_SANDBOX_ATTRIBUTES;
			sb += ' allow-top-navigation';
			ifr.setAttribute( 'sandbox', sb );
		}

		ifr.onload = function( e )
		{
			if( friendU && ( friendU == targetU || !targetU ) )
			{
				let msg = {
					command           : 'initappframe',
					base              : base,
					applicationId     : appId,
					filePath          : filePath,
					origin            : '*', // TODO: Should be this - document.location.href,
					viewId            : w.externViewId,
					authId            : self.authId,
					theme             : Workspace.theme,
					fullscreenenabled : conf.fullscreenenabled,
					clipboard         : Friend.clipboard,
					viewConf          : self.args.viewConf
				};

				// Override the theme
				if( view.getFlag( 'theme' ) )
					msg.theme = view.getFlag( 'theme' );
				if( Workspace.themeData )
					msg.themeData = Workspace.themeData;

				try
				{
					// TODO: Why we used protocol was for security domains - may be deprecated
					//ifr.contentWindow.postMessage( JSON.stringify( msg ), Workspace.protocol + '://' + ifr.src.split( '//' )[1].split( '/' )[0] );
					ifr.contentWindow.postMessage( JSON.stringify( msg ), '*' );
				}
				catch(e)
				{
					console.log('could not send postmessage to contentwindow!');
				}
				ifr.loaded = true;
			}
			if( callback ) { callback(); }
		}
		
		// Commented out because it stops https sites from being viewed on f.eks localhost without ssl
		
		/*if( this.conf && url.indexOf( Workspace.protocol + '://' ) != 0 )
		{
			let cnf = this.conf;
			if( typeof( this.conf ) == 'object' ) cnf = '';
			ifr.src = '/system.library/module/?module=system&command=sandbox' +
				'&sessionid=' + Workspace.sessionId +
				'&url=' + encodeURIComponent( url ) + '&conf=' + cnf;
		}
		else
		{*/
			ifr.src = url;
		/*}*/

		this.isRich = true;
		this.iframe = ifr;
		
		// Add after options set
		if( !eles[0] ) this._window.appendChild( ifr );
		
		this.initOnMessageCallback();
	}
	
	this.showBackButton = function( visible, cbk )
	{
		if( !isMobile ) return;
		if( visible )
		{
			self.mobileBack.classList.add( 'Showing' );
			self.viewIcon.classList.add( 'MobileBackHidesIt' );
			
			if( cbk )
			{
				self.mobileBack.ontouchstart = function( e )
				{
					cbk( e );
				}
			}
		}
		else 
		{
			self.mobileBack.classList.remove( 'Showing' );
			self.viewIcon.classList.remove( 'MobileBackHidesIt' );
		}
	}

	// Send a message
	this.sendMessage = function( dataObject, event )
	{
		if( !event ) event = window.event;

		// Check if the iframe is ready to receive a message
		if( this.iframe && this.iframe.loaded && this.iframe.contentWindow )
		{
			let u = Workspace.protocolUrl + 
				this.iframe.src.split( '//' )[1].split( '/' )[0];
			
			//let origin = event && 
			//	event.origin && event.origin != 'null' && event.origin.indexOf( 'wss:' ) != 0 ? event.origin : '*'; // * used to be u;
			// TODO: Fix this with security
			let origin = '*';
			
			if( !dataObject.applicationId && this.iframe.applicationId )
			{
				dataObject.applicationId = this.iframe.applicationId;
				dataObject.authId = this.iframe.authId;
				dataObject.applicationName = this.iframe.applicationName;
				dataObject.applicationDisplayName = this.iframe.applicationDisplayName;
			}
			if( !dataObject.type ) dataObject.type = 'system';
			
			this.iframe.contentWindow.postMessage( 
				JSON.stringify( dataObject ), origin 
			);
		}
		// No iframe?
		else if( !this.iframe )
		{
			return false;
		}
		else
		{
			if( !this.sendQueue )
				this.sendQueue = [];
			this.sendQueue.push( dataObject );
		}
		return true;
	}
	// Receive a message specifically for this view.
	this.initOnMessageCallback = function()
	{
		if( self.onMessage && self.iframe && !window.onmessage )
		{
			let b = self.iframe.getAttribute( 'sandbox' );
			window.onmessage = function( msg ) 
			{
				if( msg && msg.isTrusted && msg.data && msg.data.type )
				{
					if( self.iframe.contentWindow == msg.source )
					{
						self.onMessage( msg.data );
						
						// Enforce prevailing sandbox attributes
						self.iframe.setAttribute( 'sandbox', b );
					}
				}
			};
		}
	}
	// Send messages to window that hasn't been sent because iframe was not loaded
	this.executeSendQueue = function()
	{
		if ( !this.sendQueue || !this.sendQueue.length )
			return;

		if( this.executingSendQueue || !this.iframe ) return;
		this.executingSendQueue = true;
		for( let a = 0; a < this.sendQueue.length; a++ )
		{
			let msg = this.sendQueue[ a ];
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
		let ele = this.getSubContent( identifier, flag );
		if( ele && ele.focus ) ele.focus();
	}
	// Get some subcontent (.class or #id)
	this.getContentById = function( identifier, flag )
	{
		let node = this.getContentElement();
		if( !node ) return false;
		let ele = node.getElementsByTagName( '*' );
		let cnt = false;
		let idn = identifier.substr( 0, 1 );
		let key = identifier.substr( 1, identifier.length - 1 );
		let results = [];
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
			let fn = key;
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
		let cnt = this.getSubContent( identifier, flag );
		if( !cnt ) return;
		// Safe content without any scripts or styles!
		cnt.innerHTML = this.cleanHTMLData( content );
	}
	// Sets a property value
	this.setAttributeById = function( packet )
	{
		if( this.iframe )
		{
			let msg = {}; if( packet ) for( var a in packet ) msg[a] = packet[a];
			msg.command = 'setattributebyid';
			this.iframe.contentWindow.postMessage( JSON.stringify( msg ), Workspace.protocol + '://' + this.iframe.src.split( '//' )[1].split( '/' )[0] );
		}
	}
	// Activate window
	this.activate = function( force )
	{
		if( isMobile && !force && this.flags.minimized ) 
		{
			return;
		}
		_ActivateWindow( this._window.parentNode );
	}
	// Move window to front
	this.toFront = function( flags )
	{
		if( this.flags.minimized ) 
		{
			return;
		}
		if( !( flags && flags.activate === false ) )
			_ActivateWindow( this._window.parentNode );
		_WindowToFront( this._window.parentNode );
	}
	// Close a view window
	this.close = function ( force )
	{
		if( isMobile )
			Workspace.exitMobileMenu();
		
		let c = this._window;
		if( c && c.content )
			c = c.content;

		// Remember window position
		if( this.flags.memorize )
		{
			this._window.parentNode.memorize();
		}

		// Close blockers
		if( this._window && this._window.blocker )
		{
			this._window.blocker.close();
		}

		if( !force && this._window && this._window.applicationId )
		{
			// Send directly to the view
			let app = this._window.applicationId ? findApplication( this._window.applicationId ) : false;
			if( c.getElementsByTagName( _viewType ).length )
			{
				let twindow = this;

				// Notify application
				let msg = {
					type: 'system',
					command: 'notify',
					method: 'closeview',
					applicationId: this._window.applicationId,
					viewId: self.viewId
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
				if( this.eventSystemClose ) // <- system call
				{
					for( let a = 0; a < this.eventSystemClose.length; a++ )
					{
						this.eventSystemClose[a]();
					}
				}
				return;
			}
			else if( this.parentViewId )
			{
				let v = GetWindowById( this.parentViewId );
				if( v && v.windowObject )
				{
					let msg = {
						type: 'system',
						command: 'notify',
						method: 'closeview',
						applicationId: this._window.applicationId,
						viewId: this.viewId
					};
					v.windowObject.sendMessage( msg );
				}
				return false;
			}
			else if( app )
			{
				// Notify application
				let msg = {
					type: 'system',
					command: 'notify',
					method: 'closeview',
					applicationId: this._window.applicationId,
					viewId: self.viewId
				};
				app.sendMessage( msg );
				return;
			}
		}
		CloseView( this._window );
		if( this.onClose ) this.onClose();
		if( this.eventSystemClose ) // <- system call
		{
			for( let a = 0; a < this.eventSystemClose.length; a++ )
			{
				this.eventSystemClose[a]();
			}
		}
		return true;
	}
	// Put a loading animation on window
	this.loadingAnimation = function ()
	{
		WindowLoadingAnimation( this._window );
	}
	
	// Set the main view of app
	this.setMainView = function( set )
	{
		if( !this.applicationId ) return;
		
		if( !window._getAppByAppId )
			return;
			
		let app = _getAppByAppId( this.applicationId );
		if( !app ) return;
		
		this.flags.mainView = set;
		
		// Set main view
		if( set )
		{
			app.mainView = this;
		}
		// Unset main view (pick the next view if possible
		else
		{
			// Find new main view
			app.mainView = null;
			for( var a in app.windows )
			{
				if( app.windows[ a ] != this )
				{
					app.mainView = app.windows[ a ];
					app.mainView.flags.mainView = true;
				}
			}
		}
		// Update other windows with the new main view!
		if( app.mainView )
		{
			for( var a in app.windows )
			{
				if( app.windows[ a ] != app.mainView )
				{
					app.windows[ a ].mainView = false;
					app.windows[ a ].flags.mainView = false;
					app.windows[ a ].parentView = app.mainView;
				}
			}
		}
	}
	
	// Set a window flag
	this.setFlag = function( flag, value )
	{	
		// References to the view window
		let content = viewdiv = false;
		if( this._window )
		{
			content = this._window;
			viewdiv = content.parentNode;
		}
		
		// Set the flag
		switch( flag )
		{
			case 'context':
				for( let a in movableWindows )
				{
					if( a == value )
					{
						this.currentContext = [ movableWindows[ a ] ];
						this.flags.context = value;
						break;
					}
				}
				break;
			case 'mainView':
				this.setMainView( value );
				this.flags.mainView = value;
				break;
			case 'noquickmenu':
				if( value )
					this._window.classList.add( 'NoQuickmenu' );
				else this._window.classList.remove( 'NoQuickmenu' );
				this.flags.noquickmenu = value;
				break;
			case 'menu':
				if( value && value.length && value[0].name )
				{
					this.setMenuItems( value );
					this.flags.menu = value;
				}
				this.flags.menu = null;
				break;
			case 'singletask':
				this.flags.singletask = value;
				break;
			// Standard dialog has preset width and height
			case 'standard-dialog':
			// Dialog is treated only like a dialog
				if( viewdiv.parentNode )
				{
					if( value )
				    {
				        viewdiv.parentNode.classList.add( 'StandardDialog' );
				    }
				    else
				    {
				        viewdiv.parentNode.classList.remove( 'StandardDialog' );
				    }
				}
		        this.flags[ 'standard-dialog' ] = value;
			case 'dialog':
				this.flags[ 'dialog' ] = value;
			    if( viewdiv )
			    {
			        if( value )
			        {
			            viewdiv.parentNode.classList.add( 'Dialog' );
			            if( flag == 'dialog' && document.body.classList.contains( 'ThemeEngine' ) )
			            {
					        viewdiv.style.left = 'calc(50% - ' + ( viewdiv.offsetWidth >> 1 ) + 'px)';
					        viewdiv.style.top = 'calc(50% - ' + ( viewdiv.offsetHeight >> 1 ) + 'px)';
					    }
			        }
			        else
			        {
			            viewdiv.parentNode.classList.remove( 'Dialog' );
			        }
			    }
			    break;
			case 'clickableTitle':
				this.flags.clickableTitle = value;
				break;
			case 'scrollable':
				if( content )
				{
					if( value == true )
						content.className = 'Content IconWindow';
					else content.className = 'Content';
					if( value == true )
					{
						viewdiv.classList.add( 'Scrolling' );
					}
					else
					{
						viewdiv.classList.remove( 'Scrolling' );
					}
				}
				this.flags.scrollable = value;
				break;
			case 'left':
				this.flags.left = value;
				if( viewdiv )
				{
					value += '';
					value = value.split( 'px' ).join( '' );
					if( !isMobile )
					{
						viewdiv.style.left = ( value.indexOf( '%' ) > 0 || value.indexOf( 'vw' ) > 0 ) ? value : ( value + 'px' );
					}
				}
				break;
			case 'top':
				this.flags.top = value;
				if( viewdiv )
				{
					value += '';
					value = value.split( 'px' ).join( '' );
					if( !isMobile )
					{
						viewdiv.style.top = ( value.indexOf( '%' ) > 0 || value.indexOf( 'vh' ) > 0 ) ? value : ( value + 'px' );
					}
				}
				break;
			case 'max-width':
				this.flags['max-width'] = value;
				if( viewdiv )
				{
					viewdiv.style.maxWidth = value;
					ResizeWindow( viewdiv, ( flag == 'width' ? value : null ), ( flag == 'height' ? value : null ) );
					RefreshWindow( viewdiv );
				}
				break;
			case 'max-height':
				this.flags['max-height'] = value;
				if( viewdiv )
				{
					viewdiv.style.maxHeight = value;
					ResizeWindow( viewdiv, ( flag == 'width' ? value : null ), ( flag == 'height' ? value : null ) );
					RefreshWindow( viewdiv );
				}
				break;
			case 'min-width':
				this.flags[ 'min-width' ] = value;
				if( viewdiv )
				{
					viewdiv.style.minWidth = value;
					ResizeWindow( viewdiv, ( flag == 'width' ? value : null ), ( flag == 'height' ? value : null ) );
					RefreshWindow( viewdiv );
				}
				break;
			case 'min-height':
				this.flags[ 'min-height' ] = value;
				if( viewdiv )
				{
					viewdiv.style.minHeight = value;
					ResizeWindow( viewdiv, ( flag == 'width' ? value : null ), ( flag == 'height' ? value : null ) );
					RefreshWindow( viewdiv );
				}
				break;
			case 'width':
			case 'height':
				if( value == null ) value = 0;
				this.flags[ flag ] = value;
				if( viewdiv )
				{	
					if( value == 'max' )
					{
						if( flag == 'width' )
						{
							value = ( this.flags && this.flags.screen ) ? this.flags.screen.getMaxViewWidth() : window.innerWidth;
						}
						else
						{
							value = ( this.flags && this.flags.screen ) ? this.flags.screen.getMaxViewHeight() : window.innerHeight;
						}
					}
					
					ResizeWindow( viewdiv, ( flag == 'width' ? value : null ), ( flag == 'height' ? value : null ) );
					RefreshWindow( viewdiv );
				}
				break;
			// TODO: Expand to work with more properties
			case 'animated':
				this.flags[ flag ] = value;
				if( value == true )
				{
					viewdiv.classList.add( 'Animated' );
				}
				else
				{
					viewdiv.classList.remove( 'Animated' );
				}
				break;
			case 'resize':
				this.flags[ flag ] = value;
				ResizeWindow( viewdiv );
				RefreshWindow( viewdiv );
				break;
			case 'loadinganimation':
				if( value == true )
				{
					this.loadingAnimation();
				}
				break;
			case 'hidden':
			case 'invisible':
				if( viewdiv )
				{
					if( value == 'true' || value == true )
					{
						// Fade out!!
						if( value === false )
						{
							setTimeout( function(){
								viewdiv.viewContainer.style.visibility = 'hidden';
								viewdiv.viewContainer.style.pointerEvents = 'none';
							}, 500 );
						}
						else
						{
							// Don't show the view window if it's hidden
							viewdiv.viewContainer.style.visibility = 'hidden';
							viewdiv.viewContainer.style.pointerEvents = 'none';
						}
						viewdiv.viewContainer.style.opacity = 0;
					}
					else
					{
						// Fade in!!
						if( value === true )
						{
							setTimeout( function(){ viewdiv.viewContainer.style.opacity = 1; }, 1 );
						}
						// Don't show the view window if it's hidden
						else viewdiv.viewContainer.style.opacity = 1;
						viewdiv.viewContainer.style.visibility = '';
						viewdiv.viewContainer.style.pointerEvents = '';
					}
					if( flag == 'invisible' )
					{
					    if( value == true || value == 'true' )
					    {
					        viewdiv.viewContainer.classList.add( 'Invisible' );
					    }
					    else
					    {
					        viewdiv.viewContainer.classList.remove( 'Invisible' );
					    }
					}
					ResizeWindow( viewdiv );
					RefreshWindow( viewdiv );
				}
				this.flags[ flag ] = value;
				PollTaskbar();
				break;
			case 'liveView':
			    if( value == true || value == 'true' )
			    {
			        viewdiv.viewContainer.classList.add( 'Liveview' );
			    }
			    else
			    {
			        viewdiv.viewContainer.classList.remove( 'Liveview' );
			    }
			    break;
			case 'screen':
				this.flags.screen = value;
				break;
			case 'minimized':
				if( viewdiv )
				{
					if( value == 'true' || value == true )
					{
						if( viewdiv.doMinimize )
						{
							viewdiv.doMinimize();
						}
					}
					else if( value == 'false' || value == false )
					{
						_ActivateWindow( viewdiv );
						_WindowToFront( viewdiv );
					}
				}
				this.flags.minimized = value;
				break;
			case 'title':
				if( !Trim( value ) )
					value = i18n( 'i18n_untitled_window' );
				SetWindowTitle( viewdiv, value );
				this.flags.title = value;
				break;
			case 'theme':
				this.flags.theme = value;
				break;
			case 'fullscreenenabled':
				this.flags.fullscreenenabled = value;
				break;
			case 'background':
			    this.flags.background = value;
			    if( value == false )
			    {
			        viewdiv.classList.remove( 'TransparentBg' );
		        }
		        else
		        {
		            viewdiv.classList.add( 'TransparentBg' );
		        }
			    break;
			case 'transparent':
				this.flags.transparent = value;
				if( viewdiv )
				{
					viewdiv.setAttribute( 'transparent', value ? 'transparent': '' );
				}
				break;
			// TODO: Use it when ready
			// Allow for dropping files in a secure manner
			case 'securefiledrop':
				this.flags.securefiledrop = value;
				break;
			case 'windowInactive':
			case 'windowActive':
			    if( isMobile ) return false;
				// Check window color
				this.flags[ flag ] = value;
				break;
			case 'sidebarManaged':
				if( viewdiv && viewdiv.parentNode )
				{
					if( value == 'true' || value == true )
					    viewdiv.parentNode.classList.add( 'SidebarManaged' );
					else viewdiv.parentNode.classList.remove( 'SidebarManaged' );
				}
    			this.flags[ flag ] = value;
			    break;
			// Takes all flags
			default:
				this.flags[ flag ] = value;
				return;
		}

		// Some values are not set on application
		if( flag == 'screen' ) return;

		// Support dashboard
		if( window.Workspace && Workspace.dashboard && Workspace.dashboard !== true )
			Workspace.dashboard.refresh();
		
		// Finally set the value on application

		// Notify window if possible
		// TODO: Real value after its evaluated
		if( !Workspace.applications )
			return;
		for( let a = 0; a < Workspace.applications.length; a++ )
		{
			let app = Workspace.applications[a];
			if( app.applicationId == viewdiv.applicationId )
			{
				app.contentWindow.postMessage( JSON.stringify( {
					command: 'notify',
					method:  'setviewflag',
					viewId: viewdiv.windowObject.viewId,
					applicationId: app.applicationId,
					flag:    flag,
					value:   value
				} ), '*' );
				break;
			}
		}
	}
	this.parseFlags = function( flags, filter )
	{
		if( !this.flags ) this.flags = {};
		for( var a in flags )
		{
			// Just parse by filter
			if( filter )
			{
				let fnd = false;
				for( var b in filter )
				{
					if( a == filter[b] )
					{
						fnd = true;
						break;
					}
				}
				if( !fnd ) continue;
			}
			if( a == 'screen' && !flags[a] )
			{
				if( typeof( currentScreen ) != 'undefined' && currentScreen )
					flags[a] = currentScreen.screenObject;
			}
			this.setFlag( a, flags[a] );
		}
		// We always need a screen
		if( !this.flags.screen && typeof( currentScreen ) != 'undefined' )
		{
			this.flags.screen = currentScreen.screenObject;
		}
	}
	this.getFlag = function( flag )
	{
		if( typeof( this.flags[flag] ) != 'undefined' )
		{
			switch( flag )
			{
				case 'top':
				{
					let fg = this.flags[ flag ];
					fg += '';
					if( fg.indexOf( '%' ) > 0 ) return fg;
					else return parseInt( fg );
					break;
				}
				case 'left':
				{
					let fg = this.flags[ flag ];
					fg += '';
					if( fg.indexOf( '%' ) > 0 ) return fg;
					else return parseInt( fg );
					break;
				}
				case 'width':
				{
					let fl = this.flags[flag];
					if( fl.indexOf && fl.indexOf( '%' ) > 0 )
						return fl;
					if( fl == 'max' && this.flags && this.flags.screen )
					{
						fl = this.flags.screen.getMaxViewWidth();
					}
					return fl;
				}
				case 'height':
				{
					let fl = this.flags[flag];
					if( fl.indexOf && fl.indexOf( '%' ) > 0 )
						return fl;
					if( fl == 'max' && this.flags && this.flags.screen )
					{
						fl = this.flags.screen.getMaxViewHeight();
					}
					return fl;
				}
			}
			return this.flags[flag];
		}
		// No flags set.. just get the raw data if possible, and defaults
		else if( this._window )
		{
			let w = this._window.parentNode;
			switch( flag )
			{
				case 'left':
					return parseInt( w.style.left );
					break;
				case 'top':
					return parseInt( w.style.top );
					break;
			}
			return false;
		}
		return false;
	}
	
	this.openCamera = function( flags, callback )
	{
		
		let self = this;
		
		// Just get the available devices
		function getAvailableDevices( cbk )
		{
			if( !navigator.mediaDevices )
			{
				return cbk( { response: -1, message: 'Could not get any devices.' } );
			}
			navigator.mediaDevices.enumerateDevices().then( function( devs ) {
				cbk( { response: 1, message: 'Success', data: devs } );
			} ).catch( function( err ) {
				return cbk( { response: -1, message: err } );
			} );
		}
		
		function setCameraEvents( ele )
		{
			ele.ontouchstart = function( e )
			{
				this.offX = e.touches[0].clientX;
				this.timeStamp = ( new Date() ).getTime();
			}
		
			ele.ontouchend = function( e )
			{
				let diff = e.changedTouches[0].clientX - this.offX;
				let difftime = ( new Date() ).getTime() - this.timeStamp;
				if( difftime > 200 )
				{
					return;
				}
				// Swipe right
				if( diff < 127 )
				{
					setCameraMode();
				}
				// Swipe left
				else if( diff > 127 )
				{
					setCameraMode();
				}	
			}
		}
		
		function setCameraMode( e )
		{
			let v = null;
			if( !self.cameraOptions )
			{
				self.cameraOptions = {
					devices: e,
					currentDevice: false
				};
				// Add container
				v = document.createElement( 'div' );
				v.className = 'FriendCameraContainer';
				self.content.appendChild( v );
				self.content.container = v;
				self.content.classList.add( 'HasCamera' );
				
				
			
			}
			
			// Find video devices
			let initial = false;
			let devs = [];
			for( var a in self.cameraOptions.devices )
			{
				let dev = self.cameraOptions.devices[ a ];
				if( dev.kind == 'videoinput' )
				{
					//we want back facing camera as default...
					if( dev.label && dev.label.indexOf('back') > -1 && !self.cameraOptions.currentDevice ) 
					{
						self.cameraOptions.currentDevice = dev;
						initial = true;
					}
					else 
					{
						//we overwrite on purpose here! most handsets have backwards facing cameras last...
						self.cameraOptions.potentialDevice = dev
					}
					devs.push( dev );
				}
			}
			if( !self.cameraOptions.currentDevice && self.cameraOptions.potentialDevice )
			{
				self.cameraOptions.currentDevice = self.cameraOptions.potentialDevice
				initial = true;
			}
			
			// Initial pass over, now just choose next device
			if( !initial )
			{
				let found = nextfound = false;
				for( var a = 0; a < devs.length; a++ )
				{
					if( devs[a].deviceId == self.cameraOptions.currentDevice.deviceId )
					{
						found = true;
					}
					// We found stuff
					else if( found )
					{
						nextfound = true;
						self.cameraOptions.currentDevice = devs[a];
						break;
					}
				}
				// Wrap around
				if( !nextfound )
				{
					self.cameraOptions.currentDevice = devs[0];
				}
			}
			let constraints = {
				video: {
					deviceId: { exact: self.cameraOptions.currentDevice.deviceId }
				}
			};
			
			let ue = navigator.userAgent.toLowerCase();
			
			if( navigator.gm ) { 
				
				//check if we should stop stuff before we try again...
				let dd = self.content.container.camera;
				if(dd && dd.srcObject)
				{
					dd.srcObject.getTracks().forEach(track => track.stop())
					dd.srcObject = null;
				}
				if( self.content.container.camera ) self.content.container.removeChild( self.content.container.camera );
				delete self.content.container.camera;
				delete navigator.gm;
			}
			
			// Shortcut
			navigator.gm = (navigator.getUserMedia ||
				navigator.webkitGetUserMedia ||
				navigator.mozGetUserMedia || 
				navigator.msGetUserMedia
			);

			if( navigator.gm )
			{
				navigator.gm( 
					constraints, 
					function( localMediaStream )
					{
						// Remove old video object
						//might be too late here? at least on mobile? moved this check up a couple of lines..
						let oldCam = self.content.container.camera;
						if( oldCam && oldCam.srcObject )
						{
							oldCam.srcObject.getTracks().forEach( track => track.stop() );
							oldCam.srcObject = localMediaStream;
						}
						else
						{
							// New element!
							let vi = document.createElement( 'video' );
							vi.setAttribute( 'autoplay', 'autoplay' );
							vi.setAttribute( 'playinline', 'playinline' );
							vi.className = 'FriendCameraElement';
							vi.srcObject = localMediaStream;
							self.content.container.appendChild( vi );
							self.content.container.camera = vi;
					
							setCameraEvents( vi );
						}
					
						// Create an object URL for the video stream and use this 
						// to set the video source.
						self.content.container.camera.srcObject = localMediaStream;
					
						// Add the record + switch button
						if( !self.content.container.button )
						{
							let btn = document.createElement( 'button' );
							btn.className = 'IconButton IconSmall fa-camera';
							btn.onclick = function( e )
							{
								let dd = self.content.container.camera;
								let canv = document.createElement( 'canvas' );
								canv.setAttribute( 'width', dd.videoWidth );
								canv.setAttribute( 'height', dd.videoHeight );
								v.appendChild( canv );
								let ctx = canv.getContext( '2d' );
								ctx.drawImage( dd, 0, 0, dd.videoWidth, dd.videoHeight );
								let dt = canv.toDataURL( 'image/jpeg', 0.95 );
						
								// Stop taking video
								dd.srcObject.getTracks().forEach(track => track.stop())
								dd.srcObject = null;
						
								// FLASH!
								v.classList.add( 'Flash' );
								setTimeout( function()
								{
									v.classList.add( 'Flashing' );
									setTimeout( function()
									{
										v.classList.remove( 'Flashing' );
										setTimeout( function()
										{
											v.classList.add( 'Closing' );
											setTimeout( function()
											{
												callback( { response: 1, message: 'Image captured', data: dt } );
												v.parentNode.removeChild( v );
											}, 250 );
										}, 250 );
									}, 250 );
								}, 5 );
							}
							self.content.container.appendChild( btn );
							
							
							let switchbtn = document.createElement( 'button' );
							switchbtn.className = 'IconButton IconSmall fa-refresh';
							switchbtn.onclick = function() { setCameraMode() };
							self.content.container.appendChild( switchbtn );

							//stop the video if the view is closed!
							self.addEvent('systemclose', function() {
								let dd = self.content.container.camera;
								if(dd && dd.srcObject )
								{
									dd.srcObject.getTracks().forEach(track => track.stop())
									dd.srcObject = null;									
								}
							});
							
							//register our button in the container... to not do this twice							
							self.content.container.button = btn;
						}
					},
					function( err )
					{
						v = self.content;
						// Log the error to the console.
						callback( { response: -2, message: 'Could not access camera. getUserMedia() failed.' + err } );
						if( v )
						{
							v.classList.add( 'Closing' );
							/*setTimeout( function()
							{
								v.parentNode.removeChild( v );
							},  250 );*/
						}
					}
				);
			}
			else
			{
				// TODO: Hogne
				// Remove video
				v.removeChild( d );
			
				// Add fallback
				let fb = document.createElement( 'div' );
				fb.className = 'FriendCameraFallback';
				v.appendChild( fb );
				let mediaElement = document.createElement( 'input' );
				mediaElement.type = 'file';
				mediaElement.accept = 'image/*';
				mediaElement.className = 'FriendCameraInput';
				fb.innerHTML = '<p>' + i18n( 'i18n_camera_action_description' ) + 
					'</p><button class="IconButton IconSmall IconBig fa-camera">' + i18n( 'i18n_take_photo' ) + '</button>';
				fb.appendChild( mediaElement );
			
				setTimeout( function()
				{
					fb.classList.add( 'Showing' );
				}, 5 );
			
				mediaElement.onchange = function( e )
				{
					let reader = new FileReader();
					reader.onload = function( e )
					{
						
						let dataURL = e.target.result;
						v.classList.remove( 'Showing' );
						setTimeout( function()
						{
							callback( { response: 1, message: 'Image captured', data: dataURL } );
							v.parentNode.removeChild( v );
						}, 250 );
					}
					reader.readAsDataURL( mediaElement.files[0] );
				}
			}
		}

		// prepare for us to use to external libs. // good quality resize + EXIF data reader
		// https://github.com/blueimp/JavaScript-Load-Image/blob/master/js/load-image.all.min.js
		if( !self.cameraIncludesLoaded )
		{
			Include( '/webclient/3rdparty/load-image.all.min.js', function()
			{
				// Execute async operation
				self.cameraIncludesLoaded = true;
				getAvailableDevices( function( e ){ setCameraMode( e.data ) } );				
			});
		}
		else
		{
			getAvailableDevices( function( e ){ setCameraMode( e.data ) } );				
		}
	}
	
	// Add a child window to this window
	this.addChildWindow = function( ele )
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
		let el = this._window.getElementsByTagName ( '*' );
		let out = [];
		for( var a = 0; a < el.length; a++ )
		{
			if( el[a].className )
			{
				let cls = el[a].className.split ( ' ' );
				for( var b = 0; b < cls.length; b++ )
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
	this.getViewId = function()
	{
		return this._window.viewId;
	}
	// Add events for stuff
	this.addEvent = function( event, func )
	{
		if( event == 'systemclose' )
		{
			if( !this.eventSystemClose ) this.eventSystemClose = [];
			this.eventSystemClose.push( func );
		}
		return this._window.AddEvent( event, func );
	}
	// Remove event
	this.removeEvent = function( event, func )
	{
		return this._window.RemoveEvent( event, func );
	}
	// Add an event on a sub element
	this.addEventByClass = function( className, event, func )
	{
		let ele = this.getSubContent( '.' + className );
		if( ele )
		{
			if( ele.addEventListener )
				ele.addEventListener( event, func, false );
			else ele.attachEvent( 'on' + event, func, false );
		}
	}
	// Set menu items on window
	this.setMenuItems = function( obj, appid, viewId )
	{
		// Set destination
		if( viewId ) this._window.menuViewId = viewId;
		// Set items
		this._window.menu = obj;
		WorkspaceMenu.generated = false;
		if( appid && ( window.isMobile || IsSharedApp() ) )
		{
			this._window.applicationId = appid;
		}
		CheckScreenTitle( null, true );
	}
	this.setBlocker = function( blockwin )
	{
		this._window.blocker = blockwin;
	}
	this.removeBlocker = function()
	{
		this._window.blocker = false;
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

	this.setSticky = function()
	{
		this._window.parentNode.parentNode.setAttribute( 'sticky', 'sticky' );
	}

	// Now set it up! --------------------------------------------------------->
	self.viewId = args.viewId;
	self.applicationId = args.applicationId;
	self.authId = args.authId;
	self.applicationName = args.applicationName;
	self.applicationDisplayName = args.applicationDisplayName;

	if( !args.id ) args.id = false;
	
	// Fullscreen single task
	if( Workspace.isSingleTask )
	{
		args.width = 'max';
		args.height = 'max';
		args.left = 0;
		args.top = 0;
		args.resize = false;
	}
	
	// TODO: Native window mode should work!
	/*let webapp = document.location.href.indexOf( '/webapp.html' ) > 0;
	if( webapp && !window.windowCount ) window.windowCount = 0;
	if( webapp && window.windowCount++ > 1 )
	{
		let uid = args.id ? args.id : UniqueId();
		let nw = window.open( '', uid, 'width=' + args.width + ',height=' + args.height + ',status=no,toolbar=no,topbar=no,windowFeatures=popup' );
		self._nativeWindow = nw;
		self._type = 'native';
		
		let bod = nw.document.body;
		let elements = [ 'Content', 'Title', 'Leftbar', 'Rightbar', 'Bottombar', 'ViewTitle' ];
		let content = null;
		for( let a in elements )
		{
			let d = nw.document.createElement( 'div' );
			d.className = elements[ a ];
			bod.appendChild( d );
			if( elements[ a ] == 'Content' )
			{
				content = d;
			}
			else if( content )
			{
				let key = elements[ a ].toLowerCase();
				if( key == 'title' ) key = 'titleBar';
				else if( key == 'viewtitle' ) key = 'viewTitle';
				content[ key ] = d;
			}
		}
		
		movableWindows[ uid ] = content;
		
		bod.querySelector( '.Title' ).innerHTML = '<span></span>';
		bod.classList.remove( 'Loading' );
		self.createContentEventFuncs( content );
		content.windowObject = self;
		self._window = content;
		self.content = content;
		self.content.windowObject = self;
		self.flags = args;
	}
	else 
	{*/
		this.createDomElements( 'CREATE', args.title, args.width, args.height, args.id, args, args.applicationId );
	//}

	if( !self._window || !self._window.parentNode ) return false;

	if( !this._window )
	{
		this.ready = false;
		return;
	}
	else this.ready = true;

	this.isRich = false;
	this.childWindows = [];

	CheckScreenTitle();

	// Done setting up view ---------------------------------------------------<
}

Friend.GUI.view.cleanWindowArray = function( ele )
{
	let out = [];
	let found = true;
	for( var a in movableWindows )
	{
		if( a != ele.id && movableWindows[ a ] != ele )
			out[ a ] = movableWindows[ a ];
	}
	out[ ele.id ] = ele;
	movableWindows = out;
}

// Reorganize view window positions on responsive browser
Friend.GUI.reorganizeResponsiveMinimized = function()
{
	if( !isMobile ) return;
	if( !Workspace.screen || !Workspace.screen.contentDiv ) return;
	
	if( currentMovable && currentMovable.classList.contains( 'Active' ) )
		return;
	
	// Check if we have a maximized window
	CheckMaximizedView();
	
	if( document.body.classList.contains( 'ViewMaximized' ) )
	{
		// Here is the first screen
		Workspace.screen.contentDiv.style.transform = 'translate3d(0,0,0)';
		return;
	}
	
	let boxWidth = 96;  // Window width when minimized
	let boxHeight = 80; // Window height when minimized
	
	let marginX = 12; // Minimum margin
	let marginY = 42;
	
	let pageW  = Workspace.screen.contentDiv.parentNode.offsetWidth;
	let pageH  = Workspace.screen.contentDiv.offsetHeight;
	
	// Maximum widths in page
	let maxCount = Math.floor( pageW / ( boxWidth + marginX ) );
	// Calculate optimum horiz margin (adds right margin with +1)
	marginX = ( pageW - ( boxWidth * maxCount ) ) / ( maxCount + 1 );
	
	let startY = 12;
	let page = 0;
	let pageX2 = pageW;
	let iconHeight = false;
	let pageX1 = 0;
	let gridX = marginX;
	let gridY = startY;
	
	for( var a in movableWindows )
	{
		let v = movableWindows[ a ];
		let c = v.parentNode; // ViewContainer
		if( c.classList.contains( 'Active' ) )
		{
			// These views are handled by css...
			c.classList.remove( 'OnWorkspace' );
			continue;
		}
		// Non-mainview windows are not displayed
		else if( !v.windowObject.flags.mainView && v.windowObject.applicationId )
		{
			c.style.top = '-200%';
			c.classList.remove( 'OnWorkspace' );
			continue;
		}
		else if( c.style.display == 'none' || v.style.display == 'none' )
		{
			continue;
		}
		
		c.classList.add( 'OnWorkspace' );
		
		// Next row
		if( gridX + boxWidth >= pageX2 )
		{
			gridX = pageX1 + marginX;
			gridY += iconHeight;
			
			// Next horizontal page
			if( gridY + boxHeight >= pageH )
			{
				gridY = startY;
				pageX1 += pageW;
				pageX2 += pageW;
				gridX = pageX1 + marginX;
				page++;
			}
		}
		
		if( !iconHeight )
		{
			iconHeight = boxHeight + marginY;
		}
		
		// Position and size
		c.style.top = gridY + 'px';
		c.style.left = gridX + 'px';
		c.style.width = boxWidth + 'px';
		c.style.height = boxHeight + 'px';
		c.style.minWidth = boxWidth + 'px';
		c.style.minHeight = boxHeight + 'px';
		
		// Next column
		gridX += boxWidth + marginX;
	}
	// Store how many pages we are counting..
	Friend.GUI.responsiveViewPageCount = page;
	
	// Resize screen content
	Workspace.screen.contentDiv.style.width = ( pageW * ( page + 1 ) ) + 'px';
	
	// Reposition content div
	if( Friend.GUI.responsiveViewPage > page )
	{
		Friend.GUI.responsiveViewPage = page;
	}
	Workspace.screen.contentDiv.style.transform = 'translate3d(' + ( pageW * ( -Friend.GUI.responsiveViewPage ) ) + 'px,0,0)';
}

// Intermediate anchor for code that uses new Window()
var Window = View;

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
	let v = new View( {
		'title'  : !title ? i18n('Alert') : title,
		'width'  : 400,
		'height' : 120,
		'standard-dialog': true
	} );
	v.setSticky();
	v.setContent( '<div class="Dialog Box ContentFull">' + msg + '</div>' );
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
		let win = window.currentMovable.windowObject;
		if( !win ) return;

		win.ctrlKey = false;
		win.shiftKey = false;
		if( e.ctrlKey ) win.ctrlKey = true;
		if( e.shiftKey ) win.shiftKey = true;

		if( win.handleKeys )
		{
			let abort = false;
			let k = e.which ? e.which : e.keyCode;
			if( e.ctrlKey )
			{
				switch ( k )
				{
					// q for quit
					case 81:
						abort = true;
						win.close();
						break;
					// f for fullscreen
					case 70:
						win.fullscreen();
						break;
				}
			}
			if( win.handleKeys( k, e ) )
				return cancelBubble( e );
			if( abort )
				return cancelBubble( e );
		}
		/*if( e.ctrlKey )
		{
			// Send the message to the window, giving it an opportunity to
			// respond
			let k = e.which ? e.which : e.keyCode;
			win.sendMessage( { command: 'handlekeys', key: k, ctrlKey: true, shiftKey: e.shiftKey } );
			return cancelBubble( e );
		}*/
	}
}

function _kresponseup( e )
{
	if ( window.currentMovable )
	{
		let win = window.currentMovable.windowObject;

		/*if ( ( e.ctrlKey || e.shiftKey ) && typeof ( win.handkeKeys ) )
		{
			if ( e.preventDefault ) e.preventDefault ();
			return cancelBubble ( e );
		}*/
	}
}

// Resize all screens
function _kresize( e, depth )
{
	if( !depth ) depth = 0;
	
	checkMobileBrowser();
	
	forceScreenMaxHeight();	
	
	// Resize screens
	if( Workspace && Workspace.screenList )
	{
		//console.log( 'Everything resized.' );
		for( let a = 0; a < Workspace.screenList.length; a++ )
		{
			Workspace.screenList[a].resized = true;
			Workspace.screenList[a].resize();
		}
		if( globalConfig.workspacecount > 1 )
		{
			if( Workspace.initWorkspaces )
				Workspace.initWorkspaces();
		}
		if( Workspace.checkWorkspaceWallpapers )
			Workspace.checkWorkspaceWallpapers();
	}
	
	if( isMobile && depth > 0 )
	{
		return ConstrainWindow( currentMovable );
	}
	
	// Resize windows
	for( let a in movableWindows )
	{
		ConstrainWindow( movableWindows[a] );
	}
	
	if( depth == 0 )
	{
		// ios fix
		let nav = navigator.userAgent.toLowerCase();
		if( nav.indexOf( 'iphone' ) >= 0 || nav.indexOf( 'ipad' ) >= 0 )
		{
			setTimeout( function()
			{
				_kresize( e, 1 );
			}, 500 );
		}
	}
	
	if( Workspace.nudgeWorkspacesWidget )
		Workspace.nudgeWorkspacesWidget();
}

function Confirm( title, string, okcallback, oktext, canceltext, extrabuttontext, extrabuttonreturn )
{
	let d = document.createElement( 'div' );
	d.style.position = 'absolute';
	d.style.left = '-10000px';
	d.style.width = '400px';
	d.innerHTML = string;
	document.body.appendChild( d );

	let curr = window.currentMovable;

	let v;
	if( !window.isMobile || Workspace.dashboard )
	{
		v = new View( {
			title: title,
			width: 400,
			resize: false,
			height: d.offsetHeight + 105,
			id: 'confirm_' + title.split( /[\s]+/ ).join( '' ) + ( new Date() ).getTime() + Math.random(),
			'standard-dialog': true
		} );
	}
	else
	{
		v = new Widget( {
			width: 'full',
			height: 'full',
			above: true,
			animate: true,
			transparent: true,
			id: 'confirm_' + title.split( /[\s]+/ ).join( '' ) + ( new Date() ).getTime() + Math.random()
		} );
	}

	v.onClose = function()
	{
		if( okcallback ) okcallback( false )
	}

	v.setSticky();

	d.parentNode.removeChild( d );

	let f = new File( 'System:templates/confirm.html' );
	f.type = 'confirm';
	let thirdbutton = '';
	/* check for third button values */
	if( extrabuttontext && extrabuttonreturn )
	{
		thirdbutton = '<div style="float:left;"><button id="thirdbutton" data-returnvalue="'+ extrabuttonreturn +'">'+ extrabuttontext +'</button></div>'
	}
	
	f.replacements = {
		'string'       : string,
		'okbutton'     : ( oktext ? oktext : i18n('i18n_affirmative') ),
		'cancelbutton' : ( canceltext ? canceltext : i18n('i18n_cancel') ),
		'thirdbutton'  : thirdbutton
	};
	
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
		let eles = v._window.getElementsByTagName( 'button' );
		if( !eles && v.dom )
		{
			eles = v.dom.getElementsByTagName( 'button' );
		}

		// FL-6/06/2018: correction so that it does not take the relative position of OK/Cancel in the box 
		// US-792 - 2020: Correction to fix sending the same delete request multiple times
		for( let el = 0; el < eles.length; el++ )
		{
			( function( itm )
			{
				if( itm.id == 'ok' )
				{
					itm.onclick = function()
					{
						let k = okcallback; okcallback = null;
						v.close();
						k( true );
					}
					itm.focus();
				}
				else if( itm.id == 'cancel' )
				{
					itm.onclick = function()
					{
						let k = okcallback; okcallback = null;
						v.close();
						k( false );
					}
				}
				else
				{
					itm.onclick = function( e )
					{
						if( e && e.target && e.target.hasAttribute( 'data-returnvalue' ) )
						{
							okcallback( e.target.getAttribute( 'data-returnvalue' ) );
						}
						else
						{
							okcallback( e );
						}
						okcallback = null;
						v.close();
					}
				}
			} )( eles[ el ] );
		}
		if( !window.isMobile )
		{	
			_ActivateWindow( v._window.parentNode );
			_WindowToFront( v._window.parentNode );
		}
	}
	f.load();
	return v; // The window
}

function Alert( title, string, cancelstring, callback )
{

	if(!title) title = 'Untitled';

	let d = document.createElement( 'div' );
	d.style.position = 'absolute';
	d.style.left = '-10000px';
	d.style.width = '400px';
	d.innerHTML = string;
	document.body.appendChild( d );

	// Register current movable
	let curr = window.currentMovable;

	let minContentHeight = 100;
	if( d.offsetHeight > minContentHeight )
		minContentHeight = d.offsetHeight;
	
	let themeTitle = GetThemeInfo( 'ViewTitle' ).height;
	let themeBottom = GetThemeInfo( 'ViewBottom' ).height;
	
	let v;
	if( !window.isMobile || Workspace.dashboard )
	{
		v = new View( {
			title: title,
			width: 400,
			resize: false,
			height: minContentHeight + parseInt( themeTitle ) + parseInt( themeBottom ),
			id: 'alert_' + title.split( /[\s]+/ ).join( '' ) + ( new Date() ).getTime() + Math.random(),
			'standard-dialog': true
		} );
	}
	else
	{
		v = new Widget( {
			width: 'full',
			height: 'full',
			above: true,
			animate: true,
			transparent: true,
			id: 'alert_' + title.split( /[\s]+/ ).join( '' ) + ( new Date() ).getTime() + Math.random()
		} );
	}
	
	v.onClose = function()
	{
	}
	
	v.setSticky();

	d.parentNode.removeChild( d );

	let f = new File( 'System:templates/alert.html' );
	f.replacements = {
		'string': string,
		'understood': cancelstring ? cancelstring : i18n( 'i18n_understood' )
	}
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
		let eles = v._window.getElementsByTagName( 'button' );
		if( eles && eles.length )
		{
			eles[0].onclick = function()
			{
				v.close();
				if( callback ) callback();
			}
		
			if( !window.isMobile )
			{
				_ActivateWindow( v._window.parentNode );
				_WindowToFront( v._window.parentNode );
			}
		}
		else
		{
			v.close();
			console.log( '[Alert] Could not process alert dialog template.' );
		}
	}
	f.load();
	return v; // the window
}

// Get final sandbox scripts
function getSandboxFlags( win, defaultFlags )
{
	let flags = win.getFlag( 'sandbox' );
	if( flags === false && flags !== '' )
	{
		flags = defaultFlags;
	}
	if( flags === false ) flags = '';
	return flags;
}

function putSandboxFlags( iframe, flags )
{
	if( flags != '' && flags ) iframe.setAttribute( 'sandbox', flags );
	else iframe.removeAttribute( 'sandbox' );
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

// GUI functions
Friend.GUI.checkWindowState = function( state )
{
	if( !window.currentMovable ) return false;
	if( !currentMovable.windowObject ) return false;
	let wo = window.currentMovable.windowObject;
	if( wo.states[ state ] )
	{
		return true;
	}
	return false;
}


