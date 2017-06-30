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

/*******************************************************************************
*                                                                              *
* Wraps API calls through messages and carries them out                        *
*                                                                              *
* This file calls methods on real objects - not the proxy objects in api.js    *
*                                                                              *
*******************************************************************************/

// Main namespace
if( !window.friend ) window.friend = {};
friend = window.friend || {}
friend.iconsSelectedCount = 0;
friend.currentMenuItems = false;
friend.singleInstanceApps = [];

// Some global variables
var globalConfig = {};
globalConfig.language = 'en-US'; // Defaults to US english

// Handle callbacks
var apiWrapperCallbacks = [];
function addWrapperCallback( f )
{
	var uniqueId = ( new Date() ).getTime() + '_' + ( Math.random() * 1000 ) + ( Math.random() * 1000 );
	while( typeof( apiWrapperCallbacks[uniqueId] ) != 'undefined' )
		uniqueId += '_';
	apiWrapperCallbacks[uniqueId] = f;
	return uniqueId;
}

// Get the wrapper callback
function getWrapperCallback( uniqueId )
{
	if( typeof( apiWrapperCallbacks[uniqueId] ) != 'undefined' )
	{
		var func = apiWrapperCallbacks[uniqueId];
		var o = [];
		for( var a in apiWrapperCallbacks )
		{
			if( a != uniqueId )
				o[a] = apiWrapperCallbacks[a];
		}
		apiWrapperCallbacks = o;
		return func;
	}
	return false;
}

// Run a callback and remove from list
function runWrapperCallback( uniqueId, data )
{
	if( typeof( apiWrapperCallbacks[uniqueId] ) != 'undefined' )
	{
		apiWrapperCallbacks[uniqueId]( data );
		var o = [];
		for( var a in apiWrapperCallbacks )
		{
			if( a != uniqueId )
				o[a] = apiWrapperCallbacks[a];
		}
		apiWrapperCallbacks = o;
	}
}

// Make a callback function for an app based on a previous callback
function makeAppCallbackFunction( app, data )
{
	if( !app || !data ) return false;
	var nmsg = {};
	for( var b in data ) nmsg[b] = data[b];
	nmsg.type = 'callback'; nmsg = JSON.stringify( nmsg ); // Easy now, Satan. Calm down, please.
	return function(){ app.contentWindow.postMessage( nmsg, '*' ); }
}

// Native windows
var nativeWindows = [];

// Api wrapper main handler
function apiWrapper( event, force )
{
	// TODO: Origin
	if( !event && !event.data ) return false;
	
	var edi = -1, d = event.data;
	if( d.match( /^[a-z]*?\</i ) && ( edi = event.data.indexOf( '<!--separate-->' ) ) >= 0 )
		d = event.data.substr( 0, edi - 1 );
	if( !d.indexOf( '{' ) && !d.indexOf( '[' ) )
		return false;
	
	var msg = false;
	try
	{
		msg = JSON.parse( d );
	} catch(e) { console.log('Unexpected answer: ' + d, event.data ); }

	if( msg.type )
	{
		// Find application iframe
		var app = findApplication( msg.applicationId );
		if( force ) app = force; // <- Run with privileges
		if( !app ) 
		{
			//console.log( 'apiwrapper - found no app for ', msg );
			return false;
		}
		
		switch( msg.type )
		{
			// Friend Network --------------------------------------------------
			// TODO: Work no this!
			case 'friendnet':
				switch( msg.method )
				{
					case 'list':
						FriendNetwork.listHosts( {
							applicationName: msg.applicationName,
							applicationId: msg.applicationId,
							callback: function( data )
							{
								var cw = GetContentWindowByAppMessage( app, msg );
								var nmsg = {
									applicationId: msg.applicationId,
									applicationName: msg.applicationName,
									type: 'callback',
									callback: msg.callback,
									data: {command: 'friendnetwork', data: data}
								};
								cw.postMessage( JSON.stringify( nmsg ), '*' );
							}
						} );
						break;
					case 'connect':
						FriendNetwork.connectToHost( {
							applicationName: msg.applicationName,
							applicationId: msg.applicationId,
							name: msg.name,
							callback: function( data )
							{
								var cw = GetContentWindowByAppMessage( app, msg );
								var nmsg = {
									applicationId: msg.applicationId,
									applicationName: msg.applicationName,
									type: 'callback',
									callback: msg.callback,
									data: {command: 'friendnetwork', data: data}
								};
								cw.postMessage( JSON.stringify( nmsg ), '*' );
							}
						} );
						break;
					case 'dispose':
						FriendNetwork.disposeHosting( {
							applicationName: msg.applicationName,
							applicationId: msg.applicationId,
							name: msg.name,
							callback: function( data )
							{
								var cw = GetContentWindowByAppMessage( app, msg );
								var nmsg = {
									applicationId: msg.applicationId,
									applicationName: msg.applicationName,
									type: 'callback',
									callback: msg.callback,
									data: {command: 'friendnetwork', data: data}
								};
								cw.postMessage( JSON.stringify( nmsg ), '*' );
							}
						} );
						break;
					case 'send':
						FriendNetwork.send( {
							applicationName: msg.applicationName,
							applicationId: msg.applicationId,
							host: msg.host,
							event: msg.event,
							key: msg.key,
							callback: function( data )
							{
								var cw = GetContentWindowByAppMessage( app, msg );
								var nmsg = {
									applicationId: msg.applicationId,
									applicationName: msg.applicationName,
									type: 'callback',
									callback: msg.callback,
									data: { command: 'friendnetwork', data: data }
								};
								cw.postMessage( JSON.stringify( nmsg ), '*' );
							}
						} );
						break;
					case 'host':
						FriendNetwork.startHosting( {
							applicationName: msg.applicationName,
							applicationId: msg.applicationId,
							name: msg.name,
							callback: function( data )
							{
								var cw = GetContentWindowByAppMessage( app, msg );
								var nmsg = {
									applicationId: msg.applicationId,
									applicationName: msg.applicationName,
									type: 'callback',
									callback: msg.callback,
									data: { command: 'friendnetwork', data: data }
								};
								cw.postMessage( JSON.stringify( nmsg ), '*' );
							},
							listener: msg.listener
						} );
						break;
					// Add a new session and return key
					case 'addsession':
						var key = FriendNetwork.addSession(
							msg.applicationId,
							msg.name,
							'',
							msg.mode
						);
						var cw = GetContentWindowByAppMessage( app, msg );
						var nmsg = {
							applicationId: msg.applicationId,
							applicationName: msg.applicationName,
							type: 'callback',
							key: key,
							callback: msg.callback,
							data: { command: 'friendnetwork', key: key }
						};
						cw.postMessage( JSON.stringify( nmsg ), '*' );
					case 'getstatus':
						FriendNetwork.getStatus();
						break;
				}
				break;
			// Dormant ---------------------------------------------------------
			// TODO : permissions - does the app have persmission to:
			// 1: expose its own data
			// 2: pull from other exposed apps
			// - is it possible for applicationId to leak to other applications?
			case 'dormantmaster':
				
				switch( msg.method )
				{
					case 'execute':
						
						//find our door
						var door = false;
						for (var a = 0; a < DormantMaster.appDoors.length; a++)
						{
							if (DormantMaster.appDoors[a].title.toLowerCase() == msg.executable.split(':')[0].toLowerCase())
							{
								door = DormantMaster.appDoors[a];
							}
						}
						if (door)
						{
							var path = '';
							if (msg.executable.indexOf('/'))
							{
								path = msg.executable.split('/');
								path.pop();
								path = path.join('/');
							}
							else
							{
								path = msg.executable.split(':')[0] + ':';
							}
							door.getDirectory(path, function (data)
							{
								// Callback
								for (var b = 0; b < data.length; b++)
								{
									if ((data[b].Path + data[b].Title).toLowerCase() == msg.executable.toLowerCase())
									{
										data[b].Dormant.execute(data[b].Title, msg.dormantArgs);
									}
								}
								var ret = {
									applicationId: msg.applicationId,
									callbackId:    msg.callbackId,
									command:       'dormantmaster',
									method:        'callback',
									data:          data
								};
								
								if (msg.callback)
									runWrapperCallback(msg.callback, data);
							});
						}
						else
						{
							if (msg.callback)
								runWrapperCallback(msg.callback, false);
						}
						break;
					// Make a connection to the friend network
					case 'connectfriendnetwork':
						DormantMaster.connectFriendNetworkTo( {
							applicationName: msg.applicationName,
							applicationId: msg.applicationId,
							callback: function( data )
							{
								var cw = GetContentWindowByAppMessage( app, msg );
								var nmsg = {
									applicationId: msg.applicationId,
									applicationName: msg.applicationName,
									type: 'callback',
									callback: msg.callback,
									data: {command: 'friendnetwork', data: data}
								};
								cw.postMessage( JSON.stringify( nmsg ), '*' );
							}
						} );
						break;
					// Disconnect now!
					case 'disconnectfriendnetwork':
						DormantMaster.disconnectFriendNetworkFrom( {
							applicationName: msg.applicationName,
							applicationId: msg.applicationId,
							callback: function( data )
							{
								var cw = GetContentWindowByAppMessage( app, msg );
								var nmsg = {
									applicationId: msg.applicationId,
									applicationName: msg.applicationName,
									type: 'callback',
									callback: msg.callback,
									data: {command: 'friendnetwork', data: data}
								};
								cw.postMessage( JSON.stringify( nmsg ), '*' );
							}
						} );
						break;
					case 'callback':
						if( msg.callbackId && msg.data )
						{
							//find our door
							var door = false;
							for (var a = 0; a < DormantMaster.appDoors.length; a++)
							{
								if (DormantMaster.appDoors[a].doorId == msg.doorId)
								{
									door = DormantMaster.appDoors[a];
								}
							}
							// If we have a viable door, use it
							if (door)
							{
								for (var a = 0; a < msg.data.length; a++)
								{
									msg.data[a].Dormant = door;
								}
								runWrapperCallback(msg.callbackId, msg.data);
							}
						}
						break;
					case 'addevent':
						DormantMaster.addEvent(msg);
						break;
					case 'pollevent':
						DormantMaster.pollEvent(msg);
						break;
					case 'delappevents':
						DormantMaster.delApplicationEvents(msg.applicationName);
						break;
						// Make proxy object
					case 'addAppDoor':
						
						// Make sure we have a unique name!
						var num = 0;
						var nam = msg.title;
						var namnum = nam;
						var found;
						do
						{
							found = false;
							for (var a = 0; a < DormantMaster.appDoors.length; a++)
							{
								if (DormantMaster.appDoors[a].title.toLowerCase() == namnum.toLowerCase())
								{
									namnum = nam + '.' + (++num);
									found = true;
									break;
								}
							}
						}
						while (found);
						
						var doorObject = {
							title:         namnum,
							doorId:        msg.doorId,
							applicationId: msg.applicationId,
							getDoor:       function ()
										   {
											   var icon = 'apps/' + msg.title + '/icon.png';
											   if (app && app.config.IconDoor)
												   icon = app.config.IconDoor;
											   return {
												   MetaType: 'Meta',
												   Title:    namnum + ':', /* remove this from all references*/
												   Filename: namnum + ':',
												   IconFile: icon,
												   Position: 'left',
												   Module:   'files',
												   Command:  'dormant',
												   Filesize: 4096,
												   Flags:    '',
												   Type:     'Dormant',
												   Dormant:  this
											   };
										   },
							addWindow:     function (win)
										   {
											   this.windows.push(win);
										   },
							getDirectory:  function (t, callback)
										   {
											   var id = addWrapperCallback(callback);
											   // Callback
											   var ret = {
												   applicationId: msg.applicationId,
												   doorId:        msg.doorId,
												   callbackId:    id,
												   command:       'dormantmaster',
												   method:        'getdirectory',
												   path:          t
											   };
											   if (msg.viewId) ret.viewId = msg.viewId;
											   app.contentWindow.postMessage(
													   JSON.stringify(ret), '*'
											   );
										   },
							// Execute a dormant command!
							execute:       function (command, args)
										   {
											   var id = addWrapperCallback(function (data)
											   {
												   //
											   });
											   // Callback
											   var ret = {
												   applicationId:  msg.applicationId,
												   doorId:         msg.doorId,
												   callbackId:     id,
												   command:        'dormantmaster',
												   method:         'execute',
												   dormantCommand: command,
												   dormantArgs:    args
											   };
											   if (msg.viewId) ret.viewId = msg.viewId;
											   app.contentWindow.postMessage(
													   JSON.stringify(ret), '*'
											   );
										   },
							windows:       []
							
						};
						if (msg.viewId) doorObject.viewId = msg.viewId;
						
						// Add the appdoor
						DormantMaster.addAppDoor(doorObject);
						
						// Callback
						var ret = {
							applicationId: msg.applicationId,
							doorId:        msg.doorId,
							data:          'success',
							command:       'dormantmaster',
							method:        'updatetitle',
							title:         msg.title,
							realtitle:     namnum
						};
						if (msg.viewId) ret.viewId = msg.viewId;
						app.contentWindow.postMessage(
								JSON.stringify(ret), '*'
						);
						break;
						// Silent deletion
					case 'deleteAppDoor':
						DormantMaster.delAppDoor(msg.title);
						break;
						// Get a list of doors
					case 'getDoors':
						var doors = DormantMaster.getDoors();
						// Callback
						var ret = {
							applicationId: msg.applicationId,
							callbackId:    msg.callbackId,
							command:       'dormantmaster',
							method:        'callback',
							data:          doors
						};
						if (msg.viewId) ret.viewId = msg.viewId;
						app.contentWindow.postMessage(
								JSON.stringify(jsonSafeObject(ret)), '*'
						);
						break;
					case 'getDirectory':
						//find our door
						var door = false;
						for (var a = 0; a < DormantMaster.appDoors.length; a++)
						{
							if (DormantMaster.appDoors[a].title == msg.path.split(':')[0])
							{
								door = DormantMaster.appDoors[a];
							}
						}
						if (door)
						{
							door.getDirectory(msg.path, function (data)
							{
								// Make sure the "files" have doorid 
								// TODO: Is this safe? Other way of doing it?
								for (var a in data)
									data[a].doorId = door.doorId;
								// Callback
								var ret = {
									applicationId: msg.applicationId,
									callbackId:    msg.callbackId,
									command:       'dormantmaster',
									method:        'callback',
									data:          data
								};
								if (msg.viewId) ret.viewId = msg.viewId;
								app.contentWindow.postMessage(
										JSON.stringify(jsonSafeObject(ret)), '*'
								);
							});
						}
						break;
				}
				break;
				
				// Notify ----------------------------------------------------------
				// Ok, the iframe was loaded!? Check data
			case 'notify':
				if (app.windows && app.windows[msg.viewId])
				{
					app.windows[msg.viewId].sendMessage({
						command: 'notify'
					});
					// Execute the loaded function to carry out queued events..
					if (app.windows[msg.viewId].iframe)
						app.windows[msg.viewId].iframe.loaded = true;
					app.windows[msg.viewId].executeSendQueue();
					
					// Try to execute register callback function
					if (msg.registerCallback)
						runWrapperCallback(msg.registerCallback);
				}
				// We got notify without a window (shell application or main app win no window)
				else
				{
					// Try to execute register callback function
					if (msg.registerCallback)
						runWrapperCallback(msg.registerCallback);
				}
				break;
				// Screens ---------------------------------------------------------
			case 'screen':
				var screenId = msg.screenId;
				// Existing screen
				if (msg.method && app.screens && app.screens[msg.screenId])
				{
					var scr = app.screens[msg.screenId];
					switch (msg.method)
					{
							// Pass a message to actual window
						case 'sendMessage':
						case 'sendmessage': // inconsistent camel case
							if (scr)
							{
								scr.sendMessage(msg.data);
							}
							break;
						case 'screentofront':
							if (scr)
							{
								scr.screenToFront();
							}
							break;
						case 'setContent':
							if (scr)
							{
								// Create a new callback dispatch here..
								var cb = false;
								if (msg.callback)
									cb = makeAppCallbackFunction(app, msg);
								
								// Do the setting!
								var domain = GetDomainFromConf(app.config);
								scr.setContentIframed(msg.data, domain, msg, cb);
								
								// Remove callback here - it will be handled by setcontentiframed
								// as it is asyncronous
								msg.callback = false;
							}
							break;
						case 'setRichContentUrl':
							if (scr) scr.setRichContentUrl(msg.url, msg.base, msg.applicationId, msg.filePath);
							break;
						case 'setMenuItems':
							if (scr)
							{
								scr.setMenuItems(msg.data, msg.applicationId, msg.screenId);
							}
							CheckScreenTitle();
							break;
							// Receive a close request from below
						case 'close':
							if (scr)
							{
								scr.close(1);
								var out = [];
								for (var c in app.screens)
									if (c != msg.screenId)
										out[c] = app.screens[c];
								app.screen = out;
							}
							break;
						case 'activate':
							workspaceMenu.close();
							break;
					}
				}
				// don't trigger on method
				else if (!msg.method)
				{
					// Try to open a window
					msg.data.screenId = msg.screenId;
					msg.data.applicationId = msg.applicationId;
					msg.data.authId = msg.authId;
					msg.data.applicationName = app.applicationName;
					msg.data.applicationDisplayName = app.applicationDisplayName;
					var v = new Screen(msg.data);
					if (v.ready)
					{
						if (!app.screens)
							app.screens = [];
						app.screens[screenId] = v;
						
						// Assign conf if it exists on app object
						if (app.conf) v.conf = app.conf;
						
						// This is the external id
						v.externScreenId = screenId;
						
						var nmsg = {
							applicationId: msg.applicationId,
							viewId:      msg.id ? msg.id : false,
							type:          'callback',
							command:       'screenresponse',
							data:          'ok'
						};
						app.contentWindow.postMessage(
								JSON.stringify(nmsg), '*'
						);
					}
					// Call back to say the window was not correctly opened
					else
					{
						var nmsg = {
							applicationId: msg.applicationId,
							viewId:      msg.id ? msg.id : false,
							type:          'callback',
							command:       'screenresponse',
							data:          'fail'
						};
						app.contentWindow.postMessage(
								JSON.stringify(nmsg), '*'
						);
					}
					
					// Setup window keyboard handler
					v.handleKeys = function (k)
					{
						// If it was only done!
					}
				}
				break;
				// View ------------------------------------------------------------
			case 'view':
				var viewId = msg.viewId;
				if (msg.method && app.windows && app.windows[msg.viewId])
				{
					var win = app.windows[msg.viewId];
					switch (msg.method)
					{
							// Pass a message to actual window
						case 'sendMessage':
						case 'sendmessage': // inconsistent camel case
							if (win)
							{
								win.sendMessage(msg.data);
							}
							break;
							
							// Receive a close request from below
						case 'close':
							if (win)
							{
								win.close(1);
								var out = [];
								for (var c in app.windows)
									if (c != msg.viewId)
										out[c] = app.windows[c];
								app.windows = out;
							}
							else
							{
								console.log('can not find window!');
							}
							break;
						case 'setFlag':
							if (win) win.setFlag(msg.data.flag, msg.data.value);
							break;
						case 'setFlags':
							if (win)
							{
								win.setFlags(msg.data);
							}
							break;
						case 'setContent':
							if (win)
							{
								// Create a new callback dispatch here..
								var cb = false;
								if (msg.callback)
								{
									cb = makeAppCallbackFunction(app, msg);
								}
								
								// Do the setting!
								var domain = GetDomainFromConf(app.config);
								win.setContentIframed(msg.data, domain, msg, cb);
								
								// Remove callback here - it will be handled by setcontentiframed
								// as it is asyncronous
								msg.callback = false;
							}
							break;
						case 'setContentById':
							if (win)
							{
								// Remember callback
								var cb = false;
								if (msg.callback)
									cb = makeAppCallbackFunction(app, msg);
								
								win.setContentById(msg.data, msg, cb);
								
								msg.callback = false;
							}
							break;
						case 'setAttributeById':
							if (win) win.setAttributeById(msg);
							break;
						case 'getAttributeById':
							if (win)
							{
								// Do it, and call back
								win.getAttributeById(msg, function (c)
								{
									// TODO: Implement it (callback to send attribute value back)
								});
							}
							break;
						case 'setSandboxedUrl':
							if (win) win.setSandboxedUrl(msg);
							break;
						case 'setRichContent':
							if (win)
								win.setRichContent(msg.data);
							break;
						case 'setRichContentUrl':
							if (win)
								win.setRichContentUrl(msg.url, msg.base, msg.applicationId, msg.filePath);
							break;
						case 'getContentById':
							if (win)
							{
								var c = win.getContentById(msg.identifier, msg.flag);
								if (c)
								{
									app.contentWindow.postMessage(JSON.stringify({
										command: 'view',
										method:  'getSubContent',
										data:    c.innerHTML
									}), '*');
								}
							}
							break;
							// Adds an event by class and runs callback function
						case 'addEventByClass':
							if (win)
							{
								win.addEventByClass(msg.className, msg.event, function (e)
										{
											app.contentWindow.postMessage(JSON.stringify({
												command:  'callback',
												callback: msg.callback,
												data:     false
											}), '*');
										}
								);
							}
							break;
						case 'focusOnElement':
							if (win)
							{
								win.focusOnElement(msg.identifier, msg.flag);
							}
							break;
						case 'setMenuItems':
							if (win)
								win.setMenuItems(msg.data, msg.applicationId, msg.viewId);
							
							CheckScreenTitle();
							break;
						case 'focus':
							if (win)
							{
								win.focus();
							}
							break;
						case 'activate':
							if (win)
							{
								win.activate();
							}
							workspaceMenu.close();
							break;
					}
				}
				// don't trigger on method
				else if (!msg.method)
				{
					// Try to open a window
					msg.data.viewId = msg.viewId;
					msg.data.applicationId = msg.applicationId;
					msg.data.authId = msg.authId;
					msg.data.applicationName = app.applicationName;
					msg.data.applicationDisplayName = app.applicationDisplayName;
					
					// Redirect to the real screen
					if (msg.data.screen && app && app.screens[msg.data.screen])
					{
						msg.data.screen = app.screens[msg.data.screen];
					}
					else
					{
						msg.data.screen = null;
					}
					
					var v = new View(msg.data);
					var win = msg.parentViewId && app.windows ? app.windows[msg.parentViewId] : false;
					if (win)
					{
						v.parentViewId = msg.parentViewId;
					}
					if (v.ready)
					{
						if (!app.windows)
							app.windows = [];
						app.windows[viewId] = v;
						
						// Assign conf if it exists on app object
						if (app.conf) v.conf = app.conf;
						
						// This is the external id
						v.externViewId = viewId;
						
						var nmsg = {
							applicationId: msg.applicationId,
							viewId:      msg.id ? msg.id : false,
							type:          'callback',
							command:       'viewresponse',
							data:          'ok'
						};
						app.contentWindow.postMessage(
								JSON.stringify(nmsg), '*'
						);
					}
					// Call back to say the window was not correctly opened
					else
					{
						var nmsg = {
							applicationId: msg.applicationId,
							viewId:      msg.id ? msg.id : false,
							type:          'callback',
							command:       'viewresponse',
							data:          'fail'
						};
						app.contentWindow.postMessage(
								JSON.stringify(nmsg), '*'
						);
					}
					
					// Setup window keyboard handler
					v.handleKeys = function (k)
					{
						//
					}
				}
				break;
			// Widget ---------------------------------------------------------
			case 'widget':
				var widgetId = msg.widgetId;
				if ( msg.method && app.widgets && app.widgets[ msg.widgetId ] )
				{
					var wid = app.widgets[ msg.widgetId ];
					switch ( msg.method )
					{
						// Pass a message to actual window
						case 'sendMessage':
						case 'sendmessage': // inconsistent camel case
							if ( wid )
							{
								wid.sendMessage( msg.data );
							}
							break;
						case 'setFlag':
							if( wid ) wid.setFlag( msg.data.flag, msg.data.value );
							break;
						case 'setContent':
							if ( wid )
							{
								// Create a new callback dispatch here..
								var cb = false;
								if ( msg.callback )
								{
									cb = makeAppCallbackFunction( app, msg );
								}
								
								// Do the setting!
								var domain = GetDomainFromConf( app.config );
								wid.setContentIframed( msg.data, domain, msg, cb );
								
								// Remove callback here - it will be handled by setcontent
								// as it is asyncronous
								msg.callback = false;
							}
							break;
						case 'raise':
							if ( wid )
								wid.raise();
							break;
						case 'lower':
							if ( wid )
								wid.lower();
							break;
						case 'show':
							if ( wid )
								wid.show();
							break;
						case 'hide':
							if ( wid )
								wid.hide();
							break;
						case 'autosize':
							if ( wid )
								wid.autosize();
							break;
						case 'close':
							if( wid )
							{
								console.log( 'Closing widget.' );
								wid.close();
								// Remove widget from list
								var w = [];
								for (var a in app.widgets)
									if (app.widget[a] != wid)
										w.push(app.widget[a]);
								app.widgets = w;
							}
							else
							{
								console.log( 'Could not find widget!' );
							}
							break;
					}
				}
				// don't trigger on method
				else if ( !msg.method )
				{
					var v = new Widget( msg.data );
					
					// We might need these
					v.applicationId = msg.applicationId;
					v.authId = msg.authId;
					v.applicationDisplayName = msg.applicationDisplayName;
					v.applicationName = msg.applicationName;
					
					if (!app.widgets) app.widgets = [];
					app.widgets[widgetId] = v;
					
					var nmsg = {
						applicationId: msg.applicationId,
						widgetId:      msg.id ? msg.id : false,
						type:          'callback',
						command:       'widgetresponse',
						data:          'ok'
					};
					app.contentWindow.postMessage(
						JSON.stringify(nmsg), '*'
					);
				}
				// Call back to say the window was not correctly opened
				else
				{
					var nmsg = {
						applicationId: msg.applicationId,
						widgetId:      msg.id ? msg.id : false,
						type:          'callback',
						command:       'widgetresponse',
						data:          'fail'
					};
					app.contentWindow.postMessage(
							JSON.stringify(nmsg), '*'
					);
				}
				break;
			// File ------------------------------------------------------------
			// TODO : Permissions - only check local filesystems?
			// Are there admin only filesystems?
			case 'file':
			
				// Some paths come as filenames obviously..
				if( !msg.data.path && msg.data.filename && msg.data.filename.indexOf( ':' ) > 0 )
					msg.data.path = msg.data.filename;
					
				// Perhaps do error?					
				if( msg.data.path && msg.data.path.toLowerCase && msg.data.path.toLowerCase().substr( 0, 8 ) != 'progdir:' && msg.data.path.indexOf( ':' ) > 0 )
				{
					if( !checkAppPermission( app.authId, 'Door Local' ) )
					{
						console.log( 'Permission denied to local filesystems!' );
						return false;
					}
				}
			
				if( typeof( msg.data.path ) == 'undefined' )
				{
					console.log( 'Empty path..' );
					return false;
				}
			
				var fileId = msg.fileId;
				
				// Make real file object
				var f = new File( msg.data.path );
				f.application = app;
				// TODO: This should be in the application from the start
				if( !f.application.filePath )
					f.application.filePath = msg.filePath;
				
				// Add variables
				if( msg.vars )
				{
					for( var a in msg.vars )
						f.addVar( a, msg.vars[a] );
				}
				
				// Respond with file contents (uses raw data..)
				if( msg.method == 'load' )
				{
					f.onLoad = function( data )
					{
						// Fallback
						if( !data && this.rawdata )
							data = this.rawdata;
							
						// File loads should remain in their view context
						var cw = GetContentWindowByAppMessage( app, msg );
							
						if( app && cw )
						{
							var nmsg = { command: 'fileload', fileId: fileId, data: data };
							// Pass window id down
							if( msg.viewId )
							{
								nmsg.viewId = msg.viewId;
								nmsg.type     = 'callback';
							}
							if( msg.screenId )
							{
								nmsg.screenId = msg.screenId;
								nmsg.type = 'callback';
							}
							if( Workspace.authId )
								nmsg.authId = Workspace.authId;
							cw.postMessage( JSON.stringify( nmsg ), '*' );
						}
					}
					f.load();
				}
				else if( msg.method == 'call' )
				{
					f.onCall = function( data )
					{
						// Fallback
						if( !data && this.rawdata )
							data = this.rawdata;
							
						// File loads should remain in their view context
						var cw = GetContentWindowByAppMessage( app, msg );
							
						if( app && cw )
						{
							var nmsg = { command: 'fileload', fileId: fileId, data: data };
							// Pass window id down
							if( msg.viewId )
							{
								nmsg.viewId = msg.viewId;
								nmsg.type     = 'callback';
							}
							if( msg.screenId )
							{
								nmsg.screenId = msg.screenId;
								nmsg.type = 'callback';
							}
							if( Workspace.authId )
								nmsg.authId = Workspace.authId;
							cw.postMessage( JSON.stringify( nmsg ), '*' );
						}
					}
					f.call( msg.vars.query, msg.vars );
				}
				else if( msg.method == 'post' )
				{
					f.onPost = function( result )
					{
						// File posts should remain in their view context
						var cw = GetContentWindowByAppMessage( app, msg );
						
						if( app && cw )
						{
							var nmsg = { command: 'filepost', fileId: fileId, result: result };
							// Pass window id down
							if( msg.viewId )
							{
								nmsg.viewId = msg.viewId;
								nmsg.type     = 'callback';
							}
							if( msg.screenId )
							{
								nmsg.screenId = msg.screenId;
								nmsg.type = 'callback';
							}
							cw.postMessage( JSON.stringify( nmsg ), '*' );
						}
					}
					// Assume base64 encoded data string
					try
					{
						f.post( Base64.decode( msg.data.data ), msg.data.filename );
					}
					// No? Try without..
					catch( e )
					{
						f.post( msg.data.data, msg.data.filename );
					}
				}
				else if( msg.method == 'save' )
				{
					// Respond with save data notification
					f.onSave = function()
					{
						// File saves should remain in their view context
						var cw = GetContentWindowByAppMessage( app, msg );
						if( app && cw )
						{
							var nmsg = { command: 'filesave', fileId: fileId };
							// Pass window id down
							if( msg.viewId )
							{
								nmsg.viewId = msg.viewId;
								nmsg.type     = 'callback';
							}
							if( msg.screenId )
							{
								nmsg.screenId = msg.screenId;
								nmsg.type = 'callback';
							}
							cw.postMessage( JSON.stringify( nmsg ), '*' );
						}
					}
					f.save( msg.data.data, msg.data.path );
				}
				
				break;
			// Shell API -------------------------------------------------------
			case 'shell':
				if( msg.command )
				{
					var shell = false;
					if( msg.shellSession )
					{
						shell = FriendDOS.getSession( msg.shellSession );
					}
					if( !shell ) 
					{
						return false;
					}
					switch( msg.command )
					{
						case 'execute':
							shell.execute( msg.commandLine, function( rmsg, returnMessage )
							{
								// TODO: Finish the test if rmsg has become safe!
								if( app && app.contentWindow )
								{
									var nmsg = { 
										command: 'shell', 
										shellId: msg.shellId, 
										shellSession: shell.uniqueId, 
										shellNumber: shell.number,
										applicationId: msg.applicationId,
										authId: msg.authId,
										pipe: shell.applicationPipe,
										callbackId: msg.callbackId,
										data: jsonSafeObject( rmsg ) // Make it safe!
									};
									if( returnMessage ) nmsg.returnMessage = returnMessage;
									// Pass window id down
									if( msg.viewId )
									{
										nmsg.viewId = msg.viewId;
										nmsg.type = 'callback';
									}
									app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
								}
								else
								{
									console.log( 'Nothing to do callback on!' );
								}
							} );
							break;
						case 'evaluate':
							shell.evaluate( msg.input, function( rmsg, returnMessage )
							{
								// TODO: Finish the test if rmsg has become safe!
								if( app && app.contentWindow )
								{
									var nmsg = {
										command: 'shell',
										shellId: msg.shellId,
										shellSession: shell.uniqueId,
										shellNumber: shell.number,
										applicationId: msg.applicationId,
										authId: msg.authId,
										pipe: shell.applicationPipe,
										callbackId: msg.callbackId,
										data: jsonSafeObject( rmsg ) // Make it safe!
									};
									if( returnMessage ) nmsg.returnMessage = returnMessage;
									// Pass window id down
									if( msg.viewId )
									{
										nmsg.viewId = msg.viewId;
										nmsg.type = 'callback';
									}
									app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
								}
								else
								{
									console.log( 'Nothing to do callback on!' );
								}
							} );
							break;
						case 'close':
							FriendDOS.delSession( msg.shellSession );
							break;
					}
				}
				// Handle methods and callbacks
				else if( msg.method && msg.shellId )
				{
					var shell = FriendDOS.getSession( msg.shellId );
					if( shell )
					{
						switch( msg.method )
						{
							case 'callback':
								var cfunc = runWrapperCallback( msg.callbackId, msg.data );
								break;
						}
						return;
					}
				}
				else
				{
					var shell = FriendDOS.addSession( app, false );
					var sh = FriendDOS.getSession( shell );
					sh.applicationPipe = msg.pipe; // Pipe to application
					if( app && app.contentWindow )
					{
						var nmsg = { 
							command: 'shell', 
							shellId: msg.shellId, 
							shellNumber: sh.number,
							shellSession: shell, 
							applicationId: msg.applicationId,
							authId: msg.authId
						};
						// Pass window id down
						if( msg.viewId )
						{
							nmsg.viewId = msg.viewId;
							nmsg.type = 'callback';
						}
						app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
					}
				}
				break;
			// Module ----------------------------------------------------------
			case 'module':
				var fileId = msg.fileId;
				
				// Perhaps do error?
				if( msg.module.toLowerCase() != 'system' && msg.module.toLowerCase() != 'files' )
				{
					if( !checkAppPermission( app.authId, 'Module ' + msg.module.charAt( 0 ).toUpperCase()+msg.module.substr( 1 ).toLowerCase() ) )
					{
						console.log( 'Permission denied!' );
						return false;
					}
				}
				
				// Make real module object
				var f = new Module( msg.module );
				f.application = app;
				
				// Add variables
				if( msg.vars )
				{
					for( var a in msg.vars )
						f.addVar( a, msg.vars[a] );
				}
				
				// Respond with file contents (uses raw data..)
				f.onExecuted = function( cod, dat )
				{
					if( app )
					{
						var nmsg = { command: 'fileload', fileId: fileId, data: dat, returnCode: cod };
						
						// Module calls should remain in their view context
						var cw = GetContentWindowByAppMessage( app, msg );
						
						// Pass window id down
						if( msg.viewId )
						{
							nmsg.viewId = msg.viewId;
							nmsg.type = 'callback';
						}
						if( cw )
							cw.postMessage( JSON.stringify( nmsg ), '*' );
					}
				}
				f.execute( msg.method, msg.args );
				break;
			// Doors -----------------------------------------------------------
			case 'door':
				switch( msg.method )
				{
					case 'init':
						var d = new Door( msg.path );
						// Trigger callback
						var info = d.get( msg.path );
						msg.handler = info.handler;
						app.contentWindow.postMessage( JSON.stringify( msg ), '*' );
						// Abort further
						return;
					// Get icons from a real Door object
					case 'geticons':
						var info = ( new Door() ).get( msg.path );
						if( info )
						{
							// Is this info qualified?
							if( info.path || info.deviceName )
							{
								info.setPath( msg.path );
								info.getIcons( false, function( icons )
								{
									if( icons )
										msg.data = JSON.stringify( jsonSafeObject( icons ) );
									else msg.data = false;
									app.contentWindow.postMessage( JSON.stringify( msg ), '*' );
								} );
								return;
							}
						}
						// Give negative response - works as it should...
						msg.data = false;
						app.contentWindow.postMessage( JSON.stringify( msg ), '*' );
						return;
				}
				break;
			// PouchDB ---------------------------------------------------------
			case 'pouchdb' : 
				console.log( 'pouchdb', msg );
				var pdbEvent = msg.data;
				if ( !Workspace.pouchManager )
				{
					var err = {
						callback  : pdbEvent.data.cid,
						data : {
							success      : false,
							errorMessage : 'No pouch manager',
						},
					};
					if ( app.contentWindow && app.contentWindow.postMessage )
						app.contentWindow.postMessage( err, '*' );
				} else
					Workspace.pouchManager.handle( pdbEvent, app );
					
				break;
			// ApplicationStorage ----------------------------------------------
			// TODO : permissions - should apps be able to store data? how much?
			// TODO : api for checking how much is stored, total and per app
			case 'applicationstorage':
				ApplicationStorage.receiveMsg( msg, app );
				break;
			// Authenticate ----------------------------------------------
			case 'authenticate':
				Authenticate.receiveMsg( msg, app );
				break;
			// Calendar
			// TODO - Permissions :
			// 1 can app read events?
			// 2 can app set events?
			case 'calendar' :
				var action = msg.data;
				if ( 'add' !== action.type ) {
					done( false, 'unknown type: ' + action.type , action.data.cid );
					return;
				}
				
				var data = action.data;
				var title = app.applicationName + ' wants to add a calendar event';
				Confirm( title, data.message, confirmBack );
				function confirmBack( accept ) {
					if ( accept )
						addCalendarEvent( data.event );
					else {
						done( false, 'event denied', data.cid );
					}
				}
				
				function addCalendarEvent( event ) {
					var mod = new Module( 'system' );
					mod.onExecuted = eventAdded;
					mod.execute( 'addcalendarevent', { event : event });
					function eventAdded( ok, res ) {
						done( 'ok' === ok, res, data.cid );
					}
				}
				
				function done( ok, res, cid ) {
					if ( !cid )
						return;
					
					var res = {
						ok       : ok,
						res      : res,
						callback : cid,
					};
					app.contentWindow.postMessage( res, '*' );
				}
				break;
				
			// post back to whatever tab opened this tab - specialcase for treeroot / friend
			// to have live chat using hello
			case 'postout':
				console.log( 'postout', msg );
				if( !window.opener || !window.opener.postMessage )
				{
					console.log( 'window.opener.postMessage not available - dropping:', msg );
					return;
				}
				
				window.opener.postMessage( msg.data, '*' );
				break;
			case 'fconn':
				if( !Workspace.conn )
				{
					console.log( 'Workspace.conn - websocket not enabled, aborting' );
					return;
				}
				
				if ( 'register' === msg.method )
				{
					// hacky check to unregister if it already exists
					// should be done when an application closes.
					// - actually, this stuff should be a permission
					var regId = Workspace.conn.registeredApps[ app.authId ];
					if ( regId )
						Workspace.conn.off( app.authId, regId );
					
					var id = Workspace.conn.on( app.authId, fconnMsg );
					Workspace.conn.registeredApps[ app.authId ] = id;
					requestBack( true );
					return;
					
					function fconnMsg( msg )
					{
						var wrap = {
							command: 'fconn',
							data: msg
						};
						if ( app.contentWindow && app.contentWindow.postMessage ) {
							//console.log( 'fconnMsg, posting msg to app', wrap );
							app.contentWindow.postMessage( wrap, '*' );
						}
					}
				}
				
				if( 'remove' === msg.method )
				{
					var regId = Workspace.conn.registeredApps[ app.authId ];
					Workspace.conn.off( app.authId, regId );
					return;
				}
				
				var wrap = {
					path : msg.data.path,
					authId : app.authId,
					data : msg.data.data,
				};
				
				if( 'request' === msg.method )
					Workspace.conn.request( wrap, requestBack );
				else
					Workspace.conn.send( wrap );
				
				function requestBack( res )
				{
					msg.data = res;
					msg.type = 'callback';
					msg.callback = msg.callbackId;
					if ( app.contentWindow && app.contentWindow.postMessage )
						app.contentWindow.postMessage( msg, '*' );
				}
				break;
			// System calls!
			// TODO: Permissions, not all should be able to do this!
			case 'system':
				var app = false;
				if( msg.applicationId )
					app = findApplication( msg.applicationId );
				// TODO: Permissions!!!
				// permission should probably be checked per command?
				switch( msg.command )
				{
					case 'setsingleinstance':
						// Add to single instances
						if( app && msg.value == true && !friend.singleInstanceApps[ app.applicationName ] )
						{
							friend.singleInstanceApps[ app.applicationName ] = app;
						}
						// Remove from single instances
						else if( app && msg.value == false )
						{
							var out = [];
							for( var a in friend.singleInstanceApps )
							{
								if( a != app.applicationName )
									out[a] = friend.singleInstanceApps[a];
							}
							friend.singleInstanceApps = out;
						}
						break;
					case 'setclipboard':
						ClipboardSet( ( msg.value ? msg.value : '' ), ( msg.updatesystem ? true : false ) );
						break;
					case 'applicationname':
						if( app ) 
						{
							app.applicationDisplayName = msg.applicationname;
							for( var a = 0; a < Workspace.applications.length; a++ )
							{
								if( app.applicationId == Workspace.applications[a].applicationId )
								{
									Workspace.applications[a].applicationDisplayName = app.applicationDisplayName;
									break;
								}
							}
							var eles = ge( 'Tasks' ).getElementsByClassName( 'AppSandbox' );
							for( var a = 0; a < eles.length; a++ )
							{
								if( eles[a].ifr.applicationId == app.applicationId )
								{
									eles[a].getElementsByClassName( 'Taskname' )[0].innerHTML = app.applicationDisplayName;
									break;
								}
							}
						}
						break;
					case 'notification':
						var nmsg = {};
						for( var a in msg ) nmsg[a] = msg[a];
						nmsg.locale = Workspace.locale;
						var cw = GetContentWindowByAppMessage( app, msg );
						if( cw )
						{
							var ccb = false;
							if( nmsg.clickcallback )
							{
								var vmsg = {};
								for( var a in nmsg ) vmsg[a] = nmsg[a];
								vmsg.method = 'notification';
								vmsg.callback = nmsg.clickcallback;
								vmsg.data = 'clicked';
								ccb = function()
								{
									cw.postMessage( JSON.stringify( vmsg ), '*' );
								}
							}
						
							Notify( { 
								title: ( msg.title? msg.title.split( /\<[^>]*?\>/ ).join( '' ) : '' ), 
								text: ( msg.text ? msg.text.split( /\<[^>]*?\>/ ).join( '' ) : '' ), application: app ? app.applicationName : '' }, function()
							{
								cw.postMessage( JSON.stringify( nmsg ), '*' );
							}, ccb );
						}
						msg.callback = false;
						break;
					case 'getlocale':
						var nmsg = {};
						for( var a in msg ) nmsg[a] = msg[a];
						nmsg.locale = Workspace.locale;
						var cw = GetContentWindowByAppMessage( app, msg );
						if( cw )
						{
							cw.postMessage( JSON.stringify( nmsg ), '*' );
						}
						msg.callback = false;
						break;
					case 'alert':
						Alert( msg.title, msg.string );
						break;
					case 'confirm':
						var nmsg = {};
						for( var a in msg ) nmsg[a] = msg[a];
						Confirm( msg.title, msg.string, function( data )
						{
							if( app )
							{
								nmsg.type = 'callback';
								nmsg.data = data;
								nmsg.command = 'callback';
								
								// Module calls should remain in their view context
								var cw = GetContentWindowByAppMessage( app, msg );
						
								// Pass window id down
								if( nmsg.viewId )
								{
									nmsg.viewId = msg.viewId;
								}
								if( cw ) cw.postMessage( JSON.stringify( nmsg ), '*' );
							}
						} );
						msg.callback = false;
						break;
					
					case 'reload_user_settings':
						Workspace.refreshUserSettings();
						break;
						
					case 'change_application_permissions':
						// TODO: This will bring up the user authentication window first!!!!
						// TODO: The user must allow, because the app does not have this permission!
						var m = new Module( 'system' );
						m.onExecuted = function( e, d )
						{
							// Tell app!
							var rmsg = {
								command: 'updateapppermissions',
								result: e
							};
							app.contentWindow.postMessage( JSON.stringify( rmsg ), '*' );
						}
						m.execute( 'updateapppermissions', { application: msg.application, data: msg.data, permissions: JSON.stringify( msg.permissions ) } );
						break;
						
					case 'updatelogin':
						Workspace.login( msg.username, msg.password, true );
						break;
					case 'reloadmimetypes':
						Workspace.reloadMimeTypes();
						break;
					case 'getopenscreens':
						if( app )
						{
							var screens = [];
							var s = ge( 'Screens' );
							var sl = s.getElementsByTagName( 'div' );
							for( var a = 0; a < sl.length; a++ )
							{
								if( sl[a].parentNode != s ) continue;
								if( !sl[a].className || sl[a].className.indexOf( 'Screen' ) < 0 )
									continue;
								screens.push( { id: sl[a].id, title: sl[a].screenObject._flags['title'] } );
							}
							var nmsg = {}; for( var a in msg ) nmsg[a] = msg[a];
							nmsg.screens = screens;
							app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
						}
						break;
					case 'switchscreens':
						_globalScreenSwap();
						break;
					case 'nativewindow':
						if( app && msg.viewId )
						{
							// Prepare response
							var nmsg = {}; for( var a in msg ) nmsg[a] = msg[a];
							nmsg.command = 'nativewindowresponse';
							
							switch( msg.action )
							{
								case 'open':
									if( !msg.url ) msg.url = '';
									if( !msg.specs ) msg.specs = false;
									nmsg.response = 'fail';
									if( nativeWindows[msg.viewId] = window.open( msg.url, msg.viewId, msg.specs ) )
										nmsg.response = 'ok';
									app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
									break;
								case 'close':
									nmsg.response = 'fail';
									if( nativeWindows[msg.viewId] )
									{
										nativeWindows[msg.viewId].close();
										// Clean house
										var nw = [];
										for( var a in nativeWindows )
										{
											if( a != msg.viewId )
												nw[a] = nativeWindows[a];
										}
										nativeWindows = nw;
										nmsg.response = 'ok';
									}
									app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
									break;
							}
						}
						break;
					case 'wallpaperimage':
						if( msg.mode == 'doors' )
						{
							Workspace.wallpaperImage = msg.image;
						}
						else
						{
							Workspace.windowWallpaperImage = msg.image;
						}
						Workspace.refreshDesktop();
						break;
					case 'savewallpaperimage':
						var m = new Module( 'system' );
						m.onExecuted = function( e )
						{
							if( e == 'ok' )
							{
								if( msg.mode == 'doors' )
								{
									Workspace.wallpaperImage = msg.image;
								}
								else
								{
									Workspace.windowWallpaperImage = msg.image;
								}
								Workspace.refreshDesktop();
							}
						}
						m.execute( 'setsetting', { setting: 'wallpaper' + msg.mode, data: msg.image } );
						break;
					// Set the local storage variable
					case 'setlocalstorage':
						
						break;
					// Get the local storage variable
					case 'getlocalstorage':
					
						break;
					case 'refreshtheme':
						Workspace.refreshTheme( msg.theme, true );
						break;
					// Save application state
					case 'savestate':
						var m = new Module( 'system' );
						m.onExecuted = function( e, d ) { } // <- callback or so?? probably not..
						m.execute( 'savestate', { state: msg.state, authId: msg.authId } );
						break;
					case 'quit':
						if( app ) app.quit( msg.force ? msg.force : false );
						if( PollTray ) PollTray();
						break;
					case 'kill':
						if( app )
						{
							if( msg.appName )
							{
								KillApplication( msg.appName );
							}
							else if( msg.appId )
							{
								KillApplicationById( msg.appId );
							}
							else app.quit( 1 ); // quit with FORCE == 1!
						}
						break;
					case 'break':
						if( app )
						{
							var quitit = false;
							// TODO: Make this happen on num
							if( msg.appNum )
							{
								for( var a = 0; a < Workspace.applications.length; a++ )
								{
									var app = Workspace.applications[a];
									if( app.applicationNumber == msg.appNum )
									{
										app.contentWindow.postMessage( JSON.stringify( {
											applicationId: app.applicationId,
											command: 'notify',
											method: 'closewindow'
										} ), '*' );
										quitit = true;
									}
								}
							}
							if( !quitit )
							{
								app.quit( 1 ); // quit with FORCE == 1!
							}
						}
						break;
					// TODO: Permissions, not all should be able to do this!
					case 'listapplications':
						var nmsg = msg;
						var d = Workspace.listApplications();
						if( msg.callbackId )
						{
							var list = 'No running processes.';
							if( d.length )
							{
								list = '';
								for( var a = 0; a < d.length; a++ )
								{
									list += d[a].applicationNumber + '. ' + d[a].name + '<br/>';
								}
								list = { response: list };
							}
							var df = getWrapperCallback( msg.callbackId );
							return df( d ? true : false, list );
						}
						else nmsg.data = d;
						app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
						break;
					case 'refreshdocks':
						Workspace.reloadDocks();
						break;
					case 'refreshdoors':
						Workspace.refreshDesktop( false, true );
						break;
					case 'executeapplication':
						// TODO: Make "can run applications" permission
						if( 1 == 1 )
						{
							var nmsg = msg;
							function cb( response )
							{
								nmsg.method = response ? 'applicationexecuted' : 'applicationnotexecuted';
								app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
								
								if( nmsg.callback )
								{
									runWrapperCallback( nmsg.callback, response );
								}
							}
							// Special case
							if( msg.path && msg.path.split( ':' )[0] == 'System' )
							{
								// Special case!
								var out = WorkspaceDormant.execute( msg.executable, msg.arguments );
								cb( out );
							}
							else
							{
								ExecuteApplication( msg.executable, msg.args, cb );
							}
							msg = null;
						}
						break;
					case 'librarycall':
						var j = new cAjax();
						var ex = '';
						if( msg.func ) 
						{
							ex += msg.func + '/';
							if( msg.args )
							{
								if( typeof( msg.args ) == 'string' )
								{
									ex += msg.args;
								}
								else if( typeof( msg.args ) == 'object' )
								{
									for( var a in msg.args )
									{
										if( a == 'command' )
											ex += msg.args[a];
										else
										{
											if( typeof( msg.args[a] ) == 'object' )
											{
												j.addVar( a, JSON.stringify( msg.args[a] ) );
											}
											else j.addVar( a, msg.args[a] );
										}
									}
								}
							}
							// Optional vars
							if( msg.vars )
							{
								for( var a in msg.vars )
									j.addVar( a, msg.vars[a] );
							}
						}
						j.open( 'post', '/' + msg.library + '/' + ex, true, true );
						if( !msg.args || ( msg.args && !msg.args.skipsession ) )
							j.addVar( 'sessionid', Workspace.sessionId );
						j.onload = function( rc, dt )
						{
							var nmsg = msg;
							nmsg.command = 'libraryresponse';
							nmsg.returnCode = rc;
							nmsg.returnData = dt;
							var cw = GetContentWindowByAppMessage( app, msg );
							if( cw ) cw.postMessage( JSON.stringify( nmsg ), '*' );
							else app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
						}
						j.send();
						break;
					// File dialogs ----------------------------------------------------
					case 'filedialog':
						var win = app.windows ? app.windows[msg.viewId] : false;
						var tar = win ? app.windows[msg.targetViewId] : false; // Target for postmessage
						var d = new Filedialog( win, function( data )
						{
							var nmsg = msg;
							nmsg.data = data;
							if( tar )
								tar.iframe.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							else app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
						}, msg.path, msg.dialogType, msg.filename, msg.title );
						break;
				}
				break;
		}
		// Check global callback function
		if( msg && msg.callback )
		{
			var nmsg = {};
			for( var b in msg )
				nmsg[b] = msg[b];
			nmsg.type = 'callback';
			app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
		}
	}
	// TODO: Check the flow here, to prevent infinite loops
	// Reroute message from the deep!
	else if( msg && msg.applicationId )
	{
		var app = findApplication( msg.applicationId );
		if( !app )
			return false;
		
		// Sometimes we want to send to a pre determined view by id.
		if( msg.destinationViewId )
		{
			var cw = GetContentWindowById( app, msg.destinationViewId );
			if( cw )
			{
				cw.postMessage( JSON.stringify( msg ), '*' );
			}
			return;
		}
		app.contentWindow.postMessage( JSON.stringify( msg ), '*' );
	}
}

/* Magic clipboard code ----------------------------------------------------- */

friend.clipboard = '';
friend.macCommand = false;

document.addEventListener( 'keydown', function( e )
{
	var wh = e.which ? e.which : e.keyCode;
	var t = e.target ? e.target : e.srcElement;
	
	if( wh == 91 )
	{
		friend.macCommand = true;
	}
			
	if( e.ctrlKey || friend.macCommand )
	{
		if( wh == 86 )
		{
			if( friend.clipboard.length && friend.clipboard != '' && friend.clipboard.charCodeAt( 0 ) != 1 )
			{
				if( ClipboardPasteIn( t, friend.clipboard ) )
				{
					return cancelBubble( e );
				}
			}
			dispatchEvent( t, 'paste' );
		}
		else if( wh == 67 || wh == 88 )
		{
			ClipboardSet( ClipboardGetSelectedIn( t ) );
		}
	}
} );

document.addEventListener( 'keyup', function( e )
{
	var wh = e.which ? e.which : e.keyCode;
	if( wh == 91 ) friend.macCommand = false;
} );


document.addEventListener( 'paste', function( evt )
{
	var mimetype = '';
	var cpd = '';
	if( evt.clipboardData && evt.clipboardData.types.indexOf( 'text/plain' ) > -1 )
	{
		mimetype = 'text/plain';
	}

	//we only do text handling here for now
	if( mimetype != '' )
	{
		cpd = evt.clipboardData.getData( mimetype );
	
		//console.log('compare old and new in apirwrapper. new data: ',cpd,'friend prev:',friend.prevClipboard,'friend clipboard:',friend.clipboard);
		if( friend.prevClipboard != cpd )
		{
			friend.clipboard = cpd;
		}		
	}
	if( typeof Application != 'undefined' ) Application.sendMessage( { type: 'system', command: 'setclipboard', value: friend.clipboard } );
	return true;
} );

// Set the clipboard
function ClipboardSet( text, updatesystem )
{
	if( text == '' ) return;
	if( friend.clipboard == text ) return;
	
	friend.prevClipboard = friend.clipboard;
	friend.clipboard = text;
	
	for( var a = 0; a < Workspace.applications.length; a++ )
	{
		var app = Workspace.applications[a];
		app.contentWindow.postMessage( JSON.stringify( {
			applicationId: app.applicationId,
			command: 'updateclipboard',
			value: friend.clipboard
		} ), '*' );
	}
	for( var a in movableWindows )
	{
		var ifr = movableWindows[a].getElementsByTagName( 'iframe' )[0];
		if( !ifr ) continue;
		ifr.contentWindow.postMessage( JSON.stringify( {
			command: 'updateclipboard',
			value: friend.clipboard
		} ), '*' );
	}
	
	//ask user if he want to make this clipboard global
	if( updatesystem ) ClipboardToClientSystem();
	
	
}

function ClipboardToClientSystem()
{
	if( friend.clipboardWidget )
	{
		//....
	}
	else
	{
		o = {
			width: 480,
			height: 200,
			valign: 'center',
			halign: 'center',
			scrolling: false,
			autosize: true
		};
		friend.clipboardWidget = new Widget( o );		
	}

	friend.clipboardWidget.dom.innerHTML = '<div class="Padding"><h3>'+ i18n('i18n_copy_to_system_clipboard_headline') +'</h3><span>' + i18n('i18n_copy_to_system_clipboard') + '</span><textarea id="clipBoardWidgetTA" class="Rounded BackgroundNegative Padding FullWidth Negative" style="box-shadow: inset 0px 2px 10px rgba(0,0,0,0.4); border: 0; margin: 10px 0 10px 0; overflow: hidden; opacity:0.5;height: 80px;">'+ friend.clipboard +'</textarea><button class="IconSmall Button fa-check" onclick="CopyClipboardToClientSystem()"> &nbsp;'+ i18n('i18n_yes') +'</button><button class="IconSmall Button fa-remove" onclick="CancelCopyClipboardToClientSystem()"> &nbsp;'+ i18n('i18n_negative') +'</button></div>';
	friend.clipboardWidget.raise();
	friend.clipboardWidget.show();
	

}
function CopyClipboardToClientSystem( evt )
{
	myslave = ge('clipBoardWidgetTA');
	myslave.focus();
	myslave.select();
	var success = false;	
	
	try {
		myslave.focus();
		success = document.execCommand( 'copy' );
	} catch( e ) {
		console.log( 'failed to copy to clippy', e );
	}
	
	if( friend.clipboardWidget )
	{
		myslave.blur();
		ge('clipBoardWidgetTA').parentNode.removeChild( ge('clipBoardWidgetTA') );
		friend.clipboardWidget.hide();
	}
}

function CancelCopyClipboardToClientSystem()
{
	if( friend.clipboardWidget )
	{
		ge('clipBoardWidgetTA').parentNode.removeChild( ge('clipBoardWidgetTA') );
		friend.clipboardWidget.hide();
	}
}

// Copy from select area to clipboard
function ClipboardGetSelectedIn( ele )
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
function ClipboardPasteIn( ele, text )
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

// Find application storage object
function findApplication( applicationId )
{
	for( var a = 0; a < Workspace.applications.length; a++ )
	{
		if( Workspace.applications[a].applicationId == applicationId )
			return Workspace.applications[a];
	}
	return false;
}

/* We need these global keys ------------------------------------------------ */

// Only for our friends
if ( window.addEventListener )
{
	window.addEventListener ( 'keydown', function ( e )
	{
		if ( !e ) e = window.event;
		var k = e.which | e.keyCode;
		if ( k == 113 && e.shiftKey )
		{
			if ( typeof ( ShowLauncher ) != 'undefined' )
			{
				ShowLauncher ();
			}
			return cancelBubble ( e );
		}
		// Switch screens
		else if( k == 77 && e.ctrlKey )
		{
			_globalScreenSwap();
			return cancelBubble( e );
		}
		// Main screen
		else if( k == 78 && e.ctrlKey )
		{
			return _globalScreenSwap( 'DoorsScreen' );
		}
	});
	
	// Temporary to get message events on page load for login outside using an iframe
	window.addEventListener ( 'message', function ( e )
	{
		if ( !e ) e = window.event;
		
		if( e.data && e.data.command == 'login' )
		{
			var args = {
				'keys'     : false,
				'username' : false,
				'password' : false,
				'remember' : false,
				'callback' : false,
				'event'    : false
			};
			
			for( key in e.data )
			{
				if( e.data[key] && typeof args[key] !== 'undefined' )
				{
					args[key] = e.data[key];
				}
			}
			
			console.log( 'Workspace.login() from window.addEventListener: ', args );
			
			Workspace.login( args.username, args.password, args.remember, args.callback, args.event );
		}
	});
}

// Global screen swap
function _globalScreenSwap( id )
{
	if( window.currentScreen )
	{
		if( !id )
		{
			return window.currentScreen.screen.screenCycle();
		}
		else
		{
			// TODO
			console.log( 'Swapping a screen by id.' );
		}
	}
}

// Do the app have the permission?
function checkAppPermission( authid, permission, value )
{
	var eles = ge( 'Tasks' ).getElementsByTagName( 'iframe' );
	for( var a = 0; a < eles.length; a++ )
	{
		if( eles[a].authId == authid )
		{
			// JSX apps have all rights..
			if( eles[a].applicationType && eles[a].applicationType == 'jsx' )
				return true;
			
			for( var b = 0; b < eles[a].permissions.length; b++ )
			{
				if( eles[a].permissions[b][0] == permission )
				{
					if( value )
					{
						if( eles[a].permissions[b][1] == value )
						{
							return true;
						}
						return false;
					}
					return true;
				}
			}
		}
	}
	return false;
}

function GetContentWindowByAppMessage( app, msg )
{
	var cw = app;
	// Pass window id down
	if( msg.viewId )
	{
		if( app.windows[msg.viewId] )
		{
			cw = app.windows[msg.viewId].iframe;
		}
		/*else
		{
			cw = app;
			console.log( '---------------------------' );
			console.log( app, msg );
			console.log( '..........' );
		}*/
	}
	if( cw.contentWindow )
		return cw.contentWindow;
	return false;
}

function GetContentWindowById( app, id )
{
	var cw = app;
	if( app.windows[id] )
	{
		cw = app.windows[id].iframe;
	}
	if( cw.contentWindow ) return cw.contentWindow;
	return false;
}

// Add Css by url
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
