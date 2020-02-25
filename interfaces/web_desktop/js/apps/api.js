/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// We need our namespace..
Friend = window.Friend || {};
Friend.iconsSelectedCount = 0;
Friend.currentMenuItems = 0;
Friend.scope = 'API';

Friend.lib = Friend.lib || {};
Friend.GUI = Friend.GUI || {};

// Get some quick args from url
Friend.fastUrlArgs = document.location.href.split( '?' );
if( Friend.fastUrlArgs.length > 1 )
{
	Friend.fastUrlArgs = Friend.fastUrlArgs[1].split( '&' );
	for( var a = 0; a < Friend.fastUrlArgs.length; a++ )
	{
		var pair = Friend.fastUrlArgs[a].split( '=' );
		if( pair[0] == 'noevents' )
			Friend.noevents = true;
	}
}

// Window isn't loaded
window.frameInitialized = false;
window.loaded = false;
window.applicationStarted = false;
var __timeout = 200;

if ( this.apijsHasExecuted )
	throw new Error( 'api.js has already run, aborting' );

this.apijsHasExecuted = true;

// Some global variables
var globalConfig = {};
globalConfig.language = 'en-US'; // Defaults to US english
Friend.globalConfig = globalConfig;

// Fix scope if this file is not on a specific addy

// Create application object with standard functions ---------------------------

Friend.application = {
	doneLoading: function()
	{
		document.body.classList.remove( 'Loading' );
		document.body.classList.add( 'activated' );
		setTimeout( function()
		{
			document.body.style.opacity = '';
		}, 100 );
		Application.sendMessage( {
			type: 'view',
			method: 'doneloadingbody'
		} );
	}
};

var Application =
{
	activated: false,
	sessionObject: {},
	callbacks: [],
	permanentCallbacks: [],
	windows: {},
	widgets: [],
	language: false,
	messageQueue: [],
	keyData:
	{
		get: function( callback, systemWide )
		{
			Application.sendMessage( {
				type: 'system', 
				command: 'getapplicationkey', 
				callback: addCallback( callback ), 
				userId: Application.userId, 
				appPath: Application.appPath, 
				applicationId: Application.applicationId, 
				authId: Application.authId, 
				systemWide: ( systemWide ? '*' : false ) 
			} );
		},
		save: function( name, data, encrypt, callback, systemWide )
		{
			Application.sendMessage( {
				type: 'system', 
				command: 'setapplicationkey', 
				callback: ( callback ? addCallback( callback ) : false ), 
				userId: Application.userId, 
				appPath: Application.appPath, 
				applicationId: Application.applicationId, 
				authId: Application.authId, 
				systemWide: ( systemWide ? '*' : false ), 
				args: {
					name: name,
					data: data,
					encrypt: encrypt
				}
			} );
		}
	},
	// Initialize Friend VR
	initFriendVR: function( callback )
	{
		if( this.friendVR ) return false;
		var js = document.createElement( 'script' );
		js.src = '/webclient/js/apps/friendvr.js';
		js.onload = function()
		{
			if( callback ) callback( new Friend.VR() );
		}
		document.body.appendChild( js );
		return true;
	},
	// Get an element retrieved by View.getWindowElement()
	getWindowElementById: function( id )
	{
		if( !this.windowElements ) return false;
		return this.windowElements[ id ];
	},
	encryption:
	{
		generateKeys: function( args, algo, callback )
		{
			if( !algo ) algo = 'rsa1024';
			
			var msg = {
				type: 'encryption', 
				algo: algo, 
				command: 'generatekeys', 
				callback: addCallback( callback ), 
				args: args
			};
			
			switch( algo )
			{
				case 'md5':
					Application.sendMessage( msg );
					break;
				
				case 'sha256':
					Application.sendMessage( msg );
					break;
				
				case 'rsa1024':
					Application.sendMessage( msg );
					break;
					
				default:
					return false;
					break;
			}
		},
		encrypt: function( args, callback )
		{
			Application.sendMessage( { 
				type: 'encryption', 
				command: 'encrypt', 
				callback: addCallback( callback ), 
				args: args
			} );
		},
		decrypt: function( args, callback )
		{
			Application.sendMessage( { 
				type: 'encryption', 
				command: 'decrypt', 
				callback: addCallback( callback ), 
				args: args
			} );
		},
		publickey: function( callback, args )
		{
			Application.sendMessage( { 
				type: 'encryption', 
				command: 'publickey', 
				callback: addCallback( callback ), 
				args: ( args ? args : { 
					encoded: false 
				} ) 
			} );
		}
	},
	// Load locale translations
	loadTranslations: function( path, callback )
	{
		if( this.language == false ) this.language = Friend.globalConfig.language.split( '-' )[0];
		var f = new File( path + this.language + '.lang' );
		f.onLoad = function( data )
		{
			// no locale file for this language found?
			if( data && data.indexOf('<h1>404') > 0 && this.language != 'en' )
			{
				this.language = 'en';
				this.loadTranslations( path, callback );
				return;
			}

			if( !window.translations ) window.translations = [];
			var expl = data.split( "\n" );
			for( var a = 0; a < expl.length; a++ )
			{
				if( expl[a].substr( 0, 1 ) == '#' ) continue;
				var words = expl[a].split( ':' );
				if( Trim( words[0] ).length )
				{
					window.translations[Trim(words[0])] = Trim(words[1]);
				}
			}
			if( callback ) callback();
		}
		f.load();
	},
	// Only allow one instance
	setSingleInstance: function( val )
	{
		// Add to singleInstanceApps
		this.sendMessage( {
			type: 'system',
			command: 'setsingleinstance',
			value: val
		} );
	},
	setApplicationName: function( str )
	{
		this.applicationName = str;
		this.sendMessage( {
			type: 'system',
			command: 'applicationname',
			applicationname: str
		} );
	},
	receiveMessage: function( packet )
	{
		if( packet.checkDefaultMethod ) return 'yes';
		
		if( !packet.type ) return;
		switch( packet.type )
		{
			case 'callback':
				if( packet.viewId && Application.windows && Application.windows[packet.viewId] )
				{
					if( packet.command == 'viewresponse' )
					{
						Application.windows[packet.viewId].ready = packet.data == 'ok' ? true : false;
					}
					else
					{
						Application.windows[packet.viewId].sendMessage( packet );
					}
				}
				else if( this.view && this.view.sendMessage )
				{
					this.view.sendMessage( packet );
				}
				// Handle screens
				else if( packet.screenId && Application.screens && Application.screens[packet.screenId] )
				{
					if( packet.command == 'screenresponse' )
					{
						Application.windows[packet.screenId].ready = packet.data == 'ok' ? true : false;
					}
					else
					{
						Application.screens[packet.screenId].sendMessage( packet );
					}
				}
				// Handle widgets
				else if( packet.widgetId && Application.widgets && Application.widgets[packet.widgetId] )
				{
					if( packet.command == 'widgetresponse' )
					{
						Application.widgets[packet.widgetId].ready = packet.data == 'ok' ? true : false;
					}
					else
					{
						Application.widgets[packet.widgetId].sendMessage( packet );
					}
				}
				else if( this.screen && this.screen.sendMessage )
				{
					this.screen.sendMessage( packet );
				}
				// BEWARE! DRAGONS!
				// This is probably the final destination (probably won't happen)
				else
				{
					var f = extractCallback( packet.callback );
					if( f )
					{
						f( packet.data ? packet.data : false );
					}
					// Should never happen
					else
					{
						console.log( 'Untrappable callback lost in space' );
					}
				}
				break;
			// Recall for later
			default:
				this.messageQueue.push( packet );
				break;
		}
	},
	// Get the session state of an application in JSON string
	// Must be set to be deemed a Liquid App!
	sessionStateGet: function()
	{
		return false;
	},
	// Set the session state on an object
	sessionStateSet: function( sessionObject )
	{
		if( sessionObject.charAt && sessionObject.charAt(0) ) sessionObject = JSON.parse( sessionObject );
		if( !this.sessionObject ) this.sessionObject = {};
		for( var a in sessionObject )
		{
			this.sessionObject[a] = sessionObject[a];
		}
	},
	fullscreen: function( ele, e )
	{
		// Fullscreen enabled?
		if(
		  !document.fullscreenEnabled &&
		  !document.webkitFullscreenEnabled &&
		  !document.mozFullScreenEnabled &&
		  !document.msFullscreenEnabled
		)
		{
			return false;
		}

		var el = ele ? ele : ( document.documentElement ? document.documentElement : document.body );
		var toggle = el.fullscreenEnabled;
		if( !toggle )
		{
			if( el.requestFullscreen )
				el.requestFullscreen();
			else if( el.webkitRequestFullScreen )
				el.webkitRequestFullScreen();
			else if( el.webkitRequestFullscreen )
				el.webkitRequestFullscreen();
			else if( el.mozRequestFullscreen )
				el.mozRequestFullScreen();
			else if( el.msRequestFullscreen )
				el.msRequestFullscreen();
			el.fullscreenEnabled = true;
		}
		else
		{
			if( document.exitFullScreen )
				document.exitFullScreen();
			else if( document.webkitCancelFullscreen )
				document.webkitCancelFullscreen();
			else if( document.webkitCancelFullScreen )
				document.webkitCancelFullScreen();
			else if( document.mozCancelFullScreen )
				document.mozCancelFullScreen();
			else if( document.mozCancelFullScreen )
				document.mozCancelFullScreen();
			el.fullscreenEnabled = false;
		}
	},
	// Application messaging ---------------------------------------------------
	sendApplicationMessage: function( appFilter, msg, cbk )
	{
		var msg = {
			type: 'applicationmessaging',
			method: 'sendtoapp',
			filter: appFilter,
			message: msg
		};
		if( cbk )
		{
			msg.callback = addCallback( cbk );
		}
		Application.sendMessage( msg );
	},
	getApplicationsByName: function( appName, cbk )
	{
		var msg = {
			type: 'applicationmessaging',
			method: 'getapplications',
			application: appName
		};
		if( cbk )
		{
			msg.callback = addCallback( cbk );
		}
		Application.sendMessage( msg );
	},
	// Opens
	openMessagePort: function( cbk )
	{
		var msg = {
			type: 'applicationmessaging',
			method: 'open'
		};
		if( cbk )
		{
			msg.callback = addCallback( cbk );
		}
		Application.sendMessage( msg );
	},
	// Close the port!
	closeMessagePort: function( cbk )
	{
		var msg = {
			type: 'applicationmessaging',
			method: 'close'
		};
		if( cbk )
		{
			msg.callback = addCallback( cbk );
		}
		Application.sendMessage( msg );
	},
	// End application messaging -----------------------------------------------
	// Send quit up in hierarchy
	quit: function( skipSendMessage )
	{
		if( this.hasQuit )
			return;
		this.hasQuit = true;

		if( Application.onQuit )
		{
			Application.onQuit();
		}

		// Clear single instance
		this.setSingleInstance( false );

		// Close all dormant doors
		if( DormantMaster.doors )
		{
			for( var a in DormantMaster.doors )
				DormantMaster.delAppDoor( DormantMaster.doors[a] );
		}

		// Close all windows
		if( Application.windows )
		{
			for( var a in Application.windows )
			{
				Application.windows[a].close();
			}
		}

		// Close all widgets
		if( Application.widgets )
		{
			for (var a in Application.widgets )
			{
				Application.widgets[a].close();
			}
		}

		if( Application.screens )
		{
			for( var a in Application.screens )
			{
				Application.screens[a].close();
			}
		}

		// Try to save the session
		var s = this.sessionStateGet();
		if( s && s.length )
		{
			Application.sendMessage( {
				type:          'system',
				command:       'savestate',
				state:         s
			} );
		}

		// Flush dormant events
		if( Application.applicationId )
		{
			var n = Application.applicationId.split( '-' )[0]; // TODO: app must have applicationName
			DormantMaster.delApplicationEvents( n );
		}

		// Send the quit message
		if( !skipSendMessage )
		{
			Application.sendMessage( {
				type:          'system',
				command:       'quit',
				force:         'true'
			} );
		}
	}
}

/* Magic clipboard code ----------------------------------------------------- */
if( !Friend.clipboard )
{
	Friend.clipboard = '';
	Friend.prevClipboard = '';
	Friend.macCommand = false;
}


document.addEventListener( 'keydown', function( e )
{
	var wh = e.which ? e.which : e.keyCode;
	var t = e.target ? e.target : e.srcElement;

	if( wh == 91 )
	{
		Friend.macCommand = true;
	}

	if( e.ctrlKey || Friend.macCommand )
	{
		// CTRL V
		/*if( wh == 86 )
		{
			//fire paste event instead pf doing stuff herre...
			Friend.lastKeydownTarget = t;
			return true;
		}
		// CTRL C or X
		else if( wh == 67 || wh == 88 )
		{
			Friend.sysClipBoardUpdate = Date.now();
			Friend.clipboard = ( Friend.ClipboardGetSelectedIn( t ) != '' ? Friend.ClipboardGetSelectedIn( t ) : Friend.clipboard );
			Application.sendMessage( { type: 'system', command: 'setclipboard', value: Friend.clipboard } );
		}
		// Screen swap!
		else */
		if( wh == 77 )
		{
			Application.sendMessage( { type: 'system', command: 'switchscreens' } );
			return cancelBubble( e );
		}
	}
	return true;
} );

document.addEventListener( 'keyup', function( e )
{
	var wh = e.which ? e.which : e.keyCode;
	Friend.macCommand = false;
} );

/**
	paste handler. check Friend CB vs System CB.
*/
Friend.pasteClipboard = function( evt )
{
	var mimetype = '';
	var cpd = '';

	if( evt.clipboardData.types.indexOf('text/plain') > -1 )
	{
		mimetype = 'text/plain';
	}

	//we only do text handling here for now
	if( mimetype != '' )
	{
		cpd = evt.clipboardData.getData( mimetype );
		//console.log('compare... new ',cpd,' :: prev clippy',Friend.prevClipboard,':: now clippy',Friend.clipboard);
		if( Friend.prevClipboard != cpd )
		{
			Friend.prevClipboard = Friend.clipboard;
			Friend.clipboard = cpd;
		}
	}

	if( typeof Application != 'undefined' && typeof Application.handlePaste == 'function' )
	{
		//wait a bit for the clipboard to be updated...
		setTimeout( 'Application.handlePaste( Friend.clipboard );',250);
	}
	if( Application) Application.sendMessage( { type: 'system', command: 'setclipboard', value: Friend.clipboard } );
	if( Friend.lastKeydownTarget )
	{
		if( Friend.ClipboardPasteIn( Friend.lastKeydownTarget, Friend.clipboard ) )
		{
			return cancelBubble( evt );
		}
	}
	return true;
}

// Copy from select area to clipboard
Friend.ClipboardGetSelectedIn = function( ele )
{
    var text = '';
    if( window.getSelection )
    {
        text = window.getSelection().toString();
    }
    else if( document.selection && document.selection.type != 'Control' )
    {
        text = document.selection.createRange().text;
    }
    return text;
}

// Paste to target from clipboard
Friend.ClipboardPasteIn = function( ele, text )
{
	if( typeof ele.value != 'undefined' )
	{
		if( document.selection )
		{
			ele.focus();
			var sel = document.selection.createRange();
			sel.text = text;
			ele.focus();
		}
		else if( ele.selectionStart || ele.selectionStart === 0 )
		{
			var startPos = ele.selectionStart;
			var endPos = ele.selectionEnd;
			var scrollTop = ele.scrollTop;
			ele.value = ele.value.substring( 0, startPos ) +
				text + ele.value.substring( endPos, ele.value.length );
			ele.focus();
			ele.selectionStart = startPos + text.length;
			ele.selectionEnd = startPos + text.length;
			ele.scrollTop = scrollTop;
		}
		else
		{
			ele.value += text;
			ele.focus();
		}
		dispatchEvent( ele, 'change' );
		// Send paste key
		dispatchEvent( ele, 'input' );
		return true;
	}
	return false;
}

/* Done clipboard ----------------------------------------------------------- */

// Callbacks -------------------------------------------------------------------

// Generate a unique id in a select array buffer
Friend.generateUniqueId = function( arrayBuffer, postfix )
{
	if( !postfix ) postfix = '';
	var uid = false;
	do
	{
		uid = Friend.uniqueIdString();
	}
	while( typeof( arrayBuffer[uid + postfix ] ) != 'undefined' );
	return uid + postfix;
};

generateUniqueId = Friend.generateUniqueId;

Friend.uniqueIdString = function()
{
	return ( Math.random() * 9999 ) + '' +
		( ( Math.random() * 9999 ) + ( Math.random() * 9999 ) ) +
		'' + ( new Date() ).getTime();
};
uniqueIdString = Friend.uniqueIdString;

// Extract a callback element and return it
function extractCallback( id, keep )
{
	var f = false;

	var out = []; // Only use this if we're not keeping callback

	for( var a in Application.callbacks )
	{
		if( a == id )
		{
			f = Application.callbacks[a];
		}
		// unless we keep, add callback
		else if( keep != true ) out[a] = Application.callbacks[a];
	}

	// Remove the callback we asked for
	if( keep != true )
		Application.callbacks = out;

	for( var a in Application.permanentCallbacks )
	{
		if( a == id )
		{
			f = Application.permanentCallbacks[a];
			break;
		}
	}
	return f;
}

// Add callback ( will return false if something already exists )
function addCallback( cb, forceId )
{
	if( !cb ) return;
	if( forceId )
	{
		if( typeof( Application.callbacks[forceId] ) != 'undefined' )
			return false;
		Application.callbacks[forceId] = cb;
		return forceId;
	}
	else
	{
		var id = generateUniqueId( Application.callbacks );
		if( !id ) return false;
		Application.callbacks[id] = cb;
		return id;
	}
}

// Add a callback that will stay on the application
function addPermanentCallback( cb )
{
	if( !cb ) return false;
	var id = generateUniqueId( Application.permanentCallbacks, '_permanent' );
	if( !id ) return false;
	Application.permanentCallbacks[id] = cb;
	return id;
}

// Remove a permanent callback by force
function removePermanentCallback( cb )
{
	var out = [];
	for( var a in Application.permanentCallbacks )
	{
		if( a != cb ) out[a] = Application.permanentCallbacks[a];
	}
	Application.permanentCallbacks = out;
}

// Get the url variables passed to application ---------------------------------

function getUrlVar( vari )
{
	var url = document.location.href.split( '?' );
	if( url.length > 1 )
	{
		url = url[1];
		var vars = url.split( '&' );
		for( v = 0; v < vars.length; v++ )
		{
			var va = vars[v].split( '=' );
			if( va[0] == vari ) return va[1];
		}
	}
}

// Ok, are we ready
var __queuedEventInterval = false;
function queuedEventTimer()
{
	if( window.Application.applicationId && window.loaded && window.eventQueue.length )
	{
		var recvList = [];
		for( var a = 0; a < window.eventQueue.length; a++ )
		{
			recvList.push( window.eventQueue[a] );
		}
		window.eventQueue = [];

		// Check if we can run
		for( var a = 0; a < recvList.length; a++ )
		{
			receiveEvent( recvList[a] );
		}

		// Only clear if it's empty
		if( window.eventQueue.length <= 0 )
		{
			clearInterval( __queuedEventInterval );
			__queuedEventInterval = false;
		}
	}
	//console.log( 'Ran timer. Has ' + window.eventQueue.length + ' events left.' );
}

// Receive messages from parent environment ------------------------------------

function receiveEvent( event, queued )
{
	// TODO: Do security stuff...
	//
	if( !window.eventQueue )
		window.eventQueue = [];

	var dataPacket;
	
	// TODO: Stop overwriting origin (security)
	if( event.origin )
		event.origin = '*';
	
	if( 'string' === typeof( event.data ) )
	{
		try
		{
			dataPacket = JSON.parse( event.data );
		}
		catch( e )
		{
			// No data packet
			return;
		}
	}
	else
	{
		dataPacket = event.data;
	}

	if( !dataPacket.command )
	{
		Application.receiveMessage( dataPacket );
		done();
		return;
	}

	// If we have a response, the app has no custom receiveMessage()
	// This in many cases means that the Application object was not loaded
	var hasDefaultMethod = Application.receiveMessage( { checkDefaultMethod: 1 } ) == 'yes';

	// Queue events until ready
	if( dataPacket.command != 'register' &&
		dataPacket.command != 'initappframe' &&
		dataPacket.command != 'setbodycontent' &&
		(
			( !window.Application || !window.Application.applicationId ) ||
			!window.loaded
		)
	)
	{
		// Don't overkill!
		if( window.eventQueue.length > 100 )
		{
			if( __queuedEventInterval )
				clearInterval( __queuedEventInterval );
			return false;
		}
		window.eventQueue.push( event );
		if( !__queuedEventInterval )
			__queuedEventInterval = setInterval( queuedEventTimer, __timeout );
		return;
	}
	
	switch( dataPacket.command )
	{	
		// Update clipboard
		case 'updateclipboard':
			Friend.clipboard = dataPacket.value;
			break;

		case 'dos':
			return Dos.receiveMessage( dataPacket );

		case 'friendnetwork':
			return FriendNetwork.receiveMessage( dataPacket );

		// Update theme
		case 'refreshtheme':
			var themeName = dataPacket.theme;

			var h = document.getElementsByTagName( 'head' );
			if( h )
			{
				h = h[0];
				document.body.classList.add( 'Loading' );
				
				// New css!
				var styles = document.createElement( 'link' );
				styles.rel = 'stylesheet';
				styles.type = 'text/css';
				styles.onload = function()
				{
					document.body.classList.remove( 'Loading' );
					document.body.classList.add( 'Loaded' );
				}
				
				if( themeName && themeName != 'default' )
				{
					AddCSSByUrl( '/themes/' + themeName + '/scrollbars.css' );
					styles.href = '/system.library/module/?module=system&command=theme&args=' +
						encodeURIComponent( '{"theme":"' + themeName + '"}' ) + '&authid=' + Application.authId;
				}
				else
				{
					AddCSSByUrl( '/themes/friendup12/scrollbars.css' );
					styles.href = '/system.library/module/?module=system&command=theme&args=' +
						encodeURIComponent( '{"theme":"friendup12"}' ) + '&authid=' + Application.authId;
				}
				
				// Remove old one
				var l = h.getElementsByTagName( 'link' );
				for( var b = 0; b < l.length; b++ )
				{
					if( l[b].parentNode != h ) continue;
					l[b].href = '';
					l[b].parentNode.removeChild( l[b] );
				}
				// Remove scrollbars
				var l = document.body.getElementsByTagName( 'link' );
				for( var b = 0; b < l.length; b++ )
				{
					if( l[b].href.indexOf( '/scrollbars.css' ) > 0 )
					{
						l[b].href = '';
						l[b].parentNode.removeChild( l[b] );
					}
				}

				// Add new one
				h.appendChild( styles );
			}
			
			// Apply theme config if possible
			if( dataPacket.themeData )
			{
				Application.applyThemeConfig( dataPacket.themeData );
			}

			// Refresh subviews
			if( Application.windows )
			{
				for( var a in Application.windows )
				{
					var msg = {
						type: 'system',
						command: 'refreshtheme',
						theme: themeName,
						viewId: a,
						applicationId: Application.applicationId
					};
					if( dataPacket.themeData )
						msg.themeData = dataPacket.themeData;
					Application.windows[a].sendMessage( msg );
				}
			}
			
			// Trigger a resize event to clean up the tabs
			setTimeout( function()
			{
				if( Friend.resizeTabs )
				{
					for( var i = 0; i < Friend.resizeTabs.length; i++ )
					{
						Friend.resizeTabs[ i ].resize();
					}
				}
			}, 250 );
			break;
		// Blur all elements!
		case 'blur':
			var eles = document.getElementsByTagName( '*' );
			for( var a = 0; a < eles.length; a++ )
				eles[a].blur();
			break;
		// Executing an event that is coming in
		case 'dispatchevent':
			// For now, we test on window and body..
			// TODO: Be precise! Find the right element! (need to reg ids etc)
			//console.log( 'api.js - dispatchevent', dataPacket );
			var eles = [ window, document.body ];
			var ev = typeof( dataPacket.eventData ) == 'string' ? JSON.parse( dataPacket.eventData ) : dataPacket.eventData;
			
			for( var a = 0; a < eles.length; a++ )
			{
				if( eles[a].trappedEvents && eles[a].trappedEvents[ dataPacket.eventType ] )
				{
					// Execute found events!
					//console.log( 'We got it: ' + dataPacket.eventType );
					var tes = eles[a].trappedEvents[ dataPacket.eventType ];
					for( var b = 0; b < tes.length; b++ )
					{
						tes[b]( ev );
					}
				}
			}
			break;
		// Aha, we received an event from a sub view! Handle it
		case 'captureevent':
			// If we're the host, we need to execute the event on all app views
			for( var a in Friend.sasidRequests )
			{
				if( Friend.sasidRequests[a].applicationId == dataPacket.sasid )
				{
					var arq = Friend.sasidRequests[a];

					// If we don't use eventOwner flag or we're an invitee, execute input events!
					if( !arq.flags.eventOwner || ( arq.flags.eventOwner == 'owner' && arq.isHost ) )
					{
						arq.distributeSharedEvent( dataPacket.eventType, dataPacket.eventData );
					}
					// If we're invitee, send to owner, owner sends only if no eventOwner flag
					if( !arq.flags.eventOwner || ( arq.flags.eventOwner == 'owner' && !arq.isHost ) )
					{
						var owner = ( arq.isHost ? '' : 'owner' );
						// Send to others
						var msg = {
							path : 'system.library/app/send' + owner + '/',
							data : {
								sasid : dataPacket.sasid,
								msg: dataPacket.eventData
							}
						};
						Friend.conn.send( msg );
						//console.log( 'Sent to ' + ( owner ? owner : 'user' ) );
					}
				}
			}
			break;

		// Make sure all events gets handled by root Application object
		case 'rerouteeventstoroot':
			Friend.rerouteAssidEventsToRoot( dataPacket.sasid );
			break;

		// Handle incoming key events
		case 'handlekeys':
			if( Application.handleKeys )
			{
				var ev = { shiftKey: dataPacket.shiftKey, ctrlKey: dataPacket.ctrlKey, which: dataPacket.key };
				Application.handleKeys( dataPacket.key, ev );
			}
			break;
		case 'parseviewflag':
			if( dataPacket.flag == 'scrollable' )
			{
				if( dataPacket.value === true )
				{
					document.body.classList.add( 'Scrolling' );
				}
				else
				{
					document.body.classList.remove( 'Scrolling' );
				}
			}
			break;
		// On opening window
		case 'viewresponse':
			// Can't create window? Quit
			// TODO: More sane error handling
			if( dataPacket.data == 'fail' )
			{
				Application.quit();
			}
			
			// Get flags
			var view = Application.windows[ dataPacket.viewId ];
			if( view && view._flags )
			{
				var flags = view._flags;
			
				// We have frameworks
				if( flags.frameworks )
				{
					for( var a in flags.frameworks )
					{
						switch( a )
						{
							case 'tree':
								if( flags.frameworks.tree.javascript && flags.frameworks.tree.data )
								{
									var f = new File( 'System:sandboxed.html' );
									f.onLoad = function( data )
									{
										var javascript = flags.frameworks.tree.javascript;
										var treeProperties = flags.frameworks.tree.treeInitialisation;
										view.setContent( 
`<script src="/webclient/js/tree/tree.js"></script>
<script src="${javascript}"></script>
<div id="Application"></div>
<script type="text/javascript">
	Friend.Tree.loadJSON( "${flags.frameworks.tree.data}", '${treeProperties}' );
</script>` 
										);
									}
									f.load();
								}
								break;
							case 'fui':
								if( flags.frameworks.fui.javascript && flags.frameworks.fui.data )
								{
									var f = new File( 'System:sandboxed.html' );
									f.onLoad = function( data )
									{
										var javascript = flags.frameworks.fui.javascript;
										view.setContent( 
`<script src="/webclient/js/fui/fui.js"></script>
<script src="${javascript}"></script>
<script type="text/javascript">
	fui.loadJSON( "${flags.frameworks.fui.data}" );
</script>` 
										);
									}
									f.load();
								}
								break;
						}
					}
				}
			}
			break;
		case 'widgetresponse':
			// Can't create screen? Quit
			if( dataPacket.data == 'fail' )
			{
				Application.quit();
			}
			break;
		case 'screenresponse':
			// Can't create screen? Quit
			if( dataPacket.data == 'fail' )
			{
				Application.quit();
			}
			break;
		// TODO: Never gets here?
		case 'notify':
			if( dataPacket.method )
			{
				switch( dataPacket.method )
				{
					case 'setviewflag':
						if( dataPacket.viewId && Application.windows && Application.windows[dataPacket.viewId] )
						{
							var w = Application.windows[dataPacket.viewId];
							w._flags[dataPacket.flag] = dataPacket.value;
							if( dataPacket.flag == 'scrollable' )
							{
								if( dataPacket.value == true )
								{
									document.body.classList.add( 'Scrolling' );
								}
								else
								{
									document.body.classList.remove( 'Scrolling' );
								}
							}
						}
						break;
					case 'servermessage':
						if( Application.receiveMessage )
						{
							Application.receiveMessage( {
								command: 'servermessage',
								data: dataPacket.message
							} );
						}
						break;
					case 'closewindow':
					case 'closeview':
						// Close an exact window
						if( dataPacket.viewId && Application.windows && Application.windows[dataPacket.viewId] )
						{
							var w = Application.windows[dataPacket.viewId];
							if( w.onClose )
							{
								var onc = w.onClose;
								w.onClose = null;
								var res = onc( function( flag )
								{
									if( ( flag || !flag ) && flag !== false )
									{
										w.close();
									}
									// We aborted, reset onclose
									else
									{
										w.onClose = onc;
									}
								} );
								if( res === false )
								{
									w.onClose = onc;
									return;
								}
							}
							w.close();
						}
						// Ah, sub window! Channel to all sub windows then (unknown id?)
						else if( dataPacket.viewId )
						{
							// Try view windows
							for( var a in Application.windows )
							{
								var w = Application.windows[a];
								w.sendMessage( dataPacket );
							}
							// Try screens
							for( var a in Application.screens )
							{
								var w = Application.screens[a];
								w.sendMessage( dataPacket );
							}
						}
						// Close all windows
						// FIXME: Might not be what we want
						else if( Application.windows.length )
						{
							for( var a in Application.windows )
							{
								var w = Application.windows[a];
								w.close();
							}
						}
						// We have no registered window, notify with quit
						else
						{
							Application.sendMessage( {
								type:          'system',
								command:       'kill'
							} );
						}
						break;
					// Activate it
					case 'activateview':
						Application.activated = true;
						document.body.classList.add( 'activated' );
						Application.receiveMessage( { type: 'system', command: 'focusview' } );
						break;
					// Deactivate it
					case 'deactivateview':
						Application.activated = false;
						document.body.classList.remove( 'activated' );
						Application.receiveMessage( { type: 'system', command: 'blurview' } );
						break;
					default:
						break;
				}
			}
			break;
		case 'initappframe':
			// Don't reinit.. that's not smart, so break
			if( window.Application.applicationId ) break;
			initApplicationFrame( dataPacket, event.origin );
			break;
		// Is often called on an already opened image
		case 'setbodycontent':
			window.loaded = false;
			document.body.classList.add( 'Loading' );

			// We need to set these if possible
			Friend.dosDrivers         = dataPacket.dosDrivers;
			Application.authId        = dataPacket.authId;
			Application.filePath      = dataPacket.filePath;
			Application.applicationId = dataPacket.applicationId;
			Application.userId        = dataPacket.userId;
			Application.username      = dataPacket.username;

			// Register screen
			if( dataPacket.screenId ) Application.screenId = dataPacket.screenId;

			// Make sure the base href is correct.
			if( typeof( data ) != 'string' )
				data = '';
			var data = Friend.convertFriendPaths( dataPacket.data );

			// For jquery etc
			var m = '';
			while( m = data.match( /\$\(document[^{]*?\{([^}]*?)\}\)/i ) )
				data = data.split( m[0] ).join( '(' + m[1] + ')' );


			// Set content
			document.body.innerHTML = data;
			
			if( dataPacket.parentSandboxId )
			{
				try
				{
					var nw = parent.document.getElementById( dataPacket.parentSandboxId );
					if( parent != nw )
						parentView = nw.contentWindow;
				}
				catch( e )
				{
					// Security error..

				}
			}

			initApplicationFrame( dataPacket, event.origin, function()
			{
				// Just call back
				if( dataPacket.callback )
				{
					parent.postMessage( JSON.stringify( {
						type:          'callback',
						callback:      dataPacket.callback,
						applicationId: dataPacket.applicationId,
						theme:         dataPacket.theme,
						themeData:     dataPacket.themeData,
						locale:        dataPacket.locale,
						authId:        dataPacket.authId,
						sessionId:     dataPacket.sessionId,
						userId:        dataPacket.userId,
						username:      dataPacket.username
					} ), event.origin );
				}
			} );

			// If we already have it, run it
			if( window.delayedScriptLoading )
			{
				window.delayedScriptLoading();
				delete window.delayedScriptLoading;
			}

			break;
		case 'setcontentbyid':
			var el = document.getElementById( dataPacket.elementId );
			if( el ) el.innerHTML = dataPacket.data;

			// Just call back
			if( dataPacket.callback )
			{
				parent.postMessage( JSON.stringify( {
					type:          'callback',
					callback:      dataPacket.callback,
					applicationId: dataPacket.applicationId,
					theme:         dataPacket.theme,
					locale:        dataPacket.locale,
					authId:        dataPacket.authId,
					sessionId:     dataPacket.sessionId,
					userId:        dataPacket.userId,
					username:      dataPacket.username
				} ), event.origin );
			}
			if( el ) RunScripts( dataPacket.data );
			break;
		case 'getattributebyid':
			// Some days, receive the attribute value here.. and run callback
			break;
		// Set a property by id
		case 'setattributebyid':
			var el = document.getElementById( dataPacket.elementId );
			if( el )
			{
				el.setAttribute( dataPacket.attribute, dataPacket.data );
			}
			// Just call back
			if( dataPacket.callback )
			{
				parent.postMessage( JSON.stringify( {
					type:          'callback',
					callback:      dataPacket.callback,
					applicationId: dataPacket.applicationId,
					theme:         dataPacket.theme,
					locale:        dataPacket.locale,
					authId:        dataPacket.authId,
					sessionId:     dataPacket.sessionId,
					userId:        dataPacket.userId,
					username:      dataPacket.username
				} ), event.origin );
			}
			break;
		case 'register':
			window.origin = event.origin;
			// A function to send a message
			Friend.dosDrivers         = dataPacket.dosDrivers;
			Application.domain        = dataPacket.domain;
			Application.authId        = dataPacket.authId;
			Application.filePath      = dataPacket.filePath;
			Application.applicationId = dataPacket.applicationId;
			Application.userId        = dataPacket.userId;
			Application.username      = dataPacket.username;
			Application.workspaceMode = dataPacket.workspaceMode;
			Application.applicationName = dataPacket.applicationName;
			Application.sendMessage   = setupMessageFunction( dataPacket, window.origin );
			
			// Initialize app frame
			initApplicationFrame( dataPacket, event.origin );
			break;
		// Here comes the shell callback
		case 'shell':
			if( dataPacket.viewId && Application.windows && Application.windows[dataPacket.viewId] )
			{
				Application.windows[dataPacket.viewId].sendMessage( dataPacket );
			}
			else
			{
				// Shall we keep the callback so we can continue to pass info on it?
				var kcb = dataPacket.returnMessage;
				var keep = kcb ? ( kcb.keepCallback ? true : false ) : false;

				// Shell object
				if( dataPacket.shellId )
				{
					var f = extractCallback( dataPacket.shellId, keep );
					if( f && f.onBeforeReady ) f.onBeforeReady( dataPacket );
					if( f && f.onReady ) f.onReady( dataPacket );
				}
				// Normal callback by callback id
				else if( dataPacket.callbackId )
				{
					var f = extractCallback( dataPacket.callbackId, keep );
					if( f )
					{
						f( dataPacket );
					}
				}
				// Use the pipe if its there
				if( dataPacket.pipe )
				{
					var f = extractCallback( dataPacket.pipe );
					if( f )
					{
						f( dataPacket );
					}
				}
			}
			break;
		// A file loaded
		case 'fileload':
			if( dataPacket.viewId && Application.windows && Application.windows[dataPacket.viewId] )
			{
				Application.windows[dataPacket.viewId].sendMessage( dataPacket );
			}
			// Pass to screen
			else if( dataPacket.screenId && Application.screens && Application.screens[dataPacket.screenId] )
			{
				Application.screens[dataPacket.screenId].sendMessage( dataPacket );
			}
			else
			{
				// Convert from string
				if( dataPacket.dataFormat == 'string' )
				{
					dataPacket.dataFormat = '';
					//dataPacket.data = dataPacket.data.split( ',' );
					//dataPacket.data = ( new Uint8Array( dataPacket.data ) ).buffer;
					dataPacket.data = ConvertStringToArrayBuffer( dataPacket.data, 'base64' );
				}
				var out = [];
				var f = extractCallback( dataPacket.fileId );
				if( f )
				{
					f.data = dataPacket.data;
					if( dataPacket.returnCode )
						f.returnCode = dataPacket.returnCode;
					// For File objects
					if( f.onLoad )
					{
						if( f.replacements )
						{
							for( var a in f.replacements )
							{
								f.data = f.data.split( '{' + a + '}' ).join ( f.replacements[a] );
							}
						}
						// For jsx files and others
						if( Application.appPath && !Application.noFilePathConversion )
						{
							if( !Application.authId && getUrlVar( 'authid' ) )
								Application.authId = getUrlVar( 'authid' );
							else if( dataPacket.authId ) Application.authId = dataPacket.authId;

							// Convert paths
							f.data = Friend.convertFriendPaths( f.data );
						}
						f.onLoad( f.data );
					}
					else if( f.onCall )
					{
						var firstPart = dataPacket.data.indexOf( '<!--separate-->' ) + ( '<!--separate-->' ).length;
						var data = dataPacket.data.substr( firstPart, dataPacket.data.length - firstPart );
						var resp = dataPacket.data.substr( 0, dataPacket.data.indexOf( '<!--separate-->' ) );
						f.onCall( resp, data );
					}
					// For Module objects
					else if ( f.onExecuted )
					{
						f.onExecuted( dataPacket.returnCode, dataPacket.data );
					}
					else
					{
						console.log( 'No callback?' );
					}
				}
				// TODO: This should be removed, it's a double right? Like the first if. . . Goes further down to a window
				else if( dataPacket.viewId && Application.windows && Application.windows[dataPacket.viewId] )
				{
					Application.windows[dataPacket.viewId].sendMessage( dataPacket );
				}
				// Goes further down stream
				else
				{
					Application.receiveMessage( dataPacket );
				}
			}
			break;
		// Filepost response
		case 'filepost':
			if( dataPacket.viewId && Application.windows && Application.windows[dataPacket.viewId] )
			{
				Application.windows[dataPacket.viewId].sendMessage( dataPacket );
			}
			// Pass to screen
			else if( dataPacket.screenId && Application.screens && Application.screens[dataPacket.screenId] )
			{
				Application.screens[dataPacket.screenId].sendMessage( dataPacket );
			}
			else
			{
				var f = extractCallback( dataPacket.fileId );
				if( f )
				{
					if( f.onPost )
					{
						f.onPost( dataPacket.result );
					}
					else
					{
						console.log( 'There was no onpost here!' );
					}
				}
				// Goes further down stream to self
				else
				{
					Application.receiveMessage( dataPacket );
				}
			}
			break;
		// Filesave response
		case 'filesave':
			if( dataPacket.viewId && Application.windows && Application.windows[dataPacket.viewId] )
			{
				Application.windows[dataPacket.viewId].sendMessage( dataPacket );
			}
			// Pass to screen
			else if( dataPacket.screenId && Application.screens && Application.screens[dataPacket.screenId] )
			{
				Application.screens[dataPacket.screenId].sendMessage( dataPacket );
			}
			else
			{
				var f = extractCallback( dataPacket.fileId );
				if( f )
				{
					if( f.onSave )
					{
						f.onSave();
					}
					else
					{
						console.log( 'There was no onsave here!' );
					}
				}
				// Goes further down stream to self
				else
				{
					Application.receiveMessage( dataPacket );
				}
			}
			break;
		// Messages for dormant - getting data from this app
		case 'dormantmaster':
			if( dataPacket.method )
			{
				if( dataPacket.method == 'getdirectory' )
				{
					// Execute and give callback
					if( DormantMaster.doors[ dataPacket.doorId ] )
					{
						var items = DormantMaster.doors[ dataPacket.doorId ].getDirectory( dataPacket.path, function( items )
						{
							Application.sendMessage( {
								type: 'dormantmaster',
								method: 'callback',
								doorId: dataPacket.doorId,
								callbackId: dataPacket.callbackId,
								data: items
							} );
						} );
						if ( items )
						{
							Application.sendMessage( {
								type: 'dormantmaster',
								method: 'callback',
								doorId: dataPacket.doorId,
								callbackId: dataPacket.callbackId,
								data: items
							} );
						}
					}
				}
				// Get File Information
				else if( dataPacket.method == 'getFileInformation' )
				{
					// Execute and give callback
					if( DormantMaster.doors[ dataPacket.doorId ] )
					{
						var items = DormantMaster.doors[ dataPacket.doorId ].getFileInformation( dataPacket.path, function( data )
						{
							Application.sendMessage( {
								type: 'dormantmaster',
								method: 'callback',
								doorId: dataPacket.doorId,
								callbackId: dataPacket.callbackId,
								data: data
							} );
						} );
					}
				}
				// Set File Information
				else if( dataPacket.method == 'setFileInformation' )
				{
					// Execute and give callback
					if( DormantMaster.doors[ dataPacket.doorId ] )
					{
						var items = DormantMaster.doors[ dataPacket.doorId ].setFileInformation( dataPacket.perm, function( data )
						{
							Application.sendMessage( {
								type: 'dormantmaster',
								method: 'callback',
								doorId: dataPacket.doorId,
								callbackId: dataPacket.callbackId,
								data: data
							} );
						} );
					}
				}
				// Read
				else if( dataPacket.method == 'read' )
				{
					// Execute and give callback
					if( DormantMaster.doors[ dataPacket.doorId ] )
					{
						var items = DormantMaster.doors[ dataPacket.doorId ].read( dataPacket.path, dataPacket.mode, function( data )
						{
							Application.sendMessage( {
								type: 'dormantmaster',
								method: 'callback',
								doorId: dataPacket.doorId,
								callbackId: dataPacket.callbackId,
								data: data
							} );
						} );
					}
				}
				// Write
				else if( dataPacket.method == 'write' )
				{
					// Execute and give callback
					if( DormantMaster.doors[ dataPacket.doorId ] )
					{
						var items = DormantMaster.doors[ dataPacket.doorId ].write( dataPacket.path, dataPacket.data, function( data )
						{
							Application.sendMessage( {
								type: 'dormantmaster',
								method: 'callback',
								doorId: dataPacket.doorId,
								callbackId: dataPacket.callbackId,
								data: data
							} );
						} );
					}
				}
				// DosActions
				else if( dataPacket.method == 'dosAction' )
				{
					// Execute and give callback
					if( DormantMaster.doors[ dataPacket.doorId ] )
					{
						var items = DormantMaster.doors[ dataPacket.doorId ].dosAction( dataPacket.func, dataPacket.args, function( data )
						{
							Application.sendMessage( {
								type: 'dormantmaster',
								method: 'callback',
								doorId: dataPacket.doorId,
								callbackId: dataPacket.callbackId,
								data: data
							} );
						} );
					}
				}
				// On success, we will update the title to the actual name
				else if( dataPacket.method == 'updatetitle' )
				{
					for( var a in DormantMaster.doors )
					{
						if( DormantMaster.doors[a].title == dataPacket.title )
						{
							DormantMaster.doors[a].title = dataPacket.realtitle;
							break;
						}
					}
				}
				else if( dataPacket.method == 'execute' )
				{
					// Execute and give callback
					if( DormantMaster.doors[ dataPacket.doorId ] )
					{
						var data = DormantMaster.doors[ dataPacket.doorId ].execute( dataPacket.dormantCommand, dataPacket.dormantArgs );
						Application.sendMessage( {
							type: 'dormantmaster',
							method: 'callback',
							doorId: dataPacket.doorId,
							callbackId: dataPacket.callbackId,
							data: data
						} );
					}
				}
				else if( dataPacket.method == 'callback' )
				{
					// Just pass it
					if( dataPacket.viewId && Application.windows && Application.windows[dataPacket.viewId] )
					{
						Application.windows[dataPacket.viewId].sendMessage( dataPacket );
					}
					else
					{
						var f = extractCallback( dataPacket.callbackId );
						if( f )
						{
							f( dataPacket.data );
						}
					}
				}
			}
			break;
		// Messages for doors
		case 'door':
			console.log( dataPacket );
			break;
		case 'applicationstorage':
			if ( dataPacket && typeof dataPacket.callbackId !== "undefined" )
			{
				var callback = extractCallback( dataPacket.callbackId );
				callback( dataPacket.data );
			}
			break;
		case 'authenticate':
			if ( dataPacket && typeof dataPacket.callbackId !== "undefined" )
			{
				var callback = extractCallback( dataPacket.callbackId );
				callback( dataPacket.data );
			}
			break;
		case 'generatekeys':
		case 'encrypt':
		case 'decrypt':
		case 'publickey':
		case 'setapplicationkey':
		case 'getapplicationkey':
			if ( dataPacket && typeof dataPacket.callbackId !== "undefined" )
			{
				var callback = extractCallback( dataPacket.callbackId );
				callback( dataPacket.data );
			}
			break;
		case 'fconn':
			if ( Friend.conn )
				Friend.conn.receiveMessage( dataPacket );
			else
				Application.receiveMessage( dataPacket );
			break;
		// Unknown command
		case 'libraryresponse':

			if( dataPacket.viewId && Application.windows && Application.windows[dataPacket.viewId] )
			{
				Application.windows[dataPacket.viewId].sendMessage( dataPacket );
			}
			else
			{
				var f = extractCallback( dataPacket.callbackId );
				if( f && f.onExecuted )
				{
					if( dataPacket & !dataPacket.returnData && dataPacket.returnCode )
					{
						// Try if we get these weird responses
						var j = false;
						try
						{
							j = JSON.parse( dataPacket.returnCode );
						}
						catch( e )
						{};
						f.onExecuted( true, j );
					}
					else f.onExecuted( dataPacket.returnCode, dataPacket.returnData );
				}
			}
			break;
		// Response from the print dialog
		case 'printdialog':
			// Handle the callback
			if( dataPacket.callbackId && typeof( Application.callbacks[dataPacket.callbackId] ) != 'undefined' )
			{
				var f = extractCallback( dataPacket.callbackId );
				if( f )
				{
					try
					{
						f( dataPacket.data );
					}
					catch( e )
					{
						//console.log( 'Error running callback function.' );
					}
				}
			}
			// We don't have the callback? Check the view window
			else if( dataPacket.viewId && Application.windows && Application.windows[dataPacket.viewId] )
			{
				Application.windows[dataPacket.viewId].sendMessage( dataPacket );
			}
			break;
		// Response from the file dialog
		case 'filedialog':
			// Handle the callback
			if( dataPacket.callbackId && typeof( Application.callbacks[dataPacket.callbackId] ) != 'undefined' )
			{
				var f = extractCallback( dataPacket.callbackId );
				if( f )
				{
					try
					{
						f( dataPacket.data );
					}
					catch( e )
					{
						//console.log( 'Error running callback function.' );
					}
				}
			}
			// We don't have the callback? Check the view window
			else if( dataPacket.viewId && Application.windows && Application.windows[dataPacket.viewId] )
			{
				Application.windows[dataPacket.viewId].sendMessage( dataPacket );
			}
			break;
		// Received quit signal!
		case 'quit':
			Application.quit(); // Tell to skip signaling back
			break;
		case 'callback':
			if( dataPacket.viewId && Application.windows && Application.windows[dataPacket.viewId] )
			{
				Application.windows[dataPacket.viewId].sendMessage( dataPacket );
				return;
			}
			else
			{
				if( done() ) return;
			}
		default:
			// If we are running the default method, try a bit later..
			if( hasDefaultMethod )
			{
				// We need some kind of safety *shrug*
				if( window.eventQueue.length > 100 )
				{
					clearInterval( __queuedEventInterval );
					return;
				}
				window.eventQueue.push( event );
				if( !__queuedEventInterval )
					__queuedEventInterval = setInterval( queuedEventTimer, __timeout );
				return;
			}
			Application.receiveMessage( dataPacket );
			break;
	}
	done();

	function done()
	{	
		// Run callbacks and clean up
		if( dataPacket.callback )
		{
			// Ok, we will try to execute the callback we found here!
			var f;
			if( dataPacket.resp && ( f = extractCallback( dataPacket.callback ) ) )
			{
				if( dataPacket.data )
				{
					f( dataPacket.resp, dataPacket.data );
					return true;
				}
				else
				{
					f( dataPacket.resp, false );
					return true;
				}
			}
			// Try to extract here
			else if( ( f = extractCallback( dataPacket.callback ) ) )
			{
				try
				{
					if ( dataPacket.isFriendAPI )
					{
						f( dataPacket.response, dataPacket.data, dataPacket.extra );
					}
					else
					{
						f( dataPacket );
					}
				}
				catch( e ){}
				return true;
			}
			// Aha, we have a window to send to (see if it's at this level)
			else if( dataPacket.viewId )
			{
				// At this level allright
				if( dataPacket.viewId == Application.viewId )
				{
					if( f = extractCallback( dataPacket.callback ) )
					{
						// It's us!
						try
						{
							if ( dataPacket.isFriendAPI )
							{
								f( dataPacket.response, dataPacket.data, dataPacket.extra );
							}
							else
							{
								f( dataPacket );
							}
						}
						catch( e ){}
						return true;
					}
				}
				// Search for our callback!
				if( Application.windows )
				{
					for( var a in Application.windows )
					{
						if( a == dataPacket.viewId )
						{
							Application.windows[a].sendMessage( dataPacket );
							return true;
						}
					}
				}
				
				return false;
			}
		}
		// Clean up callbacks unless they are to be kept
		else if( !dataPacket.keepCallback && !( dataPacket.returnMessage && dataPacket.returnMessage.keepCallback ) )
		{
			var n = [];
			for( var b in Application.callbacks )
			{
				if( dataPacket.callbackId == b )
				{
					console.log( 'Removed executed callback anchor (' + document.title + ')' );
				}
				else
				{
					n[b] = Application.callbacks[b];
				}
			}
			Application.callbacks = n;
			return true;
		}
		return false;
	}
}

// Web socket API --------------------------------------------------------------

// TODO: Complete this!
function FriendWebSocket( config )
{
	if( typeof( Application.websockets ) == 'undefined' )
		Application.websockets = [];
	// Add this websocket (passive at first)
	this.active = false;

	// Find a unique ID for the websocket
	var id = ( Math.random() * 999 ) + ( Math.random() * 999 ) + ( new Date().getTime() );
	var found = false;
	do
	{
		found = false;
		if( Application.websockets.length )
		{
			for( var a in Application.websockets )
			{
				if( a == id )
				{
					id = ( Math.random() * 999 ) + ( Math.random() * 999 ) + ( new Date().getTime() );
					found = true;
					break;
				}
			}
		}
	}
	while( found );
	Application.websockets[id] = this;

	// Connect to server
	// TODO: Add callback on which to communicate
	this.connect = function( url, protocol )
	{
		this.active = true;
		Application.sendMessage( {
			type: 'websocket',
			method: 'connect',
			data: { url: url, protocol: protocol }
		} );
	}
}

// Filesystem related
function AddFilesystemEvent( path, event, callback )
{
	if( path && event && callback )
	{
		var msg = {
			type: 'system',
			command: 'addfilesystemevent',
			path: path,
			event: event
		};
		if( callback )
		{
			var cid = addPermanentCallback( callback );
			msg.callback = cid;
		}
		Application.sendMessage( msg );
		return true;
	}
	return false;
}

function RemoveFilesystemEvent( path, event, callback )
{
	if( path && event )
	{
		var msg = {
			type: 'system',
			command: 'removefilesystemevent',
			path: path,
			event: event
		};
		if( callback )
		{
			var cid = addCallback( callback );
			msg.callback = cid;
		}
		Application.sendMessage( msg );
	}
	return false;
}

// Color picker ----------------------------------------------------------------
var ColorPicker = function( succcbk, failcbk )
{
	var self = this;
	var amsg = {
		type: 'system',
		command: 'colorpicker',
		method: 'new',
		successCallback: succcbk ? addCallback( succcbk ) : false,
		failCallback: failcbk ? addCallback( failcbk ) : false,
		createCallback: addCallback( function( uniqueId )
		{
			self.uniqueId = uniqueId;
			if( self.onReady )
			{
				self.onReady( {
					uniqueId: self.uniqueId
				} );
			}
		} )
	};
	Application.sendMessage( amsg );
}
// Activate the colorpicker window
ColorPicker.prototype.activate = function()
{
	var self = this;
	if( this.uniqueId )
	{
		Application.sendMessage( {
			type: 'system',
			command: 'colorpicker',
			method: 'activate',
			uniqueId: this.uniqueId,
			callback: addCallback( function( state )
			{
				if( self.onActivated )
				{
					self.onActivated( state );
				}
			} )
		} );
	}
}

// Activate the colorpicker window
ColorPicker.prototype.close = function()
{
	var self = this;
	if( this.uniqueId )
	{
		Application.sendMessage( {
			type: 'system',
			command: 'colorpicker',
			method: 'close',
			uniqueId: this.uniqueId,
			callback: addCallback( function( state )
			{
				if( self.onClosed )
				{
					self.onClosed( state );
				}
			} )
		} );
	}
}

// Open a new widget -----------------------------------------------------------
function Widget( flags )
{
	var widgetId = 'widget_' + ( new Date() ).getTime() + '.' + Math.random();

	this._flags = flags ? flags : {};

	var msg = {
		type:    'widget',
		data:    flags,
		widgetId:widgetId
	}

	this.getWidgetId = function()
	{
		return widgetId;
	}
	// Get flag
	this.getFlag = function( flag )
	{
		return this._flags[flag];
	}
	// Set single flag
	this.setFlag = function( flag, value )
	{
		this._flags[flag] = value;
		Application.sendMessage( {
			type:    'widget',
			method:  'setFlag',
			widgetId: widgetId,
			data:    { flag: flag, value: value }
		} );
	}
	// Set window content
	this.setContent = function( data, callback )
	{
		// Add callback
		var cid = false;
		if( callback )
			cid = addCallback( callback );
		var o = {
			type:     'widget',
			method:   'setContent',
			widgetId: widgetId,
			filePath: Application.filePath,
			callback: cid,
			data:     data
		};
		
		// Take this in your hand if it's there
		if( Application.sessionId ) o.sessionId = Application.sessionId;
		// Todo: App path or file path? synonymous!?
		if( Application.appPath ) o.appPath = Application.appPath;
		if( Application.filePath ) o.filePath = Application.filePath;

		// Language support
		if( globalConfig.language )
		{
			o.spokenLanguage = globalConfig.language;
			o.alternateLanguage = globalConfig.languageAlternate;
		}
		Application.sendMessage( o );
	}
	this.raise = function()
	{
		Application.sendMessage( {
			type:    'widget',
			method:  'raise',
			widgetId: widgetId
		} );
	}
	this.lower = function()
	{
		Application.sendMessage( {
			type:    'widget',
			method:  'lower',
			widgetId: widgetId
		} );
	}
	this.show = function()
	{
		Application.sendMessage( {
			type:    'widget',
			method:  'show',
			widgetId: widgetId
		} );
	}
	this.hide = function()
	{
		Application.sendMessage( {
			type:    'widget',
			method:  'hide',
			widgetId: widgetId
		} );
	}
	this.autosize = function()
	{
		Application.sendMessage( {
			type:    'widget',
			method:  'autosize',
			widgetId: widgetId
		} );
	}
	this.close = function()
	{
		Application.sendMessage( {
			type:    'widget',
			method:  'close',
			widgetId: widgetId
		} );
		// Remove widget from list
		var w = [];
		var a;
		for (a in Application.widgets)
			if (Application.widgets[a] != this)
				w.push(Application.widgets[a]);
		Application.widgets = w;
	}

	// Setup view object with master
	Application.sendMessage( msg );
	if( !Application.widgets )
		Application.widgets = {};
	Application.widgets[ widgetId ] = this;
}

// Open a new view -------------------------------------------------------------

function View( flags )
{
	var viewId = 'window_' + ( new Date() ).getTime() + '.' + Math.random();

	// Proxy screens are virtual :)
	if( flags.screen )
		flags.screen = flags.screen.getScreenId();
	else if( Application.screenId )
		flags.screen = Application.screenId;

	this._flags = flags ? flags : {};

	var msg = {
		type:    'view',
		data:    flags,
		viewId: viewId
	};
	
	if( Application.viewId )
	{
		msg.parentViewId = Application.viewId;
	}

	// Bring a window to front
	this.toFront = function()
	{
		Application.sendMessage( {
			type:    'view',
			method:  'toFront',
			viewId: viewId
		} );
	}
	this.getViewId = function()
	{
		return viewId;
	}
	// Set flags
	this.setFlags = function( flags )
	{
		Application.sendMessage( {
			type:    'view',
			method:  'setFlags',
			viewId: viewId,
			data:    flags
		} );
	}
	// Get flag
	this.getFlag = function( flag )
	{
		return this._flags[flag];
	}
	// Set single flag
	this.setFlag = function( flag, value )
	{
		Application.sendMessage( {
			type:    'view',
			method:  'setFlag',
			viewId: viewId,
			data:    { flag: flag, value: value }
		} );
	}
	this.getWindowElement = function( callback )
	{
		if( callback )
			cid = addCallback( callback );
		var o = {
			type:     'view',
			method:   'getWindowElement',
			viewId:   viewId,
			destination: Application.viewId ? Application.viewId : false,
			callback: cid
		};
		Application.sendMessage( o );
	}
	
	// Show the camera
	this.openCamera = function( flags, callback )
	{
		var cid = addCallback( function( msg )
		{
			callback( msg.data );
		} );
		var o = {
			type: 'view',
			method: 'opencamera',
			viewId: viewId,
			// Right scope!
			targetViewId: Application.viewId ? Application.viewId : null,
			flags: flags,
			callback: cid
		};
		Application.sendMessage( o );
	}
	
	// Show the mobile back button
	this.showBackButton = function( visible, callback )
	{
		if( !isMobile ) return;
		var cid = addCallback( callback );
		var o = {
			type: 'view',
			method: 'showbackbutton',
			viewId: viewId,
			// Right scope!
			targetViewId: Application.viewId ? Application.viewId : null,
			visible: visible,
			callback: cid
		};
		Application.sendMessage( o );
	}
	
	// Set window content
	this.setContent = function( data, callback )
	{
		// Add callback
		var cid = false;
		if( callback )
			cid = addCallback( callback );
		var o = {
			type:     'view',
			method:   'setContent',
			viewId: viewId,
			filePath: Application.filePath,
			callback: cid,
			data:     data
		};
		
		// Take this in your hand if it's there
		if( Application.sessionId ) o.sessionId = Application.sessionId;
		// Todo: App path or file path? synonymous!?
		if( Application.appPath ) o.appPath = Application.appPath;
		if( Application.filePath ) o.filePath = Application.filePath;

		// Language support
		if( globalConfig.language )
		{
			o.spokenLanguage = globalConfig.language;
			o.alternateLanguage = globalConfig.languageAlternate;
		}
		Application.sendMessage( o );
	}
	// Sets a property by id
	this.setAttributeById = function( id, property, value, callback )
	{
		// Add callback
		var cid = false;
		if( callback ) cid = addCallback( callback );
		Application.sendMessage( {
			type:      'view',
			method:    'setAttributeById',
			viewId:  viewId,
			filePath:  Application.filePath,
			elementId: id,
			callback:  cid,
			attribute: property,
			data:      value
		} );
	}
	this.getAttributeById = function( id, property, callback )
	{
		var cid = false;
		if( callback ) cid = addCallback( callback );
		Application.sendMessage( {
			type:      'view',
			method:    'getAttributeById',
			viewId:  viewId,
			filePath:  Application.filePath,
			elementId: id,
			callback:  cid,
			attribute: property
		} );
	}
	this.setContentById = function( id, data, callback )
	{
		// Add callback
		var cid = false;
		if( callback ) cid = addCallback( callback );
		Application.sendMessage( {
			type:      'view',
			method:    'setContentById',
			viewId:  viewId,
			filePath:  Application.filePath,
			elementId: id,
			callback:  cid,
			data:      data
		} );
	}
	// Set rich window content
	this.setRichContent = function( data )
	{
		Application.sendMessage( {
			type:    'view',
			method:  'setRichContent',
			filePath: Application.filePath,
			viewId: viewId,
			data:     data
		} );
	}
	this.setRichContentUrl = function( url )
	{
		Application.sendMessage( {
			type:     'view',
			method:   'setRichContentUrl',
			base:     Application.domain + '/webclient/',
			domain:   'http://' + document.location.href.split( '//' )[1].split( '/' )[0],
			filePath: Application.filePath,
			viewId: viewId,
			url:      url
		} );
	}
	this.loadTemplate = function( url )
	{
		url = url.split( /progdir\:/i ).join( Application.appPath ? Application.appPath : Application.filePath );
		url = url.split( /libs\:/i ).join( Application.domain + '/webclient/' );
		url = getImageUrl( url );
		this.setRichContentUrl( url );
	}
	// Set subcontent on window
	// TODO: Remove this, we will use setContentById!!
	this.setSubContent = function( identifier, flag, data )
	{
		Application.sendMessage( {
			type:       'view',
			method:     'setSubContent',
			viewId:   viewId,
			filePath:   Application.filePath,
			flag:       flag,
			identifier: identifier,
			data:       data
		} );
	}
	// Get subcontent
	this.getContentById = function( identifier, flag, callback )
	{
		Application.sendMessage( {
			type:       'view',
			method:     'getContentById',
			viewId:   viewId,
			identifier: identifier,
			flag:       flag
		} );
	}
	// Set an attribute on subcontent
	this.setSubContentAttribute = function( identifier, flag, attribute, value )
	{
		Application.sendMessage( {
			type:       'view',
			method:     'setSubContentAttribute',
			viewId:   viewId,
			identifier: identifier,
			flag:       flag,
			attribute:  attribute,
			value:      value
		} );
	}
	// Add an event on window sub element
	this.addEventByClass = function( classname, event, callback )
	{
		Application.sendMessage( {
			type:     'view',
			method:   'addEventByClass',
			viewId:  viewId,
			className: classname,
			event:     event,
			callback:  callback
		} );
	}
	this.focusOnElement = function( identifier, flag )
	{
		Application.sendMessage( {
			type:       'view',
			method:     'focusOnElement',
			viewId:   viewId,
			identifier: identifier,
			flag:       flag
		} );
	}
	this.activate = function()
	{
		for( var a in Application.windows )
		{
			if( Application.windows[a] != this )
				Application.windows[a].activated = false;
		}
		this.activated = true;
		Application.sendMessage( {
			type:     'view',
			method:   'activate',
			viewId: viewId
		} );
		// Add class
		document.body.classList.add( 'activated' );
	}
	this.focus = function()
	{
		Application.sendMessage( {
			type:     'view',
			method:   'focus',
			viewId:  viewId
		} );
	}
	this.sendMessage = function( dataObject )
	{
		Application.sendMessage( {
			type:    'view',
			method:  'sendmessage',
			viewId:   viewId,
			data:     dataObject
		} );
	}

	// Sets the menu item on view element
	this.setMenuItems = function( object )
	{
		// Recursive translator
		function applyi18n( object )
		{
			for( var a = 0; a < object.length; a++ )
			{
				object[a].name = i18n( object[a].name );
				if( object[a].items && typeof( object[a].items ) == 'array' )
					object[a].items = applyi18n( object[a].items );
			}
			return object;
		}

		// Execute translations
		object = applyi18n( object );

		Application.sendMessage( {
			type:     'view',
			method:   'setMenuItems',
			viewId: viewId,
			data:     object
		} );
	}

	// Prevent closing
	this.preventClose = function( bol )
	{
		if( bol === false ) this.preventClosing = false;
		else this.preventClosing = true;
	}

	// Closes the view
	this.close = function()
	{
		// Don't double close!
		if( this.closed ) return;
		if( this.onClose )
		{
			this.onClose();
		}

		if( this.preventClosing ) return;
		
		this.closed = true;

		// Kill slot
		var w = [];
		for( var a in Application.windows )
		{
			if( a == viewId ) continue;
			else
			{
				w[a] = Application.windows[a];
			}
		}
		Application.windows = w;

		// Tell the application to close!
		Application.sendMessage( {
			type:     'view',
			method:   'close',
			viewId: viewId
		} );

		// Focus on parent
		if( Application.viewId )
		{
			Application.sendMessage( {
				type: 'view',
				method: 'activate',
				viewId: Application.viewId
			} );
		}
	}

	// Setup view object with master
	Application.sendMessage( msg );
	Application.windows[ viewId ] = this;

	// Just activate this window (unless it starts minimized)
	if( !flags.minimized )
		this.activate();
}

// To close a view
function CloseView( id )
{
	// No id? Get the actual view we're in
	if( !id && Application.viewId )
		id = Application.viewId;

	// It's an object
	if( typeof( id ) == 'object' )
	{
		if( id.close )
		{
			console.log( ' -> Closing object.' );
			return id.close();
		}
		return false;
	}
	// It's an id here in this scope?
	else if( Application.windows[ id ] )
	{
		// Closing object by id.
		Application.windows[ id ].close();
	}
	else if( Application.viewId )
	{
		// Asking a specific view to close this one by id.
		Application.sendMessage( { command: 'notify', method: 'closeview', viewId: Application.viewId } );
	}
	else
	{
		// Asking app to close this view.
		Application.sendMessage( { command: 'notify', method: 'closeview', viewId: id } );
	}
}

// Make a new popupview --------------------------------------------------------
function PopupView( parentWindow, flags )
{
	var popupViewId = 'popupwindow_' + ( new Date() ).getTime() + '.' + Math.random();
	var msg = {
		type:    'popupview',
		data:    flags,
		popupViewId: popupViewId
	}
}

// Screen object abstraction ---------------------------------------------------
function Screen( flags )
{
	var screenId = 'screen_' + ( new Date() ).getTime() + '.' + Math.random();
	var msg = {
		type:    'screen',
		data:    flags,
		screenId: screenId
	}
	this.getScreenId = function()
	{
		return screenId;
	}

	// Set screen content
	this.setContent = function( data, callback )
	{
		// Add callback
		var cid = false;
		if( callback ) cid = addCallback( callback );

		var o = {
			type:     'screen',
			method:   'setContent',
			screenId: screenId,
			filePath: Application.filePath,
			callback: cid,
			data:     data
		};
		// Take this in your hand if it's there
		if( Application.sessionId ) o.sessionId = Application.sessionId;
		// Todo: App path or file path? synonymous!?
		if( Application.appPath ) o.appPath = Application.appPath;
		if( Application.filePath ) o.filePath = Application.filePath;

		// Language support
		if( globalConfig.language )
		{
			o.spokenLanguage = globalConfig.language;
			o.alternateLanguage = globalConfig.languageAlternate;
		}

		Application.sendMessage( o );
	}

	this.loadTemplate = function( url )
	{
		url = url.split( /progdir\:/i ).join( Application.appPath ? Application.appPath : Application.filePath );
		url = url.split( /libs\:/i ).join( Application.domain + '/webclient/' );
		// System file
		if( url.substr( 0, 11 ) == '/webclient/' ) return this.setRichContentUrl( url );
		url = getImageUrl( url );
		this.setRichContentUrl( url );
	}

	this.setRichContentUrl = function( url )
	{
		Application.sendMessage( {
			type:     'screen',
			method:   'setRichContentUrl',
			base:     Application.domain + '/webclient/',
			domain:   'http://' + document.location.href.split( '//' )[1].split( '/' )[0],
			filePath: Application.filePath,
			screenId: screenId,
			url:      url
		} );
	}

	// Sets the menu item on view element
	this.setMenuItems = function( object )
	{
		// Recursive translator
		function applyi18n( object )
		{
			for( var a = 0; a < object.length; a++ )
			{
				object[a].name = i18n( object[a].name );
				if( object[a].items && typeof( object[a].items ) == 'array' )
					object[a].items = applyi18n( object[a].items );
			}
			return object;
		}

		// Execute translations
		object = applyi18n( object );

		Application.sendMessage( {
			type:     'screen',
			method:   'setMenuItems',
			screenId: screenId,
			data:     object
		} );
	}

	// Closes the screen
	this.close = function()
	{
		// Don't double close!
		if( this.closed ) return;
		this.closed = true;
		if ( this.onClose ) this.onClose();

		// Kill slot
		var w = [];
		var count = 0;
		for( var a in Application.screens )
		{
			if( a == screenId ) continue;
			else
			{
				w[a] = Application.screens[a];
				count++;
			}
		}
		Application.screens = w;

		// Tell the application to close!
		Application.sendMessage( {
			type:     'screen',
			method:   'close',
			screenId: screenId
		} );
	}

	this.screenToFront = function()
	{
		Application.sendMessage( {
			type:     'screen',
			method:   'screentofront',
			screenId: screenId
		} );
	}

	this.sendMessage = function( dataObject )
	{
		Application.sendMessage( {
			type:    'screen',
			method:  'sendmessage',
			screenId: screenId,
			data:     dataObject
		} );
	}

	// Setup view object with master
	Application.sendMessage( msg );
	if( !Application.screens )
		Application.screens = {};
	Application.screens[ screenId ] = this;
}

// Shell API -------------------------------------------------------------------

Shell = function()
{
	var cid = addCallback( this );

	var shellObject = this;

	this.output = false;

	var appObject = {
		applicationId: Application.applicationId,
		authId:        Application.authId,
		sessionId:     Application.sessionId
	};

	// Create a pipe function back to this object
	this.applicationPipe = addPermanentCallback( function( dmsg )
	{
		if( shellObject.onPipe )
			shellObject.onPipe( dmsg );
	} );

	Application.sendMessage( {
		type:    'shell',
		args:    appObject,
		vars:    this.vars,
		pipe:    this.applicationPipe,
		shellId: cid // incoming calls
	} );

	this.onBeforeReady = function( msg )
	{
		if( msg.shellSession )
		{
			this.shellSession = msg.shellSession;
			this.shellSession.clientId = this.clientId;
			this.number = msg.shellNumber;
			this.pipeOutgoing = msg.pipeCallback;
		}
	}

	// Enable output mode
	this.setOutput = function( mode )
	{
		switch( mode )
		{
			case 'console':
				this.output = mode;
				return true;
		}
		return false;
	}

	this.close = function()
	{
		if( !this.shellSession ) return;

		Application.sendMessage( {
			type: 'shell',
			command: 'close',
			shellSession: this.shellSession
		} );
	}

	// Adds an event
	this.addEvent = function( eventName, persistent, callback )
	{
		var allowedEvents = [
			'mount', 'unmount', 'openscreen', 'closescreen',
			'openview', 'closeview' /* More to come... */
		];
	}

	this.execute = function( commandLine, callback )
	{
		if( !this.shellSession ) return;
		if( this.output == 'console' ) console.log( 'Shell instance executing command line:', commandLine );
		var cb = false;
		var t = this;

		// Special extra callbacks in addition to pipe activity
		if( callback )
		{
			function wcallback( var1 )
			{
				if( callback ) callback( var1 );
				if( t.output == 'console' )
				{
					if( var1 && typeof( var1 ) == 'object' )
					{
						if( var1.returnMessage )
						{
							if( typeof( var1.returnMessage ) == 'object' )
							{
								return console.log( var1.returnMessage.response );
							}
							return console.log( var1.returnMessage );
						}
					}
				}
			}
			cb = addCallback( wcallback );
		}
		Application.sendMessage( {
			type: 'shell',
			command: 'execute',
			commandLine: commandLine,
			shellSession: this.shellSession,
			callbackId: cb
		} );
	}

	this.evaluate = function( input, callback, clientKey, restrictedPath )
	{
		if( !this.shellSession ) return;
		if( this.output == 'console' ) console.log( 'Shell instance executing evaluate');
		var cb = false;
		var t = this;

		// Special extra callbacks in addition to pipe activity
		if( callback )
		{
			function wcallback( var1 )
			{
				if( callback ) callback( var1 );
			}
			cb = addCallback( wcallback );
		}

		Application.sendMessage( {
			type: 'shell',
			command: 'evaluate',
			input: input,
			shellSession: this.shellSession,
			clientKey: clientKey,
			restrictedPath: restrictedPath,
			callbackId: cb
		} );
	}


	// Clear events (by name optionally)
	this.clearEvents = function( eventName )
	{
		if( !eventName ) this.events = [];
		else
		{
			var nlist = [];
			for( var a = 0; a < this.events.length; a++ )
			{
				if( this.events[a][0] != eventName )
					nlist.push( this.events[a] );
			}
			this.events = nlist;
		}
	}
}


// Audio API -------------------------------------------------------------------

// build a request and fire it off
// TODO: Make this global for the Doors space (use proxy!)
var __audioContext = false;

WebAudioLoader = function( filePath, callback )
{
	if( !__audioContext )
	{
		var au = window.AudioContext || window.webkitAudioContext;
		__audioContext = new au();
	}           

	this.audioGraph =
	{
		volume: 0.5,
		context: __audioContext,                                                //this is the container for your entire audio graph
		bufferArray: [],
		bufferArrayIndex: 0,
		bufferArrayTimeOffset: 0,
		useArray: false,
		bufferCache: null,                                                      //buffer needs to be re-initialized before every play, so we'll cache what we've loaded here
		playTime: 0,
		paused: false,
		//for chaching / retrieving the buffer
		getBufferCache: function()
		{
			return this.bufferCache;
		},
		setBufferCache: function( _sound )
		{
			this.bufferCache = _sound;
		},
		//for setting the current instance of the buffer
		setBuffer: function( _sound )
		{
			this.source.buffer = _sound;
		},
		setPlaybackRate: function( pitch )
		{
			this.pitch = pitch;
		},
		setRate: function( rate )
		{
			this.rate = rate;
		},
		// Schedule (for streaming)
		schedulePlaying: function( buf )
		{
			this.useArray = true;
			this.bufferArray.push( buf );
			if( this.playTime > 0 )
			{
				if( this.bufferArrayTimeOffset < this.playTime )
					this.bufferArrayTimeOffset += this.playTime;
				
				while( this.bufferArrayIndex < this.bufferArray.length )
				{
					var schBuf = this.context.createBufferSource();
					schBuf.buffer = this.bufferArray[ this.bufferArrayIndex++ ];
					
					// Add onended to the last piece
					if( this.bufferArrayIndex >= this.bufferArray.length )
					{
						if( this.onEnded ) schBuf.addEventListener( 'ended', this.onEnded );
					}
					
					schBuf.playbackRate.value = this.pitch;
					schBuf.connect( this.context.destination );
					schBuf.connect( this.gainNode );
					schBuf.start( this.bufferArrayTimeOffset );
					console.log( 'Starting next at ' + ( this.bufferArrayTimeOffset ) );
					this.bufferArrayTimeOffset += schBuf.buffer.duration;
				}
			}
		},
		//play it
		playSound: function( info ) // cont is only for useArray
		{
			if( this.started && !info )
			{
				this.source.stop();                                             // call noteOff to stop any instance already playing before we play ours
				this.started = false;
			}
			this.source = this.context.createBufferSource();
			
			// Normal stuff
			if( !this.useArray )
			{
				if( info && info.onEnded ) this.source.addEventListener( 'ended', info.onEnded );
			}
			// For streaming - buffer the onEnded callback
			else if( info && info.onEnded )
			{
				this.onEnded = info.onEnded;
			}
			
			this.setBuffer( this.bufferCache );                                 // re-set the buffer
			
			this.source.playbackRate.value = this.pitch;                        // here's your playBackRate check
			this.source.connect( this.context.destination );                    // connect to the speakers
			this.source.connect( this.gainNode );
			this.setVolume( this.volume );
			this.gainNode.connect( this.context.destination );
			this.source.start();                                                // pass in 0 to play immediately
			this.started = Date.now();
			this.pausedPos = 0;
			this.playTime = this.context.currentTime;                           // offset
		},
		setVolume: function( volume )
		{
			this.volume = volume;
			this.gainNode.gain.setValueAtTime( this.volume, this.context.currentTime );
		},
		pause: function()
		{
			if( this.paused )
			{
				// New time
				if( this.started ) this.source.stop();
				this.started = Date.now() - this.pausedPos;
				this.paused = false;
				this.source = this.context.createBufferSource();                //init the source
				this.source.connect( this.gainNode );
				this.gainNode.connect( this.context.destination );
				this.gainNode.gain.setValueAtTime( this.volume, this.context.currentTime - ( this.pausedPos / 1000 ) );
				if( this.useArray )
				{
					this.setBuffer( this.bufferArray[ this.bufferArrayIndex ] );
				}
				else
				{
					this.setBuffer( this.bufferCache );                             //re-set the buffer
				}
				this.source.playbackRate.value = this.pitch;                    //here's your playBackRate check
				this.source.connect( this.context.destination );                //connect to the speakers
				this.source.start( 0, this.pausedPos / 1000 );
				this.gainNode.gain.value = this.volume;
				this.playTime = this.context.currentTime - ( this.pausedPos / 1000 );
			}
			else
			{
				this.paused = true;
				this.pausedPos = Date.now() - this.started;
				if( this.started )
				{
					this.started = 0;
					this.source.stop();
				}
			}
			return this.paused;
		},
		stop: function()
		{
			if( !this.started ) return;
			this.started = false;
			this.paused = false;
			this.source.stop();
			this.bufferArrayIndex = 0;
		}
	}

	// Do we need this?
	this.audioGraph.source = this.audioGraph.context.createBufferSource();      //your buffer will sit here

	// Create a gain node.
	this.audioGraph.gainNode = this.audioGraph.context.createGain();

	var t = this;

	// Do the loading
	(function()
	{
		if( "streaming" == "implemented" )
		{
			try
			{
				var url = filePath;
				if( !( filePath.substr( 0, 5 ) == 'http:' || filePath.substr( 0, 6 ) == 'https:' ) && filePath.indexOf( '/system.library' ) != 0 )
					url = getWebUrl( filePath );
			
				var bytes = 0;
				var minBuffer = 262144;
			
				fetch( url ).then( function( response )
				{
					var reader = response.body.getReader();
				
					function read()
					{
						return reader.read().then( ( { value, done } ) => 
						{
							if( done )
							{
								console.log('done');
								return;
							}
							else
							{
							
								try
								{
									t.audioGraph.context.decodeAudioData( value.buffer, function( buffer )
									{
										if( buffer.length )
										{
											scheduleBuffers( buffer );
										}
										else
										{
											console.log( 'Got a null buffer!' );
										}
									}, 
									function(err) 
									{
										console.log("err(decodeAudioData): "+err);
									} );
								}
								catch( e ){};
							}
							read();
						} );
					}
					read();
				} );
				// Extend the buffer asyncronously
				function scheduleBuffers( buffer )
				{
					var ctx = t.audioGraph.context;
					var grp = t.audioGraph;
				
					bytes += buffer.length;
				
					console.log( 'Have loaded ' + bytes + ' bytes' );
				
					// Schedule the playing on time
					grp.schedulePlaying( buffer );
				
					if( bytes >= minBuffer && callback )
					{
						callback( true );
						callback = false;
						console.log( 'Got enough! Playing' );
					}
				}
				return;
			}
			catch( e )
			{
			}
		}
		// Non streaming
		else
		{
			var request = new XMLHttpRequest();
			request.responseType = 'arraybuffer';
			request.onload = function( evt )
			{
				var theData = request.response;
			
				// Decode
				try
				{
					t.audioGraph.context.decodeAudioData(
						theData,
						function( buf )
						{
							try
							{
								t._loadedBuffer = buf;
								t.audioGraph.setBuffer( buf );
								t.audioGraph.setBufferCache( buf );
								if( callback ) callback( true );
							}
							catch( e )
							{
								console.log( 'No buffer yet.', request.response );
								if( callback ) callback( true, { response: 0, message: 'Could not set buffer yet.' } );
							}
						},
						function()
						{
							console.log( 'Totally failed to decode..' );
							// error;
							if( callback )
								callback( false );
						}
					);
				}
				catch( e )
				{
					if( callback )
						callback( false );
				}
			};
			if( !( filePath.substr( 0, 5 ) == 'http:' || filePath.substr( 0, 6 ) == 'https:' ) && filePath.indexOf( '/system.library' ) != 0 )
				filePath = getWebUrl( filePath );
			request.open( 'POST', filePath, true );
			request.send();
		}
	}());//loader
};

var __audioLoaders = [];
var __maxAudioLoaders = 1;
var __currentAudioLoader = 0;

function AudioObject( sample, callback )
{
	this.loaded = false;
	this.loadSample = function( path )
	{
		var t = this;
		if( !( path.substr( 0, 5 ) == 'http:' || path.substr( 0, 6 ) == 'https:' ) )
			path = getImageUrl( path );
		this.loader = new WebAudioLoader( path, function( result ){
			if( result )
			{
				t.loaded = true;
				if( t.loader )
				{
					t.loader.audioGraph.setRate( 1 );
					t.loader.audioGraph.setPlaybackRate( 1 );
				}
				if( t.onload ) t.onload();
				if( callback ) callback( true );
			}
			else
			{
				if( callback )
					callback( result );
			}
		} );
		this.path = path;
	}

	this.getContext = function()
	{
		return __audioContext;
	}

	this.setCurrentTime = function( time )
	{
		this.loader.audioGraph.source.currentTime = time;
	}

	this.getCurrentTime = function()
	{
		return this.loader.audioGraph.source.currentTime;
	}

	this.pause = function()
	{
		this.paused = this.loader.audioGraph.pause();
	}

	this.unload = function()
	{
		this.loader.audioGraph.source = null;
		this.loader.audioGraph = null;
		this.loader = null;
	}

	this.stop = function()
	{
		this.loader.audioGraph.stop();
		if( this.interval )
		{
			clearInterval( this.interval );
			this.interval = false;
		}
	}

	this.decode = function()
	{

	}

	this.playArgs = function( args )
	{
		if( !args ) return;
		if( args.pitch ) this.loader.audioGraph.setPlaybackRate( args.pitch );
		if( args.pitch ) this.loader.audioGraph.setRate( args.pitch );
		this.loader.audioGraph.playSound();
	}

	// Uses -2 to 2
	this.setVolume = function( vol )
	{
		if( this.loader && this.loader.audioGraph )
			this.loader.audioGraph.setVolume( ( vol * 4 ) - 2 );
	}

	// Plays notes!
	this.play = function()
	{
		var t = this;
		if( this.interval ) clearInterval( this.interval );
		this.interval = setInterval( function()
		{
			if( t.loader.audioGraph.started && t.onplaying && !t.loader.audioGraph.paused )
			{
				var ct = t.getContext().currentTime;
				var pt = t.loader.audioGraph.playTime;
				try
				{
					var dr = t.loader.audioGraph.source.buffer.duration;
					t.onplaying( ( ct - pt ) / dr, ct, pt, dr );
				}
				catch( e )
				{
					console.log( 'Playing streaming segment. Fixme!' );
				}
			}
		}, 100 );
		
		// Handle ending
		var ag = t.loader.audioGraph;
	
		function ended()
		{
			// Using streaming
			if( ag.useArray )
			{
				if( ag.bufferArrayIndex >= ag.bufferArray.length )
				{
					clearTimeout( t.interval );
					t.interval = false;
					if( t.onfinished )
					{
						t.onfinished();
					}
				}
				return;
			}
			clearTimeout( t.interval );
			t.interval = false;
			if( t.onfinished )
				t.onfinished();
		}
		
		console.log( 'Playing now!' );
		this.loader.audioGraph.playSound( { onEnded: ended } );
	}

	if( sample )
	{
		this.loadSample( sample );
	}
}


// File object abstraction -----------------------------------------------------

function getImageUrl( path, mode )
{
	if( !mode ) mode = 'rs';
	
	// TODO: Determine from Doors!
	var apath = Application.appPath ? Application.appPath : Application.filePath;

	if( path.toLowerCase().substr( 0, 8 ) == 'progdir:' )
	{
		path = apath + path.substr( 8, path.length - 8 );
	}
	else if( path.toLowerCase().substr( 0, 7 ) == 'system:' )
	{
		return path.split( /system\:/i ).join( '/webclient/' );
	}
	else if( path.toLowerCase().substr( 0, 5 ) == 'libs:' )
	{
		return path.split( /libs\:/i ).join( '/webclient/' );
	}
	if( path.indexOf( 'http:' ) == 0 || path.indexOf( 'https:' ) == 0 )
	{
		return path;
	}

	if( path.indexOf( ':' ) > 0 )
	{
		path = encodeURIComponent( path );
	}

	var prt = 'authid=' + ( Application.authId ? Application.authId : '' );
	if( Application.sessionId ) prt = 'sessionid=' + Application.sessionId;
	var u = '/system.library/file/read?' + prt + '&path=' + path + '&mode=rs';
	return u;
}
// Alias
function getWebUrl( path, mode )
{
	return getImageUrl( path, mode );
}

function File( path )
{
	this.path = path;
	this.vars = {};
	var apath = Application.appPath ? Application.appPath : Application.filePath;

	// Adds translations to file replacements
	this.i18n = function()
	{
		if( !this.replacements ) this.replacements = {};
		if( window.translations )
		{
			for( var a in window.translations )
			{
				this.replacements[a] = window.translations[a];
			}
		}
	}

	// Execute replacements
	this.doReplacements = function( data )
	{
		var str = data ? data : this.data;
		if( !str ) return '';
		for( var a in this.replacements )
		{
			str = str.split( '{' + a + '}' ).join( this.replacements[a] );
		}
		if( !data )
			this.data = str;
		return str;
	}

	this.call = function( command, arguments )
	{
		if( arguments )
		{
			for( var a in arguments )
				this.vars[a] = arguments[a];
		}
		if( command )
			this.vars['query'] = command;

		var fid = addCallback( this );
		Application.sendMessage( {
			type:    'file',
			data:    { path: this.path },
			method:  'call',
			filePath: apath,
			vars:    this.vars,
			fileId:  fid
		} );
	}

	// Load the file
	this.load = function( mode )
	{
		var fid = addCallback( this );
		if( !mode ) mode = 'r'; else mode = mode.toLowerCase();
		if( mode=='r' || mode=='rb' ) this.vars.mode = mode;
		
		Application.sendMessage( {
			type:    'file',
			data:    { path: this.path },
			method:  'load',
			filePath: apath,
			vars:    this.vars,
			fileId:  fid
		} );
	}

	// Posts a file through file upload
	this.post = function( content, filename )
	{
		if( !filename ) filename = this.path;

		var fid = addCallback( this );
		Application.sendMessage( {
			type:    'file',
			data:    { filename: filename, data: Base64.encode( content ) },
			method:  'post',
			fileId:  fid
		} );
	}

	this.save = function( data, filename, mode )
	{
		if( !filename ) filename = this.path;

		var fid = addCallback( this );

		var dataMode = 'raw';
		if( ( mode && mode == 'wb' ) || ( this.vars && this.vars.mode == 'wb' ) )
		{
			dataMode = 'string';
			data = ConvertArrayBufferToString( data, 'base64' );
		}

		Application.sendMessage( {
			type:    'file',
			data:    { path: filename, data: data },
			dataFormat: dataMode,
			method:  'save',
			filePath: apath,
			vars:    this.vars,
			fileId:  fid
		} );
	}
	this.addVar = function( key, value )
	{
		this.vars[key] = value;
	}
}

// Module object abstraction ---------------------------------------------------

function Module( module )
{
	var fid = addCallback( this );
	this.vars = [];
	this.execute = function( method, args )
	{
		var fid = addCallback( this );
		
		var ms = {
			type:    'module',
			module:  module,
			method:  method,
			args:    args,
			vars:    this.vars,
			fileId:  fid
		};
		
		if( this.forceHTTP )
		{
			ms.forceHTTP = this.forceHTTP;
		}
		
		Application.sendMessage( ms );
	}
	this.addVar = function( key, value )
	{
		this.vars[key] = value;
	}
}

GetClass = function( source )
{
	// Assign the functions of the class
	var start = 0;
	var end = source.indexOf( '.' );
	if( end < 0 )
		end = 10000;
	var klass = window[ source.substring( start, end ) ];
	if( typeof klass == 'undefined' )
		return null;
	while( end < source.length )
	{
		start = end + 1;
		end = source.indexOf( '.', start );
		if ( end < 0 )
			end = 10000;
		klass = klass[ source.substring( start, end ) ];
		if ( typeof klass == 'undefined' )
			return null;
	};
	return klass;
};


// Abstract FriendNetwork
// TODO: Remove keys / sessions on quit!
FriendNetwork =
{
	isReady: function( callback, extra )
	{
    	var message =
		{
			type:   'friendnet',
			method: 'isReady',
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	list: function( callback, extra )
    {
    	var message =
		{
			type:   'friendnet',
			method: 'list',
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	subscribeToHostListUpdates: function( callback, extra )
    {
    	var message =
		{
			type:   'friendnet',
			method: 'subscribeToHostListUpdates',
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	unsubscribeFromHostListUpdates: function( identifier, callback, extra )
    {
    	var message =
		{
			type:   'friendnet',
			method: 'unsubscribeFromHostListUpdates',
			identifier: identifier,
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	subscribeToHostUpdates: function( callback, extra )
    {
    	var message =
		{
			type:   'friendnet',
			method: 'subscribeToHostUpdates',
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	unsubscribeFromHostListUpdates: function( key, callback, extra )
    {
    	var message =
		{
			type:   'friendnet',
			method: 'unsubscribeFromHostUpdates',
			key: key,
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	connect: function( url, hostType, flags, callback, extra )
    {
		var message =
		{
			type: 'friendnet',
			method: 'connect',
			url: url,
			hostType: hostType,
			flags: flags,
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addPermanentCallback( callback );
		Application.sendMessage( message );
	},
	sendFile: function( key, file, infos, callback, extra )
    {
		var message =
		{
			type: 'friendnet',
			method: 'sendFile',
			key: key,
			file: file,
			infos: infos,
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	disconnect: function ( key, callback, extra )
	{
		var message =
		{
			type: 'friendnet',
			method: 'disconnect',
			key: key,
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	disconnectByName: function ( hostName, callback, extra )
	{
		var message =
		{
			type: 'friendnet',
			method: 'disconnectByName',
			hostName: hostName,
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	host: function( name, type, applicationName, password, description, data, callback, extra )
    {
    	var message =
		{
			type: 'friendnet',
			method: 'host',
			name: name,
			connectionType: type, 
			applicationName: applicationName,
			description: description,
			password: password,
			data: data,
			extra: extra ? extra : false
		};
    	if ( callback )
			message.callback = addPermanentCallback( callback );
		Application.sendMessage( message );
	},
	dispose: function( key, callback, extra )
    {
		var message =
		{
			type: 'friendnet',
			method: 'dispose',
			key: key,
			extra: extra ? extra : false
		};
	 	if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	sendCredentials: function( key, password, encrypted, callback, extra )
	{
		var message =
		{
			type: 'friendnet',
			method: 'sendCredentials',
			key: key,
			password: password,
			encrypted: encrypted,
			extra: extra ? extra : false
		};
	 	if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	setHostPassword: function( key, password, callback, extra )
	{
		var message =
		{
			type: 'friendnet',
			method: 'setHostPassword',
			key: key,
			password: password,
			extra: extra ? extra : false
		};
	 	if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	send: function( key, data, callback, extra )
    {
		var message =
		{
			type: 'friendnet',
			method: 'send',
			key: key,
			data: data,
			extra: extra ? extra : false
		};
	 	if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
    },
	updateHostPassword: function( key, password, callback, extra )
    {
		var message =
		{
			type: 'friendnet',
			method: 'updateHostPassword',
			key: key,
			password: password,
			extra: extra ? extra : false
		};
	 	if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
    },
	closeSession: function( key, callback, extra )
    {
		var message =
		{
			type: 'friendnet',
			method: 'closeSession',
			key: key,
			extra: extra ? extra : false
		};
	 	if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
    },
	closeApplication: function()
  	{
		Application.sendMessage( {
			type: 'friendnet',
			method: 'closeApplication'
		} );
  	},
	status: function( callback, extra )
	{
		var message =
		{
			type: 'friendnet',
			method: 'status',
			extra: extra ? extra : false
		};
	 	if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	getUserInformation: function( callback, extra )
	{
		var message =
		{
			type: 'friendnet',
			method: 'getUserInformation',
			extra: extra ? extra : false
		};
	 	if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	receiveMessage: function( dataPacket )
	{
        if( dataPacket.viewId && Application.windows && Application.windows[ dataPacket.viewId ] )
            Application.windows[ dataPacket.viewId ].sendMessage( dataPacket );
        else
            Application.receiveMessage( dataPacket );
		if( dataPacket.callback )
		{
			console.log( 'FriendNetwork callback execute: ' + dataPacket.callback );
			var f = extractCallback( dataPacket.callback );
			if ( f )
				f( dataPacket );
		}
	},
	listToConsole: function( callback, extra )
	{
		var message =
		{
			type: 'friendnet',
			method: 'listToConsole',
			extra: extra ? extra : false
		};
	 	if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	}
};
FriendNetworkDrive =
{
	activate: function( activate, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkShare',
			method: 'activate',
			activate: activate,
			extra: extra ? extra : false
		};
		Application.sendMessage( message );
	},
	changeFriendNetworkSettings: function( settings, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkDrive',
			method: 'changeFriendNetworkSettings',
			settings: settings,
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	}
};

FriendNetworkShare =
{
	activate: function( activate, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkShare',
			method: 'activate',
			activate: activate,
			extra: extra ? extra : false
		};
		Application.sendMessage( message );
	},
	changeWorkgroupPassword: function( password, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkShare',
			method: 'changeWorkgroupPassword',
			password: password,
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	changeFriendNetworkSettings: function( settings, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkShare',
			method: 'changeFriendNetworkSettings',
			settings: settings,
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	relocateHTML: function( html, sourceDrive, linkReplacement, linkFunction, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkShare',
			method: 'relocateHTML',
			html: html,
			sourceDrive: sourceDrive,
			linkReplacement: linkReplacement,
			linkFunction: linkFunction,
			callback: addCallback( callback ),
			extra: extra ? extra : false
		};
		Application.sendMessage( message );
	},
};
FriendNetworkFriends =
{
	listCommunities: function( url, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkFriends',
			method: 'listCommunities',
			url: url,
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	changeFriendNetworkSettings: function( settings, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkFriends',
			method: 'changeFriendNetworkSettings',
			settings: settings,
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	getUniqueDeviceIdentifier: function( callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkFriends',
			method: 'getUniqueDeviceIdentifier',
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	getDeviceInformation: function( flags, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkFriends',
			method: 'getDeviceInformation',
			flags: flags,
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	}
};
FriendNetworkDoor =
{
	activate: function( activate, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkDoor',
			method: 'activate',
			activate: activate,
			extra: extra ? extra : false
		};
		Application.sendMessage( message );
	},
	relocateHTML: function( html, sourceDrive, linkReplacement, linkFunction, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkDoor',
			method: 'relocateHTML',
			html: html,
			sourceDrive: sourceDrive,
			linkReplacement: linkReplacement,
			linkFunction: linkFunction,
			callback: addCallback( callback ),
			extra: extra ? extra : false
		};
		Application.sendMessage( message );
	},
	shareDoor: function( door, parameters, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkDoor',
			method: 'shareDoor',
			door: door,
			parameters: parameters,
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	closeSharedDoor: function( hostName, shareName, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkDoor',
			method: 'shareDoor',
			hostName: hostName,
			shareName: shareName,
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	connectToDoor: function( hostName, appName, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkDoor',
			method: 'connectToDoor',
			hostName: hostName,
			appName: appName,
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	disconnectFromDoor: function( hostName, appName, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkDoor',
			method: 'disconnectFromDoor',
			hostName: hostName,
			appName: appName,
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	changeFriendNetworkSettings: function( settings, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkDoor',
			method: 'changeFriendNetworkSettings',
			settings: settings,
			extra: extra ? extra : false
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	}
};
FriendNetworkApps =
{
	registerApplication: function( appInformation, userInformation, password, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkApps',
			method: 'registerApplication',
			appInformation: appInformation,
			userInformation: userInformation,
			password: password,
			extra: extra
		};
		if ( callback )
			message.callback = addPermanentCallback( callback );
		Application.sendMessage( message );
	},
	closeApplication: function( appIdentifier, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkApps',
			method: 'closeApplication',
			appIdentifier: appIdentifier,
			extra: extra
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	closeConnections: function( appIdentifier, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkApps',
			method: 'closeConnections',
			appIdentifier: appIdentifier,
			extra: extra
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	closeRunningConnections: function( appIdentifier, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkApps',
			method: 'closeRunningConnections',
			appIdentifier: appIdentifier,
			extra: extra
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	openHost: function( appIdentifier, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkApps',
			method: 'openHost',
			appIdentifier: appIdentifier
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	closeHost: function( appIdentifier, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkApps',
			method: 'closeHost',
			appIdentifier: appIdentifier
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	connectToUser: function( appIdentifier, nameHost, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkApps',
			method: 'connectToUser',
			appIdentifier: appIdentifier,
			nameHost: nameHost,
			extra: extra
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	getHosts: function( appIdentifier, filters, registerToUpdates, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkApps',
			method: 'getHosts',
			appIdentifier: appIdentifier,
			filters: filters,
			registerToUpdates: registerToUpdates,
			extra: extra
		};
		if ( callback )
		{
			if ( registerToUpdates )
				message.callback = addPermanentCallback( callback );
			else
				message.callback = addCallback( callback );
		}
		Application.sendMessage( message );
	},
	closeUser: function( appIdentifier, playerIdentifier, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkApps',
			method: 'closeUser',
			appIdentifier: appIdentifier,
			playerIdentifier: playerIdentifier,
			extra: extra
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	establishConnections: function( appIdentifier, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkApps',
			method: 'establishConnections',
			appIdentifier: appIdentifier,
			extra: extra
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	sendMessageToAll: function( appIdentifier, userIdentifier, message, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkApps',
			method: 'sendMessageToAll',
			appIdentifier: appIdentifier,
			userIdentifier: userIdentifier,
			message: message,
			extra: extra
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	startApplication: function( appIdentifier, callback, extra )
	{
    	var message =
		{
			type:   'friendNetworkApps',
			method: 'startApplication',
			appIdentifier: appIdentifier,
			extra: extra
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	}
};

// Abstract dormant ------------------------------------------------------------
// TODO: All these methods should trigger callbacks
DormantMaster = {
	doors: [],
	// Adds a doormant appdoor
	addAppDoor: function( dormantDoorObject )
	{
		var uniqueId = generateUniqueId( this.doors );
		this.doors[ uniqueId ] = dormantDoorObject;
		dormantDoorObject.uniqueId = uniqueId;
		Application.sendMessage( {
			type:     'dormantmaster',
			method:   'addAppDoor',
			title:    dormantDoorObject.title,
			doorId:  uniqueId
		} );
	},
	setupProxyDoor: function( info )
	{
		// Make sure we can get this folder
		info.Dormant = new Object();
		info.Dormant.getDirectory = function( path, callback )
		{
			var cid = addCallback( callback );

			console.log( 'Api.js - proxydoor - asking for folders.' );

			Application.sendMessage( {
				type: 'dormantmaster',
				method: 'getDirectory',
				callbackId: cid,
				path: path
			} );
		}
	},
	// Get a list of all doors
	getDoors: function( callback )
	{
		var t = this;
		var fid = addCallback( function( msg ){
			for( var a in msg )
				t.setupProxyDoor( msg[a] );
			if( callback )
				callback( msg );
		} );
		Application.sendMessage( {
			type:     'dormantmaster',
			method:   'getDoors',
			callbackId: fid
		} );
		return false;
	},
	// Delete an appdoor
	delAppDoor: function( door )
	{
		if( !door.uniqueId ) return;
		Application.sendMessage( {
			type:     'dormantmaster',
			method:   'deleteAppDoor',
			title:    door.title,
			doorId:   door.uniqueId
		} );
	},
	addEvent: function( eventObject )
	{
		var mesg = {};
		for( var a in eventObject ) mesg[a] = eventObject[a];
		mesg.type = 'dormantmaster';
		mesg.method = 'addevent';
		Application.sendMessage( mesg );
	},
	pollEvent: function( eventObject )
	{
		var mesg = {};
		for( var a in eventObject ) mesg[a] = eventObject[a];
		mesg.type = 'dormantmaster';
		mesg.method = 'pollevent';
		Application.sendMessage( mesg );
	},
	delApplicationEvents: function( appname )
	{
		var mesg = { applicationName: appname };
		mesg.type = 'dormantmaster';
		mesg.method = 'delappevents';
		Application.sendMessage( mesg );
	},
	createDrive: function( options, callback, extra )
	{
    	var message =
		{
			type:   'dormantmaster',
			method: 'createDrive',
			options: options,
			extra: typeof extra != 'undefined' ? extra : false
		};
		if ( callback )
			message.callbackId = addCallback( callback );
		Application.sendMessage( message );
	},
	destroyDrive: function( driveId, options, callback, extra )
	{
    	var message =
		{
			type:   'dormantmaster',
			method: 'destroyDrive',
			driveId: driveId,
			options: options,
			extra: typeof extra != 'undefined' ? extra : false
		};
		if ( callback )
			message.callbackId = addCallback( callback );
		Application.sendMessage( message );
	}
};

// ApplicationStorage ----------------------------------------------------------

ApplicationStorage = {

	//public

	set : function( id, data, callback )
	{
		var bundle = {
			id : id,
			data : data,
		};
		var msg = {
			method : 'set',
			data : bundle,
		};
		ApplicationStorage.send( msg, callback );
	},

	get : function( id, callback )
	{
		var msg = {
			method : 'get',
			data : {
				id : id,
			},
		};
		ApplicationStorage.send( msg, callback );
	},

	remove : function( id, callback )
	{
		var msg = {
			method : 'remove',
			data : {
				id : id,
			},
		};
		ApplicationStorage.send( msg, callback );
	},

	// private

	send : function( msg, callback )
	{
		console.log( 'api.ApplicationStorage.send', msg );
		if ( callback ) {
			var callbackId = addCallback( callback );
			msg.callbackId = callbackId;
		}

		msg.type = 'applicationstorage';
		Application.sendMessage( msg );
	},
};

// Authenticate ----------------------------------------------------------

Authenticate = {

	//public

	load : function( id, callback )
	{
		var msg = {
			method : 'load',
			data : {
				id : ( id ? id : false )
			}
		};
		Authenticate.send( msg, callback );
	},

	uniqueId : function( item, callback )
	{
		var msg = {
			method : 'uniqueid',
			data : {
				destinationViewId : item.destinationViewId,
				path : item.path,
				username : item.username
			}
		};
		Authenticate.send( msg, callback );
	},

	encryptKey : function( item, callback )
	{
		var msg = {
			method : 'encryptkey',
			data : {
				destinationViewId : item.destinationViewId,
				str : item.data
			}
		};
		Authenticate.send( msg, callback );
	},

	decryptKey : function( item, callback )
	{
		var msg = {
			method : 'decryptkey',
			data : {
				destinationViewId : item.destinationViewId,
				key : item.data
			}
		};
		Authenticate.send( msg, callback );
	},

	encrypt : function( item, callback )
	{
		var msg = {
			method : 'encrypt',
			data : {
				destinationViewId : item.destinationViewId,
				str : item.data
			}
		};
		Authenticate.send( msg, callback );
	},

	decrypt : function( item, callback )
	{
		var msg = {
			method : 'decrypt',
			data : {
				destinationViewId : item.destinationViewId,
				str : item.data
			}
		};
		Authenticate.send( msg, callback );
	},

	// private

	send : function( msg, callback )
	{
		if ( callback ) {
			var callbackId = addCallback( callback );
			msg.callbackId = callbackId;
		}

		msg.type = 'authenticate';

		console.log( 'api.Authenticate.send', msg );

		Application.sendMessage( msg );
	}
};

// PouchDB
( function( ns, undefined )
{
	ns.PouchDB = function( conf, readyCallback )
	{
		var self = this;
		self.dbName = conf.dbName;
		self.replicationTargets = conf.replicationTargets || [];
		self.readyCallback = readyCallback || null;

		self.ready = false;
		self.sendQueue = [];

		self.init();
	}

	// Public

	ns.PouchDB.prototype.create = function( item, callback )
	{
		var self = this;
		console.log( 'PouchDB.create', item );
		var msg = {
			type : 'create',
			data : item,
		};
		self.sendOp( msg, callback );
	}

	ns.PouchDB.prototype.read = function( id, callback )
	{
		var self = this;
		console.log( 'PouchDB.read', id );
		id = id || null;
		var msg = {
			type : 'read',
			data : [ id ]
		};
		self.sendOp( msg, callback );
	}

	// Private

	ns.PouchDB.prototype.init = function()
	{
		var self = this;
		if ( !self.dbName )
			throw new Error( 'PouchDB - no name set for database' );

		var cid = addCallback( onready );
		var options = {
			dbName             : self.dbName,
			replicationTargets : self.replicationTargets,
		};
		var initMsg = {
			type : 'init',
			data   : {
				cid     : cid,
				options : options,
			},
		};
		self.send( initMsg, true );

		function onready( res )
		{
			res = res.data;
			if ( res.success )
				self.setReady();

			if ( self.readyCallback )
				self.readyCallback( res.errorMessage, res.data );
		}
	}

	ns.PouchDB.prototype.setReady = function()
	{
		var self = this;
		self.ready = true;
		if ( self.sendQueue.length )
			self.executeSendQueue();
	}

	ns.PouchDB.prototype.executeSendQueue = function()
	{
		var self = this;
		self.sendQueue.forEach( send );
		self.sendQueue = [];

		function send( msg ) {
			self.send( msg );
		}
	}

	ns.PouchDB.prototype.sendOp = function( msg, callback )
	{
		var self = this;
		var cid = addCallback( opBack );
		var wrap = {
			type : 'crud',
			data : {
				dbName : self.dbName,
				cid    : cid,
				data   : msg,
			},
		};
		self.send( wrap );

		function opBack( e ) {
			console.log( 'opBack', e );
			callback( e.data.err, e.data.res );
		}
	}

	ns.PouchDB.prototype.send = function( msg, force )
	{
		var self = this;
		if ( !self.ready && !force )
		{
			self.sendQueue.push( msg );
			return;
		}

		var wrap = {
			type : 'pouchdb',
			data : msg,
		}
		Application.sendMessage( wrap );
	}

})( window );

// FConn - FriendCore connection ------------------------------------------------

( function( ns, undefined )
{
	ns.FConn = function()
	{
		if( !( this instanceof window.FConn ) )
			return new window.FConn();

		var self = this;
		if ( Friend.conn  ) {
			if (Friend.conn instanceof ns.FConn) {
				return Friend.conn;
			}
		}

		Friend.conn = self;
		self.ready = false;
		self.listeners = {};
		self.sendQueue = [];
		self.init();
	}

	// Public
	ns.FConn.prototype.request = function( msg, callback )
	{
		var self = this;
		if( !callback || !( 'function' === typeof callback ) )
			throw new Error( 'FConn.request - no callback' );

		var cId = addCallback( callWrap );
		var wrap = {
			method : 'request',
			callbackId : cId,
			data : msg,
		};
		self.s( wrap );

		function callWrap( res )
		{
			callback( (res.data ? res.data : res) );
		}
	}

	ns.FConn.prototype.send = function( msg )
	{
		var self = this;
		var wrap = {
			method : 'send',
			data : msg
		};
		self.s( wrap );
	}

	ns.FConn.prototype.on = function( event, handler )
	{
		var self = this;
		if ( self.listeners[ event ]) {
			console.log( { event : event, listeners : self.listeners });
			throw new Error( 'FConn.on - event already registered' );
		}

		self.listeners[ event ] = handler;
	}

	ns.FConn.prototype.off = function( event )
	{
		var self = this;
		if ( self.listeners[ event ])
			delete self.listeners[ event ];
	}

	ns.FConn.prototype.whenReady = function( callback )
	{
		var self = this;
		self.onReadyArr.push( callback );
	}

	ns.FConn.prototype.close = function()
	{
		var self = this;
		var msg = {
			method : 'remove',
		}
		self.s( msg );
		self.listeners = {};
		delete Friend.conn;
	}

	// Private

	ns.FConn.prototype.init = function()
	{
		var self = this;
		var cId = addCallback( fconnReady );
		var initMsg = {
			method : 'register',
			callbackId : cId,
		};
		self.s( initMsg, true );

		function fconnReady( res )
		{
			console.log( 'fconReady', res );
			self.ready = true;
			self.executeSendQueue();
		}
	}

	ns.FConn.prototype.receiveMessage = function( msg )
	{


		var self = this;
		var event = msg.data;
		var handler = self.listeners[ event.type ];
		if( handler )
		{
			handler( event.data );
			return;
		}

		Application.receiveMessage( msg );
	}

	ns.FConn.prototype.executeSendQueue = function()
	{
		var self = this;
		var queue = self.sendQueue;
		self.sendQueue = [];
		queue.forEach( send );
		function send( msg ) {
			self.s( msg );
		}
	}

	ns.FConn.prototype.s = function( msg, force )
	{
		var self = this;
		if ( !force && !self.ready ) {
			self.sendQueue.push( msg );
			return;
		}

		msg.type = 'fconn';
		Application.sendMessage( msg );
	}

})( window );


// Calendar
(function( ns, undefined )
{
	ns.Calendar = function()
	{
		var self = this;
		self.init();
	}

	ns.Calendar.prototype.addEvent = function( data, messageToUser, callback )
	{
		var self = this;
		var event = {
			Date        : data.Date,
			Title       : data.Title,
			Description : data.Description,
			TimeFrom    : data.TimeFrom,
			TimeTo      : data.TimeTo,
		};

		var cid = undefined;
		if ( callback )
			cid = addCallback( callback );

		var wrap = {
			type : 'add',
			data : {
				cid   : cid,
				message : messageToUser,
				event : event,
			},
		};
		self.send( wrap );
	}

	// priv

	ns.Calendar.prototype.init = function()
	{
		var self = this;
	}

	ns.Calendar.prototype.send = function( msg )
	{
		var self = this;
		var wrap = {
			type : 'calendar',
			data : msg,
		}
		Application.sendMessage( wrap );
	}
})( Friend );

// Locale object ---------------------------------------------------------------

Locale = {
	// Get language 'en' or 'no' etc
	getLocale: function( callback )
	{
		var cid = addCallback( callback );
		Application.sendMessage( {
			type: 'system',
			command: 'getlocale',
			callback: cid
		} );
	},
	// Import translations
	importTranslations: function( d )
	{
		// Add translations
		var tr = d.split( "\n" );
		for( var a = 0; a < tr.length; a++ )
		{
			var pair = tr[a].split( ':' );
			var key = Trim( pair[0] );
			if( !key ) continue;
			if( !window.translations[key] )
				window.translations[key] = Trim( pair[1] );
		}
	}
};

// Notifications ---------------------------------------------------------------

function Notify( msg, callback, clickcallback )
{
	var cid = addCallback( callback );
	var ccid = clickcallback ? addCallback( clickcallback ) : false;
	Application.sendMessage( {
		type: 'system',
		command: 'notification',
		title: msg.title,
		text: msg.text,
		callback: cid,
		clickcallback: ccid
	} );
}

// Simplification
function NotifyMessage( title, text, callback, clickcallback )
{
	return Notify( { title: title, text: text }, callback, clickcallback );
}

// Doors object abstraction ----------------------------------------------------

Doors = {
	getScreens: function( callback )
	{
		var cid = addCallback( callback );
		Application.sendMessage( {
			type: 'system',
			command: 'getopenscreens',
			callback: cid
		} );
	}
}

// DOS abstraction : easy commands to manage files -----------------------------
DOS =
{
	getDirectory: function( path, flags, callback, extra )
	{
		var message =
		{
			type: 'dos',
			method: 'getDirectory',
			path: path,
			flags: flags,
			extra: extra ? extra : false				// protection
		};
		if( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	getDisks: function( flags, callback, extra )
	{
		var message = 
		{
			type: 'dos',
			method: 'getDisks',
			flags: flags,
			extra: extra ? extra : false
		};
		if( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	executeJSX: function( path, args, callback, extra )
	{
		var message =
		{
			type: 'dos',
			method: 'executeJSX',
			path: path,
			args: args,
			extra: extra ? extra : false				// protection
		};
		message.callback = addCallback( callback );

		// If we are injecting in an iframe - use app.html to load up an empty workspace instance
		if( extra && extra.iframe )
		{
			extra.iframe.src = '/webclient/app.html?authid=' + Application.authId;
			extra.iframe.onload = function()
			{
				var i = extra.iframe;
				delete message.extra.iframe;
				message.viewId = null;
				message.applicationId = null;
				i.contentWindow.postMessage( JSON.stringify( message ), '*' );
			}
			return;
		}
		Application.sendMessage( message );
	},
	loadHTML: function( path, callback, extra )
	{
		var message =
		{
			type: 'dos',
			method: 'loadHTML',
			path: path,
			extra: extra ? extra : false				// protection
		};
		message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	fileExist: function( path, callback, extra )
	{
		var message =
		{
			type: 'dos',
			method: 'fileAccess',
			path: path,
			extra: extra ? extra : false				// protection
		};
		message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	getAccess: function( path, callback, extra )
	{
		fileExist( path, callback, extra );
	},
	getDriveInfo: function( path, callback, extra )
	{
		var message =
		{
			type: 'dos',
			method: 'getDriveInfo',
			path: path,
			extra: extra ? extra : false
		};
		message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	getFileInfo: function( path, callback, extra )
	{
		var message =
		{
			type: 'dos',
			method: 'getFileInfo',
			path: path,
			extra: extra ? extra : false
		};
		message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	openWindowByFilename: function( fileInfo, ext )
	{
		var message =
		{
			type: 'dos', 
			method: 'openWindowByFilename', 
			args: { fileInfo: fileInfo, ext: ext } 
		};
		Application.sendMessage( message );
	}
};
Friend.DOS = DOS;

// Door abstraction ------------------------------------------------------------

function Door( path )
{
	this.path = path;
	this.handler = 'void';
	var door = this;
	this.initialized = false;
	// Initialize door object
	this.init = function()
	{
		// Init a real door object and run callback function
		Application.sendMessage(
			{
				type:    'door',
				method:  'init',
				path:    path,
				handler: this.handler
			},
			function( data )
			{
				if( data.handler && data.handler != 'void' )
				{
					door.initialized = true;
					door.handler = data.handler;
					if( door.onInit )
						door.onInit( data );
				}
			}
		);
	}
	this.init();
	
	// Re-set path
	this.setPath = function( path )
	{
		Application.sendMessage( 
			{
				type: 'door',
				method: 'init',
				path: path,
				handler: this.handler
			},
			function( data )
			{
				if( data.handler && data.handler != 'void' )
				{
					door.initialized = true;
					door.handler = data.handler;
				}
			}
		);
	}
	
	// Gets the files and subdirectories inside of a directory
	this.getDirectory = function( callback )
	{
		return this.getIcons( callback );
	}
	
	// Get files on current dir
	// Deprecated
	this.getIcons = function( callback )
	{
		Application.sendMessage(
			{
				type:   'door',
				method: 'geticons',
				path: this.path,
				handler: this.handler
			},
			function( data )
			{
				if( callback )
				{
					var objects = JSON.parse( data.data );
					if( typeof( objects ) == 'object' )
					{
						var o = [];
						for( var a in objects )
							o.push( objects[a] );
						callback( o );
					}
					else if( objects )
					{
						callback( objects );
					}
					else callback( false );
				}
			}
		);
	}
}

// Print dialogs ---------------------------------------------------------------

function Printdialog( flags, triggerfunction )
{
	var cid = triggerfunction ? addCallback( triggerfunction ) : false;
	
	if( flags && flags.triggerFunction )
	{
		cid = addCallback( flags.triggerFunction );
		flags.triggerFunction = null;
	}
	
	Application.sendMessage( {
		type:               'system',
		command:            'printdialog',
		callbackId:         cid,
		flags:              flags
	} );
}

// File dialogs ----------------------------------------------------------------

function Filedialog( object, triggerFunction, path, type, filename, title )
{
	var mainview = false;
	var targetview = false;
	var suffix = false;
	var multiSelect = true; // Select multiple files
	var keyboardNavigation = false;
	var rememberPath = false;
	
	// We have a view
	if( object && object.getViewId )
	{
		mainview = object;
	}
	// We have flags
	if( object )
	{
		for( var a in object )
		{
			switch( a )
			{
				case 'triggerFunction':
					triggerFunction = object[a];
					break;
				case 'multiSelect':
					multiSelect = object[a];
					break;
				case 'path':
					path = object[a];
					break;
				case 'type':
					type = object[a];
					break;
				case 'filename':
					filename = object[a];
					break;
				case 'title':
					title = object[a];
					break;
				case 'mainView':
					mainview = object[a];
					break;
				case 'targetView':
					targetview = object[a];
					break;
				case 'suffix':
					suffix = object[a];
					break;
				case 'keyboardNavigation':
					keyboardNavigation = object[a];
					break;
				case 'rememberPath':
					rememberPath = object[a];
					break;
			}
		}
	}

	if ( !triggerFunction ) return;
	
	if ( !type ) type = 'open';

	var dialog = this;

	var cid = addCallback( triggerFunction );

	if( typeof( mainview ) != 'string' )
	{
		mainview = mainview.getViewId ? mainview.getViewId() : ( Application.viewId ? Application.viewId : false );
	}
	if( typeof( targetview ) != 'string' )
	{
		targetview = targetview.getViewId ? targetview.getViewId() : false;
	}
	
	dialog.suffix = suffix;

	Application.sendMessage( {
		type:               'system',
		command:            'filedialog',
		method:             type,
		callbackId:         cid,
		dialogType:         type,
		path:               path,
		filename:           filename,
		multiSelect:        multiSelect,
		title:              title,
		viewId:             mainview,
		targetViewId:       targetview,
		suffix:             suffix,
		rememberPath:       rememberPath,
		keyboardNavigation: keyboardNavigation
	} );
}

// Get a path from fileinfo and return it
function FiledialogPath( fileinfo )
{
	var path = fileinfo.Path ? fileinfo.Path : fileinfo.Title;
	path = path.split( '/' );
	path.pop();
	path = path.join( '/' );
	return path;
}

// Libraries -------------------------------------------------------------------
function Library( libraryName )
{
	this.vars = [];
	var t = this;

	this.addVar = function( varname, data )
	{
		this.vars[varname] = data;
	}

	// Execute the library!
	this.execute = function( func, args )
	{
		var cid = addCallback( this );

		// Execute a library with full path
		if( libraryName.indexOf( ':' ) >= 0 )
		{
			var sesspart = Application.sessionId ? 'sessionid' : 'authid';
			sesspart += '=' + ( Application.sessionId ? Application.sessionId : Application.authId );
			var url = libraryName.split( ':' )[1];
			url = Application.appPath.split( ':' )[0] + ':' + url;

			var query = '/system.library/file/call/?' + sesspart + '&path=' + url;
			var j = new cAjax();
			if( args ) j.addVar( 'args', JSON.stringify( args ) );
			if( func ) j.addVar( 'query', func );
			j.open( 'post', query, true, true )
			j.onload = function( r, data )
			{
				if( t.onExecuted )
				{
					t.onExecuted( r, data );
				}
			}
			j.send();
		}
		else
		{
			Application.sendMessage( {
				type:       'system',
				command:    'librarycall',
				library:    libraryName,
				func:       func,
				args:       args,
				vars:       this.vars,
				callbackId: cid,
				viewId:   Application.viewId ? Application.viewId : false
			} );
		}
	}
}

// Resource functions ----------------------------------------------------------

// Add CSS by data
function AddCSSByData( name, data, callback )
{
	if( !window.cssStyles ) window.cssStyles = [];
	// Clear previous
	if( typeof( window.cssStyles[ name ] ) != 'undefined' )
	{
		// Remove existing and clean up
		var pn = window.cssStyles[ name ].parentNode;
		if( pn ) pn.removeChild( window.cssStyles[ name ] );
		var o = [];
		for( var a in window.cssStyles )
		{
			if( a != name )
			{
				o[a] = window.cssStyles[a];
			}
		}
		window.cssStyles = o;
	}
	// Add and register
	var s = document.createElement( 'style' );
	s.innerHTML = data;
	if( callback ) callback();
	document.body.appendChild( s );
	window.cssStyles[ name ] = s;
}

// Add CSS by url
function AddCSSByUrl( csspath, callback )
{
	if( !window.cssStyles ) window.cssStyles = [];
	if( typeof( window.cssStyles[csspath] ) != 'undefined' )
	{
		// Remove existing and clean up
		var pn = window.cssStyles[csspath].parentNode;
		if( pn ) pn.removeChild( window.cssStyles[csspath] );
		var o = [];
		for( var a in window.cssStyles )
		{
			if( a != csspath )
			{
				o[a] = window.cssStyles[a];
			}
		}
		window.cssStyles = o;
	}
	// Add and register
	var s = document.createElement( 'link' );
	s.rel = 'stylesheet';
	s.href = csspath;
	if( callback ){ s.onload = function() { callback(); } }
	document.body.appendChild( s );
	window.cssStyles[csspath] = s;
}

// Message passing mechanism ---------------------------------------------------

_sendMessage = function(){};
function setupMessageFunction( dataPacket, origin )
{
	// TODO: Resolve correct origin
	origin = '*';
	
	// Initialize the Application callback buffer
	if( typeof( Application.callbacks ) == 'undefined' )
		Application.callbacks = [];

	function _sendMessage( msg, callback )
	{
		// Convert some data formats in a JSON complient structure
		for( var a in msg )
		{
			if( msg[ a ] instanceof ArrayBuffer || toString.call( msg[ a ] ) === '[object ArrayBuffer]' )
			{
				//var v = new Uint8Array( msg[ a ] );
				//msg[ a ] = Array.prototype.join.call( v, ',' );
				//msg[ a + '_format' ] = 'binaryString';
				msg[ a ] = ConvertArrayBufferToString( msg[ a ], 'base64' );
				msg[ a + '_format' ] = 'base64';
			}
		}

		// Set info that determines where the message belongs unless already set
		if( !msg.applicationId )
		{
			msg.applicationId = dataPacket.applicationId;
		}
		if( !msg.authId )
		{
			msg.authId = dataPacket.authId;
		}
		if( !msg.theme )
		{
			msg.theme = dataPacket.theme;
		}
		if( !msg.userId )
		{
			msg.userId = dataPacket.userId;
		}
		if( !msg.username )
		{
			msg.username = dataPacket.username;
		}
		if( !msg.userLevel )
		{
			msg.userLevel = dataPacket.userLevel;
		}
		if( !msg.viewId )
		{
			if( dataPacket.viewId )
				msg.viewId = dataPacket.viewId;
		}
		if( !msg.screenId )
		{
			if( dataPacket.screenId )
				msg.screenId = dataPacket.screenId;
		}
		if( !msg.widgetId )
		{
			if( dataPacket.widgetId )
				msg.widgetId = dataPacket.widgetId;
		}
		if( !msg.parentViewId )
		{
			if( Application.viewId )
				msg.parentViewId = Application.viewId;
		}

		// Support callback function
		if( callback )
		{
			var uid = generateUniqueId( Application.callbacks );
			Application.callbacks[uid] = callback;
			msg.callback = uid;
		}

		// Post the message
		var po = dataPacket.origin ? dataPacket.origin : '*';
		try
		{
			parent.postMessage( JSON.stringify( msg ), origin ? origin : po );
		}
		catch( e )
		{
			console.log( 'Failed to post message to origin: ' + po );
		}
	}
	return _sendMessage;
}

// Open a library --------------------------------------------------------------

// TODO: Make it work!
// TODO: OR REMOVE IT :)
function OpenLibrary( path, id, div )
{
	// Anchor point
	var lib = new Object ();
	lib.loaded = false;

	if( !div && id ) div = ge( id );

	// Load the library and get code back
	var m = new cAjax ();
	m.open ( 'post', path.split( /progdir\:/i ).join( Application.appPath ? Application.appPath : Application.filePath ), true, true );
	m.addVar ( 'fileInfo', JSON.stringify ( { 'Path' : path, 'Mode' : 'raw' } ) );
	m.app = this;
	m.onload = function ()
	{
		// Connect on an iframe
		var ifr = document.createElement ( 'iframe' );
		ifr.setAttribute( 'sandbox', 'allow-same-origin allow-forms allow-scripts' );
		var r = this;
		ifr.src = 'http://' + Application.filePath.split( 'http://' )[1].split( '/' )[0] + '/webclient/sandboxed.html';
		ifr.onload = function ()
		{
			var d = this.document ? this.document.documentElement : this.contentWindow.document;
			d.write ( '<html><head></head><body><script>' + this.responseText() + '</script></body></html>' );

			// Tell that library is loaded
			lib.library = this.document ? this.document : this.contentWindow;
			lib.loaded = true;
			// Run onload function if possible
			if ( typeof ( lib.onLoad ) == 'function' )
			{
				lib.onLoad ();
			}
		}
		// Use master window instead of body
		if ( div )
		{
			div.appendChild ( ifr );
		}
		else if ( this.app.masterView ) this.app.masterView._window.appendChild ( ifr );
		else document.body.appendChild ( ifr );
	}
	m.send ();
	return lib;
}


// For application frames ------------------------------------------------------

function initApplicationFrame( packet, eventOrigin, initcallback )
{
	// TODO: Setup correct origin
	eventOrigin = '*';
	
	if( window.frameInitialized )
	{
		if( initcallback ) initcallback();
		return;
	}

	// Disable debugging now
	if( packet.workspaceMode == 'normal' || packet.workspaceMode == 'gamified' )
		console.log = function(){};
	Application.workspaceMode = packet.workspaceMode ? packet.workspaceMode : 'developer';

	if( packet.userLevel )
	{
		Application.getUserLevel = function(){ return packet.userLevel; };
	}

	// Don't do this twice
	document.body.style.opacity = '0';
	window.frameInitialized = true;
	var pbase = document.getElementsByTagName( 'base' );
	if( pbase && pbase.length )
	{
		Application.baseDir = pbase[0].href;
	}
	else
	{
		var b = document.createElement( 'base' );
		//console.log( packet );
		var test = packet.appPath ? ( '/' + encodeURIComponent( packet.appPath.split( '/' ).join( '|' ) ) + '/' ) : packet.base;
		b.href = !!test ? test : '';
		b.href += ( packet.authId && packet.authId.length ? ( 'aid' + packet.authId ) : ( 'sid' + packet.sessionId ) ) + '/';
		document.getElementsByTagName( 'head' )[0].appendChild( b );
		Application.baseDir = b.href;
	}

	if( !packet.filePath ) packet.filePath = '';

	// Clippy
	if( packet.clipboard ) Friend.clipboard = packet.clipboard;

	// Just so we know which window we belong to
	if( packet.viewId )
		Application.viewId = packet.viewId;

	// Override the theme!
	if( packet.theme )
	{
		Application.theme = Application.theme;
	}

	// Load translations
	function loadLocale( path, callback )
	{
		// We need a path
		if( !path ) return callback();

		var language = 'en';
		if( packet.loadedLocaleFallback ) return;
		if( packet.locale && !packet.localeLoaded )
			language = packet.locale;
		else
			packet.loadedLocaleFallback = true;

		Application.language = language;

		packet.localeLoaded = true;

		var url = path + 'Locale/' + language + '.lang';
		var j = new cAjax();
		j.open( 'get', url, true );
		j.onload = function()
		{
			if( !packet.loadedLocaleFallback && this.responseText().indexOf('<h1>404') > 0 )
			{
				loadLocale(path, callback);
				return;
			}

			var ar = this.responseText().split( "\n" );
			var out = [];
			for( var a = 0; a < ar.length; a++ )
			{
				if( ar[a].split( /\s/ ).join( '' ).length <= 0 )
					continue;
				var d = ar[a].split( ":" );
				var k = Trim( d[0] );
				var v = Trim( d[1] );
				if( k.length && v.length )
					out[k] = v;
			}
			if( window.translations )
			{
				for( var b in out )
				{
					if( !window.translations[b] )
						window.translations[b] = out[b];
				}
			}
			else window.translations = out;

			// Tell, yes we're loaded now!
			callback();
		}
		j.send();
	}
	
	// If we have stored a theme config for the current theme, use its setup
	// TODO: Move to a proper theme parser
	function ApplyThemeConfig( themeData )
	{
		if( !themeData || typeof( themeData ) == 'undefined' ) return;
		
		if( themeData && typeof( themeData ) == 'string' )
		{
			try
			{
				themeData = JSON.parse( themeData );
			}
			catch( e )
			{
				console.log( 'Bad theme data: ', themeData );
				return;
			}
		}
		
		if( Friend.themeStyleElement )
			Friend.themeStyleElement.innerHTML = '';
		else
		{
			Friend.themeStyleElement = document.createElement( 'style' );
			document.getElementsByTagName( 'head' )[0].appendChild( Friend.themeStyleElement );
		}
		
		var shades = [ 'dark', 'charcoal', 'synthwave' ];
		for( var c in shades )
		{
			var uf = shades[c].charAt( 0 ).toUpperCase() + shades[c].substr( 1, shades[c].length - 1 );
			if( themeData[ 'colorSchemeText' ] == shades[c] )
				document.body.classList.add( uf );
			else document.body.classList.remove( uf );
		}
		
		if( themeData[ 'buttonSchemeText' ] == 'windows' )
			document.body.classList.add( 'MSW' );
		else document.body.classList.remove( 'MSW' );
		
		var str = '';
		for( var a in themeData )
		{
			if( !themeData[a] ) continue;
			var v = themeData[a];
			switch( a )
			{
				case 'colorWindowActive':
					str += `
html > body .View.Active > .Title,
html > body .View.Active > .LeftBar,
html > body .View.Active > .RightBar,
html > body .View.Active > .BottomBar
{
	background-color: ${v};
}
`;
					break;
				case 'colorButtonBackground':
					str += `
html > body .Button, html > body button
{
	background-color: ${v};
}
`;
					break;
				case 'colorWindowBackground':
					str += `
html > body, html body .View > .Content
{
	background-color: ${v};
}
`;
					break;
				case 'colorWindowText':
					str += `
html > body, html body .View > .Content, html > body .Tab
{
	color: ${v};
}
`;
					break;
				case 'colorFileToolbarBackground':
					str += `
html > body .View > .DirectoryToolbar
{
	background-color: ${v};
}
`;
					break;
				case 'colorFileToolbarText':
					str += `
html > body .View > .DirectoryToolbar button:before, 
html > body .View > .DirectoryToolbar button:after
{
	color: ${v};
}
`;
					break;
				case 'colorFileIconText':
					str += `
html > body .File a
{
	color: ${v};
}
`;
					break;
				case 'colorScrollBackground':
					str += `
body .View.Active ::-webkit-scrollbar,
body .View.Active.IconWindow ::-webkit-scrollbar-track
{
	background-color: ${v};
}
`;
					break;
				case 'colorScrollButton':
					str += `
html body .View.Active.Scrolling > .Resize,
body .View.Active ::-webkit-scrollbar-thumb,
body .View.Active.IconWindow ::-webkit-scrollbar-thumb
{
	background-color: ${v} !important;
}
`;
					break;
			}
		}
		Friend.themeStyleElement.innerHTML = str;
	};
	Application.applyThemeConfig = ApplyThemeConfig;

	// On page load
	function onLoaded()
	{
		checkMobileBrowser();
		
		// We need to wait for all functions to be available
		if( typeof( ge ) == 'undefined' || typeof( Trim ) == 'undefined' || typeof( cAjax ) == 'undefined' )
		{
			return setTimeout( onLoaded, 50 );
		}

		var loadedResources = 0;
		var totalLoadingResources = 0;
		
		// No cached app data
		if( !packet.cachedAppData )
		{
			var tpath = '/themes/friendup12/theme.css';
			if( packet && packet.theme )
			{
				tpath = '/themes/' + packet.theme + '/theme.css';
			}
			if( !document.themeCss )
			{
				totalLoadingResources++;
			
				var s = document.createElement( 'link' );
				document.themeCss = s;
				s.rel = 'stylesheet';
				s.href = tpath.split( '.css' ).join( '_compiled.css' );
				s.onload = function()
				{
					doneLoading();
				}
				document.getElementsByTagName('head')[0].appendChild( s );
			}
		}
		
		// Load advanced theme config
		if( packet.themeData )
		{
			Application.applyThemeConfig( packet.themeData );
		}

		var activat = [];

		// For templates
		if( packet.appPath ) Application.appPath = packet.appPath;

		// Delayed script loading (with src)
		var scripts = document.getElementsByTagName( 'friendscript' );
		if( scripts.length )
		{
			var removes = [];
			for( var a = 0; a < scripts.length; a++ )
			{
				var src = scripts[a].getAttribute( 'src' )
				if( src )
				{
					
					totalLoadingResources++;
					var d = document.createElement( 'script' );
					d.src = src;
					d.async = false;
					d.onload = doneLoading;
					document.body.appendChild( d );
					wait = true;
					removes.push( scripts[a] );

				}
			}
			// Clear friendscripts
			for( var a = 0; a < removes.length; a++ )
			{
				removes[a].parentNode.removeChild( removes[a] );
			}
			removes = null;
		}

		// TODO: Take language var from config
		if( packet && packet.filePath )
		{
			// Load translations and run locale
			totalLoadingResources++;
			loadLocale( packet.filePath, function()
			{
				// Set config
				if( packet.spokenLanguage )
					globalConfig.language = packet.spokenLanguage;
				if( packet.spokenAlternate )
					globalConfig.alternateLanguage = packet.spokenAlternate;
				doneLoading();
			} );
		}
		else
		{
			// Just do the done loading thing
			waitToStart();
		}

		// Tell we're registered
		Application.sendMessage( {
			type:            'notify',
			data:            'registered',
			registerCallback: packet.registerCallback,
			viewId:         packet.viewId
		} );

		// TODO: Figure out what this is..
		window.sendEventToParent = function( e )
		{
			if( window.parent && window.parent.window )
			{
				ne = new e.constructor( e.type, e);
				try
				{
					window.parent.window.dispatchEvent( ne );
				}
				catch( e )
				{
					console.log( 'Could not dispatch event.' );
				}
			}
		}

		window.addEventListener( 'touchstart', sendEventToParent);
		window.addEventListener( 'touchmove', sendEventToParent );
		window.addEventListener( 'touchend', sendEventToParent );

		window.loaded = true;
		
		// What to do when we are done loading.. -------------------------------
		
		// Async is a bitch!
		function waitToStart()
		{
			var scripts = document.getElementsByTagName( 'friendscript' );
			if( scripts.length )
			{
				var removes = [];
				for( var a = 0; a < scripts.length; a++ )
				{
					var src = scripts[a].getAttribute( 'src' )
					if( !src )
					{
						activat.push( scripts[a].textContent );
					}
					removes.push( scripts[a] );
				}

				// Clear friendscripts
				for( var a = 0; a < removes.length; a++ )
				{
					removes[a].parentNode.removeChild( removes[a] );
				}
				removes = null;
			}
		
			// Check if we can start application
			if( !window.applicationStarted )
			{
				// If we can run, then run!
				if( Application.run && !window.applicationStarted )
				{
					if( !Application.applicationId )
					{
						runNow();
						return;
					}
					// Fetch application permissions
					if( !Application.checkAppPermission )
					{
						var n = Application.applicationId ? Application.applicationId.split( '-' )[0] : false; // TODO: app must have applicationName
						if( !n ) n = Application.applicationName ? Application.applicationName : 'Unnamed';
						
						var m = new Module( 'system' );
						m.onExecuted = function( e, d )
						{
							var permissions = {};
							
							Application.checkAppPermission = function( key, callback )
							{
								// Admins always can!
								if( Application.getUserLevel() == 'admin' )
								{
									if( callback )
									{
										callback( true );
									}
									return true;
								}
								
								if( key && !callback )
								{
									if( permissions[ key ] )
									{
										return permissions[ key ];
									}
									return false;
								}
								else
								{
									var nn = Application.applicationId.split( '-' )[0]; // TODO: app must have applicationName
									
									var mm = new Module( 'system' );
									mm.onExecuted = function( ee, dd )
									{
										if( ee == 'ok' )
										{
											try
											{
												permissions = JSON.parse( dd );
											}
											catch( e ) {  }
										}
										
										if( callback )
										{
											if( permissions[ key ] )
											{
												return callback( permissions[ key ] );
											}
											return callback( false );
										}
									}
									mm.execute( 'getapppermissions', { applicationName: ( Application.applicationName ? Application.applicationName : nn ) } );
								}
							};
							
							if( e == 'ok' )
							{
								try
								{
									permissions = JSON.parse( d );
								}
								catch( e ) {  }
							}
							
							runNow();
						}
						m.execute( 'getapppermissions', { applicationName: ( Application.applicationName ? Application.applicationName : n ) } );
					}
					else
					{
						runNow();
					}
				}
				// Check for scripts and run them
				else if( loadedResources == totalLoadingResources && !window.applicationStarted )
				{
					runNow();
				}
				else
				{
					//console.log( 'What' );
				}
				
				function runNow()
				{
					if( window.applicationStarted ) return;
					window.applicationStarted = true;
					if( packet.state ) Application.sessionStateSet( packet.state );
					for( var a = 0; a < activat.length; a++ )
						ExecuteScript( activat[a] );
					activat = [];
					if( Application.run )
					{
						Application.run( packet );
					}
					window.loaded = true;
					// Use the application doneLoading function (different)
					Friend.application.doneLoading();
				}
			}
		}
		
		// When we are done loading (check loading vs total)
		function doneLoading( e )
		{
			loadedResources++;

			// Loading complete
			if( loadedResources == totalLoadingResources )
			{
				waitToStart();
			}
		}
		
		// Done with this ------------------------------------------------------
	}

	// Setup application id from message
	Application.applicationId = packet.applicationId;
	Application.userId        = packet.userId;
	Application.username      = packet.username;
	Application.workspaceMode = packet.workspaceMode;
	Application.authId        = packet.authId;
	Application.sessionId     = packet.sessionId != undefined ? packet.sessionId : false;
	Application.theme         = packet.theme;
	Application.origin        = eventOrigin;

	// Autogenerate this
	Application.sendMessage   = setupMessageFunction( packet, eventOrigin ? eventOrigin : packet.origin );
	
	// Make sure we don't show gui until the scrollbars have changed
	// The scrollbars takes some milliseconds to load and init..
	// TODO: Figure out why we can't load scrollbars immediately
	var head = document.getElementsByTagName( 'head' )[0];

	var js = [
		'js/oo.js',
		'js/api/friendappapi.js',
		'js/utils/engine.js',
		'js/utils/tool.js',
		'js/utils/json.js',
		'js/io/cajax.js',
		'js/io/appConnection.js',
		'js/io/coreSocket.js',
		'js/gui/treeview.js'
	];
	
	var elez = [];
	for ( var a = 0; a < js.length; a++ )
	{
		// Set src with some rules whether it's an app or a Workspace component
		elez.push( js[ a ] );
	}
	
	// No cached data
	if( !packet.cachedAppData )
	{
		if( packet && packet.theme )
			AddCSSByUrl( '/themes/' + packet.theme + '/scrollbars.css' );
		else AddCSSByUrl( '/themes/friendup12/scrollbars.css' );
		
		// Only in specific circumstances ------------------------------------------
		if( Application.sessionId )
		{
			Application.sendMessage( {
				type: 'file',
				command: 'getapidefaultscripts',
				data: '/webclient/' + elez.join( ';webclient/' ),
				callback: addCallback( function( msg )
				{
					window.eval( msg.data ? msg.data : msg );
					//eval( msg.data );
					if( typeof( Workspace ) == 'undefined' )
					{
						if( typeof( InitWindowEvents ) != 'undefined' ) InitWindowEvents();
						if( typeof( InitGuibaseEvents ) != 'undefined' ) InitGuibaseEvents();
					}
					onLoaded();
				} )
			} );
		}
		// Slow way for new session
		else
		{
			var js = [
				[
					'js/oo.js',
					'js/api/friendappapi.js',
					'js/utils/engine.js',
					'js/utils/tool.js',
					'js/utils/json.js',
					'js/io/cajax.js',
					'js/io/appConnection.js',
					'js/io/coreSocket.js',
					'js/gui/treeview.js'
				]
			];

			var elez = [];
			for ( var a = 0; a < js.length; a++ )
			{
				var s = document.createElement( 'script' );
				// Set src with some rules whether it's an app or a Workspace component
				var path = js[ a ].join( ';/webclient/' );
				s.src = '/webclient/' + path;
				s.async = false;
				elez.push( s );

				// When last javascript loads, parse css, setup translations and say:
				// We are now registered..
				if( a == js.length-1 )
				{
					function fl()
					{
						if( this ) this.isLoaded = true;
						var allLoaded = true;
						for( var b = 0; b < elez.length; b++ )
						{
							if( !elez[b].isLoaded ) allLoaded = false;
						}
						if( allLoaded )
						{
							if( typeof( Workspace ) == 'undefined' )
							{
								if( typeof( InitWindowEvents ) != 'undefined' ) InitWindowEvents();
								if( typeof( InitGuibaseEvents ) != 'undefined' ) InitGuibaseEvents();
							}
							onLoaded();
						}
						else
						{
							setTimeout( fl, 50 );
						}
					}
					s.onload = fl;
				}
				else
				{
					s.onload = function()
					{
						this.isLoaded = true;
					}
				}
				head.appendChild( s );
			}
		}
	}
	// Used cached data
	else if( packet.cachedAppData )
	{	
		var style = document.createElement( 'style' );
		style.innerHTML = packet.cachedAppData.css;
		head.appendChild( style );
		
		var js = document.createElement( 'script' );
		js.innerHTML = packet.cachedAppData.js;
		head.appendChild( js );
		
		// We are loaded
		onLoaded();
	}
}

// Register clicks as default:
// TODO: Make configurable (click to focus behavious)
function clickToActivate()
{
	if( Application && Application.sendMessage )
	{
		Application.sendMessage( {
			type:     'view',
			method:   'activate'
		} );
		Application.sendMessage( {
			type:     'screen',
			method:   'activate'
		} );
		// Add class
		document.body.classList.add( 'activated' );
	}
}

// Just add a slider for an input field
Friend.currentSliderElement = false;
function CreateSlider( inputField, flags )
{
	var self = this;
	
	if( typeof( inputField ) == 'string' )
		inputField = ge( inputField );
	if( !inputField ) return;
	
	var d = document.createElement( 'div' );
	d.className = 'SliderElement';
	if( flags && flags.vertical )
		d.className += ' SliderVertical';
	var g = document.createElement( 'div' );
	g.className = 'SliderGroove';
	var b = document.createElement( 'div' );
	b.className = 'SliderButton';
	g.appendChild( b );
	d.appendChild( g );
	
	if( !flags ) flags = {};
	if( !flags.min ) flags.min = 0;
	if( !flags.max ) flags.max = 100;
	
	if( inputField.getAttribute( 'min' ) )
		flags.min = parseInt( inputField.getAttribute( 'min' ) );
	
	if( inputField.getAttribute( 'max' ) )
		flags.max = parseInt( inputField.getAttribute( 'max' ) );
	
	// Add the slider
	inputField.parentNode.appendChild( d );
	
	var def = inputField.value ? parseInt( inputField.value ) : 0;
	
	if( def > flags.max ) def = flags.max;
	if( def < flags.min ) def = flags.min;
	
	// To set value
	function setSliderValue( val )
	{
		if( val < flags.min ) val = flags.min;
		if( val > flags.max ) val = flags.max;
		
		inputField.value = val;
		 
		if( !flags || !flags.vertical )
		{
			b.style.left = Math.floor( ( ( val - flags.min ) / flags.max ) * ( GetElementWidth( g ) - b.offsetWidth ) ) + 'px';
		}
		else
		{
			b.style.top = Math.floor( ( ( val - flags.min ) / flags.max ) * ( GetElementHeight( g ) - b.offsetHeight ) ) + 'px';
		}
		if( inputField.getAttribute( 'onchange' ) )
		{
			var str = inputField.getAttribute( 'onchange' );
			inputField.eval = function( s )
			{
				eval( s );
			}
			inputField.eval( str );
		}
		return val;
	}
	setSliderValue( def );
	
	// Set the slider position!
	function setSliderPosition( val )
	{
		if( !flags || !flags.vertical )
		{
			var x = val;
			if( x < 0 ) x = 0;
			else if( x + b.offsetWidth >= GetElementWidth( g ) )
				x = GetElementWidth( g ) - b.offsetWidth;
			b.style.left = x + 'px';
			inputField.value = Math.floor( ( x / ( GetElementWidth( g ) - b.offsetWidth ) * ( flags.max - flags.min ) ) - flags.min ) + flags.min;
		}
		else
		{
			var y = val;
			if( y < 0 ) y = 0;
			if( y + b.offsetHeight > GetElementHeight( g ) )
				y = GetElementHeight( g ) - b.offsetHeight;
			b.style.top = y + 'px';
			inputField.value = Math.floor( ( y / ( GetElementHeight( g ) - b.offsetHeight ) * ( flags.max - flags.min ) ) - flags.min ) + flags.min;
		}
		if( inputField.getAttribute( 'onchange' ) )
		{
			var str = inputField.getAttribute( 'onchange' );
			inputField.eval = function( s )
			{
				eval( s );
			}
			inputField.eval( str );
		}
		// Update display object
		if( flags.displayElementId )
		{
			if( ge( flags.displayElementId ) )
			{
				ge( flags.displayElementId ).value = inputField.value;
			}
		}
	}
	
	// Start setting slider position
	b.onmousedown = function( e )
	{
		this.offsetX = e.clientX - b.offsetLeft;
		this.offsetY = e.clientY - b.offsetTop;
		Friend.mouseMoveFunc = function( f )
		{
			if( !flags || !flags.vertical )
			{
				setSliderPosition( f.clientX - b.offsetX );
			}
			else
			{
				setSliderPosition( f.clientY - b.offsetY );
			}
		}
	}
	if( flags.displayElementId )
	{
		if( ge( flags.displayElementId ) )
		{
			ge( flags.displayElementId ).value = def;
			ge( flags.displayElementId ).onchange = function( e )
			{
				var val = setSliderValue( this.value );
			}
			ge( flags.displayElementId ).onkeyup = function( e )
			{
				var val = setSliderValue( this.value );
			}
		}
	}
}
// End slider

// Initializes tab system on the subsequent divs one level under parent div
function InitTabs ( pdiv )
{
	if( typeof( pdiv ) == 'string' )
		pdiv = ge( pdiv );

	var divs = pdiv.getElementsByTagName ( 'div' );
	var tabs = new Array ();
	var pages = new Array ();
	var active = 0;
	for ( var a = 0; a < divs.length; a++ )
	{
		if ( divs[a].parentNode != pdiv ) continue;
		if ( divs[a].className == 'Tab' )
		{
			tabs.push ( divs[a] );
			divs[a].pdiv = pdiv;
			divs[a].tabs = tabs;
			divs[a].pages = pages;
			divs[a].index = tabs.length - 1;
			divs[a].onclick = function ()
			{
				SetCookie ( 'Tabs'+this.pdiv.id, this.index );
				this.className = 'TabActive';
				var ind;
				for ( var b = 0; b < this.tabs.length; b++ )
				{
					if ( this.tabs[b] != this )
						this.tabs[b].className = 'Tab';
					else ind = b;
				}
				for ( var b = 0; b < this.pages.length; b++ )
				{
					if ( b != ind )
					{
						this.pages[b].className = 'Page';
					}
					else
					{
						this.pages[b].className = 'PageActive';
						if ( navigator.userAgent.indexOf ( 'MSIE' ) > 0 )
						{
							this.pages[b].style.display = 'none';
							var idz = 1;
							if ( !this.pages[b].id )
							{
								var bs = 'page';
								idz++;
								while ( ge ( bs ) )
									bs = [ bs, idz ].join ( '' );
								this.pages[b].id = bs;
							}
							var bid = this.pages[b].id;
							setTimeout ( 'ge(\'' + bid + '\').style.display = \'\'', 50 );
						}
					}
				}
				if ( typeof ( AutoResizeWindow ) != 'undefined' )
				{
					var pdiv = this.pdiv;
					while ( pdiv.className.indexOf ( ' View' ) < 0 && pdiv != document.body )
						pdiv = pdiv.parentNode;
					if ( pdiv != document.body && pdiv.autoResize == true )
						AutoResizeWindow ( pdiv );
				}
			}
			if ( GetCookie ( 'Tabs'+pdiv.id ) == divs[a].index )
			{
				active = divs[a].index;
			}
		}
		else if ( divs[a].className.substr ( 0, 4 ) == 'Page' )
		{
			divs[a].className = 'Page';
			pages.push ( divs[a] );
		}
	}
	tabs[active].onclick();
}

// Speech synthesis ------------------------------------------------------------
// Say command
if( typeof( Say ) == 'undefined' )
{
	function Say( string, language )
	{
		var v = speechSynthesis.getVoices();
		var u = new SpeechSynthesisUtterance( string );
		u.lang = language ? language : globalConfig.language;
		try
		{
			for( var a = 0; a < v.length; a++ )
			{
				if( v[a].name == 'Google US English' && u.lang == 'en-US' )
				{
					u.lang = v[a].lang;
					u.voice = v[a].voiceURI;
					break;
				}
				else if( v[a].name == u.lang )
				{
					u.lang = v[a].lang;
					u.voice = v[a].voiceURI;
					break;
				}
			}
		}
		catch(e) { console.log( 'Could not set voice' ); }

		speechSynthesis.speak( u );
	}
}

// Handle keys in iframes too!
if( !Friend.noevents && ( typeof( _kresponse ) == 'undefined' || !window._keysAdded ) )
{
	function _kfocus( e )
	{
		//console.log( 'Focusing: ', e.target, document.activeElement );
	}

	function _kmousedown( e )
	{
		Application.sendMessage( { type: 'system', command: 'registermousedown', x: e.clientX, y: e.clientY } );
		
		// Check if an input element has focus
		Friend.GUI.checkInputFocus();
	}
	function _kmouseup( e )
	{
		if( Friend.mouseMoveFunc )
			Friend.mouseMoveFunc = null;
		Application.sendMessage( { type: 'system', command: 'registermouseup', x: e.clientX, y: e.clientY } );
		
		// Check if an input element has focus
		setTimeout( function()
		{
			Friend.GUI.checkInputFocus();
		}, 250 );
	}
	
	// Handle keys
	function _kresponse( e )
	{	
		// Check if an input element has focus
		Friend.GUI.checkInputFocus();
		
		// Let's report to Workspace what we're doing - to catch global keyboard shortcuts
		var params = [ 'shiftKey', 'ctrlKey', 'metaKey', 'altKey', 'which', 'keyCode' ];
		if( e.shiftKey || e.ctrlKey || e.metaKey || e.altKey )
		{
			var clone = {}; for( var a in params )
			{
				if( e[params[a]] ) clone[params[a]] = e[params[a]];
			}
			Application.sendMessage( { type: 'system', command: 'keydown', data: clone } );
		}
		
		var win = false;
		for( var a in Application.windows )
		{
			if( Application.windows[a].activated )
			{
				win = Application.windows[a];
				break;
			}
		}

		var k = e.which ? e.which : e.keyCode;

		// Window keys
		if( win && win.handleKeys )
		{
			win.ctrlKey = false;
			win.shiftKey = false;
			if( e.ctrlKey ) win.ctrlKey = true;
			if( e.shiftKey ) win.shiftKey = true;
			var abort = false;
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
			{
				return cancelBubble( e );
			}
		}
		// Some fallbacks
		else
		{
			if( Application.handleKeys )
			{
				if( Application.handleKeys( k, e ) )
					return cancelBubble( e );
			}
			if( e.ctrlKey )
			{
				switch ( k )
				{
					// q for quit
					case 81:
						abort = true;
						Application.quit();
						break;
				}
			}
		}

		if( abort )
		{
			return cancelBubble( e );
		}
	}
	function _kresponseup( e )
	{
		var win = false;
		for( var a in Application.windows )
		{
			if( Application.windows[a].activated )
			{
				win = Application.windows[a];
				break;
			}
		}

		if ( win && ( e.ctrlKey || e.shiftKey ) && typeof ( win.handkeKeys ) )
		{
			if( e.ctrlKey ) win.ctrlKey = false;
			if( e.shiftKey ) win.shiftKey = false;
			if ( e.preventDefault ) e.preventDefault ();
			return cancelBubble ( e );
		}
	}
	if ( window.addEventListener )
	{
		window.addEventListener( 'keydown', _kresponse,   false );
		window.addEventListener( 'keyup',   _kresponseup, false );
		window.addEventListener( 'mousedown', _kmousedown, false );
		window.addEventListener( 'mouseup', _kmouseup, false );
		window.addEventListener( 'focus', _kfocus, false );
	}
	else
	{
		window.attachEvent( 'onkeydown', _kresponse,   false );
		window.attachEvent( 'onkeyup',  _kresponseup, false );
		window.attachEvent( 'onmousedown', _kmousedown, false );
		window.attachEvent( 'onmouseup', _kmouseup, false );
		window.addEventListener( 'focus', _kfocus, false );
	}

	window._keysAdded = true;
}

/* Event handlers ----------------------------------------------------------- */

if( window.addEventListener )
{
	window.addEventListener( 'click', clickToActivate, true );
	window.addEventListener( 'message', receiveEvent, false );
}
else
{
	window.attachEvent( 'onclick', clickToActivate, true );
	window.attachEvent( 'onmessage', receiveEvent, false );
}

// Make sure we can catch relative mouse pointer coordinates
if( typeof( windowMouseX ) == 'undefined' )
{
	// Init on the outside
	windowMouseX = -1;
	windowMouseY = -1;

	if( !Friend.noevents )
	{
		// The actual mouse event
		function mouseEvt( e )
		{
			if( !e ) e = window.event;
			var mx = e.clientX ? e.clientX : e.pageXOffset;
			var my = e.clientY ? e.clientY : e.pageYOffset;
			// We will only allow numbers
			if( typeof( mx ) == 'undefined' ) mx = -1;
			if( typeof( my ) == 'undefined' ) my = -1;

			windowMouseX = mx;
			windowMouseY = my;
			
			if( Friend.mouseMoveFunc )
				Friend.mouseMoveFunc( e );
		}
		if( window.addEventListener )
			window.addEventListener( 'mousemove', mouseEvt, false );
		else window.attachEvent( 'onmousemove', mouseEvt, false );
	}
}

// Confirm view ----------------------------------------------------------------

function Confirm( title, string, callb, confirmOKText, confirmCancelText, thirdButtonText, thirdButtonReturn )
{
	var cb = addCallback( callb );
	var msg = {
		type: 'system',
		command: 'confirm',
		callback: cb,
		title: title,
		string: string
	};
	if( confirmOKText ) msg.confirmok = confirmOKText;
	if( confirmCancelText ) msg.confirmcancel = confirmCancelText;
	if( thirdButtonText ) msg.thirdButtonText = thirdButtonText;
	if( thirdButtonReturn ) msg.thirdButtonReturn = thirdButtonReturn;
	
	Application.sendMessage( msg  );
}

// Alert view ------------------------------------------------------------------

// TODO: callback implemented

function Alert( title, string, callback )
{
	Application.sendMessage( {
		type: 'system',
		command: 'alert',
		title: title,
		string: string
	} );
}

// Contextmenu -----------------------------------------------------------------

function ShowContextMenu( header, menu )
{
	Application.sendMessage( {
		type: 'system',
		header: header,
		command: 'showcontextmenu',
		menu: menu
	} );
}


// Share element events --------------------------------------------------------

/* Object that communicates events to FC and sends them to app by proxy ----- */
function ShareElementEvents( ele, recursive )
{
	if( !ele ) return;
	if( ele.shareId ) return; // Don't share an element twice

	// Window must also register key events (for games, hotkeys)
	if( !window.shared )
	{
		window.shared = true;
		var mod = document.addEventListener ? 'addEventListener' : 'attachEvent';
		var on = mod == 'addEventListener' ? '' : 'on';
		window[mod]( on + 'keydown', function( e )
		{
			var sEvent = {
				uid: uid,
				charCode: e.which ? e.which : e.keyCode
			};
		}, false );
		window[mod]( on + 'keyup', function( e )
		{
			var sEvent = {
				uid: uid,
				charCode: e.which ? e.which : e.keyCode
			};
		}, false );
	}

	// Set a unique element id
	if( !ele.id )
	{
		var id = '';
		do
		{
			id = 'shared_' + ( new Date() ).getTime() + ( Math.random() * 9999 ) + ( Math.random() * 9999 );
		}
		while( ge( id ) );
		ele.id = id;
	}
	ele.shareId = ele.id;

	var events = [
		'mouseup', 'mousedown', 'mousemove', 'mouseleave', 'mouseover',
		'click', 'touchstart', 'touchend', 'keydown', 'keyup', 'keypress'
	];

	var uid = Sha256.hash( ( ( new Date() ).getTime() + ( Math.random() * 999999 ) ) + "" );
	for( var a = 0; a < events.length; a++ )
	{
		var evt = events[a];
		var add = ele.addEventListener ? 'addEventListener' : 'attachEvent';
		var lit = ( ele.addEventListener ? '' : 'on' ) + evt;

		// Create func
		switch( evt )
		{
			case 'click':
			case 'mouseup':
			case 'mousedown':
				ele[add]( lit, function( e )
				{
					var sEvent = {
						uid: uid,
						mousex: e.clientX,
						mousey: e.clientY,
						button: e.button
					};
				}, false );
				break;
			case 'mousemove':
			case 'mouseleave':
				ele[add]( lit, function( e )
				{
					var sEvent = {
						uid: uid,
						mousex: e.clientX,
						mousey: e.clientY
					};
				}, false );
				break;
			case 'keydown':
			case 'keyup':
			case 'keypress':
				ele[add]( lit, function( e )
				{
					var sEvent = {
						uid: uid,
						charCode: e.which ? e.which : e.keyCode
					};
				}, false );
				break;
		}
	}

	// If we want to do this recursively
	if( recursive )
	{
		for( var a = 0; a < ele.childNodes.length; a++ )
		{
			if( ele.childNodes[a].nodeName )
				ShareElementEvents( ele.childNodes[a], recursive );
		}
	}
}

/* Replace Progdir: etc with real paths ------------------------------------- */
Friend.convertFriendPaths = function( string )
{
	if( typeof( string ) != 'string' )
	{
		return string;
	}
	var apath = Application.appPath ? Application.appPath : Application.filePath;
	if( !apath )
	{
		return string;
	}

	// Convert links with double and single quotes
	var m = '';
	while( m = string.match( /href\=\"(^[\/]{0,1}^http\:[^:"]*?)\"/i ) )
		string = string.split( m[0] ).join( 'src="Progdir:' + m[1] + '"' );
	while( m = string.match( /src\=\"([\/]{0,1}^http\:[^:"]*?)\"/i ) )
		string = string.split( m[0] ).join( 'src="Progdir:' + m[1] + '"' );
	while( m = string.match( /href\=\'([\/]{0,1}^http\:[^:']*?)\'/i ) )
		string = string.split( m[0] ).join( "src='Progdir:" + m[1] + "'" );
	while( m = string.match( /src\=\'([\/]{0,1}^http\:[^:']*?)\'/i ) )
		string = string.split( m[0] ).join( "src='Progdir:" + m[1] + "'" );

	var prt = 'authid=' + ( Application.authId ? Application.authId : '' );
	if( Application.sessionId ) prt = 'sessionid=' + Application.sessionId;
	var base = '/system.library/file/read?' + prt + '&mode=rs&path=';
	if( string )
	{
		string = string.split( /progdir\:/i ).join ( base + apath  );
		string = string.split( /libs\:/i ).join ( Application.domain + '/webclient/' );
		string = string.split( /system\:/i ).join ( Application.domain + '/webclient/' );
	}

	return string;
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  SHA-256 implementation in JavaScript                (c) Chris Veness 2002-2014 / MIT Licence  */
/*                                                                                                */
/*  - see http://csrc.nist.gov/groups/ST/toolkit/secure_hashing.html                              */
/*        http://csrc.nist.gov/groups/ST/toolkit/examples.html                                    */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/* jshint node:true *//* global define, escape, unescape */
'use strict';


/**
 * SHA-256 hash function reference implementation.
 *
 * @namespace
 */
var Sha256 = {};


/**
 * Generates SHA-256 hash of string.
 *
 * @param   {string} msg - String to be hashed
 * @returns {string} Hash of msg as hex character string
 */
Sha256.hash = function(msg) {
    // convert string to UTF-8, as SHA only deals with byte-streams
    msg = msg.utf8Encode();

    // constants [§4.2.2]
    var K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2 ];
    // initial hash value [§5.3.1]
    var H = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19 ];

    // PREPROCESSING

    msg += String.fromCharCode(0x80);  // add trailing '1' bit (+ 0's padding) to string [§5.1.1]

    // convert string msg into 512-bit/16-integer blocks arrays of ints [§5.2.1]
    var l = msg.length/4 + 2; // length (in 32-bit integers) of msg + ‘1’ + appended length
    var N = Math.ceil(l/16);  // number of 16-integer-blocks required to hold 'l' ints
    var M = new Array(N);

    for (var i=0; i<N; i++) {
        M[i] = new Array(16);
        for (var j=0; j<16; j++) {  // encode 4 chars per integer, big-endian encoding
            M[i][j] = (msg.charCodeAt(i*64+j*4)<<24) | (msg.charCodeAt(i*64+j*4+1)<<16) |
                      (msg.charCodeAt(i*64+j*4+2)<<8) | (msg.charCodeAt(i*64+j*4+3));
        } // note running off the end of msg is ok 'cos bitwise ops on NaN return 0
    }
    // add length (in bits) into final pair of 32-bit integers (big-endian) [§5.1.1]
    // note: most significant word would be (len-1)*8 >>> 32, but since JS converts
    // bitwise-op args to 32 bits, we need to simulate this by arithmetic operators
    M[N-1][14] = ((msg.length-1)*8) / Math.pow(2, 32); M[N-1][14] = Math.floor(M[N-1][14]);
    M[N-1][15] = ((msg.length-1)*8) & 0xffffffff;


    // HASH COMPUTATION [§6.1.2]

    var W = new Array(64); var a, b, c, d, e, f, g, h;
    for (var i=0; i<N; i++) {

        // 1 - prepare message schedule 'W'
        for (var t=0;  t<16; t++) W[t] = M[i][t];
        for (var t=16; t<64; t++) W[t] = (Sha256.OO1(W[t-2]) + W[t-7] + Sha256.OO0(W[t-15]) + W[t-16]) & 0xffffffff;

        // 2 - initialise working variables a, b, c, d, e, f, g, h with previous hash value
        a = H[0]; b = H[1]; c = H[2]; d = H[3]; e = H[4]; f = H[5]; g = H[6]; h = H[7];

        // 3 - main loop (note 'addition modulo 2^32')
        for (var t=0; t<64; t++) {
            var T1 = h + Sha256.EE1(e) + Sha256.Ch(e, f, g) + K[t] + W[t];
            var T2 =     Sha256.EE0(a) + Sha256.Maj(a, b, c);
            h = g;
            g = f;
            f = e;
            e = (d + T1) & 0xffffffff;
            d = c;
            c = b;
            b = a;
            a = (T1 + T2) & 0xffffffff;
        }
         // 4 - compute the new intermediate hash value (note 'addition modulo 2^32')
        H[0] = (H[0]+a) & 0xffffffff;
        H[1] = (H[1]+b) & 0xffffffff;
        H[2] = (H[2]+c) & 0xffffffff;
        H[3] = (H[3]+d) & 0xffffffff;
        H[4] = (H[4]+e) & 0xffffffff;
        H[5] = (H[5]+f) & 0xffffffff;
        H[6] = (H[6]+g) & 0xffffffff;
        H[7] = (H[7]+h) & 0xffffffff;
    }

    return Sha256.toHexStr(H[0]) + Sha256.toHexStr(H[1]) + Sha256.toHexStr(H[2]) + Sha256.toHexStr(H[3]) +
           Sha256.toHexStr(H[4]) + Sha256.toHexStr(H[5]) + Sha256.toHexStr(H[6]) + Sha256.toHexStr(H[7]);
};


/**
 * Rotates right (circular right shift) value x by n positions [§3.2.4].
 * @private
 */
Sha256.ROTR = function(n, x) {
    return (x >>> n) | (x << (32-n));
};

/**
 * Logical functions [§4.1.2].
 * @private
 */
Sha256.EE0  = function(x) { return Sha256.ROTR(2,  x) ^ Sha256.ROTR(13, x) ^ Sha256.ROTR(22, x); };
Sha256.EE1  = function(x) { return Sha256.ROTR(6,  x) ^ Sha256.ROTR(11, x) ^ Sha256.ROTR(25, x); };
Sha256.OO0  = function(x) { return Sha256.ROTR(7,  x) ^ Sha256.ROTR(18, x) ^ (x>>>3);  };
Sha256.OO1  = function(x) { return Sha256.ROTR(17, x) ^ Sha256.ROTR(19, x) ^ (x>>>10); };
Sha256.Ch  = function(x, y, z) { return (x & y) ^ (~x & z); };
Sha256.Maj = function(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); };


/**
 * Hexadecimal representation of a number.
 * @private
 */
Sha256.toHexStr = function(n) {
    // note can't use toString(16) as it is implementation-dependant,
    // and in IE returns signed numbers when used on full words
    var s="", v;
    for (var i=7; i>=0; i--) { v = (n>>>(i*4)) & 0xf; s += v.toString(16); }
    return s;
};


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

function md5( str )
{
	var xl;
	var rotateLeft = function( lValue, iShiftBits )
	{
		return ( lValue << iShiftBits ) | ( lValue >>> ( 32 - iShiftBits ) );
	};
	var addUnsigned = function( lX, lY )
	{
		var lX4, lY4, lX8, lY8, lResult;
		lX8 = ( lX & 0x80000000 );
		lY8 = ( lY & 0x80000000 );
		lX4 = ( lX & 0x40000000 );
		lY4 = ( lY & 0x40000000 );
		lResult = ( lX & 0x3FFFFFFF ) + ( lY & 0x3FFFFFFF );
		if ( lX4 & lY4 )
		{
			return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
		}
		if ( lX4 | lY4 )
		{
			if ( lResult & 0x40000000 )
			{
				return ( lResult ^ 0xC0000000 ^ lX8 ^ lY8 );
			}
			else
			{
				return ( lResult ^ 0x40000000 ^ lX8 ^ lY8 );
			}
		}
		else
		{
			return ( lResult ^ lX8 ^ lY8 );
		}
	};
	var _F = function( x, y, z )
	{
		return ( x & y ) | ( ( ~x ) & z );
	};
	var _G = function( x, y, z )
	{
		return ( x & z ) | ( y & ( ~z ) );
	};
	var _H = function( x, y, z )
	{
		return ( x ^ y ^ z );
	};
	var _I = function( x, y, z )
	{
		return ( y ^ ( x | ( ~z ) ) );
	};
	var _FF = function( a, b, c, d, x, s, ac )
	{
		a = addUnsigned( a, addUnsigned( addUnsigned( _F( b, c, d ), x ), ac ) );
		return addUnsigned( rotateLeft( a, s ), b );
	};
	var _GG = function( a, b, c, d, x, s, ac )
	{
		a = addUnsigned( a, addUnsigned( addUnsigned( _G( b, c, d ), x ), ac ) );
		return addUnsigned( rotateLeft( a, s ), b );
	};
	var _HH = function( a, b, c, d, x, s, ac )
	{
		a = addUnsigned( a, addUnsigned( addUnsigned( _H( b, c, d ), x ), ac ) );
		return addUnsigned( rotateLeft( a, s ), b );
	};
	var _II = function( a, b, c, d, x, s, ac )
	{
		a = addUnsigned( a, addUnsigned( addUnsigned( _I( b, c, d ), x ), ac ) );
		return addUnsigned( rotateLeft( a, s ), b );
	};
	var convertToWordArray = function( str )
	{
		var lWordCount;
		var lMessageLength = str.length;
		var lNumberOfWords_temp1 = lMessageLength + 8;
		var lNumberOfWords_temp2 = ( lNumberOfWords_temp1 - ( lNumberOfWords_temp1 % 64 ) ) / 64;
		var lNumberOfWords = ( lNumberOfWords_temp2 + 1 ) * 16;
		var lWordArray = new Array( lNumberOfWords - 1 );
		var lBytePosition = 0;
		var lByteCount = 0;
		while ( lByteCount < lMessageLength )
		{
			lWordCount = ( lByteCount - ( lByteCount % 4 ) ) / 4;
			lBytePosition = ( lByteCount % 4 ) * 8;
			lWordArray[lWordCount] = ( lWordArray[lWordCount] | ( str.charCodeAt(lByteCount) << lBytePosition ) );
			lByteCount++;
		}
		lWordCount = ( lByteCount - ( lByteCount % 4 ) ) / 4;
		lBytePosition = ( lByteCount % 4 ) * 8;
		lWordArray[lWordCount] = lWordArray[lWordCount] | ( 0x80 << lBytePosition );
		lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
		lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
		return lWordArray;
	};
	var wordToHex = function( lValue )
	{
		var wordToHexValue = '',
		wordToHexValue_temp = '',
		lByte, lCount;
		for ( lCount = 0; lCount <= 3; lCount++ )
		{
			lByte = ( lValue >>> ( lCount * 8 ) ) & 255;
			wordToHexValue_temp = '0' + lByte.toString(16);
			wordToHexValue = wordToHexValue + wordToHexValue_temp.substr( wordToHexValue_temp.length - 2, 2 );
		}
		return wordToHexValue;
	};
	var x = [],
	k, AA, BB, CC, DD, a, b, c, d, S11 = 7,
	S12 = 12,
	S13 = 17,
	S14 = 22,
	S21 = 5,
	S22 = 9,
	S23 = 14,
	S24 = 20,
	S31 = 4,
	S32 = 11,
	S33 = 16,
	S34 = 23,
	S41 = 6,
	S42 = 10,
	S43 = 15,
	S44 = 21;
	str = Utf8.encode(str);
	x = convertToWordArray(str);
	a = 0x67452301;
	b = 0xEFCDAB89;
	c = 0x98BADCFE;
	d = 0x10325476;
	xl = x.length;
	for ( k = 0; k < xl; k += 16 )
	{
		AA = a;
		BB = b;
		CC = c;
		DD = d;
		a = _FF( a, b, c, d, x[k + 0], S11, 0xD76AA478 );
		d = _FF( d, a, b, c, x[k + 1], S12, 0xE8C7B756 );
		c = _FF( c, d, a, b, x[k + 2], S13, 0x242070DB );
		b = _FF( b, c, d, a, x[k + 3], S14, 0xC1BDCEEE );
		a = _FF( a, b, c, d, x[k + 4], S11, 0xF57C0FAF );
		d = _FF( d, a, b, c, x[k + 5], S12, 0x4787C62A );
		c = _FF( c, d, a, b, x[k + 6], S13, 0xA8304613 );
		b = _FF( b, c, d, a, x[k + 7], S14, 0xFD469501 );
		a = _FF( a, b, c, d, x[k + 8], S11, 0x698098D8 );
		d = _FF( d, a, b, c, x[k + 9], S12, 0x8B44F7AF );
		c = _FF( c, d, a, b, x[k + 10], S13, 0xFFFF5BB1 );
		b = _FF( b, c, d, a, x[k + 11], S14, 0x895CD7BE );
		a = _FF( a, b, c, d, x[k + 12], S11, 0x6B901122 );
		d = _FF( d, a, b, c, x[k + 13], S12, 0xFD987193 );
		c = _FF( c, d, a, b, x[k + 14], S13, 0xA679438E );
		b = _FF( b, c, d, a, x[k + 15], S14, 0x49B40821 );
		a = _GG( a, b, c, d, x[k + 1], S21, 0xF61E2562 );
		d = _GG( d, a, b, c, x[k + 6], S22, 0xC040B340 );
		c = _GG( c, d, a, b, x[k + 11], S23, 0x265E5A51 );
		b = _GG( b, c, d, a, x[k + 0], S24, 0xE9B6C7AA );
		a = _GG( a, b, c, d, x[k + 5], S21, 0xD62F105D );
		d = _GG( d, a, b, c, x[k + 10], S22, 0x2441453 );
		c = _GG( c, d, a, b, x[k + 15], S23, 0xD8A1E681 );
		b = _GG( b, c, d, a, x[k + 4], S24, 0xE7D3FBC8 );
		a = _GG( a, b, c, d, x[k + 9], S21, 0x21E1CDE6 );
		d = _GG( d, a, b, c, x[k + 14], S22, 0xC33707D6 );
		c = _GG( c, d, a, b, x[k + 3], S23, 0xF4D50D87 );
		b = _GG( b, c, d, a, x[k + 8], S24, 0x455A14ED );
		a = _GG( a, b, c, d, x[k + 13], S21, 0xA9E3E905 );
		d = _GG( d, a, b, c, x[k + 2], S22, 0xFCEFA3F8 );
		c = _GG( c, d, a, b, x[k + 7], S23, 0x676F02D9 );
		b = _GG( b, c, d, a, x[k + 12], S24, 0x8D2A4C8A );
		a = _HH( a, b, c, d, x[k + 5], S31, 0xFFFA3942 );
		d = _HH( d, a, b, c, x[k + 8], S32, 0x8771F681 );
		c = _HH( c, d, a, b, x[k + 11], S33, 0x6D9D6122 );
		b = _HH( b, c, d, a, x[k + 14], S34, 0xFDE5380C );
		a = _HH( a, b, c, d, x[k + 1], S31, 0xA4BEEA44 );
		d = _HH( d, a, b, c, x[k + 4], S32, 0x4BDECFA9 );
		c = _HH( c, d, a, b, x[k + 7], S33, 0xF6BB4B60 );
		b = _HH( b, c, d, a, x[k + 10], S34, 0xBEBFBC70 );
		a = _HH( a, b, c, d, x[k + 13], S31, 0x289B7EC6 );
		d = _HH( d, a, b, c, x[k + 0], S32, 0xEAA127FA );
		c = _HH( c, d, a, b, x[k + 3], S33, 0xD4EF3085 );
		b = _HH( b, c, d, a, x[k + 6], S34, 0x4881D05 );
		a = _HH( a, b, c, d, x[k + 9], S31, 0xD9D4D039 );
		d = _HH( d, a, b, c, x[k + 12], S32, 0xE6DB99E5 );
		c = _HH( c, d, a, b, x[k + 15], S33, 0x1FA27CF8 );
		b = _HH( b, c, d, a, x[k + 2], S34, 0xC4AC5665 );
		a = _II( a, b, c, d, x[k + 0], S41, 0xF4292244 );
		d = _II( d, a, b, c, x[k + 7], S42, 0x432AFF97 );
		c = _II( c, d, a, b, x[k + 14], S43, 0xAB9423A7 );
		b = _II( b, c, d, a, x[k + 5], S44, 0xFC93A039 );
		a = _II( a, b, c, d, x[k + 12], S41, 0x655B59C3 );
		d = _II( d, a, b, c, x[k + 3], S42, 0x8F0CCC92 );
		c = _II( c, d, a, b, x[k + 10], S43, 0xFFEFF47D );
		b = _II( b, c, d, a, x[k + 1], S44, 0x85845DD1 );
		a = _II( a, b, c, d, x[k + 8], S41, 0x6FA87E4F );
		d = _II( d, a, b, c, x[k + 15], S42, 0xFE2CE6E0 );
		c = _II( c, d, a, b, x[k + 6], S43, 0xA3014314 );
		b = _II( b, c, d, a, x[k + 13], S44, 0x4E0811A1 );
		a = _II( a, b, c, d, x[k + 4], S41, 0xF7537E82 );
		d = _II( d, a, b, c, x[k + 11], S42, 0xBD3AF235 );
		c = _II( c, d, a, b, x[k + 2], S43, 0x2AD7D2BB );
		b = _II( b, c, d, a, x[k + 9], S44, 0xEB86D391 );
		a = addUnsigned( a, AA );
		b = addUnsigned( b, BB );
		c = addUnsigned( c, CC );
		d = addUnsigned( d, DD );
	}
	var temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
	return temp.toLowerCase();
}

/** Extend String object with method to encode multi-byte string to utf8
 *  - monsur.hossa.in/2012/07/20/utf-8-in-javascript.html */
if (typeof String.prototype.utf8Encode == 'undefined') {
    String.prototype.utf8Encode = function() {
        return unescape( encodeURIComponent( this ) );
    };
}

/** Extend String object with method to decode utf8 string to multi-byte */
if (typeof String.prototype.utf8Decode == 'undefined') {
    String.prototype.utf8Decode = function() {
        try {
            return decodeURIComponent( escape( this ) );
        } catch (e) {
            return this; // invalid UTF-8? return as-is
        }
    };
}

var Utf8 = {};

Utf8.encode = function( argString )
{
    return argString.utf8Encode();
}

Utf8.decode = function( str_data )
{
    return str_data.utf8Decode();
}

function get_html_translation_table( table, quote_style )
{
	// discuss at: http://phpjs.org/functions/get_html_translation_table/
	// original by: Philip Peterson
	// revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// bugfixed by: noname
	// bugfixed by: Alex
	// bugfixed by: Marco
	// bugfixed by: madipta
	// bugfixed by: Brett Zamir (http://brett-zamir.me)
	// bugfixed by: T.Wild
	// improved by: KELAN
	// improved by: Brett Zamir (http://brett-zamir.me)
	// input by: Frank Forte
	// input by: Ratheous
	// note: It has been decided that we're not going to add global
	// note: dependencies to php.js, meaning the constants are not
	// note: real constants, but strings instead. Integers are also supported if someone
	// note: chooses to create the constants themselves.
	// example 1: get_html_translation_table('HTML_SPECIALCHARS');
	// returns 1: {'"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;'}

	var entities = {},
	hash_map = {},
	decimal;
	var constMappingTable = {},
	constMappingQuoteStyle = {};
	var useTable = {},
	useQuoteStyle = {};

	// Translate arguments
	constMappingTable[0] = 'HTML_SPECIALCHARS';
	constMappingTable[1] = 'HTML_ENTITIES';
	constMappingQuoteStyle[0] = 'ENT_NOQUOTES';
	constMappingQuoteStyle[2] = 'ENT_COMPAT';
	constMappingQuoteStyle[3] = 'ENT_QUOTES';

	useTable = !isNaN(table) ? constMappingTable[table] : table ? table.toUpperCase() : 'HTML_SPECIALCHARS';
	useQuoteStyle = !isNaN(quote_style) ? constMappingQuoteStyle[quote_style] : quote_style ? quote_style.toUpperCase() :
	'ENT_COMPAT';

	if ( useTable !== 'HTML_SPECIALCHARS' && useTable !== 'HTML_ENTITIES' )
	{
		throw new Error( 'Table: ' + useTable + ' not supported' );
		// return false;
	}

	entities['38'] = '&amp;';
	if ( useTable === 'HTML_ENTITIES' )
	{
		entities['160'] = '&nbsp;';
		entities['161'] = '&iexcl;';
		entities['162'] = '&cent;';
		entities['163'] = '&pound;';
		entities['164'] = '&curren;';
		entities['165'] = '&yen;';
		entities['166'] = '&brvbar;';
		entities['167'] = '&sect;';
		entities['168'] = '&uml;';
		entities['169'] = '&copy;';
		entities['170'] = '&ordf;';
		entities['171'] = '&laquo;';
		entities['172'] = '&not;';
		entities['173'] = '&shy;';
		entities['174'] = '&reg;';
		entities['175'] = '&macr;';
		entities['176'] = '&deg;';
		entities['177'] = '&plusmn;';
		entities['178'] = '&sup2;';
		entities['179'] = '&sup3;';
		entities['180'] = '&acute;';
		entities['181'] = '&micro;';
		entities['182'] = '&para;';
		entities['183'] = '&middot;';
		entities['184'] = '&cedil;';
		entities['185'] = '&sup1;';
		entities['186'] = '&ordm;';
		entities['187'] = '&raquo;';
		entities['188'] = '&frac14;';
		entities['189'] = '&frac12;';
		entities['190'] = '&frac34;';
		entities['191'] = '&iquest;';
		entities['192'] = '&Agrave;';
		entities['193'] = '&Aacute;';
		entities['194'] = '&Acirc;';
		entities['195'] = '&Atilde;';
		entities['196'] = '&Auml;';
		entities['197'] = '&Aring;';
		entities['198'] = '&AElig;';
		entities['199'] = '&Ccedil;';
		entities['200'] = '&Egrave;';
		entities['201'] = '&Eacute;';
		entities['202'] = '&Ecirc;';
		entities['203'] = '&Euml;';
		entities['204'] = '&Igrave;';
		entities['205'] = '&Iacute;';
		entities['206'] = '&Icirc;';
		entities['207'] = '&Iuml;';
		entities['208'] = '&ETH;';
		entities['209'] = '&Ntilde;';
		entities['210'] = '&Ograve;';
		entities['211'] = '&Oacute;';
		entities['212'] = '&Ocirc;';
		entities['213'] = '&Otilde;';
		entities['214'] = '&Ouml;';
		entities['215'] = '&times;';
		entities['216'] = '&Oslash;';
		entities['217'] = '&Ugrave;';
		entities['218'] = '&Uacute;';
		entities['219'] = '&Ucirc;';
		entities['220'] = '&Uuml;';
		entities['221'] = '&Yacute;';
		entities['222'] = '&THORN;';
		entities['223'] = '&szlig;';
		entities['224'] = '&agrave;';
		entities['225'] = '&aacute;';
		entities['226'] = '&acirc;';
		entities['227'] = '&atilde;';
		entities['228'] = '&auml;';
		entities['229'] = '&aring;';
		entities['230'] = '&aelig;';
		entities['231'] = '&ccedil;';
		entities['232'] = '&egrave;';
		entities['233'] = '&eacute;';
		entities['234'] = '&ecirc;';
		entities['235'] = '&euml;';
		entities['236'] = '&igrave;';
		entities['237'] = '&iacute;';
		entities['238'] = '&icirc;';
		entities['239'] = '&iuml;';
		entities['240'] = '&eth;';
		entities['241'] = '&ntilde;';
		entities['242'] = '&ograve;';
		entities['243'] = '&oacute;';
		entities['244'] = '&ocirc;';
		entities['245'] = '&otilde;';
		entities['246'] = '&ouml;';
		entities['247'] = '&divide;';
		entities['248'] = '&oslash;';
		entities['249'] = '&ugrave;';
		entities['250'] = '&uacute;';
		entities['251'] = '&ucirc;';
		entities['252'] = '&uuml;';
		entities['253'] = '&yacute;';
		entities['254'] = '&thorn;';
		entities['255'] = '&yuml;';
	}

	if ( useQuoteStyle !== 'ENT_NOQUOTES' )
	{
		entities['34'] = '&quot;';
	}
	if ( useQuoteStyle === 'ENT_QUOTES' )
	{
		entities['39'] = '&#39;';
	}
	entities['60'] = '&lt;';
	entities['62'] = '&gt;';

	// ascii decimals to real symbols
	for ( decimal in entities )
	{
		if ( entities.hasOwnProperty( decimal ) )
		{
			hash_map[String.fromCharCode(decimal)] = entities[decimal];
		}
	}

	return hash_map;
}

function htmlentities( string, quote_style, charset, double_encode )
{
	// discuss at: http://phpjs.org/functions/htmlentities/
	// original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// improved by: nobbler
	// improved by: Jack
	// improved by: Rafał Kukawski (http://blog.kukawski.pl)
	// improved by: Dj (http://phpjs.org/functions/htmlentities:425#comment_134018)
	// bugfixed by: Onno Marsman
	// bugfixed by: Brett Zamir (http://brett-zamir.me)
	// input by: Ratheous
	// depends on: get_html_translation_table
	// example 1: htmlentities('Kevin & van Zonneveld');
	// returns 1: 'Kevin &amp; van Zonneveld'
	// example 2: htmlentities("foo'bar","ENT_QUOTES");
	// returns 2: 'foo&#039;bar'

	var hash_map = this.get_html_translation_table( 'HTML_ENTITIES', quote_style ),
	symbol = '';
	string = string == null ? '' : string + '';

	if ( !hash_map )
	{
		return false;
	}

	if ( quote_style && quote_style === 'ENT_QUOTES' )
	{
		hash_map["'"] = '&#039;';
	}

	if ( !! double_encode || double_encode == null )
	{
		for ( symbol in hash_map )
		{
			if ( hash_map.hasOwnProperty( symbol ) )
			{
				string = string.split( symbol ).join( hash_map[symbol] );
			}
		}
	}
	else
	{
		string = string.replace( /([\s\S]*?)(&(?:#\d+|#x[\da-f]+|[a-zA-Z][\da-z]*);|$)/g, function( ignore, text, entity )
		{
			for ( symbol in hash_map )
			{
				if ( hash_map.hasOwnProperty( symbol ) )
				{
					text = text.split( symbol ).join(hash_map[symbol]);
				}
			}

			return text + entity;
		} );
	}

	return string;
}

function html_entity_decode( html )
{
    var txt = document.createElement( 'textarea' );
    txt.innerHTML = html;
    return txt.value;
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
if (typeof module != 'undefined' && module.exports) module.exports = Sha256; // CommonJs export
if (typeof define == 'function' && define.amd) define([], function() { return Sha256; }); // AMD

/* To share applications ---------------------------------------------------- */

AssidRequest = function( flags )
{
	if( !Friend.sasidRequests ) Friend.sasidRequests = [];
	if( !flags ) flags = {};
	this.flags = flags;

	this.applicationState = null;
	this.applicationId = null;
	this.isHost = false;

	Friend.sasidRequests.push( this );
}
// Share the application
AssidRequest.prototype.share = function( handler, callback )
{
	var sas = this; // !
	//if ( !Friend.conn ) Friend.conn = new FAPConn();
	if ( !Friend.conn ) Friend.conn = new FConn();

	//console.log( 'doShare' );
	if( sas.applicationState == null )
	{
		sas.applicationState = 'pending';
		var reg = {
			path : 'system.library/app/register/',
			data : {
				authid : Application.authId,
			},
		};
		Friend.conn.request( reg, onRegistered );
		function onRegistered( res )
		{
			//console.log( 'AssidRequest.share - onRegistered', res );
			if( !res )
			{
				if( callback ) callback( false );
				return;
			}

			if( res.SASID )
			{
				// Setup the handler
				if( handler )
					Friend.conn.on( res.SASID, handler );
				sas.applicationId = res.SASID;
				sas.applicationState = 'active';
				sas.shareEvents( { sasid: res.SASID } );
				if( callback )
					callback( sas.applicationId );
			}
			else
			{
				sas.applicationState = null;
			}
		}

	}
	else if( sas.applicationState == 'active' )
	{
		if( callback ) callback( sas.applicationId );
	}
	// Catch all
	else
	{
		if( callback ) callback( null );
	}
}
// Share events with a host
AssidRequest.prototype.shareEvents = function( args, handler, callback )
{
	var sas = this;

	// Use this on events
	function dispatcher( e ){ sas.eventDispatcher( e ); }

	// Add other events
	var c = document.createElement( 'div' );
	Friend.cover = c;
	c.style.zIndex = 999999999;
	c.style.position = 'absolute';
	c.style.width = '100%';
	c.style.height = '100%';
	c.style.top = '0'; c.style.left = '0';
	document.body.appendChild( c );
	var evts = this.flags.events ? this.flags.events : [ 'mousemove', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'mousewheel' ];
	for( var a in evts ) c.addEventListener( evts[a], dispatcher );

	// Handles invite coming from game owner
	if( 'string' === typeof( args ) )
		args = friendUP.tool.parse( args );

	// Send all input events to root object!
	if( Application.windows )
	{
		//console.log( 'Attempting to reroute!' );
		for( var a in Application.windows )
		{
			Application.windows[a].sendMessage( {
				command: 'rerouteeventstoroot',
				sasid: args.sasid
			} );
		}
	}
	else
	{
		//console.log( 'Nothing to reroute.' );
	}

	// Invitees get a request dialog
	if( !this.isHost )
	{
		// Setup a communication port
		//if ( !Friend.conn ) Friend.conn = new FAPConn(); // direct connection, not through postmessage
		if ( !Friend.conn ) Friend.conn = new FConn();

		Friend.conn.on( args.sasid, handler );
		var accept = {
			path : 'system.library/app/accept/',
			data : {
				authid : Application.authId,
				sasid : args.sasid
			},
		};
		Friend.conn.request( accept, ack );
		function ack( e )
		{
			Application.receiveMessage( { command: 'sasidaccept', data: e } );
			if ( callback ) {
				var res = e;
				callback( res );
			}
		}
	}
}

// Stop sharing application
AssidRequest.prototype.unshare = function( callback )
{
	var sas = this;
	if( this.applicationState == null )
	{
		if( callback ) callback( false );
	}
	else
	{
		Friend.conn.off( this.applicationId );
		var unReg = {
			path : 'system.library/app/unregister',
			data : {
				sasid: this.applicationId
			},
		};
		Friend.conn.request( unReg, unregDone );
		function unregDone( res )
		{
			//console.log( 'unshare - result', res );
			sas.applicationState = null;
			sas.applicationId = null;
			sas.input.parentNode.removeChild( Friend.input );
			sas.cover.parentNode.removeChild( Friend.cover );
			Friend.conn.close();
			if( callback ) callback( true );
		}
	}
}

AssidRequest.prototype.sendInvite = function( userlist, inviteMessage, callback )
{
	var sas = this;

	if ( !sas.applicationState )
	{
		if ( callback )
			callback( false );
		return;
	}

	if ( 'string' === typeof( userlist )) {
		var users = userlist.split( ',' );
		userlist = users.map( function( user ) {
			return user.trim();
		});
	}

	var inv = {
		path : 'system.library/app/share',
		data : {
			sasid : sas.applicationId,
			authid : Application.authId,
			message : inviteMessage,
			users : userlist,
		},
	};
	Friend.conn.request( inv, invBack );
	function invBack( res )
	{
		//console.log( 'sendInvite - result', res );
		if ( callback )
			callback( res );
	}
}

// Send the input event to other or owner
AssidRequest.prototype.eventDispatcher = function( e )
{
	// We're not doing this if event owner is owner...
	if( this.isHost && this.flags.eventOwner == 'owner' )
		return;

	console.log( 'eventDispatcher', e );
	// Send the event through the network!
	var hostEndpoint = 'send/'; // broadcast to all clients
	var clientEndpoint = 'sendowner/'; // send to session owner
	var path = 'system.library/app/';
	if ( this.isHost )
		path += hostEndpoint;
	else path += clientEndpoint;

	var msg = {
		path: path,
		data: {
			sasid: this.applicationId,
			msg: e
		},
	};
	Friend.conn.send( msg );

	return cancelBubble( e );
}

// Send an event to others
AssidRequest.prototype.sendEvent = function( e )
{
	// Send the event through the network!
	//console.log( 'sendEVent', e );
	var hostEndpoint = 'send/'; // broadcast to all clients
	var clientEndpoint = 'sendowner/'; // send to session owner
	var path = 'system.library/app/';
	if ( this.isHost )
		path += hostEndpoint;
	else path += clientEndpoint;

	var msg = {
		path: path,
		data: {
			sasid: this.applicationId,
			msg: e
		},
	};
	Friend.conn.send( msg );

	//console.log( 'Sent this weird message: ', msg );

	return cancelBubble( e );
}

// Reroute events to root Application object!
Friend.orphanElementSeed = 1;
Friend.rerouteAssidEventsToRoot = function( sasid )
{
	//console.log( 'rerouteAssidEventsToRoot', sasid );
	// Filter out some event data
	var illegalKeys = [
		'location', 'repeat', 'keyIdentifier', 'code',
		'DOM_KEY_LOCATION_STANDARD', 'DOM_KEY_LOCATION_LEFT',
		'DOM_KEY_LOCATION_RIGHT', 'DOM_KEY_LOCATION_NUMPAD', 'detail',
		'cancelable', 'NONE', 'CAPTURING_PHASE', 'AT_TARGET', 'BUBBLING_PHASE',
		'MOUSEDOWN', 'MOUSEUP', 'MOUSEOVER', 'MOUSEOUT', 'MOUSEMOVE',
		'MOUSEDRAG', 'CLICK', 'DBLCLICK', 'KEYDOWN', 'KEYUP', 'KEYPRESS',
		'DRAGDROP', 'FOCUS', 'BLUR', 'SELECT', 'CHANGE', 'isTruster',
		'eventPhase', 'timeStamp', 'defaultPrevented'
	];
	var illFound = false;

	// Set new events that will capture existing ones!
	function setEvent( event )
	{
		window[ 'on' + event ] = function( e )
		{
			//console.log( 'Foookk', e );
			// Generate a limited set of event data to send further
			var o = {};

			// Support touch
			if( e.changedTouches )
			{
				var touch = e.changedTouches[0];
				o.touchPageX = touch.pageX;
				o.touchPageY = touch.pageY;
			}

			// Support target id
			if( e.target && e.target.id )
				o.targetId = e.target.id;

			for( var a in e )
			{
				if( typeof( e[a] ) == 'object' ) continue;
				illFound = false;
				for( var b = 0; b < illegalKeys.length; b++ )
				{
					if( a == illegalKeys[b] )
					{
						illFound = true;
						break;
					}
				}
				if( illFound ) continue;
				o[a] = e[a];
			}
			Application.sendMessage( {
				command: 'captureevent',
				eventType: event,
				eventData: JSON.stringify( o ),
				sasid: sasid
			} );
			return cancelBubble( e );
		};
	}
	var events = [ 'keydown', 'keyup', 'touchstart', 'touchend' ]; //, 'mousemove', 'mousedown', 'mouseup', 'touchstart', 'touchend' ];
	for( var a = 0; a < events.length; a++ )
	{
		setEvent( events[a] );
	}
	// Make sure we trap the events so we can use them later!
	// We also trap events from all new events created (and give them id if none is found)
	document.createElementOld = document.createElement;
	document.createElement = function( type, options )
	{
		var o = this.createElementOld( type, options );
		o.oldListener = o.addEventListener;
		o.addEventListener = function( type, listener )
		{
			function ev( e )
			{
				if( !this.id ) this.id = this.nodeName + Friend.orphanElementSeed++;
				// Generate a limited set of event data to send further
				var o = {};

				// Support touch
				if( e.changedTouches )
				{
					var touch = e.changedTouches[0]
					o.touchPageX = touch.pageX;
					o.touchPageY = touch.pageY;
				}

				// Support target id
				if( e.target && e.target.id )
					o.targetId = e.target.id;

				for( var a in e )
				{
					if( typeof( e[a] ) == 'object' ) continue;
					illFound = false;
					for( var b = 0; b < illegalKeys.length; b++ )
					{
						if( a == illegalKeys[b] )
						{
							illFound = true;
							break;
						}
					}
					if( illFound ) continue;
					o[a] = e[a];
				}

				//console.log( 'captureevent', event );
				Application.sendMessage( {
					command: 'captureevent',
					elementType: event,
					elementId: this.id,
					sasid: sasid,
					elementData: JSON.stringify( o )
				} );
			};
			this.oldListener( type, ev );
			if( !this.trappedEvents ) this.trappedEvents = { 'ontest': 'testing' };
			if( !this.trappedEvents[ type ] ) this.trappedEvents[ type ] = [];
			this.trappedEvents[ type ].push( ev );
		}
		return o;
	}
	var eles = document.getElementsByTagName( '*' );
	for( var a = 0; a < eles.length; a++ )
	{
		// Instead of adding event listeners, the events are trapped!
		eles[a].addEventListener = function( t, c )
		{
			if( !this.trappedEvents ) this.trappedEvents = {};
			if( !this.trappedEvents[ t ] ) this.trappedEvents[ t ] = [];
			this.trappedEvents[t].push( c );
		}
	}
}

// Execute a shared event everywhere
AssidRequest.prototype.distributeSharedEvent = function( type, edata )
{
	// TODO: Support screens
	// Send it to all windows (we don't know what is what.. :( ..)
	if( typeof( type ) == 'undefined' ) return;
	//console.log( 'distributeSharedEvent', type );
	for( var a in Application.windows )
	{
		Application.windows[a].sendMessage( {
			command: 'dispatchevent',
			eventType: type,
			eventData: edata
		} );
	}
}

// Desklet ---------------------------------------------------------------------

GuiDesklet = function()
{

};

/**
 * SAS - Shared Application Session
 *
 * Interface for an application shared session in FriendCore.
 * Used by both host and clients, it provides methods for managing
 * and interacting with an application shared session.
 *
 * @param conf object
 *  - sasid   : must be provided if this is a client, null/undefined if host.
 *  - onevent : optional - events not registered for with .on() will be sent here.
 * @param callback function - called with the result of SAS registering with FC.

 * @return instance of SAS
 */
(function( ns, undefined )
{
	ns.SAS = function( conf, callback )
	{
		if ( !( this instanceof ns.SAS ))
			return new ns.SAS( conf );

		var self = this;
		self.id = conf.sasid || null;
		self.sessiontype = conf.sessiontype || null;
		self.onevent = conf.onevent;
		self.callback = callback;

		self.isHost = false;
		self.users = {};
		self.invited = {};
		self.subs = {};

		self.init();
	}

	// Public

	/**
	 * invite
	 *
	 * Invite other FC users to join the SAS. Only a host may invite.
	 *
	 * @param users array of usernames to invite
	 * @param inviteMessage message to be displayed to the invitee
	 * @param callback fn, called with the result, an array of usernames that were invited - optional
	 *
	 * @return void return value
	 */
	ns.SAS.prototype.invite = function( users, inviteMessage, callback )
	{
		var self = this;
		if ( !self.isHost ) {
			if ( callback )
				callback( false );
			return;
		}

		var inv = {
			path : self.invitePath,
			data : {
				sasid     : self.id,
				authid    : Application.authId,
				message   : inviteMessage,
				users     : users,
			},
		};
		self.conn.request( inv, invBack );
		function invBack( res ) {
			if ( callback )
				callback( res );
		}
	}

	/**
	 * remove
	 *
	 * Remove users from the SAS. Only a host may remove.
	 *
	 * @param users array of users to be removed
	 * @param removeMessage sent to the removed party as part of the event
	 * @param callback fn, called with the result, an array of usernames that were removed - optional

	 * @return void return value
	 */
	ns.SAS.prototype.remove = function( users, removeMessage, callback )
	{
		var self = this;
		if ( !self.isHost ) {
			if ( callback )
				callback( false );
			return;
		}

		if ( 'string' === typeof users ) {
			var parts = users.split( ',' );
			users = parts.map( trimp );
		}

		var rem = {
			path : self.removePath,
			data : {
				sasid   : self.id,
				authid  : Application.authId,
				message : removeMessage || 'Removed by host',
				users   : users,
			},
		}
		self.conn.request( rem, remBack );
		function remBack( res ) {
			if ( callback )
				callback( res );
		}

		function trimp( name ) { return name.trim(); }
	}

	/**
	 * getUsers
	 *
	 * get a list of users currently in the session
	 * invited user who have not yet accepted are included, but they have
	 * .invited set to true
	 *
	 * @param callback fn, called with the result, an array of user objects
	 * @return void return value
	 */
	ns.SAS.prototype.getUsers = function( callback ) {
		var self = this;
		var req = {
			path : self.userlistPath,
			data : {
			},
		};
		self.conn.request( req, callback );
	}

	/**
	 * send
	 *
	 * Send an event. As host, the event will be broadcast to all clients.
	 * As client, the event will be sent to the host. For the event to be handled by the
	 * eventhandler and passed on to handlers registered with .on(), the format must be:
	 * {
	 *   type : 'eventname',
	 *   data : dataObject,
	 * }
	 * Unhandled events will be passed to .onevent handler, if defined.
	 *
	 * @param event object
	 * @param usernames host only, send event to a list of specific usernames

	 * @return void return value
	 */
	ns.SAS.prototype.send = function( event, usernames )
	{
		var self = this;
		if ( !self.isHost )
			username = undefined;

		usernames = usernames || undefined;
		if ( 'string' === typeof( usernames ))
			usernames = [ usernames ];

		if ( usernames && !usernames.forEach ) {
			console.log( 'invalid usernames - must be array', usernames );
			usernames = undefined;
		}

		var path = null;
		if ( self.isHost )
			path = self.toClientsPath;
		else
			path = self.toHostPath;

		var msg = {
			path : path,
			data : {
				sasid     : self.id,
				msg       : event,
			},
		};

		if ( usernames )
			msg.data.usernames = usernames;

		self.conn.send( msg );
	}

	/**
	 * on
	 *
	 * Register a handler for a event type. Only one handler may be registered for
	 * each event
	 *
	 * @param event string, name of event to register for
	 * @param handler function, event of type is passed on to this handler

	 * @return void return value
	 */
	ns.SAS.prototype.on = function( event, handler )
	{
		var self = this;
		if ( self.subs[ event ]) {
			console.log( 'SAS.on - event already registred', {
				event      : event,
				registered : self.subs,
			});
			throw new Error( 'SAS.on - event already registered ^^^' );
		}

		self.subs[ event ] = handler;
	}

	/**
	 * off
	 *
	 * Unregister for event type. The handler will be unrefrerenced.
	 *
	 * @param event string, event name

	 * @return void return value
	 */
	ns.SAS.prototype.off = function( event )
	{
		var self = this;
		delete self.subs[ event ];
	}

	/**
	 * close
	 *
	 * For the host, this closes the session for everyone.
	 * For a client, they leave the session.
	 * There is no way to reconnect.
	 *
	 * @return void return value
	 */
	ns.SAS.prototype.close = function()
	{
		var self = this;
		var close = {
			path : self.closePath,
			data : {
				sasid : self.id,
			},
		};
		self.conn.request( close, sasidClosed );
		function sasidClosed( res ) {
			console.log( 'sas.close - res' );
			delete self.onevent;
			delete self.subs;
			delete self.conn;
		}
	}

	// Private - if you are calling these, you are doing it wrong

	ns.SAS.prototype.regPath = 'system.library/app/register';
	ns.SAS.prototype.acceptPath = 'system.library/app/accept';
	ns.SAS.prototype.invitePath = 'system.library/app/share';
	ns.SAS.prototype.removePath = 'system.library/app/unshare';
	ns.SAS.prototype.closePath = 'system.library/app/unregister';
	ns.SAS.prototype.toClientsPath = 'system.library/app/send';
	ns.SAS.prototype.toHostPath = 'system.library/app/sendowner';
	ns.SAS.prototype.userlistPath = 'system.library/app/userlist';

	ns.SAS.prototype.init =function() {
		var self = this;
		if ( !window.Application )
			throw new Error( 'SAS - window.Application is not defined' );

		self.conn = new FConn();

		if ( !self.id )
			self.isHost = true;

		if ( self.isHost )
			self.registerHost( self.callback );
		else
			self.registerClient( self.callback );

		delete self.callback;
	}

	ns.SAS.prototype.registerHost = function( callback )
	{
		var self = this;
		var reg = {
			path : self.regPath,
			data : {
				authId : Application.authId,
			},
		};
		if( self.sessiontype ) reg.data.type = self.sessiontype;
		
		self.conn.request( reg, regBack );
		function regBack( res ) {
			if ( !res.SASID ) {
				callback( false );
				return;
			}

			self.id = res.SASID;
			self.conn.on( self.id, clientEvents );
			callback( res );

			function clientEvents( e ) { self.handleEvent( e ); }
		}

	}

	ns.SAS.prototype.registerClient = function( callback )
	{
		var self = this;
		if ( !self.id ) {
			callback( false );
			throw new Error( 'SAS.registerClient - missing SAS ID' );
			return;
		}

		var accept = {
			path : self.acceptPath,
			data : {
				accauthid : Application.authId,
				sasid  : self.id,
			}
		};
		self.conn.request( accept, accBack );
		function accBack( res ) {
			var host = res.identity;
			res.host = host;
			callback( res );
			self.conn.on( self.id, hostEvents );

			function hostEvents( e ) { self.handleEvent( e ); }
		}
	}

	ns.SAS.prototype.handleEvent = function( e )
	{
		var self = this;
		var event = e.data;
		var identity = e.identity;
		var handler = self.subs[ event.type ];
		if ( handler ) {
			handler( event.data, identity );
			return;
		}

		console.log( 'handleEvent - no handler', {
			e : e,
			s : self.subs
		});

		if ( self.onevent )
			self.onevent( e );
	}

})( window );

// Paste handler handles pasting of files and media ----------------------------
( function( ns, undefined )
{
	ns.PasteHandler = function()
	{
		
	}
	
	// Initiate paste handler
	ns.PasteHandler.prototype.paste = function( evt, callback )
	{
		var self = this;
		
		function DirectoryContainsFile( filename, directoryContents )
		{
			if( !filename ) return false;
			if( !directoryContents || directoryContents.length == 0 ) return false;
	
			for(var i = 0; i < directoryContents.length; i++ )
			{
				if( directoryContents[i].Filename == filename ) return true;
			}
			return false;
		}
		
		function uploadPastedFile( file )
		{
			//get directory listing for Home:Downloads - create folder if it does not exist...
			var j = new cAjax ();
		
			var updateurl = '/system.library/file/dir?wr=1'
			updateurl += '&path=' + encodeURIComponent( 'Home:Downloads' );
			updateurl += '&authid=' + encodeURIComponent( Application.authId );
			updateurl += '&cachekiller=' + ( new Date() ).getTime();
			
			var wholePath = 'Home:Downloads/';
			
			j.open( 'get', updateurl, true, true );
			j.onload = function ()
			{
				console.log( 'The response was: ' + this.returnCode, this.returnData );
				var content;
				// New mode
				if ( this.returnCode == 'ok' )
				{
					try
					{
						content = JSON.parse(this.returnData||"null");
					}
					catch ( e ){};
				}
				// Legacy mode..
				// TODO: REMOVE FROM ALL PLUGINS AND MODS!
				else
				{
					try
					{
						content = JSON.parse(this.responseText() || "null");
					}
					catch ( e ){}
				}
		
				if( content )
				{
					var newfilename = file.name;
					var i = 0;
					while( DirectoryContainsFile( newfilename, content ) )
					{
						i++;
						//find a new name
						var tmp = file.name.split('.');
						var newfilename = file.name;
						if( tmp.length > 1 )
						{
							var suffix = tmp.pop();				
							newfilename = tmp.join('.');
							newfilename += '_' + i + '.' + suffix;
						}
						else
						{
							newfilename += '_' + i;
						}
						if( i > 100 )
						{
							Notify({'title':i18n('i18n_paste_error'),'text':'Really unexpected error. You have pasted too many files.'});
							if( callback ) callback( { response: false, message: 'Too many files pasted.' } );
							break; // no endless loop please	
						}
					}
					uploadFileToDownloadsFolder( file, newfilename, wholePath + newfilename );
				}
				else
				{
					Notify({'title':i18n('i18n_paste_error'),'text':'Really unexpected error. Contact your Friendly administrator.'});
					if( callback ) callback( { response: false, message: 'Unexpected error occured.' } );
				}
			}
			j.send ();
		}
		
		// end of uploadPastedFile
		function uploadFileToDownloadsFolder( file, filename, path )
		{
			// Setup a file copying worker
			var url = document.location.protocol + '//' + document.location.host + '/webclient/';
			var uworker = new Worker( url + 'js/io/filetransfer.js' );

			// Open window
			var w = new View( {
				title:  i18n( 'i18n_pasting_files' ),
				width:  320,
				height: 100,
				id:     'fileops'
			} );

			var uprogress = new File( 'System:templates/file_operation_apilevel.html' );

			uprogress.connectedworker = uworker;

			//upload dialog...
			uprogress.onLoad = function( data )
			{
				var self = this;
				data = data.split( '{cancel}' ).join( i18n( 'i18n_cancel' ) );
				w.setContent( data );

				w.connectedworker = this.connectedworker;
				w.onClose = function()
				{
					if( this.connectedworker ) this.connectedworker.postMessage( { 'terminate': 1 } );
					if( callback )
					{
						if( self.progress == 100 )
						{
							callback( { response: true, message: 'Upload was completed.', path: path } );
							callback = false;
						}
						else
						{
							callback( { response: false, message: 'Upload was terminated.', progress: self.progress } );
							callback = false;
						}
					}
				}
				uprogress.myview = w;
			}

			// For the progress bar
			uprogress.setProgress = function( percent )
			{
				this.progress = percent;
				// only update display if we are loaded...
				// otherwise just drop and wait for next call to happen ;)
				if( uprogress.loaded )
				{
					w.sendMessage( { command: 'progress', value: Math.floor( Math.max( 1, percent ) ) } );
				}
			};

			// show notice that we are transporting files to the server....
			uprogress.setUnderTransport = function()
			{
				w.sendMessage( { command: 'progress_information', data: 'Transferring files to target volume...' } );
				uprogress.myview.setFlag( 'height', 125 );
			}

			// An error occurred
			uprogress.displayError = function( msg )
			{
				w.sendMessage( { command: 'progress_error', data: msg } );
				uprogress.myview.setFlag( 'height', 140 );
			}

			// Error happened!
			uworker.onerror = function( err )
			{
				console.log( 'Upload worker error #######' );
				console.log( err );
				console.log( '###########################' );
			}
			
			uworker.onmessage = function( e )
			{
				if( e.data['progressinfo'] == 1 )
				{
					if( e.data['uploadscomplete'] == 1 )
					{
						uprogress.setProgress( 100 );
						w.close();
						Notify({'title':i18n('i18n_pasted_file'),'text':i18n('i18n_pasted_to_downloads') + '(' + filename +')' });
						if( callback ) callback( { response: true, message: 'Upload completed.', path: path } );
						return true;
					}
					else if( e.data['progress'] )
					{
						uprogress.setProgress( e.data['progress'] );
						if( e.data['filesundertransport'] && e.data['filesundertransport'] > 0 )
						{
							uprogress.setUnderTransport();
						}
					}

				}
				else if( e.data['error'] == 1 )
				{
					uprogress.displayError(e.data['errormessage']);
					if( callback ) callback( { response: false, message: 'Received error 1.' } );
				}

			}

			uprogress.load();

			//hardcoded pathes here!! TODO!
			var fileMessage = {
				'authid': Application.authId,
				'targetPath': 'Home:Downloads/',
				'targetVolume': 'Home',
				'files': [ file ],
				'filenames': [ filename ]
			};
			
			uworker.postMessage( fileMessage );		
		}
		
		var pastedItems = ( evt.clipboardData || evt.originalEvent.clipboardData ).items;
		for( i in pastedItems )
		{
			var item = pastedItems[i];
			if( item.kind === 'file' )
			{
				var blob = item.getAsFile();
				filetype = ( blob.type == '' ? 'application/octet-stream' : blob.type );
				
				self.uploadBlob = blob;
				
				var m = new Library( 'system.library' );
				m.onExecuted = function( e, d )
				{
					//we have a downloads dir in home
					if( e == 'ok' )
					{
						uploadPastedFile( self.uploadBlob );
					}
					else
					{
						//no downloads dir - try to make one
						var m2 = new Library( 'system.library' );
						m2.onExecuted = function( e, d )
						{
							//home drive found. create directory
							if( e == 'ok' )
							{
								var shell = new Shell();
								shell.onReady = function()
								{
									shell.execute( 'makedir Home:Downloads/', function( result )
									{
										shell.close();
										
										var res = result.split( '<!--separate-->' );
										if( res[0] == 'ok' )
										{
											uploadPastedFile( self.uploadBlob );
										}
										// Failed - alert user
										else
										{
											Notify( {
												'title': i18n('i18n_paste_error'),
												'text': i18n('i18n_could_not_create_downloads')
											} );
											if( callback ) callback( { response: false, message: 'Could not create Downloads/ directory.' } );
											return;
										}
									} );
								}
							}
							else
							{
								Notify({'title':i18n('i18n_paste_error'),'text':i18n('i18n_no_home_drive')});
								if( callback ) callback( { response: false, message: 'No home disk.' } );
								return;
							}
						};						
						m2.execute( 'file/dir', { path: 'Home:' } );
					}
				}
				m.execute( 'file/dir', { path: 'Home:Downloads/' } );
			} // if file item
		} // each pasted iteam
	}
	
} )( window );

// Friend API engine - only possible in Javascript! (Y) :)
///////////////////////////////////////////////////////////////////

// Current versions of the API
Friend.APIVersion = '1.2';
Friend.APIVersionMinimal = '1.2';			// We might want to change that one day when the number of versions gets too high
											// but we should not really...

// API Variables
Friend.APIDefinition = {};
Friend.NORETURN = 'noReturn';
Friend.ERROR = 'error';

GetClass = function( source, root )
{
	var start = 0;
	var end = source.indexOf( '.' );
	if ( end < 0 ) 
		end = source.length;
	var klass = window[ source.substring( start, end ) ];
	if ( typeof klass == 'undefined' )
		return null;
	while( end < source.length )
	{
		start = end + 1;
		end = source.indexOf( '.', start ), source.length;
		if ( end < 0 ) 
			end = source.length;
		klass = klass[ source.substring( start, end ) ];
		if ( typeof klass == 'undefined' )
			return null;
	};
	return klass;
};
CallLowLevelAPI = function( args, functionPath, argumentNames, flags )
{
	var message =
	{
		type: 'Friend',
		method: functionPath,
		arguments: [],
		flags: flags,
		extra: typeof extra != 'undefined' ? extra : false
	}

	// Copy the arguments
	for ( var a = 0; a < argumentNames.length; a++ )
	{
		if ( argumentNames[ a ] != 'callback' )
		{
			message.arguments.push( args[ a ] );
		}
		else
		{
			if ( args[ a ] )
			{
				if ( flags.permanent )
				{
					message.callback = addPermanentCallback( args[ a ] );		
				}
				else 
				{
					message.callback = addCallback( args[ a ] );
				}
			}
			message.arguments.push( null );
		}
	}

	// Call apiwrapper
	Application.sendMessage( message );
};

if( Friend )
{
	// To be called at first pass of Javascript
	Friend.addToAPI = function( functionPath, argumentNames, properties, parentClass )
	{
		var definition = {};

		definition.functionName = functionPath.substring( functionPath.lastIndexOf( '.' ) + 1 );
		definition.functionPath = functionPath;
		definition.argumentNames = argumentNames;		// Can be ommited
		definition.properties = properties;
		if ( !parentClass )
			parentClass = Friend;

		// Find the position of the callback
		definition.callbackPosition = -1;
		for ( var n = 0; n < argumentNames.length; n++ )
		{
			if ( argumentNames[ n ] == 'callback' )
			{
				definition.callbackPosition = n;
				break;
			}
		}
		definition.numberOfArguments = argumentNames.length;
		definition.isDirect = ( properties.tags.indexOf( '#direct' ) >= 0 );
		definition.isCallback = ( properties.tags.indexOf( '#callback' ) >= 0 );

		// Find the function
		var functionClass;
		if ( properties.redirection )
		{
			functionClass = GetClass( properties.redirection.functionPath, parentClass );
		}
		else
		{
			functionClass = GetClass( functionPath, parentClass );
		}

		// Add to API!
		if( functionClass )
		{
			definition.klass = functionClass;
			parentClass.APIDefinition[ functionPath ] = definition;
			return true;
		}
		console.log( 'ERROR - API function not found: ' + functionPath );
		return 'ERROR - API function not found: ' + functionPath;
	};

	Friend.removeFromAPI = function( functionPath )
	{
		if ( Friend.APIDefinition[ functionPath ] )
		{
			Friend.APIDefinition = Friend.Utilities.cleanArray( Friend.APIDefinition, Friend.APIDefinition[ functionPath ] );
			return true;
		}
		console.log( 'ERROR - API function not found: ' + functionPath );
		return false;
	}
}

// Check if Friend has focus on input field
Friend.GUI.checkInputFocus = function()
{
	var focused = document.activeElement;
	if( !focused || focused == document.body )
	{
		focused = false;
	}
	if( document.querySelector )
	{
		var cand = document.querySelector( ':focus' );
		if( cand && cand != focused ) focused = cand;
	}
	var response = false;
	if( focused )
	{
		if( focused.tagName == 'INPUT' || focused.tagName == 'TEXTAREA' || focused.getAttribute( 'contenteditable' ) )
		{
			response = true;
		}
	}
	// Send the message
	Application.sendMessage( {
		type: 'view',
		method: 'windowstate',
		state: 'input-focus',
		value: response
	} );
}

// Responsive layout

Friend.responsive = {
	pages: [],
	history: [],
	pagesById: {},
	pageActive: null,
	init()
	{
		if( !window.isMobile ) return;
		var self = this;
		var initial = null;
		var d = document.getElementsByTagName( '*' );
		for( var a = 0; a < d.length; a++ )
		{
			// Page!
			if( d[a].classList && d[a].classList.contains( 'Responsive-Page' ) )
			{
				if( !Friend.responsive.pageActive )
				{
					Friend.responsive.pageActive = d[a];
				}
				Friend.responsive.pages.push( d[a] );
				if( !d[a].id )
				{
					var id = 'Responsive-Page-';
					var idnum = 1;
					while( ge( id + idnum ) )
					{
						idnum++;
					}
					d[a].id = id + idnum;
				}
				if( d[a].classList.contains( 'Responsive-Page-Initial' ) )
				{
					initial = d[a];
				}
				else
				{
					d[ a ].classList.add( 'Responsive-Subpage' );
				}
				Friend.responsive.pages.push( d[a] );
				Friend.responsive.pagesById[ d[a].id ] = d[a];
			}
		}
		// Set the initial active page
		if( initial && !self.pageActive )
			self.setPage( initial );
		// We need an active page
		else if( !self.pageActive )
		{
			self.setPage( self.pages[ 0 ] );
		}
		else
		{
			self.setPage( self.pageActive );
		}
		return true;
	},
	// Reinitialize
	reinit()
	{
		if( !window.isMobile ) return;
		var self = this;
		return self.init();
	},
	previousPage()
	{
		if( !window.isMobile ) return;
		var self = this;
		var out = [];
		for( var a = 0; a < self.history.length - 1; a++ )
		{
			out.push( self.history[ a ] );
		}
		self.history = out;
		if( out.length )
		{
			var pa = self.history[ self.history.length - 1 ];
			self.setPage( pa );
			self.reinit();
		}
	},
	// Set active page by dom element or id
	setPage( element )
	{
		if( !window.isMobile ) return;
		var self = this;
		
		// We really do need an element to do anything
		if( !element )
		{
			return;
		}
		
		if( typeof( element ) == 'string' )
		{
			element = ge( element );
			if( !element ) return;
		}
		
		var before = true;
		
		for( var a = 0; a < self.pages.length; a++ )
		{
			if( self.pages[ a ] == self.pageActive )
			{
				before = false;
			}
			if( self.pages[ a ].backButton )
			{
				var b = self.pages[ a ].backButton;
				if( b.parentNode )
				{
					( function( ele ){
						setTimeout( function()
						{
							ele.parentNode.removeChild( ele );
						}, 250 );
						ele.style.height = '0px';
					} )( b );
				}
				self.pages[ a ].backButton = null;
			}
			if( before )
			{
				self.pages[ a ].classList.remove( 'Responsive-Page-Right' );
				self.pages[ a ].classList.add( 'Responsive-Page-Left' );
			}
			else
			{
				self.pages[ a ].classList.remove( 'Responsive-Page-Left' );
				self.pages[ a ].classList.add( 'Responsive-Page-Right' );
			}
			if( self.pages[ a ] != element )
			{
				self.pages[ a ].classList.remove( 'Responsive-Page-Active' );
			}
			self.pages[ a ].classList.add( 'BackgroundDefault' );
		}
		self.pageActive = element;
		element.classList.add( 'Responsive-Page-Active' );
		
		// Set history!
		if( self.history[ self.history.length - 1 ] != element )
		{
			self.history.push( element );
		}
		// If we can go back, give button
		if( self.history.length > 1 )
		{
			var backButton = document.createElement( 'div' );
			backButton.className = 'Responsive-Button-Back MousePointer BorderBottom BackgroundHeavier';
			backButton.innerHTML = 'Back';
			document.body.appendChild( backButton );
			element.backButton = backButton;
			backButton.onclick = function()
			{
				self.previousPage();
			}
		}
		
		// Current page goes into view
		element.classList.remove( 'Responsive-Page-Left' );
		element.classList.remove( 'Responsive-Page-Right' );
	}
};


