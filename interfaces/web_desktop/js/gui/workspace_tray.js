/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*******************************************************************************
*                                                                              *
* The Friend Workspace tray handles desktop notifications and mobile           *
* notifications.                                                               *
*                                                                              *
*******************************************************************************/

// Poll the tray for elements - handles all object types
function PollTray()
{
	// Mobile handles this a bit differently
	if( isMobile )
	{
		return PollMobileTray();
	}
	
	var tray = ge( 'Tray' );
	if( !tray )
	{
		return;
	}
	
	// Checks for tasks
	if( tray.tasks )
	{
		tray.tasks.poll();
	}
	else
	{
		// Add task applet
		tray.tasks = document.createElement( 'div' );
		tray.tasks.className = 'Tasks TrayElement IconSmall';
		tray.tasks.poll = function()
		{
			var taskn = Workspace.applications.length;
			this.innerHTML = '<div class="BubbleInfo"><div>' + taskn + ' ' + ( taskn == 1 ? i18n( 'i18n_task_running' ) : i18n( 'i18n_tasks_running' ) ) + '.</div></div>';
		}
		tray.appendChild( tray.tasks );
		
		// Add download applet
		// TODO: Remove this from native friend book interface
		var da = tray.downloadApplet = document.createElement( 'div' );
		da.className = 'Download TrayElement IconSmall';
		da.poll = function()
		{
		}
		da.ondrop = function( e )
		{
			var num = 0;
			for( var a = 0; a < e.length; a++ )
			{
				if( Workspace.download( e[ a ].Path ) )
				{
					num++;
				}
			}
			// Successful drop
			if( num > 0 ) return true;
			// Unsuccessful drop
			return false;
		}
		tray.appendChild( da );
	}
	
	// Check for notifications in history
	if( Workspace.notificationEvents.length )
	{
		// Find notification
		if( !tray.notifications )
		{
			tray.notifications = document.createElement( 'div' );
			tray.appendChild( tray.notifications );
		}
		// hot
		var nots = Workspace.notificationEvents;
		
		tray.notifications.className = 'Notification TrayElement IconSmall';
		
		var toClear = true;
		for( var a = 0; a < nots.length; a++ )
		{
			if( ( new Date() ).getTime() - nots[ a ].time < 250 )
			{
				toClear = false;
			}
		}
		if( toClear )
		{
			tray.notifications.innerHTML = '';
			tray.notificationPopup = null;
		}
		
		for( var a = 0; a < nots.length; a++ )
		{
			// Unseen notification!
			if( !nots[ a ].seen )
			{
				nots[ a ].seen = true;
				
				if( nots[ a ].notificationId )
				{
					if( Workspace.currentViewState == 'active' && !Workspace.sleeping )
					{
						var l = new Library( 'system.library' );
						l.onExecuted = function(){};
						l.execute( 'mobile/updatenotification', { 
							notifid: nots[ a ].notificationId, 
							action: 1,
							pawel: 10
						} );
					}
					//console.log( 'Cancelling notification event as we are online.', nots[ a ].notificationId );
				}
				
				// Add this bubble!
				( function( event )
				{
					var d = document.createElement( 'div' );
					d.className = 'BubbleInfo';
					d.innerHTML = '<div><p class="Layout"><strong>' + nots[a].title + '</strong></p><p class="Layout">' + nots[a].text + '</p></div>';
					tray.notifications.appendChild( d );
					d.onclick = function( e )
					{
						if( event.clickCallback )
						{
							event.clickCallback();
							RemoveNotificationEvent( event.notificationId );
							if( tray.notifications && this && this.parentNode == tray.notifications )
								tray.notifications.removeChild( this );
						}
						PollTray();
						return cancelBubble( e );
					}
					if( event.showCallback )
					{
						event.showCallback();
					}
					setTimeout( function()
					{
						if( d.parentNode )
						{
							d.style.opacity = 0;
							d.style.pointerEvents = 'none';
							setTimeout( function()
							{
								if( d.parentNode )
								{
									tray.notifications.removeChild( d );
									PollTray();
								}
							}, 400 );
						}
					}, 5000 );
				} )( nots[ a ] );
			}
		}
		// Do we have some 
		tray.notifications.classList.add( 'Blink' );
		
		// On click to see all notifications!
		tray.notifications.onclick = function( e )
		{
			if( tray.notifications.timeout )
			{
				clearTimeout( tray.notifications.timeout );
				tray.notifications.timeout = null;
			}
			
			// Clear showing, because they are all seen!
			tray.notifications.classList.remove( 'Blink' );
			tray.notifications.innerHTML = '';
			
			if( !Workspace.notificationEvents.length )
				return;
			
			// Create popup
			tray.notificationPopup = document.createElement( 'div' );
			tray.notificationPopup.className = 'BubbleInfo TrayNotificationPopup';
			tray.notifications.appendChild( tray.notificationPopup );
			
			// Clear and repopulate popup
			function repopulate()
			{
				if( !tray.notificationPopup ) return;
				tray.notificationPopup.innerHTML = '';
			
				var h = 8;
				var notties = Workspace.notificationEvents;
				
				if( notties.length > 0 )
				{
					for( var a = notties.length - 1; a >= 0; a-- )
					{
						var d = document.createElement( 'div' );
						d.className = 'NotificationPopupElement BorderBottom';
						d.notification = notties[a];
						notties[ a ].seen = true;
						d.innerHTML = '\
							<div>\
								<div class="NotificationClose FloatRight fa-remove IconSmall"></div>\
								<p class="Layout"><strong>' + notties[a].title + '</strong></p>\
								<p class="Layout">' + notties[a].text + '</p>\
							</div>';
						d.onmousedown = function( ev )
						{
							if( this.notification.clickCallback )
							{
								RemoveNotificationEvent( this.notification.notificationId );
								this.notification.clickCallback();
							}
							this.parentNode.removeChild( this );
							repopulate();
							return cancelBubble( ev );
						}
						// Cancel closing
						d.onmouseover = function( ev )
						{
							if( tray.notifications.timeout )
							{
								clearTimeout( tray.notifications.timeout );
								tray.notifications.timeout  = null;
							}
						}
						tray.notificationPopup.appendChild( d );
						
						notties[ a ].seen = true; // They are seen!
				
						d.style.bottom = h + 'px';
						
						// Remove notification
						( function( not, dd ){
							var el = dd.getElementsByClassName( 'NotificationClose' )[ 0 ];
							el.onmousedown = function( e )
							{
								var out = [];
								for( var z = 0; z < Workspace.notificationEvents.length; z++ )
								{
									if( z == not ) continue;
									else out.push( Workspace.notificationEvents[ z ] );
								}
								Workspace.notificationEvents = out;
								cancelBubble( e );						
								if( out.length )
								{
									repopulate();
								}
								else
								{
									PollTray();
								}
							}
						} )( a, d );
						
						h += GetElementHeight( d ) + 8;

						if( GetElementTop( d ) < 150 )
						{
							break;
						}						
					}
					
					if( notties.length > 1 )
					{
						var remAll = document.createElement( 'div' );
						remAll.className = 'NotificationPopupElement BorderBottom';
						remAll.innerHTML = '\
							<div>\
								<div class="NotificationClose FloatRight fa-trash IconSmall"></div>\
								<p class="Layout"><strong>' + i18n( 'i18n_remove_all' ) + '</strong></p>\
							</div>';
						tray.notificationPopup.appendChild( remAll );
						remAll.onmousedown = function( e )
						{
							Workspace.notificationEvents = [];
							PollTray();
							cancelBubble( e );
						}
						// Cancel closing
						remAll.onmouseover = function( ev )
						{
							if( tray.notifications.timeout )
							{
								clearTimeout( tray.notifications.timeout );
								tray.notifications.timeout  = null;
							}
						}
						
						remAll.style.bottom = h + 'px';
					}
				}
				// No notifications?
				else 
				{
					// Remove blinking icon
					tray.notifications.classList.remove( 'Blink' );
					tray.notificationPopup.classList.remove( 'BubbleInfo' );
					tray.notifications.innerHTML = '';
					PollTray();
				}
			}
			repopulate();
			
			// When leaving, close
			tray.notificationPopup.onmouseout = function( ev )
			{
				if( tray.notifications.timeout )
				{
					clearTimeout( tray.notifications.timeout );
				}
				tray.notifications.timeout = setTimeout( function()
				{
					if( tray.notifications.removeChild && tray.notificationPopup && tray.notificationPopup.parentNode )
					{
						tray.notifications.removeChild( tray.notificationPopup );
						tray.notificationPopup = null;
						tray.notifications.timeout = null;
					}
				}, 250 );
			}
			
			return cancelBubble( e );
		}
	}
	// Remove icon indicator
	else if( tray.notifications )
	{
		tray.notifications.className = 'Hidden';
		tray.notifications.onclick = null;
	}
	
	/*
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
	}*/
}

function PollMobileTray()
{
	return false;
}

// Add notification event for safe keeping
function AddNotificationEvent( evt )
{
	var uniqueId = CryptoJS.SHA1( 
		'evt' + 
		( new Date() ).getTime() + 
		( Math.random() * 999 ) + 
		( Math.random() * 999 ) 
	).toString();
	evt.uniqueId = uniqueId;
	Workspace.notificationEvents.push( evt );
	//console.log( 'Added notification event.', evt );
	return uniqueId;
}

// Remove from list
function RemoveNotificationEvent( uniqueId )
{
	var o = [];
	var found = false;
	for( var a = 0; a < Workspace.notificationEvents.length; a++ )
	{
		if( Workspace.notificationEvents[ a ].uniqueId != uniqueId )
		{
			o.push( Workspace.notificationEvents[ a ] );
		}
		else
		{
			found = true;
		}
	}
	Workspace.notificationEvents = o;
	return found;
}

// Get a notification event
function GetNotificationEvent( uniqueId )
{
	for( var a = 0; a < Workspace.notificationEvents.length; a++ )
	{
		if( Workspace.notificationEvents[ a ].uniqueId == uniqueId )
			return Workspace.notificationEvents[ a ];
	}
	return false;
}

// The notifications -----------------------------------------------------------

// Notify!
function Notify( message, callback, clickcallback )
{
	if( !Workspace.notifications ) return;
	if( !message ) return;
	
	mobileDebug( 'Notify... (state ' + Workspace.currentViewState + ')', true );
	
	// Not active?
	if( Workspace.currentViewState != 'active' )
	{
		// Use native app
		if( window.friendApp )
		{
			return;
		}
		if( window.Notification )
		{
			mobileDebug( 'Showing desktop notification.' );
			
			// Desktop notifications
			function showNotification()
			{
				var not = new Notification( 
					message.title + "\n" + ( message.text ? message.text : '' )
				);
				not.onshow = function( e )
				{
					if( message.notificationId )
					{
						if( Workspace.currentViewState == 'active' && !Workspace.sleeping )
						{
							//console.log( 'Showing: ', message.notificationId );
							var l = new Library( 'system.library' );
							l.onExecuted = function(){};
							l.execute( 'mobile/updatenotification', { 
								notifid: message.notificationId, 
								action: 1,
								pawel: 10
							} );
						}
					}
					if( callback ) callback();
				}
				not.onclick = function( e )
				{
					window.focus();
					clickcallback( e );
				}
			}
			if( Notification.permission === 'granted' )
			{
				showNotification();
			}
			else if( Notification.permission !== 'denied' )
			{
				Notification.requestPermission().then( function( permission )
				{
					if( permission === 'granted' )
					{
						showNotification();
					}
				} );
			}
			return;
		}
	}
	
	if( !message.text ) message.text = message.body ? message.body : '';
	if( !message.title ) message.title = 'untitled'; 
	
	// The notification event
	var nev = {
		title: message.title,
		text: message.text,
		seen: false,
		time: ( new Date() ).getTime(),
		showCallback: callback,
		clickCallback: clickcallback
	};
	var notificationId = AddNotificationEvent( nev );

	// On mobile, we always show the notification on the Workspace screen
	if( isMobile )
	{
		mobileDebug( 'Showing mobile workspace notification.' );

		if( Workspace.currentViewState == 'active' )
		{
			if( !ge( 'MobileNotifications' ) )
			{
				var d = document.createElement( 'div' );
				d.className = 'Notification Mobile';
				d.id = 'MobileNotifications';
				ge( 'DoorsScreen' ).appendChild( d );
			}
			// On mobile it's always seen!
			nev.seen = true;
		
			// Since it is seen, then remove from server
			if( message.notificationId )
			{
				if( Workspace.currentViewState == 'active' && !Workspace.sleeping )
				{
					var l = new Library( 'system.library' );
					l.onExecuted = function(){};
					l.execute( 'mobile/updatenotification', { 
						notifid: message.notificationId, 
						action: 1,
						pawel: 11
					} );
				}
			}
		}
		
		var n = document.createElement( 'div' );
		n.className = 'MobileNotification BackgroundDefault ColorDefault';
		
		var ic = '';
		if( message.applicationIcon )
		{
			ic += '<img src="' + message.applicationIcon + '"/>';
		}
		if( message.application )
		{
			n.application = message.application;
			ic += '<span>' + message.application + '</span>';
		}
		if( ic.length )
			ic = '<div class="Application">' + ic + '</div>';
			
		n.innerHTML = ic + '<div class="Title">' + message.title + '</div><div class="Text">' + message.text + '</div>';
		
		// Check duplicate
		var found = false;
		for( var a = 0; a < ge( 'MobileNotifications' ).childNodes.length; a++ )
		{
			var nod = ge( 'MobileNotifications' ).childNodes[ a ];
			if( nod.application == message.application )
			{
				var num = parseInt( nod.getAttribute( 'notificationCount' ) );
				if( isNaN( num ) || !num ) num = 1;
				num++;
				nod.setAttribute( 'notificationCount', num );
				var existing = nod.querySelector( '.NotificationCount' );
				if( !existing )
				{
					var nc = document.createElement( 'div' );
					nc.className = 'NotificationCount';
					nc.innerHTML = num;
					nod.appendChild( nc );
				}
				else
				{
					existing.innerHTML = num;
				}
				nod.querySelector( '.Title' ).innerHTML = message.title;
				nod.querySelector( '.Text' ).innerHTML = message.text;
				n = nod;
				found = true;
				break;
			}
		}
		if( !found )
		{
			ge( 'MobileNotifications' ).appendChild( n );
		}
		else
		{
			clearTimeout( n.tm );
		}
		setTimeout( function(){ n.classList.add( 'Showing' ); }, 50 );
		n.close = function()
		{
			this.classList.remove( 'Showing' );
			n.tm = setTimeout( function()
			{
				if( n.parentNode )
					n.parentNode.removeChild( n );
			}, 250 );
		}
		
		// When clicking the bubble :)
		if( clickcallback )
		{
			n.ontouchend = function( e )
			{
				if( mousePointer.candidate && mousePointer.candidate.el == n && Math.abs( mousePointer.candidate.diff ) >= 10 )
				{
					n.style.position = '';
					n.style.left = '';
					n.style.top = '';
					n.style.width = '';
					n.style.height = '';
					clickcallback = null;
					return;
				}
				if( n.parentNode )
				{
					n.close();
					if( clickcallback && mousePointer.candidate && mousePointer.candidate.el == n )
					{
						clickcallback( e )
						RemoveNotificationEvent( notificationId );
					}
				}
				cancelBubble( e );
			};
		}
		else
		{
			n.ontouchend = function( e )
			{
				return cancelBubble( e );
			}
		}
		
		n.ontouchstart = function( e )
		{
			mousePointer.candidate = {
				cx: e.touches[0].clientX,
				cy: e.touches[0].clientY,
				ox: GetElementLeft( n ),
				oy: GetElementTop( n ),
				ow: n.offsetWidth,
				oh: n.offsetHeight,
				el: n,
				condition: function( e )
				{
					var diff = windowMouseX - this.cx;
					n.style.position = 'absolute';
					n.style.left = this.ox + diff + 'px';
					n.style.top = this.oy - 5 + 'px';
					n.style.width = this.ow + 'px';
					n.style.height = this.oh + 'px';
					this.diff = diff;
					
					if( Math.abs( diff ) > 100 )
					{
						mousePointer.candidate = null;
						n.close();
						
						// Function to set the notification as read...
						if( message.notificationId )
						{
							if( Workspace.currentViewState == 'active' && !Workspace.sleeping )
							{
								var l = new Library( 'system.library' );
								l.onExecuted = function(){};
								l.execute( 'mobile/updatenotification', { 
									notifid: message.notificationId, 
									action: 1,
									pawel: 12
								} );
							}
						}
					}
				}
			};
		};
		
		if( message.flags && message.flags.sticky )
		{
			n.addEventListener( 'touchend', function(){ if( n.parentNode ) n.close(); } );
		}
		else
		{
			setTimeout( function(){ if( n.parentNode ) n.close(); }, 8000 );
		}
		
		return;
	}
	
	// Poll the tray and look for notifications
	PollTray();
}
function CloseNotification( notification )
{
	var d = notification.childNodes[ 0 ];
	notification.removeChild( d ); 
	if( notification.getAttribute( 'label' ) )
	{
		notification.classList.remove( 'PopNotification' );
	}
	if( !notification.getElementsByTagName( 'div' ).length )
	{
		ge( 'Tray' ).removeChild( notification );
	}
	// Standard notifications can reply to notification origin
	// that the bubble did close
	if( d.struct && d.struct.onCloseBubble )
	{
		d.struct.onCloseBubble();
	}
}

// Buffer for click callbacks
var _oldNotifyClickCallbacks = [];

