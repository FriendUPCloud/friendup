/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Apps on startup
Friend.startupApps = {};

window.Sounds = {};
Sounds.newMessage = new Audio('/themes/friendup13/sound/new_message.ogg');

// Application messaging start -------------------------------------------------
ApplicationMessagingNexus = {
	ports: {},
	// Opens a message port on application
	open: function( appid, callback )
	{
		let fapp = false;
		for( let a = 0; a < Workspace.applications.length; a++ )
		{
			if( Workspace.applications[ a ].applicationId == appid )
			{
				fapp = Workspace.applications[ a ];
				break;
			}
		}
		if( fapp )
		{
			this.ports[ appid ] = {
				hash: CryptoJS.SHA1( appid ).toString(),
				app: fapp
			};
		}
		// Call back
		if( callback )
		{
			callback( fapp ? true : false );
		}
	},
	// Closes a messageport on application
	close: function( appid, callback )
	{
		let found = false;
		let newl = {};
		for( let a in this.ports )
		{
			if( a == appid )
			{
				found = this.ports[ a ];
			}
			else
			{
				newl[ a ] = this.ports[ a ];
			}
		}
		if( found )
		{
			this.ports = newl;
			if( found.app.sendMessage )
			{
				found.app.sendMessage( {
					type: 'applicationmessage',
					command: 'closed'
				} );
			}
		}
		// Callback
		if( callback )
		{
			callback( found ? true : false );
		}
	}
};
// Application messaging end ---------------------------------------------------

Doors = Workspace;

// Triggered on mouse leaving
function DoorsOutListener( e )
{
	if ( e.relatedTarget == null )
	{
		movableMouseUp( e );
	}
	// Keep alive!
	if( document.hidden || !document.hasFocus() )
		return Workspace.updateViewState( 'inactive' );
	Workspace.updateViewState( 'active' );
}
function DoorsLeaveListener( e )
{
	movableMouseUp( e );
	
	// Keep alive!
	if( document.hidden || !document.hasFocus() )
		return Workspace.updateViewState( 'inactive' );
	Workspace.updateViewState( 'active' );
}
function DoorsKeyUp( e )
{
	Workspace.shiftKey = e.shiftKey;
	Workspace.ctrlKey = e.ctrlKey;
	Workspace.altKey = e.altKey;
	Workspace.metaKey = e.metaKey;
	
	// Hide task switcher
	if( e.which == 91 || ( !Workspace.shiftKey && !Workspace.ctrlKey ) )
	{
		if( window.DeepestField )
			DeepestField.selectTask();	
	}
}
function DoorsKeyDown( e )
{
	// Keep alive!
	Workspace.updateViewState( 'active' );

	let w = e.which ? e.which : e.keyCode;
	let tar = e.target ? e.target : e.srcElement;
	Workspace.shiftKey = e.shiftKey;
	Workspace.ctrlKey = e.ctrlKey;
	Workspace.altKey = e.altKey;
	Workspace.metaKey = e.metaKey;
	
	if( e.ctrlKey || e.metaKey )
	{
		if( w == 65 )
		{
			if( currentMovable && currentMovable.content.directoryview )
			{
				currentMovable.content.directoryview.SelectAll();
				return cancelBubble( e );
			}
		}
		else if( w == 77 || w == 27 )
		{
			Workspace.toggleStartMenu();
			return cancelBubble( e );
		}
	}
	
	// Start menu key navigation
	if( Workspace.smenu && Workspace.smenu.visible )
	{
		let m = Workspace.smenu;
		let move = false;
		switch( e.which )
		{
			case 38:
				move = 'up';
				break;
			case 40:
				move = 'down';
				break;
			case 37:
				move = 'right';
				break;
			case 39:
				move = 'left';
				break;
			case 13:
				move = 'enter';
				break;
		}
		if( move )
		{
			// Cycle
			if( !m.currentItem )
			{
				let cm = m.dom.getElementsByTagName( '*' )[0];
				if( !cm )
					return;
				let itms = cm.getElementsByClassName( 'DockMenuItem' );
				if( move == 'up' )
				{
					for( let a = 0; a < itms.length; a++ )
					{
						if( itms[a].parentNode != cm ) continue;
					}
					m.currentItem = itms[ a - 1 ];
				}
				else if( move == 'down' )
				{
					m.currentItem = itms[0];
				}
			}
			// Cycle
			else
			{
				let itms = m.currentItem.parentNode.getElementsByClassName( 'DockMenuItem' );
				if( move == 'enter' )
				{
					m.currentItem.onclick( e );
				}
				else if( move == 'left' )
				{
					let ts = m.currentItem.getElementsByClassName( 'DockMenuItem' );
					for( let a = 0; a < ts.length; a++ )
					{
						if( ts[a].parentNode != ts[0].parentNode ) continue;
						m.currentItem = ts[a];
					}
				}
				else if( move == 'right' )
				{
					m.currentItem = m.currentItem.parentNode.parentNode;
				}
				else if( move == 'up' )
				{
					let sameLevel = [];
					for( let a = 0; a < itms.length; a++ )
					{
						if( itms[a].parentNode != m.currentItem.parentNode )
							continue;
						sameLevel.push( itms[a] );
					}
					for( let a = 0; a < sameLevel.length; a++ )
					{
						if( sameLevel[a] == m.currentItem )
						{
							if( a > 0 )
							{
								m.currentItem = sameLevel[ a - 1 ];
								break;
							}
							else
							{
								m.currentItem = sameLevel[ sameLevel.length - 1 ];
								break;
							}
						}
					}
				}
				else if( move == 'down' )
				{
					let sameLevel = [];
					for( let a = 0; a < itms.length; a++ )
					{
						if( itms[a].parentNode != m.currentItem.parentNode )
							continue;
						sameLevel.push( itms[a] );
					}
					for( let a = 0; a < sameLevel.length; a++ )
					{
						if( sameLevel[a] == m.currentItem )
						{
							if( a < sameLevel.length - 1 )
							{
								m.currentItem = sameLevel[ a + 1 ];
								break;
							}
							else
							{
								m.currentItem = sameLevel[ 0 ];
								break;
							}
						}
					}
				}
			}
			if( m.currentItem )
			{
				let itms = Workspace.smenu.dom.getElementsByTagName( '*' );
				for( let a = 0; a < itms.length; a++ )
				{
					if( itms[a] != m.currentItem )
					{
						if( itms[a].classList ) itms[a].classList.remove( 'Active' );
					}
				}
				let t = m.currentItem;
				while( t && t != Workspace.smenu )
				{
					if( t.classList && t.classList.contains( 'DockMenuItem' ) )
						t.classList.add( 'Active' );
					t = t.parentNode;
				}
			}
		}
	}
	
	// Check keys on directoryview ---------------------------------------------
	if( window.currentMovable && currentMovable.content && currentMovable.content.directoryview )
	{
		if( w == 113 || w == 27 )
		{
			let icons = currentMovable.content.icons;
			let dvi = currentMovable.content.directoryview;
			for( let a = 0; a < icons.length; a++ )
			{
				if( icons[a].domNode && icons[a].domNode.classList.contains( 'Selected' ) )
				{
					// Abort editing
					if( w == 27 )
					{
						for( let b = 0; b < icons.length; b++ )
						{
							if( icons[b].domNode )
							{
								icons[b].domNode.classList.remove( 'Selected' );
								icons[b].domNode.classList.remove( 'Editing' );
								if( icons[b].editField )
								{
									icons[b].editField.parentNode.removeChild( icons[b].editField );
									icons[b].editField = null;
								}
							}
						}
						return cancelBubble( e );
					}
					// Aha, F2!
					icons[a].domNode.classList.add( 'Editing' );
					let input = document.createElement( 'textarea' );
					input.style.resize = 'none';
					input.className = 'Title';
					icons[a].editField = input;
					input.value = icons[a].Filename ? icons[a].Filename : icons[a].fileInfo.Filename;
					input.dom = dvi.listMode == 'listview' ? icons[a].domNode.querySelector( '.Column' ) : icons[a].domNode;
					icons[a].domNode.input = input;
					input.ico = icons[a];
					input.onkeydown = function( e )
					{
						clearTimeout( Workspace.editing );
						Workspace.editing = setTimeout( function()
						{
							Workspace.editing = false;
						}, 100 );
						if( e.which == 13 )
						{
							Workspace.executeRename( this.value, this.ico, currentMovable );
							this.ico.editField = null;
							this.dom.input = null;
							let s = this;
							setTimeout( function()
							{
								try
								{
									s.dom.removeChild( s );
								}
								catch( error )
								{
									/* .. */
								}
							}, 5 );
						}
					}
					input.onmousedown = function( e )
					{
						this.selectionStart = this.selectionEnd;
					}
					input.onmouseup = function( e )
					{
						return cancelBubble( e );
					}
					input.onblur = function()
					{
						this.onkeydown( { which: 13 } );
						return;
					}
					setTimeout( function()
					{
						input.select();
						input.focus();
					}, 50 );
					icons[a].domNode.appendChild( input );
				}
			}
		}
	}
	
	if( ( e.shiftKey && e.ctrlKey ) || e.metaKey )
	{
		if( globalConfig && globalConfig.workspacecount > 1 )
		{
			switch( w )
			{
				// ws 1
				case 49:
					Workspace.switchWorkspace( 0 );
					return cancelBubble( e );
				// ws 1
				case 50:
					Workspace.switchWorkspace( 1 );
					return cancelBubble( e );
				// ws 1
				case 51:
					Workspace.switchWorkspace( 2 );
					return cancelBubble( e );
				// ws 1
				case 52:
					Workspace.switchWorkspace( 3 );
					return cancelBubble( e );
				// ws 1
				case 53:
					Workspace.switchWorkspace( 4 );
					return cancelBubble( e );
				// ws 1
				case 54:
					Workspace.switchWorkspace( 5 );
					return cancelBubble( e );
				// ws 1
				case 55:
					Workspace.switchWorkspace( 6 );
					return cancelBubble( e );
				// ws 1
				case 56:
					Workspace.switchWorkspace( 7 );
					return cancelBubble( e );
				// ws 1
				case 57:
					Workspace.switchWorkspace( 8 );
					return cancelBubble( e );		
				// App cycling
				case 32:
					if( window.DeepestField )
						DeepestField.showTasks();
					break;
			}
		}
	}
	else if( e.ctrlKey && w == 32 )
	{
		if( window.DeepestField )
			DeepestField.showTasks();
	}

	if( !w || !e.ctrlKey )
	{
		switch( w )
		{
			// Escape means try to close the view
			case 27:
				// Inputs don't need to close the view
				if( tar && ( tar.nodeName == 'INPUT' || tar.nodeName == 'SELECT' || tar.nodeName == 'TEXTAREA' || tar.getAttribute( 'contenteditable' ) ) )
				{
					tar.blur();
					return;
				}
				if( mousePointer.elements.length )
				{
					mousePointer.elements = [];
					mousePointer.dom.innerHTML = '';
					mousePointer.drop();
					if( currentMovable && currentMovable.content )
					{
						if( currentMovable.content.refresh )
						{
							if( currentMovable.content.directoryview )
								currentMovable.content.directoryview.toChange = true;
							currentMovable.content.refresh();
						}
					}
					return;
				}
				break;
			default:
				//console.log( 'Clicked: ' + w );
				break;
		}
		return;
	}

	switch( w )
	{
		// Run command
		case 69:
			Workspace.showLauncher();
			return cancelBubble( e );
			break;
		default:
			//console.log( w );
			break;
	}
}

// TODO: Reevalute if we even need this
/*// Traps pasting to clipboard
document.addEventListener( 'paste', function( evt )
{
	if( typeof friend != undefined && typeof Friend.pasteClipboard == 'function' ) 
		Friend.pasteClipboard( evt );
} );

// paste handler. check Friend CB vs System CB.

function friendWorkspacePasteListener( evt )
{
	let mimetype = '';
	let cpd = '';

	if( !evt.clipboardData )
	{
		return true;
	}
	else if( evt.clipboardData.types.indexOf( 'text/plain' ) > -1 )
	{
		mimetype = 'text/plain';
	}

	//we only do text handling here for now
	if( mimetype != '' )
	{
		cpd = evt.clipboardData.getData( mimetype );

		//console.log('compare old and new',cpd,Friend.prevClipboard,Friend.clipboard);
		if( Friend.prevClipboard != cpd )
		{
			Friend.prevClipboard = Friend.clipboard;
			Friend.clipboard = cpd;
		}
	}
	return true;
}*/

function WindowResizeFunc()
{
	Workspace.redrawIcons();
	Workspace.repositionWorkspaceWallpapers();
	if( isMobile && Workspace.widget )
		Workspace.widget.setFlag( 'width', window.innerWidth );
	for( let a in movableWindows )
	{
		if( movableWindows[a].content && movableWindows[a].content.redrawIcons )
			movableWindows[a].content.redrawIcons();
	}
}

function InitWorkspaceEvents()
{
	if( window.attachEvent )
	{
		window.attachEvent( 'onmouseout', DoorsOutListener, false );
		window.attachEvent( 'onmouseleave', DoorsLeaveListener, false );
		window.attachEvent( 'onresize', WindowResizeFunc, false );
		window.attachEvent( 'onkeydown', DoorsKeyDown, false );
		window.attachEvent( 'onkeyup', DoorsKeyUp, false );
	}
	else
	{
		// Track fullscreen
		window.addEventListener( 'fullscreenchange', function( e )
		{
			// Add class when needed
			if( document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement )
				document.body.classList.add( 'Fullscreen' );
			else document.body.classList.remove( 'Fullscreen' );
		}, false );
		window.addEventListener( 'mouseout', DoorsOutListener, false );
		window.addEventListener( 'mouseleave', DoorsLeaveListener, false );
		window.addEventListener( 'resize', WindowResizeFunc, false );
		window.addEventListener( 'keydown', DoorsKeyDown, false );
		window.addEventListener( 'keyup', DoorsKeyUp, false );
		//window.addEventListener( 'paste', friendWorkspacePasteListener, false);
	}
}

function InitWorkspaceNetwork()
{
	let wsp = Workspace;
	
	if( wsp.workspaceNetworkInitialized ) return;
	wsp.workspaceNetworkInitialized = true;
	
	// Establish a websocket connection to the core
	if( !wsp.conn && wsp.sessionId && window.FriendConnection )
	{
		wsp.initWebSocket();
	}

	if( wsp.checkFriendNetwork )
		wsp.checkFriendNetwork();
	
	if( window.PouchManager && !this.pouchManager )
		this.pouchManager = new PouchManager();
}

// Voice -----------------------------------------------------------------------

function ExecuteVoiceCommands( e )
{
	alert( e.target.form.q.value );
}

// -----------------------------------------------------------------------------


// Popup an About FriendUP dialog...
function AboutFriendOS()
{
	if( !Workspace.sessionId ) return;
	let v = new View( {
		title: Workspace.osName + ' ' + Workspace.staticBranch,
		width: 540,
		height: 560,
		id: 'about_friendup'
	} );

	// Check for app token
	let token = '';
	if( isMobile && window.friendApp )
	{
		token = friendApp.get_app_token();
		if( token && token.length )
		{
			token = '<div class="item"><span class="label">App token</span><span class="value"> ' + token + '</span></div>';
		}
	}
	
	let s = new Module( 'system' );
	s.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			let json = false;
			try
			{
				json = JSON.parse( d );
			}
			catch( e ){};
			if( json && json.useAboutTemplate === '1' )
			{
				setData( json.liveAboutTemplate );
				return;
			}
		}
		setData();
	}
	s.execute( 'getserverglobals' );

	function setData( str )
	{
		if( !str ) str = false;
		
		v.setRichContentUrl( str ? str : '/webclient/templates/about.html', false, null, null, function()
		{
			let buildInfo = '<div id="buildInfo">no build information available</div>';
			if( Workspace.systemInfo && Workspace.systemInfo.FriendCoreBuildDate )
			{
				buildInfo = '<div id="buildInfo">';
				buildInfo += '	<div class="item"><span class="label">Build date</span><span class="value">'+ Workspace.systemInfo.FriendCoreBuildDate +'</span></div>';
				if( Workspace.systemInfo.FriendCoreBuildDate ) buildInfo += '	<div class="item"><span class="label">Version</span><span class="value">'+ Workspace.systemInfo.FriendCoreVersion +'</span></div>';
				if( Workspace.systemInfo.FriendCoreBuild ) buildInfo += '	<div class="item"><span class="label">Build</span><span class="value">'+ Workspace.systemInfo.FriendCoreBuild +'</span></div>';

				// Add app token
				if( token ) buildInfo += token;
			
				// Add device ID
				if( window.friendApp )
				{
					let ver = friendApp.get_version();
					if( ver )
					{
						buildInfo += '    <div class="item"><span class="label">Mobile App Version</span><span class="value">'+ ver +'</span></div>';
					}
					let devId = friendApp.get_deviceid();
					if( devId )
					{
						buildInfo += '    <div class="item"><span class="label">DeviceID</span><span class="value">'+ devId +'</span></div>';
					}
				}

				buildInfo += '<div style="clear: both"></div></div>';
			}

			let aboutFrame = ge( 'about_friendup' ).getElementsByTagName( 'iframe' )[ 0 ];
			if( aboutFrame.contentWindow.document.getElementById( 'fc-info' ) )
			{
				aboutFrame.contentWindow.document.getElementById( 'fc-info' ).innerHTML = buildInfo;
			}
			aboutFrame.setAttribute( 'scrolling', 'yes' );

		} );
	}
}

// Clear cache
function ClearCache()
{
	let m = new FriendLibrary( 'system.library' );
	m.execute( 'clearcache' );
	
	if( typeof friendApp != 'undefined' && typeof friendApp.clear_cache == 'function')
	{
		friendApp.clear_cache();
	}
}

// -----------------------------------------------------------------------------

// Shows eula

function ShowEula( accept, cbk )
{
	if( accept )
	{
		let m = new Module( 'system' );
		m.addVar( 'sessionid', Workspace.sessionId );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				let eles = document.getElementsByTagName( 'div' );
				for( let a = 0; a < eles.length; a++ )
				{
					if( eles[a].className == 'Eula' )
						eles[a].parentNode.removeChild( eles[a] );
				}
				setTimeout( function()
				{
					Workspace.refreshDesktop( false, true );
				}, 500 );
			}
		}
		m.execute( 'setsetting', {
			setting: 'accepteula',
			data:    'true'
		} );

		//call device refresh to make sure user get his devices...
		let dl = new FriendLibrary( 'system.library' );
		dl.addVar( 'visible', true );
		//dl.forceSend = true;
		dl.onExecuted = function( e, d )
		{
			//console.log( 'First login. Device list refreshed.', e, d );
		};
		dl.execute( 'device/refreshlist' );
		return;
	}


	let d = document.createElement( 'div' );
	d.className = 'Eula';
	d.id = 'EulaDialog';
	document.body.appendChild( d );

	// Using a configurable eula document
	if( Workspace.euladocument )
	{
		let n = new Module( 'system' );
		n.onExecuted = function( e, data )
		{
			if( e == 'ok' )
			{
				d.innerHTML = '<div class="EulaText SmoothScrolling"><div>' + data + '</div></div>\
				<div class="EulaInfo">\
		<div>\
			<button type="button" class="Button IconSmall fa-cross" onclick="document.location.href=\'http://duckduckgo.com\';">\
				I decline\
			</button>\
			\
			<button type="button" class="Button IconSmall fa-accept" onclick="ShowEula(true)">\
				I accept\
			</button>\
		</div>\
	</div>';
				// Tell app we can show ourselves!
				doReveal();
			}
		}
		n.execute( 'geteuladocument' );
	}
	// Using the Friend OS standard eula
	else
	{
		let f = new File( 'System:templates/eula.html' );
		f.onLoad = function( data )
		{
			d.innerHTML = data;
			
			// To mobile
			doReveal();
		}
		f.load();
	}
}



// SAS ID
function handleSASRequest( e )
{
	let title = 'Shared app invite from ' + e.owner;
	Confirm( title, e.message, confirmBack );

	function confirmBack( res )
	{
		if ( res )
			accept( e );
		else deny( e.sasid );
	}

	function accept( data )
	{
		ExecuteApplication( e.appname, JSON.stringify( e ) );
	}

	function deny( sasid )
	{
		let dec = {
			path : 'system.library/sas/decline/',
			data : {
				sasid : sasid,
			},
		};
		Workspace.conn.request( dec, unBack );
		function unBack( res )
		{
			console.log( 'Workspace.handleSASRequest - req denied, decline, result', res );
		}
	}
}

function handleServerMessage( e )
{
	function base64ToBytes( base64 )
    {
        const binString = atob( base64 );
        return Uint8Array.from( binString, ( m ) => m.codePointAt( 0 ) );
    }
	if( e.message && e.appname )
	{
		// Ignore my own messages
		if( e.message.senderId == Workspace.uniqueId )
			return;
		
		let found = false;
		
		let apps = ge( 'Tasks' ).getElementsByTagName( 'iframe' );
		for( let a = 0; a < apps.length; a++ )
		{
			// TODO: Have per application permissions here..
			// Not all applications should be able to send messages to
			// all other applications...
			if( apps[a].applicationName == e.appname || apps[a].applicationDisplayName == e.appname )
			{
				let nmsg = {
					command: 'notify',
					applicationId: apps[a].applicationId,
					authId: e.message.authId,
					method: 'servermessage',
					message: e.message
				};			
				apps[a].contentWindow.postMessage( nmsg, '*' );
				found = apps[a];
			}
		}
		
		if( !found || Workspace.currentViewState == 'inactive' )
		{
			// Check if we have a generic message
			// Check that we have message
		    if( e.message && e.message.message )
		    {
				// TODO: Support public key decryption
				let text = decodeURIComponent( e.message.message );
		        try
		        {
		            let dec = new TextDecoder().decode( base64ToBytes( text ) );
		            text = dec;
		        }
		        catch( e2 ){};
		        if( text != undefined )
		        {
		        	// Check for preferred sound
		        	if( e.sound && Sounds[ e.sound ] )
		        	{
		        		Sounds[ e.sound ].play();
		        	}
		        	// Default sound
					else Sounds.newMessage.play();
					
					text = text.split( /\<.*?\>/ ).join( '' );
					
					let sender = e.message.sender ? e.message.sender : false;
					if( !sender && e.message.fullname )
						sender = e.message.fullname;
					
					if( sender )
					{
						Notify( {
								title: 'From ' + sender,
								text: i18n( text ),
							},
							null,
							function( k )
							{
								e.message.source = 'notification';
								ExecuteApplication( e.appname, JSON.stringify( e.message ) );
							}
						);
					}
					else
					{
						console.log( 'wtf: ', e );
					}
				}
			}
		}
	}
	else
	{
		let msg = {
			title : 'Unhandled server message',
			text : 'The server could not interpret incoming message.'
		};
		Notify( msg );
	}
}

/*
	handle notification that comes from another user via websocket
*/
function handleServerNotice( e )
{
	//check if the message is parsable JSON... if it is, we might have received a msg for an app
	let tmp = false;
	try{
		tmp = JSON.parse( e.message );
		if( tmp && tmp.msgtype )
		{
			handleNotificationMessage( tmp )
			return;
		}
	}
	catch(e)
	{
		//nothing to show here... continue walking
	}
	
	
	let msg = {
		title : 'Server notice - from: ' + e.username,
		text : e.message,
	};
	Notify( msg, notieBack, clickCallback );

	function notieBack( e )
	{
		console.log( 'handleServerNotice - Notify callback', e );
	}

	function clickCallback( e )
	{
		console.log( 'handleServerNotice - Click callback', e );
	}
}

function handleNotificationMessage( msg )
{
	if( !msg || !msg.msgtype ) return;
	switch( msg.msgtype )
	{
		case 'applicationmessage':
			let w=false;
			for( let a in movableWindows )
			{
				w = movableWindows[a].windowObject;
				if( w && w.viewId && w.viewId == msg.targetapp )
				{
					w.sendMessage({'command': msg.applicationcommand});
				}

			}
			break;
	}
}

if( window.WorkspaceInside )
{
	for( let a in WorkspaceInside )
		Workspace[a] = WorkspaceInside[a];
	delete WorkspaceInside;
}
checkForFriendApp();
InitDynamicClassSystem();

document.addEventListener( 'paste', function( evt )
{
	Workspace.handlePasteEvent( evt );
} );

// Push notification integration and other app events --------------------------
if( window.friendApp )
{
	// Receive a click from an app bubble (notification on app side)
	Workspace.receiveAppBubbleClick = function( cid )
	{
		// Run the click callback
		let func = getWrapperCallback( cid );
		if( func )
		{
			func();
		}
	}
}

// Friendchat / presence live events handler
Workspace.receiveLive = function( viewId, jsonEvent ) {
	const self = this;
	let event = null;
	
	try 
	{
		event = JSON.parse( jsonEvent );
	}
	catch( ex )
	{
		console.log( 'Workspace.receiveLive - error parsing json', {
			error     : ex,
			jsonEvent : jsonEvent,
		} );
		return;
	}
	
	console.log( 'receiveLive', {
		viewId : viewId,
		json   : jsonEvent,
		event  : event,
	} );
	
	const appName = 'FriendChat';
	
	// find friendchat app
	let chat = null;
	
	console.log( 'all apps', Workspace.applications );
	
	Workspace.applications.some( app => {
		console.log( 'looking for chat', {
			app  : app,
			name : app.applicationName,
		} );
		if ( app.applicationName != appName )
			return false;
		
		chat = app;
		return true;
	} );
	
	if( !chat )
	{
		console.log( 'receiveLive - chat not found' );
		return;
	}
	
	// send event
	const msg = {
		type   : 'native-view',
		viewId : viewId,
		data   : event,
	};
	chat.contentWindow.postMessage( msg, '*' );
}

Workspace.pushTrashcan = {};

// Receive push notification (when a user clicks native push notification on phone)
Workspace.receivePush = function( jsonMsg, ready )
{
	console.log( 'Workspace.receivePush (' + ( new Date() ).getTime() + '):', jsonMsg );
	if( !isMobile ) return 'mobile';
	let msg = jsonMsg ? jsonMsg : ( window.friendApp && typeof friendApp.get_notification == 'function' ? friendApp.get_notification() : false );

	console.log( 'Checking message: ', msg );

	// we use 1 as special case for no push being here... to make it easier to know when to launch startup sequence... maybe not ideal, but works
	if( msg == false || msg == 1 ) 
	{
		if( !ready && this.onReady ) this.onReady();
		return 'nomsg';
	}
	try
	{
		//mobileDebug( 'Push notify... (state ' + Workspace.currentViewState + ')' );
		msg = JSON.parse( msg );
	}
	catch( e )
	{
		// Do nothing for now...
	}
	if( !msg ) 
	{
		if( !ready && this.onReady ) this.onReady();
		return 'nomsg';
	}
	
	// Disregard already handled notifications.
	if( msg.notifid )
	{
		if( this.pushTrashcan[ msg.notifid ] )
		{
			//console.log( 'Already processed notifid ' + msg.notifid );
			return;
		}
		this.pushTrashcan[ msg.notifid ] = true;
	}
		
	// Clear the notifications now... (race cond?)
	if( window.friendApp )
		friendApp.clear_notifications();
	
	let messageRead = trash = false;
	
	// Display message
	if( !msg.clicked && ( msg.title||msg.text ) )
	{
		// Revert to push notifications on the OS side
		Notify( { title: msg.title, text: msg.text }, null, handleClick );
		if( !ready && this.onReady ) this.onReady();
		return 'ok';
	}
	// "Click"
	else
	{
		handleClick();
	}
	
	function handleClick()
	{
		//console.log( 'handleClick ??' );
		if( !msg.application || msg.application == 'null' ) 
		{
			if( !ready && Workspace.onReady ) Workspace.onReady();
			return 'noapp';
		}
	
		//check if extras are base 64 encoded... and translate them to the extra attribute which shall be JSON
		if( msg.extrasencoded && msg.extrasencoded.toLowerCase() == 'yes' )
		{
			try
			{
				if( msg.extras ) msg.extra = JSON.parse( atob( msg.extras ).split(String.fromCharCode(92)).join("") );
			}
			catch( e )
			{}
		}
	
		// Check existing applications
		for( let a = 0; a < Workspace.applications.length; a++ )
		{
			if( Workspace.applications[ a ].applicationName == msg.application )
			{
				// Need a "message id" to be able to update notification
				// on the Friend Core side
				if( msg.notifid )
				{
					if( Workspace.currentViewState == 'active' && !Workspace.sleeping )
					{
						//console.log( '[receivePush] We are updating push notification with Friend Core with ' + msg.notifid + ' it was seen...' );
						// Function to set the notification as read...
						let l = new Library( 'system.library' );
						l.onExecuted = function(){};
						l.execute( 'mobile/updatenotification', { 
							notifid: msg.notifid, 
							action: 1,
							pawel: 1
						} );
					}
					else
					{
						console.log( '[receivePush] We are azleep! Server may push us again with this ' + msg.notifid );
					}
				}
				else
				{
					//console.log( 'No message id...', msg );
				}
			
				mobileDebug( ' Sendtoapp2: ' + JSON.stringify( msg ), true );
				let app = Workspace.applications[a];
				console.log( 'push to app', [ msg, app ]);
				app.contentWindow.postMessage( JSON.stringify( { 
					type: 'system',
					method: 'pushnotification',
					callback: false,
					data: msg
				} ), '*' );
				
				if( !ready && Workspace.onReady ) Workspace.onReady();
				
				return 'ok';
			}
		}
		
		// Function to set the notification as read...
		function notificationRead()
		{
			if( Workspace.currentViewState == 'active' && !Workspace.sleeping )
			{
				messageRead = true;
				let l = new Library( 'system.library' );
				l.onExecuted = function(){};
				l.execute( 'mobile/updatenotification', { 
					notifid: msg.notifid, 
					action: 1,
					pawel: 2
				} );
			}
		}
	
		// Application not found? Start it!
		// Send message to app once it has started...
		function appMessage()
		{
			let app = false;
			let apps = Workspace.applications;
			
			//too early?
			if( !apps ) return;
			
			for( let a = 0; a < apps.length; a++ )
			{
				// Found the application
				if( apps[ a ].applicationName == msg.application )
				{
					app = apps[ a ];
					break;
				}
			}
			
			// No application? Alert the user
			// TODO: Localize response!
			if( !app )
			{
				// No notification here... we got weird message in our new android app but everything worked...
				if( Workspace.onReady ) Workspace.onReady();
				return;
			}
		
			if( !app.contentWindow ) 
			{
				Notify( { title: i18n( 'i18n_could_not_find_application' ), text: i18n( 'i18n_could_not_find_app_desc' ) } );
				if( Workspace.onReady ) Workspace.onReady();
				return;
			}
		
			let amsg = {
				type: 'system',
				method: 'pushnotification',
				callback: addWrapperCallback( notificationRead ),
				data: msg
			};
		
			console.log( ' Sendtoapp: ' + JSON.stringify( amsg ) );
		
			app.contentWindow.postMessage( JSON.stringify( amsg ), '*' );
		
			// Delete wrapper callback if it isn't executed within 1 second
			setTimeout( function()
			{
				if( !messageRead )
				{
					getWrapperCallback( amsg.callback );
				}
			}, 1000 );
			
			if( !ready && Workspace.onReady ) Workspace.onReady();
		}
	
		mobileDebug( 'Start app ' + msg.application + ' and ' + _executionQueue[ msg.application ], true );
		if( Friend.startupApps[ msg.application ] )
		{
			console.log( 'The app ' + msg.application + ' is already running. Killing it.' );
			for( let b in Workspace.applications )
			{
				if( Workspace.application[ b ].applicationName == msg.application )
				{
					console.log( 'Killed ' + msg.application );
					Workspace.killByTaskId( b );
				}
			}
		}
		Friend.startupApps[ msg.application ] = true;
		ExecuteApplication( msg.application, '', appMessage );
	}

	return 'ok';
}

// TODO: Remove me after test
document.addEventListener( 'visibilitychange' , function( e )
{
	if( document.hidden ) Workspace.updateViewState( 'inactive' );
	else Workspace.updateViewState( 'active' );
}, false );
window.addEventListener( 'blur', function( e )
{
	if( currentMovable && currentMovable.getElementsByTagName( 'iframe' ).length > 0 )
	{
		if( document.hasFocus() )
		{
			if( document.hidden )
				Workspace.updateViewState( 'inactive' );
			return;
		}
	}
	Workspace.updateViewState( 'inactive' );
} );
document.addEventListener( 'focus', function( e )
{
	if( !( document.hidden || !document.hasFocus() ) )
		Workspace.updateViewState( 'active' );
} );
setInterval( function()
{
	if( document.hidden )
		Workspace.updateViewState( 'inactive' );
}, 500 );

// Make sure to register if the document is active
if( document.hidden )
	Workspace.updateViewState( 'inactive' );
else Workspace.updateViewState( 'active' );

/*  Debug blob: */
/*if( isMobile  )
{
	let debug = document.createElement( 'div' );
	debug.style.backgroundColor = 'rgba(255,255,255,0.5)';
	debug.style.bottom = '0px';
	debug.style.width = '100%';
	debug.style.height = '120px';
	debug.style.left = '0px';
	debug.style.color = 'black';
	debug.style.position = 'absolute';
	debug.style.zIndex = 10000000;
	debug.style.pointerEvents = 'none';
	debug.innerHTML = '<span>thomasdebug v01</span>';
	window.debugDiv = debug;
	document.body.appendChild( debug );
}*/

var mobileDebugTime = null;
function mobileDebug( str, clear )
{
	//console.log( 'mobileDebug', str );
	if( !isMobile ) return;
	if( !window.debugDiv ) return;
	if( mobileDebugTime ) clearTimeout( mobileDebugTime );
	if( clear )
	{
		window.debugDiv.innerHTML = '';
	}
	//console.log( '[mobileDebug] ' + str );
	window.debugDiv.innerHTML += str + '<br>';
	mobileDebugTime = setTimeout( function()
	{
		window.debugDiv.innerHTML = '';
		mobileDebugTime = null;
	}, 15000 );
}

// Cache the app themes --------------------------------------------------------
// TODO: Test loading different themes

_applicationBasics = {};
var _applicationBasicsLoading = false;
var _previousBasicsTheme = false;
function loadApplicationBasics( callback )
{
	if( _applicationBasicsLoading ) 
	{
		clearTimeout( _applicationBasicsLoading );
	}
	_applicationBasicsLoading = setTimeout( function()
	{
		_applicationBasicsLoading = false;
		
		let themeName = Workspace.theme ? Workspace.theme : 'friendup13';
		
		// Don't do in login
		if( Workspace.loginPrompt )
		{
			if( callback ) callback();
			return;
		}
		
		// Do not reload the same stuff
		if( _previousBasicsTheme == themeName )
		{
			if( callback ) callback();
			return;
		}
		
		_previousBasicsTheme = themeName;
		
		let loadSteps = 0;
		
		// Preload basic scripts
		let a_ = new File( '/webclient/js/apps/api.js' );
		a_.onLoad = function( data )
		{
			_applicationBasics.apiV1 = URL.createObjectURL( new Blob( [ data ], { type: 'text/javascript' } ) );
			loadSteps++;
		}
		a_.load();
		
		// Remove this when starting loading!
		_applicationBasics.css = '';
		
		// Preload scrollbars
		let sb_ = new File( '/themes/friendup13/scrollbars.css' );
		sb_.onLoad = function( data )
		{
			if( _applicationBasics.css )
				_applicationBasics.css += data;
			else _applicationBasics.css = data;
			loadSteps++;
		}
		sb_.load();
		
		// Preload theme CSS
		// Legacy friendup12 uses old css system server side
		let c_ = new File( themeName == 'friendup12' ? ( '/system.library/module/?module=system&command=theme&args=%7B%22theme%22%3A%22' + themeName + '%22%7D&sessionid=' + Workspace.sessionId ) : '/themes/friendup13/theme.css' );
		c_.onLoad = function( data )
		{
			// Convert @import to separate urls to load, because
			// engine has trouble reading it
			let tmp = data;
			let imports;
			let impOut = [];
			while( imports = tmp.match( /\@import\ url\((.*?)\)[;]{0,1}/i ) )
			{
				if( imports.length > 0 )
				{
					tmp = tmp.split( imports[ 0 ] ).join ( '' );
					// Add import to the top!
					impOut.push( imports[0] );
				}
			}
			
			// Add without imports
			if( tmp.length != data.length ) 
				data = tmp;
		
			if( _applicationBasics.css )
				_applicationBasics.css += data;
			else _applicationBasics.css = data;
			
			if( impOut.length )
			{
				_applicationBasics.css = impOut.join( "\n" ) + "\n" + _applicationBasics.css;
			}
			loadSteps++;
		}
		c_.load();
		
		let js = '/webclient/' + [ 'js/oo.js',
		'js/api/friendappapi.js',
		'js/utils/engine.js',
		'js/utils/tool.js',
		'js/utils/json.js',
		'js/io/cajax.js',
		'js/io/appConnection.js',
		'js/io/coreSocket.js',
		'js/gui/treeview.js',
		'js/fui/fui_v1.js',
		'js/fui/classes/baseclasses.fui.js',
		'js/fui/classes/group.fui.js',
		'js/fui/classes/listview.fui.js' ].join( ';/webclient/' );
		let j_ = new File( js );
		j_.onLoad = function( data )
		{
			_applicationBasics.js = data;
			loadSteps++;
		}
		j_.load();
		
		let waitCount = 0;
		let intr = setInterval( function()
		{
			if( loadSteps == 4 )
			{
				//console.log( '------------- Basics loaded! ------------' );
				clearInterval( intr );
				if( callback )
				{
					callback();
				}
			}
			else
			{
				//console.log( 'Waiting (' + ( waitCount++ ) + ')...' );
			}
		}, 25 );
	}, 2 );
};


(() =>
{
	if( isIos() || isIpad() )
	{
		window.setTimeout(() =>
		{
			if ( null != window.visualViewport )
			{
				const vv = window.visualViewport
				let timeout = null
				let maxHeight = 0
				updateMaxHeight()
				
				if ( null != screen?.orientation )
				{
					screen.orientation.addEventListener( 'change', e => {
						//
					}, false )
				}
				
				if ( window.addEventListener )
				{
					window.addEventListener( 'orientationchange', e => 
					{
						//
					}, false )
				}
				
				window.visualViewport.addEventListener( 'resize', e => 
				{
					if ( null != timeout )
						return
					
					timeout = window.setTimeout(() =>
					{
						updateMaxHeight()
						timeout = null
						const offset = maxHeight - vv.height
						if ( 20 > offset )
							translate( 0 )
						else
							translate( offset )
						
					}, 100 )
					
				}, false )
				
				window.visualViewport.addEventListener( 'scroll', e => 
				{
					//
				}, false )
				
				function updateMaxHeight()
				{
					maxHeight = window.innerHeight
					return
					
					const iH = window.innerHeight
					const iW = window.innerWidth
					const mode = getOrientation()
					if ( 'portrait' == mode )
					{
						maxHeight = iH
					}
					else
					{
						maxHeight = iW
					}
					
					function getOrientation()
					{
						if ( null != window.orientation )
						{
							const wo = window.orientation
							if ( 0 == wo || 180 == wo )
								return 'portrait'
							else
								return 'landscape'
						}
						
						if ( null != window.screen?.orientation )
						{
							const so = screen.orientation.type
							console.log( '>>>TODO<<< so', so )
							return 'portrait'
						}
						
						return 'portrait'
					}
				}
			}
			else
			{
				return false
			}
		}, 1000 )
	}
	
	function translate( num )
	{
		let trans = [
			'transform : ',
			'translate( 0px, -',
			num,
			'px)',
		]
		
		if ( isIos())
			trans.push( ' scale(1.3) !important' )
		
		trans = trans.join( '')

		//document.body.classList.toggle( 'Inside', false )
		//document.body.style[ 'WebkitTransform' ] = trans
		document.body.setAttribute( 'style', trans )
	}
	
	function isIos() {
		return [
			//'iPad Simulator',
			'iPhone Simulator',
			'iPod Simulator',
			//'iPad',
			'iPhone',
			'iPod'
		].includes(navigator.platform)
		// iPad on iOS 13 detection
		//|| (navigator.userAgent.includes("Mac") && "ontouchend" in document)
	}
	
	function isIpad() {
		return [
			'iPad Simulator',
			//'iPhone Simulator',
			//'iPod Simulator',
			'iPad',
			//'iPhone',
			//'iPod'
		].includes(navigator.platform)
		// iPad on iOS 13 detection
		|| (navigator.userAgent.includes("Mac") && "ontouchend" in document)
	}
	
})();
