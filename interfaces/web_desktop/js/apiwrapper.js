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

/*******************************************************************************
*                                                                              *
* Wraps API calls through messages and carries them out                        *
*                                                                              *
* This file calls methods on real objects - not the proxy objects in api.js    *
*                                                                              *
*******************************************************************************/

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
	nmsg.type = 'callback'; nmsg = JSON.stringify( nmsg );
	return function(){ app.contentWindow.postMessage( nmsg, '*' ); }
}

// Native windows
var nativeWindows = [];

// Api wrapper main handler
function apiWrapper( event, force )
{
	// TODO: Origin
	var msg = JSON.parse( event.data );
	if( msg.type )
	{
		// Find application iframe
		var app = findApplication( msg.applicationId );
		if( force ) app = force; // <- Run with privileges
		if( !app ) 
		{
			console.log( 'apiwrapper - found no app for ', msg );
			return false;
		}
		
		switch( msg.type )
		{
			// Dormant ---------------------------------------------------------
			case 'dormantmaster':
				
				switch( msg.method )
				{
					case 'execute':
						
						//find our door
						var door = false;
						for( var a = 0; a < DormantMaster.appDoors.length; a++ )
						{
							if( DormantMaster.appDoors[a].title.toLowerCase() == msg.executable.split(':')[0].toLowerCase() )
							{
								door = DormantMaster.appDoors[a];
							}
						}
						if( door )
						{
							var path = '';
							if( msg.executable.indexOf( '/' ) )
							{
								path = msg.executable.split( '/' );
								path.pop();
								path = path.join( '/' );
							}
							else 
							{
								path = msg.executable.split( ':' )[0] + ':';
							}
							door.getDirectory( path, function( data )
							{
								// Callback
								for( var b = 0; b < data.length; b++ )
								{
									if( (data[b].Path+data[b].Title).toLowerCase() == msg.executable.toLowerCase() )
									{
										data[b].Dormant.execute( data[b].Title, msg.dormantArgs );
									}
								}
								var ret = {
									applicationId: msg.applicationId,
									callbackId: msg.callbackId,
									command: 'dormantmaster',
									method: 'callback',
									data: data
								};
								
								if( msg.callback )
									runWrapperCallback( msg.callback, data );
							} );
						}
						else
						{
							if( msg.callback )
								runWrapperCallback( msg.callback, false );
						}
						break;
					case 'callback':
						if( msg.callbackId && msg.data )
						{
							//find our door
							var door = false;
							for( var a = 0; a < DormantMaster.appDoors.length; a++ )
							{
								if( DormantMaster.appDoors[a].doorId == msg.doorId )
								{
									door = DormantMaster.appDoors[a];
								}
							}
							// If we have a viable door, use it
							if( door )
							{
								for( var a = 0; a < msg.data.length; a++ )
								{
									msg.data[a].Dormant = door;
								}
								runWrapperCallback( msg.callbackId, msg.data );
							}
						}
						break;
					case 'addevent':
						DormantMaster.addEvent( msg );
						break;
					case 'pollevent':
						DormantMaster.pollEvent( msg );
						break;
					case 'delappevents':
						DormantMaster.delApplicationEvents( msg.applicationName );
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
							for( var a = 0; a < DormantMaster.appDoors.length; a++ )
							{
								if( DormantMaster.appDoors[a].title.toLowerCase() == namnum.toLowerCase() )
								{
									namnum = nam + '.' + (++num);
									found = true;
									break;
								}
							}
						}
						while( found );
					
						var doorObject = {
							title: namnum,
							doorId: msg.doorId,
							applicationId: msg.applicationId,
							getDoor: function()
							{ 
								return {
									MetaType: 'Meta',
									Title: namnum + ':', /* remove this from all references*/
									Filename: namnum + ':',
									IconFile: 'apps/' + msg.title + '/icon.png',
									Position: 'left',
									Module: 'files',
									Command: 'dormant',
									Filesize: 4096,
									Flags: '',
									Type: 'Dormant',
									Dormant: this
								};
							},
							addWindow: function( win )
							{
								this.windows.push( win );
							},
							getDirectory: function( t, callback )
							{
								var id = addWrapperCallback( callback );
								// Callback
								var ret = {
									applicationId: msg.applicationId,
									doorId: msg.doorId,
									callbackId: id,
									command: 'dormantmaster',
									method: 'getdirectory',
									path: t
								};
								if( msg.windowId ) ret.windowId = msg.windowId;
								app.contentWindow.postMessage( 
									JSON.stringify( ret ), '*'
								);
							},
							// Execute a dormant command!
							execute: function( command, args )
							{
								var id = addWrapperCallback( function( data )
								{
									//
								} );
								// Callback
								var ret = {
									applicationId: msg.applicationId,
									doorId: msg.doorId,
									callbackId: id,
									command: 'dormantmaster',
									method: 'execute',
									dormantCommand: command,
									dormantArgs: args
								};
								if( msg.windowId ) ret.windowId = msg.windowId;
								app.contentWindow.postMessage( 
									JSON.stringify( ret ), '*'
								);
							},
							windows: []
							
						};
						if( msg.windowId ) doorObject.windowId = msg.windowId;
				
						// Add the appdoor
						DormantMaster.addAppDoor( doorObject );
				
						// Callback
						var ret = {
							applicationId: msg.applicationId,
							doorId: msg.doorId,
							data: 'success',
							command: 'dormantmaster',
							method: 'updatetitle',
							title: msg.title,
							realtitle: namnum
						};
						if( msg.windowId ) ret.windowId = msg.windowId;
						app.contentWindow.postMessage( 
							JSON.stringify( ret ), '*'
						);
						break;
					// Silent deletion
					case 'deleteAppDoor':
						DormantMaster.delAppDoor( msg.title );
						break;
					// Get a list of doors
					case 'getDoors':
						var doors = DormantMaster.getDoors();
						// Callback
						var ret = {
							applicationId: msg.applicationId,
							callbackId: msg.callbackId,
							command: 'dormantmaster',
							method: 'callback',
							data: doors
						};
						if( msg.windowId ) ret.windowId = msg.windowId;
						app.contentWindow.postMessage( 
							JSON.stringify( jsonSafeObject( ret ) ), '*'
						);
						break;
					case 'getFolder':
						//find our door
						var door = false;
						for( var a = 0; a < DormantMaster.appDoors.length; a++ )
						{
							if( DormantMaster.appDoors[a].title == msg.path.split(':')[0] )
							{
								door = DormantMaster.appDoors[a];
							}
						}
						if( door )
						{
							door.getDirectory( msg.path, function( data )
							{
								// Make sure the "files" have doorid 
								// TODO: Is this safe? Other way of doing it?
								for( var a in data )
									data[a].doorId = door.doorId;
								// Callback
								var ret = {
									applicationId: msg.applicationId,
									callbackId: msg.callbackId,
									command: 'dormantmaster',
									method: 'callback',
									data: data
								};
								if( msg.windowId ) ret.windowId = msg.windowId;
								app.contentWindow.postMessage( 
									JSON.stringify( jsonSafeObject( ret ) ), '*'
								);
							} );
						}
						break;
				}
				break;
			
			// Notify ----------------------------------------------------------
			// Ok, the iframe was loaded!? Check data
			case 'notify':
				if( app.windows && app.windows[msg.windowId] )
				{
					app.windows[msg.windowId].sendMessage( {
						command: 'notify'
					} );
					// Execute the loaded function to carry out queued events..
					if( app.windows[msg.windowId].iframe )
						app.windows[msg.windowId].iframe.loaded = true;
					app.windows[msg.windowId].executeSendQueue();
					
					// Try to execute register callback function
					if( msg.registerCallback )
						runWrapperCallback( msg.registerCallback );
				}
				// We got notify without a window (shell application or main app win no window)
				else
				{
					// Try to execute register callback function
					if( msg.registerCallback )
						runWrapperCallback( msg.registerCallback );
				}
				break;
			// Screens ---------------------------------------------------------
			case 'screen':
				var screenId = msg.screenId;
				// Existing screen
				if( msg.method && app.screens && app.screens[msg.screenId] )
				{
					var scr = app.screens[msg.screenId];
					switch( msg.method )
					{
						// Pass a message to actual window
						case 'sendMessage':
						case 'sendmessage': // inconsistent camel case
							if( scr ) 
							{
								scr.sendMessage( msg.data );
							}
							break;
						case 'screentofront':
							if( scr )
							{
								scr.screenToFront();
							}
							break;
						case 'setContent':
							if( scr ) 
							{
								// Create a new callback dispatch here..
								var cb = false;
								if( msg.callback )
									cb = makeAppCallbackFunction( app, msg );
								
								// Do the setting!
								scr.setContentIframed( msg.data, false, msg, cb );
								
								// Remove callback here - it will be handled by setcontentiframed
								// as it is asyncronous
								msg.callback = false;
							}
							break;
						case 'setRichContentUrl':
							if( scr ) scr.setRichContentUrl( msg.url, msg.base, msg.applicationId, msg.filePath );	
							break;
						case 'setMenuItems':
							if( scr )
							{
								scr.setMenuItems( msg.data, msg.applicationId );
							}
							CheckScreenTitle();
							break;
						// Receive a close request from below
						case 'close':
							if( scr )
							{
								scr.close( 1 );
								var out = [];
								for( var c in app.screens )
									if( c != msg.screenId )
										out[c] = app.screens[c];
								app.screen = out;
							}
							break;
						case 'activate':
							closeWorkbenchMenu();
							break;
					}
				}
				// don't trigger on method
				else if( !msg.method )
				{
					// Try to open a window
					msg.data.screenId = msg.screenId;
					msg.data.applicationId = msg.applicationId;
					msg.data.authId = msg.authId;
					msg.data.applicationName = app.applicationName;
					var v = new Screen( msg.data );
					if( v.ready )
					{
						if( !app.screens )
							app.screens = [];
						app.screens[screenId] = v;
						
						// Assign conf if it exists on app object
						if( app.conf ) v.conf = app.conf;
						
						// This is the external id
						v.externScreenId = screenId;
						
						var nmsg = {
							applicationId: msg.applicationId,
							windowId:      msg.id ? msg.id : false,
							type:          'callback',
							command:       'screenresponse',
							data:          'ok'
						};
						app.contentWindow.postMessage( 
							JSON.stringify( nmsg ), '*'
						);
					}
					// Call back to say the window was not correctly opened
					else
					{
						var nmsg = {
							applicationId: msg.applicationId,
							windowId:      msg.id ? msg.id : false,
							type:          'callback',
							command:       'screenresponse',
							data:          'fail'
						};
						app.contentWindow.postMessage( 
							JSON.stringify( nmsg ), '*'
						);
					}
					
					// Setup window keyboard handler
					v.handleKeys = function( k )
					{
						// If it was only done!
					}
				}
				break;
			// View ------------------------------------------------------------
			case 'view':
				var windowId = msg.windowId;
				if( msg.method && app.windows && app.windows[msg.windowId] )
				{
					var win = app.windows[msg.windowId];
					switch( msg.method )
					{
						// Pass a message to actual window
						case 'sendMessage':
						case 'sendmessage': // inconsistent camel case
							if( win ) 
							{
								win.sendMessage( msg.data );
							}
							break;
						
						// Receive a close request from below
						case 'close':
							if( win )
							{
								win.close( 1 );
								var out = [];
								for( var c in app.windows )
									if( c != msg.windowId )
										out[c] = app.windows[c];
								app.windows = out;
							}
							else
							{
								console.log( 'can not find window!' );
							}
							break;
						case 'setFlag':
							if( win ) win.setFlag( msg.data.flag, msg.data.value );
							break;
						case 'setFlags':
							if( win ) 
							{	
								win.setFlags( msg.data );
							}
							break;
						case 'setContent':
							if( win ) 
							{
								// Create a new callback dispatch here..
								var cb = false;
								if( msg.callback )
								{
									cb = makeAppCallbackFunction( app, msg );
								}
								
								// Do the setting!
								win.setContentIframed( msg.data, false, msg, cb );
								
								// Remove callback here - it will be handled by setcontentiframed
								// as it is asyncronous
								msg.callback = false;
							}
							break;
						case 'setSandboxedContent':
							if ( win ) win.setSandboxedContent( msg );
							break;
						case 'setSandboxedUrl':
							if ( win ) win.setSandboxedUrl( msg );
							break;
						case 'setContentById':
							if( win ) 
							{
								// Remember callback
								var cb = false;
								if( msg.callback )
									cb = makeAppCallbackFunction( app, msg );
								
								win.setContentById( msg.data, msg, cb );
								
								msg.callback = false;
							}
							break;
						case 'setAttributeById':
							if( win ) win.setAttributeById( msg );
							break;
						case 'getAttributeById':
							if( win ) 
							{
								// Do it, and call back
								win.getAttributeById( msg, function( c )
								{
									// TODO: Implement it (callback to send attribute value back)
								} );
							}
							break;
						case 'setRichContent':
							if( win ) win.setRichContent( msg.data );
							break;
						case 'setRichContentUrl':
							if( win ) win.setRichContentUrl( msg.url, msg.base, msg.applicationId, msg.filePath );	
							break;
						case 'getContentById':
							if( win )
							{
								var c = win.getContentById( msg.identifier, msg.flag );
								if( c )
								{
									app.contentWindow.postMessage( JSON.stringify( {
										command: 'view',
										method:  'getSubContent',
										data:    c.innerHTML
									} ), '*' );
								}
							}
							break;
						// Adds an event by class and runs callback function
						case 'addEventByClass':
							if( win ) 
							{
								win.addEventByClass( msg.className, msg.event, function( e )
								{
									app.contentWindow.postMessage( JSON.stringify( {
										command: 'callback',
										callback: msg.callback,
										data: false
									} ), '*' );
								} 
								);
							}
							break;
						case 'focusOnElement':
							if( win ) 
							{
								win.focusOnElement( msg.identifier, msg.flag );
							}
							break;
						case 'setMenuItems':
							if( win ) win.setMenuItems( msg.data, msg.applicationId );
							CheckScreenTitle();
						case 'focus':
							if( win )
							{
								win.focus();
							}
							break;
						case 'activate':
							if( win ) 
							{
								win.activate();
							}
							closeWorkbenchMenu();
							break;
					}
				}
				// don't trigger on method
				else if( !msg.method )
				{
					// Try to open a window
					msg.data.windowId = msg.windowId;
					msg.data.applicationId = msg.applicationId;
					msg.data.authId = msg.authId;
					msg.data.applicationName = app.applicationName;
					
					// Redirect to the real screen
					if( msg.data.screen && app && app.screens[msg.data.screen] )
					{
						msg.data.screen = app.screens[msg.data.screen];
					}
					else
					{
						msg.data.screen = null;
					}
					
					var v = new View( msg.data );
					if( v.ready )
					{
						if( !app.windows )
							app.windows = [];
						app.windows[windowId] = v;
						
						// Assign conf if it exists on app object
						if( app.conf ) v.conf = app.conf;
						
						// This is the external id
						v.externWindowId = windowId;
						
						var nmsg = {
							applicationId: msg.applicationId,
							windowId:      msg.id ? msg.id : false,
							type:          'callback',
							command:       'viewresponse',
							data:          'ok'
						};
						app.contentWindow.postMessage( 
							JSON.stringify( nmsg ), '*'
						);
					}
					// Call back to say the window was not correctly opened
					else
					{
						var nmsg = {
							applicationId: msg.applicationId,
							windowId:      msg.id ? msg.id : false,
							type:          'callback',
							command:       'viewresponse',
							data:          'fail'
						};
						app.contentWindow.postMessage( 
							JSON.stringify( nmsg ), '*'
						);
					}
					
					// Setup window keyboard handler
					v.handleKeys = function( k )
					{
						//
					}
				}
				break;
			// File ------------------------------------------------------------
			case 'file':
			
				// Perhaps do error?
				if( !checkAppPermission( app.authId, 'Door Local' ) )
				{
					console.log( 'Permission denied to local filesystems!' );
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
							
						var cw = GetContentWindowByAppMessage( app, msg );
							
						if( app && cw )
						{
							var nmsg = { command: 'fileload', fileId: fileId, data: data };
							// Pass window id down
							if( msg.windowId )
							{
								nmsg.windowId = msg.windowId;
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
					f.load();
				}
				else if( msg.method == 'post' )
				{
					f.onPost = function( result )
					{
						var cw = GetContentWindowByAppMessage( app, msg );
						
						if( app && cw )
						{
							var nmsg = { command: 'filepost', fileId: fileId, result: result };
							// Pass window id down
							if( msg.windowId )
							{
								nmsg.windowId = msg.windowId;
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
						f.post( msg.data.filename, Base64.decode( msg.data.data ) );
					}
					// No? Try without..
					catch( e )
					{
						f.post( msg.data.filename, msg.data.data );
					}
				}
				else if( msg.method == 'save' )
				{
					// Respond with save data notification
					f.onSave = function()
					{
						var cw = GetContentWindowByAppMessage( app, msg );
						if( app && cw )
						{
							var nmsg = { command: 'filesave', fileId: fileId };
							// Pass window id down
							if( msg.windowId )
							{
								nmsg.windowId = msg.windowId;
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
					f.save( msg.data.path, msg.data.data );
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
										callbackId: msg.callbackId,
										data: jsonSafeObject( rmsg ) // Make it safe!
									};
									if( returnMessage ) nmsg.returnMessage = returnMessage;
									// Pass window id down
									if( msg.windowId )
									{
										nmsg.windowId = msg.windowId;
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
				else
				{
					var shell = FriendDOS.addSession( app, false );
					var sh = FriendDOS.getSession( shell );
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
						if( msg.windowId )
						{
							nmsg.windowId = msg.windowId;
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
				if( !checkAppPermission( app.authId, 'Module ' + msg.module.charAt( 0 ).toUpperCase()+msg.module.substr( 1 ).toLowerCase() ) )
				{
					console.log( 'Permission denied!' );
					return false;
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
						
						var cw = GetContentWindowByAppMessage( app, msg );
						
						// Pass window id down
						if( msg.windowId )
						{
							nmsg.windowId = msg.windowId;
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
							if( info.path )
							{
								info.path = msg.path;
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
			// ApplicationStorage ----------------------------------------------
			case 'applicationstorage':
				ApplicationStorage.receiveMsg( msg, app );
				break;
			// System calls!
			// TODO: Permissions, not all should be able to do this!
			case 'system':
				var app;
				if( msg.applicationId )
					app = findApplication( msg.applicationId );
				// TODO: Premissions!!!
				switch( msg.command )
				{
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
						m.execute( 'updateapppermissions', { application: msg.application, permissions: JSON.stringify( msg.permissions ) } );
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
						if( app && msg.windowId )
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
									if( nativeWindows[msg.windowId] = window.open( msg.url, msg.windowId, msg.specs ) )
										nmsg.response = 'ok';
									app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
									break;
								case 'close':
									nmsg.response = 'fail';
									if( nativeWindows[msg.windowId] )
									{
										nativeWindows[msg.windowId].close();
										// Clean house
										var nw = [];
										for( var a in nativeWindows )
										{
											if( a != msg.windowId )
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
					case 'refreshtheme':
						Workspace.refreshTheme( msg.theme, true );
						break;
					// Save application state
					case 'savestate':
						console.log( 'State saving: ', msg );
						var m = new Module( 'system' );
						m.onExecuted = function( e, d ) { } // <- callback or so?? probably not..
						m.execute( 'savestate', { state: msg.state, authId: msg.authId } );
						break;
					case 'quit':
						if( app ) app.quit( msg.force ? msg.force : false );
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
						nmsg.data = Workspace.listApplications();
						app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
						break;
					case 'refreshdocks':
						Workspace.reloadDocks();
						break;
					case 'refreshdoors':
						Workspace.refreshDesktop();
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
						j.addVar( 'sessionid', Workspace.sessionId );
						j.onload = function()
						{
							var nmsg = msg;
							nmsg.command = 'libraryresponse';
							console.log('onRESPONSELIB ' + msg );
							nmsg.data = this.responseText();
							app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							console.log('onRESPONSELIB onload' );
						}
						j.send();
						break;
					// File dialogs ----------------------------------------------------
					case 'filedialog':
						if( app.windows && app.windows[msg.windowId] )
						{
							var win = app.windows[msg.windowId];
							if( win )
							{
								var d = new Filedialog( win, function( data )
								{
									var nmsg = msg;
									nmsg.data = data;
									app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
								}, msg.path, msg.dialogType, msg.filename, msg.title );
							}
						}
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
		
		app.contentWindow.postMessage( JSON.stringify( msg ), '*' );
	}
}

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
			return _globalScreenSwap();
		}
		// Main screen
		else if( k == 78 && e.ctrlKey )
		{
			return _globalScreenSwap( 'DoorsScreen' );
		}
	}
	);	
}

// Global screen swap
function _globalScreenSwap( id )
{
	if( !id )
	{
		var s = window.currentScreen;
		var eles = s.getElementsByTagName( 'div' );
		for( var a = 0; a < eles.length; a++ )
		{
			if( eles[a].className == 'ScreenList' )
			{
				eles[a].click();
				return true;
			}
		}
	}
	else
	{
		// TODO
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
	if( msg.windowId )
		cw = app.windows[msg.windowId].iframe;
	if( cw.contentWindow )
		return cw.contentWindow;
	return false;
}

// Add Css by url
function AddCSSByUrl( csspath, callback )
{
	if( !window.cssStyles ) window.cssStyles = [];
	if( typeof( window.cssStyles[csspath] ) != 'undefined' )
	{
		// Remove existing and clean up
		document.body.removeChild( window.cssStyles[csspath] );
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
